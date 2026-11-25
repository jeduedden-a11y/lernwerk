/* Mathematics labs: space, processes, urns.
 *
 *   raumlabor: points, lines and planes in space, edited with steppers and shown in a turnable box. The lab finds how they
 *     lie to each other (intersecting, parallel, identical or contained, skew), the intersection, distances and angles.
 *     params: objects [{id, type "punkt" | "gerade" | "ebene", p, u (line direction), n, d (plane n·x = d), edit}], range, step
 *     scope:  for each object: <id>_x, <id>_y, <id>_z (point or support point), <id>_u1.. (direction), <id>_n1.., <id>_d;
 *             for each pair: lage_A_B (1 intersect, 2 parallel, 3 identical or contained, 4 skew), dist_A_B, ang_A_B (degrees),
 *             sx_A_B, sy_A_B, sz_A_B (intersection point), on_A_B (1 if point A lies on B)
 *   prozesslabor: a process with two or three states; column j of the matrix holds the probabilities of moving from j.
 *     params: states, M (rows: M[i][j] = from j to i), v0, n, edit ("all" or list like ["m12", "m21"]), step, mode "stochastisch" | "population"
 *     scope:  m11 .. m33, valid (columns sum to 1), n, v1 .. v3 (after n steps), s1 .. s3 (stationary), lambda (largest eigenvalue), total
 *   urnenlabor: an urn with red, blue and green balls; k draws with or without replacement; an event; exact probability,
 *     tree diagram and simulation.
 *     params: r, b, g, k, repl, event {type: "alle" | "genau" | "mind" | "gleich" | "verschieden", color, j}, edit (counts), editK, editRepl, colors (2 or 3)
 *     scope:  r, b, g, N, k, repl, P, h (relative frequency in the simulation), runs
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    return { correct: false, detail: goal.message || null };
  }
  /** A small number field with minus and plus. */
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
    const set = (x) => { v = Math.round(K.clamp(x, min, max) / step) * step; v = +v.toFixed(6); show(); };
    minus.addEventListener("click", () => { set(v - step); onChange(v); });
    plus.addEventListener("click", () => { set(v + step); onChange(v); });
    set(value);
    return { el: wrap, get: () => v, set };
  }

  // ---------------------------------------------------------------- space
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const EPS = 1e-9;
  /** How two objects lie: {lage, dist, ang, s (point), on}. */
  function relate(A, B) {
    if (B.type === "punkt" && A.type !== "punkt") return relate(B, A);
    const T = A.type + "-" + B.type;
    const out = { lage: 0, dist: NaN, ang: NaN, s: [NaN, NaN, NaN], on: 0 };
    if (T === "punkt-ebene") { const nn = len(B.n); out.dist = nn > EPS ? Math.abs(dot(B.n, A.p) - B.d) / nn : NaN; out.on = out.dist < 1e-6 ? 1 : 0; return out; }
    if (T === "punkt-gerade") { const ul = len(B.u); out.dist = ul > EPS ? len(cross(sub(A.p, B.p), B.u)) / ul : NaN; out.on = out.dist < 1e-6 ? 1 : 0; return out; }
    if (T === "punkt-punkt") { out.dist = len(sub(A.p, B.p)); out.on = out.dist < 1e-6 ? 1 : 0; return out; }
    if (T === "gerade-ebene" || T === "ebene-gerade") {
      const g = A.type === "gerade" ? A : B, E = A.type === "gerade" ? B : A;
      const nu = dot(E.n, g.u), nn = len(E.n), ul = len(g.u);
      if (Math.abs(nu) < 1e-9 * Math.max(1, nn * ul)) {
        const dd = Math.abs(dot(E.n, g.p) - E.d) / nn;
        out.lage = dd < 1e-9 ? 3 : 2; out.dist = dd; out.ang = 0;
      } else {
        const t = (E.d - dot(E.n, g.p)) / nu;
        out.lage = 1; out.s = add(g.p, mul(g.u, t)); out.dist = 0; out.ang = (Math.atan2(Math.abs(nu), len(cross(E.n, g.u))) * 180) / Math.PI;
      }
      return out;
    }
    if (T === "gerade-gerade") {
      const c = cross(A.u, B.u), w = sub(B.p, A.p);
      if (len(c) < 1e-9 * Math.max(1, len(A.u) * len(B.u))) {
        const dd = len(cross(w, A.u)) / len(A.u);
        out.lage = dd < 1e-9 ? 3 : 2; out.dist = dd; out.ang = 0;
        return out;
      }
      const dd = Math.abs(dot(w, c)) / len(c);
      out.ang = (Math.atan2(len(c), Math.abs(dot(A.u, B.u))) * 180) / Math.PI;
      if (dd < 1e-9) {
        // solve p + t u = q + s v in the plane of both
        const t = dot(cross(w, B.u), c) / dot(c, c);
        out.lage = 1; out.s = add(A.p, mul(A.u, t)); out.dist = 0;
      } else { out.lage = 4; out.dist = dd; }
      return out;
    }
    if (T === "ebene-ebene") {
      const c = cross(A.n, B.n);
      out.ang = (Math.atan2(len(c), Math.abs(dot(A.n, B.n))) * 180) / Math.PI;
      if (len(c) < 1e-9 * Math.max(1, len(A.n) * len(B.n))) {
        // parallel: compare the planes at the same normal length
        const k = len(A.n) / len(B.n) * Math.sign(dot(A.n, B.n) || 1);
        const dd = Math.abs(A.d - B.d * k) / len(A.n);
        out.lage = dd < 1e-9 ? 3 : 2; out.dist = dd; out.ang = 0;
      } else { out.lage = 1; out.dist = 0; }
      return out;
    }
    return out;
  }
  const LAGE = ["–", "schneiden sich", "sind parallel", "sind identisch", "sind windschief"];
  const LAGE_GE = ["–", "schneiden sich", "sind parallel", "die Gerade liegt in der Ebene"];

  LW.widget("raumlabor", {
    mount(host, p, ctx) {
      const R = p.range || 5, step = p.step || 0.5;
      const objs = (p.objects || []).map((o) => ({ id: o.id, type: o.type, p: (o.p || [0, 0, 0]).slice(), u: (o.u || [1, 0, 0]).slice(), n: (o.n || [0, 0, 1]).slice(), d: o.d || 0, edit: !!o.edit, color: o.color }));
      const COL = { punkt: "var(--label)", gerade: "var(--accent)", ebene: "var(--teal)" };
      const PAL = ["var(--accent)", "var(--orange)", "var(--teal)", "var(--blue)", "var(--green)"];
      objs.forEach((o, k) => { if (!o.color) o.color = o.type === "punkt" ? COL.punkt : PAL[k % PAL.length]; });
      const editors = LW.el("div", { class: "lw-space-ed" });
      host.append(editors);
      const steppers = [];
      objs.filter((o) => o.edit).forEach((o) => {
        const row = LW.el("div", { class: "lw-space-row" });
        const head = LW.el("div", { class: "lw-space-head", html: LW.math(o.type === "ebene" ? o.id + "\\colon\\ \\vec n \\cdot \\vec x = d" : o.type === "gerade" ? o.id + "\\colon\\ \\vec x = \\vec p + t\\,\\vec u" : "\\text{Punkt } " + o.id) });
        row.append(head);
        const vecs = LW.el("div", { class: "lw-space-vecs" });
        row.append(vecs);
        const column = (arr) => {
          const col = LW.el("div", { class: "lw-space-col" });
          vecs.append(col);
          arr.forEach((x, i) => steppers.push(stepper(col, null, arr[i], step, -9, 9, (v) => { arr[i] = v; changed(); }, 1)));
        };
        const sep = (tex) => vecs.append(LW.el("span", { class: "lw-space-sep", html: LW.math(tex) }));
        if (o.type === "punkt") column(o.p);
        if (o.type === "gerade") { sep("\\vec x ="); column(o.p); sep("+\\,t"); column(o.u); }
        if (o.type === "ebene") {
          column(o.n);
          sep("\\cdot \\vec x =");
          const col = LW.el("div", { class: "lw-space-col" });
          vecs.append(col);
          steppers.push(stepper(col, null, o.d, step, -20, 20, (v) => { o.d = v; changed(); }, 1));
        }
        editors.append(row);
      });
      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Raum mit Geraden und Ebenen");
      const scene = K.svg("g", null, svg);
      const view = LW.lab.view3d(svg, { width: W, height: H, az: 35, el: 20, scale: 22, dist: 30, paint: () => paint() });
      const out = K.readout(host);
      // y up in the view, z of the maths up: map (x, y, z) to view (y, z, x)
      const V = (q) => [q[1], q[2], q[0]];
      function scope() {
        const sc = {};
        objs.forEach((o) => {
          sc[o.id + "_x"] = o.p[0]; sc[o.id + "_y"] = o.p[1]; sc[o.id + "_z"] = o.p[2];
          sc[o.id + "_u1"] = o.u[0]; sc[o.id + "_u2"] = o.u[1]; sc[o.id + "_u3"] = o.u[2];
          sc[o.id + "_n1"] = o.n[0]; sc[o.id + "_n2"] = o.n[1]; sc[o.id + "_n3"] = o.n[2]; sc[o.id + "_d"] = o.d;
        });
        for (let i = 0; i < objs.length; i++) for (let j = 0; j < objs.length; j++) {
          if (i === j) continue;
          const r = relate(objs[i], objs[j]), key = objs[i].id + "_" + objs[j].id;
          sc["lage_" + key] = r.lage; sc["dist_" + key] = r.dist; sc["ang_" + key] = r.ang; sc["on_" + key] = r.on;
          sc["sx_" + key] = r.s[0]; sc["sy_" + key] = r.s[1]; sc["sz_" + key] = r.s[2];
        }
        return sc;
      }
      function paint() {
        K.clear(scene);
        const items = [];
        const P = (q) => view.project(V(q));
        // axes
        [[[0, 0, 0], [R, 0, 0], "x"], [[0, 0, 0], [0, R, 0], "y"], [[0, 0, 0], [0, 0, R], "z"]].forEach(([a, b, nm]) => {
          const A = P(a), Bp = P(b);
          items.push({ d: -99, draw: () => { const ar = K.arrow(scene, A.x, A.y, Bp.x, Bp.y, null, 1.4); ar.style.stroke = "var(--label-3)"; ar.style.fill = "var(--label-3)"; K.text(scene, Bp.x + 8, Bp.y - 6, nm, "s-text-strong"); } });
        });
        objs.forEach((o) => {
          if (o.type === "ebene") {
            const nn = len(o.n);
            if (nn < EPS) return;
            const n = mul(o.n, 1 / nn), foot = mul(n, o.d / nn);
            const a = len(cross(n, [1, 0, 0])) > 0.3 ? [1, 0, 0] : [0, 1, 0];
            const e1 = mul(cross(n, a), 1 / len(cross(n, a))), e2 = cross(n, e1);
            const s = R * 0.9;
            const corners = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => P(add(foot, add(mul(e1, x), mul(e2, y)))));
            const dz = corners.reduce((t, c) => t + c.d, 0) / 4;
            items.push({ d: dz - 5, draw: () => K.svg("polygon", { points: corners.map((c) => c.x.toFixed(1) + "," + c.y.toFixed(1)).join(" "), fill: o.color, opacity: 0.22, stroke: o.color, "stroke-width": 1 }, scene) });
            const cP = P(add(foot, add(mul(e1, s), mul(e2, s))));
            items.push({ d: 50, draw: () => K.text(scene, cP.x, cP.y - 8, o.id, "s-text-strong").style.fill = o.color });
          }
          if (o.type === "gerade") {
            const ul = len(o.u);
            if (ul < EPS) return;
            const A = P(add(o.p, mul(o.u, -2 * R / ul))), Bp = P(add(o.p, mul(o.u, 2 * R / ul)));
            items.push({ d: (A.d + Bp.d) / 2, draw: () => K.svg("line", { x1: A.x, y1: A.y, x2: Bp.x, y2: Bp.y, stroke: o.color, "stroke-width": 2.6, "stroke-linecap": "round" }, scene) });
            items.push({ d: 50, draw: () => K.text(scene, Bp.x + 6, Bp.y - 6, o.id, "s-text-strong").style.fill = o.color });
          }
          if (o.type === "punkt") {
            const A = P(o.p);
            items.push({ d: A.d, draw: () => { K.svg("circle", { cx: A.x, cy: A.y, r: 5, fill: o.color }, scene); K.text(scene, A.x + 9, A.y - 8, o.id, "s-text-strong"); } });
          }
        });
        // intersections
        const sc = scope();
        for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
          const key = objs[i].id + "_" + objs[j].id;
          if (sc["lage_" + key] === 1 && isFinite(sc["sx_" + key])) {
            const S = P([sc["sx_" + key], sc["sy_" + key], sc["sz_" + key]]);
            items.push({ d: S.d + 1, draw: () => K.svg("circle", { cx: S.x, cy: S.y, r: 5.5, fill: "var(--red)", stroke: "white", "stroke-width": 1.5 }, scene) });
          }
        }
        items.sort((a, b) => a.d - b.d).forEach((it) => it.draw());
        // readout
        const lines = [];
        for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
          const A = objs[i], Bo = objs[j], r = relate(A, Bo);
          const name = A.id + " und " + Bo.id + " ";
          if (A.type === "punkt" || Bo.type === "punkt") lines.push(LW.esc((A.type === "punkt" ? A.id : Bo.id) + (r.on ? " liegt auf " : " liegt nicht auf ") + (A.type === "punkt" ? Bo.id : A.id) + (r.on ? "" : " (Abstand " + K.fmt(r.dist, 3) + ")")));
          else if (A.type === "gerade" && Bo.type === "gerade") lines.push(LW.esc(name + LAGE[r.lage] + (r.lage === 1 ? " in S(" + r.s.map((x) => K.fmt(x, 2)).join(" | ") + "), Winkel " + K.fmt(r.ang, 1) + "°" : r.lage === 2 || r.lage === 4 ? ", Abstand " + K.fmt(r.dist, 3) : "")));
          else if (A.type === "ebene" && Bo.type === "ebene") lines.push(LW.esc(name + (r.lage === 1 ? "schneiden sich in einer Geraden, Winkel " + K.fmt(r.ang, 1) + "°" : r.lage === 2 ? "sind parallel, Abstand " + K.fmt(r.dist, 3) : "sind identisch")));
          else lines.push(LW.esc(name + (r.lage === 1 ? "schneiden sich in S(" + r.s.map((x) => K.fmt(x, 2)).join(" | ") + "), Winkel " + K.fmt(r.ang, 1) + "°" : LAGE_GE[r.lage] + (r.lage === 2 ? ", Abstand " + K.fmt(r.dist, 3) : ""))));
        }
        out.set(lines.join("<br>"));
      }
      function changed() { paint(); ctx.changed(); }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          (s.objects || []).forEach((so) => {
            const o = objs.find((x) => x.id === so.id);
            if (!o) return;
            ["p", "u", "n"].forEach((k) => { if (so[k]) o[k] = so[k].slice(); });
            if (so.d != null) o.d = so.d;
          });
          // refresh the steppers in the order they were made
          let k = 0;
          objs.filter((o) => o.edit).forEach((o) => {
            if (o.type === "punkt") o.p.forEach((x) => steppers[k++].set(x));
            if (o.type === "gerade") { o.p.forEach((x) => steppers[k++].set(x)); o.u.forEach((x) => steppers[k++].set(x)); }
            if (o.type === "ebene") { o.n.forEach((x) => steppers[k++].set(x)); steppers[k++].set(o.d); }
          });
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- processes with transition matrices
  function matVec(Mx, v) { return Mx.map((row) => row.reduce((s, x, j) => s + x * v[j], 0)); }
  function stationary(Mx) {
    const n = Mx.length;
    // (M - I) v = 0 with sum v = 1: replace the last equation by the sum
    const A = Mx.map((row, i) => row.map((x, j) => x - (i === j ? 1 : 0)));
    A[n - 1] = new Array(n).fill(1);
    const bvec = new Array(n).fill(0); bvec[n - 1] = 1;
    // Gaussian elimination
    const Mt = A.map((row, i) => row.concat([bvec[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(Mt[r][c]) > Math.abs(Mt[piv][c])) piv = r;
      if (Math.abs(Mt[piv][c]) < 1e-12) return null;
      [Mt[c], Mt[piv]] = [Mt[piv], Mt[c]];
      for (let r = 0; r < n; r++) { if (r === c) continue; const f = Mt[r][c] / Mt[c][c]; for (let k = c; k <= n; k++) Mt[r][k] -= f * Mt[c][k]; }
    }
    return Mt.map((row, i) => row[n] / row[i]);
  }
  function domEigen(Mx) {
    let v = Mx.map(() => 1), lam = 0;
    for (let it = 0; it < 500; it++) { const w = matVec(Mx, v); const nrm = Math.max(...w.map(Math.abs)) || 1; lam = nrm / (Math.max(...v.map(Math.abs)) || 1); v = w.map((x) => x / nrm); }
    return lam;
  }
  LW.widget("prozesslabor", {
    mount(host, p, ctx) {
      const states = p.states || ["A", "B", "C"];
      const n0 = states.length;
      const Mx = (p.M || states.map((_, i) => states.map((__, j) => (i === j ? 1 : 0)))).map((r) => r.slice());
      const v0 = (p.v0 || states.map((_, i) => (i === 0 ? 1 : 0))).slice();
      let n = p.n || 0;
      const step = p.step || 0.05;
      const pop = p.mode === "population";
      const editable = (i, j) => p.edit === "all" || (Array.isArray(p.edit) && p.edit.includes("m" + (i + 1) + (j + 1)));
      const grid = LW.el("div", { class: "lw-proc-grid", style: "grid-template-columns: repeat(" + n0 + ", auto)" });
      host.append(LW.el("div", { class: "lw-proc-head", html: LW.math((pop ? "L" : "M") + " = \\text{(Spalte } j\\text{: von } j \\text{ nach } i)") }));
      host.append(grid);
      const st = [];
      for (let i = 0; i < n0; i++) for (let j = 0; j < n0; j++) {
        if (editable(i, j)) st.push([i, j, stepper(grid, null, Mx[i][j], step, 0, pop ? 5 : 1, (v) => { Mx[i][j] = v; paint(); ctx.changed(); }, 2)]);
        else grid.append(LW.el("span", { class: "lw-stp lw-stp-fixed", text: K.fmt(Mx[i][j], 2) }));
      }
      const nSl = K.slider(host, { label: "n", labelHtml: LW.math("n"), min: 0, max: 30, step: 1, value: n, format: (x) => String(x), onInput: (x) => { n = x; paint(); ctx.changed(); } });
      const W = 360, H = 210;
      const svg = K.root(host, W, H, "Zustandsgraph und Verteilung");
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      function vn() { let v = v0.slice(); for (let k = 0; k < n; k++) v = matVec(Mx, v); return v; }
      function scope() {
        const sc = {};
        Mx.forEach((row, i) => row.forEach((x, j) => { sc["m" + (i + 1) + (j + 1)] = x; }));
        const colOk = states.every((_, j) => Math.abs(Mx.reduce((s, row) => s + row[j], 0) - 1) < 1e-9);
        sc.valid = colOk ? 1 : 0;
        const v = vn();
        v.forEach((x, i) => { sc["v" + (i + 1)] = x; });
        sc.n = n;
        sc.total = v.reduce((a, b) => a + b, 0);
        const s = !pop && colOk ? stationary(Mx) : null;
        states.forEach((_, i) => { sc["s" + (i + 1)] = s ? s[i] : NaN; });
        sc.lambda = domEigen(Mx);
        return sc;
      }
      function paint() {
        K.clear(g);
        const sc = scope();
        // state graph on the left
        const cx = 95, cy = 105, rr = 62;
        const pos = states.map((_, i) => [cx + rr * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n0), cy + rr * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n0)]);
        for (let j = 0; j < n0; j++) for (let i = 0; i < n0; i++) {
          const w = Mx[i][j];
          if (w <= 0 || i === j) continue;
          const [x1, y1] = pos[j], [x2, y2] = pos[i];
          const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ox = (-dy / l) * 7, oy = (dx / l) * 7;
          const ar = K.arrow(g, x1 + (dx / l) * 20 + ox, y1 + (dy / l) * 20 + oy, x2 - (dx / l) * 20 + ox, y2 - (dy / l) * 20 + oy, null, 1.6);
          ar.style.stroke = "var(--label-3)"; ar.style.fill = "var(--label-3)";
          K.text(g, (x1 + x2) / 2 + ox * 2.2, (y1 + y2) / 2 + oy * 2.2, K.fmt(w, 2), "s-text");
        }
        pos.forEach(([x, y], i) => {
          K.svg("circle", { cx: x, cy: y, r: 17, fill: "var(--accent-soft)", stroke: "var(--accent)", "stroke-width": 1.5 }, g);
          K.text(g, x, y, states[i], "s-text-strong");
          if (Mx[i][i] > 0) K.text(g, x + (x - cx) * 0.55, y + (y - cy) * 0.55 - 2, "↻ " + K.fmt(Mx[i][i], 2), "s-text");
        });
        // distribution after n steps on the right
        const v = states.map((_, i) => sc["v" + (i + 1)]);
        const vmax = Math.max(1, ...v);
        const bx = 205, bw = 140 / n0;
        K.text(g, bx + 70, 14, (pop ? "Bestand" : "Verteilung") + " nach n = " + n, "s-text");
        v.forEach((x, i) => {
          const h = (150 * x) / vmax;
          K.svg("rect", { x: bx + i * bw + 6, y: 180 - h, width: bw - 12, height: h, rx: 4, fill: "var(--accent)", opacity: 0.8 }, g);
          K.text(g, bx + i * bw + bw / 2, 194, states[i], "s-text-strong");
          K.text(g, bx + i * bw + bw / 2, 172 - h, K.fmt(x, pop ? 1 : 3), "s-text");
          if (!pop && isFinite(sc["s" + (i + 1)])) K.svg("line", { x1: bx + i * bw + 3, x2: bx + (i + 1) * bw - 3, y1: 180 - (150 * sc["s" + (i + 1)]) / vmax, y2: 180 - (150 * sc["s" + (i + 1)]) / vmax, stroke: "var(--green)", "stroke-width": 2, "stroke-dasharray": "4 3" }, g);
        });
        const colSums = states.map((_, j) => Mx.reduce((s, row) => s + row[j], 0));
        out.set((pop ? LW.esc("Wachstumsfaktor (größter Eigenwert) λ ≈ " + K.fmt(sc.lambda, 3) + (Math.abs(sc.lambda - 1) < 0.005 ? ": Bestand langfristig stabil" : sc.lambda > 1 ? ": Bestand wächst" : ": Bestand schrumpft")) :
          (sc.valid ? K.pill(true, "Spaltensummen 1") : K.pill(false, "Spaltensummen " + colSums.map((x) => K.fmt(x, 2)).join(", "))) + " " +
          (isFinite(sc.s1) ? LW.esc("Stationäre Verteilung (grün gestrichelt): " + states.map((s, i) => s + " " + K.fmt(sc["s" + (i + 1)], 3)).join(", ")) : "")));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.M) s.M.forEach((row, i) => row.forEach((x, j) => { Mx[i][j] = x; }));
          if (s.n != null) { n = s.n; nSl.set(n); }
          st.forEach(([i, j, stp]) => stp.set(Mx[i][j]));
          paint();
        },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- urns
  const COLS = [["r", "rot", "var(--red)"], ["b", "blau", "var(--blue)"], ["g", "grün", "var(--green)"]];
  function urnProb(c, k, repl, ev) {
    // all ordered sequences of colours
    const idx = c.map((x, i) => i).filter((i) => c[i] > 0);
    let P = 0;
    const leaves = [];
    const rec = (seq, prob, left) => {
      if (seq.length === k) { leaves.push([seq.slice(), prob]); if (holds(seq)) P += prob; return; }
      const N = left.reduce((a, b) => a + b, 0);
      if (N <= 0) return;
      idx.forEach((i) => { if (left[i] <= 0) return; const q = left[i] / N; const nl = left.slice(); if (!repl) nl[i]--; seq.push(i); rec(seq, prob * q, nl); seq.pop(); });
    };
    const holds = (seq) => {
      const cnt = [0, 0, 0];
      seq.forEach((i) => cnt[i]++);
      const ci = ev.color == null ? 0 : ev.color;
      if (ev.type === "alle") return cnt[ci] === k;
      if (ev.type === "genau") return cnt[ci] === ev.j;
      if (ev.type === "mind") return cnt[ci] >= ev.j;
      if (ev.type === "gleich") return cnt.some((x) => x === k);
      if (ev.type === "verschieden") return new Set(seq).size === seq.length;
      return false;
    };
    rec([], 1, c.slice());
    return { P, leaves, holds };
  }
  const evText = (ev, k) => {
    const cn = COLS[ev.color == null ? 0 : ev.color][1];
    if (ev.type === "alle") return "alle " + k + " " + cn;
    if (ev.type === "genau") return "genau " + ev.j + " " + cn;
    if (ev.type === "mind") return "mindestens " + ev.j + " " + cn;
    if (ev.type === "gleich") return "alle gleichfarbig";
    return "alle verschiedenfarbig";
  };
  LW.widget("urnenlabor", {
    mount(host, p, ctx) {
      const nc = p.colors || 3;
      const c = [p.r != null ? p.r : 3, p.b != null ? p.b : 2, nc > 2 ? (p.g != null ? p.g : 1) : 0];
      let k = p.k || 2, repl = !!p.repl;
      const ev = Object.assign({ type: "alle", color: 0, j: 1 }, p.event || {});
      let runs = 0, hits = 0;
      const rand = (() => { let s = 2166136261; String(ctx.seed || "u").split("").forEach((ch) => { s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619) >>> 0; }); return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
      const ed = LW.el("div", { class: "lw-urn-ed" });
      host.append(ed);
      const cs = [];
      if (p.edit !== false) COLS.slice(0, nc).forEach(([id, name], i) => cs.push(stepper(ed, '<span class="lw-urn-dot" style="background:' + COLS[i][2] + '"></span>' + name, c[i], 1, 0, 12, (v) => { c[i] = v; reset(); }, 0)));
      let kSt = null;
      if (p.editK) kSt = stepper(ed, "Züge", k, 1, 1, 5, (v) => { k = v; reset(); }, 0);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      let seg = null;
      if (p.editRepl) seg = K.segmented(row, [{ id: "1", label: "mit Zurücklegen" }, { id: "0", label: "ohne Zurücklegen" }], repl ? "1" : "0", (id) => { repl = id === "1"; reset(); });
      const W = 360, H = 230;
      const svg = K.root(host, W, H, "Urne und Baumdiagramm");
      const g = K.svg("g", null, svg);
      const simRow = LW.el("div", { class: "w-btns" });
      host.append(simRow);
      K.button(simRow, "1000-mal ziehen", () => { simulate(1000); paint(); ctx.changed(); });
      K.button(simRow, "Zählung neu", () => { runs = 0; hits = 0; paint(); ctx.changed(); });
      const out = K.readout(host);
      function reset() { runs = 0; hits = 0; paint(); ctx.changed(); }
      function simulate(m) {
        const { holds } = urnProb(c, k, repl, ev);
        for (let r = 0; r < m; r++) {
          const left = c.slice(), seq = [];
          for (let t = 0; t < k; t++) {
            const N = left.reduce((a, b) => a + b, 0);
            if (N <= 0) break;
            let u = rand() * N, i = 0;
            while (u >= left[i]) { u -= left[i]; i++; }
            seq.push(i);
            if (!repl) left[i]--;
          }
          runs++;
          if (seq.length === k && holds(seq)) hits++;
        }
      }
      function scope() { const { P } = urnProb(c, k, repl, ev); return { r: c[0], b: c[1], g: c[2], N: c[0] + c[1] + c[2], k, repl: repl ? 1 : 0, P, h: runs ? hits / runs : NaN, runs }; }
      function paint() {
        K.clear(g);
        const sc = scope();
        // the urn
        const ux = 60, uy = 120;
        K.svg("path", { d: "M" + (ux - 42) + "," + (uy - 70) + " L" + (ux - 42) + "," + (uy + 60) + " Q" + ux + "," + (uy + 80) + " " + (ux + 42) + "," + (uy + 60) + " L" + (ux + 42) + "," + (uy - 70), fill: "none", stroke: "var(--label-3)", "stroke-width": 2 }, g);
        let bi = 0;
        c.forEach((cnt, i) => { for (let q = 0; q < cnt; q++) { const col = bi % 4, rw = Math.floor(bi / 4); K.svg("circle", { cx: ux - 27 + col * 18, cy: uy + 52 - rw * 18, r: 7.5, fill: COLS[i][2] }, g); bi++; } });
        // tree for few leaves
        const { leaves, holds } = urnProb(c, k, repl, ev);
        if (leaves.length && leaves.length <= 9 && k <= 3) {
          const x0 = 120, x1 = W - 20, colW = (x1 - x0) / k;
          const ys = leaves.map((_, i) => 14 + ((H - 28) * (i + 0.5)) / leaves.length);
          // draw paths level by level
          const nodeY = new Map();
          leaves.forEach(([seq], li) => { for (let t = 1; t <= k; t++) { const key = seq.slice(0, t).join(","); if (!nodeY.has(key)) nodeY.set(key, []); nodeY.get(key).push(ys[li]); } });
          const yOf = (key) => { const arr = nodeY.get(key); return arr.reduce((a, b) => a + b, 0) / arr.length; };
          leaves.forEach(([seq, pr]) => {
            for (let t = 1; t <= k; t++) {
              const parent = seq.slice(0, t - 1).join(","), key = seq.slice(0, t).join(",");
              const xa = x0 + (t - 1) * colW, xb = x0 + t * colW, ya = t === 1 ? H / 2 : yOf(parent), yb = yOf(key);
              K.svg("line", { x1: xa, y1: ya, x2: xb - 9, y2: yb, stroke: holds(seq) ? "var(--accent)" : "var(--label-3)", "stroke-width": holds(seq) ? 1.8 : 1, opacity: holds(seq) ? 1 : 0.6 }, g);
              K.svg("circle", { cx: xb - 4, cy: yb, r: 5, fill: COLS[seq[t - 1]][2] }, g);
            }
            K.text(g, x1 + 2, yOf(seq.join(",")), K.fmt(pr, 3), "s-text", "start");
          });
        } else {
          K.text(g, 240, H / 2, leaves.length + " Pfade: zu viele für ein Baumdiagramm", "s-text");
        }
        out.set(LW.esc("Ereignis: " + evText(ev, k) + " · " + k + (k === 1 ? " Zug " : " Züge ") + (repl ? "mit" : "ohne") + " Zurücklegen") + "<br>" +
          "<b>" + LW.esc("P = " + K.fmt(sc.P, 4)) + "</b>" + (sc.runs ? LW.esc(" · Simulation: " + hits + " von " + runs + " = " + K.fmt(sc.h, 3)) : ""));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          ["r", "b", "g"].forEach((key, i) => { if (s[key] != null) c[i] = s[key]; });
          if (s.k != null) k = s.k;
          if (s.repl != null) repl = !!s.repl;
          cs.forEach((stp, i) => stp.set(c[i]));
          if (kSt) kSt.set(k);
          if (seg) seg.set(repl ? "1" : "0");
          if (s.sim) simulate(s.sim);
          paint();
        },
        getVar: (key) => scope()[key],
      };
    },
  });

  LW.labSpace = { relate };
  LW.labUrn = { urnProb };
  LW.labProc = { stationary, domEigen, matVec };
})();
