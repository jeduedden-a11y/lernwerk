import SwiftUI
import LernwerkCore

/// A subject folder on the home screen: its courses as short rows, each opening the course directly.
struct SubjectCard: View {
    @Environment(AppModel.self) private var model
    var subject: Subject

    var body: some View {
        let courses = model.courses(in: subject)
        VStack(alignment: .leading, spacing: 10) {
            NavigationLink(value: subject) {
                HStack(spacing: 12) {
                    SubjectBadge(subject: subject, size: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(subject.title).font(.headline)
                        Text(summary(courses))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right").foregroundStyle(.tertiary)
                }
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Fach \(subject.title), \(summary(courses))")

            VStack(spacing: 0) {
                ForEach(Array(courses.enumerated()), id: \.element.id) { offset, course in
                    if offset > 0 { Divider().padding(.leading, 48) }
                    NavigationLink(value: course) {
                        CourseLine(course: course)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .foregroundStyle(.primary)
        .card()
    }

    private func summary(_ courses: [Course]) -> String {
        let ready = courses.reduce(0) { $0 + $1.readyLessons.count }
        let done = courses.reduce(0) { $0 + model.state.completedCount(in: $1) }
        let count = courses.count == 1 ? "1 Kurs" : "\(courses.count) Kurse"
        return "\(count) · \(done) von \(ready) Lektionen"
    }
}

/// One course inside a subject folder.
struct CourseLine: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let done = model.state.completedCount(in: course)
        let ready = course.readyLessons.count
        HStack(spacing: 12) {
            CourseBadge(course: course, size: 36)
            VStack(alignment: .leading, spacing: 4) {
                Text(course.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                ProgressLine(value: model.progress(of: course), tint: course.tint)
                    .frame(maxWidth: 160)
            }
            Spacer(minLength: 8)
            Text("\(done)/\(ready)")
                .font(.footnote.monospacedDigit())
                .foregroundStyle(.secondary)
            Image(systemName: "chevron.right")
                .font(.footnote)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 8)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(course.title), \(done) von \(ready) Lektionen")
    }
}

/// All courses of one subject.
struct SubjectView: View {
    @Environment(AppModel.self) private var model
    @State private var showFormulas = false
    var subject: Subject

    var body: some View {
        let courses = model.courses(in: subject)
        let withFormulas = courses.filter { model.formulaBook($0) != nil }
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 14) {
                        SubjectBadge(subject: subject, size: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(subject.title).font(.title.bold())
                            Text(courses.count == 1 ? "1 Kurs" : "\(courses.count) Kurse")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    ProgressLine(value: model.progress(of: subject), tint: subject.tint)
                    NavigationLink(value: PathRoute(subject: subject.id)) {
                        Label("Lernpfad als Baum ansehen", systemImage: "point.3.connected.trianglepath.dotted")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(subject.tint)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                }
                .card()
                ForEach(courses) { course in
                    NavigationLink(value: course) {
                        CourseCard(course: course)
                    }
                    .buttonStyle(PressableStyle())
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
            .readableColumn()
        }
        .background { TintBackground(tints: courses.prefix(3).map(\.tint)) }
        .navigationTitle(subject.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !withFormulas.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showFormulas = true
                    } label: {
                        Label("Formelsammlung", systemImage: "function")
                    }
                }
            }
        }
        .sheet(isPresented: $showFormulas) {
            FormulaSheet(courses: withFormulas, accentHex: withFormulas.first?.color ?? subject.color)
                .environment(model)
        }
    }
}
