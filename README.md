# Lernwerk

Lern-App für iPhone und iPad im Stil von Brilliant: Themen werden mit interaktiven Grafiken erklärt, jede Lektion prüft das Verständnis mit Aufgaben, und was du dir notierst, landet in deinem Obsidian-Vault.

- **Fächer-Ordner**: Mathematik (Analysis I nach dem Skript des Schülerstudiums, Lineare Algebra I, Stochastik und Statistik), Informatik (CS50 AI), Ökonomik (Mikro, Makro, Ideengeschichte), Ethnologie. Kapitel und Lektionen bauen in einer festen Lernfolge aufeinander auf.
- **Einstiegsanimation in jeder Lektion**: Ein kurzer Film mit Untertiteln erklärt die Idee in einfachen Worten, bevor es formal wird (ε-Bänder ziehen sich zusammen, Suchalgorithmen laufen durchs Labyrinth, Märkte finden ihr Gleichgewicht, Lineages verbünden sich). Anhalten, zurückspulen und zu jeder Szene springen geht jederzeit.
- **Lektionen** mit Schritten zum Lesen, Ausprobieren und Prüfen: Auswahl, Zahlen- und Lückenaufgaben, Reihenfolgen, Zuordnen, Einordnen, Aufdecken und vor allem Visualisierungen, an denen du ziehst und schiebst (Kurven verschieben, Punkte setzen, Galtonbrett, Bayes-Netze, Q-Learning im Gitter, ein Neuron trainieren, Matrizen als Abbildungen, Wirtschaftskreislauf, Verwandtschaftsdiagramme und mehr).
- **Eigene Aufgabenformen**: Fehler finden (welcher Schritt einer Rechnung oder eines Beweises ist falsch, welcher Satz urteilt ethnozentrisch), Beweise aus Bausteinen bauen (mit falschen Bausteinen dazwischen), Schätzen auf einer Skala vor dem Rechnen, Werke und Ereignisse auf einem Zeitstrahl einordnen, Begriffe in eine Vierfeldertafel legen.
- **Weltkarte in der Ethnologie**: Wo forschten Malinowski, Mead, Evans-Pritchard, Turner oder Geertz? Orte antippen, Forschende zuordnen, Felder auf der Karte markieren (mit Entfernung und Richtung als Hinweis), und Appadurais globale Ströme als Animation.
- **Lernpfad**: Eine Übersicht aller Fächer mit Fortschrittsring, Trainingsstufen und der nächsten Lektion, darunter je Kurs ein Baum, der zeigt, welche Lektion auf welcher aufbaut: geschafft, begonnen, bereit oder noch nicht dran. Ein Tipp auf einen Knoten zeigt Voraussetzungen, Folgelektionen und Verbindungen zu anderen Fächern und startet Lektion oder Training.
- **Jedes Mal neue Aufgaben**: Generatoren erzeugen Aufgaben mit anderen Zahlen, Funktionen oder Fällen, damit man das Verfahren lernt und nicht die Lösung. Unter jeder solchen Aufgabe gibt es »Noch eine Aufgabe dieser Art«. Innerhalb einer Runde kommt keine Aufgabe doppelt, und die App merkt sich die zuletzt gesehenen, damit auch die nächsten Runden Neues bringen. Wissensfragen entstehen aus Pools von Aussagen und Begriffen in wechselnden Formen: Richtig oder falsch, mehrere richtige, die falsche Aussage finden, zuordnen, einordnen.
- **Training in vier Stufen**: Zu jedem abgeschlossenen Thema Runden mit neuen Aufgaben in **Leicht**, **Mittel**, **Schwer** und **Experte**, jede Stufe mit eigenem Farbverlauf (grün, orange, rot, violett). Ab 80 Prozent beim ersten Versuch gilt eine Stufe als geschafft, die nächste wird empfohlen.
- **Wiederholung**: Jede Aufgabe einer abgeschlossenen Lektion kommt in Abständen wieder (erst nach Stunden, dann nach Tagen, dann nach Wochen). Was sitzt, kommt seltener. Generierte Aufgaben kommen mit neuen Werten zurück.
- **Fortschritt**: Punkte, Tagesziel, Serie, Lernzeit, Stand je Fach und Kurs.
- **Notizen**: Zu jeder Lektion eine eigene Notiz. Sie wird über die Tagwerk Bridge in die passende Vault-Notiz geschrieben, unter `## Eigene Notizen`.
- Oberfläche in Liquid Glass (iOS 26): Tab-Leiste, schwebende Bedienelemente im Lektions-Player, Glas-Knöpfe.

