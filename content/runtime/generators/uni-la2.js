/* Lineare Algebra I in depth, part 2: subspaces and sums, bases and dimension, linear maps, rank, matrices of maps,
 * similarity, quotient and dual space. Helpers come from uni-la1.js (LW.uni). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const U = LW.uni;
  const { gcd, range, vec, mat, det2, det3, mulMV, mulMM, rankOf, nz, par, blank, tf, ch, nu, pr, KL, EX, VS, pool, demote, expert, byLevels } = U;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const lin3 = (c) => { const n = ["x", "y", "z"]; let s = ""; c.forEach((v, i) => { if (!v) return; const a = Math.abs(v); const b = (a === 1 ? "" : a) + n[i]; s += s ? (v < 0 ? " - " : " + ") + b : (v < 0 ? "-" : "") + b; }); return s || "0"; };
  /** Integer 2x2 matrix with determinant +1 or -1 (its inverse is an integer matrix too). */
  function unimod(G) {
    const a = G.int(-2, 2), b = G.int(-2, 2);
    let M = mulMM([[1, a], [0, 1]], [[1, 0], [b, 1]]);
    if (G.chance(0.4)) M = mulMM(M, [[0, 1], [1, 0]]);
    return M;
  }
  const inv2 = (M) => { const d = det2(M); return [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]].map((r) => r.map((v) => (Object.is(v, -0) ? 0 : v))); };
  const qbin = (n, k, q) => { let num = 1, den = 1; for (let i = 0; i < k; i++) { num *= Math.pow(q, n - i) - 1; den *= Math.pow(q, k - i) - 1; } return num / den; };

  // ---------------------------------------------------------------- la-unterraum: deeper
  demote("la-unterraum");
  expert("la-unterraum", [
    KL((lv, G) => {
      let n; do { n = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)]; } while (!n.some((x) => x));
      let w;
      const inPlane = G.chance(0.45);
      if (inPlane) { let r; do { r = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; w = cross(n, r); } while (!w.some((x) => x)); const g = w.reduce((a, b) => gcd(a, b), 0) || 1; w = w.map((x) => x / g); }
      else { do { w = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)]; } while (!w.some((x) => x) || dot(n, w) === 0); }
      const d = dot(n, w);
      return tf("$U = \\{(x, y, z) : " + lin3(n) + " = 0\\}$ und $W = \\operatorname{span}\\{" + vec(w) + "\\}$. Es gilt $\\mathbb{R}^3 = U \\oplus W$.", d !== 0,
        "$U$ ist eine Ebene ($\\dim 2$), $W$ eine Gerade. Die Summe ist direkt und ganz $\\mathbb{R}^3$ genau dann, wenn $W \\cap U = \\{0\\}$, also wenn der Richtungsvektor nicht in $U$ liegt: Einsetzen ergibt $" + d + "$" + (d ? " $\\ne 0$. Dann $2 + 1 = 3$." : ", er liegt in $U$, also $U + W = U$."));
    }),
    KL(tf("$U \\cup W$ ist genau dann ein Unterraum, wenn $U \\subseteq W$ oder $W \\subseteq U$.", true,
      "Liegt weder das eine im anderen, nimm $u \\in U \\setminus W$ und $w \\in W \\setminus U$. Läge $u + w$ in $U$, dann auch $w = (u + w) - u$; läge es in $W$, dann auch $u$. Beides ist ausgeschlossen.")),
    KL(U.mu("Welche Teilmengen von $\\{f : \\mathbb{R} \\to \\mathbb{R}\\}$ sind Unterräume?",
      [["$\\{f \\text{ differenzierbar} : f' = f\\}$", true, "Die Bedingung $f' - f = 0$ ist linear in $f$."],
        ["$\\{f : f(x) = f(-x) \\text{ für alle } x\\}$", true, "Gerade Funktionen: Summen und Vielfache bleiben gerade."],
        ["$\\{f : \\lim_{x \\to \\infty} f(x) = 0\\}$", true, "Grenzwertsätze: Summen und Vielfache von Nullfolgen gehen gegen $0$."],
        ["$\\{f : f(0) = f(1) + 1\\}$", false, "Die Nullfunktion erfüllt $0 = 0 + 1$ nicht."],
        ["$\\{f : f \\text{ monoton wachsend}\\}$", false, "$x \\mapsto x$ liegt darin, $-1$ mal diese Funktion nicht."]],
      "Faustregel: Homogene lineare Bedingungen (gleich null, ohne Konstante) liefern Unterräume; Ungleichungen und Konstanten nicht.")),
    KL((lv, G) => {
      const n = G.int(2, 6), k = G.pick(["sym", "spur", "schief", "oben"]);
      const v = { sym: n * (n + 1) / 2, spur: n * n - 1, schief: n * (n - 1) / 2, oben: n * (n + 1) / 2 }[k];
      const name = { sym: "die symmetrischen Matrizen $A = A^T$", spur: "die Matrizen mit Spur $0$", schief: "die schiefsymmetrischen Matrizen $A^T = -A$", oben: "die oberen Dreiecksmatrizen" }[k];
      const why = { sym: "Frei wählbar sind die Einträge auf und über der Diagonale: $" + n + " + \\binom{" + n + "}{2}$.", spur: "Eine lineare Bedingung an $" + n * n + "$ Einträge.", schief: "Die Diagonale ist $0$, frei sind die Einträge über der Diagonale: $\\binom{" + n + "}{2}$.", oben: "Frei sind die Einträge auf und über der Diagonale." }[k];
      return nu("Welche Dimension hat der Unterraum der $" + n + " \\times " + n + "$-Matrizen, der aus " + name + " besteht?", v, why + " Ergebnis $" + v + "$.");
    }),
    EX(tf("$\\mathbb{F}_2^2$ ist die Vereinigung von drei echten Unterräumen.", true,
      "$\\mathbb{F}_2^2$ hat vier Vektoren. Jeder der drei Vektoren $\\ne 0$ spannt eine Gerade $\\{0, v\\}$ auf, und die drei Geraden überdecken alles. Über unendlichen Körpern ist ein Vektorraum nie Vereinigung endlich vieler echter Unterräume.")),
    EX(tf("Für Unterräume gilt stets $U \\cap (V + W) = (U \\cap V) + (U \\cap W)$.", false,
      "Drei verschiedene Geraden $U, V, W$ durch $0$ im $\\mathbb{R}^2$: $V + W = \\mathbb{R}^2$, also links $U$. Rechts $\\{0\\} + \\{0\\} = \\{0\\}$. Der Unterraumverband ist nicht distributiv.")),
    EX(tf("Über jedem Körper ist jede quadratische Matrix eindeutig Summe einer symmetrischen und einer schiefsymmetrischen Matrix.", false,
      "Die Zerlegung $A = \\tfrac12(A + A^T) + \\tfrac12(A - A^T)$ braucht $\\tfrac12$. In Charakteristik $2$ ist $-1 = 1$, schiefsymmetrisch heißt dort symmetrisch, und die beiden Unterräume schneiden sich nicht nur in $0$.")),
    EX(tf("Die Folgen, die nur endlich viele Glieder $\\ne 0$ haben, bilden einen Unterraum des Raums der konvergenten Folgen, aber keinen mit endlicher Dimension.", true,
      "Sie konvergieren gegen $0$, Summen und Vielfache bleiben endlich getragen. Die Folgen $e_k$ (eine $1$ an Stelle $k$) sind unendlich viele linear unabhängige Elemente.")),
  ]);

  // ---------------------------------------------------------------- la-linkomb: deeper
  demote("la-linkomb");
  expert("la-linkomb", [
    KL((lv, G) => {
      const a = G.int(-2, 2); let b; do { b = G.int(-2, 3); } while (b === a);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      return { type: "cloze", md: "Für welche $t$ liegt $" + vec([1, "t", "t^2"]) + "$ im Spann von $" + vec([1, a, a * a]) + "$ und $" + vec([1, b, b * b]) + "$? (kleineres $t$ zuerst)\n\n$t_1 =$ {{0}} $\\qquad t_2 =$ {{1}}",
        blanks: [blank(lo), blank(hi)], hint: "Die drei Vektoren sind genau dann linear abhängig, wenn ihre Determinante null ist.",
        explain: "Die Determinante der Vandermonde-Matrix ist $(" + b + " - " + par(a) + ")(t - " + par(a) + ")(t - " + par(b) + ")$. Sie verschwindet genau für $t = " + a + "$ und $t = " + b + "$, dann ist der Vektor einer der beiden gegebenen." };
    }),
    KL(tf("Für Teilmengen $A, B$ eines Vektorraums gilt $\\operatorname{span}(A \\cap B) = \\operatorname{span}A \\cap \\operatorname{span}B$.", false,
      "$A = \\{(1, 0)\\}$, $B = \\{(2, 0)\\}$: $A \\cap B = \\emptyset$, also links $\\{0\\}$; rechts die ganze $x$-Achse. Richtig ist nur $\\subseteq$. Für Vereinigungen gilt dagegen $\\operatorname{span}(A \\cup B) = \\operatorname{span}A + \\operatorname{span}B$.")),
    KL((lv, G) => {
      let C;
      const target = G.pick([2, 3, 3]);
      do { C = [[G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)], [0, 0, 0]]; const a = G.int(-1, 1), b = G.int(-1, 2); C[2] = target === 2 ? C[0].map((x, i) => a * x + b * C[1][i]) : [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; } while (rankOf(C) !== target || C.some((r) => !r.some((x) => x)));
      const term = (r) => { const nm = ["u", "v", "w"]; let s = ""; r.forEach((c, i) => { if (!c) return; const a = Math.abs(c); s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + (a === 1 ? "" : a) + nm[i]; }); return s; };
      return nu("$u, v, w$ sind linear unabhängig. Welche Dimension hat $\\operatorname{span}\\{" + C.map(term).join(",\\ ") + "\\}$?", target,
        "Die Dimension ist der Rang der Koeffizientenmatrix $" + mat(C) + "$, weil $u, v, w$ eine Basis ihres Spanns sind und Koordinaten die Abhängigkeiten genau übertragen. Rang $" + target + "$.");
    }),
    KL(tf("Liegt $w$ nicht im Spann von $v_1, \\dots, v_k$, und sind diese linear unabhängig, so sind auch $v_1, \\dots, v_k, w$ linear unabhängig.", true,
      "Aus $\\lambda_1 v_1 + \\dots + \\lambda_k v_k + \\mu w = 0$ mit $\\mu \\ne 0$ ließe sich $w$ als Kombination der $v_i$ schreiben. Also $\\mu = 0$, und dann sind alle $\\lambda_i = 0$.")),
    EX(tf("Über $\\mathbb{F}_2$ erzeugen $(1, 1, 0)$, $(1, 0, 1)$, $(0, 1, 1)$ den Raum $\\mathbb{F}_2^3$.", false,
      "Ihre Summe ist $(2, 2, 2) = (0, 0, 0)$: Sie sind linear abhängig und spannen nur eine Ebene mit vier Elementen auf. Über $\\mathbb{R}$ dagegen ist die Determinante $2 \\ne 0$.")),
    EX(tf("$1$, $\\sqrt2$ und $\\sqrt8$ sind über $\\mathbb{Q}$ linear unabhängig.", false, "$\\sqrt8 = 2\\sqrt2$, also $2 \\cdot \\sqrt2 - 1 \\cdot \\sqrt8 = 0$.")),
    EX(tf("$1$, $\\sqrt2$ und $\\sqrt3$ sind über $\\mathbb{Q}$ linear unabhängig.", true,
      "Aus $a + b\\sqrt2 = -c\\sqrt3$ folgt durch Quadrieren $a^2 + 2b^2 + 2ab\\sqrt2 = 3c^2$. Weil $\\sqrt2$ irrational ist, muss $ab = 0$ sein; die Fälle $a = 0$ und $b = 0$ führen auf $\\sqrt{3/2}$ oder $\\sqrt3$ rational, Widerspruch, außer alle Koeffizienten sind $0$.")),
    EX(nu("Wie viele verschiedene Vektoren lassen sich aus drei linear unabhängigen Vektoren über $\\mathbb{F}_3$ linear kombinieren?", 27,
      "Drei Koeffizienten aus $\\{0, 1, 2\\}$, und wegen der linearen Unabhängigkeit geben verschiedene Koeffizienten verschiedene Vektoren: $3^3 = 27$.")),
  ]);

  // ---------------------------------------------------------------- la-basis: deeper
  demote("la-basis");
  expert("la-basis", [
    KL(tf("Sind $v_1, v_2, v_3$ paarweise linear unabhängig, so sind sie linear unabhängig.", false, "$(1, 0)$, $(0, 1)$, $(1, 1)$ sind paarweise unabhängig, aber drei Vektoren im $\\mathbb{R}^2$ sind immer abhängig.")),
    KL(tf("Sind $v_1, \\dots, v_n$ linear unabhängig, so auch $v_1,\\ v_1 + v_2,\\ \\dots,\\ v_1 + \\dots + v_n$.", true, "Die Koeffizientenmatrix ist eine Dreiecksmatrix mit Einsen auf der Diagonale, also invertierbar. Umgekehrt: $v_k = (v_1 + \\dots + v_k) - (v_1 + \\dots + v_{k-1})$.")),
    KL(tf("Sind $u, v, w$ linear unabhängig, so auch $u - v,\\ v - w,\\ w - u$.", false, "Die Summe der drei ist $0$: $(u - v) + (v - w) + (w - u) = 0$.")),
    KL((lv, G) => {
      // polynomials in R[x]_<=2 as coefficient rows; rank decides the dimension
      let rows; const r = G.pick([2, 3]);
      do {
        const a = [G.int(-2, 2), G.int(-2, 2), G.int(-1, 2)], b = [G.int(-2, 2), G.int(-1, 2), G.int(-2, 2)];
        const s = G.int(-1, 1), t = G.int(-1, 2);
        const c = r === 2 ? a.map((x, i) => s * x + t * b[i]) : [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)];
        rows = [a, b, c];
      } while (rankOf(rows) !== r || rows.some((q) => !q.some((x) => x)));
      return nu("Welche Dimension hat $\\operatorname{span}\\{" + rows.map((q) => U.poly(q)).join(",\\ ") + "\\} \\subseteq \\mathbb{R}[x]_{\\le 2}$?", r,
        "Koordinaten bezüglich $1, x, x^2$ machen aus den Polynomen die Zeilen $" + mat(rows) + "$. Die Dimension ist deren Rang: $" + r + "$.");
    }),
    KL(ch("$V$ hat Dimension $n$, und $v_1, \\dots, v_n \\in V$. Welche Bedingung allein reicht **nicht**, damit sie eine Basis bilden?", "Kein $v_i$ ist ein Vielfaches eines anderen",
      [["Sie sind linear unabhängig", "Das reicht: $n$ unabhängige Vektoren in einem $n$-dimensionalen Raum sind eine Basis."], ["Sie erzeugen $V$", "Das reicht ebenso: Ein Erzeugendensystem aus $n$ Vektoren ist minimal."], ["Jedes $v \\in V$ ist eindeutig ihre Linearkombination", "Das ist sogar die Definition."]],
      "Paarweise nicht parallel heißt noch nicht unabhängig, siehe $(1, 0), (0, 1), (1, 1)$ im $\\mathbb{R}^2$ mit einem vierten Vektor.")),
    EX(tf("Über jedem Körper gilt: Sind $u, v, w$ linear unabhängig, so auch $u + v,\\ v + w,\\ w + u$.", false,
      "Die Koeffizientenmatrix hat Determinante $2$. Über $\\mathbb{R}$ also unabhängig, über $\\mathbb{F}_2$ nicht: Dort ist $(u + v) + (v + w) + (w + u) = 2(u + v + w) = 0$.")),
    EX(tf("Die Funktionen $\\sin^2$, $\\cos^2$ und $1$ sind linear unabhängig.", false, "$\\sin^2 x + \\cos^2 x - 1 = 0$ für alle $x$.")),
    EX(tf("Die Funktionen $e^x$, $e^{2x}$, $e^{3x}$ sind linear unabhängig.", true,
      "Aus $a e^x + b e^{2x} + c e^{3x} = 0$ folgt nach Division durch $e^{3x}$ und $x \\to \\infty$ zuerst $c = 0$, dann ebenso $b = 0$ und $a = 0$. Allgemein sind Exponentialfunktionen zu verschiedenen Raten unabhängig.")),
    EX((lv, G) => {
      const [q, n] = G.pick([[2, 2], [2, 3], [3, 2]]);
      let v = 1; const fac = [];
      for (let i = 0; i < n; i++) { const f = Math.pow(q, n) - Math.pow(q, i); v *= f; fac.push(f); }
      return nu("Wie viele **geordnete** Basen hat $\\mathbb{F}_" + q + "^" + n + "$?", v,
        "Der erste Vektor: alles außer $0$, also $" + q + "^" + n + " - 1$. Der zweite: alles außer dem Spann des ersten, $" + q + "^" + n + " - " + q + "$. Und so weiter: $" + fac.join(" \\cdot ") + " = " + v + "$. Das ist zugleich die Zahl der invertierbaren $" + n + " \\times " + n + "$-Matrizen über $\\mathbb{F}_" + q + "$.");
    }),
    EX(tf("$\\mathbb{R}$ hat als Vektorraum über $\\mathbb{Q}$ eine abzählbare Basis.", false,
      "Der $\\mathbb{Q}$-Spann einer abzählbaren Menge ist abzählbar (abzählbar viele endliche Kombinationen mit rationalen Koeffizienten), $\\mathbb{R}$ ist es nicht. Eine Basis (Hamel-Basis) existiert nur mit dem Auswahlaxiom und ist überabzählbar.")),
  ]);

  // ---------------------------------------------------------------- la-summe (new)
  gen("la-summe", byLevels("Summen und Durchschnitte", {
    1: [(lv, G) => {
      const n = G.int(4, 8), a = G.int(1, n - 1), b = G.int(1, n - 1);
      const c = G.int(Math.max(0, a + b - n), Math.min(a, b));
      return nu("$U, W \\subseteq \\mathbb{R}^{" + n + "}$ mit $\\dim U = " + a + "$, $\\dim W = " + b + "$, $\\dim(U \\cap W) = " + c + "$. Welche Dimension hat $U + W$?", a + b - c,
        "Dimensionsformel: $\\dim(U + W) = \\dim U + \\dim W - \\dim(U \\cap W) = " + a + " + " + b + " - " + c + " = " + (a + b - c) + "$. Der Durchschnitt würde sonst doppelt gezählt.");
    }],
    2: [(lv, G) => {
      let n; do { n = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; } while (!n.some((x) => x));
      let w; const inside = G.chance(0.5);
      if (inside) { do { w = cross(n, [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]); } while (!w.some((x) => x)); }
      else { do { w = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; } while (!w.some((x) => x) || !dot(n, w)); }
      return tf("$U = \\{(x, y, z) : " + lin3(n) + " = 0\\}$, $W = \\operatorname{span}\\{" + vec(w) + "\\}$. Die Summe $U + W$ ist **direkt**.", !inside,
        "Direkt heißt $U \\cap W = \\{0\\}$. Der Richtungsvektor liefert eingesetzt $" + dot(n, w) + "$: " + (inside ? "Er liegt in $U$, also $W \\subseteq U$ und die Summe ist nicht direkt." : "Er liegt nicht in $U$, der Durchschnitt ist $\\{0\\}$."));
    }],
    3: [(lv, G) => {
      const n = G.int(4, 9), a = G.int(1, n - 1), b = G.int(1, n - 1), mn = G.chance(0.6);
      const v = mn ? Math.max(0, a + b - n) : Math.min(a, b);
      return nu("$U, W \\subseteq \\mathbb{R}^{" + n + "}$ mit $\\dim U = " + a + "$ und $\\dim W = " + b + "$. Was ist der **" + (mn ? "kleinstmögliche" : "größtmögliche") + "** Wert von $\\dim(U \\cap W)$?", v,
        mn ? "Aus $\\dim(U + W) \\le " + n + "$ folgt $\\dim(U \\cap W) = " + a + " + " + b + " - \\dim(U + W) \\ge " + (a + b - n) + "$, und nie unter $0$. Der Wert $" + v + "$ wird erreicht, wenn man die Basen möglichst getrennt wählt."
          : "$U \\cap W$ liegt in beiden, also höchstens $\\min(" + a + ", " + b + ") = " + v + "$; erreicht, wenn der kleinere im größeren liegt.");
    }],
    4: [
      KL(pr("Baue den Beweis.", "$U, W$ sind Unterräume von $V$, und $U \\cup W$ ist ein Unterraum.", "$U \\subseteq W$ oder $W \\subseteq U$.",
        ["Angenommen, weder $U \\subseteq W$ noch $W \\subseteq U$.", "Dann gibt es $u \\in U \\setminus W$ und $w \\in W \\setminus U$.", "Weil $U \\cup W$ ein Unterraum ist, liegt $u + w$ in $U$ oder in $W$.", "Liegt $u + w$ in $U$, dann auch $w = (u + w) - u$, Widerspruch; liegt es in $W$, dann auch $u = (u + w) - w$, Widerspruch."],
        [["Dann ist $u + w = 0$.", "Dafür gibt es keinen Grund; man weiß nur, dass $u + w$ in der Vereinigung liegt."], ["Also ist $U = W$.", "Behauptet ist nur, dass einer im anderen liegt."]],
        "Widerspruchsbeweis mit einem Element aus jeder Differenzmenge.")),
      KL(tf("Zu jedem Unterraum $U$ eines endlichdimensionalen $V$ gibt es genau ein $W$ mit $V = U \\oplus W$.", false, "Komplemente gibt es immer (Basisergänzung), eindeutig sind sie nicht: Die $x$-Achse im $\\mathbb{R}^2$ hat jede andere Gerade durch $0$ als Komplement.")),
      KL((lv, G) => { const n = G.int(3, 8); return nu("Zwei verschiedene Unterräume der Dimension $" + (n - 1) + "$ im $\\mathbb{R}^{" + n + "}$ schneiden sich in einem Unterraum welcher Dimension?", n - 2, "Ihre Summe ist echt größer als jeder von beiden, also ganz $\\mathbb{R}^{" + n + "}$. Dimensionsformel: $" + (n - 1) + " + " + (n - 1) + " - " + n + " = " + (n - 2) + "$."); }),
      KL(tf("Für Unterräume $U, W$ gilt $U + W = U \\cap W$ genau dann, wenn $U = W$.", true, "$U \\subseteq U + W = U \\cap W \\subseteq W$ und symmetrisch $W \\subseteq U$. Umgekehrt ist $U + U = U = U \\cap U$.")),
      EX(tf("Für Unterräume gilt stets $U \\cap (V + W) = (U \\cap V) + (U \\cap W)$.", false, "Drei verschiedene Geraden durch $0$ im $\\mathbb{R}^2$: links $U$, rechts $\\{0\\}$.")),
      EX((lv, G) => { const q = G.pick([2, 3, 5, 7]); return nu("Wie viele Komplemente hat eine feste Gerade $U$ (Unterraum der Dimension $1$) im $\\mathbb{F}_" + q + "^2$?", q, "Ein Komplement ist eine andere Gerade. Im $\\mathbb{F}_" + q + "^2$ gibt es $\\tfrac{" + q + "^2 - 1}{" + q + " - 1} = " + (q + 1) + "$ Geraden, also $" + q + "$ Komplemente zu $U$."); }),
      EX(tf("$\\mathbb{F}_2^2$ ist die Vereinigung von drei echten Unterräumen.", true, "Die drei Geraden $\\{0, v\\}$ mit $v \\ne 0$ überdecken alle vier Vektoren.")),
    ],
  }));

  // ---------------------------------------------------------------- la-dimension (new)
  gen("la-dimension", byLevels("Dimension", {
    1: [(lv, G) => {
      const k = G.pick(["mat", "poly", "kn", "hom"]), m = G.int(2, 5), n = G.int(2, 5);
      const q = { mat: ["$\\mathbb{R}^{" + m + " \\times " + n + "}$", m * n, "Je ein Basisvektor pro Eintrag: $E_{ij}$."], poly: ["$\\mathbb{R}[x]_{\\le " + n + "}$", n + 1, "Basis $1, x, \\dots, x^{" + n + "}$: $" + (n + 1) + "$ Elemente, nicht $" + n + "$."], kn: ["$\\mathbb{C}^{" + n + "}$ als komplexer Vektorraum", n, "Die Standardbasis hat $" + n + "$ Vektoren."], hom: ["$\\operatorname{Hom}(\\mathbb{R}^{" + n + "}, \\mathbb{R}^{" + m + "})$", m * n, "Jede lineare Abbildung ist eine $" + m + " \\times " + n + "$-Matrix."] }[k];
      return nu("Welche Dimension hat " + q[0] + "?", q[1], q[2] + " Dimension $" + q[1] + "$.");
    }],
    2: [(lv, G) => {
      const k = G.pick(["roots", "kernel", "trace"]), n = G.int(2, 5);
      if (k === "roots") { const r = G.int(1, n); return nu("Welche Dimension hat $\\{p \\in \\mathbb{R}[x]_{\\le " + n + "} : p(1) = p(2) = \\dots = p(" + r + ") = 0\\}$?", n + 1 - r, "$" + r + "$ Bedingungen an verschiedenen Stellen sind linear unabhängig (Interpolation), also $" + (n + 1) + " - " + r + " = " + (n + 1 - r) + "$. Basis: $(x - 1)\\cdots(x - " + r + ") \\cdot x^k$ für $k = 0, \\dots, " + (n - r) + "$."); }
      if (k === "kernel") { const m = G.int(2, 4); return nu("$v \\ne 0$ ist ein fester Vektor im $\\mathbb{R}^{" + n + "}$. Welche Dimension hat $\\{A \\in \\mathbb{R}^{" + m + " \\times " + n + "} : Av = 0\\}$?", m * (n - 1), "Ergänze $v$ zu einer Basis. $Av = 0$ legt die Bilder von $v$ fest, die übrigen $" + (n - 1) + "$ Basisbilder im $\\mathbb{R}^{" + m + "}$ sind frei: $" + m + " \\cdot " + (n - 1) + " = " + m * (n - 1) + "$."); }
      return nu("Welche Dimension hat $\\{A \\in \\mathbb{R}^{" + n + " \\times " + n + "} : \\operatorname{Spur} A = 0\\}$?", n * n - 1, "Die Spur ist eine lineare Abbildung $\\mathbb{R}^{" + n + " \\times " + n + "} \\to \\mathbb{R}$ und nicht null, ihr Kern hat Dimension $" + n * n + " - 1$.");
    }],
    3: [(lv, G) => {
      const n = G.int(2, 6), k = G.pick(["sym", "schief", "diag", "e1"]);
      const v = { sym: n * (n + 1) / 2, schief: n * (n - 1) / 2, diag: n, e1: n * (n - 1) }[k];
      const name = { sym: "der symmetrischen $" + n + " \\times " + n + "$-Matrizen", schief: "der schiefsymmetrischen $" + n + " \\times " + n + "$-Matrizen", diag: "der $" + n + " \\times " + n + "$-Diagonalmatrizen", e1: "der $" + n + " \\times " + n + "$-Matrizen $A$ mit $Ae_1 = 0$" }[k];
      const why = { sym: "Frei sind die Einträge auf und über der Diagonale: $" + n + " + \\binom{" + n + "}{2}$.", schief: "Die Diagonale ist null, frei sind die Einträge darüber: $\\binom{" + n + "}{2}$.", diag: "Frei sind nur die Diagonaleinträge.", e1: "$Ae_1 = 0$ heißt: Die erste Spalte ist null, die übrigen $" + (n - 1) + "$ Spalten sind frei." }[k];
      return nu("Welche Dimension hat der Raum " + name + "?", v, why + " Ergebnis $" + v + "$. Symmetrische und schiefsymmetrische zusammen ergeben $" + n * n + "$, denn $\\mathbb{R}^{n \\times n} = \\mathrm{Sym} \\oplus \\mathrm{Schief}$.");
    }],
    4: [
      KL(tf("Sind $U, W \\subseteq \\mathbb{R}^7$ Unterräume der Dimension $4$, so ist $U \\cap W \\ne \\{0\\}$.", true, "$\\dim(U \\cap W) \\ge 4 + 4 - 7 = 1$.")),
      KL(tf("$\\mathbb{C}^n$ ist als **reeller** Vektorraum $2n$-dimensional.", true, "Basis $e_1, ie_1, \\dots, e_n, ie_n$: Real- und Imaginärteile sind getrennt frei.")),
      KL(nu("Welche Dimension hat $\\{p \\in \\mathbb{R}[x]_{\\le 4} : p(1) = 0,\\ p'(1) = 0\\}$?", 3, "Zwei unabhängige Bedingungen an einen $5$-dimensionalen Raum: $(x - 1)^2$ teilt $p$, also $p = (x - 1)^2 q$ mit $\\deg q \\le 2$: Dimension $3$.")),
      KL(tf("Jeder Unterraum eines endlichdimensionalen Vektorraums hat ein Komplement.", true, "Ergänze eine Basis von $U$ zu einer Basis von $V$; die hinzugekommenen Vektoren spannen ein Komplement auf.")),
      EX((lv, G) => { const [q, n] = G.pick([[2, 2], [2, 3], [2, 4], [3, 2], [3, 3]]); const v = (Math.pow(q, n) - 1) / (q - 1); return nu("Wie viele Unterräume der Dimension $1$ hat $\\mathbb{F}_" + q + "^" + n + "$?", v, "Jede Gerade enthält $" + (q - 1) + "$ Vektoren $\\ne 0$, und jeder Vektor $\\ne 0$ liegt in genau einer: $\\tfrac{" + q + "^" + n + " - 1}{" + (q - 1) + "} = " + v + "$."); }),
      EX(nu("Wie viele Unterräume der Dimension $2$ hat $\\mathbb{F}_2^4$?", qbin(4, 2, 2), "Geordnete Paare unabhängiger Vektoren: $15 \\cdot 14$. Jede Ebene enthält $3 \\cdot 2$ solche Paare. Also $\\tfrac{15 \\cdot 14}{3 \\cdot 2} = 35$.")),
      EX(tf("Die reellen Folgen mit $a_{n+2} = a_{n+1} + a_n$ bilden einen Vektorraum der Dimension $2$.", true, "Die Bedingung ist linear, und $(a_0, a_1)$ legt die Folge fest: $a \\mapsto (a_0, a_1)$ ist ein Isomorphismus auf $\\mathbb{R}^2$. Eine Basis bilden die geometrischen Folgen $\\varphi^n$ und $(1 - \\varphi)^n$ mit dem Goldenen Schnitt $\\varphi$.")),
      EX(tf("$\\mathbb{R}$ hat als $\\mathbb{Q}$-Vektorraum unendliche Dimension.", true, "Endliche Dimension $n$ hieße $\\mathbb{R} \\cong \\mathbb{Q}^n$, und das ist abzählbar.")),
    ],
  }));

  // ---------------------------------------------------------------- la-abbildung (new)
  const LINEAR = [
    { md: "$(x, y) \\mapsto (y, x)$ auf $\\mathbb{R}^2$", ok: true, why: "Vertauschen ist mit Summen und Vielfachen verträglich." },
    { md: "$x \\mapsto 2x + 1$ auf $\\mathbb{R}$", ok: false, why: "$0 \\mapsto 1$; linear wäre $0 \\mapsto 0$." },
    { md: "$(x, y) \\mapsto (xy, 0)$", ok: false, why: "$2 \\cdot (1, 1) \\mapsto (4, 0)$, aber $2 \\cdot (1, 0) = (2, 0)$." },
    { md: "$p \\mapsto p'$ auf $\\mathbb{R}[x]$", ok: true, why: "Die Ableitung ist linear: $(p + q)' = p' + q'$, $(\\lambda p)' = \\lambda p'$." },
    { md: "$p \\mapsto p(2)$ auf $\\mathbb{R}[x]$", ok: true, why: "Auswerten ist linear." },
    { md: "$p \\mapsto p + 1$ auf $\\mathbb{R}[x]$", ok: false, why: "Das Nullpolynom geht auf $1$." },
    { md: "$A \\mapsto A^T$ auf $\\mathbb{R}^{2 \\times 2}$", ok: true, why: "$(A + B)^T = A^T + B^T$, $(\\lambda A)^T = \\lambda A^T$." },
    { md: "$A \\mapsto \\det A$ auf $\\mathbb{R}^{2 \\times 2}$", ok: false, why: "$\\det(2E) = 4 \\ne 2 \\det E$." },
    { md: "$A \\mapsto \\operatorname{Spur} A$", ok: true, why: "Die Spur ist die Summe der Diagonaleinträge, linear in $A$." },
    { md: "$f \\mapsto f(1)^2$", ok: false, why: "$(2f)(1)^2 = 4f(1)^2$." },
    { md: "$f \\mapsto \\int_0^1 f(x)\\,dx$ auf den stetigen Funktionen", ok: true, why: "Das Integral ist linear." },
    { md: "$(x, y) \\mapsto (|x|, y)$", ok: false, why: "$(-1) \\cdot (1, 0) \\mapsto (1, 0)$, linear wäre $(-1, 0)$." },
  ];
  gen("la-abbildung", byLevels("Lineare Abbildungen", {
    1: [(lv, G) => { const s = G.pick(LINEAR); return tf(s.md + " ist linear.", s.ok, s.why); }],
    2: [(lv, G) => {
      const S = unimod(G), W = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]];
      const b1 = [S[0][0], S[1][0]], b2 = [S[0][1], S[1][1]], c = [G.int(-2, 2), G.int(-2, 2)];
      const v = [c[0] * b1[0] + c[1] * b2[0], c[0] * b1[1] + c[1] * b2[1]];
      const w1 = [W[0][0], W[1][0]], w2 = [W[0][1], W[1][1]];
      const fv = [c[0] * w1[0] + c[1] * w2[0], c[0] * w1[1] + c[1] * w2[1]];
      return { type: "cloze", md: "$f: \\mathbb{R}^2 \\to \\mathbb{R}^2$ ist linear mit $f" + vec(b1) + " = " + vec(w1) + "$ und $f" + vec(b2) + " = " + vec(w2) + "$. Berechne $f" + vec(v) + "$.\n\n$f(v) = ($ {{0}} $,$ {{1}} $)$",
        blanks: [blank(fv[0]), blank(fv[1])], hint: "Schreibe $v$ als Linearkombination der beiden Vektoren, deren Bilder bekannt sind.",
        explain: "$" + vec(v) + " = " + c[0] + " \\cdot " + vec(b1) + " " + G.term(c[1]) + " \\cdot " + vec(b2) + "$, also $f(v) = " + c[0] + " \\cdot " + vec(w1) + " " + G.term(c[1]) + " \\cdot " + vec(w2) + " = " + vec(fv) + "$. Eine lineare Abbildung ist durch die Bilder einer Basis festgelegt." };
    }],
    3: [(lv, G) => {
      const n = G.int(2, 5), k = G.pick(["rank", "ker", "nil", "trace"]);
      const q = { rank: ["den Rang", n, "Das Bild ist $\\mathbb{R}[x]_{\\le " + (n - 1) + "}$, Dimension $" + n + "$."], ker: ["die Dimension des Kerns", 1, "Der Kern sind die Konstanten."], nil: ["das kleinste $k$ mit $D^k = 0$", n + 1, "$D^{" + n + "}x^{" + n + "} = " + n + "! \\ne 0$, aber $D^{" + (n + 1) + "} = 0$."], trace: ["die Spur", 0, "Die Matrix bezüglich $1, x, \\dots$ hat nur Einträge über der Diagonale."] }[k];
      return nu("$D: \\mathbb{R}[x]_{\\le " + n + "} \\to \\mathbb{R}[x]_{\\le " + n + "}$, $p \\mapsto p'$. Bestimme " + q[0] + " von $D$.", q[1], q[2] + " Ergebnis $" + q[1] + "$; Dimensionsformel: $" + (n + 1) + " = 1 + " + n + "$.");
    }],
    4: [
      KL(tf("Es gibt eine lineare Abbildung $f: \\mathbb{R}^2 \\to \\mathbb{R}^2$ mit $f(1, 0) = (1, 1)$, $f(0, 1) = (2, 2)$ und $f(1, 1) = (3, 4)$.", false, "Linearität erzwingt $f(1, 1) = f(1, 0) + f(0, 1) = (3, 3) \\ne (3, 4)$. Vorgeben darf man nur die Bilder einer Basis, keine weiteren.")),
      KL(tf("Ist $f$ linear und sind $v_1, \\dots, v_k$ linear abhängig, so sind $f(v_1), \\dots, f(v_k)$ linear abhängig.", true, "Die Relation $\\sum \\lambda_i v_i = 0$ mit nicht allen $\\lambda_i = 0$ überträgt sich: $\\sum \\lambda_i f(v_i) = f(0) = 0$.")),
      KL(tf("Ist $f$ linear und sind $v_1, \\dots, v_k$ linear unabhängig, so sind $f(v_1), \\dots, f(v_k)$ linear unabhängig.", false, "Nur wenn $f$ injektiv ist. Die Nullabbildung macht alles abhängig.")),
      KL(nu("Welche Dimension hat $\\{f \\in \\operatorname{Hom}(\\mathbb{R}^3, \\mathbb{R}^2) : f(1, 1, 1) = 0\\}$?", 4, "Ergänze $(1, 1, 1)$ zu einer Basis. Sein Bild ist festgelegt, die zwei übrigen Basisbilder im $\\mathbb{R}^2$ sind frei: $2 \\cdot 2 = 4$. Oder: $6$ Dimensionen minus $2$ lineare Bedingungen.")),
      KL(ch("Welche Matrix hat $D: p \\mapsto p'$ auf $\\mathbb{R}[x]_{\\le 2}$ bezüglich der Basis $1, x, x^2$?", "$\\begin{pmatrix}0&1&0\\\\0&0&2\\\\0&0&0\\end{pmatrix}$",
        [["$\\begin{pmatrix}0&0&0\\\\1&0&0\\\\0&2&0\\end{pmatrix}$", "Das sind die Bilder als Zeilen; die Spalten müssen die Koordinaten von $D(1), D(x), D(x^2)$ sein."], ["$\\begin{pmatrix}0&1&0\\\\0&0&1\\\\0&0&0\\end{pmatrix}$", "$D(x^2) = 2x$, nicht $x$."], ["$\\begin{pmatrix}1&0&0\\\\0&2&0\\\\0&0&0\\end{pmatrix}$", "$D(1) = 0$, die erste Spalte ist null."]],
        "Spalte $j$ = Koordinaten des Bildes des $j$-ten Basisvektors: $D(1) = 0$, $D(x) = 1$, $D(x^2) = 2x$.")),
      EX(tf("$D: \\mathbb{R}[x] \\to \\mathbb{R}[x]$, $p \\mapsto p'$, ist surjektiv, aber nicht injektiv.", true, "Jedes Polynom hat eine Stammfunktion (surjektiv), die Konstanten liegen im Kern. In unendlicher Dimension trennen sich injektiv und surjektiv, in endlicher nie.")),
      EX(tf("Jede Abbildung $f: \\mathbb{R} \\to \\mathbb{R}$ mit $f(x + y) = f(x) + f(y)$ für alle $x, y$ ist linear.", false, "Sie ist $\\mathbb{Q}$-linear: $f(qx) = qf(x)$ für rationale $q$. Ist sie stetig, folgt $f(x) = f(1)x$. Ohne Stetigkeit gibt es mit einer Hamel-Basis von $\\mathbb{R}$ über $\\mathbb{Q}$ wilde Lösungen, deren Graph dicht in der Ebene liegt.")),
      EX(nu("Wie viele bijektive lineare Abbildungen $\\mathbb{F}_2^2 \\to \\mathbb{F}_2^2$ gibt es?", 6, "Bild von $e_1$: einer der $3$ Vektoren $\\ne 0$; Bild von $e_2$: einer der $2$ Vektoren außerhalb dessen Spann. $3 \\cdot 2 = 6$; die Gruppe $\\mathrm{GL}_2(\\mathbb{F}_2)$ ist isomorph zu $S_3$.")),
      EX(tf("Auf einem endlichdimensionalen Raum gibt es keine lineare Abbildung $V \\to V$, die surjektiv, aber nicht injektiv ist.", true, "Dimensionsformel: surjektiv heißt $\\dim \\ker f = \\dim V - \\dim V = 0$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-rang (new)
  function rankMatrix(G, r, m, n) {
    let A;
    do {
      const C = range(1, m).map(() => range(1, r).map(() => G.int(-2, 2)));
      const R = range(1, r).map(() => range(1, n).map(() => G.int(-2, 2)));
      A = mulMM(C, R);
    } while (rankOf(A) !== r || A.some((row) => row.some((x) => Math.abs(x) > 9)));
    return A;
  }
  gen("la-rang", byLevels("Rang", {
    1: [(lv, G) => { const r = G.pick([1, 2, 2, 3]), A = rankMatrix(G, r, 3, 3); return nu("Welchen Rang hat $" + mat(A) + "$?", r, "Zeilenumformungen ändern den Rang nicht. Hier sind genau $" + r + "$ Zeilen linear unabhängig" + (r < 3 ? ", die übrigen sind Kombinationen davon" : "") + ". Determinante: $" + det3(A) + "$."); }],
    2: [(lv, G) => {
      let r1, r2; do { r1 = [1, G.int(-2, 2), G.int(-2, 2)]; r2 = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 2)]; } while (rankOf([r1, r2]) < 2 || r1[0] * r2[1] - r1[1] * r2[0] === 0);
      const a = G.int(-2, 2), b = nz(G, -2, 2);
      const r3 = r1.map((x, i) => a * x + b * r2[i]);
      const t0 = r3[2];
      return nu("Für welches $t$ hat $" + mat([r1, r2, [r3[0], r3[1], "t"]]) + "$ einen Rang kleiner als $3$?", t0,
        "Rang $< 3$ heißt: Die dritte Zeile ist eine Kombination der ersten beiden. Die ersten zwei Einträge legen sie fest: Zeile 3 $= " + a + " \\cdot$ Zeile 1 $" + G.term(b) + " \\cdot$ Zeile 2, und dann muss $t = " + t0 + "$ sein. Die Determinante ist linear in $t$ und genau dort null.");
    }],
    3: [(lv, G) => {
      const n = G.int(4, 8), r = G.int(1, n), s = G.int(1, n), lo = Math.max(0, r + s - n), hi = Math.min(r, s), up = G.chance(0.5);
      return nu("$A$ ist eine $" + n + " \\times " + n + "$-Matrix vom Rang $" + r + "$, $B$ eine vom Rang $" + s + "$. Welchen Rang kann $AB$ " + (up ? "**höchstens**" : "**mindestens**") + " haben?", up ? hi : lo,
        up ? "$\\operatorname{im}(AB) \\subseteq \\operatorname{im} A$ und $\\operatorname{rang}(AB) \\le \\operatorname{rang} B$: höchstens $\\min(" + r + ", " + s + ") = " + hi + "$."
          : "Sylvester: $\\operatorname{rang}(AB) \\ge \\operatorname{rang} A + \\operatorname{rang} B - " + n + " = " + (r + s - n) + "$, und nie unter $0$: mindestens $" + lo + "$. Grund: $\\dim \\ker(AB) \\le \\dim \\ker A + \\dim \\ker B$.");
    }],
    4: [
      KL((lv, G) => {
        const n = G.int(3, 7), k = G.pick(["sum", "prod", "sign"]);
        const q = { sum: ["a_{ij} = i + j", 2, "Zeile $i$ ist $i \\cdot (1, \\dots, 1) + (1, 2, \\dots, " + n + ")$: Alle Zeilen liegen im Spann zweier Vektoren, und die ersten beiden sind unabhängig."], prod: ["a_{ij} = i \\cdot j", 1, "Zeile $i$ ist $i \\cdot (1, 2, \\dots, " + n + ")$, alle Zeilen sind Vielfache einer einzigen."], sign: ["a_{ij} = (-1)^{i+j}", 1, "Zeile $i$ ist $(-1)^i$ mal $(-1, 1, -1, \\dots)$."] }[k];
        return nu("Welchen Rang hat die $" + n + " \\times " + n + "$-Matrix mit $" + q[0] + "$?", q[1], q[2] + " Rang $" + q[1] + "$, unabhängig von der Größe.");
      }),
      KL(tf("Für jede reelle Matrix $A$ gilt $\\operatorname{rang}(A^TA) = \\operatorname{rang} A$.", true, "$\\ker(A^TA) = \\ker A$: Aus $A^TAx = 0$ folgt $0 = x^TA^TAx = \\|Ax\\|^2$, also $Ax = 0$. Gleich viele Spalten, also gleicher Rang.")),
      KL(nu("$A \\in \\mathbb{R}^{6 \\times 6}$ erfüllt $A^2 = 0$. Welchen Rang kann $A$ höchstens haben?", 3, "$A^2 = 0$ heißt $\\operatorname{im} A \\subseteq \\ker A$, also $\\operatorname{rang} A \\le 6 - \\operatorname{rang} A$, somit $\\operatorname{rang} A \\le 3$. Erreicht von $e_4 \\mapsto e_1$, $e_5 \\mapsto e_2$, $e_6 \\mapsto e_3$, $e_1, e_2, e_3 \\mapsto 0$.")),
      KL(nu("Welchen Rang hat $\\begin{pmatrix}1&2&3\\\\4&5&6\\\\7&8&9\\end{pmatrix}$?", 2, "Zeile 3 $-$ Zeile 2 $=$ Zeile 2 $-$ Zeile 1 $= (3, 3, 3)$: Die Zeilen liegen auf einer Geraden (arithmetische Folge), also $2 \\cdot$ Zeile 2 $=$ Zeile 1 $+$ Zeile 3. Rang $2$.")),
      KL(tf("Für quadratische Matrizen gilt $\\operatorname{rang}(AB) = \\operatorname{rang}(BA)$.", false, "$A = \\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$, $B = \\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$: $AB = B$ hat Rang $1$, $BA = 0$ Rang $0$.")),
      EX(tf("Auch über $\\mathbb{C}$ gilt $\\operatorname{rang}(A^TA) = \\operatorname{rang} A$ (mit der gewöhnlichen Transponierten).", false, "$A = \\begin{pmatrix}1\\\\i\\end{pmatrix}$: $A^TA = 1 + i^2 = 0$, Rang $0$, aber $\\operatorname{rang} A = 1$. Richtig wird es mit der konjugiert Transponierten $A^*A$.")),
      EX(nu("Wie viele $2 \\times 2$-Matrizen über $\\mathbb{F}_2$ haben Rang $1$?", 9, "Insgesamt $2^4 = 16$. Rang $0$: nur die Nullmatrix. Rang $2$: die $6$ invertierbaren. Bleiben $16 - 1 - 6 = 9$.")),
      EX(tf("Für alle Matrizen gleicher Größe gilt $\\operatorname{rang}(A + B) \\ge |\\operatorname{rang} A - \\operatorname{rang} B|$.", true, "$\\operatorname{rang} A = \\operatorname{rang}((A + B) - B) \\le \\operatorname{rang}(A + B) + \\operatorname{rang} B$, ebenso mit vertauschten Rollen.")),
      EX(tf("Ist $A \\in \\mathbb{R}^{n \\times n}$ mit $A^k = 0$ für ein $k$, so ist $\\operatorname{rang} A \\le n - \\tfrac nk$.", true, "Die Kerne $\\ker A \\subseteq \\ker A^2 \\subseteq \\dots \\subseteq \\ker A^k = \\mathbb{R}^n$ wachsen in jedem Schritt um höchstens $\\dim \\ker A$, also $n \\le k \\dim \\ker A$, und $\\operatorname{rang} A = n - \\dim\\ker A \\le n - \\tfrac nk$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-abbmatrix (new)
  gen("la-abbmatrix", byLevels("Abbildungsmatrizen und Ähnlichkeit", {
    1: [(lv, G) => {
      const A = [[G.int(-3, 3), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 3)]];
      const f = (r) => { let s = ""; [[r[0], "x"], [r[1], "y"]].forEach(([c, v]) => { if (!c) return; const a = Math.abs(c); s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + (a === 1 ? "" : a) + v; }); return s || "0"; };
      return { type: "cloze", md: "Welche Matrix hat $f(x, y) = (" + f(A[0]) + ",\\ " + f(A[1]) + ")$ bezüglich der Standardbasis? Zeilenweise:\n\n{{0}} {{1}} {{2}} {{3}}",
        blanks: [blank(A[0][0]), blank(A[0][1]), blank(A[1][0]), blank(A[1][1])], explain: "Die Spalten sind $f(e_1) = " + vec([A[0][0], A[1][0]]) + "$ und $f(e_2) = " + vec([A[0][1], A[1][1]]) + "$: $" + mat(A) + "$." };
    }],
    2: [(lv, G) => {
      const S = unimod(G), A = [[G.int(-2, 3), G.int(-2, 2)], [G.int(-2, 2), G.int(-2, 3)]];
      const B = mulMM(mulMM(inv2(S), A), S).map((r) => r.map((v) => Math.round(v)));
      return { type: "cloze", md: "$f$ hat bezüglich der Standardbasis die Matrix $A = " + mat(A) + "$. Welche Matrix hat $f$ bezüglich der Basis $b_1 = " + vec([S[0][0], S[1][0]]) + "$, $b_2 = " + vec([S[0][1], S[1][1]]) + "$? Zeilenweise:\n\n{{0}} {{1}} {{2}} {{3}}",
        blanks: [blank(B[0][0]), blank(B[0][1]), blank(B[1][0]), blank(B[1][1])], hint: "$B = S^{-1}AS$, wobei $S$ die Basisvektoren als Spalten hat.",
        explain: "$S = " + mat(S) + "$, $S^{-1} = " + mat(inv2(S)) + "$, $B = S^{-1}AS = " + mat(B) + "$. Kontrolle: Spur $" + (A[0][0] + A[1][1]) + "$ und Determinante $" + det2(A) + "$ bleiben gleich." };
    }],
    3: [(lv, G) => {
      const S = unimod(G), A = [[G.int(-3, 4), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 4)]];
      const B = mulMM(mulMM(inv2(S), A), S).map((r) => r.map((v) => Math.round(v)));
      const what = G.pick(["Spur", "Determinante"]);
      return nu("$B = S^{-1}AS$ mit $A = " + mat(A) + "$ und einer invertierbaren Matrix $S$. Bestimme die " + what + " von $B$, ohne $B$ auszurechnen.", what === "Spur" ? A[0][0] + A[1][1] : det2(A),
        "Ähnliche Matrizen beschreiben dieselbe Abbildung in verschiedenen Basen: $\\det(S^{-1}AS) = \\det A$ und $\\operatorname{Spur}(S^{-1}AS) = \\operatorname{Spur}(ASS^{-1}) = \\operatorname{Spur} A$. Zur Kontrolle: $B = " + mat(B) + "$.");
    }],
    4: [
      KL(tf("Zwei $2 \\times 2$-Matrizen mit gleicher Spur und gleicher Determinante sind ähnlich.", false, "$E$ und $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$: beide Spur $2$, Determinante $1$. Aber $S^{-1}ES = E$ für jedes $S$, die Scherung ist also nicht ähnlich zu $E$.")),
      KL(tf("Ist $A$ ähnlich zu $\\lambda E$, so ist $A = \\lambda E$.", true, "$A = S^{-1}(\\lambda E)S = \\lambda S^{-1}S = \\lambda E$. Die Vielfachen der Einheitsmatrix sind allein in ihrer Ähnlichkeitsklasse.")),
      KL((lv, G) => { const m = G.int(2, 5), n = G.int(2, 6); return nu("Wie viele Klassen bilden die $" + m + " \\times " + n + "$-Matrizen unter **Äquivalenz** $A \\sim SAT$ ($S, T$ invertierbar)?", Math.min(m, n) + 1, "Jede Matrix ist äquivalent zu $\\begin{pmatrix}E_r & 0\\\\0 & 0\\end{pmatrix}$ mit $r = \\operatorname{rang} A$, und der Rang ist die einzige Invariante. Möglich: $r = 0, \\dots, " + Math.min(m, n) + "$."); }),
      KL(ch("Welches Paar von Matrizen ist ähnlich?", "$\\begin{pmatrix}1&0\\\\0&2\\end{pmatrix}$ und $\\begin{pmatrix}1&5\\\\0&2\\end{pmatrix}$",
        [["$E$ und $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$", "Nur $E$ selbst ist zu $E$ ähnlich."], ["$\\begin{pmatrix}1&0\\\\0&2\\end{pmatrix}$ und $\\begin{pmatrix}1&0\\\\0&3\\end{pmatrix}$", "Verschiedene Spuren."], ["$\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$ und $0$", "Die Nullmatrix ist nur zu sich selbst ähnlich."]],
        "Die obere Dreiecksmatrix hat die verschiedenen Eigenwerte $1$ und $2$, ist also diagonalisierbar und ähnlich zu $\\operatorname{diag}(1, 2)$.")),
      EX(tf("Jede quadratische Matrix ist zu ihrer Transponierten ähnlich.", true, "$A$ und $A^T$ haben dieselben Ränge von $(A - \\lambda E)^k$ für alle $\\lambda, k$, also dieselbe Jordan-Normalform. Über jedem Körper gilt es sogar über die Elementarteiler.")),
      EX(tf("Für quadratische $A, B$ sind $AB$ und $BA$ stets ähnlich.", false, "$A = \\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$, $B = \\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$: $AB = B \\ne 0$, $BA = 0$. Sie haben aber dasselbe charakteristische Polynom; ähnlich sind sie, wenn $A$ oder $B$ invertierbar ist: $BA = A^{-1}(AB)A$.")),
      EX((lv, G) => { const n = G.int(2, 6); return nu("$T: \\mathbb{R}^{" + n + " \\times " + n + "} \\to \\mathbb{R}^{" + n + " \\times " + n + "}$, $A \\mapsto A^T$. Welche **Spur** hat $T$?", n, "In der Basis $E_{ij}$ ist $T$ eine Permutationsmatrix: $E_{ij} \\mapsto E_{ji}$. Auf der Diagonale stehen Einsen genau für die $" + n + "$ Fixpunkte $E_{ii}$. Anders gesagt: Eigenwert $1$ auf den symmetrischen ($\\dim " + n * (n + 1) / 2 + "$), $-1$ auf den schiefsymmetrischen ($\\dim " + n * (n - 1) / 2 + "$): $" + n * (n + 1) / 2 + " - " + n * (n - 1) / 2 + " = " + n + "$."); }),
      EX(nu("Welche Determinante hat $T: A \\mapsto A^T$ auf $\\mathbb{R}^{3 \\times 3}$?", -1, "$T$ ist diagonalisierbar mit Eigenwert $1$ (Vielfachheit $6$, symmetrische Matrizen) und $-1$ (Vielfachheit $3$, schiefsymmetrische). $\\det T = (-1)^3 = -1$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-quotient (new)
  gen("la-quotient", byLevels("Quotientenräume", {
    1: [(lv, G) => { const n = G.int(3, 9), k = G.int(0, n); return nu("$U \\subseteq V$ mit $\\dim V = " + n + "$ und $\\dim U = " + k + "$. Welche Dimension hat $V/U$?", n - k, "Die Projektion $V \\to V/U$ ist surjektiv mit Kern $U$. Dimensionsformel: $" + n + " - " + k + " = " + (n - k) + "$."); }],
    2: [(lv, G) => {
      let u; do { u = [G.int(-3, 3), G.int(-3, 3)]; } while (!u[0] && !u[1]);
      const v = [G.int(-4, 4), G.int(-4, 4)], same = G.chance(0.5), k = nz(G, -2, 2);
      let w = same ? [v[0] + k * u[0], v[1] + k * u[1]] : [v[0] + G.int(-2, 2), v[1] + G.int(-2, 2)];
      const d = [v[0] - w[0], v[1] - w[1]], eq = d[0] * u[1] - d[1] * u[0] === 0;
      return tf("In $\\mathbb{R}^2/U$ mit $U = \\operatorname{span}\\{" + vec(u) + "\\}$ gilt $" + vec(v) + " + U = " + vec(w) + " + U$.", eq,
        "Zwei Nebenklassen sind gleich genau dann, wenn die Differenz in $U$ liegt: $" + vec(d) + "$ " + (eq ? "ist ein Vielfaches von $" + vec(u) + "$." : "ist kein Vielfaches von $" + vec(u) + "$.") + " Geometrisch: Die Nebenklassen sind die zu $U$ parallelen Geraden.");
    }],
    3: [(lv, G) => {
      const n = G.int(2, 5), k = G.pick(["root", "roots", "sym", "trace"]);
      const q = { root: ["\\mathbb{R}[x]_{\\le " + n + "} / \\{p : p(1) = 0\\}", 1, "Der Kern der Auswertung $p \\mapsto p(1)$ hat Kodimension $1$."], roots: ["\\mathbb{R}[x]_{\\le " + n + "} / \\{p : p(0) = p(1) = 0\\}", 2, "Zwei unabhängige Bedingungen: $p \\mapsto (p(0), p(1))$ ist surjektiv auf $\\mathbb{R}^2$, Homomorphiesatz."], sym: ["\\mathbb{R}^{" + n + " \\times " + n + "} / \\mathrm{Sym}", n * (n - 1) / 2, "$" + n * n + " - " + n * (n + 1) / 2 + "$; die schiefsymmetrischen Matrizen bilden ein Komplement."], trace: ["\\mathbb{R}^{" + n + " \\times " + n + "} / \\{A : \\operatorname{Spur} A = 0\\}", 1, "Die Spur ist surjektiv auf $\\mathbb{R}$, Homomorphiesatz."] }[k];
      return nu("Welche Dimension hat $" + q[0] + "$?", q[1], q[2] + " Ergebnis $" + q[1] + "$.");
    }],
    4: [
      KL(tf("Eine Nebenklasse $v + U$ ist genau dann ein Unterraum, wenn $v \\in U$.", true, "Ein Unterraum enthält $0$. Aus $0 \\in v + U$ folgt $-v \\in U$, also $v \\in U$ und $v + U = U$.")),
      KL(ch("Warum ist die Addition $(v + U) + (w + U) := (v + w) + U$ wohldefiniert?", "Wählt man andere Vertreter $v' = v + u_1$, $w' = w + u_2$, ändert sich $v + w$ nur um $u_1 + u_2 \\in U$",
        [["Weil jede Nebenklasse genau einen Vertreter hat", "Jede Nebenklasse hat sehr viele Vertreter, genau das macht die Prüfung nötig."], ["Weil $U$ abgeschlossen unter Multiplikation ist", "In Vektorräumen multipliziert man Vektoren nicht; gebraucht wird die Abgeschlossenheit unter Addition."], ["Weil $V/U \\subseteq V$ ist", "$V/U$ besteht aus Mengen, nicht aus Vektoren von $V$."]],
        "Wohldefiniert heißt: unabhängig von der Wahl der Vertreter. Dafür braucht man genau, dass $U$ ein Unterraum ist.")),
      KL(pr("Baue den Beweis des Homomorphiesatzes.", "$f: V \\to W$ ist linear.", "$\\bar f: V/\\ker f \\to \\operatorname{im} f$, $v + \\ker f \\mapsto f(v)$, ist ein Isomorphismus.",
        ["Wohldefiniert: Aus $v + \\ker f = v' + \\ker f$ folgt $v - v' \\in \\ker f$, also $f(v) = f(v')$.", "Linear, weil $f$ linear ist und die Operationen in $V/\\ker f$ über Vertreter erklärt sind.", "Injektiv: $\\bar f(v + \\ker f) = 0$ heißt $v \\in \\ker f$, also ist $v + \\ker f$ die Null in $V/\\ker f$.", "Surjektiv auf $\\operatorname{im} f$: Jedes $f(v)$ ist das Bild von $v + \\ker f$."],
        [["Injektiv, weil $f$ injektiv ist.", "Das ist nicht vorausgesetzt; injektiv wird erst $\\bar f$, weil man den Kern herausteilt."], ["Wohldefiniert, weil $\\ker f = \\{0\\}$.", "Der Kern kann groß sein; gebraucht wird nur, dass Differenzen von Vertretern im Kern liegen."]],
        "Für endliche Dimension folgt daraus wieder die Dimensionsformel: $\\dim V - \\dim \\ker f = \\dim \\operatorname{im} f$.")),
      KL(tf("Für jedes Komplement $W$ von $U$ (also $V = U \\oplus W$) ist $W \\to V/U$, $w \\mapsto w + U$, ein Isomorphismus.", true, "Kern: $w + U = U$ heißt $w \\in U \\cap W = \\{0\\}$. Surjektiv: $v = u + w$ liefert $v + U = w + U$.")),
      EX(tf("Ist $U \\subseteq V$ und $V/U$ endlichdimensional, so ist $V$ endlichdimensional.", false, "Für $U = V = \\mathbb{R}[x]$ ist $V/U = \\{0\\}$. Endlich ist $V$ nur, wenn auch $U$ es ist.")),
      EX(nu("Welche Dimension hat $\\mathbb{R}[x] / \\{p : x^2 \\text{ teilt } p\\}$?", 2, "Division mit Rest durch $x^2$: Jede Klasse hat genau einen Vertreter $a + bx$. Basis $1 + U$, $x + U$.")),
      EX(tf("Ist $V/U \\cong V$, so ist $U = \\{0\\}$.", false, "In unendlicher Dimension nicht: $V$ = Folgen, $U$ = Folgen, die nur an der ersten Stelle ungleich null sind. Das Weglassen des ersten Glieds zeigt $V/U \\cong V$. In endlicher Dimension stimmt es.")),
    ],
  }));

  // ---------------------------------------------------------------- la-dual (new)
  gen("la-dual", byLevels("Dualraum", {
    1: [(lv, G) => { const n = G.int(2, 7); return nu("Welche Dimension hat der Dualraum $(\\mathbb{R}^{" + n + "})^*$?", n, "Die duale Basis $e_1^*, \\dots, e_{" + n + "}^*$ (die Koordinatenfunktionen) ist eine Basis: Dimension $" + n + "$."); }],
    2: [(lv, G) => {
      const S = unimod(G), I = inv2(S);
      return { type: "cloze", md: "Bestimme die duale Basis zu $b_1 = " + vec([S[0][0], S[1][0]]) + "$, $b_2 = " + vec([S[0][1], S[1][1]]) + "$.\n\n$b_1^*(x, y) =$ {{0}} $x\\ +$ {{1}} $y \\qquad b_2^*(x, y) =$ {{2}} $x\\ +$ {{3}} $y$",
        blanks: [blank(I[0][0]), blank(I[0][1]), blank(I[1][0]), blank(I[1][1])], hint: "$b_i^*(b_j)$ ist $1$ für $i = j$, sonst $0$. Die Zeilen von $S^{-1}$ erfüllen genau das.",
        explain: "Mit $S$ (Spalten $b_1, b_2$) gilt $S^{-1}S = E$: Die Zeilen von $S^{-1} = " + mat(I) + "$ sind die dualen Funktionale. Probe: $b_1^*(b_1) = 1$, $b_1^*(b_2) = 0$." };
    }],
    3: [(lv, G) => { const n = G.int(3, 8), k = G.int(1, n - 1); return nu("$U \\subseteq \\mathbb{R}^{" + n + "}$ hat Dimension $" + k + "$. Welche Dimension hat der Annullator $U^0 = \\{\\varphi \\in (\\mathbb{R}^{" + n + "})^* : \\varphi|_U = 0\\}$?", n - k, "Ergänze eine Basis von $U$ zu einer von $\\mathbb{R}^{" + n + "}$; die dualen Funktionale zu den $" + (n - k) + "$ neuen Vektoren bilden eine Basis von $U^0$."); }],
    4: [
      KL(tf("Das duale Funktional $b_1^*$ hängt nur von $b_1$ ab, nicht von den übrigen Basisvektoren.", false, "Im $\\mathbb{R}^2$: Zur Basis $e_1, e_2$ ist $e_1^*(x, y) = x$; zur Basis $e_1, e_1 + e_2$ ist $e_1^*(x, y) = x - y$. Gleicher erster Vektor, anderes Funktional, weil $b_1^*$ auf allen anderen Basisvektoren null sein muss.")),
      KL(tf("Jedes lineare Funktional auf $\\mathbb{R}^n$ hat die Form $x \\mapsto \\langle a, x \\rangle$ für genau ein $a \\in \\mathbb{R}^n$.", true, "$a_i = \\varphi(e_i)$; Eindeutigkeit, weil $\\langle a, e_i \\rangle = a_i$. Das ist der Rieszsche Darstellungssatz in endlicher Dimension.")),
      KL(tf("Zwei lineare Funktionale $\\varphi, \\psi \\ne 0$ mit gleichem Kern sind Vielfache voneinander.", true, "Der gemeinsame Kern $H$ hat Kodimension $1$. Wähle $v \\notin H$; dann stimmen $\\varphi$ und $\\tfrac{\\varphi(v)}{\\psi(v)}\\psi$ auf $H$ und auf $v$ überein, also überall.")),
      KL(ch("$f: V \\to W$ hat bezüglich Basen die Matrix $A$. Welche Matrix hat $f^*: W^* \\to V^*$, $\\varphi \\mapsto \\varphi \\circ f$, bezüglich der dualen Basen?", "$A^T$",
        [["$A^{-1}$", "$f$ muss nicht invertierbar sein, und $f^*$ geht in die Gegenrichtung, ohne umzukehren."], ["$A$", "Die Dimensionen von Start und Ziel tauschen, $A^*$ hat das Format $n \\times m$."], ["$-A$", "Ein Vorzeichen entsteht nicht."]],
        "$(f^*w_i^*)(v_j) = w_i^*(f v_j) = a_{ij}$: Spalte $i$ von $f^*$ ist Zeile $i$ von $A$. Daher kommt die Transponierte, und daraus folgt Zeilenrang $=$ Spaltenrang.")),
      EX(tf("$\\mathbb{R}[x]$ ist zu seinem Dualraum isomorph.", false, "$\\mathbb{R}[x]$ hat eine abzählbare Basis. Sein Dualraum ist $\\cong$ dem Raum aller Folgen $(\\varphi(x^k))_k$, und der hat überabzählbare Dimension. In unendlicher Dimension ist $V^*$ echt größer.")),
      EX(tf("Für endlichdimensionales $V$ ist $V \\to V^{**}$, $v \\mapsto (\\varphi \\mapsto \\varphi(v))$, ein Isomorphismus, ohne dass man eine Basis wählen muss.", true, "Die Abbildung ist linear und injektiv (zu $v \\ne 0$ gibt es $\\varphi$ mit $\\varphi(v) \\ne 0$), und $\\dim V^{**} = \\dim V$. Der Isomorphismus $V \\to V^*$ dagegen hängt von der Basis ab.")),
      EX(nu("Welche Dimension hat $\\{\\varphi \\in (\\mathbb{R}[x]_{\\le 3})^* : \\varphi(1) = \\varphi(x) = 0\\}$?", 2, "Das ist der Annullator von $\\operatorname{span}\\{1, x\\}$: $4 - 2 = 2$. Basis: die dualen Funktionale zu $x^2$ und $x^3$.")),
    ],
  }));

  // ---------------------------------------------------------------- la-matrix, la-fehler, la-kern, la-koordinaten: deeper
  demote("la-matrix");
  expert("la-matrix", [
    KL(tf("Für quadratische Matrizen gilt $(A + B)^2 = A^2 + 2AB + B^2$.", false, "$(A + B)^2 = A^2 + AB + BA + B^2$. Gleich nur, wenn $AB = BA$.")),
    KL(tf("Aus $AB = 0$ folgt $A = 0$ oder $B = 0$.", false, "$\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}^2 = 0$. Matrizenringe haben Nullteiler.")),
    KL(tf("Für quadratische Matrizen folgt aus $AB = E$ auch $BA = E$.", true, "$AB = E$ macht $B$ injektiv ($Bx = 0 \\Rightarrow x = ABx = 0$), in endlicher Dimension also bijektiv. Dann $A = AB B^{-1} = B^{-1}$ und $BA = E$.")),
    KL(ch("$N = \\begin{pmatrix}0&1&2\\\\0&0&3\\\\0&0&0\\end{pmatrix}$. Was ist $(E - N)^{-1}$?", "$E + N + N^2$",
      [["$E + N$", "$N^2 \\ne 0$, erst $N^3 = 0$."], ["$E - N$", "$(E - N)^2 \\ne E$."], ["Es gibt keine Inverse", "$\\det(E - N) = 1$."]],
      "Geometrische Reihe: $(E - N)(E + N + N^2) = E - N^3 = E$, weil $N$ nilpotent ist.")),
    KL(nu("$A = \\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$. Welcher Eintrag steht oben rechts in $A^{25}$?", 25, "$A = E + N$ mit $N^2 = 0$ und $NE = EN$: $A^{25} = E + 25N$ (binomische Formel, alle höheren Potenzen von $N$ fallen weg).")),
    EX(tf("Es gibt reelle $n \\times n$-Matrizen mit $AB - BA = E$.", false, "$\\operatorname{Spur}(AB - BA) = \\operatorname{Spur}(AB) - \\operatorname{Spur}(BA) = 0$, aber $\\operatorname{Spur}E = n$. In Charakteristik $p$ geht es für $n = p$ sehr wohl.")),
    EX(tf("Es gibt eine reelle $3 \\times 3$-Matrix mit $A^2 = -E$.", false, "$\\det(A)^2 = \\det(A^2) = \\det(-E) = (-1)^3 = -1 < 0$. Im $\\mathbb{R}^{2 \\times 2}$ geht es: die Drehung um $90°$.")),
    EX(nu("Wie viele $2 \\times 2$-Matrizen $A$ über $\\mathbb{F}_2$ erfüllen $A^2 = A$?", 8, "Idempotent heißt Projektion: $0$, $E$, und die Projektionen vom Rang $1$. Eine solche ist durch Bild (eine der $3$ Geraden) und Kern (eine der $2$ anderen) festgelegt: $6$. Zusammen $1 + 1 + 6 = 8$.")),
    EX(tf("Vertauscht $A$ mit jeder $n \\times n$-Matrix, so ist $A = \\lambda E$.", true, "Mit $AE_{ij} = E_{ij}A$ für alle Matrixeinheiten folgt: Außerhalb der Diagonale ist $A$ null, und alle Diagonaleinträge sind gleich.")),
  ]);
  expert("la-fehler", LW.forms.statements([
    { ok: false, md: "$(AB)^{-1} = A^{-1}B^{-1}$", why: "Richtig ist $B^{-1}A^{-1}$." },
    { ok: false, md: "$\\det(A + B) = \\det A + \\det B$", why: "Die Determinante ist nicht additiv: $\\det(E + E) = 2^n$." },
    { ok: false, md: "$(A + B)^2 = A^2 + 2AB + B^2$", why: "Es fehlt die Vertauschbarkeit: $AB + BA$ statt $2AB$." },
    { ok: false, md: "Aus $A^2 = A$ folgt $A = 0$ oder $A = E$.", why: "Jede Projektion, etwa $\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$, ist idempotent." },
    { ok: false, md: "Aus $AB = AC$ folgt $B = C$.", why: "Nur wenn $A$ invertierbar ist; $A = 0$ ist ein Gegenbeispiel." },
    { ok: true, md: "$(AB)^T = B^TA^T$", why: "Eintrag $(i, j)$: $\\sum_k a_{jk}b_{ki} = \\sum_k (B^T)_{ik}(A^T)_{kj}$." },
    { ok: true, md: "$\\operatorname{Spur}(AB) = \\operatorname{Spur}(BA)$", why: "Beide sind $\\sum_{i,k} a_{ik}b_{ki}$." },
    { ok: true, md: "$\\det(AB) = \\det A \\det B$", why: "Multiplikationssatz." },
    { ok: true, md: "$\\det(\\lambda A) = \\lambda^n \\det A$ für $n \\times n$-Matrizen", why: "Jede der $n$ Zeilen bekommt den Faktor $\\lambda$." },
    { ok: true, md: "Ist $A$ invertierbar, so auch $A^T$, mit $(A^T)^{-1} = (A^{-1})^T$.", why: "$A^T(A^{-1})^T = (A^{-1}A)^T = E$." },
  ], { 4: ["spot", "multi"] }, { spot: "Genau eine Rechenregel ist falsch. Welche?", multi: "Welche Rechenregeln gelten für alle $n \\times n$-Matrizen?" })[4].map((t, i) => (i ? EX(t) : KL(t))));

  demote("la-kern");
  expert("la-kern", [
    KL(tf("Es gibt eine lineare Abbildung $f: \\mathbb{R}^3 \\to \\mathbb{R}^3$ mit $\\ker f = \\operatorname{im} f$.", false, "Dann wäre $3 = \\dim\\ker f + \\dim\\operatorname{im} f = 2 \\dim\\ker f$ gerade.")),
    KL(tf("Es gibt eine lineare Abbildung $f: \\mathbb{R}^4 \\to \\mathbb{R}^4$ mit $\\ker f = \\operatorname{im} f$.", true, "$f(e_1) = f(e_2) = 0$, $f(e_3) = e_1$, $f(e_4) = e_2$: Kern und Bild sind beide $\\operatorname{span}\\{e_1, e_2\\}$.")),
    KL(tf("$f \\circ f = 0$ gilt genau dann, wenn $\\operatorname{im} f \\subseteq \\ker f$.", true, "$f(f(v)) = 0$ für alle $v$ heißt: Jedes Bild liegt im Kern.")),
    KL(tf("Für lineare $f: U \\to V$ und $g: V \\to W$ gilt $\\ker(g \\circ f) = \\ker f$.", false, "Nur $\\ker f \\subseteq \\ker(g \\circ f)$. Mit $g = 0$ ist $\\ker(g \\circ f) = U$.")),
    KL(nu("$f: \\mathbb{R}^5 \\to \\mathbb{R}^3$ ist linear und surjektiv. Welche Dimension hat $\\ker f$?", 2, "Surjektiv heißt $\\dim\\operatorname{im} f = 3$, also $\\dim\\ker f = 5 - 3 = 2$.")),
    EX(tf("Für jede lineare Abbildung $f: V \\to V$ mit $\\dim V < \\infty$ gilt $V = \\ker f \\oplus \\operatorname{im} f$.", false, "$f = \\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$: Kern und Bild sind beide die $x$-Achse. Für Projektionen ($f^2 = f$) stimmt es.")),
    EX(tf("Ist $f: V \\to V$ linear mit $\\dim V < \\infty$, so werden die Kerne $\\ker f \\subseteq \\ker f^2 \\subseteq \\dots$ ab einer Stelle konstant, und von da an gilt $V = \\ker f^k \\oplus \\operatorname{im} f^k$.", true, "Fitting-Zerlegung: Die Kerne wachsen und die Bilder schrumpfen; sobald beide stehen bleiben, ist $\\ker f^k \\cap \\operatorname{im} f^k = \\{0\\}$, und die Dimensionen ergänzen sich.")),
    EX(nu("$f: \\mathbb{R}^7 \\to \\mathbb{R}^7$ hat $\\dim\\ker f = 2$. Wie groß kann $\\dim\\ker f^2$ höchstens sein?", 4, "$\\ker f^2 / \\ker f$ wird von $f$ injektiv in $\\ker f$ abgebildet, also $\\dim\\ker f^2 \\le 2 \\dim\\ker f = 4$.")),
  ]);

  if (LW.generators["la-koordinaten"]) {
    demote("la-koordinaten");
    expert("la-koordinaten", [
      KL({ type: "cloze", md: "Bestimme die Koordinaten von $p = x^2 + 2x + 3$ bezüglich der Basis $1,\\ (x - 1),\\ (x - 1)^2$.\n\n{{0}} $\\cdot 1\\ +$ {{1}} $\\cdot (x - 1)\\ +$ {{2}} $\\cdot (x - 1)^2$",
        blanks: [blank(6), blank(4), blank(1)], hint: "Taylor-Entwicklung um $1$: Die Koeffizienten sind $p(1)$, $p'(1)$, $\\tfrac{p''(1)}{2}$.", explain: "$p(1) = 6$, $p'(1) = 2 + 2 = 4$, $\\tfrac{p''(1)}{2} = 1$. Probe: $6 + 4(x - 1) + (x - 1)^2 = x^2 + 2x + 3$." }),
      KL(ch("$T$ hat die neuen Basisvektoren (in alten Koordinaten) als Spalten. Welche Matrix rechnet **alte** Koordinaten eines Vektors in **neue** um?", "$T^{-1}$",
        [["$T$", "$T$ macht aus neuen Koordinaten alte: $T e_i$ ist der $i$-te neue Basisvektor."], ["$T^T$", "Nur bei Orthonormalbasen ist $T^T = T^{-1}$."], ["$E$", "Die Koordinaten ändern sich mit der Basis."]],
        "$v = T \\cdot (\\text{neue Koordinaten})$, also neue Koordinaten $= T^{-1}v$.")),
      KL(tf("Die Koordinaten eines Vektors bezüglich $(b_1, b_2)$ und bezüglich $(b_2, b_1)$ sind gleich.", false, "Sie sind vertauscht. Eine Basis ist eine geordnete Liste.")),
      EX(tf("Es gibt eine Basis des $\\mathbb{R}^2$, bezüglich der die Drehung um $90°$ eine Diagonalmatrix hat.", false, "Dann wären die Basisvektoren Eigenvektoren, aber eine Vierteldrehung lässt keine Richtung fest: $\\lambda^2 + 1 = 0$ hat keine reelle Lösung.")),
      EX(nu("Welche Koordinate hat $x^3$ bezüglich der Basis $\\binom x0, \\binom x1, \\binom x2, \\binom x3$ von $\\mathbb{R}[x]_{\\le 3}$ beim letzten Basisvektor $\\binom x3 = \\tfrac{x(x-1)(x-2)}{6}$?", 6, "$x^3 = \\binom x1 + 6\\binom x2 + 6\\binom x3$ (Stirling-Zahlen zweiter Art mal Fakultät). Vergleich der Leitkoeffizienten: $x^3$ hat $1$, $\\binom x3$ hat $\\tfrac16$, also Koordinate $6$.")),
    ]);
  }
})();
