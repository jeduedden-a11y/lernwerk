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
