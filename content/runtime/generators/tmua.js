// TMUA: tasks in English as in the test (multiple choice, options in a fixed order A to H), explanations in German.
// Level 1 practises the idea, level 4 is test level or above. Terms of LW.glossary can be tapped for the German word.
(function () {
  const inl = (t) => "$" + t + "$";
  const ROMAN = ["I", "II", "III", "IV", "V"];
  const COMBO = ["none of them", "I only", "II only", "III only", "I and II only", "I and III only", "II and III only", "I, II and III"];
  const LETTERS = "ABCDEFGH";

  Object.assign(LW.glossary, {
    "necessary": "notwendig", "sufficient": "hinreichend", "condition": "Bedingung", "statement": "Aussage", "statements": "Aussagen",
    "converse": "Umkehrung", "contrapositive": "Kontraposition", "negation": "Verneinung", "equivalent": "gleichwertig",
    "integer": "ganze Zahl", "integers": "ganze Zahlen", "positive integer": "positive ganze Zahl", "positive integers": "positive ganze Zahlen",
    "real number": "reelle Zahl", "real numbers": "reelle Zahlen", "rational": "rational", "prime": "Primzahl", "divisible": "teilbar",
    "multiple": "Vielfaches", "factor": "Faktor, Teiler", "digit": "Ziffer", "digits": "Ziffern", "sequence": "Folge", "series": "Reihe",
    "term": "Glied", "terms": "Glieder", "common ratio": "Quotient (geometrisch)", "common difference": "Differenz (arithmetisch)",
    "sum to infinity": "Grenzwert der Reihe", "recurring": "periodisch", "fraction": "Bruch", "inequality": "Ungleichung",
    "coefficient": "Koeffizient", "expansion": "Entwicklung (Ausmultiplizieren)", "solutions": "Lösungen", "estimate": "Schätzwert",
    "overestimate": "Überschätzung", "underestimate": "Unterschätzung", "trapezium rule": "Trapezregel", "strips": "Streifen",
    "chord": "Sehne", "tangent": "Tangente", "circumference": "Umfang, Kreislinie", "cyclic quadrilateral": "Sehnenviereck",
    "diameter": "Durchmesser", "major arc": "großer Bogen", "minor arc": "kleiner Bogen", "inclusive": "einschließlich",
    "at least": "mindestens", "at most": "höchstens", "distinct": "verschieden", "odd": "ungerade", "even": "gerade",
    "argument": "Argumentation", "line": "Zeile", "error": "Fehler", "if and only if": "genau dann, wenn", "only if": "nur dann, wenn",
    "for every": "für jedes", "there is": "es gibt", "such that": "sodass", "possible values": "mögliche Werte",
    "greatest": "größte", "least": "kleinste", "set": "Menge", "satisfies": "erfüllt", "lies": "liegt", "vertices": "Ecken", "centre": "Mittelpunkt",
  });

  function combo(truths) {
    const [a, b, c] = truths;
    const idx = a && b && c ? 7 : a && b ? 4 : a && c ? 5 : b && c ? 6 : a ? 1 : b ? 2 : c ? 3 : 0;
    return COMBO.map((md, i) => ({ md, correct: i === idx }));
  }
  const listed = (items) => items.map((s, i) => "**" + ROMAN[i] + "**  " + s).join("\n\n");
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
  /** fractions as [numerator, denominator], reduced, denominator positive */
  const fr = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); return [p / g, q / g]; };
  const fadd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const fsub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
  const fdiv = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  const ftex = (a) => (a[1] === 1 ? String(a[0]) : (a[0] < 0 ? "-" : "") + "\\frac{" + Math.abs(a[0]) + "}{" + a[1] + "}");
  /** numeric options, ascending and distinct, the correct one marked; at most n */
  function numeric(correct, wrong, show, n) {
    const key = (v) => (Array.isArray(v) ? v[0] / v[1] : v).toFixed(9);
    const seen = new Set([key(correct)]);
    const all = [{ v: correct, correct: true }];
    wrong.forEach((w) => { if (w == null || !isFinite(Array.isArray(w) ? w[0] / w[1] : w)) return; const k = key(w); if (seen.has(k) || all.length >= (n || 6)) return; seen.add(k); all.push({ v: w }); });
    const val = (x) => (Array.isArray(x.v) ? x.v[0] / x.v[1] : x.v);
    return all.sort((a, b) => val(a) - val(b)).map((x) => ({ md: show(x.v), correct: !!x.correct }));
  }
  const step = (md, options, explain) => ({ type: "choice", lang: "en", shuffle: false, md, options, explain });
  const answer = (options) => LETTERS[options.findIndex((o) => o.correct)];

  // ------------------------------------------------------------------ Etappe 1: implications over the reals
  function preds(a) {
    return [
      { tex: "x < " + a, set: "x < " + a, fn: (x) => x < a, not: "x \\ge " + a },
      { tex: "x > " + a, set: "x > " + a, fn: (x) => x > a, not: "x \\le " + a },
      { tex: "x^2 < " + a * a, set: "-" + a + " < x < " + a, fn: (x) => x * x < a * a, not: "x^2 \\ge " + a * a },
      { tex: "x^2 > " + a * a, set: "x < -" + a + " \\text{ oder } x > " + a, fn: (x) => x * x > a * a, not: "x^2 \\le " + a * a },
      { tex: "x^3 < x", set: "x < -1 \\text{ oder } 0 < x < 1", fn: (x) => x * x * x < x, not: "x^3 \\ge x" },
      { tex: "x^3 > x", set: "-1 < x < 0 \\text{ oder } x > 1", fn: (x) => x * x * x > x, not: "x^3 \\le x" },
      { tex: "x^2 < x", set: "0 < x < 1", fn: (x) => x * x < x, not: "x^2 \\ge x" },
      { tex: "x^2 > x", set: "x < 0 \\text{ oder } x > 1", fn: (x) => x * x > x, not: "x^2 \\le x" },
      { tex: "|x - 1| < " + a, set: 1 - a + " < x < " + (1 + a), fn: (x) => Math.abs(x - 1) < a, not: "|x - 1| \\ge " + a },
      { tex: "x > 0", set: "x > 0", fn: (x) => x > 0, not: "x \\le 0" },
    ];
  }
  const GRID = (() => { const g = []; for (let k = -6 * 64; k <= 6 * 64; k++) g.push(k / 64); return g; })();
  const NICE = [-2, -1, -0.5, 0.5, 2, 3, -3, 1, 0, 1.5, -1.5, 0.25, -0.25, 4, -4, 5, -5];
  function counterexample(P, Q) {
    for (const x of NICE.concat(GRID)) if (P(x) && !Q(x)) return x;
    return null;
  }
  const xs = (x) => (Number.isInteger(x) ? String(x) : x === 0.5 ? "\\tfrac{1}{2}" : x === -0.5 ? "-\\tfrac{1}{2}" : String(x).replace(".", "{,}"));

  LW.generator("tmua-implikation", {
    title: "Implications",
    make(level, G) {
      const a = level <= 1 ? 1 : G.pick(level === 2 ? [1, 2] : [2, 3]);
      const P = preds(a);
      for (let tries = 0; tries < 60; tries++) {
        const items = [];
        // level 3 and up: two statements are converses of each other, the classic trap
        if (level >= 3) {
          const [i, j] = G.pickN(P.map((_, k) => k), 2);
          items.push([P[i], P[j]], [P[j], P[i]]);
        }
        while (items.length < 3) {
          const [i, j] = G.pickN(P.map((_, k) => k), 2);
          let p = P[i], q = P[j];
          if (level >= 4 && G.chance(0.5)) { p = { tex: P[j].not, fn: (x) => !P[j].fn(x), set: null }; q = { tex: P[i].not, fn: (x) => !P[i].fn(x), set: null }; }
          items.push([p, q]);
        }
        const order = G.shuffle([0, 1, 2]);
        const st = order.map((k) => items[k]);
        const truths = st.map(([p, q]) => counterexample(p.fn, q.fn) === null);
        const n = truths.filter(Boolean).length;
        if ((level >= 2 && (n === 0 || n === 3)) || new Set(st.map(([p, q]) => p.tex + q.tex)).size < 3) continue;
        const md = "Which of the following statements is/are true for all real numbers $x$?\n\n" + listed(st.map(([p, q]) => "If " + inl(p.tex) + ", then " + inl(q.tex) + "."));
        const opts = combo(truths);
        const why = st.map(([p, q], k) => {
          const c = counterexample(p.fn, q.fn);
          if (c !== null) return "**" + ROMAN[k] + "** ist falsch: $x = " + xs(c) + "$ erfüllt " + inl(p.tex) + ", aber nicht " + inl(q.tex) + ".";
          return "**" + ROMAN[k] + "** ist wahr: " + (p.set && q.set ? inl(p.tex) + " heißt " + inl(p.set) + ", und dort gilt immer " + inl(q.tex) + " (also " + inl(q.set) + ")." : "Es gibt kein $x$, das die Voraussetzung erfüllt und die Folgerung verletzt; prüfe die Grenzen einzeln.");
        });
        return step(md, opts, "**" + answer(opts) + ".** " + why.join(" ") + " Eine Implikation ist nur falsch, wenn die Voraussetzung gilt und die Folgerung nicht. Bei Allaussagen zuerst negative Zahlen und Zahlen zwischen 0 und 1 testen.");
      }
      return step("Which of the following statements is/are true for all real numbers $x$?\n\n" + listed(["If $x < 1$, then $x^2 < 1$.", "If $x^2 < 1$, then $x < 1$.", "If $x^3 < x$, then $x < 1$."]), combo([false, true, true]), "**G.** I scheitert an $x = -2$, II und III sind wahr.");
    },
  });

  // ------------------------------------------------------------------ Etappe 2: necessary and sufficient
  const NS = [[48, { 2: 4, 3: 1 }], [72, { 2: 3, 3: 2 }], [200, { 2: 3, 5: 2 }], [108, { 2: 2, 3: 3 }], [50, { 2: 1, 5: 2 }], [180, { 2: 2, 3: 2, 5: 1 }],
    [96, { 2: 5, 3: 1 }], [80, { 2: 4, 5: 1 }], [162, { 2: 1, 3: 4 }], [24, { 2: 3, 3: 1 }], [250, { 2: 1, 5: 3 }], [360, { 2: 3, 3: 2, 5: 1 }]];
  const divisors = (m) => { const d = []; for (let k = 2; k <= m; k++) if (m % k === 0) d.push(k); return d; };
  LW.generator("tmua-bedingung", {
    title: "Necessary and sufficient",
    make(level, G) {
      const k = level >= 4 && G.chance(0.5) ? 3 : 2;
      const [N, f] = G.pick(NS.filter(([n]) => (k === 3 ? [24, 72, 48, 250, 108, 360].includes(n) : true)));
      let m0 = 1;
      Object.keys(f).forEach((p) => { m0 *= Math.pow(+p, Math.ceil(f[p] / k)); });
      const kind = level <= 1 ? "nas" : G.pick(["nns", "nns", "snn", "nas"]);
      const cls = (d) => (d === m0 ? "nas" : m0 % d === 0 ? "nns" : d % m0 === 0 ? "snn" : "none");
      const pool = { nas: [m0], nns: divisors(m0).filter((d) => d !== m0), snn: [2 * m0, 3 * m0, N, 2 * N, m0 * 5].filter((d, i, a) => a.indexOf(d) === i && d !== m0), none: [] };
      for (let d = 2; d <= 3 * m0 && pool.none.length < 8; d++) if (cls(d) === "none") pool.none.push(d);
      if (!pool[kind].length) return step("Let $n$ be a positive integer. Which one of the following is a necessary and sufficient condition for $n^2$ to be divisible by 48?", numeric(12, [6, 8, 24, 48, 9], (d) => "$n$ is divisible by $" + d + "$"), "**12** ist notwendig und hinreichend.");
      const right = G.pick(pool[kind]);
      const others = G.shuffle(["nas", "nns", "snn", "none"].filter((c) => c !== kind).flatMap((c) => G.shuffle(pool[c]).slice(0, 2)));
      const opts = numeric(right, others, (d) => "$n$ is divisible by $" + d + "$", 6);
      const ask = { nas: "a **necessary and sufficient**", nns: "a **necessary but not sufficient**", snn: "a **sufficient but not necessary**" }[kind];
      const fac = Object.keys(f).map((p) => p + (f[p] > 1 ? "^{" + f[p] + "}" : "")).join(" \\cdot ");
      const mfac = Object.keys(f).map((p) => { const e = Math.ceil(f[p] / k); return p + (e > 1 ? "^{" + e + "}" : ""); }).join(" \\cdot ");
      const why = "Zuerst die Bedingung selbst: $" + N + " = " + fac + "$. Jeder Primfaktor steht in $n^" + k + "$ " + (k === 2 ? "doppelt" : "dreifach") + " so oft wie in $n$, also ist $n^" + k + "$ genau dann durch " + N +
        " teilbar, wenn $" + mfac + " = " + m0 + "$ ein Teiler von $n$ ist. Damit: Teiler von " + m0 + " sind **notwendig** (sie folgen aus der Bedingung), Vielfache von " + m0 + " sind **hinreichend**, " + m0 + " selbst ist beides.";
      return step("Let $n$ be a positive integer. Which one of the following is " + ask + " condition for $n^" + k + "$ to be divisible by $" + N + "$?", opts, "**" + answer(opts) + ".** " + why + " Die Falle: aus der Teilbarkeit von $n^" + k + "$ durch eine Primzahlpotenz auf dieselbe Potenz bei $n$ zu schließen.");
    },
  });

  // ------------------------------------------------------------------ Etappen 2 and 5: equivalent reformulations
  const CONDS = [
    { p: "it rains", q: "the match is cancelled", np: "it does not rain", nq: "the match is not cancelled" },
    { p: "$n$ is divisible by 6", q: "$n$ is even", np: "$n$ is not divisible by 6", nq: "$n$ is odd" },
    { p: "a quadrilateral is a square", q: "its diagonals are perpendicular", np: "a quadrilateral is not a square", nq: "its diagonals are not perpendicular" },
    { p: "$x > 2$", q: "$x^2 > 4$", np: "$x \\le 2$", nq: "$x^2 \\le 4$" },
    { p: "Sam passes the exam", q: "Sam revised", np: "Sam does not pass the exam", nq: "Sam did not revise" },
    { p: "$n^2$ is odd", q: "$n$ is odd", np: "$n^2$ is even", nq: "$n$ is even" },
    { p: "the function $f$ is differentiable at $a$", q: "$f$ is continuous at $a$", np: "$f$ is not differentiable at $a$", nq: "$f$ is not continuous at $a$" },
  ];
  const cap = (s) => (s[0] === "$" ? s : s[0].toUpperCase() + s.slice(1));
  const FORMS = [
    { lv: 1, eq: true, f: (c) => "If " + c.nq + ", then " + c.np + ".", why: "die Kontraposition, gleichwertig" },
    { lv: 1, eq: false, f: (c) => "If " + c.q + ", then " + c.p + ".", why: "die Umkehrung, nicht gleichwertig" },
    { lv: 1, eq: false, f: (c) => "If " + c.np + ", then " + c.nq + ".", why: "die Kontraposition der Umkehrung, also nicht gleichwertig" },
    { lv: 2, eq: true, f: (c) => cap(c.q) + " is a necessary condition for " + c.p + ".", why: "„Q ist notwendig für P“ heißt P ⇒ Q, gleichwertig" },
    { lv: 2, eq: false, f: (c) => cap(c.p) + " is a necessary condition for " + c.q + ".", why: "heißt Q ⇒ P, die Umkehrung" },
    { lv: 2, eq: true, f: (c) => cap(c.p) + " is a sufficient condition for " + c.q + ".", why: "„P ist hinreichend für Q“ heißt P ⇒ Q, gleichwertig" },
    { lv: 3, eq: true, f: (c) => cap(c.p) + " only if " + c.q + ".", why: "„P nur dann, wenn Q“ heißt P ⇒ Q, gleichwertig" },
    { lv: 3, eq: false, f: (c) => cap(c.q) + " only if " + c.p + ".", why: "heißt Q ⇒ P, die Umkehrung" },
    { lv: 3, eq: false, f: (c) => cap(c.p) + " if " + c.q + ".", why: "„P, wenn Q“ heißt Q ⇒ P, die Umkehrung" },
    { lv: 4, eq: true, f: (c) => "It is not the case that " + c.p + " and " + c.nq + ".", why: "verneint genau den einzigen Fall, in dem P ⇒ Q falsch ist, also gleichwertig" },
    { lv: 4, eq: true, f: (c) => "Either " + c.np + ", or " + c.q + " (or both).", why: "„nicht P oder Q“ ist gleichwertig zu P ⇒ Q" },
    { lv: 4, eq: false, f: (c) => cap(c.p) + " if and only if " + c.q + ".", why: "behauptet zusätzlich die Umkehrung, also stärker" },
  ];
  LW.generator("tmua-umformung", {
    title: "Equivalent statements",
    make(level, G) {
      const c = G.pick(CONDS);
      const forms = FORMS.filter((x) => x.lv <= level);
      let picked;
      for (let t = 0; t < 30; t++) { picked = G.pickN(forms, 3); const n = picked.filter((x) => x.eq).length; if (level <= 1 || (n > 0 && n < 3) || t > 25) break; }
      const opts = combo(picked.map((x) => x.eq));
      const md = "Consider the statement:\n\n*If " + c.p + ", then " + c.q + ".*\n\nWhich of the following is/are equivalent to this statement?\n\n" + listed(picked.map((x) => x.f(c)));
      return step(md, opts, "**" + answer(opts) + ".** " + picked.map((x, k) => "**" + ROMAN[k] + "** ist " + x.why + ".").join(" ") + " Merke: gleichwertig zu P ⇒ Q sind die Kontraposition, „P nur dann, wenn Q“, „Q notwendig für P“ und „P hinreichend für Q“.");
    },
  });

  // ------------------------------------------------------------------ Etappe 4: quantifiers
  const QS = [
    { lv: 1, s: "For every real number $x$, there is a real number $y$ such that $y > x$.", t: true, why: "Wähle $y = x + 1$." },
    { lv: 1, s: "There is a real number $y$ such that $y > x$ for every real number $x$.", t: false, why: "Kein $y$ ist größer als alle reellen Zahlen, etwa nicht größer als $y + 1$." },
    { lv: 1, s: "There is a real number $x$ such that $x^2 < x$.", t: true, why: "$x = \\tfrac12$ liefert $\\tfrac14 < \\tfrac12$." },
    { lv: 2, s: "For every real number $x$, there is a real number $y$ such that $y^2 = x$.", t: false, why: "Für $x = -1$ gibt es kein reelles $y$ mit $y^2 = -1$." },
    { lv: 2, s: "For every real number $x$, there is a real number $y$ such that $y^3 = x$.", t: true, why: "Die dritte Wurzel existiert für jede reelle Zahl." },
    { lv: 2, s: "There is a real number $y$ such that $xy = 0$ for every real number $x$.", t: true, why: "$y = 0$ leistet das." },
    { lv: 2, s: "For every real number $x$, there is a real number $y$ such that $xy = 1$.", t: false, why: "Für $x = 0$ ist $xy = 0$." },
    { lv: 3, s: "For every non-zero real number $x$, there is a real number $y$ such that $xy = 1$.", t: true, why: "$y = \\frac{1}{x}$." },
    { lv: 3, s: "There is a positive integer $n$ such that $n^2 > m$ for every positive integer $m$.", t: false, why: "Für $m = n^2$ selbst gilt $n^2 > m$ nicht." },
    { lv: 3, s: "For every positive integer $m$, there is a positive integer $n$ such that $n^2 > m$.", t: true, why: "Wähle $n = m + 1$." },
    { lv: 3, s: "There is an integer $k$ such that $k + j$ is even for every integer $j$.", t: false, why: "$k + 0$ und $k + 1$ können nicht beide gerade sein." },
    { lv: 3, s: "For every integer $j$, there is an integer $k$ such that $k + j$ is even.", t: true, why: "Wähle $k = j$, dann ist $k + j = 2j$." },
    { lv: 4, s: "For every positive real number $\\varepsilon$, there is a positive integer $n$ such that $\\frac{1}{n} < \\varepsilon$.", t: true, why: "Wähle eine ganze Zahl $n > \\frac{1}{\\varepsilon}$." },
    { lv: 4, s: "There is a positive integer $n$ such that $\\frac{1}{n} < \\varepsilon$ for every positive real number $\\varepsilon$.", t: false, why: "Für $\\varepsilon = \\frac{1}{n}$ gilt $\\frac1n < \\varepsilon$ nicht." },
    { lv: 4, s: "For all real numbers $a < b$, there is a rational number $q$ with $a < q < b$.", t: true, why: "Zwischen zwei reellen Zahlen liegt immer eine rationale (Dichtheit)." },
    { lv: 4, s: "There is a real number $x$ such that $x^2 + y^2 > 1$ for every real number $y$.", t: true, why: "$x = 2$: dann ist $x^2 + y^2 \\ge 4$." },
    { lv: 4, s: "For every real number $y$, there is a real number $x$ such that $x^2 + y^2 < 1$.", t: false, why: "Für $y = 1$ ist $x^2 + 1 \\ge 1$." },
  ];
  LW.generator("tmua-quantoren", {
    title: "Quantifiers",
    make(level, G) {
      const pool = QS.filter((q) => q.lv <= level + 1);
      let st;
      for (let t = 0; t < 30; t++) { st = G.pickN(pool, 3); const n = st.filter((q) => q.t).length; if ((n > 0 && n < 3) || t > 25) break; }
      const opts = combo(st.map((q) => q.t));
      return step("Which of the following statements is/are true?\n\n" + listed(st.map((q) => q.s)), opts,
        "**" + answer(opts) + ".** " + st.map((q, k) => "**" + ROMAN[k] + "** ist " + (q.t ? "wahr" : "falsch") + ": " + q.why).join(" ") + " Die Reihenfolge entscheidet: „für jedes x gibt es ein y“ darf y von x abhängen lassen, „es gibt ein y für jedes x“ verlangt ein einziges y für alle.");
    },
  });

  // ------------------------------------------------------------------ Etappe 5: negation
  const NEG = [
    { lv: 1, s: "Every student in the class owns a calculator.", right: "At least one student in the class does not own a calculator.",
      wrong: ["No student in the class owns a calculator.", "Every student in the class does not own a calculator.", "At least one student in the class owns a calculator.", "Exactly one student in the class does not own a calculator."] },
    { lv: 1, s: "All of the numbers $a$, $b$ and $c$ are positive.", right: "At least one of the numbers $a$, $b$ and $c$ is zero or negative.",
      wrong: ["All of the numbers $a$, $b$ and $c$ are negative.", "None of the numbers $a$, $b$ and $c$ is positive.", "At least one of the numbers $a$, $b$ and $c$ is negative.", "Exactly one of the numbers $a$, $b$ and $c$ is not positive."] },
    { lv: 2, s: "For every real number $x$ with $x > 0$, $f(x) > 1$.", right: "There is a real number $x$ with $x > 0$ and $f(x) \\le 1$.",
      wrong: ["For every real number $x$ with $x > 0$, $f(x) \\le 1$.", "There is a real number $x$ with $x \\le 0$ and $f(x) \\le 1$.", "There is a real number $x$ with $x > 0$ and $f(x) < 1$.", "For every real number $x$ with $x \\le 0$, $f(x) \\le 1$."] },
    { lv: 2, s: "There is a prime number $p$ such that $p + 2$ is also prime.", right: "For every prime number $p$, the number $p + 2$ is not prime.",
      wrong: ["There is a prime number $p$ such that $p + 2$ is not prime.", "For every number $p$ that is not prime, $p + 2$ is prime.", "For every prime number $p$, the number $p + 2$ is prime.", "There is a number $p$ that is not prime such that $p + 2$ is not prime."] },
    { lv: 3, s: "For every integer $n$, if $n$ is even, then $n^2$ is divisible by 8.", right: "There is an even integer $n$ such that $n^2$ is not divisible by 8.",
      wrong: ["For every integer $n$, if $n$ is odd, then $n^2$ is not divisible by 8.", "For every integer $n$, if $n$ is even, then $n^2$ is not divisible by 8.", "There is an odd integer $n$ such that $n^2$ is divisible by 8.", "For every integer $n$, if $n^2$ is not divisible by 8, then $n$ is odd."] },
    { lv: 3, s: "Whenever it is sunny, Ann goes swimming or plays tennis.", right: "On at least one sunny day, Ann neither goes swimming nor plays tennis.",
      wrong: ["Whenever it is not sunny, Ann neither goes swimming nor plays tennis.", "On at least one sunny day, Ann does not go swimming or does not play tennis.", "Whenever it is sunny, Ann neither goes swimming nor plays tennis.", "On at least one day that is not sunny, Ann goes swimming or plays tennis."] },
    { lv: 4, s: "For every $\\varepsilon > 0$ there is an $N$ such that $|a_n| < \\varepsilon$ for all $n > N$.", right: "There is an $\\varepsilon > 0$ such that for every $N$ there is an $n > N$ with $|a_n| \\ge \\varepsilon$.",
      wrong: ["For every $\\varepsilon > 0$ there is an $N$ such that $|a_n| \\ge \\varepsilon$ for all $n > N$.", "There is an $\\varepsilon > 0$ and an $N$ such that $|a_n| \\ge \\varepsilon$ for all $n > N$.", "For every $\\varepsilon > 0$ and every $N$ there is an $n > N$ with $|a_n| \\ge \\varepsilon$.", "There is an $\\varepsilon > 0$ such that for every $N$, $|a_n| \\ge \\varepsilon$ for all $n > N$."] },
    { lv: 4, s: "Every positive integer can be written as the sum of at most four square numbers.", right: "Some positive integer cannot be written as the sum of four or fewer square numbers.",
      wrong: ["No positive integer can be written as the sum of at most four square numbers.", "Every positive integer can be written as the sum of at least five square numbers.", "Some positive integer can be written as the sum of five or more square numbers.", "Some positive integer needs exactly five square numbers."] },
  ];
  LW.generator("tmua-negation", {
    title: "Negation",
    make(level, G) {
      const q = G.pick(NEG.filter((x) => x.lv <= level + 1));
      const opts = G.shuffle([{ md: q.right, correct: true }].concat(q.wrong.map((w) => ({ md: w })))).map((o) => ({ md: o.md, correct: !!o.correct }));
      return step("Which one of the following is the **negation** of the statement\n\n*" + q.s + "*", opts,
        "**" + answer(opts) + ".** Verneinen heißt: „für alle“ wird zu „es gibt“ (und umgekehrt), die innere Aussage wird verneint, „oder“ wird zu „weder noch“, „wenn P, dann Q“ zu „P und nicht Q“. Die Verneinung ist richtig, wenn genau eine von Aussage und Verneinung wahr ist, in jeder denkbaren Lage.");
    },
  });

  // ------------------------------------------------------------------ Etappe 5: parameter questions
  LW.generator("tmua-parameter", {
    title: "For which values?",
    make(level, G) {
      const form = level <= 1 ? 0 : G.pick(level >= 4 ? [0, 1, 2, 2] : [0, 1, 2]);
      if (form === 2) {
        const r = G.pick([2, 3, 4]), k = r * r;
        const opts = [`$a \\ge ${r}$`, `$a > ${r}$`, `$a \\ge ${k}$`, `$a \\le -${r}$ or $a \\ge ${r}$`, `$a \\ge 0$`, `$a > ${k}$`].map((md, i) => ({ md, correct: i === 0 }));
        return step("Consider the statement: *for all real numbers $x$ with $x > a$, we have $x^2 > " + k + "$.* For which values of the real number $a$ is the statement true?", opts,
          "**A.** Ist $a < 0$, liegt $x = 0$ im Bereich, und $0 > " + k + "$ ist falsch. Für $a \\ge 0$ sind alle $x > a$ positiv, und $x^2$ kommt $a^2$ beliebig nahe: nötig ist $a^2 \\ge " + k + "$, also $a \\ge " + r + "$. Am Rand $a = " + r + "$ gilt $x > " + r + "$, also $x^2 > " + k + "$: wahr, daher $\\ge$ und nicht $>$.");
      }
      const k = G.pick([2, 3, 4, 5, 6, 8]);
      const strict = form === 0 ? G.chance(0.5) : true;
      if (form === 0) {
        const rel = strict ? ">" : "\\ge";
        const opts = [`$a \\ge ${k}$ only`, `$a \\le 0$ or $a \\ge ${k}$`, `$a < 0$ or $a > ${k}$`, `$0 \\le a \\le ${k}$`, `$a \\ge 0$`, `all real values of $a$`].map((md, i) => ({ md, correct: i === 1 }));
        return step("Consider the statement: *for all real numbers $x$ with $x > a$, we have $x^2 " + rel + " " + k + "a$.* For which values of the real number $a$ is the statement true?", opts,
          "**B.** Fallunterscheidung nach $a$. Für $a < 0$ ist $" + k + "a < 0 \\le x^2$, also wahr. Für $a = 0$ folgt aus $x > 0$ sofort $x^2 > 0$. Für $a > 0$ sind alle $x$ positiv und $x^2$ kommt $a^2$ beliebig nahe, also braucht es $a^2 \\ge " + k + "a$, d. h. $a \\ge " + k + "$. Am Rand $a = " + k + "$: $x > " + k + "$ gibt $x^2 > " + k * k + " = " + k + "a$, wahr. Typische Fehler: nur $a > 0$ betrachten (A) oder die Ränder falsch setzen (C).");
      }
      const opts = [`$a \\le 0$`, `$a < 0$`, `$a \\ge ${k}$`, `$a \\le 0$ or $a \\ge ${k}$`, `$0 \\le a \\le ${k}$`, `no real value of $a$`].map((md, i) => ({ md, correct: i === 0 }));
      return step("Consider the statement: *for all real numbers $x$ with $x < a$, we have $x^2 > " + k + "a$.* For which values of the real number $a$ is the statement true?", opts,
        "**A.** Für $a > 0$ liegt $x = 0$ im Bereich, und $0 > " + k + "a$ ist falsch. Für $a < 0$ ist $" + k + "a < 0 < x^2$. Für $a = 0$ sind alle $x$ negativ, also $x^2 > 0$: wahr. Also genau $a \\le 0$.");
    },
  });

  // ------------------------------------------------------------------ Etappe 6: counting
  LW.generator("tmua-abzaehlen", {
    title: "Counting",
    make(level, G) {
      const form = level <= 1 ? 0 : G.pick(level === 2 ? [0, 2] : [0, 1, 2]);
      if (form === 0) {
        const m = G.pick(level <= 1 ? [3] : [3, 4]), d = G.int(1, 9), ans = Math.pow(10, m) - Math.pow(9, m);
        const opts = numeric(ans, [ans - 1, ans + 1, m * Math.pow(9, m - 1), Math.pow(9, m), m * Math.pow(10, m - 1)], String);
        return step("How many positive integers less than $" + Math.pow(10, m) + "$ contain at least one digit " + d + "?", opts,
          "**" + answer(opts) + ".** Über das Gegenteil zählen: Schreibe die Zahlen von 0 bis " + (Math.pow(10, m) - 1) + " als " + m + "-stellige Ziffernfolgen mit führenden Nullen. Ohne Ziffer " + d + " gibt es $9^" + m + " = " + Math.pow(9, m) + "$ Folgen, darunter die Null. Also " + (Math.pow(9, m) - 1) + " positive Zahlen ohne " + d + " und $" + (Math.pow(10, m) - 1) + " - " + (Math.pow(9, m) - 1) + " = " + ans + "$ mit mindestens einer " + d + ". Die Nachbarwerte sind die typischen Fehler um eins.");
      }
      if (form === 1) {
        const d = G.pick([0, G.int(1, 9)]), without = d === 0 ? Math.pow(9, 4) : 8 * Math.pow(9, 3), ans = 9000 - without;
        const opts = numeric(ans, [10000 - Math.pow(9, 4), 9000 - Math.pow(9, 4), 9000 - 8 * Math.pow(9, 3), 4 * Math.pow(9, 3), ans + 1, ans - 1].filter((x) => x !== ans), String);
        return step("How many integers from 1000 to 9999 inclusive contain at least one digit " + d + "?", opts,
          "**" + answer(opts) + ".** Insgesamt 9000 Zahlen. Ohne Ziffer " + d + ": " + (d === 0 ? "jede der vier Stellen hat 9 Möglichkeiten (1 bis 9), also $9^4 = " + without + "$." : "die erste Stelle hat 8 Möglichkeiten (nicht 0 und nicht " + d + "), die übrigen je 9, also $8 \\cdot 9^3 = " + without + "$.") + " Bleiben $9000 - " + without + " = " + ans + "$. Die führende Stelle darf nie 0 sein: genau das macht den Unterschied zwischen den Fällen.");
      }
      const N = G.pick([100, 200, 300, 500, 1000]);
      if (level >= 4) {
        const f = (k) => Math.floor(N / k);
        const ans = N - (f(2) + f(3) + f(5) - f(6) - f(10) - f(15) + f(30));
        const opts = numeric(ans, [N - (f(2) + f(3) + f(5)), N - (f(2) + f(3) + f(5) - f(6) - f(10) - f(15)), f(2) + f(3) + f(5) - f(6) - f(10) - f(15) + f(30), ans + 1, ans - 1], String);
        return step("How many integers from 1 to " + N + " inclusive are divisible by none of 2, 3 and 5?", opts,
          "**" + answer(opts) + ".** Siebformel: durch 2, 3 oder 5 teilbar sind $" + f(2) + " + " + f(3) + " + " + f(5) + " - " + f(6) + " - " + f(10) + " - " + f(15) + " + " + f(30) + " = " + (N - ans) + "$ Zahlen, also bleiben " + ans + ". Wer die Paare nicht abzieht oder das Tripel vergisst, landet bei den Nachbaroptionen.");
      }
      const [p, q] = G.pick([[3, 5], [4, 6], [6, 9], [3, 7], [4, 10]]);
      const l = (p * q) / gcd(p, q), ans = Math.floor(N / p) + Math.floor(N / q) - Math.floor(N / l);
      const opts = numeric(ans, [Math.floor(N / p) + Math.floor(N / q), Math.floor(N / p) + Math.floor(N / q) - Math.floor(N / (p * q)), ans - Math.floor(N / l), N - ans, ans + 1], String);
      return step("How many integers from 1 to " + N + " inclusive are divisible by " + p + " or by " + q + " (or both)?", opts,
        "**" + answer(opts) + ".** $" + Math.floor(N / p) + " + " + Math.floor(N / q) + " - " + Math.floor(N / l) + " = " + ans + "$: die gemeinsamen Vielfachen sind die Vielfachen des **kgV** " + l + (l !== p * q ? " (nicht " + p * q + ")" : "") + ", sie werden sonst doppelt gezählt.");
    },
  });

  // ------------------------------------------------------------------ Etappe 6: recurring decimals
  LW.generator("tmua-dezimal", {
    title: "Recurring decimals",
    make(level, G) {
      for (let t = 0; t < 50; t++) {
        const k = level <= 1 ? 0 : G.pick(level === 2 ? [0, 1] : [1, 2]);
        const r = level <= 1 ? G.pick([1, 2]) : G.pick([1, 2, 3]);
        const p = k ? G.int(Math.pow(10, k - 1) === 1 ? 0 : 1, Math.pow(10, k) - 1) : 0;
        const q = G.int(1, Math.pow(10, r) - 2);
        const qs = String(q).padStart(r, "0"), ps = k ? String(p).padStart(k, "0") : "";
        if (r > 1 && new Set(qs).size === 1) continue;
        if (r === 3 && qs[0] === qs[2] && qs[1] === qs[0]) continue;
        if (k && ps[k - 1] === qs[r - 1]) continue;
        const whole = parseInt(ps + qs, 10), head = k ? p : 0;
        const val = fr(whole - head, Math.pow(10, k) * (Math.pow(10, r) - 1));
        const dots = qs.length === 1 ? "\\dot{" + qs + "}" : "\\dot{" + qs[0] + "}" + qs.slice(1, -1) + "\\dot{" + qs[qs.length - 1] + "}";
        const tex = "0." + ps + dots;
        const shown = "0." + ps + qs + qs + qs.slice(0, 2) + "\\ldots";
        const wrong = [fr(whole, Math.pow(10, k) * (Math.pow(10, r) - 1)), fr(q, Math.pow(10, r) - 1), fr(whole - head, Math.pow(10, k + r)), fr(whole - head, Math.pow(10, k) * Math.pow(10, r) - 1), fr(q, Math.pow(10, k) * Math.pow(10, r))];
        const opts = numeric(val, wrong.filter((w) => w[0] * val[1] !== val[0] * w[1]), (x) => inl(ftex(x)), 5);
        return step("Which one of the following is equal to $" + tex + "$ (that is, $" + shown + "$)?", opts,
          "**" + answer(opts) + ".** Setze $x = " + tex + "$. Mit $10^{" + (k + r) + "}$ und $10^{" + k + "}$ malnehmen verschiebt die Periode so, dass sie sich abzieht: $" + Math.pow(10, k + r) + "x - " + Math.pow(10, k) + "x = " + (whole - head) + "$, also $x = \\frac{" + (whole - head) + "}{" + Math.pow(10, k) * (Math.pow(10, r) - 1) + "} = " + ftex(val) + "$. Typische Fehler: den Vorlauf nicht abziehen oder die Periode als endliche Dezimalzahl behandeln.");
      }
      return step("Which one of the following is equal to $0.1\\dot{3}\\dot{6}$?", numeric([3, 22], [[136, 999], [136, 990], [4, 11], [17, 125]], (x) => inl(ftex(x))), "$\\frac{135}{990} = \\frac{3}{22}$.");
    },
  });

  // ------------------------------------------------------------------ Etappe 6: bounds
  LW.generator("tmua-schranken", {
    title: "Bounds",
    make(level, G) {
      const iv = (neg) => { const a = neg ? -G.int(1, 5) : G.int(1, 4); return [a, a + G.int(2, 5)]; };
      const [a, b] = iv(level >= 3 ? G.chance(0.6) : false);
      const [c, d] = iv(level >= 2);
      const kind = level <= 2 ? G.pick(["xy", "x-y"]) : level === 3 ? G.pick(["xy", "x-y", "sq"]) : G.pick(["xy", "sq", "xsq"]);
      let lo, hi, wrong, expr, why;
      if (kind === "xy") {
        const prods = [a * c, a * d, b * c, b * d];
        lo = Math.min(...prods); hi = Math.max(...prods); expr = "xy";
        wrong = [[a * c, b * d], [Math.min(a * c, b * d), Math.max(a * d, b * c)], [lo, Math.max(a * c, b * d)], [Math.min(a * d, b * c), hi]];
        why = "Das Produkt nimmt seine Extremwerte an den Ecken an: $" + prods.join(", ") + "$. Kleinster und größter dieser vier Werte begrenzen $xy$; einfach „unten mal unten, oben mal oben“ zu rechnen geht schief, sobald negative Zahlen vorkommen.";
      } else if (kind === "x-y") {
        lo = a - d; hi = b - c; expr = "x - y";
        wrong = [[a - c, b - d], [a - c, b - c], [b - d, a - c].sort((m, n) => m - n), [lo, b - d]];
        why = "Am kleinsten wird $x - y$ mit kleinstem $x$ und größtem $y$: $" + a + " - (" + d + ") = " + lo + "$; am größten mit größtem $x$ und kleinstem $y$: $" + b + " - (" + c + ") = " + hi + "$.";
      } else {
        const sq = (u, v) => [u <= 0 && v >= 0 ? 0 : Math.min(u * u, v * v), Math.max(u * u, v * v)];
        const X = sq(a, b), Y = sq(c, d);
        if (kind === "sq") { lo = X[0] + Y[0]; hi = X[1] + Y[1]; expr = "x^2 + y^2"; wrong = [[a * a + c * c, b * b + d * d], [Math.min(a * a, b * b) + Math.min(c * c, d * d), hi], [lo, a * a + c * c], [lo + 1, hi]]; }
        else { lo = X[0] - Y[1]; hi = X[1] - Y[0]; expr = "x^2 - y^2"; wrong = [[a * a - c * c, b * b - d * d], [X[0] - Y[0], X[1] - Y[1]], [Math.min(a * a, b * b) - Y[1], hi], [lo, X[1] - Y[1]]]; }
        why = "Quadrate sind nicht monoton: liegt 0 im Intervall, ist das kleinste Quadrat 0. Hier: $x^2$ zwischen $" + X[0] + "$ und $" + X[1] + "$, $y^2$ zwischen $" + Y[0] + "$ und $" + Y[1] + "$; dann ergibt sich $" + lo + " \\le " + expr + " \\le " + hi + "$.";
      }
      const show = (pair) => "$" + pair[0] + " \\le " + expr + " \\le " + pair[1] + "$";
      const seen = new Set([lo + "," + hi]);
      const opts = [{ md: show([lo, hi]), correct: true, k: lo * 1000 + hi }];
      wrong.forEach((w) => { const s = Math.min(w[0], w[1]) + "," + Math.max(w[0], w[1]); if (seen.has(s) || opts.length >= 5) return; seen.add(s); opts.push({ md: show([Math.min(w[0], w[1]), Math.max(w[0], w[1])]), k: Math.min(w[0], w[1]) * 1000 + Math.max(w[0], w[1]) }); });
      const sorted = opts.sort((m, n) => m.k - n.k).map((o) => ({ md: o.md, correct: !!o.correct }));
      return step("The real numbers $x$ and $y$ satisfy $" + a + " \\le x \\le " + b + "$ and $" + c + " \\le y \\le " + d + "$. Which one of the following describes the set of all possible values of $" + expr + "$?", sorted, "**" + answer(sorted) + ".** " + why);
    },
  });

  // ------------------------------------------------------------------ Etappe 9: recursive sequences
  LW.generator("tmua-folgen", {
    title: "Recursive sequences",
    make(level, G) {
      const form = level <= 1 ? 2 : G.pick(level >= 3 ? [0, 1, 0, 1, 2] : [0, 2]);
      if (form === 2) {
        const a = G.pick([2, 3]), b = G.pick([1, -1, 2]), u1 = G.pick([1, 2, 3]), n = G.pick([6, 7, 8]);
        let u = u1; const seq = [u];
        for (let i = 1; i < n; i++) { u = a * u + b; seq.push(u); }
        const opts = numeric(seq[n - 1], [seq[n - 2], a * seq[n - 1] + b, seq[n - 1] + b, Math.pow(a, n - 1) * u1, seq[n - 1] - b], String);
        return step("A sequence is defined by $u_1 = " + u1 + "$ and $u_{n+1} = " + a + "u_n " + (b < 0 ? "- " + -b : "+ " + b) + "$ for $n \\ge 1$. What is the value of $u_{" + n + "}$?", opts,
          "**" + answer(opts) + ".** Glied für Glied: $" + seq.join(", ") + "$. Vorsicht beim Zählen: $u_1$ ist das erste Glied, $u_{" + n + "}$ also das " + n + ".");
      }
      const starts = form === 0 ? [[2, 1], [3, 1], [1, 2], [-1, 1], [1, 3], [3, 2]] : [[2, 1], [3, 1], [1, 2], [1, 3], [-2, 1], [3, 2]];
      const u1 = fr(...G.pick(starts));
      const f = form === 0 ? (u) => fdiv([1, 1], fsub([1, 1], u)) : (u) => fdiv(fsub(u, [1, 1]), fadd(u, [1, 1]));
      const cyc = [u1];
      let u = u1;
      for (let i = 0; i < 6; i++) { u = f(u); if (u[0] === u1[0] && u[1] === u1[1]) break; cyc.push(u); }
      const per = cyc.length;
      const N = G.pick([2025, 2026, 2027, 100, 101, 50]);
      const askSum = level >= 4 && G.chance(0.5);
      const rule = form === 0 ? "u_{n+1} = \\frac{1}{1 - u_n}" : "u_{n+1} = \\frac{u_n - 1}{u_n + 1}";
      if (askSum) {
        let s = [0, 1];
        cyc.forEach((c) => { s = fadd(s, c); });
        const full = Math.floor(N / per), rest = N % per;
        let total = fmul(s, [full, 1]);
        for (let i = 0; i < rest; i++) total = fadd(total, cyc[i]);
        const opts = numeric(total, [fmul(s, [full, 1]), fadd(total, cyc[rest % per]), fsub(total, cyc[0]), fadd(total, cyc[1 % per]), fsub(total, s), fmul(u1, [N, 1]), fadd(total, s)], (x) => inl(ftex(x)), 5);
        return step("A sequence is defined by $u_1 = " + ftex(u1) + "$ and $" + rule + "$ for $n \\ge 1$. What is $\\sum_{n=1}^{" + N + "} u_n$?", opts,
          "**" + answer(opts) + ".** Die ersten Glieder: $" + cyc.map(ftex).join(", ") + "$, dann wiederholt sich alles mit Periode " + per + ". Eine Periode hat die Summe $" + ftex(s) + "$; $" + N + " = " + per + " \\cdot " + full + " + " + rest + "$, also " + full + " volle Perioden und " + rest + " Glied(er) dazu: $" + ftex(total) + "$.");
      }
      const target = cyc[(N - 1) % per];
      const opts = numeric(target, cyc.filter((c) => c[0] !== target[0] || c[1] !== target[1]).concat([fr(-u1[0], u1[1]), fdiv([1, 1], u1)]), (x) => inl(ftex(x)), 5);
      return step("A sequence is defined by $u_1 = " + ftex(u1) + "$ and $" + rule + "$ for $n \\ge 1$. What is the value of $u_{" + N + "}$?", opts,
        "**" + answer(opts) + ".** Ein paar Glieder ausrechnen: $" + cyc.map(ftex).join(", ") + ", " + ftex(u1) + ", \\ldots$ Die Folge ist periodisch mit Periode " + per + ". Da $" + N + " - 1 = " + (N - 1) + "$ beim Teilen durch " + per + " den Rest " + ((N - 1) % per) + " lässt, ist $u_{" + N + "} = u_{" + (((N - 1) % per) + 1) + "} = " + ftex(target) + "$.");
    },
  });

  // ------------------------------------------------------------------ Etappe 11: arithmetic and geometric series
  LW.generator("tmua-reihen", {
    title: "Series",
    make(level, G) {
      const form = level <= 1 ? 0 : G.pick(level >= 4 ? [1, 2, 3] : [0, 1, 2]);
      if (form === 0) {
        const p = G.int(1, 4), q = G.int(-3, 5), k = G.int(6, 15), uk = p * (2 * k - 1) + q, Sk = p * k * k + q * k;
        const opts = numeric(uk, [Sk, p * (2 * k + 1) + q, uk - p, Sk - p * (k - 1) * (k - 1), 2 * p * k + q], String);
        return step("The sum of the first $n$ terms of a sequence is $S_n = " + p + "n^2 " + (q < 0 ? "- " + -q : "+ " + q) + "n$ for all $n \\ge 1$. What is the " + k + "th term?", opts,
          "**" + answer(opts) + ".** Das $k$-te Glied ist die Differenz zweier Teilsummen: $u_{" + k + "} = S_{" + k + "} - S_{" + (k - 1) + "} = " + p + "(2 \\cdot " + k + " - 1) " + (q < 0 ? "- " + -q : "+ " + q) + " = " + uk + "$. Nicht $S_{" + k + "}$ selbst nehmen.");
      }
      if (form === 1) {
        const r = G.pick([[1, 2], [1, 3], [2, 3], [-1, 2], [3, 4], [-1, 3]]), a = G.int(2, 9) * r[1];
        const S = fdiv([a, 1], fsub([1, 1], r));
        const opts = numeric(r, [fsub([1, 1], fdiv([1, 1], r)), [r[1] - r[0], r[1]], fdiv([a, 1], S), fr(-r[0], r[1]), fsub([1, 1], r)].filter((x) => x[1] !== 0), (x) => inl(ftex(x)), 5);
        return step("A geometric series has first term $" + a + "$ and sum to infinity $" + ftex(S) + "$. What is the common ratio?", opts,
          "**" + answer(opts) + ".** $S_\\infty = \\frac{a}{1 - r}$, also $1 - r = \\frac{" + a + "}{" + ftex(S) + "}$ und $r = " + ftex(r) + "$. Der Betrag liegt unter 1, sonst gäbe es keine Summe.");
      }
      if (form === 2) {
        const r = G.pick([[1, 2], [-1, 2], [1, 3], [-1, 3]]), a = G.pick([8, 16, 24, 48, 54, 81]);
        const t2 = fmul([a, 1], r), t5 = fmul(t2, fmul(r, fmul(r, r)));
        const S = fdiv([a, 1], fsub([1, 1], r));
        const opts = numeric(S, [fdiv(t2, fsub([1, 1], r)), fdiv([a, 1], fadd([1, 1], r)), fmul([a, 1], [2, 1]), fdiv(t5, fsub([1, 1], r)), fmul(S, [-1, 1]), [a, 1], fdiv(t2, fadd([1, 1], r))], (x) => inl(ftex(x)), 5);
        return step("The second term of a geometric series is $" + ftex(t2) + "$ and the fifth term is $" + ftex(t5) + "$. What is the sum to infinity of the series?", opts,
          "**" + answer(opts) + ".** $r^3 = \\frac{u_5}{u_2} = " + ftex(fdiv(t5, t2)) + "$, also $r = " + ftex(r) + "$ und $a = \\frac{u_2}{r} = " + a + "$. Dann $S_\\infty = \\frac{" + a + "}{1 - (" + ftex(r) + ")} = " + ftex(S) + "$. Das Vorzeichen von $r$ folgt aus der dritten Wurzel, es bleibt erhalten.");
      }
      const d = G.pick([1, 2, 3, -1, -2]), a = G.int(-5, 9), X = 10 * (2 * a + 19 * d), Y = 10 * (2 * a + 59 * d);
      const opts = numeric(d, [(Y - X) / 20, (Y - X) / 40, (Y - X) / 800, d * 2, -d], String);
      return step("The sum of the first 20 terms of an arithmetic series is $" + X + "$ and the sum of the next 20 terms is $" + Y + "$. What is the common difference?", opts,
        "**" + answer(opts) + ".** Jedes der Glieder 21 bis 40 ist um $20d$ größer als sein Gegenstück unter den Gliedern 1 bis 20. Also $" + Y + " - " + X + " = 20 \\cdot 20d = 400d$ und $d = " + d + "$. Ohne Formel, nur mit Struktur.");
    },
  });

  // ------------------------------------------------------------------ Etappe 12: errors in arguments
  function proofs(G) {
    const k = G.int(2, 5);
    const q = G.int(1, 3), v = q + G.pick([2, 3]), e = 2 * q + 1 - v, p = q * q - v * e;
    return [
      { lv: 1, claim: "$1 = 2$.", lines: ["Let $a$ and $b$ be real numbers with $a = b$.", "Then $a^2 = ab$, so $a^2 - b^2 = ab - b^2$.", "Factorising, $(a + b)(a - b) = b(a - b)$.", "Dividing both sides by $a - b$ gives $a + b = b$.", "Since $a = b$, this says $2b = b$, so $2 = 1$."],
        err: 3, why: "In Zeile IV wird durch $a - b = 0$ geteilt." },
      { lv: 2, claim: "The equation $\\sqrt{x + " + p + "} = x - " + q + "$ has two real solutions.", lines: ["Squaring both sides gives $x + " + p + " = (x - " + q + ")^2$.", "Expanding: $x^2 - " + (2 * q + 1) + "x + " + (q * q - p) + " = 0$.", "Factorising: $(x - " + v + ")(x " + (e < 0 ? "+ " + -e : "- " + e) + ") = 0$, so $x = " + v + "$ or $x = " + e + "$.", "Both values satisfy the squared equation, so both are solutions of the original equation."],
        err: 3, why: "Quadrieren ist keine Äquivalenzumformung: $x = " + e + "$ ergibt rechts $" + (e - q) + " < 0$, eine Wurzel ist aber nie negativ. Zeile IV schließt falsch, die Probe fehlt." },
      { lv: 2, claim: "If $a < b$, then $\\frac{1}{a} > \\frac{1}{b}$, for all non-zero real numbers $a$ and $b$.", lines: ["Suppose $a < b$, where $a$ and $b$ are non-zero.", "Dividing both sides by $ab$ gives $\\frac{1}{b} < \\frac{1}{a}$.", "Hence $\\frac{1}{a} > \\frac{1}{b}$."],
        err: 1, why: "Zeile II: ist $ab < 0$ (etwa $a = -1$, $b = 1$), dreht sich das Ungleichheitszeichen beim Teilen um." },
      { lv: 3, claim: "For every integer $n$, if $n^2$ is even, then $n$ is even.", lines: ["Suppose that $n$ is even, say $n = 2k$ for an integer $k$.", "Then $n^2 = 4k^2 = 2(2k^2)$.", "So $n^2$ is even.", "Therefore, if $n^2$ is even, then $n$ is even."],
        err: 3, why: "Zeilen I bis III zeigen nur die Umkehrung: aus „n gerade“ folgt „n² gerade“. Zeile IV zieht daraus die gewünschte Richtung, das ist kein gültiger Schluss (die Aussage stimmt zwar, ist aber nicht bewiesen)." },
      { lv: 4, claim: "$n^2 + n + 1$ is even for every positive integer $n$.", lines: ["Suppose that $k^2 + k + 1$ is even for some positive integer $k$.", "Then $(k + 1)^2 + (k + 1) + 1 = (k^2 + k + 1) + 2(k + 1)$.", "This is the sum of two even numbers, so it is even.", "Hence, by induction, $n^2 + n + 1$ is even for every positive integer $n$."],
        err: 3, why: "Der Induktionsschritt stimmt, aber der Anfang fehlt, und er scheitert: $1 + 1 + 1 = 3$ ist ungerade. Zeile IV beruft sich auf Induktion ohne Induktionsanfang." },
      { lv: 4, claim: "For all real $x$, if $x^2 > " + k * k + "$, then $x > " + k + "$.", lines: ["Suppose $x^2 > " + k * k + "$.", "Then $x^2 - " + k * k + " > 0$, so $(x - " + k + ")(x + " + k + ") > 0$.", "Dividing by $x + " + k + "$ gives $x - " + k + " > 0$.", "So $x > " + k + "$."],
        err: 2, why: "Zeile III teilt durch $x + " + k + "$, ohne zu wissen, ob das positiv ist. Für $x = -" + (k + 1) + "$ ist $x^2 > " + k * k + "$, aber $x > " + k + "$ falsch." },
      { lv: 1, claim: "The sum of any two odd numbers is odd.", lines: ["Let the two odd numbers be $2k + 1$ and $2k + 1$, where $k$ is an integer.", "Their sum is $4k + 2 = 2(2k + 1)$.", "So the sum is even, and the claim is false."],
        err: 0, why: "Zeile I nimmt zweimal dieselbe Zahl: zwei beliebige ungerade Zahlen brauchen zwei Variablen, $2k + 1$ und $2m + 1$. (Das Ergebnis „gerade“ stimmt trotzdem, aber nur für gleiche Zahlen ist es hier gezeigt.)" },
    ].filter((x) => x.err >= 0 && x.lines.length);
  }
  LW.generator("tmua-beweisfehler", {
    title: "Errors in arguments",
    make(level, G) {
      const pf = G.pick(proofs(G).filter((x) => x.lv <= level + 1));
      const opts = pf.lines.map((_, i) => ({ md: "line " + ROMAN[i], correct: i === pf.err })).concat([{ md: "there is no error", correct: false }]);
      return step("A student attempts to prove the following claim.\n\n*Claim:* " + pf.claim + "\n\n" + listed(pf.lines) + "\n\nWhere is the **first** error in the argument?", opts, "**" + answer(opts) + ".** " + pf.why + " Prüfe bei jeder Zeile: Folgt sie zwingend aus den vorigen? Teilen, Quadrieren und Wurzelziehen sind die üblichen Stolperstellen.");
    },
  });

  // ------------------------------------------------------------------ Etappe 13: binomial expansion
  LW.generator("tmua-binom", {
    title: "Binomial expansion",
    make(level, G) {
      if (level >= 3 && G.chance(0.5)) {
        const n = G.pick([6, 9]), c = G.pick([2, -2, 3, -1]), j = (2 * n) / 3;
        const coef = G.binom(n, j) * Math.pow(-c, j);
        const opts = numeric(coef, [G.binom(n, j) * Math.pow(c, j), G.binom(n, j), G.binom(n, j - 1) * Math.pow(-c, j - 1), coef * 2, G.binom(n, n / 3) * Math.pow(-c, n / 3) * (n === 6 ? 1 : 2)], String);
        return step("What is the term independent of $x$ in the expansion of $\\left(x^2 " + (c > 0 ? "- " + c : "+ " + -c) + "\\,\\frac{1}{x}\\right)^{" + n + "}$?", opts,
          "**" + answer(opts) + ".** Allgemeines Glied: $\\binom{" + n + "}{j} (x^2)^{" + n + " - j} \\left(" + (-c) + "\\frac{1}{x}\\right)^j$, der Exponent von $x$ ist $2(" + n + " - j) - j = " + 2 * n + " - 3j$. Er ist null für $j = " + j + "$: $\\binom{" + n + "}{" + j + "} \\cdot (" + -c + ")^{" + j + "} = " + coef + "$. Auf das Vorzeichen achten.");
      }
      const n = G.int(5, level >= 2 ? 8 : 6), k = G.int(2, n - 2), a = G.pick([1, 2, 3, -1, -2]), b = G.pick([2, 3, -2, -1, 1]);
      const coef = G.binom(n, k) * Math.pow(a, n - k) * Math.pow(b, k);
      const opts = numeric(coef, [G.binom(n, k) * Math.pow(b, k), G.binom(n, k) * Math.pow(a, k) * Math.pow(b, n - k), -coef, Math.pow(a, n - k) * Math.pow(b, k), G.binom(n, k - 1) * Math.pow(a, n - k + 1) * Math.pow(b, k - 1)], String);
      return step("What is the coefficient of $x^{" + k + "}$ in the expansion of $(" + a + (b < 0 ? " - " + (b === -1 ? "" : -b) : " + " + (b === 1 ? "" : b)) + "x)^{" + n + "}$?", opts,
        "**" + answer(opts) + ".** Das Glied mit $x^{" + k + "}$ ist $\\binom{" + n + "}{" + k + "} \\cdot " + (a < 0 ? "(" + a + ")" : a) + "^{" + (n - k) + "} \\cdot (" + b + "x)^{" + k + "}$, Koeffizient $" + G.binom(n, k) + " \\cdot " + Math.pow(a, n - k) + " \\cdot " + Math.pow(b, k) + " = " + coef + "$. Häufige Fehler: die Potenz des ersten Summanden vergessen oder die Exponenten vertauschen.");
    },
  });

  // ------------------------------------------------------------------ Etappe 15: trigonometric equations
  const TRIG = [
    { eq: "\\cos 2x = \\sin x", n: 3, why: "$1 - 2\\sin^2 x = \\sin x$, also $(2\\sin x - 1)(\\sin x + 1) = 0$: $\\sin x = \\tfrac12$ (zwei Lösungen) oder $\\sin x = -1$ (eine)." },
    { eq: "\\cos 2x = \\cos x", n: 3, why: "$2\\cos^2 x - 1 = \\cos x$, also $\\cos x = 1$ (eine Lösung, $x = 0$) oder $\\cos x = -\\tfrac12$ (zwei)." },
    { eq: "\\sin 2x = \\sin x", n: 4, why: "$\\sin x(2\\cos x - 1) = 0$: $\\sin x = 0$ ($0$ und $\\pi$) oder $\\cos x = \\tfrac12$ (zwei weitere)." },
    { eq: "\\tan x = \\sin x", n: 2, why: "$\\sin x\\left(\\frac{1}{\\cos x} - 1\\right) = 0$: $\\sin x = 0$ gibt $0$ und $\\pi$; $\\cos x = 1$ gibt nur die $0$ noch einmal." },
    { eq: "2\\cos^2 x = 3\\sin x", n: 2, why: "$2 - 2\\sin^2 x = 3\\sin x$, also $(2\\sin x - 1)(\\sin x + 2) = 0$; nur $\\sin x = \\tfrac12$ ist möglich." },
    { eq: "\\sin^2 x = \\tfrac14", n: 4, why: "$\\sin x = \\pm\\tfrac12$, jeweils zwei Lösungen." },
    { eq: "\\cos x = \\sin 2x", n: 4, why: "$\\cos x(1 - 2\\sin x) = 0$: $\\cos x = 0$ (zwei Lösungen) oder $\\sin x = \\tfrac12$ (zwei)." },
    { eq: "\\sin x + \\cos x = 1", n: 2, why: "$\\sqrt2\\sin\\left(x + \\frac{\\pi}{4}\\right) = 1$: $x = 0$ und $x = \\frac{\\pi}{2}$." },
    { eq: "\\sin x \\cos x = \\tfrac12", n: 2, why: "$\\sin 2x = 1$, also $2x = \\frac{\\pi}{2}$ oder $\\frac{5\\pi}{2}$." },
    { eq: "2\\sin^2 x + \\sin x - 1 = 0", n: 3, why: "$(2\\sin x - 1)(\\sin x + 1) = 0$: zwei Lösungen für $\\tfrac12$, eine für $-1$." },
    { eq: "\\sin^2 x = \\sin x", n: 3, why: "$\\sin x(\\sin x - 1) = 0$: $\\sin x = 0$ ($0$, $\\pi$) oder $\\sin x = 1$ ($\\frac{\\pi}{2}$)." },
  ];
  LW.generator("tmua-trig", {
    title: "Trigonometric equations",
    make(level, G) {
      if (level <= 2 && G.chance(0.6)) {
        const k = G.int(2, level === 1 ? 3 : 5), c = G.pick(["\\tfrac12", "\\tfrac13", "0.9", "-\\tfrac12"]);
        const opts = numeric(2 * k, [k, 2 * k + 1, 4 * k, k + 1, 2 * k - 1], String);
        return step("How many solutions does the equation $\\sin(" + k + "x) = " + c + "$ have in the interval $0 \\le x < 2\\pi$?", opts,
          "**" + answer(opts) + ".** Mit $u = " + k + "x$ läuft $u$ von $0$ bis $" + 2 * k + "\\pi$, also über " + k + " volle Perioden. In jeder Periode trifft der Sinus einen Wert zwischen $-1$ und $1$ (ohne die Ränder) genau zweimal: $2 \\cdot " + k + " = " + 2 * k + "$.");
      }
      const t = G.pick(TRIG);
      const opts = numeric(t.n, [0, 1, 2, 3, 4, 5, 6], String, 7);
      return step("How many solutions does the equation $" + t.eq + "$ have in the interval $0 \\le x < 2\\pi$?", opts,
        "**" + answer(opts) + ".** " + t.why + " Erst auf eine Funktion umformen (meist $\\sin$ oder $\\cos$), dann jede Lösung der Hilfsgleichung im Intervall zählen. Nie durch $\\sin x$ oder $\\cos x$ teilen: dabei gehen Lösungen verloren.");
    },
  });

  // ------------------------------------------------------------------ Etappe 16: trapezium rule
  LW.generator("tmua-trapez", {
    title: "Trapezium rule",
    make(level, G) {
      const fns = [
        { tex: "2^x", f: (x) => Math.pow(2, x), convex: true },
        { tex: "x^2", f: (x) => x * x, convex: true },
        { tex: "\\sqrt{x}", f: (x) => Math.sqrt(x), convex: false, sq: true },
        { tex: "\\frac{12}{x}", f: (x) => 12 / x, convex: true, from: 1 },
      ];
      const F = G.pick(level <= 1 ? fns.slice(0, 2) : fns);
      const n = G.pick(F.sq ? [4] : [3, 4]), h = F.sq ? G.pick([1, 4]) : 1, a = F.from || 0, b = a + n * h;
      const ys = []; for (let i = 0; i <= n; i++) ys.push(F.f(a + i * h));
      const mid = ys.slice(1, -1).reduce((s, y) => s + y, 0);
      const est = (h / 2) * (ys[0] + 2 * mid + ys[n]);
      const fmtv = (v) => String(Math.round(v * 1000) / 1000);
      const values = [est, h * (ys[0] + 2 * mid + ys[n]), (h / 2) * (ys[0] + mid + ys[n]), h * (ys[0] + mid)];
      const uniq = [];
      values.forEach((v) => { if (!uniq.some((u) => Math.abs(u - v) < 1e-9)) uniq.push(v); });
      const words = (over) => (over ? "an overestimate" : "an underestimate");
      const opts = [];
      uniq.slice(0, 3).forEach((v) => [true, false].forEach((over) => opts.push({ v, over, md: "$" + fmtv(v) + "$, " + words(over), correct: Math.abs(v - est) < 1e-9 && over === F.convex })));
      opts.sort((p, q) => p.v - q.v || (p.over ? 1 : -1));
      const out = opts.map((o) => ({ md: o.md, correct: o.correct }));
      return step("The trapezium rule with " + n + " strips of equal width is used to estimate $\\int_{" + a + "}^{" + b + "} " + F.tex + "\\,dx$. Which one of the following gives the estimate and describes it correctly?", out,
        "**" + answer(out) + ".** Streifenbreite $h = " + h + "$, Werte $" + ys.map(fmtv).join(", ") + "$. Schätzung $\\frac{h}{2}\\left[y_0 + 2(y_1 + \\ldots + y_{" + (n - 1) + "}) + y_{" + n + "}\\right] = " + fmtv(est) + "$. Der Graph ist " + (F.convex ? "nach oben gekrümmt (konvex): die Sehnen liegen über der Kurve, also **zu groß**." : "nach unten gekrümmt (konkav): die Sehnen liegen unter der Kurve, also **zu klein**.") + " Typische Fehler: den Faktor $\\tfrac12$ oder die Verdopplung der inneren Werte vergessen.");
    },
  });

  // ------------------------------------------------------------------ Etappe 3: circle theorems
  LW.generator("tmua-kreis", {
    title: "Circle theorems",
    make(level, G) {
      const form = G.pick(level <= 1 ? [0, 2] : [0, 1, 2, 3]);
      if (form === 0) {
        const x = G.int(15, 40), p = G.int(1, 3), r = G.int(1, 3), angB = G.int(60, 120), q = angB - p * x, s = 180 - angB - r * x;
        const opts = numeric(x, [x + 10, x - 10, x + 5, Math.round((90 - q - s) / (p + r)), Math.round((360 - q - s) / (p + r))].filter((v) => v > 0), (v) => "$" + v + "$");
        const lin = (m, c) => (m === 1 ? "" : m) + "x " + (c < 0 ? "- " + -c : "+ " + c);
        return step("The points $A$, $B$, $C$ and $D$ lie on a circle in this order. Angle $ABC = (" + lin(p, q) + ")^\\circ$ and angle $ADC = (" + lin(r, s) + ")^\\circ$. What is the value of $x$?", opts,
          "**" + answer(opts) + ".** $ABCD$ ist ein Sehnenviereck, gegenüberliegende Winkel ergänzen sich zu $180^\\circ$: $" + (p + r) + "x " + (q + s < 0 ? "- " + -(q + s) : "+ " + (q + s)) + " = 180$, also $x = " + x + "$.");
      }
      if (form === 1) {
        const x = G.int(10, 30), r = G.int(1, 2), s = G.int(5, 25), alpha = r * x + s, p = G.pick([3, 4, 5].filter((m) => m !== 2 * r)), q = 2 * alpha - p * x;
        const opts = numeric(x, [Math.round((alpha - q) / p), Math.round((2 * s - q) / (p - r)), x + 5, x - 5, Math.round((s - q) / (p - 2 * r))].filter((v) => v > 0), (v) => "$" + v + "$");
        return step("The points $A$, $B$ and $C$ lie on a circle with centre $O$, and $C$ lies on the major arc $AB$. Angle $AOB = (" + p + "x " + (q < 0 ? "- " + -q : "+ " + q) + ")^\\circ$ and angle $ACB = (" + (r === 1 ? "" : r) + "x + " + s + ")^\\circ$. What is the value of $x$?", opts,
          "**" + answer(opts) + ".** Der Mittelpunktswinkel ist doppelt so groß wie der Umfangswinkel über demselben Bogen: $" + p + "x " + (q < 0 ? "- " + -q : "+ " + q) + " = 2(" + (r === 1 ? "" : r) + "x + " + s + ")$, also $x = " + x + "$.");
      }
      if (form === 2) {
        const t = G.int(25, 70);
        const opts = numeric(t, [90 - t, 180 - t, 2 * t, Math.round(t / 2), 180 - 2 * t].filter((v) => v > 0 && v < 180), (v) => "$" + v + "^\\circ$");
        return step("The line $TA$ is a tangent to a circle at the point $A$, and $AB$ is a chord. The angle between the tangent $TA$ and the chord $AB$ is $" + t + "^\\circ$. The point $C$ lies on the circle, on the other side of $AB$ from $T$. What is angle $ACB$?", opts,
          "**" + answer(opts) + ".** Sehnen-Tangenten-Winkel (alternate segment theorem): Der Winkel zwischen Tangente und Sehne ist gleich dem Umfangswinkel im anderen Kreisabschnitt, also $" + t + "^\\circ$.");
      }
      const t = G.int(20, 65), u = G.int(10, 40);
      const ans = 90 - t + u;
      const opts = numeric(ans, [90 - t, t + u, 180 - t - u, 90 + t - u, 90 - u].filter((v) => v > 0 && v < 180), (v) => "$" + v + "^\\circ$");
      return step("$AB$ is a diameter of a circle and $C$ is a point on the circle. Angle $CAB = " + t + "^\\circ$. The point $D$ lies on $AB$ such that angle $BCD = " + u + "^\\circ$. What is angle $CDA$?", opts,
        "**" + answer(opts) + ".** Der Winkel im Halbkreis ist $90^\\circ$, also $\\angle CBA = " + (90 - t) + "^\\circ$. Im Dreieck $BCD$ ist der Außenwinkel bei $D$ die Summe der beiden nicht anliegenden Innenwinkel: $\\angle CDA = " + (90 - t) + "^\\circ + " + u + "^\\circ = " + ans + "^\\circ$.");
    },
  });
})();
