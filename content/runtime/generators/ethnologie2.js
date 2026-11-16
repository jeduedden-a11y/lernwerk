// Social and cultural anthropology in depth: statement pools on the history of theory and methods, and on present-day fields.
// Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  function gen(name, title, statements) {
    const byLevel = F.statements(statements, STMT);
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }

  gen("eth-theorien", "Theorien und Methoden", [
    { lv: 1, ok: true, md: "Edward Tylor definierte Kultur 1871 als komplexes Ganzes aus Wissen, Glauben, Kunst, Moral, Recht und Sitte.", why: "Seine Definition aus »Primitive Culture« gilt als erste wissenschaftliche Kulturdefinition." },
    { lv: 1, ok: true, md: "Franz Boas lehnte die Einteilung von Kulturen in Entwicklungsstufen ab und forderte, jede Kultur aus ihrer eigenen Geschichte zu verstehen.", why: "Das ist der historische Partikularismus; aus ihm erwuchs der Kulturrelativismus." },
    { lv: 1, ok: false, md: "Bronisław Malinowski entwickelte die teilnehmende Beobachtung bei einem kurzen Besuch auf den Trobriand-Inseln.", why: "Er blieb lange Zeit vor Ort, lernte die Sprache und lebte unter den Menschen; daraus entstand das Ideal der langen Feldforschung." },
    { lv: 2, ok: true, md: "Clifford Geertz versteht Kultur als Bedeutungsgewebe, das man wie einen Text deutet.", why: "Seine dichte Beschreibung erschließt die Bedeutungen hinter Handlungen." },
    { lv: 2, ok: true, md: "Emisch heißt: aus der Sicht der Beteiligten; etisch heißt: in den Begriffen der Beobachtenden.", why: "Kenneth Pike prägte die Unterscheidung nach phonemisch und phonetisch." },
    { lv: 2, ok: false, md: "Der Strukturfunktionalismus Radcliffe-Browns erklärt Institutionen vor allem aus individuellen Bedürfnissen.", why: "Das ist Malinowskis Funktionalismus. Radcliffe-Brown fragt, welchen Beitrag Institutionen zum Erhalt der sozialen Struktur leisten." },
    { lv: 3, ok: true, md: "Lévi-Strauss sucht hinter Mythen und Verwandtschaft universale Strukturen des Denkens, oft in binären Gegensätzen.", why: "Etwa roh und gekocht, Natur und Kultur." },
    { lv: 3, ok: true, md: "Informierte Einwilligung heißt, dass die Menschen im Feld wissen, worum es in der Forschung geht, und freiwillig zustimmen.", why: "Dazu gehören Anonymisierung, Schutz vor Schaden und das Recht, die Teilnahme zu beenden." },
    { lv: 3, ok: false, md: "»Writing Culture« (1986) forderte, Ethnographien möglichst objektiv und ohne die Stimme der Forschenden zu schreiben.", why: "Der Band zeigte gerade, dass Ethnographien auch literarische Konstruktionen sind, und forderte Reflexivität und Vielstimmigkeit." },
    { lv: 4, ok: true, md: "Eine multi-sited ethnography folgt Menschen, Dingen oder Ideen über mehrere Orte hinweg.", why: "George Marcus schlug sie 1995 für eine vernetzte, globalisierte Welt vor." },
    { lv: 4, ok: false, md: "Margaret Meads Samoa-Studie gilt seit Derek Freemans Kritik als vollständig bestätigt.", why: "Freeman warf ihr 1983 vor, Samoa idealisiert zu haben; die Debatte über Methoden und Deutungen hält an." },
  ]);

  gen("eth-gegenwart", "Felder der Gegenwart", [
    { lv: 1, ok: true, md: "Edward Said kritisierte mit »Orientalismus«, wie westliche Darstellungen den Orient als fremd, rückständig und unveränderlich konstruierten.", why: "Wissen über andere ist nach Said mit Macht verknüpft." },
    { lv: 1, ok: true, md: "Benedict Anderson beschreibt Nationen als vorgestellte Gemeinschaften.", why: "Ihre Mitglieder kennen sich nicht persönlich und fühlen sich dennoch verbunden, etwa durch Zeitungen und Sprache." },
    { lv: 1, ok: false, md: "Medizinethnologen unterscheiden nicht zwischen Krankheit als Befund und Kranksein als Erfahrung.", why: "Gerade das tun sie: disease ist der biomedizinische Befund, illness das erlebte Leiden mit seinen Bedeutungen (Kleinman)." },
    { lv: 2, ok: true, md: "Ein Big Man in Melanesien erwirbt seinen Status durch Geschick, Großzügigkeit und Anhänger; ein polynesischer Häuptling erbt ihn.", why: "So stellte Marshall Sahlins 1963 erworbenen und zugeschriebenen Status gegenüber." },
    { lv: 2, ok: true, md: "Talal Asad zeigte, wie die Ethnologie in koloniale Machtverhältnisse eingebunden war.", why: "Sein Sammelband von 1973 machte die Kolonialgeschichte des Fachs zum Thema." },
    { lv: 2, ok: false, md: "Die »Erfindung von Traditionen« bedeutet, dass alle Traditionen erfunden und deshalb wertlos sind.", why: "Hobsbawm und Ranger zeigen, dass manche als uralt geltende Traditionen jung sind; über ihren Wert sagt das nichts." },
    { lv: 3, ok: true, md: "Annette Weiner zeigte, dass Malinowski den Reichtum und die Macht der Frauen auf den Trobriand-Inseln übersehen hatte.", why: "Ihre Studie zu Bündeln aus Bananenblättern rückte weibliche Tauschsphären ins Licht." },
    { lv: 3, ok: true, md: "Philippe Descola unterscheidet vier Ontologien: Animismus, Totemismus, Analogismus und Naturalismus.", why: "Sie beschreiben, wie Menschen die Grenze zwischen sich und Nichtmenschen ziehen; der westliche Naturalismus ist nur eine davon." },
    { lv: 3, ok: false, md: "Die Manchester-Schule untersuchte ausschließlich abgelegene Dörfer ohne Kontakt zur Stadt.", why: "Gerade sie erforschte Städte und Arbeitsmigration im südlichen Afrika, etwa Clyde Mitchell mit dem Kalela-Tanz." },
    { lv: 4, ok: true, md: "Inszenierte Authentizität (MacCannell) beschreibt, wie Touristen ein »echtes« Hinterland suchen, das für sie hergerichtet wird.", why: "Die Suche nach dem Echten erzeugt selbst neue Inszenierungen." },
    { lv: 4, ok: false, md: "Digitale Ethnographie verzichtet auf teilnehmende Beobachtung, weil online alles messbar ist.", why: "Sie nimmt an Online-Gemeinschaften teil und verbindet das oft mit Forschung offline; Zahlen allein erklären keine Bedeutungen." },
  ]);
})();
/* Übungen zur Ethnologie (eth-ueben): Kreuz- und Parallelcousinen, Lineage-Zugehörigkeit, Heiratsregeln,
   Tauschformen nach Sahlins und Polanyi, Residenzregeln. Built on first use (load order). */
