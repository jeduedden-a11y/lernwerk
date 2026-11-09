/* Task generators for ethnology. Most topics are conceptual: tasks are drawn from larger pools, shuffled and
 * combined, so each round differs. Kinship is computed: membership in Ego's lineage for any kin type. */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const tf = (md, answer, explain, whyNot) => ({ type: "truefalse", md, answer, explain, whyNot: answer ? null : whyNot || explain });
  const fromPool = (G, pool) => { const [md, ans, why] = G.pick(pool); return tf(md, ans, why, why); };
  const sortTask = (G, md, cats, items, n, explain) => ({ type: "sort", md, categories: cats, items: G.pickN(items, n).map(([m, c]) => ({ md: m, cat: c })), explain });
  const matchTask = (G, md, pairs, n, explain) => ({ type: "match", md, pairs: G.pickN(pairs, n), explain });
  const choiceTask = (G, item) => ({ type: "choice", md: item.md, options: G.options({ md: item.right }, item.wrong.map((w) => ({ md: w[0], why: w[1] }))), explain: item.explain });

  // ---------------------------------------------------------------- method and fieldwork

  gen("eth-methode", {
    title: "Feldforschung",
    make(level, G) {
      if (level === 1) return matchTask(G, "Ordne die Begriffe ihrer Bedeutung zu.", [
        ["Teilnehmende Beobachtung", "lange im Feld leben, mitmachen und zugleich beobachten"],
        ["emisch", "aus der Sicht der Beteiligten, mit ihren Begriffen"],
        ["etisch", "aus der Sicht der Forschenden, mit vergleichenden Begriffen"],
        ["Schlüsselperson", "jemand im Feld, der besonders viel erklärt und Zugänge öffnet"],
        ["Feldtagebuch", "fortlaufende Notizen über Beobachtungen, Gespräche und eigene Eindrücke"],
        ["Lehnstuhlethnologie", "Theorien aus Reiseberichten anderer, ohne eigene Feldforschung"],
      ], 4, "Die moderne Ethnologie beruht auf eigener, langer Feldforschung. Emisch und etisch sind zwei Perspektiven, die man bewusst auseinanderhält.");
      if (level === 2) return sortTask(G, "Emisch oder etisch?", ["emisch", "etisch"], [
        ["»Die Ahnen haben den Regen geschickt, weil das Fest gelungen ist.«", "emisch"],
        ["»Niederschlag fiel in 60 % der Festwochen, in 40 % der übrigen Wochen.«", "etisch"],
        ["Die Bezeichnungen, mit denen Dorfbewohner ihre Verwandten anreden", "emisch"],
        ["Ein Verwandtschaftsdiagramm mit den Kürzeln F, M, B, Z", "etisch"],
        ["Die Erklärung einer Heilerin, warum eine Krankheit kam", "emisch"],
        ["Ein Vergleich der Heiratsregeln in 30 Gesellschaften", "etisch"],
        ["Was die Beteiligten selbst unter »Ehre« verstehen", "emisch"],
      ], 5, "Emisch: die Innensicht, in den Kategorien der Menschen selbst. Etisch: die Außensicht der Forschung, die vergleichen will. Gute Ethnographie braucht beides und vermischt sie nicht.");
      if (level === 3) return fromPool(G, [
        ["Malinowski lebte während des Ersten Weltkriegs lange auf den Trobriand-Inseln und begründete dort die teilnehmende Beobachtung als Methode.", true, "Seine »Argonauten des westlichen Pazifik« (1922) wurden zum Vorbild für die Feldforschung."],
        ["Bei teilnehmender Beobachtung soll man sich möglichst aus dem Geschehen heraushalten, um nichts zu verfälschen.", false, "Gerade das Mitmachen erschließt, was man durch bloßes Zuschauen nicht versteht. Die eigene Rolle wird dabei reflektiert, nicht vermieden."],
        ["Franz Boas betonte, dass jede Kultur aus ihrer eigenen Geschichte heraus verstanden werden muss.", true, "Damit wandte er sich gegen evolutionistische Stufenmodelle."],
        ["Die Veröffentlichung von Malinowskis privatem Tagebuch (1967) löste eine Debatte über die Rolle der Forschenden aus.", true, "Es zeigte Frust und abfällige Bemerkungen und machte deutlich, dass Ethnographie nie neutral ist."],
        ["Ethnologie untersucht ausschließlich kleine, abgelegene Gesellschaften.", false, "Heute wird überall geforscht: in Banken, Laboren, Städten, Online-Gemeinschaften."],
      ]);
      return choiceTask(G, G.pick([
        { md: "Eine Forscherin wird im Dorf gebeten, bei einer Hochzeit mitzutanzen. Was spricht methodisch dafür?", right: "Sie erlebt die Situation von innen und erfährt, was Teilnehmende empfinden und erwarten.", wrong: [["Sie kann so verdeckt Daten sammeln, ohne dass jemand von ihrer Forschung weiß.", "Verdecktes Forschen widerspricht der Forschungsethik. Das Einverständnis der Beteiligten ist Pflicht."], ["Tanzen ist irrelevant, es zählt nur, was die Leute sagen.", "Viel Wissen ist praktisch und körperlich. Es zeigt sich im Tun, nicht nur im Reden."]], explain: "Teilnahme eröffnet Wissen, das nicht ausgesprochen wird. Danach schreibt sie Feldnotizen und reflektiert ihre eigene Rolle." },
        { md: "Was ist das Hauptproblem einer Ethnographie, die nur auf Interviews mit dem Dorfvorsteher beruht?", right: "Sie gibt eine einzelne, oft machtvolle Perspektive als die Sicht »der Kultur« aus.", wrong: [["Der Dorfvorsteher kennt seine eigene Kultur nicht.", "Er kennt sie, aber aus einer bestimmten Position."], ["Interviews sind in der Ethnologie verboten.", "Interviews gehören dazu, aber ergänzt durch Beobachtung und viele Stimmen."]], explain: "Kulturen sind nicht einheitlich. Frauen, Junge, Arme oder Zugezogene sehen dieselben Dinge oft anders." },
      ]));
    },
  });

  // ---------------------------------------------------------------- culture and relativism

  gen("eth-kultur", {
    title: "Kulturbegriffe",
    make(level, G) {
      if (level <= 2) return matchTask(G, "Ordne die Kulturbegriffe ihren Vertretern zu.", [
        ["Kultur als komplexes Ganzes aus Wissen, Glauben, Kunst, Moral, Recht und Sitte, erworben als Mitglied einer Gesellschaft", "Edward B. Tylor (1871)"],
        ["Jede Kultur hat ihre eigene Geschichte und muss aus sich heraus verstanden werden", "Franz Boas"],
        ["Kultur als selbstgesponnenes Bedeutungsgewebe, das man deuten muss wie einen Text", "Clifford Geertz (1973)"],
        ["Kulturen als Muster, die eine Gesellschaft prägen wie eine Persönlichkeit", "Ruth Benedict (1934)"],
        ["Kultur als Werkzeug zur Befriedigung grundlegender Bedürfnisse", "Bronisław Malinowski"],
      ], level === 1 ? 3 : 4, "Die Definitionen verschieben sich vom aufzählenden Ganzen (Tylor) über historisch gewachsene Einheiten (Boas, Benedict) und Funktionen (Malinowski) zu Bedeutungen, die gedeutet werden (Geertz).");
      if (level === 3) return choiceTask(G, G.pick([
        { md: "Geertz unterscheidet nach Gilbert Ryle zwischen einem Zucken des Augenlids und einem Zwinkern. Worauf will er hinaus?", right: "Physikalisch gleiche Bewegungen können ganz verschiedene Bedeutungen haben. Ethnographie muss die Bedeutung beschreiben: »dichte Beschreibung«.", wrong: [["Man soll Verhalten möglichst exakt messen.", "Genau das reicht nach Geertz nicht: Die Messung ist bei beiden gleich."], ["Zwinkern ist in allen Kulturen gleich.", "Gerade nicht: Bedeutungen sind kulturell."]], explain: "Dichte Beschreibung erfasst die Schichten der Bedeutung: ein Zwinkern, ein parodiertes Zwinkern, ein geprobtes Zwinkern …" },
        { md: "Warum gilt Tylors Kulturbegriff heute als problematisch, obwohl er als erste wissenschaftliche Definition gilt?", right: "Er stand in einem evolutionistischen Rahmen, der Kulturen auf einer Stufenleiter von »wild« bis »zivilisiert« anordnete.", wrong: [["Weil er nur materielle Dinge zählte.", "Er nannte ausdrücklich Wissen, Glauben, Moral und Recht."], ["Weil er Kultur für angeboren hielt.", "Tylor betonte gerade, dass Kultur erworben wird."]], explain: "Der Kulturbegriff im Singular, »die Kultur« als mehr oder weniger, wurde von Boas zur Mehrzahl gleichwertiger Kulturen umgedacht." },
      ]));
      return fromPool(G, [
        ["Kulturen sind nach heutigem Verständnis klar abgegrenzte, in sich einheitliche Gebilde.", false, "Kultur gilt heute als offen, umstritten und im Wandel. Innerhalb jeder Gruppe gibt es Unterschiede und Austausch nach außen."],
        ["Kultur wird gelernt und nicht biologisch vererbt.", true, "Ein Kind, das in einer anderen Gesellschaft aufwächst, übernimmt deren Sprache und Gewohnheiten."],
        ["Die »dichte Beschreibung« verzichtet auf jede Deutung, um objektiv zu bleiben.", false, "Sie ist gerade Deutung: das Herausarbeiten von Bedeutungsschichten."],
        ["Der Begriff »Kultur« kann selbst politisch benutzt werden, etwa um Gruppen als unveränderlich verschieden darzustellen.", true, "Deshalb sprechen manche lieber von kulturellen Praktiken als von »einer Kultur«."],
      ]);
    },
  });

  gen("eth-relativismus", {
    title: "Ethnozentrismus und Relativismus",
    make(level, G) {
      if (level <= 2) return sortTask(G, "Welche Haltung drückt die Aussage aus?", ["ethnozentrisch", "kulturrelativistisch"], [
        ["»Die essen Insekten, das ist doch primitiv.«", "ethnozentrisch"],
        ["»Um zu verstehen, warum dort Insekten gegessen werden, muss man Ernährung, Geschmack und Wirtschaft dort kennen.«", "kulturrelativistisch"],
        ["»Ohne Schrift kann eine Gesellschaft keine Geschichte haben.«", "ethnozentrisch"],
        ["»Die Ehe mit mehreren Frauen hat dort wirtschaftliche und soziale Gründe, die man untersuchen sollte.«", "kulturrelativistisch"],
        ["»Unsere Art zu begrüßen ist die natürliche, alles andere ist seltsam.«", "ethnozentrisch"],
        ["»Was als höflich gilt, unterscheidet sich, und jede Form folgt ihren eigenen Regeln.«", "kulturrelativistisch"],
        ["»Die sollen sich endlich weiterentwickeln, so wie wir.«", "ethnozentrisch"],
      ], level === 1 ? 4 : 6, "Ethnozentrismus misst andere an den Maßstäben der eigenen Gruppe. Kulturrelativismus versucht, Praktiken zuerst aus ihrem Zusammenhang zu verstehen.");
      if (level === 3) return choiceTask(G, G.pick([
        { md: "Was ist mit **methodischem** Kulturrelativismus gemeint?", right: "Beim Forschen das eigene Urteil zurückstellen, um eine Praxis aus ihrem Zusammenhang zu verstehen.", wrong: [["Alles, was in einer Kultur üblich ist, ist automatisch gut.", "Das wäre ethischer Relativismus, eine viel stärkere Behauptung."], ["Man darf andere Kulturen nicht erforschen.", "Im Gegenteil: Er ist eine Haltung für das Forschen."]], explain: "Verstehen ist nicht dasselbe wie Gutheißen. Man kann eine Praxis erklären und sie trotzdem kritisieren." },
        { md: "1947 warnte die American Anthropological Association bei der Vorbereitung der Menschenrechtserklärung vor universalen Rechten. Welche Kritik wurde daran später geübt?", right: "Die Haltung könne Unterdrückung im Namen der »eigenen Kultur« schützen und übersehe Stimmen innerhalb der Gesellschaften.", wrong: [["Die Ethnologen hätten zu wenig über Rechte nachgedacht.", "Sie hatten eine klare Position, die aber problematisch war."], ["Menschenrechte seien nur für Europa gedacht gewesen.", "Das war eine Sorge der Erklärung von 1947 selbst, nicht die spätere Kritik."]], explain: "Die AAA hat 1999 eine eigene Erklärung zu Menschenrechten verabschiedet. Die Spannung zwischen Relativismus und Universalismus bleibt ein Grundthema des Fachs." },
      ]));
      return fromPool(G, [
        ["Kulturrelativismus und Menschenrechte schließen sich logisch aus.", false, "Methodischer Relativismus ist mit universalen Werten vereinbar. Konflikte entstehen erst beim ethischen Relativismus."],
        ["Auch die eigene Kultur kann man mit dem »fremden Blick« untersuchen, etwa durch Verfremdung des Vertrauten.", true, "Ein bekanntes Beispiel ist Horace Miners »Body Ritual among the Nacirema« (1956), eine Beschreibung amerikanischer Hygiene wie eines exotischen Rituals."],
        ["Ethnozentrismus ist eine Eigenheit westlicher Gesellschaften.", false, "Viele Gruppen nennen sich selbst schlicht »die Menschen« und sehen andere als weniger vollständig. Ethnozentrismus ist weit verbreitet."],
        ["Kulturrelativismus wurde in der Ethnologie vor allem durch Franz Boas und seine Schüler geprägt.", true, "Etwa Ruth Benedict, Margaret Mead und Melville Herskovits."],
      ]);
    },
  });

  // ---------------------------------------------------------------- exchange

  gen("eth-gabe", {
    title: "Gabe und Reziprozität",
    make(level, G) {
      if (level === 1) return matchTask(G, "Die drei Verpflichtungen der Gabe nach Marcel Mauss und ihre Bedeutung:", [
        ["geben", "Wer nicht gibt, verweigert die Beziehung"],
        ["annehmen", "Wer eine Gabe ablehnt, beleidigt den Gebenden"],
        ["erwidern", "Wer nicht zurückgibt, verliert Ansehen und gerät in Abhängigkeit"],
      ], 3, "Für Mauss ist die Gabe nie »frei«: Sie stiftet Pflichten und damit soziale Bindungen. Deshalb nennt er sie ein totales soziales Phänomen.");
      if (level === 2) return sortTask(G, "Welche Reziprozität nach Sahlins liegt vor?", ["generalisiert", "ausgeglichen", "negativ"], [
        ["Eltern kochen jeden Tag für ihre Kinder.", "generalisiert"],
        ["Nachbarn helfen sich beim Umzug und rechnen damit, dass die Hilfe in ähnlichem Umfang erwidert wird.", "ausgeglichen"],
        ["Auf einem Basar wird um jeden Euro gefeilscht.", "negativ"],
        ["Hochzeitsgeschenke werden notiert, um bei der nächsten Hochzeit Gleichwertiges zu schenken.", "ausgeglichen"],
        ["Ein Jäger teilt seine Beute mit der ganzen Lagergruppe.", "generalisiert"],
        ["Ein Händler verkauft Fremden minderwertige Ware zu überhöhten Preisen.", "negativ"],
        ["Zwei Dörfer tauschen jedes Jahr Fisch gegen Yams in festen Mengen.", "ausgeglichen"],
      ], 5, "Je näher die soziale Beziehung, desto weniger wird gerechnet. Unter Fremden wird verhandelt oder sogar übervorteilt.");
      if (level === 3) return fromPool(G, [
        ["Im Kula-Ring wandern Halsketten im Uhrzeigersinn und Armreifen gegen den Uhrzeigersinn.", true, "So beschreibt es Malinowski. Die Gegenstände haben kaum Gebrauchswert, aber großes Prestige."],
        ["Kula-Gegenstände werden behalten und vererbt, sobald man sie besitzt.", false, "Sie müssen weitergegeben werden. Ansehen bringt das Halten auf Zeit und die Geschichte des Objekts."],
        ["Beim Potlatch der Nordwestküste konnten Gastgeber großen Besitz verschenken oder sogar zerstören, um Rang zu zeigen.", true, "Die kanadische Regierung verbot den Potlatch von 1884 bis 1951."],
        ["Nach Mauss ist eine Gabe ohne Erwartung einer Gegengabe der Normalfall in allen Gesellschaften.", false, "Mauss betont, dass Gaben fast überall Verpflichtungen schaffen. Die »reine Gabe« ist eher ein Ideal."],
      ]);
      return choiceTask(G, G.pick([
        { md: "Ein Kollege lädt dich zum Essen ein. Warum fühlt es sich unangenehm an, ihm sofort den genauen Betrag zu überweisen?", right: "Sofortiges Begleichen beendet die Beziehung wie einen Kauf. Eine spätere Gegeneinladung hält sie lebendig.", wrong: [["Weil Überweisungen unhöflich sind.", "Es geht nicht um das Medium, sondern um das Rechnen."], ["Weil Gaben grundsätzlich nicht erwidert werden dürfen.", "Sie sollen erwidert werden, aber zeitversetzt und nicht exakt."]], explain: "Sahlins: Ausgeglichene Reziprozität mit zeitlicher Verzögerung schafft Bindung. Sofortiger exakter Ausgleich ist marktförmig." },
        { md: "Warum spricht Mauss von einem »totalen sozialen Phänomen«?", right: "In der Gabe sind wirtschaftliche, rechtliche, religiöse und moralische Dimensionen zugleich enthalten.", wrong: [["Weil die ganze Gesellschaft gleichzeitig beschenkt wird.", "Es geht um die Verflechtung von Lebensbereichen, nicht um die Zahl der Beschenkten."], ["Weil Gaben immer sehr wertvoll sind.", "Auch kleine Gaben verpflichten."]], explain: "Die Gabe lässt sich nicht in »Wirtschaft« und »Religion« zerlegen. Sie verbindet alles, was eine Gesellschaft zusammenhält." },
      ]));
    },
  });

  // ---------------------------------------------------------------- kinship (computed)

  const KIN_NAMES = { F: "Vater", M: "Mutter", B: "Bruder", Z: "Schwester", S: "Sohn", D: "Tochter" };
  const KIN_POOL = ["F", "M", "FB", "FZ", "MB", "MZ", "FF", "FM", "MF", "MM", "FBS", "FBD", "FZS", "FZD", "MBS", "MBD", "MZS", "MZD", "BS", "BD", "ZS", "ZD", "FFB", "MMZ", "FBSS", "MZDD"];
  /** Is the person reached by the kin type in Ego's descent group? Ego is male; mothers and fathers marry in from other groups. */
  function inLineage(type, rule) {
    let inG = true, male = true;
    for (const ch of type) {
      if (ch === "F") { inG = rule === "patri" ? inG : false; male = true; }
      else if (ch === "M") { inG = rule === "matri" ? inG : false; male = false; }
      else if (ch === "B" || ch === "Z") { male = ch === "B"; }
      else if (ch === "S" || ch === "D") { inG = inG && (rule === "patri" ? male : !male); male = ch === "S"; }
    }
    return inG;
  }
  const KIN_GEN = { F: "des Vaters", M: "der Mutter", B: "des Bruders", Z: "der Schwester", S: "des Sohnes", D: "der Tochter" };
  /** Kin type in the usual English shorthand plus a German reading, e.g. FZS: Sohn der Schwester des Vaters. */
  const kinLabel = (type) => {
    const cs = type.split("");
    let txt = KIN_NAMES[cs[cs.length - 1]];
    for (let i = cs.length - 2; i >= 0; i--) txt += " " + KIN_GEN[cs[i]];
    return "$" + type + "$ (" + txt + ")";
  };
  const RULES = { patri: "patrilinear", matri: "matrilinear" };

  gen("eth-verwandtschaft", {
    title: "Abstammung",
    make(level, G) {
      if (level === 1) {
        const rule = G.pick(["patri", "matri"]), type = G.pick(KIN_POOL);
        const ans = inLineage(type, rule);
        return tf("In einer **" + RULES[rule] + "en** Gesellschaft: Gehört " + kinLabel(type) + " zu Egos eigener Abstammungsgruppe? (Ego ist männlich, Ehepartner kommen aus anderen Gruppen.)", ans,
          "Bei " + RULES[rule] + "er Abstammung wird die Zugehörigkeit nur über " + (rule === "patri" ? "Männer, also über Väter," : "Frauen, also über Mütter,") + " weitergegeben. " + (ans ? "Der Weg zu dieser Person läuft nur über solche Glieder." : "Auf dem Weg zu dieser Person wechselt die Zugehörigkeit einmal über das andere Geschlecht."),
          "Prüfe Glied für Glied, ob die Zugehörigkeit über das richtige Geschlecht weitergegeben wird.");
      }
      if (level === 2) {
        const rule = G.pick(["patri", "matri"]);
        let types;
        do { types = G.pickN(KIN_POOL, 6); } while (types.every((t) => inLineage(t, rule)) || types.every((t) => !inLineage(t, rule)));
        return { type: "sort", md: "Gesellschaft mit **" + RULES[rule] + "er** Abstammung, Ego ist männlich. Wer gehört zu Egos Lineage?", categories: ["gehört dazu", "gehört nicht dazu"], items: types.map((t) => ({ md: kinLabel(t), cat: inLineage(t, rule) ? "gehört dazu" : "gehört nicht dazu" })), explain: "Dazu gehören: " + types.filter((t) => inLineage(t, rule)).join(", ") + ". " + (rule === "patri" ? "Kinder einer Frau gehören zur Gruppe ihres Mannes, deshalb fallen die Kinder der Schwestern heraus." : "Kinder eines Mannes gehören zur Gruppe ihrer Mutter, deshalb fallen die Kinder der Brüder heraus.") };
      }
      if (level === 3) {
        const cous = G.pickN(["FBS", "FBD", "FZS", "FZD", "MBS", "MBD", "MZS", "MZD"], 6);
        const isCross = (t) => (t[0] === "F" && t[1] === "Z") || (t[0] === "M" && t[1] === "B");
        return { type: "sort", md: "Kreuzcousin oder Parallelcousin?", categories: ["Kreuzcousin", "Parallelcousin"], items: cous.map((t) => ({ md: kinLabel(t), cat: isCross(t) ? "Kreuzcousin" : "Parallelcousin" })), explain: "Kreuzcousins sind Kinder von Geschwistern **verschiedenen** Geschlechts der Eltern: Kinder von FZ und MB. Parallelcousins stammen von gleichgeschlechtlichen Geschwistern: FB und MZ. In unilinearen Systemen gehören Kreuzcousins nie zur eigenen Lineage." };
      }
      const type = G.pick(KIN_POOL);
      const p = inLineage(type, "patri"), m = inLineage(type, "matri");
      const right = p && m ? "in beiden Fällen" : p ? "nur bei patrilinearer Abstammung" : m ? "nur bei matrilinearer Abstammung" : "in keinem der beiden Fälle";
      const opts = ["nur bei patrilinearer Abstammung", "nur bei matrilinearer Abstammung", "in beiden Fällen", "in keinem der beiden Fälle"];
      return { type: "choice", md: "Wann gehört " + kinLabel(type) + " zu Egos Abstammungsgruppe? (Ego männlich)", shuffle: false, options: opts.map((o) => (o === right ? { md: o, correct: true } : { md: o })), explain: "Patrilinear: " + (p ? "ja" : "nein") + ", matrilinear: " + (m ? "ja" : "nein") + ". Bei kognatischer (bilateraler) Abstammung wären dagegen alle Blutsverwandten auf beiden Seiten Verwandte, eine abgegrenzte Lineage gibt es dort nicht." };
    },
  });

  gen("eth-heirat", {
    title: "Heirat und Allianz",
    make(level, G) {
      if (level === 1) return matchTask(G, "Ordne die Begriffe zu.", [
        ["Exogamie", "Heirat außerhalb der eigenen Gruppe ist vorgeschrieben"],
        ["Endogamie", "Heirat innerhalb einer bestimmten Gruppe ist vorgeschrieben"],
        ["Brautpreis", "Die Familie des Bräutigams leistet Zahlungen an die Familie der Braut"],
        ["Mitgift", "Die Braut bringt Vermögen in die Ehe ein"],
        ["Polygynie", "Ein Mann ist mit mehreren Frauen verheiratet"],
        ["Polyandrie", "Eine Frau ist mit mehreren Männern verheiratet"],
        ["Levirat", "Die Witwe heiratet den Bruder des verstorbenen Mannes"],
      ], 4, "Heirat regelt nicht nur eine Beziehung zwischen zwei Menschen, sondern Rechte, Besitz und Bündnisse zwischen Gruppen.");
      if (level === 2) {
        const n = G.int(3, 5), L = "ABCDE".slice(0, n);
        const gen2 = G.chance(0.5);
        const arrows = gen2 ? L.split("").map((x, i) => x + " → " + L[(i + 1) % n]).join(", ") : G.pick(["A ↔ B, C ↔ D", "A ↔ C, B ↔ D", "A ↔ D, B ↔ C"]);
        return { type: "choice", md: "Gruppen geben Frauen als Ehefrauen weiter: " + arrows + " (Pfeil: gibt an). Welche Form des Tauschs nach Lévi-Strauss liegt vor?", shuffle: false, options: [{ md: "eingeschränkter Tausch", correct: !gen2 }, { md: "verallgemeinerter Tausch", correct: gen2 }], explain: gen2 ? "Ein Kreis, in dem niemand direkt von dem zurückbekommt, dem er gibt: verallgemeinerter Tausch. Er bindet viele Gruppen in eine Kette gegenseitigen Vertrauens." : "Direkter Austausch zwischen Paaren von Gruppen: eingeschränkter Tausch." };
      }
      if (level === 3) return fromPool(G, [
        ["Für Lévi-Strauss ist das Inzesttabu die Regel, die Gruppen zwingt, Beziehungen zu anderen Gruppen einzugehen.", true, "Wer nicht innerhalb heiraten darf, muss tauschen. Darin sieht er den Übergang von Natur zu Kultur."],
        ["Die Allianztheorie stellt die Abstammung in den Mittelpunkt, die Deszendenztheorie die Heiratsbündnisse.", false, "Umgekehrt: Deszendenztheorie (Radcliffe-Brown, Fortes) betont Abstammungsgruppen, Allianztheorie (Lévi-Strauss) die Heiratsbeziehungen zwischen ihnen."],
        ["Gayle Rubin kritisierte 1975, dass in Lévi-Strauss' Modell Frauen nur als getauschte Objekte vorkommen.", true, "Ihr Aufsatz »The Traffic in Women« wurde ein Grundtext der feministischen Anthropologie."],
        ["Die Heirat mit der Tochter des Mutterbruders ermöglicht verallgemeinerten Tausch.", true, "Bei konsequenter matrilateraler Kreuzcousinenheirat fließen Frauen immer in dieselbe Richtung."],
      ]);
      return choiceTask(G, G.pick([
        { md: "In einer Gesellschaft heiraten Männer bevorzugt die Tochter ihres Mutterbruders. Was folgt daraus für die Beziehungen zwischen Lineages?", right: "Frauen fließen immer in dieselbe Richtung: Eine Lineage ist stets Frauengeber, die andere Frauennehmer, ein Kreis entsteht.", wrong: [["Je zwei Lineages tauschen direkt untereinander.", "Das wäre bei bilateraler Kreuzcousinenheirat der Fall."], ["Es entstehen gar keine Bindungen zwischen Lineages.", "Jede Heirat bindet zwei Lineages aneinander."]], explain: "Lévi-Strauss nennt das verallgemeinerten Tausch. Oft ist der Frauengeber dabei ranghöher als der Frauennehmer." },
        { md: "Warum spricht man bei Brautpreis nicht einfach vom »Kauf« einer Frau?", right: "Die Zahlungen schaffen Rechte und Pflichten zwischen Familien, etwa über die Zugehörigkeit der Kinder, und können zurückgefordert werden.", wrong: [["Weil kein Geld fließt.", "Oft fließt Geld oder Vieh."], ["Weil die Frau den Preis selbst festlegt.", "Das ist nicht der Grund."]], explain: "Ethnologen deuten Brautpreis meist als Übertragung von Rechten, häufig über die Kinder, und als Bündnis zwischen Gruppen, nicht als Warenkauf." },
      ]));
    },
  });

  // ---------------------------------------------------------------- ritual and religion

  const RITES = [
    { name: "Initiation von Jungen", steps: ["Die Jungen werden von ihren Müttern getrennt und in ein Lager außerhalb des Dorfes gebracht.", "Im Lager tragen alle gleiche Kleidung, haben keine Namen und lernen geheimes Wissen.", "Mit neuem Schmuck kehren sie zurück und gelten als erwachsene Männer."] },
    { name: "Hochzeit", steps: ["Die Braut verlässt das Elternhaus, oft mit einem Abschiedsritual.", "Die Zeremonie: Die Brautleute stehen zwischen ihrem alten und neuen Leben, besondere Kleidung, besondere Regeln.", "Das Paar wird als Ehepaar in die Gemeinschaft aufgenommen, oft mit einem Fest."] },
    { name: "Bestattung", steps: ["Der Tote wird aus dem Haus gebracht, die Angehörigen legen Trauerkleidung an.", "Trauerzeit: Die Hinterbliebenen leben nach besonderen Regeln, der Tote gilt als noch nicht ganz fort.", "Mit einem Abschlussfest kehren die Angehörigen in den Alltag zurück, der Tote ist nun ein Ahne."] },
    { name: "Abitur und Abschlussfeier", steps: ["Die Prüfungen beginnen, der normale Unterricht endet.", "Die Zeit zwischen Prüfung und Zeugnis: nicht mehr Schüler, noch nicht Absolvent, Abistreiche und Mottowoche.", "Die Zeugnisübergabe mit Feier: Man ist nun Absolventin oder Absolvent."] },
  ];
  const PHASES = ["Trennung", "Schwellenphase", "Angliederung"];

  gen("eth-ritual", {
    title: "Übergangsriten",
    make(level, G) {
      const R = G.pick(RITES);
      if (level === 1) return { type: "order", md: "**" + R.name + "**: Bringe die Phasen in die Reihenfolge nach Arnold van Gennep.", items: R.steps, explain: "Trennung, Schwellenphase (liminale Phase), Angliederung. Van Gennep fand dieses Muster 1909 in Riten auf der ganzen Welt." };
      if (level === 2) {
        const pairs = RITES.flatMap((r) => r.steps.map((s, i) => [r.name + ": " + s, PHASES[i]]));
        return sortTask(G, "Welcher Phase gehört der Ausschnitt an?", PHASES, pairs, 5, "Erkennungszeichen: Trennung löst aus dem Alten, die Schwellenphase ist ein »weder noch« mit eigenen Regeln, die Angliederung bestätigt den neuen Status.");
      }
      if (level === 3) return fromPool(G, [
        ["Victor Turner nennt das Gemeinschaftsgefühl unter Gleichen in der Schwellenphase »communitas«.", true, "Rangunterschiede sind aufgehoben, die Beteiligten erleben sich als Gleiche."],
        ["In der liminalen Phase gelten die Regeln des Alltags besonders streng.", false, "Sie sind aufgehoben oder umgekehrt. Turner spricht von »Antistruktur«."],
        ["Nach Turner gibt es auch in modernen Gesellschaften liminoide Erfahrungen, etwa bei Festivals oder Pilgerreisen.", true, "Er nennt sie liminoid, weil sie freiwillig und weniger verbindlich sind."],
        ["Van Gennep betrachtete Übergangsriten nur bei Lebensübergängen, nicht bei Jahreszeiten oder Ortswechseln.", false, "Er bezog auch das Überschreiten von Schwellen, Jahreswechsel und Gebietsgrenzen ein."],
      ]);
      return matchTask(G, "Ordne die Begriffe den Autoren zu.", [
        ["Übergangsriten mit drei Phasen (1909)", "Arnold van Gennep"],
        ["Liminalität, communitas und Antistruktur (1969)", "Victor Turner"],
        ["Das Heilige und das Profane, kollektive Efferveszenz (1912)", "Émile Durkheim"],
        ["Religion als kulturelles System von Symbolen (1966)", "Clifford Geertz"],
      ], 4, "Van Gennep und Turner beschreiben die Struktur von Riten, Durkheim fragt nach ihrer Funktion für die Gemeinschaft, Geertz nach ihrer Bedeutung.");
    },
  });

  gen("eth-religion", {
    title: "Religion, Magie, Hexerei",
    make(level, G) {
      if (level === 1) return sortTask(G, "Welche Form der sympathetischen Magie nach James Frazer?", ["Ähnlichkeitsmagie", "Kontaktmagie"], [
        ["Eine Puppe, die einem Feind ähnelt, wird mit Nadeln durchstochen.", "Ähnlichkeitsmagie"],
        ["Haare oder Fingernägel eines Menschen werden für einen Zauber verwendet.", "Kontaktmagie"],
        ["Wasser wird ausgegossen, damit es regnet.", "Ähnlichkeitsmagie"],
        ["Ein Kleidungsstück eines Verstorbenen bewahrt seine Kraft.", "Kontaktmagie"],
        ["Ein gelbes Mittel soll gegen Gelbsucht helfen.", "Ähnlichkeitsmagie"],
        ["Der Fußabdruck eines Menschen wird manipuliert, um ihm zu schaden.", "Kontaktmagie"],
      ], 4, "Frazer: Ähnliches bewirkt Ähnliches (Ähnlichkeitsmagie), und was einmal verbunden war, bleibt verbunden (Kontaktmagie). Seine Einordnung von Magie als »falscher Wissenschaft« gilt heute als überholt.");
      if (level === 2) return choiceTask(G, {
        md: "Bei den Azande stürzt ein Getreidespeicher ein, und Menschen, die im Schatten darunter sitzen, werden verletzt. Termiten haben die Stützen zerfressen, das wissen alle. Warum sprechen sie trotzdem von Hexerei?",
        right: "Termiten erklären, **wie** es geschah. Hexerei erklärt, **warum** es gerade diese Menschen zu diesem Zeitpunkt traf.",
        wrong: [["Sie wissen nichts von Termiten.", "Evans-Pritchard betont, dass die Azande die natürlichen Ursachen genau kennen."], ["Hexerei ist bei ihnen eine Ausrede für Faulheit.", "Hexerei ist ein schlüssiges System, das Unglück deutet und Handeln anleitet."], ["Sie glauben, dass Hexen die Termiten geschickt haben.", "Die Termiten brauchen keine Erklärung, nur das Zusammentreffen."]],
        explain: "Evans-Pritchard (1937) zeigt: Hexerei beantwortet die Frage nach dem besonderen Unglück, die unsere Naturwissenschaft offenlässt. Wir sprechen dann oft von »Pech«.",
      });
      if (level === 3) return fromPool(G, [
        ["Für Durkheim ist Religion ein System von Glaubensvorstellungen und Praktiken, das sich auf heilige Dinge bezieht und eine moralische Gemeinschaft stiftet.", true, "In den Elementaren Formen des religiösen Lebens (1912) untersucht er dazu den Totemismus in Australien."],
        ["Frazer sah eine Entwicklung von Magie über Religion zur Wissenschaft.", true, "Dieses evolutionistische Schema gilt heute als überholt."],
        ["Bei den Azande dient das Giftorakel dazu, Hexer zu ermitteln, indem einem Huhn Gift gegeben wird.", true, "Ob das Huhn stirbt oder überlebt, beantwortet eine Ja-Nein-Frage."],
        ["Evans-Pritchard hielt das Denken der Azande für unlogisch.", false, "Er betonte gerade die innere Logik des Systems, das in sich schlüssig ist."],
      ]);
      return matchTask(G, "Ordne die Theorien zu.", [
        ["Magie als falsche Anwendung von Assoziationsgesetzen", "James Frazer"],
        ["Religion als Selbstverehrung der Gesellschaft", "Émile Durkheim"],
        ["Hexerei als Theorie des Unglücks", "E. E. Evans-Pritchard"],
        ["Magie hilft dort, wo Technik an ihre Grenzen kommt, etwa beim Fischen auf hoher See", "Bronisław Malinowski"],
      ], 4, "Von der Frage »Was ist falsch an Magie?« (Frazer) zu »Was leistet sie?« (Malinowski, Durkheim) und »Wie ergibt sie Sinn?« (Evans-Pritchard).");
    },
  });

  // ---------------------------------------------------------------- politics and identity

  const LEVELS = ["Familie", "Lineage", "Clan", "Stamm"];

  gen("eth-politik", {
    title: "Gesellschaften ohne Staat",
    make(level, G) {
      if (level === 1) return sortTask(G, "Ordne die Merkmale den Typen politischer Organisation nach Elman Service zu.", ["Gruppe (band)", "Stammesgesellschaft", "Häuptlingstum", "Staat"], [
        ["kleine, mobile Gruppe von Wildbeutern, Entscheidungen im Konsens", "Gruppe (band)"],
        ["Dörfer, verbunden durch Verwandtschaft und Bünde, kein zentrales Amt", "Stammesgesellschaft"],
        ["erbliches Oberhaupt, das Abgaben sammelt und umverteilt", "Häuptlingstum"],
        ["Verwaltung, Steuern und ein Monopol auf legitime Gewalt", "Staat"],
        ["Big Men, deren Einfluss auf Großzügigkeit und Überzeugung beruht", "Stammesgesellschaft"],
        ["Rangunterschiede zwischen Abstammungsgruppen, Häuptling an der Spitze", "Häuptlingstum"],
      ], 5, "Service (1962) ordnete politische Formen nach Größe und Zentralisierung. Die Typologie ist umstritten, weil sie wie eine Entwicklungsleiter gelesen werden kann.");
      if (level === 2 || level === 3) {
        // a random segmentary conflict on a tree with four levels: who joins the fight?
        const a = G.int(0, 7);
        let b;
        do { b = G.int(0, 7); } while (b === a);
        const anc = (x, lvl) => Math.floor(x / Math.pow(2, lvl));
        let lvl = 0;
        while (anc(a, lvl) !== anc(b, lvl)) lvl++;
        const name = (x) => "Familie " + (x + 1);
        if (level === 2) return { type: "choice", md: "Ein segmentäres System wie bei den Nuer: Je zwei Familien bilden eine Lineage, je zwei Lineages einen Clan, die beiden Clans den Stamm (Familien 1 bis 8 in dieser Reihenfolge). Streiten " + name(a) + " und " + name(b) + ", auf welcher Ebene treffen sich die Parteien?", shuffle: false, options: LEVELS.slice(1).map((L, i) => (i + 1 === lvl ? { md: L, correct: true } : { md: L })), explain: "Der gemeinsame Vorfahr liegt auf der Ebene »" + LEVELS[lvl] + "«. Alle Gruppen darunter stellen sich auf die Seite ihres Zweigs. Gegenüber Außenstehenden stehen dieselben Gruppen wieder zusammen: Evans-Pritchard nennt das »geordnete Anarchie«." };
        const mob = Math.pow(2, lvl);
        return { type: "numeric", md: "Gleiches System (8 Familien, Lineages aus 2, Clans aus 4 Familien). " + name(a) + " streitet mit " + name(b) + ". Wie viele Familien stehen auf der Seite von " + name(a) + "?", answer: mob / 2, tolerance: 0, placeholder: "Zahl", explain: "Mobilisiert wird der ganze Zweig unterhalb des gemeinsamen Vorfahren, auf jeder Seite $" + mob / 2 + "$ Familien. Je weiter entfernt die Gegner verwandt sind, desto größer die Gruppen, die sich gegenüberstehen." };
      }
      return fromPool(G, [
        ["Evans-Pritchard beschrieb die politische Ordnung der Nuer als »geordnete Anarchie«: Ordnung ohne Herrscher.", true, "Gleichgewicht zwischen Segmenten, Fehde und Vermittlung ersetzten eine Zentrale."],
        ["Pierre Clastres meinte, manche Gesellschaften hätten keinen Staat, weil sie noch nicht weit genug entwickelt seien.", false, "Er argumentierte umgekehrt: Sie verhindern aktiv die Entstehung von Herrschaft, »Gesellschaft gegen den Staat« (1974)."],
        ["Ein Leopardenfell-Häuptling der Nuer konnte Streit schlichten, aber niemanden zwingen.", true, "Seine Rolle war rituell und vermittelnd, nicht befehlend."],
        ["Staatenlose Gesellschaften haben keine Konfliktregelung.", false, "Sie haben Verfahren wie Fehde, Schlichtung, Ausgleichszahlungen und Rat der Älteren."],
      ]);
    },
  });

  gen("eth-ethnizitaet", {
    title: "Ethnizität und Identität",
    make(level, G) {
      if (level <= 2) return sortTask(G, "Welche Sicht auf Ethnizität steckt in der Aussage?", ["primordialistisch", "konstruktivistisch", "instrumentalistisch"], [
        ["»Unsere Volkszugehörigkeit ist uns von Geburt an gegeben und unveränderlich.«", "primordialistisch"],
        ["»Die Nation ist eine vorgestellte Gemeinschaft: Die meisten Mitglieder werden sich nie begegnen.«", "konstruktivistisch"],
        ["»Politiker betonen ethnische Unterschiede, um Wähler zu mobilisieren.«", "instrumentalistisch"],
        ["»Viele »uralte« Traditionen wurden erst im 19. Jahrhundert erfunden.«", "konstruktivistisch"],
        ["»Händlergruppen pflegen ihre ethnische Identität, weil sie ihnen Vertrauen und Netzwerke sichert.«", "instrumentalistisch"],
        ["»Das Blut verbindet uns mit unseren Vorfahren.«", "primordialistisch"],
      ], level === 1 ? 3 : 5, "Primordialismus: Ethnizität als ursprüngliche Bindung. Konstruktivismus: sozial und historisch hergestellt (Anderson, Hobsbawm). Instrumentalismus: als Mittel im Wettbewerb um Ressourcen eingesetzt. In der Forschung überwiegen heute konstruktivistische Ansätze.");
      if (level === 3) return choiceTask(G, {
        md: "Fredrik Barth (1969) schlägt vor, Ethnizität nicht über die »kulturellen Inhalte« einer Gruppe zu bestimmen. Worüber stattdessen?",
        right: "Über die Grenze: wie Menschen sich und andere zuordnen und diese Unterscheidung im Kontakt aufrechterhalten.",
        wrong: [["Über Sprache und Kleidung.", "Die können sich ändern, ohne dass die Grenze verschwindet."], ["Über die Abstammung, die man genetisch nachweisen kann.", "Barths Ansatz ist gerade nicht biologisch."], ["Über das Gebiet, in dem eine Gruppe lebt.", "Grenzen bestehen auch dort, wo Gruppen gemischt leben."]],
        explain: "Gerade im Kontakt bleiben Grenzen bestehen, auch wenn Menschen sie überschreiten oder Merkmale der anderen übernehmen.",
      });
      return fromPool(G, [
        ["Nach Barth verschwinden ethnische Grenzen, wenn Menschen zwischen Gruppen wechseln.", false, "Grenzen bleiben oft trotz Wechsel und Austausch bestehen."],
        ["Benedict Anderson beschreibt Nationen als vorgestellte Gemeinschaften, ermöglicht unter anderem durch Buchdruck und Zeitungen.", true, "Gemeinsame Lektüre ließ Menschen sich als Teil eines größeren »Wir« vorstellen."],
        ["Konstruiert heißt nach konstruktivistischer Sicht: unwirklich und bedeutungslos.", false, "Konstruiertes kann sehr wirkmächtig sein, wie Geld oder Staatsgrenzen zeigen."],
        ["Die Kolonialverwaltung hat in Afrika teilweise erst Ethnien geschaffen, indem sie Menschen in »Stämme« einteilte.", true, "Verwaltungskategorien wurden zu Identitäten, mit Folgen bis heute."],
      ]);
    },
  });

  gen("eth-globalisierung", {
    title: "Globalisierung und Writing Culture",
    make(level, G) {
      if (level <= 2) return matchTask(G, "Ordne die Beispiele Arjun Appadurais »Landschaften« (scapes) zu.", [
        ["Pflegekräfte von den Philippinen arbeiten in Deutschland", "ethnoscape"],
        ["Eine koreanische Serie wird weltweit gestreamt", "mediascape"],
        ["Eine Fabrik in Vietnam nutzt Maschinen aus Japan", "technoscape"],
        ["Kapital fließt in Sekunden zwischen Börsen", "financescape"],
        ["Die Idee der Demokratie wird überall anders gedeutet", "ideoscape"],
      ], level === 1 ? 3 : 5, "Appadurai (1996) beschreibt Globalisierung als Ströme, die sich nicht decken: Menschen, Medien, Technik, Geld und Ideen bewegen sich unterschiedlich schnell und in verschiedene Richtungen.");
      if (level === 3) return fromPool(G, [
        ["Der Sammelband »Writing Culture« (1986) zeigte, dass Ethnographien auch literarische Texte mit eigenen Darstellungsmitteln sind.", true, "Damit geriet die Autorität der Forschenden in die Kritik: Wer spricht für wen?"],
        ["Globalisierung führt nach ethnologischen Studien zwangsläufig zu einer einheitlichen Weltkultur.", false, "Globale Güter werden lokal angeeignet und umgedeutet, man spricht von Glokalisierung oder Kreolisierung."],
        ["Edward Said kritisierte in »Orientalism« (1978), wie der Westen »den Orient« als Gegenbild konstruierte.", true, "Das Buch wurde ein Grundtext der postkolonialen Theorie."],
        ["Multi-sited ethnography folgt Menschen, Dingen oder Ideen über mehrere Orte hinweg.", true, "George Marcus schlug sie 1995 vor, als Antwort auf eine vernetzte Welt."],
      ]);
      return choiceTask(G, G.pick([
        { md: "In einem Dorf werden Fastfood-Burger zum Festessen bei Hochzeiten. Wie würde eine Ethnologin das deuten?", right: "Als lokale Aneignung: Ein globales Produkt bekommt eine neue, örtliche Bedeutung.", wrong: [["Als Verlust der Kultur, das Dorf wird amerikanisch.", "Das übersieht, dass die Bedeutung neu bestimmt wird: als Festessen."], ["Als bedeutungslos, weil Essen nur Ernährung ist.", "Essen ist in allen Gesellschaften auch Zeichen und Status."]], explain: "Studien wie »Golden Arches East« (Watson, 1997) zeigten, wie eine Fastfoodkette in Ostasien zu einem ganz anderen Ort wurde: für Familienfeiern, Hausaufgaben, Treffen." },
        { md: "Was bedeutet die »Krise der Repräsentation« für die heutige Ethnographie?", right: "Forschende machen ihre eigene Position sichtbar und lassen mehrere Stimmen zu Wort kommen.", wrong: [["Ethnographien sollten nicht mehr geschrieben werden.", "Es geht um bessere, nicht um keine Ethnographie."], ["Nur noch Zahlen gelten als zuverlässig.", "Die Debatte führte eher zu mehr Reflexion der Textform."]], explain: "Reflexivität, Dialog und Kooperation mit den Beforschten sind heute Standard." },
      ]));
    },
  });

  // ---------------------------------------------------------------- ethnographic world map

  const FIELDS = [
    { id: "trobriand", name: "Trobriand-Inseln", lon: 151.05, lat: -8.6, who: "Bronisław Malinowski", when: "1915 bis 1918", topic: "den Kula-Tausch", view: "ozeanien" },
    { id: "nuer", name: "Land der Nuer (Südsudan)", lon: 31.0, lat: 8.3, who: "E. E. Evans-Pritchard", when: "ab 1930", topic: "Ordnung ohne Staat", view: "afrika" },
    { id: "azande", name: "Land der Azande (Südsudan und Kongo)", lon: 27.5, lat: 4.8, who: "E. E. Evans-Pritchard", when: "1926 bis 1930", topic: "Hexerei und Orakel", view: "afrika" },
    { id: "samoa", name: "Samoa", lon: -172.1, lat: -13.8, who: "Margaret Mead", when: "1925 und 1926", topic: "Jugend und Erziehung", view: "world" },
    { id: "bali", name: "Bali", lon: 115.2, lat: -8.4, who: "Clifford Geertz", when: "1957 und 1958", topic: "den Hahnenkampf als Text einer Kultur", view: "suedostasien" },
    { id: "kwakiutl", name: "Kwakwaka'wakw (British Columbia)", lon: -127.0, lat: 50.6, who: "Franz Boas", when: "ab 1886", topic: "den Potlatch", view: "amerika" },
    { id: "baffin", name: "Baffininsel", lon: -68.5, lat: 66.0, who: "Franz Boas", when: "1883 und 1884", topic: "die Inuit und ihre Umwelt", view: "amerika" },
    { id: "bororo", name: "Land der Bororo (Brasilien)", lon: -55.5, lat: -16.0, who: "Claude Lévi-Strauss", when: "1935 und 1936", topic: "Dorfplan und Gesellschaftsordnung", view: "amerika" },
    { id: "ndembu", name: "Land der Ndembu (Sambia)", lon: 25.5, lat: -12.0, who: "Victor Turner", when: "1950 bis 1954", topic: "Rituale und Liminalität", view: "afrika" },
    { id: "swat", name: "Swat-Tal (Pakistan)", lon: 72.4, lat: 35.2, who: "Fredrik Barth", when: "1954", topic: "politische Führung der Paschtunen", view: "asien" },
    { id: "kachin", name: "Kachin-Bergland (Myanmar)", lon: 97.4, lat: 25.5, who: "Edmund Leach", when: "1939 bis 1945", topic: "politische Systeme im Wandel", view: "asien" },
    { id: "tiv", name: "Land der Tiv (Nigeria)", lon: 8.8, lat: 7.5, who: "Paul und Laura Bohannan", when: "1949 bis 1953", topic: "Tauschsphären", view: "afrika" },
    { id: "hagen", name: "Mount Hagen (Neuguinea)", lon: 144.2, lat: -5.9, who: "Andrew Strathern", when: "ab 1964", topic: "Big Men und den Moka-Tausch", view: "ozeanien" },
    { id: "andamanen", name: "Andamanen", lon: 92.7, lat: 11.7, who: "A. R. Radcliffe-Brown", when: "1906 bis 1908", topic: "Ritual und soziale Funktion", view: "suedostasien" },
    { id: "tikopia", name: "Tikopia (Salomonen)", lon: 168.8, lat: -12.3, who: "Raymond Firth", when: "1928 und 1929", topic: "Verwandtschaft auf einer kleinen Insel", view: "ozeanien" },
    { id: "kalahari", name: "Kalahari (Ju/'hoansi)", lon: 21.0, lat: -19.5, who: "Richard Lee", when: "ab 1963", topic: "das Leben von Jägern und Sammlerinnen", view: "afrika" },
  ];
  const field = (f) => "**" + f.name + "**: Hier forschte " + f.who + " (" + f.when + ") über " + f.topic + ".";
  const farApart = (list, km) => list.every((a, i) => list.every((b, j) => i >= j || LW.geo.km(a, b) >= km));
  function spread(G, n, km, must) {
    for (let tries = 0; tries < 200; tries++) {
      const rest = G.pickN(FIELDS.filter((f) => !must || f.id !== must.id), must ? n - 1 : n);
      const set = must ? [must].concat(rest) : rest;
      const people = new Set(set.map((f) => f.who));
      if (people.size === set.length && farApart(set, km)) return G.shuffle(set);
    }
    return null;
  }
  const mapPlace = (f) => ({ id: f.id, name: f.name, lon: f.lon, lat: f.lat });

  gen("eth-karte", {
    title: "Ethnographische Weltkarte",
    make(level, G) {
      const target = G.pick(FIELDS);
      if (level === 1) {
        const set = spread(G, 4, 2500, target) || [target];
        return {
          type: "widget", widget: "worldmap", label: "Karte",
          md: "Wo forschte **" + target.who + "** über " + target.topic + "? Tippe den passenden Ort an.",
          params: { mode: "pick", answer: target.id, places: set.map(mapPlace) },
          goal: {}, explain: field(target),
        };
      }
      if (level === 2) {
        const set = spread(G, 3, 1500, null) || FIELDS.slice(0, 3);
        const decoy = FIELDS.filter((f) => !set.includes(f) && set.every((s) => LW.geo.km(s, f) > 1500));
        const places = set.concat(decoy.length ? [G.pick(decoy)] : []);
        return {
          type: "widget", widget: "worldmap", label: "Karte",
          md: "Wer forschte wo? Tippe einen Namen an, dann den Ort auf der Karte. Ein Ort bleibt übrig.",
          params: { mode: "assign", places: G.shuffle(places).map(mapPlace), assign: set.map((f) => ({ name: f.who, place: f.id })) },
          goal: {}, explain: set.map(field).join("\n\n"),
        };
      }
      if (level === 3) {
        const world = target.view === "world";
        return {
          type: "widget", widget: "worldmap", label: "Karte",
          md: "Setze eine Markierung: Wo liegt **" + target.name + "**?",
          params: { mode: "locate", view: target.view, target: { name: target.name, lon: target.lon, lat: target.lat }, tolerance: world ? 1000 : 650 },
          goal: {}, explain: field(target),
        };
      }
      return {
        type: "widget", widget: "worldmap", label: "Karte",
        md: target.who + " forschte " + target.when + " über " + target.topic + ". **Wo war das?** Setze eine Markierung auf der Weltkarte.",
        params: { mode: "locate", view: "world", target: { name: target.name, lon: target.lon, lat: target.lat }, tolerance: 900 },
        goal: {}, explain: field(target),
      };
    },
  });
  // ---------------------------------------------------------------- classics on a timeline

  const CLASSICS = [
    { md: "Edward B. Tylor: *Primitive Culture*", year: 1871 },
    { md: "Lewis H. Morgan: *Ancient Society*", year: 1877 },
    { md: "James G. Frazer: *The Golden Bough*", year: 1890 },
    { md: "Émile Durkheim: *Die elementaren Formen des religiösen Lebens*", year: 1912 },
    { md: "Bronisław Malinowski: *Argonauten des westlichen Pazifik*", year: 1922 },
    { md: "Marcel Mauss: *Die Gabe*", year: 1925 },
    { md: "Ruth Benedict: *Patterns of Culture*", year: 1934 },
    { md: "E. E. Evans-Pritchard: *The Nuer*", year: 1940 },
    { md: "Claude Lévi-Strauss: *Die elementaren Strukturen der Verwandtschaft*", year: 1949 },
    { md: "Fredrik Barth: *Ethnic Groups and Boundaries*", year: 1969 },
    { md: "Clifford Geertz: *The Interpretation of Cultures*", year: 1973 },
    { md: "James Clifford und George Marcus (Hg.): *Writing Culture*", year: 1986 },
    { md: "Arjun Appadurai: *Modernity at Large*", year: 1996 },
  ];

  gen("eth-klassiker", {
    title: "Klassiker zeitlich einordnen",
    make(level, G) {
      const n = [3, 4, 5, 5][level - 1], gap = [35, 18, 10, 5][level - 1], tol = [15, 12, 8, 5][level - 1];
      let pick = null;
      for (let t = 0; t < 300 && !pick; t++) {
        const c = G.pickN(CLASSICS, n).sort((a, b) => a.year - b.year);
        if (c.every((x, i) => i === 0 || x.year - c[i - 1].year >= gap)) pick = c;
      }
      pick = pick || G.pickN(CLASSICS, n);
      return {
        type: "timeline", md: "Ordne die Klassiker der Ethnologie zeitlich ein. Ein Treffer zählt, wenn er höchstens " + tol + " Jahre danebenliegt.",
        start: 1860, end: 2000, tolerance: tol, items: G.shuffle(pick),
        explain: pick.map((w) => w.md + " (" + w.year + ")").join(", ") + ". Vom Evolutionismus des 19. Jahrhunderts über Feldforschung, Struktur und Bedeutung bis zur Kritik der eigenen Texte.",
      };
    },
  });
})();
