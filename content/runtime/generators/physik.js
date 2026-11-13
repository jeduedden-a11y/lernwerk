// Physics (Oberstufe, Kerncurriculum Hessen): kinematics, energy and momentum, the electric field and the capacitor,
// harmonic oscillation, the photoelectric effect. Four levels per topic from number templates, statements to judge
// and derivations as proof tasks (fill gaps, give reasons, find the wrong line). Own wording throughout.
(function () {
  const F = LW.forms;
  const g = 9.81, e = 1.602e-19, me = 9.109e-31, eps0 = 8.854e-12, hEV = 4.136e-15;
  const U = {
    m: "\\,\\mathrm{m}", s: "\\,\\mathrm{s}", ms: "\\,\\tfrac{\\mathrm{m}}{\\mathrm{s}}", ms2: "\\,\\tfrac{\\mathrm{m}}{\\mathrm{s}^2}", kmh: "\\,\\tfrac{\\mathrm{km}}{\\mathrm{h}}",
    J: "\\,\\mathrm{J}", kg: "\\,\\mathrm{kg}", N: "\\,\\mathrm{N}", Nm: "\\,\\tfrac{\\mathrm{N}}{\\mathrm{m}}", V: "\\,\\mathrm{V}", eV: "\\,\\mathrm{eV}", Hz: "\\,\\mathrm{Hz}",
  };
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  const DERIV = { 3: ["gaps", "justify"], 4: ["flaw", "order", "justify"] };
  const REASONS = ["Weg-Zeit-Gesetz", "Geschwindigkeit-Zeit-Gesetz", "Nach t auflösen", "Einsetzen", "Energieerhaltung", "Impulserhaltung",
    "Newtons zweites Gesetz", "Kräftegleichgewicht", "Definition", "Umformen", "Wurzel ziehen", "Kürzen"];
  const s = (md, by, why) => ({ md, by, why });
  const d = (md, why) => ({ md, why });

  /** numeric task; the tolerance forgives rounding and g = 9,8 instead of 9,81 */
  function num(G, value, digits, md, explain, unit, extra) {
    const tol = Math.max(0.6 * Math.pow(10, -digits), Math.abs(value) * 0.006);
    return Object.assign({ type: "numeric", md, answer: G.round(value, digits), tolerance: tol, answerText: G.fmt(value, digits) + (unit ? " " + unit : ""),
      placeholder: unit || "Zahl", explain }, extra || {});
  }
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }
  const T = (G, x, dd) => G.tex(x, dd == null ? 2 : dd);

  // ================================================================ kinematics
  gen("phy-kinematik", "Bewegungen", {
    1: [(lv, G) => {
      const kmh = G.pick([18, 36, 54, 72, 90, 108, 126, 144]), v = kmh / 3.6;
      return num(G, v, 1, "Ein Zug fährt mit $" + kmh + U.kmh + "$. Wie schnell ist das in Metern pro Sekunde?",
        "$1" + U.kmh + " = \\tfrac{1000\\,\\mathrm{m}}{3600\\,\\mathrm{s}} = \\tfrac{1}{3{,}6}" + U.ms + "$. Also $v = \\tfrac{" + kmh + "}{3{,}6}" + U.ms + " = " + T(G, v, 1) + U.ms + "$.", "m/s");
    }, (lv, G) => {
      const v = G.pick([2, 4, 5, 8, 12, 15, 20, 25]), t = G.pick([10, 15, 20, 30, 40, 60, 90, 120]), sw = v * t, ask = G.pick(["s", "t", "v"]);
      if (ask === "s") return num(G, sw, 0, "Ein Körper bewegt sich gleichförmig mit $v = " + v + U.ms + "$. Welchen Weg legt er in $" + t + U.s + "$ zurück (in m)?",
        "Gleichförmig: $s = v \\cdot t = " + v + U.ms + " \\cdot " + t + U.s + " = " + sw + U.m + "$.", "m");
      if (ask === "t") return num(G, t, 1, "Wie lange braucht ein Läufer mit konstant $" + v + U.ms + "$ für $" + sw + U.m + "$ (in s)?",
        "$t = \\tfrac{s}{v} = \\tfrac{" + sw + U.m + "}{" + v + U.ms + "} = " + t + U.s + "$.", "s");
      return num(G, v, 1, "Ein Fahrzeug legt gleichförmig $" + sw + U.m + "$ in $" + t + U.s + "$ zurück. Wie groß ist seine Geschwindigkeit (in m/s)?",
        "$v = \\tfrac{s}{t} = \\tfrac{" + sw + U.m + "}{" + t + U.s + "} = " + v + U.ms + "$.", "m/s");
    }],
    2: [(lv, G) => {
      const a = G.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), t = G.int(2, 12);
      if (G.chance(0.5)) return num(G, a * t, 1, "Ein Motorrad beschleunigt aus dem Stand gleichmäßig mit $a = " + T(G, a, 1) + U.ms2 + "$. Welche Geschwindigkeit hat es nach $" + t + U.s + "$ (in m/s)?",
        "$v = a \\cdot t = " + T(G, a, 1) + U.ms2 + " \\cdot " + t + U.s + " = " + T(G, a * t, 1) + U.ms + "$.", "m/s");
      return num(G, 0.5 * a * t * t, 1, "Ein Auto beschleunigt aus dem Stand gleichmäßig mit $a = " + T(G, a, 1) + U.ms2 + "$. Welchen Weg legt es in den ersten $" + t + U.s + "$ zurück (in m)?",
        "$s = \\tfrac12 a t^2 = \\tfrac12 \\cdot " + T(G, a, 1) + " \\cdot " + t + "^2" + U.m + " = " + T(G, 0.5 * a * t * t, 1) + U.m + "$.", "m");
    }, (lv, G) => {
      const a = G.pick([1, 2, 4, 5]), t = G.int(2, 10), sw = 0.5 * a * t * t;
      return num(G, t, 1, "Ein Wagen startet aus der Ruhe mit $a = " + a + U.ms2 + "$. Nach welcher Zeit hat er $" + T(G, sw, 1) + U.m + "$ zurückgelegt (in s)?",
        "$s = \\tfrac12 a t^2 \\Rightarrow t = \\sqrt{\\tfrac{2s}{a}} = \\sqrt{\\tfrac{2 \\cdot " + T(G, sw, 1) + "}{" + a + "}}" + U.s + " = " + t + U.s + "$.", "s");
    }, (lv, G) => {
      const t = G.pick([1, 1.5, 2, 2.5, 3, 4]);
      if (G.chance(0.5)) return num(G, 0.5 * g * t * t, 1, "Ein Stein fällt aus der Ruhe, ohne Luftwiderstand. Welche Strecke fällt er in $" + T(G, t, 1) + U.s + "$ (in m, $g = 9{,}81" + U.ms2 + "$)?",
        "Freier Fall: $s = \\tfrac12 g t^2 = \\tfrac12 \\cdot 9{,}81 \\cdot " + T(G, t, 1) + "^2" + U.m + " \\approx " + T(G, 0.5 * g * t * t, 1) + U.m + "$.", "m");
      return num(G, g * t, 1, "Ein Stein fällt aus der Ruhe, ohne Luftwiderstand. Wie schnell ist er nach $" + T(G, t, 1) + U.s + "$ (in m/s, $g = 9{,}81" + U.ms2 + "$)?",
        "$v = g \\cdot t = 9{,}81" + U.ms2 + " \\cdot " + T(G, t, 1) + U.s + " \\approx " + T(G, g * t, 1) + U.ms + "$.", "m/s");
    }],
    3: [(lv, G) => {
      const kmh = G.pick([36, 54, 72, 90, 108, 126]), a = G.pick([4, 5, 6, 8, 9]), v0 = kmh / 3.6, sb = v0 * v0 / (2 * a);
      return num(G, sb, 1, "Ein Auto bremst von $" + kmh + U.kmh + "$ mit der konstanten Verzögerung $" + a + U.ms2 + "$ bis zum Stillstand. Wie lang ist der Bremsweg (in m)?",
        "$v_0 = \\tfrac{" + kmh + "}{3{,}6}" + U.ms + " = " + T(G, v0, 2) + U.ms + "$. Bremsweg $s = \\tfrac{v_0^2}{2a} = \\tfrac{" + T(G, v0, 2) + "^2}{2 \\cdot " + a + "}" + U.m + " \\approx " + T(G, sb, 1) + U.m + "$.", "m");
    }, (lv, G) => {
      const kmh = G.pick([36, 50, 54, 72, 90, 100]), a = G.pick([5, 6, 8]), tr = G.pick([0.5, 0.8, 1, 1.2]), v0 = kmh / 3.6;
      const sr = v0 * tr, sb = v0 * v0 / (2 * a);
      return num(G, sr + sb, 1, "Eine Fahrerin sieht bei $" + kmh + U.kmh + "$ ein Hindernis. Ihre Reaktionszeit ist $" + T(G, tr, 1) + U.s + "$, dann bremst sie mit $" + a + U.ms2 + "$. Wie lang ist der Anhalteweg (in m)?",
        "Reaktionsweg $s_R = v_0 t_R = " + T(G, v0, 2) + " \\cdot " + T(G, tr, 1) + U.m + " \\approx " + T(G, sr, 1) + U.m + "$, Bremsweg $s_B = \\tfrac{v_0^2}{2a} \\approx " + T(G, sb, 1) + U.m + "$. Zusammen $\\approx " + T(G, sr + sb, 1) + U.m + "$.", "m");
    }, (lv, G) => {
      const h = G.pick([5, 10, 20, 45, 80, 125]);
      if (G.chance(0.5)) return num(G, Math.sqrt(2 * h / g), 2, "Ein Apfel fällt aus $" + h + U.m + "$ Höhe, ohne Luftwiderstand. Wie lange fällt er (in s)?",
        "$h = \\tfrac12 g t^2 \\Rightarrow t = \\sqrt{\\tfrac{2h}{g}} = \\sqrt{\\tfrac{2 \\cdot " + h + "}{9{,}81}}" + U.s + " \\approx " + T(G, Math.sqrt(2 * h / g), 2) + U.s + "$.", "s");
      return num(G, Math.sqrt(2 * g * h), 1, "Mit welcher Geschwindigkeit schlägt ein Stein auf, der aus $" + h + U.m + "$ Höhe fällt (in m/s, ohne Luftwiderstand)?",
        "$v = \\sqrt{2 g h} = \\sqrt{2 \\cdot 9{,}81 \\cdot " + h + "}" + U.ms + " \\approx " + T(G, Math.sqrt(2 * g * h), 1) + U.ms + "$.", "m/s");
    }],
    4: [(lv, G) => {
      const dist = G.pick([30, 60, 90, 120, 150]), v1 = G.pick([60, 80, 90, 100]), v2 = G.pick([40, 50, 70, 120]), t = dist / (v1 + v2);
      return num(G, t * 60, 1, "Zwei Autos sind $" + dist + "\\,\\mathrm{km}$ voneinander entfernt und fahren mit $" + v1 + U.kmh + "$ und $" + v2 + U.kmh + "$ aufeinander zu. Nach wie vielen Minuten treffen sie sich?",
        "Der Abstand schrumpft mit $v_1 + v_2 = " + (v1 + v2) + U.kmh + "$. $t = \\tfrac{" + dist + "}{" + (v1 + v2) + "}\\,\\mathrm{h} \\approx " + T(G, t * 60, 1) + "\\,\\mathrm{min}$.", "min");
    }, (lv, G) => {
      const v = G.pick([10, 12, 15, 20]), a = G.pick([2, 2.5, 3, 4]), t = 2 * v / a;
      if (G.chance(0.5)) return num(G, t, 1, "Ein Lastwagen fährt mit konstant $" + v + U.ms + "$ an einer Ampel vorbei. Im selben Moment fährt dort ein Auto aus dem Stand mit $" + T(G, a, 1) + U.ms2 + "$ los. Nach welcher Zeit holt es den Lastwagen ein (in s)?",
        "Gleiche Orte: $v t = \\tfrac12 a t^2 \\Rightarrow t = \\tfrac{2v}{a} = \\tfrac{2 \\cdot " + v + "}{" + T(G, a, 1) + "}" + U.s + " = " + T(G, t, 1) + U.s + "$.", "s");
      return num(G, v * t, 0, "Ein Lastwagen fährt mit konstant $" + v + U.ms + "$ an einer Ampel vorbei, gleichzeitig startet dort ein Auto aus dem Stand mit $" + T(G, a, 1) + U.ms2 + "$. Wie weit von der Ampel entfernt holt es ihn ein (in m)?",
        "Treffzeit $t = \\tfrac{2v}{a} = " + T(G, t, 1) + U.s + "$, Ort $s = v t = " + v + " \\cdot " + T(G, t, 1) + U.m + " = " + T(G, v * t, 0) + U.m + "$.", "m");
    }, (lv, G) => {
      const v0 = G.pick([5, 10, 15, 20, 25]);
      if (G.chance(0.5)) return num(G, v0 * v0 / (2 * g), 2, "Ein Ball wird mit $" + v0 + U.ms + "$ senkrecht nach oben geworfen. Wie hoch steigt er über die Abwurfstelle (in m, ohne Luftwiderstand)?",
        "Am höchsten Punkt ist $v = 0$: $h = \\tfrac{v_0^2}{2g} = \\tfrac{" + v0 + "^2}{2 \\cdot 9{,}81}" + U.m + " \\approx " + T(G, v0 * v0 / (2 * g), 2) + U.m + "$.", "m");
      return num(G, 2 * v0 / g, 2, "Ein Ball wird mit $" + v0 + U.ms + "$ senkrecht nach oben geworfen. Nach welcher Zeit ist er wieder auf Abwurfhöhe (in s)?",
        "Steigzeit $\\tfrac{v_0}{g}$, dazu die gleich lange Fallzeit: $t = \\tfrac{2v_0}{g} = \\tfrac{2 \\cdot " + v0 + "}{9{,}81}" + U.s + " \\approx " + T(G, 2 * v0 / g, 2) + U.s + "$.", "s");
    }],
  });
  LW.extend("phy-kinematik", F.statements([
    { lv: 1, ok: true, md: "Im $s$-$t$-Diagramm ist die Steigung die Geschwindigkeit.", why: "Steigung heißt Weg pro Zeit, also Geschwindigkeit." },
    { lv: 1, ok: false, md: "Im $v$-$t$-Diagramm ist die Steigung der zurückgelegte Weg.", why: "Die Steigung ist die Beschleunigung; der Weg ist die Fläche unter dem Graphen." },
    { lv: 1, ok: true, md: "Eine Gerade im $s$-$t$-Diagramm beschreibt eine gleichförmige Bewegung.", why: "Konstante Steigung heißt konstante Geschwindigkeit." },
    { lv: 2, ok: true, md: "Im $v$-$t$-Diagramm ist die Fläche unter dem Graphen der zurückgelegte Weg.", why: "Bei konstanter Geschwindigkeit ist $s = v \\cdot t$ ein Rechteck, allgemein die Fläche." },
    { lv: 2, ok: false, md: "Ein Körper mit der Geschwindigkeit null kann keine Beschleunigung haben.", why: "Am höchsten Punkt eines senkrechten Wurfs ist $v = 0$, aber $a = g$." },
    { lv: 2, ok: true, md: "Ohne Luftwiderstand fallen alle Körper gleich schnell.", why: "Die Fallbeschleunigung $g$ hängt nicht von der Masse ab." },
    { lv: 3, ok: false, md: "Bei doppelter Geschwindigkeit verdoppelt sich der Bremsweg.", why: "$s = \\tfrac{v^2}{2a}$: doppelte Geschwindigkeit, vierfacher Bremsweg." },
    { lv: 3, ok: true, md: "Aus der Ruhe gleichmäßig beschleunigt legt ein Körper in der doppelten Zeit den vierfachen Weg zurück.", why: "$s = \\tfrac12 a t^2$ wächst mit dem Quadrat der Zeit." },
    { lv: 3, ok: false, md: "Ein waagerecht geworfener Stein kommt später unten an als ein fallen gelassener.", why: "Die senkrechte Bewegung ist bei beiden ein freier Fall; beide landen gleichzeitig." },
    { lv: 4, ok: true, md: "Beim senkrechten Wurf ohne Luftwiderstand ist die Steigzeit gleich der Fallzeit zurück zur Abwurfhöhe.", why: "Die Bewegung ist symmetrisch zum höchsten Punkt." },
    { lv: 4, ok: false, md: "Die Durchschnittsgeschwindigkeit ist immer der Mittelwert aus Anfangs- und Endgeschwindigkeit.", why: "Das gilt nur bei gleichmäßiger Beschleunigung; allgemein ist sie Gesamtweg durch Gesamtzeit." },
    { lv: 4, ok: true, md: "Aus einem $v$-$t$-Diagramm lässt sich die Beschleunigung als Steigung ablesen.", why: "$a = \\tfrac{\\Delta v}{\\Delta t}$." },
  ], STMT));
  LW.extend("phy-kinematik", F.proofs([
    { lv: 3, kind: "direkt", given: "Ein Auto bremst von $v_0$ mit der konstanten Verzögerung $a$ bis zum Stillstand.", claim: "Der Bremsweg ist $s = \\dfrac{v_0^2}{2a}$.",
      idea: "Erst die Bremszeit aus $v(t) = 0$ bestimmen, dann in das Weg-Zeit-Gesetz einsetzen.",
      steps: [
        s("Beim Bremsen gilt $v(t) = v_0 - a t$.", "Geschwindigkeit-Zeit-Gesetz"),
        s("Stillstand bei $v(t_B) = 0$, also $t_B = \\tfrac{v_0}{a}$.", "Nach t auflösen"),
        s("Für den Weg gilt $s(t) = v_0 t - \\tfrac12 a t^2$.", "Weg-Zeit-Gesetz"),
        s("Einsetzen: $s = \\tfrac{v_0^2}{a} - \\tfrac{v_0^2}{2a} = \\tfrac{v_0^2}{2a}$.", "Einsetzen"),
      ],
      distractors: [
        d("Für den Weg gilt $s = v_0 \\cdot t_B$.", "So weit käme das Auto ohne zu bremsen."),
        d("Stillstand bei $t_B = v_0 \\cdot a$.", "Aus $v_0 - a t = 0$ folgt $t = \\tfrac{v_0}{a}$."),
      ],
      flaw: { line: 1, md: "Stillstand bei $v(t_B) = 0$, also $t_B = v_0 \\cdot a$.", why: "Aus $v_0 - a t_B = 0$ folgt $t_B = \\tfrac{v_0}{a}$, ein Quotient." } },
    { lv: 3, kind: "direkt", given: "Ein Körper fällt aus der Höhe $h$ aus der Ruhe, ohne Luftwiderstand.", claim: "$t = \\sqrt{\\dfrac{2h}{g}}$ und $v = \\sqrt{2gh}$.",
      idea: "Das Weg-Zeit-Gesetz nach $t$ auflösen und in $v = g t$ einsetzen.",
      steps: [
        s("Freier Fall: $h = \\tfrac12 g t^2$.", "Weg-Zeit-Gesetz"),
        s("Nach $t$ auflösen: $t = \\sqrt{\\tfrac{2h}{g}}$.", "Nach t auflösen"),
        s("Für die Geschwindigkeit gilt $v = g t$.", "Geschwindigkeit-Zeit-Gesetz"),
        s("Einsetzen: $v = g\\sqrt{\\tfrac{2h}{g}} = \\sqrt{2gh}$.", "Einsetzen"),
      ],
      distractors: [
        d("Freier Fall: $h = g t^2$.", "Der Faktor $\\tfrac12$ fehlt."),
        d("Für die Geschwindigkeit gilt $v = \\tfrac12 g t$.", "$v = g t$; der Faktor $\\tfrac12$ gehört zum Weg."),
      ],
      flaw: { line: 3, md: "Einsetzen: $v = g\\sqrt{\\tfrac{2h}{g}} = \\sqrt{2h}$.", why: "$g$ wandert als $g^2$ unter die Wurzel: $g\\sqrt{\\tfrac{2h}{g}} = \\sqrt{2gh}$." } },
  ], DERIV, { reasons: REASONS }));

  // ================================================================ energy and momentum
  gen("phy-energie", "Energie und Impuls", {
    1: [(lv, G) => {
      const m = G.pick([0.5, 1, 2, 5, 10, 50, 70]), h = G.pick([2, 3, 5, 10, 20, 50]), E = m * g * h;
      return num(G, E, 1, "Welche Lageenergie gewinnt ein Körper der Masse $" + T(G, m, 1) + U.kg + "$, der um $" + h + U.m + "$ angehoben wird (in J)?",
        "$E_{pot} = m g h = " + T(G, m, 1) + " \\cdot 9{,}81 \\cdot " + h + U.J + " \\approx " + T(G, E, 1) + U.J + "$.", "J");
    }, (lv, G) => {
      const m = G.pick([0.2, 0.5, 1, 2, 5]), v = G.pick([2, 4, 5, 10, 20, 30]), E = 0.5 * m * v * v;
      return num(G, E, 1, "Welche Bewegungsenergie hat ein Körper der Masse $" + T(G, m, 1) + U.kg + "$ bei $" + v + U.ms + "$ (in J)?",
        "$E_{kin} = \\tfrac12 m v^2 = \\tfrac12 \\cdot " + T(G, m, 1) + " \\cdot " + v + "^2" + U.J + " = " + T(G, E, 1) + U.J + "$.", "J");
    }],
    2: [(lv, G) => {
      const h = G.pick([1.25, 2, 5, 10, 20, 45]), m = G.pick([0.1, 0.5, 2, 5]), v = Math.sqrt(2 * g * h);
      return num(G, v, 1, "Eine Kugel ($" + T(G, m, 1) + U.kg + "$) rollt reibungsfrei eine Rampe von $" + T(G, h, 2) + U.m + "$ Höhe hinab. Wie schnell ist sie unten (in m/s)?",
        "Energieerhaltung: $m g h = \\tfrac12 m v^2$, die Masse kürzt sich. $v = \\sqrt{2gh} = \\sqrt{2 \\cdot 9{,}81 \\cdot " + T(G, h, 2) + "}" + U.ms + " \\approx " + T(G, v, 1) + U.ms + "$.", "m/s");
    }, (lv, G) => {
      const v = G.pick([4, 6, 8, 10, 12, 14]), h = v * v / (2 * g);
      return num(G, h, 2, "Ein Skateboarder fährt mit $" + v + U.ms + "$ reibungsfrei eine Halfpipe hinauf. Wie hoch kommt er (in m)?",
        "$\\tfrac12 m v^2 = m g h \\Rightarrow h = \\tfrac{v^2}{2g} = \\tfrac{" + v + "^2}{2 \\cdot 9{,}81}" + U.m + " \\approx " + T(G, h, 2) + U.m + "$.", "m");
    }, (lv, G) => {
      const D = G.pick([50, 100, 200, 400, 500]), x = G.pick([2, 4, 5, 10]), E = 0.5 * D * (x / 100) * (x / 100);
      return num(G, E, 3, "Eine Feder mit $D = " + D + U.Nm + "$ wird um $" + x + "\\,\\mathrm{cm}$ gedehnt. Welche Spannenergie speichert sie (in J)?",
        "$E = \\tfrac12 D s^2 = \\tfrac12 \\cdot " + D + " \\cdot " + T(G, x / 100, 2) + "^2" + U.J + " = " + T(G, E, 3) + U.J + "$.", "J");
    }],
    3: [(lv, G) => {
      const m1 = G.pick([1, 2, 3, 4]), m2 = G.pick([1, 2, 3, 5]), v1 = G.pick([2, 3, 4, 6]), v2 = G.pick([0, 0, -1, 1]);
      const vv = (m1 * v1 + m2 * v2) / (m1 + m2);
      return num(G, vv, 2, "Ein Wagen ($" + m1 + U.kg + "$, $" + v1 + U.ms + "$) stößt auf einen zweiten Wagen ($" + m2 + U.kg + "$, " + (v2 === 0 ? "in Ruhe" : "$" + T(G, v2, 0) + U.ms + "$, positiv in Fahrtrichtung des ersten") + ") und koppelt an. Mit welcher Geschwindigkeit fahren beide weiter (in m/s)?",
        "Impulserhaltung: $m_1 v_1 + m_2 v_2 = (m_1 + m_2) v'$, also $v' = \\tfrac{" + m1 + " \\cdot " + v1 + " + " + m2 + " \\cdot (" + v2 + ")}{" + (m1 + m2) + "}" + U.ms + " \\approx " + T(G, vv, 2) + U.ms + "$.", "m/s");
    }, (lv, G) => {
      const m1 = G.pick([1, 2, 3]), m2 = G.pick([1, 2, 3]), v1 = G.pick([2, 4, 6]);
      const vv = m1 * v1 / (m1 + m2), lost = 0.5 * m1 * v1 * v1 - 0.5 * (m1 + m2) * vv * vv;
      return num(G, lost, 2, "Ein Wagen ($" + m1 + U.kg + "$, $" + v1 + U.ms + "$) koppelt an einen ruhenden Wagen ($" + m2 + U.kg + "$). Wie viel Bewegungsenergie geht beim Stoß verloren (in J)?",
        "Nach dem Stoß $v' = \\tfrac{m_1 v_1}{m_1 + m_2} = " + T(G, vv, 2) + U.ms + "$. Vorher $" + T(G, 0.5 * m1 * v1 * v1, 2) + U.J + "$, nachher $" + T(G, 0.5 * (m1 + m2) * vv * vv, 2) + U.J + "$, Verlust $\\approx " + T(G, lost, 2) + U.J + "$. Beim unelastischen Stoß bleibt der Impuls erhalten, die Bewegungsenergie nicht.", "J");
    }, (lv, G) => {
      const m1 = G.pick([50, 60, 70, 80]), m2 = G.pick([2, 4, 5]), v2 = G.pick([5, 8, 10]), v1 = m2 * v2 / m1;
      return num(G, v1, 2, "Eine Person ($" + m1 + U.kg + "$) steht auf Rollschuhen und wirft einen Ball ($" + m2 + U.kg + "$) mit $" + v2 + U.ms + "$ nach vorn. Wie schnell rollt sie rückwärts (in m/s)?",
        "Vorher ist der Gesamtimpuls null: $0 = m_1 v_1 + m_2 v_2$, also $\\abs{v_1} = \\tfrac{m_2 v_2}{m_1} = \\tfrac{" + m2 + " \\cdot " + v2 + "}{" + m1 + "}" + U.ms + " \\approx " + T(G, v1, 2) + U.ms + "$.", "m/s");
    }],
    4: [(lv, G) => {
      const D = G.pick([200, 400, 500, 800]), x = G.pick([2, 4, 5]), m = G.pick([0.01, 0.02, 0.05]), v = (x / 100) * Math.sqrt(D / m);
      return num(G, v, 2, "Eine Federpistole ($D = " + D + U.Nm + "$, Feder um $" + x + "\\,\\mathrm{cm}$ gespannt) schießt eine Kugel von $" + T(G, m * 1000, 0) + "\\,\\mathrm{g}$ ab. Wie schnell verlässt sie den Lauf (in m/s, ohne Reibung)?",
        "$\\tfrac12 D s^2 = \\tfrac12 m v^2 \\Rightarrow v = s\\sqrt{\\tfrac{D}{m}} = " + T(G, x / 100, 2) + " \\cdot \\sqrt{\\tfrac{" + D + "}{" + T(G, m, 2) + "}}" + U.ms + " \\approx " + T(G, v, 2) + U.ms + "$.", "m/s");
    }, (lv, G) => {
      const m1 = G.pick([1, 2, 3]), m2 = G.pick([1, 2, 4]), v1 = G.pick([3, 4, 6]), v2 = 2 * m1 * v1 / (m1 + m2);
      return num(G, v2, 2, "Elastischer Stoß: Eine Kugel ($" + m1 + U.kg + "$, $" + v1 + U.ms + "$) trifft zentral auf eine ruhende Kugel ($" + m2 + U.kg + "$). Wie schnell ist die gestoßene Kugel danach (in m/s)?",
        "Impuls- und Energieerhaltung ergeben $v_2' = \\tfrac{2 m_1}{m_1 + m_2} v_1 = \\tfrac{2 \\cdot " + m1 + "}{" + (m1 + m2) + "} \\cdot " + v1 + U.ms + " \\approx " + T(G, v2, 2) + U.ms + "$." + (m1 === m2 ? " Bei gleichen Massen tauschen die Kugeln ihre Geschwindigkeiten." : ""), "m/s");
    }, (lv, G) => {
      const v0 = G.pick([2, 3, 5]), h = G.pick([10, 15, 20, 30]), v = Math.sqrt(v0 * v0 + 2 * g * h);
      return num(G, v, 1, "Eine Achterbahn hat oben $" + v0 + U.ms + "$ und fährt reibungsfrei $" + h + U.m + "$ hinab. Wie schnell ist sie unten (in m/s)?",
        "$\\tfrac12 m v_0^2 + m g h = \\tfrac12 m v^2 \\Rightarrow v = \\sqrt{v_0^2 + 2gh} = \\sqrt{" + v0 * v0 + " + 2 \\cdot 9{,}81 \\cdot " + h + "}" + U.ms + " \\approx " + T(G, v, 1) + U.ms + "$.", "m/s");
    }],
  });
  LW.extend("phy-energie", F.statements([
    { lv: 1, ok: true, md: "In einem abgeschlossenen System bleibt die Gesamtenergie erhalten.", why: "Energie wird nur umgewandelt, nicht erzeugt oder vernichtet." },
    { lv: 1, ok: false, md: "Doppelte Geschwindigkeit heißt doppelte Bewegungsenergie.", why: "$E_{kin} = \\tfrac12 m v^2$: doppelte Geschwindigkeit, vierfache Energie." },
    { lv: 2, ok: false, md: "Eine schwerere Kugel kommt aus derselben Höhe schneller unten an.", why: "In $m g h = \\tfrac12 m v^2$ kürzt sich die Masse: $v = \\sqrt{2gh}$." },
    { lv: 2, ok: true, md: "Der Impuls ist eine gerichtete Größe.", why: "$\\vec p = m \\vec v$ hat die Richtung der Geschwindigkeit." },
    { lv: 3, ok: true, md: "Beim unelastischen Stoß bleibt der Impuls erhalten, die Bewegungsenergie aber nicht.", why: "Ein Teil wird zu Verformung und Wärme." },
    { lv: 3, ok: false, md: "Beim elastischen Stoß geht Impuls verloren.", why: "Beim elastischen Stoß bleiben Impuls und Bewegungsenergie erhalten." },
    { lv: 3, ok: true, md: "Stoßen zwei gleich schwere Kugeln elastisch und zentral, tauschen sie ihre Geschwindigkeiten.", why: "Das folgt aus Impuls- und Energieerhaltung mit $m_1 = m_2$." },
    { lv: 4, ok: false, md: "Wenn zwei Körper nach einem Stoß ruhen, war ihr Gesamtimpuls vorher nicht null.", why: "Impulserhaltung: Ruhen beide danach, war der Gesamtimpuls schon vorher null." },
    { lv: 4, ok: true, md: "Ein Rückstoß lässt sich mit der Impulserhaltung erklären.", why: "Wer etwas nach vorn wirft, bekommt den entgegengesetzt gleichen Impuls." },
  ], STMT));
  LW.extend("phy-energie", F.proofs([
    { lv: 3, kind: "direkt", given: "Ein Wagen ($m_1$, $v_1$) koppelt an einen ruhenden Wagen ($m_2$).", claim: "Beide fahren mit $v' = \\dfrac{m_1}{m_1 + m_2}\\,v_1$ weiter.",
      idea: "Impulserhaltung: Gesamtimpuls vorher gleich Gesamtimpuls nachher.",
      steps: [
        s("Impuls vorher: $p = m_1 v_1 + m_2 \\cdot 0 = m_1 v_1$.", "Definition"),
        s("Impuls nachher: $p' = (m_1 + m_2)\\,v'$.", "Definition"),
        s("$p = p'$, also $m_1 v_1 = (m_1 + m_2)\\,v'$.", "Impulserhaltung"),
        s("Nach $v'$ auflösen: $v' = \\tfrac{m_1}{m_1 + m_2}\\,v_1$.", "Umformen"),
      ],
      distractors: [
        d("Bewegungsenergie vorher gleich nachher: $\\tfrac12 m_1 v_1^2 = \\tfrac12 (m_1 + m_2) v'^2$.", "Beim unelastischen Stoß geht Bewegungsenergie verloren; erhalten bleibt der Impuls."),
        d("Impuls nachher: $p' = m_1 v' + m_2 v'^2$.", "Beide Wagen haben dieselbe Geschwindigkeit: $p' = (m_1 + m_2) v'$."),
      ],
      flaw: { line: 2, md: "Die Bewegungsenergie bleibt erhalten, also $m_1 v_1 = (m_1 + m_2)\\,v'$.", why: "Beim unelastischen Stoß bleibt nur der Impuls erhalten. Die Gleichung ist richtig, die Begründung nicht." } },
    { lv: 4, kind: "direkt", given: "Eine Federpistole: Feder mit $D$ um $s$ gespannt, Kugel der Masse $m$, keine Reibung.", claim: "Die Kugel fliegt mit $v = s\\sqrt{\\dfrac{D}{m}}$ los.",
      idea: "Die Spannenergie der Feder wird ganz zu Bewegungsenergie der Kugel.",
      steps: [
        s("Spannenergie der Feder: $E = \\tfrac12 D s^2$.", "Definition"),
        s("Sie wird vollständig zu Bewegungsenergie: $\\tfrac12 D s^2 = \\tfrac12 m v^2$.", "Energieerhaltung"),
        s("Mal 2 und durch $m$: $v^2 = \\tfrac{D}{m}\\,s^2$.", "Umformen"),
        s("Wurzel ziehen: $v = s\\sqrt{\\tfrac{D}{m}}$.", "Wurzel ziehen"),
      ],
      distractors: [
        d("Spannenergie der Feder: $E = D s$.", "Die Federkraft wächst mit der Dehnung; die Energie ist $\\tfrac12 D s^2$."),
        d("Impulserhaltung: $D s = m v$.", "$D s$ ist eine Kraft, kein Impuls."),
      ],
      flaw: { line: 0, md: "Spannenergie der Feder: $E = D s^2$.", why: "Es fehlt der Faktor $\\tfrac12$: Die Kraft steigt beim Spannen von 0 auf $Ds$, im Mittel also $\\tfrac12 D s$." } },
  ], DERIV, { reasons: REASONS }));

  // ================================================================ electric field and capacitor
  gen("phy-kondensator", "Elektrisches Feld", {
    1: [(lv, G) => {
      const Uv = G.pick([100, 200, 230, 400, 500, 1000, 1500, 2000]), dmm = G.pick([2, 4, 5, 8, 10, 20]), E = Uv / dmm;
      return num(G, E, 1, "An einem Plattenkondensator mit $" + dmm + "\\,\\mathrm{mm}$ Plattenabstand liegen $" + Uv + U.V + "$. Wie stark ist das Feld zwischen den Platten (in kV/m)?",
        "Homogenes Feld: $E = \\tfrac{U}{d} = \\tfrac{" + Uv + U.V + "}{" + T(G, dmm / 1000, 3) + U.m + "} = " + T(G, E * 1000, 0) + "\\,\\tfrac{\\mathrm{V}}{\\mathrm{m}} = " + T(G, E, 1) + "\\,\\tfrac{\\mathrm{kV}}{\\mathrm{m}}$.", "kV/m");
    }, (lv, G) => {
      const q = G.pick([2, 5, 10, 20, 50]), E = G.pick([10, 20, 50, 100, 200]), Fm = q * E * 1e-3;
      return num(G, Fm, 3, "Eine Ladung von $" + q + "\\,\\mathrm{nC}$ befindet sich in einem Feld der Stärke $" + E + "\\,\\tfrac{\\mathrm{kV}}{\\mathrm{m}}$. Wie groß ist die Kraft auf sie (in mN)?",
        "$F = q E = " + q + " \\cdot 10^{-9}\\,\\mathrm{C} \\cdot " + E + " \\cdot 10^{3}\\,\\tfrac{\\mathrm{V}}{\\mathrm{m}} = " + T(G, Fm, 3) + "\\,\\mathrm{mN}$.", "mN");
    }],
    2: [(lv, G) => {
      const Acm = G.pick([100, 200, 400, 500, 900]), dmm = G.pick([1, 2, 4, 5]), C = eps0 * Acm * 1e-4 / (dmm * 1e-3) * 1e12;
      return num(G, C, 1, "Ein Plattenkondensator hat Platten von je $" + Acm + "\\,\\mathrm{cm}^2$ im Abstand $" + dmm + "\\,\\mathrm{mm}$, dazwischen Luft. Wie groß ist seine Kapazität (in pF, $\\varepsilon_0 = 8{,}854 \\cdot 10^{-12}\\,\\tfrac{\\mathrm{F}}{\\mathrm{m}}$)?",
        "$C = \\varepsilon_0 \\tfrac{A}{d} = 8{,}854 \\cdot 10^{-12} \\cdot \\tfrac{" + T(G, Acm * 1e-4, 2) + "}{" + T(G, dmm * 1e-3, 3) + "}\\,\\mathrm{F} \\approx " + T(G, C, 1) + "\\,\\mathrm{pF}$.", "pF");
    }, (lv, G) => {
      const C = G.pick([1, 2.2, 4.7, 10, 47, 100]), Uv = G.pick([5, 9, 12, 24, 50]), Q = C * Uv;
      return num(G, Q, 1, "Ein Kondensator mit $C = " + T(G, C, 1) + "\\,\\mu\\mathrm{F}$ wird an $" + Uv + U.V + "$ geladen. Welche Ladung trägt er (in µC)?",
        "$Q = C U = " + T(G, C, 1) + "\\,\\mu\\mathrm{F} \\cdot " + Uv + U.V + " = " + T(G, Q, 1) + "\\,\\mu\\mathrm{C}$.", "µC");
    }, (lv, G) => {
      const f = G.pick([["Plattenabstand verdoppelt", "halbiert", "$C = \\varepsilon_0 \\varepsilon_r \\tfrac{A}{d}$: $d$ steht im Nenner."],
        ["Plattenfläche verdoppelt", "verdoppelt", "$A$ steht im Zähler von $C = \\varepsilon_0 \\varepsilon_r \\tfrac{A}{d}$."],
        ["Glas mit $\\varepsilon_r = 5$ zwischen die Platten geschoben", "verfünffacht", "Ein Dielektrikum vergrößert $C$ um den Faktor $\\varepsilon_r$."],
        ["Spannung verdoppelt", "bleibt gleich", "$C$ hängt nur von Bauform und Material ab; doppelte Spannung heißt doppelte Ladung."]]);
      const all = ["halbiert", "verdoppelt", "verfünffacht", "bleibt gleich", "vervierfacht"];
      return { type: "choice", md: "Ein Plattenkondensator: " + f[0] + ". Was passiert mit seiner Kapazität?",
        options: G.options({ md: f[1], why: f[2] }, G.shuffle(all.filter((o) => o !== f[1])).map((o) => ({ md: o, why: f[2] }))), explain: f[2] };
    }],
    3: [(lv, G) => {
      const UB = G.pick([50, 100, 200, 500, 1000, 2000, 5000]), v = Math.sqrt(2 * e * UB / me);
      return num(G, v / 1e6, 2, "Ein Elektron wird aus der Ruhe mit der Spannung $U_B = " + UB + U.V + "$ beschleunigt. Wie schnell ist es danach (in $10^6$ m/s)?",
        "$e U_B = \\tfrac12 m_e v^2 \\Rightarrow v = \\sqrt{\\tfrac{2 e U_B}{m_e}} = \\sqrt{\\tfrac{2 \\cdot 1{,}602 \\cdot 10^{-19} \\cdot " + UB + "}{9{,}109 \\cdot 10^{-31}}}" + U.ms + " \\approx " + T(G, v / 1e6, 2) + " \\cdot 10^6" + U.ms + "$.", "10⁶ m/s");
    }, (lv, G) => {
      const UB = G.pick([100, 250, 500, 1000, 4000]), EJ = e * UB;
      return num(G, EJ * 1e17, 3, "Ein Elektron durchläuft aus der Ruhe die Spannung $" + UB + U.V + "$. Welche Bewegungsenergie hat es dann (in $10^{-17}$ J)?",
        "$E = e U = 1{,}602 \\cdot 10^{-19}\\,\\mathrm{C} \\cdot " + UB + U.V + " \\approx " + T(G, EJ * 1e17, 3) + " \\cdot 10^{-17}" + U.J + "$, also genau $" + UB + U.eV + "$.", "10⁻¹⁷ J");
    }, (lv, G) => {
      const C = G.pick([10, 47, 100, 470, 1000]), Uv = G.pick([5, 10, 12, 20]), W = 0.5 * C * 1e-6 * Uv * Uv * 1000;
      return num(G, W, 2, "Wie viel Energie speichert ein Kondensator mit $" + C + "\\,\\mu\\mathrm{F}$ bei $" + Uv + U.V + "$ (in mJ)?",
        "$W = \\tfrac12 C U^2 = \\tfrac12 \\cdot " + C + " \\cdot 10^{-6} \\cdot " + Uv + "^2" + U.J + " = " + T(G, W, 2) + "\\,\\mathrm{mJ}$.", "mJ");
    }],
    4: [(lv, G) => {
      const dcm = G.pick([2, 4, 5]), UB = G.pick([500, 1000, 2000]), x = G.pick([5, 8, 10]);
      let Uy = G.pick([50, 100, 150, 200, 300]);
      while (Uy * x * x / (4 * dcm * UB) >= dcm / 2) Uy /= 2;
      const y = Uy * x * x / (4 * dcm * UB);
      return num(G, y, 2, "Elektronen mit $U_B = " + UB + U.V + "$ fliegen mittig in einen Plattenkondensator ($d = " + dcm + "\\,\\mathrm{cm}$, Ablenkspannung $" + T(G, Uy, 1) + U.V + "$). Wie weit sind sie nach $x = " + x + "\\,\\mathrm{cm}$ abgelenkt (in cm)?",
        "Bahnkurve $y = \\tfrac{U}{4 d U_B}\\,x^2$ (Masse und Ladung kürzen sich): $y = \\tfrac{" + T(G, Uy, 1) + "}{4 \\cdot " + dcm + " \\cdot " + UB + "} \\cdot " + x + "^2\\,\\mathrm{cm} \\approx " + T(G, y, 2) + "\\,\\mathrm{cm}$.", "cm");
    }],
  });
  LW.extend("phy-kondensator", F.statements([
    { lv: 1, ok: true, md: "Feldlinien zeigen von der positiven zur negativen Ladung.", why: "So ist die Richtung festgelegt: die Kraftrichtung auf eine positive Probeladung." },
    { lv: 1, ok: false, md: "Elektrische Feldlinien können sich kreuzen.", why: "An jedem Punkt hat das Feld genau eine Richtung." },
    { lv: 2, ok: true, md: "Zwischen den Platten eines Plattenkondensators ist das Feld nahezu homogen.", why: "Die Feldlinien verlaufen parallel und gleich dicht, nur am Rand nicht." },
    { lv: 2, ok: false, md: "Ein Elektron im Kondensator wird zur negativen Platte hin beschleunigt.", why: "Negative Ladungen werden von der positiven Platte angezogen." },
    { lv: 3, ok: true, md: "Ein Elektron, das quer zum Feld in einen Kondensator fliegt, beschreibt eine Parabel.", why: "Quer zum Feld gleichförmig, längs des Feldes gleichmäßig beschleunigt, wie beim waagerechten Wurf." },
    { lv: 3, ok: false, md: "Die Ablenkung im Kondensator hängt von der Masse der Teilchen ab, wenn alle mit derselben Spannung beschleunigt wurden.", why: "Mit $v_0^2 = \\tfrac{2qU_B}{m}$ kürzen sich Ladung und Masse: $y = \\tfrac{U x^2}{4 d U_B}$." },
    { lv: 4, ok: true, md: "Trennt man einen geladenen Kondensator von der Quelle und zieht die Platten auseinander, steigt die Spannung.", why: "Die Ladung bleibt, die Kapazität sinkt, also wächst $U = \\tfrac{Q}{C}$." },
    { lv: 4, ok: false, md: "Bleibt ein Kondensator an der Quelle und man halbiert den Plattenabstand, halbiert sich die Ladung.", why: "Die Spannung bleibt, $C$ verdoppelt sich, also verdoppelt sich $Q = CU$." },
  ], STMT));
  LW.extend("phy-kondensator", F.proofs([
    { lv: 3, kind: "direkt", given: "Ein Elektron (Ladung $e$, Masse $m_e$) startet in Ruhe und durchläuft die Spannung $U_B$.", claim: "$v = \\sqrt{\\dfrac{2 e U_B}{m_e}}$.",
      idea: "Die elektrische Arbeit wird vollständig zu Bewegungsenergie.",
      steps: [
        s("Das Feld verrichtet am Elektron die Arbeit $W = e U_B$.", "Definition"),
        s("Sie wird ganz zu Bewegungsenergie: $e U_B = \\tfrac12 m_e v^2$.", "Energieerhaltung"),
        s("Umstellen: $v^2 = \\tfrac{2 e U_B}{m_e}$.", "Umformen"),
        s("Wurzel ziehen: $v = \\sqrt{\\tfrac{2 e U_B}{m_e}}$.", "Wurzel ziehen"),
      ],
      distractors: [
        d("Das Feld verrichtet die Arbeit $W = \\tfrac{U_B}{e}$.", "Arbeit ist Ladung mal Spannung: $W = e U_B$."),
        d("$e U_B = m_e v^2$.", "Die Bewegungsenergie ist $\\tfrac12 m_e v^2$."),
      ],
      flaw: { line: 1, md: "Sie wird ganz zu Bewegungsenergie: $e U_B = m_e v^2$.", why: "Bewegungsenergie ist $\\tfrac12 m_e v^2$; ohne den Faktor $\\tfrac12$ kommt eine zu kleine Geschwindigkeit heraus." } },
    { lv: 4, kind: "direkt", given: "Ein Elektron fliegt mit $v_0$ parallel zu den Platten (Abstand $d$, Spannung $U$) in einen Kondensator.", claim: "Die Bahn ist die Parabel $y = \\dfrac{e U}{2 m_e d v_0^2}\\,x^2$.",
      idea: "Die Bewegung zerfällt wie beim waagerechten Wurf in eine gleichförmige und eine gleichmäßig beschleunigte.",
      steps: [
        s("Längs der Platten keine Kraft: $x = v_0 t$.", "Weg-Zeit-Gesetz"),
        s("Quer dazu die Kraft $F = e\\tfrac{U}{d}$, also $a = \\tfrac{e U}{m_e d}$.", "Newtons zweites Gesetz"),
        s("Quer: $y = \\tfrac12 a t^2$.", "Weg-Zeit-Gesetz"),
        s("$t = \\tfrac{x}{v_0}$ einsetzen: $y = \\tfrac{e U}{2 m_e d v_0^2}\\,x^2$.", "Einsetzen"),
      ],
      distractors: [
        d("Längs der Platten: $x = \\tfrac12 a t^2$.", "Längs der Platten wirkt keine Kraft, dort ist die Bewegung gleichförmig."),
        d("Quer: $y = a t$.", "$a t$ ist die Geschwindigkeit quer zu den Platten, nicht der Weg."),
      ],
      flaw: { line: 1, md: "Quer dazu die Kraft $F = e U d$, also $a = \\tfrac{e U d}{m_e}$.", why: "Die Feldstärke ist $E = \\tfrac{U}{d}$; der Abstand steht im Nenner." } },
  ], DERIV, { reasons: REASONS }));

  // ================================================================ harmonic oscillation
  gen("phy-schwingung", "Schwingungen", {
    1: [(lv, G) => {
      if (G.chance(0.5)) {
        const T0 = G.pick([0.2, 0.25, 0.5, 2, 4, 5]);
        return num(G, 1 / T0, 2, "Ein Pendel braucht für eine volle Schwingung $" + T(G, T0, 2) + U.s + "$. Wie groß ist seine Frequenz (in Hz)?",
          "$f = \\tfrac{1}{T} = \\tfrac{1}{" + T(G, T0, 2) + U.s + "} = " + T(G, 1 / T0, 2) + U.Hz + "$.", "Hz");
      }
      const f = G.pick([2, 4, 5, 8, 10, 20, 50]);
      return num(G, 1000 / f, 1, "Eine Schwingung hat die Frequenz $" + f + U.Hz + "$. Wie lange dauert eine Periode (in ms)?",
        "$T = \\tfrac1f = \\tfrac{1}{" + f + "}" + U.s + " = " + T(G, 1000 / f, 1) + "\\,\\mathrm{ms}$.", "ms");
    }, (lv, G) => {
      const f = G.pick([0.5, 1, 2, 5, 10]);
      return num(G, 2 * Math.PI * f, 2, "Wie groß ist die Kreisfrequenz $\\omega$ einer Schwingung mit $f = " + T(G, f, 1) + U.Hz + "$ (in 1/s)?",
        "$\\omega = 2\\pi f = 2\\pi \\cdot " + T(G, f, 1) + "\\,\\tfrac1{\\mathrm{s}} \\approx " + T(G, 2 * Math.PI * f, 2) + "\\,\\tfrac1{\\mathrm{s}}$.", "1/s");
    }],
    2: [(lv, G) => {
      const m = G.pick([0.1, 0.2, 0.25, 0.5, 1, 2]), D = G.pick([10, 20, 25, 40, 50, 100]), T0 = 2 * Math.PI * Math.sqrt(m / D);
      return num(G, T0, 2, "Ein Federpendel: Masse $" + T(G, m, 2) + U.kg + "$, Federkonstante $" + D + U.Nm + "$. Wie groß ist die Periodendauer (in s)?",
        "$T = 2\\pi\\sqrt{\\tfrac{m}{D}} = 2\\pi\\sqrt{\\tfrac{" + T(G, m, 2) + "}{" + D + "}}" + U.s + " \\approx " + T(G, T0, 2) + U.s + "$.", "s");
    }, (lv, G) => {
      const m = G.pick([0.2, 0.5, 1, 2]), T0 = G.pick([0.5, 1, 1.5, 2]), D = 4 * Math.PI * Math.PI * m / (T0 * T0);
      return num(G, D, 1, "Ein Körper von $" + T(G, m, 1) + U.kg + "$ schwingt an einer Feder mit der Periode $" + T(G, T0, 1) + U.s + "$. Wie groß ist die Federkonstante (in N/m)?",
        "Aus $T = 2\\pi\\sqrt{\\tfrac{m}{D}}$ folgt $D = \\tfrac{4\\pi^2 m}{T^2} = \\tfrac{4\\pi^2 \\cdot " + T(G, m, 1) + "}{" + T(G, T0, 1) + "^2}" + U.Nm + " \\approx " + T(G, D, 1) + U.Nm + "$.", "N/m");
    }],
    3: [(lv, G) => {
      const l = G.pick([0.25, 0.5, 1, 1.5, 2]);
      if (G.chance(0.5)) return num(G, 2 * Math.PI * Math.sqrt(l / g), 2, "Ein Fadenpendel ist $" + T(G, l, 2) + U.m + "$ lang und schwingt mit kleiner Auslenkung. Wie groß ist seine Periodendauer (in s)?",
        "$T = 2\\pi\\sqrt{\\tfrac{l}{g}} = 2\\pi\\sqrt{\\tfrac{" + T(G, l, 2) + "}{9{,}81}}" + U.s + " \\approx " + T(G, 2 * Math.PI * Math.sqrt(l / g), 2) + U.s + "$.", "s");
      const T0 = G.pick([1, 1.5, 2, 3]), L = g * T0 * T0 / (4 * Math.PI * Math.PI);
      return num(G, L, 2, "Wie lang muss ein Fadenpendel sein, damit eine volle Schwingung $" + T(G, T0, 1) + U.s + "$ dauert (in m)?",
        "$l = \\tfrac{g T^2}{4\\pi^2} = \\tfrac{9{,}81 \\cdot " + T(G, T0, 1) + "^2}{4\\pi^2}" + U.m + " \\approx " + T(G, L, 2) + U.m + "$.", "m");
    }, (lv, G) => {
      const c = G.pick([
        ["Beim Federpendel wird die Masse vervierfacht.", "Die Periode verdoppelt sich.", "$T \\sim \\sqrt{m}$: vierfache Masse, doppelte Periode."],
        ["Beim Fadenpendel wird die Länge vervierfacht.", "Die Periode verdoppelt sich.", "$T \\sim \\sqrt{l}$: vierfache Länge, doppelte Periode."],
        ["Beim Fadenpendel wird die Masse verdoppelt.", "Die Periode bleibt gleich.", "In $T = 2\\pi\\sqrt{\\tfrac{l}{g}}$ kommt die Masse nicht vor."],
        ["Beim Federpendel wird die Federkonstante vervierfacht.", "Die Periode halbiert sich.", "$T \\sim \\tfrac{1}{\\sqrt{D}}$: vierfaches $D$, halbe Periode."],
        ["Bei einer harmonischen Schwingung wird die Amplitude verdoppelt.", "Die Periode bleibt gleich.", "Die Periode einer harmonischen Schwingung hängt nicht von der Amplitude ab."],
      ]);
      const all = ["Die Periode verdoppelt sich.", "Die Periode bleibt gleich.", "Die Periode halbiert sich.", "Die Periode vervierfacht sich."];
      return { type: "choice", md: c[0] + " Was passiert mit der Periodendauer?", options: G.options({ md: c[1], why: c[2] }, G.shuffle(all.filter((o) => o !== c[1])).map((o) => ({ md: o, why: c[2] }))), explain: c[2] };
    }],
    4: [(lv, G) => {
      const A = G.pick([2, 3, 4, 5]), T0 = G.pick([1, 2, 4]), t = G.pick([0.1, 0.2, 0.3, 0.6, 0.7, 1.3]), y = A * Math.sin(2 * Math.PI * t / T0);
      return num(G, y, 2, "Eine Schwingung $y(t) = \\hat y \\sin\\!\\left(\\tfrac{2\\pi}{T} t\\right)$ mit $\\hat y = " + A + "\\,\\mathrm{cm}$ und $T = " + T0 + U.s + "$. Wie groß ist die Auslenkung nach $t = " + T(G, t, 1) + U.s + "$ (in cm, mit Vorzeichen)?",
        "$y = " + A + " \\cdot \\sin\\!\\left(\\tfrac{2\\pi \\cdot " + T(G, t, 1) + "}{" + T0 + "}\\right)\\mathrm{cm} \\approx " + T(G, y, 2) + "\\,\\mathrm{cm}$ (Taschenrechner im Bogenmaß).", "cm");
    }, (lv, G) => {
      const A = G.pick([2, 4, 5, 10]), f = G.pick([0.5, 1, 2, 5]), vmax = A / 100 * 2 * Math.PI * f;
      return num(G, vmax, 3, "Ein Federpendel schwingt mit der Amplitude $" + A + "\\,\\mathrm{cm}$ und der Frequenz $" + T(G, f, 1) + U.Hz + "$. Wie groß ist die größte Geschwindigkeit (in m/s)?",
        "$\\hat v = \\hat y\\,\\omega = " + T(G, A / 100, 2) + U.m + " \\cdot 2\\pi \\cdot " + T(G, f, 1) + "\\,\\tfrac1{\\mathrm{s}} \\approx " + T(G, vmax, 3) + U.ms + "$, erreicht beim Durchgang durch die Ruhelage.", "m/s");
    }, (lv, G) => {
      const D = G.pick([20, 50, 100, 200]), A = G.pick([2, 5, 8, 10]), E = 0.5 * D * (A / 100) * (A / 100);
      return num(G, E, 3, "Ein Federpendel ($D = " + D + U.Nm + "$) schwingt mit $" + A + "\\,\\mathrm{cm}$ Amplitude, ohne Dämpfung. Wie groß ist seine Gesamtenergie (in J)?",
        "Im Umkehrpunkt steckt alles in der Feder: $E = \\tfrac12 D \\hat y^2 = \\tfrac12 \\cdot " + D + " \\cdot " + T(G, A / 100, 2) + "^2" + U.J + " = " + T(G, E, 3) + U.J + "$.", "J");
    }],
  });
  LW.extend("phy-schwingung", F.statements([
    { lv: 1, ok: true, md: "Eine harmonische Schwingung entsteht, wenn die Rückstellkraft proportional zur Auslenkung ist.", why: "$F = -D y$ führt auf eine Sinusschwingung." },
    { lv: 1, ok: false, md: "Frequenz und Periodendauer sind dasselbe.", why: "Sie sind Kehrwerte: $f = \\tfrac1T$." },
    { lv: 2, ok: true, md: "In der Ruhelage ist die Geschwindigkeit des Pendelkörpers am größten.", why: "Dort steckt die ganze Energie in der Bewegung." },
    { lv: 2, ok: false, md: "Im Umkehrpunkt ist die Beschleunigung null.", why: "Im Umkehrpunkt ist die Rückstellkraft und damit die Beschleunigung am größten; null ist dort die Geschwindigkeit." },
    { lv: 3, ok: true, md: "Bei einer gedämpften Schwingung nimmt die Amplitude ab, die Periode bleibt nahezu gleich.", why: "Bei schwacher Dämpfung ändert sich die Eigenfrequenz kaum." },
    { lv: 3, ok: false, md: "Ein Fadenpendel schwingt auf dem Mond genauso schnell wie auf der Erde.", why: "$T = 2\\pi\\sqrt{\\tfrac{l}{g}}$; auf dem Mond ist $g$ kleiner, die Periode länger." },
    { lv: 4, ok: true, md: "Resonanz tritt auf, wenn die Erregerfrequenz nahe der Eigenfrequenz liegt.", why: "Dann wird bei jeder Schwingung im richtigen Takt Energie zugeführt." },
    { lv: 4, ok: false, md: "Geschwindigkeit und Auslenkung einer harmonischen Schwingung sind in Phase.", why: "Die Geschwindigkeit ist um eine Viertelperiode verschoben: maximal, wenn die Auslenkung null ist." },
  ], STMT));
  LW.extend("phy-schwingung", F.proofs([
    { lv: 3, kind: "direkt", given: "Ein Körper der Masse $m$ hängt an einer Feder mit der Federkonstanten $D$. Ansatz $y(t) = \\hat y \\sin(\\omega t)$.", claim: "$T = 2\\pi\\sqrt{\\dfrac{m}{D}}$.",
      idea: "Newtons zweites Gesetz mit der Rückstellkraft $-Dy$ und der zweiten Ableitung des Ansatzes vergleichen.",
      steps: [
        s("Rückstellkraft der Feder: $F = -D y$.", "Definition"),
        s("Newton: $m \\ddot y = -D y$.", "Newtons zweites Gesetz"),
        s("Mit dem Ansatz ist $\\ddot y = -\\omega^2 y$, also $m\\omega^2 = D$.", "Einsetzen"),
        s("$\\omega = \\sqrt{\\tfrac{D}{m}}$ und $T = \\tfrac{2\\pi}{\\omega} = 2\\pi\\sqrt{\\tfrac{m}{D}}$.", "Umformen"),
      ],
      distractors: [
        d("Mit dem Ansatz ist $\\ddot y = \\omega^2 y$.", "Zweimal ableiten ergibt $-\\omega^2 \\hat y \\sin(\\omega t) = -\\omega^2 y$."),
        d("$T = \\tfrac{\\omega}{2\\pi}$.", "Das ist die Frequenz $f$; die Periode ist $\\tfrac{2\\pi}{\\omega}$."),
      ],
      flaw: { line: 3, md: "$\\omega = \\sqrt{\\tfrac{D}{m}}$ und $T = \\tfrac{\\omega}{2\\pi} = \\tfrac{1}{2\\pi}\\sqrt{\\tfrac{D}{m}}$.", why: "$\\tfrac{\\omega}{2\\pi}$ ist die Frequenz. Die Periode ist ihr Kehrwert $\\tfrac{2\\pi}{\\omega}$." } },
    { lv: 4, kind: "direkt", given: "Ein ungedämpftes Federpendel schwingt mit der Amplitude $\\hat y$.", claim: "Die größte Geschwindigkeit ist $\\hat v = \\hat y\\,\\omega$ mit $\\omega = \\sqrt{\\tfrac{D}{m}}$.",
      idea: "Energieerhaltung zwischen Umkehrpunkt und Ruhelage.",
      steps: [
        s("Im Umkehrpunkt: $E = \\tfrac12 D \\hat y^2$, keine Bewegungsenergie.", "Definition"),
        s("In der Ruhelage: $E = \\tfrac12 m \\hat v^2$, keine Spannenergie.", "Definition"),
        s("$\\tfrac12 D \\hat y^2 = \\tfrac12 m \\hat v^2$.", "Energieerhaltung"),
        s("$\\hat v = \\hat y\\sqrt{\\tfrac{D}{m}} = \\hat y\\,\\omega$.", "Wurzel ziehen"),
      ],
      distractors: [
        d("In der Ruhelage ist die Geschwindigkeit null.", "Null ist sie in den Umkehrpunkten; in der Ruhelage ist sie am größten."),
        d("$\\hat v = \\hat y \\cdot \\tfrac{D}{m}$.", "Beim Auflösen muss die Wurzel gezogen werden."),
      ],
      flaw: { line: 1, md: "In der Ruhelage: $E = \\tfrac12 m \\hat v^2 + \\tfrac12 D \\hat y^2$.", why: "In der Ruhelage ist die Feder entspannt, Spannenergie gibt es dort nicht." } },
  ], DERIV, { reasons: REASONS }));

  // ================================================================ photoelectric effect
  const METALS = [["Cäsium", 1.94], ["Kalium", 2.25], ["Natrium", 2.28], ["Barium", 2.52], ["Calcium", 2.87], ["Zink", 4.27]];
  gen("phy-photoeffekt", "Photoeffekt", {
    1: [(lv, G) => {
      const lam = G.pick([400, 450, 500, 550, 600, 650, 700]), E = 1240 / lam;
      return num(G, E, 2, "Welche Energie hat ein Photon des Lichts mit $\\lambda = " + lam + "\\,\\mathrm{nm}$ (in eV)?",
        "$E = h f = \\tfrac{h c}{\\lambda}$, mit $h c \\approx 1240\\,\\mathrm{eV \\cdot nm}$: $E = \\tfrac{1240}{" + lam + "}" + U.eV + " \\approx " + T(G, E, 2) + U.eV + "$.", "eV");
    }, (lv, G) => {
      const lam = G.pick([400, 450, 500, 600, 750]), f = 3e8 / (lam * 1e-9);
      return num(G, f / 1e14, 2, "Welche Frequenz hat Licht der Wellenlänge $" + lam + "\\,\\mathrm{nm}$ (in $10^{14}$ Hz)?",
        "$f = \\tfrac{c}{\\lambda} = \\tfrac{3 \\cdot 10^8}{" + lam + " \\cdot 10^{-9}}" + U.Hz + " = " + T(G, f / 1e14, 2) + " \\cdot 10^{14}" + U.Hz + "$.", "10¹⁴ Hz");
    }],
    2: [(lv, G) => {
      const [name, W] = G.pick(METALS.slice(0, 5));
      const lam = G.pick([250, 300, 350, 400, 420].filter((l) => 1240 / l > W + 0.1)), Ek = 1240 / lam - W;
      return num(G, Ek, 2, "Licht mit $\\lambda = " + lam + "\\,\\mathrm{nm}$ fällt auf " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$). Welche größte Bewegungsenergie haben die Photoelektronen (in eV)?",
        "Photonenenergie $\\tfrac{1240}{" + lam + "}" + U.eV + " \\approx " + T(G, 1240 / lam, 2) + U.eV + "$. $E_{kin} = h f - W_A \\approx " + T(G, Ek, 2) + U.eV + "$.", "eV");
    }, (lv, G) => {
      const [name, W] = G.pick(METALS);
      if (G.chance(0.5)) return num(G, W / hEV / 1e14, 2, "Ab welcher Frequenz löst Licht aus " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$) Elektronen aus (in $10^{14}$ Hz)?",
        "Grenzfrequenz $f_G = \\tfrac{W_A}{h} = \\tfrac{" + T(G, W, 2) + "}{4{,}136 \\cdot 10^{-15}}" + U.Hz + " \\approx " + T(G, W / hEV / 1e14, 2) + " \\cdot 10^{14}" + U.Hz + "$.", "10¹⁴ Hz");
      return num(G, 1240 / W, 0, "Welche Wellenlänge darf Licht höchstens haben, um aus " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$) Elektronen zu lösen (in nm)?",
        "Grenzwellenlänge $\\lambda_G = \\tfrac{h c}{W_A} = \\tfrac{1240}{" + T(G, W, 2) + "}\\,\\mathrm{nm} \\approx " + T(G, 1240 / W, 0) + "\\,\\mathrm{nm}$. Längere Wellen haben zu wenig Energie pro Photon.", "nm");
    }, (lv, G) => {
      const [name, W] = G.pick(METALS), lam = G.pick([300, 400, 500, 600]), E = 1240 / lam, yes = E > W;
      const why = "Photonenenergie $\\tfrac{1240}{" + lam + "}" + U.eV + " \\approx " + T(G, E, 2) + U.eV + "$, Austrittsarbeit $" + T(G, W, 2) + U.eV + "$. " + (yes ? "Das reicht." : "Das reicht nicht, auch nicht bei großer Intensität.");
      return { type: "choice", md: "Löst Licht mit $\\lambda = " + lam + "\\,\\mathrm{nm}$ aus " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$) Elektronen aus?",
        options: [{ md: "Ja, bei jeder Intensität", correct: yes, why }, { md: "Nein, bei keiner Intensität", correct: !yes, why }, { md: "Nur bei hoher Intensität", correct: false, why: "Ob Elektronen austreten, hängt an der Energie des einzelnen Photons, nicht an der Intensität." }], explain: why };
    }],
    3: [(lv, G) => {
      const [name, W] = G.pick(METALS.slice(0, 5)), lam = G.pick([250, 300, 350, 400]), U0 = 1240 / lam - W;
      return num(G, U0, 2, "Gegenfeldmethode: Licht mit $\\lambda = " + lam + "\\,\\mathrm{nm}$ auf " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$). Bei welcher Gegenspannung kommt kein Elektron mehr an der Anode an (in V)?",
        "$e U_0 = h f - W_A \\approx " + T(G, 1240 / lam, 2) + U.eV + " - " + T(G, W, 2) + U.eV + " = " + T(G, U0, 2) + U.eV + "$, also $U_0 \\approx " + T(G, U0, 2) + U.V + "$.", "V");
    }, (lv, G) => {
      const W = G.pick([1.9, 2.2, 2.3]), f1 = G.pick([6, 7]), f2 = f1 + G.pick([2, 3, 4]);
      // h from the rounded values the task shows, so the expected answer is what the learner can compute
      const U1 = G.round(0.4136 * f1 - W, 2), U2 = G.round(0.4136 * f2 - W, 2), h = (U2 - U1) / (f2 - f1) * 1.602 * 1e-19 / 1e14 * 1e34;
      return num(G, h, 2, "Zwei Messungen mit der Gegenfeldmethode: bei $f_1 = " + f1 + " \\cdot 10^{14}" + U.Hz + "$ ist $U_1 = " + T(G, U1, 2) + U.V + "$, bei $f_2 = " + f2 + " \\cdot 10^{14}" + U.Hz + "$ ist $U_2 = " + T(G, U2, 2) + U.V + "$. Bestimme $h$ (in $10^{-34}$ Js).",
        "Die Steigung der Einstein-Geraden ist $\\tfrac{h}{e}$: $h = e\\,\\tfrac{U_2 - U_1}{f_2 - f_1} = 1{,}602 \\cdot 10^{-19} \\cdot \\tfrac{" + T(G, U2 - U1, 2) + "}{" + (f2 - f1) + " \\cdot 10^{14}}\\,\\mathrm{Js} \\approx " + T(G, h, 2) + " \\cdot 10^{-34}\\,\\mathrm{Js}$.", "10⁻³⁴ Js",
        { tolerance: 0.06 });
    }],
    4: [(lv, G) => {
      const P = G.pick([1, 2, 5]), lam = G.pick([450, 500, 600, 650]), N = P * 1e-3 * lam * 1e-9 / (6.626e-34 * 3e8);
      return num(G, N / 1e15, 2, "Ein Laserpointer strahlt $" + P + "\\,\\mathrm{mW}$ bei $\\lambda = " + lam + "\\,\\mathrm{nm}$ ab. Wie viele Photonen sendet er pro Sekunde aus (in $10^{15}$)?",
        "Ein Photon trägt $E = \\tfrac{hc}{\\lambda} = " + T(G, 6.626e-34 * 3e8 / (lam * 1e-9) * 1e19, 3) + " \\cdot 10^{-19}" + U.J + "$. $N = \\tfrac{P}{E} \\approx " + T(G, N / 1e15, 2) + " \\cdot 10^{15}$ pro Sekunde.", "10¹⁵ /s");
    }, (lv, G) => {
      const [name, W] = G.pick(METALS.slice(0, 4)), lam = G.pick([200, 250, 300]), Ek = 1240 / lam - W, v = Math.sqrt(2 * Ek * e / me);
      return num(G, v / 1e6, 2, "UV-Licht ($" + lam + "\\,\\mathrm{nm}$) trifft auf " + name + " ($W_A = " + T(G, W, 2) + U.eV + "$). Wie schnell sind die schnellsten Photoelektronen (in $10^6$ m/s)?",
        "$E_{kin} = " + T(G, 1240 / lam, 2) + U.eV + " - " + T(G, W, 2) + U.eV + " = " + T(G, Ek, 2) + U.eV + "$. $v = \\sqrt{\\tfrac{2E_{kin}}{m_e}} \\approx " + T(G, v / 1e6, 2) + " \\cdot 10^6" + U.ms + "$.", "10⁶ m/s");
    }],
  });
  LW.extend("phy-photoeffekt", F.statements([
    { lv: 1, ok: true, md: "Die Energie eines Photons ist proportional zur Frequenz des Lichts.", why: "$E = h f$." },
    { lv: 1, ok: false, md: "Helleres Licht derselben Farbe löst schnellere Elektronen aus.", why: "Mehr Intensität heißt mehr Photonen, also mehr Elektronen, aber jedes mit derselben Höchstenergie." },
    { lv: 2, ok: true, md: "Unterhalb der Grenzfrequenz treten keine Elektronen aus, egal wie hell das Licht ist.", why: "Ein einzelnes Photon hat dann zu wenig Energie für die Austrittsarbeit." },
    { lv: 2, ok: false, md: "Die Steigung der Einstein-Geraden hängt vom Metall ab.", why: "Die Steigung ist $\\tfrac{h}{e}$, für alle Metalle gleich; das Metall verschiebt die Gerade nur über $W_A$." },
    { lv: 3, ok: true, md: "Die Elektronen treten ohne messbare Verzögerung aus, auch bei sehr schwachem Licht.", why: "Ein Photon gibt seine Energie auf einmal ab; im Wellenmodell müsste sich Energie erst ansammeln." },
    { lv: 3, ok: false, md: "Der Photoeffekt lässt sich mit dem Wellenmodell des Lichts vollständig erklären.", why: "Grenzfrequenz und fehlende Verzögerung passen nicht zum Wellenmodell, nur zum Photonenmodell." },
    { lv: 4, ok: true, md: "Aus dem Schnittpunkt der Einstein-Geraden mit der Frequenzachse liest man die Grenzfrequenz ab.", why: "Dort ist $E_{kin} = 0$, also $h f_G = W_A$." },
    { lv: 4, ok: false, md: "Die Gegenspannung, bei der kein Strom mehr fließt, hängt von der Intensität des Lichts ab.", why: "$U_0$ misst die Höchstenergie einzelner Elektronen; die hängt nur von $f$ und $W_A$ ab." },
  ], STMT));
  LW.extend("phy-photoeffekt", F.proofs([
    { lv: 3, kind: "direkt", given: "Licht der Frequenz $f$ fällt auf ein Metall mit der Austrittsarbeit $W_A$; gemessen wird die Gegenspannung $U_0$.", claim: "$U_0 = \\dfrac{h}{e}\\,f - \\dfrac{W_A}{e}$ (Einstein-Gerade).",
      idea: "Energiebilanz für ein Photon, dann die Höchstenergie über die Gegenspannung ausdrücken.",
      steps: [
        s("Ein Photon gibt seine ganze Energie $h f$ an ein Elektron ab.", "Definition"),
        s("$h f = W_A + E_{kin,max}$.", "Energieerhaltung"),
        s("Die schnellsten Elektronen werden gerade gestoppt: $E_{kin,max} = e U_0$.", "Definition"),
        s("$e U_0 = h f - W_A$, also $U_0 = \\tfrac{h}{e}\\,f - \\tfrac{W_A}{e}$.", "Umformen"),
      ],
      distractors: [
        d("$h f = W_A - E_{kin,max}$.", "Die Photonenenergie reicht für die Austrittsarbeit, der Rest bleibt als Bewegungsenergie: Summe, nicht Differenz."),
        d("Die Energie der Elektronen hängt von der Intensität ab.", "Die Intensität bestimmt die Zahl der Elektronen, nicht ihre Energie."),
      ],
      flaw: { line: 1, md: "$h f = W_A - E_{kin,max}$.", why: "Die Photonenenergie teilt sich auf: Austrittsarbeit plus Bewegungsenergie." } },
    { lv: 4, kind: "direkt", given: "Ein Metall hat die Austrittsarbeit $W_A$.", claim: "Elektronen treten nur bei $\\lambda \\le \\lambda_G = \\dfrac{h c}{W_A}$ aus.",
      idea: "Ein Photon muss mindestens die Austrittsarbeit liefern; dann $f = \\tfrac{c}{\\lambda}$ einsetzen.",
      steps: [
        s("Austritt ist nur möglich, wenn $h f \\ge W_A$.", "Energieerhaltung"),
        s("Mit $f = \\tfrac{c}{\\lambda}$: $\\tfrac{h c}{\\lambda} \\ge W_A$.", "Einsetzen"),
        s("Umstellen: $\\lambda \\le \\tfrac{h c}{W_A}$.", "Umformen"),
      ],
      distractors: [
        d("Mit $f = c \\cdot \\lambda$: $h c \\lambda \\ge W_A$.", "Es ist $f = \\tfrac{c}{\\lambda}$."),
        d("Umstellen: $\\lambda \\ge \\tfrac{h c}{W_A}$.", "Beim Auflösen nach $\\lambda$ im Nenner dreht sich die Ungleichung um."),
      ],
      flaw: { line: 2, md: "Umstellen: $\\lambda \\ge \\tfrac{h c}{W_A}$.", why: "$\\lambda$ steht im Nenner: Je kürzer die Welle, desto energiereicher das Photon. Also $\\lambda \\le \\tfrac{hc}{W_A}$." } },
  ], DERIV, { reasons: REASONS }));
})();
