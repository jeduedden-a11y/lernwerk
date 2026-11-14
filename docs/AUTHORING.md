# Lektionen schreiben

Alles unter `content/` erreicht die App ohne Neuinstallation. Diese Anleitung beschreibt die Dateien, die Schritt-Typen, Animationen, Aufgabengeneratoren mit vier Schwierigkeitsstufen und die Visualisierungen.

## Regeln

- Texte in eigenen Worten. Lehrbücher, Skripte und Kurse dienen der Gliederung, Quelle in `source` nennen.
- Keine Emojis, nirgends. Hervorhebungen über Fettdruck oder Callouts.
- Lektions-IDs beginnen nie mit `dev` (solche Dateien lädt die App nicht, sie sind für die Testumgebung reserviert).
- Jede Lektion verweist mit `vault` auf die passenden Notizen im Vault (bestehende zuerst, Pfade ab `02 Wiki/`). Die erste ist das Ziel für die eigene Notiz.
- Jede Lektion folgt demselben Bogen: **Animation** (`anim`) mit Erklärung in einfachen Worten, dann **Intuition** (`text`), **Definition** (`text` mit Callouts), interaktive Aufgaben, **Generator-Aufgaben** auf vier Stufen (`gen`), **Zusammenfassung** (`summary`).
- Vor dem Hochladen: Testumgebung öffnen (`tools/serve.ps1`, dann `http://localhost:8765`), **Alle Lektionen prüfen** und **Generatoren prüfen**. Auf GitHub prüft `scripts/check_content.py` die Struktur noch einmal.

## Kurse und Fächer

`content/courses/index.json`:

```json
{
  "schema": 1,
  "courses": ["analysis-1", "lineare-algebra-1", "stochastik", "cs50-ai", "oekonomik", "ethnologie"],
  "subjects": [
    { "id": "mathematik", "title": "Mathematik", "symbol": "sum", "color": "#5E5CE6", "tag": "Mathematik",
      "courses": ["analysis-1", "lineare-algebra-1", "stochastik"] }
  ]
}
```

- `courses` ist die Reihenfolge aller Kurse, `subjects` sind die Fächer-Ordner auf der Startseite. Jeder Kurs gehört in genau einen Ordner.
- `symbol` ist ein SF-Symbol-Name, `color` eine Hex-Farbe, `tag` der Vault-Tag (`wiki02/<tag>`) für neu angelegte Notizen.

`content/courses/<kurs>/course.json`:

```json
{
  "id": "stochastik", "title": "Stochastik und Statistik", "subtitle": "…", "description": "…",
  "color": "#AF52DE", "symbol": "dice.fill", "vault": "02 Wiki/Mathematik/09 Stochastik/Stochastik MOC.md",
  "chapters": [
    { "id": "grundlagen", "title": "Zufall und Abzählen", "ref": "Q3.1",
      "lessons": [
        { "id": "stoch-zufall", "title": "Zufall und das Gesetz der großen Zahlen", "minutes": 13, "requires": [] },
        { "id": "stoch-bayes", "title": "Bedingte Wahrscheinlichkeit", "requires": ["stoch-zufall"], "links": ["cs50-wahrscheinlichkeit"] },
        { "id": "stoch-neu", "title": "Noch in Arbeit", "status": "soon" }
      ] }
  ],
  "practice": [
    { "id": "binomial", "title": "Binomialverteilung", "summary": "Ein Satz, was geübt wird.",
      "after": "stoch-binomial", "gens": ["stoch-binom", "stoch-binom-kenn"], "count": 6 }
  ]
}
```

- Kapitel und Lektionen stehen in **Lernreihenfolge**: Jede Lektion baut nur auf früheren auf.
- `requires` nennt die Lektionen desselben Kurses, auf denen eine Lektion aufbaut, `links` Verbindungen zu Lektionen anderer Kurse. Daraus zeichnet die App den **Lernpfad** als Baum: Eine Lektion ist »bereit«, wenn alles unter `requires` geschafft ist; gesperrt wird nichts. `links` erscheinen nur als Verbindung. Die Einträge pflegt `tools/lernpfad.py` (Tabellen oben im Skript, dann `python tools/lernpfad.py`); die Prüfung meldet unbekannte Lektionen und Kreise.
- `"status": "soon"` zeigt die Lektion als »Bald verfügbar«. Fertige Lektionen liegen in `lessons/<id>.json`.
- `practice` sind die **Trainingsthemen** der Kursseite. `after` ist die Lektion, nach der das Thema freigeschaltet wird, `gens` die Generatoren, aus denen gemischt wird, `count` die Zahl der Aufgaben pro Runde (Standard 6). Die Stufe wählt man in der App.

## Lektion

```json
{
  "id": "stoch-bayes", "title": "…", "subtitle": "…", "source": "…",
  "vault": [{ "path": "02 Wiki/Mathematik/09 Stochastik/Satz von Bayes.md", "title": "Satz von Bayes" }],
  "steps": [ … ]
}
```

Jeder Schritt hat `type`, meist `id` (sonst `s1`, `s2`, …), optional `label` (kleine Überschrift wie »Rechnen«), `md` (Text), `hint`, `explain` (nach dem Lösen), `wrong`.

Fragen kommen nach der Lektion in die Wiederholung. `"review": false` nimmt eine Frage heraus, `"review": true` nimmt eine Visualisierung mit Ziel hinein.

