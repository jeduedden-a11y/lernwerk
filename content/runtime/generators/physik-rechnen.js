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
  // rotation, friction and heat beyond the basic types
  spec("hebel", { ctx: "An einem Hebel greift im Abstand $r_1$ vom Drehpunkt die Last $F_1$ an. Auf der anderen Seite soll im Abstand $r_2$ eine Kraft $F_2$ senkrecht zum Hebel für Gleichgewicht sorgen.",
    v: { F1: ["F_1", "Last", "N", 50, 2000, 0], r1: ["r_1", "Lastarm", "cm", 5, 100, 0, 0.01, "m", 1], r2: ["r_2", "Kraftarm", "cm", 20, 300, 0, 0.01, "m", 1] },
    o: { F2: ["F_2", "nötige Kraft", "N", 3, 1, (x) => (x.F1 * x.r1) / x.r2] },
    tex: { F2: "F_1\\,r_1 = F_2\\,r_2 \\;\\Rightarrow\\; F_2 = \\frac{F_1\\,r_1}{r_2}" }, inv: { r2: "r_2 = \\frac{F_1\\,r_1}{F_2}", F1: "F_1 = \\frac{F_2\\,r_2}{r_1}" } });
  spec("rollen", { ctx: "Ein Körper rollt ohne zu gleiten aus der Ruhe eine schiefe Ebene hinab; der Höhenunterschied ist $h$. Sein Trägheitsmoment ist $I = k\\,m r^2$ (Vollkugel $k = 0{,}4$, Vollzylinder $k = 0{,}5$, Hohlzylinder $k = 1$).",
    v: { h: ["h", "Höhenunterschied", "m", 0.2, 5, 2, 1, "cm", 0.01], k: ["k", "Formfaktor", "", 0.4, 1, 1] },
    o: { v: ["v", "Geschwindigkeit unten", "m/s", 3, 1, (x) => Math.sqrt((2 * g * x.h) / (1 + x.k))] },
    tex: { v: "m g h = \\tfrac12 m v^2 + \\tfrac12 I\\omega^2 = \\tfrac12 m v^2\\,(1 + k) \\;\\Rightarrow\\; v = \\sqrt{\\frac{2 g h}{1 + k}}" }, inv: { h: "h = \\frac{(1 + k)\\,v^2}{2g}" }, invKeys: ["h"], cst: CG });
  spec("rotationsenergie", { ctx: "Ein Schwungrad (Vollzylinder mit der Masse $m$ und dem Radius $r$) dreht sich mit der Drehzahl $n$.",
    v: { m: ["m", "Masse", "kg", 5, 200, 0], r: ["r", "Radius", "cm", 10, 80, 0, 0.01, "m", 1], n: ["n", "Drehzahl", "1/min", 300, 6000, 0, 1 / 60] },
    o: { E: ["E_{rot}", "Rotationsenergie", "kJ", 3, 1e3, (x) => 0.5 * (0.5 * x.m * x.r * x.r) * Math.pow(2 * Math.PI * x.n, 2)] },
    tex: { E: "I = \\tfrac12 m r^2,\\; \\omega = 2\\pi f,\\; E_{rot} = \\tfrac12 I\\omega^2" }, inv: { n: "n = 60\\,\\mathrm{s}\\cdot\\frac{1}{2\\pi}\\sqrt{\\frac{2 E_{rot}}{I}}" }, invKeys: ["n"] });
  spec("anlaufen", { ctx: "Ein Motor treibt ein Schwungrad mit dem Trägheitsmoment $I$ aus der Ruhe mit dem konstanten Drehmoment $M$ an.",
    v: { I: ["I", "Trägheitsmoment", "kg·m²", 0.05, 5, 2], M: ["M", "Drehmoment", "N·m", 0.5, 50, 1], t: ["t", "Zeit", "s", 1, 30, 0] },
    o: { w: ["\\omega", "Winkelgeschwindigkeit nach der Zeit t", "1/s", 3, 1, (x) => (x.M * x.t) / x.I], n: ["n", "Drehzahl nach der Zeit t", "1/min", 3, 1 / 60, (x) => (x.M * x.t) / x.I / (2 * Math.PI)] },
    tex: { w: "M = I\\,\\alpha \\;\\Rightarrow\\; \\omega = \\alpha\\,t = \\frac{M\\,t}{I}", n: "\\omega = \\frac{M\\,t}{I},\\; n = \\frac{60\\,\\mathrm{s}\\cdot\\omega}{2\\pi}" },
    inv: { M: "M = \\frac{I\\,\\omega}{t}", t: "t = \\frac{I\\,\\omega}{M}" }, invOut: "w", ok: (x) => (x.M * x.t) / x.I < 2000 });
  spec("drehimpuls-scheibe", { ctx: "Eine Drehscheibe (Trägheitsmoment $I$) dreht sich reibungsfrei mit der Winkelgeschwindigkeit $\\omega_1$. Ein Kind (Masse $m$) springt aus dem Stand auf den Rand der Scheibe im Abstand $r$ von der Achse.",
    v: { I: ["I", "Trägheitsmoment der Scheibe", "kg·m²", 50, 500, 0], w1: ["\\omega_1", "Winkelgeschwindigkeit vorher", "1/s", 0.5, 3, 1], m: ["m", "Masse des Kindes", "kg", 20, 60, 0], r: ["r", "Abstand von der Achse", "m", 1, 3, 1, 1, "cm", 0.01] },
    o: { w2: ["\\omega_2", "Winkelgeschwindigkeit danach", "1/s", 3, 1, (x) => (x.I * x.w1) / (x.I + x.m * x.r * x.r)] },
    tex: { w2: "I\\,\\omega_1 = (I + m r^2)\\,\\omega_2 \\;\\Rightarrow\\; \\omega_2 = \\frac{I\\,\\omega_1}{I + m r^2}" }, inv: { I: "I = \\frac{m r^2\\,\\omega_2}{\\omega_1 - \\omega_2}" }, invKeys: ["I"] });
  spec("carnot", { ctx: "Eine Wärmekraftmaschine arbeitet zwischen einem heißen Reservoir der Temperatur $\\vartheta_w$ und einem kalten der Temperatur $\\vartheta_k$.",
    v: { tw: ["\\vartheta_w", "Temperatur heiß", "°C", 150, 900, 0], tk: ["\\vartheta_k", "Temperatur kalt", "°C", 5, 60, 0] },
    o: { eta: ["\\eta_C", "größtmöglicher Wirkungsgrad", "%", 3, 0.01, (x) => 1 - (x.tk + 273.15) / (x.tw + 273.15)] },
    tex: { eta: "\\eta_C = 1 - \\frac{T_k}{T_w}\\quad\\text{mit } T = \\vartheta + 273{,}15\\,\\mathrm{K}" }, noInv: true });
  spec("entropie-fluss", { ctx: "Ein Körper der Temperatur $\\vartheta_w$ gibt die Wärme $Q$ an einen kälteren Körper der Temperatur $\\vartheta_k$ ab; beide Temperaturen ändern sich dabei kaum.",
    v: { Q: ["Q", "Wärme", "J", 100, 10000, 0, 1, "kJ", 1e3], tw: ["\\vartheta_w", "Temperatur warm", "°C", 40, 300, 0], tk: ["\\vartheta_k", "Temperatur kalt", "°C", 2, 35, 0] },
    o: { S: ["\\Delta S_{ges}", "Entropieänderung insgesamt", "J/K", 3, 1, (x) => x.Q / (x.tk + 273.15) - x.Q / (x.tw + 273.15)] },
    tex: { S: "\\Delta S_{ges} = \\frac{Q}{T_k} - \\frac{Q}{T_w}\\quad\\text{(Temperaturen in Kelvin)}" }, noInv: true });
  spec("verdampfen", { ctx: "Wasser der Masse $m$ verdampft bei 100 °C (373 K) vollständig. Die spezifische Verdampfungswärme ist 2257 kJ/kg.",
    v: { m: ["m", "Masse", "g", 10, 2000, 0, 1e-3, "kg", 1] },
    o: { S: ["\\Delta S", "Entropiezunahme", "J/K", 3, 1, (x) => (x.m * 2257e3) / 373.15] },
    tex: { S: "\\Delta S = \\frac{Q}{T} = \\frac{m\\,r_V}{T}" }, inv: { m: "m = \\frac{T\\,\\Delta S}{r_V}" } });
  spec("luftleistung", { ctx: "Ein Auto (Luftwiderstandsbeiwert $c_w$, Stirnfläche $A$) fährt mit konstanter Geschwindigkeit $v$. Die Luftdichte ist $\\rho = 1{,}2\\,\\mathrm{kg/m^3}$.",
    v: { cw: ["c_w", "Luftwiderstandsbeiwert", "", 0.22, 0.45, 2], A: ["A", "Stirnfläche", "m²", 1.8, 3, 1], v: ["v", "Geschwindigkeit", "km/h", 50, 220, 0, 1 / 3.6, "m/s", 1] },
    o: { P: ["P", "Leistung gegen den Luftwiderstand", "kW", 3, 1e3, (x) => 0.5 * x.cw * 1.2 * x.A * Math.pow(x.v, 3)] },
    tex: { P: "P = F_L\\,v = \\tfrac12 c_w \\rho A v^2\\cdot v = \\tfrac12 c_w \\rho A v^3" }, inv: { v: "v = \\sqrt[3]{\\frac{2P}{c_w \\rho A}}" }, invKeys: ["v"] });
  spec("stokes", { ctx: "Ein kugelförmiges Wassertröpfchen (Radius $r$, Dichte $1000\\,\\mathrm{kg/m^3}$) sinkt in Luft (Viskosität $\\eta = 1{,}8\\cdot 10^{-5}\\,\\mathrm{Pa\\,s}$) mit konstanter Geschwindigkeit. Die Reibung folgt dem Stokes-Gesetz $F_R = 6\\pi\\eta r v$; den Auftrieb vernachlässigt man.",
    v: { r: ["r", "Radius", "µm", 1, 40, 1, 1e-6] },
    o: { v: ["v", "Sinkgeschwindigkeit", "mm/s", 3, 1e-3, (x) => (2 * x.r * x.r * 1000 * g) / (9 * 1.8e-5)] },
    tex: { v: "\\tfrac43\\pi r^3\\rho\\,g = 6\\pi\\eta r v \\;\\Rightarrow\\; v = \\frac{2 r^2 \\rho\\,g}{9\\eta}" }, inv: { r: "r = \\sqrt{\\frac{9\\eta v}{2\\rho g}}" }, cst: CG });
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
  // dynamics beyond the basic types: recoil, impulse, coupled bodies, energy with friction, pendulum, loop
  spec("rueckstoss", { ctx: "Eine Person springt waagerecht von einem ruhenden Boot ab. Der Wasserwiderstand wird vernachlässigt.",
    v: { m: ["m", "Masse der Person", "kg", 40, 95, 0], v: ["v", "Absprunggeschwindigkeit der Person", "m/s", 1, 5, 1, 1, "km/h", 1 / 3.6], M: ["M", "Masse des Bootes", "kg", 60, 400, 0, 1, "t", 1e3] },
    o: { V: ["V", "Rückstoßgeschwindigkeit des Bootes (Betrag)", "m/s", 3, 1, (x) => (x.m * x.v) / x.M] },
    tex: { V: "0 = m v + M V \\;\\Rightarrow\\; |V| = \\frac{m}{M}\\,v" }, inv: { M: "M = \\frac{m v}{|V|}", v: "v = \\frac{M\\,|V|}{m}", m: "m = \\frac{M\\,|V|}{v}" } });
  spec("schub", { ctx: "Ein Raketentriebwerk stößt in jeder Sekunde die Gasmasse $\\mu$ mit der Ausströmgeschwindigkeit $u$ (relativ zur Rakete) nach hinten aus.",
    v: { mu: ["\\mu", "Massenstrom", "kg/s", 50, 3000, 0, 1, "t/s", 1e3], u: ["u", "Ausströmgeschwindigkeit", "m/s", 1500, 4500, 0, 1, "km/s", 1e3] },
    o: { F: ["F", "Schubkraft", "kN", 3, 1e3, (x) => x.mu * x.u] },
    tex: { F: "F = \\frac{\\Delta m}{\\Delta t}\\,u = \\mu\\,u" }, inv: { mu: "\\mu = \\frac{F}{u}", u: "u = \\frac{F}{\\mu}" } });
  spec("kraftstoss", { ctx: "Ein Körper der Masse $m$ wird aus der Geschwindigkeit $v$ innerhalb der Zeit $\\Delta t$ bis zum Stillstand abgebremst.",
    v: { m: ["m", "Masse", "kg", 0.2, 8, 1, 1, "g", 1e-3], v: ["v", "Anfangsgeschwindigkeit", "m/s", 2, 30, 1, 1, "km/h", 1 / 3.6], dt: ["\\Delta t", "Bremszeit", "ms", 5, 300, 0, 1e-3, "s", 1] },
    o: { F: ["\\bar F", "mittlere Bremskraft", "N", 3, 1, (x) => (x.m * x.v) / x.dt] },
    tex: { F: "\\bar F = \\frac{\\Delta p}{\\Delta t} = \\frac{m\\,v}{\\Delta t}" }, inv: { dt: "\\Delta t = \\frac{m v}{\\bar F}", m: "m = \\frac{\\bar F\\,\\Delta t}{v}", v: "v = \\frac{\\bar F\\,\\Delta t}{m}" } });
  spec("aufzug", { ctx: "Ein Aufzug der Gesamtmasse $m$ fährt nach oben an und wird dabei gleichmäßig mit $a$ beschleunigt.",
    v: { m: ["m", "Gesamtmasse", "kg", 300, 1500, 0, 1, "t", 1e3], a: ["a", "Beschleunigung", "m/s²", 0.3, 2.5, 1] },
    o: { F: ["F_S", "Seilkraft", "kN", 3, 1e3, (x) => x.m * (g + x.a)] },
    tex: { F: "F_S - m g = m a \\;\\Rightarrow\\; F_S = m\\,(g + a)" }, inv: { a: "a = \\frac{F_S}{m} - g", m: "m = \\frac{F_S}{g + a}" }, cst: CG });
  spec("gekoppelt", { ctx: "Ein Wagen der Masse $m_1$ rollt reibungsfrei auf einem Tisch. Ein Faden über eine Rolle an der Tischkante verbindet ihn mit einem frei hängenden Körper der Masse $m_2$.",
    v: { m1: ["m_1", "Masse des Wagens", "kg", 0.2, 3, 2, 1, "g", 1e-3], m2: ["m_2", "Masse des hängenden Körpers", "kg", 0.02, 1, 2, 1, "g", 1e-3] },
    o: { a: ["a", "Beschleunigung beider Körper", "m/s²", 3, 1, (x) => (x.m2 * g) / (x.m1 + x.m2)], F: ["F_S", "Fadenkraft", "N", 3, 1, (x) => (x.m1 * x.m2 * g) / (x.m1 + x.m2)] },
    tex: { a: "(m_1 + m_2)\\,a = m_2\\,g \\;\\Rightarrow\\; a = \\frac{m_2}{m_1 + m_2}\\,g", F: "F_S = m_1 a = \\frac{m_1 m_2}{m_1 + m_2}\\,g" },
    inv: { m2: "m_2 = \\frac{m_1\\,a}{g - a}", m1: "m_1 = m_2\\left(\\frac{g}{a} - 1\\right)" }, invOut: "a", cst: CG });
  spec("energie-reibung", { ctx: "Ein Schlitten der Masse $m$ gleitet aus der Ruhe einen Hang hinab, der $h$ hoch ist, und ist unten $v$ schnell.",
    v: { m: ["m", "Masse", "kg", 5, 80, 0], h: ["h", "Höhenunterschied", "m", 2, 30, 1, 1, "cm", 0.01], v: ["v", "Geschwindigkeit unten", "m/s", 2, 20, 1, 1, "km/h", 1 / 3.6] },
    o: { W: ["W_R", "in Wärme umgewandelte Energie (Reibungsarbeit)", "J", 3, 1, (x) => x.m * g * x.h - 0.5 * x.m * x.v * x.v] },
    tex: { W: "m g h = \\tfrac12 m v^2 + W_R \\;\\Rightarrow\\; W_R = m g h - \\tfrac12 m v^2" }, inv: { v: "v = \\sqrt{2 g h - \\frac{2 W_R}{m}}", h: "h = \\frac{W_R + \\tfrac12 m v^2}{m g}" }, invKeys: ["v", "h"],
    ok: (x) => x.m * g * x.h - 0.5 * x.m * x.v * x.v > 0.15 * x.m * g * x.h, cst: CG });
  spec("energie-wurf", { ctx: "Ein Ball wird aus der Höhe $h_0$ über dem Boden mit der Geschwindigkeit $v_0$ senkrecht nach oben geworfen (ohne Luftwiderstand).",
    v: { h0: ["h_0", "Abwurfhöhe", "m", 0.5, 20, 1, 1, "cm", 0.01], v0: ["v_0", "Abwurfgeschwindigkeit", "m/s", 2, 25, 1, 1, "km/h", 1 / 3.6] },
    o: { H: ["h_{max}", "größte Höhe über dem Boden", "m", 3, 1, (x) => x.h0 + (x.v0 * x.v0) / (2 * g)], v: ["v_B", "Geschwindigkeit beim Aufprall auf den Boden", "m/s", 3, 1, (x) => Math.sqrt(x.v0 * x.v0 + 2 * g * x.h0)] },
    tex: { H: "m g h_0 + \\tfrac12 m v_0^2 = m g h_{max} \\;\\Rightarrow\\; h_{max} = h_0 + \\frac{v_0^2}{2g}", v: "\\tfrac12 m v_0^2 + m g h_0 = \\tfrac12 m v_B^2 \\;\\Rightarrow\\; v_B = \\sqrt{v_0^2 + 2 g h_0}" },
    inv: { v0: "v_0 = \\sqrt{2g\\,(h_{max} - h_0)}" }, invKeys: ["v0"], invOut: "H", cst: CG });
  spec("pendel-energie", { ctx: "Ein Fadenpendel der Länge $l$ wird um den Winkel $\\varphi$ ausgelenkt und aus der Ruhe losgelassen (ohne Reibung).",
    v: { l: ["l", "Fadenlänge", "m", 0.3, 3, 2, 1, "cm", 0.01], ph: ["\\varphi", "Auslenkwinkel", "°", 10, 80, 0, DEG] },
    o: { v: ["v", "Geschwindigkeit im tiefsten Punkt", "m/s", 3, 1, (x) => Math.sqrt(2 * g * x.l * (1 - Math.cos(x.ph)))], h: ["h", "Höhe des Startpunkts über dem tiefsten Punkt", "cm", 3, 0.01, (x) => x.l * (1 - Math.cos(x.ph))] },
    tex: { v: "h = l\\,(1 - \\cos\\varphi),\\; m g h = \\tfrac12 m v^2 \\;\\Rightarrow\\; v = \\sqrt{2 g l\\,(1 - \\cos\\varphi)}", h: "h = l\\,(1 - \\cos\\varphi)" },
    inv: { l: "l = \\frac{v^2}{2 g\\,(1 - \\cos\\varphi)}" }, invKeys: ["l"], invOut: "v", cst: CG });
  spec("looping", { ctx: "Ein Wagen startet aus der Ruhe auf einer reibungsfreien Bahn und soll einen Looping mit dem Radius $r$ durchfahren, ohne im obersten Punkt aus der Bahn zu fallen.",
    v: { r: ["r", "Radius des Loopings", "m", 2, 15, 1, 1, "cm", 0.01] },
    o: { h: ["h_{min}", "Mindesthöhe des Starts über dem tiefsten Punkt", "m", 3, 1, (x) => 2.5 * x.r] },
    tex: { h: "m\\,\\frac{v_o^2}{r} = m g,\\; m g h = m g\\cdot 2r + \\tfrac12 m v_o^2 \\;\\Rightarrow\\; h_{min} = \\tfrac52\\,r" }, inv: { r: "r = \\tfrac25\\,h_{min}" } });
  spec("haftreibung", { ctx: "Ein Klotz liegt auf einem Brett, dessen Neigung langsam vergrößert wird. Die Haftreibungszahl zwischen Klotz und Brett ist $\\mu_H$.",
    v: { mu: ["\\mu_H", "Haftreibungszahl", "", 0.15, 1.1, 2] },
    o: { al: ["\\alpha", "Neigungswinkel, bei dem der Klotz zu rutschen beginnt", "°", 3, DEG, (x) => Math.atan(x.mu)] },
    tex: { al: "m g\\sin\\alpha = \\mu_H\\,m g\\cos\\alpha \\;\\Rightarrow\\; \\tan\\alpha = \\mu_H" }, inv: { mu: "\\mu_H = \\tan\\alpha" } });
  spec("zug-schraeg", { ctx: "Eine Kiste der Masse $m$ wird mit der Kraft $F$ unter dem Winkel $\\beta$ zur Waagerechten schräg nach oben über einen waagerechten Boden gezogen. Die Gleitreibungszahl ist $\\mu$.",
    v: { m: ["m", "Masse", "kg", 5, 50, 0], F: ["F", "Zugkraft", "N", 30, 300, 0], be: ["\\beta", "Zugwinkel", "°", 10, 50, 0, DEG], mu: ["\\mu", "Gleitreibungszahl", "", 0.1, 0.5, 2] },
    o: { a: ["a", "Beschleunigung", "m/s²", 3, 1, (x) => (x.F * Math.cos(x.be) - x.mu * (x.m * g - x.F * Math.sin(x.be))) / x.m] },
    tex: { a: "m a = F\\cos\\beta - \\mu\\,(m g - F\\sin\\beta)" }, inv: { F: "F = \\frac{m\\,(a + \\mu g)}{\\cos\\beta + \\mu\\sin\\beta}" }, invKeys: ["F"],
    ok: (x) => x.F * Math.sin(x.be) < 0.8 * x.m * g && (x.F * Math.cos(x.be) - x.mu * (x.m * g - x.F * Math.sin(x.be))) / x.m > 0.3, cst: CG });
  spec("ballistisch", { ctx: "Ein Geschoss der Masse $m$ bleibt in einem an Fäden hängenden Holzklotz der Masse $M$ stecken. Der Klotz schwingt danach um die Höhe $h$ nach oben (ballistisches Pendel).",
    v: { m: ["m", "Masse des Geschosses", "g", 2, 30, 0, 1e-3, "kg", 1], M: ["M", "Masse des Klotzes", "kg", 0.5, 5, 1, 1, "g", 1e-3], h: ["h", "Steighöhe", "cm", 1, 25, 1, 0.01, "m", 1] },
    o: { v: ["v", "Geschwindigkeit des Geschosses", "m/s", 3, 1, (x) => ((x.m + x.M) / x.m) * Math.sqrt(2 * g * x.h)] },
    tex: { v: "V = \\sqrt{2 g h},\\; m v = (m + M)\\,V \\;\\Rightarrow\\; v = \\frac{m + M}{m}\\,\\sqrt{2 g h}" }, inv: { h: "h = \\frac{1}{2g}\\left(\\frac{m\\,v}{m + M}\\right)^2" }, invKeys: ["h"],
    ok: (x) => ((x.m + x.M) / x.m) * Math.sqrt(2 * g * x.h) < 1200, cst: CG });
  spec("stoss-gegen", { ctx: "Zwei Wagen fahren auf einer Schiene aufeinander zu und koppeln beim Zusammenstoß. Wagen 1 fährt nach rechts, Wagen 2 nach links.",
    v: { m1: ["m_1", "Masse von Wagen 1", "kg", 0.5, 3, 1, 1, "g", 1e-3], v1: ["v_1", "Geschwindigkeit von Wagen 1", "m/s", 1, 5, 1, 1, "cm/s", 0.01], m2: ["m_2", "Masse von Wagen 2", "kg", 0.2, 2, 1, 1, "g", 1e-3], v2: ["v_2", "Geschwindigkeit von Wagen 2 (Betrag)", "m/s", 0.5, 3, 1, 1, "cm/s", 0.01] },
    o: { v: ["v'", "gemeinsame Geschwindigkeit nach rechts", "m/s", 3, 1, (x) => (x.m1 * x.v1 - x.m2 * x.v2) / (x.m1 + x.m2)] },
    tex: { v: "m_1 v_1 + m_2\\,(-v_2) = (m_1 + m_2)\\,v' \\;\\Rightarrow\\; v' = \\frac{m_1 v_1 - m_2 v_2}{m_1 + m_2}" }, noInv: true,
    ok: (x) => (x.m1 * x.v1 - x.m2 * x.v2) / (x.m1 + x.m2) > 0.1 });
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
  // circular motion and gravitation beyond the basic types
  const CGM = "G = 6,674 · 10⁻¹¹ m³/(kg·s²), Erdmasse 5,97 · 10²⁴ kg, Erdradius 6371 km";
  spec("drehzahl", { ctx: "Ein Rad mit dem Radius $r$ dreht sich gleichförmig mit der Drehzahl $n$.",
    v: { n: ["n", "Drehzahl", "1/min", 100, 6000, 0, 1 / 60], r: ["r", "Radius", "cm", 2, 50, 1, 0.01, "mm", 0.001] },
    o: { w: ["\\omega", "Winkelgeschwindigkeit", "1/s", 3, 1, (x) => 2 * Math.PI * x.n], v: ["v", "Bahngeschwindigkeit am Rand", "m/s", 3, 1, (x) => 2 * Math.PI * x.n * x.r] },
    tex: { w: "f = \\frac{n}{60\\,\\mathrm{s}},\\; \\omega = 2\\pi f", v: "v = \\omega\\,r = 2\\pi f\\,r" }, inv: { r: "r = \\frac{v}{2\\pi f}", n: "n = 60\\,\\mathrm{s}\\cdot\\frac{v}{2\\pi r}" }, invOut: "v" });
  spec("kurve-max", { ctx: "Ein Fahrzeug durchfährt eine waagerechte Kurve mit dem Radius $r$. Die Haftreibungszahl zwischen Reifen und Straße ist $\\mu_H$.",
    v: { r: ["r", "Kurvenradius", "m", 10, 300, 0, 1, "km", 1e3], mu: ["\\mu_H", "Haftreibungszahl", "", 0.2, 1.0, 2] },
    o: { v: ["v_{max}", "größte mögliche Geschwindigkeit", "km/h", 3, 1 / 3.6, (x) => Math.sqrt(x.mu * g * x.r)] },
    tex: { v: "\\mu_H\\,m g = m\\,\\frac{v^2}{r} \\;\\Rightarrow\\; v_{max} = \\sqrt{\\mu_H\\,g\\,r}" }, inv: { r: "r = \\frac{v_{max}^2}{\\mu_H\\,g}", mu: "\\mu_H = \\frac{v_{max}^2}{g\\,r}" }, cst: CG });
  spec("ueberhoehung", { ctx: "Eine Kurve mit dem Radius $r$ ist so geneigt (überhöht), dass ein Fahrzeug sie mit der Geschwindigkeit $v$ ganz ohne Reibung durchfahren kann.",
    v: { r: ["r", "Kurvenradius", "m", 20, 500, 0, 1, "km", 1e3], v: ["v", "Geschwindigkeit", "m/s", 8, 45, 1, 1, "km/h", 1 / 3.6] },
    o: { al: ["\\alpha", "Neigungswinkel der Fahrbahn", "°", 3, DEG, (x) => Math.atan((x.v * x.v) / (x.r * g))] },
    tex: { al: "F_N\\sin\\alpha = m\\,\\frac{v^2}{r},\\; F_N\\cos\\alpha = m g \\;\\Rightarrow\\; \\tan\\alpha = \\frac{v^2}{r\\,g}" }, inv: { v: "v = \\sqrt{r\\,g\\tan\\alpha}", r: "r = \\frac{v^2}{g\\tan\\alpha}" },
    ok: (x) => Math.atan((x.v * x.v) / (x.r * g)) < 60 * DEG, cst: CG });
  spec("kegelpendel", { ctx: "Ein Sitz eines Kettenkarussells läuft gleichförmig auf einem Kreis mit dem Radius $r$; die Kette ist dabei um den Winkel $\\alpha$ gegen die Senkrechte ausgelenkt.",
    v: { r: ["r", "Bahnradius", "m", 3, 12, 1, 1, "cm", 0.01], al: ["\\alpha", "Auslenkwinkel", "°", 15, 60, 0, DEG] },
    o: { v: ["v", "Bahngeschwindigkeit", "m/s", 3, 1, (x) => Math.sqrt(x.r * g * Math.tan(x.al))], T: ["T", "Umlaufdauer", "s", 3, 1, (x) => (2 * Math.PI * x.r) / Math.sqrt(x.r * g * Math.tan(x.al))] },
    tex: { v: "\\tan\\alpha = \\frac{F_Z}{F_G} = \\frac{v^2}{r\\,g} \\;\\Rightarrow\\; v = \\sqrt{r\\,g\\tan\\alpha}", T: "T = \\frac{2\\pi r}{v} = 2\\pi\\sqrt{\\frac{r}{g\\tan\\alpha}}" }, inv: { r: "r = \\frac{v^2}{g\\tan\\alpha}" }, invKeys: ["r"], invOut: "v", cst: CG });
  spec("vertikalkreis", { ctx: "Ein Eimer Wasser (Gesamtmasse $m$) wird an einem Seil auf einem senkrechten Kreis mit dem Radius $r$ geschwungen. Im obersten Punkt ist er $v$ schnell.",
    v: { m: ["m", "Masse", "kg", 0.5, 5, 1, 1, "g", 1e-3], r: ["r", "Radius", "m", 0.5, 1.5, 2, 1, "cm", 0.01], v: ["v", "Geschwindigkeit oben", "m/s", 3, 8, 1] },
    o: { F: ["F_S", "Seilkraft im obersten Punkt", "N", 3, 1, (x) => (x.m * x.v * x.v) / x.r - x.m * g] },
    tex: { F: "F_S + m g = m\\,\\frac{v^2}{r} \\;\\Rightarrow\\; F_S = m\\,\\frac{v^2}{r} - m g" }, inv: { v: "v = \\sqrt{r\\left(\\frac{F_S}{m} + g\\right)}" }, invKeys: ["v"],
    ok: (x) => (x.v * x.v) / x.r > 1.2 * g, cst: CG });
  spec("ortsfaktor", { ctx: "Ein Körper befindet sich in der Höhe $h$ über der Erdoberfläche.",
    v: { h: ["h", "Höhe", "km", 10, 40000, 0, 1e3] },
    o: { g: ["g(h)", "Ortsfaktor in dieser Höhe", "m/s²", 3, 1, (x) => (G * ME) / Math.pow(RE + x.h, 2)] },
    tex: { g: "g(h) = G\\,\\frac{M_E}{(R_E + h)^2}" }, inv: { h: "h = \\sqrt{\\frac{G M_E}{g}} - R_E" }, cst: CGM });
  spec("zentralmasse", { ctx: "Ein Mond umkreist einen Planeten auf einer nahezu kreisförmigen Bahn mit dem Radius $r$ in der Umlaufdauer $T$.",
    v: { r: ["r", "Bahnradius", "km", 5000, 2000000, 0, 1e3], T: ["T", "Umlaufdauer", "d", 0.3, 30, 2, 86400, "h", 3600] },
    o: { M: ["M", "Masse des Planeten", "10²⁴ kg", 3, 1e24, (x) => (4 * Math.PI * Math.PI * Math.pow(x.r, 3)) / (G * x.T * x.T)] },
    tex: { M: "G\\,\\frac{M m}{r^2} = m\\,\\frac{4\\pi^2}{T^2}\\,r \\;\\Rightarrow\\; M = \\frac{4\\pi^2 r^3}{G\\,T^2}" }, inv: { T: "T = 2\\pi\\sqrt{\\frac{r^3}{G M}}", r: "r = \\sqrt[3]{\\frac{G M T^2}{4\\pi^2}}" },
    ok: (x) => { const M = (4 * Math.PI * Math.PI * Math.pow(x.r, 3)) / (G * x.T * x.T); return M > 1e22 && M < 5e27; }, cst: "G = 6,674 · 10⁻¹¹ m³/(kg·s²)" });
  spec("bahnhoehe", { ctx: "Ein Satellit soll die Erde auf einer Kreisbahn in der Umlaufdauer $T$ umrunden.",
    v: { T: ["T", "Umlaufdauer", "h", 1.6, 30, 2, 3600, "min", 60] },
    o: { h: ["h", "Bahnhöhe über der Erdoberfläche", "km", 3, 1e3, (x) => Math.cbrt((G * ME * x.T * x.T) / (4 * Math.PI * Math.PI)) - RE] },
    tex: { h: "G\\,\\frac{M_E m}{r^2} = m\\,\\frac{4\\pi^2}{T^2}\\,r \\;\\Rightarrow\\; r = \\sqrt[3]{\\frac{G M_E T^2}{4\\pi^2}},\\; h = r - R_E" }, inv: { T: "T = 2\\pi\\sqrt{\\frac{(R_E + h)^3}{G M_E}}" },
    ok: (x) => Math.cbrt((G * ME * x.T * x.T) / (4 * Math.PI * Math.PI)) - RE > 150e3, cst: CGM });
  spec("flucht-orbit", { ctx: "Eine Sonde umkreist die Erde auf einer Kreisbahn in der Höhe $h$. Von dort soll sie das Schwerefeld der Erde verlassen.",
    v: { h: ["h", "Bahnhöhe", "km", 200, 36000, 0, 1e3] },
    o: { dv: ["\\Delta v", "nötige Geschwindigkeitszunahme", "km/s", 3, 1e3, (x) => (Math.SQRT2 - 1) * Math.sqrt((G * ME) / (RE + x.h))], vF: ["v_F", "Fluchtgeschwindigkeit in dieser Höhe", "km/s", 3, 1e3, (x) => Math.sqrt((2 * G * ME) / (RE + x.h))] },
    tex: { dv: "v_K = \\sqrt{\\frac{G M_E}{R_E + h}},\\; v_F = \\sqrt2\\,v_K \\;\\Rightarrow\\; \\Delta v = (\\sqrt2 - 1)\\,v_K", vF: "\\tfrac12 m v_F^2 = G\\,\\frac{M_E m}{R_E + h} \\;\\Rightarrow\\; v_F = \\sqrt{\\frac{2 G M_E}{R_E + h}}" },
    inv: { h: "h = \\frac{2 G M_E}{v_F^2} - R_E" }, invOut: "vF", cst: CGM });
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
  // electric field beyond the basic types: point charges, potential, screen deflection, energy density, discharge, Stokes
  const KC = 8.988e9, CK = "k = 1/(4πε₀) = 8,988 · 10⁹ N·m²/C²";
  spec("coulomb", { ctx: "Zwei kleine geladene Kugeln mit den Ladungen $q_1$ und $q_2$ haben den Mittelpunktsabstand $r$ (in Luft).",
    v: { q1: ["q_1", "Ladung 1", "nC", 1, 500, 0, 1e-9, "µC", 1e-6], q2: ["q_2", "Ladung 2", "nC", 1, 500, 0, 1e-9, "µC", 1e-6], r: ["r", "Abstand", "cm", 2, 50, 1, 0.01, "mm", 1e-3] },
    o: { F: ["F", "Coulombkraft", "mN", 3, 1e-3, (x) => (KC * x.q1 * x.q2) / (x.r * x.r)] },
    tex: { F: "F = \\frac{1}{4\\pi\\varepsilon_0}\\,\\frac{q_1 q_2}{r^2}" }, inv: { r: "r = \\sqrt{\\frac{q_1 q_2}{4\\pi\\varepsilon_0 F}}", q2: "q_2 = \\frac{4\\pi\\varepsilon_0 F r^2}{q_1}" }, cst: CK });
  spec("punktfeld", { ctx: "Eine Punktladung $Q$ erzeugt ein radiales elektrisches Feld. Betrachtet wird ein Punkt im Abstand $r$.",
    v: { Q: ["Q", "Ladung", "nC", 1, 100, 0, 1e-9, "pC", 1e-12], r: ["r", "Abstand", "cm", 1, 50, 1, 0.01, "mm", 1e-3] },
    o: { E: ["E", "Feldstärke", "kV/m", 3, 1e3, (x) => (KC * x.Q) / (x.r * x.r)], phi: ["\\varphi", "Potenzial (Nullpunkt im Unendlichen)", "V", 3, 1, (x) => (KC * x.Q) / x.r] },
    tex: { E: "E = \\frac{1}{4\\pi\\varepsilon_0}\\,\\frac{Q}{r^2}", phi: "\\varphi = \\frac{1}{4\\pi\\varepsilon_0}\\,\\frac{Q}{r}" }, inv: { r: "r = \\sqrt{\\frac{Q}{4\\pi\\varepsilon_0 E}}" }, invKeys: ["r"], invOut: "E", cst: CK });
  spec("schirmablenkung", { ctx: "In einer Braunschen Röhre fliegt ein mit $U_B$ beschleunigtes Elektron mittig durch einen Ablenkkondensator (Länge $l$, Plattenabstand $d$, Spannung $U_y$). Der Schirm steht im Abstand $s$ von der Mitte des Kondensators.",
    v: { UB: ["U_B", "Beschleunigungsspannung", "V", 500, 3000, 0, 1, "kV", 1e3], Uy: ["U_y", "Ablenkspannung", "V", 20, 150, 0], l: ["l", "Plattenlänge", "cm", 3, 6, 1, 0.01], d: ["d", "Plattenabstand", "cm", 1, 3, 1, 0.01], s: ["s", "Abstand Kondensatormitte bis Schirm", "cm", 15, 40, 0, 0.01, "m", 1] },
    o: { Y: ["Y", "Auslenkung auf dem Schirm", "cm", 3, 0.01, (x) => (x.s * x.Uy * x.l) / (2 * x.d * x.UB)] },
    tex: { Y: "\\tan\\alpha = \\frac{U_y\\,l}{2\\,d\\,U_B},\\; Y = s\\tan\\alpha = \\frac{s\\,U_y\\,l}{2\\,d\\,U_B}" }, inv: { Uy: "U_y = \\frac{2\\,d\\,U_B\\,Y}{s\\,l}" }, invKeys: ["Uy"],
    ok: (x) => (x.Uy * x.l * x.l) / (4 * x.d * x.UB) < x.d / 2 });
  spec("austrittswinkel", { ctx: "Ein mit $U_B$ beschleunigtes Elektron durchfliegt einen Ablenkkondensator (Länge $l$, Plattenabstand $d$, Spannung $U_y$).",
    v: { UB: ["U_B", "Beschleunigungsspannung", "V", 500, 3000, 0, 1, "kV", 1e3], Uy: ["U_y", "Ablenkspannung", "V", 20, 200, 0], l: ["l", "Plattenlänge", "cm", 3, 8, 1, 0.01, "mm", 1e-3], d: ["d", "Plattenabstand", "cm", 1, 4, 1, 0.01, "mm", 1e-3] },
    o: { al: ["\\alpha", "Austrittswinkel gegen die Einflugrichtung", "°", 3, DEG, (x) => Math.atan((x.Uy * x.l) / (2 * x.d * x.UB))] },
    tex: { al: "\\tan\\alpha = \\frac{v_y}{v_0} = \\frac{a\\,t}{v_0} = \\frac{U_y\\,l}{2\\,d\\,U_B}" }, noInv: true, ok: (x) => (x.Uy * x.l * x.l) / (4 * x.d * x.UB) < x.d / 2 });
  spec("energiedichte", { ctx: "In einem Plattenkondensator (Luft) herrscht ein homogenes Feld der Feldstärke $E$.",
    v: { E: ["E", "Feldstärke", "kV/m", 10, 3000, 0, 1e3, "V/cm", 100] },
    o: { w: ["w", "Energiedichte des Feldes", "J/m³", 3, 1, (x) => 0.5 * eps0 * x.E * x.E] },
    tex: { w: "w = \\frac{W}{V} = \\frac{\\tfrac12 C U^2}{A d} = \\tfrac12\\,\\varepsilon_0 E^2" }, inv: { E: "E = \\sqrt{\\frac{2w}{\\varepsilon_0}}" }, cst: "ε₀ = 8,854 · 10⁻¹² As/(Vm)" });
  spec("rc-entladung", { ctx: "Ein Kondensator der Kapazität $C$ ist auf $U_0$ geladen und entlädt sich über einen Widerstand $R$.",
    v: { C: ["C", "Kapazität", "µF", 1, 1000, 0, 1e-6, "mF", 1e-3], R: ["R", "Widerstand", "kΩ", 1, 100, 0, 1e3, "Ω", 1], U0: ["U_0", "Anfangsspannung", "V", 5, 50, 0] },
    o: { th: ["t_{1/2}", "Halbwertszeit der Spannung", "s", 3, 1, (x) => x.R * x.C * Math.LN2], tau: ["\\tau", "Zeitkonstante", "s", 3, 1, (x) => x.R * x.C] },
    tex: { th: "U(t) = U_0\\,e^{-t/(RC)},\\; \\tfrac12 = e^{-t_{1/2}/(RC)} \\;\\Rightarrow\\; t_{1/2} = RC\\ln 2", tau: "\\tau = R\\,C" }, inv: { C: "C = \\frac{\\tau}{R}", R: "R = \\frac{\\tau}{C}" }, invOut: "tau", noPow: ["U0"],
    ok: (x) => x.R * x.C > 0.005 && x.R * x.C < 200 });
  spec("millikan-stokes", { ctx: "Ein Öltröpfchen (Dichte 875 kg/m³) sinkt ohne Feld mit der konstanten Geschwindigkeit $v$ durch Luft (Viskosität 1,81 · 10⁻⁵ Pa·s). Mit eingeschaltetem Feld (Plattenabstand 6,0 mm) schwebt es bei der Spannung $U$.",
    v: { v: ["v", "Sinkgeschwindigkeit", "µm/s", 20, 200, 0, 1e-6, "mm/s", 1e-3], U: ["U", "Schwebespannung", "V", 100, 600, 0] },
    o: { q: ["q", "Ladung des Tröpfchens", "10⁻¹⁹ C", 3, 1e-19, (x) => { const r = Math.sqrt((9 * 1.81e-5 * x.v) / (2 * 875 * g)); return (4 / 3) * Math.PI * r * r * r * 875 * g * 6e-3 / x.U; }] },
    tex: { q: "6\\pi\\eta r v = \\tfrac43\\pi r^3\\rho g \\Rightarrow r = \\sqrt{\\frac{9\\eta v}{2\\rho g}},\\; q = \\frac{m g d}{U} = \\frac{\\tfrac43\\pi r^3\\rho\\,g\\,d}{U}" }, noInv: true, cst: CG,
    // measured data are consistent with the quantisation: q is close to a whole multiple of e
    ok: (x) => { const r = Math.sqrt((9 * 1.81e-5 * x.v) / (2 * 875 * g)); const n = ((4 / 3) * Math.PI * r * r * r * 875 * g * 6e-3 / x.U) / e; return n >= 0.95 && n < 12 && Math.abs(n - Math.round(n)) < 0.03 * Math.round(n) + 0.02; } });
  spec("plattenfeld", { ctx: "An einem Plattenkondensator mit dem Plattenabstand $d$ liegt die Spannung $U$.",
    v: { U: ["U", "Spannung", "V", 10, 5000, 0, 1, "kV", 1e3], d: ["d", "Plattenabstand", "mm", 1, 50, 0, 1e-3, "cm", 0.01] },
    o: { E: ["E", "Feldstärke", "kV/m", 3, 1e3, (x) => x.U / x.d] },
    tex: { E: "E = \\frac{U}{d}" }, inv: { d: "d = \\frac{U}{E}", U: "U = E\\,d" } });
  spec("hall", { ctx: "Ein Halbleiterplättchen der Dicke $d$ (gemessen in Feldrichtung) mit der Ladungsträgerdichte $n$ wird vom Strom $I$ durchflossen und steht senkrecht in einem Magnetfeld $B$.",
    v: { B: ["B", "Flussdichte", "mT", 50, 800, 0, 1e-3, "T", 1], I: ["I", "Stromstärke", "mA", 5, 50, 0, 1e-3, "A", 1], n: ["n", "Ladungsträgerdichte", "10²¹ m⁻³", 1, 20, 0, 1e21], d: ["d", "Dicke", "mm", 0.5, 2, 1, 1e-3, "µm", 1e-6] },
    o: { U: ["U_H", "Hallspannung", "mV", 3, 1e-3, (x) => (x.B * x.I) / (x.n * e * x.d)] },
    tex: { U: "U_H = \\frac{B\\,I}{n\\,e\\,d}" }, inv: { n: "n = \\frac{B\\,I}{e\\,d\\,U_H}", B: "B = \\frac{n\\,e\\,d\\,U_H}{I}" }, cst: CE });
  // induction beyond the basic types
  spec("generator", { ctx: "Eine Spule mit $N$ Windungen und der Fläche $A$ dreht sich mit der Drehzahl $n$ gleichmäßig in einem homogenen Magnetfeld $B$.",
    v: { N: ["N", "Windungszahl", "", 50, 1000, 0], A: ["A", "Spulenfläche", "cm²", 20, 400, 0, 1e-4], B: ["B", "Flussdichte", "mT", 20, 500, 0, 1e-3, "T", 1], n: ["n", "Drehzahl", "1/min", 300, 3000, 0, 1 / 60] },
    o: { U: ["\\hat U", "Scheitelwert der Induktionsspannung", "V", 3, 1, (x) => x.N * x.B * x.A * 2 * Math.PI * x.n] },
    tex: { U: "\\Phi = B A\\cos(\\omega t),\\; U = -N\\dot\\Phi = N B A\\,\\omega\\sin(\\omega t),\\; \\hat U = N B A\\cdot 2\\pi f" }, inv: { B: "B = \\frac{\\hat U}{N A\\,\\omega}", N: "N = \\frac{\\hat U}{B A\\,\\omega}" } });
  spec("spulenenergie", { ctx: "Durch eine Spule mit der Induktivität $L$ fließt der Strom $I$.",
    v: { L: ["L", "Induktivität", "mH", 1, 1000, 0, 1e-3, "H", 1], I: ["I", "Stromstärke", "A", 0.1, 5, 1, 1, "mA", 1e-3] },
    o: { E: ["E_{mag}", "im Magnetfeld gespeicherte Energie", "mJ", 3, 1e-3, (x) => 0.5 * x.L * x.I * x.I] },
    tex: { E: "E_{mag} = \\tfrac12 L I^2" }, inv: { I: "I = \\sqrt{\\frac{2E_{mag}}{L}}", L: "L = \\frac{2E_{mag}}{I^2}" } });
  spec("einschalten", { ctx: "Eine Spule (Induktivität $L$) liegt in Reihe mit dem Widerstand $R$ an der Gleichspannung $U_0$ und wird eingeschaltet.",
    v: { L: ["L", "Induktivität", "mH", 10, 2000, 0, 1e-3, "H", 1], R: ["R", "Widerstand", "Ω", 5, 500, 0], U0: ["U_0", "Spannung", "V", 2, 24, 0] },
    o: { tau: ["\\tau", "Zeitkonstante", "ms", 3, 1e-3, (x) => x.L / x.R], I: ["I_{end}", "Stromstärke nach langer Zeit", "mA", 3, 1e-3, (x) => x.U0 / x.R] },
    tex: { tau: "U_0 = R I + L\\dot I \\;\\Rightarrow\\; I(t) = \\frac{U_0}{R}\\left(1 - e^{-t/\\tau}\\right),\\; \\tau = \\frac{L}{R}", I: "I_{end} = \\frac{U_0}{R}" }, inv: { L: "L = \\tau\\,R" }, invKeys: ["L"], invOut: "tau",
    ok: (x) => x.L / x.R > 1e-4 && x.L / x.R < 1 });
  spec("fernleitung", { ctx: "Ein Kraftwerk überträgt die Leistung $P$ bei der Spannung $U$ über eine Leitung mit dem Widerstand $R$.",
    v: { P: ["P", "übertragene Leistung", "MW", 1, 500, 0, 1e6, "kW", 1e3], R: ["R", "Leitungswiderstand", "Ω", 1, 20, 1], U: ["U", "Übertragungsspannung", "kV", 10, 400, 0, 1e3, "V", 1] },
    o: { PV: ["P_V", "Leistungsverlust in der Leitung", "kW", 3, 1e3, (x) => Math.pow(x.P / x.U, 2) * x.R] },
    tex: { PV: "I = \\frac{P}{U},\\; P_V = I^2 R = \\frac{P^2 R}{U^2}" }, inv: { U: "U = P\\sqrt{\\frac{R}{P_V}}" }, invKeys: ["U"],
    ok: (x) => Math.pow(x.P / x.U, 2) * x.R < 0.3 * x.P });
  spec("leiterschleife", { ctx: "Eine rechteckige Leiterschleife (Breite $b$, $N$ Windungen) wird mit der konstanten Geschwindigkeit $v$ senkrecht zu den Feldlinien aus einem homogenen Magnetfeld $B$ herausgezogen.",
    v: { b: ["b", "Breite der Schleife", "cm", 2, 30, 0, 0.01, "mm", 1e-3], N: ["N", "Windungszahl", "", 1, 200, 0], v: ["v", "Geschwindigkeit", "cm/s", 1, 100, 0, 0.01, "m/s", 1], B: ["B", "Flussdichte", "mT", 10, 800, 0, 1e-3, "T", 1] },
    o: { U: ["U_{ind}", "Induktionsspannung", "mV", 3, 1e-3, (x) => x.N * x.B * x.b * x.v] },
    tex: { U: "U_{ind} = N\\,\\frac{\\Delta\\Phi}{\\Delta t} = N B\\,\\frac{\\Delta A}{\\Delta t} = N B\\,b\\,v" }, inv: { v: "v = \\frac{U_{ind}}{N B b}", B: "B = \\frac{U_{ind}}{N b v}" } });
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
  // magnetic field beyond the basic types
  spec("spule", { ctx: "Eine lange, luftgefüllte Spule hat $N$ Windungen auf der Länge $l$ und wird vom Strom $I$ durchflossen.",
    v: { N: ["N", "Windungszahl", "", 100, 3000, 0], l: ["l", "Spulenlänge", "cm", 10, 60, 0, 0.01, "m", 1], I: ["I", "Stromstärke", "A", 0.2, 5, 1, 1, "mA", 1e-3] },
    o: { B: ["B", "Flussdichte im Inneren", "mT", 3, 1e-3, (x) => (mu0 * x.N * x.I) / x.l] },
    tex: { B: "B = \\mu_0\\,\\frac{N\\,I}{l}" }, inv: { I: "I = \\frac{B\\,l}{\\mu_0 N}", N: "N = \\frac{B\\,l}{\\mu_0 I}" }, cst: "μ₀ = 4π · 10⁻⁷ Vs/(Am)" });
  spec("leiterkraft", { ctx: "Ein gerader Leiter der Länge $l$ liegt senkrecht zu den Feldlinien in einem homogenen Magnetfeld $B$ und wird vom Strom $I$ durchflossen.",
    v: { l: ["l", "Leiterlänge im Feld", "cm", 2, 30, 0, 0.01, "mm", 1e-3], I: ["I", "Stromstärke", "A", 0.5, 10, 1, 1, "mA", 1e-3], B: ["B", "Flussdichte", "mT", 10, 500, 0, 1e-3, "T", 1] },
    o: { F: ["F", "Kraft auf den Leiter", "mN", 3, 1e-3, (x) => x.I * x.l * x.B] },
    tex: { F: "F = I\\,l\\,B" }, inv: { B: "B = \\frac{F}{I\\,l}", I: "I = \\frac{F}{l\\,B}" } });
  spec("zyklotron", { ctx: "In einem Zyklotron (Flussdichte $B$, Radius der Dosen $R$) werden Protonen beschleunigt.",
    v: { B: ["B", "Flussdichte", "T", 0.5, 2, 2], R: ["R", "Dosenradius", "cm", 20, 100, 0, 0.01, "m", 1] },
    o: { f: ["f", "Frequenz der Wechselspannung", "MHz", 3, 1e6, (x) => (e * x.B) / (2 * Math.PI * mp)], E: ["E_{max}", "Endenergie", "MeV", 3, 1e6 * e, (x) => Math.pow(e * x.B * x.R, 2) / (2 * mp)] },
    tex: { f: "T = \\frac{2\\pi m}{e B} \\;\\Rightarrow\\; f = \\frac{e B}{2\\pi m}", E: "r = \\frac{m v}{e B} \\le R \\;\\Rightarrow\\; E_{max} = \\frac{(e B R)^2}{2m}" }, inv: { B: "B = \\frac{2\\pi m f}{e}" }, invKeys: ["B"], invOut: "f",
    cst: "e = 1,602 · 10⁻¹⁹ C, mₚ = 1,673 · 10⁻²⁷ kg, 1 MeV = 1,602 · 10⁻¹³ J" });
  spec("helmholtz", { ctx: "Ein Helmholtz-Spulenpaar hat den Spulenradius $R$ und je $N$ Windungen; beide werden vom Strom $I$ durchflossen.",
    v: { R: ["R", "Spulenradius", "cm", 10, 30, 0, 0.01, "m", 1], N: ["N", "Windungen je Spule", "", 50, 300, 0], I: ["I", "Spulenstrom", "A", 0.5, 3, 2, 1, "mA", 1e-3] },
    o: { B: ["B", "Flussdichte in der Mitte", "mT", 3, 1e-3, (x) => Math.pow(0.8, 1.5) * mu0 * x.N * x.I / x.R] },
    tex: { B: "B = \\left(\\tfrac45\\right)^{3/2}\\mu_0\\,\\frac{N\\,I}{R}" }, inv: { I: "I = \\frac{B\\,R}{(4/5)^{3/2}\\,\\mu_0 N}" }, invKeys: ["I"], cst: "μ₀ = 4π · 10⁻⁷ Vs/(Am)" });
  spec("schraube", { ctx: "Ein Elektron fliegt mit der Geschwindigkeit $v$ unter dem Winkel $\\alpha$ zu den Feldlinien in ein homogenes Magnetfeld $B$ und läuft auf einer Schraubenbahn.",
    v: { v: ["v", "Geschwindigkeit", "10⁶ m/s", 1, 20, 1, 1e6], al: ["\\alpha", "Winkel zu den Feldlinien", "°", 15, 75, 0, DEG], B: ["B", "Flussdichte", "mT", 1, 20, 1, 1e-3] },
    o: { r: ["r", "Radius der Schraube", "mm", 3, 1e-3, (x) => (me * x.v * Math.sin(x.al)) / (e * x.B)], h: ["h", "Ganghöhe", "cm", 3, 0.01, (x) => (x.v * Math.cos(x.al) * 2 * Math.PI * me) / (e * x.B)] },
    tex: { r: "r = \\frac{m\\,v\\sin\\alpha}{e B}", h: "h = v\\cos\\alpha\\cdot T = v\\cos\\alpha\\cdot\\frac{2\\pi m}{e B}" }, noInv: true, cst: CE + ", " + CME });
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
  // optics beyond the basic types
  spec("doppelspalt", { ctx: "Licht der Wellenlänge $\\lambda$ fällt auf einen Doppelspalt mit dem Spaltabstand $d$; der Schirm steht im Abstand $L$.",
    v: { la: ["\\lambda", "Wellenlänge", "nm", 400, 700, 0, 1e-9], d: ["d", "Spaltabstand", "mm", 0.1, 1, 2, 1e-3, "µm", 1e-6], L: ["L", "Schirmabstand", "m", 1, 5, 1, 1, "cm", 0.01] },
    o: { x: ["x_1", "Abstand des ersten Maximums von der Mitte", "mm", 3, 1e-3, (x) => x.L * Math.tan(Math.asin(x.la / x.d))] },
    tex: { x: "d\\sin\\alpha_1 = \\lambda,\\; x_1 = L\\tan\\alpha_1 \\approx \\frac{\\lambda L}{d}" }, inv: { la: "\\lambda = d\\sin\\left(\\arctan\\frac{x_1}{L}\\right) \\approx \\frac{x_1 d}{L}" }, invKeys: ["la"] });
  spec("einzelspalt", { ctx: "Licht der Wellenlänge $\\lambda$ fällt auf einen Einzelspalt der Breite $b$; der Schirm steht im Abstand $L$.",
    v: { la: ["\\lambda", "Wellenlänge", "nm", 400, 700, 0, 1e-9], b: ["b", "Spaltbreite", "µm", 20, 300, 0, 1e-6, "mm", 1e-3], L: ["L", "Schirmabstand", "m", 1, 4, 1] },
    o: { w: ["w", "Breite des zentralen Maximums (zwischen den ersten Minima)", "cm", 3, 0.01, (x) => 2 * x.L * Math.tan(Math.asin(x.la / x.b))] },
    tex: { w: "b\\sin\\alpha_1 = \\lambda,\\; w = 2L\\tan\\alpha_1 \\approx \\frac{2\\lambda L}{b}" }, inv: { b: "b = \\frac{\\lambda}{\\sin\\left(\\arctan\\frac{w}{2L}\\right)} \\approx \\frac{2\\lambda L}{w}" }, invKeys: ["b"] });
  spec("entspiegelung", { ctx: "Eine Glasoberfläche soll für Licht der Wellenlänge $\\lambda$ (in Luft) mit einer dünnen Schicht der Brechzahl $n$ entspiegelt werden (senkrechter Einfall, kleinste Dicke; die Schicht ist optisch dünner als das Glas).",
    v: { la: ["\\lambda", "Wellenlänge", "nm", 400, 700, 0, 1e-9], n: ["n", "Brechzahl der Schicht", "", 1.25, 1.45, 2] },
    o: { d: ["d", "Schichtdicke", "nm", 3, 1e-9, (x) => x.la / (4 * x.n)] },
    tex: { d: "2 n d = \\frac{\\lambda}{2} \\;\\Rightarrow\\; d = \\frac{\\lambda}{4n}" }, inv: { la: "\\lambda = 4 n d" }, invKeys: ["la"] });
  spec("michelson", { ctx: "In einem Michelson-Interferometer mit Laserlicht der Wellenlänge $\\lambda$ wird ein Spiegel um $\\Delta d$ verschoben.",
    v: { la: ["\\lambda", "Wellenlänge", "nm", 400, 700, 0, 1e-9], dd: ["\\Delta d", "Spiegelverschiebung", "µm", 10, 500, 0, 1e-6, "mm", 1e-3] },
    o: { N: ["N", "Zahl der vorbeiwandernden Streifen", "", 3, 1, (x) => (2 * x.dd) / x.la] },
    tex: { N: "2\\,\\Delta d = N\\,\\lambda \\;\\Rightarrow\\; N = \\frac{2\\,\\Delta d}{\\lambda}" }, inv: { la: "\\lambda = \\frac{2\\,\\Delta d}{N}", dd: "\\Delta d = \\frac{N\\lambda}{2}" } });
  spec("malus", { ctx: "Unpolarisiertes Licht der Intensität $I_0$ fällt auf zwei Polarisationsfilter, deren Durchlassrichtungen den Winkel $\\theta$ einschließen.",
    v: { I0: ["I_0", "Intensität des einfallenden Lichts", "W/m²", 10, 1000, 0], th: ["\\theta", "Winkel zwischen den Filtern", "°", 10, 80, 0, DEG] },
    o: { I: ["I", "Intensität hinter dem zweiten Filter", "W/m²", 3, 1, (x) => 0.5 * x.I0 * Math.pow(Math.cos(x.th), 2)] },
    tex: { I: "I_1 = \\tfrac12 I_0,\\; I = I_1\\cos^2\\theta = \\tfrac12 I_0\\cos^2\\theta" }, inv: { I0: "I_0 = \\frac{2I}{\\cos^2\\theta}" }, invKeys: ["I0"] });
  spec("lichtleiter", { ctx: "Ein Lichtleiter hat einen Kern mit der Brechzahl $n_1$ und einen Mantel mit der Brechzahl $n_2 < n_1$; Licht tritt aus Luft in die Stirnfläche ein.",
    v: { n1: ["n_1", "Brechzahl des Kerns", "", 1.45, 1.65, 3], n2: ["n_2", "Brechzahl des Mantels", "", 1.38, 1.6, 3] },
    o: { th: ["\\theta_{max}", "größter Eintrittswinkel, bei dem das Licht im Kern bleibt", "°", 3, DEG, (x) => Math.asin(Math.min(1, Math.sqrt(x.n1 * x.n1 - x.n2 * x.n2)))], g: ["\\alpha_g", "Grenzwinkel der Totalreflexion an der Mantelgrenze", "°", 3, DEG, (x) => Math.asin(x.n2 / x.n1)] },
    tex: { th: "\\sin\\theta_{max} = n_1\\cos\\alpha_g = \\sqrt{n_1^2 - n_2^2}", g: "\\sin\\alpha_g = \\frac{n_2}{n_1}" }, noInv: true,
    ok: (x) => x.n2 < x.n1 - 0.01 && x.n1 * x.n1 - x.n2 * x.n2 < 0.95 });
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
  // waves beyond the basic types
  spec("doppler-beobachter", { ctx: "Ein Radfahrer fährt mit $v$ auf eine ruhende Schallquelle der Frequenz $f$ zu. Schall breitet sich mit 343 m/s aus.",
    v: { f: ["f", "Frequenz der Quelle", "Hz", 300, 2000, 0, 1, "kHz", 1e3], v: ["v", "Geschwindigkeit des Beobachters", "km/h", 10, 120, 0, 1 / 3.6, "m/s", 1] },
    o: { fb: ["f_B", "gehörte Frequenz", "Hz", 4, 1, (x) => x.f * (1 + x.v / 343)] },
    tex: { fb: "f_B = f\\left(1 + \\frac{v}{c}\\right)" }, inv: { v: "v = c\\left(\\frac{f_B}{f} - 1\\right)" }, invKeys: ["v"] });
  spec("pfeife", { ctx: "Eine an einem Ende geschlossene Orgelpfeife (gedackte Pfeife) hat die Länge $L$. Schall breitet sich mit 343 m/s aus.",
    v: { L: ["L", "Länge der Pfeife", "cm", 10, 300, 0, 0.01, "m", 1] },
    o: { f1: ["f_1", "Grundfrequenz", "Hz", 3, 1, (x) => 343 / (4 * x.L)], f3: ["f_3", "Frequenz des ersten Obertons", "Hz", 3, 1, (x) => (3 * 343) / (4 * x.L)] },
    tex: { f1: "L = \\frac{\\lambda}{4} \\;\\Rightarrow\\; f_1 = \\frac{c}{4L}", f3: "L = \\frac{3\\lambda}{4} \\;\\Rightarrow\\; f_3 = \\frac{3c}{4L}" }, inv: { L: "L = \\frac{c}{4 f_1}" }, invOut: "f1" });
  spec("saite", { ctx: "Eine Saite der Länge $L$ ist mit der Kraft $F$ gespannt; ein Meter der Saite hat die Masse $\\mu$ (Massenbelag).",
    v: { L: ["L", "Saitenlänge", "cm", 30, 120, 0, 0.01, "m", 1], F: ["F", "Spannkraft", "N", 20, 400, 0], mu: ["\\mu", "Massenbelag", "g/m", 0.5, 20, 1, 1e-3, "kg/m", 1] },
    o: { f: ["f_1", "Grundfrequenz", "Hz", 3, 1, (x) => Math.sqrt(x.F / x.mu) / (2 * x.L)], c: ["c", "Wellengeschwindigkeit auf der Saite", "m/s", 3, 1, (x) => Math.sqrt(x.F / x.mu)] },
    tex: { f: "c = \\sqrt{\\frac{F}{\\mu}},\\; f_1 = \\frac{c}{2L}", c: "c = \\sqrt{\\frac{F}{\\mu}}" }, inv: { F: "F = \\mu\\,(2 L f_1)^2" }, invKeys: ["F"], invOut: "f" });
  spec("doppler", { ctx: "Ein Krankenwagen mit der Sirenenfrequenz $f$ fährt mit $v$ auf einen ruhenden Beobachter zu. Schall breitet sich mit 343 m/s aus.",
    v: { f: ["f", "Sirenenfrequenz", "Hz", 400, 1200, 0, 1, "kHz", 1e3], v: ["v", "Geschwindigkeit", "km/h", 30, 150, 0, 1 / 3.6, "m/s", 1] },
    o: { fb: ["f_B", "gehörte Frequenz", "Hz", 4, 1, (x) => (x.f * 343) / (343 - x.v)] },
    tex: { fb: "f_B = \\frac{f}{1 - \\frac{v}{c}}" }, inv: { v: "v = c\\left(1 - \\frac{f}{f_B}\\right)" }, invKeys: ["v"] });
  // oscillations beyond the basic types
  spec("schwingung-v", { ctx: "Ein Körper schwingt harmonisch mit der Amplitude $\\hat y$ und der Periodendauer $T$.",
    v: { y: ["\\hat y", "Amplitude", "cm", 1, 30, 1, 0.01, "mm", 1e-3], T: ["T", "Periodendauer", "s", 0.2, 5, 2, 1, "ms", 1e-3] },
    o: { v: ["\\hat v", "größte Geschwindigkeit", "m/s", 3, 1, (x) => (x.y * 2 * Math.PI) / x.T], a: ["\\hat a", "größte Beschleunigung", "m/s²", 3, 1, (x) => x.y * Math.pow((2 * Math.PI) / x.T, 2)] },
    tex: { v: "y = \\hat y\\sin(\\omega t),\\; v = \\dot y = \\hat y\\,\\omega\\cos(\\omega t) \\;\\Rightarrow\\; \\hat v = \\hat y\\,\\omega = \\frac{2\\pi\\hat y}{T}", a: "a = \\ddot y = -\\hat y\\,\\omega^2\\sin(\\omega t) \\;\\Rightarrow\\; \\hat a = \\hat y\\,\\omega^2" },
    inv: { y: "\\hat y = \\frac{\\hat v\\,T}{2\\pi}" }, invKeys: ["y"], invOut: "v" });
  spec("federn", { ctx: "Ein Körper der Masse $m$ hängt an zwei Federn mit den Federkonstanten $D_1$ und $D_2$, die nebeneinander (parallel) befestigt sind.",
    v: { m: ["m", "Masse", "g", 50, 2000, 0, 1e-3, "kg", 1], D1: ["D_1", "Federkonstante 1", "N/m", 5, 200, 0], D2: ["D_2", "Federkonstante 2", "N/m", 5, 200, 0] },
    o: { T: ["T", "Periodendauer", "s", 3, 1, (x) => 2 * Math.PI * Math.sqrt(x.m / (x.D1 + x.D2))] },
    tex: { T: "D = D_1 + D_2 \\text{ (parallel)},\\; T = 2\\pi\\sqrt{\\frac{m}{D_1 + D_2}}" }, inv: { m: "m = (D_1 + D_2)\\left(\\frac{T}{2\\pi}\\right)^2" }, invKeys: ["m"] });
  spec("schwingkreis-strom", { ctx: "Ein Kondensator der Kapazität $C$ wird auf $U_0$ aufgeladen und dann über eine Spule der Induktivität $L$ entladen (ungedämpfter Schwingkreis).",
    v: { C: ["C", "Kapazität", "µF", 0.5, 100, 1, 1e-6, "nF", 1e-9], L: ["L", "Induktivität", "mH", 5, 2000, 0, 1e-3, "H", 1], U0: ["U_0", "Ladespannung", "V", 5, 100, 0] },
    o: { I: ["\\hat I", "größte Stromstärke", "mA", 3, 1e-3, (x) => x.U0 * Math.sqrt(x.C / x.L)] },
    tex: { I: "\\tfrac12 C U_0^2 = \\tfrac12 L\\hat I^2 \\;\\Rightarrow\\; \\hat I = U_0\\sqrt{\\frac{C}{L}}" }, inv: { U0: "U_0 = \\hat I\\sqrt{\\frac{L}{C}}" }, invKeys: ["U0"] });
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
  // quantum objects beyond the basic types
  const LC = h / (me * c), mn = 1.675e-27, SOL = 1361;
  spec("photon", { ctx: "Ein Photon hat die Wellenlänge $\\lambda$.",
    v: { lam: ["\\lambda", "Wellenlänge", "nm", 200, 800, 0, 1e-9, "µm", 1e-6] },
    o: { E: ["E", "Energie", "eV", 3, e, (x) => (h * c) / x.lam], m: ["m", "dynamische Masse", "10⁻³⁶ kg", 3, 1e-36, (x) => h / (c * x.lam)], p: ["p", "Impuls", "10⁻²⁷ kg·m/s", 3, 1e-27, (x) => h / x.lam] },
    tex: { E: "E = h f = \\frac{h c}{\\lambda}", m: "m = \\frac{E}{c^2} = \\frac{h}{c\\,\\lambda}", p: "p = \\frac{E}{c} = \\frac{h}{\\lambda}" },
    inv: { lam: "\\lambda = \\frac{h c}{E}" }, invOut: "E", cst: CH + ", " + CC + ", " + CE });
  spec("compton", { ctx: "Röntgenstrahlung der Wellenlänge $\\lambda$ wird an quasi-freien Elektronen gestreut und unter dem Streuwinkel $\\varphi$ beobachtet.",
    v: { lam: ["\\lambda", "Wellenlänge vor der Streuung", "pm", 20, 100, 1, 1e-12, "nm", 1e-9], phi: ["\\varphi", "Streuwinkel", "°", 30, 150, 0, DEG] },
    o: { dl: ["\\Delta\\lambda", "Zunahme der Wellenlänge", "pm", 3, 1e-12, (x) => LC * (1 - Math.cos(x.phi))], l2: ["\\lambda'", "Wellenlänge nach der Streuung", "pm", 3, 1e-12, (x) => x.lam + LC * (1 - Math.cos(x.phi))] },
    tex: { dl: "\\Delta\\lambda = \\frac{h}{m_e c}\\,(1 - \\cos\\varphi)", l2: "\\lambda' = \\lambda + \\frac{h}{m_e c}\\,(1 - \\cos\\varphi)" },
    inv: { phi: "\\cos\\varphi = 1 - \\frac{m_e c}{h}\\,\\Delta\\lambda" }, invKeys: ["phi"], invOut: "dl", noPow: true, cst: "h/(mₑc) = 2,43 pm" });
  spec("sonnensegel", { ctx: "Ein Sonnensegel der Fläche $A$ steht in Erdnähe senkrecht zum Sonnenlicht (Bestrahlungsstärke $S = 1361\\,\\mathrm{W/m^2}$) und reflektiert es vollständig. Die Sonde hat samt Segel die Masse $m$.",
    v: { A: ["A", "Segelfläche", "m²", 100, 5000, 0], m: ["m", "Masse der Sonde", "kg", 20, 500, 0, 1, "t", 1e3] },
    o: { F: ["F", "Kraft des Lichts", "mN", 3, 1e-3, (x) => (2 * SOL * x.A) / c], a: ["a", "Beschleunigung", "µm/s²", 3, 1e-6, (x) => (2 * SOL * x.A) / (c * x.m)] },
    tex: { F: "F = \\frac{2 S A}{c}", a: "a = \\frac{F}{m} = \\frac{2 S A}{c\\,m}" }, inv: { A: "A = \\frac{F\\,c}{2 S}" }, invKeys: ["A"], invOut: "F", cst: CC });
  spec("led", { ctx: "Eine Leuchtdiode sendet Licht der Wellenlänge $\\lambda$ aus. Sie beginnt zu leuchten, sobald ein Elektron beim Durchlaufen der Spannung $U$ die Energie eines Photons gewinnt.",
    v: { lam: ["\\lambda", "Wellenlänge", "nm", 450, 950, 0, 1e-9, "µm", 1e-6] },
    o: { U: ["U", "Schwellenspannung", "V", 3, 1, (x) => (h * c) / (e * x.lam)] },
    tex: { U: "e U = h f = \\frac{h c}{\\lambda} \\;\\Rightarrow\\; U = \\frac{h c}{e\\,\\lambda}" }, inv: { lam: "\\lambda = \\frac{h c}{e U}" }, cst: CH + ", " + CC + ", " + CE });
  spec("gegenfeld-zwei", { ctx: "Bei der Gegenfeldmethode misst man an einer Kathode mit Licht der Wellenlänge $\\lambda_1$ die Gegenspannung $U_1$. Dann wird dieselbe Kathode mit Licht der Wellenlänge $\\lambda_2$ bestrahlt.",
    v: { l1: ["\\lambda_1", "erste Wellenlänge", "nm", 300, 450, 0, 1e-9], U1: ["U_1", "erste Gegenspannung", "V", 0.3, 1.8, 2], l2: ["\\lambda_2", "zweite Wellenlänge", "nm", 250, 450, 0, 1e-9] },
    o: { U2: ["U_2", "Gegenspannung bei der zweiten Wellenlänge", "V", 3, 1, (x) => x.U1 + ((h * c) / e) * (1 / x.l2 - 1 / x.l1)] },
    tex: { U2: "e U_2 - e U_1 = h c\\left(\\frac{1}{\\lambda_2} - \\frac{1}{\\lambda_1}\\right) \\;\\Rightarrow\\; U_2 = U_1 + \\frac{h c}{e}\\left(\\frac{1}{\\lambda_2} - \\frac{1}{\\lambda_1}\\right)" },
    inv: { U1: "U_1 = U_2 - \\frac{h c}{e}\\left(\\frac{1}{\\lambda_2} - \\frac{1}{\\lambda_1}\\right)" }, invKeys: ["U1"], noPow: true,
    ok: (x) => { const W = (h * c) / (e * x.l1) - x.U1, U2 = x.U1 + ((h * c) / e) * (1 / x.l2 - 1 / x.l1); return W > 1.9 && W < 2.6 && U2 > 0.2 && Math.abs(x.l1 - x.l2) > 30e-9; },
    cst: CH + ", " + CC + ", " + CE });
  spec("photonenstrom", { ctx: "Licht der Wellenlänge $\\lambda$ trifft mit der Bestrahlungsstärke $S$ senkrecht auf eine Fläche $A$.",
    v: { lam: ["\\lambda", "Wellenlänge", "nm", 250, 700, 0, 1e-9], S: ["S", "Bestrahlungsstärke", "W/m²", 0.5, 20, 1, 1, "mW/cm²", 10], A: ["A", "Fläche", "cm²", 0.5, 10, 1, 1e-4, "mm²", 1e-6] },
    o: { N: ["N", "Zahl der Photonen pro Sekunde", "10¹⁴ /s", 3, 1e14, (x) => (x.S * x.A * x.lam) / (h * c)] },
    tex: { N: "N = \\frac{P}{E_{Ph}} = \\frac{S\\,A\\,\\lambda}{h c}" }, inv: { S: "S = \\frac{N\\,h c}{A\\,\\lambda}", A: "A = \\frac{N\\,h c}{S\\,\\lambda}" }, invKeys: ["S", "A"], cst: CH + ", " + CC });
  spec("debroglie-proton", { ctx: "Protonen werden aus der Ruhe mit der Spannung $U$ beschleunigt (nichtrelativistisch).",
    v: { U: ["U", "Beschleunigungsspannung", "V", 100, 20000, 0, 1, "kV", 1e3] },
    o: { la: ["\\lambda", "De-Broglie-Wellenlänge", "pm", 3, 1e-12, (x) => h / Math.sqrt(2 * mp * e * x.U)] },
    tex: { la: "\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2 m_p e U}}" }, inv: { U: "U = \\frac{h^2}{2 m_p e \\lambda^2}" }, cst: CH + ", " + CE + ", mₚ = 1,673 · 10⁻²⁷ kg" });
  spec("debroglie-neutron", { ctx: "Ein Neutron aus einem Forschungsreaktor fliegt mit der Geschwindigkeit $v$.",
    v: { v: ["v", "Geschwindigkeit", "m/s", 300, 5000, 0, 1, "km/s", 1e3] },
    o: { la: ["\\lambda", "De-Broglie-Wellenlänge", "pm", 3, 1e-12, (x) => h / (mn * x.v)], E: ["E_{kin}", "Bewegungsenergie", "meV", 3, 1e-3 * e, (x) => 0.5 * mn * x.v * x.v] },
    tex: { la: "\\lambda = \\frac{h}{m_n v}", E: "E_{kin} = \\tfrac12 m_n v^2" }, inv: { v: "v = \\frac{h}{m_n \\lambda}" }, invOut: "la", cst: CH + ", mₙ = 1,675 · 10⁻²⁷ kg, 1 eV = 1,602 · 10⁻¹⁹ J" });
  spec("elektronen-doppelspalt", { ctx: "Elektronen werden aus der Ruhe mit der Spannung $U$ beschleunigt und fallen auf einen Doppelspalt mit dem Spaltabstand $d$. Der Schirm steht im Abstand $L$ (kleine Winkel).",
    v: { U: ["U", "Beschleunigungsspannung", "V", 50, 1000, 0, 1, "kV", 1e3], d: ["d", "Spaltabstand", "nm", 200, 2000, 0, 1e-9, "µm", 1e-6], L: ["L", "Abstand zum Schirm", "m", 0.3, 2, 2, 1, "cm", 0.01] },
    o: { a: ["a", "Abstand benachbarter Maxima", "µm", 3, 1e-6, (x) => ((h / Math.sqrt(2 * me * e * x.U)) * x.L) / x.d] },
    tex: { a: "a = \\frac{\\lambda L}{d}, \\quad \\lambda = \\frac{h}{\\sqrt{2 m_e e U}}" }, inv: { d: "d = \\frac{\\lambda L}{a}", L: "L = \\frac{a\\,d}{\\lambda}" }, invKeys: ["d", "L"], cst: CH + ", " + CE + ", " + CME });
  spec("beugungsring", { ctx: "In einer Elektronenbeugungsröhre werden Elektronen mit der Spannung $U$ beschleunigt und an einer Graphitfolie gebeugt. Der Leuchtschirm ist $L$ von der Folie entfernt; betrachtet wird der Ring zum Netzebenenabstand $d$ (erste Ordnung, kleine Winkel).",
    v: { U: ["U", "Beschleunigungsspannung", "kV", 2.5, 7, 1, 1e3, "V", 1], L: ["L", "Abstand Folie bis Schirm", "cm", 10, 16, 1, 0.01, "m", 1], d: ["d", "Netzebenenabstand", "pm", 120, 250, 0, 1e-12, "nm", 1e-9] },
    o: { r: ["r", "Ringradius", "mm", 3, 1e-3, (x) => (x.L * h) / (Math.sqrt(2 * me * e * x.U) * x.d)] },
    tex: { r: "r \\approx \\frac{L\\,\\lambda}{d}, \\quad \\lambda = \\frac{h}{\\sqrt{2 m_e e U}}" }, inv: { d: "d \\approx \\frac{L\\,\\lambda}{r}" }, invKeys: ["d"], cst: CH + ", " + CE + ", " + CME });
  spec("unschaerfe", { ctx: "Ein Elektron ist auf einen Bereich der Breite $\\Delta x$ eingeschränkt, etwa durch einen Spalt oder ein Atom.",
    v: { dx: ["\\Delta x", "Ortsunschärfe", "pm", 50, 5000, 0, 1e-12, "nm", 1e-9] },
    o: { dv: ["\\Delta v", "kleinstmögliche Geschwindigkeitsunschärfe", "km/s", 3, 1e3, (x) => h / (4 * Math.PI * me * x.dx)], dp: ["\\Delta p", "kleinstmögliche Impulsunschärfe", "10⁻²⁶ kg·m/s", 3, 1e-26, (x) => h / (4 * Math.PI * x.dx)] },
    tex: { dv: "\\Delta x\\,\\Delta p \\ge \\frac{h}{4\\pi} \\;\\Rightarrow\\; \\Delta v \\ge \\frac{h}{4\\pi\\,m_e\\,\\Delta x}", dp: "\\Delta p \\ge \\frac{h}{4\\pi\\,\\Delta x}" },
    inv: { dx: "\\Delta x \\ge \\frac{h}{4\\pi\\,m_e\\,\\Delta v}" }, invOut: "dv", cst: CH + ", " + CME });
  // atomic shell and X-rays beyond the basic types
  spec("moseley", { ctx: "Für die $K_\\alpha$-Linie eines Elements mit der Kernladungszahl $Z$ gilt nach Moseley näherungsweise $E \\approx 13{,}6\\,\\mathrm{eV}\\cdot (Z - 1)^2\\cdot\\left(1 - \\tfrac14\\right)$: Ein Elektron springt von $n = 2$ nach $n = 1$, das verbliebene K-Elektron schirmt eine Kernladung ab.",
    v: { Z: ["Z", "Kernladungszahl", "", 20, 50, 0] },
    o: { E: ["E", "Energie der Kα-Linie", "keV", 3, 1e3 * e, (x) => 10.2 * e * (x.Z - 1) * (x.Z - 1)], la: ["\\lambda", "Wellenlänge der Kα-Linie", "pm", 3, 1e-12, (x) => (h * c) / (10.2 * e * (x.Z - 1) * (x.Z - 1))] },
    tex: { E: "E \\approx 10{,}2\\,\\mathrm{eV}\\cdot (Z - 1)^2", la: "\\lambda = \\frac{h c}{E} \\approx \\frac{h c}{10{,}2\\,\\mathrm{eV}\\cdot (Z - 1)^2}" }, inv: { Z: "Z = 1 + \\sqrt{\\frac{E}{10{,}2\\,\\mathrm{eV}}}" }, noPow: true,
    cst: CH + ", " + CC + ", 1 eV = 1,602 · 10⁻¹⁹ J" });
  spec("bragg-grenze", { ctx: "Die Strahlung einer Röntgenröhre mit der Spannung $U$ fällt auf einen Kristall mit dem Netzebenenabstand $d$. Unterhalb eines kleinsten Glanzwinkels $\\vartheta_{min}$ gibt es in erster Ordnung keine Reflexion mehr.",
    v: { U: ["U", "Röhrenspannung", "kV", 10, 50, 0, 1e3, "V", 1], d: ["d", "Netzebenenabstand", "pm", 200, 400, 0, 1e-12, "nm", 1e-9] },
    o: { th: ["\\vartheta_{min}", "kleinster Glanzwinkel", "°", 3, DEG, (x) => Math.asin((h * c) / (e * x.U) / (2 * x.d))] },
    tex: { th: "\\lambda_{min} = \\frac{h c}{e U},\\qquad \\sin\\vartheta_{min} = \\frac{\\lambda_{min}}{2d}" }, inv: { U: "U = \\frac{h c}{2 e d\\sin\\vartheta_{min}}" }, invKeys: ["U"], noPow: true,
    cst: CH + ", " + CC + ", " + CE });
  // radioactivity beyond the basic types
  const NA = 6.022e23;
  spec("aktivitaet-masse", { ctx: "Ein Präparat enthält die Masse $m$ eines Nuklids mit der molaren Masse $M$ und der Halbwertszeit $T_{1/2}$.",
    v: { m: ["m", "Masse", "µg", 0.1, 10, 2, 1e-9, "mg", 1e-6], M: ["M", "molare Masse", "g/mol", 20, 240, 0, 1e-3], T: ["T_{1/2}", "Halbwertszeit", "d", 1, 100, 1, 86400, "h", 3600] },
    o: { A: ["A", "Aktivität", "GBq", 3, 1e9, (x) => (Math.log(2) / x.T) * (x.m / x.M) * NA] },
    tex: { A: "A = \\lambda N = \\frac{\\ln 2}{T_{1/2}}\\cdot\\frac{m}{M}\\,N_A" }, inv: { m: "m = \\frac{A\\,M\\,T_{1/2}}{\\ln 2\\cdot N_A}" }, invKeys: ["m"],
    cst: "Avogadro-Konstante 6,022 · 10²³ mol⁻¹" });
  spec("zaehlrate", { ctx: "Ein Zählrohr misst an einem Präparat (nach Abzug des Nulleffekts) zunächst die Zählrate $A_1$; nach der Zeit $t$ ist sie auf $A_2$ gesunken.",
    v: { A1: ["A_1", "Zählrate am Anfang", "1/s", 200, 2000, 0], T: ["T_{1/2}", "Halbwertszeit", "min", 2, 60, 1, 60, "s", 1], t: ["t", "Zeit zwischen den Messungen", "min", 1, 120, 0, 60, "h", 3600] },
    o: { A2: ["A_2", "Zählrate nach der Zeit t", "1/s", 3, 1, (x) => x.A1 * Math.pow(0.5, x.t / x.T)] },
    tex: { A2: "A_2 = A_1\\left(\\tfrac12\\right)^{t/T_{1/2}}" }, inv: { T: "T_{1/2} = \\frac{t\\,\\ln 2}{\\ln(A_1/A_2)}" }, invKeys: ["T"], noPow: true,
    ok: (x) => x.t / x.T > 0.3 && x.t / x.T < 5 });
  spec("c14", { ctx: "Lebendes Material zeigt pro Minute und Gramm Kohlenstoff $15{,}3$ Zerfälle von Kohlenstoff-14 ($T_{1/2} = 5730\\,\\mathrm{a}$). Eine Probe aus einem Fund zeigt nur noch die Zerfallsrate $R$.",
    v: { R: ["R", "Zerfallsrate der Probe", "1/(min·g)", 0.5, 14, 1] },
    o: { t: ["t", "Alter des Fundes", "a", 3, 1, (x) => (5730 * Math.log(15.3 / x.R)) / Math.log(2)] },
    tex: { t: "R = 15{,}3\\cdot\\left(\\tfrac12\\right)^{t/T_{1/2}} \\;\\Rightarrow\\; t = T_{1/2}\\,\\frac{\\ln(15{,}3/R)}{\\ln 2}" }, inv: { R: "R = 15{,}3\\cdot\\left(\\tfrac12\\right)^{t/T_{1/2}}" }, noPow: true });
  spec("halbwertsdicke", { ctx: "Gammastrahlung durchdringt eine Bleischicht der Dicke $d$. Die Halbwertsdicke $d_{1/2}$ ist die Schichtdicke, nach der die Intensität auf die Hälfte gesunken ist.",
    v: { h: ["d_{1/2}", "Halbwertsdicke", "cm", 0.4, 1.5, 1, 0.01, "mm", 0.001], d: ["d", "Dicke der Schicht", "cm", 0.5, 8, 1, 0.01, "mm", 0.001] },
    o: { P: ["I/I_0", "durchgelassener Anteil", "%", 3, 0.01, (x) => Math.pow(0.5, x.d / x.h)] },
    tex: { P: "\\frac{I}{I_0} = \\left(\\tfrac12\\right)^{d/d_{1/2}}" }, inv: { d: "d = d_{1/2}\\,\\frac{\\ln(I_0/I)}{\\ln 2}" }, invKeys: ["d"], noPow: true, ok: (x) => x.d / x.h < 8 });
  // special relativity beyond the basic types
  const TAUMU = 2.197e-6, MEC2 = me * c * c;
  spec("myon", { ctx: "Myonen entstehen hoch in der Atmosphäre und fliegen mit $v$ zur Erde; ihre mittlere Lebensdauer in ihrem eigenen System ist $\\tau_0 = 2{,}197\\,\\mu\\mathrm{s}$.",
    v: { v: ["v", "Geschwindigkeit", "c", 0.95, 0.9995, 4, c] },
    o: { s: ["s", "mittlere Flugstrecke im Erdsystem", "km", 3, 1e3, (x) => (x.v * TAUMU) / Math.sqrt(1 - Math.pow(x.v / c, 2))], s0: ["s_{klass}", "Flugstrecke ohne Zeitdilatation", "m", 3, 1, (x) => x.v * TAUMU] },
    tex: { s: "s = v\\,\\gamma\\,\\tau_0 = \\frac{v\\,\\tau_0}{\\sqrt{1 - v^2/c^2}}", s0: "s_{klass} = v\\,\\tau_0" }, noInv: true, noPow: true, cst: CC });
  spec("rel-geschwindigkeit", { ctx: "Ein Elektron ($m_e c^2 = 511\\,\\mathrm{keV}$) wird aus der Ruhe mit der Spannung $U$ beschleunigt.",
    v: { U: ["U", "Beschleunigungsspannung", "kV", 20, 3000, 0, 1e3, "MV", 1e6] },
    o: { b: ["v", "Geschwindigkeit", "c", 3, c, (x) => c * Math.sqrt(1 - 1 / Math.pow(1 + (e * x.U) / MEC2, 2))], ga: ["\\gamma", "Lorentzfaktor", "", 3, 1, (x) => 1 + (e * x.U) / MEC2] },
    tex: { b: "\\gamma = 1 + \\frac{e U}{m_e c^2},\\qquad v = c\\sqrt{1 - \\frac{1}{\\gamma^2}}", ga: "E_{kin} = e U = (\\gamma - 1)\\,m_e c^2 \\;\\Rightarrow\\; \\gamma = 1 + \\frac{e U}{m_e c^2}" },
    inv: { U: "U = \\frac{(\\gamma - 1)\\,m_e c^2}{e}" }, invOut: "ga", noPow: true });
  spec("masse-energie", { ctx: "Eine Masse $m$ wird vollständig in Energie umgewandelt; das gelingt nur bei der Paarvernichtung von Materie und Antimaterie.",
    v: { m: ["m", "Masse", "g", 0.01, 10, 2, 1e-3, "mg", 1e-6] },
    o: { E: ["E", "Energie", "GWh", 3, 3.6e12, (x) => x.m * c * c] },
    tex: { E: "E = m\\,c^2" }, inv: { m: "m = \\frac{E}{c^2}" }, cst: CC + ", 1 GWh = 3,6 · 10¹² J" });
  spec("uhrengang", { ctx: "Eine Atomuhr bewegt sich mit der Geschwindigkeit $v$ (Flugzeug oder Satellit). Um wie viel geht sie nach der Zeit $t$ gegenüber einer ruhenden Uhr nach? Für $v \\ll c$ gilt $\\gamma - 1 \\approx \\tfrac12\\tfrac{v^2}{c^2}$; die Schwerkraft bleibt hier unberücksichtigt.",
    v: { v: ["v", "Geschwindigkeit", "km/s", 0.2, 8, 2, 1e3, "km/h", 1 / 3.6], t: ["t", "Dauer", "h", 1, 24, 0, 3600, "d", 86400] },
    o: { d: ["\\Delta t - \\Delta t_0", "Gangunterschied", "ns", 3, 1e-9, (x) => 0.5 * Math.pow(x.v / c, 2) * x.t] },
    tex: { d: "\\Delta t - \\Delta t_0 = (\\gamma - 1)\\,\\Delta t_0 \\approx \\tfrac12\\frac{v^2}{c^2}\\,t" }, inv: { v: "v = c\\sqrt{\\frac{2\\,(\\Delta t - \\Delta t_0)}{t}}" }, invKeys: ["v"], cst: CC });
  // nuclear energy beyond the basic types
  spec("uran-energie", { ctx: "In einem Reaktor wird die Masse $m$ Uran-235 vollständig gespalten; jede Spaltung setzt etwa $200\\,\\mathrm{MeV}$ frei ($M = 235\\,\\mathrm{g/mol}$). Steinkohle liefert $30\\,\\mathrm{MJ/kg}$.",
    v: { m: ["m", "Masse Uran-235", "g", 1, 1000, 0, 1e-3, "kg", 1] },
    o: { E: ["E", "freigesetzte Energie", "TJ", 3, 1e12, (x) => (x.m / 0.235) * NA * 200e6 * e], K: ["m_K", "Masse Steinkohle mit derselben Energie", "t", 3, 1e3, (x) => ((x.m / 0.235) * NA * 200e6 * e) / 30e6] },
    tex: { E: "E = \\frac{m}{M}\\,N_A\\cdot 200\\,\\mathrm{MeV}", K: "m_K = \\frac{E}{30\\,\\mathrm{MJ/kg}}" }, inv: { m: "m = \\frac{E\\,M}{N_A\\cdot 200\\,\\mathrm{MeV}}" }, invOut: "E",
    cst: "Avogadro-Konstante 6,022 · 10²³ mol⁻¹, 1 MeV = 1,602 · 10⁻¹³ J" });
  spec("massenabnahme", { ctx: "Ein Kernkraftwerk gibt die thermische Leistung $P$ ab. Um wie viel nimmt die Masse des Brennstoffs in der Zeit $t$ ab?",
    v: { P: ["P", "thermische Leistung", "GW", 0.5, 4, 1, 1e9, "MW", 1e6], t: ["t", "Zeit", "d", 1, 365, 0, 86400, "h", 3600] },
    o: { m: ["\\Delta m", "Massenabnahme", "g", 3, 1e-3, (x) => (x.P * x.t) / (c * c)] },
    tex: { m: "\\Delta m = \\frac{E}{c^2} = \\frac{P\\,t}{c^2}" }, inv: { P: "P = \\frac{\\Delta m\\,c^2}{t}" }, invKeys: ["P", "t"], cst: CC });
  // stars, cosmology and semiconductors
  spec("wien", { ctx: "Ein Stern strahlt annähernd wie ein schwarzer Körper der Oberflächentemperatur $T$ (Wiensches Verschiebungsgesetz $\\lambda_{max}\\,T = 2{,}898\\cdot 10^{-3}\\,\\mathrm{m\\,K}$).",
    v: { T: ["T", "Oberflächentemperatur", "K", 2500, 30000, 0] },
    o: { la: ["\\lambda_{max}", "Wellenlänge des Strahlungsmaximums", "nm", 3, 1e-9, (x) => 2.898e-3 / x.T] },
    tex: { la: "\\lambda_{max} = \\frac{2{,}898\\cdot 10^{-3}\\,\\mathrm{m\\,K}}{T}" }, inv: { T: "T = \\frac{2{,}898\\cdot 10^{-3}\\,\\mathrm{m\\,K}}{\\lambda_{max}}" } });
  spec("stefan-boltzmann", { ctx: "Die Leuchtkraft eines Sterns ist $L = 4\\pi R^2\\,\\sigma T^4$. Im Vergleich mit der Sonne ($T_\\odot = 5778\\,\\mathrm{K}$) gilt $\\frac{L}{L_\\odot} = \\left(\\frac{R}{R_\\odot}\\right)^2\\left(\\frac{T}{T_\\odot}\\right)^4$.",
    v: { R: ["R", "Radius", "Sonnenradien", 0.1, 50, 2], T: ["T", "Oberflächentemperatur", "K", 3000, 25000, 0] },
    o: { L: ["L", "Leuchtkraft", "Sonnenleuchtkräfte", 3, 1, (x) => x.R * x.R * Math.pow(x.T / 5778, 4)] },
    tex: { L: "\\frac{L}{L_\\odot} = \\left(\\frac{R}{R_\\odot}\\right)^2\\left(\\frac{T}{T_\\odot}\\right)^4" }, inv: { R: "\\frac{R}{R_\\odot} = \\sqrt{\\frac{L/L_\\odot}{(T/T_\\odot)^4}}" }, invKeys: ["R"] });
  spec("hubble-zeit", { ctx: "Unter der vereinfachenden Annahme einer immer gleich schnellen Expansion ist das Weltalter etwa $t_H = \\frac{1}{H_0}$ ($1\\,\\mathrm{Mpc} = 3{,}086\\cdot 10^{19}\\,\\mathrm{km}$, $1\\,\\mathrm{a} = 3{,}156\\cdot 10^{7}\\,\\mathrm{s}$).",
    v: { H: ["H_0", "Hubble-Konstante", "km/(s·Mpc)", 50, 90, 1] },
    o: { t: ["t_H", "Hubble-Zeit", "Mrd. Jahre", 3, 1, (x) => 3.086e19 / x.H / 3.156e7 / 1e9] },
    tex: { t: "t_H = \\frac{1}{H_0} = \\frac{3{,}086\\cdot 10^{19}\\,\\mathrm{km}}{H_0\\cdot 1\\,\\mathrm{Mpc}}" }, inv: { H: "H_0 = \\frac{1}{t_H}" } });
  spec("parallaxe", { ctx: "Ein naher Stern zeigt im Lauf eines Jahres die Parallaxe $p$. Es gilt $d = \\frac{1}{p}$ mit $d$ in Parsec und $p$ in Bogensekunden; $1\\,\\mathrm{pc} = 3{,}26$ Lichtjahre.",
    v: { p: ["p", "Parallaxe", "Millibogensekunden", 2, 800, 1, 1e-3] },
    o: { d: ["d", "Entfernung", "pc", 3, 1, (x) => 1 / x.p], lj: ["d", "Entfernung", "Lichtjahre", 3, 1, (x) => 3.26 / x.p] },
    tex: { d: "d = \\frac{1}{p}\\ \\text{(pc, mit } p \\text{ in Bogensekunden)}", lj: "d = \\frac{3{,}26\\,\\mathrm{Lj}}{p}\\ \\text{(} p \\text{ in Bogensekunden)}" }, inv: { p: "p = \\frac{1}{d}" }, invOut: "d" });
  spec("galaxie-entfernung", { ctx: "Die Wasserstofflinie $\\mathrm{H}_\\alpha$ ($\\lambda_0 = 656{,}3\\,\\mathrm{nm}$) erscheint im Licht einer Galaxie um $\\Delta\\lambda$ zu längeren Wellen verschoben; $H_0 = 70\\,\\mathrm{km/(s\\cdot Mpc)}$.",
    v: { dl: ["\\Delta\\lambda", "Verschiebung", "nm", 0.5, 40, 1] },
    o: { d: ["d", "Entfernung der Galaxie", "Mpc", 3, 1, (x) => ((x.dl / 656.3) * 299800) / 70] },
    tex: { d: "z = \\frac{\\Delta\\lambda}{\\lambda_0},\\quad v \\approx z\\,c,\\quad d = \\frac{v}{H_0}" }, inv: { dl: "\\Delta\\lambda = \\frac{H_0\\,d}{c}\\,\\lambda_0" }, cst: CC });
  spec("rotverschiebung-rel", { ctx: "Für große Rotverschiebungen gilt die relativistische Dopplerformel $1 + z = \\sqrt{\\frac{1 + \\beta}{1 - \\beta}}$ mit $\\beta = \\frac{v}{c}$ (für eine Bewegung durch den Raum).",
    v: { z: ["z", "Rotverschiebung", "", 0.1, 3, 2] },
    o: { b: ["\\beta", "Geschwindigkeit in Einheiten von c", "", 3, 1, (x) => (Math.pow(1 + x.z, 2) - 1) / (Math.pow(1 + x.z, 2) + 1)] },
    tex: { b: "(1 + z)^2 = \\frac{1 + \\beta}{1 - \\beta} \\;\\Rightarrow\\; \\beta = \\frac{(1 + z)^2 - 1}{(1 + z)^2 + 1}" }, inv: { z: "z = \\sqrt{\\frac{1 + \\beta}{1 - \\beta}} - 1" }, noPow: true });
  spec("bandluecke", { ctx: "Ein Halbleiter hat die Bandlücke $E_g$. Photonen mit mindestens dieser Energie heben Elektronen vom Valenz- ins Leitungsband; eine LED aus dem Material sendet Photonen mit etwa $E_g$ aus.",
    v: { E: ["E_g", "Bandlücke", "eV", 0.6, 3.5, 2, e] },
    o: { la: ["\\lambda", "zugehörige Wellenlänge", "nm", 3, 1e-9, (x) => (h * c) / x.E] },
    tex: { la: "\\lambda = \\frac{h c}{E_g} \\approx \\frac{1240\\,\\mathrm{nm}}{E_g/\\mathrm{eV}}" }, inv: { E: "E_g = \\frac{h c}{\\lambda}" }, cst: CH + ", " + CC + ", " + CE });

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

  function makeWith(T, level, G, params) {
    const list = [].concat((params && params.typ) || Object.keys(T)).filter((k) => T[k]);
    const id = G.pick(list.length ? list : Object.keys(T));
    if (T[id].custom) return T[id].custom(level, G);
    const S = T[id];
    const okeys = Object.keys(S.o);
    const cst = S.cst ? "\n\nKonstanten: " + S.cst + "." : "";
    // level 4: proportionality, if some output is a power law of some input
    if (level >= 4) {
      const pairs = [];
      okeys.forEach((ok) => Object.keys(S.v).forEach((ik) => { if (S.noPow && (S.noPow === true || S.noPow.includes(ik))) return; const q = powerLaw(S, G, ok, ik); if (q !== null && q !== 0) pairs.push([ok, ik, q]); }));
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

  // h from a measured cut-off wavelength (the answer follows from the values shown, measurement error included)
  spec("duane-h", { custom(level, G) {
    const U = G.pick([20, 25, 30, 35, 40, 45]);
    const lam = G.round(((h * c) / (e * U * 1e3)) / 1e-12 * (1 + (G.r() - 0.5) * 0.04), 1);
    const hv = (e * U * 1e3 * lam * 1e-12) / 3.0e8 / 1e-34;
    const md = "Bei einer Röntgenröhre mit der Spannung $U = " + U + "\\,\\mathrm{kV}$ bricht das Bremsspektrum bei $\\lambda_{min} = " + G.tex(lam, 1) + "\\,\\mathrm{pm}$ ab. Bestimme daraus das Plancksche Wirkungsquantum $h$ in $10^{-34}\\,\\mathrm{Js}$.\n\nKonstanten: " + CE + ", " + CC + ".";
    return numericStep(md, hv, "10⁻³⁴ Js", "Ein Elektron gibt höchstens seine ganze Energie $eU$ an ein Photon ab: $e U = \\frac{h c}{\\lambda_{min}}$, also $h = \\frac{e U \\lambda_{min}}{c} = \\frac{1{,}602\\cdot 10^{-19}\\cdot " + U + "\\cdot 10^{3}\\cdot " + G.tex(lam, 1) + "\\cdot 10^{-12}}{3{,}00\\cdot 10^{8}}\\,\\mathrm{Js} \\approx " + G.tex(sig(hv, 3), 6) + "\\cdot 10^{-34}\\,\\mathrm{Js}$. Literaturwert: $6{,}626\\cdot 10^{-34}\\,\\mathrm{Js}$.");
  } });
  // Franck-Hertz: maxima shifted by a contact voltage, the spacing averaged over several periods
  spec("fh-maxima", { custom(level, G) {
    const hg = level < 3 || G.chance(0.6);
    const dE = hg ? 4.9 : 18.7, gas = hg ? "Quecksilberdampf" : "Neon";
    const off = G.round(0.2 + G.r() * 1.4, 1), n = G.pick([3, 4, 5]);
    const U = [];
    for (let k = 1; k <= n; k++) U.push(G.round(off + k * dE + (G.r() - 0.5) * (hg ? 0.2 : 0.6), 1));
    const dU = (U[n - 1] - U[0]) / (n - 1);
    const askLam = hg && level >= 2 && G.chance(0.5);
    const list = U.map((u) => G.tex(u, 1) + "\\,\\mathrm{V}").join(",\\; ");
    const md = "In einer Franck-Hertz-Röhre mit " + gas + " liegen die Maxima des Auffängerstroms bei $" + list + "$. " + (askLam
      ? "Welche Wellenlänge hat das Licht, das die angeregten Atome beim Zurückfallen aussenden? Werte möglichst genau aus (in nm).\n\nHilfe: $h c = 1240\\,\\mathrm{eV\\,nm}$."
      : "Bestimme die Anregungsenergie möglichst genau (in eV).");
    const how = "Den Abstand über alle Perioden mitteln: $\\Delta U = \\frac{" + G.tex(U[n - 1], 1) + " - " + G.tex(U[0], 1) + "}{" + (n - 1) + "}\\,\\mathrm{V} \\approx " + G.tex(sig(dU, 3), 6) + "\\,\\mathrm{V}$, also $E = e\\,\\Delta U \\approx " + G.tex(sig(dU, 3), 6) + "\\,\\mathrm{eV}$. Die Lage des ersten Maximums enthält zusätzlich eine Kontaktspannung und taugt nicht.";
    return askLam ? numericStep(md, 1240 / dU, "nm", how + " Dann $\\lambda = \\frac{1240\\,\\mathrm{eV\\,nm}}{E} \\approx " + G.tex(sig(1240 / dU, 3), 6) + "\\,\\mathrm{nm}$, ultraviolett.")
      : numericStep(md, dU, "eV", how);
  } });
  // which upper level belongs to a measured hydrogen line
  spec("linie-zuordnen", { custom(level, G) {
    const n1 = level >= 3 ? G.pick([1, 2, 3]) : 2;
    const n2 = n1 + G.pick([1, 2, 3, 4]);
    const dE = 13.6 * (1 / (n1 * n1) - 1 / (n2 * n2));
    const lam = G.round(1239.84 / dE, 1);
    const ser = { 1: "Lyman", 2: "Balmer", 3: "Paschen" }[n1];
    const md = "Im Spektrum des Wasserstoffs ($E_n = -13{,}6\\,\\mathrm{eV}/n^2$) misst man eine Linie der " + ser + "-Serie (Endniveau $n_1 = " + n1 + "$) bei $\\lambda = " + G.tex(lam, 1) + "\\,\\mathrm{nm}$. Aus welchem Niveau $n_2$ kommt das Elektron?\n\nHilfe: $h c = 1240\\,\\mathrm{eV\\,nm}$.";
    return numericStep(md, n2, "", "Photonenenergie $\\Delta E = \\frac{1240}{" + G.tex(lam, 1) + "}\\,\\mathrm{eV} \\approx " + G.tex(sig(dE, 3), 6) + "\\,\\mathrm{eV}$. Aus $\\Delta E = 13{,}6\\,\\mathrm{eV}\\left(\\frac{1}{" + n1 * n1 + "} - \\frac{1}{n_2^2}\\right)$ folgt $\\frac{1}{n_2^2} = \\frac{1}{" + n1 * n1 + "} - \\frac{\\Delta E}{13{,}6\\,\\mathrm{eV}}$, also $n_2 = " + n2 + "$.");
  } });

  // nuclear reactions with tabulated atomic masses (charges balance on both sides, so the electron masses cancel)
  const NUC = { D: ["^2_1\\mathrm{H}", 2.014102], T: ["^3_1\\mathrm{H}", 3.016049], H: ["^1_1\\mathrm{H}", 1.007825], n: ["^1_0\\mathrm{n}", 1.008665], He3: ["^3_2\\mathrm{He}", 3.016029],
    He4: ["^4_2\\mathrm{He}", 4.002602], Li6: ["^6_3\\mathrm{Li}", 6.015123], U235: ["^{235}_{92}\\mathrm{U}", 235.04393], Ba141: ["^{141}_{56}\\mathrm{Ba}", 140.914411], Kr92: ["^{92}_{36}\\mathrm{Kr}", 91.926156] };
  const REAKTIONEN = [
    ["Fusion von Deuterium und Tritium", [["D", 1], ["T", 1]], [["He4", 1], ["n", 1]]],
    ["Fusion zweier Deuteriumkerne", [["D", 2]], [["He3", 1], ["n", 1]]],
    ["Fusion zweier Deuteriumkerne (zweiter Zweig)", [["D", 2]], [["T", 1], ["H", 1]]],
    ["Erzeugung von Tritium aus Lithium", [["Li6", 1], ["n", 1]], [["He4", 1], ["T", 1]]],
    ["Spaltung von Uran-235", [["U235", 1], ["n", 1]], [["Ba141", 1], ["Kr92", 1], ["n", 3]]],
  ];
  spec("kern-reaktion", { custom(level, G) {
    const [name, pre, post] = G.pick(REAKTIONEN);
    const side = (arr) => arr.map(([k, n]) => (n > 1 ? n + "\\," : "") + "{}" + NUC[k][0]).join(" + ");
    const mass = (arr) => arr.reduce((s, [k, n]) => s + n * NUC[k][1], 0);
    const A = pre.reduce((s, [k, n]) => s + n * Math.round(NUC[k][1]), 0);
    const dm = mass(pre) - mass(post), E = dm * 931.5;
    const keys = Array.from(new Set(pre.concat(post).map(([k]) => k)));
    const list = keys.map((k) => "$m(" + NUC[k][0] + ") = " + String(NUC[k][1]).replace(".", "{,}") + "\\,\\mathrm{u}$").join(", ");
    const perNuc = level >= 3;
    const md = "Bei der " + name + " läuft die Reaktion $" + side(pre) + " \\to " + side(post) + "$ ab. Atommassen: " + list + "; $1\\,\\mathrm{u}\\cdot c^2 = 931{,}5\\,\\mathrm{MeV}$.\n\n" +
      (perNuc ? "Wie viel Energie wird pro beteiligtem Nukleon frei (in MeV)?" : "Wie viel Energie wird bei einer Reaktion frei (in MeV)?");
    const how = "Massen vorher $" + G.tex(mass(pre), 6) + "\\,\\mathrm{u}$, nachher $" + G.tex(mass(post), 6) + "\\,\\mathrm{u}$, also $\\Delta m = " + G.tex(dm, 6) + "\\,\\mathrm{u}$ und $E = \\Delta m\\cdot 931{,}5\\,\\tfrac{\\mathrm{MeV}}{\\mathrm{u}} \\approx " + G.tex(sig(E, 4), 6) + "\\,\\mathrm{MeV}$.";
    return perNuc ? numericStep(md, E / A, "MeV", how + " Beteiligt sind " + A + " Nukleonen: $\\frac{E}{" + A + "} \\approx " + G.tex(sig(E / A, 3), 6) + "\\,\\mathrm{MeV}$. Fusion liefert pro Nukleon mehrfach so viel wie Spaltung.")
      : numericStep(md, E, "MeV", how);
  } });

  // logistic map: fixed point, a few iterations (rounded like by hand), Feigenbaum ratio
  spec("logistik", { custom(level, G) {
    const L = "x_{n+1} = r\\,x_n(1 - x_n)";
    if (level <= 1) {
      const r = G.round(1.2 + G.r() * 1.7, 2);
      return numericStep("Für die logistische Gleichung $" + L + "$ mit $r = " + G.tex(r, 2) + "$ strebt die Folge gegen einen festen Wert. Berechne diesen Fixpunkt $x^*$.", 1 - 1 / r, "",
        "Fixpunkt: $x^* = r x^*(1 - x^*)$; durch $x^* \\ne 0$ teilen gibt $1 = r(1 - x^*)$, also $x^* = 1 - \\frac{1}{r} = 1 - \\frac{1}{" + G.tex(r, 2) + "} \\approx " + G.tex(sig(1 - 1 / r, 3), 6) + "$.");
    }
    if (level >= 4 && G.chance(0.4)) {
      const first = G.chance(0.5);
      const q = first ? (3.449 - 3) / (3.544 - 3.449) : (3.544 - 3.449) / (3.5644 - 3.544);
      return numericStep("Die ersten Periodenverdopplungen der logistischen Gleichung liegen bei $r_1 = 3{,}000$, $r_2 = 3{,}449$, $r_3 = 3{,}544$ und $r_4 = 3{,}5644$. Berechne das Verhältnis " + (first ? "$\\frac{r_2 - r_1}{r_3 - r_2}$" : "$\\frac{r_3 - r_2}{r_4 - r_3}$") + ".", q, "",
        "Eingesetzt " + (first ? "$\\frac{0{,}449}{0{,}095}$" : "$\\frac{0{,}095}{0{,}0204}$") + " $\\approx " + G.tex(sig(q, 3), 6) + "$. Die Verhältnisse nähern sich der Feigenbaum-Konstanten $\\delta \\approx 4{,}669$, die für viele ganz verschiedene Systeme gleich ist.");
    }
    const chaos = level >= 3, n = chaos ? 3 : 2;
    let r = 3, xs = [0.5];
    for (let t = 0; t < 30; t++) {
      r = chaos ? G.round(3.6 + G.r() * 0.4, 2) : G.round(2.5 + G.r(), 2);
      xs = [G.round(0.1 + G.r() * 0.8, 2)];
      for (let i = 0; i < n; i++) xs.push(G.round(r * xs[i] * (1 - xs[i]), 4));
      if (xs[n] > 0.15) break;
    }
    return numericStep("Berechne für $" + L + "$ mit $r = " + G.tex(r, 2) + "$ und $x_0 = " + G.tex(xs[0], 2) + "$ den Wert $x_" + n + "$. Runde jeden Zwischenwert auf vier Nachkommastellen.", xs[n], "",
      xs.slice(1).map((x, i) => "$x_" + (i + 1) + " = " + G.tex(r, 2) + "\\cdot " + G.tex(xs[i], 4) + "\\cdot(1 - " + G.tex(xs[i], 4) + ") \\approx " + G.tex(x, 4) + "$").join(", ") + "." +
      (chaos ? " Im chaotischen Bereich wachsen schon kleine Rundungsunterschiede schnell an." : ""));
  } });

  const make = (level, G, params) => makeWith(T, level, G, params);
  LW.generator("phy-rechnen", { title: "Physik rechnen", make });
  // the same engine for other subjects: LW.rechenEngine(specs) returns a make function; specs as above
  LW.rechenEngine = (specs) => (level, G, params) => makeWith(specs, level, G, params);
  LW.rechenHelpers = { numericStep, factorTex, sig };
  LW.physikTypen = T;
})();

