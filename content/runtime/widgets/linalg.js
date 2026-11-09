/* Linear algebra widgets: linear combinations and span, 2x2 matrices as maps of the plane. */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  function plane(host, R, label) {
    const S = 360;
    const svg = K.root(host, S, S, label);
    svg.style.maxWidth = "440px";
    svg.style.margin = "0 auto";
    const x = K.scale(-R, R, 10, S - 10);
    const y = K.scale(-R, R, S - 10, 10);
    const grid = K.svg("g", null, svg);
    for (let k = -R; k <= R; k++) {
      K.svg("line", { x1: x(k), y1: y(-R), x2: x(k), y2: y(R), class: k === 0 ? "s-axis" : "s-grid" }, grid);
      K.svg("line", { x1: x(-R), y1: y(k), x2: x(R), y2: y(k), class: k === 0 ? "s-axis" : "s-grid" }, grid);
    }
    return { svg, x, y, S, R };
  }

  const vecPill = (name, v) => name + " = (" + K.fmt(v[0], 2) + " | " + K.fmt(v[1], 2) + ")";

  // ------------------------------------------------------------ linear combinations a*v + b*w

  LW.widget("vector-span", {
    mount(host, p, ctx) {
      const R = p.range || 5;
      const P = plane(host, R, "Linearkombination zweier Vektoren");
      const { svg, x, y } = P;
      let v = (p.v || [2, 1]).slice();
      let w = (p.w || [-1, 1.5]).slice();
      let a = p.a != null ? p.a : 1;
      let b = p.b != null ? p.b : 1;
      const target = p.target || null;
      let locked = false;

      const spanLayer = K.svg("g", null, svg);
      const build = K.svg("g", null, svg);
      const arrows = K.svg("g", null, svg);
      const handles = K.svg("g", null, svg);
      if (target) {
        K.svg("circle", { cx: x(target[0]), cy: y(target[1]), r: 10, fill: "none", stroke: "var(--green)", "stroke-width": 2.5, "stroke-dasharray": "3 3" }, svg);
        K.text(svg, x(target[0]) + 14, y(target[1]) - 12, "Ziel", "s-text-strong", "start");
      }

      const hv = K.svg("circle", { r: 16, class: "s-hit" }, handles);
      const hw = K.svg("circle", { r: 16, class: "s-hit" }, handles);
      const snap = (q) => [K.clamp(K.snap(x.inv(q.x), 0.5), -R, R), K.clamp(K.snap(y.inv(q.y), 0.5), -R, R)];
      if (!p.lockVectors) {
        K.drag(svg, hv, (q) => { if (locked) return; v = snap(q); paint(); ctx.changed(); });
        K.drag(svg, hw, (q) => { if (locked) return; w = snap(q); paint(); ctx.changed(); });
      }

      const cr = p.coeffRange || 3;
      const sa = K.slider(host, { label: "a", min: -cr, max: cr, step: 0.1, value: a, format: (t) => K.fmt(t, 1), onInput: (t) => { a = t; paint(); ctx.changed(); } });
      const sb = K.slider(host, { label: "b", min: -cr, max: cr, step: 0.1, value: b, format: (t) => K.fmt(t, 1), onInput: (t) => { b = t; paint(); ctx.changed(); } });
      const out = K.readout(host);

      function paint() {
        K.clear(spanLayer); K.clear(build); K.clear(arrows);
        const det = v[0] * w[1] - v[1] * w[0];
        const dependent = Math.abs(det) < 1e-9;
        if (dependent) {
          const d = Math.hypot(v[0], v[1]) > 0 ? v : w;
          if (Math.hypot(d[0], d[1]) > 0) {
            const t = (2 * R) / Math.hypot(d[0], d[1]);
            K.svg("line", { x1: x(-d[0] * t), y1: y(-d[1] * t), x2: x(d[0] * t), y2: y(d[1] * t), stroke: "var(--accent)", "stroke-width": 14, opacity: 0.16, "stroke-linecap": "round" }, spanLayer);
          }
        }
        const av = [a * v[0], a * v[1]];
        const u = [av[0] + b * w[0], av[1] + b * w[1]];
        K.svg("line", { x1: x(0), y1: y(0), x2: x(av[0]), y2: y(av[1]), stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.7 }, build);
        K.svg("line", { x1: x(av[0]), y1: y(av[1]), x2: x(u[0]), y2: y(u[1]), stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.8 }, build);
        K.arrow(arrows, x(0), y(0), x(v[0]), y(v[1]), "s-vec-accent", 3.2);
        K.arrow(arrows, x(0), y(0), x(w[0]), y(w[1]), "s-vec-orange", 3.2);
        K.arrow(arrows, x(0), y(0), x(u[0]), y(u[1]), "s-vec-green", 3.6);
        K.text(arrows, x(v[0]) + 12, y(v[1]) - 12, "v", "s-text-strong");
        K.text(arrows, x(w[0]) + 12, y(w[1]) - 12, "w", "s-text-strong");
        K.text(arrows, x(u[0]) + 10, y(u[1]) + 14, "u", "s-text-strong", "start");
        hv.setAttribute("cx", x(v[0])); hv.setAttribute("cy", y(v[1]));
        hw.setAttribute("cx", x(w[0])); hw.setAttribute("cy", y(w[1]));
        let html = "<b>" + vecPill("a·v + b·w", u) + "</b> &nbsp; ";
        html += dependent ? K.pill(false, "v, w linear abhängig: Spann ist eine Gerade") : K.pill(true, "v, w linear unabhängig: Spann ist die Ebene");
        out.set(html);
        return u;
      }
      paint();

      return {
        check(goal) {
          const t = goal.target || target;
          const u = [a * v[0] + b * w[0], a * v[1] + b * w[1]];
          if (goal.dependent != null) {
            const det = v[0] * w[1] - v[1] * w[0];
            const dep = Math.abs(det) < 1e-9;
            if (dep !== goal.dependent) return { correct: false, detail: goal.dependent ? "v und w spannen noch die ganze Ebene auf. Lege w auf die Gerade durch v." : "v und w liegen noch auf einer Geraden." };
            if (!t) return { correct: true };
          }
          if (t && Math.hypot(u[0] - t[0], u[1] - t[1]) > (goal.tolerance || 0.11)) return { correct: false, detail: "a·v + b·w liegt noch nicht auf dem Ziel. Ändere a und b." };
          return { correct: true };
        },
        solve(goal) {
          if (goal.dependent) { w = [-v[0], -v[1]]; paint(); return; }
          const t = goal.target || target;
          if (!t) return;
          const det = v[0] * w[1] - v[1] * w[0];
          if (Math.abs(det) < 1e-9) return;
          a = (t[0] * w[1] - t[1] * w[0]) / det;
          b = (v[0] * t[1] - v[1] * t[0]) / det;
          sa.set(a); sb.set(b); paint();
        },
        getVar: (k) => ({ a, b, vx: v[0], vy: v[1], wx: w[0], wy: w[1] })[k],
        setVar(k, t) {
          if (k === "a") { a = t; sa.set(t); }
          if (k === "b") { b = t; sb.set(t); }
          if (k === "vx") v[0] = t; if (k === "vy") v[1] = t;
          if (k === "wx") w[0] = t; if (k === "wy") w[1] = t;
          paint();
        },
        lock() { locked = true; sa.disable(true); sb.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------ 2x2 matrix acting on the plane

  /* params: matrix, range, editable, presets, showKernel, showEigen, probe [x, y] (draggable test vector v with Av),
   *         areaLabel
   * goal:   {matrix}, {det}, or {when} over a, b, c, d, det, tr, px, py, qx, qy (Av), parallel (1/0), lambda */
  function eigen2(M) {
    const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    if (disc < -1e-12) return [];
    const r = Math.sqrt(Math.max(0, disc));
    const ls = Math.abs(r) < 1e-9 ? [tr / 2] : [(tr + r) / 2, (tr - r) / 2];
    return ls.map((l) => {
      // (A - l I) v = 0
      let v = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : Math.abs(a - l) < 1e-9 ? [1, 0] : [0, 1];
      const n = Math.hypot(v[0], v[1]) || 1;
      return { l, v: [v[0] / n, v[1] / n] };
    });
  }

  LW.widget("matrix-transform", {
    mount(host, p, ctx) {
      const R = p.range || 4;
      const P = plane(host, R, "Lineare Abbildung der Ebene");
      const { svg, x, y } = P;
      let M = (p.matrix || [[1, 0], [0, 1]]).map((r) => r.slice());
      let probe = p.probe ? p.probe.slice() : null;
      let locked = false;
      const lines = K.svg("g", null, svg);
      const gridT = K.svg("g", null, svg);
      const square = K.svg("polygon", { class: "s-soft-fill", stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
      const arrows = K.svg("g", null, svg);
      const h1 = K.svg("circle", { r: 17, class: "s-hit" }, svg);
      const h2 = K.svg("circle", { r: 17, class: "s-hit" }, svg);
      const hp = probe ? K.svg("circle", { r: 18, class: "s-hit" }, svg) : null;
      const snap = (q, s) => [K.clamp(K.snap(x.inv(q.x), s || 0.5), -R, R), K.clamp(K.snap(y.inv(q.y), s || 0.5), -R, R)];
      if (p.editable !== false) {
        K.drag(svg, h1, (q) => { if (locked) return; const c = snap(q); M[0][0] = c[0]; M[1][0] = c[1]; paint(); ctx.changed(); });
        K.drag(svg, h2, (q) => { if (locked) return; const c = snap(q); M[0][1] = c[0]; M[1][1] = c[1]; paint(); ctx.changed(); });
      } else { h1.style.display = "none"; h2.style.display = "none"; }
      if (hp) K.drag(svg, hp, (q) => { if (locked) return; probe = snap(q, p.probeSnap || 0.25); paint(); ctx.changed(); });
      if (p.presets) {
        const presets = {
          Identität: [[1, 0], [0, 1]], Drehung: [[0, -1], [1, 0]], Spiegelung: [[1, 0], [0, -1]],
          Scherung: [[1, 1], [0, 1]], Streckung: [[2, 0], [0, 0.5]], Projektion: [[1, 0], [0, 0]],
        };
        const row = LW.el("div", { class: "w-btns" });
        host.append(row);
        Object.keys(presets).forEach((name) => K.button(row, name, () => { if (locked) return; M = presets[name].map((r) => r.slice()); paint(); ctx.changed(); }));
      }
      const out = K.readout(host);
      const apply = (pt) => [M[0][0] * pt[0] + M[0][1] * pt[1], M[1][0] * pt[0] + M[1][1] * pt[1]];
      const throughOrigin = (d, stroke, dash, width, label) => {
        const n = Math.hypot(d[0], d[1]);
        if (n < 1e-9) return;
        const t = (2 * R) / n;
        K.svg("line", { x1: x(-d[0] * t), y1: y(-d[1] * t), x2: x(d[0] * t), y2: y(d[1] * t), stroke, "stroke-width": width || 3, "stroke-dasharray": dash, opacity: 0.75 }, lines);
        if (label) {
          const s = (R * 0.82) / n;
          K.text(lines, x(d[0] * s) + 6, y(d[1] * s) - 10, label, "s-text-strong", "start").style.fill = stroke;
        }
      };
      function state() {
        const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
        const q = probe ? apply(probe) : [NaN, NaN];
        const cross = probe ? probe[0] * q[1] - probe[1] * q[0] : NaN;
        const pn = probe ? Math.hypot(probe[0], probe[1]) : 0;
        const parallel = probe && pn > 1e-9 && Math.abs(cross) < 1e-9 ? 1 : 0;
        const lambda = parallel ? (Math.abs(probe[0]) > 1e-9 ? q[0] / probe[0] : q[1] / probe[1]) : NaN;
        return { a: M[0][0], b: M[0][1], c: M[1][0], d: M[1][1], det, tr: M[0][0] + M[1][1], px: probe ? probe[0] : NaN, py: probe ? probe[1] : NaN, qx: q[0], qy: q[1], parallel, lambda };
      }

      function paint() {
        K.clear(gridT); K.clear(arrows); K.clear(lines);
        for (let k = -R; k <= R; k++) {
          const a1 = apply([k, -R]), a2 = apply([k, R]);
          const b1 = apply([-R, k]), b2 = apply([R, k]);
          K.svg("line", { x1: x(a1[0]), y1: y(a1[1]), x2: x(a2[0]), y2: y(a2[1]), stroke: "var(--accent)", "stroke-width": 1, opacity: 0.28 }, gridT);
          K.svg("line", { x1: x(b1[0]), y1: y(b1[1]), x2: x(b2[0]), y2: y(b2[1]), stroke: "var(--orange)", "stroke-width": 1, opacity: 0.28 }, gridT);
        }
        const s = state();
        const singular = Math.abs(s.det) < 1e-9;
        if (p.showKernel && singular) {
          const rows = [[M[0][0], M[0][1]], [M[1][0], M[1][1]]].filter((r) => Math.hypot(r[0], r[1]) > 1e-9);
          if (rows.length) {
            throughOrigin([rows[0][1], -rows[0][0]], "var(--red)", "6 5", 3, "Kern");
            const col = Math.hypot(M[0][0], M[1][0]) > 1e-9 ? [M[0][0], M[1][0]] : [M[0][1], M[1][1]];
            throughOrigin(col, "var(--green)", null, 5, "Bild");
          }
        }
        if (p.showEigen) eigen2(M).forEach((e, i) => throughOrigin(e.v, "var(--teal)", "3 5", 2.5, "λ" + (i ? "₂" : "₁") + " = " + K.fmt(e.l, 2)));
        const c = [[0, 0], [1, 0], [1, 1], [0, 1]].map(apply);
        square.setAttribute("points", c.map((q) => x(q[0]) + "," + y(q[1])).join(" "));
        const e1 = apply([1, 0]), e2 = apply([0, 1]);
        K.arrow(arrows, x(0), y(0), x(e1[0]), y(e1[1]), "s-vec-accent", 3.4);
        K.arrow(arrows, x(0), y(0), x(e2[0]), y(e2[1]), "s-vec-orange", 3.4);
        K.text(arrows, x(e1[0]) + 14, y(e1[1]) - 12, "Ae₁", "s-text-strong");
        K.text(arrows, x(e2[0]) + 14, y(e2[1]) - 12, "Ae₂", "s-text-strong");
        if (p.areaLabel && !singular) {
          const cx = (c[0][0] + c[2][0]) / 2, cy = (c[0][1] + c[2][1]) / 2;
          K.text(arrows, x(cx), y(cy), "|det| = " + K.fmt(Math.abs(s.det), 2), "s-text-strong", "middle");
        }
        if (probe) {
          K.arrow(arrows, x(0), y(0), x(probe[0]), y(probe[1]), "s-vec-red", 3);
          K.arrow(arrows, x(0), y(0), x(s.qx), y(s.qy), "s-vec-green", 3.6);
          K.text(arrows, x(probe[0]) + 12, y(probe[1]) + 12, "v", "s-text-strong", "start");
          K.text(arrows, x(s.qx) + 12, y(s.qy) - 10, "Av", "s-text-strong", "start");
          K.svg("circle", { cx: x(probe[0]), cy: y(probe[1]), r: 8, class: "s-handle" }, arrows);
          hp.setAttribute("cx", x(probe[0])); hp.setAttribute("cy", y(probe[1]));
        }
        h1.setAttribute("cx", x(e1[0])); h1.setAttribute("cy", y(e1[1]));
        h2.setAttribute("cx", x(e2[0])); h2.setAttribute("cy", y(e2[1]));
        const tn = (v) => K.fmt(v, 2).replace(/−/g, "-").replace(/,/g, "{,}");
        const tex = "A=\\begin{pmatrix}" + tn(M[0][0]) + " & " + tn(M[0][1]) + "\\\\ " + tn(M[1][0]) + " & " + tn(M[1][1]) + "\\end{pmatrix}\\qquad \\det A = " + tn(s.det);
        let html = LW.math(tex, false) + " &nbsp; " + (singular ? K.pill(false, "nicht invertierbar") : K.pill(true, s.det > 0 ? "Orientierung bleibt" : "Orientierung kippt"));
        if (probe) html += "<br>v = (" + K.fmt(probe[0], 2) + " | " + K.fmt(probe[1], 2) + "), Av = (" + K.fmt(s.qx, 2) + " | " + K.fmt(s.qy, 2) + ") &nbsp; " +
          (s.parallel ? K.pill(true, "Av = " + K.fmt(s.lambda, 2) + " · v: Eigenvektor") : K.pill(false, "Av zeigt in eine andere Richtung"));
        out.set(html);
      }
      paint();

      return {
        check(goal) {
          if (goal.matrix) {
            const ok = goal.matrix.every((r, i) => r.every((v, j) => Math.abs(v - M[i][j]) < 1e-9));
            return ok ? { correct: true } : { correct: false, detail: "Vergleiche, wohin e₁ und e₂ abgebildet werden sollen. Die Bilder sind die Spalten der Matrix." };
          }
          if (goal.det != null && !goal.when) {
            const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
            return Math.abs(det - goal.det) < 1e-9 ? { correct: true } : { correct: false, detail: "det A = " + K.fmt(det, 2) + ". Gesucht ist " + K.fmt(goal.det, 2) + "." };
          }
          if (goal.when) {
            const sc = state();
            let ok = false;
            try { ok = !!LW.expr(goal.when)(sc); } catch (e) { ok = false; }
            if (ok) return { correct: true };
            for (const h of goal.hints || []) { try { if (LW.expr(h.when)(sc)) return { correct: false, detail: LW.graphTemplate ? LW.graphTemplate(h.text, sc).replace(/^<p>|<\/p>$/g, "") : h.text }; } catch (e) { /* ignore */ } }
            return { correct: false, detail: goal.message || null };
          }
          return { correct: true };
        },
        solve(goal) {
          const mat = goal.matrix || (goal.solve && goal.solve.matrix);
          if (mat) M = mat.map((r) => r.slice());
          else if (goal.det != null) M = [[goal.det, 0], [0, 1]];
          if (goal.solve && goal.solve.probe) probe = goal.solve.probe.slice();
          paint();
        },
        getVar(k) {
          const m = /^m([12])([12])$/.exec(k);
          if (m) return M[+m[1] - 1][+m[2] - 1];
          if (k === "px" && probe) return probe[0];
          if (k === "py" && probe) return probe[1];
          return NaN;
        },
        setVar(k, t) {
          const m = /^m([12])([12])$/.exec(k);
          if (m) M[+m[1] - 1][+m[2] - 1] = t;
          if (k === "px" && probe) probe[0] = t;
          if (k === "py" && probe) probe[1] = t;
          paint();
        },
        act(name, arg) {
          if (name === "matrix" && arg) { M = arg.map((r) => r.slice()); paint(); }
          if (name === "probe" && arg && probe) { probe = arg.slice(); paint(); }
        },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------ operation table of Z_n

  /* params: n, op "+" | "*", nRange [2, 12], opToggle, select (row shown at the start)
   * scope:  n, op (0 add, 1 mult), sel, inv (inverse of sel, -1 if none), field (1 if every non-zero element is invertible), zd (zero divisors) */
  LW.widget("modtable", {
    mount(host, p, ctx) {
      let n = p.n || 5, op = p.op === "*" ? 1 : 0, sel = p.select != null ? p.select : 2;
      const nr = p.nRange || [2, 12];
      const holder = LW.el("div");
      host.append(holder);
      let sN = null;
      if (p.nSlider !== false) sN = K.slider(host, { label: "n", min: nr[0], max: nr[1], step: 1, value: n, format: (v) => K.fmt(v, 0), onInput: (v) => { n = v; if (sel >= n) sel = n - 1; paint(); ctx.changed(); } });
      let seg = null;
      if (p.opToggle !== false) seg = K.segmented(host, [{ id: "0", label: "Addition mod n" }, { id: "1", label: "Multiplikation mod n" }], String(op), (id) => { op = +id; paint(); ctx.changed(); });
      const out = K.readout(host);
      const f = (a, b) => (op ? (a * b) % n : (a + b) % n);
      const unit = () => (op ? 1 : 0);
      const inverse = (a) => { for (let b = 0; b < n; b++) if (f(a, b) === unit() % n) return b; return -1; };
      function info() {
        let field = 1, zd = 0;
        for (let a = 1; a < n; a++) {
          let has = false;
          for (let b = 1; b < n; b++) { if ((a * b) % n === 1) has = true; if ((a * b) % n === 0) { zd++; break; } }
          if (!has) field = 0;
        }
        return { n, op, sel, inv: inverse(sel), field: n > 1 ? field : 0, zd };
      }
      function paint() {
        holder.innerHTML = "";
        const W = 360, cell = Math.min(30, Math.floor((W - 8) / (n + 1)));
        const svg = K.root(holder, (n + 1) * cell + 4, (n + 1) * cell + 4, "Verknüpfungstafel modulo " + n);
        svg.style.maxWidth = ((n + 1) * cell + 4) * 1.15 + "px";
        svg.style.margin = "0 auto";
        const I = info();
        K.text(svg, 2 + cell / 2, 2 + cell / 2, op ? "·" : "+", "s-text-strong");
        for (let i = 0; i < n; i++) {
          const head = K.svg("rect", { x: 2 + (i + 1) * cell, y: 2, width: cell - 2, height: cell - 2, rx: 6, fill: "var(--fill-2)" }, svg);
          K.text(svg, 2 + (i + 1.5) * cell, 2 + cell / 2, String(i), "s-text-strong");
          const rh = K.svg("rect", { x: 2, y: 2 + (i + 1) * cell, width: cell - 2, height: cell - 2, rx: 6, fill: i === sel ? "var(--accent)" : "var(--fill-2)", style: "cursor:pointer" }, svg);
          const rt = K.text(svg, 2 + cell / 2, 2 + (i + 1.5) * cell, String(i), "s-text-strong");
          if (i === sel) rt.style.fill = "white";
          const pick = () => { sel = i; paint(); ctx.changed(); };
          rh.addEventListener("click", pick);
          rt.addEventListener("click", pick);
          for (let j = 0; j < n; j++) {
            const v = f(i, j);
            const isUnit = v === unit() % n;
            const fill = i === sel && isUnit ? "var(--green)" : i === sel ? "var(--accent-soft)" : isUnit ? "color-mix(in srgb, var(--green) 22%, transparent)" : op && v === 0 && i > 0 && j > 0 ? "color-mix(in srgb, var(--red) 22%, transparent)" : "transparent";
            K.svg("rect", { x: 2 + (j + 1) * cell, y: 2 + (i + 1) * cell, width: cell - 2, height: cell - 2, rx: 5, fill }, svg);
            const t = K.text(svg, 2 + (j + 1.5) * cell, 2 + (i + 1.5) * cell, String(v), "s-text");
            if (i === sel && isUnit) t.style.fill = "white";
          }
          void head;
        }
        let html = "<b>" + (op ? "Multiplikation" : "Addition") + " modulo " + n + "</b>. Zeile " + sel + ": ";
        html += I.inv >= 0 ? "Inverses ist <b>" + I.inv + "</b>, denn " + sel + (op ? " · " : " + ") + I.inv + " ≡ " + unit() + " (mod " + n + ")." : "kein Inverses, die " + unit() + " kommt in der Zeile nicht vor.";
        if (op) html += "<br>" + (I.field ? K.pill(true, "jede Zahl außer 0 hat ein Inverses: ℤ" + n + " ist ein Körper") : K.pill(false, "nicht jede Zahl außer 0 ist invertierbar: kein Körper"));
        out.set(html.replace("ℤ" + n, "ℤ/" + n + "ℤ"));
      }
      paint();
      return {
        check: (goal) => {
          const sc = info();
          let ok = false;
          try { ok = !!LW.expr(goal.when)(sc); } catch (e) { ok = false; }
          if (ok) return { correct: true };
          for (const h of goal.hints || []) { try { if (LW.expr(h.when)(sc)) return { correct: false, detail: LW.graphTemplate ? LW.graphTemplate(h.text, sc).replace(/^<p>|<\/p>$/g, "") : h.text }; } catch (e) { /* ignore */ } }
          return { correct: false, detail: goal.message || null };
        },
        solve(goal) { const s = goal && goal.solve; if (s) { if (s.n) { n = s.n; if (sN) sN.set(n); } if (s.op != null) { op = s.op; if (seg) seg.set(String(op)); } if (s.sel != null) sel = s.sel; paint(); } },
        getVar: (k) => ({ n, sel })[k],
        setVar(k, v) { if (k === "n") { n = K.clamp(Math.round(v), nr[0], nr[1]); if (sN) sN.set(n); if (sel >= n) sel = n - 1; } if (k === "sel") sel = K.clamp(Math.round(v), 0, n - 1); paint(); },
        act(name, arg) { if (name === "op") { op = arg === "*" || arg === 1 ? 1 : 0; if (seg) seg.set(String(op)); paint(); } },
        lock() { if (sN) sN.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------ Gaussian elimination, step by step

  /* params: matrix (augmented, rows with the right-hand side as last entry), vars ["x", "y", "z"], manual (default true)
   * scope:  echelon (1/0), reduced (1/0), steps, rank, solutions (0 none, 1 unique, 2 infinitely many), x1, x2, x3 */
  const Q = {
    g: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },
    make(n, d) { if (d < 0) { n = -n; d = -d; } const k = Q.g(n, d); return [n / k, d / k]; },
    from(v) { if (Array.isArray(v)) return Q.make(v[0], v[1]); const x = +v; for (let d = 1; d <= 1000; d++) if (Math.abs(Math.round(x * d) - x * d) < 1e-9) return Q.make(Math.round(x * d), d); return [x, 1]; },
    add: (a, b) => Q.make(a[0] * b[1] + b[0] * a[1], a[1] * b[1]),
    sub: (a, b) => Q.make(a[0] * b[1] - b[0] * a[1], a[1] * b[1]),
    mul: (a, b) => Q.make(a[0] * b[0], a[1] * b[1]),
    div: (a, b) => Q.make(a[0] * b[1], a[1] * b[0]),
    zero: (a) => a[0] === 0,
    tex: (a) => (a[1] === 1 ? String(a[0]) : (a[0] < 0 ? "-" : "") + "\\tfrac{" + Math.abs(a[0]) + "}{" + a[1] + "}"),
    text: (a) => (a[1] === 1 ? String(a[0]) : a[0] + "/" + a[1]).replace("-", "−"),
    val: (a) => a[0] / a[1],
  };

  LW.widget("gauss", {
    mount(host, p, ctx) {
      const start = (p.matrix || [[1, 1, 2], [1, -1, 0]]).map((r) => r.map(Q.from));
      const names = p.vars || ["x", "y", "z", "w"];
      let A = start.map((r) => r.slice()), log = [], locked = false;
      const rows = A.length, cols = A[0].length - 1;
      const view = LW.el("div", { class: "lw-md", style: "text-align:center;overflow-x:auto;padding:4px 0" });
      host.append(view);
      const row1 = LW.el("div", { class: "w-btns" });
      host.append(row1);
      const nextB = K.button(row1, "Nächster Schritt", () => { if (!locked) { step(); paint(); ctx.changed(); } });
      nextB.classList.add("on");
      if (p.auto === false) nextB.style.display = "none";
      K.button(row1, "Von vorn", () => { if (!locked) { A = start.map((r) => r.slice()); log = []; paint(); ctx.changed(); } });
      let manual = null;
      if (p.manual !== false) {
        manual = LW.el("div", { class: "w-row", style: "gap:6px;align-items:center" });
        const sel = (k) => { const s = LW.el("select", { class: "lw-input", style: "width:auto;padding:6px 8px" }); for (let i = 0; i < rows; i++) s.append(LW.el("option", { value: i, text: "Z" + (i + 1) })); s.value = String(k); return s; };
        const t = sel(1), s = sel(0);
        const fac = LW.el("input", { class: "lw-input", style: "width:4.2em", placeholder: "Faktor", inputmode: "decimal" });
        const go = LW.el("button", { class: "w-btn", type: "button", text: "Anwenden" });
        go.addEventListener("click", () => {
          if (locked) return;
          const fv = LW.parseNumber(fac.value);
          if (!isFinite(fv) || +t.value === +s.value) return;
          addMultiple(+t.value, +s.value, Q.from(fv), true);
          paint(); ctx.changed();
        });
        manual.append(t, LW.el("span", { text: "← Zeile minus" }), fac, LW.el("span", { text: "·" }), s, go);
        host.append(manual);
      }
      const out = K.readout(host);

      function addMultiple(t, s, f, mine) {
        A[t] = A[t].map((v, j) => Q.sub(v, Q.mul(f, A[s][j])));
        log.push("Z" + (t + 1) + " ← Z" + (t + 1) + " − " + Q.text(f) + " · Z" + (s + 1) + (mine ? "" : ""));
      }
      function swap(i, j) { [A[i], A[j]] = [A[j], A[i]]; log.push("Z" + (i + 1) + " ↔ Z" + (j + 1)); }
      function scale(i, f) { A[i] = A[i].map((v) => Q.mul(v, f)); log.push("Z" + (i + 1) + " ← " + Q.text(f) + " · Z" + (i + 1)); }
      const lead = (r) => { for (let j = 0; j < cols; j++) if (!Q.zero(A[r][j])) return j; return -1; };
      function info() {
        let echelon = 1, last = -1, zeroSeen = false;
        for (let r = 0; r < rows; r++) {
          const l = lead(r);
          if (l < 0) { zeroSeen = true; continue; }
          if (zeroSeen || l <= last) echelon = 0;
          last = l;
        }
        let reduced = echelon;
        if (echelon) for (let r = 0; r < rows; r++) {
          const l = lead(r);
          if (l < 0) continue;
          if (!(A[r][l][0] === 1 && A[r][l][1] === 1)) reduced = 0;
          for (let k = 0; k < rows; k++) if (k !== r && !Q.zero(A[k][l])) reduced = 0;
        }
        const rank = A.filter((r, i) => lead(i) >= 0).length;
        const inconsistent = A.some((r, i) => lead(i) < 0 && !Q.zero(r[cols]));
        const solutions = inconsistent ? 0 : rank === cols ? 1 : 2;
        const sc = { echelon, reduced, steps: log.length, rank, solutions };
        if (reduced && solutions === 1) for (let r = 0; r < rows; r++) { const l = lead(r); if (l >= 0) sc["x" + (l + 1)] = Q.val(A[r][cols]); }
        return sc;
      }
      /** One elementary operation of the algorithm: forward elimination, then normalising and back substitution. */
      function step() {
        let r = 0;
        for (let c = 0; c < cols && r < rows; c++) {
          let piv = -1;
          for (let i = r; i < rows; i++) if (!Q.zero(A[i][c])) { piv = i; break; }
          if (piv < 0) continue;
          if (piv !== r) { swap(r, piv); return; }
          for (let i = r + 1; i < rows; i++) if (!Q.zero(A[i][c])) { addMultiple(i, r, Q.div(A[i][c], A[r][c])); return; }
          r++;
        }
        // reduced form, from the bottom up
        for (let i = rows - 1; i >= 0; i--) {
          const l = lead(i);
          if (l < 0) continue;
          if (!(A[i][l][0] === 1 && A[i][l][1] === 1)) { scale(i, Q.div([1, 1], A[i][l])); return; }
          for (let k = i - 1; k >= 0; k--) if (!Q.zero(A[k][l])) { addMultiple(k, i, A[k][l]); return; }
        }
      }
      function paint() {
        const body = A.map((r) => r.slice(0, cols).map(Q.tex).join(" & ") + " & " + Q.tex(r[cols])).join("\\\\ ");
        const tex = "\\left(\\begin{array}{" + "c".repeat(cols) + "|c}" + body + "\\end{array}\\right)";
        view.innerHTML = LW.math(tex, true);
        const I = info();
        let html = log.length ? "Zuletzt: <b>" + LW.esc(log[log.length - 1]) + "</b> · " + log.length + (log.length === 1 ? " Schritt" : " Schritte") + "<br>" : "Noch kein Schritt. ";
        if (I.reduced) {
          if (I.solutions === 1) html += K.pill(true, "eindeutige Lösung") + " " + Array.from({ length: cols }, (_, j) => names[j] + " = " + K.fmt(I["x" + (j + 1)], 4)).join(", ");
          else if (I.solutions === 0) html += K.pill(false, "Widerspruch: keine Lösung");
          else html += K.pill(true, "unendlich viele Lösungen, " + (cols - I.rank) + (cols - I.rank === 1 ? " freier Parameter" : " freie Parameter"));
        } else if (I.echelon) {
          html += K.pill(true, "Stufenform erreicht") + (I.solutions === 0 ? " " + K.pill(false, "Widerspruch in einer Nullzeile") : " Rückwärts einsetzen oder weiter vereinfachen.");
        }
        out.set(html);
        nextB.disabled = locked || I.reduced === 1;
      }
      paint();
      return {
        check(goal) {
          const sc = info();
          let ok = false;
          try { ok = !!LW.expr(goal.when || "echelon == 1")(sc); } catch (e) { ok = false; }
          if (ok) return { correct: true };
          for (const h of goal.hints || []) { try { if (LW.expr(h.when)(sc)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } }
          return { correct: false, detail: goal.message || "Die Matrix hat noch nicht die gewünschte Form." };
        },
        solve(goal) { let guard = 0; const want = (goal && goal.when) || "echelon == 1"; while (guard++ < 40 && !LW.expr(want)(info())) { const before = log.length; step(); if (log.length === before) break; } paint(); },
        act(name) {
          if (name === "step") { step(); paint(); }
          if (name === "reset") { A = start.map((r) => r.slice()); log = []; paint(); }
          if (name === "finish") { let guard = 0; while (guard++ < 40 && !info().reduced) { const before = log.length; step(); if (log.length === before) break; } paint(); }
        },
        lock() { locked = true; paint(); },
      };
    },
  });
})();
