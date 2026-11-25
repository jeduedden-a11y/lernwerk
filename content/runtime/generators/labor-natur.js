/* Lab tasks for physics and chemistry. Every task is a widget step whose start does not meet the goal and whose sample solution does.
 *   lab-feld         point charges: zero of the field, zero of the potential, direction of the field, the dipole's bisector (feldlabor)
 *   lab-schaltung    series, divider, parallel, mixed circuits (schaltung)
 *   lab-teilchen     electrons in the fine beam tube: radius, halving it, e/m, speed and radius together (versuch)
 *   lab-wellen       grating and electron diffraction: position of the first maximum, wavelength, de Broglie (versuch)
 *   lab-schwingung   spring pendulum: period, doubling it, spring constant, frequency (versuch)
 *   lab-titration    indicator change, half-equivalence point, concentrations of hydrochloric and acetic acid (versuch)
 *   lab-gleichgewicht  excess of a reactant, a mixture already in equilibrium, temperature and K (gleichgewicht)
 *   lab-galvani      voltage of cells, Nernst, concentration cells, which metal is the cathode (galvani)
 *   lab-ausgleichen  balancing equations, from combustion to redox equations with ions (ausgleichen) */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const cn = (x) => String(+(+x).toFixed(6));
  function goal(list, solve) { return { when: list.map((x) => "(" + x.when + ")").join(" && "), list, solve }; }
  function task(widget, label, md, params, g, hint, explain) { return { type: "widget", widget, label, md, params, goal: g, hint, explain }; }
  const kC = 8.988e9;

  // ---------------------------------------------------------------- electric field
  gen("lab-feld", {
    title: "Felder von Punktladungen",
    make(level, G) {
      if (level === 1) {
        const [q1, q2, x1, x2, x0] = G.pick([[2, 2, -3, 3, 0], [1, 4, -3, 3, -1], [4, 1, -3, 3, 1], [1, 9, -4, 4, -2], [9, 1, -4, 4, 2], [-2, -2, -2, 2, 0], [1, 4, -4.5, 1.5, -2.5]]);
        return task("feldlabor", "Feldlabor",
          "Zwei Ladungen gleichen Vorzeichens: $q_1 = " + G.tex(q1) + "\\,\\text{nC}$ bei $x = " + G.tex(x1) + "$ cm und $q_2 = " + G.tex(q2) + "\\,\\text{nC}$ bei $x = " + G.tex(x2) + "$ cm. Ziehe den Messpunkt P an die Stelle, an der das **Feld verschwindet**.",
          { charges: [{ x: x1, y: 0, q: q1 }, { x: x2, y: 0, q: q2 }], probe: [0, 2], edit: false },
          goal([{ when: "E < 0.001", show: "$|\\vec E| = 0$ in P" }], { probe: [x0, 0] }),
          "Zwischen den Ladungen zeigen die beiden Felder in entgegengesetzte Richtungen. Wo sind sie gleich stark? $\\frac{q_1}{r_1^2} = \\frac{q_2}{r_2^2}$.",
          "Bei $x = " + G.tex(x0) + "$ cm gilt $\\frac{q_1}{r_1^2} = \\frac{q_2}{r_2^2}$: Die Feldstärken heben sich auf. Der Punkt liegt näher an der kleineren Ladung.");
      }
      if (level === 2) {
        const [x1, x2, px, py, fN, fD] = G.pick([[-3, 3, -1, 0, 2, 1], [-3, 3, 1, 0, 1, 2], [-4, 2, 0, 0, 1, 2], [-2, 4, 0, 0, 2, 1], [-3, 1, -3, 3, 5, 3], [0, 4, 0, 3, 5, 3]]);
        const opts = fD === 1 ? [1, 1.5, 2, 2.5, 3, 4] : fN === 1 ? [1, 2, 3, 4, 5, 6] : [1.5, 3, 4.5, 6];
        const q1 = G.pick(opts), q2 = -(q1 * fN) / fD;
        return task("feldlabor", "Feldlabor",
          "$q_1 = " + G.tex(q1) + "\\,\\text{nC}$ sitzt bei $(" + G.tex(x1) + " \\mid 0)$, $q_2$ bei $(" + G.tex(x2) + " \\mid 0)$. Stelle $q_2$ so ein, dass das **Potenzial** im Punkt $P(" + G.tex(px) + " \\mid " + G.tex(py) + ")$ null ist. $q_1$ bleibt.",
          { charges: [{ x: x1, y: 0, q: q1 }, { x: x2, y: 0, q: q1 }], probe: [px, py] },
          goal([{ when: "abs(q1 - " + cn(q1) + ") < 1e-9", show: "$q_1 = " + G.tex(q1) + "\\,\\text{nC}$" }, { when: "abs(px - " + cn(px) + ") < 1e-9 && abs(py - " + cn(py) + ") < 1e-9", show: "P bleibt bei $(" + G.tex(px) + " \\mid " + G.tex(py) + ")$" }, { when: "abs(phi) < 0.001", show: "$\\varphi(P) = 0$" }],
            { charges: [{ q: q1, x: x1, y: 0 }, { q: q2, x: x2, y: 0 }], probe: [px, py] }),
          "Potenziale addieren sich ohne Richtung: $\\varphi = k\\left(\\frac{q_1}{r_1} + \\frac{q_2}{r_2}\\right)$. Miss $r_1$ und $r_2$ und rechne $q_2 = -q_1 \\frac{r_2}{r_1}$.",
          "$r_2 / r_1 = " + fN + "/" + fD + "$, also $q_2 = -" + G.tex(q1) + " \\cdot \\frac{" + fN + "}{" + fD + "} = " + G.tex(q2) + "\\,\\text{nC}$. Anders als die Feldstärke ist das Potenzial ein Skalar: Es genügt, dass sich die Beträge aufheben.");
      }
      if (level === 3) {
        const up = G.chance(0.5), [ax, ay] = G.pick([[2, 2], [3, 1], [1, 2], [2, 3]]), q = G.pick([1, 2, 3]);
        const c1 = up ? { x: -ax, y: -ay } : { x: -ax, y: ay }, sol = up ? { x: ax, y: -ay } : { x: -ax, y: -ay }, start = up ? { x: ax, y: ay } : { x: ax, y: ay };
        return task("feldlabor", "Feldlabor",
          "Zwei gleiche Ladungen $q = " + q + "\\,\\text{nC}$. $q_1$ bleibt bei $(" + G.tex(c1.x) + " \\mid " + G.tex(c1.y) + ")$. Ziehe $q_2$ so, dass das Feld im Ursprung P genau **" + (up ? "nach oben" : "nach rechts") + "** zeigt.",
          { charges: [{ x: c1.x, y: c1.y, q }, { x: start.x, y: start.y, q }], probe: [0, 0] },
          goal([{ when: "x1 == " + cn(c1.x) + " && y1 == " + cn(c1.y) + " && q1 == " + q + " && q2 == " + q, show: "$q_1$ an seinem Platz, beide Ladungen " + q + " nC" }, { when: "px == 0 && py == 0", show: "P im Ursprung" },
            up ? { when: "abs(Ex) < 0.01 && Ey > 1", show: "$\\vec E$ zeigt genau nach oben" } : { when: "abs(Ey) < 0.01 && Ex > 1", show: "$\\vec E$ zeigt genau nach rechts" }],
            { charges: [{ x: c1.x, y: c1.y, q }, { x: sol.x, y: sol.y, q }], probe: [0, 0] }),
          "Das Feld einer positiven Ladung zeigt von ihr weg. Damit sich die " + (up ? "waagerechten" : "senkrechten") + " Anteile aufheben, muss $q_2$ spiegelbildlich zu $q_1$ liegen.",
          "Mit $q_2$ bei $(" + G.tex(sol.x) + " \\mid " + G.tex(sol.y) + ")$ heben sich die " + (up ? "x" : "y") + "-Komponenten auf, die anderen addieren sich: Superposition komponentenweise.");
      }
      const d = G.pick([2, 3]), q = G.pick([1, 2, 3]), [sx, sy] = G.pick([[1, 2], [-1, 2], [1, -2], [2, 3]]);
      return task("feldlabor", "Feldlabor",
        "Ein Dipol: $+" + q + "\\,\\text{nC}$ bei $(" + (-d) + " \\mid 0)$, $-" + q + "\\,\\text{nC}$ bei $(" + d + " \\mid 0)$. Ziehe P an einen Punkt **abseits der Verbindungslinie**, an dem das Potenzial null ist und das Feld parallel zur Verbindungslinie zeigt.",
        { charges: [{ x: -d, y: 0, q }, { x: d, y: 0, q: -q }], probe: [sx, sy], edit: false },
        goal([{ when: "abs(phi) < 0.001", show: "$\\varphi(P) = 0$" }, { when: "abs(Ey) < 0.01", show: "$\\vec E$ parallel zur Verbindungslinie" }, { when: "abs(py) >= 1", show: "mindestens 1 cm neben der Linie" }], { probe: [0, 2] }),
        "Wo sind die Abstände zu beiden Ladungen gleich?",
        "Auf der Mittelsenkrechten ist $r_1 = r_2$, also $\\varphi = k\\frac{q}{r} - k\\frac{q}{r} = 0$: Sie ist eine Äquipotenziallinie. Das Feld steht senkrecht auf ihr und zeigt von $+$ nach $-$.");
    },
  });

  // ---------------------------------------------------------------- circuits
  gen("lab-schaltung", {
    title: "Schaltungen dimensionieren",
    make(level, G) {
      if (level === 1) {
        const [R1, U1, R2] = G.pick([[100, 4, 200], [200, 8, 100], [300, 9, 100], [100, 3, 300], [150, 6, 150], [200, 3, 600]]);
        return task("schaltung", "Schaltungslabor",
          "Reihenschaltung an $U_0 = 12\\,\\text{V}$, $R_1 = " + R1 + "\\,\\Omega$. Stelle $R_2$ so ein, dass an $R_1$ genau $" + U1 + "\\,\\text{V}$ abfallen.",
          { topo: "reihe", R: [R1, 1000], U0: 12, edit: ["R2"] },
          goal([{ when: "abs(U1 - " + U1 + ") < 1e-6", show: "$U_1 = " + U1 + "\\,\\text{V}$" }], { R: [R1, R2] }),
          "In der Reihe teilen sich die Spannungen im Verhältnis der Widerstände: $\\frac{U_1}{U_0} = \\frac{R_1}{R_1 + R_2}$.",
          "$I = \\frac{" + U1 + "\\,\\text{V}}{" + R1 + "\\,\\Omega}$, also $R_1 + R_2 = \\frac{12\\,\\text{V}}{I} = " + (R1 + R2) + "\\,\\Omega$ und $R_2 = " + R2 + "\\,\\Omega$.");
      }
      if (level === 2) {
        const [U0, U2, Rg] = G.pick([[12, 3, 400], [9, 6, 300], [10, 4, 500], [12, 8, 600], [6, 1.5, 800]]);
        const R2 = (Rg * U2) / U0, R1 = Rg - R2;
        return task("schaltung", "Schaltungslabor",
          "Baue einen **Spannungsteiler**: Aus $U_0 = " + G.tex(U0) + "\\,\\text{V}$ sollen an $R_2$ genau $" + G.tex(U2) + "\\,\\text{V}$ werden, bei einem Gesamtwiderstand von $" + Rg + "\\,\\Omega$.",
          { topo: "teiler", R: [100, 100], U0, edit: ["R1", "R2"] },
          goal([{ when: "abs(U2 - " + cn(U2) + ") < 1e-6", show: "$U_2 = " + G.tex(U2) + "\\,\\text{V}$" }, { when: "abs(Rg - " + Rg + ") < 1e-6", show: "$R_\\text{ges} = " + Rg + "\\,\\Omega$" }], { R: [R1, R2] }),
          "$\\frac{U_2}{U_0} = \\frac{R_2}{R_1 + R_2}$ und $R_1 + R_2 = " + Rg + "\\,\\Omega$.",
          "$R_2 = " + Rg + "\\,\\Omega \\cdot \\frac{" + G.tex(U2) + "}{" + G.tex(U0) + "} = " + R2 + "\\,\\Omega$, $R_1 = " + R1 + "\\,\\Omega$.");
      }
      if (level === 3) {
        const [U0, R1, I, R2] = G.pick([[12, 300, 60, 600], [12, 200, 80, 600], [6, 100, 90, 200], [9, 300, 75, 200], [10, 500, 70, 200]]);
        return task("schaltung", "Schaltungslabor",
          "Parallelschaltung an $U_0 = " + U0 + "\\,\\text{V}$ mit $R_1 = " + R1 + "\\,\\Omega$. Stelle $R_2$ so ein, dass der **Gesamtstrom** $" + I + "\\,\\text{mA}$ beträgt.",
          { topo: "parallel", R: [R1, 1000], U0, edit: ["R2"] },
          goal([{ when: "abs(I - " + cn(I / 1000) + ") < 1e-9", show: "$I = " + I + "\\,\\text{mA}$" }], { R: [R1, R2] }),
          "Parallel liegt an jedem Zweig die volle Spannung, die Ströme addieren sich.",
          "$I_1 = \\frac{" + U0 + "\\,\\text{V}}{" + R1 + "\\,\\Omega} = " + G.tex((U0 / R1) * 1000) + "\\,\\text{mA}$, also muss durch $R_2$ der Rest fließen: $R_2 = \\frac{" + U0 + "\\,\\text{V}}{" + G.tex(I - (U0 / R1) * 1000) + "\\,\\text{mA}} = " + R2 + "\\,\\Omega$.");
      }
      const [U0, R1, R2, Up] = G.pick([[12, 100, 200, 6], [12, 200, 300, 4], [9, 100, 300, 3], [10, 300, 600, 4], [12, 300, 400, 4]]);
      const Rp = (R1 * Up) / (U0 - Up), R3 = Math.round((R2 * Rp) / (R2 - Rp));
      return task("schaltung", "Schaltungslabor",
        "$R_1 = " + R1 + "\\,\\Omega$ liegt in Reihe zu $R_2 = " + R2 + "\\,\\Omega \\parallel R_3$, $U_0 = " + U0 + "\\,\\text{V}$. Stelle $R_3$ so ein, dass an $R_2$ genau $" + Up + "\\,\\text{V}$ liegen.",
        { topo: "gemischt", R: [R1, R2, 1000], U0, edit: ["R3"] },
        goal([{ when: "abs(U2 - " + Up + ") < 1e-6", show: "$U_2 = " + Up + "\\,\\text{V}$" }], { R: [R1, R2, R3] }),
        "An $R_1$ fällt dann der Rest $U_0 - U_2$ ab. Daraus folgt der Strom und damit der Ersatzwiderstand der Parallelschaltung.",
        "$I = \\frac{" + (U0 - Up) + "\\,\\text{V}}{" + R1 + "\\,\\Omega}$, $R_p = \\frac{" + Up + "\\,\\text{V}}{I} = " + G.tex(Rp) + "\\,\\Omega$, und aus $\\frac{1}{R_p} = \\frac{1}{R_2} + \\frac{1}{R_3}$ folgt $R_3 = " + R3 + "\\,\\Omega$.");
    },
  });

  // ---------------------------------------------------------------- electrons in the fine beam tube
  gen("lab-teilchen", {
    title: "Elektronen auf Kreisbahnen",
    make(level, G) {
      const X = LW.experiments.fadenstrahlrohr;
      const rad = (U, I) => X.radius({ U, I }) * 100;
      const grid = [];
      for (let U = 150; U <= 300; U += 10) for (let k = 0; k <= 30; k++) grid.push([U, +(1 + k * 0.05).toFixed(2)]);
      if (level === 1) {
        const Rt = G.pick([3, 3.5, 4, 4.5, 5]);
        const good = grid.filter(([U, I]) => Math.abs(rad(U, I) - Rt) < 0.05);
        const [Us, Is] = G.pick(good);
        const start = [[150, 2.5], [300, 2.5]].find(([U, I]) => Math.abs(rad(U, I) - Rt) > 0.5);
        return task("versuch", "Teilchenbahnlabor",
          "Stelle Beschleunigungsspannung und Spulenstrom so ein, dass die Elektronen eine Kreisbahn mit **Radius " + G.fmt(Rt) + " cm** fliegen (±0,1 cm).",
          { exp: "fadenstrahlrohr", U: start[0], I: start[1] },
          goal([{ when: "abs(r - " + Rt + ") <= 0.1", show: "$r = " + G.tex(Rt) + "\\,\\text{cm}$" }], { set: { U: Us, I: Is } }),
          "$r = \\frac{1}{B}\\sqrt{\\frac{2mU}{e}}$: Mehr Spannung macht die Bahn größer, mehr Strom (stärkeres Feld) kleiner.",
          "Zum Beispiel $U = " + Us + "\\,\\text{V}$ und $I = " + G.tex(Is) + "\\,\\text{A}$. Lorentzkraft gleich Zentripetalkraft: $evB = \\frac{mv^2}{r}$, also $r = \\frac{mv}{eB}$.");
      }
      if (level === 2) {
        const [U0, I0] = G.pick([[150, 1], [200, 1.2], [180, 1.1], [160, 1.05]]), r0 = rad(U0, I0);
        return task("versuch", "Teilchenbahnlabor",
          "Die Elektronen fliegen bei $U = " + U0 + "\\,\\text{V}$ und $I = " + G.tex(I0) + "\\,\\text{A}$ auf einem Kreis mit $r = " + G.tex(r0, 2) + "\\,\\text{cm}$. **Halbiere den Radius**, ohne die Spannung zu ändern.",
          { exp: "fadenstrahlrohr", U: U0, I: I0 },
          goal([{ when: "abs(U - " + U0 + ") < 1e-9", show: "$U = " + U0 + "\\,\\text{V}$" }, { when: "abs(r - " + cn(r0 / 2) + ") < 0.02", show: "$r = " + G.tex(r0 / 2, 2) + "\\,\\text{cm}$" }], { set: { U: U0, I: 2 * I0 } }),
          "Bei fester Spannung ist $v$ fest, und $r = \\frac{mv}{eB}$ ist umgekehrt proportional zu $B$, also zum Spulenstrom.",
          "Doppelter Strom, doppeltes Feld, halber Radius: $I = " + G.tex(2 * I0) + "\\,\\text{A}$.");
      }
      if (level === 3) {
        return task("versuch", "Teilchenbahnlabor",
          "Bestimme die **spezifische Ladung** $\\frac{e}{m}$ des Elektrons: Nimm mindestens fünf Messwerte bei verschiedenen Einstellungen auf. Die Auswertung soll weniger als 5 % vom Literaturwert abweichen.",
          { exp: "fadenstrahlrohr" },
          goal([{ when: "n >= 5", show: "mindestens fünf Messwerte" }, { when: "err < 0.05", show: "Abweichung unter 5 %" }], {}),
          "Trage $2U$ gegen $B^2r^2$ auf: eine Ursprungsgerade mit der Steigung $\\frac{e}{m}$. Verschiedene Spannungen und Ströme machen die Gerade sicher.",
          "Aus $eU = \\frac12 mv^2$ und $evB = \\frac{mv^2}{r}$ folgt $\\frac{e}{m} = \\frac{2U}{B^2r^2} \\approx 1{,}76 \\cdot 10^{11}\\,\\frac{\\text{C}}{\\text{kg}}$.");
      }
      const [vMin, rMax] = G.pick([[9, 4], [8, 3.5], [9.5, 4.5], [8.5, 3.5]]);
      const good = grid.filter(([U, I]) => Math.sqrt((2 * 1.602176634e-19 * U) / 9.1093837e-31) / 1e6 >= vMin && rad(U, I) <= rMax);
      const [Us, Is] = good[0];
      return task("versuch", "Teilchenbahnlabor",
        "Die Elektronen sollen mindestens $" + G.tex(vMin) + " \\cdot 10^6\\,\\frac{\\text{m}}{\\text{s}}$ schnell sein und trotzdem auf einer Bahn mit höchstens $" + G.tex(rMax) + "\\,\\text{cm}$ Radius bleiben.",
        { exp: "fadenstrahlrohr", U: 150, I: 1.5 },
        goal([{ when: "v >= " + vMin, show: "$v \\ge " + G.tex(vMin) + " \\cdot 10^6\\,\\frac{\\text{m}}{\\text{s}}$" }, { when: "r <= " + rMax, show: "$r \\le " + G.tex(rMax) + "\\,\\text{cm}$" }], { set: { U: Us, I: Is } }),
        "Erst die Spannung: $v = \\sqrt{\\frac{2eU}{m}}$. Dann das Feld so stark, dass der Kreis klein genug wird.",
        "Zum Beispiel $U = " + Us + "\\,\\text{V}$ (dann $v = " + G.tex(Math.sqrt((2 * 1.602176634e-19 * Us) / 9.1093837e-31) / 1e6, 2) + " \\cdot 10^6\\,\\frac{\\text{m}}{\\text{s}}$) und $I = " + G.tex(Is) + "\\,\\text{A}$.");
    },
  });

  // ---------------------------------------------------------------- waves: grating and electron diffraction
  gen("lab-wellen", {
    title: "Beugung am Gitter",
    make(level, G) {
      const X = LW.experiments.gitter;
      const a1 = (e, lines, lam) => X.a1({ e, lines, lam }) * 100;
      const es = []; for (let k = 0; k <= 20; k++) es.push(+(1 + k * 0.1).toFixed(1));
      if (level === 1 || level === 3) {
        const lines = level === 1 ? 300 : G.pick([500, 600]), lam = G.pick(level === 1 ? [632.8, 532, 650] : [532, 632.8, 405, 650]);
        const es2 = es.filter((e) => e >= 1.3 && e <= 2.7), eS = G.pick(es2), A = Math.round(a1(eS, lines, lam));
        const start = eS > 2 ? 1 : 3;
        const color = { 632.8: "roter Helium-Neon-Laser", 532: "grüner Laser", 650: "roter Diodenlaser", 405: "violetter Laser" }[lam];
        return task("versuch", "Wellenlabor",
          "Ein " + color + " ($\\lambda = " + G.tex(lam) + "\\,\\text{nm}$) fällt auf ein Gitter mit " + lines + " Linien pro mm. Stelle den Abstand zum Schirm so ein, dass das **Maximum 1. Ordnung " + A + " cm** neben der Mitte liegt (±1 cm).",
          { exp: "gitter", lines, lambda: lam, e: start },
          goal([{ when: "abs(a1 - " + A + ") <= 1", show: "$a_1 = " + A + "\\,\\text{cm}$" }], { set: { e: eS } }),
          "$\\sin\\alpha_1 = \\frac{\\lambda}{g}$ mit $g = \\frac{1}{" + lines + "}\\,\\text{mm}$, dann $a_1 = e \\tan\\alpha_1$.",
          "$\\sin\\alpha_1 = " + G.tex((lam * 1e-9 * lines * 1e3), 4) + "$, $\\alpha_1 = " + G.tex((Math.asin(lam * 1e-9 * lines * 1e3) * 180) / Math.PI, 1) + "°$, also $e = \\frac{a_1}{\\tan\\alpha_1} \\approx " + G.tex(eS) + "\\,\\text{m}$.");
      }
      if (level === 2) {
        return task("versuch", "Wellenlabor",
          "Welche Wellenlänge hat dieser Laser? Miss den Abstand $a_1$ bei mindestens vier Schirmabständen und werte aus; das Ergebnis soll weniger als 2 % vom wahren Wert abweichen.",
          { exp: "gitter" },
          goal([{ when: "n >= 4", show: "mindestens vier Messwerte" }, { when: "err < 0.02", show: "Abweichung unter 2 %" }], {}),
          "$a_1$ wächst proportional zu $e$; die Steigung ist $\\tan\\alpha_1$.",
          "Aus der Steigung folgt $\\alpha_1$ und mit $g\\sin\\alpha_1 = \\lambda$ die Wellenlänge. Die Kleinwinkelnäherung wäre hier schon ungenau.");
      }
      const D = LW.experiments.elektronenbeugung, L = G.pick([18, 19, 20, 21, 22, 24, 25]);
      const Us = []; for (let k = 0; k <= 30; k++) Us.push(+(2 + k * 0.1).toFixed(1));
      const Umin = Us.find((U) => D.lambda(U) * 1e12 <= L);
      return task("versuch", "Wellenlabor",
        "Elektronen als Wellen: Stelle die Beschleunigungsspannung so ein, dass ihre **De-Broglie-Wellenlänge höchstens " + L + " pm** beträgt, und zwar mit der kleinsten möglichen Spannung (Raster 0,1 kV).",
        { exp: "elektronenbeugung", U: 2 },
        goal([{ when: "lam <= " + L, show: "$\\lambda \\le " + L + "\\,\\text{pm}$" }, { when: "abs(U - " + Umin + ") < 1e-9", show: "kleinste solche Spannung" }], { set: { U: Umin } }),
        "$\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2meU}}$: Je höher die Spannung, desto kürzer die Wellenlänge und desto enger die Ringe.",
        "$U = \\frac{h^2}{2me\\lambda^2} \\approx " + G.tex((6.62607015e-34 ** 2) / (2 * 9.1093837e-31 * 1.602176634e-19 * (L * 1e-12) ** 2) / 1000, 2) + "\\,\\text{kV}$, auf dem Raster also $" + G.tex(Umin) + "\\,\\text{kV}$.");
    },
  });

  // ---------------------------------------------------------------- oscillations: spring pendulum
  gen("lab-schwingung", {
    title: "Federpendel",
    make(level, G) {
      const X = LW.experiments.federpendel, T = (m) => X.T({ m }), ms = [];
      for (let m = 50; m <= 300; m += 10) ms.push(m);
      if (level === 1) {
        const mS = G.pick(ms.filter((m) => m >= 80 && m <= 270)), Tt = Math.round(T(mS) * 100) / 100;
        const sol = ms.find((m) => Math.abs(T(m) - Tt) <= 0.01);
        return task("versuch", "Schwingungslabor",
          "Wähle die Masse so, dass das Pendel mit einer **Periodendauer von " + G.fmt(Tt, 2) + " s** schwingt (±0,01 s). Die Federkonstante ist " + X.D + " N/m.",
          { exp: "federpendel", m: mS > 180 ? 50 : 300 },
          goal([{ when: "abs(T - " + Tt + ") <= 0.01", show: "$T = " + G.tex(Tt, 2) + "\\,\\text{s}$" }], { set: { m: sol } }),
          "$T = 2\\pi\\sqrt{\\frac{m}{D}}$, also $m = D\\left(\\frac{T}{2\\pi}\\right)^2$.",
          "$m = " + X.D + "\\,\\frac{\\text{N}}{\\text{m}} \\cdot \\left(\\frac{" + G.tex(Tt, 2) + "\\,\\text{s}}{2\\pi}\\right)^2 \\approx " + G.tex(X.D * (Tt / (2 * Math.PI)) ** 2 * 1000, 0) + "\\,\\text{g}$.");
      }
      if (level === 2) {
        const m0 = G.pick([50, 60, 70]);
        return task("versuch", "Schwingungslabor",
          "Mit $" + m0 + "\\,\\text{g}$ schwingt das Pendel mit $T = " + G.tex(T(m0), 3) + "\\,\\text{s}$. Wähle die Masse so, dass sich die **Periodendauer verdoppelt**.",
          { exp: "federpendel", m: m0 },
          goal([{ when: "abs(T - " + cn(2 * T(m0)) + ") < 1e-6", show: "$T = " + G.tex(2 * T(m0), 3) + "\\,\\text{s}$" }], { set: { m: 4 * m0 } }),
          "$T$ wächst mit der Wurzel der Masse.",
          "Doppelte Periodendauer verlangt die vierfache Masse: $" + 4 * m0 + "\\,\\text{g}$.");
      }
      if (level === 3) {
        return task("versuch", "Schwingungslabor",
          "Bestimme die **Federkonstante** aus mindestens fünf Messungen mit verschiedenen Massen; die Auswertung soll weniger als 3 % von der Herstellerangabe abweichen.",
          { exp: "federpendel" },
          goal([{ when: "n >= 5", show: "mindestens fünf Messwerte" }, { when: "err < 0.03", show: "Abweichung unter 3 %" }], {}),
          "Trage $T^2$ gegen $m$ auf; die Steigung ist $\\frac{4\\pi^2}{D}$. Stoppe zehn Schwingungen, nicht eine.",
          "Aus $T^2 = \\frac{4\\pi^2}{D}\\,m$ folgt $D = \\frac{4\\pi^2}{\\text{Steigung}}$, hier etwa " + X.D + " N/m.");
      }
      const F = G.pick([2.2, 2, 1.8, 1.6]), mmin = ms.find((m) => 1 / T(m) <= F);
      return task("versuch", "Schwingungslabor",
        "Das Pendel soll mit **höchstens " + G.fmt(F) + " Hz** schwingen, und zwar mit der kleinsten Masse, die das schafft (Raster 10 g).",
        { exp: "federpendel", m: 50 },
        goal([{ when: "f <= " + F, show: "$f \\le " + G.tex(F) + "\\,\\text{Hz}$" }, { when: "m == " + mmin, show: "kleinste solche Masse" }], { set: { m: mmin } }),
        "$f = \\frac{1}{T} = \\frac{1}{2\\pi}\\sqrt{\\frac{D}{m}}$: Mehr Masse, tiefere Frequenz.",
        "$m \\ge \\frac{D}{4\\pi^2 f^2} = " + G.tex((X.D / (4 * Math.PI * Math.PI * F * F)) * 1000, 1) + "\\,\\text{g}$, auf dem Raster $" + mmin + "\\,\\text{g}$.");
    },
  });

  // ---------------------------------------------------------------- titration
  gen("lab-titration", {
    title: "Titrieren",
    make(level, G) {
      const X = LW.experiments.titration;
      if (level === 1) {
        const ca = G.pick([0.08, 0.1, 0.12]), Veq = (ca * 20) / 0.1;
        return task("versuch", "Titrationslabor",
          "20 mL Salzsäure mit $c = " + G.tex(ca) + "\\,\\frac{\\text{mol}}{\\text{L}}$ werden mit Natronlauge ($0{,}1\\,\\frac{\\text{mol}}{\\text{L}}$) titriert. Gib so viel Lauge zu, dass **Phenolphthalein umschlägt** (pH ab 8,2), aber höchstens 0,3 mL mehr als bis zum Äquivalenzpunkt.",
          { exp: "titration", acid: "salzsaeure", ca, V: 0 },
          goal([{ when: "pH >= 8.2", show: "pH mindestens 8,2" }, { when: "V <= " + cn(Veq + 0.3), show: "höchstens 0,3 mL über dem Äquivalenzpunkt" }], { set: { V: +(Veq + 0.1).toFixed(1) } }),
          "Der Äquivalenzpunkt liegt bei $V = \\frac{c_S V_S}{c_B}$. Danach springt der pH-Wert.",
          "$V_\\text{Äq} = \\frac{" + G.tex(ca) + " \\cdot 20\\,\\text{mL}}{0{,}1} = " + G.tex(Veq) + "\\,\\text{mL}$. Schon 0,1 mL mehr heben den pH auf über 10: Der Sprung ist steil.");
      }
      if (level === 2) {
        const ca = G.pick([0.08, 0.1, 0.12]), Vh = (ca * 20) / 0.1 / 2;
        return task("versuch", "Titrationslabor",
          "Essigsäure ($c = " + G.tex(ca) + "\\,\\frac{\\text{mol}}{\\text{L}}$, 20 mL) wird mit Natronlauge titriert. Stelle das Volumen so ein, dass der pH-Wert dem **pKS-Wert 4,76** entspricht (±0,05).",
          { exp: "titration", acid: "essigsaeure", ca, V: 0 },
          goal([{ when: "abs(pH - 4.76) <= 0.05", show: "pH = pKS = 4,76" }], { set: { V: Vh } }),
          "Henderson-Hasselbalch: $\\text{pH} = \\text{pK}_S + \\lg\\frac{c(\\text{A}^-)}{c(\\text{HA})}$.",
          "Am **Halbäquivalenzpunkt** ($" + G.tex(Vh) + "\\,\\text{mL}$) ist die Hälfte der Säure neutralisiert, $c(\\text{A}^-) = c(\\text{HA})$, also pH = pKS. So misst man pKS-Werte.");
      }
      const weak = level === 4;
      return task("versuch", "Titrationslabor",
        "Bestimme die Konzentration der " + (weak ? "**Essigsäure**" : "**Salzsäure**") + ": Nimm eine Titrationskurve mit mindestens zehn Messwerten auf, in der Nähe des Sprungs in kleinen Schritten. Die Auswertung soll weniger als 3 % abweichen.",
        { exp: "titration", acid: weak ? "essigsaeure" : "salzsaeure" },
        goal([{ when: "n >= 10", show: "mindestens zehn Messwerte" }, { when: "err < 0.03", show: "Abweichung unter 3 %" }], {}),
        "Der Äquivalenzpunkt ist die steilste Stelle der Kurve. Erst grob den Sprung suchen, dann dort in 0,5-mL-Schritten messen.",
        "$c_S = \\frac{c_B \\cdot V_\\text{Äq}}{V_S}$." + (weak ? " Bei der Essigsäure liegt der Äquivalenzpunkt im Basischen, weil Acetat eine schwache Base ist." : ""));
    },
  });

  // ---------------------------------------------------------------- chemical equilibrium
  gen("lab-gleichgewicht", {
    title: "Gleichgewichte verschieben",
    make(level, G) {
      const C = LW.labChem2, R = C.REACTIONS;
      const Kof = (Rx, T) => (Rx.dH ? Rx.K * Math.exp(((-Rx.dH * 1000) / 8.314) * (1 / T - 1 / Rx.T0)) : Rx.K);
      const yieldOf = (Rx, c0, K) => { const e = C.equilibrium(Rx, c0, K), lim = Math.min(...[0, 1].filter((i) => Rx.nu[i]).map((i) => c0[i] / Rx.nu[i])); return (e.c[2] - c0[2]) / (Rx.nu[2] * lim); };
      if (level === 1) {
        const Y = G.pick([0.8, 0.85, 0.9]);
        let bmin = null;
        for (let k = 10; k <= 50 && bmin == null; k++) if (yieldOf(R.ester, [1, k / 10, 0, 0], 4) >= Y - 1e-12) bmin = k / 10;
        return task("gleichgewicht", "Gleichgewichtslabor",
          "Veresterung mit $K = 4$: Mit je 1 mol/L Säure und Alkohol entstehen nur zwei Drittel des möglichen Esters. Setze **mehr Alkohol** ein, bis die Ausbeute mindestens " + Math.round(Y * 100) + " % beträgt, aber nicht mehr als nötig.",
          { reaction: "ester", c0: [1, 1, 0, 0], edit: ["b0"] },
          goal([{ when: "yield >= " + cn(Y - 1e-9), show: "Ausbeute mindestens " + Math.round(Y * 100) + " %" }, { when: "abs(b0 - " + bmin + ") < 1e-9", show: "so wenig Alkohol wie möglich" }], { b0: bmin }),
          "Le Chatelier: Ein Überschuss eines Edukts verschiebt das Gleichgewicht zu den Produkten.",
          "Mit $c_0(\\text{Alkohol}) = " + G.tex(bmin) + "\\,\\frac{\\text{mol}}{\\text{L}}$ erreicht die Ausbeute " + Math.round(yieldOf(R.ester, [1, bmin, 0, 0], 4) * 1000) / 10 + " %. Das Massenwirkungsgesetz bleibt dabei erfüllt: $K$ ändert sich nicht, nur die Lage.");
      }
      if (level === 2) {
        if (G.chance(0.5)) {
          return task("gleichgewicht", "Gleichgewichtslabor",
            "Veresterung mit $K = 4$, je 1 mol/L Säure und Alkohol. Gib von Anfang an so viel **Ester und Wasser** dazu, dass das Gemisch **schon im Gleichgewicht** ist und nichts mehr reagiert.",
            { reaction: "ester", c0: [1, 1, 0, 0], edit: ["c0", "d0"] },
            goal([{ when: "abs(Q0 - K) < 1e-6", show: "$Q = K$: keine Reaktion" }], { c0: 2, d0: 2 }),
            "Im Gleichgewicht ist der Reaktionsquotient $Q = \\frac{c(\\text{Ester}) \\cdot c(\\text{Wasser})}{c(\\text{Säure}) \\cdot c(\\text{Alkohol})}$ gleich $K$.",
            "Zum Beispiel je 2 mol/L Ester und Wasser: $Q = \\frac{2 \\cdot 2}{1 \\cdot 1} = 4 = K$. Auch 1 und 4 oder 0,8 und 5 passen.");
        }
        return task("gleichgewicht", "Gleichgewichtslabor",
          "$\\mathrm{H_2 + I_2 \\rightleftharpoons 2\\,HI}$ mit $K = 50$. Wähle die Anfangskonzentrationen so, dass das Gemisch **schon im Gleichgewicht** ist.",
          { reaction: "hi", c0: [1, 1, 0, 0], edit: ["a0", "b0", "c0"] },
          goal([{ when: "a0 > 0 && b0 > 0 && abs(Q0 - K) < 1e-6 * K", show: "$Q = \\frac{c(\\text{HI})^2}{c(\\text{H}_2)\\, c(\\text{I}_2)} = 50$" }], { a0: 0.1, b0: 0.2, c0: 1 }),
          "$Q = \\frac{c(\\text{HI})^2}{c(\\text{H}_2) \\cdot c(\\text{I}_2)}$ muss genau 50 werden.",
          "Zum Beispiel $c(\\text{H}_2) = 0{,}1$, $c(\\text{I}_2) = 0{,}2$ und $c(\\text{HI}) = 1$: $\\frac{1^2}{0{,}02} = 50$.");
      }
      if (level === 3) {
        const Ts = []; for (let T = 225; T <= 520; T += 5) Ts.push(T);
        if (G.chance(0.5)) {
          const F = G.pick([5, 10, 20]), Tmin = Ts.find((T) => Kof(R.no2, T) >= F * R.no2.K);
          return task("gleichgewicht", "Gleichgewichtslabor",
            "$\\mathrm{N_2O_4 \\rightleftharpoons 2\\,NO_2}$ ist **endotherm** ($\\Delta H = +57\\,\\frac{\\text{kJ}}{\\text{mol}}$). Bei 373 K ist $K = 0{,}36$. Stelle die Temperatur so ein, dass $K$ mindestens " + F + "-mal so groß ist.",
            { reaction: "no2", c0: [1, 0, 0, 0], T: 373, edit: ["T"] },
            goal([{ when: "K >= " + cn(F * R.no2.K - 1e-9), show: "$K \\ge " + G.tex(F * R.no2.K, 2) + "$" }], { T: Tmin }),
            "Bei einer endothermen Reaktion wächst $K$ mit der Temperatur (van 't Hoff).",
            "Ab etwa $" + Tmin + "\\,\\text{K}$: $\\ln\\frac{K_2}{K_1} = -\\frac{\\Delta H}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)$.");
        }
        const Tmin = Ts.find((T) => yieldOf(R.no2, [1, 0, 0, 0], Kof(R.no2, T)) >= 0.5);
        return task("gleichgewicht", "Gleichgewichtslabor",
          "$\\mathrm{N_2O_4 \\rightleftharpoons 2\\,NO_2}$ ist endotherm. Start mit 1 mol/L N₂O₄: Bei welcher Temperatur zerfällt **mindestens die Hälfte**?",
          { reaction: "no2", c0: [1, 0, 0, 0], T: 373, edit: ["T"] },
          goal([{ when: "yield >= 0.5", show: "mindestens 50 % zerfallen" }], { T: Tmin }),
          "Wärme zuführen verschiebt ein endothermes Gleichgewicht zu den Produkten.",
          "Ab etwa $" + Tmin + "\\,\\text{K}$ ist $K \\ge 2$: Mit $x = 0{,}5$ ist $\\frac{(2x)^2}{1 - x} = 2$.");
      }
      const Y = G.pick([0.79, 0.8, 0.81]), Ts = [];
      for (let T = 870; T >= 575; T -= 5) Ts.push(T);
      const Tsol = Ts.find((T) => yieldOf(R.hi, [1, 1, 0, 0], Kof(R.hi, T)) >= Y);
      return task("gleichgewicht", "Gleichgewichtslabor",
        "$\\mathrm{H_2 + I_2 \\rightleftharpoons 2\\,HI}$ ist schwach **exotherm**. Mit je 1 mol/L H₂ und I₂ sollen mindestens " + Math.round(Y * 100) + " % HI entstehen. Wähle die Temperatur.",
        { reaction: "hi", c0: [1, 1, 0, 0], T: 723, edit: ["T"] },
        goal([{ when: "yield >= " + cn(Y), show: "Ausbeute mindestens " + Math.round(Y * 100) + " %" }], { T: Tsol }),
        "Bei einer exothermen Reaktion wird $K$ beim Abkühlen größer.",
        "Bei höchstens etwa $" + Tsol + "\\,\\text{K}$ reicht $K$. Kälter heißt aber auch langsamer: In der Praxis sucht man einen Kompromiss, wie beim Haber-Bosch-Verfahren.");
    },
  });

  // ---------------------------------------------------------------- galvanic cells
  const MET = ["Mg", "Zn", "Fe", "Pb", "H2", "Cu", "Ag"], METNAME = ["Magnesium", "Zink", "Eisen", "Blei", "Wasserstoff", "Kupfer", "Silber"];
  gen("lab-galvani", {
    title: "Galvanische Zellen",
    make(level, G) {
      if (level === 1) {
        const U = G.pick([1.5, 2, 2.5, 3]);
        return task("galvani", "Elektrochemielabor",
          "Baue aus zwei Halbzellen (je 1 mol/L) ein galvanisches Element mit **mindestens " + G.fmt(U) + " V**.",
          { left: "Fe", right: "Pb", c: [1, 1], edit: ["left", "right"] },
          goal([{ when: "U >= " + U, show: "$U \\ge " + G.tex(U) + "\\,\\text{V}$" }], { left: "Mg", right: "Ag" }),
          "Die Spannung ist die Differenz der Standardpotenziale. Je weiter die Metalle in der Spannungsreihe auseinanderliegen, desto größer.",
          "Magnesium ($-2{,}37\\,\\text{V}$) gegen Silber ($+0{,}80\\,\\text{V}$) liefert $3{,}17\\,\\text{V}$, die größte Spannung dieser Reihe.");
      }
      if (level === 2) {
        const big = G.chance(0.5);
        return task("galvani", "Elektrochemielabor",
          "Im **Daniell-Element** (Zink links, Kupfer rechts) liefern 1-molare Lösungen 1,10 V. Stelle die Konzentrationen so ein, dass die Spannung " + (big ? "möglichst **groß**" : "möglichst **klein**") + " wird.",
          { left: "Zn", right: "Cu", c: [1, 1], edit: ["c1", "c2"] },
          goal([big ? { when: "U >= 1.18", show: "$U \\ge 1{,}18\\,\\text{V}$" } : { when: "U <= 1.02", show: "$U \\le 1{,}02\\,\\text{V}$" }], { c: big ? [0.001, 1] : [1, 0.001] }),
          "Nernst: $E = E^0 + \\frac{0{,}059\\,\\text{V}}{z}\\lg c$. Die Kathode (Kupfer) soll ein hohes, die Anode (Zink) ein niedriges Potenzial haben, oder umgekehrt.",
          big ? "Verdünnte Zinklösung senkt das Anodenpotenzial, konzentrierte Kupferlösung hebt das Kathodenpotenzial: $1{,}10 + 0{,}0296 \\cdot 3 \\approx 1{,}19\\,\\text{V}$."
            : "Konzentrierte Zinklösung und verdünnte Kupferlösung bringen die Potenziale näher zusammen: $1{,}10 - 0{,}0296 \\cdot 3 \\approx 1{,}01\\,\\text{V}$.");
      }
      if (level === 3) {
        const [met, U, sol] = G.pick([["Cu", 0.0592, [0.01, 1]], ["Cu", 0.0296, [0.1, 1]], ["Ag", 0.0592, [0.1, 1]], ["Ag", 0.1184, [0.01, 1]], ["Zn", 0.0592, [0.001, 0.1]]]);
        return task("galvani", "Elektrochemielabor",
          "Eine **Konzentrationszelle**: zweimal " + METNAME[MET.indexOf(met)] + ". Stelle die Konzentrationen so ein, dass genau $" + G.tex(U * 1000, 1) + "\\,\\text{mV}$ Spannung entstehen.",
          { left: met, right: met, c: [1, 1], edit: ["c1", "c2"] },
          goal([{ when: "abs(U - " + U + ") < 0.001", show: "$U = " + G.tex(U * 1000, 1) + "\\,\\text{mV}$" }], { c: sol }),
          "Beide Halbzellen haben dasselbe $E^0$, es zählt nur das Verhältnis: $U = \\frac{0{,}059\\,\\text{V}}{z}\\lg\\frac{c_2}{c_1}$.",
          "Mit $z = " + (met === "Ag" ? 1 : 2) + "$ braucht man das Verhältnis $" + Math.round(sol[1] / sol[0]) + " : 1$. Die verdünntere Seite ist die Anode: Dort geht Metall in Lösung, bis sich die Konzentrationen angleichen.");
      }
      const [X, U, an] = G.pick([["Fe", 1.5, "Mg"], ["Pb", 0.5, "Zn"], ["H2", 0.7, "Zn"], ["Cu", 1, "Zn"], ["Pb", 2, "Mg"]]);
      return task("galvani", "Elektrochemielabor",
        "Baue ein Element, in dem **" + METNAME[MET.indexOf(X)] + " die Kathode** ist und die Spannung mindestens " + G.fmt(U) + " V beträgt (je 1 mol/L).",
        { left: "Cu", right: "Ag", c: [1, 1], edit: ["left", "right"] },
        goal([{ when: "kat == " + MET.indexOf(X), show: METNAME[MET.indexOf(X)] + " ist die Kathode (Pluspol)" }, { when: "U >= " + U, show: "$U \\ge " + G.tex(U) + "\\,\\text{V}$" }], { left: an, right: X }),
        "Kathode ist die Halbzelle mit dem höheren Potenzial: Dort werden Ionen reduziert. Die Anode muss also ein unedleres Metall sein.",
        "Zum Beispiel " + METNAME[MET.indexOf(an)] + " als Anode: Es gibt Elektronen ab, " + METNAME[MET.indexOf(X)] + " nimmt sie auf.");
    },
  });

  // ---------------------------------------------------------------- balancing equations
  const EQ = {
    1: [[["CH4", "O2"], ["CO2", "H2O"], [1, 2, 1, 2], "Methan verbrennt"], [["H2", "O2"], ["H2O"], [2, 1, 2], "Knallgasreaktion"], [["N2", "H2"], ["NH3"], [1, 3, 2], "Ammoniaksynthese"],
      [["Na", "H2O"], ["NaOH", "H2"], [2, 2, 2, 1], "Natrium in Wasser"], [["Mg", "O2"], ["MgO"], [2, 1, 2], "Magnesium verbrennt"]],
    2: [[["C3H8", "O2"], ["CO2", "H2O"], [1, 5, 3, 4], "Propan verbrennt"], [["C2H5OH", "O2"], ["CO2", "H2O"], [1, 3, 2, 3], "Ethanol verbrennt"], [["Fe", "O2"], ["Fe2O3"], [4, 3, 2], "Eisen rostet"],
      [["Al", "O2"], ["Al2O3"], [4, 3, 2], "Aluminium oxidiert"], [["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"], [1, 2, 1, 1, 1], "Kalk und Salzsäure"]],
    3: [[["C6H12O6", "O2"], ["CO2", "H2O"], [1, 6, 6, 6], "Zellatmung"], [["C4H10", "O2"], ["CO2", "H2O"], [2, 13, 8, 10], "Butan verbrennt"], [["Fe2O3", "C"], ["Fe", "CO2"], [2, 3, 4, 3], "Hochofen"],
      [["Al", "HCl"], ["AlCl3", "H2"], [2, 6, 2, 3], "Aluminium in Salzsäure"], [["NH3", "O2"], ["NO", "H2O"], [4, 5, 4, 6], "Ostwald-Verfahren"]],
    4: [[["MnO4^-", "Fe^2+", "H^+"], ["Mn^2+", "Fe^3+", "H2O"], [1, 5, 8, 1, 5, 4], "Permanganat oxidiert Eisen(II)"], [["Cu", "Ag^+"], ["Cu^2+", "Ag"], [1, 2, 1, 2], "Kupfer in Silbernitratlösung"],
      [["Cr2O7^2-", "Fe^2+", "H^+"], ["Cr^3+", "Fe^3+", "H2O"], [1, 6, 14, 2, 6, 7], "Dichromat oxidiert Eisen(II)"], [["Zn", "H^+"], ["Zn^2+", "H2"], [1, 2, 1, 1], "Zink in Säure"],
      [["Cu", "NO3^-", "H^+"], ["Cu^2+", "NO", "H2O"], [3, 2, 8, 3, 2, 4], "Kupfer in Salpetersäure"]],
  };
  const texF = (f) => { const k = f.indexOf("^"), body = k >= 0 ? f.slice(0, k) : f; return "\\mathrm{" + body.replace(/([A-Za-z)])(\d+)/g, "$1_{$2}") + (k >= 0 ? "^{" + f.slice(k + 1) + "}" : "") + "}"; };
  gen("lab-ausgleichen", {
    title: "Reaktionsgleichungen ausgleichen",
    make(level, G) {
      const [left, right, coef, name] = G.pick(EQ[Math.min(4, Math.max(1, level))]);
      const all = left.concat(right), ion = level === 4;
      const eq = coef.map((c, i) => (c === 1 ? "" : c + "\\,") + texF(all[i])).reduce((s, t, i) => s + (i === 0 ? "" : i === left.length ? " \\longrightarrow " : " + ") + t, "");
      return task("ausgleichen", "Gleichungslabor",
        name + ": Gleiche die Reaktionsgleichung aus. Die Koeffizienten sollen die **kleinsten ganzen Zahlen** sein." + (ion ? " Bei Ionengleichungen muss auch die **Ladung** links und rechts gleich sein." : ""),
        { left, right, max: ion ? 16 : 14 },
        goal([{ when: "balanced == 1", show: "jedes Element" + (ion ? " und die Ladung" : "") + " links wie rechts" }, { when: "minimal == 1", show: "kleinste ganze Zahlen" }], { coef }),
        ion ? "Erst die Elektronen: Wie viele gibt das Reduktionsmittel ab, wie viele nimmt das Oxidationsmittel auf? Dann Ladung mit H⁺, zuletzt Sauerstoff mit Wasser." : "Beginne mit dem Element, das nur in je einem Stoff vorkommt; Wasserstoff und Sauerstoff zuletzt. Bei ungeraden Zahlen hilft Verdoppeln.",
        "$" + eq + "$");
    },
  });
})();
