import Foundation

// The library: books of the vault (cards in Bücher/), what a scan finds out about a book, the questions written
// into the standard notes, and the events that carry a scanned book and the reading state back into the vault.
// Pure logic without UI, so it is tested like the rest of the core.

// MARK: - small helpers

private extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var nilIfEmpty: String? { let t = trimmed; return t.isEmpty ? nil : t }
}

/// Regular expression groups of every match; group 0 is the whole match, missing groups are empty strings.
private func captures(_ pattern: String, in text: String, options: NSRegularExpression.Options = []) -> [[String]] {
    guard let re = try? NSRegularExpression(pattern: pattern, options: options) else { return [] }
    let ns = text as NSString
    return re.matches(in: text, range: NSRange(location: 0, length: ns.length)).map { m in
        (0..<m.numberOfRanges).map { i in
            let r = m.range(at: i)
            return r.location == NSNotFound ? "" : ns.substring(with: r)
        }
    }
}

public enum Stable {
    /// 64-bit FNV-1a as hex: the same on every device and run, for ids of questions and files.
    public static func hash(_ s: String) -> String {
        var h: UInt64 = 0xcbf2_9ce4_8422_2325
        for b in s.utf8 {
            h ^= UInt64(b)
            h = h &* 0x0000_0100_0000_01b3
        }
        return String(h, radix: 16)
    }
}

// MARK: - ISBN

public enum ISBN {
    /// Digits and X of a scanned or typed text; hyphens, spaces and the word ISBN fall away.
    public static func digits(_ s: String) -> String {
        s.uppercased().filter { ($0.isASCII && $0.isNumber) || $0 == "X" }
    }

    private static func check13(_ twelve: String) -> Int {
        var sum = 0
        for (i, c) in twelve.enumerated() { sum += (c.wholeNumberValue ?? 0) * (i % 2 == 0 ? 1 : 3) }
        return (10 - sum % 10) % 10
    }

    public static func isValid13(_ s: String) -> Bool {
        guard s.count == 13, s.allSatisfy({ $0.isASCII && $0.isNumber }), s.hasPrefix("978") || s.hasPrefix("979") else { return false }
        return check13(String(s.prefix(12))) == s.last?.wholeNumberValue
    }

    public static func isValid10(_ s: String) -> Bool {
        let chars = Array(s.uppercased())
        guard chars.count == 10 else { return false }
        var sum = 0
        for (i, c) in chars.enumerated() {
            let v: Int
            if c == "X", i == 9 {
                v = 10
            } else if c.isASCII, let n = c.wholeNumberValue {
                v = n
            } else {
                return false
            }
            sum += (10 - i) * v
        }
        return sum % 11 == 0
    }

    /// 0441172717 -> 9780441172719
    public static func to13(_ isbn10: String) -> String? {
        let s = isbn10.uppercased()
        guard isValid10(s) else { return nil }
        let core = "978" + String(s.prefix(9))
        return core + String(check13(core))
    }

    /// 9780441172719 -> 0441172717 (only for 978 numbers, the others have no ISBN-10).
    public static func to10(_ isbn13: String) -> String? {
        guard isValid13(isbn13), isbn13.hasPrefix("978") else { return nil }
        let nine = Array(isbn13.dropFirst(3).prefix(9))
        var sum = 0
        for (i, c) in nine.enumerated() { sum += (10 - i) * (c.wholeNumberValue ?? 0) }
        let check = (11 - sum % 11) % 11
        return String(nine) + (check == 10 ? "X" : String(check))
    }

    /// The ISBN-13 of a scanned or typed text: 13 digits starting with 978 or 979, or an ISBN-10 converted; nil if
    /// the check digit is wrong.
    public static func normalize(_ text: String) -> String? {
        let d = digits(text)
        if d.count == 13, isValid13(d) { return d }
        if d.count == 10, let t = to13(d) { return t }
        return nil
    }
}

// MARK: - what is known about a book

