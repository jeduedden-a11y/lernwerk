import Foundation

// Learning progress across devices, through the same private data repo as the vault bridge.
// Every installation writes only its own file, lernwerk/fortschritt/<deviceID>.tw (encrypted like the inbox),
// and reads the files of the others. Merging is order-free and can run any number of times:
// lessons and cards go by the newer change, exams and mistakes are joined, and day and training
// figures are the sum of what each device learned itself (ownDays, ownPractice), so nothing counts twice.
// A reset on one device clears all devices: files from before the newest reset are left out.
// The Tagwerk Bridge plugin only reads inbox/ and the wiki copy, so this folder stays the app's.

/// Another device as last read.
public struct ProgressPeer: Codable, Hashable, Sendable {
    public var name: String
    /// When that device wrote its file.
    public var savedAt: Date?
    /// Blob sha of its file, so an unchanged file is not downloaded again.
    public var sha: String
    public var days: [String: DayStat]
    public var practice: [String: PracticeStat]

    public init(name: String, savedAt: Date?, sha: String, days: [String: DayStat] = [:], practice: [String: PracticeStat] = [:]) {
        self.name = name
        self.savedAt = savedAt
        self.sha = sha
        self.days = days
        self.practice = practice
    }
}

/// Bookkeeping of the sync on this device.
public struct ProgressSyncMeta: Codable, Hashable, Sendable {
    public var lastSync: Date?
    public var error: String?
    /// Blob sha of this device's file after the last upload.
    public var ownSHA: String?
    /// Hash of what was uploaded last; an unchanged state is not uploaded again.
    public var uploadedHash: String?
    public init() {}
}

/// What one device publishes.
public struct ProgressSnapshot: Codable, Equatable, Sendable {
    public var schema: Int = 1
    public var device: String
    public var name: String
    public var savedAt: Date?
    public var resetAt: Date?
    public var lessons: [String: LessonProgress]
    public var cards: [String: ReviewCard]
    public var ownDays: [String: DayStat]
    public var ownPractice: [String: PracticeStat]
    public var exams: [ExamRecord]
    public var mistakes: [Mistake]
    public var resolvedMistakes: [String]
    public var lastLesson: String?
    public var lastLessonAt: Date?

    public init(state: LearnerState, name: String, savedAt: Date? = nil) {
        device = state.deviceID
        self.name = name
        self.savedAt = savedAt
        resetAt = state.resetAt
        lessons = state.lessons
        cards = state.cards
        ownDays = state.ownDays
        ownPractice = state.ownPractice
        exams = state.exams
        mistakes = state.mistakes
        resolvedMistakes = state.resolvedMistakes
        lastLesson = state.lastLesson
        lastLessonAt = state.lastLessonAt
    }

    /// Compressed JSON, the plain text inside the envelope.
    public func packed() throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let json = try encoder.encode(self)
        return try (json as NSData).compressed(using: .zlib) as Data
    }

    public static func unpacked(_ data: Data) throws -> ProgressSnapshot {
        let json = try (data as NSData).decompressed(using: .zlib) as Data
        return try JSONDecoder().decode(ProgressSnapshot.self, from: json)
    }

    /// Identifies the content without the time it was saved.
    public func contentHash() throws -> String {
        var copy = self
        copy.savedAt = nil
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        return TagwerkCrypto.sha256Hex(try encoder.encode(copy))
    }
}

extension DayStat {
    static func + (a: DayStat, b: DayStat) -> DayStat {
        var s = DayStat()
        s.xp = a.xp + b.xp
        s.lessons = a.lessons + b.lessons
        s.reviews = a.reviews + b.reviews
        s.seconds = a.seconds + b.seconds
        s.practice = a.practice + b.practice
        return s
    }
}

extension PracticeStat {
    /// Training of two devices together: counts add up, the best rounds and the latest level stay.
    static func + (a: PracticeStat, b: PracticeStat) -> PracticeStat {
        var s = PracticeStat()
        for i in 0..<4 {
            s.tasks[i] = a.tasks[i] + b.tasks[i]
            s.correct[i] = a.correct[i] + b.correct[i]
            s.best[i] = max(a.best[i], b.best[i])
        }
        s.rounds = a.rounds + b.rounds
        let later = (a.lastAt ?? .distantPast) >= (b.lastAt ?? .distantPast) ? a : b
        s.lastAt = later.lastAt
        s.lastLevel = later.lastLevel
        return s
    }
}

extension LessonProgress {
    /// The newer change decides open, skipped and the step; finishing is never lost.
    static func merged(_ a: LessonProgress, _ b: LessonProgress) -> LessonProgress {
        let newerIsA = a.updatedAt != b.updatedAt ? a.updatedAt > b.updatedAt
            : (a.skippedAt == nil ? 0 : 1, a.lastStep) >= (b.skippedAt == nil ? 0 : 1, b.lastStep)
        var r = newerIsA ? a : b
        r.completedAt = [a.completedAt, b.completedAt].compactMap { $0 }.min()
        r.timesCompleted = max(a.timesCompleted, b.timesCompleted)
        r.bestScore = [a.bestScore, b.bestScore].compactMap { $0 }.max()
        return r
    }
}

extension ReviewCard {
    /// The card that was answered last carries the schedule.
    static func merged(_ a: ReviewCard, _ b: ReviewCard) -> ReviewCard {
        let la = a.lastReviewed ?? .distantPast, lb = b.lastReviewed ?? .distantPast
        if la != lb { return la > lb ? a : b }
        if a.reps != b.reps { return a.reps > b.reps ? a : b }
        return a.due >= b.due ? a : b
    }
}

