import Foundation

// The shell only needs the outline of the content. Lesson steps stay opaque JSON that the web runtime renders,
// so new step types and widgets ship without an app update.

public struct CourseIndex: Codable, Sendable {
    public var schema: Int
    /// All courses in display order.
    public var courses: [String]
    /// Subject folders grouping the courses; older indexes have none.
    public var subjects: [Subject]?
}

/// A subject folder on the home screen, e.g. Mathematik with Analysis I, Lineare Algebra I and Stochastik.
/// It mirrors a subject folder of the vault (02 Wiki/<Fach>); `tag` is the wiki02 tag new notes get.
public struct Subject: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var symbol: String
    public var color: String
    public var tag: String?
    public var courses: [String]

    public init(id: String, title: String, symbol: String, color: String, tag: String? = nil, courses: [String]) {
        self.id = id
        self.title = title
        self.symbol = symbol
        self.color = color
        self.tag = tag
        self.courses = courses
    }
}

public struct VaultLink: Codable, Hashable, Sendable {
    public var path: String
    public var title: String

    public init(path: String, title: String) {
        self.path = path
        self.title = title
    }
}

public struct LessonRef: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var minutes: Int?
    public var ref: String?
    public var status: String?

    public init(id: String, title: String, minutes: Int? = nil, ref: String? = nil, status: String? = nil) {
        self.id = id
        self.title = title
        self.minutes = minutes
        self.ref = ref
        self.status = status
    }

    public var isReady: Bool { status != "soon" }
}

public struct Chapter: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var ref: String?
    public var lessons: [LessonRef]
    /// Planned week of a stage (TMUA guide), as yyyy-MM-dd; the course page marks the current one.
    public var from: String?
    public var to: String?

    public init(id: String, title: String, ref: String? = nil, lessons: [LessonRef], from: String? = nil, to: String? = nil) {
        self.id = id
        self.title = title
        self.ref = ref
        self.lessons = lessons
        self.from = from
        self.to = to
    }

    private static let day: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    public var fromDate: Date? { from.flatMap { Self.day.date(from: $0) } }
    public var toDate: Date? { to.flatMap { Self.day.date(from: $0) } }

    /// The planned week contains the given day.
    public func isCurrent(on date: Date = Date(), calendar: Calendar = .current) -> Bool {
        guard let a = fromDate, let b = toDate else { return false }
        let d = calendar.startOfDay(for: date)
        return d >= calendar.startOfDay(for: a) && d <= calendar.startOfDay(for: b)
    }

    /// The planned week lies before the given day.
    public func isPast(on date: Date = Date(), calendar: Calendar = .current) -> Bool {
        guard let b = toDate else { return false }
        return calendar.startOfDay(for: date) > calendar.startOfDay(for: b)
    }
}

/// A timed test in the style of an admission test (TMUA): a fixed number of tasks from named topics, multiple choice.
public struct Paper: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var subtitle: String?
    public var minutes: Int
    public var count: Int
    public var level: Int?
    public var topics: [String]

    public init(id: String, title: String, subtitle: String? = nil, minutes: Int, count: Int, level: Int? = nil, topics: [String]) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.minutes = minutes
        self.count = count
        self.level = level
        self.topics = topics
    }
}

/// TMUA scores run from 1.0 to 9.0; this estimate scales the share of correct answers to 40 questions.
public enum TMUAScale {
    public static func score(correct: Int, total: Int) -> Double {
        guard total > 0 else { return 1 }
        let raw = Double(correct) / Double(total) * 40
        let points: [(Double, Double)] = [(0, 1), (10, 2.5), (15, 3.6), (20, 4.6), (25, 5.6), (30, 6.6), (34, 7.6), (37, 8.5), (40, 9)]
        for i in 1..<points.count where raw <= points[i].0 {
            let f = (raw - points[i - 1].0) / (points[i].0 - points[i - 1].0)
            return ((points[i - 1].1 + f * (points[i].1 - points[i - 1].1)) * 10).rounded() / 10
        }
        return 9
    }
}

/// A training topic: generated tasks on one theme, unlocked by finishing the lesson `after`.
/// The runtime turns the generator names into fresh tasks on each of the four levels.
public struct PracticeTopic: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var summary: String?
    public var after: String?
    public var gens: [String]
    public var count: Int?
    /// A topic open from the start (no `after`) can still sit in a chapter.
    public var chapter: String?

    public init(id: String, title: String, summary: String? = nil, after: String? = nil, gens: [String], count: Int? = nil, chapter: String? = nil) {
        self.id = id
        self.title = title
        self.summary = summary
        self.after = after
        self.gens = gens
        self.count = count
        self.chapter = chapter
    }
}

