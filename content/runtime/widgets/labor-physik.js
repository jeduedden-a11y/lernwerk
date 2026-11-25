/* Physics labs.
 *
 *   feldlabor: point charges in the plane. Drag the charges, change their sign and size; the field shows as arrows,
 *     a probe point P shows E and the potential there.
 *     params: charges [{x, y, q}] (q in nC, positions in cm), probe [x, y], edit (charges movable, default true), addable
 *     scope:  E (|E| at P in kN/C), Ex, Ey, phi (potential at P in kV), n (number of charges), q1.., x1.., y1.., Q (sum of charges)
 *   schaltung: resistors in a fixed circuit; the learner sets the resistances and the voltage, the lab shows currents and voltages.
 *     params: topo "reihe" | "parallel" | "gemischt" (R1 in series with R2 ∥ R3) | "teiler" (voltage divider R1, R2), R [R1, R2, R3], U0, edit
 *     scope:  R1, R2, R3, U0, Rg (total), I (total current), U1.., I1.., P (total power)
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

  // ---------------------------------------------------------------- electric field of point charges
  const kC = 8.988e9;
  LW.widget("feldlabor", {
    mount(host, p, ctx) {
      const ch = (p.charges || [{ x: -2, y: 0, q: 2 }, { x: 2, y: 0, q: -2 }]).map((c) => ({ x: c.x, y: c.y, q: c.q }));
      const probe = (p.probe || [0, 2]).slice();
      const edit = p.edit !== false;
      const W = 360, H = 300, R = 5;
      const sx = K.scale(-R, R, 10, W - 10), sy = K.scale(-R * (H / W), R * (H / W), H - 10, 10);
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const steps = [];
      function buildEd() {
        ed.innerHTML = ""; steps.length = 0;
        ch.forEach((c, i) => steps.push(stepper(ed, LW.math("q_" + (i + 1)), c.q, 0.5, -10, 10, (v) => { c.q = v; paint(); ctx.changed(); }, 1)));
      }
      if (edit) buildEd();
      const svg = K.root(host, W, H, "Elektrisches Feld von Punktladungen");
      svg.style.touchAction = "none";
      const g = K.svg("g", null, svg), top = K.svg("g", null, svg);
      const out = K.readout(host);
      // field in SI: positions cm -> m, charges nC -> C
      function field(x, y) {
        let ex = 0, ey = 0, phi = 0;
        ch.forEach((c) => {
          const dx = (x - c.x) / 100, dy = (y - c.y) / 100, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
          if (r < 1e-6) return;
          const q = c.q * 1e-9, e = (kC * q) / r2;
          ex += (e * dx) / r; ey += (e * dy) / r; phi += (kC * q) / r;
        });
        return { ex, ey, phi };
      }
      // handles: charges and the probe
      const handles = ch.map((c, i) => {
        const h = K.svg("g", { style: "cursor:grab" }, top);
        const circ = K.svg("circle", { r: 13 }, h);
        const t = K.text(h, 0, 0.5, "", "lw-mol-label");
        if (edit) K.drag(svg, h, (q) => { c.x = +K.clamp(K.snap(sx.inv(q.x), 0.5), -R + 0.5, R - 0.5).toFixed(2); c.y = +K.clamp(K.snap(sy.inv(q.y), 0.5), -3.5, 3.5).toFixed(2); paint(); ctx.changed(); });
        return { h, circ, t };
      });
      const ph = K.svg("g", { style: "cursor:grab" }, top);
      K.svg("circle", { r: 7, fill: "var(--label)", stroke: "var(--card-solid)", "stroke-width": 2 }, ph);
      const pt = K.text(ph, 12, -12, "P", "s-text-strong");
      void pt;
      K.drag(svg, ph, (q) => { probe[0] = +K.clamp(K.snap(sx.inv(q.x), 0.25), -R, R).toFixed(2); probe[1] = +K.clamp(K.snap(sy.inv(q.y), 0.25), -3.9, 3.9).toFixed(2); paint(); ctx.changed(); });
      function scope() {
        const f = field(probe[0], probe[1]);
        const sc = { E: Math.hypot(f.ex, f.ey) / 1000, Ex: f.ex / 1000, Ey: f.ey / 1000, phi: f.phi / 1000, n: ch.length, Q: ch.reduce((s, c) => s + c.q, 0), px: probe[0], py: probe[1] };
        ch.forEach((c, i) => { sc["q" + (i + 1)] = c.q; sc["x" + (i + 1)] = c.x; sc["y" + (i + 1)] = c.y; });
        return sc;
      }
      function paint() {
        K.clear(g);
        // potential shading in a coarse grid
        for (let i = 0; i < 24; i++) for (let j = 0; j < 20; j++) {
          const x = -R + (2 * R * (i + 0.5)) / 24, y = sy.inv(10 + ((H - 20) * (j + 0.5)) / 20);
          const v = field(x, y).phi / 1000;
          const a = Math.max(-1, Math.min(1, v / 1.5));
          K.svg("rect", { x: sx(x - R / 24), y: 10 + ((H - 20) * j) / 20, width: (W - 20) / 24 + 0.5, height: (H - 20) / 20 + 0.5, fill: a > 0 ? "var(--red)" : "var(--blue)", opacity: Math.abs(a) * 0.28 }, g);
        }
        // field arrows, direction with length growing slowly with |E|
        for (let i = 0; i < 15; i++) for (let j = 0; j < 12; j++) {
          const x = -R + (2 * R * (i + 0.5)) / 15, y = sy.inv(10 + ((H - 20) * (j + 0.5)) / 12);
          if (ch.some((c) => Math.hypot(x - c.x, y - c.y) < 0.6)) continue;
          const f = field(x, y), e = Math.hypot(f.ex, f.ey);
          if (!(e > 0)) continue;
          const L = Math.min(16, 4 + 3 * Math.log10(1 + e / 2000));
          const ux = f.ex / e, uy = f.ey / e, X = sx(x), Y = sy(y);
          const ar = K.arrow(g, X - (ux * L) / 2, Y + (uy * L) / 2, X + (ux * L) / 2, Y - (uy * L) / 2, null, 1.4);
          ar.style.stroke = "var(--label-3)"; ar.style.fill = "var(--label-3)";
        }
        // probe vector
        const f = field(probe[0], probe[1]), e = Math.hypot(f.ex, f.ey);
        if (e > 0) {
          const L = Math.min(70, 12 + 14 * Math.log10(1 + e / 1000));
          const ar = K.arrow(g, sx(probe[0]), sy(probe[1]), sx(probe[0]) + (f.ex / e) * L, sy(probe[1]) - (f.ey / e) * L, null, 2.6);
          ar.style.stroke = "var(--accent)"; ar.style.fill = "var(--accent)";
        }
        handles.forEach((hd, i) => {
          const c = ch[i];
          hd.h.setAttribute("transform", "translate(" + sx(c.x) + "," + sy(c.y) + ")");
          hd.circ.setAttribute("fill", c.q > 0 ? "var(--red)" : c.q < 0 ? "var(--blue)" : "var(--label-3)");
          hd.t.textContent = c.q > 0 ? "+" : c.q < 0 ? "−" : "0";
        });
        ph.setAttribute("transform", "translate(" + sx(probe[0]) + "," + sy(probe[1]) + ")");
        const sc = scope();
        out.set(LW.esc("Im Punkt P(" + K.fmt(probe[0], 2) + " | " + K.fmt(probe[1], 2) + ") cm: |E| = " + K.fmt(sc.E, 2) + " kN/C, Potenzial φ = " + K.fmt(sc.phi, 2) + " kV") + "<br>" +
          LW.esc("Ladungen: " + ch.map((c, i) => "q" + (i + 1) + " = " + K.fmt(c.q, 1) + " nC bei (" + K.fmt(c.x, 1) + " | " + K.fmt(c.y, 1) + ")").join(", ")));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          (s.charges || []).forEach((c, i) => { if (ch[i]) Object.assign(ch[i], c); });
          if (s.probe) { probe[0] = s.probe[0]; probe[1] = s.probe[1]; }
          steps.forEach((st, i) => st.set(ch[i].q));
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- resistor circuits
  LW.widget("schaltung", {
    mount(host, p, ctx) {
      const topo = p.topo || "gemischt";
      const R = (p.R || [100, 200, 300]).slice();
      let U0 = p.U0 || 12;
      const edit = p.edit || ["R1", "R2", "R3", "U0"];
      const nR = topo === "gemischt" ? 3 : 2;
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const steps = {};
      for (let i = 0; i < nR; i++) if (edit.includes("R" + (i + 1))) steps["R" + (i + 1)] = stepper(ed, LW.math("R_" + (i + 1)), R[i], 10, 10, 1000, (v) => { R[i] = v; paint(); ctx.changed(); }, 0);
      if (edit.includes("U0")) steps.U0 = stepper(ed, LW.math("U_0"), U0, 0.5, 0.5, 30, (v) => { U0 = v; paint(); ctx.changed(); }, 1);
      const W = 360, H = 200;
      const svg = K.root(host, W, H, "Schaltplan");
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      function solve() {
        const [a, b, c] = R;
        let Rg, I, U = [], Ii = [];
        if (topo === "reihe" || topo === "teiler") { Rg = a + b; I = U0 / Rg; U = [I * a, I * b]; Ii = [I, I]; }
        else if (topo === "parallel") { Rg = (a * b) / (a + b); I = U0 / Rg; U = [U0, U0]; Ii = [U0 / a, U0 / b]; }
        else { const Rp = (b * c) / (b + c); Rg = a + Rp; I = U0 / Rg; const Up = I * Rp; U = [I * a, Up, Up]; Ii = [I, Up / b, Up / c]; }
        return { Rg, I, U, Ii };
      }
      function scope() {
        const s = solve(), sc = { U0, Rg: s.Rg, I: s.I, P: U0 * s.I };
        for (let i = 0; i < nR; i++) { sc["R" + (i + 1)] = R[i]; sc["U" + (i + 1)] = s.U[i]; sc["I" + (i + 1)] = s.Ii[i]; }
        return sc;
      }
      // schematic helpers
      const wire = (pts) => K.svg("polyline", { points: pts.map((q) => q.join(",")).join(" "), fill: "none", stroke: "var(--label-2)", "stroke-width": 2 }, g);
      const resistor = (x, y, horiz, label, val) => {
        const w = horiz ? 46 : 16, h = horiz ? 16 : 46;
        K.svg("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 3, fill: "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2 }, g);
        K.text(g, x + (horiz ? 0 : 26), y + (horiz ? -18 : 0), label, "s-text-strong", horiz ? "middle" : "start");
        K.text(g, x + (horiz ? 0 : 26), y + (horiz ? 22 : 14), val, "s-text", horiz ? "middle" : "start");
      };
      function paint() {
        K.clear(g);
        const s = solve();
        const L = 40, Rr = 320, T = 40, B = 160;
        // source on the left
        wire([[L, T], [L, 85]]); wire([[L, 115], [L, B]]);
        K.svg("line", { x1: L - 14, y1: 92, x2: L + 14, y2: 92, stroke: "var(--label)", "stroke-width": 3 }, g);
        K.svg("line", { x1: L - 8, y1: 106, x2: L + 8, y2: 106, stroke: "var(--label)", "stroke-width": 3 }, g);
        K.text(g, L - 22, 100, K.fmt(U0, 1) + " V", "s-text-strong", "end");
        const lab = (i) => K.fmt(R[i], 0) + " Ω · " + K.fmt(s.U[i], 2) + " V · " + K.fmt(s.Ii[i] * 1000, 1) + " mA";
        if (topo === "reihe" || topo === "teiler") {
          wire([[L, T], [130, T]]); resistor(153, T, true, "R₁", ""); wire([[176, T], [Rr, T], [Rr, 77]]);
          resistor(Rr, 100, false, "R₂", ""); wire([[Rr, 123], [Rr, B], [L, B]]);
          K.text(g, 153, T + 24, lab(0), "s-text");
          K.text(g, Rr - 12, 100, lab(1), "s-text", "end");
        } else {
          // vertical resistors: name and current to the right of each, the common voltage between the rails
          const par = topo === "parallel", xs = par ? [[170, 0], [290, 1]] : [[190, 1], [290, 2]], end = 290;
          if (par) wire([[L, T], [end, T]]);
          else { wire([[L, T], [100, T]]); resistor(123, T, true, "R₁", ""); wire([[146, T], [end, T]]); K.text(g, 123, T + 24, lab(0), "s-text"); }
          wire([[L, B], [end, B]]);
          xs.forEach(([x, i]) => {
            wire([[x, T], [x, 77]]); wire([[x, 123], [x, B]]);
            K.svg("rect", { x: x - 8, y: 77, width: 16, height: 46, rx: 3, fill: "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2 }, g);
            K.text(g, x + 13, 91, "R" + "₁₂₃"[i], "s-text-strong", "start");
            K.text(g, x + 13, 109, K.fmt(s.Ii[i] * 1000, 1) + " mA", "s-text", "start");
          });
          K.text(g, (xs[0][0] + xs[1][0]) / 2 + 4, 147, (par ? "U₁ = U₂ = " : "U₂ = U₃ = ") + K.fmt(s.U[xs[0][1]], 2) + " V", "s-text");
        }
        out.set(LW.esc("Gesamtwiderstand " + K.fmt(s.Rg, 2) + " Ω · Gesamtstrom " + K.fmt(s.I * 1000, 2) + " mA · Leistung " + K.fmt(U0 * s.I, 3) + " W") + "<br>" +
          LW.esc(R.slice(0, nR).map((r, i) => "R" + (i + 1) + ": " + K.fmt(s.U[i], 2) + " V, " + K.fmt(s.Ii[i] * 1000, 2) + " mA").join(" · ")));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          (s.R || []).forEach((r, i) => { if (r != null) R[i] = r; });
          if (s.U0 != null) U0 = s.U0;
          for (let i = 0; i < nR; i++) if (steps["R" + (i + 1)]) steps["R" + (i + 1)].set(R[i]);
          if (steps.U0) steps.U0.set(U0);
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });
})();
