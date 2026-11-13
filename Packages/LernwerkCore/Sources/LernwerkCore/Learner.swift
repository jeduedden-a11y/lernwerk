import Foundation

/// Calendar day key "yyyy-MM-dd" in the user's time zone.
public enum DayKey {
    public static func key(for date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    public static func date(_ key: String, calendar: Calendar = .current) -> Date? {
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }
}

public struct LessonProgress: Codable, Hashable, Sendable {
    public var courseId: String
    public var lastStep: Int = 0
    public var completedAt: Date?
    public var bestScore: Double?
    public var timesCompleted: Int = 0
    public var updatedAt: Date = Date()
    /// Set when the learner skips the lesson (already known): it then counts as settled for the path, not as finished.
    public var skippedAt: Date?

    public init(courseId: String) { self.courseId = courseId }

    public var isCompleted: Bool { completedAt != nil }
    /// Skipped and not finished since.
    public var isSkipped: Bool { skippedAt != nil && completedAt == nil }
    /// Finished or skipped: the path moves on, training topics behind it open.
    public var isSettled: Bool { completedAt != nil || skippedAt != nil }
}

/// One question step scheduled for spaced repetition (SM-2 family).
public struct ReviewCard: Codable, Hashable, Sendable, Identifiable {
    public var courseId: String
    public var lessonId: String
    public var stepId: String
    public var ease: Double = 2.5
    public var interval: Double = 0   // days
    public var reps: Int = 0
    public var lapses: Int = 0
    public var due: Date
    public var lastReviewed: Date?

    public var id: String { ReviewCard.key(lessonId, stepId) }
    public static func key(_ lesson: String, _ step: String) -> String { "\(lesson)#\(step)" }

    public init(courseId: String, lessonId: String, stepId: String, due: Date) {
        self.courseId = courseId
        self.lessonId = lessonId
        self.stepId = stepId
        self.due = due
    }
}

public enum Scheduler {
    /// Updates a card after an answer of the given quality (0...5).
    /// 5 = solved at the first try, 3 = solved after a mistake, 1 = not solved.
    public static func review(_ card: ReviewCard, quality: Int, now: Date = Date()) -> ReviewCard {
        var c = card
        let q = Double(max(0, min(5, quality)))
        c.lastReviewed = now
        if q < 3 {
            c.reps = 0
            c.lapses += 1
            c.interval = 0
            c.ease = max(1.3, c.ease - 0.2)
            c.due = now.addingTimeInterval(10 * 60)
            return c
        }
        c.reps += 1
        switch c.reps {
        case 1: c.interval = q >= 5 ? 1 : 0.5
        case 2: c.interval = q >= 5 ? 4 : 2
        default: c.interval = max(1, (c.interval * c.ease).rounded())
        }
        c.ease = max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
        c.due = now.addingTimeInterval(c.interval * 86_400)
        return c
    }
}

public struct DayStat: Codable, Hashable, Sendable {
    public var xp: Int = 0
    public var lessons: Int = 0
    public var reviews: Int = 0
    public var seconds: Int = 0
    /// Training tasks done that day.
    public var practice: Int = 0
    public init() {}

    enum CodingKeys: String, CodingKey { case xp, lessons, reviews, seconds, practice }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        xp = (try? c.decode(Int.self, forKey: .xp)) ?? 0
        lessons = (try? c.decode(Int.self, forKey: .lessons)) ?? 0
        reviews = (try? c.decode(Int.self, forKey: .reviews)) ?? 0
        seconds = (try? c.decode(Int.self, forKey: .seconds)) ?? 0
        practice = (try? c.decode(Int.self, forKey: .practice)) ?? 0
    }
}

