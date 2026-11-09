import XCTest
@testable import LernwerkCore

final class CoreTests: XCTestCase {
    func testGitBlobHashMatchesGit() {
        // git hash-object of "hello\n"
        XCTAssertEqual(GitBlob.sha(Data("hello\n".utf8)), "ce013625030ba8dba906f756967f9e9ca394464a")
    }

    func testSchedulerGrowsIntervals() {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        var c = ReviewCard(courseId: "c", lessonId: "l", stepId: "s", due: now)
        c = Scheduler.review(c, quality: 5, now: now)
        XCTAssertEqual(c.interval, 1)
        c = Scheduler.review(c, quality: 5, now: now)
        XCTAssertEqual(c.interval, 4)
        c = Scheduler.review(c, quality: 5, now: now)
        XCTAssertGreaterThan(c.interval, 4)
        let before = c.ease
        c = Scheduler.review(c, quality: 1, now: now)
        XCTAssertEqual(c.reps, 0)
        XCTAssertEqual(c.lapses, 1)
        XCTAssertLessThan(c.ease, before)
        XCTAssertEqual(c.due.timeIntervalSince(now), 600, accuracy: 1)
    }

    func testLessonMetaReviewable() throws {
        let json = """
        {"id":"x","title":"T","steps":[{"type":"text","md":"a"},{"id":"q1","type":"choice","options":[]},
        {"type":"widget","widget":"plot","goal":{}},{"type":"widget","widget":"plot","goal":{},"review":true},
        {"id":"q2","type":"numeric","answer":1,"review":false},{"type":"sort","items":[]}]}
        """
        let meta = try JSONDecoder().decode(LessonMeta.self, from: Data(json.utf8))
        XCTAssertEqual(meta.stepIDs, ["s1", "q1", "s3", "s4", "q2", "s6"])
        XCTAssertEqual(meta.reviewableStepIDs, ["q1", "s4", "s6"])
    }

    func testRuntimeFinishedMessage() {
        let body: [String: Any] = [
            "type": "finished", "lessonId": "l1", "mode": "lesson", "score": 0.5, "seconds": 40,
            "results": [["stepId": "q1", "lessonId": "l1", "type": "choice", "correct": true, "firstTry": true, "attempts": 1, "revealed": false, "self": false]],
        ]
        guard case .finished(let f) = RuntimeMessage.parse(body) else { return XCTFail("not parsed") }
        XCTAssertEqual(f.results.first?.quality, 5)
        XCTAssertEqual(f.lessonId, "l1")
    }

    func testRecordCreatesCardsAndXP() throws {
        let course = Course(id: "c", title: "Kurs", subtitle: nil, description: nil, color: "#000000", symbol: "book",
                            vault: nil, chapters: [Chapter(id: "k", title: "K", ref: nil, lessons: [LessonRef(id: "l1", title: "L", minutes: 5, ref: nil, status: nil)])])
        let meta = try JSONDecoder().decode(LessonMeta.self, from: Data(#"{"id":"l1","title":"L","steps":[{"id":"q1","type":"choice"},{"id":"q2","type":"numeric"}]}"#.utf8))
        var state = LearnerState()
        let finished = FinishedLesson(lessonId: "l1", mode: "lesson", results: [
            StepResult(stepId: "q1", lessonId: "l1", type: "choice", correct: true, firstTry: true, attempts: 1, revealed: false),
            StepResult(stepId: "q2", lessonId: "l1", type: "numeric", correct: false, firstTry: false, attempts: 2, revealed: true),
        ], score: 0.5, seconds: 60)
        let now = Date()
        let xp = state.record(finished, course: course, meta: meta, now: now)
        XCTAssertEqual(xp, 12)
        XCTAssertEqual(state.cards.count, 2)
        XCTAssertTrue(state.lessons["l1"]?.isCompleted ?? false)
        XCTAssertEqual(state.dueCards(now: now.addingTimeInterval(11 * 60)).map(\.stepId), ["q2"])
        XCTAssertEqual(state.streak(now: now), 1)
    }

    func testEnvelopeRoundTrip() throws {
        let salt = TagwerkCrypto.randomBytes(16)
        let sealed = try TagwerkCrypto.seal(Data("geheim".utf8), passphrase: "pass", kind: .inbox, salt: salt, iterations: 100_000)
        let open = try TagwerkCrypto.open(sealed, passphrase: "pass", kind: .inbox)
        XCTAssertEqual(String(decoding: open, as: UTF8.self), "geheim")
    }

    func testNoteEventShape() throws {
        let note = LearnNote(courseId: "analysis-1", lessonId: "ana1-supremum", lessonTitle: "Supremum", stepId: "s2",
                             vaultPath: "02 Wiki/Mathematik/11 Analysis I/Supremum und Infimum.md", vaultTitle: "Supremum und Infimum", text: "Merke: sup muss nicht in M liegen.")
        let course = Course(id: "analysis-1", title: "Analysis I", subtitle: nil, description: nil, color: "#5E5CE6", symbol: "function", vault: nil, chapters: [])
        let ev = LearnBridge.noteEvent(note, course: course)
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: ev.json) as? [String: Any])
        XCTAssertEqual(obj["type"] as? String, "learn.note")
        XCTAssertEqual(obj["path"] as? String, note.vaultPath)
        XCTAssertEqual(obj["block"] as? String, "lernwerk-\(note.id)")
        XCTAssertEqual(ev.requiredFeature, "lernen")
        let fm = try XCTUnwrap(obj["frontmatter"] as? [String: Any])
        XCTAssertEqual(fm["tags"] as? [String], ["wiki02/Mathematik", "lernwerk"])
    }

