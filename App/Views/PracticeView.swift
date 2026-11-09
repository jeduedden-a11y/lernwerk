import SwiftUI
import LernwerkCore

/// A training topic picked for the level sheet.
struct PracticeTarget: Identifiable {
    var course: Course
    var topic: PracticeTopic
    var id: String { course.id + "/" + topic.id }
}

/// Presents the level sheet for a topic and starts the round once the sheet is gone.
struct PracticeLauncher: ViewModifier {
    @Environment(AppModel.self) private var model
    @Binding var target: PracticeTarget?

    func body(content: Content) -> some View {
        content.sheet(item: $target) { t in
            PracticeSheet(course: t.course, topic: t.topic) { level in
                target = nil
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 450_000_000)
                    model.startPractice(t.course, t.topic, level: level)
                }
            }
            .environment(model)
            .presentationDetents([.large])
        }
    }
}

extension View {
    func practiceLauncher(_ target: Binding<PracticeTarget?>) -> some View { modifier(PracticeLauncher(target: target)) }
}

/// Choose a level: four tiles from green to purple, each with what it asks and how far you got.
struct PracticeSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let course: Course
    let topic: PracticeTopic
    var onStart: (Int) -> Void

    var body: some View {
        let stat = model.practiceStat(course, topic)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 14) {
                        CourseBadge(course: course, size: 52)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(topic.title).font(.title2.bold())
                            Text(course.title).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    if let s = topic.summary {
                        Text(s).font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }
                    LevelScaleBar(mastered: stat.highestMastered)

                    VStack(spacing: 12) {
                        ForEach(Level.all) { lv in
                            Button {
                                onStart(lv.value)
                            } label: {
                                LevelTile(level: lv, stat: stat, recommended: lv.value == recommended(stat))
                            }
                            .buttonStyle(PressableStyle())
                        }
                    }

                    Text("Jede Runde besteht aus \(topic.count ?? 6) neuen Aufgaben mit anderen Zahlen oder Fällen. Ab 80 Prozent beim ersten Versuch gilt eine Stufe als geschafft.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .readableColumn(640)
            }
            .background { TintBackground(tints: [Level(1).colors[0], Level(4).colors[1]]) }
            .navigationTitle("Training")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Schließen") { dismiss() }
                }
            }
        }
    }

    /// The first level not yet mastered.
    private func recommended(_ stat: PracticeStat) -> Int { min(4, stat.highestMastered + 1) }
}

struct LevelTile: View {
    var level: Level
    var stat: PracticeStat
    var recommended: Bool

    var body: some View {
        let i = level.value - 1
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(level.name).font(.title3.bold())
                    if recommended {
                        Text("Empfohlen")
                            .font(.caption.weight(.bold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(.white.opacity(0.25), in: .capsule)
                    }
                }
                Text(level.blurb).font(.subheadline).opacity(0.92).multilineTextAlignment(.leading)
                if stat.tasks[i] > 0 {
                    Text("\(stat.tasks[i]) Aufgaben · bestes Ergebnis \(Int((stat.best[i] * 100).rounded())) %")
                        .font(.caption.weight(.semibold))
                        .opacity(0.85)
                }
            }
            Spacer(minLength: 0)
            ZStack {
                Circle().fill(.white.opacity(0.22)).frame(width: 46, height: 46)
                Image(systemName: stat.mastered(level.value) ? "checkmark" : "play.fill")
                    .font(.headline.weight(.bold))
            }
        }
        .foregroundStyle(.white)
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(level.gradient, in: .rect(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .strokeBorder(.white.opacity(recommended ? 0.75 : 0), lineWidth: 2)
        }
        .shadow(color: level.colors[1].opacity(0.35), radius: 10, y: 4)
        .accessibilityElement(children: .combine)
        .accessibilityHint(stat.mastered(level.value) ? "Geschafft. Startet eine neue Runde." : "Startet eine Runde.")
    }
}

