import SwiftUI
import LernwerkCore

enum StageDates {
    private static let short: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "dd.MM."
        return f
    }()

    /// "09.11. bis 15.11." for a dated chapter, nil otherwise.
    static func range(_ chapter: Chapter) -> String? {
        guard let a = chapter.fromDate, let b = chapter.toDate else { return nil }
        return short.string(from: a) + " bis " + short.string(from: b)
    }
}

/// Top of a course with a dated plan: the stage of this week, one tap away.
struct WeekBanner: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var chapter: Chapter

    var body: some View {
        let next = chapter.lessons.first { $0.isReady && model.state.lessons[$0.id]?.isCompleted != true }
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Label("Diese Woche", systemImage: "calendar")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(course.tint)
                Spacer()
                if let range = StageDates.range(chapter) {
                    Text(range).font(.footnote.monospacedDigit()).foregroundStyle(.secondary)
                }
            }
            Text(chapter.title).font(.headline)
            if let next {
                Button {
                    model.start(course, next)
                } label: {
                    Label(next.title, systemImage: "play.fill")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(course.tint)
                .controlSize(.large)
            } else if chapter.lessons.allSatisfy({ !$0.isReady }) {
                Text("Die Lektion dieser Etappe kommt mit dem nächsten Inhaltsabgleich; das Training dazu läuft schon.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Label("Lektion dieser Woche geschafft", systemImage: "checkmark.seal.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.green)
            }
        }
        .card()
    }
}

/// Timed papers with the last estimated score.
struct PapersCard: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var papers: [Paper]
    @State private var confirm: Paper?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Papers auf Zeit", systemImage: "timer")
                .font(.title3.bold())
                .foregroundStyle(course.tint)
            Text("Wie im Test: Antworten A bis H, keine Rückmeldung bis zum Ende, kein Taschenrechner. Danach ein geschätzter Wert von 1 bis 9 und alle Lösungen.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(papers) { paper in
                Button {
                    confirm = paper
                } label: {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(paper.title).font(.body.weight(.semibold))
                            Text([paper.subtitle, "\(paper.count) Aufgaben, \(paper.minutes) Minuten"].compactMap { $0 }.joined(separator: " · "))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                        if let last = model.paperHistory(course, paper).first {
                            VStack(alignment: .trailing, spacing: 0) {
                                Text(String(format: "%.1f", TMUAScale.score(correct: last.correct, total: last.total)).replacingOccurrences(of: ".", with: ","))
                                    .font(.headline.monospacedDigit())
                                Text("\(last.correct)/\(last.total)").font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                        Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 6)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
            }
        }
        .card()
        .confirmationDialog(confirm.map { "\($0.title) starten?" } ?? "", isPresented: Binding(get: { confirm != nil }, set: { if !$0 { confirm = nil } }), titleVisibility: .visible) {
            if let paper = confirm {
                Button("Jetzt starten (\(paper.minutes) Minuten)") { model.startPaper(course, paper) }
                Button("Abbrechen", role: .cancel) {}
            }
        } message: {
            if let paper = confirm {
                Text("\(paper.count) Aufgaben in \(paper.minutes) Minuten, ohne Taschenrechner. Die Uhr läuft ab dem Start.")
            }
        }
    }
}

/// Wrong tasks of training and papers, asked again word for word until they sit.
struct MistakeLogCard: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let list = model.mistakes(in: course)
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Label("Fehlerprotokoll", systemImage: "list.bullet.clipboard")
                    .font(.title3.bold())
                    .foregroundStyle(course.tint)
                Spacer()
                Text(list.count == 1 ? "1 Aufgabe" : "\(list.count) Aufgaben")
                    .font(.footnote.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            if list.isEmpty {
                Text("Leer. Jede Aufgabe, die du im Training oder in einem Paper falsch löst, landet hier mit genau ihrem Wortlaut und kommt wieder, bis sie sitzt.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                ForEach(list.suffix(3).reversed()) { m in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.preview).font(.subheadline).lineLimit(2)
                        Text([m.topicTitle, m.retries > 0 ? "\(m.retries)-mal wiederholt" : nil].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                GlassEffectContainer(spacing: 10) {
                    HStack(spacing: 10) {
                        Button {
                            model.startMistakeRound(course)
                        } label: {
                            Label("Wiederholen", systemImage: "arrow.counterclockwise")
                                .font(.subheadline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glassProminent)
                        .tint(course.tint)
                        NavigationLink {
                            MistakeListView(course: course)
                        } label: {
                            Label("Alle", systemImage: "list.bullet")
                                .font(.subheadline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                    }
                    .controlSize(.large)
                }
            }
        }
        .card()
    }
}

struct MistakeListView: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let list = model.mistakes(in: course).sorted { $0.date > $1.date }
        List {
            Section {
                ForEach(list) { m in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(m.preview).font(.subheadline)
                        Text([m.topicTitle, m.date.formatted(date: .abbreviated, time: .omitted), m.retries > 0 ? "\(m.retries)-mal wiederholt" : nil].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .swipeActions {
                        Button(role: .destructive) {
                            model.removeMistake(m)
                        } label: {
                            Label("Entfernen", systemImage: "trash")
                        }
                    }
                }
            } footer: {
                Text("Richtig gelöst verschwindet eine Aufgabe von selbst. Wischen entfernt sie sofort.")
            }
        }
        .navigationTitle("Fehlerprotokoll")
        .toolbar {
            if !list.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        model.startMistakeRound(course)
                    } label: {
                        Label("Wiederholen", systemImage: "arrow.counterclockwise")
                    }
                }
            }
        }
    }
}