/// Training on one topic, per level 1 (Leicht) to 4 (Experte).
public struct PracticeStat: Codable, Hashable, Sendable {
    public var tasks: [Int] = [0, 0, 0, 0]
    public var correct: [Int] = [0, 0, 0, 0]
    public var best: [Double] = [0, 0, 0, 0]
    public var rounds: Int = 0
    public var lastLevel: Int = 1
    public var lastAt: Date?

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func four<T: Decodable>(_ key: CodingKeys, _ fallback: T) -> [T] {
            let v = (try? c.decode([T].self, forKey: key)) ?? []
            return v.count == 4 ? v : [fallback, fallback, fallback, fallback]
        }
        tasks = four(.tasks, 0)
        correct = four(.correct, 0)
        best = four(.best, 0.0)
        rounds = (try? c.decode(Int.self, forKey: .rounds)) ?? 0
        lastLevel = (try? c.decode(Int.self, forKey: .lastLevel)) ?? 1
        lastAt = try? c.decodeIfPresent(Date.self, forKey: .lastAt)
    }

    /// A level counts as mastered after a round with at least 80 % at the first try.
    public func mastered(_ level: Int) -> Bool { (1...4).contains(level) && best[level - 1] >= 0.8 }
    public var highestMastered: Int { (1...4).last { mastered($0) } ?? 0 }
    public var totalTasks: Int { tasks.reduce(0, +) }

    public static func key(course: String, topic: String) -> String { "\(course)/\(topic)" }
}

/// Correct answers out of all tasks, e.g. for one topic of an exam.
public struct Tally: Codable, Hashable, Sendable {
    public var correct: Int = 0
    public var total: Int = 0
    public init(correct: Int = 0, total: Int = 0) {
        self.correct = correct
        self.total = total
    }
    public var share: Double { total == 0 ? 0 : Double(correct) / Double(total) }
}

/// One exam: mixed tasks of a chapter or course, checked only at the end.
public struct ExamRecord: Codable, Hashable, Sendable, Identifiable {
    public var id: String = UUID().uuidString.lowercased()
    public var date: Date
    public var title: String
    public var courseId: String?
    public var chapterId: String?
    public var correct: Int
    public var total: Int
    public var seconds: Int
    public var timeUp: Bool
    /// Per training topic id.
    public var topics: [String: Tally]
    /// "tmua" for a paper.
    public var format: String? = nil

    public init(date: Date, title: String, courseId: String?, chapterId: String?, correct: Int, total: Int, seconds: Int, timeUp: Bool, topics: [String: Tally], format: String? = nil) {
        self.format = format
        self.date = date
        self.title = title
        self.courseId = courseId
        self.chapterId = chapterId
        self.correct = correct
        self.total = total
        self.seconds = seconds
        self.timeUp = timeUp
        self.topics = topics
    }

    public var share: Double { total == 0 ? 0 : Double(correct) / Double(total) }
}

/// Something worth practising again: a training topic with a low hit rate, or a lesson whose questions keep failing.
public struct WeakSpot: Hashable, Sendable, Identifiable {
    public enum Kind: Hashable, Sendable {
        case topic(courseId: String, topicId: String)
        case lesson(courseId: String, lessonId: String)
    }
    public var kind: Kind
    public var title: String
    /// Hit rate between 0 and 1 the spot was judged by.
    public var share: Double
    /// How many answers it rests on.
    public var evidence: Int
    public var reason: String

    public var id: String {
        switch kind {
        case .topic(let c, let t): return "topic:\(c)/\(t)"
        case .lesson(let c, let l): return "lesson:\(c)/\(l)"
        }
    }
}

/// A note the learner wrote in the app; it goes into the vault through the Tagwerk bridge.
public struct LearnNote: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var courseId: String
    public var lessonId: String
    public var lessonTitle: String
    public var stepId: String?
    public var vaultPath: String
    public var vaultTitle: String
    public var text: String
    public var createdAt: Date
    public var updatedAt: Date
    /// Text as last handed to the bridge; nil if never sent.
    public var sentText: String?
    /// Id of the outbox event that carries the current text, while it waits to be sent.
    public var queuedEventID: String?

    public init(id: String = UUID().uuidString.lowercased(), courseId: String, lessonId: String, lessonTitle: String, stepId: String?,
                vaultPath: String, vaultTitle: String, text: String, now: Date = Date()) {
        self.id = id
        self.courseId = courseId
        self.lessonId = lessonId
        self.lessonTitle = lessonTitle
        self.stepId = stepId
        self.vaultPath = vaultPath
        self.vaultTitle = vaultTitle
        self.text = text
        self.createdAt = now
        self.updatedAt = now
    }

    public var isSent: Bool { sentText == text }
}

