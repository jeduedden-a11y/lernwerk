import XCTest
@testable import LernwerkCore

final class LibraryTests: XCTestCase {
    func testStableHash() {
        XCTAssertEqual(Stable.hash(""), "cbf29ce484222325")
        XCTAssertEqual(Stable.hash("a"), "af63dc4c8601ec8c")
        XCTAssertEqual(Stable.hash("Rechtsstaat"), Stable.hash("Rechtsstaat"))
        XCTAssertNotEqual(Stable.hash("Rechtsstaat"), Stable.hash("Legalität"))
    }

    func testISBNValidationAndConversion() {
        XCTAssertTrue(ISBN.isValid13("9780441172719"))
        XCTAssertTrue(ISBN.isValid13("9780141036144"))
        XCTAssertTrue(ISBN.isValid13("9780226320618"))
        XCTAssertFalse(ISBN.isValid13("9780441172710"))
        XCTAssertFalse(ISBN.isValid13("1234567890123"))
        XCTAssertFalse(ISBN.isValid13("978044117271"))
        XCTAssertTrue(ISBN.isValid10("0441172717"))
        XCTAssertTrue(ISBN.isValid10("080442957X"))
        XCTAssertFalse(ISBN.isValid10("0441172718"))
        XCTAssertEqual(ISBN.to13("0441172717"), "9780441172719")
        XCTAssertEqual(ISBN.to13("080442957X"), "9780804429573")
        XCTAssertEqual(ISBN.to10("9780441172719"), "0441172717")
        XCTAssertEqual(ISBN.to10("9780804429573"), "080442957X")
        XCTAssertNil(ISBN.to10("9791234567896"))
        XCTAssertEqual(ISBN.normalize("ISBN 978-0-441-17271-9"), "9780441172719")
        XCTAssertEqual(ISBN.normalize("0-441-17271-7"), "9780441172719")
        XCTAssertEqual(ISBN.normalize("9780441172719"), "9780441172719")
        XCTAssertNil(ISBN.normalize("9780441172710"))
        XCTAssertNil(ISBN.normalize("kein Buch"))
        XCTAssertNil(ISBN.normalize(""))
    }

    func testLookupParsingAndMerge() throws {
        let ol = """
        {"ISBN:9780441172719": {"url": "https://openlibrary.org/books/OL1M/Dune", "title": "Dune", "subtitle": "Book One",
         "authors": [{"name": "Frank Herbert"}], "publishers": [{"name": "Ace"}], "publish_date": "2005", "number_of_pages": 604,
         "identifiers": {"isbn_10": ["0441172717"]}, "subjects": [{"name": "Science Fiction"}, {"name": "Classics"}],
         "cover": {"large": "https://covers.openlibrary.org/b/id/1-L.jpg"}}}
        """
        let m = try XCTUnwrap(BookLookup.parseOpenLibrary(Data(ol.utf8), isbn13: "9780441172719"))
        XCTAssertEqual(m.title, "Dune: Book One")
        XCTAssertEqual(m.author, "Frank Herbert")
        XCTAssertEqual(m.pages, 604)
        XCTAssertEqual(m.publisher, "Ace")
        XCTAssertEqual(m.published, "2005")
        XCTAssertEqual(m.categories, ["Science Fiction", "Classics"])
        XCTAssertEqual(m.isbn10, "0441172717")
        XCTAssertEqual(m.coverURL, "https://covers.openlibrary.org/b/id/1-L.jpg")
        XCTAssertEqual(m.summary, "")
        XCTAssertNil(BookLookup.parseOpenLibrary(Data("{}".utf8), isbn13: "9780441172719"))
        XCTAssertNil(BookLookup.parseOpenLibrary(Data("kein json".utf8), isbn13: "9780441172719"))

        let gb = """
        {"items": [{"volumeInfo": {"title": "Dune", "authors": ["Frank Herbert"], "publisher": "Ace Books", "publishedDate": "2005-08-02",
         "description": "Arrakis.", "pageCount": 612, "categories": ["Fiction / Science Fiction / General"],
         "industryIdentifiers": [{"type": "ISBN_10", "identifier": "0441172717"}, {"type": "ISBN_13", "identifier": "9780441172719"}],
         "imageLinks": {"thumbnail": "http://books.google.com/x.jpg"}}}]}
        """
        let g = try XCTUnwrap(BookLookup.parseGoogleBooks(Data(gb.utf8), isbn13: "9780441172719"))
        XCTAssertEqual(g.summary, "Arrakis.")
        XCTAssertEqual(g.published, "2005/08/02")
        XCTAssertEqual(g.categories, ["Fiction", "Science Fiction", "General"])
        XCTAssertEqual(g.coverURL, "https://books.google.com/x.jpg")
        XCTAssertNil(BookLookup.parseGoogleBooks(Data("{\"items\": []}".utf8), isbn13: "9780441172719"))

        let merged = try XCTUnwrap(BookLookup.merge(m, g))
        XCTAssertEqual(merged.title, "Dune: Book One")
        XCTAssertEqual(merged.summary, "Arrakis.")
        XCTAssertEqual(merged.pages, 604)
        XCTAssertEqual(merged.categories, ["Science Fiction", "Classics"])
        XCTAssertEqual(BookLookup.merge(nil, g)?.title, "Dune")
        XCTAssertEqual(BookLookup.merge(m, nil)?.title, "Dune: Book One")
        XCTAssertNil(BookLookup.merge(nil, nil))
    }

