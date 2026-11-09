import SwiftUI
import LernwerkCore

struct CourseView: View {
    @Environment(AppModel.self) private var model
    @State private var practiceTarget: PracticeTarget?
    var course: Course

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                ForEach(Array(course.chapters.enumerated()), id: \.element.id) { offset, chapter in
                    ChapterSection(course: course, chapter: chapter, number: offset + 1, target: $practiceTarget)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 30)
            .readableColumn()
        }
        .background { TintBackground(tints: [course.tint, course.tint.opacity(0.7)]) }
        .navigationTitle(course.title)
        .navigationBarTitleDisplayMode(.inline)
        .practiceLauncher($practiceTarget)
        .toolbar {
            if !model.dueCards.filter({ $0.courseId == course.id }).isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        model.startReview(course: course)
                    } label: {
                        Label("Wiederholen", systemImage: "arrow.clockwise")
                    }
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 14) {
                CourseBadge(course: course, size: 64)
                VStack(alignment: .leading, spacing: 4) {
                    Text(course.title).font(.title.bold())
                    if let s = course.subtitle { Text(s).font(.subheadline).foregroundStyle(.secondary) }
                }
            }
            if let d = course.description {
                Text(d).font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            }
            ProgressLine(value: model.progress(of: course), tint: course.tint)
        }
        .card()
    }
}

struct ChapterSection: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var chapter: Chapter
    var number: Int = 0
    @Binding var target: PracticeTarget?

    var body: some View {
        let topics = course.practiceTopics(in: chapter)
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                if number > 0 {
                    Text("\(number)")
                        .font(.footnote.weight(.bold).monospacedDigit())
                        .foregroundStyle(course.tint)
                }
                Text(chapter.title).font(.title3.bold())
                Spacer()
                if let ref = chapter.ref { Text(ref).font(.footnote).foregroundStyle(.secondary) }
            }
            .padding(.bottom, 10)
            VStack(spacing: 0) {
                ForEach(Array(chapter.lessons.enumerated()), id: \.element.id) { offset, lesson in
                    LessonRow(course: course, lesson: lesson, isFirst: offset == 0, isLast: offset == chapter.lessons.count - 1)
                }
                if !topics.isEmpty {
                    Divider().padding(.vertical, 6)
                    ForEach(topics) { topic in
                        Button {
                            if model.isUnlocked(topic) { target = PracticeTarget(course: course, topic: topic) }
                        } label: {
                            PracticeTopicRow(course: course, topic: topic, showCourse: false)
                                .padding(.horizontal, 8)
                        }
                        .buttonStyle(.plain)
                        .disabled(!model.isUnlocked(topic))
                    }
                }
            }
            .card(padding: 8)
        }
    }
}

/// One node on the learning path of a chapter.
struct LessonRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var lesson: LessonRef
    var isFirst: Bool
    var isLast: Bool

    private var progress: LessonProgress? { model.state.lessons[lesson.id] }
    private var done: Bool { progress?.isCompleted == true }
    private var started: Bool { !done && (progress?.lastStep ?? 0) > 0 }

    var body: some View {
        Button {
            model.start(course, lesson)
        } label: {
            HStack(spacing: 14) {
                node
                VStack(alignment: .leading, spacing: 2) {
                    Text(lesson.title)
                        .font(.body.weight(lesson.isReady ? .semibold : .regular))
                        .foregroundStyle(lesson.isReady ? .primary : .secondary)
                        .multilineTextAlignment(.leading)
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                if lesson.isReady {
                    Image(systemName: done ? "arrow.counterclockwise" : "play.fill")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(done ? Color.secondary : course.tint)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(!lesson.isReady)
        .accessibilityLabel(lesson.title)
        .accessibilityValue(stateText)
    }

    private var stateText: String {
        if done { return "abgeschlossen" }
        if !lesson.isReady { return "bald verfügbar" }
        return started ? "begonnen" : "offen"
    }

    private var detail: String {
        if !lesson.isReady { return "Bald verfügbar" + (lesson.ref.map { " · \($0)" } ?? "") }
        var parts: [String] = []
        if let m = lesson.minutes { parts.append(Format.minutes(m)) }
        if let r = lesson.ref { parts.append(r) }
        if done, let s = progress?.bestScore { parts.append("\(Int((s * 100).rounded())) %") }
        if started { parts.append("weiter bei Schritt \((progress?.lastStep ?? 0) + 1)") }
        return parts.joined(separator: " · ")
    }

    private var node: some View {
        ZStack {
            // connector to the neighbours
            VStack(spacing: 0) {
                Rectangle().fill(isFirst ? Color.clear : course.tint.opacity(0.3)).frame(width: 3)
                Rectangle().fill(isLast ? Color.clear : course.tint.opacity(0.3)).frame(width: 3)
            }
            .frame(height: 56)
            Circle()
                .fill(done ? course.tint : Color(uiColor: .secondarySystemGroupedBackground))
                .frame(width: 34, height: 34)
                .overlay {
                    Circle().strokeBorder(lesson.isReady ? course.tint : Color.secondary.opacity(0.4), lineWidth: started ? 3 : 2)
                }
                .overlay {
                    if done {
                        Image(systemName: "checkmark").font(.footnote.weight(.bold)).foregroundStyle(.white)
                    } else if !lesson.isReady {
                        Image(systemName: "hourglass").font(.caption2).foregroundStyle(.secondary)
                    }
                }
        }
        .frame(width: 36)
    }
}
