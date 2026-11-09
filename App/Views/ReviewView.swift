import SwiftUI
import Charts
import LernwerkCore

/// Spaced repetition: every question of a finished lesson comes back, first after hours, then days, then weeks.
struct ReviewView: View {
    @Environment(AppModel.self) private var model
    @State private var practiceTarget: PracticeTarget?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if model.state.cards.isEmpty {
                        ContentUnavailableView {
                            Label("Noch nichts zu wiederholen", systemImage: "arrow.clockwise")
                        } description: {
                            Text("Nach jeder Lektion kommen ihre Aufgaben hierher zurück: erst nach Stunden, dann nach Tagen, dann nach Wochen. Was sitzt, kommt seltener. Die Werte sind dabei jedes Mal neu.")
                        }
                        .padding(.top, 24)
                    } else {
                        DueHeader()
                    }
                    TrainingSection(target: $practiceTarget)
                    if !model.state.cards.isEmpty {
                        ForecastCard()
                        StageCard()
                        SectionTitle(title: "Nach Kurs")
                        ForEach(coursesWithCards) { course in
                            CourseReviewRow(course: course)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .background { TintBackground(tints: [Level(1).colors[0], Level(3).colors[0], Level(4).colors[1]]) }
            .navigationTitle("Üben")
            .practiceLauncher($practiceTarget)
        }
    }

    private var coursesWithCards: [Course] {
        let ids = Set(model.state.cards.values.map(\.courseId))
        return model.courses.filter { ids.contains($0.id) }
    }
}

struct DueHeader: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let due = model.dueCards.count
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("\(due)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Text(due == 1 ? "Aufgabe fällig" : "Aufgaben fällig")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            Text(due > 0 ? "Gemischt aus deinen Kursen, bis zu 12 am Stück. Fehler sind hier gut: Die Aufgabe kommt dann früher wieder." : nextText)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if due > 0 {
                Button {
                    model.startReview()
                } label: {
                    Label("Jetzt wiederholen", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(.orange)
                .controlSize(.large)
            }
        }
        .card()
    }

    private var nextText: String {
        let now = Date()
        guard let next = model.state.cards.values.map(\.due).filter({ $0 > now }).min() else { return "Alles erledigt." }
        return "Alles erledigt. Die nächste Aufgabe kommt \(Format.relative(next))."
    }
}

private struct ForecastDay: Identifiable {
    var offset: Int
    var label: String
    var count: Int
    var id: Int { offset }
}

/// How many cards come up on each of the next seven days.
struct ForecastCard: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let days = forecast()
        VStack(alignment: .leading, spacing: 12) {
            Text("Die nächsten sieben Tage").font(.headline)
            Chart(days) { d in
                BarMark(x: .value("Tag", d.label), y: .value("Aufgaben", d.count))
                    .foregroundStyle(d.offset == 0 ? Color.orange : Color.orange.opacity(0.45))
                    .cornerRadius(5)
                    .annotation(position: .top) {
                        if d.count > 0 {
                            Text("\(d.count)").font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
                        }
                    }
                    .accessibilityLabel(d.label)
                    .accessibilityValue("\(d.count) Aufgaben")
            }
            .chartYAxis(.hidden)
            .frame(height: 140)
        }
        .card()
    }

    private func forecast() -> [ForecastDay] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        var counts = Array(repeating: 0, count: 7)
        for card in model.state.cards.values {
            let offset = max(0, cal.dateComponents([.day], from: today, to: cal.startOfDay(for: card.due)).day ?? 0)
            if offset < 7 { counts[offset] += 1 }
        }
        return (0..<7).map { i in
            let date = cal.date(byAdding: .day, value: i, to: today) ?? today
            let label: String
            switch i {
            case 0: label = "Heute"
            case 1: label = "Morgen"
            default: label = date.formatted(.dateTime.weekday(.abbreviated).locale(germanLocale))
            }
            return ForecastDay(offset: i, label: label, count: counts[i])
        }
    }
}

/// How firmly the cards sit: failed recently, still growing, or with intervals of a week and more.
struct StageCard: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let cards = Array(model.state.cards.values)
        let stages: [(label: String, count: Int, tint: Color)] = [
            ("Wackelig", cards.filter { $0.reps == 0 }.count, .red),
            ("Im Aufbau", cards.filter { $0.reps > 0 && $0.interval < 7 }.count, .orange),
            ("Sicher", cards.filter { $0.reps > 0 && $0.interval >= 7 }.count, .green),
        ]
        let total = max(1, cards.count)
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Wie fest es sitzt").font(.headline)
                Spacer()
                Text("\(cards.count) Aufgaben").font(.subheadline).foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                HStack(spacing: 3) {
                    ForEach(stages.indices, id: \.self) { i in
                        let s = stages[i]
                        if s.count > 0 {
                            Capsule()
                                .fill(s.tint.gradient)
                                .frame(width: max(8, (geo.size.width - 6) * CGFloat(s.count) / CGFloat(total)))
                        }
                    }
                }
            }
            .frame(height: 12)
            .accessibilityHidden(true)
            HStack(spacing: 16) {
                ForEach(stages.indices, id: \.self) { i in
                    let s = stages[i]
                    HStack(spacing: 6) {
                        Circle().fill(s.tint).frame(width: 8, height: 8)
                        Text("\(s.label) \(s.count)").font(.footnote).foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            Text("Sicher heißt: Abstand von einer Woche oder mehr bis zur nächsten Wiederholung.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .card()
    }
}

struct CourseReviewRow: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let now = Date()
        let cards = model.state.cards.values.filter { $0.courseId == course.id }
        let due = cards.filter { $0.due <= now }.count
        let firm = cards.filter { $0.reps > 0 && $0.interval >= 7 }.count
        HStack(spacing: 12) {
            CourseBadge(course: course, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(course.title).font(.headline)
                Text("\(cards.count) Aufgaben, \(firm) davon sicher")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if due > 0 {
                Button {
                    model.startReview(course: course)
                } label: {
                    Text("\(due) üben").font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.glassProminent)
                .tint(course.tint)
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundStyle(.green)
                    .accessibilityLabel("Nichts fällig")
            }
        }
        .card(padding: 14, radius: 22)
    }
}
