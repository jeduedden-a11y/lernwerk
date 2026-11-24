/* Build tasks for the mathematics labs. Every task is a funklabor step: the learner types a function, the list of
 * conditions ticks itself off, the sample solution and the way to it come along.
 *   lab-funktion  functions of one variable: lines, parabolas, Steckbriefaufgaben, growth, sine, rational functions
 *   lab-flaeche   functions of two variables: planes, minimum, maximum, saddle, gradient, several critical points */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  // ---------------------------------------------------------------- numbers and terms
  const r6 = (x) => +x.toFixed(6);
  /** A number for the condition strings the widget reads (decimal point). */
  const cn = (x) => String(r6(x));
  /** A number for the input field (decimal comma). */
  const sn = (x) => String(r6(x)).replace(".", ",");

  /** Polynomial from the highest power down, in TeX. */
  function polyTex(G, co, v) {
    const n = co.length - 1, x = v || "x";
    let out = "";
    co.forEach((c, i) => {
      const k = n - i;
      if (Math.abs(c) < 1e-12) return;
      const abs = Math.abs(c);
      const coef = k === 0 || abs !== 1 ? G.tex(abs) : "";
      const pow = k === 0 ? "" : k === 1 ? x : x + "^{" + k + "}";
      out += out ? (c < 0 ? " - " : " + ") + coef + pow : (c < 0 ? "-" : "") + coef + pow;
    });
    return out || "0";
  }
  /** The same polynomial as the learner would type it. */
  function polySrc(co) {
    const n = co.length - 1;
    let out = "";
    co.forEach((c, i) => {
      const k = n - i;
      if (Math.abs(c) < 1e-12) return;
      const abs = Math.abs(c);
      const coef = k === 0 || abs !== 1 ? sn(abs) : "";
      const pow = k === 0 ? "" : k === 1 ? "x" : "x^" + k;
      out += out ? (c < 0 ? " - " : " + ") + coef + pow : (c < 0 ? "-" : "") + coef + pow;
    });
    return out || "0";
  }
  /** Value of the polynomial or of its first or second derivative. */
  function pval(co, x, kind) {
    const n = co.length - 1;
    let s = 0;
    co.forEach((c, i) => {
      const k = n - i;
      if (kind === 0) s += c * Math.pow(x, k);
      else if (kind === 1) s += k >= 1 ? c * k * Math.pow(x, k - 1) : 0;
      else s += k >= 2 ? c * k * (k - 1) * Math.pow(x, k - 2) : 0;
    });
    return r6(s);
  }
  /** Multiplies out a(x - r1)(x - r2)… */
  function expand(a, roots) {
    let co = [a];
    roots.forEach((r) => {
      const next = co.concat([0]);
      for (let i = 1; i < next.length; i++) next[i] -= r * co[i - 1];
      co = next;
    });
    return co.map(r6);
  }
  /** (x - d) with the sign written out; x alone for d = 0. */
  const shift = (G, d, v) => (d === 0 ? (v || "x") : "(" + (v || "x") + (d > 0 ? " - " : " + ") + G.tex(Math.abs(d)) + ")");
  const shiftSrc = (d, v) => (d === 0 ? (v || "x") : "(" + (v || "x") + (d > 0 ? "-" : "+") + sn(Math.abs(d)) + ")");
  const constTail = (G, c) => (c ? " " + G.term(c) : "");
  const constSrc = (c) => (c ? (c > 0 ? "+" : "-") + sn(Math.abs(c)) : "");
  const lead = (a) => (a === 1 ? "" : a === -1 ? "-" : sn(a));
  const pt = (G, x, y) => "(" + G.tex(x) + " \\mid " + G.tex(y) + ")";
  const pt3 = (G, x, y, z) => "(" + G.tex(x) + " \\mid " + G.tex(y) + " \\mid " + G.tex(z) + ")";

  const NAMES = ["a", "b", "c", "d", "e"];
  const KIND = ["f", "f'", "f''"];
  /** One equation of the Steckbrief system: the row for f, f' or f'' at x0 with the coefficients as unknowns. */
  function eqTex(G, n, kind, x0, rhs, only) {
    let out = "";
    for (let i = 0; i <= n; i++) {
      const k = n - i;
      if (only && !only.includes(i)) continue;
      const c = kind === 0 ? Math.pow(x0, k) : kind === 1 ? (k >= 1 ? k * Math.pow(x0, k - 1) : 0) : (k >= 2 ? k * (k - 1) * Math.pow(x0, k - 2) : 0);
      if (Math.abs(c) < 1e-12) continue;
      const abs = Math.abs(c);
      const t = (abs === 1 ? "" : G.tex(abs)) + NAMES[i];
      out += out ? (c < 0 ? " - " : " + ") + t : (c < 0 ? "-" : "") + t;
    }
    return KIND[kind] + "(" + G.tex(x0) + ") = " + G.tex(rhs) + ":\\quad " + (out || "0") + " = " + G.tex(rhs);
  }
  /** Ansatz with the general polynomial of degree n (only some coefficients for symmetric cases). */
  function ansatz(n, only) {
    let out = "";
    for (let i = 0; i <= n; i++) {
      if (only && !only.includes(i)) continue;
      const k = n - i;
      const t = NAMES[i] + (k === 0 ? "" : k === 1 ? "x" : "x^{" + k + "}");
      out += out ? " + " + t : t;
    }
    return "f(x) = " + out;
  }

  /** A view that shows the given points with some room; the learner can still move and zoom. */
  function fitView(xs, ys, minW, minH) {
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys, 0), y1 = Math.max(...ys, 0);
    const w = Math.max(minW || 8, (x1 - x0) * 1.4), h = Math.max(minH || 6, (y1 - y0) * 1.35);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { x: [r6(cx - w / 2), r6(cx + w / 2)], y: [r6(cy - h / 2), r6(cy + h / 2)] };
  }

  const LIST = "Unter dem Graphen stehen die Bedingungen; jede hakt sich ab, sobald dein Term sie erfüllt. Buchstaben wie $a$ oder $k$ werden zu Reglern.";
  function step(md, params, hint, explain) {
    return { type: "widget", widget: "funklabor", label: "Labor", md, params, goal: {}, hint, explain };
  }
  const grade = (n) => ["nullten", "ersten", "zweiten", "dritten", "vierten"][n];

  // ---------------------------------------------------------------- one variable
  const ONE = {
    line(G) {
      const m = G.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3]), b = G.int(-3, 3);
      const x1 = G.int(-4, 0), x2 = x1 + G.int(2, 4);
      const y1 = r6(m * x1 + b), y2 = r6(m * x2 + b);
      const co = [m, b];
      return step("Baue eine **Gerade**, die durch $P" + pt(G, x1, y1) + "$ und $Q" + pt(G, x2, y2) + "$ geht. " + LIST, {
        mode: "r1", view: fitView([x1, x2], [y1, y2]),
        task: { conditions: [
          { c: "grad 1", show: "Der Graph ist eine Gerade, die nicht waagerecht ist." },
          { c: "f(" + cn(x1) + ") = " + cn(y1), show: "$P" + pt(G, x1, y1) + "$ liegt auf dem Graphen." },
          { c: "f(" + cn(x2) + ") = " + cn(y2), show: "$Q" + pt(G, x2, y2) + "$ liegt auf dem Graphen." },
        ], sample: polySrc(co) },
      }, "Ansatz $f(x) = mx + b$. Die Steigung ist Höhenunterschied durch Breitenunterschied.",
      "Steigung $m = \\frac{" + G.tex(y2) + " - " + (y1 < 0 ? "(" + G.tex(y1) + ")" : G.tex(y1)) + "}{" + G.tex(x2) + " - " + (x1 < 0 ? "(" + G.tex(x1) + ")" : G.tex(x1)) + "} = " + G.tex(m) +
      "$. Aus $f(" + G.tex(x1) + ") = " + G.tex(y1) + "$ folgt $b = " + G.tex(b) + "$. Also $f(x) = " + polyTex(G, co) + "$.");
    },
    vertex(G) {
      const a = G.pick([-2, -1, -0.5, 0.5, 1, 2]), d = G.int(-3, 3), e = G.int(-3, 3), k = G.pick([-2, -1, 1, 2]);
      const px = d + k, py = r6(a * k * k + e);
      const co = [a, r6(-2 * a * d), r6(a * d * d + e)];
      return step("Baue eine **Parabel** mit dem Scheitelpunkt $S" + pt(G, d, e) + "$, die durch $P" + pt(G, px, py) + "$ geht. " + LIST, {
        mode: "r1", view: fitView([d - 3, d + 3, px], [e, py]),
        task: { conditions: [
          { c: "grad 2", show: "Der Graph ist eine Parabel (Grad 2)." },
          { c: ["f'(" + cn(d) + ") = 0", "f(" + cn(d) + ") = " + cn(e)], show: "Scheitelpunkt $S" + pt(G, d, e) + "$" },
          { c: "f(" + cn(px) + ") = " + cn(py), show: "$P" + pt(G, px, py) + "$ liegt auf dem Graphen." },
        ], sample: lead(a) + shiftSrc(d) + "^2" + constSrc(e) },
      }, "Scheitelpunktform: $f(x) = a(x - x_S)^2 + y_S$. Den Streckfaktor $a$ liefert der Punkt $P$.",
      "Scheitelpunktform $f(x) = a\\," + shift(G, d) + "^2 " + G.term(e) + "$. Einsetzen von $P$: $" + G.tex(py) + " = a \\cdot " + G.tex(k * k) + " " + G.term(e) +
      "$, also $a = " + G.tex(a) + "$. Ausmultipliziert: $f(x) = " + polyTex(G, co) + "$.");
    },
    zeros2(G) {
      const x1 = G.int(-4, 1), x2 = x1 + G.int(2, 5), a = G.pick([-1, -0.5, 0.5, 1, 2]);
      const xp = x1 === 0 || x2 === 0 ? x2 + 1 : 0, yp = r6(a * (xp - x1) * (xp - x2));
      const co = expand(a, [x1, x2]);
      return step("Baue eine **Parabel** mit den Nullstellen $x_1 = " + G.tex(x1) + "$ und $x_2 = " + G.tex(x2) + "$, die durch $P" + pt(G, xp, yp) + "$ geht. " + LIST, {
        mode: "r1", view: fitView([x1, x2, xp], [yp, pval(co, (x1 + x2) / 2, 0)]),
        task: { conditions: [
          { c: "grad 2", show: "Der Graph ist eine Parabel (Grad 2)." },
          { c: "f(" + cn(x1) + ") = 0", show: "Nullstelle bei $x = " + G.tex(x1) + "$" },
          { c: "f(" + cn(x2) + ") = 0", show: "Nullstelle bei $x = " + G.tex(x2) + "$" },
          { c: "f(" + cn(xp) + ") = " + cn(yp), show: "$P" + pt(G, xp, yp) + "$ liegt auf dem Graphen." },
        ], sample: lead(a) + shiftSrc(x1) + shiftSrc(x2) },
      }, "Produktform: $f(x) = a(x - x_1)(x - x_2)$. Den Faktor $a$ liefert der dritte Punkt.",
      "Produktform $f(x) = a\\," + shift(G, x1) + shift(G, x2) + "$. Einsetzen von $P$ ergibt $a = " + G.tex(a) + "$, also $f(x) = " + polyTex(G, co) + "$.");
    },
    zeros3(G) {
      const roots = G.pickN([-4, -3, -2, -1, 1, 2, 3, 4], 3).sort((u, v) => u - v), a = G.pick([-1, -0.5, 0.5, 1]);
      const co = expand(a, roots), y0 = pval(co, 0, 0);
      return step("Baue eine **ganzrationale Funktion dritten Grades** mit den Nullstellen $" + roots.map((r) => G.tex(r)).join("$, $") + "$, deren Graph die $y$-Achse bei $y = " + G.tex(y0) + "$ schneidet. " + LIST, {
        mode: "r1", view: fitView(roots.concat([0]), [y0, pval(co, (roots[0] + roots[1]) / 2, 0), pval(co, (roots[1] + roots[2]) / 2, 0)]),
        task: { conditions: [
          { c: "grad 3", show: "ganzrational vom Grad 3" },
          { c: roots.map((r) => "f(" + cn(r) + ") = 0"), show: "Nullstellen bei $x = " + roots.map((r) => G.tex(r)).join("$, $x = ") + "$" },
          { c: "f(0) = " + cn(y0), show: "$f(0) = " + G.tex(y0) + "$" },
        ], sample: lead(a) + roots.map((r) => shiftSrc(r)).join("") },
      }, "Linearfaktoren: $f(x) = a(x - x_1)(x - x_2)(x - x_3)$; den Faktor $a$ liefert $f(0)$.",
      "Mit den Linearfaktoren ist $f(x) = a\\," + roots.map((r) => shift(G, r)).join("") + "$. Für $x = 0$: $" + G.tex(y0) + " = a \\cdot " + G.tex(r6(-roots[0] * roots[1] * roots[2])) +
      "$, also $a = " + G.tex(a) + "$. Ausmultipliziert: $f(x) = " + polyTex(G, co) + "$.");
    },
    extrema3(G) {
      let p, q;
      do { p = G.int(-2, 2); q = G.int(-2, 2); } while (Math.abs(p - q) < 2);
      const a = G.pick([-0.5, -0.25, 0.25, 0.5]), d0 = G.int(-2, 2);
      // f'(x) = 6a(x - p)(x - q)
      const co = [r6(2 * a), r6(-3 * a * (p + q)), r6(6 * a * p * q), d0];
      const lo = Math.min(p, q), hi = Math.max(p, q);
      const [xH, xT] = a > 0 ? [lo, hi] : [hi, lo];
      const yH = pval(co, xH, 0), yT = pval(co, xT, 0);
      const eqs = [eqTex(G, 3, 0, xH, yH), eqTex(G, 3, 1, xH, 0), eqTex(G, 3, 0, xT, yT), eqTex(G, 3, 1, xT, 0)];
      return step("**Steckbriefaufgabe.** Gesucht ist eine ganzrationale Funktion dritten Grades mit dem Hochpunkt $H" + pt(G, xH, yH) + "$ und dem Tiefpunkt $T" + pt(G, xT, yT) + "$. " + LIST, {
        mode: "r1", view: fitView([lo - 1.5, hi + 1.5], [yH, yT]), show: { d1: true },
        task: { conditions: [
          { c: "grad 3", show: "ganzrational vom Grad 3" },
          { c: ["f'(" + cn(xH) + ") = 0", "f(" + cn(xH) + ") = " + cn(yH), "f''(" + cn(xH) + ") < 0"], show: "Hochpunkt $H" + pt(G, xH, yH) + "$" },
          { c: ["f'(" + cn(xT) + ") = 0", "f(" + cn(xT) + ") = " + cn(yT), "f''(" + cn(xT) + ") > 0"], show: "Tiefpunkt $T" + pt(G, xT, yT) + "$" },
        ], sample: polySrc(co) },
      }, "Ansatz $f(x) = ax^3 + bx^2 + cx + d$. Jeder Extrempunkt liefert zwei Gleichungen: den Funktionswert und $f'(x) = 0$.",
      "Ansatz $" + ansatz(3) + "$ mit $f'(x) = 3ax^2 + 2bx + c$. Die vier Bedingungen:\n\n$" + eqs.join("$\n\n$") + "$\n\nDas Gleichungssystem hat die Lösung $f(x) = " + polyTex(G, co) +
      "$. Probe mit $f''$: $f''(" + G.tex(xH) + ") = " + G.tex(pval(co, xH, 2)) + " < 0$ (Hochpunkt), $f''(" + G.tex(xT) + ") = " + G.tex(pval(co, xT, 2)) + " > 0$ (Tiefpunkt).");
    },
    exp(G) {
      const N0 = G.pick([20, 50, 80, 100, 200, 400]), T = G.pick([2, 3, 4, 5]), grow = G.chance(0.5);
      const NT = grow ? 2 * N0 : N0 / 2;
      return step("Ein Bestand beträgt zu Beginn $" + G.tex(N0) + "$ und " + (grow ? "verdoppelt" : "halbiert") + " sich alle $" + G.tex(T) +
        "$ Zeiteinheiten. Baue das **exponentielle Modell** $f(x)$ ($x$ in Zeiteinheiten). " + LIST, {
        mode: "r1", view: grow ? { x: [-1, 2 * T + 1], y: [-0.4 * N0, 4.6 * N0] } : { x: [-1, 3 * T + 1], y: [-0.15 * N0, 1.25 * N0] },
        task: { conditions: [
          { c: "f(0) = " + cn(N0), show: "Anfangsbestand $f(0) = " + G.tex(N0) + "$" },
          { c: "f(" + cn(T) + ") = " + cn(NT), show: "$f(" + G.tex(T) + ") = " + G.tex(NT) + "$: " + (grow ? "verdoppelt" : "halbiert") },
          { c: "exponentiell", show: "Die Änderungsrate ist proportional zum Bestand: $f'(x) = k \\cdot f(x)$." },
        ], sample: sn(N0) + "*" + (grow ? "2" : "0,5") + "^(x/" + T + ")" },
      }, "Exponentielles Wachstum: $f(x) = f(0) \\cdot b^{x}$ oder $f(0) \\cdot e^{kx}$. Nach " + G.tex(T) + " Zeiteinheiten ist der Faktor " + (grow ? "2" : "$\\tfrac12$") + ".",
      "$f(x) = " + G.tex(N0) + " \\cdot e^{kx}$ mit $e^{" + G.tex(T) + "k} = " + (grow ? "2" : "\\tfrac12") + "$, also $k = " + (grow ? "" : "-") + "\\frac{\\ln 2}{" + G.tex(T) + "} \\approx " + G.tex((grow ? 1 : -1) * Math.LN2 / T, 4) +
      "$. Gleichwertig: $f(x) = " + G.tex(N0) + " \\cdot " + (grow ? "2" : "0{,}5") + "^{x/" + G.tex(T) + "}$. Für jede Exponentialfunktion gilt $f'(x) = k \\cdot f(x)$.");
    },
    sine(G) {
      const P = G.pick([4, 6, 8, 12, "2pi"]), A = G.pick([0.5, 1, 1.5, 2, 3]), dd = G.int(-2, 2), x0 = G.int(0, 2);
      const Pn = P === "2pi" ? 2 * Math.PI : P;
      const Ptex = P === "2pi" ? "2\\pi" : G.tex(P), Pc = P === "2pi" ? "2*pi" : cn(P);
      const half = P === "2pi" ? cn(x0) + "+pi" : cn(x0 + P / 2);
      const halfTex = P === "2pi" ? (x0 ? G.tex(x0) + " + \\pi" : "\\pi") : G.tex(x0 + P / 2);
      const bSrc = P === "2pi" ? "" : "pi/" + sn(P / 2) + "*";
      const bTex = P === "2pi" ? "" : "\\frac{\\pi}{" + G.tex(P / 2) + "}";
      const inner = x0 === 0 ? bSrc + "x" : bSrc ? bSrc + shiftSrc(x0) : shiftSrc(x0).slice(1, -1);
      const arg = bTex ? bTex + (x0 ? "\\," + shift(G, x0) : "x") : x0 ? shift(G, x0).slice(1, -1) : "x";
      return step("Baue eine **Sinusfunktion** mit der Periode $" + Ptex + "$, deren Hochpunkt bei $H" + pt(G, x0, dd + A) + "$ liegt und deren Tiefpunkte auf der Höhe $y = " + G.tex(dd - A) + "$ liegen. " + LIST, {
        mode: "r1", view: { x: [r6(x0 - Pn / 2 - 1), r6(x0 + 1.5 * Pn)], y: [dd - A - 2, dd + A + 2] },
        task: { conditions: [
          { c: "periode " + Pc, show: "Periode $p = " + Ptex + "$" },
          { c: ["f(" + cn(x0) + ") = " + cn(dd + A), "f'(" + cn(x0) + ") = 0"], show: "Hochpunkt $H" + pt(G, x0, dd + A) + "$" },
          { c: "f(" + half + ") = " + cn(dd - A), show: "Tiefpunkt bei $x = " + halfTex + "$ mit $y = " + G.tex(dd - A) + "$" },
        ], sample: lead(A) + "cos(" + inner + ")" + constSrc(dd) },
      }, "$f(x) = a \\cos(b(x - c)) + d$: Amplitude $a$, Periode $p = \\frac{2\\pi}{b}$, Mittellinie $y = d$, Hochpunkt bei $x = c$.",
      "Amplitude $a = " + G.tex(A) + "$ (halber Abstand zwischen Hoch- und Tiefpunkt), Mittellinie $y = " + G.tex(dd) + "$, $b = \\frac{2\\pi}{" + Ptex + "}" + (bTex ? " = " + bTex : " = 1") +
      "$. Der Kosinus hat bei $0$ ein Maximum, also wird um $" + G.tex(x0) + "$ verschoben: $f(x) = " + (A === 1 ? "" : G.tex(A)) + "\\cos\\left(" + arg + "\\right)" + constTail(G, dd) +
      "$. Mit dem Sinus geht es genauso, nur um eine Viertelperiode verschoben.");
    },
    turn3(G) {
      const a = G.pick([-1, -0.5, 0.5, 1]), xw = G.int(-2, 2), c = G.int(-3, 3), d = G.int(-3, 3);
      const co = [a, r6(-3 * a * xw), c, d];
      const yw = pval(co, xw, 0), m = pval(co, xw, 1), px = xw + G.pick([-2, -1, 1, 2]), py = pval(co, px, 0);
      const eqs = [eqTex(G, 3, 0, xw, yw), eqTex(G, 3, 1, xw, m), eqTex(G, 3, 2, xw, 0), eqTex(G, 3, 0, px, py)];
      return step("**Steckbriefaufgabe.** Der Graph einer ganzrationalen Funktion dritten Grades hat den Wendepunkt $W" + pt(G, xw, yw) + "$; die Wendetangente hat die Steigung $" + G.tex(m) +
        "$. Außerdem geht der Graph durch $P" + pt(G, px, py) + "$. " + LIST, {
        mode: "r1", view: fitView([xw - 3, xw + 3, px], [yw, py, pval(co, xw - 2, 0), pval(co, xw + 2, 0)]), show: { d2: true },
        task: { conditions: [
          { c: "grad 3", show: "ganzrational vom Grad 3" },
          { c: ["f''(" + cn(xw) + ") = 0", "f(" + cn(xw) + ") = " + cn(yw)], show: "Wendepunkt $W" + pt(G, xw, yw) + "$" },
          { c: "f'(" + cn(xw) + ") = " + cn(m), show: "Die Wendetangente hat die Steigung $" + G.tex(m) + "$." },
          { c: "f(" + cn(px) + ") = " + cn(py), show: "$P" + pt(G, px, py) + "$ liegt auf dem Graphen." },
        ], sample: polySrc(co) },
      }, "Ansatz $f(x) = ax^3 + bx^2 + cx + d$. Wendepunkt heißt $f''(x_W) = 0$, dazu der Funktionswert; die Steigung der Wendetangente ist $f'(x_W)$.",
      "Ansatz $" + ansatz(3) + "$, $f'(x) = 3ax^2 + 2bx + c$, $f''(x) = 6ax + 2b$. Die vier Bedingungen:\n\n$" + eqs.join("$\n\n$") + "$\n\nLösung: $f(x) = " + polyTex(G, co) + "$.");
    },
    even4(G) {
      const t = G.pick([1, 2]), a = t === 1 ? G.pick([0.5, 1, 2]) : G.pick([0.125, 0.25, 0.5]), c = G.int(-2, 3);
      const co = [a, 0, r6(-2 * a * t * t), 0, c], yT = pval(co, t, 0);
      const only = [0, 2, 4];
      const eqs = [eqTex(G, 4, 0, t, yT, only), eqTex(G, 4, 1, t, 0, only), eqTex(G, 4, 0, 0, c, only)];
      return step("**Steckbriefaufgabe.** Gesucht ist eine ganzrationale Funktion vierten Grades, deren Graph **achsensymmetrisch zur $y$-Achse** ist, die Tiefpunkte $T_{1,2}(\\pm " + G.tex(t) + " \\mid " + G.tex(yT) +
        ")$ hat und die $y$-Achse bei $y = " + G.tex(c) + "$ schneidet. " + LIST, {
        mode: "r1", view: fitView([-t - 2, t + 2], [yT, c]),
        task: { conditions: [
          { c: "grad 4", show: "ganzrational vom Grad 4" },
          { c: "gerade", show: "achsensymmetrisch zur $y$-Achse: $f(-x) = f(x)$" },
          { c: ["f'(" + cn(t) + ") = 0", "f(" + cn(t) + ") = " + cn(yT), "f''(" + cn(t) + ") > 0"], show: "Tiefpunkt $T_1" + pt(G, t, yT) + "$ (und damit auch $T_2$)" },
          { c: "f(0) = " + cn(c), show: "$f(0) = " + G.tex(c) + "$" },
        ], sample: polySrc(co) },
      }, "Achsensymmetrie heißt: nur gerade Potenzen. Ansatz $f(x) = ax^4 + cx^2 + e$.",
      "Ansatz $" + ansatz(4, only) + "$ (nur gerade Potenzen), $f'(x) = 4ax^3 + 2cx$. Die Bedingungen:\n\n$" + eqs.join("$\n\n$") + "$\n\nLösung: $f(x) = " + polyTex(G, co) + "$.");
    },
    odd3(G) {
      const h = G.pick([-2, -1, 1, 2]), aa = G.pick([0.25, 0.5, 1]), a = h > 0 ? -aa : aa;
      const c = r6(-3 * a * h * h), co = [a, 0, c, 0], k = pval(co, h, 0);
      const only = [0, 2];
      const eqs = [eqTex(G, 3, 0, h, k, only), eqTex(G, 3, 1, h, 0, only)];
      return step("**Steckbriefaufgabe.** Gesucht ist eine ganzrationale Funktion dritten Grades, deren Graph **punktsymmetrisch zum Ursprung** ist und den Hochpunkt $H" + pt(G, h, k) + "$ hat. " + LIST, {
        mode: "r1", view: fitView([-Math.abs(h) - 2, Math.abs(h) + 2], [k, -k]),
        task: { conditions: [
          { c: "grad 3", show: "ganzrational vom Grad 3" },
          { c: "ungerade", show: "punktsymmetrisch zum Ursprung: $f(-x) = -f(x)$" },
          { c: ["f'(" + cn(h) + ") = 0", "f(" + cn(h) + ") = " + cn(k), "f''(" + cn(h) + ") < 0"], show: "Hochpunkt $H" + pt(G, h, k) + "$" },
        ], sample: polySrc(co) },
      }, "Punktsymmetrie zum Ursprung heißt: nur ungerade Potenzen. Ansatz $f(x) = ax^3 + cx$.",
      "Ansatz $" + ansatz(3, only) + "$ (nur ungerade Potenzen), $f'(x) = 3ax^2 + c$:\n\n$" + eqs.join("$\n\n$") + "$\n\nLösung: $f(x) = " + polyTex(G, co) + "$; der Tiefpunkt liegt dann bei $" + pt(G, -h, -k) + "$.");
    },
    area(G) {
      const [w, a] = G.pick([[2, 1.5], [2, 3], [3, 0.5], [3, 1], [3, 2], [4, 0.75], [6, 0.25]]);
      const A = r6((a * w * w * w) / 6), co = [-a, r6(a * w), 0];
      return step("Baue eine **nach unten geöffnete Parabel** mit den Nullstellen $0$ und $" + G.tex(w) + "$, die mit der $x$-Achse eine Fläche von $" + G.tex(A) + "$ Flächeneinheiten einschließt. Schalte »Integral« ein und ziehe $a$ und $b$ auf die Nullstellen. " + LIST, {
        mode: "r1", view: fitView([-1, w + 1], [pval(co, w / 2, 0)]), show: { area: true },
        task: { conditions: [
          { c: "grad 2", show: "Der Graph ist eine Parabel." },
          { c: ["f(0) = 0", "f(" + cn(w) + ") = 0"], show: "Nullstellen bei $x = 0$ und $x = " + G.tex(w) + "$" },
          { c: "int(0," + cn(w) + ") = " + cn(A), show: "$\\int_0^{" + G.tex(w) + "} f(x)\\,dx = " + G.tex(A) + "$" },
        ], sample: "-" + (a === 1 ? "" : sn(a)) + "x(x-" + w + ")" },
      }, "Produktform $f(x) = -a\\,x(x - " + G.tex(w) + ")$ und das Integral über $[0; " + G.tex(w) + "]$ in Abhängigkeit von $a$.",
      "Mit $f(x) = -a\\,x(x - " + G.tex(w) + ") = -ax^2 + " + G.tex(w) + "ax$ ist $\\int_0^{" + G.tex(w) + "} f(x)\\,dx = \\left[-\\tfrac{a}{3}x^3 + \\tfrac{" + G.tex(w) + "a}{2}x^2\\right]_0^{" + G.tex(w) + "} = " + G.frac(w * w * w, 6, true) + "\\,a$. Aus $" + G.frac(w * w * w, 6, true) + "\\,a = " + G.tex(A) + "$ folgt $a = " + G.tex(a) + "$, also $f(x) = " + polyTex(G, co) + "$.");
    },
    tangent2(G) {
      const a = G.pick([-1, -0.5, 0.5, 1]), b = G.int(-2, 2), c = G.int(-2, 2), u = G.int(-2, 2), v = u + G.pick([-3, -2, 2, 3]);
      const co = [a, b, c], m = pval(co, u, 1), n = r6(pval(co, u, 0) - m * u), w = pval(co, v, 0);
      const eqs = [eqTex(G, 2, 0, u, pval(co, u, 0)), eqTex(G, 2, 1, u, m), eqTex(G, 2, 0, v, w)];
      const lineTex = (m ? (m === 1 ? "" : m === -1 ? "-" : G.tex(m)) + "x" : "") + (n ? (m ? " " + G.term(n) : G.tex(n)) : m ? "" : "0");
      return step("Baue eine **Parabel**, die an der Stelle $x = " + G.tex(u) + "$ die Gerade $y = " + lineTex + "$ berührt und durch $P" + pt(G, v, w) + "$ geht. Die Tangente zeigt dir, wie gut es passt. " + LIST, {
        mode: "r1", view: fitView([u - 2, u + 2, v], [pval(co, u, 0), w]), show: { tangent: true },
        task: { conditions: [
          { c: "grad 2", show: "Der Graph ist eine Parabel." },
          { c: ["f(" + cn(u) + ") = " + cn(pval(co, u, 0)), "f'(" + cn(u) + ") = " + cn(m)], show: "berührt $y = " + lineTex + "$ bei $x = " + G.tex(u) + "$" },
          { c: "f(" + cn(v) + ") = " + cn(w), show: "$P" + pt(G, v, w) + "$ liegt auf dem Graphen." },
        ], sample: polySrc(co) },
      }, "Berühren heißt: gleicher Funktionswert und gleiche Steigung. Ansatz $f(x) = ax^2 + bx + c$.",
      "Ansatz $" + ansatz(2) + "$, $f'(x) = 2ax + b$:\n\n$" + eqs.join("$\n\n$") + "$\n\nLösung: $f(x) = " + polyTex(G, co) + "$.");
    },
    rational(G) {
      const p = G.pick([-3, -2, -1, 1, 2, 3]), z = G.pick([-3, -2, -1, 0, 1, 2, 3].filter((q) => q !== p)), c = G.pick([-2, -1, 1, 2, 3]);
      const lead = c === 1 ? "" : c === -1 ? "-" : sn(c);
      return step("Baue eine **gebrochenrationale Funktion** mit einer Polstelle bei $x = " + G.tex(p) + "$, der waagerechten Asymptote $y = " + G.tex(c) + "$ und der Nullstelle $x = " + G.tex(z) + "$. " + LIST, {
        mode: "r1", view: { x: [Math.min(p, z) - 5, Math.max(p, z) + 5], y: [-6 + Math.min(0, c), 6 + Math.max(0, c)] },
        task: { conditions: [
          { c: "pol " + cn(p), show: "Polstelle bei $x = " + G.tex(p) + "$" },
          { c: "asymptote " + cn(c), show: "waagerechte Asymptote $y = " + G.tex(c) + "$" },
          { c: "f(" + cn(z) + ") = 0", show: "Nullstelle bei $x = " + G.tex(z) + "$" },
        ], sample: lead + shiftSrc(z) + "/" + shiftSrc(p) },
      }, "Ein Linearfaktor im Nenner macht die Polstelle, einer im Zähler die Nullstelle; sind Zähler- und Nennergrad gleich, ist die Asymptote der Quotient der Leitkoeffizienten.",
      "$f(x) = " + (c === 1 ? "" : c === -1 ? "-" : G.tex(c)) + "\\frac{" + (z === 0 ? "x" : shift(G, z).slice(1, -1)) + "}{" + shift(G, p).slice(1, -1) + "}$: Der Nenner wird bei $x = " + G.tex(p) + "$ null, der Zähler bei $x = " + G.tex(z) +
      "$; für $x \\to \\pm\\infty$ geht der Bruch gegen $1$, also $f(x) \\to " + G.tex(c) + "$.");
    },
    limited(G) {
      const S = G.pick([50, 80, 100, 120, 200]), f0 = G.pick([0, 10, 20]), T = G.pick([2, 3, 4, 5]);
      const fT = r6(S - (S - f0) / 2);
      return step("**Begrenztes Wachstum.** Ein Bestand startet bei $" + G.tex(f0) + "$ und nähert sich der Schranke $S = " + G.tex(S) + "$; nach $" + G.tex(T) +
        "$ Zeiteinheiten ist der Abstand zur Schranke halbiert. Baue das Modell. " + LIST, {
        mode: "r1", view: { x: [-1, 5 * T], y: [-0.15 * S, 1.25 * S] },
        task: { conditions: [
          { c: "f(0) = " + cn(f0), show: "$f(0) = " + G.tex(f0) + "$" },
          { c: "f(" + cn(T) + ") = " + cn(fT), show: "$f(" + G.tex(T) + ") = " + G.tex(fT) + "$" },
          { c: "begrenzt " + cn(S), show: "Die Änderungsrate ist proportional zum Abstand von der Schranke: $f'(x) = k\\,(" + G.tex(S) + " - f(x))$." },
          { c: "grenze+ " + cn(S), show: "$f(x) \\to " + G.tex(S) + "$ für $x \\to \\infty$" },
        ], sample: sn(S) + "-" + sn(S - f0) + "*0,5^(x/" + T + ")" },
      }, "Begrenztes Wachstum: $f(x) = S - (S - f(0))\\,e^{-kx}$. Der Abstand zur Schranke nimmt exponentiell ab.",
      "$f(x) = " + G.tex(S) + " - " + G.tex(S - f0) + "\\,e^{-kx}$ mit $e^{-" + G.tex(T) + "k} = \\tfrac12$, also $k = \\frac{\\ln 2}{" + G.tex(T) + "} \\approx " + G.tex(Math.LN2 / T, 4) +
      "$. Gleichwertig: $f(x) = " + G.tex(S) + " - " + G.tex(S - f0) + " \\cdot 0{,}5^{x/" + G.tex(T) + "}$. Ableiten zeigt $f'(x) = k\\,(" + G.tex(S) + " - f(x))$.");
    },
    saddle3(G) {
      const s = G.int(-2, 2), t = G.int(-2, 2), a = G.pick([-1, -0.5, 0.5, 1]), k = G.pick([-2, -1, 1, 2]);
      const co = [a, r6(-3 * a * s), r6(3 * a * s * s), r6(-a * s * s * s + t)], px = s + k, py = pval(co, px, 0);
      const eqs = [eqTex(G, 3, 0, s, t), eqTex(G, 3, 1, s, 0), eqTex(G, 3, 2, s, 0), eqTex(G, 3, 0, px, py)];
      return step("**Steckbriefaufgabe.** Der Graph einer ganzrationalen Funktion dritten Grades hat den **Sattelpunkt** $S" + pt(G, s, t) + "$ und geht durch $P" + pt(G, px, py) + "$. " + LIST, {
        mode: "r1", view: fitView([s - 3, s + 3, px], [t, py]), show: { d1: true, d2: true },
        task: { conditions: [
          { c: "grad 3", show: "ganzrational vom Grad 3" },
          { c: ["f(" + cn(s) + ") = " + cn(t), "f'(" + cn(s) + ") = 0", "f''(" + cn(s) + ") = 0"], show: "Sattelpunkt $S" + pt(G, s, t) + "$: waagerechte Tangente und Wendepunkt" },
          { c: "f(" + cn(px) + ") = " + cn(py), show: "$P" + pt(G, px, py) + "$ liegt auf dem Graphen." },
        ], sample: polySrc(co) },
      }, "Ein Sattelpunkt ist ein Wendepunkt mit waagerechter Tangente: $f'(x_S) = 0$ und $f''(x_S) = 0$.",
      "Ansatz $" + ansatz(3) + "$:\n\n$" + eqs.join("$\n\n$") + "$\n\nLösung: $f(x) = " + polyTex(G, co) + "$, kurz $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : G.tex(a)) + shift(G, s) + "^3" + (t ? " " + G.term(t) : "") + "$.");
    },
  };
  const ONE_LEVELS = { 1: ["line", "vertex", "zeros2"], 2: ["zeros3", "extrema3", "exp", "sine"], 3: ["turn3", "even4", "odd3", "area", "tangent2"], 4: ["rational", "limited", "saddle3", "turn3", "even4"] };

  gen("lab-funktion", {
    title: "Funktionen nach Steckbrief bauen",
    make(level, G) { return ONE[G.pick(ONE_LEVELS[level] || ONE_LEVELS[2])](G); },
  });

  // ---------------------------------------------------------------- two variables
  const LIST2 = "Unter der Fläche stehen die Bedingungen; jede hakt sich ab, sobald dein Term sie erfüllt. Unter »Höhenlinien« lässt sich ein Punkt verschieben, der seinen Gradienten zeigt.";
  function step2(md, conditions, sample, hint, explain, view) {
    return step(md + " " + LIST2, { mode: "r2", view: view || { x: [-3, 3], y: [-3, 3] }, task: { conditions, sample } }, hint, explain);
  }
  const quadSrc = (k, d, v) => (k === 1 ? "" : k === -1 ? "-" : sn(k)) + shiftSrc(d, v) + "^2";
  const quadTex = (G, k, d, v) => (k === 1 ? "" : k === -1 ? "-" : G.tex(k)) + shift(G, d, v) + "^2";
  const plus = (G, a, b) => (b.startsWith("-") ? a + " - " + b.slice(1) : a + " + " + b);
  const plusSrc = (a, b) => (b.startsWith("-") ? a + b : a + "+" + b);
  const HESSE = "Kritischer Punkt: $f_x = f_y = 0$. Die Hesse-Determinante $D = f_{xx} f_{yy} - f_{xy}^2$ entscheidet: $D > 0$ und $f_{xx} > 0$ Minimum, $D > 0$ und $f_{xx} < 0$ Maximum, $D < 0$ Sattel.";

  const TWO = {
    plane(G) {
      const a = G.pick([-2, -1, -0.5, 0.5, 1, 2]), b = G.pick([-2, -1, -0.5, 0.5, 1, 2]), c = G.int(-2, 2);
      const src = (a === 1 ? "" : a === -1 ? "-" : sn(a)) + "x" + (b < 0 ? "-" : "+") + (Math.abs(b) === 1 ? "" : sn(Math.abs(b))) + "y" + constSrc(c);
      return step2("Baue eine **Ebene**, die in $x$-Richtung die Steigung $" + G.tex(a) + "$ und in $y$-Richtung die Steigung $" + G.tex(b) + "$ hat und die $z$-Achse bei $z = " + G.tex(c) + "$ schneidet.", [
        { c: ["fxx(0.5,0.5) = 0", "fyy(0.5,0.5) = 0", "fxy(0.5,0.5) = 0", "fxx(-1,2) = 0", "fyy(2,-1) = 0"], show: "eine Ebene: nirgends gekrümmt" },
        { c: "f(0,0) = " + cn(c), show: "$f(0, 0) = " + G.tex(c) + "$" },
        { c: ["fx(1,1) = " + cn(a), "fx(-1,2) = " + cn(a)], show: "Steigung $" + G.tex(a) + "$ in $x$-Richtung: $f_x = " + G.tex(a) + "$" },
        { c: ["fy(1,1) = " + cn(b), "fy(2,-1) = " + cn(b)], show: "Steigung $" + G.tex(b) + "$ in $y$-Richtung: $f_y = " + G.tex(b) + "$" },
      ], src, "Eine Ebene als Funktion: $f(x, y) = ax + by + c$. Die partiellen Ableitungen sind die Steigungen in die Achsenrichtungen.",
      "$f(x, y) = " + polyTex(G, [a, 0]) + (b < 0 ? " - " : " + ") + (Math.abs(b) === 1 ? "" : G.tex(Math.abs(b))) + "y" + constTail(G, c) + "$ mit $f_x = " + G.tex(a) + "$, $f_y = " + G.tex(b) + "$ und $f(0, 0) = " + G.tex(c) + "$.");
    },
    bowl(G) {
      const k = G.pick([0.5, 1, 2]), c = G.int(-2, 2);
      return step2("Baue ein **Rotationsparaboloid** mit dem Tiefpunkt $" + pt3(G, 0, 0, c) + "$, das über dem Punkt $(1 \\mid 0)$ die Höhe $" + G.tex(c + k) + "$ hat.", [
        { c: "rotsym", show: "rotationssymmetrisch um die $z$-Achse: die Höhenlinien sind Kreise" },
        { c: ["min 0,0", "f(0,0) = " + cn(c)], show: "Tiefpunkt $" + pt3(G, 0, 0, c) + "$" },
        { c: "f(1,0) = " + cn(c + k), show: "$f(1, 0) = " + G.tex(c + k) + "$" },
      ], (k === 1 ? "" : sn(k)) + "(x^2+y^2)" + constSrc(c), "Rotationssymmetrisch heißt: $f$ hängt nur von $x^2 + y^2$ ab.",
      "$f(x, y) = " + (k === 1 ? "" : G.tex(k)) + "(x^2 + y^2)" + constTail(G, c) + "$: Höhenlinien $x^2 + y^2 = r^2$ sind Kreise, $f(1, 0) = " + G.tex(k) + constTail(G, c) + " = " + G.tex(c + k) + "$.");
    },
    minmax(G, kind) {
      const max = kind === "max";
      let p, q;
      do { p = G.int(-1, 1); q = G.int(-1, 1); } while (p === 0 && q === 0);
      const k1 = (max ? -1 : 1) * G.pick([0.5, 1, 2]), k2 = (max ? -1 : 1) * G.pick([0.5, 1, 2]), c = G.int(-2, 2);
      const word = max ? "Hochpunkt" : "Tiefpunkt";
      return step2("Baue eine Fläche mit dem **" + word + "** $" + pt3(G, p, q, c) + "$, die über $(" + G.tex(p + 1) + " \\mid " + G.tex(q) + ")$ die Höhe $" + G.tex(c + k1) + "$ und über $(" + G.tex(p) + " \\mid " + G.tex(q + 1) + ")$ die Höhe $" + G.tex(c + k2) + "$ hat.", [
        { c: [(max ? "max " : "min ") + cn(p) + "," + cn(q), "f(" + cn(p) + "," + cn(q) + ") = " + cn(c)], show: word + " $" + pt3(G, p, q, c) + "$" },
        { c: "f(" + cn(p + 1) + "," + cn(q) + ") = " + cn(c + k1), show: "$f(" + G.tex(p + 1) + ", " + G.tex(q) + ") = " + G.tex(c + k1) + "$" },
        { c: "f(" + cn(p) + "," + cn(q + 1) + ") = " + cn(c + k2), show: "$f(" + G.tex(p) + ", " + G.tex(q + 1) + ") = " + G.tex(c + k2) + "$" },
      ], plusSrc(quadSrc(k1, p, "x"), quadSrc(k2, q, "y")) + constSrc(c), "Verschobenes Paraboloid: $f(x, y) = a(x - x_0)^2 + b(y - y_0)^2 + c$. " + (max ? "Für ein Maximum sind $a$ und $b$ negativ." : "Für ein Minimum sind $a$ und $b$ positiv."),
      "$f(x, y) = " + plus(G, quadTex(G, k1, p, "x"), quadTex(G, k2, q, "y")) + constTail(G, c) + "$. Im Punkt $(" + G.tex(p) + " \\mid " + G.tex(q) + ")$ ist der Gradient null, $f_{xx} = " + G.tex(2 * k1) + "$, $f_{yy} = " + G.tex(2 * k2) + "$, $f_{xy} = 0$, also $D = " + G.tex(4 * k1 * k2) + " > 0$: " + (max ? "Maximum" : "Minimum") + ".");
    },
    saddle(G, shifted) {
      const p = shifted ? G.int(-1, 1) : 0, q = shifted ? G.pick([-1, 1]) : 0, k1 = G.pick([0.5, 1, 2]), k2 = G.pick([0.5, 1, 2]), c = G.int(-2, 2);
      return step2("Baue eine Fläche mit einem **Sattelpunkt** in $" + pt3(G, p, q, c) + "$, die von dort aus in $x$-Richtung ansteigt ($f(" + G.tex(p + 1) + ", " + G.tex(q) + ") = " + G.tex(c + k1) + "$) und in $y$-Richtung abfällt ($f(" + G.tex(p) + ", " + G.tex(q + 1) + ") = " + G.tex(c - k2) + "$).", [
        { c: ["sattel " + cn(p) + "," + cn(q), "f(" + cn(p) + "," + cn(q) + ") = " + cn(c)], show: "Sattelpunkt $" + pt3(G, p, q, c) + "$" },
        { c: "f(" + cn(p + 1) + "," + cn(q) + ") = " + cn(c + k1), show: "$f(" + G.tex(p + 1) + ", " + G.tex(q) + ") = " + G.tex(c + k1) + "$" },
        { c: "f(" + cn(p) + "," + cn(q + 1) + ") = " + cn(c - k2), show: "$f(" + G.tex(p) + ", " + G.tex(q + 1) + ") = " + G.tex(c - k2) + "$" },
      ], plusSrc(quadSrc(k1, p, "x"), quadSrc(-k2, q, "y")) + constSrc(c), "Ein Sattel steigt in eine Richtung an und fällt in die andere: $f(x, y) = a(x - x_0)^2 - b(y - y_0)^2 + c$ mit $a, b > 0$.",
      "$f(x, y) = " + plus(G, quadTex(G, k1, p, "x"), quadTex(G, -k2, q, "y")) + constTail(G, c) + "$: $f_{xx} = " + G.tex(2 * k1) + "$, $f_{yy} = " + G.tex(-2 * k2) + "$, $D = " + G.tex(-4 * k1 * k2) + " < 0$, also ein Sattel. " + HESSE);
    },
    gradient(G) {
      let p, q, u, v;
      do { p = G.int(-1, 1); q = G.int(-1, 1); u = G.int(-2, 2); v = G.int(-2, 2); } while (u === p || v === q);
      const k1 = G.pick([0.5, 1, 1.5]), k2 = G.pick([0.5, 1, 1.5]), c = G.int(-2, 1);
      const g1 = r6(2 * k1 * (u - p)), g2 = r6(2 * k2 * (v - q));
      return step2("Baue eine Fläche mit dem **Tiefpunkt** $" + pt3(G, p, q, c) + "$, deren Gradient im Punkt $(" + G.tex(u) + " \\mid " + G.tex(v) + ")$ der Vektor $\\begin{pmatrix} " + G.tex(g1) + " \\\\ " + G.tex(g2) + " \\end{pmatrix}$ ist.", [
        { c: ["min " + cn(p) + "," + cn(q), "f(" + cn(p) + "," + cn(q) + ") = " + cn(c)], show: "Tiefpunkt $" + pt3(G, p, q, c) + "$" },
        { c: ["fx(" + cn(u) + "," + cn(v) + ") = " + cn(g1), "fy(" + cn(u) + "," + cn(v) + ") = " + cn(g2)], show: "$\\nabla f(" + G.tex(u) + ", " + G.tex(v) + ") = (" + G.tex(g1) + ", " + G.tex(g2) + ")$" },
      ], plusSrc(quadSrc(k1, p, "x"), quadSrc(k2, q, "y")) + constSrc(c), "Ansatz $f(x, y) = a(x - x_0)^2 + b(y - y_0)^2 + c$; der Gradient ist $(2a(x - x_0), 2b(y - y_0))$.",
      "Mit $f(x, y) = a" + shift(G, p) + "^2 + b" + shift(G, q, "y") + "^2" + constTail(G, c) + "$ ist $\\nabla f(" + G.tex(u) + ", " + G.tex(v) + ") = (" + G.tex(2 * (u - p)) + "a, " + G.tex(2 * (v - q)) + "b)$. Also $a = " + G.tex(k1) + "$ und $b = " + G.tex(k2) +
      "$: $f(x, y) = " + plus(G, quadTex(G, k1, p, "x"), quadTex(G, k2, q, "y")) + constTail(G, c) + "$.");
    },
    dome(G) {
      const c = G.int(2, 4), r = G.pick([1, 2]), lv = c - G.pick([1, 2, 4]);
      const k = r6((c - lv) / (r * r));
      return step2("Baue einen **Hügel**: Der Ursprung ist ein Maximum mit $f(0, 0) = " + G.tex(c) + "$, die Höhenlinien sind Kreise, und die Höhenlinie $z = " + G.tex(lv) + "$ ist der Kreis mit dem Radius $" + G.tex(r) + "$.", [
        { c: "rotsym", show: "Höhenlinien sind Kreise um den Ursprung" },
        { c: ["max 0,0", "f(0,0) = " + cn(c)], show: "Hochpunkt $" + pt3(G, 0, 0, c) + "$" },
        { c: "f(" + cn(r) + ",0) = " + cn(lv), show: "Die Höhenlinie $z = " + G.tex(lv) + "$ hat den Radius $" + G.tex(r) + "$." },
      ], sn(c) + "-" + (k === 1 ? "" : sn(k)) + "(x^2+y^2)", "Ansatz $f(x, y) = c - k(x^2 + y^2)$: Auf dem Kreis mit Radius $r$ ist $f = c - kr^2$.",
      "$f(x, y) = " + G.tex(c) + " - " + (k === 1 ? "" : G.tex(k)) + "(x^2 + y^2)$: Aus $" + G.tex(c) + " - k \\cdot " + G.tex(r * r) + " = " + G.tex(lv) + "$ folgt $k = " + G.tex(k) + "$.");
    },
    twoMin(G) {
      const a = G.pick([1, 1.5]), c = G.int(-1, 1), a2 = r6(a * a);
      return step2("Baue eine Fläche mit **zwei Tiefpunkten** $" + pt3(G, -a, 0, c) + "$ und $" + pt3(G, a, 0, c) + "$ und einem **Sattelpunkt** im Ursprung, wie ein Gebirgspass zwischen zwei Tälern.", [
        { c: ["min " + cn(a) + ",0", "f(" + cn(a) + ",0) = " + cn(c)], show: "Tiefpunkt $" + pt3(G, a, 0, c) + "$" },
        { c: ["min " + cn(-a) + ",0", "f(" + cn(-a) + ",0) = " + cn(c)], show: "Tiefpunkt $" + pt3(G, -a, 0, c) + "$" },
        { c: "sattel 0,0", show: "Sattelpunkt über dem Ursprung" },
      ], "(x^2-" + sn(a2) + ")^2+y^2" + constSrc(c), "Ein Ausdruck, der für $x = \\pm " + G.tex(a) + "$ null wird und sonst positiv ist: $(x^2 - " + G.tex(a2) + ")^2$. Dazu $y^2$, damit es in $y$-Richtung ansteigt.",
      "$f(x, y) = (x^2 - " + G.tex(a2) + ")^2 + y^2" + constTail(G, c) + "$: $f_x = 4x(x^2 - " + G.tex(a2) + ")$ und $f_y = 2y$ sind null für $x \\in \\{0, \\pm " + G.tex(a) + "\\}$, $y = 0$. Bei $x = \\pm " + G.tex(a) +
      "$ ist $f_{xx} = " + G.tex(8 * a2) + " > 0$ und $D > 0$ (Minimum), bei $x = 0$ ist $f_{xx} = " + G.tex(-4 * a2) + " < 0$, $f_{yy} = 2$, $D < 0$ (Sattel).",
      { x: [-(a + 0.8), a + 0.8], y: [-1.6, 1.6] });
    },
    minSaddle(G) {
      const a = G.pick([1, 1.5]), max = G.chance(0.5), c = G.int(-1, 1), m = r6(3 * a * a);
      const src = (max ? "-x^3+" : "x^3-") + sn(m) + "x" + (max ? "-y^2" : "+y^2") + constSrc(c);
      const tex = (max ? "-x^3 + " : "x^3 - ") + G.tex(m) + "x" + (max ? " - y^2" : " + y^2") + constTail(G, c);
      const word = max ? "Hochpunkt" : "Tiefpunkt";
      return step2("Baue eine Fläche mit einem **" + word + "** über $(" + G.tex(a) + " \\mid 0)$, einem **Sattelpunkt** über $(" + G.tex(-a) + " \\mid 0)$ und $f(0, 0) = " + G.tex(c) + "$.", [
        { c: (max ? "max " : "min ") + cn(a) + ",0", show: word + " über $(" + G.tex(a) + " \\mid 0)$" },
        { c: "sattel " + cn(-a) + ",0", show: "Sattelpunkt über $(" + G.tex(-a) + " \\mid 0)$" },
        { c: "f(0,0) = " + cn(c), show: "$f(0, 0) = " + G.tex(c) + "$" },
      ], src, "Eine kubische Funktion in $x$ hat ein lokales Maximum und ein lokales Minimum; ein quadratischer Term in $y$ entscheidet, ob daraus Extremum oder Sattel wird.",
      "$f(x, y) = " + tex + "$: $f_x = " + (max ? "-3x^2 + " : "3x^2 - ") + G.tex(m) + "$ ist null bei $x = \\pm " + G.tex(a) + "$, $f_y = " + (max ? "-2y" : "2y") + "$ bei $y = 0$. " + HESSE);
    },
  };
  const TWO_LEVELS = {
    1: [(G) => TWO.plane(G), (G) => TWO.bowl(G)],
    2: [(G) => TWO.minmax(G, "min"), (G) => TWO.minmax(G, "max"), (G) => TWO.saddle(G, false)],
    3: [(G) => TWO.saddle(G, true), (G) => TWO.gradient(G), (G) => TWO.dome(G)],
    4: [(G) => TWO.twoMin(G), (G) => TWO.minSaddle(G), (G) => TWO.gradient(G)],
  };

  gen("lab-flaeche", {
    title: "Flächen im Raum bauen",
    make(level, G) { return G.pick(TWO_LEVELS[level] || TWO_LEVELS[2])(G); },
  });
})();
