import SwiftUI
import UIKit
import LernwerkCore

struct PrimaryState: Equatable {
    var label = "Laden …"
    var enabled = false
    var style = "continue"
    var canGiveUp = false
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
    let session: LessonSession

    @State private var controller = LessonController()
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
    @Namespace private var glass

    private var accent: Color { Color(hex: session.accentHex) }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                TintBackground(tints: [accent, accent.opacity(0.6)])
                LessonWebView(locator: model.locator, controller: controller, startOptions: startOptions(geo), onMessage: handle)
                    .ignoresSafeArea()
            }
            .overlay(alignment: .top) { topBar.padding(.top, geo.safeAreaInsets.top > 0 ? 4 : 12) }
            .overlay(alignment: .bottom) { bottomBar.padding(.bottom, geo.safeAreaInsets.bottom > 0 ? 0 : 12) }
        }
        .sensoryFeedback(.success, trigger: success)
        .sensoryFeedback(.error, trigger: failure)
        .sensoryFeedback(.selection, trigger: tap)
        .sheet(isPresented: $showNote, onDismiss: { if isFinished { dismiss() } }) {
            if let course = session.course, let lesson = session.lesson {
                NoteEditor(course: course, lesson: lesson, meta: session.meta, stepID: session.meta?.stepIDs[safe: stepIndex], existing: model.notes(for: lesson.id).first)
                    .environment(model)
            }
        }
        .sheet(item: $finished, onDismiss: {
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
            } else {
                dismiss()
            }
        }) { f in
            CompletionView(session: session, result: f.result, xp: f.xp, onNote: {
                noteAfterFinish = true
                finished = nil
            }, onRound: { level in
                nextRound = level
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
                .accessibilityLabel("Lektion schließen")

                StepBars(index: stepIndex, total: stepTotal, answered: answered, tint: accent)
                    .padding(.horizontal, 14)
                    .frame(height: 44)
                    .glassEffect(.regular, in: .capsule)
                    .accessibilityElement()
                    .accessibilityLabel("Schritt \(stepIndex + 1) von \(stepTotal)")

                if session.mode == .lesson {
                    Button {
                        showNote = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                            .font(.body.weight(.semibold))
                            .frame(width: 22, height: 22)
                    }
                    .buttonStyle(.glass)
                    .buttonBorderShape(.circle)
                    .controlSize(.large)
                    .accessibilityLabel("Notiz schreiben")
                }
            }
        }
        .padding(.horizontal, 16)
    }

    private var bottomBar: some View {
        GlassEffectContainer(spacing: 10) {
            HStack(spacing: 10) {
                if primary.canGiveUp && primary.style == "check" {
                    Button {
                        tap += 1
                        controller.giveUp()
                    } label: {
                        Text("Lösung")
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
                    controller.primary()
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
        .animation(.smooth(duration: 0.3), value: primary)
    }

    // MARK: runtime

    private func startOptions(_ geo: GeometryProxy) -> [String: Any] {
        let top = geo.safeAreaInsets.top + 64
        let bottom = geo.safeAreaInsets.bottom + 96
        var options: [String: Any] = [
            "theme": ["accent": session.accentHex, "fontScale": UIFontMetrics.default.scaledValue(for: 17) / 17],
            "insets": ["top": top, "bottom": bottom],
            "seed": session.seed,
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
            options["items"] = session.reviewItems.map { ["lessonUrl": $0.lessonUrl, "stepId": $0.stepId] }
        case .practice:
            guard let course = session.course, let topic = session.topic else { return options }
            options["mode"] = "practice"
            options["practice"] = [
                "title": topic.title, "kicker": course.title, "topicId": topic.id, "courseId": course.id,
                "gens": topic.gens, "level": session.level, "count": topic.count ?? 6,
            ] as [String: Any]
        }
        return options
    }

    private func handle(_ message: RuntimeMessage) {
        switch message {
        case .primary(let label, let enabled, let style, let canGiveUp):
            primary = PrimaryState(label: label, enabled: enabled, style: style, canGiveUp: canGiveUp)
        case .progress(let index, let total, let isAnswered):
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
            .animation(.smooth(duration: 0.35), value: index)
        }
    }
}

/// Shown when the runtime reports the end of a lesson or review.
struct CompletionView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let session: LessonSession
    let result: FinishedLesson
    let xp: Int
    var onNote: () -> Void
    var onRound: (Int) -> Void = { _ in }

    private var level: Level { Level(session.level) }
    private var accent: Color { session.mode == .practice ? level.colors[1] : Color(hex: session.accentHex) }
    private var correct: Int { result.results.filter { $0.quality >= 4 }.count }
    private var passed: Bool { result.score >= 0.8 }

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
                    Text("beim ersten Versuch")
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
        }
    }

    private var summary: String {
        let n = result.results.count
        if n == 0 { return "Weiter so." }
        if session.mode == .practice {
            if passed && session.level < 4 { return "\(correct) von \(n) Aufgaben sofort gelöst. Bereit für \(Level(session.level + 1).name)." }
            if passed { return "\(correct) von \(n) Aufgaben sofort gelöst, auf der höchsten Stufe." }
            return "\(correct) von \(n) Aufgaben sofort gelöst. Ab 80 Prozent gilt eine Stufe als geschafft, jede Runde bringt neue Aufgaben."
        }
        return "\(correct) von \(n) Aufgaben sicher gelöst. Die übrigen kommen bald in der Wiederholung."
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
