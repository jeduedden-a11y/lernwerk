import SwiftUI
import LernwerkCore

/// A chapter, or a whole course when chapter is nil, picked for an exam; or an exam from a file.
struct ExamTarget: Identifiable {
    var course: Course
    var chapter: Chapter?
    /// An exam from a file (Abitur, university, TARA) instead of generated tasks.
    var exam: ExamRef? = nil
    var id: String { course.id + "/" + (exam.map { "file:" + $0.id } ?? chapter?.id ?? "*") }
}

/// Presents the exam sheet and starts the exam once the sheet is gone.
struct ExamLauncher: ViewModifier {
    @Environment(AppModel.self) private var model
    @Binding var target: ExamTarget?

    func body(content: Content) -> some View {
        content.sheet(item: $target) { t in
            Group {
                if let exam = t.exam {
                    ExamFileSheet(course: t.course, exam: exam) { start(t) }
                } else {
                    ExamSheet(course: t.course, chapter: t.chapter) { start(t) }
                }
            }
            .environment(model)
            .presentationDetents([.large])
        }
    }

    private func start(_ t: ExamTarget) {
        target = nil
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 450_000_000)
            if let exam = t.exam {
                model.startExamFile(t.course, exam)
            } else {
                model.startExam(t.course, chapter: t.chapter)
            }
        }
    }
}

/// Before an exam from a file: what it covers, how it runs and is marked, and the earlier attempts.
struct ExamFileSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let course: Course
    let exam: ExamRef
    var onStart: () -> Void

    var body: some View {
        let history = Array(model.examFileHistory(course, exam).prefix(5))
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 14) {
                        CourseBadge(course: course, size: 52)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(exam.title).font(.title2.bold())
                            Text([course.title, exam.subtitle].compactMap { $0 }.joined(separator: " · "))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack(spacing: 12) {
                        StatPill(value: "\(exam.minutes) Min.", label: "Zeit", symbol: "timer", tint: course.tint)
                        StatPill(value: Self.formatName(exam.format), label: "Format", symbol: "doc.text", tint: course.tint)
                    }

                    if let about = exam.about {
                        Text(about)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("So läuft es").font(.headline)
                        ForEach(Array(Self.rules(exam.format).enumerated()), id: \.offset) { _, rule in
                            Label {
                                Text(rule.1).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                            } icon: {
                                Image(systemName: rule.0).foregroundStyle(course.tint)
                            }
                        }
                    }
                    .card()

                    if !history.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Bisher").font(.headline)
                            ForEach(history) { record in
                                ExamResultRow(exam: record, tint: course.tint, showTitle: false)
                            }
                        }
                        .card()
                    }
                }
                .padding()
                .readableColumn(640)
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    onStart()
                } label: {
                    Label(exam.format == "tara" || exam.format == "tmua" ? "Test starten" : "Klausur starten", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(course.tint)
                .controlSize(.extraLarge)
                .padding(.horizontal)
                .padding(.bottom, 8)
                .readableColumn(640)
            }
            .background { TintBackground(tints: [course.tint, course.tint.opacity(0.6)]) }
            .navigationTitle(exam.format == "tara" || exam.format == "tmua" ? "Test" : "Klausur")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Schließen") { dismiss() }
                }
            }
        }
    }

    static func formatName(_ format: String) -> String {
        switch format {
        case "uni": return "Uni"
        case "tmua": return "TMUA"
        case "tara": return "TARA"
        default: return "Abitur"
        }
    }

    static func rules(_ format: String) -> [(String, String)] {
        switch format {
        case "tara":
            return [
                ("timer", "Jedes Modul hat seine eigene Uhr wie im Test. Ist sie abgelaufen, beginnt das nächste; zurück geht es nicht."),
                ("character.textbox", "Fünf Antworten von A bis E, genau eine stimmt. Falsche Antworten kosten nichts, also nichts leer lassen."),
                ("plus.forwardslash.minus", "Kein Taschenrechner, wie im Test. Das Notizblatt ist dein Schmierpapier."),
                ("text.alignleft", "Writing Task: eine von drei Aussagen wählen, höchstens 750 Wörter. Am Ende prüfst du selbst an den drei Teilen der Aufgabe."),
                ("chart.bar", "Ergebnis: Rohwert je Modul. UAT-UK rechnet ihn auf 1,0 bis 9,0 um, eine offizielle Tabelle dafür gibt es nicht."),
            ]
        case "tmua":
            return [
                ("timer", "Die Uhr läuft ab dem Start, ohne Taschenrechner."),
                ("character.textbox", "Eine Antwort von A bis H; falsche Antworten kosten nichts."),
                ("chart.bar", "Am Ende ein geschätzter Wert von 1 bis 9 und alle Lösungen."),
            ]
        case "uni":
            return [
                ("eye.slash", "Keine Rückmeldung zwischendurch. Was du nicht weißt, überspringst du."),
                ("timer", "Die Zeit läuft oben mit. Teile mit eigener Zeit schließen von selbst."),
                ("checklist", "Auswahl-, Rechen- und Beweisbausteine bewertet die App. Schriftliche Beweise bewertest du am Ende selbst nach dem Erwartungshorizont."),
                ("graduationcap", "Note von 1,0 bis 5,0, bestanden ab 50 Prozent der Punkte."),
            ]
        default:
            return [
                ("eye.slash", "Keine Rückmeldung zwischendurch. Was du nicht weißt, überspringst du."),
                ("timer", "Teile mit eigener Zeit schließen von selbst. Im Teil ohne Hilfsmittel sind Rechner und Formeln gesperrt."),
                ("checklist", "Auswahl- und Rechenaufgaben bewertet die App. Schriftliche Aufgaben bewertest du am Ende selbst nach dem Erwartungshorizont."),
                ("graduationcap", "Bewertungseinheiten werden nach dem Schlüssel der Oberstufe in Notenpunkte umgerechnet."),
            ]
        }
    }
}