| Typ | Felder |
|---|---|
| `text` | `md` |
| `summary` | `md`, `points` (Liste) |
| `choice` | `options: [{ md, correct, why }]`, genau eine richtig |
| `multi` | wie `choice`, mehrere richtig |
| `truefalse` | `answer` (true/false), `whyNot` |
| `numeric` | `answer` (Zahl oder Liste), `tolerance`, `answerText`, `placeholder`. Eingaben wie `1/6`, `0,25` oder `sqrt(2)` gehen. |
| `cloze` | `md` mit `{{0}}`, `{{1}}`, …; `blanks: [{ accept: [...], numeric, tolerance, placeholder }]` |
| `order` | `items` in richtiger Reihenfolge, die App mischt |
| `match` | `pairs: [[links, rechts], …]` |
| `sort` | `categories`, `items: [{ md, cat }]` |
| `reveal` | `md` (Frage), `solution`; man bewertet sich selbst |
| `widget` | `widget`, `params`, optional `goal`, `after` (Text unter der Grafik) |
| `anim` | `widget`, `params`, `timeline` (Szenen), optional `int`; siehe unten |
| `gen` | `gen` (Name des Generators), `level` 1 bis 4, optional `params`; siehe unten |
| `spot` | **Fehler finden:** `lines` (Text oder `{ md, why }`), `answer` (Index ab 0 oder Liste). `why` erklärt eine Zeile, beim Fehler was schiefgeht, sonst warum sie stimmt. Auch für »Welche Aussage urteilt ethnozentrisch?« |
| `proof` | **Beweis bauen:** `given`, `claim`, `steps` in richtiger Reihenfolge, `distractors: [{ md, why }]` als falsche Bausteine. Gezeigt wird der erste falsche Schritt mit seinem `why`. Mit `"mode": "gaps"` steht der Beweis da und nur die Zeilen in `gaps` (ab 0) werden aus Bausteinen gefüllt; mit `"mode": "justify"` wählt man zu jeder Zeile mit `by` die Begründung aus einem Menü (alle `by` plus `reasons`). Siehe »Beweisaufgaben«. |
| `estimate` | **Schätzen:** `min`, `max`, `answer`, `tolerance` (absolut) oder `relTolerance`, optional `unit`, `digits`, `step`, `start`, `log` (logarithmische Skala). Nach dem Prüfen erscheint der wahre Wert auf der Skala, bei falscher Schätzung »Zu hoch« oder »Zu niedrig«. |
| `timeline` | **Zeitstrahl:** `start`, `end` (Jahre), `items: [{ md, year }]`, `tolerance` in Jahren. Ereignis antippen, dann die Stelle auf dem Strahl; falsche zeigen »früher« oder »später«. (Nicht `from`/`to`: `from` belegt die Wiederholung.) |
| `quadrant` | **Vierfeldertafel:** `x`, `y` (je zwei Beschriftungen), `xLabel`, `yLabel`, optional `cells` (Namen der vier Felder, zeilenweise), `items: [{ md, cell }]` mit `cell` 0 bis 3. |

Nach einer falschen Antwort muss etwas geändert werden, bevor erneut geprüft wird. Nach zwei Fehlversuchen bietet die App die Lösung an.

## Text und Formeln

Markdown wie in Obsidian: Fett, Kursiv, Listen, Tabellen, Überschriften, Callouts (`> [!definition] Titel`, `> [!satz]`, `> [!tip]`, `> [!warning]`), Wikilinks werden als Text gezeigt. Formeln mit `$…$` und `$$…$$` (KaTeX). In JSON jeden Backslash verdoppeln: `"$\\frac{1}{2}$"`. Dezimalkomma in Formeln als `0{,}5`. Kurzbefehle: `\R \N \Z \Q \C \K \eps \abs{x} \norm{x} \set{…} \folge{a}` (ergibt $(a_n)_{n \in \N}$).

Achtung beim Bearbeiten über die Kommandozeile: Heredocs und `sed` verändern Backslashes leicht. Lektionen am besten mit einem Editor oder Skript schreiben, das die Datei unverändert speichert, und danach **Alle Lektionen prüfen**.

## Animationen

Ein `anim`-Schritt spielt eine Visualisierung wie einen kurzen Film ab. Darunter stehen Bedienknöpfe (zurück, abspielen, weiter) und Punkte für die Szenen. Jede Szene hat einen Untertitel und verändert die Grafik:

```json
{
  "id": "film", "type": "anim",
  "md": "Einleitung über der Grafik",
  "widget": "epsilon-band",
  "params": { "f": "1/n", "limit": 0, "eps": 0.5, "n0": 3 },
  "int": ["n0"],
  "timeline": [
    { "caption": "Erste Szene, nur Text." },
    { "caption": "Werte gleiten zum Ziel.", "to": { "eps": 0.2, "n0": 6 }, "dur": 1800 },
    { "caption": "Werte springen sofort.", "set": { "eps": 0.1 }, "hold": 7000 },
    { "caption": "Ein Befehl an das Widget.", "do": { "alg": "bfs", "finish": true } }
  ]
}
```

