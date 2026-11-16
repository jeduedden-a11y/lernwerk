import SwiftUI
import UIKit
import VisionKit
import Vision
import LernwerkCore

/// The camera with VisionKit's barcode scanner. It reports what it reads and stops when told to.
final class ScannerHost: UIViewController, DataScannerViewControllerDelegate {
    var onCode: ((String) -> Void)?
    private var scanner: DataScannerViewController?
    private var wantsActive = true

    override func viewDidLoad() {
        super.viewDidLoad()
        guard DataScannerViewController.isSupported else { return }
        let s = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.ean13])], qualityLevel: .accurate,
                                          recognizesMultipleItems: false, isHighFrameRateTrackingEnabled: false,
                                          isPinchToZoomEnabled: true, isGuidanceEnabled: false, isHighlightingEnabled: true)
        s.delegate = self
        addChild(s)
        s.view.frame = view.bounds
        s.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(s.view)
        s.didMove(toParent: self)
        scanner = s
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        apply()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        scanner?.stopScanning()
    }

    func setActive(_ on: Bool) {
        wantsActive = on
        if isViewLoaded, view.window != nil { apply() }
    }

    private func apply() {
        guard let scanner else { return }
        if wantsActive {
            if !scanner.isScanning { try? scanner.startScanning() }
        } else if scanner.isScanning {
            scanner.stopScanning()
        }
    }

    func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
        for item in addedItems {
            if case .barcode(let code) = item, let value = code.payloadStringValue {
                onCode?(value)
                return
            }
        }
    }
}

struct BarcodeScannerView: UIViewControllerRepresentable {
    var active: Bool
    var onCode: (String) -> Void

    func makeUIViewController(context: Context) -> ScannerHost {
        let host = ScannerHost()
        host.onCode = onCode
        return host
    }

    func updateUIViewController(_ host: ScannerHost, context: Context) {
        host.onCode = onCode
        host.setActive(active)
    }
}

/// Scans the barcode on the back of a book, finds title, author, pages and cover online, and keeps the book: on the
/// device at once, in the vault as soon as Obsidian can write the card.
struct ScanBookView: View {
    @Environment(AppModel.self) private var store
    @Environment(\.dismiss) private var dismiss

    enum Phase: Equatable {
        case scanning
        case looking(String)
        case saved(BookMeta)
        /// Already in the library: the book's id.
        case known(String)
        /// Nothing found online (or no author): the learner types what is missing. ISBN and what is known so far.
        case manual(String, BookMeta?)
    }

    @State private var phase: Phase = .scanning
    @State private var coverData: Data?
    @State private var hint: String?
    @State private var typing = false
    @State private var typed = ""
    @State private var savedCount = 0

    private var scannerAvailable: Bool { DataScannerViewController.isSupported && DataScannerViewController.isAvailable }