    func testBookCardInTheBookSearchFormat() throws {
        let md = """
        ---
        Title: The Road to Serfdom
        Original title: The Road to Serfdom
        Author: Friedrich A. Hayek
        Translator: ""
        Description: "A classic work, \\"quoted\\" and long."
        Total Pages: "274"
        Publisher: University of Chicago Press
        Categories: Economics, Politics, Philosophy
        isbn 10: "0226320618"
        isbn 13: "9780226320618"
        Published: 1994/10/15
        Date read: ""
        Cover: "[[The Road to Serfdom — Friedrich A. Hayek.jpg]]"
        Link: https://www.goodreads.com/book/show/299215
        Tags:
        - friedrich_a_hayek
        - the_road_to_serfdom
        Read: false
        ---
        """
        let card = try XCTUnwrap(BookCard.parse(path: "Bücher/The Road to Serfdom - Friedrich A Hayek.md", markdown: md))
        XCTAssertEqual(card.title, "The Road to Serfdom")
        XCTAssertEqual(card.author, "Friedrich A. Hayek")
        XCTAssertEqual(card.pages, 274)
        XCTAssertEqual(card.publisher, "University of Chicago Press")
        XCTAssertEqual(card.categories, ["Economics", "Politics", "Philosophy"])
        XCTAssertEqual(card.isbn13, "9780226320618")
        XCTAssertEqual(card.key, "9780226320618")
        XCTAssertEqual(card.coverName, "The Road to Serfdom — Friedrich A. Hayek.jpg")
        XCTAssertEqual(card.tags, ["friedrich_a_hayek", "the_road_to_serfdom"])
        XCTAssertFalse(card.read)
        XCTAssertFalse(card.isHub)
        XCTAssertTrue(card.summary.contains("\"quoted\""))
    }