- `set`: Werte sofort setzen. `to`: Werte über `dur` Millisekunden gleiten lassen (Standard 1400). `int`: Namen, die beim Gleiten auf ganze Zahlen gerundet werden (für die ganze Animation oder je Szene).
- `do`: Befehle an das Widget (`act`), in der Reihenfolge der Schlüssel. Weil man zu jeder Szene springen kann, muss `do` einen **vollständigen** Zustand herstellen, also lieber `{ "alg": "bfs", "step": 12 }` als nur `{ "step": 4 }`.
- `hold`: wie lange die Szene stehen bleibt, bevor die nächste kommt. Ohne Angabe richtet es sich nach der Länge des Untertitels.
- Beim Springen baut die Runtime den Anfangszustand neu auf und wendet `set` und `to` aller früheren Szenen an.

Welche Werte und Befehle ein Widget kennt, steht in seinem Kommentar (`scope`, `getVar`, `setVar`, `act`).

## Aufgabengeneratoren und Stufen

Ein `gen`-Schritt erzeugt bei jedem Durchgang eine neue Aufgabe, mit anderen Zahlen oder anderen Fällen. Die vier Stufen haben eigene Farbverläufe: **Leicht** (grün), **Mittel** (orange), **Schwer** (rot), **Experte** (violett).

```json
{ "id": "neu3", "type": "gen", "gen": "stoch-binom", "level": 3, "label": "Neue Werte" }
```

Generatoren liegen in `content/runtime/generators/<fach>.js`:

```js
LW.generator("stoch-binom", {
  title: "Binomialverteilung",
  make(level, G, params) {
    const n = G.int(5, 20), p = G.pick([0.1, 0.2, 0.5]);
    return { type: "numeric", md: "…", answer: …, explain: "…" };
  },
});
```

- `make` gibt einen gewöhnlichen Schritt zurück (jeder Typ außer `anim` und `gen`), **immer mit `explain`**.
- `G` ist ein Zufallsbaukasten mit festem Startwert: `int(a, b)`, `pick(liste)`, `pickN(liste, n)`, `chance(p)`, `shuffle`, `fact`, `binom`, `gcd`, `round`, `fmt(x, stellen)` für Fließtext, `tex(x, stellen)` für Formeln (Dezimalkomma als `{,}`), `frac(p, q)` (gekürzter Bruch), `term(c)` (»+ 3«, »- 2«), `options(richtig, [falsch…])` für Auswahlaufgaben.
- Der Startwert setzt sich aus Lektion, Schritt und Durchgang zusammen. In der Wiederholung kommt dieselbe Aufgabenart mit neuen Werten wieder.
- Unter jeder generierten Aufgabe bietet die App **»Noch eine Aufgabe dieser Art«** an.
- **Keine Wiederholungen**: Die Laufzeit vergleicht jede erzeugte Aufgabe über einen Fingerabdruck. Innerhalb einer Runde kommt keine Aufgabe zweimal, solange der Generator andere hat; über Runden hinweg merkt sie sich je Generator und Stufe die letzten 48 und weicht ihnen aus. Im Training wechselt sie notfalls zu einem anderen Generator des Themas. Damit das greift, braucht jede Stufe genug verschiedene Aufgaben: Ziel sind mindestens 12 aus 40 Versuchen.

### Mehr Aufgaben für einen Generator

`LW.extend(name, { 1: [...], 2: [...], 3: [...], 4: [...], any: [...] })` hängt an einen bestehenden Generator weitere Aufgaben je Stufe. Ein Objekt ist eine feste Aufgabe, eine Funktion `(level, G, params) => schritt` eine Vorlage mit eigenen Zufallswerten. Die Laufzeit mischt die eigene `make`-Funktion und die Zusätze (Gewicht 3 für `make` und jede Vorlage, 1 für jede feste Aufgabe).

Für Wissensfragen gibt es `LW.forms`, das aus einem Pool viele verschiedene Aufgabenformen baut:

```js
LW.extend("eth-ritual", LW.forms.statements([
  { lv: 1, ok: true,  md: "Übergangsriten haben drei Phasen …", why: "So beschreibt es van Gennep." },
  { lv: 2, ok: false, md: "In der Schwellenphase …", why: "Begründung, warum die Aussage falsch ist." },
], { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] }));
```

| Baustein | Pool | Formen |
|---|---|---|
| `LW.forms.statements` | `{ md, ok, why, lv }` | `tf` (Richtig/Falsch), `multi` (welche stimmen?), `spot` (die eine falsche finden), `sort` (stimmt / stimmt nicht) |
| `LW.forms.pairs` | `{ a, b, why, lv }` | `match` (vier Paare zuordnen), `choice` (was passt zu a?), `reverse` (wozu passt b?) |
| `LW.forms.groups` | `{ md, cat, why, lv }`, dazu `cats` | `sort` (einordnen), `choice` (in welche Kategorie?) |

`lv` ist die niedrigste Stufe, zu der ein Eintrag passt; jede Stufe nimmt vor allem Einträge ihrer eigenen und der Stufe darunter. Jede Aussage braucht ein `why`, es erscheint als Erklärung. Die Zusätze liegen in `generators/extra-*.js`, die Generatoren der neueren Lektionen in `generators/neue-themen.js`. **Generatoren prüfen** testet jede feste Zusatzaufgabe einmal und jede Vorlage mit zwölf Startwerten.
- **Generatoren prüfen** in der Testumgebung erzeugt je Generator und Stufe 40 Aufgaben und meldet Formelfehler, `NaN`, fehlende Erklärungen und doppelte Antwortoptionen.

