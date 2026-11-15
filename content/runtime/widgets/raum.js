/* 3D scene for analytic geometry: points, vectors, segments, lines and planes in a coordinate box that can be turned
 * by dragging. Films drive it through variables (hidden parameters used in coordinate expressions) and the view
 * angles az and el.
 *
 *   { "widget": "raum", "params": {
 *       "box": 5, "view": {"az": 30, "el": 20}, "axes": true, "height": 300,
 *       "vars": [{"name": "t", "value": 0}],
 *       "points":   [{"p": [1, 2, 3], "label": "P", "color": "accent"}],
 *       "vectors":  [{"from": [0, 0, 0], "to": [1, 2, 3], "color": "blue", "label": "a"}],
 *       "segments": [{"from": [..], "to": [..], "color": "gray", "dashed": true}],
 *       "lines":    [{"p": [..], "d": [..], "t": [-4, 4], "color": "orange", "label": "g"}],
 *       "planes":   [{"p": [..], "u": [..], "v": [..], "s": [-3, 3], "t": [-3, 3], "color": "teal"},
 *                    {"n": [a, b, c], "d": k, "size": 3, "color": "green", "label": "E"}],
 *       "readout": "t = {t|2}" } }
 * Every coordinate may be a number or an expression in the variables.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const COLORS = { accent: "var(--accent)", orange: "var(--orange)", green: "var(--green)", red: "var(--red)", teal: "var(--teal)", blue: "var(--blue)",
    label: "var(--label)", gray: "var(--label-2)", yellow: "var(--yellow)" };
  const col = (c) => COLORS[c] || c || "var(--accent)";
  const RAD = Math.PI / 180;

  LW.widget("raum", {
    mount(host, p, ctx) {
      const W = 360, H = p.height || 300;
      const svg = K.root(host, W, H, p.aria || "Raumbild");
      svg.style.maxWidth = (p.maxWidth || 520) + "px";
      svg.style.margin = "0 auto";
      svg.style.touchAction = "none";
      svg.style.cursor = "grab";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const box = p.box || 5;
      const scope = { az: (p.view && p.view.az != null) ? p.view.az : 30, el: (p.view && p.view.el != null) ? p.view.el : 20 };
      (p.vars || []).forEach((v) => { scope[v.name] = v.value != null ? v.value : 0; });
      const cache = new Map();
      const E = (v) => {
        if (typeof v === "number") return v;
        if (v == null) return NaN;
        let f = cache.get(v);
        if (!f) { f = LW.expr(String(v)); cache.set(v, f); }
        try { return f(scope); } catch (e) { return NaN; }
      };
      const V = (a) => (a || [0, 0, 0]).map(E);
      const S = (p.scale || 1) * Math.min(W, H) / (box * 2.25);

      function proj(q) {
        const az = scope.az * RAD, el = scope.el * RAD;
        const [x, y, z] = q;
        const u = -x * Math.sin(az) + y * Math.cos(az);
        const v = -x * Math.cos(az) * Math.sin(el) - y * Math.sin(az) * Math.sin(el) + z * Math.cos(el);
        const d = x * Math.cos(az) * Math.cos(el) + y * Math.sin(az) * Math.cos(el) + z * Math.sin(el);
        return { x: W / 2 + u * S, y: H / 2 - v * S, d };
      }
      const line = (a, b, color, opts) => {
        const A = proj(a), B = proj(b);
        if (![A.x, A.y, B.x, B.y].every(isFinite)) return;
        K.svg("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: col(color), "stroke-width": (opts && opts.width) || 2, "stroke-linecap": "round",
          "stroke-dasharray": opts && opts.dashed ? "5 4" : null, opacity: opts && opts.opacity != null ? opts.opacity : null }, g);
      };
      const label = (q, text, color, dx, dy) => {
        const A = proj(q);
        if (!isFinite(A.x) || !isFinite(A.y)) return;
        K.text(g, A.x + (dx || 9), A.y + (dy || -10), text, "s-text-strong", "start").style.fill = col(color || "label");
      };
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => Math.hypot(a[0], a[1], a[2]) || 1;

      function paint() {
        K.clear(g);
        // planes first, as translucent quadrilaterals
        (p.planes || []).forEach((pl) => {
          let P, U, Vv, s = pl.s || [-(pl.size || 3), pl.size || 3], t = pl.t || [-(pl.size || 3), pl.size || 3];
          if (pl.n) {
            const n = V(pl.n), d = E(pl.d), nn = n[0] * n[0] + n[1] * n[1] + n[2] * n[2] || 1;
            P = pl.p ? V(pl.p) : n.map((c) => (c * d) / nn);
            const helper = Math.abs(n[0]) < 0.9 * Math.sqrt(nn) ? [1, 0, 0] : [0, 1, 0];
            U = cross(n, helper); const lu = norm(U); U = U.map((c) => c / lu);
            Vv = cross(n, U); const lv = norm(Vv); Vv = Vv.map((c) => c / lv);
          } else {
            P = V(pl.p); U = V(pl.u); Vv = V(pl.v);
          }
          const corner = (a, b) => [P[0] + a * U[0] + b * Vv[0], P[1] + a * U[1] + b * Vv[1], P[2] + a * U[2] + b * Vv[2]];
          const cs = [corner(s[0], t[0]), corner(s[1], t[0]), corner(s[1], t[1]), corner(s[0], t[1])].map(proj);
          if (!cs.every((c) => isFinite(c.x) && isFinite(c.y))) return;
          K.svg("polygon", { points: cs.map((c) => c.x + "," + c.y).join(" "), fill: col(pl.color || "teal"), opacity: pl.opacity || 0.18,
            stroke: col(pl.color || "teal"), "stroke-width": 1, "stroke-opacity": 0.5 }, g);
          if (pl.label) label(corner(s[1] * 0.85, t[1] * 0.85), pl.label, pl.color || "teal");
        });
        // flat polygons, for example the triangle of the three trace points of a plane
        (p.polygons || []).forEach((pg) => {
          const cs = (pg.pts || []).map((q) => proj(V(q)));
          if (cs.length < 3 || !cs.every((c) => isFinite(c.x) && isFinite(c.y))) return;
          K.svg("polygon", { points: cs.map((c) => c.x + "," + c.y).join(" "), fill: col(pg.color || "teal"), opacity: pg.opacity || 0.22,
            stroke: col(pg.color || "teal"), "stroke-width": 1.2, "stroke-opacity": 0.7 }, g);
          if (pg.label) label(V(pg.pts[0]).map((c, i) => (c + V(pg.pts[1])[i] + V(pg.pts[2])[i]) / 3), pg.label, pg.color || "teal");
        });
        // axes
        if (p.axes !== false) {
          const L = box;
          [["x", [L, 0, 0]], ["y", [0, L, 0]], ["z", [0, 0, L]]].forEach(([name, e]) => {
            line(e.map((c) => -c * 0.35), e, "gray", { width: 1.2 });
            const A = proj(e), O = proj([0, 0, 0]);
            if (isFinite(A.x)) {
              const ar = K.arrow(g, O.x + (A.x - O.x) * 0.92, O.y + (A.y - O.y) * 0.92, A.x, A.y, null, 1.2);
              ar.style.stroke = col("gray"); ar.style.fill = col("gray");
              label(e, name, "gray", 4, -4);
            }
            for (let k = 1; k < L; k++) {
              const T = proj(e.map((c) => (c / L) * k));
              K.svg("circle", { cx: T.x, cy: T.y, r: 1.4, fill: col("gray") }, g);
            }
          });
        }
        (p.lines || []).forEach((ln) => {
          const P = V(ln.p), D = V(ln.d), t = (ln.t || [-4, 4]).map(E);
          const a = P.map((c, i) => c + t[0] * D[i]), b = P.map((c, i) => c + t[1] * D[i]);
          line(a, b, ln.color || "orange", { width: ln.width || 2.2, dashed: ln.dashed });
          if (ln.label) label(b, ln.label, ln.color || "orange", 4, -6);
        });
        (p.segments || []).forEach((sg) => line(V(sg.from), V(sg.to), sg.color || "gray", { width: sg.width || 1.6, dashed: sg.dashed !== false }));
        (p.vectors || []).forEach((vc) => {
          const A = proj(V(vc.from || [0, 0, 0])), B = proj(V(vc.to));
          if (![A.x, A.y, B.x, B.y].every(isFinite)) return;
          const ar = K.arrow(g, A.x, A.y, B.x, B.y, null, vc.width || 2.6);
          ar.style.stroke = col(vc.color || "blue"); ar.style.fill = col(vc.color || "blue");
          if (vc.label) {
            const mid = V(vc.from || [0, 0, 0]).map((c, i) => (c + V(vc.to)[i]) / 2);
            label(mid, vc.label, vc.color || "blue", 6, -8);
          }
        });
        (p.points || []).forEach((pt) => {
          const q = V(pt.p), A = proj(q);
          if (!isFinite(A.x) || !isFinite(A.y)) return;
          K.svg("circle", { cx: A.x, cy: A.y, r: pt.r || 4.5, fill: col(pt.color || "accent") }, g);
          if (pt.label) label(q, pt.label, pt.color || "label");
        });
        if (p.readout) out.el.innerHTML = LW.graphTemplate ? LW.graphTemplate(p.readout, scope) : "";
      }

      // turn the view by dragging
      let last = null;
      svg.addEventListener("pointerdown", (e) => { last = { x: e.clientX, y: e.clientY }; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); svg.style.cursor = "grabbing"; });
      svg.addEventListener("pointermove", (e) => {
        if (!last) return;
        e.preventDefault();
        scope.az -= (e.clientX - last.x) * 0.6;
        scope.el = K.clamp(scope.el + (e.clientY - last.y) * 0.4, -85, 85);
        last = { x: e.clientX, y: e.clientY };
        paint();
        ctx.changed && ctx.changed();
      });
      const end = () => { last = null; svg.style.cursor = "grab"; };
      svg.addEventListener("pointerup", end);
      svg.addEventListener("pointercancel", end);
      paint();
      return {
        setVar(name, v) { scope[name] = v; paint(); },
        getVar(name) { return scope[name]; },
        check() { return { correct: true }; },
        solve() { paint(); },
      };
    },
  });
})();
