// More tasks for the ethnology generators: pools of statements (with the reason why they hold or not) and term
// pairs. LW.forms turns them into true/false, multiple choice, "find the false statement", sorting and matching
// tasks; lv marks the lowest level an entry suits. Written in own words after the usual introductions to the field.
(function () {
  const F = LW.forms;
  // one plan for all topics: easy recognition first, then sorting and choosing, then several statements at once
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  const PAIR = { 1: ["match"], 2: ["choice"], 3: ["reverse"], 4: ["match"] };
  function topic(gen, statements, pairs, o) {
    LW.extend(gen, F.statements(statements, STMT, o));
    if (pairs) LW.extend(gen, F.pairs(pairs, PAIR, o));
  }

  topic("eth-gabe", [
    { lv: 1, ok: true, md: "Nach Marcel Mauss gehören zur Gabe drei Pflichten: geben, annehmen und erwidern.", why: "So beschreibt Mauss den Kreislauf der Gabe in seinem Essay von 1925." },
    { lv: 1, ok: true, md: "Im Kula-Tausch wandern Halsketten und Armreifen in entgegengesetzte Richtungen von Insel zu Insel.", why: "Halsketten kreisen im Uhrzeigersinn, Armreifen gegen ihn." },
    { lv: 1, ok: false, md: "Eine Gabe ist nach Mauss völlig freiwillig und verpflichtet zu nichts.", why: "Mauss betont gerade die Verpflichtung: Wer annimmt, steht in der Schuld und muss erwidern." },
    { lv: 2, ok: false, md: "Kula-Wertgegenstände werden vor allem gegen Lebensmittel eingetauscht.", why: "Kula-Gegenstände tauscht man nur gegeneinander. Alltagsgüter wechseln nebenbei im gewöhnlichen Handel den Besitzer." },
    { lv: 2, ok: true, md: "Beim Potlatch an der Nordwestküste Nordamerikas gewinnt Ansehen, wer besonders viel verteilt.", why: "Großzügigkeit schafft Rang, und die Gäste werden zu Schuldnern." },
    { lv: 2, ok: true, md: "Wer eine Gabe nicht erwidern kann, gerät leicht in eine untergeordnete Stellung.", why: "Unerwiderte Gaben schaffen Abhängigkeit und Rangunterschiede." },
    { lv: 2, ok: false, md: "Wer im Kula eine Halskette erhält, behält sie sein Leben lang.", why: "Kula-Gegenstände gibt man nach einer Weile weiter. Man besitzt sie nur auf Zeit." },
    { lv: 3, ok: true, md: "Marshall Sahlins unterscheidet generalisierte, ausgeglichene und negative Reziprozität.", why: "Die drei Formen reichen vom Teilen ohne Abrechnung bis zum Versuch, etwas ohne Gegenleistung zu bekommen." },
    { lv: 3, ok: false, md: "Generalisierte Reziprozität findet man vor allem zwischen Fremden.", why: "Sie herrscht im engen Kreis, etwa in der Familie. Zwischen Fremden ist negative Reziprozität häufiger." },
    { lv: 3, ok: true, md: "Mauss nennt die Gabe ein »totales soziales Phänomen«, weil sie Wirtschaft, Recht, Religion und Moral zugleich berührt.", why: "In einer Gabe stecken immer mehrere Bereiche des Lebens auf einmal." },
    { lv: 3, ok: false, md: "Eine sofortige, genau gleichwertige Gegengabe stärkt eine Beziehung am meisten.", why: "Wer sofort exakt zurückzahlt, schließt die Rechnung und beendet eher die Beziehung. Zeitabstand hält sie offen." },
    { lv: 4, ok: true, md: "Annette Weiner zeigte, dass manche Dinge Macht verleihen, gerade weil man sie behält, während man anderes verschenkt.", why: "Sie spricht von unveräußerlichem Besitz, der Rang über Generationen sichert." },
    { lv: 4, ok: false, md: "In Marktgesellschaften ist der Gabentausch vollständig verschwunden.", why: "Geschenke, Einladungen oder Spenden folgen weiter der Logik von Gabe und Gegengabe." },
    { lv: 4, ok: true, md: "Mauss deutete den Māori-Begriff hau als Kraft der Gabe, die zum Geber zurückdrängt.", why: "Spätere Ethnologen kritisierten diese Deutung als zu frei, sie blieb aber einflussreich." },
    { lv: 4, ok: false, md: "Malinowski deutete den Kula als Tausch, der vor allem die Versorgung mit knappen Gütern sichert.", why: "Malinowski zeigte, dass es im Kula um Ansehen, Bündnisse und Ruhm geht, nicht um Versorgung." },
  ], [
    { lv: 1, a: "Generalisierte Reziprozität", b: "Geben ohne Abrechnung, etwa in der Familie" },
    { lv: 1, a: "Ausgeglichene Reziprozität", b: "Gleichwertige Gegengabe in absehbarer Zeit" },
    { lv: 1, a: "Negative Reziprozität", b: "Etwas bekommen wollen, ohne selbst zu geben" },
    { lv: 1, a: "Potlatch", b: "Fest, bei dem Ansehen durch Verteilen entsteht" },
    { lv: 2, a: "Kula", b: "Ringtausch von Halsketten und Armreifen zwischen Inseln" },
    { lv: 3, a: "Hau", b: "Bei Mauss die Kraft der Gabe, die zum Geber zurückwill" },
    { lv: 4, a: "Unveräußerlicher Besitz", b: "Dinge, die man behält, um Rang zu sichern" },
  ]);

  topic("eth-kultur", [
    { lv: 1, ok: true, md: "Kultur wird gelernt und nicht biologisch vererbt.", why: "Kinder wachsen durch Enkulturation in Sprache, Gewohnheiten und Werte hinein." },
    { lv: 1, ok: false, md: "Welche Sprache ein Kind spricht, ist in seinen Genen festgelegt.", why: "Gene schaffen die Fähigkeit zur Sprache. Welche Sprache es wird, hängt davon ab, wo das Kind aufwächst." },
    { lv: 1, ok: true, md: "Edward B. Tylor beschrieb Kultur 1871 als komplexes Ganzes aus Wissen, Glauben, Kunst, Moral, Recht und Sitte.", why: "Das ist die erste viel zitierte ethnologische Definition." },
    { lv: 2, ok: true, md: "Clifford Geertz versteht Kultur als selbstgesponnenes Bedeutungsgewebe, das man deuten muss.", why: "Deshalb fordert er eine deutende, interpretierende Ethnologie." },
    { lv: 2, ok: false, md: "Geertz' »dichte Beschreibung« meint möglichst viele Messwerte über eine Handlung.", why: "Gemeint ist eine Beschreibung, die erfasst, was eine Handlung für die Beteiligten bedeutet." },
    { lv: 2, ok: true, md: "Enkulturation bezeichnet das Hineinwachsen in die eigene Kultur.", why: "Sie geschieht vor allem in Kindheit und Jugend, durch Nachahmen, Erziehung und Alltag." },
    { lv: 3, ok: false, md: "Kulturen sind klar abgegrenzte Einheiten, die sich kaum verändern.", why: "Heute betont man Austausch, Wandel und innere Vielfalt. Das Bild der geschlossenen Kultur gilt als überholt." },
    { lv: 3, ok: true, md: "Auch innerhalb einer Gesellschaft teilen nicht alle dieselben Vorstellungen.", why: "Alter, Geschlecht, Stellung und Erfahrung machen Unterschiede. Kultur ist geteilt, aber nie einheitlich." },
    { lv: 3, ok: true, md: "Franz Boas betonte, dass jede Kultur aus ihrer eigenen Geschichte heraus zu verstehen ist.", why: "Damit wandte er sich gegen Stufenmodelle, die alle Gesellschaften auf einer Leiter anordnen." },
    { lv: 3, ok: false, md: "Tylor stellte alle Gesellschaften gleichrangig nebeneinander.", why: "Tylor dachte in Entwicklungsstufen und ordnete Gesellschaften von »einfach« bis »zivilisiert«." },
    { lv: 4, ok: true, md: "Der Kulturbegriff kann politisch benutzt werden, um Gruppen als unveränderlich anders darzustellen.", why: "Wer Konflikte allein mit »Kultur« erklärt, blendet Geschichte, Macht und Wirtschaft aus." },
    { lv: 4, ok: false, md: "Wer Kultur als Bedeutungssystem versteht, braucht keine Feldforschung, weil man Bedeutungen aus Büchern ablesen kann.", why: "Bedeutungen zeigen sich in Praxis und Gesprächen. Gerade dafür braucht es teilnehmende Beobachtung." },
    { lv: 4, ok: true, md: "Hybridität beschreibt, dass kulturelle Formen aus Mischungen und Neukombinationen entstehen.", why: "Musik, Küche oder Religion verbinden oft Elemente verschiedener Herkunft." },
    { lv: 4, ok: false, md: "Akkulturation heißt, dass eine Gruppe ihre Kultur vollständig verliert.", why: "Akkulturation meint Wandel durch Kontakt. Dabei wird übernommen, umgedeutet und verbunden, nicht einfach ersetzt." },
  ], [
    { lv: 1, a: "Tylor", b: "Kultur als komplexes Ganzes" },
    { lv: 1, a: "Geertz", b: "Kultur als Bedeutungsgewebe" },
    { lv: 1, a: "Boas", b: "Jede Kultur aus ihrer eigenen Geschichte verstehen" },
    { lv: 2, a: "Enkulturation", b: "Hineinwachsen in die eigene Kultur" },
    { lv: 2, a: "Akkulturation", b: "Wandel durch Kontakt mit anderen Kulturen" },
    { lv: 3, a: "Hybridität", b: "Neue Formen aus Mischung" },
    { lv: 3, a: "Dichte Beschreibung", b: "Handlung samt ihrer Bedeutung beschreiben" },
  ]);

  topic("eth-relativismus", [
    { lv: 1, ok: true, md: "Ethnozentrismus heißt, andere Kulturen am Maßstab der eigenen zu messen.", why: "Die eigene Lebensweise erscheint dann als normal, alles andere als Abweichung." },
    { lv: 1, ok: false, md: "Kulturrelativismus bedeutet, dass man über nichts mehr urteilen darf.", why: "Methodisch heißt er nur: erst verstehen, dann urteilen. Moralische Urteile bleiben möglich." },
    { lv: 1, ok: true, md: "Ethnozentrismus gibt es in allen Gesellschaften, nicht nur im Westen.", why: "Fast jede Gruppe hält die eigenen Gewohnheiten für die selbstverständlichen." },
    { lv: 2, ok: true, md: "Methodischer Kulturrelativismus verlangt, eine Praxis zuerst aus ihrem Zusammenhang zu verstehen.", why: "Er ist ein Werkzeug der Forschung, kein Urteil über richtig und falsch." },
    { lv: 2, ok: true, md: "Die Sicht der Beteiligten nennt man emisch, eine Beschreibung mit Begriffen von außen etisch.", why: "Beide Perspektiven ergänzen sich in der Forschung." },
    { lv: 2, ok: false, md: "Kulturrelativismus wurde vor allem von Bronisław Malinowski geprägt.", why: "Geprägt wurde er in der Schule von Franz Boas, etwa von Melville Herskovits." },
    { lv: 3, ok: true, md: "1947 warnte die American Anthropological Association, eine Menschenrechtserklärung dürfe nicht nur westliche Werte ausdrücken.", why: "Die Stellungnahme ist bis heute ein Bezugspunkt der Debatte um Universalismus." },
    { lv: 3, ok: false, md: "Ethischer und methodischer Kulturrelativismus sind dasselbe.", why: "Der methodische ist ein Forschungsgrundsatz. Der ethische behauptet, Werte gälten nur innerhalb einer Kultur." },
    { lv: 3, ok: true, md: "Wer Kulturrelativismus absolut setzt, übersieht leicht Kritik von innen, etwa durch Frauenbewegungen vor Ort.", why: "Auch innerhalb einer Gesellschaft werden Praktiken umstritten und verändert." },
    { lv: 4, ok: false, md: "Kulturrelativismus und universelle Menschenrechte schließen sich vollständig aus.", why: "Viele verbinden beides: Rechte gelten für alle, ihre Umsetzung wird im lokalen Zusammenhang verhandelt." },
    { lv: 4, ok: true, md: "Auch der Blick der Forscherin ist kulturell geprägt, deshalb gehört Selbstreflexion zur Methode.", why: "Wer die eigenen Selbstverständlichkeiten nicht kennt, hält sie leicht für allgemein gültig." },
    { lv: 4, ok: false, md: "Die emische Sicht ist immer die wahre, die etische immer verzerrt.", why: "Die emische zeigt Bedeutungen, die etische erlaubt Vergleiche. Erst zusammen ergeben sie ein Bild." },
  ], [
    { lv: 1, a: "Ethnozentrismus", b: "Fremdes am eigenen Maßstab messen" },
    { lv: 1, a: "Methodischer Relativismus", b: "Erst aus dem Zusammenhang verstehen, dann urteilen" },
    { lv: 2, a: "Ethischer Relativismus", b: "Werte gelten nur innerhalb einer Kultur" },
    { lv: 2, a: "Universalismus", b: "Bestimmte Werte gelten für alle Menschen" },
    { lv: 3, a: "Emisch", b: "Sicht und Begriffe der Beteiligten" },
    { lv: 3, a: "Etisch", b: "Begriffe von außen, die Vergleiche erlauben" },
  ]);

  topic("eth-methode", [
    { lv: 1, ok: true, md: "Teilnehmende Beobachtung heißt, über lange Zeit am Alltag der Menschen teilzunehmen.", why: "Erst das lange Mitleben zeigt, wie Dinge wirklich ablaufen." },
    { lv: 1, ok: false, md: "Ethnologische Feldforschung dauert in der Regel nur wenige Tage.", why: "Klassische Feldforschung dauert oft ein Jahr oder länger." },
    { lv: 1, ok: true, md: "Bronisław Malinowski gilt als Begründer der modernen Feldforschung.", why: "Er lebte während des Ersten Weltkriegs lange auf den Trobriand-Inseln." },
    { lv: 2, ok: true, md: "Ein Feldtagebuch hält Beobachtungen, Gespräche und eigene Eindrücke fest.", why: "Aus diesen Notizen entsteht später die Ethnographie." },
    { lv: 2, ok: false, md: "Gute Feldforschung kommt ohne die Sprache der Menschen aus, ein Dolmetscher genügt.", why: "Die Sprache zu lernen gilt als zentral, sonst gehen Bedeutungen verloren." },
    { lv: 2, ok: true, md: "Personen, die den Zugang zu einer Gruppe öffnen, nennt man Türöffner oder Gatekeeper.", why: "Über sie kommt man in Kontakt, sie prägen aber auch, wen man trifft." },
    { lv: 3, ok: true, md: "Informierte Einwilligung heißt: Die Beteiligten wissen, wozu geforscht wird, und stimmen zu.", why: "Das ist ein Grundsatz der Forschungsethik." },
    { lv: 3, ok: false, md: "Gesprächspartner werden immer mit vollem Namen genannt, damit die Forschung überprüfbar bleibt.", why: "Zum Schutz werden Personen und Orte oft anonymisiert." },
    { lv: 3, ok: true, md: "Die Anwesenheit der Forscherin verändert die Situation, die sie beobachtet.", why: "Deshalb gehört die eigene Rolle zur Analyse dazu." },
    { lv: 4, ok: false, md: "Wer nur mit dem Dorfvorsteher spricht, erhält ein vollständiges Bild der Gemeinschaft.", why: "Er vertritt eine bestimmte Position. Frauen, Jüngere oder Randgruppen sehen vieles anders." },
    { lv: 4, ok: true, md: "Mehrortige Ethnographie folgt Menschen, Dingen oder Ideen über mehrere Orte hinweg.", why: "So lassen sich etwa Migration oder Warenketten untersuchen." },
    { lv: 4, ok: false, md: "Zahlen und Zählungen haben in der Ethnologie keinen Platz.", why: "Haushaltszählungen, Netzwerkdaten oder Umfragen ergänzen die Beobachtung oft." },
    { lv: 4, ok: true, md: "Malinowskis später veröffentlichte Tagebücher zeigten Frust und Vorurteile und belebten die Debatte über Reflexivität.", why: "Sie machten sichtbar, wie persönlich und widersprüchlich Feldforschung ist." },
  ], [
    { lv: 1, a: "Teilnehmende Beobachtung", b: "Langes Mitleben im Alltag" },
    { lv: 1, a: "Feldtagebuch", b: "Notizen über Beobachtungen und Eindrücke" },
    { lv: 2, a: "Leitfadeninterview", b: "Gespräch entlang vorbereiteter, offener Fragen" },
    { lv: 2, a: "Informierte Einwilligung", b: "Zustimmung nach Aufklärung über die Forschung" },
    { lv: 3, a: "Mehrortige Ethnographie", b: "Forschung an mehreren verbundenen Orten" },
    { lv: 3, a: "Reflexivität", b: "Die eigene Rolle im Feld mitdenken" },
  ]);

  topic("eth-heirat", [
    { lv: 1, ok: true, md: "Exogamie bedeutet, außerhalb der eigenen Gruppe zu heiraten.", why: "Die Gruppe kann etwa ein Clan oder eine Abstammungslinie sein." },
    { lv: 1, ok: false, md: "Endogamie bedeutet, außerhalb der eigenen Gruppe zu heiraten.", why: "Endogamie ist die Heirat innerhalb der eigenen Gruppe, etwa innerhalb einer Kaste." },
    { lv: 1, ok: true, md: "Polygynie heißt, dass ein Mann mit mehreren Frauen zugleich verheiratet ist.", why: "Sie ist in vielen Gesellschaften erlaubt, aber meist nicht die Regel." },
    { lv: 2, ok: true, md: "Beim Brautpreis gehen Güter von der Familie des Bräutigams an die Familie der Braut.", why: "Er bestätigt die Ehe und schafft Rechte, etwa über die Kinder." },
    { lv: 2, ok: false, md: "Mitgift und Brautpreis bezeichnen dasselbe.", why: "Die Mitgift bringt die Braut aus ihrer Familie mit. Der Brautpreis fließt zur Familie der Braut." },
    { lv: 2, ok: true, md: "Lebt ein Paar nach der Heirat bei der Familie des Mannes, spricht man von Patrilokalität.", why: "Bei der Familie der Frau wäre es Matrilokalität, in einem eigenen Haushalt Neolokalität." },
    { lv: 3, ok: true, md: "Nach Lévi-Strauss schafft das Inzesttabu Bündnisse, weil es zum Heiraten nach außen zwingt.", why: "Heirat wird so zum Tausch zwischen Gruppen." },
    { lv: 3, ok: false, md: "Verallgemeinerter Tausch heißt, dass zwei Gruppen direkt Ehepartner miteinander tauschen.", why: "Das ist eingeschränkter Tausch. Beim verallgemeinerten gibt A an B, B an C und so weiter im Kreis." },
    { lv: 3, ok: true, md: "Levirat heißt, dass eine Witwe einen Bruder ihres verstorbenen Mannes heiratet.", why: "So bleiben die Witwe und ihre Kinder in der Familie des Mannes." },
    { lv: 3, ok: false, md: "Die Ehe einer Frau mit mehreren Männern ist weltweit die häufigste Eheform.", why: "Polyandrie ist selten, etwa im Himalaya. Weit häufiger erlaubt ist Polygynie." },
    { lv: 4, ok: true, md: "Gayle Rubin kritisierte, dass Frauen in Lévi-Strauss' Modell nur als getauschte Objekte vorkommen.", why: "Ihr Aufsatz von 1975 wurde ein Grundtext der feministischen Ethnologie." },
    { lv: 4, ok: false, md: "Brautpreis bedeutet, dass eine Frau wie eine Ware gekauft wird.", why: "Er schafft Rechte und Pflichten zwischen Familien und kann zurückgefordert werden. Zur Ware wird die Frau dadurch nicht." },
    { lv: 4, ok: true, md: "Heirat verbindet nicht nur zwei Menschen, sondern auch Verwandtschaftsgruppen mit Rechten und Pflichten.", why: "Darum verhandeln oft ganze Familien über eine Ehe." },
  ], [
    { lv: 1, a: "Exogamie", b: "Heirat außerhalb der eigenen Gruppe" },
    { lv: 1, a: "Endogamie", b: "Heirat innerhalb der eigenen Gruppe" },
    { lv: 1, a: "Brautpreis", b: "Güter an die Familie der Braut" },
    { lv: 2, a: "Mitgift", b: "Güter, die die Braut mitbringt" },
    { lv: 2, a: "Levirat", b: "Witwe heiratet den Bruder des Verstorbenen" },
    { lv: 3, a: "Sororat", b: "Witwer heiratet die Schwester der Verstorbenen" },
    { lv: 3, a: "Neolokalität", b: "Paar gründet einen eigenen Haushalt" },
  ]);

  topic("eth-ritual", [
    { lv: 1, ok: true, md: "Übergangsriten haben nach van Gennep drei Phasen: Trennung, Schwelle, Angliederung.", why: "Das Modell stammt aus seinem Buch »Les rites de passage« von 1909." },
    { lv: 1, ok: false, md: "In der Schwellenphase haben die Beteiligten ihren neuen Status schon erreicht.", why: "In der Schwelle sind sie weder das Alte noch das Neue. Den neuen Status bekommen sie bei der Angliederung." },
    { lv: 1, ok: true, md: "Auch eine Hochzeit lässt sich als Übergangsritus deuten.", why: "Das Paar löst sich aus dem alten Status und wird als Ehepaar neu aufgenommen." },
    { lv: 2, ok: true, md: "Victor Turner nennt die Schwellenphase liminal: weder hier noch dort.", why: "Liminalität beschreibt diesen Zustand des Dazwischen." },
    { lv: 2, ok: false, md: "Rituale gibt es nur in religiösen Zusammenhängen.", why: "Auch Schulabschlüsse, Vereidigungen oder Geburtstagsfeiern sind Rituale." },
    { lv: 2, ok: true, md: "Bei Initiationen werden Novizen oft abgesondert, und man nimmt ihnen Kleidung, Schmuck oder Namen.", why: "Das markiert die Trennung vom alten Status." },
    { lv: 3, ok: true, md: "Communitas bezeichnet bei Turner das Gemeinschaftsgefühl unter Gleichen in der Schwellenphase.", why: "Rangunterschiede sind dann für eine Zeit aufgehoben." },
    { lv: 3, ok: false, md: "Communitas entsteht nach Turner vor allem durch feste Rangordnungen.", why: "Sie entsteht gerade dann, wenn Rangunterschiede aufgehoben sind." },
    { lv: 3, ok: true, md: "Émile Durkheim sah in gemeinsamen Ritualen eine Quelle des Zusammenhalts.", why: "Im Ritual erlebt sich die Gruppe als Gemeinschaft." },
    { lv: 4, ok: false, md: "Van Gennep untersuchte nur Lebensübergänge wie Geburt und Tod, nicht Orts- oder Jahreswechsel.", why: "Er bezog auch räumliche Übergänge und den Jahreslauf ein." },
    { lv: 4, ok: true, md: "Rituale stellen soziale Ordnung nicht nur dar, sie können sie auch verändern.", why: "Rollen werden im Ritual neu verteilt oder für eine Zeit umgekehrt." },
    { lv: 4, ok: true, md: "Turner verstand rituelle Symbole als mehrdeutig: Ein Symbol bündelt viele Bedeutungen zugleich.", why: "Er zeigte das etwa am Milchbaum der Ndembu." },
    { lv: 4, ok: false, md: "Ein Ritual wirkt nur, wenn alle Teilnehmenden seine Bedeutung genau erklären können.", why: "Rituale wirken auch durch Handlung, Rhythmus und gemeinsame Erfahrung." },
  ], [
    { lv: 1, a: "Trennung", b: "Lösung aus dem alten Status" },
    { lv: 1, a: "Schwelle", b: "Zwischenzustand, weder alt noch neu" },
    { lv: 1, a: "Angliederung", b: "Aufnahme in den neuen Status" },
    { lv: 2, a: "Liminalität", b: "Zustand des Dazwischen" },
    { lv: 3, a: "Communitas", b: "Gemeinschaft unter Gleichen in der Schwelle" },
    { lv: 3, a: "Kollektive Efferveszenz", b: "Gemeinsame Erregung im Ritual nach Durkheim" },
  ]);

  topic("eth-religion", [
    { lv: 1, ok: true, md: "Durkheim unterscheidet zwischen dem Heiligen und dem Profanen.", why: "Das Heilige ist abgesondert und geschützt, das Profane alltäglich." },
    { lv: 1, ok: false, md: "Für Durkheim ist Religion eine reine Privatsache einzelner Menschen.", why: "Für ihn ist Religion zutiefst sozial: Sie verbindet eine Gemeinschaft." },
    { lv: 1, ok: true, md: "Tylor bestimmte Religion als Glauben an geistige Wesen und nannte das Animismus.", why: "Das ist seine sogenannte Minimaldefinition von Religion." },
    { lv: 2, ok: true, md: "Bei den Azande erklärt Hexerei, warum ein Unglück gerade diese Person zu diesem Zeitpunkt trifft.", why: "Die natürliche Ursache bestreiten die Azande nicht. Hexerei beantwortet die Frage nach dem Warum gerade jetzt." },
    { lv: 2, ok: false, md: "Die Azande wussten nicht, dass Termiten Holzpfosten zerfressen können.", why: "Sie wussten es genau. Hexerei erklärt nur, warum der Speicher einstürzte, als gerade jemand darunter saß." },
    { lv: 2, ok: true, md: "James Frazer unterschied Magie, die auf Ähnlichkeit beruht, und Magie, die auf Berührung beruht.", why: "Zusammen nannte er sie sympathetische Magie." },
    { lv: 3, ok: true, md: "Beim Giftorakel der Azande gibt man einem Huhn Gift und deutet, ob es überlebt.", why: "So werden Fragen, etwa nach einem Hexer, entschieden." },
    { lv: 3, ok: false, md: "Evans-Pritchard hielt das Denken der Azande über Hexerei für unlogisch.", why: "Er zeigte, dass das System in sich schlüssig ist und Zweifel auffangen kann." },
    { lv: 3, ok: true, md: "Geertz versteht Religion als kulturelles System von Symbolen, das Stimmungen und Motivationen erzeugt.", why: "Religion gibt der Welt eine Ordnung, die sich wirklich anfühlt." },
    { lv: 3, ok: true, md: "Ein Totem ist bei Durkheim das Sinnbild einer Gruppe, in dem sie sich selbst verehrt.", why: "Durkheim entwickelte das am Beispiel australischer Gesellschaften." },
    { lv: 4, ok: false, md: "Frazers Abfolge von Magie über Religion zur Wissenschaft gilt heute als belegt.", why: "Sie gilt als überholtes Stufenmodell. Magie, Religion und Wissenschaft bestehen nebeneinander." },
    { lv: 4, ok: true, md: "Schamanen gelten in vielen Gesellschaften als Mittler zwischen Menschen und Geistern, oft in Trance.", why: "Sie heilen, deuten und reisen nach dortigem Verständnis in andere Welten." },
    { lv: 4, ok: false, md: "Mana bezeichnet in Ozeanien einen persönlichen Gott.", why: "Mana ist eine unpersönliche Wirkkraft, die Menschen und Dingen innewohnen kann." },
    { lv: 4, ok: true, md: "Hexereivorwürfe können soziale Spannungen sichtbar machen, etwa Neid unter Nachbarn.", why: "Wer wen beschuldigt, zeigt Konflikte in einer Gemeinschaft." },
  ], [
    { lv: 1, a: "Animismus", b: "Glaube an geistige Wesen" },
    { lv: 1, a: "Heilig und profan", b: "Grundunterscheidung der Religion nach Durkheim" },
    { lv: 2, a: "Sympathetische Magie", b: "Wirkung durch Ähnlichkeit oder Berührung" },
    { lv: 2, a: "Giftorakel", b: "Befragung bei den Azande mithilfe eines Huhns" },
    { lv: 3, a: "Mana", b: "Unpersönliche Wirkkraft in Ozeanien" },
    { lv: 3, a: "Tabu", b: "Verbot, dessen Bruch Gefahr bringt" },
  ]);

  topic("eth-politik", [
    { lv: 1, ok: true, md: "Ein Big Man in Melanesien gewinnt Einfluss durch Großzügigkeit, nicht durch ein vererbtes Amt.", why: "Er muss sein Ansehen durch Feste und Gaben immer neu verdienen." },
    { lv: 1, ok: false, md: "Gesellschaften ohne Staat haben keine politische Ordnung.", why: "Auch ohne Staat regeln Verwandtschaft, Ältestenräte und Vermittler das Zusammenleben." },
    { lv: 1, ok: true, md: "In einem Häuptlingstum gibt es ein erbliches Amt, das Güter sammelt und verteilt.", why: "Das unterscheidet es vom Big-Man-System." },
    { lv: 2, ok: true, md: "Bei den Nuer schließen sich Abstammungsgruppen je nach Konflikt zu größeren Einheiten zusammen.", why: "Das nennt man segmentäre Ordnung." },
    { lv: 2, ok: false, md: "Ein Big Man kann seine Stellung einfach an seinen Sohn vererben.", why: "Die Stellung muss jeder selbst erwerben." },
    { lv: 2, ok: true, md: "Elman Service ordnete politische Formen als Horde, Stamm, Häuptlingstum und Staat.", why: "Diese Typologie war lange einflussreich, ist aber umstritten." },
    { lv: 3, ok: true, md: "Der Leopardenfellhäuptling der Nuer vermittelt bei Blutfehden, hat aber keine Befehlsgewalt.", why: "Er bietet einen geschützten Ort und schlägt einen Ausgleich vor." },
    { lv: 3, ok: false, md: "Segmentäre Ordnung heißt, dass eine Zentralregierung das Land in Bezirke einteilt.", why: "Segmentär heißt: Gleichrangige Gruppen verbünden sich je nach Lage. Eine Zentrale gibt es nicht." },
    { lv: 3, ok: true, md: "Max Weber unterscheidet legale, traditionale und charismatische Herrschaft.", why: "Die drei Typen beschreiben, warum Menschen Herrschaft als berechtigt ansehen." },
    { lv: 4, ok: true, md: "Pierre Clastres deutete manche Gesellschaften so, dass sie die Entstehung eines Staates aktiv verhindern.", why: "Anführer haben dort Ansehen, aber keine Zwangsgewalt." },
    { lv: 4, ok: false, md: "Fehden sind ein Zeichen dafür, dass jede Ordnung zusammengebrochen ist.", why: "Fehden folgen Regeln, etwa beim Ausgleich durch Vieh, und können Ordnung sogar stabilisieren." },
    { lv: 4, ok: false, md: "Charismatische Herrschaft beruht auf schriftlich festgelegten Regeln.", why: "Das ist legale Herrschaft. Charismatische ruht auf dem Glauben an die außergewöhnlichen Fähigkeiten einer Person." },
    { lv: 4, ok: true, md: "Die Stufenfolge von Horde bis Staat wird heute als zu geradlinig kritisiert.", why: "Gesellschaften wechseln auch zwischen Formen hin und her." },
  ], [
    { lv: 1, a: "Big Man", b: "Einfluss durch Gaben und Feste, nicht erblich" },
    { lv: 1, a: "Häuptlingstum", b: "Erbliches Amt mit Umverteilung von Gütern" },
    { lv: 2, a: "Segmentäre Ordnung", b: "Gruppen verbünden sich je nach Konflikt" },
    { lv: 2, a: "Leopardenfellhäuptling", b: "Vermittler bei Fehden der Nuer" },
    { lv: 3, a: "Charismatische Herrschaft", b: "Gefolgschaft wegen außergewöhnlicher Ausstrahlung" },
    { lv: 3, a: "Legale Herrschaft", b: "Geltung durch festgelegte Regeln" },
  ]);

  topic("eth-ethnizitaet", [
    { lv: 1, ok: true, md: "Ethnizität beruht auf Selbstzuschreibung und auf Zuschreibung durch andere.", why: "Wer dazugehört, entscheidet sich im Wechselspiel beider Seiten." },
    { lv: 1, ok: false, md: "Ethnische Zugehörigkeit lässt sich biologisch eindeutig feststellen.", why: "Ethnizität ist sozial: Sie hängt von Zuschreibung, Geschichte und Grenzziehung ab." },
    { lv: 1, ok: true, md: "Fredrik Barth richtete den Blick auf die Grenzen zwischen Gruppen.", why: "Sein Sammelband von 1969 prägte die Forschung." },
    { lv: 2, ok: true, md: "Primordialisten sehen Ethnizität als tief verwurzelte, gefühlte Bindung.", why: "Sie betonen Herkunft, Sprache und Gefühle der Zugehörigkeit." },
    { lv: 2, ok: false, md: "Konstruktivisten halten ethnische Identitäten für unwichtig.", why: "Konstruiert heißt gemacht, nicht unwirklich. Konstruierte Identitäten können sehr wirksam sein." },
    { lv: 2, ok: true, md: "Instrumentalistische Ansätze betonen, dass Ethnizität für politische und wirtschaftliche Ziele genutzt wird.", why: "Eliten können Zugehörigkeit gezielt mobilisieren." },
    { lv: 3, ok: true, md: "Benedict Anderson nannte Nationen »vorgestellte Gemeinschaften«.", why: "Ihre Mitglieder kennen sich nie alle, stellen sich aber als Gemeinschaft vor." },
    { lv: 3, ok: false, md: "Für Barth bestimmen vor allem gemeinsame Bräuche, wer zu einer Gruppe gehört.", why: "Barth zeigt: Bräuche können sich ändern, während die Grenze bleibt. Entscheidend ist die Grenzziehung." },
    { lv: 3, ok: true, md: "In Ruanda schrieb die belgische Kolonialverwaltung die Zugehörigkeit zu Hutu oder Tutsi in Ausweise.", why: "Damit wurden fließende Unterschiede amtlich festgeschrieben." },
    { lv: 4, ok: false, md: "Ethnische Grenzen verhindern jeden Austausch zwischen Gruppen.", why: "Barth zeigte, dass Grenzen bestehen bleiben, obwohl Menschen sie überqueren und miteinander handeln." },
    { lv: 4, ok: true, md: "Menschen können je nach Situation unterschiedliche Zugehörigkeiten betonen.", why: "Herkunft, Religion oder Beruf treten je nach Lage in den Vordergrund." },
    { lv: 4, ok: false, md: "Gibt eine Gruppe ihre Sprache auf, verschwindet ihre ethnische Identität zwangsläufig.", why: "Grenze und Zugehörigkeit können bleiben, auch wenn sich Sprache und Bräuche ändern." },
    { lv: 4, ok: true, md: "Ethnogenese bezeichnet die Entstehung einer neuen ethnischen Gruppe.", why: "Gruppen entstehen etwa durch Zusammenschluss, Abspaltung oder Fremdbenennung." },
  ], [
    { lv: 1, a: "Primordialismus", b: "Ethnizität als tiefe, gefühlte Bindung" },
    { lv: 1, a: "Konstruktivismus", b: "Ethnizität als sozial gemacht und wandelbar" },
    { lv: 2, a: "Instrumentalismus", b: "Ethnizität als Mittel für Interessen" },
    { lv: 2, a: "Ethnische Grenze", b: "Wer dazugehört und wer nicht" },
    { lv: 3, a: "Vorgestellte Gemeinschaft", b: "Andersons Begriff für die Nation" },
    { lv: 3, a: "Ethnogenese", b: "Entstehung einer ethnischen Gruppe" },
  ]);

  topic("eth-globalisierung", [
    { lv: 1, ok: true, md: "Globale Waren und Medien werden vor Ort oft angeeignet und umgedeutet.", why: "Statt einer Einheitskultur entstehen neue, lokale Formen." },
    { lv: 1, ok: false, md: "Kommt Fastfood in ein Land, verschwinden dort zwangsläufig alle lokalen Essgewohnheiten.", why: "Studien zeigen Aneignung: Fastfood wird umgedeutet, etwa als Ort für Familienfeiern." },
    { lv: 1, ok: true, md: "Glokalisierung beschreibt das Zusammenspiel globaler Einflüsse und lokaler Formen.", why: "Ein Produkt wird an örtliche Vorlieben angepasst und dabei verändert." },
    { lv: 2, ok: true, md: "Arjun Appadurai beschreibt globale Ströme als »scapes«, etwa Ethnoscapes und Mediascapes.", why: "Er unterscheidet fünf Arten von Strömen." },
    { lv: 2, ok: false, md: "Mediascapes sind bei Appadurai Ströme von Menschen wie Migranten und Touristen.", why: "Das sind Ethnoscapes. Mediascapes sind Ströme von Bildern und Nachrichten." },
    { lv: 2, ok: true, md: "Transnationale Migranten pflegen Bindungen in mehrere Länder zugleich.", why: "Sie schicken Geld, reisen und bleiben über Medien verbunden." },
    { lv: 3, ok: true, md: "Der Band »Writing Culture« von 1986 zeigte, dass Ethnographien auch literarisch gestaltete Texte sind.", why: "Damit rückten Autorität und Schreibweise der Forschenden in den Blick." },
    { lv: 3, ok: false, md: "Nach der »Krise der Repräsentation« gaben Ethnologen die Feldforschung auf.", why: "Sie führte zu mehr Nachdenken über Autorität und Schreiben, nicht zum Ende der Feldforschung." },
    { lv: 3, ok: true, md: "Igor Kopytoff schlug vor, die Biographie von Dingen zu verfolgen, die zwischen Ware und Geschenk wechseln.", why: "Ein Ding kann im Laufe seines Lebens ganz verschieden bewertet werden." },
    { lv: 4, ok: false, md: "Globalisierung hat erst mit dem Internet begonnen.", why: "Weltweite Verflechtungen gab es schon durch Handel, Kolonialismus und Migration lange davor." },
    { lv: 4, ok: true, md: "Lokale Gruppen nutzen globale Medien auch, um eigene Anliegen sichtbar zu machen.", why: "So erreichen etwa indigene Bewegungen ein weltweites Publikum." },
    { lv: 4, ok: true, md: "Globale Ungleichheit prägt, wer wohin reisen und was kaufen kann.", why: "Die Ströme sind nicht für alle gleich offen." },
    { lv: 4, ok: false, md: "Hybridität bedeutet, dass eine Kultur unecht oder verfälscht ist.", why: "Hybridität beschreibt Neukombination. Alle Kulturen sind aus Mischungen entstanden." },
  ], [
    { lv: 1, a: "Ethnoscape", b: "Ströme von Menschen" },
    { lv: 1, a: "Mediascape", b: "Ströme von Bildern und Nachrichten" },
    { lv: 2, a: "Technoscape", b: "Ströme von Technik" },
    { lv: 2, a: "Financescape", b: "Ströme von Kapital" },
    { lv: 3, a: "Ideoscape", b: "Ströme politischer Ideen" },
    { lv: 3, a: "Glokalisierung", b: "Globales wird lokal angeeignet" },
  ]);
})();