### Rechenaufgaben in vier Stufen

`generators/physik-rechnen.js` baut aus Aufgabenbeschreibungen den Generator `phy-rechnen`; `params.typ` nennt den Aufgabentyp (eine Liste wählt zufällig). Dieselbe Maschine nutzen `chemie-rechnen.js` (`che-rechnen` und je Kapitel `che-r-*`) und `mathe-rechnen.js` (`ma-rechnen` und `ma-r-*`) über `LW.rechenEngine(specs)`.

- **Stufe 1**: Ergebnis aus gegebenen Werten. **Stufe 2**: Werte in Alltagseinheiten (cm, g, km/h, mT, nm …), erst umrechnen. **Stufe 3**: Formel rückwärts, gesucht ist eine Eingangsgröße. **Stufe 4**: Proportionalität (eine Größe verdoppelt, halbiert …: um welchen Faktor ändert sich das Ergebnis?); folgt das Ergebnis keinem Potenzgesetz, eine Rückwärtsaufgabe in Alltagseinheiten.
- Eine Beschreibung: `v` (Eingaben `[Symbol, Name, Einheit, min, max, Stellen, Faktor zu SI, Alternativeinheit, ihr Faktor]`), `o` (Ergebnisse `[Symbol, Name, Einheit, gültige Ziffern, Faktor, f(SI-Werte)]`), `tex` und `inv` (Formel und Umstellungen für die Erklärung), `ctx` (Situation), `cst` (Konstanten), `ok(x)` (Plausibilität), `invKeys` (erlaubte gesuchte Eingaben), `noPow` (`true` oder Liste der Eingaben, die Stufe 4 nicht verändert). Was nicht ins Schema passt, liefert `custom(level, G)` mit einem fertigen Schritt.

### Aussagenpools je Fach

`philosophie2.js`, `oekonomik2.js` und `ethnologie2.js` legen ganze Generatoren aus Aussagenpools an (`LW.forms.statements` mit dem Plan `{ 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] }`). Die Hilfsfunktion dort muss `gen` heißen: `scripts/check_content.py` erkennt Generatornamen nur in `gen("…"`, `proofGen("…"` und `LW.generator("…"`.

### Uni-Niveau: Verständnis, Klausur, Extrem

Lineare Algebra I (`generators/uni-la1.js` bis `uni-la3.js`) und Analysis I (`generators/uni-ana.js`) verlangen Verständnis statt Rezept. Stufe 3 fragt nach Gegenbeispielen, Fehlern in Beweisen und Aussagen, die man begründen muss. Stufe 4 (Experte) mischt zu etwa gleichen Teilen die schwersten Klausuraufgaben (Label **Klausur**) mit Aufgaben, die über eine Klausur hinausgehen (Label **Extrem**). In den Lektionen tragen `gen`-Schritte der Stufe 4 deshalb kein eigenes Label: Die Aufgabe nennt ihre Art selbst.

- `LW.extend(name, { 4: [...] }, { replace: [4] })` ersetzt auf den genannten Stufen die eigene `make`-Funktion des Generators: Dort kommen nur noch die Zusätze.
- `uni-la1.js` legt den Baukasten `LW.uni` an, den alle `uni-*.js` nutzen: Zahlentheorie (`gcd`, `phi`, `powmod` …), Matrizen (`mat`, `vec`, `detN`, `rankOf`, `mulMM` …), Schrittbausteine (`tf`, `ch`, `mu`, `nu`, `sp`, `pr`) und die Labels `VS` (Verständnis), `KL` (Klausur) und `EX` (Extrem) für feste Aufgaben wie für Vorlagen.
- `byLevels(title, { 1: [...], 2: [...], 3: [...], 4: [...] })` baut einen Generator aus Listen je Stufe; aufgerufen als `gen("name", byLevels(...))`, damit `check_content.py` den Namen findet.
- `expert(name, [...])` macht die Liste zur einzigen Quelle der Stufe 4 eines bestehenden Generators und verschiebt frühere Zusätze der Stufe 4 nach Stufe 3; `demote(name)` gibt die alten Stufe-4-Aufgaben der eigenen `make`-Funktion an Stufe 3 weiter. Feste Aufgaben zählen bei `expert` so viel wie Vorlagen, damit Klausur und Extrem gleich oft kommen.
- `uni-mehr.js` (nach `uni-ana.js` geladen) füllt jede Stufe aller Uni-Generatoren auf, bis mindestens 12 verschiedene Aufgaben aus 40 Versuchen kommen: `more(name, [...])` hängt weitere Klausur- und Extrem-Aufgaben an Stufe 4 (feste Aufgaben zählen dort so viel wie Vorlagen), `add(name, stufe, [...])` weitere Vorlagen an die unteren Stufen.
- Vertiefte Lektionen bekommen vor den abschließenden `gen`-Schritten einen Verständnisblock (Schritt-IDs `v1`, `v2` …): eine Herleitung als Animation (`derivation`), Aussagen mit Gegenbeispiel, Beweise zum Zusammensetzen oder mit Fehler, danach Aufgaben mit den Labels Verständnis, Klausur und Extrem. Zusätzliche Experte-Schritte am Ende heißen `x41`, `x42` ….

