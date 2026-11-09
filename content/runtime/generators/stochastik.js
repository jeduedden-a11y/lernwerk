/* Task generators for Stochastik und Statistik. Every call brings new numbers or new cases; level 1 (Leicht) to 4 (Experte).
 * A generator returns an ordinary step (numeric, choice, cloze, truefalse, sort, …) including hint and explanation. */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  function Phi(z) {
    const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
    const e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
    return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
  }
  const pmf = (n, p, k, G) => G.binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  const cdf = (n, p, k, G) => { let s = 0; for (let i = 0; i <= k; i++) s += pmf(n, p, i, G); return s; };
  const pct = (x, G, d) => G.fmt(x * 100, d == null ? 1 : d) + " %";
  const num4 = "Dezimalzahl, vier Stellen";

  function numeric(md, answer, o) {
    return Object.assign({ type: "numeric", md, answer, tolerance: 0.0006, placeholder: "Bruch oder Dezimalzahl" }, o || {});
  }

  // ---------------------------------------------------------------- Laplace

  const DIE_EVENTS = [
    { name: "eine gerade Zahl", set: [2, 4, 6] },
    { name: "eine Primzahl", set: [2, 3, 5] },
    { name: "ein Vielfaches von 3", set: [3, 6] },
    { name: "höchstens eine 2", set: [1, 2] },
    { name: "mindestens eine 5", set: [5, 6] },
    { name: "eine Zahl, die kein Teiler von 6 ist", set: [4, 5] },
  ];
  const DICE3 = (s) => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let d = 1; d <= 6; d++) if (a + b + d === s) c++; return c; };

  gen("stoch-laplace", {
    title: "Laplace",
    make(level, G) {
      if (level === 1) {
        const ev = G.pick(DIE_EVENTS);
        return numeric("Ein fairer Würfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit für " + ev.name + "?", ev.set.length / 6, {
          answerText: G.frac(ev.set.length, 6).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, "$1/$2"),
          hint: "Zähle die günstigen Augenzahlen ab. Alle sechs sind gleich wahrscheinlich.",
          explain: "Günstig sind $\\{" + ev.set.join(", ") + "\\}$, also $P = \\tfrac{" + ev.set.length + "}{6} = " + G.frac(ev.set.length, 6) + "$.",
        });
      }
      if (level === 2) {
        const kind = G.pick(["sum", "atleast", "product"]);
        if (kind === "sum") {
          const s = G.int(3, 11);
          const ways = 6 - Math.abs(s - 7);
          return numeric("Zwei faire Würfel. Wie groß ist die Wahrscheinlichkeit, dass die **Augensumme " + s + "** ist?", ways / 36, {
            hint: "Unterscheide die Würfel: Es gibt 36 gleich wahrscheinliche Paare.",
            explain: "Es gibt $" + ways + "$ Paare mit Summe $" + s + "$, also $P = \\tfrac{" + ways + "}{36} = " + G.frac(ways, 36) + "$.",
          });
        }
        if (kind === "atleast") {
          const s = G.int(8, 11);
          let ways = 0; for (let t = s; t <= 12; t++) ways += 6 - Math.abs(t - 7);
          return numeric("Zwei faire Würfel. Wie groß ist die Wahrscheinlichkeit, dass die Augensumme **mindestens " + s + "** ist?", ways / 36, {
            hint: "Zähle für jede Summe von " + s + " bis 12 die Paare und addiere.",
            explain: "Summen " + s + " bis 12 haben zusammen $" + ways + "$ der 36 Paare: $P = " + G.frac(ways, 36) + "$.",
          });
        }
        return numeric("Zwei faire Würfel. Wie groß ist die Wahrscheinlichkeit, dass das **Produkt** der Augenzahlen **gerade** ist?", 27 / 36, {
          hint: "Einfacher über das Gegenteil: Wann ist ein Produkt ungerade?",
          explain: "Ungerade ist das Produkt nur, wenn beide Zahlen ungerade sind: $3 \\cdot 3 = 9$ Paare. Also $P = 1 - \\tfrac{9}{36} = \\tfrac34$.",
        });
      }
      if (level === 3) {
        if (G.chance(0.5)) {
          const n = G.int(2, 6);
          const v = 1 - Math.pow(5 / 6, n);
          return numeric("Ein fairer Würfel wird " + n + "-mal geworfen. Wie groß ist die Wahrscheinlichkeit für **mindestens eine Sechs**? (vier Nachkommastellen)", v, {
            placeholder: num4, answerText: G.fmt(v, 4),
            hint: "»Mindestens eine« ist das Gegenteil von »keine«.",
            explain: "$P(\\text{keine Sechs}) = \\left(\\tfrac56\\right)^{" + n + "}$, also $P = 1 - \\left(\\tfrac56\\right)^{" + n + "} \\approx " + G.tex(v, 4) + "$.",
          });
        }
        const n = G.int(3, 8);
        const v = 1 - Math.pow(0.5, n);
        return numeric("Eine faire Münze wird " + n + "-mal geworfen. Wie groß ist die Wahrscheinlichkeit, **mindestens einmal Kopf** zu werfen?", v, {
          answerText: G.fmt(v, 4), hint: "Rechne mit dem Gegenereignis »nur Zahl«.",
          explain: "$1 - \\left(\\tfrac12\\right)^{" + n + "} = 1 - \\tfrac{1}{" + Math.pow(2, n) + "} = " + G.frac(Math.pow(2, n) - 1, Math.pow(2, n)) + "$.",
        });
      }
      // Experte
      if (G.chance(0.5)) {
        const s = G.pick([9, 10, 11, 12]);
        const ways = DICE3(s);
        return numeric("Drei faire Würfel. Wie groß ist die Wahrscheinlichkeit für die **Augensumme " + s + "**? (Bruch oder vier Nachkommastellen)", ways / 216, {
          answerText: ways + "/216", placeholder: "Bruch oder Dezimalzahl",
          hint: "Zähle geordnete Tripel: Zu jedem Paar der ersten beiden Würfel gibt es höchstens eine passende dritte Zahl.",
          explain: "Es gibt $" + ways + "$ der $216$ geordneten Tripel mit Summe $" + s + "$, also $P = \\tfrac{" + ways + "}{216} \\approx " + G.tex(ways / 216, 4) + "$. Galilei klärte so, warum 10 öfter fällt als 9, obwohl beide gleich viele **ungeordnete** Zerlegungen haben.",
        });
      }
      const a = 1 - Math.pow(5 / 6, 4), b = 1 - Math.pow(35 / 36, 24);
      return {
        type: "choice",
        md: "Welches Ereignis ist wahrscheinlicher? (Problem des Chevalier de Méré)",
        options: G.options(
          { md: "Mindestens eine Sechs in 4 Würfen mit einem Würfel", why: "" },
          [
            { md: "Mindestens eine Doppelsechs in 24 Würfen mit zwei Würfeln", why: "$1 - \\left(\\tfrac{35}{36}\\right)^{24} \\approx " + G.tex(b, 3) + "$, knapp unter einhalb." },
            { md: "Beide sind gleich wahrscheinlich, denn $4 : 6 = 24 : 36$.", why: "Die Proportion stimmt, aber Wahrscheinlichkeiten wachsen nicht linear mit der Zahl der Versuche." },
          ]
        ),
        explain: "$1 - \\left(\\tfrac56\\right)^4 \\approx " + G.tex(a, 3) + "$ gegen $1 - \\left(\\tfrac{35}{36}\\right)^{24} \\approx " + G.tex(b, 3) + "$. De Méré verlor mit der zweiten Wette Geld, Pascal und Fermat rechneten es 1654 nach.",
      };
    },
  });

  // ---------------------------------------------------------------- urns

  gen("stoch-urne", {
    title: "Urnenmodell",
    make(level, G) {
      const r = G.int(2, 6), b = G.int(2, 7), n = r + b;
      const urn = "In einer Urne liegen " + r + " rote und " + b + " blaue Kugeln. ";
      if (level === 1) return numeric(urn + "Du ziehst eine Kugel. Wie groß ist $P(\\text{rot})$?", r / n, {
        explain: "$P(\\text{rot}) = \\tfrac{" + r + "}{" + n + "}" + (G.gcd(r, n) > 1 ? " = " + G.frac(r, n) : "") + "$.",
      });
      if (level === 2) {
        const back = G.chance(0.5);
        const v = back ? (r / n) * (r / n) : (r * (r - 1)) / (n * (n - 1));
        return numeric(urn + "Du ziehst zweimal **" + (back ? "mit" : "ohne") + " Zurücklegen**. Wie groß ist die Wahrscheinlichkeit, zweimal Rot zu ziehen? (vier Nachkommastellen oder Bruch)", v, {
          answerText: back ? r * r + "/" + n * n : r * (r - 1) + "/" + n * (n - 1),
          hint: "Pfadregel: Multipliziere die Wahrscheinlichkeiten entlang des Pfades rot, rot." + (back ? "" : " Beim zweiten Zug fehlt eine rote Kugel."),
          explain: back ? "$\\tfrac{" + r + "}{" + n + "} \\cdot \\tfrac{" + r + "}{" + n + "} \\approx " + G.tex(v, 4) + "$." : "$\\tfrac{" + r + "}{" + n + "} \\cdot \\tfrac{" + (r - 1) + "}{" + (n - 1) + "} \\approx " + G.tex(v, 4) + "$.",
        });
      }
      if (level === 3) {
        const v = (2 * r * b) / (n * (n - 1));
        return numeric(urn + "Du ziehst zweimal ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für **genau eine rote** Kugel?", v, {
          answerText: G.fmt(v, 4),
          hint: "Zwei Pfade führen dorthin: erst rot, dann blau, oder umgekehrt.",
          explain: "$\\tfrac{" + r + "}{" + n + "}\\cdot\\tfrac{" + b + "}{" + (n - 1) + "} + \\tfrac{" + b + "}{" + n + "}\\cdot\\tfrac{" + r + "}{" + (n - 1) + "} = \\tfrac{" + 2 * r * b + "}{" + n * (n - 1) + "} \\approx " + G.tex(v, 4) + "$.",
        });
      }
      const bb = Math.max(3, b);
      const nn = r + bb;
      const v = 1 - G.binom(bb, 3) / G.binom(nn, 3);
      return numeric("In einer Urne liegen " + r + " rote und " + bb + " blaue Kugeln. Du ziehst **drei** Kugeln ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für **mindestens eine rote**?", v, {
        answerText: G.fmt(v, 4),
        hint: "Gegenereignis: alle drei blau. Wie viele Dreiermengen aus den blauen Kugeln gibt es, wie viele insgesamt?",
        explain: "$1 - \\dfrac{\\binom{" + bb + "}{3}}{\\binom{" + nn + "}{3}} = 1 - \\tfrac{" + G.binom(bb, 3) + "}{" + G.binom(nn, 3) + "} \\approx " + G.tex(v, 4) + "$.",
      });
    },
  });

  // ---------------------------------------------------------------- combinatorics

  const WORDS = ["OTTO", "ANNA", "ANANAS", "BANANE", "KAKAO", "MAMA", "RADAR", "TEST", "ABITUR", "KOKOS", "PAPAGEI", "MISSISSIPPI"];
  function arrangements(word, G) {
    const counts = {};
    for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
    let v = G.fact(word.length);
    for (const k in counts) v /= G.fact(counts[k]);
    return { v: Math.round(v), counts };
  }

  gen("stoch-kombi", {
    title: "Abzählen",
    make(level, G) {
      if (level === 1) {
        const n = G.int(3, 7);
        return numeric("Auf wie viele Arten können sich " + n + " Personen in eine Reihe stellen?", G.fact(n), {
          tolerance: 0, placeholder: "Anzahl",
          explain: "Für den ersten Platz gibt es $" + n + "$ Möglichkeiten, für den zweiten noch $" + (n - 1) + "$, und so weiter: $" + n + "! = " + G.fact(n) + "$.",
        });
      }
      if (level === 2) {
        const n = G.int(6, 15), k = G.int(2, 4);
        if (G.chance(0.5)) {
          const v = G.fact(n) / G.fact(n - k);
          return numeric("Aus " + n + " Läuferinnen werden die Plätze 1 bis " + k + " vergeben. Wie viele Siegerlisten sind möglich?", Math.round(v), {
            tolerance: 0, placeholder: "Anzahl", hint: "Die Reihenfolge zählt, niemand kann zwei Plätze belegen.",
            explain: "$" + Array.from({ length: k }, (_, i) => n - i).join(" \\cdot ") + " = " + Math.round(v) + "$, also $\\tfrac{" + n + "!}{" + (n - k) + "!}$.",
          });
        }
        return numeric("Aus " + n + " Personen wird ein Team aus " + k + " Personen gebildet. Wie viele verschiedene Teams gibt es?", G.binom(n, k), {
          tolerance: 0, placeholder: "Anzahl", hint: "Im Team zählt die Reihenfolge nicht.",
          explain: "$\\binom{" + n + "}{" + k + "} = \\dfrac{" + n + "!}{" + k + "!\\," + (n - k) + "!} = " + G.binom(n, k) + "$. Jede Reihenfolge der " + k + " Personen ergibt dasselbe Team, deshalb wird durch $" + k + "!$ geteilt.",
        });
      }
      if (level === 3) {
        const N = G.int(8, 15), m = G.int(3, 4), k = G.int(1, m - 1);
        const v = (G.binom(m, k) * G.binom(N - m, m - k)) / G.binom(N, m);
        return numeric("Lotto im Kleinen: Aus den Zahlen 1 bis " + N + " werden " + m + " gezogen, du kreuzt " + m + " an. Wie groß ist die Wahrscheinlichkeit für **genau " + k + " Richtige**? (vier Nachkommastellen)", v, {
          placeholder: num4, answerText: G.fmt(v, 4),
          hint: "Wähle " + k + " der " + m + " Gewinnzahlen und " + (m - k) + " der " + (N - m) + " Nieten, und teile durch alle möglichen Tipps.",
          explain: "$\\dfrac{\\binom{" + m + "}{" + k + "}\\binom{" + (N - m) + "}{" + (m - k) + "}}{\\binom{" + N + "}{" + m + "}} = \\dfrac{" + G.binom(m, k) * G.binom(N - m, m - k) + "}{" + G.binom(N, m) + "} \\approx " + G.tex(v, 4) + "$ (hypergeometrische Verteilung).",
        });
      }
      const w = G.pick(WORDS);
      const a = arrangements(w, G);
      const rep = Object.keys(a.counts).filter((c) => a.counts[c] > 1).map((c) => c + " " + a.counts[c] + "-mal");
      return numeric("Wie viele verschiedene Buchstabenfolgen lassen sich aus den Buchstaben von **" + w + "** bilden? Alle Buchstaben werden verwendet.", a.v, {
        tolerance: 0, placeholder: "Anzahl",
        hint: "Wären alle Buchstaben verschieden, gäbe es $" + w.length + "!$ Folgen. Gleiche Buchstaben zu vertauschen ändert nichts.",
        explain: "$\\dfrac{" + w.length + "!}{" + Object.values(a.counts).filter((c) => c > 1).map((c) => c + "!").join("\\cdot ") + "} = " + a.v + "$, denn " + rep.join(", ") + " lassen sich untereinander tauschen, ohne dass sich das Wort ändert.",
      });
    },
  });

  // ---------------------------------------------------------------- conditional probability and Bayes

  const CONTEXTS = [
    { a: "krank", na: "gesund", b: "positiv getestet", prev: [0.005, 0.02, 0.05, 0.1], sens: [0.9, 0.95, 0.98], spec: [0.9, 0.95, 0.97] },
    { a: "Spam", na: "keine Spam-Mail", b: "vom Filter markiert", prev: [0.2, 0.3, 0.4], sens: [0.9, 0.95, 0.99], spec: [0.9, 0.95, 0.98] },
    { a: "defekt", na: "in Ordnung", b: "aussortiert", prev: [0.01, 0.02, 0.05], sens: [0.9, 0.95], spec: [0.95, 0.97, 0.99] },
    { a: "Regen", na: "trocken", b: "Regen angesagt", prev: [0.2, 0.3], sens: [0.8, 0.85, 0.9], spec: [0.8, 0.85, 0.9] },
  ];

  gen("stoch-bayes", {
    title: "Bedingte Wahrscheinlichkeit",
    make(level, G) {
      const c = G.pick(CONTEXTS);
      const p = G.pick(c.prev), s = G.pick(c.sens), sp = G.pick(c.spec);
      const N = 10000;
      const A = Math.round(N * p), tp = Math.round(A * s), fp = Math.round((N - A) * (1 - sp));
      const pB = p * s + (1 - p) * (1 - sp);
      const post = (p * s) / pB;
      const facts = "Anteil " + c.a + ": $" + G.tex(p * 100, 1) + "\\,\\%$. Von den Fällen »" + c.a + "« sind $" + G.tex(s * 100, 0) + "\\,\\%$ " + c.b + ", von den Fällen »" + c.na + "« $" + G.tex((1 - sp) * 100, 0) + "\\,\\%$.";
      if (level === 1) return numeric(facts + "\n\nWie groß ist $P(\\text{" + c.a + "} \\cap \\text{" + c.b + "})$? (vier Nachkommastellen)", p * s, {
        placeholder: num4, answerText: G.fmt(p * s, 4),
        hint: "Pfadregel: Multipliziere entlang des Pfades.",
        explain: "$P(A \\cap B) = P(A) \\cdot P(B \\mid A) = " + G.tex(p, 3) + " \\cdot " + G.tex(s, 2) + " = " + G.tex(p * s, 4) + "$.",
      });
      if (level === 2) return numeric(facts + "\n\nWie groß ist die Wahrscheinlichkeit, dass ein zufälliger Fall " + c.b + " ist? (vier Nachkommastellen)", pB, {
        placeholder: num4, answerText: G.fmt(pB, 4),
        hint: "Zwei Pfade enden bei »" + c.b + "«. Addiere sie.",
        explain: "Satz der totalen Wahrscheinlichkeit: $" + G.tex(p, 3) + " \\cdot " + G.tex(s, 2) + " + " + G.tex(1 - p, 3) + " \\cdot " + G.tex(1 - sp, 2) + " \\approx " + G.tex(pB, 4) + "$.",
      });
      if (level === 3) return numeric(facts + "\n\nEin Fall ist " + c.b + ". Mit welcher Wahrscheinlichkeit ist er tatsächlich **" + c.a + "**? (in Prozent, eine Nachkommastelle)", post * 100, {
        tolerance: 0.15, placeholder: "Prozent", answerText: G.fmt(post * 100, 1) + " %",
        hint: "Von " + N + " Fällen: Wie viele sind " + c.a + " und " + c.b + ", wie viele " + c.b + " insgesamt?",
        explain: "Von $" + N + "$ Fällen sind $" + tp + "$ " + c.a + " und " + c.b + ", dazu $" + fp + "$ falsche Treffer. $P = \\tfrac{" + tp + "}{" + (tp + fp) + "} \\approx " + G.tex(post * 100, 1) + "\\,\\%$ (Satz von Bayes).",
      });
      // Experte: two independent positive results
      const post2 = (p * s * s) / (p * s * s + (1 - p) * (1 - sp) * (1 - sp));
      return numeric(facts + "\n\nEin Fall ist **zweimal unabhängig** " + c.b + " (zweite Prüfung mit derselben Güte). Wie wahrscheinlich ist er jetzt **" + c.a + "**? (in Prozent, eine Nachkommastelle)", post2 * 100, {
        tolerance: 0.15, placeholder: "Prozent", answerText: G.fmt(post2 * 100, 1) + " %",
        hint: "Nach dem ersten Treffer ist $P(A) = " + G.tex(post, 4) + "$ die neue Ausgangswahrscheinlichkeit. Wende Bayes noch einmal an.",
        explain: "Mit der neuen Basisrate $" + G.tex(post, 4) + "$: $\\dfrac{" + G.tex(post, 4) + " \\cdot " + G.tex(s, 2) + "}{" + G.tex(post, 4) + " \\cdot " + G.tex(s, 2) + " + " + G.tex(1 - post, 4) + " \\cdot " + G.tex(1 - sp, 2) + "} \\approx " + G.tex(post2 * 100, 1) + "\\,\\%$. Ein zweiter unabhängiger Befund wirkt viel stärker als der erste.",
      });
    },
  });

  // ---------------------------------------------------------------- independence (dice events, enumerated)

  const DICE_EVENTS = [
    { name: "der erste Würfel zeigt eine gerade Zahl", f: (a) => a % 2 === 0 },
    { name: "der zweite Würfel zeigt eine 6", f: (a, b) => b === 6 },
    { name: "die Augensumme ist 7", f: (a, b) => a + b === 7 },
    { name: "die Augensumme ist 8", f: (a, b) => a + b === 8 },
    { name: "beide Würfel zeigen dieselbe Zahl", f: (a, b) => a === b },
    { name: "die Augensumme ist gerade", f: (a, b) => (a + b) % 2 === 0 },
    { name: "der erste Würfel zeigt höchstens 2", f: (a) => a <= 2 },
    { name: "das Produkt ist größer als 12", f: (a, b) => a * b > 12 },
    { name: "mindestens ein Würfel zeigt eine 1", f: (a, b) => a === 1 || b === 1 },
  ];
  function diceProb(f) { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (f(a, b)) c++; return c; }

  gen("stoch-unabh", {
    title: "Unabhängigkeit",
    make(level, G) {
      if (level <= 2) {
        // four-field table with counts
        const N = 200;
        const pa = G.pick([0.2, 0.25, 0.4, 0.5]), pb = G.pick([0.3, 0.4, 0.5, 0.6]);
        const indep = G.chance(0.5);
        const ab = indep ? Math.round(N * pa * pb) : Math.round(N * pa * pb) + G.pick([-12, -8, 8, 12]);
        const A = Math.round(N * pa), B = Math.round(N * pb);
        const isIndep = Math.abs(ab / N - (A / N) * (B / N)) < 1e-9;
        const table = "| | $B$ | $\\bar B$ | Summe |\n|---|---|---|---|\n| $A$ | " + ab + " | " + (A - ab) + " | " + A + " |\n| $\\bar A$ | " + (B - ab) + " | " + (N - A - B + ab) + " | " + (N - A) + " |\n| Summe | " + B + " | " + (N - B) + " | " + N + " |";
        if (level === 1) return {
          type: "truefalse", md: "Sind $A$ und $B$ stochastisch unabhängig?\n\n" + table, answer: isIndep,
          explain: "$P(A) \\cdot P(B) = \\tfrac{" + A + "}{" + N + "} \\cdot \\tfrac{" + B + "}{" + N + "} = " + G.tex((A * B) / (N * N), 4) + "$ und $P(A \\cap B) = \\tfrac{" + ab + "}{" + N + "} = " + G.tex(ab / N, 4) + "$. " + (isIndep ? "Gleich, also unabhängig." : "Verschieden, also abhängig."),
        };
        const need = (A * B) / N;
        return numeric("In einer Vierfeldertafel mit $" + N + "$ Fällen ist $|A| = " + A + "$ und $|B| = " + B + "$. Wie viele Fälle müssten in $A \\cap B$ liegen, damit $A$ und $B$ unabhängig sind?", need, {
          tolerance: 0.01, placeholder: "Anzahl",
          hint: "Unabhängig heißt $P(A \\cap B) = P(A) \\cdot P(B)$.",
          explain: "$|A \\cap B| = N \\cdot \\tfrac{|A|}{N} \\cdot \\tfrac{|B|}{N} = \\tfrac{" + A + " \\cdot " + B + "}{" + N + "} = " + G.tex(need, 2) + "$.",
        });
      }
      if (level === 3) {
        const [e1, e2] = G.pickN(DICE_EVENTS, 2);
        const pa = diceProb(e1.f), pb = diceProb(e2.f), pab = diceProb((a, b) => e1.f(a, b) && e2.f(a, b));
        const isIndep = pab * 36 === pa * pb;
        return {
          type: "truefalse",
          md: "Zwei faire Würfel. $A$: " + e1.name + ". $B$: " + e2.name + ". Sind $A$ und $B$ unabhängig?",
          answer: isIndep,
          explain: "$P(A) = \\tfrac{" + pa + "}{36}$, $P(B) = \\tfrac{" + pb + "}{36}$, $P(A \\cap B) = \\tfrac{" + pab + "}{36}$. Unabhängig wäre $\\tfrac{" + pa + " \\cdot " + pb + "}{1296} = " + G.frac(pa * pb, 1296) + "$. " + (isIndep ? "Das passt: unabhängig." : "Das passt nicht: abhängig."),
        };
      }
      return {
        type: "truefalse",
        md: G.pick([
          "Zwei Ereignisse mit $P(A) > 0$ und $P(B) > 0$, die sich gegenseitig ausschließen, sind unabhängig.",
          "Sind $A$ und $B$ unabhängig, dann sind auch $A$ und $\\bar B$ unabhängig.",
        ]),
        answer: null,
        _pending: true,
      };
    },
  });
  // finalize the expert truefalse after the fact (keeps the pool readable above)
  const unabhMake = LW.generators["stoch-unabh"].make;
  LW.generators["stoch-unabh"].make = function (level, G, p) {
    const s = unabhMake(level, G, p);
    if (!s._pending) return s;
    const disjoint = s.md.startsWith("Zwei Ereignisse");
    return {
      type: "truefalse", md: s.md, answer: !disjoint,
      whyNot: disjoint ? "Ausschließend heißt $P(A \\cap B) = 0$, aber $P(A)\\,P(B) > 0$." : null,
      explain: disjoint
        ? "Wer weiß, dass $B$ eingetreten ist, weiß sicher, dass $A$ nicht eingetreten ist. Das ist die stärkste denkbare Abhängigkeit."
        : "$P(A \\cap \\bar B) = P(A) - P(A \\cap B) = P(A) - P(A)P(B) = P(A)\\,(1 - P(B)) = P(A)\\,P(\\bar B)$.",
    };
  };

  // ---------------------------------------------------------------- expected value

  function distribution(G) {
    const den = G.pick([4, 6, 8, 10, 12]);
    let a = G.int(1, den - 2), b = G.int(1, den - a - 1);
    const c = den - a - b;
    const xs = G.shuffle([G.int(-5, -1), G.int(0, 2), G.int(3, 8)]).sort((u, v) => u - v);
    return { xs, ws: [a, b, c], den };
  }
  const distTable = (d, G) => "| $x_i$ | " + d.xs.map((x) => "$" + x + "$").join(" | ") + " |\n|---|" + d.xs.map(() => "---").join("|") + "|\n| $P(X = x_i)$ | " + d.ws.map((w) => "$" + G.frac(w, d.den) + "$").join(" | ") + " |";

  gen("stoch-erwartung", {
    title: "Erwartungswert",
    make(level, G) {
      const d = distribution(G);
      const E = d.xs.reduce((s, x, i) => s + (x * d.ws[i]) / d.den, 0);
      const V = d.xs.reduce((s, x, i) => s + (x - E) * (x - E) * (d.ws[i] / d.den), 0);
      if (level === 1) return numeric("Berechne $E(X)$ für diese Verteilung.\n\n" + distTable(d, G), E, {
        tolerance: 0.005, answerText: G.fmt(E, 3),
        explain: "$E(X) = " + d.xs.map((x, i) => "(" + x + ") \\cdot " + G.frac(d.ws[i], d.den)).join(" + ") + " \\approx " + G.tex(E, 3) + "$.",
      });
      if (level === 2) {
        const pay = d.xs.map((x) => Math.abs(x) + G.int(0, 3)).sort((u, v) => u - v);
        const Ep = pay.reduce((s, x, i) => s + (x * d.ws[i]) / d.den, 0);
        return numeric("Ein Glücksrad zahlt " + pay.map((x, i) => "$" + x + "$ € mit Wahrscheinlichkeit $" + G.frac(d.ws[i], d.den) + "$").join(", ") + " aus. Welcher **Einsatz** macht das Spiel fair? (in Euro, zwei Nachkommastellen)", Ep, {
          tolerance: 0.006, placeholder: "Euro", answerText: G.fmt(Ep, 2) + " €",
          hint: "Fair heißt: Erwartete Auszahlung minus Einsatz ist $0$.",
          explain: "Erwartete Auszahlung $" + pay.map((x, i) => x + " \\cdot " + G.frac(d.ws[i], d.den)).join(" + ") + " \\approx " + G.tex(Ep, 2) + "$ €. Genau so hoch muss der Einsatz sein.",
        });
      }
      if (level === 3) return numeric("Berechne die **Standardabweichung** $\\sigma(X)$ (zwei Nachkommastellen).\n\n" + distTable(d, G), Math.sqrt(V), {
        tolerance: 0.011, answerText: G.fmt(Math.sqrt(V), 2),
        hint: "Erst $E(X) \\approx " + G.tex(E, 3) + "$, dann $\\operatorname{Var}(X) = \\sum (x_i - E)^2 \\, P(X = x_i)$, dann die Wurzel.",
        explain: "$E(X) \\approx " + G.tex(E, 3) + "$, $\\operatorname{Var}(X) \\approx " + G.tex(V, 3) + "$, also $\\sigma \\approx " + G.tex(Math.sqrt(V), 2) + "$.",
      });
      // Experte: unknown probability for a target expectation
      const x1 = -G.int(1, 3), x2 = G.int(1, 3), x3 = G.int(4, 9);
      const q = G.pick([0.1, 0.2, 0.25, 0.3]);
      // P(x3) = q, P(x2) = t, P(x1) = 1 - q - t, E = target
      const t = G.pick([0.2, 0.3, 0.4]);
      const target = x1 * (1 - q - t) + x2 * t + x3 * q;
      return numeric("$X$ nimmt die Werte $" + x1 + "$, $" + x2 + "$ und $" + x3 + "$ an, mit $P(X = " + x3 + ") = " + G.tex(q, 2) + "$. Außerdem ist $E(X) = " + G.tex(target, 3) + "$. Wie groß ist $P(X = " + x2 + ")$?", t, {
        tolerance: 0.003,
        hint: "Setze $P(X = " + x2 + ") = t$. Dann ist $P(X = " + x1 + ") = " + G.tex(1 - q, 2) + " - t$. Stelle $E(X)$ auf und löse nach $t$.",
        explain: "$" + x1 + "\\,(" + G.tex(1 - q, 2) + " - t) + " + x2 + "\\,t + " + x3 + " \\cdot " + G.tex(q, 2) + " = " + G.tex(target, 3) + "$ ergibt $t = " + G.tex(t, 2) + "$.",
      });
    },
  });

  // ---------------------------------------------------------------- binomial distribution

  gen("stoch-binom", {
    title: "Binomialverteilung",
    make(level, G) {
      if (level === 1) {
        const n = G.int(3, 6), k = G.int(0, n);
        const v = G.binom(n, k) / Math.pow(2, n);
        return numeric("Eine faire Münze wird " + n + "-mal geworfen. Wie groß ist die Wahrscheinlichkeit für **genau " + k + "-mal Kopf**?", v, {
          answerText: G.binom(n, k) + "/" + Math.pow(2, n),
          hint: "Alle $2^{" + n + "}$ Folgen sind gleich wahrscheinlich. Wie viele haben genau " + k + " Köpfe?",
          explain: "$\\binom{" + n + "}{" + k + "} = " + G.binom(n, k) + "$ von $2^{" + n + "} = " + Math.pow(2, n) + "$ Folgen: $P = " + G.frac(G.binom(n, k), Math.pow(2, n)) + "$.",
        });
      }
      const ctx = G.pick([
        { what: "Ein Basketballer trifft Freiwürfe", item: "Würfen", items: "Würfe", hit: "Treffer" },
        { what: "Ein Saatkorn keimt", item: "Körnern", items: "Körner", hit: "keimende Körner" },
        { what: "Ein Bauteil ist defekt", item: "Bauteilen", items: "Bauteile", hit: "defekte Teile" },
        { what: "Eine Person trägt Blutgruppe B", item: "Personen", items: "Personen", hit: "Personen mit B" },
      ]);
      if (level === 2) {
        const n = G.int(6, 15), p = G.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7]), k = G.int(1, Math.min(n - 1, Math.round(n * p) + 2));
        const v = pmf(n, p, k, G);
        return numeric(ctx.what + " mit Wahrscheinlichkeit $p = " + G.tex(p, 2) + "$. Bei " + n + " " + ctx.item + ": Wie groß ist $P(X = " + k + ")$? (vier Nachkommastellen)", v, {
          placeholder: num4, answerText: G.fmt(v, 4),
          hint: "$P(X = k) = \\binom nk p^k (1-p)^{n-k}$ mit $\\binom{" + n + "}{" + k + "} = " + G.binom(n, k) + "$.",
          explain: "$\\binom{" + n + "}{" + k + "} \\cdot " + G.tex(p, 2) + "^{" + k + "} \\cdot " + G.tex(1 - p, 2) + "^{" + (n - k) + "} \\approx " + G.tex(v, 4) + "$.",
        });
      }
      if (level === 3) {
        const n = G.int(8, 20), p = G.pick([0.05, 0.1, 0.15, 0.2, 0.3]), k = G.int(1, 2);
        const v = 1 - cdf(n, p, k - 1, G);
        return numeric(ctx.what + " mit $p = " + G.tex(p, 2) + "$. Bei " + n + " " + ctx.item + ": Wie groß ist die Wahrscheinlichkeit für **mindestens " + k + "** " + ctx.hit + "? (vier Nachkommastellen)", v, {
          placeholder: num4, answerText: G.fmt(v, 4),
          hint: "»Mindestens " + k + "« ist das Gegenteil von »höchstens " + (k - 1) + "«.",
          explain: "$P(X \\ge " + k + ") = 1 - P(X \\le " + (k - 1) + ") = 1 - " + G.tex(cdf(n, p, k - 1, G), 4) + " \\approx " + G.tex(v, 4) + "$.",
        });
      }
      const p = G.pick([0.02, 0.05, 0.1, 0.15, 0.2]), q = G.pick([0.9, 0.95, 0.99]);
      const n = Math.ceil(Math.log(1 - q) / Math.log(1 - p));
      return numeric(ctx.what + " mit $p = " + G.tex(p, 2) + "$. Wie viele " + ctx.items + " braucht man mindestens, damit mit mindestens $" + G.tex(q * 100, 0) + "\\,\\%$ Wahrscheinlichkeit **wenigstens ein** Treffer dabei ist?", n, {
        tolerance: 0, placeholder: "Anzahl",
        hint: "$P(X \\ge 1) = 1 - (1 - p)^n \\ge " + G.tex(q, 2) + "$. Löse mit dem Logarithmus nach $n$ und beachte die Richtung des Ungleichheitszeichens.",
        explain: "$(1 - p)^n \\le " + G.tex(1 - q, 2) + "$ ergibt $n \\ge \\dfrac{\\ln " + G.tex(1 - q, 2) + "}{\\ln " + G.tex(1 - p, 2) + "} \\approx " + G.tex(Math.log(1 - q) / Math.log(1 - p), 2) + "$, also $n = " + n + "$. Beim Teilen durch den negativen Logarithmus dreht sich das Zeichen.",
      });
    },
  });

  gen("stoch-binom-kenn", {
    title: "Kenngrößen der Binomialverteilung",
    make(level, G) {
      const n = G.pick([20, 40, 50, 80, 100, 120, 200]), p = G.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const mu = n * p, sd = Math.sqrt(n * p * (1 - p));
      if (level === 1) return numeric("$X \\sim B(" + n + "; " + G.tex(p, 2) + ")$. Berechne $E(X)$.", mu, { tolerance: 0.001, explain: "$E(X) = n \\cdot p = " + n + " \\cdot " + G.tex(p, 2) + " = " + G.tex(mu, 2) + "$." });
      if (level === 2) return numeric("$X \\sim B(" + n + "; " + G.tex(p, 2) + ")$. Berechne $\\sigma(X)$ (zwei Nachkommastellen).", sd, {
        tolerance: 0.011, answerText: G.fmt(sd, 2),
        explain: "$\\sigma = \\sqrt{n p (1-p)} = \\sqrt{" + G.tex(n * p * (1 - p), 2) + "} \\approx " + G.tex(sd, 2) + "$.",
      });
      if (level === 3) {
        const lo = mu - 2 * sd, hi = mu + 2 * sd;
        return {
          type: "cloze",
          md: "$X \\sim B(" + n + "; " + G.tex(p, 2) + ")$. In welchem Bereich liegen ungefähr $95\\,\\%$ der Werte? Gib $\\mu - 2\\sigma$ und $\\mu + 2\\sigma$ an (eine Nachkommastelle).\n\nvon {{0}} bis {{1}}",
          blanks: [{ accept: [lo], numeric: true, tolerance: 0.051, placeholder: "Zahl" }, { accept: [hi], numeric: true, tolerance: 0.051, placeholder: "Zahl" }],
          explain: "$\\mu = " + G.tex(mu, 1) + "$, $\\sigma \\approx " + G.tex(sd, 2) + "$, also $[" + G.tex(lo, 1) + "; " + G.tex(hi, 1) + "]$. Wegen $\\sigma " + (sd > 3 ? "> 3" : "\\le 3") + "$ ist die Sigma-Regel hier " + (sd > 3 ? "gut brauchbar" : "nur grob") + ".",
        };
      }
      const p2 = G.pick([0.1, 0.2, 0.25, 0.4, 0.5]), n2 = G.pick([20, 40, 60, 80, 100, 120]);
      const mu2 = n2 * p2, var2 = mu2 * (1 - p2);
      return {
        type: "cloze",
        md: "Eine binomialverteilte Größe hat $\\mu = " + G.tex(mu2, 2) + "$ und $\\sigma^2 = " + G.tex(var2, 2) + "$. Bestimme $n$ und $p$.\n\n$n =$ {{0}} $\\qquad p =$ {{1}}",
        blanks: [{ accept: [n2], numeric: true, placeholder: "Zahl" }, { accept: [p2], numeric: true, tolerance: 0.001, placeholder: "Zahl" }],
        hint: "$\\sigma^2 = n p (1 - p) = \\mu \\cdot (1 - p)$.",
        explain: "$1 - p = \\tfrac{\\sigma^2}{\\mu} = " + G.tex(1 - p2, 2) + "$, also $p = " + G.tex(p2, 2) + "$ und $n = \\tfrac{\\mu}{p} = " + n2 + "$.",
      };
    },
  });

  // ---------------------------------------------------------------- hypothesis tests

  gen("stoch-test", {
    title: "Hypothesentest",
    make(level, G) {
      if (level === 1) {
        const n = G.pick([50, 100, 200]), k = Math.round(n * 0.5 + G.int(4, 9) * Math.sqrt(n) / 5);
        const x = G.int(Math.round(n * 0.5), k + 6);
        const reject = x >= k;
        return {
          type: "choice",
          md: "Test von $H_0: p = 0{,}5$ gegen $H_1: p > 0{,}5$ mit $n = " + n + "$ und Ablehnungsbereich $\\{" + k + ", \\dots, " + n + "\\}$. Beobachtet: $" + x + "$ Treffer. Was folgt?",
          options: G.options(
            { md: reject ? "$H_0$ wird abgelehnt." : "$H_0$ wird nicht abgelehnt." },
            [
              { md: reject ? "$H_0$ wird nicht abgelehnt." : "$H_0$ wird abgelehnt.", why: "Entscheidend ist nur, ob $" + x + "$ im Ablehnungsbereich liegt." },
              { md: "$H_0$ ist damit bewiesen.", why: "Ein Test beweist nie $H_0$, er behält sie höchstens bei." },
              { md: "$H_1$ ist damit sicher wahr.", why: "Auch bei Ablehnung bleibt ein Restrisiko, der Fehler 1. Art." },
            ]
          ),
          explain: "$" + x + (reject ? " \\ge " : " < ") + k + "$: " + (reject ? "Das Ergebnis liegt im Ablehnungsbereich. Man spricht von einem signifikanten Ergebnis." : "Das Ergebnis liegt im Annahmebereich. Die Daten reichen nicht, um $H_0$ zu verwerfen."),
        };
      }
      const n = G.int(10, 25), p0 = G.pick([0.5, 0.3, 0.2, 0.25]);
      const tail = (k) => 1 - cdf(n, p0, k - 1, G);
      if (level === 2) {
        const k = Math.min(n, Math.round(n * p0 + G.int(2, 4)));
        return numeric("$H_0: p = " + G.tex(p0, 2) + "$, $n = " + n + "$, Ablehnungsbereich $\\{" + k + ", \\dots, " + n + "\\}$. Berechne die Wahrscheinlichkeit für einen **Fehler 1. Art** (vier Nachkommastellen).", tail(k), {
          placeholder: num4, answerText: G.fmt(tail(k), 4),
          hint: "Fehler 1. Art: $H_0$ stimmt, aber das Ergebnis landet im Ablehnungsbereich. Rechne mit $B(" + n + "; " + G.tex(p0, 2) + ")$.",
          explain: "$\\alpha = P(X \\ge " + k + ") = 1 - P(X \\le " + (k - 1) + ") \\approx " + G.tex(tail(k), 4) + "$.",
        });
      }
      if (level === 3) {
        let k = n;
        while (k > 0 && tail(k) <= 0.05) k--;
        k++;
        return numeric("Rechtsseitiger Test: $H_0: p = " + G.tex(p0, 2) + "$, $n = " + n + "$, Signifikanzniveau $5\\,\\%$. Ab welcher Trefferzahl $k$ wird $H_0$ abgelehnt? (kleinstes $k$ mit $P(X \\ge k) \\le 0{,}05$)", k, {
          tolerance: 0, placeholder: "k",
          hint: "Suche in der kumulierten Verteilung von $B(" + n + "; " + G.tex(p0, 2) + ")$ das kleinste $k$ mit $1 - P(X \\le k - 1) \\le 0{,}05$.",
          explain: "$P(X \\ge " + k + ") \\approx " + G.tex(tail(k), 4) + " \\le 0{,}05$, aber $P(X \\ge " + (k - 1) + ") \\approx " + G.tex(tail(k - 1), 4) + " > 0{,}05$. Also $k = " + k + "$.",
        });
      }
      // Experte: type II error
      let k = n;
      while (k > 0 && tail(k) <= 0.05) k--;
      k++;
      const p1 = Math.min(0.9, p0 + G.pick([0.2, 0.25, 0.3]));
      const beta = cdf(n, p1, k - 1, G);
      return numeric("Rechtsseitiger Test von $H_0: p = " + G.tex(p0, 2) + "$ mit $n = " + n + "$ und Ablehnungsbereich $\\{" + k + ", \\dots, " + n + "\\}$. In Wahrheit ist $p = " + G.tex(p1, 2) + "$. Wie groß ist die Wahrscheinlichkeit für einen **Fehler 2. Art**? (vier Nachkommastellen)", beta, {
        placeholder: num4, answerText: G.fmt(beta, 4),
        hint: "Fehler 2. Art: $H_0$ ist falsch, wird aber beibehalten. Rechne mit dem wahren $p$.",
        explain: "$\\beta = P_{p = " + G.tex(p1, 2) + "}(X \\le " + (k - 1) + ") \\approx " + G.tex(beta, 4) + "$. Bei so kleinem $n$ bleibt eine echte Abweichung oft unentdeckt.",
      });
    },
  });

  // ---------------------------------------------------------------- prognosis and confidence intervals

  gen("stoch-prognose", {
    title: "Prognoseintervall",
    make(level, G) {
      const n = G.pick([100, 200, 400, 500, 800, 1000]), p = G.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
      const sd = Math.sqrt(p * (1 - p) / n);
      if (level === 1) {
        const mu = n * p, s = Math.sqrt(n * p * (1 - p));
        return {
          type: "cloze",
          md: "Ein Zufallsversuch mit Trefferwahrscheinlichkeit $p = " + G.tex(p, 1) + "$ wird $n = " + n + "$-mal wiederholt. Gib das Intervall $[\\mu - 2\\sigma; \\mu + 2\\sigma]$ für die Trefferzahl an (eine Nachkommastelle).\n\n{{0}} bis {{1}}",
          blanks: [{ accept: [mu - 2 * s], numeric: true, tolerance: 0.051 }, { accept: [mu + 2 * s], numeric: true, tolerance: 0.051 }],
          explain: "$\\mu = " + G.tex(mu, 1) + "$, $\\sigma = \\sqrt{" + n + " \\cdot " + G.tex(p, 1) + " \\cdot " + G.tex(1 - p, 1) + "} \\approx " + G.tex(s, 2) + "$. In diesem Intervall liegt die Trefferzahl mit etwa $95\\,\\%$ Wahrscheinlichkeit.",
        };
      }
      if (level === 2) return {
        type: "cloze",
        md: "Bei $n = " + n + "$ Versuchen mit $p = " + G.tex(p, 1) + "$: Gib das $95\\,\\%$-Prognoseintervall für die **relative Häufigkeit** an, $p \\pm 1{,}96\\sqrt{\\tfrac{p(1-p)}{n}}$ (drei Nachkommastellen).\n\n{{0}} bis {{1}}",
        blanks: [{ accept: [p - 1.96 * sd], numeric: true, tolerance: 0.0011 }, { accept: [p + 1.96 * sd], numeric: true, tolerance: 0.0011 }],
        explain: "$1{,}96 \\cdot \\sqrt{\\tfrac{" + G.tex(p * (1 - p), 2) + "}{" + n + "}} \\approx " + G.tex(1.96 * sd, 4) + "$, also $[" + G.tex(p - 1.96 * sd, 3) + "; " + G.tex(p + 1.96 * sd, 3) + "]$.",
      };
      if (level === 3) {
        const d = G.pick([0.01, 0.02, 0.03, 0.05]);
        const need = Math.ceil((1.96 * 1.96 * p * (1 - p)) / (d * d));
        return numeric("Bei $p = " + G.tex(p, 1) + "$ soll das $95\\,\\%$-Prognoseintervall der relativen Häufigkeit höchstens $\\pm " + G.tex(d, 2) + "$ breit sein. Wie groß muss $n$ mindestens sein?", need, {
          tolerance: 1, placeholder: "n",
          hint: "$1{,}96\\sqrt{\\tfrac{p(1-p)}{n}} \\le " + G.tex(d, 2) + "$ nach $n$ auflösen.",
          explain: "$n \\ge \\dfrac{1{,}96^2 \\cdot " + G.tex(p * (1 - p), 2) + "}{" + G.tex(d, 2) + "^2} \\approx " + G.tex((1.96 * 1.96 * p * (1 - p)) / (d * d), 1) + "$, also $n = " + need + "$. Halbe Breite braucht vierfaches $n$.",
        });
      }
      const h = p + G.pick([-1, 1]) * G.pick([0.5, 1.2, 2.5]) * 1.96 * sd;
      const inside = Math.abs(h - p) <= 1.96 * sd;
      return {
        type: "choice",
        md: "Ein Hersteller gibt $p = " + G.tex(p, 1) + "$ an. In einer Stichprobe mit $n = " + n + "$ ergibt sich $h = " + G.tex(h, 3) + "$. Was ist die beste Einschätzung?",
        options: G.options(
          { md: inside ? "Das Ergebnis liegt im 95-%-Prognoseintervall, es spricht nicht gegen die Angabe." : "Das Ergebnis liegt außerhalb des 95-%-Prognoseintervalls, die Angabe ist zweifelhaft." },
          [
            { md: inside ? "Das Ergebnis widerlegt die Angabe, weil $h \\ne p$." : "Das Ergebnis passt zur Angabe, kleine Abweichungen sind normal.", why: "Maßstab ist die Breite des Prognoseintervalls, $\\pm" + G.tex(1.96 * sd, 3) + "$." },
            { md: "Die Angabe ist damit sicher bewiesen.", why: "Aus einer Stichprobe folgt nie Sicherheit." },
          ]
        ),
        explain: "Das Intervall ist $[" + G.tex(p - 1.96 * sd, 3) + "; " + G.tex(p + 1.96 * sd, 3) + "]$, $h = " + G.tex(h, 3) + "$ liegt " + (inside ? "darin" : "außerhalb") + ".",
      };
    },
  });

  gen("stoch-konfidenz", {
    title: "Konfidenzintervall",
    make(level, G) {
      const n = G.pick([100, 200, 400, 500, 1000]), k = Math.round(n * G.pick([0.12, 0.2, 0.35, 0.42, 0.55, 0.64]));
      const h = k / n, half = 1.96 * Math.sqrt((h * (1 - h)) / n);
      if (level === 1 || level === 2) return {
        type: "cloze",
        md: "In einer Umfrage sagen $" + k + "$ von $" + n + "$ Befragten ja. Gib das $95\\,\\%$-Konfidenzintervall für den Anteil $p$ an, $h \\pm 1{,}96\\sqrt{\\tfrac{h(1-h)}{n}}$ (drei Nachkommastellen).\n\n{{0}} bis {{1}}",
        blanks: [{ accept: [h - half], numeric: true, tolerance: 0.0011 }, { accept: [h + half], numeric: true, tolerance: 0.0011 }],
        hint: level === 1 ? "$h = \\tfrac{" + k + "}{" + n + "} = " + G.tex(h, 3) + "$." : null,
        explain: "$h = " + G.tex(h, 3) + "$, halbe Breite $\\approx " + G.tex(half, 4) + "$, also $[" + G.tex(h - half, 3) + "; " + G.tex(h + half, 3) + "]$.",
      };
      if (level === 3) {
        const d = G.pick([0.02, 0.03, 0.04, 0.05]);
        const need = Math.ceil((1.96 * 1.96 * 0.25) / (d * d));
        return numeric("Wie viele Personen muss man mindestens befragen, damit das $95\\,\\%$-Konfidenzintervall **in jedem Fall** höchstens $\\pm " + G.tex(d * 100, 0) + "$ Prozentpunkte breit ist?", need, {
          tolerance: 1, placeholder: "n",
          hint: "Am breitesten wird das Intervall bei $h = 0{,}5$, denn dort ist $h(1-h)$ am größten.",
          explain: "$n \\ge \\dfrac{1{,}96^2 \\cdot 0{,}25}{" + G.tex(d, 2) + "^2} \\approx " + G.tex((1.96 * 1.96 * 0.25) / (d * d), 1) + "$, also $n = " + need + "$.",
        });
      }
      const pool = [
        ["Mit $95\\,\\%$ Sicherheit liegt der wahre Anteil in genau diesem einen berechneten Intervall.", false, "Der wahre Anteil ist fest. Die $95\\,\\%$ beschreiben das Verfahren: Bei vielen Stichproben fangen etwa $95\\,\\%$ der Intervalle ihn ein."],
        ["Bei vierfacher Stichprobengröße halbiert sich die Breite ungefähr.", true, "Die Breite schrumpft wie $\\tfrac{1}{\\sqrt n}$."],
        ["Ein 99-%-Konfidenzintervall ist schmaler als ein 95-%-Intervall aus denselben Daten.", false, "Mehr Sicherheit kostet Breite: $2{,}58$ statt $1{,}96$."],
        ["Ein Konfidenzintervall sagt etwas über einen unbekannten Anteil, ein Prognoseintervall über künftige Stichproben bei bekanntem Anteil.", true, "Die Richtung des Schließens ist umgekehrt."],
      ];
      const [md, ans, why] = G.pick(pool);
      return { type: "truefalse", md, answer: ans, whyNot: ans ? null : why, explain: why };
    },
  });

  // ---------------------------------------------------------------- descriptive statistics

  gen("stoch-kenn", {
    title: "Kenngrößen",
    make(level, G) {
      const n = level === 1 ? G.int(5, 7) : level === 2 ? G.pick([6, 8, 10]) : G.pick([7, 8, 9, 10, 11]);
      const data = Array.from({ length: n }, () => G.int(1, 20));
      const s = data.slice().sort((a, b) => a - b);
      const med = (arr) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2);
      const list = data.join(", ");
      if (level === 1) {
        const mean = data.reduce((a, b) => a + b, 0) / n;
        return numeric("Berechne das arithmetische Mittel von $" + list + "$ (zwei Nachkommastellen).", mean, {
          tolerance: 0.006, answerText: G.fmt(mean, 2),
          explain: "Summe $" + data.reduce((a, b) => a + b, 0) + "$, geteilt durch $" + n + "$: $\\bar x \\approx " + G.tex(mean, 2) + "$.",
        });
      }
      if (level === 2) return numeric("Bestimme den Median von $" + list + "$.", med(s), {
        tolerance: 0.001, hint: "Erst sortieren.",
        explain: "Sortiert: $" + s.join(", ") + "$. " + (n % 2 ? "Der mittlere Wert ist $" + med(s) + "$." : "Mittel der beiden mittleren Werte: $\\tfrac{" + s[n / 2 - 1] + " + " + s[n / 2] + "}{2} = " + G.tex(med(s), 1) + "$."),
      });
      if (level === 3) {
        const lower = s.slice(0, Math.floor(n / 2)), upper = s.slice(Math.ceil(n / 2));
        const q1 = med(lower), q3 = med(upper);
        return {
          type: "cloze",
          md: "Daten: $" + list + "$. Bestimme die Quartile (Median der unteren und der oberen Hälfte" + (n % 2 ? ", der Median selbst gehört zu keiner Hälfte" : "") + ").\n\n$Q_1 =$ {{0}} $\\qquad Q_3 =$ {{1}} $\\qquad Q_3 - Q_1 =$ {{2}}",
          blanks: [{ accept: [q1], numeric: true }, { accept: [q3], numeric: true }, { accept: [q3 - q1], numeric: true }],
          hint: "Sortiert: $" + s.join(", ") + "$.",
          explain: "Untere Hälfte $" + lower.join(", ") + "$, obere Hälfte $" + upper.join(", ") + "$: $Q_1 = " + G.tex(q1, 1) + "$, $Q_3 = " + G.tex(q3, 1) + "$, Quartilsabstand $" + G.tex(q3 - q1, 1) + "$.",
        };
      }
      const a = G.int(2, 9), b = G.pick([2, 3, 0.5]);
      const kind = G.pick(["add", "mul"]);
      const mean = data.reduce((x, y) => x + y, 0) / n;
      const sd = Math.sqrt(data.reduce((x, v) => x + (v - mean) * (v - mean), 0) / n);
      if (kind === "add") return {
        type: "cloze",
        md: "Daten mit $\\bar x = " + G.tex(mean, 2) + "$ und Standardabweichung $s = " + G.tex(sd, 2) + "$. Zu **jedem** Wert wird $" + a + "$ addiert. Wie lauten die neuen Kenngrößen? (zwei Nachkommastellen)\n\n$\\bar x' =$ {{0}} $\\qquad s' =$ {{1}}",
        blanks: [{ accept: [mean + a], numeric: true, tolerance: 0.006 }, { accept: [sd], numeric: true, tolerance: 0.006 }],
        explain: "Verschieben verschiebt das Mittel um $" + a + "$, die Abstände untereinander bleiben, also auch $s$.",
      };
      return {
        type: "cloze",
        md: "Daten mit $\\bar x = " + G.tex(mean, 2) + "$ und Standardabweichung $s = " + G.tex(sd, 2) + "$. **Jeder** Wert wird mit $" + G.tex(b, 1) + "$ multipliziert. Wie lauten die neuen Kenngrößen? (zwei Nachkommastellen)\n\n$\\bar x' =$ {{0}} $\\qquad s' =$ {{1}}",
        blanks: [{ accept: [mean * b], numeric: true, tolerance: 0.006 }, { accept: [sd * b], numeric: true, tolerance: 0.006 }],
        explain: "Strecken streckt das Mittel und alle Abstände um den Faktor $" + G.tex(b, 1) + "$, also auch $s$.",
      };
    },
  });

  gen("stoch-regr", {
    title: "Regression",
    make(level, G) {
      if (level === 1) {
        const a = G.int(-3, 5), b = G.pick([0.5, 0.8, 1.2, 1.5, 2, -0.5, -1.2]), x = G.int(2, 12);
        return numeric("Die Regressionsgerade lautet $\\hat y = " + G.tex(a, 1) + G.term(b, 1).replace("+ ", "+ ") + "\\,x$. Welchen Wert sagt sie für $x = " + x + "$ voraus?", a + b * x, {
          tolerance: 0.011, explain: "$" + G.tex(a, 1) + " " + G.term(b, 1) + " \\cdot " + x + " = " + G.tex(a + b * x, 2) + "$.",
        });
      }
      // nice data: x = 1..4 or 2,4,6,8; y = a + b x + small noise with integer sums
      const xs = G.pick([[1, 2, 3, 4], [2, 4, 6, 8], [1, 3, 5, 7]]);
      const b0 = G.pick([1, 2, -1, 3]), a0 = G.int(0, 5);
      const noise = G.pick([[0, 1, -1, 0], [1, -1, 0, 0], [0, 0, 1, -1], [-1, 1, 1, -1]]);
      const ys = xs.map((x, i) => a0 + b0 * x + noise[i]);
      const mx = xs.reduce((s, v) => s + v, 0) / 4, my = ys.reduce((s, v) => s + v, 0) / 4;
      const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0), sxx = xs.reduce((s, v) => s + (v - mx) * (v - mx), 0);
      const syy = ys.reduce((s, v) => s + (v - my) * (v - my), 0);
      const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy);
      const pts = xs.map((x, i) => "(" + x + "|" + ys[i] + ")").join(", ");
      if (level === 2) return numeric("Punkte $" + pts + "$. Berechne die Steigung der Regressionsgeraden, $b = \\dfrac{\\sum (x_i - \\bar x)(y_i - \\bar y)}{\\sum (x_i - \\bar x)^2}$ (zwei Nachkommastellen).", b, {
        tolerance: 0.006, answerText: G.fmt(b, 2),
        hint: "$\\bar x = " + G.tex(mx, 2) + "$, $\\bar y = " + G.tex(my, 2) + "$.",
        explain: "$\\sum (x_i - \\bar x)(y_i - \\bar y) = " + G.tex(sxy, 2) + "$, $\\sum (x_i - \\bar x)^2 = " + G.tex(sxx, 2) + "$, also $b \\approx " + G.tex(b, 2) + "$.",
      });
      if (level === 3) return {
        type: "cloze",
        md: "Punkte $" + pts + "$. Bestimme die Regressionsgerade $\\hat y = a + b\\,x$ (zwei Nachkommastellen).\n\n$a =$ {{0}} $\\qquad b =$ {{1}}",
        blanks: [{ accept: [a], numeric: true, tolerance: 0.011 }, { accept: [b], numeric: true, tolerance: 0.006 }],
        hint: "Erst $b$, dann $a = \\bar y - b\\,\\bar x$, denn die Gerade geht durch den Schwerpunkt.",
        explain: "$b \\approx " + G.tex(b, 2) + "$, $a = " + G.tex(my, 2) + " - " + G.tex(b, 2) + " \\cdot " + G.tex(mx, 2) + " \\approx " + G.tex(a, 2) + "$.",
      };
      return numeric("Punkte $" + pts + "$. Berechne den Korrelationskoeffizienten $r$ (drei Nachkommastellen).", r, {
        tolerance: 0.0011, answerText: G.fmt(r, 3),
        hint: "$r = \\dfrac{\\sum (x_i - \\bar x)(y_i - \\bar y)}{\\sqrt{\\sum (x_i - \\bar x)^2 \\cdot \\sum (y_i - \\bar y)^2}}$.",
        explain: "$r = \\dfrac{" + G.tex(sxy, 2) + "}{\\sqrt{" + G.tex(sxx, 2) + " \\cdot " + G.tex(syy, 2) + "}} \\approx " + G.tex(r, 3) + "$. " + (Math.abs(r) > 0.9 ? "Ein sehr starker linearer Zusammenhang." : "Ein deutlicher, aber nicht perfekter linearer Zusammenhang."),
      });
    },
  });

  // ---------------------------------------------------------------- normal distribution

  const CTX_NORMAL = [
    { what: "Körpergröße erwachsener Frauen", unit: "cm", mu: [166, 168], sd: [6, 7] },
    { what: "Füllmenge einer Saftflasche", unit: "ml", mu: [1000, 1002], sd: [4, 5] },
    { what: "Punkte in einem Test", unit: "Punkte", mu: [60, 70], sd: [8, 10, 12] },
    { what: "Lebensdauer einer Lampe", unit: "h", mu: [1200, 1500], sd: [100, 150] },
  ];
  const Z = { 0.05: 1.6449, 0.1: 1.2816, 0.2: 0.8416, 0.25: 0.6745 };

  gen("stoch-normal", {
    title: "Normalverteilung",
    make(level, G) {
      const c = G.pick(CTX_NORMAL), mu = G.pick(c.mu), sd = G.pick(c.sd);
      const intro = "Die " + c.what + " ist normalverteilt mit $\\mu = " + mu + "$ " + c.unit + " und $\\sigma = " + sd + "$ " + c.unit + ". ";
      if (level === 1) {
        const k = G.pick([1, 2, 3]);
        const v = [0, 0.6827, 0.9545, 0.9973][k];
        return numeric(intro + "Welcher Anteil liegt zwischen $" + (mu - k * sd) + "$ und $" + (mu + k * sd) + "$ " + c.unit + "? (in Prozent, eine Nachkommastelle)", v * 100, {
          tolerance: 0.25, placeholder: "Prozent", answerText: G.fmt(v * 100, 1) + " %",
          hint: "Wie viele Standardabweichungen sind die Grenzen vom Mittelwert entfernt?",
          explain: "Das ist $\\mu \\pm " + k + "\\sigma$, nach der Sigma-Regel rund $" + G.tex(v * 100, 1) + "\\,\\%$.",
        });
      }
      if (level === 2) {
        const z = G.pick([-1.5, -1, -0.5, 0.5, 1, 1.5, 2]);
        const x = mu + z * sd, v = Phi(z);
        const above = G.chance(0.5);
        return numeric(intro + "Welcher Anteil liegt **" + (above ? "über" : "unter") + " " + G.fmt(x, 1) + "** " + c.unit + "? (vier Nachkommastellen)", above ? 1 - v : v, {
          placeholder: num4, answerText: G.fmt(above ? 1 - v : v, 4),
          hint: "Standardisiere: $z = \\tfrac{x - \\mu}{\\sigma}$.",
          explain: "$z = \\tfrac{" + G.tex(x, 1) + " - " + mu + "}{" + sd + "} = " + G.tex(z, 1) + "$, $\\Phi(" + G.tex(z, 1) + ") \\approx " + G.tex(v, 4) + "$" + (above ? ", also $1 - " + G.tex(v, 4) + " = " + G.tex(1 - v, 4) + "$." : "."),
        });
      }
      const q = G.pick([0.05, 0.1, 0.2, 0.25]), z = Z[q];
      if (level === 3) {
        const x = mu + z * sd;
        return numeric(intro + "Ab welchem Wert gehört man zu den oberen $" + G.tex(q * 100, 0) + "\\,\\%$? (eine Nachkommastelle)", x, {
          tolerance: 0.15, placeholder: c.unit, answerText: G.fmt(x, 1) + " " + c.unit,
          hint: "Gesucht ist $x$ mit $\\Phi\\left(\\tfrac{x - \\mu}{\\sigma}\\right) = " + G.tex(1 - q, 2) + "$. Dazu gehört $z \\approx " + G.tex(z, 4) + "$.",
          explain: "$x = \\mu + z\\sigma = " + mu + " + " + G.tex(z, 4) + " \\cdot " + sd + " \\approx " + G.tex(x, 1) + "$ " + c.unit + ".",
        });
      }
      const x = mu + G.pick([1, 2]) * sd;
      const s2 = (x - mu) / z;
      return numeric("Eine normalverteilte Größe hat $\\mu = " + mu + "$. Genau $" + G.tex(q * 100, 0) + "\\,\\%$ der Werte liegen über $" + G.fmt(x, 1) + "$. Wie groß ist $\\sigma$? (zwei Nachkommastellen)", s2, {
        tolerance: 0.02, answerText: G.fmt(s2, 2),
        hint: "Aus $P(X > x) = " + G.tex(q, 2) + "$ folgt $\\tfrac{x - \\mu}{\\sigma} = z$ mit $\\Phi(z) = " + G.tex(1 - q, 2) + "$, also $z \\approx " + G.tex(z, 4) + "$.",
        explain: "$\\sigma = \\tfrac{x - \\mu}{z} = \\tfrac{" + G.tex(x - mu, 1) + "}{" + G.tex(z, 4) + "} \\approx " + G.tex(s2, 2) + "$.",
      });
    },
  });
  // ---------------------------------------------------------------- estimate a probability first, compute later

  gen("stoch-schaetzen", {
    title: "Wahrscheinlichkeiten schätzen",
    make(level, G) {
      const pct = (p) => G.round(100 * p, 1);
      const tol = [10, 8, 6, 5][level - 1];
      if (level === 1) {
        const n = G.int(2, 8);
        const p = 1 - Math.pow(5 / 6, n);
        return {
          type: "estimate", md: "Du würfelst " + n + "-mal. **Wie wahrscheinlich ist mindestens eine Sechs?** Erst schätzen, nicht rechnen.",
          min: 0, max: 100, answer: pct(p), tolerance: tol, unit: "%", start: 50,
          explain: "Über das Gegenereignis: keine Sechs hat die Wahrscheinlichkeit $\\left(\\tfrac56\\right)^{" + n + "} \\approx " + G.tex(Math.pow(5 / 6, n), 3) + "$, also $1 - " + G.tex(Math.pow(5 / 6, n), 3) + " \\approx " + G.tex(p, 3) + "$.",
        };
      }
      if (level === 2) {
        const n = G.pick([10, 15, 20, 23, 25, 30, 35, 40, 50]);
        let q = 1;
        for (let i = 0; i < n; i++) q *= (365 - i) / 365;
        return {
          type: "estimate", md: "In einem Raum sind " + n + " Personen. **Wie wahrscheinlich haben mindestens zwei am selben Tag Geburtstag?** Schätze.",
          min: 0, max: 100, answer: pct(1 - q), tolerance: tol, unit: "%", start: 15,
          explain: "Es gibt $\\binom{" + n + "}{2} = " + G.binom(n, 2) + "$ Paare, jedes trifft mit $\\tfrac{1}{365}$. Genau: $1 - \\tfrac{365 \\cdot 364 \\cdots " + (366 - n) + "}{365^{" + n + "}} \\approx " + G.tex(1 - q, 3) + "$. Die Intuition unterschätzt das fast immer, weil sie an die eigene Person denkt statt an alle Paare.",
        };
      }
      if (level === 3) {
        const n = G.pick([10, 12, 15, 20]);
        const k = Math.round(n * G.pick([0.6, 0.65, 0.7, 0.75]));
        let p = 0;
        for (let i = k; i <= n; i++) p += G.binom(n, i) / Math.pow(2, n);
        return {
          type: "estimate", md: "Eine faire Münze wird " + n + "-mal geworfen. **Wie wahrscheinlich ist mindestens " + k + "-mal Kopf?**",
          min: 0, max: 100, answer: pct(p), tolerance: tol, unit: "%", start: 30,
          explain: "$P(X \\ge " + k + ") = \\sum_{i=" + k + "}^{" + n + "} \\binom{" + n + "}{i} \\left(\\tfrac12\\right)^{" + n + "} \\approx " + G.tex(p, 3) + "$. Der Erwartungswert ist $" + G.tex(n / 2, 1) + "$; je weiter $" + k + "$ darüber liegt, desto schneller fällt die Wahrscheinlichkeit.",
        };
      }
      const prev = G.pick([0.005, 0.01, 0.02, 0.05]), sens = G.pick([0.9, 0.95, 0.99]), spec = G.pick([0.9, 0.95, 0.98, 0.99]);
      const post = (prev * sens) / (prev * sens + (1 - prev) * (1 - spec));
      return {
        type: "estimate",
        md: "Eine Krankheit betrifft " + G.fmt(prev * 100, 1) + " % der Bevölkerung. Ein Test erkennt " + G.fmt(sens * 100, 0) + " % der Kranken und schlägt bei " + G.fmt((1 - spec) * 100, 0) + " % der Gesunden fälschlich an. **Wie wahrscheinlich ist man bei positivem Test wirklich krank?**",
        min: 0, max: 100, answer: pct(post), tolerance: tol, unit: "%", start: 80,
        explain: "Mit 10 000 Personen: " + G.fmt(10000 * prev * sens, 0) + " richtig Positive, " + G.fmt(10000 * (1 - prev) * (1 - spec), 0) + " falsch Positive. Anteil der Kranken unter den Positiven: $\\approx " + G.tex(post, 3) + "$. Bei seltenen Krankheiten überwiegen die falsch Positiven.",
      };
    },
  });
})();
