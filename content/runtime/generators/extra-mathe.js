// More tasks for Analysis I, Linear Algebra I and Stochastics: number templates with wider parameter ranges and
// new question forms, plus statement pools for the "traps" levels. Every template computes its answer exactly.
(function () {
  const F = LW.forms;
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const binom = (n, k) => { if (k < 0 || k > n) return 0; let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fracText = (p, q) => { const g = gcd(p, q); p /= g; q /= g; return q === 1 ? String(p) : p + "/" + q; };
  const isPrime = (n) => { if (n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
  /** 0,001 as 10^{-3}, 0,005 as 5 \cdot 10^{-3} */
  function sci(x) {
    const ex = Math.floor(Math.log10(x) + 1e-9), man = Math.round(x / Math.pow(10, ex));
    return (man === 1 ? "" : man + " \\cdot ") + "10^{" + ex + "}";
  }
  const num = (G, answer, explain, extra) => Object.assign({ type: "numeric", answer, tolerance: 1e-6, placeholder: "Zahl", explain }, extra || {});
  const dec = (G, x, d) => ({ answer: G.round(x, d), tolerance: 0.6 * Math.pow(10, -d), answerText: G.fmt(x, d), placeholder: "Dezimalzahl" });

  // ================================================================ Analysis: maps
  function mapTable(level, G) {
    const n = G.int(3, 5);
    const m = level === 1 ? n : G.pick([n - 1, n, n + 1]);
    let vals;
    if (m >= n && G.chance(0.4)) vals = G.shuffle([...Array(m)].map((_, i) => i + 1)).slice(0, n);
    else vals = [...Array(n)].map(() => G.int(1, m));
    const hit = new Set(vals);
    const inj = hit.size === n, sur = hit.size === m;
    const right = inj && sur ? "bijektiv" : inj ? "injektiv, aber nicht surjektiv" : sur ? "surjektiv, aber nicht injektiv" : "weder injektiv noch surjektiv";
    let rep = null;
    for (let i = 0; i < n && !rep; i++) for (let j = i + 1; j < n; j++) if (vals[i] === vals[j]) { rep = [i + 1, j + 1, vals[i]]; break; }
    const missing = [];
    for (let y = 1; y <= m; y++) if (!hit.has(y)) missing.push(y);
    const why = (rep ? "Nicht injektiv: $f(" + rep[0] + ") = f(" + rep[1] + ") = " + rep[2] + "$. " : "Injektiv: Alle Werte sind verschieden. ") +
      (missing.length ? "Nicht surjektiv: $" + missing.join(", ") + "$ " + (missing.length === 1 ? "wird" : "werden") + " nie getroffen." : "Surjektiv: Jedes Element der Zielmenge wird getroffen.");
    const head = "| $x$ | " + vals.map((_, i) => "$" + (i + 1) + "$").join(" | ") + " |";
    const sep = "|---|" + vals.map(() => "---").join("|") + "|";
    const row = "| $f(x)$ | " + vals.map((v) => "$" + v + "$").join(" | ") + " |";
    const opts = ["bijektiv", "injektiv, aber nicht surjektiv", "surjektiv, aber nicht injektiv", "weder injektiv noch surjektiv"];
    return {
      type: "choice",
      md: "Die Abbildung $f: \\{1, \\dots, " + n + "\\} \\to \\{1, \\dots, " + m + "\\}$ ist durch eine Wertetabelle gegeben.\n\n" + head + "\n" + sep + "\n" + row + "\n\nWelche Eigenschaften hat $f$?",
      options: opts.map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })),
      explain: why,
    };
  }
  LW.extend("ana-abb", { 1: [mapTable], 2: [mapTable] });
  LW.extend("ana-abb", F.statements([
    { lv: 3, ok: true, md: "Sind $f$ und $g$ injektiv, so ist $g \\circ f$ injektiv.", why: "Aus $g(f(x)) = g(f(y))$ folgt erst $f(x) = f(y)$, dann $x = y$." },
    { lv: 3, ok: true, md: "Sind $f$ und $g$ surjektiv, so ist $g \\circ f$ surjektiv.", why: "Zu $z$ gibt es $y$ mit $g(y) = z$ und dazu $x$ mit $f(x) = y$." },
    { lv: 3, ok: true, md: "Ist $g \\circ f$ injektiv, so ist $f$ injektiv.", why: "Aus $f(x) = f(y)$ folgt $g(f(x)) = g(f(y))$, also $x = y$." },
    { lv: 3, ok: false, md: "Ist $g \\circ f$ injektiv, so ist $g$ injektiv.", why: "Gegenbeispiel: $f: \\{1\\} \\to \\{1, 2\\}$, $g: \\{1, 2\\} \\to \\{1\\}$. Dann ist $g \\circ f$ injektiv, $g$ aber nicht." },
    { lv: 3, ok: true, md: "Ist $g \\circ f$ surjektiv, so ist $g$ surjektiv.", why: "Jedes $z$ ist $g(f(x))$ für ein $x$, also ein Wert von $g$." },
    { lv: 3, ok: false, md: "Ist $g \\circ f$ surjektiv, so ist $f$ surjektiv.", why: "Gegenbeispiel: $f: \\{1\\} \\to \\{1, 2\\}$, $g: \\{1, 2\\} \\to \\{1\\}$. $g \\circ f$ ist surjektiv, $f$ trifft $2$ nicht." },
    { lv: 3, ok: true, md: "Eine Abbildung ist genau dann bijektiv, wenn sie eine Umkehrabbildung besitzt.", why: "Die Umkehrabbildung ordnet jedem Bild sein eindeutiges Urbild zu." },
    { lv: 3, ok: false, md: "Jede injektive Abbildung $\\N \\to \\N$ ist surjektiv.", why: "$n \\mapsto n + 1$ ist injektiv, trifft aber $1$ nicht." },
    { lv: 3, ok: true, md: "Eine injektive Abbildung zwischen zwei endlichen Mengen gleicher Größe ist bijektiv.", why: "Sie trifft so viele Elemente, wie die Zielmenge hat." },
    { lv: 3, ok: false, md: "$f(A_1 \\cap A_2) = f(A_1) \\cap f(A_2)$ gilt für jede Abbildung.", why: "Es gilt nur $\\subseteq$. Für $f(x) = x^2$, $A_1 = \\{-1\\}$, $A_2 = \\{1\\}$ ist links $\\emptyset$, rechts $\\{1\\}$." },
    { lv: 3, ok: true, md: "$f^{-1}(B_1 \\cap B_2) = f^{-1}(B_1) \\cap f^{-1}(B_2)$ gilt für jede Abbildung.", why: "Urbilder vertragen sich mit Schnitt, Vereinigung und Komplement." },
  ], { 3: ["tf", "spot", "multi"] }));

  // ================================================================ countable sets
  LW.extend("ana-abzaehlbar", F.statements([
    { lv: 3, ok: true, md: "Die Menge aller endlichen Teilmengen von $\\N$ ist abzählbar.", why: "Für jede Größe $k$ gibt es abzählbar viele, und eine abzählbare Vereinigung abzählbarer Mengen ist abzählbar." },
    { lv: 3, ok: false, md: "Die Potenzmenge von $\\N$ ist abzählbar.", why: "Nach Cantor gibt es keine Surjektion von $\\N$ auf $\\mathcal P(\\N)$." },
    { lv: 3, ok: true, md: "$\\N \\times \\N$ ist abzählbar.", why: "Das Cantorsche Zickzack zählt alle Paare ab." },
    { lv: 3, ok: false, md: "Das Intervall $[0, 1]$ ist abzählbar, weil es beschränkt ist.", why: "Beschränkt heißt nicht abzählbar. Das Diagonalargument zeigt: $[0, 1]$ ist überabzählbar." },
    { lv: 3, ok: true, md: "Jede Teilmenge einer abzählbaren Menge ist höchstens abzählbar.", why: "Man zählt sie in der Reihenfolge der großen Menge ab." },
    { lv: 4, ok: false, md: "Die Menge der irrationalen Zahlen ist abzählbar.", why: "Sonst wäre $\\R = \\Q \\cup (\\R \\setminus \\Q)$ als Vereinigung zweier abzählbarer Mengen abzählbar." },
    { lv: 4, ok: true, md: "Die Menge der Polynome mit rationalen Koeffizienten ist abzählbar.", why: "Für jeden Grad $n$ entspricht sie $\\Q^{n+1}$, und die Vereinigung über alle $n$ bleibt abzählbar." },
    { lv: 4, ok: false, md: "Die Menge aller Folgen mit Werten in $\\{0, 1\\}$ ist abzählbar.", why: "Das Diagonalargument liefert zu jeder Aufzählung eine Folge, die fehlt." },
    { lv: 4, ok: true, md: "Es gibt keine Surjektion einer Menge $M$ auf ihre Potenzmenge.", why: "Das ist der Satz von Cantor; die Menge $\\{x \\in M : x \\notin f(x)\\}$ hat kein Urbild." },
    { lv: 4, ok: false, md: "Zwischen $\\N$ und $\\Z$ gibt es keine Bijektion, weil $\\Z$ mehr Elemente hat.", why: "$0, 1, -1, 2, -2, \\dots$ ist eine Bijektion. Unendliche Mengen können gleich mächtig sein wie echte Obermengen." },
    { lv: 4, ok: true, md: "Die Menge der algebraischen Zahlen ist abzählbar.", why: "Jedes ganzzahlige Polynom hat endlich viele Nullstellen, und es gibt abzählbar viele Polynome." },
  ], { 3: ["tf"], 4: ["spot", "multi", "tf"] }));

  // ================================================================ inequalities
  LW.extend("ana-anordnung", F.statements([
    { lv: 1, ok: true, md: "Aus $a < b$ folgt $a + c < b + c$ für jedes $c$.", why: "Addieren erhält die Ordnung." },
    { lv: 1, ok: true, md: "Aus $a < b$ und $c > 0$ folgt $ac < bc$.", why: "Multiplizieren mit einer positiven Zahl erhält die Ordnung." },
    { lv: 1, ok: false, md: "Aus $a < b$ und $c < 0$ folgt $ac < bc$.", why: "Eine negative Zahl dreht das Zeichen: $ac > bc$." },
    { lv: 1, ok: false, md: "Aus $a < b$ folgt $a^2 < b^2$.", why: "$a = -3$, $b = 1$: $9 > 1$." },
    { lv: 1, ok: true, md: "Aus $0 < a < b$ folgt $a^2 < b^2$.", why: "$b^2 - a^2 = (b - a)(b + a) > 0$." },
    { lv: 2, ok: true, md: "Aus $a < b$ und $c < d$ folgt $a + c < b + d$.", why: "Ungleichungen gleicher Richtung darf man addieren." },
    { lv: 2, ok: false, md: "Aus $a < b$ und $c < d$ folgt $ac < bd$.", why: "$a = c = -2$, $b = d = -1$: $ac = 4 > 1 = bd$." },
    { lv: 2, ok: true, md: "Für alle $a, b$ gilt $\\abs{a + b} \\le \\abs{a} + \\abs{b}$.", why: "Das ist die Dreiecksungleichung." },
    { lv: 2, ok: false, md: "Für alle $a, b$ gilt $\\abs{a - b} \\le \\abs{a} - \\abs{b}$.", why: "$a = 0$, $b = 1$: $1 \\le -1$ ist falsch. Richtig ist $\\big\\lvert \\abs{a} - \\abs{b} \\big\\rvert \\le \\abs{a - b}$." },
    { lv: 2, ok: true, md: "Für $a > 0$ gilt $a + \\tfrac1a \\ge 2$.", why: "$a + \\tfrac1a - 2 = \\tfrac{(a - 1)^2}{a} \\ge 0$." },
    { lv: 2, ok: false, md: "Für alle reellen $a$ gilt $a^2 > a$.", why: "$a = \\tfrac12$: $\\tfrac14 < \\tfrac12$." },
    { lv: 2, ok: true, md: "$\\abs{a} < 3$ gilt genau dann, wenn $-3 < a < 3$.", why: "Der Betrag misst den Abstand zur $0$." },
  ], { 1: ["tf"], 2: ["tf", "spot"] }));
  function absInterval(level, G) {
    const a = G.int(-6, 6), r = G.int(1, 6), strict = G.chance(0.6);
    const rel = strict ? "<" : "\\le";
    const inner = a === 0 ? "x" : "x " + (a < 0 ? "+ " + -a : "- " + a);
    return {
      type: "cloze",
      md: "Für welche $x$ gilt $\\abs{" + inner + "} " + rel + " " + r + "$? Gib die Grenzen an.\n\n{{0}} $" + rel + " x " + rel + "$ {{1}}",
      blanks: [{ accept: [a - r], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }, { accept: [a + r], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }],
      explain: "$\\abs{x - " + (a < 0 ? "(" + a + ")" : a) + "} " + rel + " " + r + "$ heißt: $x$ liegt höchstens " + r + " von $" + a + "$ entfernt, also $" + (a - r) + " " + rel + " x " + rel + " " + (a + r) + "$.",
    };
  }
  LW.extend("ana-anordnung", { 2: [absInterval], 3: [absInterval] });

  // ================================================================ Archimedes
  LW.extend("ana-archimedes", {
    1: [(level, G) => {
      const k = G.pick([3, 4, 6, 7, 8, 9, 12, 15, 16, 24, 30, 35, 45, 60, 70, 80, 90, 120, 150, 180, 220, 300, 350, 400]);
      const n = Math.floor(1000 / k) + 1;
      return num(G, n, "$\\tfrac1n < " + G.tex(k / 1000, 3) + " \\iff n > \\tfrac{1}{" + G.tex(k / 1000, 3) + "} = " + G.tex(1000 / k, 3) + "$. Das kleinste solche $n$ ist $" + n + "$.",
        { md: "Bestimme das kleinste $n \\in \\N$ mit $\\tfrac1n < " + G.tex(k / 1000, 3) + "$." });
    }],
    2: [(level, G) => {
      const A = G.int(13, 97), b = G.int(5, 60);
      const n = Math.floor((100 * b) / A) + 1;
      return num(G, n, "$n \\cdot " + G.tex(A / 100, 2) + " > " + b + " \\iff n > \\tfrac{" + b + "}{" + G.tex(A / 100, 2) + "} \\approx " + G.tex((100 * b) / A, 3) + "$, also $n = " + n + "$.",
        { md: "Nach Archimedes übertrifft ein Vielfaches von $" + G.tex(A / 100, 2) + "$ jede Zahl. Bestimme das kleinste $n \\in \\N$ mit $n \\cdot " + G.tex(A / 100, 2) + " > " + b + "$." });
    }],
    3: [(level, G) => {
      const base = G.pick([2, 3, 10]);
      const eps = base === 10 ? G.pick([0.3, 0.05, 0.02, 0.004, 0.0005, 0.0002]) : G.pick([0.3, 0.1, 0.05, 0.02, 0.01, 0.004, 0.001, 0.0005, 0.0002]);
      let n = 0;
      while (Math.pow(base, -n) >= eps) n++;
      return num(G, n, "$\\tfrac{1}{" + base + "^{" + n + "}} = " + G.tex(Math.pow(base, -n), 6) + " < " + G.tex(eps, 4) + "$, aber $\\tfrac{1}{" + base + "^{" + (n - 1) + "}} = " + G.tex(Math.pow(base, 1 - n), 6) + "$ ist noch zu groß.",
        { md: "Bestimme das kleinste $n \\in \\N$ mit $\\tfrac{1}{" + base + "^n} < " + G.tex(eps, 4) + "$." });
    }],
  });

  // ================================================================ convergence with epsilon
  LW.extend("ana-epsilon", {
    1: [(level, G) => {
      const c = G.int(1, 9), e = G.pick([50, 25, 20, 10, 5, 4, 2, 1]);
      const eps = e / 100, n0 = Math.floor((100 * c) / e) + 1;
      return num(G, n0, "$\\tfrac{" + c + "}{n} < " + G.tex(eps, 2) + " \\iff n > \\tfrac{" + c + "}{" + G.tex(eps, 2) + "} = " + G.tex(c / eps, 2) + "$, also $n_0 = " + n0 + "$.",
        { md: "$a_n = \\tfrac{" + c + "}{n}$ konvergiert gegen $0$. Ab welchem $n_0$ gilt $\\abs{a_n} < " + G.tex(eps, 2) + "$ für alle $n \\ge n_0$? (kleinstes $n_0$)" });
    }],
    2: [(level, G) => {
      const k = G.int(1, 5), e = G.pick([50, 25, 20, 10, 5, 4, 2, 1]);
      const eps = e / 100, n0 = Math.floor(100 / e);
      return num(G, n0, "$a_n = " + k + " + \\tfrac{1}{n + 1}$, also $\\abs{a_n - " + k + "} = \\tfrac{1}{n + 1} < " + G.tex(eps, 2) + " \\iff n + 1 > " + G.tex(1 / eps, 2) + "$. Das kleinste solche $n$ ist $" + n0 + "$.",
        { md: "$a_n = \\dfrac{" + k + "n + " + (k + 1) + "}{n + 1}$ konvergiert gegen $" + k + "$. Ab welchem $n_0$ gilt $\\abs{a_n - " + k + "} < " + G.tex(eps, 2) + "$ für alle $n \\ge n_0$?",
          hint: "Schreibe $a_n$ als $" + k + " + \\text{Rest}$." });
    }],
    4: [(level, G) => {
      const c = G.int(1, 3), e = G.pick([50, 25, 20, 10, 5, 4, 2]);
      const eps = e / 100, n0 = Math.floor((c * c * 10000) / (e * e)) + 1;
      const alt = G.chance(0.5);
      return num(G, n0, "$\\abs{a_n} = \\tfrac{" + c + "}{\\sqrt n} < " + G.tex(eps, 2) + " \\iff \\sqrt n > " + G.tex(c / eps, 2) + " \\iff n > " + G.tex((c * c) / (eps * eps), 2) + "$, also $n_0 = " + n0 + "$.",
        { md: "$a_n = \\dfrac{" + (alt ? "(-1)^n" : "") + (alt && c !== 1 ? " \\cdot " : "") + (alt && c === 1 ? "" : c) + "}{\\sqrt n}$. Kleinstes $n_0$ mit $\\abs{a_n} < " + G.tex(eps, 2) + "$ für alle $n \\ge n_0$?" });
    }],
  });
  LW.extend("ana-epsilon", F.statements([
    { lv: 3, ok: true, md: "Beim Nachweis von $a_n \\to a$ darf $n_0$ von $\\varepsilon$ abhängen.", why: "Je kleiner $\\varepsilon$, desto später beginnt meist der Schlauch." },
    { lv: 3, ok: false, md: "Beim Nachweis von $a_n \\to a$ muss ein einziges $n_0$ für alle $\\varepsilon$ zugleich passen.", why: "Das würde $a_n = a$ ab $n_0$ erzwingen. Erlaubt ist $n_0(\\varepsilon)$." },
    { lv: 3, ok: true, md: "Ändert man endlich viele Folgenglieder, ändert sich der Grenzwert nicht.", why: "Man wählt $n_0$ einfach hinter den geänderten Gliedern." },
    { lv: 3, ok: false, md: "Eine konvergente Folge ist ab einem $n_0$ konstant.", why: "$\\tfrac1n \\to 0$, ohne je konstant zu werden." },
    { lv: 3, ok: true, md: "Jede konvergente Folge ist beschränkt.", why: "Ab $n_0$ liegt sie im $1$-Schlauch, davor gibt es nur endlich viele Glieder." },
    { lv: 4, ok: false, md: "Jede beschränkte Folge konvergiert.", why: "$(-1)^n$ ist beschränkt, springt aber hin und her." },
    { lv: 4, ok: true, md: "Ein Grenzwert ist, wenn er existiert, eindeutig.", why: "Zwei Grenzwerte im Abstand $d > 0$ passen nicht beide in einen Schlauch der Breite $\\tfrac d2$." },
    { lv: 4, ok: false, md: "Gilt $\\abs{a_n - a} < \\varepsilon$ für ein festes $\\varepsilon > 0$ und alle $n$, dann gilt $a_n \\to a$.", why: "Es muss für jedes $\\varepsilon$ gelten. $(-1)^n$ erfüllt die Bedingung für $a = 0$, $\\varepsilon = 2$." },
    { lv: 4, ok: true, md: "Aus $a_n \\to a$ folgt $\\abs{a_n} \\to \\abs{a}$.", why: "$\\big\\lvert \\abs{a_n} - \\abs{a} \\big\\rvert \\le \\abs{a_n - a}$." },
    { lv: 4, ok: false, md: "Aus $\\abs{a_n} \\to \\abs{a}$ folgt $a_n \\to a$.", why: "$a_n = (-1)^n$ hat $\\abs{a_n} \\to 1$, konvergiert aber nicht." },
  ], { 3: ["tf", "spot"], 4: ["spot", "multi"] }));

  // ================================================================ exponential function
  LW.extend("ana-exp", {
    1: [(level, G) => {
      const x = G.pick([1, 2, 0.5, -1, 3]), n = G.int(2, 6);
      let s = 0;
      for (let k = 0; k <= n; k++) s += Math.pow(x, k) / fact(k);
      const xt = x < 0 || !Number.isInteger(x) ? "(" + G.tex(x) + ")" : G.tex(x);
      return Object.assign({ type: "numeric",
        md: "Berechne die Partialsumme $\\sum_{k=0}^{" + n + "} \\dfrac{" + xt + "^k}{k!}$ der Exponentialreihe (vier Nachkommastellen).",
        explain: "Summe der Glieder bis $k = " + n + "$: $\\approx " + G.tex(s, 4) + "$. Zum Vergleich $e^{" + G.tex(x) + "} \\approx " + G.tex(Math.exp(x), 4) + "$." }, dec(G, s, 4));
    }],
    2: [(level, G) => {
      if (G.chance(0.5)) {
        const k = G.pick([1, 2, 3, -1, 0.5]), a = G.pick([2, 3, 5, 7, 12, 20, 0.5, 0.2]);
        const x = Math.log(a) / k;
        const kt = k === 1 ? "" : k === -1 ? "-" : G.tex(k);
        return Object.assign({ type: "numeric", md: "Löse $e^{" + kt + "x} = " + G.tex(a) + "$ (vier Nachkommastellen).",
          explain: "Logarithmieren: $" + kt + "x = \\ln " + G.tex(a) + "$, also $x = " + (k === 1 ? "" : "\\tfrac{1}{" + G.tex(k) + "} \\cdot ") + "\\ln " + G.tex(a) + " \\approx " + G.tex(x, 4) + "$." }, dec(G, x, 4));
      }
      const b = G.pick([0.5, 1.5, 2, -1, 3, 0.2]), x = Math.exp(b);
      return Object.assign({ type: "numeric", md: "Löse $\\ln x = " + G.tex(b) + "$ (vier Nachkommastellen).",
        explain: "$\\ln$ ist die Umkehrfunktion von $\\exp$: $x = e^{" + G.tex(b) + "} \\approx " + G.tex(x, 4) + "$." }, dec(G, x, 4));
    }],
    3: [(level, G) => {
      const eps = G.pick([1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 5e-3, 2e-4, 5e-6]);
      let n = 0;
      while (2 / fact(n + 1) >= eps) n++;
      return num(G, n, "$\\tfrac{2}{" + (n + 1) + "!} = " + G.tex(2 / fact(n + 1), 7) + " < " + sci(eps) + "$, aber $\\tfrac{2}{" + n + "!} = " + G.tex(2 / fact(n), 7) + "$ ist noch zu groß.",
        { md: "Für $s_n = \\sum_{k=0}^{n} \\tfrac{1}{k!}$ gilt $0 < e - s_n \\le \\tfrac{2}{(n+1)!}$. Für welches kleinste $n$ garantiert diese Schranke einen Fehler unter $" + sci(eps) + "$?" });
    }],
  });
  LW.extend("ana-exp", F.statements([
    { lv: 3, ok: true, md: "$\\exp(x + y) = \\exp(x) \\exp(y)$ für alle reellen $x, y$.", why: "Das ist die Funktionalgleichung, beweisbar mit dem Cauchy-Produkt." },
    { lv: 3, ok: true, md: "$\\exp(x) > 0$ für alle $x \\in \\R$.", why: "$\\exp(x) = \\exp(\\tfrac x2)^2 \\ge 0$, und $\\exp(x)\\exp(-x) = 1$ schließt $0$ aus." },
    { lv: 3, ok: false, md: "$\\exp(-x) = -\\exp(x)$.", why: "Richtig ist $\\exp(-x) = \\tfrac{1}{\\exp(x)}$." },
    { lv: 3, ok: false, md: "$\\ln(a + b) = \\ln a + \\ln b$ für $a, b > 0$.", why: "Richtig ist $\\ln(ab) = \\ln a + \\ln b$." },
    { lv: 4, ok: true, md: "$\\lim_{x \\to 0} \\dfrac{e^x - 1}{x} = 1$.", why: "Das ist die Ableitung von $\\exp$ bei $0$." },
    { lv: 4, ok: false, md: "$\\lim_{x \\to \\infty} \\dfrac{e^x}{x^{10}} = 0$.", why: "$e^x$ wächst schneller als jede Potenz, der Grenzwert ist $\\infty$." },
    { lv: 4, ok: true, md: "Die Exponentialreihe konvergiert für jedes $x \\in \\R$ absolut.", why: "Quotientenkriterium: $\\tfrac{\\abs{x}}{k + 1} \\to 0$." },
    { lv: 4, ok: false, md: "Die Exponentialreihe konvergiert nur für $\\abs{x} < 1$.", why: "Sie konvergiert überall. Der Quotient der Glieder geht für jedes $x$ gegen $0$." },
    { lv: 4, ok: false, md: "$e^x \\ge 1 + x$ gilt nur für $x \\ge 0$.", why: "Es gilt für alle reellen $x$, weil $\\exp$ konvex ist und $1 + x$ die Tangente bei $0$." },
    { lv: 4, ok: true, md: "$\\exp$ ist streng monoton wachsend.", why: "Für $h > 0$ ist $\\exp(x + h) = \\exp(x)\\exp(h) > \\exp(x)$, da $\\exp(h) > 1$." },
  ], { 3: ["tf"], 4: ["spot", "multi", "tf"] }));

  // ================================================================ uniform convergence
  LW.extend("ana-glm", {
    2: [(level, G) => {
      if (G.chance(0.5)) {
        const q = G.pick([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]), eps = G.pick([0.1, 0.05, 0.01, 0.001]);
        let n = 1;
        while (Math.pow(q, n) >= eps) n++;
        return num(G, n, "Das Supremum von $x^n$ auf $[0, " + G.tex(q) + "]$ liegt am rechten Rand: $" + G.tex(q) + "^{" + n + "} \\approx " + G.tex(Math.pow(q, n), 5) + " < " + G.tex(eps) + "$, aber $" + G.tex(q) + "^{" + (n - 1) + "} \\approx " + G.tex(Math.pow(q, n - 1), 5) + "$.",
          { md: "$f_n(x) = x^n$ konvergiert auf $[0, " + G.tex(q) + "]$ gleichmäßig gegen $0$. Ab welchem $n$ gilt $\\sup_{x} \\abs{f_n(x)} < " + G.tex(eps) + "$?" });
      }
      const b = G.int(1, 9), e = G.pick([50, 20, 10, 5, 2]);
      const eps = e / 100, n = Math.floor((100 * b) / e) + 1;
      return num(G, n, "$\\sup_{x \\in [0, " + b + "]} \\tfrac{x}{n} = \\tfrac{" + b + "}{n} < " + G.tex(eps, 2) + " \\iff n > " + G.tex(b / eps, 2) + "$, also $n = " + n + "$.",
        { md: "$f_n(x) = \\tfrac{x}{n}$ auf $[0, " + b + "]$. Ab welchem $n$ ist $\\sup_x \\abs{f_n(x)} < " + G.tex(eps, 2) + "$?" });
    }],
  });
  LW.extend("ana-glm", F.statements([
    { lv: 4, ok: true, md: "Der gleichmäßige Grenzwert stetiger Funktionen ist stetig.", why: "Das ist der Satz über gleichmäßige Grenzwerte; der Beweis nutzt das $\\tfrac\\varepsilon3$-Argument." },
    { lv: 4, ok: false, md: "Der punktweise Grenzwert stetiger Funktionen ist stetig.", why: "$x^n$ auf $[0, 1]$ hat den unstetigen Grenzwert $0$ für $x < 1$ und $1$ bei $x = 1$." },
    { lv: 4, ok: true, md: "$f_n \\to f$ gleichmäßig auf $D$ genau dann, wenn $\\sup_{x \\in D} \\abs{f_n(x) - f(x)} \\to 0$.", why: "So ist gleichmäßige Konvergenz definiert, als Konvergenz in der Supremumsnorm." },
    { lv: 4, ok: false, md: "Konvergiert $f_n$ gleichmäßig, dann konvergiert auch $f_n'$ gleichmäßig.", why: "$f_n(x) = \\tfrac{\\sin(nx)}{n} \\to 0$ gleichmäßig, aber $f_n'(x) = \\cos(nx)$ konvergiert nicht." },
    { lv: 4, ok: false, md: "$f_n(x) = \\tfrac{x}{n}$ konvergiert auf ganz $\\R$ gleichmäßig gegen $0$.", why: "$\\sup_{x \\in \\R} \\tfrac{\\abs x}{n} = \\infty$. Gleichmäßig ist es nur auf beschränkten Mengen." },
    { lv: 4, ok: true, md: "Gleichmäßige Konvergenz impliziert punktweise Konvergenz.", why: "Der Abstand an jeder Stelle ist höchstens das Supremum." },
    { lv: 4, ok: false, md: "Sind alle $f_n$ beschränkt, folgt aus punktweiser Konvergenz die gleichmäßige.", why: "$x^n$ auf $[0, 1]$ ist durch $1$ beschränkt und konvergiert nicht gleichmäßig." },
    { lv: 4, ok: true, md: "Bei gleichmäßiger Konvergenz auf $[a, b]$ darf man Grenzwert und Integral vertauschen.", why: "$\\abs{\\int (f_n - f)} \\le (b - a) \\sup \\abs{f_n - f} \\to 0$." },
  ], { 4: ["spot", "multi", "tf"] }));

  // ================================================================ integrals
  LW.extend("ana-integral", {
    3: [(level, G) => {
      const kind = G.pick(["pow", "exp", "inv", "sin", "cos"]);
      let md, val, why;
      if (kind === "pow") {
        const m = G.int(2, 4), a = G.int(-2, 1), b = a + G.int(1, 3);
        val = (Math.pow(b, m + 1) - Math.pow(a, m + 1)) / (m + 1);
        md = "\\int_{" + a + "}^{" + b + "} x^{" + m + "}\\,dx";
        why = "Stammfunktion $\\tfrac{x^{" + (m + 1) + "}}{" + (m + 1) + "}$: $\\tfrac{" + b + "^{" + (m + 1) + "} - (" + a + ")^{" + (m + 1) + "}}{" + (m + 1) + "} \\approx " + G.tex(val, 4) + "$.";
      } else if (kind === "exp") {
        const k = G.pick([1, 2, 3, -1]), b = G.pick([1, 2, 0.5]);
        val = (Math.exp(k * b) - 1) / k;
        const kt = k === 1 ? "" : k === -1 ? "-" : String(k);
        md = "\\int_0^{" + G.tex(b) + "} e^{" + kt + "x}\\,dx";
        why = "Stammfunktion $\\tfrac{1}{" + k + "} e^{" + kt + "x}$: $\\tfrac{e^{" + G.tex(k * b) + "} - 1}{" + k + "} \\approx " + G.tex(val, 4) + "$.";
      } else if (kind === "inv") {
        const b = G.pick([2, 3, 4, 5, 10]);
        val = Math.log(b);
        md = "\\int_1^{" + b + "} \\frac{1}{x}\\,dx";
        why = "Stammfunktion $\\ln x$: $\\ln " + b + " - \\ln 1 \\approx " + G.tex(val, 4) + "$.";
      } else if (kind === "sin") {
        const c = G.pick([["\\tfrac{\\pi}{2}", Math.PI / 2], ["\\pi", Math.PI], ["\\tfrac{\\pi}{3}", Math.PI / 3], ["\\tfrac{\\pi}{6}", Math.PI / 6], ["\\tfrac{2\\pi}{3}", (2 * Math.PI) / 3]]);
        val = 1 - Math.cos(c[1]);
        md = "\\int_0^{" + c[0] + "} \\sin x\\,dx";
        why = "Stammfunktion $-\\cos x$: $1 - \\cos(" + c[0] + ") \\approx " + G.tex(val, 4) + "$.";
      } else {
        const k = G.int(1, 4);
        val = 1 / k;
        md = "\\int_0^{\\pi/" + 2 * k + "} \\cos(" + (k === 1 ? "" : k) + "x)\\,dx";
        why = "Stammfunktion $\\tfrac{1}{" + k + "}\\sin(" + (k === 1 ? "" : k) + "x)$: $\\tfrac{1}{" + k + "} \\sin\\tfrac{\\pi}{2} = " + G.tex(val, 4) + "$.";
      }
      return Object.assign({ type: "numeric", md: "Berechne $" + md + "$ (vier Nachkommastellen).", explain: why }, dec(G, val, 4));
    }],
  });

  // ================================================================ convergence tests for series
  LW.extend("ana-kriterien", F.pairs([
    { lv: 2, a: "$\\sum \\frac{n^2}{2^n}$", b: "Quotientenkriterium" },
    { lv: 3, a: "$\\sum \\frac{n!}{n^n}$", b: "Quotientenkriterium" },
    { lv: 2, a: "$\\sum \\frac{(-1)^n}{\\sqrt n}$", b: "Leibniz-Kriterium" },
    { lv: 3, a: "$\\sum_{n \\ge 2} \\frac{(-1)^n}{\\ln n}$", b: "Leibniz-Kriterium" },
    { lv: 3, a: "$\\sum \\left(\\frac{n}{2n+1}\\right)^n$", b: "Wurzelkriterium" },
    { lv: 4, a: "$\\sum \\left(1 - \\frac1n\\right)^{n^2}$", b: "Wurzelkriterium" },
    { lv: 2, a: "$\\sum \\frac{1}{n^2 + n}$", b: "Majorantenkriterium" },
    { lv: 3, a: "$\\sum \\frac{\\sin^2 n}{n^2}$", b: "Majorantenkriterium" },
    { lv: 2, a: "$\\sum \\frac{1}{\\sqrt n}$", b: "Minorantenkriterium (Divergenz)" },
    { lv: 3, a: "$\\sum \\frac{1}{2n - 1}$", b: "Minorantenkriterium (Divergenz)" },
    { lv: 2, a: "$\\sum \\frac{n}{n+1}$", b: "Trivialkriterium (keine Nullfolge)" },
    { lv: 3, a: "$\\sum (-1)^n \\frac{n}{n+1}$", b: "Trivialkriterium (keine Nullfolge)" },
  ], { 2: ["choice"], 3: ["match", "choice"], 4: ["match", "reverse"] },
  { match: "Welches Kriterium ist für welche Reihe das natürliche Werkzeug?", ask: (a) => "Mit welchem Kriterium entscheidet man über " + a + " am natürlichsten?", askBack: (b) => "Für welche Reihe ist das natürliche Werkzeug: " + b + "?" }));
  LW.extend("ana-kriterien", F.statements([
    { lv: 3, ok: true, md: "Konvergiert $\\sum \\abs{a_n}$, so konvergiert auch $\\sum a_n$.", why: "Absolute Konvergenz impliziert Konvergenz (Cauchy-Kriterium)." },
    { lv: 3, ok: false, md: "Konvergiert $\\sum a_n$, so konvergiert auch $\\sum \\abs{a_n}$.", why: "$\\sum \\tfrac{(-1)^n}{n}$ konvergiert, die harmonische Reihe nicht." },
    { lv: 3, ok: true, md: "Ist $(a_n)$ keine Nullfolge, divergiert $\\sum a_n$.", why: "Für Konvergenz müssen die Glieder gegen $0$ gehen." },
    { lv: 3, ok: false, md: "Ist $(a_n)$ eine Nullfolge, konvergiert $\\sum a_n$.", why: "Die harmonische Reihe $\\sum \\tfrac1n$ divergiert." },
    { lv: 4, ok: false, md: "Liefert das Quotientenkriterium den Grenzwert $1$, divergiert die Reihe.", why: "Dann sagt es nichts: $\\sum \\tfrac1n$ divergiert, $\\sum \\tfrac1{n^2}$ konvergiert, beide mit Grenzwert $1$." },
    { lv: 4, ok: true, md: "$\\sum \\tfrac{1}{n^s}$ konvergiert genau für $s > 1$.", why: "Das zeigt man mit dem Verdichtungs- oder Integralkriterium." },
    { lv: 4, ok: true, md: "Das Leibniz-Kriterium verlangt eine monoton fallende Nullfolge $(a_n)$.", why: "Dann konvergiert $\\sum (-1)^n a_n$." },
    { lv: 4, ok: false, md: "Jede alternierende Reihe konvergiert.", why: "$\\sum (-1)^n$ alterniert und divergiert, die Glieder sind keine Nullfolge." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ logic: formulas with truth tables
  const OPS = { and: "\\land", or: "\\lor", imp: "\\Rightarrow", iff: "\\Leftrightarrow" };
  function ftex(f, top) {
    if (f.op === "var") return f.name;
    if (f.op === "not") return "\\lnot " + (f.a.op === "var" || f.a.op === "not" ? ftex(f.a) : "(" + ftex(f.a, true) + ")");
    const s = ftex(f.a) + " " + OPS[f.op] + " " + ftex(f.b);
    return top ? s : "(" + s + ")";
  }
  function fval(f, env) {
    switch (f.op) {
      case "var": return env[f.name];
      case "not": return !fval(f.a, env);
      case "and": return fval(f.a, env) && fval(f.b, env);
      case "or": return fval(f.a, env) || fval(f.b, env);
      case "imp": return !fval(f.a, env) || fval(f.b, env);
      default: return fval(f.a, env) === fval(f.b, env);
    }
  }
  function fvars(f, set) { set = set || new Set(); if (f.op === "var") set.add(f.name); else { fvars(f.a, set); if (f.b) fvars(f.b, set); } return set; }
  function countTrue(f) {
    const vs = [...fvars(f)].sort();
    let c = 0;
    for (let m = 0; m < 1 << vs.length; m++) {
      const env = {};
      vs.forEach((v, i) => { env[v] = !!(m & (1 << i)); });
      if (fval(f, env)) c++;
    }
    return { c, rows: 1 << vs.length, vars: vs };
  }
  const V = (n) => ({ op: "var", name: n }), N = (a) => ({ op: "not", a }), B = (op, a, b) => ({ op, a, b });
  function randFormula(G, depth, names) {
    if (depth === 0 || (depth < 2 && G.chance(0.3))) { const v = V(G.pick(names)); return G.chance(0.25) ? N(v) : v; }
    return B(G.pick(["and", "or", "imp", "iff"]), randFormula(G, depth - 1, names), randFormula(G, depth - 1, names));
  }
  // schemes whose status is known: P, Q, R get renamed and possibly negated, which keeps (non-)tautologies as they are
  const SCHEMES = [
    [true, (P, Q) => B("iff", B("imp", P, Q), B("imp", N(Q), N(P)))],
    [true, (P, Q) => B("iff", B("imp", P, Q), B("or", N(P), Q))],
    [true, (P, Q) => B("iff", N(B("and", P, Q)), B("or", N(P), N(Q)))],
    [true, (P, Q, R) => B("imp", B("and", B("imp", P, Q), B("imp", Q, R)), B("imp", P, R))],
    [true, (P, Q) => B("imp", B("and", P, B("imp", P, Q)), Q)],
    [true, (P, Q, R) => B("iff", B("imp", P, B("imp", Q, R)), B("imp", B("and", P, Q), R))],
    [false, (P, Q) => B("imp", B("imp", P, Q), B("imp", Q, P))],
    [false, (P, Q) => B("imp", B("or", P, Q), P)],
    [false, (P, Q) => B("iff", N(B("or", P, Q)), B("or", N(P), N(Q)))],
    [false, (P, Q, R) => B("imp", B("imp", P, Q), B("imp", P, B("and", Q, R)))],
    [false, (P, Q) => B("iff", B("imp", P, Q), B("imp", N(P), N(Q)))],
  ];
  LW.extend("ana-logik", {
    2: [(level, G) => {
      const [taut, make] = G.pick(SCHEMES);
      const names = G.shuffle(["A", "B", "C", "P", "Q", "R"]).slice(0, 3);
      const lit = (n) => (G.chance(0.3) ? N(V(n)) : V(n));
      const f = make(lit(names[0]), lit(names[1]), lit(names[2]));
      const t = countTrue(f);
      const isTaut = t.c === t.rows;
      return {
        type: "truefalse",
        md: "$" + ftex(f, true) + "$ ist eine **Tautologie**, also in jeder Zeile der Wahrheitstafel wahr.",
        answer: isTaut,
        whyNot: isTaut ? "Prüfe alle Zeilen: Keine macht die Formel falsch." : "Die Formel ist nur in " + t.c + " von " + t.rows + " Zeilen wahr.",
        explain: (isTaut ? "Ja, in allen " + t.rows + " Zeilen wahr." : "Nein, nur in " + t.c + " von " + t.rows + " Zeilen wahr.") + (taut === isTaut ? "" : ""),
      };
    }],
    4: [(level, G) => {
      let f, t;
      for (let k = 0; k < 20; k++) {
        f = randFormula(G, 2, ["A", "B", "C"]);
        t = countTrue(f);
        if (t.vars.length === 3 && t.c > 0 && t.c < 8) break;
      }
      return num(G, t.c, "Geht man alle $2^" + t.vars.length + " = " + t.rows + "$ Belegungen von $" + t.vars.join(", ") + "$ durch, ist die Formel in " + t.c + " Zeilen wahr.",
        { md: "In wie vielen der " + t.rows + " Zeilen der Wahrheitstafel ist $" + ftex(f, true) + "$ wahr?" });
    }],
  });
  // negation of quantified statements, with the typical wrong negations as distractors
  const NEG = [
    ["\\forall x\\ \\exists y: x < y", "\\exists x\\ \\forall y: x \\ge y", ["\\exists x\\ \\forall y: x < y", "\\forall x\\ \\exists y: x \\ge y", "\\exists x\\ \\exists y: x \\ge y"]],
    ["\\exists x: (x > 0 \\land x^2 < 1)", "\\forall x: (x \\le 0 \\lor x^2 \\ge 1)", ["\\forall x: (x \\le 0 \\land x^2 \\ge 1)", "\\exists x: (x \\le 0 \\lor x^2 \\ge 1)", "\\forall x: (x > 0 \\land x^2 \\ge 1)"]],
    ["\\exists M\\ \\forall n: a_n \\le M", "\\forall M\\ \\exists n: a_n > M", ["\\forall M\\ \\forall n: a_n > M", "\\exists M\\ \\exists n: a_n > M", "\\forall M\\ \\exists n: a_n \\le M"]],
    ["\\forall n: (n \\text{ gerade} \\Rightarrow n^2 \\text{ gerade})", "\\exists n: (n \\text{ gerade} \\land n^2 \\text{ ungerade})", ["\\exists n: (n \\text{ ungerade} \\Rightarrow n^2 \\text{ ungerade})", "\\forall n: (n \\text{ gerade} \\Rightarrow n^2 \\text{ ungerade})", "\\exists n: (n \\text{ ungerade} \\land n^2 \\text{ gerade})"]],
    ["\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x: (\\abs{x} < \\delta \\Rightarrow \\abs{f(x)} < \\varepsilon)", "\\exists \\varepsilon > 0\\ \\forall \\delta > 0\\ \\exists x: (\\abs{x} < \\delta \\land \\abs{f(x)} \\ge \\varepsilon)",
      ["\\exists \\varepsilon > 0\\ \\forall \\delta > 0\\ \\exists x: (\\abs{x} \\ge \\delta \\Rightarrow \\abs{f(x)} \\ge \\varepsilon)", "\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x: (\\abs{x} < \\delta \\land \\abs{f(x)} \\ge \\varepsilon)", "\\exists \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x: \\abs{f(x)} \\ge \\varepsilon"]],
    ["\\forall x: (P(x) \\lor Q(x))", "\\exists x: (\\lnot P(x) \\land \\lnot Q(x))", ["\\exists x: (\\lnot P(x) \\lor \\lnot Q(x))", "\\forall x: (\\lnot P(x) \\land \\lnot Q(x))", "\\exists x: (P(x) \\land Q(x))"]],
  ];
  LW.extend("ana-logik", {
    3: [(level, G) => {
      const [s, right, wrong] = G.pick(NEG);
      return {
        type: "choice",
        md: "Was ist die Verneinung von $" + s + "$?",
        options: G.options({ md: "$" + right + "$" }, wrong.map((w) => ({ md: "$" + w + "$", why: "Beim Verneinen werden alle Quantoren getauscht ($\\forall \\leftrightarrow \\exists$) und nur die innere Aussage verneint." }))),
        explain: "Quantoren tauschen, innen verneinen: $\\lnot(A \\Rightarrow B) \\equiv A \\land \\lnot B$, $\\lnot(A \\lor B) \\equiv \\lnot A \\land \\lnot B$. Ergebnis: $" + right + "$.",
      };
    }],
  });

  // ================================================================ metric spaces
  LW.extend("ana-metrik", F.statements([
    { lv: 3, ok: true, md: "In der diskreten Metrik ist jede Teilmenge offen.", why: "Die Kugel vom Radius $\\tfrac12$ um $x$ ist $\\{x\\}$ selbst." },
    { lv: 3, ok: false, md: "Der Durchschnitt beliebig vieler offener Mengen ist offen.", why: "$\\bigcap_n \\left(-\\tfrac1n, \\tfrac1n\\right) = \\{0\\}$ ist nicht offen. Nur endliche Durchschnitte bleiben offen." },
    { lv: 3, ok: true, md: "Die Vereinigung beliebig vieler offener Mengen ist offen.", why: "Jeder Punkt liegt in einer der Mengen und hat dort eine Kugel." },
    { lv: 3, ok: false, md: "Eine Menge, die nicht offen ist, ist abgeschlossen.", why: "$[0, 1)$ ist weder offen noch abgeschlossen." },
    { lv: 3, ok: true, md: "Die leere Menge und der ganze Raum sind zugleich offen und abgeschlossen.", why: "Jede ist das Komplement der anderen, und beide sind offen." },
    { lv: 4, ok: true, md: "Auf $\\R^n$ sind alle Normen äquivalent.", why: "Das folgt aus der Kompaktheit der Einheitssphäre." },
    { lv: 4, ok: false, md: "$d(x, y) = (x - y)^2$ ist eine Metrik auf $\\R$.", why: "Die Dreiecksungleichung scheitert: $d(0, 2) = 4 > 1 + 1 = d(0, 1) + d(1, 2)$." },
    { lv: 4, ok: true, md: "$d(x, y) = \\min(1, \\abs{x - y})$ ist eine Metrik auf $\\R$.", why: "Abschneiden bei $1$ erhält alle drei Axiome." },
    { lv: 4, ok: false, md: "Jede Metrik kommt von einer Norm.", why: "Die diskrete Metrik ist nicht homogen: $d(2x, 0) = 1 \\ne 2 = 2 d(x, 0)$." },
    { lv: 4, ok: true, md: "Jede Norm liefert durch $d(x, y) = \\norm{x - y}$ eine Metrik.", why: "Die Normaxiome übersetzen sich direkt in die Metrikaxiome." },
  ], { 3: ["tf"], 4: ["spot", "multi", "tf"] }));

  // distances between two points in three metrics
  LW.extend("ana-metrik", {
    1: [(level, G) => {
      const x = [G.int(-4, 4), G.int(-4, 4)], y = [G.int(-4, 4), G.int(-4, 4)];
      if (x[0] === y[0] && x[1] === y[1]) y[0] += 3;
      const dx = Math.abs(x[0] - y[0]), dy = Math.abs(x[1] - y[1]);
      const kind = G.pick(["1", "inf", "2"]);
      const val = kind === "1" ? dx + dy : kind === "inf" ? Math.max(dx, dy) : Math.sqrt(dx * dx + dy * dy);
      const name = kind === "1" ? "d_1(x, y) = \\abs{x_1 - y_1} + \\abs{x_2 - y_2}" : kind === "inf" ? "d_\\infty(x, y) = \\max(\\abs{x_1 - y_1}, \\abs{x_2 - y_2})" : "d_2(x, y) = \\sqrt{(x_1 - y_1)^2 + (x_2 - y_2)^2}";
      const pt = (p) => "(" + p[0] + ", " + p[1] + ")";
      return Object.assign({ type: "numeric", md: "Berechne den Abstand von $x = " + pt(x) + "$ und $y = " + pt(y) + "$ in der Metrik $" + name + "$." + (kind === "2" ? " (vier Nachkommastellen)" : ""),
        explain: "Die Koordinaten unterscheiden sich um $" + dx + "$ und $" + dy + "$. " + (kind === "1" ? "Summe: $" + val + "$." : kind === "inf" ? "Maximum: $" + val + "$." : "$\\sqrt{" + dx * dx + " + " + dy * dy + "} \\approx " + G.tex(val, 4) + "$.") },
        kind === "2" ? dec(G, val, 4) : { answer: val, tolerance: 1e-6, placeholder: "Zahl" });
    }],
  });

  // ================================================================ monotone sequences
  LW.extend("ana-monoton", {
    3: [(level, G) => {
      const x = G.pick([1, 2, -1, 3, 0.5]), n = G.pick([5, 10, 20, 50, 100, 1000]);
      const val = Math.pow(1 + x / n, n);
      const frac = (den) => (x === 0.5 ? "\\tfrac{1}{" + den + "}" : "\\tfrac{" + Math.abs(x) + "}{" + den + "}");
      const sign = x < 0 ? " - " : " + ";
      const inner = "1" + sign + frac(x === 0.5 ? "2n" : "n");
      const shown = "1" + sign + frac(x === 0.5 ? 2 * n : n);
      return Object.assign({ type: "numeric", md: "Berechne $\\left(" + shown + "\\right)^{" + n + "}$ (vier Nachkommastellen).",
        explain: "Der Wert ist $\\approx " + G.tex(val, 4) + "$. Die Folge $\\left(" + inner + "\\right)^n$ ist monoton und strebt gegen $e^{" + G.tex(x) + "} \\approx " + G.tex(Math.exp(x), 4) + "$." }, dec(G, val, 4));
    }],
  });
  const UP = "monoton wachsend", DOWN = "monoton fallend", NONE = "nicht monoton";
  LW.extend("ana-monoton", F.groups([
    { lv: 3, md: "$a_n = \\frac{n}{n+1}$", cat: UP, why: "$a_n = 1 - \\tfrac{1}{n+1}$ wächst." },
    { lv: 3, md: "$a_n = \\frac{1}{n}$", cat: DOWN, why: "Größerer Nenner, kleinerer Bruch." },
    { lv: 3, md: "$a_n = \\frac{(-1)^n}{n}$", cat: NONE, why: "Das Vorzeichen wechselt ständig." },
    { lv: 3, md: "$a_n = n^2 - 10n$", cat: NONE, why: "Fällt bis $n = 5$, steigt danach." },
    { lv: 3, md: "$a_n = \\frac{3n+1}{n+2}$", cat: UP, why: "$a_n = 3 - \\tfrac{5}{n+2}$ wächst." },
    { lv: 3, md: "$a_n = \\sin n$", cat: NONE, why: "Die Werte springen zwischen $-1$ und $1$ hin und her." },
    { lv: 4, md: "$a_n = \\sqrt{n+1} - \\sqrt{n}$", cat: DOWN, why: "$a_n = \\tfrac{1}{\\sqrt{n+1} + \\sqrt n}$, der Nenner wächst." },
    { lv: 4, md: "$a_n = \\left(1 + \\frac1n\\right)^n$", cat: UP, why: "Das zeigt man mit der Bernoulli-Ungleichung." },
    { lv: 4, md: "$a_n = \\frac{n^2}{2^n}$", cat: NONE, why: "$\\tfrac12, 1, \\tfrac98, 1, \\dots$: erst steigt sie, dann fällt sie." },
    { lv: 4, md: "$a_n = \\frac{n!}{n^n}$", cat: DOWN, why: "$\\tfrac{a_{n+1}}{a_n} = \\left(\\tfrac{n}{n+1}\\right)^n < 1$." },
    { lv: 4, md: "$a_n = 1 - \\frac{(-1)^n}{n}$", cat: NONE, why: "Sie pendelt um $1$." },
    { lv: 4, md: "$a_n = \\ln n - \\ln(n+1)$", cat: UP, why: "$a_n = \\ln\\tfrac{n}{n+1}$ wächst gegen $0$." },
  ], { 3: ["choice"], 4: ["sort", "choice"] }, { cats: [UP, DOWN, NONE], ask: (md) => "Wie verhält sich die Folge " + md + " für $n \\ge 1$?", sort: "Ordne die Folgen nach ihrem Verhalten für $n \\ge 1$.", n: 5 }));

  // ================================================================ mean value theorem
  LW.extend("ana-mws", {
    2: [(level, G) => {
      const kind = G.pick(["sq", "cube", "root", "inv", "exp"]);
      let md, xi, why;
      if (kind === "sq") {
        const a = G.int(-3, 3), b = a + G.int(1, 5);
        xi = (a + b) / 2; md = "f(x) = x^2 \\text{ auf } [" + a + ", " + b + "]";
        why = "$\\tfrac{f(b) - f(a)}{b - a} = a + b = 2\\xi$, also $\\xi = \\tfrac{a + b}{2} = " + G.tex(xi, 4) + "$.";
      } else if (kind === "cube") {
        const b = G.int(1, 5);
        xi = b / Math.sqrt(3); md = "f(x) = x^3 \\text{ auf } [0, " + b + "]";
        why = "$\\tfrac{" + b + "^3 - 0}{" + b + "} = " + b * b + " = 3\\xi^2$, also $\\xi = \\tfrac{" + b + "}{\\sqrt 3} \\approx " + G.tex(xi, 4) + "$.";
      } else if (kind === "root") {
        const a = G.pick([0, 1, 4]), b = G.pick([9, 16, 25]);
        xi = Math.pow((Math.sqrt(a) + Math.sqrt(b)) / 2, 2); md = "f(x) = \\sqrt x \\text{ auf } [" + a + ", " + b + "]";
        why = "$\\tfrac{\\sqrt b - \\sqrt a}{b - a} = \\tfrac{1}{\\sqrt a + \\sqrt b} = \\tfrac{1}{2\\sqrt\\xi}$, also $\\xi = \\left(\\tfrac{\\sqrt a + \\sqrt b}{2}\\right)^2 = " + G.tex(xi, 4) + "$.";
      } else if (kind === "inv") {
        const a = G.int(1, 4), b = a + G.int(1, 5);
        xi = Math.sqrt(a * b); md = "f(x) = \\tfrac1x \\text{ auf } [" + a + ", " + b + "]";
        why = "$\\tfrac{1/b - 1/a}{b - a} = -\\tfrac{1}{ab} = -\\tfrac{1}{\\xi^2}$, also $\\xi = \\sqrt{ab} = \\sqrt{" + a * b + "} \\approx " + G.tex(xi, 4) + "$.";
      } else {
        const b = G.pick([1, 2, 3]);
        xi = Math.log((Math.exp(b) - 1) / b); md = "f(x) = e^x \\text{ auf } [0, " + b + "]";
        why = "$e^\\xi = \\tfrac{e^{" + b + "} - 1}{" + b + "}$, also $\\xi = \\ln \\tfrac{e^{" + b + "} - 1}{" + b + "} \\approx " + G.tex(xi, 4) + "$.";
      }
      return Object.assign({ type: "numeric", md: "Bestimme die Stelle $\\xi$ aus dem Mittelwertsatz für $" + md + "$ (vier Nachkommastellen).", explain: why }, dec(G, xi, 4));
    }],
  });
  LW.extend("ana-mws", F.statements([
    { lv: 4, ok: false, md: "Ist $f$ differenzierbar und streng monoton wachsend, dann ist $f'(x) > 0$ überall.", why: "$f(x) = x^3$ wächst streng, aber $f'(0) = 0$." },
    { lv: 4, ok: true, md: "Ist $f' = 0$ auf einem Intervall, so ist $f$ dort konstant.", why: "Mittelwertsatz: $f(x) - f(y) = f'(\\xi)(x - y) = 0$." },
    { lv: 4, ok: false, md: "Ist $f' = 0$ auf $(0, 1) \\cup (2, 3)$, so ist $f$ dort konstant.", why: "Auf den beiden Teilen kann $f$ verschiedene Konstanten haben." },
    { lv: 4, ok: true, md: "Ist $\\abs{f'} \\le L$ auf $[a, b]$, so gilt $\\abs{f(x) - f(y)} \\le L \\abs{x - y}$ für alle $x, y \\in [a, b]$.", why: "Das folgt direkt aus dem Mittelwertsatz." },
    { lv: 4, ok: true, md: "Für alle $x, y$ gilt $\\abs{\\sin x - \\sin y} \\le \\abs{x - y}$.", why: "$\\abs{\\cos} \\le 1$ und der Mittelwertsatz." },
    { lv: 4, ok: false, md: "Der Satz von Rolle gilt auch, wenn $f$ an einer inneren Stelle nicht differenzierbar ist.", why: "$\\abs{x}$ auf $[-1, 1]$: gleiche Randwerte, aber nirgends Ableitung $0$." },
    { lv: 4, ok: false, md: "Hat $f'$ bei $x_0$ eine Nullstelle, so hat $f$ dort ein Extremum.", why: "$x^3$ hat bei $0$ einen Sattelpunkt." },
    { lv: 4, ok: true, md: "Hat eine differenzierbare Funktion an einer inneren Stelle ein lokales Extremum, so ist die Ableitung dort $0$.", why: "Links und rechts haben die Differenzenquotienten verschiedene Vorzeichen." },
  ], { 4: ["spot", "multi", "tf"] }));

  // ================================================================ continuity: removable gaps
  LW.extend("ana-stetig", {
    2: [(level, G) => {
      const kind = G.pick(["sq", "cube", "lin", "sin"]);
      const a = G.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
      const xa = a < 0 ? "x + " + -a : "x - " + a;
      let md, val, why;
      if (kind === "sq") { md = "\\dfrac{x^2 - " + a * a + "}{" + xa + "}"; val = 2 * a; why = "$\\tfrac{x^2 - " + a * a + "}{" + xa + "} = x " + (a < 0 ? "- " + -a : "+ " + a) + "$ für $x \\ne " + a + "$, also $f(" + a + ") = " + val + "$."; }
      else if (kind === "cube") { md = "\\dfrac{x^3 " + (a < 0 ? "+ " + -a * a * a : "- " + a * a * a) + "}{" + xa + "}"; val = 3 * a * a; why = "$x^3 - a^3 = (x - a)(x^2 + ax + a^2)$; bei $x = a$ bleibt $3a^2 = " + val + "$."; }
      else if (kind === "lin") { const b = G.pick([-5, -3, -2, 2, 3, 4, 7]); md = "\\dfrac{x^2 " + (b < 0 ? "- " + -b : "+ " + b) + "x}{x}"; val = b; why = "Kürzen: $x " + (b < 0 ? "- " + -b : "+ " + b) + "$, bei $x = 0$ also $" + b + "$."; return num(G, val, why, { md: "$f(x) = " + md + "$ für $x \\ne 0$. Welchen Wert muss $f(0)$ haben, damit $f$ stetig ist?" }); }
      else { const k = G.pick([2, 3, 4, 5]); md = "\\dfrac{\\sin(" + k + "x)}{x}"; val = k; why = "$\\tfrac{\\sin(" + k + "x)}{x} = " + k + " \\cdot \\tfrac{\\sin(" + k + "x)}{" + k + "x} \\to " + k + "$, da $\\tfrac{\\sin t}{t} \\to 1$."; return num(G, val, why, { md: "$f(x) = " + md + "$ für $x \\ne 0$. Welchen Wert muss $f(0)$ haben, damit $f$ stetig ist?" }); }
      return num(G, val, why, { md: "$f(x) = " + md + "$ für $x \\ne " + a + "$. Welchen Wert muss $f(" + a + ")$ haben, damit $f$ stetig ist?" });
    }],
  });

  // ================================================================ induction
  LW.extend("ana-summen", F.statements([
    { lv: 3, ok: true, md: "Im Induktionsschritt darf man die Aussage für $n$ voraussetzen und muss sie für $n + 1$ zeigen.", why: "Das ist die Induktionsvoraussetzung." },
    { lv: 3, ok: false, md: "Im Induktionsschritt zeigt man die Aussage für $n + 1$ und folgert daraus die für $n$.", why: "Die Richtung ist umgekehrt: von $n$ auf $n + 1$." },
    { lv: 3, ok: true, md: "Der Induktionsanfang darf auch bei $n = 3$ liegen. Dann gilt die Aussage ab $3$.", why: "Die Kette beginnt dort, wo der Anfang bewiesen ist." },
    { lv: 3, ok: false, md: "Ein korrekter Induktionsschritt genügt, den Induktionsanfang kann man weglassen.", why: "»$n = n + 1$« hat einen gültigen Schritt von $n$ auf $n + 1$, ist aber nie wahr." },
    { lv: 3, ok: true, md: "$\\sum_{k=1}^{n} (2k - 1) = n^2$ für alle $n \\ge 1$.", why: "Die ungeraden Zahlen ergeben Quadrate: $1 + 3 + 5 = 9$." },
    { lv: 4, ok: true, md: "Bei der starken Induktion darf man die Aussage für alle $k \\le n$ voraussetzen.", why: "Nützlich etwa bei der Zerlegung in Primfaktoren." },
    { lv: 4, ok: false, md: "$\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)}{2}$.", why: "Das ist die Summe der $k$. Für die Quadrate gilt $\\tfrac{n(n+1)(2n+1)}{6}$." },
    { lv: 4, ok: true, md: "$\\sum_{k=1}^{n} k^3 = \\left(\\frac{n(n+1)}{2}\\right)^2$.", why: "Die Summe der Kuben ist das Quadrat der Summe der Zahlen." },
    { lv: 4, ok: true, md: "$\\sum_{k=0}^{n} 2^k = 2^{n+1} - 1$.", why: "Im Schritt kommt $2^{n+1}$ dazu: $2^{n+1} - 1 + 2^{n+1} = 2^{n+2} - 1$." },
    { lv: 4, ok: false, md: "Der Schritt im Scheinbeweis »Alle Pferde haben dieselbe Farbe« ist für jedes $n \\ge 1$ korrekt.", why: "Von $n = 1$ auf $2$ überlappen die beiden Gruppen nicht, dort bricht der Schritt." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ supremum and infimum
  LW.extend("ana-supinf", {
    3: [(level, G) => {
      const kind = G.pick(["lin", "alt", "altsum"]);
      let expr, sup, inf, why;
      if (kind === "lin") {
        const a = G.int(-2, 3), b = G.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
        expr = (a === 0 ? "" : a + (b > 0 ? " + " : " - ")) + (a === 0 && b < 0 ? "-" : "") + "\\dfrac{" + Math.abs(b) + "}{n}";
        sup = b > 0 ? a + b : a; inf = b > 0 ? a : a + b;
        why = b > 0 ? "Am größten bei $n = 1$: $" + sup + "$. Für $n \\to \\infty$ fallen die Werte gegen $" + a + "$, ohne es zu erreichen." : "Am kleinsten bei $n = 1$: $" + inf + "$. Die Werte steigen gegen $" + a + "$, ohne es zu erreichen.";
      } else if (kind === "alt") {
        const c = G.int(1, 4);
        expr = "(-1)^n \\left(1 + \\dfrac{" + c + "}{n}\\right)";
        sup = 1 + c / 2; inf = -1 - c;
        why = "Gerade $n$: größtes Element bei $n = 2$, nämlich $" + G.tex(sup, 3) + "$. Ungerade $n$: kleinstes bei $n = 1$, nämlich $" + inf + "$.";
      } else {
        const c = G.int(1, 5);
        expr = "(-1)^n + \\dfrac{" + c + "}{n}";
        sup = Math.max(1 + c / 2, c - 1); inf = -1;
        why = "Gerade $n$: höchstens $1 + \\tfrac{" + c + "}{2}$ bei $n = 2$. Ungerade $n$: höchstens $" + (c - 1) + "$ bei $n = 1$. Also $\\sup M = " + G.tex(sup, 3) + "$. Die ungeraden Glieder fallen gegen $-1$, ohne es zu erreichen.";
      }
      return {
        type: "cloze",
        md: "$M = \\left\\{ " + expr + " : n \\in \\N \\right\\}$. Bestimme Supremum und Infimum.\n\n$\\sup M =$ {{0}} $\\qquad \\inf M =$ {{1}}",
        blanks: [{ accept: [sup], numeric: true, tolerance: 0.001, placeholder: "Zahl" }, { accept: [inf], numeric: true, tolerance: 0.001, placeholder: "Zahl" }],
        explain: why,
      };
    }],
    4: [(level, G) => {
      let k;
      do { k = G.int(2, 60); } while (Number.isInteger(Math.sqrt(k)));
      const cube = G.chance(0.3);
      const val = cube ? Math.cbrt(k) : Math.sqrt(k);
      return Object.assign({ type: "numeric", md: "Bestimme $\\sup \\{ x \\in \\Q : x^" + (cube ? 3 : 2) + " < " + k + " \\}$ (vier Nachkommastellen).",
        explain: "Das Supremum ist $\\sqrt" + (cube ? "[3]" : "") + "{" + k + "} \\approx " + G.tex(val, 4) + "$. Es liegt nicht in $\\Q$: In $\\Q$ hätte die Menge kein Supremum, in $\\R$ schon." }, dec(G, val, 4));
    }],
  });

  // ================================================================ Taylor polynomials
  const TAYLOR = {
    exp: { tex: "e^x", term: (k, x) => Math.pow(x, k) / fact(k), f: Math.exp },
    sin: { tex: "\\sin x", term: (k, x) => (k % 2 ? (k % 4 === 1 ? 1 : -1) * Math.pow(x, k) / fact(k) : 0), f: Math.sin },
    cos: { tex: "\\cos x", term: (k, x) => (k % 2 ? 0 : (k % 4 === 0 ? 1 : -1) * Math.pow(x, k) / fact(k)), f: Math.cos },
    ln: { tex: "\\ln(1 + x)", term: (k, x) => (k === 0 ? 0 : ((k % 2 ? 1 : -1) * Math.pow(x, k)) / k), f: (x) => Math.log(1 + x) },
    geo: { tex: "\\tfrac{1}{1 - x}", term: (k, x) => Math.pow(x, k), f: (x) => 1 / (1 - x) },
    root: { tex: "\\sqrt{1 + x}", term: (k, x) => binomHalf(k) * Math.pow(x, k), f: (x) => Math.sqrt(1 + x) },
  };
  function binomHalf(k) { let c = 1; for (let i = 0; i < k; i++) c *= (0.5 - i) / (i + 1); return c; }
  function taylorTask(names, degs) {
    return (level, G) => {
      const name = G.pick(names), T = TAYLOR[name], d = G.pick(degs), x = G.pick([0.1, 0.2, 0.3, 0.4, 0.5, -0.2]);
      let s = 0;
      for (let k = 0; k <= d; k++) s += T.term(k, x);
      return Object.assign({ type: "numeric",
        md: "Berechne das Taylorpolynom vom Grad $" + d + "$ von $" + T.tex + "$ um $0$ an der Stelle $x = " + G.tex(x) + "$ (fünf Nachkommastellen).",
        explain: "Summe der Glieder bis Grad $" + d + "$: $T_" + d + "(" + G.tex(x) + ") \\approx " + G.tex(s, 5) + "$. Der wahre Wert ist $\\approx " + G.tex(T.f(x), 5) + "$." }, dec(G, s, 5));
    };
  }
  LW.extend("ana-taylor", {
    2: [taylorTask(["exp", "sin", "cos"], [2, 3, 4, 5])],
    3: [taylorTask(["ln", "geo", "root"], [2, 3, 4])],
    4: [(level, G) => {
      const eps = G.pick([1e-2, 1e-3, 1e-4, 1e-5, 1e-6]);
      if (G.chance(0.5)) {
        let n = 0;
        while (Math.E / fact(n + 1) >= eps) n++;
        return num(G, n, "Nach Lagrange ist der Fehler höchstens $\\tfrac{e}{(n+1)!}$. Für $n = " + n + "$: $\\tfrac{e}{" + (n + 1) + "!} \\approx " + G.tex(Math.E / fact(n + 1), 7) + " < " + sci(eps) + "$; für $n = " + (n - 1) + "$ reicht es noch nicht.",
          { md: "Mit welchem kleinsten Grad $n$ garantiert die Restgliedabschätzung $\\abs{R_n(x)} \\le \\tfrac{e}{(n+1)!}$ für $e^x$ auf $[0, 1]$ einen Fehler unter $" + sci(eps) + "$?" });
      }
      const r = G.pick([0.5, 1, 2]);
      let n = 0;
      while (Math.pow(r, n + 1) / fact(n + 1) >= eps) n++;
      return num(G, n, "Alle Ableitungen von $\\sin$ sind durch $1$ beschränkt, also $\\abs{R_n(x)} \\le \\tfrac{" + G.tex(r) + "^{n+1}}{(n+1)!}$. Das ist ab $n = " + n + "$ kleiner als $" + sci(eps) + "$.",
        { md: "Mit welchem kleinsten Grad $n$ garantiert die Abschätzung $\\abs{R_n(x)} \\le \\tfrac{\\abs{x}^{n+1}}{(n+1)!}$ für $\\sin x$ auf $[-" + G.tex(r) + ", " + G.tex(r) + "]$ einen Fehler unter $" + sci(eps) + "$?" });
    }],
  });

  // ================================================================ subsequences and accumulation points
  LW.extend("ana-teilfolgen", {
    2: [(level, G) => {
      const p = G.int(-2, 3), q = G.pick([-3, -2, -1, 1, 2, 3]), r = G.pick([0, 0, 1, -1, 2]);
      const qa = Math.abs(q);
      let expr = p !== 0 ? String(p) + (q > 0 ? " + " : " - ") : q < 0 ? "-" : "";
      expr += (qa === 1 ? "" : qa + " \\cdot ") + "(-1)^n";
      if (r) expr += (r > 0 ? " + " : " - ") + "\\tfrac{" + Math.abs(r) + "}{n}";
      return {
        type: "cloze",
        md: "$a_n = " + expr + "$. Bestimme $\\limsup$ und $\\liminf$.\n\n$\\limsup a_n =$ {{0}} $\\qquad \\liminf a_n =$ {{1}}",
        blanks: [{ accept: [p + qa], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }, { accept: [p - qa], numeric: true, tolerance: 1e-6, placeholder: "Zahl" }],
        explain: "Die geraden und die ungeraden Glieder bilden zwei Teilfolgen mit den Grenzwerten $" + (p + q) + "$ und $" + (p - q) + "$" + (r ? " (der Term $\\tfrac{" + Math.abs(r) + "}{n}$ verschwindet)" : "") + ". Größter Häufungspunkt $" + (p + qa) + "$, kleinster $" + (p - qa) + "$.",
      };
    }],
    3: [(level, G) => {
      if (G.chance(0.5)) {
        const k = G.int(2, 9);
        return num(G, k, "$n \\bmod " + k + "$ durchläuft immer wieder $0, 1, \\dots, " + (k - 1) + "$. Jeder dieser $" + k + "$ Werte wird unendlich oft angenommen und ist Häufungspunkt.",
          { md: "Wie viele Häufungspunkte hat $a_n = n \\bmod " + k + "$, der Rest von $n$ bei Teilung durch $" + k + "$?" });
      }
      const k = G.pick([3, 4, 5, 6, 8]), c = Math.floor(k / 2) + 1;
      return num(G, c, "$\\cos\\left(\\tfrac{2\\pi n}{" + k + "}\\right)$ ist periodisch mit Periode $" + k + "$. Wegen $\\cos(-t) = \\cos t$ fallen Werte paarweise zusammen; es bleiben $" + c + "$ verschiedene Werte, jeder unendlich oft.",
        { md: "Wie viele Häufungspunkte hat $a_n = \\cos\\left(\\tfrac{2\\pi n}{" + k + "}\\right)$?" });
    }],
  });
  LW.extend("ana-teilfolgen", F.statements([
    { lv: 4, ok: true, md: "Jede beschränkte Folge reeller Zahlen hat eine konvergente Teilfolge.", why: "Das ist der Satz von Bolzano-Weierstraß." },
    { lv: 4, ok: false, md: "Jede Folge reeller Zahlen hat eine konvergente Teilfolge.", why: "$a_n = n$ hat keine, ihr fehlt die Beschränktheit." },
    { lv: 4, ok: true, md: "Eine Folge konvergiert genau dann, wenn sie beschränkt ist und genau einen Häufungspunkt hat.", why: "Mit Bolzano-Weierstraß führt jede abweichende Teilfolge zu einem zweiten Häufungspunkt." },
    { lv: 4, ok: false, md: "Hat eine Folge genau einen Häufungspunkt, so konvergiert sie.", why: "$a_n = n$ für gerade $n$ und $0$ sonst hat nur den Häufungspunkt $0$, ist aber unbeschränkt." },
    { lv: 4, ok: true, md: "Jede Teilfolge einer konvergenten Folge konvergiert gegen denselben Grenzwert.", why: "Ab $n_0$ liegt die ganze Folge im Schlauch, also auch jede Teilfolge." },
    { lv: 4, ok: false, md: "Jede Cauchy-Folge in $\\Q$ konvergiert in $\\Q$.", why: "Die Dezimalnäherungen von $\\sqrt 2$ sind eine Cauchy-Folge ohne Grenzwert in $\\Q$." },
    { lv: 4, ok: true, md: "$\\limsup a_n$ ist der größte Häufungspunkt einer beschränkten Folge.", why: "So lässt sich der Limes superior gleichwertig erklären." },
    { lv: 4, ok: false, md: "Für jede beschränkte Folge gilt $\\limsup a_n = \\sup_n a_n$.", why: "$\\tfrac1n$: das Supremum ist $1$, der Limes superior $0$." },
    { lv: 4, ok: true, md: "Jede Folge reeller Zahlen besitzt eine monotone Teilfolge.", why: "Das zeigt man mit dem Gipfelargument." },
  ], { 4: ["spot", "multi", "tf"] }));

  // ================================================================ intermediate value theorem: bisection
  LW.extend("ana-zws", {
    3: [(level, G) => {
      const L = G.pick([1, 2, 3, 4, 5, 10]), eps = G.pick([0.1, 0.05, 0.01, 0.001, 0.0001]);
      let n = 0;
      while (L / Math.pow(2, n) >= eps) n++;
      if (G.chance(0.5)) {
        return num(G, n, "Nach $n$ Schritten ist das Intervall $\\tfrac{" + L + "}{2^n}$ lang. $\\tfrac{" + L + "}{2^{" + n + "}} \\approx " + G.tex(L / Math.pow(2, n), 6) + " < " + G.tex(eps, 4) + "$, einen Schritt vorher noch nicht.",
          { md: "Bisektion auf einem Intervall der Länge $" + L + "$: Nach wie vielen Halbierungen ist das Intervall mit der Nullstelle erstmals kürzer als $" + G.tex(eps, 4) + "$?" });
      }
      const k = G.int(3, 10);
      return Object.assign({ type: "numeric", md: "Bisektion auf einem Intervall der Länge $" + L + "$: Wie lang ist das Intervall nach $" + k + "$ Halbierungen? (sechs Nachkommastellen)",
        explain: "Jede Halbierung teilt die Länge durch $2$: $\\tfrac{" + L + "}{2^{" + k + "}} = " + G.tex(L / Math.pow(2, k), 6) + "$." }, dec(G, L / Math.pow(2, k), 6));
    }],
  });

  // ================================================================ Linear Algebra: groups and fields
  LW.extend("la-gruppe", F.statements([
    { lv: 1, ok: true, md: "$(\\Z, +)$ ist eine Gruppe.", why: "Neutrales Element $0$, Inverses zu $a$ ist $-a$." },
    { lv: 1, ok: false, md: "$(\\Z, \\cdot)$ ist eine Gruppe.", why: "$2$ hat in $\\Z$ kein multiplikatives Inverses." },
    { lv: 1, ok: false, md: "$(\\R, \\cdot)$ ist eine Gruppe.", why: "$0$ hat kein Inverses. Ohne die $0$ wäre es eine Gruppe." },
    { lv: 1, ok: true, md: "$(\\{1, -1\\}, \\cdot)$ ist eine Gruppe.", why: "Abgeschlossen, neutral ist $1$, jedes Element ist sein eigenes Inverses." },
    { lv: 1, ok: true, md: "$(\\R_{>0}, \\cdot)$ ist eine Gruppe.", why: "Produkte positiver Zahlen sind positiv, Inverses zu $a$ ist $\\tfrac1a$." },
    { lv: 1, ok: true, md: "Die geraden Zahlen mit $+$ bilden eine Gruppe.", why: "Summen und Negative gerader Zahlen sind gerade, $0$ ist gerade." },
    { lv: 1, ok: false, md: "Die ungeraden Zahlen mit $+$ bilden eine Gruppe.", why: "$1 + 1 = 2$ ist nicht ungerade: nicht abgeschlossen." },
    { lv: 3, ok: false, md: "Die invertierbaren $2 \\times 2$-Matrizen bilden mit dem Matrixprodukt eine **abelsche** Gruppe.", why: "Das Matrixprodukt ist nicht kommutativ." },
    { lv: 3, ok: true, md: "$(\\Z/n\\Z, +)$ ist für jedes $n \\ge 1$ eine abelsche Gruppe.", why: "Addition modulo $n$ ist kommutativ." },
    { lv: 3, ok: false, md: "Die Symmetriegruppe eines gleichseitigen Dreiecks ist abelsch.", why: "Erst spiegeln, dann drehen ergibt etwas anderes als umgekehrt." },
    { lv: 3, ok: true, md: "In einer Gruppe ist das neutrale Element eindeutig.", why: "Sind $e, e'$ neutral, gilt $e = e e' = e'$." },
    { lv: 3, ok: false, md: "In einer Gruppe kann ein Element zwei verschiedene Inverse haben.", why: "Aus $ba = e = ac$ folgt $b = b(ac) = (ba)c = c$." },
    { lv: 4, ok: false, md: "In jeder Gruppe gilt $(ab)^{-1} = a^{-1} b^{-1}$.", why: "Richtig ist $(ab)^{-1} = b^{-1} a^{-1}$; in nicht abelschen Gruppen verschieden." },
    { lv: 4, ok: true, md: "In jeder Gruppe gilt die Kürzungsregel: aus $ab = ac$ folgt $b = c$.", why: "Man multipliziert links mit $a^{-1}$." },
    { lv: 4, ok: true, md: "Jede Gruppe mit vier Elementen ist abelsch.", why: "Es gibt bis auf Isomorphie nur $\\Z/4\\Z$ und die Kleinsche Vierergruppe, beide abelsch." },
    { lv: 4, ok: false, md: "Jede Gruppe mit sechs Elementen ist abelsch.", why: "Die Symmetriegruppe des Dreiecks hat sechs Elemente und ist nicht abelsch." },
  ], { 1: ["tf"], 3: ["tf", "multi"], 4: ["spot", "multi"] }));
  const CL = "Abgeschlossenheit", NE = "neutrales Element", INV = "Inverse", ASS = "Assoziativität";
  LW.extend("la-gruppe", F.groups([
    { lv: 4, md: "$(\\{1, 2, 3, 4, 5\\}, \\cdot \\bmod 6)$", cat: CL, why: "$2 \\cdot 3 = 0 \\bmod 6$ liegt nicht in der Menge." },
    { lv: 4, md: "die ungeraden Zahlen mit $+$", cat: CL, why: "$1 + 1 = 2$ ist gerade." },
    { lv: 4, md: "$(\\{1, 2, 3, \\dots\\}, +)$", cat: NE, why: "Es fehlt die $0$." },
    { lv: 4, md: "$(\\{0, 1, 2, \\dots\\}, +)$", cat: INV, why: "Zu $1$ fehlt $-1$." },
    { lv: 4, md: "$(\\Z, \\cdot)$", cat: INV, why: "Zu $2$ gibt es kein Inverses in $\\Z$." },
    { lv: 4, md: "$(\\Z, -)$", cat: ASS, why: "$(5 - 3) - 1 = 1$, aber $5 - (3 - 1) = 3$." },
    { lv: 4, md: "$(\\Q, \\cdot)$", cat: INV, why: "Die $0$ hat kein Inverses." },
    { lv: 4, md: "$(\\R_{>0}, a \\circ b = \\tfrac{a}{b})$", cat: ASS, why: "$(8 / 4) / 2 = 1$, aber $8 / (4 / 2) = 4$." },
    { lv: 4, md: "$(\\R, a \\circ b = ab + 1)$", cat: ASS, why: "$(a \\circ b) \\circ c = abc + c + 1$, $a \\circ (b \\circ c) = abc + a + 1$." },
  ], { 4: ["choice"] }, { cats: [CL, NE, INV, ASS], ask: (md) => md + " ist keine Gruppe. Welches Axiom ist **zuerst** verletzt (in der Reihenfolge Abgeschlossenheit, Assoziativität, neutrales Element, Inverse)?" }));

  LW.extend("la-modular", {
    3: [(level, G) => {
      const n = G.int(2, 40), p = isPrime(n);
      return { type: "truefalse", md: "$\\Z/" + n + "\\Z$ mit Addition und Multiplikation modulo $" + n + "$ ist ein **Körper**.", answer: p,
        whyNot: p ? "$" + n + "$ ist eine Primzahl, deshalb hat jedes Element außer $0$ ein Inverses." : "$" + n + "$ ist keine Primzahl; ein echter Teiler von $" + n + "$ hat kein multiplikatives Inverses.",
        explain: "$\\Z/n\\Z$ ist genau dann ein Körper, wenn $n$ eine Primzahl ist. " + (p ? "$" + n + "$ ist prim." : "$" + n + "$ ist nicht prim.") };
    }],
    4: [(level, G) => {
      const p = G.pick([5, 7, 11, 13, 17, 19, 23]), a = G.int(2, p - 1);
      let inv = 1;
      while ((a * inv) % p !== 1) inv++;
      return num(G, inv, "$" + a + " \\cdot " + inv + " = " + a * inv + " = " + Math.floor((a * inv) / p) + " \\cdot " + p + " + 1$, also $" + a + "^{-1} = " + inv + "$ in $\\Z/" + p + "\\Z$.",
        { md: "Bestimme das multiplikative Inverse von $" + a + "$ in $\\Z/" + p + "\\Z$ (als Zahl von $1$ bis $" + (p - 1) + "$).", hint: "Suche $x$ mit $" + a + "x \\equiv 1 \\pmod{" + p + "}$, etwa mit dem erweiterten euklidischen Algorithmus." });
    }],
  });

  LW.extend("la-unterraum", {
    2: [(level, G) => {
      const m = G.pick([-3, -2, -1, 2, 3, 4]), c = G.pick([0, 0, 1, -2, 3]);
      const ok = c === 0;
      return { type: "truefalse", md: "$U = \\{(x, y) \\in \\R^2 : y = " + (m === 1 ? "" : m === -1 ? "-" : m) + "x" + (c ? (c > 0 ? " + " : " - ") + Math.abs(c) : "") + "\\}$ ist ein Untervektorraum von $\\R^2$.", answer: ok,
        whyNot: ok ? "Eine Gerade durch den Ursprung ist abgeschlossen unter Addition und Vielfachen." : "Der Nullvektor liegt nicht in $U$: $0 \\ne " + c + "$.",
        explain: ok ? "Gerade durch den Ursprung: Untervektorraum." : "Ohne den Nullvektor kein Untervektorraum." };
    }],
  });
  LW.extend("la-unterraum", F.statements([
    { lv: 2, ok: true, md: "$\\{(x, y, z) \\in \\R^3 : x + y + z = 0\\}$ ist ein Untervektorraum.", why: "Lösungsmenge einer homogenen linearen Gleichung." },
    { lv: 2, ok: false, md: "$\\{(x, y) \\in \\R^2 : x \\ge 0\\}$ ist ein Untervektorraum.", why: "$(1, 0)$ liegt drin, $-1 \\cdot (1, 0)$ nicht." },
    { lv: 2, ok: false, md: "$\\{(x, y) \\in \\R^2 : xy = 0\\}$ ist ein Untervektorraum.", why: "$(1, 0) + (0, 1) = (1, 1)$ liegt nicht drin." },
    { lv: 2, ok: true, md: "$\\{(x, y, z) \\in \\R^3 : x = y = z\\}$ ist ein Untervektorraum.", why: "Die Gerade durch $0$ in Richtung $(1, 1, 1)$." },
    { lv: 2, ok: false, md: "$\\{(x, y) \\in \\R^2 : x^2 + y^2 \\le 1\\}$ ist ein Untervektorraum.", why: "$2 \\cdot (1, 0)$ liegt außerhalb." },
    { lv: 3, ok: true, md: "Die Lösungsmenge von $Ax = 0$ ist ein Untervektorraum.", why: "Sie ist der Kern der linearen Abbildung $x \\mapsto Ax$." },
    { lv: 3, ok: false, md: "Die Lösungsmenge von $Ax = b$ mit $b \\ne 0$ ist ein Untervektorraum.", why: "Sie enthält den Nullvektor nicht." },
    { lv: 3, ok: false, md: "Die Polynome vom Grad **genau** $2$ bilden einen Untervektorraum.", why: "$x^2 + (-x^2 + x) = x$ hat Grad $1$, und das Nullpolynom fehlt." },
    { lv: 3, ok: true, md: "Die Polynome vom Grad **höchstens** $2$ bilden einen Untervektorraum.", why: "Summen und Vielfache erhöhen den Grad nicht." },
  ], { 2: ["tf", "spot"], 3: ["multi"] }));

  // ================================================================ Stochastics: counting
  const WORDS = ["ANANAS", "BANANE", "OTTO", "KAFFEE", "MISSISSIPPI", "STATISTIK", "ERDBEERE", "ABRAKADABRA", "TOMATE", "PAPAGEI", "LAMA", "TEETASSE", "KOKOSNUSS", "RHABARBER"];
  LW.extend("stoch-kombi", {
    1: [(level, G) => {
      const kind = G.pick(["row", "podium", "pin", "team", "outfit"]);
      if (kind === "row") { const n = G.int(3, 8); return num(G, fact(n), "$" + n + "! = " + fact(n) + "$: für den ersten Platz $" + n + "$ Möglichkeiten, für den zweiten $" + (n - 1) + "$ und so weiter.", { md: "Auf wie viele Arten können sich $" + n + "$ Personen in eine Reihe stellen?" }); }
      if (kind === "podium") { const n = G.int(5, 12), v = n * (n - 1) * (n - 2); return num(G, v, "$" + n + " \\cdot " + (n - 1) + " \\cdot " + (n - 2) + " = " + v + "$: Reihenfolge zählt, niemand doppelt.", { md: "$" + n + "$ Läuferinnen starten. Wie viele Möglichkeiten gibt es für Gold, Silber und Bronze?" }); }
      if (kind === "pin") { const k = G.int(3, 6), v = Math.pow(10, k); return num(G, v, "Jede Stelle hat $10$ Möglichkeiten: $10^" + k + " = " + v + "$.", { md: "Wie viele $" + k + "$-stellige PINs aus den Ziffern $0$ bis $9$ gibt es (Wiederholung erlaubt)?" }); }
      if (kind === "team") { const n = G.int(5, 12), k = G.int(2, 4), v = binom(n, k); return num(G, v, "Ohne Reihenfolge, ohne Wiederholung: $\\binom{" + n + "}{" + k + "} = " + v + "$.", { md: "Aus $" + n + "$ Personen wird ein Team aus $" + k + "$ Personen gebildet. Wie viele Teams sind möglich?" }); }
      const a = G.int(2, 5), b = G.int(2, 6), c = G.int(2, 4), v = a * b * c;
      return num(G, v, "Produktregel: $" + a + " \\cdot " + b + " \\cdot " + c + " = " + v + "$.", { md: "Du hast $" + a + "$ Hosen, $" + b + "$ Shirts und $" + c + "$ Paar Schuhe. Wie viele verschiedene Kombinationen kannst du anziehen?" });
    }],
    4: [(level, G) => {
      if (G.chance(0.25)) {
        const n = G.int(4, 9), v = fact(n - 1);
        return num(G, v, "Am runden Tisch zählt nur die Anordnung relativ zueinander: Man setzt eine Person fest und ordnet die übrigen an, $(" + n + " - 1)! = " + v + "$.",
          { md: "Auf wie viele Arten können sich $" + n + "$ Personen an einen runden Tisch setzen, wenn nur zählt, wer neben wem sitzt (Drehungen gelten als gleich)?" });
      }
      const w = G.pick(WORDS), counts = {};
      for (const ch of w) counts[ch] = (counts[ch] || 0) + 1;
      let v = fact(w.length);
      const rep = Object.entries(counts).filter(([, c]) => c > 1);
      for (const [, c] of rep) v /= fact(c);
      v = Math.round(v);
      const denom = rep.map(([ch, c]) => c + "!").join(" \\cdot ");
      return num(G, v, "$" + w.length + "$ Buchstaben, davon " + rep.map(([ch, c]) => c + "-mal " + ch).join(", ") + ": $\\tfrac{" + w.length + "!}{" + (denom || "1") + "} = " + v + "$.",
        { md: "Wie viele verschiedene Buchstabenfolgen lassen sich aus den Buchstaben von **" + w + "** bilden? Alle Buchstaben werden verwendet." });
    }],
  });

  // ================================================================ confidence intervals
  LW.extend("stoch-konfidenz", {
    3: [(level, G) => {
      const [lvl, z] = G.pick([["90", 1.645], ["95", 1.96], ["99", 2.576]]);
      const d = G.pick([0.01, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1]);
      const n = Math.ceil(Math.pow((z * 0.5) / d, 2) - 1e-9);
      return num(G, n, "Im ungünstigsten Fall $p = 0{,}5$ ist der Radius $" + G.tex(z, 3) + " \\cdot \\sqrt{\\tfrac{0{,}25}{n}}$. Aus $\\le " + G.tex(d, 3) + "$ folgt $n \\ge \\left(\\tfrac{" + G.tex(z, 3) + " \\cdot 0{,}5}{" + G.tex(d, 3) + "}\\right)^2 \\approx " + G.tex(Math.pow((z * 0.5) / d, 2), 2) + "$, also $n = " + n + "$.",
        { md: "Wie viele Personen muss man mindestens befragen, damit das $" + lvl + "\\,\\%$-Konfidenzintervall für einen Anteil **in jedem Fall** eine Fehlermarge von höchstens $\\pm " + G.tex(d * 100, 1) + "$ Prozentpunkten hat? ($z = " + G.tex(z, 3) + "$)" });
    }],
  });
  LW.extend("stoch-konfidenz", F.statements([
    { lv: 4, ok: true, md: "Ein Konfidenzintervall sagt etwas über einen unbekannten Anteil, ein Prognoseintervall über künftige Stichprobenergebnisse.", why: "Beim einen ist der Anteil unbekannt, beim anderen bekannt." },
    { lv: 4, ok: false, md: "Mit $95\\,\\%$ Wahrscheinlichkeit liegt der wahre Anteil in genau diesem einen berechneten Intervall.", why: "Der Anteil ist fest. Die $95\\,\\%$ beschreiben das Verfahren: Rund $95\\,\\%$ der so berechneten Intervalle treffen." },
    { lv: 4, ok: true, md: "Vervierfacht man den Stichprobenumfang, halbiert sich die Breite des Intervalls ungefähr.", why: "Die Breite schrumpft mit $\\tfrac{1}{\\sqrt n}$." },
    { lv: 4, ok: false, md: "Ein höheres Vertrauensniveau macht das Konfidenzintervall schmaler.", why: "Es macht es breiter: $z$ wächst von $1{,}96$ auf $2{,}576$ beim Übergang von $95$ auf $99\\,\\%$." },
    { lv: 4, ok: false, md: "Für ein Land mit $80$ Millionen Menschen ist eine Stichprobe von $1\\,000$ Personen viel zu klein.", why: "Die Breite hängt von $n$ ab, kaum von der Größe der Bevölkerung, solange diese viel größer ist." },
    { lv: 4, ok: true, md: "Gegen eine verzerrte Stichprobe hilft auch ein großer Umfang nicht.", why: "Der systematische Fehler bleibt, nur der Zufallsfehler schrumpft." },
    { lv: 4, ok: true, md: "Am breitesten wird das Intervall, wenn der geschätzte Anteil nahe $0{,}5$ liegt.", why: "$p(1 - p)$ ist bei $p = 0{,}5$ am größten." },
    { lv: 4, ok: false, md: "Liegt $0{,}5$ im $95\\,\\%$-Konfidenzintervall, ist bewiesen, dass der Anteil $0{,}5$ beträgt.", why: "Es heißt nur, dass $0{,}5$ mit den Daten verträglich ist, viele andere Werte auch." },
  ], { 4: ["spot", "multi", "tf"] }));

  // ================================================================ Laplace probabilities
  function prob(G, p, q, md, explain, hint) {
    const g = gcd(p, q);
    return Object.assign({ type: "numeric", md, answer: p / q, tolerance: 0.0006, placeholder: "Bruch oder Dezimalzahl", answerText: fracText(p, q), explain }, hint ? { hint } : {});
  }
  const DIE = [
    ["eine gerade Zahl", [2, 4, 6]], ["eine Primzahl", [2, 3, 5]], ["eine durch 3 teilbare Zahl", [3, 6]], ["keine Sechs", [1, 2, 3, 4, 5]],
    ["eine Zahl größer als 4", [5, 6]], ["höchstens eine 2", [1, 2]], ["eine Quadratzahl", [1, 4]], ["eine ungerade Zahl größer als 1", [3, 5]],
  ];
  const CARDS = [["eine Herzkarte", 8], ["einen Buben", 4], ["den Herzbuben", 1], ["eine Bildkarte (Bube, Dame oder König)", 12], ["eine rote Karte", 16], ["ein Ass oder einen König", 8]];
  LW.extend("stoch-laplace", {
    1: [(level, G) => {
      const kind = G.pick(["die", "sum", "urn", "cards"]);
      if (kind === "die") {
        const [txt, fav] = G.pick(DIE);
        return prob(G, fav.length, 6, "Ein fairer Würfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit für " + txt + "?", "Günstig: $\\{" + fav.join(", ") + "\\}$, also $P = \\tfrac{" + fav.length + "}{6}$.");
      }
      if (kind === "sum") {
        const s = G.int(2, 12), c = 6 - Math.abs(7 - s);
        return prob(G, c, 36, "Zwei faire Würfel werden geworfen. Wie groß ist die Wahrscheinlichkeit für die Augensumme $" + s + "$?", "Es gibt $36$ gleich wahrscheinliche Paare, davon haben $" + c + "$ die Summe $" + s + "$.", "Zähle die Paare $(a, b)$ mit $a + b = " + s + "$.");
      }
      if (kind === "urn") {
        const r = G.int(1, 8), b = G.int(1, 8);
        return prob(G, r, r + b, "In einer Urne liegen $" + r + "$ rote und $" + b + "$ blaue Kugeln. Wie groß ist die Wahrscheinlichkeit, eine rote zu ziehen?", "$P = \\tfrac{" + r + "}{" + (r + b) + "}$: günstige durch alle Kugeln.");
      }
      const [txt, c] = G.pick(CARDS);
      return prob(G, c, 32, "Aus einem Skatblatt ($32$ Karten: vier Farben, je $7$ bis Ass) wird eine Karte gezogen. Wie groß ist die Wahrscheinlichkeit für " + txt + "?", "$" + c + "$ günstige von $32$ Karten: $P = \\tfrac{" + c + "}{32}$.");
    }],
    3: [(level, G) => {
      if (G.chance(0.5)) {
        const n = G.int(2, 8), p = 1 - Math.pow(0.5, n);
        return Object.assign({ type: "numeric", md: "Eine faire Münze wird $" + n + "$-mal geworfen. Wie groß ist die Wahrscheinlichkeit, **mindestens einmal Kopf** zu werfen? (Bruch oder vier Nachkommastellen)",
          explain: "Gegenereignis: nie Kopf, $\\left(\\tfrac12\\right)^{" + n + "}$. Also $1 - \\tfrac{1}{" + Math.pow(2, n) + "} = \\tfrac{" + (Math.pow(2, n) - 1) + "}{" + Math.pow(2, n) + "}$." }, { answer: p, tolerance: 0.0006, answerText: fracText(Math.pow(2, n) - 1, Math.pow(2, n)), placeholder: "Bruch oder Dezimalzahl" });
      }
      const n = G.int(2, 8), p = 1 - Math.pow(5 / 6, n);
      return Object.assign({ type: "numeric", md: "Ein fairer Würfel wird $" + n + "$-mal geworfen. Wie groß ist die Wahrscheinlichkeit für **mindestens eine Sechs**? (vier Nachkommastellen)",
        explain: "Gegenereignis: keine Sechs, $\\left(\\tfrac56\\right)^{" + n + "} \\approx " + G.tex(Math.pow(5 / 6, n), 4) + "$. Also $1 - " + G.tex(Math.pow(5 / 6, n), 4) + " \\approx " + G.tex(p, 4) + "$." }, dec(G, p, 4));
    }],
    4: [(level, G) => {
      const kind = G.pick(["three", "max", "atleast"]);
      if (kind === "three") {
        const s = G.int(4, 17);
        let c = 0;
        for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let d = 1; d <= 6; d++) if (a + b + d === s) c++;
        return prob(G, c, 216, "Drei faire Würfel. Wie groß ist die Wahrscheinlichkeit für die **Augensumme " + s + "**? (Bruch oder vier Nachkommastellen)", "$" + c + "$ der $216$ Tripel haben die Summe $" + s + "$: $P = \\tfrac{" + c + "}{216}$.");
      }
      if (kind === "max") {
        const k = G.int(1, 6);
        return prob(G, 2 * k - 1, 36, "Zwei faire Würfel. Wie groß ist die Wahrscheinlichkeit, dass die **größere** der beiden Augenzahlen genau $" + k + "$ ist?", "$P(\\max \\le " + k + ") - P(\\max \\le " + (k - 1) + ") = \\tfrac{" + k * k + " - " + (k - 1) * (k - 1) + "}{36} = \\tfrac{" + (2 * k - 1) + "}{36}$.");
      }
      const s = G.int(7, 11);
      let c = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b >= s) c++;
      return prob(G, c, 36, "Zwei faire Würfel. Wie groß ist die Wahrscheinlichkeit für eine Augensumme von **mindestens " + s + "**?", "$" + c + "$ der $36$ Paare erreichen mindestens $" + s + "$.");
    }],
  });

  // ================================================================ estimating probabilities first
  function estimate(md, value, explain) {
    return { type: "estimate", md, min: 0, max: 100, answer: Math.round(value * 1000) / 10, tolerance: 10, unit: "%", start: 50, explain };
  }
  LW.extend("stoch-schaetzen", {
    1: [(level, G) => {
      const kind = G.pick(["coin", "pasch", "sum", "six"]);
      if (kind === "coin") { const n = G.int(2, 6), p = 1 - Math.pow(0.5, n); return estimate("Du wirfst eine Münze $" + n + "$-mal. **Wie wahrscheinlich ist mindestens einmal Kopf?** Erst schätzen, nicht rechnen.", p, "Gegenereignis nie Kopf: $\\left(\\tfrac12\\right)^{" + n + "}$, also $" + G.tex(p * 100, 1) + "\\,\\%$."); }
      if (kind === "pasch") return estimate("Du wirfst zwei Würfel. **Wie wahrscheinlich ist ein Pasch** (zweimal dieselbe Zahl)? Erst schätzen.", 1 / 6, "Der zweite Würfel muss den ersten treffen: $\\tfrac16 \\approx 16{,}7\\,\\%$.");
      if (kind === "sum") { const s = G.pick([8, 9, 10]); let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b >= s) c++; return estimate("Du wirfst zwei Würfel. **Wie wahrscheinlich ist eine Augensumme von mindestens " + s + "?** Erst schätzen.", c / 36, "$" + c + "$ von $36$ Paaren: $" + G.tex((c / 36) * 100, 1) + "\\,\\%$."); }
      const n = G.pick([1, 2, 3, 5, 8, 10]), p = 1 - Math.pow(5 / 6, n);
      return estimate("Du würfelst $" + n + "$-mal. **Wie wahrscheinlich ist mindestens eine Sechs?** Erst schätzen, nicht rechnen.", p, "Über das Gegenereignis: $1 - \\left(\\tfrac56\\right)^{" + n + "} \\approx " + G.tex(p, 3) + "$.");
    }],
    2: [(level, G) => {
      const kind = G.pick(["bday", "mine", "lotto"]);
      if (kind === "bday") {
        const n = G.int(10, 60);
        let q = 1;
        for (let i = 0; i < n; i++) q *= (365 - i) / 365;
        return estimate("In einem Raum sind $" + n + "$ Personen. **Wie wahrscheinlich haben mindestens zwei am selben Tag Geburtstag?** Erst schätzen.", 1 - q, "Gegenereignis alle verschieden: $\\tfrac{365}{365} \\cdot \\tfrac{364}{365} \\cdots \\tfrac{" + (366 - n) + "}{365} \\approx " + G.tex(q, 3) + "$, also $" + G.tex((1 - q) * 100, 1) + "\\,\\%$.");
      }
      if (kind === "mine") {
        const n = G.pick([20, 50, 100, 150, 253, 300]), p = 1 - Math.pow(364 / 365, n - 1);
        return estimate("In einer Gruppe von $" + n + "$ Personen: **Wie wahrscheinlich hat jemand am selben Tag Geburtstag wie du?** Erst schätzen.", p, "Jede der $" + (n - 1) + "$ anderen trifft deinen Tag mit $\\tfrac{1}{365}$: $1 - \\left(\\tfrac{364}{365}\\right)^{" + (n - 1) + "} \\approx " + G.tex(p, 3) + "$. Viel seltener als irgendein gemeinsamer Geburtstag.");
      }
      return estimate("Beim Lotto 6 aus 49: **Wie wahrscheinlich sind unter den sechs Gewinnzahlen mindestens zwei direkt aufeinanderfolgende** (wie 17 und 18)? Erst schätzen.", 1 - 7059052 / 13983816,
        "Ohne Nachbarn gibt es $\\binom{44}{6}$ von $\\binom{49}{6}$ Ziehungen, also $1 - \\tfrac{7\\,059\\,052}{13\\,983\\,816} \\approx 49{,}5\\,\\%$. Fast jede zweite Ziehung!");
    }],
  });

  // ================================================================ independence
  LW.extend("stoch-unabh", F.statements([
    { lv: 4, ok: false, md: "Zwei Ereignisse mit $P(A) > 0$ und $P(B) > 0$, die sich gegenseitig ausschließen, sind unabhängig.", why: "Dann ist $P(A \\cap B) = 0 \\ne P(A)P(B)$: Wer $A$ kennt, weiß, dass $B$ nicht eintrat." },
    { lv: 4, ok: true, md: "Sind $A$ und $B$ unabhängig, dann auch $A$ und $\\bar B$.", why: "$P(A \\cap \\bar B) = P(A) - P(A)P(B) = P(A)P(\\bar B)$." },
    { lv: 4, ok: true, md: "Ein Ereignis mit $P(A) = 0$ ist von jedem Ereignis unabhängig.", why: "$P(A \\cap B) = 0 = P(A)P(B)$." },
    { lv: 4, ok: false, md: "Aus paarweiser Unabhängigkeit dreier Ereignisse folgt ihre gemeinsame Unabhängigkeit.", why: "Zwei Münzen: $A$ = erste Kopf, $B$ = zweite Kopf, $C$ = beide gleich. Paarweise unabhängig, aber $P(A \\cap B \\cap C) = \\tfrac14 \\ne \\tfrac18$." },
    { lv: 4, ok: false, md: "Unabhängig heißt, dass $A$ und $B$ keine gemeinsamen Ergebnisse haben.", why: "Das ist Unvereinbarkeit. Unabhängig heißt $P(A \\cap B) = P(A)P(B)$." },
    { lv: 4, ok: true, md: "Bei zwei Würfen sind »erste Zahl gerade« und »Augensumme 7« unabhängig.", why: "$P = \\tfrac{3}{36} = \\tfrac12 \\cdot \\tfrac16$." },
    { lv: 4, ok: false, md: "Bei zwei Würfen sind »Augensumme 7« und »erste Zahl 6« abhängig.", why: "$P(\\text{beides}) = \\tfrac{1}{36} = \\tfrac16 \\cdot \\tfrac16$: unabhängig." },
    { lv: 4, ok: true, md: "Bei zwei Würfen sind »Augensumme 8« und »erste Zahl 6« abhängig.", why: "$P(\\text{beides}) = \\tfrac{1}{36}$, aber $\\tfrac{5}{36} \\cdot \\tfrac16 = \\tfrac{5}{216}$." },
    { lv: 4, ok: true, md: "Sind $A$ und $B$ unabhängig und $P(B) > 0$, dann ist $P(A \\mid B) = P(A)$.", why: "$P(A \\mid B) = \\tfrac{P(A)P(B)}{P(B)}$." },
  ], { 4: ["spot", "multi", "tf"] }));
})();