## Updates ohne Neuinstallation

Die App besteht aus zwei Teilen:

1. Der **native Rahmen** (SwiftUI): Navigation, Fortschritt, Wiederholung, Notizen, Vault-Anbindung. Nur Änderungen hier brauchen eine neue IPA.
2. Die **Inhalte** in `content/`: Lektionen als JSON, die Lektions-Runtime (`content/runtime/`, HTML, CSS, JavaScript) und alle Visualisierungen. Die App gleicht diesen Ordner beim Start und beim Zurückkehren mit GitHub ab. Neue Lektionen, Kurse, Fächer, Aufgaben und Visualisierungen kommen so ohne Neuinstallation aufs iPhone.

Der Abgleich holt die Dateiliste über die Git-Tree-API und lädt nur geänderte Dateien, jede geprüft über ihren Git-Hash. Erst wenn alles da ist, wird umgestellt, eine halbe Lektion gibt es nie. Offline läuft alles mit dem letzten Stand; ohne jede Verbindung mit der Kopie, die in der App steckt. Braucht eine neue Runtime einen neueren Rahmen (`minShell` in `content/runtime/runtime.json`), bleibt die alte aktiv, bis die neue IPA installiert ist.

## Einrichtung

### 1. App aufs iPhone (ohne Mac, wie bei Tagwerk)

1. `Lernwerk.ipa` aus **Releases › latest** laden.
2. In **Sideloadly** ziehen, Apple-ID eintragen, **Start**. iTunes und iCloud müssen die Fassungen von Apples Website sein, nicht aus dem Microsoft Store.
3. Auf dem iPhone: *Einstellungen › Datenschutz & Sicherheit › Entwicklermodus* einschalten, dann *Allgemein › VPN & Geräteverwaltung* dem eigenen Profil vertrauen.

Mit kostenloser Apple-ID läuft die Signatur nach 7 Tagen ab, Sideloadly kann automatisch neu signieren. Lernstand und Notizen bleiben beim Neuinstallieren erhalten.

### 2. Vault-Verbindung

Lernwerk nutzt dieselbe Brücke wie Tagwerk: verschlüsselte Einträge im privaten Repo `tagwerk-daten`, die das Obsidian-Plugin **Tagwerk Bridge** in den Vault schreibt.

In der App unter *Lernen › Zahnrad › Vault über Tagwerk Bridge*:

- GitHub-Benutzername und Daten-Repo (`tagwerk-daten`)
- denselben Token wie in Tagwerk (fein granuliert, nur dieses Repo, Contents: Read and write)
- dieselbe Passphrase wie in Tagwerk
- **Verbindung prüfen**

Lernnotizen versteht das Plugin ab **Tagwerk Bridge 1.3** (Ereignistyp `learn.note`, Funktion `lernen`). Mit einem älteren Plugin warten die Notizen auf dem iPhone und gehen nach dem Update von selbst raus.

### 3. Wohin die Notizen gehen

Jede Lektion nennt ihre Vault-Notizen (zum Beispiel `02 Wiki/Mathematik/09 Stochastik/Satz von Bayes.md`). Deine Notiz landet in der ersten davon als eigener Abschnitt unter `## Eigene Notizen`, eingefasst in `%% lernwerk:… %%`-Marker. Änderst du die Notiz in der App, ersetzt das Plugin nur diesen Abschnitt, der Rest der Vault-Notiz bleibt unberührt. Löschst du sie, verschwindet der Abschnitt. Gibt es die Vault-Notiz noch nicht, legt das Plugin sie mit Frontmatter im Stil des Vaults an (`tags: wiki02/<Fach>`, `type: note`, `status: growing`).

