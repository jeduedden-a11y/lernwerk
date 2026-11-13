import Foundation
import Observation
import SwiftUI
import LernwerkCore

enum Phase: Equatable {
    case idle
    case busy
    case failed(String)
}

struct VaultSettings: Codable, Equatable {
    var owner = "jeduedden-a11y"
    var repo = "tagwerk-daten"
    var branch = "main"
}

struct ReviewItem: Codable, Equatable, Hashable {
    var lessonUrl: String
    var stepId: String
    /// A task from the mistake log comes complete (runtime JSON) instead of being looked up in a lesson.
    var step: String? = nil
    var from: String? = nil

    /// What the runtime gets in options.items.
    var json: [String: Any] {
        var d: [String: Any] = ["lessonUrl": lessonUrl, "stepId": stepId]
        if let step, let data = step.data(using: .utf8), let obj = try? JSONSerialization.jsonObject(with: data) { d["step"] = obj }
        if let from { d["from"] = from }
        return d
    }
}

/// One generator with the level and topic it is used for in an exam or the daily mix.
struct GenPick: Equatable, Hashable {
    var gen: String
    var level: Int
    var topicId: String
    var topicTitle: String
    var courseId: String

    var json: [String: Any] { ["gen": gen, "level": level, "topicId": topicId, "topicTitle": topicTitle, "courseId": courseId] }
}

/// One run of the lesson player: a single lesson, a mixed review, a training round, an exam or the daily mix.
struct LessonSession: Identifiable, Equatable {
    enum Mode: Equatable { case lesson, review, practice, exam, mix }
    let id = UUID()
    var mode: Mode
    var course: Course?
    var lesson: LessonRef?
    var meta: LessonMeta?
    var reviewItems: [ReviewItem] = []
    var resumeAt: Int = 0
    var title: String
    var accentHex: String
    var topic: PracticeTopic? = nil
    var level: Int = 1
    /// Exam and daily mix: generated tasks with their topics.
    var picks: [GenPick] = []
    var chapterId: String? = nil
    var taskCount: Int = 0
    var minutes: Int = 0
    /// "tmua" for a paper: answers A to H, no calculator, an estimated score at the end.
    var format: String? = nil
    /// Wrong generated tasks come back with their wording, for the mistake log.
    var logMistakes = false
    /// A round of tasks from the mistake log: solved ones leave it.
    var mistakeRound = false
    /// Seeds the generated tasks: every run of a lesson or training round brings new numbers.
    var seed: Int = Int.random(in: 1...999_983)
}

enum AppTab: String, Hashable {
    case learn, review, notes, stats, search
}

/// One card of the "Als Nächstes" shelf on the home screen.
struct UpNextItem: Identifiable, Hashable {
    var course: Course
    var lesson: LessonRef
    var id: String { lesson.id }
}

@MainActor
@Observable
final class AppModel {
    /// Bumped whenever the native bridge to the runtime changes (runtime.json minShell compares against it).
    static let shellVersion = 1

    private(set) var courses: [Course] = []
    /// Subject folders (Mathematik, Informatik, ...) as content/courses/index.json defines them.
    private(set) var subjects: [Subject] = []
    var state: LearnerState
    var contentPhase: Phase = .idle
    var vaultPhase: Phase = .idle
    var runtimeHeld = false
    var lastContentSync: Date?
    var presentedLesson: LessonSession?
    var selectedTab: AppTab = .learn
    var toast: String?
    /// Read-only offline copy of the vault's wiki. Tagwerk Bridge uploads it for Tagwerk; Lernwerk reads the same copy.
    let wiki = WikiStore()
    /// A wiki note the Vault tab should open next, e.g. from a lesson.
    var pendingVaultNote: String?
    private(set) var vault: VaultSettings
    private(set) var contentSource: ContentSource
    let isDemo: Bool

    @ObservationIgnored let locator: ContentLocator
    @ObservationIgnored private var metaCache: [String: LessonMeta] = [:]
    @ObservationIgnored private var formulaCache: [String: FormulaBook?] = [:]
    @ObservationIgnored private var saveTask: Task<Void, Never>?
    @ObservationIgnored private let keychain = Keychain()
    @ObservationIgnored private let stateURL: URL
    @ObservationIgnored private let cacheRoot: URL

