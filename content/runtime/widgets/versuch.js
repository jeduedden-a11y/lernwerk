/* Experiments as in the Abitur: the set-up moves, the learner sets the quantities, takes measurements (with realistic
 * scatter), and evaluates them in a table and a graph with a fitted line, ending in a constant and its deviation.
 *
 *   versuch: params: exp (fadenstrahlrohr, millikan, photoeffekt, franckhertz, elektronenbeugung, gitter, federpendel,
 *                    entladung, titration), plus per experiment: acid ("salzsaeure" | "essigsaeure"), lines (grating)
 *            scope:  n (measurements), value (result), err (relative deviation from the literature value), and the
 *                    current settings of the experiment
 *            goals:  e.g. { "when": "n >= 5 && err < 0.08", "solve": {} }; solve() takes a complete series.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const strip = (html) => html.replace(/^<p>|<\/p>$/g, "");
  const fmt = (x, d) => K.fmt(x, d);
  const E = 1.602176634e-19, ME = 9.1093837e-31, H = 6.62607015e-34, C = 2.99792458e8;

  function gauss(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /** Least squares; through the origin when origin is true. */
  function fitLine(pts, origin) {
    const n = pts.length;
    if (n < 2) return null;
    if (origin) {
      const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0), sxx = pts.reduce((s, p) => s + p[0] * p[0], 0);
      return sxx > 0 ? { m: sxy / sxx, b: 0 } : null;
    }
    const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, sxy = 0;
    pts.forEach((p) => { sxx += (p[0] - mx) * (p[0] - mx); sxy += (p[0] - mx) * (p[1] - my); });
    if (sxx <= 0) return null;
    const m = sxy / sxx;
    return { m, b: my - m * mx };
  }
  function wavelengthColor(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
    if (nm < 400) { r = 0.55; g = 0.25; b = 0.9; }
    const c = (v) => Math.round(255 * Math.min(1, Math.max(0, v)));
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }
  const line = (g, x1, y1, x2, y2, stroke, w, extra) => K.svg("line", Object.assign({ x1, y1, x2, y2, stroke: stroke || "var(--label-2)", "stroke-width": w || 1.5, "stroke-linecap": "round" }, extra || {}), g);
  const rect = (g, x, y, w, h, attrs) => K.svg("rect", Object.assign({ x, y, width: w, height: h }, attrs || {}), g);
  const label = (g, x, y, s, anchor, size) => { const t = K.text(g, x, y, s, "s-text", anchor || "middle"); if (size) t.style.fontSize = size + "px"; return t; };
  function meter(g, x, y, value, unit, name) {
    rect(g, x - 34, y - 15, 68, 30, { rx: 8, fill: "var(--fill)", stroke: "var(--separator)" });
    const t = K.text(g, x, y + 1, value + " " + unit, "s-text-strong");
    t.style.fontSize = "12px";
    if (name) label(g, x, y - 23, name, "middle", 10);
  }

  // ------------------------------------------------------------------ experiment definitions
  const EXP = {};

  EXP.fadenstrahlrohr = {
    title: "Fadenstrahlrohr: spezifische Ladung e/m",
    vars: [{ id: "U", label: "Beschleunigungsspannung", min: 150, max: 300, step: 10, value: 200, unit: "V", digits: 0 },
      { id: "I", label: "Spulenstrom", min: 1, max: 2.5, step: 0.05, value: 1.5, unit: "A", digits: 2 }],
    k: 0.78e-3, // T per A of the Helmholtz pair
    radius(s) { const B = this.k * s.I; return Math.sqrt((2 * s.U * ME) / E) / B; },
    ready(s) { return this.radius(s) > 0.055 ? "Der Strahl trifft den Glaskolben: Spulenstrom erhöhen oder Spannung senken." : true; },
    measure(s, r) { const B = this.k * s.I, rr = Math.round((this.radius(s) + gauss(r) * 0.0008) * 1000) / 10; return { U: s.U, I: s.I, B: B * 1000, r: rr, em: (2 * s.U) / (B * B * (rr / 100) * (rr / 100)) / 1e11 }; },
    columns: [["U", "U in V", 0], ["I", "I in A", 2], ["B", "B in mT", 3], ["r", "r in cm", 1], ["em", "e/m in 10¹¹ C/kg", 2]],
    plot: { x: (row) => ((row.B / 1000) ** 2) * ((row.r / 100) ** 2) * 1e9, y: (row) => 2 * row.U, xl: "B²r² in 10⁻⁹ T²m²", yl: "2U in V", origin: true },
    result(fit) { const v = fit.m * 1e9; return { value: v, lit: 1.75882e11, text: "Steigung = e/m = **" + fmt(v / 1e11, 3) + " · 10¹¹ C/kg**", litText: "1,76 · 10¹¹ C/kg" }; },
    why: "Herleitung: $eU = \\tfrac{1}{2}mv^2$ und Lorentzkraft gleich Zentripetalkraft $evB = \\frac{mv^2}{r}$ ergeben $\\frac{e}{m} = \\frac{2U}{B^2 r^2}$. Typische Fehler: den Durchmesser statt des Radius verwenden, Parallaxe beim Ablesen, das Erdmagnetfeld, ein nicht ganz homogenes Spulenfeld.",
    auto: [[150, 1.5], [200, 1.5], [250, 1.6], [300, 1.8], [200, 2.0], [250, 2.2]].map(([U, I]) => ({ U, I })),
    draw(g, s, time) {
      const cx = 170, cy = 104, R = 86, px = 1400; // px per metre
      K.svg("circle", { cx, cy, r: R + 8, fill: "none", stroke: "#b07a3a", "stroke-width": 7, opacity: 0.55 }, g);
      K.svg("circle", { cx, cy, r: R, fill: "rgba(140,170,255,0.08)", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      const r = this.radius(s), rp = r * px, hits = r > 0.055;
      // electron gun at the bottom, beam leaves to the right and bends upwards (field into the page)
      rect(g, cx - 8, cy + R - 20, 16, 14, { rx: 3, fill: "var(--label-3)" });
      const ccx = cx, ccy = cy + R - 20 - rp;
      const glow = "#4fd1c5";
      if (!hits) {
        K.svg("circle", { cx: ccx, cy: ccy, r: rp, fill: "none", stroke: glow, "stroke-width": 5, opacity: 0.25 }, g);
        K.svg("circle", { cx: ccx, cy: ccy, r: rp, fill: "none", stroke: glow, "stroke-width": 1.8 }, g);
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 2 - ((time * 2.2 + k / 6) % 1) * 2 * Math.PI;
          K.svg("circle", { cx: ccx + rp * Math.cos(a), cy: ccy + rp * Math.sin(a), r: 2.2, fill: "#fff" }, g);
        }
        line(g, ccx - rp, ccy, ccx + rp, ccy, "var(--label-3)", 1, { "stroke-dasharray": "3 3" });
        label(g, ccx, ccy - 6, "2r", "middle", 10);
      } else {
        const a0 = Math.PI / 2, arc = [];
        for (let a = 0; a < 2 * Math.PI; a += 0.05) {
          const x = ccx + rp * Math.cos(a0 - a), y = ccy + rp * Math.sin(a0 - a);
          if (Math.hypot(x - cx, y - cy) > R - 2) break;
          arc.push(x.toFixed(1) + "," + y.toFixed(1));
        }
        K.svg("polyline", { points: arc.join(" "), fill: "none", stroke: glow, "stroke-width": 1.8 }, g);
      }
      label(g, cx, 14, "Magnetfeld zeigt in die Zeichenebene", "middle", 10);
      meter(g, 312, 60, fmt(s.U, 0), "V", "U");
      meter(g, 312, 120, fmt(s.I, 2), "A", "I");
      meter(g, 312, 180, fmt(this.k * s.I * 1000, 2), "mT", "B");
    },
  };

  EXP.millikan = {
    title: "Millikan-Versuch: Elementarladung",
    vars: [{ id: "U", label: "Spannung am Kondensator", min: 0, max: 600, step: 1, value: 250, unit: "V", digits: 0 }],
    rho: 875, d: 0.006, g: 9.81,
    init(s, r) { this.newDrop(s, r); s.y = 0; },
    newDrop(s, r) { s.rad = 0.55e-6 + r() * 0.5e-6; s.n = 1 + Math.floor(r() * 5); s.y = (r() - 0.5) * 0.4; },
    mass(s) { return (4 / 3) * Math.PI * s.rad ** 3 * this.rho; },
    float(s) { return (this.mass(s) * this.g * this.d) / (s.n * E); },
    step(s, dt) {
      const v = (s.U - this.float(s)) / this.float(s); // positive: rises
      s.y = K.clamp(s.y - v * dt * 0.9, -1, 1);
      if (Math.abs(s.y) >= 1) s.y = Math.sign(s.y) * 0.98;
    },
    ready(s) { const f = this.float(s); return Math.abs(s.U - f) / f < 0.02 ? true : s.U > f ? "Der Tropfen steigt noch: Spannung etwas senken." : "Der Tropfen sinkt noch: Spannung etwas erhöhen."; },
    measure(s, r) {
      const U = s.U, q = (this.mass(s) * this.g * this.d) / U;
      const row = { nr: (s.count = (s.count || 0) + 1), rad: s.rad * 1e6, U, q: q / 1e-19, n: Math.max(1, Math.round(q / E)) };
      this.newDrop(s, r);
      return row;
    },
    columns: [["nr", "Tropfen", 0], ["rad", "r in µm", 2], ["U", "U in V", 0], ["q", "q in 10⁻¹⁹ C", 2], ["n", "q/e ≈", 0]],
    plot: { x: (row) => row.nr, y: (row) => row.q, xl: "Tropfen", yl: "q in 10⁻¹⁹ C", levels: true },
    result(fit, rows) {
      const sumQ = rows.reduce((s, x) => s + x.q, 0), sumN = rows.reduce((s, x) => s + x.n, 0), v = (sumQ / sumN) * 1e-19;
      return { value: v, lit: E, text: "Alle Ladungen sind Vielfache derselben kleinsten Ladung: e ≈ **" + fmt(v / 1e-19, 3) + " · 10⁻¹⁹ C**", litText: "1,602 · 10⁻¹⁹ C" };
    },
    minRows: 3,
    why: "Im Schwebezustand gleichen sich Gewichtskraft und elektrische Kraft aus: $q\\frac{U}{d} = mg$, also $q = \\frac{mgd}{U}$. Die Masse folgt aus dem Radius, den man aus der Sinkgeschwindigkeit ohne Feld (Stokes-Reibung) bestimmt. Schwierig: Auftrieb in Luft, schwankende Temperatur, zu kleine Tropfen.",
    auto: null,
    draw(g, s) {
      rect(g, 40, 22, 200, 8, { fill: "var(--label-2)", rx: 2 });
      rect(g, 40, 186, 200, 8, { fill: "var(--label-2)", rx: 2 });
      label(g, 250, 26, "+", "start", 14);
      label(g, 250, 190, "−", "start", 14);
      // view through the microscope
      K.svg("circle", { cx: 140, cy: 108, r: 70, fill: "rgba(255,255,255,0.04)", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      for (let k = -3; k <= 3; k++) line(g, 100, 108 + k * 18, 180, 108 + k * 18, "var(--label-3)", 0.8);
      const y = 108 + s.y * 62;
      K.svg("circle", { cx: 140, cy: y, r: 6, fill: "#ffd166", opacity: 0.35 }, g);
      K.svg("circle", { cx: 140, cy: y, r: 2.8, fill: "#ffd166" }, g);
      label(g, 140, 206, "Blick durchs Mikroskop", "middle", 10);
      meter(g, 312, 70, fmt(s.U, 0), "V", "U");
      label(g, 312, 130, "r = " + fmt(s.rad * 1e6, 2) + " µm", "middle", 11);
      label(g, 312, 146, "aus Sinkmethode", "middle", 9);
    },
  };

  const HG = [578, 546, 436, 405, 365];
  EXP.photoeffekt = {
    title: "Photoeffekt: Plancksches Wirkungsquantum",
    vars: [{ id: "L", label: "Wellenlänge", choices: HG, value: 546, unit: "nm" }, { id: "U", label: "Gegenspannung", min: 0, max: 2.5, step: 0.01, value: 0, unit: "V", digits: 2 }],
    WA: 1.9,
    U0(s) { return Math.max(0, (H * C) / (s.L * 1e-9) / E - this.WA); },
    current(s) { const u0 = this.U0(s); return u0 <= 0 || s.U >= u0 ? 0 : 40 * Math.pow((u0 - s.U) / u0, 1.5); },
    ready(s) { const u0 = this.U0(s); if (s.U < u0 - 0.04) return "Es fließt noch Strom: Gegenspannung erhöhen, bis er gerade verschwindet."; if (s.U > u0 + 0.04) return "Der Strom ist schon länger null: Gegenspannung verringern und dich an die Stelle herantasten, an der er gerade verschwindet."; return true; },
    measure(s, r) { return { L: s.L, f: C / (s.L * 1e-9) / 1e14, U0: Math.round((s.U + gauss(r) * 0.012) * 100) / 100 }; },
    columns: [["L", "λ in nm", 0], ["f", "f in 10¹⁴ Hz", 2], ["U0", "U₀ in V", 2]],
    plot: { x: (row) => row.f, y: (row) => row.U0, xl: "f in 10¹⁴ Hz", yl: "U₀ in V", origin: false },
    result(fit) {
      const h = (fit.m * E) / 1e14, WA = -fit.b;
      return { value: h, lit: H, text: "Steigung = h/e, also h = **" + fmt(h / 1e-34, 3) + " · 10⁻³⁴ Js**. Achsenabschnitt: W_A = " + fmt(WA, 2) + " eV, Grenzfrequenz " + fmt(-fit.b / fit.m, 2) + " · 10¹⁴ Hz", litText: "6,63 · 10⁻³⁴ Js" };
    },
    why: "Aus $eU_0 = hf - W_A$ wird $U_0 = \\frac{h}{e}f - \\frac{W_A}{e}$: eine Gerade, deren Steigung $\\frac{h}{e}$ ist. Die Intensität ändert nur die Stromstärke, nie $U_0$. Fehlerquellen: Kontaktspannungen, Elektronen aus der Anode, ungenaues Ablesen des Nullstroms.",
    auto: HG.map((L) => ({ L })),
    autoSet(s, a) { s.L = a.L; s.U = this.U0(s); },
    draw(g, s, time) {
      const col = wavelengthColor(s.L), I = this.current(s);
      // light
      K.svg("polygon", { points: "8,70 8,96 92,112 92,76", fill: col, opacity: 0.35 }, g);
      label(g, 46, 60, s.L + " nm", "middle", 11);
      // photocell: cathode (curved) and anode ring
      K.svg("ellipse", { cx: 150, cy: 100, rx: 74, ry: 62, fill: "rgba(140,170,255,0.06)", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      K.svg("path", { d: "M106,60 Q86,100 106,140", fill: "none", stroke: "var(--label-2)", "stroke-width": 6 }, g);
      K.svg("circle", { cx: 180, cy: 100, r: 9, fill: "none", stroke: "var(--label-2)", "stroke-width": 3 }, g);
      label(g, 100, 156, "Kathode", "middle", 10);
      label(g, 184, 124, "Anode", "middle", 10);
      // electrons: fly towards the anode, the counter voltage slows them down
      const u0 = this.U0(s), reach = u0 > 0 ? Math.min(1, s.U > 0 ? u0 / s.U : 1) : 0;
      for (let k = 0; k < 7; k++) {
        const ph = (time * 0.9 + k / 7) % 1;
        const max = reach >= 1 ? 1 : reach;
        const f = max >= 1 ? ph : ph < 0.5 ? (ph / 0.5) * max : ((1 - ph) / 0.5) * max;
        const x = 102 + f * 74, y = 100 + (k - 3) * 9 * (1 - f * 0.8);
        if (u0 > 0) K.svg("circle", { cx: x, cy: y, r: 2.2, fill: "#4fd1c5" }, g);
      }
      meter(g, 296, 60, fmt(s.U, 2), "V", "Gegenspannung");
      meter(g, 296, 132, fmt(I, 1), "nA", "Photostrom");
    },
  };

  EXP.franckhertz = {
    title: "Franck-Hertz-Versuch mit Quecksilber",
    vars: [{ id: "U", label: "Beschleunigungsspannung", min: 0, max: 30, step: 0.1, value: 5, unit: "V", digits: 1 }],
    current(U) {
      if (U < 1.2) return 0;
      const frac = ((((U - 7.8) % 4.9) + 4.9) % 4.9) / 4.9;
      const shape = frac < 0.82 ? 0.3 + 0.7 * Math.pow(frac / 0.82, 1.4) : 0.3 + 0.7 * Math.pow(1 - (frac - 0.82) / 0.18, 1.6);
      return 140 * Math.pow(U / 30, 1.3) * (U < 6.9 ? Math.min(1, 0.3 + 0.7 * Math.pow((U - 1.2) / 5.7, 1.4)) : shape);
    },
    measure(s, r) { return { U: s.U, I: Math.max(0, this.current(s.U) * (1 + gauss(r) * 0.012)) }; },
    columns: [["U", "U in V", 1], ["I", "I in nA", 1]],
    plot: { x: (row) => row.U, y: (row) => row.I, xl: "U in V", yl: "I in nA", connect: true },
    result(fit, rows) {
      const pts = rows.slice().sort((a, b) => a.U - b.U);
      // a maximum is the highest point within 1.6 V on both sides; scatter does not make false peaks this way
      const max = [];
      pts.forEach((q, i) => {
        if (q.U < 4 || i === 0 || i === pts.length - 1) return;
        const near = pts.filter((o) => Math.abs(o.U - q.U) <= 1.6);
        if (near.length >= 3 && near.every((o) => o.I <= q.I) && !max.some((u) => Math.abs(u - q.U) < 2)) max.push(q.U);
      });
      if (max.length < 2) return { value: null, text: "Für die Auswertung braucht es mindestens zwei Maxima: nimm mehr Messwerte auf, besonders in der Nähe der Spitzen." };
      const dU = (max[max.length - 1] - max[0]) / (max.length - 1);
      const lambda = (H * C) / (dU * E) * 1e9;
      return { value: dU, lit: 4.9, text: "Abstand der Maxima ΔU ≈ **" + fmt(dU, 2) + " V**, also gibt jedes Elektron beim Stoß " + fmt(dU, 2) + " eV ab. Das Licht dazu: λ = hc/(eΔU) ≈ **" + fmt(lambda, 0) + " nm** (ultraviolett)", litText: "4,9 V" };
    },
    minRows: 8,
    why: "Elektronen geben ihre Energie nur in Portionen von 4,9 eV an Quecksilber-Atome ab. Hat ein Elektron 4,9 eV erreicht, stößt es unelastisch und schafft die Gegenspannung vor der Anode nicht mehr: der Strom fällt. Das zeigt diskrete Energieniveaus der Atomhülle.",
    sweep: true,
    auto: Array.from({ length: 59 }, (_, i) => ({ U: 1 + i * 0.5 })),
    draw(g, s, time) {
      K.svg("rect", { x: 20, y: 52, width: 250, height: 96, rx: 30, fill: "rgba(140,170,255,0.06)", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      line(g, 44, 70, 44, 130, "#ff8a3d", 4);
      label(g, 44, 160, "Kathode", "middle", 10);
      for (let y = 66; y <= 134; y += 8) line(g, 220, y, 220, y + 4, "var(--label-2)", 2);
      label(g, 220, 160, "Gitter", "middle", 10);
      line(g, 248, 70, 248, 130, "var(--label-2)", 4);
      label(g, 252, 40, "Anode", "middle", 10);
      // glowing layers where the electrons reach 4.9 eV
      const zones = Math.floor(Math.max(0, s.U - 2.1) / 4.9);
      for (let k = 1; k <= zones; k++) {
        const x = 44 + ((k * 4.9 + 2.1) / s.U) * 176;
        K.svg("rect", { x: x - 5, y: 58, width: 10, height: 84, fill: "#a78bfa", opacity: 0.45 }, g);
      }
      for (let k = 0; k < 6; k++) { const f = (time * 1.4 + k / 6) % 1; K.svg("circle", { cx: 48 + f * 170, cy: 76 + k * 9, r: 2, fill: "#4fd1c5", opacity: s.U > 1.2 ? 1 : 0.2 }, g); }
      meter(g, 318, 70, fmt(s.U, 1), "V", "U");
      meter(g, 318, 140, fmt(this.current(s.U), 0), "nA", "I");
    },
  };

  EXP.elektronenbeugung = {
    title: "Elektronenbeugung an Graphit",
    vars: [{ id: "U", label: "Beschleunigungsspannung", min: 2, max: 5, step: 0.1, value: 4, unit: "kV", digits: 1 }],
    L: 0.135, d: [213e-12, 123e-12],
    lambda(U) { return H / Math.sqrt(2 * ME * E * U * 1000); },
    radius(U, d) { const th = Math.asin(this.lambda(U) / (2 * d)); return this.L * Math.tan(2 * th); },
    measure(s, r) { const l = this.lambda(s.U); return { U: s.U, lam: l * 1e12, r1: Math.round((this.radius(s.U, this.d[0]) + gauss(r) * 0.0003) * 1000) / 10, r2: Math.round((this.radius(s.U, this.d[1]) + gauss(r) * 0.0003) * 1000) / 10 }; },
    columns: [["U", "U in kV", 1], ["lam", "λ in pm", 1], ["r1", "r₁ in cm", 1], ["r2", "r₂ in cm", 1]],
    plot: { x: (row) => row.lam, y: (row) => row.r1, xl: "λ (de Broglie) in pm", yl: "r₁ in cm", origin: true },
    result(fit) {
      const d = (this.L * 100) / fit.m; // cm per pm -> d in pm
      return { value: d * 1e-12, lit: this.d[0], text: "Kleine Winkel: $r \\approx \\frac{L\\lambda}{d}$, aus der Steigung folgt der Netzebenenabstand d₁ ≈ **" + fmt(d, 0) + " pm**", litText: "213 pm" };
    },
    why: "Die Ringe entstehen wie Röntgenbeugung nach Bragg: $2d\\sin\\vartheta = \\lambda$, auf dem Schirm mit $\\tan(2\\vartheta) = \\frac{r}{L}$. Steigt die Spannung, wird $\\lambda = \\frac{h}{\\sqrt{2meU}}$ kleiner und die Ringe enger: Elektronen verhalten sich wie Wellen.",
    auto: [2, 2.5, 3, 3.5, 4, 4.5, 5].map((U) => ({ U })),
    draw(g, s) {
      K.svg("path", { d: "M20,80 L200,64 A90,90 0 0 1 200,156 L20,140 Z", fill: "rgba(140,170,255,0.06)", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      rect(g, 26, 98, 26, 24, { rx: 4, fill: "var(--label-3)" });
      line(g, 52, 110, 128, 110, "#4fd1c5", 2);
      line(g, 130, 96, 130, 124, "var(--label-2)", 3);
      label(g, 130, 140, "Graphit", "middle", 10);
      const px = 1400, r1 = this.radius(s.U, this.d[0]) * px, r2 = this.radius(s.U, this.d[1]) * px;
      // screen seen from the front
      K.svg("circle", { cx: 292, cy: 110, r: 52, fill: "rgba(80,220,120,0.08)", stroke: "var(--label-3)" }, g);
      K.svg("circle", { cx: 292, cy: 110, r: 3, fill: "#7ee08a" }, g);
      [r1, r2].forEach((r) => { K.svg("circle", { cx: 292, cy: 110, r, fill: "none", stroke: "#7ee08a", "stroke-width": 4, opacity: 0.35 }, g); K.svg("circle", { cx: 292, cy: 110, r, fill: "none", stroke: "#7ee08a", "stroke-width": 1.2 }, g); });
      label(g, 292, 176, "Leuchtschirm, L = 13,5 cm", "middle", 10);
      meter(g, 86, 190, fmt(s.U, 1), "kV", null);
    },
  };

  EXP.gitter = {
    title: "Wellenlänge eines Lasers am Gitter",
    vars: [{ id: "e", label: "Abstand Gitter–Schirm", min: 1, max: 3, step: 0.1, value: 1.5, unit: "m", digits: 1 }],
    init(s, r, p) { s.lines = p.lines || 300; s.lam = p.lambda || [632.8, 532, 650][Math.floor(r() * 3)]; },
    a1(s) { const g = 1e-3 / s.lines, sin = (s.lam * 1e-9) / g; return s.e * Math.tan(Math.asin(sin)); },
    measure(s, r) { return { e: s.e, a1: Math.round((this.a1(s) + gauss(r) * 0.002) * 1000) / 10 }; },
    columns: [["e", "e in m", 1], ["a1", "a₁ in cm", 1]],
    plot: { x: (row) => row.e, y: (row) => row.a1, xl: "e in m", yl: "a₁ in cm", origin: true },
    result(fit, rows, s) {
      const tan = fit.m / 100, lam = (1e-3 / s.lines) * Math.sin(Math.atan(tan)) * 1e9;
      return { value: lam, lit: s.lam, text: "Steigung = tan α₁, mit $g \\sin\\alpha_1 = \\lambda$ und g = 1/" + s.lines + " mm: λ ≈ **" + fmt(lam, 0) + " nm**", litText: fmt(s.lam, 1) + " nm" };
    },
    why: "Gangunterschied benachbarter Spalte $g\\sin\\alpha_k = k\\lambda$, auf dem Schirm $\\tan\\alpha_k = \\frac{a_k}{e}$. Die Kleinwinkelnäherung $\\sin\\alpha \\approx \\tan\\alpha$ ist bei diesem Gitter schon zu grob: lieber über den Winkel rechnen.",
    auto: [1, 1.5, 2, 2.5, 3].map((e) => ({ e })),
    draw(g, s) {
      const col = wavelengthColor(s.lam);
      rect(g, 8, 96, 40, 20, { rx: 3, fill: "var(--label-3)" });
      label(g, 28, 130, "Laser", "middle", 10);
      line(g, 48, 106, 90, 106, col, 2.5);
      line(g, 92, 84, 92, 128, "var(--label-2)", 3);
      label(g, 92, 146, "Gitter", "middle", 10);
      const sx = 92 + 70 + s.e * 50, scale = 300; // px per m on the screen
      line(g, sx, 14, sx, 198, "var(--label-3)", 3);
      const a1 = this.a1(s) * scale;
      [-2, -1, 0, 1, 2].forEach((k) => {
        const y = 106 + (k === 0 ? 0 : Math.sign(k) * (Math.abs(k) === 1 ? a1 : this.a1(s) * scale * 2.1));
        if (y < 12 || y > 200) return;
        line(g, 92, 106, sx, y, col, 1, { opacity: 0.35 });
        K.svg("circle", { cx: sx, cy: y, r: k === 0 ? 4.5 : 3.5, fill: col }, g);
      });
      line(g, sx + 10, 106, sx + 10, 106 - a1, "var(--label-2)", 1);
      label(g, sx + 14, 106 - a1 / 2, "a₁", "start", 11);
      line(g, 92, 190, sx, 190, "var(--label-3)", 1, { "stroke-dasharray": "3 3" });
      label(g, (92 + sx) / 2, 202, "e = " + fmt(s.e, 1) + " m", "middle", 10);
      label(g, 100, 70, s.lines + " Linien/mm", "start", 10);
    },
  };

  EXP.federpendel = {
    title: "Federpendel: Federkonstante",
    vars: [{ id: "m", label: "Masse", min: 50, max: 300, step: 10, value: 100, unit: "g", digits: 0 }],
    D: 24,
    T(s) { return 2 * Math.PI * Math.sqrt(s.m / 1000 / this.D); },
    measure(s, r) { const t10 = Math.round((10 * this.T(s) + gauss(r) * 0.08) * 100) / 100; return { m: s.m, t10, T: t10 / 10, T2: (t10 / 10) ** 2 }; },
    columns: [["m", "m in g", 0], ["t10", "10 T in s", 2], ["T", "T in s", 3], ["T2", "T² in s²", 4]],
    plot: { x: (row) => row.m / 1000, y: (row) => row.T2, xl: "m in kg", yl: "T² in s²", origin: true },
    result(fit) { const D = (4 * Math.PI * Math.PI) / fit.m; return { value: D, lit: this.D, text: "Steigung = 4π²/D, also D ≈ **" + fmt(D, 1) + " N/m**", litText: this.D + " N/m (Herstellerangabe)" }; },
    why: "Aus $T = 2\\pi\\sqrt{\\frac{m}{D}}$ folgt $T^2 = \\frac{4\\pi^2}{D}\\,m$: eine Ursprungsgerade. Zehn Schwingungen zu stoppen teilt den Reaktionsfehler durch zehn. Die Masse der Feder selbst verschiebt die Gerade ein wenig.",
    auto: [50, 100, 150, 200, 250, 300].map((m) => ({ m })),
    draw(g, s, time) {
      line(g, 60, 14, 220, 14, "var(--label-2)", 4);
      const T = this.T(s), y = 120 + 26 * Math.cos((2 * Math.PI * time) / T), coils = 12;
      const pts = [];
      for (let i = 0; i <= coils * 2; i++) pts.push((140 + (i === 0 || i === coils * 2 ? 0 : i % 2 ? 12 : -12)) + "," + (16 + ((y - 30) * i) / (coils * 2)));
      K.svg("polyline", { points: pts.join(" "), fill: "none", stroke: "var(--label-2)", "stroke-width": 1.6 }, g);
      const size = 18 + s.m / 12;
      rect(g, 140 - size / 2, y - 14, size, size * 0.8, { rx: 4, fill: "var(--accent)" });
      label(g, 140, y - 14 + size * 0.4, s.m + " g", "middle", 10).style.fill = "#fff";
      line(g, 250, 30, 250, 200, "var(--label-3)", 1.5);
      for (let k = 0; k <= 8; k++) line(g, 246, 40 + k * 20, 254, 40 + k * 20, "var(--label-3)", 1);
      meter(g, 318, 100, fmt(T, 2), "s", "T");
    },
  };

  EXP.entladung = {
    title: "Entladung eines Kondensators",
    vars: [],
    R: 47e3, Cap: 470e-6, U0: 10,
    init(s) { s.t = 0; s.running = false; },
    // the clock runs three times as fast as real time, so a series takes about half a minute
    step(s, dt) { if (s.running) s.t = Math.min(120, s.t + dt * 3); },
    U(s) { return this.U0 * Math.exp(-s.t / (this.R * this.Cap)); },
    ready(s) { return s.running || s.t > 0 ? true : "Erst »Entladen starten« tippen, dann bei laufender Uhr Messwerte nehmen."; },
    measure(s, r) { const t = Math.round(s.t); const U = Math.max(0.01, this.U0 * Math.exp(-t / (this.R * this.Cap)) * (1 + gauss(r) * 0.01)); return { t, U, lnU: Math.log(U) }; },
    columns: [["t", "t in s", 0], ["U", "U in V", 2], ["lnU", "ln(U/V)", 3]],
    plot: { x: (row) => row.t, y: (row) => row.lnU, xl: "t in s", yl: "ln(U/V)", origin: false },
    result(fit) { const C2 = -1 / (this.R * fit.m); return { value: C2, lit: this.Cap, text: "Steigung = −1/(RC), mit R = 47 kΩ: C ≈ **" + fmt(C2 * 1e6, 0) + " µF**; Zeitkonstante τ = RC ≈ " + fmt(-1 / fit.m, 1) + " s", litText: "470 µF" }; },
    why: "$U(t) = U_0\\,e^{-\\frac{t}{RC}}$ wird durch Logarithmieren zur Geraden $\\ln U = \\ln U_0 - \\frac{1}{RC}t$. Nach $t = RC$ ist die Spannung auf 37 % gefallen, die Halbwertszeit ist $RC\\ln 2$.",
    buttons: [["Entladen starten", (s) => { s.running = true; }], ["Neu laden", (s) => { s.running = false; s.t = 0; }]],
    autoSet(s, a) { s.t = a.t; },
    auto: [0, 10, 20, 30, 40, 50, 60].map((t) => ({ t })),
    draw(g, s, time) {
      // circuit: capacitor, resistor, switch, voltmeter
      K.svg("rect", { x: 40, y: 40, width: 200, height: 130, fill: "none", stroke: "var(--label-2)", "stroke-width": 2 }, g);
      rect(g, 26, 93, 28, 10, { fill: "var(--card-solid)" });
      line(g, 26, 92, 54, 92, "var(--label)", 3);
      line(g, 26, 104, 54, 104, "var(--label)", 3);
      label(g, 16, 98, "C", "end", 12);
      rect(g, 120, 32, 50, 16, { fill: "var(--card-solid)", stroke: "var(--label)", "stroke-width": 2 });
      label(g, 145, 22, "R = 47 kΩ", "middle", 10);
      label(g, 145, 186, s.running ? "Schalter zu: Entladung läuft" : "Schalter offen", "middle", 10);
      const U = this.U(s), ang = -60 + (U / this.U0) * 120;
      K.svg("circle", { cx: 300, cy: 96, r: 44, fill: "var(--fill)", stroke: "var(--separator)" }, g);
      const a = ((ang - 90) * Math.PI) / 180;
      line(g, 300, 108, 300 + 36 * Math.cos(a), 108 + 36 * Math.sin(a), "var(--red)", 2);
      label(g, 300, 126, fmt(U, 2) + " V", "middle", 12);
      meter(g, 300, 178, fmt(s.t, 0), "s", "Stoppuhr");
      if (s.running && U > 0.3) for (let k = 0; k < 5; k++) { const f = (time * 0.8 + k / 5) % 1; K.svg("circle", { cx: 40 + f * 200, cy: 40, r: 2, fill: "#4fd1c5" }, g); }
    },
  };

  EXP.titration = {
    title: "Titration mit Natronlauge",
    vars: [{ id: "V", label: "Zugegebene Natronlauge", min: 0, max: 40, step: 0.1, value: 0, unit: "mL", digits: 1 }],
    init(s, r, p) { s.weak = p.acid === "essigsaeure"; s.ca = Math.round((0.08 + r() * 0.06) * 1000) / 1000; s.Va = 20; s.cb = 0.1; s.Ka = 1.75e-5; },
    pH(s, V) {
      const Vt = (s.Va + V) / 1000, na = (s.cb * V) / 1000 / Vt, ca = (s.ca * s.Va) / 1000 / Vt;
      // charge balance: [H+] + [Na+] = [OH-] + [A-]
      let lo = -14, hi = 0;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2, h = Math.pow(10, mid), oh = 1e-14 / h;
        const a = s.weak ? (ca * s.Ka) / (s.Ka + h) : ca;
        if (h + na - oh - a > 0) hi = mid; else lo = mid;
      }
      return -(lo + hi) / 2;
    },
    measure(s, r) { return { V: s.V, pH: Math.round((this.pH(s, s.V) + gauss(r) * 0.015) * 100) / 100 }; },
    columns: [["V", "V in mL", 1], ["pH", "pH", 2]],
    plot: { x: (row) => row.V, y: (row) => row.pH, xl: "V(NaOH) in mL", yl: "pH", connect: true },
    result(fit, rows, s) {
      const pts = rows.slice().sort((a, b) => a.V - b.V);
      let best = -1, at = null;
      for (let i = 1; i < pts.length; i++) { const dv = pts[i].V - pts[i - 1].V; if (dv <= 0) continue; const sl = (pts[i].pH - pts[i - 1].pH) / dv; if (sl > best) { best = sl; at = (pts[i].V + pts[i - 1].V) / 2; } }
      if (at == null || best < 0.5) return { value: null, text: "Noch kein Sprung zu sehen: nimm Messwerte bis über den Äquivalenzpunkt hinaus auf, in seiner Nähe in kleinen Schritten." };
      const ca = (s.cb * at) / s.Va;
      let txt = "Äquivalenzpunkt bei V ≈ **" + fmt(at, 1) + " mL** (steilste Stelle), also c(Säure) = c(NaOH) · V / 20 mL ≈ **" + fmt(ca, 3) + " mol/L**";
      if (s.weak) {
        const half = at / 2;
        let ph = null;
        for (let i = 1; i < pts.length; i++) if (pts[i - 1].V <= half && pts[i].V >= half) { const f = (half - pts[i - 1].V) / Math.max(1e-9, pts[i].V - pts[i - 1].V); ph = pts[i - 1].pH + f * (pts[i].pH - pts[i - 1].pH); }
        if (ph != null) txt += ". Am Halbäquivalenzpunkt (" + fmt(half, 1) + " mL) gilt pH = pKS ≈ **" + fmt(ph, 2) + "** (Literatur 4,76)";
      }
      return { value: ca, lit: s.ca, text: txt, litText: fmt(s.ca, 3) + " mol/L (eingewogen)" };
    },
    minRows: 6,
    why: "Am Äquivalenzpunkt ist so viel Lauge zugegeben, wie Säure vorlag: $c_S V_S = c_B V_B$. Bei Salzsäure liegt er bei pH 7, bei Essigsäure im Basischen, weil Acetat-Ionen eine schwache Base sind. Bei der schwachen Säure puffert die Lösung vorher: dort ist die Kurve flach.",
    auto: [0, 4, 8, 12, 14, 16, 17, 18, 19, 19.5, 20, 20.5, 21, 22, 24, 28, 32].map((V) => ({ V })),
    autoSet(s, a) { s.V = (a.V * s.ca) / 0.1; },
    draw(g, s, time) {
      const pH = this.pH(s, s.V);
      // burette
      rect(g, 132, 8, 16, 120, { rx: 3, fill: "rgba(140,170,255,0.08)", stroke: "var(--label-3)" });
      const level = 12 + (s.V / 40) * 110;
      rect(g, 134, level, 12, 124 - level, { fill: "rgba(120,170,255,0.35)" });
      for (let k = 0; k <= 8; k++) line(g, 132, 12 + k * 13.75, 138, 12 + k * 13.75, "var(--label-3)", 1);
      line(g, 140, 128, 140, 140, "var(--label-3)", 3);
      const drop = (time * 1.6) % 1;
      if (s.V > 0 && s.V < 40) K.svg("circle", { cx: 140, cy: 142 + drop * 18, r: 2.2, fill: "rgba(120,170,255,0.8)" }, g);
      // flask with indicator (phenolphthalein: colourless below 8.2, pink above)
      const pink = K.clamp((pH - 8.2) / 1.6, 0, 1);
      K.svg("path", { d: "M128,160 L128,170 L100,206 L180,206 L152,170 L152,160 Z", fill: "rgba(" + Math.round(200 + 55 * pink) + "," + Math.round(220 - 140 * pink) + "," + Math.round(240 - 60 * pink) + "," + (0.25 + 0.4 * pink) + ")", stroke: "var(--label-3)", "stroke-width": 1.5 }, g);
      label(g, 140, 216, s.weak ? "Essigsäure, 20 mL" : "Salzsäure, 20 mL", "middle", 10);
      label(g, 200, 30, "c(NaOH) = 0,1 mol/L", "start", 10);
      meter(g, 300, 120, fmt(pH, 2), "", "pH-Meter");
      meter(g, 300, 60, fmt(s.V, 1), "mL", "Verbrauch");
    },
  };

  // ------------------------------------------------------------------ the widget
  LW.widget("versuch", {
    mount(host, p, ctx) {
      const X = EXP[p.exp] || EXP.fadenstrahlrohr;
      const r = LW.rng(LW.hash(String(ctx.seed || "v") + "|versuch|" + (p.exp || "")));
      const s = {};
      let rows = [], locked = false, raf = 0, last = performance.now(), time = 0, note = null;
      X.vars.forEach((v) => { s[v.id] = p[v.id] != null ? p[v.id] : v.value; });
      if (X.init) X.init(s, r, p);

      host.classList.add("w-versuch");
      const svg = K.root(host, 360, 220, p.aria || X.title);
      svg.style.maxWidth = "480px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const sliders = {};
      X.vars.forEach((v) => {
        if (v.choices) {
          sliders[v.id] = K.segmented(ctrl, v.choices.map((c) => ({ id: c, label: c + " " + v.unit })), s[v.id], (id) => { if (locked) return; s[v.id] = id; note = null; draw(); ctx.changed(); });
        } else {
          sliders[v.id] = K.slider(ctrl, { label: v.label, min: v.min, max: v.max, step: v.step, value: s[v.id], format: (x) => fmt(x, v.digits) + " " + v.unit,
            onInput: (x) => { if (locked) return; s[v.id] = x; note = null; draw(); ctx.changed(); } });
        }
      });
      const btns = LW.el("div", { class: "w-btns" });
      ctrl.append(btns);
      (X.buttons || []).forEach(([text, fn]) => K.button(btns, text, () => { if (locked) return; fn(s); note = null; draw(); }));
      const takeB = K.button(btns, "Messwert aufnehmen", () => take());
      takeB.classList.add("on");
      if (X.sweep) K.button(btns, "Kennlinie durchfahren", () => { if (locked) return; rows = X.auto.map((a) => X.measure(Object.assign({}, s, a), r)); note = null; paintData(); ctx.changed(); });
      K.button(btns, "Letzten löschen", () => { if (locked || !rows.length) return; rows.pop(); note = null; paintData(); ctx.changed(); });
      const status = K.readout(host);
      const table = LW.el("div", { class: "w-table-wrap" });
      host.append(table);
      const psvg = K.root(host, 360, 210, "Messwerte im Diagramm");
      psvg.style.maxWidth = "480px"; psvg.style.margin = "6px auto 0";
      const pg = K.svg("g", null, psvg);
      const res = K.readout(host);

      let shown = null;
      function draw() {
        K.clear(g);
        X.draw(g, s, time);
        const ok = X.ready ? X.ready(s) : true;
        const text = note || (ok === true ? "Bereit: **Messwert aufnehmen**." : ok);
        if (text !== shown) { shown = text; status.set(strip(LW.md(text))); }
      }
      function take() {
        if (locked) return;
        const ok = X.ready ? X.ready(s) : true;
        if (ok !== true) { note = ok; draw(); return; }
        rows.push(X.measure(s, r));
        note = "Messwert " + rows.length + " aufgenommen.";
        draw();
        paintData();
        ctx.changed();
      }
      function evaluate() {
        if (!rows.length) return null;
        const pts = rows.map((row) => [X.plot.x(row), X.plot.y(row)]);
        const fit = X.plot.connect || X.plot.levels ? null : fitLine(pts, X.plot.origin);
        if (rows.length < (X.minRows || 2)) return { pts, fit, out: null };
        if (!fit && !(X.plot.connect || X.plot.levels)) return { pts, fit, out: null };
        return { pts, fit, out: X.result(fit, rows, s) };
      }
      function paintData() {
        // table
        table.innerHTML = "";
        if (rows.length) {
          const t = LW.el("table", { class: "w-table" });
          t.append(LW.el("tr", null, X.columns.map((c) => LW.el("th", { text: c[1] }))));
          rows.forEach((row) => t.append(LW.el("tr", null, X.columns.map((c) => LW.el("td", { text: fmt(row[c[0]], c[2]) })))));
          table.append(t);
        }
        // graph
        K.clear(pg);
        const ev = evaluate();
        const W = 360, Hh = 210, L = 46, R = 12, T = 12, B = 34;
        const pts = ev ? ev.pts : [];
        let x0 = 0, x1 = 1, y0 = 0, y1 = 1;
        if (pts.length) {
          x1 = Math.max.apply(null, pts.map((q) => q[0])); y1 = Math.max.apply(null, pts.map((q) => q[1]));
          x0 = X.plot.origin || X.plot.levels ? 0 : Math.min.apply(null, pts.map((q) => q[0]));
          y0 = X.plot.origin || X.plot.levels ? 0 : Math.min.apply(null, pts.map((q) => q[1]));
          if (X.plot.connect) { x0 = Math.min(0, x0); y0 = Math.min(0, y0); }
          const px = (x1 - x0) * 0.08 || 1, py = (y1 - y0) * 0.1 || 1;
          if (!X.plot.origin && !X.plot.levels && !X.plot.connect) x0 -= px;
          x1 += px; y1 += py;
          if (!X.plot.origin && !X.plot.levels && !X.plot.connect) y0 -= py;
          if (X.plot.levels) x0 = 0;
        }
        const sx = K.scale(x0, x1, L, W - R), sy = K.scale(y0, y1, Hh - B, T);
        K.svg("line", { x1: L, y1: Hh - B, x2: W - R, y2: Hh - B, class: "s-axis" }, pg);
        K.svg("line", { x1: L, y1: Hh - B, x2: L, y2: T, class: "s-axis" }, pg);
        K.ticks(x0, x1, 5).forEach((v) => { const x = sx(v); line(pg, x, Hh - B, x, Hh - B + 4, "var(--label-3)", 1); label(pg, x, Hh - B + 13, fmt(v, 3), "middle", 9.5); });
        K.ticks(y0, y1, 5).forEach((v) => { const y = sy(v); line(pg, L - 4, y, L, y, "var(--label-3)", 1); line(pg, L, y, W - R, y, "var(--separator)", 0.6); label(pg, L - 7, y, fmt(v, 3), "end", 9.5); });
        label(pg, (L + W - R) / 2, Hh - 6, X.plot.xl, "middle", 10.5);
        const yl = label(pg, 12, (T + Hh - B) / 2, X.plot.yl, "middle", 10.5);
        yl.setAttribute("transform", "rotate(-90 12 " + (T + Hh - B) / 2 + ")");
        if (!pts.length) { label(pg, (L + W) / 2, (T + Hh - B) / 2, "Noch keine Messwerte", "middle", 11); res.set(strip(LW.md(X.why))); return; }
        if (X.plot.levels && ev.out && ev.out.value) {
          // multiples of the found elementary charge
          const e0 = ev.out.value / 1e-19;
          for (let n = 1; n * e0 < y1; n++) { const y = sy(n * e0); line(pg, L, y, W - R, y, "var(--accent)", 0.8, { "stroke-dasharray": "4 4", opacity: 0.7 }); label(pg, W - R - 2, y - 6, n + "e", "end", 9); }
        }
        if (X.plot.connect) {
          const sorted = pts.slice().sort((a, b) => a[0] - b[0]);
          K.svg("polyline", { points: sorted.map((q) => sx(q[0]) + "," + sy(q[1])).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 1.5, opacity: 0.6 }, pg);
        }
        if (ev.fit) {
          const xa = X.plot.origin ? 0 : x0, xb = x1;
          line(pg, sx(xa), sy(ev.fit.m * xa + ev.fit.b), sx(xb), sy(ev.fit.m * xb + ev.fit.b), "var(--accent)", 1.8, { opacity: 0.85 });
        }
        pts.forEach((q) => K.svg("circle", { cx: sx(q[0]), cy: sy(q[1]), r: 3.4, fill: "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2 }, pg));
        // result
        let txt;
        if (!ev.out) txt = "Noch zu wenige Messwerte für eine Auswertung (mindestens " + (X.minRows || 2) + ").";
        else if (ev.out.value == null) txt = ev.out.text;
        else {
          const err = ev.out.lit ? Math.abs(ev.out.value - ev.out.lit) / ev.out.lit : null;
          txt = ev.out.text + ". Literaturwert " + ev.out.litText + (err != null ? ", Abweichung **" + fmt(err * 100, 1) + " %**." : ".");
        }
        res.set(strip(LW.md(txt + "\n\n" + X.why)).replace(/<\/p>\s*<p>/, "<br><br>"));
      }
      function scope() {
        const ev = evaluate();
        const out = ev && ev.out;
        const value = out && out.value != null ? out.value : 0;
        const err = out && out.value != null && out.lit ? Math.abs(out.value - out.lit) / out.lit : 1;
        return Object.assign({}, s, { n: rows.length, value, err });
      }
      function tick(now) {
        if (!svg.isConnected) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!(LW.reduceMotion && LW.reduceMotion())) time += dt;
        if (X.step) X.step(s, dt);
        draw();
        raf = requestAnimationFrame(tick);
      }
      draw();
      paintData();
      raf = requestAnimationFrame(tick);
      return {
        check(goal) {
          const sc = scope();
          let ok = false;
          try { ok = !!LW.expr((goal && goal.when) || "n >= 5")(sc); } catch (e) { ok = false; }
          if (ok) return { correct: true };
          for (const h of (goal && goal.hints) || []) { try { if (LW.expr(h.when)(sc)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } }
          return { correct: false, detail: (goal && goal.message) || (sc.n < (X.minRows || 2) ? "Nimm zuerst mehr Messwerte auf." : "Die Auswertung weicht noch zu stark ab: prüfe die Messwerte oder nimm weitere auf.") };
        },
        solve() {
          rows = [];
          if (X.auto) {
            X.auto.forEach((a) => {
              const st = Object.assign({}, s, a);
              if (X.autoSet) X.autoSet(st, a);
              if (X.newDrop) X.newDrop(st, r);
              rows.push(X.measure(st, r));
            });
          } else {
            // Millikan: several drops, each held in suspension
            for (let k = 0; k < 6; k++) { X.newDrop(s, r); s.U = X.float(s); rows.push(X.measure(s, r)); }
          }
          note = "Eine vollständige Messreihe ist eingetragen.";
          draw();
          paintData();
        },
        getVar: (k) => s[k],
        setVar(k, v) { if (k in s) { s[k] = v; if (sliders[k] && sliders[k].set) sliders[k].set(v); draw(); } },
        lock() { locked = true; host.querySelectorAll("button, input").forEach((b) => { b.disabled = true; }); },
        leave() { cancelAnimationFrame(raf); },
      };
    },
  });
  LW.experiments = EXP;
})();
