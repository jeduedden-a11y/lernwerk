/* Generic graph widgets, configured entirely from lesson JSON so new illustrations need no app update.
 *
 *   plot:   functions with parameters, draggable points, tangents and secants, areas, Riemann sums,
 *           epsilon and delta bands, readouts and goals written as expressions.
 *   curves: economics diagrams made of straight lines that can be shifted by dragging, with intersections,
 *           shaded areas (surplus, tax revenue), and a point the learner places.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  const COLORS = { accent: "var(--accent)", orange: "var(--orange)", green: "var(--green)", red: "var(--red)", teal: "var(--teal)", blue: "var(--blue)", label: "var(--label)", gray: "var(--label-2)", yellow: "var(--yellow)" };
  const col = (c) => COLORS[c] || c || "var(--accent)";
  let uid = 0;

  /** Compiles a value that may be a number or an expression string. */
  function val(v) {
    if (typeof v === "number") return () => v;
    if (v == null) return () => NaN;
    const f = LW.expr(String(v));
    return (scope) => { try { return f(scope); } catch (e) { return NaN; } };
  }

  /** Replaces {expr} and {expr|2} by formatted numbers, then renders Markdown with math. */
  function template(str, scope) {
    // Inside $...$ numbers need a TeX decimal comma ({,}) and an ASCII minus.
    const parts = String(str).split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/);
    const filled = parts.map((part, i) => {
      const inMath = i % 2 === 1;
      return part.replace(/\{([^{}|]+)(?:\|(\d))?\}/g, (m, e, d) => {
        if (inMath && /^,$/.test(e)) return m;
        let v;
        try { v = LW.expr(e)(scope); } catch (err) { return m; }
        if (!isFinite(v)) return "–";
        const s = K.fmt(v, d != null ? +d : 2);
        return inMath ? s.replace(/−/g, "-").replace(/,/g, "{,}").replace(/\./g, "{.}") : s;
      });
    }).join("");
    return LW.md(filled);
  }
  LW.graphTemplate = template;

  function frame(host, p, label) {
    const W = 360, H = p.height || 260;
    const svg = K.root(host, W, H, label);
    svg.style.maxWidth = (p.maxWidth || 520) + "px";
    svg.style.margin = "0 auto";
    const left = p.yLabel ? 40 : 34, bottom = p.xLabel ? 36 : 26;
    const xr = p.x || [-5, 5], yr = p.y || [-5, 5];
    const x = K.scale(xr[0], xr[1], left, W - 10);
    const y = K.scale(yr[0], yr[1], H - bottom, 14);
    const id = "lwclip" + ++uid;
    const defs = K.svg("defs", null, svg);
    const cp = K.svg("clipPath", { id }, defs);
    K.svg("rect", { x: left, y: 14, width: W - 10 - left, height: H - bottom - 14 }, cp);
    const axes = K.svg("g", null, svg);
    if (p.grid !== false) {
      K.ticks(yr[0], yr[1], 5).forEach((t) => K.svg("line", { x1: left, y1: y(t), x2: W - 10, y2: y(t), class: "s-grid" }, axes));
      K.ticks(xr[0], xr[1], 6).forEach((t) => K.svg("line", { x1: x(t), y1: 14, x2: x(t), y2: H - bottom, class: "s-grid" }, axes));
    }
    const x0 = K.clamp(0, xr[0], xr[1]), y0 = K.clamp(0, yr[0], yr[1]);
    K.svg("line", { x1: left, y1: y(y0), x2: W - 10, y2: y(y0), class: "s-axis" }, axes);
    K.svg("line", { x1: x(x0), y1: 14, x2: x(x0), y2: H - bottom, class: "s-axis" }, axes);
    K.ticks(yr[0], yr[1], 5).forEach((t) => K.text(axes, left - 6, y(t), K.fmt(t, 2), "s-text", "end"));
    K.ticks(xr[0], xr[1], 6).forEach((t) => K.text(axes, x(t), H - bottom + 13, K.fmt(t, 2)));
    if (p.xLabel) K.text(axes, W - 10, H - 6, p.xLabel, "s-text-strong", "end");
    if (p.yLabel) K.text(axes, left + 4, 7, p.yLabel, "s-text-strong", "start");
    const plot = K.svg("g", { "clip-path": "url(#" + id + ")" }, svg);
    const over = K.svg("g", null, svg);
    return { svg, W, H, x, y, xr, yr, plot, over, left, bottom };
  }

  function sliders(host, defs, scope, onChange) {
    const out = {};
    (defs || []).forEach((d) => {
      scope[d.name] = d.value != null ? d.value : (d.min + d.max) / 2;
      if (d.hidden) return;
      out[d.name] = K.slider(host, {
        labelHtml: d.labelHtml || (d.label ? LW.md(d.label).replace(/^<p>|<\/p>$/g, "") : LW.esc(d.name)),
        min: d.min, max: d.max, step: d.step || 0.1, value: scope[d.name],
        format: (v) => (d.format ? d.format.replace("{v}", K.fmt(v, d.digits != null ? d.digits : 2)) : K.fmt(v, d.digits != null ? d.digits : 2)),
        onInput: (v) => { scope[d.name] = v; onChange(); },
      });
    });
    return out;
  }

  function polyline(g, pts, attrs) {
    let d = "", pen = false;
    for (const [px, py] of pts) {
      if (!isFinite(px) || !isFinite(py) || Math.abs(py) > 1e5) { pen = false; continue; }
      d += (pen ? "L" : "M") + px.toFixed(2) + "," + py.toFixed(2);
      pen = true;
    }
    return K.svg("path", Object.assign({ d, fill: "none" }, attrs), g);
  }

  function checkGoal(goal, scope) {
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: template(h.text, scope).replace(/^<p>|<\/p>$/g, "") }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: goal.message ? template(goal.message, scope).replace(/^<p>|<\/p>$/g, "") : null };
  }

  // ================================================================== plot

  LW.widget("plot", {
    mount(host, p, ctx) {
      const F = frame(host, p, p.aria || "Funktionsgraph");
      const { x, y, xr, yr } = F;
      const scope = { __f: {} };
      let locked = false;
      const ctrl = LW.el("div");
      const ui = sliders(ctrl, p.vars, scope, () => { paint(); ctx.changed(); });

      // functions are compiled once; each may call earlier ones
      const fns = (p.functions || []).map((f, i) => Object.assign({ name: f.name || "f" + (i ? i + 1 : ""), fn: LW.expr(f.expr) }, f));
      fns.forEach((f) => {
        scope.__f[f.name] = (t) => { try { return f.fn(Object.assign({}, scope, { x: t })); } catch (e) { return NaN; } };
        scope.__f[f.name + "'"] = (t) => { const h = 1e-5; return (scope.__f[f.name](t + h) - scope.__f[f.name](t - h)) / (2 * h); };
      });

      const out = K.readout(host);
      host.append(ctrl);

      // draggable points bound to variables
      const handles = [];
      (p.points || []).forEach((pt) => {
        if (!pt.drag) return;
        const h = K.svg("circle", { r: 18, class: "s-hit" }, F.over);
        handles.push({ pt, h });
        K.drag(F.svg, h, (q) => {
          if (locked) return;
          const snap = pt.snap || 0.05;
          const xv = typeof pt.x === "string" ? pt.x : null;
          if (xv && (pt.drag === "x" || pt.drag === "xy")) {
            const d = (p.vars || []).find((v) => v.name === xv) || {};
            scope[xv] = K.clamp(K.snap(x.inv(q.x), snap), d.min != null ? d.min : xr[0], d.max != null ? d.max : xr[1]);
            if (ui[xv]) ui[xv].set(scope[xv]);
          }
          if (pt.drag === "xy" && typeof pt.y === "string") {
            const d = (p.vars || []).find((v) => v.name === pt.y) || {};
            scope[pt.y] = K.clamp(K.snap(y.inv(q.y), snap), d.min != null ? d.min : yr[0], d.max != null ? d.max : yr[1]);
            if (ui[pt.y]) ui[pt.y].set(scope[pt.y]);
          }
          paint();
          ctx.changed();
        });
      });

      const E = (v) => val(v)(scope);

      function paint() {
        K.clear(F.plot);
        const g = F.plot;
        // bands first (they sit behind the curves)
        (p.hbands || []).forEach((b) => {
          const c = E(b.y), e = E(b.eps);
          K.svg("rect", { x: F.left, y: y(c + e), width: F.W, height: Math.max(0, y(c - e) - y(c + e)), fill: col(b.color || "accent"), opacity: 0.14 }, g);
          [c + e, c - e].forEach((yy) => K.svg("line", { x1: F.left, y1: y(yy), x2: F.W, y2: y(yy), stroke: col(b.color || "accent"), "stroke-dasharray": "5 4", "stroke-width": 1.2 }, g));
        });
        (p.vbands || []).forEach((b) => {
          const c = E(b.x), d = E(b.d);
          K.svg("rect", { x: x(c - d), y: 0, width: Math.max(0, x(c + d) - x(c - d)), height: F.H, fill: col(b.color || "orange"), opacity: 0.14 }, g);
          [c - d, c + d].forEach((xx) => K.svg("line", { x1: x(xx), y1: 0, x2: x(xx), y2: F.H, stroke: col(b.color || "orange"), "stroke-dasharray": "5 4", "stroke-width": 1.2 }, g));
        });
        (p.areas || []).forEach((a) => {
          const f = scope.__f[a.f];
          const base = a.base ? scope.__f[a.base] : null;
          const from = E(a.from), to = E(a.to);
          if (!f || !isFinite(from) || !isFinite(to)) return;
          const n = 120, pts = [];
          for (let i = 0; i <= n; i++) { const t = from + ((to - from) * i) / n; pts.push([x(t), y(f(t))]); }
          for (let i = n; i >= 0; i--) { const t = from + ((to - from) * i) / n; pts.push([x(t), y(base ? base(t) : 0)]); }
          K.svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill: col(a.color || "accent"), opacity: a.opacity || 0.22 }, g);
        });
        (p.riemann || []).forEach((r) => {
          const f = scope.__f[r.f];
          const from = E(r.from), to = E(r.to), n = Math.max(1, Math.round(E(r.n)));
          const kind = typeof r.kind === "string" && /^(lower|upper|left|right|mid)$/.test(r.kind) ? r.kind : ["lower", "upper", "left", "right", "mid"][Math.round(E(r.kind))] || "left";
          const w = (to - from) / n;
          let sum = 0;
          for (let i = 0; i < n; i++) {
            const a = from + i * w, b = a + w;
            let h;
            if (kind === "left") h = f(a); else if (kind === "right") h = f(b); else if (kind === "mid") h = f(a + w / 2);
            else {
              let lo = Infinity, hi = -Infinity;
              for (let k = 0; k <= 24; k++) { const v = f(a + (w * k) / 24); lo = Math.min(lo, v); hi = Math.max(hi, v); }
              h = kind === "lower" ? lo : hi;
            }
            sum += h * w;
            K.svg("rect", { x: x(a), y: Math.min(y(h), y(0)), width: Math.max(0.5, x(b) - x(a)), height: Math.abs(y(0) - y(h)), fill: col(r.color || "accent"), opacity: 0.22, stroke: col(r.color || "accent"), "stroke-width": 0.8 }, g);
          }
          scope[r.name || "S"] = sum;
        });
        fns.forEach((f) => {
          if (f.hidden) return;
          const dom = f.domain ? [E(f.domain[0]), E(f.domain[1])] : xr;
          const n = f.samples || 260, pts = [];
          for (let i = 0; i <= n; i++) { const t = dom[0] + ((dom[1] - dom[0]) * i) / n; pts.push([x(t), y(scope.__f[f.name](t))]); }
          polyline(g, pts, { stroke: col(f.color), "stroke-width": f.width || 2.6, "stroke-dasharray": f.dashed ? "6 5" : null, "stroke-linejoin": "round" });
          if (f.label) {
            const lx = f.labelAt != null ? E(f.labelAt) : dom[0] + (dom[1] - dom[0]) * 0.86;
            K.text(g, x(lx) + 4, y(scope.__f[f.name](lx)) - 11, f.label, "s-text-strong", "start").style.fill = col(f.color);
          }
        });
        const drawLine = (x1, y1, x2, y2, l) => {
          K.svg("line", { x1: x(x1), y1: y(y1), x2: x(x2), y2: y(y2), stroke: col(l.color || "orange"), "stroke-width": l.width || 2, "stroke-dasharray": l.dashed ? "6 5" : null }, g);
          if (l.label) K.text(g, x(x2) + 4, y(y2) - 8, l.label, "s-text-strong", "start").style.fill = col(l.color || "orange");
        };
        (p.tangents || []).forEach((t) => {
          const f = scope.__f[t.f], at = E(t.at);
          const m = scope.__f[t.f + "'"](at), y0 = f(at), L = t.length || (xr[1] - xr[0]);
          scope[t.slopeName || "m"] = m;
          drawLine(at - L, y0 - m * L, at + L, y0 + m * L, Object.assign({ color: "orange" }, t, { label: null }));
        });
        (p.secants || []).forEach((s) => {
          const f = scope.__f[s.f], a = E(s.from), b = E(s.to);
          const m = (f(b) - f(a)) / (b - a), L = xr[1] - xr[0];
          scope[s.slopeName || "ms"] = m;
          drawLine(a - L, f(a) - m * L, a + L, f(a) + m * L, Object.assign({ color: "green" }, s, { label: null }));
        });
        (p.lines || []).forEach((l) => drawLine(E(l.from[0]), E(l.from[1]), E(l.to[0]), E(l.to[1]), l));
        (p.hlines || []).forEach((l) => drawLine(xr[0], E(l.y), xr[1], E(l.y), Object.assign({ dashed: true, color: "gray", width: 1.4 }, l, { label: null })));
        (p.vlines || []).forEach((l) => drawLine(E(l.x), yr[0], E(l.x), yr[1], Object.assign({ dashed: true, color: "gray", width: 1.4 }, l, { label: null })));

        // points and labels on top, outside the clip so handles stay grabbable
        K.clear(F.over);
        handles.forEach(({ h }) => F.over.append(h));
        (p.points || []).forEach((pt) => {
          const px = E(pt.x);
          const py = pt.on ? scope.__f[pt.on](px) : E(pt.y);
          if (pt.as) { scope[pt.as + "_x"] = px; scope[pt.as + "_y"] = py; }
          if (!isFinite(px) || !isFinite(py) || py < yr[0] - 1e-9 || py > yr[1] + 1e-9) return;
          if (pt.guides) {
            K.svg("line", { x1: x(px), y1: y(py), x2: x(px), y2: y(Math.max(yr[0], 0)), class: "s-axis", "stroke-dasharray": "3 4" }, F.over);
            K.svg("line", { x1: x(px), y1: y(py), x2: x(Math.max(xr[0], 0)), y2: y(py), class: "s-axis", "stroke-dasharray": "3 4" }, F.over);
          }
          const dragging = !!pt.drag;
          K.svg("circle", { cx: x(px), cy: y(py), r: dragging ? 9 : 5.5, fill: dragging ? "#fff" : col(pt.color || "label"), stroke: col(pt.color || "accent"), "stroke-width": dragging ? 3 : 0, filter: dragging ? "drop-shadow(0 2px 3px rgba(0,0,0,.2))" : null }, F.over);
          if (pt.label) K.text(F.over, x(px) + 10, y(py) - 12, pt.label, "s-text-strong", "start");
          const hh = handles.find((z) => z.pt === pt);
          if (hh) { hh.h.setAttribute("cx", x(px)); hh.h.setAttribute("cy", y(py)); }
        });
        (p.labels || []).forEach((l) => K.text(F.over, x(E(l.x)), y(E(l.y)), l.text, "s-text-strong", l.anchor || "middle").style.fill = col(l.color || "label"));
        if (p.readout) out.el.innerHTML = template(p.readout, scope);
      }
      paint();

      return {
        check(goal) { return checkGoal(goal, scope); },
        solve(goal) {
          if (goal.solve) Object.keys(goal.solve).forEach((k) => { scope[k] = goal.solve[k]; if (ui[k]) ui[k].set(scope[k]); });
          paint();
        },
        getVar: (k) => scope[k],
        setVar(k, v) { scope[k] = v; if (ui[k]) ui[k].set(v); paint(); },
        lock() { locked = true; Object.values(ui).forEach((s) => s.disable(true)); },
      };
    },
  });

  // ================================================================== curves (economics)

  LW.widget("curves", {
    mount(host, p, ctx) {
      const F = frame(host, Object.assign({ x: [0, 10], y: [0, 12] }, p), p.aria || "Diagramm");
      const { x, y, xr, yr } = F;
      const scope = { __f: {} };
      let locked = false;
      const ctrl = LW.el("div");
      const ui = sliders(ctrl, p.vars, scope, () => { paint(); ctx.changed(); });
      const out = K.readout(host);
      host.append(ctrl);

      const lines = (p.lines || []).map((l) => Object.assign({ dy: 0 }, l, { a: val(l.a), m: val(l.m), a0: l.a, m0: l.m }));
      lines.forEach((l) => { scope[l.id + "_dy"] = 0; scope[l.id + "_dx"] = 0; });
      const lineY = (l, t) => l.a(scope) + l.dy + l.m(scope) * t;
      const placed = { on: false, x: NaN, y: NaN };
      scope.place_x = NaN; scope.place_y = NaN;

      // shift handles
      const handles = lines.filter((l) => l.shift).map((l) => {
        const h = K.svg("g", null, F.over);
        K.svg("circle", { r: 11, class: "s-handle" }, h);
        K.svg("path", { d: "M-5,-2 L0,-7 L5,-2 M-5,2 L0,7 L5,2", fill: "none", stroke: col(l.color), "stroke-width": 1.8, "stroke-linecap": "round" }, h);
        const hit = K.svg("circle", { r: 22, class: "s-hit" }, h);
        K.drag(F.svg, hit, (q) => {
          if (locked) return;
          const px = x.inv(q.x), py = y.inv(q.y);
          const range = l.shiftRange || [-6, 6];
          const step = l.shiftStep || 0.5;
          // the line through the finger with the same slope
          l.dy = K.clamp(K.snap(py - (l.a(scope) + l.m(scope) * px), step), range[0], range[1]);
          paint();
          ctx.changed();
        });
        return { l, h };
      });

      if (p.place) {
        const hit = K.svg("rect", { x: F.left, y: 14, width: F.W - 10 - F.left, height: F.H - F.bottom - 14, class: "s-hit" }, F.svg);
        F.svg.insertBefore(hit, F.over);
        K.drag(F.svg, hit, (q) => {
          if (locked) return;
          const snap = p.place.snap || 0.5;
          placed.on = true;
          placed.x = K.clamp(K.snap(x.inv(q.x), snap), xr[0], xr[1]);
          placed.y = K.clamp(K.snap(y.inv(q.y), snap), yr[0], yr[1]);
          scope.place_x = placed.x; scope.place_y = placed.y;
          paint();
          ctx.changed();
        });
      }

      function intersect(A, B) {
        const ma = A.m(scope), mb = B.m(scope);
        if (Math.abs(ma - mb) < 1e-12) return [NaN, NaN];
        const ta = (B.a(scope) + B.dy - (A.a(scope) + A.dy)) / (ma - mb);
        return [ta, lineY(A, ta)];
      }

      const E = (v) => val(v)(scope);

      function paint() {
        lines.forEach((l) => {
          scope[l.id + "_dy"] = l.dy;
          const m = l.m(scope);
          scope[l.id + "_dx"] = Math.abs(m) > 1e-12 ? -l.dy / m : 0;
          scope[l.id + "_a"] = l.a(scope) + l.dy;
          scope[l.id + "_m"] = m;
          scope.__f[l.id] = (t) => lineY(l, t);
        });
        (p.intersections || []).forEach((it) => {
          const A = lines.find((l) => l.id === it.of[0]), B = lines.find((l) => l.id === it.of[1]);
          const [ix, iy] = A && B ? intersect(A, B) : [NaN, NaN];
          scope[it.id + "_x"] = ix; scope[it.id + "_y"] = iy;
        });
        (p.derived || []).forEach((d) => { scope[d.name] = E(d.expr); });

        K.clear(F.plot);
        const g = F.plot;
        (p.shades || []).forEach((s) => {
          if (s.when && !E(s.when)) return;
          const pts = s.points.map((q) => [x(E(q[0])), y(E(q[1]))]);
          if (pts.some((q) => !isFinite(q[0]) || !isFinite(q[1]))) return;
          K.svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill: col(s.color), opacity: s.opacity || 0.22 }, g);
          if (s.label) {
            const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
            const t = K.text(g, cx, cy, s.label, "s-text-strong");
            t.style.fill = col(s.color);
            t.style.fontSize = "11px";
          }
        });
        (p.hlines || []).forEach((l) => {
          if (l.when && !E(l.when)) return;
          const yy = E(l.y);
          K.svg("line", { x1: x(xr[0]), y1: y(yy), x2: x(xr[1]), y2: y(yy), stroke: col(l.color || "red"), "stroke-width": 2, "stroke-dasharray": l.dashed === false ? null : "6 4" }, g);
          if (l.label) K.text(g, x(xr[1]) - 4, y(yy) - 9, l.label, "s-text-strong", "end").style.fill = col(l.color || "red");
        });
        (p.vlines || []).forEach((l) => {
          if (l.when && !E(l.when)) return;
          const xx = E(l.x);
          K.svg("line", { x1: x(xx), y1: y(yr[0]), x2: x(xx), y2: y(yr[1]), stroke: col(l.color || "red"), "stroke-width": 2, "stroke-dasharray": l.dashed === false ? null : "6 4" }, g);
          if (l.label) K.text(g, x(xx) + 5, y(yr[1]) + 12, l.label, "s-text-strong", "start").style.fill = col(l.color || "red");
        });
        lines.forEach((l) => {
          if (l.hidden) return;
          const ends = [xr[0], xr[1]];
          if (l.ghost !== false && l.dy !== 0) {
            const a0 = l.a(scope), m = l.m(scope);
            K.svg("line", { x1: x(ends[0]), y1: y(a0 + m * ends[0]), x2: x(ends[1]), y2: y(a0 + m * ends[1]), stroke: col(l.color), "stroke-width": 2, "stroke-dasharray": "4 5", opacity: 0.45 }, g);
          }
          K.svg("line", { x1: x(ends[0]), y1: y(lineY(l, ends[0])), x2: x(ends[1]), y2: y(lineY(l, ends[1])), stroke: col(l.color), "stroke-width": l.width || 3, "stroke-linecap": "round", "stroke-dasharray": l.dashed ? "7 5" : null, opacity: l.opacity || 1 }, g);
        });

        K.clear(F.over);
        lines.forEach((l) => {
          if (l.hidden || !l.label) return;
          // label near the visible end of the line
          let t = l.labelAt != null ? E(l.labelAt) : null;
          if (t == null) {
            const m = l.m(scope);
            const top = m !== 0 ? (yr[1] - (l.a(scope) + l.dy)) / m : xr[1];
            t = m < 0 ? K.clamp((yr[0] + 0.6 - (l.a(scope) + l.dy)) / m - 0.4, xr[0] + 0.3, xr[1] - 0.3) : K.clamp(top - 0.6, xr[0] + 0.3, xr[1] - 0.3);
          }
          const tt = K.text(F.over, x(t) + 8, y(lineY(l, t)) + (l.m(scope) < 0 ? -10 : 12), l.label + (l.dy !== 0 && l.ghost !== false ? "₁" : ""), "s-text-strong", "start");
          tt.style.fill = col(l.color);
        });
        (p.intersections || []).forEach((it) => {
          const ix = scope[it.id + "_x"], iy = scope[it.id + "_y"];
          if (!isFinite(ix) || !isFinite(iy) || ix < xr[0] || ix > xr[1] || iy < yr[0] || iy > yr[1]) return;
          if (it.guides !== false) {
            K.svg("line", { x1: x(ix), y1: y(iy), x2: x(ix), y2: y(Math.max(0, yr[0])), class: "s-axis", "stroke-dasharray": "3 4" }, F.over);
            K.svg("line", { x1: x(ix), y1: y(iy), x2: x(Math.max(0, xr[0])), y2: y(iy), class: "s-axis", "stroke-dasharray": "3 4" }, F.over);
          }
          K.svg("circle", { cx: x(ix), cy: y(iy), r: 6, fill: "var(--card-solid)", stroke: "var(--label)", "stroke-width": 2.4 }, F.over);
          if (it.label) K.text(F.over, x(ix) + 9, y(iy) - 11, it.label, "s-text-strong", "start");
        });
        handles.forEach(({ l, h }) => {
          // handle at a visible point of the line, preferably in the middle of the plot
          let t = l.handleAt != null ? E(l.handleAt) : (xr[0] + xr[1]) * (l.m(scope) < 0 ? 0.3 : 0.7);
          let yy = lineY(l, t);
          if (yy > yr[1] - 0.3 || yy < yr[0] + 0.3) {
            const target = K.clamp(yy, yr[0] + 0.8, yr[1] - 0.8);
            t = (target - (l.a(scope) + l.dy)) / l.m(scope);
            yy = target;
          }
          h.setAttribute("transform", "translate(" + x(t) + "," + y(yy) + ")");
          if (locked) h.style.display = "none";
          F.over.append(h);
        });
        if (placed.on) {
          K.svg("circle", { cx: x(placed.x), cy: y(placed.y), r: 9, fill: "none", stroke: "var(--green)", "stroke-width": 3 }, F.over);
          K.svg("circle", { cx: x(placed.x), cy: y(placed.y), r: 3, fill: "var(--green)" }, F.over);
          if (p.place.label) K.text(F.over, x(placed.x) + 12, y(placed.y) + 14, p.place.label, "s-text-strong", "start").style.fill = "var(--green)";
        }
        if (p.readout) out.el.innerHTML = template(p.readout, scope);
      }
      paint();

      return {
        check(goal) {
          if (goal.place && !placed.on) return { correct: false, detail: "Tippe zuerst in das Diagramm, um den Punkt zu setzen." };
          return checkGoal(goal, scope);
        },
        solve(goal) {
          if (goal.solve) {
            Object.keys(goal.solve).forEach((k) => {
              const v = goal.solve[k];
              const m = /^(.+)_dy$/.exec(k);
              if (m) { const l = lines.find((z) => z.id === m[1]); if (l) l.dy = v; return; }
              if (k === "place") { placed.on = true; placed.x = v[0]; placed.y = v[1]; scope.place_x = v[0]; scope.place_y = v[1]; return; }
              scope[k] = v; if (ui[k]) ui[k].set(v);
            });
          }
          paint();
        },
        getVar(k) {
          const m = /^(.+)_dy$/.exec(k);
          if (m) { const l = lines.find((z) => z.id === m[1]); return l ? l.dy : NaN; }
          return scope[k];
        },
        setVar(k, v) {
          const m = /^(.+)_dy$/.exec(k);
          if (m) { const l = lines.find((z) => z.id === m[1]); if (l) l.dy = v; }
          else { scope[k] = v; if (ui[k]) ui[k].set(v); }
          paint();
        },
        act(name, arg) {
          if (name === "place") {
            if (arg) { placed.on = true; placed.x = arg[0]; placed.y = arg[1]; scope.place_x = arg[0]; scope.place_y = arg[1]; }
            else { placed.on = false; scope.place_x = NaN; scope.place_y = NaN; }
            paint();
          }
        },
        lock() { locked = true; Object.values(ui).forEach((s) => s.disable(true)); paint(); },
      };
    },
  });
})();
