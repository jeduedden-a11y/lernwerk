import Foundation
import Observation
import UIKit
import LernwerkCore

/// A book scanned in the app. It stays on the device until the vault copy has its card.
struct PendingBook: Codable, Hashable, Identifiable {
    var meta: BookMeta
    var addedAt: Date
    /// The outbox event that carries the card to the vault, while it has not been sent.
    var eventID: String?
    var id: String { meta.isbn13 }
}

/// Where the learner is in a book.
struct BookProgress: Codable, Hashable {
    enum Status: String, Codable { case reading, finished }
    var status: Status = .reading
    var page: Int?
    /// Chapters (numbers from the card's list) the learner has read.
    var readChapters: [Int] = []
    var startedAt = Date()
    var finishedAt: Date?
    var updatedAt = Date()
}

/// A sentence from a reading session: what the learner takes away from it.
struct ReadingThought: Codable, Hashable, Identifiable {
    var id: String
    var bookKey: String
    var text: String
    var page: Int?
    var at: Date
    /// Queued for the vault.
    var sent = false
}

struct LibraryState: Codable {
    var pending: [PendingBook] = []
    var progress: [String: BookProgress] = [:]
    /// Spaced repetition of the questions, by question id.
    var cards: [String: ReviewCard] = [:]
    var thoughts: [ReadingThought] = []
    /// Books whose reading state still has to go to the vault.
    var dirty: Set<String> = []
}

/// A book of the library: a card of the vault, or a scanned book whose card the bridge has not written yet.
struct LibraryBook: Identifiable, Hashable {
    var card: BookCard
    var pending: Bool
    var id: String { card.id }
    var key: String { card.key }
    var title: String { card.title }
    var author: String { card.author }
}

enum LibraryFilter: Hashable, Identifiable {
    case all, reading, finished, list, category(String)

    var id: String {
        switch self {
        case .all: return "all"
        case .reading: return "reading"
        case .finished: return "finished"
        case .list: return "list"
        case .category(let c): return "category:\(c)"
        }
    }

    var label: String {
        switch self {
        case .all: return "Alle"
        case .reading: return "Lese ich"
        case .finished: return "Gelesen"
        case .list: return "Leseliste"
        case .category(let c): return c
        }
    }
}

/// What the Bücher folder of the vault copy and the scans of the app make of the library: books, the notes that came
/// out of them, the questions in those notes, and the learner's progress.
@MainActor
@Observable
final class LibraryStore {
    private(set) var cards: [BookCard] = []
    private(set) var questions: [VaultQuestion] = []
    /// Card path -> paths of the standard notes that name the book as their source.
    private(set) var bookNotes: [String: [String]] = [:]
    /// Note path -> card paths of the books it comes from.
    private(set) var noteBooks: [String: [String]] = [:]
    private(set) var indexed = false
    var state = LibraryState()

    @ObservationIgnored private let directory: URL?
    @ObservationIgnored private var saveTask: Task<Void, Never>?
    @ObservationIgnored private let coverCache = NSCache<NSString, UIImage>()
    @ObservationIgnored private var indexedSignature = ""

    /// `directory` nil keeps everything in memory (demo).
    init(directory: URL?) {
        self.directory = directory
        if let directory, let data = try? Data(contentsOf: directory.appendingPathComponent("state.json")),
           let s = try? JSONDecoder().decode(LibraryState.self, from: data) {
            state = s
        }
    }

    private var coversDirectory: URL? { directory?.appendingPathComponent("covers", isDirectory: true) }

