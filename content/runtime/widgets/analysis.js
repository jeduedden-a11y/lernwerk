/* Analysis widgets: number line with bounds (sup/inf), epsilon band for sequences, nested intervals,
   truth tables, induction dominoes. */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // ------------------------------------------------------------ helpers for sets on the real line

  /** set: {kind:"interval", a, b, openA, openB} | {kind:"sequence", f, n} | {kind:"points", values} | {kind:"union", parts} */
  function describeSet(set) {
    if (!set) return { points: [], intervals: [] };
    if (set.kind === "union") {
      const parts = set.parts.map(describeSet);
      return { points: [].concat(...parts.map((p) => p.points)), intervals: [].concat(...parts.map((p) => p.intervals)) };
    }
    if (set.kind === "interval") return { points: [], intervals: [{ a: set.a, b: set.b, openA: !!set.openA, openB: !!set.openB }] };
    if (set.kind === "sequence") {
      const f = LW.expr(set.f);
      const pts = [];
      for (let n = set.from || 1; n <= (set.n || 40); n++) pts.push({ v: f({ n }), n });
      return { points: pts, intervals: [] };
    }
    if (set.kind === "points") return { points: set.values.map((v) => ({ v })), intervals: [] };
    return { points: [], intervals: [] };
  }

  /** Is s an upper (dir=1) or lower (dir=-1) bound? Returns the first offending element or null. */
  function violates(desc, s, dir) {
    const eps = 1e-9;
    for (const p of desc.points) if (dir * (p.v - s) > eps) return p;
    for (const iv of desc.intervals) {
      if (dir > 0 && iv.b - s > eps) return { v: iv.b, interval: true };
      if (dir < 0 && s - iv.a > eps) return { v: iv.a, interval: true };
    }
    return null;
  }

  // ------------------------------------------------------------ numberline: drag a bound, find sup or inf

  LW.widget("numberline", {
    mount(host, p, ctx) {
      const W = 360, H = 124;
      const range = p.range || [-1, 2];
      const dir = p.target === "inf" ? -1 : 1;
      const desc = describeSet(p.set);
      const x = K.scale(range[0], range[1], 22, W - 22);
      const svg = K.root(host, W, H, "Zahlengerade");
      const axisY = 80;

      K.svg("line", { x1: 10, y1: axisY, x2: W - 10, y2: axisY, class: "s-axis" }, svg);
      K.ticks(range[0], range[1], 6).forEach((t) => {
        K.svg("line", { x1: x(t), y1: axisY - 5, x2: x(t), y2: axisY + 5, class: "s-axis" }, svg);
        K.text(svg, x(t), axisY + 19, K.fmt(t, 2));
      });

      const shade = K.svg("rect", { x: 0, y: axisY - 28, width: 0, height: 44, rx: 10, class: "s-soft-fill" }, svg);
      const setLayer = K.svg("g", null, svg);
      desc.intervals.forEach((iv) => {
        K.svg("line", { x1: x(iv.a), y1: axisY, x2: x(iv.b), y2: axisY, class: "s-accent", "stroke-width": 7, opacity: 0.85 }, setLayer);
        [[iv.a, iv.openA], [iv.b, iv.openB]].forEach(([v, open]) => {
          if (!isFinite(v)) return;
          K.svg("circle", { cx: x(v), cy: axisY, r: 7, fill: open ? "var(--card-solid)" : "var(--accent)", stroke: "var(--accent)", "stroke-width": 2.5 }, setLayer);
        });
      });
      const dots = desc.points.map((pt) => K.svg("circle", { cx: x(pt.v), cy: axisY, r: 5, class: "s-accent-fill", opacity: 0.9 }, setLayer));
      if (p.setLabel) K.text(svg, 12, 14, p.setLabel, "s-text-strong", "start");

      // the movable bound s
      const g = K.svg("g", null, svg);
      const stem = K.svg("line", { y1: axisY - 34, y2: axisY + 8, class: "s-accent", "stroke-width": 2, "stroke-dasharray": "4 4" }, g);
      const handle = K.svg("circle", { cy: axisY - 44, r: 13, class: "s-handle" }, g);
      const label = K.text(g, 0, axisY - 44, "s", "s-text-strong");
      label.style.pointerEvents = "none";
      label.style.fill = "var(--accent)";
      const hit = K.svg("rect", { y: axisY - 62, width: 48, height: 96, class: "s-hit" }, g);

      const out = K.readout(host);
      const snap = p.snap || 0.01;
      let s = p.start != null ? p.start : range[1] - (range[1] - range[0]) * 0.15;
      let locked = false;

      function paint() {
        const px = x(s);
        stem.setAttribute("x1", px); stem.setAttribute("x2", px);
        handle.setAttribute("cx", px); label.setAttribute("x", px);
        hit.setAttribute("x", px - 24);
        if (dir > 0) { shade.setAttribute("x", px); shade.setAttribute("width", Math.max(0, W - 10 - px)); }
        else { shade.setAttribute("x", 10); shade.setAttribute("width", Math.max(0, px - 10)); }
        const bad = violates(desc, s, dir);
        desc.points.forEach((pt, i) => {
          const off = dir * (pt.v - s) > 1e-9;
          dots[i].setAttribute("class", off ? "s-red" : "s-accent-fill");
        });
        const word = dir > 0 ? "obere" : "untere";
        let html = "<b>s = " + K.fmt(s, 3) + "</b> &nbsp; ";
        if (bad) {
          html += K.pill(false, "keine " + word + " Schranke") + " &nbsp;";
          html += bad.n != null ? "zum Beispiel ist a<sub>" + bad.n + "</sub> = " + K.fmt(bad.v, 4) + (dir > 0 ? " > s" : " < s") : "Elemente der Menge liegen " + (dir > 0 ? "rechts" : "links") + " von s";
        } else {
          html += K.pill(true, word + " Schranke");
          if (p.hintSmaller !== false) html += " &nbsp;Geht es noch " + (dir > 0 ? "kleiner" : "größer") + "?";
        }
        out.set(html);
      }

      K.drag(svg, hit, (pt) => {
        if (locked) return;
        s = K.clamp(K.snap(x.inv(pt.x), snap), range[0], range[1]);
        paint();
        ctx.changed();
      });
      paint();

      return {
        check(goal) {
          const bad = violates(desc, s, dir);
          if (bad) return { correct: false, detail: "s ist noch keine " + (dir > 0 ? "obere" : "untere") + " Schranke: Es gibt Elemente " + (dir > 0 ? "rechts" : "links") + " von s." };
          const tol = goal.tolerance != null ? goal.tolerance : snap / 2 + 1e-9;
          if (Math.abs(s - goal.value) <= tol) return { correct: true };
          return { correct: false, detail: "s ist eine " + (dir > 0 ? "obere" : "untere") + " Schranke, aber nicht die " + (dir > 0 ? "kleinste" : "größte") + ". Schiebe s weiter " + (dir > 0 ? "nach links" : "nach rechts") + "." };
        },
        solve(goal) { s = goal.value; paint(); },
        getVar: (k) => (k === "s" ? s : NaN),
        setVar(k, v) { if (k === "s") { s = K.clamp(v, range[0], range[1]); paint(); } },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------ epsilon band: convergence of a sequence

  LW.widget("epsilon-band", {
    mount(host, p, ctx) {
      const W = 360, H = 250;
      const f = LW.expr(p.f);
      const limit = p.limit != null ? p.limit : 0;
      const nMax = p.nMax || 40;
      const vals = [];
      for (let n = 1; n <= nMax; n++) vals.push(f({ n }));
      const yr = p.yRange || [Math.min(limit - 1, ...vals), Math.max(limit + 1, ...vals)];
      const x = K.scale(0, nMax + 1, 34, W - 8);
      const y = K.scale(yr[0], yr[1], H - 26, 18);
      const svg = K.root(host, W, H, "Folge mit Epsilon-Band");

      K.ticks(yr[0], yr[1], 5).forEach((t) => {
        K.svg("line", { x1: 34, y1: y(t), x2: W - 8, y2: y(t), class: "s-grid" }, svg);
        K.text(svg, 28, y(t), K.fmt(t, 2), "s-text", "end");
      });
      K.ticks(1, nMax, 6).filter((t) => Number.isInteger(t)).forEach((t) => K.text(svg, x(t), H - 9, String(t)));
      K.text(svg, W - 4, H - 9, "n", "s-text-strong", "end");

      const band = K.svg("rect", { x: 34, width: W - 42, class: "s-soft-fill" }, svg);
      const bandTop = K.svg("line", { x1: 34, x2: W - 8, class: "s-accent", "stroke-width": 1.2, "stroke-dasharray": "5 4" }, svg);
      const bandBot = K.svg("line", { x1: 34, x2: W - 8, class: "s-accent", "stroke-width": 1.2, "stroke-dasharray": "5 4" }, svg);
      K.svg("line", { x1: 34, y1: y(limit), x2: W - 8, y2: y(limit), class: "s-accent", "stroke-width": 1.6 }, svg);
      K.text(svg, W - 8, y(limit) - 9, p.limitLabel || "a = " + K.fmt(limit, 3), "s-text-strong", "end");

      const n0Line = K.svg("line", { y1: 16, y2: H - 24, class: "s-axis", "stroke-width": 2 }, svg);
      const n0Label = K.text(svg, 0, 8, "", "s-text-strong");
      const dots = vals.map((v, i) => K.svg("circle", { cx: x(i + 1), cy: y(K.clamp(v, yr[0] - 10, yr[1] + 10)), r: 3.4 }, svg));
      const hit = K.svg("rect", { x: 34, y: 0, width: W - 42, height: H - 24, class: "s-hit" }, svg);

      const controls = LW.el("div");
      host.append(controls);
      const fixedEps = p.fixedEps != null ? p.fixedEps : null;
      let eps = fixedEps != null ? fixedEps : p.eps || 0.25;
      let n0 = p.n0 || Math.ceil(nMax / 3);
      let locked = false;
      const epsSlider = K.slider(controls, {
        labelHtml: "&epsilon;", min: p.epsMin || 0.01, max: p.epsMax || 1, step: 0.01, value: eps, format: (v) => K.fmt(v, 2),
        onInput: (v) => { eps = v; paint(); ctx.changed(); },
      });
      if (fixedEps != null) epsSlider.disable(true);
      const nSlider = K.slider(controls, {
        labelHtml: "n<sub>0</sub>", min: 1, max: nMax, step: 1, value: n0, format: (v) => String(v),
        onInput: (v) => { n0 = v; paint(); ctx.changed(); },
      });
      if (p.showN0 === false) nSlider.el.style.display = "none";
      const out = K.readout(host);

      K.drag(svg, hit, (pt) => {
        if (locked || p.showN0 === false) return;
        n0 = K.clamp(Math.round(x.inv(pt.x)), 1, nMax);
        nSlider.set(n0);
        paint();
        ctx.changed();
      });

      const outside = (i) => Math.abs(vals[i] - limit) >= eps - 1e-12;
      function firstGoodN0() {
        for (let k = nMax; k >= 1; k--) if (outside(k - 1)) return k + 1 <= nMax ? k + 1 : null;
        return 1;
      }

      function paint() {
        band.setAttribute("y", y(limit + eps));
        band.setAttribute("height", Math.max(0, y(limit - eps) - y(limit + eps)));
        bandTop.setAttribute("y1", y(limit + eps)); bandTop.setAttribute("y2", y(limit + eps));
        bandBot.setAttribute("y1", y(limit - eps)); bandBot.setAttribute("y2", y(limit - eps));
        const showN0 = p.showN0 !== false;
        n0Line.style.display = showN0 ? "" : "none";
        n0Label.style.display = showN0 ? "" : "none";
        n0Line.setAttribute("x1", x(n0 - 0.5)); n0Line.setAttribute("x2", x(n0 - 0.5));
        n0Label.setAttribute("x", x(n0 - 0.5)); n0Label.textContent = "n₀ = " + n0;
        let bad = null;
        vals.forEach((v, i) => {
          const n = i + 1;
          const out_ = outside(i);
          let cls = "s-accent-fill";
          if (showN0 && n < n0) cls = out_ ? "s-orange" : "s-accent-fill";
          if (showN0 && n >= n0 && out_) { cls = "s-red"; if (!bad) bad = n; }
          if (!showN0) cls = out_ ? "s-orange" : "s-accent-fill";
          dots[i].setAttribute("class", cls);
          dots[i].setAttribute("opacity", showN0 && n < n0 ? 0.45 : 1);
        });
        let html = "<b>&epsilon; = " + K.fmt(eps, 2) + "</b>";
        if (showN0) {
          html += " &nbsp; ";
          html += bad ? K.pill(false, "a" + sub(bad) + " liegt außerhalb") : K.pill(true, "ab n₀ = " + n0 + " alle im Band");
          const good = firstGoodN0();
          if (p.showMinimal && good) html += " &nbsp;kleinstes passendes n₀ hier: " + good;
        } else {
          const cnt = vals.filter((v, i) => outside(i)).length;
          html += " &nbsp; " + cnt + " von " + nMax + " gezeigten Folgengliedern liegen außerhalb";
        }
        out.set(html);
      }
      const sub = (n) => String(n).split("").map((d) => "₀₁₂₃₄₅₆₇₈₉"[+d]).join("");
      paint();

      return {
        check(goal) {
          if (goal.eps != null && Math.abs(goal.eps - eps) > 1e-9) return { correct: false, detail: "Stelle zuerst ε = " + K.fmt(goal.eps, 2) + " ein." };
          for (let i = n0 - 1; i < nMax; i++) if (outside(i)) return { correct: false, detail: "Für n = " + (i + 1) + " ist |aₙ − a| = " + K.fmt(Math.abs(vals[i] - limit), 4) + " ≥ ε. Wähle n₀ größer." };
          if (goal.minimal) {
            const best = firstGoodN0();
            if (best != null && n0 > best) return { correct: false, detail: "Das funktioniert, aber es geht kleiner: Schon ab n₀ = " + best + " liegen alle Glieder im Band." };
          }
          return { correct: true };
        },
        solve(goal) {
          if (goal.eps != null) { eps = goal.eps; epsSlider.set(eps); }
          const best = firstGoodN0();
          if (best) { n0 = best; nSlider.set(n0); }
          paint();
        },
        getVar: (k) => (k === "eps" ? eps : k === "n0" ? n0 : NaN),
        setVar(k, v) {
          if (k === "eps") { eps = Math.max(0.001, v); epsSlider.set(eps); }
          if (k === "n0") { n0 = K.clamp(Math.round(v), 1, nMax); nSlider.set(n0); }
          paint();
        },
        lock() { locked = true; epsSlider.disable(true); nSlider.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------ nested intervals

  LW.widget("nested-intervals", {
    mount(host, p, ctx) {
      const W = 360, H = 200;
      const a = LW.expr(p.a), b = LW.expr(p.b);
      const steps = p.steps || 8;
      const range = p.range || [0, 2];
      const x = K.scale(range[0], range[1], 34, W - 14);
      const svg = K.root(host, W, H, "Intervallschachtelung");
      K.svg("line", { x1: 10, y1: H - 34, x2: W - 10, y2: H - 34, class: "s-axis" }, svg);
      K.ticks(range[0], range[1], 5).forEach((t) => {
        K.svg("line", { x1: x(t), y1: H - 38, x2: x(t), y2: H - 30, class: "s-axis" }, svg);
        K.text(svg, x(t), H - 16, K.fmt(t, 2));
      });
      const layer = K.svg("g", null, svg);
      const out = K.readout(host);
      let shown = 1;
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Nächstes Intervall", () => { if (shown < steps) { shown++; paint(); ctx.changed(); } });
      K.button(row, "Zurücksetzen", () => { shown = 1; paint(); ctx.changed(); });
      function paint() {
        K.clear(layer);
        const rowH = Math.min(18, (H - 60) / steps);
        for (let n = 1; n <= shown; n++) {
          const an = a({ n }), bn = b({ n });
          const yy = 14 + (n - 1) * rowH;
          const last = n === shown;
          K.svg("rect", { x: x(an), y: yy, width: Math.max(2, x(bn) - x(an)), height: rowH - 5, rx: 4, class: last ? "s-accent-fill" : "s-soft-fill", opacity: last ? 0.9 : 1 }, layer);
          K.text(layer, x(an) - 6, yy + (rowH - 5) / 2, "I" + n, "s-text", "end");
        }
        const an = a({ n: shown }), bn = b({ n: shown });
        out.set("<b>I<sub>" + shown + "</sub> = [" + K.fmt(an, 6) + ", " + K.fmt(bn, 6) + "]</b> &nbsp; Länge " + K.fmt(bn - an, 6));
      }
      paint();
      return {
        getVar: (k) => (k === "n" ? shown : NaN),
        setVar(k, v) { if (k === "n") { shown = K.clamp(Math.round(v), 1, steps); paint(); } },
        act(name) { if (name === "next" && shown < steps) { shown++; paint(); } if (name === "reset") { shown = 1; paint(); } },
      };
    },
  });

  // ------------------------------------------------------------ truth tables

  /** Boolean formula parser: ¬ ! not, ∧ & and, ∨ | or, ⇒ -> =>, ⇔ <-> <=>, xor. */
  function boolExpr(src) {
    const s = String(src).replace(/¬/g, "!").replace(/∧/g, "&").replace(/∨/g, "|").replace(/⇒|→/g, "=>").replace(/⇔|↔/g, "<=>");
    const toks = s.match(/<=>|<->|=>|->|&&|\|\||[!&|()]|xor|not|and|or|[A-Za-z][A-Za-z0-9]*|\S/g) || [];
    let i = 0;
    const peek = () => toks[i];
    const eat = () => toks[i++];
    function prim() {
      const t = eat();
      if (t === "(") { const e = equiv(); eat(); return e; }
      if (t === "!" || t === "not") { const e = prim(); return (v) => !e(v); }
      if (t === "1" || t === "w") return () => true;
      if (t === "0" || t === "f") return () => false;
      return (v) => !!v[t];
    }
    function and() { let e = prim(); while (["&", "&&", "and"].includes(peek())) { eat(); const l = e, r = prim(); e = (v) => l(v) && r(v); } return e; }
    function or() { let e = and(); while (["|", "||", "or", "xor"].includes(peek())) { const op = eat(); const l = e, r = and(); e = op === "xor" ? (v) => l(v) !== r(v) : (v) => l(v) || r(v); } return e; }
    function impl() { const l = or(); if (["=>", "->"].includes(peek())) { eat(); const r = impl(); return (v) => !l(v) || r(v); } return l; }
    function equiv() { let e = impl(); while (["<=>", "<->"].includes(peek())) { eat(); const l = e, r = impl(); e = (v) => l(v) === r(v); } return e; }
    return equiv();
  }

  LW.widget("truth-table", {
    mount(host, p, ctx) {
      const vars = p.vars || ["A", "B"];
      const cols = (p.columns || []).map((c) => Object.assign({ fn: boolExpr(c.expr) }, c));
      const rows = [];
      for (let m = 0; m < 1 << vars.length; m++) {
        const v = {};
        vars.forEach((name, k) => { v[name] = !((m >> (vars.length - 1 - k)) & 1); });
        rows.push(v);
      }
      const W = (b) => (b ? "w" : "f");
      const table = LW.el("table", { class: "lw-md", style: "margin-top:4px" });
      const tbl = LW.el("div", { class: "lw-md" }, [table]);
      host.append(tbl);
      const thead = LW.el("tr", null, vars.map((name) => LW.el("th", { html: LW.math(name) })).concat(cols.map((c) => LW.el("th", { html: LW.math(c.label || c.expr) }))));
      table.append(LW.el("thead", null, thead));
      const tbody = LW.el("tbody");
      table.append(tbody);
      const user = rows.map(() => cols.map(() => null));
      let locked = false;
      const cells = [];
      rows.forEach((v, r) => {
        const tr = LW.el("tr");
        vars.forEach((name) => tr.append(LW.el("td", { text: W(v[name]) })));
        cells[r] = [];
        cols.forEach((c, k) => {
          const td = LW.el("td");
          if (c.ask) {
            const b = LW.el("button", { class: "w-btn", type: "button", text: "?", style: "min-width:44px", "aria-label": "Wert umschalten" });
            b.addEventListener("click", () => {
              if (locked) return;
              user[r][k] = user[r][k] === true ? false : true;
              b.textContent = W(user[r][k]);
              b.classList.toggle("on", true);
              b.style.background = ""; b.style.color = "";
              ctx.changed();
            });
            td.append(b);
            cells[r][k] = b;
          } else td.textContent = W(c.fn(v));
          tr.append(td);
        });
        tbody.append(tr);
      });
      return {
        check() {
          let ok = true;
          rows.forEach((v, r) => cols.forEach((c, k) => {
            if (!c.ask) return;
            const good = user[r][k] === c.fn(v);
            ok = ok && good;
            const b = cells[r][k];
            b.style.background = good ? "var(--green)" : "var(--red)";
            b.style.color = "white";
          }));
          return { correct: ok, detail: ok ? null : "Die rot markierten Zeilen stimmen noch nicht." };
        },
        solve() {
          rows.forEach((v, r) => cols.forEach((c, k) => {
            if (!c.ask) return;
            user[r][k] = c.fn(v);
            const b = cells[r][k];
            b.textContent = W(user[r][k]); b.style.background = "var(--green)"; b.style.color = "white";
          }));
        },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------ induction as falling dominoes

  LW.widget("induction", {
    mount(host, p, ctx) {
      const N = p.n || 8;
      const W = 360, H = 170;
      const svg = K.root(host, W, H, "Dominosteine");
      const gap = (W - 50) / N;
      const baseY = 128;
      K.svg("line", { x1: 8, y1: baseY, x2: W - 8, y2: baseY, class: "s-axis" }, svg);
      const stones = [];
      for (let k = 0; k < N; k++) {
        const cx = 28 + k * gap;
        const g = K.svg("g", null, svg);
        K.svg("rect", { x: -6, y: -66, width: 12, height: 66, rx: 3, class: "s-accent-fill" }, g);
        K.text(svg, cx, baseY + 17, "A(" + (k + 1) + ")", "s-text").style.fontSize = "10px";
        g.setAttribute("transform", "translate(" + cx + "," + baseY + ")");
        stones.push({ g, cx, angle: 0, falls: false });
      }
      const brokenMark = K.svg("g", null, svg);
      let ia = p.ia !== false;
      let breakAt = p.breakAt || 0; // 0 = every step holds; k = the step A(k) => A(k+1) fails
      const controls = LW.el("div", { class: "w-btns" });
      host.append(controls);
      const iaBtn = K.button(controls, "", () => { ia = !ia; reset(); ctx.changed(); });
      const isBtn = K.button(controls, "", () => { breakAt = breakAt ? 0 : Math.max(2, Math.floor(N / 2)); reset(); ctx.changed(); });
      const goBtn = K.button(controls, "Anstoßen", () => run());
      goBtn.classList.add("on");
      const out = K.readout(host);
      let raf = 0;

      function labels() {
        iaBtn.textContent = ia ? "Induktionsanfang: gilt" : "Induktionsanfang: fehlt";
        isBtn.textContent = breakAt ? "Induktionsschritt: bricht bei " + breakAt + " → " + (breakAt + 1) : "Induktionsschritt: gilt immer";
        K.clear(brokenMark);
        if (breakAt) {
          const xm = (stones[breakAt - 1].cx + stones[breakAt].cx) / 2;
          K.svg("line", { x1: xm, y1: baseY - 82, x2: xm, y2: baseY + 4, class: "s-red", "stroke-width": 2, "stroke-dasharray": "4 4" }, brokenMark);
        }
      }
      function draw() {
        stones.forEach((s) => s.g.setAttribute("transform", "translate(" + s.cx + "," + baseY + ") rotate(" + s.angle + ")"));
      }
      function reset() {
        cancelAnimationFrame(raf);
        stones.forEach((s, k) => {
          s.angle = 0;
          s.falls = ia && (!breakAt || k < breakAt);
        });
        // stones moved apart at the broken step
        stones.forEach((s, k) => { s.cx = 28 + k * gap + (breakAt && k >= breakAt ? 18 : 0); });
        labels();
        draw();
        out.set(ia ? (breakAt ? "Der Schritt von A(" + breakAt + ") nach A(" + (breakAt + 1) + ") fehlt." : "Anfang und Schritt gelten.") : "Ohne Anfang fällt kein Stein, egal wie gut der Schritt ist.");
      }
      function run() {
        reset();
        if (!ia) { out.set("Ohne Induktionsanfang fällt der erste Stein nicht. Die Aussage ist für kein n bewiesen."); return; }
        let k = 0;
        let t0 = performance.now();
        const fallMs = 260;
        const tick = (t) => {
          const s = stones[k];
          if (!s || !s.falls) {
            const count = stones.filter((x) => x.falls).length;
            out.set(count === N ? "<b>Alle " + N + " Steine fallen.</b> Für jedes n gilt A(n), auch weit über die gezeigten hinaus." : "<b>Nur A(1) bis A(" + count + ") fallen.</b> Ab A(" + (count + 1) + ") ist nichts bewiesen.");
            return;
          }
          const q = Math.min(1, (t - t0) / fallMs);
          s.angle = 72 * q * q;
          draw();
          if (q >= 1) { k++; t0 = t; }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        ctx.changed();
      }
      reset();
      return {
        act(name, arg) {
          if (name === "ia") { ia = !!arg; reset(); }
          if (name === "break") { breakAt = arg ? Math.max(1, Math.min(N - 1, arg)) : 0; reset(); }
          if (name === "run") run();
          if (name === "reset") reset();
        },
      };
    },
  });

  LW.analysis = { boolExpr, describeSet };
})();