extension LearnerState {
    /// Clears the learning progress and keeps notes, settings and the device's identity.
    public mutating func resetProgress(now: Date = Date()) {
        var fresh = LearnerState()
        fresh.notes = notes
        fresh.outbox = outbox
        fresh.dailyGoal = dailyGoal
        fresh.deviceSalt = deviceSalt
        fresh.deviceID = deviceID
        fresh.bridgeFeatures = bridgeFeatures
        fresh.bridgePluginVersion = bridgePluginVersion
        fresh.lastPush = lastPush
        fresh.progressSync = progressSync
        fresh.resetAt = now
        fresh.lastLessonAt = nil
        self = fresh
    }

    /// Takes in the files of other devices. Returns true if anything the learner sees changed.
    @discardableResult
    public mutating func merge(_ incoming: [(snapshot: ProgressSnapshot, sha: String)], now: Date = Date()) -> Bool {
        let before = ProgressSnapshot(state: self, name: "")
        let daysBefore = days, practiceBefore = practice
        let others = incoming.filter { $0.snapshot.device != deviceID }

        // a newer reset elsewhere clears this device first
        let newestReset = ([resetAt] + others.map { $0.snapshot.resetAt }).compactMap { $0 }.max()
        if let newestReset, (resetAt ?? .distantPast) < newestReset.addingTimeInterval(-0.001) {
            resetProgress(now: newestReset)
        }
        let floor = resetAt ?? .distantPast
        for (snap, sha) in others {
            let current = (snap.resetAt ?? .distantPast) >= floor.addingTimeInterval(-0.001)
            // a file from before the reset still names the device, but brings nothing
            peers[snap.device] = ProgressPeer(name: snap.name, savedAt: snap.savedAt, sha: sha,
                                              days: current ? snap.ownDays : [:], practice: current ? snap.ownPractice : [:])
            guard current else { continue }
            for (id, p) in snap.lessons { lessons[id] = lessons[id].map { LessonProgress.merged($0, p) } ?? p }
            for (id, c) in snap.cards { cards[id] = cards[id].map { ReviewCard.merged($0, c) } ?? c }
            var examIDs = Set(exams.map(\.id))
            for e in snap.exams where !examIDs.contains(e.id) { exams.append(e); examIDs.insert(e.id) }
            for id in snap.resolvedMistakes { markResolved(id) }
            for m in snap.mistakes {
                if let i = mistakes.firstIndex(where: { $0.id == m.id }) {
                    if m.date > mistakes[i].date { mistakes[i] = m }
                } else {
                    mistakes.append(m)
                }
            }
            if let theirs = snap.lastLessonAt, theirs > (lastLessonAt ?? .distantPast), let id = snap.lastLesson {
                lastLesson = id
                lastLessonAt = theirs
            }
        }
        exams.sort { $0.date != $1.date ? $0.date < $1.date : $0.id < $1.id }
        if exams.count > 50 { exams.removeFirst(exams.count - 50) }
        let resolved = Set(resolvedMistakes)
        mistakes.removeAll { resolved.contains($0.id) }
        mistakes.sort { $0.date != $1.date ? $0.date < $1.date : $0.id < $1.id }
        if mistakes.count > 300 { mistakes.removeFirst(mistakes.count - 300) }
        recomputeTotals()
        return ProgressSnapshot(state: self, name: "") != before || days != daysBefore || practice != practiceBefore
    }

    /// days and practice: this device's own figures plus those of every known device.
    public mutating func recomputeTotals() {
        var d = ownDays
        var p = ownPractice
        for (id, peer) in peers where id != deviceID {
            for (k, v) in peer.days { d[k] = (d[k] ?? DayStat()) + v }
            for (k, v) in peer.practice { p[k] = (p[k] ?? PracticeStat()) + v }
        }
        days = d
        practice = p
    }
}

/// Reads and writes the progress files in the data repo.
public struct ProgressSync: Sendable {
    public static let folder = "lernwerk/fortschritt"

    public var github: GitHubClient
    public var passphrase: String
    public var salt: Data

    public init(github: GitHubClient, passphrase: String, salt: Data) {
        self.github = github
        self.passphrase = passphrase
        self.salt = salt
    }

    public static func path(device: String) -> String { "\(folder)/\(device).tw" }

    /// Device id to blob sha of every progress file.
    public func list() async throws -> [String: String] {
        var result: [String: String] = [:]
        for entry in try await github.list(path: Self.folder) where entry.name.hasSuffix(".tw") {
            result[String(entry.name.dropLast(3))] = entry.sha
        }
        return result
    }

    public func download(device: String) async throws -> ProgressSnapshot? {
        guard let file = try await github.getRaw(path: Self.path(device: device)) else { return nil }
        let plain = try TagwerkCrypto.open(file.data, passphrase: passphrase, kind: .progress)
        return try ProgressSnapshot.unpacked(plain)
    }

    /// Writes this device's file; `sha` is the current blob if it exists. Returns the new blob sha.
    public func upload(_ snapshot: ProgressSnapshot, sha: String?) async throws -> String {
        let sealed = try TagwerkCrypto.seal(try snapshot.packed(), passphrase: passphrase, kind: .progress, salt: salt)
        return try await github.putFile(path: Self.path(device: snapshot.device), data: sealed, sha: sha,
                                        message: "lernwerk: Fortschritt \(snapshot.name)")
    }
}
