// Generators for the lessons added to the learning paths in November 2026: one training topic per lesson, four
// levels each, built from number templates and from content pools via LW.forms. Own wording throughout.
(function () {
  const F = LW.forms;
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fracText = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); p /= g; q /= g; return q === 1 ? String(p) : p + "/" + q; };
  const dec = (G, x, d) => ({ answer: G.round(x, d), tolerance: 0.6 * Math.pow(10, -d), answerText: G.fmt(x, d), placeholder: "Dezimalzahl" });
  const num = (answer, explain, extra) => Object.assign({ type: "numeric", answer, tolerance: 1e-6, placeholder: "Zahl", explain }, extra || {});
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  const PAIR = { 1: ["match"], 2: ["choice"], 3: ["reverse"], 4: ["match"] };
  /** a generator whose make() picks one of the templates of the level */
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }
  const pm = (rows) => "\\begin{pmatrix} " + rows.map((r) => r.join(" & ")).join(" \\\\ ") + " \\end{pmatrix}";

  // ================================================================ Analysis: power series
  gen("ana-potenzreihen", "Potenzreihen", {
    1: [(level, G) => {
      const a = G.int(2, 6);
      if (G.chance(0.5)) return num(a, "Wurzelkriterium: $\\sqrt[n]{\\abs{x}^n / " + a + "^n} = \\tfrac{\\abs{x}}{" + a + "} < 1 \\iff \\abs{x} < " + a + "$. Also $R = " + a + "$.",
        { md: "Bestimme den Konvergenzradius $R$ von $\\displaystyle\\sum_{n=0}^{\\infty} \\frac{x^n}{" + a + "^n}$." });
      return Object.assign(num(1 / a, "Wurzelkriterium: $\\sqrt[n]{" + a + "^n \\abs{x}^n} = " + a + "\\abs{x} < 1 \\iff \\abs{x} < \\tfrac{1}{" + a + "}$.",
        { md: "Bestimme den Konvergenzradius $R$ von $\\displaystyle\\sum_{n=0}^{\\infty} " + a + "^n x^n$ (Bruch oder Dezimalzahl)." }), { tolerance: 0.0006, answerText: "1/" + a, placeholder: "Bruch oder Dezimalzahl" });
    }],
    2: [(level, G) => {
      const a = G.int(1, 4), x0 = G.int(-3, 3);
      const xs = x0 === 0 ? "x" : "(x " + (x0 > 0 ? "- " + x0 : "+ " + -x0) + ")";
      return {
        type: "cloze",
        md: "Die Reihe $\\displaystyle\\sum_{n=0}^{\\infty} \\frac{" + xs + "^n}{" + a + "^n}$ konvergiert genau im offenen Intervall von {{0}} bis {{1}}.",
        blanks: [{ accept: [x0 - a], numeric: true, tolerance: 1e-6, placeholder: "links" }, { accept: [x0 + a], numeric: true, tolerance: 1e-6, placeholder: "rechts" }],
        explain: "Entwicklungspunkt $x_0 = " + x0 + "$, Radius $R = " + a + "$: Konvergenz für $\\abs{x - " + (x0 < 0 ? "(" + x0 + ")" : x0) + "} < " + a + "$, also auf $(" + (x0 - a) + ", " + (x0 + a) + ")$. An den Rändern ist der Betrag der Glieder $1$, dort divergiert sie.",
      };
    }, (level, G) => {
      const k = G.int(1, 3);
      return num(1, "Wurzelkriterium: $\\sqrt[n]{n^" + k + "} \\to 1$, also hängt alles an $\\abs{x} < 1$. Polynomiale Faktoren ändern den Radius nicht.",
        { md: "Bestimme den Konvergenzradius von $\\displaystyle\\sum_{n=1}^{\\infty} n^{" + k + "} x^n$." });
    }],
    3: [(level, G) => {
      const ITEMS = [
        ["\\sum \\frac{x^n}{n!}", "R = \\infty", "Quotient $\\tfrac{\\abs{x}}{n+1} \\to 0$ für jedes $x$."],
        ["\\sum n!\\, x^n", "R = 0", "Quotient $(n+1)\\abs{x} \\to \\infty$ für jedes $x \\ne 0$."],
        ["\\sum \\frac{x^n}{n}", "R = 1", "$\\sqrt[n]{\\tfrac1n} \\to 1$."],
        ["\\sum \\binom{2n}{n} x^n", "R = \\tfrac14", "Quotient der Koeffizienten $\\tfrac{(2n+2)(2n+1)}{(n+1)^2} \\to 4$."],
        ["\\sum \\frac{n}{2^n} x^n", "R = 2", "$\\sqrt[n]{\\tfrac{n}{2^n}} \\to \\tfrac12$."],
        ["\\sum \\frac{x^{2n}}{4^n}", "R = 2", "Mit $y = x^2$: $\\sum \\left(\\tfrac{y}{4}\\right)^n$ konvergiert für $y < 4$, also $\\abs{x} < 2$."],
        ["\\sum \\frac{(-1)^n x^n}{3^n}", "R = 3", "Das Vorzeichen ändert den Betrag nicht: $\\tfrac{\\abs x}{3} < 1$."],
      ];
      const [s, r, why] = G.pick(ITEMS);
      const opts = ["R = 0", "R = \\tfrac14", "R = 1", "R = 2", "R = 3", "R = \\infty"];
      return { type: "choice", md: "Welchen Konvergenzradius hat $" + s + "$?",
        options: G.options({ md: "$" + r + "$" }, G.shuffle(opts.filter((o) => o !== r)).map((o) => ({ md: "$" + o + "$", why }))), explain: why };
    }],
  });
  LW.extend("ana-potenzreihen", F.statements([
    { lv: 3, ok: true, md: "Im Inneren des Konvergenzkreises konvergiert eine Potenzreihe absolut.", why: "Dort lässt sie sich mit einer geometrischen Reihe abschätzen." },
    { lv: 3, ok: false, md: "Auf dem Rand $\\abs{x - x_0} = R$ konvergiert eine Potenzreihe immer.", why: "Am Rand ist alles möglich: $\\sum \\tfrac{x^n}{n}$ konvergiert bei $x = -1$ und divergiert bei $x = 1$." },
    { lv: 3, ok: false, md: "Eine Potenzreihe mit Radius $R = 0$ konvergiert nirgends.", why: "Im Entwicklungspunkt $x_0$ konvergiert sie immer, dort sind alle Glieder ab dem ersten $0$." },
    { lv: 3, ok: true, md: "Die Exponentialreihe hat den Konvergenzradius $\\infty$.", why: "Ihre Koeffizienten $\\tfrac{1}{n!}$ fallen schneller als jede geometrische Folge." },
    { lv: 4, ok: true, md: "Eine Potenzreihe darf im Inneren ihres Konvergenzbereichs gliedweise differenziert werden.", why: "Die abgeleitete Reihe hat denselben Radius und konvergiert dort gleichmäßig auf kompakten Teilmengen." },
    { lv: 4, ok: false, md: "Gliedweises Differenzieren verkleinert den Konvergenzradius.", why: "Der Faktor $n$ ändert $\\sqrt[n]{\\abs{a_n}}$ im Grenzwert nicht. Der Radius bleibt gleich." },
    { lv: 4, ok: true, md: "Nach Cauchy-Hadamard ist $R = \\dfrac{1}{\\limsup \\sqrt[n]{\\abs{a_n}}}$.", why: "Das ist das Wurzelkriterium, angewandt auf $a_n (x - x_0)^n$." },
    { lv: 4, ok: false, md: "Hat $\\sum a_n x^n$ den Radius $2$, dann divergiert die Reihe bei $x = 1{,}5$.", why: "$1{,}5 < 2$ liegt im Inneren: Dort konvergiert sie sogar absolut." },
    { lv: 4, ok: true, md: "Hat $\\sum a_n x^n$ den Radius $2$, dann divergiert die Reihe bei $x = 3$.", why: "Außerhalb des Radius bilden die Glieder keine Nullfolge." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ Analysis: fundamental theorem
  const FUNS = [
    { t: "t^2", f: (x) => x * x, ok: () => true },
    { t: "t^3", f: (x) => x * x * x, ok: () => true },
    { t: "\\sqrt{t}", f: (x) => Math.sqrt(x), ok: (x) => x >= 0 },
    { t: "\\tfrac{1}{t}", f: (x) => 1 / x, ok: (x) => x > 0 },
    { t: "e^{t}", f: (x) => Math.exp(x), ok: () => true },
    { t: "\\sin t", f: (x) => Math.sin(x), ok: () => true },
  ];
  gen("ana-hauptsatz", "Hauptsatz", {
    1: [(level, G) => {
      const fn = G.pick(FUNS), a = G.pick([1, 2, 3, 4]), lo = G.pick([0, 1]);
      const low = fn.t === "\\tfrac{1}{t}" ? 1 : lo;
      const v = fn.f(a);
      return Object.assign({ type: "numeric", md: "$F(x) = \\displaystyle\\int_{" + low + "}^{x} " + fn.t + "\\,dt$. Bestimme $F'(" + a + ")$ (vier Nachkommastellen).",
        explain: "Hauptsatz: $F'(x) = f(x)$, die untere Grenze spielt keine Rolle. Also $F'(" + a + ") = f(" + a + ") \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4));
    }],
    2: [(level, G) => {
      const c = G.int(-3, 3) || 1, d = G.int(-4, 4), e = G.int(-3, 5), a = G.int(-2, 1), b = a + G.int(1, 3);
      const N = 2 * c * (b ** 3 - a ** 3) + 3 * d * (b * b - a * a) + 6 * e * (b - a);
      const poly = (c === 1 ? "" : c === -1 ? "-" : c) + "x^2" + (d ? (d > 0 ? " + " : " - ") + (Math.abs(d) === 1 ? "" : Math.abs(d)) + "x" : "") + (e ? (e > 0 ? " + " : " - ") + Math.abs(e) : "");
      return { type: "numeric", md: "Berechne mit einer Stammfunktion $\\displaystyle\\int_{" + a + "}^{" + b + "} \\left(" + poly + "\\right) dx$ (Bruch oder Dezimalzahl).",
        answer: N / 6, tolerance: 0.0006, answerText: fracText(N, 6), placeholder: "Bruch oder Dezimalzahl",
        explain: "Stammfunktion $F(x) = \\tfrac{" + c + "}{3}x^3 + \\tfrac{" + d + "}{2}x^2 + " + e + "x$. Dann $F(" + b + ") - F(" + a + ") = " + fracText(N, 6).replace("/", " / ") + "$." };
    }],
    3: [(level, G) => {
      const fn = G.pick(FUNS.filter((f) => f.t !== "\\tfrac{1}{t}")), x0 = G.pick([1, 2, 0.5, 1.5]);
      if (G.chance(0.5)) {
        const v = fn.f(x0 * x0) * 2 * x0;
        return Object.assign({ type: "numeric", md: "$G(x) = \\displaystyle\\int_{0}^{x^2} " + fn.t + "\\,dt$. Bestimme $G'(" + G.tex(x0) + ")$ (vier Nachkommastellen).",
          hint: "Die obere Grenze ist selbst eine Funktion von $x$: Kettenregel.",
          explain: "$G(x) = F(x^2)$ mit $F' = f$, also $G'(x) = f(x^2) \\cdot 2x$. Bei $x = " + G.tex(x0) + "$: $f(" + G.tex(x0 * x0) + ") \\cdot " + G.tex(2 * x0) + " \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4));
      }
      const v = -fn.f(x0);
      return Object.assign({ type: "numeric", md: "$H(x) = \\displaystyle\\int_{x}^{5} " + fn.t + "\\,dt$. Bestimme $H'(" + G.tex(x0) + ")$ (vier Nachkommastellen, mit Vorzeichen).",
        explain: "$H(x) = F(5) - F(x)$, also $H'(x) = -f(x) = " + G.tex(v, 4) + "$." }, dec(G, v, 4));
    }],
  });
  LW.extend("ana-hauptsatz", F.statements([
    { lv: 3, ok: true, md: "Ist $f$ stetig auf $[a, b]$, dann ist $F(x) = \\int_a^x f(t)\\,dt$ differenzierbar mit $F' = f$.", why: "Das ist der erste Teil des Hauptsatzes." },
    { lv: 3, ok: false, md: "Ist $F' = f$, dann gilt $\\int_a^b f(x)\\,dx = F(a) - F(b)$.", why: "Umgekehrt: $F(b) - F(a)$, obere minus untere Grenze." },
    { lv: 3, ok: true, md: "Zwei Stammfunktionen derselben Funktion auf einem Intervall unterscheiden sich nur um eine Konstante.", why: "Ihre Differenz hat Ableitung $0$ und ist nach dem Mittelwertsatz konstant." },
    { lv: 3, ok: false, md: "$\\dfrac{d}{dx}\\displaystyle\\int_0^{x^2} f(t)\\,dt = f(x^2)$.", why: "Es fehlt der Faktor aus der Kettenregel: $f(x^2) \\cdot 2x$." },
    { lv: 4, ok: false, md: "Jede Riemann-integrierbare Funktion besitzt eine Stammfunktion.", why: "Die Vorzeichenfunktion ist integrierbar, aber keine Ableitung: Ableitungen haben die Zwischenwerteigenschaft." },
    { lv: 4, ok: true, md: "Die Integralfunktion einer integrierbaren Funktion ist stetig.", why: "$\\abs{F(x) - F(y)} \\le \\sup\\abs{f} \\cdot \\abs{x - y}$." },
    { lv: 4, ok: false, md: "Aus $\\int_a^b f(x)\\,dx = 0$ folgt $f = 0$ auf $[a, b]$.", why: "$\\int_0^{2\\pi} \\sin x\\,dx = 0$, aber $\\sin \\ne 0$." },
    { lv: 4, ok: true, md: "Ist $f \\ge 0$ stetig und $\\int_a^b f(x)\\,dx = 0$, dann ist $f = 0$ auf $[a, b]$.", why: "Ein positiver Wert bliebe wegen der Stetigkeit auf einem kleinen Intervall positiv und gäbe Fläche." },
    { lv: 4, ok: false, md: "Die Integralfunktion $F(x) = \\int_a^x f(t)\\,dt$ ist immer monoton wachsend.", why: "Nur wenn $f \\ge 0$ ist. Wo $f$ negativ ist, fällt $F$." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ Linear algebra: solution sets
  gen("la-loesungsmenge", "Lösungsmengen", {
    1: [(level, G) => {
      const n = G.int(2, 5), m = G.int(2, 5), r = G.int(1, Math.min(m, n));
      const s = r < m && G.chance(0.35) ? r + 1 : r;
      const right = s > r ? "keine Lösung" : r === n ? "genau eine Lösung" : "unendlich viele Lösungen";
      const why = s > r ? "Der Rang wächst durch $b$: Die rechte Seite liegt nicht im Bild von $A$." : r === n ? "Rang gleich Zahl der Unbekannten: keine freien Variablen." : "Lösbar, und $" + (n - r) + "$ Variable" + (n - r === 1 ? " bleibt" : "n bleiben") + " frei.";
      return { type: "choice",
        md: "Ein lineares Gleichungssystem $Ax = b$ hat $" + m + "$ Gleichungen und $" + n + "$ Unbekannte, mit $\\operatorname{Rang} A = " + r + "$ und $\\operatorname{Rang}(A \\mid b) = " + s + "$. Wie viele Lösungen hat es?",
        options: ["keine Lösung", "genau eine Lösung", "unendlich viele Lösungen"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
    2: [(level, G) => {
      const n = G.int(3, 7), r = G.int(1, n);
      return num(n - r, "Dimensionsformel: $\\dim \\ker A = n - \\operatorname{Rang} A = " + n + " - " + r + " = " + (n - r) + "$.",
        { md: "$A$ ist eine Matrix mit $" + n + "$ Spalten und Rang $" + r + "$. Welche Dimension hat die Lösungsmenge von $Ax = 0$?" });
    }],
    3: [(level, G) => {
      // an augmented matrix already in echelon form
      const kind = G.pick(["unique", "free", "none"]);
      const r = () => G.int(-4, 4);
      let rows;
      if (kind === "unique") rows = [[1, r(), r(), r()], [0, G.pick([1, 2, -1]), r(), r()], [0, 0, G.pick([1, 3, -2]), r()]];
      else if (kind === "free") rows = [[1, r(), r(), r()], [0, G.pick([1, 2, -1]), r(), r()], [0, 0, 0, 0]];
      else rows = [[1, r(), r(), r()], [0, G.pick([1, 2, -1]), r(), r()], [0, 0, 0, G.pick([1, 2, -3, 5])]];
      const tex = "\\left(\\begin{array}{ccc|c} " + rows.map((q) => q.join(" & ")).join(" \\\\ ") + " \\end{array}\\right)";
      const right = kind === "unique" ? "genau eine Lösung" : kind === "free" ? "unendlich viele Lösungen" : "keine Lösung";
      const why = kind === "unique" ? "Drei Stufen bei drei Unbekannten: Rückwärts einsetzen liefert genau eine Lösung." : kind === "free" ? "Die letzte Zeile ist $0 = 0$. Nur zwei Stufen, $x_3$ bleibt frei." : "Die letzte Zeile sagt $0 = " + rows[2][3] + "$, ein Widerspruch.";
      return { type: "choice", md: "Die erweiterte Koeffizientenmatrix hat schon Stufenform: $" + tex + "$. Wie viele Lösungen hat das System?",
        options: ["keine Lösung", "genau eine Lösung", "unendlich viele Lösungen"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
  });
  LW.extend("la-loesungsmenge", F.statements([
    { lv: 3, ok: true, md: "Ist $x_p$ eine Lösung von $Ax = b$, dann ist die Lösungsmenge $x_p + \\ker A$.", why: "Zwei Lösungen unterscheiden sich um eine Lösung des homogenen Systems." },
    { lv: 3, ok: false, md: "Die Lösungsmenge von $Ax = b$ ist immer ein Untervektorraum.", why: "Für $b \\ne 0$ enthält sie den Nullvektor nicht. Sie ist ein verschobener Unterraum." },
    { lv: 3, ok: true, md: "Ein homogenes System $Ax = 0$ hat immer mindestens eine Lösung.", why: "Der Nullvektor löst es." },
    { lv: 3, ok: false, md: "Ein System mit mehr Unbekannten als Gleichungen hat immer unendlich viele Lösungen.", why: "Es kann unlösbar sein: $x + y = 0$ und $x + y = 1$." },
    { lv: 4, ok: true, md: "Ein **homogenes** System mit mehr Unbekannten als Gleichungen hat über $\\R$ unendlich viele Lösungen.", why: "Der Rang ist höchstens die Zahl der Gleichungen, es bleiben freie Variablen." },
    { lv: 4, ok: true, md: "$Ax = b$ ist genau dann lösbar, wenn $\\operatorname{Rang} A = \\operatorname{Rang}(A \\mid b)$.", why: "Dann liegt $b$ im Spaltenraum von $A$." },
    { lv: 4, ok: false, md: "Die Differenz zweier Lösungen von $Ax = b$ löst wieder $Ax = b$.", why: "Sie löst $Ax = 0$: $A(x - y) = b - b = 0$." },
    { lv: 4, ok: true, md: "Ist $A$ quadratisch mit $\\det A \\ne 0$, dann hat $Ax = b$ für jedes $b$ genau eine Lösung.", why: "$A$ ist invertierbar und $x = A^{-1} b$." },
    { lv: 4, ok: false, md: "Ein System mit gleich vielen Gleichungen wie Unbekannten ist immer eindeutig lösbar.", why: "Nur wenn die Determinante nicht $0$ ist." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ Linear algebra: coordinates and change of basis
  function basis2(G) {
    for (;;) {
      const b1 = [G.int(-2, 3), G.int(-2, 3)], b2 = [G.int(-2, 3), G.int(-2, 3)];
      const det = b1[0] * b2[1] - b1[1] * b2[0];
      if (Math.abs(det) === 1) return [b1, b2];
    }
  }
  gen("la-koordinaten", "Koordinaten und Basiswechsel", {
    1: [(level, G) => {
      const [b1, b2] = basis2(G), c1 = G.int(-3, 3), c2 = G.int(-3, 3);
      const v = [c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]];
      const col = (u) => "\\begin{pmatrix} " + u[0] + " \\\\ " + u[1] + " \\end{pmatrix}";
      return { type: "cloze",
        md: "Basis $b_1 = " + col(b1) + "$, $b_2 = " + col(b2) + "$. Schreibe $v = " + col(v) + "$ als Linearkombination:\n\n$v =$ {{0}} $\\cdot b_1 +$ {{1}} $\\cdot b_2$",
        blanks: [{ accept: [c1], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }, { accept: [c2], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }],
        hint: "Löse das Gleichungssystem $c_1 b_1 + c_2 b_2 = v$ in beiden Komponenten.",
        explain: "$" + c1 + " \\cdot " + col(b1) + " + " + c2 + " \\cdot " + col(b2) + " = " + col(v) + "$. Die Koordinaten von $v$ bezüglich $B$ sind $(" + c1 + ", " + c2 + ")$." };
    }],
    2: [(level, G) => {
      const [b1, b2] = basis2(G);
      const T = [[b1[0], b2[0]], [b1[1], b2[1]]], Tt = [[b1[0], b1[1]], [b2[0], b2[1]]];
      const det = b1[0] * b2[1] - b1[1] * b2[0];
      const inv = [[b2[1] / det, -b2[0] / det], [-b1[1] / det, b1[0] / det]];
      const opts = [{ md: "$" + pm(T) + "$", correct: true }, { md: "$" + pm(Tt) + "$", why: "Das sind die Basisvektoren als Zeilen. Sie gehören in die Spalten." },
        { md: "$" + pm(inv) + "$", why: "Das ist die Inverse: Sie rechnet umgekehrt Standardkoordinaten in $B$-Koordinaten um." }];
      const seen = new Set();
      const uniq = opts.filter((o) => (seen.has(o.md) ? false : seen.add(o.md)));
      if (uniq.length < 3) uniq.push({ md: "$" + pm([[b1[0] + b2[0], 0], [0, b1[1] + b2[1]]]) + "$", why: "Die Spalten müssen die Basisvektoren selbst sein." });
      return { type: "choice", md: "$B = (b_1, b_2)$ mit $b_1 = (" + b1.join(", ") + ")$ und $b_2 = (" + b2.join(", ") + ")$. Welche Matrix $T$ rechnet $B$-Koordinaten $(c_1, c_2)$ in Standardkoordinaten um, also $T \\binom{c_1}{c_2} = c_1 b_1 + c_2 b_2$?",
        options: uniq, explain: "Die Spalten von $T$ sind die Bilder der Koordinatenvektoren $(1, 0)$ und $(0, 1)$, also $b_1$ und $b_2$ selbst." };
    }],
    3: [(level, G) => {
      const v = [G.int(-4, 5), G.int(-4, 5), G.int(-4, 5)];
      const c3 = v[2], c2 = v[1] - v[2], c1 = v[0] - v[1];
      return { type: "cloze",
        md: "Basis $b_1 = (1, 0, 0)$, $b_2 = (1, 1, 0)$, $b_3 = (1, 1, 1)$. Bestimme die Koordinaten von $v = (" + v.join(", ") + ")$:\n\n$c_1 =$ {{0}}, $c_2 =$ {{1}}, $c_3 =$ {{2}}",
        blanks: [c1, c2, c3].map((c) => ({ accept: [c], numeric: true, tolerance: 1e-6, placeholder: "Zahl" })),
        hint: "Nur $b_3$ hat eine dritte Komponente. Fang hinten an.",
        explain: "Dritte Komponente: $c_3 = " + c3 + "$. Zweite: $c_2 + c_3 = " + v[1] + "$, also $c_2 = " + c2 + "$. Erste: $c_1 + c_2 + c_3 = " + v[0] + "$, also $c_1 = " + c1 + "$." };
    }],
  });
  LW.extend("la-koordinaten", F.statements([
    { lv: 3, ok: true, md: "Die Koordinaten eines Vektors bezüglich einer Basis sind eindeutig.", why: "Gäbe es zwei Darstellungen, wäre ihre Differenz eine nichttriviale Darstellung der Null." },
    { lv: 3, ok: false, md: "Die Koordinaten eines Vektors hängen nicht von der gewählten Basis ab.", why: "Derselbe Pfeil hat in verschiedenen Basen verschiedene Koordinaten." },
    { lv: 3, ok: true, md: "Die Spalten von $T_{B \\to E}$ sind die Basisvektoren von $B$ in Standardkoordinaten.", why: "$T$ bildet $(1, 0, \\dots)$ auf $b_1$ ab und so weiter." },
    { lv: 3, ok: true, md: "Es gilt $T_{E \\to B} = \\left(T_{B \\to E}\\right)^{-1}$.", why: "Hin und zurück umrechnen ändert nichts." },
    { lv: 4, ok: false, md: "Eine Basiswechselmatrix kann die Determinante $0$ haben.", why: "Sie ist invertierbar, weil ihre Spalten eine Basis bilden." },
    { lv: 4, ok: true, md: "Ist $A$ die Matrix einer Abbildung in Standardkoordinaten, dann beschreibt $T^{-1} A T$ dieselbe Abbildung in der Basis aus den Spalten von $T$.", why: "Erst $B$-Koordinaten in Standard umrechnen, abbilden, zurückrechnen." },
    { lv: 4, ok: false, md: "Die ähnlichen Matrizen $A$ und $T^{-1} A T$ haben verschiedene Eigenwerte.", why: "Ähnliche Matrizen haben dieselben Eigenwerte, dieselbe Determinante und dieselbe Spur." },
    { lv: 4, ok: true, md: "In einer Basis aus Eigenvektoren wird die Matrix einer diagonalisierbaren Abbildung diagonal.", why: "Jeder Basisvektor wird nur gestreckt, um seinen Eigenwert." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ Stochastics: waiting for the first success
  const TRIALS = [
    ["Du würfelst, bis die erste Sechs fällt.", 1 / 6, "\\tfrac16"],
    ["Du wirfst eine faire Münze, bis zum ersten Mal Kopf fällt.", 1 / 2, "\\tfrac12"],
    ["Eine Basketballspielerin trifft jeden Freiwurf mit Wahrscheinlichkeit $0{,}7$. Sie wirft, bis sie trifft.", 0.7, "0{,}7"],
    ["Ein Los gewinnt mit Wahrscheinlichkeit $0{,}1$. Du kaufst Lose, bis eines gewinnt.", 0.1, "0{,}1"],
    ["Ein Bauteil ist mit Wahrscheinlichkeit $0{,}2$ defekt. Du prüfst, bis du das erste defekte findest.", 0.2, "0{,}2"],
  ];
  gen("stoch-geometrisch", "Warten auf den ersten Erfolg", {
    1: [(level, G) => {
      const [story, p, pt] = G.pick(TRIALS), k = G.int(1, 6);
      const v = Math.pow(1 - p, k - 1) * p;
      return Object.assign({ type: "numeric", md: story + " Wie wahrscheinlich ist der erste Erfolg genau beim **" + k + ". Versuch**? (vier Nachkommastellen)",
        explain: "Erst $" + (k - 1) + "$ Fehlschläge, dann ein Erfolg: $(1 - " + pt + ")^{" + (k - 1) + "} \\cdot " + pt + " \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4));
    }],
    2: [(level, G) => {
      const [story, p, pt] = G.pick(TRIALS), k = G.int(2, 8);
      if (G.chance(0.5)) {
        const v = 1 - Math.pow(1 - p, k);
        return Object.assign({ type: "numeric", md: story + " Wie wahrscheinlich ist ein Erfolg **spätestens beim " + k + ". Versuch**? (vier Nachkommastellen)",
          explain: "Gegenereignis: $" + k + "$ Fehlschläge in Folge. $1 - (1 - " + pt + ")^{" + k + "} \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4));
      }
      const v = Math.pow(1 - p, k);
      return Object.assign({ type: "numeric", md: story + " Wie wahrscheinlich sind die ersten **" + k + " Versuche alle Fehlschläge**? (vier Nachkommastellen)",
        explain: "$(1 - " + pt + ")^{" + k + "} \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4));
    }],
    3: [(level, G) => {
      const [story, p, pt] = G.pick(TRIALS);
      if (G.chance(0.5)) return Object.assign({ type: "numeric", md: story + " Wie viele Versuche braucht man **im Mittel** bis zum ersten Erfolg?",
        explain: "Der Erwartungswert der geometrischen Verteilung ist $\\tfrac{1}{p} = \\tfrac{1}{" + pt + "} = " + G.tex(1 / p, 2) + "$." }, dec(G, 1 / p, 2));
      const goal = G.pick([0.5, 0.9, 0.95, 0.99]);
      let k = 1;
      while (1 - Math.pow(1 - p, k) < goal) k++;
      return num(k, "$1 - (1 - " + pt + ")^{k} \\ge " + G.tex(goal) + "$ gilt erstmals bei $k = " + k + "$: $1 - (1 - " + pt + ")^{" + k + "} \\approx " + G.tex(1 - Math.pow(1 - p, k), 4) + "$.",
        { md: story + " Ab welcher Zahl $k$ von Versuchen ist ein Erfolg mit mindestens $" + G.tex(goal * 100) + "\\,\\%$ Wahrscheinlichkeit dabei?" });
    }],
  });
  LW.extend("stoch-geometrisch", F.statements([
    { lv: 4, ok: true, md: "Die geometrische Verteilung ist gedächtnislos: $P(X > m + n \\mid X > m) = P(X > n)$.", why: "Vergangene Fehlschläge ändern die Chancen der kommenden Versuche nicht." },
    { lv: 4, ok: false, md: "Nach zehn Würfen ohne Sechs ist eine Sechs beim nächsten Wurf wahrscheinlicher.", why: "Der Würfel hat kein Gedächtnis, die Chance bleibt $\\tfrac16$. Der Irrtum heißt Spielerfehlschluss." },
    { lv: 4, ok: true, md: "Die erwartete Wartezeit bis zum ersten Erfolg ist $\\tfrac1p$.", why: "Bei $p = \\tfrac16$ also im Mittel sechs Würfe." },
    { lv: 4, ok: false, md: "Mit $p = \\tfrac16$ hat man nach sechs Würfen sicher eine Sechs.", why: "Nur mit $1 - \\left(\\tfrac56\\right)^6 \\approx 66{,}5\\,\\%$." },
    { lv: 4, ok: true, md: "$P(X = k)$ fällt mit jedem Schritt um den Faktor $1 - p$.", why: "$P(X = k + 1) = (1 - p) \\cdot P(X = k)$, daher der Name geometrisch." },
    { lv: 4, ok: false, md: "Der wahrscheinlichste Wert der Wartezeit ist ihr Erwartungswert $\\tfrac1p$.", why: "Der wahrscheinlichste Wert ist immer $k = 1$." },
    { lv: 4, ok: true, md: "Die Varianz der geometrischen Verteilung ist $\\dfrac{1 - p}{p^2}$.", why: "Bei kleinem $p$ schwankt die Wartezeit sehr stark." },
  ], { 4: ["spot", "multi", "tf"] }));

  // ================================================================ Stochastics: sums and the central limit theorem
  gen("stoch-zgws", "Summen und Mittelwerte", {
    1: [(level, G) => {
      const n = G.int(2, 20);
      return Object.assign(num(3.5 * n, "Erwartungswerte addieren sich: $" + n + " \\cdot 3{,}5 = " + G.tex(3.5 * n, 1) + "$.", { md: "Du wirfst $" + n + "$ faire Würfel. Welchen Erwartungswert hat die Augensumme?" }), { tolerance: 0.01 });
    }],
    2: [(level, G) => {
      const n = G.pick([2, 4, 10, 25, 50, 100]);
      if (G.chance(0.5)) {
        const s = Math.sqrt((35 / 12) * n);
        return Object.assign({ type: "numeric", md: "Ein Würfel hat die Varianz $\\tfrac{35}{12}$. Wie groß ist die Standardabweichung der Augensumme von $" + n + "$ Würfeln? (vier Nachkommastellen)",
          explain: "Bei unabhängigen Summanden addieren sich die Varianzen: $" + n + " \\cdot \\tfrac{35}{12}$, also $\\sigma = \\sqrt{" + G.tex((35 / 12) * n, 4) + "} \\approx " + G.tex(s, 4) + "$." }, dec(G, s, 4));
      }
      const s = Math.sqrt(35 / 12) / Math.sqrt(n);
      return Object.assign({ type: "numeric", md: "Wie groß ist die Standardabweichung des **Mittelwerts** aus $" + n + "$ Würfen eines Würfels? ($\\sigma_{\\text{Würfel}} \\approx 1{,}7078$, vier Nachkommastellen)",
        explain: "$\\tfrac{\\sigma}{\\sqrt n} = \\tfrac{1{,}7078}{\\sqrt{" + n + "}} \\approx " + G.tex(s, 4) + "$." }, dec(G, s, 4));
    }],
    3: [(level, G) => {
      const sigma = G.pick([2, 3, 4, 5, 8, 10]), d = G.pick([0.5, 1, 2]);
      const n = Math.ceil(Math.pow(sigma / d, 2) - 1e-9);
      return num(n, "$\\tfrac{" + sigma + "}{\\sqrt n} \\le " + G.tex(d) + " \\iff n \\ge \\left(\\tfrac{" + sigma + "}{" + G.tex(d) + "}\\right)^2 = " + G.tex(Math.pow(sigma / d, 2), 2) + "$, also $n = " + n + "$.",
        { md: "Ein Messgerät streut mit Standardabweichung $" + sigma + "$. Wie viele Messungen muss man mindestens mitteln, damit der Mittelwert nur noch mit Standardabweichung $" + G.tex(d) + "$ streut?" });
    }],
  });
  LW.extend("stoch-zgws", F.statements([
    { lv: 3, ok: true, md: "Die Summe vieler unabhängiger, gleich verteilter Zufallsgrößen mit endlicher Varianz ist näherungsweise normalverteilt.", why: "Das ist der zentrale Grenzwertsatz." },
    { lv: 3, ok: false, md: "Der zentrale Grenzwertsatz besagt, dass jede einzelne Zufallsgröße normalverteilt ist.", why: "Er sagt etwas über Summen und Mittelwerte vieler Zufallsgrößen." },
    { lv: 3, ok: true, md: "Die Standardabweichung des Mittelwerts aus $n$ Messungen schrumpft wie $\\tfrac{1}{\\sqrt n}$.", why: "Varianz des Mittelwerts: $\\tfrac{\\sigma^2}{n}$." },
    { lv: 4, ok: false, md: "Für den zentralen Grenzwertsatz müssen die Summanden selbst normalverteilt sein.", why: "Sie dürfen fast beliebig verteilt sein, etwa gleichverteilt wie ein Würfel." },
    { lv: 4, ok: true, md: "Dass $B(n; p)$ für großes $n$ glockenförmig wird, ist ein Spezialfall des zentralen Grenzwertsatzes.", why: "Eine binomialverteilte Größe ist eine Summe von $n$ Bernoulli-Größen." },
    { lv: 4, ok: false, md: "Verdoppelt man $n$, halbiert sich die Standardabweichung des Mittelwerts.", why: "Sie sinkt um den Faktor $\\tfrac{1}{\\sqrt 2} \\approx 0{,}71$. Für die Hälfte braucht man das Vierfache." },
    { lv: 4, ok: false, md: "Der Mittelwert aus $1\\,000$ Würfen eines Würfels ist genau $3{,}5$.", why: "Er schwankt um $3{,}5$, mit Standardabweichung etwa $0{,}054$." },
    { lv: 4, ok: true, md: "Nach der $2\\sigma$-Regel liegt eine Summe vieler Würfe in rund $95\\,\\%$ der Fälle im Intervall $\\mu \\pm 2\\sigma$.", why: "Weil die Summe näherungsweise normalverteilt ist." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ CS50 AI: overfitting
  const OVER = "Überanpassung", UNDER = "Unteranpassung", GOOD = "gute Anpassung";
  gen("cs-overfitting", "Überanpassung", {
    1: [(level, G) => {
      const kind = G.pick([OVER, UNDER, GOOD]);
      let tr, te;
      if (kind === OVER) { tr = G.int(0, 4); te = tr + G.int(15, 35); }
      else if (kind === UNDER) { tr = G.int(22, 35); te = tr + G.int(0, 4); }
      else { tr = G.int(3, 8); te = tr + G.int(0, 3); }
      const why = kind === OVER ? "Auf den Trainingsdaten fast fehlerfrei, auf neuen Daten viel schlechter: Das Modell hat Zufälligkeiten auswendig gelernt." :
        kind === UNDER ? "Schon auf den Trainingsdaten schlecht: Das Modell ist zu einfach für das Muster." : "Niedriger Fehler auf beiden und kaum Abstand: Das Modell verallgemeinert.";
      return { type: "choice", md: "Ein Modell hat auf den Trainingsdaten $" + tr + "\\,\\%$ Fehler, auf zurückgehaltenen Testdaten $" + te + "\\,\\%$. Was liegt vor?",
        options: [OVER, UNDER, GOOD].map((o) => ({ md: o, correct: o === kind, why: o === kind ? null : why })), explain: why };
    }],
    2: [(level, G) => {
      const y = [G.int(1, 9), G.int(1, 9), G.int(1, 9), G.int(1, 9)], h = y.map((v) => v + G.pick([-2, -1, 0, 1, 2, 3]));
      const L1 = y.reduce((s, v, i) => s + Math.abs(v - h[i]), 0);
      const row = (a) => a.map((v) => "$" + v + "$").join(" | ");
      return num(L1, "Beträge der Abweichungen: " + y.map((v, i) => Math.abs(v - h[i])).join(" + ") + " = " + L1 + ".",
        { md: "Wahre Werte und Vorhersagen:\n\n| wahr | " + row(y) + " |\n|---|---|---|---|---|\n| vorhergesagt | " + row(h) + " |\n\nWie groß ist der **L1-Verlust** $\\sum \\abs{y - \\hat y}$?" });
    }],
    3: [(level, G) => {
      const y = [G.int(1, 9), G.int(1, 9), G.int(1, 9), G.int(1, 9)], h = y.map((v) => v + G.pick([-3, -1, 0, 1, 2]));
      const L2 = y.reduce((s, v, i) => s + (v - h[i]) ** 2, 0);
      const row = (a) => a.map((v) => "$" + v + "$").join(" | ");
      return num(L2, "Quadrate der Abweichungen: " + y.map((v, i) => (v - h[i]) ** 2).join(" + ") + " = " + L2 + ". Große Fehler zählen überproportional.",
        { md: "| wahr | " + row(y) + " |\n|---|---|---|---|---|\n| vorhergesagt | " + row(h) + " |\n\nWie groß ist der **L2-Verlust** $\\sum (y - \\hat y)^2$?" });
    }],
    4: [(level, G) => {
      const lam = G.pick([0.5, 1, 2, 4]), lossA = G.int(2, 6), compA = G.int(1, 3), lossB = G.int(0, 2), compB = G.int(4, 9);
      const costA = lossA + lam * compA, costB = lossB + lam * compB;
      const right = costA < costB ? "Modell A" : costB < costA ? "Modell B" : "beide gleich";
      const why = "Kosten = Verlust + $\\lambda \\cdot$ Komplexität: A: $" + lossA + " + " + G.tex(lam) + " \\cdot " + compA + " = " + G.tex(costA) + "$, B: $" + lossB + " + " + G.tex(lam) + " \\cdot " + compB + " = " + G.tex(costB) + "$.";
      return { type: "choice", md: "Mit Regularisierung ($\\lambda = " + G.tex(lam) + "$) wählt man das Modell mit den kleinsten Kosten Verlust $+ \\lambda \\cdot$ Komplexität. Modell A: Verlust $" + lossA + "$, Komplexität $" + compA + "$. Modell B: Verlust $" + lossB + "$, Komplexität $" + compB + "$. Welches wird gewählt?",
        options: ["Modell A", "Modell B", "beide gleich"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
  });
  LW.extend("cs-overfitting", F.statements([
    { lv: 1, ok: true, md: "Ein Modell ist überangepasst, wenn es die Trainingsdaten sehr gut, neue Daten aber schlecht vorhersagt.", why: "Es hat Zufälligkeiten der Trainingsdaten mitgelernt." },
    { lv: 1, ok: false, md: "Null Fehler auf den Trainingsdaten zeigt, dass das Modell gut verallgemeinert.", why: "Gerade das kann Überanpassung sein. Aussagekräftig ist der Fehler auf neuen Daten." },
    { lv: 1, ok: true, md: "Testdaten dürfen beim Training nicht verwendet werden.", why: "Sonst misst der Test nicht mehr, wie das Modell mit Unbekanntem umgeht." },
    { lv: 2, ok: true, md: "Bei k-Nearest-Neighbors mit $k = 1$ folgt die Vorhersage jedem einzelnen Ausreißer.", why: "Ein einziger Nachbar entscheidet, auch wenn er falsch etikettiert ist." },
    { lv: 2, ok: false, md: "Mehr Parameter schützen ein Modell vor Überanpassung.", why: "Mehr Parameter erlauben eher, Rauschen auswendig zu lernen." },
    { lv: 2, ok: true, md: "Mehr Trainingsdaten verringern meist die Gefahr der Überanpassung.", why: "Zufälligkeiten mitteln sich heraus, das Muster bleibt." },
    { lv: 3, ok: true, md: "Bei der Kreuzvalidierung dient jeder Teil der Daten abwechselnd als Testmenge.", why: "So wird jede Messung einmal zum Prüfen benutzt." },
    { lv: 3, ok: false, md: "L1- und L2-Verlust bestrafen große Fehler gleich stark.", why: "L2 quadriert: Ein Fehler von $4$ zählt $16$-mal so viel wie ein Fehler von $1$." },
    { lv: 3, ok: true, md: "Ein zu einfaches Modell übersieht Muster, man spricht von Unteranpassung.", why: "Etwa eine Gerade für Daten, die einer Kurve folgen." },
    { lv: 4, ok: false, md: "Wer mit den Testdaten das beste Modell auswählt und mit denselben Daten bewertet, bekommt eine faire Schätzung.", why: "Die Auswahl ist auf diese Daten zugeschnitten. Dafür braucht man eine eigene Validierungsmenge." },
    { lv: 4, ok: true, md: "Die Stärke $\\lambda$ der Regularisierung regelt den Kompromiss zwischen Fehler und Einfachheit.", why: "Großes $\\lambda$ bevorzugt einfache Modelle, kleines passt sich den Daten enger an." },
    { lv: 4, ok: false, md: "Dropout wird auch bei der Vorhersage eingesetzt, damit die Antworten zufällig bleiben.", why: "Dropout wirkt nur beim Training. Bei der Vorhersage arbeiten alle Neuronen." },
  ], STMT));
  LW.extend("cs-overfitting", F.pairs([
    { lv: 1, a: "Überanpassung", b: "Lernt das Rauschen der Trainingsdaten mit" },
    { lv: 1, a: "Unteranpassung", b: "Zu einfaches Modell, übersieht Muster" },
    { lv: 1, a: "Testdaten", b: "Zurückgehaltene Daten zur Bewertung" },
    { lv: 2, a: "Regularisierung", b: "Strafterm für komplizierte Modelle" },
    { lv: 2, a: "Kreuzvalidierung", b: "Daten abwechselnd zum Trainieren und Prüfen teilen" },
    { lv: 3, a: "L2-Verlust", b: "Summe der quadrierten Abweichungen" },
    { lv: 3, a: "0-1-Verlust", b: "Zählt nur falsche Vorhersagen" },
  ], PAIR));

  // ================================================================ CS50 AI: attention and transformers
  gen("cs-transformer", "Attention und Transformer", {
    1: [(level, G) => {
      const w = G.pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.7, 0.2, 0.1], [0.4, 0.4, 0.2], [0.25, 0.25, 0.5]]), v = [G.int(-3, 6), G.int(-3, 6), G.int(-3, 6)];
      const out = w.reduce((s, x, i) => s + x * v[i], 0);
      return Object.assign({ type: "numeric", md: "Ein Wort verteilt seine Aufmerksamkeit mit den Gewichten $" + w.map((x) => G.tex(x)).join(", ") + "$ auf drei Wörter. Deren Werte (eine Komponente der Value-Vektoren) sind $" + v.join(", ") + "$. Welche Komponente hat die Ausgabe?",
        explain: "Gewichteter Mittelwert: $" + w.map((x, i) => G.tex(x) + " \\cdot " + (v[i] < 0 ? "(" + v[i] + ")" : v[i])).join(" + ") + " = " + G.tex(out, 2) + "$." }, dec(G, out, 2));
    }],
    2: [(level, G) => {
      const s = [G.int(0, 3), G.int(0, 3), G.int(0, 3)];
      const ex = s.map(Math.exp), sum = ex.reduce((a, b) => a + b, 0), w0 = ex[0] / sum;
      return Object.assign({ type: "numeric", md: "Drei Punktzahlen (Skalarprodukte von Query und Keys): $" + s.join(", ") + "$. Welches Gewicht bekommt das **erste** Wort nach der Softmax? (vier Nachkommastellen)",
        explain: "$\\tfrac{e^{" + s[0] + "}}{e^{" + s[0] + "} + e^{" + s[1] + "} + e^{" + s[2] + "}} \\approx \\tfrac{" + G.tex(ex[0], 3) + "}{" + G.tex(sum, 3) + "} \\approx " + G.tex(w0, 4) + "$. Alle Gewichte zusammen ergeben $1$." }, dec(G, w0, 4));
    }],
    3: [(level, G) => {
      const q = [G.int(-2, 3), G.int(-2, 3), G.int(-2, 3), G.int(-2, 3)], k = [G.int(-2, 3), G.int(-2, 3), G.int(-2, 3), G.int(-2, 3)];
      const dot = q.reduce((a, x, i) => a + x * k[i], 0), val = dot / 2;
      return Object.assign({ type: "numeric", md: "Query $q = (" + q.join(", ") + ")$, Key $k = (" + k.join(", ") + ")$, Dimension $d = 4$. Wie groß ist die skalierte Punktzahl $\\dfrac{q \\cdot k}{\\sqrt d}$?",
        explain: "$q \\cdot k = " + q.map((x, i) => (x < 0 ? "(" + x + ")" : x) + " \\cdot " + (k[i] < 0 ? "(" + k[i] + ")" : k[i])).join(" + ") + " = " + dot + "$, geteilt durch $\\sqrt 4 = 2$: $" + G.tex(val, 1) + "$." }, dec(G, val, 2));
    }],
  });
  LW.extend("cs-transformer", F.statements([
    { lv: 1, ok: true, md: "Ein Transformer verarbeitet alle Wörter eines Textes gleichzeitig statt nacheinander.", why: "Das macht ihn schnell trainierbar auf großen Rechnern." },
    { lv: 1, ok: true, md: "Self-Attention bestimmt für jedes Wort, wie wichtig die anderen Wörter für es sind.", why: "Daraus entsteht eine Mischung der anderen Wörter, gewichtet nach Bedeutung." },
    { lv: 2, ok: false, md: "Die Attention-Gewichte eines Wortes können sich zu mehr als $1$ aufsummieren.", why: "Die Softmax macht daraus Gewichte, die zusammen genau $1$ ergeben." },
    { lv: 2, ok: true, md: "Weil Attention selbst keine Reihenfolge kennt, fügt man Positionskodierungen hinzu.", why: "Sonst wäre »Hund beißt Mann« dasselbe wie »Mann beißt Hund«." },
    { lv: 2, ok: false, md: "Ein Sprachmodell findet das nächste Wort, indem es den Satz im Internet nachschlägt.", why: "Es berechnet aus seinen Gewichten eine Wahrscheinlichkeitsverteilung über mögliche nächste Wörter." },
    { lv: 3, ok: true, md: "Query, Key und Value entstehen durch drei gelernte lineare Abbildungen aus denselben Wortvektoren.", why: "Ein Wort fragt mit der Query, wird über den Key gefunden und gibt seinen Value weiter." },
    { lv: 3, ok: true, md: "Mehrere Attention-Köpfe können verschiedene Beziehungen erfassen, etwa Bezüge von Pronomen oder den Satzbau.", why: "Jeder Kopf hat eigene Projektionen." },
    { lv: 3, ok: false, md: "Ein Transformer braucht für jede Position im Satz eine eigene, getrennt trainierte Gewichtsmatrix.", why: "Dieselben Gewichte gelten für alle Positionen, nur die Positionskodierung unterscheidet sie." },
    { lv: 4, ok: true, md: "Die Skalarprodukte werden durch $\\sqrt d$ geteilt, damit die Softmax nicht zu spitz wird.", why: "Bei großer Dimension würden die Punktzahlen sonst sehr groß und fast alles Gewicht auf ein Wort fallen." },
    { lv: 4, ok: false, md: "Rekurrente Netze sind schneller als Transformer, weil sie alle Wörter parallel verarbeiten.", why: "Umgekehrt: Rekurrente Netze rechnen Wort für Wort, Transformer parallel." },
    { lv: 4, ok: true, md: "Der ursprüngliche Transformer von 2017 bestand aus Encoder und Decoder und war für Übersetzungen gedacht.", why: "Der Artikel hieß »Attention Is All You Need«." },
  ], STMT));
  LW.extend("cs-transformer", F.pairs([
    { lv: 1, a: "Query", b: "Wonach ein Wort sucht" },
    { lv: 1, a: "Key", b: "Woran ein Wort gefunden wird" },
    { lv: 1, a: "Value", b: "Was ein Wort weitergibt" },
    { lv: 2, a: "Softmax", b: "Macht aus Punktzahlen Gewichte mit Summe $1$" },
    { lv: 2, a: "Positionskodierung", b: "Bringt die Reihenfolge der Wörter hinein" },
    { lv: 3, a: "Attention-Kopf", b: "Eigene Projektionen für eine Art von Beziehung" },
  ], PAIR));

  // ================================================================ Economics: game theory
  function game(G) {
    // payoffs [row][col] = [A, B]
    return [[[G.int(0, 9), G.int(0, 9)], [G.int(0, 9), G.int(0, 9)]], [[G.int(0, 9), G.int(0, 9)], [G.int(0, 9), G.int(0, 9)]]];
  }
  const ROWS = ["oben", "unten"], COLS = ["links", "rechts"];
  function gameTable(P) {
    return "| | **links** | **rechts** |\n|---|---|---|\n| **oben** | $(" + P[0][0].join(", ") + ")$ | $(" + P[0][1].join(", ") + ")$ |\n| **unten** | $(" + P[1][0].join(", ") + ")$ | $(" + P[1][1].join(", ") + ")$ |";
  }
  function nash(P) {
    const out = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      if (P[r][c][0] >= P[1 - r][c][0] && P[r][c][1] >= P[r][1 - c][1]) out.push([r, c]);
    }
    return out;
  }
  gen("oek-spiele", "Spieltheorie", {
    1: [(level, G) => {
      let P, dom;
      for (let t = 0; t < 30; t++) {
        P = game(G);
        const up = P[0][0][0] > P[1][0][0] && P[0][1][0] > P[1][1][0], down = P[1][0][0] > P[0][0][0] && P[1][1][0] > P[0][1][0];
        dom = up ? "oben" : down ? "unten" : "keine";
        if (G.chance(0.3) || dom !== "keine") break;
      }
      const why = "Vergleiche Spalte für Spalte die ersten Zahlen (Auszahlungen von A): links $" + P[0][0][0] + "$ gegen $" + P[1][0][0] + "$, rechts $" + P[0][1][0] + "$ gegen $" + P[1][1][0] + "$. Dominant ist eine Zeile nur, wenn sie in beiden Spalten mehr bringt.";
      return { type: "choice", md: "Spieler A wählt die Zeile, Spieler B die Spalte. In jedem Feld steht (Auszahlung A, Auszahlung B).\n\n" + gameTable(P) + "\n\nHat A eine **streng dominante Strategie**?",
        options: [{ md: "ja, oben" }, { md: "ja, unten" }, { md: "nein, keine" }].map((o) => Object.assign(o, { correct: o.md.endsWith(dom), why: o.md.endsWith(dom) ? null : why })), explain: why };
    }],
    2: [(level, G) => {
      let P, ne;
      do { P = game(G); ne = nash(P); } while (!ne.length);
      const opts = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const is = ne.some(([a, b]) => a === r && b === c);
        opts.push({ md: ROWS[r] + ", " + COLS[c], correct: is, why: is ? null : (P[r][c][0] < P[1 - r][c][0] ? "A würde zu »" + ROWS[1 - r] + "« wechseln." : "B würde zu »" + COLS[1 - c] + "« wechseln.") });
      }
      return { type: "multi", md: "In jedem Feld steht (Auszahlung A, Auszahlung B); A wählt die Zeile, B die Spalte.\n\n" + gameTable(P) + "\n\nWelche Felder sind **Nash-Gleichgewichte**?",
        options: opts, explain: "Ein Feld ist ein Nash-Gleichgewicht, wenn keiner allein durch Wechsel gewinnt. Hier: " + ne.map(([r, c]) => "»" + ROWS[r] + ", " + COLS[c] + "«").join(" und ") + "." };
    }],
    3: [(level, G) => {
      const S = G.int(0, 2), P0 = S + G.int(1, 2), R = P0 + G.int(1, 3), T = R + G.int(1, 3);
      const M = [[[R, R], [S, T]], [[T, S], [P0, P0]]];
      const tbl = "| | **schweigen** | **gestehen** |\n|---|---|---|\n| **schweigen** | $(" + M[0][0].join(", ") + ")$ | $(" + M[0][1].join(", ") + ")$ |\n| **gestehen** | $(" + M[1][0].join(", ") + ")$ | $(" + M[1][1].join(", ") + ")$ |";
      const claimTrue = G.chance(0.5);
      return { type: "truefalse", md: "Zwei Verdächtige, Auszahlungen als Punkte (mehr ist besser):\n\n" + tbl + "\n\n" + (claimTrue
          ? "Im Gleichgewicht gestehen beide, obwohl beidseitiges Schweigen für jeden besser wäre."
          : "Weil beidseitiges Schweigen für beide besser ist, schweigen rationale Spieler im Gleichgewicht."),
        answer: claimTrue, whyNot: "Gestehen bringt jedem mehr, egal was der andere tut ($" + T + " > " + R + "$ und $" + P0 + " > " + S + "$). Also gestehen beide und erhalten je $" + P0 + "$ statt $" + R + "$.",
        explain: "Gestehen ist für beide dominant: $" + T + " > " + R + "$ und $" + P0 + " > " + S + "$. Das Gleichgewicht $(" + P0 + ", " + P0 + ")$ ist für beide schlechter als $(" + R + ", " + R + ")$. Das ist das Gefangenendilemma." };
    }],
  });
  LW.extend("oek-spiele", F.statements([
    { lv: 1, ok: true, md: "Im Gefangenendilemma ist Gestehen für beide eine dominante Strategie.", why: "Es lohnt sich, egal was der andere tut." },
    { lv: 1, ok: true, md: "In einem Nash-Gleichgewicht kann sich niemand verbessern, indem er allein seine Strategie wechselt.", why: "Jeder spielt eine beste Antwort auf die Strategie des anderen." },
    { lv: 2, ok: false, md: "Ein Nash-Gleichgewicht ist immer das für alle beste Ergebnis.", why: "Im Gefangenendilemma ist das Gleichgewicht für beide schlechter als gemeinsames Schweigen." },
    { lv: 2, ok: true, md: "Kartelle sind instabil, weil jedes Mitglied einen Anreiz hat, heimlich mehr zu verkaufen.", why: "Das ist dieselbe Struktur wie im Gefangenendilemma." },
    { lv: 3, ok: false, md: "Jedes Spiel hat genau ein Nash-Gleichgewicht in reinen Strategien.", why: "Manche haben keins (Elfmeter), Koordinationsspiele haben zwei." },
    { lv: 3, ok: true, md: "Wird ein Spiel unbegrenzt oft wiederholt, kann Kooperation stabil werden, etwa mit »Wie du mir, so ich dir«.", why: "Abweichen wird in späteren Runden bestraft." },
    { lv: 3, ok: false, md: "Eine dominante Strategie ist die beste Antwort auf eine bestimmte Strategie des Gegners.", why: "Sie ist die beste Antwort auf jede Strategie des Gegners." },
    { lv: 4, ok: true, md: "Beim Elfmeter gibt es kein Gleichgewicht in reinen Strategien; man muss die Ecke zufällig wählen.", why: "Jede vorhersehbare Wahl lässt sich ausnutzen." },
    { lv: 4, ok: true, md: "John Nash zeigte, dass jedes endliche Spiel ein Gleichgewicht in gemischten Strategien hat.", why: "Dafür erhielt er 1994 den Wirtschaftsnobelpreis." },
    { lv: 4, ok: false, md: "Im Cournot-Duopol bieten die Firmen im Gleichgewicht zusammen genau die Monopolmenge an.", why: "Sie bieten mehr als ein Monopolist und weniger als bei vollkommenem Wettbewerb." },
  ], STMT));
  LW.extend("oek-spiele", F.pairs([
    { lv: 1, a: "Gefangenendilemma", b: "Beide gestehen, obwohl Schweigen für beide besser wäre" },
    { lv: 1, a: "Nash-Gleichgewicht", b: "Niemand gewinnt durch alleiniges Abweichen" },
    { lv: 1, a: "Dominante Strategie", b: "Beste Antwort auf alles, was der andere tut" },
    { lv: 2, a: "Koordinationsspiel", b: "Zwei Gleichgewichte, man muss sich abstimmen" },
    { lv: 3, a: "Wie du mir, so ich dir", b: "Tun, was der andere in der letzten Runde tat" },
    { lv: 3, a: "Kartell", b: "Absprache, die Menge zu begrenzen" },
  ], PAIR));

  // ================================================================ Economics: labour market
  function labour(G) {
    const L = G.int(3, 8), w = G.int(8, 14), b = G.pick([1, 2]), d = G.pick([1, 2]);
    return { L, w, a: w + b * L, b, c: w - d * L, d };
  }
  const lin = (a, m) => a + (m > 0 ? " + " + (m === 1 ? "" : m) : " - " + (m === -1 ? "" : -m)) + "L";
  gen("oek-arbeitsmarkt", "Arbeitsmarkt", {
    1: [(level, G) => {
      const M = labour(G);
      return num(M.w, "Gleichsetzen: $" + lin(M.a, -M.b) + " = " + lin(M.c, M.d) + "$ ergibt $L = " + M.L + "$ und damit $w = " + M.w + "$.",
        { md: "Arbeitsnachfrage $w = " + lin(M.a, -M.b) + "$, Arbeitsangebot $w = " + lin(M.c, M.d) + "$ ($w$ Lohn in Euro, $L$ Arbeit in Millionen Stunden). Welcher Lohn stellt sich im Gleichgewicht ein?" });
    }],
    2: [(level, G) => {
      const M = labour(G), wm = M.w + G.int(1, 3);
      const Ld = (M.a - wm) / M.b, Ls = (wm - M.c) / M.d, u = Ls - Ld;
      return Object.assign({ type: "numeric", md: "Arbeitsnachfrage $w = " + lin(M.a, -M.b) + "$, Arbeitsangebot $w = " + lin(M.c, M.d) + "$. Der Staat setzt einen Mindestlohn von $" + wm + "$. Wie groß ist der Angebotsüberschuss, also die Arbeitslosigkeit in Millionen Stunden?",
        explain: "Beim Mindestlohn fragen die Betriebe $L_N = \\tfrac{" + M.a + " - " + wm + "}{" + M.b + "} = " + G.tex(Ld, 2) + "$ nach, angeboten werden $L_A = \\tfrac{" + wm + " - " + (M.c < 0 ? "(" + M.c + ")" : M.c) + "}{" + M.d + "} = " + G.tex(Ls, 2) + "$. Differenz: $" + G.tex(u, 2) + "$." }, dec(G, u, 2));
    }],
    3: [(level, G) => {
      const M = labour(G), wm = M.w - G.int(1, 3);
      return { type: "truefalse", md: "Gleichgewichtslohn $" + M.w + "$ Euro. Ein Mindestlohn von $" + wm + "$ Euro senkt im einfachen Marktmodell die Beschäftigung.", answer: false,
        whyNot: "Er liegt unter dem Gleichgewichtslohn und bindet nicht. Der Markt bleibt bei $" + M.w + "$ Euro.", explain: "Ein Mindestlohn wirkt nur, wenn er über dem Gleichgewichtslohn liegt." };
    }],
  });
  LW.extend("oek-arbeitsmarkt", F.statements([
    { lv: 1, ok: true, md: "Liegt ein Mindestlohn über dem Gleichgewichtslohn, sinkt im einfachen Marktmodell die Beschäftigung.", why: "Betriebe fragen bei höherem Lohn weniger Arbeit nach." },
    { lv: 1, ok: true, md: "Die Arbeitsnachfrage kommt von den Unternehmen, das Arbeitsangebot von den Haushalten.", why: "Auf dem Arbeitsmarkt sind die Rollen gegenüber dem Gütermarkt vertauscht." },
    { lv: 2, ok: false, md: "Steigt die Produktivität der Arbeit, verschiebt sich die Arbeitsnachfrage nach links.", why: "Nach rechts: Jede Stunde bringt mehr ein, also lohnt sie sich bei jedem Lohn eher." },
    { lv: 2, ok: true, md: "In Deutschland gilt seit 2015 ein gesetzlicher Mindestlohn.", why: "Er wird regelmäßig auf Vorschlag einer Kommission angepasst." },
    { lv: 3, ok: true, md: "Beherrscht ein Arbeitgeber den Markt (Monopson), kann ein Mindestlohn die Beschäftigung sogar erhöhen.", why: "Der Monopsonist hält Löhne und Beschäftigung künstlich niedrig; ein Mindestlohn kann das aufbrechen." },
    { lv: 3, ok: false, md: "Friktionelle Arbeitslosigkeit entsteht, weil die Gesamtnachfrage in einer Rezession sinkt.", why: "Das ist konjunkturelle Arbeitslosigkeit. Friktionelle entsteht bei der Suche nach einer passenden Stelle." },
    { lv: 3, ok: true, md: "Strukturelle Arbeitslosigkeit entsteht, wenn Qualifikationen und offene Stellen nicht zusammenpassen.", why: "Etwa wenn eine Branche schrumpft und eine andere wächst." },
    { lv: 4, ok: false, md: "Card und Krueger fanden nach einer Mindestlohnerhöhung in New Jersey einen starken Rückgang der Beschäftigung.", why: "Sie fanden im Vergleich mit Pennsylvania keinen Rückgang in Fast-Food-Restaurants." },
    { lv: 4, ok: true, md: "Je elastischer die Arbeitsnachfrage, desto mehr Stellen kostet ein bindender Mindestlohn.", why: "Betriebe weichen dann stärker auf Maschinen oder andere Standorte aus." },
  ], STMT));
  const FRIK = "friktionell", STRUK = "strukturell", KONJ = "konjunkturell";
  LW.extend("oek-arbeitsmarkt", F.groups([
    { lv: 1, md: "Eine Ingenieurin kündigt und sucht drei Monate eine passende Stelle.", cat: FRIK, why: "Suche zwischen zwei Stellen: friktionell." },
    { lv: 1, md: "In einer Rezession entlassen viele Betriebe gleichzeitig.", cat: KONJ, why: "Die Nachfrage fehlt: konjunkturell." },
    { lv: 1, md: "Bergleute verlieren ihre Arbeit, weil Zechen schließen, und finden in neuen Branchen keinen Anschluss.", cat: STRUK, why: "Qualifikation und Stellen passen nicht: strukturell." },
    { lv: 2, md: "Absolventinnen suchen nach dem Studium ihren ersten Job.", cat: FRIK, why: "Übergangssuche: friktionell." },
    { lv: 2, md: "Durch Selbstbedienungskassen fallen Arbeitsplätze im Handel weg.", cat: STRUK, why: "Technischer Wandel verändert die Nachfrage nach Fähigkeiten: strukturell." },
    { lv: 2, md: "Nach einem Einbruch der Exporte melden Firmen Kurzarbeit an.", cat: KONJ, why: "Folge eines Nachfrageeinbruchs: konjunkturell." },
  ], { 1: ["choice"], 2: ["sort", "choice"] }, { cats: [FRIK, STRUK, KONJ], ask: (md) => md + " Welche Art von Arbeitslosigkeit ist das?", sort: "Ordne die Fälle der Art der Arbeitslosigkeit zu.", n: 5 }));

  // ================================================================ Ethnology: forms of economy
  const WB = "Wildbeuter", HIRT = "Pastoralismus", GART = "Gartenbau", ACK = "Ackerbau";
  // the generator's own tasks are the sorting tasks; statements and term pairs come on top via LW.extend
  gen("eth-wirtschaft", "Wirtschaftsformen", F.groups([
    { lv: 1, md: "Die Ju/'hoansi in der Kalahari sammeln Mongongo-Nüsse und jagen.", cat: WB, why: "Jagen und Sammeln: Wildbeuter." },
    { lv: 1, md: "Inuit jagen Robben und Wale.", cat: WB, why: "Jagd ohne Anbau: Wildbeuter." },
    { lv: 1, md: "Die Nuer ziehen mit ihren Rinderherden zwischen Lagern der Trocken- und der Regenzeit.", cat: HIRT, why: "Leben von Herden: Pastoralismus." },
    { lv: 1, md: "Familien in der Mongolei wandern mit Schafen, Ziegen und Pferden.", cat: HIRT, why: "Mobile Tierhaltung: Pastoralismus." },
    { lv: 1, md: "Auf den Trobriand-Inseln wird Yams in Gärten angebaut, die nach einigen Jahren brachliegen.", cat: GART, why: "Anbau mit Hacke und Brache: Gartenbau." },
    { lv: 2, md: "Im Regenwald wird eine Fläche gerodet, verbrannt und einige Jahre bepflanzt.", cat: GART, why: "Brandrodungsfeldbau gehört zum Gartenbau." },
    { lv: 2, md: "Reis wächst auf bewässerten Terrassen, die mit Zugtieren gepflügt werden.", cat: ACK, why: "Dauerfelder mit Pflug und Bewässerung: Ackerbau." },
    { lv: 2, md: "Dörfer bestellen dauerhaft dieselben Felder mit Pflug und Dünger und lagern Vorräte.", cat: ACK, why: "Intensive Landwirtschaft: Ackerbau." },
  ], { 1: ["choice"], 2: ["sort", "choice"], 3: ["sort"], 4: ["sort"] }, { cats: [WB, HIRT, GART, ACK], ask: (md) => md + " Welche Wirtschaftsform ist das?", sort: "Ordne jede Lebensweise ihrer Wirtschaftsform zu.", n: 5 }));
  LW.extend("eth-wirtschaft", F.statements([
    { lv: 1, ok: false, md: "Wildbeuter müssen fast ununterbrochen arbeiten, um zu überleben.", why: "Richard Lee fand bei den Ju/'hoansi oft weniger Arbeitszeit für die Nahrung als in Industriegesellschaften." },
    { lv: 2, ok: true, md: "Marshall Sahlins nannte Wildbeuter zugespitzt die »ursprüngliche Wohlstandsgesellschaft«.", why: "Wohlstand entsteht dort durch geringe Bedürfnisse, nicht durch viele Güter." },
    { lv: 2, ok: true, md: "Karl Polanyi unterscheidet Reziprozität, Redistribution und Marktaustausch.", why: "Das sind seine drei Formen, wie Wirtschaft in Gesellschaften eingebunden ist." },
    { lv: 2, ok: false, md: "Hirten und Ackerbauern leben stets völlig getrennt voneinander.", why: "Viele tauschen Fleisch, Milch und Tiere gegen Getreide." },
    { lv: 2, ok: true, md: "Beim Brandrodungsfeldbau werden Flächen nach einigen Jahren aufgegeben, damit sich der Boden erholt.", why: "Danach wird anderswo neu gerodet." },
    { lv: 3, ok: false, md: "Redistribution heißt, dass Nachbarn ohne jedes Zentrum direkt miteinander tauschen.", why: "Bei Redistribution fließen Güter zu einem Zentrum, etwa einem Häuptling, und werden von dort verteilt." },
    { lv: 3, ok: true, md: "Für Polanyi war die Wirtschaft vormoderner Gesellschaften in soziale Beziehungen eingebettet.", why: "Erst der moderne Markt löste sie als eigenen Bereich heraus." },
    { lv: 3, ok: true, md: "Die Einteilung in Wildbeuter, Hirten und Bauern ist idealtypisch; viele Gruppen kombinieren mehrere Formen.", why: "Etwa Hirten mit etwas Feldbau oder Bauern, die jagen." },
    { lv: 4, ok: true, md: "Formalisten wenden die Begriffe der Mikroökonomik auf alle Gesellschaften an, Substantivisten bestreiten das.", why: "Das war die große Debatte der Wirtschaftsethnologie in den 1960er Jahren." },
    { lv: 4, ok: false, md: "Substantivisten meinen, Menschen maximierten überall vor allem ihren Nutzen.", why: "Das ist die Position der Formalisten." },
    { lv: 4, ok: false, md: "Mit der Sesshaftigkeit nahm die Ungleichheit überall ab.", why: "Vorräte und Landbesitz machten eher neue Formen von Ungleichheit möglich." },
  ], { 1: ["tf"], 2: ["tf"], 3: ["multi"], 4: ["spot", "multi"] }));
  LW.extend("eth-wirtschaft", F.pairs([
    { lv: 1, a: "Wildbeuter", b: "Jagen, Sammeln, Fischen" },
    { lv: 1, a: "Pastoralismus", b: "Leben von Herdentieren" },
    { lv: 1, a: "Gartenbau", b: "Anbau mit Hacke, oft im Wechsel der Flächen" },
    { lv: 2, a: "Ackerbau", b: "Dauerfelder mit Pflug und Vorräten" },
    { lv: 3, a: "Redistribution", b: "Güter fließen zu einem Zentrum und werden verteilt" },
    { lv: 3, a: "Substantivismus", b: "Wirtschaft ist in soziale Beziehungen eingebettet" },
  ], { 2: ["choice"], 3: ["reverse"], 4: ["match"] }));

  // ================================================================ Ethnology: migration
  // the generator's own tasks are the statement forms; push and pull factors and term pairs come on top
  gen("eth-migration", "Migration", F.statements([
    { lv: 1, ok: true, md: "Transnationale Migranten leben ihr Leben in Bezügen zu mehreren Ländern zugleich.", why: "Sie halten Verbindungen über Grenzen hinweg, durch Besuche, Geld und Medien." },
    { lv: 1, ok: false, md: "Migranten brechen ihre Verbindungen zur Herkunftsregion in der Regel vollständig ab.", why: "Viele halten enge Kontakte, schicken Geld und reisen hin und her." },
    { lv: 1, ok: true, md: "Diaspora bezeichnet eine verstreut lebende Gruppe, die sich auf eine gemeinsame Herkunft bezieht.", why: "Etwa armenische oder libanesische Gemeinschaften weltweit." },
    { lv: 1, ok: true, md: "Push-Faktoren drängen aus der Herkunftsregion, Pull-Faktoren ziehen in eine Zielregion.", why: "Krieg wäre ein Push-, Arbeit ein Pull-Faktor." },
    { lv: 2, ok: true, md: "Rücküberweisungen von Migranten sind für viele Länder eine größere Geldquelle als Entwicklungshilfe.", why: "Für manche Länder machen sie einen großen Teil der Wirtschaftsleistung aus." },
    { lv: 2, ok: true, md: "Die Bundesrepublik schloss 1955 ein Anwerbeabkommen mit Italien und 1961 eines mit der Türkei.", why: "Es folgten weitere, etwa mit Marokko, Portugal und Jugoslawien." },
    { lv: 2, ok: false, md: "Die »Gastarbeiter« kehrten wie geplant nach wenigen Jahren alle zurück.", why: "Viele blieben und holten ihre Familien nach. Aus Gästen wurden Einwanderer." },
    { lv: 3, ok: false, md: "Migration lässt sich allein mit dem Lohnunterschied zwischen zwei Ländern erklären.", why: "Netzwerke, Familie, Politik und Bildung spielen mit. Oft wandern Menschen dorthin, wo schon Bekannte leben." },
    { lv: 3, ok: true, md: "Migrationsnetzwerke senken Kosten und Risiken für alle, die später aus demselben Ort folgen.", why: "Sie helfen bei Wohnung, Arbeit und Papieren." },
    { lv: 3, ok: true, md: "Mehrortige Feldforschung begleitet Migranten an Herkunfts- und Zielorten.", why: "So wird sichtbar, wie beide Orte verbunden bleiben." },
    { lv: 4, ok: true, md: "Nina Glick Schiller und Kolleginnen prägten Anfang der 1990er Jahre den Begriff Transnationalismus in der Ethnologie.", why: "Sie kritisierten, dass Migranten nur als Entwurzelte gesehen wurden." },
    { lv: 4, ok: false, md: "Methodologischer Nationalismus ist die Forderung, Migration nur innerhalb von Nationalstaaten zu erforschen.", why: "Der Begriff kritisiert die unbemerkte Annahme, der Nationalstaat sei die natürliche Einheit der Forschung." },
    { lv: 4, ok: false, md: "Flucht und Arbeitsmigration lassen sich immer klar voneinander trennen.", why: "Motive mischen sich. Die Unterscheidung ist auch eine rechtliche und politische." },
  ], { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] }));
  LW.extend("eth-migration", F.groups([
    { lv: 1, md: "Krieg im Herkunftsland", cat: "Push-Faktor", why: "Drängt Menschen fort." },
    { lv: 1, md: "Höhere Löhne im Zielland", cat: "Pull-Faktor", why: "Zieht Menschen an." },
    { lv: 1, md: "Verwandte, die schon im Zielland leben", cat: "Pull-Faktor", why: "Netzwerke ziehen an und erleichtern das Ankommen." },
    { lv: 1, md: "Dürre und Ernteausfälle", cat: "Push-Faktor", why: "Zerstören die Lebensgrundlage vor Ort." },
    { lv: 2, md: "Verfolgung wegen der Religion", cat: "Push-Faktor", why: "Zwingt zur Flucht." },
    { lv: 2, md: "Nachfrage nach Pflegekräften", cat: "Pull-Faktor", why: "Offene Stellen ziehen an." },
    { lv: 2, md: "Studienplätze im Ausland", cat: "Pull-Faktor", why: "Bildungschancen ziehen an." },
    { lv: 2, md: "Hohe Arbeitslosigkeit vor Ort", cat: "Push-Faktor", why: "Fehlende Chancen drängen fort." },
  ], { 1: ["choice"], 2: ["sort"] }, { cats: ["Push-Faktor", "Pull-Faktor"], ask: (md) => "»" + md + "«: Push- oder Pull-Faktor?", sort: "Ordne zu: Was drängt fort, was zieht an?", n: 6 }));
  LW.extend("eth-migration", F.pairs([
    { lv: 1, a: "Diaspora", b: "Verstreute Gruppe mit Bezug auf gemeinsame Herkunft" },
    { lv: 1, a: "Transnationalismus", b: "Leben in Bezügen zu mehreren Ländern zugleich" },
    { lv: 2, a: "Rücküberweisung", b: "Geld, das Migranten nach Hause schicken" },
    { lv: 2, a: "Kettenmigration", b: "Spätere folgen Verwandten und Bekannten nach" },
    { lv: 3, a: "Anwerbeabkommen", b: "Staatliche Vereinbarung über Arbeitskräfte" },
    { lv: 3, a: "Methodologischer Nationalismus", b: "Unbemerkte Annahme, der Nationalstaat sei die natürliche Einheit" },
  ], { 2: ["choice"], 3: ["reverse", "match"], 4: ["match"] }));
})();