## Beweisaufgaben

Ein Beweis aus einem Pool wird zu sechs Aufgabenformen: `order` (aus Bausteinen bauen, mit falschen dazwischen), `gaps` (Lücken füllen), `justify` (zu jeder Zeile die Begründung wählen), `flaw` (die falsche Zeile finden, als `spot`), `strategy` (welcher Aufbau passt?) und `next` (wie geht es weiter?).

```js
LW.proofGen("beweis-zahlen", "Beweise mit ganzen Zahlen", [
  { lv: 2, kind: "kontraposition", given: "…", claim: "…", idea: "Ein Satz zur Beweisidee.",
    steps: [{ md: "…", by: "Kontraposition", why: "…" }, …],
    distractors: [{ md: "…", why: "warum dieser Baustein falsch ist" }],
    flaw: { line: 0, md: "die falsche Fassung von Zeile 0", why: "…" } },
], { reasons: ["Definition von gerade", …] }, { 1: ["strategy", "next", "order"], 2: [...], 3: [...], 4: [...] });
```

- `kind` ist einer der Aufbauten aus `LW.forms.proofKinds` (`direkt`, `kontraposition`, `widerspruch`, `induktion`, `faelle`, `zwei`, `gegenbeispiel`, `konstruktion`, `abschaetzung`). Für andere Pools gibt `o.kinds` eigene Namen vor, etwa Schlussformen bei Argumenten.
- `by` ist ein kurzer Klartext ohne Formeln (er steht in einem Menü). `reasons` sind zusätzliche, plausible falsche Begründungen.
- Jeder Beweis braucht mindestens zwei `distractors` (für `next`) und sollte ein `flaw` haben. Die Zeilen sollten aufeinander aufbauen, damit »wie geht es weiter« eindeutig ist.
- `LW.forms.proofs(pool, plan, o)` liefert dieselben Formen zum Anhängen an einen bestehenden Generator mit `LW.extend`; so bekommen Physik und Chemie Herleitungen, Python Programme zum Zusammensetzen (Einrückung mit geschützten Leerzeichen ` `).
- Die Pools liegen in `generators/beweise.js`; `scripts/check_content.py` erkennt Generatoren, die mit `LW.proofGen` angelegt sind.

## Klausur, Tagesmix, Vorlesen, Rechenzeichen

Diese Funktionen steuert der native Rahmen; Lektionen brauchen dafür nichts Besonderes.

- `LW.start({ mode: "exam", exam: { title, kicker, courseId, chapterId, minutes, count, gens: [{ gen, level, topicId, topicTitle, courseId }] } })`: gemischte Aufgaben ohne Rückmeldung, Uhr oben, am Ende Auswertung pro Thema. Der Knopf »Lösung« heißt dort »Überspringen« (`giveUpLabel`).
- `LW.start({ mode: "mix", mix: { title, items: [{ lessonUrl, stepId }], gens: [...] } })`: abwechselnd Wiederholungen und neue Aufgaben.
- `LW.speech()` liefert den aktuellen Schritt als Text zum Vorlesen; Formeln werden in Worte übersetzt (`\frac` wird »durch«, `^` wird »hoch«). Deshalb trägt jede gerenderte Formel ihren TeX-Quelltext in `data-tex`.
- Zahlenfelder bekommen eine Reihe mit Rechenzeichen. Setzt die App die Tastaturleiste (`theme.nativeKeys`), bleibt die Reihe verborgen; die App schreibt über `LW.insertText` ins Feld. Fehlt die Leiste einmal (etwa bei der schwebenden iPad-Tastatur), schaltet die App `nativeKeys` aus und die Reihe erscheint.
- `theme.reduceMotion` lässt Animationen sofort ans Ende springen (wie die Systemeinstellung »Bewegung reduzieren«).
- Hilfeleiter: `hints` (oder `hint`) kommen zuerst, dann `way` (Lösungsweg Zeile für Zeile) oder die Sätze von `explain`. Wer den Lösungsweg aufdeckt, löst die Aufgabe nicht mehr »beim ersten Versuch«.

## Visualisierungen mit Ziel

Ein `goal` macht aus einer Visualisierung eine Aufgabe. Die Bedingung ist ein Ausdruck über Werte, die das Widget bereitstellt:

```json
"goal": {
  "when": "post >= 0.5",
  "hints": [{ "when": "post < 0.5", "text": "Erst {post*100|1} %." }],
  "message": "Text, wenn kein Hinweis passt",
  "solve": { "prev": 0.091 }
}
```

- Ausdrücke: Zahlen mit Punkt, `+ - * / ^`, `abs sqrt exp ln sin cos fact min max …`, Vergleiche, `&&`, `||`, `? :`.
- `{ausdruck|stellen}` in Texten setzt den aktuellen Wert ein, mit Dezimalkomma. In Formeln in Readouts keine TeX-Klammern mit Variablen verwenden (`\tfrac{1}{n}` würde ausgewertet); stattdessen `\tfrac1n` oder `{{N|0}}` für tiefgestellte Zahlen wie `s_{{N|0}}`.
- `solve` stellt bei »Lösung zeigen« den gelösten Zustand ein. **Jede Aufgabe braucht ein funktionierendes `solve`.** Der Gesamttest der Testumgebung prüft, dass die Musterlösung die Bedingung erfüllt und die Ausgangslage sie noch nicht erfüllt.
- `"allowUntouched": true` erlaubt Prüfen ohne vorherige Bewegung.