/// The whole scale as one bar; the levels mastered so far are bright, the rest faded.
struct LevelScaleBar: View {
    var mastered: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Level.scale).opacity(0.28)
                    Capsule().fill(Level.scale)
                        .mask(alignment: .leading) {
                            Rectangle().frame(width: geo.size.width * CGFloat(mastered) / 4)
                        }
                }
            }
            .frame(height: 8)
            HStack {
                ForEach(Level.all) { lv in
                    Text(lv.name)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(lv.value <= mastered ? lv.colors[0] : Color.secondary)
                        .frame(maxWidth: .infinity, alignment: lv.value == 1 ? .leading : lv.value == 4 ? .trailing : .center)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(mastered == 0 ? "Noch keine Stufe geschafft" : "Geschafft bis \(Level(mastered).name)")
    }
}

/// One training topic in a list.
struct PracticeTopicRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var topic: PracticeTopic
    var showCourse = true

    var body: some View {
        let unlocked = model.isUnlocked(topic)
        let stat = model.practiceStat(course, topic)
        HStack(spacing: 12) {
            if showCourse {
                CourseBadge(course: course, size: 36)
            } else {
                Image(systemName: "dumbbell.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(Level(max(1, stat.highestMastered)).gradient, in: .rect(cornerRadius: 10, style: .continuous))
                    .opacity(unlocked ? 1 : 0.4)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(topic.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(unlocked ? .primary : .secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(detail(unlocked, stat))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            if unlocked {
                LevelBars(filled: stat.highestMastered)
            } else {
                Image(systemName: "lock.fill").font(.footnote).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 6)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }

    private func detail(_ unlocked: Bool, _ stat: PracticeStat) -> String {
        if !unlocked { return "Frei nach »\(model.lessonTitle(topic.after) ?? "der Lektion")«" }
        if stat.highestMastered > 0 { return "Geschafft bis \(Level(stat.highestMastered).name)" + (showCourse ? " · \(course.title)" : "") }
        if stat.totalTasks > 0 { return "\(stat.totalTasks) Aufgaben geübt" + (showCourse ? " · \(course.title)" : "") }
        return showCourse ? course.title : "Bereit"
    }
}

/// The training block of the Üben tab: every topic unlocked so far.
struct TrainingSection: View {
    @Environment(AppModel.self) private var model
    @Binding var target: PracticeTarget?
    @State private var showAll = false

    var body: some View {
        let topics = model.unlockedTopics
        let lockedCount = model.courses.reduce(0) { $0 + $1.practiceTopics.count } - topics.count
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Trainieren", trailing: topics.isEmpty ? nil : "\(topics.count) Themen")
            VStack(alignment: .leading, spacing: 10) {
                Text("Neue Aufgaben zu allem, was du schon gelernt hast, in vier Stufen.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Capsule().fill(Level.scale).frame(height: 6)
                HStack {
                    ForEach(Level.all) { lv in
                        Text(lv.name).font(.caption2.weight(.semibold)).foregroundStyle(lv.colors[0])
                            .frame(maxWidth: .infinity, alignment: lv.value == 1 ? .leading : lv.value == 4 ? .trailing : .center)
                    }
                }
                if topics.isEmpty {
                    Text("Schließe eine Lektion ab, dann wird ihr Trainingsthema frei.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(.top, 4)
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array((showAll ? topics : Array(topics.prefix(6))).enumerated()), id: \.offset) { offset, item in
                            if offset > 0 { Divider().padding(.leading, 48) }
                            Button {
                                target = PracticeTarget(course: item.course, topic: item.topic)
                            } label: {
                                PracticeTopicRow(course: item.course, topic: item.topic)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    if topics.count > 6 {
                        Button(showAll ? "Weniger anzeigen" : "Alle \(topics.count) Themen anzeigen") {
                            withAnimation(.smooth) { showAll.toggle() }
                        }
                        .font(.subheadline.weight(.semibold))
                    }
                }
                if lockedCount > 0 {
                    Text(lockedCount == 1 ? "1 weiteres Thema wird mit der passenden Lektion frei." : "\(lockedCount) weitere Themen werden mit den passenden Lektionen frei.")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .card()
        }
    }
}
