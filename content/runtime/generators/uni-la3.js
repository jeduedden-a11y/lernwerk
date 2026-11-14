/* Lineare Algebra I in depth, part 3: linear systems with parameters, elementary matrices, determinants, eigenvalues,
 * diagonalisation, Cayley-Hamilton, inner products and orthogonality. Helpers come from uni-la1.js (LW.uni). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const U = LW.uni;
  const { gcd, range, vec, mat, det2, det3, detN, mulMV, mulMM, transpose, rankOf, nz, par, pm, blank, tf, ch, mu, nu, pr, KL, EX, VS, demote, expert, byLevels } = U;
  const tr = (A) => A.reduce((s, r, i) => s + r[i], 0);
  const frac = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q) || 1; p /= g; q /= g; return q === 1 ? String(p) : (p < 0 ? "-" : "") + "\\tfrac{" + Math.abs(p) + "}{" + q + "}"; };
  function unimod(G) {
    const a = G.int(-2, 2), b = G.int(-2, 2);
    let M = mulMM([[1, a], [0, 1]], [[1, 0], [b, 1]]);
    if (G.chance(0.4)) M = mulMM(M, [[0, 1], [1, 0]]);
    return M;
  }
  const inv2 = (M) => { const d = det2(M); return [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]].map((r) => r.map((v) => (Object.is(v, -0) ? 0 : v))); };
  /** 2x2 integer matrix with prescribed integer eigenvalues l1, l2 (A = P diag P^-1, P unimodular). */
  function withEigen(G, l1, l2) { const P = unimod(G); return { A: mulMM(mulMM(P, [[l1, 0], [0, l2]]), inv2(P)).map((r) => r.map((v) => Math.round(v))), P }; }
  const eq3 = (r, b) => { const n = ["x", "y", "z"]; let s = ""; r.forEach((c, i) => { if (!c) return; const a = Math.abs(c); s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + (a === 1 ? "" : a) + n[i]; }); return (s || "0") + " &= " + b; };

  // ---------------------------------------------------------------- la-gauss: deeper
  demote("la-gauss");
  expert("la-gauss", [
    KL(ch("Für welches $a$ hat $\\begin{aligned} x + y + az &= 1 \\\\ x + ay + z &= 1 \\\\ ax + y + z &= 1 \\end{aligned}$ **keine** Lösung?", "$a = -2$",
      [["$a = 1$", "Dann sind alle drei Gleichungen $x + y + z = 1$: unendlich viele Lösungen."], ["$a = 0$", "Die Determinante $-(a - 1)^2(a + 2)$ ist dann $-2 \\ne 0$: genau eine Lösung."], ["für kein $a$", "Bei $a = -2$ entsteht ein Widerspruch."]],
      "Addiert man alle Gleichungen: $(a + 2)(x + y + z) = 3$. Für $a = -2$ steht da $0 = 3$. Die Determinante ist $-(a - 1)^2(a + 2)$: Für $a \\notin \\{1, -2\\}$ genau eine Lösung, für $a = 1$ unendlich viele (zwei freie Parameter).")),
    KL(tf("Ein homogenes LGS mit mehr Unbekannten als Gleichungen hat eine Lösung $\\ne 0$.", true, "Der Rang ist höchstens die Zahl der Gleichungen, also kleiner als die Zahl der Unbekannten; der Kern hat Dimension $\\ge 1$.")),
    KL(tf("Ein LGS mit mehr Gleichungen als Unbekannten hat keine Lösung.", false, "Überbestimmte Systeme können lösbar sein: $x = 1$, $2x = 2$, $3x = 3$. Entscheidend ist, ob $b$ im Spaltenraum liegt.")),
    KL((lv, G) => { const m = G.int(2, 5), n = m + G.int(1, 4); return nu("$A \\in \\mathbb{R}^{" + m + " \\times " + n + "}$ hat Rang $" + m + "$. Welche Dimension hat die Lösungsmenge von $Ax = b$ für ein beliebiges $b$?", n - m, "Rang $= " + m + "$ = Zeilenzahl: $Ax = b$ ist für jedes $b$ lösbar. Die Lösungsmenge ist $x_0 + \\ker A$ mit $\\dim\\ker A = " + n + " - " + m + " = " + (n - m) + "$."); }),
    EX(tf("Gibt es ein $b$, für das $Ax = b$ genau zwei Lösungen hat?", false, "Lösungsmengen sind leer oder von der Form $x_0 + \\ker A$: eine Lösung oder unendlich viele (über $\\mathbb{R}$). Über $\\mathbb{F}_2$ dagegen kann es genau zwei geben, wenn $\\dim\\ker A = 1$.")),
    EX((lv, G) => { const p = G.pick([2, 3, 5, 7]), r = G.pick([1, 2]); return nu("Wie viele Lösungen in $\\mathbb{F}_" + p + "^3$ hat ein **lösbares** LGS in drei Unbekannten vom Rang $" + r + "$?", Math.pow(p, 3 - r), "Die Lösungsmenge ist $x_0 + \\ker A$ mit $\\dim\\ker A = 3 - " + r + "$, und ein Raum der Dimension $" + (3 - r) + "$ über $\\mathbb{F}_" + p + "$ hat $" + p + "^{" + (3 - r) + "} = " + Math.pow(p, 3 - r) + "$ Elemente."); }),
    EX(ch("Über welchem Körper hat $x + y = 1$, $x - y = 1$ **nicht** genau eine Lösung?", "$\\mathbb{F}_2$",
      [["$\\mathbb{R}$", "Dort ist $(1, 0)$ die einzige Lösung."], ["$\\mathbb{F}_3$", "Die Determinante $-2 \\equiv 1$ ist nicht null."], ["$\\mathbb{Q}$", "Wie über $\\mathbb{R}$."]],
      "Die Determinante ist $-2$. In Charakteristik $2$ ist sie $0$: Dort ist $-1 = 1$, beide Gleichungen sind gleich, und es gibt zwei Lösungen, $(1, 0)$ und $(0, 1)$.")),
    EX(tf("Hat $Ax = b$ für ein $b$ genau eine Lösung, so hat $Ax = c$ für jedes $c$ höchstens eine Lösung.", true, "Genau eine Lösung heißt $\\ker A = \\{0\\}$, und das hängt nicht von der rechten Seite ab.")),
  ]);

  if (LW.generators["la-loesungsmenge"]) {
    demote("la-loesungsmenge");
    expert("la-loesungsmenge", [
      KL(tf("Sind $x_1$ und $x_2$ Lösungen von $Ax = b$, so ist auch $x_1 + x_2$ eine Lösung.", false, "$A(x_1 + x_2) = 2b$. Eine Lösung von $Ax = b$ ist $x_1 + x_2$ nur für $b = 0$.")),
      KL(tf("Sind $x_1$ und $x_2$ Lösungen von $Ax = b$, so auch $\\tfrac12(x_1 + x_2)$ und $3x_1 - 2x_2$.", true, "Affine Kombinationen (Koeffizientensumme $1$) bleiben Lösungen: $A(\\lambda x_1 + \\mu x_2) = (\\lambda + \\mu)b = b$.")),
      KL(tf("Die Differenz zweier Lösungen von $Ax = b$ löst $Ax = 0$.", true, "$A(x_1 - x_2) = b - b = 0$. Deshalb ist die Lösungsmenge $x_0 + \\ker A$.")),
      KL((lv, G) => { const n = G.int(3, 7), r = G.int(1, n - 1), p = G.int(2, 4); return nu("$A \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ hat Rang $" + r + "$. Welche Dimension hat $\\{B \\in \\mathbb{R}^{" + n + " \\times " + p + "} : AB = 0\\}$?", p * (n - r), "Jede der $" + p + "$ Spalten von $B$ muss im Kern von $A$ liegen, und der hat Dimension $" + (n - r) + "$: insgesamt $" + p + " \\cdot " + (n - r) + " = " + p * (n - r) + "$."); }),
      EX(tf("Jede Menge der Form $v + U$ ($U$ ein Unterraum des $\\mathbb{R}^n$) ist die Lösungsmenge eines linearen Gleichungssystems.", true, "Wähle $A$ mit $\\ker A = U$ (etwa aus einer Basis des Annullators von $U$) und setze $b = Av$.")),
      EX(tf("Die Lösungsmenge von $Ax = b$ mit $b \\ne 0$ kann ein Unterraum sein.", false, "Ein Unterraum enthält $0$, aber $A0 = 0 \\ne b$.")),
    ]);
  }

  // ---------------------------------------------------------------- la-elementar (new)
  gen("la-elementar", byLevels("Elementarmatrizen", {
    1: [(lv, G) => {
      const d = nz(G, -6, 6), n = G.pick([3, 4]), k = G.pick(["swap", "scale", "add"]), c = G.pick([2, 3, -1, -2, 5]);
      const q = { swap: ["vertauscht man zwei Zeilen", -d, "Eine Vertauschung ändert das Vorzeichen."], scale: ["multipliziert man eine Zeile mit $" + c + "$", c * d, "Die Determinante ist linear in jeder Zeile: Faktor $" + c + "$."], add: ["addiert man das $" + c + "$-fache einer Zeile zu einer anderen", d, "Das ändert die Determinante nicht."] }[k];
      return nu("$A \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ hat $\\det A = " + d + "$. Dann " + q[0] + ". Welche Determinante hat die neue Matrix?", q[1], q[2] + " Ergebnis $" + q[1] + "$.");
    }],
    2: [(lv, G) => {
      const c = nz(G, -4, 4), i = G.int(1, 3); let j; do { j = G.int(1, 3); } while (j === i);
      const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; E[i - 1][j - 1] = c;
      return nu("$E = " + mat(E) + "$. Welcher Eintrag steht in $E^{-1}$ an der Stelle $(" + i + ", " + j + ")$?", -c,
        "Links mit $E$ multiplizieren heißt: das $" + c + "$-fache von Zeile " + j + " zu Zeile " + i + " addieren. Rückgängig macht man das, indem man es wieder abzieht: Eintrag $" + -c + "$.");
    }],
    3: [(lv, G) => {
      const a = G.int(-3, 3), b = G.int(-3, 3), c = G.int(-3, 3);
      const I = [[1, -a, a * c - b], [0, 1, -c], [0, 0, 1]];
      return { type: "cloze", md: "Bestimme $" + mat([[1, a, b], [0, 1, c], [0, 0, 1]]) + "^{-1}$. Die Einträge über der Diagonale (Stellen $(1,2)$, $(1,3)$, $(2,3)$):\n\n{{0}} {{1}} {{2}}",
        blanks: [blank(I[0][1]), blank(I[0][2]), blank(I[1][2])], hint: "Gauß-Jordan mit $[A \\mid E]$, von unten nach oben eliminieren.",
        explain: "$A^{-1} = " + mat(I) + "$. Probe: $(1, 3)$-Eintrag von $AA^{-1}$: $1 \\cdot (" + (a * c - b) + ") + " + par(a) + " \\cdot " + par(-c) + " + " + par(b) + " \\cdot 1 = 0$." };
    }],
    4: [
      KL(tf("Jede invertierbare Matrix ist ein Produkt von Elementarmatrizen.", true, "Gauß-Jordan bringt $A$ mit Elementarmatrizen auf $E$: $E_k \\cdots E_1 A = E$. Dann $A = E_1^{-1} \\cdots E_k^{-1}$, und Inverse von Elementarmatrizen sind Elementarmatrizen.")),
      KL(tf("Multipliziert man $A$ von **rechts** mit einer Elementarmatrix, so wird eine Zeilenumformung ausgeführt.", false, "Von rechts wirken Elementarmatrizen auf die **Spalten**, von links auf die Zeilen.")),
      KL(ch("Warum steht nach Gauß-Jordan auf $[A \\mid E]$ rechts $A^{-1}$?", "Dieselben Umformungen $P = E_k \\cdots E_1$ machen links $PA = E$, also $P = A^{-1}$, und rechts steht $PE = P$",
        [["Weil man rechts dieselben Zahlen wie links eintragen muss", "Links und rechts stehen verschiedene Matrizen."], ["Weil $A^{-1} = A^T$ ist", "Das gilt nur für orthogonale Matrizen."], ["Weil Zeilenumformungen die Matrix nicht ändern", "Sie ändern sie, aber nicht den Lösungsraum."]],
        "Alle Zeilenumformungen zusammen sind die Multiplikation mit einer Matrix $P$. Wird links $E$ daraus, ist $P$ die Inverse.")),
      EX(tf("Jede reelle Matrix mit Determinante $1$ ist ein Produkt von Additionsmatrizen $E + cE_{ij}$ ($i \\ne j$).", true, "Mit Additionen allein kann man schon Zeilen vertauschen (bis auf Vorzeichen) und auf Diagonalgestalt bringen; mit $\\det = 1$ bleibt am Ende $E$. $\\mathrm{SL}_n$ wird von den Scherungen erzeugt.")),
      EX(tf("Jede invertierbare Matrix besitzt eine LR-Zerlegung $A = LR$ ohne Zeilenvertauschungen.", false, "$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$: Das Pivot oben links ist $0$. Aus $A = LR$ folgte $l_{11}r_{11} = 0$, dann wäre $L$ oder $R$ singulär. Man braucht $PA = LR$ mit einer Permutation.")),
      EX(nu("Wie viele Elementarmatrizen vom Typ »Vertauschung zweier Zeilen« gibt es für $5 \\times 5$-Matrizen?", 10, "Eine pro Paar von Zeilen: $\\binom52 = 10$. Jede hat Determinante $-1$ und ist ihr eigenes Inverses.")),
    ],
  }));

  // ---------------------------------------------------------------- la-lgsparam (new)
  gen("la-lgsparam", byLevels("Gleichungssysteme mit Parametern", {
    1: [(lv, G) => {
      const a = nz(G, -4, 4), k = G.pick([2, 3, -1, -2]);
      return nu("Für welches $t$ ist $\\begin{aligned} x " + pm(a) + "y &= 1 \\\\ " + k + "x + t\\,y &= 2 \\end{aligned}$ **nicht** eindeutig lösbar?", k * a,
        "Nicht eindeutig heißt $\\det = t - " + par(k * a) + " = 0$: Die zweite Zeile links ist dann das $" + k + "$-fache der ersten.");
    }],
    2: [(lv, G) => {
      const p = nz(G, 1, 3), q = nz(G, -3, 3), k = G.pick([2, 3, -1]), c = G.int(-4, 4), d = k * c + G.pick([-2, -1, 1, 2]);
      return nu("Für welches $t$ hat $\\begin{aligned} " + (p === 1 ? "" : p) + "x " + pm(q) + "y &= " + c + " \\\\ " + k * p + "x + t\\,y &= " + d + " \\end{aligned}$ **keine** Lösung?", k * q,
        "Für $t = " + k * q + "$ ist die linke Seite der zweiten Gleichung das $" + k + "$-fache der ersten, rechts steht aber $" + d + " \\ne " + k * c + "$: Widerspruch. Für jedes andere $t$ gibt es genau eine Lösung.");
    }],
    3: [(lv, G) => {
      let r1, r2; do { r1 = [1, G.int(-2, 2), G.int(-2, 2)]; r2 = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; } while (r1[0] * r2[1] - r1[1] * r2[0] === 0);
      const a = G.int(-2, 2), b = nz(G, -2, 2), r3 = r1.map((x, i) => a * x + b * r2[i]);
      const b1 = G.int(-3, 3), b2 = G.int(-3, 3), inf = G.chance(0.5), b3 = a * b1 + b * b2 + (inf ? 0 : G.pick([-2, -1, 1, 2]));
      const t0 = r3[2];
      return { type: "choice", md: "Was gilt für $t = " + t0 + "$?\n\n$$\\begin{aligned} " + eq3(r1, b1) + " \\\\ " + eq3(r2, b2) + " \\\\ " + eq3([r3[0], r3[1], 0], b3).replace(" &=", " + t\\,z &=") + " \\end{aligned}$$",
        options: G.options({ md: inf ? "unendlich viele Lösungen" : "keine Lösung" }, [{ md: inf ? "keine Lösung" : "unendlich viele Lösungen", why: "Vergleiche die rechten Seiten nach dem Eliminieren." }, { md: "genau eine Lösung", why: "Für diesen Wert ist die dritte Zeile links eine Kombination der ersten beiden, der Rang ist nur $2$." }]),
        explain: "Links ist für $t = " + t0 + "$ Zeile 3 $= " + a + " \\cdot$ Zeile 1 $" + G.term(b) + " \\cdot$ Zeile 2. Rechts ergibt dieselbe Kombination $" + (a * b1 + b * b2) + "$, dort steht $" + b3 + "$: " + (inf ? "passend, ein freier Parameter." : "Widerspruch.") };
    }],
    4: [
      KL((lv, G) => {
        const k = nz(G, -3, 3), c = G.int(-4, 4);
        return { type: "cloze", md: "Für welches Paar $(a, b)$ hat $\\begin{aligned} x " + pm(k) + "y &= " + c + " \\\\ 2x + a\\,y &= b \\end{aligned}$ **unendlich viele** Lösungen?\n\n$a =$ {{0}} $\\qquad b =$ {{1}}",
          blanks: [blank(2 * k), blank(2 * c)], explain: "Unendlich viele gibt es nur, wenn die zweite Gleichung das Doppelte der ersten ist: $a = " + 2 * k + "$, $b = " + 2 * c + "$. Für $a = " + 2 * k + "$ und $b \\ne " + 2 * c + "$ gibt es keine Lösung, für $a \\ne " + 2 * k + "$ genau eine." };
      }),
      KL(nu("$\\begin{aligned} x + y + z &= 1 \\\\ x + ay + z &= 1 \\\\ x + y + az &= b \\end{aligned}$. Welche Dimension hat die Lösungsmenge für $a = 1$ und $b = 1$?", 2,
        "Für $a = 1$ sind alle drei linken Seiten gleich $x + y + z$. Mit $b = 1$ bleibt eine einzige Gleichung, zwei freie Parameter: eine Ebene. Für $a = 1$, $b \\ne 1$ keine Lösung; für $a \\ne 1$ genau eine, weil $\\det = (a - 1)^2 \\ne 0$.")),
      KL(ch("Für welche $a$ ist $\\begin{aligned} x + y + az &= 1 \\\\ x + ay + z &= 1 \\\\ ax + y + z &= 1 \\end{aligned}$ eindeutig lösbar?", "Für alle $a \\notin \\{1, -2\\}$",
        [["Für alle $a \\ne 1$", "Bei $a = -2$ ist die Determinante ebenfalls null."], ["Für alle $a \\ne 0$", "$a = 0$ ist unproblematisch: Determinante $-2$."], ["Für alle $a$", "Bei $a = 1$ sind alle Gleichungen gleich."]],
        "$\\det = -(a - 1)^2(a + 2)$. Determinante als Funktion des Parameters zuerst, dann die Sonderfälle einzeln prüfen.")),
      EX(nu("Für wie viele $a \\in \\mathbb{F}_5$ ist $\\begin{aligned} x + ay &= 1 \\\\ ax + y &= 1 \\end{aligned}$ **nicht** eindeutig lösbar?", 2,
        "$\\det = 1 - a^2 = 0$ heißt $a = \\pm 1$, in $\\mathbb{F}_5$ also $a = 1$ und $a = 4$. Für $a = 1$ unendlich viele (hier $5$) Lösungen, für $a = 4 = -1$ ist die zweite Gleichung $-(x - y) = 1$, mit der ersten $x - y = 1$ ein Widerspruch.")),
      EX(tf("Für $A_t = A + tE$ ist das System $A_t x = b$ für höchstens $n$ Werte von $t$ nicht eindeutig lösbar.", true, "$\\det(A + tE)$ ist ein Polynom vom Grad $n$ in $t$ (Leitkoeffizient $1$), es hat höchstens $n$ Nullstellen, nämlich $t = -\\lambda$ für die Eigenwerte $\\lambda$ von $A$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-det: deeper
  demote("la-det");
  expert("la-det", [
    KL((lv, G) => {
      const n = G.pick([2, 3, 4]), c = G.pick([2, 3, -1]), d = G.pick([2, -2, 4, 1]), e = G.pick([3, -1, 2, 6]);
      const v = (Math.pow(c, n) * e) / d;
      return nu("$A, B \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ mit $\\det A = " + d + "$ und $\\det B = " + e + "$. Berechne $\\det\\bigl(" + c + "\\,A^{-1}B^T\\bigr)$.", v,
        "$\\det(" + c + "M) = " + par(c) + "^{" + n + "}\\det M$, $\\det A^{-1} = \\tfrac{1}{" + d + "}$, $\\det B^T = \\det B$. Zusammen $" + par(c) + "^{" + n + "} \\cdot \\tfrac{" + e + "}{" + d + "} = " + G.tex(v, 4) + "$.", { tolerance: 1e-6 });
    }),
    KL((lv, G) => { const n = G.pick([2, 3, 4]), d = G.pick([2, 3, -2]); return nu("$A \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ mit $\\det A = " + d + "$. Berechne $\\det(\\operatorname{adj} A)$.", Math.pow(d, n - 1), "$A \\operatorname{adj}A = \\det(A) E$, also $\\det A \\cdot \\det(\\operatorname{adj}A) = (\\det A)^{" + n + "}$ und $\\det(\\operatorname{adj}A) = (\\det A)^{" + (n - 1) + "} = " + Math.pow(d, n - 1) + "$."); }),
    KL(tf("Ist $\\det A = 0$, so hat $A$ eine Nullzeile oder zwei gleiche Zeilen.", false, "$\\begin{pmatrix}1&2\\\\2&4\\end{pmatrix}$: Die Zeilen sind nur linear abhängig. $\\det A = 0$ heißt genau das.")),
    KL(tf("$\\det(A + B) = \\det A + \\det B$ für alle $n \\times n$-Matrizen.", false, "$\\det(E + E) = 2^n \\ne 2$ für $n \\ge 2$. Die Determinante ist multiplikativ, nicht additiv.")),
    EX((lv, G) => { const n = G.int(2, 7); return nu("Welche Determinante hat die $" + n + " \\times " + n + "$-Matrix mit $a_{ij} = \\min(i, j)$?", 1, "Zieht man jede Zeile von der nächsten ab (von unten nach oben), entsteht eine obere Dreiecksmatrix mit lauter Einsen auf der Diagonale. Determinante $1$, für jedes $n$."); }),
    EX((lv, G) => { const n = G.int(2, 7); return nu("Welche Determinante hat die $" + n + " \\times " + n + "$-Tridiagonalmatrix mit $2$ auf der Diagonale und $-1$ daneben?", n + 1, "Entwicklung nach der ersten Zeile gibt $D_n = 2D_{n-1} - D_{n-2}$ mit $D_1 = 2$, $D_2 = 3$. Lösung $D_n = n + 1$."); }),
    EX((lv, G) => { const n = G.int(2, 6); return nu("Welche Determinante hat die $" + n + " \\times " + n + "$-Matrix mit $0$ auf der Diagonale und $1$ überall sonst?", Math.pow(-1, n - 1) * (n - 1), "Die Matrix ist $J - E$ mit der Einsermatrix $J$. $J$ hat die Eigenwerte $" + n + "$ (einfach) und $0$ ($" + (n - 1) + "$-fach), also $J - E$ die Eigenwerte $" + (n - 1) + "$ und $-1$: $\\det = " + (n - 1) + " \\cdot (-1)^{" + (n - 1) + "}$."); }),
    EX((lv, G) => { const q = G.pick([2, 3, 5]); return nu("Wie viele $2 \\times 2$-Matrizen über $\\mathbb{F}_" + q + "$ haben Determinante $1$?", q * (q * q - 1), "$|\\mathrm{GL}_2(\\mathbb{F}_" + q + ")| = (" + q + "^2 - 1)(" + q + "^2 - " + q + ")$, und $\\det$ verteilt sie gleichmäßig auf die $" + (q - 1) + "$ Werte $\\ne 0$ (es ist ein surjektiver Homomorphismus). Also $" + q * (q * q - 1) + "$."); }),
  ]);

  // ---------------------------------------------------------------- la-detrechnen (new)
  gen("la-detrechnen", byLevels("Determinanten berechnen", {
    1: [(lv, G) => {
      const n = G.pick([3, 4]), d = range(1, n).map(() => nz(G, -3, 3));
      const A = range(0, n - 1).map((i) => range(0, n - 1).map((j) => (j === i ? d[i] : j > i ? G.int(-5, 5) : 0)));
      if (G.chance(0.4)) { const T = transpose(A); return nu("Berechne $\\det " + mat(T) + "$.", d.reduce((a, b) => a * b, 1), "Dreiecksmatrix: Produkt der Diagonale, $" + d.join(" \\cdot ") + "$. Die Einträge außerhalb spielen keine Rolle."); }
      return nu("Berechne $\\det " + mat(A) + "$.", d.reduce((a, b) => a * b, 1), "Obere Dreiecksmatrix: Produkt der Diagonaleinträge, $" + d.join(" \\cdot ") + " = " + d.reduce((a, b) => a * b, 1) + "$.");
    }],
    2: [(lv, G) => {
      const M = [[G.int(-2, 3), G.int(-2, 2), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 3), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 2), G.int(-2, 3)]];
      const a = nz(G, -3, 3), r = G.int(0, 3), c = G.int(0, 3);
      const A = []; let k = 0;
      for (let i = 0; i < 4; i++) {
        if (i === r) { A.push(range(0, 3).map((j) => (j === c ? a : 0))); continue; }
        const row = M[k++].slice(); row.splice(c, 0, G.int(-3, 3)); A.push(row);
      }
      const v = (r + c) % 2 ? -a * det3(M) : a * det3(M);
      return nu("Berechne $\\det " + mat(A) + "$.", v, "Entwickle nach Zeile " + (r + 1) + ", die nur einen Eintrag $\\ne 0$ hat: $(-1)^{" + (r + 1) + " + " + (c + 1) + "} \\cdot " + par(a) + " \\cdot \\det " + mat(M) + " = " + ((r + c) % 2 ? "-" : "") + par(a) + " \\cdot " + det3(M) + " = " + v + "$.", { hint: "Laplace-Entwicklung nach der Zeile mit den meisten Nullen." });
    }],
    3: [(lv, G) => {
      const A = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]], D = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]], B = [[G.int(-4, 4), G.int(-4, 4)], [G.int(-4, 4), G.int(-4, 4)]];
      const M = [[A[0][0], A[0][1], B[0][0], B[0][1]], [A[1][0], A[1][1], B[1][0], B[1][1]], [0, 0, D[0][0], D[0][1]], [0, 0, D[1][0], D[1][1]]];
      return nu("Berechne $\\det " + mat(M) + "$.", det2(A) * det2(D), "Blockdreiecksmatrix $\\begin{pmatrix}A&B\\\\0&D\\end{pmatrix}$: $\\det = \\det A \\cdot \\det D = " + det2(A) + " \\cdot " + det2(D) + " = " + det2(A) * det2(D) + "$. Der Block $B$ spielt keine Rolle.");
    }],
    4: [
      KL((lv, G) => { let a, b, c; do { a = G.int(-3, 3); b = G.int(-3, 3); c = G.int(-3, 3); } while (new Set([a, b, c]).size < 3); return nu("Berechne $\\det " + mat([[1, a, a * a], [1, b, b * b], [1, c, c * c]]) + "$.", (b - a) * (c - a) * (c - b), "Vandermonde: $\\det = (b - a)(c - a)(c - b) = (" + b + " - " + par(a) + ")(" + c + " - " + par(a) + ")(" + c + " - " + par(b) + ") = " + (b - a) * (c - a) * (c - b) + "$. Null genau dann, wenn zwei Stützstellen gleich sind."); }),
      KL((lv, G) => { const n = G.int(3, 7); return nu("Aus wie vielen Summanden besteht die Leibniz-Formel für eine $" + n + " \\times " + n + "$-Determinante?", G.fact(n), "Ein Summand pro Permutation: $" + n + "! = " + G.fact(n) + "$. Deshalb rechnet man nie mit Leibniz, sondern mit Gauß: $O(n^3)$ statt $O(n!)$."); }),
      KL(tf("Die Determinante einer Permutationsmatrix ist das Signum der Permutation.", true, "In der Leibniz-Formel überlebt genau ein Summand: der zur Permutation selbst, mit Vorzeichen $\\operatorname{sgn}$ und Produkt $1$.")),
      KL(tf("Für Blockmatrizen gilt $\\det\\begin{pmatrix}A&B\\\\C&D\\end{pmatrix} = \\det(AD - BC)$.", false, "Im Allgemeinen falsch, auch die Formate passen nicht immer. Gilt etwa, wenn $C$ und $D$ vertauschen. Sicher richtig ist nur der Fall $C = 0$: $\\det A \\det D$.")),
      EX((lv, G) => { const a = G.int(-2, 3), b = G.int(-2, 3), c = G.int(-2, 3); return nu("Berechne $\\det " + mat([[a, b, c], [c, a, b], [b, c, a]]) + "$.", a * a * a + b * b * b + c * c * c - 3 * a * b * c, "Zirkulante Matrix: $\\det = a^3 + b^3 + c^3 - 3abc = (a + b + c)(a^2 + b^2 + c^2 - ab - bc - ca)$. Hier $" + (a * a * a + b * b * b + c * c * c - 3 * a * b * c) + "$."); }),
      EX(tf("Jede alternierende Multilinearform $\\Delta: (K^n)^n \\to K$ ist ein Vielfaches der Determinante.", true, "Durch Ausmultiplizieren und Alternieren ist $\\Delta$ durch $\\Delta(e_1, \\dots, e_n)$ festgelegt: $\\Delta = \\Delta(e_1, \\dots, e_n) \\cdot \\det$. Das ist der Eindeutigkeitssatz.")),
      EX(tf("Die Determinante ist ein Polynom vom Grad $n$ in den $n^2$ Einträgen, und jeder Summand enthält aus jeder Zeile und jeder Spalte genau einen Eintrag.", true, "Leibniz: $\\det A = \\sum_\\sigma \\operatorname{sgn}\\sigma \\prod_i a_{i\\sigma(i)}$. Jeder Summand ist ein Produkt von $n$ Einträgen, einer pro Zeile und pro Spalte (Turmstellung).")),
      EX(nu("Welche Determinante hat die $4 \\times 4$-Matrix mit $a_{ij} = |i - j|$?", -12, "Für $n = 4$: Entwickeln oder Zeilenumformungen liefern $-12$. Allgemein gilt $\\det = (-1)^{n-1}(n - 1)2^{n-2}$: $(-1)^3 \\cdot 3 \\cdot 4 = -12$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-cramer (new)
  gen("la-cramer", byLevels("Cramer und Adjunkte", {
    1: [(lv, G) => {
      let A; do { A = [[G.int(-4, 4), G.int(-4, 4)], [G.int(-4, 4), G.int(-4, 4)]]; } while (det2(A) === 0);
      const b = [G.int(-6, 6), G.int(-6, 6)], d = det2(A), d1 = det2([[b[0], A[0][1]], [b[1], A[1][1]]]);
      return nu("Bestimme $x$ in $" + mat(A) + "\\begin{pmatrix}x\\\\y\\end{pmatrix} = " + vec(b) + "$ mit der Cramerschen Regel (zwei Nachkommastellen).", d1 / d,
        "$x = \\dfrac{\\det " + mat([[b[0], A[0][1]], [b[1], A[1][1]]]) + "}{\\det A} = \\dfrac{" + d1 + "}{" + d + "}$: die erste Spalte durch die rechte Seite ersetzen.", { tolerance: 0.006 });
    }],
    2: [(lv, G) => {
      const A = [[G.int(-5, 5), G.int(-5, 5)], [G.int(-5, 5), G.int(-5, 5)]];
      return { type: "cloze", md: "Bestimme die Adjunkte von $" + mat(A) + "$, zeilenweise.\n\n{{0}} {{1}} {{2}} {{3}}", blanks: [blank(A[1][1]), blank(-A[0][1]), blank(-A[1][0]), blank(A[0][0])],
        explain: "$\\operatorname{adj}\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix} = \\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$: Diagonale tauschen, Nebendiagonale negieren. Dann $A \\operatorname{adj}A = (\\det A)E$." };
    }],
    3: [(lv, G) => {
      let A; do { A = [[G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]]; } while (det3(A) === 0);
      const i = G.int(1, 3), j = G.int(1, 3);
      const minor = A.filter((_, r) => r !== j - 1).map((row) => row.filter((_, c) => c !== i - 1));
      const v = ((i + j) % 2 ? -1 : 1) * det2(minor) / det3(A);
      return nu("$A = " + mat(A) + "$. Bestimme den Eintrag $(" + i + ", " + j + ")$ von $A^{-1}$ (zwei Nachkommastellen).", v,
        "$(A^{-1})_{" + i + j + "} = \\tfrac{1}{\\det A}(-1)^{" + i + " + " + j + "}\\det A_{" + j + i + "}$, wobei $A_{" + j + i + "}$ Zeile " + j + " und Spalte " + i + " streicht (Indizes vertauscht!): $\\tfrac{" + ((i + j) % 2 ? -1 : 1) * det2(minor) + "}{" + det3(A) + "}$.", { tolerance: 0.006 });
    }],
    4: [
      KL(tf("Eine ganzzahlige quadratische Matrix hat genau dann eine ganzzahlige Inverse, wenn $\\det A = \\pm 1$.", true, "$A^{-1} = \\tfrac{1}{\\det A}\\operatorname{adj}A$ und $\\operatorname{adj}A$ ist ganzzahlig: $\\det = \\pm1$ reicht. Umgekehrt ist $\\det A \\cdot \\det A^{-1} = 1$ ein Produkt ganzer Zahlen.")),
      KL(tf("Für große Gleichungssysteme ist die Cramersche Regel ein effizientes Lösungsverfahren.", false, "Sie braucht $n + 1$ Determinanten. Gauß löst das System mit dem Aufwand einer einzigen. Cramer ist ein theoretisches Werkzeug: Es zeigt etwa, dass die Lösung stetig von $A$ und $b$ abhängt.")),
      KL(nu("$A \\in \\mathbb{R}^{3 \\times 3}$ mit $\\det A = 2$. Es gilt $\\operatorname{adj}(\\operatorname{adj}A) = c \\cdot A$. Bestimme $c$.", 2, "$\\operatorname{adj}A = \\det(A) A^{-1} = 2A^{-1}$, also $\\operatorname{adj}(\\operatorname{adj}A) = \\det(2A^{-1}) (2A^{-1})^{-1} = 2^3 \\cdot \\tfrac12 \\cdot \\tfrac12 A = 2A$. Allgemein $(\\det A)^{n-2}A$.")),
      EX(tf("Hat $A \\in \\mathbb{R}^{n \\times n}$ den Rang $n - 1$, so hat $\\operatorname{adj}A$ den Rang $1$.", true, "Wegen $A\\operatorname{adj}A = 0$ liegt das Bild von $\\operatorname{adj}A$ im eindimensionalen Kern von $A$. Und $\\operatorname{adj}A \\ne 0$, weil ein $(n-1)$-Minor nicht null ist.")),
      EX(tf("Hat $A$ den Rang höchstens $n - 2$, so ist $\\operatorname{adj}A = 0$.", true, "Alle $(n - 1) \\times (n - 1)$-Minoren verschwinden, weil schon je $n - 1$ Zeilen abhängig sind.")),
      EX(tf("Ist $A$ ganzzahlig mit $\\det A = \\pm 1$, so hat $Ax = b$ für jedes ganzzahlige $b$ eine ganzzahlige Lösung.", true, "Cramer: $x_i = \\det A_i / \\det A$, und $\\det A_i$ ist ganzzahlig. Bei $\\det A = 2$ geht es schief: $2x = 1$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-eigen: deeper
  demote("la-eigen");
  expert("la-eigen", [
    KL((lv, G) => {
      let l1 = G.int(-3, 3), l2 = G.int(-3, 3); if (l1 === l2) l2 = l1 + 2;
      const { A } = withEigen(G, l1, l2), a = G.int(-3, 3), b = G.int(-3, 3);
      const p = (x) => x * x + a * x + b, v1 = p(l1), v2 = p(l2);
      return { type: "cloze", md: "$A = " + mat(A) + "$ hat die Eigenwerte $" + l1 + "$ und $" + l2 + "$. Welche Eigenwerte hat $A^2 " + pm(a) + "A " + pm(b) + "E$? (größeren zuerst)\n\n{{0}} $\\qquad$ {{1}}",
        blanks: [blank(Math.max(v1, v2)), blank(Math.min(v1, v2))], hint: "Ist $Av = \\lambda v$, was ist dann $(A^2 + aA + bE)v$?",
        explain: "Für einen Eigenvektor gilt $(A^2 + aA + bE)v = (\\lambda^2 + a\\lambda + b)v$. Also $p(" + l1 + ") = " + v1 + "$ und $p(" + l2 + ") = " + v2 + "$. Kein Ausrechnen der Matrix nötig." };
    }),
    KL(tf("Eigenvektoren zu verschiedenen Eigenwerten sind linear unabhängig.", true, "Induktion: Aus $\\sum c_iv_i = 0$ folgt durch Anwenden von $A - \\lambda_kE$ eine kürzere Relation. Deshalb ist eine Matrix mit $n$ verschiedenen Eigenwerten diagonalisierbar.")),
    KL(tf("Die Summe zweier Eigenvektoren von $A$ ist wieder ein Eigenvektor von $A$.", false, "Nur bei gleichem Eigenwert (dann ist sie im Eigenraum, falls $\\ne 0$). $A = \\operatorname{diag}(1, 2)$: $e_1 + e_2 \\mapsto (1, 2)$, kein Vielfaches.")),
    KL(tf("$A$ und $A^T$ haben dieselben Eigenvektoren.", false, "Sie haben dieselben Eigenwerte ($\\det(A^T - \\lambda E) = \\det(A - \\lambda E)$), aber andere Eigenvektoren: $\\begin{pmatrix}1&1\\\\0&2\\end{pmatrix}$ hat $e_1$ als Eigenvektor, die Transponierte nicht.")),
    KL((lv, G) => {
      const ls = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)], k = G.pick(["det", "tr", "tr2", "detE"]);
      const q = { det: ["\\det A", ls[0] * ls[1] * ls[2], "Produkt der Eigenwerte"], tr: ["\\operatorname{Spur} A", ls[0] + ls[1] + ls[2], "Summe der Eigenwerte"], tr2: ["\\operatorname{Spur}(A^2)", ls.reduce((s, x) => s + x * x, 0), "Summe der Quadrate der Eigenwerte, denn $A^2$ hat die Eigenwerte $\\lambda_i^2$"], detE: ["\\det(A + E)", ls.reduce((s, x) => s * (x + 1), 1), "Produkt der $\\lambda_i + 1$, denn $A + E$ hat die Eigenwerte $\\lambda_i + 1$"] }[k];
      return nu("$A \\in \\mathbb{R}^{3 \\times 3}$ hat die Eigenwerte $" + ls.join(", ") + "$ (mit Vielfachheit). Berechne $" + q[0] + "$.", q[1], q[2] + ": $" + q[1] + "$.");
    }),
    EX(tf("Jede reelle $3 \\times 3$-Matrix hat einen reellen Eigenwert.", true, "Das charakteristische Polynom hat Grad $3$, also eine reelle Nullstelle (Zwischenwertsatz). Geometrisch: Jede Drehung im Raum hat eine Achse.")),
    EX(tf("$AB$ und $BA$ haben dieselben Eigenwerte.", true, "Ist $ABv = \\lambda v$ mit $\\lambda \\ne 0$, dann $BA(Bv) = \\lambda Bv$ und $Bv \\ne 0$. Für $\\lambda = 0$: $\\det(AB) = \\det(BA)$. Sogar die charakteristischen Polynome stimmen überein.")),
    EX(tf("Gilt $A^2 = A$, so sind $0$ und $1$ die einzigen möglichen Eigenwerte.", true, "$\\lambda v = Av = A^2v = \\lambda^2 v$, also $\\lambda^2 = \\lambda$.")),
    EX((lv, G) => { const n = G.int(2, 8); return nu("$J$ ist die $" + n + " \\times " + n + "$-Matrix mit lauter Einsen. Welcher ist ihr größter Eigenwert?", n, "$J(1, \\dots, 1)^T = " + n + "(1, \\dots, 1)^T$. Der Rang ist $1$, also ist $0$ ein $" + (n - 1) + "$-facher Eigenwert, und die Spur $" + n + "$ ist die Summe aller Eigenwerte."); }),
  ]);

  // ---------------------------------------------------------------- la-charpoly (new)
  gen("la-charpoly", byLevels("Charakteristisches Polynom", {
    1: [(lv, G) => {
      const A = [[G.int(-4, 5), G.int(-4, 4)], [G.int(-4, 4), G.int(-4, 5)]];
      return { type: "cloze", md: "$\\chi_A(\\lambda) = \\det(\\lambda E - A) = \\lambda^2 - p\\lambda + q$ für $A = " + mat(A) + "$. Bestimme $p$ und $q$.\n\n$p =$ {{0}} $\\qquad q =$ {{1}}",
        blanks: [blank(tr(A)), blank(det2(A))], explain: "Für $2 \\times 2$-Matrizen ist $p$ die Spur und $q$ die Determinante: $" + tr(A) + "$ und $" + det2(A) + "$." };
    }],
    2: [(lv, G) => {
      const a = G.int(-3, 3), b = G.int(-3, 4), c = G.int(-3, 3);
      const M = [[a, G.int(-3, 3), G.int(-3, 3)], [0, b, G.int(-3, 3)], [0, 0, c]];
      const ls = [a, b, c].sort((x, y) => y - x);
      return { type: "cloze", md: "Bestimme die Eigenwerte von $" + mat(M) + "$, absteigend.\n\n{{0}} $\\quad$ {{1}} $\\quad$ {{2}}", blanks: ls.map((v) => blank(v)),
        explain: "Dreiecksmatrix: $\\det(\\lambda E - M) = (\\lambda - " + par(a) + ")(\\lambda - " + par(b) + ")(\\lambda - " + par(c) + ")$. Die Eigenwerte stehen auf der Diagonale." };
    }],
    3: [(lv, G) => {
      const l = G.int(-3, 3), x = G.int(-3, 3), off = G.chance(0.5) ? 0 : nz(G, -3, 3);
      const A = [[l, off, G.int(-2, 2)], [0, l, G.int(-2, 2)], [0, 0, x === l ? l + 1 : x]];
      const geo = off === 0 ? 2 : 1;
      return nu("$A = " + mat(A) + "$. Welche **geometrische** Vielfachheit hat der Eigenwert $" + l + "$?", geo,
        "Algebraische Vielfachheit $2$. Geometrisch: $\\dim\\ker(A - " + par(l) + "E) = 3 - \\operatorname{rang}(A - " + par(l) + "E)$. " + (off === 0 ? "Die oberen beiden Zeilen von $A - \\lambda E$ sind dann Vielfache voneinander (oder null): Rang $1$, also $2$." : "Der Eintrag $" + off + "$ oben macht den Rang $2$: nur $1$."));
    }],
    4: [
      KL(tf("Für $\\chi_A(\\lambda) = \\det(\\lambda E - A)$ ist der konstante Term $(-1)^n \\det A$ und der Koeffizient von $\\lambda^{n-1}$ gleich $-\\operatorname{Spur}A$.", true, "$\\chi_A(0) = \\det(-A) = (-1)^n\\det A$. Den Koeffizienten von $\\lambda^{n-1}$ liefert in der Leibniz-Formel nur das Produkt der Diagonale $\\prod(\\lambda - a_{ii})$.")),
      KL(tf("Matrizen mit gleichem charakteristischem Polynom sind ähnlich.", false, "$E$ und $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ haben beide $(\\lambda - 1)^2$. Umgekehrt haben ähnliche Matrizen immer dasselbe charakteristische Polynom.")),
      KL((lv, G) => { const a = G.int(-5, 5), b = G.int(-5, 5), c = G.int(-5, 5); return nu("Welche Spur hat die Begleitmatrix $\\begin{pmatrix}0&0&" + par(-c) + "\\\\1&0&" + par(-b) + "\\\\0&1&" + par(-a) + "\\end{pmatrix}$ von $x^3 " + pm(a) + "x^2 " + pm(b) + "x " + pm(c) + "$?", -a, "Ihr charakteristisches Polynom ist genau $x^3 " + pm(a) + "x^2 " + pm(b) + "x " + pm(c) + "$, die Spur ist minus der Koeffizient von $x^2$: $" + -a + "$. Jedes normierte Polynom ist ein charakteristisches Polynom."); }),
      KL(tf("Die geometrische Vielfachheit eines Eigenwerts ist höchstens seine algebraische.", true, "Ergänze eine Basis des Eigenraums (Dimension $g$) zu einer Basis; in ihr hat $A$ die Blockgestalt $\\begin{pmatrix}\\lambda E_g & *\\\\0 & B\\end{pmatrix}$, und $(\\lambda - x)^g$ teilt das charakteristische Polynom.")),
      EX(tf("Über $\\mathbb{C}$ hat jede quadratische Matrix einen Eigenvektor.", true, "Das charakteristische Polynom hat nach dem Fundamentalsatz der Algebra eine Nullstelle $\\lambda$, und $\\det(A - \\lambda E) = 0$ liefert ein $v \\ne 0$ mit $Av = \\lambda v$.")),
      EX(nu("$A \\in \\mathbb{R}^{4 \\times 4}$ hat $\\chi_A(\\lambda) = (\\lambda - 2)^3(\\lambda + 1)$ und $\\operatorname{rang}(A - 2E) = 2$. Welche Dimension hat der Eigenraum zu $2$?", 2, "$\\dim\\ker(A - 2E) = 4 - 2 = 2$. Algebraische Vielfachheit $3 >$ geometrische $2$: $A$ ist nicht diagonalisierbar.")),
      EX(tf("Ist $\\chi_A = \\chi_B$, so sind $A$ und $B$ für $2 \\times 2$-Matrizen mit **verschiedenen** Eigenwerten ähnlich.", true, "Dann sind beide diagonalisierbar und ähnlich zu derselben Diagonalmatrix.")),
    ],
  }));

  // ---------------------------------------------------------------- la-diag (new)
  gen("la-diag", byLevels("Diagonalisierbarkeit", {
    1: [(lv, G) => {
      let l1 = G.int(-3, 4), l2 = G.int(-3, 4); if (l1 === l2) l2++;
      const jord = G.chance(0.4), l = G.int(-3, 3);
      if (jord) return tf("$" + mat([[l, nz(G, -3, 3)], [0, l]]) + "$ ist diagonalisierbar.", false, "Ein doppelter Eigenwert $" + l + "$, aber der Eigenraum ist nur eine Gerade ($\\operatorname{rang}(A - " + par(l) + "E) = 1$). Es fehlt ein zweiter Eigenvektor.");
      const { A } = withEigen(G, l1, l2);
      return tf("$" + mat(A) + "$ ist über $\\mathbb{R}$ diagonalisierbar.", true, "Spur $" + tr(A) + "$, Determinante $" + det2(A) + "$: Eigenwerte $" + l1 + "$ und $" + l2 + "$, verschieden, also zwei unabhängige Eigenvektoren.");
    }],
    2: [(lv, G) => {
      const l = G.int(-3, 3), m = l + G.pick([-2, -1, 1, 2]), a = G.chance(0.5) ? 0 : nz(G, -3, 3);
      const A = [[l, a, 0], [0, l, 0], [0, 0, m]];
      return nu("Welche geometrische Vielfachheit hat $" + l + "$ bei $" + mat(A) + "$?", a === 0 ? 2 : 1, a === 0 ? "Diagonalmatrix: Der Eigenraum zu $" + l + "$ ist $\\operatorname{span}\\{e_1, e_2\\}$." : "$A - " + par(l) + "E$ hat Rang $2$ (der Eintrag $" + a + "$ und der Eintrag $" + (m - l) + "$), Kern ist nur $\\operatorname{span}\\{e_1\\}$.");
    }],
    3: [(lv, G) => {
      const k = G.pick(["a", "b"]);
      if (k === "a") { const l = G.int(-3, 3); return nu("Für welches $t$ ist $\\begin{pmatrix}" + l + "&t\\\\0&" + l + "\\end{pmatrix}$ diagonalisierbar?", 0, "Für $t \\ne 0$ ist der Eigenraum zu $" + l + "$ eine Gerade. Für $t = 0$ ist die Matrix schon diagonal."); }
      const c = G.int(-3, 3), d = nz(G, -3, 3);
      return nu("Für welches $t$ ist $\\begin{pmatrix}" + c + "&" + d + "\\\\0&t\\end{pmatrix}$ **nicht** diagonalisierbar?", c, "Für $t \\ne " + c + "$ zwei verschiedene Eigenwerte, also diagonalisierbar. Für $t = " + c + "$ ein doppelter Eigenwert mit nur eindimensionalem Eigenraum, weil $" + d + " \\ne 0$.");
    }],
    4: [
      KL((lv, G) => {
        let l1 = G.pick([-1, 1, 2, -2, 3]), l2 = G.pick([-1, 1, 2, 0, -2]); if (l1 === l2) l2 = 0;
        const { A, P } = withEigen(G, l1, l2), n = G.pick([4, 5, 6]);
        const An = mulMM(mulMM(P, [[Math.pow(l1, n), 0], [0, Math.pow(l2, n)]]), inv2(P)).map((r) => r.map((v) => Math.round(v)));
        return nu("$A = " + mat(A) + "$ hat die Eigenwerte $" + l1 + "$ und $" + l2 + "$. Berechne den Eintrag oben links von $A^{" + n + "}$.", An[0][0],
          "Mit $A = SDS^{-1}$, $S = " + mat(P) + "$, ist $A^{" + n + "} = SD^{" + n + "}S^{-1}$, $D^{" + n + "} = \\operatorname{diag}(" + Math.pow(l1, n) + ", " + Math.pow(l2, n) + ")$. Ergebnis: $A^{" + n + "} = " + mat(An) + "$.");
      }),
      KL(tf("Jede reelle symmetrische Matrix ist diagonalisierbar.", true, "Spektralsatz: Sie hat reelle Eigenwerte und sogar eine Orthonormalbasis aus Eigenvektoren.")),
      KL(tf("Die Summe zweier diagonalisierbarer Matrizen ist diagonalisierbar.", false, "$\\begin{pmatrix}1&1\\\\0&0\\end{pmatrix} + \\begin{pmatrix}-1&0\\\\0&0\\end{pmatrix} = \\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$: Beide Summanden haben verschiedene Eigenwerte, die Summe ist nilpotent und $\\ne 0$.")),
      KL(tf("Eine nilpotente Matrix $\\ne 0$ ist nie diagonalisierbar.", true, "Einziger Eigenwert $0$; diagonalisierbar hieße ähnlich zur Nullmatrix, also selbst $0$.")),
      EX(tf("Vertauschen zwei diagonalisierbare Matrizen, so sind sie gemeinsam diagonalisierbar.", true, "$B$ bildet jeden Eigenraum von $A$ in sich ab ($ABv = BAv = \\lambda Bv$), und auf jedem Eigenraum ist $B$ diagonalisierbar. So entsteht eine gemeinsame Eigenbasis.")),
      EX(tf("Jede komplexe Matrix mit $A^k = E$ für ein $k \\ge 1$ ist diagonalisierbar.", true, "Das Minimalpolynom teilt $x^k - 1$, und das hat über $\\mathbb{C}$ $k$ verschiedene Nullstellen. Ein Minimalpolynom ohne mehrfache Nullstellen heißt diagonalisierbar.")),
      EX(tf("Jede reelle $2 \\times 2$-Matrix mit $A^2 = -E$ ist über $\\mathbb{R}$ diagonalisierbar.", false, "Eigenwerte erfüllen $\\lambda^2 = -1$, reelle gibt es nicht. Über $\\mathbb{C}$ ist sie diagonalisierbar (Eigenwerte $\\pm i$).")),
    ],
  }));

  // ---------------------------------------------------------------- la-cayley (new)
  gen("la-cayley", byLevels("Cayley-Hamilton und Minimalpolynom", {
    1: [(lv, G) => {
      const A = [[G.int(-3, 4), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 4)]];
      return { type: "cloze", md: "Nach Cayley-Hamilton gilt $A^2 = pA + qE$ für $A = " + mat(A) + "$. Bestimme $p$ und $q$.\n\n$p =$ {{0}} $\\qquad q =$ {{1}}",
        blanks: [blank(tr(A)), blank(-det2(A))], explain: "$\\chi_A(\\lambda) = \\lambda^2 - (\\operatorname{Spur}A)\\lambda + \\det A$, und $\\chi_A(A) = 0$. Also $A^2 = " + tr(A) + "A " + pm(-det2(A)) + "E$." };
    }],
    2: [(lv, G) => {
      const S = unimod(G), d = det2(S), I = inv2(S);
      return { type: "cloze", md: "Bestimme $A^{-1}$ für $A = " + mat(S) + "$ mit Cayley-Hamilton: $A^{-1} = \\tfrac{1}{\\det A}(\\operatorname{Spur}(A)E - A)$. Zeilenweise:\n\n{{0}} {{1}} {{2}} {{3}}",
        blanks: [blank(I[0][0]), blank(I[0][1]), blank(I[1][0]), blank(I[1][1])],
        explain: "$A^2 - (\\operatorname{Spur}A)A + (\\det A)E = 0$ geteilt durch $A \\det A$. Spur $" + tr(S) + "$, Determinante $" + d + "$: $A^{-1} = " + mat(I) + "$." };
    }],
    3: [(lv, G) => {
      const a = G.int(-3, 3), b = a + G.pick([1, 2, -1]), k = G.pick(["aab", "aaa", "abc", "jord"]);
      const q = { aab: ["\\operatorname{diag}(" + a + ", " + a + ", " + b + ")", 2, "$(x - " + par(a) + ")(x - " + par(b) + ")$ annulliert sie schon."], aaa: ["\\operatorname{diag}(" + a + ", " + a + ", " + a + ")", 1, "Sie ist $" + a + "E$, also $x - " + par(a) + "$."], abc: ["\\operatorname{diag}(" + a + ", " + b + ", " + (b + 3) + ")", 3, "Drei verschiedene Eigenwerte: Das Minimalpolynom ist das charakteristische."], jord: ["\\begin{pmatrix}" + a + "&1&0\\\\0&" + a + "&0\\\\0&0&" + a + "\\end{pmatrix}", 2, "$(A - " + par(a) + "E)^2 = 0$, aber $A - " + par(a) + "E \\ne 0$: $(x - " + par(a) + ")^2$."] }[k];
      return nu("Welchen Grad hat das Minimalpolynom von $" + q[0] + "$?", q[1], q[2]);
    }],
    4: [
      KL((lv, G) => { const n = G.int(4, 9); const F = [0, 1]; for (let i = 2; i <= n; i++) F.push(F[i - 1] + F[i - 2]); return { type: "cloze", md: "$A$ erfüllt $A^2 = A + E$. Schreibe $A^{" + n + "} = aA + bE$.\n\n$a =$ {{0}} $\\qquad b =$ {{1}}", blanks: [blank(F[n]), blank(F[n - 1])], explain: "Induktiv: Aus $A^k = F_kA + F_{k-1}E$ folgt $A^{k+1} = F_k(A + E) + F_{k-1}A = F_{k+1}A + F_kE$. Fibonacci-Zahlen: $a = F_{" + n + "} = " + F[n] + "$, $b = F_{" + (n - 1) + "} = " + F[n - 1] + "$." }; }),
      KL(tf("Aus $A^2 = A$ folgt, dass $A$ diagonalisierbar ist.", true, "Das Minimalpolynom teilt $x^2 - x = x(x - 1)$, hat also keine mehrfachen Nullstellen. Konkret: $V = \\ker A \\oplus \\operatorname{im} A$.")),
      KL(tf("Minimalpolynom und charakteristisches Polynom haben dieselben Nullstellen.", true, "Jeder Eigenwert ist Nullstelle des Minimalpolynoms ($p(A)v = p(\\lambda)v$), und das Minimalpolynom teilt das charakteristische (Cayley-Hamilton).")),
      EX(ch("»Beweis« von Cayley-Hamilton: $\\chi_A(A) = \\det(A \\cdot E - A) = \\det 0 = 0$. Was ist falsch?", "In $\\chi_A(\\lambda) = \\det(\\lambda E - A)$ darf man für die Zahl $\\lambda$ keine Matrix einsetzen; links steht eine Matrix, rechts die Zahl $\\det 0$",
        [["Nichts, das ist der Beweis", "Dann wäre $\\chi_A(A)$ eine Zahl, es ist aber eine Matrix."], ["$\\det 0$ ist nicht null", "Die Nullmatrix hat Determinante $0$; der Fehler liegt woanders."], ["Cayley-Hamilton ist falsch", "Der Satz stimmt, nur dieser Beweis nicht."]],
        "Echte Beweise: über die Adjunkte von $\\lambda E - A$ (Polynom mit Matrixkoeffizienten), oder über Trigonalisierung und Dichtheit der diagonalisierbaren Matrizen.")),
      EX(tf("$A$ ist genau dann diagonalisierbar, wenn das Minimalpolynom in Linearfaktoren zerfällt und keine mehrfachen Nullstellen hat.", true, "Ist $\\mu_A = \\prod(x - \\lambda_i)$ mit verschiedenen $\\lambda_i$, so ist $V$ die direkte Summe der Kerne $\\ker(A - \\lambda_iE)$, der Eigenräume. Umgekehrt annulliert $\\prod(x - \\lambda_i)$ jede Diagonalmatrix.")),
      EX(nu("$A \\in \\mathbb{R}^{5 \\times 5}$ ist nilpotent, und $\\operatorname{rang} A = 4$. Welchen Grad hat ihr Minimalpolynom?", 5, "Rang $4$ heißt: ein einziger Jordanblock der Größe $5$. Dann $A^4 \\ne 0 = A^5$, Minimalpolynom $x^5$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-skalar (new)
  const FORMS = [
    { md: "$\\langle x, y \\rangle = x_1y_1 + 2x_2y_2$", ok: true, why: "Symmetrisch, bilinear, und $\\langle x, x \\rangle = x_1^2 + 2x_2^2 > 0$ für $x \\ne 0$." },
    { md: "$\\langle x, y \\rangle = x_1y_1 - x_2y_2$", ok: false, why: "Nicht positiv definit: $\\langle e_2, e_2 \\rangle = -1$." },
    { md: "$\\langle x, y \\rangle = x_1y_2 + x_2y_1$", ok: false, why: "$\\langle e_1, e_1 \\rangle = 0$ für $e_1 \\ne 0$." },
    { md: "$\\langle x, y \\rangle = x_1y_1$", ok: false, why: "Nicht definit: $\\langle e_2, e_2 \\rangle = 0$." },
    { md: "$\\langle x, y \\rangle = 2x_1y_1 + x_1y_2 + x_2y_1 + x_2y_2$", ok: true, why: "Gram-Matrix $\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$, symmetrisch mit $2 > 0$ und $\\det = 1 > 0$: positiv definit." },
    { md: "$\\langle x, y \\rangle = x_1y_1 + x_1y_2 + x_2y_2$", ok: false, why: "Nicht symmetrisch: $\\langle e_1, e_2 \\rangle = 1$, aber $\\langle e_2, e_1 \\rangle = 0$." },
    { md: "$\\langle x, y \\rangle = (x_1 + x_2)(y_1 + y_2)$", ok: false, why: "$\\langle (1, -1), (1, -1) \\rangle = 0$." },
  ];
  gen("la-skalar", byLevels("Skalarprodukte", {
    1: [(lv, G) => { const f = G.pick(FORMS); return tf(f.md + " ist ein Skalarprodukt auf $\\mathbb{R}^2$.", f.ok, f.why); }],
    2: [(lv, G) => { const i = G.int(0, 3), j = G.int(0, 3), a = nz(G, -3, 3), b = nz(G, -3, 3); return nu("$\\langle p, q \\rangle = \\int_0^1 p(x)q(x)\\,dx$. Berechne $\\langle " + (a === 1 ? "" : a === -1 ? "-" : a) + (i ? "x^{" + i + "}" : (Math.abs(a) === 1 ? "1" : "")) + ",\\ " + (b === 1 ? "" : b === -1 ? "-" : b) + (j ? "x^{" + j + "}" : (Math.abs(b) === 1 ? "1" : "")) + " \\rangle$ (drei Nachkommastellen).", (a * b) / (i + j + 1), "$\\int_0^1 " + a * b + " x^{" + (i + j) + "}\\,dx = \\tfrac{" + a * b + "}{" + (i + j + 1) + "}$.", { tolerance: 0.001 }); }],
    3: [(lv, G) => { const k = G.int(2, 6); return nu("Für welche ganzen Zahlen $a$ ist $\\langle x, y \\rangle = x_1y_1 + a(x_1y_2 + x_2y_1) + " + k * k + "x_2y_2$ ein Skalarprodukt? Gib das **größte** solche $a$ an.", k - 1, "Gram-Matrix $\\begin{pmatrix}1&a\\\\a&" + k * k + "\\end{pmatrix}$: positiv definit genau dann, wenn $1 > 0$ und $\\det = " + k * k + " - a^2 > 0$, also $|a| < " + k + "$. Größtes ganzes $a$: $" + (k - 1) + "$."); }],
    4: [
      KL(tf("In der Cauchy-Schwarz-Ungleichung $|\\langle v, w \\rangle| \\le \\|v\\|\\|w\\|$ gilt Gleichheit genau dann, wenn $v$ und $w$ linear abhängig sind.", true, "Im Beweis steht $0 \\le \\|v - tw\\|^2$; Gleichheit heißt $v = tw$ (oder $w = 0$).")),
      KL(tf("Die Summennorm $\\|x\\|_1 = |x_1| + |x_2|$ kommt von einem Skalarprodukt.", false, "Normen aus Skalarprodukten erfüllen die Parallelogrammgleichung $\\|v + w\\|^2 + \\|v - w\\|^2 = 2\\|v\\|^2 + 2\\|w\\|^2$. Mit $e_1, e_2$: links $4 + 4 = 8$, rechts $2 + 2 = 4$.")),
      KL(nu("Welchen Winkel (in Grad) schließen $1$ und $x$ bezüglich $\\langle p, q \\rangle = \\int_0^1 pq\\,dx$ ein?", 30, "$\\langle 1, x \\rangle = \\tfrac12$, $\\|1\\| = 1$, $\\|x\\| = \\tfrac{1}{\\sqrt3}$. $\\cos\\alpha = \\tfrac{1/2}{1/\\sqrt3} = \\tfrac{\\sqrt3}{2}$, also $30°$.", { tolerance: 0.1 })),
      KL(tf("Gilt $\\langle v, w \\rangle = 0$ für alle $w$, so ist $v = 0$.", true, "Wähle $w = v$: $\\|v\\|^2 = 0$.")),
      EX(tf("Ist $A \\in \\mathbb{R}^{2 \\times 2}$ und $\\langle Ax, x \\rangle = 0$ für alle $x$, so ist $A = 0$.", false, "Jede schiefsymmetrische Matrix, etwa die Drehung um $90°$, erfüllt $\\langle Ax, x \\rangle = 0$. Über $\\mathbb{C}$ mit dem hermiteschen Skalarprodukt dagegen folgt $A = 0$.")),
      EX(ch("Wie bestimmt die Norm das Skalarprodukt (reell)?", "$\\langle v, w \\rangle = \\tfrac14\\bigl(\\|v + w\\|^2 - \\|v - w\\|^2\\bigr)$",
        [["$\\langle v, w \\rangle = \\|v\\|\\|w\\|$", "Das ist nur die Cauchy-Schwarz-Schranke."], ["$\\langle v, w \\rangle = \\|v + w\\| - \\|v\\| - \\|w\\|$", "Quadrate fehlen; so kommt man nicht auf eine bilineare Form."], ["Gar nicht", "Die Polarisierungsformel stellt es aus der Norm wieder her."]],
        "Polarisierung: $\\|v \\pm w\\|^2 = \\|v\\|^2 \\pm 2\\langle v, w \\rangle + \\|w\\|^2$, die Differenz ist $4\\langle v, w \\rangle$. Längenerhaltende lineare Abbildungen erhalten deshalb auch Winkel.")),
      EX(tf("Jede positiv definite symmetrische Matrix $S$ definiert durch $\\langle x, y \\rangle_S = x^TSy$ ein Skalarprodukt, und jedes Skalarprodukt auf $\\mathbb{R}^n$ ist von dieser Form.", true, "Bilinear und symmetrisch sind durch die Gram-Matrix $S_{ij} = \\langle e_i, e_j \\rangle$ festgelegt; positiv definit heißt $x^TSx > 0$ für $x \\ne 0$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-gramschmidt (new)
  gen("la-gramschmidt", byLevels("Orthonormalbasen und Gram-Schmidt", {
    1: [(lv, G) => { const [a, b, c] = G.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [1, 0, 1]]), k = G.pick([1, 2, 3]); return nu("Welche Länge hat $v = " + vec([k * a, k * b]) + "$?", k * c, "$\\sqrt{" + k * a + "^2 + " + k * b + "^2} = " + k * c + "$. Der normierte Vektor ist $\\tfrac{1}{" + k * c + "}v$."); }],
    2: [(lv, G) => {
      let v1, v2; do { v1 = [G.int(-3, 3), G.int(-3, 3)]; v2 = [G.int(-3, 3), G.int(-3, 3)]; } while (det2([[v1[0], v2[0]], [v1[1], v2[1]]]) === 0);
      const c = (v2[0] * v1[0] + v2[1] * v1[1]) / (v1[0] * v1[0] + v1[1] * v1[1]);
      const u = [v2[0] - c * v1[0], v2[1] - c * v1[1]];
      return { type: "cloze", md: "Gram-Schmidt (ohne Normieren) für $v_1 = " + vec(v1) + "$, $v_2 = " + vec(v2) + "$: Bestimme $u_2 = v_2 - \\tfrac{\\langle v_2, v_1 \\rangle}{\\langle v_1, v_1 \\rangle}v_1$ (zwei Nachkommastellen).\n\n$u_2 = ($ {{0}} $,$ {{1}} $)$",
        blanks: [blank(u[0], 0.006), blank(u[1], 0.006)], explain: "$\\tfrac{\\langle v_2, v_1 \\rangle}{\\langle v_1, v_1 \\rangle} = " + frac(v2[0] * v1[0] + v2[1] * v1[1], v1[0] * v1[0] + v1[1] * v1[1]) + "$. Probe: $\\langle u_2, v_1 \\rangle = 0$." };
    }],
    3: [(lv, G) => { const v = [G.int(-5, 5), G.int(-5, 5)], first = G.chance(0.5); const val = first ? (v[0] + v[1]) / Math.SQRT2 : (v[0] - v[1]) / Math.SQRT2; return nu("Bezüglich der Orthonormalbasis $u_1 = \\tfrac{1}{\\sqrt2}(1, 1)$, $u_2 = \\tfrac{1}{\\sqrt2}(1, -1)$: Welche " + (first ? "erste" : "zweite") + " Koordinate hat $v = " + vec(v) + "$? (zwei Nachkommastellen)", val, "In einer Orthonormalbasis ist die Koordinate einfach das Skalarprodukt: $\\langle v, u_" + (first ? 1 : 2) + " \\rangle = \\tfrac{" + (first ? v[0] + v[1] : v[0] - v[1]) + "}{\\sqrt2}$. Kein Gleichungssystem nötig.", { tolerance: 0.006 }); }],
    4: [
      KL(ch("Gram-Schmidt auf $1, x$ bezüglich $\\langle p, q \\rangle = \\int_0^1 pq\\,dx$ (ohne Normieren). Was entsteht aus $x$?", "$x - \\tfrac12$",
        [["$x$", "$\\langle x, 1 \\rangle = \\tfrac12 \\ne 0$: $x$ ist nicht orthogonal zu $1$."], ["$x - 1$", "$\\langle x - 1, 1 \\rangle = -\\tfrac12$."], ["$x^2 - \\tfrac13$", "Das gehört zu $x^2$, und auf $[-1, 1]$."]],
        "$x - \\tfrac{\\langle x, 1 \\rangle}{\\langle 1, 1 \\rangle} \\cdot 1 = x - \\tfrac12$. Probe: $\\int_0^1 (x - \\tfrac12)\\,dx = 0$.")),
      KL(nu("Berechne $\\|x - \\tfrac12\\|^2$ bezüglich $\\langle p, q \\rangle = \\int_0^1 pq\\,dx$ (vier Nachkommastellen).", 1 / 12, "$\\int_0^1 (x - \\tfrac12)^2\\,dx = \\tfrac{1}{12}$. Das normierte Polynom ist $\\sqrt{12}(x - \\tfrac12)$.", { tolerance: 0.0002 })),
      KL(tf("Paarweise orthogonale Vektoren $\\ne 0$ sind linear unabhängig.", true, "Aus $\\sum c_iv_i = 0$ folgt durch Skalarprodukt mit $v_k$: $c_k\\|v_k\\|^2 = 0$, also $c_k = 0$.")),
      EX(ch("Gram-Schmidt auf $1, x, x^2$ bezüglich $\\int_{-1}^1 pq\\,dx$. Was entsteht aus $x^2$ (ohne Normieren)?", "$x^2 - \\tfrac13$",
        [["$x^2$", "$\\langle x^2, 1 \\rangle = \\tfrac23 \\ne 0$."], ["$x^2 - x$", "$x^2$ und $x$ sind auf $[-1, 1]$ schon orthogonal (ungerader Integrand)."], ["$x^2 - \\tfrac12$", "$\\langle x^2, 1 \\rangle / \\langle 1, 1 \\rangle = \\tfrac{2/3}{2} = \\tfrac13$."]],
        "Das sind (bis auf Faktoren) die Legendre-Polynome $1, x, \\tfrac12(3x^2 - 1)$.")),
      EX(tf("Wendet man Gram-Schmidt auf linear abhängige Vektoren an, entsteht irgendwann der Nullvektor.", true, "Ist $v_k$ eine Kombination der vorigen, so ist es auch eine der schon konstruierten $u_1, \\dots, u_{k-1}$, und die Projektion zieht alles ab.")),
      EX(tf("Jede invertierbare reelle Matrix ist Produkt einer orthogonalen und einer oberen Dreiecksmatrix.", true, "QR-Zerlegung: Gram-Schmidt auf die Spalten liefert $Q$ mit orthonormalen Spalten, die Koeffizienten bilden $R$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-orthogonal (new)
  gen("la-orthogonal", byLevels("Orthogonale Matrizen und Projektionen", {
    1: [(lv, G) => {
      const [a, b, c] = G.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]), good = G.chance(0.6);
      const M = good ? [["\\tfrac{" + a + "}{" + c + "}", "-\\tfrac{" + b + "}{" + c + "}"], ["\\tfrac{" + b + "}{" + c + "}", "\\tfrac{" + a + "}{" + c + "}"]] : [["\\tfrac{" + a + "}{" + c + "}", "\\tfrac{" + b + "}{" + c + "}"], ["\\tfrac{" + b + "}{" + c + "}", "\\tfrac{" + a + "}{" + c + "}"]];
      return tf("$" + mat(M) + "$ ist orthogonal.", good, good ? "Die Spalten haben Länge $1$ ($" + a + "^2 + " + b + "^2 = " + c + "^2$) und sind orthogonal: eine Drehung." : "Die Spalten haben zwar Länge $1$, aber ihr Skalarprodukt ist $\\tfrac{" + 2 * a * b + "}{" + c * c + "} \\ne 0$.");
    }],
    2: [(lv, G) => {
      let u; do { u = [G.int(-3, 3), G.int(-3, 3)]; } while (!u[0] && !u[1]);
      const v = [G.int(-4, 4), G.int(-4, 4)], c = (v[0] * u[0] + v[1] * u[1]) / (u[0] * u[0] + u[1] * u[1]);
      return { type: "cloze", md: "Projiziere $v = " + vec(v) + "$ orthogonal auf die Gerade durch $u = " + vec(u) + "$ (zwei Nachkommastellen).\n\n$p = ($ {{0}} $,$ {{1}} $)$",
        blanks: [blank(c * u[0], 0.006), blank(c * u[1], 0.006)], explain: "$p = \\tfrac{\\langle v, u \\rangle}{\\langle u, u \\rangle}u$ mit $\\tfrac{" + (v[0] * u[0] + v[1] * u[1]) + "}{" + (u[0] * u[0] + u[1] * u[1]) + "}$. Probe: $v - p$ steht senkrecht auf $u$." };
    }],
    3: [(lv, G) => {
      const a = G.int(-3, 4), b = nz(G, -3, 3);
      return { type: "cloze", md: "Bestimme die Eigenwerte der symmetrischen Matrix $" + mat([[a, b], [b, a]]) + "$ (größeren zuerst).\n\n{{0}} $\\qquad$ {{1}}", blanks: [blank(a + Math.abs(b)), blank(a - Math.abs(b))],
        explain: "Eigenvektoren $(1, 1)$ und $(1, -1)$, orthogonal wie bei jeder symmetrischen Matrix: Eigenwerte $" + a + " \\pm " + Math.abs(b) + "$." };
    }],
    4: [
      KL(tf("Jede Matrix mit Determinante $1$ ist orthogonal.", false, "$\\begin{pmatrix}2&0\\\\0&\\frac12\\end{pmatrix}$ hat Determinante $1$, verzerrt aber Längen. Umgekehrt haben orthogonale Matrizen Determinante $\\pm 1$.")),
      KL(tf("Orthogonale Projektionen auf einen echten Unterraum sind orthogonale Matrizen.", false, "Eine Projektion $P \\ne E$ hat einen Kern, ist also nicht invertierbar, orthogonale Matrizen schon. Die Namen täuschen: $P = P^T = P^2$, aber nicht $P^TP = E$.")),
      KL((lv, G) => {
        const pts = [[1, G.int(0, 2)], [2, G.int(1, 4)], [3, G.int(2, 6)]];
        const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0), sxx = 14;
        return nu("Ausgleichsgerade **durch den Ursprung** $y = mx$ für die Punkte $" + pts.map((p) => "(" + p[0] + ", " + p[1] + ")").join(", ") + "$: Bestimme $m$ (drei Nachkommastellen).", sxy / sxx,
          "Kleinste Quadrate: $m = \\tfrac{\\sum x_iy_i}{\\sum x_i^2} = \\tfrac{" + sxy + "}{14}$. Das ist die orthogonale Projektion von $y$ auf die Gerade durch $x = (1, 2, 3)$.", { tolerance: 0.001 });
      }),
      KL(tf("Eigenvektoren einer reellen symmetrischen Matrix zu verschiedenen Eigenwerten stehen senkrecht aufeinander.", true, "$\\lambda\\langle v, w \\rangle = \\langle Av, w \\rangle = \\langle v, Aw \\rangle = \\mu\\langle v, w \\rangle$, mit $\\lambda \\ne \\mu$ also $\\langle v, w \\rangle = 0$.")),
      EX(tf("Jede orthogonale $3 \\times 3$-Matrix mit Determinante $1$ hat den Eigenwert $1$.", true, "$\\det(A - E) = \\det(A - AA^T) = \\det A \\det(E - A^T) = \\det(E - A) = -\\det(A - E)$ in ungerader Dimension, also $0$. Jede Drehung im Raum hat eine Achse (Satz von Euler).")),
      EX(tf("Ist $Q$ orthogonal, so sind alle reellen Eigenwerte $\\pm 1$, und komplexe haben den Betrag $1$.", true, "$\\|Qv\\| = \\|v\\|$, also $|\\lambda| = 1$.")),
      EX(nu("Welchen Abstand hat $(1, 2, 3)$ von der Ebene $x + y + z = 0$? (drei Nachkommastellen)", 6 / Math.sqrt(3), "Abstand $= \\tfrac{|\\langle v, n \\rangle|}{\\|n\\|}$ mit $n = (1, 1, 1)$: $\\tfrac{6}{\\sqrt3} = 2\\sqrt3 \\approx 3{,}464$.", { tolerance: 0.001 })),
    ],
  }));
})();