    func persist() {
        guard let directory else { return }
        saveTask?.cancel()
        let snapshot = state
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard !Task.isCancelled else { return }
            try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            if let data = try? JSONEncoder().encode(snapshot) {
                try? data.write(to: directory.appendingPathComponent("state.json"), options: .atomic)
            }
        }
    }

    // MARK: books

    static func card(from m: BookMeta) -> BookCard {
        BookCard(path: BookNames.notePath(title: m.title, author: m.author), title: m.title, author: m.author, summary: m.summary, pages: m.pages,
                 publisher: m.publisher ?? "", published: m.published ?? "", categories: m.categories, isbn13: m.isbn13, isbn10: m.isbn10, link: m.link)
    }

    /// Cards of the vault, plus scanned books the vault copy does not have yet.
    var books: [LibraryBook] {
        let vaultISBN = Set(cards.compactMap(\.isbn13))
        let vaultPaths = Set(cards.map(\.path))
        var out = cards.map { LibraryBook(card: $0, pending: false) }
        for p in state.pending where !vaultISBN.contains(p.meta.isbn13) {
            let card = Self.card(from: p.meta)
            if vaultPaths.contains(card.path) { continue }
            out.append(LibraryBook(card: card, pending: true))
        }
        return out.sorted { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
    }

    func book(id: String) -> LibraryBook? { books.first { $0.id == id } }

    func book(isbn13: String) -> LibraryBook? { books.first { $0.card.isbn13 == isbn13 } }

    func progress(_ key: String) -> BookProgress? { state.progress[key] }

    func isFinished(_ book: LibraryBook) -> Bool { book.card.read || state.progress[book.key]?.status == .finished }

    func isReading(_ book: LibraryBook) -> Bool { !isFinished(book) && state.progress[book.key]?.status == .reading }

    /// The book read most recently, for the card on top of the shelf.
    var currentlyReading: LibraryBook? {
        books.filter { isReading($0) }.max { (state.progress[$0.key]?.updatedAt ?? .distantPast) < (state.progress[$1.key]?.updatedAt ?? .distantPast) }
    }

    func filters(for books: [LibraryBook]) -> [LibraryFilter] {
        var out: [LibraryFilter] = [.all]
        if books.contains(where: { isReading($0) }) { out.append(.reading) }
        if books.contains(where: { isFinished($0) }) { out.append(.finished) }
        if books.contains(where: { isList($0) }) { out.append(.list) }
        var counts: [String: Int] = [:]
        for b in books { for c in b.card.categories.prefix(3) { counts[c, default: 0] += 1 } }
        let top = counts.filter { $0.value >= 2 }.sorted { ($0.value, $1.key) > ($1.value, $0.key) }.prefix(4).map { $0.key }
        out += top.map { .category($0) }
        return out
    }

    func isList(_ book: LibraryBook) -> Bool { book.card.tags.contains { $0.lowercased().contains("leseliste") } }

    func matches(_ book: LibraryBook, _ filter: LibraryFilter) -> Bool {
        switch filter {
        case .all: return true
        case .reading: return isReading(book)
        case .finished: return isFinished(book)
        case .list: return isList(book)
        case .category(let c): return book.card.categories.contains(c)
        }
    }

    // MARK: covers

    /// The cover of a book: from the vault copy, or the file the scan saved on the device.
    func cover(for book: LibraryBook, wiki: WikiStore) -> UIImage? {
        let name = book.card.coverName
        let cacheKey = (name ?? "scan-\(book.key)") as NSString
        if let hit = coverCache.object(forKey: cacheKey) { return hit }
        var data: Data?
        if let name {
            data = wiki.asset(named: name)
            // file names from another system may be composed differently (ä as one character or as a + dots)
            if data == nil { data = wiki.asset(named: name.precomposedStringWithCanonicalMapping) }
            if data == nil { data = wiki.asset(named: name.decomposedStringWithCanonicalMapping) }
        }
        if data == nil, let dir = coversDirectory, let isbn = book.card.isbn13 {
            data = try? Data(contentsOf: dir.appendingPathComponent("\(isbn).jpg"))
        }
        guard let data, let image = UIImage(data: data) else { return nil }
        coverCache.setObject(image, forKey: cacheKey)
        return image
    }

    private func saveCover(_ data: Data, isbn: String) {
        guard let dir = coversDirectory else { return }
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try? data.write(to: dir.appendingPathComponent("\(isbn).jpg"), options: .atomic)
        coverCache.removeObject(forKey: "scan-\(isbn)" as NSString)
    }

    // MARK: scanned books

    func addPending(_ meta: BookMeta, cover: Data?, eventID: String?) {
        state.pending.removeAll { $0.meta.isbn13 == meta.isbn13 }
        state.pending.append(PendingBook(meta: meta, addedAt: Date(), eventID: eventID))
        if let cover { saveCover(cover, isbn: meta.isbn13) }
        persist()
    }

    func removePending(isbn13: String) {
        state.pending.removeAll { $0.meta.isbn13 == isbn13 }
        persist()
    }

    func pending(isbn13: String) -> PendingBook? { state.pending.first { $0.meta.isbn13 == isbn13 } }

    // MARK: index of the vault copy

    func refresh(wiki: WikiStore, force: Bool = false) async {
        wiki.loadIfNeeded()
        // nothing to read again while the copy is the one already indexed
        let signature = "\(wiki.notes.count)|\(wiki.generatedAt?.timeIntervalSince1970 ?? 0)"
        if !force, indexed, signature == indexedSignature { return }
        let paths = wiki.notes.map(\.path)
        let resolver = wiki.resolver
        let index = await Task.detached(priority: .utility) { LibraryIndex.build(paths: paths, resolver: resolver) }.value
        cards = index.cards
        questions = index.questions
        bookNotes = index.bookNotes
        noteBooks = index.noteBooks
        indexed = true
        indexedSignature = signature
        // scanned books the vault has caught up with
        let have = Set(cards.compactMap(\.isbn13))
        if state.pending.contains(where: { have.contains($0.meta.isbn13) }) {
            state.pending.removeAll { have.contains($0.meta.isbn13) }
            persist()
        }
    }

    // MARK: questions

    func questions(forNote path: String) -> [VaultQuestion] { questions.filter { $0.notePath == path } }

    func questions(for book: BookCard) -> [VaultQuestion] {
        let notes = Set(bookNotes[book.path] ?? [])
        return questions.filter { notes.contains($0.notePath) }
    }

    /// Due questions first, then new ones.
    func selection(from pool: [VaultQuestion], limit: Int = 10, now: Date = Date()) -> [VaultQuestion] {
        let due = pool.compactMap { q -> (VaultQuestion, Date)? in
            guard let c = state.cards[q.id], c.due <= now else { return nil }
            return (q, c.due)
        }.sorted { $0.1 < $1.1 }.map(\.0)
        let fresh = pool.filter { state.cards[$0.id] == nil }
        return Array((due + fresh).prefix(limit))
    }

    /// Questions to ask now: due ones and ones never asked.
    func askable(in pool: [VaultQuestion], now: Date = Date()) -> Int {
        pool.filter { q in state.cards[q.id].map { $0.due <= now } ?? true }.count
    }

    func recordResults(_ results: [StepResult], now: Date = Date()) {
        let known = Set(questions.map(\.id))
        var changed = false
        for r in results {
            let isExplain = r.stepId.hasPrefix("explain-")
            guard known.contains(r.stepId) || isExplain else { continue }
            let card = state.cards[r.stepId] ?? ReviewCard(courseId: "bibliothek", lessonId: "buch", stepId: r.stepId, due: now)
            state.cards[r.stepId] = Scheduler.review(card, quality: r.quality, now: now)
            changed = true
        }
        if changed { persist() }
    }

    /// "Explain it in two minutes": the thesis of a book against what its card or notes say.
    func explainQuestion(for book: LibraryBook, wiki: WikiStore) -> VaultQuestion {
        var answer = ""
        if !book.pending, let md = wiki.markdown(book.card.path) {
            let body = WikiText.split(md).body.replacingOccurrences(of: "\r\n", with: "\n")
            for heading in ["Synthese", "Worum es geht"] {
                if let section = Self.section(heading, in: body), section.count >= 40 { answer = section; break }
            }
        }
        if answer.isEmpty { answer = Self.shorten(book.card.summary, to: 700) }
        let title = book.card.title
        return VaultQuestion(id: "explain-\(Stable.hash(book.key))", notePath: book.card.path, noteTitle: title,
                             question: "Erkläre in zwei Minuten, worum es in **\(title)** geht und was die zentrale These ist.",
                             points: [], answer: answer.isEmpty ? "Noch keine Zusammenfassung im Vault. Vergleiche mit dem Klappentext oder lies das Buch weiter." : answer,
                             source: nil, automatic: true)
    }

    /// Text of the section under `## heading`, up to the next heading of the same or a higher level.
    static func section(_ heading: String, in body: String) -> String? {
        var inside = false
        var lines: [String] = []
        for raw in body.components(separatedBy: "\n") {
            let t = raw.trimmingCharacters(in: .whitespaces)
            if t.hasPrefix("#") {
                if inside { break }
                let title = t.drop { $0 == "#" }.trimmingCharacters(in: .whitespaces)
                inside = title.caseInsensitiveCompare(heading) == .orderedSame
                continue
            }
            if inside { lines.append(raw) }
        }
        let text = lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? nil : text
    }

    static func shorten(_ s: String, to limit: Int) -> String {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        guard t.count > limit else { return t }
        let cut = String(t.prefix(limit))
        if let dot = cut.lastIndex(where: { ".!?".contains($0) }), cut.distance(from: cut.startIndex, to: dot) > limit / 2 {
            return String(cut[...dot])
        }
        return cut + "…"
    }

    // MARK: reading state

    func setStatus(_ key: String, _ status: BookProgress.Status?) {
        if let status {
            var p = state.progress[key] ?? BookProgress()
            p.status = status
            p.updatedAt = Date()
            if status == .finished { p.finishedAt = Date() } else { p.finishedAt = nil }
            state.progress[key] = p
        } else {
            state.progress[key] = nil
        }
        state.dirty.insert(key)
        persist()
    }

    /// A reading session: where the learner is, which chapters are read, and what they take away.
    func saveSession(key: String, page: Int?, readChapters: [Int], thought: String?) {
        var p = state.progress[key] ?? BookProgress()
        if p.status != .finished { p.status = .reading }
        p.page = page
        p.readChapters = readChapters.sorted()
        p.updatedAt = Date()
        state.progress[key] = p
        if let thought = thought?.trimmingCharacters(in: .whitespacesAndNewlines), !thought.isEmpty {
            state.thoughts.insert(ReadingThought(id: UUID().uuidString.lowercased(), bookKey: key, text: thought, page: page, at: Date()), at: 0)
        }
        state.dirty.insert(key)
        persist()
    }

    func thoughts(for key: String) -> [ReadingThought] { state.thoughts.filter { $0.bookKey == key } }

    func deleteThought(_ id: String) {
        state.thoughts.removeAll { $0.id == id }
        persist()
    }

    /// The events that bring the reading state of a book (whose card is in the vault) into its card. The block
    /// "Lesestand" is replaced each time, every thought is a block of its own and goes once.
    func readingEvents(for card: BookCard, now: Date = Date()) -> [OutgoingEvent] {
        let key = card.key
        var out: [OutgoingEvent] = []
        if let p = state.progress[key] {
            var lines: [String] = []
            if let page = p.page {
                lines.append(card.pages.map { "Seite \(page) von \($0)" } ?? "Seite \(page)")
            }
            if !p.readChapters.isEmpty {
                let names = p.readChapters.map { n in card.chapters.first { $0.number == n }?.label ?? "Kapitel \(n)" }
                lines.append("Gelesen: " + names.joined(separator: ", "))
            }
            if p.status == .finished { lines.append("Ausgelesen") }
            if !lines.isEmpty {
                out.append(LibraryBridge.readingEvent(cardPath: card.path, title: card.title, block: "lesestand", text: lines.joined(separator: "\n\n"),
                                                     source: "Lernwerk, Lesestand", now: now))
            }
        }
        for i in state.thoughts.indices where state.thoughts[i].bookKey == key && !state.thoughts[i].sent {
            let t = state.thoughts[i]
            let text = t.page.map { "\(t.text)\n\n(Seite \($0))" } ?? t.text
            out.append(LibraryBridge.readingEvent(cardPath: card.path, title: card.title, block: "gedanke-\(Stable.hash(t.id).prefix(12))", text: text,
                                                 source: "Lernwerk, Lesesitzung", now: now))
            state.thoughts[i].sent = true
        }
        state.dirty.remove(key)
        persist()
        return out
    }
}

