/* Economics widgets: linear market model with shifts, price controls and surplus; Smith's pin factory. */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  LW.widget("market", {
    mount(host, p, ctx) {
      const W = 360, H = 300;
      const Qmax = p.qMax || 10, Pmax = p.pMax || 12;
      const x = K.scale(0, Qmax, 34, W - 10);
      const y = K.scale(0, Pmax, H - 34, 20);
      const svg = K.root(host, W, H, "Markt mit Angebot und Nachfrage");
      K.ticks(0, Pmax, 6).forEach((t) => { K.svg("line", { x1: 34, y1: y(t), x2: W - 10, y2: y(t), class: "s-grid" }, svg); K.text(svg, 28, y(t), K.fmt(t, 1), "s-text", "end"); });
      K.ticks(0, Qmax, 5).forEach((t) => K.text(svg, x(t), H - 22, K.fmt(t, 1)));
      K.svg("line", { x1: 34, y1: y(0), x2: W - 10, y2: y(0), class: "s-axis" }, svg);
      K.svg("line", { x1: 34, y1: y(0), x2: 34, y2: 12, class: "s-axis" }, svg);
      K.text(svg, W - 10, H - 6, "Menge Q", "s-text-strong", "end");
      K.text(svg, 40, 9, "Preis P", "s-text-strong", "start");

      const areas = K.svg("g", null, svg);
      const lines = K.svg("g", null, svg);
      const marks = K.svg("g", null, svg);
      const a0 = p.demand ? p.demand[0] : 10, b = p.demand ? p.demand[1] : 1;   // P = a - bQ
      const c0 = p.supply ? p.supply[0] : 2, d = p.supply ? p.supply[1] : 1;    // P = c + dQ
      let da = 0, dc = 0, control = p.control || "none", cp = p.controlPrice || 4.5;
      let locked = false;
      const sliders = LW.el("div");
      host.append(sliders);
      const sD = K.slider(sliders, { label: "Nachfrage", min: -4, max: 4, step: 0.5, value: 0, format: (v) => (v > 0 ? "+" : "") + K.fmt(v, 1), onInput: (v) => { da = v; paint(); ctx.changed(); } });
      const sS = K.slider(sliders, { label: "Angebot", min: -4, max: 4, step: 0.5, value: 0, format: (v) => (v > 0 ? "+" : "") + K.fmt(v, 1), onInput: (v) => { dc = v; paint(); ctx.changed(); } });
      if (p.shifts === false) { sD.el.style.display = "none"; sS.el.style.display = "none"; }
      let sP = null;
      if (p.controls) {
        K.segmented(host, [{ id: "none", label: "Freier Markt" }, { id: "ceiling", label: "Höchstpreis" }, { id: "floor", label: "Mindestpreis" }], control, (id) => { control = id; paint(); ctx.changed(); });
        sP = K.slider(host, { label: "Preis", min: 0.5, max: Pmax - 0.5, step: 0.5, value: cp, format: (v) => K.fmt(v, 1), onInput: (v) => { cp = v; paint(); ctx.changed(); } });
      }
      const out = K.readout(host);

      const poly = (pts, cls, extra) => K.svg("polygon", Object.assign({ points: pts.map((q) => x(q[0]) + "," + y(q[1])).join(" "), class: cls }, extra || {}), areas);
      function eq() {
        const a = a0 + da, c = c0 + dc;
        const Q = (a - c) / (b + d);
        return { a, c, Q, P: a - b * Q };
      }
      function paint() {
        K.clear(areas); K.clear(lines); K.clear(marks);
        const { a, c, Q, P } = eq();
        const demandP = (q) => a - b * q, supplyP = (q) => c + d * q;
        const qD = (pp) => (a - pp) / b, qS = (pp) => (pp - c) / d;
        let html = "";
        const active = control !== "none" && sP && ((control === "ceiling" && cp < P) || (control === "floor" && cp > P));
        if (!active) {
          poly([[0, a], [0, P], [Q, P]], "", { fill: "var(--accent)", opacity: 0.18 });
          poly([[0, P], [0, Math.max(0, c)], [Q, P]], "", { fill: "var(--orange)", opacity: 0.2 });
          const ks = 0.5 * Q * (a - P), ps = 0.5 * Q * (P - c);
          html = "Gleichgewicht: <b>Q* = " + K.fmt(Q, 2) + ", P* = " + K.fmt(P, 2) + "</b> &nbsp; Konsumentenrente " + K.fmt(ks, 2) + " &nbsp; Produzentenrente " + K.fmt(ps, 2) + " &nbsp; Wohlfahrt " + K.fmt(ks + ps, 2);
          if (control !== "none") html += " &nbsp; " + K.pill(true, (control === "ceiling" ? "Höchstpreis" : "Mindestpreis") + " greift nicht");
        } else {
          const qT = control === "ceiling" ? Math.max(0, qS(cp)) : Math.max(0, qD(cp));
          // welfare with the price control: areas up to the traded quantity
          const pD = demandP(qT), pS = supplyP(qT);
          poly([[0, a], [0, cp], [qT, cp], [qT, pD]], "", { fill: "var(--accent)", opacity: 0.18 });
          poly([[0, cp], [0, Math.max(0, c)], [qT, pS], [qT, cp]], "", { fill: "var(--orange)", opacity: 0.2 });
          poly([[qT, pD], [qT, pS], [Q, P]], "", { fill: "var(--red)", opacity: 0.28 });
          K.svg("line", { x1: x(0), y1: y(cp), x2: x(Qmax), y2: y(cp), stroke: "var(--red)", "stroke-width": 2, "stroke-dasharray": "6 4" }, lines);
          const qd = Math.max(0, qD(cp)), qs = Math.max(0, qS(cp));
          const gapLabel = control === "ceiling" ? "Mangel" : "Überschuss";
          K.svg("line", { x1: x(Math.min(qd, qs)), y1: y(cp) - 10, x2: x(Math.max(qd, qs)), y2: y(cp) - 10, stroke: "var(--red)", "stroke-width": 3 }, marks);
          K.text(marks, x((qd + qs) / 2), y(cp) - 22, gapLabel + " " + K.fmt(Math.abs(qd - qs), 2), "s-text-strong");
          const dwl = 0.5 * (Q - qT) * (pD - pS);
          html = (control === "ceiling" ? "Höchstpreis " : "Mindestpreis ") + K.fmt(cp, 2) + ": gehandelt werden nur <b>" + K.fmt(qT, 2) + "</b> Einheiten. " + gapLabel + ": " + K.fmt(Math.abs(qd - qs), 2) + " &nbsp; " + K.pill(false, "Wohlfahrtsverlust " + K.fmt(dwl, 2));
        }
        const line = (f, cls, label) => {
          const q1 = 0, q2 = Qmax;
          K.svg("line", { x1: x(q1), y1: y(f(q1)), x2: x(q2), y2: y(f(q2)), class: cls, "stroke-width": 3 }, lines);
          const qq = label === "N" ? Math.min(Qmax * 0.92, Math.max(0.5, (a - 0.8) / b)) : Math.min(Qmax * 0.92, (Pmax - 0.6 - c) / d);
          K.text(lines, x(qq) + 8, y(f(qq)) - 10, label, "s-text-strong", "start");
        };
        line(demandP, "s-accent", "N");
        line(supplyP, "", "A");
        lines.lastChild.previousSibling.setAttribute("stroke", "var(--orange)");
        if (Q > 0 && P > 0) {
          K.svg("line", { x1: x(Q), y1: y(P), x2: x(Q), y2: y(0), class: "s-axis", "stroke-dasharray": "4 4" }, marks);
          K.svg("line", { x1: x(Q), y1: y(P), x2: x(0), y2: y(P), class: "s-axis", "stroke-dasharray": "4 4" }, marks);
          K.svg("circle", { cx: x(Q), cy: y(P), r: 7, fill: "var(--card-solid)", stroke: "var(--label)", "stroke-width": 2.5 }, marks);
        }
        out.set(html);
      }
      paint();
      return {
        check(goal) {
          const e = eq();
          if (goal.P != null && Math.abs(e.P - goal.P) > (goal.tolerance || 0.01)) return { correct: false, detail: "Der Gleichgewichtspreis ist " + K.fmt(e.P, 2) + ", gesucht ist " + K.fmt(goal.P, 2) + "." };
          if (goal.Q != null && Math.abs(e.Q - goal.Q) > (goal.tolerance || 0.01)) return { correct: false, detail: "Die Gleichgewichtsmenge ist " + K.fmt(e.Q, 2) + ", gesucht ist " + K.fmt(goal.Q, 2) + "." };
          if (goal.demandShift != null && Math.sign(da) !== Math.sign(goal.demandShift)) return { correct: false, detail: "Verschiebe die Nachfrage in die andere Richtung." };
          if (goal.supplyShift != null && Math.sign(dc) !== Math.sign(goal.supplyShift)) return { correct: false, detail: "Verschiebe das Angebot in die andere Richtung." };
          return { correct: true };
        },
        solve(goal) {
          if (!goal) return;
          // move the curve the goal names so that the equilibrium price matches
          if (goal.P != null && goal.supplyShift != null) { const a = a0 + da; dc = (goal.P * (b + d) - a * d) / b - c0; sS.set(dc); }
          else if (goal.P != null && goal.demandShift != null) { const c = c0 + dc; da = (goal.P * (b + d) - c * b) / d - a0; sD.set(da); }
          else {
            if (goal.demandShift != null && Math.sign(da) !== Math.sign(goal.demandShift)) { da = goal.demandShift; sD.set(da); }
            if (goal.supplyShift != null && Math.sign(dc) !== Math.sign(goal.supplyShift)) { dc = goal.supplyShift; sS.set(dc); }
          }
          paint();
        },
        getVar: (k) => ({ demand: da, supply: dc, price: cp })[k],
        setVar(k, v) {
          if (k === "demand") { da = v; sD.set(v); }
          if (k === "supply") { dc = v; sS.set(v); }
          if (k === "price") { cp = v; if (sP) sP.set(v); }
          paint();
        },
        act(name, arg) { if (name === "control") { control = arg; paint(); } },
        lock() { locked = true; sD.disable(true); sS.disable(true); if (sP) sP.disable(true); },
      };
    },
  });

  LW.widget("pin-factory", {
    mount(host, p, ctx) {
      const W = 360, H = 192;
      const svg = K.root(host, W, H, "Stecknadelmanufaktur");
      const g = K.svg("g", null, svg);
      let divided = false;
      // Smith, Wealth of Nations I.1, only gives this one case: ten workers, eighteen operations,
      // upwards of 48,000 pins a day (4,800 each); a worker on his own could "certainly not make twenty".
      const workers = 10;
      K.segmented(host, [{ id: "solo", label: "Jeder macht alles" }, { id: "div", label: "Arbeitsteilung" }], "solo", (id) => { divided = id === "div"; paint(); ctx.changed(); });
      const out = K.readout(host);
      function paint() {
        K.clear(g);
        const total = 48000;
        const lx = K.scale(0, Math.log10(50000), 96, W - 10);
        [["Ohne Teilung", 20 * workers, "var(--orange)"], ["Mit Teilung", divided ? total : null, "var(--accent)"]].forEach(([name, val, col], i) => {
          const yy = 30 + i * 62;
          K.text(g, 88, yy + 15, name, "s-text-strong", "end");
          K.svg("rect", { x: 96, y: yy, width: W - 106, height: 30, rx: 9, fill: "var(--fill)" }, g);
          if (val) {
            const end = lx(Math.log10(val));
            K.svg("rect", { x: 96, y: yy, width: Math.max(8, end - 96), height: 30, rx: 9, fill: col }, g);
            const inside = val > 20000;
            K.text(g, inside ? end - 8 : end + 6, yy + 15, K.fmt(val, 0) + " pro Tag", "s-text-strong", inside ? "end" : "start").style.fill = inside ? "white" : "";
          }
        });
        for (let k = 0; k <= 4; k++) K.text(g, lx(k), 166, K.fmt(Math.pow(10, k), 0), "s-text");
        K.text(g, 96, 184, "logarithmische Skala", "s-text", "start");
        const total0 = 20 * workers;
        out.set(divided ? "<b>" + workers + " Arbeiter mit Teilung: etwa " + K.fmt(total, 0) + " Nadeln am Tag</b>, das " + K.fmt(total / total0, 0) + "-Fache. Smiths Beispiel: 10 Arbeiter, 18 Arbeitsgänge, über 48.000 Nadeln." : "<b>" + workers + " Arbeiter ohne Teilung: höchstens " + K.fmt(total0, 0) + " Nadeln am Tag</b>. Schalte auf Arbeitsteilung um.");
      }
      paint();
      return { act(name, arg) { if (name === "divide") { divided = !!arg; paint(); } } };
    },
  });

  // ------------------------------------------------------------ circular flow of income

  const FLOWS = {
    Y: { from: "U", to: "H", name: "Einkommen", bend: -30 },
    C: { from: "H", to: "U", name: "Konsum", bend: -30 },
    S: { from: "H", to: "B", name: "Ersparnis", bend: 18 },
    I: { from: "B", to: "U", name: "Investition", bend: 18 },
    T: { from: "H", to: "St", name: "Steuern", bend: -18 },
    G: { from: "St", to: "U", name: "Staatskäufe", bend: -18 },
    Tr: { from: "St", to: "H", name: "Transfers", bend: -18 },
    X: { from: "A", to: "U", name: "Exporte", bend: 16 },
    M: { from: "U", to: "A", name: "Importe", bend: 16 },
  };
  const SECT = { H: ["Haushalte", 62, 136], U: ["Unternehmen", 298, 136], St: ["Staat", 180, 36], B: ["Banken", 180, 236], A: ["Ausland", 310, 36] };

  /* params: sectors ["H", "U", "St", "B", "A"], values {Y, C, S, I, T, G, Tr, X, M}, show (flows drawn), highlight
   * scope:  the flow values and, per sector, in_H, out_H, … */
  LW.widget("circular-flow", {
    mount(host, p, ctx) {
      const vals = Object.assign({ Y: 1000, C: 700, S: 150, I: 150, T: 150, G: 150, Tr: 0, X: 0, M: 0 }, p.values || {});
      const sectors = p.sectors || ["H", "U", "St", "B"];
      let show = (p.show || Object.keys(FLOWS).filter((f) => sectors.includes(FLOWS[f].from) && sectors.includes(FLOWS[f].to) && vals[f])).slice();
      let hi = (p.highlight || []).slice();
      const W = 360, H = 270;
      const svg = K.root(host, W, H, "Wirtschaftskreislauf");
      svg.style.maxWidth = "540px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const BW = 96, BH = 34;
      const edge = (s, ux, uy) => { const t = Math.min(Math.abs(ux) > 1e-9 ? BW / 2 / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-9 ? BH / 2 / Math.abs(uy) : 1e9); return [SECT[s][1] + ux * t, SECT[s][2] + uy * t]; };
      function scope() {
        const sc = Object.assign({}, vals);
        sectors.forEach((s) => {
          sc["in_" + s] = show.filter((f) => FLOWS[f].to === s).reduce((a, f) => a + vals[f], 0);
          sc["out_" + s] = show.filter((f) => FLOWS[f].from === s).reduce((a, f) => a + vals[f], 0);
        });
        return sc;
      }
      function paint() {
        K.clear(g);
        show.forEach((f) => {
          const F = FLOWS[f];
          if (!sectors.includes(F.from) || !sectors.includes(F.to)) return;
          const [x1, y1] = [SECT[F.from][1], SECT[F.from][2]], [x2, y2] = [SECT[F.to][1], SECT[F.to][2]];
          const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
          const nx = -uy, ny = ux, bend = F.bend;
          const [sx, sy] = edge(F.from, ux, uy), [ex0, ey0] = edge(F.to, -ux, -uy);
          const ox = nx * bend * 0.35, oy = ny * bend * 0.35;
          const ax = sx + ox, ay = sy + oy, bx = ex0 + ox, by = ey0 + oy;
          const cx = (ax + bx) / 2 + nx * bend, cy = (ay + by) / 2 + ny * bend;
          const on = !hi.length || hi.includes(f);
          const color = on ? (f === "Y" || f === "Tr" ? "var(--green)" : f === "C" || f === "G" || f === "X" ? "var(--accent)" : "var(--orange)") : "var(--label-3)";
          K.svg("path", { d: "M" + ax + "," + ay + " Q" + cx + "," + cy + " " + bx + "," + by, fill: "none", stroke: color, "stroke-width": on ? 2.6 : 1.6, opacity: on ? 1 : 0.6 }, g);
          const hx = bx - cx, hy = by - cy, hl = Math.hypot(hx, hy) || 1, hux = hx / hl, huy = hy / hl;
          K.svg("path", { d: "M" + bx + "," + by + " L" + (bx - hux * 9 - huy * 5) + "," + (by - huy * 9 + hux * 5) + " L" + (bx - hux * 9 + huy * 5) + "," + (by - huy * 9 - hux * 5) + " Z", fill: color, opacity: on ? 1 : 0.6 }, g);
          const lx = 0.25 * ax + 0.5 * cx + 0.25 * bx, ly = 0.25 * ay + 0.5 * cy + 0.25 * by;
          const t = K.text(g, lx, ly, F.name + " " + K.fmt(vals[f], 0), on ? "s-text-strong" : "s-text");
          t.style.fontSize = "10.5px";
          if (on) t.style.fill = color;
        });
        sectors.forEach((s) => {
          const [name, sx, sy] = SECT[s];
          K.svg("rect", { x: sx - BW / 2, y: sy - BH / 2, width: BW, height: BH, rx: 10, fill: "var(--card-solid)", stroke: "var(--label-2)", "stroke-width": 1.6 }, g);
          K.text(g, sx, sy, name, "s-text-strong");
        });
        const sc = scope();
        const bal = sectors.filter((s) => s !== "B" || show.some((f) => FLOWS[f].from === "B" || FLOWS[f].to === "B")).map((s) => SECT[s][0] + ": hinein " + K.fmt(sc["in_" + s], 0) + ", hinaus " + K.fmt(sc["out_" + s], 0));
        out.set(bal.join(" · ") + (sectors.every((s) => Math.abs(sc["in_" + s] - sc["out_" + s]) < 1e-9) ? "<br>" + K.pill(true, "Jeder Sektor: Zuflüsse = Abflüsse") : ""));
        return sc;
      }
      paint();
      return {
        check: (goal) => { const sc = paint(); if (!goal || !goal.when) return { correct: true }; let ok = false; try { ok = !!LW.expr(goal.when)(sc); } catch (e) { ok = false; } return ok ? { correct: true } : { correct: false, detail: goal.message || null }; },
        getVar: (k) => vals[k],
        setVar(k, v) { if (k in vals) { vals[k] = v; paint(); } },
        act(name, arg) { if (name === "show") show = (arg || []).slice(); if (name === "highlight") hi = (arg || []).slice(); paint(); },
      };
    },
  });

  // ------------------------------------------------------------ Marx: necessary and surplus labour in a working day

  /* params: day (hours), nec (necessary hours), c (constant capital per day, in hours of labour), sliders
   * scope:  day, nec, m (surplus hours), v (= nec), rate (m/v), profit (m/(c+v)) */
  LW.widget("workday", {
    mount(host, p, ctx) {
      let day = p.day || 10, nec = p.nec || 5;
      const c = p.c || 0;
      let locked = false;
      const W = 360, H = 120;
      const svg = K.root(host, W, H, "Arbeitstag");
      svg.style.maxWidth = "540px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const ui = {};
      if (p.sliders !== false) {
        ui.day = K.slider(host, { label: "Arbeitstag (Stunden)", min: 4, max: 16, step: 0.5, value: day, format: (t) => K.fmt(t, 1), onInput: (t) => { day = t; nec = Math.min(nec, day); if (ui.nec) ui.nec.set(nec); paint(); ctx.changed(); } });
        ui.nec = K.slider(host, { label: "Notwendige Arbeitszeit", min: 0.5, max: 16, step: 0.5, value: nec, format: (t) => K.fmt(t, 1), onInput: (t) => { nec = Math.min(t, day); ui.nec.set(nec); paint(); ctx.changed(); } });
      }
      const out = K.readout(host);
      const x = K.scale(0, 16, 14, W - 14);
      function scope() { const m = Math.max(0, day - nec); return { day, nec, m, v: nec, rate: nec > 0 ? m / nec : NaN, profit: c + nec > 0 ? m / (c + nec) : NaN }; }
      function paint() {
        K.clear(g);
        const sc = scope();
        K.svg("rect", { x: x(0), y: 34, width: x(nec) - x(0), height: 34, rx: 6, fill: "var(--accent)" }, g);
        K.svg("rect", { x: x(nec), y: 34, width: Math.max(0, x(day) - x(nec)), height: 34, rx: 6, fill: "var(--orange)" }, g);
        if (nec >= 2) { const t = K.text(g, (x(0) + x(nec)) / 2, 51, "notwendig", "s-text-strong"); t.style.fill = "white"; }
        if (day - nec >= 2) { const t = K.text(g, (x(nec) + x(day)) / 2, 51, "Mehrarbeit", "s-text-strong"); t.style.fill = "white"; }
        for (let h = 0; h <= 16; h += 2) { K.svg("line", { x1: x(h), y1: 72, x2: x(h), y2: 78, class: "s-axis" }, g); K.text(g, x(h), 90, h + " h", "s-text"); }
        K.text(g, x(nec) / 2 + x(0) / 2, 22, "Lohn v", "s-text", "middle");
        if (day > nec) K.text(g, (x(nec) + x(day)) / 2, 22, "Mehrwert m", "s-text", "middle");
        out.set("Arbeitstag " + K.fmt(day, 1) + " h, davon " + K.fmt(nec, 1) + " h für den Wert der Arbeitskraft und <b>" + K.fmt(sc.m, 1) + " h Mehrarbeit</b>. Mehrwertrate m/v = <b>" + K.fmt(100 * sc.rate, 0) + " %</b>" + (c ? ", Profitrate m/(c + v) = " + K.fmt(100 * sc.profit, 1) + " %" : "") + ".");
        return sc;
      }
      paint();
      return {
        check(goal) { const sc = paint(); if (!goal || !goal.when) return { correct: true }; let ok = false; try { ok = !!LW.expr(goal.when)(sc); } catch (e) { ok = false; } if (ok) return { correct: true }; for (const h of goal.hints || []) { try { if (LW.expr(h.when)(sc)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } } return { correct: false, detail: goal.message || null }; },
        solve(goal) { const s = goal && goal.solve; if (s) { if (s.day != null) day = s.day; if (s.nec != null) nec = s.nec; if (ui.day) ui.day.set(day); if (ui.nec) ui.nec.set(nec); } paint(); },
        getVar: (k) => ({ day, nec })[k],
        setVar(k, v) { if (k === "day") { day = v; if (ui.day) ui.day.set(v); } if (k === "nec") { nec = Math.min(v, day); if (ui.nec) ui.nec.set(nec); } paint(); },
        lock() { locked = true; Object.values(ui).forEach((s) => s.disable(true)); },
      };
    },
  });
})();
