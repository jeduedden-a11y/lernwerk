import SwiftUI
import LernwerkCore

/// A course inside a subject: badge, title, progress.
struct CourseCard: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let done = model.state.completedCount(in: course)
        let ready = course.readyLessons.count
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                CourseBadge(course: course, size: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text(course.title).font(.headline)
                    if let s = course.subtitle {
                        Text(s).font(.footnote).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            ProgressLine(value: model.progress(of: course), tint: course.tint)
            Text("\(done) von \(ready) Lektionen · \(course.lessons.count - ready) in Arbeit")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .foregroundStyle(.primary)
        .card()
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