public struct LearnerState: Codable, Sendable {
    public var lessons: [String: LessonProgress] = [:]
    public var cards: [String: ReviewCard] = [:]
    public var days: [String: DayStat] = [:]
    public var notes: [LearnNote] = []
    public var outbox: [OutgoingEvent] = []
    /// Training per "course/topic".
    public var practice: [String: PracticeStat] = [:]
    /// Exams, newest last; only the last 50 are kept.
    public var exams: [ExamRecord] = []
    public var lastLesson: String? { didSet { lastLessonAt = Date() } }
    /// When lastLesson was set; the newer one wins when devices are compared.
    public var lastLessonAt: Date?
    public var dailyGoal: Int = 30
    public var bridgeFeatures: [String] = []
    public var bridgePluginVersion: String?
    public var lastPush: Date?
    public var lastSyncError: String?
    public var deviceSalt: String = TagwerkCrypto.randomBytes(16).base64EncodedString()
    /// Wrong tasks of courses with a mistake log (TMUA), newest last.
    public var mistakes: [Mistake] = []

    // MARK: progress across devices (see ProgressSync.swift)

    /// Names this installation in the data repo: lernwerk/fortschritt/<deviceID>.tw.
    public var deviceID: String = UUID().uuidString.lowercased()
    /// Set by "Lernfortschritt zurücksetzen"; a newer reset on another device clears this one too.
    public var resetAt: Date?
    /// What this device learned per day and per training topic. `days` and `practice` add the other devices to it.
    public var ownDays: [String: DayStat] = [:]
    public var ownPractice: [String: PracticeStat] = [:]
    /// The other devices as last read: their own days and training, so the totals can be recomputed offline.
    public var peers: [String: ProgressPeer] = [:]
    /// Ids of solved or removed mistakes, so another device does not bring them back.
    public var resolvedMistakes: [String] = []
    public var progressSync = ProgressSyncMeta()

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        lessons = (try? c.decode([String: LessonProgress].self, forKey: .lessons)) ?? [:]
        cards = (try? c.decode([String: ReviewCard].self, forKey: .cards)) ?? [:]
        days = (try? c.decode([String: DayStat].self, forKey: .days)) ?? [:]
        notes = (try? c.decode([LearnNote].self, forKey: .notes)) ?? []
        outbox = (try? c.decode([OutgoingEvent].self, forKey: .outbox)) ?? []
        practice = (try? c.decode([String: PracticeStat].self, forKey: .practice)) ?? [:]
        exams = (try? c.decode([ExamRecord].self, forKey: .exams)) ?? []
        lastLesson = try? c.decodeIfPresent(String.self, forKey: .lastLesson)
        dailyGoal = (try? c.decode(Int.self, forKey: .dailyGoal)) ?? 30
        bridgeFeatures = (try? c.decode([String].self, forKey: .bridgeFeatures)) ?? []
        bridgePluginVersion = try? c.decodeIfPresent(String.self, forKey: .bridgePluginVersion)
        lastPush = try? c.decodeIfPresent(Date.self, forKey: .lastPush)
        lastSyncError = try? c.decodeIfPresent(String.self, forKey: .lastSyncError)
        deviceSalt = (try? c.decode(String.self, forKey: .deviceSalt)) ?? TagwerkCrypto.randomBytes(16).base64EncodedString()
        mistakes = (try? c.decode([Mistake].self, forKey: .mistakes)) ?? []
        lastLessonAt = try? c.decodeIfPresent(Date.self, forKey: .lastLessonAt)
        deviceID = (try? c.decode(String.self, forKey: .deviceID)) ?? UUID().uuidString.lowercased()
        resetAt = try? c.decodeIfPresent(Date.self, forKey: .resetAt)
        // before the sync existed everything was learned on this device
        ownDays = (try? c.decode([String: DayStat].self, forKey: .ownDays)) ?? days
        ownPractice = (try? c.decode([String: PracticeStat].self, forKey: .ownPractice)) ?? practice
        peers = (try? c.decode([String: ProgressPeer].self, forKey: .peers)) ?? [:]
        resolvedMistakes = (try? c.decode([String].self, forKey: .resolvedMistakes)) ?? []
        progressSync = (try? c.decode(ProgressSyncMeta.self, forKey: .progressSync)) ?? ProgressSyncMeta()
    }

    // MARK: derived values

    public func dueCards(now: Date = Date()) -> [ReviewCard] {
        cards.values.filter { $0.due <= now }.sorted { $0.due < $1.due }
    }

    public func xp(on day: String) -> Int { days[day]?.xp ?? 0 }

    /// Consecutive days with activity, counting today only if something happened today.
    public func streak(now: Date = Date(), calendar: Calendar = .current) -> Int {
        var count = 0
        var day = calendar.startOfDay(for: now)
        if xp(on: DayKey.key(for: day, calendar: calendar)) == 0 {
            day = calendar.date(byAdding: .day, value: -1, to: day) ?? day
        }
        while xp(on: DayKey.key(for: day, calendar: calendar)) > 0 {
            count += 1
            guard let prev = calendar.date(byAdding: .day, value: -1, to: day) else { break }
            day = prev
        }
        return count
    }

    public func completedCount(in course: Course) -> Int {
        course.readyLessons.filter { lessons[$0.id]?.isCompleted == true }.count
    }

    /// Finished or skipped lessons of a course: the progress along the path.
    public func settledCount(in course: Course) -> Int {
        course.readyLessons.filter { lessons[$0.id]?.isSettled == true }.count
    }

    /// True when the lesson is finished or skipped.
    public func isSettled(_ lessonID: String) -> Bool { lessons[lessonID]?.isSettled == true }

    /// Skips a lesson the learner already knows. A finished lesson stays finished.
    public mutating func skip(lessonID: String, courseID: String, now: Date = Date()) {
        var p = lessons[lessonID] ?? LessonProgress(courseId: courseID)
        guard !p.isCompleted else { return }
        p.skippedAt = now
        p.updatedAt = now
        lessons[lessonID] = p
    }

    /// Takes a skip back: the lesson is open again.
    public mutating func unskip(lessonID: String, now: Date = Date()) {
        guard var p = lessons[lessonID], p.skippedAt != nil else { return }
        p.skippedAt = nil
        p.updatedAt = now
        lessons[lessonID] = p
    }

    /// What most needs practice, weakest first.
    /// Topics: hit rate at the first try in training and the daily mix plus the last ten exams; from 6 answers on, below 70 %.
    /// Lessons: at least two of their questions were not known at the last repetition.
    public func weakSpots(courses: [Course], limit: Int = 5) -> [WeakSpot] {
        var examTally: [String: Tally] = [:]
        for exam in exams.suffix(10) {
            guard let course = exam.courseId else { continue }
            for (topic, t) in exam.topics {
                let key = PracticeStat.key(course: course, topic: topic)
                examTally[key, default: Tally()].correct += t.correct
                examTally[key, default: Tally()].total += t.total
            }
        }
        var spots: [WeakSpot] = []
        for course in courses {
            for topic in course.practiceTopics {
                let key = PracticeStat.key(course: course.id, topic: topic.id)
                let p = practice[key]
                let trainedCorrect = p?.correct.reduce(0, +) ?? 0
                let trainedTotal = p?.totalTasks ?? 0
                let exam = examTally[key] ?? Tally()
                let all = Tally(correct: trainedCorrect + exam.correct, total: trainedTotal + exam.total)
                guard all.total >= 6, all.share < 0.7 else { continue }
                var reason = "\(all.correct) von \(all.total) Aufgaben beim ersten Versuch richtig"
                if exam.total > 0 { reason += ", davon \(exam.correct) von \(exam.total) in Klausuren" }
                spots.append(WeakSpot(kind: .topic(courseId: course.id, topicId: topic.id), title: topic.title,
                                      share: all.share, evidence: all.total, reason: reason))
            }
            for lesson in course.readyLessons {
                let lessonCards = cards.values.filter { $0.lessonId == lesson.id }
                let failing = lessonCards.filter { $0.reps == 0 && $0.lapses > 0 }.count
                guard failing >= 2, !lessonCards.isEmpty else { continue }
                let share = 1 - Double(failing) / Double(lessonCards.count)
                spots.append(WeakSpot(kind: .lesson(courseId: course.id, lessonId: lesson.id), title: lesson.title, share: share,
                                      evidence: lessonCards.count, reason: "\(failing) von \(lessonCards.count) Fragen zuletzt nicht gewusst"))
            }
        }
        let sorted = spots.sorted { $0.share != $1.share ? $0.share < $1.share : $0.evidence > $1.evidence }
        return Array(sorted.prefix(limit))
    }

    // MARK: recording

    /// Records a finished lesson or review session and returns the XP earned.
    /// The day and training figures it adds also go to this device's own share (ownDays, ownPractice).
    @discardableResult
    public mutating func record(_ finished: FinishedLesson, course: Course?, meta: LessonMeta?, now: Date = Date()) -> Int {
        let dayKey = DayKey.key(for: now)
        let dayBefore = days[dayKey] ?? DayStat()
        let practiceBefore = practice
        let xp = recordTotals(finished, course: course, meta: meta, now: now)
        let dayAfter = days[dayKey] ?? DayStat()
        var own = ownDays[dayKey] ?? DayStat()
        own.xp += dayAfter.xp - dayBefore.xp
        own.lessons += dayAfter.lessons - dayBefore.lessons
        own.reviews += dayAfter.reviews - dayBefore.reviews
        own.seconds += dayAfter.seconds - dayBefore.seconds
        own.practice += dayAfter.practice - dayBefore.practice
        ownDays[dayKey] = own
        for (key, after) in practice where practiceBefore[key] != after {
            let before = practiceBefore[key] ?? PracticeStat()
            var mine = ownPractice[key] ?? PracticeStat()
            for i in 0..<4 {
                mine.tasks[i] += after.tasks[i] - before.tasks[i]
                mine.correct[i] += after.correct[i] - before.correct[i]
                mine.best[i] = max(mine.best[i], after.best[i])
            }
            mine.rounds += after.rounds - before.rounds
            mine.lastLevel = after.lastLevel
            mine.lastAt = after.lastAt
            ownPractice[key] = mine
        }
        return xp
    }

    private mutating func recordTotals(_ finished: FinishedLesson, course: Course?, meta: LessonMeta?, now: Date) -> Int {
        let dayKey = DayKey.key(for: now)
        var stat = days[dayKey] ?? DayStat()
        let questions = finished.results.count
        let good = finished.results.filter { $0.quality >= 4 }.count
        var xp = 0
        if finished.mode == "practice" {
            // training: no cards, the tasks are new every time; harder levels earn more
            let level = max(1, min(4, finished.practice?.level ?? 1))
            let first = finished.results.filter { $0.firstTry || ($0.isSelfCheck && $0.correct) }.count
            let later = finished.results.filter { $0.correct && !$0.firstTry && !$0.isSelfCheck }.count
            xp = first * (1 + level) + later
            stat.practice += finished.results.count
            if let topic = finished.practice?.topicId, let courseID = finished.practice?.courseId ?? course?.id {
                let key = PracticeStat.key(course: courseID, topic: topic)
                var p = practice[key] ?? PracticeStat()
                p.tasks[level - 1] += finished.results.count
                p.correct[level - 1] += first
                p.best[level - 1] = max(p.best[level - 1], finished.score)
                p.rounds += 1
                p.lastLevel = level
                p.lastAt = now
                practice[key] = p
            }
        } else if finished.mode == "review" {
            xp = 2 * questions + good
            stat.reviews += questions
            for r in finished.results {
                guard let lesson = r.lessonId else { continue }
                let key = ReviewCard.key(lesson, r.stepId)
                if let card = cards[key] { cards[key] = Scheduler.review(card, quality: r.quality, now: now) }
            }
        } else if finished.mode == "exam" {
            // exams count every correct answer; the hit rate per topic feeds the weak spots, not the levels
            let correct = finished.results.filter(\.correct).count
            xp = 3 * correct + (finished.score >= 0.8 ? 10 : 0)
            stat.practice += finished.results.count
            var topics: [String: Tally] = [:]
            for r in finished.results {
                guard let topic = r.topicId else { continue }
                topics[topic, default: Tally()].total += 1
                if r.correct { topics[topic, default: Tally()].correct += 1 }
            }
            let info = finished.exam
            exams.append(ExamRecord(date: now, title: info?.title ?? "Klausur", courseId: info?.courseId ?? course?.id, chapterId: info?.chapterId,
                                    correct: correct, total: finished.results.count, seconds: finished.seconds ?? 0,
                                    timeUp: info?.timeUp ?? false, topics: topics, format: info?.format))
            if exams.count > 50 { exams.removeFirst(exams.count - 50) }
        } else if finished.mode == "mix" {
            // daily mix: repetitions move their cards, new tasks count towards the topic's hit rate on their level
            for r in finished.results {
                if let lesson = r.lessonId {
                    let key = ReviewCard.key(lesson, r.stepId)
                    if let card = cards[key] { cards[key] = Scheduler.review(card, quality: r.quality, now: now) }
                    xp += 2 + (r.quality >= 4 ? 1 : 0)
                    stat.reviews += 1
                } else if let topic = r.topicId, let courseID = r.courseId {
                    let level = max(1, min(4, r.level ?? 1))
                    let key = PracticeStat.key(course: courseID, topic: topic)
                    var p = practice[key] ?? PracticeStat()
                    p.tasks[level - 1] += 1
                    if r.firstTry { p.correct[level - 1] += 1 }
                    p.lastAt = now
                    practice[key] = p
                    xp += r.firstTry ? 1 + level : (r.correct ? 1 : 0)
                    stat.practice += 1
                }
            }
        } else if let lessonID = finished.lessonId, let course {
            var p = lessons[lessonID] ?? LessonProgress(courseId: course.id)
            let firstTime = !p.isCompleted
            p.completedAt = p.completedAt ?? now
            p.skippedAt = nil
            p.timesCompleted += 1
            p.bestScore = max(p.bestScore ?? 0, finished.score)
            p.lastStep = 0
            p.updatedAt = now
            lessons[lessonID] = p
            xp = (firstTime ? 10 : 4) + 2 * good
            stat.lessons += 1
            // every question of the lesson becomes a card; results decide the first due date
            let byStep = Dictionary(finished.results.map { ($0.stepId, $0) }, uniquingKeysWith: { a, _ in a })
            for stepID in meta?.reviewableStepIDs ?? finished.results.map(\.stepId) {
                let key = ReviewCard.key(lessonID, stepID)
                if cards[key] != nil { continue }
                let base = ReviewCard(courseId: course.id, lessonId: lessonID, stepId: stepID, due: now)
                let q = byStep[stepID]?.quality ?? 4
                cards[key] = Scheduler.review(base, quality: q, now: now)
            }
        }
        stat.xp += xp
        stat.seconds += finished.seconds ?? 0
        days[dayKey] = stat
        return xp
    }

    /// Keeps every wrong generated task of a session with its exact wording; at most 300, the oldest leave first.
    @discardableResult
    public mutating func logMistakes(_ finished: FinishedLesson, courseId: String, topicTitles: [String: String] = [:], now: Date = Date()) -> Int {
        var added = 0
        for r in finished.results where !r.correct {
            guard let task = r.task, !task.isEmpty else { continue }
            mistakes.append(Mistake(courseId: r.courseId ?? courseId, topicId: r.topicId, topicTitle: r.topicId.flatMap { topicTitles[$0] },
                                    task: task, date: now))
            added += 1
        }
        if mistakes.count > 300 { mistakes.removeFirst(mistakes.count - 300) }
        return added
    }

    /// After a round from the mistake log: solved tasks leave it, the others stay and count one more try.
    public mutating func resolveMistakes(_ finished: FinishedLesson, now: Date = Date()) {
        for r in finished.results {
            guard let i = mistakes.firstIndex(where: { $0.id == r.stepId }) else { continue }
            if r.correct && !r.revealed {
                markResolved(mistakes[i].id)
                mistakes.remove(at: i)
            } else {
                mistakes[i].retries += 1
                mistakes[i].date = now
            }
        }
    }

    /// Takes a task out of the mistake log by hand.
    public mutating func removeMistake(id: String) {
        mistakes.removeAll { $0.id == id }
        markResolved(id)
    }

    mutating func markResolved(_ id: String) {
        guard !resolvedMistakes.contains(id) else { return }
        resolvedMistakes.append(id)
        if resolvedMistakes.count > 1000 { resolvedMistakes.removeFirst(resolvedMistakes.count - 1000) }
    }

    /// Formula cards: one per formula a finished lesson works with, first due the next day. Existing cards stay.
    @discardableResult
    public mutating func addFormulaCards(courseId: String, ids: [String], now: Date = Date()) -> Int {
        let lesson = FormulaBook.lessonID(course: courseId)
        var added = 0
        for id in ids {
            let key = ReviewCard.key(lesson, id)
            guard cards[key] == nil else { continue }
            cards[key] = ReviewCard(courseId: courseId, lessonId: lesson, stepId: id, due: now.addingTimeInterval(20 * 3600))
            added += 1
        }
        return added
    }

    public mutating func noteProgress(lessonID: String, courseID: String, step: Int, now: Date = Date()) {
        var p = lessons[lessonID] ?? LessonProgress(courseId: courseID)
        if !p.isCompleted || step > 0 { p.lastStep = step }
        p.updatedAt = now
        lessons[lessonID] = p
        lastLesson = lessonID
    }
}

