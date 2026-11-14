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
        let json = ##"{"schema":1,"courses":["analysis-1","stochastik"],"subjects":[{"id":"mathematik","title":"Mathematik","symbol":"sum","color":"#5E5CE6","tag":"Mathematik","courses":["analysis-1","stochastik"]}]}"##
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
        let json = ##"{"id":"s","title":"S","color":"#000000","symbol":"dice","chapters":[{"id":"k","title":"K","lessons":[{"id":"a","title":"A"}]}],"practice":[{"id":"t","title":"T","after":"a","gens":["g1","g2"]}]}"##
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

    func testExamIsStoredPerTopic() {
        var state = LearnerState()
        let finished = FinishedLesson(lessonId: nil, mode: "exam", results: [
            StepResult(stepId: "e1", lessonId: nil, type: "numeric", correct: true, firstTry: true, attempts: 1, revealed: false,
                       topicId: "laplace", courseId: "stochastik", level: 2),
            StepResult(stepId: "e2", lessonId: nil, type: "choice", correct: false, firstTry: false, attempts: 1, revealed: false,
                       topicId: "laplace", courseId: "stochastik", level: 2, skipped: true),
            StepResult(stepId: "e3", lessonId: nil, type: "numeric", correct: true, firstTry: true, attempts: 1, revealed: false,
                       topicId: "abzaehlen", courseId: "stochastik", level: 2),
        ], score: 2.0 / 3.0, seconds: 120, exam: ExamInfo(title: "Klausur", courseId: "stochastik"))
        let xp = state.record(finished, course: nil, meta: nil)
        XCTAssertEqual(xp, 6)
        XCTAssertEqual(state.exams.count, 1)
        XCTAssertEqual(state.exams[0].correct, 2)
        XCTAssertEqual(state.exams[0].topics["laplace"], Tally(correct: 1, total: 2))
        XCTAssertEqual(state.exams[0].topics["abzaehlen"], Tally(correct: 1, total: 1))
    }

    func testMixMovesCardsAndCountsTraining() {
        var state = LearnerState()
        let now = Date()
        state.cards[ReviewCard.key("l1", "q1")] = ReviewCard(courseId: "c", lessonId: "l1", stepId: "q1", due: now)
        let finished = FinishedLesson(lessonId: nil, mode: "mix", results: [
            StepResult(stepId: "q1", lessonId: "l1", type: "choice", correct: true, firstTry: true, attempts: 1, revealed: false),
            StepResult(stepId: "m1", lessonId: nil, type: "numeric", correct: true, firstTry: true, attempts: 1, revealed: false,
                       topicId: "t", courseId: "c", level: 3),
        ], score: 1)
        state.record(finished, course: nil, meta: nil, now: now)
        XCTAssertGreaterThan(state.cards[ReviewCard.key("l1", "q1")]?.due ?? now, now)
        XCTAssertEqual(state.practice["c/t"]?.tasks[2], 1)
        XCTAssertEqual(state.practice["c/t"]?.correct[2], 1)
    }

    func testWeakSpotsNeedEnoughAnswers() {
        var state = LearnerState()
        var stat = PracticeStat()
        stat.tasks = [8, 0, 0, 0]
        stat.correct = [3, 0, 0, 0]
        state.practice["c/t"] = stat
        let course = Course(id: "c", title: "Kurs", subtitle: nil, description: nil, color: "#000000", symbol: "book", vault: nil, chapters: [],
                            practice: [PracticeTopic(id: "t", title: "Thema", gens: ["g"])])
        let spots = state.weakSpots(courses: [course])
        XCTAssertEqual(spots.count, 1)
        XCTAssertEqual(spots.first?.title, "Thema")
        stat.tasks = [4, 0, 0, 0]
        stat.correct = [1, 0, 0, 0]
        state.practice["c/t"] = stat
        XCTAssertTrue(state.weakSpots(courses: [course]).isEmpty)
    }

    func testPrimaryMessageCarriesSkipLabel() {
        let m = RuntimeMessage.parse(["type": "primary", "label": "Antwort abgeben", "enabled": true, "style": "check", "canGiveUp": true, "giveUpLabel": "Überspringen"])
        XCTAssertEqual(m, .primary(label: "Antwort abgeben", enabled: true, style: "check", canGiveUp: true, giveUpLabel: "Überspringen"))
    }

    func testPathMessages() {
        XCTAssertEqual(RuntimeMessage.parse(["type": "open", "courseId": "ethnologie", "lessonId": "eth-gabe"]), .open(courseId: "ethnologie", lessonId: "eth-gabe"))
        XCTAssertEqual(RuntimeMessage.parse(["type": "practice", "courseId": "stochastik", "topicId": "schaetzen", "level": 7]), .practice(courseId: "stochastik", topicId: "schaetzen", level: 4))
        XCTAssertEqual(RuntimeMessage.parse(["type": "open", "courseId": "x"]), .unknown)
    }

    func testFormulaBookAndCards() throws {
        let json = #"""
        {"id":"formeln","course":"physik","title":"Formelsammlung Physik","groups":[{"title":"Bewegungen","formulas":[
          {"id":"gleichfoermig","name":"Gleichförmige Bewegung","tex":"s = v \\cdot t","vars":[["s","Weg","m"]],"lessons":["phy-kinematik"],"abi":"merken","solve":{"v":"v = \\frac{s}{t}"}},
          {"id":"freier-fall","name":"Freier Fall","tex":"h = \\tfrac{1}{2} g t^2"}]}]}
        """#
        let book = try JSONDecoder().decode(FormulaBook.self, from: Data(json.utf8))
        XCTAssertEqual(book.formulas.count, 2)
        XCTAssertEqual(book.formulas(forLesson: "phy-kinematik").map(\.id), ["gleichfoermig"])
        XCTAssertEqual(FormulaBook.lessonID(course: "physik"), "formeln-physik")
        XCTAssertTrue(FormulaBook.isFormulaLesson("formeln-physik"))

        var state = LearnerState()
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        XCTAssertEqual(state.addFormulaCards(courseId: "physik", ids: ["gleichfoermig", "freier-fall"], now: now), 2)
        XCTAssertEqual(state.addFormulaCards(courseId: "physik", ids: ["gleichfoermig"], now: now), 0)
        let card = try XCTUnwrap(state.cards[ReviewCard.key("formeln-physik", "gleichfoermig")])
        XCTAssertEqual(card.courseId, "physik")
        XCTAssertTrue(state.dueCards(now: now).isEmpty)
        XCTAssertEqual(state.dueCards(now: now.addingTimeInterval(86_400)).count, 2)
    }

    func testMistakeLogKeepsWrongTasks() {
        let message: [String: Any] = ["type": "finished", "mode": "exam", "score": 0.5, "results": [
            ["stepId": "e1", "type": "choice", "correct": false, "firstTry": false, "attempts": 1, "revealed": false, "topicId": "logik", "courseId": "tmua",
             "task": ["type": "choice", "md": "Which of the **following** is true?", "options": [["md": "A", "correct": true], ["md": "B"]]]],
            ["stepId": "e2", "type": "choice", "correct": true, "firstTry": true, "attempts": 1, "revealed": false, "topicId": "logik", "courseId": "tmua"],
        ], "exam": ["title": "Paper 2", "format": "tmua", "timeUp": false]]
        guard case .finished(let f) = RuntimeMessage.parse(message) else { return XCTFail("not parsed") }
        XCTAssertEqual(f.exam?.format, "tmua")
        var state = LearnerState()
        XCTAssertEqual(state.logMistakes(f, courseId: "tmua", topicTitles: ["logik": "Logik"]), 1)
        let m = try! XCTUnwrap(state.mistakes.first)
        XCTAssertEqual(m.topicTitle, "Logik")
        XCTAssertEqual(m.preview, "Which of the following is true?")
        let retry = FinishedLesson(lessonId: nil, mode: "review", results: [StepResult(stepId: m.id, lessonId: nil, type: "choice", correct: true, firstTry: true, attempts: 1, revealed: false)], score: 1)
        state.resolveMistakes(retry)
        XCTAssertTrue(state.mistakes.isEmpty)
        XCTAssertEqual(TMUAScale.score(correct: 20, total: 40), 4.6)
        XCTAssertEqual(TMUAScale.score(correct: 20, total: 20), 9)
    }

    func testChapterWeeks() {
        let ch = Chapter(id: "e2", title: "Etappe 2", lessons: [], from: "2026-11-09", to: "2026-11-15")
        var parts = DateComponents()
        parts.year = 2026; parts.month = 11; parts.day = 13; parts.hour = 12
        let day = Calendar.current.date(from: parts)!
        XCTAssertTrue(ch.isCurrent(on: day))
        XCTAssertFalse(ch.isPast(on: day))
        XCTAssertTrue(ch.isPast(on: day.addingTimeInterval(4 * 86_400)))
    }

    func testTrafficLightPerChapter() {
        let lessons = [LessonRef(id: "a", title: "A"), LessonRef(id: "b", title: "B")]
        let chapter = Chapter(id: "q1", title: "Q1", lessons: lessons)
        let course = Course(id: "c", title: "C", color: "#000000", symbol: "x", chapters: [chapter])
        var state = LearnerState()
        XCTAssertEqual(state.light(for: chapter, in: course), .none)
        var p = LessonProgress(courseId: "c")
        p.completedAt = Date()
        state.lessons["a"] = p
        XCTAssertEqual(state.light(for: chapter, in: course), .yellow)
        state.lessons["b"] = p
        XCTAssertEqual(state.light(for: chapter, in: course), .green)
        var bad = ReviewCard(courseId: "c", lessonId: "a", stepId: "s1", due: Date())
        bad.lapses = 2
        state.cards[ReviewCard.key("a", "s1")] = bad
        XCTAssertEqual(state.light(for: chapter, in: course), .red)
    }

    func testSkippedLessonsSettleThePath() throws {
        // progress stored before skipping existed still decodes
        let old = try JSONDecoder().decode(LessonProgress.self, from: Data(#"{"courseId":"c","lastStep":2,"timesCompleted":0,"updatedAt":0}"#.utf8))
        XCTAssertFalse(old.isSkipped)
        XCTAssertFalse(old.isSettled)
        let lessons = [LessonRef(id: "a", title: "A"), LessonRef(id: "b", title: "B")]
        let chapter = Chapter(id: "k", title: "K", lessons: lessons)
        let course = Course(id: "c", title: "C", color: "#000000", symbol: "x", chapters: [chapter])
        var state = LearnerState()
        state.skip(lessonID: "a", courseID: "c")
        XCTAssertTrue(state.lessons["a"]?.isSkipped ?? false)
        XCTAssertTrue(state.isSettled("a"))
        XCTAssertEqual(state.completedCount(in: course), 0)
        XCTAssertEqual(state.settledCount(in: course), 1)
        // finishing a skipped lesson turns it into a finished one
        let finished = FinishedLesson(lessonId: "a", mode: "lesson", results: [], score: 1)
        _ = state.record(finished, course: course, meta: nil)
        XCTAssertTrue(state.lessons["a"]?.isCompleted ?? false)
        XCTAssertFalse(state.lessons["a"]?.isSkipped ?? true)
        // a finished lesson cannot be skipped, a skip can be taken back
        state.skip(lessonID: "a", courseID: "c")
        XCTAssertNil(state.lessons["a"]?.skippedAt)
        state.skip(lessonID: "b", courseID: "c")
        XCTAssertEqual(state.settledCount(in: course), 2)
        XCTAssertEqual(state.light(for: chapter, in: course), .green)
        state.unskip(lessonID: "b")
        XCTAssertFalse(state.isSettled("b"))
        XCTAssertEqual(state.light(for: chapter, in: course), .yellow)
    }

    private func practiceRound() throws -> FinishedLesson {
        let json = #"{"type":"finished","lessonId":null,"mode":"practice","score":0.8,"practice":{"topicId":"binomial","courseId":"stochastik","level":3},"results":[{"stepId":"p1","type":"numeric","correct":true,"firstTry":true,"attempts":1,"revealed":false,"self":false},{"stepId":"p2","type":"choice","correct":true,"firstTry":false,"attempts":2,"revealed":false,"self":false},{"stepId":"p3","type":"cloze","correct":false,"firstTry":false,"attempts":2,"revealed":true,"self":false}]}"#
        guard case .finished(let f) = RuntimeMessage.parse(try JSONSerialization.jsonObject(with: Data(json.utf8))) else {
            throw XCTSkip("not parsed")
        }
        return f
    }

    func testProgressMergesAcrossDevices() throws {
        let course = Course(id: "c", title: "C", color: "#000000", symbol: "x",
                            chapters: [Chapter(id: "k", title: "K", lessons: [LessonRef(id: "a", title: "A"), LessonRef(id: "b", title: "B")])])
        let now = Date()
        let day = DayKey.key(for: now)
        var phone = LearnerState()
        var pad = LearnerState()
        let lesson = FinishedLesson(lessonId: "a", mode: "lesson", results: [
            StepResult(stepId: "q1", lessonId: "a", type: "choice", correct: true, firstTry: true, attempts: 1, revealed: false),
        ], score: 1, seconds: 30)
        let xpPhone = phone.record(lesson, course: course, meta: nil, now: now)
        let xpPad = pad.record(try practiceRound(), course: nil, meta: nil, now: now)
        pad.skip(lessonID: "b", courseID: "c", now: now)
        // files go back and forth several times: nothing counts twice
        for i in 0..<3 {
            phone.merge([(ProgressSnapshot(state: pad, name: "iPad"), "p\(i)")], now: now)
            pad.merge([(ProgressSnapshot(state: phone, name: "iPhone"), "f\(i)")], now: now)
        }
        XCTAssertEqual(phone.days[day]?.xp, xpPhone + xpPad)
        XCTAssertEqual(pad.days[day]?.xp, xpPhone + xpPad)
        XCTAssertEqual(phone.ownDays[day]?.xp, xpPhone)
        XCTAssertTrue(pad.lessons["a"]?.isCompleted ?? false)
        XCTAssertTrue(phone.lessons["b"]?.isSkipped ?? false)
        XCTAssertEqual(pad.cards, phone.cards)
        XCTAssertEqual(pad.cards.count, 1)
        XCTAssertEqual(phone.practice["stochastik/binomial"]?.tasks, [0, 0, 3, 0])
        XCTAssertEqual(phone.peers[pad.deviceID]?.name, "iPad")
        // a second round on the phone counts once more on the pad
        phone.record(try practiceRound(), course: nil, meta: nil, now: now)
        pad.merge([(ProgressSnapshot(state: phone, name: "iPhone"), "f9")], now: now)
        XCTAssertEqual(pad.practice["stochastik/binomial"]?.tasks, [0, 0, 6, 0])
        XCTAssertEqual(pad.practice["stochastik/binomial"]?.rounds, 2)
        // the later change wins: the skip taken back on the pad reaches the phone
        pad.unskip(lessonID: "b", now: now.addingTimeInterval(60))
        XCTAssertTrue(phone.merge([(ProgressSnapshot(state: pad, name: "iPad"), "p9")], now: now))
        XCTAssertFalse(phone.isSettled("b"))
        XCTAssertFalse(phone.merge([(ProgressSnapshot(state: pad, name: "iPad"), "p9")], now: now))
    }

    func testResetReachesOtherDevices() throws {
        let course = Course(id: "c", title: "C", color: "#000000", symbol: "x", chapters: [Chapter(id: "k", title: "K", lessons: [LessonRef(id: "a", title: "A")])])
        let now = Date()
        var phone = LearnerState()
        var pad = LearnerState()
        pad.notes = [LearnNote(courseId: "c", lessonId: "a", lessonTitle: "A", stepId: nil, vaultPath: "x.md", vaultTitle: "x", text: "Notiz")]
        phone.record(FinishedLesson(lessonId: "a", mode: "lesson", results: [], score: 1), course: course, meta: nil, now: now)
        pad.merge([(ProgressSnapshot(state: phone, name: "iPhone"), "f1")], now: now)
        phone.merge([(ProgressSnapshot(state: pad, name: "iPad"), "p1")], now: now)
        XCTAssertTrue(pad.isSettled("a"))
        phone.resetProgress(now: now.addingTimeInterval(100))
        XCTAssertTrue(phone.lessons.isEmpty)
        // the pad's file from before the reset brings nothing back
        phone.merge([(ProgressSnapshot(state: pad, name: "iPad"), "p1")], now: now)
        XCTAssertTrue(phone.lessons.isEmpty)
        XCTAssertNil(phone.days[DayKey.key(for: now)])
        // and the pad follows the reset, its notes stay
        pad.merge([(ProgressSnapshot(state: phone, name: "iPhone"), "f2")], now: now)
        XCTAssertTrue(pad.lessons.isEmpty)
        XCTAssertNil(pad.days[DayKey.key(for: now)])
        XCTAssertEqual(pad.resetAt, phone.resetAt)
        XCTAssertEqual(pad.notes.count, 1)
    }

    func testProgressFileAndSolvedMistakes() throws {
        var a = LearnerState()
        var b = LearnerState()
        let m = Mistake(courseId: "tmua", topicId: nil, topicTitle: nil, task: "{}", date: Date(timeIntervalSince1970: 1_800_000_000))
        a.mistakes = [m]
        b.merge([(ProgressSnapshot(state: a, name: "iPhone"), "x")])
        XCTAssertEqual(b.mistakes.count, 1)
        b.removeMistake(id: m.id)
        a.merge([(ProgressSnapshot(state: b, name: "iPad"), "y")])
        XCTAssertTrue(a.mistakes.isEmpty)
        // packed, sealed and opened again
        let snap = ProgressSnapshot(state: a, name: "iPhone", savedAt: Date(timeIntervalSince1970: 1_800_000_100))
        let sealed = try TagwerkCrypto.seal(try snap.packed(), passphrase: "pass", kind: .progress, salt: TagwerkCrypto.randomBytes(16), iterations: 100_000)
        let back = try ProgressSnapshot.unpacked(try TagwerkCrypto.open(sealed, passphrase: "pass", kind: .progress))
        XCTAssertEqual(back, snap)
        XCTAssertEqual(try back.contentHash(), try ProgressSnapshot(state: a, name: "iPhone").contentHash())
        // a state saved before the sync existed: everything was learned on this device
        let old = try JSONDecoder().decode(LearnerState.self, from: Data(#"{"days":{"2026-11-01":{"xp":12}}}"#.utf8))
        XCTAssertEqual(old.ownDays["2026-11-01"]?.xp, 12)
        XCTAssertFalse(old.deviceID.isEmpty)
    }

    func testNewInstallReplacesOlderDownloads() throws {
        let fm = FileManager.default
        let base = fm.temporaryDirectory.appendingPathComponent("lw-\(UUID().uuidString)")
        let bundle = base.appendingPathComponent("Bundle"), cache = base.appendingPathComponent("Cache")
        defer { try? fm.removeItem(at: base) }
        let new = Data(#"{"courses":["a","b"]}"#.utf8), old = Data(#"{"courses":["a"]}"#.utf8)
        try fm.createDirectory(at: bundle.appendingPathComponent("courses"), withIntermediateDirectories: true)
        try fm.createDirectory(at: cache.appendingPathComponent("courses"), withIntermediateDirectories: true)
        try new.write(to: bundle.appendingPathComponent("courses/index.json"))
        try old.write(to: cache.appendingPathComponent("courses/index.json"))
        let shipped = BundleManifest(commit: "abc", files: ["courses/index.json": GitBlob.sha(new)])
        try JSONEncoder().encode(shipped).write(to: bundle.appendingPathComponent("bundle-manifest.json"))
        let locator = ContentLocator(cacheRoot: cache, bundleRoot: bundle)
        XCTAssertEqual(locator.data("courses/index.json"), old)
        let sync = ContentSync(source: ContentSource(), root: cache, shellVersion: 1, bundleRoot: bundle)
        XCTAssertTrue(sync.adoptBundle())
        // the older download is gone, the lessons of the app count
        XCTAssertEqual(locator.data("courses/index.json"), new)
        XCTAssertEqual(sync.loadManifest().files["courses/index.json"], GitBlob.sha(new))
        XCTAssertEqual(sync.loadManifest().bundleFiles?["courses/index.json"], GitBlob.sha(new))
        // the same install again changes nothing
        XCTAssertFalse(sync.adoptBundle())
    }

    func testIgnoredFiles() {
        XCTAssertTrue(ContentSync.isIgnored("runtime/dev.html"))
        XCTAssertTrue(ContentSync.isIgnored("runtime/dev-frame.html"))
        XCTAssertFalse(ContentSync.isIgnored("runtime/lw.js"))
        XCTAssertFalse(ContentSync.isIgnored("courses/analysis-1/course.json"))
    }
}
