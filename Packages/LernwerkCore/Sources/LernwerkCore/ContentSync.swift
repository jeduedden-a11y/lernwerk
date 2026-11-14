import Foundation
import CryptoKit

/// Keeps a local copy of the content folder of the public lernwerk repo.
///
/// The git tree API lists every file with its blob hash, so the app downloads exactly the files that changed and
/// can verify each one. Lessons, widgets and the lesson runtime arrive this way; only changes to the native shell
/// need a new install. A runtime that requires a newer shell (runtime.json minShell) is held back.
public struct ContentSource: Codable, Hashable, Sendable {
    public var owner: String
    public var repo: String
    public var branch: String
    public var folder: String

    public init(owner: String = "jeduedden-a11y", repo: String = "lernwerk", branch: String = "main", folder: String = "content") {
        self.owner = owner
        self.repo = repo
        self.branch = branch
        self.folder = folder
    }
}

public struct ContentManifest: Codable, Sendable {
    /// relative path -> git blob sha
    public var files: [String: String] = [:]
    public var treeEtag: String?
    public var syncedAt: Date?
    public var runtimeHeld: Bool = false
    /// Commit of the copy inside the installed app that the cache was last aligned with.
    public var bundleCommit: String?
    /// Blob hashes of that copy: a file the app already ships is not downloaded again.
    public var bundleFiles: [String: String]?
    public init() {}
}

/// Resources/Content/bundle-manifest.json, written by scripts/bundle-content.sh.
public struct BundleManifest: Codable, Sendable {
    public var commit: String
    public var files: [String: String]
}

public struct ContentSyncReport: Sendable, Equatable {
    public var downloaded: Int
    public var removed: Int
    public var unchanged: Bool
    public var runtimeHeld: Bool
}

public enum ContentSyncError: LocalizedError {
    case http(Int)
    case badTree
    case hashMismatch(String)

    public var errorDescription: String? {
        switch self {
        case .http(let code): return "Inhalte konnten nicht geladen werden (HTTP \(code))."
        case .badTree: return "Unerwartete Antwort von GitHub beim Laden der Inhalte."
        case .hashMismatch(let p): return "Datei beschädigt übertragen: \(p)"
        }
    }
}

public enum GitBlob {
    /// SHA-1 of "blob <size>\0<data>", the id git and the tree API use for a file.
    public static func sha(_ data: Data) -> String {
        var h = Insecure.SHA1()
        h.update(data: Data("blob \(data.count)\u{0}".utf8))
        h.update(data: data)
        return h.finalize().map { String(format: "%02x", $0) }.joined()
    }
}

public struct ContentSync: Sendable {
    public var source: ContentSource
    public var root: URL          // local cache folder, mirrors content/
    public var shellVersion: Int
    public var session: URLSession
    /// The content copy inside the app, if any.
    public var bundleRoot: URL?
    /// Downloads running at the same time.
    public static let parallel = 8

    public init(source: ContentSource, root: URL, shellVersion: Int, session: URLSession = .shared, bundleRoot: URL? = nil) {
        self.source = source
        self.root = root
        self.shellVersion = shellVersion
        self.session = session
        self.bundleRoot = bundleRoot
    }

    /// After a new install: the copy inside the app becomes the base. Downloaded files of the paths it ships are removed,
    /// so an older download can never hide a newer lesson of the app, and the next sync fetches only what changed on
    /// GitHub since the app was built. Returns true if the cache was aligned now.
    @discardableResult
    public func adoptBundle() -> Bool {
        guard let bundleRoot,
              let data = try? Data(contentsOf: bundleRoot.appendingPathComponent("bundle-manifest.json")),
              let bundle = try? JSONDecoder().decode(BundleManifest.self, from: data) else { return false }
        var manifest = loadManifest()
        guard manifest.bundleCommit != bundle.commit else { return false }
        let fm = FileManager.default
        var shipped: [String: String] = [:]
        for (rel, sha) in bundle.files where !Self.isIgnored(rel) && fm.fileExists(atPath: bundleRoot.appendingPathComponent(rel).path) {
            try? fm.removeItem(at: root.appendingPathComponent(rel))
            manifest.files[rel] = sha
            shipped[rel] = sha
        }
        manifest.bundleCommit = bundle.commit
        manifest.bundleFiles = shipped
        manifest.treeEtag = nil
        try? fm.createDirectory(at: root, withIntermediateDirectories: true)
        try? saveManifest(manifest)
        return true
    }

