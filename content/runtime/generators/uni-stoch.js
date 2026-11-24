/* Task generators for Stochastik I (university): probability spaces, counting, conditional probability, distributions,
 * densities, transformations, expectation and variance, inequalities, limit theorems, estimators, confidence intervals,
 * tests, chi-square tests, regression. Level 1 (Leicht) to 4 (Experte); every task brings its way to the answer. */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  function Phi(z) {
    if (!isFinite(z)) return z > 0 ? 1 : 0;
    const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
    const e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
    return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
  }
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const C = (n, k) => { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
  const num = (md, answer, o) => Object.assign({ type: "numeric", md, answer, tolerance: 0.0006, placeholder: "Dezimalzahl, vier Stellen" }, o || {});
  const int = (md, answer, o) => Object.assign({ type: "numeric", md, answer, tolerance: 0, placeholder: "ganze Zahl" }, o || {});
  const tf = (md, answer, explain, o) => Object.assign({ type: "truefalse", md, answer, explain }, o || {});
  const choice = (G, md, right, wrong, explain, o) => Object.assign({ type: "choice", md, options: G.options(right, wrong), explain }, o || {});

  // ---------------------------------------------------------------- probability spaces
  const SPACE = [
    [1, "Für jedes Ereignis $A$ ist $\\{\\emptyset, A, A^c, \\Omega\\}$ eine $\\sigma$-Algebra.", true, "Sie enthält $\\Omega$, ist abgeschlossen unter Komplement und (abzählbarer) Vereinigung: Jede Vereinigung ergibt wieder eine der vier Mengen."],
    [1, "Die Potenzmenge $\\mathcal P(\\Omega)$ ist eine $\\sigma$-Algebra.", true, "Komplemente und beliebige Vereinigungen von Teilmengen sind wieder Teilmengen."],
    [1, "Aus $P(A) = 0$ folgt $A = \\emptyset$.", false, "Nullmengen können nichtleer sein: Für eine stetig verteilte Größe ist $P(X = 2) = 0$, obwohl $\\{X = 2\\}$ kein unmögliches Ereignis ist."],
    [2, "Für alle Ereignisse gilt $P(A \\cup B) \\le P(A) + P(B)$.", true, "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B) \\le P(A) + P(B)$ (Subadditivität)."],
    [2, "Für alle Ereignisse gilt $P(A \\cap B) \\ge P(A) + P(B) - 1$.", true, "Aus $P(A \\cup B) \\le 1$ und der Siebformel folgt $P(A \\cap B) = P(A) + P(B) - P(A \\cup B) \\ge P(A) + P(B) - 1$ (Bonferroni)."],
    [2, "$\\{\\emptyset, \\{1\\}, \\{1, 2, 3\\}\\}$ ist eine $\\sigma$-Algebra auf $\\Omega = \\{1, 2, 3\\}$.", false, "Das Komplement $\\{2, 3\\}$ von $\\{1\\}$ fehlt."],
    [3, "Es gibt eine Gleichverteilung auf $\\mathbb N$, also ein Wahrscheinlichkeitsmaß mit $P(\\{n\\}) = c$ für alle $n$.", false, "Mit $\\sigma$-Additivität wäre $1 = \\sum_n c$, für $c = 0$ ist die Summe 0, für $c > 0$ unendlich."],
    [3, "Aus $A_1 \\subseteq A_2 \\subseteq \\dots$ folgt $P\\bigl(\\bigcup_n A_n\\bigr) = \\lim_n P(A_n)$.", true, "Stetigkeit von unten: eine Folgerung der $\\sigma$-Additivität über die disjunkten Zuwächse $A_n \\setminus A_{n-1}$."],
    [3, "Der Durchschnitt zweier $\\sigma$-Algebren ist eine $\\sigma$-Algebra.", true, "Alle Eigenschaften gelten in beiden, also im Durchschnitt."],
    [4, "Die Vereinigung zweier $\\sigma$-Algebren ist eine $\\sigma$-Algebra.", false, "Auf $\\Omega = \\{1, 2, 3\\}$: $\\{\\emptyset, \\{1\\}, \\{2, 3\\}, \\Omega\\} \\cup \\{\\emptyset, \\{2\\}, \\{1, 3\\}, \\Omega\\}$ enthält $\\{1\\}$ und $\\{2\\}$, aber nicht $\\{1, 2\\}$."],
    [4, "Aus $A_1 \\supseteq A_2 \\supseteq \\dots$ folgt $P\\bigl(\\bigcap_n A_n\\bigr) = \\lim_n P(A_n)$.", true, "Stetigkeit von oben, über Komplemente aus der Stetigkeit von unten (bei Wahrscheinlichkeitsmaßen immer endlich)."],
    [4, "Ist $P(A_n) = 1$ für alle $n$, so ist $P\\bigl(\\bigcap_n A_n\\bigr) = 1$.", true, "$P\\bigl(\\bigcup_n A_n^c\\bigr) \\le \\sum_n P(A_n^c) = 0$: abzählbar viele fast sichere Ereignisse treten gemeinsam fast sicher ein."],
  ];
  gen("ust-raeume", {
    title: "Wahrscheinlichkeitsräume",
    make(level, G) {
      const pool = SPACE.filter((x) => x[0] === level);
      const [, md, ans, why] = G.pick(pool.length ? pool : SPACE);
      return tf(md, ans, why);
    },
  });

  // ---------------------------------------------------------------- counting
  const WORDS = [["ANANAS", [3, 2, 1]], ["BANANE", [1, 2, 2, 1]], ["STATISTIK", [2, 3, 1, 2, 1]], ["KOKOSNUSS", [2, 2, 3, 1, 1]], ["MISSISSIPPI", [1, 4, 4, 2]], ["ABRAKADABRA", [5, 2, 2, 1, 1]]];
  gen("ust-kombi", {
    title: "Abzählen",
    make(level, G) {
      if (level === 1) {
        if (G.chance(0.5)) {
          const n = G.int(4, 8);
          return int("Auf wie viele Arten lassen sich $" + n + "$ verschiedene Bücher in einer Reihe aufstellen?", fact(n), { explain: "$" + n + "! = " + fact(n) + "$: für den ersten Platz " + n + " Möglichkeiten, für den zweiten " + (n - 1) + ", und so weiter." });
        }
        const n = G.int(8, 15), k = G.int(2, 4);
        return int("Aus " + n + " Personen wird ein Komitee aus " + k + " Personen gewählt. Wie viele Komitees gibt es?", C(n, k), { explain: "Ohne Reihenfolge, ohne Wiederholung: $\\binom{" + n + "}{" + k + "} = " + C(n, k) + "$." });
      }
      if (level === 2) {
        const n = G.int(5, 10), k = G.int(2, 4), m = G.int(0, 3);
        const M = [
          ["mit Zurücklegen und **mit** Beachtung der Reihenfolge", Math.pow(n, k), "n^k = " + n + "^{" + k + "}"],
          ["ohne Zurücklegen und **mit** Beachtung der Reihenfolge", fact(n) / fact(n - k), "\\frac{n!}{(n-k)!} = \\frac{" + n + "!}{" + (n - k) + "!}"],
          ["ohne Zurücklegen und **ohne** Beachtung der Reihenfolge", C(n, k), "\\binom{n}{k} = \\binom{" + n + "}{" + k + "}"],
          ["mit Zurücklegen und **ohne** Beachtung der Reihenfolge", C(n + k - 1, k), "\\binom{n+k-1}{k} = \\binom{" + (n + k - 1) + "}{" + k + "}"],
        ][m];
        return int("Aus einer Urne mit $n = " + n + "$ nummerierten Kugeln werden $k = " + k + "$ Kugeln gezogen, " + M[0] + ". Wie viele Ergebnisse gibt es?", M[1], { explain: "$" + M[2] + " = " + M[1] + "$." + (m === 3 ? " Das sind die Kombinationen mit Wiederholung (Sterne und Striche)." : "") });
      }
      if (level === 3) {
        const k = G.pick([10, 15, 20, 23, 30, 40]);
        let q = 1;
        for (let i = 0; i < k; i++) q *= (365 - i) / 365;
        return num("Wie groß ist die Wahrscheinlichkeit, dass unter $" + k + "$ Personen mindestens zwei am selben Tag Geburtstag haben? (365 gleich wahrscheinliche Tage)", 1 - q,
          { explain: "Gegenereignis: alle verschieden, $\\frac{365 \\cdot 364 \\cdots " + (366 - k) + "}{365^{" + k + "}} \\approx " + G.tex(q, 4) + "$. Also $1 - " + G.tex(q, 4) + " \\approx " + G.tex(1 - q, 4) + "$." });
      }
      if (G.chance(0.5)) {
        const [w, parts] = G.pick(WORDS);
        const val = fact(w.length) / parts.reduce((a, b) => a * fact(b), 1);
        return int("Wie viele verschiedene Buchstabenfolgen lassen sich aus den Buchstaben von **" + w + "** bilden?", val, { explain: "Multinomialkoeffizient: $\\frac{" + w.length + "!}{" + parts.filter((x) => x > 1).map((x) => x + "!").join(" \\cdot ") + "} = " + val + "$; gleiche Buchstaben untereinander vertauscht ergeben dieselbe Folge." });
      }
      const n = G.int(4, 8);
      let s = 0;
      for (let j = 0; j <= n; j++) s += (j % 2 ? -1 : 1) / fact(j);
      return num(n + " Briefe werden zufällig in " + n + " adressierte Umschläge gesteckt. Wie groß ist die Wahrscheinlichkeit, dass **kein** Brief im richtigen Umschlag steckt?", s,
        { explain: "Siebformel (Rencontre-Problem): $\\sum_{j=0}^{" + n + "} \\frac{(-1)^j}{j!} \\approx " + G.tex(s, 4) + "$, schon nahe an $e^{-1} \\approx 0{,}3679$." });
    },
  });

  // ---------------------------------------------------------------- inclusion-exclusion
  gen("ust-sieb", {
    title: "Siebformel",
    make(level, G) {
      if (level === 1) {
        const a = G.int(3, 6) / 10, b = G.int(2, 5) / 10, c = G.int(1, Math.round(Math.min(a, b) * 10) - 1) / 10;
        return num("Es gilt $P(A) = " + G.tex(a) + "$, $P(B) = " + G.tex(b) + "$ und $P(A \\cap B) = " + G.tex(c) + "$. Bestimme $P(A \\cup B)$.", a + b - c, { explain: "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = " + G.tex(a + b - c) + "$." });
      }
      if (level === 2) {
        const N = G.pick([100, 120, 300, 600, 1000]);
        const f = (d) => Math.floor(N / d);
        const v = f(2) + f(3) + f(5) - f(6) - f(10) - f(15) + f(30);
        return int("Wie viele Zahlen in $\\{1, \\dots, " + N + "\\}$ sind durch 2, 3 oder 5 teilbar?", v,
          { explain: "Siebformel: $" + f(2) + " + " + f(3) + " + " + f(5) + " - " + f(6) + " - " + f(10) + " - " + f(15) + " + " + f(30) + " = " + v + "$ (die Schnitte sind die Vielfachen von 6, 10, 15 und 30)." });
      }
      if (level === 3) {
        const a = 0.4, b = 0.35, c = 0.3, ab = G.pick([0.1, 0.15]), ac = G.pick([0.1, 0.12]), bc = G.pick([0.08, 0.1]), abc = G.pick([0.03, 0.05]);
        const v = a + b + c - ab - ac - bc + abc;
        return num("Für drei Ereignisse gilt $P(A) = 0{,}4$, $P(B) = 0{,}35$, $P(C) = 0{,}3$, $P(A \\cap B) = " + G.tex(ab) + "$, $P(A \\cap C) = " + G.tex(ac) + "$, $P(B \\cap C) = " + G.tex(bc) + "$ und $P(A \\cap B \\cap C) = " + G.tex(abc) + "$. Bestimme $P(A \\cup B \\cup C)$.", v,
          { explain: "Einzeln addieren, Paarschnitte abziehen, Dreifachschnitt wieder addieren: $" + G.tex(a + b + c) + " - " + G.tex(ab + ac + bc) + " + " + G.tex(abc) + " = " + G.tex(v) + "$." });
      }
      const n = G.int(5, 9), k = 2;
      // P(at least one of k specific letters correct) by inclusion-exclusion
      const v = 2 / n - 1 / (n * (n - 1));
      return num("Bei einer zufälligen Permutation von $\\{1, \\dots, " + n + "\\}$: Wie wahrscheinlich ist es, dass **1 oder " + k + "** ein Fixpunkt ist?", v,
        { explain: "$P(A_1) = P(A_2) = \\frac1{" + n + "}$ und $P(A_1 \\cap A_2) = \\frac{(" + n + "-2)!}{" + n + "!} = \\frac1{" + n * (n - 1) + "}$, also $\\frac2{" + n + "} - \\frac1{" + n * (n - 1) + "} \\approx " + G.tex(v, 4) + "$." });
    },
  });

  // ---------------------------------------------------------------- conditional probability and Bayes
  gen("ust-bayes", {
    title: "Bedingte Wahrscheinlichkeit und Bayes",
    make(level, G) {
      if (level === 1) {
        const pb = G.int(3, 8) / 10, pab = G.int(1, Math.round(pb * 10) - 1) / 10;
        return num("Es gilt $P(B) = " + G.tex(pb) + "$ und $P(A \\cap B) = " + G.tex(pab) + "$. Bestimme $P(A \\mid B)$.", pab / pb, { explain: "$P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{" + G.tex(pab) + "}{" + G.tex(pb) + "} \\approx " + G.tex(pab / pb, 4) + "$." });
      }
      const sh = G.pick([[0.5, 0.3, 0.2], [0.6, 0.25, 0.15], [0.45, 0.35, 0.2], [0.4, 0.4, 0.2]]), d = G.pick([[0.02, 0.03, 0.05], [0.01, 0.04, 0.06], [0.03, 0.02, 0.08]]);
      const tot = sh.reduce((s, x, i) => s + x * d[i], 0);
      const story = "Drei Maschinen fertigen " + sh.map((x) => G.fmt(x * 100) + " %").join(", ") + " der Teile; ihre Ausschussquoten sind " + d.map((x) => G.fmt(x * 100) + " %").join(", ") + ".";
      const sum = sh.map((x, i) => G.tex(x) + " \\cdot " + G.tex(d[i])).join(" + ");
      if (level === 2) return num(story + " Wie groß ist die Wahrscheinlichkeit, dass ein zufälliges Teil Ausschuss ist?", tot, { explain: "Totale Wahrscheinlichkeit: $" + sum + " = " + G.tex(tot, 4) + "$." });
      if (level === 3) {
        const i = G.int(0, 2), v = (sh[i] * d[i]) / tot;
        return num(story + " Ein Teil ist Ausschuss. Mit welcher Wahrscheinlichkeit stammt es von Maschine " + (i + 1) + "?", v,
          { explain: "Bayes: $\\frac{" + G.tex(sh[i]) + " \\cdot " + G.tex(d[i]) + "}{" + sum + "} = \\frac{" + G.tex(sh[i] * d[i], 4) + "}{" + G.tex(tot, 4) + "} \\approx " + G.tex(v, 4) + "$." });
      }
      const ra = G.int(2, 6), rb = G.int(1, 5), na = 8, nb = 8;
      const v = (0.5 * ra / na) / (0.5 * ra / na + 0.5 * rb / nb);
      return num("Urne A enthält " + ra + " rote und " + (na - ra) + " weiße Kugeln, Urne B " + rb + " rote und " + (nb - rb) + " weiße. Eine Urne wird per Münzwurf gewählt, daraus eine Kugel gezogen: Sie ist rot. Wie wahrscheinlich stammt sie aus Urne A?", v,
        { explain: "$P(A \\mid \\text{rot}) = \\frac{\\frac12 \\cdot \\frac{" + ra + "}{8}}{\\frac12 \\cdot \\frac{" + ra + "}{8} + \\frac12 \\cdot \\frac{" + rb + "}{8}} = \\frac{" + ra + "}{" + (ra + rb) + "} \\approx " + G.tex(v, 4) + "$." });
    },
  });

  // ---------------------------------------------------------------- discrete distributions
  const pois = (l, k) => Math.exp(-l) * Math.pow(l, k) / fact(k);
  gen("ust-diskret", {
    title: "Diskrete Verteilungen",
    make(level, G) {
      if (level === 1) {
        const n = G.int(5, 15), p = G.pick([0.2, 0.25, 0.3, 0.4, 0.5]), k = G.int(1, Math.min(n - 1, Math.round(n * p) + 2));
        const v = C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        return num("$X \\sim \\mathrm{Bin}(" + n + ", " + G.tex(p) + ")$. Bestimme $P(X = " + k + ")$.", v, { explain: "$\\binom{" + n + "}{" + k + "} \\cdot " + G.tex(p) + "^{" + k + "} \\cdot " + G.tex(1 - p) + "^{" + (n - k) + "} \\approx " + G.tex(v, 4) + "$." });
      }
      if (level === 2) {
        if (G.chance(0.5)) {
          const l = G.int(2, 6), k = G.int(1, l + 1);
          let s = 0; for (let j = 0; j <= k; j++) s += pois(l, j);
          return num("$X$ ist Poisson-verteilt mit $\\lambda = " + l + "$. Bestimme $P(X \\le " + k + ")$.", s, { explain: "$\\sum_{j=0}^{" + k + "} e^{-" + l + "} \\frac{" + l + "^j}{j!} \\approx " + G.tex(s, 4) + "$." });
        }
        const p = G.pick([0.1, 0.2, 0.25, 1 / 6]), k = G.int(3, 8), v = Math.pow(1 - p, k);
        return num("$X$ ist die Nummer des ersten Erfolgs in unabhängigen Versuchen mit Erfolgswahrscheinlichkeit $p = " + (p === 1 / 6 ? "\\tfrac16" : G.tex(p)) + "$. Bestimme $P(X > " + k + ")$.", v,
          { explain: "$X > " + k + "$ heißt: die ersten " + k + " Versuche sind Misserfolge, $(1 - p)^{" + k + "} \\approx " + G.tex(v, 4) + "$." });
      }
      if (level === 3) {
        const N = G.pick([20, 25, 30]), M = G.int(4, 8), n = G.int(4, 6), k = G.int(1, Math.min(3, M));
        const v = (C(M, k) * C(N - M, n - k)) / C(N, n);
        return num("Unter " + N + " Losen sind " + M + " Gewinne. Man zieht " + n + " Lose ohne Zurücklegen. Wie wahrscheinlich " + (k === 1 ? "ist genau ein Gewinn" : "sind genau " + k + " Gewinne") + "?", v,
          { explain: "Hypergeometrisch: $\\frac{\\binom{" + M + "}{" + k + "}\\binom{" + (N - M) + "}{" + (n - k) + "}}{\\binom{" + N + "}{" + n + "}} \\approx " + G.tex(v, 4) + "$." });
      }
      const n = G.pick([200, 500, 1000]), p = G.pick([0.002, 0.004, 0.005]), k = G.int(0, 3), l = n * p, v = pois(l, k);
      return num("Ein Bauteil fällt mit Wahrscheinlichkeit $" + G.tex(p) + "$ aus; " + n + " Bauteile arbeiten unabhängig. Bestimme die **Poisson-Näherung** für $P(\\text{genau } " + k + " \\text{ Ausfälle})$.", v,
        { tolerance: 0.001, explain: "$\\lambda = np = " + G.tex(l) + "$ und $P \\approx e^{-" + G.tex(l) + "} \\frac{" + G.tex(l) + "^{" + k + "}}{" + k + "!} \\approx " + G.tex(v, 4) + "$ (Poisson-Grenzwertsatz)." });
    },
  });

  // ---------------------------------------------------------------- densities
  gen("ust-dichte", {
    title: "Dichten und Verteilungsfunktionen",
    make(level, G) {
      const k = G.int(1, 4);
      if (level === 1) return num("Für welches $c$ ist $f(x) = c\\,x^{" + k + "}$ auf $[0, 1]$ (sonst 0) eine Dichte?", k + 1, { explain: "$\\int_0^1 c\\,x^{" + k + "}\\,dx = \\frac{c}{" + (k + 1) + "} = 1$, also $c = " + (k + 1) + "$." });
      if (level === 2) {
        const l = G.pick([0.5, 1, 2, 0.2]), t = G.pick([1, 2, 3]);
        if (G.chance(0.5)) return num("$X \\sim \\mathrm{Exp}(" + G.tex(l) + ")$. Bestimme $P(X > " + t + ")$.", Math.exp(-l * t), { explain: "$P(X > t) = e^{-\\lambda t} = e^{-" + G.tex(l * t) + "} \\approx " + G.tex(Math.exp(-l * t), 4) + "$." });
        const s = G.pick([2, 5]);
        return num("$X \\sim \\mathrm{Exp}(" + G.tex(l) + ")$. Bestimme $P(X > " + (s + t) + " \\mid X > " + s + ")$.", Math.exp(-l * t), { explain: "Gedächtnislosigkeit: $\\frac{e^{-\\lambda(" + (s + t) + ")}}{e^{-\\lambda \\cdot " + s + "}} = e^{-\\lambda \\cdot " + t + "} \\approx " + G.tex(Math.exp(-l * t), 4) + "$." });
      }
      if (level === 3) {
        const mu = G.pick([50, 100, 170]), sg = G.pick([5, 10, 15]), a = mu - G.int(1, 2) * sg / 2, b = mu + G.int(1, 3) * sg / 2;
        const v = Phi((b - mu) / sg) - Phi((a - mu) / sg);
        return num("$X \\sim N(" + mu + ", " + sg + "^2)$. Bestimme $P(" + G.tex(a) + " \\le X \\le " + G.tex(b) + ")$.", v, { tolerance: 0.002, explain: "Standardisieren: $\\Phi(" + G.tex((b - mu) / sg, 2) + ") - \\Phi(" + G.tex((a - mu) / sg, 2) + ") \\approx " + G.tex(v, 4) + "$." });
      }
      return num("$X$ hat die Dichte $f(x) = " + (k + 1) + "x^{" + k + "}$ auf $[0, 1]$. Bestimme $E(X)$.", (k + 1) / (k + 2), { explain: "$E(X) = \\int_0^1 x \\cdot " + (k + 1) + "x^{" + k + "}\\,dx = \\frac{" + (k + 1) + "}{" + (k + 2) + "}$." });
    },
  });

  // ---------------------------------------------------------------- transformations
  gen("ust-transform", {
    title: "Transformation von Zufallsvariablen",
    make(level, G) {
      if (level === 1) {
        const a = G.pick([-3, -2, 2, 3, 0.5]), b = G.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), m = G.int(1, 6), v = G.int(2, 9);
        return num("Es gilt $E(X) = " + m + "$ und $\\mathrm{Var}(X) = " + v + "$. Bestimme $\\mathrm{Var}(" + G.tex(a) + "X " + G.term(b) + ")$.", a * a * v, { explain: "$\\mathrm{Var}(aX + b) = a^2\\,\\mathrm{Var}(X) = " + G.tex(a * a) + " \\cdot " + v + " = " + G.tex(a * a * v) + "$; die Verschiebung ändert die Streuung nicht." });
      }
      if (level === 2) {
        const k = G.int(2, 4), c = G.pick([0.25, 0.5, 0.64, 0.81]);
        return num("$U$ ist gleichverteilt auf $[0, 1]$ und $Y = U^{" + k + "}$. Bestimme $P(Y \\le " + G.tex(c) + ")$.", Math.pow(c, 1 / k), { explain: "$P(U^{" + k + "} \\le c) = P(U \\le c^{1/" + k + "}) = " + G.tex(c) + "^{1/" + k + "} \\approx " + G.tex(Math.pow(c, 1 / k), 4) + "$." });
      }
      if (level === 3) {
        const l = G.pick([1, 2, 3]);
        return choice(G, "$U$ ist gleichverteilt auf $(0, 1)$. Wie ist $Y = -\\tfrac{1}{" + l + "}\\ln U$ verteilt?", { md: "$\\mathrm{Exp}(" + l + ")$" },
          [{ md: "$\\mathrm{Exp}(\\tfrac1" + l + ")$" }, { md: "gleichverteilt auf $(0, " + l + ")$" }, { md: "$N(0, " + l + ")$" }],
          "$P(Y > t) = P(\\ln U < -" + l + "t) = P(U < e^{-" + l + "t}) = e^{-" + l + "t}$: das ist die Exponentialverteilung mit Rate " + l + ". So erzeugt man exponentialverteilte Zufallszahlen (Inversionsmethode).");
      }
      return choice(G, "$X$ ist gleichverteilt auf $[0, 1]$. Welche Dichte hat $Y = X^2$ auf $(0, 1]$?", { md: "$f_Y(y) = \\dfrac{1}{2\\sqrt y}$" },
        [{ md: "$f_Y(y) = 2y$" }, { md: "$f_Y(y) = \\sqrt y$" }, { md: "$f_Y(y) = 1$" }],
        "$F_Y(y) = P(X \\le \\sqrt y) = \\sqrt y$, abgeleitet $f_Y(y) = \\frac{1}{2\\sqrt y}$; die Dichte ist unbeschränkt, aber integrierbar.");
    },
  });

  // ---------------------------------------------------------------- expectation, variance, covariance
  gen("ust-ew", {
    title: "Erwartungswert, Varianz, Kovarianz",
    make(level, G) {
      const ex = G.int(-3, 6), ey = G.int(-3, 6), vx = G.int(1, 9), vy = G.int(1, 9), a = G.pick([2, 3, -2, 4]), b = G.pick([2, -3, 4, -2]);
      if (level === 1) return num("Es gilt $E(X) = " + ex + "$ und $E(Y) = " + ey + "$. Bestimme $E(" + a + "X " + G.term(b) + "Y + 5)$.", a * ex + b * ey + 5, { explain: "Linearität: $" + a + " \\cdot " + ex + " " + G.term(b) + " \\cdot " + ey + " + 5 = " + (a * ex + b * ey + 5) + "$, auch ohne Unabhängigkeit." });
      if (level === 2) return num("$X$ und $Y$ sind unabhängig mit $\\mathrm{Var}(X) = " + vx + "$ und $\\mathrm{Var}(Y) = " + vy + "$. Bestimme $\\mathrm{Var}(" + a + "X " + G.term(b) + "Y)$.", a * a * vx + b * b * vy,
        { explain: "Bei Unabhängigkeit: $" + a + "^2 \\cdot " + vx + " + " + b * b + " \\cdot " + vy + " = " + (a * a * vx + b * b * vy) + "$; auch bei einem Minuszeichen addieren sich die Varianzen." });
      if (level === 3) {
        const sx = G.int(2, 5), sy = G.int(2, 5), r = G.pick([-0.5, -0.25, 0.25, 0.5, 0.75]), cov = r * sx * sy;
        if (G.chance(0.5)) return num("Es gilt $\\sigma_X = " + sx + "$, $\\sigma_Y = " + sy + "$ und $\\mathrm{Cov}(X, Y) = " + G.tex(cov) + "$. Bestimme $\\mathrm{Var}(X + Y)$.", sx * sx + sy * sy + 2 * cov, { explain: "$\\mathrm{Var}(X + Y) = " + sx * sx + " + " + sy * sy + " + 2 \\cdot " + G.tex(cov) + " = " + G.tex(sx * sx + sy * sy + 2 * cov) + "$." });
        return num("Es gilt $\\mathrm{Var}(X) = " + sx * sx + "$, $\\mathrm{Var}(Y) = " + sy * sy + "$ und $\\mathrm{Cov}(X, Y) = " + G.tex(cov) + "$. Bestimme den Korrelationskoeffizienten.", r, { explain: "$\\rho = \\frac{\\mathrm{Cov}(X, Y)}{\\sigma_X \\sigma_Y} = \\frac{" + G.tex(cov) + "}{" + sx + " \\cdot " + sy + "} = " + G.tex(r) + "$." });
      }
      const n = G.int(5, 12);
      if (G.chance(0.5)) return num("Eine zufällige Permutation von $" + n + "$ Elementen: Bestimme den Erwartungswert der Anzahl der Fixpunkte.", 1, { explain: "Indikatoren: $X = \\sum_i \\mathbb 1\\{\\pi(i) = i\\}$, jeder mit Erwartung $\\frac1{" + n + "}$, also $E(X) = " + n + " \\cdot \\frac1{" + n + "} = 1$, unabhängig von $n$." });
      return num("Eine zufällige Permutation von $" + n + "$ Elementen: Bestimme die **Varianz** der Anzahl der Fixpunkte.", 1, { explain: "$\\mathrm{Var}(X) = \\sum_i \\mathrm{Var}(I_i) + \\sum_{i \\ne j} \\mathrm{Cov}(I_i, I_j) = n \\cdot \\frac1n(1 - \\frac1n) + n(n-1)\\bigl(\\frac{1}{n(n-1)} - \\frac1{n^2}\\bigr) = 1$." });
    },
  });

  // ---------------------------------------------------------------- inequalities
  gen("ust-ungleichung", {
    title: "Markov und Tschebyscheff",
    make(level, G) {
      if (level === 1) {
        const e = G.int(2, 10), a = e * G.int(2, 5);
        return num("$X \\ge 0$ hat $E(X) = " + e + "$. Welche obere Schranke liefert die Markov-Ungleichung für $P(X \\ge " + a + ")$?", e / a, { explain: "$P(X \\ge a) \\le \\frac{E(X)}{a} = \\frac{" + e + "}{" + a + "} \\approx " + G.tex(e / a, 4) + "$." });
      }
      if (level === 2) {
        const s2 = G.int(1, 9), c = G.int(2, 6);
        return num("$X$ hat $\\mathrm{Var}(X) = " + s2 + "$. Welche obere Schranke liefert die Tschebyscheff-Ungleichung für $P(|X - E(X)| \\ge " + c + ")$?", Math.min(1, s2 / (c * c)), { explain: "$P(|X - \\mu| \\ge c) \\le \\frac{\\sigma^2}{c^2} = \\frac{" + s2 + "}{" + c * c + "}" + (s2 / (c * c) > 1 ? "$, also nur die triviale Schranke 1." : " \\approx " + G.tex(s2 / (c * c), 4) + "$.") });
      }
      if (level === 3) {
        const eps = G.pick([0.05, 0.02, 0.1]), d = G.pick([0.05, 0.1]);
        const n = Math.ceil(1 / (4 * eps * eps * d) - 1e-9);
        return int("Mit wie vielen Würfen einer Münze unbekannter Trefferwahrscheinlichkeit $p$ ist nach Tschebyscheff sicher, dass $P(|h_n - p| \\ge " + G.tex(eps) + ") \\le " + G.tex(d) + "$ gilt? (mindestens nötiges $n$)", n,
          { explain: "$P(|h_n - p| \\ge \\varepsilon) \\le \\frac{p(1-p)}{n\\varepsilon^2} \\le \\frac{1}{4n\\varepsilon^2} \\le " + G.tex(d) + "$ ergibt $n \\ge \\frac{1}{4 \\cdot " + G.tex(eps) + "^2 \\cdot " + G.tex(d) + "} = " + n + "$." });
      }
      const s = G.int(2, 5), k = G.pick([2, 3, 4]);
      return num("$X$ hat Erwartungswert $\\mu$ und Standardabweichung $" + s + "$. Welche **untere** Schranke liefert Tschebyscheff für $P(|X - \\mu| < " + k * s + ")$?", 1 - 1 / (k * k), { explain: "$P(|X - \\mu| < k\\sigma) \\ge 1 - \\frac{1}{k^2} = 1 - \\frac1{" + k * k + "} \\approx " + G.tex(1 - 1 / (k * k), 4) + "$, für jede Verteilung." });
    },
  });

  // ---------------------------------------------------------------- limit theorems
  const CONV = [
    [1, "Fast sichere Konvergenz impliziert stochastische Konvergenz.", true, "Ist $X_n \\to X$ fast sicher, so gilt für jedes $\\varepsilon > 0$: $P(|X_n - X| > \\varepsilon) \\to 0$ (majorisierte Konvergenz der Indikatoren)."],
    [1, "Der zentrale Grenzwertsatz sagt: $\\frac{S_n - n\\mu}{\\sigma\\sqrt n}$ konvergiert in Verteilung gegen $N(0, 1)$.", true, "Für unabhängige, identisch verteilte $X_i$ mit endlicher Varianz $\\sigma^2 > 0$."],
    [2, "Stochastische Konvergenz impliziert fast sichere Konvergenz.", false, "Gegenbeispiel: die »wandernden Blöcke« $\\mathbb 1_{[k2^{-m}, (k+1)2^{-m}]}$ auf $[0, 1]$ konvergieren stochastisch gegen 0, aber in keinem Punkt."],
    [2, "Stochastische Konvergenz impliziert Konvergenz in Verteilung.", true, "Mit $\\varepsilon$-Argument: $F_n(x)$ liegt zwischen $F(x - \\varepsilon) - P(|X_n - X| > \\varepsilon)$ und $F(x + \\varepsilon) + P(|X_n - X| > \\varepsilon)$."],
    [2, "Das schwache Gesetz der großen Zahlen folgt für unabhängige $X_i$ mit gleicher endlicher Varianz direkt aus der Tschebyscheff-Ungleichung.", true, "$P(|\\bar X_n - \\mu| \\ge \\varepsilon) \\le \\frac{\\sigma^2}{n\\varepsilon^2} \\to 0$."],
    [3, "Konvergiert $X_n$ in Verteilung gegen eine Konstante $c$, so konvergiert $X_n$ stochastisch gegen $c$.", true, "$P(|X_n - c| > \\varepsilon) \\le F_n(c - \\varepsilon) + 1 - F_n(c + \\varepsilon) \\to 0$."],
    [3, "Aus $E(X_n) \\to 0$ folgt $X_n \\to 0$ stochastisch.", false, "$X_n = \\pm n$ mit Wahrscheinlichkeit je $\\tfrac12$ hat $E(X_n) = 0$, konvergiert aber nicht."],
    [3, "Der zentrale Grenzwertsatz gilt auch für Cauchy-verteilte $X_i$.", false, "Die Cauchy-Verteilung hat keinen Erwartungswert und keine Varianz; $\\bar X_n$ ist wieder Cauchy-verteilt."],
    [4, "Aus $E(X_n^2) \\to 0$ folgt $X_n \\to 0$ stochastisch.", true, "Markov für $X_n^2$: $P(|X_n| \\ge \\varepsilon) \\le \\frac{E(X_n^2)}{\\varepsilon^2} \\to 0$."],
    [4, "Konvergiert $X_n$ stochastisch gegen $X$, so gibt es eine Teilfolge, die fast sicher gegen $X$ konvergiert.", true, "Wähle $n_k$ mit $P(|X_{n_k} - X| > 2^{-k}) < 2^{-k}$; Borel-Cantelli liefert fast sichere Konvergenz."],
    [4, "Für das starke Gesetz der großen Zahlen (Etemadi) genügt paarweise Unabhängigkeit und $E|X_1| < \\infty$.", true, "Etemadis Satz: identisch verteilt, paarweise unabhängig, integrierbar reicht."],
  ];
  gen("ust-konvergenz", {
    title: "Konvergenzarten und Gesetze der großen Zahlen",
    make(level, G) {
      const pool = CONV.filter((x) => x[0] === level);
      const [, md, ans, why] = G.pick(pool.length ? pool : CONV);
      return tf(md, ans, why);
    },
  });
  gen("ust-zgws", {
    title: "Zentraler Grenzwertsatz",
    make(level, G) {
      const n = G.pick([30, 50, 100, 120]);
      if (level === 1) return num("Ein fairer Würfel wird $" + n + "$-mal geworfen, $S$ ist die Augensumme. Bestimme die Standardabweichung von $S$.", Math.sqrt((35 / 12) * n), { explain: "$\\mathrm{Var}(S) = n \\cdot \\frac{35}{12} = " + G.tex((35 / 12) * n, 3) + "$, also $\\sigma_S \\approx " + G.tex(Math.sqrt((35 / 12) * n), 4) + "$." });
      if (level === 2) {
        const mu = 3.5 * n, s = Math.sqrt((35 / 12) * n), x = Math.round(mu + G.pick([-1, 1, 1.5]) * s);
        const v = Phi((x - mu) / s);
        return num("Ein fairer Würfel wird $" + n + "$-mal geworfen. Bestimme mit dem zentralen Grenzwertsatz (ohne Stetigkeitskorrektur) $P(S \\le " + x + ")$ für die Augensumme $S$.", v, { tolerance: 0.006, explain: "$P(S \\le " + x + ") \\approx \\Phi\\bigl(\\frac{" + x + " - " + G.tex(mu) + "}{" + G.tex(s, 3) + "}\\bigr) = \\Phi(" + G.tex((x - mu) / s, 3) + ") \\approx " + G.tex(v, 4) + "$." });
      }
      if (level === 3) {
        const s = G.pick([2, 4, 5]), c = G.pick([0.5, 1]), v = 2 * Phi((c * Math.sqrt(n)) / s) - 1;
        return num("$X_1, \\dots, X_{" + n + "}$ sind unabhängig mit $E(X_i) = \\mu$ und $\\sigma = " + s + "$. Bestimme näherungsweise $P(|\\bar X - \\mu| \\le " + G.tex(c) + ")$.", v, { tolerance: 0.006, explain: "$\\bar X$ ist etwa $N(\\mu, \\frac{\\sigma^2}{n})$: $2\\Phi\\bigl(\\frac{" + G.tex(c) + "\\sqrt{" + n + "}}{" + s + "}\\bigr) - 1 \\approx " + G.tex(v, 4) + "$." });
      }
      const s = G.pick([2, 3, 5, 10]), c = G.pick([0.5, 1, 2]), m = Math.ceil(Math.pow((1.96 * s) / c, 2) - 1e-9);
      return int("Wie groß muss $n$ mindestens sein, damit $P(|\\bar X_n - \\mu| \\le " + G.tex(c) + ") \\approx 0{,}95$ (oder mehr) gilt, wenn $\\sigma = " + s + "$? (Normalnäherung)", m, { explain: "$1{,}96\\frac{\\sigma}{\\sqrt n} \\le " + G.tex(c) + " \\iff n \\ge \\bigl(\\frac{1{,}96 \\cdot " + s + "}{" + G.tex(c) + "}\\bigr)^2 \\approx " + G.tex(Math.pow((1.96 * s) / c, 2), 2) + "$, also $n = " + m + "$." });
    },
  });

  // ---------------------------------------------------------------- estimators
  gen("ust-schaetzer", {
    title: "Schätzer und Maximum-Likelihood",
    make(level, G) {
      if (level === 1) {
        if (G.chance(0.5)) { const n = G.int(20, 80), k = G.int(3, n - 3); return num("Bei " + n + " unabhängigen Bernoulli-Versuchen gab es " + k + " Erfolge. Bestimme den Maximum-Likelihood-Schätzer für $p$.", k / n, { explain: "$L(p) = p^{" + k + "}(1-p)^{" + (n - k) + "}$ wird maximal bei $\\hat p = \\frac{" + k + "}{" + n + "} \\approx " + G.tex(k / n, 4) + "$." }); }
        const xs = Array.from({ length: G.int(5, 8) }, () => G.int(0, 7)), m = xs.reduce((a, b) => a + b, 0) / xs.length;
        return num("Beobachtet wurden die Poisson-verteilten Werte $" + xs.join(", ") + "$. Bestimme den Maximum-Likelihood-Schätzer für $\\lambda$.", m, { explain: "Für die Poisson-Verteilung ist $\\hat\\lambda = \\bar x = \\frac{" + xs.reduce((a, b) => a + b, 0) + "}{" + xs.length + "} \\approx " + G.tex(m, 4) + "$." });
      }
      if (level === 2) {
        if (G.chance(0.5)) { const xs = Array.from({ length: 5 }, () => G.int(1, 9) / 2), m = xs.reduce((a, b) => a + b, 0) / 5; return num("Beobachtet wurden die exponentialverteilten Werte $" + xs.map((x) => G.tex(x)).join("; ") + "$. Bestimme den Maximum-Likelihood-Schätzer für $\\lambda$.", 1 / m, { explain: "$\\ln L(\\lambda) = n\\ln\\lambda - \\lambda\\sum x_i$, Ableitung null bei $\\hat\\lambda = \\frac1{\\bar x} = \\frac1{" + G.tex(m, 4) + "} \\approx " + G.tex(1 / m, 4) + "$." }); }
        return choice(G, "$X_1, \\dots, X_n$ sind gleichverteilt auf $[0, \\theta]$. Welcher Schätzer ist der Maximum-Likelihood-Schätzer für $\\theta$?", { md: "$\\max_i X_i$" }, [{ md: "$2\\bar X$" }, { md: "$\\bar X$" }, { md: "$\\min_i X_i$" }],
          "$L(\\theta) = \\theta^{-n}$ für $\\theta \\ge \\max X_i$, sonst 0. Das ist fallend in $\\theta$, also maximal beim kleinsten zulässigen Wert $\\max X_i$. (Der Momentenschätzer wäre $2\\bar X$.)");
      }
      if (level === 3) {
        const n = G.int(4, 12), s2 = G.int(2, 20);
        return num("$X_1, \\dots, X_{" + n + "}$ unabhängig mit Varianz $\\sigma^2 = " + s2 + "$. Bestimme $E\\bigl(\\frac1n\\sum (X_i - \\bar X)^2\\bigr)$.", ((n - 1) / n) * s2, { explain: "$E\\bigl(\\sum (X_i - \\bar X)^2\\bigr) = (n - 1)\\sigma^2$, also $\\frac{n-1}{n}\\sigma^2 = \\frac{" + (n - 1) + "}{" + n + "} \\cdot " + s2 + " \\approx " + G.tex(((n - 1) / n) * s2, 4) + "$: verzerrt nach unten. Darum teilt man durch $n - 1$." });
      }
      const n = G.int(5, 20), s2 = G.int(4, 16), c = G.pick([0.8, 0.9]);
      const mse = c * c * s2 / n + Math.pow((c - 1), 2) * 25;
      return num("$\\bar X$ schätzt $\\mu = 5$ bei $n = " + n + "$ und $\\sigma^2 = " + s2 + "$. Bestimme den mittleren quadratischen Fehler des geschrumpften Schätzers $T = " + G.tex(c) + "\\,\\bar X$.", mse, { explain: "$\\mathrm{MSE} = \\mathrm{Var}(T) + \\mathrm{Bias}^2 = " + G.tex(c) + "^2 \\frac{" + s2 + "}{" + n + "} + (" + G.tex(c) + " - 1)^2 \\cdot 5^2 \\approx " + G.tex(mse, 4) + "$." });
    },
  });

  // ---------------------------------------------------------------- confidence intervals
  const TQ = { 5: 2.776, 8: 2.365, 10: 2.262, 15: 2.145, 20: 2.093, 25: 2.064 }; // t_{n-1; 0,975} for n
  gen("ust-ki", {
    title: "Konfidenzintervalle",
    make(level, G) {
      if (level === 1) {
        const n = G.pick([16, 25, 36, 49, 64, 100]), s = G.pick([2, 4, 5, 10]), xb = G.int(20, 80) + G.int(0, 9) / 10, h = (1.96 * s) / Math.sqrt(n);
        return num("Normalverteilte Messwerte mit bekanntem $\\sigma = " + s + "$; aus $n = " + n + "$ Werten ist $\\bar x = " + G.tex(xb) + "$. Bestimme die **obere** Grenze des 95-%-Konfidenzintervalls für $\\mu$.", xb + h, { tolerance: 0.002, explain: "$\\bar x + 1{,}96\\frac{\\sigma}{\\sqrt n} = " + G.tex(xb) + " + 1{,}96 \\cdot \\frac{" + s + "}{" + Math.sqrt(n) + "} \\approx " + G.tex(xb + h, 4) + "$." });
      }
      if (level === 2) {
        const n = G.pick([5, 8, 10, 15, 20, 25]), s = G.int(2, 9) / 2, xb = G.int(10, 50), t = TQ[n], h = (t * s) / Math.sqrt(n);
        return num("Aus $n = " + n + "$ normalverteilten Werten: $\\bar x = " + xb + "$, $s = " + G.tex(s) + "$. Mit $t_{" + (n - 1) + ";\\,0{,}975} = " + G.tex(t, 3) + "$: Bestimme die **untere** Grenze des 95-%-Konfidenzintervalls für $\\mu$.", xb - h, { tolerance: 0.002, explain: "$\\bar x - t\\,\\frac{s}{\\sqrt n} = " + xb + " - " + G.tex(t, 3) + " \\cdot \\frac{" + G.tex(s) + "}{\\sqrt{" + n + "}} \\approx " + G.tex(xb - h, 4) + "$. Bei unbekanntem $\\sigma$ ersetzt das $t$-Quantil die 1,96." });
      }
      if (level === 3) {
        const s = G.pick([3, 5, 8, 10]), L = G.pick([1, 2, 4]), n = Math.ceil(Math.pow((2 * 1.96 * s) / L, 2) - 1e-9);
        return int("Wie viele Messungen braucht man mindestens, damit das 95-%-Konfidenzintervall für $\\mu$ bei bekanntem $\\sigma = " + s + "$ höchstens die Länge $" + L + "$ hat?", n, { explain: "Länge $2 \\cdot 1{,}96\\frac{\\sigma}{\\sqrt n} \\le " + L + " \\iff n \\ge \\bigl(\\frac{2 \\cdot 1{,}96 \\cdot " + s + "}{" + L + "}\\bigr)^2 \\approx " + G.tex(Math.pow((2 * 1.96 * s) / L, 2), 2) + "$, also $n = " + n + "$." });
      }
      const n = G.pick([200, 400, 500, 1000]), k = Math.round(n * G.int(20, 70) / 100), h = k / n, w = 2 * 1.96 * Math.sqrt((h * (1 - h)) / n);
      return num("Bei einer Umfrage sagen $" + k + "$ von $" + n + "$ ja. Bestimme die **Länge** des asymptotischen 95-%-Konfidenzintervalls für den Anteil.", w, { explain: "$2 \\cdot 1{,}96\\sqrt{\\frac{h(1-h)}{n}}$ mit $h = " + G.tex(h, 3) + "$: $\\approx " + G.tex(w, 4) + "$." });
    },
  });

  // ---------------------------------------------------------------- tests
  gen("ust-test", {
    title: "Gauß-Test und t-Test",
    make(level, G) {
      const n = G.pick([16, 25, 36, 64, 100]), s = G.pick([2, 4, 5, 8]), mu0 = G.int(20, 60), d = G.pick([-1.5, -1, -0.5, 0.5, 1, 1.5, 2]) * s / Math.sqrt(n) * G.pick([1, 1.5, 2]);
      const xb = +(mu0 + d).toFixed(2), z = (xb - mu0) / (s / Math.sqrt(n));
      if (level === 1) return num("Gauß-Test für $H_0\\colon \\mu = " + mu0 + "$ bei bekanntem $\\sigma = " + s + "$: Aus $n = " + n + "$ Werten ist $\\bar x = " + G.tex(xb) + "$. Bestimme die Teststatistik $z$.", z, { tolerance: 0.002, explain: "$z = \\frac{\\bar x - \\mu_0}{\\sigma/\\sqrt n} = \\frac{" + G.tex(xb) + " - " + mu0 + "}{" + s + "/" + Math.sqrt(n) + "} \\approx " + G.tex(z, 4) + "$." });
      if (level === 2) {
        const rej = Math.abs(z) > 1.96;
        return choice(G, "Zweiseitiger Gauß-Test auf dem Niveau 5 % mit $z = " + G.tex(z, 3) + "$. Wie wird entschieden?", { md: rej ? "$H_0$ verwerfen, denn $|z| > 1{,}96$" : "$H_0$ nicht verwerfen, denn $|z| \\le 1{,}96$" },
          [{ md: rej ? "$H_0$ nicht verwerfen, denn $|z| \\le 1{,}96$" : "$H_0$ verwerfen, denn $|z| > 1{,}96$" }, { md: "$H_0$ annehmen, denn $H_0$ ist damit bewiesen" }, { md: "Keine Entscheidung möglich ohne $\\sigma$" }],
          "Der Ablehnungsbereich ist $|z| > z_{0{,}975} = 1{,}96$. Nicht verwerfen heißt nicht, dass $H_0$ bewiesen ist.");
      }
      if (level === 3) {
        const p = 2 * (1 - Phi(Math.abs(z)));
        return num("Zweiseitiger Gauß-Test mit beobachtetem $z = " + G.tex(z, 3) + "$. Bestimme den $p$-Wert.", p, { tolerance: 0.003, explain: "$p = P(|Z| \\ge |z|) = 2\\bigl(1 - \\Phi(" + G.tex(Math.abs(z), 3) + ")\\bigr) \\approx " + G.tex(p, 4) + "$. Verworfen wird auf dem Niveau $\\alpha$ genau dann, wenn $p \\le \\alpha$." });
      }
      const m = G.pick([10, 15, 20]), sd = G.int(3, 8), xb2 = +(mu0 + G.pick([1, 1.5, 2, 3]) * sd / Math.sqrt(m)).toFixed(2), t = (xb2 - mu0) / (sd / Math.sqrt(m)), q = TQ[m];
      return num("$t$-Test für $H_0\\colon \\mu \\le " + mu0 + "$ gegen $\\mu > " + mu0 + "$: $n = " + m + "$, $\\bar x = " + G.tex(xb2) + "$, $s = " + sd + "$. Bestimme die Teststatistik $t$.", t, { tolerance: 0.002, explain: "$t = \\frac{\\bar x - \\mu_0}{s/\\sqrt n} \\approx " + G.tex(t, 4) + "$. Verglichen wird mit dem Quantil $t_{" + (m - 1) + ";\\,0{,}95}$ (für das Niveau 5 %); zum Vergleich $t_{" + (m - 1) + ";\\,0{,}975} = " + G.tex(q, 3) + "$." });
    },
  });
  gen("ust-chi2", {
    title: "Chi-Quadrat-Tests",
    make(level, G) {
      if (level === 1 || level === 4) {
        // deviations from 10 that cancel, so the counts add up to 60
        let obs;
        do {
          obs = [0, 1, 2, 3, 4].map(() => 10 + G.int(-5, 5));
          obs.push(60 - obs.reduce((a, b) => a + b, 0));
        } while (obs[5] < 3 || obs[5] > 18);
        const chi = obs.reduce((s, o) => s + Math.pow(o - 10, 2) / 10, 0);
        if (level === 1) return num("Ein Würfel wird 60-mal geworfen: Augenzahlen 1 bis 6 kamen $" + obs.join(", ") + "$-mal. Bestimme die $\\chi^2$-Statistik für den Test auf einen fairen Würfel.", chi, { tolerance: 0.002, explain: "Erwartet je 10: $\\chi^2 = \\sum \\frac{(n_i - 10)^2}{10} = " + G.tex(chi, 3) + "$." });
        const rej = chi > 11.07;
        return choice(G, "Ein Würfel wird 60-mal geworfen: " + obs.join(", ") + ". Es ist $\\chi^2 = " + G.tex(chi, 2) + "$; das 95-%-Quantil der $\\chi^2_5$-Verteilung ist $11{,}07$. Entscheidung auf dem Niveau 5 %?",
          { md: rej ? "Der Würfel ist auffällig: $H_0$ (fair) verwerfen." : "Kein Widerspruch zur Fairness: $H_0$ nicht verwerfen." }, [{ md: rej ? "Kein Widerspruch zur Fairness: $H_0$ nicht verwerfen." : "Der Würfel ist auffällig: $H_0$ (fair) verwerfen." }, { md: "Man braucht $\\chi^2_6$, weil es sechs Klassen gibt." }],
          "Sechs Klassen, keine geschätzten Parameter: $6 - 1 = 5$ Freiheitsgrade. Verworfen wird, wenn $\\chi^2 > 11{,}07$.");
      }
      if (level === 2) {
        const r = G.int(2, 4), c = G.int(2, 5);
        return choice(G, "Unabhängigkeitstest in einer Kontingenztafel mit $" + r + "$ Zeilen und $" + c + "$ Spalten: Wie viele Freiheitsgrade hat die $\\chi^2$-Verteilung?", { md: "$" + (r - 1) * (c - 1) + "$" }, [{ md: "$" + (r * c - 1) + "$" }, { md: "$" + (r + c - 2) + "$" }, { md: "$" + r * c + "$" }],
          "$(r - 1)(c - 1) = " + (r - 1) + " \\cdot " + (c - 1) + " = " + (r - 1) * (c - 1) + "$: So viele Zellen sind bei festen Randsummen frei.");
      }
      const a = G.int(15, 40), b = G.int(10, 35), c2 = G.int(10, 35), d = G.int(15, 40), N = a + b + c2 + d;
      const e = (rs, cs) => (rs * cs) / N, R1 = a + b, R2 = c2 + d, C1 = a + c2, C2 = b + d;
      const chi = [[a, R1, C1], [b, R1, C2], [c2, R2, C1], [d, R2, C2]].reduce((s, [o, rr, cc]) => s + Math.pow(o - e(rr, cc), 2) / e(rr, cc), 0);
      return num("Vierfeldertafel (beobachtet): $\\begin{pmatrix} " + a + " & " + b + " \\\\ " + c2 + " & " + d + " \\end{pmatrix}$. Bestimme die $\\chi^2$-Statistik für den Unabhängigkeitstest.", chi, { tolerance: 0.003, explain: "Erwartete Häufigkeiten $\\frac{\\text{Zeilensumme} \\cdot \\text{Spaltensumme}}{" + N + "}$, dann $\\sum \\frac{(\\text{beob.} - \\text{erw.})^2}{\\text{erw.}} \\approx " + G.tex(chi, 4) + "$." });
    },
  });

  // ---------------------------------------------------------------- regression
  gen("ust-regression", {
    title: "Lineare Regression",
    make(level, G) {
      if (level === 1) {
        const sxx = G.int(4, 20), b = G.pick([-2, -1.5, -0.5, 0.5, 1, 1.5, 2, 3]), sxy = b * sxx, xb = G.int(1, 9), yb = G.int(2, 20);
        return num("Aus Daten ist $\\bar x = " + xb + "$, $\\bar y = " + yb + "$, $s_{xx} = " + sxx + "$ und $s_{xy} = " + G.tex(sxy) + "$. Bestimme den Achsenabschnitt $a$ der Regressionsgeraden $y = a + bx$.", yb - b * xb, { explain: "$b = \\frac{s_{xy}}{s_{xx}} = " + G.tex(b) + "$, $a = \\bar y - b\\bar x = " + yb + " - " + G.tex(b) + " \\cdot " + xb + " = " + G.tex(yb - b * xb) + "$." });
      }
      const xs = G.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, G.int(4, 5)).sort((p, q) => p - q), bb = G.pick([-1, 0.5, 1, 2]), aa = G.int(0, 5);
      const ys = xs.map((x) => aa + bb * x + G.int(-2, 2));
      const n = xs.length, mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
      const b = sxy / sxx, a = my - b * mx, r = syy ? sxy / Math.sqrt(sxx * syy) : 1;
      const tab = "$x$: " + xs.join(", ") + "; $y$: " + ys.join(", ") + ".";
      if (level === 2) return num("Daten " + tab + " Bestimme die Steigung $b$ der Regressionsgeraden.", b, { tolerance: 0.002, explain: "$b = \\frac{\\sum (x_i - \\bar x)(y_i - \\bar y)}{\\sum (x_i - \\bar x)^2} = \\frac{" + G.tex(sxy, 3) + "}{" + G.tex(sxx, 3) + "} \\approx " + G.tex(b, 4) + "$." });
      if (level === 3) return num("Daten " + tab + " Bestimme das Bestimmtheitsmaß $R^2$ der Regressionsgeraden.", r * r, { tolerance: 0.002, explain: "Bei der einfachen linearen Regression ist $R^2 = r^2$ mit $r = \\frac{s_{xy}}{\\sqrt{s_{xx}s_{yy}}} \\approx " + G.tex(r, 4) + "$, also $R^2 \\approx " + G.tex(r * r, 4) + "$." });
      const x0 = G.int(8, 10);
      return num("Daten " + tab + " Welchen Wert sagt die Regressionsgerade für $x = " + x0 + "$ vorher?", a + b * x0, { tolerance: 0.003, explain: "$\\hat y = a + b x_0$ mit $b \\approx " + G.tex(b, 4) + "$ und $a = \\bar y - b\\bar x \\approx " + G.tex(a, 4) + "$: $\\hat y \\approx " + G.tex(a + b * x0, 4) + "$. Vorsicht: $x_0$ liegt außerhalb der Daten (Extrapolation)." });
    },
  });
})();
