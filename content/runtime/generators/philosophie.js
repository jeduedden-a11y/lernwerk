// Ethics and philosophy (Ethik Oberstufe Hessen, Q1 Grundpositionen; Logik): valid arguments and fallacies,
// utilitarianism, Kant's ethics of duty, Aristotle's virtue ethics. Number templates for the hedonic calculus,
// content pools via LW.forms and arguments as proof tasks (build, justify, find the fallacy). Own wording throughout.
(function () {
  const F = LW.forms;
  const s = (md, by, why) => ({ md, by, why });
  const d = (md, why) => ({ md, why });
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }

  // ================================================================ arguments
  const KINDS = { mp: "Modus ponens", mt: "Modus tollens", kette: "Kettenschluss", ds: "Disjunktiver Syllogismus", reductio: "Reductio ad absurdum" };
  const KIND_WHY = {
    mp: "Modus ponens: Wenn A, dann B; A; also B.",
    mt: "Modus tollens: Wenn A, dann B; nicht B; also nicht A.",
    kette: "Kettenschluss: Wenn A, dann B; wenn B, dann C; also wenn A, dann C.",
    ds: "Disjunktiver Syllogismus: A oder B; nicht A; also B.",
    reductio: "Reductio: Man nimmt eine These an und zeigt, dass sie zu einem Widerspruch führt.",
  };
  const RULES = ["Prämisse", "Modus ponens", "Modus tollens", "Kettenschluss", "Disjunktiver Syllogismus", "Annahme", "Folgerung", "Widerspruch", "Reductio"];
  const ARGUMENTS = [
    { lv: 1, kind: "mp", claim: "Sokrates ist sterblich.", idea: "Eine Wenn-dann-Prämisse und ihr Vorderglied ergeben das Hinterglied.",
      steps: [
        s("Wenn jemand ein Mensch ist, dann ist er sterblich.", "Prämisse"),
        s("Sokrates ist ein Mensch.", "Prämisse"),
        s("Also ist Sokrates sterblich.", "Modus ponens"),
      ],
      distractors: [d("Also sind alle Sterblichen Menschen.", "Das kehrt die erste Prämisse um; auch Tiere sind sterblich."), d("Sokrates war Philosoph in Athen.", "Stimmt, gehört aber nicht zum Argument.")],
      flaw: { line: 2, md: "Also ist jedes sterbliche Wesen ein Mensch wie Sokrates.", why: "Die erste Prämisse sagt nur, dass Menschen sterblich sind. Die Umkehrung folgt nicht." } },
    { lv: 2, kind: "mt", claim: "Der Handlungsutilitarismus ist in dieser Form nicht haltbar.", idea: "Eine Theorie mit einer unannehmbaren Folge wird per Modus tollens zurückgewiesen.",
      steps: [
        s("Wenn der Handlungsutilitarismus stimmt, dann ist es geboten, einen Gesunden zu töten, um mit seinen Organen fünf Kranke zu retten.", "Prämisse"),
        s("Es ist nicht geboten, einen Gesunden für seine Organe zu töten.", "Prämisse", "Diese Prämisse stützt sich auf eine starke moralische Überzeugung."),
        s("Also stimmt der Handlungsutilitarismus nicht.", "Modus tollens"),
      ],
      distractors: [d("Also ist es geboten, den Gesunden zu töten.", "Das widerspricht der zweiten Prämisse."), d("Fünf Leben wiegen mehr als eines.", "Das ist die utilitaristische Rechnung, die das Argument gerade angreift.")],
      flaw: { line: 2, md: "Also ist der Handlungsutilitarismus richtig, denn er rettet fünf Leben.", why: "Aus den Prämissen folgt per Modus tollens das Gegenteil: Die Theorie hat eine unannehmbare Folge." } },
    { lv: 2, kind: "kette", claim: "Wer lügt, handelt nicht moralisch.", idea: "Zwei Wenn-dann-Sätze lassen sich verketten, wenn das Hinterglied des einen das Vorderglied des anderen ist.",
      steps: [
        s("Wenn man lügt, kann die Maxime der Handlung nicht allgemeines Gesetz werden.", "Prämisse"),
        s("Wenn eine Maxime nicht allgemeines Gesetz werden kann, verstößt die Handlung gegen den kategorischen Imperativ.", "Prämisse"),
        s("Also: Wenn man lügt, verstößt die Handlung gegen den kategorischen Imperativ.", "Kettenschluss"),
        s("Wer gegen den kategorischen Imperativ verstößt, handelt nicht moralisch.", "Prämisse"),
        s("Also: Wer lügt, handelt nicht moralisch.", "Kettenschluss"),
      ],
      distractors: [d("Also: Wer nicht moralisch handelt, lügt.", "Das kehrt die Folgerung um; es gibt viele andere unmoralische Handlungen."), d("Manche Lügen haben gute Folgen.", "Ein utilitaristischer Einwand, aber kein Schritt in diesem Argument.")],
      flaw: { line: 4, md: "Also: Wer nicht moralisch handelt, hat gelogen.", why: "Aus »Wenn A, dann B« folgt nicht »Wenn B, dann A«. Das ist ein Fehlschluss." } },
    { lv: 3, kind: "ds", claim: "Der menschliche Wille ist frei.", idea: "Von zwei Möglichkeiten, von denen eine gelten muss, bleibt die andere, wenn die eine ausgeschlossen ist.",
      steps: [
        s("Entweder ist der menschliche Wille frei, oder alle Handlungen sind vollständig vorherbestimmt.", "Prämisse", "Kritiker halten genau das für ein falsches Dilemma; gültig ist das Argument trotzdem."),
        s("Nicht alle Handlungen sind vollständig vorherbestimmt.", "Prämisse"),
        s("Also ist der menschliche Wille frei.", "Disjunktiver Syllogismus"),
      ],
      distractors: [d("Also sind alle Handlungen vorherbestimmt.", "Das schließt die zweite Prämisse gerade aus."), d("Weil die erste Prämisse ein falsches Dilemma ist, ist die Konklusion falsch.", "Eine zweifelhafte Prämisse macht das Argument nicht schlüssig, die Konklusion aber nicht automatisch falsch.")],
      flaw: { line: 2, md: "Also sind beide Möglichkeiten falsch.", why: "Wenn eine von zwei Möglichkeiten zutreffen muss und eine ausgeschlossen ist, bleibt die andere." } },
    { lv: 3, kind: "reductio", claim: "Der Satz »Alle Wahrheit ist relativ« kann nicht absolut wahr sein.", idea: "Man nimmt das Gegenteil an und zeigt, dass es sich selbst widerspricht.",
      steps: [
        s("Angenommen, der Satz »Alle Wahrheit ist relativ« ist absolut wahr.", "Annahme"),
        s("Dann gibt es mindestens eine absolute Wahrheit, nämlich diesen Satz.", "Folgerung"),
        s("Das widerspricht seinem Inhalt, nach dem es keine absolute Wahrheit gibt.", "Widerspruch"),
        s("Also kann der Satz nicht absolut wahr sein.", "Reductio"),
      ],
      distractors: [d("Dann ist der Satz nur für manche Menschen wahr.", "Angenommen ist gerade, dass er absolut, also für alle, wahr ist."), d("Also ist alle Wahrheit absolut.", "Das folgt nicht: Widerlegt ist nur, dass der Relativismus absolut wahr ist.")],
      flaw: { line: 2, md: "Das bestätigt seinen Inhalt, denn er ist ja wahr.", why: "Ein absolut wahrer Satz ist genau das, was der Satz bestreitet: ein Widerspruch, keine Bestätigung." } },
    { lv: 3, kind: "mp", claim: "Wir sollten für die Hungerhilfe spenden.", idea: "Peter Singers Argument: ein allgemeines Prinzip, zwei Tatsachenprämissen, dann Modus ponens.",
      steps: [
        s("Wenn wir etwas sehr Schlechtes verhindern können, ohne etwas moralisch Vergleichbares zu opfern, dann sollten wir es tun.", "Prämisse"),
        s("Der Tod durch Hunger ist sehr schlecht.", "Prämisse"),
        s("Mit Spenden können wir Hungertote verhindern, ohne etwas moralisch Vergleichbares zu opfern.", "Prämisse"),
        s("Also sollten wir spenden.", "Modus ponens"),
      ],
      distractors: [d("Also sind wir an jedem Hungertod schuld.", "Das behauptet die Konklusion nicht; sie begründet eine Pflicht zu helfen."), d("Entfernte Menschen zählen weniger als nahe.", "Ein Einwand gegen das Argument, den Singer ausdrücklich zurückweist.")],
      flaw: { line: 3, md: "Also sollten wir alles spenden, was wir besitzen.", why: "Die erste Prämisse verlangt nur Opfer, die nicht moralisch vergleichbar sind. Diese Konklusion geht darüber hinaus." } },
    { lv: 4, kind: "mp", claim: "Der Mensch ist gut, wenn er seine Vernunft gut gebraucht.", idea: "Das Ergon-Argument des Aristoteles: Gut ist, was seine eigentümliche Tätigkeit gut ausübt.",
      steps: [
        s("Wenn etwas eine eigentümliche Tätigkeit hat, dann ist es gut, wenn es diese Tätigkeit gut ausübt.", "Prämisse", "Ein Flötenspieler ist gut, wenn er gut Flöte spielt, ein Messer, wenn es gut schneidet."),
        s("Der Mensch hat eine eigentümliche Tätigkeit: das Tätigsein der Vernunft.", "Prämisse", "Leben und Wahrnehmen teilt er mit Pflanzen und Tieren, die Vernunft nicht."),
        s("Also ist der Mensch gut, wenn er seine Vernunft gut gebraucht.", "Modus ponens"),
        s("Seine Vernunft gut gebrauchen heißt: gemäß der Tugend tätig sein, ein ganzes Leben lang. Das ist Glück, eudaimonia.", "Folgerung"),
      ],
      distractors: [d("Der Mensch ist gut, wenn er möglichst viel Lust empfindet.", "Lust teilt er mit den Tieren; sie ist nicht seine eigentümliche Tätigkeit."), d("Also ist jedes vernünftige Wesen glücklich.", "Vernunft zu haben reicht nicht, man muss sie gut gebrauchen.")],
      flaw: { line: 2, md: "Also ist jeder Mensch gut, weil jeder Mensch Vernunft hat.", why: "Die erste Prämisse verlangt, dass die Tätigkeit gut ausgeübt wird. Vernunft nur zu haben genügt nicht." } },
  ];
  const ARG_OPTS = { kinds: KINDS, kindWhy: KIND_WHY, confuse: {}, reasons: RULES,
    order: "Baue das Argument: erst die Prämissen, dann die Folgerungen.", gaps: "Im Argument fehlen Zeilen. Fülle die Lücken.",
    justify: "Wähle für jede Zeile, ob sie Prämisse ist oder mit welcher Schlussregel sie folgt.", flaw: "In diesem Argument steckt genau ein Fehlschluss. In welcher Zeile?",
    strategy: "Welche Schlussform trägt dieses Argument?", next: "Wie geht das Argument weiter?" };
  const ARG = F.proofs(ARGUMENTS, { 2: ["order", "strategy"], 3: ["gaps", "justify", "next"], 4: ["flaw", "justify", "strategy", "order"] }, ARG_OPTS);

  const COND = [
    { wenn: "es regnet", dann: "ist die Straße nass", a: "Es regnet.", b: "Die Straße ist nass.", na: "Es regnet nicht.", nb: "Die Straße ist nicht nass.", other: "Ein Wasserrohr ist gebrochen: Die Straße ist nass, obwohl es nicht regnet." },
    { wenn: "Anna die Prüfung besteht", dann: "feiert sie", a: "Anna besteht die Prüfung.", b: "Anna feiert.", na: "Anna besteht die Prüfung nicht.", nb: "Anna feiert nicht.", other: "Anna ist durchgefallen, feiert aber ihren Geburtstag." },
    { wenn: "der Akku leer ist", dann: "startet das Handy nicht", a: "Der Akku ist leer.", b: "Das Handy startet nicht.", na: "Der Akku ist nicht leer.", nb: "Das Handy startet.", other: "Das Display ist kaputt: Das Handy startet nicht, obwohl der Akku voll ist." },
    { wenn: "eine Zahl durch 6 teilbar ist", dann: "ist sie durch 3 teilbar", a: "Die Zahl ist durch 6 teilbar.", b: "Die Zahl ist durch 3 teilbar.", na: "Die Zahl ist nicht durch 6 teilbar.", nb: "Die Zahl ist nicht durch 3 teilbar.", other: "Die Zahl 9 ist durch 3 teilbar, aber nicht durch 6." },
    { wenn: "eine Handlung aus Pflicht geschieht", dann: "hat sie nach Kant moralischen Wert", a: "Die Handlung geschieht aus Pflicht.", b: "Die Handlung hat moralischen Wert.", na: "Die Handlung geschieht nicht aus Pflicht.", nb: "Die Handlung hat keinen moralischen Wert." },
    { wenn: "ein Wesen leidensfähig ist", dann: "zählen seine Interessen nach Singer moralisch", a: "Das Schwein ist leidensfähig.", b: "Die Interessen des Schweins zählen moralisch.", na: "Das Schwein ist nicht leidensfähig.", nb: "Die Interessen des Schweins zählen nicht moralisch." },
  ];
  const FORMS = {
    mp: { name: "Modus ponens", valid: true, p2: (c) => c.a, concl: (c) => c.b, why: "Gültig: Gilt die Wenn-dann-Prämisse und ihr Vorderglied, muss auch das Hinterglied gelten." },
    mt: { name: "Modus tollens", valid: true, p2: (c) => c.nb, concl: (c) => c.na, why: "Gültig: Wäre das Vorderglied wahr, müsste das Hinterglied wahr sein; es ist aber falsch." },
    ac: { name: "Bejahung des Hinterglieds (Fehlschluss)", valid: false, p2: (c) => c.b, concl: (c) => c.a, why: "Ungültig: Das Hinterglied kann auch aus einem anderen Grund wahr sein." },
    da: { name: "Verneinung des Vorderglieds (Fehlschluss)", valid: false, p2: (c) => c.na, concl: (c) => c.nb, why: "Ungültig: Auch ohne das Vorderglied kann das Hinterglied wahr sein." },
  };
  const argText = (c, f) => "1. Wenn " + c.wenn + ", " + c.dann + ".\n2. " + f.p2(c) + "\n\nAlso: " + f.concl(c);

  gen("phi-argumente", "Gültige Argumente", {
    1: [(lv, G) => {
      const c = G.pick(COND), key = G.pick(Object.keys(FORMS)), f = FORMS[key];
      return { type: "choice", md: "Ist das Argument gültig, folgt die Konklusion also zwingend aus den Prämissen?\n\n" + argText(c, f),
        options: [{ md: "gültig", correct: f.valid, why: f.why }, { md: "ungültig", correct: !f.valid, why: f.why }], explain: f.name + ". " + f.why };
    }],
    2: [(lv, G) => {
      const c = G.pick(COND), key = G.pick(Object.keys(FORMS)), f = FORMS[key];
      return { type: "choice", md: "Welche Schlussform liegt vor?\n\n" + argText(c, f),
        options: Object.keys(FORMS).map((k) => ({ md: FORMS[k].name, correct: k === key, why: k === key ? null : FORMS[key].why })), explain: f.name + ". " + f.why };
    }, (lv, G) => G.pick(ARG[2])(lv, G)],
    3: [(lv, G) => {
      const c = G.pick(COND.filter((x) => x.other)), key = G.pick(["ac", "da"]), f = FORMS[key];
      const wrong = COND.filter((x) => x.other && x !== c).map((x) => ({ md: x.other, why: "Das betrifft ein anderes Argument." }));
      return { type: "choice", md: "Dieser Schluss ist ungültig. Welche Situation zeigt das, weil in ihr beide Prämissen wahr sind und die Konklusion falsch ist?\n\n" + argText(c, f),
        options: G.options({ md: c.other, why: "Hier stimmen beide Prämissen, die Konklusion aber nicht. Ein einziges solches Gegenbeispiel genügt." }, G.shuffle(wrong).concat([
          { md: "Es gibt keine solche Situation, der Schluss ist doch gültig.", why: f.why }])), explain: f.name + ". " + f.why + " Gegenbeispiel: " + c.other };
    }, (lv, G) => G.pick(ARG[3])(lv, G)],
    4: [(lv, G) => G.pick(ARG[4])(lv, G)],
  });
  LW.extend("phi-argumente", F.statements([
    { lv: 1, ok: true, md: "Ein Argument besteht aus Prämissen und einer Konklusion.", why: "Die Prämissen sollen die Konklusion stützen." },
    { lv: 1, ok: false, md: "Aus »Wenn A, dann B« folgt »Wenn B, dann A«.", why: "Das ist die Umkehrung; sie folgt nicht. Aus »Wenn es regnet, ist die Straße nass« folgt nicht, dass es bei nasser Straße regnet." },
    { lv: 2, ok: true, md: "Ein gültiges Argument mit wahren Prämissen hat eine wahre Konklusion.", why: "Genau das bedeutet gültig: Die Wahrheit der Prämissen überträgt sich zwingend." },
    { lv: 2, ok: false, md: "Hat ein Argument eine wahre Konklusion, ist es gültig.", why: "Auch ein Fehlschluss kann zufällig bei einer wahren Konklusion landen." },
    { lv: 3, ok: true, md: "Ein gültiges Argument kann eine falsche Konklusion haben.", why: "Dann ist mindestens eine Prämisse falsch." },
    { lv: 3, ok: true, md: "Schlüssig nennt man ein Argument, das gültig ist und nur wahre Prämissen hat.", why: "Gültigkeit betrifft die Form, Schlüssigkeit zusätzlich die Wahrheit der Prämissen." },
    { lv: 3, ok: true, md: "Aus »Wenn A, dann B« folgt »Wenn nicht B, dann nicht A«.", why: "Das ist die Kontraposition, sie ist gleichwertig." },
    { lv: 4, ok: true, md: "Ob ein Argument gültig ist, hängt nur von seiner Form ab.", why: "Ersetzt man die Inhalte, bleibt ein gültiges Schema gültig." },
    { lv: 4, ok: false, md: "Ein ungültiges Argument hat immer eine falsche Konklusion.", why: "Die Konklusion kann wahr sein; sie ist dann nur nicht durch die Prämissen begründet." },
  ], STMT));
  LW.extend("phi-argumente", F.groups([
    { lv: 2, md: "Kants Ethik kann nicht stimmen, er hat ja sein Leben lang Königsberg nicht verlassen.", cat: "Ad hominem", why: "Statt des Arguments wird die Person angegriffen." },
    { lv: 2, md: "Mein Gegner war früher selbst Raucher, also ist sein Vorschlag zum Rauchverbot wertlos.", cat: "Ad hominem", why: "Die Vergangenheit des Sprechers sagt nichts über die Qualität seines Vorschlags." },
    { lv: 2, md: "Utilitaristen wollen also, dass man Menschen nach Belieben opfert, sobald es irgendwem nützt.", cat: "Strohmann", why: "Die Position wird verzerrt dargestellt, um sie leichter angreifen zu können." },
    { lv: 3, md: "Wer mehr Geld für Bildung fordert, will offenbar, dass wir uns hoch verschulden und die Rente streichen.", cat: "Strohmann", why: "Der Forderung wird eine extreme Version untergeschoben." },
    { lv: 2, md: "Entweder wir verbieten alle Autos, oder wir nehmen den Klimawandel einfach hin.", cat: "Falsches Dilemma", why: "Es gibt viele Möglichkeiten zwischen diesen beiden." },
    { lv: 3, md: "Entweder du bist für uns, oder du bist gegen uns.", cat: "Falsches Dilemma", why: "Neutralität oder teilweise Zustimmung werden ausgeblendet." },
    { lv: 2, md: "Glück ist das höchste Gut, weil das höchste Gut eben das Glück ist.", cat: "Zirkelschluss", why: "Die Begründung setzt voraus, was sie beweisen soll." },
    { lv: 3, md: "Diese Quelle ist zuverlässig, denn sie sagt selbst, dass man ihr vertrauen kann.", cat: "Zirkelschluss", why: "Die Zuverlässigkeit wird mit der Quelle selbst begründet." },
    { lv: 3, md: "Wenn wir heute ein Graffiti dulden, herrscht morgen in der ganzen Stadt Chaos.", cat: "Dammbruchargument", why: "Eine Kette immer schlimmerer Folgen wird behauptet, aber nicht belegt." },
    { lv: 4, md: "Der Mensch ist von Natur aus ein Fleischesser, also ist Fleischessen moralisch in Ordnung.", cat: "Naturalistischer Fehlschluss", why: "Aus einer Tatsache über die Natur wird ohne Weiteres eine Norm abgeleitet." },
    { lv: 4, md: "In der Natur setzt sich der Stärkere durch, also ist rücksichtsloser Wettbewerb gut.", cat: "Naturalistischer Fehlschluss", why: "Was in der Natur vorkommt, ist damit noch nicht gut." },
  ], { 3: ["choice", "sort"], 4: ["choice", "sort"] }, { cats: ["Ad hominem", "Strohmann", "Falsches Dilemma", "Zirkelschluss", "Dammbruchargument", "Naturalistischer Fehlschluss"],
    ask: (md) => "Welcher Fehlschluss steckt darin?\n\n»" + md + "«", sort: "Ordne jedes Beispiel seinem Fehlschluss zu.", n: 4 }));

  // ================================================================ utilitarianism
  const PERSONS = ["Mia", "Jonas", "Lea", "Ben", "Emma", "Paul", "Nora", "Tim"];
  const signed = (x) => (x > 0 ? "+" + x : x < 0 ? "−" + -x : "0");
  gen("phi-utilitarismus", "Utilitarismus", {
    1: [(lv, G) => {
      const n = G.int(3, 5), names = G.pickN(PERSONS, n), v = names.map(() => G.pick([-3, -2, -1, 1, 2, 3, 4]));
      const sum = v.reduce((a, b) => a + b, 0);
      return { type: "numeric", md: "Eine Handlung hat für die Betroffenen diese Folgen (Freude positiv, Leid negativ): " + names.map((p, i) => p + " " + signed(v[i])).join(", ") + ". Wie groß ist der Nutzensaldo nach Bentham?",
        answer: sum, tolerance: 0, placeholder: "Zahl", explain: "Jede Person zählt gleich, also wird einfach addiert: " + v.map(signed).join(" ") + " = " + signed(sum) + "." };
    }],
    2: [(lv, G) => {
      let A, B;
      do { A = [G.int(-2, 4), G.int(-3, 3), G.int(-2, 4)]; B = [G.int(-1, 3), G.int(-1, 3), G.int(-4, 4)]; } while (A.reduce((a, b) => a + b) === B.reduce((a, b) => a + b));
      const sa = A.reduce((a, b) => a + b), sb = B.reduce((a, b) => a + b), names = G.pickN(PERSONS, 3);
      const right = sa > sb ? "Handlung A" : "Handlung B";
      const why = "Summe A: " + A.map(signed).join(" ") + " = " + signed(sa) + ". Summe B: " + B.map(signed).join(" ") + " = " + signed(sb) + ". Geboten ist die Handlung mit dem größeren Gesamtnutzen.";
      return { type: "choice", md: "Folgen für " + names.join(", ") + ": Handlung A bringt " + A.map(signed).join(", ") + ", Handlung B bringt " + B.map(signed).join(", ") + ". Was gebietet der Handlungsutilitarismus?",
        options: ["Handlung A", "Handlung B", "Beide sind gleich gut"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
    3: [(lv, G) => {
      const k = G.pick([2, 3]), low = G.int(4, 8), high = G.int(2, 4);
      const lowSum = low, highSum = high * k, right = highSum > lowSum ? "das Konzert" : highSum < lowSum ? "die Party" : "beides gleich";
      const why = "Mit Gewicht " + k + " für die höhere Freude: Konzert " + high + " · " + k + " = " + highSum + ", Party " + lowSum + ". Bentham würde nur die Mengen vergleichen: " + high + " gegen " + low + ".";
      return { type: "choice", md: "Angenommen, man folgt Mill und gewichtet geistige Freuden " + k + "-fach. Ein Konzertbesuch bringt " + high + " Einheiten geistige Freude, eine Party " + low + " Einheiten sinnliche Freude. Was ist nach dieser Rechnung vorzuziehen?",
        options: ["das Konzert", "die Party", "beides gleich"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })),
        explain: why + " Mill selbst rechnet nicht mit Faktoren, er beruft sich auf das Urteil derer, die beide Arten von Freude kennen." };
    }],
    4: [(lv, G) => {
      const n1 = G.pick([10, 20, 50]), u1 = G.pick([6, 8, 9]), n2 = n1 * G.pick([2, 3]), u2 = G.pick([3, 4, 5]);
      const total1 = n1 * u1, total2 = n2 * u2;
      if (total1 === total2) return { type: "truefalse", md: "Nach dem Gesamtnutzenutilitarismus zählt die Summe des Glücks, nach dem Durchschnittsnutzenutilitarismus das Glück pro Kopf.", answer: true, whyNot: "So sind beide Varianten definiert.", explain: "Beide Varianten weichen bei verschiedenen Bevölkerungsgrößen voneinander ab." };
      const askTotal = G.chance(0.5), rightTotal = total1 > total2 ? "Welt A" : "Welt B", rightAvg = u1 > u2 ? "Welt A" : "Welt B";
      const right = askTotal ? rightTotal : rightAvg;
      const why = "Gesamtnutzen: A " + n1 + " · " + u1 + " = " + total1 + ", B " + n2 + " · " + u2 + " = " + total2 + ". Durchschnitt: A " + u1 + ", B " + u2 + ".";
      return { type: "choice", md: "Welt A: " + n1 + " Menschen mit je " + u1 + " Glückseinheiten. Welt B: " + n2 + " Menschen mit je " + u2 + ". Welche Welt ist nach dem " + (askTotal ? "Gesamtnutzen" : "Durchschnittsnutzen") + " besser?",
        options: ["Welt A", "Welt B"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })),
        explain: why + (askTotal && rightTotal === "Welt B" ? " Dass mehr, aber weniger glückliche Menschen besser sein sollen, nannte Derek Parfit die abstoßende Schlussfolgerung." : "") };
    }],
  });
  LW.extend("phi-utilitarismus", F.pairs([
    { lv: 1, a: "Jeremy Bentham", b: "quantitativer Utilitarismus: Freude und Leid nach Menge berechnen", why: "Bentham wollte Glück mit dem hedonistischen Kalkül messen." },
    { lv: 1, a: "John Stuart Mill", b: "qualitativer Utilitarismus: höhere und niedere Freuden", why: "Lieber ein unzufriedener Sokrates als ein zufriedener Narr, meinte Mill sinngemäß." },
    { lv: 2, a: "Peter Singer", b: "Präferenzutilitarismus: Interessen und Wünsche aller Leidensfähigen", why: "Singer bezieht ausdrücklich Tiere ein." },
    { lv: 2, a: "Regelutilitarismus", b: "Regeln befolgen, deren allgemeine Befolgung den größten Nutzen bringt", why: "Bewertet werden Regeln, nicht einzelne Handlungen." },
    { lv: 2, a: "Handlungsutilitarismus", b: "jede einzelne Handlung nach ihren Folgen bewerten", why: "Gefragt wird in jeder Lage neu, was den Nutzen maximiert." },
    { lv: 3, a: "Hedonistisches Kalkül", b: "Intensität, Dauer, Gewissheit, Nähe, Folgenreichtum, Reinheit, Ausmaß", why: "Benthams sieben Dimensionen, um Freuden und Leiden zu vergleichen." },
    { lv: 3, a: "Folgenprinzip", b: "Richtig oder falsch entscheidet sich an den Folgen der Handlung.", why: "Der Utilitarismus ist eine konsequentialistische Ethik." },
    { lv: 3, a: "Universalistisches Prinzip", b: "Das Glück jedes Betroffenen zählt gleich viel.", why: "Niemand wird bevorzugt, auch nicht der Handelnde selbst." },
  ], { 1: ["choice"], 2: ["match", "reverse"], 3: ["match"] }, { ask: (a) => "Was passt zu " + a + "?", askBack: (b) => "Wozu passt: " + b }));
  LW.extend("phi-utilitarismus", F.statements([
    { lv: 3, ok: true, md: "Der Gerechtigkeitseinwand: Der Utilitarismus könnte die Bestrafung eines Unschuldigen erlauben, wenn sie den Gesamtnutzen steigert.", why: "Weil nur die Summe zählt, schützt er Einzelne nicht von sich aus." },
    { lv: 3, ok: false, md: "Nach dem Utilitarismus zählt das eigene Glück mehr als das Glück anderer.", why: "Jedes Glück zählt gleich, das eigene nicht mehr." },
    { lv: 4, ok: true, md: "Ein Einwand lautet, dass sich Glück verschiedener Menschen nicht auf eine gemeinsame Skala bringen lässt.", why: "Das Messproblem: Wie vergleicht man die Freude des einen mit dem Leid des anderen?" },
    { lv: 4, ok: true, md: "Der Regelutilitarismus antwortet auf den Einwand, der Utilitarismus erlaube Lügen und Rechtsbrüche im Einzelfall.", why: "Regeln wie »Versprechen halten« bringen bei allgemeiner Befolgung den größten Nutzen." },
    { lv: 4, ok: false, md: "Für den Utilitarismus ist eine Handlung gut, wenn sie aus guter Absicht geschieht.", why: "Das wäre eher Kants Sicht; für den Utilitarismus zählen die Folgen." },
    { lv: 4, ok: false, md: "Der Präferenzutilitarismus schließt Tiere aus, weil sie keine Wünsche äußern können.", why: "Singer bezieht alle leidensfähigen Wesen ein; Interessen haben auch Tiere." },
  ], { 3: ["tf", "multi"], 4: ["spot", "multi"] }));

  // ================================================================ Kant
  const IMPERATIVES = [
    ["Wenn du gesund bleiben willst, treibe Sport.", "hypothetisch", "Das Gebot gilt nur unter der Bedingung eines Zwecks, den man haben kann oder nicht."],
    ["Lüge nicht.", "kategorisch", "Das Gebot gilt unbedingt, ohne Bezug auf einen Zweck, den jemand gerade verfolgt."],
    ["Wenn du die Prüfung bestehen willst, lerne regelmäßig.", "hypothetisch", "Ein Ratschlag der Klugheit, abhängig vom Ziel."],
    ["Halte deine Versprechen.", "kategorisch", "Unbedingte Pflicht, unabhängig von Wünschen."],
    ["Willst du Freunde behalten, sei freundlich zu ihnen.", "hypothetisch", "Abhängig vom Zweck, Freunde zu behalten."],
    ["Behandle niemanden bloß als Mittel.", "kategorisch", "Eine Fassung des kategorischen Imperativs selbst."],
    ["Wenn du einen Kuchen backen willst, heize den Ofen vor.", "hypothetisch", "Eine technische Regel für einen beliebigen Zweck."],
  ];
  const MAXIMS = [
    ["Wenn ich in Geldnot bin, leihe ich mir Geld und verspreche die Rückzahlung, obwohl ich weiß, dass ich nicht zahlen werde.", "Nein, sie hebt sich als Gesetz selbst auf.", "Täten das alle, glaubte niemand mehr einem Versprechen; das falsche Versprechen wäre gar nicht möglich."],
    ["Ich stehle, wenn ich sicher bin, dass mich niemand erwischt.", "Nein, sie hebt sich als Gesetz selbst auf.", "Allgemein befolgt, gäbe es kein Eigentum mehr, das man stehlen könnte."],
    ["Ich helfe niemandem in Not, wenn es mich etwas kostet.", "Denkbar, aber man kann sie nicht wollen.", "Eine solche Welt ist denkbar, doch man könnte sie nicht wollen, weil man selbst Hilfe brauchen kann."],
    ["Ich lasse meine Talente verkümmern und lebe nur dem Vergnügen.", "Denkbar, aber man kann sie nicht wollen.", "Als vernünftiges Wesen will man, dass die eigenen Fähigkeiten entwickelt werden."],
    ["Ich halte meine Versprechen, auch wenn es unbequem ist.", "Ja, sie taugt als allgemeines Gesetz.", "Allgemein befolgt, entsteht kein Widerspruch, im Gegenteil."],
    ["Ich sage die Wahrheit, auch wenn sie unangenehm ist.", "Ja, sie taugt als allgemeines Gesetz.", "Eine Welt, in der alle wahrhaftig sind, ist denkbar und wollbar."],
  ];
  const MAXIM_OPTS = ["Nein, sie hebt sich als Gesetz selbst auf.", "Denkbar, aber man kann sie nicht wollen.", "Ja, sie taugt als allgemeines Gesetz."];
  const MEANS = [
    ["Eine Ärztin nimmt einen Patienten ohne sein Wissen in eine Studie auf.", true, "Er wird für einen Zweck benutzt, dem er nicht zustimmen konnte."],
    ["Ich kaufe beim Bäcker Brötchen.", false, "Ich nutze die Bäckerin auch als Mittel, aber sie stimmt dem Geschäft zu und verfolgt eigene Zwecke."],
    ["Ein Unternehmen wirbt mit gefälschten Testergebnissen.", true, "Die Kundschaft wird getäuscht und kann dem wahren Zweck nicht zustimmen."],
    ["Ich bitte einen Freund, mir beim Umzug zu helfen, und er sagt gern zu.", false, "Er entscheidet frei und kennt den Zweck."],
    ["Jemand macht einer Person Liebeserklärungen, nur um an ihr Geld zu kommen.", true, "Ihre Gefühle werden als bloßes Werkzeug benutzt."],
    ["Eine Lehrerin lässt eine Schülerin an der Tafel vorrechnen.", false, "Die Schülerin wird nicht getäuscht; auch ihr Lernen ist Zweck."],
  ];
  gen("phi-kant", "Kants Pflichtethik", {
    1: [(lv, G) => {
      const [text, kind, why] = G.pick(IMPERATIVES);
      return { type: "choice", md: "»" + text + "« Ist das ein hypothetischer oder ein kategorischer Imperativ?",
        options: [{ md: "hypothetisch", correct: kind === "hypothetisch", why }, { md: "kategorisch", correct: kind === "kategorisch", why }], explain: why };
    }],
    2: [(lv, G) => {
      const [maxim, right, why] = G.pick(MAXIMS);
      return { type: "choice", md: "Universalisierungstest: Kann diese Maxime allgemeines Gesetz werden?\n\n»" + maxim + "«",
        options: MAXIM_OPTS.map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
    3: [(lv, G) => {
      const [text, mere, why] = G.pick(MEANS);
      return { type: "truefalse", md: "Nach der Menschheitsformel wird hier jemand bloß als Mittel behandelt: " + text, answer: mere, whyNot: why, explain: why + " Als Mittel darf man andere gebrauchen, nur nie bloß als Mittel, ohne sie zugleich als Zweck zu achten." };
    }],
    4: [(lv, G) => G.pick(ARG[3].concat(ARG[4]))(lv, G)],
  });
  LW.extend("phi-kant", F.groups([
    { lv: 1, md: "Ein Händler gibt Kindern korrektes Wechselgeld, weil Betrug seinem Ruf schaden würde.", cat: "pflichtgemäß, aber aus Neigung", why: "Er tut das Richtige, aber aus Eigennutz." },
    { lv: 1, md: "Jemand hilft gern, weil ihm Helfen Freude macht.", cat: "pflichtgemäß, aber aus Neigung", why: "Richtig getan, aber getragen vom Gefühl, nicht von der Pflicht." },
    { lv: 1, md: "Jemand gibt ein falsches Versprechen, um sich Geld zu leihen.", cat: "pflichtwidrig", why: "Die Handlung verstößt gegen die Pflicht, nicht zu täuschen." },
    { lv: 2, md: "Ein Lebensmüder erhält sein Leben, nicht weil er es liebt, sondern weil es Pflicht ist.", cat: "aus Pflicht", why: "Kants Beispiel: Erst hier hat die Handlung moralischen Wert." },
    { lv: 2, md: "Jemand hilft einem Fremden, obwohl er gerade keinerlei Mitgefühl spürt, weil er es für seine Pflicht hält.", cat: "aus Pflicht", why: "Das Motiv ist allein die Achtung vor dem Sittengesetz." },
    { lv: 2, md: "Eine Schülerin schreibt ab, weil die Aufsicht kurz den Raum verlässt.", cat: "pflichtwidrig", why: "Sie täuscht über ihre Leistung." },
  ], { 1: ["choice"], 2: ["sort", "choice"], 3: ["sort"] }, { cats: ["pflichtwidrig", "pflichtgemäß, aber aus Neigung", "aus Pflicht"], ask: (md) => "Wie ordnet Kant diese Handlung ein?\n\n" + md, sort: "Ordne die Handlungen nach Kant ein." }));
  LW.extend("phi-kant", F.statements([
    { lv: 2, ok: true, md: "Für Kant hat nur eine Handlung aus Pflicht moralischen Wert.", why: "Pflichtgemäße Handlungen aus Neigung sind richtig, aber nicht verdienstvoll." },
    { lv: 2, ok: false, md: "Für Kant entscheiden die Folgen einer Handlung über ihren moralischen Wert.", why: "Es zählt der gute Wille, das Prinzip, nach dem gehandelt wird." },
    { lv: 3, ok: true, md: "Eine Maxime ist ein subjektiver Handlungsgrundsatz.", why: "Etwa: »Wenn ich in Not bin, verspreche ich falsch.« Der kategorische Imperativ prüft solche Grundsätze." },
    { lv: 3, ok: true, md: "Die Menschheitsformel verbietet nicht, andere als Mittel zu gebrauchen, sondern sie bloß als Mittel zu gebrauchen.", why: "Wer einen Bäcker bezahlt, nutzt ihn auch als Mittel, achtet ihn aber als Zweck." },
    { lv: 4, ok: true, md: "Benjamin Constant warf Kant vor, sein Lügenverbot gelte selbst gegenüber einem Mörder, der nach dem Versteck eines Freundes fragt.", why: "Kant hielt 1797 daran fest; Kritiker sehen darin einen Rigorismus." },
    { lv: 4, ok: false, md: "Kant hielt Gefühle wie Mitleid für moralisch schlecht.", why: "Gefühle sind nicht schlecht, nur kein Grund für moralischen Wert." },
    { lv: 4, ok: true, md: "Pflichtenkollisionen gelten als Schwäche der Pflichtethik.", why: "Wenn zwei unbedingte Pflichten kollidieren, gibt der kategorische Imperativ allein keine Entscheidung vor." },
  ], { 2: ["tf"], 3: ["tf", "multi"], 4: ["spot", "multi"] }));

  // ================================================================ virtue ethics
  const MEAN = [
    ["Feigheit", "Tapferkeit", "Tollkühnheit"], ["Geiz", "Großzügigkeit", "Verschwendung"], ["Stumpfsinn", "Besonnenheit", "Zügellosigkeit"],
    ["Phlegma", "Sanftmut", "Jähzorn"], ["Tiefstapelei", "Wahrhaftigkeit", "Prahlerei"], ["Streitsucht", "Freundlichkeit", "Schmeichelei"],
    ["Steifheit", "Gewandtheit im Gespräch", "Possenreißerei"], ["Kleinmut", "Großgesinntheit", "Aufgeblasenheit"],
  ];
  gen("phi-tugend", "Tugendethik", {
    1: [(lv, G) => {
      const m = G.pick(MEAN), why = m[1] + " ist die Mitte zwischen " + m[0] + " (zu wenig) und " + m[2] + " (zu viel).";
      return { type: "choice", md: "Welche Tugend liegt nach Aristoteles in der Mitte zwischen **" + m[0] + "** und **" + m[2] + "**?",
        options: G.options({ md: m[1], why }, G.shuffle(MEAN.filter((x) => x !== m)).map((x) => ({ md: x[1], why: x[1] + " liegt zwischen " + x[0] + " und " + x[2] + "." }))), explain: why };
    }],
    2: [(lv, G) => {
      const m = G.pick(MEAN), excess = G.chance(0.5), right = excess ? m[2] : m[0];
      const why = "Zu " + m[1] + ": Mangel " + m[0] + ", Übermaß " + m[2] + ".";
      return { type: "choice", md: "Was ist bei der Tugend **" + m[1] + "** das " + (excess ? "Übermaß" : "Zuwenig") + "?",
        options: G.options({ md: right, why }, [{ md: excess ? m[0] : m[2], why }].concat(G.shuffle(MEAN.filter((x) => x !== m)).map((x) => ({ md: G.pick([x[0], x[2]]), why: "Das gehört zu " + x[1] + "." })))), explain: why };
    }],
    3: [(lv, G) => G.pick(ARG[3])(lv, G)],
    4: [(lv, G) => G.pick(ARG[4])(lv, G)],
  });
  LW.extend("phi-tugend", F.groups([
    { lv: 1, md: "Klugheit (phronesis)", cat: "Verstandestugend", why: "Die praktische Urteilskraft, im Einzelfall das Richtige zu treffen." },
    { lv: 1, md: "Weisheit (sophia)", cat: "Verstandestugend", why: "Erkenntnis der höchsten und ersten Dinge." },
    { lv: 2, md: "Wissenschaft (episteme)", cat: "Verstandestugend", why: "Wissen dessen, was notwendig so ist." },
    { lv: 2, md: "Kunstfertigkeit (techne)", cat: "Verstandestugend", why: "Wissen, wie man etwas herstellt." },
    { lv: 1, md: "Tapferkeit", cat: "Charaktertugend", why: "Eine durch Gewöhnung erworbene Haltung gegenüber Furcht und Zuversicht." },
    { lv: 1, md: "Großzügigkeit", cat: "Charaktertugend", why: "Die richtige Haltung im Geben und Nehmen von Geld." },
    { lv: 2, md: "Besonnenheit", cat: "Charaktertugend", why: "Maß halten bei körperlichen Genüssen." },
    { lv: 2, md: "Gerechtigkeit", cat: "Charaktertugend", why: "Für Aristoteles die vollkommene Charaktertugend im Umgang mit anderen." },
  ], { 2: ["sort", "choice"], 3: ["sort"] }, { cats: ["Verstandestugend", "Charaktertugend"], ask: (md) => "Ist " + md + " eine Verstandes- oder eine Charaktertugend?", sort: "Ordne die Tugenden ein." }));
  LW.extend("phi-tugend", F.groups([
    { lv: 3, md: "»Was würde ein besonnener, gerechter Mensch an meiner Stelle tun?«", cat: "Tugendethik", why: "Maßstab ist der Charakter, nicht eine Regel oder eine Bilanz." },
    { lv: 3, md: "»Kann ich wollen, dass alle nach meiner Maxime handeln?«", cat: "Pflichtethik", why: "Der Universalisierungstest des kategorischen Imperativs." },
    { lv: 3, md: "»Welche Handlung bringt allen Betroffenen zusammen das meiste Glück?«", cat: "Utilitarismus", why: "Die Folgen für alle zählen." },
    { lv: 4, md: "»Gutes Handeln lernt man wie ein Instrument: durch Übung, bis es zur Gewohnheit wird.«", cat: "Tugendethik", why: "Charaktertugenden entstehen nach Aristoteles durch Gewöhnung." },
    { lv: 4, md: "»Eine Lüge bleibt falsch, auch wenn sie gute Folgen hätte.«", cat: "Pflichtethik", why: "Die Pflicht gilt unabhängig von den Folgen." },
    { lv: 4, md: "»Eine Regel ist gut, wenn ihre allgemeine Befolgung das Glück am meisten fördert.«", cat: "Utilitarismus", why: "Das ist Regelutilitarismus." },
  ], { 3: ["choice", "sort"], 4: ["sort", "choice"] }, { cats: ["Tugendethik", "Pflichtethik", "Utilitarismus"], ask: (md) => "Zu welcher Ethik passt diese Frage oder dieser Satz?\n\n" + md, sort: "Ordne den drei Grundpositionen zu." }));
  LW.extend("phi-tugend", F.statements([
    { lv: 1, ok: true, md: "Für Aristoteles ist das Glück (eudaimonia) das höchste Gut, das um seiner selbst willen erstrebt wird.", why: "Alles andere wollen wir auch um des Glücks willen." },
    { lv: 2, ok: false, md: "Die Mitte bei Aristoteles ist für alle Menschen dieselbe, wie ein mathematischer Mittelwert.", why: "Es ist die Mitte »für uns«, abhängig von Person und Lage, gefunden mit Klugheit." },
    { lv: 2, ok: true, md: "Charaktertugenden erwirbt man durch Gewöhnung.", why: "Gerecht wird man, indem man gerecht handelt." },
    { lv: 3, ok: false, md: "Glücklich ist nach Aristoteles, wer möglichst viel Lust erlebt.", why: "Glück ist tugendgemäße Tätigkeit der Vernunft über ein ganzes Leben, nicht die Menge an Lust." },
    { lv: 3, ok: true, md: "Zum Glück gehören für Aristoteles auch äußere Güter wie Freunde und ein gewisser Wohlstand.", why: "Ohne sie lassen sich viele Tugenden gar nicht ausüben." },
    { lv: 4, ok: true, md: "Ein Einwand gegen die Tugendethik lautet, sie gebe in schwierigen Fällen keine klare Handlungsanweisung.", why: "»Handle wie ein Tugendhafter« sagt im Dilemma nicht sofort, was zu tun ist." },
    { lv: 4, ok: false, md: "Für Aristoteles gibt es bei jeder Handlung ein richtiges Maß, auch beim Diebstahl.", why: "Manche Handlungen wie Diebstahl oder Mord sind schon an sich schlecht; für sie gibt es keine Mitte." },
  ], { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi"], 4: ["spot", "multi"] }));
})();