## Widgets

Die Parameter stehen jeweils als Kommentar über dem Widget in `content/runtime/widgets/*.js`, und jede Visualisierung wird in mindestens einer Lektion benutzt, die als Vorlage dienen kann.

| Datei | Widgets |
|---|---|
| `graph.js` | `plot` (Funktionen mit Reglern, ziehbare Punkte, Tangenten, Sekanten, Flächen, Riemann-Summen, ε-Bänder), `curves` (verschiebbare Geraden mit Schnittpunkten, Flächen, Punkt setzen, für Ökonomik) |
| `analysis.js` | `numberline`, `epsilon-band`, `nested-intervals`, `truth-table`, `induction` |
| `analysis2.js` | `sequence` (Folgen und Reihen), `venn`, `mapping`, `cantor` (Zickzack und Diagonale), `complex` (Summe, Produkt, Einheitswurzeln), `unitball` (Normen), `derivation` (Herleitung Zeile für Zeile) |
| `linalg.js` | `vector-span`, `matrix-transform` (mit Kern und Eigenvektoren), `modtable`, `gauss` |
| `cs50ai.js` | `maze-search` (DFS, BFS, Greedy, A*), `minimax` (mit Alpha-Beta) |
| `cs50ai2.js` | `model-check`, `bayesnet`, `markov` (Kette und HMM), `landscape` (Hill Climbing, Annealing), `csp`, `classifier` (k-NN, Perzeptron), `gridworld` (Q-Learning), `neuron`, `embedding`, `attention`, `ngram` |
| `econ.js` | `market`, `pin-factory`, `circular-flow`, `workday` |
| `ethno.js` | `reciprocity`, `kula`, `kinship`, `spectrum`, `timeline`, `rite`, `alliance`, `segmentary`, `boundary` |
| `stochastik.js` | `lln`, `bayes`, `expectation`, `galton`, `normal`, `hypothesis`, `boxplot`, `regression`, `tree`, `mosaic`, `intervals` |
| `geo.js` | `worldmap` (Weltkarte in Equal-Earth-Projektion: Orte, Ströme zwischen ihnen, Aufgaben auf der Karte) |
| `chemie.js` | `atom` (Schalenmodell der Elemente 1 bis 20 mit Ionenladung; Werte `Z`, `q`, `e`, `valence`, `period`, `group`, `full`) |
| `philo.js` | `balance` (Waage für Abwägungen: Gewichte links und rechts, verstellbar oder zuzuordnen; Werte `L`, `R`, `diff`, `right`, `w_<id>`) |
| `python.js` | `codetrace` (Programm Zeile für Zeile mit Variablentabelle und Ausgabe; `trace: [{ line, vars, out, note }]`, Wert `k`) |

Für Abläufe Zeile für Zeile, etwa einen Beweis als Film, eignet sich `derivation` aus `analysis2.js` (`lines: [{ tex, why }]`, `start: 0`, Szenen setzen `k`).

### Weltkarte

```json
{ "type": "widget", "widget": "worldmap",
  "params": { "mode": "locate", "view": "ozeanien", "tolerance": 500,
              "target": { "name": "Trobriand-Inseln", "lon": 151.05, "lat": -8.6 } },
  "goal": { "hints": [{ "when": "d > 2500", "text": "Suche zuerst Neuguinea." }] } }
```

- `mode`: `explore` (Orte zeigen, für Animationen), `locate` (Markierung setzen, richtig innerhalb von `tolerance` km), `pick` (nummerierten Ort antippen, `answer` ist die Orts-`id`), `assign` (Namen aus `assign: [{ name, place }]` auf Orte legen).
- `view`: `world`, `afrika`, `ozeanien`, `melanesien`, `suedostasien`, `amerika`, `europa`, `asien` oder `[lonMin, latMin, lonMax, latMax]`. Kleine Gebiete lieber im Ausschnitt fragen.
- `places: [{ id, name, lon, lat, note, color, label, pos }]`, `flows: [{ from, to, label, color }]` (Pfeile zwischen Orts-`id`s).
- Ein leeres `goal: {}` genügt: `locate` prüft `d <= tolerance`, `pick` den richtigen Ort, `assign` alle Namen. Werte für eigene Bedingungen: `d` (km), `placed`, `sel`, `right`, `total`. Falsche Markierungen bekommen Entfernung und Himmelsrichtung als Hinweis.
- Animationen: `k` und `f` (Zahl der sichtbaren Orte und Ströme) gleiten lassen; `do` kennt `focus` (Ort hervorheben und seine `note` zeigen), `show` (Liste von `id`s), `flows`, `reset`.
- Die Küstenlinien sind von Hand vereinfacht (etwa 1 bis 2 Grad genau). Sie stehen in `tools/worldmap.py`, das auch prüft, ob die Forschungsorte auf dem richtigen Land liegen, und `widgets/geo-data.js` erzeugt: `python tools/worldmap.py --write content/runtime/widgets/geo-data.js`.

Werte für Ziele der Stochastik-Widgets:

