// More tasks for the CS50 AI generators: small Bayesian networks and Markov chains with fresh numbers, neurons
// for logic gates, CNF conversions and statement pools. Wording is our own, following the topics of the lectures.
(function () {
  const F = LW.forms;
  const dec = (G, x, d) => ({ answer: G.round(x, d), tolerance: 0.6 * Math.pow(10, -d), answerText: G.fmt(x, d), placeholder: "Dezimalzahl" });
  const P = (G, x) => G.tex(x, 2);

  // ================================================================ Bayesian networks
  const STORIES = [
    ["Regen", "nasse Straße"], ["Grippe", "Fieber"], ["Stau", "Verspätung"], ["Spam", "das Wort »Gewinn«"], ["Defekt", "Warnlampe"],
  ];
  LW.extend("cs-bayesnetz", {
    2: [(level, G) => {
      const [a, b] = G.pick(STORIES), pa = G.pick([0.1, 0.2, 0.3, 0.4]), pba = G.pick([0.7, 0.8, 0.9, 0.95]), pbn = G.pick([0.05, 0.1, 0.2, 0.3]);
      const pb = pa * pba + (1 - pa) * pbn;
      return Object.assign({ type: "numeric",
        md: "Ein Netz mit zwei Knoten: **" + a + "** $\\to$ **" + b + "**. $P(\\text{" + a + "}) = " + P(G, pa) + "$, $P(\\text{" + b + "} \\mid \\text{" + a + "}) = " + P(G, pba) + "$, $P(\\text{" + b + "} \\mid \\lnot\\text{" + a + "}) = " + P(G, pbn) + "$. Wie groß ist $P(\\text{" + b + "})$? (vier Nachkommastellen)",
        explain: "Über beide Fälle summieren (Marginalisieren): $" + P(G, pa) + " \\cdot " + P(G, pba) + " + " + G.tex(1 - pa, 2) + " \\cdot " + P(G, pbn) + " = " + G.tex(pb, 4) + "$." }, dec(G, pb, 4));
    }],
    3: [(level, G) => {
      const [a, b] = G.pick(STORIES), pa = G.pick([0.05, 0.1, 0.2, 0.3]), pba = G.pick([0.7, 0.8, 0.9, 0.95]), pbn = G.pick([0.05, 0.1, 0.2]);
      const pb = pa * pba + (1 - pa) * pbn, post = (pa * pba) / pb;
      return Object.assign({ type: "numeric",
        md: "Netz **" + a + "** $\\to$ **" + b + "** mit $P(\\text{" + a + "}) = " + P(G, pa) + "$, $P(\\text{" + b + "} \\mid \\text{" + a + "}) = " + P(G, pba) + "$, $P(\\text{" + b + "} \\mid \\lnot\\text{" + a + "}) = " + P(G, pbn) + "$. Beobachtet wird " + b + ". Wie groß ist $P(\\text{" + a + "} \\mid \\text{" + b + "})$? (vier Nachkommastellen)",
        hint: "Satz von Bayes: Zähler $P(\\text{" + a + "}) \\cdot P(\\text{" + b + "} \\mid \\text{" + a + "})$, Nenner $P(\\text{" + b + "})$.",
        explain: "$P(\\text{" + b + "}) = " + G.tex(pb, 4) + "$, also $\\tfrac{" + P(G, pa) + " \\cdot " + P(G, pba) + "}{" + G.tex(pb, 4) + "} \\approx " + G.tex(post, 4) + "$." }, dec(G, post, 4));
    }],
  });
  LW.extend("cs-bayesnetz", F.statements([
    { lv: 2, ok: true, md: "In einem Bayes-Netz hängt jeder Knoten direkt nur von seinen Elternknoten ab.", why: "Gegeben die Eltern ist er von seinen übrigen Vorfahren unabhängig." },
    { lv: 2, ok: false, md: "Ein Bayes-Netz darf gerichtete Kreise enthalten.", why: "Es ist ein gerichteter azyklischer Graph." },
    { lv: 2, ok: true, md: "Die gemeinsame Verteilung ist das Produkt der bedingten Wahrscheinlichkeiten aller Knoten, gegeben ihre Eltern.", why: "Das ist die Kettenregel, verkürzt durch die Struktur des Netzes." },
    { lv: 3, ok: true, md: "Inferenz durch Aufzählung summiert über alle Werte der versteckten Variablen.", why: "Danach wird normiert, damit die Wahrscheinlichkeiten zusammen $1$ ergeben." },
    { lv: 3, ok: false, md: "Rejection Sampling ist besonders effizient, wenn die Evidenz sehr unwahrscheinlich ist.", why: "Dann wird fast jede Stichprobe verworfen. Likelihood Weighting hilft genau hier." },
    { lv: 3, ok: true, md: "Likelihood Weighting setzt die Evidenz fest und gewichtet jede Stichprobe mit der Wahrscheinlichkeit dieser Evidenz.", why: "So wird keine Stichprobe verschwendet." },
    { lv: 4, ok: false, md: "Zwei Knoten ohne direkte Kante sind in einem Bayes-Netz immer unabhängig.", why: "Über gemeinsame Vorfahren oder Ketten können sie abhängig sein." },
    { lv: 4, ok: true, md: "Die Tabelle eines binären Knotens mit zwei binären Eltern hat vier Zeilen.", why: "Eine Zeile für jede Kombination der Eltern." },
    { lv: 4, ok: false, md: "Sampling liefert nach einer festen Zahl von Stichproben die exakte Wahrscheinlichkeit.", why: "Es liefert Schätzungen, die mit mehr Stichproben genauer werden." },
    { lv: 4, ok: true, md: "In großen Netzen ist exakte Inferenz oft zu aufwendig, deshalb schätzt man durch Stichproben.", why: "Die Zahl der Summanden wächst exponentiell mit den versteckten Variablen." },
  ], { 2: ["tf"], 3: ["tf", "sort"], 4: ["spot", "multi"] }));

  // ================================================================ propositional logic: CNF and resolution
  const CNF = [
    ["\\lnot (P \\lor Q)", "\\lnot P \\land \\lnot Q", ["\\lnot P \\lor \\lnot Q", "P \\land Q", "\\lnot P \\lor Q"]],
    ["P \\to (Q \\land R)", "(\\lnot P \\lor Q) \\land (\\lnot P \\lor R)", ["(P \\lor Q) \\land (P \\lor R)", "\\lnot P \\land Q \\land R", "(\\lnot P \\land Q) \\lor R"]],
    ["(P \\land Q) \\to R", "\\lnot P \\lor \\lnot Q \\lor R", ["(\\lnot P \\land \\lnot Q) \\lor R", "\\lnot P \\land \\lnot Q \\land R", "P \\lor Q \\lor \\lnot R"]],
    ["P \\lor (Q \\land R)", "(P \\lor Q) \\land (P \\lor R)", ["(P \\land Q) \\lor (P \\land R)", "P \\land (Q \\lor R)", "(P \\lor Q) \\land R"]],
    ["\\lnot (P \\land Q) \\to R", "(P \\lor R) \\land (Q \\lor R)", ["(\\lnot P \\lor R) \\land (\\lnot Q \\lor R)", "P \\land Q \\land R", "(P \\land Q) \\lor \\lnot R"]],
    ["(P \\lor Q) \\to R", "(\\lnot P \\lor R) \\land (\\lnot Q \\lor R)", ["\\lnot P \\lor \\lnot Q \\lor R", "(P \\lor R) \\land (Q \\lor R)", "\\lnot (P \\lor Q) \\land R"]],
  ];
  LW.extend("cs-inferenz", {
    3: [(level, G) => {
      const [f, right, wrong] = G.pick(CNF);
      return {
        type: "choice",
        md: "Welche Formel ist die **konjunktive Normalform** (KNF) von $" + f + "$?",
        options: G.options({ md: "$" + right + "$" }, wrong.map((w) => ({ md: "$" + w + "$", why: "Nicht gleichwertig oder keine Konjunktion von Klauseln." }))),
        explain: "Implikationen auflösen ($A \\to B \\equiv \\lnot A \\lor B$), Negationen mit De Morgan nach innen, dann $\\lor$ über $\\land$ verteilen. Ergebnis: $" + right + "$.",
      };
    }],
  });
  LW.extend("cs-inferenz", F.statements([
    { lv: 3, ok: true, md: "Resolution leitet aus $(P \\lor Q)$ und $(\\lnot P \\lor R)$ die Klausel $(Q \\lor R)$ ab.", why: "$P$ und $\\lnot P$ heben sich auf, der Rest wird verbunden." },
    { lv: 3, ok: false, md: "Aus $(P \\lor Q)$ und $(\\lnot P \\lor \\lnot Q)$ folgt durch Resolution die leere Klausel.", why: "Resolution über $P$ ergibt $(Q \\lor \\lnot Q)$, eine Tautologie, keine leere Klausel." },
    { lv: 3, ok: true, md: "Ergibt Resolution die leere Klausel, ist die Klauselmenge widersprüchlich.", why: "Die leere Klausel ist nie erfüllbar." },
    { lv: 3, ok: true, md: "Um $KB \\models \\alpha$ zu zeigen, fügt man $\\lnot\\alpha$ hinzu und sucht einen Widerspruch.", why: "Das ist der Widerspruchsbeweis mit Resolution." },
    { lv: 4, ok: false, md: "Modell-Checking prüft nur ein einziges Modell.", why: "Es prüft alle Belegungen der Aussagesymbole." },
    { lv: 4, ok: true, md: "Bei $n$ Aussagesymbolen muss Modell-Checking bis zu $2^n$ Modelle prüfen.", why: "Jedes Symbol ist wahr oder falsch." },
    { lv: 4, ok: false, md: "Nur Formeln ohne Implikation lassen sich in KNF bringen.", why: "Jede Formel hat eine KNF; Implikationen löst man zuerst auf." },
    { lv: 4, ok: true, md: "$P \\to Q$ ist gleichwertig zu $\\lnot Q \\to \\lnot P$.", why: "Das ist die Kontraposition." },
  ], { 3: ["tf"], 4: ["spot", "multi"] }));

  // ================================================================ Markov chains
  LW.extend("cs-markov", {
    2: [(level, G) => {
      const ss = G.pick([0.6, 0.7, 0.75, 0.8, 0.85, 0.9]), rr = G.pick([0.5, 0.55, 0.6, 0.7, 0.8]), days = G.int(1, 3);
      let s = 1, r = 0;
      for (let d = 0; d < days; d++) { const ns = s * ss + r * (1 - rr); r = s * (1 - ss) + r * rr; s = ns; }
      return Object.assign({ type: "numeric",
        md: "Wetter als Markov-Kette: Auf Sonne folgt Sonne mit $" + P(G, ss) + "$, auf Regen folgt Regen mit $" + P(G, rr) + "$. Heute scheint die Sonne. Wie wahrscheinlich ist Sonne in $" + days + "$ " + (days === 1 ? "Tag" : "Tagen") + "? (vier Nachkommastellen)",
        explain: "Tag für Tag weiterrechnen: $P_{\\text{neu}}(\\text{Sonne}) = P(\\text{Sonne}) \\cdot " + P(G, ss) + " + P(\\text{Regen}) \\cdot " + G.tex(1 - rr, 2) + "$. Nach $" + days + "$ " + (days === 1 ? "Tag" : "Tagen") + " $\\approx " + G.tex(s, 4) + "$." }, dec(G, s, 4));
    }],
    3: [(level, G) => {
      const ss = G.pick([0.6, 0.7, 0.8, 0.9]), rr = G.pick([0.5, 0.6, 0.7, 0.8]);
      const pi = (1 - rr) / (2 - ss - rr);
      return Object.assign({ type: "numeric",
        md: "Auf Sonne folgt Sonne mit $" + P(G, ss) + "$, auf Regen folgt Regen mit $" + P(G, rr) + "$. Welcher Anteil der Tage ist auf lange Sicht sonnig (stationäre Verteilung)? (vier Nachkommastellen)",
        hint: "Im Gleichgewicht fließt gleich viel von Sonne zu Regen wie umgekehrt: $\\pi \\cdot " + G.tex(1 - ss, 2) + " = (1 - \\pi) \\cdot " + G.tex(1 - rr, 2) + "$.",
        explain: "$\\pi = \\tfrac{" + G.tex(1 - rr, 2) + "}{" + G.tex(1 - ss, 2) + " + " + G.tex(1 - rr, 2) + "} \\approx " + G.tex(pi, 4) + "$." }, dec(G, pi, 4));
    }],
  });

  // ================================================================ neural networks
  const GATES = {
    AND: { w: (k) => [-1.5 * k, k, k], f: (a, b) => a && b },
    OR: { w: (k) => [-0.5 * k, k, k], f: (a, b) => a || b },
    NAND: { w: (k) => [1.5 * k, -k, -k], f: (a, b) => !(a && b) },
    NOR: { w: (k) => [0.5 * k, -k, -k], f: (a, b) => !(a || b) },
  };
  LW.extend("cs-nn", {
    3: [(level, G) => {
      const name = G.pick(Object.keys(GATES)), k = G.pick([1, 2, 3, 4]);
      const [w0, w1, w2] = GATES[name].w(k);
      const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => "$(" + a + ", " + b + ") \\mapsto " + (w0 + w1 * a + w2 * b >= 0 ? 1 : 0) + "$");
      return {
        type: "choice",
        md: "Ein Neuron mit Stufenfunktion ($1$, wenn $w_0 + w_1 x_1 + w_2 x_2 \\ge 0$, sonst $0$) hat die Gewichte $w_0 = " + G.tex(w0) + "$, $w_1 = " + G.tex(w1) + "$, $w_2 = " + G.tex(w2) + "$. Welche logische Funktion berechnet es?",
        options: ["AND", "OR", "NAND", "NOR", "XOR"].map((g) => ({ md: g, correct: g === name, why: g === "XOR" ? "XOR kann ein einzelnes Neuron gar nicht darstellen, die Fälle sind nicht durch eine Gerade trennbar." : g === name ? null : "Rechne die vier Eingaben durch: " + rows.join(", ") + "." })),
        explain: "Die vier Eingaben ergeben " + rows.join(", ") + ". Das ist " + name + ".",
      };
    }],
  });
  LW.extend("cs-nn", F.statements([
    { lv: 2, ok: true, md: "Ein einzelnes Perzeptron kann XOR nicht darstellen.", why: "Die Fälle von XOR lassen sich nicht durch eine Gerade trennen." },
    { lv: 2, ok: true, md: "Die ReLU-Funktion gibt für negative Eingaben $0$ aus.", why: "$\\operatorname{ReLU}(x) = \\max(0, x)$." },
    { lv: 2, ok: false, md: "Die Sigmoid-Funktion liefert Werte zwischen $-1$ und $1$.", why: "Sie liefert Werte zwischen $0$ und $1$; $\\tanh$ liefert $-1$ bis $1$." },
    { lv: 3, ok: true, md: "Gradientenabstieg ändert die Gewichte in Richtung des steilsten Abstiegs der Verlustfunktion.", why: "Man geht ein Stück entgegen dem Gradienten." },
    { lv: 3, ok: false, md: "Backpropagation berechnet die Ausgabe des Netzes, nicht die Gradienten.", why: "Backpropagation verteilt den Fehler rückwärts durch das Netz und berechnet so die Gradienten." },
    { lv: 3, ok: true, md: "Stochastischer Gradientenabstieg nutzt je Schritt nur einen Datenpunkt oder eine kleine Stichprobe.", why: "Das ist schneller, dafür etwas unruhiger." },
    { lv: 4, ok: false, md: "Mehr versteckte Schichten schützen vor Überanpassung.", why: "Größere Netze passen sich eher zu stark an. Dagegen helfen Dropout, Regularisierung und mehr Daten." },
    { lv: 4, ok: true, md: "Dropout schaltet beim Training zufällig Neuronen ab, um Überanpassung zu verringern.", why: "Das Netz kann sich so nicht auf einzelne Neuronen verlassen." },
    { lv: 4, ok: true, md: "Faltungsschichten erkennen lokale Muster wie Kanten, mit demselben Filter an vielen Stellen.", why: "Geteilte Gewichte sparen Parameter und erkennen Muster überall im Bild." },
    { lv: 4, ok: false, md: "Pooling erhöht die Auflösung eines Bildes.", why: "Pooling verkleinert, etwa durch das Maximum je $2 \\times 2$-Block." },
  ], { 2: ["tf"], 3: ["tf", "sort"], 4: ["spot", "multi"] }));
})();