public struct BookMeta: Codable, Hashable, Sendable {
    public var isbn13: String
    public var isbn10: String?
    public var title: String
    public var originalTitle: String?
    public var author: String
    public var translator: String?
    public var summary: String
    public var pages: Int?
    public var publisher: String?
    /// As the book-search plugin writes it: "2008/07/03" or just the year.
    public var published: String?
    public var categories: [String]
    public var link: String?
    public var coverURL: String?

    public init(isbn13: String, isbn10: String? = nil, title: String, originalTitle: String? = nil, author: String, translator: String? = nil,
                summary: String = "", pages: Int? = nil, publisher: String? = nil, published: String? = nil, categories: [String] = [],
                link: String? = nil, coverURL: String? = nil) {
        self.isbn13 = isbn13
        self.isbn10 = isbn10
        self.title = title
        self.originalTitle = originalTitle
        self.author = author
        self.translator = translator
        self.summary = summary
        self.pages = pages
        self.publisher = publisher
        self.published = published
        self.categories = categories
        self.link = link
        self.coverURL = coverURL
    }
}

/// Where a scan looks a book up: Open Library first, Google Books for what is missing (description, categories).
public enum BookLookup {
    public static func openLibraryURL(isbn13: String) -> URL? {
        URL(string: "https://openlibrary.org/api/books?bibkeys=ISBN:\(isbn13)&format=json&jscmd=data")
    }

    public static func googleBooksURL(isbn13: String) -> URL? {
        URL(string: "https://www.googleapis.com/books/v1/volumes?q=isbn:\(isbn13)&maxResults=1")
    }

    /// Cover from Open Library; `default=false` makes a missing cover an error instead of a blank image.
    public static func coverURL(isbn13: String) -> URL? {
        URL(string: "https://covers.openlibrary.org/b/isbn/\(isbn13)-L.jpg?default=false")
    }

    private static func strings(_ any: Any?) -> [String] {
        (any as? [String])?.map(\.trimmed).filter { !$0.isEmpty } ?? []
    }

    private static func names(_ any: Any?) -> [String] {
        ((any as? [[String: Any]]) ?? []).compactMap { ($0["name"] as? String)?.nilIfEmpty }
    }

    /// Title with subtitle: "Economics Rules: The Rights and Wrongs of the Dismal Science".
    private static func joined(_ title: String, _ subtitle: String?) -> String {
        guard let sub = subtitle?.nilIfEmpty, !title.lowercased().contains(sub.lowercased()) else { return title }
        return "\(title): \(sub)"
    }

    public static func parseOpenLibrary(_ data: Data, isbn13: String) -> BookMeta? {
        guard let root = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let rec = (root["ISBN:\(isbn13)"] ?? root.values.first) as? [String: Any],
              let title = (rec["title"] as? String)?.nilIfEmpty else { return nil }
        let authors = names(rec["authors"])
        let ids = rec["identifiers"] as? [String: Any]
        let isbn10 = strings(ids?["isbn_10"]).first ?? ISBN.to10(isbn13)
        let subjects = names(rec["subjects"]).filter { $0.count <= 40 }.prefix(6)
        var cover: String?
        if let c = rec["cover"] as? [String: Any] { cover = (c["large"] ?? c["medium"] ?? c["small"]) as? String }
        var notes = rec["notes"] as? String
        if notes == nil, let n = rec["notes"] as? [String: Any] { notes = n["value"] as? String }
        return BookMeta(
            isbn13: isbn13, isbn10: isbn10,
            title: joined(title, rec["subtitle"] as? String),
            author: authors.joined(separator: ", "),
            summary: notes?.trimmed ?? "",
            pages: rec["number_of_pages"] as? Int,
            publisher: names(rec["publishers"]).first,
            published: (rec["publish_date"] as? String)?.nilIfEmpty,
            categories: Array(subjects),
            link: (rec["url"] as? String)?.nilIfEmpty,
            coverURL: cover
        )
    }