    func testBookCardWithoutPropertiesAndWorkedThroughHub() throws {
        let bare = try XCTUnwrap(BookCard.parse(path: "Bücher/Animal Farm - George Orwell.md", markdown: "kein Frontmatter"))
        XCTAssertEqual(bare.title, "Animal Farm")
        XCTAssertEqual(bare.author, "George Orwell")
        XCTAssertEqual(bare.key, "Bücher/Animal Farm - George Orwell.md")

        let hub = """
        ---
        title: Das egoistische Gen
        type: hub
        status: growing
        autor: Richard Dawkins
        Read: true
        ---
        > [!info] Aus einem Buch

        ## Lesefortschritt
        - [x] Kapitel 1 -- Warum gibt es Menschen? -- [[Replikator]], [[Genetische Drift]]
        - [ ] Kapitel 2 -- Die Replikatoren

        ## Synthese
        - [ ] gehört nicht zur Liste
        """
        let card = try XCTUnwrap(BookCard.parse(path: "Bücher/Das egoistische Gen - Richard Dawkins.md", markdown: hub))
        XCTAssertTrue(card.isHub)
        XCTAssertTrue(card.read)
        XCTAssertEqual(card.author, "Richard Dawkins")
        XCTAssertEqual(card.chapters.count, 2)
        XCTAssertEqual(card.chapters[0].label, "Kapitel 1")
        XCTAssertEqual(card.chapters[0].title, "Warum gibt es Menschen?")
        XCTAssertTrue(card.chapters[0].done)
        XCTAssertEqual(card.chapters[0].notes, ["Replikator", "Genetische Drift"])
        XCTAssertEqual(card.chapters[1].number, 2)
        XCTAssertFalse(card.chapters[1].done)
        XCTAssertEqual(card.chapters[1].title, "Die Replikatoren")
    }

    func testQuestionsInStandardNotes() throws {
        let path = "02 Wiki/Ökonomik/Rechtsstaat.md"
        let note = """
        ---
        title: Rechtsstaat
        buch: "[[The Road to Serfdom - Friedrich A Hayek]]"
        quellen:
          - "[[On Liberty - John Stuart Mill]], S. 12"
        ---
        ## Definition
        Der Staat ist an allgemeine, vorab bekannte Regeln gebunden, die für alle gelten und Willkür begrenzen.

        ## Abfrage

        > [!question]- Warum gefährdet Planung den Rechtsstaat?
        > - Allgemeine Regeln binden den Staat.
        > - Planung verlangt Entscheidungen im Einzelfall.
        >
        > Quelle: [[The Road to Serfdom - Friedrich A Hayek]], Kap. 6

        > [!question] Was ist Legalität?
        > Übereinstimmung mit dem geltenden Recht, unabhängig von dessen Inhalt.

        > [!info] kein Fragenblock
        > Text
        """
        let qs = QuestionParser.questions(in: note, path: path)
        XCTAssertEqual(qs.count, 2)
        XCTAssertEqual(qs[0].question, "Warum gefährdet Planung den Rechtsstaat?")
        XCTAssertEqual(qs[0].points, ["Allgemeine Regeln binden den Staat.", "Planung verlangt Entscheidungen im Einzelfall."])
        XCTAssertEqual(qs[0].source, "The Road to Serfdom - Friedrich A Hayek, Kap. 6")
        XCTAssertEqual(qs[0].noteTitle, "Rechtsstaat")
        XCTAssertFalse(qs[0].automatic)
        XCTAssertEqual(qs[0].runtimeStep["type"] as? String, "rubric")
        XCTAssertEqual(qs[0].runtimeStep["points"] as? Int, 2)
        XCTAssertEqual((qs[0].runtimeStep["criteria"] as? [[String: Any]])?.count, 2)
        XCTAssertEqual(qs[1].question, "Was ist Legalität?")
        XCTAssertEqual(qs[1].answer, "Übereinstimmung mit dem geltenden Recht, unabhängig von dessen Inhalt.")
        XCTAssertEqual(qs[1].runtimeStep["type"] as? String, "reveal")
        XCTAssertNotEqual(qs[0].id, qs[1].id)
        XCTAssertEqual(QuestionParser.questions(in: note, path: path).map(\.id), qs.map(\.id))
        XCTAssertTrue(qs[0].runtimeStepJSON.contains("\"type\":\"rubric\""))

        let auto = try XCTUnwrap(QuestionParser.automatic(in: note, path: path))
        XCTAssertTrue(auto.automatic)
        XCTAssertTrue(auto.answer.hasPrefix("Der Staat ist an allgemeine"))
        XCTAssertTrue(auto.question.contains("Rechtsstaat"))
        XCTAssertNotEqual(auto.id, qs[0].id)

        XCTAssertEqual(QuestionParser.bookLinks(in: note), ["The Road to Serfdom - Friedrich A Hayek", "On Liberty - John Stuart Mill"])
        XCTAssertTrue(QuestionParser.questions(in: "# Nur Text\n\nkeine Frage", path: path).isEmpty)
        XCTAssertNil(QuestionParser.automatic(in: "# Nur Text", path: path))
    }

