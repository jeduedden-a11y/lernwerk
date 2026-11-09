/* More analysis widgets: sequences and series, Venn diagrams, mappings, Cantor's counting arguments, the complex plane,
 * unit balls of norms, and step-by-step derivations. All take part in animations through getVar, setVar and act. */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const fill = (str, scope) => (LW.graphTemplate ? LW.graphTemplate(str, scope).replace(/^<p>|<\/p>$/g, "") : LW.esc(str));
  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) { try { if (LW.expr(h.when)(scope)) return { correct: false, detail: fill(h.text, scope) }; } catch (e) { /* ignore */ } }
    return { correct: false, detail: goal.message ? fill(goal.message, scope) : null };
  }
  const val = (v, scope) => { if (typeof v === "number") return v; try { return LW.expr(String(v))(scope); } catch (e) { return NaN; } };

  // ------------------------------------------------------------------ sequences and partial sums

  /* params: term (expression in n and the vars) or rec {a1, next (expression in a and n)}, mode "terms" | "sums" | "both",
   *         nMax, n (shown), vars [{name, label, min, max, step, value, digits}], limit, limitLabel, eps, yRange, highlight "parity",
   *         readout (template; scope: N, a (last term), s (last partial sum), L, vars)
   * scope:  N, a, s, L and the vars */
  LW.widget("sequence", {
    mount(host, p, ctx) {
      const W = 360, H = p.height || 240, L0 = 40, R0 = W - 10, T = 14, B = H - 28;
      const nMax = p.nMax || 30;
      const scope = {};
      let N = p.n || nMax;
      const ui = {};
      (p.vars || []).forEach((v) => {
        scope[v.name] = v.value;
        ui[v.name] = K.slider(host, { label: v.label || v.name, min: v.min, max: v.max, step: v.step || 0.01, value: v.value, format: (t) => K.fmt(t, v.digits != null ? v.digits : 2),
          onInput: (t) => { scope[v.name] = t; paint(); ctx.changed(); } });
      });
      let sN = null;
      if (p.nSlider !== false) sN = K.slider(host, { label: "n", min: 1, max: nMax, step: 1, value: N, format: (t) => K.fmt(t, 0), onInput: (t) => { N = t; paint(); ctx.changed(); } });
      const svg = K.root(host, W, H, "Folge");
      host.insertBefore(svg, host.firstChild);
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const termF = p.term ? LW.expr(p.term) : null;
      const nextF = p.rec ? LW.expr(p.rec.next) : null;
      function values() {
        const a = [], s = [];
        let prev = p.rec ? val(p.rec.a1, scope) : NaN, sum = 0;
        for (let n = 1; n <= nMax; n++) {
          let v;
          if (termF) { try { v = termF(Object.assign({}, scope, { n })); } catch (e) { v = NaN; } }
          else { v = n === 1 ? prev : (() => { try { return nextF(Object.assign({}, scope, { a: prev, n: n - 1 })); } catch (e) { return NaN; } })(); prev = v; }
          a.push(v);
          sum += v;
          s.push(sum);
        }
        return { a, s };
      }
      function paint() {
        K.clear(g);
        const { a, s } = values();
        const mode = p.mode || "terms";
        const shown = [];
        if (mode !== "sums") shown.push(...a.slice(0, N));
        if (mode !== "terms") shown.push(...s.slice(0, N));
        const Lv = p.limit != null ? val(p.limit, scope) : NaN;
        let lo, hi;
        if (p.yRange) { lo = p.yRange[0]; hi = p.yRange[1]; }
        else {
          const finite = shown.filter(isFinite).concat(isFinite(Lv) ? [Lv] : []);
          lo = Math.min(0, ...finite); hi = Math.max(...finite, lo + 1);
          const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
        }
        const x = K.scale(0.5, nMax + 0.5, L0, R0), y = K.scale(lo, hi, B, T);
        K.ticks(lo, hi, 5).forEach((t) => { K.svg("line", { x1: L0, y1: y(t), x2: R0, y2: y(t), class: "s-grid" }, g); K.text(g, L0 - 6, y(t), K.fmt(t, 2), "s-text", "end"); });
        K.ticks(1, nMax, 6).filter((t) => Number.isInteger(t)).forEach((t) => K.text(g, x(t), B + 12, String(t)));
        K.svg("line", { x1: L0, y1: y(Math.max(lo, Math.min(hi, 0))), x2: R0, y2: y(Math.max(lo, Math.min(hi, 0))), class: "s-axis" }, g);
        if (isFinite(Lv)) {
          if (p.eps) { const e = val(p.eps, scope); K.svg("rect", { x: L0, y: y(Math.min(hi, Lv + e)), width: R0 - L0, height: Math.max(0, y(Math.max(lo, Lv - e)) - y(Math.min(hi, Lv + e))), fill: "var(--accent-soft)" }, g); }
          K.svg("line", { x1: L0, y1: y(Lv), x2: R0, y2: y(Lv), stroke: "var(--green)", "stroke-width": 1.8, "stroke-dasharray": "6 4" }, g);
          K.text(g, R0 - 2, y(Lv) - 9, p.limitLabel || "Grenzwert " + K.fmt(Lv, 4), "s-text-strong", "end").style.fill = "var(--green)";
        }
        const dot = (n, v, color) => { if (!isFinite(v) || v < lo - 1e-9 || v > hi + 1e-9) return; K.svg("circle", { cx: x(n), cy: y(v), r: nMax > 60 ? 2.2 : 3.6, fill: color }, g); };
        if (mode !== "sums") a.slice(0, N).forEach((v, i) => dot(i + 1, v, p.highlight === "parity" ? (i % 2 ? "var(--orange)" : "var(--accent)") : "var(--accent)"));
        if (mode !== "terms") s.slice(0, N).forEach((v, i) => dot(i + 1, v, "var(--orange)"));
        const sc = Object.assign({}, scope, { N, a: a[N - 1], s: s[N - 1], L: Lv });
        out.set(p.readout ? fill(p.readout, sc) : "n = " + N + ": " + (mode !== "sums" ? "aₙ = " + K.fmt(a[N - 1], 6) : "") + (mode === "both" ? ", " : "") + (mode !== "terms" ? "sₙ = " + K.fmt(s[N - 1], 6) : ""));
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s) { Object.keys(s).forEach((k) => { if (k === "N") { N = s[k]; if (sN) sN.set(N); } else { scope[k] = s[k]; if (ui[k]) ui[k].set(s[k]); } }); paint(); } },
        getVar: (k) => (k === "N" ? N : scope[k]),
        setVar(k, v) { if (k === "N") { N = K.clamp(Math.round(v), 1, nMax); if (sN) sN.set(N); } else { scope[k] = v; if (ui[k]) ui[k].set(v); } paint(); },
        lock() { Object.values(ui).forEach((s) => s.disable(true)); if (sN) sN.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ Venn diagrams

  /* params: sets (2 or 3), labels, target (regions as membership strings like "10", "11" for 2 sets, "110" for 3), targetText,
   *         select (learner taps regions) or show (regions highlighted from the start)
   * scope:  correct (1 when the selection equals the target), count */
  LW.widget("venn", {
    mount(host, p, ctx) {
      const W = 360, H = 250;
      const k = p.sets === 3 ? 3 : 2;
      const labels = p.labels || ["A", "B", "C"];
      const C = k === 2 ? [[140, 125, 78], [220, 125, 78]] : [[145, 105, 70], [215, 105, 70], [180, 165, 70]];
      const svg = K.root(host, W, H, "Mengendiagramm");
      const uid = "v" + Math.random().toString(36).slice(2, 8);
      const defs = K.svg("defs", null, svg);
      C.forEach((c, i) => {
        const cp = K.svg("clipPath", { id: uid + "c" + i }, defs);
        K.svg("circle", { cx: c[0], cy: c[1], r: c[2] }, cp);
        const m = K.svg("mask", { id: uid + "m" + i }, defs);
        K.svg("rect", { x: 0, y: 0, width: W, height: H, fill: "white" }, m);
        K.svg("circle", { cx: c[0], cy: c[1], r: c[2], fill: "black" }, m);
      });
      const regions = [];
      for (let b = 0; b < 1 << k; b++) regions.push(Array.from({ length: k }, (_, i) => ((b >> (k - 1 - i)) & 1).toString()).join(""));
      const sel = new Set(p.show || []);
      const target = new Set(p.target || []);
      let locked = false;
      const layer = K.svg("g", null, svg);
      const outline = K.svg("g", null, svg);
      K.svg("rect", { x: 10, y: 10, width: W - 20, height: H - 20, rx: 14, fill: "none", stroke: "var(--label-3)", "stroke-width": 1.5 }, outline);
      K.text(outline, 22, 24, "Ω", "s-text-strong", "start");
      C.forEach((c, i) => {
        K.svg("circle", { cx: c[0], cy: c[1], r: c[2], fill: "none", stroke: "var(--label-2)", "stroke-width": 2 }, outline);
        const lx = k === 2 ? (i ? c[0] + 52 : c[0] - 52) : [c[0] - 46, c[0] + 46, c[0]][i];
        const ly = k === 2 ? c[1] - 70 : [c[1] - 52, c[1] - 52, c[1] + 82][i];
        K.text(outline, lx, ly, labels[i], "s-text-strong");
      });
      function regionShape(code, color, opacity) {
        let node = layer;
        code.split("").forEach((bit, i) => {
          const gg = K.svg("g", bit === "1" ? { "clip-path": "url(#" + uid + "c" + i + ")" } : { mask: "url(#" + uid + "m" + i + ")" }, node);
          node = gg;
        });
        K.svg("rect", { x: 11, y: 11, width: W - 22, height: H - 22, rx: 13, fill: color, opacity }, node);
      }
      const hit = K.svg("rect", { x: 10, y: 10, width: W - 20, height: H - 20, class: "s-hit" }, svg);
      hit.style.cursor = p.select ? "pointer" : "default";
      hit.addEventListener("click", (e) => {
        if (!p.select || locked) return;
        const q = K.point(svg, e);
        const code = C.map((c) => (Math.hypot(q.x - c[0], q.y - c[1]) <= c[2] ? "1" : "0")).join("");
        if (sel.has(code)) sel.delete(code); else sel.add(code);
        paint();
        ctx.changed();
      });
      const out = K.readout(host);
      function paint() {
        K.clear(layer);
        regions.forEach((code) => { if (sel.has(code)) regionShape(code, "var(--accent)", 0.55); });
        const ok = target.size && [...regions].every((r) => sel.has(r) === target.has(r));
        out.set((p.targetText ? "Gesucht: <b>" + LW.esc(p.targetText) + "</b>. " : "") + (p.select ? (sel.size ? sel.size + (sel.size === 1 ? " Bereich" : " Bereiche") + " markiert." : "Tippe Bereiche an, um sie zu markieren.") : ""));
        return { correct: ok ? 1 : 0, count: sel.size };
      }
      paint();
      return {
        check(goal) {
          const r = paint();
          if (r.correct) return { correct: true };
          const missing = [...target].filter((x) => !sel.has(x)).length, extra = [...sel].filter((x) => !target.has(x)).length;
          return { correct: false, detail: (extra ? extra + (extra === 1 ? " markierter Bereich gehört" : " markierte Bereiche gehören") + " nicht dazu. " : "") + (missing ? "Es fehlen noch " + missing + "." : "") };
        },
        solve() { sel.clear(); target.forEach((r) => sel.add(r)); paint(); },
        act(name, arg) {
          if (name === "show") { sel.clear(); (arg || []).forEach((r) => sel.add(r)); paint(); }
          if (name === "toggle") { if (sel.has(arg)) sel.delete(arg); else sel.add(arg); paint(); }
        },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ mappings between finite sets

  /* params: left, right (labels), map (index into right for each left, or -1), editable, title
   * scope:  total (every element has an image), injective, surjective, bijective */
  LW.widget("mapping", {
    mount(host, p, ctx) {
      const left = p.left || ["1", "2", "3"], right = p.right || ["a", "b", "c"];
      let map = (p.map || left.map(() => -1)).slice();
      let pick = -1, locked = false;
      const W = 360, rowH = 40, H = Math.max(left.length, right.length) * rowH + 40;
      const svg = K.root(host, W, H, "Abbildung");
      const g = K.svg("g", null, svg);
      const lx = 80, rx = 280;
      const ly = (i) => 30 + i * ((H - 50) / Math.max(1, left.length - 1 || 1)) * (left.length > 1 ? 1 : 0) + (left.length === 1 ? (H - 40) / 2 : 0);
      const ry = (j) => 30 + j * ((H - 50) / Math.max(1, right.length - 1 || 1)) * (right.length > 1 ? 1 : 0) + (right.length === 1 ? (H - 40) / 2 : 0);
      const out = K.readout(host);
      function info() {
        const total = map.every((j) => j >= 0) ? 1 : 0;
        const imgs = map.filter((j) => j >= 0);
        const injective = total && new Set(imgs).size === imgs.length ? 1 : 0;
        const surjective = total && right.every((_, j) => imgs.includes(j)) ? 1 : 0;
        return { total, injective, surjective, bijective: injective && surjective ? 1 : 0 };
      }
      function paint() {
        K.clear(g);
        K.svg("rect", { x: lx - 42, y: 8, width: 84, height: H - 16, rx: 24, fill: "var(--fill)" }, g);
        K.svg("rect", { x: rx - 42, y: 8, width: 84, height: H - 16, rx: 24, fill: "var(--fill)" }, g);
        map.forEach((j, i) => {
          if (j < 0) return;
          const x1 = lx + 16, y1 = ly(i), x2 = rx - 16, y2 = ry(j);
          K.svg("path", { d: "M" + x1 + "," + y1 + " C" + (x1 + 70) + "," + y1 + " " + (x2 - 70) + "," + y2 + " " + x2 + "," + y2, fill: "none", stroke: "var(--accent)", "stroke-width": 2.2 }, g);
          K.svg("path", { d: "M" + x2 + "," + y2 + " l-9,-5 l0,10 Z", fill: "var(--accent)" }, g);
        });
        const imgs = map.filter((j) => j >= 0);
        left.forEach((lab, i) => {
          const c = K.svg("circle", { cx: lx, cy: ly(i), r: 15, fill: i === pick ? "var(--accent)" : "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2, style: "cursor:pointer" }, g);
          const t = K.text(g, lx, ly(i), lab, "s-text-strong");
          if (i === pick) t.style.fill = "white";
          const on = () => { if (!p.editable || locked) return; pick = pick === i ? -1 : i; paint(); };
          c.addEventListener("click", on); t.addEventListener("click", on);
        });
        right.forEach((lab, j) => {
          const hitCount = imgs.filter((x) => x === j).length;
          const c = K.svg("circle", { cx: rx, cy: ry(j), r: 15, fill: "var(--card-solid)", stroke: hitCount > 1 ? "var(--red)" : hitCount === 0 ? "var(--label-3)" : "var(--green)", "stroke-width": 2.4, style: "cursor:pointer" }, g);
          K.text(g, rx, ry(j), lab, "s-text-strong");
          const on = () => { if (!p.editable || locked || pick < 0) return; map[pick] = j; pick = -1; paint(); ctx.changed(); };
          c.addEventListener("click", on);
        });
        K.text(g, lx, H - 2, p.leftName || "A", "s-text", "middle");
        K.text(g, rx, H - 2, p.rightName || "B", "s-text", "middle");
        const I = info();
        out.set(!I.total ? "Noch nicht jedem Element ist ein Bild zugeordnet. " + (p.editable ? "Tippe links ein Element an, dann rechts sein Bild." : "")
          : K.pill(!!I.injective, I.injective ? "injektiv" : "nicht injektiv") + " " + K.pill(!!I.surjective, I.surjective ? "surjektiv" : "nicht surjektiv") + (I.bijective ? " " + K.pill(true, "bijektiv") : "") +
            "<br>Rot umrandet: mehr als ein Urbild. Grau: kein Urbild.");
        return I;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { if (goal && goal.solve && goal.solve.map) { map = goal.solve.map.slice(); paint(); } },
        act(name, arg) { if (name === "map" && arg) { map = arg.slice(); paint(); } if (name === "set" && arg) { map[arg[0]] = arg[1]; paint(); } },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ Cantor: counting the rationals, the diagonal argument

  /* params: mode "zigzag" | "diagonal", size (6), k (steps shown)
   * scope:  k */
  LW.widget("cantor", {
    mount(host, p, ctx) {
      const mode = p.mode || "zigzag";
      const size = p.size || 6;
      let k = p.k || 0;
      const W = 360, H = mode === "zigzag" ? Math.round(36 + size * ((W - 40) / size)) : 250;
      const svg = K.root(host, W, H, mode === "zigzag" ? "Abzählung der Brüche" : "Diagonalargument");
      const g = K.svg("g", null, svg);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Weiter", () => { k++; paint(); ctx.changed(); });
      K.button(row, "Von vorn", () => { k = 0; paint(); ctx.changed(); });
      const out = K.readout(host);
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      // zigzag order over the anti-diagonals p + q = const
      const order = [];
      for (let s = 2; s <= 2 * size; s++) {
        const cells = [];
        for (let q = 1; q < s; q++) { const pp = s - q; if (pp <= size && q <= size) cells.push([pp, q]); }
        if (s % 2) cells.reverse();
        order.push(...cells);
      }
      const rand = LW.rng(LW.hash(ctx.seed + "|cantor"));
      const rows = Array.from({ length: 8 }, () => Array.from({ length: 12 }, () => (rand() < 0.5 ? 0 : 1)));
      function paint() {
        K.clear(g);
        if (mode === "zigzag") {
          const cs = (W - 40) / size, ox = 34, oy = 30;
          for (let i = 1; i <= size; i++) {
            K.text(g, ox + (i - 0.5) * cs, 16, "q=" + i, "s-text");
            K.text(g, 14, oy + (i - 0.5) * cs, "p=" + i, "s-text");
          }
          const shown = order.slice(0, k);
          let counted = 0;
          const pts = [];
          order.forEach(([pp, q], idx) => {
            const cx = ox + (q - 0.5) * cs, cy = oy + (pp - 0.5) * cs;
            const dup = gcd(pp, q) > 1;
            const done = idx < k;
            K.svg("circle", { cx, cy, r: cs * 0.36, fill: done ? (dup ? "var(--fill-2)" : "var(--accent)") : "var(--fill)", opacity: done && dup ? 0.6 : 1 }, g);
            const t = K.text(g, cx, cy, pp + "/" + q, "s-text-strong");
            t.style.fontSize = "11px";
            if (done && !dup) t.style.fill = "white";
            if (dup && done) t.style.textDecoration = "line-through";
            if (done) { pts.push([cx, cy]); if (!dup) counted++; }
          });
          if (pts.length > 1) K.svg("path", { d: "M" + pts.map((q) => q.join(",")).join(" L"), fill: "none", stroke: "var(--orange)", "stroke-width": 2, opacity: 0.8 }, g);
          const last = shown[shown.length - 1];
          out.set(k === 0 ? "Alle positiven Brüche p/q im Gitter. Tippe auf Weiter, um sie der Reihe nach abzuzählen."
            : "Schritt " + k + ": zuletzt <b>" + last[0] + "/" + last[1] + "</b>" + (gcd(last[0], last[1]) > 1 ? " (übersprungen, gleich " + last[0] / gcd(last[0], last[1]) + "/" + last[1] / gcd(last[0], last[1]) + ")" : ", Nummer " + counted) + ". Jeder Bruch kommt irgendwann dran.");
        } else {
          const cw = 22, ch = 22, ox = 60, oy = 20;
          const n = Math.min(k, rows.length);
          rows.forEach((r, i) => {
            K.text(g, ox - 10, oy + i * ch + ch / 2, "x" + "₁₂₃₄₅₆₇₈"[i], "s-text-strong", "end");
            r.slice(0, 12).forEach((b, j) => {
              const diag = i === j && i < n;
              K.svg("rect", { x: ox + j * cw, y: oy + i * ch, width: cw - 2, height: ch - 2, rx: 4, fill: diag ? "var(--orange)" : "var(--fill)" }, g);
              const t = K.text(g, ox + j * cw + cw / 2 - 1, oy + i * ch + ch / 2, String(b), "s-text-strong");
              if (diag) t.style.fill = "white";
            });
          });
          const yN = oy + rows.length * ch + 16;
          K.text(g, ox - 10, yN + ch / 2, "neu", "s-text-strong", "end");
          for (let j = 0; j < 12; j++) {
            const known = j < n;
            K.svg("rect", { x: ox + j * cw, y: yN, width: cw - 2, height: ch - 2, rx: 4, fill: known ? "var(--accent)" : "var(--fill)" }, g);
            if (known) { const t = K.text(g, ox + j * cw + cw / 2 - 1, yN + ch / 2, String(1 - rows[j][j]), "s-text-strong"); t.style.fill = "white"; }
          }
          out.set(n === 0 ? "Angenommen, die Liste x₁, x₂, … enthielte alle 0-1-Folgen. Wir bauen eine Folge, die in keiner Zeile steht."
            : "Stelle " + n + ": Die neue Folge nimmt das Gegenteil der Diagonale, also " + (1 - rows[n - 1][n - 1]) + " statt " + rows[n - 1][n - 1] + ". Sie unterscheidet sich von x" + "₁₂₃₄₅₆₇₈"[n - 1] + " an Stelle " + n + ".");
        }
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, { k }),
        solve(goal) { const s = goal && goal.solve; if (s && s.k != null) { k = s.k; paint(); } },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = Math.max(0, Math.round(v)); paint(); } },
        act(name, arg) { if (name === "next") { k += arg || 1; paint(); } if (name === "reset") { k = 0; paint(); } },
      };
    },
  });

  // ------------------------------------------------------------------ complex plane

  /* params: z [x, y], w [x, y], mode "sum" | "product" | "conj" | "roots", n (roots), dragW, range (3), polar
   * scope:  zx, zy, wx, wy, r, phi (degrees), rx, ry (result), n */
  LW.widget("complex", {
    mount(host, p, ctx) {
      const S = 360, Rg = p.range || 3;
      const svg = K.root(host, S, S, "Komplexe Zahlenebene");
      svg.style.maxWidth = "440px"; svg.style.margin = "0 auto";
      const x = K.scale(-Rg, Rg, 10, S - 10), y = K.scale(-Rg, Rg, S - 10, 10);
      for (let t = Math.ceil(-Rg); t <= Rg; t++) {
        K.svg("line", { x1: x(t), y1: y(-Rg), x2: x(t), y2: y(Rg), class: t === 0 ? "s-axis" : "s-grid" }, svg);
        K.svg("line", { x1: x(-Rg), y1: y(t), x2: x(Rg), y2: y(t), class: t === 0 ? "s-axis" : "s-grid" }, svg);
      }
      K.svg("circle", { cx: x(0), cy: y(0), r: x(1) - x(0), fill: "none", stroke: "var(--label-3)", "stroke-dasharray": "4 4" }, svg);
      K.text(svg, S - 16, y(0) - 10, "Re", "s-text", "end");
      K.text(svg, x(0) + 8, 20, "Im", "s-text", "start");
      let z = (p.z || [1, 1]).slice(), w = (p.w || [1, -0.5]).slice(), n = p.n || 3, mode = p.mode || "sum", locked = false;
      const g = K.svg("g", null, svg);
      const hz = K.svg("circle", { r: 18, class: "s-hit" }, svg);
      const hw = K.svg("circle", { r: 18, class: "s-hit" }, svg);
      const snap = (q) => [K.clamp(K.snap(x.inv(q.x), 0.25), -Rg, Rg), K.clamp(K.snap(y.inv(q.y), 0.25), -Rg, Rg)];
      K.drag(svg, hz, (q) => { if (locked) return; z = snap(q); paint(); ctx.changed(); });
      if (p.dragW !== false) K.drag(svg, hw, (q) => { if (locked) return; w = snap(q); paint(); ctx.changed(); });
      let sN = null;
      if (mode === "roots" && p.nSlider !== false) sN = K.slider(host, { label: "n", min: 2, max: 8, step: 1, value: n, format: (t) => K.fmt(t, 0), onInput: (t) => { n = t; paint(); ctx.changed(); } });
      const out = K.readout(host);
      const abs = (c) => Math.hypot(c[0], c[1]);
      const arg = (c) => Math.atan2(c[1], c[0]);
      const deg = (r) => { let d = (r * 180) / Math.PI; if (d < 0) d += 360; return d; };
      const cs = (c) => K.fmt(c[0], 2) + (c[1] < 0 ? " − " : " + ") + K.fmt(Math.abs(c[1]), 2) + "i";
      function result() {
        if (mode === "sum") return [z[0] + w[0], z[1] + w[1]];
        if (mode === "product") return [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
        if (mode === "conj") return [z[0], -z[1]];
        return null;
      }
      function arc(r, a0, a1, color) {
        const steps = 30, pts = [];
        for (let i = 0; i <= steps; i++) { const a = a0 + ((a1 - a0) * i) / steps; pts.push(x(r * Math.cos(a)) + "," + y(r * Math.sin(a))); }
        K.svg("polyline", { points: pts.join(" "), fill: "none", stroke: color, "stroke-width": 2 }, g);
      }
      function paint() {
        K.clear(g);
        const res = result();
        if (mode === "sum") {
          K.svg("polygon", { points: [[0, 0], z, res, w].map((q) => x(q[0]) + "," + y(q[1])).join(" "), fill: "var(--accent-soft)", stroke: "var(--label-3)", "stroke-dasharray": "4 4" }, g);
        }
        if (mode === "product") {
          arc(0.5, 0, arg(z), "var(--accent)");
          arc(0.7, 0, arg(w), "var(--orange)");
          arc(0.9, 0, arg(z) + arg(w), "var(--green)");
        }
        if (mode === "roots") {
          const r = Math.pow(abs(z), 1 / n), a = arg(z);
          K.svg("circle", { cx: x(0), cy: y(0), r: x(r) - x(0), fill: "none", stroke: "var(--green)", "stroke-dasharray": "3 4" }, g);
          const pts = [];
          for (let k2 = 0; k2 < n; k2++) { const t = (a + 2 * Math.PI * k2) / n; pts.push([r * Math.cos(t), r * Math.sin(t)]); }
          K.svg("polygon", { points: pts.map((q) => x(q[0]) + "," + y(q[1])).join(" "), fill: "color-mix(in srgb, var(--green) 14%, transparent)", stroke: "var(--green)", "stroke-width": 1.5 }, g);
          pts.forEach((q) => K.svg("circle", { cx: x(q[0]), cy: y(q[1]), r: 5, fill: "var(--green)" }, g));
        }
        K.arrow(g, x(0), y(0), x(z[0]), y(z[1]), "s-vec-accent", 3);
        K.text(g, x(z[0]) + 10, y(z[1]) - 12, "z", "s-text-strong", "start");
        if (mode === "sum" || mode === "product") {
          K.arrow(g, x(0), y(0), x(w[0]), y(w[1]), "s-vec-orange", 3);
          K.text(g, x(w[0]) + 10, y(w[1]) - 12, "w", "s-text-strong", "start");
        }
        if (res && abs(res) <= Rg * 1.5) {
          K.arrow(g, x(0), y(0), x(K.clamp(res[0], -Rg, Rg)), y(K.clamp(res[1], -Rg, Rg)), "s-vec-green", 3.4);
          K.text(g, x(K.clamp(res[0], -Rg, Rg)) + 10, y(K.clamp(res[1], -Rg, Rg)) + 14, mode === "sum" ? "z + w" : mode === "product" ? "z · w" : "z̄", "s-text-strong", "start");
        }
        K.svg("circle", { cx: x(z[0]), cy: y(z[1]), r: 7, class: "s-handle" }, g);
        hz.setAttribute("cx", x(z[0])); hz.setAttribute("cy", y(z[1]));
        if (mode === "sum" || mode === "product") { K.svg("circle", { cx: x(w[0]), cy: y(w[1]), r: 7, class: "s-handle", style: "stroke: var(--orange)" }, g); hw.setAttribute("cx", x(w[0])); hw.setAttribute("cy", y(w[1])); hw.style.display = ""; }
        else hw.style.display = "none";
        let html = "z = " + cs(z) + " &nbsp; |z| = " + K.fmt(abs(z), 3) + ", arg z = " + K.fmt(deg(arg(z)), 1) + "°";
        if (mode === "sum") html += "<br>z + w = <b>" + cs(res) + "</b>: komponentenweise, wie Vektoren";
        if (mode === "product") html += "<br>w = " + cs(w) + ", |w| = " + K.fmt(abs(w), 3) + ", arg w = " + K.fmt(deg(arg(w)), 1) + "°<br>z · w = <b>" + cs(res) + "</b>: Beträge " + K.fmt(abs(z), 2) + " · " + K.fmt(abs(w), 2) + " = " + K.fmt(abs(res), 2) + ", Winkel addieren sich zu " + K.fmt(deg(arg(res)), 1) + "°";
        if (mode === "conj") html += "<br>z̄ = <b>" + cs(res) + "</b>, z · z̄ = |z|² = " + K.fmt(abs(z) * abs(z), 3);
        if (mode === "roots") html += "<br>Die " + n + " Lösungen von xⁿ = z liegen auf dem Kreis mit Radius " + K.fmt(Math.pow(abs(z), 1 / n), 3) + " und bilden ein regelmäßiges " + n + "-Eck.";
        out.set(html);
        return { zx: z[0], zy: z[1], wx: w[0], wy: w[1], r: abs(z), phi: deg(arg(z)), rx: res ? res[0] : NaN, ry: res ? res[1] : NaN, n };
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s) { if (s.z) z = s.z.slice(); if (s.w) w = s.w.slice(); if (s.n) { n = s.n; if (sN) sN.set(n); } paint(); } },
        getVar: (k) => ({ zx: z[0], zy: z[1], wx: w[0], wy: w[1], n })[k],
        setVar(k, v) { if (k === "zx") z[0] = v; if (k === "zy") z[1] = v; if (k === "wx") w[0] = v; if (k === "wy") w[1] = v; if (k === "n") { n = Math.round(v); if (sN) sN.set(n); } paint(); },
        act(name, arg2) { if (name === "mode") { mode = arg2; paint(); } },
        lock() { locked = true; if (sN) sN.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ unit balls of norms

  /* params: point [x, y] (draggable), norms ["1", "2", "inf"] (outlines shown), p (extra p-norm with slider), pSlider
   * scope:  x, y, n1, n2, ninf, np, p */
  LW.widget("unitball", {
    mount(host, p, ctx) {
      const S = 340, Rg = 1.6;
      const svg = K.root(host, S, S, "Einheitskugeln");
      svg.style.maxWidth = "420px"; svg.style.margin = "0 auto";
      const x = K.scale(-Rg, Rg, 10, S - 10), y = K.scale(-Rg, Rg, S - 10, 10);
      [-1, 0, 1].forEach((t) => {
        K.svg("line", { x1: x(t), y1: y(-Rg), x2: x(t), y2: y(Rg), class: t === 0 ? "s-axis" : "s-grid" }, svg);
        K.svg("line", { x1: x(-Rg), y1: y(t), x2: x(Rg), y2: y(t), class: t === 0 ? "s-axis" : "s-grid" }, svg);
      });
      let pt = (p.point || [0.6, 0.5]).slice(), pp = p.p || 3, locked = false;
      const shown = p.norms || ["1", "2", "inf"];
      const g = K.svg("g", null, svg);
      const hit = K.svg("circle", { r: 18, class: "s-hit" }, svg);
      K.drag(svg, hit, (q) => { if (locked) return; pt = [K.clamp(K.snap(x.inv(q.x), 0.02), -Rg, Rg), K.clamp(K.snap(y.inv(q.y), 0.02), -Rg, Rg)]; paint(); ctx.changed(); });
      let sP = null;
      if (p.pSlider) sP = K.slider(host, { label: "p", min: 1, max: 10, step: 0.1, value: pp, format: (t) => K.fmt(t, 1), onInput: (t) => { pp = t; paint(); ctx.changed(); } });
      const out = K.readout(host);
      const COL = { "1": "var(--orange)", "2": "var(--accent)", inf: "var(--green)", p: "var(--teal)" };
      const norm = (v, q) => (q === "inf" ? Math.max(Math.abs(v[0]), Math.abs(v[1])) : Math.pow(Math.pow(Math.abs(v[0]), q) + Math.pow(Math.abs(v[1]), q), 1 / q));
      function ball(q, color) {
        const pts = [];
        for (let i = 0; i <= 200; i++) {
          const t = (i / 200) * 2 * Math.PI, d = [Math.cos(t), Math.sin(t)], r = 1 / norm(d, q);
          pts.push(x(d[0] * r) + "," + y(d[1] * r));
        }
        K.svg("polygon", { points: pts.join(" "), fill: "none", stroke: color, "stroke-width": 2.4 }, g);
      }
      function paint() {
        K.clear(g);
        shown.forEach((q) => ball(q === "inf" ? "inf" : +q, COL[q]));
        if (p.pSlider) ball(pp, COL.p);
        K.svg("line", { x1: x(0), y1: y(0), x2: x(pt[0]), y2: y(pt[1]), stroke: "var(--label)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, g);
        K.svg("circle", { cx: x(pt[0]), cy: y(pt[1]), r: 7, class: "s-handle" }, g);
        hit.setAttribute("cx", x(pt[0])); hit.setAttribute("cy", y(pt[1]));
        const n1 = norm(pt, 1), n2 = norm(pt, 2), ni = norm(pt, "inf"), np = norm(pt, pp);
        const pill = (name, v, col) => '<span style="color:' + col + ';font-weight:650">' + name + " = " + K.fmt(v, 3) + "</span>";
        out.set("v = (" + K.fmt(pt[0], 2) + " | " + K.fmt(pt[1], 2) + ") &nbsp; " + pill("‖v‖₁", n1, COL["1"]) + " &nbsp; " + pill("‖v‖₂", n2, COL["2"]) + " &nbsp; " + pill("‖v‖∞", ni, COL.inf) +
          (p.pSlider ? " &nbsp; " + pill("‖v‖_p", np, COL.p) : "") + "<br>Jede Linie ist die Menge aller Punkte mit Norm 1 in ihrer Norm.");
        return { x: pt[0], y: pt[1], n1, n2, ninf: ni, np, p: pp };
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s && s.point) { pt = s.point.slice(); paint(); } },
        getVar: (k) => ({ px: pt[0], py: pt[1], p: pp })[k],
        setVar(k, v) { if (k === "px") pt[0] = v; if (k === "py") pt[1] = v; if (k === "p") { pp = v; if (sP) sP.set(v); } paint(); },
        lock() { locked = true; if (sP) sP.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ derivation, one line after the other

  /* params: lines [{tex, why}], start (lines shown at the start, default all)
   * scope:  k */
  LW.widget("derivation", {
    mount(host, p, ctx) {
      const lines = p.lines || [];
      let k = p.start != null ? p.start : lines.length;
      const box = LW.el("div", { class: "lw-derivation" });
      host.append(box);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      const next = K.button(row, "Nächster Schritt", () => { if (k < lines.length) { k++; paint(); ctx.changed(); } });
      K.button(row, "Von vorn", () => { k = 0; paint(); ctx.changed(); });
      function paint() {
        box.innerHTML = "";
        lines.forEach((l, i) => {
          if (i >= k) return;
          const item = LW.el("div", { class: "lw-der-line" + (i === k - 1 ? " current" : "") });
          item.append(LW.el("div", { class: "lw-der-math", html: LW.math(l.tex, true) }));
          if (l.why) item.append(LW.el("div", { class: "lw-der-why lw-md", html: LW.md(l.why) }));
          box.append(item);
        });
        if (k === 0) box.append(LW.el("div", { class: "lw-der-empty", text: "Tippe auf »Nächster Schritt«." }));
        next.disabled = k >= lines.length;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, { k, total: lines.length }),
        solve() { k = lines.length; paint(); },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = K.clamp(Math.round(v), 0, lines.length); paint(); } },
        act(name) { if (name === "next" && k < lines.length) { k++; paint(); } if (name === "reset") { k = 0; paint(); } },
      };
    },
  });
})();