extension View {
    func examLauncher(_ target: Binding<ExamTarget?>) -> some View { modifier(ExamLauncher(target: target)) }
}

/// Before an exam: what it covers, how long it takes, how it is marked, and how earlier attempts went.
struct ExamSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let course: Course
    let chapter: Chapter?
    var onStart: () -> Void

    var body: some View {
        let plan = model.examPlan(course, chapter: chapter)
        let all = chapter.map { course.practiceTopics(in: $0) } ?? course.practiceTopics
        let history = Array(model.examHistory(course, chapter: chapter).prefix(5))
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 14) {
                        CourseBadge(course: course, size: 52)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(chapter?.title ?? "Ganzer Kurs").font(.title2.bold())
                            Text(course.title).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }

                    HStack(spacing: 12) {
                        StatPill(value: "\(plan.count)", label: "Aufgaben", symbol: "list.number", tint: course.tint)
                        StatPill(value: "\(plan.minutes) Min.", label: "Zeit", symbol: "timer", tint: course.tint)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("So läuft die Klausur").font(.headline)
                        rule("eye.slash", "Keine Rückmeldung zwischendurch. Was du nicht weißt, überspringst du.")
                        rule("timer", "Die Zeit läuft oben mit. Ist sie um, wird abgegeben, was da ist.")
                        rule("checklist", "Am Ende stehen alle Lösungen da und eine Auswertung pro Thema. Schwache Themen erscheinen im Fortschritt.")
                        rule("arrow.up.right", "Jedes Thema kommt eine Stufe über dem, was du im Training bestanden hast, mindestens auf Mittel.")
                    }
                    .card()

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Themen").font(.headline)
                        ForEach(plan.topics) { topic in
                            HStack(spacing: 10) {
                                Text(topic.title)
                                    .font(.subheadline)
                                    .lineLimit(2)
                                Spacer(minLength: 8)
                                LevelBadge(level: Level(model.examLevel(course, topic)))
                            }
                        }
                        if all.count > plan.topics.count {
                            let locked = all.count - plan.topics.count
                            Text(locked == 1 ? "1 weiteres Thema kommt dazu, sobald seine Lektion abgeschlossen ist." : "\(locked) weitere Themen kommen dazu, sobald ihre Lektionen abgeschlossen sind.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .card()

                    if !history.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Bisher").font(.headline)
                            ForEach(history) { exam in
                                ExamResultRow(exam: exam, tint: course.tint, showTitle: false)
                            }
                        }
                        .card()
                    }
                }
                .padding()
                .readableColumn(640)
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    onStart()
                } label: {
                    Label("Klausur starten", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(course.tint)
                .controlSize(.extraLarge)
                .disabled(plan.topics.isEmpty)
                .padding(.horizontal)
                .padding(.bottom, 8)
                .readableColumn(640)
            }
            .background { TintBackground(tints: [course.tint, course.tint.opacity(0.6)]) }
            .navigationTitle("Klausur")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Schließen") { dismiss() }
                }
            }
        }
    }

    private func rule(_ symbol: String, _ text: String) -> some View {
        Label {
            Text(text).font(.subheadline).fixedSize(horizontal: false, vertical: true)
        } icon: {
            Image(systemName: symbol).foregroundStyle(course.tint)
        }
    }
}

