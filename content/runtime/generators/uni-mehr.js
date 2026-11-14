/* More tasks for the university courses. Every level of the Lineare Algebra I and Analysis I generators should offer
 * at least a dozen different tasks: level 4 (Experte) gains further exam tasks (label "Klausur") and tasks beyond exam
 * level (label "Extrem"), many of them templates with their own random values; the lower levels of the new generators
 * gain templates. Loaded after uni-la1.js to uni-ana.js; the helpers come from LW.uni. */
(function () {
  "use strict";
  const LW = window.LW;
  const U = LW.uni;
  if (!U) return;
  const { range, nz, pm, par, blank, tf, ch, nu, sp, KL, EX, mat, vec, det3, poly } = U;
  const has = (name) => !!LW.generators[name];
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const binomC = (n, k) => { if (k < 0 || k > n) return 0; let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
  const dec = (md, x, d, explain, o) => nu(md, x, explain, Object.assign({ tolerance: 0.6 * Math.pow(10, -d), placeholder: "Dezimalzahl" }, o || {}));
  const cloze = (md, values, explain, tol) => ({ type: "cloze", md, blanks: values.map((v) => blank(v, tol)), explain });
  /** a·x in TeX: "x", "-x", "3x". */
  const cx = (a, v) => (a === 1 ? "" : a === -1 ? "-" : String(a)) + (v || "x");
  /** Linear form a1 x1 + a2 x2 + ... in TeX, zero coefficients left out. */
  const lin = (a, v) => {
    let s = "";
    a.forEach((c, i) => {
      if (!c) return;
      const t = (Math.abs(c) === 1 ? "" : Math.abs(c)) + (v || "x") + "_" + (i + 1);
      s += s ? (c < 0 ? " - " : " + ") + t : (c < 0 ? "-" : "") + t;
    });
    return s || "0";
  };
  /** Complex number re + im·i in TeX. */
  const cplx = (re, im) => (im === 0 ? String(re)
    : (re === 0 ? "" : re + (im < 0 ? " - " : " + ")) + (re === 0 && im < 0 ? "-" : "") + (Math.abs(im) === 1 ? "" : Math.abs(im)) + "i");
  /** Random invertible integer 3×3 matrix with a small determinant. */
  function randInv3(G, lo, hi) {
    for (let t = 0; t < 60; t++) {
      const A = range(1, 3).map(() => range(1, 3).map(() => G.int(lo, hi)));
      const d = det3(A);
      if (d !== 0 && Math.abs(d) <= 12) return [A, d];
    }
    return [[[2, 1, 0], [1, 2, 1], [0, 1, 2]], 4];
  }
  const even = (x) => (typeof x === "function" ? x : () => JSON.parse(JSON.stringify(x)));
  /** Further level-4 tasks; fixed ones weigh like templates, as in expert(). */
  const more = (name, items) => { if (has(name)) LW.extend(name, { 4: items.map(even) }); };
  /** Further templates for a lower level. */
  const add = (name, level, items) => { if (has(name)) LW.extend(name, { [level]: items }); };

  // ================================================================ Lineare Algebra I
  more("la-basis", [
    KL(ch("Für welche reellen $t$ sind $(1, 1, t)$, $(1, t, 1)$ und $(t, 1, 1)$ linear abhängig?", "$t = 1$ oder $t = -2$",
      [["nur $t = 1$", "Bei $t = -2$ ist die Summe der drei Vektoren null, auch das ist eine Abhängigkeit."],
        ["nur $t = -2$", "Bei $t = 1$ sind alle drei Vektoren gleich."],
        ["für kein $t$", "Die Determinante $-(t - 1)^2(t + 2)$ hat Nullstellen."]],
      "Die Determinante der drei Vektoren ist $-(t - 1)^2(t + 2)$. Bei $t = 1$ sind die Vektoren gleich, bei $t = -2$ addieren sie sich zu null.")),
    KL((lv, G) => {
      const n = G.int(2, 6), nn = "$" + n + " \\times " + n + "$";
      const q = G.pick([
        ["der symmetrischen " + nn + "-Matrizen", n * (n + 1) / 2, "Frei wählbar sind die Einträge auf und über der Diagonale: $" + n + " + " + n * (n - 1) / 2 + "$."],
        ["der schiefsymmetrischen " + nn + "-Matrizen ($A^T = -A$)", n * (n - 1) / 2, "Die Diagonale ist null, frei sind die Einträge über der Diagonale: $\\tfrac{" + n + " \\cdot " + (n - 1) + "}{2}$."],
        ["der " + nn + "-Matrizen mit Spur $0$", n * n - 1, "Die Spur ist ein lineares Funktional $\\ne 0$, ihr Kern hat Dimension $" + n * n + " - 1$."],
        ["der oberen " + nn + "-Dreiecksmatrizen", n * (n + 1) / 2, "Frei sind die Einträge auf und über der Diagonale: $" + n + " + " + n * (n - 1) / 2 + "$."]]);
      return nu("Welche Dimension hat der reelle Vektorraum " + q[0] + "?", q[1], q[2]);
    }),
    EX(nu("Wie viele **zweidimensionale** Unterräume hat $\\mathbb{F}_2^4$?", 35, "Geordnete Paare linear unabhängiger Vektoren: $(16 - 1)(16 - 2) = 210$. Jeder zweidimensionale Unterraum hat $(4 - 1)(4 - 2) = 6$ geordnete Basen. Also $\\tfrac{210}{6} = 35$.")),
    EX((lv, G) => {
      const q = G.pick([2, 3, 5]), n = G.pick([2, 3]);
      const cnt = (Math.pow(q, n) - 1) / (q - 1);
      return nu("Wie viele **eindimensionale** Unterräume hat $\\mathbb{F}_{" + q + "}^{" + n + "}$?", cnt, "Jeder Vektor $\\ne 0$ spannt einen auf, und jeder eindimensionale Unterraum enthält $" + (q - 1) + "$ Vektoren $\\ne 0$: $\\tfrac{" + q + "^{" + n + "} - 1}{" + (q - 1) + "} = " + cnt + "$.");
    }),
  ]);

  more("la-matrix", [
    KL((lv, G) => {
      const a = G.pick([2, 3, -1, -2]), b = G.int(1, 3), n = G.int(3, 5);
      const v = n * Math.pow(a, n - 1) * b;
      return nu("$A = " + mat([[a, b], [0, a]]) + "$. Welcher Eintrag steht oben rechts in $A^{" + n + "}$?", v,
        "$A = " + par(a) + "E + N$ mit $N = " + mat([[0, b], [0, 0]]) + "$, $N^2 = 0$, und $E$ vertauscht mit $N$. Binomisch: $A^{" + n + "} = " + par(a) + "^{" + n + "}E + " + n + " \\cdot " + par(a) + "^{" + (n - 1) + "}N$, oben rechts also $" + n + " \\cdot " + par(a) + "^{" + (n - 1) + "} \\cdot " + b + " = " + v + "$.");
    }),
    KL(tf("Für invertierbare $A, B$ gilt $(AB)^{-1} = A^{-1}B^{-1}$.", false, "$(AB)(B^{-1}A^{-1}) = E$: Die Reihenfolge kehrt sich um. $A^{-1}B^{-1}$ ist nur dann die Inverse, wenn $A$ und $B$ vertauschen.")),
    KL(tf("Für $A \\in \\mathbb{R}^{m \\times n}$ und $B \\in \\mathbb{R}^{n \\times m}$ gilt $\\operatorname{Spur}(AB) = \\operatorname{Spur}(BA)$, auch für $m \\ne n$.", true, "Beide Seiten sind $\\sum_{i,j} a_{ij}b_{ji}$. Deshalb haben ähnliche Matrizen dieselbe Spur: $\\operatorname{Spur}(T^{-1}(AT)) = \\operatorname{Spur}((AT)T^{-1})$.")),
    EX(tf("Es gibt eine reelle $2 \\times 2$-Matrix $A$ mit $A^2 = " + mat([[-1, 0], [0, -2]]) + "$.", false, "Die Eigenwerte von $A^2$ sind die Quadrate der Eigenwerte von $A$. Sind diese reell, sind die Quadrate $\\ge 0$; sind sie ein konjugiertes Paar $\\lambda, \\bar\\lambda$, so sind auch $\\lambda^2$ und $\\bar\\lambda^2$ konjugiert, also nicht $-1$ und $-2$. Mit $-1$ und $-1$ ginge es: die Drehung um $90°$.")),
    EX((lv, G) => {
      const q = G.pick([2, 3, 5, 7]);
      return nu("Wie viele nilpotente $2 \\times 2$-Matrizen gibt es über $\\mathbb{F}_{" + q + "}$ (die Nullmatrix mitgezählt)?", q * q, "Nilpotent heißt hier: Spur $0$ und Determinante $0$, also $d = -a$ und $bc = -a^2$. Für $a = 0$ gibt es $2 \\cdot " + q + " - 1 = " + (2 * q - 1) + "$ Paare $(b, c)$ mit $bc = 0$, für jedes der $" + (q - 1) + "$ Elemente $a \\ne 0$ noch $" + (q - 1) + "$ Paare. Zusammen $" + (2 * q - 1) + " + " + (q - 1) * (q - 1) + " = " + q * q + "$. Allgemein gibt es $q^{n(n-1)}$ nilpotente $n \\times n$-Matrizen über $\\mathbb{F}_q$.");
    }),
  ]);

  more("la-kern", [
    KL((lv, G) => {
      const n = G.int(4, 8), r = G.int(1, n - 1), v = Math.min(r, n - r);
      return nu("$A \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ hat Rang $" + r + "$. Wie groß kann $\\dim(\\ker A \\cap \\operatorname{im} A)$ höchstens sein?", v,
        "$\\ker A$ hat Dimension $" + (n - r) + "$, $\\operatorname{im} A$ Dimension $" + r + "$; der Schnitt ist höchstens so groß wie der kleinere Raum: $" + v + "$. Erreicht wird das mit einer Matrix, die die Basisvektoren verschiebt: $e_i \\mapsto e_{i - " + (n - r) + "}$ für $i > " + (n - r) + "$, die übrigen auf $0$.");
    }),
    KL(tf("Für lineares $f: V \\to V$ mit $\\dim V < \\infty$ gilt: $f$ injektiv $\\iff$ $f$ surjektiv.", true, "Dimensionsformel: $\\dim\\ker f + \\dim\\operatorname{im} f = \\dim V$. Kern null heißt Bild ganz $V$. In unendlicher Dimension ist das falsch.")),
    EX(tf("Es gibt eine lineare Abbildung $f: \\mathbb{R}[x] \\to \\mathbb{R}[x]$, die injektiv, aber nicht surjektiv ist.", true, "$p \\mapsto xp$: Aus $xp = 0$ folgt $p = 0$, aber die Konstante $1$ liegt nicht im Bild. In unendlicher Dimension trennen sich injektiv und surjektiv.")),
    EX((lv, G) => {
      const k = G.pick([3, 4]), n = G.int(k + 2, 10), b = Math.ceil(n / k), v = n - b;
      return nu("$f: \\mathbb{R}^{" + n + "} \\to \\mathbb{R}^{" + n + "}$ ist linear mit $f^{" + k + "} = 0$. Welchen Rang kann $f$ höchstens haben?", v,
        "Jordanform: nur Blöcke zum Eigenwert $0$ der Größe höchstens $" + k + "$, also mindestens $\\lceil " + n + "/" + k + " \\rceil = " + b + "$ Blöcke. Jeder Block senkt den Rang um $1$: $\\operatorname{rang} f \\le " + n + " - " + b + " = " + v + "$, erreicht mit möglichst großen Blöcken.");
    }),
  ]);

  more("la-loesungsmenge", [
    KL((lv, G) => {
      const m = G.int(2, 4), n = G.int(m + 1, 7);
      return tf("Ein lineares Gleichungssystem mit $" + m + "$ Gleichungen und $" + n + "$ Unbekannten kann genau eine Lösung haben.", false,
        "Ist es lösbar, so ist die Lösungsmenge $x_0 + \\ker A$ mit $\\dim\\ker A = " + n + " - \\operatorname{rang} A \\ge " + n + " - " + m + " = " + (n - m) + "$. Also keine oder unendlich viele Lösungen.");
    }),
    EX(tf("Hat $Ax = b$ für **jedes** $b \\in \\mathbb{R}^m$ eine Lösung ($A \\in \\mathbb{R}^{m \\times n}$), so hat $A^Ty = c$ für jedes $c$ höchstens eine Lösung.", true, "Lösbar für alle $b$ heißt $\\operatorname{rang} A = m$. Dann hat auch $A^T$ den Rang $m$ bei $m$ Spalten, ist also injektiv.")),
  ]);

  more("la-koordinaten", [
    KL((lv, G) => {
      const k = nz(G, -2, 2), m = nz(G, -2, 2), p = G.int(-4, 4), q = G.int(-4, 4);
      const b1 = [1, k], b2 = [m, 1 + k * m], x = (1 + k * m) * p - m * q, y = -k * p + q;
      return cloze("Bestimme die Koordinaten von $v = " + vec([p, q]) + "$ bezüglich der Basis $b_1 = " + vec(b1) + "$, $b_2 = " + vec(b2) + "$.\n\n$v =$ {{0}} $\\cdot b_1 +$ {{1}} $\\cdot b_2$",
        [x, y], "Die Basismatrix $T = " + mat([[1, m], [k, 1 + k * m]]) + "$ hat Determinante $1$, also $T^{-1} = " + mat([[1 + k * m, -m], [-k, 1]]) + "$ und $T^{-1}v = " + vec([x, y]) + "$. Probe: $" + x + " \\cdot " + vec(b1) + " + " + par(y) + " \\cdot " + vec(b2) + " = " + vec([p, q]) + "$.");
    }),
    KL((lv, G) => {
      const a = G.pick([-2, -1, 2, 3]), u = G.int(-4, 4), w = G.int(-5, 5);
      const c0 = a * a + u * a + w, c1 = 2 * a + u, s = "(x " + pm(-a) + ")";
      return cloze("Bestimme die Koordinaten von $p = " + poly([w, u, 1]) + "$ bezüglich der Basis $1,\\ " + s + ",\\ " + s + "^2$ von $\\mathbb{R}[x]_{\\le 2}$.\n\n$p =$ {{0}} $+$ {{1}} $\\cdot " + s + " +$ {{2}} $\\cdot " + s + "^2$",
        [c0, c1, 1], "Taylor um $" + a + "$: $p(" + a + ") = " + c0 + "$, $p'(" + a + ") = " + c1 + "$, $\\tfrac{p''}{2} = 1$. Die Koordinaten bezüglich der Potenzen von $" + s + "$ sind die Taylorkoeffizienten.");
    }),
    KL((lv, G) => {
      const A = [[G.int(-3, 4), G.int(-3, 3)], [G.int(-3, 3), G.int(-3, 4)]], t = A[0][0] + A[1][1];
      const B = G.pick([[[1, 2], [3, 7]], [[2, 1], [5, 3]], [[1, 1], [1, 2]], [[3, 1], [2, 1]]]);
      return nu("$f: \\mathbb{R}^2 \\to \\mathbb{R}^2$ hat bezüglich der Standardbasis die Matrix $" + mat(A) + "$. Welche Spur hat die Matrix von $f$ bezüglich der Basis $" + vec([B[0][0], B[1][0]]) + ", " + vec([B[0][1], B[1][1]]) + "$?", t,
        "Die neue Matrix ist $T^{-1}AT$, und die Spur ändert sich dabei nicht: $\\operatorname{Spur}(T^{-1}AT) = \\operatorname{Spur}(ATT^{-1}) = " + t + "$. Rechnen ist unnötig.");
    }),
    KL(tf("Hat $\\mathrm{id}_V$ bezüglich der Basen $B$ (im Urbild) und $B'$ (im Bild) die Matrix $T$, so hat sie bezüglich $B'$ und $B$ die Matrix $T^{-1}$.", true, "Beide Matrizen hintereinander beschreiben $\\mathrm{id} \\circ \\mathrm{id} = \\mathrm{id}$ bezüglich derselben Basis, ihr Produkt ist also $E$.")),
    EX(ch("Bezüglich welcher Basis von $\\mathbb{R}[x]_{\\le 3}$ hat die Ableitung $D$ eine Matrix mit lauter Einsen direkt über der Diagonale und sonst Nullen?", "$1,\\ x,\\ \\tfrac{x^2}{2},\\ \\tfrac{x^3}{6}$",
      [["$1,\\ x,\\ x^2,\\ x^3$", "$D(x^3) = 3x^2$: Über der Diagonale stehen $1, 2, 3$."],
        ["$x^3,\\ x^2,\\ x,\\ 1$", "In umgekehrter Reihenfolge stehen die Einträge unter der Diagonale, und es bleiben die Faktoren $3, 2, 1$."],
        ["$1,\\ x,\\ 2x^2,\\ 6x^3$", "$D(6x^3) = 18x^2 = 9 \\cdot 2x^2$: Faktor $9$ statt $1$."]],
      "$D\\bigl(\\tfrac{x^k}{k!}\\bigr) = \\tfrac{x^{k-1}}{(k-1)!}$: Jeder Basisvektor geht auf den vorigen. Das ist die Jordanform eines nilpotenten Endomorphismus.")),
    EX(tf("Es gibt eine Basis des $\\mathbb{R}^3$, bezüglich der $" + mat([[1, 1, 0], [0, 1, 0], [0, 0, 1]]) + "$ Diagonalgestalt hat.", false, "Einziger Eigenwert ist $1$, der Eigenraum $\\ker(A - E)$ hat aber nur Dimension $2$. Für eine Diagonalform bräuchte man drei linear unabhängige Eigenvektoren.")),
  ]);

  more("la-abbildung", [
    KL((lv, G) => {
      const n = G.int(3, 6), k = G.int(1, n - 1), v = n * n - k * (n - k);
      return nu("$U \\subseteq \\mathbb{R}^{" + n + "}$ ist ein Unterraum der Dimension $" + k + "$. Welche Dimension hat $\\{f \\in \\operatorname{End}(\\mathbb{R}^{" + n + "}) : f(U) \\subseteq U\\}$?", v,
        "Eine Basis von $U$ zu einer Basis des $\\mathbb{R}^{" + n + "}$ ergänzen. Dann heißt $f(U) \\subseteq U$: Der Block unten links ($" + (n - k) + " \\times " + k + "$) ist null. Frei bleiben $" + n * n + " - " + k * (n - k) + " = " + v + "$ Einträge.");
    }),
    KL((lv, G) => {
      const a = G.int(-3, 3), b = G.int(-3, 3), r1 = G.int(-2, 2), r2 = G.int(-2, 2), c = a + 2 * r1, d = b + 2 * r2;
      return cloze("$f: \\mathbb{R}^2 \\to \\mathbb{R}^2$ ist linear mit $f" + vec([1, 1]) + " = " + vec([a, b]) + "$ und $f" + vec([1, -1]) + " = " + vec([c, d]) + "$. Bestimme $f" + vec([1, 0]) + "$.\n\nErste Komponente: {{0}} $\\qquad$ zweite Komponente: {{1}}",
        [a + r1, b + r2], "$" + vec([1, 0]) + " = \\tfrac12\\Bigl(" + vec([1, 1]) + " + " + vec([1, -1]) + "\\Bigr)$, also wegen der Linearität $f" + vec([1, 0]) + " = \\tfrac12\\Bigl(" + vec([a, b]) + " + " + vec([c, d]) + "\\Bigr) = " + vec([a + r1, b + r2]) + "$.");
    }),
    EX(tf("Sind $f, g: V \\to V$ linear mit $f \\circ g = \\mathrm{id}$, so gilt auch $g \\circ f = \\mathrm{id}$, selbst wenn $V$ unendlichdimensional ist.", false, "Auf dem Raum der Folgen: $g$ schiebt nach rechts, $(a_1, a_2, \\dots) \\mapsto (0, a_1, a_2, \\dots)$, $f$ nach links und vergisst das erste Glied. Dann ist $f \\circ g = \\mathrm{id}$, aber $g \\circ f$ macht das erste Glied zu $0$. In endlicher Dimension stimmt die Aussage.")),
  ]);

  more("la-rang", [
    KL((lv, G) => {
      const n = G.int(4, 6);
      const q = G.pick([
        ["i + j", 2, "$a_{ij} = i \\cdot 1 + 1 \\cdot j$ ist Summe zweier Matrizen vom Rang $1$ mit linear unabhängigen Vektoren $(i)$ und $(1)$."],
        ["i - j", 2, "$a_{ij} = i \\cdot 1 - 1 \\cdot j$: Summe zweier Rang-1-Matrizen mit linear unabhängigen Vektoren $(i)$ und $(1)$."],
        ["(i + j)^2", 3, "$(i + j)^2 = i^2 \\cdot 1 + 2 \\cdot i \\cdot j + 1 \\cdot j^2$: drei Rang-1-Summanden, und $(i^2)$, $(i)$, $(1)$ sind für $n \\ge 3$ linear unabhängig."],
        ["i \\cdot j + 1", 2, "Summe der Rang-1-Matrizen $(ij)$ und $(1)$ mit linear unabhängigen Vektoren $(i)$ und $(1)$."],
        ["\\min(i, j)", n, "Zieht man von jeder Zeile die vorige ab, entsteht eine obere Dreiecksmatrix mit Einsen auf der Diagonale: voller Rang."]]);
      return nu("Welchen Rang hat die $" + n + " \\times " + n + "$-Matrix mit $a_{ij} = " + q[0] + "$?", q[1], q[2]);
    }),
    EX(tf("Für $A \\in \\mathbb{R}^{m \\times n}$ und $B \\in \\mathbb{R}^{n \\times k}$ gilt $\\operatorname{rang}(AB) \\ge \\operatorname{rang} A + \\operatorname{rang} B - n$.", true, "Ungleichung von Sylvester: $\\operatorname{rang}(AB) = \\operatorname{rang} B - \\dim(\\ker A \\cap \\operatorname{im} B)$, und $\\dim(\\ker A \\cap \\operatorname{im} B) \\le \\dim\\ker A = n - \\operatorname{rang} A$.")),
  ]);

  more("la-quotient", [
    KL((lv, G) => {
      const n = G.int(2, 6);
      const q = G.pick([["symmetrischen Matrizen", n * (n - 1) / 2], ["Matrizen mit Spur $0$", 1], ["oberen Dreiecksmatrizen", n * (n - 1) / 2], ["Diagonalmatrizen", n * n - n]]);
      return nu("Welche Dimension hat $\\mathbb{R}^{" + n + " \\times " + n + "} / U$ für den Unterraum $U$ der " + q[0] + "?", q[1], "$\\dim(V/U) = \\dim V - \\dim U = " + n * n + " - " + (n * n - q[1]) + " = " + q[1] + "$.");
    }),
    KL((lv, G) => {
      const n = G.int(3, 6), k = G.int(1, 3), pts = G.pickN([-2, -1, 0, 1, 2, 3], k).sort((a, b) => a - b);
      return nu("Welche Dimension hat $\\mathbb{R}[x]_{\\le " + n + "} / U$ mit $U = \\{p : " + pts.map((t) => "p(" + t + ")").join(" = ") + " = 0\\}$?", k,
        "Die Auswertung $p \\mapsto (" + pts.map((t) => "p(" + t + ")").join(", ") + ")$ ist linear und surjektiv (Interpolation), ihr Kern ist $U$. Homomorphiesatz: $\\mathbb{R}[x]_{\\le " + n + "}/U \\cong \\mathbb{R}^{" + k + "}$.");
    }),
    KL(tf("Ist $f: V \\to W$ linear und $U \\subseteq \\ker f$, so gibt es genau eine lineare Abbildung $\\bar f: V/U \\to W$ mit $\\bar f(v + U) = f(v)$.", true, "Wohldefiniert, weil $f$ auf jeder Nebenklasse konstant ist: $f(v + u) = f(v)$ für $u \\in U$. Eindeutig, weil jede Nebenklasse die Form $v + U$ hat.")),
    KL(tf("Für Unterräume $U \\subseteq W \\subseteq V$ gilt $(V/U)\\,/\\,(W/U) \\cong V/W$.", true, "$V/U \\to V/W$, $v + U \\mapsto v + W$ ist wohldefiniert, linear und surjektiv mit Kern $W/U$. Homomorphiesatz.")),
    EX(tf("Ist $U \\subseteq V$ ein Unterraum mit $U \\cong V$, so ist $V/U = 0$.", false, "In unendlicher Dimension nicht: Die Folgen mit $a_1 = 0$ bilden einen zum Raum aller Folgen isomorphen Unterraum (Verschieben), der Quotient ist aber eindimensional.")),
  ]);

  add("la-dual", 1, [
    (lv, G) => { const m = G.int(2, 4), n = G.int(2, 4); return nu("Welche Dimension hat der Dualraum von $\\mathbb{R}^{" + m + " \\times " + n + "}$?", m * n, "Für endlichdimensionales $V$ gilt $\\dim V^* = \\dim V = " + m + " \\cdot " + n + " = " + m * n + "$."); },
    (lv, G) => { const n = G.int(2, 6); return nu("Welche Dimension hat $(\\mathbb{R}[x]_{\\le " + n + "})^*$?", n + 1, "$\\dim V^* = \\dim V$, und $1, x, \\dots, x^{" + n + "}$ ist eine Basis aus $" + (n + 1) + "$ Elementen."); },
    (lv, G) => {
      const a = [nz(G, -3, 3), G.int(-3, 3), nz(G, -3, 3)], v = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)];
      const s = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
      return nu("$\\varphi(x) = " + lin(a) + "$. Berechne $\\varphi" + vec(v) + "$.", s, "Einsetzen: $" + a.map((c, i) => par(c) + " \\cdot " + par(v[i])).join(" + ") + " = " + s + "$.");
    },
    (lv, G) => {
      const t = G.int(-2, 3);
      const k = G.pick([["p(" + t + ")", true, "Auswerten ist linear: $(p + q)(" + t + ") = p(" + t + ") + q(" + t + ")$ und $(\\lambda p)(" + t + ") = \\lambda p(" + t + ")$."],
        ["p(" + t + ")^2", false, "Nicht additiv: $(p + q)(" + t + ")^2$ ist im Allgemeinen nicht $p(" + t + ")^2 + q(" + t + ")^2$."],
        ["p'(" + t + ")", true, "Ableiten und Auswerten sind beide linear."],
        ["p(" + t + ") + 1", false, "Die Nullfunktion geht nicht auf $0$, sondern auf $1$."],
        ["\\int_0^1 p(x)\\,dx", true, "Das Integral ist linear."]]);
      return tf("$p \\mapsto " + k[0] + "$ ist ein lineares Funktional auf $\\mathbb{R}[x]$.", k[1], k[2]);
    },
  ]);
  more("la-dual", [
    KL((lv, G) => {
      const k = nz(G, -2, 2), m = nz(G, -2, 2), p = G.int(-4, 4), q = G.int(-4, 4), x = (1 + k * m) * p - m * q;
      return nu("$b_1 = " + vec([1, k]) + "$ und $b_2 = " + vec([m, 1 + k * m]) + "$ bilden eine Basis, $b_1^*, b_2^*$ ist die duale Basis. Berechne $b_1^*" + vec([p, q]) + "$.", x,
        "$b_1^*$ liefert die erste Koordinate bezüglich $b_1, b_2$, also die erste Zeile von $T^{-1} = " + mat([[1 + k * m, -m], [-k, 1]]) + "$, angewandt auf den Vektor: $" + par(1 + k * m) + " \\cdot " + par(p) + " " + pm(-m) + " \\cdot " + par(q) + " = " + x + "$. Die dualen Basisvektoren sind die Zeilen der inversen Basismatrix.");
    }),
    KL((lv, G) => {
      const n = G.int(5, 9), a = G.int(2, n - 2), b = G.int(2, n - 2), c = G.int(Math.max(0, a + b - n), Math.min(a, b) - 1), s = a + b - c, v = n - s;
      return nu("$\\dim V = " + n + "$, $\\dim U = " + a + "$, $\\dim W = " + b + "$, $\\dim(U \\cap W) = " + c + "$. Welche Dimension hat der Annullator $(U + W)^0 \\subseteq V^*$?", v,
        "$\\dim(U + W) = " + a + " + " + b + " - " + c + " = " + s + "$, und $\\dim X^0 = \\dim V - \\dim X$: $" + n + " - " + s + " = " + v + "$. Außerdem gilt $(U + W)^0 = U^0 \\cap W^0$.");
    }),
    EX(tf("Lineare Funktionale $\\varphi_1, \\dots, \\varphi_k \\in V^*$ sind genau dann linear unabhängig, wenn $v \\mapsto (\\varphi_1(v), \\dots, \\varphi_k(v))$ eine surjektive Abbildung $V \\to \\mathbb{K}^k$ ist.", true, "Ist das Bild ein echter Unterraum, so verschwindet ein Funktional $\\lambda_1y_1 + \\dots + \\lambda_ky_k \\ne 0$ darauf, also ist $\\sum\\lambda_i\\varphi_i = 0$. Umgekehrt liefert eine Abhängigkeit genau so ein Funktional.")),
    EX(tf("Gilt $\\ker\\varphi_1 \\cap \\dots \\cap \\ker\\varphi_k \\subseteq \\ker\\psi$, so ist $\\psi$ eine Linearkombination von $\\varphi_1, \\dots, \\varphi_k$.", true, "$\\psi$ verschwindet auf dem Kern von $\\Phi = (\\varphi_1, \\dots, \\varphi_k): V \\to \\mathbb{K}^k$, faktorisiert also über das Bild: $\\psi = \\ell \\circ \\Phi$ mit einem linearen $\\ell$, und $\\ell$ ist eine Linearkombination der Koordinaten.")),
    KL(tf("Für einen Unterraum $U$ des endlichdimensionalen $V$ gilt $\\dim U + \\dim U^0 = \\dim V$.", true, "Eine Basis $u_1, \\dots, u_k$ von $U$ zu einer Basis ergänzen; die dualen Funktionale zu den ergänzten Vektoren bilden eine Basis von $U^0$.")),
  ]);

  more("la-elementar", [
    KL((lv, G) => {
      const c = G.pick([2, 3, -2, -3]), [i, j] = G.pickN([1, 2, 3], 2);
      const E3 = (r0, c0, val) => range(1, 3).map((r) => range(1, 3).map((cc) => (r === cc ? 1 : r === r0 && cc === c0 ? val : 0)));
      return ch("Welche Matrix ist die Inverse von $" + mat(E3(i, j, c)) + "$?", "$" + mat(E3(i, j, -c)) + "$",
        [["$" + mat(E3(j, i, -c)) + "$", "Das ist die Transponierte der Inversen."],
          ["$" + mat(E3(i, j, c)) + "$", "Die Matrix ist nicht ihre eigene Inverse: Ihr Quadrat hat an dieser Stelle $" + 2 * c + "$ statt $0$."],
          ["$" + mat(E3(i, j, G.frac(1, c))) + "$", "Der Kehrwert gehört nicht dazu. Die Umformung »$" + c + "$-mal Zeile $" + j + "$ zu Zeile $" + i + "$ addieren« macht man rückgängig, indem man dasselbe Vielfache wieder abzieht."]],
        "$E + cE_{" + i + j + "}$ addiert das $c$-Fache der Zeile $" + j + "$ zur Zeile $" + i + "$. Rückgängig macht das dieselbe Umformung mit $-c$: $(E + cE_{" + i + j + "})^{-1} = E - cE_{" + i + j + "}$.");
    }),
    KL((lv, G) => {
      const a = G.pick([1, 2, -1, 3]), t = nz(G, -3, 3), b = G.int(-3, 3), d = G.int(-4, 4), c = a * t, r22 = d - t * b;
      return cloze("Zerlege $A = " + mat([[a, b], [c, d]]) + " = LR$ mit $L = " + mat([[1, 0], ["\\ell", 1]]) + "$ und einer oberen Dreiecksmatrix $R$.\n\n$\\ell =$ {{0}} $\\qquad r_{22} =$ {{1}}",
        [t, r22], "Gauß ohne Vertauschen: Von Zeile $2$ das $\\ell$-Fache von Zeile $1$ abziehen, $\\ell = \\tfrac{a_{21}}{a_{11}} = " + t + "$. Es bleibt $r_{22} = " + d + " - " + par(t) + " \\cdot " + par(b) + " = " + r22 + "$. Der Faktor $\\ell$ wandert in $L$.");
    }),
    KL(tf("Zeilenumformungen ändern den Spaltenraum einer Matrix nicht.", false, "Sie ändern den Zeilenraum und den Kern nicht, den Spaltenraum schon: $" + mat([[1], [1]]) + "$ wird durch Abziehen der ersten Zeile von der zweiten zu $" + mat([[1], [0]]) + "$. Der Rang bleibt gleich.")),
    KL(tf("Das Produkt zweier unterer Dreiecksmatrizen mit Einsen auf der Diagonale ist wieder eine solche.", true, "Für $i < j$ ist $(LM)_{ij} = \\sum_k \\ell_{ik}m_{kj}$, und jeder Summand braucht $k \\le i$ und $k \\ge j$: unmöglich. Auf der Diagonale bleibt $1 \\cdot 1$. Deshalb sammeln sich bei Gauß alle Umformungen in einem $L$.")),
    EX((lv, G) => {
      const n = G.pick([2, 3, 4]), q = G.pick([2, 3, 5]), v = n * (n - 1) * (q - 1);
      return nu("Wie viele Additionsmatrizen $E + cE_{ij}$ ($i \\ne j$, $c \\ne 0$) gibt es für $" + n + " \\times " + n + "$-Matrizen über $\\mathbb{F}_{" + q + "}$?", v, "$" + n * (n - 1) + "$ Positionen $(i, j)$ mit $i \\ne j$, jeweils $" + (q - 1) + "$ Werte $c \\ne 0$: $" + v + "$. Verschiedene Wahlen liefern verschiedene Matrizen.");
    }),
    EX(tf("Jede invertierbare Matrix ist ein Produkt von Additionsmatrizen $E + cE_{ij}$ und einer einzigen Diagonalmatrix $\\operatorname{diag}(1, \\dots, 1, d)$.", true, "$A \\cdot \\operatorname{diag}(1, \\dots, 1, \\tfrac{1}{\\det A})$ hat Determinante $1$, und jede solche Matrix ist ein Produkt von Additionsmatrizen (Gauß ohne Skalieren; einen Zeilentausch baut man aus Additionen und einem Vorzeichen). Also $A = (\\text{Additionen}) \\cdot \\operatorname{diag}(1, \\dots, 1, \\det A)$.")),
  ]);

  more("la-cramer", [
    KL((lv, G) => {
      const [A, d] = randInv3(G, -2, 3), b = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)], k = G.int(0, 2);
      const Ak = A.map((r, i) => r.map((x, j) => (j === k ? b[i] : x))), dk = det3(Ak);
      return dec("Löse $" + mat(A) + "x = " + vec(b) + "$ mit der Cramerschen Regel, aber nur für $x_" + (k + 1) + "$ (vier Nachkommastellen).", dk / d, 4,
        "$x_" + (k + 1) + " = \\tfrac{\\det A_" + (k + 1) + "}{\\det A}$, wobei $A_" + (k + 1) + "$ die Spalte $" + (k + 1) + "$ durch die rechte Seite ersetzt: $\\det A = " + d + "$, $\\det A_" + (k + 1) + " = " + dk + "$, also $x_" + (k + 1) + " = " + G.frac(dk, d) + "$.");
    }),
    KL((lv, G) => {
      const [A, d] = randInv3(G, -2, 3), i = G.int(0, 2), j = G.int(0, 2);
      const mi = A.filter((_, r) => r !== j).map((row) => row.filter((_, c) => c !== i));
      const cof = ((i + j) % 2 ? -1 : 1) * (mi[0][0] * mi[1][1] - mi[0][1] * mi[1][0]);
      return dec("$A = " + mat(A) + "$. Bestimme den Eintrag $(A^{-1})_{" + (i + 1) + (j + 1) + "}$ über die Adjunkte (vier Nachkommastellen).", cof / d, 4,
        "$(A^{-1})_{" + (i + 1) + (j + 1) + "} = \\tfrac{1}{\\det A}(-1)^{" + (i + j + 2) + "}\\det A_{" + (j + 1) + (i + 1) + "}$: Zeile $" + (j + 1) + "$ und Spalte $" + (i + 1) + "$ streichen, die Indizes sind vertauscht. $\\det A = " + d + "$, der Kofaktor ist $" + cof + "$, also $" + G.frac(cof, d) + "$.");
    }),
    KL((lv, G) => {
      const n = G.pick([2, 3, 4]), d = G.pick([2, 3, -2, -1]), v = Math.pow(d, n - 1);
      return nu("$A \\in \\mathbb{R}^{" + n + " \\times " + n + "}$ hat $\\det A = " + d + "$. Berechne $\\det(\\operatorname{adj} A)$.", v, "$A \\operatorname{adj} A = (\\det A)E$, also $\\det A \\cdot \\det(\\operatorname{adj} A) = (\\det A)^{" + n + "}$ und $\\det(\\operatorname{adj} A) = (\\det A)^{" + (n - 1) + "} = " + v + "$.");
    }),
    EX(tf("Die Cramersche Regel gilt auch über $\\mathbb{Z}/6\\mathbb{Z}$, sofern $\\det A$ dort invertierbar ist.", true, "Die Formel $A \\operatorname{adj} A = (\\det A)E$ gilt über jedem kommutativen Ring. Ist $\\det A$ eine Einheit, so ist $A^{-1} = (\\det A)^{-1}\\operatorname{adj}A$, und die Regel folgt wörtlich.")),
    EX(tf("$\\operatorname{adj}(AB) = \\operatorname{adj}(B)\\operatorname{adj}(A)$ gilt auch für nicht invertierbare Matrizen.", true, "Für invertierbare folgt es aus $\\operatorname{adj}A = (\\det A)A^{-1}$. Beide Seiten sind Polynome in den Einträgen, und man ersetzt $A$ durch $A + tE$, das für fast alle $t$ invertierbar ist; die Gleichheit überträgt sich auf $t = 0$.")),
  ]);

  more("la-charpoly", [
    KL((lv, G) => {
      const ev = [G.int(-2, 2), G.int(-2, 2), G.int(-2, 3)], askDet = G.chance(0.5);
      const v = askDet ? ev.reduce((s, l) => s * (l * l + 1), 1) : ev.reduce((s, l) => s + l * l + 1, 0);
      return nu("$A \\in \\mathbb{R}^{3 \\times 3}$ hat die Eigenwerte $" + ev.join(", ") + "$ (mit Vielfachheit). Berechne $" + (askDet ? "\\det" : "\\operatorname{Spur}") + "(A^2 + E)$.", v,
        "Ist $Av = \\lambda v$, so ist $(A^2 + E)v = (\\lambda^2 + 1)v$; nach dem Trigonalisieren über $\\mathbb{C}$ sind die Eigenwerte von $A^2 + E$ genau $" + ev.map((l) => l * l + 1).join(", ") + "$. " + (askDet ? "Ihr Produkt" : "Ihre Summe") + " ist $" + v + "$.");
    }),
    EX(tf("Für $A, B \\in \\mathbb{R}^{n \\times n}$ haben $AB$ und $BA$ dasselbe charakteristische Polynom, auch wenn beide nicht invertierbar sind.", true, "Für invertierbares $A$ ist $BA = A^{-1}(AB)A$ ähnlich zu $AB$. Allgemein ist $A + tE$ für fast alle $t$ invertierbar; beide Seiten sind Polynome in $t$, also gilt die Gleichheit auch bei $t = 0$.")),
    KL(tf("Jede reelle $3 \\times 3$-Matrix hat einen reellen Eigenwert.", true, "$\\chi_A$ hat Grad $3$, und ein reelles Polynom ungeraden Grades hat nach dem Zwischenwertsatz eine reelle Nullstelle.")),
  ]);

  more("la-cayley", [
    KL((lv, G) => {
      const a = nz(G, -3, 3), b = G.pick([-3, -2, -1, 1, 2, 3].filter((x) => x !== a)), f = (c) => "(x " + pm(-c) + ")";
      const K = G.pick([
        [[[a, 0, 0], [0, a, 0], [0, 0, b]], f(a) + f(b), 2],
        [[[a, 1, 0], [0, a, 0], [0, 0, b]], f(a) + "^2" + f(b), 3],
        [[[a, 1, 0], [0, a, 1], [0, 0, a]], f(a) + "^3", 3],
        [[[a, 1, 0], [0, a, 0], [0, 0, a]], f(a) + "^2", 2],
        [[[a, 0, 0], [0, a, 0], [0, 0, a]], f(a), 1]]);
      return nu("Welchen Grad hat das Minimalpolynom von $" + mat(K[0]) + "$?", K[2], "Das Minimalpolynom ist $" + K[1] + "$: Jeder Eigenwert kommt mit der Größe seines größten Jordanblocks vor, nicht mit seiner Vielfachheit.");
    }),
    KL((lv, G) => {
      const t = G.int(-3, 3), d = G.pick([1, -1, 2, -2, 4]);
      return cloze("$A \\in \\mathbb{R}^{2 \\times 2}$ hat Spur $" + t + "$ und Determinante $" + d + "$. Schreibe $A^{-1} = aA + bE$.\n\n$a =$ {{0}} $\\qquad b =$ {{1}}",
        [-1 / d, t / d], "Cayley-Hamilton: $A^2 - (\\operatorname{Spur} A)A + (\\det A)E = 0$, also $A(" + (t === 0 ? "A" : "A " + pm(-t) + "E") + ") = " + (-d) + "E$ und $A^{-1} = \\tfrac{1}{" + d + "}(" + (t === 0 ? "" : t + "E ") + "- A)$: $a = " + G.frac(-1, d) + "$, $b = " + G.frac(t, d) + "$.", 1e-3);
    }),
    EX(tf("Jede Matrix $A \\in \\mathbb{C}^{n \\times n}$ ist Summe $A = D + N$ einer diagonalisierbaren Matrix $D$ und einer nilpotenten Matrix $N$ mit $DN = ND$.", true, "Jordan-Chevalley: In Jordanform ist $D$ der Diagonalteil und $N$ der Rest auf der Nebendiagonale; beide vertauschen blockweise. Die Zerlegung ist sogar eindeutig.")),
  ]);

  add("la-skalar", 1, [
    (lv, G) => {
      const a = G.int(1, 3), c = G.int(2, 4), b = G.int(-1, 1), x = [G.int(-3, 3), G.int(-3, 3)], y = [G.int(-3, 3), G.int(-3, 3)];
      const v = a * x[0] * y[0] + b * (x[0] * y[1] + x[1] * y[0]) + c * x[1] * y[1];
      return nu("Berechne $\\langle x, y \\rangle = x^T" + mat([[a, b], [b, c]]) + "y$ für $x = " + vec(x) + "$ und $y = " + vec(y) + "$.", v,
        "$\\langle x, y \\rangle = " + cx(a, "x_1y_1") + (b ? " " + pm(b) + "(x_1y_2 + x_2y_1)" : "") + " + " + c + "x_2y_2 = " + v + "$.");
    },
    (lv, G) => {
      const a = G.int(1, 4), c = G.int(1, 4), v = [nz(G, -3, 3), nz(G, -3, 3)], n2 = a * v[0] * v[0] + c * v[1] * v[1];
      return dec("Berechne die Norm von $v = " + vec(v) + "$ bezüglich $\\langle x, y \\rangle = " + cx(a, "x_1y_1") + " + " + cx(c, "x_2y_2") + "$ (vier Nachkommastellen).", Math.sqrt(n2), 4,
        "$\\|v\\| = \\sqrt{\\langle v, v \\rangle} = \\sqrt{" + a + " \\cdot " + v[0] * v[0] + " + " + c + " \\cdot " + v[1] * v[1] + "} = \\sqrt{" + n2 + "}$. Die Norm hängt vom Skalarprodukt ab.");
    },
  ]);
  add("la-skalar", 3, [
    (lv, G) => {
      const S = G.pick([[[2, 1], [1, 3]], [[1, 1], [1, 2]], [[3, -1], [-1, 2]], [[2, -1], [-1, 1]], [[4, 1], [1, 1]]]);
      let y = [1, 1], Sy = [0, 0];
      for (let t = 0; t < 30; t++) { y = [nz(G, -3, 3), nz(G, -2, 2)]; Sy = [S[0][0] * y[0] + S[0][1] * y[1], S[1][0] * y[0] + S[1][1] * y[1]]; if (Sy[1] !== 0) break; }
      if (Sy[1] === 0) { y = [1, 1]; Sy = [S[0][0] + S[0][1], S[1][0] + S[1][1]]; }
      return dec("Für welches $t$ ist $" + vec([1, "t"]) + "$ orthogonal zu $" + vec(y) + "$ bezüglich $\\langle x, y \\rangle = x^T" + mat(S) + "y$? (vier Nachkommastellen)", -Sy[0] / Sy[1], 4,
        "$" + mat(S) + vec(y) + " = " + vec(Sy) + "$, also $\\langle (1, t), y \\rangle = " + Sy[0] + " " + pm(Sy[1]) + "t = 0$ und $t = " + G.frac(-Sy[0], Sy[1]) + "$. Orthogonal heißt immer: bezüglich des gegebenen Skalarprodukts.");
    },
    (lv, G) => {
      const u = [nz(G, -3, 3), G.int(-3, 3), G.int(-2, 2)], v = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)];
      const uv = u[0] * v[0] + u[1] * v[1] + u[2] * v[2], uu = u[0] * u[0] + u[1] * u[1] + u[2] * u[2];
      return dec("Für welches $t$ ist $v - tu$ orthogonal zu $u$? $u = " + vec(u) + "$, $v = " + vec(v) + "$, Standardskalarprodukt (vier Nachkommastellen).", uv / uu, 4,
        "$\\langle v - tu, u \\rangle = \\langle v, u \\rangle - t\\langle u, u \\rangle = " + uv + " - " + uu + "t = 0$, also $t = " + G.frac(uv, uu) + "$. $tu$ ist die orthogonale Projektion von $v$ auf die Gerade durch $u$.");
    },
  ]);
  more("la-skalar", [
    KL((lv, G) => {
      const [a, b] = G.pickN([0, 1, 2, 3], 2), P = (e) => (e === 0 ? "1" : e === 1 ? "x" : "x^{" + e + "}");
      const c = Math.sqrt((2 * a + 1) * (2 * b + 1)) / (a + b + 1), ang = (Math.acos(c) * 180) / Math.PI;
      return dec("Welchen Winkel (in Grad) schließen $" + P(a) + "$ und $" + P(b) + "$ bezüglich $\\langle p, q \\rangle = \\int_0^1 p(x)q(x)\\,dx$ ein? (zwei Nachkommastellen)", ang, 2,
        "$\\langle x^a, x^b \\rangle = \\tfrac{1}{a + b + 1}$ und $\\|x^a\\|^2 = \\tfrac{1}{2a + 1}$, also $\\cos\\varphi = \\tfrac{\\sqrt{" + (2 * a + 1) * (2 * b + 1) + "}}{" + (a + b + 1) + "}$ und $\\varphi \\approx " + G.tex(ang, 2) + "°$.");
    }),
    KL((lv, G) => {
      const [a, d] = G.pick([[1, 5], [2, 3], [1, 7], [3, 3], [2, 5], [1, 10], [3, 5]]), t = Math.ceil(Math.sqrt(a * d)) - 1;
      return nu("Welches ist das größte ganze $t$, für das $\\langle x, y \\rangle = " + cx(a, "x_1y_1") + " + t(x_1y_2 + x_2y_1) + " + d + "x_2y_2$ ein Skalarprodukt auf $\\mathbb{R}^2$ ist?", t,
        "Die Form gehört zur Matrix $" + mat([[a, "t"], ["t", d]]) + "$; positiv definit genau dann, wenn $" + a + " > 0$ und $\\det = " + a * d + " - t^2 > 0$, also $t^2 < " + a * d + "$. Das größte ganze $t$ ist $" + t + "$.");
    }),
    KL(tf("$\\langle A, B \\rangle = \\operatorname{Spur}(A^TB)$ ist ein Skalarprodukt auf $\\mathbb{R}^{n \\times n}$.", true, "$\\operatorname{Spur}(A^TB) = \\sum_{i,j}a_{ij}b_{ij}$: das Standardskalarprodukt der Einträge.")),
    EX(tf("$\\langle A, B \\rangle = \\operatorname{Spur}(AB)$ ist ein Skalarprodukt auf $\\mathbb{R}^{n \\times n}$ ($n \\ge 2$).", false, "Für schiefsymmetrisches $A \\ne 0$ ist $\\operatorname{Spur}(AA) = -\\operatorname{Spur}(A^TA) < 0$. Bilinear und symmetrisch ist die Form, aber nicht positiv definit.")),
    EX(tf("Eine Norm kommt genau dann von einem Skalarprodukt, wenn sie die Parallelogrammgleichung $\\|v + w\\|^2 + \\|v - w\\|^2 = 2\\|v\\|^2 + 2\\|w\\|^2$ erfüllt.", true, "Satz von Jordan und von Neumann: Dann definiert die Polarisationsformel ein Skalarprodukt. So sieht man, dass Summen- und Maximumsnorm von keinem kommen.")),
  ]);

  more("la-gramschmidt", [
    KL((lv, G) => {
      let a = 1, b = 0, c = 0, d = 1;
      for (let t = 0; t < 40; t++) { a = nz(G, -3, 3); b = G.int(-3, 3); c = G.int(-3, 3); d = G.int(-3, 3); if (a * d - b * c !== 0) break; }
      if (a * d - b * c === 0) d += 1;
      const n1 = a * a + b * b, det = Math.abs(a * d - b * c), r22 = det / Math.sqrt(n1);
      return dec("QR-Zerlegung von $A = " + mat([[a, c], [b, d]]) + "$ mit Gram-Schmidt (positive Diagonale von $R$). Bestimme $r_{22}$ (vier Nachkommastellen).", r22, 4,
        "$r_{11} = \\|a_1\\| = \\sqrt{" + n1 + "}$, $r_{12} = \\langle a_2, q_1 \\rangle$, und $r_{22}$ ist die Länge des Rests $a_2 - r_{12}q_1$. Schneller: $r_{11}r_{22} = |\\det A| = " + det + "$, also $r_{22} = \\tfrac{" + det + "}{\\sqrt{" + n1 + "}} \\approx " + G.tex(r22, 4) + "$.");
    }),
    KL((lv, G) => {
      const u = [nz(G, -2, 2), G.int(-2, 2), G.int(-2, 2)], p = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)];
      const pu = p[0] * u[0] + p[1] * u[1] + p[2] * u[2], uu = u[0] * u[0] + u[1] * u[1] + u[2] * u[2], pp = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
      const d = Math.sqrt(Math.max(0, pp - (pu * pu) / uu));
      return dec("Welchen Abstand hat $p = " + vec(p) + "$ von der Geraden $\\mathbb{R}u$ mit $u = " + vec(u) + "$? (vier Nachkommastellen)", d, 4,
        "Ein Schritt Gram-Schmidt: Der Rest $p - \\tfrac{\\langle p, u \\rangle}{\\langle u, u \\rangle}u$ steht senkrecht auf $u$, seine Länge ist der Abstand. Pythagoras: $d^2 = \\|p\\|^2 - \\tfrac{\\langle p, u \\rangle^2}{\\|u\\|^2} = " + pp + " - \\tfrac{" + pu * pu + "}{" + uu + "}$, also $d \\approx " + G.tex(d, 4) + "$.");
    }),
    EX(ch("Gram-Schmidt auf $1, x, x^2$ bezüglich $\\langle p, q \\rangle = \\int_0^1 pq\\,dx$ (ohne Normieren). Was entsteht aus $x^2$?", "$x^2 - x + \\tfrac16$",
      [["$x^2 - \\tfrac13$", "Das ist nur die Projektion auf $1$ abgezogen; die auf $x - \\tfrac12$ fehlt."],
        ["$x^2 - x + \\tfrac12$", "$\\langle x^2, 1 \\rangle = \\tfrac13$ geht in die Konstante ein: $-\\tfrac13 + \\tfrac12 = \\tfrac16$."],
        ["$x^2 - \\tfrac12x$", "Der Koeffizient vor $x - \\tfrac12$ ist $\\tfrac{1/12}{1/12} = 1$, nicht $\\tfrac12$."]],
      "Zuerst $u_2 = x - \\tfrac12$. Dann $\\tfrac{\\langle x^2, 1 \\rangle}{\\langle 1, 1 \\rangle} = \\tfrac13$ und $\\tfrac{\\langle x^2, x - 1/2 \\rangle}{\\langle x - 1/2, x - 1/2 \\rangle} = \\tfrac{1/12}{1/12} = 1$, also $u_3 = x^2 - \\tfrac13 - (x - \\tfrac12) = x^2 - x + \\tfrac16$: das verschobene Legendre-Polynom.")),
    KL(tf("Die Gram-Matrix $\\bigl(\\langle v_i, v_j \\rangle\\bigr)_{i,j}$ ist genau dann invertierbar, wenn $v_1, \\dots, v_k$ linear unabhängig sind.", true, "Ist $G\\lambda = 0$, so $\\|\\sum\\lambda_iv_i\\|^2 = \\lambda^TG\\lambda = 0$, also $\\sum\\lambda_iv_i = 0$. Umgekehrt liefert eine Abhängigkeit einen Kernvektor von $G$.")),
    KL(tf("Wendet man Gram-Schmidt auf paarweise orthogonale Vektoren $\\ne 0$ an, ändert sich nur ihre Länge.", true, "Alle Projektionen $\\tfrac{\\langle v_k, u_i \\rangle}{\\langle u_i, u_i \\rangle}u_i$ sind null; es bleibt das Normieren.")),
    EX(tf("Das $k$-dimensionale Volumen des von $v_1, \\dots, v_k \\in \\mathbb{R}^n$ aufgespannten Parallelotops ist $\\sqrt{\\det G}$ mit der Gram-Matrix $G$.", true, "Mit $V = QR$ ist $G = V^TV = R^TR$, also $\\sqrt{\\det G} = |\\det R| = r_{11}\\cdots r_{kk}$: Grundseite mal Höhen, wie Gram-Schmidt sie liefert.")),
  ]);

  add("la-orthogonal", 1, [
    (lv, G) => {
      const M = G.pick([
        [[[0, 1], [1, 0]], true, "Die Spalten sind die Einheitsvektoren in anderer Reihenfolge: orthonormal. Eine Spiegelung an der Winkelhalbierenden."],
        [[[0, -1], [1, 0]], true, "Spalten $(0, 1)$ und $(-1, 0)$: Länge $1$, senkrecht. Die Drehung um $90°$."],
        [[[-1, 0], [0, 1]], true, "Spalten der Länge $1$, senkrecht zueinander: die Spiegelung an der $y$-Achse."],
        [[[1, 1], [0, 1]], false, "Die zweite Spalte $(1, 1)$ hat Länge $\\sqrt2$ und steht nicht senkrecht auf der ersten."],
        [[[1, 0], [0, 2]], false, "Die zweite Spalte hat Länge $2$: Die Matrix streckt."],
        [[[1, -1], [1, 1]], false, "Die Spalten stehen senkrecht, haben aber Länge $\\sqrt2$. Erst $\\tfrac{1}{\\sqrt2}$ mal die Matrix ist orthogonal."],
        [[[-1, 0], [0, -1]], true, "Die Punktspiegelung am Ursprung, also die Drehung um $180°$."]]);
      return tf("$" + mat(M[0]) + "$ ist orthogonal.", M[1], M[2] + " Orthogonal heißt: $Q^TQ = E$, die Spalten sind orthonormal.");
    },
    (lv, G) => {
      const [p, q, r] = G.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]), v = [G.int(-4, 4), G.int(-4, 4)];
      const Q = [["\\tfrac{" + p + "}{" + r + "}", "-\\tfrac{" + q + "}{" + r + "}"], ["\\tfrac{" + q + "}{" + r + "}", "\\tfrac{" + p + "}{" + r + "}"]];
      return dec("Berechne $\\|Qv\\|$ für $Q = " + mat(Q) + "$ und $v = " + vec(v) + "$ (vier Nachkommastellen).", Math.hypot(v[0], v[1]), 4,
        "$Q$ ist orthogonal, also längentreu: $\\|Qv\\| = \\|v\\| = \\sqrt{" + (v[0] * v[0] + v[1] * v[1]) + "}$. Ausrechnen von $Qv$ ist unnötig.");
    },
  ]);
  more("la-orthogonal", [
    KL((lv, G) => {
      const [p, q, r] = G.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), sc = G.sign(), ss = G.sign();
      let ang = (Math.atan2(ss * q, sc * p) * 180) / Math.PI;
      if (ang < 0) ang += 360;
      const f = (s, a) => (s < 0 ? "-" : "") + "\\tfrac{" + a + "}{" + r + "}";
      const Q = [[f(sc, p), f(-ss, q)], [f(ss, q), f(sc, p)]];
      return dec("$Q = " + mat(Q) + "$ ist eine Drehung. Um welchen Winkel in $[0°, 360°)$ dreht sie? (zwei Nachkommastellen)", ang, 2,
        "Eine Drehung hat die Form $" + mat([["\\cos\\varphi", "-\\sin\\varphi"], ["\\sin\\varphi", "\\cos\\varphi"]]) + "$: $\\cos\\varphi = " + G.frac(sc * p, r) + "$, $\\sin\\varphi = " + G.frac(ss * q, r) + "$. Den Quadranten legen beide Vorzeichen fest: $\\varphi \\approx " + G.tex(ang, 2) + "°$.");
    }),
    KL(tf("Jede orthogonale $2 \\times 2$-Matrix ist eine Drehung oder eine Spiegelung an einer Geraden durch $0$.", true, "Die erste Spalte ist $(\\cos\\varphi, \\sin\\varphi)$, die zweite steht senkrecht darauf: $\\pm(-\\sin\\varphi, \\cos\\varphi)$. Plus gibt eine Drehung ($\\det = 1$), minus eine Spiegelung ($\\det = -1$).")),
    KL(tf("Ist $Q$ orthogonal und symmetrisch, so gilt $Q^2 = E$.", true, "$Q^2 = Q^TQ = E$. Solche $Q$ sind Spiegelungen an einem Unterraum: Eigenwerte $\\pm1$, die Eigenräume stehen senkrecht aufeinander.")),
    EX(tf("Jede orthogonale $n \\times n$-Matrix ist ein Produkt von höchstens $n$ Spiegelungen an Hyperebenen.", true, "Satz von Cartan-Dieudonné. Induktiv: Eine Spiegelung bringt $Qe_1$ nach $e_1$, danach arbeitet man im orthogonalen Komplement weiter.")),
  ]);

  // ================================================================ Analysis I
  more("ana-logik", [
    KL((lv, G) => {
      const f = G.pick([
        ["(A \\Rightarrow B) \\land (B \\Rightarrow C)", 4, "Wahr genau für die Belegungen, in denen die Werte nicht fallen: $000$, $001$, $011$, $111$."],
        ["A \\lor (B \\land C)", 5, "Ist $A$ wahr: $4$ Zeilen. Ist $A$ falsch, nur wenn $B$ und $C$ wahr sind: $1$ Zeile. Zusammen $5$."],
        ["(A \\lor B) \\Rightarrow C", 5, "Falsch nur, wenn $A \\lor B$ wahr und $C$ falsch ist: $3$ Zeilen. Also $8 - 3 = 5$."],
        ["A \\oplus B \\oplus C", 4, "Das exklusive Oder ist wahr bei einer ungeraden Anzahl wahrer Variablen: $3 + 1 = 4$."],
        ["(A \\land B) \\lor (\\lnot A \\land C)", 4, "Für wahres $A$ entscheidet $B$, für falsches $A$ entscheidet $C$: $2 + 2 = 4$."],
        ["\\lnot(A \\land B \\land C)", 7, "Falsch nur in der einen Zeile, in der alle drei wahr sind: $7$."],
        ["(A \\Leftrightarrow B) \\lor C", 6, "Ist $C$ wahr: $4$ Zeilen. Ist $C$ falsch, muss $A \\Leftrightarrow B$ gelten: $2$ Zeilen. Zusammen $6$."]]);
      return nu("In wie vielen der $8$ Zeilen der Wahrheitstafel ist $" + f[0] + "$ wahr?" + (f[0].indexOf("oplus") >= 0 ? " ($\\oplus$: exklusives Oder)" : ""), f[1], f[2]);
    }),
    EX(tf("In jedem nichtleeren Bereich gilt $\\exists x\\ \\forall y: \\bigl(P(y) \\Rightarrow P(x)\\bigr)$.", true, "Gibt es ein $y$ mit $P(y)$, nimm $x = y$: Dann ist $P(x)$ wahr. Gibt es keines, ist jede Implikation $P(y) \\Rightarrow P(x)$ wahr, weil ihre Voraussetzung falsch ist. Das sogenannte Trinkerparadox.")),
    KL(tf("$\\lnot\\forall x\\ \\exists y\\ \\forall z: P(x, y, z)$ ist äquivalent zu $\\exists x\\ \\forall y\\ \\exists z: \\lnot P(x, y, z)$.", true, "Die Verneinung wandert von links nach rechts durch und tauscht jeden Quantor.")),
    KL(tf("$(A \\Rightarrow B) \\Rightarrow C$ ist äquivalent zu $A \\Rightarrow (B \\Rightarrow C)$.", false, "Mit $A$ und $C$ falsch: Links ist $A \\Rightarrow B$ wahr und damit das Ganze falsch, rechts ist die Implikation mit falscher Voraussetzung $A$ wahr. Die Implikation ist nicht assoziativ.")),
    EX(tf("Mit dem einen Junktor NAND, $\\lnot(A \\land B)$, lässt sich jede Aussagenverknüpfung ausdrücken.", true, "$\\lnot A$ ist $A$ NAND $A$, und $A \\land B$ ist die Verneinung von $A$ NAND $B$. Mit $\\lnot$ und $\\land$ geht alles (disjunktive Normalform).")),
  ]);

  more("ana-mengen", [
    KL((lv, G) => {
      const a = G.int(2, 5), b = G.int(2, 5), c = G.int(0, Math.min(a, b) - 1), n = a + b - c;
      return nu("$|A| = " + a + "$, $|B| = " + b + "$, $|A \\cap B| = " + c + "$. Wie viele Elemente hat $\\mathcal{P}(A \\cup B)$?", Math.pow(2, n), "$|A \\cup B| = " + a + " + " + b + " - " + c + " = " + n + "$ (Inklusion-Exklusion), also $2^{" + n + "} = " + Math.pow(2, n) + "$ Teilmengen.");
    }),
    EX((lv, G) => {
      const n = G.pick([3, 5, 6]), bell = { 3: 5, 5: 52, 6: 203 }[n];
      return nu("Wie viele Äquivalenzrelationen gibt es auf einer Menge mit $" + n + "$ Elementen?", bell, "Äquivalenzrelationen entsprechen Zerlegungen in Klassen. Ihre Anzahl ist die Bell-Zahl $B_{" + n + "} = " + bell + "$. Rekursiv $B_{n+1} = \\sum_k \\binom nk B_k$: Man wählt die $k$ alten Elemente, die nicht mit dem neuen in einer Klasse liegen, und zerlegt sie beliebig.");
    }),
    KL(tf("$A \\times (B \\cup C) = (A \\times B) \\cup (A \\times C)$ für alle Mengen $A, B, C$.", true, "Ein Paar $(a, x)$ mit $x \\in B \\cup C$ liegt in $A \\times B$ oder in $A \\times C$, und umgekehrt.")),
    EX(nu("Wie viele Halbordnungen gibt es auf einer Menge mit $3$ Elementen?", 19, "Nach Form zählen: keine Vergleiche $1$; genau ein vergleichbares Paar $3 \\cdot 2 = 6$; eine Kette $3! = 6$; ein Element unter zwei unvergleichbaren $3$; zwei unvergleichbare unter einem $3$. Zusammen $19$.")),
  ]);

  more("ana-abb", [
    EX((lv, G) => {
      const [n, k] = G.pick([[4, 2], [5, 2], [6, 2], [4, 3], [6, 3]]);
      let s = 0;
      for (let j = 0; j <= k; j++) s += (j % 2 ? -1 : 1) * binomC(k, j) * Math.pow(k - j, n);
      return nu("Wie viele **surjektive** Abbildungen $\\{1, \\dots, " + n + "\\} \\to \\{1, \\dots, " + k + "\\}$ gibt es?", s, "Inklusion-Exklusion über die ausgelassenen Werte: $\\sum_{j=0}^{" + k + "}(-1)^j\\binom{" + k + "}{j}(" + k + " - j)^{" + n + "} = " + s + "$.");
    }),
    KL(tf("Ist $f$ surjektiv und $g \\circ f$ injektiv, so ist $g$ injektiv.", true, "Aus $g(y_1) = g(y_2)$ mit $y_i = f(x_i)$ folgt $g(f(x_1)) = g(f(x_2))$, also $x_1 = x_2$ und damit $y_1 = y_2$.")),
  ]);

  more("ana-anordnung", [
    KL((lv, G) => {
      const a = G.int(1, 6), b = G.int(1, 6);
      return dec("Wie lang ist die Lösungsmenge von $|2x - " + a + "| < x + " + b + "$? (vier Nachkommastellen)", (2 * a + 4 * b) / 3, 4,
        "Nötig ist $x + " + b + " > 0$. Dann $-(x + " + b + ") < 2x - " + a + " < x + " + b + "$, also $x > " + G.frac(a - b, 3) + "$ und $x < " + (a + b) + "$. Die Lösungsmenge ist das Intervall von $" + G.frac(a - b, 3) + "$ bis $" + (a + b) + "$ mit der Länge $" + G.frac(2 * a + 4 * b, 3) + "$.");
    }),
    KL(tf("Für $a, b > 0$ gilt $\\tfrac{2ab}{a + b} \\le \\sqrt{ab} \\le \\tfrac{a + b}{2} \\le \\sqrt{\\tfrac{a^2 + b^2}{2}}$.", true, "Harmonisches, geometrisches, arithmetisches und quadratisches Mittel. Jede Stufe folgt aus $(\\sqrt a - \\sqrt b)^2 \\ge 0$ oder $(a - b)^2 \\ge 0$; Gleichheit nur bei $a = b$.")),
    EX(tf("In einem angeordneten Körper ist $-1$ keine Summe von Quadraten.", true, "Quadrate sind $\\ge 0$, also auch ihre Summen, aber $-1 < 0$. Deshalb lässt sich $\\mathbb{C}$ mit $i^2 = -1$ nicht anordnen.")),
  ]);

  more("ana-supinf", [
    KL((lv, G) => {
      const a = G.int(1, 4), c = G.int(1, 3);
      let b = nz(G, -4, 8);
      if (b === a * c) b += 1;
      const top = G.chance(0.5), falls = b - a * c > 0, f1 = (a + b) / (1 + c);
      const v = top ? (falls ? f1 : a) : (falls ? a : f1);
      return dec("Bestimme $\\" + (top ? "sup" : "inf") + "\\bigl\\{\\tfrac{" + cx(a, "n") + " " + pm(b) + "}{n + " + c + "} : n \\in \\mathbb{N},\\ n \\ge 1\\bigr\\}$ (vier Nachkommastellen).", v, 4,
        "$\\tfrac{" + cx(a, "n") + " " + pm(b) + "}{n + " + c + "} = " + a + " " + pm(b - a * c) + " \\cdot \\tfrac{1}{n + " + c + "}$. " + (falls ? "Die Folge fällt" : "Die Folge wächst") + " und strebt gegen $" + a + "$. " +
        (top === falls ? "Der Wert bei $n = 1$, $" + G.frac(a + b, 1 + c) + "$, wird angenommen." : "Der Grenzwert $" + a + "$ wird nie angenommen, ist aber die beste Schranke."));
    }),
    EX(tf("Ist $A \\subseteq \\mathbb{R}$ nichtleer und beschränkt mit $\\sup A \\notin A$, so gibt es eine streng wachsende Folge in $A$, die gegen $\\sup A$ konvergiert.", true, "Zu jedem $n$ gibt es $a \\in A$ über $\\sup A - \\tfrac1n$. Weil das Supremum nicht angenommen wird, kann man jedes neue Glied größer als das vorige wählen.")),
    KL(tf("Für nichtleere, beschränkte $A, B \\subseteq (0, \\infty)$ gilt $\\sup(A \\cdot B) = \\sup A \\cdot \\sup B$.", true, "Für positive Zahlen ist $ab \\le \\sup A \\sup B$, und mit $a \\to \\sup A$, $b \\to \\sup B$ kommt man beliebig nahe heran. Ohne Positivität falsch: $A = \\{-2, -1\\}$, $B = \\{-1\\}$ geben $\\sup(AB) = 2$, aber $\\sup A \\sup B = 1$.")),
    KL(tf("Für nichtleeres, beschränktes $A \\subseteq \\mathbb{R}$ gilt $\\sup A - \\inf A = \\sup\\{|a - b| : a, b \\in A\\}$.", true, "Jeder Abstand ist höchstens $\\sup A - \\inf A$, und mit $a$ nahe $\\sup A$, $b$ nahe $\\inf A$ kommt man beliebig nahe heran.")),
  ]);

  more("ana-wurzel", [
    KL((lv, G) => {
      const [m, n] = G.pick([[3, 2], [5, 2], [5, 3], [6, 2], [7, 3], [7, 5], [6, 5], [10, 3]]);
      return nu("Es gilt $\\sqrt{" + (m + n) + " + 2\\sqrt{" + m * n + "}} = \\sqrt a + \\sqrt b$ mit natürlichen Zahlen $a > b$. Bestimme $a$.", m,
        "Quadrieren: $a + b + 2\\sqrt{ab} = " + (m + n) + " + 2\\sqrt{" + m * n + "}$. Mit $a + b = " + (m + n) + "$ und $ab = " + m * n + "$ sind $a, b$ die Nullstellen von $t^2 - " + (m + n) + "t + " + m * n + "$: $a = " + m + "$, $b = " + n + "$.");
    }),
    KL(tf("Ist $\\sqrt a + \\sqrt b$ rational ($a, b \\in \\mathbb{N}$), so sind $a$ und $b$ Quadratzahlen.", true, "Ist $s = \\sqrt a + \\sqrt b > 0$ rational, so auch $\\sqrt a - \\sqrt b = \\tfrac{a - b}{s}$, also $\\sqrt a = \\tfrac12\\bigl(s + \\tfrac{a - b}{s}\\bigr)$. Dann ist $a$ eine Quadratzahl, ebenso $b$.")),
    EX(tf("$\\sqrt2 + \\sqrt[3]{2}$ ist irrational.", true, "Wäre $r = \\sqrt2 + \\sqrt[3]2$ rational, so $2 = (r - \\sqrt2)^3 = r^3 + 6r - (3r^2 + 2)\\sqrt2$, und $\\sqrt2 = \\tfrac{r^3 + 6r - 2}{3r^2 + 2}$ wäre rational.")),
    KL(tf("Zwischen zwei verschiedenen reellen Zahlen liegt immer eine irrationale Zahl.", true, "Zwischen $a - \\sqrt2$ und $b - \\sqrt2$ liegt eine rationale Zahl $q$; dann liegt $q + \\sqrt2$ zwischen $a$ und $b$ und ist irrational.")),
    EX(tf("Ist $x > 0$ irrational, so ist auch $x^2$ irrational.", false, "$x = \\sqrt2$ gibt $x^2 = 2$. Umgekehrt stimmt es: Ist $x^2$ irrational, so auch $x$.")),
  ]);

  more("ana-abzaehlbar", [
    KL(tf("$\\mathbb{Q} \\times \\mathbb{Q}$ ist abzählbar.", true, "$\\mathbb{Q}$ ist abzählbar, und das Produkt zweier abzählbarer Mengen auch (Cantors Diagonalabzählung von $\\mathbb{N} \\times \\mathbb{N}$).")),
    KL(tf("Die Folgen natürlicher Zahlen, die ab einer Stelle null sind, bilden eine abzählbare Menge.", true, "Sie sind die Vereinigung über $n$ der Mengen $\\mathbb{N}^n$ (alles ab Stelle $n + 1$ null): abzählbar viele abzählbare Mengen.")),
    EX(tf("Die transzendenten Zahlen bilden eine überabzählbare Menge.", true, "$\\mathbb{R}$ ist überabzählbar, die algebraischen Zahlen sind abzählbar. Wären auch die transzendenten abzählbar, so wäre $\\mathbb{R}$ als Vereinigung abzählbar.")),
    EX(tf("Jede Familie paarweise disjunkter offener Intervalle in $\\mathbb{R}$ ist abzählbar.", true, "Jedes Intervall enthält eine rationale Zahl, und wegen der Disjunktheit sind diese verschieden. Das gibt eine Injektion in $\\mathbb{Q}$.")),
    KL(tf("Die Menge der Häufungspunkte einer reellen Folge ist abzählbar.", false, "Eine Abzählung von $\\mathbb{Q}$, als Folge gelesen, hat jede reelle Zahl als Häufungspunkt.")),
    KL(tf("Eine Vereinigung abzählbar vieler endlicher Mengen kann überabzählbar sein.", false, "Sie ist abzählbar: Man zählt die erste Menge ab, dann die zweite, und so weiter.")),
    KL(tf("Jede unendliche Teilmenge einer abzählbaren Menge ist abzählbar unendlich.", true, "Man durchläuft die Abzählung der großen Menge und behält nur die Elemente der Teilmenge; das bleibt eine unendliche Folge ohne Wiederholung.")),
  ]);

  more("ana-komplex", [
    KL((lv, G) => {
      const n = G.int(5, 12), r = Math.pow(2, n / 2);
      const re = Math.round(r * Math.cos((n * Math.PI) / 4)), im = Math.round(r * Math.sin((n * Math.PI) / 4)), askRe = G.chance(0.5);
      return nu("Berechne den " + (askRe ? "Realteil" : "Imaginärteil") + " von $(1 + i)^{" + n + "}$.", askRe ? re : im, "$1 + i = \\sqrt2\\,e^{i\\pi/4}$, also $(1 + i)^{" + n + "} = 2^{" + n + "/2}e^{i \\cdot " + n + "\\pi/4} = " + cplx(re, im) + "$.");
    }),
    EX(tf("Die Gleichung $z^2 = \\bar z$ hat in $\\mathbb{C}$ genau $4$ Lösungen.", true, "Beträge: $|z|^2 = |z|$, also $|z| \\in \\{0, 1\\}$. Für $|z| = 1$ ist $\\bar z = \\tfrac1z$, und die Gleichung wird $z^3 = 1$: drei Lösungen. Dazu kommt $z = 0$.")),
  ]);

  more("ana-normen", [
    KL((lv, G) => {
      const a = nz(G, -6, 6), b = nz(G, -6, 6), one = G.chance(0.5), v = one ? Math.max(Math.abs(a), Math.abs(b)) : Math.abs(a) + Math.abs(b);
      return nu("Welchen größten Wert nimmt $" + cx(a) + " " + (b < 0 ? "- " : "+ ") + cx(Math.abs(b), "y") + "$ auf der Menge $\\{(x, y) : " + (one ? "|x| + |y| \\le 1" : "\\max(|x|, |y|) \\le 1") + "\\}$ an?", v,
        one ? "Die Einheitskugel der Summennorm ist eine Raute mit den Ecken $(\\pm1, 0)$ und $(0, \\pm1)$; eine lineare Funktion wird in einer Ecke maximal: $\\max(" + Math.abs(a) + ", " + Math.abs(b) + ") = " + v + "$. Die Maximumsnorm ist die duale Norm der Summennorm."
          : "Die Einheitskugel der Maximumsnorm ist das Quadrat mit den Ecken $(\\pm1, \\pm1)$; in der Ecke mit passenden Vorzeichen: $" + Math.abs(a) + " + " + Math.abs(b) + " = " + v + "$. Die Summennorm ist die duale Norm der Maximumsnorm.");
    }),
    KL((lv, G) => {
      const n = G.int(2, 9);
      return dec("Bestimme die kleinste Konstante $c$ mit $\\|x\\|_1 \\le c\\,\\|x\\|_2$ für alle $x \\in \\mathbb{R}^{" + n + "}$ (vier Nachkommastellen).", Math.sqrt(n), 4, "Cauchy-Schwarz mit $(1, \\dots, 1)$: $\\|x\\|_1 = \\sum|x_i| \\cdot 1 \\le \\sqrt{" + n + "}\\,\\|x\\|_2$, Gleichheit bei $x = (1, \\dots, 1)$. Also $c = \\sqrt{" + n + "}$.");
    }),
  ]);

  more("ana-metrik", [
    KL(tf("$\\mathbb{Q}$ ist als Teilmenge von $\\mathbb{R}$ weder offen noch abgeschlossen.", true, "Nicht offen: Jedes Intervall um eine rationale Zahl enthält irrationale. Nicht abgeschlossen: Rationale Folgen konvergieren gegen $\\sqrt2$.")),
    KL(tf("$d(x, y) = \\tfrac{|x - y|}{1 + |x - y|}$ ist eine Metrik auf $\\mathbb{R}$.", true, "$t \\mapsto \\tfrac{t}{1 + t}$ ist wachsend und subadditiv, damit überträgt sich die Dreiecksungleichung. Dieselben konvergenten Folgen wie mit $|x - y|$, aber alle Abstände sind $< 1$.")),
    KL(tf("In jedem metrischen Raum ist der Durchschnitt beliebig vieler offener Mengen offen.", false, "$\\bigcap_n (-\\tfrac1n, \\tfrac1n) = \\{0\\}$. Nur endliche Durchschnitte offener Mengen sind offen.")),
    KL(tf("In jedem metrischen Raum konvergiert jede Cauchy-Folge.", false, "In $\\mathbb{Q}$ konvergiert die Folge der Dezimalnäherungen von $\\sqrt2$ nicht. Räume, in denen es gilt, heißen vollständig.")),
    EX(tf("Ist $(X, d)$ vollständig und $A \\subseteq X$ abgeschlossen, so ist $(A, d)$ vollständig.", true, "Eine Cauchy-Folge in $A$ konvergiert in $X$, und weil $A$ abgeschlossen ist, liegt ihr Grenzwert in $A$.")),
    EX(tf("Auf $\\mathbb{R}^2$ ist $d(x, y) = |x - y|$, falls $x$, $y$ und $0$ auf einer Geraden liegen, und sonst $|x| + |y|$, eine Metrik.", true, "Die Eisenbahnmetrik: Wer nicht auf derselben Geraden durch $0$ liegt, fährt über den Knoten $0$. Die Dreiecksungleichung prüft man in den Fällen, wie die drei Punkte zu Geraden durch $0$ liegen.")),
    EX((lv, G) => {
      const p = G.pick([2, 3]), k = G.int(1, 5), m = G.pick(p === 2 ? [1, 3, 5] : [1, 2, 4]), a = G.int(1, 20), b = a + Math.pow(p, k) * m;
      return dec("Die $" + p + "$-adische Metrik: $d_" + p + "(x, y) = " + p + "^{-k}$, wenn $" + p + "^k$ die höchste $" + p + "$-Potenz ist, die $x - y$ teilt. Berechne $d_" + p + "(" + a + ", " + b + ")$ (sechs Nachkommastellen).", Math.pow(p, -k), 6,
        "$" + b + " - " + a + " = " + (b - a) + " = " + p + "^{" + k + "} \\cdot " + m + "$, also $d_" + p + " = " + p + "^{-" + k + "}$. In dieser Metrik liegen Zahlen nah beieinander, deren Differenz durch eine hohe $" + p + "$-Potenz teilbar ist; es gilt $" + p + "^n \\to 0$.");
    }),
  ]);

  more("ana-epsilon", [
    KL((lv, G) => {
      const [e, et] = G.pick([[0.1, "\\tfrac{1}{10}"], [0.05, "\\tfrac{1}{20}"], [0.02, "\\tfrac{1}{50}"], [0.03, "0{,}03"]]);
      const n0 = Math.floor(1 / (e * e) + 1e-9) + 1;
      return nu("Bestimme das kleinste $n_0$ mit $\\tfrac{1}{\\sqrt n} < " + et + "$ für alle $n \\ge n_0$.", n0, "$\\tfrac{1}{\\sqrt n} < \\varepsilon \\iff n > \\tfrac{1}{\\varepsilon^2} = " + G.tex(1 / (e * e), 2) + "$, also $n_0 = " + n0 + "$. Bei Gleichheit ist die Ungleichung noch nicht strikt.");
    }),
    EX(tf("Aus $a_n \\to a > 0$ mit allen $a_n > 0$ folgt $\\sqrt[n]{a_1a_2\\cdots a_n} \\to a$.", true, "Logarithmieren: $\\tfrac1n\\sum\\ln a_k \\to \\ln a$ nach dem Cauchyschen Grenzwertsatz (Mittelwerte konvergenter Folgen), dann $\\exp$ anwenden.")),
  ]);

  more("ana-monoton", [
    KL((lv, G) => {
      const m = G.pick([3, 5, 7, 10, 11]);
      return dec("$a_1 = 1$, $a_{n+1} = \\tfrac12\\bigl(a_n + \\tfrac{" + m + "}{a_n}\\bigr)$. Bestimme $\\lim a_n$ (vier Nachkommastellen).", Math.sqrt(m), 4,
        "Ab $n = 2$ gilt $a_n \\ge \\sqrt{" + m + "}$ (AM-GM), und die Folge fällt; also konvergiert sie. Der Grenzwert erfüllt $a = \\tfrac12(a + \\tfrac{" + m + "}{a})$, also $a^2 = " + m + "$ und $a = \\sqrt{" + m + "}$: das Heron-Verfahren.");
    }),
    EX(tf("Ist $(a_n)$ beschränkt mit $a_{n+1} \\ge a_n - 2^{-n}$ für alle $n$, so konvergiert $(a_n)$.", true, "$b_n = a_n - 2^{1-n}$ wächst: $b_{n+1} - b_n = a_{n+1} - a_n + 2^{-n} \\ge 0$. Beschränkt und monoton, also konvergent, und $a_n = b_n + 2^{1-n}$ hat denselben Grenzwert.")),
  ]);

  more("ana-teilfolgen", [
    KL((lv, G) => {
      const k = G.pick([5, 7, 8, 9, 10, 12]), h = Math.floor(k / 2), v = h + 1;
      return nu("Wie viele Häufungspunkte hat $\\cos\\bigl(\\tfrac{2n\\pi}{" + k + "}\\bigr)$?", v, "Die Folge ist $" + k + "$-periodisch, ihre Häufungspunkte sind die angenommenen Werte. $\\cos\\tfrac{2n\\pi}{" + k + "}$ und $\\cos\\tfrac{2(" + k + " - n)\\pi}{" + k + "}$ stimmen überein; verschieden sind die Werte für $n = 0, \\dots, " + h + "$: also $" + v + "$.");
    }),
    EX(tf("Hat jede Teilfolge von $(a_n)$ eine Teilfolge, die gegen $a$ konvergiert, so gilt $a_n \\to a$.", true, "Sonst gäbe es ein $\\varepsilon > 0$ und eine Teilfolge außerhalb von $(a - \\varepsilon, a + \\varepsilon)$; keine ihrer Teilfolgen könnte gegen $a$ konvergieren.")),
    KL(tf("Eine beschränkte Folge, deren konvergente Teilfolgen alle denselben Grenzwert $a$ haben, konvergiert gegen $a$.", true, "Sonst gäbe es eine Teilfolge mit Abstand $\\ge \\varepsilon$ zu $a$; nach Bolzano-Weierstraß hätte sie eine konvergente Teilfolge mit einem anderen Grenzwert. Ohne Beschränktheit falsch: $0, 1, 0, 2, 0, 3, \\dots$")),
  ]);

  more("ana-reihen", [
    KL((lv, G) => {
      if (G.chance(0.5)) {
        const k = G.pick([1, 3, 4, 5]);
        let h = 0;
        for (let i = 1; i <= k; i++) h += 1 / i;
        const v = h / k;
        return dec("Berechne $\\sum_{n=1}^{\\infty} \\tfrac{1}{n(n + " + k + ")}$ (vier Nachkommastellen).", v, 4, "Partialbrüche: $\\tfrac{1}{n(n + " + k + ")} = \\tfrac{1}{" + k + "}\\bigl(\\tfrac1n - \\tfrac{1}{n + " + k + "}\\bigr)$. Die Summe teleskopiert, es bleiben die ersten $" + k + "$ Glieder: $\\tfrac{1}{" + k + "}\\bigl(1 + \\dots + \\tfrac{1}{" + k + "}\\bigr) \\approx " + G.tex(v, 4) + "$.");
      }
      const [p, q] = G.pick([[1, 3], [2, 3], [1, 4], [3, 4]]), x = p / q, v = x / ((1 - x) * (1 - x));
      return dec("Berechne $\\sum_{n=1}^{\\infty} n\\bigl(\\tfrac{" + p + "}{" + q + "}\\bigr)^n$ (vier Nachkommastellen).", v, 4, "$\\sum nx^n = \\tfrac{x}{(1 - x)^2}$: die geometrische Reihe ableiten und mit $x$ multiplizieren. Bei $x = \\tfrac{" + p + "}{" + q + "}$: $" + G.tex(v, 4) + "$.");
    }),
    EX(tf("Konvergiert $\\sum a_n$ mit $a_n > 0$ und fällt $(a_n)$ monoton, so gilt $na_n \\to 0$.", true, "$\\tfrac n2 a_n \\le a_{\\lceil n/2 \\rceil} + \\dots + a_n \\to 0$ nach dem Cauchy-Kriterium. Ohne Monotonie falsch: $a_n = \\tfrac1n$ für Quadratzahlen $n$, sonst $\\tfrac{1}{n^2}$.")),
  ]);

  more("ana-kriterien", [
    KL((lv, G) => {
      const c = G.pick([1, 2, 3]);
      return dec("$a_n = \\bigl(1 - \\tfrac{" + c + "}{n}\\bigr)^{n^2}$. Bestimme $\\lim\\sqrt[n]{a_n}$ (vier Nachkommastellen).", Math.exp(-c), 4, "$\\sqrt[n]{a_n} = \\bigl(1 - \\tfrac{" + c + "}{n}\\bigr)^n \\to e^{-" + c + "} < 1$: Nach dem Wurzelkriterium konvergiert $\\sum a_n$.");
    }),
    KL(tf("$\\sum_{n \\ge 1} \\tfrac{(n!)^2}{(2n)!}$ konvergiert.", true, "Quotient: $\\tfrac{(n + 1)^2}{(2n + 1)(2n + 2)} \\to \\tfrac14 < 1$.")),
    EX(tf("$\\sum_{n \\ge 1} \\tfrac{1}{n^{1 + 1/n}}$ konvergiert.", false, "$n^{1/n} \\le e^{1/e} < 2$ für alle $n$, also $\\tfrac{1}{n^{1 + 1/n}} \\ge \\tfrac{1}{2n}$: Minorante harmonische Reihe. Der Exponent ist zwar $> 1$, nähert sich $1$ aber zu schnell.")),
    EX(tf("$\\sum_{n \\ge 1} \\tfrac{(2n)!}{4^n(n!)^2}$ konvergiert.", false, "Die Glieder verhalten sich wie $\\tfrac{1}{\\sqrt{\\pi n}}$ (Stirling); schon $\\tfrac{(2n)!}{4^n(n!)^2} \\ge \\tfrac{1}{2\\sqrt n}$ zeigt die Divergenz. Das Quotientenkriterium liefert nur den Grenzwert $1$.")),
    KL(tf("Für fallende $a_n \\ge 0$ konvergiert $\\sum a_n$ genau dann, wenn $\\sum 2^ka_{2^k}$ konvergiert.", true, "Cauchys Verdichtungssatz: Die Glieder von $2^k$ bis $2^{k+1} - 1$ liegen zwischen $2^ka_{2^{k+1}}$ und $2^ka_{2^k}$. Damit erledigt man $\\sum\\tfrac{1}{n^p}$ und $\\sum\\tfrac{1}{n\\ln n}$ in einer Zeile.")),
  ]);

  more("ana-exp", [
    KL((lv, G) => {
      const [a, b] = G.pick([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [-1, 1], [-1, 2], [-1, 3], [3, 1]]), v = Math.exp(a * b);
      return dec("Bestimme $\\lim_{n \\to \\infty}\\bigl(1 " + (a < 0 ? "-" : "+") + " \\tfrac{" + Math.abs(a) + "}{n}\\bigr)^{" + cx(b, "n") + "}$ (vier Nachkommastellen).", v, 4, "$\\bigl(1 " + (a < 0 ? "-" : "+") + " \\tfrac{" + Math.abs(a) + "}{n}\\bigr)^{n} \\to e^{" + a + "}$, und Potenzieren mit $" + b + "$ ist stetig: $e^{" + a * b + "} \\approx " + G.tex(v, 4) + "$.");
    }),
    KL(tf("Für alle reellen $x$ gilt $e^x \\ge 1 + x$.", true, "$e^x$ ist konvex, und $1 + x$ ist die Tangente bei $0$. Daraus folgt etwa $\\ln y \\le y - 1$.")),
    KL(tf("$\\exp$ ist die einzige differenzierbare Funktion $f: \\mathbb{R} \\to \\mathbb{R}$ mit $f' = f$ und $f(0) = 1$.", true, "Für eine zweite Lösung $g$ ist $(ge^{-x})' = (g' - g)e^{-x} = 0$, also ist $ge^{-x}$ konstant gleich $g(0) = 1$.")),
    EX(tf("$e^\\pi > \\pi^e$.", true, "$\\tfrac{\\ln x}{x}$ hat sein Maximum bei $x = e$. Also $\\tfrac{\\ln\\pi}{\\pi} < \\tfrac1e$, das heißt $e\\ln\\pi < \\pi$ und $\\pi^e < e^\\pi$.")),
    EX(tf("$\\exp(A + B) = \\exp(A)\\exp(B)$ gilt für alle quadratischen Matrizen $A, B$.", false, "Im Cauchy-Produkt braucht man $(A + B)^n = \\sum\\binom nk A^kB^{n-k}$, und das gilt nur für $AB = BA$. Gegenbeispiel: $A = " + mat([[0, 1], [0, 0]]) + "$, $B = " + mat([[0, 0], [1, 0]]) + "$.")),
  ]);

  more("ana-zws", [
    KL((lv, G) => {
      const L = G.pick([1, 2, 4]), d = G.int(2, 5);
      let n = 0;
      while (L / Math.pow(2, n) >= Math.pow(10, -d)) n++;
      return nu("Bisektion auf einem Intervall der Länge $" + L + "$: Nach wie vielen Halbierungen ist das Intervall erstmals kürzer als $10^{-" + d + "}$?", n, "Nach $n$ Schritten ist die Länge $" + L + " \\cdot 2^{-n}$. Gesucht ist das kleinste $n$ mit $2^n > " + L + " \\cdot 10^{" + d + "}$: $n = " + n + "$. Jede Dezimalstelle kostet etwa $3{,}3$ Halbierungen.");
    }),
    EX(tf("Es gibt keine stetige Funktion $f: \\mathbb{R} \\to \\mathbb{R}$, die jeden Wert genau zweimal annimmt.", true, "Ist $f(a) = f(b) = c$ mit $a < b$, so liegt $f$ auf $(a, b)$ etwa ganz über $c$ und hat dort ein Maximum $M$. Wird $M$ in $[a, b]$ zweimal angenommen, so kommen Werte knapp unter $M$ dreimal vor; sonst wird $M$ noch außerhalb angenommen, und Werte knapp unter $M$ kommen links und rechts der Maximalstelle und noch einmal auf dem Weg nach draußen vor. Für »genau dreimal« gibt es dagegen Beispiele.")),
    KL(tf("Ist $f: [a, b] \\to \\mathbb{R}$ stetig, so ist $f([a, b])$ ein abgeschlossenes, beschränktes Intervall.", true, "Satz vom Maximum: $f([a, b]) \\subseteq [m, M]$ mit angenommenen $m$ und $M$; Zwischenwertsatz: Jeder Wert dazwischen wird angenommen.")),
  ]);

  more("ana-ableitung", [
    KL((lv, G) => {
      const [k, a] = G.pick([["xx", 2], ["xx", 3], ["x1x", 2], ["x1x", 1]]);
      const v = k === "xx" ? Math.pow(a, a) * (Math.log(a) + 1) : (Math.pow(a, 1 / a) * (1 - Math.log(a))) / (a * a);
      return dec("Berechne die Ableitung von $" + (k === "xx" ? "x^x" : "x^{1/x}") + "$ an der Stelle $" + a + "$ (vier Nachkommastellen).", v, 4,
        k === "xx" ? "$x^x = e^{x\\ln x}$, also $(x^x)' = x^x(\\ln x + 1)$, bei $" + a + "$: $" + a + "^{" + a + "}(\\ln " + a + " + 1) \\approx " + G.tex(v, 4) + "$."
          : "$x^{1/x} = e^{\\ln x / x}$, also $(x^{1/x})' = x^{1/x} \\cdot \\tfrac{1 - \\ln x}{x^2}$, bei $" + a + "$: $\\approx " + G.tex(v, 4) + "$.");
    }),
    EX(tf("Ist $f$ auf einem Intervall differenzierbar, so hat $f'$ die Zwischenwerteigenschaft, auch wenn $f'$ nicht stetig ist.", true, "Satz von Darboux: Für $f'(a) < c < f'(b)$ hat $f(x) - cx$ auf $[a, b]$ ein Minimum im Inneren, dort ist $f' = c$. Ableitungen können also keine Sprungstellen haben.")),
  ]);

  more("ana-integral", [
    KL((lv, G) => {
      const n = G.pick([4, 5, 8, 10, 20]), v = ((n - 1) * n * (2 * n - 1)) / (6 * n * n * n);
      return dec("Berechne die **Untersumme** von $x^2$ auf $[0, 1]$ bei $" + n + "$ gleichen Teilen (vier Nachkommastellen).", v, 4, "Auf $[\\tfrac{k-1}{n}, \\tfrac kn]$ ist das Minimum $\\bigl(\\tfrac{k-1}{n}\\bigr)^2$: $L = \\tfrac{1}{n^3}\\sum_{k=0}^{n-1}k^2 = \\tfrac{(n - 1)n(2n - 1)}{6n^3} \\approx " + G.tex(v, 4) + "$. Mit wachsendem $n$ geht das gegen $\\tfrac13$.");
    }),
    KL(tf("Ist $f \\ge 0$ stetig auf $[a, b]$ mit $\\int_a^b f = 0$, so ist $f = 0$.", true, "Wäre $f(x_0) > 0$, so wäre $f > \\tfrac{f(x_0)}{2}$ auf einem kleinen Intervall um $x_0$, und das Integral wäre positiv. Ohne Stetigkeit falsch: ein einzelner Punkt mit dem Wert $1$.")),
    EX(tf("Ist $f$ auf $[a, b]$ Riemann-integrierbar, so ist $F(x) = \\int_a^x f$ Lipschitz-stetig.", true, "$f$ ist beschränkt, $|f| \\le M$, also $|F(x) - F(y)| = \\bigl|\\int_y^x f\\bigr| \\le M|x - y|$.")),
  ]);

  more("ana-taylor", [
    KL((lv, G) => {
      const k = G.int(3, 7);
      const K = G.pick([["xe^x", k, "xe^x = \\sum_n \\tfrac{x^{n+1}}{n!}"], ["x^2e^x", k * (k - 1), "x^2e^x = \\sum_n \\tfrac{x^{n+2}}{n!}"], ["e^{2x}", Math.pow(2, k), "e^{2x} = \\sum_n \\tfrac{2^nx^n}{n!}"], ["e^{-x}", k % 2 ? -1 : 1, "e^{-x} = \\sum_n \\tfrac{(-1)^nx^n}{n!}"]]);
      return nu("Bestimme $f^{(" + k + ")}(0)$ für $f(x) = " + K[0] + "$.", K[1], "$" + K[2] + "$, und der Koeffizient von $x^{" + k + "}$ ist $\\tfrac{f^{(" + k + ")}(0)}{" + k + "!}$. Ablesen und mit $" + k + "!$ multiplizieren: $" + K[1] + "$.");
    }),
    EX(tf("Die Taylorreihe von $\\ln(1 + x)$ um $0$ konvergiert bei $x = 1$, und zwar gegen $\\ln 2$.", true, "Konvergenz nach Leibniz. Dass der Wert $\\ln 2$ ist, zeigt das Restglied: $\\ln 2 - \\sum_{k=1}^n\\tfrac{(-1)^{k+1}}{k} = (-1)^n\\int_0^1\\tfrac{t^n}{1 + t}dt$, und das ist höchstens $\\tfrac{1}{n + 1}$.")),
  ]);

  more("ana-glm", [
    KL((lv, G) => {
      const n = G.pick([4, 9, 16, 25, 100]), v = 1 / (2 * Math.sqrt(n));
      return dec("$f_n(x) = \\tfrac{x}{1 + nx^2}$. Bestimme $\\sup_{x \\in \\mathbb{R}}|f_{" + n + "}(x)|$ (vier Nachkommastellen).", v, 4, "$f_n'(x) = \\tfrac{1 - nx^2}{(1 + nx^2)^2} = 0$ bei $x = \\tfrac{1}{\\sqrt n}$, dort ist $f_n = \\tfrac{1}{2\\sqrt n} \\approx " + G.tex(v, 4) + "$. Weil das gegen $0$ geht, konvergiert $f_n \\to 0$ gleichmäßig auf $\\mathbb{R}$.");
    }),
    KL(tf("$f_n(x) = \\tfrac{\\sin(nx)}{n}$ konvergiert gleichmäßig gegen $0$, die Ableitungen $f_n'$ konvergieren aber nicht einmal punktweise.", true, "$|f_n| \\le \\tfrac1n$. Aber $f_n'(x) = \\cos(nx)$ springt etwa bei $x = \\pi$ zwischen $1$ und $-1$.")),
    KL(tf("$\\sum_{n \\ge 1}\\tfrac{\\sin(nx)}{n^2}$ konvergiert gleichmäßig auf $\\mathbb{R}$ gegen eine stetige Funktion.", true, "Weierstraß-Kriterium: $\\bigl|\\tfrac{\\sin(nx)}{n^2}\\bigr| \\le \\tfrac{1}{n^2}$ und $\\sum\\tfrac{1}{n^2} < \\infty$. Gleichmäßige Grenzwerte stetiger Funktionen sind stetig.")),
  ]);

  more("ana-fehler", [
    KL(sp("»Beweis«, dass jede beschränkte Folge konvergiert. Welche Zeile ist falsch?", [
      ["$(a_n)$ ist beschränkt, hat also eine konvergente Teilfolge.", "Richtig: Bolzano-Weierstraß."],
      ["Sei $a$ der Grenzwert dieser Teilfolge.", "Richtig."],
      ["Eine Folge konvergiert gegen den Grenzwert jeder ihrer Teilfolgen.", "Falsch: Das gilt nur, wenn die Folge schon konvergiert. $(-1)^n$ hat Teilfolgen mit den Grenzwerten $1$ und $-1$."],
      ["Also konvergiert $(a_n)$ gegen $a$.", "Folgt nur aus der falschen Zeile davor."]], 2,
      "Richtig ist: Eine beschränkte Folge konvergiert genau dann, wenn sie nur einen Häufungspunkt hat.")),
    KL(sp("Ableitung von $x^x$. Welche Zeile ist falsch?", [
      ["Für einen festen Exponenten $n$ gilt $(x^n)' = nx^{n-1}$.", "Richtig: die Potenzregel."],
      ["Mit $n = x$ folgt $(x^x)' = x \\cdot x^{x-1} = x^x$.", "Falsch: Die Potenzregel setzt einen festen Exponenten voraus, hier hängt er von $x$ ab."],
      ["Also ist $x^x$ eine Lösung von $f' = f$.", "Folgt nur aus der falschen Zeile davor."]], 1,
      "$x^x = e^{x\\ln x}$, also $(x^x)' = x^x(\\ln x + 1)$. Bei $x = 2$ etwa $4(\\ln 2 + 1) \\approx 6{,}77$ statt $4$.")),
    EX(sp("»Beweis«, dass $\\sum\\tfrac1n$ konvergiert. Welche Zeile ist falsch?", [
      ["Die Partialsummen $s_n$ wachsen monoton.", "Richtig."],
      ["$s_{n+1} - s_n = \\tfrac{1}{n + 1} \\to 0$.", "Richtig."],
      ["Also ist $(s_n)$ eine Cauchy-Folge.", "Falsch: Cauchy verlangt $|s_m - s_n| < \\varepsilon$ für **alle** $m > n \\ge N$, nicht nur für aufeinanderfolgende Glieder; dabei ist $s_{2n} - s_n \\ge \\tfrac12$."],
      ["Cauchy-Folgen in $\\mathbb{R}$ konvergieren.", "Richtig, aber hier nicht anwendbar."]], 2,
      "Die harmonische Reihe divergiert: $s_{2n} - s_n = \\sum_{k=n+1}^{2n}\\tfrac1k \\ge n \\cdot \\tfrac{1}{2n} = \\tfrac12$.")),
    KL(sp("»Beweis«, dass $x^2$ auf $\\mathbb{R}$ gleichmäßig stetig ist. Welche Zeile ist falsch?", [
      ["Sei $\\varepsilon > 0$.", "Richtig."],
      ["$|x^2 - y^2| = |x + y|\\,|x - y|$.", "Richtig."],
      ["Wähle $\\delta = \\min\\bigl(1, \\tfrac{\\varepsilon}{2|x| + 1}\\bigr)$.", "Falsch für gleichmäßige Stetigkeit: Dort muss $\\delta$ vor $x$ gewählt werden und darf nicht von der Stelle abhängen."],
      ["Für $|x - y| < \\delta$ ist $|x + y| \\le 2|x| + 1$, also $|x^2 - y^2| < \\varepsilon$.", "Die Rechnung stimmt, beweist aber nur Stetigkeit in jedem Punkt."]], 2,
      "$x^2$ ist auf $\\mathbb{R}$ nicht gleichmäßig stetig: $x = n$ und $y = n + \\tfrac1n$ haben Abstand $\\tfrac1n$, aber $y^2 - x^2 > 2$.")),
    EX(sp("»Beweis«, dass $\\int_1^\\infty\\bigl|\\tfrac{\\sin x}{x}\\bigr|dx$ konvergiert. Welche Zeile ist falsch?", [
      ["$\\bigl|\\tfrac{\\sin x}{x}\\bigr| \\le \\tfrac1x$ für $x \\ge 1$.", "Richtig."],
      ["$\\int_1^\\infty\\tfrac{dx}{x}$ konvergiert.", "Falsch: $\\int_1^R\\tfrac{dx}{x} = \\ln R \\to \\infty$."],
      ["Nach dem Majorantenkriterium konvergiert das Integral.", "Folgt nur aus der falschen Zeile davor."]], 1,
      "Das Integral der Beträge divergiert tatsächlich: Auf $[k\\pi, (k + 1)\\pi]$ ist es mindestens $\\tfrac{2}{(k + 1)\\pi}$. Ohne Beträge konvergiert es.")),
    KL(sp("»Beweis«, dass aus $a_n \\to 0$ ($a_n \\ge 0$) die Konvergenz von $\\sum(-1)^na_n$ folgt. Welche Zeile ist falsch?", [
      ["Die Reihe ist alternierend.", "Richtig, weil alle $a_n \\ge 0$ sind."],
      ["Ihre Glieder gehen gegen $0$.", "Richtig."],
      ["Nach Leibniz konvergiert sie.", "Falsch: Leibniz verlangt zusätzlich, dass $a_n$ monoton fällt."]], 2,
      "Gegenbeispiel: $a_{2k} = \\tfrac1k$, $a_{2k+1} = \\tfrac{1}{k^2}$. Die Paare $a_{2k} - a_{2k+1}$ verhalten sich wie $\\tfrac1k$, die Reihe divergiert.")),
    KL(sp("»Rechnung«: $\\lim_{n \\to \\infty}\\bigl(1 + \\tfrac1n\\bigr)^n$. Welche Zeile ist falsch?", [
      ["$1 + \\tfrac1n \\to 1$.", "Richtig."],
      ["Also $\\bigl(1 + \\tfrac1n\\bigr)^n \\to 1^n = 1$.", "Falsch: Der Exponent wächst mit; die Grenzwertsätze gelten nur für eine feste Anzahl von Faktoren."],
      ["Der Grenzwert ist $1$.", "Folgt nur aus der falschen Zeile davor."]], 1,
      "Der Grenzwert ist $e$. $1^\\infty$ ist eine unbestimmte Form: logarithmieren, $n\\ln(1 + \\tfrac1n) \\to 1$.")),
    EX(sp("»Beweis«, dass $\\mathbb{R}$ abzählbar ist. Welche Zeile ist falsch?", [
      ["Die Zahlen mit endlicher Dezimaldarstellung bilden eine abzählbare Menge $D$.", "Richtig: $D \\subseteq \\mathbb{Q}$."],
      ["Jede reelle Zahl ist Grenzwert einer Folge in $D$.", "Richtig: die abgebrochenen Dezimaldarstellungen."],
      ["Die Grenzwerte von Folgen in einer abzählbaren Menge bilden eine abzählbare Menge.", "Falsch: Es gibt überabzählbar viele Folgen in $D$; ihre Grenzwerte bilden ganz $\\mathbb{R}$."],
      ["Also ist $\\mathbb{R}$ abzählbar.", "Folgt nur aus der falschen Zeile davor."]], 2,
      "Abzählbar und dicht heißt nicht, dass alles abzählbar ist. Cantors Diagonalargument zeigt, dass $\\mathbb{R}$ überabzählbar ist.")),
  ]);

  // ---------------------------------------------------------------- new generators of the deeper Analysis I
  add("ana-limsup", 3, [
    (lv, G) => {
      const c = nz(G, -3, 3), m = Math.abs(c);
      return tf("Für $a_n = (-1)^n " + (c > 0 ? "+" : "-") + " \\tfrac{" + m + "}{n}$ gilt $a_n < 1$ für fast alle $n$.", c < 0,
        c < 0 ? "Gerade Glieder sind $1 - \\tfrac{" + m + "}{n} < 1$, ungerade liegen nahe $-1$: alle unter $1$." : "Die geraden Glieder $1 + \\tfrac{" + m + "}{n}$ liegen alle über $1$. Aus $\\limsup a_n = 1$ folgt nur: Für jedes $c > 1$ liegen fast alle Glieder unter $c$; für $c = 1$ selbst nicht.");
    },
    (lv, G) => {
      const p = nz(G, -3, 3), q = nz(G, -3, 3), top = G.chance(0.5), v = top ? p + Math.abs(q) : p - Math.abs(q);
      return nu("Bestimme $" + (top ? "\\limsup" : "\\liminf") + "$ von $a_n = \\bigl(" + p + " " + pm(q) + "(-1)^n\\bigr)\\tfrac{n}{n + 1}$.", v, "$\\tfrac{n}{n + 1} \\to 1$, und $" + p + " " + pm(q) + "(-1)^n$ springt zwischen $" + (p + q) + "$ und $" + (p - q) + "$. Das sind die Häufungspunkte; " + (top ? "der größere" : "der kleinere") + " ist $" + v + "$.");
    },
  ]);
  more("ana-limsup", [
    KL((lv, G) => {
      const c = G.pick([1, 2, 3]), top = G.chance(0.5), v = Math.exp(top ? c : -c);
      return dec("Bestimme $" + (top ? "\\limsup" : "\\liminf") + "$ von $a_n = \\bigl(1 + \\tfrac{" + c + "(-1)^n}{n}\\bigr)^n$ (vier Nachkommastellen).", v, 4, "Gerade $n$: $\\bigl(1 + \\tfrac{" + c + "}{n}\\bigr)^n \\to e^{" + c + "}$; ungerade: $\\bigl(1 - \\tfrac{" + c + "}{n}\\bigr)^n \\to e^{-" + c + "}$. " + (top ? "Der größere" : "Der kleinere") + " Häufungspunkt ist $" + G.tex(v, 4) + "$.");
    }),
    KL((lv, G) => {
      const [p, q] = G.pick([[2, 5], [4, 3], [5, 2], [3, 7], [6, 4]]), mx = Math.max(p, q);
      return dec("$a_n = " + p + "^n$ für gerade und $" + q + "^n$ für ungerade $n$. Bestimme den Konvergenzradius von $\\sum a_nx^n$ (vier Nachkommastellen).", 1 / mx, 4, "$\\sqrt[n]{a_n}$ springt zwischen $" + p + "$ und $" + q + "$, also $\\limsup = " + mx + "$ und $R = " + G.frac(1, mx) + "$ (Cauchy-Hadamard). Das Quotientenkriterium versagt hier: $\\tfrac{a_{n+1}}{a_n}$ hat keinen Grenzwert.");
    }),
    EX(tf("Für positive beschränkte Folgen gilt $\\limsup(a_nb_n) \\le \\limsup a_n \\cdot \\limsup b_n$.", true, "Für $\\varepsilon > 0$ ist fast immer $a_n < A + \\varepsilon$ und $b_n < B + \\varepsilon$, also $a_nb_n < (A + \\varepsilon)(B + \\varepsilon)$. Gleichheit gilt nicht immer: $a_n = 1, 2, 1, 2, \\dots$ und $b_n = 2, 1, 2, 1, \\dots$")),
    KL(tf("Die Menge der Häufungspunkte einer reellen Folge ist abgeschlossen.", true, "Liegen Häufungspunkte $h_k \\to h$, so enthält jede Umgebung von $h$ eine Umgebung eines $h_k$ und damit unendlich viele Folgenglieder.")),
    KL(tf("Jede beschränkte Folge hat Teilfolgen, die gegen $\\limsup a_n$ und gegen $\\liminf a_n$ konvergieren.", true, "Zu $\\varepsilon = \\tfrac1k$ liegen unendlich viele Glieder über $\\limsup a_n - \\tfrac1k$ und fast alle unter $\\limsup a_n + \\tfrac1k$; daraus wählt man nacheinander die Teilfolge. Der Limes superior ist selbst ein Häufungspunkt, der größte.")),
  ]);

  add("ana-absolut", 1, [
    (lv, G) => {
      const c = G.int(1, 9), abs = G.chance(0.5);
      return tf("$\\sum_{n \\ge 1}(-1)^n\\tfrac{n}{n^2 + " + c + "}$ konvergiert" + (abs ? " **absolut**" : "") + ".", !abs,
        abs ? "$\\tfrac{n}{n^2 + " + c + "} \\ge \\tfrac{1}{" + (1 + c) + "n}$: Minorante harmonische Reihe. Die Reihe konvergiert nur bedingt." : "Leibniz: $\\tfrac{n}{n^2 + " + c + "}$ geht gegen $0$ und fällt ab $n \\ge " + Math.ceil(Math.sqrt(c)) + "$ monoton.");
    },
  ]);
  add("ana-absolut", 2, [
    (lv, G) => {
      const d = G.pick([2, 3, 4, 6]);
      let N = 1;
      while (Math.pow(N + 1, 3) <= Math.pow(10, d)) N++;
      return nu("Wie viele Glieder von $\\sum_{n \\ge 1}\\tfrac{(-1)^{n+1}}{n^3}$ braucht man mindestens, damit die Leibniz-Schranke für den Fehler kleiner als $10^{-" + d + "}$ ist?", N, "Nach $N$ Gliedern ist der Fehler höchstens $\\tfrac{1}{(N + 1)^3}$. Gesucht ist das kleinste $N$ mit $(N + 1)^3 > 10^{" + d + "}$: $N = " + N + "$.");
    },
    (lv, G) => {
      const N = G.int(3, 8);
      let s = 0;
      for (let n = 1; n <= N; n++) s += (n % 2 ? 1 : -1) / n;
      return dec("Berechne die Partialsumme $s_{" + N + "} = \\sum_{n=1}^{" + N + "}\\tfrac{(-1)^{n+1}}{n}$ (vier Nachkommastellen).", s, 4, "Glied für Glied addieren: $s_{" + N + "} \\approx " + G.tex(s, 4) + "$. Der Grenzwert $\\ln 2 \\approx 0{,}6931$ liegt zwischen $s_{" + N + "}$ und $s_{" + (N + 1) + "}$, mit Abstand höchstens $\\tfrac{1}{" + (N + 1) + "}$.");
    },
  ]);
  add("ana-absolut", 3, [
    (lv, G) => {
      const s = G.pick([
        ["Ist $\\sum a_n$ absolut konvergent und $(b_n)$ beschränkt, so konvergiert $\\sum a_nb_n$ absolut.", true, "$|a_nb_n| \\le M|a_n|$: Majorante."],
        ["Ist $\\sum a_n$ konvergent und $(b_n)$ beschränkt, so konvergiert $\\sum a_nb_n$.", false, "$a_n = \\tfrac{(-1)^n}{n}$, $b_n = (-1)^n$: Es entsteht die harmonische Reihe."],
        ["Konvergiert $\\sum a_n^2$, so konvergiert $\\sum\\tfrac{a_n}{n}$ absolut.", true, "$\\bigl|\\tfrac{a_n}{n}\\bigr| \\le \\tfrac12\\bigl(a_n^2 + \\tfrac{1}{n^2}\\bigr)$."],
        ["Konvergiert $\\sum|a_n|$, so konvergiert auch $\\sum a_n^2$.", true, "Fast immer ist $|a_n| \\le 1$, und dann $a_n^2 \\le |a_n|$."],
        ["Bei einer bedingt konvergenten Reihe divergieren die Reihe der positiven und die der negativen Glieder.", true, "Konvergierte eine davon, so wegen $a_n^+ - a_n^- = a_n$ auch die andere, und dann auch $\\sum|a_n|$."],
        ["Für absolut konvergente Reihen gilt $\\bigl|\\sum a_n\\bigr| \\le \\sum|a_n|$.", true, "Dreiecksungleichung für die Partialsummen, dann Grenzübergang."],
        ["Ordnet man eine absolut konvergente Reihe um, kann sich ihr Wert ändern.", false, "Absolut konvergente Reihen sind unbedingt konvergent: Jede Umordnung hat denselben Wert."]]);
      return tf(s[0], s[1], s[2]);
    },
    (lv, G) => {
      const [p, pt] = G.pick([[0.25, "0{,}25"], [0.5, "\\tfrac12"], [1, "1"], [1.5, "\\tfrac32"], [2, "2"], [3, "3"]]), ok = p <= 1;
      return tf("$\\sum_{n \\ge 1}\\tfrac{(-1)^n}{n^{" + pt + "}}$ konvergiert bedingt, aber nicht absolut.", ok, ok ? "Leibniz liefert Konvergenz, und $\\sum\\tfrac{1}{n^{" + pt + "}}$ divergiert für Exponenten $\\le 1$." : "Für Exponenten $> 1$ konvergiert schon $\\sum\\tfrac{1}{n^{" + pt + "}}$: Die Reihe konvergiert absolut.");
    },
  ]);
  more("ana-absolut", [
    EX((lv, G) => {
      const [p, q] = G.pick([[3, 1], [1, 3], [4, 1], [3, 2], [2, 3]]), v = Math.log(2) + 0.5 * Math.log(p / q);
      return dec("Man ordnet $1 - \\tfrac12 + \\tfrac13 - \\tfrac14 + \\dots$ so um, dass immer $" + p + "$ positive auf $" + q + "$ negative Glieder folgen, jeweils in ihrer Reihenfolge. Welchen Wert hat die neue Reihe? (vier Nachkommastellen)", v, 4,
        "Die ersten $m$ positiven Glieder ergeben $\\ln 2 + \\tfrac12\\ln m + \\tfrac\\gamma2 + o(1)$, die ersten $m$ negativen $\\tfrac12\\ln m + \\tfrac\\gamma2 + o(1)$. Nach $n$ Blöcken mit $" + p + "n$ positiven und $" + q + "n$ negativen Gliedern bleibt $\\ln 2 + \\tfrac12\\ln\\tfrac{" + p + "}{" + q + "} \\approx " + G.tex(v, 4) + "$.");
    }),
    KL((lv, G) => {
      const [p, q] = G.pick([[1, 3], [1, 4], [2, 3], [-1, 2], [-1, 3]]), x = p / q, v = 1 / ((1 - x) * (1 - x));
      return dec("Berechne $\\sum_{n \\ge 0}(n + 1)\\bigl(" + G.frac(p, q) + "\\bigr)^n$ über das Cauchy-Produkt (vier Nachkommastellen).", v, 4, "$\\sum(n + 1)x^n = \\bigl(\\sum x^n\\bigr)^2 = \\tfrac{1}{(1 - x)^2}$, erlaubt, weil die geometrische Reihe für $|x| < 1$ absolut konvergiert. Bei $x = " + G.frac(p, q) + "$: $" + G.tex(v, 4) + "$.");
    }),
    KL(tf("Konvergiert $\\sum a_n$, so konvergiert auch $\\sum a_{2n}$.", false, "$a_n = \\tfrac{(-1)^n}{n}$: $\\sum a_{2n} = \\sum\\tfrac{1}{2n}$ divergiert. Für absolut konvergente Reihen stimmt es.")),
    EX(tf("$\\sum_{n \\ge 1}\\tfrac{(-1)^{\\lfloor\\sqrt n\\rfloor}}{n}$ konvergiert.", true, "Gleiche Vorzeichen in Blöcken $k^2 \\le n < (k + 1)^2$. Die Blocksummen sind etwa $\\ln\\tfrac{(k + 1)^2}{k^2} \\approx \\tfrac2k$, fallen und gehen gegen $0$: Leibniz für die Blöcke. Innerhalb eines Blocks ändert sich die Partialsumme höchstens um die Blocksumme.")),
  ]);

  add("ana-glstetig", 1, [
    (lv, G) => {
      const s = G.pick([
        ["$\\cos x$ auf $\\mathbb{R}$", true, "$|\\cos x - \\cos y| \\le |x - y|$ nach dem Mittelwertsatz."],
        ["$x^3$ auf $[-2, 2]$", true, "Stetig auf einem kompakten Intervall (Satz von Heine)."],
        ["$x^3$ auf $\\mathbb{R}$", false, "Die Steigung wächst unbeschränkt: $(n + \\tfrac1n)^3 - n^3 > 3n$."],
        ["$e^x$ auf $(-\\infty, 0]$", true, "Dort ist $0 < (e^x)' \\le 1$: Lipschitz mit Konstante $1$."],
        ["$e^x$ auf $\\mathbb{R}$", false, "Für große $x$ wird die Steigung beliebig groß."],
        ["$\\ln x$ auf $[1, \\infty)$", true, "$(\\ln x)' = \\tfrac1x \\le 1$ dort."],
        ["$\\ln x$ auf $(0, 1]$", false, "Bei $0$ fällt $\\ln$ unbeschränkt; die Punkte $\\tfrac1n$ und $\\tfrac{1}{2n}$ liegen beliebig nah, ihre Bilder immer $\\ln 2$ auseinander."],
        ["$\\tfrac{1}{1 + x^2}$ auf $\\mathbb{R}$", true, "Die Ableitung ist beschränkt, im Betrag höchstens $\\tfrac{3\\sqrt3}{8}$."],
        ["$\\sin\\tfrac1x$ auf $(0, 1]$", false, "Bei $0$ schwingt die Funktion immer schneller zwischen $-1$ und $1$."],
        ["$\\sqrt x$ auf $[0, 1]$", true, "Stetig auf einem kompakten Intervall."]]);
      return tf(s[0] + " ist gleichmäßig stetig.", s[1], s[2]);
    },
  ]);
  add("ana-glstetig", 2, [
    (lv, G) => {
      const a = G.int(1, 4);
      const q = G.pick([
        ["\\sin(" + cx(a) + ")", "\\mathbb{R}", a, "$|f'| = " + a + "|\\cos(" + cx(a) + ")| \\le " + a + "$, mit Gleichheit bei $0$."],
        ["x^3", "[-" + a + ", " + a + "]", 3 * a * a, "$\\sup|f'| = \\sup 3x^2 = " + 3 * a * a + "$ am Rand."],
        ["\\sqrt x", "[" + a + ", \\infty)", 1 / (2 * Math.sqrt(a)), "$f' = \\tfrac{1}{2\\sqrt x}$ ist bei $x = " + a + "$ am größten."],
        ["\\ln x", "[" + a + ", \\infty)", 1 / a, "$f' = \\tfrac1x \\le \\tfrac{1}{" + a + "}$."],
        ["\\arctan(" + cx(a) + ")", "\\mathbb{R}", a, "$f' = \\tfrac{" + a + "}{1 + " + a * a + "x^2} \\le " + a + "$, bei $0$ erreicht."]]);
      return dec("Bestimme die kleinste Lipschitz-Konstante von $f(x) = " + q[0] + "$ auf $" + q[1] + "$ (vier Nachkommastellen).", q[2], 4, q[3] + " Für differenzierbares $f$ auf einem Intervall ist die beste Konstante $\\sup|f'|$.");
    },
  ]);
  more("ana-glstetig", [
    KL((lv, G) => {
      const [e, et] = G.pick([[0.1, "0{,}1"], [0.01, "0{,}01"], [0.05, "0{,}05"], [0.2, "0{,}2"]]);
      return dec("Für $\\sqrt x$ auf $[0, \\infty)$ gilt $|\\sqrt x - \\sqrt y| \\le \\sqrt{|x - y|}$. Welches größte $\\delta$ liefert diese Abschätzung für $\\varepsilon = " + et + "$? (sechs Nachkommastellen)", e * e, 6, "$\\sqrt{|x - y|} < \\varepsilon$ für $|x - y| < \\varepsilon^2$, also $\\delta = \\varepsilon^2 = " + G.tex(e * e, 6) + "$, an jeder Stelle dasselbe: gleichmäßig stetig, aber nicht Lipschitz.");
    }),
    KL((lv, G) => {
      const a = nz(G, -4, 4), b = nz(G, -4, 4), L = Math.hypot(a, b);
      return dec("Bestimme die kleinste Lipschitz-Konstante von $f(x) = " + cx(a, "\\sin x") + " " + (b < 0 ? "- " : "+ ") + cx(Math.abs(b), "\\cos x") + "$ auf $\\mathbb{R}$ (vier Nachkommastellen).", L, 4, "$f'(x) = " + cx(a, "\\cos x") + " " + (b < 0 ? "+ " : "- ") + cx(Math.abs(b), "\\sin x") + "$ ist eine Schwingung mit der Amplitude $\\sqrt{" + a * a + " + " + b * b + "}$ (Cauchy-Schwarz, Gleichheit wird angenommen). Also $L = \\sqrt{" + (a * a + b * b) + "} \\approx " + G.tex(L, 4) + "$.");
    }),
    KL(tf("Jede stetige, periodische Funktion $f: \\mathbb{R} \\to \\mathbb{R}$ ist gleichmäßig stetig.", true, "Auf zwei Perioden $[0, 2p]$ ist $f$ gleichmäßig stetig (Heine); zwei Punkte mit Abstand $< p$ verschiebt man gemeinsam in dieses Intervall.")),
    KL(tf("Die Verkettung zweier gleichmäßig stetiger Funktionen ist gleichmäßig stetig.", true, "Zu $\\varepsilon$ wähle $\\eta$ für die äußere Funktion, dann $\\delta$ für die innere Funktion zu $\\eta$.")),
    KL(tf("Ist $f$ auf $(0, 1)$ differenzierbar mit beschränkter Ableitung, so ist $f$ gleichmäßig stetig.", true, "Mittelwertsatz: $|f(x) - f(y)| \\le \\sup|f'| \\cdot |x - y|$, also Lipschitz.")),
    EX(tf("Es gibt eine stetige Funktion auf $[0, 1]$, die auf keinem Teilintervall Lipschitz-stetig ist.", true, "Etwa die Weierstraß-Funktion $\\sum 2^{-n}\\cos(4^n\\pi x)$: nach Heine gleichmäßig stetig, aber nirgends differenzierbar. Lipschitz-Funktionen sind fast überall differenzierbar, also ist sie auf keinem Intervall Lipschitz.")),
  ]);

  add("ana-umkehr", 2, [
    (lv, G) => {
      const K = G.pick([
        ["x + e^x", "1", "0", 2], ["x + e^x", "1 + e", "1", 1 + Math.E], ["x^5 + x", "-2", "-1", 6], ["x^5 + x", "34", "2", 81],
        ["x + \\ln x", "1", "1", 2], ["x + \\ln x", "e + 1", "e", 1 + 1 / Math.E], ["e^x + x^3", "1", "0", 1]]);
      return dec("$f(x) = " + K[0] + "$ ist streng wachsend. Berechne $(f^{-1})'(" + K[1] + ")$ (vier Nachkommastellen).", 1 / K[3], 4,
        "$f(" + K[2] + ") = " + K[1] + "$, also $(f^{-1})'(" + K[1] + ") = \\tfrac{1}{f'(" + K[2] + ")} = \\tfrac{1}{" + G.tex(K[3], 4) + "} \\approx " + G.tex(1 / K[3], 4) + "$. Die Stelle $" + K[2] + "$ findet man durch Probieren, nicht durch Umkehren.");
    },
  ]);
  add("ana-umkehr", 3, [
    (lv, G) => {
      const s = G.pick([
        ["Die Umkehrfunktion einer stetigen Bijektion $[a, b] \\to [c, d]$ ist stetig.", true, "Eine stetige Bijektion zwischen Intervallen ist streng monoton, und die Umkehrung einer streng monotonen Funktion auf einem Intervall ist stetig."],
        ["Ist $f: \\mathbb{R} \\to \\mathbb{R}$ streng wachsend (nicht unbedingt stetig), so ist $f^{-1}: f(\\mathbb{R}) \\to \\mathbb{R}$ stetig.", true, "$f^{-1}$ ist wachsend, und ihr Bild $\\mathbb{R}$ ist ein Intervall. Eine monotone Funktion, deren Bild ein Intervall ist, hat keine Sprünge."],
        ["Ist $f$ stetig und streng fallend, so ist $f^{-1}$ streng fallend.", true, "Aus $y_1 < y_2$ und $f^{-1}(y_1) \\le f^{-1}(y_2)$ folgte durch Anwenden von $f$ der Widerspruch $y_1 \\ge y_2$."],
        ["Für zweimal differenzierbares $f$ mit $f' \\ne 0$ gilt $(f^{-1})'' = -\\tfrac{f''}{(f')^3}$, ausgewertet an der Stelle $f^{-1}(y)$.", true, "$(f^{-1})' = \\tfrac{1}{f' \\circ f^{-1}}$ ableiten: $-\\tfrac{f''(f^{-1}) \\cdot (f^{-1})'}{(f')^2} = -\\tfrac{f''}{(f')^3}$."],
        ["Die Umkehrfunktion einer konvexen, streng wachsenden Funktion ist konvex.", false, "Sie ist konkav: $e^x$ und $\\ln$."],
        ["$\\arccos'(y) = -\\tfrac{1}{\\sqrt{1 - y^2}}$ für $|y| < 1$.", true, "$\\cos$ fällt auf $[0, \\pi]$, und dort ist $\\cos'(x) = -\\sin x = -\\sqrt{1 - \\cos^2x}$."],
        ["$\\operatorname{arcosh}$ ist auf $[1, \\infty)$ überall differenzierbar.", false, "Bei $y = 1$ ist $\\cosh'(0) = 0$: senkrechte Tangente, nicht differenzierbar. Auf $(1, \\infty)$ schon."]]);
      return tf(s[0], s[1], s[2]);
    },
    (lv, G) => {
      const [c, ct] = G.pick([[0.5, "\\tfrac12"], [1 / 3, "\\tfrac13"]]), atPi = G.chance(0.5), y = atPi ? "\\pi" : "0", v = 1 / (1 + c * (atPi ? -1 : 1));
      return dec("$f(x) = x + " + ct + "\\sin x$ ist streng wachsend. Berechne $(f^{-1})'(" + y + ")$ (vier Nachkommastellen).", v, 4,
        "$f(" + y + ") = " + y + "$ und $f'(x) = 1 + " + ct + "\\cos x$, also $(f^{-1})'(" + y + ") = \\tfrac{1}{1 " + (atPi ? "-" : "+") + " " + ct + "} \\approx " + G.tex(v, 4) + "$. Streng wachsend ist $f$, weil $f' \\ge 1 - " + ct + " > 0$.");
    },
  ]);
  more("ana-umkehr", [
    KL((lv, G) => {
      const x0 = G.pick([1, -1, 2]), f1 = 3 * x0 * x0 + 1, f2 = 6 * x0, y0 = x0 * x0 * x0 + x0, v = -f2 / Math.pow(f1, 3);
      return dec("$f(x) = x^3 + x$. Berechne $(f^{-1})''(" + y0 + ")$ (fünf Nachkommastellen).", v, 5, "$(f^{-1})'' = -\\tfrac{f''}{(f')^3}$ an der Stelle $x_0 = f^{-1}(" + y0 + ") = " + x0 + "$: $-\\tfrac{" + f2 + "}{" + f1 + "^3} \\approx " + G.tex(v, 5) + "$.");
    }),
    KL((lv, G) => {
      const y = G.int(0, 3), v = 1 / Math.sqrt(1 + y * y);
      return dec("$\\sinh x = \\tfrac{e^x - e^{-x}}{2}$ ist bijektiv auf $\\mathbb{R}$. Berechne $\\operatorname{arsinh}'(" + y + ")$ (vier Nachkommastellen).", v, 4, "$\\operatorname{arsinh}'(y) = \\tfrac{1}{\\cosh(\\operatorname{arsinh}y)} = \\tfrac{1}{\\sqrt{1 + y^2}}$ wegen $\\cosh^2 - \\sinh^2 = 1$. Bei $" + y + "$: $" + G.tex(v, 4) + "$.");
    }),
    KL(tf("$\\arcsin(\\sin x) = x$ für alle $x \\in \\mathbb{R}$.", false, "Nur für $x \\in [-\\tfrac\\pi2, \\tfrac\\pi2]$. Etwa $\\arcsin(\\sin\\pi) = 0$.")),
    KL(tf("Jede stetige Bijektion $\\mathbb{R} \\to \\mathbb{R}$ ist streng monoton.", true, "Eine stetige, injektive Funktion auf einem Intervall ist streng monoton; sonst würde nach dem Zwischenwertsatz ein Wert zweimal angenommen.")),
    EX(tf("Es gibt eine stetige Bijektion von $[0, 1)$ auf den Einheitskreis, deren Umkehrung nicht stetig ist.", true, "$t \\mapsto (\\cos 2\\pi t, \\sin 2\\pi t)$. Punkte knapp unter $(1, 0)$ kommen von $t$ nahe $1$, der Punkt selbst von $t = 0$. Mit einem Intervall in $\\mathbb{R}$ als Ziel kann das nicht passieren.")),
  ]);

  add("ana-hospital", 2, [
    (lv, G) => {
      const a = nz(G, -4, 4), b = G.int(1, 5), m = Math.abs(a);
      const K = G.pick([
        ["\\dfrac{e^{" + cx(a) + "} - 1}{" + cx(b) + "}", a / b, "$e^u - 1 \\approx u$ für kleine $u$, oder L'Hospital: $\\tfrac{" + a + "\\,e^{" + cx(a) + "}}{" + b + "} \\to " + G.frac(a, b) + "$."],
        ["\\dfrac{1 - \\cos(" + cx(a) + ")}{x^2}", (a * a) / 2, "$1 - \\cos u \\approx \\tfrac{u^2}{2}$ mit $u = " + cx(a) + "$: Grenzwert $" + G.frac(a * a, 2) + "$."],
        ["\\dfrac{\\ln(1 + " + cx(m) + ")}{" + cx(b) + "}", m / b, "$\\ln(1 + u) \\approx u$ für kleine $u$: Grenzwert $" + G.frac(m, b) + "$."],
        ["\\dfrac{\\sin(" + cx(a) + ") " + (a < 0 ? "+ " : "- ") + cx(m) + "}{x^3}", (-a * a * a) / 6, "$\\sin u = u - \\tfrac{u^3}{6} + \\dots$ mit $u = " + cx(a) + "$: Grenzwert $" + G.frac(-a * a * a, 6) + "$."]]);
      return dec("Bestimme $\\lim_{x \\to 0}" + K[0] + "$ (vier Nachkommastellen).", K[1], 4, K[2]);
    },
  ]);
  add("ana-hospital", 3, [
    (lv, G) => {
      const c = nz(G, -2, 2), b = G.int(1, 2), [a, at] = G.pick([[2, "2"], [3, "3"], [5, "5"], [0.5, "\\bigl(\\tfrac12\\bigr)"]]), sg = c < 0 ? "- " : "+ ", m = Math.abs(c);
      const K = G.pick([
        ["\\lim_{x \\to 0}(1 " + sg + cx(m) + ")^{1/x}", Math.exp(c), "Logarithmieren: $\\tfrac{\\ln(1 " + sg + cx(m) + ")}{x} \\to " + c + "$, also Grenzwert $e^{" + c + "}$."],
        ["\\lim_{x \\to \\infty}x\\bigl(" + at + "^{1/x} - 1\\bigr)", Math.log(a), "Mit $t = \\tfrac1x$: $\\tfrac{" + at + "^t - 1}{t} \\to \\ln " + at + "$, die Ableitung von $" + at + "^t$ bei $0$."],
        ["\\lim_{x \\to \\infty}\\bigl(1 " + sg + "\\tfrac{" + m + "}{x}\\bigr)^{" + cx(b) + "}", Math.exp(b * c), "$" + cx(b) + "\\ln\\bigl(1 " + sg + "\\tfrac{" + m + "}{x}\\bigr) \\to " + b * c + "$, also Grenzwert $e^{" + b * c + "}$."]]);
      return dec("Bestimme $" + K[0] + "$ (vier Nachkommastellen).", K[1], 4, K[2] + " Formen wie $1^\\infty$ oder $\\infty \\cdot 0$ erst umformen, dann L'Hospital oder Reihen.");
    },
  ]);
  more("ana-hospital", [
    KL((lv, G) => {
      const [a, b] = G.pickN([2, 3, 5, 7], 2), v = Math.log(a / b);
      return dec("Bestimme $\\lim_{x \\to 0}\\tfrac{" + a + "^x - " + b + "^x}{x}$ (vier Nachkommastellen).", v, 4, "L'Hospital: $" + a + "^x\\ln " + a + " - " + b + "^x\\ln " + b + " \\to \\ln " + a + " - \\ln " + b + " = \\ln\\tfrac{" + a + "}{" + b + "} \\approx " + G.tex(v, 4) + "$.");
    }),
    KL(dec("Bestimme $\\lim_{x \\to 0}\\bigl(\\tfrac1x - \\tfrac{1}{e^x - 1}\\bigr)$ (vier Nachkommastellen).", 0.5, 4, "Auf einen Bruch bringen: $\\tfrac{e^x - 1 - x}{x(e^x - 1)}$. Der Zähler ist etwa $\\tfrac{x^2}{2}$, der Nenner etwa $x^2$: Grenzwert $\\tfrac12$.")),
    EX(dec("Bestimme $\\lim_{x \\to 0}\\bigl(\\tfrac{1}{\\sin^2x} - \\tfrac{1}{x^2}\\bigr)$ (vier Nachkommastellen).", 1 / 3, 4, "$\\sin^2x = x^2 - \\tfrac{x^4}{3} + \\dots$, also $\\tfrac{1}{\\sin^2x} = \\tfrac{1}{x^2}\\bigl(1 + \\tfrac{x^2}{3} + \\dots\\bigr)$. Die Differenz geht gegen $\\tfrac13$. Mit L'Hospital braucht man vier Schritte.")),
    EX(dec("Bestimme $\\lim_{x \\to \\infty}\\bigl(x - x^2\\ln(1 + \\tfrac1x)\\bigr)$ (vier Nachkommastellen).", 0.5, 4, "$\\ln(1 + t) = t - \\tfrac{t^2}{2} + \\tfrac{t^3}{3} - \\dots$ mit $t = \\tfrac1x$: $x^2\\ln(1 + \\tfrac1x) = x - \\tfrac12 + \\tfrac{1}{3x} - \\dots$, also Grenzwert $\\tfrac12$.")),
    KL(tf("Ist $f$ in $a$ zweimal differenzierbar, so gilt $\\lim_{h \\to 0}\\tfrac{f(a + h) - 2f(a) + f(a - h)}{h^2} = f''(a)$.", true, "Einmal L'Hospital nach $h$: $\\tfrac{f'(a + h) - f'(a - h)}{2h}$, und das geht nach der Definition der Ableitung von $f'$ gegen $f''(a)$. Ein zweites L'Hospital wäre nicht erlaubt, weil $f''$ nicht stetig sein muss.")),
  ]);

  add("ana-konvex", 1, [
    (lv, G) => {
      const s = G.pick([
        ["$x^4$ auf $\\mathbb{R}$", "konvex", "$f'' = 12x^2 \\ge 0$."], ["$-x^2$ auf $\\mathbb{R}$", "konkav", "$f'' = -2 < 0$."], ["$e^{-x}$ auf $\\mathbb{R}$", "konvex", "$f'' = e^{-x} > 0$."],
        ["$x\\ln x$ auf $(0, \\infty)$", "konvex", "$f'' = \\tfrac1x > 0$."], ["$\\arctan x$ auf $\\mathbb{R}$", "weder noch", "$f'' = -\\tfrac{2x}{(1 + x^2)^2}$ wechselt bei $0$ das Vorzeichen."],
        ["$\\cos x$ auf $[-\\tfrac\\pi2, \\tfrac\\pi2]$", "konkav", "$f'' = -\\cos x \\le 0$ dort."], ["$x^{3/2}$ auf $[0, \\infty)$", "konvex", "$f'' = \\tfrac34x^{-1/2} > 0$ für $x > 0$."],
        ["$\\tfrac{1}{1 + x^2}$ auf $\\mathbb{R}$", "weder noch", "Konkav um $0$, konvex für $|x| > \\tfrac{1}{\\sqrt3}$."]]);
      return { type: "choice", md: s[0] + " ist", options: ["konvex", "konkav", "weder noch"].map((c) => ({ md: c, correct: c === s[1], why: c === s[1] ? null : s[2] })), shuffle: false, explain: s[2] };
    },
  ]);
  add("ana-konvex", 2, [
    (lv, G) => {
      if (G.chance(0.5)) {
        const c = G.pick([1, 2, 3, 4, 9]);
        return dec("Wo hat $f(x) = x^4 - " + 6 * c + "x^2$ ihren Wendepunkt mit $x > 0$? (vier Nachkommastellen)", Math.sqrt(c), 4, "$f''(x) = 12x^2 - " + 12 * c + "$ wechselt bei $x = \\sqrt{" + c + "}$ das Vorzeichen.");
      }
      const k = G.pick([1, 2, -1, -2, 3]);
      return dec("Wo hat $f(x) = xe^{" + cx(k) + "}$ ihren Wendepunkt? (vier Nachkommastellen)", -2 / k, 4, "$f''(x) = (" + cx(k * k) + " " + pm(2 * k) + ")e^{" + cx(k) + "}$ wechselt bei $x = " + G.frac(-2, k) + "$ das Vorzeichen.");
    },
  ]);
  add("ana-konvex", 3, [
    (lv, G) => {
      const k = G.int(1, 5);
      if (G.chance(0.5)) return nu("Welchen größten Wert hat $x^2y$ für $x, y \\ge 0$ mit $x + y = " + 3 * k + "$?", 4 * k * k * k, "AM-GM mit den drei Zahlen $\\tfrac x2, \\tfrac x2, y$: $\\tfrac{x^2y}{4} \\le \\bigl(\\tfrac{x + y}{3}\\bigr)^3 = " + k * k * k + "$, Gleichheit bei $\\tfrac x2 = y = " + k + "$. Also $" + 4 * k * k * k + "$.");
      return nu("Welchen kleinsten Wert hat $x^2 + y^2 + z^2$ mit $x + y + z = " + 3 * k + "$?", 3 * k * k, "Jensen für das konvexe $t^2$: $\\tfrac{x^2 + y^2 + z^2}{3} \\ge \\bigl(\\tfrac{x + y + z}{3}\\bigr)^2 = " + k * k + "$, Gleichheit bei $x = y = z = " + k + "$. Also $" + 3 * k * k + "$.");
    },
  ]);
  more("ana-konvex", [
    KL((lv, G) => {
      const [a, b] = G.pick([[1, 4], [1, 9], [4, 9], [1, 2], [2, 8], [1, 1]]), v = Math.pow(Math.sqrt(a) + Math.sqrt(b), 2);
      return dec("Welchen kleinsten Wert hat $\\tfrac{" + a + "}{x} + \\tfrac{" + b + "}{y}$ für $x, y > 0$ mit $x + y = 1$? (vier Nachkommastellen)", v, 4, "Cauchy-Schwarz: $\\bigl(\\tfrac{" + a + "}{x} + \\tfrac{" + b + "}{y}\\bigr)(x + y) \\ge (\\sqrt{" + a + "} + \\sqrt{" + b + "})^2$, Gleichheit bei $x : y = \\sqrt{" + a + "} : \\sqrt{" + b + "}$. Minimum $(\\sqrt{" + a + "} + \\sqrt{" + b + "})^2 \\approx " + G.tex(v, 4) + "$.");
    }),
    KL((lv, G) => {
      const [at, ok] = G.pick([["-1", true], ["\\tfrac12", false], ["\\tfrac32", true], ["3", true], ["0{,}3", false], ["-\\tfrac12", true], ["2", true]]);
      return tf("$x^{" + at + "}$ ist auf $(0, \\infty)$ konvex.", ok, "$f'' = \\alpha(\\alpha - 1)x^{\\alpha - 2}$ mit $\\alpha = " + at + "$: " + (ok ? "$\\alpha(\\alpha - 1) \\ge 0$, also konvex." : "$\\alpha(\\alpha - 1) < 0$, also konkav.") + " Konvex genau für $\\alpha \\le 0$ oder $\\alpha \\ge 1$.");
    }),
    KL(tf("Ist $f$ konvex und $g$ konvex und wachsend, so ist $g \\circ f$ konvex.", true, "$g(f(\\lambda x + (1 - \\lambda)y)) \\le g(\\lambda f(x) + (1 - \\lambda)f(y)) \\le \\lambda g(f(x)) + (1 - \\lambda)g(f(y))$: erst die Monotonie von $g$, dann seine Konvexität. So ist $e^{f}$ für konvexes $f$ konvex.")),
    KL(tf("Das Maximum zweier konvexer Funktionen ist konvex, das Minimum im Allgemeinen nicht.", true, "Der Epigraph des Maximums ist der Schnitt der Epigraphen, also konvex. $\\min(x^2, (x - 2)^2)$ hat dagegen bei $1$ eine Spitze nach oben.")),
    EX(tf("Für $p, q > 1$ mit $\\tfrac1p + \\tfrac1q = 1$ und $a, b \\ge 0$ gilt $ab \\le \\tfrac{a^p}{p} + \\tfrac{b^q}{q}$.", true, "Youngsche Ungleichung, aus der Konkavität von $\\ln$: $\\ln\\bigl(\\tfrac1pa^p + \\tfrac1qb^q\\bigr) \\ge \\tfrac1p\\ln a^p + \\tfrac1q\\ln b^q = \\ln(ab)$. Daraus folgt die Höldersche Ungleichung.")),
  ]);

  add("ana-uneigentlich", 1, [
    (lv, G) => {
      if (G.chance(0.5)) {
        const [a, at] = G.pick([[2, "2"], [3, "3"], [4, "4"], [0.5, "\\tfrac12"], [5, "5"]]);
        return dec("Berechne $\\int_0^\\infty e^{-" + at + "x}\\,dx$ (vier Nachkommastellen).", 1 / a, 4, "$\\bigl[-\\tfrac{1}{" + at + "}e^{-" + at + "x}\\bigr]_0^\\infty = \\tfrac{1}{" + at + "}$, weil $e^{-" + at + "R} \\to 0$.");
      }
      const a = G.int(1, 6);
      return dec("Berechne $\\int_0^\\infty\\tfrac{dx}{(x + " + a + ")^2}$ (vier Nachkommastellen).", 1 / a, 4, "$\\bigl[-\\tfrac{1}{x + " + a + "}\\bigr]_0^\\infty = \\tfrac{1}{" + a + "}$.");
    },
  ]);
  add("ana-uneigentlich", 2, [
    (lv, G) => {
      const K = G.pick(["ln", "wurzel", "p"]);
      if (K === "ln") return nu("Berechne $\\int_0^1\\ln x\\,dx$.", -1, "$\\int\\ln x\\,dx = x\\ln x - x$, und $x\\ln x \\to 0$ für $x \\to 0^+$: $(0 - 1) - 0 = -1$.");
      if (K === "wurzel") {
        const a = G.pick([1, 4, 9, 2, 3]);
        return dec("Berechne $\\int_0^{" + a + "}\\tfrac{dx}{\\sqrt{" + a + " - x}}$ (vier Nachkommastellen).", 2 * Math.sqrt(a), 4, "Polstelle bei $x = " + a + "$: $\\bigl[-2\\sqrt{" + a + " - x}\\bigr]_0^{" + a + "} = 2\\sqrt{" + a + "}$.");
      }
      const [p, pt] = G.pick([[1 / 3, "\\tfrac13"], [2 / 3, "\\tfrac23"], [0.1, "0{,}1"], [0.9, "0{,}9"]]);
      return dec("Berechne $\\int_0^1 x^{-" + pt + "}\\,dx$ (vier Nachkommastellen).", 1 / (1 - p), 4, "$\\bigl[\\tfrac{x^{1 - p}}{1 - p}\\bigr]_0^1 = \\tfrac{1}{1 - p}$ für $p < 1$; je näher $p$ an $1$ liegt, desto größer.");
    },
  ]);
  more("ana-uneigentlich", [
    KL((lv, G) => {
      const n = G.int(1, 3), a = G.int(1, 3), v = fact(n) / Math.pow(a, n + 1);
      return dec("Berechne $\\int_0^\\infty x^{" + n + "}e^{-" + cx(a) + "}\\,dx$ (vier Nachkommastellen).", v, 4, "Substitution $u = " + cx(a) + "$ und $\\int_0^\\infty u^ne^{-u}du = n!$: $\\tfrac{" + n + "!}{" + a + "^{" + (n + 1) + "}} \\approx " + G.tex(v, 4) + "$.");
    }),
    KL((lv, G) => {
      const [a, at, sq] = G.pick([[1, "1", "1"], [2, "2", "4"], [3, "3", "9"], [0.5, "\\tfrac12", "\\tfrac14"]]), v = Math.PI / (2 * a);
      return dec("Berechne $\\int_0^\\infty\\tfrac{dx}{x^2 + " + sq + "}$ (vier Nachkommastellen).", v, 4, "$\\int\\tfrac{dx}{x^2 + a^2} = \\tfrac1a\\arctan\\tfrac xa$, von $0$ bis $\\infty$: $\\tfrac{\\pi}{2a}$ mit $a = " + at + "$, also $" + G.tex(v, 4) + "$.");
    }),
    KL(tf("$\\int_2^\\infty\\tfrac{dx}{x(\\ln x)^p}$ konvergiert genau für $p > 1$.", true, "Substitution $u = \\ln x$: $\\int_{\\ln 2}^\\infty\\tfrac{du}{u^p}$. Dasselbe Ergebnis wie für die Reihe $\\sum\\tfrac{1}{n(\\ln n)^p}$ (Integralkriterium).")),
    EX(tf("$\\int_0^\\infty\\sin(x^2)\\,dx$ konvergiert, obwohl $\\sin(x^2)$ für $x \\to \\infty$ nicht gegen $0$ geht.", true, "Mit $u = x^2$ wird es zu $\\int\\tfrac{\\sin u}{2\\sqrt u}du$, und das konvergiert wie $\\int\\tfrac{\\sin u}{u}du$ (partielle Integration). Die Schwingungen werden so schnell, dass sich die Flächen fast aufheben.")),
    KL(tf("$\\int_0^1\\tfrac{\\sin x}{x^{3/2}}\\,dx$ konvergiert.", true, "Bei $0$ ist $\\tfrac{\\sin x}{x^{3/2}} \\approx x^{-1/2}$, und $\\int_0^1x^{-1/2}dx = 2$. Vergleich mit $0 \\le \\sin x \\le x$.")),
  ]);

  add("ana-potenzreihen", 1, [
    (lv, G) => {
      if (G.chance(0.5)) {
        const k = G.int(1, 4), up = G.chance(0.5);
        return nu("Bestimme den Konvergenzradius von $\\sum_{n \\ge 1}" + (up ? "n^{" + k + "}x^n" : "\\tfrac{x^n}{n^{" + k + "}}") + "$.", 1, "$\\sqrt[n]{n^{" + k + "}} \\to 1$: Polynomielle Faktoren ändern den Radius nicht, also $R = 1$.");
      }
      const a = nz(G, -3, 3), b = G.int(2, 5);
      return nu("Bestimme den Konvergenzradius von $\\sum_{n \\ge 0}\\tfrac{(x " + pm(-a) + ")^n}{" + b + "^n}$.", b, "Geometrische Reihe in $\\tfrac{x " + pm(-a) + "}{" + b + "}$: konvergent für $|x " + pm(-a) + "| < " + b + "$. Der Entwicklungspunkt $" + a + "$ verschiebt nur, $R = " + b + "$.");
    },
  ]);

  more("ana-monoton", [
    KL((lv, G) => {
      const c = G.pick([2, 3, 6, 12]), L = (1 + Math.sqrt(1 + 4 * c)) / 2;
      return dec("$a_1 = 1$, $a_{n+1} = 1 + \\tfrac{" + c + "}{a_n}$. Bestimme $\\lim a_n$ (vier Nachkommastellen).", L, 4,
        "Die Folge ist nicht monoton, sie springt um den Grenzwert, weil $x \\mapsto 1 + \\tfrac{" + c + "}{x}$ fällt. Die geraden und die ungeraden Glieder sind aber monoton und haben denselben Grenzwert, denn nahe $L$ zieht die Abbildung zusammen ($\\tfrac{" + c + "}{L^2} < 1$). Aus $L = 1 + \\tfrac{" + c + "}{L}$ folgt $L^2 - L - " + c + " = 0$ und $L = \\tfrac{1 + \\sqrt{" + (1 + 4 * c) + "}}{2} \\approx " + G.tex(L, 4) + "$.");
    }),
  ]);
  add("ana-uneigentlich", 2, [
    (lv, G) => {
      const K = G.pick([
        ["\\int_0^1\\tfrac{dx}{\\sqrt{1 - x^2}}", Math.PI / 2, "$[\\arcsin x]_0^1 = \\tfrac\\pi2$: Die Polstelle bei $x = 1$ ist integrierbar, weil sich $1 - x^2 \\approx 2(1 - x)$ wie eine Wurzelpolstelle verhält."],
        ["\\int_0^1 x\\ln x\\,dx", -0.25, "Partiell: $\\bigl[\\tfrac{x^2}{2}\\ln x - \\tfrac{x^2}{4}\\bigr]_0^1 = -\\tfrac14$, weil $x^2\\ln x \\to 0$ für $x \\to 0^+$."],
        ["\\int_0^1\\tfrac{\\ln x}{\\sqrt x}\\,dx", -4, "Partiell: $\\bigl[2\\sqrt x\\ln x - 4\\sqrt x\\bigr]_0^1 = -4$, weil $\\sqrt x\\ln x \\to 0$ für $x \\to 0^+$."],
        ["\\int_0^4\\tfrac{dx}{\\sqrt x}", 4, "$[2\\sqrt x]_0^4 = 4$: eine Polstelle mit dem Exponenten $\\tfrac12 < 1$."]]);
      return dec("Berechne $" + K[0] + "$ (vier Nachkommastellen).", K[1], 4, K[2]);
    },
  ]);
  add("ana-uneigentlich", 3, [
    (lv, G) => {
      const [p, pt] = G.pick([[0.5, "0{,}5"], [1, "1"], [1.5, "1{,}5"], [2, "2"], [0.25, "0{,}25"]]), whole = G.chance(0.5);
      return tf("$\\int_0^{" + (whole ? "\\infty" : "1") + "}\\tfrac{dx}{x^{" + pt + "}}$ konvergiert.", whole ? false : p < 1,
        whole ? "Nie: Bei $0$ braucht man $p < 1$, bei $\\infty$ dagegen $p > 1$. Beide Enden zusammen gehen für kein $p$." : "Bei der Polstelle $0$ konvergiert $\\int_0^1 x^{-p}dx$ genau für $p < 1$, umgekehrt wie bei $\\int_1^\\infty$.");
    },
  ]);
})();
