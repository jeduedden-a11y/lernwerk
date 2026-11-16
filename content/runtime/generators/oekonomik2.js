// Economics in depth: statement pools for micro, macro and history of ideas beyond the first lessons. Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  function gen(name, title, statements) {
    const byLevel = F.statements(statements, STMT);
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }

  gen("oek-mikro2", "Mikroökonomik vertieft", [
    { lv: 1, ok: true, md: "Opportunitätskosten sind der Wert der besten Alternative, auf die man verzichtet.", why: "Wer studiert, verzichtet etwa auf das Einkommen, das er in dieser Zeit verdienen könnte." },
    { lv: 1, ok: true, md: "Nach dem Gesetz vom abnehmenden Grenznutzen stiftet jede weitere Einheit eines Guts weniger zusätzlichen Nutzen.", why: "Das erste Glas Wasser nach dem Sport nützt mehr als das fünfte." },
    { lv: 1, ok: false, md: "Fixkosten hängen von der produzierten Menge ab.", why: "Fixkosten fallen unabhängig von der Menge an, etwa Miete; variable Kosten ändern sich mit der Menge." },
    { lv: 2, ok: true, md: "Im vollkommenen Wettbewerb produziert ein Unternehmen dort, wo der Preis gleich den Grenzkosten ist.", why: "Jede weitere Einheit lohnt sich, solange ihr Preis über ihren Grenzkosten liegt." },
    { lv: 2, ok: true, md: "Adverse Selektion bedeutet, dass bei verborgenen Eigenschaften vor allem schlechte Risiken oder Qualitäten auf dem Markt bleiben.", why: "Akerlofs Gebrauchtwagenmarkt: Gute Autos verschwinden, weil Käufer nur einen Durchschnittspreis zahlen." },
    { lv: 2, ok: false, md: "Moral Hazard bezeichnet verborgene Eigenschaften vor Vertragsschluss.", why: "Das ist adverse Selektion. Moral Hazard ist verborgenes Handeln nach Vertragsschluss, etwa weniger Vorsicht mit Versicherung." },
    { lv: 3, ok: true, md: "Nach dem Coase-Theorem führen Verhandlungen bei klaren Eigentumsrechten und geringen Transaktionskosten zu einem effizienten Ergebnis.", why: "Wer die Rechte hat, beeinflusst die Verteilung, nicht die Effizienz." },
    { lv: 3, ok: false, md: "Allmendegüter sind nicht rivalisierend und nicht ausschließbar.", why: "Das sind öffentliche Güter. Allmendegüter sind rivalisierend, aber nicht ausschließbar, deshalb droht Übernutzung." },
    { lv: 3, ok: true, md: "Verlustaversion bedeutet, dass Verluste stärker wiegen als gleich große Gewinne.", why: "Kahneman und Tversky schätzen, dass Verluste etwa doppelt so stark empfunden werden." },
    { lv: 4, ok: true, md: "Ein Gini-Koeffizient von 0 bedeutet völlige Gleichverteilung, einer von 1 völlige Konzentration.", why: "Er misst die Fläche zwischen Lorenzkurve und Gleichverteilungslinie." },
    { lv: 4, ok: false, md: "Pareto-Effizienz bedeutet, dass eine Verteilung gerecht ist.", why: "Pareto-effizient ist eine Lage, in der niemand besser gestellt werden kann, ohne einen anderen schlechter zu stellen; das kann sehr ungleich sein." },
  ]);

  gen("oek-makro2", "Makroökonomik vertieft", [
    { lv: 1, ok: true, md: "Inflation ist ein anhaltender Anstieg des allgemeinen Preisniveaus.", why: "Gemessen wird sie in Deutschland meist mit dem Verbraucherpreisindex." },
    { lv: 1, ok: true, md: "Das Ziel der Europäischen Zentralbank ist Preisstabilität, präzisiert als Inflationsrate von 2 Prozent auf mittlere Sicht.", why: "Seit 2021 gilt das Ziel symmetrisch: Abweichungen nach oben und unten sind gleich unerwünscht." },
    { lv: 1, ok: false, md: "Friktionelle Arbeitslosigkeit entsteht, weil die Wirtschaft in einer Rezession steckt.", why: "Das ist konjunkturelle Arbeitslosigkeit; friktionelle entsteht beim Wechsel zwischen Stellen." },
    { lv: 2, ok: true, md: "Nach der Quantitätsgleichung gilt M · V = P · Y.", why: "Geldmenge mal Umlaufgeschwindigkeit gleich Preisniveau mal realem Output." },
    { lv: 2, ok: true, md: "Geschäftsbanken schaffen Geld, indem sie Kredite vergeben und dem Kunden ein Guthaben gutschreiben.", why: "Giralgeld entsteht durch Kreditvergabe; Mindestreserve und Nachfrage begrenzen den Prozess." },
    { lv: 2, ok: false, md: "Eine Abwertung des Euro verteuert europäische Exporte im Ausland.", why: "Sie verbilligt sie: Für Dollar bekommt man mehr Euro, also mehr europäische Waren." },
    { lv: 3, ok: true, md: "Automatische Stabilisatoren wie Arbeitslosengeld dämpfen Konjunkturschwankungen ohne neue Beschlüsse.", why: "In der Rezession steigen die Ausgaben und sinken die Steuern von selbst." },
    { lv: 3, ok: false, md: "Nach dem Solow-Modell wächst eine Wirtschaft dauerhaft allein durch mehr Kapital.", why: "Wegen abnehmender Erträge des Kapitals kommt es zu einem Gleichgewicht; dauerhaftes Wachstum pro Kopf braucht technischen Fortschritt." },
    { lv: 3, ok: true, md: "Crowding-out heißt, dass staatliche Kreditnachfrage die Zinsen erhöht und private Investitionen verdrängt.", why: "Wie stark das passiert, ist umstritten und hängt von der Lage der Wirtschaft ab." },
    { lv: 4, ok: true, md: "Nach der Faustregel 70 durch Wachstumsrate verdoppelt sich ein BIP bei 2 Prozent Wachstum in etwa 35 Jahren.", why: "Das folgt aus ln 2 ≈ 0,69." },
    { lv: 4, ok: false, md: "Die Phillips-Kurve zeigt, dass Inflation und Arbeitslosigkeit auf lange Sicht immer gleichzeitig steigen.", why: "Die ursprüngliche Kurve zeigt einen kurzfristigen Gegenzusammenhang; langfristig gilt nach Friedman eine natürliche Arbeitslosenquote." },
  ]);

  gen("oek-ideen2", "Ideengeschichte vertieft", [
    { lv: 1, ok: true, md: "Der Merkantilismus wollte den Reichtum eines Staates durch Exportüberschüsse und Edelmetallzuflüsse mehren.", why: "Colberts Frankreich förderte Manufakturen und erhob Importzölle." },
    { lv: 1, ok: true, md: "Schumpeter beschreibt Innovation als schöpferische Zerstörung: Neues verdrängt Altes.", why: "Unternehmer setzen neue Kombinationen durch und treiben so die Wirtschaft voran." },
    { lv: 1, ok: false, md: "Die Grenznutzenschule erklärt Preise allein aus der Arbeitsmenge in einem Gut.", why: "Das ist die Arbeitswertlehre. Menger, Jevons und Walras erklären den Wert aus dem Grenznutzen." },
    { lv: 2, ok: true, md: "Milton Friedman forderte eine stetige Ausweitung der Geldmenge nach einer festen Regel.", why: "Als Monetarist misstraute er diskretionärer Konjunktursteuerung." },
    { lv: 2, ok: true, md: "Der Ordoliberalismus der Freiburger Schule verlangt einen starken Staat, der die Wettbewerbsordnung sichert.", why: "Eucken: Der Staat setzt den Rahmen, greift aber nicht in einzelne Marktprozesse ein." },
    { lv: 2, ok: false, md: "Elinor Ostrom zeigte, dass Gemeingüter immer verstaatlicht oder privatisiert werden müssen.", why: "Sie zeigte gerade, dass Gemeinschaften Allmenden mit eigenen Regeln dauerhaft erfolgreich verwalten können." },
    { lv: 3, ok: true, md: "Amartya Sen misst Entwicklung an den Verwirklichungschancen der Menschen, nicht nur am Einkommen.", why: "Sein Befähigungsansatz prägte den Index der menschlichen Entwicklung (HDI)." },
    { lv: 3, ok: true, md: "Piketty argumentiert, dass Vermögen sich konzentriert, wenn die Kapitalrendite r dauerhaft über dem Wachstum g liegt.", why: "Vermögen wächst dann schneller als die Einkommen aus Arbeit." },
    { lv: 3, ok: false, md: "Polanyi hielt den selbstregulierenden Markt für den Normalzustand aller Gesellschaften.", why: "In »The Great Transformation« zeigt er, dass Wirtschaft historisch in Gesellschaft eingebettet war; der freie Markt sei eine junge Erfindung." },
    { lv: 4, ok: true, md: "Die Prospect Theory beschreibt, dass Menschen Ergebnisse relativ zu einem Referenzpunkt bewerten.", why: "Gewinne und Verluste zählen gegenüber dem Ausgangspunkt, nicht als absoluter Endzustand." },
  ]);
})();
/* Rechenaufgaben zur Ökonomik (oek-rechnen) auf der Rechen-Engine von physik-rechnen.js:
   Kosten, Haushalt, Einkommens- und Kreuzpreiselastizität, Verteilung, Preise und Kaufkraft,
   Arbeitslosenquote, Wechselkurse, Zinseszins, Wachstum und Staatsschulden. Stufen 1 bis 4. */