    public static func parseGoogleBooks(_ data: Data, isbn13: String) -> BookMeta? {
        guard let root = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let item = (root["items"] as? [[String: Any]])?.first,
              let info = item["volumeInfo"] as? [String: Any],
              let title = (info["title"] as? String)?.nilIfEmpty else { return nil }
        let ids = (info["industryIdentifiers"] as? [[String: Any]]) ?? []
        let isbn10Entry = ids.first { ($0["type"] as? String) == "ISBN_10" }
        let isbn10 = isbn10Entry?["identifier"] as? String
        var cover: String?
        if let links = info["imageLinks"] as? [String: Any] {
            cover = ((links["large"] ?? links["medium"] ?? links["thumbnail"] ?? links["smallThumbnail"]) as? String)?
                .replacingOccurrences(of: "http://", with: "https://")
        }
        var published = (info["publishedDate"] as? String)?.nilIfEmpty
        // Google writes 2008-07-03, the vault cards 2008/07/03
        published = published?.replacingOccurrences(of: "-", with: "/")
        return BookMeta(
            isbn13: isbn13, isbn10: isbn10 ?? ISBN.to10(isbn13),
            title: joined(title, info["subtitle"] as? String),
            author: strings(info["authors"]).joined(separator: ", "),
            summary: (info["description"] as? String)?.trimmed ?? "",
            pages: info["pageCount"] as? Int,
            publisher: (info["publisher"] as? String)?.nilIfEmpty,
            published: published,
            categories: strings(info["categories"]).flatMap { $0.components(separatedBy: " / ") }.prefix(6).map { $0 },
            link: (info["infoLink"] as? String)?.nilIfEmpty,
            coverURL: cover
        )
    }

    /// The first record, completed with what only the second one has.
    public static func merge(_ primary: BookMeta?, _ secondary: BookMeta?) -> BookMeta? {
        guard var a = primary ?? secondary else { return nil }
        guard let b = (primary == nil ? nil : secondary) else { return a }
        if a.author.isEmpty { a.author = b.author }
        if a.summary.isEmpty { a.summary = b.summary }
        if a.pages == nil { a.pages = b.pages }
        if a.publisher == nil { a.publisher = b.publisher }
        if a.published == nil { a.published = b.published }
        if a.categories.isEmpty { a.categories = b.categories }
        if a.coverURL == nil { a.coverURL = b.coverURL }
        if a.isbn10 == nil { a.isbn10 = b.isbn10 }
        return a
    }
}

// MARK: - frontmatter

/// The flat properties of a note: `key: value` and lists. Keys compare without case, spaces and punctuation
/// ("Total Pages" = totalpages), as the vault writes them both ways.
public struct FrontMatter: Sendable, Equatable {
    public private(set) var scalars: [String: String] = [:]
    public private(set) var lists: [String: [String]] = [:]

    public static func key(_ s: String) -> String { s.lowercased().filter { $0.isLetter || $0.isNumber } }

    static func unquote(_ s: String) -> String {
        var t = s.trimmingCharacters(in: .whitespaces)
        if t.count >= 2, t.hasPrefix("\""), t.hasSuffix("\"") {
            t = String(t.dropFirst().dropLast())
            t = t.replacingOccurrences(of: "\\\"", with: "\"").replacingOccurrences(of: "\\n", with: "\n").replacingOccurrences(of: "\\\\", with: "\\")
        } else if t.count >= 2, t.hasPrefix("'"), t.hasSuffix("'") {
            t = String(t.dropFirst().dropLast()).replacingOccurrences(of: "''", with: "'")
        }
        return t
    }

