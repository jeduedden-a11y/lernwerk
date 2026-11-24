/* Labs for mathematics.
 *
 *   funklabor: the function lab. The learner types a function and sees it at once.
 *     mode "r1": f(x) with sliders for parameters, f', f'', tangent at a draggable point, integral between two markers,
 *                zeros, extrema and inflection points marked; drag the background to move, buttons to zoom.
 *     mode "r2": f(x, y) as a surface that turns with a finger, or as level curves with a draggable point, its gradient
 *                and the type of a critical point.
 *     params: mode, f (start expression), view {x: [a, b], y: [c, d]}, show {d1, d2, tangent, area}, task
 *     task:   {conditions: [{c, show}], sample}; c is "f(2) = 0", "f'(1) > 0", "fx(0,0) = 0", "gerade", "ungerade",
 *             "periode 4", "pol 2", "asymptote 1", "grenze+ 5", "grenze- 0", "grad 3", "int(0,2) = 4", "exponentiell",
 *             "begrenzt 100", "min 1,2", "max 0,0", "sattel 0,0", "rotsym", "steigend 0,3", "fallend 1,2";
 *             c may be a list of such strings that together make one line of the goal list (a Hochpunkt is three).
 *     The task is met when every condition holds; the list ticks itself off while the learner types.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const COLORS = { accent: "var(--accent)", orange: "var(--orange)", green: "var(--green)", red: "var(--red)", teal: "var(--teal)",
    blue: "var(--blue)", label: "var(--label)", gray: "var(--label-2)", faint: "var(--label-3)", yellow: "var(--yellow)" };
  const col = (c) => COLORS[c] || c || "var(--accent)";
  const RAD = Math.PI / 180;

  // ---------------------------------------------------------------- expressions typed by the learner
  const FUNCS = ["sin", "cos", "tan", "exp", "ln", "log", "sqrt", "abs", "floor", "ceil", "round", "sign", "atan", "min", "max", "fact"];
  const CONSTS = ["pi", "e"];
  const KNOWN = new Set(FUNCS.concat(CONSTS));

  /** School notation to the runtime's expressions: x², √, π, ·, decimal commas, implicit products such as 2x or ax. */
  function normalize(src, vars) {
    let s = String(src || "").trim();
    s = s.replace(/^\s*(f\s*\(\s*[xy\s,]*\)|y|z)\s*=\s*/i, "");
    s = s.replace(/²/g, "^2").replace(/³/g, "^3").replace(/[·×]/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi")
      .replace(/√\s*\(/g, "sqrt(").replace(/√\s*([a-z0-9.]+)/gi, "sqrt($1)").replace(/(\d),(\d)/g, "$1.$2");
    // letters glued together (ax, xy) are products unless they form a known name; sinx is sin(x)
    s = s.replace(/[A-Za-z]+/g, (w) => {
      const low = w.toLowerCase();
      if (KNOWN.has(low)) return low;
      if (w.length === 1) return w;
      for (const f of FUNCS) {
        if (low.startsWith(f) && low.length > f.length && FUNCS.indexOf(low) < 0) return f + "(" + low.slice(f.length).split("").join("*") + ")";
      }
      for (const f of FUNCS) if (low.endsWith(f) && low.length > f.length) return low.slice(0, -f.length).split("").join("*") + "*" + f;
      return w.split("").join("*");
    });
    // a(x-1)^2 is a·(x-1)^2: a single letter before a bracket is a product, never a call
    s = s.replace(/(^|[^A-Za-z_])([A-Za-z])\s*\(/g, "$1$2*(");
    return s;
  }

  /** The parameters of an expression: single letters other than the variables and e. */
  function paramsOf(s, vars) {
    const out = [];
    (s.match(/[A-Za-z]+/g) || []).forEach((w) => {
      if (w.length === 1 && !vars.includes(w) && w !== "e" && !out.includes(w)) out.push(w);
    });
    return out;
  }

  function compile(src, vars, values) {
    const s = normalize(src, vars);
    if (!s) return { error: "Gib eine Funktion ein." };
    const names = paramsOf(s, vars);
    let fn;
    try { fn = LW.expr(s); } catch (e) { return { error: "Diesen Ausdruck verstehe ich nicht.", names }; }
    const scope = Object.assign({}, values);
    names.forEach((n) => { if (scope[n] == null) scope[n] = 1; });
    const f = vars.length === 1
      ? (x) => { scope[vars[0]] = x; try { const v = fn(scope); return typeof v === "number" ? v : NaN; } catch (e) { return NaN; } }
      : (x, y) => { scope[vars[0]] = x; scope[vars[1]] = y; try { const v = fn(scope); return typeof v === "number" ? v : NaN; } catch (e) { return NaN; } };
    // a test at a few points finds unknown names
    let ok = false;
    for (const t of [0.37, 1.3, -2.1, 3.7, 7.9, 12.5, -9.4, 25]) { const v = vars.length === 1 ? f(t) : f(t, -t / 2); if (isFinite(v)) { ok = true; break; } }
    if (!ok) {
      try { fn(Object.assign({ x: 0.37, y: 0.2 }, scope)); } catch (e) { return { error: "Unbekannter Name oder fehlende Klammer.", names }; }
      return { error: "Die Funktion liefert nirgends einen Wert. Prüfe Namen und Klammern.", names };
    }
    return { f, names, scope, src: s };
  }

  /** The term as TeX for the line under the input: fractions, powers, roots and function names typeset.
   *  Same grammar as LW.expr, so the picture shows what the lab computes (1/2x is ½·x). null if it does not parse. */
  function toTex(src) {
    const toks = [];
    const re = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|([A-Za-z_][A-Za-z_0-9]*)|(\*\*|[-+*/^(),!]))/gy;
    while (re.lastIndex < src.length) {
      const at = re.lastIndex;
      const m = re.exec(src);
      if (!m) { if (/^\s*$/.test(src.slice(at))) break; return null; }
      if (m[1]) toks.push({ t: "num", v: m[1] });
      else if (m[2]) toks.push({ t: "id", v: m[2] });
      else toks.push({ t: "op", v: m[3] === "**" ? "^" : m[3] });
    }
    let p = 0;
    const isOp = (v) => toks[p] && toks[p].t === "op" && toks[p].v === v;
    const starts = () => toks[p] && (toks[p].t === "num" || toks[p].t === "id" || isOp("("));
    function primary() {
      const tk = toks[p++];
      if (!tk) throw new Error("end");
      if (tk.t === "num") return { t: "num", v: tk.v };
      if (tk.t === "op" && tk.v === "(") { const e = add(); if (!isOp(")")) throw new Error(")"); p++; return { t: "par", a: e }; }
      if (tk.t === "op" && tk.v === "-") return { t: "neg", a: power() };
      if (tk.t === "op" && tk.v === "+") return power();
      if (tk.t === "id") {
        if (!isOp("(")) return { t: "id", v: tk.v };
        p++;
        const args = [add()];
        while (isOp(",")) { p++; args.push(add()); }
        if (!isOp(")")) throw new Error(")");
        p++;
        return { t: "call", f: tk.v, args };
      }
      throw new Error("symbol");
    }
    function postfix() { let e = primary(); while (isOp("!")) { p++; e = { t: "fact", a: e }; } return e; }
    function power() { const b = postfix(); if (isOp("^")) { p++; return { t: "pow", a: b, b: unary() }; } return b; }
    function unary() { if (isOp("-")) { p++; return { t: "neg", a: unary() }; } if (isOp("+")) { p++; return unary(); } return power(); }
    function mul() {
      let e = unary();
      for (;;) {
        if (isOp("*") || isOp("/")) { const op = toks[p++].v; e = { t: "mul", op, a: e, b: unary() }; }
        else if (starts()) e = { t: "mul", op: "", a: e, b: unary() };
        else return e;
      }
    }
    function add() {
      let e = mul();
      while (isOp("+") || isOp("-")) { const op = toks[p++].v; e = { t: "add", op, a: e, b: mul() }; }
      return e;
    }
    let tree;
    try { tree = add(); } catch (e) { return null; }
    if (p < toks.length) return null;
    const NAMED = { sin: "\\sin", cos: "\\cos", tan: "\\tan", ln: "\\ln", log: "\\log", exp: "\\exp", min: "\\min", max: "\\max", atan: "\\arctan" };
    const strip = (n) => (n.t === "par" ? n.a : n);
    const simple = (n) => n.t === "num" || n.t === "id";
    const wrap = (t) => "\\left(" + t + "\\right)";
    function tex(n) {
      switch (n.t) {
        case "num": return (n.v[0] === "." ? "0" + n.v : n.v).replace(".", "{,}");
        case "id": return n.v === "pi" ? "\\pi" : n.v.length > 1 ? "\\mathrm{" + n.v + "}" : n.v;
        case "par": return wrap(tex(n.a));
        case "neg": return "-" + (n.a.t === "add" || n.a.t === "neg" ? wrap(tex(n.a)) : tex(n.a));
        case "fact": return (simple(n.a) || n.a.t === "par" ? tex(n.a) : wrap(tex(n.a))) + "!";
        case "add": return tex(n.a) + (n.op === "+" ? " + " : " - ") + (n.b.t === "neg" ? wrap(tex(n.b)) : tex(n.b));
        case "mul": {
          if (n.op === "/") {
            // -(x-1)/(x-2) reads as minus a fraction
            const top = strip(n.a);
            if (top.t === "neg") return "-\\frac{" + tex(strip(top.a)) + "}{" + tex(strip(n.b)) + "}";
            return "\\frac{" + tex(top) + "}{" + tex(strip(n.b)) + "}";
          }
          const R = n.b;
          // a dot where juxtaposition would read wrongly: 2·3, x·2, 2·½, 3·2^x
          const dot = R.t === "num" || R.t === "neg" || R.t === "fact" || (R.t === "mul" && R.op === "/") || (R.t === "pow" && R.a.t === "num");
          const thin = !dot && R.t === "call" && !simple(n.a);
          return tex(n.a) + (dot ? " \\cdot " : thin ? "\\," : "") + tex(R);
        }
        case "pow": {
          const base = simple(n.a) || n.a.t === "par" || n.a.t === "call" ? tex(n.a) : wrap(tex(n.a));
          return "{" + base + "}^{" + tex(strip(n.b)) + "}";
        }
        case "call": {
          const args = n.args.map((a) => tex(a));
          if (n.f === "sqrt") return "\\sqrt{" + args[0] + "}";
          if (n.f === "abs") return "\\left|" + args[0] + "\\right|";
          if (n.f === "exp") return "e^{" + args[0] + "}";
          const name = NAMED[n.f] || "\\operatorname{" + n.f + "}";
          return name + (n.args.length === 1 && simple(n.args[0]) ? "(" + args[0] + ")" : wrap(args.join(", ")));
        }
      }
      return "";
    }
    return tex(tree);
  }

  // keys in the shape the learner knows from the exercise book: [TeX on the key, text it types, spoken name]
  const BOX = "\\square";
  const KEYS_A = [["x", "x", "x"], [BOX + "^{2}", "^2", "hoch zwei"], [BOX + "^{" + BOX + "}", "^", "hoch"], ["(", "(", "Klammer auf"], [")", ")", "Klammer zu"],
    ["\\cdot", "*", "mal"], ["\\frac{" + BOX + "}{" + BOX + "}", "/", "geteilt durch"]];
  const KEYS_B = [["\\sqrt{" + BOX + "}", "sqrt(", "Wurzel"], ["\\sin", "sin(", "Sinus"], ["\\cos", "cos(", "Kosinus"], ["\\tan", "tan(", "Tangens"], ["e^{" + BOX + "}", "e^(", "e hoch"],
    ["\\ln", "ln(", "natürlicher Logarithmus"], ["\\left|" + BOX + "\\right|", "abs(", "Betrag"], ["\\pi", "pi", "pi"]];

  // numeric derivatives
  const d1 = (f, x) => { const h = 1e-4 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
  const d2 = (f, x) => { const h = 1e-3 * Math.max(1, Math.abs(x)); return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };
  const px = (f, x, y) => { const h = 1e-4 * Math.max(1, Math.abs(x)); return (f(x + h, y) - f(x - h, y)) / (2 * h); };
  const py = (f, x, y) => { const h = 1e-4 * Math.max(1, Math.abs(y)); return (f(x, y + h) - f(x, y - h)) / (2 * h); };
  const pxx = (f, x, y) => { const h = 1e-3; return (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h); };
  const pyy = (f, x, y) => { const h = 1e-3; return (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h); };
  const pxy = (f, x, y) => { const h = 1e-3; return (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h); };

  /** Roots of g on [a, b] by sign changes on a grid and bisection. */
  function roots(g, a, b, n) {
    const out = [];
    let x0 = a, y0 = g(a);
    for (let i = 1; i <= n; i++) {
      const x1 = a + ((b - a) * i) / n, y1 = g(x1);
      if (isFinite(y0) && isFinite(y1) && (y0 === 0 || y0 * y1 < 0) && Math.abs(y1 - y0) < 1e6) {
        let lo = x0, hi = x1, glo = y0;
        for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, gm = g(m); if (!isFinite(gm)) break; if (glo * gm <= 0) hi = m; else { lo = m; glo = gm; } }
        const r = (lo + hi) / 2;
        if (!out.length || Math.abs(out[out.length - 1] - r) > (b - a) / n) out.push(r);
      }
      x0 = x1; y0 = y1;
    }
    return out;
  }

  /** Critical points of f(x, y) in the view: Newton's method on the gradient from a grid of seeds. */
  function criticalPoints(f, view) {
    const out = [];
    const [xa, xb] = view.x, [ya, yb] = view.y;
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
      let x = xa + ((xb - xa) * i) / 6, y = ya + ((yb - ya) * j) / 6;
      for (let k = 0; k < 30; k++) {
        const gx = px(f, x, y), gy = py(f, x, y), a = pxx(f, x, y), b = pyy(f, x, y), c = pxy(f, x, y), det = a * b - c * c;
        if (!isFinite(det) || Math.abs(det) < 1e-12) break;
        const dx = (b * gx - c * gy) / det, dy = (a * gy - c * gx) / det;
        x -= dx; y -= dy;
        if (!isFinite(x) || !isFinite(y)) break;
        if (Math.hypot(dx, dy) < 1e-10) break;
      }
      if (!(x >= xa && x <= xb && y >= ya && y <= yb)) continue;
      if (Math.hypot(px(f, x, y), py(f, x, y)) > 1e-5) continue;
      if (out.some((q) => Math.hypot(q[0] - x, q[1] - y) < 1e-4)) continue;
      out.push([x, y]);
    }
    return out;
  }

  // ---------------------------------------------------------------- conditions of a task
  const num = (s) => { try { const v = LW.expr(normalize(s, []))({}); return typeof v === "number" ? v : NaN; } catch (e) { return NaN; } };
  const near = (a, b) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= 2e-3 * Math.max(1, Math.abs(b));
  const SAMPLES = [0.31, 0.77, 1.29, 2.13, 2.87, 3.61];
  const binom = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
  /** A line of the goal list: one condition or several that hold together. */
  const holdsAll = (c, f, two) => (Array.isArray(c) ? c : [c]).every((x) => holds(x, f, two));

  /** One condition against the learner's function f (one or two variables). */
  function holds(c, f, two) {
    if (!f) return false;
    const s = String(c).trim();
    let m;
    if ((m = /^(f''|f'|fxx|fyy|fxy|fx|fy|f)\(([^()]*)\)\s*(<=|>=|=|<|>|≤|≥)\s*(.+)$/.exec(s))) {
      const args = m[2].split(",").map(num), rhs = num(m[4]);
      const [x, y] = args;
      let L;
      switch (m[1]) {
        case "f": L = two ? f(x, y) : f(x); break;
        case "f'": L = d1(f, x); break;
        case "f''": L = d2(f, x); break;
        case "fx": L = px(f, x, y); break;
        case "fy": L = py(f, x, y); break;
        case "fxx": L = pxx(f, x, y); break;
        case "fyy": L = pyy(f, x, y); break;
        default: L = pxy(f, x, y);
      }
      if (!isFinite(L) || !isFinite(rhs)) return false;
      const op = m[3];
      if (op === "=") return near(L, rhs);
      if (op === "<") return L < rhs - 1e-6;
      if (op === ">") return L > rhs + 1e-6;
      if (op === "<=" || op === "≤") return L <= rhs + 1e-6;
      return L >= rhs - 1e-6;
    }
    if (s === "gerade") return SAMPLES.every((x) => near(f(-x), f(x)));
    if (s === "ungerade") return SAMPLES.every((x) => near(f(-x), -f(x)));
    if ((m = /^periode\s+(.+)$/.exec(s))) { const P = num(m[1]); return SAMPLES.every((x) => near(f(x + P), f(x))); }
    if ((m = /^pol\s+(.+)$/.exec(s))) { const a = num(m[1]); return Math.abs(f(a + 1e-6)) > 1e4 && Math.abs(f(a - 1e-6)) > 1e4; }
    if ((m = /^asymptote\s+(.+)$/.exec(s))) { const c0 = num(m[1]); return near(f(1e5), c0) && near(f(-1e5), c0); }
    if ((m = /^(steigend|fallend)\s+(.+),(.+)$/.exec(s))) {
      const a = num(m[2]), b = num(m[3]), sign = m[1] === "steigend" ? 1 : -1;
      for (let i = 0; i <= 24; i++) { const x = a + ((b - a) * i) / 24; if (!(sign * d1(f, x) > -1e-9)) return false; }
      return true;
    }
    if ((m = /^grenze([+-])\s+(.+)$/.exec(s))) { const c0 = num(m[2]); return near(f(m[1] === "+" ? 1e6 : -1e6), c0); }
    if ((m = /^grad\s+(\d)$/.exec(s))) {
      // a polynomial of degree n: the (n+1)-th differences vanish, the n-th do not
      const n = +m[1], h = 0.7;
      const diff = (x0, k) => { let r = 0; for (let i = 0; i <= k; i++) r += ((k - i) % 2 ? -1 : 1) * binom(k, i) * f(x0 + i * h); return r; };
      return [-1.3, 0.4, 1.9].every((x0) => {
        let big = 1;
        for (let i = 0; i <= n + 1; i++) big = Math.max(big, Math.abs(f(x0 + i * h)));
        const hi = diff(x0, n + 1), lo = diff(x0, n);
        return isFinite(hi) && isFinite(lo) && Math.abs(hi) <= 1e-7 * big * Math.pow(2, n + 1) && Math.abs(lo) > 1e-6 * big;
      });
    }
    if ((m = /^int\(([^,]+),([^)]+)\)\s*(<=|>=|=|<|>)\s*(.+)$/.exec(s))) {
      const lo = num(m[1]), hi = num(m[2]), rhs = num(m[4]), n = 400, hh = (hi - lo) / n;
      let acc = f(lo) + f(hi);
      for (let i = 1; i < n; i++) acc += (i % 2 ? 4 : 2) * f(lo + i * hh);
      const I = (acc * hh) / 3;
      if (!isFinite(I)) return false;
      if (m[3] === "=") return near(I, rhs);
      if (m[3] === "<") return I < rhs - 1e-6;
      if (m[3] === ">") return I > rhs + 1e-6;
      if (m[3] === "<=") return I <= rhs + 1e-6;
      return I >= rhs - 1e-6;
    }
    if (s === "exponentiell" || (m = /^begrenzt\s+(.+)$/.exec(s))) {
      // exponential: f'/f is the same everywhere; limited growth towards S: f'/(S - f) is the same everywhere
      const S = m ? num(m[1]) : null;
      const k = [-1.1, 0, 0.6, 1.7, 3.2].map((x) => { const den = S == null ? f(x) : S - f(x); return Math.abs(den) > 1e-9 ? d1(f, x) / den : NaN; });
      return k.every((v) => isFinite(v) && Math.abs(v) > 1e-6 && near(v, k[0]));
    }
    if (s === "rotsym") {
      return [0.5, 1.1, 1.7].every((r) => { const v0 = f(r, 0); return isFinite(v0) && [1, 2.3, 4].every((t) => near(f(r * Math.cos(t), r * Math.sin(t)), v0)); });
    }
    if ((m = /^(min|max|sattel)\s+(.+),(.+)$/.exec(s))) {
      const x = num(m[2]), y = num(m[3]);
      const gx = px(f, x, y), gy = py(f, x, y);
      if (!(Math.abs(gx) < 2e-3 && Math.abs(gy) < 2e-3)) return false;
      const a = pxx(f, x, y), b = pyy(f, x, y), h = pxy(f, x, y), det = a * b - h * h;
      if (m[1] === "sattel") return det < -1e-6;
      return det > 1e-6 && (m[1] === "min" ? a > 0 : a < 0);
    }
    return false;
  }

  // ---------------------------------------------------------------- the widget
  LW.widget("funklabor", {
    mount(host, p, ctx) {
      const two = p.mode === "r2";
      const vars = two ? ["x", "y"] : ["x"];
      const task = p.task || null;
      const show = Object.assign({ d1: false, d2: false, tangent: !task, area: false }, p.show || {});
      const view0 = { x: (p.view && p.view.x) || (two ? [-3, 3] : [-6, 6]), y: (p.view && p.view.y) || (two ? [-3, 3] : [-5, 5]) };
      const view = { x: view0.x.slice(), y: view0.y.slice() };
      const values = {};
      let cur = null, src = p.f || "", x0 = 1, a = -1, b = 2, pt = [1, 0.5];
      const cam = { az: 35, el: 28 };
      let surface = true;

      // input row; under it the term typeset (or what is wrong with it), then keys in the shape of the exercise book
      const fx = two ? "f(x, y) =" : "f(x) =";
      const input = LW.el("input", { class: "lw-lab-input", type: "text", value: src, spellcheck: "false", autocapitalize: "off", autocomplete: "off",
        autocorrect: "off", inputmode: "text", "aria-label": "Funktionsterm", placeholder: two ? "z. B. x^2 - y^2" : "z. B. x^3 - 3x" });
      host.append(LW.el("div", { class: "lw-lab-row" }, [LW.el("span", { class: "lw-lab-label", html: LW.math(fx), "aria-hidden": "true" }), input]));
      const line = LW.el("div", { class: "lw-lab-tex", "aria-live": "polite" });
      host.append(line);
      // the caret: where the learner last put it, else the end
      let caretSeen = false;
      input.addEventListener("focus", () => { caretSeen = true; });
      const range = () => {
        if (!caretSeen || input.selectionStart == null) return [input.value.length, input.value.length];
        return [input.selectionStart, input.selectionEnd == null ? input.selectionStart : input.selectionEnd];
      };
      const typeIn = (text) => {
        const [s0, s1] = range();
        input.value = input.value.slice(0, s0) + text + input.value.slice(s1);
        try { input.setSelectionRange(s0 + text.length, s0 + text.length); } catch (e) { /* older WebKit */ }
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const erase = () => {
        const [s0, s1] = range();
        if (s0 === s1 && s0 === 0) return;
        const a0 = s0 === s1 ? s0 - 1 : s0;
        input.value = input.value.slice(0, a0) + input.value.slice(s1);
        try { input.setSelectionRange(a0, a0); } catch (e) { /* older WebKit */ }
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const keyButton = (html, name, act) => {
        const b2 = LW.el("button", { class: "lw-lab-key", type: "button", html, "aria-label": name });
        // pointerdown with preventDefault keeps the focus where it is: an open keyboard stays open, a closed one stays closed
        b2.addEventListener("pointerdown", (e) => { e.preventDefault(); act(); });
        b2.addEventListener("click", (e) => { e.preventDefault(); if (e.detail === 0) act(); });
        return b2;
      };
      const keys = LW.el("div", { class: "lw-lab-keys", role: "toolbar", "aria-label": "Rechenzeichen" });
      const rowA = LW.el("div", { class: "lw-lab-keyrow" }), rowB = LW.el("div", { class: "lw-lab-keyrow" });
      (two ? [["x", "x", "x"], ["y", "y", "y"]].concat(KEYS_A.slice(1)) : KEYS_A).forEach(([t, ins, name]) => rowA.append(keyButton(LW.math(t), name, () => typeIn(ins))));
      rowA.append(keyButton('<span class="lw-lab-erase" aria-hidden="true">⌫</span>', "Zeichen löschen", erase));
      (two ? KEYS_B.filter((k) => k[1] !== "tan(") : KEYS_B).forEach(([t, ins, name]) => rowB.append(keyButton(LW.math(t), name, () => typeIn(ins))));
      keys.append(rowA, rowB);
      host.append(keys);
      const list = task ? LW.el("ul", { class: "lw-lab-goals" }) : null;
      if (list) host.append(list);
      const sliders = LW.el("div", { class: "lw-lab-sliders" });
      host.append(sliders);

      // toggles
      const toggles = LW.el("div", { class: "w-btns" });
      host.append(toggles);
      const toggle = (key, text, tex) => {
        const t = LW.el("button", tex ? { class: "w-btn" + (show[key] ? " on" : ""), type: "button", html: LW.math(tex), "aria-label": text } : { class: "w-btn" + (show[key] ? " on" : ""), type: "button", text });
        t.addEventListener("click", () => { show[key] = !show[key]; t.classList.toggle("on", show[key]); paint(); });
        toggles.append(t);
      };
      if (two) {
        K.segmented(toggles, [{ id: "s", label: "Fläche" }, { id: "c", label: "Höhenlinien" }], "s", (id) => { surface = id === "s"; paint(); });
      } else {
        toggle("d1", "erste Ableitung", "f'"); toggle("d2", "zweite Ableitung", "f''"); toggle("tangent", "Tangente"); toggle("area", "Integral");
      }
      const W = 360, H = two ? 300 : 260;
      const svg = K.root(host, W, H, two ? "Fläche der Funktion" : "Graph der Funktion");
      svg.style.touchAction = "none";
      svg.style.maxWidth = "560px";
      svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      // handles live in their own layer: redrawing the graph during a drag must not remove the element being dragged
      const top = K.svg("g", null, svg);
      const S1 = { sx: null, sy: null }, S2 = { sx: null, sy: null };
      const hide = (n, off) => n.setAttribute("display", off ? "none" : "inline");
      const tH = K.svg("circle", { r: 10, fill: col("teal"), opacity: 0.9, style: "cursor:grab" }, top);
      const aH = K.svg("circle", { r: 9, fill: col("accent"), opacity: 0.85, style: "cursor:grab" }, top);
      const bH = K.svg("circle", { r: 9, fill: col("accent"), opacity: 0.85, style: "cursor:grab" }, top);
      const aT = K.text(top, 0, 0, "a", "s-text-strong"), bT = K.text(top, 0, 0, "b", "s-text-strong");
      const pH = K.svg("circle", { r: 10, fill: col("teal"), opacity: 0.9, style: "cursor:grab" }, top);
      [tH, aH, bH, aT, bT, pH].forEach((n) => hide(n, true));
      K.drag(svg, tH, (q) => { if (!S1.sx) return; x0 = K.clamp(S1.sx.inv(q.x), view.x[0], view.x[1]); paint(); ctx.changed(); });
      K.drag(svg, aH, (q) => { if (!S1.sx) return; a = K.clamp(S1.sx.inv(q.x), view.x[0], view.x[1]); paint(); ctx.changed(); });
      K.drag(svg, bH, (q) => { if (!S1.sx) return; b = K.clamp(S1.sx.inv(q.x), view.x[0], view.x[1]); paint(); ctx.changed(); });
      let crit = [], critKey = "";
      K.drag(svg, pH, (q) => {
        if (!S2.sx || !cur) return;
        let p0 = [K.clamp(S2.sx.inv(q.x), view.x[0], view.x[1]), K.clamp(S2.sy.inv(q.y), view.y[0], view.y[1])];
        // a finger cannot hit a point exactly: near a critical point the point snaps onto it
        const key = cur.src + "|" + JSON.stringify(cur.scope) + "|" + view.x.join() + "|" + view.y.join();
        if (key !== critKey) { crit = criticalPoints(cur.f, view); critKey = key; }
        const tol = (view.x[1] - view.x[0]) * 0.035;
        for (const c of crit) if (Math.hypot(c[0] - p0[0], c[1] - p0[1]) < tol) { p0 = c.slice(); break; }
        pt = p0;
        paint();
        ctx.changed();
      });
      const zoom = LW.el("div", { class: "w-btns" });
      host.append(zoom);
      K.button(zoom, "−", () => scaleView(1.4));
      K.button(zoom, "+", () => scaleView(1 / 1.4));
      K.button(zoom, "Ansicht zurücksetzen", () => { view.x = view0.x.slice(); view.y = view0.y.slice(); cam.az = 35; cam.el = 28; paint(); });
      const out = K.readout(host);

      function scaleView(k) {
        const cx = (view.x[0] + view.x[1]) / 2, cy = (view.y[0] + view.y[1]) / 2;
        const rx = ((view.x[1] - view.x[0]) / 2) * k, ry = ((view.y[1] - view.y[0]) / 2) * k;
        view.x = [cx - rx, cx + rx];
        view.y = [cy - ry, cy + ry];
        paint();
      }

      function update(silent) {
        src = input.value;
        const r = compile(src, vars, values);
        if (r.error) {
          cur = null;
          line.classList.add("err");
          line.removeAttribute("aria-hidden");
          line.textContent = input.value.trim() ? r.error : "";
        } else {
          cur = r;
          const t = toTex(r.src);
          line.classList.remove("err");
          line.setAttribute("aria-hidden", "true");
          line.innerHTML = t ? LW.math(fx + " " + t) : "";
        }
        // one slider per parameter
        const names = (r && r.names) || [];
        const have = [...sliders.children].map((n) => n.dataset.name);
        if (have.join() !== names.join()) {
          sliders.innerHTML = "";
          names.forEach((n) => {
            if (values[n] == null) values[n] = 1;
            const sl = K.slider(sliders, { label: n, labelHtml: LW.math(n), min: -5, max: 5, step: 0.1, value: values[n], onInput: (v) => { values[n] = v; if (cur) cur.scope[n] = v; paint(); ctx.changed(); } });
            sl.el.dataset.name = n;
          });
        }
        paint();
        if (!silent) ctx.changed();
      }
      input.addEventListener("input", () => update());

      // ---------------- drawing, one variable
      function paint1() {
        const sx = K.scale(view.x[0], view.x[1], 34, W - 10), sy = K.scale(view.y[0], view.y[1], H - 24, 10);
        S1.sx = sx; S1.sy = sy;
        [tH, aH, bH, aT, bT].forEach((n) => hide(n, true));
        const grid = K.svg("g", { class: "s-grid" }, g);
        K.ticks(view.x[0], view.x[1], 7).forEach((t) => {
          K.svg("line", { x1: sx(t), y1: 10, x2: sx(t), y2: H - 24, stroke: col("faint"), "stroke-width": 0.5, opacity: 0.5 }, grid);
          if (Math.abs(t) > 1e-9) K.text(grid, sx(t), H - 12, K.fmt(t, 2), "s-text");
        });
        K.ticks(view.y[0], view.y[1], 6).forEach((t) => {
          K.svg("line", { x1: 34, y1: sy(t), x2: W - 10, y2: sy(t), stroke: col("faint"), "stroke-width": 0.5, opacity: 0.5 }, grid);
          if (Math.abs(t) > 1e-9) K.text(grid, 28, sy(t), K.fmt(t, 2), "s-text", "end");
        });
        if (view.y[0] < 0 && view.y[1] > 0) K.svg("line", { x1: 34, y1: sy(0), x2: W - 10, y2: sy(0), stroke: col("gray"), "stroke-width": 1.2 }, g);
        if (view.x[0] < 0 && view.x[1] > 0) K.svg("line", { x1: sx(0), y1: 10, x2: sx(0), y2: H - 24, stroke: col("gray"), "stroke-width": 1.2 }, g);
        if (!cur) { out.set(""); return; }
        const f = cur.f;
        const span = view.y[1] - view.y[0];
        const path = (fn) => {
          let d = "", prev = null;
          for (let i = 0; i <= 420; i++) {
            const x = view.x[0] + ((view.x[1] - view.x[0]) * i) / 420, y = fn(x);
            if (!isFinite(y) || Math.abs(y - view.y[0]) > span * 40) { prev = null; continue; }
            const X = sx(x), Y = K.clamp(sy(y), -2000, 2000);
            d += (prev === null || Math.abs(y - prev) > span * 2 ? "M" : "L") + X.toFixed(1) + "," + Y.toFixed(1);
            prev = y;
          }
          return d;
        };
        const clip = "lab-clip-" + Math.random().toString(36).slice(2);
        const defs = K.svg("defs", null, g);
        const cp = K.svg("clipPath", { id: clip }, defs);
        K.svg("rect", { x: 34, y: 10, width: W - 44, height: H - 34 }, cp);
        const plot = K.svg("g", { "clip-path": "url(#" + clip + ")" }, g);
        if (show.area) {
          const lo = Math.min(a, b), hi = Math.max(a, b);
          let d = "M" + sx(lo) + "," + sy(0);
          for (let i = 0; i <= 160; i++) { const x = lo + ((hi - lo) * i) / 160, y = f(x); if (isFinite(y)) d += "L" + sx(x) + "," + K.clamp(sy(y), -2000, 2000); }
          d += "L" + sx(hi) + "," + sy(0) + "Z";
          K.svg("path", { d, fill: col("accent"), opacity: 0.18 }, plot);
        }
        if (show.d2) K.svg("path", { d: path((x) => d2(f, x)), fill: "none", stroke: col("green"), "stroke-width": 1.6, "stroke-dasharray": "2 4" }, plot);
        if (show.d1) K.svg("path", { d: path((x) => d1(f, x)), fill: "none", stroke: col("orange"), "stroke-width": 1.8, "stroke-dasharray": "6 4" }, plot);
        K.svg("path", { d: path(f), fill: "none", stroke: col("accent"), "stroke-width": 2.6, "stroke-linejoin": "round" }, plot);
        // special points
        const zs = roots(f, view.x[0], view.x[1], 300), ex = roots((x) => d1(f, x), view.x[0], view.x[1], 300), ws = roots((x) => d2(f, x), view.x[0], view.x[1], 200);
        zs.slice(0, 8).forEach((x) => K.svg("circle", { cx: sx(x), cy: sy(0), r: 3.6, fill: col("blue") }, plot));
        ex.slice(0, 8).forEach((x) => {
          const y = f(x);
          if (!isFinite(y)) return;
          const kind = d2(f, x) < 0 ? "H" : d2(f, x) > 0 ? "T" : "";
          K.svg("circle", { cx: sx(x), cy: sy(y), r: 3.8, fill: col("red") }, plot);
          if (kind) K.text(plot, sx(x) + 8, sy(y) - 9, kind, "s-text-strong");
        });
        ws.slice(0, 8).forEach((x) => { const y = f(x); if (isFinite(y) && Math.abs(d1(f, x)) > 1e-9) K.svg("circle", { cx: sx(x), cy: sy(y), r: 3.2, fill: col("green") }, plot); });
        // tangent
        let tangentText = "";
        if (show.tangent) {
          const y0 = f(x0), m = d1(f, x0);
          if (isFinite(y0) && isFinite(m)) {
            const xa = view.x[0], xb = view.x[1];
            K.svg("line", { x1: sx(xa), y1: K.clamp(sy(y0 + m * (xa - x0)), -2000, 2000), x2: sx(xb), y2: K.clamp(sy(y0 + m * (xb - x0)), -2000, 2000), stroke: col("teal"), "stroke-width": 1.6 }, plot);
            const ty = sy(y0);
            if (ty > 0 && ty < H) { tH.setAttribute("cx", sx(x0)); tH.setAttribute("cy", ty); hide(tH, false); }
            tangentText = "f(" + K.fmt(x0, 2) + ") = " + K.fmt(y0, 3) + " · Steigung " + K.fmt(m, 3);
          }
        }
        let areaText = "";
        if (show.area) {
          const n = 400, lo = Math.min(a, b), hi = Math.max(a, b), hh = (hi - lo) / n;
          let s = f(lo) + f(hi);
          for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(lo + i * hh);
          const I = (s * hh) / 3 * (a <= b ? 1 : -1);
          const y0line = K.clamp(sy(0), 18, H - 30);
          [[aH, aT, a], [bH, bT, b]].forEach(([hc, ht, v]) => {
            hc.setAttribute("cx", sx(v)); hc.setAttribute("cy", y0line);
            ht.setAttribute("x", sx(v)); ht.setAttribute("y", y0line + 18);
            hide(hc, false); hide(ht, false);
          });
          areaText = "∫ von " + K.fmt(Math.min(a, b), 2) + " bis " + K.fmt(Math.max(a, b), 2) + " = " + K.fmt(I, 3);
        }
        const zText = zs.length ? "Nullstellen " + zs.slice(0, 4).map((x) => K.fmt(x, 3)).join("; ") + (zs.length > 4 ? " …" : "") : "keine Nullstelle im Bild";
        out.set([tangentText, areaText, zText].filter(Boolean).map(LW.esc).join("<br>"));
      }

      // ---------------- drawing, two variables
      function proj(q) {
        const az = cam.az * RAD, el = cam.el * RAD;
        const [x, y, z] = q;
        const u = -x * Math.sin(az) + y * Math.cos(az);
        const v = -x * Math.cos(az) * Math.sin(el) - y * Math.sin(az) * Math.sin(el) + z * Math.cos(el);
        const d = x * Math.cos(az) * Math.cos(el) + y * Math.sin(az) * Math.cos(el) + z * Math.sin(el);
        return { x: W / 2 + u * 52, y: H / 2 + 10 - v * 52, d };
      }
      function heat(t) {
        const tt = K.clamp(t, 0, 1);
        return "hsl(" + (220 - 200 * tt).toFixed(0) + ", 70%, " + (48 + 8 * Math.sin(tt * Math.PI)).toFixed(0) + "%)";
      }
      function paint2() {
        hide(pH, true);
        if (!cur) { out.set(""); return; }
        const f = cur.f, N = 26;
        const [xa, xb] = view.x, [ya, yb] = view.y;
        const zs = [];
        let zmin = Infinity, zmax = -Infinity;
        for (let i = 0; i <= N; i++) {
          zs.push([]);
          for (let j = 0; j <= N; j++) {
            const z = f(xa + ((xb - xa) * i) / N, ya + ((yb - ya) * j) / N);
            zs[i].push(z);
            if (isFinite(z)) { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
          }
        }
        if (!isFinite(zmin)) { out.set("Die Funktion ist hier nirgends definiert."); return; }
        const zr = zmax - zmin || 1;
        const X = (i) => -2.2 + (4.4 * i) / N, Y = (j) => -2.2 + (4.4 * j) / N, Z = (z) => -1.4 + (2.8 * (z - zmin)) / zr;
        if (surface) {
          const quads = [];
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
            if (!c.every(([u, v]) => isFinite(zs[u][v]))) continue;
            const pts = c.map(([u, v]) => proj([X(u), Y(v), Z(zs[u][v])]));
            const zAvg = c.reduce((s, [u, v]) => s + zs[u][v], 0) / 4;
            quads.push({ pts, d: pts.reduce((s, q) => s + q.d, 0) / 4, t: (zAvg - zmin) / zr });
          }
          quads.sort((q1, q2) => q1.d - q2.d);
          quads.forEach((q) => K.svg("polygon", { points: q.pts.map((c) => c.x.toFixed(1) + "," + c.y.toFixed(1)).join(" "), fill: heat(q.t), stroke: "rgba(0,0,0,0.25)", "stroke-width": 0.4 }, g));
          // axes
          [["x", [2.6, 0, -1.4]], ["y", [0, 2.6, -1.4]], ["z", [-2.2, -2.2, 1.8]]].forEach(([name, e]) => {
            const o = name === "z" ? [-2.2, -2.2, -1.4] : [0, 0, -1.4];
            const A = proj(o), B = proj(e);
            const ar = K.arrow(g, A.x, A.y, B.x, B.y, null, 1.2);
            ar.style.stroke = col("gray"); ar.style.fill = col("gray");
            K.text(g, B.x + 8, B.y - 6, name, "s-text-strong").style.fill = col("gray");
          });
        } else {
          // level curves by marching squares, the point with its gradient
          const sx = K.scale(xa, xb, 30, W - 10), sy = K.scale(ya, yb, H - 20, 10);
          K.svg("rect", { x: 30, y: 10, width: W - 40, height: H - 30, fill: "none", stroke: col("faint") }, g);
          const levels = K.ticks(zmin, zmax, 9);
          levels.forEach((lv) => {
            const t = (lv - zmin) / zr;
            let d = "";
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
              const v = [zs[i][j], zs[i + 1][j], zs[i + 1][j + 1], zs[i][j + 1]];
              if (!v.every(isFinite)) continue;
              const P = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
              const cuts = [];
              for (let k = 0; k < 4; k++) {
                const a1 = v[k], b1 = v[(k + 1) % 4];
                if ((a1 - lv) * (b1 - lv) < 0) {
                  const s = (lv - a1) / (b1 - a1);
                  const [i1, j1] = P[k], [i2, j2] = P[(k + 1) % 4];
                  cuts.push([xa + ((xb - xa) * (i1 + s * (i2 - i1))) / N, ya + ((yb - ya) * (j1 + s * (j2 - j1))) / N]);
                }
              }
              for (let k = 0; k + 1 < cuts.length; k += 2) d += "M" + sx(cuts[k][0]).toFixed(1) + "," + sy(cuts[k][1]).toFixed(1) + "L" + sx(cuts[k + 1][0]).toFixed(1) + "," + sy(cuts[k + 1][1]).toFixed(1);
            }
            if (d) K.svg("path", { d, fill: "none", stroke: heat(t), "stroke-width": 1.6 }, g);
          });
          if (xa < 0 && xb > 0) K.svg("line", { x1: sx(0), y1: 10, x2: sx(0), y2: H - 20, stroke: col("gray"), "stroke-width": 0.8 }, g);
          if (ya < 0 && yb > 0) K.svg("line", { x1: 30, y1: sy(0), x2: W - 10, y2: sy(0), stroke: col("gray"), "stroke-width": 0.8 }, g);
          const gx = px(f, pt[0], pt[1]), gy = py(f, pt[0], pt[1]);
          const len = Math.hypot(gx, gy);
          if (isFinite(len) && len > 1e-9) {
            const k = Math.min(1, 1.2 / len) * ((xb - xa) / 6);
            const ar = K.arrow(g, sx(pt[0]), sy(pt[1]), sx(pt[0] + gx * k), sy(pt[1] + gy * k), null, 2.4);
            ar.style.stroke = col("accent"); ar.style.fill = col("accent");
          }
          S2.sx = sx; S2.sy = sy;
          pH.setAttribute("cx", sx(pt[0])); pH.setAttribute("cy", sy(pt[1]));
          hide(pH, false);
        }
        const [p0, p1] = pt;
        const v = f(p0, p1), gx = px(f, p0, p1), gy = py(f, p0, p1);
        let kind = "";
        if (Math.abs(gx) < 2e-3 && Math.abs(gy) < 2e-3) {
          const A = pxx(f, p0, p1), B = pyy(f, p0, p1), C = pxy(f, p0, p1), det = A * B - C * C;
          kind = det > 1e-6 ? (A > 0 ? " · kritischer Punkt: Minimum" : " · kritischer Punkt: Maximum") : det < -1e-6 ? " · kritischer Punkt: Sattel" : " · kritischer Punkt, Test unentschieden";
        }
        out.set(LW.esc("Im Punkt (" + K.fmt(p0, 2) + " | " + K.fmt(p1, 2) + "): f = " + K.fmt(v, 3) + ", ∂f/∂x = " + K.fmt(gx, 3) + ", ∂f/∂y = " + K.fmt(gy, 3) + kind) +
          (surface ? "<br>" + LW.esc("Ziehen dreht die Fläche; unter »Höhenlinien« lässt sich der Punkt verschieben.") : ""));
      }

      function paintGoals() {
        if (!list) return;
        list.innerHTML = "";
        (task.conditions || []).forEach((c) => {
          const ok = cur ? holdsAll(c.c, cur.f, two) : false;
          list.append(LW.el("li", { class: ok ? "ok" : "" }, [LW.el("span", { class: "mark", text: ok ? "✓" : "" }), LW.el("span", { class: "lw-md", html: LW.md(c.show || [].concat(c.c).join(", ")) })]));
        });
      }

      function paint() {
        K.clear(g);
        if (two) paint2(); else paint1();
        paintGoals();
      }

      // background: pan (one variable, level curves) or turn (surface)
      let last = null;
      svg.addEventListener("pointerdown", (e) => {
        if (e.target !== svg && e.target.tagName !== "polygon" && e.target.tagName !== "path" && e.target.tagName !== "line" && e.target.tagName !== "rect") return;
        last = { x: e.clientX, y: e.clientY };
        svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
      });
      svg.addEventListener("pointermove", (e) => {
        if (!last) return;
        e.preventDefault();
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        if (two && surface) {
          cam.az -= dx * 0.6;
          cam.el = K.clamp(cam.el + dy * 0.4, -10, 85);
        } else {
          const r = svg.getBoundingClientRect();
          const kx = (view.x[1] - view.x[0]) / Math.max(1, r.width), ky = (view.y[1] - view.y[0]) / Math.max(1, r.height);
          view.x = [view.x[0] - dx * kx, view.x[1] - dx * kx];
          view.y = [view.y[0] + dy * ky, view.y[1] + dy * ky];
        }
        paint();
      });
      const end = () => { last = null; };
      svg.addEventListener("pointerup", end);
      svg.addEventListener("pointercancel", end);

      update(true);
      return {
        check() {
          if (!task) return { correct: true };
          if (!cur) return { correct: false, detail: "Gib zuerst eine Funktion ein." };
          const open = (task.conditions || []).filter((c) => !holdsAll(c.c, cur.f, two));
          if (!open.length) return { correct: true };
          return { correct: false, detail: "Noch nicht erfüllt: " + open.map((c) => c.show || [].concat(c.c).join(", ")).join("; ") + "." };
        },
        solve() {
          if (!task || !task.sample) return;
          input.value = task.sample;
          Object.keys(values).forEach((k) => delete values[k]);
          update();
        },
        getVar(name) { return name === "ok" ? (task && cur && (task.conditions || []).every((c) => holdsAll(c.c, cur.f, two)) ? 1 : 0) : values[name]; },
        setVar(name, v) { values[name] = v; sliders.innerHTML = ""; update(); },
      };
    },
  });

  LW.labMath = { normalize, compile, holds, holdsAll, toTex };
})();