(function () {
  "use strict";
  const LW = window.LW;
  let engine = null;
  // Built on first use: in some pages this file loads before physik-rechnen.js defines the engine.
  function init() {
  const T = {};
  const spec = (id, s) => { T[id] = s; };
  const H = LW.rechenHelpers;
  const choiceStep = (md, right, wrong, explain) => {
    const seen = new Set([right]);
    const opts = [{ md: right, correct: true }];
    wrong.forEach((w) => { if (!seen.has(w) && opts.length < 5) { seen.add(w); opts.push({ md: w }); } });
    return { type: "choice", md, options: opts, explain };
  };
  const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
  const pct = (G, x, d) => "$" + G.tex(x, d) + "\\,\\%$";

  // ---------------------------------------------------------------- Mikro
  spec("kosten", { custom(level, G) {
    if (level <= 1) {
      const F = G.int(2, 20) * 50, v = G.int(2, 15), x = G.int(2, 20) * 10, dk = F / x + v;
      return H.numericStep("Ein Betrieb hat Fixkosten von $" + F + "$ € und variable Kosten von $" + v + "$ € je Stück. Wie hoch sind die Durchschnittskosten bei $" + x + "$ Stück (in €)?", r2(dk), "€",
        "$\\tfrac{K}{x} = \\tfrac{" + F + "}{" + x + "} + " + v + " = " + G.tex(dk, 2) + "$ €. Je größer die Menge, desto stärker verteilen sich die Fixkosten.");
    }
    if (level === 2) {
      const F = G.int(1, 10) * 100, a = G.int(2, 10), b = G.pick([0.5, 1, 2]), x = G.int(2, 20), gk = a + 2 * b * x;
      return H.numericStep("Kostenfunktion $K(x) = " + F + " + " + a + "x + " + G.tex(b, 1) + "x^2$. Wie hoch sind die Grenzkosten bei $x = " + x + "$ (in €)?", gk, "€",
        "$K'(x) = " + a + " + " + G.tex(2 * b, 1) + "x$, also $K'(" + x + ") = " + G.tex(gk, 1) + "$ €. Die Fixkosten fallen beim Ableiten weg: Sie ändern sich mit der Menge nicht.");
    }
    if (level === 3) {
      const F = G.int(2, 30) * 100, v = G.int(2, 20), p = v + G.int(2, 15), x = F / (p - v);
      return H.numericStep("Fixkosten $" + F + "$ €, variable Kosten $" + v + "$ € je Stück, Verkaufspreis $" + p + "$ €. Ab welcher Stückzahl erzielt der Betrieb Gewinn (Gewinnschwelle, eine Nachkommastelle)?", r1(x), "Stück",
        "Erlös gleich Kosten: $" + p + "x = " + F + " + " + v + "x$, also $x = \\tfrac{" + F + "}{" + (p - v) + "} \\approx " + G.tex(x, 1) + "$. Jedes Stück bringt einen Deckungsbeitrag von $" + (p - v) + "$ €.");
    }
    const c = G.pick([0.5, 1, 2]), xm = G.int(2, 8), b = 2 * c * xm, k = G.int(1, 10), a = c * xm * xm + k;
    return H.numericStep("Variable Kosten $K_v(x) = " + G.tex(a, 1) + "x - " + G.tex(b, 1) + "x^2 + " + G.tex(c, 1) + "x^3$. Unter welchem Preis sollte der Betrieb kurzfristig gar nicht produzieren (Betriebsminimum, in €)?", k, "€",
      "Durchschnittliche variable Kosten $k_v(x) = " + G.tex(a, 1) + " - " + G.tex(b, 1) + "x + " + G.tex(c, 1) + "x^2$, minimal bei $x = \\tfrac{" + G.tex(b, 1) + "}{" + G.tex(2 * c, 1) + "} = " + xm + "$ mit $k_v = " + k + "$ €. Ein Preis darunter deckt nicht einmal die variablen Kosten.");
  } });

  spec("haushalt", { custom(level, G) {
    if (level <= 1) {
      const p = G.pick([2, 4, 5, 8, 10]), n = G.int(5, 40), B = p * n;
      return H.numericStep("Ein Haushalt hat $" + B + "$ € und gibt alles für ein Gut zum Preis von $" + p + "$ € aus. Wie viele Einheiten kann er höchstens kaufen?", n, "",
        "Achsenabschnitt der Budgetgeraden: $\\tfrac{" + B + "}{" + p + "} = " + n + "$ Einheiten.");
    }
    if (level === 2) {
      const pa = G.pick([1, 2, 3, 4]), pb = G.pick([2, 4, 5, 6]), ra = G.int(2, 8), rb = G.pick([ra, ra + G.int(1, 3), Math.max(1, ra - G.int(1, 3))]);
      const ua = ra * pa, ub = rb * pb;
      const right = ra > rb ? "mehr Kaffee, weniger Kuchen" : ra < rb ? "mehr Kuchen, weniger Kaffee" : "nichts ändern, die Aufteilung ist optimal";
      return choiceStep("Kaffee kostet $" + pa + "$ €, Kuchen $" + pb + "$ €. Der Grenznutzen der letzten Tasse Kaffee ist $" + ua + "$, der des letzten Stücks Kuchen $" + ub + "$. Was sollte der Haushalt tun?", right,
        ["mehr Kaffee, weniger Kuchen", "mehr Kuchen, weniger Kaffee", "nichts ändern, die Aufteilung ist optimal"].filter((x) => x !== right),
        "Grenznutzen je Euro: Kaffee $\\tfrac{" + ua + "}{" + pa + "} = " + ra + "$, Kuchen $\\tfrac{" + ub + "}{" + pb + "} = " + rb + "$. Optimal ist es, wenn beide gleich sind; sonst lohnt es sich, Geld zum Gut mit dem höheren Wert umzuschichten.");
    }
    const al = G.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75]), px = G.pick([2, 4, 5, 10]), B = G.int(2, 20) * 100, x = (al * B) / px;
    if (level === 3) {
      return H.numericStep("Nutzen $U = x^{" + G.tex(al, 2) + "} \\cdot y^{" + G.tex(1 - al, 2) + "}$, Budget $" + B + "$ €, Preis von $x$: $" + px + "$ €. Wie viele Einheiten $x$ kauft der Haushalt im Optimum?", r2(x), "",
        "Bei dieser Nutzenfunktion fließt immer der Anteil " + pct(G, 100 * al, 0) + " des Budgets in $x$: $x^* = \\tfrac{" + G.tex(al, 2) + " \\cdot " + B + "}{" + px + "} = " + G.tex(x, 2) + "$.");
    }
    return H.numericStep("Nutzen $U = x^{" + G.tex(al, 2) + "} \\cdot y^{" + G.tex(1 - al, 2) + "}$, Budget $" + B + "$ €. Der Preis von $x$ steigt von $" + px + "$ € auf $" + 2 * px + "$ €. Wie viele Einheiten $x$ kauft der Haushalt jetzt?", r2(x / 2), "",
      "Der Ausgabenanteil für $x$ bleibt " + pct(G, 100 * al, 0) + ": $\\tfrac{" + G.tex(al, 2) + " \\cdot " + B + "}{" + 2 * px + "} = " + G.tex(x / 2, 2) + "$. Doppelter Preis, halbe Menge.");
  } });

  const CROSS = [["Butter", "Margarine", 1], ["Bahnfahrten", "Inlandsflüge", 1], ["Kaffee", "Tee", 1], ["Drucker", "Druckerpatronen", -1], ["Autos", "Benzin", -1],
    ["Spielkonsolen", "Videospiele", -1], ["Pommes", "Ketchup", -1], ["Streamingdienst A", "Streamingdienst B", 1], ["Brot", "Zahnpasta", 0]];
  spec("elastizitaeten", { custom(level, G) {
    if (level <= 1) {
      const dy = G.pick([2, 4, 5, 10]), e = G.pick([-1, -0.5, 0.2, 0.5, 0.8, 1.5, 2]), dq = r1(e * dy);
      return H.numericStep("Das Einkommen steigt um " + pct(G, dy, 0) + ", die Nachfrage nach einem Gut ändert sich um " + pct(G, dq, 1) + ". Wie groß ist die Einkommenselastizität?", r2(dq / dy), "",
        "$\\varepsilon_Y = \\tfrac{\\%\\Delta Q}{\\%\\Delta Y} = \\tfrac{" + G.tex(dq, 1) + "}{" + dy + "} = " + G.tex(dq / dy, 2) + "$.");
    }
    if (level === 2) {
      const e = G.pick([-0.8, -0.3, 0.2, 0.5, 0.9, 1.4, 2.5]);
      const right = e < 0 ? "inferiores Gut" : e <= 1 ? "notwendiges (normales) Gut" : "Luxusgut";
      return choiceStep("Ein Gut hat die Einkommenselastizität $" + G.tex(e, 1) + "$. Wie ordnet man es ein?", right, ["inferiores Gut", "notwendiges (normales) Gut", "Luxusgut"].filter((x) => x !== right),
        "Negativ: Mit mehr Einkommen wird weniger gekauft (inferior). Zwischen 0 und 1: Die Nachfrage steigt, aber langsamer als das Einkommen. Über 1: Sie steigt überproportional (Luxusgut).");
    }
    if (level === 3) {
      const dp = G.pick([5, 10, 20]), e = G.pick([-1.2, -0.6, -0.3, 0.4, 0.8, 1.5]), dq = r1(e * dp);
      return H.numericStep("Der Preis von Gut B steigt um " + pct(G, dp, 0) + ", die Nachfrage nach Gut A ändert sich um " + pct(G, dq, 1) + ". Wie groß ist die Kreuzpreiselastizität?", r2(dq / dp), "",
        "$\\varepsilon_{AB} = \\tfrac{\\%\\Delta Q_A}{\\%\\Delta P_B} = \\tfrac{" + G.tex(dq, 1) + "}{" + dp + "} = " + G.tex(dq / dp, 2) + "$. " + (dq > 0 ? "Positiv: Substitute." : "Negativ: Komplemente."));
    }
    const [a, b, s] = G.pick(CROSS);
    const right = s > 0 ? "positiv: Substitute" : s < 0 ? "negativ: Komplemente" : "etwa null: unabhängige Güter";
    return choiceStep("Welches Vorzeichen hat die Kreuzpreiselastizität der Nachfrage nach **" + a + "** bezüglich des Preises von **" + b + "**?", right,
      ["positiv: Substitute", "negativ: Komplemente", "etwa null: unabhängige Güter"].filter((x) => x !== right),
      "Wird " + b + " teurer, " + (s > 0 ? "weichen Käufer auf " + a + " aus: Die Nachfrage steigt." : s < 0 ? "wird auch weniger " + a + " gebraucht, weil beide zusammen genutzt werden." : "ändert das an der Nachfrage nach " + a + " praktisch nichts."));
  } });

  spec("gini", { custom(level, G) {
    if (level <= 1) {
      const p = G.pick([10, 20, 40, 50, 60, 80, 90]), s = G.int(1, Math.max(2, Math.floor(p * 0.8))) ;
      return H.numericStep("Die ärmsten $" + p + "\\,\\%$ der Haushalte haben $" + s + "\\,\\%$ des Einkommens. Welchen Anteil am Einkommen haben die übrigen $" + (100 - p) + "\\,\\%$ (in %)?", 100 - s, "%",
        "Zusammen sind es 100 %: $100 - " + s + " = " + (100 - s) + "$ %. Auf der Lorenzkurve liegt der Punkt $(" + p + "\\,\\% \\mid " + s + "\\,\\%)$.");
    }
    if (level === 2) {
      const p = G.pick([50, 60, 80, 90]), s = G.int(Math.max(5, p - 60), p - 5);
      return H.numericStep("Die ärmsten $" + p + "\\,\\%$ haben $" + s + "\\,\\%$ des Einkommens, die übrigen den Rest; innerhalb jeder Gruppe ist gleich verteilt. Wie groß ist der Gini-Koeffizient (zwei Nachkommastellen)?", r2((p - s) / 100), "",
        "Die Lorenzkurve verläuft durch $(0 \\mid 0)$, $(" + G.tex(p / 100, 2) + " \\mid " + G.tex(s / 100, 2) + ")$ und $(1 \\mid 1)$. Gini $= 1 - 2 \\cdot$ Fläche unter der Kurve; hier vereinfacht sich das zu $" + G.tex(p / 100, 2) + " - " + G.tex(s / 100, 2) + " = " + G.tex((p - s) / 100, 2) + "$.");
    }
    const k = level === 3 ? 4 : 5;
    let shares;
    for (;;) {
      const raw = Array.from({ length: k }, (_, i) => G.int(2, 8) + 4 * i).sort((x, y) => x - y);
      const sum = raw.reduce((x, y) => x + y, 0);
      shares = raw.map((x) => Math.round((100 * x) / sum));
      shares[k - 1] = 100 - shares.slice(0, k - 1).reduce((x, y) => x + y, 0);
      if (shares.every((x, i) => i === 0 || x >= shares[i - 1]) && shares[0] > 0) break;
    }
    let cum = 0, area = 0;
    shares.forEach((s) => { const prev = cum; cum += s / 100; area += (1 / k) * (prev + cum) / 2; });
    const gini = 1 - 2 * area;
    const word = k === 4 ? "Vierteln" : "Fünfteln";
    return H.numericStep("Einkommensanteile nach " + word + " der Haushalte, von arm nach reich: " + shares.map((s) => s + " %").join(", ") + ". Wie groß ist der Gini-Koeffizient (zwei Nachkommastellen)?", r2(gini), "",
      "Kumuliert ergibt sich die Lorenzkurve. Fläche darunter als Trapeze der Breite $\\tfrac1{" + k + "}$: $" + G.tex(area, 3) + "$. Gini $= 1 - 2 \\cdot " + G.tex(area, 3) + " \\approx " + G.tex(gini, 2) + "$.");
  } });

  // ---------------------------------------------------------------- Makro
  spec("vpi", { custom(level, G) {
    if (level <= 1) {
      const b0 = G.int(40, 80) * 10, b1 = b0 + G.int(-2, 12) * 5;
      return H.numericStep("Ein Warenkorb kostete im Basisjahr $" + b0 + "$ €, heute $" + b1 + "$ €. Wie hoch ist der Preisindex heute (Basisjahr = 100, eine Nachkommastelle)?", r1((b1 / b0) * 100), "",
        "$\\tfrac{" + b1 + "}{" + b0 + "} \\cdot 100 \\approx " + G.tex((b1 / b0) * 100, 1) + "$.");
    }
    if (level === 2) {
      const i0 = G.int(1000, 1200) / 10, i1 = r1(i0 * (1 + G.int(-5, 80) / 1000));
      return H.numericStep("Der Verbraucherpreisindex steigt von $" + G.tex(i0, 1) + "$ auf $" + G.tex(i1, 1) + "$. Wie hoch ist die Inflationsrate (in %, zwei Nachkommastellen)?", r2((i1 / i0 - 1) * 100), "%",
        "$\\left(\\tfrac{" + G.tex(i1, 1) + "}{" + G.tex(i0, 1) + "} - 1\\right) \\cdot 100 \\approx " + G.tex((i1 / i0 - 1) * 100, 2) + "\\,\\%$. Gemessen wird die relative Änderung, nicht die Differenz der Indexpunkte.");
    }
    if (level === 3) {
      const K = G.pick([1000, 5000, 10000]), pi = G.pick([2, 3, 4, 5, 8]), n = G.int(5, 20), v = K / Math.pow(1 + pi / 100, n);
      return H.numericStep("Wie viel sind $" + K + "$ € in $" + n + "$ Jahren noch wert (in heutiger Kaufkraft), wenn die Inflation jedes Jahr " + pct(G, pi, 0) + " beträgt? (in €)", Math.round(v), "€",
        "$\\tfrac{" + K + "}{(1 + " + G.tex(pi / 100, 2) + ")^{" + n + "}} \\approx " + G.tex(v, 0) + "$ €. Die Inflation wirkt wie ein Zinseszins, nur rückwärts.");
    }
    const w = G.pick([1, 2, 3, 4, 5, 6]), pi = G.pick([1, 2, 3, 5, 7, 8]), real = ((1 + w / 100) / (1 + pi / 100) - 1) * 100;
    return H.numericStep("Die Nominallöhne steigen um " + pct(G, w, 0) + ", die Preise um " + pct(G, pi, 0) + ". Wie stark ändert sich der Reallohn (in %, zwei Nachkommastellen)?", r2(real), "%",
      "$\\left(\\tfrac{1{,}0" + (w < 10 ? w : "") + "}{1{,}0" + (pi < 10 ? pi : "") + "} - 1\\right) \\cdot 100 \\approx " + G.tex(real, 2) + "\\,\\%$; die Faustregel $" + w + " - " + pi + " = " + (w - pi) + "$ liegt nahe daran.");
  } });

  spec("arbeitslosenquote", { custom(level, G) {
    const E = G.int(380, 460) / 10, A = G.int(15, 45) / 10, L = E + A, u = (A / L) * 100;
    if (level <= 1) {
      return H.numericStep("Es gibt $" + G.tex(E, 1) + "$ Mio. Erwerbstätige und $" + G.tex(A, 1) + "$ Mio. Arbeitslose. Wie hoch ist die Arbeitslosenquote (in %, eine Nachkommastelle)?", r1(u), "%",
        "Erwerbspersonen $= " + G.tex(E, 1) + " + " + G.tex(A, 1) + " = " + G.tex(L, 1) + "$ Mio. Quote $= \\tfrac{" + G.tex(A, 1) + "}{" + G.tex(L, 1) + "} \\approx " + G.tex(u, 1) + "\\,\\%$.");
    }
    if (level === 2) {
      const q = G.pick([3, 4, 5, 6, 8, 10]), LL = G.int(40, 48);
      return H.numericStep("Bei $" + LL + "$ Mio. Erwerbspersonen beträgt die Arbeitslosenquote " + pct(G, q, 0) + ". Wie viele Menschen sind arbeitslos (in Mio., zwei Nachkommastellen)?", r2((LL * q) / 100), "Mio.",
        "$" + LL + " \\cdot " + G.tex(q / 100, 2) + " = " + G.tex((LL * q) / 100, 2) + "$ Mio.");
    }
    if (level === 3) {
      const P = G.int(500, 560) / 10;
      return H.numericStep("Von $" + G.tex(P, 1) + "$ Mio. Menschen im erwerbsfähigen Alter sind $" + G.tex(E, 1) + "$ Mio. erwerbstätig und $" + G.tex(A, 1) + "$ Mio. arbeitslos. Wie hoch ist die Erwerbsquote (in %, eine Nachkommastelle)?", r1((L / P) * 100), "%",
        "Erwerbspersonen (erwerbstätig plus arbeitslos) durch Bevölkerung im erwerbsfähigen Alter: $\\tfrac{" + G.tex(L, 1) + "}{" + G.tex(P, 1) + "} \\approx " + G.tex((L / P) * 100, 1) + "\\,\\%$.");
    }
    const k = G.int(2, 8) / 10, u2 = ((A - k) / L) * 100;
    return H.numericStep("$" + G.tex(E, 1) + "$ Mio. Erwerbstätige, $" + G.tex(A, 1) + "$ Mio. Arbeitslose. $" + G.tex(k, 1) + "$ Mio. Arbeitslose finden eine Stelle, sonst ändert sich nichts. Wie hoch ist die neue Quote (in %, zwei Nachkommastellen)?", r2(u2), "%",
      "Die Zahl der Erwerbspersonen bleibt $" + G.tex(L, 1) + "$ Mio.: $\\tfrac{" + G.tex(A - k, 1) + "}{" + G.tex(L, 1) + "} \\approx " + G.tex(u2, 2) + "\\,\\%$ statt $" + G.tex(u, 2) + "\\,\\%$.");
  } });

  spec("wechselkurs", { custom(level, G) {
    const e0 = G.int(95, 125) / 100;
    if (level <= 1) {
      const X = G.int(10, 200) * 5;
      return H.numericStep("Für einen Euro bekommt man $" + G.tex(e0, 2) + "$ Dollar. Was kostet eine Ware für $" + X + "$ Dollar in Euro? (zwei Nachkommastellen)", r2(X / e0), "€",
        "$\\tfrac{" + X + "}{" + G.tex(e0, 2) + "} \\approx " + G.tex(X / e0, 2) + "$ €.");
    }
    const e1 = r2(e0 + G.pick([-1, 1]) * G.int(3, 15) / 100);
    if (level === 2) {
      return H.numericStep("Für einen Euro gab es $" + G.tex(e0, 2) + "$ Dollar, jetzt sind es $" + G.tex(e1, 2) + "$ Dollar. Um wie viel Prozent hat der Euro gegenüber dem Dollar " + (e1 > e0 ? "aufgewertet" : "abgewertet") + "? (Betrag, eine Nachkommastelle)", r1(Math.abs(e1 / e0 - 1) * 100), "%",
        "Für einen Euro gibt es jetzt $" + G.tex(e1, 2) + "$ statt $" + G.tex(e0, 2) + "$ Dollar: $\\left|\\tfrac{" + G.tex(e1, 2) + "}{" + G.tex(e0, 2) + "} - 1\\right| \\approx " + G.tex(Math.abs(e1 / e0 - 1) * 100, 1) + "\\,\\%$.");
    }
    if (level === 3) {
      const X = G.int(20, 400) * 5;
      return H.numericStep("Eine US-Maschine kostet $" + X + "$ Dollar. Der Kurs geht von $" + G.tex(e0, 2) + "$ auf $" + G.tex(e1, 2) + "$ Dollar je Euro. Was kostet sie danach in Euro? (ganze Euro)", Math.round(X / e1), "€",
        "Vorher $\\tfrac{" + X + "}{" + G.tex(e0, 2) + "} \\approx " + G.tex(X / e0, 0) + "$ €, danach $\\tfrac{" + X + "}{" + G.tex(e1, 2) + "} \\approx " + G.tex(X / e1, 0) + "$ €. " + (e1 > e0 ? "Ein stärkerer Euro verbilligt Importe." : "Ein schwächerer Euro verteuert Importe."));
    }
    const pu = G.int(45, 65) / 10, pe = G.int(38, 58) / 10, ppp = pu / pe;
    return H.numericStep("Ein Burger kostet in den USA $" + G.tex(pu, 2) + "$ Dollar, im Euroraum $" + G.tex(pe, 2) + "$ €. Welcher Kurs (Dollar je Euro) würde die Kaufkraft angleichen? (zwei Nachkommastellen)", r2(ppp), "Dollar je Euro",
      "Kaufkraftparität: $\\tfrac{" + G.tex(pu, 2) + "}{" + G.tex(pe, 2) + "} \\approx " + G.tex(ppp, 2) + "$ Dollar je Euro. Liegt der Marktkurs darüber, gilt der Euro nach diesem Maßstab als überbewertet.");
  } });

  spec("zinseszins", { custom(level, G) {
    const K = G.pick([1000, 2000, 5000, 10000]), i = G.pick([1, 2, 3, 4, 5, 6, 7]), n = G.int(3, 30);
    if (level <= 1) {
      const v = K * Math.pow(1 + i / 100, n);
      return H.numericStep("$" + K + "$ € werden $" + n + "$ Jahre zu " + pct(G, i, 0) + " Zinsen angelegt, die Zinsen werden mitverzinst. Wie hoch ist das Endkapital (ganze Euro)?", Math.round(v), "€",
        "$" + K + " \\cdot " + G.tex(1 + i / 100, 2) + "^{" + n + "} \\approx " + G.tex(v, 0) + "$ €.");
    }
    if (level === 2) {
      const v = K / Math.pow(1 + i / 100, n);
      return H.numericStep("In $" + n + "$ Jahren werden $" + K + "$ € fällig. Wie viel ist das heute wert, bei einem Zins von " + pct(G, i, 0) + "? (Barwert, ganze Euro)", Math.round(v), "€",
        "Abzinsen: $\\tfrac{" + K + "}{" + G.tex(1 + i / 100, 2) + "^{" + n + "}} \\approx " + G.tex(v, 0) + "$ €.");
    }
    if (level === 3) {
      const t = Math.log(2) / Math.log(1 + i / 100);
      return H.numericStep("Nach wie vielen Jahren verdoppelt sich ein Guthaben bei " + pct(G, i, 0) + " Zinsen? (eine Nachkommastelle)", r1(t), "Jahre",
        "$(1 + " + G.tex(i / 100, 2) + ")^t = 2$, also $t = \\tfrac{\\ln 2}{\\ln " + G.tex(1 + i / 100, 2) + "} \\approx " + G.tex(t, 1) + "$. Die Faustregel $\\tfrac{70}{" + i + "} \\approx " + G.tex(70 / i, 1) + "$ kommt nahe heran.");
    }
    const f = G.pick([1.5, 2, 3]), m = G.pick([5, 10, 15, 20]), q = (Math.pow(f, 1 / m) - 1) * 100;
    return H.numericStep("Ein Guthaben soll in $" + m + "$ Jahren auf das $" + G.tex(f, 1) + "$-Fache wachsen. Welcher jährliche Zins ist nötig? (in %, zwei Nachkommastellen)", r2(q), "%",
      "$(1 + i)^{" + m + "} = " + G.tex(f, 1) + "$, also $i = " + G.tex(f, 1) + "^{1/" + m + "} - 1 \\approx " + G.tex(q, 2) + "\\,\\%$.");
  } });

  spec("wachstum", { custom(level, G) {
    if (level <= 1) {
      const gy = G.pick([1, 1.5, 2, 2.5, 3, 4]), gn = G.pick([-0.5, 0, 0.3, 0.5, 1, 1.5]), g = ((1 + gy / 100) / (1 + gn / 100) - 1) * 100;
      return H.numericStep("Das reale BIP wächst um " + pct(G, gy, 1) + ", die Bevölkerung um " + pct(G, gn, 1) + ". Wie stark wächst das reale BIP pro Kopf? (in %, zwei Nachkommastellen)", r2(g), "%",
        "$\\left(\\tfrac{" + G.tex(1 + gy / 100, 3) + "}{" + G.tex(1 + gn / 100, 3) + "} - 1\\right) \\cdot 100 \\approx " + G.tex(g, 2) + "\\,\\%$, ungefähr die Differenz der Raten.");
    }
    if (level === 2) {
      const g = G.pick([1, 1.5, 2, 2.5, 3.5, 5, 7]), t = Math.log(2) / Math.log(1 + g / 100);
      return H.numericStep("Ein Land wächst dauerhaft um " + pct(G, g, 1) + " pro Jahr. Nach wie vielen Jahren hat sich seine Wirtschaftsleistung verdoppelt? (eine Nachkommastelle)", r1(t), "Jahre",
        "$t = \\tfrac{\\ln 2}{\\ln " + G.tex(1 + g / 100, 3) + "} \\approx " + G.tex(t, 1) + "$. Faustregel: $\\tfrac{70}{" + G.tex(g, 1) + "} \\approx " + G.tex(70 / g, 1) + "$.");
    }
    if (level === 3) {
      const Y = G.int(20, 45) * 100, g = G.pick([1, 2, 3]), n = G.int(5, 30), v = Y * Math.pow(1 + g / 100, n);
      return H.numericStep("Das BIP beträgt $" + Y + "$ Mrd. € und wächst jedes Jahr um " + pct(G, g, 0) + ". Wie hoch ist es nach $" + n + "$ Jahren (in Mrd. €, ganze Zahl)?", Math.round(v), "Mrd. €",
        "$" + Y + " \\cdot " + G.tex(1 + g / 100, 2) + "^{" + n + "} \\approx " + G.tex(v, 0) + "$ Mrd. €.");
    }
    const n = G.pick([10, 20, 25, 50]), f = G.pick([1.2, 1.5, 2, 3]), q = (Math.pow(f, 1 / n) - 1) * 100;
    return H.numericStep("In $" + n + "$ Jahren ist das reale BIP auf das $" + G.tex(f, 1) + "$-Fache gestiegen. Wie hoch war das durchschnittliche jährliche Wachstum? (in %, zwei Nachkommastellen)", r2(q), "%",
      "$" + G.tex(f, 1) + "^{1/" + n + "} - 1 \\approx " + G.tex(q, 2) + "\\,\\%$ pro Jahr; nicht einfach $\\tfrac{" + G.tex((f - 1) * 100, 0) + "\\,\\%}{" + n + "}$, weil sich Wachstum aufzinst.");
  } });

  spec("schulden", { custom(level, G) {
    const Y = G.int(30, 45) * 100, D = Math.round(Y * G.int(40, 90) / 100 / 10) * 10;
    if (level <= 1) {
      return H.numericStep("Staatsschulden $" + D + "$ Mrd. €, BIP $" + Y + "$ Mrd. €. Wie hoch ist die Schuldenquote (in %, eine Nachkommastelle)?", r1((D / Y) * 100), "%",
        "$\\tfrac{" + D + "}{" + Y + "} \\cdot 100 \\approx " + G.tex((D / Y) * 100, 1) + "\\,\\%$. Der Maastricht-Vertrag nennt 60 % als Referenzwert.");
    }
    const def = G.int(20, 160);
    if (level === 2) {
      return H.numericStep("Der Staat nimmt in einem Jahr $" + def + "$ Mrd. € mehr aus, als er einnimmt; das BIP beträgt $" + Y + "$ Mrd. €. Wie hoch ist die Defizitquote (in %, zwei Nachkommastellen)?", r2((def / Y) * 100), "%",
        "$\\tfrac{" + def + "}{" + Y + "} \\cdot 100 \\approx " + G.tex((def / Y) * 100, 2) + "\\,\\%$. Die Maastricht-Grenze liegt bei 3 %.");
    }
    if (level === 3) {
      const g = G.pick([2, 3, 4, 5]), q1 = ((D + def) / (Y * (1 + g / 100))) * 100;
      return H.numericStep("Schulden $" + D + "$ Mrd. €, BIP $" + Y + "$ Mrd. €. Im nächsten Jahr kommt ein Defizit von $" + def + "$ Mrd. € dazu, das nominale BIP wächst um " + pct(G, g, 0) + ". Wie hoch ist die neue Schuldenquote (in %, eine Nachkommastelle)?", r1(q1), "%",
        "$\\tfrac{" + D + " + " + def + "}{" + Y + " \\cdot " + G.tex(1 + g / 100, 2) + "} \\approx " + G.tex(q1, 1) + "\\,\\%$ statt $" + G.tex((D / Y) * 100, 1) + "\\,\\%$. " + (q1 < (D / Y) * 100 ? "Die Schulden steigen, aber das BIP wächst schneller: Die Quote sinkt." : "Die Schulden wachsen schneller als das BIP: Die Quote steigt."));
    }
    return H.numericStep("Die Schuldenbremse erlaubt dem Bund ein strukturelles Defizit von höchstens $0{,}35\\,\\%$ des BIP. Wie viel ist das bei einem BIP von $" + Y + "$ Mrd. € (in Mrd. €, zwei Nachkommastellen)?", r2(Y * 0.0035), "Mrd. €",
      "$" + Y + " \\cdot 0{,}0035 = " + G.tex(Y * 0.0035, 2) + "$ Mrd. €. In Notlagen und für die Konjunkturkomponente gelten Ausnahmen.");
  } });

  LW.oekonomikTypen = T;
  return LW.rechenEngine(T);
  }
  const make = (level, G, params) => (engine || (engine = init()))(level, G, params);
  LW.generator("oek-rechnen", { title: "Ökonomik rechnen", make });
  const chapter = (typ) => ({ title: "Ökonomik rechnen", make: (level, G) => make(level, G, { typ }) });
  LW.generator("oek-r-mikro", chapter(["kosten", "haushalt", "elastizitaeten", "gini"]));
  LW.generator("oek-r-makro", chapter(["vpi", "arbeitslosenquote", "wechselkurs", "zinseszins", "wachstum", "schulden"]));
})();