    public init(_ yaml: String?) {
        guard let yaml else { return }
        let lines = yaml.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: "\n")
        var i = 0
        while i < lines.count {
            let line = lines[i]
            i += 1
            guard let first = line.first, first != " ", first != "\t", first != "-", first != "#", let colon = line.firstIndex(of: ":") else { continue }
            let key = Self.key(String(line[..<colon]))
            guard !key.isEmpty else { continue }
            let rest = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
            if rest.hasPrefix("|") || rest.hasPrefix(">") {
                var parts: [String] = []
                while i < lines.count, lines[i].isEmpty || lines[i].hasPrefix(" ") || lines[i].hasPrefix("\t") {
                    parts.append(lines[i].trimmingCharacters(in: .whitespaces))
                    i += 1
                }
                scalars[key] = parts.joined(separator: rest.hasPrefix(">") ? " " : "\n").trimmed
            } else if rest.isEmpty {
                var items: [String] = []
                while i < lines.count {
                    let t = lines[i].trimmingCharacters(in: .whitespaces)
                    guard t.hasPrefix("- ") || t == "-" else { break }
                    items.append(Self.unquote(String(t.dropFirst())))
                    i += 1
                }
                if items.isEmpty { scalars[key] = "" } else { lists[key] = items }
            } else if rest.hasPrefix("["), rest.hasSuffix("]") {
                lists[key] = rest.dropFirst().dropLast().split(separator: ",").map { Self.unquote(String($0)) }.filter { !$0.isEmpty }
            } else {
                scalars[key] = Self.unquote(rest)
            }
        }
    }

    public func string(_ names: String...) -> String? {
        for n in names {
            if let v = scalars[Self.key(n)], !v.trimmed.isEmpty { return v.trimmed }
        }
        return nil
    }

    /// A list, or a scalar with commas ("Categories: Economics, Politics").
    public func list(_ names: String...) -> [String] {
        for n in names {
            let k = Self.key(n)
            if let l = lists[k], !l.isEmpty { return l }
            if let s = scalars[k], !s.trimmed.isEmpty { return s.split(separator: ",").map { String($0).trimmed }.filter { !$0.isEmpty } }
        }
        return []
    }

    public func bool(_ names: String...) -> Bool? {
        for n in names {
            if let v = scalars[Self.key(n)]?.lowercased() {
                if v == "true" || v == "yes" { return true }
                if v == "false" || v == "no" { return false }
            }
        }
        return nil
    }
}

// MARK: - a book of the vault

public struct BookChapter: Hashable, Sendable, Identifiable {
    public var id: Int { number }
    /// Position in the list, from 1.
    public var number: Int
    public var label: String
    public var title: String
    /// Worked through into notes (ticked in the hub).
    public var done: Bool
    /// Link targets of the notes that came out of the chapter.
    public var notes: [String]

    public init(number: Int, label: String, title: String, done: Bool, notes: [String]) {
        self.number = number
        self.label = label
        self.title = title
        self.done = done
        self.notes = notes
    }

    /// The checklist under "## Lesefortschritt": `- [x] Kapitel 3 -- Titel -- [[Notiz]], [[Notiz]]`.
    public static func parse(body: String) -> [BookChapter] {
        var out: [BookChapter] = []
        var inside = false
        for raw in body.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: "\n") {
            let line = raw.trimmingCharacters(in: .whitespaces)
            if line.hasPrefix("#") {
                inside = !captures("^#{2,4}\\s+Lesefortschritt\\s*$", in: line, options: [.caseInsensitive]).isEmpty
                continue
            }
            guard inside, let m = captures("^[-*]\\s+\\[([ xX])\\]\\s+(.*)$", in: line).first else { continue }
            let done = m[1].lowercased() == "x"
            var text = m[2]
            let links = captures("\\[\\[([^\\]|#]+)(?:#[^\\]|]*)?(?:\\|[^\\]]*)?\\]\\]", in: text).map { $0[1].trimmed }
            text = text.replacingOccurrences(of: "\\[\\[[^\\]]*\\]\\]", with: "", options: .regularExpression)
            let parts = text.replacingOccurrences(of: " — ", with: " -- ").replacingOccurrences(of: " – ", with: " -- ")
                .components(separatedBy: " -- ")
                .map { $0.trimmingCharacters(in: CharacterSet(charactersIn: " ,;-")) }
                .filter { !$0.isEmpty }
            guard let label = parts.first else { continue }
            out.append(BookChapter(number: out.count + 1, label: label, title: parts.count > 1 ? parts[1] : label, done: done, notes: links))
        }
        return out
    }
}

