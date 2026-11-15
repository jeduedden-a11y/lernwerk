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

  // ================================================================== Sommer blocks: tmua-rechnen
  // Calculation types of the summer blocks, chosen with params.typ (one name or a list). Tasks in English as in the
  // test, options in a fixed order (numbers ascending), explanations in German. Level 1 practises the idea, level 4 is
  // test level.
  const TR = {};
  /** text options: the correct one plus distinct distractors, shuffled once (the step keeps that order) */
  function topts(G, right, wrong) {
    const seen = new Set([right]);
    const all = [{ md: right, correct: true }];
    wrong.forEach((w) => { if (w != null && !seen.has(w) && all.length < 6) { seen.add(w); all.push({ md: w, correct: false }); } });
    return G.shuffle(all);
  }
  function ptex(cs, v) {
    v = v || "x";
    const n = cs.length - 1;
    let s = "";
    cs.forEach((c, i) => {
      if (!c) return;
      const p = n - i, a = Math.abs(c);
      const coef = a === 1 && p > 0 ? "" : String(a);
      const xs = p === 0 ? "" : p === 1 ? v : v + "^{" + p + "}";
      s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + coef + xs;
    });
    return s || "0";
  }
  const pev = (cs, x) => cs.reduce((acc, c) => acc * x + c, 0);
  const pm = (c) => (c < 0 ? "- " + -c : "+ " + c);
  const xm = (a) => (a === 0 ? "x" : a > 0 ? "(x - " + a + ")" : "(x + " + -a + ")");
  const fracOr = (v) => (Array.isArray(v) ? "$" + ftex(fr(v[0], v[1])) + "$" : "$" + v + "$");
  const ipow = (b, e) => Math.round(Math.pow(b, e));
  /** numeric options with nearby values as fallback distractors (used only when the real ones run out) */
  const near = (c) => (Array.isArray(c) ? [[c[0] + c[1], c[1]], [c[0] - c[1], c[1]], [2 * c[0], c[1]], [c[0], 2 * c[1]], [c[0] + 2 * c[1], c[1]], [c[0] - 2 * c[1], c[1]]] : [c + 1, c - 1, c + 2, c * 2 || 3, c - 2]);
  const nopts = (c, wrong, show) => numeric(c, wrong.concat(near(c)), show);
  /** numbers inside English task texts: decimal point as in the test */
  const en = (x, d) => String(+(+x).toFixed(d == null ? 4 : d));
  const money = (x) => (Number.isInteger(+(+x).toFixed(6)) ? "£" + Math.round(x) : "£" + (+x).toFixed(2));

  // ---------------------------------------------------------------- powers and roots
  TR.potenz = (level, G) => {
    const BASES = [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [9, 2], [10, 3]];
    if (level <= 1) {
      const [r, q] = G.pick(BASES), a = ipow(r, q);
      const p = G.pick(q === 2 ? [1, 3] : q === 3 ? [1, 2] : [1, 3]), neg = G.chance(0.5), val = ipow(r, p);
      const right = neg ? [1, val] : val;
      const wrong = neg ? [val, [1, ipow(r, q)], [-val, 1], [1, Math.round((a * p) / q) || 2]] : [[1, val], ipow(r, q), Math.round((a * p) / q), val * r];
      const opts = nopts(right, wrong, fracOr);
      return step("What is $" + a + "^{" + (neg ? "-" : "") + "\\frac{" + p + "}{" + q + "}}$?", opts,
        "**" + answer(opts) + ".** $" + a + " = " + r + "^{" + q + "}$, also $" + a + "^{\\frac{" + p + "}{" + q + "}} = " + r + "^{" + p + "} = " + val + "$. " + (neg ? "Der negative Exponent bildet den Kehrwert: $\\tfrac{1}{" + val + "}$." : "Erst die Wurzel, dann die Potenz: Das hält die Zahlen klein."));
    }
    if (level === 2) {
      const [r1, q1] = G.pick(BASES.filter((b) => b[0] <= 5)), [r2, q2] = G.pick(BASES.filter((b) => b[0] <= 5));
      const pp = (q) => G.pick([1, 2, 3].filter((x) => x < q && gcd(x, q) === 1)), p1 = pp(q1), p2 = pp(q2);
      const v1 = ipow(r1, p1), v2 = ipow(r2, p2);
      const right = [v1, v2];
      const opts = nopts(right, [[v2, v1], v1 * v2, [1, v1 * v2], [v1, v2 * v2], [v1 * v1, v2]], fracOr);
      return step("Which of the following is equal to $" + ipow(r1, q1) + "^{\\frac{" + p1 + "}{" + q1 + "}} \\times " + ipow(r2, q2) + "^{-\\frac{" + p2 + "}{" + q2 + "}}$?", opts,
        "**" + answer(opts) + ".** $" + ipow(r1, q1) + "^{\\frac{" + p1 + "}{" + q1 + "}} = " + r1 + "^{" + p1 + "} = " + v1 + "$ und $" + ipow(r2, q2) + "^{-\\frac{" + p2 + "}{" + q2 + "}} = \\tfrac{1}{" + r2 + "^{" + p2 + "}} = \\tfrac{1}{" + v2 + "}$. Produkt: $" + ftex(fr(v1, v2)) + "$.");
    }
    if (level === 3) {
      // (2^m)^x = (2^n)^(x + k)  ->  m x = n x + n k
      let m = G.int(2, 5), n = G.int(1, 4);
      if (m === n) m += 1;
      const k = G.pick([-3, -2, -1, 1, 2, 3]), x = fr(n * k, m - n);
      const B1 = ipow(2, m), B2 = ipow(2, n);
      const opts = nopts([x[0], x[1]], [[k, 1], [-x[0], x[1]], [n * k, m + n], [m * k, m - n], [k * (m - n), n]], fracOr);
      return step("Solve the equation $" + B1 + "^{x} = " + B2 + "^{x " + pm(k) + "}$.", opts,
        "**" + answer(opts) + ".** Gemeinsame Basis 2: $2^{" + m + "x} = 2^{" + n + "(x " + pm(k) + ")}$. Exponenten gleichsetzen: $" + m + "x = " + n + "x " + pm(n * k) + "$, also $" + (m - n) + "x = " + n * k + "$ und $x = " + ftex(x) + "$.");
    }
    const [r, q] = G.pick([[2, 2], [3, 2], [2, 3], [3, 3], [4, 2], [5, 2]]);
    const c = ipow(r, q), a = q * G.int(1, 3), p = G.pick([1, 2]);
    const e = (a * p) / q, coef = ipow(r, p);
    const right = "$\\dfrac{1}{" + coef + "x^{" + e + "}}$";
    const wrong = ["$" + coef + "x^{" + e + "}$", "$\\dfrac{x^{" + e + "}}{" + coef + "}$", "$\\dfrac{1}{" + coef + "x^{" + (a - p) + "}}$", "$-" + coef + "x^{" + e + "}$", "$\\dfrac{1}{" + Math.round((c * p) / q) + "x^{" + e + "}}$"];
    const opts = topts(G, right, wrong);
    return step("Simplify $\\left(" + c + "x^{" + a + "}\\right)^{-\\frac{" + p + "}{" + q + "}}$.", opts,
      "**" + answer(opts) + ".** Der Exponent wirkt auf jeden Faktor: $" + c + "^{\\frac{" + p + "}{" + q + "}} = " + r + "^{" + p + "} = " + coef + "$ und $(x^{" + a + "})^{\\frac{" + p + "}{" + q + "}} = x^{" + e + "}$. Das Minus im Exponenten macht daraus den Kehrwert.");
  };

  TR.surd = (level, G) => {
    if (level <= 1) {
      const s = G.pick([2, 3, 5, 6, 7]), m = G.int(1, 4), n = G.int(1, 4);
      const a = m * m * s, b = n * n * s, val = (m + n) * (m + n) * s;
      const opts = nopts(val, [a + b, (m * m + n * n) * s, val + 2 * s, a * b, val - 2 * s].filter((v) => v > 0), (v) => "$" + v + "$");
      return step("What is $\\left(\\sqrt{" + a + "} + \\sqrt{" + b + "}\\right)^2$?", opts,
        "**" + answer(opts) + ".** $\\sqrt{" + a + "} = " + (m === 1 ? "" : m) + "\\sqrt{" + s + "}$ und $\\sqrt{" + b + "} = " + (n === 1 ? "" : n) + "\\sqrt{" + s + "}$, zusammen $" + (m + n) + "\\sqrt{" + s + "}$. Quadrat: $" + (m + n) * (m + n) + " \\cdot " + s + " = " + val + "$. Wer $a + b$ rechnet, vergisst das gemischte Glied $2\\sqrt{ab}$.");
    }
    if (level === 2) {
      const [b, s] = G.pick([[3, 3], [3, 5], [3, 7], [2, 3], [4, 7], [4, 11], [5, 13], [5, 22]]);
      const d = b * b - s, k = d * G.int(1, 3), t = k / d;
      const right = "$" + (t * b) + " + " + (t === 1 ? "" : t) + "\\sqrt{" + s + "}$";
      const T1 = t === 1 ? "" : t;
      const wrong = ["$" + (t * b) + " - " + T1 + "\\sqrt{" + s + "}$", "$" + (k * b) + " + " + k + "\\sqrt{" + s + "}$", "$" + b + " + \\sqrt{" + s + "}$", "$" + (t * b) + " + \\sqrt{" + s + "}$", "$" + T1 + "\\sqrt{" + s + "} - " + (t * b) + "$"];
      const opts = topts(G, right, wrong);
      return step("Simplify $\\dfrac{" + k + "}{" + b + " - \\sqrt{" + s + "}}$.", opts,
        "**" + answer(opts) + ".** Mit dem Konjugierten $" + b + " + \\sqrt{" + s + "}$ erweitern: Der Nenner wird $" + b * b + " - " + s + " = " + d + "$, also $\\tfrac{" + k + "(" + b + " + \\sqrt{" + s + "})}{" + d + "} = " + right.slice(1, -1) + "$.");
    }
    if (level === 3) {
      const cands = G.shuffle([[2, 7], [3, 3], [2, 6], [5, 1], [3, 2], [4, 2], [2, 5], [3, 1]]).slice(0, 4);
      const sq = (c) => c[0] * c[0] * c[1];
      const sorted = cands.slice().sort((x, y) => sq(y) - sq(x));
      if (sq(sorted[0]) === sq(sorted[1])) return TR.surd(1, G);
      const show = (c) => (c[1] === 1 ? "$" + c[0] + "$" : "$" + c[0] + "\\sqrt{" + c[1] + "}$");
      const opts = G.shuffle(cands.map((c) => ({ md: show(c), correct: c === sorted[0] })));
      return step("Which of the following is the largest?", opts,
        "**" + answer(opts) + ".** Unter die Wurzel ziehen und vergleichen: " + cands.map((c) => show(c) + " $= \\sqrt{" + sq(c) + "}$").join(", ") + ".");
    }
    const [a, b] = G.pick([[5, 3], [7, 5], [3, 2], [7, 3], [11, 7]]);
    const d = a - b, ab = a * b;
    // (sqrt a + sqrt b)/(sqrt a - sqrt b) = (a + b + 2 sqrt(ab))/(a - b)
    const g = gcd(gcd(a + b, 2), d);
    const p = (a + b) / g, q = 2 / g, den = d / g;
    const right = den === 1 ? "$" + p + " + " + (q === 1 ? "" : q) + "\\sqrt{" + ab + "}$" : "$\\dfrac{" + p + " + " + (q === 1 ? "" : q) + "\\sqrt{" + ab + "}}{" + den + "}$";
    const wrong = ["$\\dfrac{" + (a + b) + " + 2\\sqrt{" + ab + "}}{" + (a + b) + "}$", "$" + (a + b) + " + 2\\sqrt{" + ab + "}$", "$\\dfrac{" + (a - b) + "}{" + (a + b) + "}$", (d === 1 ? "$" + (a + b) + " - 2\\sqrt{" + ab + "}$" : "$\\dfrac{" + (a + b) + " - 2\\sqrt{" + ab + "}}{" + d + "}$"), "$1$"];
    const opts = topts(G, right, wrong);
    return step("Simplify $\\dfrac{\\sqrt{" + a + "} + \\sqrt{" + b + "}}{\\sqrt{" + a + "} - \\sqrt{" + b + "}}$.", opts,
      "**" + answer(opts) + ".** Mit $\\sqrt{" + a + "} + \\sqrt{" + b + "}$ erweitern: Zähler $" + a + " + " + b + " + 2\\sqrt{" + ab + "}$, Nenner $" + a + " - " + b + " = " + d + "$.");
  };

  // ---------------------------------------------------------------- quadratics
  TR.diskriminante = (level, G) => {
    if (level <= 1) {
      const a = G.pick([1, 2, 3, -1, -2]), b = G.int(-6, 6), c = G.int(-6, 6), D = b * b - 4 * a * c;
      const n = D > 0 ? 2 : D === 0 ? 1 : 0;
      const opts = [0, 1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === n }));
      return step("How many real roots does $" + ptex([a, b, c]) + " = 0$ have?", opts,
        "**" + answer(opts) + ".** $\\Delta = b^2 - 4ac = " + b * b + " - 4 \\cdot " + (a < 0 ? "(" + a + ")" : a) + " \\cdot " + (c < 0 ? "(" + c + ")" : c) + " = " + D + "$: " + (n === 2 ? "positiv, zwei Nullstellen." : n === 1 ? "null, eine doppelte Nullstelle." : "negativ, keine reelle Nullstelle."));
    }
    if (level === 2) {
      const m = G.int(2, 6), c = m * m;
      const count = 4 * m - 1;
      const opts = nopts(count, [count + 2, count - 2, 2 * m - 1, 2 * m + 1, 4 * m + 1], (v) => "$" + v + "$");
      return step("For how many integer values of $k$ does $x^2 + kx + " + c + " = 0$ have no real roots?", opts,
        "**" + answer(opts) + ".** Keine reelle Nullstelle: $k^2 - " + 4 * c + " < 0$, also $-" + 2 * m + " < k < " + 2 * m + "$. Die ganzen Zahlen von $-" + (2 * m - 1) + "$ bis $" + (2 * m - 1) + "$ sind $" + count + "$ Stück; die Ränder $\\pm " + 2 * m + "$ geben eine doppelte Nullstelle.");
    }
    if (level === 3) {
      const b = G.int(2, 5);
      const right = "$-" + b + " < k < " + b + "$ and $k \\ne 0$";
      const wrong = ["$-" + b + " < k < " + b + "$", "$k < -" + b + "$ or $k > " + b + "$", "$-" + b + " \\le k \\le " + b + "$ and $k \\ne 0$", "$0 < k < " + b + "$", "$-" + 2 * b + " < k < " + 2 * b + "$ and $k \\ne 0$"];
      const opts = topts(G, right, wrong);
      return step("For which values of $k$ does $kx^2 + " + 2 * b + "x + k = 0$ have two distinct real roots?", opts,
        "**" + answer(opts) + ".** Für $k = 0$ ist die Gleichung linear und hat nur eine Lösung, also $k \\ne 0$. Sonst: $\\Delta = " + 4 * b * b + " - 4k^2 > 0 \\iff k^2 < " + b * b + " \\iff -" + b + " < k < " + b + "$.");
    }
    const m = 2 * G.int(1, 4) * G.sign(), p = G.int(-3, 6), cval = p - (m * m) / 4;
    const opts = nopts(cval, [p + (m * m) / 4, p - m * m, p, -cval, p - m / 2].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
    return step("The line $y = " + m + "x + c$ is a tangent to the curve $y = x^2 " + pm(p) + "$. What is the value of $c$?", opts,
      "**" + answer(opts) + ".** Gleichsetzen: $x^2 " + pm(-m) + "x " + pm(p) + " - c = 0$. Tangente heißt genau ein gemeinsamer Punkt, also $\\Delta = " + m * m + " - 4(" + p + " - c) = 0$ und $c = " + p + " - " + (m * m) / 4 + " = " + cval + "$.");
  };

  TR.qungleichung = (level, G) => {
    let r1 = G.int(-5, 4), r2 = G.int(-4, 6);
    if (r2 <= r1) r2 = r1 + G.int(2, 5);
    const b = -(r1 + r2), c = r1 * r2;
    if (level <= 1) {
      const right = "$" + r1 + " < x < " + r2 + "$";
      const opts = topts(G, right, ["$x < " + r1 + "$ or $x > " + r2 + "$", "$" + r1 + " \\le x \\le " + r2 + "$", "$" + -r2 + " < x < " + -r1 + "$", "$x > " + r2 + "$"]);
      return step("Solve $" + ptex([1, b, c]) + " < 0$.", opts,
        "**" + answer(opts) + ".** Nullstellen $" + r1 + "$ und $" + r2 + "$; die nach oben geöffnete Parabel ist zwischen ihnen negativ. Ränder ausgeschlossen, weil $< 0$ streng ist.");
    }
    if (level === 2) {
      // x^2 >= p x + q  with roots r1, r2
      const right = "$x \\le " + r1 + "$ or $x \\ge " + r2 + "$";
      const opts = topts(G, right, ["$" + r1 + " \\le x \\le " + r2 + "$", "$x \\ge " + r2 + "$", "$x < " + r1 + "$ or $x > " + r2 + "$", "$x \\le " + -r2 + "$ or $x \\ge " + -r1 + "$"]);
      return step("Solve $x^2 \\ge " + ptex([-b, -c]) + "$.", opts,
        "**" + answer(opts) + ".** Alles auf eine Seite: $" + ptex([1, b, c]) + " \\ge 0$, Nullstellen $" + r1 + "$ und $" + r2 + "$. Die Parabel ist außerhalb der Nullstellen positiv; wegen $\\ge$ gehören die Ränder dazu. Wer durch $x$ teilt oder die Wurzel zieht, verliert einen Teil.");
    }
    if (level === 3) {
      const a = G.pick([1, 2, -1, -2]), n = r2 - r1 - 1, inside = a > 0;
      const opts = nopts(n, [n + 1, n + 2, r2 - r1, Math.max(0, n - 1)], (v) => "$" + v + "$");
      return step("How many integers $x$ satisfy $" + (a === 1 ? "" : a === -1 ? "-" : a) + xm(r1) + xm(r2) + (inside ? " < 0" : " > 0") + "$?", opts,
        "**" + answer(opts) + ".** " + (a < 0 ? "Das negative Vorzeichen dreht die Parabel nach unten; " : "") + "Die Ungleichung gilt genau für $" + r1 + " < x < " + r2 + "$. Ganze Zahlen dazwischen: $" + n + "$.");
    }
    // x^2 + kx + k + d > 0 for all x  ->  k^2 - 4k - 4d < 0
    const [lo, hi] = G.pick([[-2, 6], [-4, 8], [-6, 10]]);
    // k^2 - (lo+hi) k + lo*hi < 0 must be k^2 - 4k - 4d: lo + hi = 4, lo*hi = -4d
    const d = -(lo * hi) / 4;
    const right = "$" + lo + " < k < " + hi + "$";
    const opts = topts(G, right, ["$k < " + lo + "$ or $k > " + hi + "$", "$" + lo + " \\le k \\le " + hi + "$", "$k > " + hi + "$", "$" + -hi + " < k < " + -lo + "$"]);
    return step("For which values of $k$ is $x^2 + kx + k " + pm(d) + " > 0$ for all real $x$?", opts,
      "**" + answer(opts) + ".** Keine reelle Nullstelle: $k^2 - 4(k " + pm(d) + ") < 0 \\iff k^2 - 4k " + pm(-4 * d) + " < 0 \\iff (k " + pm(-lo) + ")(k " + pm(-hi) + ") < 0$. Am Rand berührt die Parabel die Achse, dort gilt $> 0$ nicht.");
  };

  TR.ergaenzung = (level, G) => {
    if (level <= 1) {
      const h = G.int(-5, 5) || 2, k = G.int(-6, 9), b = -2 * h, c = h * h + k;
      const opts = nopts(k, [c, -k, k + h, h, c - b].filter((v, i, a) => a.indexOf(v) === i), (v) => "$" + v + "$");
      return step("What is the minimum value of $" + ptex([1, b, c]) + "$?", opts,
        "**" + answer(opts) + ".** Quadratisch ergänzen: $" + ptex([1, b, c]) + " = " + xm(h) + "^2 " + pm(k) + "$. Das Quadrat ist mindestens 0, also ist das Minimum $" + k + "$ (bei $x = " + h + "$).");
    }
    if (level === 2) {
      const a = G.pick([2, 3]), h = G.int(-4, 4) || 3, k = G.int(-5, 9), b = -2 * a * h, c = a * h * h + k;
      const opts = nopts(k, [c, k - a * h * h, a * k, h, c - (b * b) / 4].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("What is the minimum value of $" + ptex([a, b, c]) + "$?", opts,
        "**" + answer(opts) + ".** $" + a + " $ ausklammern: $" + a + "\\left(x^2 " + pm(-2 * h) + "x\\right) " + pm(c) + " = " + a + xm(h) + "^2 " + pm(k) + "$. Minimum $" + k + "$ bei $x = " + h + "$.");
    }
    if (level === 3) {
      const h = G.int(-4, 4) || 2, k = G.int(1, 6), b = -2 * h, c = h * h + k;
      const opts = nopts([1, k], [[1, c], k, [-1, k], [1, h * h]].filter((v) => Array.isArray(v) ? v[1] !== 0 : true), fracOr);
      return step("What is the maximum value of $\\dfrac{1}{" + ptex([1, b, c]) + "}$ for real $x$?", opts,
        "**" + answer(opts) + ".** Der Nenner $" + xm(h) + "^2 + " + k + "$ ist mindestens $" + k + "$ und immer positiv. Ein Bruch mit festem Zähler ist am größten, wenn der Nenner am kleinsten ist: $\\tfrac{1}{" + k + "}$.");
    }
    const a = G.pick([2, 3]), h = G.int(1, 5), k = G.int(1, 12), b = 2 * a * h, c = k - a * h * h;
    const opts = nopts(k, [c, -k, k + a, a * h, k - a].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
    return step("What is the maximum value of $" + ptex([-a, b, c]) + "$?", opts,
      "**" + answer(opts) + ".** $-" + a + "\\left(x^2 - " + 2 * h + "x\\right) " + pm(c) + " = -" + a + "(x - " + h + ")^2 + " + k + "$. Das Quadrat mit negativem Faktor ist höchstens 0: Maximum $" + k + "$ bei $x = " + h + "$.");
  };

  // ---------------------------------------------------------------- polynomials
  TR.restsatz = (level, G) => {
    if (level <= 1) {
      const cs = [1, G.int(-4, 4), G.int(-6, 6), G.int(-8, 8)], r = G.pick([-2, -1, 1, 2, 3]);
      const R = pev(cs, r);
      const opts = nopts(R, [pev(cs, -r), R + 2 * r, cs[3], R - cs[3], -R].filter((v, i, a) => a.indexOf(v) === i), (v) => "$" + v + "$");
      return step("What is the remainder when $" + ptex(cs) + "$ is divided by $" + xm(r) + "$?", opts,
        "**" + answer(opts) + ".** Restsatz: Der Rest ist $f(" + r + ") = " + R + "$. Häufigster Fehler: $f(" + -r + ")$ statt $f(" + r + ")$.");
    }
    if (level === 2) {
      const a = G.int(-4, 4), b = G.int(-6, 6), c = G.int(-6, 6), r = G.pick([-2, -1, 1, 2, 3]);
      const R = pev([1, a, b, c], r);
      const opts = nopts(a, [-a, a + 1, a - 1, a + 2, Math.round((R - r * r * r) / (r * r))].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("When $x^3 + ax^2 " + pm(b) + "x " + pm(c) + "$ is divided by $" + xm(r) + "$, the remainder is $" + R + "$. What is the value of $a$?", opts,
        "**" + answer(opts) + ".** $f(" + r + ") = " + r * r * r + " + " + r * r + "a " + pm(b * r) + " " + pm(c) + " = " + R + "$, also $" + r * r + "a = " + (R - r * r * r - b * r - c) + "$ und $a = " + a + "$.");
    }
    if (level === 3) {
      const r = G.pick([-3, -2, -1, 1, 2]), p = G.int(-4, 4), q = G.int(-8, 8);
      const k = -(r * r * r + p * r * r + q) / r;
      if (!Number.isInteger(k)) return TR.restsatz(2, G);
      const opts = nopts(k, [-k, k + 1, k - 2, Math.round((r * r * r + p * r * r + q) / r)].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("$" + xm(r) + "$ is a factor of $x^3 " + pm(p) + "x^2 + kx " + pm(q) + "$. What is the value of $k$?", opts,
        "**" + answer(opts) + ".** Faktorsatz: $f(" + r + ") = 0$, also $" + r * r * r + " " + pm(p * r * r) + " " + pm(r) + "k " + pm(q) + " = 0$ und $k = " + k + "$.");
    }
    // f = x^3 + a x^2 + b x + 6 with factor (x - 1) and remainder R on division by (x + 2)
    const a = G.int(-4, 4), b = -7 - a, R = pev([1, a, b, 6], -2);
    const opts = nopts(a, [b, -a, a + 2, a - 2, R].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
    return step("$f(x) = x^3 + ax^2 + bx + 6$ has a factor $(x - 1)$, and the remainder when $f(x)$ is divided by $(x + 2)$ is $" + R + "$. What is the value of $a$?", opts,
      "**" + answer(opts) + ".** $f(1) = 0$: $1 + a + b + 6 = 0$, also $b = -7 - a$. $f(-2) = " + R + "$: $-8 + 4a - 2b + 6 = " + R + "$. Einsetzen: $-2 + 4a + 14 + 2a = " + R + "$, also $6a = " + (R - 12) + "$ und $a = " + a + "$ (dazu $b = " + b + "$).");
  };

  // ---------------------------------------------------------------- algebraic fractions and rearranging
  TR.umstellen = (level, G) => {
    if (level <= 2) {
      const a = G.int(2, 5), b = G.int(1, 7), c = G.int(1, 4);
      const right = "$x = \\dfrac{" + c + "y + " + b + "}{y - " + a + "}$";
      const wrong = ["$x = \\dfrac{" + c + "y - " + b + "}{y - " + a + "}$", "$x = \\dfrac{" + c + "y + " + b + "}{y + " + a + "}$", "$x = \\dfrac{y + " + b + "}{" + c + "y - " + a + "}$", "$x = \\dfrac{y - " + b + "}{" + a + " - " + c + "y}$", "$x = \\dfrac{" + b + " - " + c + "y}{y - " + a + "}$"];
      const opts = topts(G, right, wrong);
      return step("Make $x$ the subject of $y = \\dfrac{" + a + "x + " + b + "}{x - " + c + "}$.", opts,
        "**" + answer(opts) + ".** Mit dem Nenner multiplizieren: $y(x - " + c + ") = " + a + "x + " + b + "$. Alle $x$ auf eine Seite: $xy - " + a + "x = " + c + "y + " + b + "$. Ausklammern: $x(y - " + a + ") = " + c + "y + " + b + "$, dann teilen.");
    }
    if (level === 3) {
      const p = G.int(1, 6), q = G.int(1, 6);
      if (p === q) return TR.umstellen(2, G);
      const right = "$\\dfrac{x + " + p + "}{x - " + q + "}$";
      const wrong = ["$\\dfrac{x + " + p + "}{x + " + q + "}$", "$\\dfrac{" + p + "}{-" + q + "}$", "$\\dfrac{x - " + p + "}{x - " + q + "}$", "$\\dfrac{x + " + q + "}{x - " + p + "}$", "$x + " + p + "$"];
      const opts = topts(G, right, wrong);
      return step("Simplify $\\dfrac{" + ptex([1, p + q, p * q]) + "}{x^2 - " + q * q + "}$.", opts,
        "**" + answer(opts) + ".** Zähler und Nenner faktorisieren: $\\tfrac{(x + " + p + ")(x + " + q + ")}{(x - " + q + ")(x + " + q + ")}$. Gekürzt wird nur ein gemeinsamer **Faktor**, nie ein Summand.");
    }
    const a = G.int(1, 6), b = G.int(1, 6);
    const right = "$x = \\dfrac{" + b + "y^2 + " + a + "}{y^2 - 1}$";
    const wrong = ["$x = \\dfrac{" + b + "y^2 - " + a + "}{y^2 - 1}$", "$x = \\dfrac{" + b + "y + " + a + "}{y - 1}$", "$x = \\dfrac{" + a + "y^2 + " + b + "}{y^2 - 1}$", "$x = \\dfrac{" + b + "y^2 + " + a + "}{1 - y^2}$", "$x = \\sqrt{\\dfrac{" + b + "y + " + a + "}{y - 1}}$"];
    const opts = topts(G, right, wrong);
    return step("Make $x$ the subject of $y = \\sqrt{\\dfrac{x + " + a + "}{x - " + b + "}}$.", opts,
      "**" + answer(opts) + ".** Quadrieren: $y^2 = \\tfrac{x + " + a + "}{x - " + b + "}$. Mit dem Nenner multiplizieren: $y^2 x - " + b + "y^2 = x + " + a + "$. Sortieren: $x(y^2 - 1) = " + b + "y^2 + " + a + "$.");
  };

  // ---------------------------------------------------------------- absolute values
  TR.betrag = (level, G) => {
    if (level <= 2) {
      const a = level <= 1 ? 1 : 2, b = G.int(1, 6) * G.sign(), c = G.int(2, 9);
      // |a x + b| < c  ->  (-c - b)/a < x < (c - b)/a
      const lo = fr(-c - b, a), hi = fr(c - b, a);
      const t = (f) => ftex(f);
      const right = "$" + t(lo) + " < x < " + t(hi) + "$";
      const wrong = ["$x < " + t(lo) + "$ or $x > " + t(hi) + "$", "$" + t(fr(-c + b, a)) + " < x < " + t(fr(c + b, a)) + "$", "$" + t(lo) + " \\le x \\le " + t(hi) + "$", "$x < " + t(hi) + "$", "$" + t(fr(-c - b, 1)) + " < x < " + t(fr(c - b, 1)) + "$"];
      const opts = topts(G, right, wrong);
      return step("Solve $|" + (a === 1 ? "" : a) + "x " + pm(b) + "| < " + c + "$.", opts,
        "**" + answer(opts) + ".** $|u| < " + c + "$ heißt $-" + c + " < u < " + c + "$: $-" + c + " < " + (a === 1 ? "" : a) + "x " + pm(b) + " < " + c + "$. " + pm(-b).replace("+ ", "Addiere ").replace("- ", "Subtrahiere ") + (a === 1 ? "." : " und teile durch " + a + "."));
    }
    if (level === 3) {
      // |x - p| = m x + q : count solutions by cases
      const p = G.pick([-3, -2, -1, 1, 2, 3]), m = G.pick([2, 3, -2]), q = G.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
      let n = 0;
      const sols = [];
      const x1 = (p + q) / (1 - m); // case x >= p: x - p = m x + q
      if (x1 >= p - 1e-9) { n += 1; sols.push(x1); }
      const x2 = (p - q) / (1 + m); // case x < p: p - x = m x + q
      if (x2 < p - 1e-9) { n += 1; sols.push(x2); }
      const opts = [0, 1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === n }));
      return step("How many real solutions does $|x " + pm(-p) + "| = " + m + "x " + pm(q) + "$ have?", opts,
        "**" + answer(opts) + ".** Fall $x \\ge " + p + "$: $x " + pm(-p) + " = " + m + "x " + pm(q) + "$ gibt $x = " + G.tex(x1, 3) + "$, " + (x1 >= p - 1e-9 ? "liegt im Fall." : "liegt nicht im Fall.") + " Fall $x < " + p + "$: $" + p + " - x = " + m + "x " + pm(q) + "$ gibt $x = " + G.tex(x2, 3) + "$, " + (x2 < p - 1e-9 ? "liegt im Fall." : "liegt nicht im Fall.") + " Jede Fall-Lösung muss zum Fall passen.");
    }
    const r = G.int(2, 4), a = r * r, b = G.pick([1, 2, 3, a, a + 2, a + 5].filter((v) => v !== 0));
    const n = b > a ? 2 : b === a ? 3 : 4;
    const opts = [1, 2, 3, 4, 5].map((v) => ({ md: "$" + v + "$", correct: v === n }));
    return step("How many real solutions does $|x^2 - " + a + "| = " + b + "$ have?", opts,
      "**" + answer(opts) + ".** $x^2 - " + a + " = " + b + "$ gibt $x^2 = " + (a + b) + "$, zwei Lösungen. $x^2 - " + a + " = -" + b + "$ gibt $x^2 = " + (a - b) + "$: " + (a - b > 0 ? "zwei weitere." : a - b === 0 ? "nur $x = 0$." : "keine.") + " Im Bild: Der Graph von $|x^2 - " + a + "|$ hat die Spitze $(0, " + a + ")$; die Höhe " + b + " liegt " + (b > a ? "darüber." : b === a ? "genau auf der Spitze." : "darunter."));
  };

  // ---------------------------------------------------------------- equations in quadratic form
  TR.qform = (level, G) => {
    if (level <= 1) {
      const p = G.pick([1, 4, 9, -1, -4]), q = G.pick([1, 4, 9, 16, -4, -9]);
      if (p === q) return TR.qform(1, G);
      const n = (p > 0 ? 2 : 0) + (q > 0 ? 2 : 0);
      const opts = [0, 1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === n }));
      return step("How many real solutions does $" + ptex([1, 0, -(p + q), 0, p * q]) + " = 0$ have?", opts,
        "**" + answer(opts) + ".** Mit $u = x^2$: $u^2 " + pm(-(p + q)) + "u " + pm(p * q) + " = 0$, also $u = " + p + "$ oder $u = " + q + "$. Jedes positive $u$ liefert zwei Lösungen $x = \\pm\\sqrt{u}$, ein negatives keine.");
    }
    if (level <= 3) {
      const base = level === 2 ? 2 : 3;
      const e1 = G.int(0, 3), e2 = G.int(1, 4);
      if (e1 === e2) return TR.qform(level, G);
      const p = ipow(base, e1), q = ipow(base, e2);
      const bigBase = base * base;
      const opts = nopts(e1 + e2, [p + q, e1 * e2, p * q, Math.max(e1, e2), e1 + e2 + 1].filter((v, i, a) => a.indexOf(v) === i), (v) => "$" + v + "$");
      return step("What is the sum of the solutions of $" + bigBase + "^x - " + (p + q) + " \\cdot " + base + "^x + " + p * q + " = 0$?", opts,
        "**" + answer(opts) + ".** $" + bigBase + "^x = (" + base + "^x)^2$. Mit $u = " + base + "^x$: $u^2 - " + (p + q) + "u + " + p * q + " = 0$, also $u = " + p + "$ oder $u = " + q + "$. Dann $x = " + e1 + "$ oder $x = " + e2 + "$, Summe $" + (e1 + e2) + "$. Die Summe der $u$-Werte ist nicht gefragt.");
    }
    const s1 = G.int(1, 4), s2 = G.int(2, 6);
    if (s1 === s2) return TR.qform(4, G);
    const opts = nopts(s1 * s1 + s2 * s2, [s1 + s2, s1 * s2, (s1 + s2) * (s1 + s2), s1 * s1 * s2 * s2].filter((v, i, a) => a.indexOf(v) === i), (v) => "$" + v + "$");
    return step("What is the sum of the solutions of $x - " + (s1 + s2) + "\\sqrt{x} + " + s1 * s2 + " = 0$?", opts,
      "**" + answer(opts) + ".** Mit $u = \\sqrt x \\ge 0$: $u^2 - " + (s1 + s2) + "u + " + s1 * s2 + " = 0$, also $u = " + s1 + "$ oder $u = " + s2 + "$ (beide nicht negativ). Dann $x = " + s1 * s1 + "$ oder $x = " + s2 * s2 + "$, Summe $" + (s1 * s1 + s2 * s2) + "$.");
  };

  // ---------------------------------------------------------------- line and circle / parabola
  TR.lgs = (level, G) => {
    if (level <= 1) {
      const r2 = G.pick([2, 8, 18, 5, 10, 13]), c = G.int(-6, 6);
      // y = x + c and x^2 + y^2 = r2: 2x^2 + 2cx + c^2 - r2 = 0, D = 8 r2 - 4 c^2
      const D = 8 * r2 - 4 * c * c, n = D > 0 ? 2 : D === 0 ? 1 : 0;
      const opts = [0, 1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === n }));
      return step("At how many points does the line $y = x " + pm(c) + "$ meet the circle $x^2 + y^2 = " + r2 + "$?", opts,
        "**" + answer(opts) + ".** Einsetzen: $x^2 + (x " + pm(c) + ")^2 = " + r2 + "$, also $2x^2 " + pm(2 * c) + "x " + pm(c * c - r2) + " = 0$ mit $\\Delta = " + 4 * c * c + " - 8(" + (c * c - r2) + ") = " + D + "$. " + (n === 2 ? "Positiv: zwei Schnittpunkte." : n === 1 ? "Null: Die Gerade berührt den Kreis." : "Negativ: kein gemeinsamer Punkt."));
    }
    if (level === 2) {
      const m = G.int(-3, 3), b = G.int(-4, 4), c = G.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), d = G.int(-5, 5);
      // y = m x + c and y = x^2 + b x + d: x^2 + (b - m) x + (d - c) = 0
      const D = (b - m) * (b - m) - 4 * (d - c);
      if (D <= 0) return TR.lgs(2, G);
      const opts = nopts(m - b, [b - m, d - c, c - d, m + b, m - b + 1, m - b - 2, b - m + 3].filter((v, i, a) => a.indexOf(v) === i), (v) => "$" + v + "$");
      return step("The line $y = " + (m === 0 ? "" : m === 1 ? "x" : m === -1 ? "-x" : m + "x") + (m === 0 ? c : " " + pm(c)) + "$ meets the curve $y = " + ptex([1, b, d]) + "$ at two points. What is the sum of their $x$-coordinates?", opts,
        "**" + answer(opts) + ".** Gleichsetzen: $" + ptex([1, b - m, d - c]) + " = 0$. Nach Vieta ist die Summe der Lösungen $-\\tfrac{b}{a} = " + (m - b) + "$, ohne die Lösungen selbst zu berechnen.");
    }
    if (level === 3) {
      const [m, c, r2] = G.pick([[1, 1, 13], [2, 0, 20], [1, -1, 25], [-1, 2, 10], [3, 0, 10], [1, 3, 17]]);
      const num = -2 * m * c, den = 1 + m * m;
      const opts = nopts(fr(num, den), [fr(2 * m * c, den), fr(num, 1), fr(c * c - r2, den), [0, 1], fr(num + den, den), fr(num - 2 * den, den), fr(2 * m * c + den, den)], fracOr);
      return step("The line $y = " + (m === 1 ? "" : m === -1 ? "-" : m) + "x" + (c ? " " + pm(c) : "") + "$ meets the circle $x^2 + y^2 = " + r2 + "$ at two points. What is the sum of their $x$-coordinates?", opts,
        "**" + answer(opts) + ".** Einsetzen: $x^2 + (" + (m === 1 ? "" : m === -1 ? "-" : m) + "x" + (c ? " " + pm(c) : "") + ")^2 = " + r2 + "$ gibt $" + den + "x^2 " + pm(2 * m * c) + "x " + pm(c * c - r2) + " = 0$. Summe der Lösungen: $-\\tfrac{" + 2 * m * c + "}{" + den + "} = " + ftex(fr(num, den)) + "$.");
    }
    const s = G.int(1, 4), r2 = 2 * s * s;
    const right = "$c = " + 2 * s + "$ or $c = -" + 2 * s + "$";
    const opts = topts(G, right, ["$c = " + 2 * s + "$ only", "$c = \\pm" + s + "$", "$-" + 2 * s + " < c < " + 2 * s + "$", "$c = \\pm" + r2 + "$", "$c = \\pm\\sqrt{" + r2 + "}$"]);
    return step("For which values of $c$ does the line $y = x + c$ meet the circle $x^2 + y^2 = " + r2 + "$ at exactly one point?", opts,
      "**" + answer(opts) + ".** $2x^2 + 2cx + c^2 - " + r2 + " = 0$ mit $\\Delta = 4c^2 - 8(c^2 - " + r2 + ") = " + 8 * r2 + " - 4c^2 = 0$, also $c^2 = " + 2 * r2 + "$ und $c = \\pm " + 2 * s + "$. Zwei Tangenten, je eine auf jeder Seite.");
  };

  // ---------------------------------------------------------------- percentages, divisibility, proportion, units, ratios
  TR.prozent = (level, G) => {
    if (level <= 1) {
      const p = G.pick([10, 20, 25, 30, 40, 50]), loss = (p * p) / 100;
      const opts = topts(G, "a decrease of " + en(loss, 2) + "%", ["no change", "a decrease of " + p + "%", "an increase of " + en(loss, 2) + "%", "a decrease of " + 2 * p + "%", "a decrease of " + en(loss / 2, 2) + "%"]);
      return step("A price rises by " + p + "% and then falls by " + p + "%. What is the overall change?", opts,
        "**" + answer(opts) + ".** Faktoren statt Prozentpunkte: $" + G.tex(1 + p / 100, 2) + " \\cdot " + G.tex(1 - p / 100, 2) + " = " + G.tex(1 - loss / 100, 4) + "$, also ein Minus von $" + G.tex(loss, 2) + "\\,\\%$.");
    }
    if (level === 2) {
      const [p, base] = G.pick([[25, 120], [20, 150], [50, 80], [12.5, 160], [40, 75], [60, 45], [5, 240]]);
      const now = base * (1 + p / 100);
      const opts = nopts(base, [now * (1 - p / 100), now - p, base + p, now / (1 - p / 100)].map((v) => +v.toFixed(2)).filter((v, i, a) => a.indexOf(v) === i), money);
      return step("After an increase of " + en(p, 1) + "%, a price is " + money(now) + ". What was the original price?", opts,
        "**" + answer(opts) + ".** Neu $= \\text{alt} \\cdot " + G.tex(1 + p / 100, 3) + "$, also alt $= \\tfrac{" + G.tex(now, 2) + "}{" + G.tex(1 + p / 100, 3) + "} = " + G.tex(base, 2) + "$. Wer " + G.fmt(p, 1) + " % vom neuen Preis abzieht, nimmt die falsche Grundmenge.");
    }
    if (level === 3) {
      const [P, r, n] = G.pick([[1000, 10, 2], [2000, 5, 2], [500, 20, 3], [1000, 10, 3], [800, 25, 2], [5000, 2, 2]]);
      const v = P * Math.pow(1 + r / 100, n);
      const opts = nopts(+v.toFixed(2), [P * (1 + (r * n) / 100), v + P * r / 100, P * Math.pow(1 + r / 100, n - 1), P * Math.pow(1 + r / 100, n + 1)].map((x) => +x.toFixed(2)).filter((x, i, a) => a.indexOf(x) === i), money);
      return step("£" + P + " is invested at " + r + "% compound interest per year. How much is it worth after " + n + " years?", opts,
        "**" + answer(opts) + ".** Jedes Jahr Faktor $" + G.tex(1 + r / 100, 2) + "$: $" + P + " \\cdot " + G.tex(1 + r / 100, 2) + "^{" + n + "} = " + G.tex(v, 2) + "$. Einfacher Zins ($" + P + " \\cdot (1 + " + n + " \\cdot " + G.tex(r / 100, 2) + ")$) vergisst die Zinsen auf Zinsen.");
    }
    const a = G.pick([10, 20, 25, 50]), b = G.pick([10, 20, 40, 50]), c = G.pick([10, 20, 25]);
    const f = (1 + a / 100) * (1 - b / 100) * (1 + c / 100), ch = +(100 * (f - 1)).toFixed(2);
    const opts = nopts(ch, [a - b + c, +(100 * ((1 + a / 100) * (1 - b / 100) - 1)).toFixed(2), +(-ch).toFixed(2), +(100 * (f - 1) + 1).toFixed(2)].filter((v, i, arr) => arr.indexOf(v) === i), (v) => (v > 0 ? "+" : "") + en(v, 2) + "%");
    return step("A quantity is increased by " + a + "%, then decreased by " + b + "%, then increased by " + c + "%. What is the overall percentage change?", opts,
      "**" + answer(opts) + ".** Faktoren multiplizieren: $" + G.tex(1 + a / 100, 2) + " \\cdot " + G.tex(1 - b / 100, 2) + " \\cdot " + G.tex(1 + c / 100, 2) + " = " + G.tex(f, 4) + "$, also $" + (ch > 0 ? "+" : "") + G.tex(ch, 2) + "\\,\\%$. Prozentpunkte addieren ($" + (a - b + c) + "\\,\\%$) ist falsch.");
  };

  TR.teiler = (level, G) => {
    if (level <= 1) {
      const a = G.int(1, 4), b = G.int(0, 3), c = G.int(0, 2), N = ipow(2, a) * ipow(3, b) * ipow(5, c);
      const n = (a + 1) * (b + 1) * (c + 1);
      const opts = nopts(n, [a * Math.max(1, b) * Math.max(1, c), a + b + c, a + b + c + 1, n + 2, n - 2].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("How many positive divisors does $" + N + "$ have?", opts,
        "**" + answer(opts) + ".** $" + N + " = 2^{" + a + "}" + (b ? " \\cdot 3^{" + b + "}" : "") + (c ? " \\cdot 5^{" + c + "}" : "") + "$. Ein Teiler wählt jeden Exponenten von 0 bis zum Höchstwert: $(" + (a + 1) + ")" + (b ? "(" + (b + 1) + ")" : "") + (c ? "(" + (c + 1) + ")" : "") + " = " + n + "$.");
    }
    if (level === 2) {
      const e = [G.int(1, 4), G.int(0, 3), G.int(0, 2)], f = [G.int(0, 4), G.int(1, 3), G.int(0, 2)];
      const P = [2, 3, 5], lcm = G.chance(0.5);
      const val = P.reduce((acc, p, i) => acc * ipow(p, lcm ? Math.max(e[i], f[i]) : Math.min(e[i], f[i])), 1);
      const other = P.reduce((acc, p, i) => acc * ipow(p, lcm ? Math.min(e[i], f[i]) : Math.max(e[i], f[i])), 1);
      const A = P.reduce((acc, p, i) => acc * ipow(p, e[i]), 1), B = P.reduce((acc, p, i) => acc * ipow(p, f[i]), 1);
      const opts = nopts(val, [other, A * B, Math.abs(A - B) || 1, val * 2].filter((v, i, arr) => arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("What is the " + (lcm ? "lowest common multiple" : "highest common factor") + " of $" + A + "$ and $" + B + "$?", opts,
        "**" + answer(opts) + ".** Primfaktoren: " + (lcm ? "kgV mit dem jeweils **größten** Exponenten" : "ggT mit dem jeweils **kleinsten** Exponenten") + ". Probe: ggT mal kgV ist $" + A + " \\cdot " + B + " = " + A * B + "$.");
    }
    const k = G.pick(level === 3 ? [84, 90, 108, 120, 150, 200, 72, 98] : [24, 36, 54, 72, 100, 48]);
    const cube = level >= 4;
    let rest = k, n = 1;
    const parts = [];
    for (const p of [2, 3, 5, 7]) {
      let e = 0;
      while (rest % p === 0) { rest /= p; e++; }
      if (e) { parts.push(p + "^{" + e + "}"); const m = cube ? (3 - (e % 3)) % 3 : e % 2; n *= ipow(p, m); }
    }
    const opts = nopts(n, [k, n * 2, n * 3, Math.max(1, n / 2), cube ? n * n : n * 4].filter((v, i, arr) => Number.isInteger(v) && arr.indexOf(v) === i), (v) => "$" + v + "$");
    return step("What is the smallest positive integer $n$ such that $" + k + "n$ is a perfect " + (cube ? "cube" : "square") + "?", opts,
      "**" + answer(opts) + ".** $" + k + " = " + parts.join(" \\cdot ") + "$. In einer " + (cube ? "Kubikzahl ist jeder Exponent durch 3 teilbar" : "Quadratzahl ist jeder Exponent gerade") + "; $n$ ergänzt genau die fehlenden Faktoren: $n = " + n + "$.");
  };

  TR.proportional = (level, G) => {
    if (level <= 1) {
      const n = G.pick([2, 3, -1, -2]), k = G.pick([2, 3]);
      const right = n > 0 ? ipow(k, n) : [1, ipow(k, -n)];
      const wrong = n > 0 ? [k, k * n, [1, ipow(k, n)], ipow(k, n + 1), n * n] : [[1, k * -n], ipow(k, -n), [1, ipow(k, -n + 1)], [k, 1], [1, k]];
      const opts = nopts(right, wrong, fracOr);
      const rel = n === -1 ? "inversely proportional to $x$" : n === -2 ? "inversely proportional to the square of $x$" : n === 2 ? "proportional to the square of $x$" : "proportional to the cube of $x$";
      return step("$y$ is " + rel + ". When $x$ is multiplied by " + k + ", by what factor is $y$ multiplied?", opts,
        "**" + answer(opts) + ".** $y = c\\,x^{" + n + "}$, also wird $y$ mit $" + k + "^{" + n + "} = " + (n > 0 ? ipow(k, n) : "\\tfrac{1}{" + ipow(k, -n) + "}") + "$ multipliziert. Die Konstante $c$ braucht man dafür nicht.");
    }
    if (level === 2) {
      const [q1, q2] = G.pick([[16, 25], [9, 36], [4, 49], [25, 81], [36, 4]]), p1 = G.int(2, 6) * Math.sqrt(q1);
      const c = p1 / Math.sqrt(q1), p2 = c * Math.sqrt(q2);
      const opts = nopts(p2, [(p1 * q2) / q1, p1 + Math.sqrt(q2) - Math.sqrt(q1), (p1 * Math.sqrt(q1)) / Math.sqrt(q2), c * q2].map((v) => +v.toFixed(3)).filter((v, i, a) => v !== p2 && a.indexOf(v) === i), (v) => "$" + en(v, 3) + "$");
      return step("$p$ is proportional to $\\sqrt q$, and $p = " + p1 + "$ when $q = " + q1 + "$. What is $p$ when $q = " + q2 + "$?", opts,
        "**" + answer(opts) + ".** $p = c\\sqrt q$ mit $c = \\tfrac{" + p1 + "}{" + Math.sqrt(q1) + "} = " + G.tex(c, 3) + "$. Dann $p = " + G.tex(c, 3) + " \\cdot " + Math.sqrt(q2) + " = " + G.tex(p2, 3) + "$.");
    }
    if (level === 3) {
      const x1 = G.int(2, 5), y1 = G.pick([4, 8, 12, 16, 36]), x2 = x1 * G.pick([2, 3]);
      const c = y1 * x1 * x1, y2 = c / (x2 * x2);
      const opts = nopts(fr(c, x2 * x2), [fr(y1 * x1, x2), fr(y1, 2), fr(y1 * x2 * x2, x1 * x1), fr(c, x2)], fracOr);
      return step("$y$ is inversely proportional to the square of $x$, and $y = " + y1 + "$ when $x = " + x1 + "$. What is $y$ when $x = " + x2 + "$?", opts,
        "**" + answer(opts) + ".** $y = \\tfrac{c}{x^2}$ mit $c = " + y1 + " \\cdot " + x1 * x1 + " = " + c + "$. Für $x = " + x2 + "$: $y = \\tfrac{" + c + "}{" + x2 * x2 + "} = " + G.tex(y2, 4) + "$.");
    }
    const n = G.pick([2, 3]), p = G.pick([10, 20, 50]);
    const f = Math.pow(1 + p / 100, n), ch = +(100 * (f - 1)).toFixed(2);
    const opts = nopts(ch, [n * p, p, +(100 * (Math.pow(1 + p / 100, n - 1) - 1)).toFixed(2), +(ch + p).toFixed(2)].filter((v, i, a) => v !== ch && a.indexOf(v) === i), (v) => en(v, 2) + "%");
    return step("$V$ is proportional to $r^{" + n + "}$. If $r$ increases by " + p + "%, by what percentage does $V$ increase?", opts,
      "**" + answer(opts) + ".** Faktor $" + G.tex(1 + p / 100, 2) + "^{" + n + "} = " + G.tex(f, 4) + "$, also $+" + G.tex(ch, 2) + "\\,\\%$. Nicht $" + n + " \\cdot " + p + "\\,\\%$: Prozente multiplizieren sich.");
  };

  TR.einheiten = (level, G) => {
    if (level <= 1) {
      const a = G.pick([1, 2, 3.5, 0.4, 0.07]), sq = G.chance(0.5);
      const val = sq ? a * 1e4 : a * 1e6;
      const opts = nopts(+val.toFixed(4), [a * 100, a * 1e3, sq ? a * 1e6 : a * 1e4, sq ? a * 1e5 : a * 1e9].map((v) => +v.toFixed(4)).filter((v, i, arr) => v !== +val.toFixed(4) && arr.indexOf(v) === i), (v) => "$" + en(v) + "$");
      return step("How many " + (sq ? "cm²" : "cm³") + " are there in " + en(a, 3) + (sq ? " m²" : " m³") + "?", opts,
        "**" + answer(opts) + ".** $1\\,\\mathrm{m} = 100\\,\\mathrm{cm}$, also $1\\,\\mathrm{m}^" + (sq ? "2" : "3") + " = 100^" + (sq ? "2" : "3") + "\\,\\mathrm{cm}^" + (sq ? "2" : "3") + " = " + (sq ? "10\\,000" : "1\\,000\\,000") + "\\,\\mathrm{cm}^" + (sq ? "2" : "3") + "$. Der Umrechnungsfaktor wird mit der Dimension potenziert.");
    }
    if (level === 2) {
      const v = G.pick([18, 36, 54, 72, 90, 108, 144]), ms = v / 3.6;
      const opts = nopts(ms, [v * 3.6, v / 60, v / 36, ms * 2].map((x) => +x.toFixed(3)).filter((x, i, a) => x !== ms && a.indexOf(x) === i), (x) => "$" + en(x, 3) + "$ m/s");
      return step("What is " + v + " km/h in m/s?", opts,
        "**" + answer(opts) + ".** $1\\,\\tfrac{\\mathrm{km}}{\\mathrm h} = \\tfrac{1000\\,\\mathrm m}{3600\\,\\mathrm s} = \\tfrac{1}{3{,}6}\\,\\tfrac{\\mathrm m}{\\mathrm s}$, also $" + v + " : 3{,}6 = " + G.tex(ms, 3) + "$.");
    }
    if (level === 3) {
      const d = G.pick([0.8, 1.2, 2.7, 7.8, 13.6, 0.9]);
      const opts = nopts(d * 1000, [d, d * 100, d * 1e6, d * 10].filter((x) => x !== d * 1000), (x) => "$" + en(x, 3) + "$ kg/m³");
      return step("A material has density " + en(d, 2) + " g/cm³. What is its density in kg/m³?", opts,
        "**" + answer(opts) + ".** $1\\,\\tfrac{\\mathrm g}{\\mathrm{cm}^3} = \\tfrac{10^{-3}\\,\\mathrm{kg}}{10^{-6}\\,\\mathrm m^3} = 1000\\,\\tfrac{\\mathrm{kg}}{\\mathrm m^3}$.");
    }
    const a = G.pick([2, 4.5, 6, 8]), lit = a * 1000;
    const opts = nopts(lit, [a, a * 100, a * 1e6, a * 10].filter((x) => x !== lit), (x) => "$" + en(x, 3) + "$ litres");
    return step("A tank holds " + en(a, 2) + " m³ of water. How many litres is that?", opts,
      "**" + answer(opts) + ".** $1\\,\\mathrm{litre} = 1\\,\\mathrm{dm}^3$ und $1\\,\\mathrm m^3 = 10^3\\,\\mathrm{dm}^3$: $" + G.tex(a, 2) + " \\cdot 1000 = " + G.tex(lit, 0) + "$ Liter.");
  };

  TR.verhaeltnis = (level, G) => {
    if (level <= 1) {
      const a = G.int(1, 5), b0 = G.int(2, 7), b = b0 === a ? a + 1 : b0, N = (a + b) * G.int(2, 9);
      const big = (Math.max(a, b) * N) / (a + b);
      const opts = nopts(big, [(Math.min(a, b) * N) / (a + b), N / 2, (Math.max(a, b) * N) / Math.min(a, b), big + 1].filter((x, i, arr) => Number.isInteger(x) && x !== big && arr.indexOf(x) === i), (x) => "$" + x + "$");
      return step("£" + N + " is shared in the ratio $" + a + " : " + b + "$. How much is the larger share?", opts,
        "**" + answer(opts) + ".** $" + (a + b) + "$ Teile zu je $" + N / (a + b) + "$; der größere Anteil hat $" + Math.max(a, b) + "$ Teile.");
    }
    if (level === 2) {
      const a = G.int(1, 5), b = G.int(2, 6), c = G.int(2, 6), d0 = G.int(1, 7), d = d0 === c ? c + 1 : d0;
      const p = fr(a * c, b * d);
      const right = "$" + p[0] + " : " + p[1] + "$";
      const opts = topts(G, right, ["$" + a + " : " + d + "$", "$" + (a + c) + " : " + (b + d) + "$", "$" + p[1] + " : " + p[0] + "$", "$" + a * d + " : " + b * c + "$"]);
      return step("$a : b = " + a + " : " + b + "$ and $b : c = " + c + " : " + d + "$. What is $a : c$?", opts,
        "**" + answer(opts) + ".** Die gemeinsame Größe $b$ angleichen: $a : b = " + a * c + " : " + b * c + "$ und $b : c = " + b * c + " : " + b * d + "$. Also $a : c = " + a * c + " : " + b * d + " = " + p[0] + " : " + p[1] + "$.");
    }
    if (level === 3) {
      const [p, q, r, s] = G.pick([[3, 5, 2, 3], [2, 3, 3, 4], [1, 2, 2, 3], [3, 4, 4, 5], [2, 5, 1, 2]]);
      // (pk + t) : (qk + t) = r : s  ->  s(pk + t) = r(qk + t)  ->  k (sp - rq) = t (r - s)
      const t = G.pick([4, 5, 6, 10]);
      const k = (t * (r - s)) / (s * p - r * q);
      if (!(k > 0) || !Number.isInteger(k)) return TR.verhaeltnis(2, G);
      const x = p * k;
      const opts = nopts(x, [q * k, x + t, k, (p + q) * k, x - t, q * k + t, 2 * x].filter((v, i, arr) => v > 0 && v !== x && arr.indexOf(v) === i), (v) => "$" + v + "$");
      return step("Two numbers $x$ and $y$ are in the ratio $" + p + " : " + q + "$. When " + t + " is added to each, the ratio becomes $" + r + " : " + s + "$. What is $x$?", opts,
        "**" + answer(opts) + ".** $x = " + p + "k$, $y = " + q + "k$. Dann $" + s + "(" + p + "k + " + t + ") = " + r + "(" + q + "k + " + t + ")$, also $k = " + k + "$ und $x = " + x + "$.");
    }
    const a = G.int(1, 4), b0 = G.int(2, 5), b = b0 === 2 * a ? b0 + 1 : b0, c = G.int(2, 5), d0 = G.int(1, 6), d = d0 === c ? c + 1 : d0;
    const A = a * c, B = b * c, C = b * d, S = A + B + C, m = G.int(1, 4), total = S * m;
    const opts = nopts(C * m, [A * m, B * m, (d * total) / (c + d) | 0, total / 3 | 0].filter((v, i, arr) => v > 0 && v !== C * m && arr.indexOf(v) === i), (v) => "$" + v + "$");
    return step("$a : b = " + a + " : " + b + "$, $b : c = " + c + " : " + d + "$ and $a + b + c = " + total + "$. What is $c$?", opts,
      "**" + answer(opts) + ".** $a : b : c = " + A + " : " + B + " : " + C + "$ (b angeglichen). Das sind $" + S + "$ Teile, ein Teil ist $" + m + "$, also $c = " + C * m + "$.");
  };


  // ---------------------------------------------------------------- Sommer 2: logarithms and graphs
  const LOGB = [2, 3, 5, 10];
  TR.logwert = (level, G) => {
    if (level <= 1) {
      const b = G.pick(LOGB), k = G.pick([-2, -1, 2, 3, 4, b === 2 ? 5 : 3]);
      const arg = k >= 0 ? String(ipow(b, k)) : "\\tfrac{1}{" + ipow(b, -k) + "}";
      const opts = nopts(k, [-k, ipow(b, Math.abs(k)), k + 1, k - 1], (v) => "$" + v + "$");
      return step("What is $\\log_{" + b + "} " + arg + "$?", opts,
        "**" + answer(opts) + ".** $" + arg + " = " + b + "^{" + k + "}$, also ist der Logarithmus $" + k + "$. Der Logarithmus ist der Exponent." );
    }
    if (level === 2) {
      const [c, m, n] = G.pick([[2, 2, 3], [2, 3, 2], [3, 2, 3], [3, 3, 2], [2, 4, 3], [2, 3, 4], [5, 2, 3], [2, 4, 5]]);
      const B = ipow(c, m), A = ipow(c, n), v = fr(n, m);
      const opts = nopts(v, [fr(m, n), fr(A, B), [n - m, 1], fr(n, 1)], fracOr);
      return step("What is $\\log_{" + B + "} " + A + "$?", opts,
        "**" + answer(opts) + ".** Beides als Potenz von " + c + ": $" + A + " = " + c + "^{" + n + "} = (" + c + "^{" + m + "})^{\\frac{" + n + "}{" + m + "}} = " + B + "^{\\frac{" + n + "}{" + m + "}}$, also $" + ftex(v) + "$.");
    }
    if (level === 3) {
      const b = G.pick([2, 3, 5]), k = G.int(1, b === 5 ? 2 : 4), B = G.pick([2, 3, 5, 6, 7].filter((x) => x % b !== 0 && x !== b));
      const A = B * ipow(b, k);
      if (G.chance(0.5)) {
        const opts = nopts(k, [A - B, k + 1, Math.round(A / B), k - 1], (v) => "$" + v + "$");
        return step("What is $\\log_{" + b + "} " + A + " - \\log_{" + b + "} " + B + "$?", opts,
          "**" + answer(opts) + ".** Differenz der Logarithmen ist der Logarithmus des Quotienten: $\\log_{" + b + "} \\tfrac{" + A + "}{" + B + "} = \\log_{" + b + "} " + ipow(b, k) + " = " + k + "$.");
      }
      const t = G.pick([2, 3, 4]), u = ipow(b, 2) * ipow(t, 2);
      // 2 log_b (b t) - log_b (t^2) = log_b (b^2 t^2 / t^2) = 2
      const opts = nopts(2, [1, 3, 2 * t, b], (v) => "$" + v + "$");
      return step("What is $2\\log_{" + b + "} " + b * t + " - \\log_{" + b + "} " + t * t + "$?", opts,
        "**" + answer(opts) + ".** $2\\log_{" + b + "} " + b * t + " = \\log_{" + b + "} " + u + "$, und $\\log_{" + b + "} " + u + " - \\log_{" + b + "} " + t * t + " = \\log_{" + b + "} " + b * b + " = 2$.");
    }
    if (G.chance(0.5)) {
      const p = G.pick([3, 5, 7]), k = G.int(2, 5);
      const opts = nopts(k, [p, k * p, ipow(2, k), k + 1], (v) => "$" + v + "$");
      return step("What is $\\log_2 " + p + " \\times \\log_{" + p + "} " + ipow(2, k) + "$?", opts,
        "**" + answer(opts) + ".** Basiswechsel: $\\log_2 " + p + " \\cdot \\log_{" + p + "} " + ipow(2, k) + " = \\tfrac{\\lg " + p + "}{\\lg 2} \\cdot \\tfrac{\\lg " + ipow(2, k) + "}{\\lg " + p + "} = \\log_2 " + ipow(2, k) + " = " + k + "$. (Die Basiswechselformel ist im TMUA nicht verlangt, die Kettenidee hilft trotzdem.)");
    }
    const [N, a, b2] = G.pick([[36, 2, 2], [12, 2, 1], [18, 1, 2], [72, 3, 2], [48, 4, 1], [24, 3, 1]]);
    const right = "$" + a + " + " + (b2 === 1 ? "" : b2) + "p$";
    const opts = topts(G, right, ["$" + a + "p$", "$" + (a + b2) + "p$", "$" + a + " + p^{" + b2 + "}$", "$" + b2 + " + " + (a === 1 ? "" : a) + "p$", "$" + a * b2 + "p$"]);
    return step("Given that $\\log_2 3 = p$, express $\\log_2 " + N + "$ in terms of $p$.", opts,
      "**" + answer(opts) + ".** $" + N + " = 2^{" + a + "} \\cdot 3^{" + b2 + "}$, also $\\log_2 " + N + " = " + a + " + " + b2 + "\\log_2 3$.");
  };

  TR.loggleichung = (level, G) => {
    if (level <= 1) {
      const b = G.pick([2, 3, 5, 10]), k = G.pick([2, 3, -1]), c = G.int(-3, 3);
      const x = ipow(b, Math.abs(k)), val = k < 0 ? [1 - c * b, b] : x - c;
      const opts = nopts(Array.isArray(val) ? fr(val[0], val[1]) : val, [k - c, x + c, b * k - c].filter((v) => v !== val), fracOr);
      return step("Solve $\\log_{" + b + "}(x " + pm(c) + ") = " + k + "$.", opts,
        "**" + answer(opts) + ".** Exponentialform: $x " + pm(c) + " = " + b + "^{" + k + "}$, also $x = " + (k < 0 ? "\\tfrac{1}{" + b + "} " + pm(-c) : (x + " " + pm(-c))) + "$. Probe: Das Argument ist positiv.");
    }
    if (level === 2) {
      const [b, k, r1] = G.pick([[2, 3, 4], [2, 4, 8], [2, 5, 8], [2, 5, 16], [3, 3, 9], [2, 6, 16], [3, 4, 27]]);
      const N = ipow(b, k), d = r1 - N / r1;
      const other = -(N / r1);
      const right = "$x = " + r1 + "$ only";
      const opts = topts(G, right, ["$x = " + r1 + "$ or $x = " + other + "$", "$x = " + other + "$ only", "no real solution", "$x = " + (N / 2) + "$ only", "$x = " + (r1 + other) + "$ only"]);
      return step("Solve $\\log_{" + b + "} x + \\log_{" + b + "}(x - " + d + ") = " + k + "$.", opts,
        "**" + answer(opts) + ".** Zusammenfassen: $\\log_{" + b + "}\\big(x(x - " + d + ")\\big) = " + k + "$, also $x^2 - " + d + "x - " + N + " = 0$ mit den Lösungen $" + r1 + "$ und $" + other + "$. Der Definitionsbereich verlangt $x > " + d + "$: Nur $x = " + r1 + "$ bleibt.");
    }
    if (level === 3) {
      const [b, k, q, x] = G.pick([[2, 2, 1, 3], [2, 3, 1, 3], [3, 1, 2, 5], [2, 1, 3, 7], [3, 2, 1, 2], [5, 1, 1, 3]]);
      const P = ipow(b, k) * (x - q) - x; // (x + P) = b^k (x - q)
      if (P <= 0 || x - q <= 0) return TR.loggleichung(2, G);
      const opts = nopts(x, [x + 1, P, q + 1, ipow(b, k)].filter((v) => v !== x), (v) => "$" + v + "$");
      return step("Solve $\\log_{" + b + "}(x + " + P + ") - \\log_{" + b + "}(x - " + q + ") = " + k + "$.", opts,
        "**" + answer(opts) + ".** $\\log_{" + b + "}\\tfrac{x + " + P + "}{x - " + q + "} = " + k + "$, also $x + " + P + " = " + ipow(b, k) + "(x - " + q + ")$ und $x = " + x + "$. Probe: beide Argumente positiv.");
    }
    const b = G.pick([2, 3, 5]), m = G.int(1, 2), n = m + G.int(1, 2);
    const prodExp = m + n;
    const opts = nopts(ipow(b, prodExp), [ipow(b, m) + ipow(b, n), m * n, ipow(b, m * n), ipow(b, n)], (v) => "$" + v + "$");
    return step("What is the product of the solutions of $\\left(\\log_{" + b + "} x\\right)^2 - " + (m + n) + "\\log_{" + b + "} x + " + m * n + " = 0$?", opts,
      "**" + answer(opts) + ".** Mit $u = \\log_{" + b + "} x$: $(u - " + m + ")(u - " + n + ") = 0$, also $x = " + b + "^{" + m + "}$ oder $x = " + b + "^{" + n + "}$. Produkt $" + b + "^{" + prodExp + "} = " + ipow(b, prodExp) + "$.");
  };

  TR.expsub = (level, G) => {
    const base = G.pick([2, 3]);
    if (level <= 1) {
      const e = G.int(0, 3), p = ipow(base, e), q = G.pick([ipow(base, G.int(1, 3)), -G.int(1, 5)]);
      if (q === p || p + q === 0) return TR.expsub(1, G);
      const n = 1 + (q > 0 ? 1 : 0);
      const opts = [0, 1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === n }));
      return step("How many real solutions does $" + base * base + "^x " + pm(-(p + q)) + " \\cdot " + base + "^x " + pm(p * q) + " = 0$ have?", opts,
        "**" + answer(opts) + ".** Mit $u = " + base + "^x$: $(u - " + p + ")(u " + pm(-q) + ") = 0$. $u = " + p + "$ gibt $x = " + e + "$" + (q > 0 ? ", und $u = " + q + "$ gibt eine zweite Lösung." : "; $u = " + q + "$ ist negativ, und $" + base + "^x$ ist immer positiv: keine weitere Lösung."));
    }
    if (level <= 3) {
      const r = G.pick([1, 2, 4]), s = G.pick([2, 4, 8]);
      if (r / 2 === s) return TR.expsub(level, G);
      const x1 = Math.log2(r) - 1, x2 = Math.log2(s);
      const opts = nopts(x1 + x2, [Math.log2(r) + x2, x1 * x2, r / 2 + s, x2], (v) => "$" + v + "$");
      return step("What is the sum of the solutions of $2^{2x + 1} - " + (2 * s + r) + " \\cdot 2^x + " + r * s + " = 0$?", opts,
        "**" + answer(opts) + ".** $2^{2x + 1} = 2 \\cdot (2^x)^2$. Mit $u = 2^x$: $2u^2 - " + (2 * s + r) + "u + " + r * s + " = (2u - " + r + ")(u - " + s + ") = 0$, also $u = " + ftex(fr(r, 2)) + "$ oder $u = " + s + "$, d. h. $x = " + x1 + "$ oder $x = " + x2 + "$.");
    }
    const [a, b] = G.pick([[2, 3], [1, 4], [2, 5], [3, 4]]);
    const right = "$\\ln " + a * b + "$";
    const opts = topts(G, right, ["$\\ln " + (a + b) + "$", "$" + a * b + "$", "$\\ln " + a + " \\cdot \\ln " + b + "$", "$" + (a + b) + "$", "$\\ln " + Math.abs(a - b || 2) + "$"]);
    return step("What is the sum of the solutions of $e^{2x} - " + (a + b) + "e^x + " + a * b + " = 0$?", opts,
      "**" + answer(opts) + ".** Mit $u = e^x$: $(u - " + a + ")(u - " + b + ") = 0$, also $x = \\ln " + a + "$ oder $x = \\ln " + b + "$. Summe: $\\ln " + a + " + \\ln " + b + " = \\ln " + a * b + "$." + (a === 1 ? " Dabei ist $\\ln 1 = 0$." : ""));
  };

  TR.transformation = (level, G) => {
    if (level <= 1) {
      const h = G.int(1, 5) * G.sign(), k = G.int(1, 5) * G.sign();
      const sq = (hh) => (hh > 0 ? "(x - " + hh + ")^2" : "(x + " + -hh + ")^2");
      const right = "$y = " + sq(h) + " " + pm(k) + "$";
      const opts = topts(G, right, ["$y = " + sq(-h) + " " + pm(k) + "$", "$y = " + sq(h) + " " + pm(-k) + "$", "$y = " + sq(-h) + " " + pm(-k) + "$", "$y = x^2 " + pm(-2 * h) + "x " + pm(k) + "$"]);
      return step("The graph of $y = x^2$ is translated " + Math.abs(h) + " units to the " + (h > 0 ? "right" : "left") + " and " + Math.abs(k) + " units " + (k > 0 ? "up" : "down") + ". What is the equation of the new graph?", opts,
        "**" + answer(opts) + ".** Nach rechts heißt $x$ durch $x - " + Math.abs(h) + "$ ersetzen (bei links $x + " + Math.abs(h) + "$); nach oben wird außen addiert. Scheitel $(" + h + ", " + k + ")$.");
    }
    if (level === 2) {
      const px = G.int(-3, 4), py = G.int(-3, 6), a = G.pick([2, 3, -1, -2]), h = G.int(1, 4) * G.sign(), k = G.int(1, 4) * G.sign();
      const nx = px + h, ny = a * py + k;
      const show = (x, y) => "$(" + x + ", " + y + ")$";
      const right = show(nx, ny);
      const opts = topts(G, right, [show(px - h, a * py + k), show(nx, a * (py + k)), show(a * px + h, py + k), show(nx, py + k), show(px - h, a * (py + k))]);
      return step("The point $(" + px + ", " + py + ")$ lies on the curve $y = f(x)$. Which point must lie on $y = " + (a === -1 ? "-" : a) + "f(x " + pm(-h) + ") " + pm(k) + "$?", opts,
        "**" + answer(opts) + ".** Innen $x " + pm(-h) + "$: Verschiebung um $" + h + "$ in x-Richtung, also $x$-Wert $" + nx + "$. Außen: erst mal $" + a + "$, dann $" + pm(k) + "$: $" + a + " \\cdot " + py + " " + pm(k) + " = " + ny + "$.");
    }
    if (level === 3) {
      const px = 2 * G.int(1, 4), py = G.int(1, 6), b = 2;
      const kind = G.pick(["stretch", "reflect"]);
      if (kind === "stretch") {
        const right = "$(" + px / b + ", " + py + ")$";
        const opts = topts(G, right, ["$(" + px * b + ", " + py + ")$", "$(" + px + ", " + py * b + ")$", "$(" + px / b + ", " + py * b + ")$", "$(" + px + ", " + py / b + ")$"]);
        return step("The point $(" + px + ", " + py + ")$ lies on $y = f(x)$. Which point must lie on $y = f(" + b + "x)$?", opts,
          "**" + answer(opts) + ".** $f(" + b + "x) = " + py + "$ verlangt $" + b + "x = " + px + "$, also $x = " + px / b + "$. Ein Faktor innen staucht in x-Richtung mit dem Kehrwert.");
      }
      const right = "$(" + -px + ", " + py + ")$";
      const opts = topts(G, right, ["$(" + px + ", " + -py + ")$", "$(" + -px + ", " + -py + ")$", "$(" + py + ", " + px + ")$", "$(" + px + ", " + py + ")$"]);
      return step("The point $(" + px + ", " + py + ")$ lies on $y = f(x)$. Which point must lie on $y = f(-x)$?", opts,
        "**" + answer(opts) + ".** $f(-x) = " + py + "$ für $-x = " + px + "$: Spiegelung an der y-Achse. ($-f(x)$ spiegelt dagegen an der x-Achse.)");
    }
    const b = G.pick([2, 3]), m = G.int(1, 3), c = b * m;
    const right = "stretch parallel to the $x$-axis by scale factor $\\tfrac1{" + b + "}$, then translate by " + m + " to the left";
    const opts = topts(G, right, [
      "translate by " + m + " to the left, then stretch parallel to the $x$-axis by scale factor $\\tfrac1{" + b + "}$",
      "stretch parallel to the $x$-axis by scale factor $" + b + "$, then translate by " + c + " to the left",
      "translate by " + c + " to the right, then stretch parallel to the $x$-axis by scale factor $\\tfrac1{" + b + "}$",
      "stretch parallel to the $y$-axis by scale factor $" + b + "$, then translate by " + m + " to the left"]);
    return step("Which sequence of transformations maps the graph of $y = f(x)$ onto the graph of $y = f(" + b + "x + " + c + ")$?", opts,
      "**" + answer(opts) + ".** $f(" + b + "x + " + c + ") = f\\big(" + b + "(x + " + m + ")\\big)$. Erst $f(" + b + "x)$ (Stauchung mit $\\tfrac1{" + b + "}$), dann $x$ durch $x + " + m + "$ ersetzen: Verschiebung um " + m + " nach links. Erst um " + m + " verschieben und dann stauchen ergäbe $f(" + b + "x + " + m + ")$.");
  };

  function countRoots(g, a, b, h) {
    let n = 0, prev = g(a);
    for (let x = a + h; x <= b; x += h) { const v = g(x); if (isFinite(v) && isFinite(prev) && (prev < 0) !== (v < 0)) n++; prev = v; }
    return n;
  }
  TR.anzahl = (level, G) => {
    let md, n, why;
    if (level <= 1) {
      const r = G.int(2, 4), a = r * r, b = G.pick([1, 2, 3, a + 1, a + 4].filter((v) => v !== a));
      n = b > a ? 2 : 4;
      md = "How many real solutions does $|x^2 - " + a + "| = " + b + "$ have?";
      why = "Der Graph von $|x^2 - " + a + "|$ hat zwei Tiefpunkte auf der Achse bei $\\pm " + r + "$ und die Spitze $(0, " + a + ")$. Die Höhe " + b + " liegt " + (b > a ? "über der Spitze: zwei Schnittpunkte." : "unter der Spitze: vier Schnittpunkte.");
    } else if (level === 2) {
      const k = G.pick([-3, -1, 0, 1, 3, 2.5, -2.5, 1.5]);
      n = Math.abs(k) < 2 ? 3 : 1;
      md = "How many real solutions does $x^3 - 3x = " + en(k) + "$ have?";
      why = "$f(x) = x^3 - 3x$ hat einen Hochpunkt $(-1, 2)$ und einen Tiefpunkt $(1, -2)$ (aus $f'(x) = 3x^2 - 3 = 0$). Eine waagerechte Gerade zwischen $-2$ und $2$ schneidet dreimal, außerhalb einmal.";
    } else if (level === 3) {
      const k = G.pick([0.5, 1, 2, 3, 4]);
      n = countRoots((x) => Math.pow(2, x) - x - k, -8.0003, 8, 0.001);
      md = "How many real solutions does $2^x = x + " + en(k) + "$ have?";
      why = "Die Gerade $y = x + " + en(k) + "$ gegen die Exponentialkurve: Der Abstand $2^x - x$ ist bei $x \\approx 0{,}53$ am kleinsten, etwa $0{,}91$. Liegt " + en(k) + " darüber, gibt es zwei Schnittpunkte, darunter keinen.";
    } else {
      const k = G.pick([2, 5, 8, 10, 15]);
      n = countRoots((x) => Math.sin(x) - x / k, -k - 1.0003, k + 1, 0.0005);
      md = "How many real solutions does $\\sin x = \\dfrac{x}{" + k + "}$ have, where $x$ is in radians?";
      why = "Schnittpunkte der Sinuskurve mit der Geraden $y = \\tfrac{x}{" + k + "}$: Nur für $|x| \\le " + k + "$ ist die Gerade zwischen $-1$ und $1$. Rechts von 0 zählt man die Bögen, die die Gerade noch übersteigen, und verdoppelt wegen der Punktsymmetrie; dazu kommt $x = 0$.";
    }
    const cand = Array.from(new Set([n, n + 1, n - 1, n + 2, n + 4, n - 2])).filter((v) => v >= 0).slice(0, 5).sort((x, y) => x - y);
    const opts = cand.map((v) => ({ md: "$" + v + "$", correct: v === n }));
    return step(md, opts, "**" + answer(opts) + ".** " + why);
  };

  const GRAPHS = [
    { tex: "y = \\dfrac{1}{1 + x^2}", sym: "even", y0: 1, inf: "0", va: false },
    { tex: "y = \\dfrac{x}{1 + x^2}", sym: "odd", y0: 0, inf: "0", va: false },
    { tex: "y = \\dfrac{1}{x^2}", sym: "even", y0: null, inf: "0", va: true },
    { tex: "y = x^2 + 1", sym: "even", y0: 1, inf: "inf", va: false },
    { tex: "y = \\dfrac{1}{x}", sym: "odd", y0: null, inf: "0", va: true },
    { tex: "y = 1 - x^2", sym: "even", y0: 1, inf: "-inf", va: false },
    { tex: "y = 2^x", sym: "none", y0: 1, inf: "mixed", va: false },
    { tex: "y = \\dfrac{x^2}{1 + x^2}", sym: "even", y0: 0, inf: "1", va: false },
    { tex: "y = |x| + 1", sym: "even", y0: 1, inf: "inf", va: false },
    { tex: "y = x^3 - x", sym: "odd", y0: 0, inf: "mixed", va: false },
    { tex: "y = \\dfrac{1}{x - 1}", sym: "none", y0: -1, inf: "0", va: true },
  ];
  const PROPS = {
    even: { test: (g) => g.sym === "even", en: "is symmetric about the $y$-axis", de: "achsensymmetrisch zur y-Achse" },
    odd: { test: (g) => g.sym === "odd", en: "has rotational symmetry of order 2 about the origin", de: "punktsymmetrisch zum Ursprung" },
    y1: { test: (g) => g.y0 === 1, en: "passes through $(0, 1)$", de: "geht durch $(0, 1)$" },
    y0: { test: (g) => g.y0 === 0, en: "passes through the origin", de: "geht durch den Ursprung" },
    zero: { test: (g) => g.inf === "0", en: "tends to 0 as $x \\to \\pm\\infty$", de: "nähert sich für große $|x|$ der Null" },
    va: { test: (g) => g.va, en: "has a vertical asymptote", de: "hat eine senkrechte Asymptote" },
    nova: { test: (g) => !g.va, en: "is defined for all real $x$", de: "ist überall definiert" },
  };
  TR.graphmerkmal = (level, G) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const target = G.pick(GRAPHS);
      const own = Object.keys(PROPS).filter((k) => PROPS[k].test(target));
      const want = G.shuffle(own).slice(0, level <= 1 ? 2 : 3);
      const others = G.shuffle(GRAPHS.filter((g) => g !== target)).slice(0, 4);
      if (others.some((g) => want.every((k) => PROPS[k].test(g)))) continue;
      if (GRAPHS.filter((g) => want.every((k) => PROPS[k].test(g))).length > 1 && level >= 3) continue;
      const opts = G.shuffle([target].concat(others)).map((g) => ({ md: "$" + g.tex + "$", correct: g === target }));
      const md = "Which of the following graphs " + want.map((k) => PROPS[k].en).join(", and ") + "?";
      return step(md, opts, "**" + answer(opts) + ".** Gesucht: " + want.map((k) => PROPS[k].de).join(", ") + ". Jedes Merkmal schließt Optionen aus; ein einziger Punkt oder eine Asymptote, die nicht passt, genügt dafür.");
    }
    return TR.transformation(level, G);
  };


  // ---------------------------------------------------------------- Sommer 3: calculus with powers
  TR.ableitungwert = (level, G) => {
    if (level <= 1) {
      const c = G.int(2, 6), n = G.pick([2, 3, 4, -1, -2]), x0 = G.pick([1, 2, -1]);
      const val = c * n * Math.pow(x0, n - 1);
      const opts = nopts(val, [c * Math.pow(x0, n), c * n * Math.pow(x0, n), n * Math.pow(x0, n - 1), c * (n - 1) * Math.pow(x0, n - 2)].map((v) => +v.toFixed(4)), (v) => "$" + en(v) + "$");
      const term = n > 0 ? c + "x^{" + n + "}" : "\\dfrac{" + c + "}{x" + (n === -1 ? "" : "^{" + -n + "}") + "}";
      return step("If $f(x) = " + term + "$, what is $f'(" + x0 + ")$?", opts,
        "**" + answer(opts) + ".** " + (n < 0 ? "Als Potenz: $" + c + "x^{" + n + "}$. " : "") + "$f'(x) = " + c * n + "x^{" + (n - 1) + "}$, also $f'(" + x0 + ") = " + en(val) + "$.");
    }
    if (level === 2) {
      const a = G.int(1, 9), x0 = G.pick([1, 4, 9]);
      // f(x) = (x^2 + a)/sqrt(x) = x^{3/2} + a x^{-1/2};  f'(x) = 1.5 x^{1/2} - 0.5 a x^{-3/2}
      const r = Math.sqrt(x0), val = 1.5 * r - (0.5 * a) / (x0 * r);
      const opts = nopts(+val.toFixed(4), [1.5 * r + (0.5 * a) / (x0 * r), (2 * x0) / (0.5 / r), 1.5 * r, 2 * x0 - 0.5 * a].map((v) => +v.toFixed(4)), (v) => "$" + en(v, 4) + "$");
      return step("If $f(x) = \\dfrac{x^2 + " + a + "}{\\sqrt x}$, what is $f'(" + x0 + ")$?", opts,
        "**" + answer(opts) + ".** Erst umschreiben: $f(x) = x^{\\frac32} + " + a + "x^{-\\frac12}$. Dann $f'(x) = \\tfrac32 x^{\\frac12} - \\tfrac{" + a + "}{2} x^{-\\frac32}$ und $f'(" + x0 + ") = \\tfrac32 \\cdot " + r + " - \\tfrac{" + a + "}{2 \\cdot " + x0 * r + "} = " + G.tex(val, 4) + "$. Eine Quotientenregel braucht man nicht.");
    }
    if (level === 3) {
      const a = G.int(1, 5), x0 = G.pick([1, 2, -1]);
      // f(x) = (x + a)^2 / x = x + 2a + a^2/x ; f'(x) = 1 - a^2/x^2
      const val = 1 - (a * a) / (x0 * x0);
      const opts = nopts(+val.toFixed(4), [1 + (a * a) / (x0 * x0), 2 * (x0 + a), (2 * (x0 + a)) / 1 - 1, 1 - a * a].map((v) => +v.toFixed(4)), (v) => "$" + en(v) + "$");
      return step("If $f(x) = \\dfrac{(x + " + a + ")^2}{x}$, what is $f'(" + x0 + ")$?", opts,
        "**" + answer(opts) + ".** Ausmultiplizieren und teilen: $f(x) = x + " + 2 * a + " + " + a * a + "x^{-1}$, also $f'(x) = 1 - \\tfrac{" + a * a + "}{x^2}$ und $f'(" + x0 + ") = " + en(val) + "$.");
    }
    const k = G.int(1, 4) * 2;
    // f(x) = x^{3/2} - k sqrt(x): f'(x) = 1.5 sqrt(x) - k/(2 sqrt x) = 0  ->  x = k/3
    const xz = fr(k, 3);
    const opts = nopts(xz, [fr(2 * k, 3), [k, 1], fr(k * k, 9), fr(k, 2)], fracOr);
    return step("For $x > 0$, at which value of $x$ is the gradient of $y = x^{\\frac32} - " + k + "\\sqrt x$ equal to zero?", opts,
      "**" + answer(opts) + ".** $\\tfrac{dy}{dx} = \\tfrac32 x^{\\frac12} - \\tfrac{" + k + "}{2} x^{-\\frac12}$. Mit $2\\sqrt x$ multiplizieren: $3x - " + k + " = 0$, also $x = " + ftex(xz) + "$.");
  };

  TR.stationaer = (level, G) => {
    if (level <= 2) {
      const k = G.int(1, 4), c = G.int(1, 5) * G.sign();
      // f = x^3 - 3k^2 x + c: f' = 3x^2 - 3k^2 -> x = -k (max), x = k (min)
      const max = 2 * k * k * k + c, min = -2 * k * k * k + c;
      const askMax = level <= 1 || G.chance(0.5);
      const val = askMax ? max : min;
      const opts = nopts(val, [askMax ? min : max, k, -k, 3 * k * k + c, c].filter((v) => v !== val), (v) => "$" + v + "$");
      return step("$f(x) = x^3 - " + 3 * k * k + "x " + pm(c) + "$. What is the local " + (askMax ? "maximum" : "minimum") + " value of $f$?", opts,
        "**" + answer(opts) + ".** $f'(x) = 3x^2 - " + 3 * k * k + " = 0$ bei $x = \\pm " + k + "$. $f''(x) = 6x$: bei $x = -" + k + "$ negativ (Maximum), bei $x = " + k + "$ positiv (Minimum). $f(-" + k + ") = " + max + "$, $f(" + k + ") = " + min + "$.");
    }
    if (level === 3) {
      const a = G.int(1, 4);
      // f = x^4 - 4a x^3: f' = 4x^3 - 12a x^2 = 4x^2(x - 3a): stationary at 0 (terrace) and 3a (min)
      const opts = [1, 2, 3, 4].map((v) => ({ md: "$" + v + "$", correct: v === 2 }));
      return step("How many stationary points does $f(x) = x^4 - " + 4 * a + "x^3$ have?", opts,
        "**" + answer(opts) + ".** $f'(x) = 4x^3 - " + 12 * a + "x^2 = 4x^2(x - " + 3 * a + ")$: stationär bei $x = 0$ und $x = " + 3 * a + "$. Bei 0 wechselt $f'$ das Vorzeichen nicht (Terrassenpunkt), bei " + 3 * a + " liegt ein Minimum. Zwei stationäre Punkte, aber nur ein Extremum.");
    }
    const p = G.int(1, 3), q = p + G.int(1, 3);
    // f'(x) = (x - p)(x - q) -> f increasing for x < p and x > q
    const right = "$x < " + p + "$ or $x > " + q + "$";
    const opts = topts(G, right, ["$" + p + " < x < " + q + "$", "$x > " + q + "$", "$x < " + p + "$", "$x \\le " + p + "$ or $x \\ge " + q + "$"]);
    return step("$f'(x) = x^2 - " + (p + q) + "x + " + p * q + "$. For which values of $x$ is the gradient of $f$ positive?", opts,
      "**" + answer(opts) + ".** $f'(x) = (x - " + p + ")(x - " + q + ")$ ist positiv außerhalb der Nullstellen. Dort steigt $f$; zwischen " + p + " und " + q + " fällt es.");
  };

  TR.tangentenormal = (level, G) => {
    const b = G.int(-4, 4), c = G.int(-5, 5), x0 = G.pick([-2, -1, 1, 2, 3]);
    const y0 = x0 * x0 + b * x0 + c, m = 2 * x0 + b;
    const curve = "y = " + ptex([1, b, c]);
    if (level <= 2 || m === 0) {
      const icpt = y0 - m * x0;
      const opts = nopts(icpt, [y0 + m * x0, y0, m, -icpt].filter((v) => v !== icpt), (v) => "$" + v + "$");
      return step("The tangent to $" + curve + "$ at the point where $x = " + x0 + "$ meets the $y$-axis at $y =$", opts,
        "**" + answer(opts) + ".** $\\tfrac{dy}{dx} = 2x " + pm(b) + "$, bei $x = " + x0 + "$ also $" + m + "$. Punkt $(" + x0 + ", " + y0 + ")$. Tangente $y - " + (y0 < 0 ? "(" + y0 + ")" : y0) + " = " + m + "(x - " + (x0 < 0 ? "(" + x0 + ")" : x0) + ")$, für $x = 0$: $y = " + icpt + "$.");
    }
    // normal: gradient -1/m
    const icpt = fr(y0 * m + x0, m); // y = y0 - (1/m)(x - x0) -> at x = 0: y0 + x0/m
    const opts = nopts(icpt, [fr(y0 * m - x0, m), [y0 - m * x0, 1], fr(y0, 1), fr(x0, m)], fracOr);
    return step("The normal to $" + curve + "$ at the point where $x = " + x0 + "$ meets the $y$-axis at $y =$", opts,
      "**" + answer(opts) + ".** Steigung der Tangente $" + m + "$, der Normale $-\\tfrac{1}{" + m + "}$. Normale durch $(" + x0 + ", " + y0 + ")$: $y = " + y0 + " - \\tfrac{1}{" + m + "}(x - " + (x0 < 0 ? "(" + x0 + ")" : x0) + ")$; bei $x = 0$: $y = " + ftex(icpt) + "$.");
  };

  TR.dgl = (level, G) => {
    const a = G.pick([3, 6, 2, 4]), b = G.int(1, 4) * G.sign(), x0 = G.pick([0, 1, -1]), y0 = G.int(-3, 6), x1 = x0 + G.pick([1, 2]);
    // dy/dx = a x^2 + b  ->  y = a/3 x^3 + b x + C
    const F = (x) => (a / 3) * x * x * x + b * x;
    const C = y0 - F(x0), val = F(x1) + C;
    const opts = nopts(+val.toFixed(4), [F(x1), F(x1) - C, val + y0, F(x1) + y0].map((v) => +v.toFixed(4)).filter((v) => v !== +val.toFixed(4)), (v) => "$" + en(v) + "$");
    return step("$\\dfrac{dy}{dx} = " + ptex([a, 0, b]) + "$ and $y = " + y0 + "$ when $x = " + x0 + "$. What is $y$ when $x = " + x1 + "$?", opts,
      "**" + answer(opts) + ".** Integrieren: $y = " + (a % 3 === 0 ? (a / 3 === 1 ? "" : a / 3) : "\\tfrac{" + a + "}{3}") + "x^3 " + pm(b) + "x + C$. Bedingung: $" + y0 + " = " + G.tex(F(x0), 4) + " + C$, also $C = " + G.tex(C, 4) + "$. Dann $y(" + x1 + ") = " + G.tex(F(x1), 4) + " " + pm(+C.toFixed(4)) + " = " + G.tex(val, 4) + "$. Ohne $C$ fehlt die Information aus dem Punkt.");
  };

  TR.integralwert = (level, G) => {
    if (level <= 1) {
      const [a, b] = G.pick([[1, 4], [1, 9], [4, 9], [0, 4], [1, 16]]);
      // int_a^b x^{-1/2} dx = 2(sqrt b - sqrt a)
      const val = 2 * (Math.sqrt(b) - Math.sqrt(a));
      const opts = nopts(val, [Math.sqrt(b) - Math.sqrt(a), val + 1, b - a, 4 * (Math.sqrt(b) - Math.sqrt(a))].filter((v) => v !== val), (v) => "$" + en(v) + "$");
      return step("What is $\\displaystyle\\int_{" + a + "}^{" + b + "} \\frac{1}{\\sqrt x}\\,dx$?", opts,
        "**" + answer(opts) + ".** $\\tfrac{1}{\\sqrt x} = x^{-\\frac12}$ hat die Stammfunktion $2x^{\\frac12}$. $2\\sqrt{" + b + "} - 2\\sqrt{" + a + "} = " + en(val) + "$.");
    }
    if (level === 2) {
      const b = G.pick([4, 9]), c = G.int(1, 3);
      // int_1^b (c sqrt x - 1) dx = c * 2/3 (b^{3/2} - 1) - (b - 1)
      const val = c * (2 / 3) * (Math.pow(b, 1.5) - 1) - (b - 1);
      const v = fr(Math.round(c * 2 * (Math.pow(b, 1.5) - 1) - 3 * (b - 1)), 3);
      const opts = nopts(v, [fr(Math.round(c * 2 * (Math.pow(b, 1.5) - 1)), 3), fr(Math.round(3 * c * (Math.pow(b, 1.5) - 1) / 2 - 3 * (b - 1)), 3), [b - 1, 1], fr(Math.round(c * (Math.pow(b, 1.5) - 1) - 3 * (b - 1)), 3)], fracOr);
      return step("What is $\\displaystyle\\int_{1}^{" + b + "} \\left(" + (c === 1 ? "" : c) + "\\sqrt x - 1\\right)dx$?", opts,
        "**" + answer(opts) + ".** Stammfunktion $" + (c === 1 ? "" : c + " \\cdot ") + "\\tfrac23 x^{\\frac32} - x$. Einsetzen: $" + G.tex(val, 4) + "$.");
    }
    const r = G.int(1, 3);
    // y = x^2 - r^2 on [0, 2r]: negative on (0, r), positive on (r, 2r); total area = |int_0^r| + int_r^{2r}
    const neg = (2 * r * r * r) / 3, pos = (4 * r * r * r) / 3, tot = neg + pos, net = pos - neg;
    const opts = nopts(fr(Math.round(3 * tot), 3), [fr(Math.round(3 * net), 3), fr(Math.round(3 * pos), 3), fr(Math.round(3 * neg), 3)], fracOr);
    return step("What is the total area enclosed between the curve $y = x^2 - " + r * r + "$, the $x$-axis and the lines $x = 0$ and $x = " + 2 * r + "$?", opts,
      "**" + answer(opts) + ".** Der Graph schneidet die Achse bei $x = " + r + "$. Auf $[0, " + r + "]$ liegt er darunter: $\\int_0^{" + r + "} = -" + G.tex(neg, 4) + "$, Fläche $" + G.tex(neg, 4) + "$. Auf $[" + r + ", " + 2 * r + "]$: $" + G.tex(pos, 4) + "$. Zusammen $" + G.tex(tot, 4) + "$; das Integral über das Ganze wäre nur $" + G.tex(net, 4) + "$.");
  };

  TR.integralparameter = (level, G) => {
    if (level <= 2) {
      // int_0^a (2x - b) dx = a^2 - b a = c with a > 0
      const b = G.int(1, 4), a = b + G.int(1, 4), c = a * a - b * a; // roots of a^2 - b a - c = 0: a and b - a < 0
      const neg = b - a;
      const opts = nopts(a, [neg, a + b, c, Math.round(Math.sqrt(Math.abs(c)))].filter((v) => v !== a), (v) => "$" + v + "$");
      return step("Given that $a > 0$ and $\\displaystyle\\int_0^a (2x - " + b + ")\\,dx = " + c + "$, what is $a$?", opts,
        "**" + answer(opts) + ".** $\\left[x^2 - " + b + "x\\right]_0^a = a^2 - " + b + "a = " + c + "$, also $a^2 - " + b + "a - " + c + " = 0$ mit den Lösungen $" + a + "$ und $" + neg + "$. Wegen $a > 0$ bleibt $a = " + a + "$.");
    }
    const k = G.pick([3, 6]), t = G.pick([1, 2, 3]);
    // int_0^t (k x^2 + p) dx = k t^3/3 + p t = T  with p chosen integer
    const p = G.int(-3, 5), T = (k * t * t * t) / 3 + p * t;
    const opts = nopts(p, [p + 1, p - 1, Math.round(T), -p].filter((v) => v !== p), (v) => "$" + v + "$");
    return step("$\\displaystyle\\int_0^{" + t + "} \\left(" + (k === 1 ? "" : k) + "x^2 + p\\right)dx = " + en(T, 4) + "$. What is the value of $p$?", opts,
      "**" + answer(opts) + ".** $\\left[\\tfrac{" + k + "}{3}x^3 + px\\right]_0^{" + t + "} = " + G.tex((k * t * t * t) / 3, 4) + " + " + t + "p = " + G.tex(T, 4) + "$, also $p = " + p + "$.");
  };

  TR.integralfunktion = (level, G) => {
    if (level <= 2) {
      const A = G.int(2, 9), B = A + G.int(2, 9), u = G.int(1, 4), w = u + G.int(1, 4);
      const opts = nopts(B - A, [A + B, A, B, A - B], (v) => "$" + v + "$");
      return step("$\\displaystyle\\int_0^{" + u + "} f(x)\\,dx = " + A + "$ and $\\displaystyle\\int_0^{" + w + "} f(x)\\,dx = " + B + "$. What is $\\displaystyle\\int_{" + u + "}^{" + w + "} f(x)\\,dx$?", opts,
        "**" + answer(opts) + ".** Integrale über aneinandergrenzende Intervalle addieren sich: $\\int_0^{" + w + "} = \\int_0^{" + u + "} + \\int_{" + u + "}^{" + w + "}$, also $" + B + " - " + A + " = " + (B - A) + "$.");
    }
    if (level === 3) {
      const I = G.int(2, 8), L = G.int(1, 4), a = G.int(2, 4), c = G.int(1, 5);
      const val = a * I + c * L;
      const opts = nopts(val, [a * I + c, I + c * L, a * (I + c * L), a * I], (v) => "$" + v + "$");
      return step("Given that $\\displaystyle\\int_0^{" + L + "} f(x)\\,dx = " + I + "$, what is $\\displaystyle\\int_0^{" + L + "} \\big(" + a + "f(x) + " + c + "\\big)\\,dx$?", opts,
        "**" + answer(opts) + ".** Linearität: $" + a + " \\cdot " + I + " + \\int_0^{" + L + "} " + c + "\\,dx = " + a * I + " + " + c * L + " = " + val + "$. Die Konstante wird über die Intervalllänge " + L + " integriert.");
    }
    const x0 = G.pick([1, 2, 3]), n = G.pick([1, 2]);
    // d/dx int_1^{x^2} t^n dt = (x^2)^n * 2x = 2 x^{2n+1}
    const val = 2 * Math.pow(x0, 2 * n + 1);
    const opts = nopts(val, [Math.pow(x0, 2 * n), Math.pow(x0, 2 * n + 1), 2 * Math.pow(x0, 2 * n), val / 2 + 1].filter((v) => v !== val), (v) => "$" + v + "$");
    return step("What is the value of $\\dfrac{d}{dx}\\displaystyle\\int_1^{x^2} t^{" + n + "}\\,dt$ at $x = " + x0 + "$?", opts,
      "**" + answer(opts) + ".** Ohne Kettenregel: Das Integral ist $\\left[\\tfrac{t^{" + (n + 1) + "}}{" + (n + 1) + "}\\right]_1^{x^2} = \\tfrac{x^{" + 2 * (n + 1) + "}}{" + (n + 1) + "} - \\tfrac{1}{" + (n + 1) + "}$. Ableiten: $2x^{" + (2 * n + 1) + "}$, bei $x = " + x0 + "$ also $" + val + "$.");
  };

  TR.monotonieparam = (level, G) => {
    const c = G.pick([3, 12, 27, 48]);
    // f = x^3 + k x^2 + c x: f' = 3x^2 + 2kx + c >= 0 for all x  <=>  4k^2 - 12c <= 0  <=>  k^2 <= 3c
    const bound = Math.sqrt(3 * c);
    const right = "$-" + bound + " \\le k \\le " + bound + "$";
    const opts = topts(G, right, ["$-" + bound + " < k < " + bound + "$", "$k \\ge " + bound + "$", "$k \\le -" + bound + "$ or $k \\ge " + bound + "$", "$-" + c + " \\le k \\le " + c + "$", "$0 \\le k \\le " + bound + "$"]);
    return step("For which values of $k$ is $f(x) = x^3 + kx^2 + " + c + "x$ increasing for all real $x$?", opts,
      "**" + answer(opts) + ".** $f'(x) = 3x^2 + 2kx + " + c + " \\ge 0$ für alle $x$ heißt: Die nach oben geöffnete Parabel hat keine zwei Nullstellen, $\\Delta = 4k^2 - " + 12 * c + " \\le 0$, also $k^2 \\le " + 3 * c + "$. Am Rand berührt $f'$ die Achse nur in einem Punkt; $f$ steigt trotzdem überall.");
  };


  // ---------------------------------------------------------------- Sommer 4: coordinates and trigonometry
  TR.gerade = (level, G) => {
    if (level <= 1) {
      const x1 = G.int(-4, 4), y1 = G.int(-4, 4), dx = G.int(1, 4) * G.sign(), dy = G.int(1, 5) * G.sign();
      const m = fr(dy, dx);
      const opts = nopts(m, [fr(dx, dy), fr(-dy, dx), fr(-dx, dy), [dy, 1]], fracOr);
      return step("What is the gradient of the line through $(" + x1 + ", " + y1 + ")$ and $(" + (x1 + dx) + ", " + (y1 + dy) + ")$?", opts,
        "**" + answer(opts) + ".** $m = \\tfrac{y_2 - y_1}{x_2 - x_1} = \\tfrac{" + dy + "}{" + dx + "} = " + ftex(m) + "$.");
    }
    if (level === 2) {
      // line a x + b y = c; perpendicular through (p, q): gradient b/a; y-intercept q - (b/a) p
      const a = G.int(1, 4), b = G.int(1, 4) * G.sign(), c = G.int(1, 9), p = G.int(-3, 3), q = G.int(-3, 5);
      const icpt = fr(q * a - b * p, a);
      const opts = nopts(icpt, [fr(q * a + b * p, a), fr(q * b - a * p, b), [q, 1], fr(-(q * a - b * p), a)], fracOr);
      return step("The line through $(" + p + ", " + q + ")$ perpendicular to $" + a + "x " + pm(b) + "y = " + c + "$ crosses the $y$-axis at $y =$", opts,
        "**" + answer(opts) + ".** Gegebene Gerade: $y = " + ftex(fr(-a, b)) + "x + \\ldots$, Steigung $" + ftex(fr(-a, b)) + "$. Senkrecht: Steigung $" + ftex(fr(b, a)) + "$ (negativer Kehrwert). Durch $(" + p + ", " + q + ")$: $y = " + q + " + " + ftex(fr(b, a)) + "(x - " + (p < 0 ? "(" + p + ")" : p) + ")$, bei $x = 0$: $" + ftex(icpt) + "$.");
    }
    if (level === 3) {
      const x1 = G.int(-3, 3), y1 = G.int(-3, 3), x2 = x1 + 2 * G.int(1, 3) * G.sign(), y2 = y1 + 2 * G.int(1, 3) * G.sign();
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, m = fr(-(x2 - x1), y2 - y1);
      // perpendicular bisector: y - my = m (x - mx)  ->  y = m x + (my - m mx)
      const cst = fr(my * m[1] - m[0] * mx, m[1]);
      const lin = (mm, cc) => "y = " + (mm[0] === mm[1] ? "" : mm[0] === -mm[1] ? "-" : ftex(mm)) + "x" + (cc[0] === 0 ? "" : (cc[0] < 0 ? " - " : " + ") + ftex([Math.abs(cc[0]), cc[1]]));
      const right = "$" + lin(m, cst) + "$";
      const wrongM = fr(y2 - y1, x2 - x1);
      const opts = topts(G, right, ["$" + lin(wrongM, fr(my * wrongM[1] - wrongM[0] * mx, wrongM[1])) + "$", "$" + lin(m, fr(-cst[0], cst[1])) + "$", "$" + lin([-m[0], m[1]], cst) + "$", "$" + lin(m, fr(cst[0] + cst[1], cst[1])) + "$", "$" + lin(m, fr(cst[0] - cst[1], cst[1])) + "$", "$" + lin(wrongM, cst) + "$"]);
      return step("What is the equation of the perpendicular bisector of $A(" + x1 + ", " + y1 + ")$ and $B(" + x2 + ", " + y2 + ")$?", opts,
        "**" + answer(opts) + ".** Mittelpunkt $(" + mx + ", " + my + ")$, Steigung von $AB$: $" + ftex(wrongM) + "$, also senkrecht $" + ftex(m) + "$. Gerade durch den Mittelpunkt: $" + lin(m, cst) + "$.");
    }
    const [dx, dy, d] = G.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]);
    const x1 = G.int(-4, 4), y1 = G.int(-4, 4), sx = G.sign(), sy = G.sign();
    const opts = nopts(d, [dx + dy, d * d, Math.abs(dx - dy), d + 1], (v) => "$" + v + "$");
    return step("What is the distance between $(" + x1 + ", " + y1 + ")$ and $(" + (x1 + sx * dx) + ", " + (y1 + sy * dy) + ")$?", opts,
      "**" + answer(opts) + ".** Pythagoras: $\\sqrt{" + dx + "^2 + " + dy + "^2} = \\sqrt{" + d * d + "} = " + d + "$.");
  };

  TR.kreis = (level, G) => {
    const a0 = G.int(-5, 5), b = G.int(-5, 5), a = a0 === 0 && b === 0 ? 2 : a0, r = G.int(2, 7);
    const D = -2 * a, E = -2 * b, F = a * a + b * b - r * r;
    const eq = "x^2 + y^2 " + (D ? pm(D) + "x " : "") + (E ? pm(E) + "y " : "") + (F ? pm(F) + " " : "") + "= 0";
    if (level <= 2) {
      const askR = level === 2;
      if (askR) {
        const opts = nopts(r, [r * r, Math.round(Math.sqrt(Math.abs(F))) || r + 2, a * a + b * b, r + 1], (v) => "$" + v + "$");
        return step("What is the radius of the circle $" + eq + "$?", opts,
          "**" + answer(opts) + ".** Quadratisch ergänzen: $(x " + pm(-a) + ")^2 + (y " + pm(-b) + ")^2 = " + (a * a) + " + " + (b * b) + " " + pm(-F) + " = " + r * r + "$, also $r = " + r + "$.");
      }
      const right = "$(" + a + ", " + b + ")$";
      const opts = topts(G, right, ["$(" + -a + ", " + -b + ")$", "$(" + D + ", " + E + ")$", "$(" + b + ", " + a + ")$", "$(" + -D + ", " + -E + ")$"]);
      return step("What is the centre of the circle $" + eq + "$?", opts,
        "**" + answer(opts) + ".** $x^2 " + pm(D) + "x = (x " + pm(-a) + ")^2 - " + a * a + "$ und ebenso für $y$: Mittelpunkt $(" + a + ", " + b + ")$, also die halben Koeffizienten mit umgekehrtem Vorzeichen.");
    }
    if (level === 3) {
      const R = G.int(2, 7), c = G.int(-4, 4), d2 = G.int(-4, 4);
      const k = c * c + d2 * d2 - R * R;
      const opts = nopts(k, [-k, c * c + d2 * d2 + R * R, R * R, k + 2 * R].filter((v) => v !== k), (v) => "$" + v + "$");
      return step("$x^2 + y^2 " + pm(-2 * c) + "x " + pm(-2 * d2) + "y + k = 0$ is a circle of radius $" + R + "$. What is $k$?", opts,
        "**" + answer(opts) + ".** Mittelpunkt $(" + c + ", " + d2 + ")$; ergänzt: $(x " + pm(-c) + ")^2 + (y " + pm(-d2) + ")^2 = " + (c * c + d2 * d2) + " - k$. Also $" + (c * c + d2 * d2) + " - k = " + R * R + "$ und $k = " + k + "$.");
    }
    // tangent at a point (a + r cos, b + r sin) with Pythagorean triple offsets
    const [p, q, R] = G.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10]]);
    const sx = G.sign(), sy = G.sign(), cx = G.int(-3, 3), cy = G.int(-3, 3);
    const px = cx + sx * p, py = cy + sy * q;
    const m = fr(-(px - cx), py - cy);
    const opts = nopts(m, [fr(py - cy, px - cx), fr(px - cx, py - cy), [m[0] === 0 ? 1 : -m[1], m[0] === 0 ? 1 : m[0]]], fracOr);
    return step("The point $(" + px + ", " + py + ")$ lies on the circle with centre $(" + cx + ", " + cy + ")$. What is the gradient of the tangent to the circle at this point?", opts,
      "**" + answer(opts) + ".** Der Radius hat die Steigung $" + ftex(fr(py - cy, px - cx)) + "$; die Tangente steht senkrecht auf ihm: negativer Kehrwert $" + ftex(m) + "$. (Radius " + R + ".)");
  };

  TR.dreieckflaeche = (level, G) => {
    for (let t = 0; t < 20; t++) {
      const P = [[G.int(-4, 4), G.int(-4, 4)], [G.int(-4, 6), G.int(-4, 6)], [G.int(-4, 6), G.int(-4, 6)]];
      const twice = Math.abs(P[0][0] * (P[1][1] - P[2][1]) + P[1][0] * (P[2][1] - P[0][1]) + P[2][0] * (P[0][1] - P[1][1]));
      if (twice < 4) continue;
      const area = fr(twice, 2);
      const opts = nopts(area, [[twice, 1], fr(twice, 4), [twice + 2, 2], [twice - 2, 2]].filter((v) => v[0] > 0), fracOr);
      const pts = P.map((p) => "(" + p[0] + ", " + p[1] + ")").join(", ");
      return step("What is the area of the triangle with vertices " + "$" + pts + "$?", opts,
        "**" + answer(opts) + ".** Mit der Formel $\\tfrac12\\left|x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)\\right| = \\tfrac12 \\cdot " + twice + " = " + ftex(area) + "$. Alternativ: ein umschließendes Rechteck minus drei rechtwinklige Dreiecke.");
    }
    return TR.gerade(level, G);
  };

  const ANG = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]]; // fractions of pi
  const piTex = (p, q, k) => {
    // k * p/q * pi, reduced
    const f = fr(k * p, q);
    if (f[0] === 0) return "0";
    const num = f[0] === 1 ? "" : f[0] === -1 ? "-" : f[0];
    return f[1] === 1 ? num + "\\pi" : "\\tfrac{" + (f[0] === 1 ? "" : f[0]) + "\\pi}{" + f[1] + "}";
  };
  TR.sektor = (level, G) => {
    const r = G.pick([2, 3, 4, 6, 12]), [p, q] = G.pick(ANG);
    if (level <= 1) {
      // arc length r * theta
      const right = "$" + piTex(p, q, r) + "$";
      const opts = topts(G, right, ["$" + piTex(p, q, r * r) + "$", "$" + piTex(p, 2 * q, r * r) + "$", "$" + piTex(p, q, 2 * r) + "$", "$" + piTex(p, 2 * q, r) + "$", "$" + ftex(fr(r * p, q)) + "$", "$" + piTex(p, 4 * q, r) + "$"]);
      return step("A sector of a circle of radius " + r + " has angle $" + piTex(p, q, 1) + "$. What is the length of its arc?", opts,
        "**" + answer(opts) + ".** Bogenlänge $s = r\\theta = " + r + " \\cdot " + piTex(p, q, 1) + " = " + piTex(p, q, r) + "$. (Im Gradmaß wäre es der Anteil $\\tfrac{\\theta}{2\\pi}$ am Umfang.)");
    }
    if (level === 2) {
      const right = "$" + piTex(p, 2 * q, r * r) + "$";
      const opts = topts(G, right, ["$" + piTex(p, q, r * r) + "$", "$" + piTex(p, q, r) + "$", "$" + piTex(p, 2 * q, r) + "$", "$" + piTex(p, q, 2 * r * r) + "$", "$" + ftex(fr(r * r * p, 2 * q)) + "$", "$" + piTex(p, 4 * q, r * r) + "$"]);
      return step("A sector of a circle of radius " + r + " has angle $" + piTex(p, q, 1) + "$. What is its area?", opts,
        "**" + answer(opts) + ".** $A = \\tfrac12 r^2\\theta = \\tfrac12 \\cdot " + r * r + " \\cdot " + piTex(p, q, 1) + " = " + piTex(p, 2 * q, r * r) + "$.");
    }
    // segment: 1/2 r^2 (theta - sin theta) for theta in {pi/3, pi/2, 2pi/3, pi/6}
    const [tp, tq, sinTex, sinVal2] = G.pick([[1, 2, "1", [2, 2]], [1, 3, "\\tfrac{\\sqrt3}{2}", null], [2, 3, "\\tfrac{\\sqrt3}{2}", null], [1, 6, "\\tfrac12", [1, 2]]]);
    const R = G.pick([2, 4, 6]);
    const sector = piTex(tp, 2 * tq, R * R);
    const root3 = (c) => (c[0] === 1 && c[1] === 1 ? "\\sqrt3" : ftex(c) + "\\sqrt3");
    const tri = sinVal2 ? ftex(fr(R * R * sinVal2[0], 2 * sinVal2[1])) : root3(fr(R * R, 4));
    const right = "$" + sector + " - " + tri + "$";
    const triWrong = sinVal2 ? ftex(fr(R * R * sinVal2[0], sinVal2[1])) : root3(fr(R * R, 2));
    const opts = topts(G, right, ["$" + sector + " + " + tri + "$", "$" + sector + " - " + triWrong + "$", "$" + piTex(tp, tq, R * R) + " - " + tri + "$", "$" + sector + "$"]);
    return step("A chord of a circle of radius " + R + " subtends an angle of $" + piTex(tp, tq, 1) + "$ at the centre. What is the area of the minor segment?", opts,
      "**" + answer(opts) + ".** Segment = Sektor minus Dreieck: $\\tfrac12 r^2\\theta - \\tfrac12 r^2 \\sin\\theta$ mit $\\sin " + piTex(tp, tq, 1) + " = " + sinTex + "$: $" + sector + " - " + tri + "$.");
  };

  TR.trigperiode = (level, G) => {
    const a = G.pick([1, 2, 3, 4]), b = G.pick([2, 3, 4, 6]), d = G.int(-3, 3), fn = G.pick(["\\sin", "\\cos"]);
    if (level <= 2) {
      const per = piTex(2, b, 1);
      const right = "$" + per + "$";
      const opts = topts(G, right, ["$" + piTex(2 * b, 1, 1) + "$", "$" + piTex(1, b, 1) + "$", "$2\\pi$", "$" + piTex(b, 2, 1) + "$"]);
      return step("What is the period of $y = " + (a === 1 ? "" : a) + fn + "(" + b + "x) " + (d ? pm(d) : "") + "$?", opts,
        "**" + answer(opts) + ".** $" + fn + "(bx)$ durchläuft eine Periode, wenn $bx$ um $2\\pi$ wächst, also $x$ um $\\tfrac{2\\pi}{" + b + "}$. Amplitude und Verschiebung ändern die Periode nicht.");
    }
    const right = "$" + (d - a) + " \\le y \\le " + (d + a) + "$";
    const opts = topts(G, right, ["$" + -a + " \\le y \\le " + a + "$", "$" + (d - 1) + " \\le y \\le " + (d + 1) + "$", "$" + (d - a) + " < y < " + (d + a) + "$", "$" + Math.min(d, a) + " \\le y \\le " + (d + a) + "$", "$" + (d - 2 * a) + " \\le y \\le " + (d + 2 * a) + "$", "$" + (-a - d) + " \\le y \\le " + (a - d) + "$"]);
    return step("What is the range of $y = " + (a === 1 ? "" : a) + fn + "(" + b + "x) " + (d ? pm(d) : "") + "$?", opts,
      "**" + answer(opts) + ".** " + fn.slice(1) + " nimmt alle Werte von $-1$ bis $1$ an; mal " + a + " gibt $-" + a + "$ bis $" + a + "$, dann um " + d + " verschoben.");
  };

  TR.trigextrem = (level, G) => {
    if (level <= 2) {
      const c = G.int(2, 8), k = G.int(1, c - 1), fn = G.pick(["\\sin^2 x", "\\cos^2 x"]);
      const max = c, min = c - k;
      const askMax = level <= 1;
      const val = askMax ? max : min;
      const opts = nopts(val, [askMax ? min : max, c + k, c - 2 * k, k], (v) => "$" + v + "$");
      return step("What is the " + (askMax ? "greatest" : "least") + " value of $" + c + " - " + k + fn + "$?", opts,
        "**" + answer(opts) + ".** $0 \\le " + fn + " \\le 1$, also liegt der Ausdruck zwischen $" + (c - k) + "$ und $" + c + "$.");
    }
    const p = G.int(2, 5), q = G.int(1, p - 1);
    // 1/(p + q cos x): max when denominator smallest p - q
    const opts = nopts(fr(1, p - q), [fr(1, p + q), fr(1, p), [p - q, 1], fr(1, q)], fracOr);
    return step("What is the maximum value of $\\dfrac{1}{" + p + " + " + (q === 1 ? "" : q) + "\\cos x}$?", opts,
      "**" + answer(opts) + ".** Der Nenner liegt zwischen $" + (p - q) + "$ und $" + (p + q) + "$ und ist positiv; der Bruch ist am größten beim kleinsten Nenner $" + (p - q) + "$, also bei $\\cos x = -1$.");
  };


  // ---------------------------------------------------------------- Sommer 5: statistics, probability and geometry
  TR.mittelwert = (level, G) => {
    if (level <= 2) {
      const n = G.int(6, 12), mean = G.int(8, 20), x = mean + G.int(4, 15) * G.sign();
      const total = n * mean, nm = fr(total - x, n - 1);
      const opts = nopts(nm, [[mean - (x - mean), 1], fr(total + x, n + 1), [mean, 1], fr(total - x, n)], fracOr);
      return step("The mean of " + n + " numbers is " + mean + ". One of the numbers, " + x + ", is removed. What is the mean of the remaining numbers?", opts,
        "**" + answer(opts) + ".** Über die Summe: $" + n + " \\cdot " + mean + " = " + total + "$; ohne " + x + " bleibt $" + (total - x) + "$ für $" + (n - 1) + "$ Zahlen, Mittelwert $" + ftex(nm) + "$. Den Mittelwert direkt zu verändern geht nicht.");
    }
    if (level === 3) {
      const n1 = G.int(10, 20), m1 = G.int(50, 70), n2 = G.int(5, 15), m2 = m1 + G.int(5, 20);
      const m = fr(n1 * m1 + n2 * m2, n1 + n2);
      const opts = nopts(m, [fr(m1 + m2, 2), [m2, 1], [m1, 1], fr(n1 * m2 + n2 * m1, n1 + n2)], fracOr);
      return step("In a test, " + n1 + " students have a mean score of " + m1 + " and " + n2 + " other students have a mean score of " + m2 + ". What is the mean score of all " + (n1 + n2) + " students?", opts,
        "**" + answer(opts) + ".** Gewichtet: $\\tfrac{" + n1 + " \\cdot " + m1 + " + " + n2 + " \\cdot " + m2 + "}{" + (n1 + n2) + "} = " + ftex(m) + "$. Der einfache Durchschnitt der beiden Mittelwerte stimmt nur bei gleich großen Gruppen.");
    }
    const a = G.pick([2, 3, -2]), b = G.int(1, 9), mu = G.int(4, 20), s = G.int(2, 6);
    const right = "mean $" + (a * mu + b) + "$, standard deviation $" + Math.abs(a) * s + "$";
    const opts = topts(G, right, ["mean $" + (a * mu + b) + "$, standard deviation $" + (Math.abs(a) * s + b) + "$", "mean $" + (a * (mu + b)) + "$, standard deviation $" + Math.abs(a) * s + "$",
      "mean $" + (a * mu + b) + "$, standard deviation $" + s + "$", "mean $" + (a * mu + b) + "$, standard deviation $" + a * a * s + "$"]);
    return step("A data set has mean " + mu + " and standard deviation " + s + ". Each value is multiplied by " + a + " and then " + b + " is added. What are the new mean and standard deviation?", opts,
      "**" + answer(opts) + ".** Der Mittelwert macht alles mit: $" + a + " \\cdot " + mu + " + " + b + "$. Die Standardabweichung misst Abstände: Die Verschiebung um " + b + " ändert sie nicht, der Faktor wirkt mit seinem Betrag $" + Math.abs(a) + "$.");
  };

  TR.bedingt = (level, G) => {
    if (level <= 2) {
      const total = G.pick([30, 40, 50, 60]), A = G.int(8, total / 2), B = G.int(8, total / 2), both = G.int(2, Math.min(A, B) - 2);
      const askAgivenB = G.chance(0.5);
      const v = askAgivenB ? fr(both, B) : fr(both, A);
      const opts = nopts(v, [fr(both, total), askAgivenB ? fr(both, A) : fr(both, B), fr(A, total), fr(A + B - both, total)], fracOr);
      return step("In a class of " + total + " students, " + A + " study French, " + B + " study German, and " + both + " study both. A student who studies " + (askAgivenB ? "German" : "French") + " is chosen at random. What is the probability that this student also studies " + (askAgivenB ? "French" : "German") + "?", opts,
        "**" + answer(opts) + ".** Bedingte Wahrscheinlichkeit: Die Grundmenge schrumpft auf die " + (askAgivenB ? B + " Deutschlernenden" : A + " Französischlernenden") + "; davon lernen " + both + " beides: $" + ftex(v) + "$.");
    }
    const pa = G.pick([[1, 2], [2, 5], [3, 5], [1, 4], [3, 4]]), pb = G.pick([[2, 5], [1, 2], [1, 4], [1, 5]]);
    // P(A u B) given -> P(A n B) = P(A) + P(B) - P(A u B)
    const PA = pa[0] / pa[1], PB = pb[0] / pb[1];
    const inter = G.pick([0.1, 0.2, 0.15]);
    if (inter >= Math.min(PA, PB)) return TR.bedingt(2, G);
    const union = PA + PB - inter;
    const cond = inter / PB;
    const show = (x) => "$" + en(x, 4) + "$";
    const opts = nopts(+cond.toFixed(4), [+(inter / PA).toFixed(4), inter, +(PA * PB).toFixed(4), +(union / PB).toFixed(4)].filter((x) => x <= 1), show);
    return step("$P(A) = " + en(PA) + "$, $P(B) = " + en(PB) + "$ and $P(A \\cup B) = " + en(union) + "$. What is $P(A \\mid B)$?", opts,
      "**" + answer(opts) + ".** Erst $P(A \\cap B) = P(A) + P(B) - P(A \\cup B) = " + G.tex(inter, 4) + "$, dann $P(A \\mid B) = \\tfrac{P(A \\cap B)}{P(B)} = " + G.tex(cond, 4) + "$.");
  };

  TR.ohnezurueck = (level, G) => {
    const r = G.int(3, 7), b = G.int(2, 5), n = r + b;
    if (level <= 2) {
      // at least one blue in two draws without replacement = 1 - P(both red)
      const v = fr(n * (n - 1) - r * (r - 1), n * (n - 1));
      const opts = nopts(v, [fr(b * (b - 1), n * (n - 1)), fr(2 * b, n), fr(n * n - r * r, n * n), fr(r * b, n * (n - 1))], fracOr);
      return step("A bag contains " + r + " red and " + b + " blue balls. Two balls are taken at random without replacement. What is the probability that at least one is blue?", opts,
        "**" + answer(opts) + ".** Gegenereignis: beide rot, $\\tfrac{" + r + "}{" + n + "} \\cdot \\tfrac{" + (r - 1) + "}{" + (n - 1) + "}$. Also $1 - \\tfrac{" + r * (r - 1) + "}{" + n * (n - 1) + "} = " + ftex(v) + "$.");
    }
    if (level === 3) {
      const v = fr(r * (r - 1) + b * (b - 1), n * (n - 1));
      const opts = nopts(v, [fr(r * r + b * b, n * n), fr(2 * r * b, n * (n - 1)), fr(r * (r - 1), n * (n - 1)), fr(1, 2)], fracOr);
      return step("A bag contains " + r + " red and " + b + " blue balls. Two balls are taken at random without replacement. What is the probability that they are the same colour?", opts,
        "**" + answer(opts) + ".** Beide rot oder beide blau: $\\tfrac{" + r + " \\cdot " + (r - 1) + " + " + b + " \\cdot " + (b - 1) + "}{" + n + " \\cdot " + (n - 1) + "} = " + ftex(v) + "$. Mit Zurücklegen wären es andere Nenner.");
    }
    // three draws: at least one blue
    const v = fr(n * (n - 1) * (n - 2) - r * (r - 1) * (r - 2), n * (n - 1) * (n - 2));
    const opts = nopts(v, [fr(3 * b, n), fr(n * n * n - r * r * r, n * n * n), fr(b * (b - 1) * (b - 2) || 1, n * (n - 1) * (n - 2))], fracOr);
    return step("A bag contains " + r + " red and " + b + " blue balls. Three balls are taken at random without replacement. What is the probability that at least one is blue?", opts,
      "**" + answer(opts) + ".** Gegenereignis: alle drei rot, $\\tfrac{" + r + " \\cdot " + (r - 1) + " \\cdot " + (r - 2) + "}{" + n + " \\cdot " + (n - 1) + " \\cdot " + (n - 2) + "}$; davon die Gegenwahrscheinlichkeit: $" + ftex(v) + "$.");
  };

  TR.raum = (level, G) => {
    if (level <= 2) {
      const [a, b, c, d] = G.pick([[2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [3, 4, 12, 13], [4, 4, 7, 9], [2, 10, 11, 15]]);
      const opts = nopts(d, [a + b + c, Math.round(Math.sqrt(a * a + b * b)) + c, d * d, d + 1], (v) => "$" + v + "$");
      return step("A cuboid measures $" + a + " \\times " + b + " \\times " + c + "$. How long is its space diagonal?", opts,
        "**" + answer(opts) + ".** Zweimal Pythagoras: Bodendiagonale $\\sqrt{" + a * a + " + " + b * b + "}$, dann mit der Höhe: $\\sqrt{" + a * a + " + " + b * b + " + " + c * c + "} = \\sqrt{" + d * d + "} = " + d + "$.");
    }
    if (level === 3) {
      // square pyramid, base edge 2s, slant edge e: half-diagonal s*sqrt2, height sqrt(e^2 - 2 s^2)
      const [s, e, h] = G.pick([[3, 5, Math.sqrt(7)], [2, 3, 1], [4, 6, 2], [1, 3, Math.sqrt(7)], [3, 9, Math.sqrt(63)]].filter((t) => Number.isInteger(t[2])));
      const opts = nopts(h, [Math.round(Math.sqrt(e * e - s * s)), e - s, Math.round(Math.sqrt(e * e + 2 * s * s)), h + 1], (v) => "$" + v + "$");
      return step("A square-based pyramid has base edge " + 2 * s + " and slant edges (from the apex to the corners) of length " + e + ". What is its height?", opts,
        "**" + answer(opts) + ".** Der Fußpunkt der Höhe ist die Mitte des Bodens; die halbe Diagonale ist $" + s + "\\sqrt2$. Pythagoras: $h^2 = " + e * e + " - " + 2 * s * s + " = " + h * h + "$, also $h = " + h + "$.");
    }
    // sphere and cone with equal volume and radius: h = 4r
    const r = G.int(1, 5);
    const opts = nopts(4 * r, [r, 2 * r, 3 * r, Math.round((4 * r) / 3)], (v) => "$" + v + "$");
    return step("A sphere and a cone have the same radius " + r + " and the same volume. What is the height of the cone?", opts,
      "**" + answer(opts) + ".** $\\tfrac43\\pi r^3 = \\tfrac13\\pi r^2 h \\Rightarrow h = 4r = " + 4 * r + "$.");
  };

  TR.vieleck = (level, G) => {
    const n = G.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
    const ext = 360 / n, int = 180 - ext;
    if (level <= 2) {
      const opts = nopts(n, [n + 1, n - 1, Math.round(360 / int), n * 2], (v) => "$" + v + "$");
      return step("Each interior angle of a regular polygon is $" + en(int) + "^\\circ$. How many sides does it have?", opts,
        "**" + answer(opts) + ".** Außenwinkel $180^\\circ - " + en(int) + "^\\circ = " + en(ext) + "^\\circ$; die Außenwinkel ergeben zusammen $360^\\circ$, also $n = \\tfrac{360}{" + en(ext) + "} = " + n + "$.");
    }
    if (level === 3) {
      const k = G.pick([2, 3, 4, 5, 7, 8]); // interior = k * exterior -> 180 = (k + 1) ext -> n = 2(k + 1)
      const m = 2 * (k + 1);
      const opts = nopts(m, [k + 1, 2 * k, m + 2, m - 1], (v) => "$" + v + "$");
      return step("In a regular polygon, each interior angle is " + k + " times each exterior angle. How many sides does it have?", opts,
        "**" + answer(opts) + ".** Innen- und Außenwinkel ergeben $180^\\circ$: $(" + k + " + 1) \\cdot$ Außenwinkel $= 180^\\circ$, Außenwinkel $" + en(180 / (k + 1)) + "^\\circ$, also $n = " + m + "$.");
    }
    const s = (n - 2) * 180;
    const opts = nopts(s, [n * 180, (n - 1) * 180, s - 180, 360], (v) => "$" + v + "^\\circ$");
    return step("What is the sum of the interior angles of a polygon with " + n + " sides?", opts,
      "**" + answer(opts) + ".** Von einer Ecke aus zerlegen die Diagonalen das $n$-Eck in $n - 2$ Dreiecke: $(" + n + " - 2) \\cdot 180^\\circ = " + s + "^\\circ$.");
  };

  TR.aehnlich = (level, G) => {
    const k = G.pick([[3, 2], [2, 1], [4, 3], [5, 2], [3, 1]]);
    if (level <= 2) {
      const A1 = G.int(2, 9) * k[1] * k[1];
      const A2 = (A1 * k[0] * k[0]) / (k[1] * k[1]);
      const opts = nopts(A2, [(A1 * k[0]) / k[1], (A1 * k[0] * k[0] * k[0]) / (k[1] * k[1] * k[1]), A1 * k[0], A1 + k[0]].map((v) => +v.toFixed(3)).filter((v) => v !== A2), (v) => "$" + en(v, 3) + "$");
      return step("Two similar triangles have corresponding sides in the ratio $" + k[1] + " : " + k[0] + "$. The smaller has area " + A1 + ". What is the area of the larger?", opts,
        "**" + answer(opts) + ".** Längenfaktor $\\tfrac{" + k[0] + "}{" + k[1] + "}$, Flächenfaktor sein Quadrat $\\tfrac{" + k[0] * k[0] + "}{" + k[1] * k[1] + "}$: $" + A2 + "$.");
    }
    // areas given -> volume
    const S1 = 4 * k[1] * k[1], S2 = 4 * k[0] * k[0], V1 = 8 * k[1] * k[1] * k[1];
    const V2 = (V1 * k[0] * k[0] * k[0]) / (k[1] * k[1] * k[1]);
    const opts = nopts(V2, [(V1 * S2) / S1, (V1 * k[0]) / k[1], V1 + S2 - S1].map((v) => +v.toFixed(3)).filter((v) => v !== V2), (v) => "$" + en(v, 3) + "$");
    return step("Two similar solids have surface areas $" + S1 + "\\ \\text{cm}^2$ and $" + S2 + "\\ \\text{cm}^2$. The smaller has volume $" + V1 + "\\ \\text{cm}^3$. What is the volume of the larger, in $\\text{cm}^3$?", opts,
      "**" + answer(opts) + ".** Flächenfaktor $\\tfrac{" + S2 + "}{" + S1 + "}$, Längenfaktor seine Wurzel $\\tfrac{" + k[0] + "}{" + k[1] + "}$, Volumenfaktor dessen Kubus: $" + V1 + " \\cdot \\tfrac{" + k[0] ** 3 + "}{" + k[1] ** 3 + "} = " + V2 + "$.");
  };

  TR.zusammengesetzt = (level, G) => {
    const s = G.pick([2, 4, 6, 8]);
    if (level <= 2) {
      // square of side s with a semicircle on one side: area s^2 + pi s^2 / 8
      const half = fr(s * s, 8);
      const piPart = half[1] === 1 ? (half[0] === 1 ? "\\pi" : half[0] + "\\pi") : "\\tfrac{" + (half[0] === 1 ? "" : half[0]) + "\\pi}{" + half[1] + "}";
      const right = "$" + s * s + " + " + piPart + "$";
      const quarter = fr(s * s, 4);
      const wrongPi = quarter[1] === 1 ? (quarter[0] === 1 ? "\\pi" : quarter[0] + "\\pi") : "\\tfrac{" + (quarter[0] === 1 ? "" : quarter[0]) + "\\pi}{" + quarter[1] + "}";
      const opts = topts(G, right, ["$" + s * s + " + " + wrongPi + "$", "$" + s * s + " + " + (s * s / 2) + "\\pi$", "$" + 4 * s + " + " + piPart + "$", "$" + s * s + "\\pi$"]);
      return step("A shape consists of a square of side " + s + " with a semicircle drawn outwards on one side (diameter " + s + "). What is the area of the shape?", opts,
        "**" + answer(opts) + ".** Quadrat $" + s * s + "$, Halbkreis mit Radius $" + s / 2 + "$: $\\tfrac12\\pi \\cdot " + (s * s) / 4 + " = " + piPart + "$.");
    }
    // perimeter: three sides of the square + half circumference pi s / 2
    const hp = fr(s, 2);
    const piPart = hp[1] === 1 ? (hp[0] === 1 ? "\\pi" : hp[0] + "\\pi") : "\\tfrac{" + (hp[0] === 1 ? "" : hp[0]) + "\\pi}{" + hp[1] + "}";
    const right = "$" + 3 * s + " + " + piPart + "$";
    const opts = topts(G, right, ["$" + 4 * s + " + " + piPart + "$", "$" + 3 * s + " + " + s + "\\pi$", "$" + 4 * s + " + " + s + "\\pi$", "$" + 3 * s + " + " + (s * s / 8) + "\\pi$"]);
    return step("A shape consists of a square of side " + s + " with a semicircle drawn outwards on one side. What is the perimeter of the shape?", opts,
      "**" + answer(opts) + ".** Zum Umfang gehören nur die drei freien Quadratseiten ($" + 3 * s + "$) und der Halbkreisbogen $\\tfrac12 \\pi \\cdot " + s + " = " + piPart + "$; die gemeinsame Seite liegt innen.");
  };

  TR.vektor = (level, G) => {
    const [m, n] = G.pick([[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]]);
    const t = m + n;
    const coef = (c, d) => { const f = fr(c, d); return f[1] === 1 ? (f[0] === 1 ? "" : String(f[0])) : "\\tfrac{" + f[0] + "}{" + f[1] + "}"; };
    const right = "$" + coef(n, t) + "\\mathbf a + " + coef(m, t) + "\\mathbf b$";
    const opts = topts(G, right, ["$" + coef(m, t) + "\\mathbf a + " + coef(n, t) + "\\mathbf b$", "$" + coef(m, t) + "(\\mathbf b - \\mathbf a)$", "$\\mathbf a + " + coef(n, t) + "\\mathbf b$", "$\\tfrac{1}{2}(\\mathbf b - \\mathbf a)$", "$\\mathbf a + \\mathbf b$", "$\\mathbf b - \\mathbf a$"]);
    return step("$\\overrightarrow{OA} = \\mathbf a$ and $\\overrightarrow{OB} = \\mathbf b$. The point $P$ lies on $AB$ with $AP : PB = " + m + " : " + n + "$. What is $\\overrightarrow{OP}$?", opts,
      "**" + answer(opts) + ".** $\\overrightarrow{OP} = \\mathbf a + \\tfrac{" + m + "}{" + t + "}(\\mathbf b - \\mathbf a) = " + coef(n, t) + "\\mathbf a + " + coef(m, t) + "\\mathbf b$. Probe: Die Koeffizienten ergeben zusammen 1, und $P$ liegt näher an " + (m < n ? "$A$" : m > n ? "$B$" : "keinem von beiden") + ".");
  };

  LW.generator("tmua-rechnen", {
    title: "TMUA calculations",
    make(level, G, params) {
      const list = [].concat((params && params.typ) || Object.keys(TR)).filter((k) => TR[k]);
      return TR[G.pick(list.length ? list : Object.keys(TR))](level, G);
    },
  });

  // groups of calculation types for training topics and papers (they name generators without params)
  const trGroup = (title, list) => ({ title, make: (level, G) => TR[G.pick(list.filter((k) => TR[k]))](level, G) });
  LW.generator("tmua-r-algebra", trGroup("Algebra", ["potenz", "surd", "diskriminante", "qungleichung", "ergaenzung", "restsatz", "umstellen", "betrag", "qform", "lgs"]));
  LW.generator("tmua-r-zahlen", trGroup("Numbers and ratio", ["prozent", "teiler", "proportional", "einheiten", "verhaeltnis"]));
  LW.generator("tmua-r-graphen", trGroup("Logarithms and graphs", ["logwert", "loggleichung", "expsub", "transformation", "anzahl", "graphmerkmal"]));
  LW.generator("tmua-r-analysis", trGroup("Calculus", ["ableitungwert", "stationaer", "tangentenormal", "dgl", "integralwert", "integralparameter", "integralfunktion", "monotonieparam"]));
  LW.generator("tmua-r-koordinaten", trGroup("Coordinates and trigonometry", ["gerade", "kreis", "dreieckflaeche", "sektor", "trigperiode", "trigextrem"]));
  LW.generator("tmua-r-statistik", trGroup("Statistics and probability", ["mittelwert", "bedingt", "ohnezurueck"]));
  LW.generator("tmua-r-geometrie", trGroup("Geometry and vectors", ["raum", "vieleck", "aehnlich", "zusammengesetzt", "vektor"]));
})();
