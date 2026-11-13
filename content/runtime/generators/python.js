// Python for CS50 AI: reading code and predicting what it prints. Every template builds a small program with fresh
// values and computes the output with Python's own rules (floor division, modulo of negatives, aliasing of lists).
// Programs are also assembled as Parsons puzzles with the proof task: put the lines in order, fill missing lines.
(function () {
  const F = LW.forms;
  const NB = "    ";
  const code = (lines) => "```python\n" + lines.join("\n") + "\n```";
  const fdiv = (a, b) => Math.floor(a / b);
  const pmod = (a, b) => a - b * Math.floor(a / b);
  const list = (arr) => "[" + arr.map((x) => (typeof x === "string" ? "'" + x + "'" : String(x))).join(", ") + "]";
  const ic = (s) => "`" + s + "`";
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }
  const num = (answer, md, explain, extra) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-9, placeholder: "Ausgabe", explain }, extra || {});
  /** choice among printed outputs; wrong ones are distinct and carry a reason */
  function outChoice(G, md, right, wrong, explain) {
    return { type: "choice", md, options: G.options({ md: ic(right), why: explain }, G.shuffle(wrong).map((w) => ({ md: ic(w[0]), why: w[1] }))), explain };
  }
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  const PARSONS_PLAN = { 2: ["order"], 3: ["gaps", "order"], 4: ["gaps", "flaw"] };
  const s = (md, by, why) => ({ md, by, why });
  const d = (md, why) => ({ md, why });

  // ================================================================ values and control flow
  gen("py-werte", "Werte und Kontrollfluss", {
    1: [(lv, G) => {
      const a = G.int(7, 40), b = G.int(2, 9), op = G.pick(["//", "%", "**", "/"]);
      const bb = op === "**" ? G.int(2, 4) : b, aa = op === "**" ? G.int(2, 6) : a;
      const v = op === "//" ? fdiv(aa, bb) : op === "%" ? pmod(aa, bb) : op === "**" ? Math.pow(aa, bb) : aa / bb;
      const why = { "//": "`//` teilt ganzzahlig und rundet nach unten: " + aa + " // " + bb + " = " + v + ".", "%": "`%` liefert den Rest: " + aa + " = " + fdiv(aa, bb) + " · " + bb + " + " + v + ".",
        "**": "`**` ist die Potenz: " + aa + " hoch " + bb + " = " + v + ".", "/": "`/` teilt immer mit Kommazahl (float): " + aa + " / " + bb + " ≈ " + LW.kit.fmt(v, 4) + "." }[op];
      return num(op === "/" ? Math.round(v * 10000) / 10000 : v, "Was gibt dieses Programm aus?" + (op === "/" ? " (auf vier Nachkommastellen)" : "") + "\n\n" + code(["print(" + aa + " " + op + " " + bb + ")"]), why,
        op === "/" ? { tolerance: 0.00006 } : {});
    }, (lv, G) => {
      const w = G.pick(["Hallo", "Python", "CS50", "Suche", "Knoten", "Agent"]), n = G.int(2, 3);
      if (G.chance(0.5)) return num(w.length, "Was gibt das Programm aus?\n\n" + code(["wort = \"" + w + "\"", "print(len(wort))"]), "`len` zählt die Zeichen: \"" + w + "\" hat " + w.length + ".");
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["print(\"" + w.slice(0, 2) + "\" * " + n + ")"]), w.slice(0, 2).repeat(n),
        [[w.slice(0, 2) + " " + n, "Mit `*` wird ein String wiederholt, nicht mit der Zahl verbunden."], [String(n * 2), "Ein String mal eine Zahl ist wieder ein String."], ["Fehler", "String mal ganze Zahl ist erlaubt: Wiederholung."]],
        "Ein String mal eine ganze Zahl wiederholt den String: \"" + w.slice(0, 2).repeat(n) + "\".");
    }],
    2: [(lv, G) => {
      const a = G.int(2, 9), b = G.int(2, 9);
      const x = a + b, y = x - b;
      const ask = G.pick(["x", "y"]);
      return num(ask === "x" ? x : y, "Welchen Wert hat `" + ask + "` am Ende?\n\n" + code(["x = " + a, "y = " + b, "x = x + y", "y = x - y", "print(x, y)"]),
        "Nach Zeile 3 ist x = " + a + " + " + b + " = " + x + ". Zeile 4 rechnet mit dem neuen x: y = " + x + " - " + b + " = " + y + ". Ausgabe: " + x + " " + y + ".");
    }, (lv, G) => {
      const t = G.int(-5, 45);
      const out = t < 0 ? "Frost" : t < 15 ? "kühl" : t < 25 ? "angenehm" : "heiß";
      const lines = ["t = " + t, "if t < 0:", NB + "print(\"Frost\")", "elif t < 15:", NB + "print(\"kühl\")", "elif t < 25:", NB + "print(\"angenehm\")", "else:", NB + "print(\"heiß\")"];
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(lines), out, ["Frost", "kühl", "angenehm", "heiß"].filter((o) => o !== out).map((o) => [o, "Die Bedingungen werden von oben geprüft; der erste wahre Zweig gewinnt, die übrigen werden übersprungen."]),
        "t = " + t + ": Die erste wahre Bedingung entscheidet, also \"" + out + "\". Nach einem erfüllten Zweig prüft Python kein `elif` mehr.");
    }],
    3: [(lv, G) => {
      const a = G.int(0, 4), b = a + G.int(3, 7);
      let sum = 0; for (let i = a; i < b; i++) sum += i;
      return num(sum, "Was gibt das Programm aus?\n\n" + code(["total = 0", "for i in range(" + a + ", " + b + "):", NB + "total += i", "print(total)"]),
        "`range(" + a + ", " + b + ")` läuft von " + a + " bis " + (b - 1) + ", die obere Grenze ist nicht dabei. Summe: " + sum + ".");
    }, (lv, G) => {
      const n = G.pick([10, 17, 32, 50, 100, 7]);
      let m = n, steps = 0; while (m > 1) { m = fdiv(m, 2); steps++; }
      return num(steps, "Was gibt das Programm aus?\n\n" + code(["n = " + n, "schritte = 0", "while n > 1:", NB + "n = n // 2", NB + "schritte += 1", "print(schritte)"]),
        "n halbiert sich (abgerundet), bis es 1 ist. Das dauert " + steps + " Schritte: so oft passt die 2 in " + n + " hinein, ganz wie bei der binären Suche.");
    }, (lv, G) => {
      const start = G.int(0, 3), stop = start + G.int(8, 14), step = G.int(2, 4), xs = [];
      for (let i = start; i < stop; i += step) xs.push(i);
      return num(xs.length, "Wie oft wird `print` ausgeführt?\n\n" + code(["for i in range(" + start + ", " + stop + ", " + step + "):", NB + "print(i)"]),
        "Die Werte sind " + xs.join(", ") + ": " + xs.length + " Stück. Die Grenze " + stop + " selbst gehört nicht dazu.");
    }],
    4: [(lv, G) => {
      const a = -G.int(5, 19), b = G.int(2, 6);
      const ask = G.pick(["//", "%"]), v = ask === "//" ? fdiv(a, b) : pmod(a, b);
      return num(v, "Was gibt das Programm aus?\n\n" + code(["print(" + a + " " + ask + " " + b + ")"]),
        ask === "//" ? "`//` rundet nach unten, auch bei negativen Zahlen: " + a + " / " + b + " ≈ " + LW.kit.fmt(a / b, 2) + ", abgerundet " + v + "." : "Der Rest hat in Python das Vorzeichen des Teilers: " + a + " = " + fdiv(a, b) + " · " + b + " + " + v + ".");
    }, (lv, G) => {
      const w = G.pick(["Informatik", "Wahrscheinlichkeit", "Minimax", "Heuristik", "Optimierung"]);
      const i = G.int(1, 3), j = i + G.int(2, 4);
      const kind = G.pick(["slice", "rev", "neg"]);
      if (kind === "slice") return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["w = \"" + w + "\"", "print(w[" + i + ":" + j + "])"]), w.slice(i, j),
        [[w.slice(i, j + 1), "Das Ende eines Slice ist ausgeschlossen."], [w.slice(i - 1, j), "Indizes beginnen bei 0."], [w.slice(i + 1, j + 1), "Der Start-Index " + i + " ist eingeschlossen."]],
        "Index " + i + " bis vor " + j + ": \"" + w.slice(i, j) + "\". Gezählt wird ab 0, das Ende ist ausgeschlossen.");
      if (kind === "rev") return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["w = \"" + w.slice(0, 5) + "\"", "print(w[::-1])"]), w.slice(0, 5).split("").reverse().join(""),
        [[w.slice(0, 5), "Schrittweite −1 läuft rückwärts."], [w.slice(1, 5), "Es wird kein Zeichen weggelassen."], [w.slice(0, 5).toUpperCase(), "Groß- und Kleinschreibung ändert sich nicht."]],
        "`[::-1]` durchläuft den String mit Schrittweite −1, also rückwärts.");
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["w = \"" + w + "\"", "print(w[-" + i + "])"]), w[w.length - i],
        [[w[i], "Negative Indizes zählen von hinten."], [w[w.length - i - 1], "w[-1] ist das letzte Zeichen, w[-" + i + "] also das " + i + ". von hinten."], [w[w.length - i + 1] || w[0], "Um eins verzählt."]],
        "Negative Indizes zählen von hinten: w[-1] ist \"" + w[w.length - 1] + "\", w[-" + i + "] ist \"" + w[w.length - i] + "\".");
    }],
  });
  LW.extend("py-werte", F.statements([
    { lv: 1, ok: true, md: "In Python bestimmt die Einrückung, welche Zeilen zu einem `if` oder einer Schleife gehören.", why: "Es gibt keine geschweiften Klammern; die Einrückung ist Teil der Syntax." },
    { lv: 1, ok: false, md: "`7 / 2` ergibt in Python 3 die Zahl 3.", why: "`/` teilt immer mit Kommazahl: 3.5. Ganzzahlig teilt `//`." },
    { lv: 2, ok: true, md: "`range(5)` liefert die Zahlen 0, 1, 2, 3, 4.", why: "Start 0, die obere Grenze 5 ist ausgeschlossen." },
    { lv: 2, ok: false, md: "Nach einem erfüllten `if` prüft Python die folgenden `elif`-Zweige trotzdem.", why: "Höchstens ein Zweig einer if-elif-else-Kette wird ausgeführt." },
    { lv: 3, ok: true, md: "`x = x + 1` liest erst den alten Wert von `x` und speichert dann den neuen.", why: "Die rechte Seite wird vollständig ausgewertet, bevor zugewiesen wird." },
    { lv: 3, ok: false, md: "Strings lassen sich verändern, z. B. mit `w[0] = \"X\"`.", why: "Strings sind unveränderlich; man muss einen neuen String bauen." },
    { lv: 4, ok: true, md: "`-7 // 2` ergibt `-4`.", why: "`//` rundet nach unten, auch im Negativen: −3,5 wird zu −4." },
    { lv: 4, ok: false, md: "`0.1 + 0.2 == 0.3` ist in Python `True`.", why: "Kommazahlen sind binär gespeichert; die Summe ist 0.30000000000000004." },
  ], STMT));

  // ================================================================ collections
  gen("py-sammlungen", "Listen, Dicts und Sets", {
    1: [(lv, G) => {
      const xs = G.pickN([3, 5, 7, 8, 11, 13, 2, 4], 5), i = G.int(0, 4), neg = G.chance(0.4);
      const idx = neg ? -(5 - i) : i;
      return num(xs[i], "Was gibt das Programm aus?\n\n" + code(["zahlen = " + list(xs), "print(zahlen[" + idx + "])"]),
        neg ? "Negative Indizes zählen von hinten: zahlen[-1] ist das letzte Element, zahlen[" + idx + "] ist " + xs[i] + "." : "Indizes beginnen bei 0: zahlen[" + i + "] ist das " + (i + 1) + ". Element, " + xs[i] + ".");
    }, (lv, G) => {
      const xs = G.pickN([1, 2, 3, 4, 5, 6, 7, 8, 9], G.int(3, 6));
      return num(xs.length, "Was gibt das Programm aus?\n\n" + code(["daten = " + list(xs), "print(len(daten))"]), "`len` zählt die Elemente: " + xs.length + ".");
    }],
    2: [(lv, G) => {
      const xs = G.pickN([2, 4, 6, 9, 10, 12, 15], 4), add = G.int(1, 3), pops = G.int(0, 2);
      return num(4 + add - pops, "Was gibt das Programm aus?\n\n" + code(["xs = " + list(xs)].concat(Array.from({ length: add }, (_, k) => "xs.append(" + (20 + k) + ")"), Array.from({ length: pops }, () => "xs.pop()"), ["print(len(xs))"])),
        "Vier Elemente, " + add + "-mal `append` hängt an, " + pops + "-mal `pop` entfernt das letzte. Bleiben " + (4 + add - pops) + ".");
    }, (lv, G) => {
      const base = G.pickN(["rot", "blau", "grün", "gelb"], 3), xs = G.shuffle(base.concat(G.pickN(base, G.int(1, 3))));
      return num(new Set(xs).size, "Was gibt das Programm aus?\n\n" + code(["farben = " + list(xs), "print(len(set(farben)))"]),
        "Ein Set enthält jedes Element nur einmal. Verschieden sind " + [...new Set(xs)].join(", ") + ": " + new Set(xs).size + ".");
    }, (lv, G) => {
      const w = G.pick(["banane", "anagramm", "ananas", "rhabarber", "kakao"]), ch = G.pick([...new Set(w.split(""))]);
      const counts = {}; for (const c of w) counts[c] = (counts[c] || 0) + 1;
      return num(counts[ch], "Was gibt das Programm aus?\n\n" + code(["zaehler = {}", "for c in \"" + w + "\":", NB + "zaehler[c] = zaehler.get(c, 0) + 1", "print(zaehler[\"" + ch + "\"])"]),
        "Das Dictionary zählt jedes Zeichen; `get(c, 0)` liefert 0, wenn das Zeichen noch fehlt. \"" + ch + "\" kommt " + counts[ch] + "-mal vor.");
    }],
    3: [(lv, G) => {
      const xs = G.pickN([1, 3, 5, 7, 9, 11, 13], 6), i = G.int(0, 2), j = i + G.int(2, 3);
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["xs = " + list(xs), "print(xs[" + i + ":" + j + "])"]), list(xs.slice(i, j)),
        [[list(xs.slice(i, j + 1)), "Das Ende eines Slice ist ausgeschlossen."], [list(xs.slice(i + 1, j + 1)), "Der Start-Index ist eingeschlossen, gezählt wird ab 0."], [list(xs.slice(i, j - 1)), "Es fehlt ein Element: Von " + i + " bis vor " + j + " sind es " + (j - i) + "."]],
        "Von Index " + i + " bis vor " + j + ": " + list(xs.slice(i, j)) + ".");
    }, (lv, G) => {
      const names = G.pickN(["Ada", "Alan", "Grace", "Claude", "Edsger", "Barbara"], 3), ages = names.map(() => G.int(18, 30));
      const k = G.pick(names);
      return num(ages[names.indexOf(k)], "Was gibt das Programm aus?\n\n" + code(["alter = {" + names.map((n, i) => "\"" + n + "\": " + ages[i]).join(", ") + "}", "print(alter[\"" + k + "\"])"]),
        "Ein Dictionary ordnet Schlüsseln Werte zu; `alter[\"" + k + "\"]` ist " + ages[names.indexOf(k)] + ".");
    }],
    4: [(lv, G) => {
      const xs = G.pickN([1, 2, 3, 4, 5], 3), v = G.int(6, 9);
      const alias = G.chance(0.5);
      const lines = ["a = " + list(xs), alias ? "b = a" : "b = a.copy()", "b.append(" + v + ")", "print(len(a))"];
      return num(alias ? 4 : 3, "Was gibt das Programm aus?\n\n" + code(lines),
        alias ? "`b = a` kopiert die Liste nicht; beide Namen zeigen auf dieselbe Liste. Das `append` über `b` verändert also auch `a`: 4 Elemente." : "`a.copy()` legt eine neue Liste an. Das `append` ändert nur `b`; `a` hat weiter 3 Elemente.");
    }, (lv, G) => {
      const A = G.pickN([1, 2, 3, 4, 5, 6], 4).sort((x, y) => x - y), B = G.pickN([3, 4, 5, 6, 7, 8], 4).sort((x, y) => x - y), op = G.pick(["&", "|", "-"]);
      const r = op === "&" ? A.filter((x) => B.includes(x)) : op === "|" ? [...new Set(A.concat(B))] : A.filter((x) => !B.includes(x));
      return num(r.length, "Was gibt das Programm aus?\n\n" + code(["a = {" + A.join(", ") + "}", "b = {" + B.join(", ") + "}", "print(len(a " + op + " b))"]),
        { "&": "`&` ist der Schnitt: ", "|": "`|` ist die Vereinigung: ", "-": "`-` ist die Differenz, was in a und nicht in b liegt: " }[op] + "{" + r.sort((x, y) => x - y).join(", ") + "}, also " + r.length + " Elemente.");
    }, (lv, G) => {
      const t = G.pickN([1, 2, 3, 4], 3);
      return outChoice(G, "Was passiert?\n\n" + code(["punkt = (" + t.join(", ") + ")", "punkt[0] = 9", "print(punkt)"]), "TypeError",
        [["(9, " + t.slice(1).join(", ") + ")", "Tupel sind unveränderlich; die Zuweisung scheitert schon."], ["(" + t.join(", ") + ")", "Python ignoriert den Fehler nicht, es bricht ab."], ["[9, " + t.slice(1).join(", ") + "]", "Aus einem Tupel wird keine Liste."]],
        "Tupel sind unveränderlich. `punkt[0] = 9` löst einen TypeError aus. Deshalb eignen sich Tupel als Zustände in Suchproblemen und als Schlüssel in Dictionaries.");
    }],
  });
  LW.extend("py-sammlungen", F.statements([
    { lv: 1, ok: true, md: "Listen sind veränderlich, Tupel nicht.", why: "Eine Liste kann man erweitern und ändern; ein Tupel bleibt, wie es ist." },
    { lv: 2, ok: true, md: "Ein Set enthält jedes Element höchstens einmal.", why: "Deshalb eignet es sich für die Menge der schon besuchten Zustände einer Suche." },
    { lv: 2, ok: false, md: "`xs.pop()` entfernt das erste Element einer Liste.", why: "Ohne Argument entfernt `pop` das letzte Element; `pop(0)` das erste." },
    { lv: 3, ok: true, md: "Ein Dictionary findet einen Wert über seinen Schlüssel, ohne die Einträge zu durchsuchen.", why: "Die Suche über den Hash ist im Mittel unabhängig von der Größe." },
    { lv: 3, ok: false, md: "Listen können Schlüssel eines Dictionarys sein.", why: "Schlüssel müssen unveränderlich sein; Tupel gehen, Listen nicht." },
    { lv: 4, ok: true, md: "`b = a` erzeugt bei Listen keine Kopie.", why: "Beide Namen zeigen auf dasselbe Objekt; für eine Kopie braucht man `a.copy()` oder `list(a)`." },
    { lv: 4, ok: false, md: "`a.copy()` kopiert auch die inneren Listen einer verschachtelten Liste.", why: "`copy` ist flach; für innere Listen braucht man `copy.deepcopy`." },
  ], STMT));

  // ================================================================ functions and comprehensions
  gen("py-funktionen", "Funktionen und Comprehensions", {
    1: [(lv, G) => {
      const m = G.int(2, 5), c = G.int(-3, 6), x = G.int(1, 9);
      return num(m * x + c, "Was gibt das Programm aus?\n\n" + code(["def f(x):", NB + "return " + m + " * x " + (c < 0 ? "- " + -c : "+ " + c), "", "print(f(" + x + "))"]),
        "Beim Aufruf wird x = " + x + ": " + m + " · " + x + (c < 0 ? " − " + -c : " + " + c) + " = " + (m * x + c) + ".");
    }],
    2: [(lv, G) => {
      const n = G.int(4, 8), kind = G.pick(["sq", "even", "sum"]);
      if (kind === "sq") { const xs = Array.from({ length: n }, (_, i) => i * i); return num(xs[n - 1], "Was gibt das Programm aus?\n\n" + code(["q = [x * x for x in range(" + n + ")]", "print(q[-1])"]), "Die Liste ist " + list(xs) + "; das letzte Element ist " + xs[n - 1] + "."); }
      if (kind === "even") { const xs = []; for (let i = 0; i < n * 2; i++) if (i % 2 === 0) xs.push(i); return num(xs.length, "Was gibt das Programm aus?\n\n" + code(["g = [x for x in range(" + 2 * n + ") if x % 2 == 0]", "print(len(g))"]), "Gerade Zahlen unter " + 2 * n + ": " + list(xs) + ", also " + xs.length + "."); }
      let t = 0; for (let i = 1; i <= n; i++) t += i;
      return num(t, "Was gibt das Programm aus?\n\n" + code(["print(sum([i for i in range(1, " + (n + 1) + ")]))"]), "Summiert werden 1 bis " + n + ": " + t + ".");
    }],
    3: [(lv, G) => {
      const n = G.int(3, 6); let f = 1; for (let i = 2; i <= n; i++) f *= i;
      return num(f, "Was gibt das Programm aus?\n\n" + code(["def fak(n):", NB + "if n <= 1:", NB + NB + "return 1", NB + "return n * fak(n - 1)", "", "print(fak(" + n + "))"]),
        "Rekursion: fak(" + n + ") = " + n + " · fak(" + (n - 1) + ") = … = " + f + ". Der Basisfall `n <= 1` beendet die Kette.");
    }, (lv, G) => {
      const a = G.int(1, 5), b = G.int(6, 9);
      return num(a, "Was gibt das Programm aus?\n\n" + code(["x = " + a, "", "def setze():", NB + "x = " + b, "", "setze()", "print(x)"]),
        "In der Funktion entsteht eine neue, lokale Variable x. Das globale x bleibt " + a + ". Ändern ließe es sich nur mit `global x`.");
    }, (lv, G) => {
      const base = G.int(2, 4), e = G.int(2, 3), x = G.int(2, 5);
      return num(Math.pow(x, e), "Was gibt das Programm aus?\n\n" + code(["def potenz(x, e=" + base + "):", NB + "return x ** e", "", "print(potenz(" + x + ", " + e + "))"]),
        "Der Standardwert e = " + base + " gilt nur, wenn man e weglässt. Hier wird e = " + e + " übergeben: " + x + " ** " + e + " = " + Math.pow(x, e) + ".");
    }],
    4: [(lv, G) => {
      const words = G.pickN(["Suche", "Agent", "Netz", "Bayes", "Graph", "Minimax", "Heuristik"], 4);
      const longest = words.slice().sort((p, q) => q.length - p.length || words.indexOf(p) - words.indexOf(q))[0];
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["w = " + list(words), "print(max(w, key=len))"]), longest,
        words.filter((x) => x !== longest).map((x) => [x, "`key=len` vergleicht die Längen; bei Gleichstand gewinnt das erste."]),
        "`max(..., key=len)` sucht das Element mit dem größten `len`: \"" + longest + "\". So wählt man in CS50 AI etwa den Zug mit der besten Bewertung.");
    }, (lv, G) => {
      const xs = G.pickN([5, 1, 4, 2, 8, 7, 3], 4);
      const sorted = xs.slice().sort((p, q) => q - p);
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["xs = " + list(xs), "print(sorted(xs, key=lambda x: -x))"]), list(sorted),
        [[list(xs.slice().sort((p, q) => p - q)), "Der Schlüssel −x dreht die Ordnung um."], [list(xs), "`sorted` gibt eine sortierte neue Liste zurück."], [list(xs.slice().reverse()), "Umkehren ist nicht dasselbe wie absteigend sortieren."]],
        "Sortiert wird nach −x, also absteigend: " + list(sorted) + ".");
    }],
  });
  LW.extend("py-funktionen", F.statements([
    { lv: 1, ok: true, md: "Eine Funktion ohne `return` gibt `None` zurück.", why: "Python liefert dann automatisch `None`." },
    { lv: 2, ok: true, md: "`[x for x in xs if x > 0]` baut eine neue Liste aus den positiven Elementen.", why: "Eine List Comprehension mit Filter." },
    { lv: 2, ok: false, md: "Variablen, die in einer Funktion zugewiesen werden, ändern gleichnamige globale Variablen.", why: "Sie sind lokal; ohne `global` bleibt die globale Variable unberührt." },
    { lv: 3, ok: true, md: "Eine rekursive Funktion braucht einen Basisfall, sonst ruft sie sich endlos auf.", why: "Ohne Basisfall bricht Python mit einem RecursionError ab." },
    { lv: 4, ok: true, md: "`lambda x: x[1]` ist eine kleine Funktion ohne Namen, etwa als `key` beim Sortieren.", why: "So sortiert man z. B. Paare nach ihrem zweiten Eintrag." },
    { lv: 4, ok: false, md: "Ein veränderlicher Standardwert wie `def f(xs=[])` wird bei jedem Aufruf neu angelegt.", why: "Er entsteht nur einmal, bei der Definition; Änderungen bleiben für spätere Aufrufe erhalten." },
  ], STMT));
  LW.extend("py-funktionen", F.proofs([
    { lv: 2, kind: "direkt", claim: "Eine Funktion, die die Summe der positiven Zahlen einer Liste zurückgibt.", idea: "Erst ein Zwischenergebnis anlegen, dann in der Schleife filtern und addieren, am Ende zurückgeben.",
      steps: [s("`def summe_positiv(xs):`", "Kopfzeile"), s("`" + NB + "total = 0`", "Startwert"), s("`" + NB + "for x in xs:`", "Schleife"), s("`" + NB + NB + "if x > 0:`", "Bedingung"), s("`" + NB + NB + NB + "total += x`", "Aufsummieren"), s("`" + NB + "return total`", "Rückgabe")],
      distractors: [d("`" + NB + NB + NB + "return total`", "So würde die Funktion schon nach der ersten positiven Zahl zurückkehren."), d("`" + NB + NB + "total = x`", "Das überschreibt die Summe, statt zu addieren.")],
      flaw: { line: 5, md: "`" + NB + NB + "return total`", why: "Steht `return` in der Schleife, endet die Funktion nach dem ersten Durchlauf." } },
    { lv: 3, kind: "direkt", claim: "Eine Funktion, die zählt, wie oft jedes Wort in einer Liste vorkommt.", idea: "Ein leeres Dictionary anlegen und für jedes Wort den Zähler mit `get` erhöhen.",
      steps: [s("`def zaehle(woerter):`", "Kopfzeile"), s("`" + NB + "anzahl = {}`", "Startwert"), s("`" + NB + "for w in woerter:`", "Schleife"), s("`" + NB + NB + "anzahl[w] = anzahl.get(w, 0) + 1`", "Zählen"), s("`" + NB + "return anzahl`", "Rückgabe")],
      distractors: [d("`" + NB + NB + "anzahl[w] += 1`", "Beim ersten Vorkommen gibt es den Schlüssel noch nicht: KeyError."), d("`" + NB + "anzahl = []`", "Für Zähler pro Wort braucht man ein Dictionary, keine Liste.")],
      flaw: { line: 3, md: "`" + NB + NB + "anzahl[w] += 1`", why: "Beim ersten Auftreten von w fehlt der Schlüssel; `+= 1` löst einen KeyError aus. `get(w, 0)` gibt dann 0." } },
  ], PARSONS_PLAN, { order: "Baue das Programm aus den Zeilen. Achte auf die Einrückung.", gaps: "Im Programm fehlen Zeilen. Fülle die Lücken.", flaw: "In diesem Programm steckt genau ein Fehler. In welcher Zeile?" }));

  // ================================================================ classes and search
  gen("py-klassen", "Klassen und Suche", {
    1: [(lv, G) => {
      const st = G.pick(["A", "B", "C", "Start", "Ziel"]), par = G.pick(["None", "wurzel"]);
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["class Node:", NB + "def __init__(self, state, parent):", NB + NB + "self.state = state", NB + NB + "self.parent = parent", "", "wurzel = Node(\"S\", None)", "n = Node(\"" + st + "\", " + par + ")", "print(n.state)"]), st,
        [["S", "Das ist der Zustand der Wurzel, nicht von n."], [par, "parent ist ein anderes Attribut."], ["state", "Ausgegeben wird der Wert des Attributs, nicht sein Name."]],
        "`__init__` speichert die Argumente in den Attributen; `n.state` ist \"" + st + "\".");
    }],
    2: [(lv, G) => {
      const k = G.int(2, 5);
      return num(k, "Was gibt das Programm aus?\n\n" + code(["class Zaehler:", NB + "def __init__(self):", NB + NB + "self.wert = 0", NB + "def klick(self):", NB + NB + "self.wert += 1", "", "z = Zaehler()"].concat(Array.from({ length: k }, () => "z.klick()"), ["print(z.wert)"])),
        "Jeder Aufruf von `klick` erhöht das Attribut des Objekts z, das über `self` erreicht wird: " + k + ".");
    }, (lv, G) => {
      const k = G.int(2, 4);
      return num(0, "Was gibt das Programm aus?\n\n" + code(["class Zaehler:", NB + "def __init__(self):", NB + NB + "self.wert = 0", NB + "def klick(self):", NB + NB + "self.wert += 1", "", "a = Zaehler()", "b = Zaehler()"].concat(Array.from({ length: k }, () => "a.klick()"), ["print(b.wert)"])),
        "a und b sind zwei verschiedene Objekte mit je eigenem Attribut wert. Geklickt wurde nur a; b.wert ist 0.");
    }],
    3: [(lv, G) => {
      const states = G.pickN(["A", "B", "C", "D", "E"], G.int(3, 4)), stack = G.chance(0.5);
      const right = stack ? states[states.length - 1] : states[0];
      return outChoice(G, "Was gibt das Programm aus?\n\n" + code(["frontier = []"].concat(states.map((x) => "frontier.append(\"" + x + "\")"), ["node = frontier.pop(" + (stack ? "" : "0") + ")", "print(node)"])), right,
        states.filter((x) => x !== right).map((x) => [x, stack ? "`pop()` nimmt das zuletzt Angehängte: Stapel, LIFO." : "`pop(0)` nimmt das zuerst Angehängte: Warteschlange, FIFO."]),
        stack ? "`pop()` nimmt das letzte Element: ein Stapel (StackFrontier), die Grundlage der Tiefensuche." : "`pop(0)` nimmt das erste Element: eine Warteschlange (QueueFrontier), die Grundlage der Breitensuche.");
    }],
    4: [(lv, G) => {
      // tiny graph, expansion order of DFS (stack) or BFS (queue), neighbours added in alphabetical order
      const graphs = [
        { A: ["B", "C"], B: ["D"], C: ["E"], D: [], E: [] },
        { A: ["B", "C", "D"], B: ["E"], C: [], D: ["F"], E: [], F: [] },
        { A: ["B", "C"], B: ["D", "E"], C: ["F"], D: [], E: [], F: [] },
      ];
      const gr = G.pick(graphs), dfs = G.chance(0.5);
      const order = [], frontier = ["A"], seen = new Set(["A"]);
      while (frontier.length) {
        const n = dfs ? frontier.pop() : frontier.shift();
        order.push(n);
        for (const m of gr[n]) if (!seen.has(m)) { seen.add(m); frontier.push(m); }
      }
      const other = (() => { const o = [], f = ["A"], sn = new Set(["A"]); while (f.length) { const n = dfs ? f.shift() : f.pop(); o.push(n); for (const m of gr[n]) if (!sn.has(m)) { sn.add(m); f.push(m); } } return o; })();
      const edges = Object.keys(gr).filter((k) => gr[k].length).map((k) => k + " → " + gr[k].join(", ")).join("; ");
      const wrong = [[other.join(", "), dfs ? "Das wäre die Breitensuche mit einer Warteschlange." : "Das wäre die Tiefensuche mit einem Stapel."], [order.slice().reverse().join(", "), "Umgekehrte Reihenfolge."], [Object.keys(gr).join(", "), "Alphabetisch ist nicht die Reihenfolge der Suche."]].filter((w) => w[0] !== order.join(", "));
      return outChoice(G, "Graph: " + edges + ". Die Suche startet bei A, legt Nachbarn in der angegebenen Reihenfolge in die Frontier und nimmt Knoten mit " + (dfs ? "`pop()` (Stapel)" : "`pop(0)` (Warteschlange)") + " heraus. In welcher Reihenfolge werden die Knoten besucht?",
        order.join(", "), wrong, (dfs ? "Tiefensuche: Der zuletzt entdeckte Knoten kommt zuerst dran." : "Breitensuche: erst alle Nachbarn von A, dann deren Nachbarn.") + " Reihenfolge: " + order.join(", ") + ".");
    }],
  });
  LW.extend("py-klassen", F.statements([
    { lv: 1, ok: true, md: "`__init__` wird beim Erzeugen eines Objekts automatisch aufgerufen.", why: "Dort legt man die Attribute des neuen Objekts an." },
    { lv: 2, ok: true, md: "`self` ist das Objekt, für das eine Methode aufgerufen wird.", why: "`z.klick()` übergibt z als `self`." },
    { lv: 2, ok: false, md: "Alle Objekte einer Klasse teilen sich ihre Attribute, die in `__init__` mit `self.` angelegt werden.", why: "Jedes Objekt bekommt eigene Attribute; nur Klassenattribute werden geteilt." },
    { lv: 3, ok: true, md: "Eine Tiefensuche verwaltet ihre Frontier als Stapel.", why: "Last in, first out: Sie geht erst tief in einen Ast." },
    { lv: 3, ok: false, md: "Die Breitensuche findet nicht immer einen kürzesten Weg, auch wenn alle Kanten gleich lang sind.", why: "Bei gleichen Kantenkosten findet sie immer einen kürzesten Weg." },
    { lv: 4, ok: true, md: "Über die `parent`-Verweise der Knoten lässt sich der gefundene Weg rekonstruieren.", why: "Man folgt vom Ziel aus den Eltern bis zur Wurzel und dreht die Liste um." },
  ], STMT));
  LW.extend("py-klassen", F.proofs([
    { lv: 3, kind: "direkt", claim: "Eine Frontier-Klasse für die Breitensuche, wie in CS50 AI.", idea: "Eine Liste als Speicher; anhängen am Ende, entnehmen am Anfang.",
      steps: [s("`class QueueFrontier:`", "Klasse"), s("`" + NB + "def __init__(self):`", "Konstruktor"), s("`" + NB + NB + "self.frontier = []`", "Attribut"), s("`" + NB + "def add(self, node):`", "Methode"), s("`" + NB + NB + "self.frontier.append(node)`", "Anhängen"), s("`" + NB + "def remove(self):`", "Methode"), s("`" + NB + NB + "return self.frontier.pop(0)`", "Entnehmen")],
      distractors: [d("`" + NB + NB + "return self.frontier.pop()`", "`pop()` nimmt das letzte Element; das wäre ein Stapel für die Tiefensuche."), d("`" + NB + NB + "frontier = []`", "Ohne `self.` entsteht nur eine lokale Variable, die nach `__init__` verschwindet.")],
      flaw: { line: 6, md: "`" + NB + NB + "return self.frontier.pop()`", why: "Für eine Warteschlange muss das älteste Element heraus: `pop(0)`. `pop()` macht daraus einen Stapel." } },
  ], { 3: ["gaps", "order"], 4: ["flaw", "gaps"] }, { order: "Baue die Klasse aus den Zeilen. Achte auf die Einrückung.", gaps: "In der Klasse fehlen Zeilen. Fülle die Lücken.", flaw: "In dieser Klasse steckt genau ein Fehler. In welcher Zeile?" }));
})();
