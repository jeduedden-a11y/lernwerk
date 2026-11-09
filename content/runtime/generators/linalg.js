/* Task generators for Lineare Algebra I. Integer-friendly constructions, so the numbers stay pleasant while changing every time. */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  const vec = (a) => "\\begin{pmatrix}" + a.join(" \\\\ ") + "\\end{pmatrix}";
  const mat = (M) => "\\begin{pmatrix}" + M.map((r) => r.join(" & ")).join(" \\\\ ") + "\\end{pmatrix}";
  const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const mulMV = (M, v) => M.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
  const mulMM = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  function rankOf(M0) {
    const M = M0.map((r) => r.slice());
    let rank = 0;
    for (let c = 0; c < M[0].length && rank < M.length; c++) {
      let piv = -1;
      for (let i = rank; i < M.length; i++) if (Math.abs(M[i][c]) > 1e-9) { piv = i; break; }
      if (piv < 0) continue;
      [M[rank], M[piv]] = [M[piv], M[rank]];
      for (let i = rank + 1; i < M.length; i++) { const f = M[i][c] / M[rank][c]; M[i] = M[i].map((v, j) => v - f * M[rank][j]); }
      rank++;
    }
    return rank;
  }
  const nz = (G, a, b) => { let v = 0; while (v === 0) v = G.int(a, b); return v; };
  const blank = (v, tol) => ({ accept: [v], numeric: true, tolerance: tol == null ? 1e-6 : tol, placeholder: "Zahl" });
  /** a x + b y + c z without zero terms and without coefficients 1. */
  function lin(coefs, names) {
    let s = "";
    coefs.forEach((c, i) => {
      if (c === 0) return;
      const abs = Math.abs(c), body = (abs === 1 ? "" : abs) + names[i];
      s += s ? (c < 0 ? " - " : " + ") + body : (c < 0 ? "-" : "") + body;
    });
    return s || "0";
  }
  function numeric(md, answer, o) { return Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl" }, o || {}); }
  function unimodular(G) {
    // integer matrix with determinant 1 or -1, so its inverse is an integer matrix too
    const a = G.int(1, 3), b = G.int(-2, 2);
    const P = [[1, 0], [0, 1]];
    const shearA = [[1, b], [0, 1]], shearB = [[1, 0], [a, 1]];
    let M = mulMM(shearA, shearB);
    if (G.chance(0.5)) M = mulMM(M, [[0, 1], [1, 0]]);
    return M.map((r, i) => r.map((v, j) => v + 0 * P[i][j]));
  }

  // ---------------------------------------------------------------- groups and fields

  gen("la-modular", {
    title: "Rechnen modulo n",
    make(level, G) {
      if (level === 1) {
        const n = G.int(5, 12), a = G.int(2, n + 9), b = G.int(2, n + 9), mult = G.chance(0.5);
        const v = mult ? (a * b) % n : (a + b) % n;
        return numeric("Berechne in $\\mathbb{Z}/" + n + "\\mathbb{Z}$: $\\ " + a + (mult ? " \\cdot " : " + ") + b + " \\equiv\\ ?\\pmod{" + n + "}$ (Zahl von $0$ bis $" + (n - 1) + "$)", v, {
          explain: "$" + a + (mult ? " \\cdot " : " + ") + b + " = " + (mult ? a * b : a + b) + " = " + Math.floor((mult ? a * b : a + b) / n) + " \\cdot " + n + " + " + v + "$, also Rest $" + v + "$.",
        });
      }
      if (level === 2) {
        const p = G.pick([5, 7, 11, 13]), a = G.int(2, p - 1);
        let inv = 1; while ((a * inv) % p !== 1) inv++;
        return numeric("Bestimme das **multiplikative Inverse** von $" + a + "$ in $\\mathbb{Z}/" + p + "\\mathbb{Z}$.", inv, {
          hint: "Gesucht ist $x$ mit $" + a + " \\cdot x \\equiv 1 \\pmod{" + p + "}$. Probiere $x = 1, 2, 3, \\dots$",
          explain: "$" + a + " \\cdot " + inv + " = " + a * inv + " = " + Math.floor((a * inv) / p) + " \\cdot " + p + " + 1$, also ist $" + inv + "$ das Inverse.",
        });
      }
      if (level === 3) {
        const n = G.pick([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15]);
        const prime = isPrime(n);
        let pair = null;
        if (!prime) { for (let a = 2; a < n && !pair; a++) for (let b = a; b < n; b++) if ((a * b) % n === 0) { pair = [a, b]; break; } }
        return {
          type: "truefalse",
          md: "$\\mathbb{Z}/" + n + "\\mathbb{Z}$ mit Addition und Multiplikation modulo $" + n + "$ ist ein **Körper**.",
          answer: prime,
          whyNot: prime ? null : "$" + pair[0] + " \\cdot " + pair[1] + " \\equiv 0 \\pmod{" + n + "}$: Es gibt Nullteiler.",
          explain: prime
            ? "$" + n + "$ ist eine Primzahl. Dann hat jedes $a \\not\\equiv 0$ ein Inverses, weil $\\operatorname{ggT}(a, " + n + ") = 1$ ist."
            : "In einem Körper ist ein Produkt nur dann $0$, wenn ein Faktor $0$ ist. Hier gilt $" + pair[0] + " \\cdot " + pair[1] + " \\equiv 0$, also ist $" + pair[0] + "$ nicht invertierbar.",
        };
      }
      const p = G.pick([7, 11, 13]), a = G.int(2, p - 1), b = G.int(1, p - 1);
      let inv = 1; while ((a * inv) % p !== 1) inv++;
      const x = (b * inv) % p;
      return numeric("Löse in $\\mathbb{Z}/" + p + "\\mathbb{Z}$ die Gleichung $" + a + "x = " + b + "$ (Zahl von $0$ bis $" + (p - 1) + "$).", x, {
        hint: "Multipliziere beide Seiten mit dem Inversen von $" + a + "$.",
        explain: "Das Inverse von $" + a + "$ ist $" + inv + "$. Also $x = " + inv + " \\cdot " + b + " = " + inv * b + " \\equiv " + x + "$. Probe: $" + a + " \\cdot " + x + " = " + a * x + " \\equiv " + b + "$.",
      });
    },
  });

  const STRUCTURES = [
    { md: "$(\\mathbb{Z}, +)$", group: true, ab: true, why: "Abgeschlossen, assoziativ, neutrales Element $0$, Inverses $-a$." },
    { md: "$(\\mathbb{N}, +)$", group: false, fails: "Inverse", why: "Zu $3$ gibt es kein $x \\in \\mathbb{N}$ mit $3 + x = 0$." },
    { md: "$(\\mathbb{Q} \\setminus \\{0\\}, \\cdot)$", group: true, ab: true, why: "Neutrales Element $1$, Inverses $\\tfrac1a$." },
    { md: "$(\\mathbb{Z} \\setminus \\{0\\}, \\cdot)$", group: false, fails: "Inverse", why: "$2$ hat kein ganzzahliges Inverses." },
    { md: "$(\\mathbb{R}, -)$", group: false, fails: "Assoziativität", why: "$(1 - 2) - 3 = -4$, aber $1 - (2 - 3) = 2$." },
    { md: "$(\\{1, -1\\}, \\cdot)$", group: true, ab: true, why: "Abgeschlossen, $1$ neutral, jedes Element ist sein eigenes Inverses." },
    { md: "$(\\{1, 2, 3, 4, 5\\}, \\cdot \\bmod 6)$", group: false, fails: "Abgeschlossenheit", why: "$2 \\cdot 3 \\equiv 0 \\pmod 6$ liegt nicht in der Menge." },
    { md: "$(\\{1, \\dots, 6\\}, \\cdot \\bmod 7)$", group: true, ab: true, why: "$7$ ist prim, jedes Element hat ein Inverses modulo $7$." },
    { md: "die invertierbaren $2 \\times 2$-Matrizen mit der Matrizenmultiplikation", group: true, ab: false, why: "Das Produkt invertierbarer Matrizen ist invertierbar, $E$ ist neutral, $A^{-1}$ invers. Aber $AB \\ne BA$ im Allgemeinen." },
    { md: "alle $2 \\times 2$-Matrizen mit der Matrizenmultiplikation", group: false, fails: "Inverse", why: "Die Nullmatrix und alle Matrizen mit $\\det = 0$ haben kein Inverses." },
    { md: "die geraden Zahlen mit $+$", group: true, ab: true, why: "Summen gerader Zahlen sind gerade, $0$ ist gerade, $-a$ auch." },
    { md: "die ungeraden Zahlen mit $+$", group: false, fails: "Abgeschlossenheit", why: "$1 + 1 = 2$ ist gerade." },
    { md: "die Drehungen der Ebene um den Ursprung mit Hintereinanderausführung", group: true, ab: true, why: "Zwei Drehungen ergeben eine Drehung, die Drehung um $0$ ist neutral, die Drehung zurück invers." },
    { md: "$(\\mathbb{R}_{>0}, \\cdot)$", group: true, ab: true, why: "Produkte positiver Zahlen sind positiv, $\\tfrac1a > 0$." },
  ];

  gen("la-gruppe", {
    title: "Gruppenaxiome",
    make(level, G) {
      if (level <= 2) {
        const s = G.pick(level === 1 ? STRUCTURES.slice(0, 7) : STRUCTURES);
        return { type: "truefalse", md: s.md + " ist eine Gruppe.", answer: s.group, whyNot: s.group ? null : s.why, explain: s.why };
      }
      if (level === 3) {
        const s = G.pick(STRUCTURES.filter((x) => x.group));
        return { type: "truefalse", md: s.md + " ist eine **abelsche** (kommutative) Gruppe.", answer: s.ab, whyNot: s.ab ? null : s.why, explain: s.why + (s.ab ? " Die Verknüpfung ist außerdem kommutativ." : "") };
      }
      const s = G.pick(STRUCTURES.filter((x) => !x.group));
      const axioms = ["Abgeschlossenheit", "Assoziativität", "neutrales Element", "Inverse"];
      return {
        type: "choice",
        md: s.md + " ist keine Gruppe. Welches Axiom ist **zuerst** verletzt, wenn man sie in der Reihenfolge Abgeschlossenheit, Assoziativität, neutrales Element, Inverse prüft?",
        options: G.options({ md: s.fails }, axioms.filter((a) => a !== s.fails).map((a) => ({ md: a, why: "Dieses Axiom ist hier erfüllt oder kommt erst später an die Reihe." }))),
        shuffle: false,
        explain: s.why,
      };
    },
  });

  // ---------------------------------------------------------------- subspaces

  gen("la-unterraum", {
    title: "Unterraum oder nicht",
    make(level, G) {
      const cases = [];
      const m = nz(G, -3, 3), c = nz(G, -4, 4);
      const a = nz(G, -3, 3), b = nz(G, -3, 3), cc = nz(G, -3, 3), d = nz(G, -5, 5);
      const k = G.int(1, 4);
      cases.push({ lvl: 1, md: "$\\{(x, y) \\in \\mathbb{R}^2 : y = " + m + "x\\}$", sub: true, why: "Eine Gerade durch den Ursprung: Summen und Vielfache bleiben auf ihr." });
      cases.push({ lvl: 1, md: "$\\{(x, y) \\in \\mathbb{R}^2 : y = " + m + "x " + (c < 0 ? "- " + -c : "+ " + c) + "\\}$", sub: false, why: "Der Nullvektor liegt nicht darin, denn $0 \\ne " + m + " \\cdot 0 " + (c < 0 ? "- " + -c : "+ " + c) + "$." });
      cases.push({ lvl: 1, md: "$\\{(x, y, z) : " + lin([a, b, cc], ["x", "y", "z"]) + " = 0\\}$", sub: true, why: "Lösungsmenge eines homogenen Gleichungssystems, also der Kern einer linearen Abbildung." });
      cases.push({ lvl: 1, md: "$\\{(x, y, z) : " + lin([a, b, cc], ["x", "y", "z"]) + " = " + d + "\\}$", sub: false, why: "Der Nullvektor erfüllt die Gleichung nicht, weil rechts $" + d + " \\ne 0$ steht." });
      cases.push({ lvl: 2, md: "$\\{(x, y) \\in \\mathbb{R}^2 : x \\cdot y = 0\\}$", sub: false, why: "$(1, 0)$ und $(0, 1)$ liegen darin, ihre Summe $(1, 1)$ nicht." });
      cases.push({ lvl: 2, md: "$\\{(x, y) \\in \\mathbb{R}^2 : x \\ge 0\\}$", sub: false, why: "$(1, 0)$ liegt darin, $(-1) \\cdot (1, 0) = (-1, 0)$ nicht." });
      cases.push({ lvl: 2, md: "$\\{(x, y) \\in \\mathbb{R}^2 : y = x^2\\}$", sub: false, why: "$(1, 1)$ liegt darin, $2 \\cdot (1, 1) = (2, 2)$ nicht, denn $2 \\ne 4$." });
      cases.push({ lvl: 2, md: "$\\{(x, y, z) : x = " + k + "y \\text{ und } z = 0\\}$", sub: true, why: "Schnitt zweier Unterräume, eine Gerade durch den Ursprung." });
      cases.push({ lvl: 3, md: "$\\{p \\in \\mathbb{R}[x]_{\\le 2} : p(" + k + ") = 0\\}$", sub: true, why: "$(p + q)(" + k + ") = 0 + 0$ und $(\\lambda p)(" + k + ") = \\lambda \\cdot 0$." });
      cases.push({ lvl: 3, md: "$\\{p \\in \\mathbb{R}[x]_{\\le 2} : p(0) = " + k + "\\}$", sub: false, why: "Das Nullpolynom hat $p(0) = 0 \\ne " + k + "$." });
      cases.push({ lvl: 3, md: "$\\{f : \\mathbb{R} \\to \\mathbb{R} : f(1) = f(" + (k + 1) + ")\\}$", sub: true, why: "Die Bedingung $f(1) - f(" + (k + 1) + ") = 0$ ist linear." });
      cases.push({ lvl: 3, md: "$\\{f : \\mathbb{R} \\to \\mathbb{R} : f(x) \\ge 0 \\text{ für alle } x\\}$", sub: false, why: "Mit $f$ liegt $-f$ nicht mehr darin." });
      cases.push({ lvl: 3, md: "$\\{A \\in \\mathbb{R}^{2 \\times 2} : A = A^T\\}$", sub: true, why: "$(A + B)^T = A^T + B^T$ und $(\\lambda A)^T = \\lambda A^T$." });
      cases.push({ lvl: 3, md: "$\\{A \\in \\mathbb{R}^{2 \\times 2} : \\det A = 0\\}$", sub: false, why: "$\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix} + \\begin{pmatrix}0&0\\\\0&1\\end{pmatrix} = E$ hat $\\det E = 1$." });
      if (level < 4) {
        const c1 = G.pick(cases.filter((x) => x.lvl === level));
        return { type: "truefalse", md: c1.md + " ist ein Untervektorraum.", answer: c1.sub, whyNot: c1.sub ? null : c1.why, explain: c1.why + " Prüfschema: Nullvektor enthalten, abgeschlossen unter Addition und unter Vielfachen." };
      }
      const four = G.pickN(cases.filter((x) => x.lvl >= 2), 4);
      if (!four.some((x) => x.sub)) four[0] = G.pick(cases.filter((x) => x.sub && x.lvl >= 2));
      return {
        type: "multi",
        md: "Welche dieser Mengen sind Untervektorräume?",
        options: four.map((x) => ({ md: x.md, correct: x.sub, why: x.why })),
        explain: "Drei Prüfungen genügen: Enthält die Menge den Nullvektor? Ist sie abgeschlossen unter Addition und unter skalaren Vielfachen? Oft scheitert es schon an der ersten.",
      };
    },
  });

  // ---------------------------------------------------------------- linear combinations, bases

  gen("la-linkomb", {
    title: "Linearkombination",
    make(level, G) {
      if (level <= 2) {
        let v, w;
        do { v = [G.int(-3, 3), G.int(-3, 3)]; w = [G.int(-3, 3), G.int(-3, 3)]; } while (det2([[v[0], w[0]], [v[1], w[1]]]) === 0 || (level === 1 && Math.abs(det2([[v[0], w[0]], [v[1], w[1]]])) !== 1));
        const a = G.int(-3, 3), b = G.int(-3, 3);
        const t = [a * v[0] + b * w[0], a * v[1] + b * w[1]];
        return {
          type: "cloze",
          md: "Schreibe $" + vec(t) + "$ als Linearkombination von $v = " + vec(v) + "$ und $w = " + vec(w) + "$.\n\n$" + vec(t) + " =$ {{0}} $\\cdot v\\ +$ {{1}} $\\cdot w$",
          blanks: [blank(a), blank(b)],
          hint: "Das ergibt zwei Gleichungen: $" + v[0] + "a " + G.term(w[0]) + "b = " + t[0] + "$ und $" + v[1] + "a " + G.term(w[1]) + "b = " + t[1] + "$.",
          explain: "$" + a + " \\cdot " + vec(v) + " " + G.term(b) + " \\cdot " + vec(w) + " = " + vec(t) + "$. Weil $v$ und $w$ nicht parallel sind, ist die Darstellung eindeutig.",
        };
      }
      if (level === 3) {
        const M = [[1, G.int(-1, 2), G.int(-1, 1)], [0, 1, G.int(-2, 2)], [0, 0, 1]];
        const U = [[1, 0, 0], [G.int(-1, 1), 1, 0], [G.int(-1, 1), G.int(-1, 1), 1]];
        const B = mulMM(U, M); // det 1, columns are the vectors
        const coef = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)];
        const t = mulMV(B, coef);
        const cols = [0, 1, 2].map((j) => B.map((r) => r[j]));
        return {
          type: "cloze",
          md: "Schreibe $" + vec(t) + "$ als Linearkombination von $u = " + vec(cols[0]) + "$, $v = " + vec(cols[1]) + "$, $w = " + vec(cols[2]) + "$.\n\n{{0}} $\\cdot u\\ +$ {{1}} $\\cdot v\\ +$ {{2}} $\\cdot w$",
          blanks: [blank(coef[0]), blank(coef[1]), blank(coef[2])],
          hint: "Stelle das Gleichungssystem mit den Vektoren als Spalten auf und löse es mit dem Gauß-Verfahren.",
          explain: "$" + coef[0] + "u " + G.term(coef[1]) + "v " + G.term(coef[2]) + "w = " + vec(t) + "$.",
        };
      }
      const al = G.int(-3, 3), be = G.int(-3, 3), p = G.int(-3, 3), q = G.int(-3, 3);
      const t = al * p + be * q;
      return numeric("Für welches $t$ liegt $" + vec([p, q, "t"]) + "$ im Spann von $" + vec([1, 0, al]) + "$ und $" + vec([0, 1, be]) + "$?", t, {
        hint: "Die ersten beiden Komponenten legen die Koeffizienten fest.",
        explain: "Die Koeffizienten müssen $" + p + "$ und $" + q + "$ sein. Dann ist die dritte Komponente $" + p + " \\cdot " + al + " " + G.term(q) + " \\cdot " + be + " = " + t + "$.",
      });
    },
  });

  gen("la-basis", {
    title: "Lineare Unabhängigkeit",
    make(level, G) {
      if (level === 1) {
        const v = [G.int(-4, 4), G.int(-4, 4)];
        const dep = G.chance(0.45);
        const k = G.pick([-2, -1, 2, 3]);
        const w = dep ? [k * v[0], k * v[1]] : [v[0] + G.pick([-1, 1]), v[1] + G.pick([-2, 2])];
        const d = det2([[v[0], w[0]], [v[1], w[1]]]);
        return {
          type: "truefalse", md: "$" + vec(v) + "$ und $" + vec(w) + "$ sind linear unabhängig.", answer: d !== 0,
          explain: "$\\det = " + v[0] + " \\cdot " + w[1] + " - " + w[0] + " \\cdot " + v[1] + " = " + d + "$. " + (d !== 0 ? "Nicht null: unabhängig, sie bilden eine Basis des $\\mathbb{R}^2$." : "Null: Ein Vektor ist ein Vielfaches des anderen."),
        };
      }
      const r1 = [G.int(-2, 3), G.int(-2, 3), G.int(-2, 3)], r2 = [G.int(-2, 3), G.int(-2, 3), G.int(-2, 3)];
      const dep = G.chance(0.5);
      const a = G.int(-2, 2), b = G.int(-2, 2);
      const r3 = dep ? r1.map((x, i) => a * x + b * r2[i]) : [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)];
      const M = [r1, r2, r3];
      const d = det3(M);
      if (level === 2) return {
        type: "truefalse", md: "Die Vektoren $" + vec(r1) + ", " + vec(r2) + ", " + vec(r3) + "$ sind linear unabhängig.", answer: d !== 0,
        explain: "Die Determinante der Matrix mit diesen Vektoren ist $" + d + "$. " + (d !== 0 ? "Nicht null, also unabhängig." : "Null, also abhängig."),
      };
      if (level === 3) {
        const rank = rankOf(M);
        return numeric("Welche Dimension hat der Spann von $" + vec(r1) + ", " + vec(r2) + ", " + vec(r3) + "$?", rank, {
          hint: "Die Dimension des Spanns ist die Anzahl linear unabhängiger Vektoren darunter, also der Rang der Matrix.",
          explain: "Der Rang ist $" + rank + "$" + (rank === 2 ? ": zwei Vektoren sind unabhängig, der dritte liegt in ihrer Ebene." : rank === 3 ? ": die Vektoren bilden eine Basis des $\\mathbb{R}^3$." : ": alle liegen auf einer Geraden.") + " Determinante: $" + d + "$.",
        });
      }
      const p = G.int(-2, 2), q = G.int(1, 3), s = G.int(-2, 2);
      // det of columns (1,0,p), (0,1,q), (1,s,t) = t - p - q*s  -> zero for t = p + q*s
      const t0 = p + q * s;
      return numeric("Für welches $t$ sind $" + vec([1, 0, p]) + ", " + vec([0, 1, q]) + ", " + vec([1, s, "t"]) + "$ linear abhängig?", t0, {
        hint: "Linear abhängig genau dann, wenn die Determinante null ist. Sie ist hier linear in $t$.",
        explain: "$\\det = t - " + (p < 0 ? "(" + p + ")" : p) + " - " + q + " \\cdot " + (s < 0 ? "(" + s + ")" : s) + "$, null für $t = " + t0 + "$. Dann ist der dritte Vektor $1 \\cdot$ erster $+ " + s + " \\cdot$ zweiter.",
      });
    },
  });

  // ---------------------------------------------------------------- matrices

  gen("la-matrix", {
    title: "Matrizen rechnen",
    make(level, G) {
      const A = [[G.int(-3, 4), G.int(-3, 4)], [G.int(-3, 4), G.int(-3, 4)]];
      if (level === 1) {
        const v = [G.int(-3, 3), G.int(-3, 3)];
        const r = mulMV(A, v);
        return {
          type: "cloze", md: "Berechne $" + mat(A) + vec(v) + "$.\n\n$=\\ ($ {{0}} $,$ {{1}} $)^T$",
          blanks: [blank(r[0]), blank(r[1])],
          hint: "Jede Zeile der Matrix mal den Vektor: Zeile mal Spalte.",
          explain: "$" + A[0][0] + " \\cdot " + v[0] + " " + G.term(A[0][1]) + " \\cdot " + v[1] + " = " + r[0] + "$ und $" + A[1][0] + " \\cdot " + v[0] + " " + G.term(A[1][1]) + " \\cdot " + v[1] + " = " + r[1] + "$.",
        };
      }
      const B = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]];
      if (level === 2) {
        const C = mulMM(A, B);
        return {
          type: "cloze", md: "Berechne $AB$ für $A = " + mat(A) + "$ und $B = " + mat(B) + "$.\n\n$AB = \\begin{pmatrix} \\square & \\square \\\\ \\square & \\square \\end{pmatrix}$, zeilenweise: {{0}} {{1}} {{2}} {{3}}",
          blanks: [blank(C[0][0]), blank(C[0][1]), blank(C[1][0]), blank(C[1][1])],
          hint: "Eintrag in Zeile $i$, Spalte $j$: Zeile $i$ von $A$ mal Spalte $j$ von $B$.",
          explain: "$AB = " + mat(C) + "$.",
        };
      }
      if (level === 3) {
        let C, D;
        let tries = 0;
        do { C = mulMM(A, B); D = mulMM(B, A); tries++; } while (tries < 3 && C[0][0] === D[0][0] && C[0][1] === D[0][1]);
        return {
          type: "cloze", md: "$A = " + mat(A) + "$, $B = " + mat(B) + "$. Berechne die **erste Zeile** von $AB$ und von $BA$.\n\n$AB$: {{0}} {{1}} $\\qquad BA$: {{2}} {{3}}",
          blanks: [blank(C[0][0]), blank(C[0][1]), blank(D[0][0]), blank(D[0][1])],
          explain: "$AB = " + mat(C) + "$, $BA = " + mat(D) + "$. Die Matrizenmultiplikation ist im Allgemeinen **nicht kommutativ**, weil die Reihenfolge der Abbildungen zählt.",
        };
      }
      const U = unimodular(G);
      const d = det2(U);
      const inv = [[U[1][1] / d, -U[0][1] / d], [-U[1][0] / d, U[0][0] / d]];
      return {
        type: "cloze", md: "Bestimme die Inverse von $A = " + mat(U) + "$, zeilenweise.\n\n$A^{-1}$: {{0}} {{1}} {{2}} {{3}}",
        blanks: [blank(inv[0][0]), blank(inv[0][1]), blank(inv[1][0]), blank(inv[1][1])],
        hint: "Für $\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$ ist die Inverse $\\tfrac{1}{ad - bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$.",
        explain: "$\\det A = " + d + "$, also $A^{-1} = " + mat(inv.map((r) => r.map((v) => (Object.is(v, -0) ? 0 : v)))) + "$. Probe: $A A^{-1} = E$.",
      };
    },
  });

  gen("la-kern", {
    title: "Kern und Rang",
    make(level, G) {
      if (level === 1) {
        const kind = G.pick([0, 1, 1, 2, 2]);
        let A;
        if (kind === 0) A = [[0, 0], [0, 0]];
        else if (kind === 1) { const r = [nz(G, -3, 3), G.int(-3, 3)], k = G.pick([-2, -1, 2, 3]); A = [r, [k * r[0], k * r[1]]]; }
        else { do { A = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]]; } while (det2(A) === 0); }
        return numeric("Welchen Rang hat $" + mat(A) + "$?", kind, {
          explain: kind === 2 ? "$\\det = " + det2(A) + " \\ne 0$: Rang $2$, die Abbildung ist bijektiv." : kind === 1 ? "Die zweite Zeile ist ein Vielfaches der ersten: Rang $1$. Die Ebene wird auf eine Gerade abgebildet." : "Die Nullmatrix hat Rang $0$.",
        });
      }
      if (level === 2) {
        const a = nz(G, -3, 3), b = nz(G, -3, 3), k = G.pick([-2, 2, 3]);
        const A = [[a, b], [k * a, k * b]];
        const good = [b, -a];
        return {
          type: "choice", md: "Welcher Vektor liegt im **Kern** von $" + mat(A) + "$?",
          options: G.options({ md: "$" + vec(good) + "$" }, [
            { md: "$" + vec([a, b]) + "$", why: "Das ist die Zeile selbst, $A$ bildet sie nicht auf $0$ ab." },
            { md: "$" + vec([-b, -a]) + "$", why: "Rechne nach: Die erste Komponente des Bildes ist nicht $0$." },
            { md: "$" + vec([a + 1, b]) + "$", why: "Das Bild ist nicht der Nullvektor." },
          ]),
          explain: "$" + a + " \\cdot " + good[0] + " " + G.term(b) + " \\cdot " + (good[1] < 0 ? "(" + good[1] + ")" : good[1]) + " = 0$, und die zweite Zeile ist ein Vielfaches der ersten. Der Kern ist die Gerade durch $" + vec(good) + "$.",
        };
      }
      if (level === 3) {
        const n = G.int(3, 7), m = G.int(2, 6), r = G.int(1, Math.min(n, m));
        return numeric("Eine lineare Abbildung $f: \\mathbb{R}^{" + n + "} \\to \\mathbb{R}^{" + m + "}$ hat ein Bild der Dimension $" + r + "$. Welche Dimension hat ihr Kern?", n - r, {
          hint: "Dimensionsformel: $\\dim \\ker f + \\dim \\operatorname{im} f = \\dim$ des Urbildraums.",
          explain: "$\\dim \\ker f = " + n + " - " + r + " = " + (n - r) + "$. Was im Bild an Dimension fehlt, steckt im Kern.",
        });
      }
      const k1 = G.int(-2, 2), k2 = G.int(-2, 2);
      const row = () => { const a = G.int(-3, 3), b = G.int(-3, 3); return [a, b, -(a * k1 + b * k2)]; };
      let r1, r2; do { r1 = row(); r2 = row(); } while (r1[0] * r2[1] - r1[1] * r2[0] === 0);
      const s = G.pick([-1, 1, 2]);
      const A = [r1, r2, r1.map((x, i) => x + s * r2[i])];
      return {
        type: "cloze",
        md: "$A = " + mat(A) + "$ hat Rang $2$. Ihr Kern ist eine Gerade. Gib einen Kernvektor der Form $(x, y, 1)$ an.\n\n$x =$ {{0}} $\\qquad y =$ {{1}}",
        blanks: [blank(k1), blank(k2)],
        hint: "Löse $A v = 0$ mit $z = 1$. Die dritte Zeile ist eine Kombination der ersten beiden und liefert nichts Neues.",
        explain: "$v = (" + k1 + ", " + k2 + ", 1)$: Jede Zeile mal $v$ ergibt $0$. Dimensionsformel: $3 - 2 = 1$, also ist der Kern genau diese Gerade.",
      };
    },
  });

  // ---------------------------------------------------------------- linear systems

  gen("la-gauss", {
    title: "Gleichungssystem",
    make(level, G) {
      if (level === 1) {
        let A; do { A = [[G.int(-3, 4), G.int(-3, 4)], [G.int(-3, 4), G.int(-3, 4)]]; } while (det2(A) === 0 || Math.abs(det2(A)) > 6);
        const x = [G.int(-4, 4), G.int(-4, 4)], b = mulMV(A, x);
        const eq = (r, c) => lin(r, ["x", "y"]) + " = " + c;
        return {
          type: "cloze", md: "Löse $\\begin{aligned} " + eq(A[0], b[0]) + " \\\\ " + eq(A[1], b[1]) + " \\end{aligned}$\n\n$x =$ {{0}} $\\qquad y =$ {{1}}",
          blanks: [blank(x[0]), blank(x[1])],
          explain: "$x = " + x[0] + "$, $y = " + x[1] + "$. Probe durch Einsetzen in beide Gleichungen.",
        };
      }
      const U = [[1, G.int(-2, 2), G.int(-2, 2)], [0, 1, G.int(-2, 2)], [0, 0, 1]];
      const L = [[1, 0, 0], [G.int(-2, 2), 1, 0], [G.int(-2, 2), G.int(-2, 2), 1]];
      const A = mulMM(L, U).map((r) => r.map((v) => v));
      const eq = (r, c) => lin(r, ["x", "y", "z"]) + " &= " + c;
      if (level === 2) {
        const x = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)], b = mulMV(A, x);
        return {
          type: "cloze", md: "Löse mit dem Gauß-Verfahren:\n\n$$\\begin{aligned} " + A.map((r, i) => eq(r, b[i])).join(" \\\\ ") + " \\end{aligned}$$\n\n$x =$ {{0}} $\\qquad y =$ {{1}} $\\qquad z =$ {{2}}",
          blanks: [blank(x[0]), blank(x[1]), blank(x[2])],
          hint: "Eliminiere $x$ aus der zweiten und dritten Gleichung, dann $y$ aus der dritten. Dann rückwärts einsetzen.",
          explain: "Lösung $(x, y, z) = (" + x.join(", ") + ")$. Die Determinante ist $" + det3(A) + " \\ne 0$, also ist sie eindeutig.",
        };
      }
      if (level === 3) {
        const r1 = A[0], r2 = A[1], s = G.pick([1, -1, 2]);
        const r3 = r1.map((v, i) => v + s * r2[i]);
        const b1 = G.int(-4, 4), b2 = G.int(-4, 4);
        const kind = G.pick(["inf", "none"]);
        const b3 = b1 + s * b2 + (kind === "none" ? G.pick([-2, -1, 1, 2]) : 0);
        const M = [r1, r2, r3], b = [b1, b2, b3];
        return {
          type: "choice", md: "Wie viele Lösungen hat das System?\n\n$$\\begin{aligned} " + M.map((r, i) => eq(r, b[i])).join(" \\\\ ") + " \\end{aligned}$$",
          options: G.options({ md: kind === "none" ? "keine" : "unendlich viele" }, [{ md: kind === "none" ? "unendlich viele" : "keine", why: "Vergleiche die rechten Seiten nach dem Eliminieren." }, { md: "genau eine", why: "Die dritte Zeile links ist eine Kombination der ersten beiden, der Rang ist nur 2." }]),
          explain: "Links gilt Zeile 3 $=$ Zeile 1 $" + G.term(s) + " \\cdot$ Zeile 2. Rechts ist $" + b1 + " " + G.term(s) + " \\cdot " + (b2 < 0 ? "(" + b2 + ")" : b2) + " = " + (b1 + s * b2) + "$" + (kind === "none" ? ", aber dort steht $" + b3 + "$: ein Widerspruch, also keine Lösung." : ", passend: Eine Gleichung ist überflüssig, es bleibt ein freier Parameter."),
        };
      }
      const a = G.int(-3, 3), c = G.int(-4, 4), d = c + G.pick([-2, -1, 1, 2]);
      return numeric("Für welches $t$ hat das System $\\begin{aligned} " + lin([1, a], ["x", "y"]) + " &= " + c + " \\\\ x + t\\,y &= " + d + " \\end{aligned}$ **keine** Lösung?", a, {
        hint: "Keine Lösung gibt es nur, wenn die linken Seiten Vielfache voneinander sind, die rechten aber nicht passen.",
        explain: "Für $t = " + a + "$ sind die linken Seiten gleich, die rechten Seiten $" + c + " \\ne " + d + "$: Widerspruch. Für jedes andere $t$ ist die Determinante $t - " + (a < 0 ? "(" + a + ")" : a) + " \\ne 0$ und es gibt genau eine Lösung.",
      });
    },
  });

  // ---------------------------------------------------------------- determinants and eigenvalues

  gen("la-det", {
    title: "Determinante",
    make(level, G) {
      if (level === 1) {
        const A = [[G.int(-5, 6), G.int(-5, 6)], [G.int(-5, 6), G.int(-5, 6)]];
        return numeric("Berechne $\\det " + mat(A) + "$.", det2(A), { explain: "$" + A[0][0] + " \\cdot " + A[1][1] + " - " + A[0][1] + " \\cdot " + A[1][0] + " = " + det2(A) + "$." });
      }
      if (level === 2) {
        const A = [[G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)]];
        return numeric("Berechne $\\det " + mat(A) + "$.", det3(A), {
          hint: "Regel von Sarrus oder Entwicklung nach der ersten Zeile.",
          explain: "Entwicklung nach der ersten Zeile ergibt $\\det A = " + det3(A) + "$.",
        });
      }
      if (level === 3) {
        const u = [G.int(-4, 5), G.int(-4, 5)], v = [G.int(-4, 5), G.int(-4, 5)];
        const tri = G.chance(0.5), d = Math.abs(det2([[u[0], v[0]], [u[1], v[1]]]));
        return numeric("Wie groß ist die Fläche des " + (tri ? "**Dreiecks** mit den Ecken $0$, $u$ und $v$" : "**Parallelogramms**, das von $u$ und $v$ aufgespannt wird") + ", für $u = " + vec(u) + "$ und $v = " + vec(v) + "$?", tri ? d / 2 : d, {
          tolerance: 0.001,
          hint: "Die Determinante ist der Flächenfaktor: Ihr Betrag ist die Fläche des Parallelogramms.",
          explain: "$|\\det(u, v)| = " + d + "$" + (tri ? ", das Dreieck ist die Hälfte: $" + G.tex(d / 2, 1) + "$." : "."),
        });
      }
      const d = nz(G, -4, 5), e = nz(G, -3, 3), n = G.pick([2, 3]);
      const kind = G.pick(["scale", "inv", "prod", "trans", "pow"]);
      const q = {
        scale: ["\\det(2A)", Math.pow(2, n) * d, "Jede der $" + n + "$ Zeilen wird verdoppelt: Faktor $2^{" + n + "}$."],
        inv: ["\\det(A^{-1})", 1 / d, "$\\det(A)\\det(A^{-1}) = \\det E = 1$."],
        prod: ["\\det(AB)", d * e, "Determinantenmultiplikationssatz: $\\det(AB) = \\det A \\det B$."],
        trans: ["\\det(A^T)", d, "Transponieren ändert die Determinante nicht."],
        pow: ["\\det(A^3)", d * d * d, "$\\det(A^3) = (\\det A)^3$."],
      }[kind];
      return numeric("$A$ und $B$ sind $" + n + " \\times " + n + "$-Matrizen mit $\\det A = " + d + "$ und $\\det B = " + e + "$. Berechne $" + q[0] + "$.", q[1], {
        tolerance: 0.001, explain: "$" + q[0] + " = " + G.tex(q[1], 3) + "$. " + q[2],
      });
    },
  });

  gen("la-eigen", {
    title: "Eigenwerte",
    make(level, G) {
      if (level === 1) {
        const a = G.int(-4, 5), b = G.int(-4, 5), c = G.int(-3, 3);
        const A = [[a, c], [0, b]];
        return {
          type: "cloze", md: "Bestimme die Eigenwerte von $" + mat(A) + "$ (größerer zuerst).\n\n$\\lambda_1 =$ {{0}} $\\qquad \\lambda_2 =$ {{1}}",
          blanks: [blank(Math.max(a, b)), blank(Math.min(a, b))],
          explain: "Bei einer Dreiecksmatrix stehen die Eigenwerte auf der Diagonale: $\\det(A - \\lambda E) = (" + a + " - \\lambda)(" + b + " - \\lambda)$.",
        };
      }
      // A = P D P^-1 with integer P (det +-1)
      const P = unimodular(G), dP = det2(P);
      const Pinv = [[P[1][1] / dP, -P[0][1] / dP], [-P[1][0] / dP, P[0][0] / dP]];
      let l1 = G.int(-3, 4), l2 = G.int(-3, 4);
      if (l1 === l2) l2 = l1 + G.pick([1, 2]);
      const A = mulMM(mulMM(P, [[l1, 0], [0, l2]]), Pinv).map((r) => r.map((v) => Math.round(v)));
      const tr = A[0][0] + A[1][1], dt = det2(A);
      if (level === 2) return {
        type: "cloze", md: "Bestimme die Eigenwerte von $A = " + mat(A) + "$ (größerer zuerst).\n\n$\\lambda_1 =$ {{0}} $\\qquad \\lambda_2 =$ {{1}}",
        blanks: [blank(Math.max(l1, l2)), blank(Math.min(l1, l2))],
        hint: "$\\det(A - \\lambda E) = \\lambda^2 - (\\operatorname{Spur} A)\\lambda + \\det A = \\lambda^2 " + G.term(-tr) + "\\lambda " + G.term(dt) + "$.",
        explain: "$\\lambda^2 " + G.term(-tr) + "\\lambda " + G.term(dt) + " = (\\lambda - " + (l1 < 0 ? "(" + l1 + ")" : l1) + ")(\\lambda - " + (l2 < 0 ? "(" + l2 + ")" : l2) + ")$. Kontrolle: Summe $= \\operatorname{Spur} = " + tr + "$, Produkt $= \\det = " + dt + "$.",
      };
      if (level === 3) {
        // eigenvector for l1 is the first column of P; scale so that the first entry is 1 if possible
        const v = [P[0][0], P[1][0]];
        if (v[0] !== 0) {
          return numeric("$A = " + mat(A) + "$ hat den Eigenwert $\\lambda = " + l1 + "$. Ein Eigenvektor hat die Form $" + vec([1, "y"]) + "$. Bestimme $y$.", v[1] / v[0], {
            tolerance: 0.001,
            hint: "Löse $(A - " + l1 + "E)\\,v = 0$ mit erster Komponente $1$.",
            explain: "$v = " + vec([1, G.tex(v[1] / v[0], 3)]) + "$. Probe: $Av = " + l1 + "v$.",
          });
        }
        return numeric("$A = " + mat(A) + "$ hat den Eigenwert $\\lambda = " + l1 + "$. Ein Eigenvektor hat die Form $" + vec(["x", 1]) + "$. Bestimme $x$.", v[0] / v[1], {
          tolerance: 0.001, hint: "Löse $(A - " + l1 + "E)\\,v = 0$ mit zweiter Komponente $1$.", explain: "$v = " + vec([G.tex(v[0] / v[1], 3), 1]) + "$.",
        });
      }
      const pool = [
        { md: "$\\begin{pmatrix}1 & 1\\\\0 & 1\\end{pmatrix}$ ist diagonalisierbar.", ans: false, why: "Einziger Eigenwert $1$, aber der Eigenraum ist nur die Gerade durch $e_1$. Es fehlt ein zweiter unabhängiger Eigenvektor." },
        { md: "$" + mat(A) + "$ ist diagonalisierbar.", ans: true, why: "Zwei verschiedene Eigenwerte $" + l1 + "$ und $" + l2 + "$, also zwei unabhängige Eigenvektoren." },
        { md: "Die Drehung $\\begin{pmatrix}0 & -1\\\\1 & 0\\end{pmatrix}$ hat einen reellen Eigenwert.", ans: false, why: "$\\lambda^2 + 1 = 0$ hat keine reelle Lösung: Keine Richtung bleibt bei einer Vierteldrehung erhalten." },
        { md: "Jede symmetrische reelle $2 \\times 2$-Matrix hat reelle Eigenwerte.", ans: true, why: "Die Diskriminante ist $(a - d)^2 + 4b^2 \\ge 0$." },
        { md: "Ist $\\lambda$ Eigenwert von $A$, dann ist $\\lambda^2$ Eigenwert von $A^2$.", ans: true, why: "$A^2 v = A(\\lambda v) = \\lambda^2 v$." },
      ];
      const s = G.pick(pool);
      return { type: "truefalse", md: s.md, answer: s.ans, whyNot: s.ans ? null : s.why, explain: s.why };
    },
  });
  // ---------------------------------------------------------------- spot the error in a matrix product

  gen("la-fehler", {
    title: "Rechenfehler finden",
    make(level, G) {
      const r = () => G.int(-4, 5);
      const A = [[r(), r()], [r(), r()]], B = [[r(), r()], [r(), r()]];
      const sgn = (v) => (v < 0 ? "(" + v + ")" : String(v));
      const entries = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ i, j, v: A[i][0] * B[0][j] + A[i][1] * B[1][j] }));
      const bad = G.int(0, 3);
      const lines = entries.map((e, k) => {
        let a1 = A[e.i][0], b1 = B[0][e.j], a2 = A[e.i][1], b2 = B[1][e.j], v = e.v, why = "Zeile " + (e.i + 1) + " von $A$ mal Spalte " + (e.j + 1) + " von $B$, richtig gerechnet.";
        if (k === bad) {
          if (level <= 2) {
            // arithmetic slip: one product gets the wrong sign
            v = a1 * b1 - a2 * b2;
            if (v === e.v) v = e.v + 2 * (a1 * b1 === 0 ? 1 : Math.sign(a1 * b1)) + (a2 * b2 === 0 ? 3 : 0);
            why = "Rechenfehler: $" + sgn(a1) + " \\cdot " + sgn(b1) + " + " + sgn(a2) + " \\cdot " + sgn(b2) + " = " + e.v + "$.";
          } else {
            // index slip: column instead of row of A
            a1 = A[0][e.i]; a2 = A[1][e.i];
            v = a1 * b1 + a2 * b2;
            if (v === e.v) { b2 = B[1][1 - e.j]; v = a1 * b1 + a2 * b2; }
            if (v === e.v) v = e.v + 1;
            why = "Hier wurde die falsche Zeile oder Spalte genommen. Für $c_{" + (e.i + 1) + (e.j + 1) + "}$ braucht man Zeile " + (e.i + 1) + " von $A$ und Spalte " + (e.j + 1) + " von $B$: Ergebnis $" + e.v + "$.";
          }
        }
        return { md: "$c_{" + (e.i + 1) + (e.j + 1) + "} = " + sgn(a1) + " \\cdot " + sgn(b1) + " + " + sgn(a2) + " \\cdot " + sgn(b2) + " = " + v + "$", why };
      });
      const M = (X) => "\\begin{pmatrix} " + X[0][0] + " & " + X[0][1] + " \\\\ " + X[1][0] + " & " + X[1][1] + " \\end{pmatrix}";
      return {
        type: "spot",
        md: "Berechnet wird $C = AB$ mit $A = " + M(A) + "$ und $B = " + M(B) + "$. **Welcher Eintrag ist falsch?**",
        lines,
        answer: bad,
        explain: "$c_{ij}$ ist Zeile $i$ von $A$ mal Spalte $j$ von $B$. Richtig: $C = " + M([[entries[0].v, entries[1].v], [entries[2].v, entries[3].v]]) + "$.",
      };
    },
  });
})();
