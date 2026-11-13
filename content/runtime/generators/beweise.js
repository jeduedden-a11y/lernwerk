// Proof training: pools of complete proofs, each with a reason for every line, wrong blocks with an explanation and
// a version with one mistake. LW.forms.proofs turns every proof into six kinds of task: build it from blocks, fill
// gaps, give the reasons, find the wrong line, pick the structure, choose the next line. Own wording throughout;
// the proofs are the standard ones of a first semester.
(function () {
  const F = LW.forms;
  const s = (md, by, why) => ({ md, by, why });
  const d = (md, why) => ({ md, why });
  const PLAN = {
    1: ["strategy", "next", "order"],
    2: ["order", "gaps", "next", "strategy"],
    3: ["gaps", "justify", "flaw", "order", "next"],
    4: ["flaw", "justify", "gaps", "order"],
  };
  /** a generator made only of proof forms */
  function proofGen(name, title, pool, o, plan) {
    const forms = F.proofs(pool, plan || PLAN, o);
    LW.generator(name, { title, make(level, G, params) { return G.pick(forms[level] || forms[1])(level, G, params); } });
  }
  LW.proofGen = proofGen;

  // ================================================================ numbers and induction
  const ZAHLEN = [
    { lv: 1, kind: "direkt", given: "$a$ und $b$ sind gerade ganze Zahlen.", claim: "$a + b$ ist gerade.",
      idea: "Gerade heißt Vielfaches von 2: beide Zahlen als $2k$ und $2m$ schreiben und 2 ausklammern.",
      steps: [
        s("Es gibt ganze Zahlen $k, m$ mit $a = 2k$ und $b = 2m$.", "Definition von gerade", "Gerade bedeutet: ein ganzzahliges Vielfaches von 2."),
        s("Dann ist $a + b = 2k + 2m$.", "Einsetzen"),
        s("$2k + 2m = 2(k + m)$.", "Ausklammern"),
        s("$k + m$ ist ganz, also ist $a + b$ ein Vielfaches von 2 und damit gerade.", "Definition von gerade"),
      ],
      distractors: [
        d("Es gibt eine ganze Zahl $k$ mit $a = 2k$ und $b = 2k$.", "Dasselbe $k$ für beide Zahlen hieße $a = b$. Jede Zahl braucht ihr eigenes $k$."),
        d("Zum Beispiel ist $2 + 4 = 6$ gerade.", "Ein Beispiel prüft einen Fall, beweist aber nichts über alle geraden Zahlen."),
        d("$a + b = 2k + 1$ für eine ganze Zahl $k$.", "So sieht eine ungerade Zahl aus."),
      ],
      flaw: { line: 0, md: "Es gibt eine ganze Zahl $k$ mit $a = 2k$ und $b = 2k$.", why: "Für beide Zahlen dasselbe $k$ zu nehmen setzt stillschweigend $a = b$ voraus." } },
    { lv: 1, kind: "direkt", given: "$n$ ist eine ungerade ganze Zahl.", claim: "$n^2$ ist ungerade.",
      idea: "Ungerade heißt $n = 2k + 1$. Ausmultiplizieren und wieder in die Form $2 \\cdot (\\ldots) + 1$ bringen.",
      steps: [
        s("Es gibt eine ganze Zahl $k$ mit $n = 2k + 1$.", "Definition von ungerade"),
        s("$n^2 = (2k + 1)^2 = 4k^2 + 4k + 1$.", "Binomische Formel"),
        s("$4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$.", "Ausklammern"),
        s("$2k^2 + 2k$ ist ganz, also hat $n^2$ die Form $2m + 1$ und ist ungerade.", "Definition von ungerade"),
      ],
      distractors: [
        d("$n^2 = (2k + 1)^2 = 4k^2 + 1$.", "Der gemischte Term $2 \\cdot 2k \\cdot 1 = 4k$ fehlt."),
        d("$n^2 = 2k^2 + 1$.", "Quadriert wird die ganze Klammer, nicht nur $k$."),
        d("Weil $n$ ungerade ist, ist jede Potenz von $n$ ungerade.", "Genau das soll bewiesen werden; so wird die Behauptung vorausgesetzt."),
      ],
      flaw: { line: 1, md: "$n^2 = (2k + 1)^2 = 4k^2 + 1$.", why: "Beim Quadrieren fehlt der gemischte Term $4k$." } },
    { lv: 2, kind: "kontraposition", given: "$n$ ist eine ganze Zahl, und $n^2$ ist gerade.", claim: "$n$ ist gerade.",
      idea: "Direkt kommt man schlecht an $n$ heran. Die Kontraposition lautet: Ist $n$ ungerade, dann ist $n^2$ ungerade.",
      steps: [
        s("Wir zeigen die Kontraposition: Ist $n$ ungerade, dann ist $n^2$ ungerade.", "Kontraposition", "$A \\Rightarrow B$ ist gleichwertig zu $\\lnot B \\Rightarrow \\lnot A$."),
        s("Sei $n$ ungerade, also $n = 2k + 1$ mit einer ganzen Zahl $k$.", "Definition von ungerade"),
        s("Dann ist $n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$.", "Ausmultiplizieren"),
        s("Also ist $n^2$ ungerade. Damit folgt aus »$n^2$ gerade«, dass $n$ gerade ist.", "Kontraposition"),
      ],
      distractors: [
        d("Wir zeigen: Ist $n$ gerade, dann ist $n^2$ gerade.", "Das ist die Umkehrung. Sie stimmt, beweist aber die Behauptung nicht."),
        d("Sei $n^2 = 2k$, dann ist $n = \\sqrt{2k}$ gerade.", "Aus $n = \\sqrt{2k}$ folgt nichts über gerade oder ungerade; $\\sqrt{2k}$ muss nicht einmal ganz sein."),
        d("Sei $n$ gerade, also $n = 2k$.", "In der Kontraposition beginnt man mit der Verneinung der Behauptung: $n$ ungerade."),
      ],
      flaw: { line: 0, md: "Wir zeigen: Ist $n$ gerade, dann ist $n^2$ gerade.", why: "Das ist die Umkehrung, nicht die Kontraposition. Aus ihr folgt die Behauptung nicht." } },
    { lv: 3, kind: "widerspruch", given: "Jede rationale Zahl lässt sich als vollständig gekürzter Bruch schreiben.", claim: "$\\sqrt{2}$ ist irrational.",
      idea: "Annehmen, $\\sqrt{2} = \\tfrac{p}{q}$ vollständig gekürzt, und zeigen, dass dann $p$ und $q$ beide gerade wären.",
      steps: [
        s("Angenommen, $\\sqrt{2} = \\tfrac{p}{q}$ mit ganzen, teilerfremden $p, q$ und $q \\ne 0$.", "Annahme des Gegenteils"),
        s("Quadrieren ergibt $p^2 = 2q^2$, also ist $p^2$ gerade.", "Umformen"),
        s("Dann ist auch $p$ gerade, $p = 2r$.", "Satz über gerade Quadrate", "Ist $p^2$ gerade, so ist $p$ gerade (Kontraposition von »$p$ ungerade, dann $p^2$ ungerade«)."),
        s("Einsetzen: $4r^2 = 2q^2$, also $q^2 = 2r^2$, und auch $q$ ist gerade.", "Einsetzen"),
        s("$p$ und $q$ sind beide durch 2 teilbar, im Widerspruch zur Teilerfremdheit. Also ist $\\sqrt{2}$ irrational.", "Widerspruch"),
      ],
      distractors: [
        d("Angenommen, $\\sqrt{2} = \\tfrac{p}{q}$ mit beliebigen ganzen $p, q$.", "Ohne »teilerfremd« gibt es am Ende keinen Widerspruch: Gerade $p$ und $q$ wären erlaubt."),
        d("Der Taschenrechner zeigt $1{,}41421356\\ldots$ ohne Periode.", "Endlich viele Stellen beweisen nichts über die ganze Entwicklung."),
        d("Aus $p^2 = 2q^2$ folgt $p = 2q$.", "Wurzelziehen ergibt $p = \\sqrt{2}\\,q$, nicht $2q$."),
      ],
      flaw: { line: 2, md: "Aus $p^2 = 2q^2$ folgt $p = 2q$, also ist $p$ gerade.", why: "Wurzelziehen ergibt $p = \\sqrt{2}\\,q$. Richtig ist: $p^2$ ist gerade, also ist $p$ gerade." } },
    { lv: 3, kind: "widerspruch", given: "Jede natürliche Zahl größer als 1 hat einen Primteiler.", claim: "Es gibt unendlich viele Primzahlen.",
      idea: "Angenommen, es gibt nur endlich viele. Ihr Produkt plus 1 hat einen Primteiler, der keine von ihnen sein kann.",
      steps: [
        s("Angenommen, es gibt nur endlich viele Primzahlen $p_1, \\ldots, p_n$.", "Annahme des Gegenteils"),
        s("Betrachte $N = p_1 \\cdot p_2 \\cdots p_n + 1$.", "Konstruktion"),
        s("Es ist $N > 1$, also hat $N$ einen Primteiler $p$, und $p$ ist eines der $p_i$.", "Voraussetzung"),
        s("$p$ teilt $N$ und das Produkt $p_1 \\cdots p_n$, also auch deren Differenz $1$.", "Teilbarkeit einer Differenz"),
        s("Keine Primzahl teilt 1. Widerspruch, also gibt es unendlich viele Primzahlen.", "Widerspruch"),
      ],
      distractors: [
        d("$N = p_1 \\cdots p_n + 1$ ist selbst eine Primzahl.", "Das muss nicht sein: $2 \\cdot 3 \\cdot 5 \\cdot 7 \\cdot 11 \\cdot 13 + 1 = 30031 = 59 \\cdot 509$. Gebraucht wird nur ein Primteiler."),
        d("Angenommen, es gibt eine größte natürliche Zahl.", "Die Annahme muss die Primzahlen betreffen."),
        d("$p$ teilt $N$, also teilt $p$ auch $N + 1$.", "Aus $p \\mid N$ folgt nicht $p \\mid N + 1$; beides zugleich geht für $p > 1$ gar nicht."),
      ],
      flaw: { line: 2, md: "$N$ ist größer als jedes $p_i$, also ist $N$ eine Primzahl.", why: "Daraus, dass $N$ größer ist, folgt nicht, dass $N$ prim ist. Der Beweis braucht nur einen Primteiler von $N$." } },
    { lv: 2, kind: "induktion", given: "$n \\ge 1$ ist eine natürliche Zahl.", claim: "$1 + 2 + \\cdots + n = \\dfrac{n(n+1)}{2}$.",
      idea: "Induktion: Anfang bei $n = 1$, im Schritt die Formel für $n$ benutzen und $n + 1$ dazuzählen.",
      steps: [
        s("Anfang $n = 1$: Links steht $1$, rechts $\\tfrac{1 \\cdot 2}{2} = 1$.", "Induktionsanfang"),
        s("Annahme: Für ein festes $n \\ge 1$ gilt $1 + \\cdots + n = \\tfrac{n(n+1)}{2}$.", "Induktionsannahme"),
        s("Dann ist $1 + \\cdots + n + (n + 1) = \\tfrac{n(n+1)}{2} + (n + 1)$.", "Induktionsannahme"),
        s("$\\tfrac{n(n+1)}{2} + (n + 1) = \\tfrac{(n+1)(n+2)}{2}$.", "Ausklammern"),
        s("Das ist die Formel für $n + 1$. Mit dem Induktionsprinzip gilt sie für alle $n \\ge 1$.", "Induktionsprinzip"),
      ],
      distractors: [
        d("Annahme: Die Formel gilt für alle $n$.", "Das ist die Behauptung selbst. Angenommen wird sie nur für ein festes $n$."),
        d("Für $n = 1, 2, 3$ stimmt die Formel, also gilt sie immer.", "Einzelne Fälle ersetzen den Induktionsschritt nicht."),
        d("$\\tfrac{n(n+1)}{2} + (n + 1) = \\tfrac{(n+1)^2}{2}$.", "Rechenfehler: $\\tfrac{n(n+1) + 2(n+1)}{2} = \\tfrac{(n+1)(n+2)}{2}$."),
      ],
      flaw: { line: 1, md: "Annahme: Die Formel gilt für alle natürlichen Zahlen $n$.", why: "Damit wird vorausgesetzt, was zu zeigen ist. Die Induktionsannahme gilt nur für ein festes $n$." } },
    { lv: 3, kind: "direkt", given: "$n$ ist eine ganze Zahl.", claim: "$n^3 - n$ ist durch $3$ teilbar.",
      idea: "Faktorisieren: $n^3 - n$ ist das Produkt dreier aufeinanderfolgender Zahlen.",
      steps: [
        s("$n^3 - n = n(n^2 - 1)$.", "Ausklammern"),
        s("$n(n^2 - 1) = (n - 1)\\,n\\,(n + 1)$.", "Binomische Formel"),
        s("Von drei aufeinanderfolgenden ganzen Zahlen ist genau eine durch 3 teilbar.", "Division mit Rest", "Ihre Reste bei Division durch 3 sind 0, 1 und 2 in irgendeiner Reihenfolge."),
        s("Ein Produkt mit einem durch 3 teilbaren Faktor ist durch 3 teilbar, also $3 \\mid n^3 - n$.", "Teilbarkeit eines Produkts"),
      ],
      distractors: [
        d("$n^3 - n = n(n - 1)^2$.", "Rechenfehler: $n(n - 1)^2 = n^3 - 2n^2 + n$."),
        d("Für $n = 2$ ist $n^3 - n = 6$, durch 3 teilbar.", "Ein Beispiel beweist keine Aussage für alle $n$."),
        d("Von drei aufeinanderfolgenden Zahlen ist mindestens eine gerade.", "Stimmt, hilft aber bei der Teilbarkeit durch 3 nicht."),
      ],
      flaw: { line: 1, md: "$n(n^2 - 1) = (n - 1)^2\\, n$.", why: "$n^2 - 1 = (n - 1)(n + 1)$ nach der dritten binomischen Formel, nicht $(n - 1)^2$." } },
    { lv: 2, kind: "faelle", given: "$n$ ist eine ganze Zahl.", claim: "$n^2 + n$ ist gerade.",
      idea: "Zwei Fälle: $n$ gerade oder $n$ ungerade. In beiden ist ein Faktor von $n(n + 1)$ gerade.",
      steps: [
        s("Es gilt $n^2 + n = n(n + 1)$.", "Ausklammern"),
        s("Fall 1: $n$ ist gerade. Dann ist der Faktor $n$ gerade, also auch $n(n + 1)$.", "Fallunterscheidung"),
        s("Fall 2: $n$ ist ungerade. Dann ist $n + 1$ gerade, also auch $n(n + 1)$.", "Fallunterscheidung"),
        s("Jede ganze Zahl ist gerade oder ungerade, also ist $n^2 + n$ immer gerade.", "Vollständigkeit der Fälle"),
      ],
      distractors: [
        d("Fall 2: $n$ ist ungerade. Dann ist $n^2$ ungerade, also ist $n^2 + n$ ungerade.", "Ungerade plus ungerade ist gerade."),
        d("Fall 3: $n$ ist negativ.", "Das Vorzeichen spielt keine Rolle; gerade und ungerade decken schon alle ganzen Zahlen ab."),
        d("Es gilt $n^2 + n = n(n - 1)$.", "Ausklammern ergibt $n(n + 1)$."),
      ],
      flaw: { line: 2, md: "Fall 2: $n$ ist ungerade. Dann ist auch $n + 1$ ungerade, also ist $n(n + 1)$ ungerade.", why: "Auf eine ungerade Zahl folgt eine gerade: $n + 1$ ist gerade." } },
    { lv: 1, kind: "direkt", given: "$a \\mid b$ und $b \\mid c$ für ganze Zahlen $a, b, c$.", claim: "$a \\mid c$.",
      idea: "Teilbarkeit heißt: Es gibt einen ganzzahligen Faktor. Die beiden Faktoren multiplizieren sich.",
      steps: [
        s("Es gibt ganze Zahlen $k, m$ mit $b = ka$ und $c = mb$.", "Definition der Teilbarkeit"),
        s("Einsetzen: $c = m(ka)$.", "Einsetzen"),
        s("$c = (mk)\\,a$ mit der ganzen Zahl $mk$.", "Assoziativgesetz"),
        s("Also teilt $a$ die Zahl $c$.", "Definition der Teilbarkeit"),
      ],
      distractors: [
        d("Es gibt eine ganze Zahl $k$ mit $b = ka$ und $c = kb$.", "Die beiden Teilbarkeiten haben im Allgemeinen verschiedene Faktoren."),
        d("$c = (m + k)\\,a$.", "Die Faktoren werden multipliziert, nicht addiert."),
      ],
      flaw: { line: 2, md: "$c = (m + k)\\,a$ mit der ganzen Zahl $m + k$.", why: "Aus $c = m(ka)$ folgt $c = (mk)a$: Die Faktoren multiplizieren sich." } },
    { lv: 2, kind: "induktion", given: "$n \\ge 0$ ist eine natürliche Zahl.", claim: "$2^n > n$.",
      idea: "Induktion: Im Schritt $2^{n+1} = 2 \\cdot 2^n$ mit der Annahme abschätzen.",
      steps: [
        s("Anfang $n = 0$: $2^0 = 1 > 0$.", "Induktionsanfang"),
        s("Annahme: Für ein festes $n \\ge 0$ gilt $2^n > n$.", "Induktionsannahme"),
        s("$2^{n+1} = 2 \\cdot 2^n > 2n$.", "Induktionsannahme"),
        s("Für $n \\ge 1$ ist $2n \\ge n + 1$; für $n = 0$ ist direkt $2^1 = 2 > 1$.", "Fallunterscheidung"),
        s("Also $2^{n+1} > n + 1$, und die Aussage gilt für alle $n \\ge 0$.", "Induktionsprinzip"),
      ],
      distractors: [
        d("$2^{n+1} = 2^n + 1 > n + 1$.", "$2^{n+1}$ ist $2 \\cdot 2^n$, nicht $2^n + 1$."),
        d("Annahme: Für alle $n$ gilt $2^n > n$.", "Die Annahme gilt für ein festes $n$, sonst setzt man die Behauptung voraus."),
      ],
      flaw: { line: 2, md: "$2^{n+1} = 2^n + 1 > n + 1$.", why: "Potenzgesetz verwechselt: $2^{n+1} = 2 \\cdot 2^n$." } },
    { lv: 4, kind: "induktion", given: "$x \\ge -1$ ist reell, $n \\ge 0$ natürlich.", claim: "$(1 + x)^n \\ge 1 + nx$ (Bernoulli).",
      idea: "Induktion nach $n$. Im Schritt mit $1 + x \\ge 0$ multiplizieren, das erhält die Ungleichung; $nx^2 \\ge 0$ fällt weg.",
      steps: [
        s("Anfang $n = 0$: $(1 + x)^0 = 1 \\ge 1 + 0 \\cdot x$.", "Induktionsanfang"),
        s("Annahme: $(1 + x)^n \\ge 1 + nx$ für ein festes $n$.", "Induktionsannahme"),
        s("Wegen $1 + x \\ge 0$ gilt $(1 + x)^{n+1} \\ge (1 + nx)(1 + x)$.", "Multiplikation mit einer Zahl größer gleich 0"),
        s("$(1 + nx)(1 + x) = 1 + (n + 1)x + nx^2$.", "Ausmultiplizieren"),
        s("$nx^2 \\ge 0$, also $(1 + x)^{n+1} \\ge 1 + (n + 1)x$.", "Abschätzen"),
      ],
      distractors: [
        d("Wegen $x \\ge -1$ gilt $(1 + x)^{n+1} \\ge (1 + nx) + x$.", "Im Schritt wird mit $1 + x$ multipliziert, nicht addiert."),
        d("Man darf jede Ungleichung mit $1 + x$ multiplizieren.", "Nur weil $1 + x \\ge 0$ ist; ein negativer Faktor dreht die Ungleichung um."),
        d("$(1 + nx)(1 + x) = 1 + (n + 1)x$.", "Der Term $nx^2$ fehlt; er ist $\\ge 0$ und darf erst danach wegfallen."),
      ],
      flaw: { line: 2, md: "Für jedes reelle $x$ gilt $(1 + x)^{n+1} \\ge (1 + nx)(1 + x)$.", why: "Multiplizieren erhält die Ungleichung nur bei einem Faktor $1 + x \\ge 0$; genau dafür braucht man $x \\ge -1$." } },
    { lv: 3, kind: "faelle", given: "$n$ ist eine ganze Zahl.", claim: "$n^2$ lässt bei Division durch 4 den Rest 0 oder 1.",
      idea: "Fallunterscheidung nach gerade und ungerade, dann 4 ausklammern.",
      steps: [
        s("Fall $n$ gerade: $n = 2k$, also $n^2 = 4k^2$, Rest 0.", "Fallunterscheidung"),
        s("Fall $n$ ungerade: $n = 2k + 1$, also $n^2 = 4k^2 + 4k + 1$.", "Fallunterscheidung"),
        s("$4k^2 + 4k + 1 = 4(k^2 + k) + 1$, Rest 1.", "Ausklammern"),
        s("Weitere Fälle gibt es nicht, also ist der Rest immer 0 oder 1.", "Vollständigkeit der Fälle"),
      ],
      distractors: [
        d("Fall $n$ ungerade: $n^2 = 4k^2 + 1$, Rest 1.", "Der Rest stimmt zufällig, die Rechnung nicht: Es fehlt $4k$."),
        d("Fall $n$ durch 4 teilbar: Rest 0.", "Dieser Fall allein deckt nicht alle Zahlen ab."),
      ],
      flaw: { line: 2, md: "$4k^2 + 4k + 1 = 4(k^2 + k + 1)$, Rest 0.", why: "Die 1 lässt sich nicht mit 4 ausklammern: $4(k^2 + k) + 1$, Rest 1." } },
    { lv: 1, kind: "widerspruch", given: "Gerade Zahlen sind Vielfache von 2.", claim: "Es gibt keine größte gerade Zahl.",
      idea: "Angenommen, es gibt eine. Dann ist sie plus 2 wieder gerade und größer.",
      steps: [
        s("Angenommen, $g$ ist die größte gerade Zahl.", "Annahme des Gegenteils"),
        s("Dann ist $g = 2k$ für eine ganze Zahl $k$.", "Definition von gerade"),
        s("$g + 2 = 2(k + 1)$ ist gerade.", "Ausklammern"),
        s("$g + 2 > g$ widerspricht der Annahme. Also gibt es keine größte gerade Zahl.", "Widerspruch"),
      ],
      distractors: [
        d("Die geraden Zahlen 2, 4, 6, … hören nie auf.", "Das ist die Behauptung in anderen Worten, kein Argument."),
        d("$g + 1$ ist größer als $g$.", "Stimmt, aber $g + 1$ ist ungerade und widerspricht der Annahme nicht."),
      ],
      flaw: { line: 2, md: "$g + 1$ ist größer als $g$ und gerade.", why: "$g + 1$ ist ungerade. Einen Widerspruch liefert erst eine größere gerade Zahl wie $g + 2$." } },
    { lv: 3, kind: "induktion", given: "$q \\ne 1$ ist reell, $n \\ge 0$ natürlich.", claim: "$\\displaystyle\\sum_{k=0}^{n} q^k = \\frac{q^{n+1} - 1}{q - 1}$.",
      idea: "Induktion: Im Schritt kommt $q^{n+1}$ dazu, dann auf den Nenner $q - 1$ bringen.",
      steps: [
        s("Anfang $n = 0$: links $q^0 = 1$, rechts $\\tfrac{q - 1}{q - 1} = 1$.", "Induktionsanfang"),
        s("Annahme: Die Formel gilt für ein festes $n$.", "Induktionsannahme"),
        s("$\\sum_{k=0}^{n+1} q^k = \\tfrac{q^{n+1} - 1}{q - 1} + q^{n+1}$.", "Induktionsannahme"),
        s("$= \\tfrac{q^{n+1} - 1 + q^{n+2} - q^{n+1}}{q - 1} = \\tfrac{q^{n+2} - 1}{q - 1}$.", "Hauptnenner bilden"),
        s("Das ist die Formel für $n + 1$.", "Induktionsprinzip"),
      ],
      distractors: [
        d("$\\sum_{k=0}^{n+1} q^k = \\tfrac{q^{n+1} - 1}{q - 1} \\cdot q$.", "Der neue Summand $q^{n+1}$ wird addiert, nicht multipliziert."),
        d("$= \\tfrac{q^{n+1} - 1 + q^{n+1}}{q - 1}$.", "$q^{n+1}$ muss erst mit $q - 1$ erweitert werden."),
      ],
      flaw: { line: 3, md: "$= \\tfrac{q^{n+1} - 1 + q^{n+1}}{q - 1} = \\tfrac{2q^{n+1} - 1}{q - 1}$.", why: "Beim Addieren fehlt das Erweitern: $q^{n+1} = \\tfrac{q^{n+2} - q^{n+1}}{q - 1}$." } },
    { lv: 4, kind: "faelle", given: "$\\sqrt{2}$ ist irrational.", claim: "Es gibt irrationale Zahlen $a, b$, für die $a^b$ rational ist.",
      idea: "Fallunterscheidung über $\\sqrt{2}^{\\sqrt{2}}$: Ist die Zahl rational, ist man fertig; sonst dient sie als neues $a$.",
      steps: [
        s("Betrachte $x = \\sqrt{2}^{\\sqrt{2}}$.", "Konstruktion"),
        s("Fall 1: $x$ ist rational. Dann leisten $a = b = \\sqrt{2}$ das Gewünschte.", "Fallunterscheidung"),
        s("Fall 2: $x$ ist irrational. Setze $a = x$ und $b = \\sqrt{2}$.", "Fallunterscheidung"),
        s("Dann ist $a^b = \\sqrt{2}^{\\sqrt{2} \\cdot \\sqrt{2}} = \\sqrt{2}^{2} = 2$, rational.", "Potenzgesetz"),
        s("In beiden Fällen gibt es solche $a, b$, auch ohne zu wissen, welcher Fall vorliegt.", "Vollständigkeit der Fälle"),
      ],
      distractors: [
        d("$\\sqrt{2}^{\\sqrt{2}}$ ist offensichtlich irrational.", "Das stimmt zwar, ist aber schwer zu beweisen. Der Beweis kommt ohne aus."),
        d("$a^b = \\sqrt{2}^{\\sqrt{2} + \\sqrt{2}}$.", "Potenzen von Potenzen multiplizieren die Exponenten: $(a^b)^c = a^{bc}$."),
      ],
      flaw: { line: 3, md: "Dann ist $a^b = \\sqrt{2}^{\\sqrt{2} + \\sqrt{2}} = \\sqrt{2}^{2\\sqrt{2}}$.", why: "$(a^b)^c = a^{b \\cdot c}$: Die Exponenten werden multipliziert, und $\\sqrt{2} \\cdot \\sqrt{2} = 2$." } },
  ];
  proofGen("beweis-zahlen", "Beweise mit ganzen Zahlen", ZAHLEN, {
    reasons: ["Definition von gerade", "Definition von ungerade", "Einsetzen", "Ausklammern", "Binomische Formel", "Induktionsanfang", "Induktionsannahme",
      "Induktionsprinzip", "Annahme des Gegenteils", "Widerspruch", "Fallunterscheidung", "Definition der Teilbarkeit", "Kontraposition", "Kommutativgesetz"],
  });

  // ================================================================ sets and maps
  const MENGEN = [
    { lv: 1, kind: "direkt", given: "$A \\subseteq B$.", claim: "$\\mathcal{P}(A) \\subseteq \\mathcal{P}(B)$.",
      idea: "Ein beliebiges Element der linken Menge nehmen und zeigen, dass es in der rechten liegt.",
      steps: [
        s("Sei $X \\in \\mathcal{P}(A)$ beliebig.", "Beliebiges Element wählen"),
        s("Dann ist $X \\subseteq A$.", "Definition der Potenzmenge"),
        s("Mit $A \\subseteq B$ folgt $X \\subseteq B$.", "Transitivität der Teilmengenbeziehung"),
        s("Also $X \\in \\mathcal{P}(B)$. Weil $X$ beliebig war, gilt $\\mathcal{P}(A) \\subseteq \\mathcal{P}(B)$.", "Definition der Potenzmenge"),
      ],
      distractors: [
        d("Sei $X \\in A$ beliebig.", "Die Elemente der Potenzmenge sind Teilmengen von $A$, keine Elemente von $A$."),
        d("Es gilt $\\mathcal{P}(A) = \\mathcal{P}(B)$.", "Nur wenn $A = B$; gezeigt wird eine Teilmengenbeziehung."),
      ],
      flaw: { line: 0, md: "Sei $X \\in A$ beliebig.", why: "Gesucht sind Elemente von $\\mathcal{P}(A)$, also Teilmengen $X \\subseteq A$." } },
    { lv: 2, kind: "zwei", given: "$A, B, C$ sind Mengen.", claim: "$A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)$.",
      idea: "Gleichheit von Mengen: beide Inklusionen zeigen, jeweils mit einem beliebigen Element.",
      steps: [
        s("»$\\subseteq$«: Sei $x \\in A \\cap (B \\cup C)$. Dann ist $x \\in A$ und $x \\in B$ oder $x \\in C$.", "Definition des Schnitts"),
        s("Ist $x \\in B$, so $x \\in A \\cap B$; ist $x \\in C$, so $x \\in A \\cap C$. In beiden Fällen $x \\in (A \\cap B) \\cup (A \\cap C)$.", "Fallunterscheidung"),
        s("»$\\supseteq$«: Sei $x \\in (A \\cap B) \\cup (A \\cap C)$, etwa $x \\in A \\cap B$.", "Definition der Vereinigung"),
        s("Dann $x \\in A$ und $x \\in B \\subseteq B \\cup C$, also $x \\in A \\cap (B \\cup C)$; der Fall $x \\in A \\cap C$ geht genauso.", "Definition des Schnitts"),
        s("Beide Inklusionen zusammen ergeben die Gleichheit.", "Gleichheit von Mengen"),
      ],
      distractors: [
        d("Ein Venn-Diagramm zeigt, dass beide Seiten gleich sind.", "Ein Diagramm veranschaulicht, beweist aber nicht."),
        d("»$\\subseteq$« genügt, die andere Richtung folgt daraus.", "Für Gleichheit braucht man beide Inklusionen."),
      ],
      flaw: { line: 4, md: "Schon eine der beiden Inklusionen hätte für die Gleichheit genügt.", why: "Gleichheit von Mengen heißt $X \\subseteq Y$ und $Y \\subseteq X$; beide Richtungen sind nötig." } },
    { lv: 2, kind: "direkt", given: "$f\\colon A \\to B$ und $g\\colon B \\to C$ sind injektiv.", claim: "$g \\circ f$ ist injektiv.",
      idea: "Aus gleichen Bildern unter $g \\circ f$ erst mit $g$, dann mit $f$ auf gleiche Urbilder schließen.",
      steps: [
        s("Seien $x, y \\in A$ mit $g(f(x)) = g(f(y))$.", "Definition der Injektivität"),
        s("Da $g$ injektiv ist, folgt $f(x) = f(y)$.", "Injektivität von g"),
        s("Da $f$ injektiv ist, folgt $x = y$.", "Injektivität von f"),
        s("Also ist $g \\circ f$ injektiv.", "Definition der Injektivität"),
      ],
      distractors: [
        d("Seien $x \\ne y$; dann ist $g(f(x)) = g(f(y))$.", "Umgekehrt: Aus $x \\ne y$ muss $g(f(x)) \\ne g(f(y))$ folgen."),
        d("Da $f$ injektiv ist, folgt aus $g(f(x)) = g(f(y))$ sofort $x = y$.", "Zuerst muss $g$ weg; dafür braucht man die Injektivität von $g$."),
      ],
      flaw: { line: 1, md: "Da $f$ injektiv ist, folgt $f(x) = f(y)$.", why: "Von $g(f(x)) = g(f(y))$ auf $f(x) = f(y)$ schließt man mit der Injektivität von $g$." } },
    { lv: 3, kind: "direkt", given: "$f\\colon A \\to B$ und $g\\colon B \\to C$ sind surjektiv.", claim: "$g \\circ f$ ist surjektiv.",
      idea: "Im Ziel $C$ beginnen und rückwärts erst über $g$, dann über $f$ ein Urbild finden.",
      steps: [
        s("Sei $z \\in C$ beliebig.", "Beliebiges Element wählen"),
        s("Da $g$ surjektiv ist, gibt es $y \\in B$ mit $g(y) = z$.", "Surjektivität von g"),
        s("Da $f$ surjektiv ist, gibt es $x \\in A$ mit $f(x) = y$.", "Surjektivität von f"),
        s("Dann $(g \\circ f)(x) = g(y) = z$, also ist $g \\circ f$ surjektiv.", "Definition der Surjektivität"),
      ],
      distractors: [
        d("Sei $x \\in A$ beliebig.", "Für Surjektivität beginnt man im Ziel $C$ und sucht ein Urbild."),
        d("Da $f$ surjektiv ist, gibt es $y \\in B$ mit $g(y) = z$.", "Dass $z$ ein Urbild in $B$ hat, liefert die Surjektivität von $g$."),
      ],
      flaw: { line: 0, md: "Sei $x \\in A$ beliebig.", why: "Surjektivität heißt: Jedes Element des Ziels hat ein Urbild. Man beginnt bei $z \\in C$." } },
    { lv: 3, kind: "direkt", given: "$f\\colon A \\to B$, $g\\colon B \\to C$, und $g \\circ f$ ist injektiv.", claim: "$f$ ist injektiv.",
      idea: "Gleiche Bilder unter $f$ haben auch gleiche Bilder unter $g \\circ f$.",
      steps: [
        s("Seien $x, y \\in A$ mit $f(x) = f(y)$.", "Definition der Injektivität"),
        s("Dann ist auch $g(f(x)) = g(f(y))$.", "Anwenden von g"),
        s("Da $g \\circ f$ injektiv ist, folgt $x = y$.", "Injektivität der Verkettung"),
        s("Also ist $f$ injektiv.", "Definition der Injektivität"),
      ],
      distractors: [
        d("Da $g$ injektiv ist, folgt $x = y$.", "Über $g$ ist nichts vorausgesetzt; $g$ muss nicht injektiv sein."),
        d("Also ist auch $g$ injektiv.", "Das folgt nicht: $f\\colon \\{1\\} \\to \\{1, 2\\}$, $g$ konstant auf $\\{1, 2\\}$ ist ein Gegenbeispiel."),
      ],
      flaw: { line: 2, md: "Da $g$ injektiv ist, folgt $x = y$.", why: "Vorausgesetzt ist nur, dass $g \\circ f$ injektiv ist. Über $g$ allein weiß man nichts." } },
    { lv: 2, kind: "gegenbeispiel", given: "Es soll geprüft werden: Aus $A \\cup B = A \\cup C$ folgt immer $B = C$.", claim: "Die Aussage ist falsch.",
      idea: "Eine Allaussage widerlegt ein einziges Gegenbeispiel: $B$ und $C$ dürfen sich innerhalb von $A$ unterscheiden.",
      steps: [
        s("Wähle $A = \\{1, 2\\}$, $B = \\{1\\}$, $C = \\{2\\}$.", "Gegenbeispiel wählen"),
        s("Dann ist $A \\cup B = \\{1, 2\\}$ und $A \\cup C = \\{1, 2\\}$.", "Nachrechnen"),
        s("Aber $B \\ne C$.", "Nachrechnen"),
        s("Ein Gegenbeispiel genügt: Die Aussage gilt nicht allgemein.", "Widerlegung einer Allaussage"),
      ],
      distractors: [
        d("Wähle $A = \\emptyset$, $B = \\{1\\}$, $C = \\{2\\}$.", "Dann ist $A \\cup B = \\{1\\} \\ne \\{2\\} = A \\cup C$; die Voraussetzung ist nicht erfüllt."),
        d("Für $A = B = C$ stimmt die Aussage, also ist sie wahr.", "Ein passendes Beispiel beweist keine Allaussage."),
      ],
      flaw: { line: 0, md: "Wähle $A = \\emptyset$, $B = \\{1\\}$, $C = \\{2\\}$.", why: "Mit $A = \\emptyset$ ist $A \\cup B \\ne A \\cup C$; das Beispiel erfüllt die Voraussetzung nicht." } },
    { lv: 2, kind: "zwei", given: "$A, B$ sind Teilmengen einer Grundmenge, $^c$ bezeichnet das Komplement.", claim: "$(A \\cup B)^c = A^c \\cap B^c$.",
      idea: "Beide Inklusionen elementweise: Nicht in der Vereinigung heißt in keiner der beiden Mengen.",
      steps: [
        s("»$\\subseteq$«: Sei $x \\in (A \\cup B)^c$, also $x \\notin A \\cup B$.", "Definition des Komplements"),
        s("Dann $x \\notin A$ und $x \\notin B$, also $x \\in A^c \\cap B^c$.", "Definition der Vereinigung"),
        s("»$\\supseteq$«: Sei $x \\in A^c \\cap B^c$, also $x \\notin A$ und $x \\notin B$.", "Definition des Schnitts"),
        s("Dann liegt $x$ in keiner der beiden Mengen, also $x \\notin A \\cup B$, d. h. $x \\in (A \\cup B)^c$.", "Definition der Vereinigung"),
      ],
      distractors: [
        d("Dann $x \\notin A$ oder $x \\notin B$, also $x \\in A^c \\cup B^c$.", "Nicht in der Vereinigung heißt: in keiner der beiden. Aus »oder« wird »und«."),
        d("Das Komplement einer Vereinigung ist die Vereinigung der Komplemente.", "Aus der Vereinigung wird ein Schnitt."),
      ],
      flaw: { line: 1, md: "Dann $x \\notin A$ oder $x \\notin B$, also $x \\in A^c \\cup B^c$.", why: "$x \\notin A \\cup B$ heißt: weder in $A$ noch in $B$. Die Verneinung von »oder« ist »und«." } },
    { lv: 1, kind: "konstruktion", given: "$\\N = \\{0, 1, 2, \\ldots\\}$.", claim: "Es gibt eine Abbildung $\\N \\to \\N$, die injektiv, aber nicht surjektiv ist.",
      idea: "Ein Beispiel angeben und beide Eigenschaften nachrechnen: $n \\mapsto n + 1$.",
      steps: [
        s("Setze $f(n) = n + 1$ für $n \\in \\N$.", "Beispiel angeben"),
        s("Aus $f(m) = f(n)$ folgt $m + 1 = n + 1$, also $m = n$: $f$ ist injektiv.", "Definition der Injektivität"),
        s("Für $0$ gibt es kein $n \\in \\N$ mit $n + 1 = 0$.", "Nachrechnen"),
        s("Also ist $f$ nicht surjektiv, und eine solche Abbildung existiert.", "Definition der Surjektivität"),
      ],
      distractors: [
        d("Setze $f(n) = n$.", "Die Identität ist injektiv und surjektiv."),
        d("Setze $f(n) = n - 1$.", "$f(0) = -1$ liegt nicht in $\\N$; das ist keine Abbildung nach $\\N$."),
      ],
      flaw: { line: 0, md: "Setze $f(n) = n - 1$ für $n \\in \\N$.", why: "$f(0) = -1 \\notin \\N$: So entsteht gar keine Abbildung $\\N \\to \\N$." } },
  ];
  proofGen("beweis-mengen", "Beweise mit Mengen und Abbildungen", MENGEN, {
    reasons: ["Beliebiges Element wählen", "Definition der Potenzmenge", "Definition des Schnitts", "Definition der Vereinigung", "Definition des Komplements",
      "Fallunterscheidung", "Gleichheit von Mengen", "Definition der Injektivität", "Definition der Surjektivität", "Gegenbeispiel wählen", "Nachrechnen", "Kontraposition"],
  });

  // ================================================================ analysis
  const ANALYSIS = [
    { lv: 2, kind: "abschaetzung", given: "$\\varepsilon > 0$ ist beliebig.", claim: "$\\lim\\limits_{n \\to \\infty} \\tfrac{1}{n} = 0$.",
      idea: "Zu jedem ε ein passendes $N$ angeben: Nach Archimedes gibt es $N > \\tfrac{1}{\\varepsilon}$.",
      steps: [
        s("Sei $\\varepsilon > 0$ beliebig.", "Beliebiges ε wählen"),
        s("Nach dem archimedischen Axiom gibt es $N \\in \\N$ mit $N > \\tfrac{1}{\\varepsilon}$.", "Archimedisches Axiom"),
        s("Für alle $n \\ge N$ gilt $\\abs{\\tfrac1n - 0} = \\tfrac1n \\le \\tfrac1N$.", "Monotonie"),
        s("$\\tfrac1N < \\varepsilon$, also $\\abs{\\tfrac1n - 0} < \\varepsilon$ für alle $n \\ge N$.", "Wahl von N"),
      ],
      distractors: [
        d("Wähle $\\varepsilon = \\tfrac1N$.", "ε ist vorgegeben und beliebig; gewählt wird $N$, passend zu ε."),
        d("Für großes $n$ wird $\\tfrac1n$ sehr klein.", "Das ist die Idee, aber noch kein Beweis: Es fehlt ein $N$ zu jedem ε."),
      ],
      flaw: { line: 1, md: "Wähle $N = 10$, dann ist $\\tfrac1N < \\varepsilon$.", why: "$N$ muss von ε abhängen: Für $\\varepsilon = 0{,}01$ ist $\\tfrac1{10}$ zu groß." } },
    { lv: 3, kind: "widerspruch", given: "$(a_n)$ konvergiert gegen $a$ und gegen $b$.", claim: "$a = b$: Der Grenzwert ist eindeutig.",
      idea: "Angenommen $a \\ne b$. Mit $\\varepsilon = \\tfrac{\\abs{a - b}}{2}$ müssten die Glieder zugleich in zwei getrennten Umgebungen liegen.",
      steps: [
        s("Angenommen $a \\ne b$. Setze $\\varepsilon = \\tfrac{\\abs{a - b}}{2} > 0$.", "Annahme des Gegenteils"),
        s("Es gibt $N_1$ mit $\\abs{a_n - a} < \\varepsilon$ für $n \\ge N_1$ und $N_2$ mit $\\abs{a_n - b} < \\varepsilon$ für $n \\ge N_2$.", "Definition der Konvergenz"),
        s("Für $n \\ge \\max(N_1, N_2)$ gilt $\\abs{a - b} \\le \\abs{a - a_n} + \\abs{a_n - b}$.", "Dreiecksungleichung"),
        s("$\\abs{a - a_n} + \\abs{a_n - b} < 2\\varepsilon = \\abs{a - b}$.", "Wahl von ε"),
        s("Also $\\abs{a - b} < \\abs{a - b}$, ein Widerspruch. Damit ist $a = b$.", "Widerspruch"),
      ],
      distractors: [
        d("Für $n \\ge \\min(N_1, N_2)$ gelten beide Abschätzungen.", "Beide gelten erst ab dem größeren der beiden Indizes."),
        d("Setze $\\varepsilon = \\abs{a - b}$.", "Dann ergibt sich nur $\\abs{a - b} < 2\\abs{a - b}$, kein Widerspruch."),
      ],
      flaw: { line: 2, md: "Für $n \\ge \\min(N_1, N_2)$ gilt $\\abs{a - b} \\le \\abs{a - a_n} + \\abs{a_n - b}$ mit beiden Summanden kleiner als ε.", why: "Erst ab $\\max(N_1, N_2)$ gelten beide Abschätzungen gleichzeitig." } },
    { lv: 3, kind: "direkt", given: "$(a_n)$ konvergiert gegen $a$.", claim: "$(a_n)$ ist beschränkt.",
      idea: "Mit $\\varepsilon = 1$ liegen fast alle Glieder nahe bei $a$; die endlich vielen übrigen haben ein Maximum.",
      steps: [
        s("Zu $\\varepsilon = 1$ gibt es $N$ mit $\\abs{a_n - a} < 1$ für alle $n \\ge N$.", "Definition der Konvergenz"),
        s("Für $n \\ge N$ folgt $\\abs{a_n} \\le \\abs{a_n - a} + \\abs{a} < 1 + \\abs{a}$.", "Dreiecksungleichung"),
        s("Setze $M = \\max(\\abs{a_0}, \\ldots, \\abs{a_{N-1}}, 1 + \\abs{a})$.", "Maximum endlich vieler Zahlen"),
        s("Dann gilt $\\abs{a_n} \\le M$ für alle $n$.", "Fallunterscheidung"),
      ],
      distractors: [
        d("Setze $M = \\max_{n \\in \\N} \\abs{a_n}$.", "Ein Maximum über unendlich viele Glieder muss nicht existieren."),
        d("Für $n \\ge N$ folgt $\\abs{a_n} < 1$.", "Die Glieder liegen nahe bei $a$, nicht bei 0: $\\abs{a_n} < 1 + \\abs{a}$."),
      ],
      flaw: { line: 2, md: "Setze $M = \\max_{n \\in \\N} \\abs{a_n}$.", why: "Über unendlich viele Zahlen gibt es nicht immer ein Maximum. Nur die endlich vielen ersten Glieder werden einzeln erfasst." } },
    { lv: 3, kind: "abschaetzung", given: "$a_n \\to a$ und $b_n \\to b$.", claim: "$a_n + b_n \\to a + b$.",
      idea: "ε halbieren: Jede Folge bekommt die Hälfte des Spielraums.",
      steps: [
        s("Sei $\\varepsilon > 0$.", "Beliebiges ε wählen"),
        s("Es gibt $N_1, N_2$ mit $\\abs{a_n - a} < \\tfrac{\\varepsilon}{2}$ für $n \\ge N_1$ und $\\abs{b_n - b} < \\tfrac{\\varepsilon}{2}$ für $n \\ge N_2$.", "Definition der Konvergenz"),
        s("Für $n \\ge N = \\max(N_1, N_2)$: $\\abs{(a_n + b_n) - (a + b)} \\le \\abs{a_n - a} + \\abs{b_n - b}$.", "Dreiecksungleichung"),
        s("$\\abs{a_n - a} + \\abs{b_n - b} < \\tfrac{\\varepsilon}{2} + \\tfrac{\\varepsilon}{2} = \\varepsilon$.", "Wahl von N"),
      ],
      distractors: [
        d("Es gibt $N$ mit $\\abs{a_n - a} < \\varepsilon$ und $\\abs{b_n - b} < \\varepsilon$, also ist die Summe kleiner als ε.", "Mit ε für jede Folge bleibt nur $2\\varepsilon$; deshalb nimmt man $\\tfrac{\\varepsilon}{2}$."),
        d("$\\abs{(a_n + b_n) - (a + b)} = \\abs{a_n - a} + \\abs{b_n - b}$.", "Im Allgemeinen gilt nur $\\le$."),
      ],
      flaw: { line: 3, md: "$\\abs{a_n - a} + \\abs{b_n - b} < \\varepsilon + \\varepsilon = \\varepsilon$.", why: "$\\varepsilon + \\varepsilon = 2\\varepsilon$. Damit die Summe unter ε bleibt, braucht jede Folge $\\tfrac{\\varepsilon}{2}$." } },
    { lv: 2, kind: "abschaetzung", given: "$x_0 \\in \\R$.", claim: "$f(x) = 2x + 1$ ist stetig in $x_0$.",
      idea: "Der Abstand der Funktionswerte ist das Doppelte des Abstands der Stellen. Also $\\delta = \\tfrac{\\varepsilon}{2}$.",
      steps: [
        s("Sei $\\varepsilon > 0$. Wähle $\\delta = \\tfrac{\\varepsilon}{2}$.", "Wahl von δ"),
        s("Sei $\\abs{x - x_0} < \\delta$.", "Definition der Stetigkeit"),
        s("$\\abs{f(x) - f(x_0)} = \\abs{2x + 1 - 2x_0 - 1} = 2\\abs{x - x_0}$.", "Einsetzen"),
        s("$2\\abs{x - x_0} < 2\\delta = \\varepsilon$.", "Wahl von δ"),
      ],
      distractors: [
        d("Wähle $\\delta = 2\\varepsilon$.", "Dann wäre nur $\\abs{f(x) - f(x_0)} < 4\\varepsilon$; δ muss kleiner sein, nicht größer."),
        d("Sei $\\abs{f(x) - f(x_0)} < \\varepsilon$.", "Das ist das Ziel; vorausgesetzt wird $\\abs{x - x_0} < \\delta$."),
      ],
      flaw: { line: 0, md: "Sei $\\varepsilon > 0$. Wähle $\\delta = 2\\varepsilon$.", why: "Mit $\\delta = 2\\varepsilon$ folgt nur $\\abs{f(x) - f(x_0)} < 4\\varepsilon$. Passend ist $\\delta = \\tfrac{\\varepsilon}{2}$." } },
    { lv: 4, kind: "abschaetzung", given: "$x_0 \\in \\R$.", claim: "$f(x) = x^2$ ist stetig in $x_0$.",
      idea: "$\\abs{x^2 - x_0^2} = \\abs{x - x_0}\\,\\abs{x + x_0}$; den zweiten Faktor beschränkt man, indem man $\\delta \\le 1$ wählt.",
      steps: [
        s("Sei $\\varepsilon > 0$. Wähle $\\delta = \\min\\!\\left(1, \\tfrac{\\varepsilon}{2\\abs{x_0} + 1}\\right)$.", "Wahl von δ"),
        s("Sei $\\abs{x - x_0} < \\delta$. Dann $\\abs{x^2 - x_0^2} = \\abs{x - x_0}\\,\\abs{x + x_0}$.", "Binomische Formel"),
        s("Wegen $\\abs{x - x_0} < 1$ ist $\\abs{x + x_0} \\le \\abs{x - x_0} + 2\\abs{x_0} < 2\\abs{x_0} + 1$.", "Dreiecksungleichung"),
        s("Also $\\abs{x^2 - x_0^2} < \\delta\\,(2\\abs{x_0} + 1) \\le \\varepsilon$.", "Wahl von δ"),
      ],
      distractors: [
        d("Wähle $\\delta = \\tfrac{\\varepsilon}{\\abs{x + x_0}}$.", "δ darf nicht von $x$ abhängen, nur von ε und $x_0$."),
        d("Wähle $\\delta = \\sqrt{\\varepsilon}$.", "Für $x_0 \\ne 0$ reicht das nicht: Der Faktor $\\abs{x + x_0}$ kann groß sein."),
      ],
      flaw: { line: 0, md: "Sei $\\varepsilon > 0$. Wähle $\\delta = \\tfrac{\\varepsilon}{\\abs{x + x_0}}$.", why: "δ wird gewählt, bevor $x$ feststeht; es darf nur von ε und $x_0$ abhängen." } },
    { lv: 4, kind: "direkt", given: "$(a_n)$ ist monoton wachsend und nach oben beschränkt.", claim: "$(a_n)$ konvergiert.",
      idea: "Der Kandidat ist das Supremum $s$ der Glieder; die Supremumseigenschaft liefert zu jedem ε ein Glied über $s - \\varepsilon$.",
      steps: [
        s("Die Menge $\\{a_n : n \\in \\N\\}$ ist nicht leer und beschränkt, hat also ein Supremum $s$.", "Vollständigkeitsaxiom"),
        s("Sei $\\varepsilon > 0$. $s - \\varepsilon$ ist keine obere Schranke, also gibt es $N$ mit $a_N > s - \\varepsilon$.", "Definition des Supremums"),
        s("Für $n \\ge N$ gilt $s - \\varepsilon < a_N \\le a_n$.", "Monotonie"),
        s("Außerdem $a_n \\le s$, also $\\abs{a_n - s} < \\varepsilon$ für alle $n \\ge N$.", "Definition des Supremums"),
      ],
      distractors: [
        d("Die Folge hat ein größtes Glied $s$.", "Ein Maximum muss nicht existieren: $1 - \\tfrac1n$ erreicht $1$ nie."),
        d("Für $n \\ge N$ gilt $a_n \\le a_N$.", "Wachsende Folgen werden größer: $a_n \\ge a_N$."),
      ],
      flaw: { line: 2, md: "Für $n \\ge N$ gilt $a_n \\le a_N$, also bleibt $a_n$ über $s - \\varepsilon$.", why: "Bei einer wachsenden Folge ist $a_n \\ge a_N$; genau das hält die Glieder oberhalb von $s - \\varepsilon$." } },
    { lv: 3, kind: "widerspruch", given: "$a_n = (-1)^n$.", claim: "$(a_n)$ konvergiert nicht.",
      idea: "Angenommen, $a$ ist ein Grenzwert. Aufeinanderfolgende Glieder haben Abstand 2, das passt nicht in eine Umgebung mit $\\varepsilon = 1$.",
      steps: [
        s("Angenommen, $(-1)^n \\to a$.", "Annahme des Gegenteils"),
        s("Zu $\\varepsilon = 1$ gibt es $N$ mit $\\abs{a_n - a} < 1$ für alle $n \\ge N$.", "Definition der Konvergenz"),
        s("Für $n \\ge N$: $2 = \\abs{a_{n+1} - a_n} \\le \\abs{a_{n+1} - a} + \\abs{a - a_n}$.", "Dreiecksungleichung"),
        s("$\\abs{a_{n+1} - a} + \\abs{a - a_n} < 1 + 1 = 2$, also $2 < 2$. Widerspruch.", "Widerspruch"),
      ],
      distractors: [
        d("Die Folge springt hin und her, also konvergiert sie nicht.", "Anschaulich richtig, aber kein Beweis: Jeder mögliche Grenzwert muss ausgeschlossen werden."),
        d("Zu $\\varepsilon = 3$ gibt es $N$ mit $\\abs{a_n - a} < 3$.", "Mit so großem ε entsteht kein Widerspruch; $a = 0$ erfüllt das."),
      ],
      flaw: { line: 3, md: "$\\abs{a_{n+1} - a} + \\abs{a - a_n} < 1 + 1 = 2$, also $2 \\le 2$. Widerspruch.", why: "$2 \\le 2$ ist kein Widerspruch. Erst die echte Ungleichung $2 < 2$ ist einer." } },
    { lv: 2, kind: "direkt", given: "$f(x) = x^3 + x - 1$ ist stetig auf $[0, 1]$.", claim: "$f$ hat in $[0, 1]$ eine Nullstelle.",
      idea: "Vorzeichenwechsel an den Rändern, dann der Zwischenwertsatz.",
      steps: [
        s("$f(0) = -1 < 0$.", "Nachrechnen"),
        s("$f(1) = 1 > 0$.", "Nachrechnen"),
        s("$f$ ist stetig auf $[0, 1]$, und $0$ liegt zwischen $f(0)$ und $f(1)$.", "Voraussetzung"),
        s("Nach dem Zwischenwertsatz gibt es $c \\in [0, 1]$ mit $f(c) = 0$.", "Zwischenwertsatz"),
      ],
      distractors: [
        d("$f(1) = 3 > 0$.", "$1^3 + 1 - 1 = 1$."),
        d("Nach dem Mittelwertsatz gibt es $c$ mit $f'(c) = 0$.", "Der Mittelwertsatz handelt von Ableitungen; hier braucht man den Zwischenwertsatz."),
      ],
      flaw: { line: 3, md: "Nach dem Satz von Rolle gibt es $c \\in [0, 1]$ mit $f(c) = 0$.", why: "Rolle liefert eine Nullstelle der Ableitung und braucht $f(0) = f(1)$. Hier hilft der Zwischenwertsatz." } },
    { lv: 3, kind: "direkt", given: "$a, b \\in \\R$.", claim: "$\\abs{a} - \\abs{b} \\le \\abs{a - b}$.",
      idea: "$a$ als $(a - b) + b$ schreiben und die Dreiecksungleichung anwenden.",
      steps: [
        s("$\\abs{a} = \\abs{(a - b) + b}$.", "Null addieren"),
        s("$\\abs{(a - b) + b} \\le \\abs{a - b} + \\abs{b}$.", "Dreiecksungleichung"),
        s("Also $\\abs{a} \\le \\abs{a - b} + \\abs{b}$.", "Zusammenfassen"),
        s("$\\abs{b}$ abziehen: $\\abs{a} - \\abs{b} \\le \\abs{a - b}$.", "Äquivalenzumformung"),
      ],
      distractors: [
        d("$\\abs{a - b} = \\abs{a} - \\abs{b}$.", "Für $a = 1$, $b = -1$ ist links $2$, rechts $0$."),
        d("$\\abs{(a - b) + b} = \\abs{a - b} + \\abs{b}$.", "Die Dreiecksungleichung liefert nur $\\le$."),
      ],
      flaw: { line: 1, md: "$\\abs{(a - b) + b} \\ge \\abs{a - b} + \\abs{b}$.", why: "Die Dreiecksungleichung schätzt nach oben ab: Der Betrag einer Summe ist höchstens die Summe der Beträge." } },
  ];
  proofGen("beweis-analysis", "Beweise in der Analysis", ANALYSIS, {
    reasons: ["Beliebiges ε wählen", "Archimedisches Axiom", "Definition der Konvergenz", "Dreiecksungleichung", "Wahl von N", "Wahl von δ", "Annahme des Gegenteils",
      "Widerspruch", "Monotonie", "Vollständigkeitsaxiom", "Definition des Supremums", "Zwischenwertsatz", "Mittelwertsatz", "Nachrechnen", "Einsetzen"],
  });

  // ================================================================ linear algebra
  const LA = [
    { lv: 1, kind: "direkt", given: "$f\\colon V \\to W$ ist linear.", claim: "$f(0) = 0$.",
      idea: "$0 = 0 + 0$ und Additivität ergeben $f(0) = f(0) + f(0)$.",
      steps: [
        s("$f(0) = f(0 + 0)$.", "Neutrales Element"),
        s("$f(0 + 0) = f(0) + f(0)$.", "Additivität"),
        s("Also $f(0) = f(0) + f(0)$.", "Zusammenfassen"),
        s("$f(0)$ auf beiden Seiten abziehen: $0 = f(0)$.", "Inverses Element"),
      ],
      distractors: [
        d("$f(0) = 0$, weil $f$ linear ist.", "Das ist die Behauptung; der Beweis muss sie aus der Definition herleiten."),
        d("$f(0 + 0) = f(0) \\cdot f(0)$.", "Linear heißt additiv: Summen gehen auf Summen."),
      ],
      flaw: { line: 1, md: "$f(0 + 0) = f(0) \\cdot f(0)$.", why: "Linearität macht aus Summen Summen: $f(u + v) = f(u) + f(v)$." } },
    { lv: 2, kind: "direkt", given: "$f\\colon V \\to W$ ist linear.", claim: "$\\ker f = \\{v \\in V : f(v) = 0\\}$ ist ein Unterraum von $V$.",
      idea: "Unterraumkriterium: Nullvektor enthalten, abgeschlossen unter Addition und unter Vielfachen.",
      steps: [
        s("$f(0) = 0$, also $0 \\in \\ker f$.", "Lineare Abbildungen erhalten die Null"),
        s("Seien $u, v \\in \\ker f$. Dann $f(u + v) = f(u) + f(v) = 0 + 0 = 0$.", "Additivität"),
        s("Sei $v \\in \\ker f$ und $\\lambda$ ein Skalar. Dann $f(\\lambda v) = \\lambda f(v) = \\lambda \\cdot 0 = 0$.", "Homogenität"),
        s("Nach dem Unterraumkriterium ist $\\ker f$ ein Unterraum.", "Unterraumkriterium"),
      ],
      distractors: [
        d("Seien $u, v \\in \\ker f$. Dann $f(u + v) = f(u) \\cdot f(v) = 0$.", "Additivität: $f(u + v) = f(u) + f(v)$."),
        d("$\\ker f$ ist nicht leer, also ein Unterraum.", "Nicht leer reicht nicht; die Abgeschlossenheit muss gezeigt werden."),
      ],
      flaw: { line: 2, md: "Sei $v \\in \\ker f$ und $\\lambda$ ein Skalar. Dann $f(\\lambda v) = \\lambda + f(v) = \\lambda$.", why: "Homogenität heißt $f(\\lambda v) = \\lambda f(v)$, ein Produkt, keine Summe." } },
    { lv: 3, kind: "zwei", given: "$f\\colon V \\to W$ ist linear.", claim: "$f$ ist genau dann injektiv, wenn $\\ker f = \\{0\\}$.",
      idea: "Beide Richtungen: Aus gleichen Bildern wird mit der Linearität ein Vektor im Kern.",
      steps: [
        s("»$\\Rightarrow$«: Sei $f$ injektiv und $v \\in \\ker f$. Dann $f(v) = 0 = f(0)$.", "Definition des Kerns"),
        s("Aus der Injektivität folgt $v = 0$, also $\\ker f = \\{0\\}$.", "Definition der Injektivität"),
        s("»$\\Leftarrow$«: Sei $\\ker f = \\{0\\}$ und $f(u) = f(v)$.", "Voraussetzung"),
        s("Dann $f(u - v) = f(u) - f(v) = 0$, also $u - v \\in \\ker f$.", "Linearität"),
        s("Also $u - v = 0$, d. h. $u = v$: $f$ ist injektiv.", "Voraussetzung"),
      ],
      distractors: [
        d("»$\\Leftarrow$«: Sei $\\ker f = \\{0\\}$. Dann ist $f(0) = 0$, also ist $f$ injektiv.", "$f(0) = 0$ gilt für jede lineare Abbildung und sagt nichts über Injektivität."),
        d("Dann $f(u - v) = f(u) + f(v)$.", "Linearität: $f(u - v) = f(u) - f(v)$."),
      ],
      flaw: { line: 3, md: "Dann $f(u + v) = f(u) + f(v) = 0$, also $u + v \\in \\ker f$.", why: "Aus $f(u) = f(v)$ folgt $f(u) - f(v) = 0$; betrachten muss man die Differenz $u - v$." } },
    { lv: 2, kind: "direkt", given: "$U_1, U_2$ sind Unterräume von $V$.", claim: "$U_1 \\cap U_2$ ist ein Unterraum.",
      idea: "Unterraumkriterium für den Schnitt: Was in beiden Unterräumen liegt, bleibt bei Summen und Vielfachen in beiden.",
      steps: [
        s("$0 \\in U_1$ und $0 \\in U_2$, also $0 \\in U_1 \\cap U_2$.", "Unterraumeigenschaft"),
        s("Seien $u, v \\in U_1 \\cap U_2$. Dann $u + v \\in U_1$ und $u + v \\in U_2$.", "Unterraumeigenschaft"),
        s("Also $u + v \\in U_1 \\cap U_2$; genauso $\\lambda u \\in U_1 \\cap U_2$.", "Definition des Schnitts"),
        s("Nach dem Unterraumkriterium ist $U_1 \\cap U_2$ ein Unterraum.", "Unterraumkriterium"),
      ],
      distractors: [
        d("Seien $u \\in U_1$ und $v \\in U_2$. Dann liegt $u + v$ in $U_1 \\cap U_2$.", "Die Summe muss nicht im Schnitt liegen; man nimmt beide Vektoren aus dem Schnitt."),
        d("$U_1 \\cap U_2$ ist eine Teilmenge von $V$, also ein Unterraum.", "Nicht jede Teilmenge ist ein Unterraum."),
      ],
      flaw: { line: 1, md: "Seien $u \\in U_1$ und $v \\in U_2$. Dann ist $u + v \\in U_1 \\cap U_2$.", why: "Für beliebige $u \\in U_1$, $v \\in U_2$ stimmt das nicht. Beide Vektoren müssen aus dem Schnitt kommen." } },
    { lv: 2, kind: "gegenbeispiel", given: "$U_1, U_2$ sind Unterräume von $\\R^2$.", claim: "$U_1 \\cup U_2$ ist im Allgemeinen kein Unterraum.",
      idea: "Zwei Achsen: Jede ist ein Unterraum, ihre Vereinigung ist nicht abgeschlossen unter Addition.",
      steps: [
        s("Nimm $U_1 = \\{(x, 0)\\}$, die $x$-Achse, und $U_2 = \\{(0, y)\\}$, die $y$-Achse.", "Gegenbeispiel wählen"),
        s("$(1, 0) \\in U_1$ und $(0, 1) \\in U_2$ liegen in $U_1 \\cup U_2$.", "Nachrechnen"),
        s("Ihre Summe $(1, 1)$ liegt weder auf der $x$- noch auf der $y$-Achse.", "Nachrechnen"),
        s("$U_1 \\cup U_2$ ist nicht abgeschlossen unter Addition, also kein Unterraum.", "Unterraumkriterium"),
      ],
      distractors: [
        d("Nimm $U_1 = U_2 =$ die $x$-Achse.", "Dann ist die Vereinigung wieder die $x$-Achse, ein Unterraum."),
        d("Der Nullvektor fehlt in $U_1 \\cup U_2$.", "$0$ liegt in beiden Unterräumen, also auch in der Vereinigung."),
      ],
      flaw: { line: 3, md: "$U_1 \\cup U_2$ enthält den Nullvektor nicht und ist darum kein Unterraum.", why: "Der Nullvektor liegt in $U_1$ und $U_2$. Was scheitert, ist die Abgeschlossenheit unter Addition." } },
    { lv: 2, kind: "direkt", given: "$B$ und $C$ sind Inverse der Matrix $A$: $AB = BA = E$ und $AC = CA = E$.", claim: "$B = C$.",
      idea: "$B = BE = B(AC) = (BA)C = EC = C$.",
      steps: [
        s("$B = BE$.", "Neutrales Element"),
        s("$BE = B(AC)$.", "Voraussetzung"),
        s("$B(AC) = (BA)C$.", "Assoziativgesetz"),
        s("$(BA)C = EC = C$.", "Voraussetzung"),
      ],
      distractors: [
        d("$B(AC) = (BC)A$.", "Matrixmultiplikation ist nicht kommutativ; nur die Klammern dürfen wandern."),
        d("$AB = AC$, also kürzt man $A$ und erhält $B = C$.", "Kürzen hieße mit $A^{-1}$ multiplizieren; dessen Eindeutigkeit wird gerade bewiesen."),
      ],
      flaw: { line: 2, md: "$B(AC) = (BC)A$.", why: "Nur die Klammern dürfen wandern (Assoziativgesetz), die Reihenfolge der Faktoren nicht." } },
    { lv: 4, kind: "direkt", given: "$Av = \\lambda v$ und $Aw = \\mu w$ mit $v, w \\ne 0$ und $\\lambda \\ne \\mu$.", claim: "$v$ und $w$ sind linear unabhängig.",
      idea: "Eine Linearkombination $= 0$ einmal mit $A$ und einmal mit $\\lambda$ multiplizieren und subtrahieren.",
      steps: [
        s("Sei $a v + b w = 0$.", "Definition der linearen Unabhängigkeit"),
        s("$A$ anwenden: $a\\lambda v + b\\mu w = 0$.", "Linearität"),
        s("Die erste Gleichung mal $\\lambda$: $a\\lambda v + b\\lambda w = 0$.", "Äquivalenzumformung"),
        s("Subtrahieren: $b(\\mu - \\lambda) w = 0$; wegen $\\mu \\ne \\lambda$ und $w \\ne 0$ ist $b = 0$.", "Nullteilerfreiheit"),
        s("Dann $a v = 0$, und wegen $v \\ne 0$ auch $a = 0$.", "Nullteilerfreiheit"),
      ],
      distractors: [
        d("$A$ anwenden: $a\\lambda v + b\\lambda w = 0$.", "$w$ gehört zum Eigenwert $\\mu$: $Aw = \\mu w$."),
        d("Wegen $\\lambda \\ne \\mu$ ist $v \\ne w$, also sind sie unabhängig.", "Verschieden heißt nicht linear unabhängig: $v$ und $2v$ sind verschieden, aber abhängig."),
      ],
      flaw: { line: 1, md: "$A$ anwenden: $a\\lambda v + b\\lambda w = 0$.", why: "$w$ ist Eigenvektor zum Eigenwert $\\mu$, also $A(bw) = b\\mu w$." } },
    { lv: 1, kind: "direkt", given: "$A$ ist invertierbar.", claim: "$Ax = b$ hat genau eine Lösung, nämlich $x = A^{-1}b$.",
      idea: "Erst zeigen, dass $A^{-1}b$ eine Lösung ist, dann dass jede Lösung diese ist.",
      steps: [
        s("$x = A^{-1}b$ ist eine Lösung: $A(A^{-1}b) = (AA^{-1})b = b$.", "Assoziativgesetz"),
        s("Sei $y$ irgendeine Lösung, also $Ay = b$.", "Voraussetzung"),
        s("Von links mit $A^{-1}$ multiplizieren: $y = A^{-1}Ay = A^{-1}b$.", "Inverse Matrix"),
        s("Jede Lösung ist also $A^{-1}b$: Die Lösung ist eindeutig.", "Eindeutigkeit"),
      ],
      distractors: [
        d("Von rechts mit $A^{-1}$ multiplizieren: $y = bA^{-1}$.", "$A$ steht links von $y$, also muss auch $A^{-1}$ von links kommen; $bA^{-1}$ ist nicht einmal definiert."),
        d("Weil $\\det A \\ne 0$ ist, löst jeder Vektor das System.", "Die Determinante garantiert genau eine Lösung, nicht beliebig viele."),
      ],
      flaw: { line: 2, md: "Von rechts mit $A^{-1}$ multiplizieren: $y = bA^{-1}$.", why: "In $Ay = b$ steht $A$ links. $A^{-1}$ muss ebenfalls von links multipliziert werden." } },
  ];
  proofGen("beweis-la", "Beweise in der linearen Algebra", LA, {
    reasons: ["Neutrales Element", "Additivität", "Homogenität", "Inverses Element", "Unterraumkriterium", "Assoziativgesetz", "Kommutativgesetz", "Definition des Kerns",
      "Definition der Injektivität", "Linearität", "Voraussetzung", "Nachrechnen", "Gegenbeispiel wählen", "Nullteilerfreiheit", "Inverse Matrix"],
  });

  // ================================================================ probability from the axioms
  const STOCH = [
    { lv: 1, kind: "direkt", given: "Die Axiome von Kolmogorow: $P(A) \\ge 0$, $P(\\Omega) = 1$, und für disjunkte $A, B$ ist $P(A \\cup B) = P(A) + P(B)$.", claim: "$P(\\bar A) = 1 - P(A)$.",
      idea: "$A$ und $\\bar A$ sind disjunkt und ergeben zusammen $\\Omega$.",
      steps: [
        s("$A$ und $\\bar A$ sind disjunkt, und $A \\cup \\bar A = \\Omega$.", "Definition des Gegenereignisses"),
        s("$P(A \\cup \\bar A) = P(A) + P(\\bar A)$.", "Additivität"),
        s("$P(A \\cup \\bar A) = P(\\Omega) = 1$.", "Normierung"),
        s("Also $P(A) + P(\\bar A) = 1$, d. h. $P(\\bar A) = 1 - P(A)$.", "Umformen"),
      ],
      distractors: [
        d("$P(A \\cup \\bar A) = P(A) \\cdot P(\\bar A)$.", "Für disjunkte Ereignisse addieren sich die Wahrscheinlichkeiten."),
        d("$A$ und $\\bar A$ sind unabhängig.", "Disjunkt, nicht unabhängig; bei $0 < P(A) < 1$ sind sie sogar abhängig."),
      ],
      flaw: { line: 1, md: "$P(A \\cup \\bar A) = P(A) \\cdot P(\\bar A)$.", why: "Für disjunkte Ereignisse gilt die Summe (Additivität), kein Produkt." } },
    { lv: 1, kind: "direkt", given: "Die Axiome von Kolmogorow.", claim: "$P(\\emptyset) = 0$.",
      idea: "$\\Omega$ und $\\emptyset$ sind disjunkt, und $\\Omega \\cup \\emptyset = \\Omega$.",
      steps: [
        s("$\\Omega \\cap \\emptyset = \\emptyset$, also sind $\\Omega$ und $\\emptyset$ disjunkt.", "Definition disjunkt"),
        s("$P(\\Omega) = P(\\Omega \\cup \\emptyset) = P(\\Omega) + P(\\emptyset)$.", "Additivität"),
        s("$1 = 1 + P(\\emptyset)$.", "Normierung"),
        s("Also $P(\\emptyset) = 0$.", "Umformen"),
      ],
      distractors: [
        d("$P(\\emptyset) = 0$, weil das leere Ereignis nie eintritt.", "Anschaulich richtig, aber es muss aus den Axiomen folgen."),
        d("$P(\\Omega \\cup \\emptyset) = P(\\Omega) \\cdot P(\\emptyset)$.", "Disjunkte Vereinigungen werden zu Summen."),
      ],
      flaw: { line: 2, md: "$1 = 1 \\cdot P(\\emptyset)$.", why: "In Zeile 2 steht eine Summe, also $1 = 1 + P(\\emptyset)$." } },
    { lv: 2, kind: "direkt", given: "$A \\subseteq B$.", claim: "$P(A) \\le P(B)$.",
      idea: "$B$ in die disjunkten Teile $A$ und $B \\setminus A$ zerlegen.",
      steps: [
        s("$B = A \\cup (B \\setminus A)$, und die beiden Teile sind disjunkt.", "Zerlegung"),
        s("$P(B) = P(A) + P(B \\setminus A)$.", "Additivität"),
        s("$P(B \\setminus A) \\ge 0$.", "Nichtnegativität"),
        s("Also $P(B) \\ge P(A)$.", "Umformen"),
      ],
      distractors: [
        d("$P(B) = P(A) + P(B)$.", "$A$ liegt in $B$ und darf nicht doppelt zählen. Der Rest ist $B \\setminus A$."),
        d("$A$ und $B$ sind disjunkt.", "$A$ liegt ganz in $B$; disjunkt sind $A$ und $B \\setminus A$."),
      ],
      flaw: { line: 0, md: "$B = A \\cup B$, und die beiden Teile sind disjunkt.", why: "$A$ und $B$ sind nicht disjunkt, $A$ liegt ja in $B$. Disjunkt sind $A$ und $B \\setminus A$." } },
    { lv: 3, kind: "direkt", given: "$A, B$ sind beliebige Ereignisse.", claim: "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.",
      idea: "$A \\cup B$ und $B$ jeweils in disjunkte Teile zerlegen und den gemeinsamen Teil $B \\setminus A$ eliminieren.",
      steps: [
        s("$A \\cup B = A \\cup (B \\setminus A)$, disjunkt.", "Zerlegung"),
        s("$P(A \\cup B) = P(A) + P(B \\setminus A)$.", "Additivität"),
        s("$B = (A \\cap B) \\cup (B \\setminus A)$, disjunkt, also $P(B) = P(A \\cap B) + P(B \\setminus A)$.", "Additivität"),
        s("Mit $P(B \\setminus A) = P(B) - P(A \\cap B)$ folgt $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.", "Einsetzen"),
      ],
      distractors: [
        d("$P(A \\cup B) = P(A) + P(B)$.", "Nur bei disjunkten Ereignissen; sonst wird der Schnitt doppelt gezählt."),
        d("$B = A \\cup (B \\setminus A)$.", "Diese Vereinigung ist $A \\cup B$, nicht $B$."),
      ],
      flaw: { line: 1, md: "$P(A \\cup B) = P(A) + P(B)$.", why: "$A$ und $B$ müssen nicht disjunkt sein. Zerlegt wird $A \\cup B$ in $A$ und $B \\setminus A$." } },
    { lv: 3, kind: "direkt", given: "$P(A) > 0$ und $P(B) > 0$.", claim: "$P_B(A) = \\dfrac{P_A(B) \\cdot P(A)}{P(B)}$ (Satz von Bayes).",
      idea: "Den Schnitt $P(A \\cap B)$ auf zwei Arten mit bedingten Wahrscheinlichkeiten ausdrücken.",
      steps: [
        s("$P_B(A) = \\dfrac{P(A \\cap B)}{P(B)}$.", "Definition der bedingten Wahrscheinlichkeit"),
        s("$P_A(B) = \\dfrac{P(A \\cap B)}{P(A)}$, also $P(A \\cap B) = P_A(B) \\cdot P(A)$.", "Definition der bedingten Wahrscheinlichkeit"),
        s("Einsetzen: $P_B(A) = \\dfrac{P_A(B) \\cdot P(A)}{P(B)}$.", "Einsetzen"),
      ],
      distractors: [
        d("$P_B(A) = P_A(B)$.", "Die Richtung der Bedingung zählt; gleich sind beide nur bei $P(A) = P(B)$."),
        d("$P(A \\cap B) = P(A) \\cdot P(B)$.", "Das gilt nur bei Unabhängigkeit."),
      ],
      flaw: { line: 1, md: "$P(A \\cap B) = P(A) \\cdot P(B)$.", why: "Das setzt Unabhängigkeit voraus. Allgemein gilt $P(A \\cap B) = P_A(B) \\cdot P(A)$." } },
    { lv: 4, kind: "direkt", given: "$A$ und $B$ sind unabhängig: $P(A \\cap B) = P(A) \\cdot P(B)$.", claim: "$A$ und $\\bar B$ sind unabhängig.",
      idea: "$A$ zerfällt disjunkt in $A \\cap B$ und $A \\cap \\bar B$.",
      steps: [
        s("$A = (A \\cap B) \\cup (A \\cap \\bar B)$, disjunkt.", "Zerlegung"),
        s("$P(A \\cap \\bar B) = P(A) - P(A \\cap B)$.", "Additivität"),
        s("$= P(A) - P(A) \\cdot P(B)$.", "Voraussetzung"),
        s("$= P(A)\\,(1 - P(B)) = P(A) \\cdot P(\\bar B)$.", "Gegenwahrscheinlichkeit"),
      ],
      distractors: [
        d("$P(A \\cap \\bar B) = 1 - P(A \\cap B)$.", "Das ist die Wahrscheinlichkeit von »nicht beide«, nicht $P(A \\cap \\bar B)$."),
        d("$A$ und $\\bar B$ sind disjunkt.", "Nur wenn $A \\subseteq B$; im Allgemeinen nicht."),
      ],
      flaw: { line: 1, md: "$P(A \\cap \\bar B) = 1 - P(A \\cap B)$.", why: "$1 - P(A \\cap B)$ ist die Wahrscheinlichkeit von »nicht beide«. Richtig: $P(A) - P(A \\cap B)$." } },
  ];
  proofGen("beweis-stochastik", "Beweise aus den Axiomen", STOCH, {
    reasons: ["Additivität", "Normierung", "Nichtnegativität", "Zerlegung", "Umformen", "Einsetzen", "Definition der bedingten Wahrscheinlichkeit", "Voraussetzung",
      "Gegenwahrscheinlichkeit", "Definition disjunkt", "Unabhängigkeit"],
  }, { 1: ["next", "order", "gaps"], 2: ["order", "gaps", "next", "justify"], 3: ["gaps", "justify", "flaw", "order"], 4: ["flaw", "justify", "gaps", "order"] });
})();
