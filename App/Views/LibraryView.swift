import SwiftUI
import LernwerkCore

/// Colour of a book without a cover: by field, so a shelf reads at a glance.
enum LibraryColor {
    static func hex(for card: BookCard) -> String {
        let text = (card.categories + card.tags).joined(separator: " ").lowercased()
        func has(_ words: [String]) -> Bool { words.contains { text.contains($0) } }
        if has(["econom", "ökonom", "business", "finance", "wirtschaft"]) { return "#9C7E0C" }
        if has(["philosoph", "ethik", "ethic"]) { return "#C8561A" }
        if has(["fiction", "roman", "novel", "literature", "dystop", "classics"]) { return "#4A5BA8" }
        if has(["histor", "geschichte", "politic", "politik"]) { return "#A04E33" }
        if has(["scien", "physik", "biolog", "natur"]) { return "#3F8F5A" }
        let palette = ["#4A5BA8", "#9C7E0C", "#C8561A", "#A04E33", "#3F8F5A", "#1E7E86", "#94389F", "#C22B42"]
        let h = card.title.unicodeScalars.reduce(UInt(0)) { $0 &* 31 &+ UInt($1.value) }
        return palette[Int(h % UInt(palette.count))]
    }
}

/// A set cover: title in a serif face on the colour of the field, for books without a picture.
struct SetCover: View {
    let book: LibraryBook

    var body: some View {
        let hue = Color(hex: LibraryColor.hex(for: book.card))
        ZStack(alignment: .topLeading) {
            LinearGradient(colors: [hue, hue.opacity(0.72)], startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 4) {
                Text(book.title)
                    .font(.system(.footnote, design: .serif).weight(.semibold))
                    .foregroundStyle(.white)
                    .lineLimit(5)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 0)
                Text(book.author)
                    .font(.system(size: 9))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(2)
            }
            .padding(9)
        }
    }
}

/// The cover of a book at the usual 2:3 shape.
struct BookCoverView: View {
    @Environment(AppModel.self) private var store
    let book: LibraryBook
    var radius: CGFloat = 6

