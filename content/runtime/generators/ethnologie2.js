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
