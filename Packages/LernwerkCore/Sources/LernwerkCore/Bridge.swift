import Foundation

// Notes reach the vault through the Tagwerk bridge: encrypted batches in tagwerk-daten/inbox, applied by the
// Obsidian plugin "Tagwerk Bridge". The plugin announces the event families it understands in snapshot.tw;
// "lernen" stands for learn.note (plugin 1.3 and later). Until it is announced, notes wait on the phone.

public struct OutgoingEvent: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var createdAt: Date
    /// UTF-8 JSON object, exactly what goes into the inbox batch.
    public var json: Data
    public var requiredFeature: String?

    public init(id: String, createdAt: Date, json: Data, requiredFeature: String?) {
        self.id = id
        self.createdAt = createdAt
        self.json = json
        self.requiredFeature = requiredFeature
    }
}

public enum LearnBridge {
    public static let feature = "lernen"
    /// Managed block heading inside the vault note.
    public static let heading = "Eigene Notizen"

    private static func iso(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: date)
    }

    private static func dayKey(_ date: Date) -> String { DayKey.key(for: date) }

    /// A learn.note event: writes (or, with empty text, removes) the managed block for this note in the vault note
    /// at `path`. The plugin creates the note with the given frontmatter if it does not exist yet.
    /// `tag` is the subject's wiki tag (e.g. "Mathematik"); without one it follows from the course.
    public static func noteEvent(_ note: LearnNote, course: Course?, tag: String? = nil, now: Date = Date()) -> OutgoingEvent {
        let id = UUID().uuidString.lowercased()
        var fields: [String: Any] = [
            "id": id,
            "ts": iso(now),
            "type": "learn.note",
            "path": note.vaultPath,
            "title": note.vaultTitle,
            "block": "lernwerk-\(note.id)",
            "heading": heading,
            "text": note.text,
            "source": "Lernwerk, Lektion »\(note.lessonTitle)«",
            "created": dayKey(note.createdAt),
        ]
        if let course {
            fields["frontmatter"] = [
                "tags": ["wiki02/\(tag ?? folderTag(for: course))", "lernwerk"],
                "type": "note",
                "status": "growing",
            ]
        }
        let data = (try? JSONSerialization.data(withJSONObject: fields, options: [.sortedKeys])) ?? Data("{}".utf8)
        return OutgoingEvent(id: id, createdAt: now, json: data, requiredFeature: feature)
    }

    /// Wiki tag of the vault, e.g. wiki02/Mathematik, wiki02/Informatik.
    public static func folderTag(for course: Course) -> String {
        switch course.id {
        case "analysis-1", "lineare-algebra-1", "stochastik": return "Mathematik"
        case "cs50-ai": return "Informatik"
        case "ethnologie": return "Ethnologie"
        case "oekonomik": return "Ökonomik"
        default: return "Lernwerk"
        }
    }

    /// Default vault location for notes of a lesson without its own vault note.
    public static func fallbackPath(course: Course, lessonTitle: String) -> String {
        let safe = lessonTitle.components(separatedBy: CharacterSet(charactersIn: "/\\:?%*|\"<>#^[]")).joined(separator: " ")
            .trimmingCharacters(in: .whitespaces)
        return "02 Wiki/Lernwerk/\(course.title)/\(safe).md"
    }

    public static func batch(_ events: [OutgoingEvent], device: String, now: Date = Date()) throws -> Data {
        let objects = try events.map { try JSONSerialization.jsonObject(with: $0.json) }
        let dict: [String: Any] = ["schema": 1, "device": device, "createdAt": iso(now), "events": objects]
        return try JSONSerialization.data(withJSONObject: dict, options: [.sortedKeys])
    }

    public static func inboxName(now: Date = Date()) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd'T'HH-mm-ss-SSS'Z'"
        return "inbox/\(f.string(from: now))_\(UUID().uuidString.prefix(8).lowercased()).tw"
    }
}

/// The part of snapshot.tw the learning app cares about.
public struct BridgeStatus: Decodable, Sendable {
    public var pluginVersion: String?
    public var features: [String]
    public var applied: [String]
    public var lastIngestAt: String?

    enum CodingKeys: String, CodingKey { case pluginVersion, features, applied, lastIngestAt }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        pluginVersion = try? c.decodeIfPresent(String.self, forKey: .pluginVersion)
        features = (try? c.decode([String].self, forKey: .features)) ?? []
        applied = (try? c.decode([String].self, forKey: .applied)) ?? []
        lastIngestAt = try? c.decodeIfPresent(String.self, forKey: .lastIngestAt)
    }
}

public struct VaultConnection: Sendable {
    public var github: GitHubClient
    public var passphrase: String
    public var deviceSalt: Data

    public init(github: GitHubClient, passphrase: String, deviceSalt: Data) {
        self.github = github
        self.passphrase = passphrase
        self.deviceSalt = deviceSalt
    }

    /// Reads which features the vault plugin understands.
    public func status() async throws -> BridgeStatus? {
        guard let file = try await github.getRaw(path: "snapshot.tw") else { return nil }
        let plain = try TagwerkCrypto.open(file.data, passphrase: passphrase, kind: .snapshot)
        return try JSONDecoder().decode(BridgeStatus.self, from: plain)
    }

    /// Sends events as one encrypted inbox file.
    public func send(_ events: [OutgoingEvent], now: Date = Date()) async throws {
        guard !events.isEmpty else { return }
        let plain = try LearnBridge.batch(events, device: "Lernwerk", now: now)
        let sealed = try TagwerkCrypto.seal(plain, passphrase: passphrase, kind: .inbox, salt: deviceSalt)
        try await github.createFile(path: LearnBridge.inboxName(now: now), data: sealed, message: "lernwerk: \(events.count) Notizen")
    }
}