## Entwicklung

```
App/                    SwiftUI-App (iOS 26): Ansichten, Modell, Lektions-Player mit WKWebView
Packages/LernwerkCore/  testbarer Kern: Inhaltsmodell, Abgleich, Wiederholungsplan, Brücke, Verschlüsselung
content/                alles, was ohne Neuinstallation kommt
  courses/index.json    Kursliste und Fächer-Ordner
  courses/<kurs>/       course.json und lessons/*.json
  runtime/              Lektions-Runtime: lw.js (Schritte), overview.js (Lernpfad), lw.css, index.html
    widgets/*.js        Visualisierungen je Fach, geo.js und geo-data.js für die Weltkarte
    generators/*.js     Aufgabengeneratoren je Fach, vier Stufen
scripts/                Inhalte prüfen und bündeln, Screenshots im Simulator
tools/serve.ps1         lokaler Server für die Testumgebung im Browser
tools/worldmap.py       Küstenlinien der Weltkarte, erzeugt widgets/geo-data.js
tools/lernpfad.py       Voraussetzungen der Lektionen (requires, links) für den Lernpfad
docs/AUTHORING.md       wie man Lektionen, Animationen, Generatoren und Visualisierungen schreibt
```

**Lektionen im Browser testen** (Windows): `tools/serve.ps1` starten und `http://localhost:8765` öffnen. Die Testumgebung zeigt jede Lektion im iPhone-Rahmen, hell und dunkel. **Alle Lektionen prüfen** kontrolliert Aufbau, Formeln, Animationen und dass jede Musterlösung ihre Aufgabe löst, **Generatoren prüfen** erzeugt je Generator und Stufe 40 Aufgaben und meldet fehlerhafte.

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

**GitHub Actions** (`.github/workflows/`):

- `build.yml` bei Änderungen am Rahmen: Inhalte prüfen, Kern testen (`swift test`), Inhalte und KaTeX bündeln, mit XcodeGen das Projekt erzeugen, unsigniert bauen, Release **latest** mit `Lernwerk.ipa` aktualisieren. Parallel entstehen Screenshots im Simulator (Demo-Daten), abgelegt in den Zweigen `ci-screenshots-iphone` und `ci-screenshots-ipad`.
- `inhalte.yml` bei Änderungen unter `content/`: prüft alle Kurse und Lektionen (`scripts/check_content.py`). Eine neue IPA ist dafür nicht nötig.

Startargumente für Tests und Screenshots: `-LWDemo YES` (Demo-Daten, nichts wird gespeichert), `-LWTab learn|review|notes|stats|search`, `-LWCourse <kurs>`, `-LWLesson <lektion> -LWStep <n>` (ab 0, Schritt 0 ist der Einstiegsfilm), `-LWPractice <thema> -LWLevel <1 bis 4>`, `-LWPath YES` (Lernpfad, mit `-LWSubject <fach>` vorausgewählt), `-LWReview YES`, `-LWSettings YES`.

## Quellen und Lizenzen

- Lektionstexte sind eigene Formulierungen. Analysis I folgt in Gliederung und Nummerierung dem Skript des Schülerstudiums, Stochastik dem Kerncurriculum Mathematik Hessen (KCGO, Q3), CS50 AI den Vorlesungen 0 bis 6 von Harvards *Introduction to Artificial Intelligence with Python*. Ökonomik und Ethnologie folgen dem Aufbau klassischer Einführungen und beziehen sich auf die Originalwerke (etwa Smith, Ricardo, Marx, Keynes, Hayek; Malinowski, Mauss, Lévi-Strauss, Evans-Pritchard, Barth). Jede Lektion nennt ihre Quelle.
- [KaTeX](https://katex.org) (MIT-Lizenz) setzt die Formeln; es wird beim Bauen aus npm gebündelt.
