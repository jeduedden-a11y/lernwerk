/* Lineare Algebra I in depth, part 1: groups, homomorphisms, permutations, rings and polynomials.
 * Shared helpers for all uni-*.js files live in LW.uni. Level 3 asks for understanding, level 4 (Experte) mixes the
 * hardest exam tasks (label "Klausur") with tasks beyond exam level (label "Extrem"); for the generators of the
 * course that already existed, the old level-4 tasks move down to level 3 and level 4 draws only from the new ones. */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  // ---------------------------------------------------------------- shared kit
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0);
  const range = (a, b) => { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; };
  const divisors = (n) => range(1, n).filter((d) => n % d === 0);
  const phi = (n) => range(1, n).filter((a) => gcd(a, n) === 1).length;
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  const powmod = (a, k, m) => { let r = 1 % m, b = ((a % m) + m) % m; while (k > 0) { if (k & 1) r = (r * b) % m; b = (b * b) % m; k = Math.floor(k / 2); } return r; };
  const vec = (a) => "\\begin{pmatrix}" + a.join(" \\\\ ") + "\\end{pmatrix}";
  const mat = (M) => "\\begin{pmatrix}" + M.map((r) => r.join(" & ")).join(" \\\\ ") + "\\end{pmatrix}";
  const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const mulMV = (M, v) => M.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
  const mulMM = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  function detN(A) {
    const n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return det2(A);
    let s = 0;
    for (let j = 0; j < n; j++) {
      if (!A[0][j]) continue;
      const minor = A.slice(1).map((r) => r.filter((_, k) => k !== j));
      s += (j % 2 ? -1 : 1) * A[0][j] * detN(minor);
    }
    return s;
  }
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
  const par = (c) => (c < 0 ? "(" + c + ")" : String(c));
  const pm = (c) => (c < 0 ? "- " + -c : "+ " + c);
  const blank = (v, tol) => ({ accept: [v], numeric: true, tolerance: tol == null ? 1e-6 : tol, placeholder: "Zahl" });
  /** Polynomial in TeX from coefficients c[0] + c[1] x + ..., highest power first. */
  function poly(c, v) {
    v = v || "x";
    let s = "";
    for (let p = c.length - 1; p >= 0; p--) {
      const a = c[p];
      if (!a) continue;
      const abs = Math.abs(a);
      const body = p === 0 ? String(abs) : (abs === 1 ? "" : abs) + v + (p === 1 ? "" : "^{" + p + "}");
      s += s ? (a < 0 ? " - " : " + ") + body : (a < 0 ? "-" : "") + body;
    }
    return s || "0";
  }
  const peval = (c, x) => c.reduce((s, a, p) => s + a * Math.pow(x, p), 0);
  const lab = (label, s) => Object.assign({}, s, { label });
  const tf = (md, answer, explain) => ({ type: "truefalse", md, answer, explain, whyNot: answer ? null : explain });
  const ch = (md, right, wrong, explain) => ({ type: "choice", md, options: [{ md: right, correct: true }].concat(wrong.map((w) => ({ md: w[0], why: w[1] }))), explain });
  const mu = (md, opts, explain) => ({ type: "multi", md, options: opts.map((o) => ({ md: o[0], correct: !!o[1], why: o[2] })), explain });
  const nu = (md, answer, explain, o) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl", explain }, o || {});
  const sp = (md, lines, answer, explain) => ({ type: "spot", md, lines: lines.map((l) => ({ md: l[0], why: l[1] })), answer, explain });
  const pr = (md, given, claim, steps, distractors, explain, hint) => {
    const s = { type: "proof", md, given, claim, steps, distractors: distractors.map((d) => ({ md: d[0], why: d[1] })), explain };
    if (hint) s.hint = hint;
    return s;
  };
  const KL = (s) => (typeof s === "function" ? (lv, G, p) => lab("Klausur", s(lv, G, p)) : lab("Klausur", s));
  const EX = (s) => (typeof s === "function" ? (lv, G, p) => lab("Extrem", s(lv, G, p)) : lab("Extrem", s));
  const VS = (s) => (typeof s === "function" ? (lv, G, p) => lab("Verständnis", s(lv, G, p)) : lab("Verständnis", s));
  /** Statement pool as templates for one level, each task labelled. */
  function pool(label, items, forms, level) {
    const built = LW.forms.statements(items.map((x) => Object.assign({ lv: level }, x)), { [level]: forms });
    return built[level].map((t) => (lv, G, p) => lab(label, t(lv, G, p)));
  }
  /** The old level-4 tasks of a generator move down to level 3. */
  const demote = (name) => LW.extend(name, { 3: [(lv, G, p) => LW.generators[name].make(4, G, p)] });
  /** Level 4 of a generator from now on only from these tasks; extra tasks added to level 4 earlier move to level 3. */
  const expert = (name, items) => {
    const ext = LW.extensions[name];
    if (ext && ext[4] && ext[4].length) { ext[3].push(...ext[4]); ext[4] = []; }
    // fixed tasks weigh like templates here, so Klausur and Extrem come about equally often
    const even = items.map((x) => (typeof x === "function" ? x : () => JSON.parse(JSON.stringify(x))));
    LW.extend(name, { 4: even }, { replace: [4] });
  };
  /** Generator definition whose levels are lists of tasks or templates: gen(name, byLevels(title, { 1: [...], ... })). */
  function byLevels(title, levels) {
    return {
      title,
      make(level, G, p) {
        const x = G.pick(levels[level] || levels[4]);
        return typeof x === "function" ? x(level, G, p) : JSON.parse(JSON.stringify(x));
      },
    };
  }
  const U = LW.uni = {
    gcd, lcm, range, divisors, phi, isPrime, powmod, vec, mat, det2, det3, detN, mulMV, mulMM, transpose, rankOf, nz, par, pm, blank,
    poly, peval, lab, tf, ch, mu, nu, sp, pr, KL, EX, VS, pool, demote, expert, byLevels,
  };
  void U;

  // ---------------------------------------------------------------- permutations
  const permTex = (p) => "\\begin{pmatrix}" + p.map((_, i) => i + 1).join(" & ") + " \\\\ " + p.join(" & ") + "\\end{pmatrix}";
  const compose = (s, t) => t.map((x) => s[x - 1]);
  function cycles(p) {
    const seen = new Set(), out = [];
    for (let i = 1; i <= p.length; i++) {
      if (seen.has(i)) continue;
      const c = [];
      let j = i;
      while (!seen.has(j)) { seen.add(j); c.push(j); j = p[j - 1]; }
      out.push(c);
    }
    return out;
  }
  const cycTex = (p) => { const cs = cycles(p).filter((c) => c.length > 1); return cs.length ? cs.map((c) => "(" + c.join("\\,") + ")").join("") : "\\mathrm{id}"; };
  const sign = (p) => (cycles(p).reduce((s, c) => s + c.length - 1, 0) % 2 ? -1 : 1);
  const order = (p) => cycles(p).reduce((s, c) => lcm(s, c.length), 1);
  const randPerm = (G, n) => G.shuffle(range(1, n));
  function fromCycles(n, cs) { const p = range(1, n); for (const c of cs) c.forEach((x, i) => { p[x - 1] = c[(i + 1) % c.length]; }); return p; }
  LW.uni.perm = { permTex, compose, cycles, cycTex, sign, order, randPerm, fromCycles };

  // ---------------------------------------------------------------- la-modular: deeper
  demote("la-modular");
  LW.extend("la-modular", {
    3: [
      VS((lv, G) => {
        const n = G.pick([8, 9, 10, 12, 14, 15, 16, 18, 20, 21]);
        const units = range(1, n - 1).filter((a) => gcd(a, n) === 1);
        return nu("Wie viele Elemente von $\\mathbb{Z}/" + n + "\\mathbb{Z}$ haben ein **multiplikatives Inverses**?", units.length,
          "Invertierbar ist $a$ genau dann, wenn $\\gcd(a, " + n + ") = 1$ (dann liefert das erweiterte euklidische Verfahren $sa + tn = 1$). Das sind $" + units.join(", ") + "$, also $" + units.length + "$ Stück. Alle übrigen Elemente außer $0$ sind Nullteiler.",
          { hint: "$a$ ist modulo $n$ genau dann invertierbar, wenn $a$ und $n$ teilerfremd sind." });
      }),
      VS((lv, G) => {
        const n = G.pick([6, 8, 9, 10, 12, 14, 15]);
        let a; do { a = G.int(2, n - 1); } while (gcd(a, n) === 1 && G.chance(0.7));
        const b = G.int(0, n - 1);
        const sols = range(0, n - 1).filter((x) => (a * x - b) % n === 0);
        const g = gcd(a, n);
        return nu("Wie viele Lösungen $x \\in \\mathbb{Z}/" + n + "\\mathbb{Z}$ hat die Gleichung $" + a + "x \\equiv " + b + " \\pmod{" + n + "}$?", sols.length,
          "Mit $g = \\gcd(" + a + ", " + n + ") = " + g + "$ gilt: Lösbar genau dann, wenn $g$ die rechte Seite teilt, und dann gibt es genau $g$ Lösungen. " +
          (sols.length ? "Hier: $" + sols.join(", ") + "$." : "Hier teilt $" + g + "$ nicht $" + b + "$: keine Lösung.") + " In einem Körper ($n$ prim) gäbe es stets genau eine.",
          { hint: "Bestimme zuerst $\\gcd(" + a + ", " + n + ")$." });
      }),
    ],
  });
  expert("la-modular", [
    KL((lv, G) => {
      const p = G.pick([5, 7, 11, 13]), a = G.int(2, p - 1), k = G.int(150, 2026);
      const r = k % (p - 1), v = powmod(a, k, p);
      return nu("Berechne $" + a + "^{" + k + "} \\bmod " + p + "$ (Zahl von $0$ bis $" + (p - 1) + "$).", v,
        "Kleiner Fermat: $" + a + "^{" + (p - 1) + "} \\equiv 1 \\pmod{" + p + "}$. Mit $" + k + " = " + Math.floor(k / (p - 1)) + " \\cdot " + (p - 1) + " + " + r + "$ folgt $" + a + "^{" + k + "} \\equiv " + a + "^{" + r + "} \\equiv " + v + "$.",
        { hint: "Reduziere den Exponenten modulo $" + (p - 1) + "$." });
    }),
    KL((lv, G) => {
      const [m1, m2] = G.pick([[3, 4], [3, 5], [4, 5], [3, 7], [5, 7], [4, 7], [5, 8], [7, 8], [5, 9], [4, 9]]);
      const r1 = G.int(0, m1 - 1), r2 = G.int(0, m2 - 1);
      const x = range(0, m1 * m2 - 1).find((y) => y % m1 === r1 && y % m2 === r2);
      return nu("Bestimme $x \\in \\{0, \\dots, " + (m1 * m2 - 1) + "\\}$ mit $x \\equiv " + r1 + " \\pmod{" + m1 + "}$ und $x \\equiv " + r2 + " \\pmod{" + m2 + "}$.", x,
        "Chinesischer Restsatz: Weil $" + m1 + "$ und $" + m2 + "$ teilerfremd sind, gibt es genau eine Lösung modulo $" + m1 * m2 + "$. Durchsuche $" + r1 + ", " + (r1 + m1) + ", " + (r1 + 2 * m1) + ", \\dots$ nach dem Rest $" + r2 + "$ modulo $" + m2 + "$: $x = " + x + "$.");
    }),
    KL((lv, G) => {
      const a = G.int(2, 9), k = G.int(100, 3000), v = powmod(a, k, 10);
      return nu("Welche **letzte Ziffer** hat $" + a + "^{" + k + "}$?", v,
        "Die letzte Ziffer ist der Rest modulo $10$. Die Potenzen von $" + a + "$ modulo $10$ wiederholen sich periodisch (Periode teilt $4$): $" + [1, 2, 3, 4, 5].map((e) => powmod(a, e, 10)).join(", ") + ", \\dots$ Also $" + a + "^{" + k + "} \\equiv " + v + "$.");
    }),
    KL((lv, G) => {
      const n = G.pick([8, 12, 15, 21, 24]);
      const sols = range(0, n - 1).filter((x) => (x * x) % n === 1 % n);
      return nu("Wie viele Lösungen hat $x^2 \\equiv 1 \\pmod{" + n + "}$ in $\\mathbb{Z}/" + n + "\\mathbb{Z}$?", sols.length,
        "Die Lösungen sind $" + sols.join(", ") + "$. In einem Körper hätte $x^2 - 1 = (x - 1)(x + 1)$ nur die Nullstellen $\\pm 1$. In $\\mathbb{Z}/" + n + "\\mathbb{Z}$ gibt es Nullteiler: $(x - 1)(x + 1) \\equiv 0$ kann gelten, obwohl keiner der Faktoren $0$ ist.");
    }),
    KL((lv, G) => {
      const n = G.pick([12, 18, 20, 24, 30]);
      const zd = range(1, n - 1).filter((a) => gcd(a, n) > 1);
      return nu("Wie viele **Nullteiler** $a \\ne 0$ hat $\\mathbb{Z}/" + n + "\\mathbb{Z}$?", zd.length,
        "In $\\mathbb{Z}/n\\mathbb{Z}$ ist jedes $a \\ne 0$ entweder invertierbar ($\\gcd(a, n) = 1$) oder Nullteiler: Für $g = \\gcd(a, n) > 1$ gilt $a \\cdot \\tfrac{n}{g} \\equiv 0$. Also $" + (n - 1) + " - \\varphi(" + n + ") = " + (n - 1) + " - " + phi(n) + " = " + zd.length + "$.");
    }),
    EX(tf("In einem **endlichen** kommutativen Ring ist jedes Element $a \\ne 0$ entweder eine Einheit oder ein Nullteiler.", true,
      "Die Abbildung $x \\mapsto ax$ ist entweder injektiv oder nicht. Injektiv auf einer endlichen Menge heißt bijektiv, dann wird die $1$ getroffen: $ab = 1$. Nicht injektiv heißt $ab = ac$ mit $b \\ne c$, also $a(b - c) = 0$: Nullteiler. In $\\mathbb{Z}$ falsch: $2$ ist weder das eine noch das andere.")),
    EX(tf("Es gibt einen Körper mit genau $6$ Elementen.", false,
      "Die Charakteristik eines endlichen Körpers ist eine Primzahl $p$, der Körper enthält dann $\\mathbb{F}_p$ und ist ein Vektorraum über $\\mathbb{F}_p$ von endlicher Dimension $n$. Also hat er $p^n$ Elemente. $6$ ist keine Primzahlpotenz.")),
    EX(tf("Es gibt einen Körper mit genau $4$ Elementen, und das ist **nicht** $\\mathbb{Z}/4\\mathbb{Z}$.", true,
      "$\\mathbb{Z}/4\\mathbb{Z}$ ist kein Körper, denn $2 \\cdot 2 \\equiv 0$. Der Körper mit vier Elementen ist $\\{0, 1, \\alpha, \\alpha + 1\\}$ mit $1 + 1 = 0$ und $\\alpha^2 = \\alpha + 1$, also $\\mathbb{F}_2[x]/(x^2 + x + 1)$.")),
    EX(tf("In $\\mathbb{Z}/p\\mathbb{Z}$ ($p$ prim) gilt $(a + b)^p = a^p + b^p$ für alle $a, b$.", true,
      "Binomischer Lehrsatz: Die Koeffizienten $\\binom{p}{k}$ mit $0 < k < p$ sind durch $p$ teilbar, weil $p$ im Zähler $p!$ steht, aber nicht im Nenner $k!(p - k)!$. Modulo $p$ bleiben nur $a^p$ und $b^p$.")),
    EX(nu("Wie viele $a \\in \\{0, 1, \\dots, 99\\}$ erfüllen $a^2 \\equiv a \\pmod{100}$?", 4,
      "$a^2 \\equiv a$ heißt $a(a - 1) \\equiv 0$, also teilen $4$ und $25$ das Produkt $a(a - 1)$. Weil $a$ und $a - 1$ teilerfremd sind, gilt modulo $4$: $a \\equiv 0$ oder $1$, ebenso modulo $25$. Chinesischer Restsatz: $2 \\cdot 2 = 4$ Lösungen, nämlich $0, 1, 25, 76$.")),
    EX(nu("Welchen Rest lässt $1! + 2! + 3! + \\dots + 100!$ bei Division durch $12$?", 9,
      "Ab $4!$ ist jeder Summand durch $12$ teilbar, denn $4! = 24$ und $n!$ enthält $4!$ als Faktor. Es bleibt $1 + 2 + 6 = 9$.")),
  ]);

  // ---------------------------------------------------------------- la-gruppe: deeper
  demote("la-gruppe");
  LW.extend("la-gruppe", {
    3: pool("Verständnis", [
      { ok: true, md: "In einer Gruppe folgt aus $ab = ac$ stets $b = c$.", why: "Von links mit $a^{-1}$ multiplizieren: $b = a^{-1}(ab) = a^{-1}(ac) = c$." },
      { ok: false, md: "In jeder Gruppe gilt $(ab)^{-1} = a^{-1}b^{-1}$.", why: "Richtig ist $(ab)^{-1} = b^{-1}a^{-1}$, denn $(ab)(b^{-1}a^{-1}) = e$. Beide Formeln stimmen nur, wenn $a$ und $b$ vertauschen." },
      { ok: true, md: "Der Durchschnitt zweier Untergruppen ist eine Untergruppe.", why: "Neutrales Element, Produkte und Inverse liegen in beiden Untergruppen, also im Durchschnitt." },
      { ok: false, md: "Die Vereinigung zweier Untergruppen ist eine Untergruppe.", why: "$2\\mathbb{Z} \\cup 3\\mathbb{Z}$ enthält $2$ und $3$, aber nicht $5$. Eine Vereinigung ist nur dann eine Untergruppe, wenn eine der beiden in der anderen liegt." },
      { ok: false, md: "Jede Gruppe mit vier Elementen ist zyklisch.", why: "$\\mathbb{Z}/2\\mathbb{Z} \\times \\mathbb{Z}/2\\mathbb{Z}$ hat vier Elemente, aber keines der Ordnung $4$." },
      { ok: true, md: "Jede Gruppe von Primzahlordnung ist zyklisch.", why: "Ein $a \\ne e$ erzeugt eine Untergruppe, deren Ordnung $p$ teilt und größer als $1$ ist, also $p$." },
      { ok: false, md: "Jede Gruppe mit sechs Elementen ist abelsch.", why: "$S_3$ hat sechs Elemente, und $(1\\,2)(1\\,3) \\ne (1\\,3)(1\\,2)$." },
      { ok: true, md: "Gilt $a^2 = e$ für jedes Element, so ist die Gruppe abelsch.", why: "$ab = (ab)^{-1} = b^{-1}a^{-1} = ba$, weil jedes Element sein eigenes Inverses ist." },
      { ok: true, md: "In $(\\mathbb{Z}/12\\mathbb{Z}, +)$ hat $8$ die Ordnung $3$.", why: "Ordnung $12 / \\gcd(8, 12) = 3$: $8, 16 \\equiv 4, 24 \\equiv 0$." },
      { ok: false, md: "In $(\\mathbb{Z}/12\\mathbb{Z}, +)$ hat $9$ die Ordnung $3$.", why: "Ordnung $12 / \\gcd(9, 12) = 4$: $9, 6, 3, 0$." },
      { ok: false, md: "Sind alle echten Untergruppen von $G$ abelsch, so ist $G$ abelsch.", why: "In $S_3$ sind alle echten Untergruppen zyklisch, also abelsch, $S_3$ selbst ist es nicht." },
      { ok: false, md: "Für jedes $a$ einer Gruppe ist $\\{a, a^2, a^3, \\dots\\}$ eine Untergruppe.", why: "In $(\\mathbb{Z}, +)$ ist das für $a = 1$ die Menge $\\{1, 2, 3, \\dots\\}$, ohne $0$. In endlichen Gruppen stimmt es, weil sich die Potenzen wiederholen." },
    ], ["tf", "multi", "sort"], 3),
  });
  expert("la-gruppe", [
    KL(ch("Welche Ordnungen können Elemente einer Gruppe mit $15$ Elementen haben?", "Genau die Teiler von $15$: $1, 3, 5, 15$",
      [["$1, 3, 5$, aber nie $15$", "In $\\mathbb{Z}/15\\mathbb{Z}$ hat $1$ die Ordnung $15$."], ["Alle Zahlen von $1$ bis $15$", "Nach Lagrange teilt $|\\langle a \\rangle|$ die Gruppenordnung."], ["$1, 2, 3, 5, 15$", "$2$ teilt $15$ nicht."]],
      "Die Ordnung von $a$ ist $|\\langle a \\rangle|$ und teilt $|G| = 15$. Alle vier Teiler kommen vor, etwa in $\\mathbb{Z}/15\\mathbb{Z}$.")),
    KL((lv, G) => {
      const n = G.pick([12, 18, 20, 24, 30, 36, 42]);
      const ds = divisors(n);
      return nu("Wie viele Untergruppen hat $(\\mathbb{Z}/" + n + "\\mathbb{Z}, +)$?", ds.length,
        "Eine zyklische Gruppe der Ordnung $n$ hat zu jedem Teiler $d$ von $n$ genau eine Untergruppe der Ordnung $d$, erzeugt von $n/d$. Teiler von $" + n + "$: $" + ds.join(", ") + "$, also $" + ds.length + "$ Untergruppen.");
    }),
    KL((lv, G) => {
      const n = G.pick([12, 18, 20, 24, 30]);
      const d = G.pick(divisors(n).filter((x) => x > 1));
      const els = range(0, n - 1).filter((a) => n / gcd(a, n) === d);
      return nu("Wie viele Elemente der Ordnung $" + d + "$ hat $(\\mathbb{Z}/" + n + "\\mathbb{Z}, +)$?", els.length,
        "$a$ hat die Ordnung $" + n + "/\\gcd(a, " + n + ")$. Die Elemente der Ordnung $" + d + "$ sind die Erzeuger der einzigen Untergruppe der Ordnung $" + d + "$, das sind $\\varphi(" + d + ") = " + els.length + "$ Stück: $" + els.join(", ") + "$.");
    }),
    KL(pr("Baue den Beweis.", "$G$ ist eine Gruppe, in der $x^2 = e$ für alle $x \\in G$ gilt.", "$G$ ist abelsch.",
      ["Für jedes $x \\in G$ gilt $x \\cdot x = e$, also $x^{-1} = x$.", "Seien $a, b \\in G$. Dann ist $ab = (ab)^{-1}$.", "Es gilt $(ab)^{-1} = b^{-1}a^{-1}$.", "Mit $b^{-1} = b$ und $a^{-1} = a$ folgt $ab = ba$."],
      [["Es gilt $(ab)^{-1} = a^{-1}b^{-1}$.", "Das wäre schon die Vertauschbarkeit, also das zu Beweisende."], ["Also ist $a = b$ für alle $a, b \\in G$.", "Aus $a^2 = b^2$ folgt nicht $a = b$."]],
      "Der Trick: Jedes Element ist sein eigenes Inverses, und beim Invertieren eines Produkts dreht sich die Reihenfolge um.")),
    KL(nu("$G$ hat $35$ Elemente, $H$ und $K$ sind Untergruppen mit $|H| = 5$ und $|K| = 7$. Wie viele Elemente hat $H \\cap K$?", 1,
      "$H \\cap K$ ist Untergruppe von $H$ und von $K$, ihre Ordnung teilt also $5$ und $7$. Sie ist $1$: $H \\cap K = \\{e\\}$.")),
    EX(tf("In jeder Gruppe haben $ab$ und $ba$ dieselbe Ordnung.", true,
      "$ba = a^{-1}(ab)a$, die Elemente sind konjugiert. Aus $(a^{-1}xa)^k = a^{-1}x^ka$ folgt: $(a^{-1}xa)^k = e$ genau dann, wenn $x^k = e$.")),
    EX(tf("Hat eine endliche Gruppe gerade Ordnung, so enthält sie ein Element der Ordnung $2$.", true,
      "Paare jedes $x$ mit $x \\ne x^{-1}$ mit seinem Inversen. Übrig bleiben die $x$ mit $x^2 = e$, ihre Anzahl ist gerade, weil $|G|$ gerade ist. Dazu gehört $e$, also mindestens ein weiteres Element.")),
    EX(tf("Eine endliche, nichtleere Teilmenge einer Gruppe, die unter der Verknüpfung abgeschlossen ist, ist eine Untergruppe.", true,
      "Für $a \\in H$ liegen alle Potenzen in $H$. Weil $H$ endlich ist, gilt $a^m = a^k$ mit $m > k$, also $a^{m-k} = e$ und $a^{-1} = a^{m-k-1} \\in H$. Für unendliche Teilmengen falsch: $\\mathbb{N} \\subset (\\mathbb{Z}, +)$.")),
    EX(tf("Jede Gruppe ist zu einer Untergruppe einer symmetrischen Gruppe isomorph.", true,
      "Satz von Cayley: $g \\mapsto (x \\mapsto gx)$ ordnet jedem Element eine Bijektion von $G$ zu. Das ist ein injektiver Homomorphismus in die Gruppe aller Bijektionen von $G$.")),
    EX(ch("Eine Gruppe mit $8$ Elementen ist nicht abelsch. Welche Aussage folgt?", "Sie hat ein Element der Ordnung $4$",
      [["Sie hat ein Element der Ordnung $8$", "Dann wäre sie zyklisch, also abelsch."], ["Alle Elemente $\\ne e$ haben Ordnung $2$", "Dann wäre sie abelsch, siehe $x^2 = e$ für alle $x$."], ["Sie hat ein Element der Ordnung $3$", "$3$ teilt $8$ nicht."]],
      "Die Ordnungen teilen $8$. Ordnung $8$ ist ausgeschlossen (zyklisch heißt abelsch), lauter Ordnungen $1$ und $2$ auch (dann abelsch). Es bleibt ein Element der Ordnung $4$. Beispiele: die Diedergruppe $D_4$ und die Quaternionengruppe.")),
  ]);

  // ---------------------------------------------------------------- la-homomorph (new)
  const HOM2 = [
    { md: "$\\det: \\mathrm{GL}_n(\\mathbb{R}) \\to (\\mathbb{R}\\setminus\\{0\\}, \\cdot)$", ok: true, why: "$\\det(AB) = \\det A \\det B$." },
    { md: "$\\exp: (\\mathbb{R}, +) \\to (\\mathbb{R}_{>0}, \\cdot)$", ok: true, why: "$e^{x + y} = e^x e^y$; sogar ein Isomorphismus." },
    { md: "$x \\mapsto x^2$ auf $(\\mathbb{R}\\setminus\\{0\\}, \\cdot)$", ok: true, why: "$(xy)^2 = x^2y^2$; Kern $\\{1, -1\\}$." },
    { md: "$x \\mapsto x^2$ auf $(\\mathbb{R}, +)$", ok: false, why: "$(1 + 1)^2 = 4 \\ne 1^2 + 1^2$." },
    { md: "$x \\mapsto x + 1$ auf $(\\mathbb{Z}, +)$", ok: false, why: "Ein Homomorphismus bildet $0$ auf $0$ ab, hier geht $0$ auf $1$." },
    { md: "$\\operatorname{sgn}: S_n \\to (\\{1, -1\\}, \\cdot)$", ok: true, why: "$\\operatorname{sgn}(\\sigma\\tau) = \\operatorname{sgn}\\sigma \\operatorname{sgn}\\tau$." },
    { md: "$A \\mapsto A^T$ auf $\\mathrm{GL}_2(\\mathbb{R})$", ok: false, why: "$(AB)^T = B^T A^T$, die Reihenfolge dreht sich um; für nicht vertauschende $A, B$ ist das nicht $A^T B^T$." },
    { md: "$x \\mapsto 3x$ auf $(\\mathbb{Z}, +)$", ok: true, why: "$3(x + y) = 3x + 3y$; injektiv, aber nicht surjektiv." },
  ];
  gen("la-homomorph", byLevels("Untergruppen und Homomorphismen", {
    1: [
      (lv, G) => {
        const n = G.pick([6, 8, 9, 10, 12, 14, 15, 16, 18, 20]), a = G.int(1, n - 1), o = n / gcd(a, n);
        return nu("Welche Ordnung hat $" + a + "$ in $(\\mathbb{Z}/" + n + "\\mathbb{Z}, +)$?", o,
          "Gesucht ist das kleinste $k \\ge 1$ mit $k \\cdot " + a + " \\equiv 0 \\pmod{" + n + "}$. Das ist $" + n + " / \\gcd(" + a + ", " + n + ") = " + n + "/" + gcd(a, n) + " = " + o + "$.");
      },
      (lv, G) => {
        const k = G.int(2, 6), c = G.chance(0.5) ? 0 : nz(G, -3, 3);
        return tf("$\\varphi: (\\mathbb{Z}, +) \\to (\\mathbb{Z}, +)$, $x \\mapsto " + k + "x" + (c ? " " + pm(c) : "") + "$ ist ein Homomorphismus.", c === 0,
          c === 0 ? "$" + k + "(x + y) = " + k + "x + " + k + "y$." : "Jeder Homomorphismus bildet das neutrale Element auf das neutrale Element ab, hier ist aber $\\varphi(0) = " + c + "$.");
      },
    ],
    2: [
      (lv, G) => {
        const n = G.pick([8, 9, 10, 12, 15, 18]), k = G.int(2, n - 1), g = gcd(k, n);
        const ker = range(0, n - 1).filter((x) => (k * x) % n === 0);
        return nu("$\\varphi: \\mathbb{Z}/" + n + "\\mathbb{Z} \\to \\mathbb{Z}/" + n + "\\mathbb{Z}$, $x \\mapsto " + k + "x$. Wie viele Elemente hat $\\ker \\varphi$?", ker.length,
          "$" + k + "x \\equiv 0$ heißt $" + n + " \\mid " + k + "x$, also $" + n / g + " \\mid x$. Der Kern ist $\\{" + ker.join(", ") + "\\}$ mit $\\gcd(" + k + ", " + n + ") = " + g + "$ Elementen.");
      },
      (lv, G) => { const h = G.pick(HOM2); return tf(h.md + " ist ein Gruppenhomomorphismus.", h.ok, h.why); },
    ],
    3: [
      (lv, G) => {
        const n = G.pick([12, 18, 24, 30, 36]);
        return nu("$|G| = " + n + "$, $H \\subsetneq G$ ist eine Untergruppe mit mehr als $" + n / 3 + "$ Elementen. Wie viele Elemente hat $H$?", n / 2,
          "$|H|$ teilt $" + n + "$, ist kleiner als $" + n + "$ und größer als $" + n / 3 + "$. Der einzige solche Teiler ist $" + n / 2 + "$.");
      },
      (lv, G) => {
        const n = G.pick([8, 9, 10, 12, 15, 18]), k = G.int(2, n - 1), im = n / gcd(k, n);
        return nu("$\\varphi: \\mathbb{Z}/" + n + "\\mathbb{Z} \\to \\mathbb{Z}/" + n + "\\mathbb{Z}$, $x \\mapsto " + k + "x$. Wie viele Elemente hat das **Bild**?", im,
          "Der Kern hat $\\gcd(" + k + ", " + n + ") = " + gcd(k, n) + "$ Elemente. Jede Faser ist eine Nebenklasse des Kerns, also $|\\operatorname{im}\\varphi| = " + n + "/" + gcd(k, n) + " = " + im + "$.");
      },
      (lv, G) => {
        const n = G.pick([8, 9, 10, 12, 14, 15, 16, 18, 20]);
        return nu("Wie viele Elemente **erzeugen** $(\\mathbb{Z}/" + n + "\\mathbb{Z}, +)$?", phi(n),
          "$a$ erzeugt genau dann, wenn seine Ordnung $" + n + "$ ist, also $\\gcd(a, " + n + ") = 1$: $\\varphi(" + n + ") = " + phi(n) + "$ Elemente.");
      },
    ],
    4: [
      KL((lv, G) => {
        const n = G.int(4, 15), m = G.int(4, 15);
        return nu("Wie viele Gruppenhomomorphismen $\\mathbb{Z}/" + n + "\\mathbb{Z} \\to \\mathbb{Z}/" + m + "\\mathbb{Z}$ gibt es?", gcd(n, m),
          "Ein Homomorphismus ist durch das Bild $y$ von $1$ festgelegt, und $y$ muss $" + n + "y \\equiv 0 \\pmod{" + m + "}$ erfüllen (weil $" + n + " \\cdot 1 = 0$). Das sind genau $\\gcd(" + n + ", " + m + ") = " + gcd(n, m) + "$ Werte.");
      }),
      KL(pr("Baue den Beweis.", "$\\varphi: G \\to H$ ist ein Gruppenhomomorphismus.", "$\\ker \\varphi$ ist eine Untergruppe von $G$.",
        ["$\\varphi(e_G) = e_H$, also liegt $e_G$ im Kern.", "Seien $a, b \\in \\ker\\varphi$.", "Dann $\\varphi(ab^{-1}) = \\varphi(a)\\varphi(b)^{-1} = e_H \\cdot e_H^{-1} = e_H$.", "Also $ab^{-1} \\in \\ker\\varphi$, nach dem Untergruppenkriterium ist der Kern eine Untergruppe."],
        [["$\\varphi(ab^{-1}) = \\varphi(a) - \\varphi(b)$", "In einer allgemeinen Gruppe gibt es kein Minus; es gilt $\\varphi(b^{-1}) = \\varphi(b)^{-1}$."], ["Weil $\\varphi$ injektiv ist, ist der Kern $\\{e\\}$.", "Injektivität ist nicht vorausgesetzt."]],
        "Untergruppenkriterium: nicht leer und mit $a, b$ auch $ab^{-1}$.")),
      KL(tf("Ist $\\varphi: G \\to H$ ein surjektiver Homomorphismus und $H$ abelsch, so ist $G$ abelsch.", false,
        "$\\operatorname{sgn}: S_3 \\to \\{1, -1\\}$ ist surjektiv, das Ziel ist abelsch, $S_3$ nicht. Umgekehrt stimmt es: Bilder abelscher Gruppen sind abelsch.")),
      KL(ch("Wie lautet der Kern von $\\varphi: \\mathbb{Z}/12\\mathbb{Z} \\to \\mathbb{Z}/12\\mathbb{Z}$, $x \\mapsto 4x$?", "$\\{0, 3, 6, 9\\}$",
        [["$\\{0, 4, 8\\}$", "Das ist das Bild von $\\varphi$."], ["$\\{0\\}$", "$4 \\cdot 3 = 12 \\equiv 0$, also liegt $3$ im Kern."], ["$\\{0, 6\\}$", "Auch $3$ und $9$ werden auf $0$ abgebildet."]],
        "$4x \\equiv 0 \\pmod{12}$ heißt $3 \\mid x$. Kern $\\{0, 3, 6, 9\\}$, Bild $\\{0, 4, 8\\}$, und $4 \\cdot 3 = 12$ wie im Homomorphiesatz.")),
      EX(nu("Wie viele Elemente der Ordnung $2$ hat $\\mathbb{Z}/2\\mathbb{Z} \\times \\mathbb{Z}/4\\mathbb{Z}$?", 3,
        "Die Ordnung von $(a, b)$ ist $\\operatorname{kgV}(\\operatorname{ord} a, \\operatorname{ord} b)$. Ordnung $2$: $(1, 0)$, $(0, 2)$, $(1, 2)$.")),
      EX(nu("Wie viele Elemente der Ordnung $6$ hat $\\mathbb{Z}/2\\mathbb{Z} \\times \\mathbb{Z}/6\\mathbb{Z}$?", 6,
        "$\\operatorname{kgV}(\\operatorname{ord} a, \\operatorname{ord} b) = 6$: entweder $b$ hat Ordnung $6$ ($b = 1, 5$, beliebiges $a$: $4$ Elemente) oder $b$ hat Ordnung $3$ ($b = 2, 4$) und $a = 1$: $2$ Elemente. Zusammen $6$.")),
      EX(tf("$(\\mathbb{Q}, +)$ und $(\\mathbb{Q}_{>0}, \\cdot)$ sind isomorph.", false,
        "In $(\\mathbb{Q}, +)$ ist jedes Element doppelt so groß wie ein anderes: $x = \\tfrac x2 + \\tfrac x2$. Ein Isomorphismus würde das übertragen: $2 = y \\cdot y$ mit $y \\in \\mathbb{Q}_{>0}$. Aber $\\sqrt 2$ ist irrational. Bei $\\mathbb{R}$ dagegen leistet $\\exp$ den Isomorphismus.")),
      EX(nu("$|G| = 100$ und $\\varphi: G \\to \\mathbb{Z}/7\\mathbb{Z}$ ist ein Homomorphismus. Wie viele Elemente hat $\\operatorname{im}\\varphi$?", 1,
        "$|\\operatorname{im}\\varphi| = |G| / |\\ker\\varphi|$ teilt $100$, und als Untergruppe von $\\mathbb{Z}/7\\mathbb{Z}$ teilt es $7$. Also ist es $1$: $\\varphi$ ist trivial.")),
      EX(tf("$\\mathbb{Z}/6\\mathbb{Z}$ ist isomorph zu $\\mathbb{Z}/2\\mathbb{Z} \\times \\mathbb{Z}/3\\mathbb{Z}$, aber $\\mathbb{Z}/4\\mathbb{Z}$ nicht zu $\\mathbb{Z}/2\\mathbb{Z} \\times \\mathbb{Z}/2\\mathbb{Z}$.", true,
        "$(1, 1)$ hat in $\\mathbb{Z}/2 \\times \\mathbb{Z}/3$ die Ordnung $\\operatorname{kgV}(2, 3) = 6$, die Gruppe ist zyklisch. In $\\mathbb{Z}/2 \\times \\mathbb{Z}/2$ hat jedes Element Ordnung höchstens $2$, in $\\mathbb{Z}/4$ hat $1$ die Ordnung $4$. Allgemein: $\\mathbb{Z}/m \\times \\mathbb{Z}/n \\cong \\mathbb{Z}/mn$ genau für teilerfremde $m, n$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-perm (new)
  const P = LW.uni.perm;
  gen("la-perm", byLevels("Permutationen und Signum", {
    1: [
      (lv, G) => { const k = G.int(2, 7); return nu("Welches Signum hat ein Zyklus der Länge $" + k + "$?", k % 2 ? 1 : -1, "Ein $k$-Zyklus ist ein Produkt von $k - 1$ Transpositionen: $(a_1\\,\\dots\\,a_k) = (a_1\\,a_k)\\cdots(a_1\\,a_2)$. Signum $(-1)^{" + (k - 1) + "} = " + (k % 2 ? 1 : -1) + "$.", { placeholder: "1 oder -1" }); },
      (lv, G) => { const n = G.int(3, 7); return nu("Wie viele Elemente hat $S_" + n + "$?", G.fact(n), "Für das Bild von $1$ gibt es $" + n + "$ Möglichkeiten, für das von $2$ noch $" + (n - 1) + "$ und so weiter: $" + n + "! = " + G.fact(n) + "$."); },
      (lv, G) => {
        const p = P.randPerm(G, 5), i = G.int(1, 5);
        return nu("$\\sigma = " + P.cycTex(p) + " \\in S_5$. Bestimme $\\sigma(" + i + ")$.", p[i - 1], "In einem Zyklus geht jede Zahl auf die nächste, die letzte auf die erste; Zahlen, die nicht vorkommen, bleiben fest. Also $\\sigma(" + i + ") = " + p[i - 1] + "$.");
      },
    ],
    2: [
      (lv, G) => {
        const s = P.randPerm(G, 4), t = P.randPerm(G, 4), i = G.int(1, 4), st = P.compose(s, t);
        return nu("$\\sigma = " + P.permTex(s) + "$, $\\tau = " + P.permTex(t) + "$. Bestimme $(\\sigma \\circ \\tau)(" + i + ")$.", st[i - 1],
          "Zuerst $\\tau$, dann $\\sigma$: $\\tau(" + i + ") = " + t[i - 1] + "$ und $\\sigma(" + t[i - 1] + ") = " + st[i - 1] + "$.", { hint: "$\\sigma \\circ \\tau$ heißt: erst $\\tau$ anwenden." });
      },
      (lv, G) => {
        const s = P.randPerm(G, 5), i = G.int(1, 5), j = s.indexOf(i) + 1;
        return nu("$\\sigma = " + P.permTex(s) + "$. Bestimme $\\sigma^{-1}(" + i + ")$.", j, "Gesucht ist die Zahl, die auf $" + i + "$ geht: Sie steht in der oberen Zeile über der $" + i + "$, also $\\sigma(" + j + ") = " + i + "$ und $\\sigma^{-1}(" + i + ") = " + j + "$.");
      },
    ],
    3: [
      (lv, G) => {
        const s = P.randPerm(G, G.pick([5, 6])), sg = P.sign(s);
        return nu("Bestimme das Signum von $\\sigma = " + P.permTex(s) + "$.", sg,
          "Zyklenzerlegung $\\sigma = " + P.cycTex(s) + "$. Ein $k$-Zyklus trägt $(-1)^{k-1}$ bei, das Produkt ist $" + sg + "$.", { placeholder: "1 oder -1", hint: "Zerlege in disjunkte Zyklen." });
      },
      (lv, G) => {
        const parts = G.pick([[2, 3], [3, 4], [2, 5], [4, 2], [2, 2, 3], [3, 5], [2, 6], [4, 4], [2, 3, 3]]);
        const n = parts.reduce((a, b) => a + b, 0);
        const els = G.shuffle(range(1, n));
        const cs = []; let k = 0;
        for (const len of parts) { cs.push(els.slice(k, k + len)); k += len; }
        const p = P.fromCycles(n, cs);
        return nu("Welche Ordnung hat $\\sigma = " + P.cycTex(p) + "$?", P.order(p), "Disjunkte Zyklen vertauschen, $\\sigma^k = \\mathrm{id}$ genau dann, wenn $k$ von jeder Zyklenlänge geteilt wird: $\\operatorname{kgV}(" + parts.join(", ") + ") = " + P.order(p) + "$.");
      },
      (lv, G) => {
        const n = G.int(4, 6), k = G.int(2, n);
        const cnt = G.fact(n) / (G.fact(n - k) * k);
        return nu("Wie viele $" + k + "$-Zyklen gibt es in $S_" + n + "$?", cnt, "Geordnete Auswahl von $" + k + "$ Zahlen: $" + n + "!/" + (n - k) + "!$. Jeder Zyklus lässt sich mit jedem seiner $" + k + "$ Elemente beginnen: geteilt durch $" + k + "$, also $" + cnt + "$.");
      },
    ],
    4: [
      KL(nu("Wie viele Elemente der Ordnung $2$ hat $S_4$?", 9, "Ordnung $2$ heißt: lauter disjunkte Transpositionen. $\\binom42 = 6$ Transpositionen und $\\tfrac12\\binom42 = 3$ Doppeltranspositionen wie $(1\\,2)(3\\,4)$: zusammen $9$.")),
      KL(tf("Jede Permutation ist ein Produkt von Transpositionen, und die Anzahl der Faktoren ist eindeutig bestimmt.", false,
        "Eindeutig ist nur, ob die Anzahl gerade oder ungerade ist: $(1\\,2\\,3) = (1\\,3)(1\\,2) = (1\\,2)(1\\,3)(1\\,2)(1\\,3)$. Genau deshalb ist das Signum wohldefiniert, die Anzahl selbst nicht.")),
      KL((lv, G) => {
        const n = G.int(4, 10), e = (n * (n - 1)) / 2;
        return nu("Welches Signum hat die Umkehrpermutation $i \\mapsto " + (n + 1) + " - i$ in $S_{" + n + "}$?", e % 2 ? -1 : 1,
          "Jedes Paar $i < j$ wird vertauscht: $\\binom{" + n + "}{2} = " + e + "$ Fehlstände. Signum $(-1)^{" + e + "} = " + (e % 2 ? -1 : 1) + "$.", { placeholder: "1 oder -1" });
      }),
      KL(tf("Die ungeraden Permutationen bilden eine Untergruppe von $S_n$.", false, "Die Identität ist gerade, und das Produkt zweier ungerader Permutationen ist gerade. Die geraden Permutationen bilden dagegen eine Untergruppe, die alternierende Gruppe $A_n$ mit $n!/2$ Elementen.")),
      KL(ch("Man setzt $\\operatorname{sgn}(\\sigma) = (-1)^k$, wenn $\\sigma$ ein Produkt von $k$ Transpositionen ist. Was muss man zeigen, damit das eine Definition ist?",
        "Zwei Zerlegungen derselben Permutation haben Anzahlen gleicher Parität",
        [["Die Zerlegung in Transpositionen ist eindeutig", "Sie ist es nicht: $(1\\,2\\,3) = (1\\,3)(1\\,2) = (1\\,2)(2\\,3)$."], ["Jede Permutation ist eine Transposition", "Ein $3$-Zyklus ist keine."], ["$k$ ist immer gerade", "Eine Transposition hat $k = 1$."]],
        "Man zeigt meist: $\\operatorname{sgn}$ über Fehlstände ist multiplikativ, und eine Transposition hat Signum $-1$. Daraus folgt die Paritätsaussage.")),
      EX(nu("Wie viele Elemente der Ordnung $2$ hat $S_6$?", 75, "Typen $(2)$: $15$; $(2, 2)$: $\\tfrac{15 \\cdot 6}{2} = 45$; $(2, 2, 2)$: $\\tfrac{15 \\cdot 6 \\cdot 1}{3!} = 15$. Zusammen $75$.")),
      EX(nu("Wie viele Elemente der Ordnung $6$ hat $S_5$?", 20, "In $S_5$ geht Ordnung $6$ nur mit einem $3$-Zyklus und einer disjunkten Transposition: $\\binom53 \\cdot 2 = 20$ Dreierzyklen, die Transposition auf den übrigen zwei Zahlen ist dann festgelegt.")),
      EX(nu("Welche größte Ordnung hat ein Element von $S_7$?", 12, "Die Ordnung ist das kgV der Zyklenlängen, die Längen summieren sich zu höchstens $7$. $4 + 3$ liefert $12$; $5 + 2$ nur $10$, $7$ nur $7$, $3 + 2 + 2$ nur $6$.")),
      EX(ch("$\\sigma = (1\\,2\\,3\\,4\\,5\\,6)$. Welchen Zyklentyp hat $\\sigma^2$?", "Zwei $3$-Zyklen: $(1\\,3\\,5)(2\\,4\\,6)$",
        [["Ein $6$-Zyklus", "$\\sigma^2$ hat die Ordnung $3$."], ["Drei Transpositionen", "Das ist $\\sigma^3 = (1\\,4)(2\\,5)(3\\,6)$."], ["Ein $3$-Zyklus und drei Fixpunkte", "$\\sigma^2$ hat keinen Fixpunkt."]],
        "$\\sigma^2$ springt um zwei Stellen weiter: Die geraden und die ungeraden Zahlen bilden je einen Zyklus.")),
      EX(tf("$S_n$ wird von $(1\\,2)$ und $(1\\,2\\,\\cdots\\,n)$ erzeugt.", true,
        "Konjugieren mit Potenzen des $n$-Zyklus verschiebt $(1\\,2)$ zu $(2\\,3), (3\\,4), \\dots$ Benachbarte Transpositionen erzeugen $S_n$, wie beim Sortieren durch Vertauschen von Nachbarn.")),
      EX(tf("Zwei Permutationen sind in $S_n$ genau dann konjugiert, wenn sie denselben Zyklentyp haben.", true,
        "$\\tau\\sigma\\tau^{-1}$ entsteht aus $\\sigma$, indem man in der Zyklenschreibweise jede Zahl $i$ durch $\\tau(i)$ ersetzt. Das erhält den Zyklentyp; umgekehrt bildet ein passendes $\\tau$ die Zyklen aufeinander ab.")),
    ],
  }));

  // ---------------------------------------------------------------- la-polynom (new)
  gen("la-polynom", byLevels("Polynome", {
    1: [
      (lv, G) => {
        const c = [G.int(-5, 5), G.int(-4, 4), G.int(-3, 3), nz(G, -2, 3)], a = G.int(-3, 3), r = peval(c, a);
        return nu("Welchen Rest lässt $p(x) = " + poly(c) + "$ bei Division durch $x " + pm(-a) + "$?", r,
          "Division mit Rest: $p(x) = q(x)(x - " + par(a) + ") + r$ mit konstantem $r$. Setzt man $x = " + a + "$ ein, fällt der erste Summand weg: $r = p(" + a + ") = " + r + "$.");
      },
      (lv, G) => { const a = G.int(1, 6), b = G.int(1, 6); return nu("Über einem Körper ist $\\deg p = " + a + "$ und $\\deg q = " + b + "$. Welchen Grad hat $pq$?", a + b, "Die Leitkoeffizienten multiplizieren sich, und in einem Körper ist ihr Produkt nicht $0$. Also $\\deg(pq) = " + a + " + " + b + " = " + (a + b) + "$. In $\\mathbb{Z}/6\\mathbb{Z}$ ginge das schief: $(2x)(3x) = 0$."); },
    ],
    2: [
      (lv, G) => {
        const a = G.int(-3, 3), b = G.int(-3, 3), dbl = G.chance(0.5);
        const roots = dbl ? [a, a, b] : [a, b === a ? a + 1 : b, G.int(-3, 3)];
        let c = [1];
        for (const r of roots) { const n = new Array(c.length + 1).fill(0); c.forEach((x, i) => { n[i + 1] += x; n[i] -= r * x; }); c = n; }
        const mult = roots.filter((r) => r === a).length;
        return tf("$" + a + "$ ist eine **mehrfache** Nullstelle von $p(x) = " + poly(c) + "$.", mult >= 2,
          "Mehrfach heißt $p(" + a + ") = p'(" + a + ") = 0$. Hier ist $p = " + roots.map((r) => "(x " + pm(-r) + ")").join("") + "$, die Nullstelle $" + a + "$ kommt " + (mult >= 2 ? mult + "-mal" : "nur einfach") + " vor.");
      },
      (lv, G) => {
        const r = G.pick([-2, -1, 1, 2]), c2 = G.int(-4, 4), c1 = G.int(-5, 5);
        const c0 = -(r * r * r + c2 * r * r + c1 * r);
        return nu("Für welches $a$ ist $x " + pm(-r) + "$ ein Teiler von $x^3 + a x^2 " + pm(c1) + "x " + pm(c0) + "$?", c2,
          "$x - " + par(r) + "$ teilt genau dann, wenn $" + par(r) + "$ Nullstelle ist: $" + r * r * r + " + " + r * r + "a " + pm(c1 * r) + " " + pm(c0) + " = 0$, also $a = " + c2 + "$.");
      },
    ],
    3: [
      (lv, G) => {
        const c = [G.int(-4, 4), G.int(-3, 3), G.int(-3, 3), nz(G, -2, 2)];
        const a = G.int(-2, 1), b = a + G.int(1, 3), pa = peval(c, a), pb = peval(c, b);
        const s = (pa - pb) / (a - b), t = pa - s * a;
        return { type: "cloze", md: "Bestimme den Rest von $p(x) = " + poly(c) + "$ bei Division durch $(x " + pm(-a) + ")(x " + pm(-b) + ")$.\n\nRest $=$ {{0}} $x\\ +$ {{1}}", blanks: [blank(s), blank(t)],
          hint: "Der Rest $r(x) = sx + t$ stimmt an den Nullstellen des Teilers mit $p$ überein.",
          explain: "$r(" + a + ") = p(" + a + ") = " + pa + "$ und $r(" + b + ") = p(" + b + ") = " + pb + "$. Daraus $s = \\tfrac{" + pa + " - " + par(pb) + "}{" + a + " - " + par(b) + "} = " + s + "$ und $t = " + t + "$." };
      },
      ...pool("Verständnis", [
        { ok: true, md: "Über $\\mathbb{F}_2$ ist $x^2 + x$ als Funktion die Nullfunktion.", why: "$0^2 + 0 = 0$ und $1^2 + 1 = 0$. Als Polynom ist es trotzdem nicht null: Polynome und Polynomfunktionen sind über endlichen Körpern verschieden." },
        { ok: true, md: "Ein Polynom vom Grad $n \\ge 1$ über einem Körper hat höchstens $n$ Nullstellen.", why: "Jede Nullstelle $a$ spaltet $x - a$ ab und senkt den Grad um $1$; ohne Nullteiler kann ein Produkt nur null sein, wenn ein Faktor null ist." },
        { ok: false, md: "Über $\\mathbb{F}_2$ ist $x^2 + 1$ irreduzibel.", why: "$x^2 + 1 = (x + 1)^2$, denn $2x = 0$. Die Nullstelle ist $1$." },
        { ok: true, md: "$x^2 - 2$ ist über $\\mathbb{Q}$ irreduzibel.", why: "Ein Polynom vom Grad $2$ zerfällt genau dann, wenn es eine Nullstelle hat; $\\pm\\sqrt2$ sind irrational." },
        { ok: false, md: "$x^4 + 1$ ist über $\\mathbb{R}$ irreduzibel.", why: "$x^4 + 1 = (x^2 + \\sqrt2 x + 1)(x^2 - \\sqrt2 x + 1)$. Über $\\mathbb{R}$ sind nur Grad $1$ und Grad $2$ ohne Nullstelle irreduzibel." },
        { ok: true, md: "Jedes reelle Polynom ungeraden Grades hat eine reelle Nullstelle.", why: "Es geht für $x \\to \\pm\\infty$ gegen verschiedene Vorzeichen, nach dem Zwischenwertsatz hat es dazwischen eine Nullstelle." },
        { ok: false, md: "In $\\mathbb{Z}/6\\mathbb{Z}$ hat $x^2 - x$ höchstens zwei Nullstellen.", why: "$0, 1, 3, 4$ sind Nullstellen: $3 \\cdot 2 = 6 \\equiv 0$, $4 \\cdot 3 = 12 \\equiv 0$. Ohne Körper gilt die Schranke nicht." },
      ], ["tf", "multi"], 3),
    ],
    4: [
      KL(ch("Welches Polynom ist über $\\mathbb{F}_2$ irreduzibel?", "$x^2 + x + 1$",
        [["$x^2 + 1$", "$= (x + 1)^2$ über $\\mathbb{F}_2$."], ["$x^2 + x$", "$= x(x + 1)$."], ["$x^3 + 1$", "$= (x + 1)(x^2 + x + 1)$, Nullstelle $1$."]],
        "Ein Polynom vom Grad $2$ oder $3$ ist genau dann irreduzibel, wenn es keine Nullstelle hat. $x^2 + x + 1$ hat bei $0$ und $1$ den Wert $1$.")),
      KL(nu("Wie viele Nullstellen hat $x^2 - x$ in $\\mathbb{Z}/6\\mathbb{Z}$?", 4, "$x(x - 1) \\equiv 0 \\pmod 6$ für $x = 0, 1, 3, 4$. Mehr als der Grad, weil $\\mathbb{Z}/6\\mathbb{Z}$ Nullteiler hat.")),
      KL(tf("Ist $z \\in \\mathbb{C}$ Nullstelle eines Polynoms mit reellen Koeffizienten, so auch $\\bar z$.", true, "$p(\\bar z) = \\overline{p(z)} = \\bar 0 = 0$, weil Konjugieren mit Summen und Produkten vertauscht und reelle Koeffizienten festlässt.")),
      KL(tf("Ein reelles Polynom vom Grad $4$ ohne reelle Nullstelle ist irreduzibel.", false, "$(x^2 + 1)^2$ und $x^4 + 1$ haben keine reelle Nullstelle und zerfallen doch in zwei quadratische Faktoren.")),
      KL(ch("Was ist $\\gcd(x^3 - 1, x^2 - 1)$ in $\\mathbb{Q}[x]$?", "$x - 1$",
        [["$1$", "Beide haben die Nullstelle $1$."], ["$x^2 - 1$", "$x^2 - 1$ teilt $x^3 - 1$ nicht: $-1$ ist keine Nullstelle von $x^3 - 1$."], ["$(x - 1)^2$", "$1$ ist nur einfache Nullstelle von $x^3 - 1$."]],
        "$x^3 - 1 = (x - 1)(x^2 + x + 1)$ und $x^2 - 1 = (x - 1)(x + 1)$. Gemeinsam ist nur $x - 1$.")),
      EX((lv, G) => { const p = G.pick([2, 3, 5, 7]); return nu("Wie viele **normierte irreduzible** Polynome vom Grad $2$ gibt es über $\\mathbb{F}_" + p + "$?", (p * p - p) / 2, "Normiert vom Grad $2$: $" + p * p + "$ Stück. Reduzibel sind die $(x - a)(x - b)$: $" + p + "$ mit $a = b$ und $\\binom{" + p + "}{2}$ mit $a \\ne b$, zusammen $" + (p * p + p) / 2 + "$. Es bleiben $" + (p * p - p) / 2 + "$."); }),
      EX((lv, G) => { const p = G.pick([2, 3, 5]); return nu("Wie viele verschiedene **Polynomfunktionen** $\\mathbb{F}_" + p + " \\to \\mathbb{F}_" + p + "$ gibt es?", Math.pow(p, p), "Jede Funktion $\\mathbb{F}_" + p + " \\to \\mathbb{F}_" + p + "$ ist eine Polynomfunktion (Lagrange-Interpolation), es gibt $" + p + "^{" + p + "} = " + Math.pow(p, p) + "$ Funktionen. Die unendlich vielen Polynome liefern also nur endlich viele Funktionen, etwa $x^" + p + "$ und $x$ dieselbe."); }),
      EX(tf("Über $\\mathbb{Q}$ ist $x^4 + 4$ irreduzibel.", false, "$x^4 + 4 = (x^2 + 2x + 2)(x^2 - 2x + 2)$ (Sophie Germain). Ausmultiplizieren: Die Terme $\\pm 2x^3$, $2x^2 + 2x^2 - 4x^2$ und $\\pm 4x$ heben sich weg.")),
      EX(tf("Über $\\mathbb{F}_p$ ist $x^p - x$ als Funktion null, als Polynom aber nicht.", true, "Kleiner Fermat: $a^p = a$ für alle $a \\in \\mathbb{F}_p$. Das Polynom hat Grad $p$ und genau die $p$ Elemente als Nullstellen: $x^p - x = \\prod_{a \\in \\mathbb{F}_p} (x - a)$.")),
    ],
  }));
})();