    var body: some View {
        NavigationStack {
            Group {
                if case .manual(let isbn, let known) = phase {
                    ManualBookForm(isbn: isbn, known: known) { meta in
                        save(meta, cover: coverData)
                    } onCancel: {
                        phase = .scanning
                    }
                } else {
                    ZStack {
                        Color.black.ignoresSafeArea()
                        if scannerAvailable {
                            BarcodeScannerView(active: phase == .scanning, onCode: { handle(code: $0) })
                                .ignoresSafeArea()
                        } else {
                            unavailable
                        }
                    }
                    .safeAreaInset(edge: .bottom) { bottomCard.padding(.horizontal, 16).padding(.bottom, 8) }
                }
            }
            .navigationTitle("Buch scannen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Fertig") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        typing = true
                    } label: {
                        Label("ISBN eintippen", systemImage: "keyboard")
                    }
                }
            }
        }
        .alert("ISBN eingeben", isPresented: $typing) {
            TextField("978…", text: $typed).keyboardType(.numbersAndPunctuation)
            Button("Suchen") {
                let t = typed
                typed = ""
                handle(code: t)
            }
            Button("Abbrechen", role: .cancel) { typed = "" }
        } message: {
            Text("Die Ziffern über dem Strichcode, mit oder ohne Bindestriche.")
        }
        .sensoryFeedback(.success, trigger: savedCount)
        .interactiveDismissDisabled(lookingUp)
    }

    private var lookingUp: Bool {
        if case .looking = phase { return true }
        return false
    }

    // MARK: pieces

    private var unavailable: some View {
        ContentUnavailableView {
            Label("Keine Kamera", systemImage: "camera.metering.none")
        } description: {
            Text(DataScannerViewController.isSupported
                 ? "Lernwerk darf die Kamera nicht benutzen. Das lässt sich in den iOS-Einstellungen ändern. Du kannst die ISBN auch eintippen."
                 : "Dieses Gerät kann keine Strichcodes lesen. Du kannst die ISBN eintippen.")
        } actions: {
            if DataScannerViewController.isSupported, let url = URL(string: UIApplication.openSettingsURLString) {
                Button("Einstellungen öffnen") { UIApplication.shared.open(url) }
                    .buttonStyle(.glass)
            }
        }
        .environment(\.colorScheme, .dark)
    }

    @ViewBuilder
    private var bottomCard: some View {
        switch phase {
        case .scanning:
            Text(hint ?? "Halte den Strichcode auf der Buchrückseite ins Bild.")
                .font(.subheadline.weight(.medium))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .glassEffect(.regular, in: .rect(cornerRadius: 20, style: .continuous))
        case .looking(let isbn):
            HStack(spacing: 12) {
                ProgressView()
                Text("Suche nach \(isbn) …").font(.subheadline.weight(.medium))
                Spacer(minLength: 0)
            }
            .padding(16)
            .glassEffect(.regular, in: .rect(cornerRadius: 20, style: .continuous))
        case .saved(let meta):
            savedCard(meta)
        case .known(let id):
            let title = store.library.book(id: id)?.title ?? "Dieses Buch"
            VStack(alignment: .leading, spacing: 10) {
                Label("Schon in deiner Bibliothek", systemImage: "checkmark.circle.fill").font(.subheadline.weight(.semibold))
                Text(title).font(.headline).lineLimit(2)
                Button("Weiter scannen") { phase = .scanning }
                    .buttonStyle(.glassProminent)
                    .controlSize(.large)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .glassEffect(.regular, in: .rect(cornerRadius: 22, style: .continuous))
        case .manual:
            EmptyView()
        }
    }

    private func savedCard(_ meta: BookMeta) -> some View {
        let waiting = store.isScanWaiting(isbn13: meta.isbn13)
        let bridgeKnows = store.state.bridgeFeatures.contains(LibraryBridge.bookFeature)
        return VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                if let data = coverData, let image = UIImage(data: data) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 52, height: 78)
                        .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
                }
                VStack(alignment: .leading, spacing: 3) {
                    Label("Gespeichert", systemImage: "checkmark.circle.fill")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.green)
                    Text(meta.title).font(.headline).lineLimit(2)
                    Text(meta.author).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                    Text(!waiting ? "Die Karte ist im Vault."
                         : (store.isConnected ? (bridgeKnows ? "Die Karte geht gleich in den Vault." : "Die Karte kommt in den Vault, sobald Tagwerk Bridge 1.4 in Obsidian läuft.")
                                              : "Verbinde den Vault in den Einstellungen, dann geht die Karte dorthin."))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 8) {
                Button("Rückgängig", role: .destructive) {
                    store.removeScannedBook(isbn13: meta.isbn13)
                    phase = .scanning
                }
                .buttonStyle(.glass)
                Button("Bearbeiten") { phase = .manual(meta.isbn13, meta) }
                    .buttonStyle(.glass)
                Spacer(minLength: 0)
                Button("Weiter scannen") { phase = .scanning }
                    .buttonStyle(.glassProminent)
            }
            .controlSize(.regular)
        }
        .padding(16)
        .glassEffect(.regular, in: .rect(cornerRadius: 22, style: .continuous))
    }

    // MARK: flow

    @MainActor
    private func handle(code: String) {
        guard phase == .scanning else { return }
        guard let isbn = ISBN.normalize(code) else {
            hint = "Das ist kein Buch-Strichcode. Bücher beginnen mit 978 oder 979."
            return
        }
        hint = nil
        if let existing = store.library.book(isbn13: isbn) {
            phase = .known(existing.id)
            return
        }
        phase = .looking(isbn)
        coverData = nil
        Task { @MainActor in await lookup(isbn) }
    }

    @MainActor
    private func lookup(_ isbn: String) async {
        async let openLibrary = Self.fetch(BookLookup.openLibraryURL(isbn13: isbn))
        async let google = Self.fetch(BookLookup.googleBooksURL(isbn13: isbn))
        let (a, b) = await (openLibrary, google)
        let first = a.flatMap { BookLookup.parseOpenLibrary($0, isbn13: isbn) }
        let second = b.flatMap { BookLookup.parseGoogleBooks($0, isbn13: isbn) }
        guard phase == .looking(isbn) else { return }
        guard let meta = BookLookup.merge(first, second), !meta.title.isEmpty else {
            phase = .manual(isbn, nil)
            return
        }
        let cover = await Self.loadCover(isbn: isbn, fallback: meta.coverURL)
        guard phase == .looking(isbn) else { return }
        coverData = cover
        // a record without an author cannot make a card: the learner adds it
        if meta.author.trimmingCharacters(in: .whitespaces).isEmpty {
            phase = .manual(isbn, meta)
        } else {
            save(meta, cover: cover)
        }
    }

    @MainActor
    private func save(_ meta: BookMeta, cover: Data?) {
        store.addScannedBook(meta, cover: cover)
        coverData = cover
        savedCount += 1
        phase = .saved(meta)
    }

    // MARK: network

    nonisolated static func fetch(_ url: URL?) async -> Data? {
        guard let url else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 10)
        request.setValue("Lernwerk/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200, !data.isEmpty else { return nil }
        return data
    }

    /// The cover from Open Library by ISBN, otherwise the one the record names; scaled to 300 px, like the covers of the vault.
    nonisolated static func loadCover(isbn: String, fallback: String?) async -> Data? {
        var urls: [URL] = []
        if let u = BookLookup.coverURL(isbn13: isbn) { urls.append(u) }
        if let f = fallback, let u = URL(string: f) { urls.append(u) }
        for u in urls {
            guard let data = await fetch(u), let image = UIImage(data: data), image.size.width >= 80 else { continue }
            return jpeg(image)
        }
        return nil
    }

    nonisolated static func jpeg(_ image: UIImage, width: CGFloat = 300) -> Data? {
        let scale = min(1, width / image.size.width)
        let size = CGSize(width: (image.size.width * scale).rounded(), height: (image.size.height * scale).rounded())
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        return resized.jpegData(compressionQuality: 0.72)
    }
}

