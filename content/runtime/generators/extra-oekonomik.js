// More tasks for the economics generators: statement and term pools for the history of ideas, cause-and-effect
// groups for the AD-AS model and new number templates. Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };

  // ---------------------------------------------------------------- Hayek
  LW.extend("oek-hayek", F.statements([
    { lv: 1, ok: true, md: "Hayek betont, dass das Wissen über die Wirtschaft auf viele Menschen verstreut ist.", why: "Jeder kennt die besonderen Umstände seines Ortes und seiner Zeit, niemand kennt alles." },
    { lv: 1, ok: false, md: "Hayek war ein Befürworter zentraler Wirtschaftsplanung.", why: "Er kritisierte zentrale Planung, weil keine Behörde das verstreute Wissen bündeln kann." },
    { lv: 1, ok: true, md: "Preise wirken nach Hayek wie Signale, die Knappheit weitermelden.", why: "Ein steigender Preis sagt allen: sparsamer umgehen, auch ohne den Grund zu kennen." },
    { lv: 2, ok: true, md: "Hayeks Buch »Der Weg zur Knechtschaft« erschien 1944.", why: "Darin warnt er, umfassende Planung führe zum Verlust von Freiheit." },
    { lv: 2, ok: false, md: "Nach Hayek müssen alle wissen, warum ein Rohstoff knapp wird, damit sie richtig reagieren.", why: "Es genügt, den höheren Preis zu sehen. Den Grund muss kaum jemand kennen." },
    { lv: 2, ok: true, md: "Spontane Ordnung meint eine Ordnung, die aus vielen Handlungen entsteht, ohne geplant zu sein.", why: "Hayeks Beispiele sind Märkte, Sprache und Recht." },
    { lv: 3, ok: true, md: "Hayek erhielt 1974 den Wirtschaftsnobelpreis, gemeinsam mit Gunnar Myrdal.", why: "Ausgezeichnet wurden Arbeiten zu Geld, Konjunktur und wirtschaftlichen Institutionen." },
    { lv: 3, ok: false, md: "In den 1930er Jahren forderte Hayek wie Keynes staatliche Ausgabenprogramme gegen die Krise.", why: "Hayek lehnte das ab. Er sah die Ursache in zu billigem Kredit und fürchtete neue Verzerrungen." },
    { lv: 3, ok: true, md: "Mit »Anmaßung von Wissen« kritisierte Hayek den Glauben, man könne komplexe Ordnungen wie eine Maschine steuern.", why: "So hieß sein Vortrag zum Nobelpreis." },
    { lv: 3, ok: true, md: "Nach Hayeks Konjunkturtheorie kann ein künstlich niedriger Zins zu Fehlinvestitionen führen.", why: "Unternehmen beginnen Projekte, für die die Ersparnisse nicht reichen." },
    { lv: 4, ok: false, md: "Hayek lehnte jeden staatlichen Rahmen für Märkte ab.", why: "Er wollte einen Rechtsstaat mit allgemeinen Regeln. Abgelehnt hat er die Lenkung einzelner Ergebnisse." },
    { lv: 4, ok: true, md: "Kritiker halten Hayek entgegen, dass Preise externe Kosten wie Umweltschäden oft nicht abbilden.", why: "Dann senden Preise falsche Signale, und der Markt allein korrigiert das nicht." },
    { lv: 4, ok: true, md: "Hayek gründete 1947 die Mont Pèlerin Society mit, ein Netzwerk liberaler Ökonomen.", why: "Sie wurde zu einem wichtigen Treffpunkt des Neoliberalismus." },
    { lv: 4, ok: false, md: "Für Hayek kann man Marktergebnisse sinnvoll als sozial gerecht oder ungerecht beurteilen.", why: "Hayek hielt »soziale Gerechtigkeit« bei Marktergebnissen für unpassend, weil niemand sie absichtlich herbeiführt." },
  ], STMT));
  LW.extend("oek-hayek", F.pairs([
    { lv: 1, a: "Hayek", b: "Preise bündeln verstreutes Wissen" },
    { lv: 1, a: "Keynes", b: "Der Staat soll fehlende Nachfrage ersetzen" },
    { lv: 1, a: "Smith", b: "Arbeitsteilung steigert den Wohlstand" },
    { lv: 2, a: "Marx", b: "Mehrwert stammt aus unbezahlter Arbeitszeit" },
    { lv: 2, a: "Ricardo", b: "Komparative Vorteile machen Handel lohnend" },
    { lv: 3, a: "Spontane Ordnung", b: "Ordnung aus vielen Handlungen, ohne Plan" },
    { lv: 3, a: "Anmaßung von Wissen", b: "Glaube, man könne komplexe Ordnungen steuern" },
  ], { 1: ["match"], 2: ["choice", "match"], 3: ["reverse"], 4: ["match"] }, { match: "Ordne zu." }));

  // ---------------------------------------------------------------- Smith
  LW.extend("oek-smith", F.statements([
    { lv: 1, ok: true, md: "Adam Smiths »Wohlstand der Nationen« erschien 1776.", why: "Es gilt als Gründungswerk der klassischen Ökonomik." },
    { lv: 1, ok: false, md: "Smith sah den Reichtum eines Landes vor allem in seinem Vorrat an Gold und Silber.", why: "Das war die Sicht des Merkantilismus. Für Smith zählt, wie viele Güter die Arbeit hervorbringt." },
    { lv: 1, ok: true, md: "Arbeitsteilung steigert nach Smith die Produktivität.", why: "Sein Beispiel ist die Stecknadelfabrik." },
    { lv: 2, ok: true, md: "Smith nennt drei Gründe für die Wirkung der Arbeitsteilung: Geschick, Zeitersparnis und Maschinen.", why: "Wer immer denselben Handgriff macht, wird schneller, wechselt nicht und erfindet Hilfsmittel." },
    { lv: 2, ok: false, md: "Nach Smith versorgt uns der Bäcker aus Nächstenliebe mit Brot.", why: "Der Bäcker handelt aus Eigeninteresse, und gerade dadurch werden wir versorgt." },
    { lv: 2, ok: true, md: "Die Arbeitsteilung ist nach Smith durch die Größe des Marktes begrenzt.", why: "In einem kleinen Dorf lohnt sich kein Spezialist für nur einen Handgriff." },
    { lv: 3, ok: true, md: "Smith schrieb vor dem »Wohlstand der Nationen« die »Theorie der ethischen Gefühle« von 1759.", why: "Darin geht es um Mitgefühl als Grundlage der Moral." },
    { lv: 3, ok: false, md: "Smith wollte dem Staat überhaupt keine Aufgaben zugestehen.", why: "Er nennt Verteidigung, Rechtspflege und öffentliche Einrichtungen wie Straßen und Schulen." },
    { lv: 3, ok: true, md: "Der Marktpreis schwankt nach Smith um einen natürlichen Preis, der die Kosten deckt.", why: "Wettbewerb zieht den Marktpreis immer wieder zum natürlichen Preis." },
    { lv: 3, ok: true, md: "Smith warnte, dass eintönige Teilarbeit die Arbeiter geistig abstumpfen kann.", why: "Deshalb wollte er öffentliche Bildung für das Volk." },
    { lv: 4, ok: false, md: "Die »unsichtbare Hand« zieht sich als Hauptthema durch den ganzen »Wohlstand der Nationen«.", why: "Der Ausdruck kommt dort nur ein einziges Mal vor. Berühmt wurde er erst später." },
    { lv: 4, ok: true, md: "Smith misstraute Absprachen von Kaufleuten, die Preise auf Kosten der Allgemeinheit erhöhen.", why: "Er schrieb, Händler desselben Gewerbes kämen selten zusammen, ohne sich gegen die Öffentlichkeit zu verschwören." },
    { lv: 4, ok: false, md: "Smith hielt Monopole für die beste Form, Märkte zu organisieren.", why: "Er kritisierte Monopole und Privilegien, weil sie Preise hochhalten und Wettbewerb ausschalten." },
    { lv: 4, ok: true, md: "Für Smith ist Arbeit das eigentliche Maß des Tauschwerts einer Ware.", why: "Ricardo und Marx bauten später ihre Werttheorien darauf auf." },
  ], STMT));
  LW.extend("oek-smith", F.pairs([
    { lv: 1, a: "Unsichtbare Hand", b: "Eigeninteresse fördert ungewollt das Gemeinwohl" },
    { lv: 1, a: "Arbeitsteilung", b: "Zerlegung der Arbeit in Teilschritte" },
    { lv: 2, a: "Natürlicher Preis", b: "Preis, der Lohn, Gewinn und Rente deckt" },
    { lv: 2, a: "Merkantilismus", b: "Reichtum als Gold und Handelsüberschuss" },
    { lv: 3, a: "Stecknadelfabrik", b: "Beispiel für Produktivität durch Teilung" },
    { lv: 3, a: "Theorie der ethischen Gefühle", b: "Smiths Buch über Mitgefühl und Moral" },
  ], { 1: ["match"], 2: ["choice"], 3: ["reverse"], 4: ["match"] }));

  // ---------------------------------------------------------------- AD-AS
  const AD_R = "Nachfrage (AD) nach rechts", AD_L = "Nachfrage (AD) nach links", AS_R = "Angebot (AS) nach rechts", AS_L = "Angebot (AS) nach links";
  LW.extend("oek-adas", F.groups([
    { lv: 1, md: "Die Zentralbank senkt den Leitzins deutlich.", cat: AD_R, why: "Billigerer Kredit belebt Investitionen und Konsum." },
    { lv: 1, md: "Die Regierung senkt die Einkommensteuer.", cat: AD_R, why: "Mehr verfügbares Einkommen erhöht den Konsum." },
    { lv: 1, md: "Exportmärkte brechen in einer Weltrezession ein.", cat: AD_L, why: "Weniger Exporte bedeuten weniger Nachfrage nach heimischen Gütern." },
    { lv: 1, md: "Der Ölpreis steigt stark.", cat: AS_L, why: "Höhere Energiekosten verteuern die Produktion." },
    { lv: 1, md: "Neue Software macht Betriebe deutlich produktiver.", cat: AS_R, why: "Mit denselben Mitteln lässt sich mehr herstellen." },
    { lv: 2, md: "Haushalte sparen aus Angst vor Arbeitslosigkeit mehr.", cat: AD_L, why: "Weniger Konsum bedeutet weniger Nachfrage." },
    { lv: 2, md: "Eine Dürre vernichtet große Teile der Ernte.", cat: AS_L, why: "Ein Teil der Produktionsmöglichkeiten fällt weg." },
    { lv: 2, md: "Viele Zuwanderer erweitern das Angebot an Arbeitskräften.", cat: AS_R, why: "Mehr Arbeitskräfte erweitern die Produktionsmöglichkeiten." },
    { lv: 2, md: "Der Staat kürzt seine Ausgaben für Bauprojekte.", cat: AD_L, why: "Staatsausgaben sind Teil der gesamtwirtschaftlichen Nachfrage." },
    { lv: 2, md: "Unternehmen investieren wegen guter Aussichten mehr.", cat: AD_R, why: "Investitionen sind Teil der Nachfrage." },
    { lv: 3, md: "Die Lohnstückkosten steigen kräftig.", cat: AS_L, why: "Jede Einheit wird teurer in der Herstellung." },
    { lv: 3, md: "Die eigene Währung wertet ab, Exporte werden für das Ausland billiger.", cat: AD_R, why: "Mehr Exporte erhöhen die Nachfrage nach heimischen Gütern." },
    { lv: 3, md: "Strengere Auflagen verteuern die Produktion in vielen Branchen.", cat: AS_L, why: "Höhere Kosten verschieben das Angebot nach links." },
    { lv: 3, md: "Sinkende Rohstoffpreise auf dem Weltmarkt entlasten die Betriebe.", cat: AS_R, why: "Niedrigere Kosten verschieben das Angebot nach rechts." },
  ], { 1: ["choice"], 2: ["choice", "sort"], 3: ["sort"] },
  { cats: [AD_R, AD_L, AS_R, AS_L], ask: (md) => md + " Welche Kurve verschiebt sich wohin?", sort: "Welche Kurve verschiebt sich wohin? Ordne jedes Ereignis ein.", n: 5 }));
  LW.extend("oek-adas", F.statements([
    { lv: 2, ok: true, md: "Verschiebt sich die AD-Kurve nach rechts, steigen kurzfristig Preisniveau und Produktion.", why: "Mehr Nachfrage trifft auf ein ansteigendes Angebot." },
    { lv: 2, ok: true, md: "Ein negativer Angebotsschock senkt die Produktion und erhöht das Preisniveau.", why: "Die AS-Kurve wandert nach links." },
    { lv: 2, ok: false, md: "Ein negativer Angebotsschock senkt Preisniveau und Produktion zugleich.", why: "Die Produktion sinkt, aber das Preisniveau steigt. Diese Kombination heißt Stagflation." },
    { lv: 3, ok: true, md: "Stagflation bezeichnet steigende Preise bei stagnierender oder sinkender Produktion.", why: "Typisch ist sie nach Angebotsschocks wie den Ölkrisen." },
    { lv: 3, ok: false, md: "Bei einem Nachfrageschock bewegen sich Preisniveau und Produktion in entgegengesetzte Richtungen.", why: "Bei einem Nachfrageschock bewegen sie sich gleich. Gegenläufig ist es beim Angebotsschock." },
    { lv: 3, ok: true, md: "Gegen einen Angebotsschock steckt die Geldpolitik in einem Zielkonflikt.", why: "Mehr Nachfrage stützt die Produktion, treibt aber die Preise weiter." },
    { lv: 4, ok: true, md: "Langfristig bestimmt im Standardmodell das Produktionspotenzial die Produktion, nicht die Nachfrage.", why: "Die langfristige Angebotskurve ist senkrecht." },
    { lv: 4, ok: false, md: "Eine dauerhaft lockere Geldpolitik erhöht die Produktion langfristig beliebig.", why: "Langfristig schlägt sie im Standardmodell vor allem auf die Preise durch." },
    { lv: 4, ok: true, md: "Die Ölkrisen der 1970er Jahre gelten als klassische negative Angebotsschocks.", why: "Sie brachten zugleich Inflation und Rezession." },
    { lv: 4, ok: false, md: "Eine Steuersenkung verschiebt im AD-AS-Modell nur die Angebotskurve.", why: "Sie erhöht vor allem das verfügbare Einkommen und damit die Nachfrage." },
  ], { 3: ["tf", "multi"], 4: ["spot", "multi"] }));

  // ---------------------------------------------------------------- markets, harder cases
  LW.extend("oek-markt", F.statements([
    { lv: 3, ok: true, md: "Steigen Angebot und Nachfrage zugleich, nimmt die Menge zu. Die Wirkung auf den Preis ist offen.", why: "Beide Verschiebungen erhöhen die Menge, beim Preis wirken sie gegeneinander." },
    { lv: 3, ok: false, md: "Steigt die Nachfrage und sinkt das Angebot, ist die Wirkung auf den Preis unklar.", why: "Beides treibt den Preis nach oben. Unklar ist hier die Menge." },
    { lv: 3, ok: true, md: "Ein Höchstpreis unter dem Gleichgewichtspreis führt zu einem Nachfrageüberhang.", why: "Zu diesem Preis wollen mehr kaufen, als angeboten wird." },
    { lv: 3, ok: false, md: "Ein Mindestpreis unter dem Gleichgewichtspreis erzeugt ein Überangebot.", why: "Er bindet gar nicht. Ein Überangebot entsteht erst, wenn er über dem Gleichgewicht liegt." },
    { lv: 3, ok: true, md: "Steigt der Preis eines Substituts, verschiebt sich die Nachfragekurve nach rechts.", why: "Das Gut wird im Vergleich günstiger." },
    { lv: 3, ok: false, md: "Sinkt der Preis eines Gutes, verschiebt sich seine Nachfragekurve nach rechts.", why: "Das ist eine Bewegung entlang der Kurve. Verschoben wird sie durch andere Einflüsse." },
    { lv: 4, ok: true, md: "Eine Mengensteuer tragen Käufer und Verkäufer je nachdem, wer schlechter ausweichen kann.", why: "Wer unelastischer reagiert, trägt den größeren Teil." },
    { lv: 4, ok: false, md: "Wer eine Steuer an das Finanzamt überweist, trägt sie auch wirtschaftlich allein.", why: "Die Traglast hängt von den Elastizitäten ab, nicht davon, wer überweist." },
    { lv: 4, ok: true, md: "Steigt der Preis eines Komplementärguts, sinkt die Nachfrage nach dem Gut.", why: "Beide werden zusammen genutzt, etwa Drucker und Patronen." },
    { lv: 4, ok: true, md: "Die Konsumentenrente ist der Unterschied zwischen Zahlungsbereitschaft und gezahltem Preis.", why: "Sie misst den Vorteil der Käufer am Markt." },
    { lv: 4, ok: false, md: "Ein Höchstpreis über dem Gleichgewichtspreis führt zu Knappheit.", why: "Er bindet nicht. Der Markt bleibt im Gleichgewicht." },
  ], { 3: ["tf", "sort"], 4: ["spot", "multi"] }));

  // ---------------------------------------------------------------- multiplier with numbers
  const fmt = (G, x, d) => G.tex(G.round(x, d == null ? 2 : d), d == null ? 2 : d);
  LW.extend("oek-multiplikator", {
    1: [
      (level, G) => {
        const c = G.pick([0.5, 0.6, 0.75, 0.8, 0.9, 0.4]), dG = G.pick([5, 10, 20, 30, 40, 50]);
        const k = 1 / (1 - c), dY = dG * k;
        return {
          type: "numeric",
          md: "Die marginale Konsumquote beträgt $c = " + fmt(G, c) + "$. Der Staat gibt zusätzlich $" + dG + "$ Mrd. Euro aus. Um wie viele Milliarden steigt das Einkommen im einfachen Multiplikatormodell?",
          answer: G.round(dY, 2), tolerance: 0.01, placeholder: "Mrd. Euro", answerText: G.fmt(dY, 2),
          explain: "Multiplikator $\\tfrac{1}{1 - c} = " + fmt(G, k) + "$, also $\\Delta Y = " + fmt(G, k) + " \\cdot " + dG + " = " + fmt(G, dY) + "$ Mrd. Euro.",
        };
      },
      (level, G) => {
        const s = G.pick([0.1, 0.2, 0.25, 0.4, 0.5]);
        return {
          type: "numeric",
          md: "Von jedem zusätzlichen Euro Einkommen sparen die Haushalte $" + fmt(G, s) + "$ Euro. Wie groß ist der Ausgabenmultiplikator?",
          answer: G.round(1 / s, 2), tolerance: 0.01, placeholder: "Zahl", answerText: G.fmt(1 / s, 2),
          hint: "Die marginale Sparquote ist $s = 1 - c$.",
          explain: "Der Multiplikator ist $\\tfrac{1}{1 - c} = \\tfrac{1}{s} = \\tfrac{1}{" + fmt(G, s) + "} = " + fmt(G, 1 / s) + "$.",
        };
      },
    ],
    2: [
      (level, G) => {
        const c = G.pick([0.5, 0.6, 0.75, 0.8]), dT = G.pick([10, 20, 30]);
        const kT = c / (1 - c), dY = -dT * kT;
        return {
          type: "numeric",
          md: "Marginale Konsumquote $c = " + fmt(G, c) + "$. Der Staat erhöht die Steuern um $" + dT + "$ Mrd. Euro, ohne mehr auszugeben. Um wie viel ändert sich das Einkommen? (mit Vorzeichen)",
          answer: G.round(dY, 2), tolerance: 0.01, placeholder: "Mrd. Euro", answerText: G.fmt(dY, 2),
          hint: "Steuern wirken nur über den Konsum: Der Steuermultiplikator ist $-\\tfrac{c}{1 - c}$.",
          explain: "$\\Delta Y = -\\tfrac{c}{1 - c} \\cdot \\Delta T = -" + fmt(G, kT) + " \\cdot " + dT + " = " + fmt(G, dY) + "$. Steuern wirken schwächer als Ausgaben, weil ein Teil der Steuer aus Ersparnissen gezahlt wird.",
        };
      },
    ],
  });
})();