    var body: some View {
        Color.clear
            .aspectRatio(2.0 / 3.0, contentMode: .fit)
            .overlay {
                if let image = store.library.cover(for: book, wiki: store.wiki) {
                    Image(uiImage: image).resizable().scaledToFill()
                } else {
                    SetCover(book: book)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(color: .black.opacity(0.32), radius: 8, y: 4)
            .accessibilityHidden(true)
    }
}

/// Reading state of a book as one short line: read, chapters or pages so far, on the reading list, new.
@MainActor
struct BookStatusText {
    let book: LibraryBook
    let library: LibraryStore

    var text: String {
        if library.isFinished(book) { return "gelesen" }
        let p = library.progress(book.key)
        if library.isReading(book) {
            if !book.card.chapters.isEmpty { return "\(p?.readChapters.count ?? 0) von \(book.card.chapters.count)" }
            if let page = p?.page, let pages = book.card.pages { return "Seite \(page) von \(pages)" }
            return "lese ich"
        }
        if book.pending { return "neu" }
        return library.isList(book) ? "Leseliste" : ""
    }

    /// How far the learner is, 0 to 1; nil when it is not known.
    var fraction: Double? {
        let p = library.progress(book.key)
        if !book.card.chapters.isEmpty { return Double(p?.readChapters.count ?? 0) / Double(book.card.chapters.count) }
        if let page = p?.page, let pages = book.card.pages, pages > 0 { return min(1, Double(page) / Double(pages)) }
        return nil
    }
}

struct BookTile: View {
    @Environment(AppModel.self) private var store
    let book: LibraryBook

    var body: some View {
        let lib = store.library
        let status = BookStatusText(book: book, library: lib)
        VStack(alignment: .leading, spacing: 7) {
            BookCoverView(book: book)
            VStack(alignment: .leading, spacing: 2) {
                Text(book.title)
                    .font(.caption.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                if !status.text.isEmpty {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(lib.isFinished(book) ? Color.green : (lib.isReading(book) ? Color.accentColor : Color.secondary.opacity(0.6)))
                            .frame(width: 6, height: 6)
                        Text(status.text).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(book.title), \(book.author)\(status.text.isEmpty ? "" : ", " + status.text)")
    }
}

/// The book being read, on top of the shelf: progress and the questions waiting for it.
struct NowReadingCard: View {
    @Environment(AppModel.self) private var store
    let book: LibraryBook

    var body: some View {
        let lib = store.library
        let status = BookStatusText(book: book, library: lib)
        let askable = lib.askable(in: lib.questions(for: book.card))
        HStack(alignment: .top, spacing: 14) {
            BookCoverView(book: book).frame(width: 78)
            VStack(alignment: .leading, spacing: 4) {
                Text("LESE ICH")
                    .font(.caption2.weight(.bold))
                    .tracking(0.8)
                    .foregroundStyle(Color.accentColor)
                Text(book.title).font(.headline).lineLimit(2)
                Text(book.author).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                if let f = status.fraction {
                    ProgressLine(value: f, tint: .accentColor).padding(.top, 6)
                }
                Text([status.text, askable > 0 ? "\(askable) Fragen" : ""].filter { !$0.isEmpty }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 2)
            }
            Spacer(minLength: 0)
        }
        .card(padding: 14)
        .accessibilityElement(children: .combine)
    }
}

/// The shelf: cover grid with filters, the book being read on top, and the scanner.
struct LibraryView: View {
    @Environment(AppModel.self) private var store
    let query: String
    @State private var filter: LibraryFilter = .all
    @State private var showScan = false

    var body: some View {
        let lib = store.library
        let all = lib.books
        let q = WikiText.fold(query.trimmingCharacters(in: .whitespaces))
        let searching = q.count >= 2
        let shown = all.filter { lib.matches($0, filter) && (!searching || WikiText.fold($0.title + " " + $0.author).contains(q)) }
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if all.isEmpty {
                    emptyState
                } else {
                    if !searching, let current = lib.currentlyReading {
                        NavigationLink(value: VaultRoute.book(current.id)) { NowReadingCard(book: current) }
                            .buttonStyle(.plain)
                    }
                    chips(lib.filters(for: all))
                    if shown.isEmpty {
                        Text(searching ? "Kein Buch passt zur Suche." : "Hier ist noch kein Buch.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.top, 8)
                    } else {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100, maximum: 150), spacing: 12, alignment: .top)], spacing: 18) {
                            ForEach(shown) { b in
                                NavigationLink(value: VaultRoute.book(b.id)) { BookTile(book: b) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 4)
            .padding(.bottom, 28)
            .readableColumn(900)
        }
        .scrollIndicators(.hidden)
        .task { await store.refreshLibrary() }
        .sheet(isPresented: $showScan) {
            ScanBookView().environment(store)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showScan = true
                } label: {
                    Label("Buch scannen", systemImage: "barcode.viewfinder")
                }
            }
        }
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("Noch keine Bücher", systemImage: "books.vertical")
        } description: {
            Text(store.isConnected
                 ? "Scanne die Rückseite eines Buchs. Die Bücher aus deinem Vault erscheinen hier, sobald Tagwerk Bridge 1.4 in Obsidian läuft."
                 : "Scanne die Rückseite eines Buchs. Für die Bücher aus deinem Vault verbinde zuerst den Vault in den Einstellungen.")
        } actions: {
            Button("Buch scannen") { showScan = true }
                .buttonStyle(.glassProminent)
        }
        .padding(.top, 40)
    }

    private func chips(_ filters: [LibraryFilter]) -> some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(filters) { f in
                    Button {
                        withAnimation(.smooth(duration: 0.25)) { filter = f }
                    } label: {
                        Text(f.label)
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 13)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    .glassEffect(filter == f ? .regular.tint(Color.accentColor.opacity(0.4)).interactive() : .regular.interactive(), in: .capsule)
                    .accessibilityAddTraits(filter == f ? .isSelected : [])
                }
            }
            .padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
    }
}
