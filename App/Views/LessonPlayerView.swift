import SwiftUI
import UIKit
import PencilKit
import LernwerkCore

struct PrimaryState: Equatable {
    var label = "Laden …"
    var enabled = false
    var style = "continue"
    var canGiveUp = false
    var giveUpLabel: String? = nil
}

/// What the column beside a lesson shows on the iPad.
enum PlayerColumn: Hashable {
    case pad, formulas
}

struct FinishedSheet: Identifiable {
    let id = UUID()
    var result: FinishedLesson
    var xp: Int
}

/// Full-screen lesson: the web runtime renders the steps, the Liquid Glass controls float above it.
struct LessonPlayerView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var sizeClass
    @AppStorage("reduceMotion") private var reduceMotion = false
    let session: LessonSession

    @State private var controller = LessonController()
    @StateObject private var speaker = Speaker()
    @State private var primary = PrimaryState()
    @State private var stepIndex = 0
    @State private var stepTotal = 1
    @State private var answered = false
    @State private var success = 0
    @State private var failure = 0
    @State private var tap = 0
    @State private var finished: FinishedSheet?
    @State private var showNote = false
    @State private var runtimeError: String?
    @State private var noteAfterFinish = false
    @State private var isFinished = false
    @State private var nextRound: Int?
    @State private var trainAfterFinish: PracticeTopic?
    @State private var reviewAfterFinish = false
    @State private var showPad = false
    @State private var column: PlayerColumn?
    @State private var showFormulaSheet = false
    @State private var vaultNote: VaultNoteTarget?
    @State private var wikiPath: String?
    @State private var drawing = PKDrawing()
    @State private var keyboardUp = false
    @Namespace private var glass

    private var accent: Color { Color(hex: session.accentHex) }
    /// iPad in full width: the scratch pad is a column beside the lesson. Otherwise a panel above the buttons.
    private var padAsColumn: Bool { sizeClass == .regular }
    private var padInline: Bool { showPad && !padAsColumn && !keyboardUp }
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }
    /// The course of the session has a formula book: the formula button and the formula column appear.
    private var hasFormulas: Bool { session.course.flatMap { model.formulaBook($0) } != nil }
    private var padOpen: Bool { padAsColumn ? column == .pad : showPad }
    private var formulasOpen: Bool { padAsColumn ? column == .formulas : showFormulaSheet }

    var body: some View {
        GeometryReader { geo in
            let padHeight = min(380, max(220, geo.size.height * 0.4))
            ZStack {
                TintBackground(tints: [accent, accent.opacity(0.6)])
                LessonWebView(locator: model.locator, controller: controller, startOptions: startOptions(geo), onMessage: handle)
                    .ignoresSafeArea()
            }
            .overlay(alignment: .top) { topBar.padding(.top, geo.safeAreaInsets.top > 0 ? 4 : 12) }
            .overlay(alignment: .bottom) {
                VStack(spacing: 10) {
                    if padInline {
                        ScratchPad(drawing: $drawing, systemTools: isPad) { showPad = false }
                            .frame(height: padHeight)
                            .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 26, style: .continuous))
                            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                            .shadow(color: .black.opacity(0.18), radius: 18, y: 6)
                            .padding(.horizontal, 12)
                            .transition(reduceMotion ? AnyTransition.opacity : AnyTransition.move(edge: .bottom).combined(with: .opacity))
                    }
                    bottomBar
                }
                .padding(.bottom, geo.safeAreaInsets.bottom > 0 ? 0 : 12)
                .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: padInline)
            }
            .onChange(of: padInline) { _, inline in
                // the page gets room below the last step, so nothing hides behind the pad
                let bottom = geo.safeAreaInsets.bottom + 96 + (inline ? padHeight + 10 : 0)
                controller.setInsets(top: geo.safeAreaInsets.top + 64, bottom: bottom)
                if inline { controller.revealCurrent() }
            }
        }
        .inspector(isPresented: Binding(get: { padAsColumn && column != nil }, set: { if !$0 { column = nil } })) {
            sideColumn
                .inspectorColumnWidth(min: 300, ideal: 380, max: 520)
        }
        .sheet(isPresented: $showFormulaSheet) {
            if let course = session.course {
                FormulaSheet(courses: [course], lessonID: session.lesson?.id, accentHex: session.accentHex)
                    .environment(model)
                    .presentationDetents([.medium, .large])
                    .presentationBackgroundInteraction(.enabled(upThrough: .medium))
            }
        }
        .sheet(item: $vaultNote) { target in
            VaultNoteSheet(path: target.path)
                .environment(model)
        }
        .task {
            if session.mode == .lesson, let course = session.course, let lesson = session.lesson {
                wikiPath = model.wikiNote(for: course, lesson)
            }
        }
        .sensoryFeedback(.success, trigger: success)
        .sensoryFeedback(.error, trigger: failure)
        .sensoryFeedback(.selection, trigger: tap)
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in keyboardUp = true }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in keyboardUp = false }
        .onDisappear { speaker.stop() }
        .sheet(isPresented: $showNote, onDismiss: { if isFinished { dismiss() } }) {
            if let course = session.course, let lesson = session.lesson {
                NoteEditor(course: course, lesson: lesson, meta: session.meta, stepID: session.meta?.stepIDs[safe: stepIndex], existing: model.notes(for: lesson.id).first)
                    .environment(model)
            }
        }
        .sheet(item: $finished, onDismiss: afterCompletion) { f in
            CompletionView(session: session, result: f.result, xp: f.xp, onNote: {
                noteAfterFinish = true
                finished = nil
            }, onRound: { level in
                nextRound = level
                finished = nil
            }, onTrain: { topic in
                trainAfterFinish = topic
                finished = nil
            }, onReview: {
                reviewAfterFinish = true
                finished = nil
            })
            .environment(model)
            .presentationDetents([.medium, .large])
        }
        .alert("Fehler in der Lektion", isPresented: Binding(get: { runtimeError != nil }, set: { if !$0 { runtimeError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(runtimeError ?? "")
        }
        .statusBarHidden(false)
    }

    private func afterCompletion() {
        if noteAfterFinish {
            noteAfterFinish = false
            showNote = true
        } else if let level = nextRound, let course = session.course, let topic = session.topic {
            nextRound = nil
            dismiss()
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 550_000_000)
                model.startPractice(course, topic, level: level)
            }
        } else if let topic = trainAfterFinish, let course = session.course {
            trainAfterFinish = nil
            dismiss()
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 550_000_000)
                model.startPractice(course, topic, level: model.examLevel(course, topic))
            }
        } else if reviewAfterFinish {
            // the evaluated exam stays open: every task with its solution, the table per topic on top
            reviewAfterFinish = false
        } else {
            dismiss()
        }
    }

    // MARK: chrome

    private var topBar: some View {
        GlassEffectContainer(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .controlSize(.large)
                .accessibilityLabel(session.mode == .exam ? "Klausur schließen" : "Lektion schließen")

                StepBars(index: stepIndex, total: stepTotal, answered: answered, tint: accent, animated: !reduceMotion)
                    .padding(.horizontal, 14)
                    .frame(height: 44)
                    .glassEffect(.regular, in: .capsule)
                    .accessibilityElement()
                    .accessibilityLabel("Schritt \(stepIndex + 1) von \(stepTotal)")

                HStack(spacing: 0) {
                    toolButton("pencil.and.scribble", label: padOpen ? "Notizblatt schließen" : "Notizblatt öffnen", active: padOpen) {
                        if padAsColumn { column = column == .pad ? nil : .pad } else { showPad.toggle() }
                    }
                    if hasFormulas {
                        toolButton("function", label: formulasOpen ? "Formeln schließen" : "Formeln zeigen", active: formulasOpen) {
                            if padAsColumn { column = column == .formulas ? nil : .formulas } else { showFormulaSheet = true }
                        }
                    }
                    toolButton(speaker.isSpeaking ? "stop.fill" : "speaker.wave.2.fill", label: speaker.isSpeaking ? "Vorlesen beenden" : "Schritt vorlesen", active: speaker.isSpeaking) {
                        toggleSpeech()
                    }
                    if session.mode == .lesson {
                        if padAsColumn || wikiPath == nil {
                            toolButton("square.and.pencil", label: "Notiz für den Vault schreiben", active: false) {
                                showNote = true
                            }
                        }
                        if let wikiPath {
                            if padAsColumn {
                                toolButton("book.closed", label: "Notiz im Vault lesen", active: false) {
                                    vaultNote = VaultNoteTarget(path: wikiPath)
                                }
                            } else {
                                // narrow screens: writing and reading the vault note share one button
                                Menu {
                                    Button {
                                        showNote = true
                                    } label: {
                                        Label("Notiz für den Vault schreiben", systemImage: "square.and.pencil")
                                    }
                                    Button {
                                        vaultNote = VaultNoteTarget(path: wikiPath)
                                    } label: {
                                        Label("Notiz im Vault lesen", systemImage: "book.closed")
                                    }
                                } label: {
                                    Image(systemName: "book.closed")
                                        .font(.body.weight(.semibold))
                                        .foregroundStyle(Color.primary)
                                        .frame(width: 40, height: 44)
                                        .contentShape(.rect)
                                }
                                .accessibilityLabel("Vault-Notiz")
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)
                .frame(height: 44)
                .glassEffect(.regular.interactive(), in: .capsule)
            }
        }
        .padding(.horizontal, 16)
    }

    /// iPad: notepad or formulas beside the lesson, switched with a segmented control.
    @ViewBuilder private var sideColumn: some View {
        VStack(spacing: 0) {
            if hasFormulas {
                Picker("Spalte", selection: Binding(get: { column ?? .pad }, set: { column = $0 })) {
                    Text("Notizblatt").tag(PlayerColumn.pad)
                    Text("Formeln").tag(PlayerColumn.formulas)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
            if column == .formulas, let course = session.course {
                FormulaPanel(courses: [course], lessonID: session.lesson?.id, accentHex: session.accentHex, topInset: 4)
            } else {
                ScratchPad(drawing: $drawing, systemTools: isPad) { column = nil }
            }
        }
    }

    private func toolButton(_ symbol: String, label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button {
            tap += 1
            action()
        } label: {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .foregroundStyle(active ? accent : Color.primary)
                .frame(width: 40, height: 44)
                .contentShape(.rect)
                .contentTransition(.symbolEffect(.replace))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private func toggleSpeech() {
        if speaker.isSpeaking {
            speaker.stop()
            return
        }
        controller.speech { text in
            if text.isEmpty {
                runtimeError = "Diese Inhaltsversion kann noch nicht vorlesen. Nach dem nächsten Abgleich der Inhalte geht es."
            } else {
                speaker.speak(text)
            }
        }
    }

    private var bottomBar: some View {
        GlassEffectContainer(spacing: 10) {
            HStack(spacing: 10) {
                if primary.canGiveUp && primary.style == "check" {
                    Button {
                        tap += 1
                        controller.giveUp()
                    } label: {
                        Text(primary.giveUpLabel ?? "Lösung")
                            .font(.headline)
                            .padding(.horizontal, 6)
                    }
                    .buttonStyle(.glass)
                    .controlSize(.extraLarge)
                    .glassEffectID("giveup", in: glass)
                    .transition(.blurReplace)
                }
                Button {
                    tap += 1
                    if isFinished { dismiss() } else { controller.primary() }
                } label: {
                    Text(primary.label)
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .contentTransition(.opacity)
                }
                .buttonStyle(.glassProminent)
                .tint(primary.style == "finish" ? Color.green : accent)
                .controlSize(.extraLarge)
                .disabled(!primary.enabled)
                .glassEffectID("primary", in: glass)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 6)
        .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: primary)
    }

    // MARK: runtime

    private func startOptions(_ geo: GeometryProxy) -> [String: Any] {
        let top = geo.safeAreaInsets.top + 64
        let bottom = geo.safeAreaInsets.bottom + 96
        var options: [String: Any] = [
            "theme": ["accent": session.accentHex, "fontScale": UIFontMetrics.default.scaledValue(for: 17) / 17, "reduceMotion": reduceMotion] as [String: Any],
            "insets": ["top": top, "bottom": bottom],
            "seed": session.seed,
            "formulaUrls": model.formulaURLs,
            "logMistakes": session.logMistakes,
        ]
        switch session.mode {
        case .lesson:
            guard let course = session.course, let lesson = session.lesson else { return options }
            options["mode"] = "lesson"
            options["lessonUrl"] = model.lessonURL(course, lesson.id)
            options["kicker"] = course.title
            options["resumeAt"] = session.resumeAt
        case .review:
            options["mode"] = "review"
            options["title"] = "Heute fällig"
            options["items"] = session.reviewItems.map(\.json)
            if session.mistakeRound { options["title"] = "Fehler von früher" }
        case .practice:
            guard let course = session.course, let topic = session.topic else { return options }
            options["mode"] = "practice"
            options["practice"] = [
                "title": topic.title, "kicker": course.title, "topicId": topic.id, "courseId": course.id,
                "gens": topic.gens, "level": session.level, "count": topic.count ?? 6,
            ] as [String: Any]
        case .exam:
            guard let course = session.course else { return options }
            options["mode"] = "exam"
            var exam: [String: Any] = [
                "title": session.title, "kicker": course.title, "courseId": course.id,
                "minutes": session.minutes, "count": session.taskCount, "gens": session.picks.map(\.json),
            ]
            if let chapter = session.chapterId { exam["chapterId"] = chapter }
            if let format = session.format {
                exam["format"] = format
                exam["kicker"] = course.title + " · ohne Taschenrechner"
            }
            options["exam"] = exam
        case .mix:
            options["mode"] = "mix"
            options["mix"] = [
                "title": "Heute gemischt",
                "items": session.reviewItems.map(\.json),
                "gens": session.picks.map(\.json),
            ] as [String: Any]
        }
        return options
    }

    private func handle(_ message: RuntimeMessage) {
        switch message {
        case .primary(let label, let enabled, let style, let canGiveUp, let giveUpLabel):
            // after the end the button only closes the player
            if isFinished { return }
            primary = PrimaryState(label: label, enabled: enabled, style: style, canGiveUp: canGiveUp, giveUpLabel: giveUpLabel)
        case .progress(let index, let total, let isAnswered):
            if index != stepIndex { speaker.stop() }
            stepIndex = index
            stepTotal = max(1, total)
            answered = isAnswered
            model.noteProgress(session, step: index)
        case .feedback(let correct, let selfCheck, let invalid):
            if invalid { return }
            if correct { success += 1 } else if !selfCheck { failure += 1 }
        case .finished(let result):
            let xp = model.finish(session, result: result)
            isFinished = true
            success += 1
            speaker.stop()
            primary = PrimaryState(label: "Schließen", enabled: true, style: "finish")
            finished = FinishedSheet(result: result, xp: xp)
        case .error(let text):
            runtimeError = text
        default:
            break
        }
    }
}

/// Segmented progress like the step dots in Brilliant, drawn inside a glass capsule.
struct StepBars: View {
    var index: Int
    var total: Int
    var answered: Bool
    var tint: Color
    var animated = true

    var body: some View {
        GeometryReader { geo in
            let count = max(1, total)
            let gap: CGFloat = count > 16 ? 2 : 4
            let width = max(2, (geo.size.width - gap * CGFloat(count - 1)) / CGFloat(count))
            HStack(spacing: gap) {
                ForEach(0..<count, id: \.self) { i in
                    Capsule()
                        .fill(i < index || (i == index && answered) ? tint : Color.primary.opacity(i == index ? 0.32 : 0.14))
                        .frame(width: width, height: 6)
                }
            }
            .frame(maxHeight: .infinity)
            .animation(animated ? .smooth(duration: 0.35) : nil, value: index)
        }
    }
}

/// Shown when the runtime reports the end of a lesson, review, training round, exam or daily mix.
struct CompletionView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let session: LessonSession
    let result: FinishedLesson
    let xp: Int
    var onNote: () -> Void
    var onRound: (Int) -> Void = { _ in }
    var onTrain: (PracticeTopic) -> Void = { _ in }
    var onReview: () -> Void = {}

    private var level: Level { Level(session.level) }
    private var accent: Color { session.mode == .practice ? level.colors[1] : Color(hex: session.accentHex) }
    private var correct: Int {
        session.mode == .exam ? result.results.filter(\.correct).count : result.results.filter { $0.quality >= 4 }.count
    }
    private var passed: Bool { result.score >= 0.8 }

    /// The topic of the exam with the lowest share of correct answers, when it is below 60 percent.
    private var weakestTopic: (topic: PracticeTopic, ok: Int, total: Int)? {
        guard session.mode == .exam, let course = session.course else { return nil }
        var tally: [String: (ok: Int, total: Int)] = [:]
        for r in result.results {
            guard let id = r.topicId else { continue }
            var t = tally[id] ?? (ok: 0, total: 0)
            t.total += 1
            if r.correct { t.ok += 1 }
            tally[id] = t
        }
        let worst = tally.filter { Double($0.value.ok) / Double(max(1, $0.value.total)) < 0.6 }
            .min { a, b in
                let sa = Double(a.value.ok) / Double(a.value.total), sb = Double(b.value.ok) / Double(b.value.total)
                return sa != sb ? sa < sb : a.value.total > b.value.total
            }
        guard let worst, let topic = course.practiceTopics.first(where: { $0.id == worst.key }) else { return nil }
        return (topic: topic, ok: worst.value.ok, total: worst.value.total)
    }

    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                if session.mode == .practice {
                    Circle().stroke(Color.primary.opacity(0.1), lineWidth: 12)
                    Circle()
                        .trim(from: 0, to: min(1, max(0.001, result.score)))
                        .stroke(level.gradient, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                } else {
                    GoalRing(value: result.score, tint: accent, lineWidth: 12)
                }
                VStack(spacing: 2) {
                    Text("\(Int((result.score * 100).rounded())) %")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .contentTransition(.numericText())
                    Text(session.mode == .exam ? "richtig" : "beim ersten Versuch")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 150, height: 150)
            .padding(.top, 26)

            VStack(spacing: 8) {
                if session.mode == .practice { LevelBadge(level: level) }
                Text(title)
                    .font(.title2.bold())
                Text(summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            HStack(spacing: 12) {
                StatPill(value: "+\(xp)", label: "Punkte", symbol: "bolt.fill", tint: accent)
                StatPill(value: "\(model.streak)", label: model.streak == 1 ? "Tag in Folge" : "Tage in Folge", symbol: "flame.fill", tint: .orange)
            }

            Spacer(minLength: 0)

            GlassEffectContainer(spacing: 10) {
                VStack(spacing: 10) {
                    if session.mode == .lesson {
                        Button {
                            onNote()
                        } label: {
                            Label("Notiz für den Vault", systemImage: "square.and.pencil")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                        .controlSize(.large)
                    }
                    if session.mode == .practice {
                        HStack(spacing: 10) {
                            Button {
                                onRound(session.level)
                            } label: {
                                Label("Noch eine Runde", systemImage: "arrow.clockwise")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.glass)
                            .controlSize(.large)
                            if passed && session.level < 4 {
                                Button {
                                    onRound(session.level + 1)
                                } label: {
                                    Label(Level(session.level + 1).name, systemImage: "arrow.up.right")
                                        .font(.headline)
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.glassProminent)
                                .tint(Level(session.level + 1).colors[1])
                                .controlSize(.large)
                            }
                        }
                    }
                    if session.mode == .exam {
                        HStack(spacing: 10) {
                            Button {
                                onReview()
                            } label: {
                                Label("Lösungen ansehen", systemImage: "doc.text.magnifyingglass")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.glass)
                            .controlSize(.large)
                            if let weak = weakestTopic {
                                Button {
                                    onTrain(weak.topic)
                                } label: {
                                    Label("\(weak.topic.title) üben", systemImage: "dumbbell")
                                        .font(.headline)
                                        .lineLimit(1)
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.glass)
                                .controlSize(.large)
                                .accessibilityHint("\(weak.ok) von \(weak.total) richtig in der Klausur")
                            }
                        }
                    }
                    Button {
                        dismiss()
                    } label: {
                        Text("Fertig").font(.headline).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(accent)
                    .controlSize(.large)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 12)
        }
        .padding(.horizontal)
    }

    private var title: String {
        switch session.mode {
        case .review: return "Wiederholung geschafft"
        case .practice: return passed ? "Stufe sitzt" : "Runde geschafft"
        case .lesson: return "Lektion geschafft"
        case .exam: return session.format == "tmua" ? "Paper ausgewertet" : (passed ? "Klausur sitzt" : "Klausur ausgewertet")
        case .mix: return "Tagesmix geschafft"
        }
    }

    private var summary: String {
        let n = result.results.count
        if n == 0 { return "Weiter so." }
        switch session.mode {
        case .practice:
            if passed && session.level < 4 { return "\(correct) von \(n) Aufgaben sofort gelöst. Bereit für \(Level(session.level + 1).name)." }
            if passed { return "\(correct) von \(n) Aufgaben sofort gelöst, auf der höchsten Stufe." }
            return "\(correct) von \(n) Aufgaben sofort gelöst. Ab 80 Prozent gilt eine Stufe als geschafft, jede Runde bringt neue Aufgaben."
        case .exam:
            let time = result.exam?.timeUp == true ? "Die Zeit war abgelaufen. " : ""
            if session.format == "tmua" {
                let score = String(format: "%.1f", TMUAScale.score(correct: correct, total: n)).replacingOccurrences(of: ".", with: ",")
                return "\(time)\(correct) von \(n) richtig, geschätzter TMUA-Wert \(score). Falsche Aufgaben stehen im Fehlerprotokoll."
            }
            if let weak = weakestTopic {
                return "\(time)\(correct) von \(n) Aufgaben richtig. Am meisten Übung braucht \(weak.topic.title) (\(weak.ok) von \(weak.total))."
            }
            return "\(time)\(correct) von \(n) Aufgaben richtig. Unter den Aufgaben stehen alle Lösungen."
        case .mix:
            return "\(correct) von \(n) Aufgaben sofort gelöst. Die Wiederholungen sind neu eingeplant, die neuen Aufgaben zählen für dein Training."
        case .lesson, .review:
            return "\(correct) von \(n) Aufgaben sicher gelöst. Die übrigen kommen bald in der Wiederholung."
        }
    }
}

struct StatPill: View {
    var value: String
    var label: String
    var symbol: String
    var tint: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: symbol).foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 0) {
                Text(value).font(.headline.monospacedDigit())
                Text(label).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.thinMaterial, in: .capsule)
    }
}

extension Array {
    subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}
