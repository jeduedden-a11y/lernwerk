// Calculation tasks for every quantitative task type of the physics course (Abitur Hessen, E-Phase to Q4).
// One generator, phy-rechnen, with params.typ naming the task type (a list picks one at random).
//   Level 1: compute the result from given values.
//   Level 2: the values come in everyday units (cm, g, km/h, mT, nm, ...): convert first.
//   Level 3: the formula backwards: the result is given, one input is wanted.
//   Level 4: proportional reasoning: one input is doubled, halved, ... by what factor does the result change?
//            Where the result is no power law of any input, a backward task in everyday units.
// A spec: v = inputs { key: [symbol, name, unit, min, max, decimals, scale to SI, alternative unit, its scale] },
//         o = outputs { key: [symbol, name, unit, significant digits, scale, f(SI values) -> SI] },
//         tex = formula per output, inv = rearranged formula per input (for explanations), ctx = the situation,
//         cst = constants as plain text, ok(x) = plausibility condition, invKeys = inputs that may be asked for.
(function () {
  const g = 9.81, G = 6.674e-11, e = 1.602e-19, me = 9.109e-31, mp = 1.6726e-27, h = 6.626e-34, c = 2.998e8;
  const eps0 = 8.854e-12, mu0 = 4e-7 * Math.PI, u = 1.6605e-27, ME = 5.972e24, RE = 6.371e6, DEG = Math.PI / 180;
  const T = {};
  const spec = (id, s) => { T[id] = s; };
  const CG = "g = 9,81 m/s²", CE = "e = 1,602 · 10⁻¹⁹ C", CME = "mₑ = 9,109 · 10⁻³¹ kg", CH = "h = 6,626 · 10⁻³⁴ Js", CC = "c = 3,00 · 10⁸ m/s";

  // ---------------------------------------------------------------- E-Phase
  spec("satellit", { ctx: "Ein Satellit umkreist die Erde auf einer Kreisbahn in der Höhe $h$ über der Erdoberfläche.",
    v: { h: ["h", "Bahnhöhe", "km", 300, 36000, 0, 1e3] },
    o: { v: ["v", "Bahngeschwindigkeit", "km/s", 3, 1e3, (x) => Math.sqrt((G * ME) / (RE + x.h))], T: ["T", "Umlaufdauer", "h", 3, 3600, (x) => (2 * Math.PI * (RE + x.h)) / Math.sqrt((G * ME) / (RE + x.h))] },
    tex: { v: "v = \\sqrt{\\frac{G M_E}{R_E + h}}", T: "T = \\frac{2\\pi (R_E + h)}{v}" }, inv: { h: "h = \\frac{G M_E}{v^2} - R_E" },
    cst: "G = 6,674 · 10⁻¹¹ m³/(kg·s²), Erdmasse 5,97 · 10²⁴ kg, Erdradius 6371 km", invOut: "v" });
  spec("wurf-bahn", { ctx: "Ein Körper wird waagerecht mit $v_0$ abgeworfen. Wie tief liegt er nach der waagerechten Strecke $x$ unter der Abwurfhöhe?",
    v: { v0: ["v_0", "Abwurfgeschwindigkeit", "m/s", 2, 20, 1, 1, "km/h", 1 / 3.6], x: ["x", "waagerechte Strecke", "m", 1, 15, 1, 1, "cm", 0.01] },
    o: { y: ["y", "Höhenverlust", "m", 3, 1, (x) => (g * x.x * x.x) / (2 * x.v0 * x.v0)] },
    tex: { y: "y = \\frac{g}{2 v_0^2}\\,x^2" }, inv: { v0: "v_0 = x\\sqrt{\\frac{g}{2y}}", x: "x = v_0\\sqrt{\\frac{2y}{g}}" }, cst: CG });
  spec("begegnung", { ctx: "Zwei Fahrzeuge starten gleichzeitig an zwei Orten im Abstand $d$ und fahren mit konstanten Geschwindigkeiten $v_1$ und $v_2$ aufeinander zu.",
    v: { d: ["d", "Abstand", "km", 5, 120, 1, 1e3, "m", 1], v1: ["v_1", "Geschwindigkeit 1", "km/h", 20, 130, 0, 1 / 3.6, "m/s", 1], v2: ["v_2", "Geschwindigkeit 2", "km/h", 20, 130, 0, 1 / 3.6, "m/s", 1] },
    o: { t: ["t", "Zeit bis zur Begegnung", "min", 3, 60, (x) => x.d / (x.v1 + x.v2)], x1: ["x_1", "Weg von Fahrzeug 1 bis zur Begegnung", "km", 3, 1e3, (x) => (x.v1 * x.d) / (x.v1 + x.v2)] },
    tex: { t: "t = \\frac{d}{v_1 + v_2}", x1: "x_1 = v_1\\,t = \\frac{v_1 d}{v_1 + v_2}" }, inv: { d: "d = (v_1 + v_2)\\,t" }, invOut: "t" });
  spec("verfolgung", { ctx: "Ein Radfahrer fährt mit $v_1$ los. Nach der Zeit $t_0$ startet am selben Ort ein Mofa mit $v_2$ hinterher.",
    v: { v1: ["v_1", "Geschwindigkeit des Radfahrers", "km/h", 12, 25, 0, 1 / 3.6, "m/s", 1], v2: ["v_2", "Geschwindigkeit des Mofas", "km/h", 30, 45, 0, 1 / 3.6, "m/s", 1], t0: ["t_0", "Vorsprung", "min", 2, 30, 0, 60, "s", 1] },
    o: { t: ["t", "Fahrzeit des Mofas bis zum Einholen", "min", 3, 60, (x) => (x.v1 * x.t0) / (x.v2 - x.v1)], s: ["s", "Ort des Einholens", "km", 3, 1e3, (x) => (x.v2 * x.v1 * x.t0) / (x.v2 - x.v1)] },
    tex: { t: "v_1 (t + t_0) = v_2\\,t \\;\\Rightarrow\\; t = \\frac{v_1 t_0}{v_2 - v_1}", s: "s = v_2\\,t" }, inv: { t0: "t_0 = \\frac{(v_2 - v_1)\\,t}{v_1}" }, invOut: "t" });
  spec("bewegungsgleichung", { ctx: "Ein Wagen fährt mit $v_0$ und beschleunigt dann gleichmäßig mit $a$.",
    v: { v0: ["v_0", "Anfangsgeschwindigkeit", "m/s", 1, 15, 1, 1, "km/h", 1 / 3.6], a: ["a", "Beschleunigung", "m/s²", 0.5, 4, 1], t: ["t", "Zeit", "s", 2, 12, 1] },
    o: { s: ["s", "zurückgelegter Weg", "m", 3, 1, (x) => 0.5 * x.a * x.t * x.t + x.v0 * x.t], v: ["v", "Endgeschwindigkeit", "m/s", 3, 1, (x) => x.a * x.t + x.v0] },
    tex: { s: "s = \\tfrac12 a t^2 + v_0 t", v: "v = a t + v_0" }, inv: { a: "a = \\frac{2(s - v_0 t)}{t^2}" }, invKeys: ["a"], invOut: "s" });
  spec("drehimpuls", { ctx: "Eine Eiskunstläuferin dreht sich mit ausgestreckten Armen. Sie zieht die Arme an; ihr Trägheitsmoment sinkt von $J_1$ auf $J_2$. Äußere Drehmomente wirken nicht.",
    v: { J1: ["J_1", "Trägheitsmoment vorher", "kg·m²", 2, 6, 1], J2: ["J_2", "Trägheitsmoment nachher", "kg·m²", 0.6, 1.8, 1], f1: ["f_1", "Drehfrequenz vorher", "1/s", 0.3, 1.5, 1] },
    o: { f2: ["f_2", "Drehfrequenz nachher", "1/s", 3, 1, (x) => (x.J1 * x.f1) / x.J2] },
    tex: { f2: "J_1 \\omega_1 = J_2 \\omega_2 \\;\\Rightarrow\\; f_2 = \\frac{J_1}{J_2} f_1" }, inv: { J2: "J_2 = \\frac{J_1 f_1}{f_2}" } });
  spec("drehmoment", { ctx: "An einem Schraubenschlüssel greift im Abstand $r$ von der Drehachse die Kraft $F$ unter dem Winkel $\\alpha$ zum Hebelarm an.",
    v: { r: ["r", "Hebelarm", "m", 0.1, 0.5, 2, 1, "cm", 0.01], F: ["F", "Kraft", "N", 20, 200, 0], al: ["\\alpha", "Winkel", "°", 30, 90, 0, DEG] },
    o: { M: ["M", "Drehmoment", "N·m", 3, 1, (x) => x.r * x.F * Math.sin(x.al)] },
    tex: { M: "M = r\\,F\\,\\sin\\alpha" }, inv: { F: "F = \\frac{M}{r\\sin\\alpha}" }, invKeys: ["F", "r"] });
  spec("kepler3", { ctx: "Zwei Planeten umkreisen denselben Stern. Planet 1 hat die große Halbachse $a_1$ und die Umlaufdauer $T_1$, Planet 2 die große Halbachse $a_2$.",
    v: { a1: ["a_1", "Halbachse von Planet 1", "AE", 0.5, 2, 2], T1: ["T_1", "Umlaufdauer von Planet 1", "d", 80, 800, 0], a2: ["a_2", "Halbachse von Planet 2", "AE", 1, 30, 1] },
    o: { T2: ["T_2", "Umlaufdauer von Planet 2", "d", 3, 1, (x) => x.T1 * Math.pow(x.a2 / x.a1, 1.5)] },
    tex: { T2: "\\frac{T_1^2}{T_2^2} = \\frac{a_1^3}{a_2^3} \\;\\Rightarrow\\; T_2 = T_1\\left(\\frac{a_2}{a_1}\\right)^{3/2}" }, inv: { a2: "a_2 = a_1\\left(\\frac{T_2}{T_1}\\right)^{2/3}" }, invKeys: ["a2"] });
  spec("energie-fall", { ctx: "Ein Körper gleitet aus der Ruhe reibungsfrei eine Rampe der Höhe $h$ hinunter.",
    v: { h: ["h", "Höhe", "m", 0.5, 40, 1, 1, "cm", 0.01] },
    o: { v: ["v", "Geschwindigkeit am Fuß der Rampe", "m/s", 3, 1, (x) => Math.sqrt(2 * g * x.h)] },
    tex: { v: "m g h = \\tfrac12 m v^2 \\;\\Rightarrow\\; v = \\sqrt{2 g h}" }, inv: { h: "h = \\frac{v^2}{2g}" }, cst: CG });
  spec("energie-feder", { ctx: "Eine Feder mit der Federkonstante $D$ wird um $s$ gestaucht und schießt eine Kugel der Masse $m$ waagerecht und reibungsfrei ab.",
    v: { D: ["D", "Federkonstante", "N/m", 50, 800, 0], s: ["s", "Stauchung", "cm", 2, 15, 1, 0.01, "mm", 0.001], m: ["m", "Masse", "g", 10, 200, 0, 1e-3, "kg", 1] },
    o: { v: ["v", "Abschussgeschwindigkeit", "m/s", 3, 1, (x) => x.s * Math.sqrt(x.D / x.m)] },
    tex: { v: "\\tfrac12 D s^2 = \\tfrac12 m v^2 \\;\\Rightarrow\\; v = s\\sqrt{\\frac{D}{m}}" }, inv: { D: "D = \\frac{m v^2}{s^2}", m: "m = \\frac{D s^2}{v^2}" } });
  spec("entropie", { ctx: "Eis der Masse $m$ schmilzt bei 0 °C (273 K) vollständig. Die spezifische Schmelzwärme von Eis ist 334 kJ/kg.",
    v: { m: ["m", "Masse", "g", 50, 2000, 0, 1e-3, "kg", 1] },
    o: { S: ["\\Delta S", "Entropiezunahme", "J/K", 3, 1, (x) => (x.m * 334e3) / 273.15] },
    tex: { S: "\\Delta S = \\frac{Q}{T} = \\frac{m\\,q_s}{T}" }, inv: { m: "m = \\frac{T\\,\\Delta S}{q_s}" } });
  spec("euler", { ctx: "Für einen fallenden Körper mit Luftreibung gilt $a = g - k\\,v^2$. Das Euler-Verfahren mit der Schrittweite $\\Delta t$ startet bei $v_0 = 0$.",
    v: { k: ["k", "Reibungsfaktor", "1/m", 0.01, 0.2, 2], dt: ["\\Delta t", "Schrittweite", "s", 0.1, 0.5, 1] },
    o: { v2: ["v_2", "Geschwindigkeit nach zwei Schritten", "m/s", 3, 1, (x) => { const v1 = g * x.dt; return v1 + (g - x.k * v1 * v1) * x.dt; }] },
    tex: { v2: "v_1 = v_0 + a(v_0)\\,\\Delta t, \\quad v_2 = v_1 + a(v_1)\\,\\Delta t" }, noInv: true, cst: CG });
  spec("fall", { ctx: "Ein Stein fällt aus der Ruhe ohne Luftwiderstand aus der Höhe $h$.",
    v: { h: ["h", "Fallhöhe", "m", 2, 80, 1, 1, "cm", 0.01] },
    o: { t: ["t", "Fallzeit", "s", 3, 1, (x) => Math.sqrt((2 * x.h) / g)], v: ["v", "Aufprallgeschwindigkeit", "m/s", 3, 1, (x) => Math.sqrt(2 * g * x.h)] },
    tex: { t: "h = \\tfrac12 g t^2 \\;\\Rightarrow\\; t = \\sqrt{\\frac{2h}{g}}", v: "v = g t = \\sqrt{2 g h}" }, inv: { h: "h = \\tfrac12 g t^2" }, cst: CG });
  spec("flucht", { ctx: "Ein Himmelskörper hat die Masse $M$ und den Radius $R$, beide als Vielfache der Erdwerte angegeben.",
    v: { M: ["M", "Masse", "Erdmassen", 0.05, 320, 2, ME], R: ["R", "Radius", "Erdradien", 0.2, 11, 2, RE] },
    o: { v: ["v_F", "Fluchtgeschwindigkeit", "km/s", 3, 1e3, (x) => Math.sqrt((2 * G * x.M) / x.R)] },
    tex: { v: "\\tfrac12 m v_F^2 = G\\frac{M m}{R} \\;\\Rightarrow\\; v_F = \\sqrt{\\frac{2GM}{R}}" }, inv: { M: "M = \\frac{v_F^2 R}{2G}" },
    cst: "G = 6,674 · 10⁻¹¹ m³/(kg·s²), Erdmasse 5,97 · 10²⁴ kg, Erdradius 6371 km" });
  spec("gravitation", { ctx: "Zwei Körper mit den Massen $m_1$ und $m_2$ haben den Schwerpunktabstand $r$.",
    v: { m1: ["m_1", "Masse 1", "kg", 50, 5000, 0, 1, "t", 1e3], m2: ["m_2", "Masse 2", "kg", 50, 5000, 0, 1, "t", 1e3], r: ["r", "Abstand", "m", 0.5, 10, 1, 1, "cm", 0.01] },
    o: { F: ["F_G", "Gravitationskraft", "µN", 3, 1e-6, (x) => (G * x.m1 * x.m2) / (x.r * x.r)] },
    tex: { F: "F_G = G\\,\\frac{m_1 m_2}{r^2}" }, inv: { r: "r = \\sqrt{\\frac{G m_1 m_2}{F_G}}" }, cst: "G = 6,674 · 10⁻¹¹ m³/(kg·s²)" });
  spec("grenzgeschwindigkeit", { ctx: "Ein Fallschirmspringer erreicht eine konstante Grenzgeschwindigkeit. Die Luftreibung ist $F_R = \\tfrac12 c_w \\rho A v^2$ mit $\\rho = 1{,}2\\,\\mathrm{kg/m^3}$.",
    v: { m: ["m", "Masse mit Ausrüstung", "kg", 60, 110, 0], cw: ["c_w", "Luftwiderstandsbeiwert", "", 0.6, 1.4, 1], A: ["A", "Querschnittsfläche", "m²", 0.3, 1.0, 1] },
    o: { v: ["v_G", "Grenzgeschwindigkeit", "m/s", 3, 1, (x) => Math.sqrt((2 * x.m * g) / (x.cw * 1.2 * x.A))] },
    tex: { v: "m g = \\tfrac12 c_w \\rho A v_G^2 \\;\\Rightarrow\\; v_G = \\sqrt{\\frac{2 m g}{c_w \\rho A}}" }, inv: { A: "A = \\frac{2 m g}{c_w \\rho v_G^2}" }, invKeys: ["A", "m"], cst: CG });
  spec("stoss", { ctx: "Wagen 1 stößt auf einer Schiene gegen den ruhenden Wagen 2; beide bewegen sich danach gemeinsam weiter (vollständig unelastischer Stoß).",
    v: { m1: ["m_1", "Masse von Wagen 1", "kg", 0.2, 2, 1, 1, "g", 1e-3], m2: ["m_2", "Masse von Wagen 2", "kg", 0.2, 2, 1, 1, "g", 1e-3], v1: ["v_1", "Geschwindigkeit von Wagen 1", "m/s", 0.5, 4, 1, 1, "cm/s", 0.01] },
    o: { v: ["v'", "gemeinsame Geschwindigkeit", "m/s", 3, 1, (x) => (x.m1 * x.v1) / (x.m1 + x.m2)] },
    tex: { v: "m_1 v_1 = (m_1 + m_2)\\,v' \\;\\Rightarrow\\; v' = \\frac{m_1 v_1}{m_1 + m_2}" }, inv: { m2: "m_2 = m_1\\left(\\frac{v_1}{v'} - 1\\right)" } });
  spec("stoss-elastisch", { ctx: "Kugel 1 stößt zentral und elastisch gegen die ruhende Kugel 2.",
    v: { m1: ["m_1", "Masse von Kugel 1", "g", 50, 500, 0, 1e-3, "kg", 1], m2: ["m_2", "Masse von Kugel 2", "g", 50, 500, 0, 1e-3, "kg", 1], v1: ["v_1", "Geschwindigkeit von Kugel 1", "m/s", 0.5, 5, 1, 1, "cm/s", 0.01] },
    o: { v2: ["v_2'", "Geschwindigkeit von Kugel 2 nach dem Stoß", "m/s", 3, 1, (x) => ((2 * x.m1) / (x.m1 + x.m2)) * x.v1], v1s: ["v_1'", "Geschwindigkeit von Kugel 1 nach dem Stoß", "m/s", 3, 1, (x) => ((x.m1 - x.m2) / (x.m1 + x.m2)) * x.v1] },
    tex: { v2: "v_2' = \\frac{2 m_1}{m_1 + m_2}\\,v_1", v1s: "v_1' = \\frac{m_1 - m_2}{m_1 + m_2}\\,v_1" }, noInv: true, ok: (x) => Math.abs(x.m1 - x.m2) > 0.02 });
  spec("schiefe-ebene", { ctx: "Ein Körper gleitet eine schiefe Ebene mit dem Neigungswinkel $\\alpha$ hinab; die Gleitreibungszahl ist $\\mu$.",
    v: { al: ["\\alpha", "Neigungswinkel", "°", 15, 50, 0, DEG], mu: ["\\mu", "Gleitreibungszahl", "", 0.05, 0.25, 2] },
    o: { a: ["a", "Beschleunigung", "m/s²", 3, 1, (x) => g * (Math.sin(x.al) - x.mu * Math.cos(x.al))] },
    tex: { a: "m a = m g \\sin\\alpha - \\mu\\,m g\\cos\\alpha \\;\\Rightarrow\\; a = g(\\sin\\alpha - \\mu\\cos\\alpha)" }, inv: { mu: "\\mu = \\tan\\alpha - \\frac{a}{g\\cos\\alpha}" }, invKeys: ["mu"], cst: CG });
  spec("schiefer-wurf", { ctx: "Ein Ball wird vom Boden mit $v_0$ unter dem Winkel $\\alpha$ zur Waagerechten abgeworfen (ohne Luftwiderstand).",
    v: { v0: ["v_0", "Abwurfgeschwindigkeit", "m/s", 5, 30, 1, 1, "km/h", 1 / 3.6], al: ["\\alpha", "Abwurfwinkel", "°", 15, 75, 0, DEG] },
    o: { w: ["w", "Wurfweite", "m", 3, 1, (x) => (x.v0 * x.v0 * Math.sin(2 * x.al)) / g], H: ["h_{max}", "Wurfhöhe", "m", 3, 1, (x) => Math.pow(x.v0 * Math.sin(x.al), 2) / (2 * g)] },
    tex: { w: "w = \\frac{v_0^2 \\sin(2\\alpha)}{g}", H: "h_{max} = \\frac{v_0^2 \\sin^2\\alpha}{2g}" }, inv: { v0: "v_0 = \\sqrt{\\frac{w\\,g}{\\sin(2\\alpha)}}" }, invKeys: ["v0"], invOut: "w", cst: CG });
  spec("waagerechter-wurf", { ctx: "Ein Ball wird aus der Höhe $h$ waagerecht mit $v_0$ abgeworfen (ohne Luftwiderstand).",
    v: { h: ["h", "Abwurfhöhe", "m", 1, 20, 1, 1, "cm", 0.01], v0: ["v_0", "Abwurfgeschwindigkeit", "m/s", 2, 15, 1, 1, "km/h", 1 / 3.6] },
    o: { s: ["s", "Wurfweite", "m", 3, 1, (x) => x.v0 * Math.sqrt((2 * x.h) / g)], t: ["t", "Flugzeit", "s", 3, 1, (x) => Math.sqrt((2 * x.h) / g)] },
    tex: { s: "s = v_0\\,t = v_0\\sqrt{\\frac{2h}{g}}", t: "t = \\sqrt{\\frac{2h}{g}}" }, inv: { h: "h = \\frac{g s^2}{2 v_0^2}", v0: "v_0 = s\\sqrt{\\frac{g}{2h}}" }, invOut: "s", cst: CG });
  spec("kreis", { ctx: "Ein Punkt am Rand einer Scheibe mit dem Radius $r$ läuft gleichförmig um; eine Umdrehung dauert $T$.",
    v: { r: ["r", "Radius", "cm", 5, 60, 0, 0.01, "m", 1], T: ["T", "Umlaufdauer", "s", 0.2, 5, 1, 1, "ms", 1e-3] },
    o: { v: ["v", "Bahngeschwindigkeit", "m/s", 3, 1, (x) => (2 * Math.PI * x.r) / x.T], w: ["\\omega", "Winkelgeschwindigkeit", "1/s", 3, 1, (x) => (2 * Math.PI) / x.T] },
    tex: { v: "v = \\frac{2\\pi r}{T}", w: "\\omega = \\frac{2\\pi}{T}" }, inv: { T: "T = \\frac{2\\pi r}{v}", r: "r = \\frac{v T}{2\\pi}" }, invOut: "v" });
  spec("zentripetal", { ctx: "Ein Auto der Masse $m$ fährt mit $v$ durch eine Kurve mit dem Radius $r$.",
    v: { m: ["m", "Masse", "kg", 800, 2000, 0, 1, "t", 1e3], v: ["v", "Geschwindigkeit", "km/h", 20, 100, 0, 1 / 3.6, "m/s", 1], r: ["r", "Kurvenradius", "m", 20, 200, 0] },
    o: { F: ["F_Z", "nötige Zentripetalkraft", "kN", 3, 1e3, (x) => (x.m * x.v * x.v) / x.r] },
    tex: { F: "F_Z = \\frac{m v^2}{r}" }, inv: { r: "r = \\frac{m v^2}{F_Z}", v: "v = \\sqrt{\\frac{F_Z r}{m}}" } });
  spec("vt", { ctx: "Ein Zug beschleunigt aus dem Stand gleichmäßig in der Zeit $t_1$ auf $v$, fährt dann die Zeit $t_2$ gleichförmig und bremst in $t_3$ gleichmäßig bis zum Stillstand.",
    v: { v: ["v", "Höchstgeschwindigkeit", "m/s", 10, 40, 0, 1, "km/h", 1 / 3.6], t1: ["t_1", "Beschleunigungszeit", "s", 10, 60, 0], t2: ["t_2", "Fahrzeit mit konstantem Tempo", "s", 20, 120, 0, 1, "min", 60], t3: ["t_3", "Bremszeit", "s", 10, 50, 0] },
    o: { s: ["s", "Gesamtstrecke", "m", 3, 1, (x) => 0.5 * x.v * x.t1 + x.v * x.t2 + 0.5 * x.v * x.t3], a: ["a", "Beschleunigung beim Anfahren", "m/s²", 3, 1, (x) => x.v / x.t1] },
    tex: { s: "s = \\tfrac12 v\\,t_1 + v\\,t_2 + \\tfrac12 v\\,t_3 \\text{ (Fläche unter dem } v\\text{-}t\\text{-Graphen)}", a: "a = \\frac{v}{t_1} \\text{ (Steigung)}" },
    inv: { t2: "t_2 = \\frac{s}{v} - \\frac{t_1 + t_3}{2}" }, invKeys: ["t2"], invOut: "s" });

  // ---------------------------------------------------------------- Q1: electric and magnetic fields
  spec("bahnradius", { ctx: "Ein Elektron wird aus der Ruhe mit der Spannung $U$ beschleunigt und tritt senkrecht zu den Feldlinien in ein homogenes Magnetfeld $B$ ein.",
    v: { U: ["U", "Beschleunigungsspannung", "V", 100, 500, 0, 1, "kV", 1e3], B: ["B", "Flussdichte", "mT", 0.5, 3, 2, 1e-3, "T", 1] },
    o: { r: ["r", "Bahnradius", "cm", 3, 0.01, (x) => Math.sqrt((2 * me * x.U) / e) / x.B] },
    tex: { r: "e v B = \\frac{m v^2}{r},\\; eU = \\tfrac12 m v^2 \\;\\Rightarrow\\; r = \\frac{1}{B}\\sqrt{\\frac{2 m_e U}{e}}" }, inv: { B: "B = \\frac{1}{r}\\sqrt{\\frac{2 m_e U}{e}}", U: "U = \\frac{e B^2 r^2}{2 m_e}" }, cst: CE + ", " + CME });
  spec("beschleunigung-u", { ctx: "Ein Elektron wird aus der Ruhe mit der Spannung $U$ beschleunigt (nichtrelativistisch).",
    v: { U: ["U", "Beschleunigungsspannung", "V", 50, 5000, 0, 1, "kV", 1e3] },
    o: { v: ["v", "Endgeschwindigkeit", "10⁶ m/s", 3, 1e6, (x) => Math.sqrt((2 * e * x.U) / me)], E: ["E_{kin}", "Bewegungsenergie", "10⁻¹⁷ J", 3, 1e-17, (x) => e * x.U] },
    tex: { v: "e U = \\tfrac12 m_e v^2 \\;\\Rightarrow\\; v = \\sqrt{\\frac{2eU}{m_e}}", E: "E_{kin} = e\\,U" }, inv: { U: "U = \\frac{m_e v^2}{2e}" }, invOut: "v", cst: CE + ", " + CME });
  spec("bewegungsinduktion", { ctx: "Ein Leiterstück der Länge $l$ wird mit $v$ senkrecht durch ein homogenes Magnetfeld $B$ bewegt.",
    v: { l: ["l", "Leiterlänge im Feld", "cm", 5, 50, 0, 0.01, "m", 1], v: ["v", "Geschwindigkeit", "m/s", 0.5, 10, 1, 1, "km/h", 1 / 3.6], B: ["B", "Flussdichte", "mT", 50, 800, 0, 1e-3, "T", 1] },
    o: { U: ["U_{ind}", "Induktionsspannung", "mV", 3, 1e-3, (x) => x.B * x.l * x.v] },
    tex: { U: "U_{ind} = B\\,l\\,v" }, inv: { v: "v = \\frac{U_{ind}}{B\\,l}", B: "B = \\frac{U_{ind}}{l\\,v}" } });
  spec("ablenkung", { ctx: "Ein mit $U_B$ beschleunigtes Elektron fliegt mittig zwischen die Platten eines Ablenkkondensators der Länge $l$ mit dem Plattenabstand $d$, an dem die Spannung $U_y$ liegt.",
    v: { UB: ["U_B", "Beschleunigungsspannung", "V", 500, 3000, 0, 1, "kV", 1e3], Uy: ["U_y", "Ablenkspannung", "V", 20, 200, 0], l: ["l", "Plattenlänge", "cm", 3, 8, 1, 0.01, "mm", 1e-3], d: ["d", "Plattenabstand", "cm", 1, 4, 1, 0.01, "mm", 1e-3] },
    o: { y: ["y", "Ablenkung am Plattenende", "mm", 3, 1e-3, (x) => (x.Uy * x.l * x.l) / (4 * x.d * x.UB)] },
    tex: { y: "y = \\frac{U_y\\,l^2}{4\\,d\\,U_B}" }, inv: { Uy: "U_y = \\frac{4\\,d\\,U_B\\,y}{l^2}", UB: "U_B = \\frac{U_y\\,l^2}{4\\,d\\,y}" }, ok: (x) => (x.Uy * x.l * x.l) / (4 * x.d * x.UB) < x.d / 2 });
  spec("plattenfeld", { ctx: "An einem Plattenkondensator mit dem Plattenabstand $d$ liegt die Spannung $U$.",
    v: { U: ["U", "Spannung", "V", 10, 5000, 0, 1, "kV", 1e3], d: ["d", "Plattenabstand", "mm", 1, 50, 0, 1e-3, "cm", 0.01] },
    o: { E: ["E", "Feldstärke", "kV/m", 3, 1e3, (x) => x.U / x.d] },
    tex: { E: "E = \\frac{U}{d}" }, inv: { d: "d = \\frac{U}{E}", U: "U = E\\,d" } });
  spec("hall", { ctx: "Ein Halbleiterplättchen der Dicke $d$ (gemessen in Feldrichtung) mit der Ladungsträgerdichte $n$ wird vom Strom $I$ durchflossen und steht senkrecht in einem Magnetfeld $B$.",
    v: { B: ["B", "Flussdichte", "mT", 50, 800, 0, 1e-3, "T", 1], I: ["I", "Stromstärke", "mA", 5, 50, 0, 1e-3, "A", 1], n: ["n", "Ladungsträgerdichte", "10²¹ m⁻³", 1, 20, 0, 1e21], d: ["d", "Dicke", "mm", 0.5, 2, 1, 1e-3, "µm", 1e-6] },
    o: { U: ["U_H", "Hallspannung", "mV", 3, 1e-3, (x) => (x.B * x.I) / (x.n * e * x.d)] },
    tex: { U: "U_H = \\frac{B\\,I}{n\\,e\\,d}" }, inv: { n: "n = \\frac{B\\,I}{e\\,d\\,U_H}", B: "B = \\frac{n\\,e\\,d\\,U_H}{I}" }, cst: CE });
  spec("induktion", { ctx: "Eine Spule mit $N$ Windungen und der Querschnittsfläche $A$ steht senkrecht in einem Magnetfeld, dessen Flussdichte in der Zeit $\\Delta t$ gleichmäßig um $\\Delta B$ zunimmt. Gefragt ist der Betrag der Spannung.",
    v: { N: ["N", "Windungszahl", "", 50, 2000, 0], A: ["A", "Querschnittsfläche", "cm²", 5, 100, 0, 1e-4, "m²", 1], dB: ["\\Delta B", "Änderung der Flussdichte", "mT", 10, 500, 0, 1e-3, "T", 1], dt: ["\\Delta t", "Zeit", "ms", 5, 500, 0, 1e-3, "s", 1] },
    o: { U: ["U_{ind}", "Induktionsspannung", "V", 3, 1, (x) => (x.N * x.A * x.dB) / x.dt] },
    tex: { U: "|U_{ind}| = N\\,A\\,\\frac{\\Delta B}{\\Delta t}" }, inv: { dt: "\\Delta t = \\frac{N A\\,\\Delta B}{U_{ind}}", N: "N = \\frac{U_{ind}\\,\\Delta t}{A\\,\\Delta B}" } });
  spec("induktivitaet", { ctx: "Eine lange Luftspule hat $N$ Windungen, die Länge $l$ und die Querschnittsfläche $A$.",
    v: { N: ["N", "Windungszahl", "", 200, 2000, 0], l: ["l", "Länge", "cm", 10, 50, 0, 0.01, "m", 1], A: ["A", "Querschnittsfläche", "cm²", 5, 40, 0, 1e-4, "m²", 1] },
    o: { L: ["L", "Induktivität", "mH", 3, 1e-3, (x) => (mu0 * x.N * x.N * x.A) / x.l] },
    tex: { L: "L = \\mu_0\\,\\frac{N^2 A}{l}" }, inv: { N: "N = \\sqrt{\\frac{L\\,l}{\\mu_0 A}}" }, cst: "μ₀ = 1,257 · 10⁻⁶ Vs/(Am)" });
  spec("selbstinduktion", { ctx: "Durch eine Spule mit der Induktivität $L$ ändert sich die Stromstärke in der Zeit $\\Delta t$ gleichmäßig um $\\Delta I$.",
    v: { L: ["L", "Induktivität", "mH", 10, 500, 0, 1e-3, "H", 1], dI: ["\\Delta I", "Stromänderung", "A", 0.1, 2, 1, 1, "mA", 1e-3], dt: ["\\Delta t", "Zeit", "ms", 1, 100, 0, 1e-3, "s", 1] },
    o: { U: ["U_{ind}", "Betrag der Selbstinduktionsspannung", "V", 3, 1, (x) => (x.L * x.dI) / x.dt] },
    tex: { U: "|U_{ind}| = L\\,\\frac{\\Delta I}{\\Delta t}" }, inv: { L: "L = \\frac{U_{ind}\\,\\Delta t}{\\Delta I}" } });
  spec("kondensator", { ctx: "Ein Plattenkondensator mit Luft zwischen den Platten hat die Plattenfläche $A$ und den Abstand $d$; er wird an die Spannung $U$ angeschlossen.",
    v: { A: ["A", "Plattenfläche", "cm²", 100, 1000, 0, 1e-4, "m²", 1], d: ["d", "Plattenabstand", "mm", 1, 10, 0, 1e-3, "cm", 0.01], U: ["U", "Spannung", "V", 50, 500, 0, 1, "kV", 1e3] },
    o: { C: ["C", "Kapazität", "pF", 3, 1e-12, (x) => (eps0 * x.A) / x.d], Q: ["Q", "Ladung", "nC", 3, 1e-9, (x) => ((eps0 * x.A) / x.d) * x.U], W: ["E_{el}", "Feldenergie", "µJ", 3, 1e-6, (x) => 0.5 * ((eps0 * x.A) / x.d) * x.U * x.U] },
    tex: { C: "C = \\varepsilon_0\\,\\frac{A}{d}", Q: "Q = C\\,U = \\varepsilon_0\\frac{A}{d}\\,U", W: "E_{el} = \\tfrac12 C U^2" }, inv: { d: "d = \\varepsilon_0\\frac{A}{C}" }, invKeys: ["d", "A"], invOut: "C", cst: "ε₀ = 8,854 · 10⁻¹² As/(Vm)" });
  spec("kraft-feld", { ctx: "Ein Elektron befindet sich im homogenen Feld eines Plattenkondensators mit der Spannung $U$ und dem Plattenabstand $d$.",
    v: { U: ["U", "Spannung", "V", 100, 2000, 0, 1, "kV", 1e3], d: ["d", "Plattenabstand", "cm", 1, 10, 1, 0.01, "mm", 1e-3] },
    o: { F: ["F", "Kraft auf das Elektron", "10⁻¹⁵ N", 3, 1e-15, (x) => (e * x.U) / x.d], a: ["a", "Beschleunigung des Elektrons", "10¹⁴ m/s²", 3, 1e14, (x) => (e * x.U) / x.d / me] },
    tex: { F: "F = e\\,E = e\\,\\frac{U}{d}", a: "a = \\frac{F}{m_e} = \\frac{e\\,U}{m_e\\,d}" }, inv: { U: "U = \\frac{F\\,d}{e}" }, invOut: "F", cst: CE + ", " + CME });
  spec("linac", { ctx: "In einem Linearbeschleuniger durchläuft ein Proton, das aus der Ruhe startet, $n$ Beschleunigungsspalte mit je der Spannung $U$; die Wechselspannung hat die Frequenz $f$.",
    v: { n: ["n", "Zahl der Spalte", "", 2, 20, 0], U: ["U", "Spannung je Spalt", "kV", 10, 100, 0, 1e3, "V", 1], f: ["f", "Frequenz", "MHz", 5, 30, 0, 1e6, "Hz", 1] },
    o: { E: ["E_n", "Energie nach n Spalten", "keV", 3, 1e3 * e, (x) => x.n * e * x.U], l: ["l_n", "Länge der n-ten Driftröhre", "cm", 3, 0.01, (x) => Math.sqrt((2 * x.n * e * x.U) / mp) / (2 * x.f)] },
    tex: { E: "E_n = n\\,e\\,U", l: "l_n = \\frac{v_n}{2f} = \\frac{1}{2f}\\sqrt{\\frac{2 n e U}{m_p}}" }, inv: { U: "U = \\frac{E_n}{n\\,e}" }, invKeys: ["U"], invOut: "E", cst: CE + ", mₚ = 1,673 · 10⁻²⁷ kg" });
  spec("lorentz", { ctx: "Ein Elektron fliegt mit $v$ senkrecht zu den Feldlinien durch ein homogenes Magnetfeld $B$.",
    v: { v: ["v", "Geschwindigkeit", "10⁶ m/s", 1, 30, 1, 1e6, "km/s", 1e3], B: ["B", "Flussdichte", "mT", 1, 100, 0, 1e-3, "T", 1] },
    o: { F: ["F_L", "Lorentzkraft", "10⁻¹⁵ N", 3, 1e-15, (x) => e * x.v * x.B] },
    tex: { F: "F_L = e\\,v\\,B" }, inv: { B: "B = \\frac{F_L}{e\\,v}", v: "v = \\frac{F_L}{e\\,B}" }, cst: CE });
  spec("massenspektrometer", { ctx: "Einfach positiv geladene Ionen verlassen ein Wien-Filter mit der Geschwindigkeit $v$ und beschreiben im Magnetfeld $B$ einen Halbkreis mit dem Radius $r$.",
    v: { v: ["v", "Geschwindigkeit", "10⁵ m/s", 0.5, 5, 2, 1e5, "km/s", 1e3], B: ["B", "Flussdichte", "T", 0.1, 1, 2, 1, "mT", 1e-3], r: ["r", "Bahnradius", "cm", 2, 40, 1, 0.01, "mm", 1e-3] },
    o: { m: ["m", "Ionenmasse", "u", 3, u, (x) => (e * x.B * x.r) / x.v] },
    tex: { m: "e v B = \\frac{m v^2}{r} \\;\\Rightarrow\\; m = \\frac{e\\,B\\,r}{v}" }, inv: { r: "r = \\frac{m\\,v}{e\\,B}" }, cst: CE + ", 1 u = 1,661 · 10⁻²⁷ kg" });
  spec("millikan", { ctx: "Ein Öltröpfchen (Dichte 875 kg/m³) mit dem Radius $r$ schwebt im Plattenkondensator mit dem Plattenabstand 6,0 mm; es trägt $n$ Elementarladungen.",
    v: { r: ["r", "Radius", "µm", 0.5, 1.2, 2, 1e-6, "nm", 1e-9], n: ["n", "Zahl der Elementarladungen", "", 1, 5, 0] },
    o: { U: ["U", "Schwebespannung", "V", 3, 1, (x) => ((4 / 3) * Math.PI * Math.pow(x.r, 3) * 875 * g * 0.006) / (x.n * e)] },
    tex: { U: "q\\,\\frac{U}{d} = m g,\\; m = \\tfrac43\\pi r^3 \\rho \\;\\Rightarrow\\; U = \\frac{4\\pi r^3 \\rho\\,g\\,d}{3\\,n\\,e}" }, inv: { n: "n = \\frac{q}{e} = \\frac{4\\pi r^3 \\rho\\,g\\,d}{3\\,e\\,U}" }, invKeys: ["n"], cst: CG + ", " + CE });
  spec("fadenstrahl", { ctx: "Im Fadenstrahlrohr werden Elektronen mit $U_B$ beschleunigt; im Feld $B$ der Helmholtzspulen laufen sie auf einer Kreisbahn mit dem Radius $r$. Die spezifische Ladung sei $\\frac{e}{m}$.",
    v: { U: ["U_B", "Beschleunigungsspannung", "V", 150, 300, 0, 1, "kV", 1e3], B: ["B", "Flussdichte", "mT", 0.8, 2.0, 2, 1e-3, "T", 1], em: ["\\frac{e}{m}", "spezifische Ladung", "10¹¹ C/kg", 1.70, 1.82, 2, 1e11] },
    o: { r: ["r", "Bahnradius", "cm", 3, 0.01, (x) => Math.sqrt((2 * x.U) / x.em) / x.B] },
    tex: { r: "\\frac{e}{m} = \\frac{2 U_B}{B^2 r^2} \\;\\Rightarrow\\; r = \\frac{1}{B}\\sqrt{\\frac{2 U_B}{e/m}}" }, inv: { em: "\\frac{e}{m} = \\frac{2 U_B}{B^2 r^2}" }, invKeys: ["em"], ok: (x) => Math.sqrt((2 * x.U) / x.em) / x.B < 0.055 });
  spec("trafo", { ctx: "Ein idealer Transformator hat $N_1$ Windungen auf der Primärseite und $N_2$ auf der Sekundärseite; primär liegt $U_1$ an, sekundär fließt $I_2$.",
    v: { N1: ["N_1", "Primärwindungen", "", 100, 2000, 0], N2: ["N_2", "Sekundärwindungen", "", 10, 1000, 0], U1: ["U_1", "Primärspannung", "V", 12, 400, 0, 1, "kV", 1e3], I2: ["I_2", "Sekundärstrom", "A", 0.1, 5, 1, 1, "mA", 1e-3] },
    o: { U2: ["U_2", "Sekundärspannung", "V", 3, 1, (x) => (x.U1 * x.N2) / x.N1], I1: ["I_1", "Primärstrom", "A", 3, 1, (x) => (x.I2 * x.N2) / x.N1] },
    tex: { U2: "\\frac{U_2}{U_1} = \\frac{N_2}{N_1}", I1: "U_1 I_1 = U_2 I_2 \\;\\Rightarrow\\; I_1 = I_2\\,\\frac{N_2}{N_1}" }, inv: { N2: "N_2 = N_1\\,\\frac{U_2}{U_1}" }, invKeys: ["N2"], invOut: "U2" });
  spec("wien", { ctx: "In einem Wien-Filter kreuzen sich das elektrische Feld eines Plattenkondensators (Spannung $U$, Abstand $d$) und ein Magnetfeld $B$.",
    v: { U: ["U", "Spannung", "V", 50, 1000, 0, 1, "kV", 1e3], d: ["d", "Plattenabstand", "cm", 1, 5, 1, 0.01, "mm", 1e-3], B: ["B", "Flussdichte", "mT", 5, 100, 0, 1e-3, "T", 1] },
    o: { v: ["v", "Geschwindigkeit, die ungestört durchfliegt", "10⁵ m/s", 3, 1e5, (x) => x.U / (x.d * x.B)] },
    tex: { v: "q E = q v B \\;\\Rightarrow\\; v = \\frac{E}{B} = \\frac{U}{d\\,B}" }, inv: { U: "U = v\\,d\\,B", B: "B = \\frac{U}{d\\,v}" } });

  // ---------------------------------------------------------------- Q2: oscillations and waves
  spec("gitter", { ctx: "Laserlicht der Wellenlänge $\\lambda$ fällt senkrecht auf ein Gitter mit $N$ Strichen pro Millimeter. Der Schirm steht im Abstand $e$.",
    v: { N: ["N", "Strichzahl", "1/mm", 100, 600, 0, 1e3], e: ["e", "Schirmabstand", "m", 0.5, 3, 1, 1, "cm", 0.01], lam: ["\\lambda", "Wellenlänge", "nm", 400, 700, 0, 1e-9, "µm", 1e-6] },
    o: { a: ["a_1", "Abstand des Maximums 1. Ordnung von der Mitte", "cm", 3, 0.01, (x) => x.e * Math.tan(Math.asin(x.lam * x.N))] },
    tex: { a: "\\sin\\alpha_1 = \\frac{\\lambda}{g} = \\lambda N,\\quad a_1 = e\\tan\\alpha_1" }, inv: { lam: "\\lambda = g\\,\\sin\\left(\\arctan\\frac{a_1}{e}\\right)" }, invKeys: ["lam"], ok: (x) => x.lam * x.N < 0.8 });
  spec("snellius", { ctx: "Licht tritt aus Luft ($n_1 = 1{,}00$) unter dem Einfallswinkel $\\alpha$ in ein Medium mit der Brechzahl $n_2$ ein.",
    v: { al: ["\\alpha", "Einfallswinkel", "°", 10, 80, 0, DEG], n2: ["n_2", "Brechzahl", "", 1.3, 2.4, 2] },
    o: { be: ["\\beta", "Brechungswinkel", "°", 3, DEG, (x) => Math.asin(Math.sin(x.al) / x.n2)] },
    tex: { be: "n_1 \\sin\\alpha = n_2 \\sin\\beta" }, inv: { n2: "n_2 = \\frac{\\sin\\alpha}{\\sin\\beta}" }, invKeys: ["n2"] });
  spec("grenzwinkel", { ctx: "Licht fällt in einem Medium mit der Brechzahl $n$ auf die Grenzfläche zu Luft.",
    v: { n: ["n", "Brechzahl", "", 1.3, 2.4, 2] },
    o: { ag: ["\\alpha_G", "Grenzwinkel der Totalreflexion", "°", 3, DEG, (x) => Math.asin(1 / x.n)] },
    tex: { ag: "\\sin\\alpha_G = \\frac{1}{n}" }, inv: { n: "n = \\frac{1}{\\sin\\alpha_G}" } });
  spec("doppler", { ctx: "Ein Krankenwagen mit der Sirenenfrequenz $f$ fährt mit $v$ auf einen ruhenden Beobachter zu. Schall breitet sich mit 343 m/s aus.",
    v: { f: ["f", "Sirenenfrequenz", "Hz", 400, 1200, 0, 1, "kHz", 1e3], v: ["v", "Geschwindigkeit", "km/h", 30, 150, 0, 1 / 3.6, "m/s", 1] },
    o: { fb: ["f_B", "gehörte Frequenz", "Hz", 4, 1, (x) => (x.f * 343) / (343 - x.v)] },
    tex: { fb: "f_B = \\frac{f}{1 - \\frac{v}{c}}" }, inv: { v: "v = c\\left(1 - \\frac{f}{f_B}\\right)" }, invKeys: ["v"] });
  spec("thomson", { ctx: "Ein Schwingkreis besteht aus einer Spule mit der Induktivität $L$ und einem Kondensator mit der Kapazität $C$.",
    v: { L: ["L", "Induktivität", "mH", 1, 500, 0, 1e-3, "H", 1], C: ["C", "Kapazität", "µF", 0.1, 50, 1, 1e-6, "nF", 1e-9] },
    o: { f: ["f", "Eigenfrequenz", "Hz", 3, 1, (x) => 1 / (2 * Math.PI * Math.sqrt(x.L * x.C))] },
    tex: { f: "T = 2\\pi\\sqrt{L C} \\;\\Rightarrow\\; f = \\frac{1}{2\\pi\\sqrt{L C}}" }, inv: { C: "C = \\frac{1}{4\\pi^2 f^2 L}", L: "L = \\frac{1}{4\\pi^2 f^2 C}" } });
  spec("schwingung-energie", { ctx: "Ein Federpendel (Masse $m$, Federkonstante $D$) schwingt harmonisch mit der Amplitude $\\hat{y}$.",
    v: { m: ["m", "Masse", "g", 50, 1000, 0, 1e-3, "kg", 1], D: ["D", "Federkonstante", "N/m", 5, 200, 0], A: ["\\hat{y}", "Amplitude", "cm", 1, 15, 1, 0.01, "mm", 1e-3] },
    o: { v: ["v_{max}", "größte Geschwindigkeit", "m/s", 3, 1, (x) => x.A * Math.sqrt(x.D / x.m)], E: ["E", "Schwingungsenergie", "mJ", 3, 1e-3, (x) => 0.5 * x.D * x.A * x.A] },
    tex: { v: "\\tfrac12 D\\hat{y}^2 = \\tfrac12 m v_{max}^2 \\;\\Rightarrow\\; v_{max} = \\hat{y}\\sqrt{\\frac{D}{m}}", E: "E = \\tfrac12 D \\hat{y}^2" }, inv: { A: "\\hat{y} = v_{max}\\sqrt{\\frac{m}{D}}" }, invKeys: ["A"], invOut: "v" });
  spec("federpendel", { ctx: "An einer Feder mit der Federkonstante $D$ hängt ein Körper der Masse $m$.",
    v: { m: ["m", "Masse", "g", 20, 1000, 0, 1e-3, "kg", 1], D: ["D", "Federkonstante", "N/m", 2, 100, 1] },
    o: { T: ["T", "Periodendauer", "s", 3, 1, (x) => 2 * Math.PI * Math.sqrt(x.m / x.D)] },
    tex: { T: "T = 2\\pi\\sqrt{\\frac{m}{D}}" }, inv: { D: "D = \\frac{4\\pi^2 m}{T^2}", m: "m = \\frac{D\\,T^2}{4\\pi^2}" } });
  spec("fadenpendel", { ctx: "Ein Fadenpendel der Länge $l$ schwingt mit kleiner Auslenkung.",
    v: { l: ["l", "Pendellänge", "m", 0.2, 3, 2, 1, "cm", 0.01] },
    o: { T: ["T", "Periodendauer", "s", 3, 1, (x) => 2 * Math.PI * Math.sqrt(x.l / g)] },
    tex: { T: "T = 2\\pi\\sqrt{\\frac{l}{g}}" }, inv: { l: "l = \\frac{g\\,T^2}{4\\pi^2}" }, cst: CG });
  spec("daempfung", { ctx: "Die Amplitude einer gedämpften Schwingung nimmt exponentiell ab: $\\hat{y}(t) = \\hat{y}_0\\,e^{-\\delta t}$.",
    v: { y0: ["\\hat{y}_0", "Anfangsamplitude", "cm", 2, 20, 1], de: ["\\delta", "Abklingkonstante", "1/s", 0.05, 1, 2], t: ["t", "Zeit", "s", 1, 20, 1] },
    o: { y: ["\\hat{y}(t)", "Amplitude zur Zeit t", "cm", 3, 1, (x) => x.y0 * Math.exp(-x.de * x.t)] },
    tex: { y: "\\hat{y}(t) = \\hat{y}_0\\,e^{-\\delta t}" }, inv: { de: "\\delta = \\frac{1}{t}\\ln\\frac{\\hat{y}_0}{\\hat{y}(t)}" }, invKeys: ["de"], ok: (x) => x.de * x.t < 4 });
  spec("resonanz", { ctx: "Ein Federpendel (Masse $m$, Federkonstante $D$) wird von außen periodisch angeregt; die Dämpfung ist schwach.",
    v: { m: ["m", "Masse", "g", 50, 1000, 0, 1e-3, "kg", 1], D: ["D", "Federkonstante", "N/m", 5, 200, 0] },
    o: { f: ["f_0", "Resonanzfrequenz", "Hz", 3, 1, (x) => Math.sqrt(x.D / x.m) / (2 * Math.PI)] },
    tex: { f: "f_0 = \\frac{1}{2\\pi}\\sqrt{\\frac{D}{m}}" }, inv: { m: "m = \\frac{D}{4\\pi^2 f_0^2}", D: "D = 4\\pi^2 f_0^2\\,m" } });
  spec("schwebung", { ctx: "Zwei Stimmgabeln mit den Frequenzen $f_1$ und $f_2$ klingen gleichzeitig.",
    v: { f1: ["f_1", "Frequenz 1", "Hz", 400, 449, 0], f2: ["f_2", "Frequenz 2", "Hz", 451, 470, 0] },
    o: { fs: ["f_S", "Schwebungsfrequenz", "Hz", 3, 1, (x) => Math.abs(x.f1 - x.f2)], Ts: ["T_S", "Schwebungsdauer", "s", 3, 1, (x) => 1 / Math.abs(x.f1 - x.f2)], fm: ["f", "gehörte Tonfrequenz", "Hz", 4, 1, (x) => (x.f1 + x.f2) / 2] },
    tex: { fs: "f_S = |f_1 - f_2|", Ts: "T_S = \\frac{1}{|f_1 - f_2|}", fm: "f = \\frac{f_1 + f_2}{2}" }, inv: { f2: "f_2 = f_1 + f_S" }, invKeys: ["f2"], invOut: "fs" });
  spec("schwingung-y", { ctx: "Ein Körper schwingt harmonisch nach $y(t) = \\hat{y}\\sin\\left(\\frac{2\\pi}{T}t\\right)$; der Taschenrechner steht im Bogenmaß.",
    v: { A: ["\\hat{y}", "Amplitude", "cm", 1, 10, 1], T: ["T", "Periodendauer", "s", 0.5, 4, 1], t: ["t", "Zeitpunkt", "s", 0.1, 3, 2] },
    o: { y: ["y(t)", "Auslenkung", "cm", 3, 1, (x) => x.A * Math.sin((2 * Math.PI * x.t) / x.T)], v: ["v(t)", "Geschwindigkeit", "cm/s", 3, 1, (x) => ((x.A * 2 * Math.PI) / x.T) * Math.cos((2 * Math.PI * x.t) / x.T)] },
    tex: { y: "y(t) = \\hat{y}\\sin\\left(\\frac{2\\pi}{T}t\\right)", v: "v(t) = \\dot{y}(t) = \\hat{y}\\,\\frac{2\\pi}{T}\\cos\\left(\\frac{2\\pi}{T}t\\right)" },
    inv: { A: "\\hat{y} = \\frac{y(t)}{\\sin(2\\pi t/T)}" }, invKeys: ["A"], invOut: "y", ok: (x) => Math.abs(Math.sin((2 * Math.PI * x.t) / x.T)) > 0.3 && Math.abs(Math.cos((2 * Math.PI * x.t) / x.T)) > 0.3 });
  spec("stehende-welle", { ctx: "Eine Saite der Länge $l$ ist an beiden Enden fest eingespannt; Wellen laufen auf ihr mit $c$. Gesucht ist die Eigenschwingung $k$-ter Ordnung.",
    v: { l: ["l", "Saitenlänge", "cm", 30, 120, 0, 0.01, "m", 1], c: ["c", "Ausbreitungsgeschwindigkeit", "m/s", 100, 500, 0], k: ["k", "Ordnung", "", 1, 5, 0] },
    o: { f: ["f_k", "Eigenfrequenz", "Hz", 3, 1, (x) => (x.k * x.c) / (2 * x.l)] },
    tex: { f: "l = k\\,\\frac{\\lambda_k}{2} \\;\\Rightarrow\\; f_k = k\\,\\frac{c}{2l}" }, inv: { c: "c = \\frac{2\\,l\\,f_k}{k}", l: "l = \\frac{k\\,c}{2 f_k}" }, invKeys: ["c", "l"] });
  spec("welle-y", { ctx: "Eine Welle läuft in positive $x$-Richtung: $y(x,t) = \\hat{y}\\sin\\left(2\\pi\\left(\\frac{t}{T} - \\frac{x}{\\lambda}\\right)\\right)$, Taschenrechner im Bogenmaß.",
    v: { A: ["\\hat{y}", "Amplitude", "cm", 1, 5, 1], T: ["T", "Periodendauer", "s", 0.2, 2, 1], la: ["\\lambda", "Wellenlänge", "m", 0.5, 4, 1], x: ["x", "Ort", "m", 0.1, 3, 2], t: ["t", "Zeitpunkt", "s", 0.1, 2, 2] },
    o: { y: ["y(x,t)", "Auslenkung", "cm", 3, 1, (v) => v.A * Math.sin(2 * Math.PI * (v.t / v.T - v.x / v.la))] },
    tex: { y: "y = \\hat{y}\\sin\\left(2\\pi\\left(\\frac{t}{T} - \\frac{x}{\\lambda}\\right)\\right)" }, noInv: true, ok: (v) => Math.abs(Math.sin(2 * Math.PI * (v.t / v.T - v.x / v.la))) > 0.3 });
  spec("welle-c", { ctx: "Eine Welle hat die Frequenz $f$ und breitet sich mit $c$ aus.",
    v: { f: ["f", "Frequenz", "Hz", 20, 2000, 0, 1, "kHz", 1e3], c: ["c", "Ausbreitungsgeschwindigkeit", "m/s", 300, 1500, 0, 1, "km/s", 1e3] },
    o: { la: ["\\lambda", "Wellenlänge", "cm", 3, 0.01, (x) => x.c / x.f] },
    tex: { la: "c = \\lambda f \\;\\Rightarrow\\; \\lambda = \\frac{c}{f}" }, inv: { f: "f = \\frac{c}{\\lambda}", c: "c = \\lambda f" } });
  spec("superposition", { ctx: "Zwei Wellen gleicher Frequenz mit den Amplituden $\\hat{y}_1$ und $\\hat{y}_2$ überlagern sich mit dem Phasenunterschied $\\Delta\\varphi$.",
    v: { A1: ["\\hat{y}_1", "Amplitude 1", "cm", 1, 5, 1], A2: ["\\hat{y}_2", "Amplitude 2", "cm", 1, 5, 1], dp: ["\\Delta\\varphi", "Phasenunterschied", "°", 0, 180, 0, DEG] },
    o: { A: ["\\hat{y}", "resultierende Amplitude", "cm", 3, 1, (x) => Math.sqrt(x.A1 * x.A1 + x.A2 * x.A2 + 2 * x.A1 * x.A2 * Math.cos(x.dp))] },
    tex: { A: "\\hat{y} = \\sqrt{\\hat{y}_1^2 + \\hat{y}_2^2 + 2\\,\\hat{y}_1\\hat{y}_2\\cos\\Delta\\varphi}" }, noInv: true, ok: (x) => Math.sqrt(x.A1 * x.A1 + x.A2 * x.A2 + 2 * x.A1 * x.A2 * Math.cos(x.dp)) > 0.3 });

  // ---------------------------------------------------------------- Q3: quantum and atomic physics
  spec("aktivitaet", { ctx: "Eine Probe enthält $N$ Kerne eines Nuklids mit der Halbwertszeit $T_{1/2}$.",
    v: { N: ["N", "Zahl der Kerne", "10¹⁵", 1, 50, 0, 1e15], T: ["T_{1/2}", "Halbwertszeit", "d", 1, 100, 0, 86400, "h", 3600] },
    o: { A: ["A", "Aktivität", "MBq", 3, 1e6, (x) => (Math.log(2) / x.T) * x.N] },
    tex: { A: "A = \\lambda N = \\frac{\\ln 2}{T_{1/2}}\\,N" }, inv: { N: "N = \\frac{A\\,T_{1/2}}{\\ln 2}" }, invKeys: ["N"] });
  spec("bohr", { ctx: "Im Bohrschen Modell des Wasserstoffatoms gilt $E_n = -13{,}6\\,\\mathrm{eV}\\cdot\\frac{1}{n^2}$ und $r_n = 0{,}0529\\,\\mathrm{nm}\\cdot n^2$.",
    v: { n: ["n", "Hauptquantenzahl", "", 1, 6, 0] },
    o: { E: ["E_n", "Energie des Zustands", "eV", 3, 1, (x) => -13.6 / (x.n * x.n)], r: ["r_n", "Bahnradius", "nm", 3, 1, (x) => 0.0529 * x.n * x.n] },
    tex: { E: "E_n = -\\frac{13{,}6\\,\\mathrm{eV}}{n^2}", r: "r_n = 0{,}0529\\,\\mathrm{nm}\\cdot n^2" }, inv: { n: "n = \\sqrt{\\frac{r_n}{0{,}0529\\,\\mathrm{nm}}}" }, invKeys: ["n"], invOut: "r" });
  spec("bragg", { ctx: "Röntgenstrahlung der Wellenlänge $\\lambda$ wird an Netzebenen mit dem Abstand $d$ reflektiert (Ordnung $k$).",
    v: { lam: ["\\lambda", "Wellenlänge", "pm", 50, 200, 0, 1e-12, "nm", 1e-9], d: ["d", "Netzebenenabstand", "pm", 200, 400, 0, 1e-12, "nm", 1e-9], k: ["k", "Ordnung", "", 1, 2, 0] },
    o: { th: ["\\vartheta", "Glanzwinkel", "°", 3, DEG, (x) => Math.asin((x.k * x.lam) / (2 * x.d))] },
    tex: { th: "2 d \\sin\\vartheta = k\\,\\lambda" }, inv: { lam: "\\lambda = \\frac{2 d\\sin\\vartheta}{k}", d: "d = \\frac{k\\lambda}{2\\sin\\vartheta}" }, invKeys: ["lam", "d"], ok: (x) => (x.k * x.lam) / (2 * x.d) < 0.9 });
  spec("debroglie", { ctx: "Elektronen werden aus der Ruhe mit der Spannung $U$ beschleunigt (nichtrelativistisch).",
    v: { U: ["U", "Beschleunigungsspannung", "V", 50, 10000, 0, 1, "kV", 1e3] },
    o: { la: ["\\lambda", "De-Broglie-Wellenlänge", "pm", 3, 1e-12, (x) => h / Math.sqrt(2 * me * e * x.U)] },
    tex: { la: "\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2 m_e e U}}" }, inv: { U: "U = \\frac{h^2}{2 m_e e \\lambda^2}" }, cst: CH + ", " + CE + ", " + CME });
  spec("franck-hertz", { ctx: "Im Franck-Hertz-Versuch liegen benachbarte Maxima der Stromstärke im Abstand $\\Delta U$.",
    v: { dU: ["\\Delta U", "Abstand der Maxima", "V", 4.5, 20, 1] },
    o: { la: ["\\lambda", "Wellenlänge des Lichts beim Übergang zurück", "nm", 3, 1e-9, (x) => (h * c) / (x.dU * e)] },
    tex: { la: "e\\,\\Delta U = h f = \\frac{h c}{\\lambda} \\;\\Rightarrow\\; \\lambda = \\frac{h c}{e\\,\\Delta U}" }, inv: { dU: "\\Delta U = \\frac{h c}{e\\,\\lambda}" }, cst: CH + ", " + CC + ", " + CE });
  spec("duane-hunt", { ctx: "Eine Röntgenröhre wird mit der Anodenspannung $U$ betrieben.",
    v: { U: ["U", "Anodenspannung", "kV", 10, 60, 0, 1e3, "V", 1] },
    o: { la: ["\\lambda_{min}", "Grenzwellenlänge", "pm", 3, 1e-12, (x) => (h * c) / (e * x.U)], f: ["f_{max}", "Grenzfrequenz", "10¹⁸ Hz", 3, 1e18, (x) => (e * x.U) / h] },
    tex: { la: "e U = h f_{max} = \\frac{h c}{\\lambda_{min}} \\;\\Rightarrow\\; \\lambda_{min} = \\frac{h c}{e U}", f: "f_{max} = \\frac{e U}{h}" }, inv: { U: "U = \\frac{h c}{e\\,\\lambda_{min}}" }, invOut: "la", cst: CH + ", " + CC + ", " + CE });
  spec("halbwertszeit", { ctx: "Ein radioaktives Nuklid hat die Halbwertszeit $T_{1/2}$.",
    v: { T: ["T_{1/2}", "Halbwertszeit", "h", 0.5, 100, 1, 3600, "min", 60] },
    o: { la: ["\\lambda", "Zerfallskonstante", "10⁻⁵ s⁻¹", 3, 1e-5, (x) => Math.log(2) / x.T] },
    tex: { la: "\\lambda = \\frac{\\ln 2}{T_{1/2}}" }, inv: { T: "T_{1/2} = \\frac{\\ln 2}{\\lambda}" } });
  spec("photoeffekt", { ctx: "Licht der Wellenlänge $\\lambda$ fällt auf eine Kathode mit der Austrittsarbeit $W_A$.",
    v: { lam: ["\\lambda", "Wellenlänge", "nm", 200, 450, 0, 1e-9, "µm", 1e-6], W: ["W_A", "Austrittsarbeit", "eV", 1.9, 2.5, 2, e] },
    o: { U0: ["U_0", "Gegenspannung, bei der der Strom verschwindet", "V", 3, 1, (x) => ((h * c) / x.lam - x.W) / e], E: ["E_{kin}", "größte Bewegungsenergie der Elektronen", "eV", 3, e, (x) => (h * c) / x.lam - x.W] },
    tex: { U0: "e U_0 = \\frac{h c}{\\lambda} - W_A", E: "E_{kin} = \\frac{h c}{\\lambda} - W_A" }, inv: { W: "W_A = \\frac{h c}{\\lambda} - e U_0" }, invKeys: ["W"], invOut: "U0", ok: (x) => (h * c) / x.lam - x.W > 0.2 * e, cst: CH + ", " + CC + ", " + CE });
  spec("photonenimpuls", { ctx: "Ein Laser der Leistung $P$ und der Wellenlänge $\\lambda$ trifft senkrecht auf einen Spiegel, der das Licht vollständig reflektiert.",
    v: { P: ["P", "Leistung", "W", 0.01, 5, 2, 1, "mW", 1e-3], lam: ["\\lambda", "Wellenlänge", "nm", 400, 1064, 0, 1e-9, "µm", 1e-6] },
    o: { F: ["F", "Kraft auf den Spiegel", "nN", 3, 1e-9, (x) => (2 * x.P) / c], p: ["p", "Impuls eines Photons", "10⁻²⁷ kg·m/s", 3, 1e-27, (x) => h / x.lam] },
    tex: { F: "F = \\frac{2P}{c}", p: "p = \\frac{h}{\\lambda}" }, inv: { P: "P = \\frac{F\\,c}{2}" }, invKeys: ["P"], invOut: "F", cst: CH + ", " + CC });
  spec("spektrallinie", { ctx: "Im Wasserstoffatom mit $E_n = -13{,}6\\,\\mathrm{eV}/n^2$ springt ein Elektron vom Niveau $m$ auf das Niveau $n$.",
    v: { m: ["m", "oberes Niveau", "", 3, 7, 0], n: ["n", "unteres Niveau", "", 1, 2, 0] },
    o: { la: ["\\lambda", "Wellenlänge des Photons", "nm", 3, 1e-9, (x) => (h * c) / (13.6 * e * (1 / (x.n * x.n) - 1 / (x.m * x.m)))] },
    tex: { la: "\\lambda = \\frac{h c}{E_m - E_n} = \\frac{h c}{13{,}6\\,\\mathrm{eV}\\left(\\frac{1}{n^2} - \\frac{1}{m^2}\\right)}" }, noInv: true, cst: CH + ", " + CC + ", 1 eV = 1,602 · 10⁻¹⁹ J" });
  spec("zerfall", { ctx: "Ein Präparat enthält anfangs $N_0$ Kerne eines Nuklids mit der Halbwertszeit $T_{1/2}$.",
    v: { N0: ["N_0", "Anfangszahl", "10⁶", 1, 100, 0, 1e6], T: ["T_{1/2}", "Halbwertszeit", "min", 1, 60, 0, 60, "s", 1], t: ["t", "Zeit", "min", 1, 200, 0, 60, "h", 3600] },
    o: { N: ["N(t)", "Zahl der noch nicht zerfallenen Kerne", "10⁶", 3, 1e6, (x) => x.N0 * Math.pow(0.5, x.t / x.T)] },
    tex: { N: "N(t) = N_0 \\left(\\tfrac12\\right)^{t/T_{1/2}}" }, inv: { t: "t = T_{1/2}\\,\\frac{\\ln(N_0/N)}{\\ln 2}" }, invKeys: ["t"], ok: (x) => x.t / x.T < 6 });

  // ---------------------------------------------------------------- Q4: modern physics
  spec("kernenergie", { ctx: "Bei einer Kernreaktion nimmt die Gesamtmasse um $\\Delta m$ ab.",
    v: { dm: ["\\Delta m", "Massenabnahme", "u", 0.001, 0.25, 3, u] },
    o: { E: ["E", "freigesetzte Energie", "MeV", 3, 1e6 * e, (x) => x.dm * c * c] },
    tex: { E: "E = \\Delta m\\,c^2 \\quad (1\\,\\mathrm{u}\\cdot c^2 \\approx 931{,}5\\,\\mathrm{MeV})" }, inv: { dm: "\\Delta m = \\frac{E}{c^2}" }, cst: CC + ", 1 u = 1,661 · 10⁻²⁷ kg" });
  spec("hubble", { ctx: "Eine Galaxie ist $d$ entfernt; die Hubble-Konstante beträgt $H_0 = 70\\,\\mathrm{km/(s\\cdot Mpc)}$.",
    v: { d: ["d", "Entfernung", "Mpc", 10, 1000, 0] },
    o: { v: ["v", "Fluchtgeschwindigkeit", "km/s", 3, 1, (x) => 70 * x.d] },
    tex: { v: "v = H_0\\,d" }, inv: { d: "d = \\frac{v}{H_0}" } });
  spec("laengenkontraktion", { ctx: "Ein Raumschiff mit der Eigenlänge $L_0$ fliegt mit $v$ an der Erde vorbei.",
    v: { L0: ["L_0", "Eigenlänge", "m", 20, 200, 0], v: ["v", "Geschwindigkeit", "c", 0.1, 0.99, 2, c] },
    o: { L: ["L", "von der Erde aus gemessene Länge", "m", 3, 1, (x) => x.L0 * Math.sqrt(1 - Math.pow(x.v / c, 2))] },
    tex: { L: "L = L_0\\sqrt{1 - \\frac{v^2}{c^2}}" }, inv: { v: "v = c\\sqrt{1 - \\frac{L^2}{L_0^2}}" }, invKeys: ["v"] });
  spec("rel-energie", { ctx: "Ein Elektron ($m_e c^2 = 511\\,\\mathrm{keV}$) bewegt sich mit $v$.",
    v: { v: ["v", "Geschwindigkeit", "c", 0.1, 0.99, 2, c] },
    o: { E: ["E_{kin}", "Bewegungsenergie", "keV", 3, 1e3 * e, (x) => (1 / Math.sqrt(1 - Math.pow(x.v / c, 2)) - 1) * me * c * c], ga: ["\\gamma", "Lorentzfaktor", "", 3, 1, (x) => 1 / Math.sqrt(1 - Math.pow(x.v / c, 2))] },
    tex: { E: "E_{kin} = (\\gamma - 1)\\,m_e c^2", ga: "\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}" }, inv: { v: "v = c\\sqrt{1 - \\frac{1}{\\gamma^2}}" }, invOut: "ga" });
  spec("rotverschiebung", { ctx: "Eine Spektrallinie mit der Laborwellenlänge $\\lambda_0$ erscheint im Licht einer Galaxie rotverschoben; die Rotverschiebung ist $z$.",
    v: { l0: ["\\lambda_0", "Laborwellenlänge", "nm", 400, 660, 1], z: ["z", "Rotverschiebung", "", 0.005, 0.08, 3] },
    o: { la: ["\\lambda", "gemessene Wellenlänge", "nm", 4, 1, (x) => x.l0 * (1 + x.z)], v: ["v", "Fluchtgeschwindigkeit (für kleine z)", "km/s", 3, 1e3, (x) => x.z * c] },
    tex: { la: "z = \\frac{\\lambda - \\lambda_0}{\\lambda_0} \\;\\Rightarrow\\; \\lambda = \\lambda_0 (1 + z)", v: "v \\approx z\\,c" }, inv: { z: "z = \\frac{\\lambda - \\lambda_0}{\\lambda_0}" }, invKeys: ["z"], invOut: "la", cst: CC });
  spec("zeitdilatation", { ctx: "Myonen fliegen mit $v$ durch die Atmosphäre; ihre mittlere Lebensdauer in ihrem eigenen System ist $\\tau_0$.",
    v: { v: ["v", "Geschwindigkeit", "c", 0.5, 0.999, 3, c], t0: ["\\tau_0", "Eigenzeit", "µs", 1, 10, 1, 1e-6, "ns", 1e-9] },
    o: { t: ["\\tau", "Lebensdauer im Erdsystem", "µs", 3, 1e-6, (x) => x.t0 / Math.sqrt(1 - Math.pow(x.v / c, 2))] },
    tex: { t: "\\tau = \\frac{\\tau_0}{\\sqrt{1 - v^2/c^2}}" }, inv: { v: "v = c\\sqrt{1 - \\frac{\\tau_0^2}{\\tau^2}}" }, invKeys: ["v"] });

  // ---------------------------------------------------------------- engine
  const sig = (x, n) => { if (!x) return 0; const p = Math.pow(10, n - 1 - Math.floor(Math.log10(Math.abs(x)))); return Math.round(x * p) / p; };
  const KWORD = { 2: "verdoppelt", 3: "verdreifacht", 4: "vervierfacht", 0.5: "halbiert" };
  const unitText = (un) => (un ? " " + un : "");

  function pick(S, G, alt) {
    for (let tries = 0; tries < 60; tries++) {
      const si = {}, shown = {};
      for (const key of Object.keys(S.v)) {
        const [sym, name, unit, min, max, dec, k = 1, au, ak] = S.v[key];
        let x = G.round(min + G.r() * (max - min), dec);
        if (x === 0) x = min || Math.pow(10, -dec);
        si[key] = x * k;
        shown[key] = { sym, name, unit, val: x, dec };
        if (alt && au && G.chance(0.75)) {
          const xa = sig((x * k) / ak, 3);
          si[key] = xa * ak;
          shown[key] = { sym, name, unit: au, val: xa, dec: 6, alt: true };
        }
      }
      const outs = {};
      let fine = !S.ok || S.ok(si);
      for (const key of Object.keys(S.o)) { const val = S.o[key][5](si); outs[key] = val; if (!isFinite(val)) fine = false; }
      if (fine) return { si, shown, outs };
    }
    return null;
  }
  const given = (G, sh) => "$" + sh.sym + "$ = " + G.fmt(sh.val, sh.dec) + unitText(sh.unit);
  /** exponent q with result ~ input^q, if the result is a power law of the input (checked at two random points) */
  function powerLaw(S, G, okey, ikey) {
    const qs = [];
    for (let t = 0; t < 2; t++) {
      const P = pick(S, G, false);
      if (!P) return null;
      const a = S.o[okey][5](P.si), b = S.o[okey][5](Object.assign({}, P.si, { [ikey]: P.si[ikey] * 2 }));
      if (!(a > 0 && b > 0)) return null;
      qs.push(Math.log(b / a) / Math.log(2));
    }
    const q = Math.round(qs[0] * 2) / 2;
    return Math.abs(qs[0] - q) < 0.01 && Math.abs(qs[1] - q) < 0.01 ? q : null;
  }
  function factorTex(k, q) {
    const v = Math.pow(k, q);
    if (q === 0) return "1";
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    if (Math.abs(1 / v - Math.round(1 / v)) < 1e-9) return "\\tfrac{1}{" + Math.round(1 / v) + "}";
    const m = Math.pow(k, 2 * q);
    if (Math.abs(m - Math.round(m)) < 1e-9) return "\\sqrt{" + Math.round(m) + "}";
    if (Math.abs(1 / m - Math.round(1 / m)) < 1e-9) return "\\tfrac{1}{\\sqrt{" + Math.round(1 / m) + "}}";
    return G_fmt(v);
  }
  const G_fmt = (v) => String(Math.round(v * 1000) / 1000).replace(".", "{,}");
  const qTex = (q) => (q === 0.5 ? "\\tfrac12" : q === -0.5 ? "-\\tfrac12" : q === 1.5 ? "\\tfrac32" : q === -1.5 ? "-\\tfrac32" : String(q));

  function numericStep(md, ans, unit, explain) {
    const a = sig(ans, 3);
    return { type: "numeric", md, answer: a, tolerance: Math.max(Math.abs(a) * 0.02, 1e-9), placeholder: unit || "", explain };
  }

  function make(level, G, params) {
    const list = [].concat((params && params.typ) || Object.keys(T)).filter((k) => T[k]);
    const id = G.pick(list.length ? list : Object.keys(T));
    if (T[id].custom) return T[id].custom(level, G);
    const S = T[id];
    const okeys = Object.keys(S.o);
    const cst = S.cst ? "\n\nKonstanten: " + S.cst + "." : "";
    // level 4: proportionality, if some output is a power law of some input
    if (level >= 4) {
      const pairs = [];
      okeys.forEach((ok) => Object.keys(S.v).forEach((ik) => { const q = powerLaw(S, G, ok, ik); if (q !== null && q !== 0) pairs.push([ok, ik, q]); }));
      if (pairs.length) {
        const [ok, ik, q] = G.pick(pairs);
        const k = G.pick([2, 3, 4, 0.5]);
        const o = S.o[ok], iv = S.v[ik];
        const qs = [-2, -1, -0.5, 0.5, 1, 1.5, 2, 3, 0];
        const wrong = G.shuffle(qs.filter((x) => x !== q)).sort((a, b) => Math.abs(a - q) - Math.abs(b - q)).slice(0, 4);
        const opts = G.shuffle([q].concat(wrong)).map((x) => ({ md: x === 0 ? "bleibt gleich" : "ändert sich um den Faktor $" + factorTex(k, x) + "$", correct: x === q }));
        return { type: "choice", md: S.ctx + "\n\nWie ändert sich $" + o[0] + "$ (" + o[1] + "), wenn $" + iv[0] + "$ (" + iv[1] + ") " + KWORD[k] + " wird und alles andere gleich bleibt?", options: opts,
          explain: "Aus $" + S.tex[ok] + "$ folgt $" + o[0] + " \\sim " + iv[0] + (q === 1 ? "" : "^{" + qTex(q) + "}") + "$. Der Faktor ist also $" + (k === 0.5 ? "\\left(\\tfrac12\\right)" : k) + "^{" + qTex(q) + "} = " + factorTex(k, q) + "$. Proportionalitäten lassen sich ohne Zahlen prüfen, im Abitur oft eine schnelle Teilaufgabe." };
      }
      level = 3; // no power law: a backward task with everyday units instead
    }
    const backward = level === 3 || (level === 4 && !S.noInv);
    const P = pick(S, G, level >= 2);
    if (!P) return { type: "text", md: "Diese Aufgabe ließ sich nicht erzeugen.", explain: "" };
    if (backward && !S.noInv) {
      const keys = (S.invKeys || Object.keys(S.v)).filter((k) => S.v[k]);
      const ik = G.pick(keys);
      const ok = S.invOut && S.o[S.invOut] ? S.invOut : okeys[0];
      const o = S.o[ok];
      const outVal = sig(P.outs[ok] / o[4], o[3]);
      const others = Object.keys(S.v).filter((k) => k !== ik).map((k) => given(G, P.shown[k]));
      const sh = P.shown[ik];
      const want = P.si[ik] / (S.v[ik][6] || 1);
      const md = S.ctx + "\n\n**Gegeben:** " + others.concat(["$" + o[0] + "$ = " + G.fmt(outVal, 6) + unitText(o[2])]).join(", ") + cst + "\n\n**Gesucht:** " + S.v[ik][1] + " $" + S.v[ik][0] + "$" + (S.v[ik][2] ? " in " + S.v[ik][2] : "") + ".";
      const how = S.inv && S.inv[ik] ? "Nach $" + S.v[ik][0] + "$ umgestellt: $" + S.inv[ik] + "$." : "Stelle $" + S.tex[ok] + "$ nach $" + S.v[ik][0] + "$ um.";
      return numericStep(md, want, S.v[ik][2], "Ansatz: $" + S.tex[ok] + "$. " + how + " Mit den Werten in SI-Einheiten ergibt sich $" + S.v[ik][0] + " \\approx " + G.tex(sig(want, 3), 6) + "$" + unitText(S.v[ik][2]) + "." + (sh.alt ? "" : ""));
    }
    const ok = G.pick(okeys);
    const o = S.o[ok];
    const ans = P.outs[ok] / o[4];
    const conv = Object.keys(S.v).filter((k) => P.shown[k].alt).map((k) => G.fmt(P.shown[k].val, 6) + " " + P.shown[k].unit + " = " + G.fmt(sig(P.si[k] / (S.v[k][6] || 1), 4), 6) + unitText(S.v[k][2]));
    const md = S.ctx + "\n\n**Gegeben:** " + Object.keys(S.v).map((k) => given(G, P.shown[k])).join(", ") + cst + "\n\n**Gesucht:** " + o[1] + " $" + o[0] + "$" + (o[2] ? " in " + o[2] : "") + ".";
    return numericStep(md, ans, o[2], (conv.length ? "Zuerst umrechnen: " + conv.join("; ") + ". " : "") + "Ansatz: $" + S.tex[ok] + "$. Eingesetzt ergibt sich $" + o[0] + " \\approx " + G.tex(sig(ans, 3), 6) + "$" + unitText(o[2]) + ".");
  }

  // ---------------------------------------------------------------- special task types
  spec("kondensator-getrennt", { custom(level, G) {
    const k = G.pick([2, 3, 0.5]);
    const kw = { 2: "verdoppelt", 3: "verdreifacht", 0.5: "halbiert" }[k];
    const connected = G.chance(0.5);
    const qty = G.pick(["Q", "U", "E", "W"]);
    const names = { Q: "die Ladung $Q$", U: "die Spannung $U$", E: "die Feldstärke $E$ zwischen den Platten", W: "die gespeicherte Energie $E_{el}$" };
    // C ~ 1/d. Disconnected: Q constant, U = Q/C ~ d, E = U/d constant, W = Q^2/(2C) ~ d. Connected: U constant, Q = CU ~ 1/d, E = U/d ~ 1/d, W = CU^2/2 ~ 1/d
    const exp = connected ? { Q: -1, U: 0, E: -1, W: -1 } : { Q: 0, U: 1, E: 0, W: 1 };
    const q = exp[qty];
    const fmtF = (x) => (x === 0 ? "bleibt gleich" : "ändert sich um den Faktor $" + factorTex(k, x) + "$");
    const opts = G.shuffle([-1, 0, 1, 2].map((x) => ({ md: fmtF(x), correct: x === q })));
    return { type: "choice", md: "Ein geladener Plattenkondensator " + (connected ? "bleibt an die Spannungsquelle angeschlossen" : "wird von der Spannungsquelle getrennt") + ". Dann wird der Plattenabstand $d$ " + kw + ". Wie ändert sich " + names[qty] + "?", options: opts,
      explain: "Die Kapazität $C = \\varepsilon_0 \\frac{A}{d}$ ändert sich um den Faktor $" + factorTex(k, -1) + "$. " + (connected
        ? "Angeschlossen bleibt $U$ gleich. Dann ändern sich $Q = CU$, $E = \\frac{U}{d}$ und $E_{el} = \\tfrac12 C U^2$ wie $\\frac{1}{d}$."
        : "Getrennt bleibt die Ladung $Q$ gleich (sie kann nicht abfließen). Dann wächst $U = \\frac{Q}{C}$ wie $d$, die Feldstärke $E = \\frac{Q}{\\varepsilon_0 A}$ bleibt gleich, und $E_{el} = \\frac{Q^2}{2C}$ wächst wie $d$: die Energie kommt aus der Arbeit beim Auseinanderziehen.") };
  } });
  const NUCLIDES = [["\\,^{4}_{2}\\mathrm{He}", 2, 2, 4.001506], ["\\,^{12}_{6}\\mathrm{C}", 6, 6, 11.996709], ["\\,^{16}_{8}\\mathrm{O}", 8, 8, 15.990526], ["\\,^{56}_{26}\\mathrm{Fe}", 26, 30, 55.920673], ["\\,^{238}_{92}\\mathrm{U}", 92, 146, 238.000318], ["\\,^{7}_{3}\\mathrm{Li}", 3, 4, 7.014355]];
  spec("bindungsenergie", { custom(level, G) {
    const [sym, Z, N, mk] = G.pick(NUCLIDES);
    const mpU = 1.007276, mnU = 1.008665;
    const dm = Z * mpU + N * mnU - mk, EB = dm * 931.5, per = EB / (Z + N);
    const askPer = level >= 3;
    const ans = askPer ? per : EB;
    const md = "Der Kern $" + sym + "$ hat die Kernmasse $m_K = " + String(mk).replace(".", "{,}") + "\\,\\mathrm{u}$ ($m_p = 1{,}007276\\,\\mathrm{u}$, $m_n = 1{,}008665\\,\\mathrm{u}$, $1\\,\\mathrm{u}\\cdot c^2 = 931{,}5\\,\\mathrm{MeV}$).\n\n**Gesucht:** " + (askPer ? "Bindungsenergie pro Nukleon in MeV." : "Bindungsenergie in MeV.");
    return numericStep(md, ans, "MeV", "Massendefekt $\\Delta m = Z m_p + N m_n - m_K = " + Z + " \\cdot 1{,}007276 + " + N + " \\cdot 1{,}008665 - " + String(mk).replace(".", "{,}") + " \\approx " + G.tex(sig(dm, 4), 6) + "\\,\\mathrm{u}$. Bindungsenergie $E_B = \\Delta m\\,c^2 \\approx " + G.tex(sig(EB, 4), 6) + "\\,\\mathrm{MeV}$" + (askPer ? ", pro Nukleon $\\frac{E_B}{A} \\approx " + G.tex(sig(per, 3), 6) + "\\,\\mathrm{MeV}$. Eisen liegt mit etwa 8,8 MeV am höchsten: leichte Kerne gewinnen Energie durch Fusion, schwere durch Spaltung." : ". Die Kernmasse ist kleiner als die Summe der Nukleonenmassen: diese Differenz wurde beim Zusammenbau als Energie frei."));
  } });

  LW.generator("phy-rechnen", { title: "Physik rechnen", make });
  LW.physikTypen = T;
})();