/// A generated task answered wrongly, kept word for word so it can be asked again exactly as it was.
public struct Mistake: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var courseId: String
    public var topicId: String?
    public var topicTitle: String?
    /// The runtime step as JSON text.
    public var task: String
    public var date: Date
    public var retries: Int

    public init(id: String = UUID().uuidString.lowercased(), courseId: String, topicId: String?, topicTitle: String?, task: String, date: Date, retries: Int = 0) {
        self.id = id
        self.courseId = courseId
        self.topicId = topicId
        self.topicTitle = topicTitle
        self.task = task
        self.date = date
        self.retries = retries
    }

    /// The question text without Markdown and formula delimiters, for lists.
    public var preview: String {
        guard let data = task.data(using: .utf8), let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let md = obj["md"] as? String else { return "Aufgabe" }
        let plain = md.replacingOccurrences(of: "$$", with: " ").replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: "**", with: "").replacingOccurrences(of: "\\", with: " ")
            .replacingOccurrences(of: "\n", with: " ").replacingOccurrences(of: "\n", with: " ")
        return plain.split(whereSeparator: { $0 == "\n" || $0 == " " }).joined(separator: " ")
    }
}

/// How a topic area stands: not started, shaky, on the way, secure.
public enum TrafficLight: String, Sendable, Equatable {
    case none, red, yellow, green
}

