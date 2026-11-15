import SwiftUI
import LernwerkCore

/// The vault note of a lesson, written while the lesson stays in view: on the iPhone a panel above the buttons,
/// on the iPad the column beside the lesson. "Frage übernehmen" copies the current step with its formulas.
struct LessonNotePanel: View {
    @Environment(AppModel.self) private var model
    let course: Course
    let lesson: LessonRef
    let meta: LessonMeta?
    let stepID: String?
    /// Delivers the current step as Markdown (empty with an older runtime).
    let question: (@escaping (String) -> Void) -> Void
    let onClose: () -> Void

    @State private var text = ""
    @State private var started = false
    @FocusState private var focused: Bool

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
        Snippet(label: "Formel", text: "$$\n\n$$"),
    ]

    private var existing: LearnNote? { model.notes(for: lesson.id).first }

    private var changed: Bool {
        text.trimmingCharacters(in: .whitespacesAndNewlines) != (existing?.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Text("Notiz für den Vault")
                    .font(.headline)
                    .lineLimit(1)
                Spacer(minLength: 4)
                Button("Sichern") { save() }
                    .buttonStyle(.glassProminent)
                    .disabled(!changed || (existing == nil && text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty))
                Button {
                    close()
                } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .accessibilityLabel("Notiz schließen")
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 8)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Button {
                        takeQuestion()
                    } label: {
                        Label("Frage übernehmen", systemImage: "text.quote")
                    }
                    ForEach(Self.snippets) { snippet in
                        Button(snippet.label) { insert(snippet.text) }
                    }
                }
                .buttonStyle(.bordered)
                .buttonBorderShape(.capsule)
                .controlSize(.small)
                .padding(.horizontal, 14)
            }
            .padding(.bottom, 8)

            Divider()

            ZStack(alignment: .topLeading) {
                TextEditor(text: $text)
                    .focused($focused)
                    .scrollContentBackground(.hidden)
                    .font(.body)
                    .padding(.horizontal, 10)
                if text.isEmpty {
                    Text("Was hast du verstanden, was ist noch offen? Formeln schreibst du wie in Obsidian, etwa $x^2$.")
                        .foregroundStyle(.tertiary)
                        .padding(.horizontal, 15)
                        .padding(.vertical, 8)
                        .allowsHitTesting(false)
                }
            }
        }
        .onAppear {
            guard !started else { return }
            started = true
            text = existing?.text ?? ""
        }
    }

    private func insert(_ snippet: String) {
        if !text.isEmpty && !text.hasSuffix("\n\n") { text += text.hasSuffix("\n") ? "\n" : "\n\n" }
        text += snippet
    }

    /// The current step as a question callout, so the note says what it is about.
    private func takeQuestion() {
        question { markdown in
            let body = markdown.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !body.isEmpty else {
                model.toast = "Diese Inhaltsversion kann die Frage noch nicht übergeben."
                return
            }
            let quoted = body.components(separatedBy: "\n").map { $0.isEmpty ? ">" : "> " + $0 }.joined(separator: "\n")
            insert("> [!question] Frage\n" + quoted + "\n\n")
        }
    }

    private func save() {
        model.saveNote(course: course, lesson: lesson, meta: meta, stepID: stepID ?? existing?.stepId, text: text, existing: existing)
        if existing != nil && text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            model.toast = "Notiz geleert"
        } else {
            model.toast = model.vaultLooksConnected ? "Notiz gesichert, geht an den Vault" : "Notiz gesichert"
        }
        focused = false
    }

    /// Closing keeps what was written: unsaved text is saved first.
    private func close() {
        if changed && !(existing == nil && text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) {
            save()
        }
        focused = false
        onClose()
    }
}
