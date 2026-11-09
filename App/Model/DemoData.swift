import Foundation
import LernwerkCore

/// Plausible progress for screenshots and the first look (-LWDemo YES). Nothing of it is saved or sent.
@MainActor
enum DemoData {
    static func fill(_ model: AppModel) {
        let now = Date()
        let cal = Calendar.current
        var s = LearnerState()
        s.dailyGoal = 30

        // finished lessons: id, days ago, questions missed at the first try
        let finished: [(String, Int, Int)] = [
            ("ana1-logik", 13, 1),
            ("eth-feldforschung", 12, 0),
            ("oek-markt", 10, 1),
            ("cs50-suche", 8, 1),
            ("ana1-supremum", 6, 2),
            ("la1-linkomb", 5, 0),
            ("eth-gabe", 4, 1),
            ("oek-smith", 3, 0),
            ("cs50-informiert", 2, 1),
            ("ana1-induktion", 1, 1),
        ]
        for (id, ago, missed) in finished {
            guard let hit = find(model, id), let meta = model.meta(hit.course, hit.lesson) else { continue }
            let day = cal.date(byAdding: .day, value: -ago, to: cal.startOfDay(for: now)) ?? now
            let when = day.addingTimeInterval(17.5 * 3600)
            let ids = meta.reviewableStepIDs
            let results = ids.enumerated().map { i, step in
                StepResult(stepId: step, lessonId: id, type: "choice", correct: true, firstTry: i >= missed, attempts: i >= missed ? 1 : 2, revealed: false)
            }
            let score = Double(ids.count - min(missed, ids.count)) / Double(max(1, ids.count))
            s.record(FinishedLesson(lessonId: id, mode: "lesson", results: results, score: score, seconds: 420 + ids.count * 45),
                     course: hit.course, meta: meta, now: when)
        }

        // reviews on the days the cards came due, so the intervals look lived-in
        let startOfToday = cal.startOfDay(for: now)
        for key in s.cards.keys.sorted() {
            guard var card = s.cards[key] else { continue }
            let seed = key.unicodeScalars.reduce(0) { $0 &+ Int($1.value) }
            var round = 0
            while card.due < startOfToday && round < 8 {
                let pick = (seed + round) % 9
                let quality = pick == 0 ? 2 : (pick < 3 ? 3 : 5)
                let at = card.due
                card = Scheduler.review(card, quality: quality, now: at)
                let dayKey = DayKey.key(for: at)
                var stat = s.days[dayKey] ?? DayStat()
                stat.xp += 2 + (quality >= 4 ? 1 : 0)
                stat.reviews += 1
                stat.seconds += 30
                s.days[dayKey] = stat
                round += 1
            }
            s.cards[key] = card
        }

        // a little done today, a lesson half way through
        var today = s.days[DayKey.key(for: now)] ?? DayStat()
        today.xp += 14
        today.reviews += 5
        today.seconds += 240
        s.days[DayKey.key(for: now)] = today
        s.noteProgress(lessonID: "oek-elastizitaet", courseID: "oekonomik", step: 4, now: now.addingTimeInterval(-3600))

        func addNote(_ lessonID: String, daysAgo: Double, sent: Bool, _ text: String) {
            guard let hit = find(model, lessonID) else { return }
            let target = model.vaultTarget(course: hit.course, lesson: hit.lesson, meta: model.meta(hit.course, hit.lesson))
            var note = LearnNote(courseId: hit.course.id, lessonId: lessonID, lessonTitle: hit.lesson.title, stepId: nil,
                                 vaultPath: target.path, vaultTitle: target.title, text: text, now: now.addingTimeInterval(-daysAgo * 86_400))
            if sent {
                note.sentText = text
            } else {
                let event = LearnBridge.noteEvent(note, course: hit.course, tag: model.subject(of: hit.course)?.tag)
                s.outbox.append(event)
                note.queuedEventID = event.id
            }
            s.notes.append(note)
        }

        addNote("oek-elastizitaet", daysAgo: 0.04, sent: false, #"""
        > [!warning] Stolperstelle
        > Elastizität ist nicht die Steigung. Auf einer Geraden bleibt die Steigung gleich, die Elastizität ändert sich von Punkt zu Punkt.

        Umsatz steigt bei einer Preissenkung nur, solange die Nachfrage elastisch ist, also $|\varepsilon| > 1$.
        """#)
        addNote("ana1-supremum", daysAgo: 6, sent: true, #"""
        > [!important] Kernaussage
        > Das Supremum ist die kleinste obere Schranke. Es muss nicht in der Menge liegen: Für $M = \{1 - \tfrac{1}{n} : n \in \mathbb{N}\}$ ist $\sup M = 1$, aber $1 \notin M$.

        So prüfe ich es: $s$ ist obere Schranke, und zu jedem $\varepsilon > 0$ gibt es ein $x \in M$ mit $x > s - \varepsilon$.
        """#)
        addNote("eth-gabe", daysAgo: 4, sent: true, #"""
        Mauss: Eine Gabe ist nie ganz freiwillig. Sie verpflichtet dreifach, zum Geben, zum Annehmen und zum Erwidern.

        > [!example] Beispiel
        > Im Kula-Ring wandern Halsketten im Uhrzeigersinn und Armreifen in die Gegenrichtung. Es geht um Ansehen und Beziehungen, nicht um Nutzen.
        """#)
        addNote("cs50-suche", daysAgo: 8, sent: true, #"""
        > [!question] Offene Frage
        > Warum findet die Breitensuche den kürzesten Weg und die Tiefensuche nicht?

        Die Breitensuche nimmt immer den ältesten Knoten aus der Warteschlange und erkundet so Schicht für Schicht nach Abstand vom Start. Der erste Weg zum Ziel ist darum der kürzeste.
        """#)

        s.bridgeFeatures = [LearnBridge.feature]
        s.bridgePluginVersion = "1.3.0"
        s.lastPush = now.addingTimeInterval(-3 * 3600)
        model.state = s

        // some training on the unlocked topics: a little on Leicht and Mittel, one topic up to Schwer
        for (offset, item) in model.unlockedTopics.prefix(5).enumerated() {
            var p = PracticeStat()
            let reached = [3, 2, 1, 2, 0][offset]
            for level in 1...4 where level <= max(1, reached) {
                p.tasks[level - 1] = 6 * (level == reached ? 2 : 1)
                p.correct[level - 1] = level <= reached ? 5 : 3
                p.best[level - 1] = level <= reached ? 0.83 : 0.5
            }
            p.rounds = reached + 1
            p.lastLevel = max(1, reached)
            p.lastAt = now.addingTimeInterval(-Double(offset + 1) * 9000)
            model.state.practice[PracticeStat.key(course: item.course.id, topic: item.topic.id)] = p
        }
    }

    static func find(_ model: AppModel, _ lessonID: String) -> (course: Course, lesson: LessonRef)? {
        for course in model.courses {
            if let lesson = course.lessons.first(where: { $0.id == lessonID }) { return (course, lesson) }
        }
        return nil
    }
}

extension AppModel {
    /// Launch arguments for screenshots and quick checks: -LWLesson <id> [-LWStep <n>] opens a lesson,
    /// -LWReview YES a review of the due cards.
    func openLaunchTarget() {
        let defaults = UserDefaults.standard
        guard presentedLesson == nil else { return }
        if let id = defaults.string(forKey: "LWLesson"), let hit = DemoData.find(self, id) {
            start(hit.course, hit.lesson, fromStart: true)
            let step = defaults.integer(forKey: "LWStep")
            if step > 0 { presentedLesson?.resumeAt = step }
            return
        }
        if let topicID = defaults.string(forKey: "LWPractice") {
            for c in courses {
                if let t = c.practiceTopics.first(where: { $0.id == topicID }) {
                    startPractice(c, t, level: max(1, defaults.integer(forKey: "LWLevel")))
                    return
                }
            }
        }
        if defaults.bool(forKey: "LWReview") { startReview() }
    }
}