/// Title and author typed by hand, when the online search finds nothing.
struct ManualBookForm: View {
    let isbn: String
    let known: BookMeta?
    var onSave: (BookMeta) -> Void
    var onCancel: () -> Void
    @State private var title = ""
    @State private var author = ""
    @State private var loaded = false

    var body: some View {
        Form {
            Section {
                TextField("Titel", text: $title)
                TextField("Autor", text: $author)
            } header: {
                Text("ISBN \(isbn)")
            } footer: {
                Text(known == nil ? "Zu dieser ISBN wurde online nichts gefunden. Titel und Autor reichen für die Buchkarte." : "Prüfe Titel und Autor. Beides wird in die Buchkarte geschrieben.")
            }
            Section {
                Button("Speichern") {
                    var meta = known ?? BookMeta(isbn13: isbn, isbn10: ISBN.to10(isbn), title: "", author: "")
                    meta.title = title.trimmingCharacters(in: .whitespacesAndNewlines)
                    meta.author = author.trimmingCharacters(in: .whitespacesAndNewlines)
                    onSave(meta)
                }
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || author.trimmingCharacters(in: .whitespaces).isEmpty)
                Button("Abbrechen", role: .cancel, action: onCancel)
            }
        }
        .onAppear {
            guard !loaded else { return }
            loaded = true
            title = known?.title ?? ""
            author = known?.author ?? ""
        }
    }
}
