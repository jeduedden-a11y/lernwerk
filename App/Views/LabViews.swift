import SwiftUI
import LernwerkCore

/// Üben tab: the labs by subject. Each lab has a free playground and build tasks on four levels.
struct LabSection: View {
    @Environment(AppModel.self) private var model
    @Binding var practiceTarget: PracticeTarget?
    @State private var subjectID: String?

    var body: some View {
        let groups = model.labGroups
        if !groups.isEmpty {
            let current = groups.first { $0.subject.id == subjectID } ?? groups[0]
            let total = groups.reduce(0) { $0 + $1.items.count }
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Labor", trailing: total == 1 ? "1 Labor" : "\(total) Labore")
                VStack(alignment: .leading, spacing: 12) {
                    Text("Selbst modellieren und bauen: frei ausprobieren oder Bauaufgaben auf vier Stufen lösen.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    if groups.count > 1 {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Array(groups.enumerated()), id: \.offset) { _, group in
                                    let on = group.subject.id == current.subject.id
                                    Button {
                                        withAnimation(.smooth) { subjectID = group.subject.id }
                                    } label: {
                                        Label(group.subject.title, systemImage: group.subject.symbol)
                                            .font(.subheadline.weight(.semibold))
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 7)
                                            .foregroundStyle(on ? Color.white : Color.primary)
                                            .background(on ? group.subject.tint : Color.primary.opacity(0.08), in: .capsule)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityAddTraits(on ? .isSelected : [])
                                }
                            }
                        }
                    }
                    VStack(spacing: 0) {
                        ForEach(Array(current.items.enumerated()), id: \.offset) { offset, item in
                            if offset > 0 { Divider().padding(.leading, 52) }
                            LabRow(course: item.course, lab: item.lab, practiceTarget: $practiceTarget)
                        }
                    }
                }
                .card()
            }
        }
    }
}

/// One lab: symbol, title, what it does, the highest level passed, and the two ways in.
struct LabRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var lab: LabRef
    @Binding var practiceTarget: PracticeTarget?

    var body: some View {
        let topic = lab.taskTopic
        let mastered = topic.map { model.practiceStat(course, $0).highestMastered } ?? 0
        HStack(spacing: 12) {
            Image(systemName: lab.symbol ?? "flask.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(course.tint.gradient, in: .rect(cornerRadius: 11, style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(lab.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                Text(lab.summary ?? course.title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
                if mastered > 0 {
                    Text("Aufgaben bestanden bis \(Level(mastered).name)")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Level(mastered).colors[0])
                }
            }
            Spacer(minLength: 6)
            VStack(spacing: 6) {
                Button {
                    model.startLab(course, lab)
                } label: {
                    Text("Frei").font(.caption.weight(.semibold)).frame(minWidth: 64)
                }
                .buttonStyle(.glass)
                .accessibilityLabel("\(lab.title) frei ausprobieren")
                if let topic {
                    Button {
                        practiceTarget = PracticeTarget(course: course, topic: topic)
                    } label: {
                        Text("Aufgaben").font(.caption.weight(.semibold)).frame(minWidth: 64)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(course.tint)
                    .accessibilityLabel("Bauaufgaben: \(lab.title)")
                }
            }
            .controlSize(.small)
        }
        .padding(.vertical, 8)
    }
}