extension LearnerState {
    /// Traffic light of a chapter (a Themenfeld): finished lessons, the review cards of its lessons and the training of its topics.
    /// Green: everything done and at least 80 % secure. Red: under 60 % secure. Otherwise yellow.
    public func light(for chapter: Chapter, in course: Course) -> TrafficLight {
        let ready = chapter.lessons.filter(\.isReady)
        guard !ready.isEmpty else { return .none }
        let done = ready.filter { lessons[$0.id]?.isCompleted == true }.count
        // skipped lessons count as covered, but only learning starts the light
        let settled = ready.filter { lessons[$0.id]?.isSettled == true }.count
        let started = done > 0 || ready.contains { (lessons[$0.id]?.lastStep ?? 0) > 0 }
        guard started else { return .none }
        let ids = Set(ready.map(\.id))
        let chapterCards = cards.values.filter { ids.contains($0.lessonId) }
        let failing = chapterCards.filter { $0.reps == 0 && $0.lapses > 0 }.count
        var share = chapterCards.isEmpty ? 1 : 1 - Double(failing) / Double(chapterCards.count)
        let stats = course.practiceTopics(in: chapter).compactMap { practice[PracticeStat.key(course: course.id, topic: $0.id)] }
        let tasks = stats.reduce(0) { $0 + $1.totalTasks }
        if tasks >= 6 {
            let correct = stats.reduce(0) { $0 + $1.correct.reduce(0, +) }
            share = min(share, Double(correct) / Double(tasks))
        }
        if share < 0.6 { return .red }
        if settled == ready.count && share >= 0.8 { return .green }
        return .yellow
    }
}
