// Philosophy beyond Q1 (Ethik Oberstufe Hessen E1, E2, Q2 to Q4, history of philosophy): statement pools turned into
// true/false, multiple choice, find the false one and sorting by LW.forms. Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  function gen(name, title, statements) {
    const byLevel = F.statements(statements, STMT);
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }

  gen("phi-glueck", "Glücksvorstellungen", [
    { lv: 1, ok: true, md: "Für Aristoteles ist die Eudaimonia das höchste Gut, das man um seiner selbst willen erstrebt.", why: "Alles andere erstrebt man um ihretwillen, sie selbst um keines anderen willen." },
    { lv: 1, ok: false, md: "Epikur versteht unter Lust vor allem ausschweifenden Genuss.", why: "Gemeint ist vor allem Freiheit von Schmerz und Unruhe der Seele (Ataraxia); Epikur rät zu Maß und einfachem Leben." },
    { lv: 1, ok: true, md: "Die Stoiker sehen das Glück in einem Leben gemäß der Vernunft, unabhängig von äußeren Gütern.", why: "Tugend genügt zum Glück; Reichtum oder Gesundheit gelten als gleichgültig." },
    { lv: 2, ok: false, md: "Aristoteles hält äußere Güter für völlig bedeutungslos für das Glück.", why: "Er hält ein Mindestmaß an äußeren Gütern wie Gesundheit, Freunde und Auskommen für nötig, anders als die Stoa." },
    { lv: 2, ok: true, md: "Moderne Theorien des guten Lebens unterscheiden hedonistische Theorien, Wunschtheorien und Theorien objektiver Güter.", why: "Glück als Lustempfinden, als Erfüllung eigener Wünsche oder als Besitz objektiv wertvoller Güter." },
    { lv: 2, ok: false, md: "Psychologischer Egoismus ist die These, dass Menschen aus Eigeninteresse handeln sollen.", why: "Das wäre ethischer Egoismus. Der psychologische Egoismus behauptet, dass Menschen tatsächlich immer aus Eigeninteresse handeln." },
    { lv: 3, ok: true, md: "Kant hält Glück für ungeeignet als Grundlage der Moral, weil es zu unbestimmt und von Mensch zu Mensch verschieden ist.", why: "Moral braucht ein Prinzip, das für alle Vernunftwesen gilt; Glück ist empirisch und individuell." },
    { lv: 3, ok: true, md: "Nach existenzialistischer Auffassung wird Sinn nicht vorgefunden, sondern vom Menschen gesetzt.", why: "Bei Sartre geht die Existenz der Essenz voraus: Der Mensch entwirft sich selbst." },
    { lv: 3, ok: false, md: "Eine altruistische Handlung darf dem Handelnden keinerlei Vorteil bringen.", why: "Altruistisch ist sie, wenn das Wohl anderer ihr Motiv ist; ein Vorteil als Nebenfolge ändert daran nichts." },
    { lv: 4, ok: true, md: "Das Hedonismus-Paradox besagt, dass man Glück oft verfehlt, wenn man es direkt anstrebt.", why: "Glück stellt sich eher als Nebenfolge sinnvoller Tätigkeiten und Beziehungen ein." },
    { lv: 4, ok: false, md: "Byung-Chul Han sieht in der Leistungsgesellschaft eine Befreiung des Einzelnen von jedem Zwang.", why: "Han beschreibt verinnerlichten Zwang und Selbstausbeutung; Erschöpfung und Depression sind die Folge." },
  ]);

  gen("phi-religion", "Ethik und Religion", [
    { lv: 1, ok: true, md: "Für Feuerbach ist Gott eine Projektion menschlicher Wünsche und Eigenschaften.", why: "Der Mensch verlegt sein eigenes Wesen in ein Jenseits und betet es als Gott an." },
    { lv: 1, ok: true, md: "Marx nennt Religion das Opium des Volkes: Sie tröstet über Elend hinweg, statt es zu beseitigen.", why: "Religion ist für ihn Ausdruck und zugleich Betäubung sozialer Not." },
    { lv: 1, ok: false, md: "Freud versteht Religion als Ausdruck reifer Vernunft.", why: "Für Freud ist Religion eine Illusion, die aus kindlichen Schutzwünschen entsteht." },
    { lv: 2, ok: true, md: "Nietzsches Satz »Gott ist tot« beschreibt den Verlust einer verbindlichen Wertgrundlage in der Moderne.", why: "Er diagnostiziert den Nihilismus, der droht, wenn die alten Werte ihre Geltung verlieren." },
    { lv: 2, ok: false, md: "Fundamentalismus ist dasselbe wie tiefe Frömmigkeit.", why: "Fundamentalismus beansprucht eine unveränderliche, wörtlich verstandene Wahrheit und lehnt Pluralismus ab; Frömmigkeit kann tolerant sein." },
    { lv: 2, ok: true, md: "Der kosmologische Gottesbeweis schließt von der Existenz der Welt auf eine erste Ursache.", why: "Jede Ursache hat eine Ursache; damit die Kette nicht ins Unendliche läuft, wird eine erste Ursache angenommen." },
    { lv: 3, ok: true, md: "Kant hält theoretische Gottesbeweise für unmöglich, Gott aber als Postulat der praktischen Vernunft für sinnvoll.", why: "Gott lässt sich nicht beweisen, aber die Moral legt nahe, auf eine Übereinstimmung von Tugend und Glück zu hoffen." },
    { lv: 3, ok: false, md: "Säkularisierung heißt, dass Religion in einer Gesellschaft verboten wird.", why: "Gemeint ist die Trennung von Staat und Religion und der Bedeutungsverlust religiöser Institutionen, kein Verbot." },
    { lv: 3, ok: true, md: "Das Verhältnis von Glaube und Vernunft reicht von Unvereinbarkeit bis zu gegenseitiger Ergänzung, wie bei Thomas von Aquin.", why: "Thomas sah Vernunft und Offenbarung als zwei Wege zu einer Wahrheit." },
    { lv: 4, ok: true, md: "Habermas verlangt, religiöse Gründe im öffentlichen Diskurs in eine allgemein zugängliche Sprache zu übersetzen.", why: "Nur so können auch Nichtgläubige die Gründe prüfen; zugleich erkennt er den Gehalt religiöser Traditionen an." },
  ]);

  gen("phi-anthropologie", "Menschenbilder", [
    { lv: 1, ok: true, md: "Arnold Gehlen beschreibt den Menschen als Mängelwesen, das seine Instinktarmut durch Kultur ausgleicht.", why: "Handeln, Technik und Institutionen ersetzen, was die Natur nicht mitgegeben hat." },
    { lv: 1, ok: true, md: "Max Scheler sieht im Geist das, was den Menschen grundsätzlich vom Tier unterscheidet.", why: "Der Geist macht den Menschen weltoffen: Er kann sich von seinen Trieben und seiner Umwelt distanzieren." },
    { lv: 1, ok: false, md: "Kohlbergs Stufenmodell beschreibt die Entwicklung der Intelligenz im Kindesalter.", why: "Es beschreibt die Entwicklung des moralischen Urteils, erhoben etwa am Heinz-Dilemma." },
    { lv: 2, ok: true, md: "Auf Kohlbergs postkonventioneller Ebene orientiert sich das Urteil an universalen Prinzipien statt an Gesetzen und Erwartungen.", why: "Recht wird an Prinzipien gemessen, nicht umgekehrt." },
    { lv: 2, ok: false, md: "Weltoffenheit heißt bei Scheler, dass der Mensch an eine feste Umwelt gebunden ist.", why: "Umgekehrt: Das Tier ist umweltgebunden, der Mensch kann zu seiner Umwelt Abstand nehmen." },
    { lv: 2, ok: true, md: "Kant beschreibt den Menschen als Bürger zweier Welten: als Naturwesen der Kausalität unterworfen, als Vernunftwesen frei.", why: "Homo phaenomenon und homo noumenon; nur als Vernunftwesen ist der Mensch moralisch verantwortlich." },
    { lv: 3, ok: true, md: "Naturalistische Anthropologie erklärt den Menschen naturwissenschaftlich; philosophische fragt nach seinem Wesen und seiner Freiheit.", why: "Der Streitpunkt ist, ob sich Freiheit und Geist ganz naturwissenschaftlich erklären lassen." },
    { lv: 3, ok: false, md: "Ernst Haeckels Monismus trennt streng zwischen Geist und Materie.", why: "Monismus nimmt gerade eine einzige Grundsubstanz an; Haeckel verband Geist und Materie in einer einheitlichen Natur." },
    { lv: 3, ok: true, md: "Gehlen versteht Institutionen als Entlastung: Sie nehmen dem Menschen ständige Entscheidungen ab.", why: "Feste Formen geben Halt, wo Instinkte fehlen." },
    { lv: 4, ok: true, md: "Carol Gilligan kritisiert Kohlberg, weil sein Modell eine Ethik der Fürsorge zu gering bewerte.", why: "Neben der Gerechtigkeitsperspektive gebe es eine gleichwertige Perspektive der Beziehung und Verantwortung." },
    { lv: 4, ok: false, md: "Darwins Evolutionstheorie beweist, dass der Mensch keinen freien Willen hat.", why: "Sie erklärt die Entstehung der Arten; über Willensfreiheit entscheidet sie nicht." },
  ]);

  gen("phi-bereichsethik", "Medizin-, Tier- und Umweltethik", [
    { lv: 1, ok: true, md: "Peter Singer kritisiert den Speziesismus: die Bevorzugung von Interessen allein wegen der Artzugehörigkeit.", why: "Gleiche Interessen, etwa nicht zu leiden, verdienen gleiche Berücksichtigung." },
    { lv: 1, ok: true, md: "Die vier Prinzipien der Medizinethik nach Beauchamp und Childress sind Autonomie, Nichtschaden, Fürsorge und Gerechtigkeit.", why: "Sie dienen als mittlere Prinzipien, die im Einzelfall gegeneinander abgewogen werden." },
    { lv: 1, ok: false, md: "Aktive Sterbehilfe, also Tötung auf Verlangen, ist in Deutschland erlaubt.", why: "Tötung auf Verlangen ist strafbar. Zulässig sind der Abbruch einer Behandlung auf Wunsch des Patienten und unter Bedingungen die Hilfe zur Selbsttötung." },
    { lv: 2, ok: true, md: "Der Anthropozentrismus billigt nur dem Menschen moralischen Eigenwert zu, der Biozentrismus allen Lebewesen.", why: "Dazwischen steht der Pathozentrismus, der auf Leidensfähigkeit abstellt." },
    { lv: 2, ok: false, md: "Für den Pathozentrismus zählen nur Lebewesen mit Vernunft.", why: "Entscheidend ist die Leidensfähigkeit, nicht die Vernunft." },
    { lv: 2, ok: true, md: "Hans Jonas verlangt, so zu handeln, dass echtes menschliches Leben auf Dauer möglich bleibt.", why: "Das ist der Kern seines ökologischen Imperativs: Verantwortung für künftige Generationen." },
    { lv: 3, ok: true, md: "Die Heuristik der Furcht empfiehlt, bei ungewissen Folgen der schlechten Prognose mehr Gewicht zu geben als der guten.", why: "Wenn viel auf dem Spiel steht, soll man vorsichtig entscheiden." },
    { lv: 3, ok: false, md: "Die informierte Einwilligung ist erfüllt, sobald der Patient unterschreibt.", why: "Sie verlangt Aufklärung, Verständnis und Freiwilligkeit; die Unterschrift dokumentiert nur." },
    { lv: 3, ok: true, md: "Singer argumentiert präferenzutilitaristisch: Gleiche Interessen sind gleich zu gewichten, egal wessen sie sind.", why: "Daraus folgen seine Forderungen zur Tierethik und zur Hilfe gegen Armut." },
    { lv: 4, ok: false, md: "Die Ökozentrik schreibt nur einzelnen Lebewesen Eigenwert zu, nicht Ökosystemen.", why: "Ökozentrische (holistische) Ansätze schreiben gerade Ganzheiten wie Arten und Ökosystemen Eigenwert zu." },
  ]);

  gen("phi-recht", "Recht und Gerechtigkeit", [
    { lv: 1, ok: true, md: "Bei Rawls wählt man Gerechtigkeitsgrundsätze hinter einem Schleier des Nichtwissens über die eigene spätere Stellung.", why: "So soll niemand Grundsätze wählen, die ihn selbst bevorzugen." },
    { lv: 1, ok: true, md: "Absolute Straftheorien begründen Strafe mit Vergeltung der Schuld, relative mit ihrem Nutzen wie Abschreckung oder Besserung.", why: "Kant und Hegel vertreten Vergeltung, Feuerbach etwa die Abschreckung." },
    { lv: 1, ok: false, md: "Für Hobbes ist der Naturzustand ein friedliches Zusammenleben freier Menschen.", why: "Für Hobbes ist er ein Krieg aller gegen alle; erst ein souveräner Staat schafft Frieden." },
    { lv: 2, ok: true, md: "Rawls' Differenzprinzip erlaubt Ungleichheiten nur, wenn sie den am wenigsten Begünstigten am meisten nützen.", why: "Ungleichheit muss sich gegenüber den Schwächsten rechtfertigen lassen." },
    { lv: 2, ok: false, md: "Nozick fordert einen umverteilenden Sozialstaat.", why: "Nozick vertritt einen Minimalstaat; gerecht ist eine Verteilung, die aus gerechtem Erwerb und freiwilligem Tausch entsteht." },
    { lv: 2, ok: true, md: "Aristoteles unterscheidet ausgleichende Gerechtigkeit im Tausch von austeilender Gerechtigkeit bei der Verteilung.", why: "Im Tausch zählt Gleichheit der Werte, bei der Verteilung Verhältnismäßigkeit nach Verdienst." },
    { lv: 3, ok: true, md: "Menschenwürde ist nach Kant ein Wert, der keinen Preis hat und durch nichts aufgewogen werden kann.", why: "Was einen Preis hat, kann durch ein Äquivalent ersetzt werden; was Würde hat, nicht." },
    { lv: 3, ok: false, md: "Die Lehre vom gerechten Krieg erlaubt jeden Krieg, den ein Staat erklärt.", why: "Sie verlangt Kriterien wie gerechten Grund, legitime Autorität, letztes Mittel und Verhältnismäßigkeit." },
    { lv: 3, ok: true, md: "Locke begründet ein Widerstandsrecht, wenn eine Regierung Leben, Freiheit und Eigentum der Bürger verletzt.", why: "Die Regierung ist nur Treuhänder; bricht sie das Vertrauen, fällt die Macht an das Volk zurück." },
    { lv: 4, ok: true, md: "Hannah Arendt sieht im Fall Eichmann eine Banalität des Bösen: ungeheure Verbrechen aus gedankenloser Pflichterfüllung.", why: "Nicht Dämonie, sondern Gedankenlosigkeit und Karrierestreben trugen die Taten." },
    { lv: 4, ok: false, md: "Der Rechtspositivismus behauptet, ein Gesetz gelte nur, wenn es moralisch gerecht ist.", why: "Das ist die Naturrechtsposition. Der Rechtspositivismus trennt Recht und Moral: Es gilt, was ordnungsgemäß gesetzt ist." },
  ]);

  gen("phi-technik", "Mensch, Natur und Technik", [
    { lv: 1, ok: true, md: "Technik ist ambivalent: Sie entlastet den Menschen und schafft zugleich neue Risiken.", why: "Dieselbe Technik kann heilen und schaden; das macht ihre ethische Bewertung nötig." },
    { lv: 1, ok: false, md: "Nach Jonas genügt die traditionelle Ethik, um moderne Technik zu bewerten.", why: "Sie hatte nur Nahwirkungen im Blick; die Reichweite moderner Technik verlangt Zukunftsverantwortung." },
    { lv: 2, ok: true, md: "Das Vorsorgeprinzip verlangt Schutzmaßnahmen schon bei begründetem Verdacht auf ernste Schäden, nicht erst nach sicherem Nachweis.", why: "Bei schweren, kaum umkehrbaren Schäden wäre Abwarten zu riskant." },
    { lv: 2, ok: true, md: "Gehlen versteht Technik als Organersatz, Organverstärkung und Organentlastung.", why: "Technik gleicht die Mängel des Menschen aus, wie Kultur insgesamt." },
    { lv: 2, ok: false, md: "Technikdeterminismus bedeutet, dass Menschen frei entscheiden, welche Technik sich durchsetzt.", why: "Er behauptet das Gegenteil: Technik folge einer Eigenlogik und präge die Gesellschaft." },
    { lv: 3, ok: true, md: "Bei autonomen Systemen kann eine Verantwortungslücke entstehen, wenn niemand ihre Entscheidungen vollständig kontrolliert.", why: "Hersteller, Betreiber und Nutzer verweisen dann aufeinander." },
    { lv: 3, ok: false, md: "Nachhaltigkeit im Sinn des Brundtland-Berichts heißt, heute auf jede Nutzung natürlicher Ressourcen zu verzichten.", why: "Gemeint ist eine Entwicklung, die heutige Bedürfnisse deckt, ohne künftigen Generationen die Möglichkeit dazu zu nehmen." },
    { lv: 4, ok: true, md: "Das Verhältnis von Mensch und Natur lässt sich als Herrschaft, als Zugehörigkeit oder als Verantwortung deuten.", why: "Bacon steht für Naturbeherrschung, ökologische Ansätze für Zugehörigkeit, Jonas für Verantwortung." },
    { lv: 4, ok: false, md: "Ein technisches Risiko lässt sich immer vollständig als Wahrscheinlichkeit mal Schaden berechnen.", why: "Bei echter Ungewissheit sind die Wahrscheinlichkeiten unbekannt; genau hier setzt die Heuristik der Furcht an." },
  ]);

  gen("phi-geschichte", "Philosophiegeschichte", [
    { lv: 1, ok: true, md: "Der Übergang vom Mythos zum Logos meint den Schritt von Göttergeschichten zu vernünftigen Erklärungen der Welt.", why: "Die Vorsokratiker suchten natürliche Ursprünge und Prinzipien statt göttlicher Willkür." },
    { lv: 1, ok: true, md: "Thales von Milet gilt als erster Philosoph; er hielt das Wasser für den Urstoff aller Dinge.", why: "Entscheidend ist nicht die Antwort, sondern die Frage nach einem einheitlichen Prinzip." },
    { lv: 1, ok: false, md: "Heraklit lehrte, dass sich nichts verändert.", why: "Das ist die Position des Parmenides; Heraklit betonte den ständigen Wandel." },
    { lv: 2, ok: true, md: "Im Universalienstreit halten Realisten Allgemeinbegriffe für wirklich, Nominalisten für bloße Namen.", why: "Die Frage ist, ob es »das Pferd« über die einzelnen Pferde hinaus gibt." },
    { lv: 2, ok: true, md: "Ockhams Rasiermesser rät, nicht mehr Annahmen zu machen als nötig.", why: "Von zwei Erklärungen ist die sparsamere vorzuziehen." },
    { lv: 2, ok: false, md: "Der Rationalismus hält die Sinneserfahrung für die einzige Quelle sicheren Wissens.", why: "Das ist der Empirismus (Locke, Hume); Rationalisten wie Descartes setzen auf die Vernunft." },
    { lv: 3, ok: true, md: "Kant vermittelt zwischen Rationalismus und Empirismus: Erkenntnis braucht Sinnesdaten und Verstandesbegriffe zugleich.", why: "Die Erfahrung liefert den Stoff, der Verstand die Ordnung." },
    { lv: 3, ok: true, md: "Die linguistische Wende macht die Sprache zum zentralen Gegenstand der Philosophie.", why: "Viele philosophische Probleme gelten nun als Probleme unseres Sprachgebrauchs." },
    { lv: 3, ok: false, md: "Die Postmoderne vertraut auf große, alles erklärende Erzählungen wie den Fortschritt.", why: "Lyotard bestimmt die Postmoderne gerade als Misstrauen gegenüber den großen Erzählungen." },
    { lv: 4, ok: true, md: "Descartes sucht durch methodischen Zweifel ein unbezweifelbares Fundament und findet es im Denken selbst.", why: "Auch wer an allem zweifelt, kann nicht bezweifeln, dass er zweifelt, also denkt." },
    { lv: 4, ok: false, md: "Die Sophisten suchten wie Sokrates nach einer für alle gültigen Wahrheit.", why: "Sie neigten zum Relativismus (»Der Mensch ist das Maß aller Dinge«); Sokrates trat dem entgegen." },
  ]);
})();
/* Übungen zur Ethik (phi-rechnen): Schlussformen prüfen, hedonistisches Kalkül, Kants Handlungsarten,
   Maximin gegen Nutzensumme, Abdiskontieren künftiger Schäden. Stufen 1 bis 4. Built on first use,
   because some pages load this file before physik-rechnen.js defines the engine. */