    init(demo: Bool) {
        isDemo = demo
        let fm = FileManager.default
        let support = (try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
            ?? fm.temporaryDirectory
        let base = support.appendingPathComponent("Lernwerk", isDirectory: true)
        try? fm.createDirectory(at: base, withIntermediateDirectories: true)
        stateURL = base.appendingPathComponent(demo ? "state-demo.json" : "state.json")
        cacheRoot = base.appendingPathComponent("Content", isDirectory: true)
        locator = ContentLocator(cacheRoot: demo ? base.appendingPathComponent("NoCache") : cacheRoot,
                                 bundleRoot: Bundle.main.url(forResource: "Content", withExtension: nil))
        let defaults = UserDefaults.standard
        vault = (defaults.data(forKey: "vault").flatMap { try? JSONDecoder().decode(VaultSettings.self, from: $0) }) ?? VaultSettings()
        contentSource = (defaults.data(forKey: "contentSource").flatMap { try? JSONDecoder().decode(ContentSource.self, from: $0) }) ?? ContentSource()
        if demo {
            state = LearnerState()
        } else if let data = try? Data(contentsOf: stateURL), let s = try? JSONDecoder().decode(LearnerState.self, from: data) {
            state = s
        } else {
            state = LearnerState()
        }
        let manifest = ContentSync(source: contentSource, root: cacheRoot, shellVersion: Self.shellVersion).loadManifest()
        lastContentSync = manifest.syncedAt
        runtimeHeld = manifest.runtimeHeld
        reloadCourses()
        refreshSecrets()
        if demo { DemoData.fill(self) }
        let wiki = self.wiki
        ContentSchemeHandler.vaultAsset = { name in wiki.asset(named: name) }
    }

    // MARK: content

    func reloadCourses() {
        metaCache = [:]
        formulaCache = [:]
        wikiLessonIndex = nil
        guard let index = locator.decode(CourseIndex.self, "courses/index.json") else { courses = []; subjects = []; return }
        courses = index.courses.compactMap { locator.decode(Course.self, "courses/\($0)/course.json") }
        let known = Set(courses.map(\.id))
        var groups = (index.subjects ?? []).map { s -> Subject in
            var s = s
            s.courses = s.courses.filter { known.contains($0) }
            return s
        }.filter { !$0.courses.isEmpty }
        // courses no folder claims still show up, in a folder of their own
        let grouped = Set(groups.flatMap(\.courses))
        let rest = courses.map(\.id).filter { !grouped.contains($0) }
        if !rest.isEmpty {
            groups.append(Subject(id: "_weitere", title: groups.isEmpty ? "Kurse" : "Weitere Kurse", symbol: "books.vertical.fill",
                                  color: "#8E8E93", courses: rest))
        }
        subjects = groups
    }

    func course(_ id: String) -> Course? { courses.first { $0.id == id } }

    func courses(in subject: Subject) -> [Course] { subject.courses.compactMap { course($0) } }

    func subject(of course: Course) -> Subject? { subjects.first { $0.courses.contains(course.id) } }

    func progress(of subject: Subject) -> Double {
        let list = courses(in: subject)
        let ready = list.reduce(0) { $0 + $1.readyLessons.count }
        let done = list.reduce(0) { $0 + state.settledCount(in: $1) }
        return ready == 0 ? 0 : Double(done) / Double(ready)
    }

    func meta(_ course: Course, _ lesson: LessonRef) -> LessonMeta? {
        let key = course.lessonPath(lesson.id)
        if let m = metaCache[key] { return m }
        let m = locator.decode(LessonMeta.self, key)
        metaCache[key] = m
        return m
    }

    /// Review cards of formulas name the formula book in place of a lesson.
    func lessonURL(_ course: Course, _ lessonID: String) -> String {
        FormulaBook.isFormulaLesson(lessonID) ? "lw://app/" + FormulaBook.path(course: course.id) : "lw://app/" + course.lessonPath(lessonID)
    }

    // MARK: formulas

    /// courses/<id>/formeln.json, if the course has one.
    func formulaBook(_ course: Course) -> FormulaBook? {
        if let cached = formulaCache[course.id] { return cached }
        let book = locator.decode(FormulaBook.self, FormulaBook.path(course: course.id))
        formulaCache[course.id] = .some(book)
        return book
    }

    /// Every formula book; the runtime loads them before a start, so the training and the formula cards find them.
    var formulaURLs: [String] { courses.filter { formulaBook($0) != nil }.map { "lw://app/" + FormulaBook.path(course: $0.id) } }

    /// Formula cards of a course that are due or waiting.
    func formulaCardCount(_ course: Course) -> Int {
        let lesson = FormulaBook.lessonID(course: course.id)
        return state.cards.values.filter { $0.lessonId == lesson }.count
    }

    /// Puts every formula of the course into the review, not only those of finished lessons.
    func addAllFormulaCards(_ course: Course) {
        guard let book = formulaBook(course) else { return }
        let added = state.addFormulaCards(courseId: course.id, ids: book.formulas.map(\.id))
        scheduleSave()
        toast = added == 0 ? "Alle Formeln sind schon in der Wiederholung" : (added == 1 ? "1 Formelkarte kommt morgen dran" : "\(added) Formelkarten kommen ab morgen dran")
    }

    // MARK: vault wiki

    var isConnected: Bool { isVaultConfigured }

    func flash(_ text: String) { toast = text }

    func syncWiki(force: Bool = false) async {
        guard isVaultConfigured else { return }
        let gh = GitHubClient(config: GitHubConfig(owner: vault.owner, repo: vault.repo, branch: vault.branch), token: token)
        await wiki.sync(github: gh, passphrase: passphrase, force: force)
    }

    /// Lesson links name vault paths ("02 Wiki/Physik/…/Kinematik.md"); the wiki copy starts below its root folder.
    func wikiPath(forVaultPath vaultPath: String) -> String {
        let root = wiki.root.hasSuffix("/") ? wiki.root : wiki.root + "/"
        return vaultPath.hasPrefix(root) ? String(vaultPath.dropFirst(root.count)) : vaultPath
    }

    @ObservationIgnored private var wikiLessonIndex: [String: [(course: Course, lesson: LessonRef)]]?

    /// Lessons that link a wiki note, in course order.
    func lessons(forWikiPath path: String) -> [(course: Course, lesson: LessonRef)] {
        if wikiLessonIndex == nil {
            var index: [String: [(course: Course, lesson: LessonRef)]] = [:]
            for course in courses {
                for lesson in course.readyLessons {
                    for link in meta(course, lesson)?.vault ?? [] {
                        index[wikiPath(forVaultPath: link.path).lowercased(), default: []].append((course: course, lesson: lesson))
                    }
                }
            }
            wikiLessonIndex = index
        }
        return wikiLessonIndex?[path.lowercased()] ?? []
    }

    /// The first vault note of a lesson that the offline copy has, as a wiki path.
    func wikiNote(for course: Course, _ lesson: LessonRef) -> String? {
        wiki.loadIfNeeded()
        for link in meta(course, lesson)?.vault ?? [] {
            let p = wikiPath(forVaultPath: link.path)
            if wiki.note(p) != nil { return p }
        }
        return nil
    }

    /// Downloads new lessons and runtime files from GitHub.
    func syncContent(force: Bool = false) async {
        guard !isDemo, contentPhase != .busy else { return }
        contentPhase = .busy
        let sync = ContentSync(source: contentSource, root: cacheRoot, shellVersion: Self.shellVersion)
        do {
            let report = try await sync.sync(force: force)
            runtimeHeld = report.runtimeHeld
            lastContentSync = Date()
            contentPhase = .idle
            if !report.unchanged {
                reloadCourses()
                toast = report.downloaded == 1 ? "1 Datei aktualisiert" : "\(report.downloaded) Dateien aktualisiert"
            }
        } catch {
            contentPhase = .failed(error.localizedDescription)
        }
    }

    // MARK: progress

    var todayXP: Int { state.xp(on: DayKey.key(for: Date())) }
    var streak: Int { state.streak() }
    var dueCards: [ReviewCard] { state.dueCards() }

    /// Progress along the path: finished and skipped lessons.
    func progress(of course: Course) -> Double {
        let ready = course.readyLessons.count
        return ready == 0 ? 0 : Double(state.settledCount(in: course)) / Double(ready)
    }

    /// The lesson to continue: the one last opened if neither finished nor skipped, else the next open lesson in that course.
    var continueTarget: (course: Course, lesson: LessonRef)? {
        if let last = state.lastLesson {
            for c in courses {
                guard let idx = c.lessons.firstIndex(where: { $0.id == last }) else { continue }
                if !state.isSettled(last) { return (c, c.lessons[idx]) }
                if let next = c.lessons[(idx + 1)...].first(where: { $0.isReady && !state.isSettled($0.id) }) { return (c, next) }
            }
        }
        for c in courses {
            if let next = c.readyLessons.first(where: { !state.isSettled($0.id) }) { return (c, next) }
        }
        return nil
    }

    /// The home shelf: the lesson to continue first, then the next open lesson of every other course.
    var upNext: [UpNextItem] {
        var list: [UpNextItem] = []
        if let first = continueTarget { list.append(UpNextItem(course: first.course, lesson: first.lesson)) }
        for c in courses where !list.contains(where: { $0.course.id == c.id }) {
            if let next = c.readyLessons.first(where: { !state.isSettled($0.id) }) {
                list.append(UpNextItem(course: c, lesson: next))
            }
        }
        return Array(list.prefix(6))
    }

    // MARK: skipping

    /// Skips a lesson the learner already knows: the path moves on and its training topics open; no review cards, no XP.
    func skip(_ course: Course, _ lesson: LessonRef) {
        state.skip(lessonID: lesson.id, courseID: course.id)
        scheduleSave()
    }

    func unskip(_ lesson: LessonRef) {
        state.unskip(lessonID: lesson.id)
        scheduleSave()
    }

    /// Open (neither finished nor skipped) ready lessons of a chapter.
    func openLessons(_ chapter: Chapter) -> [LessonRef] {
        chapter.lessons.filter { $0.isReady && !state.isSettled($0.id) }
    }

    func skipChapter(_ course: Course, _ chapter: Chapter) {
        for lesson in openLessons(chapter) { state.skip(lessonID: lesson.id, courseID: course.id) }
        scheduleSave()
    }

    func unskipChapter(_ chapter: Chapter) {
        for lesson in chapter.lessons { state.unskip(lessonID: lesson.id) }
        scheduleSave()
    }

    func start(_ course: Course, _ lesson: LessonRef, fromStart: Bool = false) {
        guard lesson.isReady else { return }
        let p = state.lessons[lesson.id]
        let resume = fromStart || p?.isCompleted == true ? 0 : (p?.lastStep ?? 0)
        presentedLesson = LessonSession(mode: .lesson, course: course, lesson: lesson, meta: meta(course, lesson), resumeAt: resume,
                                        title: lesson.title, accentHex: course.color)
        state.lastLesson = lesson.id
        scheduleSave()
    }

    func startReview(limit: Int = 12, course: Course? = nil) {
        let cards = dueCards.filter { course == nil || $0.courseId == course?.id }.prefix(limit)
        guard !cards.isEmpty else { return }
        let items = cards.compactMap { card -> ReviewItem? in
            guard let c = self.course(card.courseId) else { return nil }
            return ReviewItem(lessonUrl: lessonURL(c, card.lessonId), stepId: card.stepId)
        }
        presentedLesson = LessonSession(mode: .review, course: course, reviewItems: items, title: "Wiederholung",
                                        accentHex: course?.color ?? courses.first?.color ?? "#5E5CE6")
    }

    // MARK: training

    /// Unlocked when the lesson it belongs to is finished or skipped (or when it names none).
    func isUnlocked(_ topic: PracticeTopic) -> Bool {
        guard let after = topic.after else { return true }
        return state.isSettled(after)
    }

    func practiceStat(_ course: Course, _ topic: PracticeTopic) -> PracticeStat {
        state.practice[PracticeStat.key(course: course.id, topic: topic.id)] ?? PracticeStat()
    }

    /// All unlocked topics, most recently trained first, then in course order.
    var unlockedTopics: [(course: Course, topic: PracticeTopic)] {
        var all: [(course: Course, topic: PracticeTopic)] = []
        for c in courses { for t in c.practiceTopics where isUnlocked(t) { all.append((course: c, topic: t)) } }
        let indexed = Array(all.enumerated())
        let sorted = indexed.sorted { a, b in
            let la = practiceStat(a.element.course, a.element.topic).lastAt, lb = practiceStat(b.element.course, b.element.topic).lastAt
            switch (la, lb) {
            case let (x?, y?): return x > y
            case (_?, nil): return true
            case (nil, _?): return false
            default: return a.offset < b.offset
            }
        }
        return sorted.map { $0.element }
    }

    func lessonTitle(_ id: String?) -> String? {
        guard let id else { return nil }
        for c in courses { if let l = c.lessons.first(where: { $0.id == id }) { return l.title } }
        return nil
    }

    /// Progress for the learning path page of the runtime (runtime/overview.js).
    func overviewProgress() -> [String: Any] {
        var done: [String] = []
        var skipped: [String] = []
        var started: [String: Int] = [:]
        for (id, p) in state.lessons {
            if p.isCompleted { done.append(id) } else if p.isSkipped { skipped.append(id) } else if p.lastStep > 0 { started[id] = p.lastStep }
        }
        var practice: [String: Int] = [:]
        for (key, stat) in state.practice where stat.highestMastered > 0 { practice[key] = stat.highestMastered }
        return ["done": done.sorted(), "skipped": skipped.sorted(), "started": started, "practice": practice, "streak": streak]
    }

    /// Lesson or training round chosen on the learning path page.
    func openFromPath(courseId: String, lessonId: String) {
        guard let c = course(courseId), let l = c.lessons.first(where: { $0.id == lessonId }) else { return }
        start(c, l)
    }

    func practiceFromPath(courseId: String, topicId: String, level: Int) {
        guard let c = course(courseId), let t = c.practiceTopics.first(where: { $0.id == topicId }), isUnlocked(t) else { return }
        startPractice(c, t, level: level)
    }

    func startPractice(_ course: Course, _ topic: PracticeTopic, level: Int) {
        var session = LessonSession(mode: .practice, course: course, title: topic.title, accentHex: course.color,
                                    topic: topic, level: max(1, min(4, level)))
        session.logMistakes = course.mistakeLog == true
        presentedLesson = session
    }

    // MARK: papers and the mistake log (TMUA)

    /// A timed paper: tasks from its topics, each generator about equally often, on the paper's level.
    func startPaper(_ course: Course, _ paper: Paper) {
        let topics = paper.topics.compactMap { id in course.practiceTopics.first { $0.id == id } }
        let picks = topics.flatMap { t in
            t.gens.map { GenPick(gen: $0, level: paper.level ?? 4, topicId: t.id, topicTitle: t.title, courseId: course.id) }
        }
        guard !picks.isEmpty else { return }
        var session = LessonSession(mode: .exam, course: course, title: paper.title, accentHex: course.color, picks: picks,
                                    taskCount: paper.count, minutes: paper.minutes)
        session.format = "tmua"
        session.logMistakes = course.mistakeLog == true
        presentedLesson = session
    }

    /// Papers of a course already written, newest first.
    func paperHistory(_ course: Course, _ paper: Paper) -> [ExamRecord] {
        state.exams.filter { $0.courseId == course.id && $0.title == paper.title }.reversed()
    }

    func mistakes(in course: Course) -> [Mistake] { state.mistakes.filter { $0.courseId == course.id } }

    /// Asks up to twelve logged tasks again, the oldest first, exactly as they were.
    func startMistakeRound(_ course: Course) {
        let list = mistakes(in: course).sorted { $0.date < $1.date }.prefix(12)
        guard !list.isEmpty else { return }
        let items = list.map { m in
            ReviewItem(lessonUrl: "", stepId: m.id, step: m.task, from: "Fehlerprotokoll" + (m.topicTitle.map { " · " + $0 } ?? ""))
        }
        var session = LessonSession(mode: .review, course: course, reviewItems: Array(items), title: "Fehlerprotokoll", accentHex: course.color)
        session.mistakeRound = true
        presentedLesson = session
    }

    func removeMistake(_ mistake: Mistake) {
        state.mistakes.removeAll { $0.id == mistake.id }
        scheduleSave()
    }

    /// The stage of a dated course plan that runs this week.
    func currentChapter(_ course: Course, on date: Date = Date()) -> Chapter? {
        course.chapters.first { $0.isCurrent(on: date) }
    }

    // MARK: exams and the daily mix

    /// The level a topic is asked on in exams: Mittel at first, one above the highest mastered level later.
    func examLevel(_ course: Course, _ topic: PracticeTopic) -> Int {
        let mastered = practiceStat(course, topic).highestMastered
        return max(2, min(4, mastered + 1))
    }

    /// Unlocked training topics of a chapter, or of the whole course.
    func examTopics(_ course: Course, chapter: Chapter? = nil) -> [PracticeTopic] {
        let topics = chapter.map { course.practiceTopics(in: $0) } ?? course.practiceTopics
        return topics.filter(isUnlocked)
    }

    /// What an exam covers: the unlocked topics, two tasks per topic (6 to 12), 90 seconds per task.
    func examPlan(_ course: Course, chapter: Chapter? = nil) -> (topics: [PracticeTopic], count: Int, minutes: Int) {
        let topics = examTopics(course, chapter: chapter)
        let count = min(12, max(6, 2 * topics.count))
        return (topics, count, Int((Double(count) * 1.5).rounded(.up)))
    }

    /// Earlier exams over the same chapter (or the whole course), newest first.
    func examHistory(_ course: Course, chapter: Chapter? = nil) -> [ExamRecord] {
        state.exams.filter { $0.courseId == course.id && $0.chapterId == chapter?.id }.reversed()
    }

    func startExam(_ course: Course, chapter: Chapter? = nil) {
        let plan = examPlan(course, chapter: chapter)
        guard !plan.topics.isEmpty else { return }
        let picks = plan.topics.flatMap { t in
            t.gens.map { GenPick(gen: $0, level: examLevel(course, t), topicId: t.id, topicTitle: t.title, courseId: course.id) }
        }
        presentedLesson = LessonSession(mode: .exam, course: course, title: chapter.map { "Klausur: \($0.title)" } ?? "Klausur: \(course.title)",
                                        accentHex: course.color, picks: picks, chapterId: chapter?.id, taskCount: plan.count, minutes: plan.minutes)
    }

    /// What the daily mix would contain: up to six due repetitions and up to six new tasks, weak topics first.
    func mixPlan() -> (items: [ReviewItem], picks: [GenPick]) {
        let items = dueCards.prefix(6).compactMap { card -> ReviewItem? in
            guard let c = course(card.courseId) else { return nil }
            return ReviewItem(lessonUrl: lessonURL(c, card.lessonId), stepId: card.stepId)
        }
        let weak = Set(weakSpots.compactMap { spot -> String? in
            if case .topic(let c, let t) = spot.kind { return PracticeStat.key(course: c, topic: t) }
            return nil
        })
        let ranked = unlockedTopics.enumerated().sorted { a, b in
            let wa = weak.contains(PracticeStat.key(course: a.element.course.id, topic: a.element.topic.id))
            let wb = weak.contains(PracticeStat.key(course: b.element.course.id, topic: b.element.topic.id))
            if wa != wb { return wa }
            // otherwise the topics trained longest ago come first
            let la = practiceStat(a.element.course, a.element.topic).lastAt ?? .distantPast
            let lb = practiceStat(b.element.course, b.element.topic).lastAt ?? .distantPast
            return la != lb ? la < lb : a.offset < b.offset
        }.map { $0.element }
        let picks = ranked.prefix(6).compactMap { entry -> GenPick? in
            guard let gen = entry.topic.gens.randomElement() else { return nil }
            let stat = practiceStat(entry.course, entry.topic)
            let level = max(1, min(4, stat.highestMastered + 1))
            return GenPick(gen: gen, level: level, topicId: entry.topic.id, topicTitle: "\(entry.course.title) · \(entry.topic.title)", courseId: entry.course.id)
        }
        return (items, picks)
    }

    var canStartMix: Bool { !dueCards.isEmpty || !unlockedTopics.isEmpty }

    func startMix() {
        let plan = mixPlan()
        guard !plan.items.isEmpty || !plan.picks.isEmpty else { return }
        presentedLesson = LessonSession(mode: .mix, reviewItems: plan.items, title: "Tagesmix", accentHex: courses.first?.color ?? "#5E5CE6",
                                        picks: plan.picks, taskCount: plan.items.count + plan.picks.count)
    }

    /// Topics and lessons that most need practice.
    var weakSpots: [WeakSpot] { state.weakSpots(courses: courses) }

    // MARK: links for shortcuts on the home screen

    /// lernwerk://weiter, lernwerk://wiederholen, lernwerk://tagesmix
    func open(_ url: URL) {
        guard url.scheme == "lernwerk", presentedLesson == nil else { return }
        switch url.host() ?? "" {
        case "wiederholen":
            if dueCards.isEmpty { selectedTab = .review } else { startReview() }
        case "tagesmix":
            selectedTab = .review
            startMix()
        default:
            selectedTab = .learn
            if let target = continueTarget { start(target.course, target.lesson) }
        }
    }

    func noteProgress(_ session: LessonSession, step: Int) {
        guard session.mode == .lesson, let course = session.course, let lesson = session.lesson else { return }
        state.noteProgress(lessonID: lesson.id, courseID: course.id, step: step)
        scheduleSave()
    }

    @discardableResult
    func finish(_ session: LessonSession, result: FinishedLesson) -> Int {
        let xp = state.record(result, course: session.course, meta: session.meta)
        // the formulas of a finished lesson become cards of their own, asked in changing directions
        if session.mode == .lesson, let course = session.course, let lesson = session.lesson, let book = formulaBook(course) {
            state.addFormulaCards(courseId: course.id, ids: book.formulas(forLesson: lesson.id).map(\.id))
        }
        if session.mistakeRound {
            state.resolveMistakes(result)
        } else if session.logMistakes, let course = session.course {
            let titles = Dictionary(course.practiceTopics.map { ($0.id, $0.title) }, uniquingKeysWith: { a, _ in a })
            let added = state.logMistakes(result, courseId: course.id, topicTitles: titles)
            if added > 0 { toast = added == 1 ? "1 Aufgabe im Fehlerprotokoll" : "\(added) Aufgaben im Fehlerprotokoll" }
        }
        scheduleSave()
        return xp
    }

    // MARK: notes

    func notes(for lessonID: String) -> [LearnNote] { state.notes.filter { $0.lessonId == lessonID } }

    func vaultTarget(course: Course, lesson: LessonRef, meta: LessonMeta?) -> VaultLink {
        if let link = meta?.vault?.first(where: { $0.path.hasPrefix("02 Wiki/") }) { return link }
        return VaultLink(path: LearnBridge.fallbackPath(course: course, lessonTitle: lesson.title), title: lesson.title)
    }

    func saveNote(course: Course, lesson: LessonRef, meta: LessonMeta?, stepID: String?, text: String, existing: LearnNote?) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        var note: LearnNote
        if var e = existing {
            e.text = trimmed
            e.updatedAt = Date()
            note = e
        } else {
            guard !trimmed.isEmpty else { return }
            let target = vaultTarget(course: course, lesson: lesson, meta: meta)
            note = LearnNote(courseId: course.id, lessonId: lesson.id, lessonTitle: lesson.title, stepId: stepID,
                             vaultPath: target.path, vaultTitle: target.title, text: trimmed)
        }
        if let old = note.queuedEventID { state.outbox.removeAll { $0.id == old } }
        let event = LearnBridge.noteEvent(note, course: course, tag: subject(of: course)?.tag)
        state.outbox.append(event)
        note.queuedEventID = event.id
        if let idx = state.notes.firstIndex(where: { $0.id == note.id }) { state.notes[idx] = note } else { state.notes.insert(note, at: 0) }
        scheduleSave()
        Task { await pushNotes(quiet: true) }
    }

