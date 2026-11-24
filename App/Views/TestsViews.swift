import SwiftUI
import LernwerkCore

/// Üben tab: the admission tests (TMUA, TARA), each with its round at test pace, papers, raw scores and mistake log.
struct TestsSection: View {
    @Environment(AppModel.self) private var model
    @Binding var examTarget: ExamTarget?

    var body: some View {
        let tests = model.testCourses
        if !tests.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Aufnahmetests", trailing: countdown(tests))
                ForEach(tests) { course in
                    TestCard(course: course, examTarget: $examTarget)
                }
            }
        }
    }

    /// Time to the first planned test window.
    private func countdown(_ tests: [Course]) -> String? {
        guard let day = tests.compactMap(\.testDay).min() else { return nil }
        let cal = Calendar.current
        let days = cal.dateComponents([.day], from: cal.startOfDay(for: Date()), to: cal.startOfDay(for: day)).day ?? 0
        if days < 0 { return nil }
        if days == 0 { return "Testfenster heute" }
        if days > 60 { return "noch \(days / 7) Wochen" }
        return days == 1 ? "noch 1 Tag" : "noch \(days) Tage"
    }
}

/// One admission test: the round at test pace first, then raw scores, papers and the mistake log.
struct TestCard: View {
    @Environment(AppModel.self) private var model
    var course: Course
    @Binding var examTarget: ExamTarget?
    @State private var confirm: Paper?
    @State private var showAll = false

    private enum Entry: Identifiable {
        case paper(Paper)
        case file(ExamRef)
        var id: String {
            switch self {
            case .paper(let p): return "paper:" + p.id
            case .file(let e): return "file:" + e.id
            }
        }
    }

    var body: some View {
        let today = model.drillsToday(course)
        let scores = model.latestRawScores(course)
        let mistakes = model.mistakes(in: course).count
        let entries = self.entries
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                CourseBadge(course: course, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(course.title).font(.headline)
                    Text(today == 0 ? "Heute noch keine Runde" : today == 1 ? "Heute 1 Runde" : "Heute \(today) Runden")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }

            if let drill = course.drill {
                Button {
                    model.startDrill(course)
                } label: {
                    Label("\(drill.title ?? "Tagesrunde"): \(drill.count) Aufgaben, \(drill.minutes) Min.", systemImage: "timer")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(course.tint)
                .controlSize(.large)
                .accessibilityHint("Startet eine kurze Runde im Testtempo, schwache Fragetypen zuerst")
            }

            if !scores.isEmpty {
                HStack(spacing: 8) {
                    ForEach(Array(scores.enumerated()), id: \.offset) { _, s in
                        VStack(alignment: .leading, spacing: 1) {
                            Text("\(Self.num(s.got)) / \(Self.num(s.max))")
                                .font(.headline.monospacedDigit())
                            Text(s.label)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(course.tint.opacity(0.12), in: .rect(cornerRadius: 12, style: .continuous))
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Letzte Rohwerte")
            }

            if !entries.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array((showAll ? entries : Array(entries.prefix(4))).enumerated()), id: \.element.id) { offset, entry in
                        if offset > 0 { Divider().padding(.leading, 4) }
                        row(entry)
                    }
                }
                if entries.count > 4 {
                    Button(showAll ? "Weniger anzeigen" : "Alle \(entries.count) Papers anzeigen") {
                        withAnimation(.smooth) { showAll.toggle() }
                    }
                    .font(.subheadline.weight(.semibold))
                }
            }

            NavigationLink {
                MistakeListView(course: course)
            } label: {
                HStack {
                    Label("Fehlerprotokoll", systemImage: "list.bullet.clipboard")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text(mistakes == 1 ? "1 offen" : "\(mistakes) offen")
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                }
                .padding(.vertical, 4)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
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

    /// Exam files first (TARA modules), then the papers, whole papers before the short ones.
    private var entries: [Entry] {
        let files = course.examFiles.map(Entry.file)
        let papers = (course.papers ?? []).sorted { a, b in (a.count >= 20) != (b.count >= 20) ? a.count >= 20 : false }.map(Entry.paper)
        return files + papers
    }

    @ViewBuilder
    private func row(_ entry: Entry) -> some View {
        switch entry {
        case .paper(let paper):
            Button {
                confirm = paper
            } label: {
                EntryRow(title: paper.title, detail: [paper.subtitle, "\(paper.count) Aufgaben, \(paper.minutes) Min."].compactMap { $0 }.joined(separator: " · "),
                         result: model.paperHistory(course, paper).first.map { Self.paperResult($0, paper) })
            }
            .buttonStyle(.plain)
        case .file(let exam):
            Button {
                examTarget = ExamTarget(course: course, chapter: nil, exam: exam)
            } label: {
                EntryRow(title: exam.title, detail: [exam.subtitle, "\(exam.minutes) Min."].compactMap { $0 }.joined(separator: " · "),
                         result: model.examFileHistory(course, exam).first.map { ExamResultRow.scoreText($0) })
            }
            .buttonStyle(.plain)
        }
    }

    static func paperResult(_ record: ExamRecord, _ paper: Paper) -> String {
        if paper.testFormat == "tmua" {
            return String(format: "%.1f", TMUAScale.score(correct: record.correct, total: record.total)).replacingOccurrences(of: ".", with: ",")
        }
        return "\(record.correct)/\(record.total)"
    }

    static func num(_ x: Double) -> String {
        x == x.rounded() ? String(Int(x)) : String(format: "%.1f", x).replacingOccurrences(of: ".", with: ",")
    }
}

/// A paper or exam file in a list: title, what it is, the last result.
struct EntryRow: View {
    var title: String
    var detail: String
    var result: String?

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).lineLimit(2).multilineTextAlignment(.leading)
                Text(detail).font(.caption).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.leading)
            }
            Spacer(minLength: 8)
            if let result {
                Text(result).font(.subheadline.monospacedDigit()).foregroundStyle(.secondary)
            }
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
        }
        .padding(.vertical, 8)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }
}