public struct Course: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var title: String
    public var subtitle: String?
    public var description: String?
    public var color: String
    public var symbol: String
    public var vault: String?
    public var chapters: [Chapter]
    public var practice: [PracticeTopic]?
    /// Timed papers (TMUA).
    public var papers: [Paper]?
    /// Wrong generated tasks of training and papers go into a mistake log.
    public var mistakeLog: Bool?

    public var lessons: [LessonRef] { chapters.flatMap(\.lessons) }
    public var readyLessons: [LessonRef] { lessons.filter(\.isReady) }
    public var practiceTopics: [PracticeTopic] { practice ?? [] }

    /// Training topics belonging to a chapter: those unlocked by one of its lessons.
    public func practiceTopics(in chapter: Chapter) -> [PracticeTopic] {
        let ids = Set(chapter.lessons.map(\.id))
        return practiceTopics.filter { $0.after.map(ids.contains) ?? ($0.chapter == chapter.id) }
    }

    public func chapter(of lessonID: String) -> Chapter? {
        chapters.first { $0.lessons.contains { $0.id == lessonID } }
    }

    public func lessonPath(_ lessonID: String) -> String { "courses/\(id)/lessons/\(lessonID).json" }
}

/// What the shell reads from a lesson file: everything except the step contents.
public struct LessonMeta: Codable, Hashable, Sendable {
    public struct Step: Codable, Hashable, Sendable {
        public var id: String?
        public var type: String
        public var review: Bool?
        public var hasGoal: Bool

        enum CodingKeys: String, CodingKey { case id, type, review, goal }

        public init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            id = try c.decodeIfPresent(String.self, forKey: .id)
            type = (try? c.decode(String.self, forKey: .type)) ?? "text"
            review = try c.decodeIfPresent(Bool.self, forKey: .review)
            hasGoal = c.contains(.goal)
        }

        public func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encodeIfPresent(id, forKey: .id)
            try c.encode(type, forKey: .type)
            try c.encodeIfPresent(review, forKey: .review)
        }
    }

    public var id: String
    public var title: String
    public var subtitle: String?
    public var source: String?
    public var vault: [VaultLink]?
    public var steps: [Step]

    /// Step ids as the runtime assigns them ("s1", "s2", ... when a step has none).
    public var stepIDs: [String] { steps.enumerated().map { $0.element.id ?? "s\($0.offset + 1)" } }

    /// Question types the runtime knows; mirrors QUESTION_TYPES in lw.js.
    public static let questionTypes: Set<String> = [
        "choice", "multi", "truefalse", "numeric", "cloze", "order", "match", "sort", "reveal", "gen",
        "spot", "proof", "estimate", "timeline", "quadrant",
    ]

    /// Question steps worth repeating, mirroring LW.reviewable in the runtime.
    public var reviewableStepIDs: [String] {
        steps.enumerated().compactMap { offset, step in
            let id = step.id ?? "s\(offset + 1)"
            if step.review == false { return nil }
            if Self.questionTypes.contains(step.type) { return id }
            if step.type == "widget", step.hasGoal, step.review == true { return id }
            return nil
        }
    }
}

public struct RuntimeInfo: Codable, Sendable {
    public var api: Int
    public var version: String
    public var minShell: Int
    public var katex: String?
}

/// Messages the runtime posts through window.webkit.messageHandlers.lw.
public enum RuntimeMessage: Sendable, Equatable {
    case loaded
    case ready(steps: Int)
    case progress(index: Int, total: Int, answered: Bool)
    /// giveUpLabel: text of the second button, "Lösung" when the runtime sends none (exams send "Überspringen").
    case primary(label: String, enabled: Bool, style: String, canGiveUp: Bool, giveUpLabel: String?)
    case feedback(correct: Bool, isSelfCheck: Bool, invalid: Bool)
    case finished(FinishedLesson)
    case error(String)
    /// From the learning path page: open a lesson, or start training on a topic at a level.
    case open(courseId: String, lessonId: String)
    case practice(courseId: String, topicId: String, level: Int)
    case unknown