public struct BookCard: Hashable, Sendable, Identifiable {
    public var id: String { path }
    public var path: String
    public var title: String
    public var author: String
    public var summary: String
    public var pages: Int?
    public var publisher: String
    public var published: String
    public var categories: [String]
    public var isbn13: String?
    public var isbn10: String?
    public var link: String?
    /// File name of the cover from `Cover: "[[Name.jpg]]"`.
    public var coverName: String?
    public var read: Bool
    public var dateRead: String?
    public var tags: [String]
    /// seedling, growing or evergreen once the book is worked through with the book skill.
    public var status: String?
    public var related: [String]
    public var chapters: [BookChapter]

    public init(path: String, title: String, author: String, summary: String = "", pages: Int? = nil, publisher: String = "", published: String = "",
                categories: [String] = [], isbn13: String? = nil, isbn10: String? = nil, link: String? = nil, coverName: String? = nil,
                read: Bool = false, dateRead: String? = nil, tags: [String] = [], status: String? = nil, related: [String] = [],
                chapters: [BookChapter] = []) {
        self.path = path
        self.title = title
        self.author = author
        self.summary = summary
        self.pages = pages
        self.publisher = publisher
        self.published = published
        self.categories = categories
        self.isbn13 = isbn13
        self.isbn10 = isbn10
        self.link = link
        self.coverName = coverName
        self.read = read
        self.dateRead = dateRead
        self.tags = tags
        self.status = status
        self.related = related
        self.chapters = chapters
    }

    /// Worked through into notes, not just a card with the data of the book.
    public var isHub: Bool { status != nil || !chapters.isEmpty }

    /// Key for what the app remembers about the book: the ISBN, otherwise the path of the card.
    public var key: String { isbn13 ?? path }

    /// "[[Name.jpg]]" or "Name.jpg" -> "Name.jpg"
    static func linkTarget(_ s: String) -> String {
        var t = s.trimmed
        if t.hasPrefix("[["), t.hasSuffix("]]") { t = String(t.dropFirst(2).dropLast(2)) }
        if let bar = t.firstIndex(of: "|") { t = String(t[..<bar]) }
        return t.trimmed
    }

    /// Reads a card of `Bücher/`. A note without properties still gives a book, named after its file.
    public static func parse(path: String, markdown: String) -> BookCard? {
        let (yaml, body) = WikiText.split(markdown)
        let fm = FrontMatter(yaml)
        let stem = WikiText.title(path)
        var author = fm.string("Author", "Autor") ?? ""
        var title = fm.string("Title", "Titel") ?? ""
        if title.isEmpty {
            if let r = stem.range(of: " - ", options: .backwards) {
                title = String(stem[..<r.lowerBound])
                if author.isEmpty { author = String(stem[r.upperBound...]) }
            } else {
                title = stem
            }
        }
        guard !title.isEmpty else { return nil }
        let isbn13 = fm.string("isbn 13", "isbn13").flatMap { ISBN.normalize($0) }
        let isbn10 = fm.string("isbn 10", "isbn10")
        var rawTags = fm.lists["tags"] ?? []
        if rawTags.isEmpty, let single = fm.scalars["tags"], !single.isEmpty { rawTags = [single] }
        let tags = rawTags.map { $0.trimmingCharacters(in: CharacterSet(charactersIn: "#/ ")) }
        return BookCard(
            path: path, title: title, author: author,
            summary: fm.string("Description", "Beschreibung") ?? "",
            pages: fm.string("Total Pages", "Seiten", "pages").flatMap { Int($0.filter(\.isNumber)) },
            publisher: fm.string("Publisher", "Verlag") ?? "",
            published: fm.string("Published", "Erschienen") ?? "",
            categories: fm.list("Categories", "Kategorien"),
            isbn13: isbn13, isbn10: isbn10,
            link: fm.string("Link"),
            coverName: fm.string("Cover").map(linkTarget).flatMap { $0.isEmpty ? nil : $0 },
            read: fm.bool("Read", "Gelesen") ?? false,
            dateRead: fm.string("Date read", "Gelesen am"),
            tags: tags,
            status: fm.string("status"),
            related: fm.list("related").map(linkTarget),
            chapters: BookChapter.parse(body: body)
        )
    }
}