/// Üben tab: the exams from files of every subject (Abitur, university), grouped by course.
struct ExamCenterSection: View {
    @Environment(AppModel.self) private var model
    @Binding var examTarget: ExamTarget?
    @State private var showAll = false

    private struct Item: Identifiable {
        var course: Course
        var exam: ExamRef
        var id: String { course.id + "/" + exam.id }
    }

    var body: some View {
        // the admission tests have their own section above
        let items = model.examFileCourses.filter { $0.drill == nil }.flatMap { c in c.examFiles.map { Item(course: c, exam: $0) } }
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Klausuren", trailing: items.count == 1 ? "1 Klausur" : "\(items.count) Klausuren")
                VStack(alignment: .leading, spacing: 10) {
                    Text("Abitur- und Uni-Klausuren auf Zeit, mit Teilen ohne Hilfsmitteln, Erwartungshorizont und Note.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    VStack(spacing: 0) {
                        ForEach(Array((showAll ? items : Array(items.prefix(6))).enumerated()), id: \.element.id) { offset, item in
                            if offset > 0 { Divider().padding(.leading, 48) }
                            Button {
                                examTarget = ExamTarget(course: item.course, chapter: nil, exam: item.exam)
                            } label: {
                                ExamFileRow(course: item.course, exam: item.exam)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    if items.count > 6 {
                        Button(showAll ? "Weniger anzeigen" : "Alle \(items.count) Klausuren anzeigen") {
                            withAnimation(.smooth) { showAll.toggle() }
                        }
                        .font(.subheadline.weight(.semibold))
                    }
                }
                .card()
            }
        }
    }
}

/// An exam file of a subject: badge, title, format and time, the last grade.
struct ExamFileRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var exam: ExamRef

    var body: some View {
        let last = model.examFileHistory(course, exam).first
        HStack(spacing: 12) {
            CourseBadge(course: course, size: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(exam.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text([course.title, ExamFileSheet.formatName(exam.format), "\(exam.minutes) Min."].joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            if let last {
                Text(ExamResultRow.scoreText(last))
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
        }
        .padding(.vertical, 6)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Zeigt Ablauf und Bewertung, dann startet die Klausur")
    }
}