// Training topics per chapter of the physics course: the task types of that chapter, mixed.
(function () {
  const make = LW.generators["phy-rechnen"].make;
  const chapter = (typ) => ({ title: "Physik rechnen", make: (level, G) => make(level, G, { typ }) });
  LW.generator("phy-r-kinematik", chapter(["waagerechter-wurf", "schiefer-wurf", "fall", "bewegungsgleichung", "begegnung", "verfolgung", "vt", "wurf-bahn"]));
  LW.generator("phy-r-dynamik", chapter(["schiefe-ebene", "energie-fall", "energie-feder", "stoss", "stoss-elastisch", "rueckstoss", "schub", "kraftstoss", "aufzug",
    "gekoppelt", "energie-reibung", "energie-wurf", "pendel-energie", "looping", "haftreibung", "zug-schraeg", "ballistisch", "stoss-gegen"]));
  LW.generator("phy-r-kreis", chapter(["kreis", "zentripetal", "gravitation", "satellit", "flucht", "kepler3", "drehzahl", "kurve-max", "ueberhoehung", "kegelpendel",
    "vertikalkreis", "ortsfaktor", "zentralmasse", "bahnhoehe", "flucht-orbit"]));
  LW.generator("phy-r-rotation", chapter(["drehmoment", "drehimpuls", "grenzgeschwindigkeit", "entropie", "euler", "hebel", "rollen", "rotationsenergie", "anlaufen",
    "drehimpuls-scheibe", "carnot", "entropie-fluss", "verdampfen", "luftleistung", "stokes"]));
  LW.generator("phy-r-efeld", chapter(["plattenfeld", "kraft-feld", "kondensator", "kondensator-getrennt", "ablenkung", "beschleunigung-u", "millikan", "coulomb", "punktfeld",
    "schirmablenkung", "austrittswinkel", "energiedichte", "rc-entladung", "millikan-stokes"]));
  LW.generator("phy-r-bfeld", chapter(["lorentz", "bahnradius", "fadenstrahl", "wien", "massenspektrometer", "hall", "linac", "spule", "leiterkraft", "zyklotron", "helmholtz", "schraube"]));
  LW.generator("phy-r-induktion", chapter(["induktion", "bewegungsinduktion", "induktivitaet", "selbstinduktion", "trafo", "generator", "spulenenergie", "einschalten", "fernleitung", "leiterschleife"]));
  LW.generator("phy-r-schwingungen", chapter(["federpendel", "fadenpendel", "schwingung-energie", "schwingung-y", "daempfung", "resonanz", "thomson", "schwingung-v", "federn", "schwingkreis-strom"]));
  LW.generator("phy-r-wellen", chapter(["welle-c", "welle-y", "stehende-welle", "doppler", "schwebung", "superposition", "doppler-beobachter", "pfeife", "saite"]));
  LW.generator("phy-r-optik", chapter(["gitter", "snellius", "grenzwinkel", "doppelspalt", "einzelspalt", "entspiegelung", "michelson", "malus", "lichtleiter"]));
  LW.generator("phy-r-quanten", chapter(["photoeffekt", "photonenimpuls", "debroglie", "photon", "compton", "sonnensegel", "led", "gegenfeld-zwei", "photonenstrom",
    "debroglie-proton", "debroglie-neutron", "elektronen-doppelspalt", "beugungsring", "unschaerfe"]));
  LW.generator("phy-r-atom", chapter(["bohr", "spektrallinie", "franck-hertz", "duane-hunt", "bragg", "moseley", "bragg-grenze", "duane-h", "fh-maxima", "linie-zuordnen"]));
  LW.generator("phy-r-kern", chapter(["zerfall", "halbwertszeit", "aktivitaet", "aktivitaet-masse", "zaehlrate", "c14", "halbwertsdicke"]));
  LW.generator("phy-r-relativ", chapter(["zeitdilatation", "laengenkontraktion", "rel-energie", "myon", "rel-geschwindigkeit", "masse-energie", "uhrengang"]));
  LW.generator("phy-r-q4kern", chapter(["bindungsenergie", "kernenergie", "kern-reaktion", "uran-energie", "massenabnahme"]));
  LW.generator("phy-r-astro", chapter(["hubble", "rotverschiebung", "wien", "stefan-boltzmann", "hubble-zeit", "parallaxe", "galaxie-entfernung", "rotverschiebung-rel", "bandluecke", "logistik"]));
})();