/// The names the bridge gives a scanned book in the vault, so the app can tell when its card has arrived.
public enum BookNames {
    private static func word(_ s: String, keepDots: Bool) -> String {
        var t = s.components(separatedBy: CharacterSet(charactersIn: "\\/:*?\"<>|#^[]")).joined()
        if !keepDots { t = t.replacingOccurrences(of: ".", with: "") }
        t = t.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        while let last = t.last, last == "." || last == " " { t.removeLast() }
        return t.trimmed
    }

    public static func notePath(folder: String = "Bücher", title: String, author: String) -> String {
        let t = word(title, keepDots: false).nilIfEmpty ?? "Buch"
        let a = word(author, keepDots: false).nilIfEmpty ?? "Unbekannt"
        let name = String("\(t) - \(a)".prefix(180)).trimmed
        return "\(folder)/\(name).md"
    }

    public static func coverName(title: String, author: String) -> String {
        let t = word(title, keepDots: true).nilIfEmpty ?? "Buch"
        let a = word(author, keepDots: true).nilIfEmpty ?? "Unbekannt"
        let name = String("\(t) — \(a)".prefix(180)).trimmed
        return "\(name).jpg"
    }
}

// MARK: - questions in the standard notes

/// One question of a note. Written as a foldable callout, so Obsidian keeps the answer closed:
///
///     > [!question]- Warum gefährdet zentrale Planung den Rechtsstaat?
///     > - Allgemeine, vorab bekannte Regeln binden den Staat.
///     > - Planung verlangt Entscheidungen im Einzelfall.
///     >
///     > Quelle: [[The Road to Serfdom - Friedrich A Hayek]], Kap. 6
///
/// Bullet points are what the answer should contain; the learner ticks them off. A plain answer is read and judged.
public struct VaultQuestion: Hashable, Sendable, Identifiable {
    public var id: String
    public var notePath: String
    public var noteTitle: String
    public var question: String
    public var points: [String]
    public var answer: String
    public var source: String?
    /// Made from the note's definition, not written by hand.
    public var automatic: Bool

    public init(id: String, notePath: String, noteTitle: String, question: String, points: [String], answer: String, source: String?, automatic: Bool) {
        self.id = id
        self.notePath = notePath
        self.noteTitle = noteTitle
        self.question = question
        self.points = points
        self.answer = answer
        self.source = source
        self.automatic = automatic
    }

    /// The question as a step for the lesson runtime: points to tick off (rubric) or a solution to compare (reveal).
    public var runtimeStep: [String: Any] {
        var solution = points.isEmpty ? answer : points.map { "- \($0)" }.joined(separator: "\n")
        if let source, !source.isEmpty { solution += "\n\n*\(source)*" }
        var step: [String: Any] = ["id": id, "md": question, "label": "Selbst prüfen", "solution": solution]
        if points.count >= 2 {
            step["type"] = "rubric"
            step["points"] = points.count
            step["criteria"] = points.map { ["md": $0, "points": 1] as [String: Any] }
            step["plain"] = true
        } else {
            step["type"] = "reveal"
            step["goodLabel"] = "Hatte ich"
            step["badLabel"] = "Noch unsicher"
        }
        return step
    }

