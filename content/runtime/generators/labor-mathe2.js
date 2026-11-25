/* Build tasks for the mathematics labs of the second round. Every task carries goal.list (the checklist), goal.when and
 * goal.solve (the sample solution).
 *   lab-grenzwert  ε-N for sequences and ε-δ for functions (grenzlabor)
 *   lab-folgen     sequences and series built by profile (grenzlabor)
 *   lab-logik      formulas with a given truth table, equivalent rewrites, tautologies (logiklabor)
 *   lab-abbildung  2×2 matrices as maps: reflections, rotations, determinants, projections, eigenvectors (matrix-transform)
 *   lab-raum       planes through points, positions of lines, parallel planes, perpendicular lines (raumlabor)
 *   lab-prozess    transition matrices: completing, absorbing states, stationary distributions, Leslie (prozesslabor)
 *   lab-urne       urns built for given probabilities (urnenlabor) */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const cn = (x) => String(+(+x).toFixed(6));
  function goal(list, solve) { return { when: list.map((x) => "(" + x.when + ")").join(" && "), list, solve }; }
  function task(widget, label, md, params, g, hint, explain) { return { type: "widget", widget, label, md, params, goal: g, hint, explain }; }

  // ---------------------------------------------------------------- limits
  /** Least N with |a_n - L| < eps for all n >= N (checked like the lab does). */
  function leastN(term, L, eps) {
    const c = LW.labMath.compile(term, ["n"], {});
    let last = 0;
    for (let n = 1; n <= 2000; n++) if (!(Math.abs(c.f(n) - L) < eps)) last = n;
    return last + 1;
  }
  gen("lab-grenzwert", {
    title: "ε-N und ε-δ",
    make(level, G) {
      if (level <= 2) {
        let term, tex, L, eps, N;
        for (let t = 0; t < 40; t++) {
          [term, tex, L] = G.pick([["(2n+1)/(n+3)", "\\frac{2n+1}{n+3}", 2], ["1/n", "\\frac1n", 0], ["(n-1)/n", "\\frac{n-1}{n}", 1], ["3+2/n^2", "3 + \\frac{2}{n^2}", 3], ["(-1)^n/n", "\\frac{(-1)^n}{n}", 0], ["(4n-1)/(2n)", "\\frac{4n-1}{2n}", 2]]);
          eps = level === 1 ? G.pick([0.5, 0.2, 0.25]) : G.pick([0.1, 0.05, 0.04, 0.02]);
          N = leastN(term, L, eps);
          if (N >= 2 && N <= 60) break;
        }
        return task("grenzlabor", "Grenzwertlabor",
          "Die Folge $a_n = " + tex + "$ konvergiert gegen $" + L + "$. Stelle $\\varepsilon = " + G.tex(eps) + "$ ein und ziehe $N$ auf das **kleinste** $N$, ab dem alle Folgenglieder im $\\varepsilon$-Schlauch liegen.",
          { mode: "folge", term, editable: false, eps: 0.5, N: 1, nmax: 60 },
          goal([{ when: "abs(eps - " + eps + ") < 0.001", show: "$\\varepsilon = " + G.tex(eps) + "$" }, { when: "ok == 1", show: "alle $a_n$ mit $n \\ge N$ im Schlauch" }, { when: "N == Nmin", show: "kleinstes solches $N$" }], { eps, N }),
          "Rechne $|a_n - " + L + "| < " + G.tex(eps) + "$ nach $n$ um, oder schiebe $N$, bis kein rotes Glied mehr rechts von der Linie liegt.",
          "Ab $N = " + N + "$ gilt $|a_n - " + L + "| < " + G.tex(eps) + "$ für alle $n \\ge N$. Genau das verlangt die Definition: zu jedem $\\varepsilon$ ein solches $N$.");
      }
      if (level === 3) {
        const [term, tex, x0, epsv] = G.pick([["x^2", "x^2", 2, 0.5], ["x^2", "x^2", 1, 0.3], ["sqrt(x)", "\\sqrt x", 4, 0.2], ["3x+1", "3x + 1", 1, 0.6], ["1/x", "\\frac1x", 1, 0.25]]);
        const c = LW.labMath.compile(term, ["x"], {});
        const Lv = c.f(x0);
        const works = (d) => { for (let i = 1; i <= 400; i++) { const h = (d * i) / 401; for (const x of [x0 - h, x0 + h]) { const y = c.f(x); if (!isFinite(y) || Math.abs(y - Lv) >= epsv) return false; } } return true; };
        let lo = 0, hi = 1.5;
        if (works(hi)) lo = hi; else for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (works(m)) lo = m; else hi = m; }
        const dSol = Math.floor(lo * 0.95 * 1000) / 1000;
        return task("grenzlabor", "Grenzwertlabor",
          "$f(x) = " + tex + "$ ist stetig in $x_0 = " + x0 + "$. Stelle $\\varepsilon = " + G.tex(epsv) + "$ ein und finde ein **möglichst großes** $\\delta$: mindestens 80 % des größten, das noch passt.",
          { mode: "funktion", term, editable: false, x0, eps: 1, delta: 1.2 },
          goal([{ when: "abs(eps - " + epsv + ") < 0.001", show: "$\\varepsilon = " + G.tex(epsv) + "$" }, { when: "works == 1", show: "$|f(x) - f(x_0)| < \\varepsilon$ für alle $|x - x_0| < \\delta$" }, { when: "delta >= 0.8 * dmax", show: "$\\delta$ mindestens 80 % des größten" }], { eps: epsv, delta: dSol }),
          "Verkleinere $\\delta$, bis der Graph im Streifen nur noch grün ist; dann taste dich wieder hinauf.",
          "Das größte passende $\\delta$ ist hier etwa $" + G.tex(lo, 3) + "$. Es hängt von $\\varepsilon$ und von $x_0$ ab; Stetigkeit heißt nur, dass es zu jedem $\\varepsilon$ irgendein $\\delta > 0$ gibt.");
      }
      return task("grenzlabor", "Grenzwertlabor",
        "$f(x) = \\operatorname{sgn}(x)$ springt bei $x_0 = 0$. Zeige die **Unstetigkeit**: Wähle ein $\\varepsilon$, zu dem **kein** $\\delta$ passt.",
        { mode: "funktion", term: "sign(x)", editable: false, x0: 0, eps: 1.5, epsMax: 2, delta: 0.5 },
        goal([{ when: "nodelta == 1", show: "zu diesem $\\varepsilon$ passt kein $\\delta$" }], { eps: 0.5 }),
        "Wie weit springt $f$? Ein $\\varepsilon$ kleiner als der Sprung lässt keinem $\\delta$ eine Chance.",
        "Mit $\\varepsilon \\le 1$ gibt es in jeder Umgebung von 0 Stellen mit $|f(x) - f(0)| = 1 \\ge \\varepsilon$. Also ist $f$ in 0 unstetig: Die Verneinung der Definition ist »es gibt ein $\\varepsilon$, sodass für alle $\\delta$ ...«.");
    },
  });

  gen("lab-folgen", {
    title: "Folgen und Reihen bauen",
    make(level, G) {
      if (level === 1) {
        const c = G.int(-3, 4), a1 = c + G.pick([2, 3, 4, -2, -3]);
        const d = a1 - c;
        return task("grenzlabor", "Folgenlabor", "Baue eine Folge mit $a_1 = " + a1 + "$, die gegen $" + c + "$ konvergiert.",
          { mode: "folge", term: "n", eps: 0.1, N: 1 },
          goal([{ when: "abs(a1 - " + a1 + ") < 1e-9", show: "$a_1 = " + a1 + "$" }, { when: "conv == 1 && abs(L - " + c + ") < 0.001", show: "Grenzwert $" + c + "$" }], { term: c + (d < 0 ? "-" : "+") + Math.abs(d) + "/n" }),
          "Ein Ansatz: $a_n = c + \\frac{d}{n}$; bei $n = 1$ ist das $c + d$.",
          "Zum Beispiel $a_n = " + c + (d < 0 ? " - " : " + ") + "\\frac{" + Math.abs(d) + "}{n}$: Der Bruch geht gegen 0, bei $n = 1$ ergibt sich $" + a1 + "$.");
      }
      if (level === 2) {
        if (G.chance(0.5)) {
          const c = G.int(1, 4), a1 = c + G.int(2, 5);
          return task("grenzlabor", "Folgenlabor", "Baue eine **streng monoton fallende** Folge mit $a_1 = " + a1 + "$ und Grenzwert $" + c + "$.",
            { mode: "folge", term: "n", eps: 0.1, N: 1 },
            goal([{ when: "abs(a1 - " + a1 + ") < 1e-9", show: "$a_1 = " + a1 + "$" }, { when: "mono == -1", show: "streng monoton fallend" }, { when: "conv == 1 && abs(L - " + c + ") < 0.001", show: "Grenzwert $" + c + "$" }], { term: c + "+" + (a1 - c) + "/n" }),
            "Ein positiver Term, der kleiner wird, über dem Grenzwert.", "Zum Beispiel $a_n = " + c + " + \\frac{" + (a1 - c) + "}{n}$.");
        }
        return task("grenzlabor", "Folgenlabor", "Baue eine Folge, die gegen $0$ konvergiert, aber **nicht monoton** ist.",
          { mode: "folge", term: "1/n", eps: 0.1, N: 1 },
          goal([{ when: "conv == 1 && abs(L) < 0.001", show: "Grenzwert 0" }, { when: "mono == 0", show: "nicht monoton" }], { term: "(-1)^n/n" }),
          "Ein Vorzeichenwechsel verhindert Monotonie.", "Zum Beispiel $a_n = \\frac{(-1)^n}{n}$: Die Glieder springen zwischen positiv und negativ und werden dabei kleiner.");
      }
      if (level === 3) {
        const S = G.pick([1, 2, 3, 4, 6]), q = G.pick([0.5, 0.25]);
        const a = +(S * (1 - q) / q).toFixed(6);
        return task("grenzlabor", "Folgenlabor", "Baue eine **geometrische Reihe** $\\sum_{k \\ge 1} a_k$ mit der Summe $" + S + "$.",
          { mode: "reihe", term: "1/k", nmax: 40 },
          goal([{ when: "sconv == 1", show: "die Reihe konvergiert" }, { when: "abs(S - " + S + ") < 0.002", show: "Summe $" + S + "$" }], { term: String(a).replace(".", ",") + "*" + String(q).replace(".", ",") + "^k" }),
          "$\\sum_{k \\ge 1} a q^k = \\frac{aq}{1 - q}$ für $|q| < 1$.",
          "Mit $q = " + G.tex(q) + "$ ist $\\frac{aq}{1 - q} = " + S + "$ für $a = " + G.tex(a) + "$: $a_k = " + G.tex(a) + " \\cdot " + G.tex(q) + "^k$.");
      }
      return task("grenzlabor", "Folgenlabor", "Baue eine Reihe, deren Glieder gegen $0$ gehen, die aber trotzdem **divergiert**.",
        { mode: "reihe", term: "1/k^2", nmax: 40 },
        goal([{ when: "conv == 1 && abs(L) < 0.001", show: "die Glieder gehen gegen 0" }, { when: "sconv == 0", show: "die Partialsummen wachsen unbeschränkt" }], { term: "1/k" }),
        "Die harmonische Reihe ist das Standardbeispiel.",
        "$\\sum \\frac1k$ divergiert, obwohl $\\frac1k \\to 0$: Je $2^m$ Glieder ab $2^m$ tragen zusammen mindestens $\\frac12$ bei. $a_k \\to 0$ ist notwendig, nicht hinreichend.");
    },
  });

  // ---------------------------------------------------------------- logic
  const COLS2 = [["p \\land q", "p∧q"], ["p \\lor q", "p∨q"], ["p \\rightarrow q", "p→q"], ["p \\leftrightarrow q", "p↔q"], ["\\neg p", "¬p"], ["p \\land \\neg q", "p∧¬q"], ["\\neg(p \\land q)", "¬(p∧q)"], ["(p \\lor q) \\land \\neg(p \\land q)", "(p∨q)∧¬(p∧q)"]];
  function columnOf(src, vars) {
    const L = LW.labLogic, t = L.parseLogic(src), rows = L.rowsFor(vars);
    return rows.map((env) => L.evalLogic(t, env));
  }
  const colNum = (vals) => vals.reduce((a, x) => a * 2 + (x ? 1 : 0), 0);
  function tableMd(vars, vals) {
    const rows = LW.labLogic.rowsFor(vars);
    return "\n\n| " + vars.map((v) => "$" + v + "$").join(" | ") + " | $\\varphi$ |\n|" + vars.map(() => "---").join("|") + "|---|\n" +
      rows.map((env, k) => "| " + vars.map((v) => (env[v] ? "w" : "f")).join(" | ") + " | **" + (vals[k] ? "w" : "f") + "** |").join("\n");
  }
  gen("lab-logik", {
    title: "Formeln bauen",
    make(level, G) {
      if (level === 1 || level === 4) {
        const vars = level === 1 ? ["p", "q"] : ["p", "q", "r"];
        const [tex, src] = level === 1 ? G.pick(COLS2) : G.pick([["(p \\land q) \\lor (p \\land r) \\lor (q \\land r)", "(p∧q)∨(p∧r)∨(q∧r)"], ["(p \\rightarrow q) \\land (q \\rightarrow r)", "(p→q)∧(q→r)"], ["p \\land (q \\lor r)", "p∧(q∨r)"], ["(p \\lor q) \\rightarrow r", "(p∨q)→r"]]);
        const vals = columnOf(src, vars);
        return task("logiklabor", "Logiklabor", "Baue eine Formel mit genau dieser Wahrheitstafel:" + tableMd(vars, vals),
          { vars, formula: "" }, goal([{ when: "col == " + colNum(vals), show: "Spalte stimmt mit der Tafel überein" }], { formula: src }),
          "Lies die Zeilen mit »w« ab: Jede ergibt eine Konjunktion, ihre Disjunktion ist eine passende Formel (disjunktive Normalform). Kürzer geht es oft mit ∧, ∨, → direkt.",
          "Eine passende Formel ist $" + tex + "$. Jede andere mit derselben Spalte ist dazu äquivalent.");
      }
      if (level === 2) {
        const t = G.pick([
          { tgt: "p→q", tex: "p \\rightarrow q", ban: "imp", banTxt: "ohne $\\rightarrow$", sol: "¬p∨q", sTex: "\\neg p \\lor q" },
          { tgt: "p↔q", tex: "p \\leftrightarrow q", ban: "iff", banTxt: "ohne $\\leftrightarrow$", sol: "(p→q)∧(q→p)", sTex: "(p \\rightarrow q) \\land (q \\rightarrow p)" },
          { tgt: "¬(p∧q)", tex: "\\neg(p \\land q)", ban: "and", banTxt: "ohne $\\land$", sol: "¬p∨¬q", sTex: "\\neg p \\lor \\neg q" },
          { tgt: "¬(p∨q)", tex: "\\neg(p \\lor q)", ban: "or", banTxt: "ohne $\\lor$", sol: "¬p∧¬q", sTex: "\\neg p \\land \\neg q" },
        ]);
        return task("logiklabor", "Logiklabor", "Forme $" + t.tex + "$ äquivalent um, **" + t.banTxt + "**. Die Zielspalte steht in der Tafel daneben.",
          { vars: ["p", "q"], formula: t.tgt, target: t.tgt },
          goal([{ when: "aeq == 1", show: "äquivalent zu $" + t.tex + "$" }, { when: t.ban + " == 0", show: t.banTxt }], { formula: t.sol }),
          "De Morgan: $\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q$; Implikation: $p \\rightarrow q \\equiv \\neg p \\lor q$.",
          "Zum Beispiel $" + t.sTex + "$.");
      }
      const t = G.pick([
        { md: "Baue eine **Tautologie** mit $p$ und $q$, die genau ein $\\rightarrow$ enthält.", list: [{ when: "taut == 1", show: "Tautologie" }, { when: "imp == 1", show: "genau ein $\\rightarrow$" }, { when: "nvars == 2", show: "$p$ und $q$ kommen vor" }], sol: "p∧q→p", ex: "Zum Beispiel $p \\land q \\rightarrow p$: Ist die Prämisse wahr, ist es auch $p$." },
        { md: "Baue eine **Kontradiktion**, in der $p$ und $q$ vorkommen.", list: [{ when: "contra == 1", show: "in jeder Zeile falsch" }, { when: "nvars == 2", show: "$p$ und $q$ kommen vor" }], sol: "p∧¬p∧q", ex: "Zum Beispiel $p \\land \\neg p \\land q$." },
        { md: "Baue eine Formel mit $p$ und $q$, die in **genau einer** Zeile falsch ist und $\\neg$ nicht benutzt.", list: [{ when: "col == 14 || col == 13 || col == 11 || col == 7", show: "genau eine Zeile falsch" }, { when: "not == 0", show: "ohne $\\neg$" }, { when: "nvars == 2", show: "$p$ und $q$ kommen vor" }], sol: "p∨q", ex: "Zum Beispiel $p \\lor q$ (falsch nur bei f, f) oder $p \\rightarrow q$ (falsch nur bei w, f)." },
      ]);
      return task("logiklabor", "Logiklabor", t.md, { vars: ["p", "q"], formula: "" }, goal(t.list, { formula: t.sol }), "Probiere aus und beobachte die Tafel.", t.ex);
    },
  });

  // ---------------------------------------------------------------- linear maps (matrix-transform)
  const MAPS1 = [
    { name: "die Spiegelung an der $x$-Achse", m: [[1, 0], [0, -1]] }, { name: "die Spiegelung an der $y$-Achse", m: [[-1, 0], [0, 1]] },
    { name: "die Spiegelung an der Geraden $y = x$", m: [[0, 1], [1, 0]] }, { name: "die Drehung um $90°$ gegen den Uhrzeigersinn", m: [[0, -1], [1, 0]] },
    { name: "die Drehung um $180°$", m: [[-1, 0], [0, -1]] }, { name: "die Streckung um den Faktor 2 in $x$-Richtung", m: [[2, 0], [0, 1]] },
    { name: "die Scherung, die $e_2$ auf $\\binom{1}{1}$ schickt und $e_1$ festhält", m: [[1, 1], [0, 1]] },
  ];
  const vec = (G, a, b) => "\\binom{" + G.tex(a) + "}{" + G.tex(b) + "}";
  gen("lab-abbildung", {
    title: "Lineare Abbildungen bauen",
    make(level, G) {
      if (level === 1) {
        const t = G.pick(MAPS1), m = t.m;
        return task("matrix-transform", "Abbildungslabor", "Ziehe die Bilder der Einheitsvektoren so, dass die Matrix " + t.name + " darstellt.",
          { matrix: [[1, 0], [0, 1]], range: 3 },
          goal([{ when: "a == " + m[0][0] + " && c == " + m[1][0], show: "Bild von $e_1$: $" + vec(G, m[0][0], m[1][0]) + "$" }, { when: "b == " + m[0][1] + " && d == " + m[1][1], show: "Bild von $e_2$: $" + vec(G, m[0][1], m[1][1]) + "$" }], { matrix: m }),
          "Die Spalten der Matrix sind die Bilder von $e_1$ und $e_2$.", "$A = \\begin{pmatrix} " + m[0][0] + " & " + m[0][1] + " \\\\ " + m[1][0] + " & " + m[1][1] + " \\end{pmatrix}$.");
      }
      if (level === 2) {
        const dt = G.pick([-2, -1, 2, 3, 0.5]);
        return task("matrix-transform", "Abbildungslabor", "Baue eine Abbildung mit $\\det A = " + G.tex(dt) + "$. " + (dt < 0 ? "Die Orientierung kippt dann." : "Flächen werden mit $" + G.tex(dt) + "$ multipliziert."),
          { matrix: [[1, 0], [0, 1]], range: 3 },
          goal([{ when: "abs(det - " + cn(dt) + ") < 1e-9", show: "$\\det A = " + G.tex(dt) + "$" }, { when: "b != 0 || c != 0", show: "keine reine Diagonalmatrix" }], { matrix: [[dt, 1], [0, 1]] }),
          "Die Determinante ist die orientierte Fläche des Parallelogramms aus den beiden Spalten.", "Zum Beispiel $\\begin{pmatrix} " + G.tex(dt) + " & 1 \\\\ 0 & 1 \\end{pmatrix}$: Dreiecksmatrix, Determinante gleich Produkt der Diagonale.");
      }
      if (level === 3) {
        return task("matrix-transform", "Abbildungslabor", "Baue eine **Projektion**: $A^2 = A$, aber weder die Nullabbildung noch die Identität.",
          { matrix: [[1, 0], [0, 1]], range: 3, showEigen: true },
          goal([{ when: "abs(a*a + b*c - a) < 1e-9 && abs(a*b + b*d - b) < 1e-9 && abs(c*a + d*c - c) < 1e-9 && abs(c*b + d*d - d) < 1e-9", show: "$A^2 = A$" }, { when: "abs(det) < 1e-9 && abs(tr - 1) < 1e-9", show: "nicht null, nicht Identität (Spur 1, Determinante 0)" }], { matrix: [[1, 0], [0, 0]] }),
          "Eine Projektion hat die Eigenwerte 0 und 1: Spur 1, Determinante 0.",
          "Zum Beispiel $\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}$ (auf die $x$-Achse) oder $\\begin{pmatrix} 1 & 1 \\\\ 0 & 0 \\end{pmatrix}$ (schräg). Was schon im Bild liegt, bleibt fest.");
      }
      const l1 = G.pick([2, 3]), l2 = G.pick([1, -1]);
      const a = (l1 + l2) / 2, b = (l1 - l2) / 2;
      return task("matrix-transform", "Abbildungslabor", "Baue die Abbildung mit dem Eigenvektor $\\binom{1}{1}$ zum Eigenwert $" + l1 + "$ und dem Eigenvektor $\\binom{1}{-1}$ zum Eigenwert $" + l2 + "$.",
        { matrix: [[1, 0], [0, 1]], range: 4, showEigen: true },
        goal([{ when: "abs(a + b - " + l1 + ") < 1e-9 && abs(c + d - " + l1 + ") < 1e-9", show: "$A\\binom11 = " + l1 + "\\binom11$" }, { when: "abs(a - b - " + l2 + ") < 1e-9 && abs(c - d + " + l2 + ") < 1e-9", show: "$A\\binom{1}{-1} = " + l2 + "\\binom{1}{-1}$" }], { matrix: [[a, b], [b, a]] }),
        "Schreibe $A\\binom11$ und $A\\binom{1}{-1}$ mit den Einträgen $a, b, c, d$ aus.", "$A = \\begin{pmatrix} " + G.tex(a) + " & " + G.tex(b) + " \\\\ " + G.tex(b) + " & " + G.tex(a) + " \\end{pmatrix}$: symmetrisch, die Eigenvektoren stehen senkrecht.");
    },
  });

  // ---------------------------------------------------------------- space
  const NORMALS = [[1, 2, 2], [2, 1, -2], [1, 0, 1], [0, 1, 1], [1, 1, 1], [2, -1, 2], [1, -2, 2]];
  const tex3 = (G, v) => "(" + v.map((x) => G.tex(x)).join(" \\mid ") + ")";
  gen("lab-raum", {
    title: "Geraden und Ebenen im Raum",
    make(level, G) {
      if (level === 1) {
        // a plane with small normal, three integer points on it
        for (let t = 0; t < 200; t++) {
          const n = G.pick(NORMALS), d = G.int(-4, 6);
          const pts = [];
          for (let k = 0; k < 60 && pts.length < 3; k++) {
            const x = G.int(-3, 3), y = G.int(-3, 3);
            if (n[2] === 0) continue;
            const z = (d - n[0] * x - n[1] * y) / n[2];
            if (Number.isInteger(z) && Math.abs(z) <= 4 && !pts.some((q) => q[0] === x && q[1] === y)) pts.push([x, y, z]);
          }
          if (pts.length < 3) continue;
          const [A, B, C] = pts;
          const cr = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
          if (Math.hypot(...cr) < 1e-9) continue;
          return task("raumlabor", "Raumlabor", "Stelle die Ebene $E$ in Koordinatenform $n_1x + n_2y + n_3z = d$ so ein, dass sie durch $A" + tex3(G, A) + "$, $B" + tex3(G, B) + "$ und $C" + tex3(G, C) + "$ geht.",
            { objects: [{ id: "A", type: "punkt", p: A }, { id: "B", type: "punkt", p: B }, { id: "C", type: "punkt", p: C }, { id: "E", type: "ebene", n: [0, 0, 1], d: 0, edit: true }], range: 5 },
            goal([{ when: "on_A_E == 1", show: "$A$ liegt in $E$" }, { when: "on_B_E == 1", show: "$B$ liegt in $E$" }, { when: "on_C_E == 1", show: "$C$ liegt in $E$" }], { objects: [{ id: "E", n, d }] }),
            "Ein Normalenvektor steht senkrecht auf $\\vec{AB}$ und $\\vec{AC}$: das Kreuzprodukt. $d$ erhältst du durch Einsetzen von $A$.",
            "$\\vec n = (" + n.join(", ") + ")$ (oder ein Vielfaches) und $d = \\vec n \\cdot \\vec A = " + d + "$: $E\\colon " + n[0] + "x " + (n[1] < 0 ? "- " + -n[1] : "+ " + n[1]) + "y " + (n[2] < 0 ? "- " + -n[2] : "+ " + n[2]) + "z = " + d + "$.");
        }
      }
      if (level === 2) {
        let gp, gu, want, sol;
        for (let t = 0; t < 60; t++) {
          gp = [G.int(-2, 2), G.int(-2, 2), G.int(-1, 2)]; gu = G.pick([[1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 2, 0], [2, 1, 1]]);
          want = G.pick([1, 2, 4]);
          if (want === 2) sol = { p: [gp[0], gp[1], gp[2] + 2], u: gu.map((x) => 2 * x) };
          else if (want === 1) sol = { p: [gp[0] + gu[0], gp[1] + gu[1], gp[2] + gu[2] + 1], u: [0, 0, 1] };
          else sol = { p: [gp[0], gp[1], gp[2] + 2], u: [gu[1], -gu[0], 1] };
          // the sample must do what it should, and stay inside the steppers' range
          const rel = LW.labSpace.relate({ type: "gerade", p: gp, u: gu }, { type: "gerade", p: sol.p, u: sol.u }).lage;
          if (rel === want && sol.p.concat(sol.u).every((x) => Math.abs(x) <= 9)) break;
        }
        const words = { 1: "sich **schneiden**", 2: "**parallel** und verschieden sind", 4: "**windschief** sind" };
        return task("raumlabor", "Raumlabor", "Die Gerade $g\\colon \\vec x = " + tex3(G, gp) + " + t\\," + tex3(G, gu) + "$ ist fest. Stelle $h$ so ein, dass $g$ und $h$ " + words[want] + ".",
          { objects: [{ id: "g", type: "gerade", p: gp, u: gu }, { id: "h", type: "gerade", p: gp, u: gu, edit: true }], range: 5 },
          goal([{ when: "lage_g_h == " + want, show: "$g$ und $h$ " + words[want].replace(/\*\*/g, "") }], { objects: [{ id: "h", p: sol.p, u: sol.u }] }),
          want === 2 ? "Gleiche Richtung, anderer Stützpunkt außerhalb von $g$." : want === 1 ? "Ein Stützpunkt auf $g$ und eine andere Richtung." : "Nicht parallel und kein gemeinsamer Punkt: Verschiebe den Stützpunkt aus der Ebene von $g$ und $h$ heraus.",
          "Parallel: Richtungsvektoren sind Vielfache. Sonst schneiden sie sich genau dann, wenn $\\vec q - \\vec p$, $\\vec u$ und $\\vec v$ linear abhängig sind; sonst sind sie windschief.");
      }
      if (level === 3) {
        const n = G.pick([[1, 2, 2], [2, 1, 2], [2, -2, 1]]), d = G.int(-3, 3), sgn = G.pick([1, -1]);
        const d2 = d + sgn * 9;
        return task("raumlabor", "Raumlabor", "Stelle die Ebene $F$ so ein, dass sie **parallel** zu $E\\colon " + n[0] + "x " + (n[1] < 0 ? "- " + -n[1] : "+ " + n[1]) + "y " + (n[2] < 0 ? "- " + -n[2] : "+ " + n[2]) + "z = " + d + "$ liegt und von ihr den **Abstand 3** hat.",
          { objects: [{ id: "E", type: "ebene", n, d }, { id: "F", type: "ebene", n: n.slice(), d, edit: true }], range: 6 },
          goal([{ when: "lage_E_F == 2", show: "$F$ parallel zu $E$" }, { when: "abs(dist_E_F - 3) < 1e-6", show: "Abstand 3" }], { objects: [{ id: "F", n, d: d2 }] }),
          "Gleicher Normalenvektor; der Abstand zweier paralleler Ebenen ist $\\frac{|d_1 - d_2|}{|\\vec n|}$.",
          "$|\\vec n| = 3$, also muss sich $d$ um $3 \\cdot 3 = 9$ ändern: $F\\colon \\dots = " + d2 + "$ (oder auf der anderen Seite).");
      }
      const n = G.pick([[1, 2, 2], [2, 1, -2], [1, 0, 1], [0, 1, 1]]), S = [G.int(-2, 2), G.int(-2, 2), 0];
      S[2] = n[2] !== 0 ? 0 : 0;
      const d = n[0] * S[0] + n[1] * S[1] + n[2] * S[2];
      return task("raumlabor", "Raumlabor", "Stelle die Gerade $h$ so ein, dass sie die Ebene $E\\colon " + n[0] + "x " + (n[1] < 0 ? "- " + -n[1] : "+ " + n[1]) + "y " + (n[2] < 0 ? "- " + -n[2] : "+ " + n[2]) + "z = " + d + "$ im Punkt $S" + tex3(G, S) + "$ **senkrecht** schneidet.",
        { objects: [{ id: "E", type: "ebene", n, d }, { id: "h", type: "gerade", p: [0, 0, 3], u: [1, 0, 0], edit: true }], range: 5 },
        goal([{ when: "lage_h_E == 1 && abs(sx_h_E - " + S[0] + ") < 1e-6 && abs(sy_h_E - " + S[1] + ") < 1e-6 && abs(sz_h_E - " + S[2] + ") < 1e-6", show: "Schnittpunkt $S" + tex3(G, S) + "$" }, { when: "abs(ang_h_E - 90) < 1e-6", show: "senkrecht: Winkel $90°$" }], { objects: [{ id: "h", p: S, u: n }] }),
        "Eine Lotgerade hat den Normalenvektor der Ebene als Richtung.", "$h\\colon \\vec x = " + tex3(G, S) + " + t\\,(" + n.join(", ") + ")$.");
    },
  });

  // ---------------------------------------------------------------- processes
  const matVec = (M, v) => M.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
  gen("lab-prozess", {
    title: "Übergangsmatrizen",
    make(level, G) {
      if (level === 1) {
        // a column-stochastic 3x3 matrix with one entry per column to fill in
        for (let t = 0; t < 50; t++) {
          const M = [0, 1, 2].map(() => [0, 0, 0]);
          for (let j = 0; j < 3; j++) { const a = G.int(1, 10) * 0.05, b = G.int(1, 10) * 0.05; if (a + b >= 0.95) break; M[0][j] = a; M[1][j] = b; M[2][j] = +(1 - a - b).toFixed(2); }
          if (M.some((row) => row.some((x) => !(x > 0)))) continue;
          const miss = [0, 1, 2].map(() => G.int(0, 2));
          const start = M.map((row, i) => row.map((x, j) => (miss[j] === i ? 0 : +x.toFixed(2))));
          return task("prozesslabor", "Prozesslabor", "Ergänze die fehlenden Einträge (je einer pro Spalte), sodass eine **stochastische Matrix** entsteht: Jede Spalte gibt die Wahrscheinlichkeiten an, von einem Zustand in die anderen zu wechseln.",
            { states: ["A", "B", "C"], M: start, v0: [1, 0, 0], edit: miss.map((i, j) => "m" + (i + 1) + (j + 1)) },
            goal([{ when: "valid == 1", show: "alle Spaltensummen 1" }], { M: M.map((row) => row.map((x) => +x.toFixed(2))) }),
            "Die Summe jeder Spalte ist 1: Von jedem Zustand geht es mit Sicherheit irgendwohin.",
            "Fehlender Eintrag = 1 minus die Summe der übrigen Einträge seiner Spalte.");
        }
      }
      if (level === 2) {
        const M = [[0.6, 0.2, 0], [0.3, 0.5, 0], [0.1, 0.3, 1]].map((r) => r.slice());
        const sh = G.pick([[0.6, 0.3, 0.1, 0.2, 0.5, 0.3], [0.7, 0.2, 0.1, 0.1, 0.6, 0.3], [0.5, 0.3, 0.2, 0.2, 0.4, 0.4]]);
        M[0][0] = sh[0]; M[1][0] = sh[1]; M[2][0] = sh[2]; M[0][1] = sh[3]; M[1][1] = sh[4]; M[2][1] = sh[5];
        let v = [1, 0, 0], nmin = 0;
        for (let k = 1; k <= 30; k++) { v = matVec(M, v); if (v[2] > 0.5) { nmin = k; break; } }
        return task("prozesslabor", "Prozesslabor", "Zustand C ist **absorbierend**: Wer dort ist, bleibt. Alle starten in A. Nach wie vielen Schritten ist zum ersten Mal **mehr als die Hälfte** in C?",
          { states: ["A", "B", "C"], M, v0: [1, 0, 0], n: 0, edit: [] },
          goal([{ when: "v3 > 0.5", show: "mehr als die Hälfte in C" }, { when: "n == " + nmin, show: "kleinstes solches $n$" }], { n: nmin }),
          "Erhöhe $n$ und beobachte den Balken von C.", "Nach $n = " + nmin + "$ Schritten liegt der Anteil von C über 0,5; langfristig landen alle in C.");
      }
      if (level === 3) {
        const [a, b] = G.pick([[0.2, 0.3], [0.1, 0.15], [0.4, 0.6], [0.3, 0.2], [0.25, 0.25], [0.15, 0.35]]);
        const s1 = b / (a + b);
        return task("prozesslabor", "Prozesslabor", "Baue eine Übergangsmatrix für zwei Zustände, deren **stationäre Verteilung** $(" + G.tex(s1, 3) + ";\\ " + G.tex(1 - s1, 3) + ")$ ist.",
          { states: ["A", "B"], M: [[1, 0], [0, 1]], v0: [1, 0], edit: "all" },
          goal([{ when: "valid == 1", show: "Spaltensummen 1" }, { when: "abs(s1 - " + cn(s1) + ") < 1e-6", show: "stationär: A mit Anteil $" + G.tex(s1, 3) + "$" }], { M: [[+(1 - a).toFixed(2), b], [a, +(1 - b).toFixed(2)]] }),
          "Im Gleichgewicht fließt gleich viel von A nach B wie zurück: $s_A \\cdot m_{21} = s_B \\cdot m_{12}$.",
          "Mit $m_{21} = " + G.tex(a) + "$ und $m_{12} = " + G.tex(b) + "$: $s_A = \\frac{m_{12}}{m_{12} + m_{21}} = " + G.tex(s1, 3) + "$. Jedes Paar im selben Verhältnis passt.");
      }
      // survival rates and birth rates on the 0,05 grid with f2 s1 + f3 s1 s2 = 1
      const [s1, s2, f2, f3] = G.pick([[0.5, 0.4, 1.2, 2], [0.5, 0.4, 1.6, 1], [0.4, 0.5, 1.5, 2], [0.5, 0.5, 1, 2], [0.5, 0.5, 1.5, 1]]);
      return task("prozesslabor", "Prozesslabor", "Ein **Leslie-Modell** mit drei Altersklassen: Überlebensraten $" + G.tex(s1) + "$ und $" + G.tex(s2) + "$, Nachkommen nur aus Klasse 2 und 3. Stelle die Geburtenraten so ein, dass der Bestand **langfristig konstant** bleibt (größter Eigenwert 1).",
        { states: ["1", "2", "3"], M: [[0, 0.5, 0.5], [s1, 0, 0], [0, s2, 0]], v0: [100, 0, 0], n: 20, edit: ["m12", "m13"], mode: "population", step: 0.05 },
        goal([{ when: "abs(lambda - 1) < 0.01", show: "Wachstumsfaktor $\\lambda = 1$" }], { M: [[0, f2, f3], [s1, 0, 0], [0, s2, 0]] }),
        "Bei $\\lambda = 1$ ersetzt jedes Neugeborene im Laufe seines Lebens genau sich selbst: $f_2 s_1 + f_3 s_1 s_2 = 1$.",
        "Zum Beispiel $f_2 = " + G.tex(f2) + "$ und $f_3 = " + f3 + "$: $" + G.tex(f2) + " \\cdot " + G.tex(s1) + " + " + f3 + " \\cdot " + G.tex(s1) + " \\cdot " + G.tex(s2) + " = 1$.");
    },
  });

  // ---------------------------------------------------------------- urns
  gen("lab-urne", {
    title: "Urnen bauen",
    make(level, G) {
      const U = () => LW.labUrn;
      if (level === 1) {
        const N = G.pick([5, 8, 10, 12]), r = G.int(1, N - 1), g = G.gcd(r, N);
        return task("urnenlabor", "Zufallslabor", "Baue eine Urne mit **" + N + " Kugeln**, aus der beim einmaligen Ziehen mit Wahrscheinlichkeit $" + G.frac(r, N) + "$ eine rote kommt.",
          { r: 1, b: 1, colors: 2, k: 1, repl: true, event: { type: "genau", color: 0, j: 1 } },
          goal([{ when: "N == " + N, show: N + " Kugeln" }, { when: "abs(P - " + cn(r / N) + ") < 1e-6", show: "$P(\\text{rot}) = " + G.frac(r, N) + "$" }], { r, b: N - r }),
          "Laplace: günstige durch mögliche.", "$" + r + "$ rote und $" + (N - r) + "$ blaue Kugeln." + (g > 1 ? " Gekürzt ist das $" + G.frac(r, N) + "$." : ""));
      }
      if (level === 2) {
        const [r, b] = G.pick([[2, 2], [3, 3], [4, 5], [3, 2], [5, 3], [2, 4]]), N = r + b, Pv = (r * (r - 1)) / (N * (N - 1));
        const num = r * (r - 1), den = N * (N - 1), gg = G.gcd(num, den);
        return task("urnenlabor", "Zufallslabor", "Aus der Urne werden **zwei Kugeln ohne Zurücklegen** gezogen. Baue eine Urne (rot und blau), bei der **beide rot** mit Wahrscheinlichkeit $" + G.frac(num / gg, den / gg) + "$ sind.",
          { r: 1, b: 1, colors: 2, k: 2, repl: false, event: { type: "alle", color: 0 } },
          goal([{ when: "abs(P - " + cn(Pv) + ") < 1e-6", show: "$P(\\text{beide rot}) = " + G.frac(num / gg, den / gg) + "$" }], { r, b }),
          "Pfadregel: $\\frac{r}{N} \\cdot \\frac{r-1}{N-1}$.", "Zum Beispiel $" + r + "$ rote und $" + b + "$ blaue: $\\frac{" + r + "}{" + N + "} \\cdot \\frac{" + (r - 1) + "}{" + (N - 1) + "} = " + G.frac(num, den) + "$. Es kann mehrere Urnen geben.");
      }
      if (level === 3) {
        const T = G.pick([0.9, 0.8, 0.95]), N = 10, k = 3;
        let rmin = N;
        for (let r = 1; r <= N; r++) if (1 - Math.pow(1 - r / N, k) >= T - 1e-12) { rmin = r; break; }
        return task("urnenlabor", "Zufallslabor", "Drei Züge **mit Zurücklegen** aus einer Urne mit **10 Kugeln**: Mit mindestens $" + G.tex(T) + "$ Wahrscheinlichkeit soll **mindestens eine rote** kommen, mit **möglichst wenigen** roten Kugeln.",
          { r: 1, b: 9, colors: 2, k: 3, repl: true, event: { type: "mind", color: 0, j: 1 } },
          goal([{ when: "N == 10", show: "10 Kugeln" }, { when: "P >= " + cn(T - 1e-9), show: "$P(\\text{mind. eine rote}) \\ge " + G.tex(T) + "$" }, { when: "r == " + rmin, show: "möglichst wenige rote" }], { r: rmin, b: N - rmin }),
          "Gegenereignis: keine rote in drei Zügen, $(1 - \\frac{r}{10})^3$.", "$1 - (1 - \\frac{r}{10})^3 \\ge " + G.tex(T) + "$ gilt zuerst bei $r = " + rmin + "$.");
      }
      const [c, N] = G.pick([[[2, 2, 2], 6], [[3, 2, 2], 7], [[4, 2, 2], 8]]);
      const Pv = c.reduce((s, x) => s + x * (x - 1), 0) / (N * (N - 1));
      const num = c.reduce((s, x) => s + x * (x - 1), 0), den = N * (N - 1), gg = G.gcd(num, den);
      return task("urnenlabor", "Zufallslabor", "Eine Urne mit **" + N + " Kugeln in drei Farben**; zwei werden **ohne Zurücklegen** gezogen. Baue sie so, dass beide mit Wahrscheinlichkeit $" + G.frac(num / gg, den / gg) + "$ **gleichfarbig** sind.",
        { r: N - 2, b: 1, g: 1, colors: 3, k: 2, repl: false, event: { type: "gleich" } },
        goal([{ when: "N == " + N, show: N + " Kugeln" }, { when: "abs(P - " + cn(Pv) + ") < 1e-6", show: "$P(\\text{gleichfarbig}) = " + G.frac(num / gg, den / gg) + "$" }], { r: c[0], b: c[1], g: c[2] }),
        "$P(\\text{gleichfarbig}) = \\sum_{\\text{Farben}} \\frac{c}{N} \\cdot \\frac{c - 1}{N - 1}$.", "Zum Beispiel " + c.join(", ") + " Kugeln: $\\frac{" + c.map((x) => x + " \\cdot " + (x - 1)).join(" + ") + "}{" + N + " \\cdot " + (N - 1) + "} = " + G.frac(num, den) + "$.");
    },
  });
})();
