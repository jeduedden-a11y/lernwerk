import SwiftUI
import LernwerkCore
import WebKit

enum VaultRoute: Hashable {
    case folder(String)
    case note(String, heading: String?)
    case learnNotes
}

/// The Vault tab: the whole wiki of the Obsidian vault, offline and searchable, plus the notes written in lessons.
struct VaultView: View {
    @Environment(AppModel.self) private var store
    @State private var showSettings = false
    @State private var path: [VaultRoute] = []
    @State private var query = ""

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if query.trimmingCharacters(in: .whitespaces).count >= 2 {
                    VaultSearchResults(query: query)
                } else {
                    VaultHome(showSettings: $showSettings)
                }
            }
            .navigationTitle("Vault")
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Im Vault suchen")
            .navigationDestination(for: VaultRoute.self) { route in
                switch route {
                case .folder(let f): VaultFolderView(folder: f)
                case .note(let p, let h): VaultNoteReader(path: p, heading: h) { path.append($0) }
                case .learnNotes: LearnNotesView()
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Label("Einstellungen", systemImage: "gearshape")
                    }
                }
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView().environment(store)
        }
        .onChange(of: store.pendingVaultNote) { _, note in openPending(note) }
        .task {
            store.wiki.loadIfNeeded()
            if let p = UserDefaults.standard.string(forKey: "LWNote"), path.isEmpty { path = [.note(p, heading: nil)] }
            openPending(store.pendingVaultNote)
            await store.syncWiki()
        }
    }
}

extension VaultView {
    /// A note requested from elsewhere in the app (a lesson) replaces whatever the tab showed.
    fileprivate func openPending(_ note: String?) {
        guard let note else { return }
        store.pendingVaultNote = nil
        path = [.note(note, heading: nil)]
    }
}

enum VaultRecents {
    static let key = "LWRecentVaultNotes"
    static func list() -> [String] { UserDefaults.standard.stringArray(forKey: key) ?? [] }
    static func add(_ path: String) {
        var l = list().filter { $0 != path }
        l.insert(path, at: 0)
        UserDefaults.standard.set(Array(l.prefix(8)), forKey: key)
    }
}

struct VaultFolderIcon {
    static func symbol(_ name: String) -> String {
        let n = WikiText.fold(name)
        let table: [(String, String)] = [
            ("mathe", "function"), ("tmua", "pencil.and.ruler"), ("physik", "atom"), ("chemie", "flask"), ("bio", "leaf"),
            ("geschichte", "building.columns"), ("deutsch", "text.book.closed"), ("philo", "brain"), ("ethik", "scalemass"),
            ("informatik", "cpu"), ("sport", "figure.run"), ("okonom", "chart.line.uptrend.xyaxis"), ("wirtschaft", "chart.line.uptrend.xyaxis"),
            ("youtube", "play.rectangle"), ("kurs", "graduationcap"), ("datalink", "link"), ("meta", "square.grid.2x2"), ("englisch", "globe.europe.africa"),
        ]
        return table.first { n.contains($0.0) }?.1 ?? "folder"
    }
}

struct VaultHome: View {
    @Environment(AppModel.self) private var store
    @Binding var showSettings: Bool