    public var runtimeStepJSON: String {
        guard let data = try? JSONSerialization.data(withJSONObject: runtimeStep, options: [.sortedKeys]) else { return "{}" }
        return String(data: data, encoding: .utf8) ?? "{}"
    }
}

public enum QuestionParser {
    private static func plainLine(_ s: String) -> String {
        s.replacingOccurrences(of: "\\[\\[([^\\]|#]*)(#[^\\]|]*)?\\|([^\\]]*)\\]\\]", with: "$3", options: .regularExpression)
            .replacingOccurrences(of: "\\[\\[([^\\]|#]*)(#[^\\]]*)?\\]\\]", with: "$1", options: .regularExpression)
            .trimmed
    }

    /// The questions written as `> [!question]` callouts in a note (any note of the vault, in any fold state).
    public static func questions(in markdown: String, path: String) -> [VaultQuestion] {
        let body = WikiText.split(markdown).body.replacingOccurrences(of: "\r\n", with: "\n")
        guard body.range(of: "[!question", options: .caseInsensitive) != nil || body.range(of: "[!frage", options: .caseInsensitive) != nil else { return [] }
        let title = noteTitle(markdown, path: path)
        let lines = body.components(separatedBy: "\n")
        var out: [VaultQuestion] = []
        var fence = false
        var i = 0
        while i < lines.count {
            let line = lines[i]
            i += 1
            if line.trimmingCharacters(in: .whitespaces).hasPrefix("```") { fence.toggle() }
            guard !fence, let m = captures("^>\\s*\\[!(?:question|frage)\\][+-]?\\s*(.*)$", in: line, options: [.caseInsensitive]).first else { continue }
            let question = m[1].trimmed
            var block: [String] = []
            while i < lines.count, lines[i].hasPrefix(">"), captures("^>\\s*\\[!", in: lines[i]).isEmpty {
                var l = String(lines[i].dropFirst())
                if l.hasPrefix(" ") { l.removeFirst() }
                block.append(l.trimmed)
                i += 1
            }
            var points: [String] = []
            var paragraphs: [String] = []
            var source: String?
            for l in block where !l.isEmpty {
                if let b = captures("^(?:[-*+]|\\d+[.)])\\s+(.*)$", in: l).first {
                    points.append(plainLine(b[1]))
                } else if let s = captures("^(?:Quelle|Source)\\s*:\\s*(.*)$", in: l, options: [.caseInsensitive]).first {
                    source = plainLine(s[1])
                } else {
                    paragraphs.append(plainLine(l))
                }
            }
            let answer = paragraphs.joined(separator: "\n\n")
            guard !question.isEmpty, !points.isEmpty || !answer.isEmpty else { continue }
            out.append(VaultQuestion(id: Stable.hash(path + "\u{1}" + question), notePath: path, noteTitle: title, question: question,
                                     points: points, answer: answer, source: source, automatic: false))
        }
        return out
    }

    /// A question from the first paragraph under "## Definition": what is …?
    public static func automatic(in markdown: String, path: String) -> VaultQuestion? {
        let body = WikiText.split(markdown).body.replacingOccurrences(of: "\r\n", with: "\n")
        var inside = false
        var paragraph: [String] = []
        for raw in body.components(separatedBy: "\n") {
            let line = raw.trimmingCharacters(in: .whitespaces)
            if line.hasPrefix("#") {
                if inside { break }
                inside = !captures("^#{2,3}\\s+Definition\\s*$", in: line, options: [.caseInsensitive]).isEmpty
                continue
            }
            guard inside else { continue }
            if line.isEmpty {
                if !paragraph.isEmpty { break }
                continue
            }
            // callouts, tables, formulas and lists are not a plain definition
            if line.hasPrefix(">") || line.hasPrefix("|") || line.hasPrefix("$$") || line.hasPrefix("-") || line.hasPrefix("!") { if paragraph.isEmpty { continue } else { break } }
            paragraph.append(line)
        }
        let text = plainLine(paragraph.joined(separator: " "))
        guard (40...700).contains(text.count) else { return nil }
        let title = noteTitle(markdown, path: path)
        return VaultQuestion(id: Stable.hash(path + "\u{1}definition"), notePath: path, noteTitle: title, question: "Was ist **\(title)**? Erkläre es mit eigenen Worten.",
                             points: [], answer: text, source: nil, automatic: true)
    }

