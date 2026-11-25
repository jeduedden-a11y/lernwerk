/* Chemistry labs: equilibrium, galvanic cells, balancing equations.
 *
 *   gleichgewicht: aA + bB ⇌ cC + dD with the law of mass action. The learner sets the starting concentrations (and the
 *     temperature where the reaction has a known ΔH); the lab finds the equilibrium and shows the shift.
 *     params: reaction "ester" | "hi" | "no2" | "allgemein", c0 [A, B, C, D], K (for "allgemein"), T, edit
 *     scope:  a0, b0, c0, d0 (start), cA, cB, cC, cD (equilibrium), K, Q0, dir (1 forward, -1 back, 0 already), yield (C relative to the most possible), T
 *   galvani: two half-cells; standard potentials and the Nernst equation give the voltage, anode and cathode.
 *     params: left, right (metal ids), c [left, right] (mol/L), edit
 *     scope:  U, E1, E2, c1, c2, anode (1 left, 2 right), z1, z2, m1, m2 (index of the metal in the series: Mg, Zn, Fe, Pb, H2, Cu, Ag),
 *             kat, ano (index of the metal at the cathode and at the anode, −1 at zero voltage)
 *   ausgleichen: a reaction equation with coefficients; atoms and charges are counted on both sides.
 *     params: left ["CH4", "O2"], right ["CO2", "H2O"] (ions with a caret: "Fe^3+", "MnO4^-"), coef (start), max
 *     scope:  balanced, minimal (gcd 1), c1 .. cn (coefficients from left to right)
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    return ok ? { correct: true } : { correct: false, detail: goal.message || null };
  }
  function stepper(parent, label, value, step, min, max, onChange, digits) {
    const wrap = LW.el("span", { class: "lw-stp" });
    if (label) wrap.append(LW.el("span", { class: "lw-stp-label", html: label }));
    const minus = LW.el("button", { type: "button", class: "lw-stp-btn", text: "−", "aria-label": "kleiner" });
    const val = LW.el("span", { class: "lw-stp-val" });
    const plus = LW.el("button", { type: "button", class: "lw-stp-btn", text: "+", "aria-label": "größer" });
    wrap.append(minus, val, plus);
    parent.append(wrap);
    let v = value;
    const show = () => { val.textContent = K.fmt(v, digits == null ? 2 : digits); };
    const set = (x) => { v = +(Math.round(K.clamp(x, min, max) / step) * step).toFixed(6); show(); };
    minus.addEventListener("click", () => { set(v - step); onChange(v); });
    plus.addEventListener("click", () => { set(v + step); onChange(v); });
    set(value);
    return { el: wrap, get: () => v, set };
  }

  // ---------------------------------------------------------------- chemical equilibrium
  const REACTIONS = {
    ester: { names: ["Essigsäure", "Ethanol", "Ester", "Wasser"], nu: [1, 1, 1, 1], K: 4, dH: 0, tex: "\\mathrm{CH_3COOH + C_2H_5OH \\rightleftharpoons CH_3COOC_2H_5 + H_2O}" },
    hi: { names: ["H₂", "I₂", "HI", ""], nu: [1, 1, 2, 0], K: 50, dH: -9.5, T0: 723, tex: "\\mathrm{H_2 + I_2 \\rightleftharpoons 2\\,HI}" },
    no2: { names: ["N₂O₄", "", "NO₂", ""], nu: [1, 0, 2, 0], K: 0.36, dH: 57, T0: 373, tex: "\\mathrm{N_2O_4 \\rightleftharpoons 2\\,NO_2}" },
    allgemein: { names: ["A", "B", "C", "D"], nu: [1, 1, 1, 1], K: 1, dH: 0, tex: "\\mathrm{A + B \\rightleftharpoons C + D}" },
  };
  /** Equilibrium for start concentrations c0 and constant Kc: the extent x with Q(x) = K (bisection). */
  function equilibrium(R, c0, Kc) {
    const nu = R.nu;
    const conc = (x) => [c0[0] - nu[0] * x, c0[1] - nu[1] * x, c0[2] + nu[2] * x, c0[3] + nu[3] * x];
    const Q = (c) => {
      let num = 1, den = 1;
      if (nu[2]) num *= Math.pow(c[2], nu[2]);
      if (nu[3]) num *= Math.pow(c[3], nu[3]);
      if (nu[0]) den *= Math.pow(c[0], nu[0]);
      if (nu[1]) den *= Math.pow(c[1], nu[1]);
      return den > 0 ? num / den : Infinity;
    };
    // the extent lies between the limits that keep every concentration non-negative
    let lo = -Infinity, hi = Infinity;
    [0, 1].forEach((i) => { if (nu[i]) hi = Math.min(hi, c0[i] / nu[i]); });
    [2, 3].forEach((i) => { if (nu[i]) lo = Math.max(lo, -c0[i] / nu[i]); });
    if (!isFinite(hi)) hi = 10;
    if (!isFinite(lo)) lo = -10;
    let a = lo, b = hi;
    for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (Q(conc(m)) < Kc) a = m; else b = m; }
    const x = (a + b) / 2;
    return { x, c: conc(x), Q0: Q(c0), xmax: hi };
  }
  LW.widget("gleichgewicht", {
    mount(host, p, ctx) {
      const R = REACTIONS[p.reaction] || REACTIONS.ester;
      const c0 = (p.c0 || [1, 1, 0, 0]).slice();
      let T = p.T || R.T0 || 298;
      const edit = p.edit || ["a0", "b0", "c0", "d0"];
      const Kof = () => (R.dH ? R.K * Math.exp((-R.dH * 1000 / 8.314) * (1 / T - 1 / R.T0)) : p.K != null && p.reaction === "allgemein" ? p.K : R.K);
      host.append(LW.el("div", { class: "lw-lab-tex lw-gg-eq", html: LW.math(R.tex) }));
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const steps = {};
      ["a0", "b0", "c0", "d0"].forEach((key, i) => {
        if (!R.nu[i] || !edit.includes(key)) return;
        steps[key] = stepper(ed, LW.esc(R.names[i]) + " " + LW.math("c_0"), c0[i], 0.1, 0, 5, (v) => { c0[i] = v; paint(); ctx.changed(); }, 1);
      });
      let sT = null;
      if (R.dH && edit.includes("T")) sT = K.slider(host, { label: "T", labelHtml: LW.math("T"), min: Math.round((R.T0 - 150) / 5) * 5, max: Math.round((R.T0 + 150) / 5) * 5, step: 5, value: T, format: (x) => K.fmt(x, 0) + " K", onInput: (x) => { T = x; paint(); ctx.changed(); } });
      const W = 360, H = 210;
      const svg = K.root(host, W, H, "Konzentrationen am Anfang und im Gleichgewicht");
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      function scope() {
        const Kc = Kof(), e = equilibrium(R, c0, Kc);
        const lim = Math.min(...[0, 1].filter((i) => R.nu[i]).map((i) => c0[i] / R.nu[i]));
        const yieldC = isFinite(lim) && lim > 0 ? (e.c[2] - c0[2]) / (R.nu[2] * lim) : 0;
        return { a0: c0[0], b0: c0[1], c0: c0[2], d0: c0[3], cA: e.c[0], cB: e.c[1], cC: e.c[2], cD: e.c[3], K: Kc, Q0: e.Q0, dir: Math.abs(e.x) < 1e-9 ? 0 : e.x > 0 ? 1 : -1, yield: yieldC, T };
      }
      function paint() {
        K.clear(g);
        const sc = scope();
        const idx = [0, 1, 2, 3].filter((i) => R.nu[i]);
        const vmax = Math.max(0.5, ...c0, sc.cA, sc.cB, sc.cC, sc.cD);
        const bw = (W - 40) / idx.length;
        idx.forEach((i, k) => {
          const x = 30 + k * bw, start = c0[i], eq = [sc.cA, sc.cB, sc.cC, sc.cD][i];
          const h0 = (150 * start) / vmax, h1 = (150 * eq) / vmax;
          K.svg("rect", { x: x + 6, y: 175 - h0, width: bw / 2 - 10, height: h0, rx: 3, fill: "var(--label-3)", opacity: 0.6 }, g);
          K.svg("rect", { x: x + bw / 2, y: 175 - h1, width: bw / 2 - 10, height: h1, rx: 3, fill: i < 2 ? "var(--blue)" : "var(--orange)" }, g);
          K.text(g, x + bw / 2, 192, R.names[i], "s-text-strong");
          K.text(g, x + bw * 0.75 - 5, 168 - h1, K.fmt(eq, 2), "s-text");
        });
        K.text(g, 30, 12, "grau: Anfang · farbig: Gleichgewicht (mol/L)", "s-text", "start");
        const dirTxt = sc.dir > 0 ? "läuft nach rechts (Q < K)" : sc.dir < 0 ? "läuft nach links (Q > K)" : "ist schon im Gleichgewicht";
        out.set(LW.esc("K = " + K.fmt(sc.K, 3) + (R.dH ? " bei T = " + K.fmt(T, 0) + " K" : "") + " · Q am Anfang = " + (isFinite(sc.Q0) ? K.fmt(sc.Q0, 3) : "∞") + ": Die Reaktion " + dirTxt + ".") + "<br>" +
          LW.esc("Ausbeute an " + R.names[2] + ": " + K.fmt(sc.yield * 100, 1) + " % des Möglichen"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          ["a0", "b0", "c0", "d0"].forEach((key, i) => { if (s[key] != null) { c0[i] = s[key]; if (steps[key]) steps[key].set(c0[i]); } });
          if (s.T != null) { T = s.T; if (sT) sT.set(T); }
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- galvanic cells
  const METALS = [
    { id: "Mg", ion: "Mg²⁺", z: 2, E: -2.37 }, { id: "Zn", ion: "Zn²⁺", z: 2, E: -0.76 }, { id: "Fe", ion: "Fe²⁺", z: 2, E: -0.41 }, { id: "Pb", ion: "Pb²⁺", z: 2, E: -0.13 },
    { id: "H2", ion: "H⁺", z: 1, E: 0, name: "H₂ (Pt)" }, { id: "Cu", ion: "Cu²⁺", z: 2, E: 0.34 }, { id: "Ag", ion: "Ag⁺", z: 1, E: 0.8 },
  ];
  const CONC = [0.001, 0.01, 0.1, 1];
  LW.widget("galvani", {
    mount(host, p, ctx) {
      let m = [METALS.findIndex((x) => x.id === (p.left || "Zn")), METALS.findIndex((x) => x.id === (p.right || "Cu"))];
      const c = (p.c || [1, 1]).slice();
      const edit = p.edit || ["left", "right", "c1", "c2"];
      const rows = [], caps = [null, null];
      // one block per half-cell: its metal, then the concentration of its ions (the caption follows the metal)
      [0, 1].forEach((side) => {
        const sec = LW.el("div", { class: "lw-gv-sec" });
        host.append(sec);
        const head = LW.el("div", { class: "lw-mol-head" }, [LW.el("span", { text: side ? "Rechte Halbzelle" : "Linke Halbzelle" })]);
        sec.append(head);
        const metalLabel = (i) => (METALS[i].id === "H2" ? "H₂" : METALS[i].id);
        if (edit.includes(side ? "right" : "left")) rows.push(K.segmented(sec, METALS.map((x, i) => ({ id: String(i), label: metalLabel(i) })), String(m[side]), (id) => { m[side] = +id; paint(); ctx.changed(); }));
        else head.append(LW.el("span", { class: "lw-mol-headinfo", text: METALS[m[side]].name || METALS[m[side]].id }));
        if (edit.includes("c" + (side + 1))) {
          const r2 = LW.el("div", { class: "lw-gv-c" });
          sec.append(r2);
          r2.append(LW.el("span", { class: "lw-mol-cap", html: "c(" + LW.esc(METALS[m[side]].ion) + ")" }));
          rows.push(K.segmented(r2, CONC.map((x) => ({ id: String(x), label: K.fmt(x, 3) })), String(c[side]), (id) => { c[side] = +id; paint(); ctx.changed(); }));
          r2.append(LW.el("span", { class: "lw-mol-cap", text: "mol/L" }));
          caps[side] = r2.firstChild;
        }
      });
      const W = 360, H = 220;
      const svg = K.root(host, W, H, "Galvanisches Element");
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const nernst = (i, conc) => METALS[m[i]].E + (0.0592 / METALS[m[i]].z) * Math.log10(conc);
      function scope() {
        const E1 = nernst(0, c[0]), E2 = nernst(1, c[1]);
        return { U: Math.abs(E2 - E1), E1, E2, c1: c[0], c2: c[1], anode: E1 < E2 ? 1 : E1 > E2 ? 2 : 0, m1: m[0], m2: m[1], z1: METALS[m[0]].z, z2: METALS[m[1]].z,
          kat: E1 < E2 ? m[1] : E1 > E2 ? m[0] : -1, ano: E1 < E2 ? m[0] : E1 > E2 ? m[1] : -1 };
      }
      function paint() {
        K.clear(g);
        const sc = scope();
        caps.forEach((cp, side) => { if (cp) cp.textContent = "c(" + METALS[m[side]].ion + ")"; });
        const beaker = (x, i) => {
          K.svg("path", { d: "M" + (x - 55) + ",80 L" + (x - 55) + ",190 L" + (x + 55) + ",190 L" + (x + 55) + ",80", fill: "none", stroke: "var(--label-3)", "stroke-width": 2 }, g);
          K.svg("rect", { x: x - 53, y: 110, width: 106, height: 78, fill: i === 0 ? "var(--blue)" : "var(--teal)", opacity: 0.18 }, g);
          K.svg("rect", { x: x - 9, y: 60, width: 18, height: 110, fill: METALS[m[i]].id === "H2" ? "var(--label-3)" : "var(--orange)", opacity: 0.8 }, g);
          K.text(g, x, 202, (METALS[m[i]].name || METALS[m[i]].id) + " / " + METALS[m[i]].ion + " " + K.fmt(c[i], 3) + " M", "s-text");
          const role = sc.anode === i + 1 ? "Anode (−), Oxidation" : sc.anode && sc.anode !== i + 1 ? "Kathode (+), Reduktion" : "";
          K.text(g, x, 46, role, "s-text-strong");
        };
        beaker(90, 0); beaker(270, 1);
        K.svg("path", { d: "M115,120 L115,95 L245,95 L245,120", fill: "none", stroke: "var(--label-2)", "stroke-width": 8, opacity: 0.35 }, g);
        K.text(g, 180, 108, "Salzbrücke", "s-text");
        K.svg("polyline", { points: "90,60 90,24 270,24 270,60", fill: "none", stroke: "var(--label-2)", "stroke-width": 2 }, g);
        K.svg("circle", { cx: 180, cy: 24, r: 15, fill: "var(--card-solid)", stroke: "var(--label)", "stroke-width": 2 }, g);
        K.text(g, 180, 24, "V", "s-text-strong");
        if (sc.anode) { const ar = K.arrow(g, sc.anode === 1 ? 120 : 240, 14, sc.anode === 1 ? 150 : 210, 14, null, 1.8); ar.style.stroke = "var(--accent)"; ar.style.fill = "var(--accent)"; K.text(g, sc.anode === 1 ? 135 : 225, 4, "e⁻", "s-text"); }
        out.set("<b>" + LW.esc("U = " + K.fmt(sc.U, 3) + " V") + "</b>" + LW.esc(" · links E = " + K.fmt(sc.E1, 3) + " V, rechts E = " + K.fmt(sc.E2, 3) + " V (Nernst: E = E° + 0,059 V / z · lg c)"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.left) m[0] = METALS.findIndex((x) => x.id === s.left);
          if (s.right) m[1] = METALS.findIndex((x) => x.id === s.right);
          if (s.c) { c[0] = s.c[0]; c[1] = s.c[1]; }
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- balancing equations
  /** "Fe2(SO4)3" -> {Fe: 2, S: 3, O: 12}. Ions carry their charge after a caret: "Fe^3+", "MnO4^-", "Cr2O7^2-". */
  function parseFormula(f) {
    let s = String(f), charge = 0;
    const k = s.indexOf("^");
    if (k >= 0) {
      const cm = /^(\d*)([+-])$/.exec(s.slice(k + 1));
      if (cm) charge = (cm[2] === "+" ? 1 : -1) * (cm[1] ? +cm[1] : 1);
      s = s.slice(0, k);
    }
    let i = 0;
    function group() {
      const out = {};
      while (i < s.length && s[i] !== ")") {
        if (s[i] === "(") { i++; const inner = group(); i++; const n = num(); Object.keys(inner).forEach((k) => { out[k] = (out[k] || 0) + inner[k] * n; }); continue; }
        const m = /^[A-Z][a-z]?/.exec(s.slice(i));
        if (!m) { i++; continue; }
        i += m[0].length;
        const n = num();
        out[m[0]] = (out[m[0]] || 0) + n;
      }
      return out;
    }
    function num() { const m = /^\d+/.exec(s.slice(i)); if (!m) return 1; i += m[0].length; return +m[0]; }
    const atoms = group();
    return { atoms, charge };
  }
  const sub = (f) => { const k = f.indexOf("^"), body = k >= 0 ? f.slice(0, k) : f, ch = k >= 0 ? "^{" + f.slice(k + 1) + "}" : ""; return body.replace(/([A-Za-z)])(\d+)/g, "$1_{$2}") + ch; };
  LW.widget("ausgleichen", {
    mount(host, p, ctx) {
      const left = p.left || ["CH4", "O2"], right = p.right || ["CO2", "H2O"];
      const species = left.concat(right);
      const coef = (p.coef || species.map(() => 1)).slice();
      const max = p.max || 12;
      const parsed = species.map(parseFormula);
      const row = LW.el("div", { class: "lw-eq-row" });
      host.append(row);
      const steps = [];
      species.forEach((f, i) => {
        if (i === left.length) row.append(LW.el("span", { class: "lw-eq-arrow", html: LW.math("\\longrightarrow") }));
        else if (i > 0) row.append(LW.el("span", { class: "lw-eq-plus", text: "+" }));
        const cell = LW.el("span", { class: "lw-eq-cell" });
        row.append(cell);
        steps.push(stepper(cell, null, coef[i], 1, 1, max, (v) => { coef[i] = v; paint(); ctx.changed(); }, 0));
        cell.append(LW.el("span", { class: "lw-eq-species", html: LW.math("\\mathrm{" + sub(f) + "}") }));
      });
      const table = LW.el("div", { class: "lw-logic-table" });
      host.append(table);
      const out = K.readout(host);
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      function counts() {
        const els = [];
        parsed.forEach((q) => Object.keys(q.atoms).forEach((e) => { if (!els.includes(e)) els.push(e); }));
        const L = {}, R2 = {};
        els.forEach((e) => { L[e] = 0; R2[e] = 0; });
        let qL = 0, qR = 0;
        parsed.forEach((q, i) => {
          const side = i < left.length ? L : R2;
          Object.keys(q.atoms).forEach((e) => { side[e] += coef[i] * q.atoms[e]; });
          if (i < left.length) qL += coef[i] * q.charge; else qR += coef[i] * q.charge;
        });
        return { els, L, R: R2, qL, qR };
      }
      function scope() {
        const c = counts();
        const balanced = c.els.every((e) => c.L[e] === c.R[e]) && c.qL === c.qR ? 1 : 0;
        const sc = { balanced, minimal: coef.reduce((a, b) => gcd(a, b)) === 1 ? 1 : 0 };
        coef.forEach((x, i) => { sc["c" + (i + 1)] = x; });
        return sc;
      }
      function paint() {
        const c = counts(), sc = scope();
        const charged = parsed.some((q) => q.charge);
        table.innerHTML = "<table><thead><tr><th></th><th>links</th><th>rechts</th></tr></thead><tbody>" +
          c.els.map((e) => '<tr><td><b>' + e + '</b></td><td class="' + (c.L[e] === c.R[e] ? "same" : "diff") + '">' + c.L[e] + '</td><td class="' + (c.L[e] === c.R[e] ? "same" : "diff") + '">' + c.R[e] + "</td></tr>").join("") +
          (charged ? '<tr><td><b>Ladung</b></td><td class="' + (c.qL === c.qR ? "same" : "diff") + '">' + c.qL + '</td><td class="' + (c.qL === c.qR ? "same" : "diff") + '">' + c.qR + "</td></tr>" : "") + "</tbody></table>";
        out.set(sc.balanced ? (sc.minimal ? K.pill(true, "ausgeglichen, kleinste ganze Zahlen") : K.pill(true, "ausgeglichen") + " " + LW.esc("Kürzen möglich: Die Koeffizienten haben einen gemeinsamen Teiler.")) : K.pill(false, "noch nicht ausgeglichen"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) { const s = (goal && goal.solve) || {}; if (s.coef) s.coef.forEach((x, i) => { coef[i] = x; steps[i].set(x); }); paint(); },
        getVar: (k) => scope()[k],
      };
    },
  });

  LW.labChem2 = { equilibrium, REACTIONS, METALS, parseFormula };
})();
