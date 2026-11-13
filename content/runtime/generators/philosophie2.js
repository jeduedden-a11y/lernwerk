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
