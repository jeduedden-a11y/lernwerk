/* Task generators for Analysis I, one or more per chapter of the course; level 1 (Leicht) to 4 (Experte). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const nz = (G, a, b) => { let v = 0; while (v === 0) v = G.int(a, b); return v; };
  const num = (md, answer, o) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl" }, o || {});
  const blank = (v, tol) => ({ accept: [v], numeric: true, tolerance: tol == null ? 1e-6 : tol, placeholder: "Zahl" });
  const tf = (md, answer, explain, whyNot) => ({ type: "truefalse", md, answer, explain, whyNot: answer ? null : whyNot || null });
  const pm = (c) => (c < 0 ? "- " + -c : "+ " + c);
  const par = (c) => (c < 0 ? "(" + c + ")" : String(c));
  /** Polynomial in TeX from [coefficient, power] pairs, highest power first; zero terms vanish, 1 and -1 are not written. */
  function poly(terms, v) {
    let s = "";
    for (const [c, p] of terms) {
      if (!c) continue;
      const a = Math.abs(c);
      const body = p === 0 ? String(a) : (a === 1 ? "" : a) + v + (p === 1 ? "" : "^{" + p + "}");
      s += s ? (c < 0 ? " - " : " + ") + body : (c < 0 ? "-" : "") + body;
    }
    return s || "0";
  }
  /** Linear factor (x - r) in TeX; plain x for r = 0. */
  const fac = (r, v) => (r === 0 ? (v || "x") : "(" + (v || "x") + " " + pm(-r) + ")");
  /** Coefficient in front of a symbol: 1 and -1 are not written. */
  const coef = (c) => (c === 1 ? "" : c === -1 ? "-" : String(c));
  /** Decimal in TeX, in parentheses when negative. */
  const pd = (G, x, d) => (x < 0 ? "(" + G.tex(x, d) + ")" : G.tex(x, d));

  // ---------------------------------------------------------------- logic

  const F2 = [
    { tex: "A \\land \\lnot B", f: (a, b) => a && !b },
    { tex: "\\lnot A \\lor B", f: (a, b) => !a || b },
    { tex: "A \\Rightarrow B", f: (a, b) => !a || b },
    { tex: "\\lnot (A \\land B)", f: (a, b) => !(a && b) },
    { tex: "(A \\lor B) \\land \\lnot A", f: (a, b) => (a || b) && !a },
    { tex: "A \\Leftrightarrow \\lnot B", f: (a, b) => a === !b },
    { tex: "(A \\Rightarrow B) \\Rightarrow A", f: (a, b) => !(!a || b) || a },
    { tex: "\\lnot A \\Rightarrow (A \\land B)", f: (a, b) => a || (a && b) },
  ];
  const T2 = [
    { tex: "(A \\Rightarrow B) \\Leftrightarrow (\\lnot B \\Rightarrow \\lnot A)", f: (a, b) => (!a || b) === (b || !a) },
    { tex: "(A \\land (A \\Rightarrow B)) \\Rightarrow B", f: (a, b) => !(a && (!a || b)) || b },
    { tex: "\\lnot (A \\land B) \\Leftrightarrow (\\lnot A \\lor \\lnot B)", f: (a, b) => !(a && b) === (!a || !b) },
    { tex: "(A \\Rightarrow B) \\Rightarrow (B \\Rightarrow A)", f: (a, b) => !(!a || b) || (!b || a) },
    { tex: "(A \\lor B) \\Rightarrow A", f: (a, b) => !(a || b) || a },
    { tex: "\\lnot (A \\land B) \\Leftrightarrow (\\lnot A \\land \\lnot B)", f: (a, b) => !(a && b) === (!a && !b) },
    { tex: "(A \\Rightarrow B) \\lor (B \\Rightarrow A)", f: (a, b) => (!a || b) || (!b || a) },
    { tex: "(A \\Rightarrow B) \\Leftrightarrow (B \\Rightarrow A)", f: (a, b) => (!a || b) === (!b || a) },
  ];
  const F3 = [
    { tex: "(A \\land B) \\lor C", f: (a, b, c) => (a && b) || c },
    { tex: "(A \\Rightarrow B) \\land (B \\Rightarrow C)", f: (a, b, c) => (!a || b) && (!b || c) },
    { tex: "A \\Leftrightarrow (B \\lor C)", f: (a, b, c) => a === (b || c) },
    { tex: "(A \\lor B) \\land (\\lnot A \\lor C)", f: (a, b, c) => (a || b) && (!a || c) },
    { tex: "\\lnot A \\land (B \\Rightarrow C)", f: (a, b, c) => !a && (!b || c) },
    { tex: "(A \\Rightarrow C) \\lor (B \\Rightarrow \\lnot C)", f: (a, b, c) => (!a || c) || (!b || !c) },
  ];
  const NEG = [
    { s: "\\forall x \\in \\mathbb{R}:\\ x^2 \\ge 0", n: "\\exists x \\in \\mathbb{R}:\\ x^2 < 0", w: ["\\forall x \\in \\mathbb{R}:\\ x^2 < 0", "\\exists x \\in \\mathbb{R}:\\ x^2 \\le 0"] },
    { s: "\\exists n \\in \\mathbb{N}:\\ n > 5 \\land n < 7", n: "\\forall n \\in \\mathbb{N}:\\ n \\le 5 \\lor n \\ge 7", w: ["\\forall n \\in \\mathbb{N}:\\ n \\le 5 \\land n \\ge 7", "\\exists n \\in \\mathbb{N}:\\ n \\le 5 \\lor n \\ge 7"] },
    { s: "\\forall \\varepsilon > 0\\ \\exists n_0\\ \\forall n \\ge n_0:\\ |a_n - a| < \\varepsilon", n: "\\exists \\varepsilon > 0\\ \\forall n_0\\ \\exists n \\ge n_0:\\ |a_n - a| \\ge \\varepsilon", w: ["\\exists \\varepsilon > 0\\ \\exists n_0\\ \\forall n \\ge n_0:\\ |a_n - a| \\ge \\varepsilon", "\\forall \\varepsilon > 0\\ \\exists n_0\\ \\forall n \\ge n_0:\\ |a_n - a| \\ge \\varepsilon"] },
    { s: "\\forall x\\ \\exists y:\\ x < y", n: "\\exists x\\ \\forall y:\\ x \\ge y", w: ["\\exists x\\ \\forall y:\\ x > y", "\\forall x\\ \\exists y:\\ x \\ge y"] },
    { s: "\\exists s\\ \\forall x \\in M:\\ x \\le s", n: "\\forall s\\ \\exists x \\in M:\\ x > s", w: ["\\forall s\\ \\exists x \\in M:\\ x \\ge s", "\\exists s\\ \\forall x \\in M:\\ x > s"] },
    { s: "\\forall x \\in M:\\ (x > 0 \\Rightarrow x^2 > x)", n: "\\exists x \\in M:\\ x > 0 \\land x^2 \\le x", w: ["\\exists x \\in M:\\ x \\le 0 \\Rightarrow x^2 \\le x", "\\forall x \\in M:\\ x > 0 \\land x^2 \\le x"] },
  ];
  const W = (b) => (b ? "w" : "f");

  gen("ana-logik", {
    title: "Aussagenlogik",
    make(level, G) {
      if (level === 1) {
        const F = G.pick(F2), a = G.chance(0.5), b = G.chance(0.5);
        return tf("$A$ ist **" + (a ? "wahr" : "falsch") + "**, $B$ ist **" + (b ? "wahr" : "falsch") + "**. Ist $" + F.tex + "$ wahr?", F.f(a, b),
          "Mit $A = " + W(a) + "$ und $B = " + W(b) + "$ ergibt $" + F.tex + "$ den Wert " + (F.f(a, b) ? "wahr" : "falsch") + ". Werte von innen nach außen aus.");
      }
      if (level === 2) {
        const F = G.pick(T2);
        const rows = [[true, true], [true, false], [false, true], [false, false]];
        const taut = rows.every(([a, b]) => F.f(a, b));
        const bad = rows.find(([a, b]) => !F.f(a, b));
        return tf("$" + F.tex + "$ ist eine **Tautologie**, also in jeder Zeile der Wahrheitstafel wahr.", taut,
          taut ? "Alle vier Belegungen ergeben wahr." : "Für $A = " + W(bad[0]) + "$, $B = " + W(bad[1]) + "$ ist die Aussage falsch.",
          taut ? null : "Gegenbeispiel: $A = " + W(bad[0]) + "$, $B = " + W(bad[1]) + "$.");
      }
      if (level === 3) {
        const N = G.pick(NEG);
        return {
          type: "choice", md: "Was ist die Verneinung von $" + N.s + "$?",
          options: G.options({ md: "$" + N.n + "$" }, N.w.map((w) => ({ md: "$" + w + "$", why: "Beim Verneinen werden **alle** Quantoren getauscht ($\\forall \\leftrightarrow \\exists$) und die innere Aussage wird verneint." }))),
          explain: "Regel: $\\lnot \\forall x: P(x) \\equiv \\exists x: \\lnot P(x)$ und umgekehrt. Ungleichungen kippen dabei: $<$ wird zu $\\ge$, $\\le$ zu $>$; aus $\\land$ wird $\\lor$, aus $P \\Rightarrow Q$ wird $P \\land \\lnot Q$.",
        };
      }
      const F = G.pick(F3);
      let cnt = 0;
      for (const a of [true, false]) for (const b of [true, false]) for (const c of [true, false]) if (F.f(a, b, c)) cnt++;
      return num("In wie vielen der 8 Zeilen der Wahrheitstafel ist $" + F.tex + "$ wahr?", cnt, {
        hint: "Gehe die 8 Belegungen von $A, B, C$ systematisch durch.",
        explain: "Genau $" + cnt + "$ von $8$ Belegungen machen die Aussage wahr.",
      });
    },
  });

  // ---------------------------------------------------------------- sets and maps

  function randSet(G, k) { const s = new Set(); while (s.size < k) s.add(G.int(1, 10)); return [...s].sort((a, b) => a - b); }
  const setTex = (arr) => (arr.length ? "\\{" + arr.join(", ") + "\\}" : "\\emptyset");

  gen("ana-mengen", {
    title: "Mengen",
    make(level, G) {
      const A = randSet(G, G.int(3, 6)), B = randSet(G, G.int(3, 6));
      const uni = [...new Set([...A, ...B])].sort((a, b) => a - b), inter = A.filter((x) => B.includes(x)), diff = A.filter((x) => !B.includes(x));
      const sym = uni.filter((x) => !(A.includes(x) && B.includes(x)));
      const intro = "$A = " + setTex(A) + "$, $B = " + setTex(B) + "$. ";
      if (level === 1) {
        const u = G.chance(0.5);
        return num(intro + "Wie viele Elemente hat $A " + (u ? "\\cup" : "\\cap") + " B$?", u ? uni.length : inter.length, {
          explain: "$A " + (u ? "\\cup" : "\\cap") + " B = " + setTex(u ? uni : inter) + "$" + (u ? ", also $" + uni.length + "$ Elemente." : ", also $" + inter.length + "$ Elemente."),
        });
      }
      if (level === 2) {
        const s = G.chance(0.5);
        return num(intro + "Wie viele Elemente hat " + (s ? "die symmetrische Differenz $A \\triangle B = (A \\setminus B) \\cup (B \\setminus A)$" : "$A \\setminus B$") + "?", s ? sym.length : diff.length, {
          explain: s ? "$A \\triangle B = " + setTex(sym) + "$: alles, was in genau einer der beiden Mengen liegt." : "$A \\setminus B = " + setTex(diff) + "$: die Elemente von $A$, die nicht in $B$ liegen.",
        });
      }
      if (level === 3) {
        const p = G.chance(0.5);
        return num(intro + (p ? "Wie viele Elemente hat die Potenzmenge $\\mathcal{P}(A)$?" : "Wie viele Elemente hat $A \\times B$?"), p ? Math.pow(2, A.length) : A.length * B.length, {
          explain: p ? "Jedes der $" + A.length + "$ Elemente ist in einer Teilmenge drin oder nicht: $2^{" + A.length + "} = " + Math.pow(2, A.length) + "$." : "Paare $(a, b)$: $" + A.length + " \\cdot " + B.length + " = " + A.length * B.length + "$.",
        });
      }
      const a = G.int(20, 40), b = G.int(15, 35), c = G.int(10, 30), ab = G.int(3, 9), ac = G.int(3, 9), bc = G.int(2, 8), abc = G.int(1, Math.min(ab, ac, bc));
      const tot = a + b + c - ab - ac - bc + abc;
      return num("In einer Umfrage spielen $" + a + "$ Personen Fußball ($F$), $" + b + "$ Tennis ($T$), $" + c + "$ Volleyball ($V$). $|F \\cap T| = " + ab + "$, $|F \\cap V| = " + ac + "$, $|T \\cap V| = " + bc + "$, $|F \\cap T \\cap V| = " + abc + "$. Wie viele spielen mindestens eine Sportart?", tot, {
        hint: "Einschluss-Ausschluss: Einzelne addieren, Paare abziehen, das Tripel wieder addieren.",
        explain: "$" + a + " + " + b + " + " + c + " - " + ab + " - " + ac + " - " + bc + " + " + abc + " = " + tot + "$.",
      });
    },
  });

  const MAPS = [
    { f: "x \\mapsto x^2", d: "\\mathbb{R} \\to \\mathbb{R}", inj: false, sur: false, why: "$(-1)^2 = 1^2$ und negative Zahlen werden nicht getroffen." },
    { f: "x \\mapsto x^2", d: "[0, \\infty) \\to \\mathbb{R}", inj: true, sur: false, why: "Auf $[0, \\infty)$ ist $x^2$ streng monoton, aber $-1$ hat kein Urbild." },
    { f: "x \\mapsto x^2", d: "\\mathbb{R} \\to [0, \\infty)", inj: false, sur: true, why: "Jedes $y \\ge 0$ hat das Urbild $\\sqrt y$, aber $\\pm\\sqrt y$ sind zwei." },
    { f: "x \\mapsto x^2", d: "[0, \\infty) \\to [0, \\infty)", inj: true, sur: true, why: "Umkehrabbildung ist $y \\mapsto \\sqrt y$." },
    { f: "n \\mapsto 2n + 1", d: "\\mathbb{Z} \\to \\mathbb{Z}", inj: true, sur: false, why: "Verschiedene $n$ haben verschiedene Bilder, aber gerade Zahlen werden nie getroffen." },
    { f: "x \\mapsto 2x + 1", d: "\\mathbb{R} \\to \\mathbb{R}", inj: true, sur: true, why: "Umkehrabbildung $y \\mapsto \\tfrac{y - 1}{2}$." },
    { f: "x \\mapsto x^3", d: "\\mathbb{R} \\to \\mathbb{R}", inj: true, sur: true, why: "Streng monoton und stetig mit Grenzwerten $\\pm\\infty$." },
    { f: "x \\mapsto e^x", d: "\\mathbb{R} \\to \\mathbb{R}", inj: true, sur: false, why: "Streng monoton, aber nie negativ oder null." },
    { f: "x \\mapsto \\sin x", d: "\\mathbb{R} \\to [-1, 1]", inj: false, sur: true, why: "Jeder Wert in $[-1, 1]$ wird getroffen, unendlich oft." },
    { f: "x \\mapsto |x|", d: "\\mathbb{R} \\to \\mathbb{R}", inj: false, sur: false, why: "$|-1| = |1|$, und negative Werte kommen nicht vor." },
    { f: "x \\mapsto \\lfloor x \\rfloor", d: "\\mathbb{R} \\to \\mathbb{Z}", inj: false, sur: true, why: "Jede ganze Zahl $k$ ist $\\lfloor k \\rfloor$, aber auch $\\lfloor k + 0{,}5 \\rfloor$." },
    { f: "n \\mapsto n + 1", d: "\\mathbb{N} \\to \\mathbb{N}", inj: true, sur: false, why: "$1$ hat kein Urbild (mit $\\mathbb{N} = \\{1, 2, \\dots\\}$)." },
  ];
  const kind = (m) => (m.inj && m.sur ? "bijektiv" : m.inj ? "injektiv, nicht surjektiv" : m.sur ? "surjektiv, nicht injektiv" : "weder injektiv noch surjektiv");

  gen("ana-abb", {
    title: "Abbildungen",
    make(level, G) {
      if (level <= 2) {
        const m = G.pick(level === 1 ? MAPS.slice(0, 7) : MAPS);
        const all = ["bijektiv", "injektiv, nicht surjektiv", "surjektiv, nicht injektiv", "weder injektiv noch surjektiv"];
        return {
          type: "choice", md: "Welche Eigenschaften hat $" + m.f + "$ als Abbildung $" + m.d + "$?", shuffle: false,
          options: all.map((k) => (k === kind(m) ? { md: k, correct: true } : { md: k })),
          explain: m.why + " Ob eine Abbildung injektiv oder surjektiv ist, hängt von Definitions- und Zielmenge ab, nicht nur von der Formel.",
        };
      }
      if (level === 3) {
        const pool = [
          ["Ist $g \\circ f$ injektiv, dann ist $f$ injektiv.", true, "Aus $f(x) = f(y)$ folgt $g(f(x)) = g(f(y))$, also $x = y$."],
          ["Ist $g \\circ f$ surjektiv, dann ist $f$ surjektiv.", false, "Gegenbeispiel: $f: \\{1\\} \\to \\{1, 2\\}$, $g: \\{1, 2\\} \\to \\{1\\}$. Dann ist $g \\circ f$ surjektiv, $f$ nicht. Richtig wäre: $g$ ist surjektiv."],
          ["Ist $g \\circ f$ surjektiv, dann ist $g$ surjektiv.", true, "Jedes $z$ ist $g(f(x))$ für ein $x$, also hat $z$ das Urbild $f(x)$ unter $g$."],
          ["Sind $f$ und $g$ bijektiv, dann ist $g \\circ f$ bijektiv mit $(g \\circ f)^{-1} = f^{-1} \\circ g^{-1}$.", true, "$(f^{-1} \\circ g^{-1}) \\circ (g \\circ f) = f^{-1} \\circ f = \\mathrm{id}$, ebenso in der anderen Reihenfolge."],
          ["Ist $g \\circ f$ injektiv, dann ist $g$ injektiv.", false, "Gegenbeispiel: $f: \\{1\\} \\to \\{1, 2\\}$, $g$ bildet beide auf denselben Wert ab. $g \\circ f$ ist injektiv, $g$ nicht."],
        ];
        const [md, ans, why] = G.pick(pool);
        return tf(md, ans, why, why);
      }
      const k = G.int(2, 4), n = G.int(k, 6);
      const which = G.pick(["all", "inj", "bij"]);
      const v = which === "all" ? Math.pow(n, k) : which === "inj" ? G.fact(n) / G.fact(n - k) : G.fact(n);
      return num(which === "bij" ? "Wie viele bijektive Abbildungen gibt es von einer $" + n + "$-elementigen Menge auf sich selbst?" : "Wie viele " + (which === "inj" ? "**injektive** " : "") + "Abbildungen gibt es von einer $" + k + "$-elementigen in eine $" + n + "$-elementige Menge?", Math.round(v), {
        explain: which === "all" ? "Jedes der $" + k + "$ Elemente hat $" + n + "$ mögliche Bilder: $" + n + "^{" + k + "} = " + v + "$." : which === "inj" ? "Bilder müssen verschieden sein: $" + Array.from({ length: k }, (_, i) => n - i).join(" \\cdot ") + " = " + v + "$." : "Bijektionen sind Permutationen: $" + n + "! = " + v + "$.",
      });
    },
  });

  // ---------------------------------------------------------------- ordered field

  const INEQ = [
    ["Aus $a < b$ folgt $a + c < b + c$ für jedes $c$.", true, "Verträglichkeit der Ordnung mit der Addition."],
    ["Aus $a < b$ und $c < 0$ folgt $ac > bc$.", true, "$b - a > 0$ und $-c > 0$, also $(b - a)(-c) > 0$, das heißt $ac > bc$."],
    ["Aus $a < b$ folgt $a^2 < b^2$.", false, "Gegenbeispiel $a = -3$, $b = 1$: $9 > 1$."],
    ["Aus $0 < a < b$ folgt $\\tfrac1a > \\tfrac1b$.", true, "$\\tfrac1a - \\tfrac1b = \\tfrac{b - a}{ab} > 0$."],
    ["Aus $a < b$ folgt $\\tfrac1a > \\tfrac1b$, sofern $a, b \\ne 0$.", false, "Gegenbeispiel $a = -1$, $b = 1$: $-1 < 1$."],
    ["Für alle $a, b$ gilt $|a + b| \\le |a| + |b|$.", true, "Die Dreiecksungleichung."],
    ["Für alle $a, b$ gilt $|a| - |b| \\le |a - b|$.", true, "Umgekehrte Dreiecksungleichung: $|a| = |(a - b) + b| \\le |a - b| + |b|$."],
    ["Für alle $a$ gilt $a^2 \\ge 0$.", true, "Für $a \\ge 0$ ist $a \\cdot a \\ge 0$, für $a < 0$ ist $a \\cdot a = (-a)(-a) > 0$."],
    ["Aus $a < b$ und $c < d$ folgt $ac < bd$.", false, "Gegenbeispiel $a = -2$, $b = 0$, $c = -1$, $d = 1$: $ac = 2 > 0 = bd$."],
    ["Aus $ab > 0$ folgt, dass $a$ und $b$ dasselbe Vorzeichen haben.", true, "Hätten sie verschiedene Vorzeichen, wäre $ab < 0$; ist einer null, wäre $ab = 0$."],
  ];

  gen("ana-anordnung", {
    title: "Rechnen mit Ungleichungen",
    make(level, G) {
      if (level <= 2) { const [md, ans, why] = G.pick(level === 1 ? INEQ.slice(0, 6) : INEQ); return tf(md, ans, why, why); }
      const a = nz(G, -5, 5), b = G.int(1, 6);
      if (level === 3) return {
        type: "cloze", md: "Bestimme die Lösungsmenge von $|x " + pm(-a) + "| < " + b + "$ als Intervall $(u, v)$.\n\n$u =$ {{0}} $\\qquad v =$ {{1}}",
        blanks: [blank(a - b), blank(a + b)],
        hint: "$|x - c|$ ist der Abstand von $x$ zu $c$.",
        explain: "$|x " + pm(-a) + "| < " + b + " \\iff -" + b + " < x " + pm(-a) + " < " + b + " \\iff " + (a - b) + " < x < " + (a + b) + "$. Der Betrag misst den Abstand zu $" + a + "$: Gesucht sind alle Punkte, die weniger als $" + b + "$ von $" + a + "$ entfernt sind.",
      };
      const c = G.pick([2, 3]);
      return {
        type: "cloze", md: "Bestimme die Lösungsmenge von $|" + c + "x " + pm(-a) + "| \\le " + b + "$ als Intervall $[u, v]$ (drei Nachkommastellen).\n\n$u =$ {{0}} $\\qquad v =$ {{1}}",
        blanks: [blank((a - b) / c, 0.001), blank((a + b) / c, 0.001)],
        explain: "$-" + b + " \\le " + c + "x " + pm(-a) + " \\le " + b + "$, also $" + (a - b) + " \\le " + c + "x \\le " + (a + b) + "$ und $" + G.frac(a - b, c) + " \\le x \\le " + G.frac(a + b, c) + "$.",
      };
    },
  });

  // ---------------------------------------------------------------- supremum

  gen("ana-supinf", {
    title: "Supremum und Infimum",
    make(level, G) {
      if (level === 1) {
        const a = G.int(-4, 3), b = a + G.int(1, 5), lo = G.chance(0.5), hi = G.chance(0.5);
        return {
          type: "cloze", md: "$M = " + (lo ? "[" : "(") + a + ", " + b + (hi ? "]" : ")") + "$. Bestimme Supremum und Infimum.\n\n$\\sup M =$ {{0}} $\\qquad \\inf M =$ {{1}}",
          blanks: [blank(b), blank(a)],
          explain: "$\\sup M = " + b + "$ " + (hi ? "(sogar Maximum)" : "(kein Maximum, $" + b + " \\notin M$)") + ", $\\inf M = " + a + "$ " + (lo ? "(sogar Minimum)." : "(kein Minimum)."),
        };
      }
      if (level === 2) {
        const a = G.int(-3, 3), b = G.int(1, 4);
        return {
          type: "cloze", md: "$M = \\left\\{ " + a + " + \\dfrac{" + b + "}{n} : n \\in \\mathbb{N} \\right\\}$. Bestimme Supremum und Infimum.\n\n$\\sup M =$ {{0}} $\\qquad \\inf M =$ {{1}}",
          blanks: [blank(a + b), blank(a)],
          hint: "Die Elemente werden mit wachsendem $n$ kleiner. Welches ist das größte? Wohin streben sie?",
          explain: "Größtes Element bei $n = 1$: $\\sup M = \\max M = " + (a + b) + "$. Die Elemente kommen $" + a + "$ beliebig nahe, erreichen es aber nie: $\\inf M = " + a + "$ ist kein Minimum.",
        };
      }
      if (level === 3) {
        const d = G.int(1, 3);
        const sup = Math.max(1 + d / 2, -1 + d);
        return {
          type: "cloze", md: "$M = \\left\\{ (-1)^n + \\dfrac{" + d + "}{n} : n \\in \\mathbb{N} \\right\\}$. Bestimme Supremum und Infimum.\n\n$\\sup M =$ {{0}} $\\qquad \\inf M =$ {{1}}",
          blanks: [blank(sup, 0.001), blank(-1)],
          hint: "Trenne gerade und ungerade $n$. Gerade: $1 + \\tfrac{" + d + "}{n}$, ungerade: $-1 + \\tfrac{" + d + "}{n}$.",
          explain: "Gerade $n$: größtes Element bei $n = 2$, nämlich $" + G.tex(1 + d / 2, 2) + "$. Ungerade $n$: größtes bei $n = 1$, nämlich $" + (d - 1) + "$. Also $\\sup M = " + G.tex(sup, 2) + "$. Die ungeraden Glieder fallen gegen $-1$, ohne es zu erreichen: $\\inf M = -1$.",
        };
      }
      const k = G.pick([2, 3, 5, 6, 7, 10]);
      return num("Bestimme $\\sup \\{ x \\in \\mathbb{Q} : x^2 < " + k + " \\}$ (vier Nachkommastellen).", Math.sqrt(k), {
        tolerance: 0.0006, answerText: G.fmt(Math.sqrt(k), 4),
        explain: "Das Supremum ist $\\sqrt{" + k + "} \\approx " + G.tex(Math.sqrt(k), 4) + "$. Weil $\\sqrt{" + k + "}$ irrational ist, liegt es nicht in der Menge, und in $\\mathbb{Q}$ allein hätte die Menge gar kein Supremum. Genau dafür braucht man das Vollständigkeitsaxiom.",
      });
    },
  });

  // ---------------------------------------------------------------- induction, sums

  // Induction step for classic sum formulas: F(n) is the formula, a the new summand, F1 the formula for n + 1.
  const SUMS = [
    { tex: "\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}", F: "\\frac{n(n+1)}{2}", a: "(n+1)", aOld: "n", F1: "\\frac{(n+1)(n+2)}{2}" },
    { tex: "\\sum_{k=1}^{n} (2k - 1) = n^2", F: "n^2", a: "(2n + 1)", aOld: "(2n - 1)", F1: "(n+1)^2" },
    { tex: "\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}", F: "\\frac{n(n+1)(2n+1)}{6}", a: "(n+1)^2", aOld: "n^2", F1: "\\frac{(n+1)(n+2)(2n+3)}{6}" },
    { tex: "\\sum_{k=1}^{n} \\frac{1}{k(k+1)} = \\frac{n}{n+1}", F: "\\frac{n}{n+1}", a: "\\frac{1}{(n+1)(n+2)}", aOld: "\\frac{1}{n(n+1)}", F1: "\\frac{n+1}{n+2}" },
    { tex: "\\sum_{k=0}^{n} 2^k = 2^{n+1} - 1", F: "2^{n+1} - 1", a: "2^{n+1}", aOld: "2^{n}", F1: "2^{n+2} - 1" },
  ];

  gen("ana-summen", {
    title: "Summen und Induktion",
    make(level, G) {
      if (level === 1) { const n = G.int(10, 120); return num("Berechne $1 + 2 + 3 + \\dots + " + n + "$.", (n * (n + 1)) / 2, { explain: "Gauß: $\\tfrac{" + n + " \\cdot " + (n + 1) + "}{2} = " + (n * (n + 1)) / 2 + "$." }); }
      if (level === 2) {
        const n = G.int(5, 30), sq = G.chance(0.5);
        return num(sq ? "Berechne $\\sum_{k=1}^{" + n + "} k^2$." : "Berechne die Summe der ersten $" + n + "$ ungeraden Zahlen $1 + 3 + 5 + \\dots$", sq ? (n * (n + 1) * (2 * n + 1)) / 6 : n * n, {
          explain: sq ? "$\\tfrac{" + n + " \\cdot " + (n + 1) + " \\cdot " + (2 * n + 1) + "}{6} = " + (n * (n + 1) * (2 * n + 1)) / 6 + "$." : "Die Summe der ersten $n$ ungeraden Zahlen ist $n^2 = " + n * n + "$.",
        });
      }
      if (level === 3) {
        const q = G.pick([2, 3, -2]), n = G.int(4, 9);
        const v = (Math.pow(q, n + 1) - 1) / (q - 1);
        return num("Berechne $\\sum_{k=0}^{" + n + "} " + par(q) + "^k$.", v, {
          hint: "Geometrische Summe: $\\sum_{k=0}^{n} q^k = \\dfrac{q^{n+1} - 1}{q - 1}$ für $q \\ne 1$.",
          explain: "$\\dfrac{" + par(q) + "^{" + (n + 1) + "} - 1}{" + par(q) + " - 1} = " + v + "$.",
        });
      }
      const S = G.pick(SUMS);
      return {
        type: "choice", md: "Beweis von $" + S.tex + "$ durch Induktion. Was ist im **Induktionsschritt** zu zeigen, wenn die Formel für $n$ angenommen wird?",
        options: G.options({ md: "$" + S.F + " + " + S.a + " = " + S.F1 + "$" }, [
          { md: "$" + S.F + " + " + S.aOld + " = " + S.F1 + "$", why: "Zur Summe bis $n$ kommt das Glied mit Index $n + 1$ dazu, nicht noch einmal das mit Index $n$." },
          { md: "$" + S.F + " = " + S.F1 + "$", why: "Die Summen bis $n$ und bis $n + 1$ unterscheiden sich um ein Glied." },
          { md: "Die Formel für $n = 1$.", why: "Das ist der Induktionsanfang, nicht der Schritt." },
        ]),
        explain: "Summe bis $n + 1$ = Summe bis $n$ plus das neue Glied. Mit der Induktionsannahme ersetzt man die Summe bis $n$ durch die Formel und rechnet nach, dass die Formel für $n + 1$ herauskommt.",
      };
    },
  });

  gen("ana-archimedes", {
    title: "Archimedisches Prinzip",
    make(level, G) {
      const eps = G.pick([0.3, 0.12, 0.07, 0.04, 0.015, 0.003]);
      if (level === 1) { const n0 = Math.floor(1 / eps) + 1; return num("Bestimme das kleinste $n \\in \\mathbb{N}$ mit $\\tfrac1n < " + G.tex(eps, 3) + "$.", n0, { explain: "$\\tfrac1n < " + G.tex(eps, 3) + " \\iff n > \\tfrac{1}{" + G.tex(eps, 3) + "} \\approx " + G.tex(1 / eps, 3) + "$, also $n = " + n0 + "$. Dass es ein solches $n$ gibt, ist genau das archimedische Prinzip." }); }
      if (level === 2) { const c = G.int(2, 9); const n0 = Math.floor(c / eps + 1e-9) + 1; return num("Bestimme das kleinste $n$ mit $\\tfrac{" + c + "}{n} < " + G.tex(eps, 3) + "$.", n0, { explain: "$n > \\tfrac{" + c + "}{" + G.tex(eps, 3) + "} = " + G.tex(c / eps, 3) + "$, also $n = " + n0 + "$." }); }
      if (level === 3) { let n0 = 1; while (Math.pow(0.5, n0) >= eps) n0++; return num("Bestimme das kleinste $n$ mit $\\tfrac{1}{2^n} < " + G.tex(eps, 3) + "$.", n0, { explain: "$2^n > \\tfrac{1}{" + G.tex(eps, 3) + "} \\approx " + G.tex(1 / eps, 2) + "$. Es ist $2^{" + (n0 - 1) + "} = " + Math.pow(2, n0 - 1) + "$ und $2^{" + n0 + "} = " + Math.pow(2, n0) + "$, also $n = " + n0 + "$." }); }
      const x = G.int(10, 200), e = G.pick([0.3, 0.7, 1.3, 2.5]);
      const n0 = Math.floor(x / e + 1e-9) + 1;
      return num("Archimedes: Wie oft muss man mindestens $" + G.tex(e, 1) + "$ addieren, um $" + x + "$ zu überschreiten? (kleinstes $n$ mit $n \\cdot " + G.tex(e, 1) + " > " + x + "$)", n0, { explain: "$n > \\tfrac{" + x + "}{" + G.tex(e, 1) + "} \\approx " + G.tex(x / e, 3) + "$, also $n = " + n0 + "$. Kein noch so kleines positives $\\varepsilon$ ist »unendlich klein«." });
    },
  });

  gen("ana-binom", {
    title: "Binomialkoeffizienten",
    make(level, G) {
      if (level === 1) { const n = G.int(5, 12), k = G.int(1, n - 1); return num("Berechne $\\binom{" + n + "}{" + k + "}$.", G.binom(n, k), { explain: "$\\binom{" + n + "}{" + k + "} = \\tfrac{" + n + "!}{" + k + "!\\," + (n - k) + "!} = " + G.binom(n, k) + "$." }); }
      if (level === 2) {
        const n = G.int(3, 7), k = G.int(1, n - 1), a = G.int(1, 3), b = nz(G, -3, 3);
        const v = G.binom(n, k) * Math.pow(a, n - k) * Math.pow(b, k);
        return num("Welchen Koeffizienten hat $x^{" + k + "}$ in $(" + poly([[a, 0], [b, 1]], "x") + ")^{" + n + "}$?", v, {
          hint: "Binomischer Lehrsatz: $(a + b)^n = \\sum_k \\binom nk a^{n-k} b^k$.",
          explain: "$\\binom{" + n + "}{" + k + "} \\cdot " + a + "^{" + (n - k) + "} \\cdot " + par(b) + "^{" + k + "} = " + v + "$.",
        });
      }
      if (level === 3) {
        const n = G.int(3, 9), x = G.pick([0.1, 0.2, 0.5, -0.1, -0.2]);
        const diff = Math.pow(1 + x, n) - (1 + n * x);
        return num("Bernoullische Ungleichung $(1 + x)^n \\ge 1 + nx$. Berechne für $x = " + G.tex(x, 1) + "$, $n = " + n + "$ die Differenz $(1 + x)^n - (1 + nx)$ (vier Nachkommastellen).", diff, {
          tolerance: 0.0006, answerText: G.fmt(diff, 4),
          explain: "$" + G.tex(1 + x, 1) + "^{" + n + "} \\approx " + G.tex(Math.pow(1 + x, n), 4) + "$ und $1 + " + n + " \\cdot " + G.tex(x, 1) + " = " + G.tex(1 + n * x, 1) + "$, Differenz $\\approx " + G.tex(diff, 4) + " \\ge 0$, wie die Ungleichung (für $x \\ge -1$) verspricht.",
        });
      }
      const n = G.int(4, 12);
      const pool = [
        ["\\sum_{k=0}^{" + n + "} \\binom{" + n + "}{k}", Math.pow(2, n), "Setze $a = b = 1$ im binomischen Lehrsatz: $(1 + 1)^{" + n + "} = 2^{" + n + "}$."],
        ["\\sum_{k=0}^{" + n + "} (-1)^k \\binom{" + n + "}{k}", 0, "Setze $a = 1$, $b = -1$: $(1 - 1)^{" + n + "} = 0$."],
        ["\\binom{" + n + "}{3} + \\binom{" + n + "}{4}", G.binom(n + 1, 4), "Pascalsche Regel: $\\binom{n}{k} + \\binom{n}{k+1} = \\binom{n+1}{k+1}$, hier $\\binom{" + (n + 1) + "}{4}$."],
      ];
      const [tex, v, why] = G.pick(pool);
      return num("Berechne $" + tex + "$.", v, { explain: "Ergebnis $" + v + "$. " + why });
    },
  });

  // ---------------------------------------------------------------- roots, density, countability

  gen("ana-wurzel", {
    title: "Wurzeln und Intervallschachtelung",
    make(level, G) {
      const n = G.pick([2, 3, 5, 6, 7, 8, 10, 11, 13, 15, 17, 19, 20, 23]);
      if (level === 1) { const lo = Math.floor(Math.sqrt(n)); return { type: "cloze", md: "Zwischen welchen aufeinanderfolgenden ganzen Zahlen liegt $\\sqrt{" + n + "}$?\n\n{{0}} $< \\sqrt{" + n + "} <$ {{1}}", blanks: [blank(lo), blank(lo + 1)], explain: "$" + lo + "^2 = " + lo * lo + " < " + n + " < " + (lo + 1) * (lo + 1) + " = " + (lo + 1) + "^2$." }; }
      if (level === 2) return num("Bestimme $\\sqrt{" + n + "}$ auf zwei Nachkommastellen genau, ohne Taschenrechner-Wurzel: Quadriere Kandidaten.", Math.sqrt(n), { tolerance: 0.01, answerText: G.fmt(Math.sqrt(n), 2), explain: "$\\sqrt{" + n + "} \\approx " + G.tex(Math.sqrt(n), 4) + "$. Prüfe: $" + G.tex(Math.floor(Math.sqrt(n) * 100) / 100, 2) + "^2 < " + n + " < " + G.tex(Math.ceil(Math.sqrt(n) * 100) / 100, 2) + "^2$." });
      if (level === 3) {
        const sq = G.chance(0.4);
        const m = sq ? G.pick([4, 9, 16, 25, 36, 49]) : n;
        const den = G.pick([1, 4, 9]);
        const md = den > 1 ? "\\sqrt{\\tfrac{" + m + "}{" + den + "}}" : "\\sqrt{" + m + "}";
        return tf("$" + md + "$ ist rational.", sq, sq ? "$" + md + " = " + G.frac(Math.sqrt(m), Math.sqrt(den)) + "$." : "$" + m + "$ ist keine Quadratzahl. Dann ist $\\sqrt{" + m + "}$ irrational, der Beweis läuft wie bei $\\sqrt2$ über die Primfaktorzerlegung." + (den > 1 ? " Der Nenner $\\sqrt{" + den + "} = " + Math.sqrt(den) + "$ ändert daran nichts." : ""), "Wäre $\\sqrt{" + m + "} = \\tfrac pq$ gekürzt, dann $p^2 = " + m + "q^2$, was der eindeutigen Primfaktorzerlegung widerspricht.");
      }
      const L = G.int(1, 4), eps = G.pick([0.1, 0.01, 0.001, 0.0001]);
      let k = 0; while (L / Math.pow(2, k) >= eps) k++;
      return num("Bei der Intervallhalbierung startet man mit einem Intervall der Länge $" + L + "$. Nach wie vielen Halbierungen ist die Länge erstmals kleiner als $" + G.tex(eps, 4) + "$?", k, { explain: "Nach $k$ Schritten ist die Länge $\\tfrac{" + L + "}{2^k}$. Kleinstes $k$ mit $2^k > " + G.tex(L / eps, 1) + "$: $k = " + k + "$." });
    },
  });

  const COUNT = [
    ["$\\mathbb{N}$", "abzählbar"], ["$\\mathbb{Z}$", "abzählbar"], ["$\\mathbb{Q}$", "abzählbar"], ["$\\mathbb{N} \\times \\mathbb{N}$", "abzählbar"],
    ["die Menge der endlichen 0-1-Folgen", "abzählbar"], ["die Menge der Primzahlen", "abzählbar"], ["die algebraischen Zahlen", "abzählbar"],
    ["$\\mathbb{R}$", "überabzählbar"], ["$[0, 1]$", "überabzählbar"], ["die Menge der unendlichen 0-1-Folgen", "überabzählbar"],
    ["$\\mathcal{P}(\\mathbb{N})$", "überabzählbar"], ["$\\mathbb{R} \\setminus \\mathbb{Q}$", "überabzählbar"], ["$\\mathbb{C}$", "überabzählbar"],
  ];

  gen("ana-abzaehlbar", {
    title: "Abzählbarkeit",
    make(level, G) {
      if (level <= 3) {
        const items = G.pickN(COUNT, 3 + level);
        if (!items.some((i) => i[1] === "abzählbar")) items[0] = COUNT[2];
        if (!items.some((i) => i[1] === "überabzählbar")) items[1] = COUNT[7];
        return { type: "sort", md: "Ordne die Mengen ein.", categories: ["abzählbar", "überabzählbar"], items: items.map(([md, cat]) => ({ md, cat })), explain: "Abzählbar heißt: Man kann die Elemente durchnummerieren, eventuell mit Wiederholungen (Cantors Zickzack für $\\mathbb{Q}$). Überabzählbar sind $\\mathbb{R}$ und alles, was eine Kopie davon enthält, und die unendlichen 0-1-Folgen (Diagonalargument)." };
      }
      const pool = [
        ["Eine abzählbare Vereinigung abzählbarer Mengen ist abzählbar.", true, "Man zählt im Zickzack wie bei $\\mathbb{N} \\times \\mathbb{N}$."],
        ["Jede unendliche Teilmenge von $\\mathbb{Q}$ ist abzählbar unendlich.", true, "Teilmengen abzählbarer Mengen sind höchstens abzählbar."],
        ["Wäre $\\mathbb{R} \\setminus \\mathbb{Q}$ abzählbar, dann auch $\\mathbb{R}$.", true, "$\\mathbb{R} = \\mathbb{Q} \\cup (\\mathbb{R} \\setminus \\mathbb{Q})$ wäre Vereinigung zweier abzählbarer Mengen. Weil $\\mathbb{R}$ überabzählbar ist, sind die Irrationalen überabzählbar."],
        ["Zwischen zwei verschiedenen reellen Zahlen liegt immer eine rationale Zahl.", true, "Das ist die Dichtheit von $\\mathbb{Q}$, eine Folge des archimedischen Prinzips."],
        ["Es gibt eine Bijektion zwischen $\\mathbb{N}$ und $\\mathcal{P}(\\mathbb{N})$.", false, "Satz von Cantor: Keine Abbildung $\\mathbb{N} \\to \\mathcal{P}(\\mathbb{N})$ ist surjektiv."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- complex numbers

  function cpx(re, im, G) {
    if (re === 0 && im === 0) return "0";
    const r = re !== 0 ? G.tex(re, 3) : "";
    if (im === 0) return r;
    const mag = Math.abs(im) === 1 ? "" : G.tex(Math.abs(im), 3);
    return r + (im < 0 ? (r ? " - " : "-") : r ? " + " : "") + mag + "i";
  }

  gen("ana-komplex", {
    title: "Komplexe Zahlen",
    make(level, G) {
      const a = G.int(-4, 5), b = nz(G, -4, 5), c = G.int(-4, 5), d = nz(G, -4, 5);
      const z = "(" + cpx(a, b, G) + ")", w = "(" + cpx(c, d, G) + ")";
      if (level === 1) { const add = G.chance(0.5); const re = add ? a + c : a - c, im = add ? b + d : b - d; return { type: "cloze", md: "Berechne $" + z + (add ? " + " : " - ") + w + "$.\n\nRealteil {{0}} $\\qquad$ Imaginärteil {{1}}", blanks: [blank(re), blank(im)], explain: "Komponentenweise: $" + cpx(re, im, G) + "$." }; }
      if (level === 2) { const re = a * c - b * d, im = a * d + b * c; return { type: "cloze", md: "Berechne $" + z + " \\cdot " + w + "$.\n\nRealteil {{0}} $\\qquad$ Imaginärteil {{1}}", blanks: [blank(re), blank(im)], hint: "Ausmultiplizieren und $i^2 = -1$ benutzen.", explain: "$(" + a + " \\cdot " + par(c) + " - " + par(b) + " \\cdot " + par(d) + ") + (" + a + " \\cdot " + par(d) + " + " + par(b) + " \\cdot " + par(c) + ")i = " + cpx(re, im, G) + "$." }; }
      if (level === 3) {
        const den = c * c + d * d, re = (a * c + b * d) / den, im = (b * c - a * d) / den;
        return { type: "cloze", md: "Berechne $\\dfrac{" + cpx(a, b, G) + "}{" + cpx(c, d, G) + "}$ (zwei Nachkommastellen).\n\nRealteil {{0}} $\\qquad$ Imaginärteil {{1}}", blanks: [blank(re, 0.006), blank(im, 0.006)], hint: "Mit dem konjugierten Nenner $" + cpx(c, -d, G) + "$ erweitern.", explain: "Nenner $" + par(c) + "^2 + " + par(d) + "^2 = " + den + "$, Zähler $(" + cpx(a, b, G) + ")(" + cpx(c, -d, G) + ") = " + cpx(a * c + b * d, b * c - a * d, G) + "$. Ergebnis $\\approx " + G.tex(re, 2) + (im < 0 ? " - " : " + ") + G.tex(Math.abs(im), 2) + "i$." };
      }
      const base = G.pick([[1, 1, "\\sqrt2", 45], [1, -1, "\\sqrt2", -45], [0, 1, "1", 90], [Math.sqrt(3), 1, "2", 30]]);
      const n = G.int(3, 8);
      const r = Math.hypot(base[0], base[1]), phi = (base[3] * Math.PI) / 180;
      const R = Math.pow(r, n), re = R * Math.cos(n * phi), im = R * Math.sin(n * phi);
      const ztex = base[0] === Math.sqrt(3) ? "\\sqrt3 + i" : cpx(base[0], base[1], G);
      return { type: "cloze", md: "Berechne $(" + ztex + ")^{" + n + "}$ mit der Polarform.\n\nRealteil {{0}} $\\qquad$ Imaginärteil {{1}}", blanks: [blank(Math.abs(re) < 1e-9 ? 0 : re, 0.01), blank(Math.abs(im) < 1e-9 ? 0 : im, 0.01)], hint: "$|z| = " + base[2] + "$, $\\arg z = " + base[3] + "°$. Beim Potenzieren: Betrag hoch $n$, Winkel mal $n$.", explain: "$|z|^{" + n + "} = " + G.tex(R, 3) + "$, Winkel $" + n + " \\cdot " + base[3] + "° = " + n * base[3] + "°$. Also $z^{" + n + "} = " + G.tex(R, 3) + "(\\cos " + n * base[3] + "° + i \\sin " + n * base[3] + "°) = " + G.tex(Math.abs(re) < 1e-9 ? 0 : re, 2) + (im < 0 ? " - " : " + ") + G.tex(Math.abs(im) < 1e-9 ? 0 : Math.abs(im), 2) + "i$." };
    },
  });

  // ---------------------------------------------------------------- norms and metrics

  gen("ana-normen", {
    title: "Normen und Skalarprodukt",
    make(level, G) {
      const v = [G.int(-6, 6), G.int(-6, 6), G.int(-6, 6)];
      const vt = "(" + v.join(", ") + ")";
      if (level === 1) return { type: "cloze", md: "$v = " + vt + "$. Berechne $\\|v\\|_1$ und $\\|v\\|_\\infty$.\n\n$\\|v\\|_1 =$ {{0}} $\\qquad \\|v\\|_\\infty =$ {{1}}", blanks: [blank(v.reduce((s, x) => s + Math.abs(x), 0)), blank(Math.max(...v.map(Math.abs)))], explain: "$\\|v\\|_1$ ist die Summe der Beträge, $\\|v\\|_\\infty$ der größte Betrag." };
      if (level === 2) { const n2 = Math.hypot(...v); return num("$v = " + vt + "$. Berechne die euklidische Norm $\\|v\\|_2$ (zwei Nachkommastellen).", n2, { tolerance: 0.006, answerText: G.fmt(n2, 2), explain: "$\\sqrt{" + v.map((x) => par(x) + "^2").join(" + ") + "} = \\sqrt{" + v.reduce((s, x) => s + x * x, 0) + "} \\approx " + G.tex(n2, 2) + "$." }); }
      const w = [G.int(-5, 5), G.int(-5, 5), G.int(-5, 5)];
      const dot = v.reduce((s, x, i) => s + x * w[i], 0);
      if (level === 3) return num("$v = " + vt + "$, $w = (" + w.join(", ") + ")$. Berechne das Skalarprodukt $\\langle v, w \\rangle$.", dot, { explain: "$" + v.map((x, i) => par(x) + " \\cdot " + par(w[i])).join(" + ") + " = " + dot + "$. " + (dot === 0 ? "Die Vektoren stehen senkrecht." : "") });
      const nv = Math.hypot(...v), nw = Math.hypot(...w);
      if (nv === 0 || nw === 0) return num("$v = (3, 4, 0)$. Berechne $\\|v\\|_2$.", 5, { explain: "$\\sqrt{9 + 16} = 5$." });
      const ang = (Math.acos(Math.max(-1, Math.min(1, dot / (nv * nw)))) * 180) / Math.PI;
      return num("$v = " + vt + "$, $w = (" + w.join(", ") + ")$. Welchen Winkel schließen sie ein? (Grad, eine Nachkommastelle)", ang, { tolerance: 0.15, answerText: G.fmt(ang, 1) + "°", hint: "$\\cos \\alpha = \\dfrac{\\langle v, w \\rangle}{\\|v\\|_2 \\|w\\|_2}$. Dass der Bruch zwischen $-1$ und $1$ liegt, garantiert die Cauchy-Schwarz-Ungleichung.", explain: "$\\cos \\alpha = \\tfrac{" + dot + "}{" + G.tex(nv, 3) + " \\cdot " + G.tex(nw, 3) + "}$, also $\\alpha \\approx " + G.tex(ang, 1) + "°$." });
    },
  });

  const TOPO = [
    ["$(0, 1)$", "offen"], ["$[0, 1]$", "abgeschlossen"], ["$[0, 1)$", "weder noch"], ["$[0, \\infty)$", "abgeschlossen"], ["$(0, \\infty)$", "offen"],
    ["$\\{\\tfrac1n : n \\in \\mathbb{N}\\}$", "weder noch"], ["$\\{\\tfrac1n : n \\in \\mathbb{N}\\} \\cup \\{0\\}$", "abgeschlossen"], ["$\\mathbb{Z}$", "abgeschlossen"],
    ["$\\mathbb{Q}$", "weder noch"], ["$\\mathbb{R} \\setminus \\{0\\}$", "offen"], ["$\\{5\\}$", "abgeschlossen"],
  ];

  gen("ana-metrik", {
    title: "Offene und abgeschlossene Mengen",
    make(level, G) {
      if (level <= 2) {
        const items = G.pickN(level === 1 ? TOPO.slice(0, 6) : TOPO, 4 + level);
        return { type: "sort", md: "Wie sind die Teilmengen von $\\mathbb{R}$ (mit dem Betragsabstand)?", categories: ["offen", "abgeschlossen", "weder noch"], items: items.map(([md, cat]) => ({ md, cat })), explain: "Offen: Um jeden Punkt passt eine kleine Umgebung in die Menge. Abgeschlossen: Das Komplement ist offen, gleichwertig: Grenzwerte von Folgen in der Menge bleiben in ihr. $\\{\\tfrac1n\\}$ ist nicht abgeschlossen, weil der Grenzwert $0$ fehlt." };
      }
      if (level === 3) {
        const x = [G.int(-4, 4), G.int(-4, 4)], y = [G.int(-4, 4), G.int(-4, 4)];
        const which = G.pick(["1", "inf", "d"]);
        const v = which === "1" ? Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) : which === "inf" ? Math.max(Math.abs(x[0] - y[0]), Math.abs(x[1] - y[1])) : x[0] === y[0] && x[1] === y[1] ? 0 : 1;
        const name = { "1": "der Summenmetrik $d_1$", inf: "der Maximumsmetrik $d_\\infty$", d: "der diskreten Metrik" }[which];
        return num("Abstand von $x = (" + x.join(", ") + ")$ und $y = (" + y.join(", ") + ")$ in " + name + "?", v, { explain: which === "d" ? "Die diskrete Metrik ist $1$ für verschiedene Punkte, $0$ sonst." : "Ergebnis $" + v + "$." });
      }
      const pool = [
        ["Die Vereinigung beliebig vieler offener Mengen ist offen.", true, "Liegt $x$ in der Vereinigung, dann in einer der Mengen, und deren Umgebung von $x$ liegt in der Vereinigung."],
        ["Der Durchschnitt beliebig vieler offener Mengen ist offen.", false, "$\\bigcap_n (-\\tfrac1n, \\tfrac1n) = \\{0\\}$ ist nicht offen. Endliche Durchschnitte sind offen."],
        ["In der diskreten Metrik ist jede Teilmenge offen.", true, "Die Kugel mit Radius $\\tfrac12$ um $x$ ist $\\{x\\}$."],
        ["Eine Menge kann zugleich offen und abgeschlossen sein.", true, "In $\\mathbb{R}$ sind das genau $\\emptyset$ und $\\mathbb{R}$."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- sequences

  gen("ana-grenzwert", {
    title: "Grenzwerte von Folgen",
    make(level, G) {
      if (level === 1) { const a = nz(G, -6, 6), b = G.int(-9, 9), c = nz(G, 1, 6), d = G.int(1, 9); return num("Bestimme $\\lim_{n \\to \\infty} \\dfrac{" + poly([[a, 1], [b, 0]], "n") + "}{" + poly([[c, 1], [d, 0]], "n") + "}$ (drei Nachkommastellen).", a / c, { tolerance: 0.001, answerText: G.fmt(a / c, 3), explain: "Zähler und Nenner durch $n$ teilen: $\\dfrac{" + a + (b ? " " + pm(b) + "/n" : "") + "}{" + c + " " + pm(d) + "/n} \\to " + G.frac(a, c) + "$, weil $\\tfrac{1}{n} \\to 0$." }); }
      if (level === 2) {
        const a = nz(G, -5, 5), c = nz(G, 1, 5), deg = G.pick([2, 3]);
        const lower = G.chance(0.4);
        return num("Bestimme $\\lim_{n \\to \\infty} \\dfrac{" + poly(lower ? [[a, deg - 1], [-7, 0]] : [[a, deg], [1, 1], [-7, 0]], "n") + "}{" + poly([[c, deg], [-2, 1], [1, 0]], "n") + "}$ (drei Nachkommastellen).", lower ? 0 : a / c, { tolerance: 0.001, answerText: G.fmt(lower ? 0 : a / c, 3), explain: lower ? "Durch $n^{" + deg + "}$ teilen: Im Zähler bleibt nur noch $\\tfrac{" + a + "}{n} + \\dots \\to 0$, im Nenner $" + c + "$. Grenzwert $0$, weil der Nenner schneller wächst." : "Durch $n^{" + deg + "}$ teilen, es bleiben die Leitkoeffizienten: $" + G.frac(a, c) + "$." });
      }
      if (level === 3) { const a = nz(G, -6, 8); const rad = poly([[1, 2], [a, 1]], "n"); return num("Bestimme $\\lim_{n \\to \\infty} \\left(\\sqrt{" + rad + "} - n\\right)$.", a / 2, { tolerance: 0.001, hint: "Mit $\\sqrt{" + rad + "} + n$ erweitern (dritte binomische Formel).", explain: "$\\dfrac{(" + rad + ") - n^2}{\\sqrt{" + rad + "} + n} = \\dfrac{" + poly([[a, 1]], "n") + "}{\\sqrt{" + rad + "} + n} = \\dfrac{" + a + "}{\\sqrt{1 " + pm(a) + "/n} + 1} \\to " + G.frac(a, 2) + "$." }); }
      const a = nz(G, -3, 3), b = G.pick([1, 2, 3]);
      const inner = "\\left(1 " + (a < 0 ? "-" : "+") + " \\tfrac{" + Math.abs(a) + "}{n}\\right)";
      return num("Bestimme $\\lim_{n \\to \\infty} " + inner + "^{" + (b === 1 ? "" : b) + "n}$ (vier Nachkommastellen).", Math.exp(a * b), { tolerance: 0.0006, answerText: G.fmt(Math.exp(a * b), 4), hint: "$\\left(1 + \\tfrac{x}{n}\\right)^n \\to e^x$.", explain: (b === 1 ? "" : "$" + inner + "^{" + b + "n} = \\left(" + inner + "^{n}\\right)^{" + b + "}$. ") + "Es gilt $" + inner + "^{n} \\to e^{" + a + "}$, also geht der Ausdruck gegen $e^{" + a * b + "} \\approx " + G.tex(Math.exp(a * b), 4) + "$." });
    },
  });

  gen("ana-epsilon", {
    title: "Konvergenz mit ε",
    make(level, G) {
      const eps = G.pick([0.1, 0.05, 0.02, 0.01, 0.001]);
      if (level === 1) { const n0 = Math.floor(1 / eps + 1e-9) + 1; return num("$a_n = \\tfrac1n$, Grenzwert $0$. Ab welchem $n_0$ gilt $|a_n| < " + G.tex(eps, 3) + "$ für alle $n \\ge n_0$? (kleinstes $n_0$)", n0, { explain: "$\\tfrac1n < " + G.tex(eps, 3) + " \\iff n > " + G.tex(1 / eps, 2) + "$, also $n_0 = " + n0 + "$." }); }
      if (level === 2) { const c = G.int(2, 9), d = G.int(1, 9); let n0 = 1; while (c / (n0 + d) >= eps) n0++; return num("$a_n = \\tfrac{" + c + "}{n + " + d + "}$. Kleinstes $n_0$ mit $|a_n| < " + G.tex(eps, 3) + "$ für alle $n \\ge n_0$?", n0, { explain: "$\\tfrac{" + c + "}{n + " + d + "} < " + G.tex(eps, 3) + " \\iff n > \\tfrac{" + c + "}{" + G.tex(eps, 3) + "} - " + d + " = " + G.tex(c / eps - d, 2) + "$, also $n_0 = " + n0 + "$." }); }
      if (level === 3) {
        const p = G.int(1, 5), r = G.int(1, 5);
        let q = G.int(-5, 9);
        if (q === p * r) q += 1;
        const k = Math.abs(q - p * r);
        let n0 = 1; while (k / (n0 + r) >= eps) n0++;
        return num("$a_n = \\dfrac{" + poly([[p, 1], [q, 0]], "n") + "}{n + " + r + "}$ konvergiert gegen $" + p + "$. Kleinstes $n_0$ mit $|a_n - " + p + "| < " + G.tex(eps, 3) + "$ für alle $n \\ge n_0$?", n0, { hint: "Bring $a_n - " + p + "$ auf einen Bruch: $a_n - " + p + " = \\dfrac{" + (q - p * r) + "}{n + " + r + "}$.", explain: "$|a_n - " + p + "| = \\tfrac{" + k + "}{n + " + r + "} < " + G.tex(eps, 3) + " \\iff n > " + G.tex(k / eps - r, 2) + "$, also $n_0 = " + n0 + "$. Ab dort bleiben alle Glieder im $\\varepsilon$-Streifen, weil der Abstand mit wachsendem $n$ nur kleiner wird." });
      }
      const e2 = G.pick([0.1, 0.05, 0.02]);
      const n0 = Math.floor(1 / (e2 * e2) + 1e-9) + 1;
      return num("$a_n = \\dfrac{(-1)^n}{\\sqrt n}$. Kleinstes $n_0$ mit $|a_n| < " + G.tex(e2, 2) + "$ für alle $n \\ge n_0$?", n0, { explain: "$\\tfrac{1}{\\sqrt n} < " + G.tex(e2, 2) + " \\iff n > \\tfrac{1}{" + G.tex(e2 * e2, 4) + "} = " + G.tex(1 / (e2 * e2), 1) + "$, also $n_0 = " + n0 + "$. Langsame Konvergenz braucht große $n_0$." });
    },
  });

  gen("ana-monoton", {
    title: "Monotone und rekursive Folgen",
    make(level, G) {
      if (level === 1) {
        const c = G.pick([2, 3, 5, 7]), a1 = G.pick([1, 2, 3]);
        const a2 = (a1 + c / a1) / 2, a3 = (a2 + c / a2) / 2;
        return num("$a_1 = " + a1 + "$, $a_{n+1} = \\tfrac12\\left(a_n + \\tfrac{" + c + "}{a_n}\\right)$ (Heron). Berechne $a_3$ (vier Nachkommastellen).", a3, { tolerance: 0.0006, answerText: G.fmt(a3, 4), explain: "$a_2 = " + G.tex(a2, 4) + "$, $a_3 \\approx " + G.tex(a3, 4) + "$. Die Folge konvergiert sehr schnell gegen $\\sqrt{" + c + "} \\approx " + G.tex(Math.sqrt(c), 4) + "$." });
      }
      if (level === 2) {
        const al = G.pick([0.5, 0.25, 0.75, -0.5]), be = G.int(1, 6);
        return num("$a_{n+1} = " + G.tex(al, 2) + "\\,a_n + " + be + "$ konvergiert für jeden Startwert. Gegen welchen Grenzwert? (drei Nachkommastellen)", be / (1 - al), { tolerance: 0.001, answerText: G.fmt(be / (1 - al), 3), hint: "Wenn $a_n \\to a$, dann auch $a_{n+1} \\to a$. Setze in die Rekursion ein.", explain: "$a = " + G.tex(al, 2) + "a + " + be + "$, also $a = \\tfrac{" + be + "}{1 - " + pd(G, al, 2) + "} = " + G.tex(be / (1 - al), 3) + "$. Dass die Folge überhaupt konvergiert, liegt an $|" + G.tex(al, 2) + "| < 1$: Der Abstand zum Grenzwert schrumpft in jedem Schritt um diesen Faktor." });
      }
      if (level === 3) { const n = G.pick([5, 10, 50, 100, 1000]); const v = Math.pow(1 + 1 / n, n); return num("Berechne $\\left(1 + \\tfrac{1}{" + n + "}\\right)^{" + n + "}$ (vier Nachkommastellen).", v, { tolerance: 0.0006, answerText: G.fmt(v, 4), explain: "$\\approx " + G.tex(v, 4) + "$. Die Folge wächst monoton und ist beschränkt, ihr Grenzwert ist $e \\approx 2{,}7183$." }); }
      const pool = [
        ["\\dfrac{n}{n+1}", "streng monoton wachsend", "$\\tfrac{n+1}{n+2} - \\tfrac{n}{n+1} = \\tfrac{1}{(n+1)(n+2)} > 0$."],
        ["\\dfrac{n+1}{n}", "streng monoton fallend", "$\\tfrac{n+1}{n} = 1 + \\tfrac1n$, und $\\tfrac1n$ fällt."],
        ["\\dfrac{(-1)^n}{n}", "nicht monoton", "Das Vorzeichen wechselt ständig."],
        ["n^2 - 6n", "nicht monoton", "Erst fällt sie ($-5, -8, -9$), ab $n = 3$ wächst sie."],
        ["\\dfrac{2^n}{n!}", "monoton fallend", "Für $n \\ge 1$ ist $a_{n+1}/a_n = \\tfrac{2}{n+1} \\le 1$, mit Gleichheit von $a_1$ zu $a_2$."],
      ];
      const [f, ans, why] = G.pick(pool);
      const opts = ["streng monoton wachsend", "streng monoton fallend", "monoton fallend", "nicht monoton"];
      return { type: "choice", md: "Wie verhält sich die Folge $a_n = " + f + "$ für $n \\ge 1$?", shuffle: false, options: opts.map((o) => (o === ans ? { md: o, correct: true } : { md: o })), explain: why };
    },
  });

  gen("ana-teilfolgen", {
    title: "Teilfolgen und Häufungspunkte",
    make(level, G) {
      if (level === 1) { const c = G.int(1, 5), s = G.int(1, 4); return { type: "cloze", md: "$a_n = " + s + "\\cdot(-1)^n + \\tfrac{" + c + "}{n}$. Bestimme den größten und den kleinsten Häufungspunkt.\n\n$\\limsup a_n =$ {{0}} $\\qquad \\liminf a_n =$ {{1}}", blanks: [blank(s), blank(-s)], explain: "Gerade $n$: $" + s + " + \\tfrac{" + c + "}{n} \\to " + s + "$. Ungerade: $-" + s + " + \\tfrac{" + c + "}{n} \\to -" + s + "$." }; }
      if (level === 2) return { type: "cloze", md: "$a_n = \\sin\\left(\\tfrac{n\\pi}{2}\\right)$. Bestimme $\\limsup$ und $\\liminf$.\n\n$\\limsup a_n =$ {{0}} $\\qquad \\liminf a_n =$ {{1}}", blanks: [blank(1), blank(-1)], explain: "Die Folge durchläuft $1, 0, -1, 0, 1, \\dots$ Häufungspunkte sind $-1, 0, 1$." };
      if (level === 3) { const m = G.int(3, 6); return num("Wie viele Häufungspunkte hat $a_n = n \\bmod " + m + "$ (der Rest von $n$ bei Teilung durch $" + m + "$)?", m, { explain: "Jeder Rest $0, \\dots, " + (m - 1) + "$ kommt unendlich oft vor, also $" + m + "$ Häufungspunkte. Konvergent ist die Folge nicht." }); }
      const pool = [
        ["Jede beschränkte Folge in $\\mathbb{R}$ hat eine konvergente Teilfolge.", true, "Satz von Bolzano-Weierstraß."],
        ["Jede Cauchy-Folge in $\\mathbb{Q}$ konvergiert in $\\mathbb{Q}$.", false, "Die Dezimalnäherungen von $\\sqrt2$ sind eine Cauchy-Folge in $\\mathbb{Q}$ ohne Grenzwert in $\\mathbb{Q}$."],
        ["Eine Folge konvergiert genau dann, wenn sie beschränkt ist und genau einen Häufungspunkt hat.", true, "Hätte sie zwei, gäbe es Teilfolgen mit verschiedenen Grenzwerten."],
        ["Jede konvergente Folge ist eine Cauchy-Folge.", true, "$|a_n - a_m| \\le |a_n - a| + |a - a_m| < \\varepsilon$ für große $n, m$."],
        ["Jede Teilfolge einer divergenten Folge divergiert.", false, "$(-1)^n$ divergiert, die Teilfolge der geraden Glieder ist konstant $1$."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- series

  gen("ana-reihen", {
    title: "Reihen",
    make(level, G) {
      if (level === 1) { const p = G.int(1, 4), q = p + G.int(1, 4); return num("Berechne $\\sum_{k=0}^{\\infty} \\left(\\tfrac{" + p + "}{" + q + "}\\right)^k$.", q / (q - p), { tolerance: 0.001, explain: "Geometrische Reihe: $\\dfrac{1}{1 - \\tfrac{" + p + "}{" + q + "}} = \\tfrac{" + q + "}{" + (q - p) + "}$." }); }
      if (level === 2) { const c = G.int(1, 6), m = G.int(1, 4), qq = G.pick([0.5, 0.2, 0.25, -0.5]); const v = (c * Math.pow(qq, m)) / (1 - qq); return num("Berechne $\\sum_{k=" + m + "}^{\\infty} " + (c === 1 ? "" : c + " \\cdot ") + pd(G, qq, 2) + "^k$ (vier Nachkommastellen).", v, { tolerance: 0.0006, answerText: G.fmt(v, 4), hint: "Eine geometrische Reihe, die nicht bei $k = 0$ beginnt: erstes Glied geteilt durch $1 - q$.", explain: "Erstes Glied $" + (c === 1 ? "" : c + " \\cdot ") + pd(G, qq, 2) + "^{" + m + "} = " + G.tex(c * Math.pow(qq, m), 4) + "$, geteilt durch $1 - q = " + G.tex(1 - qq, 2) + "$: $" + G.tex(v, 4) + "$." }); }
      if (level === 3) {
        const d = G.pick([1, 2]);
        if (d === 1) { const n = G.int(5, 50); return num("Berechne $\\sum_{k=1}^{" + n + "} \\dfrac{1}{k(k+1)}$ (vier Nachkommastellen).", n / (n + 1), { tolerance: 0.0006, answerText: G.fmt(n / (n + 1), 4), hint: "$\\tfrac{1}{k(k+1)} = \\tfrac1k - \\tfrac{1}{k+1}$: Fast alles hebt sich weg.", explain: "Teleskopsumme: $1 - \\tfrac{1}{" + (n + 1) + "} = \\tfrac{" + n + "}{" + (n + 1) + "}$. Die ganze Reihe hat den Wert $1$." }); }
        return num("Berechne $\\sum_{k=1}^{\\infty} \\dfrac{1}{k(k+2)}$.", 0.75, { tolerance: 0.001, hint: "$\\tfrac{1}{k(k+2)} = \\tfrac12\\left(\\tfrac1k - \\tfrac{1}{k+2}\\right)$.", explain: "Es bleiben $\\tfrac12(1 + \\tfrac12) = \\tfrac34$ stehen." });
      }
      const pool = [
        ["\\sum \\frac{1}{k}", false, "harmonische Reihe, divergent"], ["\\sum \\frac{1}{k^2}", true, "$p$-Reihe mit $p = 2 > 1$"], ["\\sum \\frac{1}{\\sqrt k}", false, "$p$-Reihe mit $p = \\tfrac12 \\le 1$"],
        ["\\sum \\frac{(-1)^k}{k}", true, "Leibniz-Kriterium"], ["\\sum \\frac{k}{k+1}", false, "Glieder gehen gegen $1$, nicht gegen $0$"], ["\\sum \\frac{1}{2^k}", true, "geometrisch mit $q = \\tfrac12$"],
        ["\\sum \\frac{1}{k \\ln k}\\ (k \\ge 2)", false, "Verdichtungskriterium, divergent"], ["\\sum \\frac{k^2}{2^k}", true, "Quotientenkriterium, Grenzwert $\\tfrac12$"],
      ];
      const items = G.pickN(pool, 5);
      return { type: "sort", md: "Konvergiert die Reihe?", categories: ["konvergent", "divergent"], items: items.map(([t, c, w]) => ({ md: "$" + t + "$", cat: c ? "konvergent" : "divergent" })), explain: items.map(([t, c, w]) => "$" + t + "$: " + w).join(". ") + "." };
    },
  });

  gen("ana-kriterien", {
    title: "Konvergenzkriterien",
    make(level, G) {
      if (level === 1) {
        const kind = G.pick(["exp", "poly"]);
        if (kind === "exp") { const c = G.int(2, 9); return num("Quotientenkriterium für $\\sum \\dfrac{" + c + "^k}{k!}$: Gegen welchen Wert strebt $\\left|\\tfrac{a_{k+1}}{a_k}\\right|$?", 0, { explain: "$\\tfrac{a_{k+1}}{a_k} = \\tfrac{" + c + "}{k+1} \\to 0 < 1$: konvergent, für jedes $" + c + "$." }); }
        const q = G.int(2, 5), m = G.int(1, 4);
        return num("Quotientenkriterium für $\\sum \\dfrac{k^{" + m + "}}{" + q + "^k}$: Gegen welchen Wert strebt $\\left|\\tfrac{a_{k+1}}{a_k}\\right|$? (drei Nachkommastellen)", 1 / q, { tolerance: 0.001, answerText: G.fmt(1 / q, 3), explain: "$\\left(\\tfrac{k+1}{k}\\right)^{" + m + "} \\cdot \\tfrac{1}{" + q + "} \\to \\tfrac{1}{" + q + "} < 1$: konvergent." });
      }
      if (level === 2) {
        const q = G.pick([0.5, 1, 2, 3, 0.25]), m = G.int(1, 3);
        const verdict = q < 1 ? "konvergent" : q > 1 ? "divergent" : "keine Aussage";
        return { type: "choice", md: "Was liefert das Quotientenkriterium für $\\sum k^{" + m + "} \\cdot " + G.tex(q, 2) + "^k$?", shuffle: false, options: ["konvergent", "divergent", "keine Aussage"].map((o) => (o === verdict ? { md: o, correct: true } : { md: o })), explain: "Der Quotient strebt gegen $" + G.tex(q, 2) + "$. " + (q === 1 ? "Bei Grenzwert $1$ entscheidet das Kriterium nicht. Hier divergiert die Reihe, weil die Glieder nicht gegen $0$ gehen." : q < 1 ? "Kleiner als $1$: absolut konvergent." : "Größer als $1$: divergent.") };
      }
      if (level === 3) { const a = G.int(1, 4), b = G.int(a + 1, 7), c = G.int(1, 5); return num("Wurzelkriterium für $\\sum \\left(\\dfrac{" + a + "k}{" + b + "k + " + c + "}\\right)^k$: Gegen welchen Wert strebt $\\sqrt[k]{|a_k|}$? (drei Nachkommastellen)", a / b, { tolerance: 0.001, answerText: G.fmt(a / b, 3), explain: "$\\sqrt[k]{|a_k|} = \\tfrac{" + a + "k}{" + b + "k + " + c + "} \\to \\tfrac{" + a + "}{" + b + "} < 1$: konvergent." }); }
      return {
        type: "match", md: "Welches Kriterium ist für welche Reihe das natürliche Werkzeug?",
        pairs: [["$\\sum \\frac{3^k}{k!}$", "Quotientenkriterium"], ["$\\sum \\left(\\frac{k}{2k+1}\\right)^k$", "Wurzelkriterium"], ["$\\sum \\frac{(-1)^k}{\\sqrt k}$", "Leibniz-Kriterium"], ["$\\sum \\frac{1}{k^2 + k}$", "Majorante $\\sum \\frac{1}{k^2}$"]],
        explain: "Fakultäten und Potenzen: Quotient. Ein $k$-te Potenz als ganzes Glied: Wurzel. Alternierend mit fallenden Beträgen: Leibniz. Rationale Glieder: mit einer bekannten Reihe vergleichen.",
      };
    },
  });

  gen("ana-exp", {
    title: "Exponentialfunktion",
    make(level, G) {
      if (level === 1) { const n = G.int(3, 7); let s = 0, f = 1; for (let k = 0; k <= n; k++) { if (k > 0) f *= k; s += 1 / f; } return num("Berechne die Partialsumme $\\sum_{k=0}^{" + n + "} \\tfrac{1}{k!}$ (vier Nachkommastellen).", s, { tolerance: 0.0006, answerText: G.fmt(s, 4), explain: "$\\approx " + G.tex(s, 4) + "$, schon nahe an $e \\approx 2{,}7183$. Die Reihe konvergiert sehr schnell." }); }
      if (level === 2) { const c = G.pick([2, 5, 10, 0.5, 20]); return num("Löse $e^x = " + G.tex(c, 1) + "$ (vier Nachkommastellen).", Math.log(c), { tolerance: 0.0006, answerText: G.fmt(Math.log(c), 4), explain: "$x = \\ln " + G.tex(c, 1) + " \\approx " + G.tex(Math.log(c), 4) + "$. $\\ln$ ist die Umkehrfunktion von $\\exp$." }); }
      if (level === 3) { const k = G.pick([3, 4, 6]); const eps = Math.pow(10, -k); let n = 0, f = 1; while (2 / (f * (n + 1)) >= eps) { n++; f *= n; } return num("Die Abschätzung $\\left|e - \\sum_{k=0}^{n} \\tfrac{1}{k!}\\right| \\le \\tfrac{2}{(n+1)!}$ ist bekannt. Wie groß muss $n$ mindestens sein, damit der Fehler kleiner als $10^{-" + k + "}$ ist?", n, { explain: "Kleinstes $n$ mit $\\tfrac{2}{(n+1)!} < 10^{-" + k + "}$: $n = " + n + "$, denn $(" + (n + 1) + ")! = " + G.fact(n + 1) + "$." }); }
      const pool = [
        ["Für alle $x, y \\in \\mathbb{R}$ gilt $e^{x+y} = e^x e^y$.", true, "Die Funktionalgleichung, bewiesen mit dem Cauchy-Produkt der Reihen."],
        ["$\\lim_{x \\to \\infty} x^{10} e^{-x} = 0$.", true, "Die Exponentialfunktion wächst schneller als jede Potenz."],
        ["$e^x > 0$ für alle reellen $x$.", true, "$e^x = (e^{x/2})^2 \\ge 0$, und $e^x e^{-x} = 1$ schließt $0$ aus."],
        ["$\\lim_{x \\to 0} \\dfrac{e^x - 1}{x} = 0$.", false, "Der Grenzwert ist $1$, die Ableitung von $\\exp$ an der Stelle $0$."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- continuity

  gen("ana-stetig", {
    title: "Stetigkeit",
    make(level, G) {
      if (level === 1) {
        const a = nz(G, -3, 3), c = nz(G, -2, 3), x0 = G.int(-2, 3);
        const b = c * x0 * x0 - a * x0;
        return num("Für welches $b$ ist $f(x) = \\begin{cases} " + coef(a) + "x + b & x < " + x0 + " \\\\ " + coef(c) + "x^2 & x \\ge " + x0 + " \\end{cases}$ stetig?", b, { hint: "An der Nahtstelle $x = " + x0 + "$ müssen beide Formeln denselben Wert liefern.", explain: "Links- und rechtsseitiger Grenzwert bei $" + x0 + "$ müssen übereinstimmen: $" + a + " \\cdot " + par(x0) + " + b = " + c + " \\cdot " + par(x0) + "^2 = " + c * x0 * x0 + "$, also $b = " + b + "$." });
      }
      if (level === 2) { const a = nz(G, -5, 5); return num("$f(x) = \\dfrac{x^2 - " + a * a + "}{x " + pm(-a) + "}$ für $x \\ne " + a + "$. Welchen Wert muss $f(" + a + ")$ haben, damit $f$ stetig ist?", 2 * a, { hint: "Faktorisiere den Zähler mit der dritten binomischen Formel.", explain: "$\\dfrac{x^2 - " + a * a + "}{x " + pm(-a) + "} = \\dfrac{(x " + pm(-a) + ")(x " + pm(a) + ")}{x " + pm(-a) + "} = x " + pm(a) + " \\to " + 2 * a + "$. Die Lücke ist hebbar: Man stopft sie mit dem Grenzwert." }); }
      if (level === 3) { const m = nz(G, -6, 6), eps = G.pick([0.1, 0.05, 0.01, 0.3]); return num("$f(x) = " + coef(m) + "x + 3$. Wie groß darf $\\delta$ höchstens sein, damit aus $|x - x_0| < \\delta$ stets $|f(x) - f(x_0)| < " + G.tex(eps, 2) + "$ folgt? (vier Nachkommastellen)", eps / Math.abs(m), { tolerance: 0.0001, answerText: G.fmt(eps / Math.abs(m), 4), explain: "$|f(x) - f(x_0)| = " + Math.abs(m) + "|x - x_0|$, also $\\delta = \\tfrac{" + G.tex(eps, 2) + "}{" + Math.abs(m) + "} = " + G.tex(eps / Math.abs(m), 4) + "$. Bei linearen Funktionen hängt $\\delta$ nicht von $x_0$ ab." }); }
      const x0 = G.int(1, 4), eps = G.pick([0.1, 0.05, 0.01]);
      const d = Math.min(1, eps / (2 * x0 + 1));
      return num("Für $f(x) = x^2$ bei $x_0 = " + x0 + "$ gilt für $|x - x_0| < 1$ die Abschätzung $|x^2 - x_0^2| = |x - x_0|\\,|x + x_0| \\le (2|x_0| + 1)\\,|x - x_0|$. Welches $\\delta = \\min(1, \\dots)$ sichert $|f(x) - f(x_0)| < " + G.tex(eps, 2) + "$? (vier Nachkommastellen)", d, { tolerance: 0.0001, answerText: G.fmt(d, 4), explain: "$\\delta = \\min\\left(1, \\tfrac{" + G.tex(eps, 2) + "}{" + (2 * x0 + 1) + "}\\right) = " + G.tex(d, 4) + "$. Das $\\delta$ hängt hier von $x_0$ ab: $x^2$ ist stetig, aber nicht gleichmäßig stetig auf $\\mathbb{R}$." });
    },
  });

  gen("ana-zws", {
    title: "Zwischenwertsatz",
    make(level, G) {
      const r = [G.int(-4, -1), G.int(0, 1), G.int(2, 5)];
      const p = (x) => (x - r[0]) * (x - r[1]) * (x - r[2]);
      const ptex = (r[1] === 0 ? "x" : "") + fac(r[0]) + (r[1] === 0 ? "" : fac(r[1])) + fac(r[2]);
      if (level === 1) {
        let a = 0, b = 0;
        do { a = G.int(-5, 3); b = a + G.int(1, 3); } while (p(a) === 0 || p(b) === 0);
        const change = p(a) * p(b) < 0;
        return tf("$p(x) = " + ptex + "$, $p(" + a + ") = " + p(a) + "$, $p(" + b + ") = " + p(b) + "$. Aus dem Zwischenwertsatz folgt, dass $p$ in $[" + a + ", " + b + "]$ eine Nullstelle hat.", change,
          change ? "Verschiedene Vorzeichen an den Rändern und $p$ stetig: Dazwischen liegt eine Nullstelle." : "Ohne Vorzeichenwechsel liefert der Satz keine Nullstelle. Es kann trotzdem eine geben, er garantiert sie nur nicht.",
          "Die Werte haben kein unterschiedliches Vorzeichen (oder eines ist null), der Satz greift so nicht.");
      }
      if (level === 2) {
        const cube = G.chance(0.4);
        const c = cube ? G.pick([2, 3, 5, 7, 10, 20, 30]) : G.pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19]);
        const f = (x) => (cube ? x * x * x : x * x) - c;
        let a = Math.floor(cube ? Math.cbrt(c) : Math.sqrt(c)), b = a + 1;
        const lines = [];
        for (let s = 0; s < 2; s++) {
          const m = (a + b) / 2;
          lines.push("$f(" + G.tex(m, 2) + ") = " + G.tex(f(m), 4) + (f(m) < 0 ? " < 0" : " > 0") + "$, weiter mit $[" + G.tex(f(a) * f(m) < 0 ? a : m, 2) + ";\\ " + G.tex(f(a) * f(m) < 0 ? m : b, 2) + "]$");
          if (f(a) * f(m) < 0) b = m; else a = m;
        }
        const a0 = Math.floor(cube ? Math.cbrt(c) : Math.sqrt(c));
        return { type: "cloze", md: "Bisektion für $f(x) = x^" + (cube ? 3 : 2) + " - " + c + "$ auf $[" + a0 + ", " + (a0 + 1) + "]$. Welches Intervall bleibt nach **zwei** Halbierungsschritten?\n\n$[$ {{0}} $;$ {{1}} $]$", blanks: [blank(a, 0.001), blank(b, 0.001)], hint: "Berechne $f$ in der Mitte und behalte die Hälfte, an deren Rändern $f$ verschiedene Vorzeichen hat.", explain: lines.join(". ") + ". Die Nullstelle $" + (cube ? "\\sqrt[3]{" + c + "}" : "\\sqrt{" + c + "}") + " \\approx " + G.tex(cube ? Math.cbrt(c) : Math.sqrt(c), 4) + "$ liegt darin." };
      }
      if (level === 3) { const L = G.int(1, 4), eps = G.pick([0.01, 0.001, 0.0001]); let k = 0; while (L / Math.pow(2, k) > eps) k++; return num("Wie viele Bisektionsschritte braucht man auf einem Intervall der Länge $" + L + "$ höchstens, bis eine Nullstelle auf $" + G.tex(eps, 4) + "$ genau eingeschlossen ist (Intervalllänge $\\le " + G.tex(eps, 4) + "$)?", k, { explain: "Nach $k$ Schritten: Länge $\\tfrac{" + L + "}{2^k} \\le " + G.tex(eps, 4) + "$ ab $k = " + k + "$." }); }
      const s = G.int(1, 3), k = G.pick([2, 3, 5]);
      const g = (x) => Math.pow(x, k) + s * x;
      let t = 0;
      do { t = G.int(5, 40); } while ([0, 1, 2, 3, 4].some((x) => g(x) === t));
      let lo = 0; while (g(lo + 1) < t) lo++;
      return { type: "cloze", md: "$g(x) = " + poly([[1, k], [s, 1]], "x") + "$ ist stetig und streng monoton wachsend. Der Zwischenwertsatz garantiert genau eine Lösung von $g(x) = " + t + "$ mit $x \\ge 0$. Zwischen welchen aufeinanderfolgenden ganzen Zahlen liegt sie?\n\n{{0}} $< x <$ {{1}}", blanks: [blank(lo), blank(lo + 1)], hint: "Werte $g$ an den Stellen $0, 1, 2, \\dots$ aus, bis der Wert $" + t + "$ überschritten wird.", explain: "$g(" + lo + ") = " + g(lo) + " < " + t + "$ und $g(" + (lo + 1) + ") = " + g(lo + 1) + " " + (g(lo + 1) === t ? "=" : ">") + " " + t + "$. Weil $g$ stetig ist, nimmt es dazwischen jeden Wert an, also auch $" + t + "$; weil $g$ streng wächst, nur einmal." + (g(lo + 1) === t ? " Hier ist sogar $x = " + (lo + 1) + "$ exakt." : "") };
    },
  });

  // ---------------------------------------------------------------- derivative

  gen("ana-ableitung", {
    title: "Ableiten",
    make(level, G) {
      const x0 = G.int(-2, 3);
      if (level === 1) { const a = nz(G, -3, 4), b = G.int(-5, 5), c = G.int(-5, 5); const v = 3 * a * x0 * x0 + 2 * b * x0 + c; return num("$f(x) = " + poly([[a, 3], [b, 2], [c, 1], [1, 0]], "x") + "$. Berechne $f'(" + x0 + ")$.", v, { hint: "Potenzregel: $(x^n)' = n x^{n-1}$, Konstanten fallen weg.", explain: "$f'(x) = " + poly([[3 * a, 2], [2 * b, 1], [c, 0]], "x") + "$, also $f'(" + x0 + ") = " + v + "$." }); }
      if (level === 2) {
        if (G.chance(0.5)) { const a = G.int(1, 3); const v = Math.exp(a * x0) * (1 + a * x0); const ex = "e^{" + coef(a) + "x}"; return num("$f(x) = x\\," + ex + "$. Berechne $f'(" + x0 + ")$ (vier Nachkommastellen).", v, { tolerance: Math.max(0.0006, Math.abs(v) * 1e-5), answerText: G.fmt(v, 4), hint: "Produktregel und Kettenregel: $(e^{ax})' = a e^{ax}$.", explain: "Produktregel: $f'(x) = " + ex + " + " + coef(a) + "x\\," + ex + " = (1 + " + coef(a) + "x)\\," + ex + "$. An der Stelle $" + x0 + "$: $" + G.tex(v, 4) + "$." }); }
        const a = G.int(1, 4); const v = (a - x0 * x0) / Math.pow(x0 * x0 + a, 2);
        return num("$f(x) = \\dfrac{x}{x^2 + " + a + "}$. Berechne $f'(" + x0 + ")$ (vier Nachkommastellen).", v, { tolerance: 0.0006, answerText: G.fmt(v, 4), hint: "Quotientenregel: $\\left(\\tfrac{u}{v}\\right)' = \\tfrac{u'v - uv'}{v^2}$.", explain: "Quotientenregel: $f'(x) = \\dfrac{(x^2 + " + a + ") - 2x^2}{(x^2 + " + a + ")^2} = \\dfrac{" + a + " - x^2}{(x^2 + " + a + ")^2}$. An der Stelle $" + x0 + "$: $" + G.tex(v, 4) + "$." });
      }
      if (level === 3) { const a = nz(G, -3, 3), b = nz(G, -3, 3), n = G.int(2, 5); const v = n * a * Math.pow(a * x0 + b, n - 1); const inner = poly([[a, 1], [b, 0]], "x"); return num("$f(x) = (" + inner + ")^{" + n + "}$. Berechne $f'(" + x0 + ")$.", v, { hint: "Kettenregel: äußere Ableitung mal innere Ableitung.", explain: "Kettenregel: $f'(x) = " + n + "(" + inner + ")^{" + (n - 1) + "} \\cdot " + par(a) + "$, an der Stelle $" + x0 + "$: $" + v + "$." }); }
      const a = nz(G, -2, 2), b = G.int(-3, 3), c = G.int(-4, 4);
      const f = (x) => a * x * x + b * x + c, d = 2 * a * x0 + b;
      return num("Die Tangente an $f(x) = " + poly([[a, 2], [b, 1], [c, 0]], "x") + "$ im Punkt $x_0 = " + x0 + "$ schneidet die $y$-Achse wo? (y-Achsenabschnitt)", f(x0) - d * x0, { hint: "Tangente: $t(x) = f(x_0) + f'(x_0)(x - x_0)$. Setze $x = 0$ ein.", explain: "$f(" + x0 + ") = " + f(x0) + "$, $f'(" + x0 + ") = " + d + "$. Tangente $t(x) = " + f(x0) + " + " + par(d) + "(x - " + par(x0) + ")$, also $t(0) = " + (f(x0) - d * x0) + "$." });
    },
  });

  gen("ana-mws", {
    title: "Mittelwertsatz",
    make(level, G) {
      if (level === 1) { const a = G.int(-3, 2), b = a + G.int(1, 4); return num("Bestimme $\\xi$ aus dem Mittelwertsatz für $f(x) = x^2$ auf $[" + a + ", " + b + "]$.", (a + b) / 2, { tolerance: 0.001, explain: "$\\tfrac{f(b) - f(a)}{b - a} = a + b = " + (a + b) + " = f'(\\xi) = 2\\xi$, also $\\xi = " + G.tex((a + b) / 2, 1) + "$, die Mitte des Intervalls." }); }
      if (level === 2) { const b = G.int(1, 4); return num("Bestimme $\\xi$ aus dem Mittelwertsatz für $f(x) = x^3$ auf $[0, " + b + "]$ (vier Nachkommastellen).", b / Math.sqrt(3), { tolerance: 0.0006, answerText: G.fmt(b / Math.sqrt(3), 4), explain: "$\\tfrac{" + b + "^3 - 0}{" + b + "} = " + b * b + " = 3\\xi^2$, also $\\xi = \\tfrac{" + b + "}{\\sqrt3} \\approx " + G.tex(b / Math.sqrt(3), 4) + "$." }); }
      if (level === 3) {
        const p = G.int(-3, 0), q = G.int(1, 4);
        return { type: "cloze", md: "$f(x) = " + poly([[2, 3], [-3 * (p + q), 2], [6 * p * q, 1]], "x") + "$. Auf welchem größten Intervall ist $f$ streng monoton **fallend**?\n\n$[$ {{0}} $,$ {{1}} $]$", blanks: [blank(p), blank(q)], hint: "Leite ab und faktorisiere: $f'(x) = " + poly([[6, 2], [-6 * (p + q), 1], [6 * p * q, 0]], "x") + "$.", explain: "$f'(x) = 6" + fac(p) + fac(q) + "$ ist negativ genau zwischen den Nullstellen $" + p + "$ und $" + q + "$. Mit dem Mittelwertsatz folgt aus $f' < 0$, dass $f$ dort streng fällt: $f(y) - f(x) = f'(\\xi)(y - x) < 0$ für $x < y$." };
      }
      const pool = [
        ["Für alle $x, y$ gilt $|\\sin x - \\sin y| \\le |x - y|$.", true, "Mittelwertsatz: $\\sin x - \\sin y = \\cos\\xi\\,(x - y)$ und $|\\cos \\xi| \\le 1$."],
        ["Ist $f'(x) = 0$ für alle $x$ eines Intervalls, dann ist $f$ dort konstant.", true, "$f(x) - f(y) = f'(\\xi)(x - y) = 0$."],
        ["Ist $f$ streng monoton wachsend und differenzierbar, dann ist $f'(x) > 0$ überall.", false, "Gegenbeispiel $f(x) = x^3$ mit $f'(0) = 0$."],
        ["Für $0 < x$ gilt $\\ln(1 + x) < x$.", true, "$\\ln(1 + x) = \\tfrac{x}{1 + \\xi}$ mit $0 < \\xi < x$."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- integral

  gen("ana-integral", {
    title: "Integral",
    make(level, G) {
      if (level === 1) {
        const a = G.int(-2, 1), b = a + G.int(1, 3), c = nz(G, -3, 3), d = G.int(-4, 4), e = G.int(-3, 3);
        const F = (x) => (c * x * x * x) / 3 + (d * x * x) / 2 + e * x;
        const Ftex = [[c, 3, 3], [d, 2, 2], [e, 1, 1]].filter((t) => t[0]).map(([k, p, q], i) => { const f = G.frac(k, q); const neg = f.startsWith("-"); const body = (f.replace("-", "") === "1" ? "" : f.replace("-", "")) + "x" + (p === 1 ? "" : "^" + p); return (i === 0 ? (neg ? "-" : "") : neg ? " - " : " + ") + body; }).join("");
        return num("Berechne $\\int_{" + a + "}^{" + b + "} (" + poly([[c, 2], [d, 1], [e, 0]], "x") + ")\\,dx$ (drei Nachkommastellen).", F(b) - F(a), { tolerance: 0.002, answerText: G.fmt(F(b) - F(a), 3), hint: "Stammfunktion bilden und $F(" + b + ") - F(" + a + ")$ rechnen.", explain: "Stammfunktion $F(x) = " + Ftex + "$, also $F(" + b + ") - F(" + a + ") = " + G.tex(F(b), 4) + " - " + pd(G, F(a), 4) + " \\approx " + G.tex(F(b) - F(a), 3) + "$." });
      }
      if (level === 2) { const n = G.int(2, 10), up = G.chance(0.5); const v = up ? ((n + 1) * (2 * n + 1)) / (6 * n * n) : ((n - 1) * (2 * n - 1)) / (6 * n * n); return num("Berechne die " + (up ? "Obersumme" : "Untersumme") + " von $f(x) = x^2$ auf $[0, 1]$ bei $" + n + "$ gleich breiten Teilintervallen (vier Nachkommastellen).", v, { tolerance: 0.0006, answerText: G.fmt(v, 4), hint: "$f$ wächst, also liegt das " + (up ? "Maximum am rechten" : "Minimum am linken") + " Rand jedes Teilintervalls. Benutze $\\sum k^2 = \\tfrac{m(m+1)(2m+1)}{6}$.", explain: "$\\tfrac{1}{" + n + "}\\sum_{k=" + (up ? 1 : 0) + "}^{" + (up ? n : n - 1) + "} \\left(\\tfrac{k}{" + n + "}\\right)^2 \\approx " + G.tex(v, 4) + "$. Für $n \\to \\infty$ streben Ober- und Untersumme gegen $\\tfrac13$." }); }
      if (level === 3) { const k = G.pick([1, 2, 3]), b = G.pick([1, 2]); const v = (Math.exp(k * b) - 1) / k; return num("Berechne $\\int_0^{" + b + "} e^{" + k + "x}\\,dx$ (vier Nachkommastellen).", v, { tolerance: Math.max(0.0006, v * 1e-5), answerText: G.fmt(v, 4), explain: "$\\left[\\tfrac{1}{" + k + "}e^{" + k + "x}\\right]_0^{" + b + "} = \\tfrac{e^{" + k * b + "} - 1}{" + k + "} \\approx " + G.tex(v, 4) + "$." }); }
      const a = G.int(0, 2), b = a + G.int(1, 3), eps = G.pick([0.1, 0.01, 0.001]);
      const diff = (Math.pow(b, 2) - Math.pow(a, 2)) * (b - a);
      const n = Math.floor(diff / eps + 1e-9) + 1;
      return num("$f(x) = x^2$ ist auf $[" + a + ", " + b + "]$ monoton. Für $n$ gleich breite Teile gilt $O_n - U_n = \\dfrac{(f(" + b + ") - f(" + a + "))(" + b + " - " + a + ")}{n}$. Ab welchem $n$ ist $O_n - U_n < " + G.tex(eps, 3) + "$?", n, { explain: "$\\tfrac{" + diff + "}{n} < " + G.tex(eps, 3) + " \\iff n > " + G.tex(diff / eps, 1) + "$, also $n = " + n + "$. Monotone Funktionen sind deshalb immer integrierbar." });
    },
  });

  gen("ana-taylor", {
    title: "Taylorpolynome",
    make(level, G) {
      if (level === 1) { const a = G.pick([-3, -2, 2, 3]), k = G.int(2, 5); return num("Welchen Koeffizienten hat $x^{" + k + "}$ im Taylorpolynom von $e^{" + a + "x}$ um $0$? (vier Nachkommastellen)", Math.pow(a, k) / G.fact(k), { tolerance: 0.0006, answerText: G.fmt(Math.pow(a, k) / G.fact(k), 4), hint: "Setze $" + a + "x$ in $e^y = \\sum_k \\tfrac{y^k}{k!}$ ein.", explain: "$e^{" + a + "x} = \\sum_k \\tfrac{(" + a + "x)^k}{k!}$, Koeffizient von $x^{" + k + "}$: $\\tfrac{" + par(a) + "^{" + k + "}}{" + k + "!} = " + G.frac(Math.pow(a, k), G.fact(k)) + " \\approx " + G.tex(Math.pow(a, k) / G.fact(k), 4) + "$." }); }
      if (level === 2) {
        const x = G.pick([0.5, 1, 0.2, 0.8]), useSin = G.chance(0.5), n = useSin ? 5 : 4;
        const v = useSin ? x - Math.pow(x, 3) / 6 + Math.pow(x, 5) / 120 : 1 - (x * x) / 2 + Math.pow(x, 4) / 24;
        return num("Berechne das Taylorpolynom vom Grad $" + n + "$ von $" + (useSin ? "\\sin" : "\\cos") + "$ um $0$ an der Stelle $x = " + G.tex(x, 1) + "$ (fünf Nachkommastellen).", v, { tolerance: 0.00002, answerText: G.fmt(v, 5), explain: (useSin ? "$x - \\tfrac{x^3}{6} + \\tfrac{x^5}{120}$" : "$1 - \\tfrac{x^2}{2} + \\tfrac{x^4}{24}$") + " $\\approx " + G.tex(v, 5) + "$, der echte Wert ist $" + G.tex(useSin ? Math.sin(x) : Math.cos(x), 5) + "$." });
      }
      if (level === 3) { const x = G.pick([0.1, 0.2, 0.5]); const v = x - (x * x) / 2 + Math.pow(x, 3) / 3; return num("Taylorpolynom vom Grad $3$ von $\\ln(1 + x)$ um $0$, ausgewertet bei $x = " + G.tex(x, 1) + "$ (fünf Nachkommastellen).", v, { tolerance: 0.00002, answerText: G.fmt(v, 5), explain: "$x - \\tfrac{x^2}{2} + \\tfrac{x^3}{3} \\approx " + G.tex(v, 5) + "$, echt $\\ln " + G.tex(1 + x, 1) + " \\approx " + G.tex(Math.log(1 + x), 5) + "$." }); }
      const n = G.int(3, 8);
      return num("Restglied nach Lagrange: Für $e^x$ auf $[0, 1]$ ist der Fehler des Taylorpolynoms vom Grad $" + n + "$ höchstens $\\dfrac{e}{(" + n + "+1)!}$. Berechne diese Schranke (Dezimalzahl, mindestens drei geltende Ziffern).", Math.E / G.fact(n + 1), { tolerance: (Math.E / G.fact(n + 1)) * 0.01, answerText: G.fmt(Math.E / G.fact(n + 1), 8), explain: "$\\tfrac{e}{" + G.fact(n + 1) + "} \\approx " + G.tex(Math.E / G.fact(n + 1), 8) + "$. Die $(n+1)$-te Ableitung $e^\\xi$ ist auf $[0, 1]$ höchstens $e$." });
    },
  });

  gen("ana-glm", {
    title: "Gleichmäßige Konvergenz",
    make(level, G) {
      if (level === 1) { const a = G.pick([0.5, 0.8, 0.9]), n = G.int(3, 12); return num("$f_n(x) = x^n$ auf $[0, " + G.tex(a, 1) + "]$. Berechne $\\sup_x |f_n(x) - 0|$ für $n = " + n + "$ (vier Nachkommastellen).", Math.pow(a, n), { tolerance: 0.0006, answerText: G.fmt(Math.pow(a, n), 4), explain: "Das Supremum wird am rechten Rand angenommen: $" + G.tex(a, 1) + "^{" + n + "} \\approx " + G.tex(Math.pow(a, n), 4) + "$." }); }
      if (level === 2) { const a = G.pick([0.5, 0.8, 0.9]), eps = G.pick([0.1, 0.01]); let n = 1; while (Math.pow(a, n) >= eps) n++; return num("$f_n(x) = x^n$ auf $[0, " + G.tex(a, 1) + "]$. Ab welchem $n$ liegt $f_n$ überall im $" + G.tex(eps, 2) + "$-Schlauch um die Grenzfunktion $0$?", n, { explain: "$" + G.tex(a, 1) + "^n < " + G.tex(eps, 2) + "$ ab $n = " + n + "$. Weil das für jedes $\\varepsilon$ klappt, konvergiert $f_n$ auf $[0, " + G.tex(a, 1) + "]$ gleichmäßig." }); }
      if (level === 3) { const b = G.int(2, 10), eps = G.pick([0.1, 0.05, 0.01]); const n = Math.floor(b / eps + 1e-9) + 1; return num("$f_n(x) = \\tfrac{x}{n}$ auf $[0, " + b + "]$. Kleinstes $n$ mit $\\sup_x |f_n(x)| < " + G.tex(eps, 2) + "$?", n, { explain: "$\\sup = \\tfrac{" + b + "}{n} < " + G.tex(eps, 2) + "$ ab $n = " + n + "$. Auf ganz $[0, \\infty)$ wäre das Supremum unendlich: dort keine gleichmäßige Konvergenz." }); }
      const pool = [
        ["$f_n(x) = x^n$ konvergiert auf $[0, 1]$ gleichmäßig.", false, "Die Grenzfunktion springt bei $x = 1$ von $0$ auf $1$; ein gleichmäßiger Grenzwert stetiger Funktionen wäre stetig."],
        ["Der gleichmäßige Grenzwert stetiger Funktionen ist stetig.", true, "Mit dem $\\tfrac{\\varepsilon}{3}$-Argument."],
        ["Punktweise Konvergenz folgt aus gleichmäßiger Konvergenz.", true, "Gleichmäßig heißt: dasselbe $n_0$ für alle $x$, insbesondere für jedes einzelne."],
        ["Bei gleichmäßiger Konvergenz auf $[a, b]$ darf man Grenzwert und Integral vertauschen.", true, "$\\left|\\int (f_n - f)\\right| \\le (b - a)\\sup|f_n - f| \\to 0$."],
      ];
      const [md, ans, why] = G.pick(pool);
      return tf(md, ans, why, why);
    },
  });

  // ---------------------------------------------------------------- spot the error
  // Level 1 algebra, 2 derivatives, 3 limits of sequences, 4 an epsilon proof. Exactly one line is wrong;
  // the lines after it continue correctly from the wrong one, so the faulty step is the only jump.

  gen("ana-fehler", {
    title: "Fehler finden",
    make(level, G, params) {
      const kind = (params && params.kind) || ["algebra", "ableitung", "grenzwert", "beweis"][level - 1];
      const kinds = {
        algebra() {
          const a = G.int(2, 7), b = G.int(2, 7);
          const err = G.pick(["A", "B", "C"]);
          const P = err === "A" ? [[1, 2], [a * a, 0]] : [[1, 2], [2 * a, 1], [a * a, 0]];
          const N = err === "B" ? [[-1, 2], [-2 * b, 1], [-b * b, 0]] : [[-1, 2], [2 * b, 1], [-b * b, 0]];
          const mid = (err === "A" ? 0 : 2 * a) + (err === "B" ? -2 * b : 2 * b);
          const shown = err === "C" ? 2 * a - 2 * b : mid;
          const result = poly([[shown, 1], [a * a - b * b, 0]], "x");
          const l2 = poly(P.concat(N), "x").replace(/x\^\{2\} - x\^\{2\}/, "x^{2} - x^{2}");
          return {
            type: "spot",
            md: "Jemand vereinfacht $(x + " + a + ")^2 - (x - " + b + ")^2$. **In welcher Zeile steckt der Fehler?**",
            lines: [
              "$(x + " + a + ")^2 - (x - " + b + ")^2$",
              { md: "$= " + poly(P, "x") + " - (x^2 - " + 2 * b + "x + " + b * b + ")$", why: err === "A" ? "Beim Quadrieren fehlt das gemischte Glied: $(x + " + a + ")^2 = x^2 + " + 2 * a + "x + " + a * a + "$." : "Beide Klammern sind richtig ausmultipliziert." },
              { md: "$= " + l2 + "$", why: err === "B" ? "Das Minus vor der Klammer dreht jedes Vorzeichen: $-(-" + 2 * b + "x) = +" + 2 * b + "x$." : "Das Minus vor der Klammer dreht jedes Vorzeichen, das ist hier richtig." },
              { md: "$= " + result + "$", why: err === "C" ? "Beim Zusammenfassen: $" + 2 * a + "x + " + 2 * b + "x = " + (2 * a + 2 * b) + "x$." : "Die Terme sind richtig zusammengefasst." },
            ],
            answer: { A: 1, B: 2, C: 3 }[err],
            explain: "Richtig ist $(x + " + a + ")^2 - (x - " + b + ")^2 = " + poly([[2 * a + 2 * b, 1], [a * a - b * b, 0]], "x") + "$. Die typischen Fallen: das gemischte Glied der binomischen Formel und die Vorzeichen nach einer Minusklammer.",
          };
        },
        ableitung() {
          const a = G.int(2, 6), b = nz(G, -5, 5), c = G.int(2, 4);
          const err = G.pick(["A", "B", "C"]);
          const lin = poly([[a, 1], [b, 0]], "x");
          const e = "e^{" + c + "x}";
          let l1, l2, l3;
          if (err === "A") { // product rule forgotten: derivative of each factor multiplied
            l1 = "f'(x) = " + a + " \\cdot " + c + e;
            l2 = "= " + a * c + e;
            l3 = "= " + a * c + "\\," + e;
          } else if (err === "B") { // chain rule forgotten in the second summand
            l1 = "f'(x) = " + a + e + " + (" + lin + ")\\," + e;
            l2 = "= (" + a + " + " + lin + ")\\," + e;
            l3 = "= (" + poly([[a, 1], [a + b, 0]], "x") + ")\\," + e;
          } else { // expanding: b not multiplied by c
            l1 = "f'(x) = " + a + e + " + (" + lin + ") \\cdot " + c + e;
            l2 = "= (" + a + " + " + c + "(" + lin + "))\\," + e;
            l3 = "= (" + poly([[a * c, 1], [a + b, 0]], "x") + ")\\," + e;
          }
          const right = poly([[a * c, 1], [a + b * c, 0]], "x");
          return {
            type: "spot",
            md: "Jemand leitet $f(x) = (" + lin + ")\\," + e + "$ ab. **In welcher Zeile steckt der Fehler?**",
            lines: [
              { md: "$" + l1 + "$", why: err === "A" ? "Produktregel: $(uv)' = u'v + uv'$, nicht $u' \\cdot v'$." : err === "B" ? "Kettenregel: $(" + e + ")' = " + c + e + "$, der Faktor $" + c + "$ fehlt." : "Produkt- und Kettenregel sind richtig angewendet." },
              { md: "$" + l2 + "$", why: "Umformung der Zeile davor, in sich richtig." },
              { md: "$" + l3 + "$", why: err === "C" ? "Beim Ausmultiplizieren muss auch $" + b + "$ mit $" + c + "$ multipliziert werden: $" + c + " \\cdot " + par(b) + " = " + c * b + "$." : "Richtig zusammengefasst." },
            ],
            answer: err === "C" ? 2 : 0,
            explain: "Richtig ist $f'(x) = (" + right + ")\\," + e + "$: Produktregel $u'v + uv'$ mit $u = " + lin + "$, $v = " + e + "$ und nach der Kettenregel $v' = " + c + e + "$.",
          };
        },
        grenzwert() {
          const p = G.int(2, 9), q = nz(G, -9, 9), s = G.int(1, 9);
          let r = G.int(2, 9);
          if (r === p) r = p === 9 ? 2 : p + 1;
          const err = G.pick(["A", "B", "C"]);
          const g = G.frac(p, r);
          const num = poly([[p, 2], [q, 1]], "n"), den = poly([[r, 2], [s, 0]], "n");
          const lines = [
            { md: "$\\lim\\limits_{n\\to\\infty} \\dfrac{" + num + "}{" + den + "}$", why: "Die Aufgabe." },
            { md: "$= \\lim\\limits_{n\\to\\infty} \\dfrac{" + p + " " + G.term(q) + "/n}{" + r + " + " + s + "/n^2}$", why: "Zähler und Nenner durch $n^2$ geteilt, richtig." },
            { md: err === "A" ? "$= \\dfrac{" + p + " " + G.term(q) + "}{" + r + "}$" : "$= \\dfrac{" + p + " + 0}{" + r + " + 0}$", why: err === "A" ? "$\\tfrac{" + Math.abs(q) + "}{n}$ geht gegen $0$, nicht gegen $" + Math.abs(q) + "$." : "$\\tfrac{c}{n} \\to 0$ und $\\tfrac{c}{n^2} \\to 0$, richtig." },
            { md: "$= " + (err === "A" ? G.frac(p + q, r) : err === "B" ? G.frac(r, p) : g) + "$", why: err === "B" ? "Zähler und Nenner vertauscht: Der Grenzwert ist $" + g + "$." : "Richtig gekürzt." },
          ];
          if (err === "C") {
            lines[1] = { md: "$= \\lim\\limits_{n\\to\\infty} \\dfrac{" + p + "n " + G.term(q) + "}{" + r + "n + " + s + "/n}$", why: "Hier wurde nur durch $n$ geteilt. Das ist erlaubt, führt aber nicht zum Ziel." };
            lines[2] = { md: "$= \\dfrac{\\infty}{\\infty} = 1$", why: "$\\tfrac{\\infty}{\\infty}$ ist kein Wert: Man darf nicht $1$ einsetzen. Man muss weiter umformen, bis keine unbestimmte Form bleibt." };
            lines[3] = { md: "$= 1$", why: "Folgt aus der Zeile davor." };
          }
          return {
            type: "spot",
            md: "Gesucht ist der Grenzwert der Folge $a_n = \\dfrac{" + num + "}{" + den + "}$. **In welcher Zeile steckt der Fehler?**",
            lines,
            answer: err === "B" ? 3 : 2,
            explain: "Durch die höchste Potenz $n^2$ teilen: Alle Terme mit $n$ im Nenner gehen gegen $0$, es bleibt $\\tfrac{" + p + "}{" + r + "}$" + (G.gcd(p, r) > 1 ? " $= " + g + "$" : "") + ".",
          };
        },
        beweis() {
          const a = G.int(2, 9);
          const err = G.pick(["A", "B", "C"]);
          return {
            type: "spot",
            md: "Ein Beweis, dass die Folge $\\left(\\tfrac{" + a + "}{n}\\right)_{n \\in \\N}$ gegen $0$ konvergiert. **In welcher Zeile steckt der Fehler?**",
            lines: [
              { md: "Sei $\\eps > 0$ beliebig. Gesucht ist $n_0$ mit $\\abs{\\tfrac{" + a + "}{n} - 0} < \\eps$ für alle $n \\ge n_0$.", why: "Genau das verlangt die Definition der Konvergenz." },
              { md: err === "A" ? "Es gilt $\\tfrac{" + a + "}{n} < \\eps \\iff n < \\tfrac{" + a + "}{\\eps}$." : "Es gilt $\\tfrac{" + a + "}{n} < \\eps \\iff n > \\tfrac{" + a + "}{\\eps}$.", why: err === "A" ? "Beim Umstellen nach $n$ dreht sich die Ungleichung nicht: Aus $\\tfrac{" + a + "}{n} < \\eps$ folgt $n > \\tfrac{" + a + "}{\\eps}$." : "Mit $n$ und $\\eps$ multipliziert, beide positiv: richtig." },
              { md: err === "B" ? "Wähle $n_0 = \\eps$." : "Nach dem archimedischen Prinzip gibt es ein $n_0 \\in \\N$ mit $n_0 > \\tfrac{" + a + "}{\\eps}$.", why: err === "B" ? "$n_0$ muss größer als $\\tfrac{" + a + "}{\\eps}$ sein, sonst klappt der nächste Schritt nicht. Bei kleinem $\\eps$ wird $n_0$ groß, nicht klein." : "Archimedes liefert eine natürliche Zahl über jeder Schranke." },
              { md: err === "C" ? "Für $n \\ge n_0$ gilt dann $n \\le \\tfrac{" + a + "}{\\eps}$, also $\\tfrac{" + a + "}{n} < \\eps$." : "Für $n \\ge n_0$ gilt $n > \\tfrac{" + a + "}{\\eps}$, also $\\tfrac{" + a + "}{n} < \\eps$. $\\square$", why: err === "C" ? "Aus $n \\ge n_0 > \\tfrac{" + a + "}{\\eps}$ folgt $n > \\tfrac{" + a + "}{\\eps}$, nicht $n \\le$." : "Die Kette $n \\ge n_0 > \\tfrac{" + a + "}{\\eps}$ trägt den Schluss." },
            ],
            answer: { A: 1, B: 2, C: 3 }[err],
            explain: "Das Muster jedes $\\eps$-Beweises: Bedingung nach $n$ umstellen, $n_0$ passend wählen (hier mit Archimedes), dann für alle $n \\ge n_0$ nachrechnen.",
          };
        },
      };
      return (kinds[kind] || kinds.algebra)();
    },
  });
})();