| Widget | Werte |
|---|---|
| `lln` | `n`, `k`, `h`, `p`, `abw` |
| `bayes` | `prev`, `sens`, `spec`, `post`, `tp`, `fp`, `fn`, `tn`, `pos`, `A` |
| `expectation` | `f`, `E`, `T`, `V`, `sigma`, `x`, `target`, `tol` |
| `galton` | `n`, `p`, `k`, `rel` (0 =, 1 ≤, 2 ≥), `mu`, `sigma`, `P`, `balls`, `mean` |
| `normal` | `mu`, `sigma`, `a`, `b`, `P`, `za`, `zb`, `n`, `p`, `exact` |
| `hypothesis` | `k`, `alpha`, `beta`, `kopt`, `n`, `p0`, `p1`, `level` |
| `boxplot` | `n`, `mean`, `median`, `q1`, `q3`, `iqr`, `sd`, `min`, `max`, `range` |
| `regression` | `sse`, `sseMin`, `ratio`, `a`, `b`, `ra`, `rb`, `r`, `n` |
| `mosaic` | `pa`, `pba`, `pbna`, `pb`, `pab`, `prod`, `indep` |
| `intervals` | `total`, `inside`, `rate`, `n`, `p` |

## Neues Widget

1. In einer Datei unter `content/runtime/widgets/` mit `LW.widget("name", { mount(host, params, ctx) { … return { check, solve, getVar, setVar, act, lock, leave }; } })` registrieren. `LW.kit` liefert SVG, Skalen, Ziehen, Regler, Segmente und Zahlenformat; Breite 360, Farben über CSS-Variablen (`var(--accent)` usw.), damit hell und dunkel passen.
2. Für Aufgaben `check(goal)` und `solve(goal)`, für Animationen `getVar`/`setVar` (gleitende Werte) und `act(name, arg)` (Befehle). `leave()` hält laufende Bewegungen an, wenn der Schritt verlassen wird. `ctx.changed()` nur bei Bedienung durch die Lernenden aufrufen.
3. Neue Datei in `runtime/index.html`, `runtime/dev-frame.html` und `runtime/runtime.json` (`scripts`) eintragen, `version` erhöhen. Dasselbe gilt für neue Generator-Dateien unter `runtime/generators/`.
4. Braucht das Widget etwas Neues vom nativen Rahmen, `minShell` erhöhen und `AppModel.shellVersion` im Rahmen mitziehen. Sonst bleibt `minShell` gleich, und die Visualisierung kommt ohne neue IPA.

## Neuer Aufgabentyp

Aufgabentypen sind Funktionen `R.<typ>(step, ctx)` in `runtime/lw.js`, die `{ el, question, canCheck, check, reveal, lock }` liefern. Ein neuer Typ muss außerdem in `QUESTION_TYPES` (`lw.js`), in `LessonMeta.questionTypes` (`Packages/LernwerkCore`), in `TYPES` von `scripts/check_content.py` und in der Prüfung von `runtime/dev.html` stehen, sonst kommt er nicht in die Wiederholung oder fällt bei der Prüfung durch. Ältere App-Versionen zeigen unbekannte Typen als überspringbaren Hinweis; nur die Wiederholung lässt sie dort aus.

## Lernpfad

`runtime/overview.js` zeichnet die Seite »Lernpfad«: oben die Fächer mit Fortschrittsring, Trainingsstufen und der nächsten Lektion, darunter je Kurs einen Baum aus `requires`. Der Baum folgt der Reihenfolge des Kurses: ein Band je Kapitel, darin eine Zeile je Lektion mit vollem Titel, eingerückt unter der Lektion desselben Kapitels, auf der sie zuerst aufbaut. Ein Kapitel mit nur einer Lektion (etwa eine Woche eines Plans mit Datum) wird eine einzelne Zeile. Voraussetzungen aus früheren Kapiteln erscheinen als kurzer Strich von oben, das Blatt zur Lektion nennt alle. Die App startet sie mit `LW.start({ mode: "overview", subject, progress: { done, skipped, started, practice, streak } })` und bekommt `{ type: "open", courseId, lessonId }` oder `{ type: "practice", courseId, topicId, level }` zurück. In der Testumgebung zeigt der Knopf **Lernpfad** die Seite mit ausgedachtem Fortschritt.

**Überspringen**: In der App lässt sich eine Lektion über ihr Kontextmenü, die Karte »Als Nächstes« oder das Kapitelmenü (»Alle offenen Lektionen überspringen«) überspringen. Übersprungene Lektionen gelten als erledigt für den Pfad: Sie schalten die Lektionen frei, die auf ihnen aufbauen, öffnen ihr Trainingsthema und zählen im Fortschritt; sie bringen aber keine XP und keine Wiederholungskarten, und die Ampel eines Kapitels springt erst an, wenn dort wirklich gelernt wurde. »Nicht mehr überspringen« nimmt das zurück; wer die Lektion später durcharbeitet, hat sie normal geschafft.

## Fortschritt auf mehreren Geräten

