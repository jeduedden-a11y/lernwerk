import Foundation
import UIKit
import LernwerkCore

/// The library's way into the rest of the app: sessions with questions of the notes, scanned books, and the reading
/// state on its way to the vault. Events go through the same outbox as the notes written in lessons.
extension AppModel {
    static let libraryAccent = "#D2502C"

    /// Reads the Bücher folder and the notes of the vault copy again, then sends what waits for a card.
    func refreshLibrary() async {
        await library.refresh(wiki: wiki)
        queueReadingEvents()
    }

    // MARK: questions

    /// Questions of the notes as a review: each one comes as a step that is ticked off or compared.
    func startLibraryQuestions(_ questions: [VaultQuestion], title: String) {
        guard !questions.isEmpty, presentedLesson == nil else { return }
        let items = questions.map { ReviewItem(lessonUrl: "", stepId: $0.id, step: $0.runtimeStepJSON, from: $0.noteTitle) }
        var session = LessonSession(mode: .review, reviewItems: items, title: title, accentHex: Self.libraryAccent)
        session.library = true
        presentedLesson = session
    }

    /// Asks the questions of a pool: the ones due and the ones never asked, at most ten. When nothing is due the ones
    /// that come due first are asked anyway, so the button always does something as long as there are questions.
    func askLibrary(_ pool: [VaultQuestion], title: String, all: Bool = false) {
        var picked = all ? Array(pool.prefix(10)) : library.selection(from: pool)
        if picked.isEmpty {
            let byDue = pool.sorted { (library.state.cards[$0.id]?.due ?? .distantPast) < (library.state.cards[$1.id]?.due ?? .distantPast) }
            picked = Array(byDue.prefix(10))
        }
        guard !picked.isEmpty else {
            flash("Noch keine Fragen in den Notizen")
            return
        }
        startLibraryQuestions(picked, title: title)
    }

    // MARK: scanned books

    /// A scanned book: kept on the device at once; its card goes to the vault when the bridge can write it.
    func addScannedBook(_ meta: BookMeta, cover: Data?) {
        if let old = library.pending(isbn13: meta.isbn13)?.eventID { state.outbox.removeAll { $0.id == old } }
        let event = LibraryBridge.bookEvent(meta, cover: cover)
        state.outbox.append(event)
        library.addPending(meta, cover: cover, eventID: event.id)
        scheduleSave()
        Task { await pushNotes(quiet: true) }
    }

    /// Takes a scanned book back, as long as its card has not been sent.
    func removeScannedBook(isbn13: String) {
        if let id = library.pending(isbn13: isbn13)?.eventID { state.outbox.removeAll { $0.id == id } }
        library.removePending(isbn13: isbn13)
        scheduleSave()
    }

    /// True while the card of a scanned book still waits for the bridge.
    func isScanWaiting(isbn13: String) -> Bool {
        guard let id = library.pending(isbn13: isbn13)?.eventID else { return false }
        return state.outbox.contains { $0.id == id }
    }

    // MARK: reading state

    /// Puts the reading state of every book whose card is in the vault copy into the outbox.
    func queueReadingEvents() {
        var added = false
        for card in library.cards where library.state.dirty.contains(card.key) {
            let events = library.readingEvents(for: card)
            if !events.isEmpty {
                state.outbox.append(contentsOf: events)
                added = true
            }
        }
        if added {
            scheduleSave()
            Task { await pushNotes(quiet: true) }
        }
    }

    /// After a reading session or a status change: send now if the card is there, otherwise when it arrives.
    func readingChanged() {
        queueReadingEvents()
    }
}
