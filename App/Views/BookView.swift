import SwiftUI
import LernwerkCore

/// One book: cover, what to do with it (ask, read, explain), its chapters, the notes that came out of it, and the
/// thoughts written while reading.
struct BookView: View {
    @Environment(AppModel.self) private var store
    @Environment(\.colorScheme) private var scheme
    let id: String
    @State private var reading = false
    @State private var expanded = false

    var body: some View {
        if let book = store.library.book(id: id) {
            page(book)
        } else {
            ContentUnavailableView("Buch nicht gefunden", systemImage: "book.closed")
        }
    }

    private func page(_ book: LibraryBook) -> some View {
        let lib = store.library
        let pool = lib.questions(for: book.card)
        let askable = lib.askable(in: pool)
        let tint = Color(hex: LibraryColor.hex(for: book.card))
        return ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hero(book, tint: tint)
                actions(book, pool: pool, askable: askable)
                if book.pending { pendingNote(book) }
                if !book.card.summary.isEmpty { summary(book) }
                if !book.card.chapters.isEmpty { chapters(book) }
                notes(book, pool: pool)
                thoughts(book)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
            .readableColumn(760)
        }
        .scrollIndicators(.hidden)
        .background { TintBackground(tints: [tint]) }
        .navigationTitle(book.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        lib.setStatus(book.key, .reading)
                        store.readingChanged()
                    } label: {
                        Label("Lese ich", systemImage: "book")
                    }
                    Button {
                        lib.setStatus(book.key, .finished)
                        store.readingChanged()
                    } label: {
                        Label("Gelesen", systemImage: "checkmark.circle")
                    }
                    if lib.progress(book.key) != nil {
                        Button(role: .destructive) {
                            lib.setStatus(book.key, nil)
                            store.readingChanged()
                        } label: {
                            Label("Lesestand zurücksetzen", systemImage: "arrow.counterclockwise")
                        }
                    }
                    if book.pending {
                        Button(role: .destructive) {
                            store.removeScannedBook(isbn13: book.card.isbn13 ?? "")
                        } label: {
                            Label("Aus der Bibliothek nehmen", systemImage: "trash")
                        }
                    }
                } label: {
                    Label("Status", systemImage: lib.isFinished(book) ? "checkmark.circle.fill" : "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $reading) {
            ReadingSessionView(book: book).environment(store)
        }
        .task { await store.refreshLibrary() }
    }

    // MARK: pieces

    private func hero(_ book: LibraryBook, tint: Color) -> some View {
        VStack(spacing: 10) {
            BookCoverView(book: book, radius: 8)
                .frame(width: 128)
                .padding(.top, 10)
            Text(book.title)
                .font(.title2.bold())
                .multilineTextAlignment(.center)
            if !book.author.isEmpty {
                Text(book.author).font(.subheadline).foregroundStyle(.secondary)
            }
            let facts = [book.card.categories.first, book.card.pages.map { "\($0) Seiten" }, String(book.card.published.prefix(4)).nilIfEmpty]
                .compactMap { $0 }
            if !facts.isEmpty {
                HStack(spacing: 6) {
                    ForEach(facts, id: \.self) { f in
                        Text(f)
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .glassEffect(.regular, in: .capsule)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func actions(_ book: LibraryBook, pool: [VaultQuestion], askable: Int) -> some View {
        HStack(spacing: 10) {
            actionTile("Abfragen", askable > 0 ? "\(askable) fällig" : (pool.isEmpty ? "keine Fragen" : "alles gewusst"), symbol: "questionmark.bubble.fill", prominent: true) {
                store.askLibrary(pool, title: book.title)
            }
            actionTile("Lesen", "Stand eintragen", symbol: "book.fill", prominent: false) {
                reading = true
            }
            actionTile("Erklären", "in zwei Minuten", symbol: "text.bubble.fill", prominent: false) {
                store.startLibraryQuestions([store.library.explainQuestion(for: book, wiki: store.wiki)], title: book.title)
            }
        }
    }

    private func actionTile(_ title: String, _ detail: String, symbol: String, prominent: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 3) {
                Image(systemName: symbol).font(.title3)
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption2).opacity(0.75).lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
        }
        .buttonStyle(.plain)
        .foregroundStyle(prominent ? Color.white : Color.primary)
        .glassEffect(prominent ? .regular.tint(Color.accentColor.opacity(0.75)).interactive() : .regular.interactive(), in: .rect(cornerRadius: 18, style: .continuous))
    }

    private func pendingNote(_ book: LibraryBook) -> some View {
        let waiting = store.isScanWaiting(isbn13: book.card.isbn13 ?? "")
        return Label(waiting ? "Die Karte kommt in den Vault, sobald Tagwerk Bridge 1.4 in Obsidian läuft."
                             : "Die Karte ist unterwegs in den Vault.", systemImage: "icloud.and.arrow.up")
            .font(.footnote)
            .foregroundStyle(.secondary)
            .card(padding: 12, radius: 18)
    }

    private func summary(_ book: LibraryBook) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(book.card.summary)
                .font(.callout)
                .foregroundStyle(.secondary)
                .lineLimit(expanded ? nil : 4)
            if book.card.summary.count > 240 {
                Button(expanded ? "Weniger" : "Mehr") { withAnimation(.smooth(duration: 0.25)) { expanded.toggle() } }
                    .font(.footnote.weight(.semibold))
            }
        }
    }

    private func chapters(_ book: LibraryBook) -> some View {
        let lib = store.library
        let read = Set(lib.progress(book.key)?.readChapters ?? [])
        return VStack(alignment: .leading, spacing: 8) {
            SectionTitle(title: "Kapitel", trailing: "\(read.count) von \(book.card.chapters.count) gelesen")
            VStack(spacing: 0) {
                ForEach(book.card.chapters) { c in
                    HStack(alignment: .top, spacing: 12) {
                        Button {
                            var next = read
                            if next.contains(c.number) { next.remove(c.number) } else { next.insert(c.number) }
                            lib.saveSession(key: book.key, page: lib.progress(book.key)?.page, readChapters: Array(next), thought: nil)
                            store.readingChanged()
                        } label: {
                            Image(systemName: read.contains(c.number) ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundStyle(read.contains(c.number) ? Color.green : Color.secondary)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(read.contains(c.number) ? "\(c.label) als ungelesen markieren" : "\(c.label) als gelesen markieren")
                        VStack(alignment: .leading, spacing: 3) {
                            Text(c.label == c.title ? c.title : "\(c.label) · \(c.title)").font(.subheadline)
                            let links = c.notes.compactMap { store.wiki.resolver.resolve($0, from: book.card.path) }
                            if !links.isEmpty {
                                ScrollView(.horizontal) {
                                    HStack(spacing: 6) {
                                        ForEach(links, id: \.self) { p in
                                            NavigationLink(value: VaultRoute.note(p, heading: nil)) {
                                                Text(WikiText.title(p))
                                                    .font(.caption2.weight(.semibold))
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 3)
                                                    .background(Color.accentColor.opacity(0.18), in: Capsule())
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                }
                                .scrollIndicators(.hidden)
                            }
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, 9)
                    if c.id != book.card.chapters.last?.id { Divider() }
                }
            }
            .card(padding: 14, radius: 20)
        }
    }

    @ViewBuilder
    private func notes(_ book: LibraryBook, pool: [VaultQuestion]) -> some View {
        let paths = (store.library.bookNotes[book.card.path] ?? []).sorted { WikiText.title($0).localizedStandardCompare(WikiText.title($1)) == .orderedAscending }
        if !paths.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                SectionTitle(title: "Notizen", trailing: "\(paths.count)")
                VStack(spacing: 0) {
                    ForEach(paths, id: \.self) { p in
                        let count = pool.filter { $0.notePath == p }.count
                        NavigationLink(value: VaultRoute.note(p, heading: nil)) {
                            HStack {
                                Text(WikiText.title(p)).font(.subheadline).foregroundStyle(.primary)
                                Spacer()
                                if count > 0 { Text("\(count) Fragen").font(.caption).foregroundStyle(.secondary) }
                                Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
                            }
                            .padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                        if p != paths.last { Divider() }
                    }
                }
                .card(padding: 14, radius: 20)
            }
        }
    }

    @ViewBuilder
    private func thoughts(_ book: LibraryBook) -> some View {
        let list = store.library.thoughts(for: book.key)
        if !list.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                SectionTitle(title: "Gedanken beim Lesen")
                ForEach(list) { t in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(t.text).font(.subheadline)
                        Text([t.page.map { "Seite \($0)" }, Format.relative(t.at)].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .card(padding: 12, radius: 18)
                    .contextMenu {
                        Button(role: .destructive) {
                            store.library.deleteThought(t.id)
                        } label: {
                            Label("Löschen", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}

/// After reading: where you are, which chapters you have read, and what you take away.
struct ReadingSessionView: View {
    @Environment(AppModel.self) private var store
    @Environment(\.dismiss) private var dismiss
    let book: LibraryBook
    @State private var page = ""
    @State private var read: Set<Int> = []
    @State private var thought = ""
    @State private var loaded = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(book.card.pages.map { "von \($0)" } ?? "Seite", text: $page)
                        .keyboardType(.numberPad)
                } header: {
                    Text("Bis zu welcher Seite hast du gelesen?")
                }
                if !book.card.chapters.isEmpty {
                    Section("Kapitel") {
                        ForEach(book.card.chapters) { c in
                            Toggle(c.label == c.title ? c.title : "\(c.label) · \(c.title)", isOn: Binding(
                                get: { read.contains(c.number) },
                                set: { on in if on { read.insert(c.number) } else { read.remove(c.number) } }
                            ))
                        }
                    }
                }
                Section {
                    TextEditor(text: $thought)
                        .frame(minHeight: 120)
                } header: {
                    Text("Was nimmst du mit?")
                } footer: {
                    Text("Ein bis zwei Sätze in eigenen Worten. Sie landen im Abschnitt »Lesenotizen« der Buchkarte in Obsidian.")
                }
            }
            .navigationTitle("Lesesitzung")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Speichern") {
                        let number = Int(page.filter(\.isNumber))
                        store.library.saveSession(key: book.key, page: number, readChapters: Array(read), thought: thought)
                        store.readingChanged()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                guard !loaded else { return }
                loaded = true
                if let p = store.library.progress(book.key) {
                    page = p.page.map(String.init) ?? ""
                    read = Set(p.readChapters)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