    func testEventsForTheBridge() throws {
        let meta = BookMeta(isbn13: "9780441172719", isbn10: "0441172717", title: "Dune", author: "Frank Herbert", summary: "Arrakis.", pages: 604,
                            publisher: "Ace", published: "2005", categories: ["Science Fiction, Classics"])
        let e = LibraryBridge.bookEvent(meta, cover: Data([1, 2, 3]))
        XCTAssertEqual(e.requiredFeature, "buecher")
        let obj = try XCTUnwrap(JSONSerialization.jsonObject(with: e.json) as? [String: Any])
        XCTAssertEqual(obj["type"] as? String, "book.add")
        XCTAssertEqual(obj["id"] as? String, e.id)
        XCTAssertEqual(obj["isbn13"] as? String, "9780441172719")
        XCTAssertEqual(obj["title"] as? String, "Dune")
        XCTAssertEqual(obj["pages"] as? Int, 604)
        XCTAssertEqual(obj["cover"] as? String, "AQID")
        XCTAssertEqual(obj["categories"] as? [String], ["Science Fiction", "Classics"])
        let bare = LibraryBridge.bookEvent(BookMeta(isbn13: "9780441172719", title: "Dune", author: ""), cover: nil)
        let bareObj = try XCTUnwrap(JSONSerialization.jsonObject(with: bare.json) as? [String: Any])
        XCTAssertEqual(bareObj["author"] as? String, "Unbekannt")
        XCTAssertNil(bareObj["cover"])
        XCTAssertNil(bareObj["pages"])

        let r = LibraryBridge.readingEvent(cardPath: "Bücher/Dune - Frank Herbert.md", title: "Dune", block: "lesestand", text: "Seite 120 von 604", source: "Lernwerk, Lesesitzung")
        XCTAssertEqual(r.requiredFeature, "lernen")
        let ro = try XCTUnwrap(JSONSerialization.jsonObject(with: r.json) as? [String: Any])
        XCTAssertEqual(ro["type"] as? String, "learn.note")
        XCTAssertEqual(ro["block"] as? String, "lernwerk-lesestand")
        XCTAssertEqual(ro["heading"] as? String, "Lesenotizen")
        XCTAssertEqual(ro["path"] as? String, "Bücher/Dune - Frank Herbert.md")
    }

    func testBookNamesMatchTheBridge() {
        XCTAssertEqual(BookNames.notePath(title: "Economics Rules: The Rights and Wrongs of the Dismal Science", author: "Dani Rodrik"),
                       "Bücher/Economics Rules The Rights and Wrongs of the Dismal Science - Dani Rodrik.md")
        XCTAssertEqual(BookNames.coverName(title: "Faust. Der Tragödie Erster Teil", author: "Johann Wolfgang von Goethe"),
                       "Faust. Der Tragödie Erster Teil — Johann Wolfgang von Goethe.jpg")
        XCTAssertEqual(BookNames.notePath(title: "Phänomenologie des Geistes", author: "Georg W. Bertram"),
                       "Bücher/Phänomenologie des Geistes - Georg W Bertram.md")
        XCTAssertEqual(BookNames.notePath(title: "", author: ""), "Bücher/Buch - Unbekannt.md")
    }
}