Mit eingerichteter Vault-Verbindung schreibt jedes Gerät seinen Lernstand verschlüsselt (Passphrase der Tagwerk Bridge, Umschlagtyp `progress`, JSON mit zlib gepackt) nach `lernwerk/fortschritt/<Geräte-Id>.tw` im Daten-Repo und liest die Dateien der anderen (`ProgressSync.swift`). Das Zusammenführen ist reihenfolgefrei und lässt sich beliebig oft wiederholen: Lektionen und Karten nach der jüngeren Änderung, ein Abschluss geht nie verloren, Klausuren und Fehlerprotokoll werden vereinigt (gelöste Aufgaben merkt sich `resolvedMistakes`), Punkte pro Tag und Training sind die Summe dessen, was jedes Gerät selbst gelernt hat (`ownDays`, `ownPractice`), damit nichts doppelt zählt. Ein Zurücksetzen gilt für alle Geräte: Dateien von vor dem jüngsten `resetAt` bringen nichts mehr ein. Abgeglichen wird beim Start, beim Zurückkehren in die App, beim Verlassen und beim Herunterziehen auf der Startseite; hochgeladen wird nur, wenn sich etwas geändert hat. Notizen laufen weiter über die Bridge in den Vault.

## Formelsammlung je Kurs

`courses/<kurs>/formeln.json` (liegt im Kursordner, nicht unter `lessons/`): `{ "id": "formeln", "course": "<kurs>", "title", "groups": [{ "title", "formulas": [...] }] }`. Eine Formel: `id`, `name`, `tex` (ohne `$`), `vars` (`[Symbol, Bedeutung, Einheit]`), `lessons` (Lektions-ids, die sie nutzen), `abi` (`"blatt"`: steht in der Formelsammlung, `"merken"`: Grundformel), `solve` (`{ Symbol: umgestellte Formel }`), `wrong` (plausible falsche Varianten), `note`.

Daraus entstehen ohne weitere Arbeit: die Formelspalte neben jeder Lektion (iPad) bzw. das Formelblatt (iPhone), die Formelsammlung auf Kurs- und Fachseite, Formelkarten in der Wiederholung (nach jeder Lektion die Formeln aus `lessons`) und das Trainingsthema `formeln` mit dem Generator `formeln-<kurs>` (erkennen, ergänzen, umstellen, falsche finden). Für einen neuen Kurs den Generator in `generators/formeln.js` mit `LW.generator("formeln-<kurs>", training("<kurs>"))` eintragen.

## Grafiken aus dem Vault

`"image": "vault:Dateiname.svg"` an einem Schritt zeigt eine Grafik aus dem Vault (aufgelöst wie `![[Dateiname.svg]]`). Die App liest sie aus ihrer verschlüsselten Wiki-Kopie, die Testumgebung (`tools/serve.ps1`) direkt aus dem Vault. Vault-Inhalte kommen so nie ins öffentliche Inhalts-Repo. `caption` setzt eine Bildunterschrift.

## Abitur: Klausuraufgaben mit Erwartungshorizont

- `rubric`: `{ "type": "rubric", "part": "1.2", "operator": { "word", "means" }, "md", "solution", "criteria": [{ "md", "points" }], "review": false }`. Erst auf Papier lösen, dann Erwartungshorizont zeigen und abhaken; ohne `criteria` vergibt man 0 bis `points` BE.
- `grade`: am Ende einer Probeklausur; addiert die BE und rechnet nach dem Notenschlüssel der Oberstufe in Notenpunkte um.
- Die Ampel im Fortschritt bewertet jedes Kapitel (in der Oberstufe ein Themenfeld) aus geschafften Lektionen, Wiederholung und Training.

## Chemie- und Versuchsansichten

- `glucose` (Ringschluss Fischer bis Haworth, α/β), `molecule3d` (drehbare Moleküle, Sesselform, Spiegelbilder), `protein` (Primär- bis Quartärstruktur, Denaturierung), `mechanism` (`sn2`, `sn1`, `addition`, `halbacetal`, `veresterung`; Elektronenpfeile setzt die lernende Person selbst). Ziele über `goal.when`, etwa `"solved == 1"` oder `"stage == 3 && beta == 0"`.
- `versuch` mit `exp`: `fadenstrahlrohr`, `millikan`, `photoeffekt`, `franckhertz`, `elektronenbeugung`, `gitter`, `federpendel`, `entladung`, `titration` (`acid`: `salzsaeure` oder `essigsaeure`). Aufbau bewegt sich, Messwerte streuen realistisch, Tabelle, Diagramm mit Ausgleichsgerade, Ergebnis mit Abweichung. Ziel etwa `{ "when": "n >= 5 && err < 0.08" }`.

## TMUA: Etappen, Papers, Fehlerprotokoll

- Kapitel mit `from`/`to` (JJJJ-MM-TT) zeigen ihre Woche; die laufende ist markiert und steht oben auf der Kursseite.
- Trainingsthemen ohne `after` können mit `chapter` in ein Kapitel gesetzt werden; sie sind sofort offen.
- `papers`: `{ id, title, subtitle, minutes, count, level, topics: [Trainingsthemen] }` laufen als Klausur im TMUA-Format (A bis H, kein Taschenrechner, geschätzter Wert 1 bis 9).
- `"mistakeLog": true` am Kurs: falsch gelöste generierte Aufgaben aus Training und Papers landen mit ihrem Wortlaut im Fehlerprotokoll und werden später genau so wieder gestellt.
- Aufgaben auf Englisch setzen `"lang": "en"`: Begriffe aus `LW.glossary` lassen sich antippen und zeigen das deutsche Wort.