    public static func parse(_ body: Any) -> RuntimeMessage {
        guard let dict = body as? [String: Any], let type = dict["type"] as? String else { return .unknown }
        func int(_ k: String) -> Int { (dict[k] as? NSNumber)?.intValue ?? 0 }
        func bool(_ k: String) -> Bool { (dict[k] as? NSNumber)?.boolValue ?? false }
        switch type {
        case "loaded": return .loaded
        case "ready": return .ready(steps: int("steps"))
        case "progress": return .progress(index: int("index"), total: int("total"), answered: bool("answered"))
        case "primary":
            return .primary(label: dict["label"] as? String ?? "Weiter", enabled: bool("enabled"), style: dict["style"] as? String ?? "continue",
                            canGiveUp: bool("canGiveUp"), giveUpLabel: dict["giveUpLabel"] as? String)
        case "feedback": return .feedback(correct: bool("correct"), isSelfCheck: bool("self"), invalid: bool("invalid"))
        case "error": return .error(dict["message"] as? String ?? "Unbekannter Fehler")
        case "open":
            guard let course = dict["courseId"] as? String, let lesson = dict["lessonId"] as? String else { return .unknown }
            return .open(courseId: course, lessonId: lesson)
        case "practice":
            guard let course = dict["courseId"] as? String, let topic = dict["topicId"] as? String else { return .unknown }
            return .practice(courseId: course, topicId: topic, level: max(1, min(4, int("level"))))
        case "finished":
            // a wrong generated task comes along as an object; it is kept as JSON text
            var d = dict
            if var results = d["results"] as? [[String: Any]] {
                for i in results.indices {
                    if let task = results[i]["task"], !(task is String), JSONSerialization.isValidJSONObject(task),
                       let data = try? JSONSerialization.data(withJSONObject: task), let text = String(data: data, encoding: .utf8) {
                        results[i]["task"] = text
                    }
                }
                d["results"] = results
            }
            guard let data = try? JSONSerialization.data(withJSONObject: d),
                  let f = try? JSONDecoder().decode(FinishedLesson.self, from: data) else { return .unknown }
            return .finished(f)
        default: return .unknown
        }
    }
}

public struct StepResult: Codable, Sendable, Equatable {
    public var stepId: String
    public var lessonId: String?
    public var type: String
    public var correct: Bool
    public var firstTry: Bool
    public var attempts: Int
    public var revealed: Bool
    /// Self-assessed reveal steps report "self": true.
    public var isSelfCheck: Bool
    /// Generated tasks in training, exams and the daily mix name their topic, course and level.
    public var topicId: String?
    public var courseId: String?
    public var level: Int?
    /// The learner opened the solution path before answering.
    public var helped: Bool
    /// Not answered in an exam (skipped or out of time).
    public var skipped: Bool
    /// A wrong generated task as runtime JSON, when the session keeps a mistake log.
    public var task: String?

    enum CodingKeys: String, CodingKey {
        case stepId, lessonId, type, correct, firstTry, attempts, revealed
        case isSelfCheck = "self"
        case topicId, courseId, level, helped, skipped, task
    }

    public init(stepId: String, lessonId: String?, type: String, correct: Bool, firstTry: Bool, attempts: Int, revealed: Bool, isSelfCheck: Bool = false,
                topicId: String? = nil, courseId: String? = nil, level: Int? = nil, helped: Bool = false, skipped: Bool = false) {
        self.stepId = stepId
        self.lessonId = lessonId
        self.type = type
        self.correct = correct
        self.firstTry = firstTry
        self.attempts = attempts
        self.revealed = revealed
        self.isSelfCheck = isSelfCheck
        self.topicId = topicId
        self.courseId = courseId
        self.level = level
        self.helped = helped
        self.skipped = skipped
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        stepId = try c.decode(String.self, forKey: .stepId)
        lessonId = try? c.decodeIfPresent(String.self, forKey: .lessonId)
        type = (try? c.decode(String.self, forKey: .type)) ?? "choice"
        correct = (try? c.decode(Bool.self, forKey: .correct)) ?? false
        firstTry = (try? c.decode(Bool.self, forKey: .firstTry)) ?? false
        attempts = (try? c.decode(Int.self, forKey: .attempts)) ?? 1
        revealed = (try? c.decode(Bool.self, forKey: .revealed)) ?? false
        isSelfCheck = (try? c.decode(Bool.self, forKey: .isSelfCheck)) ?? false
        topicId = try? c.decodeIfPresent(String.self, forKey: .topicId)
        courseId = try? c.decodeIfPresent(String.self, forKey: .courseId)
        level = try? c.decodeIfPresent(Int.self, forKey: .level)
        helped = (try? c.decode(Bool.self, forKey: .helped)) ?? false
        skipped = (try? c.decode(Bool.self, forKey: .skipped)) ?? false
        task = try? c.decodeIfPresent(String.self, forKey: .task)
    }

