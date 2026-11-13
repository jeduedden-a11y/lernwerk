// Generators for the lessons that extend the existing learning paths in November 2026 (second round): linear
// programming in CS50 AI, tariffs in economics, law and dispute settlement in anthropology. The proof lessons of
// analysis, linear algebra and probability use the pools in beweise.js. Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }
  const num = (answer, md, explain, extra) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl", explain }, extra || {});
  const T = (G, x, dd) => G.tex(x, dd == null ? 2 : dd);

  // ================================================================ linear programming
  /** corners of {x, y >= 0, a1 x + b1 y <= c1, a2 x + b2 y <= c2} */
  function corners(cs) {
    const lines = [[1, 0, 0], [0, 1, 0]].concat(cs.map((c) => [c[0], c[1], c[2]]));
    const pts = [];
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
      const [a1, b1, c1] = lines[i], [a2, b2, c2] = lines[j], det = a1 * b2 - a2 * b1;
      if (Math.abs(det) < 1e-12) continue;
      const x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det;
      if (x < -1e-9 || y < -1e-9) continue;
      if (cs.every((c) => c[0] * x + c[1] * y <= c[2] + 1e-9) && !pts.some((p) => Math.abs(p[0] - x) < 1e-9 && Math.abs(p[1] - y) < 1e-9)) pts.push([x, y]);
    }
    return pts;
  }
  /** two constraints that cross in an integer point inside the first quadrant */
  function lp(G) {
    for (let tries = 0; tries < 40; tries++) {
      const px = G.int(1, 5), py = G.int(1, 5);
      const a1 = G.int(1, 3), b1 = G.int(1, 3), a2 = G.int(1, 4), b2 = G.int(1, 4);
      if (a1 * b2 === a2 * b1) continue;
      // the two lines must actually cross at an edge: one steeper than the other
      if ((a1 / b1 - a2 / b2) * (b1 * b2) === 0) continue;
      const cs = [[a1, b1, a1 * px + b1 * py], [a2, b2, a2 * px + b2 * py]];
      const pts = corners(cs);
      if (pts.length === 4 && pts.some((p) => p[0] === px && p[1] === py)) return { cs, pts, px, py };
    }
    return { cs: [[1, 1, 6], [2, 1, 8]], pts: corners([[1, 1, 6], [2, 1, 8]]), px: 2, py: 4 };
  }
  const cTex = (G, c) => (c[0] === 1 ? "" : c[0]) + "x + " + (c[1] === 1 ? "" : c[1]) + "y \\le " + c[2];
  const pt = (G, p) => "(" + T(G, p[0], 2) + " \\mid " + T(G, p[1], 2) + ")";
  gen("cs50-lp", "Lineare Optimierung", {
    1: [(lv, G) => {
      const a = G.int(1, 6), b = G.int(1, 6), x = G.int(0, 8), y = G.int(0, 8);
      return num(a * x + b * y, "Die Zielfunktion lautet $z = " + a + "x + " + b + "y$. Welchen Wert hat sie im Punkt $(" + x + " \\mid " + y + ")$?",
        "$z = " + a + " \\cdot " + x + " + " + b + " \\cdot " + y + " = " + (a * x + b * y) + "$.");
    }, (lv, G) => {
      const c = [G.int(1, 4), G.int(1, 4), G.int(8, 20)], x = G.int(0, 6), y = G.int(0, 6), ok = c[0] * x + c[1] * y <= c[2];
      return { type: "truefalse", md: "Erfüllt der Punkt $(" + x + " \\mid " + y + ")$ die Bedingung $" + cTex(G, c) + "$?", answer: ok,
        whyNot: "$" + c[0] + " \\cdot " + x + " + " + c[1] + " \\cdot " + y + " = " + (c[0] * x + c[1] * y) + "$ ist " + (ok ? "höchstens" : "größer als") + " $" + c[2] + "$.",
        explain: "Einsetzen: $" + (c[0] * x + c[1] * y) + (ok ? " \\le " : " > ") + c[2] + "$. " + (ok ? "Der Punkt liegt im zulässigen Bereich." : "Der Punkt verletzt die Bedingung.") };
    }],
    2: [(lv, G) => {
      const L = lp(G), a = G.int(1, 5), b = G.int(1, 5);
      const vals = L.pts.map((p) => a * p[0] + b * p[1]), best = Math.max(...vals);
      return num(G.round(best, 2), "Maximiere $z = " + a + "x + " + b + "y$ unter $x, y \\ge 0$, $" + cTex(G, L.cs[0]) + "$ und $" + cTex(G, L.cs[1]) + "$. Die Ecken des zulässigen Bereichs sind " + L.pts.map((p) => "$" + pt(G, p) + "$").join(", ") + ". Wie groß ist das Maximum?",
        "Das Optimum liegt in einer Ecke. Werte: " + L.pts.map((p, i) => "$" + pt(G, p) + " \\mapsto " + T(G, vals[i], 2) + "$").join(", ") + ". Maximum: $" + T(G, best, 2) + "$.", { tolerance: 0.006 });
    }],
    3: [(lv, G) => {
      const L = lp(G);
      const [c1, c2] = L.cs;
      return { type: "cloze", md: "Die Geraden $" + c1[0] + "x + " + c1[1] + "y = " + c1[2] + "$ und $" + c2[0] + "x + " + c2[1] + "y = " + c2[2] + "$ schneiden sich im Punkt ({{0}} | {{1}}).",
        blanks: [{ accept: [L.px], numeric: true, tolerance: 1e-6, placeholder: "x" }, { accept: [L.py], numeric: true, tolerance: 1e-6, placeholder: "y" }],
        explain: "Gleichungssystem lösen, etwa mit Einsetzen oder Gauß: $x = " + L.px + "$, $y = " + L.py + "$. Solche Schnittpunkte sind die Ecken, unter denen das Optimum liegt." };
    }, (lv, G) => {
      const k = G.pick([
        ["Ein Betrieb stellt Tische ($x$) und Stühle ($y$) her. Ein Tisch braucht 3 Stunden, ein Stuhl 1 Stunde; es gibt 30 Stunden. Welche Bedingung beschreibt das?", "$3x + y \\le 30$", ["$x + 3y \\le 30$", "Die Stunden für Tische und Stühle sind vertauscht."], ["$3x + y \\ge 30$", "Mehr als 30 Stunden gibt es nicht: höchstens, also $\\le$."], ["$3x \\cdot y \\le 30$", "Die Zeiten addieren sich, sie multiplizieren sich nicht."]],
        ["Ein Futtermix aus Sorte A ($x$ kg) und B ($y$ kg) soll mindestens 12 g Eiweiß enthalten; A hat 2 g pro kg, B 4 g pro kg. Welche Bedingung?", "$2x + 4y \\ge 12$", ["$2x + 4y \\le 12$", "»Mindestens« heißt $\\ge$."], ["$4x + 2y \\ge 12$", "Die Eiweißgehalte sind vertauscht."], ["$x + y \\ge 12$", "Es zählt das Eiweiß, nicht die Masse."]],
      ]);
      return { type: "choice", md: k[0], options: G.options({ md: k[1], why: "So übersetzt man den Text in eine lineare Ungleichung." }, G.shuffle(k.slice(2)).map((w) => ({ md: w[0], why: w[1] }))), explain: "Lineare Optimierung beginnt mit der Übersetzung: Variablen wählen, Ressourcen als Ungleichungen, Ziel als lineare Funktion." };
    }],
    4: [(lv, G) => {
      const L = lp(G), a = G.int(1, 6), b = G.int(1, 6);
      const vals = L.pts.map((p) => a * p[0] + b * p[1]), best = Math.max(...vals), at = L.pts[vals.indexOf(best)];
      return num(G.round(best, 2), "Maximiere $z = " + a + "x + " + b + "y$ unter $x, y \\ge 0$, $" + cTex(G, L.cs[0]) + "$ und $" + cTex(G, L.cs[1]) + "$. Bestimme das Maximum (Ecken selbst berechnen).",
        "Ecken: Ursprung, die Achsenabschnitte, die noch beide Bedingungen erfüllen, und der Schnittpunkt $(" + L.px + " \\mid " + L.py + ")$: " + L.pts.map((p, i) => "$" + pt(G, p) + " \\mapsto " + T(G, vals[i], 2) + "$").join(", ") + ". Das Maximum $" + T(G, best, 2) + "$ liegt in $" + pt(G, at) + "$.", { tolerance: 0.006 });
    }],
  });
  LW.extend("cs50-lp", F.statements([
    { lv: 1, ok: true, md: "Bei einem linearen Optimierungsproblem sind Zielfunktion und Bedingungen linear.", why: "Keine Produkte oder Potenzen der Variablen, nur Summen von Vielfachen." },
    { lv: 2, ok: true, md: "Wenn ein beschränktes lineares Optimierungsproblem ein Optimum hat, dann auch in einer Ecke des zulässigen Bereichs.", why: "Die Zielfunktion ist eine Ebene; über einem Vieleck wird sie an einer Ecke am größten." },
    { lv: 2, ok: false, md: "Das Optimum liegt immer in der Mitte des zulässigen Bereichs.", why: "Eine lineare Funktion wird am Rand am größten, in einer Ecke." },
    { lv: 3, ok: true, md: "Der Simplex-Algorithmus wandert von Ecke zu Ecke, solange sich der Zielwert verbessert.", why: "So muss er nicht alle Ecken prüfen." },
    { lv: 3, ok: false, md: "Hill Climbing findet bei linearen Problemen nie das Optimum.", why: "Bei konvexen Problemen wie der linearen Optimierung ist jedes lokale Optimum auch ein globales." },
    { lv: 4, ok: true, md: "Verlangt man ganzzahlige Lösungen, wird das Problem im Allgemeinen deutlich schwerer.", why: "Ganzzahlige Optimierung ist NP-schwer; die gerundete LP-Lösung muss nicht optimal oder zulässig sein." },
    { lv: 4, ok: false, md: "Der zulässige Bereich eines linearen Optimierungsproblems kann ein Loch haben.", why: "Ein Schnitt von Halbebenen ist immer konvex, ohne Löcher." },
  ], STMT));

  // ================================================================ tariffs
  function market(G) {
    // demand Qd = a - b p, supply Qs = d p - c, autarky price above the world price
    for (let i = 0; i < 40; i++) {
      const b = G.pick([1, 2]), d = G.pick([1, 2]), a = G.pick([20, 24, 30, 36]), c = G.pick([0, 2, 4, 6]);
      const pa = (a + c) / (b + d), pw = G.int(Math.max(2, Math.ceil(c / d) + 1), Math.floor(pa) - 2), t = G.int(1, Math.max(1, Math.floor(pa - pw) - 1));
      if (pw + t >= pa || pw < 1) continue;
      const qd = (p) => a - b * p, qs = (p) => d * p - c;
      if (qs(pw) < 0) continue;
      return { a, b, c, d, pa, pw, t, qd, qs };
    }
    const qd = (p) => 20 - p, qs = (p) => p - 2;
    return { a: 20, b: 1, c: 2, d: 1, pa: 11, pw: 5, t: 2, qd, qs };
  }
  const law = (m) => "Nachfrage $Q_N = " + m.a + " - " + (m.b === 1 ? "" : m.b) + "p$, Angebot $Q_A = " + (m.d === 1 ? "" : m.d) + "p" + (m.c ? " - " + m.c : "") + "$";
  gen("oek-zoll", "Zölle und Welthandel", {
    1: [(lv, G) => {
      const m = market(G), imp = m.qd(m.pw) - m.qs(m.pw);
      return num(imp, law(m) + ". Der Weltmarktpreis ist $" + m.pw + "$. Wie viel wird bei Freihandel importiert?",
        "Bei $p = " + m.pw + "$ fragen die Inländer $" + m.qd(m.pw) + "$ nach, die inländischen Firmen bieten $" + m.qs(m.pw) + "$ an. Die Lücke von $" + imp + "$ wird importiert.");
    }, (lv, G) => {
      const m = market(G);
      return num(m.pa, law(m) + ". Welcher Preis herrscht ohne Außenhandel (Autarkie)?", "Angebot gleich Nachfrage: $" + m.a + " - " + m.b + "p = " + m.d + "p - " + m.c + "$, also $p = \\tfrac{" + (m.a + m.c) + "}{" + (m.b + m.d) + "} = " + T(G, m.pa, 2) + "$.", { tolerance: 0.006 });
    }],
    2: [(lv, G) => {
      const m = market(G), p = m.pw + m.t, imp = m.qd(p) - m.qs(p);
      return num(imp, law(m) + ". Weltmarktpreis $" + m.pw + "$, darauf ein Zoll von $" + m.t + "$ pro Stück. Wie viel wird jetzt importiert?",
        "Der Inlandspreis steigt auf $" + p + "$: Nachfrage $" + m.qd(p) + "$, inländisches Angebot $" + m.qs(p) + "$, Import $" + imp + "$ statt $" + (m.qd(m.pw) - m.qs(m.pw)) + "$.");
    }, (lv, G) => {
      const m = market(G), p = m.pw + m.t, imp = m.qd(p) - m.qs(p);
      return num(m.t * imp, law(m) + ". Weltmarktpreis $" + m.pw + "$, Zoll $" + m.t + "$ pro Stück. Wie hoch sind die Zolleinnahmen des Staates?",
        "Mit Zoll wird $" + imp + "$ importiert; jede Einheit bringt $" + m.t + "$. Einnahmen $" + m.t + " \\cdot " + imp + " = " + m.t * imp + "$.");
    }],
    3: [(lv, G) => {
      const m = market(G), p = m.pw + m.t, dS = m.qs(p) - m.qs(m.pw), dD = m.qd(m.pw) - m.qd(p), dwl = 0.5 * m.t * (dS + dD);
      return num(dwl, law(m) + ". Weltmarktpreis $" + m.pw + "$, Zoll $" + m.t + "$. Wie groß ist der Wohlfahrtsverlust (die zwei Dreiecke)?",
        "Produktionsdreieck $\\tfrac12 \\cdot " + m.t + " \\cdot " + dS + "$ (teure Inlandsproduktion ersetzt Importe), Konsumdreieck $\\tfrac12 \\cdot " + m.t + " \\cdot " + dD + "$ (Käufe, die wegfallen). Zusammen $" + T(G, dwl, 2) + "$.", { tolerance: 0.006 });
    }, (lv, G) => {
      const who = G.pick([["inländische Produzenten", "gewinnen", "Sie verkaufen mehr zu einem höheren Preis."], ["inländische Konsumenten", "verlieren", "Sie zahlen mehr und kaufen weniger."], ["der Staat", "gewinnt", "Er nimmt Zoll auf jede importierte Einheit ein."]]);
      const right = who[1];
      return { type: "choice", md: "Ein Land erhebt einen Importzoll. Was passiert mit dem Wohlstand: " + who[0] + "?",
        options: ["gewinnt", "gewinnen", "verlieren", "verliert"].filter((o) => (who[0] === "der Staat" ? ["gewinnt", "verliert"] : ["gewinnen", "verlieren"]).includes(o)).map((o) => ({ md: o, correct: o === right, why: o === right ? null : who[2] })),
        explain: who[2] + " Insgesamt verliert das Land: Der Verlust der Konsumenten ist größer als die Gewinne von Produzenten und Staat." };
    }],
    4: [(lv, G) => {
      const m = market(G), tp = m.pa - m.pw;
      return num(tp, law(m) + ". Weltmarktpreis $" + m.pw + "$. Ab welcher Zollhöhe wird gar nicht mehr importiert (prohibitiver Zoll)?",
        "Importe verschwinden, sobald der Inlandspreis den Autarkiepreis $" + T(G, m.pa, 2) + "$ erreicht: Zoll $" + T(G, m.pa, 2) + " - " + m.pw + " = " + T(G, tp, 2) + "$. Dann gibt es auch keine Zolleinnahmen mehr.", { tolerance: 0.006 });
    }],
  });
  LW.extend("oek-zoll", F.statements([
    { lv: 1, ok: true, md: "Liegt der Weltmarktpreis unter dem Inlandspreis ohne Handel, importiert ein Land.", why: "Inländer kaufen dann billiger im Ausland, die heimische Produktion schrumpft." },
    { lv: 2, ok: true, md: "Ein Zoll erhöht den Inlandspreis eines importierten Guts.", why: "Importeure geben den Zoll über den Preis weiter." },
    { lv: 2, ok: false, md: "Ein Zoll steigert den Wohlstand des Landes insgesamt.", why: "Gewinne von Produzenten und Staat sind kleiner als der Verlust der Konsumenten; es entsteht ein Wohlfahrtsverlust." },
    { lv: 3, ok: true, md: "Eine Importquote kann denselben Preiseffekt haben wie ein Zoll.", why: "Die Differenz zum Weltpreis kassieren dann aber die Inhaber der Importlizenzen, nicht der Staat." },
    { lv: 3, ok: false, md: "Ein prohibitiver Zoll bringt dem Staat die höchsten Einnahmen.", why: "Bei einem prohibitiven Zoll wird nichts mehr importiert, die Einnahmen sind null." },
    { lv: 4, ok: true, md: "Ein großes Land kann mit einem Zoll den Weltmarktpreis drücken und so einen Teil der Last auf das Ausland verschieben.", why: "Das ist das Terms-of-Trade-Argument; für kleine Länder gilt es nicht." },
    { lv: 4, ok: false, md: "Nach Ricardo lohnt sich Handel nur, wenn ein Land bei mindestens einem Gut absolut billiger produziert.", why: "Entscheidend ist der komparative Vorteil, nicht der absolute." },
  ], STMT));

  // ================================================================ law and dispute settlement
  LW.generator("eth-recht", {
    title: "Recht und Konfliktlösung",
    make(level, G) {
      const forms = EXTRA[level] || EXTRA[1];
      return G.pick(forms)(level, G);
    },
  });
  const CASES = F.groups([
    { lv: 1, md: "Ein Vermittler trägt Vorschläge zwischen zwei Familien hin und her, kann aber nichts entscheiden.", cat: "Mediation", why: "Er vermittelt ohne Entscheidungsmacht; einigen müssen sich die Parteien selbst." },
    { lv: 1, md: "Zwei Nachbarn einigen sich ohne Dritte über die Grenze ihrer Felder.", cat: "Verhandlung", why: "Die Parteien regeln den Streit unter sich." },
    { lv: 1, md: "Ein Richter entscheidet, und die Polizei setzt das Urteil durch.", cat: "Gericht", why: "Ein Dritter entscheidet verbindlich, gestützt auf Zwangsmittel." },
    { lv: 2, md: "Bei den Nuer vermittelt der Leopardenfellhäuptling nach einem Totschlag die Zahlung von Rindern.", cat: "Mediation", why: "Er kann niemanden zwingen; seine Autorität ist rituell, nicht politisch." },
    { lv: 2, md: "Ein Ältestenrat hört beide Seiten und spricht einen Schiedsspruch, den die Parteien vorher anzuerkennen versprochen haben.", cat: "Schlichtung", why: "Ein Dritter entscheidet, aber die Bindung beruht auf Zustimmung, nicht auf Zwang." },
    { lv: 2, md: "Nach einer Tötung rächt die Verwandtschaftsgruppe des Opfers den Toten an einem Mitglied der anderen Gruppe.", cat: "Selbsthilfe", why: "Die Betroffenen setzen ihr Recht selbst durch; daraus kann eine Fehde werden." },
    { lv: 3, md: "Bei den Ifugao auf Luzon pendelt ein Mittelsmann zwischen den Streitenden, bis eine Entschädigung vereinbart ist.", cat: "Mediation", why: "Der monkalun drängt und vermittelt, entscheidet aber nicht." },
    { lv: 3, md: "Zwei Inuit tragen ihren Streit in einem öffentlichen Liederduell aus; das Publikum bestimmt den Sieger.", cat: "Schlichtung", why: "Die Gemeinschaft urteilt, ohne Zwangsapparat; die Ehre steht auf dem Spiel." },
    { lv: 3, md: "Ein Schiedsgericht der Handelskammer entscheidet einen Vertragsstreit zwischen zwei Firmen.", cat: "Schlichtung", why: "Die Firmen haben sich dem Schiedsspruch vorab unterworfen." },
  ], { 1: ["choice"], 2: ["choice", "sort"], 3: ["sort", "choice"], 4: ["sort"] }, { cats: ["Verhandlung", "Mediation", "Schlichtung", "Gericht", "Selbsthilfe"], ask: (md) => "Welche Form der Konfliktregelung ist das?\n\n" + md, sort: "Ordne die Fälle den Formen der Konfliktregelung zu.", n: 4 });
  const PEOPLE = F.pairs([
    { lv: 2, a: "Bronisław Malinowski", b: "Gegenseitige Verpflichtungen halten das Recht der Trobriander zusammen.", why: "In »Crime and Custom in Savage Society« (1926) sieht er Reziprozität als bindende Kraft." },
    { lv: 2, a: "E. E. Evans-Pritchard", b: "Der Leopardenfellhäuptling vermittelt bei den Nuer.", why: "Aus seiner Studie über die Nuer (1940)." },
    { lv: 3, a: "Llewellyn und Hoebel", b: "Die Methode der Streitfälle: Recht zeigt sich daran, wie Konflikte tatsächlich gelöst werden.", why: "»The Cheyenne Way« (1941)." },
    { lv: 3, a: "Max Gluckman", b: "Richter der Barotse messen Verhalten am »vernünftigen Menschen«.", why: "Seine Studie des Gerichtsverfahrens der Lozi (1955)." },
    { lv: 3, a: "Paul Bohannan", b: "Gerechtigkeit und Urteil bei den Tiv: Wie lassen sich fremde Rechtsbegriffe übersetzen?", why: "»Justice and Judgment among the Tiv« (1957)." },
    { lv: 4, a: "Laura Nader", b: "Harmonieideologie: Der Zwang zur Einigung kann Machtungleichheit verdecken.", why: "Aus ihrer Forschung bei den Zapoteken in Mexiko." },
    { lv: 4, a: "Sally Engle Merry", b: "Rechtspluralismus: Staatliches, religiöses und lokales Recht wirken nebeneinander.", why: "Ihr Aufsatz zum Rechtspluralismus (1988) prägte die Debatte." },
  ], { 2: ["choice"], 3: ["match", "reverse"], 4: ["match", "reverse"] });
  const STATEMENTS = F.statements([
    { lv: 1, ok: true, md: "Auch Gesellschaften ohne Staat haben verbindliche Regeln und Wege, Streit beizulegen.", why: "Soziale Kontrolle läuft dort über Verwandtschaft, Reziprozität, öffentliche Meinung und Ritual." },
    { lv: 1, ok: false, md: "Recht gibt es nur dort, wo es Gerichte und Polizei gibt.", why: "Diese enge Definition würde die meisten Gesellschaften der Geschichte für rechtlos erklären." },
    { lv: 2, ok: true, md: "Ein Mediator schlägt vor, ein Schlichter oder Richter entscheidet.", why: "Der Unterschied liegt in der Entscheidungsmacht des Dritten." },
    { lv: 2, ok: false, md: "Blutrache folgt keinen Regeln.", why: "Fehden haben oft genaue Regeln: wer rächen darf, an wem, und wann eine Entschädigung den Streit beendet." },
    { lv: 3, ok: true, md: "Rechtspluralismus heißt, dass in einem Gebiet mehrere Rechtsordnungen nebeneinander gelten.", why: "Etwa staatliches Recht, Gewohnheitsrecht und religiöses Recht." },
    { lv: 3, ok: true, md: "Die Ethnologie des Rechts untersucht oft konkrete Streitfälle statt abstrakter Regeln.", why: "So zeigt sich, welche Normen im Konflikt wirklich gelten." },
    { lv: 4, ok: false, md: "Versöhnung als Ziel der Streitbeilegung ist immer gerechter als ein Urteil.", why: "Laura Nader zeigte, dass Harmonieideologie Schwächere unter Druck setzen kann, nachzugeben." },
    { lv: 4, ok: true, md: "Kolonialverwaltungen schrieben oft »Gewohnheitsrecht« fest und veränderten es dabei.", why: "Aus beweglichen Praktiken wurden starre Regeln, häufig im Interesse lokaler Eliten." },
  ], STMT);
  const EXTRA = {};
  [CASES, PEOPLE, STATEMENTS].forEach((part) => Object.keys(part).forEach((lv) => { (EXTRA[lv] = EXTRA[lv] || []).push(...part[lv]); }));
})();