    var body: some View {
        let wiki = store.wiki
        let top = wiki.children(of: "")
        let recents = VaultRecents.list().compactMap { wiki.note($0) }
        List {
            Section {
                VaultStatusRow()
                NavigationLink(value: VaultRoute.learnNotes) {
                    Label {
                        LabeledContent("Meine Lernnotizen", value: store.notesWaiting > 0 ? "\(store.notesWaiting) warten" : "\(store.state.notes.count)")
                    } icon: {
                        Image(systemName: "square.and.pencil").foregroundStyle(Color.accentColor)
                    }
                }
            }
            if wiki.isEmpty {
                Section {
                    ContentUnavailableView {
                        Label("Noch keine Notizen", systemImage: "books.vertical")
                    } description: {
                        Text(store.isConnected
                             ? "Sobald Tagwerk Bridge 1.2 in Obsidian läuft, kommt dein Wiki hierher und ist danach auch offline lesbar."
                             : "Verbinde zuerst den Vault in den Einstellungen.")
                    } actions: {
                        if !store.isConnected { Button("Einstellungen") { showSettings = true } }
                    }
                }
            }
            if !recents.isEmpty {
                Section("Zuletzt geöffnet") {
                    ForEach(recents.prefix(5)) { n in
                        NavigationLink(value: VaultRoute.note(n.path, heading: nil)) { VaultNoteRow(note: n, showFolder: true) }
                    }
                }
            }
            if !top.folders.isEmpty {
                Section("Bereiche") {
                    ForEach(top.folders) { f in
                        NavigationLink(value: VaultRoute.folder(f.path)) {
                            Label {
                                LabeledContent(f.name, value: "\(f.count)")
                            } icon: {
                                Image(systemName: VaultFolderIcon.symbol(f.name)).foregroundStyle(subjectTint(f.name))
                            }
                        }
                    }
                }
            }
            if !top.notes.isEmpty {
                Section("Notizen") {
                    ForEach(top.notes) { n in
                        NavigationLink(value: VaultRoute.note(n.path, heading: nil)) { VaultNoteRow(note: n, showFolder: false) }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await store.syncWiki(force: false) }
    }

    /// The colour of the subject a top folder belongs to, as on the Lernen tab.
    private func subjectTint(_ folder: String) -> Color {
        let f = WikiText.fold(folder)
        let match = store.subjects.first { s in
            let title = WikiText.fold(s.title), tag = WikiText.fold(s.tag ?? s.title)
            return f == title || f == tag || f.hasPrefix(title) || title.hasPrefix(f)
        }
        return match.map { Color(hex: $0.color) } ?? Color.accentColor
    }
}

struct VaultStatusRow: View {
    @Environment(AppModel.self) private var store

    var body: some View {
        let wiki = store.wiki
        HStack(spacing: 12) {
            Image(systemName: wiki.syncing ? "arrow.triangle.2.circlepath" : "books.vertical.fill")
                .font(.title3)
                .foregroundStyle(Color.accentColor)
                .symbolEffect(.rotate, isActive: wiki.syncing)
                .frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(wiki.isEmpty ? "Wiki" : "\(wiki.notes.count) Notizen offline")
                    .font(.subheadline.weight(.semibold))
                Group {
                    if wiki.syncing {
                        Text("Lade Notizen vom PC … \(Int(wiki.progress * 100)) %")
                    } else if let s = wiki.status {
                        Text(s)
                    } else if let g = wiki.generatedAt {
                        Text("Stand vom PC: \(Format.relative(g))")
                    } else {
                        Text("Noch kein Stand vom PC")
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

struct VaultNoteRow: View {
    let note: WikiNote
    var showFolder: Bool
    var snippet: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(note.title)
                .font(.body)
                .lineLimit(2)
            if showFolder && !note.folder.isEmpty {
                Text(note.folder.replacingOccurrences(of: "/", with: " › "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            if let snippet {
                Text(snippet)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
        }
        .padding(.vertical, 2)
    }
}

struct VaultSearchResults: View {
    @Environment(AppModel.self) private var store
    let query: String

    var body: some View {
        let hits = store.wiki.search(query)
        List {
            if !store.wiki.searchReady {
                Text("Volltext wird vorbereitet, bis dahin nur Titel.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            ForEach(hits) { h in
                NavigationLink(value: VaultRoute.note(h.note.path, heading: nil)) {
                    VaultNoteRow(note: h.note, showFolder: true, snippet: h.snippet)
                }
            }
        }
        .listStyle(.plain)
        .overlay {
            if hits.isEmpty { ContentUnavailableView.search(text: query) }
        }
    }
}

struct VaultFolderView: View {
    @Environment(AppModel.self) private var store
    let folder: String

    var body: some View {
        let c = store.wiki.children(of: folder)
        List {
            if !c.folders.isEmpty {
                Section {
                    ForEach(c.folders) { f in
                        NavigationLink(value: VaultRoute.folder(f.path)) {
                            Label {
                                LabeledContent(f.name, value: "\(f.count)")
                            } icon: {
                                Image(systemName: "folder").foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                }
            }
            Section {
                ForEach(c.notes) { n in
                    NavigationLink(value: VaultRoute.note(n.path, heading: nil)) { VaultNoteRow(note: n, showFolder: false) }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle((folder as NSString).lastPathComponent)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct VaultNoteReader: View {
    @Environment(AppModel.self) private var store
    let path: String
    let heading: String?
    let push: (VaultRoute) -> Void
    /// Off inside a lesson: a lesson cannot start another one.
    var showLessons = true
    @State private var web: WKWebView?
    @State private var shared: VaultSharedFile?
    @State private var exporting = false

    var body: some View {
        let wiki = store.wiki
        let title = WikiText.title(path)
        let raw = wiki.markdown(path)
        let parts = WikiText.split(raw ?? "")
        let payload = VaultNotePayload(md: parts.body, path: path, title: title, folder: WikiText.folder(path).replacingOccurrences(of: "/", with: " › "),
                                  tags: WikiText.tags(parts.frontmatter), heading: heading)
        Group {
            if raw == nil {
                ContentUnavailableView("Notiz nicht gefunden", systemImage: "doc.questionmark",
                                       description: Text("Sie wurde in Obsidian verschoben oder gelöscht."))
            } else {
                VaultNoteWebView(payload: payload, lookup: { target, from in
                    guard let p = wiki.resolver.resolve(target, from: from.isEmpty ? path : from) else { return nil }
                    return wiki.data(p)
                }, onOpen: open, onReady: { w in Task { @MainActor in web = w } })
                .ignoresSafeArea(edges: .bottom)
            }
        }
        .background(Color(uiColor: .systemBackground))
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        exportPDF(title: title)
                    } label: {
                        Label("Als PDF teilen", systemImage: "doc.richtext")
                    }
                    .disabled(web == nil)
                    Button {
                        if let raw, let url = VaultNoteExport.markdown(raw, title: title) { shared = VaultSharedFile(url: url) }
                    } label: {
                        Label("Als Markdown teilen", systemImage: "doc.plaintext")
                    }
                } label: {
                    if exporting { ProgressView() } else { Label("Teilen", systemImage: "square.and.arrow.up") }
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            let linked = showLessons ? store.lessons(forWikiPath: path) : []
            if !linked.isEmpty {
                Menu {
                    ForEach(linked, id: \.lesson.id) { item in
                        Button {
                            store.start(item.course, item.lesson)
                        } label: {
                            Label(item.lesson.title, systemImage: store.state.lessons[item.lesson.id]?.isCompleted == true ? "checkmark.circle.fill" : "play.circle")
                        }
                    }
                } label: {
                    Label(linked.count == 1 ? "Lektion dazu" : "\(linked.count) Lektionen dazu", systemImage: "graduationcap.fill")
                        .font(.headline)
                        .padding(.horizontal, 8)
                }
                .buttonStyle(.glassProminent)
                .controlSize(.large)
                .padding(.bottom, 10)
            }
        }
        .sheet(item: $shared) { f in
            VaultShareSheet(items: [f.url])
                .presentationDetents([.medium, .large])
        }
        .onAppear { VaultRecents.add(path) }
    }

    private func open(_ target: String) {
        let heading = target.firstIndex(of: "#").map { String(target[target.index(after: $0)...]) }
        guard let p = store.wiki.resolver.resolve(target, from: path) else {
            store.flash("„\(target)“ ist nicht im Wiki")
            return
        }
        if p.lowercased().hasSuffix(".md") { push(.note(p, heading: heading)) }
    }

    private func exportPDF(title: String) {
        guard let web, !exporting else { return }
        exporting = true
        Task { @MainActor in
            if let url = await VaultNoteExport.pdf(from: web, title: title) { shared = VaultSharedFile(url: url) }
            exporting = false
        }
    }
}

/// A vault note opened from a lesson, in a sheet with its own navigation: links inside the note open further notes.
struct VaultNoteSheet: View {
    @Environment(\.dismiss) private var dismiss
    let path: String
    @State private var stack: [VaultRoute] = []

    var body: some View {
        NavigationStack(path: $stack) {
            VaultNoteReader(path: path, heading: nil, push: { stack.append($0) }, showLessons: false)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            dismiss()
                        } label: {
                            Label("Schließen", systemImage: "xmark")
                        }
                    }
                }
                .navigationDestination(for: VaultRoute.self) { route in
                    if case .note(let p, let heading) = route {
                        VaultNoteReader(path: p, heading: heading, push: { stack.append($0) }, showLessons: false)
                    }
                }
        }
    }
}

/// Identifies the vault note a lesson shows in its sheet.
struct VaultNoteTarget: Identifiable {
    var path: String
    var id: String { path }
}