    static func noteTitle(_ markdown: String, path: String) -> String {
        FrontMatter(WikiText.split(markdown).frontmatter).string("title") ?? WikiText.title(path)
    }

    /// Links to the books a standard note came from: `buch: "[[…]]"` and the `quellen:` lines, as link targets.
    public static func bookLinks(in markdown: String) -> [String] {
        let fm = FrontMatter(WikiText.split(markdown).frontmatter)
        var raw: [String] = []
        for name in ["buch", "quellen"] {
            let k = FrontMatter.key(name)
            if let s = fm.scalars[k] { raw.append(s) }
            raw += fm.lists[k] ?? []
        }
        return raw.flatMap { entry in captures("\\[\\[([^\\]|#]+)", in: entry).map { $0[1].trimmed } }
    }
}

// MARK: - events to the vault

public enum LibraryBridge {
    /// The bridge announces "buecher" once it can write book cards (plugin 1.4).
    public static let bookFeature = "buecher"
    /// Heading of the reading notes in a book's card; the bridge keeps one managed block per note under it.
    public static let readingHeading = "Lesenotizen"

    private static func iso(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: date)
    }

    private static func data(_ fields: [String: Any]) -> Data {
        (try? JSONSerialization.data(withJSONObject: fields, options: [.sortedKeys])) ?? Data("{}".utf8)
    }

    /// book.add: the card and cover of a scanned book.
    public static func bookEvent(_ meta: BookMeta, cover: Data?, now: Date = Date()) -> OutgoingEvent {
        let id = UUID().uuidString.lowercased()
        var f: [String: Any] = ["id": id, "ts": iso(now), "type": "book.add", "isbn13": meta.isbn13, "title": meta.title, "author": meta.author.isEmpty ? "Unbekannt" : meta.author]
        if let v = meta.isbn10 { f["isbn10"] = v }
        if let v = meta.originalTitle?.nilIfEmpty { f["originalTitle"] = v }
        if let v = meta.translator?.nilIfEmpty { f["translator"] = v }
        if !meta.summary.isEmpty { f["description"] = String(meta.summary.prefix(8000)) }
        if let v = meta.pages, v > 0 { f["pages"] = v }
        if let v = meta.publisher?.nilIfEmpty { f["publisher"] = v }
        if let v = meta.published?.nilIfEmpty { f["published"] = v }
        let cats = meta.categories.flatMap { $0.components(separatedBy: ",") }.map(\.trimmed).filter { !$0.isEmpty && $0.count <= 80 }
        if !cats.isEmpty { f["categories"] = Array(cats.prefix(20)) }
        if let v = meta.link?.nilIfEmpty, v.count <= 500 { f["link"] = v }
        if let cover, cover.count <= 600_000 { f["cover"] = cover.base64EncodedString() }
        return OutgoingEvent(id: id, createdAt: now, json: data(f), requiredFeature: bookFeature)
    }

    /// learn.note for the card of a book: one managed block under "Lesenotizen". An empty text removes the block.
    public static func readingEvent(cardPath: String, title: String, block: String, text: String, source: String, now: Date = Date()) -> OutgoingEvent {
        let id = UUID().uuidString.lowercased()
        let day = DayKey.key(for: now)
        let f: [String: Any] = [
            "id": id, "ts": iso(now), "type": "learn.note", "path": cardPath, "title": String(title.prefix(200)),
            "block": "lernwerk-\(block)", "heading": readingHeading, "text": text, "source": source, "created": day,
        ]
        return OutgoingEvent(id: id, createdAt: now, json: data(f), requiredFeature: LearnBridge.feature)
    }
}