    func testCourseIndexWithSubjects() throws {
        let json = #"{"schema":1,"courses":["analysis-1","stochastik"],"subjects":[{"id":"mathematik","title":"Mathematik","symbol":"sum","color":"#5E5CE6","tag":"Mathematik","courses":["analysis-1","stochastik"]}]}"#
        let index = try JSONDecoder().decode(CourseIndex.self, from: Data(json.utf8))
        XCTAssertEqual(index.subjects?.first?.courses, ["analysis-1", "stochastik"])
        let old = try JSONDecoder().decode(CourseIndex.self, from: Data(#"{"schema":1,"courses":["a"]}"#.utf8))
        XCTAssertNil(old.subjects)

        let note = LearnNote(courseId: "stochastik", lessonId: "stoch-bayes", lessonTitle: "Bayes", stepId: nil,
                             vaultPath: "02 Wiki/Mathematik/09 Stochastik/Satz von Bayes.md", vaultTitle: "Satz von Bayes", text: "x")
        let course = Course(id: "stochastik", title: "Stochastik", subtitle: nil, description: nil, color: "#AF52DE", symbol: "dice.fill", vault: nil, chapters: [])
        let ev = LearnBridge.noteEvent(note, course: course, tag: "Mathematik")
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: ev.json) as? [String: Any])
        let fm = try XCTUnwrap(obj["frontmatter"] as? [String: Any])
        XCTAssertEqual(fm["tags"] as? [String], ["wiki02/Mathematik", "lernwerk"])
    }

    func testPracticeRoundIsRecordedPerLevel() throws {
        let json = #"{"type":"finished","lessonId":null,"mode":"practice","score":0.8,"practice":{"topicId":"binomial","courseId":"stochastik","level":3},"results":[{"stepId":"p1","type":"numeric","correct":true,"firstTry":true,"attempts":1,"revealed":false,"self":false},{"stepId":"p2","type":"choice","correct":true,"firstTry":false,"attempts":2,"revealed":false,"self":false},{"stepId":"p3","type":"cloze","correct":false,"firstTry":false,"attempts":2,"revealed":true,"self":false}]}"#
        let obj = try JSONSerialization.jsonObject(with: Data(json.utf8))
        guard case .finished(let finished) = RuntimeMessage.parse(obj) else { return XCTFail("not parsed") }
        XCTAssertEqual(finished.practice?.level, 3)
        var state = LearnerState()
        let xp = state.record(finished, course: nil, meta: nil)
        XCTAssertEqual(xp, 1 * (1 + 3) + 1)
        let stat = try XCTUnwrap(state.practice["stochastik/binomial"])
        XCTAssertEqual(stat.tasks, [0, 0, 3, 0])
        XCTAssertEqual(stat.correct, [0, 0, 1, 0])
        XCTAssertTrue(stat.mastered(3))
        XCTAssertEqual(stat.highestMastered, 3)
        XCTAssertTrue(state.cards.isEmpty)
    }

    func testCourseWithPracticeTopics() throws {
        let json = #"{"id":"s","title":"S","color":"#000000","symbol":"dice","chapters":[{"id":"k","title":"K","lessons":[{"id":"a","title":"A"}]}],"practice":[{"id":"t","title":"T","after":"a","gens":["g1","g2"]}]}"#
        let course = try JSONDecoder().decode(Course.self, from: Data(json.utf8))
        XCTAssertEqual(course.practiceTopics.first?.gens, ["g1", "g2"])
        XCTAssertEqual(course.practiceTopics(in: course.chapters[0]).count, 1)
    }

    func testNewTaskTypesAreReviewed() throws {
        let json = """
        {"id":"x","title":"T","steps":[{"id":"a","type":"spot","lines":["1","2"],"answer":1},{"id":"b","type":"proof","steps":["1","2"]},
        {"id":"c","type":"estimate","min":0,"max":1,"answer":0.5},{"id":"d","type":"timeline","items":[]},{"id":"e","type":"quadrant","items":[]},
        {"id":"f","type":"anim","widget":"worldmap"}]}
        """
        let meta = try JSONDecoder().decode(LessonMeta.self, from: Data(json.utf8))
        XCTAssertEqual(meta.reviewableStepIDs, ["a", "b", "c", "d", "e"])
    }

    func testPathMessages() {
        XCTAssertEqual(RuntimeMessage.parse(["type": "open", "courseId": "ethnologie", "lessonId": "eth-gabe"]), .open(courseId: "ethnologie", lessonId: "eth-gabe"))
        XCTAssertEqual(RuntimeMessage.parse(["type": "practice", "courseId": "stochastik", "topicId": "schaetzen", "level": 7]), .practice(courseId: "stochastik", topicId: "schaetzen", level: 4))
        XCTAssertEqual(RuntimeMessage.parse(["type": "open", "courseId": "x"]), .unknown)
    }

    func testIgnoredFiles() {
        XCTAssertTrue(ContentSync.isIgnored("runtime/dev.html"))
        XCTAssertTrue(ContentSync.isIgnored("runtime/dev-frame.html"))
        XCTAssertFalse(ContentSync.isIgnored("runtime/lw.js"))
        XCTAssertFalse(ContentSync.isIgnored("courses/analysis-1/course.json"))
    }
}