    /// Quality for spaced repetition: 5 first try, 3 solved later or self-rated good, 1 failed.
    public var quality: Int {
        if isSelfCheck { return correct ? 4 : 1 }
        if firstTry { return 5 }
        return correct ? 3 : 1
    }
}

public struct PracticeInfo: Codable, Sendable, Equatable {
    public var topicId: String?
    public var courseId: String?
    public var level: Int

    public init(topicId: String?, courseId: String?, level: Int) {
        self.topicId = topicId
        self.courseId = courseId
        self.level = level
    }
}

/// What the runtime reports about an exam besides the results.
public struct ExamInfo: Codable, Sendable, Equatable {
    public var title: String
    public var courseId: String?
    public var chapterId: String?
    public var timeUp: Bool
    public var minutes: Int?
    /// "tmua" for a paper.
    public var format: String?

    public init(title: String, courseId: String? = nil, chapterId: String? = nil, timeUp: Bool = false, minutes: Int? = nil, format: String? = nil) {
        self.title = title
        self.courseId = courseId
        self.chapterId = chapterId
        self.timeUp = timeUp
        self.minutes = minutes
        self.format = format
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        title = (try? c.decode(String.self, forKey: .title)) ?? "Klausur"
        courseId = try? c.decodeIfPresent(String.self, forKey: .courseId)
        chapterId = try? c.decodeIfPresent(String.self, forKey: .chapterId)
        timeUp = (try? c.decode(Bool.self, forKey: .timeUp)) ?? false
        minutes = try? c.decodeIfPresent(Int.self, forKey: .minutes)
        format = try? c.decodeIfPresent(String.self, forKey: .format)
    }
}

public struct FinishedLesson: Codable, Sendable, Equatable {
    public var lessonId: String?
    public var mode: String
    public var results: [StepResult]
    public var score: Double
    public var seconds: Int?
    /// Set for training rounds.
    public var practice: PracticeInfo?
    /// Set for exams.
    public var exam: ExamInfo?

    public init(lessonId: String?, mode: String, results: [StepResult], score: Double, seconds: Int? = nil, practice: PracticeInfo? = nil, exam: ExamInfo? = nil) {
        self.lessonId = lessonId
        self.mode = mode
        self.results = results
        self.score = score
        self.seconds = seconds
        self.practice = practice
        self.exam = exam
    }
}

/// courses/<course>/formeln.json: the formulas of a course. The runtime renders them (formula panel, formula cards,
/// training); the app only needs ids, names and the lessons that use them.
public struct FormulaBook: Codable, Hashable, Sendable {
    public struct Formula: Codable, Hashable, Sendable, Identifiable {
        public var id: String
        public var name: String
        public var tex: String
        public var lessons: [String]?
        public var abi: String?

        public init(id: String, name: String, tex: String, lessons: [String]? = nil, abi: String? = nil) {
            self.id = id
            self.name = name
            self.tex = tex
            self.lessons = lessons
            self.abi = abi
        }
    }

    public struct Group: Codable, Hashable, Sendable {
        public var title: String
        public var formulas: [Formula]

        public init(title: String, formulas: [Formula]) {
            self.title = title
            self.formulas = formulas
        }
    }

    public var course: String
    public var title: String
    public var groups: [Group]

    public init(course: String, title: String, groups: [Group]) {
        self.course = course
        self.title = title
        self.groups = groups
    }

    public var formulas: [Formula] { groups.flatMap(\.formulas) }

    /// The formulas a lesson works with.
    public func formulas(forLesson id: String) -> [Formula] { formulas.filter { $0.lessons?.contains(id) == true } }

    /// Review cards of formulas carry this pseudo lesson id; the runtime loads the book in place of a lesson.
    public static func lessonID(course: String) -> String { "formeln-\(course)" }
    public static func isFormulaLesson(_ lessonID: String) -> Bool { lessonID.hasPrefix("formeln-") }
    public static func path(course: String) -> String { "courses/\(course)/formeln.json" }
}
