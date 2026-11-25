/* Economics labs.
 *
 *   marktlabor: linear demand P = a − bQ and supply P = c + dQ, a quantity tax paid by the sellers, a price ceiling or floor.
 *     params: a, b, c, d, t, ctrl "keine" | "hoechst" | "mindest", pc (the controlled price), edit [a, b, c, d, t, pc, ctrl], qMax, pMax
 *     scope:  a, b, c, d, t, pc, ctrl (0 none, 1 ceiling, 2 floor), Q0, P0 (equilibrium without intervention), Q (traded), Pk (buyers'
 *             price), Pv (sellers' price), T (tax revenue), KR, PR (consumer and producer surplus), W (total), DWL, short (excess demand),
 *             excess (excess supply), bind (control binds), shareK (buyers' share of the tax), U (buyers' spending), eps (price elasticity
 *             of demand at the market point)
 *   spiellabor: a 2×2 game in normal form; tap a payoff and change it with the stepper below the table.
 *     params: A [[a11, a12], [a21, a22]], B [[b11, b12], [b21, b22]], edit ["a11", ...] or "all", rows, cols (strategy names), min, max
 *     scope:  a11..a22, b11..b22, nash (pure equilibria), n11..n22 (1 if equilibrium), domA, domB (0 none, 1 first, 2 second strategy
 *             strictly dominant), par11..par22 (Pareto-optimal), dilemma (every pure equilibrium is Pareto-dominated), p, q (mixed
 *             equilibrium: first row, first column; −1 if none), sym (B's payoffs mirror A's)
 *   haushalt: budget line m = px·x + py·y and Cobb-Douglas utility U = x^α·y^(1−α). Drag the bundle, change income, prices, α.
 *     params: m, px, py, alpha, x, y (bundle), edit [bundle, m, px, py, alpha], xMax, yMax, step (grid of the bundle), showOpt,
 *             ghost {m, px, py} (an earlier budget line, dashed)
 *     scope:  m, px, py, alpha, x, y, cost, feasible, onLine, U, Ustar, xs, ys (optimum), opt (bundle is the optimum), mrs, ratio, share
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
    const lab = LW.el("span", { class: "lw-stp-label", html: label || "" });
    if (label != null) wrap.append(lab);
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
    return { el: wrap, label: lab, get: () => v, set };
  }
  /** Number for KaTeX: German decimal comma without the extra space. */
  const tn = (x, d) => K.fmt(x, d == null ? 2 : d).replace("−", "-").replace(",", "{,}");
  const legendChip = (color, text) => '<span class="lw-mk-chip"><i style="background:' + color + '"></i>' + LW.esc(text) + "</span>";

  // ---------------------------------------------------------------- market with tax and price controls
  LW.widget("marktlabor", {
    mount(host, p, ctx) {
      const v = { a: p.a != null ? p.a : 12, b: p.b != null ? p.b : 1, c: p.c != null ? p.c : 2, d: p.d != null ? p.d : 1, t: p.t || 0, pc: p.pc != null ? p.pc : 5 };
      let ctrl = Math.max(0, ["keine", "hoechst", "mindest"].indexOf(p.ctrl || "keine"));
      const edit = p.edit || ["a", "c", "t"];
      const Qm = p.qMax || 10, Pm = p.pMax || 14;
      const tex = LW.el("div", { class: "lw-lab-tex lw-mk-tex" });
      host.append(tex);
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const SPEC = { a: [0.5, 1, 30, 1, "a"], b: [0.25, 0.25, 5, 2, "b"], c: [0.5, 0, 20, 1, "c"], d: [0.25, 0.25, 5, 2, "d"], t: [0.5, 0, 12, 1, "t"], pc: [0.5, 0, 30, 1, "\\bar p"] };
      const steps = {};
      Object.keys(SPEC).forEach((k) => {
        if (!edit.includes(k)) return;
        const [st, lo, hi, dg, nm] = SPEC[k];
        steps[k] = stepper(ed, LW.math(nm), v[k], st, lo, hi, (x) => { v[k] = x; paint(); ctx.changed(); }, dg);
      });
      let seg = null;
      if (edit.includes("ctrl")) seg = K.segmented(host, [{ id: "0", label: "Kein Eingriff" }, { id: "1", label: "Höchstpreis" }, { id: "2", label: "Mindestpreis" }], String(ctrl), (id) => { ctrl = +id; paint(); ctx.changed(); });
      const W = 360, H = 280;
      const svg = K.root(host, W, H, "Markt mit Angebot und Nachfrage");
      const x = K.scale(0, Qm, 40, W - 14), y = K.scale(0, Pm, H - 30, 14);
      const clipId = "lwmk" + Math.random().toString(36).slice(2, 8);
      const cp = K.svg("clipPath", { id: clipId }, K.svg("defs", null, svg));
      K.svg("rect", { x: x(0), y: y(Pm), width: x(Qm) - x(0), height: y(0) - y(Pm) }, cp);
      const axes = K.svg("g", null, svg);
      const g = K.svg("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      const top = K.svg("g", null, svg);
      K.ticks(0, Pm, 6).forEach((tk) => { K.svg("line", { x1: x(0), y1: y(tk), x2: x(Qm), y2: y(tk), class: "s-grid" }, axes); K.text(axes, x(0) - 6, y(tk), K.fmt(tk, 1), "s-text", "end"); });
      K.ticks(0, Qm, 5).forEach((tk) => K.text(axes, x(tk), H - 18, K.fmt(tk, 1)));
      K.svg("line", { x1: x(0), y1: y(0), x2: x(Qm), y2: y(0), class: "s-axis" }, axes);
      K.svg("line", { x1: x(0), y1: y(0), x2: x(0), y2: y(Pm), class: "s-axis" }, axes);
      K.text(axes, x(Qm), H - 5, "Menge Q", "s-text-strong", "end");
      K.text(axes, x(0) + 6, 7, "Preis P", "s-text-strong", "start");
      const legend = LW.el("div", { class: "lw-mk-legend" });
      host.append(legend);
      const out = K.readout(host);

      function calc() {
        const { a, b, c, d, t, pc } = v;
        const Q0 = Math.max(0, (a - c) / (b + d)), P0 = a - b * Q0;
        let Q = Math.max(0, (a - c - t) / (b + d)), Pk = a - b * Q, Pv = Pk - t, short = 0, excess = 0, bind = 0;
        if ((ctrl === 1 && pc < Pk) || (ctrl === 2 && pc > Pk)) {
          bind = 1; Pk = pc; Pv = pc - t;
          const qs = Math.max(0, (Pv - c) / d), qd = Math.max(0, (a - pc) / b);
          Q = Math.min(qs, qd);
          if (ctrl === 1) short = Math.max(0, qd - qs); else excess = Math.max(0, qs - qd);
        }
        const KR = a * Q - (b * Q * Q) / 2 - Pk * Q, PR = Pv * Q - c * Q - (d * Q * Q) / 2, T = t * Q;
        const W0 = ((a - c) * Q0) / 2, Wt = KR + PR + T;
        return { a, b, c, d, t, pc, ctrl, Q0, P0, Q, Pk, Pv, T, KR, PR, W: Wt, DWL: Math.max(0, W0 - Wt), short, excess, bind,
          shareK: t > 0 && Q > 0 && !bind ? (Pk - P0) / t : 0, U: Pk * Q, eps: Q > 0 ? -(Pk / Q) / b : -Infinity };
      }
      function paint() {
        K.clear(g); K.clear(top);
        const s = calc(), { a, b, c, d, t } = v;
        const poly = (pts, fill, op) => K.svg("polygon", { points: pts.map(([q, pp]) => x(q) + "," + y(pp)).join(" "), fill, opacity: op }, g);
        if (s.Q > 0) {
          poly([[0, a], [s.Q, a - b * s.Q], [s.Q, s.Pk], [0, s.Pk]], "var(--blue)", 0.22);
          poly([[0, s.Pv], [s.Q, s.Pv], [s.Q, c + d * s.Q], [0, c]], "var(--orange)", 0.26);
          if (t > 0) poly([[0, s.Pv], [s.Q, s.Pv], [s.Q, s.Pk], [0, s.Pk]], "var(--green)", 0.3);
        }
        if (s.Q0 - s.Q > 1e-9) poly([[s.Q, a - b * s.Q], [s.Q0, s.P0], [s.Q, c + d * s.Q]], "var(--red)", 0.32);
        const ln = (p1, p2, stroke, dash, w) => K.svg("line", { x1: x(p1[0]), y1: y(p1[1]), x2: x(p2[0]), y2: y(p2[1]), stroke, "stroke-width": w || 2.4, "stroke-dasharray": dash || null, "stroke-linecap": "round" }, g);
        ln([0, a], [Qm, a - b * Qm], "var(--accent)");
        ln([0, c], [Qm, c + d * Qm], "var(--blue)");
        if (t > 0) ln([0, c + t], [Qm, c + t + d * Qm], "var(--blue)", "6 5", 1.8);
        if (ctrl) ln([0, v.pc], [Qm, v.pc], "var(--red)", "4 4", 1.8);
        // curve names where the curves are inside the chart
        const qN = Math.min(Qm * 0.93, (a / b) * 0.9), qA = Math.min(Qm * 0.93, ((Pm - c) / d) * 0.93);
        K.text(top, x(qN) + 4, y(a - b * qN) - 10, "N", "s-text-strong").style.fill = "var(--accent)";
        K.text(top, x(qA) - 10, y(c + d * qA) - 2, "A", "s-text-strong").style.fill = "var(--blue)";
        if (t > 0) { const qT = Math.min(Qm * 0.7, ((Pm - c - t) / d) * 0.8); if (qT > 0) K.text(top, x(qT) - 16, y(c + t + d * qT) - 4, "A + t", "s-text").style.fill = "var(--blue)"; }
        if (ctrl) K.text(top, x(Qm) - 4, y(v.pc) - 9, ctrl === 1 ? "Höchstpreis" : "Mindestpreis", "s-text", "end").style.fill = "var(--red)";
        // market point, prices of buyers and sellers, the free equilibrium as a ring
        if (s.Q > 0) {
          K.svg("line", { x1: x(s.Q), y1: y(Math.max(s.Pk, s.Pv)), x2: x(s.Q), y2: y(0), class: "s-grid", "stroke-dasharray": "3 3" }, top);
          K.svg("circle", { cx: x(s.Q), cy: y(s.Pk), r: 5, fill: "var(--accent)" }, top);
          if (t > 0) K.svg("circle", { cx: x(s.Q), cy: y(s.Pv), r: 4.5, fill: "var(--blue)" }, top);
        }
        if (Math.abs(s.Q0 - s.Q) > 1e-9 || Math.abs(s.P0 - s.Pk) > 1e-9) K.svg("circle", { cx: x(s.Q0), cy: y(s.P0), r: 5, fill: "var(--card-solid)", stroke: "var(--label-2)", "stroke-width": 1.8 }, top);
        tex.innerHTML = "<span>" + LW.math("\\text{Nachfrage } P = " + tn(a) + " - " + (b === 1 ? "" : tn(b) + "\\,") + "Q") + "</span><span>" + LW.math("\\text{Angebot } P = " + tn(c) + " + " + (d === 1 ? "" : tn(d) + "\\,") + "Q") + "</span>";
        legend.innerHTML = legendChip("var(--blue)", "Konsumentenrente") + legendChip("var(--orange)", "Produzentenrente") + (t > 0 ? legendChip("var(--green)", "Steuer") : "") + (s.DWL > 1e-9 ? legendChip("var(--red)", "Wohlfahrtsverlust") : "");
        const f = (z) => K.fmt(z, 2);
        const rows = [];
        rows.push(LW.esc("Ohne Eingriff: Q = " + f(s.Q0) + ", P = " + f(s.P0) + "."));
        rows.push("<b>" + LW.esc("Gehandelt: Q = " + f(s.Q) + (t > 0 || s.bind ? " · Käufer zahlen " + f(s.Pk) + " · Verkäufer erhalten " + f(s.Pv) : " · Preis " + f(s.Pk))) + "</b>");
        rows.push(LW.esc("Konsumentenrente " + f(s.KR) + " · Produzentenrente " + f(s.PR) + (t > 0 ? " · Steuer " + f(s.T) : "") + " · Wohlfahrtsverlust " + f(s.DWL)));
        if (t > 0 && !s.bind) rows.push(LW.esc("Von der Steuer tragen die Käufer " + K.fmt(s.shareK * 100, 1) + " %, die Verkäufer " + K.fmt((1 - s.shareK) * 100, 1) + " %."));
        if (s.short > 1e-9) rows.push(LW.esc("Nachfrageüberhang: " + f(s.short) + " Einheiten werden zum Höchstpreis gewünscht, aber nicht angeboten."));
        if (s.excess > 1e-9) rows.push(LW.esc("Angebotsüberhang: " + f(s.excess) + " Einheiten werden zum Mindestpreis angeboten, aber nicht gekauft."));
        if (ctrl && !s.bind) rows.push(LW.esc((ctrl === 1 ? "Der Höchstpreis liegt über" : "Der Mindestpreis liegt unter") + " dem Marktpreis und bindet nicht."));
        out.set(rows.join("<br>"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, calc()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          Object.keys(SPEC).forEach((k) => { if (s[k] != null) { v[k] = s[k]; if (steps[k]) steps[k].set(s[k]); } });
          if (s.ctrl != null) { ctrl = s.ctrl; if (seg) seg.set(String(ctrl)); }
          paint();
        },
        getVar: (k) => calc()[k],
      };
    },
  });

  // ---------------------------------------------------------------- 2×2 games
  const CELLS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  function analyseGame(A, B) {
    const brA = [[0, 0], [0, 0]], brB = [[0, 0], [0, 0]], ne = [[0, 0], [0, 0]], par = [[1, 1], [1, 1]];
    let nash = 0;
    CELLS.forEach(([i, j]) => {
      brA[i][j] = A[i][j] >= A[1 - i][j] ? 1 : 0;
      brB[i][j] = B[i][j] >= B[i][1 - j] ? 1 : 0;
      ne[i][j] = brA[i][j] && brB[i][j] ? 1 : 0;
      nash += ne[i][j];
    });
    CELLS.forEach(([i, j]) => CELLS.forEach(([k, l]) => {
      if (A[k][l] >= A[i][j] && B[k][l] >= B[i][j] && (A[k][l] > A[i][j] || B[k][l] > B[i][j])) par[i][j] = 0;
    }));
    const domA = A[0][0] > A[1][0] && A[0][1] > A[1][1] ? 1 : A[1][0] > A[0][0] && A[1][1] > A[0][1] ? 2 : 0;
    const domB = B[0][0] > B[0][1] && B[1][0] > B[1][1] ? 1 : B[0][1] > B[0][0] && B[1][1] > B[1][0] ? 2 : 0;
    let dilemma = nash > 0 ? 1 : 0;
    CELLS.forEach(([i, j]) => { if (ne[i][j] && par[i][j]) dilemma = 0; });
    // mixed equilibrium: A mixes so that B is indifferent, and the other way round
    const dp = B[0][0] - B[1][0] - B[0][1] + B[1][1], dq = A[0][0] - A[0][1] - A[1][0] + A[1][1];
    let pm = dp !== 0 ? (B[1][1] - B[1][0]) / dp : -1, qm = dq !== 0 ? (A[1][1] - A[0][1]) / dq : -1;
    if (!(pm > 0 && pm < 1 && qm > 0 && qm < 1)) { pm = -1; qm = -1; }
    const sym = A[0][0] === B[0][0] && A[0][1] === B[1][0] && A[1][0] === B[0][1] && A[1][1] === B[1][1] ? 1 : 0;
    const sc = { nash, domA, domB, dilemma, p: pm, q: qm, sym };
    CELLS.forEach(([i, j]) => {
      const k = "" + (i + 1) + (j + 1);
      sc["a" + k] = A[i][j]; sc["b" + k] = B[i][j]; sc["n" + k] = ne[i][j]; sc["par" + k] = par[i][j];
    });
    return { sc, brA, brB, ne, par };
  }
  LW.widget("spiellabor", {
    mount(host, p, ctx) {
      const A = (p.A || [[3, 0], [5, 1]]).map((r) => r.slice()), B = (p.B || [[3, 5], [0, 1]]).map((r) => r.slice());
      const rows = p.rows || ["oben", "unten"], cols = p.cols || ["links", "rechts"];
      const ALL = ["a11", "a12", "a21", "a22", "b11", "b12", "b21", "b22"];
      const edit = p.edit === "all" ? ALL : p.edit || [];
      const lo = p.min != null ? p.min : -5, hi = p.max != null ? p.max : 10;
      let sel = edit[0] || null;
      const M = (k) => (k[0] === "a" ? A : B);
      const get = (k) => M(k)[+k[1] - 1][+k[2] - 1];
      const put = (k, val) => { M(k)[+k[1] - 1][+k[2] - 1] = val; };
      const table = LW.el("div", { class: "lw-game" });
      host.append(table);
      const editRow = LW.el("div", { class: "lw-game-edit" });
      let st = null;
      if (edit.length) {
        host.append(editRow);
        st = stepper(editRow, "", get(sel), 1, lo, hi, (x) => { put(sel, x); paint(); ctx.changed(); }, 0);
      }
      const out = K.readout(host);
      const cellName = (i, j) => "(" + rows[i] + ", " + cols[j] + ")";
      function paint() {
        const R = analyseGame(A, B);
        const head = '<tr><th></th><th class="colh">' + LW.esc("B: " + cols[0]) + '</th><th class="colh">' + LW.esc("B: " + cols[1]) + "</th></tr>";
        const pay = (k, i, j, br) => {
          const cls = "pay " + k[0] + (br ? " br" : "") + (k === sel ? " on" : "");
          return edit.includes(k) ? '<button type="button" class="' + cls + '" data-k="' + k + '" aria-label="Auszahlung von ' + (k[0] === "a" ? "A" : "B") + " bei " + LW.esc(cellName(i, j)) + '">' + K.fmt(get(k), 0) + "</button>"
            : '<span class="' + cls + '">' + K.fmt(get(k), 0) + "</span>";
        };
        const body = [0, 1].map((i) => "<tr><th>" + LW.esc("A: " + rows[i]) + "</th>" + [0, 1].map((j) => {
          const k = "" + (i + 1) + (j + 1);
          return '<td class="cell' + (R.ne[i][j] ? " nash" : "") + '">' + pay("a" + k, i, j, R.brA[i][j]) + '<span class="sep">,</span>' + pay("b" + k, i, j, R.brB[i][j]) + (R.ne[i][j] ? '<span class="tag">Nash</span>' : "") + "</td>";
        }).join("") + "</tr>").join("");
        table.innerHTML = "<table>" + head + body + "</table>";
        table.querySelectorAll("button[data-k]").forEach((b) => b.addEventListener("click", () => { sel = b.dataset.k; if (st) st.set(get(sel)); paint(); }));
        if (st) {
          const i = +sel[1] - 1, j = +sel[2] - 1;
          st.label.textContent = "Auszahlung von " + (sel[0] === "a" ? "A" : "B") + " bei " + cellName(i, j) + ":";
        }
        const s = R.sc, list = (pred) => CELLS.filter(([i, j]) => pred(i, j)).map(([i, j]) => cellName(i, j));
        const nes = list((i, j) => R.ne[i][j]), pars = list((i, j) => R.par[i][j]);
        const dom = (d, names) => (d ? names[d - 1] : "keine");
        const lines = [];
        lines.push("<b>" + LW.esc(nes.length ? "Nash-Gleichgewicht" + (nes.length > 1 ? "e: " : ": ") + nes.join(", ") : "Kein Nash-Gleichgewicht in reinen Strategien") + "</b>");
        lines.push(LW.esc("Dominante Strategie von A: " + dom(s.domA, rows) + " · von B: " + dom(s.domB, cols)));
        lines.push(LW.esc("Pareto-optimal: " + pars.join(", ")));
        if (s.p >= 0) lines.push(LW.esc("Gemischtes Gleichgewicht: A spielt " + rows[0] + " mit p = " + K.fmt(s.p, 3) + ", B spielt " + cols[0] + " mit q = " + K.fmt(s.q, 3)));
        if (s.dilemma) lines.push(LW.esc("Jedes Gleichgewicht ist Pareto-ineffizient: ein soziales Dilemma."));
        out.set(lines.join("<br>"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, analyseGame(A, B).sc),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.A) s.A.forEach((r, i) => r.forEach((x, j) => { A[i][j] = x; }));
          if (s.B) s.B.forEach((r, i) => r.forEach((x, j) => { B[i][j] = x; }));
          if (st && sel) st.set(get(sel));
          paint();
        },
        getVar: (k) => analyseGame(A, B).sc[k],
      };
    },
  });

  // ---------------------------------------------------------------- household: budget line and indifference curves
  LW.widget("haushalt", {
    mount(host, p, ctx) {
      const v = { m: p.m != null ? p.m : 24, px: p.px || 2, py: p.py || 2, alpha: p.alpha != null ? p.alpha : 0.5 };
      const B = [p.x != null ? p.x : 2, p.y != null ? p.y : 2];
      const edit = p.edit || ["bundle"];
      const Xm = p.xMax || 14, Ym = p.yMax || 14, step = p.step || 0.5;
      const showOpt = p.showOpt !== false, moveB = edit.includes("bundle");
      const tex = LW.el("div", { class: "lw-lab-tex lw-mk-tex" });
      host.append(tex);
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const SPEC = { m: [1, 1, 200, 0, "m"], px: [0.5, 0.5, 20, 1, "p_x"], py: [0.5, 0.5, 20, 1, "p_y"], alpha: [0.05, 0.05, 0.95, 2, "\\alpha"] };
      const steps = {};
      Object.keys(SPEC).forEach((k) => {
        if (!edit.includes(k)) return;
        const [st, lo, hi, dg, nm] = SPEC[k];
        steps[k] = stepper(ed, LW.math(nm), v[k], st, lo, hi, (x) => { v[k] = x; paint(); ctx.changed(); }, dg);
      });
      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Budgetgerade und Indifferenzkurven");
      svg.style.touchAction = "none";
      const x = K.scale(0, Xm, 36, W - 12), y = K.scale(0, Ym, H - 28, 12);
      const clipId = "lwhh" + Math.random().toString(36).slice(2, 8);
      const cp = K.svg("clipPath", { id: clipId }, K.svg("defs", null, svg));
      K.svg("rect", { x: x(0), y: y(Ym), width: x(Xm) - x(0), height: y(0) - y(Ym) }, cp);
      const axes = K.svg("g", null, svg);
      K.ticks(0, Ym, 7).forEach((tk) => { K.svg("line", { x1: x(0), y1: y(tk), x2: x(Xm), y2: y(tk), class: "s-grid" }, axes); K.text(axes, x(0) - 6, y(tk), K.fmt(tk, 1), "s-text", "end"); });
      K.ticks(0, Xm, 7).forEach((tk) => { K.svg("line", { x1: x(tk), y1: y(0), x2: x(tk), y2: y(Ym), class: "s-grid" }, axes); K.text(axes, x(tk), H - 16, K.fmt(tk, 1)); });
      K.svg("line", { x1: x(0), y1: y(0), x2: x(Xm), y2: y(0), class: "s-axis" }, axes);
      K.svg("line", { x1: x(0), y1: y(0), x2: x(0), y2: y(Ym), class: "s-axis" }, axes);
      K.text(axes, x(Xm), H - 4, "Gut x", "s-text-strong", "end");
      K.text(axes, x(0) + 6, 6, "Gut y", "s-text-strong", "start");
      const g = K.svg("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      const top = K.svg("g", null, svg);
      const hd = K.svg("g", { style: moveB ? "cursor:grab" : null }, svg);
      if (moveB) K.svg("circle", { r: 20, fill: "transparent" }, hd);
      K.svg("circle", { r: 7, fill: "var(--accent)", stroke: "var(--card-solid)", "stroke-width": 2 }, hd);
      if (moveB) K.drag(svg, hd, (q) => { B[0] = +K.clamp(K.snap(x.inv(q.x), step), 0, Xm).toFixed(6); B[1] = +K.clamp(K.snap(y.inv(q.y), step), 0, Ym).toFixed(6); paint(); ctx.changed(); });
      const out = K.readout(host);
      const u = (a, b) => (a > 0 && b > 0 ? Math.pow(a, v.alpha) * Math.pow(b, 1 - v.alpha) : 0);
      function scope() {
        const { m, px, py, alpha } = v;
        const xs = (alpha * m) / px, ys = ((1 - alpha) * m) / py, cost = px * B[0] + py * B[1];
        return { m, px, py, alpha, x: B[0], y: B[1], cost, feasible: cost <= m + 1e-9 ? 1 : 0, onLine: Math.abs(cost - m) < 1e-6 ? 1 : 0,
          U: u(B[0], B[1]), Ustar: u(xs, ys), xs, ys, opt: Math.abs(B[0] - xs) < 1e-6 && Math.abs(B[1] - ys) < 1e-6 ? 1 : 0,
          mrs: B[0] > 0 ? (alpha / (1 - alpha)) * (B[1] / B[0]) : Infinity, ratio: px / py, share: alpha };
      }
      function indiff(U, stroke, dash, w) {
        if (!(U > 0)) return;
        const pts = [];
        for (let k = 1; k <= 120; k++) {
          const xx = (Xm * k) / 120, yy = Math.pow(U / Math.pow(xx, v.alpha), 1 / (1 - v.alpha));
          if (yy > Ym * 3) continue;
          pts.push(x(xx).toFixed(1) + "," + y(Math.min(yy, Ym * 3)).toFixed(1));
        }
        K.svg("polyline", { points: pts.join(" "), fill: "none", stroke, "stroke-width": w || 2, "stroke-dasharray": dash || null }, g);
      }
      function paint() {
        K.clear(g); K.clear(top);
        const s = scope();
        if (p.ghost) K.svg("line", { x1: x(0), y1: y(p.ghost.m / p.ghost.py), x2: x(p.ghost.m / p.ghost.px), y2: y(0), stroke: "var(--label-3)", "stroke-width": 1.8, "stroke-dasharray": "5 5" }, g);
        K.svg("polygon", { points: [[0, 0], [0, s.m / s.py], [s.m / s.px, 0]].map(([a, b]) => x(a) + "," + y(b)).join(" "), fill: "var(--accent)", opacity: 0.08 }, g);
        K.svg("line", { x1: x(0), y1: y(s.m / s.py), x2: x(s.m / s.px), y2: y(0), stroke: "var(--accent)", "stroke-width": 2.6 }, g);
        if (showOpt) indiff(s.Ustar, "var(--label-3)", "5 4", 1.6);
        indiff(s.U, "var(--blue)", null, 2);
        if (showOpt) K.svg("circle", { cx: x(s.xs), cy: y(s.ys), r: 5.5, fill: "var(--card-solid)", stroke: "var(--label-2)", "stroke-width": 1.8 }, top);
        K.svg("line", { x1: x(B[0]), y1: y(B[1]), x2: x(B[0]), y2: y(0), class: "s-grid", "stroke-dasharray": "3 3" }, top);
        K.svg("line", { x1: x(B[0]), y1: y(B[1]), x2: x(0), y2: y(B[1]), class: "s-grid", "stroke-dasharray": "3 3" }, top);
        hd.setAttribute("transform", "translate(" + x(B[0]) + "," + y(B[1]) + ")");
        tex.innerHTML = "<span>" + LW.math("U = x^{" + tn(s.alpha) + "}\\, y^{" + tn(1 - s.alpha) + "}") + "</span><span>" + LW.math(tn(s.px) + "\\,x + " + tn(s.py) + "\\,y \\le " + tn(s.m, 0)) + "</span>";
        const f = (z) => K.fmt(z, 2);
        const rows = [];
        rows.push("<b>" + LW.esc("Bündel (" + f(B[0]) + " | " + f(B[1]) + "): kostet " + f(s.cost) + " von " + f(s.m) + " · Nutzen " + f(s.U)) + "</b>");
        rows.push(LW.esc("Grenzrate der Substitution " + (isFinite(s.mrs) ? f(s.mrs) : "∞") + " · Preisverhältnis ") + "p<sub>x</sub>/p<sub>y</sub>" + LW.esc(" = " + f(s.ratio)));
        if (!s.feasible) rows.push(K.pill(false, "zu teuer: liegt jenseits der Budgetgeraden"));
        if (showOpt) rows.push(LW.esc("Optimum (" + f(s.xs) + " | " + f(s.ys) + ") mit Nutzen " + f(s.Ustar) + "; für x geht der Anteil α = " + K.fmt(s.alpha * 100, 0) + " % des Einkommens drauf."));
        out.set(rows.join("<br>"));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          Object.keys(SPEC).forEach((k) => { if (s[k] != null) { v[k] = s[k]; if (steps[k]) steps[k].set(s[k]); } });
          if (s.x != null) B[0] = s.x;
          if (s.y != null) B[1] = s.y;
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  LW.labEcon = { analyseGame };
})();