(function () {
  "use strict";
  const LW = window.LW;
  let engine = null;
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

  const FORMS = [
    ["Wenn es regnet, ist die Straße nass. Es regnet. Also ist die Straße nass.", true, "Modus ponens"],
    ["Wenn es regnet, ist die Straße nass. Die Straße ist nicht nass. Also regnet es nicht.", true, "Modus tollens"],
    ["Wenn es regnet, ist die Straße nass. Die Straße ist nass. Also regnet es.", false, "Bejahung des Hinterglieds"],
    ["Wenn es regnet, ist die Straße nass. Es regnet nicht. Also ist die Straße nicht nass.", false, "Verneinung des Vorderglieds"],
    ["Wenn jemand lügt, verletzt er Vertrauen. Wer Vertrauen verletzt, schadet anderen. Also schadet anderen, wer lügt.", true, "Kettenschluss"],
    ["Anna handelt aus Pflicht oder aus Neigung. Sie handelt nicht aus Neigung. Also handelt sie aus Pflicht.", true, "disjunktiver Syllogismus"],
    ["Wenn eine Handlung das Glück mehrt, ist sie gut. Diese Handlung ist gut. Also mehrt sie das Glück.", false, "Bejahung des Hinterglieds"],
    ["Wenn Tiere leiden können, zählen ihre Interessen. Tiere können leiden. Also zählen ihre Interessen.", true, "Modus ponens"],
    ["Wenn man lügt, wird man bestraft. Tom lügt nicht. Also wird Tom nicht bestraft.", false, "Verneinung des Vorderglieds"],
    ["Wenn ein Gesetz gerecht ist, stimmen ihm alle zu. Nicht alle stimmen diesem Gesetz zu. Also ist es nicht gerecht.", true, "Modus tollens"],
    ["Alle Menschen sind sterblich. Sokrates ist ein Mensch. Also ist Sokrates sterblich.", true, "kategorischer Syllogismus"]];
  const FORM_N = ["Modus ponens", "Modus tollens", "Bejahung des Hinterglieds", "Verneinung des Vorderglieds", "Kettenschluss", "disjunktiver Syllogismus", "kategorischer Syllogismus"];
  spec("logik", { custom(level, G) {
    const [txt, valid, name] = G.pick(level <= 1 ? FORMS.slice(0, 6) : FORMS);
    if (level <= 2) {
      return choiceStep("Ist dieser Schluss **gültig**? »" + txt + "«", valid ? "gültig" : "ungültig", [valid ? "ungültig" : "gültig", "Das hängt davon ab, ob die Prämissen wahr sind."],
        "**" + (valid ? "Gültig" : "Ungültig") + "** (" + name + "). " + (valid ? "Sind die Prämissen wahr, muss die Konklusion wahr sein." : "Die Prämissen können wahr sein, während die Konklusion falsch ist.") + " Gültigkeit hängt an der Form, nicht an der Wahrheit der Prämissen.");
    }
    return choiceStep("Welche Schlussform liegt vor? »" + txt + "«", name, G.shuffle(FORM_N.filter((n) => n !== name)).slice(0, 3),
      "**" + name + "**, " + (valid ? "ein gültiger Schluss." : "ein Fehlschluss.") + " Gültig sind Modus ponens, Modus tollens, Kettenschluss sowie disjunktiver und kategorischer Syllogismus; die Bejahung des Hinterglieds und die Verneinung des Vorderglieds sind Fehlschlüsse.");
  } });

  spec("kalkuel", { custom(level, G) {
    if (level <= 1) {
      const v = [G.int(1, 6), -G.int(1, 5), G.int(-3, 6)], s = v.reduce((a, b) => a + b, 0);
      return H.numericStep("Eine Handlung bewirkt bei drei Betroffenen " + v.map((x) => (x > 0 ? "+" + x : "−" + -x)).join(", ") + " Glückseinheiten. Wie groß ist die Nutzensumme?", s, "",
        "Alle zählen gleich: $" + v.join(" + ").replace(/\+ -/g, "- ") + " = " + s + "$.");
    }
    if (level === 3) {
      const i1 = G.int(2, 5), d1 = G.int(1, 4), p1 = G.pick([0.5, 0.8, 1]), i2 = G.int(1, 5), d2 = G.int(1, 4), p2 = G.pick([0.5, 0.8, 1]);
      const net = i1 * d1 * p1 - i2 * d2 * p2;
      return H.numericStep("Nach Bentham: Eine Handlung bringt eine Freude der Intensität $" + i1 + "$, Dauer $" + d1 + "$ h, Gewissheit $" + G.tex(p1, 1) + "$, und ein Leid der Intensität $" + i2 + "$, Dauer $" + d2 + "$ h, Gewissheit $" + G.tex(p2, 1) + "$. Wie groß ist der Nettowert (Intensität mal Dauer mal Gewissheit)?", Math.round(net * 10) / 10, "",
        "Freude $" + i1 + " \\cdot " + d1 + " \\cdot " + G.tex(p1, 1) + " = " + G.tex(i1 * d1 * p1, 1) + "$, Leid $" + i2 + " \\cdot " + d2 + " \\cdot " + G.tex(p2, 1) + " = " + G.tex(i2 * d2 * p2, 1) + "$, netto $" + G.tex(net, 1) + "$.");
    }
    let a, b, sa, sb;
    do {
      a = [G.int(-2, 6), G.int(-2, 6), G.int(-2, 6)]; b = [G.int(-2, 6), G.int(-2, 6), level >= 4 ? -G.int(6, 10) : G.int(-2, 6)];
      if (level >= 4) b = [G.int(5, 9), G.int(5, 9), b[2]];
      sa = a.reduce((x, y) => x + y, 0); sb = b.reduce((x, y) => x + y, 0);
    } while (sa === sb);
    const fmt = (v) => v.map((x) => (x >= 0 ? "+" + x : "−" + -x)).join(", ");
    const right = sa > sb ? "Handlung A" : "Handlung B";
    return choiceStep("Handlung A bewirkt bei drei Betroffenen " + fmt(a) + ", Handlung B " + fmt(b) + " Glückseinheiten. Welche Handlung verlangt der Handlungsutilitarismus?", right,
      [sa > sb ? "Handlung B" : "Handlung A", "keine von beiden, beide verletzen jemanden"],
      "Summen: A $" + sa + "$, B $" + sb + "$. Gewählt wird die größere Summe." + (level >= 4 ? " Kritiker wenden ein, dass so ein schwerer Schaden für eine Person durch kleine Vorteile vieler aufgewogen werden kann: der Rechte-Einwand." : ""));
  } });

  const DUTY = [
    ["Ein Kaufmann gibt auch Kindern korrektes Wechselgeld, damit sein Ruf keinen Schaden nimmt.", 1],
    ["Ein Kaufmann gibt korrektes Wechselgeld, weil er es als Pflicht erkennt, auch wenn niemand es merken würde.", 2],
    ["Ein Kaufmann betrügt ein Kind beim Wechselgeld.", 0],
    ["Jemand hilft einem Fremden, weil es ihm Freude macht zu helfen.", 1],
    ["Jemand hilft einem Fremden, obwohl er keine Lust dazu hat, weil er es als Pflicht erkennt.", 2],
    ["Jemand bricht ein Versprechen, weil es ihm einen Vorteil bringt.", 0],
    ["Ein Lebensmüder erhält sein Leben, nicht aus Neigung, sondern weil er es als Pflicht erkennt.", 2],
    ["Jemand erhält sein Leben, weil er gern lebt.", 1],
    ["Jemand lügt, um einer peinlichen Lage zu entgehen.", 0],
    ["Eine Ärztin klärt einen Patienten ehrlich auf, weil sie sonst eine Klage fürchtet.", 1]];
  const DUTY_N = ["pflichtwidrig", "pflichtgemäß", "aus Pflicht"];
  spec("handlungsart", { custom(level, G) {
    const [txt, k] = G.pick(DUTY);
    if (level <= 2) {
      return choiceStep("Wie ordnet Kant diese Handlung ein? " + txt, DUTY_N[k], DUTY_N.filter((_, i) => i !== k),
        "**" + DUTY_N[k] + ".** Pflichtwidrig widerspricht der Pflicht; pflichtgemäß entspricht ihr äußerlich, geschieht aber aus Neigung oder Eigennutz; aus Pflicht geschieht sie aus Achtung vor dem Sittengesetz.");
    }
    const right = k === 2 ? "ja, sie geschieht aus Pflicht" : k === 1 ? "nein, sie ist nur pflichtgemäß" : "nein, sie ist pflichtwidrig";
    return choiceStep("Hat diese Handlung nach Kant **moralischen Wert**? " + txt, right, ["ja, sie geschieht aus Pflicht", "nein, sie ist nur pflichtgemäß", "nein, sie ist pflichtwidrig"].filter((x) => x !== right),
      "Moralischen Wert hat für Kant nur, was aus Pflicht geschieht. Eine pflichtgemäße Handlung ist lobenswert, aber ihr Motiv ist Neigung oder Eigennutz.");
  } });

  spec("maximin", { custom(level, G) {
    let D;
    for (;;) {
      D = [0, 1, 2].map(() => [G.int(2, 12), G.int(4, 20), G.int(6, 40)].sort((x, y) => x - y));
      const mins = D.map((d) => d[0]), sums = D.map((d) => d[0] + d[1] + d[2]);
      if (new Set(mins).size === 3 && new Set(sums).size === 3) break;
    }
    const mins = D.map((d) => d[0]), sums = D.map((d) => d[0] + d[1] + d[2]);
    const names = ["A", "B", "C"], txt = D.map((d, i) => names[i] + ": (" + d.join(", ") + ")").join("; ");
    const rawls = names[mins.indexOf(Math.max(...mins))], util = names[sums.indexOf(Math.max(...sums))];
    if (level <= 2) {
      return choiceStep("Drei mögliche Verteilungen von Einkommen auf drei Personen: " + txt + ". Welche wählt man hinter dem Schleier des Nichtwissens nach dem Maximin-Prinzip?", "Verteilung " + rawls,
        names.filter((n) => n !== rawls).map((n) => "Verteilung " + n),
        "Maximin: die Verteilung, in der es der am schlechtesten gestellten Person am besten geht. Minima: " + D.map((d, i) => names[i] + " " + d[0]).join(", ") + ".");
    }
    return choiceStep("Drei mögliche Verteilungen von Einkommen auf drei Personen: " + txt + ". Welche wählt ein Utilitarist, der die Summe maximiert?", "Verteilung " + util,
      names.filter((n) => n !== util).map((n) => "Verteilung " + n),
      "Summen: " + D.map((d, i) => names[i] + " " + sums[i]).join(", ") + ". " + (util === rawls ? "Hier kommen Utilitarist und Rawls zum selben Ergebnis." : "Rawls würde dagegen " + rawls + " wählen, weil es dort dem Schlechtestgestellten am besten geht."));
  } });

  spec("diskontierung", { custom(level, G) {
    if (level <= 1) {
      const D = G.pick([100, 500, 1000]), r = G.pick([1, 2, 3, 5]), n = G.pick([20, 50, 100]), v = D / Math.pow(1 + r / 100, n);
      return H.numericStep("Ein Klimaschaden von $" + D + "$ Mrd. € tritt in $" + n + "$ Jahren ein. Wie viel ist er heute wert, wenn man mit " + "$" + r + "\\,\\%$ pro Jahr abdiskontiert? (in Mrd. €)", v < 10 ? Math.round(v * 100) / 100 : Math.round(v), "Mrd. €",
        "$\\tfrac{" + D + "}{" + G.tex(1 + r / 100, 2) + "^{" + n + "}} \\approx " + G.tex(v, v < 10 ? 2 : 0) + "$ Mrd. €. Je höher die Rate, desto weniger zählt die Zukunft.");
    }
    if (level === 2) {
      const n = G.pick([50, 100]), f1 = Math.pow(1.014, -n), f2 = Math.pow(1.055, -n), q = f1 / f2;
      return H.numericStep("Ein Schaden in $" + n + "$ Jahren wird einmal mit $1{,}4\\,\\%$, einmal mit $5{,}5\\,\\%$ pro Jahr abdiskontiert. Um welchen Faktor ist der heutige Wert bei der niedrigen Rate größer? (ganze Zahl)", Math.round(q), "",
        "$\\left(\\tfrac{1{,}055}{1{,}014}\\right)^{" + n + "} \\approx " + G.tex(q, 0) + "$. Die Wahl der Rate ist eine ethische Entscheidung darüber, wie viel künftige Generationen zählen.");
    }
    if (level === 3) {
      const n = G.pick([20, 35, 50, 70]), r = (Math.pow(2, 1 / n) - 1) * 100;
      return H.numericStep("Bei welcher jährlichen Rate ist ein Schaden, der in $" + n + "$ Jahren eintritt, heute nur noch halb so viel wert? (in %, zwei Nachkommastellen)", Math.round(r * 100) / 100, "%",
        "$(1 + r)^{" + n + "} = 2$, also $r = 2^{1/" + n + "} - 1 \\approx " + G.tex(r, 2) + "\\,\\%$.");
    }
    const r = G.pick([0.5, 1, 2, 3, 5]), f = Math.pow(1 + r / 100, -100) * 100;
    return H.numericStep("Mit welchem Gewicht (in % des heutigen Werts) zählt ein Schaden in 100 Jahren bei einer Rate von $" + G.tex(r, 1) + "\\,\\%$? (eine Nachkommastelle)", Math.round(f * 10) / 10, "%",
      "$" + G.tex(1 + r / 100, 3) + "^{-100} \\approx " + G.tex(f / 100, 3) + "$, also etwa $" + G.tex(f, 1) + "\\,\\%$.");
  } });

  LW.philoTypen = T;
  return LW.rechenEngine(T);
  }
  const make = (level, G, params) => (engine || (engine = init()))(level, G, params);
  LW.generator("phi-rechnen", { title: "Ethik üben", make });
  const chapter = (typ) => ({ title: "Ethik üben", make: (level, G) => make(level, G, { typ }) });
  LW.generator("phi-r-logik", chapter(["logik"]));
  LW.generator("phi-r-abwaegen", chapter(["kalkuel", "handlungsart", "maximin", "diskontierung"]));
})();