    func deleteNote(_ note: LearnNote) {
        if let old = note.queuedEventID { state.outbox.removeAll { $0.id == old } }
        if note.sentText != nil {
            // an empty text removes the managed block from the vault note
            var gone = note
            gone.text = ""
            let c = course(note.courseId)
            state.outbox.append(LearnBridge.noteEvent(gone, course: c, tag: c.flatMap { subject(of: $0)?.tag }))
        }
        state.notes.removeAll { $0.id == note.id }
        scheduleSave()
    }

    // MARK: vault bridge

    var token: String {
        get { keychain.get(SecretKey.githubToken) ?? "" }
        set {
            keychain.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), for: SecretKey.githubToken)
            refreshSecrets()
        }
    }

    var passphrase: String {
        get { keychain.get(SecretKey.passphrase) ?? "" }
        set {
            keychain.set(newValue, for: SecretKey.passphrase)
            refreshSecrets()
        }
    }

    /// Token and passphrase are in the keychain; cached so list rows do not read the keychain on every render.
    private(set) var hasSecrets = false

    private func refreshSecrets() {
        hasSecrets = !(keychain.get(SecretKey.githubToken) ?? "").isEmpty && !(keychain.get(SecretKey.passphrase) ?? "").isEmpty
    }

    var isVaultConfigured: Bool { !isDemo && hasSecrets && !vault.owner.isEmpty && !vault.repo.isEmpty }

    /// For the interface: the demo shows a connected vault without touching the network.
    var vaultLooksConnected: Bool { isDemo || isVaultConfigured }

    var notesWaiting: Int { state.outbox.count }

    var bridgeReady: Bool { state.bridgeFeatures.contains(LearnBridge.feature) }

    private func connection() -> VaultConnection? {
        guard isVaultConfigured else { return nil }
        let gh = GitHubClient(config: GitHubConfig(owner: vault.owner, repo: vault.repo, branch: vault.branch), token: token)
        let salt = Data(base64Encoded: state.deviceSalt) ?? TagwerkCrypto.randomBytes(16)
        return VaultConnection(github: gh, passphrase: passphrase, deviceSalt: salt)
    }

    /// Checks token, repo and passphrase, and reads which features the vault plugin supports.
    func testVault() async -> String {
        guard let conn = connection() else { return "Bitte Benutzername, Repo, Token und Passphrase eintragen." }
        vaultPhase = .busy
        do {
            try await conn.github.checkRepo()
            guard let status = try await conn.status() else {
                vaultPhase = .idle
                return "Verbunden, aber noch kein Stand vom Plugin. Läuft Obsidian mit Tagwerk Bridge?"
            }
            state.bridgeFeatures = status.features
            state.bridgePluginVersion = status.pluginVersion
            vaultPhase = .idle
            scheduleSave()
            let version = status.pluginVersion ?? "?"
            return bridgeReady ? "Verbunden. Tagwerk Bridge \(version) nimmt Lernnotizen an." :
                "Verbunden mit Tagwerk Bridge \(version). Für Lernnotizen wird Version 1.3 gebraucht, bis dahin warten Notizen auf dem iPhone."
        } catch {
            vaultPhase = .failed(error.localizedDescription)
            return error.localizedDescription
        }
    }

    func pushNotes(quiet: Bool = false) async {
        guard !state.outbox.isEmpty, let conn = connection(), vaultPhase != .busy else { return }
        vaultPhase = .busy
        do {
            if let status = try await conn.status() {
                state.bridgeFeatures = status.features
                state.bridgePluginVersion = status.pluginVersion
            }
            let features = Set(state.bridgeFeatures)
            let events = state.outbox.filter { ev in ev.requiredFeature.map { features.contains($0) } ?? true }
            guard !events.isEmpty else {
                vaultPhase = .idle
                if !quiet { toast = "Notizen warten auf Tagwerk Bridge 1.3 in Obsidian" }
                return
            }
            try await conn.send(events)
            let sent = Set(events.map(\.id))
            state.outbox.removeAll { sent.contains($0.id) }
            for i in state.notes.indices where state.notes[i].queuedEventID.map({ sent.contains($0) }) ?? false {
                state.notes[i].sentText = state.notes[i].text
                state.notes[i].queuedEventID = nil
            }
            state.lastPush = Date()
            state.lastSyncError = nil
            vaultPhase = .idle
            if !quiet { toast = events.count == 1 ? "1 Notiz an den Vault gesendet" : "\(events.count) Notizen an den Vault gesendet" }
            scheduleSave()
        } catch {
            state.lastSyncError = error.localizedDescription
            vaultPhase = .failed(error.localizedDescription)
            scheduleSave()
        }
    }

    // MARK: persistence

    func update(vault newValue: VaultSettings) {
        vault = newValue
        saveSettings()
    }

    func update(contentSource newValue: ContentSource) {
        contentSource = newValue
        saveSettings()
    }

    private func saveSettings() {
        let defaults = UserDefaults.standard
        defaults.set(try? JSONEncoder().encode(vault), forKey: "vault")
        defaults.set(try? JSONEncoder().encode(contentSource), forKey: "contentSource")
    }

    func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 600_000_000)
            guard !Task.isCancelled else { return }
            self?.saveNow()
        }
    }

    func saveNow() {
        guard !isDemo else { return }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        if let data = try? encoder.encode(state) { try? data.write(to: stateURL, options: .atomic) }
    }

    func resetProgress() {
        let keep = state
        state = LearnerState()
        state.notes = keep.notes
        state.outbox = keep.outbox
        state.dailyGoal = keep.dailyGoal
        state.deviceSalt = keep.deviceSalt
        saveNow()
    }
}
