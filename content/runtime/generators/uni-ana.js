/* Analysis I in depth: for every generator of the course, level 3 gains the old level-4 tasks and statements that test
 * understanding, level 4 (Experte) mixes the hardest exam tasks ("Klausur") with tasks beyond (label "Extrem").
 * New generators for the new lessons: limsup, absolute convergence, uniform continuity, inverse functions,
 * L'Hospital, convexity, improper integrals. Helpers come from uni-la1.js (LW.uni). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const U = LW.uni;
  const { gcd, range, nz, par, pm, blank, tf, ch, mu, nu, sp, KL, EX, VS, pool, demote, expert, byLevels } = U;
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const binom = (n, k) => { if (k < 0 || k > n) return 0; let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
  const dec = (md, x, d, explain, o) => nu(md, x, explain, Object.assign({ tolerance: 0.6 * Math.pow(10, -d), placeholder: "Dezimalzahl" }, o || {}));
  const has = (name) => !!LW.generators[name];
  /** Deepen an existing generator: old level 4 to level 3, statements to level 3, new level 4. */
  function deepen(name, l3, l4) {
    if (!has(name)) return;
    demote(name);
    if (l3 && l3.length) LW.extend(name, { 3: l3 });
    expert(name, l4);
  }

  // ================================================================ logic, sets, maps
  deepen("ana-logik", [], [
    KL(ch("Was ist die Verneinung von »$f$ ist stetig in $a$«, also von $\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x: |x - a| < \\delta \\Rightarrow |f(x) - f(a)| < \\varepsilon$?",
      "$\\exists \\varepsilon > 0\\ \\forall \\delta > 0\\ \\exists x: |x - a| < \\delta \\land |f(x) - f(a)| \\ge \\varepsilon$",
      [["$\\exists \\varepsilon > 0\\ \\forall \\delta > 0\\ \\exists x: |x - a| \\ge \\delta \\land |f(x) - f(a)| \\ge \\varepsilon$", "Die Voraussetzung $|x - a| < \\delta$ bleibt stehen; verneint wird nur die Folgerung: $\\lnot(P \\Rightarrow Q) \\equiv P \\land \\lnot Q$."],
        ["$\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x: |x - a| < \\delta \\Rightarrow |f(x) - f(a)| \\ge \\varepsilon$", "Die Quantoren müssen alle getauscht werden."],
        ["$\\exists \\varepsilon > 0\\ \\exists \\delta > 0\\ \\exists x: |f(x) - f(a)| \\ge \\varepsilon$", "Aus »für alle $\\delta$« wird nicht »es gibt $\\delta$«; außerdem fehlt die Nähe zu $a$."]],
      "Man liest es so: Es gibt eine Fehlerschranke, die man durch keine noch so kleine Umgebung einhalten kann. Mit diesem Muster beweist man Unstetigkeit.")),
    KL(tf("$(\\forall x\\ \\exists y: x < y) \\Rightarrow (\\exists y\\ \\forall x: x < y)$ ist für reelle Zahlen wahr.", false, "Links: Zu jeder Zahl gibt es eine größere (wahr). Rechts: Es gibt eine Zahl, die größer als alle ist (falsch). Die Reihenfolge der Quantoren entscheidet; nur $\\exists\\forall \\Rightarrow \\forall\\exists$ gilt immer.")),
    KL(tf("$A \\Rightarrow (B \\Rightarrow C)$ ist äquivalent zu $(A \\land B) \\Rightarrow C$.", true, "Beide sind nur falsch, wenn $A$ und $B$ wahr sind und $C$ falsch ist. So formt man Voraussetzungen in Beweisen um.")),
    KL(ch("Welche Aussage drückt aus, dass $f: \\mathbb{R} \\to \\mathbb{R}$ **nicht** beschränkt ist?", "$\\forall M \\in \\mathbb{R}\\ \\exists x: |f(x)| > M$",
      [["$\\exists M\\ \\forall x: |f(x)| > M$", "Das hieße: $|f|$ ist überall größer als ein festes $M$, etwa $f = 5$ mit $M = 1$."], ["$\\forall x\\ \\exists M: |f(x)| > M$", "Das gilt für jede Funktion ($M = |f(x)| - 1$)."], ["$\\exists x\\ \\forall M: |f(x)| > M$", "Kein einzelner Funktionswert ist größer als alle Zahlen."]],
      "Beschränkt: $\\exists M\\ \\forall x: |f(x)| \\le M$. Verneinung: $\\forall M\\ \\exists x: |f(x)| > M$.")),
    EX(tf("$(A \\Rightarrow B) \\lor (B \\Rightarrow A)$ ist eine Tautologie.", true, "Ist $B$ wahr, stimmt $A \\Rightarrow B$; ist $B$ falsch, stimmt $B \\Rightarrow A$. Überraschend, aber formal korrekt: Die materiale Implikation ist kein »weil«.")),
    EX(nu("Wie viele verschiedene Wahrheitstafeln gibt es für Aussagen in drei Variablen?", 256, "Eine Tafel hat $2^3 = 8$ Zeilen, jede Zeile ist wahr oder falsch: $2^8 = 256$. Jede davon lässt sich mit $\\lnot$, $\\land$, $\\lor$ ausdrücken (disjunktive Normalform).")),
    EX(tf("Mit $\\land$ und $\\lor$ allein (ohne $\\lnot$) lässt sich jede Aussagenverknüpfung ausdrücken.", false, "Ohne Verneinung entstehen nur monotone Verknüpfungen: Macht man eine Variable wahr, kann das Ergebnis nicht falsch werden. $\\lnot A$ ist nicht monoton. Mit $\\lnot$ und $\\land$ geht dagegen alles.")),
    EX(tf("$\\forall x\\ (P(x) \\lor Q(x))$ ist äquivalent zu $(\\forall x\\ P(x)) \\lor (\\forall x\\ Q(x))$.", false, "Jede ganze Zahl ist gerade oder ungerade, aber weder sind alle gerade noch alle ungerade. $\\forall$ verträgt sich mit $\\land$, nicht mit $\\lor$; $\\exists$ umgekehrt.")),
  ]);

  deepen("ana-mengen", [], [
    KL(tf("$A \\setminus (B \\cup C) = (A \\setminus B) \\cap (A \\setminus C)$", true, "Nicht in $B \\cup C$ heißt nicht in $B$ und nicht in $C$: De Morgan für Differenzen.")),
    KL(tf("$(A \\cup B) \\setminus B = A$", false, "Es bleibt $A \\setminus B$. Gleich $A$ nur, wenn $A \\cap B = \\emptyset$.")),
    KL((lv, G) => { const n = G.int(1, 3); return nu("$|A| = " + n + "$. Wie viele Elemente hat $\\mathcal{P}(\\mathcal{P}(A))$?", Math.pow(2, Math.pow(2, n)), "$|\\mathcal{P}(A)| = 2^{" + n + "} = " + Math.pow(2, n) + "$, und davon wieder die Potenzmenge: $2^{" + Math.pow(2, n) + "} = " + Math.pow(2, Math.pow(2, n)) + "$."); }),
    KL(tf("$A \\cap B = A \\cup B$ gilt genau dann, wenn $A = B$.", true, "$A \\subseteq A \\cup B = A \\cap B \\subseteq B$, ebenso $B \\subseteq A$.")),
    EX(tf("Es gibt eine Menge, die alle Mengen als Elemente enthält.", false, "Russell: Mit ihr gäbe es $R = \\{x : x \\notin x\\}$, und $R \\in R \\iff R \\notin R$. Deshalb bildet man Mengen nur als Teilmengen bereits vorhandener.")),
    EX(nu("Wie viele Äquivalenzrelationen gibt es auf einer Menge mit $4$ Elementen?", 15, "Äquivalenzrelationen entsprechen Partitionen. Partitionen von $4$ Elementen: $1$ (alles zusammen) $+ 7$ (zwei Blöcke) $+ 6$ (drei Blöcke) $+ 1$ (vier Blöcke) $= 15$, die Bell-Zahl $B_4$.")),
    EX(nu("Wie viele Relationen gibt es auf einer Menge mit $3$ Elementen?", 512, "Eine Relation ist eine Teilmenge von $M \\times M$, und $|M \\times M| = 9$: $2^9 = 512$.")),
    EX(tf("Ist $R$ symmetrisch und transitiv und hat jedes Element einen Partner ($\\forall x\\ \\exists y: xRy$), so ist $R$ reflexiv.", true, "$xRy$ und (Symmetrie) $yRx$ liefern mit Transitivität $xRx$. Ohne die Partner-Bedingung falsch: Die leere Relation ist symmetrisch und transitiv.")),
  ]);

  deepen("ana-abb", [], [
    KL(tf("Ist $g \\circ f$ injektiv, so ist $f$ injektiv.", true, "Aus $f(x) = f(y)$ folgt $g(f(x)) = g(f(y))$, also $x = y$.")),
    KL(tf("Ist $g \\circ f$ injektiv, so ist $g$ injektiv.", false, "$f: \\{1\\} \\to \\{1, 2\\}$, $g: \\{1, 2\\} \\to \\{1\\}$: $g \\circ f$ ist injektiv, $g$ nicht. $g$ muss nur auf dem Bild von $f$ injektiv sein.")),
    KL(tf("Für jede Abbildung gilt $f(A \\cap B) = f(A) \\cap f(B)$.", false, "Nur $\\subseteq$. Mit $f(x) = x^2$, $A = \\{-1\\}$, $B = \\{1\\}$: links $\\emptyset$, rechts $\\{1\\}$. Gleichheit für alle $A, B$ genau dann, wenn $f$ injektiv ist.")),
    KL((lv, G) => { const k = G.int(2, 4), m = G.int(k, 6); return nu("Wie viele **injektive** Abbildungen $\\{1, \\dots, " + k + "\\} \\to \\{1, \\dots, " + m + "\\}$ gibt es?", fact(m) / fact(m - k), "Für das Bild von $1$ gibt es $" + m + "$ Möglichkeiten, für $2$ noch $" + (m - 1) + "$ und so weiter: $" + range(m - k + 1, m).reverse().join(" \\cdot ") + " = " + fact(m) / fact(m - k) + "$."); }),
    EX(tf("Für Urbilder gilt immer $f^{-1}(A \\cap B) = f^{-1}(A) \\cap f^{-1}(B)$ und $f^{-1}(A \\cup B) = f^{-1}(A) \\cup f^{-1}(B)$.", true, "Urbilder vertragen sich mit allen Mengenoperationen, Bilder nur mit Vereinigungen. Deshalb definiert man Stetigkeit über Urbilder offener Mengen.")),
    EX(nu("Wie viele **surjektive** Abbildungen $\\{1, \\dots, 5\\} \\to \\{1, 2, 3\\}$ gibt es?", 150, "Inklusion-Exklusion: $3^5 - \\binom31 2^5 + \\binom32 1^5 = 243 - 96 + 3 = 150$.")),
    EX(tf("Es gibt eine Surjektion von einer Menge $M$ auf ihre Potenzmenge $\\mathcal{P}(M)$.", false, "Cantor: Für $f: M \\to \\mathcal{P}(M)$ liegt $D = \\{x : x \\notin f(x)\\}$ nicht im Bild, denn aus $D = f(d)$ folgte $d \\in D \\iff d \\notin D$.")),
    EX(tf("Es gibt eine Bijektion $\\mathbb{N} \\to \\mathbb{N} \\times \\mathbb{N}$.", true, "Diagonal abzählen: $(m, n) \\mapsto \\tfrac{(m + n)(m + n + 1)}{2} + n$ (Cantorsche Paarungsfunktion).")),
  ]);

  // ================================================================ inequalities, sup, induction
  deepen("ana-anordnung", [], [
    KL(tf("$|a + b| = |a| + |b|$ gilt genau dann, wenn $ab \\ge 0$.", true, "Quadrieren: $a^2 + 2ab + b^2 = a^2 + 2|ab| + b^2 \\iff ab = |ab|$.")),
    KL(tf("Aus $a < b$ folgt $a^2 < b^2$.", false, "$-3 < 1$, aber $9 > 1$. Quadrieren ist nur auf $[0, \\infty)$ monoton.")),
    KL(nu("Welche Länge hat die Lösungsmenge von $|x - 1| + |x - 3| \\le 4$?", 4, "Die Summe der Abstände zu $1$ und $3$ ist zwischen den Punkten konstant $2$, außerhalb wächst sie mit Steigung $2$: $\\le 4$ für $x \\in [0, 4]$. Länge $4$.")),
    KL((lv, G) => { const k = G.int(1, 6); return nu("Welchen kleinsten Wert hat $x + \\tfrac{" + k * k + "}{x}$ für $x > 0$?", 2 * k, "AM-GM: $\\tfrac{x + " + k * k + "/x}{2} \\ge \\sqrt{x \\cdot \\tfrac{" + k * k + "}{x}} = " + k + "$, Gleichheit bei $x = " + k + "$. Minimum $" + 2 * k + "$, ohne Ableitung."); }),
    EX(tf("$\\mathbb{C}$ lässt sich so anordnen, dass ein angeordneter Körper entsteht.", false, "In jedem angeordneten Körper sind Quadrate $\\ge 0$, also $-1 = i^2 \\ge 0$, aber auch $1 = 1^2 > 0$, also $0 = 1 + (-1) > 0$. Widerspruch.")),
    EX(tf("$||a| - |b|| \\le |a - b|$ für alle reellen $a, b$.", true, "Dreiecksungleichung: $|a| = |(a - b) + b| \\le |a - b| + |b|$, ebenso mit vertauschten Rollen. Daraus folgt: Der Betrag ist Lipschitz-stetig.")),
    EX(tf("Für $a, b, c > 0$ gilt $\\tfrac ab + \\tfrac bc + \\tfrac ca \\ge 3$.", true, "AM-GM für drei Zahlen: Der Durchschnitt ist mindestens $\\sqrt[3]{\\tfrac ab \\cdot \\tfrac bc \\cdot \\tfrac ca} = 1$.")),
    EX(tf("In jedem angeordneten Körper gilt $1 > 0$.", true, "$1 = 1 \\cdot 1 = 1^2$, und Quadrate von Elementen $\\ne 0$ sind positiv.")),
  ]);

  deepen("ana-supinf", [], [
    KL(tf("Hat eine Menge ein Maximum, so ist es ihr Supremum.", true, "Ein Maximum ist eine obere Schranke, die zur Menge gehört; jede kleinere Zahl ist keine obere Schranke mehr.")),
    KL(tf("Für beschränkte nichtleere $A, B \\subseteq \\mathbb{R}$ gilt $\\sup(A + B) = \\sup A + \\sup B$.", true, "$\\le$: $a + b \\le \\sup A + \\sup B$. $\\ge$: Zu $\\varepsilon$ wähle $a > \\sup A - \\varepsilon$ und $b > \\sup B - \\varepsilon$.")),
    KL(tf("Für beschränkte nichtleere $A, B$ gilt $\\sup(A \\cdot B) = \\sup A \\cdot \\sup B$.", false, "$A = B = \\{-2, -1\\}$: $A \\cdot B = \\{4, 2, 1\\}$ hat Supremum $4$, aber $\\sup A \\cdot \\sup B = 1$. Für nichtnegative Mengen stimmt es.")),
    KL(tf("$s = \\sup M$ gilt genau dann, wenn $s$ eine obere Schranke ist und es zu jedem $\\varepsilon > 0$ ein $x \\in M$ mit $x > s - \\varepsilon$ gibt.", true, "Die zweite Bedingung sagt: Keine kleinere Zahl ist obere Schranke. Diese $\\varepsilon$-Form braucht man in fast jedem Beweis mit Suprema.")),
    EX(tf("Jede nichtleere, nach oben beschränkte Teilmenge von $\\mathbb{Z}$ hat ein Maximum.", true, "Das Supremum $s$ existiert; im Intervall $(s - 1, s]$ liegt ein Element, und da die Abstände ganzer Zahlen mindestens $1$ sind, liegt darüber keines mehr. Es ist das Maximum.")),
    EX(dec("Bestimme $\\sup\\bigl\\{\\tfrac{n}{n + 1} + \\tfrac{(-1)^n}{n} : n \\ge 1\\bigr\\}$ (vier Nachkommastellen).", 7 / 6, 4, "Gerade $n$: $\\tfrac{n}{n+1} + \\tfrac1n$, bei $n = 2$ ist das $\\tfrac23 + \\tfrac12 = \\tfrac76$, für größere gerade $n$ kleiner (bei $4$: $1{,}05$), ungerade $n$ liegen unter $1$. Das Supremum ist das Maximum $\\tfrac76$, obwohl die Folge gegen $1$ geht.")),
    EX(tf("$\\{x \\in \\mathbb{Q} : x^2 < 2\\}$ hat in $\\mathbb{Q}$ ein Supremum.", false, "In $\\mathbb{R}$ ist es $\\sqrt2$. In $\\mathbb{Q}$ gibt es zu jeder rationalen oberen Schranke eine kleinere: $\\mathbb{Q}$ ist nicht vollständig.")),
    EX(tf("Ist $A \\subseteq B$ und $B$ beschränkt, so gilt $\\inf B \\le \\inf A \\le \\sup A \\le \\sup B$ (für $A \\ne \\emptyset$).", true, "Jede untere Schranke von $B$ ist eine von $A$, also auch $\\inf B$; das Infimum von $A$ ist die größte, also $\\ge \\inf B$. Für leeres $A$ gilt $\\inf\\emptyset = \\infty > \\sup\\emptyset = -\\infty$.")),
  ]);

  deepen("ana-summen", [], [
    KL((lv, G) => { const n = G.int(3, 12); return nu("Berechne $\\sum_{k=1}^{" + n + "} k^3$.", Math.pow(n * (n + 1) / 2, 2), "$\\sum_{k=1}^n k^3 = \\bigl(\\tfrac{n(n+1)}{2}\\bigr)^2$, das Quadrat der Summe der ersten $n$ Zahlen: $" + n * (n + 1) / 2 + "^2$."); }),
    KL((lv, G) => { const n = G.pick([9, 19, 49, 99, 999]); return dec("Berechne $\\sum_{k=1}^{" + n + "} \\tfrac{1}{k(k+1)}$ (vier Nachkommastellen).", n / (n + 1), 4, "Teleskop: $\\tfrac{1}{k(k+1)} = \\tfrac1k - \\tfrac{1}{k+1}$, es bleibt $1 - \\tfrac{1}{" + (n + 1) + "} = \\tfrac{" + n + "}{" + (n + 1) + "}$."); }),
    KL(ch("Ab welchem Startwert gilt $2^n > n^2$ für alle folgenden $n$?", "$n = 5$",
      [["$n = 1$", "Bei $n = 2$ ist $4 = 4$, bei $n = 3$ ist $8 < 9$."], ["$n = 3$", "$2^3 = 8 < 9$."], ["$n = 4$", "$2^4 = 16 = 4^2$, keine echte Ungleichung."]],
      "Anfang $n = 5$: $32 > 25$. Schritt: $2^{n+1} = 2 \\cdot 2^n > 2n^2 \\ge (n + 1)^2$ für $n \\ge 3$. Der Induktionsanfang muss dort liegen, wo der Schritt funktioniert.")),
    KL(sp("Beweis, dass alle Pferde dieselbe Farbe haben. Welche Zeile ist falsch?",
      [["Anfang $n = 1$: Ein Pferd hat eine Farbe.", "Stimmt."], ["Schritt: Von $n + 1$ Pferden haben die ersten $n$ dieselbe Farbe, ebenso die letzten $n$.", "Stimmt nach Induktionsvoraussetzung."], ["Die beiden Gruppen überlappen, also haben alle dieselbe Farbe.", "Falsch für $n = 1$: Bei zwei Pferden sind »die ersten« und »die letzten« je ein Pferd, und sie überlappen nicht. Der Schritt von $1$ auf $2$ scheitert."], ["Also haben alle Pferde dieselbe Farbe.", "Folgt nur, wenn jeder Schritt gilt."]],
      2, "Ein Induktionsschritt muss für **jedes** $n$ ab dem Anfang funktionieren. Hier versagt er genau beim ersten Schritt.")),
    EX(nu("Berechne $\\sum_{k=1}^{5} k \\cdot k!$.", 719, "$k \\cdot k! = (k + 1)! - k!$, die Summe teleskopiert zu $6! - 1! = 719$.")),
    EX(nu("Wie viele Teilmengen von $\\{1, \\dots, 10\\}$ enthalten keine zwei aufeinanderfolgenden Zahlen (die leere Menge zählt mit)?", 144, "Sei $a_n$ die Anzahl für $\\{1, \\dots, n\\}$. Entweder $n$ fehlt ($a_{n-1}$ Möglichkeiten) oder $n$ ist dabei und $n - 1$ fehlt ($a_{n-2}$). Mit $a_0 = 1$, $a_1 = 2$: Fibonacci, $a_{10} = 144$.")),
    EX(tf("Starke Induktion (Schluss von allen $k \\le n$ auf $n + 1$) beweist mehr als gewöhnliche Induktion.", false, "Beide sind gleich stark: Starke Induktion für $A(n)$ ist gewöhnliche Induktion für $B(n) = $ »$A(k)$ für alle $k \\le n$«. Beide beruhen auf der Wohlordnung von $\\mathbb{N}$.")),
    EX(tf("$\\sum_{k=0}^{n} \\binom{n}{k}^2 = \\binom{2n}{n}$.", true, "Aus $2n$ Personen ($n$ rote, $n$ blaue) $n$ auswählen: $k$ rote und $n - k$ blaue, also $\\binom nk\\binom n{n-k} = \\binom nk^2$, summiert über $k$.")),
  ]);

  deepen("ana-archimedes", [], [
    KL((lv, G) => { const d = G.pick([3, 7, 6, 9]), k = G.pick([2, 3]), eps = d / Math.pow(10, k), n0 = Math.floor(1 / eps) + 1; return nu("Bestimme das kleinste $n \\in \\mathbb{N}$ mit $\\tfrac1n < " + G.tex(eps, 4) + "$.", n0, "$\\tfrac1n < " + G.tex(eps, 4) + " \\iff n > \\tfrac{1}{" + G.tex(eps, 4) + "} \\approx " + G.tex(1 / eps, 2) + "$. Kleinstes $n = " + n0 + "$. Archimedes garantiert, dass es so ein $n$ gibt."); }),
    KL((lv, G) => { const k = G.pick([3, 4, 6, 9]); let n = 0; while (Math.pow(2, n) <= Math.pow(10, k)) n++; return nu("Bestimme das kleinste $n$ mit $2^n > 10^{" + k + "}$.", n, "$2^{10} = 1024 > 10^3$, also wächst $2^n$ um den Faktor $10$ alle gut $3{,}32$ Schritte. Genau: $2^{" + (n - 1) + "} \\le 10^{" + k + "} < 2^{" + n + "}$."); }),
    KL(tf("Zwischen zwei verschiedenen reellen Zahlen liegt stets eine rationale.", true, "Für $a < b$ wähle $n$ mit $\\tfrac1n < b - a$ (Archimedes); dann liegt ein Vielfaches $\\tfrac mn$ zwischen $a$ und $b$.")),
    KL(tf("Zwischen zwei verschiedenen rationalen Zahlen liegt stets eine irrationale.", true, "$a + \\tfrac{b - a}{\\sqrt2}$ liegt dazwischen und ist irrational.")),
    EX(tf("Jeder angeordnete Körper ist archimedisch.", false, "Der Körper der rationalen Funktionen $\\mathbb{R}(x)$, angeordnet durch das Vorzeichen des Leitkoeffizienten, enthält $x$, und $x > n$ für alle $n \\in \\mathbb{N}$. Erst die Vollständigkeit erzwingt Archimedes.")),
    EX(tf("Jeder vollständige angeordnete Körper ist archimedisch.", true, "Wären die natürlichen Zahlen beschränkt, hätten sie ein Supremum $s$; dann wäre $s - 1$ keine obere Schranke, es gäbe $n > s - 1$, also $n + 1 > s$. Widerspruch.")),
    EX(tf("Für jedes $\\varepsilon > 0$ und jedes $K > 0$ gibt es ein $n$ mit $n\\varepsilon > K$, auch für $\\varepsilon = 10^{-100}$ und $K = 10^{100}$.", true, "Das ist die archimedische Eigenschaft selbst: $n > K/\\varepsilon = 10^{200}$.")),
  ]);

  deepen("ana-binom", [], [
    KL((lv, G) => { const n = G.int(4, 9), k = G.int(1, n - 1), a = G.pick([1, 2, -1, 3]), b = G.pick([1, -1, 2, -2]); const c = binom(n, k) * Math.pow(a, n - k) * Math.pow(b, k); const bx = b === 1 ? "+ x" : b === -1 ? "- x" : pm(b) + "x"; return nu("Welcher Koeffizient steht vor $x^{" + k + "}$ in $(" + a + " " + bx + ")^{" + n + "}$?", c, "$\\binom{" + n + "}{" + k + "} \\cdot " + par(a) + "^{" + (n - k) + "} \\cdot " + par(b) + "^{" + k + "} = " + binom(n, k) + " \\cdot " + Math.pow(a, n - k) + " \\cdot " + Math.pow(b, k) + " = " + c + "$."); }),
    KL(nu("Welche untere Schranke liefert die Bernoulli-Ungleichung für $1{,}01^{100}$?", 2, "$(1 + x)^n \\ge 1 + nx = 1 + 100 \\cdot 0{,}01 = 2$. Der wahre Wert ist etwa $2{,}705$; Bernoulli ist grob, aber immer gültig.")),
    KL(tf("$\\sum_{k=0}^n (-1)^k\\binom nk = 0$ für $n \\ge 1$.", true, "Binomischer Lehrsatz mit $a = 1$, $b = -1$: $(1 - 1)^n = 0$. Es gibt gleich viele Teilmengen gerader wie ungerader Größe.")),
    KL((lv, G) => { const n = G.int(3, 10); return nu("Berechne $\\sum_{k=0}^{" + n + "} k\\binom{" + n + "}{k}$.", n * Math.pow(2, n - 1), "$k\\binom nk = n\\binom{n-1}{k-1}$, also $n \\cdot 2^{n-1} = " + n * Math.pow(2, n - 1) + "$. Zählt die Paare (Teilmenge, ausgezeichnetes Element)."); }),
    EX(tf("$\\binom{2n}{n}$ ist für $n \\ge 1$ gerade.", true, "$\\binom{2n}{n} = \\binom{2n-1}{n-1} + \\binom{2n-1}{n} = 2\\binom{2n-1}{n-1}$, weil die beiden Summanden gleich sind.")),
    EX(nu("Wie viele kürzeste Gitterwege führen von $(0, 0)$ nach $(4, 3)$?", 35, "$7$ Schritte, davon $3$ nach oben: $\\binom73 = 35$.")),
    EX(tf("Ist $p$ prim, so teilt $p$ alle $\\binom pk$ mit $0 < k < p$.", true, "$\\binom pk = \\tfrac{p!}{k!(p - k)!}$: $p$ steht im Zähler, aber nicht im Nenner. Daraus folgt $(a + b)^p \\equiv a^p + b^p \\pmod p$.")),
    EX(tf("Für alle $n \\ge 1$ gilt $\\bigl(1 + \\tfrac1n\\bigr)^n < 3$.", true, "Binomisch: $\\sum_k \\binom nk n^{-k} \\le \\sum_k \\tfrac{1}{k!} \\le 1 + 1 + \\tfrac12 + \\tfrac14 + \\dots = 3$, mit echter Ungleichung ab $k = 3$.")),
  ]);

  // ================================================================ roots, countability, complex numbers, norms, metrics
  deepen("ana-wurzel", [], [
    KL(tf("$\\sqrt2 + \\sqrt3$ ist irrational.", true, "Wäre $q = \\sqrt2 + \\sqrt3$ rational, dann auch $q^2 = 5 + 2\\sqrt6$ und damit $\\sqrt6$. Aber $\\sqrt6$ ist irrational ($6$ ist keine Quadratzahl).")),
    KL(tf("Die Summe zweier irrationaler Zahlen ist irrational.", false, "$\\sqrt2 + (-\\sqrt2) = 0$.")),
    KL(nu("Es gilt $\\sqrt{7 + 4\\sqrt3} = a + \\sqrt3$ mit einer ganzen Zahl $a$. Bestimme $a$.", 2, "$(a + \\sqrt3)^2 = a^2 + 3 + 2a\\sqrt3$; Vergleich: $2a = 4$ und $a^2 + 3 = 7$, also $a = 2$.")),
    KL(tf("$\\sqrt n$ ist für $n \\in \\mathbb{N}$ genau dann rational, wenn $n$ eine Quadratzahl ist.", true, "Aus $\\sqrt n = \\tfrac pq$ (gekürzt) folgt $nq^2 = p^2$; jeder Primfaktor von $q$ teilt $p$, also $q = 1$.")),
    EX(tf("Es gibt irrationale $a, b$, für die $a^b$ rational ist.", true, "Entweder ist $\\sqrt2^{\\sqrt2}$ rational (fertig), oder irrational; dann ist $\\bigl(\\sqrt2^{\\sqrt2}\\bigr)^{\\sqrt2} = \\sqrt2^2 = 2$. Ein Beweis, der nicht verrät, welcher Fall eintritt.")),
    EX(tf("$\\log_2 3$ ist irrational.", true, "Aus $\\log_2 3 = \\tfrac pq$ folgte $2^p = 3^q$, eine gerade gleich einer ungeraden Zahl.")),
    EX(tf("Ist $x$ irrational, so ist auch $\\sqrt x$ irrational (für $x > 0$).", true, "Kontraposition: Ist $\\sqrt x = \\tfrac pq$ rational, so auch $x = \\tfrac{p^2}{q^2}$.")),
  ]);

  deepen("ana-abzaehlbar", [], [
    KL(tf("Eine abzählbare Vereinigung abzählbarer Mengen ist abzählbar.", true, "Schreibe die Mengen als Zeilen einer unendlichen Tabelle und zähle diagonal ab (mit dem Auswahlaxiom für die Aufzählungen).")),
    KL(tf("Die Menge aller **endlichen** Teilmengen von $\\mathbb{N}$ ist abzählbar.", true, "Für jedes $n$ gibt es nur endlich viele Teilmengen von $\\{1, \\dots, n\\}$; eine abzählbare Vereinigung endlicher Mengen.")),
    KL(tf("Die Menge **aller** Teilmengen von $\\mathbb{N}$ ist abzählbar.", false, "Cantor: Keine Abbildung $\\mathbb{N} \\to \\mathcal{P}(\\mathbb{N})$ ist surjektiv. $\\mathcal{P}(\\mathbb{N})$ ist gleichmächtig zu $\\mathbb{R}$.")),
    KL(tf("Die Menge der Folgen mit Werten in $\\{0, 1\\}$ ist abzählbar.", false, "Diagonalargument: Ändere bei der $n$-ten Folge das $n$-te Glied; die neue Folge kommt in keiner Aufzählung vor.")),
    EX(tf("Die algebraischen Zahlen (Nullstellen von Polynomen mit ganzen Koeffizienten) sind abzählbar.", true, "Abzählbar viele Polynome, jedes mit endlich vielen Nullstellen. Deshalb gibt es überabzählbar viele transzendente Zahlen, ohne dass man eine kennen muss.")),
    EX(tf("Die Menge der stetigen Funktionen $\\mathbb{R} \\to \\mathbb{R}$ ist gleichmächtig zu $\\mathbb{R}$.", true, "Eine stetige Funktion ist durch ihre Werte auf $\\mathbb{Q}$ festgelegt, also höchstens $|\\mathbb{R}^{\\mathbb{Q}}| = |\\mathbb{R}|$ viele. Alle Funktionen $\\mathbb{R} \\to \\mathbb{R}$ sind dagegen echt mehr.")),
    EX(tf("Es gibt eine Menge, die mächtiger ist als jede abzählbare, aber weniger mächtig als $\\mathbb{R}$.", false, "Diese Aussage ist die Negation der Kontinuumshypothese, und sie ist in der üblichen Mengenlehre (ZFC) weder beweisbar noch widerlegbar. Als »falsch« zu werten ist sie nur, weil sie sich nicht beweisen lässt.")),
  ]);

  deepen("ana-komplex", [], [
    KL(dec("Berechne $\\bigl|\\tfrac{3 + 4i}{1 - i}\\bigr|$ (drei Nachkommastellen).", 5 / Math.SQRT2, 3, "Beträge dividieren sich: $\\tfrac{|3 + 4i|}{|1 - i|} = \\tfrac{5}{\\sqrt2} \\approx 3{,}536$. Kein Ausrechnen des Quotienten nötig.")),
    KL(tf("$\\mathbb{C}$ lässt sich als angeordneter Körper auffassen.", false, "In einem angeordneten Körper ist $i^2 = -1 \\ge 0$ unmöglich, weil Quadrate nichtnegativ und $-1 < 0$ sind.")),
    KL((lv, G) => { const n = G.int(2, 9); return nu("Wie groß ist das Produkt aller $" + n + "$-ten Einheitswurzeln?", n % 2 ? 1 : -1, "Sie sind die Nullstellen von $z^{" + n + "} - 1$; nach Vieta ist ihr Produkt $(-1)^{" + n + "} \\cdot (-1) = (-1)^{" + (n + 1) + "} = " + (n % 2 ? 1 : -1) + "$. Ihre Summe ist $0$."); }),
    KL(tf("Für alle $z, w \\in \\mathbb{C}$ gilt $|z + w|^2 + |z - w|^2 = 2|z|^2 + 2|w|^2$.", true, "Parallelogrammgleichung, weil $|z|^2 = z\\bar z$ von einem Skalarprodukt kommt: Die Mischterme $z\\bar w + \\bar z w$ heben sich weg.")),
    EX(dec("Berechne den Realteil von $i^i$ (Hauptwert, vier Nachkommastellen).", Math.exp(-Math.PI / 2), 4, "$i = e^{i\\pi/2}$, also $i^i = e^{i \\cdot i\\pi/2} = e^{-\\pi/2} \\approx 0{,}2079$: reell. Andere Zweige des Logarithmus liefern $e^{-\\pi/2 - 2\\pi k}$.")),
    EX((lv, G) => { const R = G.pick([10, 20, 30, 50]), k = Math.floor(R / (2 * Math.PI)); return nu("Wie viele $z \\in \\mathbb{C}$ mit $|z| < " + R + "$ erfüllen $e^z = 1$?", 2 * k + 1, "$e^z = 1 \\iff z = 2\\pi i k$, $k \\in \\mathbb{Z}$. Bedingung $2\\pi|k| < " + R + "$, also $|k| \\le " + k + "$: $" + (2 * k + 1) + "$ Lösungen."); }),
    EX(tf("Jedes nichtkonstante komplexe Polynom hat eine Nullstelle in $\\mathbb{C}$.", true, "Fundamentalsatz der Algebra. Ein Analysis-Beweis: $|p|$ nimmt auf $\\mathbb{C}$ ein Minimum an (Wachstum für große $|z|$, Kompaktheit), und an einem Minimum $\\ne 0$ könnte man $|p|$ noch verkleinern.")),
  ]);

  deepen("ana-normen", [], [
    KL(tf("Alle Normen auf dem $\\mathbb{R}^n$ sind äquivalent.", true, "Es gibt Konstanten $c, C > 0$ mit $c\\|x\\| \\le \\|x\\|' \\le C\\|x\\|$. Folge: Konvergenz und Stetigkeit hängen im $\\mathbb{R}^n$ nicht von der Norm ab.")),
    KL((lv, G) => { const n = G.int(2, 9); return dec("Bestimme die kleinste Konstante $c$ mit $\\|x\\|_2 \\le c\\|x\\|_\\infty$ für alle $x \\in \\mathbb{R}^{" + n + "}$ (drei Nachkommastellen).", Math.sqrt(n), 3, "$\\|x\\|_2^2 = \\sum x_i^2 \\le " + n + "\\|x\\|_\\infty^2$, Gleichheit bei $x = (1, \\dots, 1)$: $c = \\sqrt{" + n + "}$."); }),
    KL((lv, G) => { const [a, b, c] = G.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]); return nu("Welchen größten Wert nimmt $" + a + "x + " + b + "y$ auf dem Einheitskreis $x^2 + y^2 = 1$ an?", c, "Cauchy-Schwarz: $" + a + "x + " + b + "y = \\langle (" + a + ", " + b + "), (x, y) \\rangle \\le \\sqrt{" + a * a + " + " + b * b + "} \\cdot 1 = " + c + "$, Gleichheit bei $(x, y) = \\tfrac{1}{" + c + "}(" + a + ", " + b + ")$."); }),
    KL(ch("Welche Funktion ist **keine** Norm auf $\\mathbb{R}^2$?", "$\\|x\\| = |x_1|$",
      [["$\\|x\\| = \\max(|x_1|, |x_2|)$", "Das ist die Maximumsnorm."], ["$\\|x\\| = |x_1| + 2|x_2|$", "Eine gewichtete Summennorm, alle Axiome gelten."], ["$\\|x\\| = \\sqrt{x_1^2 + x_2^2}$", "Die euklidische Norm."]],
      "$|x_1|$ ist für $x = (0, 1) \\ne 0$ null: nicht definit.")),
    EX(tf("Auf $\\mathbb{R}[x]$ sind alle Normen äquivalent.", false, "$\\|p\\|_1 = \\sum|a_k|$ und $\\|p\\|_\\infty = \\max|a_k|$: Für $p_n = 1 + x + \\dots + x^n$ ist der Quotient $n + 1$, unbeschränkt. Äquivalenz aller Normen kennzeichnet endliche Dimension.")),
    EX(tf("$\\|x\\|_{1/2} = (\\sqrt{|x_1|} + \\sqrt{|x_2|})^2$ ist eine Norm auf $\\mathbb{R}^2$.", false, "Dreiecksungleichung verletzt: $\\|e_1 + e_2\\|_{1/2} = 4 > 2 = \\|e_1\\|_{1/2} + \\|e_2\\|_{1/2}$. Die »Einheitskugel« ist nicht konvex.")),
    EX(tf("Für jedes $x \\in \\mathbb{R}^n$ gilt $\\|x\\|_p \\to \\|x\\|_\\infty$ für $p \\to \\infty$.", true, "$\\|x\\|_\\infty \\le \\|x\\|_p \\le n^{1/p}\\|x\\|_\\infty$, und $n^{1/p} \\to 1$.")),
  ]);

  deepen("ana-metrik", [], [
    KL(tf("Ist $d$ eine Metrik, so auch $\\min(d, 1)$.", true, "Definitheit und Symmetrie bleiben. Dreieck: Ist $d(x, y) \\ge 1$ oder $d(y, z) \\ge 1$, ist die rechte Seite $\\ge 1$; sonst folgt es aus dem Dreieck für $d$.")),
    KL(tf("$d(x, y) = (x - y)^2$ ist eine Metrik auf $\\mathbb{R}$.", false, "$d(0, 2) = 4 > 2 = d(0, 1) + d(1, 2)$: die Dreiecksungleichung fehlt.")),
    KL(tf("In $\\mathbb{Q}$ (mit dem Betragsabstand) ist jede abgeschlossene, beschränkte Menge kompakt.", false, "$\\{x \\in \\mathbb{Q} : 0 \\le x \\le 2\\}$: Eine Folge rationaler Zahlen gegen $\\sqrt2$ hat keine in $\\mathbb{Q}$ konvergente Teilfolge. Heine-Borel braucht Vollständigkeit.")),
    KL(tf("Jede offene Teilmenge von $\\mathbb{R}$ ist eine Vereinigung offener Intervalle.", true, "Um jeden Punkt passt ein offenes Intervall in die Menge; die Vereinigung all dieser Intervalle ist die Menge. Man kommt sogar mit abzählbar vielen disjunkten aus.")),
    EX(tf("In einem diskreten metrischen Raum ist jede konvergente Folge schließlich konstant.", true, "Für $\\varepsilon = \\tfrac12$ heißt $d(x_n, x) < \\tfrac12$ schon $x_n = x$.")),
    EX(tf("$d(x, y) = |\\arctan x - \\arctan y|$ ist eine Metrik auf $\\mathbb{R}$, in der ganz $\\mathbb{R}$ beschränkt ist.", true, "$\\arctan$ ist injektiv, also ist $d$ definit; alle Abstände sind kleiner als $\\pi$. Beschränktheit hängt von der Metrik ab, und $\\mathbb{R}$ ist in dieser Metrik nicht vollständig.")),
    EX(tf("In jedem metrischen Raum ist die abgeschlossene Kugel $\\bar B(x, r)$ der Abschluss der offenen Kugel $B(x, r)$.", false, "Diskrete Metrik, $r = 1$: $B(x, 1) = \\{x\\}$ ist abgeschlossen, $\\bar B(x, 1)$ ist der ganze Raum. Im $\\mathbb{R}^n$ stimmt es.")),
  ]);

  // ================================================================ sequences
  deepen("ana-grenzwert", [], [
    KL((lv, G) => { let a = G.pick([2, 3, 4, 5, 7]), b = G.pick([2, 3, 4, 5, 7]); if (a === b) b = a + 1; return nu("Bestimme $\\lim_{n \\to \\infty} \\sqrt[n]{" + a + "^n + " + b + "^n}$.", Math.max(a, b), "Mit $m = \\max(" + a + ", " + b + ") = " + Math.max(a, b) + "$: $m \\le \\sqrt[n]{" + a + "^n + " + b + "^n} \\le \\sqrt[n]{2}\\,m \\to m$. Die größere Basis dominiert."); }),
    KL((lv, G) => { const a = nz(G, -3, 3), b = G.int(-5, 5); return dec("Bestimme $\\lim_{n \\to \\infty} \\bigl(1 " + pm(a) + "/n " + pm(b) + "/n^2\\bigr)^n$ (vier Nachkommastellen).", Math.exp(a), 4, "Der Term $\\tfrac{" + b + "}{n^2}$ ist gegen $\\tfrac{" + a + "}{n}$ vernachlässigbar: $n\\ln(1 + \\tfrac{" + a + "}{n} + \\tfrac{" + b + "}{n^2}) \\to " + a + "$. Grenzwert $e^{" + a + "} \\approx " + G.tex(Math.exp(a), 4) + "$."); }),
    KL(nu("Bestimme $\\lim_{n \\to \\infty} \\sqrt[n]{n}$.", 1, "Mit $\\sqrt[n]n = 1 + h_n$ und dem binomischen Lehrsatz: $n \\ge \\binom n2 h_n^2$, also $h_n \\le \\sqrt{2/(n - 1)} \\to 0$.")),
    KL(nu("Bestimme $\\lim_{n \\to \\infty} \\bigl(1 + \\tfrac{1}{n^2}\\bigr)^n$.", 1, "$n\\ln(1 + n^{-2}) \\approx n \\cdot n^{-2} \\to 0$, also Grenzwert $e^0 = 1$. Vorsicht vor »$1^\\infty$«: Es kommt auf die Geschwindigkeiten an.")),
    EX((lv, G) => { const a = G.pick([2, 3, 5, 10]); return dec("Bestimme $\\lim_{n \\to \\infty} n\\bigl(\\sqrt[n]{" + a + "} - 1\\bigr)$ (vier Nachkommastellen).", Math.log(a), 4, "$\\sqrt[n]{" + a + "} = e^{\\ln " + a + "/n}$, und $\\tfrac{e^h - 1}{h} \\to 1$: Grenzwert $\\ln " + a + " \\approx " + G.tex(Math.log(a), 4) + "$."); }),
    EX(dec("Bestimme $\\lim_{n \\to \\infty} \\tfrac{\\sqrt[n]{n!}}{n}$ (vier Nachkommastellen).", 1 / Math.E, 4, "$\\ln\\tfrac{\\sqrt[n]{n!}}{n} = \\tfrac1n\\sum_{k=1}^n \\ln\\tfrac kn \\to \\int_0^1 \\ln x\\,dx = -1$. Grenzwert $\\tfrac1e \\approx 0{,}3679$, im Einklang mit Stirling.")),
    EX(dec("Bestimme $\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\tfrac{n}{n^2 + k^2}$ (vier Nachkommastellen).", Math.PI / 4, 4, "Umschreiben: $\\tfrac1n\\sum_{k=1}^n \\tfrac{1}{1 + (k/n)^2}$, eine Riemann-Summe für $\\int_0^1 \\tfrac{dx}{1 + x^2} = \\arctan 1 = \\tfrac\\pi4$.")),
    EX(nu("Bestimme $\\lim_{n \\to \\infty} \\bigl(1 - \\tfrac1n\\bigr)^{n^2}$.", 0, "$\\bigl((1 - \\tfrac1n)^n\\bigr)^n \\approx (e^{-1})^n \\to 0$. Genauer: $n^2\\ln(1 - \\tfrac1n) \\le -n \\to -\\infty$.")),
  ]);

  deepen("ana-epsilon", [], [
    KL((lv, G) => {
      const p = G.int(1, 4), r = G.int(1, 5), off = G.pick([1, 2, 3, -1, -2]), q = p * r + off, m = G.pick([10, 50, 100, 1000]);
      const K = Math.abs(off) * m - r, n0 = Math.max(1, Math.floor(K) + 1);
      return nu("$a_n = \\dfrac{" + (p === 1 ? "" : p) + "n " + pm(q) + "}{n + " + r + "} \\to " + p + "$. Bestimme das kleinste $n_0$ mit $|a_n - " + p + "| < \\tfrac{1}{" + m + "}$ für alle $n \\ge n_0$.", n0,
        "$|a_n - " + p + "| = \\dfrac{|" + q + " - " + p * r + "|}{n + " + r + "} = \\dfrac{" + Math.abs(off) + "}{n + " + r + "}$, fallend in $n$. Bedingung $n + " + r + " > " + Math.abs(off) * m + "$, also $n > " + K + "$: kleinstes $n_0 = " + n0 + "$.", { hint: "Erst $|a_n - " + p + "|$ als einen einzigen Bruch schreiben." });
    }),
    KL(tf("Konvergiert $(a_n)$, so konvergiert $(|a_n|)$.", true, "$\\bigl||a_n| - |a|\\bigr| \\le |a_n - a|$. Die Umkehrung ist falsch: $(-1)^n$.")),
    KL(tf("Gilt $a_{n+1} - a_n \\to 0$, so konvergiert $(a_n)$.", false, "$a_n = \\sqrt n$: $\\sqrt{n+1} - \\sqrt n = \\tfrac{1}{\\sqrt{n+1} + \\sqrt n} \\to 0$, aber $\\sqrt n \\to \\infty$. Erst die Cauchy-Bedingung (alle späteren Glieder nah beieinander) reicht.")),
    KL(sp("Beweis von $\\tfrac{n}{n + 1} \\to 1$. Welche Zeile ist falsch?",
      [["Sei $\\varepsilon > 0$.", "Richtig."], ["$|\\tfrac{n}{n+1} - 1| = \\tfrac{1}{n + 1}$.", "Richtig."], ["Wähle $n_0 = \\tfrac1\\varepsilon$.", "Falsch: $n_0$ muss eine natürliche Zahl sein. Richtig: $n_0 > \\tfrac1\\varepsilon$ nach Archimedes, etwa $n_0 = \\lceil 1/\\varepsilon \\rceil$."], ["Für $n \\ge n_0$ ist $\\tfrac{1}{n+1} < \\tfrac{1}{n_0} \\le \\varepsilon$.", "Mit der korrigierten Wahl richtig."]],
      2, "Kleinigkeiten zählen: $n_0 \\in \\mathbb{N}$, und an der Stelle mit $\\le$ statt $<$ braucht man eine echte Ungleichung irgendwo.")),
    EX(tf("Aus $a_n \\to a$ folgt $\\tfrac{a_1 + \\dots + a_n}{n} \\to a$.", true, "Cesàro: Die ersten $N$ Glieder verlieren im Mittel an Gewicht ($\\tfrac{C}{n} \\to 0$), die übrigen liegen alle nah an $a$. Die Umkehrung ist falsch: $(-1)^n$ hat Mittel gegen $0$.")),
    EX(tf("Ist $(a_n)$ eine Folge mit $|a_{n+1} - a_n| \\le 2^{-n}$, so konvergiert sie.", true, "Für $m > n$: $|a_m - a_n| \\le \\sum_{k \\ge n} 2^{-k} = 2^{1-n}$. Cauchy-Folge, also konvergent in $\\mathbb{R}$.")),
    EX(tf("Gilt $a_n \\to a$ und $b_n \\to b$ mit $a_n < b_n$ für alle $n$, so ist $a < b$.", false, "Nur $a \\le b$: $a_n = 0 < \\tfrac1n = b_n$, beide Grenzwerte $0$. Strikte Ungleichungen überleben Grenzübergänge nicht.")),
  ]);

  deepen("ana-monoton", [], [
    KL((lv, G) => { const k = G.int(2, 6), c = k * (k - 1); return nu("$a_1 = 0$, $a_{n+1} = \\sqrt{" + c + " + a_n}$. Bestimme $\\lim a_n$.", k, "Die Folge ist monoton wachsend und durch $" + k + "$ beschränkt (Induktion), also konvergent. Für den Grenzwert gilt $a = \\sqrt{" + c + " + a}$, also $a^2 - a - " + c + " = 0$ mit positiver Lösung $a = " + k + "$."); }),
    KL(dec("$a_1 = 1$, $a_{n+1} = \\tfrac12\\bigl(a_n + \\tfrac{2}{a_n}\\bigr)$. Bestimme $\\lim a_n$ (vier Nachkommastellen).", Math.SQRT2, 4, "Ab $n = 2$ ist $a_n \\ge \\sqrt2$ (AM-GM) und die Folge fällt. Grenzwert: $a = \\tfrac12(a + \\tfrac2a)$, also $a^2 = 2$: $\\sqrt2$. Das Heron-Verfahren verdoppelt die richtigen Stellen in jedem Schritt.")),
    KL(tf("Jede konvergente Folge ist monoton.", false, "$\\tfrac{(-1)^n}{n} \\to 0$ springt hin und her. Monoton und beschränkt ist hinreichend, nicht notwendig.")),
    KL(tf("Eine monotone Folge mit einer konvergenten Teilfolge konvergiert.", true, "Die Teilfolge ist beschränkt, und weil die Folge monoton ist, liegt jedes Glied zwischen dem Anfang und einem späteren Teilfolgenglied: Die ganze Folge ist beschränkt.")),
    EX(dec("$a_1 = 1$, $a_{n+1} = 1 + \\tfrac{1}{a_n}$. Bestimme $\\lim a_n$ (vier Nachkommastellen).", (1 + Math.sqrt(5)) / 2, 4, "Die Folge ist nicht monoton (sie pendelt: $1, 2, 1{,}5, 1{,}67, \\dots$), aber die Teilfolgen der geraden und ungeraden Glieder sind es, mit demselben Grenzwert $a = 1 + \\tfrac1a$: der Goldene Schnitt $\\tfrac{1 + \\sqrt5}{2}$.")),
    EX(tf("$\\bigl(1 + \\tfrac1n\\bigr)^n$ wächst, $\\bigl(1 + \\tfrac1n\\bigr)^{n+1}$ fällt, und beide gehen gegen $e$.", true, "Beides folgt aus der Bernoulli-Ungleichung angewandt auf den Quotienten aufeinanderfolgender Glieder. So entsteht eine Intervallschachtelung für $e$.")),
    EX(tf("Ist $a_{n+1} = f(a_n)$ mit stetigem $f$ und konvergiert $(a_n)$ gegen $a$, so ist $f(a) = a$.", true, "$a = \\lim a_{n+1} = \\lim f(a_n) = f(\\lim a_n) = f(a)$, die Stetigkeit erlaubt das Vertauschen.")),
  ]);

  deepen("ana-teilfolgen", [], [
    KL(tf("Hat $(a_n)$ genau einen Häufungspunkt, so konvergiert sie.", false, "$a_n = n$ für ungerade, $0$ für gerade $n$: Einziger Häufungspunkt $0$, aber unbeschränkt. Für **beschränkte** Folgen stimmt es.")),
    KL((lv, G) => { const k = G.pick([2, 3, 4, 6]); const vals = new Set(range(0, 2 * k - 1).map((n) => Math.round(Math.sin((n * Math.PI) / k) * 1e9) / 1e9)); return nu("Wie viele Häufungspunkte hat $\\sin\\bigl(\\tfrac{n\\pi}{" + k + "}\\bigr)$?", vals.size, "Die Folge ist periodisch mit Periode $" + 2 * k + "$; jeder der $" + vals.size + "$ verschiedenen Werte kommt unendlich oft vor und ist damit Häufungspunkt."); }),
    KL(tf("Jede Cauchy-Folge ist beschränkt.", true, "Zu $\\varepsilon = 1$ liegen ab $n_0$ alle Glieder in $(a_{n_0} - 1, a_{n_0} + 1)$; dazu endlich viele davor.")),
    KL(nu("Wie viele Häufungspunkte hat $(-1)^n + \\tfrac1n$?", 2, "Gerade Glieder gehen gegen $1$, ungerade gegen $-1$.")),
    EX(tf("Jede Zahl aus $[-1, 1]$ ist Häufungspunkt von $(\\sin n)_{n \\in \\mathbb{N}}$.", true, "Weil $\\pi$ irrational ist, liegen die Reste $n \\bmod 2\\pi$ dicht in $[0, 2\\pi)$ (Kronecker), und $\\sin$ ist stetig und surjektiv auf $[-1, 1]$.")),
    EX(tf("Es gibt eine Folge, deren Menge der Häufungspunkte genau $\\mathbb{Q}$ ist.", false, "Die Häufungspunkte jeder Folge bilden eine abgeschlossene Menge, $\\mathbb{Q}$ ist nicht abgeschlossen. Eine Aufzählung von $\\mathbb{Q}$ hat sogar **jede** reelle Zahl als Häufungspunkt.")),
    EX(tf("Jede reelle Folge hat eine monotone Teilfolge.", true, "Nenne $n$ eine Spitze, wenn $a_n > a_m$ für alle $m > n$. Unendlich viele Spitzen liefern eine fallende Teilfolge; sonst gibt es nach der letzten Spitze zu jedem Glied ein späteres, das mindestens so groß ist: eine wachsende. Daraus folgt Bolzano-Weierstraß.")),
  ]);

  // ================================================================ series
  deepen("ana-reihen", [], [
    KL(dec("Berechne $\\sum_{n=1}^{\\infty} \\tfrac{1}{n(n + 2)}$ (vier Nachkommastellen).", 0.75, 4, "Partialbruch: $\\tfrac{1}{n(n+2)} = \\tfrac12\\bigl(\\tfrac1n - \\tfrac{1}{n+2}\\bigr)$. Es bleiben $\\tfrac12(1 + \\tfrac12) = \\tfrac34$.")),
    KL((lv, G) => { const [a, b] = G.pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5]]), k = G.int(0, 3), q = a / b; return dec("Berechne $\\sum_{n=" + k + "}^{\\infty} \\bigl(\\tfrac{" + a + "}{" + b + "}\\bigr)^n$ (vier Nachkommastellen).", Math.pow(q, k) / (1 - q), 4, "Geometrische Reihe ab $n = " + k + "$: $\\tfrac{q^{" + k + "}}{1 - q}$ mit $q = \\tfrac{" + a + "}{" + b + "}$, Ergebnis $\\approx " + G.tex(Math.pow(q, k) / (1 - q), 4) + "$."); }),
    KL(tf("Aus $a_n \\to 0$ folgt, dass $\\sum a_n$ konvergiert.", false, "Harmonische Reihe: $\\tfrac1n \\to 0$, aber $\\sum\\tfrac1n = \\infty$. $a_n \\to 0$ ist nur notwendig.")),
    KL(nu("Berechne $\\sum_{n=1}^{\\infty} \\tfrac{n}{2^n}$.", 2, "Ableiten der geometrischen Reihe: $\\sum n x^n = \\tfrac{x}{(1 - x)^2}$, bei $x = \\tfrac12$: $\\tfrac{1/2}{1/4} = 2$.")),
    EX(tf("$\\sum_{n=2}^\\infty \\tfrac{1}{n\\ln n}$ konvergiert.", false, "Cauchy-Verdichtung: $\\sum 2^k \\cdot \\tfrac{1}{2^k k\\ln 2} = \\tfrac{1}{\\ln 2}\\sum\\tfrac1k = \\infty$. Sie divergiert, langsamer als jede Potenz von $\\ln$ wächst.")),
    EX(tf("$\\sum_{n=2}^\\infty \\tfrac{1}{n(\\ln n)^2}$ konvergiert.", true, "Verdichtung: $\\sum \\tfrac{2^k}{2^k k^2(\\ln 2)^2} = \\tfrac{1}{(\\ln 2)^2}\\sum\\tfrac{1}{k^2} < \\infty$.")),
    EX(nu("Berechne $\\sum_{n=1}^{\\infty} \\tfrac{n^2}{2^n}$.", 6, "$\\sum n^2x^n = \\tfrac{x(1 + x)}{(1 - x)^3}$, bei $x = \\tfrac12$: $\\tfrac{(1/2)(3/2)}{1/8} = 6$.")),
    EX(tf("Divergiert $\\sum a_n$ mit $a_n > 0$, so divergiert auch $\\sum \\tfrac{a_n}{1 + a_n}$.", true, "Bleiben die $a_n$ beschränkt, ist $\\tfrac{a_n}{1 + a_n} \\ge \\tfrac{a_n}{1 + M}$. Sonst gehen die Glieder nicht gegen $0$, weil $\\tfrac{a_n}{1 + a_n} \\ge \\tfrac12$ unendlich oft.")),
  ]);

  deepen("ana-kriterien", [], [
    KL(ch("Welches Kriterium entscheidet $\\sum \\tfrac{n!}{n^n}$ am schnellsten?", "Quotientenkriterium: $\\tfrac{a_{n+1}}{a_n} = \\bigl(\\tfrac{n}{n+1}\\bigr)^n \\to \\tfrac1e < 1$",
      [["Leibniz-Kriterium", "Die Glieder sind positiv, Leibniz ist für alternierende Reihen."], ["Nullfolgenkriterium", "Es zeigt nur Divergenz, und die Glieder gehen hier gegen $0$."], ["Vergleich mit $\\sum\\tfrac1n$", "Ein Vergleich mit einer divergenten Reihe beweist keine Konvergenz."]],
      "Fakultäten und Potenzen: Quotientenkriterium. Die Reihe konvergiert.")),
    KL(tf("Das Quotientenkriterium entscheidet $\\sum\\tfrac{1}{n^2}$.", false, "$\\tfrac{a_{n+1}}{a_n} \\to 1$: keine Aussage. Die Reihe konvergiert trotzdem (Vergleich, Verdichtung).")),
    KL(tf("Konvergiert $\\sum a_n$ mit $a_n \\ge 0$, so konvergiert auch $\\sum a_n^2$.", true, "Ab einem Index ist $a_n \\le 1$, also $a_n^2 \\le a_n$.")),
    KL(tf("Liefert das Quotientenkriterium eine Entscheidung, so auch das Wurzelkriterium.", true, "$\\liminf\\tfrac{a_{n+1}}{a_n} \\le \\liminf\\sqrt[n]{a_n} \\le \\limsup\\sqrt[n]{a_n} \\le \\limsup\\tfrac{a_{n+1}}{a_n}$. Das Wurzelkriterium ist stärker.")),
    EX(tf("$\\sum_{n=1}^\\infty \\tfrac{\\sin n}{n}$ konvergiert.", true, "Dirichlet-Kriterium: Die Partialsummen von $\\sin n$ sind beschränkt (Teleskop mit $\\cos$), und $\\tfrac1n$ fällt monoton gegen $0$. Absolut konvergiert sie nicht.")),
    EX(tf("Konvergiert $\\sum a_n$, so konvergiert auch $\\sum a_n^2$.", false, "$a_n = \\tfrac{(-1)^n}{\\sqrt n}$: $\\sum a_n$ konvergiert (Leibniz), $\\sum a_n^2 = \\sum\\tfrac1n$ nicht. Mit Vorzeichen versagen Vergleiche.")),
    EX(tf("$\\sum \\tfrac{(-1)^n}{\\sqrt n}$ konvergiert, $\\sum \\tfrac{(-1)^n}{\\sqrt n}\\cdot\\tfrac{(-1)^n}{\\sqrt n}$ nicht, obwohl beide Faktoren-Reihen konvergieren.", true, "Das Produkt der Glieder ist $\\tfrac1n$. Das Cauchy-Produkt bedingt konvergenter Reihen kann sogar divergieren.")),
  ]);

  deepen("ana-exp", [], [
    KL(nu("Berechne $e^{\\ln 5 + \\ln 3}$.", 15, "$e^{\\ln 5}e^{\\ln 3} = 5 \\cdot 3$: Die Funktionalgleichung macht aus Summen Produkte.")),
    KL(tf("$\\exp(z) \\ne 0$ für alle $z \\in \\mathbb{C}$.", true, "$\\exp(z)\\exp(-z) = \\exp(0) = 1$.")),
    KL(tf("Die Funktionalgleichung $\\exp(x + y) = \\exp x \\exp y$ folgt aus dem Cauchy-Produkt der Reihen.", true, "$\\sum_n \\sum_{k} \\tfrac{x^k}{k!}\\tfrac{y^{n-k}}{(n-k)!} = \\sum_n \\tfrac{(x + y)^n}{n!}$ nach dem binomischen Lehrsatz; erlaubt, weil beide Reihen absolut konvergieren.")),
    KL(nu("Bestimme $\\lim_{x \\to 0} \\tfrac{e^x - 1}{x}$.", 1, "Aus der Reihe: $\\tfrac{e^x - 1}{x} = 1 + \\tfrac x2 + \\dots \\to 1$. Das ist $\\exp'(0)$.")),
    EX(tf("$\\exp: \\mathbb{C} \\to \\mathbb{C}\\setminus\\{0\\}$ ist surjektiv, aber nicht injektiv.", true, "Jedes $w \\ne 0$ ist $|w|e^{i\\varphi} = e^{\\ln|w| + i\\varphi}$. Nicht injektiv wegen $e^{2\\pi i} = 1 = e^0$.")),
    EX(tf("$e$ ist irrational.", true, "Wäre $e = \\tfrac pq$, so wäre $q!\\bigl(e - \\sum_{k \\le q}\\tfrac{1}{k!}\\bigr)$ eine ganze Zahl, aber sie liegt echt zwischen $0$ und $\\tfrac1q \\le 1$.")),
    EX(dec("Bestimme $\\lim_{x \\to \\infty} x\\bigl(e^{1/x} - 1\\bigr)$ (vier Nachkommastellen).", 1, 4, "Mit $h = \\tfrac1x \\to 0$: $\\tfrac{e^h - 1}{h} \\to 1$.")),
  ]);

  deepen("ana-potenzreihen", [], [
    KL((lv, G) => { const c = G.int(2, 7), k = G.int(0, 3); return nu("Bestimme den Konvergenzradius von $\\sum_{n} \\tfrac{n^{" + k + "}}{" + c + "^n}x^n$.", c, "$\\sqrt[n]{n^{" + k + "}/" + c + "^n} = \\tfrac{(\\sqrt[n]n)^{" + k + "}}{" + c + "} \\to \\tfrac{1}{" + c + "}$, also $R = " + c + "$. Polynomielle Faktoren ändern den Radius nicht."); }),
    KL((lv, G) => { const c = G.pick([2, 3, 4, 9]); return dec("Bestimme den Konvergenzradius von $\\sum_{n} " + c + "^n x^{2n}$ (drei Nachkommastellen).", 1 / Math.sqrt(c), 3, "Mit $y = x^2$: $\\sum (" + c + "y)^n$ konvergiert für $|y| < \\tfrac{1}{" + c + "}$, also $|x| < \\tfrac{1}{\\sqrt{" + c + "}}$. Achtung: Die Formel $1/\\limsup\\sqrt[n]{|a_n|}$ muss man auf die Koeffizienten von $x^n$ anwenden, die hier abwechselnd null sind."); }),
    KL(ch("$\\sum_{n \\ge 1} \\tfrac{x^n}{n}$ hat Radius $1$. Was gilt am Rand?", "Konvergent für $x = -1$, divergent für $x = 1$",
      [["Konvergent an beiden Randpunkten", "Bei $x = 1$ entsteht die harmonische Reihe."], ["Divergent an beiden Randpunkten", "Bei $x = -1$ greift Leibniz."], ["Am Rand gilt dasselbe wie innen", "Am Rand ist alles möglich, man muss einzeln prüfen."]],
      "Bei $x = -1$ ist es $-\\ln 2$. Der Konvergenzradius sagt über den Rand nichts.")),
    KL(tf("Eine Potenzreihe konvergiert im Innern ihres Konvergenzkreises absolut.", true, "Für $|x| < r < R$ ist $|a_nx^n| \\le C(|x|/r)^n$ mit einer geometrischen Majorante.")),
    EX(dec("Bestimme den Konvergenzradius von $\\sum \\tfrac{n!}{n^n}x^n$ (vier Nachkommastellen).", Math.E, 4, "Quotient: $\\tfrac{a_n}{a_{n+1}} = \\bigl(1 + \\tfrac1n\\bigr)^n \\to e$. Also $R = e$.")),
    EX(dec("$a_n = 2^n$ für gerade, $a_n = 3^n$ für ungerade $n$. Bestimme den Konvergenzradius von $\\sum a_nx^n$ (vier Nachkommastellen).", 1 / 3, 4, "$\\limsup\\sqrt[n]{a_n} = 3$ (die ungeraden Glieder), also $R = \\tfrac13$. Das Quotientenkriterium versagt hier, die Quotienten springen zwischen $0$ und $\\infty$.")),
    EX(tf("Die Potenzreihe einer Funktion um $0$ kann überall konvergieren und trotzdem nur in $0$ mit der Funktion übereinstimmen.", true, "$f(x) = e^{-1/x^2}$ ($f(0) = 0$) hat alle Ableitungen in $0$ gleich $0$; ihre Taylorreihe ist die Nullreihe. Nicht jede glatte Funktion ist analytisch.")),
  ]);

  // ================================================================ continuity, differentiability
  deepen("ana-stetig", [], [
    KL((lv, G) => { const k = G.int(-2, 3), a = nz(G, -2, 2), b = G.int(-3, 4), d = G.int(-4, 4), c = b * k + d - a * k * k; return nu("Für welches $c$ ist $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : a) + "x^2 " + pm(0).replace("+ 0", "") + "+ c$ für $x < " + k + "$ und $f(x) = " + b + "x " + pm(d) + "$ für $x \\ge " + k + "$ stetig?", c, "Stetig in $" + k + "$: Die Grenzwerte von links und rechts stimmen überein: $" + a + " \\cdot " + par(k) + "^2 + c = " + b + " \\cdot " + par(k) + " " + pm(d) + "$, also $c = " + c + "$."); }),
    KL(tf("Ist $|f|$ stetig, so ist $f$ stetig.", false, "$f = 1$ auf $\\mathbb{Q}$ und $-1$ sonst: $|f| = 1$ ist stetig, $f$ nirgends. Umgekehrt folgt aus $f$ stetig, dass $|f|$ stetig ist.")),
    KL(tf("Sind $f$ und $f + g$ stetig, so ist $g$ stetig.", true, "$g = (f + g) - f$ ist eine Differenz stetiger Funktionen.")),
    KL(tf("$f$ ist stetig in $a$ genau dann, wenn für jede Folge $x_n \\to a$ gilt: $f(x_n) \\to f(a)$.", true, "Folgenkriterium. Zum Widerlegen von Stetigkeit genügt **eine** Folge, die versagt.")),
    EX(tf("Die Funktion $f(x) = \\tfrac1q$ für $x = \\tfrac pq$ (gekürzt) und $f(x) = 0$ für irrationale $x$ ist genau in den irrationalen Zahlen stetig.", true, "Thomae-Funktion: Bei rationalem $x$ springt sie (irrationale Nachbarn haben Wert $0$). Bei irrationalem $x$ haben in einer kleinen Umgebung alle Brüche große Nenner, also kleine Werte.")),
    EX(tf("Es gibt eine Funktion $\\mathbb{R} \\to \\mathbb{R}$, die genau in den rationalen Zahlen stetig ist.", false, "Die Stetigkeitspunkte bilden immer einen abzählbaren Durchschnitt offener Mengen ($G_\\delta$-Menge), und nach dem Satz von Baire ist $\\mathbb{Q}$ keine solche Menge.")),
    EX(tf("Jede stetige Funktion $f: \\mathbb{R} \\to \\mathbb{R}$ mit $f(x + y) = f(x) + f(y)$ ist von der Form $f(x) = cx$.", true, "Additiv heißt $f(q) = qf(1)$ für rationale $q$; Stetigkeit überträgt das auf alle reellen Zahlen.")),
    EX(tf("$f(x) = x$ für rationale, $f(x) = 0$ für irrationale $x$ ist genau in $0$ stetig.", true, "$|f(x)| \\le |x|$ erzwingt Stetigkeit in $0$; an jeder anderen Stelle springen rationale und irrationale Nachbarn auseinander.")),
  ]);

  deepen("ana-zws", [], [
    KL((lv, G) => { const c = G.int(-3, 3), roots = Math.abs(c) < 2 ? 3 : Math.abs(c) === 2 ? 2 : 1; return nu("Wie viele verschiedene reelle Nullstellen hat $x^3 - 3x " + pm(c) + "$?", roots, "Lokales Maximum bei $x = -1$ mit Wert $" + (2 + c) + "$, Minimum bei $x = 1$ mit Wert $" + (-2 + c) + "$. " + (roots === 3 ? "Vorzeichenwechsel zwischen ihnen: drei Nullstellen (Zwischenwertsatz)." : roots === 2 ? "Ein Extremwert ist genau $0$: eine doppelte und eine einfache Nullstelle." : "Beide Extremwerte haben dasselbe Vorzeichen: nur eine Nullstelle.")); }),
    KL(tf("Jede stetige Funktion $f: [0, 1] \\to [0, 1]$ hat einen Fixpunkt.", true, "$g(x) = f(x) - x$ hat $g(0) \\ge 0$ und $g(1) \\le 0$, also eine Nullstelle.")),
    KL(tf("Jede stetige Funktion auf $(0, 1)$ nimmt ein Maximum an.", false, "$f(x) = x$ hat kein Maximum auf $(0, 1)$. Der Satz vom Maximum braucht ein kompaktes Intervall $[a, b]$.")),
    KL(tf("Eine stetige, injektive Funktion auf einem Intervall ist streng monoton.", true, "Gäbe es $a < b < c$ mit $f(b)$ nicht zwischen $f(a)$ und $f(c)$, würde der Zwischenwertsatz einen Wert zweimal liefern.")),
    EX(tf("Jede stetige Funktion $f: [0, 1] \\to \\mathbb{R}$ mit $f(0) = f(1)$ hat eine waagrechte Sehne der Länge $\\tfrac12$: Es gibt $x$ mit $f(x) = f(x + \\tfrac12)$.", true, "$g(x) = f(x + \\tfrac12) - f(x)$ auf $[0, \\tfrac12]$: $g(0) + g(\\tfrac12) = f(1) - f(0) = 0$, also hat $g$ eine Nullstelle.")),
    EX(tf("Jede solche Funktion hat auch eine waagrechte Sehne der Länge $0{,}4$.", false, "Satz von Lévy: Garantiert sind genau die Längen $\\tfrac1n$. Für alle anderen Längen gibt es Gegenbeispiele, etwa $f(x) = \\sin^2(\\pi x/0{,}4) - x\\sin^2(\\pi/0{,}4)$.")),
    EX(tf("Zu jeder Zeit gibt es auf dem Äquator zwei gegenüberliegende Punkte mit gleicher Temperatur (Temperatur stetig).", true, "$g(\\varphi) = T(\\varphi) - T(\\varphi + \\pi)$ erfüllt $g(\\varphi + \\pi) = -g(\\varphi)$; ein Vorzeichenwechsel erzwingt eine Nullstelle.")),
  ]);

  deepen("ana-ableitung", [], [
    KL((lv, G) => { const a = G.int(1, 4), x0 = G.int(-2, 2), y0 = x0 * x0 * x0 + a * x0; return dec("$f(x) = x^3 + " + a + "x$ ist streng monoton. Berechne $(f^{-1})'(" + y0 + ")$ (vier Nachkommastellen).", 1 / (3 * x0 * x0 + a), 4, "$f(" + x0 + ") = " + y0 + "$, und $(f^{-1})'(f(x_0)) = \\tfrac{1}{f'(x_0)} = \\tfrac{1}{3 \\cdot " + par(x0) + "^2 + " + a + "} = \\tfrac{1}{" + (3 * x0 * x0 + a) + "}$."); }),
    KL(tf("$f(x) = x|x|$ ist in $0$ differenzierbar.", true, "$\\tfrac{f(h) - f(0)}{h} = |h| \\to 0$. Die Ableitung ist $2|x|$, stetig, aber selbst in $0$ nicht differenzierbar.")),
    KL(tf("$f(x) = x\\sin\\tfrac1x$, $f(0) = 0$, ist in $0$ differenzierbar.", false, "Der Differenzenquotient $\\sin\\tfrac1h$ hat keinen Grenzwert. Stetig ist $f$ in $0$ trotzdem ($|f(x)| \\le |x|$).")),
    KL(nu("Berechne die Ableitung von $x^x$ an der Stelle $1$.", 1, "$x^x = e^{x\\ln x}$, Ableitung $x^x(\\ln x + 1)$, bei $x = 1$: $1 \\cdot (0 + 1) = 1$.")),
    EX(tf("$f(x) = x^2\\sin\\tfrac1x$, $f(0) = 0$, ist überall differenzierbar, aber $f'$ ist in $0$ nicht stetig.", true, "$f'(0) = \\lim h\\sin\\tfrac1h = 0$. Für $x \\ne 0$: $f'(x) = 2x\\sin\\tfrac1x - \\cos\\tfrac1x$, und $\\cos\\tfrac1x$ hat in $0$ keinen Grenzwert.")),
    EX(tf("Es gibt stetige Funktionen, die nirgends differenzierbar sind.", true, "Weierstraß: $\\sum a^n\\cos(b^n\\pi x)$ mit $0 < a < 1$ und großem ungeradem $b$. Im Sinne der Kategorie sind sogar »fast alle« stetigen Funktionen so.")),
    EX(tf("Ist $f'(a) > 0$, so wächst $f$ in einer Umgebung von $a$ monoton.", false, "$f(x) = x + 2x^2\\sin\\tfrac1x$: $f'(0) = 1$, aber $f'$ wird in jeder Umgebung von $0$ negativ. Erst stetiges $f' > 0$ erzwingt Monotonie nahe $a$.")),
  ]);

  deepen("ana-mws", [], [
    KL((lv, G) => { const t = G.pick(["sq", "cube"]); if (t === "sq") { const a = G.int(-3, 2), b = a + G.int(1, 4); return dec("Für $f(x) = x^2$ auf $[" + a + ", " + b + "]$: Bestimme die Zwischenstelle $\\xi$ aus dem Mittelwertsatz (zwei Nachkommastellen).", (a + b) / 2, 2, "$\\tfrac{f(" + b + ") - f(" + a + ")}{" + b + " - " + par(a) + "} = " + (a + b) + " = 2\\xi$, also $\\xi = " + G.tex((a + b) / 2, 2) + "$, genau die Mitte."); } const b = G.int(1, 4); return dec("Für $f(x) = x^3$ auf $[0, " + b + "]$: Bestimme $\\xi$ aus dem Mittelwertsatz (drei Nachkommastellen).", b / Math.sqrt(3), 3, "$\\tfrac{" + b + "^3}{" + b + "} = " + b * b + " = 3\\xi^2$, also $\\xi = \\tfrac{" + b + "}{\\sqrt3}$."); }),
    KL(tf("Ist $f' = 0$ auf $\\mathbb{R}\\setminus\\{0\\}$, so ist $f$ dort konstant.", false, "$\\mathbb{R}\\setminus\\{0\\}$ ist kein Intervall: $f = \\operatorname{sgn}$ hat Ableitung $0$ und zwei Werte. Der Mittelwertsatz braucht ein Intervall.")),
    KL(tf("$|\\sin x - \\sin y| \\le |x - y|$ für alle reellen $x, y$.", true, "Mittelwertsatz: $\\sin x - \\sin y = \\cos\\xi\\,(x - y)$ und $|\\cos\\xi| \\le 1$.")),
    KL((lv, G) => { const a = G.int(1, 4); return nu("Bestimme die kleinste Lipschitz-Konstante von $f(x) = x^3$ auf $[-" + a + ", " + a + "]$.", 3 * a * a, "Nach dem Mittelwertsatz ist die beste Konstante $\\sup|f'| = \\sup 3x^2 = " + 3 * a * a + "$."); }),
    EX(tf("Ableitungen haben die Zwischenwerteigenschaft, auch wenn sie nicht stetig sind.", true, "Satz von Darboux. Deshalb ist zum Beispiel $\\operatorname{sgn}$ keine Ableitung, obwohl sie nur einen Sprung hat.")),
    EX(tf("Ist $f$ differenzierbar mit $f'(x) \\to L$ für $x \\to \\infty$ und $f(x)/x \\to c$, so ist $c = L$.", true, "Mittelwertsatz auf $[x_0, x]$: $\\tfrac{f(x) - f(x_0)}{x - x_0} = f'(\\xi) \\to L$, und $\\tfrac{f(x)}{x}$ hat denselben Grenzwert.")),
    EX(tf("Ist $f$ auf $[a, b]$ differenzierbar mit $f'(a) < 0 < f'(b)$, so hat $f'$ eine Nullstelle in $(a, b)$.", true, "$f$ nimmt auf $[a, b]$ ein Minimum an, wegen der Vorzeichen nicht am Rand, also im Innern, und dort ist $f' = 0$. Das ist der Kern des Darboux-Beweises.")),
  ]);

  // ================================================================ integration
  deepen("ana-integral", [], [
    KL((lv, G) => { const n = G.pick([2, 4, 5, 10, 20]); const Un = ((n + 1) * (2 * n + 1)) / (6 * n * n); return dec("Berechne die Obersumme von $x^2$ auf $[0, 1]$ bei $" + n + "$ gleichen Teilen (vier Nachkommastellen).", Un, 4, "$U_n = \\tfrac1n\\sum_{k=1}^n \\bigl(\\tfrac kn\\bigr)^2 = \\tfrac{(n + 1)(2n + 1)}{6n^2}$, für $n = " + n + "$ also $" + G.tex(Un, 4) + "$; für $n \\to \\infty$ gegen $\\tfrac13$."); }),
    KL(tf("Jede monotone Funktion auf $[a, b]$ ist Riemann-integrierbar.", true, "Bei $n$ gleichen Teilen ist $U - L = \\tfrac{b - a}{n}|f(b) - f(a)|$, eine Teleskopsumme. Monotone Funktionen dürfen sogar abzählbar viele Sprünge haben.")),
    KL(tf("Die Dirichlet-Funktion ($1$ auf $\\mathbb{Q}$, $0$ sonst) ist auf $[0, 1]$ Riemann-integrierbar.", false, "Jede Obersumme ist $1$, jede Untersumme $0$.")),
    KL(tf("Ist $f$ integrierbar, so auch $|f|$, und $\\bigl|\\int f\\bigr| \\le \\int|f|$.", true, "$\\bigl||f(x)| - |f(y)|\\bigr| \\le |f(x) - f(y)|$, die Schwankung von $|f|$ ist nicht größer. Die Umkehrung gilt nicht.")),
    EX(tf("Ist $|f|$ integrierbar, so ist $f$ integrierbar.", false, "$f = 1$ auf $\\mathbb{Q}$, $-1$ sonst: $|f| = 1$, $f$ nicht integrierbar.")),
    EX(tf("Die Thomae-Funktion ($\\tfrac1q$ bei $\\tfrac pq$, $0$ sonst) ist auf $[0, 1]$ integrierbar mit Integral $0$.", true, "Zu $\\varepsilon$ gibt es nur endlich viele Stellen mit $f > \\varepsilon$; sie lassen sich in Teilintervalle beliebig kleiner Gesamtlänge packen. Integrierbar trotz unendlich vieler Unstetigkeiten.")),
    EX(tf("Ist $f$ integrierbar und $g$ stetig, so ist $g \\circ f$ integrierbar.", true, "$g$ ist auf dem kompakten Wertebereich gleichmäßig stetig; kleine Schwankungen von $f$ bleiben klein. Die Reihenfolge ist wichtig: $f \\circ g$ kann scheitern.")),
    EX(tf("Eine Funktion auf $[a, b]$ ist genau dann Riemann-integrierbar, wenn sie beschränkt ist und ihre Unstetigkeitsstellen eine Nullmenge bilden.", true, "Kriterium von Lebesgue. Die Thomae-Funktion ist unstetig auf $\\mathbb{Q}$, einer Nullmenge; die Dirichlet-Funktion überall.")),
  ]);

  deepen("ana-hauptsatz", [], [
    KL((lv, G) => { const c = G.int(-3, 3), x0 = G.int(1, 3); return nu("$F(x) = \\int_0^{x^2} (t " + pm(c) + ")\\,dt$. Berechne $F'(" + x0 + ")$.", 2 * x0 * (x0 * x0 + c), "Hauptsatz und Kettenregel: $F'(x) = (x^2 " + pm(c) + ") \\cdot 2x$, bei $x = " + x0 + "$: $" + (x0 * x0 + c) + " \\cdot " + 2 * x0 + " = " + 2 * x0 * (x0 * x0 + c) + "$."); }),
    KL(tf("Jede stetige Funktion auf einem Intervall hat eine Stammfunktion.", true, "$F(x) = \\int_a^x f(t)\\,dt$, nach dem Hauptsatz ist $F' = f$.")),
    KL(tf("Jede Riemann-integrierbare Funktion hat eine Stammfunktion.", false, "$\\operatorname{sgn}$ auf $[-1, 1]$ ist integrierbar, aber keine Ableitung (Darboux: Ableitungen springen nicht).")),
    KL(nu("Bestimme $\\lim_{x \\to 0} \\tfrac1x\\int_0^x e^{t^2}\\,dt$.", 1, "Mittelwert des Integranden über $[0, x]$, und der Integrand ist stetig mit Wert $1$ bei $0$. Oder: Hauptsatz, $F'(0) = e^0 = 1$.")),
    EX(tf("$F(x) = \\int_0^x |t|\\,dt$ ist überall differenzierbar.", true, "Der Integrand ist stetig, also $F' = |x|$. Integrieren glättet, Ableiten raut auf.")),
    EX(tf("Ist $f$ integrierbar, so ist $F(x) = \\int_a^x f$ stetig, sogar Lipschitz-stetig.", true, "$|F(x) - F(y)| \\le \\sup|f| \\cdot |x - y|$. Differenzierbar ist $F$ nur dort, wo $f$ stetig ist (sicher).")),
    EX(dec("Berechne $\\int_0^1 x^x\\,dx$ mit der Reihe $\\sum_{n \\ge 1} (-1)^{n+1}n^{-n}$ (vier Nachkommastellen).", 0.78343051, 4, "»Sophomore's dream«: $x^x = \\sum\\tfrac{(x\\ln x)^k}{k!}$, und $\\int_0^1 (x\\ln x)^k\\,dx = \\tfrac{(-1)^kk!}{(k + 1)^{k+1}}$. Ergebnis $1 - \\tfrac14 + \\tfrac{1}{27} - \\tfrac{1}{256} + \\dots \\approx 0{,}7834$.")),
  ]);

  deepen("ana-taylor", [], [
    KL((lv, G) => { const n = G.int(2, 6); let s = 0; for (let k = 0; k <= n; k++) s += 1 / fact(k); return dec("Werte das Taylorpolynom vom Grad $" + n + "$ von $e^x$ um $0$ bei $x = 1$ aus (vier Nachkommastellen).", s, 4, "$\\sum_{k=0}^{" + n + "}\\tfrac{1}{k!} \\approx " + G.tex(s, 4) + "$; Abstand zu $e$ höchstens $\\tfrac{3}{" + (n + 1) + "!}$."); }),
    KL((lv, G) => { const k = G.pick([3, 4, 6]); let n = 0; while (3 / fact(n + 1) >= Math.pow(10, -k)) n++; return nu("Wie groß muss der Grad $n$ mindestens sein, damit das Restglied $\\tfrac{3}{(n + 1)!}$ der Taylorentwicklung von $e$ kleiner als $10^{-" + k + "}$ ist?", n, "$\\tfrac{3}{" + (n + 1) + "!} \\approx " + G.tex(3 / fact(n + 1), 7) + " < 10^{-" + k + "}$, für $n - 1$ noch nicht. Fakultäten wachsen so schnell, dass wenige Glieder reichen."); }),
    KL(dec("Schätze den Fehler von $\\sin x \\approx x - \\tfrac{x^3}{6}$ bei $x = \\tfrac12$ nach Lagrange ab (Schranke $\\tfrac{|x|^5}{5!}$, sechs Nachkommastellen).", Math.pow(0.5, 5) / 120, 6, "Das nächste nichtverschwindende Glied ist $x^5/5!$, und $|\\sin^{(5)}| \\le 1$: $\\tfrac{(1/2)^5}{120} \\approx 0{,}00026$.")),
    KL(nu("Bestimme $f^{(5)}(0)$ für $f(x) = \\tfrac{1}{1 - x}$.", 120, "Die Taylorreihe ist $\\sum x^n$, also $\\tfrac{f^{(5)}(0)}{5!} = 1$ und $f^{(5)}(0) = 120$. Koeffizienten vergleichen statt fünfmal ableiten.")),
    EX(tf("Die Taylorreihe von $f(x) = e^{-1/x^2}$ ($f(0) = 0$) um $0$ ist die Nullreihe.", true, "Alle Ableitungen in $0$ verschwinden, weil $e^{-1/x^2}$ schneller gegen $0$ geht als jede Potenz von $x$. Die Reihe konvergiert überall, stellt $f$ aber nur in $0$ dar.")),
    EX(nu("Bestimme $f^{(10)}(0)$ für $f(x) = x^2\\cos x$.", 90, "$x^2\\cos x = \\sum_k (-1)^k\\tfrac{x^{2k+2}}{(2k)!}$. Der Koeffizient von $x^{10}$ gehört zu $k = 4$ und ist $\\tfrac{(-1)^4}{8!} = \\tfrac{1}{8!}$. Also $f^{(10)}(0) = \\tfrac{10!}{8!} = 90$. Zehnmal ableiten wäre mühsam, Koeffizientenvergleich nicht.")),
    EX(tf("Ist $f$ unendlich oft differenzierbar und konvergiert die Taylorreihe überall, so stellt sie $f$ dar.", false, "Siehe $e^{-1/x^2}$: Konvergenz der Reihe genügt nicht, das Restglied muss gegen $0$ gehen.")),
  ]);

  deepen("ana-glm", [], [
    KL(tf("$f_n(x) = x^n$ konvergiert auf $[0, 1]$ gleichmäßig.", false, "Der punktweise Limes ist $0$ auf $[0, 1)$ und $1$ in $1$, unstetig. Gleichmäßige Grenzwerte stetiger Funktionen sind stetig.")),
    KL((lv, G) => { const q = G.pick([0.5, 0.75, 0.9]), n = G.pick([5, 10, 20]); return dec("Bestimme $\\sup_{x \\in [0, " + G.tex(q, 2) + "]} |x^{" + n + "}|$ (sechs Nachkommastellen).", Math.pow(q, n), 6, "Maximum am rechten Rand: $" + G.tex(q, 2) + "^{" + n + "} \\approx " + G.tex(Math.pow(q, n), 6) + "$. Weil das gegen $0$ geht, konvergiert $x^n$ auf $[0, " + G.tex(q, 2) + "]$ gleichmäßig."); }),
    KL(tf("Der gleichmäßige Grenzwert stetiger Funktionen ist stetig.", true, "$\\varepsilon/3$-Argument: $|f(x) - f(y)| \\le |f - f_n|(x) + |f_n(x) - f_n(y)| + |f_n - f|(y)$.")),
    KL(tf("Konvergiert $f_n \\to f$ gleichmäßig auf $[a, b]$, so gilt $\\int f_n \\to \\int f$.", true, "$\\bigl|\\int f_n - \\int f\\bigr| \\le (b - a)\\sup|f_n - f| \\to 0$. Bei nur punktweiser Konvergenz falsch: »Wanderbuckel« $n^2x(1 - x^2)^n$.")),
    EX(tf("Konvergiert $f_n \\to f$ gleichmäßig und sind alle $f_n$ differenzierbar, so ist $f$ differenzierbar.", false, "$f_n(x) = \\sqrt{x^2 + \\tfrac1n} \\to |x|$ gleichmäßig. Für Ableitungen braucht man gleichmäßige Konvergenz der **Ableitungen**.")),
    EX(tf("Konvergiert eine monotone Folge stetiger Funktionen auf $[a, b]$ punktweise gegen eine stetige Funktion, so konvergiert sie gleichmäßig.", true, "Satz von Dini. Kompaktheit und Monotonie machen aus punktweiser gleichmäßige Konvergenz.")),
    EX(tf("Jede stetige Funktion auf $[a, b]$ ist gleichmäßiger Grenzwert von Polynomen.", true, "Weierstraßscher Approximationssatz, zum Beispiel mit Bernstein-Polynomen.")),
  ]);

  // ================================================================ errors
  if (has("ana-fehler")) {
    demote("ana-fehler");
    expert("ana-fehler", [
      KL(sp("Eine »Rechnung«. Welche Zeile ist falsch?", [["$\\lim_{n \\to \\infty} \\bigl(1 + \\tfrac1n\\bigr)^n$ hat die Form $1^\\infty$.", "Richtig beschrieben."], ["Die Basis geht gegen $1$.", "Stimmt."], ["Also ist der Grenzwert $1^\\infty = 1$.", "Falsch: Man darf Grenzwerte nicht getrennt in Basis und Exponent bilden. Der Grenzwert ist $e$."], ["Ebenso $\\lim (1 + \\tfrac2n)^n$.", "Dieser ist $e^2$."]], 2, "»$1^\\infty$« ist ein unbestimmter Ausdruck. Man schreibt $\\exp(n\\ln(1 + \\tfrac1n))$ und untersucht den Exponenten.")),
      KL(sp("»Beweis«, dass $1 - 1 + 1 - 1 + \\dots = 0$. Welche Zeile ist falsch?", [["$S = 1 - 1 + 1 - 1 + \\dots$", "Ein Name für den Ausdruck."], ["Klammern: $S = (1 - 1) + (1 - 1) + \\dots$", "Falsch: Klammern setzen ist nur bei konvergenten Reihen erlaubt. Die Partialsummen springen zwischen $1$ und $0$, $S$ existiert nicht."], ["Also $S = 0 + 0 + \\dots = 0$.", "Folgt aus der falschen Zeile."], ["Genauso $S = 1 + (-1 + 1) + \\dots = 1$.", "Derselbe Fehler, mit anderem Ergebnis: ein Zeichen, dass etwas nicht stimmt."]], 1, "Bei divergenten Reihen ändern Klammern das Ergebnis.")),
      KL(sp("$\\lim_{x \\to 0}\\tfrac{x + \\sin x}{x}$. Welche Zeile ist falsch?", [["Zähler und Nenner gehen gegen $0$.", "Stimmt."], ["L'Hospital: $\\lim \\tfrac{1 + \\cos x}{1} = 2$.", "Hier erlaubt und richtig."], ["Für $x \\to \\infty$: $\\lim\\tfrac{x + \\sin x}{x} = \\lim\\tfrac{1 + \\cos x}{1}$ existiert nicht, also existiert der Grenzwert nicht.", "Falsch: L'Hospital ist nur eine hinreichende Bedingung. Existiert der Quotient der Ableitungen nicht, sagt die Regel nichts. Hier ist $\\tfrac{x + \\sin x}{x} = 1 + \\tfrac{\\sin x}{x} \\to 1$."], ["Für $x \\to \\infty$ ist der Grenzwert $1$.", "Richtig."]], 2, "L'Hospital: Wenn der Quotient der Ableitungen konvergiert, dann auch der ursprüngliche. Nicht umgekehrt.")),
      EX(sp("»Beweis«, dass $\\int_{-1}^1 \\tfrac{dx}{x^2} = -2$. Welche Zeile ist falsch?", [["Eine Stammfunktion von $\\tfrac{1}{x^2}$ ist $-\\tfrac1x$.", "Stimmt auf $(-\\infty, 0)$ und $(0, \\infty)$ einzeln."], ["Hauptsatz: $\\int_{-1}^1 \\tfrac{dx}{x^2} = \\bigl[-\\tfrac1x\\bigr]_{-1}^1 = -1 - 1 = -2$.", "Falsch: Der Hauptsatz verlangt eine stetige Funktion auf dem ganzen Intervall. $\\tfrac{1}{x^2}$ ist bei $0$ unbeschränkt; das uneigentliche Integral divergiert gegen $+\\infty$."], ["Ein negatives Ergebnis ist bei positivem Integranden unmöglich.", "Diese Zeile entlarvt den Fehler."]], 1, "Erst die Voraussetzungen prüfen, dann den Hauptsatz anwenden.")),
      EX(sp("»Beweis«, dass jede stetige Funktion auf $\\mathbb{R}$ beschränkt ist. Welche Zeile ist falsch?", [["Sei $f$ stetig auf $\\mathbb{R}$.", "Ausgangspunkt."], ["Auf jedem Intervall $[-n, n]$ ist $f$ beschränkt, etwa durch $M_n$.", "Richtig (Satz vom Maximum)."], ["Also ist $f$ durch $M = \\sup_n M_n$ beschränkt.", "Falsch: $\\sup_n M_n$ kann $\\infty$ sein, etwa bei $f(x) = x$ mit $M_n = n$."], ["Damit ist $f$ beschränkt.", "Folgt nur aus der falschen Zeile."]], 2, "Unendlich viele Schranken ergeben nicht unbedingt eine gemeinsame.")),
      EX(sp("»Beweis«, dass $0 = 1$ über Reihen. Welche Zeile ist falsch?", [["$\\ln 2 = 1 - \\tfrac12 + \\tfrac13 - \\tfrac14 + \\dots$", "Richtig (Leibniz-Reihe)."], ["Umordnen: je ein positives Glied, dann zwei negative: $(1 - \\tfrac12) - \\tfrac14 + (\\tfrac13 - \\tfrac16) - \\tfrac18 + \\dots$", "Erlaubt ist das Aufschreiben, aber nicht die Annahme, dass der Wert gleich bleibt."], ["Das ergibt $\\tfrac12(1 - \\tfrac12 + \\tfrac13 - \\dots) = \\tfrac12\\ln 2$, also $\\ln 2 = \\tfrac12\\ln 2$.", "Falsch: Die Reihe konvergiert nur bedingt, und Umordnen ändert dann den Wert (Riemannscher Umordnungssatz). $\\ln 2 = \\tfrac12 \\ln 2$ ist kein Widerspruch der Mathematik, sondern dieses Schritts."]], 2, "Nur absolut konvergente Reihen darf man umordnen.")),
    ]);
  }

  // ================================================================ new: limsup
  gen("ana-limsup", byLevels("Limes superior und inferior", {
    1: [(lv, G) => { const c = G.int(1, 5), d = G.int(-3, 3), top = G.chance(0.5); return nu("Bestimme $\\lim" + (top ? "\\sup" : "\\inf") + "_{n \\to \\infty} \\Bigl((-1)^n \\cdot " + c + " + \\tfrac{" + d + "}{n}\\Bigr)$.", top ? c : -c, "Gerade Glieder gehen gegen $" + c + "$, ungerade gegen $-" + c + "$. Das sind die beiden Häufungspunkte; der größte ist der Limes superior, der kleinste der Limes inferior."); }],
    2: [(lv, G) => { const k = G.pick([3, 4, 6]), c = G.int(1, 3), top = G.chance(0.5); const vals = range(0, 2 * k - 1).map((n) => c * Math.sin((n * Math.PI) / k)); const v = top ? Math.max(...vals) : Math.min(...vals); return dec("Bestimme $\\lim" + (top ? "\\sup" : "\\inf") + " " + (c === 1 ? "" : c) + "\\sin\\bigl(\\tfrac{n\\pi}{" + k + "}\\bigr)$ (zwei Nachkommastellen).", v, 2, "Die Folge ist periodisch, ihre Häufungspunkte sind ihre Werte; $\\limsup$ ist der größte, $\\liminf$ der kleinste: $" + G.tex(v, 2) + "$."); }],
    3: [(lv, G) => G.pick([
      tf("Für beschränkte Folgen gilt $\\limsup(a_n + b_n) \\le \\limsup a_n + \\limsup b_n$, und Gleichheit gilt nicht immer.", true, "$a_n = (-1)^n$, $b_n = -(-1)^n$: links $0$, rechts $2$. Die Gipfel der beiden Folgen müssen nicht zusammenfallen."),
      tf("$(a_n)$ konvergiert genau dann, wenn $\\limsup a_n = \\liminf a_n$ und beide endlich sind.", true, "Dann haben alle Teilfolgen denselben Häufungspunkt, und die Folge ist beschränkt."),
      tf("$\\limsup a_n$ ist das Supremum der Menge der Folgenglieder.", false, "Es ist der größte **Häufungspunkt**: $\\limsup \\tfrac{(-1)^n}{n} = 0$, aber $\\sup\\{\\tfrac{(-1)^n}{n}\\} = \\tfrac12$."),
      tf("$\\limsup(-a_n) = -\\liminf a_n$.", true, "Spiegeln vertauscht oben und unten."),
    ])],
    4: [
      KL(dec("Bestimme $\\limsup_{n \\to \\infty} \\tfrac{(-1)^n n}{n + 1}$ (zwei Nachkommastellen).", 1, 2, "Gerade Glieder $\\tfrac{n}{n+1} \\to 1$, ungerade gegen $-1$. Kein Glied erreicht $1$, trotzdem ist $1$ der Limes superior.")),
      KL(dec("$a_n = 2^n$ für gerade, $3^n$ für ungerade $n$. Bestimme $\\limsup\\sqrt[n]{a_n}$.", 3, 2, "Gerade Indizes liefern $2$, ungerade $3$; der größte Häufungspunkt ist $3$. Cauchy-Hadamard: Die Reihe $\\sum a_nx^n$ hat Radius $\\tfrac13$.")),
      KL(tf("Ist $\\limsup a_n < c$, so gilt $a_n < c$ für fast alle $n$.", true, "Gälte $a_n \\ge c$ unendlich oft, hätte die beschränkte Teilfolge einen Häufungspunkt $\\ge c$.")),
      KL(tf("Ist $\\limsup a_n > c$, so gilt $a_n > c$ für fast alle $n$.", false, "Nur für unendlich viele: $(-1)^n$ mit $c = 0$.")),
      EX(tf("$\\limsup_{n \\to \\infty} \\sin n = 1$.", true, "Die Werte $n \\bmod 2\\pi$ liegen dicht (weil $\\pi$ irrational ist), also kommt $\\sin n$ der $1$ beliebig nahe, ohne sie zu erreichen.")),
      EX(tf("Für positive Folgen gilt $\\limsup\\sqrt[n]{a_n} \\le \\limsup\\tfrac{a_{n+1}}{a_n}$.", true, "Ist $\\tfrac{a_{n+1}}{a_n} \\le q$ ab $N$, so ist $a_n \\le Cq^n$ und $\\sqrt[n]{a_n} \\le C^{1/n}q \\to q$. Deshalb ist das Wurzelkriterium stärker.")),
      EX(nu("Wie viele Häufungspunkte hat die Folge $a_n = n - 3\\lfloor n/3 \\rfloor + \\tfrac1n$?", 3, "$n - 3\\lfloor n/3\\rfloor$ ist der Rest von $n$ modulo $3$, also $0, 1, 2$; dazu ein Störterm, der gegen $0$ geht. Häufungspunkte $0, 1, 2$, $\\liminf = 0$, $\\limsup = 2$.")),
    ],
  }));

  // ================================================================ new: absolute convergence, rearrangement, Cauchy product
  gen("ana-absolut", byLevels("Absolute Konvergenz", {
    1: [(lv, G) => { const p = G.pick([0.5, 1, 1.5, 2, 3]), q = G.chance(0.5); return tf("$\\sum_{n \\ge 1} \\tfrac{(-1)^n}{n^{" + G.tex(p, 1) + "}}$ konvergiert " + (q ? "**absolut**" : "") + ".", q ? p > 1 : true, q ? (p > 1 ? "$\\sum\\tfrac{1}{n^p}$ konvergiert für $p > 1$." : "$\\sum\\tfrac{1}{n^p}$ divergiert für $p \\le 1$; die Reihe konvergiert nur bedingt (Leibniz).") : "Leibniz: Die Beträge fallen monoton gegen $0$."); }],
    2: [(lv, G) => { const N = G.pick([5, 9, 19, 99, 999]); return dec("Wie groß ist der Fehler höchstens, wenn man $\\sum_{n \\ge 1} \\tfrac{(-1)^{n+1}}{n}$ nach $" + N + "$ Gliedern abbricht? (sechs Nachkommastellen)", 1 / (N + 1), 6, "Leibniz-Abschätzung: Der Fehler ist höchstens das erste weggelassene Glied, $\\tfrac{1}{" + (N + 1) + "}$. Langsam: Für sechs Stellen von $\\ln 2$ bräuchte man eine Million Glieder."); }],
    3: [(lv, G) => G.pick([
      tf("Eine absolut konvergente Reihe darf man beliebig umordnen, ohne dass sich ihr Wert ändert.", true, "Positiv- und Negativteil konvergieren einzeln, und bei nichtnegativen Reihen ändert Umordnen nichts."),
      tf("Eine bedingt konvergente Reihe kann man so umordnen, dass sie gegen $17$ konvergiert.", true, "Riemannscher Umordnungssatz: Positiv- und Negativteil divergieren beide. Nimm positive Glieder, bis $17$ überschritten ist, dann negative, bis es unterschritten ist, und so weiter."),
      tf("Jede konvergente Reihe ist absolut konvergent.", false, "$\\sum\\tfrac{(-1)^n}{n}$ konvergiert, $\\sum\\tfrac1n$ nicht."),
      tf("Jede absolut konvergente Reihe ist konvergent.", true, "Cauchy-Kriterium: $|\\sum_{k=m}^n a_k| \\le \\sum_{k=m}^n |a_k|$."),
    ])],
    4: [
      KL(dec("Berechne $\\sum_{n \\ge 1} \\tfrac{(-1)^{n+1}}{n}$ (vier Nachkommastellen).", Math.LN2, 4, "Die alternierende harmonische Reihe ist $\\ln 2$: Integriere $\\tfrac{1}{1 + x} = \\sum(-x)^n$ von $0$ bis $1$ (Abelscher Grenzwertsatz).")),
      KL(tf("Das Cauchy-Produkt zweier absolut konvergenter Reihen konvergiert gegen das Produkt ihrer Werte.", true, "Satz von Mertens/Cauchy. Daraus folgt $\\exp(x + y) = \\exp x\\exp y$.")),
      KL(tf("Das Cauchy-Produkt zweier konvergenter Reihen konvergiert immer.", false, "$\\sum\\tfrac{(-1)^n}{\\sqrt{n + 1}}$ mit sich selbst: Die Glieder des Produkts haben Betrag $\\sum_k\\tfrac{1}{\\sqrt{(k + 1)(n - k + 1)}} \\ge 1$ und gehen nicht gegen $0$.")),
      KL(nu("Wie viele Glieder der Reihe $\\sum\\tfrac{(-1)^{n+1}}{n^2}$ braucht man nach Leibniz höchstens, damit der Fehler kleiner als $10^{-4}$ ist?", 100, "Fehler $\\le \\tfrac{1}{(N + 1)^2} < 10^{-4}$ heißt $N + 1 > 100$, also $N \\ge 100$. Mit $N = 99$ ist die Schranke genau $10^{-4}$, nicht kleiner.")),
      EX(dec("Ordnet man $1 - \\tfrac12 + \\tfrac13 - \\dots$ so um, dass auf ein positives Glied zwei negative folgen, welchen Wert hat die neue Reihe? (vier Nachkommastellen)", Math.LN2 / 2, 4, "$(1 - \\tfrac12) - \\tfrac14 + (\\tfrac13 - \\tfrac16) - \\tfrac18 + \\dots = \\tfrac12(1 - \\tfrac12 + \\tfrac13 - \\dots) = \\tfrac12\\ln 2$. Dieselben Glieder, halber Wert.")),
      EX(dec("Welchen Wert hat die Umordnung mit zwei positiven und dann einem negativen Glied: $1 + \\tfrac13 - \\tfrac12 + \\tfrac15 + \\tfrac17 - \\tfrac14 + \\dots$? (vier Nachkommastellen)", 1.5 * Math.LN2, 4, "Allgemein liefert die Umordnung mit $p$ positiven und $q$ negativen Gliedern im Wechsel $\\ln 2 + \\tfrac12\\ln\\tfrac pq$. Hier $\\ln 2 + \\tfrac12\\ln 2 = \\tfrac32\\ln 2$.")),
      EX(tf("Konvergiert jede Umordnung von $\\sum a_n$, so konvergiert $\\sum a_n$ absolut.", true, "Kontraposition des Riemannschen Umordnungssatzes: Bei bedingter Konvergenz gibt es divergente Umordnungen.")),
    ],
  }));

  // ================================================================ new: uniform continuity and compactness
  const GLM = [
    { md: "$\\sqrt x$ auf $[0, \\infty)$", ok: true, why: "$|\\sqrt x - \\sqrt y| \\le \\sqrt{|x - y|}$: mit $\\delta = \\varepsilon^2$ gleichmäßig stetig, aber nicht Lipschitz (unendliche Steigung bei $0$)." },
    { md: "$x^2$ auf $\\mathbb{R}$", ok: false, why: "$(x + \\tfrac1x)^2 - x^2 = 2 + \\tfrac{1}{x^2} > 2$: Punkte im Abstand $\\tfrac1x$ haben Bilder mit Abstand $> 2$." },
    { md: "$x^2$ auf $[0, 5]$", ok: true, why: "Stetig auf einem kompakten Intervall: Satz von Heine. Lipschitz mit Konstante $10$." },
    { md: "$\\tfrac1x$ auf $(0, 1]$", ok: false, why: "Nahe $0$ wird sie beliebig steil: $\\tfrac1{1/n} - \\tfrac{1}{1/(n+1)} = -1$ bei Abstand $\\tfrac{1}{n(n+1)} \\to 0$." },
    { md: "$\\sin x$ auf $\\mathbb{R}$", ok: true, why: "Lipschitz mit Konstante $1$." },
    { md: "$\\sin(x^2)$ auf $\\mathbb{R}$", ok: false, why: "Die Schwingungen werden immer schneller: $\\sqrt{2\\pi n + \\pi/2}$ und $\\sqrt{2\\pi n}$ liegen beliebig nah, die Werte sind $1$ und $0$." },
    { md: "$\\arctan x$ auf $\\mathbb{R}$", ok: true, why: "Ableitung $\\tfrac{1}{1 + x^2} \\le 1$: Lipschitz." },
    { md: "$x\\sin x$ auf $\\mathbb{R}$", ok: false, why: "Die Amplitude wächst, und mit ihr die Steigung an den Nullstellen." },
  ];
  gen("ana-glstetig", byLevels("Gleichmäßige Stetigkeit", {
    1: [(lv, G) => { const s = G.pick(GLM); return tf(s.md + " ist gleichmäßig stetig.", s.ok, s.why); }],
    2: [(lv, G) => { const a = G.int(1, 6); return nu("Bestimme die kleinste Lipschitz-Konstante von $f(x) = x^2$ auf $[0, " + a + "]$.", 2 * a, "$|x^2 - y^2| = |x + y||x - y| \\le " + 2 * a + "|x - y|$, und nahe $" + a + "$ wird die Konstante erreicht: $\\sup|f'| = " + 2 * a + "$."); }],
    3: [(lv, G) => { const a = G.int(1, 5), k = G.pick([10, 100, 1000]); return dec("$f(x) = x^2$ auf $[0, " + a + "]$, $\\varepsilon = \\tfrac{1}{" + k + "}$. Welches größte $\\delta$ garantiert über die Lipschitz-Abschätzung $|f(x) - f(y)| < \\varepsilon$ für $|x - y| < \\delta$? (sechs Nachkommastellen)", 1 / (k * 2 * a), 6, "$|f(x) - f(y)| \\le " + 2 * a + "|x - y| < " + 2 * a + "\\delta \\le \\varepsilon$ für $\\delta = \\tfrac{\\varepsilon}{" + 2 * a + "}$. Ein $\\delta$ für alle Stellen: Das ist gleichmäßige Stetigkeit."); }],
    4: [
      KL(tf("Jede stetige Funktion auf $[a, b]$ ist gleichmäßig stetig.", true, "Satz von Heine. Beweis indirekt: Sonst gäbe es $x_n, y_n$ mit $|x_n - y_n| \\to 0$ und $|f(x_n) - f(y_n)| \\ge \\varepsilon$; eine konvergente Teilfolge (Bolzano-Weierstraß) führt zum Widerspruch mit der Stetigkeit am Grenzwert.")),
      KL(tf("Eine gleichmäßig stetige Funktion auf $(0, 1)$ lässt sich stetig auf $[0, 1]$ fortsetzen.", true, "Sie bildet Cauchy-Folgen auf Cauchy-Folgen ab, also existieren die Grenzwerte an den Rändern. Deshalb ist $\\tfrac1x$ auf $(0, 1)$ nicht gleichmäßig stetig.")),
      KL(tf("Jede Lipschitz-stetige Funktion ist gleichmäßig stetig, aber nicht umgekehrt.", true, "Lipschitz: $\\delta = \\varepsilon/L$. Gegenbeispiel zur Umkehrung: $\\sqrt x$ auf $[0, 1]$.")),
      KL(tf("Ist $f$ auf $[0, 1]$ und auf $[1, 2]$ gleichmäßig stetig, so auch auf $[0, 2]$.", true, "Auf kompakten Intervallen sogar trivial (Heine). Allgemein: Ein gemeinsames $\\delta$ und die Stetigkeit bei $1$ setzen die Stücke zusammen.")),
      EX(tf("Ist $f: [0, \\infty) \\to \\mathbb{R}$ stetig und existiert $\\lim_{x \\to \\infty} f(x)$, so ist $f$ gleichmäßig stetig.", true, "Ab einem $R$ schwankt $f$ um weniger als $\\varepsilon$; auf $[0, R + 1]$ greift Heine.")),
      EX(tf("Das Produkt zweier gleichmäßig stetiger Funktionen ist gleichmäßig stetig.", false, "$x \\cdot x = x^2$ auf $\\mathbb{R}$. Für **beschränkte** gleichmäßig stetige Funktionen stimmt es.")),
      EX(tf("Gleichmäßig stetige Funktionen $\\mathbb{R} \\to \\mathbb{R}$ wachsen höchstens linear: $|f(x)| \\le A + B|x|$.", true, "Mit $\\delta$ zu $\\varepsilon = 1$ legt man den Weg von $0$ nach $x$ in $\\lceil|x|/\\delta\\rceil$ Schritten zurück, jeder ändert $f$ um weniger als $1$.")),
    ],
  }));

  // ================================================================ new: inverse functions
  gen("ana-umkehr", byLevels("Umkehrfunktionen", {
    1: [(lv, G) => { const a = G.int(1, 4), b = G.int(-3, 3), x0 = G.int(-2, 2), y0 = a * x0 * x0 * x0 + x0 + b; return dec("$f(x) = " + (a === 1 ? "" : a) + "x^3 + x " + pm(b) + "$. Berechne $(f^{-1})'(" + y0 + ")$ (vier Nachkommastellen).", 1 / (3 * a * x0 * x0 + 1), 4, "$f(" + x0 + ") = " + y0 + "$, $f'(x) = " + 3 * a + "x^2 + 1$, also $(f^{-1})'(" + y0 + ") = \\tfrac{1}{f'(" + x0 + ")} = \\tfrac{1}{" + (3 * a * x0 * x0 + 1) + "}$."); }],
    2: [(lv, G) => { const k = G.pick(["asin", "atan", "ln"]); const x0 = { asin: 0.5, atan: G.pick([0, 1, 2]), ln: G.pick([1, 2, 4]) }[k]; const v = { asin: 1 / Math.sqrt(1 - x0 * x0), atan: 1 / (1 + x0 * x0), ln: 1 / x0 }[k]; const nm = { asin: "\\arcsin", atan: "\\arctan", ln: "\\ln" }[k]; const why = { asin: "$\\arcsin'(y) = \\tfrac{1}{\\cos(\\arcsin y)} = \\tfrac{1}{\\sqrt{1 - y^2}}$", atan: "$\\arctan'(y) = \\tfrac{1}{1 + \\tan^2(\\arctan y)} = \\tfrac{1}{1 + y^2}$", ln: "$\\ln'(y) = \\tfrac{1}{\\exp(\\ln y)} = \\tfrac1y$" }[k]; return dec("Berechne $" + nm + "'(" + G.tex(x0, 1) + ")$ (vier Nachkommastellen).", v, 4, why + ", hergeleitet aus der Formel für die Ableitung der Umkehrfunktion."); }],
    3: [(lv, G) => G.pick([
      tf("Die Umkehrfunktion einer stetigen, streng monotonen Funktion auf einem Intervall ist stetig.", true, "Sie ist monoton, und ihr Bild ist ein Intervall; monotone Funktionen mit Intervall als Bild springen nicht."),
      tf("Ist $f$ differenzierbar und bijektiv, so ist $f^{-1}$ überall differenzierbar.", false, "$f(x) = x^3$: $f^{-1}(y) = \\sqrt[3]y$ ist in $0$ nicht differenzierbar, weil $f'(0) = 0$."),
      tf("Ist $f$ streng monoton und differenzierbar mit $f'(x_0) \\ne 0$, so ist $f^{-1}$ in $f(x_0)$ differenzierbar.", true, "Und $(f^{-1})'(f(x_0)) = \\tfrac{1}{f'(x_0)}$: Die Tangente wird an der Winkelhalbierenden gespiegelt."),
      tf("Eine stetige, injektive Funktion $\\mathbb{R} \\to \\mathbb{R}$ hat eine stetige Umkehrfunktion auf ihrem Bild.", true, "Stetig und injektiv auf einem Intervall heißt streng monoton, und dann ist die Umkehrung stetig."),
    ])],
    4: [
      KL(dec("$f(x) = x + e^x$. Berechne $(f^{-1})'(1)$ (vier Nachkommastellen).", 0.5, 4, "$f(0) = 1$, $f'(0) = 1 + e^0 = 2$, also $(f^{-1})'(1) = \\tfrac12$. Die Umkehrfunktion selbst lässt sich nicht elementar hinschreiben (Lambert-W), ihre Ableitung trotzdem berechnen.")),
      KL(dec("Berechne die zweite Ableitung von $\\arctan$ an der Stelle $1$ (vier Nachkommastellen).", -0.5, 4, "$\\arctan'(y) = (1 + y^2)^{-1}$, also $\\arctan''(y) = -\\tfrac{2y}{(1 + y^2)^2}$, bei $1$: $-\\tfrac24 = -\\tfrac12$.")),
      KL(tf("Die Umkehrfunktion einer streng konvexen, wachsenden Funktion ist konkav.", true, "Spiegeln an der Winkelhalbierenden vertauscht oberhalb und unterhalb von Sekanten. Beispiel: $e^x$ und $\\ln$.")),
      EX(tf("Es gibt eine stetige, streng monotone Funktion $[0, 1] \\to [0, 1]$ mit $f'(x) = 0$ für fast alle $x$.", true, "Solche »singulären« Funktionen existieren (Minkowskis Fragezeichenfunktion ist ein Beispiel). Ihre Umkehrung ist dann an fast allen Stellen »unendlich steil«.")),
      EX(tf("Ist $f: \\mathbb{R} \\to \\mathbb{R}$ stetig mit $f(f(x)) = -x$ für alle $x$, so existiert $f$.", false, "Ein solches $f$ wäre injektiv, also streng monoton, und dann wäre $f \\circ f$ wachsend; $-x$ fällt aber. Es gibt keine solche stetige Funktion.")),
      EX(tf("$\\sinh$ ist bijektiv auf $\\mathbb{R}$ mit $\\operatorname{arsinh}(y) = \\ln\\bigl(y + \\sqrt{y^2 + 1}\\bigr)$.", true, "$\\sinh x = y$ heißt $e^x - e^{-x} = 2y$, quadratisch in $e^x$: $e^x = y + \\sqrt{y^2 + 1}$ (die positive Lösung).")),
    ],
  }));

  // ================================================================ new: L'Hospital
  gen("ana-hospital", byLevels("L'Hospital und Grenzwerte", {
    1: [(lv, G) => { const a = nz(G, -6, 6), b = nz(G, 1, 6); return dec("Bestimme $\\lim_{x \\to 0}\\tfrac{\\sin(" + a + "x)}{" + b + "x}$ (vier Nachkommastellen).", a / b, 4, "L'Hospital oder $\\tfrac{\\sin u}{u} \\to 1$: Grenzwert $\\tfrac{" + a + "}{" + b + "}$."); }],
    2: [(lv, G) => { const k = G.pick(["e", "cos", "log"]); const q = { e: ["\\dfrac{e^x - 1 - x}{x^2}", 0.5, "Zweimal L'Hospital: $\\tfrac{e^x - 1}{2x} \\to \\tfrac{e^x}{2} \\to \\tfrac12$. Oder Reihe: $e^x - 1 - x = \\tfrac{x^2}{2} + \\dots$"], cos: ["\\dfrac{1 - \\cos x}{x^2}", 0.5, "$1 - \\cos x = \\tfrac{x^2}{2} - \\dots$, also $\\tfrac12$."], log: ["\\dfrac{\\ln(1 + x) - x}{x^2}", -0.5, "$\\ln(1 + x) = x - \\tfrac{x^2}{2} + \\dots$, also $-\\tfrac12$."] }[k]; return dec("Bestimme $\\lim_{x \\to 0}" + q[0] + "$ (vier Nachkommastellen).", q[1], 4, q[2]); }],
    3: [(lv, G) => { const k = G.pick(["xlnx", "xx", "xpow"]); const q = { xlnx: ["\\lim_{x \\to 0^+} x\\ln x", 0, "$\\tfrac{\\ln x}{1/x}$, L'Hospital: $\\tfrac{1/x}{-1/x^2} = -x \\to 0$."], xx: ["\\lim_{x \\to 0^+} x^x", 1, "$x^x = e^{x\\ln x} \\to e^0 = 1$."], xpow: ["\\lim_{x \\to \\infty} x^{1/x}", 1, "$e^{\\ln x/x}$ und $\\tfrac{\\ln x}{x} \\to 0$."] }[k]; return nu("Bestimme $" + q[0] + "$.", q[1], q[2]); }],
    4: [
      KL(tf("$\\lim_{x \\to \\infty}\\tfrac{x + \\sin x}{x}$ existiert nicht, weil $\\lim\\tfrac{1 + \\cos x}{1}$ nicht existiert.", false, "L'Hospital ist nur hinreichend. Direkt: $1 + \\tfrac{\\sin x}{x} \\to 1$.")),
      KL(dec("Bestimme $\\lim_{x \\to 0}\\bigl(\\tfrac{1}{\\sin x} - \\tfrac1x\\bigr)$ (vier Nachkommastellen).", 0, 4, "$\\tfrac{x - \\sin x}{x\\sin x} \\approx \\tfrac{x^3/6}{x^2} \\to 0$.")),
      KL(dec("Bestimme $\\lim_{x \\to 0}\\tfrac{x - \\sin x}{x^3}$ (vier Nachkommastellen).", 1 / 6, 4, "Dreimal L'Hospital oder die Reihe $\\sin x = x - \\tfrac{x^3}{6} + \\dots$: $\\tfrac16$.")),
      KL(tf("Für $x \\to \\infty$ wächst $\\ln x$ langsamer als jede Potenz $x^\\alpha$ mit $\\alpha > 0$.", true, "$\\tfrac{\\ln x}{x^\\alpha} \\to \\tfrac{1/x}{\\alpha x^{\\alpha - 1}} = \\tfrac{1}{\\alpha x^\\alpha} \\to 0$.")),
      EX(dec("Bestimme $\\lim_{x \\to 0}\\bigl(\\tfrac{\\sin x}{x}\\bigr)^{1/x^2}$ (vier Nachkommastellen).", Math.exp(-1 / 6), 4, "$\\ln\\tfrac{\\sin x}{x} \\approx -\\tfrac{x^2}{6}$, geteilt durch $x^2$: $-\\tfrac16$. Grenzwert $e^{-1/6} \\approx 0{,}8465$.")),
      EX(dec("Bestimme $\\lim_{x \\to 0}\\tfrac{\\tan x - \\sin x}{x^3}$ (vier Nachkommastellen).", 0.5, 4, "$\\tan x = x + \\tfrac{x^3}{3} + \\dots$, $\\sin x = x - \\tfrac{x^3}{6} + \\dots$: Differenz $\\tfrac{x^3}{2}$. Wer $\\tan x - \\sin x \\approx x - x = 0$ rechnet, verliert alles.")),
      EX(tf("Ist $f'(x)/g'(x) \\to L$ für $x \\to a$ und gehen $f, g$ gegen $0$, so gilt $f/g \\to L$; die Umkehrung gilt nicht.", true, "Beweis über den verallgemeinerten Mittelwertsatz von Cauchy. Gegenbeispiel zur Umkehrung: $f(x) = x^2\\sin\\tfrac1x$, $g(x) = x$, $f/g \\to 0$, aber $f'/g'$ hat keinen Grenzwert.")),
    ],
  }));

  // ================================================================ new: convexity
  const CONV = [
    { md: "$x^2$ auf $\\mathbb{R}$", cat: "konvex", why: "$f'' = 2 > 0$." },
    { md: "$e^x$ auf $\\mathbb{R}$", cat: "konvex", why: "$f'' = e^x > 0$." },
    { md: "$\\ln x$ auf $(0, \\infty)$", cat: "konkav", why: "$f'' = -\\tfrac{1}{x^2} < 0$." },
    { md: "$\\sqrt x$ auf $(0, \\infty)$", cat: "konkav", why: "$f'' = -\\tfrac14x^{-3/2} < 0$." },
    { md: "$x^3$ auf $\\mathbb{R}$", cat: "weder noch", why: "$f'' = 6x$ wechselt das Vorzeichen bei $0$." },
    { md: "$|x|$ auf $\\mathbb{R}$", cat: "konvex", why: "Nicht differenzierbar, aber jede Sehne liegt über dem Graphen." },
    { md: "$\\sin x$ auf $[0, \\pi]$", cat: "konkav", why: "$f'' = -\\sin x \\le 0$ auf $[0, \\pi]$." },
    { md: "$\\tfrac1x$ auf $(0, \\infty)$", cat: "konvex", why: "$f'' = \\tfrac{2}{x^3} > 0$." },
  ];
  gen("ana-konvex", byLevels("Konvexität", {
    1: [(lv, G) => { const s = G.pick(CONV); return { type: "choice", md: s.md + " ist", options: [{ md: "konvex", correct: s.cat === "konvex", why: s.cat === "konvex" ? null : s.why }, { md: "konkav", correct: s.cat === "konkav", why: s.cat === "konkav" ? null : s.why }, { md: "weder noch", correct: s.cat === "weder noch", why: s.cat === "weder noch" ? null : s.why }], shuffle: false, explain: s.why }; }],
    2: [(lv, G) => { const a = nz(G, -3, 3); return nu("Wo hat $f(x) = x^3 " + pm(-3 * a) + "x^2 + 5x$ ihren Wendepunkt?", a, "$f''(x) = 6x " + pm(-6 * a) + "$ wechselt bei $x = " + a + "$ das Vorzeichen: Dort geht $f$ von konkav zu konvex über."); }],
    3: [(lv, G) => { const k = G.int(2, 6); return nu("Welchen größten Wert hat $xyz$ für $x, y, z \\ge 0$ mit $x + y + z = " + 3 * k + "$?", k * k * k, "AM-GM (eine Folge der Konkavität von $\\ln$): $\\sqrt[3]{xyz} \\le \\tfrac{x + y + z}{3} = " + k + "$, Gleichheit bei $x = y = z = " + k + "$. Maximum $" + k * k * k + "$."); }],
    4: [
      KL(tf("Eine konvexe Funktion auf einem offenen Intervall ist stetig.", true, "Die Steigungen der Sekanten sind monoton, das beschränkt die Differenzenquotienten auf jedem kleineren Intervall. Auf $[a, b]$ falsch: Am Rand darf sie springen.")),
      KL(tf("Ist $f$ konvex und differenzierbar, so liegt der Graph über jeder Tangente.", true, "$f(y) \\ge f(x) + f'(x)(y - x)$. Daraus folgen Ungleichungen wie $e^y \\ge 1 + y$.")),
      KL(tf("Eine konvexe Funktion auf $[a, b]$ nimmt ihr Maximum an einem Randpunkt an.", true, "Jeder Punkt ist $(1 - t)a + tb$, und $f$ liegt dort unter $\\max(f(a), f(b))$.")),
      KL(tf("Ein lokales Minimum einer konvexen Funktion ist ein globales.", true, "Läge irgendwo ein kleinerer Wert, läge die Sekante dorthin in jeder Nähe des lokalen Minimums unter dessen Wert.")),
      EX(tf("Für $x_1, \\dots, x_n > 0$ gilt $\\sqrt[n]{x_1\\cdots x_n} \\le \\tfrac{x_1 + \\dots + x_n}{n}$, und das folgt aus der Konkavität des Logarithmus.", true, "Jensen für das konkave $\\ln$: $\\tfrac1n\\sum\\ln x_i \\le \\ln\\bigl(\\tfrac1n\\sum x_i\\bigr)$, exponieren.")),
      EX(tf("Jede konvexe Funktion $\\mathbb{R} \\to \\mathbb{R}$ ist differenzierbar bis auf höchstens abzählbar viele Stellen.", true, "Links- und rechtsseitige Ableitung existieren überall und sind monoton; monotone Funktionen haben höchstens abzählbar viele Sprünge.")),
      EX(tf("Eine beschränkte konvexe Funktion auf $\\mathbb{R}$ ist konstant.", true, "Hätte sie irgendwo Steigung $\\ne 0$, läge der Graph über einer Tangente mit dieser Steigung und wäre in eine Richtung unbeschränkt.")),
    ],
  }));

  // ================================================================ new: improper integrals
  gen("ana-uneigentlich", byLevels("Uneigentliche Integrale", {
    1: [(lv, G) => { const p = G.pick([2, 3, 4, 1.5]); return dec("Berechne $\\int_1^\\infty \\tfrac{dx}{x^{" + G.tex(p, 1) + "}}$ (vier Nachkommastellen).", 1 / (p - 1), 4, "$\\bigl[\\tfrac{x^{1 - p}}{1 - p}\\bigr]_1^\\infty = \\tfrac{1}{p - 1}$, weil $x^{1-p} \\to 0$ für $p > 1$. Für $p \\le 1$ divergiert es."); }],
    2: [(lv, G) => { const p = G.pick([0.5, 0.25, 0.75]); return dec("Berechne $\\int_0^1 \\tfrac{dx}{x^{" + G.tex(p, 2) + "}}$ (vier Nachkommastellen).", 1 / (1 - p), 4, "$\\bigl[\\tfrac{x^{1 - p}}{1 - p}\\bigr]_0^1 = \\tfrac{1}{1 - p}$, endlich für $p < 1$. Bei $0$ kehrt sich die Bedingung um: Dort ist $p < 1$ nötig."); }],
    3: [(lv, G) => { const p = G.pick([0.5, 1, 1.5, 2, 3]), q = G.chance(0.5); return tf(q ? "$\\sum_{n \\ge 1} \\tfrac{1}{n^{" + G.tex(p, 1) + "}}$ konvergiert." : "$\\int_1^\\infty \\tfrac{dx}{x^{" + G.tex(p, 1) + "}}$ konvergiert.", p > 1, (q ? "Integralkriterium: Die Reihe konvergiert genau dann, wenn $\\int_1^\\infty x^{-p}\\,dx$ endlich ist." : "Stammfunktion $\\tfrac{x^{1-p}}{1-p}$ (oder $\\ln x$ für $p = 1$).") + " Das ist der Fall genau für $p > 1$."); }],
    4: [
      KL(nu("Berechne $\\int_0^\\infty x^3e^{-x}\\,dx$.", 6, "$\\Gamma(n + 1) = \\int_0^\\infty x^ne^{-x}\\,dx = n!$ (partielle Integration), hier $3! = 6$.")),
      KL(tf("$\\int_0^\\infty \\tfrac{\\sin x}{x}\\,dx$ konvergiert.", true, "Partielle Integration ab $1$: $\\bigl[-\\tfrac{\\cos x}{x}\\bigr] - \\int\\tfrac{\\cos x}{x^2}$, beides endlich. Der Wert ist $\\tfrac\\pi2$.")),
      KL(tf("$\\int_0^\\infty \\bigl|\\tfrac{\\sin x}{x}\\bigr|\\,dx$ konvergiert.", false, "Auf $[k\\pi, (k+1)\\pi]$ ist das Integral mindestens $\\tfrac{2}{(k + 1)\\pi}$, die Summe ist harmonisch.")),
      KL(dec("Berechne $\\int_{-\\infty}^{\\infty}\\tfrac{dx}{1 + x^2}$ (vier Nachkommastellen).", Math.PI, 4, "$[\\arctan x]_{-\\infty}^\\infty = \\tfrac\\pi2 - (-\\tfrac\\pi2) = \\pi$.")),
      EX(dec("Berechne $\\int_{-\\infty}^\\infty e^{-x^2}\\,dx$ (vier Nachkommastellen).", Math.sqrt(Math.PI), 4, "Quadrieren und in Polarkoordinaten rechnen: $\\int\\int e^{-(x^2 + y^2)} = \\int_0^{2\\pi}\\int_0^\\infty e^{-r^2}r\\,dr\\,d\\varphi = \\pi$. Also $\\sqrt\\pi \\approx 1{,}7725$.")),
      EX(tf("Konvergiert $\\int_1^\\infty f(x)\\,dx$ für stetiges $f$, so gilt $f(x) \\to 0$ für $x \\to \\infty$.", false, "Schmale Zacken der Höhe $1$ bei jeder ganzen Zahl $n$ mit Breite $2^{-n}$: Das Integral ist endlich, $f$ geht nicht gegen $0$. Anders als bei Reihen.")),
      EX(tf("$\\int_0^1 \\tfrac{\\ln x}{1 - x}\\,dx = -\\tfrac{\\pi^2}{6}$.", true, "$\\tfrac{1}{1 - x} = \\sum x^n$, und $\\int_0^1 x^n\\ln x\\,dx = -\\tfrac{1}{(n + 1)^2}$. Summe $-\\sum\\tfrac{1}{k^2} = -\\tfrac{\\pi^2}{6}$.")),
    ],
  }));
})();