    /// True if the file with this hash is on the device: downloaded, or shipped inside the app.
    private func isAvailable(_ rel: String, sha: String, manifest: ContentManifest) -> Bool {
        if FileManager.default.fileExists(atPath: root.appendingPathComponent(rel).path) { return true }
        guard manifest.bundleFiles?[rel] == sha, let bundleRoot else { return false }
        return FileManager.default.fileExists(atPath: bundleRoot.appendingPathComponent(rel).path)
    }

    private var manifestURL: URL { root.appendingPathComponent(".manifest.json") }

    public func loadManifest() -> ContentManifest {
        guard let data = try? Data(contentsOf: manifestURL), let m = try? JSONDecoder().decode(ContentManifest.self, from: data) else { return ContentManifest() }
        return m
    }

    private func saveManifest(_ m: ContentManifest) throws {
        let enc = JSONEncoder()
        enc.outputFormatting = [.sortedKeys]
        try enc.encode(m).write(to: manifestURL, options: .atomic)
    }

    /// Files the app never needs (test pages for the browser).
    public static func isIgnored(_ path: String) -> Bool {
        let name = (path as NSString).lastPathComponent
        return name.hasPrefix("dev") || name.hasPrefix(".") || path.hasPrefix("runtime/vendor/")
    }

    /// `progress` gets (files ready, files to fetch) while downloading.
    public func sync(force: Bool = false, progress: (@Sendable (Int, Int) -> Void)? = nil) async throws -> ContentSyncReport {
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var manifest = loadManifest()

        var treeReq = URLRequest(url: URL(string: "https://api.github.com/repos/\(source.owner)/\(source.repo)/git/trees/\(source.branch)?recursive=1")!,
                                 cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        treeReq.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        treeReq.setValue("lernwerk-ios", forHTTPHeaderField: "User-Agent")
        if !force, let etag = manifest.treeEtag, !manifest.files.isEmpty { treeReq.setValue(etag, forHTTPHeaderField: "If-None-Match") }
        let (treeData, treeResp) = try await session.data(for: treeReq)
        guard let http = treeResp as? HTTPURLResponse else { throw ContentSyncError.badTree }
        if http.statusCode == 304 {
            return ContentSyncReport(downloaded: 0, removed: 0, unchanged: true, runtimeHeld: manifest.runtimeHeld)
        }
        guard http.statusCode == 200 else { throw ContentSyncError.http(http.statusCode) }
        guard let obj = try JSONSerialization.jsonObject(with: treeData) as? [String: Any], let tree = obj["tree"] as? [[String: Any]] else {
            throw ContentSyncError.badTree
        }
        let prefix = source.folder + "/"
        var remote: [String: String] = [:]
        for entry in tree {
            guard entry["type"] as? String == "blob", let path = entry["path"] as? String, let sha = entry["sha"] as? String, path.hasPrefix(prefix) else { continue }
            let rel = String(path.dropFirst(prefix.count))
            if Self.isIgnored(rel) { continue }
            remote[rel] = sha
        }

        // A runtime that needs a newer shell stays on the phone until the app is updated.
        var holdRuntime = false
        if let sha = remote["runtime/runtime.json"], sha != manifest.files["runtime/runtime.json"] {
            let data = try await download("runtime/runtime.json", sha: sha)
            if let info = try? JSONDecoder().decode(RuntimeInfo.self, from: data), info.minShell > shellVersion { holdRuntime = true }
        }

        let changed = remote.filter { rel, sha in
            if holdRuntime && rel.hasPrefix("runtime/") { return false }
            return manifest.files[rel] != sha || !isAvailable(rel, sha: sha, manifest: manifest)
        }
        // Download everything first, then move into place, so a failed sync never leaves half a lesson.
        // Files fetched by an interrupted attempt stay in staging and count, so every attempt gets further.
        let staging = root.appendingPathComponent(".staging", isDirectory: true)
        try FileManager.default.createDirectory(at: staging, withIntermediateDirectories: true)
        var missing: [(rel: String, sha: String)] = []
        for (rel, sha) in changed {
            if let d = try? Data(contentsOf: staging.appendingPathComponent(rel)), GitBlob.sha(d) == sha { continue }
            missing.append((rel: rel, sha: sha))
        }
        let total = changed.count
        var ready = total - missing.count
        progress?(ready, total)
        let fetch: @Sendable (String, String) async -> Error? = { rel, sha in
            do {
                let data = try await self.download(rel, sha: sha)
                let dest = staging.appendingPathComponent(rel)
                try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
                try data.write(to: dest, options: .atomic)
                return nil
            } catch {
                return error
            }
        }
        var lastError: Error?
        var next = 0
        await withTaskGroup(of: Error?.self) { group in
            while next < min(Self.parallel, missing.count) {
                let item = missing[next]
                next += 1
                group.addTask { await fetch(item.rel, item.sha) }
            }
            while let result = await group.next() {
                if let result { lastError = result } else { ready += 1 }
                progress?(ready, total)
                if next < missing.count {
                    let item = missing[next]
                    next += 1
                    group.addTask { await fetch(item.rel, item.sha) }
                }
            }
        }
        // what arrived stays in staging for the next attempt
        if let lastError { throw lastError }
        for (rel, sha) in changed {
            let src = staging.appendingPathComponent(rel)
            let dest = root.appendingPathComponent(rel)
            try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? FileManager.default.removeItem(at: dest)
            try FileManager.default.moveItem(at: src, to: dest)
            manifest.files[rel] = sha
        }
        try? FileManager.default.removeItem(at: staging)

        var removed = 0
        for rel in manifest.files.keys where remote[rel] == nil {
            if holdRuntime && rel.hasPrefix("runtime/") { continue }
            try? FileManager.default.removeItem(at: root.appendingPathComponent(rel))
            manifest.files[rel] = nil
            removed += 1
        }
        manifest.treeEtag = http.value(forHTTPHeaderField: "ETag")
        manifest.syncedAt = Date()
        manifest.runtimeHeld = holdRuntime
        try saveManifest(manifest)
        return ContentSyncReport(downloaded: changed.count, removed: removed, unchanged: changed.isEmpty && removed == 0, runtimeHeld: holdRuntime)
    }

    private func download(_ rel: String, sha: String) async throws -> Data {
        let encoded = (source.folder + "/" + rel).split(separator: "/").map { String($0).addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String($0) }.joined(separator: "/")
        let url = URL(string: "https://raw.githubusercontent.com/\(source.owner)/\(source.repo)/\(source.branch)/\(encoded)")!
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 60)
        req.setValue("lernwerk-ios", forHTTPHeaderField: "User-Agent")
        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else { throw ContentSyncError.http((resp as? HTTPURLResponse)?.statusCode ?? 0) }
        // raw.githubusercontent.com can lag a few minutes behind the tree; a mismatch means "try again later"
        guard GitBlob.sha(data) == sha else { throw ContentSyncError.hashMismatch(rel) }
        return data
    }
}

/// Finds a content file: the synced copy first, then the copy bundled with the app.
public struct ContentLocator: Sendable {
    public var cacheRoot: URL
    public var bundleRoot: URL?

    public init(cacheRoot: URL, bundleRoot: URL?) {
        self.cacheRoot = cacheRoot
        self.bundleRoot = bundleRoot
    }

    public func url(for rel: String) -> URL? {
        let clean = rel.split(separator: "/").filter { $0 != ".." && $0 != "." }.joined(separator: "/")
        let cached = cacheRoot.appendingPathComponent(clean)
        if FileManager.default.fileExists(atPath: cached.path) { return cached }
        if let b = bundleRoot?.appendingPathComponent(clean), FileManager.default.fileExists(atPath: b.path) { return b }
        return nil
    }

    public func data(_ rel: String) -> Data? { url(for: rel).flatMap { try? Data(contentsOf: $0) } }

    public func decode<T: Decodable>(_ type: T.Type, _ rel: String) -> T? {
        guard let d = data(rel) else { return nil }
        return try? JSONDecoder().decode(T.self, from: d)
    }
}
