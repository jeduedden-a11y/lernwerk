/* Stochastics and statistics widgets.
 *
 *   lln          law of large numbers: relative frequency and absolute deviation over many trials
 *   bayes        conditional probability with natural frequencies: 1000 people, tree, two-by-two table
 *   expectation  a distribution as a balance: the expected value is where it balances
 *   galton       Galton board and binomial distribution with cumulative probabilities
 *   normal       normal distribution, areas, standardisation, binomial approximation
 *   hypothesis   binomial test: rejection region, significance level, type II error
 *   boxplot      data on a number line with mean, median and boxplot
 *   regression   scatter plot, own line against the least squares line, residual squares
 *
 * Goals are expressions over a scope each widget documents (goal.when, goal.hints, goal.message), like graph.js.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // ------------------------------------------------------------------ helpers

  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    let a = h >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Number or string such as "1/6" or "0,25". */
  function num(v, fallback) {
    if (typeof v === "number") return v;
    if (v == null) return fallback;
    const n = LW.parseNumber(String(v));
    return isFinite(n) ? n : fallback;
  }

  const fill = (str, scope) => (LW.graphTemplate ? LW.graphTemplate(str, scope).replace(/^<p>|<\/p>$/g, "") : LW.esc(str));

  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: fill(h.text, scope) }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: goal.message ? fill(goal.message, scope) : null };
  }

  /** P(X = k) for k = 0..n of the binomial distribution B(n, p), computed in log space. */
  function binomPMF(n, p) {
    const out = new Array(n + 1).fill(0);
    if (p <= 0) { out[0] = 1; return out; }
    if (p >= 1) { out[n] = 1; return out; }
    const lf = [0];
    for (let i = 1; i <= n; i++) lf[i] = lf[i - 1] + Math.log(i);
    const lp = Math.log(p), lq = Math.log(1 - p);
    for (let k = 0; k <= n; k++) out[k] = Math.exp(lf[n] - lf[k] - lf[n - k] + k * lp + (n - k) * lq);
    return out;
  }

  const sum = (arr, from, to) => { let s = 0; for (let i = Math.max(0, from); i <= Math.min(arr.length - 1, to); i++) s += arr[i]; return s; };

  /** Standard normal distribution function, via erf after Abramowitz and Stegun 7.1.26 (error below 1.5e-7). */
  function Phi(z) {
    if (!isFinite(z)) return z > 0 ? 1 : 0;
    const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
    const e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
    return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
  }
  const phi = (z) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);

  const pct = (v, d) => K.fmt(v * 100, d == null ? 1 : d) + " %";
  const signed = (v, d) => (v > 0 ? "+" : v < 0 ? "−" : "") + K.fmt(Math.abs(v), d);
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function gridY(g, y, ticks, L, R, fmt) {
    ticks.forEach((t) => {
      K.svg("line", { x1: L, y1: y(t), x2: R, y2: y(t), class: "s-grid" }, g);
      K.text(g, L - 6, y(t), fmt(t), "s-text", "end");
    });
  }

  // ------------------------------------------------------------------ law of large numbers

  /* params: p (number or "1/6"), pText, event ("Kopf"), unit ("Würfe"), steps [1,10,100,1000], max, view "rel"|"abs",
   *         views (false hides the switch), slider (true: p adjustable)
   * scope:  n, k (hits), h (relative frequency), p, abw (hits - n p) */
  LW.widget("lln", {
    mount(host, p, ctx) {
      const W = 360, H = 242, L = 42, R = W - 14, T = 14, B = H - 38;
      let prob = num(p.p, 0.5);
      let pText = p.pText || K.fmt(prob, 3);
      const what = p.event || "Kopf";
      const unit = p.unit || "Würfe";
      const max = p.max || 5000;
      const rand = seeded(ctx.seed + "|lln");
      let n = 0, hits = 0, path = [0], view = p.view || "rel", locked = false;
      const svg = K.root(host, W, H, "Relative Häufigkeit bei wachsender Zahl von Versuchen");
      const g = K.svg("g", null, svg);
      const btns = LW.el("div", { class: "w-btns" });
      host.append(btns);
      const buttons = (p.steps || [1, 10, 100, 1000]).map((k) => K.button(btns, "+" + K.fmt(k, 0), () => run(k)));
      buttons.push(K.button(btns, "Neu", () => { if (!locked) { reset(); paint(); ctx.changed(); } }));
      if (p.views !== false) {
        K.segmented(host, [{ id: "rel", label: "Relative Häufigkeit" }, { id: "abs", label: "Abweichung in Treffern" }], view, (id) => { view = id; paint(); });
      }
      let slider = null;
      if (p.slider) {
        slider = K.slider(host, { label: "Wahrscheinlichkeit", min: 0.05, max: 0.95, step: 0.05, value: prob, format: (v) => K.fmt(v, 2),
          onInput: (v) => { prob = v; pText = K.fmt(v, 2); reset(); paint(); ctx.changed(); } });
      }
      const out = K.readout(host);

      function reset() { n = 0; hits = 0; path = [0]; }
      function run(k) {
        if (locked) return;
        for (let i = 0; i < k && n < max; i++) { n++; if (rand() < prob) hits++; path.push(hits); }
        paint();
        ctx.changed();
      }
      function line(x, fy) {
        if (n < 1) return;
        let d = "", last = -1;
        for (let i = 1; i <= n; i++) {
          const px = x(Math.log10(i));
          if (i < n && px - last < 0.6) continue;
          last = px;
          d += (d ? "L" : "M") + px.toFixed(1) + "," + fy(i).toFixed(1);
        }
        K.svg("path", { d, class: "s-accent" }, g);
        K.svg("circle", { cx: x(Math.log10(n)), cy: fy(n), r: 4.5, class: "s-accent-fill" }, g);
      }
      function paint() {
        K.clear(g);
        const decades = Math.max(1, Math.ceil(Math.log10(Math.max(10, n))));
        const x = K.scale(0, decades, L, R);
        for (let e = 0; e <= decades; e++) {
          K.svg("line", { x1: x(e), y1: T, x2: x(e), y2: B, class: "s-grid" }, g);
          K.text(g, x(e), B + 12, K.fmt(Math.pow(10, e), 0), "s-text", e === decades ? "end" : "middle");
        }
        K.text(g, R, H - 8, "Anzahl " + unit + " (logarithmisch)", "s-text", "end");
        if (view === "rel") {
          const y = K.scale(0, 1, B, T);
          gridY(g, y, [0, 0.25, 0.5, 0.75, 1], L, R, (t) => K.fmt(t, 2));
          K.svg("line", { x1: L, y1: y(prob), x2: R, y2: y(prob), stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "6 4" }, g);
          K.text(g, R - 2, y(prob) + (prob > 0.8 ? 12 : -10), "p = " + pText, "s-text-strong", "end");
          line(x, (i) => y(path[i] / i));
        } else {
          let m = 3;
          for (let i = 1; i <= n; i++) m = Math.max(m, Math.abs(path[i] - i * prob));
          m = Math.max(m, 1.6 * Math.sqrt(Math.pow(10, decades) * prob * (1 - prob)));
          m = Math.ceil(m * 1.1);
          const y = K.scale(-m, m, B, T);
          gridY(g, y, K.ticks(-m, m, 4), L, R, (t) => signed(t, 0));
          K.svg("line", { x1: L, y1: y(0), x2: R, y2: y(0), stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "6 4" }, g);
          // typical size of the deviation: one standard deviation, sqrt(n p (1 - p))
          for (const s of [1, -1]) {
            let d = "";
            for (let j = 0; j <= 80; j++) {
              const e = (j / 80) * decades;
              d += (j ? "L" : "M") + x(e).toFixed(1) + "," + y(s * Math.sqrt(Math.pow(10, e) * prob * (1 - prob))).toFixed(1);
            }
            K.svg("path", { d, fill: "none", stroke: "var(--label-3)", "stroke-width": 1.5, "stroke-dasharray": "3 4" }, g);
          }
          K.text(g, L + 4, T + 6, "gestrichelt: typische Abweichung √(n·p·(1−p))", "s-text", "start");
          line(x, (i) => y(path[i] - i * prob));
        }
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g);
        K.svg("line", { x1: L, y1: T, x2: L, y2: B, class: "s-axis" }, g);
        if (!n) {
          out.set("Noch kein Versuch. Tippe auf <b>+1</b> oder gleich auf <b>+100</b>.");
        } else {
          const h = hits / n, dev = hits - n * prob;
          out.set("<b>" + K.fmt(n, 0) + " " + LW.esc(unit) + "</b>, davon " + K.fmt(hits, 0) + "-mal " + LW.esc(what) +
            ". Relative Häufigkeit <b>" + K.fmt(h, 3) + "</b>, Abstand zu p: " + K.fmt(Math.abs(h - prob), 3) +
            ". Abweichung in Treffern: <b>" + signed(dev, 1) + "</b>.");
        }
      }
      paint();
      const scope = () => ({ n, k: hits, h: n ? hits / n : 0, p: prob, abw: hits - n * prob });
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const want = goal && goal.solve && goal.solve.n;
          if (want && n < want) run(want - n);
        },
        getVar: (k) => (k === "p" ? prob : k === "n" ? n : NaN),
        setVar(k, v) { if (k === "p") { prob = v; pText = K.fmt(v, 2); if (slider) slider.set(v); reset(); paint(); } },
        act(name, arg) {
          if (name === "run") { const was = locked; locked = false; run(arg || 1); locked = was; }
          if (name === "reset") { reset(); paint(); }
          if (name === "view") { view = arg; paint(); }
        },
        lock() { locked = true; buttons.forEach((b) => { b.disabled = true; }); if (slider) slider.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ Bayes with natural frequencies

  /* params: population (1000), prevalence, sensitivity, specificity (numbers 0..1),
   *         labels {a, na, aN, naN, pos, neg, who}, sliders ["prevalence","sensitivity","specificity"], view, views
   * scope:  prev, sens, spec, post (P(A | positive)), tp, fp, fn, tn, pos, A */
  LW.widget("bayes", {
    mount(host, p, ctx) {
      const W = 360, N = p.population || 1000;
      let prev = num(p.prevalence, 0.01), sens = num(p.sensitivity, 0.9), spec = num(p.specificity, 0.91);
      const lab = Object.assign({ a: "krank", na: "gesund", aN: "Kranke", naN: "Gesunde", pos: "positiv", neg: "negativ", who: "Personen" }, p.labels || {});
      const views = p.views || ["grid", "tree", "table"];
      let view = p.view || views[0], onlyPos = false, locked = false;
      const holder = LW.el("div");
      host.append(holder);
      const names = { grid: K.fmt(N, 0) + " " + lab.who, tree: "Baum", table: "Vierfeldertafel" };
      if (views.length > 1) K.segmented(host, views.map((id) => ({ id, label: names[id] })), view, (id) => { view = id; build(); paint(); });
      const sliders = [];
      const which = p.sliders || ["prevalence", "sensitivity", "specificity"];
      const pf = (v) => K.fmt(v, v < 10 ? 1 : 0) + " %";
      if (which.includes("prevalence")) sliders.push(K.slider(host, { label: "Anteil " + lab.aN, min: 0.1, max: 50, step: 0.1, value: +(prev * 100).toFixed(1), format: pf, onInput: (v) => { prev = v / 100; paint(); ctx.changed(); } }));
      if (which.includes("sensitivity")) sliders.push(K.slider(host, { label: "Sensitivität", min: 50, max: 100, step: 0.5, value: sens * 100, format: pf, onInput: (v) => { sens = v / 100; paint(); ctx.changed(); } }));
      if (which.includes("specificity")) sliders.push(K.slider(host, { label: "Spezifität", min: 50, max: 100, step: 0.5, value: spec * 100, format: pf, onInput: (v) => { spec = v / 100; paint(); ctx.changed(); } }));
      const out = K.readout(host);

      function counts() {
        const A = Math.round(N * prev), Hh = N - A;
        const tp = Math.round(A * sens), fp = Math.round(Hh * (1 - spec));
        const den = prev * sens + (1 - prev) * (1 - spec);
        return { A, H: Hh, tp, fn: A - tp, fp, tn: Hh - fp, pos: tp + fp, post: den > 0 ? (prev * sens) / den : 0 };
      }

      let svg = null, dots = [], toggle = null;
      function build() {
        holder.innerHTML = "";
        dots = [];
        toggle = null;
        if (view === "grid") {
          const cols = 40, cell = (W - 16) / cols, rows = Math.ceil(N / cols);
          const H = rows * cell + 44;
          svg = K.root(holder, W, H, "Natürliche Häufigkeiten");
          for (let i = 0; i < N; i++) {
            const cx = 8 + (i % cols) * cell + cell / 2, cy = 6 + Math.floor(i / cols) * cell + cell / 2;
            dots.push(K.svg("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: (cell * 0.38).toFixed(2) }, svg));
          }
          const ly = rows * cell + 22;
          [["var(--red)", lab.aN + ", " + lab.pos, 8], ["var(--orange)", lab.naN + ", " + lab.pos, 186]].forEach(([c, t, x0]) => {
            K.svg("circle", { cx: x0 + 5, cy: ly, r: 5, fill: c }, svg);
            K.text(svg, x0 + 15, ly, t, "s-text", "start");
          });
          [["none", lab.aN + ", " + lab.neg, 8, "var(--red)"], ["var(--fill-2)", lab.naN + ", " + lab.neg, 186, "none"]].forEach(([c, t, x0, st]) => {
            K.svg("circle", { cx: x0 + 5, cy: ly + 16, r: 4.4, fill: c, stroke: st, "stroke-width": 1.4 }, svg);
            K.text(svg, x0 + 15, ly + 16, t, "s-text", "start");
          });
          const row = LW.el("div", { class: "w-btns" });
          holder.append(row);
          toggle = K.button(row, "Nur positive Tests zeigen", () => { onlyPos = !onlyPos; toggle.classList.toggle("on", onlyPos); paint(); });
          toggle.classList.toggle("on", onlyPos);
        } else {
          svg = K.root(holder, W, view === "tree" ? 236 : 170, view === "tree" ? "Baumdiagramm" : "Vierfeldertafel");
        }
      }

      function paintGrid(c) {
        for (let i = 0; i < N; i++) {
          let fillC, stroke = "none", dim = false;
          if (i < c.tp) fillC = "var(--red)";
          else if (i < c.A) { fillC = "none"; stroke = "var(--red)"; dim = true; }
          else if (i < c.A + c.fp) fillC = "var(--orange)";
          else { fillC = "var(--fill-2)"; dim = true; }
          const d = dots[i];
          d.setAttribute("fill", fillC);
          d.setAttribute("stroke", stroke);
          d.setAttribute("stroke-width", stroke === "none" ? 0 : 1.2);
          d.setAttribute("opacity", onlyPos && dim ? 0.12 : 1);
        }
      }

      function node(x, y, label, count, cls) {
        K.svg("rect", { x: x - 42, y: y - 15, width: 84, height: 30, rx: 9, fill: cls || "var(--fill)" }, svg);
        K.text(svg, x, y - 4, label, "s-text", "middle");
        K.text(svg, x, y + 8, K.fmt(count, 0), "s-text-strong", "middle");
      }
      function edge(x1, y1, x2, y2, prob) {
        K.svg("line", { x1, y1, x2, y2, class: "s-axis", "stroke-width": 1.6 }, svg);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        K.svg("rect", { x: mx - 23, y: my - 9, width: 46, height: 18, rx: 6, fill: "var(--card-solid)" }, svg);
        K.text(svg, mx, my, pct(prob, prob < 0.1 ? 1 : 0), "s-text", "middle");
      }
      function paintTree(c) {
        K.clear(svg);
        const x0 = 44, x1 = 176, x2 = 312;
        edge(x0 + 30, 118, x1 - 42, 62, prev);
        edge(x0 + 30, 118, x1 - 42, 174, 1 - prev);
        edge(x1 + 42, 62, x2 - 42, 28, sens);
        edge(x1 + 42, 62, x2 - 42, 92, 1 - sens);
        edge(x1 + 42, 174, x2 - 42, 144, 1 - spec);
        edge(x1 + 42, 174, x2 - 42, 208, spec);
        K.svg("rect", { x: x0 - 34, y: 103, width: 68, height: 30, rx: 9, fill: "var(--fill)" }, svg);
        K.text(svg, x0, 118, K.fmt(N, 0), "s-text-strong");
        node(x1, 62, lab.a, c.A);
        node(x1, 174, lab.na, c.H);
        node(x2, 28, lab.pos, c.tp, "color-mix(in srgb, var(--red) 22%, transparent)");
        node(x2, 92, lab.neg, c.fn);
        node(x2, 144, lab.pos, c.fp, "color-mix(in srgb, var(--orange) 26%, transparent)");
        node(x2, 208, lab.neg, c.tn);
      }
      function paintTable(c) {
        K.clear(svg);
        const cx = [62, 152, 242, 318], cy = [22, 62, 102, 142], w = [104, 84, 84, 72];
        K.svg("rect", { x: cx[1] - 42, y: 4, width: 84, height: 156, rx: 10, fill: "color-mix(in srgb, var(--accent) 12%, transparent)" }, svg);
        const cells = [
          ["", lab.pos, lab.neg, "Summe"],
          [lab.a, c.tp, c.fn, c.A],
          [lab.na, c.fp, c.tn, c.H],
          ["Summe", c.pos, c.fn + c.tn, N],
        ];
        cells.forEach((row, r) => row.forEach((v, k) => {
          if (r > 0 && r < 3 && k > 0 && k < 3) K.svg("rect", { x: cx[k] - w[k] / 2 + 6, y: cy[r] - 15, width: w[k] - 12, height: 30, rx: 8, fill: "var(--fill)" }, svg);
          K.text(svg, cx[k], cy[r], typeof v === "number" ? K.fmt(v, 0) : v, r === 0 || k === 0 ? "s-text" : "s-text-strong");
        }));
        K.svg("line", { x1: 10, y1: 42, x2: W - 10, y2: 42, class: "s-grid" }, svg);
        K.svg("line", { x1: 10, y1: 122, x2: W - 10, y2: 122, class: "s-grid" }, svg);
      }

      function paint() {
        const c = counts();
        if (view === "grid") paintGrid(c);
        else if (view === "tree") paintTree(c);
        else paintTable(c);
        const cap = lab.pos.charAt(0).toUpperCase() + lab.pos.slice(1);
        out.set("Von " + K.fmt(N, 0) + " " + LW.esc(lab.who) + " sind <b>" + c.A + "</b> " + LW.esc(lab.a) + ". " + LW.esc(cap) + " testen <b>" + c.tp +
          "</b> " + LW.esc(lab.aN) + " und <b>" + c.fp + "</b> " + LW.esc(lab.naN) + ", zusammen " + c.pos + ".<br>Bei positivem Test " + LW.esc(lab.a) +
          ": " + c.tp + " von " + c.pos + ", also <b>" + (c.pos ? pct(c.tp / c.pos) : "–") + "</b>.");
      }
      function syncSliders() {
        sliders.forEach((sl) => {
          const label = sl.el.querySelector("label").textContent;
          sl.set(label.startsWith("Anteil") ? prev * 100 : label === "Sensitivität" ? sens * 100 : spec * 100);
        });
      }
      build();
      paint();
      const scope = () => { const c = counts(); return { prev, sens, spec, post: c.post, tp: c.tp, fp: c.fp, fn: c.fn, tn: c.tn, pos: c.pos, A: c.A }; };
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (!s) return;
          if (s.prev != null) prev = s.prev;
          if (s.sens != null) sens = s.sens;
          if (s.spec != null) spec = s.spec;
          syncSliders();
          paint();
        },
        getVar: (k) => ({ prev, sens, spec })[k],
        setVar(k, v) {
          if (k === "prev") prev = K.clamp(v, 0, 1);
          if (k === "sens") sens = K.clamp(v, 0, 1);
          if (k === "spec") spec = K.clamp(v, 0, 1);
          syncSliders();
          paint();
        },
        act(name, arg) {
          if (name === "view" && views.includes(arg)) { view = arg; build(); paint(); }
          if (name === "onlyPos") { onlyPos = !!arg; if (toggle) toggle.classList.toggle("on", onlyPos); paint(); }
        },
        lock() { locked = true; sliders.forEach((s) => s.disable(true)); },
      };
    },
  });

  // ------------------------------------------------------------------ expectation as a balance

  /* params: values [x], probs [p or "1/6"], range [lo, hi], drag "fulcrum"|"value", dragIndex, snap, fulcrum,
   *         target (value mode: where the pivot sits), unit, xLabel, showSigma
   * scope:  f (pivot), E, T (E - f), V, sigma, x (dragged value), target, tol */
  LW.widget("expectation", {
    mount(host, p, ctx) {
      const W = 360, H = 236;
      const xs = (p.values || [0, 1]).map((v) => num(v, 0));
      const ps = (p.probs || xs.map(() => 1 / xs.length)).map((v) => num(v, 0));
      const pLab = (p.probs || ps).map((v) => (typeof v === "string" ? v : K.fmt(v, 3)));
      const lo = p.range ? p.range[0] : Math.min(...xs) - 1, hi = p.range ? p.range[1] : Math.max(...xs) + 1;
      const mode = p.drag || "fulcrum";
      const di = p.dragIndex != null ? p.dragIndex : xs.length - 1;
      const snap = p.snap || (mode === "value" ? 0.5 : (hi - lo) / 100);
      const tol = p.tolerance || (hi - lo) / 100 + 1e-9;
      const unit = p.unit ? " " + p.unit : "";
      const target = num(p.target, 0);
      let f = p.fulcrum != null ? num(p.fulcrum, lo) : mode === "value" ? target : lo + (hi - lo) * 0.2;
      let locked = false, revealed = false;
      const x = K.scale(lo, hi, 26, W - 26);
      const beamY = 160, barMax = 104, pmax = Math.max(...ps, 1e-6);
      const svg = K.root(host, W, H, "Wahrscheinlichkeitsverteilung als Waage");
      K.svg("line", { x1: 10, y1: beamY + 34, x2: W - 10, y2: beamY + 34, class: "s-axis" }, svg);
      const beam = K.svg("g", null, svg);
      const front = K.svg("g", null, svg);
      K.svg("rect", { x: x(lo) - 12, y: beamY - 4, width: x(hi) - x(lo) + 24, height: 8, rx: 4, fill: "var(--label-2)" }, beam);
      K.ticks(lo, hi, 10).forEach((t) => K.svg("line", { x1: x(t), y1: beamY + 4, x2: x(t), y2: beamY + 9, class: "s-axis" }, beam));
      const bars = xs.map((v, i) => {
        const g = K.svg("g", null, beam);
        const h = (barMax * ps[i]) / pmax;
        const rect = K.svg("rect", { y: beamY - 4 - h, width: 18, height: h, rx: 4, fill: mode === "value" && i === di ? "var(--orange)" : "var(--accent)" }, g);
        const pt = K.text(g, 0, beamY - 14 - h, pLab[i], "s-text", "middle");
        const vt = K.text(g, 0, beamY + 20, "", "s-text-strong", "middle");
        let hit = null;
        if (mode === "value" && i === di) {
          hit = K.svg("rect", { y: beamY - 20 - h, width: 44, height: h + 44, class: "s-hit" }, g);
          K.drag(svg, hit, (q) => { if (locked) return; xs[di] = K.clamp(K.snap(x.inv(q.x), snap), lo, hi); paint(); ctx.changed(); });
        }
        return { rect, pt, vt, hit };
      });
      const pivot = K.svg("path", { fill: "var(--label)", opacity: 0.85 }, front);
      const pivotHit = K.svg("rect", { y: beamY, width: 56, height: 40, class: "s-hit" }, front);
      if (mode === "fulcrum") {
        K.drag(svg, pivotHit, (q) => { if (locked) return; f = K.clamp(K.snap(x.inv(q.x), snap), lo, hi); paint(); ctx.changed(); });
      } else {
        pivotHit.style.display = "none";
      }
      const marks = K.svg("g", null, svg);
      const out = K.readout(host);

      const E = () => xs.reduce((s, v, i) => s + v * ps[i], 0);
      const V = () => { const e = E(); return xs.reduce((s, v, i) => s + (v - e) * (v - e) * ps[i], 0); };

      function paint() {
        const e = E(), v = V(), sd = Math.sqrt(v);
        const t = e - f;
        const balanced = Math.abs(t) <= tol;
        const angle = balanced ? 0 : K.clamp((t * 14) / ((hi - lo) / 6), -14, 14);
        beam.setAttribute("transform", "rotate(" + angle.toFixed(2) + " " + x(f).toFixed(1) + " " + beamY + ")");
        // bars on the same value stand side by side, the value label once
        const seen = {};
        xs.forEach((val, i) => {
          const key = val.toFixed(6);
          const same = xs.filter((v) => v.toFixed(6) === key).length;
          const nth = seen[key] || 0;
          seen[key] = nth + 1;
          const cx = x(val) + (nth - (same - 1) / 2) * 20;
          const b = bars[i];
          b.rect.setAttribute("x", cx - 9);
          b.pt.setAttribute("x", cx);
          b.vt.setAttribute("x", x(val));
          b.vt.textContent = nth === 0 ? K.fmt(val, 2) : "";
          if (b.hit) b.hit.setAttribute("x", cx - 22);
        });
        const px = x(f);
        pivot.setAttribute("d", "M" + px + "," + (beamY + 4) + " L" + (px - 15) + "," + (beamY + 34) + " L" + (px + 15) + "," + (beamY + 34) + " Z");
        pivot.setAttribute("fill", balanced ? "var(--green)" : "var(--label)");
        pivotHit.setAttribute("x", px - 28);
        K.clear(marks);
        const showMean = mode === "value" || balanced || revealed;
        if (showMean && (p.showSigma || balanced || revealed)) {
          const y0 = beamY + 50;
          const a = x(K.clamp(e - sd, lo, hi)), b = x(K.clamp(e + sd, lo, hi));
          K.svg("line", { x1: a, y1: y0, x2: b, y2: y0, stroke: "var(--orange)", "stroke-width": 2.5 }, marks);
          K.svg("line", { x1: a, y1: y0 - 6, x2: a, y2: y0 + 6, stroke: "var(--orange)", "stroke-width": 2.5 }, marks);
          K.svg("line", { x1: b, y1: y0 - 6, x2: b, y2: y0 + 6, stroke: "var(--orange)", "stroke-width": 2.5 }, marks);
          K.text(marks, (a + b) / 2, y0 + 14, "E(X) ± σ", "s-text", "middle");
        }
        if (mode === "fulcrum") {
          if (balanced || revealed) {
            out.set(K.pill(true, "im Gleichgewicht") + " Drehpunkt = <b>E(X) = " + K.fmt(e, 3) + unit + "</b>. Varianz " + K.fmt(v, 3) + ", Standardabweichung σ = " + K.fmt(sd, 3) + unit + ".");
          } else {
            out.set("Drehpunkt bei <b>" + K.fmt(f, 2) + "</b>. Summe der Momente Σ P(X = x)·(x − " + K.fmt(f, 2) + ") = <b>" + signed(t, 3) + "</b>: Die Waage kippt nach " + (t > 0 ? "rechts" : "links") + ".");
          }
        } else {
          const fair = Math.abs(e - target) <= tol;
          out.set("E(X) = Σ x·P(X = x) = <b>" + K.fmt(e, 3) + unit + "</b>" + (fair ? " " + K.pill(true, p.targetText || "fair") : "") + ". σ = " + K.fmt(sd, 3) + unit + ".");
        }
      }
      paint();
      const scope = () => { const e = E(), v = V(); return { f, E: e, T: e - f, V: v, sigma: Math.sqrt(v), x: xs[di], target, tol }; };
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          if (goal && goal.solve && goal.solve.f != null) f = goal.solve.f;
          else if (mode === "fulcrum") f = E();
          if (goal && goal.solve && goal.solve.x != null) xs[di] = goal.solve.x;
          revealed = !goal || !goal.solve || goal.solve.reveal !== false;
          paint();
        },
        getVar: (k) => (k === "f" ? f : k === "x" ? xs[di] : NaN),
        setVar(k, v) { if (k === "f") f = K.clamp(v, lo, hi); if (k === "x") xs[di] = K.clamp(v, lo, hi); paint(); },
        act(name, arg) { if (name === "reveal") { revealed = !!arg; paint(); } },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ Galton board and binomial distribution

  /* params: modes ["board","histogram"], mode, rows (board), n, p, k, rel "eq"|"le"|"ge", nMax, sliders (["n","p","k"])
   * scope:  n, p, k, rel (0 eq, 1 le, 2 ge), mu, sigma, P, balls, mean (sample mean on the board) */
  LW.widget("galton", {
    mount(host, p, ctx) {
      const W = 360;
      const modes = p.modes || ["board", "histogram"];
      let mode = p.mode || modes[0];
      const rows = p.rows || 8;
      let n = p.n || rows, prob = num(p.p, 0.5), k = p.k != null ? p.k : Math.round(n * prob), rel = p.rel || "le";
      const nMax = p.nMax || 50;
      const rand = seeded(ctx.seed + "|galton");
      let counts = new Array(rows + 1).fill(0), balls = 0, flying = 0, locked = false, raf = 0;
      const holder = LW.el("div");
      host.append(holder);
      const ctrl = LW.el("div");
      host.append(ctrl);
      if (modes.length > 1) K.segmented(host, modes.map((id) => ({ id, label: id === "board" ? "Galtonbrett" : "Verteilung" })), mode, (id) => { mode = id; build(); });
      const out = K.readout(host);

      // ---- board
      let svg, binG, ballG, geo;
      function buildBoard() {
        const dx = Math.min(30, (W - 40) / (rows + 1)), rowH = dx * 0.8, top = 18;
        const pegBottom = top + 10 + (rows - 1) * rowH;
        const H = pegBottom + 150;
        svg = K.root(holder, W, H, "Galtonbrett");
        geo = { dx, rowH, top, pegBottom, H, binTop: pegBottom + 22, binBottom: H - 22 };
        for (let r = 0; r < rows; r++) {
          for (let j = 0; j <= r; j++) K.svg("circle", { cx: W / 2 + (j - r / 2) * dx, cy: top + 10 + r * rowH, r: 3.2, fill: "var(--label-2)" }, svg);
        }
        for (let b = 0; b <= rows + 1; b++) {
          const bx = W / 2 + (b - rows / 2 - 0.5) * dx;
          K.svg("line", { x1: bx, y1: geo.binTop, x2: bx, y2: geo.binBottom, class: "s-grid" }, svg);
        }
        K.svg("line", { x1: W / 2 - (rows / 2 + 0.5) * dx, y1: geo.binBottom, x2: W / 2 + (rows / 2 + 0.5) * dx, y2: geo.binBottom, class: "s-axis" }, svg);
        if (dx >= 14) for (let b = 0; b <= rows; b++) K.text(svg, W / 2 + (b - rows / 2) * dx, geo.binBottom + 11, String(b), "s-text");
        binG = K.svg("g", null, svg);
        ballG = K.svg("g", null, svg);
        ctrl.innerHTML = "";
        const row = LW.el("div", { class: "w-btns" });
        ctrl.append(row);
        [1, 10, 100].forEach((m) => K.button(row, "+" + m + (m === 1 ? " Kugel" : " Kugeln"), () => drop(m)));
        K.button(row, "Leeren", () => { if (locked) return; counts = new Array(rows + 1).fill(0); balls = 0; K.clear(ballG); paintBins(); ctx.changed(); });
      }
      function paintBins() {
        K.clear(binG);
        const pmf = binomPMF(rows, prob);
        const total = balls;
        const expMax = Math.max(...pmf) * Math.max(total, 1);
        const top = Math.max(1, ...counts, expMax);
        const hmax = geo.binBottom - geo.binTop - 6;
        let d = "";
        for (let b = 0; b <= rows; b++) {
          const cx = W / 2 + (b - rows / 2) * geo.dx, w = geo.dx - 4;
          const h = (hmax * counts[b]) / top;
          if (h > 0) K.svg("rect", { x: cx - w / 2, y: geo.binBottom - h, width: w, height: h, rx: 3, fill: "var(--accent)" }, binG);
          if (total > 0) {
            const eh = (hmax * pmf[b] * total) / top;
            d += (b ? "L" : "M") + (cx - w / 2) + "," + (geo.binBottom - eh) + "L" + (cx + w / 2) + "," + (geo.binBottom - eh);
          }
        }
        if (d) K.svg("path", { d, fill: "none", stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "5 3" }, binG);
        const mean = balls ? counts.reduce((s, c, i) => s + c * i, 0) / balls : 0;
        out.set(balls ? "<b>" + K.fmt(balls, 0) + " Kugeln</b>. Mittlere Fachnummer " + K.fmt(mean, 2) + ", erwartet n·p = " + K.fmt(rows * prob, 2) +
          ". Gestrichelt: was die Binomialverteilung B(" + rows + "; " + K.fmt(prob, 2) + ") vorhersagt."
          : "Jede Kugel prallt an " + rows + " Nägeln ab, jeweils mit Wahrscheinlichkeit " + K.fmt(prob, 2) + " nach rechts. Die Fachnummer zählt die Rechts-Abpraller.");
      }
      function path() {
        const pts = [[W / 2, geo.top - 6]];
        let right = 0, cx = W / 2;
        for (let r = 0; r < rows; r++) {
          const go = rand() < prob;
          if (go) right++;
          cx += (go ? 0.5 : -0.5) * geo.dx;
          pts.push([cx, geo.top + 10 + r * geo.rowH + geo.rowH * 0.5]);
        }
        pts.push([cx, geo.binBottom - 8]);
        return { pts, bin: right };
      }
      function drop(m) {
        if (locked || mode !== "board") return;
        const animate = reduceMotion() ? 0 : Math.min(m, 12);
        for (let i = animate; i < m; i++) { counts[path().bin]++; balls++; }
        const now = performance.now();
        for (let i = 0; i < animate; i++) {
          const b = path();
          const el = K.svg("circle", { r: 4.6, fill: "var(--orange)", cx: b.pts[0][0], cy: b.pts[0][1] }, ballG);
          flying++;
          fly.push({ b, el, t0: now + i * 90 });
        }
        if (!raf && fly.length) raf = requestAnimationFrame(step);
        paintBins();
        ctx.changed();
      }
      const fly = [];
      function step(now) {
        const seg = 55;
        for (let i = fly.length - 1; i >= 0; i--) {
          const f = fly[i];
          const t = (now - f.t0) / seg;
          if (t < 0) continue;
          const pts = f.b.pts;
          if (t >= pts.length - 1) {
            f.el.remove();
            counts[f.b.bin]++;
            balls++;
            flying--;
            fly.splice(i, 1);
            paintBins();
            continue;
          }
          const s = Math.floor(t), u = t - s;
          f.el.setAttribute("cx", (pts[s][0] + (pts[s + 1][0] - pts[s][0]) * u).toFixed(1));
          f.el.setAttribute("cy", (pts[s][1] + (pts[s + 1][1] - pts[s][1]) * u).toFixed(1));
        }
        raf = fly.length ? requestAnimationFrame(step) : 0;
      }

      // ---- histogram
      let sN = null, sP = null, sK = null, kHost = null;
      function buildHist() {
        svg = K.root(holder, W, 236, "Binomialverteilung");
        ctrl.innerHTML = "";
        const want = p.sliders || ["n", "p", "k"];
        if (want.includes("n")) sN = K.slider(ctrl, { label: "n", min: 1, max: nMax, step: 1, value: n, format: (v) => K.fmt(v, 0), onInput: (v) => { n = v; if (k > n) k = n; makeK(); paintHist(); ctx.changed(); } });
        if (want.includes("p")) sP = K.slider(ctrl, { label: "p", min: 0, max: 1, step: 0.01, value: prob, format: (v) => K.fmt(v, 2), onInput: (v) => { prob = v; paintHist(); ctx.changed(); } });
        kHost = LW.el("div");
        ctrl.append(kHost);
        makeK();
        K.segmented(ctrl, [{ id: "eq", label: "P(X = k)" }, { id: "le", label: "P(X ≤ k)" }, { id: "ge", label: "P(X ≥ k)" }], rel, (id) => { rel = id; paintHist(); ctx.changed(); });
      }
      function makeK() {
        if (!kHost) return;
        kHost.innerHTML = "";
        sK = K.slider(kHost, { label: "k", min: 0, max: n, step: 1, value: k, format: (v) => K.fmt(v, 0), onInput: (v) => { k = v; paintHist(); ctx.changed(); } });
      }
      function selectedP(pmf) {
        if (rel === "eq") return pmf[k] || 0;
        if (rel === "le") return sum(pmf, 0, k);
        return sum(pmf, k, n);
      }
      function paintHist() {
        K.clear(svg);
        const H = 236, L = 44, R = W - 10, T = 14, B = H - 30;
        const pmf = binomPMF(n, prob);
        const top = Math.max(...pmf) * 1.15 || 1;
        const x = K.scale(-0.5, n + 0.5, L, R), y = K.scale(0, top, B, T);
        gridY(svg, y, K.ticks(0, top, 4), L, R, (t) => K.fmt(t, 2));
        const mu = n * prob, sd = Math.sqrt(n * prob * (1 - prob));
        if (sd > 0) K.svg("rect", { x: x(Math.max(-0.5, mu - sd)), y: T, width: x(Math.min(n + 0.5, mu + sd)) - x(Math.max(-0.5, mu - sd)), height: B - T, fill: "var(--accent-soft)" }, svg);
        const bw = Math.max(1, (R - L) / (n + 1) - (n > 30 ? 1 : 2));
        for (let i = 0; i <= n; i++) {
          const on = rel === "eq" ? i === k : rel === "le" ? i <= k : i >= k;
          const h = B - y(pmf[i]);
          K.svg("rect", { x: x(i) - bw / 2, y: B - h, width: bw, height: Math.max(0, h), rx: Math.min(3, bw / 3), fill: on ? "var(--accent)" : "var(--fill-2)" }, svg);
        }
        K.svg("line", { x1: x(mu), y1: T, x2: x(mu), y2: B, stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
        K.text(svg, x(mu), T + 2, "μ", "s-text-strong", "middle");
        K.ticks(0, n, Math.min(n, 8)).filter((t) => Number.isInteger(t)).forEach((t) => K.text(svg, x(t), B + 12, String(t)));
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, svg);
        const P = selectedP(pmf);
        const sym = rel === "eq" ? "=" : rel === "le" ? "≤" : "≥";
        out.set("B(" + n + "; " + K.fmt(prob, 2) + "): μ = n·p = <b>" + K.fmt(mu, 2) + "</b>, σ = √(n·p·(1−p)) = <b>" + K.fmt(sd, 3) +
          "</b>.<br>P(X " + sym + " " + k + ") = <b>" + K.fmt(P, 4) + "</b>. Der helle Streifen ist μ ± σ.");
      }

      function build() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        fly.forEach((f) => { counts[f.b.bin]++; balls++; });
        fly.length = 0;
        flying = 0;
        holder.innerHTML = "";
        sN = sP = sK = kHost = null;
        if (mode === "board") { buildBoard(); paintBins(); } else { buildHist(); paintHist(); }
      }
      build();
      const scope = () => {
        const pmf = binomPMF(n, prob);
        const mean = balls ? counts.reduce((s, c, i) => s + c * i, 0) / balls : 0;
        return { n, p: prob, k, rel: rel === "eq" ? 0 : rel === "le" ? 1 : 2, mu: n * prob, sigma: Math.sqrt(n * prob * (1 - prob)), P: selectedP(pmf), balls: balls + flying, mean };
      };
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (!s) return;
          if (s.n != null) n = s.n;
          if (s.p != null) prob = s.p;
          if (s.k != null) k = s.k;
          if (s.rel) rel = s.rel;
          if (s.balls && mode === "board" && balls < s.balls) drop(s.balls - balls);
          if (mode === "histogram") build();
        },
        getVar: (name) => ({ n, p: prob, k })[name],
        setVar(name, v) {
          if (name === "n") { n = K.clamp(Math.round(v), 1, nMax); if (k > n) k = n; }
          if (name === "p") prob = K.clamp(v, 0, 1);
          if (name === "k") k = K.clamp(Math.round(v), 0, n);
          if (mode === "histogram") {
            if (sN) sN.set(n);
            if (sP) sP.set(prob);
            if (name === "n") makeK(); else if (sK) sK.set(k);
            paintHist();
          } else paintBins();
        },
        act(name, arg) {
          if (name === "drop") { const was = locked; locked = false; drop(arg || 1); locked = was; }
          if (name === "clear") { counts = new Array(rows + 1).fill(0); balls = 0; if (ballG) K.clear(ballG); if (mode === "board") paintBins(); }
          if (name === "mode" && modes.includes(arg)) { mode = arg; build(); }
          if (name === "rel") { rel = arg; if (mode === "histogram") paintHist(); }
        },
        leave() { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
        lock() {
          locked = true;
          [sN, sP, sK].forEach((s) => s && s.disable(true));
          host.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        },
      };
    },
  });

  // ------------------------------------------------------------------ normal distribution

  /* params: mu, sigma, x [min,max], a, b, show "between"|"left"|"right", muRange, sigmaRange, snap, rule, z,
   *         binomial {n, p, nRange} (bars of B(n,p) with the matching normal curve)
   * scope:  mu, sigma, a, b, P, za, zb, n, p, exact (binomial probability for a..b) */
  LW.widget("normal", {
    mount(host, p, ctx) {
      const W = 360;
      const bin = p.binomial || null;
      let bn = bin ? bin.n : 0, bp = bin ? num(bin.p, 0.5) : 0;
      let mu = bin ? bn * bp : num(p.mu, 0), sd = bin ? Math.sqrt(bn * bp * (1 - bp)) : num(p.sigma, 1);
      // with a binomial overlay the window follows n and p; otherwise it stays put, so a larger σ visibly flattens the curve
      const viewRange = () => (bin ? [Math.max(-0.5, Math.floor(mu - 4.2 * sd)), Math.min(bn + 0.5, Math.ceil(mu + 4.2 * sd))] : p.x || [mu - 4 * sd, mu + 4 * sd]);
      let xr = viewRange();
      const show = p.show || "between";
      let a = show === "left" ? -Infinity : num(p.a, mu - sd), b = show === "right" ? Infinity : num(p.b, mu + sd);
      const snap = p.snap || (bin ? 1 : (xr[1] - xr[0]) / 100);
      const sdMin = p.sigmaRange ? p.sigmaRange[0] : sd;
      const ymax = p.yMax || (1.12 * phi(0)) / sdMin;
      const H = p.z ? 252 : 226, L = 36, R = W - 12, T = 14, B = H - (p.z ? 56 : 30);
      let x = K.scale(xr[0], xr[1], L, R);
      let y = K.scale(0, ymax, B, T);
      let locked = false;
      const svg = K.root(host, W, H, "Normalverteilung");
      const back = K.svg("g", null, svg), front = K.svg("g", null, svg);
      const handles = {};
      function handle(name) {
        const g = K.svg("g", null, svg);
        const line = K.svg("line", { y1: T, y2: B, stroke: "var(--accent)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, g);
        const c = K.svg("circle", { cy: B, r: 8, class: "s-handle" }, g);
        const lab = K.text(g, 0, T + 2, name, "s-text-strong", "middle");
        const hit = K.svg("rect", { y: T, width: 36, height: B - T + 14, class: "s-hit" }, g);
        K.drag(svg, hit, (q) => {
          if (locked) return;
          const v = K.clamp(K.snap(x.inv(q.x), snap), xr[0], xr[1]);
          if (name === "a") a = Math.min(v, b === Infinity ? v : b); else b = Math.max(v, a === -Infinity ? v : a);
          paint();
          ctx.changed();
        });
        handles[name] = { g, line, c, lab, hit };
      }
      if (show !== "left") handle("a");
      if (show !== "right") handle("b");
      const sliders = [];
      if (bin) {
        const nr = bin.nRange || [5, 100];
        sliders.push(K.slider(host, { label: "n", min: nr[0], max: nr[1], step: 1, value: bn, format: (v) => K.fmt(v, 0), onInput: (v) => { bn = v; mu = bn * bp; sd = Math.sqrt(bn * bp * (1 - bp)); paint(); ctx.changed(); } }));
        sliders.push(K.slider(host, { label: "p", min: 0.05, max: 0.95, step: 0.01, value: bp, format: (v) => K.fmt(v, 2), onInput: (v) => { bp = v; mu = bn * bp; sd = Math.sqrt(bn * bp * (1 - bp)); paint(); ctx.changed(); } }));
      } else {
        if (p.muRange) sliders.push(K.slider(host, { label: "μ", min: p.muRange[0], max: p.muRange[1], step: p.muStep || snap, value: mu, format: (v) => K.fmt(v, 2), onInput: (v) => { mu = v; paint(); ctx.changed(); } }));
        if (p.sigmaRange) sliders.push(K.slider(host, { label: "σ", min: p.sigmaRange[0], max: p.sigmaRange[1], step: p.sigmaStep || 0.1, value: sd, format: (v) => K.fmt(v, 2), onInput: (v) => { sd = v; paint(); ctx.changed(); } }));
      }
      const out = K.readout(host);

      function exact() {
        if (!bin) return NaN;
        const pmf = binomPMF(bn, bp);
        return sum(pmf, a === -Infinity ? 0 : Math.ceil(a - 1e-9), b === Infinity ? bn : Math.floor(b + 1e-9));
      }
      // with bars, each integer k stands for [k - 0.5, k + 0.5]: continuity correction
      const cc = bin ? 0.5 : 0;
      const prob = () => Phi((b + cc - mu) / sd) - Phi((a - cc - mu) / sd);

      function paint() {
        K.clear(back);
        K.clear(front);
        if (bin) {
          xr = viewRange();
          x = K.scale(xr[0], xr[1], L, R);
          y = K.scale(0, 1.15 * Math.max(...binomPMF(bn, bp), phi(0) / sd), B, T);
          if (a !== -Infinity) a = K.clamp(a, Math.ceil(xr[0]), Math.floor(xr[1]));
          if (b !== Infinity) b = K.clamp(b, Math.max(a === -Infinity ? xr[0] : a, Math.ceil(xr[0])), Math.floor(xr[1]));
        }
        K.ticks(xr[0], xr[1], 6).forEach((t) => {
          K.svg("line", { x1: x(t), y1: T, x2: x(t), y2: B, class: "s-grid" }, back);
          K.text(back, x(t), B + 12, K.fmt(t, 2));
        });
        if (p.rule) {
          [1, 2, 3].forEach((m) => [-1, 1].forEach((s) => {
            const v = mu + s * m * sd;
            if (v < xr[0] || v > xr[1]) return;
            K.svg("line", { x1: x(v), y1: y(phi(m) / sd), x2: x(v), y2: B, stroke: "var(--label-3)", "stroke-width": 1.2 }, back);
          }));
        }
        if (bin) {
          const pmf = binomPMF(bn, bp);
          const w = Math.max(1, x(1) - x(0) - 1);
          for (let i = 0; i <= bn; i++) {
            if (i < xr[0] - 1 || i > xr[1] + 1) continue;
            const inside = i >= a - 1e-9 && i <= b + 1e-9;
            K.svg("rect", { x: x(i - 0.5) + 0.5, y: y(pmf[i]), width: w, height: Math.max(0, B - y(pmf[i])), fill: inside ? "color-mix(in srgb, var(--accent) 38%, transparent)" : "var(--fill-2)" }, back);
          }
        }
        const f = (v) => phi((v - mu) / sd) / sd;
        const lo = Math.max(a, xr[0]), hi = Math.min(b, xr[1]);
        if (hi > lo && !bin) {
          let d = "M" + x(lo).toFixed(1) + "," + B;
          for (let i = 0; i <= 90; i++) { const v = lo + ((hi - lo) * i) / 90; d += "L" + x(v).toFixed(1) + "," + y(f(v)).toFixed(1); }
          d += "L" + x(hi).toFixed(1) + "," + B + "Z";
          K.svg("path", { d, fill: "var(--accent)", opacity: 0.3 }, front);
        }
        let d = "";
        for (let i = 0; i <= 180; i++) { const v = xr[0] + ((xr[1] - xr[0]) * i) / 180; d += (i ? "L" : "M") + x(v).toFixed(1) + "," + Math.max(T - 4, y(f(v))).toFixed(1); }
        K.svg("path", { d, class: "s-accent", "stroke-width": 2.6 }, front);
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, front);
        if (p.z) {
          const zy = B + 32;
          K.svg("line", { x1: L, y1: zy, x2: R, y2: zy, class: "s-axis" }, front);
          for (let z = -3; z <= 3; z++) {
            const v = mu + z * sd;
            if (v < xr[0] || v > xr[1]) continue;
            K.svg("line", { x1: x(v), y1: zy - 4, x2: x(v), y2: zy + 4, class: "s-axis" }, front);
            K.text(front, x(v), zy + 13, (z > 0 ? "+" : z < 0 ? "−" : "") + Math.abs(z), "s-text");
          }
          K.text(front, L - 4, zy, "z", "s-text-strong", "end");
        }
        Object.keys(handles).forEach((name) => {
          const h = handles[name], v = name === "a" ? a : b, px = x(v);
          h.line.setAttribute("x1", px); h.line.setAttribute("x2", px);
          h.c.setAttribute("cx", px);
          h.lab.setAttribute("x", px);
          h.lab.textContent = name + " = " + K.fmt(v, 2);
          h.hit.setAttribute("x", px - 18);
        });
        const P = prob();
        const zb = K.fmt((b + cc - mu) / sd, 2), za = K.fmt((a - cc - mu) / sd, 2);
        let html;
        if (show === "left") html = "P(X ≤ " + K.fmt(b, 2) + ") ≈ Φ(" + zb + ") = <b>" + K.fmt(P, 4) + "</b>";
        else if (show === "right") html = "P(X ≥ " + K.fmt(a, 2) + ") ≈ 1 − Φ(" + za + ") = <b>" + K.fmt(P, 4) + "</b>";
        else html = "P(" + K.fmt(a, 2) + " ≤ X ≤ " + K.fmt(b, 2) + ") ≈ Φ(" + zb + ") − Φ(" + za + ") = <b>" + K.fmt(P, 4) + "</b>";
        if (!bin) html = html.replace(/≈/, "=");
        html = "μ = " + K.fmt(mu, 2) + ", σ = " + K.fmt(sd, 3) + ". " + html;
        if (bin) {
          html += " (mit ±0,5 an den Rändern)<br>Exakt mit B(" + bn + "; " + K.fmt(bp, 2) + "): <b>" + K.fmt(exact(), 4) + "</b>. " +
            (sd > 3 ? K.pill(true, "σ > 3, Näherung brauchbar") : K.pill(false, "σ ≤ 3, Näherung grob"));
        }
        out.set(html);
      }
      paint();
      const scope = () => ({ mu, sigma: sd, a, b, P: prob(), za: (a - mu) / sd, zb: (b - mu) / sd, n: bn, p: bp, exact: exact() });
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (!s) return;
          if (s.n != null && bin) {
            bn = Math.max(1, Math.round(s.n)); mu = bn * bp; sd = Math.sqrt(bn * bp * (1 - bp));
            sliders.forEach((sl) => { const l = sl.el.querySelector("label").textContent; sl.set(l === "n" ? bn : bp); });
          }
          if (s.a != null) a = s.a;
          if (s.b != null) b = s.b;
          if (s.mu != null) mu = s.mu;
          if (s.sigma != null) sd = s.sigma;
          paint();
        },
        getVar: (k) => ({ mu, sigma: sd, a, b, n: bn, p: bp })[k],
        setVar(k, v) {
          if (k === "a") a = v;
          if (k === "b") b = v;
          if (bin && (k === "n" || k === "p")) {
            if (k === "n") bn = Math.max(1, Math.round(v)); else bp = K.clamp(v, 0.01, 0.99);
            mu = bn * bp; sd = Math.sqrt(bn * bp * (1 - bp));
            sliders.forEach((s) => { const l = s.el.querySelector("label").textContent; s.set(l === "n" ? bn : bp); });
          } else if (!bin) {
            if (k === "mu") mu = v;
            if (k === "sigma") sd = Math.max(0.05, v);
            sliders.forEach((s) => { const l = s.el.querySelector("label").textContent; if (l === "μ") s.set(mu); if (l === "σ") s.set(sd); });
          }
          paint();
        },
        lock() { locked = true; sliders.forEach((s) => s.disable(true)); },
      };
    },
  });

  // ------------------------------------------------------------------ hypothesis test

  /* params: n, p0, p1, side "right"|"left", alpha (level), k (first value of the critical bound), range [lo, hi],
   *         showBeta, p1Slider
   * scope:  k, alpha, beta, kopt, n, p0, p1, level */
  LW.widget("hypothesis", {
    mount(host, p, ctx) {
      const W = 360, H = 246, L = 44, R = W - 10, T = 26, B = H - 30;
      const n = p.n || 50, p0 = num(p.p0, 0.5), side = p.side || "right", level = num(p.alpha, 0.05);
      let p1 = num(p.p1, side === "right" ? 0.65 : 0.35);
      const f0 = binomPMF(n, p0);
      let f1 = binomPMF(n, p1);
      const alphaOf = (k) => (side === "right" ? sum(f0, k, n) : sum(f0, 0, k));
      const betaOf = (k) => (side === "right" ? sum(f1, 0, k - 1) : sum(f1, k + 1, n));
      let kopt = side === "right" ? n + 1 : -1;
      if (side === "right") { for (let k = n; k >= 0; k--) if (alphaOf(k) <= level) kopt = k; else break; }
      else { for (let k = 0; k <= n; k++) if (alphaOf(k) <= level) kopt = k; else break; }
      let k = p.k != null ? p.k : Math.round(n * p0) + (side === "right" ? 2 : -2);
      let showBeta = !!p.showBeta, locked = false;
      const sd0 = Math.sqrt(n * p0 * (1 - p0));
      const lo = p.range ? p.range[0] : Math.max(0, Math.floor(Math.min(n * p0, n * p1) - 3.6 * sd0));
      const hi = p.range ? p.range[1] : Math.min(n, Math.ceil(Math.max(n * p0, n * p1) + 3.6 * sd0));
      const x = K.scale(lo - 0.5, hi + 0.5, L, R);
      const svg = K.root(host, W, H, "Hypothesentest mit Ablehnungsbereich");
      const g = K.svg("g", null, svg);
      const cut = K.svg("g", null, svg);
      const hit = K.svg("rect", { x: L, y: T - 20, width: R - L, height: B - T + 20, class: "s-hit" }, svg);
      K.drag(svg, hit, (q) => {
        if (locked) return;
        const v = x.inv(q.x);
        k = K.clamp(side === "right" ? Math.round(v + 0.5) : Math.round(v - 0.5), lo, hi);
        paint();
        ctx.changed();
      });
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      let betaBtn = null, sP1 = null;
      if (p.beta !== false) {
        betaBtn = K.button(row, "Fehler 2. Art zeigen", () => { showBeta = !showBeta; betaBtn.classList.toggle("on", showBeta); paint(); });
        betaBtn.classList.toggle("on", showBeta);
      }
      if (p.p1Slider) sP1 = K.slider(host, { label: "wahres p", min: 0.05, max: 0.95, step: 0.01, value: p1, format: (v) => K.fmt(v, 2), onInput: (v) => { p1 = v; f1 = binomPMF(n, p1); paint(); ctx.changed(); } });
      const out = K.readout(host);

      function paint() {
        K.clear(g);
        K.clear(cut);
        let top = 0;
        for (let i = lo; i <= hi; i++) top = Math.max(top, f0[i], showBeta ? f1[i] : 0);
        top *= 1.12;
        const y = K.scale(0, top, B, T);
        gridY(g, y, K.ticks(0, top, 4), L, R, (t) => K.fmt(t, 2));
        const w = Math.max(1.5, x(1) - x(0) - 1.5);
        const reject = (i) => (side === "right" ? i >= k : i <= k);
        for (let i = lo; i <= hi; i++) {
          K.svg("rect", { x: x(i) - w / 2, y: y(f0[i]), width: w, height: Math.max(0, B - y(f0[i])), rx: Math.min(2.5, w / 3), fill: reject(i) ? "var(--red)" : "var(--accent)", opacity: reject(i) ? 0.85 : 0.55 }, g);
        }
        if (showBeta) {
          let d = "";
          for (let i = lo; i <= hi; i++) {
            const top1 = y(f1[i]);
            if (!reject(i)) K.svg("rect", { x: x(i) - w / 2, y: top1, width: w, height: Math.max(0, B - top1), fill: "var(--orange)", opacity: 0.3 }, g);
            d += (i === lo ? "M" : "L") + (x(i) - w / 2).toFixed(1) + "," + top1.toFixed(1) + "L" + (x(i) + w / 2).toFixed(1) + "," + top1.toFixed(1);
          }
          K.svg("path", { d, fill: "none", stroke: "var(--orange)", "stroke-width": 2 }, g);
        }
        K.ticks(lo, hi, 7).filter((t) => Number.isInteger(t)).forEach((t) => K.text(g, x(t), B + 12, String(t)));
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g);
        const cx = x(side === "right" ? k - 0.5 : k + 0.5);
        K.svg("line", { x1: cx, y1: T - 12, x2: cx, y2: B, stroke: "var(--label)", "stroke-width": 2 }, cut);
        K.svg("circle", { cx, cy: T - 12, r: 8, class: "s-handle" }, cut);
        K.text(cut, cx + (side === "right" ? 12 : -12), T - 12, "k = " + k, "s-text-strong", side === "right" ? "start" : "end");
        const a = alphaOf(k), b = betaOf(k);
        const region = side === "right" ? "X ≥ " + k : "X ≤ " + k;
        let html = "Ablehnungsbereich <b>" + region + "</b>. Fehler 1. Art α = P(" + region + " | p = " + K.fmt(p0, 2) + ") = <b>" + K.fmt(a, 4) + "</b> " +
          (a <= level ? K.pill(true, "höchstens " + K.fmt(level * 100, 1) + " %") : K.pill(false, "über " + K.fmt(level * 100, 1) + " %"));
        if (showBeta) html += "<br>Fehler 2. Art bei wahrem p = " + K.fmt(p1, 2) + ": β = <b>" + K.fmt(b, 4) + "</b>. So oft bliebe die Abweichung unentdeckt.";
        out.set(html);
      }
      paint();
      const scope = () => ({ k, alpha: alphaOf(k), beta: betaOf(k), kopt, n, p0, p1, level });
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (s && s.k != null) k = s.k; else if (!s || s.p1 == null) k = kopt;
          if (s && s.p1 != null) {
            p1 = s.p1;
            f1 = binomPMF(n, p1);
            if (sP1) sP1.set(p1);
            showBeta = true;
            if (betaBtn) betaBtn.classList.add("on");
          }
          paint();
        },
        getVar: (name) => (name === "k" ? k : name === "p1" ? p1 : NaN),
        setVar(name, v) {
          if (name === "k") k = K.clamp(Math.round(v), lo, hi);
          if (name === "p1") { p1 = K.clamp(v, 0.01, 0.99); f1 = binomPMF(n, p1); if (sP1) sP1.set(p1); }
          paint();
        },
        act(name, arg) { if (name === "beta") { showBeta = !!arg; if (betaBtn) betaBtn.classList.toggle("on", showBeta); paint(); } },
        lock() { locked = true; if (sP1) sP1.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ boxplot

  /* params: data [numbers], range [lo, hi], step (snap), label, unit, drag (default true)
   * scope:  n, mean, median, q1, q3, iqr, sd (with 1/n), min, max, range */
  LW.widget("boxplot", {
    mount(host, p, ctx) {
      const W = 360, H = 226, L = 18, R = W - 18, axisY = 128, boxY = 190;
      const data = (p.data || [1, 2, 3]).map((v) => num(v, 0));
      const lo = p.range ? p.range[0] : Math.min(...data) - 1, hi = p.range ? p.range[1] : Math.max(...data) + 1;
      const step = p.step || 1, unit = p.unit ? " " + p.unit : "";
      const x = K.scale(lo, hi, L, R);
      let locked = false;
      const svg = K.root(host, W, H, "Daten auf dem Zahlenstrahl mit Boxplot");
      K.svg("line", { x1: L, y1: axisY, x2: R, y2: axisY, class: "s-axis" }, svg);
      K.ticks(lo, hi, 8).forEach((t) => {
        K.svg("line", { x1: x(t), y1: axisY - 3, x2: x(t), y2: axisY + 3, class: "s-axis" }, svg);
        K.text(svg, x(t), axisY + 30, K.fmt(t, 2));
      });
      if (p.label) K.text(svg, R, 10, p.label, "s-text", "end");
      K.svg("path", { d: "M14,6 L22,6 L18,13 Z", fill: "var(--orange)" }, svg);
      K.text(svg, 26, 10, "Mittelwert", "s-text", "start");
      K.svg("line", { x1: 104, y1: 4, x2: 104, y2: 16, stroke: "var(--accent)", "stroke-width": 3 }, svg);
      K.text(svg, 110, 10, "Median", "s-text", "start");
      const stats = K.svg("g", null, svg);
      const dots = data.map((v, i) => {
        const c = K.svg("circle", { r: 6.5, fill: "var(--accent)", stroke: "var(--card-solid)", "stroke-width": 1.5 }, svg);
        const hitC = K.svg("circle", { r: 16, class: "s-hit" }, svg);
        if (p.drag !== false) K.drag(svg, hitC, (q) => { if (locked) return; data[i] = K.clamp(K.snap(x.inv(q.x), step), lo, hi); paint(); ctx.changed(); });
        return { c, hitC };
      });
      const out = K.readout(host);

      function compute() {
        const s = data.slice().sort((a, b) => a - b), n = s.length;
        const med = (arr) => { const m = arr.length; return m % 2 ? arr[(m - 1) / 2] : (arr[m / 2 - 1] + arr[m / 2]) / 2; };
        const lower = s.slice(0, Math.floor(n / 2)), upper = s.slice(Math.ceil(n / 2));
        const mean = s.reduce((a, b) => a + b, 0) / n;
        const q1 = med(lower.length ? lower : s), q3 = med(upper.length ? upper : s);
        return { n, mean, median: med(s), q1, q3, iqr: q3 - q1, sd: Math.sqrt(s.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n), min: s[0], max: s[n - 1], range: s[n - 1] - s[0] };
      }
      function paint() {
        // stack equal values
        const order = data.map((v, i) => i).sort((a, b) => data[a] - data[b] || a - b);
        const level = {};
        order.forEach((i) => {
          const key = data[i].toFixed(6);
          const l = level[key] || 0;
          level[key] = l + 1;
          const cy = axisY - 12 - l * 14;
          dots[i].c.setAttribute("cx", x(data[i]));
          dots[i].c.setAttribute("cy", cy);
          dots[i].hitC.setAttribute("cx", x(data[i]));
          dots[i].hitC.setAttribute("cy", cy);
        });
        const s = compute();
        K.clear(stats);
        K.svg("path", { d: "M" + x(s.mean) + "," + (axisY + 3) + " L" + (x(s.mean) - 8) + "," + (axisY + 17) + " L" + (x(s.mean) + 8) + "," + (axisY + 17) + " Z", fill: "var(--orange)" }, stats);
        K.svg("line", { x1: x(s.min), y1: boxY, x2: x(s.q1), y2: boxY, class: "s-axis", "stroke-width": 2 }, stats);
        K.svg("line", { x1: x(s.q3), y1: boxY, x2: x(s.max), y2: boxY, class: "s-axis", "stroke-width": 2 }, stats);
        [s.min, s.max].forEach((v) => K.svg("line", { x1: x(v), y1: boxY - 8, x2: x(v), y2: boxY + 8, class: "s-axis", "stroke-width": 2 }, stats));
        K.svg("rect", { x: x(s.q1), y: boxY - 14, width: Math.max(1, x(s.q3) - x(s.q1)), height: 28, rx: 6, fill: "var(--accent-soft)", stroke: "var(--accent)", "stroke-width": 1.5 }, stats);
        K.svg("line", { x1: x(s.median), y1: boxY - 14, x2: x(s.median), y2: boxY + 14, stroke: "var(--accent)", "stroke-width": 3.5 }, stats);
        K.svg("line", { x1: x(s.median), y1: axisY + 4, x2: x(s.median), y2: boxY - 14, stroke: "var(--accent)", "stroke-width": 1, "stroke-dasharray": "3 3" }, stats);
        out.set("n = " + s.n + " · Mittelwert <b>" + K.fmt(s.mean, 2) + unit + "</b> · Median <b>" + K.fmt(s.median, 2) + unit + "</b><br>Q₁ = " + K.fmt(s.q1, 2) +
          ", Q₃ = " + K.fmt(s.q3, 2) + ", Quartilsabstand " + K.fmt(s.iqr, 2) + " · Spannweite " + K.fmt(s.range, 2) + " · Standardabweichung " + K.fmt(s.sd, 2));
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, compute()),
        solve(goal) {
          const s = goal && goal.solve;
          if (s && Array.isArray(s.data)) { s.data.forEach((v, i) => { if (i < data.length) data[i] = v; }); paint(); }
        },
        getVar(k) { const m = /^x(\d+)$/.exec(k); return m ? data[+m[1]] : NaN; },
        setVar(k, v) { const m = /^x(\d+)$/.exec(k); if (m && +m[1] < data.length) { data[+m[1]] = K.clamp(v, lo, hi); paint(); } },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ regression line

  /* params: points [[x,y]], x [min,max], y [min,max], xLabel, yLabel, line [a, b] (own line y = a + b x),
   *         userLine (default true), showLS, dragPoints, squares (default true)
   * scope:  sse (own line), sseMin, ratio, a, b (own line), ra, rb (least squares), r, n */
  LW.widget("regression", {
    mount(host, p, ctx) {
      const W = 360, H = 272, L = 40, R = W - 12, T = 14, B = H - 34;
      const pts = (p.points || []).map((q) => [num(q[0], 0), num(q[1], 0)]);
      const xr = p.x || [0, 10], yr = p.y || [0, 10];
      const x = K.scale(xr[0], xr[1], L, R), y = K.scale(yr[0], yr[1], B, T);
      const userLine = p.userLine !== false, squares = p.squares !== false;
      let showLS = !!p.showLS || !userLine, locked = false;
      const hx = [xr[0] + (xr[1] - xr[0]) * 0.12, xr[0] + (xr[1] - xr[0]) * 0.88];
      const my0 = pts.reduce((s, q) => s + q[1], 0) / Math.max(1, pts.length);
      let hy = p.line ? [num(p.line[0], 0) + num(p.line[1], 0) * hx[0], num(p.line[0], 0) + num(p.line[1], 0) * hx[1]] : [my0, my0];
      const svg = K.root(host, W, H, "Streudiagramm mit Regressionsgerade");
      K.ticks(yr[0], yr[1], 5).forEach((t) => { K.svg("line", { x1: L, y1: y(t), x2: R, y2: y(t), class: "s-grid" }, svg); K.text(svg, L - 6, y(t), K.fmt(t, 2), "s-text", "end"); });
      K.ticks(xr[0], xr[1], 6).forEach((t) => { K.svg("line", { x1: x(t), y1: T, x2: x(t), y2: B, class: "s-grid" }, svg); K.text(svg, x(t), B + 12, K.fmt(t, 2)); });
      K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, svg);
      K.svg("line", { x1: L, y1: T, x2: L, y2: B, class: "s-axis" }, svg);
      if (p.xLabel) K.text(svg, R, H - 6, p.xLabel, "s-text-strong", "end");
      if (p.yLabel) K.text(svg, L + 4, T + 2, p.yLabel, "s-text-strong", "start");
      const dyn = K.svg("g", null, svg);
      const dots = pts.map((q, i) => {
        const c = K.svg("circle", { r: 6, fill: "var(--accent)", stroke: "var(--card-solid)", "stroke-width": 1.5 }, svg);
        if (p.dragPoints) {
          const hc = K.svg("circle", { r: 15, class: "s-hit" }, svg);
          K.drag(svg, hc, (m) => { if (locked) return; pts[i] = [K.clamp(x.inv(m.x), xr[0], xr[1]), K.clamp(y.inv(m.y), yr[0], yr[1])]; paint(); ctx.changed(); });
          return { c, hc };
        }
        return { c };
      });
      const hs = userLine ? hx.map((hxv, j) => {
        const c = K.svg("circle", { r: 9, class: "s-handle", style: "stroke: var(--orange)" }, svg);
        const hc = K.svg("circle", { r: 20, class: "s-hit" }, svg);
        K.drag(svg, hc, (m) => { if (locked) return; hy[j] = K.clamp(y.inv(m.y), yr[0], yr[1]); paint(); ctx.changed(); });
        return { c, hc };
      }) : [];
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      let lsBtn = null;
      if (userLine) {
        lsBtn = K.button(row, "Regressionsgerade zeigen", () => { showLS = !showLS; lsBtn.classList.toggle("on", showLS); paint(); ctx.changed(); });
        lsBtn.classList.toggle("on", showLS);
      }
      const out = K.readout(host);

      function fit() {
        const n = pts.length;
        const mx = pts.reduce((s, q) => s + q[0], 0) / n, my = pts.reduce((s, q) => s + q[1], 0) / n;
        let sxx = 0, sxy = 0, syy = 0;
        pts.forEach(([a, b]) => { sxx += (a - mx) * (a - mx); sxy += (a - mx) * (b - my); syy += (b - my) * (b - my); });
        const rb = sxx ? sxy / sxx : 0, ra = my - rb * mx;
        const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
        const sseMin = pts.reduce((s, [a, b]) => s + (b - ra - rb * a) * (b - ra - rb * a), 0);
        return { n, ra, rb, r, sseMin, mx, my };
      }
      function own() {
        const b = (hy[1] - hy[0]) / (hx[1] - hx[0]), a = hy[0] - b * hx[0];
        return { a, b, sse: pts.reduce((s, [u, v]) => s + (v - a - b * u) * (v - a - b * u), 0) };
      }
      function drawLine(a, b, color, width, label) {
        const x1 = xr[0], x2 = xr[1];
        K.svg("line", { x1: x(x1), y1: y(a + b * x1), x2: x(x2), y2: y(a + b * x2), stroke: color, "stroke-width": width, "stroke-linecap": "round" }, dyn);
        if (label) {
          const lx = xr[0] + (xr[1] - xr[0]) * 0.97;
          K.text(dyn, x(lx), y(a + b * lx) - 12, label, "s-text-strong", "end");
        }
      }
      const eq = (a, b) => "y = " + K.fmt(a, 2) + (b < 0 ? " − " : " + ") + K.fmt(Math.abs(b), 2) + "·x";
      function paint() {
        K.clear(dyn);
        const F = fit(), O = own();
        if (userLine) {
          if (squares) {
            pts.forEach(([u, v]) => {
              const py = y(v), ly = y(O.a + O.b * u), side = Math.abs(py - ly);
              const right = x(u) + side <= R ? 1 : -1;
              K.svg("rect", { x: right > 0 ? x(u) : x(u) - side, y: Math.min(py, ly), width: side, height: side, fill: "var(--orange)", opacity: 0.16, stroke: "var(--orange)", "stroke-opacity": 0.5 }, dyn);
            });
          }
          pts.forEach(([u, v]) => K.svg("line", { x1: x(u), y1: y(v), x2: x(u), y2: y(O.a + O.b * u), stroke: "var(--orange)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, dyn));
          drawLine(O.a, O.b, "var(--orange)", 3, null);
        }
        if (showLS) drawLine(F.ra, F.rb, "var(--accent)", 2.5, userLine ? "Regressionsgerade" : null);
        pts.forEach((q, i) => {
          dots[i].c.setAttribute("cx", x(q[0])); dots[i].c.setAttribute("cy", y(q[1]));
          if (dots[i].hc) { dots[i].hc.setAttribute("cx", x(q[0])); dots[i].hc.setAttribute("cy", y(q[1])); }
        });
        hs.forEach((h, j) => {
          h.c.setAttribute("cx", x(hx[j])); h.c.setAttribute("cy", y(hy[j]));
          h.hc.setAttribute("cx", x(hx[j])); h.hc.setAttribute("cy", y(hy[j]));
        });
        let html = "";
        if (userLine) html += "Deine Gerade " + eq(O.a, O.b) + ": Summe der Abweichungsquadrate <b>" + K.fmt(O.sse, 2) + "</b>.";
        if (showLS) html += (html ? "<br>" : "") + "Regressionsgerade " + eq(F.ra, F.rb) + ": Minimum <b>" + K.fmt(F.sseMin, 2) + "</b>.";
        html += (html ? " " : "") + "Korrelationskoeffizient r = <b>" + K.fmt(F.r, 3) + "</b>.";
        out.set(html);
      }
      paint();
      const scope = () => { const F = fit(), O = own(); return { sse: O.sse, sseMin: F.sseMin, ratio: F.sseMin > 0 ? O.sse / F.sseMin : O.sse > 0 ? Infinity : 1, a: O.a, b: O.b, ra: F.ra, rb: F.rb, r: F.r, n: F.n }; };
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (s && Array.isArray(s.points)) { s.points.forEach((q, i) => { if (pts[i]) { pts[i][0] = q[0]; pts[i][1] = q[1]; } }); paint(); return; }
          const F = fit();
          hy = [F.ra + F.rb * hx[0], F.ra + F.rb * hx[1]];
          showLS = true;
          if (lsBtn) lsBtn.classList.add("on");
          paint();
        },
        getVar: (k) => (k === "h0" ? hy[0] : k === "h1" ? hy[1] : NaN),
        setVar(k, v) { if (k === "h0") hy[0] = v; if (k === "h1") hy[1] = v; paint(); },
        act(name, arg) {
          if (name === "ls") { showLS = !!arg; if (lsBtn) lsBtn.classList.toggle("on", showLS); paint(); }
          if (name === "fit") { const F = fit(); hy = [F.ra + F.rb * hx[0], F.ra + F.rb * hx[1]]; paint(); }
        },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ tree diagram

  /* params: mode "same" | "urn" | "perm", depth,
   *         same: options [{label, p}] (p as number or "1/6"),
   *         urn: { counts: {R: 3, B: 2}, replace: false, names: {R: "rot"} },
   *         perm: items ["A", "B", "C"] (no probabilities, for counting),
   *         highlight: ["RB", "BR"] or { count: { R: 1 } } or { atLeast: { R: 1 } }, showProbs (default true), reveal (levels shown)
   * scope:  leaves, hits, P (summed probability of the highlighted paths) */
  function frac(n, d) { const g = (a, b) => (b ? g(b, a % b) : a); const k = g(Math.abs(n), Math.abs(d)) || 1; return [n / k, d / k]; }
  const fracText = (f) => (f[1] === 1 ? String(f[0]) : f[0] + "/" + f[1]);
  function parseFrac(v) {
    if (typeof v === "string" && /^\s*\d+\s*\/\s*\d+\s*$/.test(v)) { const ab = v.split("/").map((s) => +s); return frac(ab[0], ab[1]); }
    const x = num(v, 0);
    for (let d = 1; d <= 1000; d++) if (Math.abs(Math.round(x * d) - x * d) < 1e-9) return frac(Math.round(x * d), d);
    return [x, 1];
  }

  LW.widget("tree", {
    mount(host, p, ctx) {
      const W = 360;
      const mode = p.mode || "same";
      const depth = p.depth || 2;
      let shownLevels = p.reveal != null ? p.reveal : depth;
      let hl = p.highlight || null;
      const showProbs = p.showProbs !== false && mode !== "perm";
      function children(state) {
        if (mode === "perm") return state.items.map((it, i) => ({ label: it, f: [1, state.items.length], state: { items: state.items.filter((x, j) => j !== i) } }));
        if (mode === "urn") {
          const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
          return Object.keys(state.counts).filter((k) => state.counts[k] > 0).map((k) => {
            const counts = Object.assign({}, state.counts);
            if (!p.urn.replace) counts[k] -= 1;
            return { label: k, f: frac(state.counts[k], total), state: { counts } };
          });
        }
        return (p.options || []).map((o) => ({ label: o.label, f: parseFrac(o.p), state }));
      }
      const start = mode === "perm" ? { items: (p.items || ["A", "B", "C"]).slice() } : mode === "urn" ? { counts: Object.assign({}, p.urn.counts) } : {};
      const nodes = [];
      function grow(path, state, level, pf) {
        const node = { path, level, pf, kids: [] };
        nodes.push(node);
        if (level < depth) {
          for (const c of children(state)) {
            const kid = grow(path + c.label, c.state, level + 1, frac(pf[0] * c.f[0], pf[1] * c.f[1]));
            kid.edge = c.f;
            kid.label = c.label;
            kid.parent = node;
            node.kids.push(kid);
          }
        }
        return node;
      }
      const root = grow("", start, 0, [1, 1]);
      const leaves = nodes.filter((nd) => nd.level === depth);
      const H = Math.max(150, leaves.length * 22 + 26);
      const svg = K.root(host, W, H, "Baumdiagramm");
      const colX = (l) => 22 + l * ((W - (showProbs ? 130 : 80)) / depth);
      leaves.forEach((nd, i) => { nd.y = 14 + (i + 0.5) * ((H - 24) / leaves.length); });
      (function setY(nd) { if (nd.kids.length) { nd.kids.forEach(setY); nd.y = nd.kids.reduce((s, k) => s + k.y, 0) / nd.kids.length; } })(root);
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const count = (path, ch) => path.split("").filter((c) => c === ch).length;
      const isHit = (path) => {
        if (!hl) return false;
        if (Array.isArray(hl)) return hl.includes(path);
        if (hl.count) return Object.keys(hl.count).every((k) => count(path, k) === hl.count[k]);
        if (hl.atLeast) return Object.keys(hl.atLeast).every((k) => count(path, k) >= hl.atLeast[k]);
        return false;
      };
      const name = (k) => (p.urn && p.urn.names && p.urn.names[k]) || k;
      function paint() {
        K.clear(g);
        const hitPaths = new Set(leaves.filter((nd) => isHit(nd.path)).map((nd) => nd.path));
        const onHit = (nd) => [...hitPaths].some((h) => h.startsWith(nd.path));
        nodes.forEach((nd) => {
          if (nd.level === 0 || nd.level > shownLevels) return;
          const par = nd.parent;
          const hot = hitPaths.size && onHit(nd);
          K.svg("line", { x1: colX(par.level) + 9, y1: par.y, x2: colX(nd.level) - 9, y2: nd.y, stroke: hot ? "var(--accent)" : "var(--label-3)", "stroke-width": hot ? 2.6 : 1.4 }, g);
          if (showProbs && nd.edge) {
            const mx = (colX(par.level) + colX(nd.level)) / 2, my = (par.y + nd.y) / 2;
            K.svg("rect", { x: mx - 15, y: my - 8, width: 30, height: 16, rx: 5, fill: "var(--card-solid)" }, g);
            K.text(g, mx, my, fracText(nd.edge), "s-text", "middle");
          }
        });
        nodes.forEach((nd) => {
          if (nd.level > shownLevels) return;
          const hot = hitPaths.size && onHit(nd) && nd.level > 0;
          K.svg("circle", { cx: colX(nd.level), cy: nd.y, r: nd.level === 0 ? 5 : 9, fill: hot ? "var(--accent)" : "var(--fill-2)" }, g);
          if (nd.level > 0) {
            const t = K.text(g, colX(nd.level), nd.y, nd.label, "s-text-strong", "middle");
            t.style.fontSize = "11px";
            if (hot) t.style.fill = "white";
          }
          if (nd.level === depth && shownLevels >= depth) {
            const t = K.text(g, colX(depth) + 16, nd.y, nd.path + (showProbs ? "  " + fracText(nd.pf) : ""), hitPaths.has(nd.path) ? "s-text-strong" : "s-text", "start");
            if (hitPaths.has(nd.path)) t.style.fill = "var(--accent)";
          }
        });
        const hits = leaves.filter((nd) => hitPaths.has(nd.path));
        let P = [0, 1];
        hits.forEach((nd) => { P = frac(P[0] * nd.pf[1] + nd.pf[0] * P[1], P[1] * nd.pf[1]); });
        let html = "<b>" + leaves.length + "</b> Pfade";
        if (mode === "urn") html += " · Urne: " + Object.keys(p.urn.counts).map((k) => p.urn.counts[k] + " " + LW.esc(name(k))).join(", ") + (p.urn.replace ? ", mit Zurücklegen" : ", ohne Zurücklegen");
        if (hits.length) html += "<br>Markiert: " + hits.length + (hits.length === 1 ? " Pfad" : " Pfade") + (showProbs ? ", zusammen <b>P = " + fracText(P) + " ≈ " + K.fmt(P[0] / P[1], 4) + "</b>" : "");
        out.set(html);
        return { hits: hits.length, P: P[0] / P[1] };
      }
      paint();
      const scope = () => { const r = paint(); return { leaves: leaves.length, hits: r.hits, P: r.P }; };
      return {
        check: (goal) => checkGoal(goal, scope()),
        getVar: (k) => (k === "level" ? shownLevels : NaN),
        setVar(k, v) { if (k === "level") { shownLevels = K.clamp(Math.round(v), 0, depth); paint(); } },
        act(nm, arg) {
          if (nm === "reveal") { shownLevels = K.clamp(arg, 0, depth); paint(); }
          if (nm === "highlight") { hl = arg || null; paint(); }
        },
      };
    },
  });

  // ------------------------------------------------------------------ mosaic for two events

  /* params: pa, pba (P(B|A)), pbna (P(B|not A)), labels {a, na, b}, sliders ["pa", "pba", "pbna"]
   * scope:  pa, pba, pbna, pb, pab, prod (P(A) P(B)), indep (1 when P(B|A) = P(B|not A)) */
  LW.widget("mosaic", {
    mount(host, p, ctx) {
      const W = 360, H = 250, L = 22, T = 26, S = 280, SH = 188;
      let pa = num(p.pa, 0.4), pba = num(p.pba, 0.7), pbna = num(p.pbna, 0.3);
      const lab = Object.assign({ a: "A", na: "nicht A", b: "B" }, p.labels || {});
      const svg = K.root(host, W, H, "Mosaikdiagramm zweier Ereignisse");
      const g = K.svg("g", null, svg);
      const which = p.sliders || ["pa", "pba", "pbna"];
      const sl = {};
      const pf = (v) => K.fmt(v * 100, 0) + " %";
      if (which.includes("pa")) sl.pa = K.slider(host, { label: "P(" + lab.a + ")", min: 0.05, max: 0.95, step: 0.01, value: pa, format: pf, onInput: (v) => { pa = v; paint(); ctx.changed(); } });
      if (which.includes("pba")) sl.pba = K.slider(host, { label: "P(" + lab.b + " | " + lab.a + ")", min: 0, max: 1, step: 0.01, value: pba, format: pf, onInput: (v) => { pba = v; paint(); ctx.changed(); } });
      if (which.includes("pbna")) sl.pbna = K.slider(host, { label: "P(" + lab.b + " | " + lab.na + ")", min: 0, max: 1, step: 0.01, value: pbna, format: pf, onInput: (v) => { pbna = v; paint(); ctx.changed(); } });
      const out = K.readout(host);
      function paint() {
        K.clear(g);
        const wa = S * pa;
        const pb = pa * pba + (1 - pa) * pbna;
        const col = (x0, w, h, fill, op) => K.svg("rect", { x: x0, y: T + SH - h, width: Math.max(0, w), height: Math.max(0, h), fill, opacity: op }, g);
        K.svg("rect", { x: L, y: T, width: S, height: SH, fill: "var(--fill)" }, g);
        col(L, wa - 1, SH * pba, "var(--accent)", 0.85);
        col(L + wa + 1, S - wa - 1, SH * pbna, "var(--orange)", 0.8);
        K.svg("line", { x1: L + wa, y1: T, x2: L + wa, y2: T + SH, stroke: "var(--card-solid)", "stroke-width": 2 }, g);
        const yb = T + SH - SH * pb;
        K.svg("line", { x1: L - 4, y1: yb, x2: L + S + 4, y2: yb, stroke: "var(--label)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, g);
        K.text(g, L + S + 8, yb, "P(" + lab.b + ")", "s-text", "start");
        K.text(g, L + wa / 2, T - 11, lab.a + " " + pf(pa), "s-text-strong", "middle");
        K.text(g, L + wa + (S - wa) / 2, T - 11, lab.na + " " + pf(1 - pa), "s-text-strong", "middle");
        if (pba > 0.12 && wa > 56) K.text(g, L + wa / 2, T + SH - (SH * pba) / 2, pf(pba), "s-text-strong", "middle").style.fill = "white";
        if (pbna > 0.12 && S - wa > 56) K.text(g, L + wa + (S - wa) / 2, T + SH - (SH * pbna) / 2, pf(pbna), "s-text-strong", "middle").style.fill = "white";
        K.text(g, L + S / 2, T + SH + 16, "farbig: " + lab.b + ", Fläche = Wahrscheinlichkeit", "s-text", "middle");
        const indep = Math.abs(pba - pbna) < 0.005;
        out.set("P(" + LW.esc(lab.a) + " ∩ " + LW.esc(lab.b) + ") = " + K.fmt(pa * pba, 3) + " &nbsp; P(" + LW.esc(lab.a) + ")·P(" + LW.esc(lab.b) + ") = " + K.fmt(pa * pb, 3) +
          "<br>" + (indep ? K.pill(true, "unabhängig: in beiden Spalten gleich hoch") : K.pill(false, "abhängig: Wissen über " + lab.a + " ändert die Chance für " + lab.b)));
      }
      paint();
      const scope = () => { const pb = pa * pba + (1 - pa) * pbna; return { pa, pba, pbna, pb, pab: pa * pba, prod: pa * pb, indep: Math.abs(pba - pbna) < 0.005 ? 1 : 0 }; };
      const api = {
        check: (goal) => checkGoal(goal, scope()),
        getVar: (k) => ({ pa, pba, pbna })[k],
        setVar(k, v) {
          if (k === "pa") pa = K.clamp(v, 0.01, 0.99);
          if (k === "pba") pba = K.clamp(v, 0, 1);
          if (k === "pbna") pbna = K.clamp(v, 0, 1);
          if (sl[k]) sl[k].set(k === "pa" ? pa : k === "pba" ? pba : pbna);
          paint();
        },
        solve(goal) { const s = goal && goal.solve; if (s) ["pa", "pba", "pbna"].forEach((k) => { if (s[k] != null) api.setVar(k, s[k]); }); },
        lock() { Object.values(sl).forEach((s) => s.disable(true)); },
      };
      return api;
    },
  });

  // ------------------------------------------------------------------ many samples: prognosis and confidence intervals

  /* params: mode "prognose" | "konfidenz", p, n, z (1.96), rows (40), sizes [25, 100, 400, 1000] or false, pSlider
   * scope:  total, inside, rate, n, p */
  LW.widget("intervals", {
    mount(host, p, ctx) {
      const W = 360, H = 270, L = 16, R = W - 16, T = 20, B = H - 30;
      const mode = p.mode || "konfidenz";
      let prob = num(p.p, 0.4), n = p.n || 100;
      const z = p.z || 1.96, rows = p.rows || 40;
      const rand = seeded(ctx.seed + "|intervals");
      let samples = [], locked = false;
      const svg = K.root(host, W, H, mode === "konfidenz" ? "Konfidenzintervalle vieler Stichproben" : "Relative Häufigkeiten vieler Stichproben");
      const g = K.svg("g", null, svg);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      const btns = [1, 20, 100].map((k) => K.button(row, "+" + k + (k === 1 ? " Stichprobe" : ""), () => { if (!locked) { draw(k); paint(); ctx.changed(); } }));
      btns.push(K.button(row, "Neu", () => { if (!locked) { samples = []; paint(); ctx.changed(); } }));
      let seg = null;
      if (p.sizes !== false) seg = K.segmented(host, (p.sizes || [25, 100, 400, 1000]).map((s) => ({ id: String(s), label: "n = " + K.fmt(s, 0) })), String(n), (id) => { n = +id; samples = []; paint(); ctx.changed(); });
      let sP = null;
      if (p.pSlider) sP = K.slider(host, { label: "wahres p", min: 0.05, max: 0.95, step: 0.01, value: prob, format: (v) => K.fmt(v, 2), onInput: (v) => { prob = v; samples = []; paint(); ctx.changed(); } });
      const out = K.readout(host);
      function draw(k) {
        for (let i = 0; i < k; i++) {
          let hits = 0;
          for (let j = 0; j < n; j++) if (rand() < prob) hits++;
          samples.push(hits / n);
        }
      }
      function covers(h) {
        if (mode === "konfidenz") { const half = z * Math.sqrt((h * (1 - h)) / n); return h - half <= prob && prob <= h + half; }
        return Math.abs(h - prob) <= z * Math.sqrt((prob * (1 - prob)) / n);
      }
      function paint() {
        K.clear(g);
        const sd = Math.sqrt((prob * (1 - prob)) / n);
        const span = Math.max(4.6 * sd, 0.02);
        const lo = Math.max(0, prob - span), hi = Math.min(1, prob + span);
        const x = K.scale(lo, hi, L, R);
        K.ticks(lo, hi, 5).forEach((t) => {
          K.svg("line", { x1: x(t), y1: T, x2: x(t), y2: B, class: "s-grid" }, g);
          K.text(g, x(t), B + 12, K.fmt(t, 3));
        });
        if (mode === "prognose") K.svg("rect", { x: x(Math.max(lo, prob - z * sd)), y: T, width: x(Math.min(hi, prob + z * sd)) - x(Math.max(lo, prob - z * sd)), height: B - T, fill: "var(--accent-soft)" }, g);
        K.svg("line", { x1: x(prob), y1: T - 6, x2: x(prob), y2: B, stroke: "var(--label)", "stroke-width": 2 }, g);
        K.text(g, x(prob), T - 11, "p = " + K.fmt(prob, 2), "s-text-strong", "middle");
        const shown = samples.slice(-rows);
        const rh = (B - T - 4) / rows;
        shown.forEach((h, i) => {
          const yy = B - 4 - (shown.length - 1 - i) * rh - rh / 2;
          const c = covers(h) ? "var(--accent)" : "var(--red)";
          if (mode === "konfidenz") {
            const half = z * Math.sqrt((h * (1 - h)) / n);
            K.svg("line", { x1: x(Math.max(lo, h - half)), y1: yy, x2: x(Math.min(hi, h + half)), y2: yy, stroke: c, "stroke-width": Math.max(1.4, rh * 0.55), "stroke-linecap": "round", opacity: 0.85 }, g);
          }
          K.svg("circle", { cx: x(Math.max(lo, Math.min(hi, h))), cy: yy, r: Math.max(1.8, Math.min(3.4, rh * 0.45)), fill: c }, g);
        });
        K.svg("line", { x1: L, y1: B, x2: R, y2: B, class: "s-axis" }, g);
        const inside = samples.filter(covers).length;
        const what = mode === "konfidenz" ? "Intervalle enthalten das wahre p" : "relative Häufigkeiten liegen im Prognoseintervall";
        out.set(samples.length
          ? "<b>" + inside + " von " + samples.length + "</b> " + what + ": <b>" + K.fmt((100 * inside) / samples.length, 1) + " %</b>" + (samples.length > rows ? " (gezeigt: die letzten " + rows + ")" : "") +
            "<br>" + (mode === "konfidenz" ? "Jede Zeile ist eine Stichprobe mit ihrem Intervall h ± " + K.fmt(z, 2) + "·√(h(1−h)/n)." : "Hell: p ± " + K.fmt(z, 2) + "·√(p(1−p)/n) = [" + K.fmt(prob - z * sd, 3) + "; " + K.fmt(prob + z * sd, 3) + "].")
          : "Noch keine Stichprobe. Jede Stichprobe besteht aus " + K.fmt(n, 0) + " Versuchen mit p = " + K.fmt(prob, 2) + ".");
      }
      paint();
      const scope = () => { const inside = samples.filter(covers).length; return { total: samples.length, inside, rate: samples.length ? inside / samples.length : 0, n, p: prob }; };
      return {
        check: (goal) => checkGoal(goal, scope()),
        solve(goal) {
          const s = goal && goal.solve;
          if (s && s.n != null) { n = Math.max(1, Math.round(s.n)); samples = []; if (seg) seg.set(String(n)); }
          if (s && s.samples && samples.length < s.samples) draw(s.samples - samples.length);
          paint();
        },
        getVar: (k) => (k === "p" ? prob : k === "n" ? n : NaN),
        setVar(k, v) {
          if (k === "p") { prob = v; if (sP) sP.set(v); samples = []; }
          if (k === "n") { n = Math.max(1, Math.round(v)); samples = []; if (seg) seg.set(String(n)); }
          paint();
        },
        act(nm, arg) { if (nm === "sample") { draw(arg || 1); paint(); } if (nm === "reset") { samples = []; paint(); } },
        lock() { locked = true; btns.forEach((b) => { b.disabled = true; }); if (sP) sP.disable(true); },
      };
    },
  });
})();