// Training topics per chapter of the physics course: the task types of that chapter, mixed.
(function () {
  const make = LW.generators["phy-rechnen"].make;
  const chapter = (typ) => ({ title: "Physik rechnen", make: (level, G) => make(level, G, { typ }) });
  LW.generator("phy-r-kinematik", chapter(["waagerechter-wurf", "schiefer-wurf", "fall", "bewegungsgleichung", "begegnung", "verfolgung", "vt", "wurf-bahn"]));
  LW.generator("phy-r-dynamik", chapter(["schiefe-ebene", "energie-fall", "energie-feder", "stoss", "stoss-elastisch"]));
  LW.generator("phy-r-kreis", chapter(["kreis", "zentripetal", "gravitation", "satellit", "flucht", "kepler3"]));
  LW.generator("phy-r-rotation", chapter(["drehmoment", "drehimpuls", "grenzgeschwindigkeit", "entropie", "euler"]));
  LW.generator("phy-r-efeld", chapter(["plattenfeld", "kraft-feld", "kondensator", "kondensator-getrennt", "ablenkung", "beschleunigung-u", "millikan"]));
  LW.generator("phy-r-bfeld", chapter(["lorentz", "bahnradius", "fadenstrahl", "wien", "massenspektrometer", "hall", "linac"]));
  LW.generator("phy-r-induktion", chapter(["induktion", "bewegungsinduktion", "induktivitaet", "selbstinduktion", "trafo"]));
  LW.generator("phy-r-schwingungen", chapter(["federpendel", "fadenpendel", "schwingung-energie", "schwingung-y", "daempfung", "resonanz", "thomson"]));
  LW.generator("phy-r-wellen", chapter(["welle-c", "welle-y", "stehende-welle", "doppler", "schwebung", "superposition"]));
  LW.generator("phy-r-optik", chapter(["gitter", "snellius", "grenzwinkel"]));
  LW.generator("phy-r-quanten", chapter(["photoeffekt", "photonenimpuls", "debroglie"]));
  LW.generator("phy-r-atom", chapter(["bohr", "spektrallinie", "franck-hertz", "duane-hunt", "bragg"]));
  LW.generator("phy-r-kern", chapter(["zerfall", "halbwertszeit", "aktivitaet"]));
  LW.generator("phy-r-relativ", chapter(["zeitdilatation", "laengenkontraktion", "rel-energie"]));
  LW.generator("phy-r-q4kern", chapter(["bindungsenergie", "kernenergie"]));
  LW.generator("phy-r-astro", chapter(["hubble", "rotverschiebung"]));
})();
