import SwiftUI
import LernwerkCore

/// What the note editor opens: an existing note or a new one for a lesson.
struct NoteTarget: Identifiable {
    let id = UUID()
    var course: Course
    var lesson: LessonRef
    var note: LearnNote?
}

/// The notes written in lessons, now a section of the Vault tab.
struct LearnNotesView: View {
    @Environment(AppModel.self) private var model
    @State private var editing: NoteTarget?
    @State private var showSettings = false

    private struct NoteGroup: Identifiable {
        var course: Course?
        var notes: [LearnNote]
        var id: String { course?.id ?? "_" }
    }

    private var groups: [NoteGroup] {
        var result: [NoteGroup] = model.courses.compactMap { c in
            let notes = model.state.notes.filter { $0.courseId == c.id }.sorted { $0.updatedAt > $1.updatedAt }
            return notes.isEmpty ? nil : NoteGroup(course: c, notes: notes)
        }
        let known = Set(model.courses.map(\.id))
        let orphans = model.state.notes.filter { !known.contains($0.courseId) }
        if !orphans.isEmpty { result.append(NoteGroup(course: nil, notes: orphans)) }
        return result
    }

    var body: some View {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VaultStatusCard(showSettings: $showSettings)
                    if model.state.notes.isEmpty {
                        ContentUnavailableView {
                            Label("Noch keine Notizen", systemImage: "note.text")
                        } description: {
                            Text("In jeder Lektion führt der Stift oben rechts zu einer Notiz. Sie landet in der passenden Notiz deines Vaults unter „Eigene Notizen“.")
                        }
                        .padding(.top, 24)
                    }
                    ForEach(groups) { group in
                        SectionTitle(title: group.course?.title ?? "Ohne Kurs", trailing: "\(group.notes.count)")
                        VStack(spacing: 10) {
                            ForEach(group.notes) { note in
                                Button {
                                    open(note, in: group.course)
                                } label: {
                                    NoteRow(note: note)
                                }
                                .buttonStyle(PressableStyle())
                                .contextMenu {
                                    Button(role: .destructive) {
                                        withAnimation { model.deleteNote(note) }
                                    } label: {
                                        Label("Löschen", systemImage: "trash")
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .background { TintBackground(tints: [.indigo, .teal]) }
            .navigationTitle("Lernnotizen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        ForEach(model.courses) { course in
                            Menu(course.title) {
                                ForEach(course.readyLessons) { lesson in
                                    Button(lesson.title) {
                                        editing = NoteTarget(course: course, lesson: lesson, note: model.notes(for: lesson.id).first)
                                    }
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .accessibilityLabel("Neue Notiz")
                }
            }
            .refreshable { await model.pushNotes() }
            .sheet(item: $editing) { target in
                NoteEditor(course: target.course, lesson: target.lesson, meta: model.meta(target.course, target.lesson),
                           stepID: target.note?.stepId, existing: target.note)
                    .environment(model)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView().environment(model)
            }
    }

    private func open(_ note: LearnNote, in course: Course?) {
        guard let course else { return }
        let lesson = course.lessons.first { $0.id == note.lessonId } ?? LessonRef(id: note.lessonId, title: note.lessonTitle)
        editing = NoteTarget(course: course, lesson: lesson, note: note)
    }
}

/// Connection state of the vault bridge, with the one action that helps right now.
struct VaultStatusCard: View {
    @Environment(AppModel.self) private var model
    @Binding var showSettings: Bool
    @State private var checking = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(tint.gradient, in: .rect(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline)
                    Text(detail).font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            if let error = model.state.lastSyncError, model.notesWaiting > 0 {
                Text(error).font(.caption).foregroundStyle(.red)
            }
            if let action {
                Button {
                    run(action)
                } label: {
                    HStack {
                        Text(action.label).font(.subheadline.weight(.semibold))
                        if checking { ProgressView().controlSize(.small) }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(tint)
                .disabled(checking)
            }
        }
        .card()
    }

    private enum Action {
        case setup, send, recheck
        var label: String {
            switch self {
            case .setup: return "Vault verbinden"
            case .send: return "Jetzt senden"
            case .recheck: return "Erneut prüfen"
            }
        }
    }

    private var action: Action? {
        if !model.vaultLooksConnected { return .setup }
        if model.isDemo { return nil }
        if !model.bridgeReady { return .recheck }
        return model.notesWaiting > 0 ? .send : nil
    }

    private var symbol: String {
        if !model.vaultLooksConnected { return "link.badge.plus" }
        if !model.bridgeReady { return "hourglass" }
        return model.notesWaiting > 0 ? "arrow.up.circle" : "checkmark"
    }

    private var tint: Color {
        if !model.vaultLooksConnected { return .accentColor }
        if !model.bridgeReady { return .orange }
        return model.notesWaiting > 0 ? .blue : .green
    }

    private var title: String {
        if !model.vaultLooksConnected { return "Mit dem Vault verbinden" }
        if !model.bridgeReady { return "Tagwerk Bridge 1.3 nötig" }
        if model.notesWaiting > 0 { return model.notesWaiting == 1 ? "1 Änderung wartet" : "\(model.notesWaiting) Änderungen warten" }
        return "Alles im Vault"
    }

    private var detail: String {
        if !model.vaultLooksConnected {
            return "Notizen gehen über die Tagwerk Bridge in deinen Obsidian-Vault. Du brauchst dieselben Angaben wie in Tagwerk."
        }
        if !model.bridgeReady {
            return "Das Plugin in Obsidian nimmt Lernnotizen ab Version 1.3 an. Bis dahin bleiben sie hier und gehen danach von selbst raus."
        }
        if model.notesWaiting > 0 {
            return "Sie gehen raus, sobald das iPhone online ist. Obsidian übernimmt sie beim nächsten Abgleich."
        }
        return "Zuletzt gesendet \(Format.relative(model.state.lastPush)). Obsidian schreibt sie unter „Eigene Notizen“ in die passende Notiz."
    }

    private func run(_ action: Action) {
        switch action {
        case .setup:
            showSettings = true
        case .send:
            checking = true
            Task {
                await model.pushNotes()
                checking = false
            }
        case .recheck:
            checking = true
            Task {
                model.toast = await model.testVault()
                checking = false
            }
        }
    }
}

struct NoteRow: View {
    @Environment(AppModel.self) private var model
    var note: LearnNote

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(note.lessonTitle)
                    .font(.headline)
                    .lineLimit(1)
                Spacer(minLength: 8)
                NoteStatusLabel(note: note)
            }
            Text(excerpt)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
            HStack(spacing: 6) {
                Image(systemName: "doc.text")
                Text(note.vaultTitle).lineLimit(1)
                Spacer(minLength: 8)
                Text(note.updatedAt.formatted(.dateTime.day().month(.abbreviated).locale(germanLocale)))
            }
            .font(.caption)
            .foregroundStyle(.tertiary)
        }
        .foregroundStyle(.primary)
        .card(padding: 14, radius: 22)
    }

    /// The note as one line of plain text: callout markers and line breaks removed.
    private var excerpt: String {
        note.text
            .split(separator: "\n", omittingEmptySubsequences: true)
            .map { line -> String in
                var s = String(line).trimmingCharacters(in: .whitespaces)
                while s.hasPrefix(">") { s = String(s.dropFirst()).trimmingCharacters(in: .whitespaces) }
                if s.hasPrefix("[!"), let close = s.firstIndex(of: "]") {
                    s = String(s[s.index(after: close)...]).trimmingCharacters(in: CharacterSet(charactersIn: "+- "))
                    if !s.isEmpty { s += ":" }
                }
                return s
            }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }
}

struct NoteStatusLabel: View {
    @Environment(AppModel.self) private var model
    var note: LearnNote

    var body: some View {
        let s = state
        Label(s.text, systemImage: s.symbol)
            .font(.caption.weight(.semibold))
            .foregroundStyle(s.tint)
            .labelStyle(.titleAndIcon)
    }

    private var state: (text: String, symbol: String, tint: Color) {
        if note.isSent { return ("Im Vault", "checkmark.circle.fill", .green) }
        if !model.vaultLooksConnected { return ("Nur hier", "iphone", .secondary) }
        if !model.bridgeReady { return ("Wartet auf Plugin", "hourglass", .orange) }
        return ("Wird gesendet", "arrow.up.circle", .blue)
    }
}

/// Writes or edits the learner's own note for a lesson. The text becomes one managed block under
/// "## Eigene Notizen" in the vault note the lesson belongs to.
struct NoteEditor: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let course: Course
    let lesson: LessonRef
    let meta: LessonMeta?
    let stepID: String?
    let existing: LearnNote?

    @State private var text: String
    @State private var confirmDelete = false
    @FocusState private var focused: Bool

    init(course: Course, lesson: LessonRef, meta: LessonMeta?, stepID: String?, existing: LearnNote?) {
        self.course = course
        self.lesson = lesson
        self.meta = meta
        self.stepID = stepID
        self.existing = existing
        _text = State(initialValue: existing?.text ?? "")
    }

    private struct Snippet: Identifiable {
        var label: String
        var text: String
        var id: String { label }
    }

    /// Building blocks in the callout style the vault uses.
    private static let snippets: [Snippet] = [
        Snippet(label: "Kernaussage", text: "> [!important] Kernaussage\n> "),
        Snippet(label: "Stolperstelle", text: "> [!warning] Stolperstelle\n> "),
        Snippet(label: "Offene Frage", text: "> [!question] Offene Frage\n> "),
        Snippet(label: "Beispiel", text: "> [!example] Beispiel\n> "),
        Snippet(label: "Formel", text: "$$\n\n$$"),
    ]

    private var changed: Bool {
        text.trimmingCharacters(in: .whitespacesAndNewlines) != (existing?.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        let target = existing.map { VaultLink(path: $0.vaultPath, title: $0.vaultTitle) } ?? model.vaultTarget(course: course, lesson: lesson, meta: meta)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        CourseBadge(course: course, size: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lesson.title).font(.headline)
                            Text(course.title).font(.footnote).foregroundStyle(.secondary)
                        }
                    }

                    ZStack(alignment: .topLeading) {
                        TextEditor(text: $text)
                            .focused($focused)
                            .scrollContentBackground(.hidden)
                            .font(.body)
                            .frame(minHeight: 240)
                            .padding(10)
                        if text.isEmpty {
                            Text("Was hast du verstanden, was ist noch offen? Formeln schreibst du wie in Obsidian, etwa $x^2$.")
                                .foregroundStyle(.tertiary)
                                .padding(.horizontal, 15)
                                .padding(.vertical, 18)
                                .allowsHitTesting(false)
                        }
                    }
                    .background(.regularMaterial, in: .rect(cornerRadius: 20, style: .continuous))

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Self.snippets) { snippet in
                                Button(snippet.label) { insert(snippet.text) }
                                    .buttonStyle(.bordered)
                                    .buttonBorderShape(.capsule)
                                    .controlSize(.small)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Label("Ziel im Vault", systemImage: "tray.and.arrow.down")
                            .font(.footnote.weight(.semibold))
                        Text(target.path)
                            .font(.footnote.monospaced())
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                        Text("Abschnitt „\(LearnBridge.heading)“. Änderungen ersetzen nur diesen Eintrag, der Rest der Notiz bleibt, wie er ist. Gibt es die Notiz noch nicht, legt das Plugin sie mit passendem Frontmatter an.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .card(padding: 14, radius: 20)

                    if let existing {
                        HStack {
                            NoteStatusLabel(note: existing)
                            Spacer()
                            Button("Notiz löschen", role: .destructive) { confirmDelete = true }
                                .font(.subheadline)
                        }
                        .padding(.horizontal, 4)
                    }
                }
                .padding()
                .readableColumn(680)
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(existing == nil ? "Neue Notiz" : "Notiz bearbeiten")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Sichern") { save() }
                        .disabled(!changed || (existing == nil && text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty))
                }
            }
            .confirmationDialog("Notiz löschen?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Löschen", role: .destructive) {
                    if let existing { model.deleteNote(existing) }
                    dismiss()
                }
            } message: {
                Text(existing?.isSent == true ? "Der Eintrag verschwindet auch aus der Vault-Notiz." : "Die Notiz war noch nicht im Vault.")
            }
            .onAppear { if existing == nil { focused = true } }
        }
        .interactiveDismissDisabled(changed)
    }

    private func insert(_ snippet: String) {
        if !text.isEmpty && !text.hasSuffix("\n\n") { text += text.hasSuffix("\n") ? "\n" : "\n\n" }
        text += snippet
        focused = true
    }

    private func save() {
        model.saveNote(course: course, lesson: lesson, meta: meta, stepID: stepID ?? existing?.stepId, text: text, existing: existing)
        if existing != nil && text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            model.toast = "Notiz geleert"
        } else {
            model.toast = model.vaultLooksConnected ? "Notiz gesichert, geht an den Vault" : "Notiz gesichert"
        }
        dismiss()
    }
}