/// One finished exam: date, score as a bar, and whether the time ran out.
struct ExamResultRow: View {
    var exam: ExamRecord
    var tint: Color
    var showTitle = true

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(showTitle ? exam.title : exam.date.formatted(.dateTime.day().month(.wide).hour().minute().locale(germanLocale)))
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                Spacer(minLength: 8)
                Text(Self.scoreText(exam))
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            let share = Self.share(exam)
            ProgressLine(value: share, tint: share >= 0.8 ? .green : share >= 0.5 ? tint : .orange)
            HStack(spacing: 6) {
                if showTitle {
                    Text(Format.relative(exam.date))
                }
                Text(SummaryGrid.duration(exam.seconds))
                if exam.timeUp {
                    Label("Zeit abgelaufen", systemImage: "timer").labelStyle(.titleAndIcon)
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }

    /// Exams from a file show their grade ("Note 2,3", "11 NP", "CT 15 · PS 13"), the others the correct answers.
    static func scoreText(_ exam: ExamRecord) -> String {
        guard exam.examId != nil, let grade = exam.grade else { return "\(exam.correct) von \(exam.total)" }
        switch exam.format {
        case "uni": return "Note " + grade
        case "tmua": return grade + " von 9,0"
        default: return grade
        }
    }

    /// Exams from a file count points (written tasks included), the others correct answers.
    static func share(_ exam: ExamRecord) -> Double {
        if let got = exam.points, let max = exam.maxPoints, max > 0 { return got / max }
        return exam.share
    }
}

/// Entry for the exam of a chapter, under its training topics.
struct ExamEntryRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var chapter: Chapter?

    var body: some View {
        let plan = model.examPlan(course, chapter: chapter)
        let last = model.examHistory(course, chapter: chapter).first
        HStack(spacing: 12) {
            Image(systemName: "list.bullet.clipboard.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(course.tint.gradient, in: .rect(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(chapter == nil ? "Klausur über den ganzen Kurs" : "Klausur zum Kapitel")
                    .font(.subheadline.weight(.semibold))
                Text(last.map { "Zuletzt \($0.correct) von \($0.total) richtig" } ?? "\(plan.count) Aufgaben · \(plan.minutes) Minuten")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
        }
        .padding(.vertical, 6)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Zeigt Themen und Zeit, dann startet die Klausur")
    }
}

/// Fortschritt: the last exams across all courses; a tap opens the same exam again.
struct ExamHistoryCard: View {
    @Environment(AppModel.self) private var model
    @Binding var target: ExamTarget?

    var body: some View {
        let exams = Array(model.state.exams.suffix(5).reversed())
        if !exams.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Klausuren", trailing: model.state.exams.count == 1 ? "1 geschrieben" : "\(model.state.exams.count) geschrieben")
                VStack(spacing: 14) {
                    ForEach(exams) { exam in
                        let course = exam.courseId.flatMap { model.course($0) }
                        Button {
                            if let course {
                                let file = exam.examId.flatMap { id in course.examFiles.first { $0.id == id } }
                                target = ExamTarget(course: course, chapter: course.chapters.first { $0.id == exam.chapterId }, exam: file)
                            }
                        } label: {
                            ExamResultRow(exam: exam, tint: course?.tint ?? .accentColor)
                                .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .disabled(course == nil)
                    }
                }
                .card()
            }
        }
    }
}
