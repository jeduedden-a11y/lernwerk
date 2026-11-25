/* More mathematics labs.
 *
 *   grenzlabor: sequences, series and limits of functions, typed by the learner.
 *     mode "folge":    a_n with the ε-strip around the limit and a draggable N; the lab finds limit, monotony, the least N.
 *     mode "reihe":    the partial sums s_n of Σ a_k and their limit.
 *     mode "funktion": f(x) near x0 with an ε-band and a δ-strip; does δ work, how large may it be, is there any δ at all?
 *     params: mode, term (a_n in n or f(x) in x), editable (input shown, default true), eps, N, x0, delta, limit (for f
 *             where f(x0) is not the limit), nmax, view
 *     scope:  folge/reihe: a1, a2, L, conv, mono (1 rising, -1 falling, 0 neither), bounded, eps, N, Nmin, ok (all terms from
 *             N on in the strip), S, sconv; funktion: x0, L, eps, delta, works, dmax, nodelta
 *   logiklabor: propositional formulas typed with keys, the truth table live, normal forms.
 *     params: formula, vars (["p", "q"] or with "r"), target (a formula to compare with)
 *     scope:  taut, sat, contra, col (result column as a number, first row = highest bit), rows, aeq (equivalent to target),
 *             and, or, not, imp, iff (counts of connectives), nvars
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const M = () => LW.labMath;

  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) { try { if (LW.expr(h.when)(scope)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } }
    return { correct: false, detail: goal.message || null };
  }

  /** An input line with a typeset preview and keys; calls onChange(text). */
  function termInput(host, label, value, keys, onChange) {
    const input = LW.el("input", { class: "lw-lab-input", type: "text", value, spellcheck: "false", autocapitalize: "off", autocomplete: "off", autocorrect: "off", "aria-label": "Term" });
    host.append(LW.el("div", { class: "lw-lab-row" }, [LW.el("span", { class: "lw-lab-label", html: LW.math(label), "aria-hidden": "true" }), input]));
    const line = LW.el("div", { class: "lw-lab-tex", "aria-live": "polite" });
    host.append(line);
    let caretSeen = false;
    input.addEventListener("focus", () => { caretSeen = true; });
    const range = () => (!caretSeen || input.selectionStart == null ? [input.value.length, input.value.length] : [input.selectionStart, input.selectionEnd == null ? input.selectionStart : input.selectionEnd]);
    const typeIn = (t) => { const [a, b] = range(); input.value = input.value.slice(0, a) + t + input.value.slice(b); try { input.setSelectionRange(a + t.length, a + t.length); } catch (e) { /* old WebKit */ } input.dispatchEvent(new Event("input")); };
    const erase = () => { const [a, b] = range(); if (a === b && a === 0) return; const s = a === b ? a - 1 : a; input.value = input.value.slice(0, s) + input.value.slice(b); try { input.setSelectionRange(s, s); } catch (e) { /* old WebKit */ } input.dispatchEvent(new Event("input")); };
    const row = LW.el("div", { class: "lw-lab-keys", role: "toolbar", "aria-label": "Zeichen" });
    keys.forEach((r) => {
      const kr = LW.el("div", { class: "lw-lab-keyrow" });
      r.forEach(([tex, ins, name]) => {
        const b = LW.el("button", { class: "lw-lab-key", type: "button", html: ins === "⌫" ? '<span class="lw-lab-erase" aria-hidden="true">⌫</span>' : LW.math(tex), "aria-label": name });
        const act = () => (ins === "⌫" ? erase() : typeIn(ins));
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); act(); });
        b.addEventListener("click", (e) => { e.preventDefault(); if (e.detail === 0) act(); });
        kr.append(b);
      });
      row.append(kr);
    });
    host.append(row);
    input.addEventListener("input", () => onChange(input.value));
    return { input, line, set(v) { input.value = v; } };
  }
  const B = "\\square";

  // ---------------------------------------------------------------- limits of sequences, series, functions
  LW.widget("grenzlabor", {
    mount(host, p, ctx) {
      const mode = p.mode || "folge";
      const fn = mode === "funktion";
      const v = fn ? "x" : mode === "reihe" ? "k" : "n";
      let src = p.term || (fn ? "x^2" : "(2n+1)/(n+3)");
      let cur = null, eps = p.eps || 0.1, N = p.N || 1, x0 = p.x0 != null ? p.x0 : 1, delta = p.delta || 0.5;
      const nmax = p.nmax || 60;
      const values = {};
      let input = null;
      if (p.editable !== false) {
        const keys = fn
          ? [[["x", "x", "x"], [B + "^{2}", "^2", "hoch zwei"], [B + "^{" + B + "}", "^", "hoch"], ["(", "(", "Klammer auf"], [")", ")", "Klammer zu"], ["\\frac{" + B + "}{" + B + "}", "/", "geteilt durch"], ["", "⌫", "löschen"]],
            [["\\sqrt{" + B + "}", "sqrt(", "Wurzel"], ["\\sin", "sin(", "Sinus"], ["\\left|" + B + "\\right|", "abs(", "Betrag"], ["\\operatorname{sgn}", "sign(", "Vorzeichen"], ["e^{" + B + "}", "e^(", "e hoch"], ["\\lfloor " + B + "\\rfloor", "floor(", "abrunden"]]]
          : [[[v, v, v], [B + "^{2}", "^2", "hoch zwei"], [B + "^{" + B + "}", "^", "hoch"], ["(", "(", "Klammer auf"], [")", ")", "Klammer zu"], ["\\frac{" + B + "}{" + B + "}", "/", "geteilt durch"], ["", "⌫", "löschen"]],
            [["(-1)^" + v, "(-1)^" + v, "minus eins hoch " + v], ["\\sqrt{" + B + "}", "sqrt(", "Wurzel"], ["\\sin", "sin(", "Sinus"], ["e^{" + B + "}", "e^(", "e hoch"], ["\\ln", "ln(", "Logarithmus"], [v + "!", "fact(" + v + ")", v + " Fakultät"]]];
        input = termInput(host, fn ? "f(x) =" : mode === "reihe" ? "a_k =" : "a_n =", src, keys, (t) => { src = t; update(); ctx.changed(); });
      } else {
        host.append(LW.el("div", { class: "lw-lab-tex" }));
      }
      const sliders = LW.el("div", { class: "lw-lab-sliders" });
      host.append(sliders);
      const ctl = LW.el("div", { class: "lw-lab-sliders" });
      host.append(ctl);
      let sEps = null, sN = null, sX = null, sD = null;
      if (mode !== "reihe") sEps = K.slider(ctl, { label: "ε", labelHtml: LW.math("\\varepsilon"), min: 0.01, max: p.epsMax || 1, step: 0.01, value: eps, format: (x) => K.fmt(x, 2), onInput: (x) => { eps = x; paint(); ctx.changed(); } });
      if (mode === "folge") sN = K.slider(ctl, { label: "N", labelHtml: LW.math("N"), min: 1, max: nmax, step: 1, value: N, format: (x) => String(x), onInput: (x) => { N = x; paint(); ctx.changed(); } });
      if (fn) {
        sX = K.slider(ctl, { label: "x0", labelHtml: LW.math("x_0"), min: -3, max: 3, step: 0.5, value: x0, format: (x) => K.fmt(x, 1), onInput: (x) => { x0 = x; update(); ctx.changed(); } });
        sD = K.slider(ctl, { label: "δ", labelHtml: LW.math("\\delta"), min: 0.001, max: 1.5, step: 0.001, value: delta, format: (x) => K.fmt(x, 3), onInput: (x) => { delta = x; paint(); ctx.changed(); } });
      }
      const W = 360, H = 250;
      const svg = K.root(host, W, H, fn ? "Funktion mit ε-Band und δ-Streifen" : mode === "reihe" ? "Partialsummen" : "Folge mit ε-Schlauch");
      svg.style.touchAction = "pan-y";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);

      const f = (t) => (cur ? cur.f(t) : NaN);
      let st = {};
      function analyse() {
        st = {};
        if (!cur) return;
        if (fn) {
          const L = p.limit != null ? p.limit : f(x0);
          const worksFor = (d, e) => {
            for (let i = 1; i <= 400; i++) {
              const h = (d * i) / 401;
              for (const x of [x0 - h, x0 + h]) { const y = f(x); if (!isFinite(y) || Math.abs(y - L) >= e) return false; }
            }
            return true;
          };
          let lo = 0, hi = 1.5;
          if (worksFor(hi, eps)) lo = hi;
          else for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (worksFor(m, eps)) lo = m; else hi = m; }
          st = { x0, L, eps, delta, works: isFinite(L) && worksFor(delta, eps) ? 1 : 0, dmax: lo, nodelta: isFinite(L) && !worksFor(1e-4, eps) ? 1 : 0 };
          return;
        }
        const a = [];
        for (let n = 1; n <= Math.max(nmax, 400); n++) a.push(f(n));
        const big = [1e3, 1e4, 1e5, 1e6].map(f);
        let conv = big.every(isFinite) && Math.abs(big[3] - big[2]) < 1e-4 * Math.max(1, Math.abs(big[3])) && Math.abs(big[2] - big[1]) < 1e-3 * Math.max(1, Math.abs(big[3])) ? 1 : 0;
        let L = conv ? big[3] : NaN;
        if (conv && Math.abs(L - Math.round(L * 1000) / 1000) < 2e-5) L = Math.round(L * 1000) / 1000;
        let up = true, down = true;
        for (let i = 0; i + 1 < 200; i++) { if (!(a[i + 1] > a[i])) up = false; if (!(a[i + 1] < a[i])) down = false; }
        const bounded = conv || a.slice(0, 400).every((x) => isFinite(x) && Math.abs(x) < 1e6) ? (conv ? 1 : 0) : 0;
        // least N: from there on every term within eps (checked up to 2000, then the far tail)
        let Nmin = NaN;
        if (conv) {
          const tailOk = big.every((x) => Math.abs(x - L) < eps);
          let last = 0;
          for (let n = 1; n <= 2000; n++) { const y = n <= a.length ? a[n - 1] : f(n); if (!(Math.abs(y - L) < eps)) last = n; }
          Nmin = tailOk ? last + 1 : NaN;
        }
        let okN = 0;
        if (conv && N >= 1) { okN = 1; for (let n = N; n <= 2000; n++) { const y = n <= a.length ? a[n - 1] : f(n); if (!(Math.abs(y - L) < eps)) { okN = 0; break; } } }
        // series
        let S = NaN, sconv = 0;
        if (mode === "reihe") {
          let s = 0, s4 = NaN;
          for (let k = 1; k <= 100000; k++) { s += f(k); if (k === 10000) s4 = s; }
          sconv = isFinite(s) && Math.abs(s - s4) < 1e-3 * Math.max(1, Math.abs(s)) ? 1 : 0;
          S = sconv ? s : NaN;
          if (sconv && Math.abs(S - Math.round(S * 1000) / 1000) < 1e-4) S = Math.round(S * 1000) / 1000;
        }
        st = { a1: a[0], a2: a[1], L, conv, mono: up ? 1 : down ? -1 : 0, bounded, eps, N, Nmin, ok: okN, S, sconv };
      }
      function update() {
        const r = M().compile(src, [v], values);
        if (r.error) { cur = null; if (input) { input.line.classList.add("err"); input.line.textContent = src.trim() ? r.error : ""; } }
        else {
          cur = r;
          if (input) { input.line.classList.remove("err"); const t = M().toTex(r.src); input.line.innerHTML = t ? LW.math((fn ? "f(x) = " : mode === "reihe" ? "a_k = " : "a_n = ") + t) : ""; }
          else host.querySelector(".lw-lab-tex").innerHTML = LW.math((fn ? "f(x) = " : "a_n = ") + (M().toTex(r.src) || ""));
        }
        const names = (r && r.names) || [];
        if ([...sliders.children].map((x) => x.dataset.name).join() !== names.join()) {
          sliders.innerHTML = "";
          names.forEach((nm) => {
            if (values[nm] == null) values[nm] = 1;
            const s = K.slider(sliders, { label: nm, labelHtml: LW.math(nm), min: -5, max: 5, step: 0.1, value: values[nm], onInput: (x) => { values[nm] = x; if (cur) cur.scope[nm] = x; analyse(); paint(); ctx.changed(); } });
            s.el.dataset.name = nm;
          });
        }
        paint();
      }
      function paint() {
        K.clear(g);
        analyse();
        if (!cur) { out.set(""); return; }
        const L0 = 36, R0 = W - 12, T0 = 12, B0 = H - 26;
        if (fn) {
          const L = st.L, xa = x0 - 2, xb = x0 + 2;
          let ya = Infinity, yb = -Infinity;
          for (let i = 0; i <= 200; i++) { const y = f(xa + ((xb - xa) * i) / 200); if (isFinite(y)) { ya = Math.min(ya, y); yb = Math.max(yb, y); } }
          if (isFinite(L)) { ya = Math.min(ya, L - 1.2); yb = Math.max(yb, L + 1.2); }
          if (!isFinite(ya)) { ya = -2; yb = 2; }
          const sx = K.scale(xa, xb, L0, R0), sy = K.scale(ya, yb, B0, T0);
          K.svg("line", { x1: L0, y1: B0, x2: R0, y2: B0, class: "s-axis" }, g);
          K.ticks(xa, xb, 6).forEach((t) => K.text(g, sx(t), B0 + 12, K.fmt(t, 2), "s-text"));
          K.ticks(ya, yb, 5).forEach((t) => K.text(g, L0 - 5, sy(t), K.fmt(t, 2), "s-text", "end"));
          if (isFinite(L)) {
            K.svg("rect", { x: L0, y: sy(L + eps), width: R0 - L0, height: Math.max(1, sy(L - eps) - sy(L + eps)), fill: "var(--green)", opacity: 0.14 }, g);
            K.svg("line", { x1: L0, y1: sy(L), x2: R0, y2: sy(L), stroke: "var(--green)", "stroke-dasharray": "4 4" }, g);
          }
          K.svg("rect", { x: sx(x0 - delta), y: T0, width: Math.max(1, sx(x0 + delta) - sx(x0 - delta)), height: B0 - T0, fill: "var(--accent)", opacity: 0.12 }, g);
          // the graph: green inside the strip and the band, red where it leaves the band
          let d = "", dIn = "", dOut = "", prev = null;
          for (let i = 0; i <= 600; i++) {
            const x = xa + ((xb - xa) * i) / 600, y = f(x);
            if (!isFinite(y) || (prev != null && Math.abs(y - prev) > (yb - ya) * 0.5)) { prev = null; d += ""; continue; }
            const P = sx(x).toFixed(1) + "," + K.clamp(sy(y), -500, 900).toFixed(1);
            const inStrip = Math.abs(x - x0) < delta;
            const seg = (prev == null ? "M" : "L") + P;
            d += seg;
            if (inStrip) { if (Math.abs(y - L) < eps) dIn += seg; else dOut += (prev == null ? "M" : "L") + P; }
            prev = y;
          }
          K.svg("path", { d, fill: "none", stroke: "var(--label-3)", "stroke-width": 2 }, g);
          K.svg("path", { d: dIn, fill: "none", stroke: "var(--green)", "stroke-width": 3 }, g);
          K.svg("path", { d: dOut, fill: "none", stroke: "var(--red)", "stroke-width": 3 }, g);
          out.set(LW.esc("Grenzwert L = " + K.fmt(st.L, 4) + " bei x₀ = " + K.fmt(x0, 2) + ".") + "<br>" +
            (st.works ? K.pill(true, "δ = " + K.fmt(delta, 3) + " passt zu ε = " + K.fmt(eps, 2)) : K.pill(false, "δ = " + K.fmt(delta, 3) + " ist zu groß")) +
            " " + LW.esc(st.nodelta ? "Zu diesem ε passt kein δ: unstetig." : "Größtes passendes δ ≈ " + K.fmt(st.dmax, 3) + "."));
          return;
        }
        // sequences and series
        const n0 = Math.min(nmax, 60);
        const ys = [];
        let s = 0;
        for (let n = 1; n <= n0; n++) { const y = f(n); s += y; ys.push(mode === "reihe" ? s : y); }
        const ref = mode === "reihe" ? st.S : st.L;
        let ya = Math.min(...ys.filter(isFinite)), yb = Math.max(...ys.filter(isFinite));
        if (isFinite(ref)) { ya = Math.min(ya, ref - (mode === "folge" ? eps : 0) - 0.1); yb = Math.max(yb, ref + (mode === "folge" ? eps : 0) + 0.1); }
        if (!isFinite(ya) || ya === yb) { ya -= 1; yb += 1; }
        const pad = (yb - ya) * 0.08;
        const sx = K.scale(0, n0 + 1, L0, R0), sy = K.scale(ya - pad, yb + pad, B0, T0);
        K.svg("line", { x1: L0, y1: B0, x2: R0, y2: B0, class: "s-axis" }, g);
        K.ticks(1, n0, 6).forEach((t) => K.text(g, sx(t), B0 + 12, String(Math.round(t)), "s-text"));
        K.ticks(ya - pad, yb + pad, 5).forEach((t) => K.text(g, L0 - 5, sy(t), K.fmt(t, 2), "s-text", "end"));
        if (isFinite(ref)) {
          if (mode === "folge") K.svg("rect", { x: L0, y: sy(ref + eps), width: R0 - L0, height: Math.max(1, sy(ref - eps) - sy(ref + eps)), fill: "var(--green)", opacity: 0.15 }, g);
          K.svg("line", { x1: L0, y1: sy(ref), x2: R0, y2: sy(ref), stroke: "var(--green)", "stroke-dasharray": "4 4" }, g);
        }
        if (mode === "folge") K.svg("line", { x1: sx(N - 0.5), y1: T0, x2: sx(N - 0.5), y2: B0, stroke: "var(--accent)", "stroke-width": 2 }, g);
        ys.forEach((y, i) => {
          if (!isFinite(y)) return;
          const n = i + 1, bad = mode === "folge" && n >= N && isFinite(ref) && !(Math.abs(y - ref) < eps);
          K.svg("circle", { cx: sx(n), cy: K.clamp(sy(y), -50, H + 50), r: 3.2, fill: bad ? "var(--red)" : n >= N || mode === "reihe" ? "var(--accent)" : "var(--label-3)" }, g);
        });
        if (mode === "reihe") {
          out.set(LW.esc(st.sconv ? "Die Reihe konvergiert, Summe ≈ " + K.fmt(st.S, 4) + "." : "Die Partialsummen konvergieren nicht (oder sehr langsam).") + "<br>" +
            LW.esc("a₁ = " + K.fmt(st.a1, 4) + (st.conv ? ", die Glieder gehen gegen " + K.fmt(st.L, 4) : ", die Glieder konvergieren nicht") + "."));
        } else {
          out.set(LW.esc((st.conv ? "Grenzwert ≈ " + K.fmt(st.L, 4) : "keine Konvergenz erkennbar") + " · a₁ = " + K.fmt(st.a1, 4) + " · " + (st.mono === 1 ? "streng monoton wachsend" : st.mono === -1 ? "streng monoton fallend" : "nicht monoton")) + "<br>" +
            (st.conv ? (st.ok ? K.pill(true, "ab N = " + N + " alle im ε-Schlauch") : K.pill(false, "ab N = " + N + " noch Glieder draußen")) + " " + LW.esc(isFinite(st.Nmin) ? "Kleinstes N: " + st.Nmin : "") : ""));
        }
      }
      update();
      return {
        check: (goal) => checkGoal(goal, st),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.term != null) { src = s.term; if (input) input.set(src); Object.keys(values).forEach((k) => delete values[k]); sliders.innerHTML = ""; }
          if (s.eps != null) { eps = s.eps; if (sEps) sEps.set(eps); }
          if (s.N != null) { N = s.N; if (sN) sN.set(N); }
          if (s.x0 != null) { x0 = s.x0; if (sX) sX.set(x0); }
          if (s.delta != null) { delta = s.delta; if (sD) sD.set(delta); }
          update();
        },
        getVar: (k) => st[k],
      };
    },
  });

  // ---------------------------------------------------------------- propositional logic
  /** Parses p, q, r, ¬, ∧, ∨, →, ↔ (also !, &, |, ->, <->, and, or, not) into a tree. */
  function parseLogic(src) {
    const s = String(src).replace(/<->|<=>|⇔/g, "↔").replace(/->|=>|⇒/g, "→").replace(/&&?|∧|\band\b|\bund\b/gi, "∧").replace(/\|\|?|∨|\bor\b|\boder\b/gi, "∨").replace(/!|~|¬|\bnot\b|\bnicht\b/gi, "¬");
    const toks = s.replace(/\s+/g, "").split("");
    let i = 0;
    const peek = () => toks[i];
    function atom() {
      const t = toks[i++];
      if (t === "(") { const e = iff(); if (toks[i++] !== ")") throw new Error("Klammer fehlt"); return e; }
      if (t === "¬") return { op: "not", a: atom() };
      if (/^[pqrs]$/.test(t)) return { op: "var", v: t };
      if (t === "1" || t === "w") return { op: "const", v: true };
      if (t === "0" || t === "f") return { op: "const", v: false };
      throw new Error("Unerwartetes Zeichen " + (t || "am Ende"));
    }
    function and() { let e = atom(); while (peek() === "∧") { i++; e = { op: "and", a: e, b: atom() }; } return e; }
    function or() { let e = and(); while (peek() === "∨") { i++; e = { op: "or", a: e, b: and() }; } return e; }
    function imp() { const e = or(); if (peek() === "→") { i++; return { op: "imp", a: e, b: imp() }; } return e; }
    function iff() { let e = imp(); while (peek() === "↔") { i++; e = { op: "iff", a: e, b: imp() }; } return e; }
    const tree = iff();
    if (i < toks.length) throw new Error("Unerwartetes Zeichen " + toks[i]);
    return tree;
  }
  function evalLogic(t, env) {
    switch (t.op) {
      case "var": return !!env[t.v];
      case "const": return t.v;
      case "not": return !evalLogic(t.a, env);
      case "and": return evalLogic(t.a, env) && evalLogic(t.b, env);
      case "or": return evalLogic(t.a, env) || evalLogic(t.b, env);
      case "imp": return !evalLogic(t.a, env) || evalLogic(t.b, env);
      default: return evalLogic(t.a, env) === evalLogic(t.b, env);
    }
  }
  function logicTex(t, parent) {
    const PREC = { iff: 1, imp: 2, impL: 3, or: 3, and: 4, not: 5, var: 6, const: 6 };
    const wrap = (s, op) => (parent && PREC[op] < PREC[parent] ? "(" + s + ")" : s);
    switch (t.op) {
      case "var": return t.v;
      case "const": return t.v ? "\\top" : "\\bot";
      case "not": return "\\neg " + logicTex(t.a, "not");
      case "and": return wrap(logicTex(t.a, "and") + " \\land " + logicTex(t.b, "and"), "and");
      case "or": return wrap(logicTex(t.a, "or") + " \\lor " + logicTex(t.b, "or"), "or");
      case "imp": return wrap(logicTex(t.a, "impL") + " \\rightarrow " + logicTex(t.b, "imp"), "imp");
      default: return wrap(logicTex(t.a, "imp") + " \\leftrightarrow " + logicTex(t.b, "imp"), "iff");
    }
  }
  const count = (t, op) => (!t ? 0 : (t.op === op ? 1 : 0) + count(t.a, op) + count(t.b, op));
  const varsOf = (t, set) => { if (!t) return set; if (t.op === "var") set.add(t.v); varsOf(t.a, set); varsOf(t.b, set); return set; };
  function rowsFor(vars) {
    const out = [];
    for (let m = (1 << vars.length) - 1; m >= 0; m--) { const env = {}; vars.forEach((v, k) => { env[v] = !!(m & (1 << (vars.length - 1 - k))); }); out.push(env); }
    return out;
  }

  LW.widget("logiklabor", {
    mount(host, p, ctx) {
      const vars = p.vars || ["p", "q"];
      let src = p.formula || "";
      let tree = null, err = "";
      const target = p.target ? (() => { try { return parseLogic(p.target); } catch (e) { return null; } })() : null;
      const keys = [[["p", "p", "p"], ["q", "q", "q"]].concat(vars.includes("r") ? [["r", "r", "r"]] : []).concat([["(", "(", "Klammer auf"], [")", ")", "Klammer zu"], ["", "⌫", "löschen"]]),
        [["\\neg", "¬", "nicht"], ["\\land", "∧", "und"], ["\\lor", "∨", "oder"], ["\\rightarrow", "→", "wenn, dann"], ["\\leftrightarrow", "↔", "genau dann, wenn"]]];
      const inp = termInput(host, "\\varphi =", src, keys, (t) => { src = t; update(); ctx.changed(); });
      inp.input.setAttribute("aria-label", "Formel");
      const tableBox = LW.el("div", { class: "lw-logic-table" });
      host.append(tableBox);
      const out = K.readout(host);
      let st = {};
      function update() {
        err = ""; tree = null;
        if (src.trim()) { try { tree = parseLogic(src); } catch (e) { err = e.message; } }
        if (err) { inp.line.classList.add("err"); inp.line.textContent = err; }
        else { inp.line.classList.remove("err"); inp.line.innerHTML = tree ? LW.math("\\varphi = " + logicTex(tree)) : ""; }
        const used = tree ? [...varsOf(tree, new Set())] : [];
        const all = vars.slice();
        used.forEach((u) => { if (!all.includes(u)) all.push(u); });
        const rows = rowsFor(all);
        const vals = tree ? rows.map((env) => evalLogic(tree, env)) : [];
        const tv = target ? rows.map((env) => evalLogic(target, env)) : null;
        let col = 0;
        vals.forEach((x) => { col = col * 2 + (x ? 1 : 0); });
        st = { taut: tree && vals.every(Boolean) ? 1 : 0, sat: vals.some(Boolean) ? 1 : 0, contra: tree && !vals.some(Boolean) ? 1 : 0, col: tree ? col : -1, rows: rows.length,
          aeq: tree && tv ? (vals.every((x, k) => x === tv[k]) ? 1 : 0) : 0, and: count(tree, "and"), or: count(tree, "or"), not: count(tree, "not"), imp: count(tree, "imp"), iff: count(tree, "iff"), nvars: used.length };
        // the table
        let html = '<table><thead><tr>' + all.map((x) => "<th>" + LW.math(x) + "</th>").join("") + "<th>" + LW.math("\\varphi") + "</th>" + (tv ? "<th>Ziel</th>" : "") + "</tr></thead><tbody>";
        rows.forEach((env, k) => {
          html += "<tr>" + all.map((x) => "<td>" + (env[x] ? "w" : "f") + "</td>").join("") +
            (tree ? '<td class="' + (vals[k] ? "w" : "f") + '"><b>' + (vals[k] ? "w" : "f") + "</b></td>" : "<td>–</td>") +
            (tv ? '<td class="' + (tree && vals[k] === tv[k] ? "same" : "diff") + '">' + (tv[k] ? "w" : "f") + "</td>" : "") + "</tr>";
        });
        tableBox.innerHTML = html + "</tbody></table>";
        if (!tree) { out.set(""); return; }
        // normal forms
        const dnf = rows.filter((env, k) => vals[k]).map((env) => "(" + all.map((x) => (env[x] ? x : "\\neg " + x)).join(" \\land ") + ")");
        out.set((st.taut ? K.pill(true, "Tautologie") : st.contra ? K.pill(false, "Kontradiktion") : K.pill(true, "erfüllbar")) + (tv ? " " + (st.aeq ? K.pill(true, "äquivalent zum Ziel") : K.pill(false, "nicht äquivalent zum Ziel")) : "") +
          "<br>" + LW.esc("Disjunktive Normalform: ") + (dnf.length ? LW.math(dnf.join(" \\lor ")) : LW.math("\\bot")));
      }
      update();
      return {
        check: (goal) => checkGoal(goal, st),
        solve(goal) { const s = (goal && goal.solve) || {}; if (s.formula != null) { src = s.formula; inp.set(src); update(); } },
        getVar: (k) => st[k],
      };
    },
  });

  LW.labLogic = { parseLogic, evalLogic, logicTex, rowsFor, varsOf, count };
})();
