/* Statistics labs.
 *
 *   verteilung      distributions with their parameters as sliders: binomial, Poisson, geometric, hypergeometric, normal,
 *                   exponential. Drag the bounds and read P, E(X), Var(X) and sigma; the binomial can carry the normal curve.
 *     params: dists (allowed ids), dist, n, p, lambda, N, M, mu, sigma, a, b, mode ("links" | "zwischen" | "rechts"),
 *             ranges {n: [lo, hi], mu: [lo, hi], ...}, fixed (parameters without slider), approx (normal curve on)
 *     scope:  d (1 binomial, 2 poisson, 3 geometrisch, 4 hypergeometrisch, 5 normal, 6 exponential), n, p, lambda, N, M,
 *             mu, sigma, E, V, s, a, b, P, mode (1 left, 2 between, 3 right), laplace (1 when sigma > 3)
 *   testlabor       hypothesis test on the binomial distribution: one- or two-sided, type II error, power function
 *     params: n, p0, level, side ("rechts" | "links" | "beide"), p1, adjust (sliders shown: "n", "p0", "level", "side", "p1"),
 *             auto (region follows the optimum), k, kl, kr, beta (type II error shown), power (power curve shown)
 *     scope:  n, p0, p1, level, side (1 links, 2 rechts, 3 beide), k, kl, kr, alpha, beta, power, kopt, klopt, kropt, optimal
 *   konfidenzlabor  confidence interval h ± z·sqrt(h(1-h)/n) from n and the number of hits, and many simulated intervals
 *     params: n, k, level (0.9 | 0.95 | 0.99), p (true proportion of the simulation), rows, adjust ("n", "k", "level", "p")
 *     scope:  n, k, h, z, level, lo, hi, w, wmax, p, total, inside, rate, covers (1 when the interval contains p)
 *
 * Goals are expressions over the scope (goal.when; goal.list for a checklist; goal.solve with values for the sample solution).
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // ---------------------------------------------------------------- distributions
  const LF = [0];
  const logFact = (n) => { for (let i = LF.length; i <= n; i++) LF[i] = LF[i - 1] + Math.log(i); return LF[n]; };
  const logC = (n, k) => (k < 0 || k > n ? -Infinity : logFact(n) - logFact(k) - logFact(n - k));
  function Phi(z) {
    if (!isFinite(z)) return z > 0 ? 1 : 0;
    const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
    const e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
    return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
  }
  const binom = (n, p, k) => (k < 0 || k > n ? 0 : p <= 0 ? (k === 0 ? 1 : 0) : p >= 1 ? (k === n ? 1 : 0) : Math.exp(logC(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p)));
  const DISTS = {
    binomial: { id: 1, label: "Binomial", discrete: true, params: ["n", "p"],
      pmf: (P, k) => binom(P.n, P.p, k), E: (P) => P.n * P.p, V: (P) => P.n * P.p * (1 - P.p), lo: () => 0, hi: (P) => P.n },
    poisson: { id: 2, label: "Poisson", discrete: true, params: ["lambda"],
      pmf: (P, k) => (k < 0 ? 0 : Math.exp(-P.lambda + k * Math.log(P.lambda) - logFact(k))), E: (P) => P.lambda, V: (P) => P.lambda, lo: () => 0, hi: (P) => Math.ceil(P.lambda + 6 * Math.sqrt(P.lambda) + 6) },
    geometrisch: { id: 3, label: "Geometrisch", discrete: true, params: ["p"],
      pmf: (P, k) => (k < 1 ? 0 : Math.pow(1 - P.p, k - 1) * P.p), E: (P) => 1 / P.p, V: (P) => (1 - P.p) / (P.p * P.p), lo: () => 1, hi: (P) => Math.max(8, Math.ceil(Math.log(0.0005) / Math.log(1 - P.p))) },
    hypergeometrisch: { id: 4, label: "Hypergeom.", discrete: true, params: ["N", "M", "n"],
      pmf: (P, k) => Math.exp(logC(P.M, k) + logC(P.N - P.M, P.n - k) - logC(P.N, P.n)) || 0,
      E: (P) => (P.n * P.M) / P.N, V: (P) => P.n * (P.M / P.N) * (1 - P.M / P.N) * (P.N > 1 ? (P.N - P.n) / (P.N - 1) : 0),
      lo: (P) => Math.max(0, P.n - (P.N - P.M)), hi: (P) => Math.min(P.n, P.M) },
    normal: { id: 5, label: "Normal", discrete: false, params: ["mu", "sigma"],
      pdf: (P, x) => Math.exp(-((x - P.mu) ** 2) / (2 * P.sigma * P.sigma)) / (P.sigma * Math.sqrt(2 * Math.PI)), cdf: (P, x) => Phi((x - P.mu) / P.sigma),
      E: (P) => P.mu, V: (P) => P.sigma * P.sigma, lo: (P) => P.mu - 4 * P.sigma, hi: (P) => P.mu + 4 * P.sigma },
    exponential: { id: 6, label: "Exponential", discrete: false, params: ["lambda"],
      pdf: (P, x) => (x < 0 ? 0 : P.lambda * Math.exp(-P.lambda * x)), cdf: (P, x) => (x < 0 ? 0 : 1 - Math.exp(-P.lambda * x)),
      E: (P) => 1 / P.lambda, V: (P) => 1 / (P.lambda * P.lambda), lo: () => 0, hi: (P) => 6 / P.lambda },
  };
  const PARAM = {
    n: { tex: "n", min: 1, max: 100, step: 1 }, p: { tex: "p", min: 0.01, max: 0.99, step: 0.01 }, lambda: { tex: "\\lambda", min: 0.1, max: 20, step: 0.1 },
    N: { tex: "N", min: 2, max: 100, step: 1 }, M: { tex: "M", min: 1, max: 99, step: 1 }, mu: { tex: "\\mu", min: -10, max: 110, step: 0.5 }, sigma: { tex: "\\sigma", min: 0.2, max: 30, step: 0.1 },
  };

  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: goal.message || null };
  }
  const pct = (v, d) => K.fmt(v * 100, d == null ? 2 : d) + " %";

  /** A draggable bound on the axis: a thin line with a handle, in its own layer so redraws do not drop it. */
  function bound(svg, layer, color, label) {
    const g = K.svg("g", { style: "cursor:ew-resize" }, layer);
    const line = K.svg("line", { stroke: color, "stroke-width": 2 }, g);
    const dot = K.svg("circle", { r: 9, fill: color, opacity: 0.9 }, g);
    const hit = K.svg("circle", { r: 18, fill: "transparent" }, g);
    const t = K.text(g, 0, 0, label, "s-text-strong");
    return {
      g, hit,
      place(x, top, bottom) { line.setAttribute("x1", x); line.setAttribute("x2", x); line.setAttribute("y1", top); line.setAttribute("y2", bottom); dot.setAttribute("cx", x); dot.setAttribute("cy", bottom + 12); hit.setAttribute("cx", x); hit.setAttribute("cy", bottom + 12); t.setAttribute("x", x); t.setAttribute("y", bottom + 30); },
      show(on) { g.setAttribute("display", on ? "inline" : "none"); },
    };
  }

  // ---------------------------------------------------------------- distributions lab
  LW.widget("verteilung", {
    mount(host, p, ctx) {
      const allowed = (p.dists || ["binomial", "poisson", "geometrisch", "hypergeometrisch", "normal", "exponential"]).filter((d) => DISTS[d]);
      let dist = allowed.includes(p.dist) ? p.dist : allowed[0];
      const P = { n: p.n != null ? p.n : 20, p: p.p != null ? p.p : 0.3, lambda: p.lambda != null ? p.lambda : 4, N: p.N != null ? p.N : 50, M: p.M != null ? p.M : 10, mu: p.mu != null ? p.mu : 100, sigma: p.sigma != null ? p.sigma : 15 };
      let mode = { links: 1, zwischen: 2, rechts: 3 }[p.mode || "zwischen"] || 2;
      let a = p.a, b = p.b, approx = !!p.approx;
      const fixed = new Set(p.fixed || []);
      const ranges = p.ranges || {};
      const D = () => DISTS[dist];
      const clampP = () => {
        P.M = Math.min(P.M, P.N - 1);
        if (dist === "hypergeometrisch") P.n = Math.min(P.n, P.N);
      };
      function defaults() {
        const d = D(), E = d.E(P), s = Math.sqrt(d.V(P));
        if (a == null || !isFinite(a)) a = d.discrete ? Math.max(d.lo(P), Math.round(E - s)) : +(E - s).toFixed(2);
        if (b == null || !isFinite(b)) b = d.discrete ? Math.min(d.hi(P), Math.round(E + s)) : +(E + s).toFixed(2);
      }
      defaults();

      if (allowed.length > 1) K.segmented(host, allowed.map((id) => ({ id, label: DISTS[id].label })), dist, (id) => { dist = id; a = null; b = null; defaults(); buildSliders(); paint(); ctx.changed(); });
      const sliderBox = LW.el("div", { class: "lw-lab-sliders" });
      host.append(sliderBox);
      let sliders = {};
      function buildSliders() {
        sliderBox.innerHTML = "";
        sliders = {};
        D().params.forEach((name) => {
          if (fixed.has(name)) return;
          const def = PARAM[name], rg = ranges[name] || [def.min, def.max];
          sliders[name] = K.slider(sliderBox, { label: name, labelHtml: LW.math(def.tex), min: rg[0], max: rg[1], step: def.step, value: P[name],
            format: (v) => K.fmt(v, def.step < 1 ? (def.step < 0.1 ? 2 : 1) : 0),
            onInput: (v) => { P[name] = v; clampP(); keepBounds(); paint(); ctx.changed(); } });
        });
      }
      function keepBounds() {
        const d = D();
        if (d.discrete) { a = K.clamp(Math.round(a), d.lo(P), d.hi(P)); b = K.clamp(Math.round(b), d.lo(P), d.hi(P)); }
      }
      buildSliders();
      const modeRow = LW.el("div", { class: "w-btns" });
      host.append(modeRow);
      const modeSeg = K.segmented(modeRow, [{ id: "1", label: "P(X ≤ b)" }, { id: "2", label: "P(a ≤ X ≤ b)" }, { id: "3", label: "P(X ≥ a)" }], String(mode), (id) => { mode = +id; paint(); ctx.changed(); });
      let approxBtn = null;
      if (allowed.includes("binomial")) {
        approxBtn = K.button(modeRow, "Normalkurve", () => { approx = !approx; approxBtn.classList.toggle("on", approx); paint(); });
        approxBtn.classList.toggle("on", approx);
      }
      const W = 360, H = 236, L = 34, R = W - 12, T = 12, B = H - 56;
      const svg = K.root(host, W, H, "Verteilung");
      svg.style.touchAction = "pan-y";
      const g = K.svg("g", null, svg), top = K.svg("g", null, svg);
      const hA = bound(svg, top, "var(--orange)", "a"), hB = bound(svg, top, "var(--accent)", "b");
      let sx = null;
      const dragTo = (which) => (q) => {
        if (!sx) return;
        const d = D();
        let v = sx.inv(q.x);
        v = d.discrete ? Math.round(v) : +v.toFixed(2);
        const lo = d.discrete ? d.lo(P) : sx.domain[0], hi = d.discrete ? d.hi(P) : sx.domain[1];
        v = K.clamp(v, lo, hi);
        if (which === "a") a = v; else b = v;
        paint(); ctx.changed();
      };
      K.drag(svg, hA.hit, dragTo("a"));
      K.drag(svg, hB.hit, dragTo("b"));
      const out = K.readout(host);

      function prob() {
        const d = D();
        const from = mode === 1 ? -Infinity : a, to = mode === 3 ? Infinity : b;
        if (d.discrete) {
          let s = 0;
          const k0 = from === -Infinity ? d.lo(P) : Math.max(d.lo(P), Math.ceil(from - 1e-9));
          const k1 = to === Infinity ? d.hi(P) : Math.min(d.hi(P), Math.floor(to + 1e-9));
          for (let k = k0; k <= k1; k++) s += d.pmf(P, k);
          return Math.min(1, s);
        }
        return Math.max(0, (to === Infinity ? 1 : d.cdf(P, to)) - (from === -Infinity ? 0 : d.cdf(P, from)));
      }
      const scope = () => {
        const d = D(), E = d.E(P), V = d.V(P);
        return { d: d.id, n: P.n, p: P.p, lambda: P.lambda, N: P.N, M: P.M, mu: P.mu, sigma: P.sigma, E, V, s: Math.sqrt(V), a, b, P: prob(), mode, laplace: Math.sqrt(V) > 3 ? 1 : 0 };
      };
      const inRange = (x) => (mode === 1 ? x <= b + 1e-9 : mode === 3 ? x >= a - 1e-9 : x >= a - 1e-9 && x <= b + 1e-9);

      function paint() {
        K.clear(g);
        const d = D();
        let x0 = d.lo(P), x1 = d.hi(P);
        if (d.discrete) {
          // trim long tails that carry no visible probability
          while (x1 > x0 + 4 && d.pmf(P, x1) < 1e-4 && d.pmf(P, x1 - 1) < 1e-4) x1--;
          while (x0 < x1 - 4 && d.pmf(P, x0) < 1e-4 && d.pmf(P, x0 + 1) < 1e-4) x0++;
          x0 = Math.min(x0, a, b); x1 = Math.max(x1, a, b);
        }
        const pad = d.discrete ? 0.6 : 0;
        sx = K.scale(x0 - pad, x1 + pad, L, R);
        let ymax = 0;
        if (d.discrete) for (let k = x0; k <= x1; k++) ymax = Math.max(ymax, d.pmf(P, k));
        else for (let i = 0; i <= 200; i++) ymax = Math.max(ymax, d.pdf(P, x0 + ((x1 - x0) * i) / 200));
        if (approx && dist === "binomial") ymax = Math.max(ymax, 1 / (Math.sqrt(2 * Math.PI * Math.max(1e-9, d.V(P)))));
        const sy = K.scale(0, ymax * 1.12 || 1, B, T);
        K.ticks(0, ymax * 1.12 || 1, 4).forEach((t) => { K.svg("line", { x1: L, y1: sy(t), x2: R, y2: sy(t), class: "s-grid" }, g); K.text(g, L - 5, sy(t), K.fmt(t, 3), "s-text", "end"); });
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g);
        if (d.discrete) {
          const w = Math.max(1, Math.min(26, (sx(1) - sx(0)) * 0.8));
          for (let k = x0; k <= x1; k++) {
            const v = d.pmf(P, k), on = inRange(k);
            K.svg("rect", { x: sx(k) - w / 2, y: sy(v), width: w, height: Math.max(0, B - sy(v)), rx: Math.min(3, w / 3), fill: on ? "var(--accent)" : "var(--fill-2)", opacity: on ? 0.9 : 1 }, g);
          }
          const every = Math.max(1, Math.ceil((x1 - x0) / 10));
          for (let k = Math.ceil(x0 / every) * every; k <= x1; k += every) K.text(g, sx(k), B + 12, String(k), "s-text");
          if (approx && dist === "binomial") {
            const mu = d.E(P), s = Math.sqrt(d.V(P));
            let path = "";
            for (let i = 0; i <= 160; i++) { const x = x0 - 0.5 + ((x1 - x0 + 1) * i) / 160; path += (i ? "L" : "M") + sx(x).toFixed(1) + "," + sy(Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))).toFixed(1); }
            K.svg("path", { d: path, fill: "none", stroke: "var(--orange)", "stroke-width": 2.2 }, g);
          }
        } else {
          let area = "", curve = "";
          const lo = mode === 1 ? x0 : Math.max(x0, a), hi = mode === 3 ? x1 : Math.min(x1, b);
          for (let i = 0; i <= 200; i++) { const x = x0 + ((x1 - x0) * i) / 200; curve += (i ? "L" : "M") + sx(x).toFixed(1) + "," + sy(d.pdf(P, x)).toFixed(1); }
          if (hi > lo) {
            area = "M" + sx(lo) + "," + B;
            for (let i = 0; i <= 120; i++) { const x = lo + ((hi - lo) * i) / 120; area += "L" + sx(x).toFixed(1) + "," + sy(d.pdf(P, x)).toFixed(1); }
            area += "L" + sx(hi) + "," + B + "Z";
            K.svg("path", { d: area, fill: "var(--accent)", opacity: 0.3 }, g);
          }
          K.svg("path", { d: curve, fill: "none", stroke: "var(--accent)", "stroke-width": 2.4 }, g);
          K.ticks(x0, x1, 7).forEach((t) => K.text(g, sx(t), B + 12, K.fmt(t, 2), "s-text"));
        }
        // bounds
        const posA = d.discrete ? sx(a) - (sx(1) - sx(0)) / 2 : sx(a), posB = d.discrete ? sx(b) + (sx(1) - sx(0)) / 2 : sx(b);
        hA.place(K.clamp(posA, L, R), T, B); hB.place(K.clamp(posB, L, R), T, B);
        hA.show(mode !== 1); hB.show(mode !== 3);
        if (approxBtn) approxBtn.style.display = dist === "binomial" ? "" : "none";
        const S = scope();
        const ev = K.fmt(S.E, 3);
        const what = mode === 1 ? "P(X ≤ " + K.fmt(b, 2) + ")" : mode === 3 ? "P(X ≥ " + K.fmt(a, 2) + ")" : "P(" + K.fmt(a, 2) + " ≤ X ≤ " + K.fmt(b, 2) + ")";
        let html = "<b>" + LW.esc(what) + " = " + K.fmt(S.P, 4) + "</b> (" + pct(S.P) + ")<br>" + LW.esc("E(X) = " + ev + " · Var(X) = " + K.fmt(S.V, 3) + " · σ = " + K.fmt(S.s, 3));
        if (dist === "binomial") html += "<br>" + LW.esc("Laplace-Bedingung σ > 3: ") + (S.laplace ? K.pill(true, "erfüllt") : K.pill(false, "nicht erfüllt"));
        out.set(html);
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.dist && DISTS[s.dist] && allowed.includes(s.dist)) dist = s.dist;
          Object.keys(P).forEach((k) => { if (s[k] != null) P[k] = s[k]; });
          if (s.mode) mode = { links: 1, zwischen: 2, rechts: 3 }[s.mode] || +s.mode || mode;
          if (s.a != null) a = s.a;
          if (s.b != null) b = s.b;
          clampP();
          buildSliders();
          modeSeg.set(String(mode));
          paint();
        },
        getVar: (k) => scope()[k],
        setVar(k, v) { if (k in P) { P[k] = v; buildSliders(); } if (k === "a") a = v; if (k === "b") b = v; paint(); },
      };
    },
  });

  // ---------------------------------------------------------------- hypothesis test lab
  LW.widget("testlabor", {
    mount(host, p, ctx) {
      let n = p.n || 50, p0 = p.p0 != null ? p.p0 : 0.5, p1 = p.p1 != null ? p.p1 : 0.6, level = p.level || 0.05;
      let side = { links: 1, rechts: 2, beide: 3 }[p.side || "rechts"] || 2;
      const adjust = new Set(p.adjust || ["n", "p0", "level", "side", "p1"]);
      let auto = !!p.auto, showBeta = p.beta !== false, showPower = !!p.power;
      let pmf0 = [], pmf1 = [];
      const pmfOf = (q) => { const out = []; for (let k = 0; k <= n; k++) out.push(binom(n, q, k)); return out; };
      const cum = (arr, from, to) => { let s = 0; for (let k = Math.max(0, from); k <= Math.min(n, to); k++) s += arr[k]; return s; };
      function opt() {
        // right: smallest k with P(X >= k) <= level; left: largest k with P(X <= k) <= level; both: each tail with level/2
        let kR = n + 1, s = 0;
        for (let k = n; k >= 0; k--) { s += pmf0[k]; if (s > level) { kR = k + 1; break; } if (k === 0) kR = 0; }
        let kL = -1; s = 0;
        for (let k = 0; k <= n; k++) { s += pmf0[k]; if (s > level) { kL = k - 1; break; } if (k === n) kL = n; }
        let kr2 = n + 1; s = 0;
        for (let k = n; k >= 0; k--) { s += pmf0[k]; if (s > level / 2) { kr2 = k + 1; break; } }
        let kl2 = -1; s = 0;
        for (let k = 0; k <= n; k++) { s += pmf0[k]; if (s > level / 2) { kl2 = k - 1; break; } }
        return { kR, kL, kl2, kr2 };
      }
      let k, kl, kr;
      function recompute(keep) {
        pmf0 = pmfOf(p0); pmf1 = pmfOf(p1);
        const o = opt();
        if (!keep || auto) {
          k = side === 1 ? o.kL : o.kR;
          kl = o.kl2; kr = o.kr2;
        }
        k = K.clamp(k, -1, n + 1); kl = K.clamp(kl, -1, n); kr = K.clamp(kr, 0, n + 1);
      }
      k = p.k; kl = p.kl; kr = p.kr;
      recompute(p.k != null || p.kl != null);

      const sliderBox = LW.el("div", { class: "lw-lab-sliders" });
      host.append(sliderBox);
      const sl = {};
      if (adjust.has("n")) sl.n = K.slider(sliderBox, { label: "n", labelHtml: LW.math("n"), min: 5, max: 300, step: 1, value: n, format: (v) => String(v), onInput: (v) => { n = v; recompute(true); paint(); ctx.changed(); } });
      if (adjust.has("p0")) sl.p0 = K.slider(sliderBox, { label: "p0", labelHtml: LW.math("p_0"), min: 0.01, max: 0.99, step: 0.01, value: p0, format: (v) => K.fmt(v, 2), onInput: (v) => { p0 = v; recompute(true); paint(); ctx.changed(); } });
      if (adjust.has("p1")) sl.p1 = K.slider(sliderBox, { label: "p1", labelHtml: LW.math("p_1"), min: 0.01, max: 0.99, step: 0.01, value: p1, format: (v) => K.fmt(v, 2), onInput: (v) => { p1 = v; pmf1 = pmfOf(p1); paint(); ctx.changed(); } });
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      let segSide = null, segLevel = null;
      if (adjust.has("side")) segSide = K.segmented(row, [{ id: "1", label: "linksseitig" }, { id: "2", label: "rechtsseitig" }, { id: "3", label: "zweiseitig" }], String(side), (id) => { side = +id; recompute(false); paint(); ctx.changed(); });
      const row2 = LW.el("div", { class: "w-btns" });
      host.append(row2);
      if (adjust.has("level")) segLevel = K.segmented(row2, [{ id: "0.01", label: "α = 1 %" }, { id: "0.05", label: "5 %" }, { id: "0.1", label: "10 %" }], String(level), (id) => { level = +id; recompute(true); paint(); ctx.changed(); });
      const autoBtn = K.button(row2, "Bereich automatisch", () => { auto = !auto; autoBtn.classList.toggle("on", auto); recompute(false); paint(); ctx.changed(); });
      autoBtn.classList.toggle("on", auto);
      const betaBtn = K.button(row2, "Fehler 2. Art", () => { showBeta = !showBeta; betaBtn.classList.toggle("on", showBeta); paint(); });
      betaBtn.classList.toggle("on", showBeta);
      const powBtn = K.button(row2, "Gütefunktion", () => { showPower = !showPower; powBtn.classList.toggle("on", showPower); paint(); });
      powBtn.classList.toggle("on", showPower);

      const W = 360, H = 240, L = 36, R = W - 12, T = 12, B = H - 58;
      const svg = K.root(host, W, H, "Binomialtest");
      svg.style.touchAction = "pan-y";
      const g = K.svg("g", null, svg), top = K.svg("g", null, svg);
      const h1 = bound(svg, top, "var(--red)", "k"), h2 = bound(svg, top, "var(--red)", "k");
      let sx = null;
      const drag = (which) => (q) => {
        if (!sx) return;
        auto = false; autoBtn.classList.remove("on");
        if (side === 3) { if (which === 1) kl = K.clamp(Math.round(sx.inv(q.x) - 0.5), -1, kr - 1); else kr = K.clamp(Math.round(sx.inv(q.x) + 0.5), kl + 1, n + 1); }
        else if (side === 2) k = K.clamp(Math.round(sx.inv(q.x) + 0.5), 0, n + 1);
        else k = K.clamp(Math.round(sx.inv(q.x) - 0.5), -1, n);
        paint(); ctx.changed();
      };
      K.drag(svg, h1.hit, drag(1));
      K.drag(svg, h2.hit, drag(2));
      const powSvg = K.root(host, W, 150, "Gütefunktion");
      const pg = K.svg("g", null, powSvg);
      const out = K.readout(host);

      const reject = (x) => (side === 2 ? x >= k : side === 1 ? x <= k : x <= kl || x >= kr);
      const alphaOf = () => { let s = 0; for (let x = 0; x <= n; x++) if (reject(x)) s += pmf0[x]; return s; };
      const betaOf = () => { let s = 0; for (let x = 0; x <= n; x++) if (!reject(x)) s += pmf1[x]; return s; };
      function scope() {
        const o = opt(), al = alphaOf(), be = betaOf();
        const optimal = side === 3 ? (kl === o.kl2 && kr === o.kr2) : side === 2 ? k === o.kR : k === o.kL;
        return { n, p0, p1, level, side, k, kl, kr, alpha: al, beta: be, power: 1 - be, kopt: side === 1 ? o.kL : o.kR, klopt: o.kl2, kropt: o.kr2, optimal: optimal ? 1 : 0, ok: al <= level + 1e-12 ? 1 : 0 };
      }
      function paint() {
        K.clear(g);
        // the visible range: where either distribution has mass
        let x0 = n, x1 = 0;
        for (let x = 0; x <= n; x++) if (pmf0[x] > 1e-4 || (showBeta && pmf1[x] > 1e-4)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
        [k, kl, kr].forEach((v) => { if (v >= 0 && v <= n) { x0 = Math.min(x0, v); x1 = Math.max(x1, v); } });
        x0 = Math.max(0, x0 - 1); x1 = Math.min(n, x1 + 1);
        sx = K.scale(x0 - 0.6, x1 + 0.6, L, R);
        let ymax = 0;
        for (let x = x0; x <= x1; x++) ymax = Math.max(ymax, pmf0[x], showBeta ? pmf1[x] : 0);
        const sy = K.scale(0, ymax * 1.15 || 1, B, T);
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g);
        const w = Math.max(1, Math.min(22, (sx(1) - sx(0)) * 0.78));
        for (let x = x0; x <= x1; x++) {
          const rj = reject(x);
          K.svg("rect", { x: sx(x) - w / 2, y: sy(pmf0[x]), width: w, height: Math.max(0, B - sy(pmf0[x])), rx: Math.min(3, w / 3), fill: rj ? "var(--red)" : "var(--blue)", opacity: rj ? 0.9 : 0.5 }, g);
          if (showBeta) {
            const yy = sy(pmf1[x]);
            K.svg("rect", { x: sx(x) - w / 2, y: yy, width: w, height: Math.max(0, B - yy), rx: Math.min(3, w / 3), fill: rj ? "none" : "var(--orange)", "fill-opacity": rj ? 0 : 0.28, stroke: "var(--orange)", "stroke-width": 1.4 }, g);
          }
        }
        const every = Math.max(1, Math.ceil((x1 - x0) / 10));
        for (let x = Math.ceil(x0 / every) * every; x <= x1; x += every) K.text(g, sx(x), B + 12, String(x), "s-text");
        // bounds
        const half = (sx(1) - sx(0)) / 2;
        if (side === 3) { h1.place(K.clamp(sx(kl) + half, L, R), T, B); h2.place(K.clamp(sx(kr) - half, L, R), T, B); h1.show(true); h2.show(true); }
        else { h1.place(K.clamp(side === 2 ? sx(k) - half : sx(k) + half, L, R), T, B); h1.show(true); h2.show(false); }
        const S = scope();
        const region = side === 2 ? "X ≥ " + k : side === 1 ? "X ≤ " + k : "X ≤ " + kl + " oder X ≥ " + kr;
        let html = "H₀: p " + (side === 2 ? "≤ " : side === 1 ? "≥ " : "= ") + K.fmt(p0, 2) + " · n = " + n + "<br>Ablehnungsbereich <b>" + LW.esc(region) + "</b><br>" +
          "Fehler 1. Art α = <b>" + K.fmt(S.alpha, 4) + "</b> " + (S.ok ? K.pill(true, "höchstens " + K.fmt(level * 100, 0) + " %") : K.pill(false, "über " + K.fmt(level * 100, 0) + " %")) +
          (S.optimal ? " " + K.pill(true, "größtmöglich") : "");
        if (showBeta) html += "<br>Bei wahrem p = " + K.fmt(p1, 2) + ": Fehler 2. Art β = <b>" + K.fmt(S.beta, 4) + "</b>, Güte 1 − β = " + K.fmt(S.power, 4);
        out.set(html);
        // power function
        powSvg.style.display = showPower ? "block" : "none";
        K.clear(pg);
        if (showPower) {
          const px0 = 36, px1 = W - 12, py0 = 130, py1 = 10;
          const qx = K.scale(0, 1, px0, px1), qy = K.scale(0, 1, py0, py1);
          K.svg("line", { x1: px0, y1: py0, x2: px1, y2: py0, class: "s-axis" }, pg);
          [0, 0.5, 1].forEach((t) => { K.svg("line", { x1: px0, y1: qy(t), x2: px1, y2: qy(t), class: "s-grid" }, pg); K.text(pg, px0 - 5, qy(t), K.fmt(t, 1), "s-text", "end"); });
          [0, 0.25, 0.5, 0.75, 1].forEach((t) => K.text(pg, qx(t), py0 + 12, K.fmt(t, 2), "s-text"));
          let d = "";
          for (let i = 0; i <= 100; i++) {
            const q = i / 100, f = pmfOf(q);
            let s = 0;
            for (let x = 0; x <= n; x++) if (reject(x)) s += f[x];
            d += (i ? "L" : "M") + qx(q).toFixed(1) + "," + qy(s).toFixed(1);
          }
          K.svg("path", { d, fill: "none", stroke: "var(--red)", "stroke-width": 2.2 }, pg);
          K.svg("line", { x1: px0, y1: qy(level), x2: px1, y2: qy(level), stroke: "var(--label-3)", "stroke-dasharray": "4 4" }, pg);
          K.svg("circle", { cx: qx(p1), cy: qy(S.power), r: 5, fill: "var(--orange)" }, pg);
          K.svg("circle", { cx: qx(p0), cy: qy(S.alpha), r: 5, fill: "var(--red)" }, pg);
          K.text(pg, px1, py1 + 4, "Ablehnwahrscheinlichkeit über p", "s-text", "end");
        }
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.n != null) n = s.n;
          if (s.p0 != null) p0 = s.p0;
          if (s.p1 != null) p1 = s.p1;
          if (s.level != null) level = s.level;
          if (s.side) side = { links: 1, rechts: 2, beide: 3 }[s.side] || +s.side;
          recompute(false);
          if (s.k != null) k = s.k;
          if (s.kl != null) kl = s.kl;
          if (s.kr != null) kr = s.kr;
          if (sl.n) sl.n.set(n);
          if (sl.p0) sl.p0.set(p0);
          if (sl.p1) sl.p1.set(p1);
          if (segSide) segSide.set(String(side));
          if (segLevel) segLevel.set(String(level));
          paint();
        },
        getVar: (name) => scope()[name],
      };
    },
  });

  // ---------------------------------------------------------------- confidence interval lab
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    let s = h >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const Z = { "0.9": 1.645, "0.95": 1.96, "0.99": 2.576 };
  LW.widget("konfidenzlabor", {
    mount(host, p, ctx) {
      let n = p.n || 100, k = p.k != null ? p.k : Math.round(n * 0.6), level = p.level || 0.95, prob = p.p != null ? p.p : 0.5;
      const rowsMax = p.rows || 50;
      const adjust = new Set(p.adjust || ["n", "k", "level", "p"]);
      const rand = seeded(ctx.seed + "|ki");
      let samples = [];
      const z = () => Z[String(level)] || 1.96;
      const ci = (kk, nn) => { const h = kk / nn, r = z() * Math.sqrt((h * (1 - h)) / nn); return [h - r, h + r]; };
      const box = LW.el("div", { class: "lw-lab-sliders" });
      host.append(box);
      const sl = {};
      if (adjust.has("n")) sl.n = K.slider(box, { label: "n", labelHtml: LW.math("n"), min: 10, max: 2000, step: 5, value: n, format: (v) => String(v), onInput: (v) => { const h = k / n; n = v; k = Math.round(h * n); if (sl.k) { sl.k.input.max = n; sl.k.set(k); } paint(); ctx.changed(); } });
      if (adjust.has("k")) sl.k = K.slider(box, { label: "k", labelHtml: LW.math("k"), min: 0, max: n, step: 1, value: k, format: (v) => String(v), onInput: (v) => { k = Math.min(v, n); paint(); ctx.changed(); } });
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      let seg = null;
      if (adjust.has("level")) seg = K.segmented(row, [{ id: "0.9", label: "90 %" }, { id: "0.95", label: "95 %" }, { id: "0.99", label: "99 %" }], String(level), (id) => { level = +id; paint(); ctx.changed(); });
      const W = 360, H1 = 96;
      const svg1 = K.root(host, W, H1, "Konfidenzintervall der Stichprobe");
      const g1 = K.svg("g", null, svg1);
      const out1 = K.readout(host);
      // simulation
      const simHead = LW.el("div", { class: "w-btns" });
      host.append(simHead);
      if (adjust.has("p")) sl.p = K.slider(host, { label: "p", labelHtml: LW.math("p"), min: 0.01, max: 0.99, step: 0.01, value: prob, format: (v) => K.fmt(v, 2), onInput: (v) => { prob = v; samples = []; paint(); ctx.changed(); } });
      K.button(simHead, "100 Stichproben ziehen", () => { draw(100); paint(); ctx.changed(); });
      K.button(simHead, "Neu", () => { samples = []; paint(); ctx.changed(); });
      const H2 = 230;
      const svg2 = K.root(host, W, H2, "Viele Konfidenzintervalle");
      const g2 = K.svg("g", null, svg2);
      const out2 = K.readout(host);

      function draw(count) {
        for (let r = 0; r < count; r++) {
          let hits = 0;
          for (let i = 0; i < n; i++) if (rand() < prob) hits++;
          samples.push(hits);
        }
      }
      function scope() {
        const h = k / n, [lo, hi] = ci(k, n), inside = samples.filter((kk) => { const [a, b] = ci(kk, n); return a <= prob && prob <= b; }).length;
        return { n, k, h, z: z(), level, lo, hi, w: hi - lo, wmax: z() / Math.sqrt(n), p: prob, total: samples.length, inside, rate: samples.length ? inside / samples.length : 0, covers: lo <= prob && prob <= hi ? 1 : 0 };
      }
      function paint() {
        const S = scope();
        // one interval
        K.clear(g1);
        const x = K.scale(0, 1, 16, W - 16);
        K.svg("line", { x1: x(0), y1: 60, x2: x(1), y2: 60, class: "s-axis" }, g1);
        [0, 0.25, 0.5, 0.75, 1].forEach((t) => { K.svg("line", { x1: x(t), y1: 56, x2: x(t), y2: 64, class: "s-axis" }, g1); K.text(g1, x(t), 78, K.fmt(t, 2), "s-text"); });
        const a = K.clamp(S.lo, 0, 1), b = K.clamp(S.hi, 0, 1);
        K.svg("rect", { x: x(a), y: 34, width: Math.max(2, x(b) - x(a)), height: 14, rx: 7, fill: "var(--accent)", opacity: 0.8 }, g1);
        K.svg("circle", { cx: x(S.h), cy: 41, r: 5, fill: "var(--label)" }, g1);
        K.text(g1, x(S.h), 22, "h = " + K.fmt(S.h, 3), "s-text-strong");
        out1.set(LW.math("\\hat p = h = \\tfrac{" + k + "}{" + n + "} = " + K.fmt(S.h, 3).replace(",", "{,}") + "\\qquad h \\pm " + K.fmt(S.z, 3).replace(",", "{,}") + "\\sqrt{\\tfrac{h(1-h)}{n}}") +
          "<br>" + LW.esc("Intervall [" + K.fmt(S.lo, 4) + "; " + K.fmt(S.hi, 4) + "], Breite " + K.fmt(S.w, 4) + " · größte Breite (bei h = 0,5): " + K.fmt(S.wmax, 4)));
        // many intervals
        K.clear(g2);
        const x2 = K.scale(0, 1, 16, W - 16);
        K.svg("line", { x1: x2(prob), y1: 6, x2: x2(prob), y2: H2 - 22, stroke: "var(--label)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, g2);
        K.text(g2, x2(prob), H2 - 10, "wahres p = " + K.fmt(prob, 2), "s-text-strong");
        const show = samples.slice(-rowsMax);
        const dy = (H2 - 34) / Math.max(rowsMax, 1);
        show.forEach((kk, i) => {
          const [lo, hi] = ci(kk, n), ok = lo <= prob && prob <= hi;
          const yy = 8 + i * dy;
          K.svg("line", { x1: x2(K.clamp(lo, 0, 1)), y1: yy, x2: x2(K.clamp(hi, 0, 1)), y2: yy, stroke: ok ? "var(--green)" : "var(--red)", "stroke-width": Math.max(1.5, dy * 0.6), "stroke-linecap": "round" }, g2);
        });
        out2.set(S.total ? LW.esc(S.inside + " von " + S.total + " Intervallen enthalten p (" + K.fmt(S.rate * 100, 1) + " %), erwartet etwa " + K.fmt(level * 100, 0) + " %.") : LW.esc("Ziehe Stichproben: Jede liefert ein Intervall. Grün heißt, es enthält das wahre p."));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.n != null) n = s.n;
          if (s.k != null) k = s.k;
          if (s.level != null) level = s.level;
          if (s.p != null) { prob = s.p; samples = []; }
          if (s.draw) draw(s.draw);
          if (sl.n) sl.n.set(n);
          if (sl.k) { sl.k.input.max = n; sl.k.set(k); }
          if (sl.p) sl.p.set(prob);
          if (seg) seg.set(String(level));
          paint();
        },
        getVar: (name) => scope()[name],
      };
    },
  });

  // ---------------------------------------------------------------- central limit theorem lab
  /* zgslabor: a population on the values 0..m (bars the learner can drag or presets), the exact distribution of the sum of
   *   n independent draws (by convolution), standardised and laid over the standard normal density. The distance
   *   d = max |P(S ≤ s) - Φ((s + 1/2 - nμ)/(σ√n))| measures how normal it already is.
   *   params: pop (weights for 0..m), n, editable (bars draggable, default true), presets (default true), nRange, task-free goals
   *   scope:  n, mu, sigma, skew, d, m */
  function sumDist(pop, n) {
    let cur = [1];
    for (let k = 0; k < n; k++) {
      const next = new Array(cur.length + pop.length - 1).fill(0);
      for (let i = 0; i < cur.length; i++) { if (!cur[i]) continue; for (let j = 0; j < pop.length; j++) next[i + j] += cur[i] * pop[j]; }
      cur = next;
    }
    return cur;
  }
  function popStats(w) {
    const t = w.reduce((a, b) => a + b, 0) || 1, p = w.map((x) => x / t);
    const mu = p.reduce((s, q, i) => s + i * q, 0), v = p.reduce((s, q, i) => s + q * (i - mu) ** 2, 0), sd = Math.sqrt(v);
    const sk = sd > 0 ? p.reduce((s, q, i) => s + q * (i - mu) ** 3, 0) / (sd * sd * sd) : 0;
    return { p, mu, sd, sk };
  }
  function clDistance(w, n) {
    const { p, mu, sd } = popStats(w);
    if (!(sd > 0)) return 1;
    const f = sumDist(p, n), s = sd * Math.sqrt(n);
    let F = 0, d = 0;
    for (let k = 0; k < f.length; k++) { F += f[k]; d = Math.max(d, Math.abs(F - Phi((k + 0.5 - n * mu) / s)), Math.abs(F - f[k] - Phi((k - 0.5 - n * mu) / s))); }
    return d;
  }
  const PRESETS = { gleich: [1, 1, 1, 1, 1], schief: [16, 8, 4, 2, 1, 1], zweigipflig: [5, 1, 0, 1, 5], muenze: [12, 4, 1, 0, 0, 1] };
  LW.widget("zgslabor", {
    mount(host, p, ctx) {
      let w = (p.pop || PRESETS.schief).slice();
      let n = p.n || 1;
      const editable = p.editable !== false;
      const nr = p.nRange || [1, 100];
      if (p.presets !== false) {
        const row = LW.el("div", { class: "w-btns" });
        host.append(row);
        [["gleich", "Gleichverteilt"], ["schief", "Schief"], ["zweigipflig", "Zweigipflig"], ["muenze", "Langer Rand"]].forEach(([id, t]) => K.button(row, t, () => { w = PRESETS[id].slice(); paint(); ctx.changed(); }));
      }
      const W = 360, H1 = 132;
      const svg1 = K.root(host, W, H1, "Grundgesamtheit");
      svg1.style.touchAction = "pan-y";
      const g1 = K.svg("g", null, svg1);
      const sl = K.slider(host, { label: "n", labelHtml: LW.math("n"), min: nr[0], max: nr[1], step: 1, value: n, format: (v) => String(v), onInput: (v) => { n = v; paint(); ctx.changed(); } });
      const H2 = 230;
      const svg2 = K.root(host, W, H2, "Verteilung der standardisierten Summe");
      const g2 = K.svg("g", null, svg2);
      const out = K.readout(host);
      let barX = null, barY = null;
      if (editable) {
        // drag on a bar to set its height
        let active = false;
        const set = (e) => {
          if (!barX) return;
          const q = K.point(svg1, e);
          const i = Math.round(barX.inv(q.x));
          if (i < 0 || i >= w.length) return;
          // the dragged bar gets the probability under the finger; the others keep their proportions
          const v = K.clamp(barY.inv(q.y), 0, 0.98);
          const t = w.reduce((a, b) => a + b, 0) || 1;
          const pr = w.map((x) => x / t), others = 1 - pr[i];
          if (others <= 1e-9) w = pr.map((x, k) => (k === i ? v : (1 - v) / (pr.length - 1)));
          else w = pr.map((x, k) => (k === i ? v : (x * (1 - v)) / others));
          paint(); ctx.changed();
        };
        svg1.addEventListener("pointerdown", (e) => { active = true; try { svg1.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } set(e); });
        svg1.addEventListener("pointermove", (e) => { if (active) set(e); });
        svg1.addEventListener("pointerup", () => { active = false; });
        svg1.addEventListener("pointercancel", () => { active = false; });
      }
      function scope() { const st = popStats(w); return { n, mu: st.mu, sigma: st.sd, skew: st.sk, d: clDistance(w, n), m: w.length - 1 }; }
      function paint() {
        const st = popStats(w);
        // population
        K.clear(g1);
        const m = w.length - 1, L = 34, R = W - 12, T = 10, B = H1 - 22;
        barX = K.scale(-0.6, m + 0.6, L, R);
        const pmax = Math.max(...st.p, 0.05);
        barY = K.scale(0, pmax * 1.1, B, T);
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g1);
        const bw = Math.min(40, (barX(1) - barX(0)) * 0.7);
        st.p.forEach((q, i) => {
          K.svg("rect", { x: barX(i) - bw / 2, y: barY(q), width: bw, height: Math.max(0, B - barY(q)), rx: 4, fill: "var(--orange)", opacity: 0.85 }, g1);
          K.text(g1, barX(i), B + 12, String(i), "s-text");
        });
        K.text(g1, R, T + 2, editable ? "Balken ziehen" : "", "s-text", "end");
        // the standardised sum
        K.clear(g2);
        const L2 = 34, R2 = W - 12, T2 = 10, B2 = H2 - 24;
        const zx = K.scale(-4, 4, L2, R2), zy = K.scale(0, 0.62, B2, T2);
        K.svg("line", { x1: L2, y1: B2, x2: R2, y2: B2, class: "s-axis" }, g2);
        [-3, -2, -1, 0, 1, 2, 3].forEach((t) => K.text(g2, zx(t), B2 + 12, String(t), "s-text"));
        if (st.sd > 0) {
          const f = sumDist(st.p, n), s = st.sd * Math.sqrt(n), wz = 1 / s;
          const pw = Math.max(1, (zx(wz) - zx(0)) * 0.92);
          f.forEach((q, k) => {
            const z = (k - n * st.mu) / s;
            if (z < -4.2 || z > 4.2 || q < 1e-6) return;
            const hgt = q * s;
            K.svg("rect", { x: zx(z) - pw / 2, y: zy(Math.min(0.62, hgt)), width: pw, height: Math.max(0, B2 - zy(Math.min(0.62, hgt))), fill: "var(--accent)", opacity: 0.55 }, g2);
          });
          let d = "";
          for (let i = 0; i <= 160; i++) { const z = -4 + (8 * i) / 160; d += (i ? "L" : "M") + zx(z).toFixed(1) + "," + zy(Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)).toFixed(1); }
          K.svg("path", { d, fill: "none", stroke: "var(--label)", "stroke-width": 2 }, g2);
        }
        const S = scope();
        out.set(LW.esc("Grundgesamtheit: μ = " + K.fmt(S.mu, 3) + ", σ = " + K.fmt(S.sigma, 3) + ", Schiefe " + K.fmt(S.skew, 2)) + "<br>" +
          LW.esc("Summe aus n = " + n + " Ziehungen, standardisiert. Abstand zur Normalverteilung: d = " + K.fmt(S.d, 4)));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (Array.isArray(s.pop)) w = s.pop.slice();
          if (s.n != null) { n = s.n; sl.set(n); }
          paint();
        },
        getVar: (name) => scope()[name],
      };
    },
  });

  LW.labStat = { DISTS, binom, Phi, logC, clDistance, popStats, PRESETS };
})();
