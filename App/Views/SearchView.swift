import SwiftUI
import LernwerkCore

/// Searches lesson titles, chapters and the full lesson text, plus the learner's own notes.
struct SearchView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var index: [Entry] = []
    @State private var indexedCourses: [String] = []
    @State private var editing: NoteTarget?

    struct Entry: Identifiable {
        var course: Course
        var lesson: LessonRef
        var chapter: String?
        var heading: String      // title, chapter, course: what a hit "by name" is matched against
        var text: String         // the whole lesson file
        var id: String { lesson.id }
    }

    private struct LessonHit: Identifiable {
        var entry: Entry
        var inTitle: Bool
        var id: String { entry.id }
    }

    private var needle: String { Self.fold(query.trimmingCharacters(in: .whitespacesAndNewlines)) }

    private var lessonHits: [LessonHit] {
        let n = needle
        guard !n.isEmpty else { return [] }
        let byTitle = index.filter { $0.heading.contains(n) }.map { LessonHit(entry: $0, inTitle: true) }
        let titled = Set(byTitle.map(\.id))
        let byText = n.count < 3 ? [] : index.filter { !titled.contains($0.id) && $0.text.contains(n) }.map { LessonHit(entry: $0, inTitle: false) }
        return byTitle + byText
    }

    private var noteHits: [LearnNote] {
        let n = needle
        guard !n.isEmpty else { return [] }
        return model.state.notes.filter { Self.fold($0.text + " " + $0.lessonTitle + " " + $0.vaultTitle).contains(n) }
    }

    var body: some View {
        NavigationStack {
            List {
                if needle.isEmpty {
                    ForEach(model.courses) { course in
                        Section(course.title) {
                            ForEach(course.readyLessons) { lesson in
                                LessonSearchRow(course: course, lesson: lesson, detail: course.chapter(of: lesson.id)?.title)
                            }
                        }
                    }
                } else {
                    let lessons = lessonHits
                    let notes = noteHits
                    if lessons.isEmpty && notes.isEmpty {
                        ContentUnavailableView.search(text: query)
                    }
                    if !lessons.isEmpty {
                        Section("Lektionen") {
                            ForEach(lessons) { hit in
                                LessonSearchRow(course: hit.entry.course, lesson: hit.entry.lesson,
                                                detail: hit.inTitle ? [hit.entry.course.title, hit.entry.chapter].compactMap { $0 }.joined(separator: " · ")
                                                                    : "Im Lektionstext · \(hit.entry.course.title)")
                            }
                        }
                    }
                    if !notes.isEmpty {
                        Section("Eigene Notizen") {
                            ForEach(notes) { note in
                                Button {
                                    open(note)
                                } label: {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(note.lessonTitle).font(.body.weight(.semibold))
                                        Text(note.text.replacingOccurrences(of: "\n", with: " "))
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(2)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Suche")
            .searchable(text: $query, prompt: "Begriffe, Lektionen, Notizen")
            .onAppear(perform: buildIndex)
            .onChange(of: model.courses.map(\.id)) { _, _ in
                indexedCourses = []
                buildIndex()
            }
            .sheet(item: $editing) { target in
                NoteEditor(course: target.course, lesson: target.lesson, meta: model.meta(target.course, target.lesson),
                           stepID: target.note?.stepId, existing: target.note)
                    .environment(model)
            }
        }
    }

    private func open(_ note: LearnNote) {
        guard let course = model.course(note.courseId) else { return }
        let lesson = course.lessons.first { $0.id == note.lessonId } ?? LessonRef(id: note.lessonId, title: note.lessonTitle)
        editing = NoteTarget(course: course, lesson: lesson, note: note)
    }

    /// Reads every ready lesson once; a few hundred kilobytes, kept while the tab lives.
    private func buildIndex() {
        let ids = model.courses.map(\.id)
        guard indexedCourses != ids else { return }
        indexedCourses = ids
        var entries: [Entry] = []
        for course in model.courses {
            for lesson in course.readyLessons {
                let chapter = course.chapter(of: lesson.id)?.title
                let raw = model.locator.data(course.lessonPath(lesson.id)).flatMap { String(data: $0, encoding: .utf8) } ?? ""
                let subtitle = model.meta(course, lesson)?.subtitle ?? ""
                let heading = [lesson.title, subtitle, chapter ?? "", course.title, lesson.ref ?? ""].joined(separator: " ")
                entries.append(Entry(course: course, lesson: lesson, chapter: chapter, heading: Self.fold(heading), text: Self.fold(raw)))
            }
        }
        index = entries
    }

    static func fold(_ s: String) -> String {
        s.folding(options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive], locale: germanLocale)
    }
}

struct LessonSearchRow: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var lesson: LessonRef
    var detail: String?

    var body: some View {
        let done = model.state.lessons[lesson.id]?.isCompleted == true
        Button {
            model.start(course, lesson)
        } label: {
            HStack(spacing: 12) {
                CourseBadge(course: course, size: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(lesson.title)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                    if let detail, !detail.isEmpty {
                        Text(detail).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                if done {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(course.tint)
                        .accessibilityLabel("abgeschlossen")
                }
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }
}