(function () {
  "use strict";
  const LW = window.LW;
  let engine = null;
  function init() {
  const T = {};
  const spec = (id, s) => { T[id] = s; };
  const choiceStep = (md, right, wrong, explain) => {
    const seen = new Set([right]);
    const opts = [{ md: right, correct: true }];
    wrong.forEach((w) => { if (!seen.has(w) && opts.length < 5) { seen.add(w); opts.push({ md: w }); } });
    return { type: "choice", md, options: opts, explain };
  };

  const PAR = [["Vater", "F", "seines", true], ["Mutter", "M", "ihrer", false]];
  const SIB = [["Bruder", "B", true], ["Schwester", "Z", false]];
  const KID = [["Sohn", "S", "Cousin"], ["Tochter", "D", "Cousine"]];
  spec("verwandte", { custom(level, G) {
    const [pn, pk, , pMale] = G.pick(PAR), [sn, sk, sMale] = G.pick(SIB), [kn, kk, kw] = G.pick(KID);
    const art = pn === "Vater" ? "deines Vaters" : "deiner Mutter";
    const rest = " " + kn + " " + (sMale ? "des Bruders " : "der Schwester ") + art + " (" + pk + sk + kk + ")";
    const desc = (kn === "Sohn" ? "der" : "die") + rest, acc = (kn === "Sohn" ? "den" : "die") + rest;
    const parallel = pMale === sMale;
    if (level <= 2) {
      const right = (parallel ? "Parallel" : "Kreuz") + kw.toLowerCase();
      return choiceStep("Wie nennt die Ethnologie " + acc + "?", right, [(parallel ? "Kreuz" : "Parallel") + kw.toLowerCase(), kn === "Sohn" ? "Neffe" : "Nichte", "Halb" + (kn === "Sohn" ? "bruder" : "schwester")],
        "Haben Elternteil und dessen Geschwister dasselbe Geschlecht (Bruder des Vaters, Schwester der Mutter), spricht man von **Parallel**cousins, sonst von **Kreuz**cousins. Hier: **" + right + "**.");
    }
    const sys = G.pick(["patrilinear", "matrilinear"]);
    const inLine = sys === "patrilinear" ? (pMale && sMale) : (!pMale && !sMale);
    const right = inLine ? "ja" : "nein";
    return choiceStep("In einer **" + sys + "en** Gesellschaft: Gehört " + desc + " zu deiner eigenen Lineage?", right, [inLine ? "nein" : "ja", "nur, wenn es ein Sohn ist"],
      sys === "patrilinear" ? "Patrilinear zählt nur die Linie über Männer: Kinder des Bruders des Vaters gehören dazu; die Kinder der Schwester des Vaters gehören zur Lineage ihres eigenen Vaters, die der Mutterseite zu anderen Lineages."
        : "Matrilinear zählt nur die Linie über Frauen: Kinder der Schwester der Mutter gehören dazu; die Kinder des Bruders der Mutter gehören zur Lineage ihrer eigenen Mutter.");
  } });

  const HEIRAT = [
    ["Man muss außerhalb der eigenen Lineage heiraten.", "Exogamie"], ["Man heiratet innerhalb der eigenen Kaste.", "Endogamie"],
    ["Ein Mann ist mit mehreren Frauen zugleich verheiratet.", "Polygynie"], ["Eine Frau ist mit mehreren Männern zugleich verheiratet, oft mit Brüdern.", "Polyandrie"],
    ["Die Familie des Bräutigams überträgt Vieh an die Familie der Braut, oft mit Rechten an den Kindern.", "Brautpreis"],
    ["Die Braut bringt Vermögen ihrer Familie in die Ehe mit.", "Mitgift"],
    ["Stirbt ein Mann, heiratet sein Bruder die Witwe.", "Levirat"], ["Stirbt eine Frau, heiratet ihr Witwer ihre Schwester.", "Sororat"]];
  spec("heirat", { custom(level, G) {
    const [txt, name] = G.pick(level <= 1 ? HEIRAT.slice(0, 6) : HEIRAT);
    return choiceStep("Wie heißt diese Regel oder Leistung? " + txt, name, G.shuffle(HEIRAT.map((x) => x[1]).filter((n) => n !== name)).slice(0, 3),
      "**" + name + "**. Heiratsregeln und -leistungen verbinden Gruppen; Lévi-Strauss sah in der Heirat einen Tausch, der Allianzen stiftet.");
  } });

  const SAHLINS = [
    ["Eltern versorgen ihre Kinder, ohne je eine Rechnung aufzumachen.", "generalisierte Reziprozität"],
    ["In einer Wildbeutergruppe wird erlegtes Wild unter allen geteilt.", "generalisierte Reziprozität"],
    ["Nachbarn tauschen Geschenke von ungefähr gleichem Wert, ohne große Verzögerung.", "ausgeglichene Reziprozität"],
    ["Zwei Dörfer tauschen bei einem Fest Yams gegen Fisch in festen Mengen.", "ausgeglichene Reziprozität"],
    ["Ein Händler versucht, einem Fremden möglichst viel abzuhandeln.", "negative Reziprozität"],
    ["Bei einem Viehraub nimmt man einer fremden Gruppe Tiere weg.", "negative Reziprozität"]];
  const POLANYI = [
    ["Ein Häuptling sammelt Ernteanteile und verteilt sie bei einem Fest.", "Redistribution"],
    ["Der Staat erhebt Steuern und finanziert damit Renten.", "Redistribution"],
    ["Auf einem Wochenmarkt bestimmen Angebot und Nachfrage den Preis.", "Marktaustausch"],
    ["Verwandte helfen einander beim Hausbau und erwarten später Hilfe zurück.", "Reziprozität"]];
  spec("tausch", { custom(level, G) {
    if (level <= 2) {
      const [txt, name] = G.pick(SAHLINS);
      return choiceStep("Welche Form der Reziprozität nach Sahlins liegt vor? " + txt, name, ["generalisierte Reziprozität", "ausgeglichene Reziprozität", "negative Reziprozität"].filter((n) => n !== name),
        "Sahlins ordnet Reziprozität nach sozialer Nähe: **generalisiert** bei engen Beziehungen ohne Aufrechnung, **ausgeglichen** bei mittlerer Distanz mit gleichwertiger Gegengabe, **negativ** gegenüber Fremden, wenn jeder auf seinen Vorteil aus ist.");
    }
    const [txt, name] = G.pick(POLANYI);
    return choiceStep("Welche Integrationsform nach Polanyi liegt vor? " + txt, name, ["Reziprozität", "Redistribution", "Marktaustausch"].filter((n) => n !== name),
      "Polanyi: **Reziprozität** zwischen Gleichgestellten, **Redistribution** über ein Zentrum, das sammelt und verteilt, **Marktaustausch** zu Preisen.");
  } });

  const RES = [["Das Paar zieht zur Familie des Mannes.", "patrilokal (virilokal)"], ["Das Paar zieht zur Familie der Frau.", "matrilokal (uxorilokal)"],
    ["Das Paar gründet einen eigenen Haushalt an einem neuen Ort.", "neolokal"], ["Das Paar zieht zum Bruder der Mutter des Mannes.", "avunkulokal"]];
  spec("residenz", { custom(level, G) {
    const [txt, name] = G.pick(level <= 1 ? RES.slice(0, 3) : RES);
    return choiceStep("Welche Residenzregel liegt vor? " + txt, name, RES.map((x) => x[1]).filter((n) => n !== name),
      "**" + name + "**. Wohnregeln nach der Heirat passen oft zur Abstammung: avunkulokal etwa in matrilinearen Gesellschaften, wo der Mutterbruder Autorität hat.");
  } });

  LW.ethnoTypen = T;
  return LW.rechenEngine(T);
  }
  const make = (level, G, params) => (engine || (engine = init()))(level, G, params);
  LW.generator("eth-ueben", { title: "Ethnologie üben", make });
  const chapter = (typ) => ({ title: "Ethnologie üben", make: (level, G) => make(level, G, { typ }) });
  LW.generator("eth-u-verwandtschaft", chapter(["verwandte", "heirat", "residenz"]));
  LW.generator("eth-u-tausch", chapter(["tausch"]));
})();
