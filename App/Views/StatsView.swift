import SwiftUI
import Charts
import LernwerkCore

struct StatsView: View {
    @Environment(AppModel.self) private var model
    @State private var window = 14

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SummaryGrid()
                    XPChartCard(window: $window)
                    ForEach(model.subjects) { subject in
                        SectionTitle(title: subject.title, trailing: "\(Int((model.progress(of: subject) * 100).rounded())) %")
                        ForEach(model.courses(in: subject)) { course in
                            NavigationLink(value: course) {
                                CourseProgressCard(course: course)
                            }
                            .buttonStyle(PressableStyle())
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .background { TintBackground(tints: [.green, .mint]) }
            .navigationTitle("Fortschritt")
            .navigationDestination(for: Course.self) { course in
                CourseView(course: course)
            }
        }
    }
}

struct SummaryGrid: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let days = model.state.days.values
        let xp = days.reduce(0) { $0 + $1.xp }
        let seconds = days.reduce(0) { $0 + $1.seconds }
        let done = model.courses.reduce(0) { $0 + model.state.completedCount(in: $1) }
        let ready = model.courses.reduce(0) { $0 + $1.readyLessons.count }
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            StatTile(value: "\(xp)", label: "Punkte insgesamt", symbol: "bolt.fill", tint: .accentColor)
            StatTile(value: "\(model.streak)", label: model.streak == 1 ? "Tag in Folge" : "Tage in Folge", symbol: "flame.fill", tint: .orange)
            StatTile(value: "\(done) / \(ready)", label: "Lektionen geschafft", symbol: "checkmark.seal.fill", tint: .green)
            StatTile(value: Self.duration(seconds), label: "Lernzeit", symbol: "clock.fill", tint: .teal)
        }
    }

    static func duration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        if minutes < 60 { return "\(minutes) Min." }
        let h = minutes / 60, m = minutes % 60
        return m == 0 ? "\(h) Std." : "\(h) Std. \(m) Min."
    }
}

struct StatTile: View {
    var value: String
    var label: String
    var symbol: String
    var tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: symbol)
                .font(.title3.weight(.semibold))
                .foregroundStyle(tint)
            Text(value)
                .font(.title2.bold())
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .contentTransition(.numericText())
            Text(label)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .card(padding: 14, radius: 22)
        .accessibilityElement(children: .combine)
    }
}

private struct XPPoint: Identifiable {
    var date: Date
    var xp: Int
    var id: Date { date }
}

struct XPChartCard: View {
    @Environment(AppModel.self) private var model
    @Binding var window: Int

    var body: some View {
        let points = self.points
        let goal = max(1, model.state.dailyGoal)
        let total = points.reduce(0) { $0 + $1.xp }
        let reached = points.filter { $0.xp >= goal }.count
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Punkte pro Tag").font(.headline)
                Spacer()
                Picker("Zeitraum", selection: $window) {
                    Text("7 T.").tag(7)
                    Text("14 T.").tag(14)
                    Text("30 T.").tag(30)
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 200)
            }
            Chart {
                ForEach(points) { p in
                    BarMark(x: .value("Tag", p.date, unit: .day), y: .value("Punkte", p.xp))
                        .foregroundStyle(p.xp >= goal ? Color.accentColor : Color.accentColor.opacity(0.4))
                        .cornerRadius(3)
                        .accessibilityLabel(p.date.formatted(.dateTime.weekday(.wide).day().month(.wide).locale(germanLocale)))
                        .accessibilityValue("\(p.xp) Punkte")
                }
                RuleMark(y: .value("Tagesziel", goal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(.secondary)
                    .annotation(position: .top, alignment: .leading) {
                        Text("Ziel \(goal)").font(.caption2).foregroundStyle(.secondary)
                    }
            }
            .chartXAxis {
                AxisMarks(preset: .aligned, values: .stride(by: .day, count: window <= 7 ? 1 : (window <= 14 ? 2 : 7))) { _ in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.day().month(.defaultDigits).locale(germanLocale))
                }
            }
            .frame(height: 190)
            Text("\(total) Punkte in \(window) Tagen, Tagesziel an \(reached) \(reached == 1 ? "Tag" : "Tagen") erreicht.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .card()
    }

    private var points: [XPPoint] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        return (0..<window).reversed().compactMap { i in
            guard let d = cal.date(byAdding: .day, value: -i, to: today) else { return nil }
            return XPPoint(date: d, xp: model.state.xp(on: DayKey.key(for: d)))
        }
    }
}

struct CourseProgressCard: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let ready = course.readyLessons
        let done = ready.filter { model.state.lessons[$0.id]?.isCompleted == true }
        let scores = done.compactMap { model.state.lessons[$0.id]?.bestScore }
        let average = scores.isEmpty ? nil : scores.reduce(0, +) / Double(scores.count)
        let cards = model.state.cards.values.filter { $0.courseId == course.id }.count
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                CourseBadge(course: course, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(course.title).font(.headline)
                    Text("\(done.count) von \(ready.count) Lektionen")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            ProgressLine(value: model.progress(of: course), tint: course.tint)
            HStack(spacing: 14) {
                if let average {
                    Label("\(Int((average * 100).rounded())) % beim ersten Versuch", systemImage: "target")
                }
                if cards > 0 {
                    Label("\(cards) in der Wiederholung", systemImage: "arrow.clockwise")
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .foregroundStyle(.primary)
        .card()
    }
}