/// The library as the vault copy shows it: cards, notes of the books, and questions. Built off the main thread.
struct LibraryIndex: Sendable {
    var cards: [BookCard] = []
    var questions: [VaultQuestion] = []
    var bookNotes: [String: [String]] = [:]
    var noteBooks: [String: [String]] = [:]

    static func build(paths: [String], resolver: WikiLinkResolver) -> LibraryIndex {
        var out = LibraryIndex()
        func read(_ p: String) -> String? { try? String(contentsOf: WikiStore.filesDir.appendingPathComponent(p), encoding: .utf8) }
        func isMarkdown(_ p: String) -> Bool { p.lowercased().hasSuffix(".md") }
        let cardPaths = paths.filter { $0.hasPrefix("Bücher/") && isMarkdown($0) && !$0.dropFirst("Bücher/".count).contains("/") }
        let cardSet = Set(cardPaths)
        for p in cardPaths {
            if let text = read(p), let card = BookCard.parse(path: p, markdown: text) { out.cards.append(card) }
        }
        guard !out.cards.isEmpty || paths.contains(where: { $0.hasPrefix("Bücher/") }) else {
            // no books in the copy: only the questions in notes are of interest
            for p in paths where isMarkdown(p) {
                guard let text = read(p), text.range(of: "[!question", options: .caseInsensitive) != nil else { continue }
                out.questions += QuestionParser.questions(in: text, path: p)
            }
            return out
        }
        for p in paths where isMarkdown(p) && !p.hasPrefix("Bücher/") && !p.hasPrefix("Cover/") {
            guard let text = read(p) else { continue }
            let hasQuestion = text.range(of: "[!question", options: .caseInsensitive) != nil || text.range(of: "[!frage", options: .caseInsensitive) != nil
            var books: [String] = []
            if text.hasPrefix("---") {
                for link in QuestionParser.bookLinks(in: text) {
                    if let r = resolver.resolve(link, from: p), cardSet.contains(r), !books.contains(r) { books.append(r) }
                }
            }
            guard hasQuestion || !books.isEmpty else { continue }
            if !books.isEmpty {
                out.noteBooks[p] = books
                for b in books { out.bookNotes[b, default: []].append(p) }
            }
            var qs = hasQuestion ? QuestionParser.questions(in: text, path: p) : []
            if qs.isEmpty, !books.isEmpty, let auto = QuestionParser.automatic(in: text, path: p) { qs.append(auto) }
            out.questions += qs
        }
        return out
    }
}
