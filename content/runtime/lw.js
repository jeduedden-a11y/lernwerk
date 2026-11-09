/* Lernwerk lesson runtime.
 *
 * Loaded by the native shell into a WKWebView (lw://app/runtime/index.html). The shell draws the Liquid Glass
 * chrome and talks to this file through two channels:
 *   native -> page: LW.start(options), LW.primary(), LW.setInsets({top, bottom}), LW.setTheme({accent})
 *   page -> native: window.webkit.messageHandlers.lw.postMessage({type: ...})
 *     ready | progress {index,total} | primary {label,enabled,style} | feedback {correct}
 *     finished {lessonId, results, score} | error {message}
 * Everything here ships over the air with the lessons, so new question types and widgets need no app update.
 */
(function () {
  "use strict";

  const LW = (window.LW = window.LW || {});
  LW.version = "1.4.0";
  LW.api = 1;
  LW.widgets = LW.widgets || {};
  LW.widget = function (name, def) { LW.widgets[name] = def; };

  // ------------------------------------------------------------------ bridge

  function post(msg) {
    try {
      const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.lw;
      if (h) h.postMessage(msg);
      else if (typeof LW.devBridge === "function") LW.devBridge(msg);
    } catch (e) {
      /* the page must keep working even if the shell is gone */
    }
  }
  LW.post = post;

  window.addEventListener("error", function (e) {
    post({ type: "error", message: String((e && e.message) || e) });
  });

  // ------------------------------------------------------------------ small helpers

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k === "text") n.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? "" : v);
      }
    }
    if (children) for (const c of [].concat(children)) if (c != null) n.append(c);
    return n;
  }
  LW.el = el;
  LW.esc = esc;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seedStr) {
    const r = rng(hash(seedStr));
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // Never present the solution order unshuffled when there is a choice.
    if (a.length > 1 && a.every((x, i) => x === list[i])) a.push(a.shift());
    return a;
  }
  LW.shuffled = shuffled;

  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------ math

  const MACROS = {
    "\\R": "\\mathbb{R}", "\\N": "\\mathbb{N}", "\\Z": "\\mathbb{Z}", "\\Q": "\\mathbb{Q}",
    "\\C": "\\mathbb{C}", "\\K": "\\mathbb{K}", "\\eps": "\\varepsilon", "\\abs": "\\left|#1\\right|",
    "\\norm": "\\left\\|#1\\right\\|", "\\set": "\\left\\{#1\\right\\}", "\\folge": "(#1_n)_{n\\in\\mathbb{N}}",
  };

  function math(tex, display) {
    if (window.katex && typeof window.katex.renderToString === "function") {
      try {
        return window.katex.renderToString(tex, {
          displayMode: !!display, throwOnError: false, strict: "ignore", trust: false, output: "html", macros: MACROS,
        });
      } catch (e) {
        return '<span class="lw-error">' + esc(tex) + "</span>";
      }
    }
    return display ? '<div class="katex-fallback">' + esc(tex) + "</div>" : "<code>" + esc(tex) + "</code>";
  }
  LW.math = math;

  // ------------------------------------------------------------------ markdown (Obsidian-flavoured subset)

  const CALLOUT_ICON = {
    info: "i", note: "i", tip: "?", hint: "?", important: "!", warning: "!", caution: "!", danger: "!",
    error: "!", success: "✓", check: "✓", definition: "D", satz: "S", beispiel: "B", example: "B",
    question: "?", quote: "”", abstract: "≡", summary: "≡",
  };

  function inline(src, stash) {
    let s = esc(src);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/==(.+?)==/g, "<mark>$1</mark>");
    s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, t, a) => "<strong>" + (a || t) + "</strong>");
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[+i]);
  }

  function md(src) {
    if (src == null) return "";
    if (Array.isArray(src)) src = src.join("\n");
    const stash = [];
    const keep = (html) => "\u0000" + (stash.push(html) - 1) + "\u0000";
    let text = String(src).replace(/\r\n?/g, "\n");

    // fenced code, then display math, inline code, inline math
    text = text.replace(/```[^\n]*\n([\s\S]*?)```/g, (m, code) => "\n" + keep("<pre><code>" + esc(code.replace(/\n$/, "")) + "</code></pre>") + "\n");
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => keep(math(tex.trim(), true)));
    text = text.replace(/`([^`\n]+)`/g, (m, code) => keep("<code>" + esc(code) + "</code>"));
    text = text.replace(/(^|[^\\$])\$(?!\s)([^$\n]+?)\$(?!\d)/g, (m, pre, tex) => pre + keep(math(tex, false)));
    text = text.replace(/\\\$/g, "$");
    return blocks(text, stash);
  }

  /** Block-level Markdown on text whose code and math already sit in the stash. */
  function blocks(text, stash) {
    const lines = text.split("\n");
    const out = [];
    let i = 0;
    const isBlank = (l) => /^\s*$/.test(l);

    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }

      // block placeholders on their own line (code blocks, display math)
      const only = /^\s*\u0000(\d+)\u0000\s*$/.exec(line);
      if (only) { out.push(stash[+only[1]]); i++; continue; }

      let m;
      if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
        out.push("<h" + m[1].length + ">" + inline(m[2], stash) + "</h" + m[1].length + ">");
        i++; continue;
      }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      if (/^\s*>/.test(line)) {
        const block = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { block.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        const head = /^\[!(\w+)\][+-]?\s*(.*)$/.exec(block[0] || "");
        if (head) {
          const kind = head[1].toLowerCase();
          const title = head[2] || kind.charAt(0).toUpperCase() + kind.slice(1);
          const inner = blocks(block.slice(1).join("\n"), stash);
          out.push('<div class="lw-callout" data-kind="' + esc(kind) + '"><div class="lw-callout-title"><span class="ico">' +
            esc(CALLOUT_ICON[kind] || "i") + "</span><span>" + inline(title, stash) + "</span></div>" + inner + "</div>");
        } else {
          out.push('<div class="lw-callout" data-kind="quote">' + blocks(block.join("\n"), stash) + "</div>");
        }
        continue;
      }

      // tables: header row, separator row, body rows
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => inline(c.trim(), stash));
        const headCells = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && !isBlank(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push("<table><thead><tr>" + headCells.map((c) => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table>");
        continue;
      }

      if ((m = /^\s*([-*]|\d+[.)])\s+/.exec(line))) {
        const ordered = /\d/.test(m[1]);
        const items = [];
        while (i < lines.length && !isBlank(lines[i])) {
          const lm = /^\s*([-*]|\d+[.)])\s+(.*)$/.exec(lines[i]);
          if (lm) items.push([lm[2]]);
          else if (items.length) items[items.length - 1].push(lines[i].trim());
          else break;
          i++;
        }
        const tag = ordered ? "ol" : "ul";
        out.push("<" + tag + ">" + items.map((it) => "<li>" + it.map((l) => inline(l, stash)).join("<br>") + "</li>").join("") + "</" + tag + ">");
        continue;
      }

      const para = [];
      while (i < lines.length && !isBlank(lines[i]) && !/^(#{1,3}\s|\s*>|\s*([-*]|\d+[.)])\s+|\s*```)/.test(lines[i]) &&
             !/^\s*\u0000\d+\u0000\s*$/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (!para.length) { para.push(lines[i]); i++; }
      out.push("<p>" + para.map((p) => inline(p, stash)).join("<br>") + "</p>");
    }
    return out.join("\n");
  }
  LW.md = md;

  function mdEl(src, cls) {
    return el("div", { class: "lw-md" + (cls ? " " + cls : ""), html: md(src) });
  }

  // ------------------------------------------------------------------ expressions (for widget parameters)

  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: Math.log, log: Math.log10, sqrt: Math.sqrt,
    abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign, atan: Math.atan,
    min: Math.min, max: Math.max, fact: (n) => { let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; },
  };
  const CONSTS = { pi: Math.PI, e: Math.E };

  /**
   * Compiles "(-1)^n/n + 2" into a function of a variable object. Implicit products like "2n" are allowed.
   * Also understands comparisons (< <= > >= == !=), && and ||, the ternary a ? b : c, and calls of functions
   * passed in the variables under __f (used by widgets: "f(x0 + h)").
   */
  function expr(src) {
    const s = String(src).replace(/−/g, "-").replace(/·|⋅/g, "*").replace(/π/g, "pi");
    const toks = [];
    const re = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)|([A-Za-z_][A-Za-z_0-9]*'?)|(\*\*|<=|>=|==|!=|&&|\|\||[-+*/^(),!<>?:]))/gy;
    let m;
    while (re.lastIndex < s.length) {
      const at = re.lastIndex;
      m = re.exec(s);
      if (!m) {
        if (/^\s*$/.test(s.slice(at))) break;
        throw new Error("Unerwartetes Zeichen in " + src);
      }
      if (m[1]) toks.push({ t: "num", v: parseFloat(m[1]) });
      else if (m[2]) toks.push({ t: "id", v: m[2] });
      else toks.push({ t: "op", v: m[3] === "**" ? "^" : m[3] });
    }
    let p = 0;
    const peek = () => toks[p];
    const take = () => toks[p++];
    const isOp = (v) => peek() && peek().t === "op" && peek().v === v;
    const startsPrimary = () => peek() && (peek().t === "num" || peek().t === "id" || (peek().t === "op" && peek().v === "("));

    function args() {
      take(); // (
      const list = [ternary()];
      while (isOp(",")) { take(); list.push(ternary()); }
      if (!isOp(")")) throw new Error("Klammer fehlt in " + src);
      take();
      return list;
    }
    function primary() {
      const tk = take();
      if (!tk) throw new Error("Ausdruck endet zu früh: " + src);
      if (tk.t === "num") return () => tk.v;
      if (tk.t === "op" && tk.v === "(") { const e = ternary(); if (!isOp(")")) throw new Error("Klammer fehlt in " + src); take(); return e; }
      if (tk.t === "op" && tk.v === "-") { const e = power(); return (v) => -e(v); }
      if (tk.t === "op" && tk.v === "+") return power();
      if (tk.t === "id") {
        const name = tk.v;
        if (isOp("(")) {
          const a = args();
          if (FUNCS[name]) { const f = FUNCS[name]; return (v) => f.apply(null, a.map((x) => x(v))); }
          return (v) => {
            const uf = v && v.__f && v.__f[name];
            const vals = a.map((x) => x(v));
            if (uf) return uf.apply(null, vals);
            if (vals.length === 1 && v && name in v) return v[name] * vals[0];
            throw new Error("Unbekannte Funktion " + name);
          };
        }
        if (name in CONSTS && name !== "e") return () => CONSTS[name];
        return (v) => {
          if (v && name in v) return v[name];
          if (name in CONSTS) return CONSTS[name];
          throw new Error("Unbekannte Variable " + name);
        };
      }
      throw new Error("Unerwartetes Symbol in " + src);
    }
    function postfix() {
      let e = primary();
      while (isOp("!")) { take(); const inner = e; e = (v) => FUNCS.fact(inner(v)); }
      return e;
    }
    function power() {
      const base = postfix();
      if (isOp("^")) { take(); const ex = unary(); return (v) => Math.pow(base(v), ex(v)); }
      return base;
    }
    function unary() {
      if (isOp("-")) { take(); const e = unary(); return (v) => -e(v); }
      if (isOp("+")) { take(); return unary(); }
      return power();
    }
    function mul() {
      let e = unary();
      for (;;) {
        if (isOp("*") || isOp("/")) {
          const op = take().v; const r = unary(); const l = e;
          e = op === "*" ? (v) => l(v) * r(v) : (v) => l(v) / r(v);
        } else if (startsPrimary()) {
          const r = unary(); const l = e; e = (v) => l(v) * r(v);
        } else return e;
      }
    }
    function add() {
      let e = mul();
      while (isOp("+") || isOp("-")) {
        const op = take().v; const r = mul(); const l = e;
        e = op === "+" ? (v) => l(v) + r(v) : (v) => l(v) - r(v);
      }
      return e;
    }
    const CMP = { "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, ">=": (a, b) => a >= b, "==": (a, b) => Math.abs(a - b) < 1e-9, "!=": (a, b) => Math.abs(a - b) >= 1e-9 };
    function cmp() {
      const l = add();
      const tk = peek();
      if (tk && tk.t === "op" && CMP[tk.v]) { take(); const r = add(); const f = CMP[tk.v]; return (v) => (f(l(v), r(v)) ? 1 : 0); }
      return l;
    }
    function and() {
      let e = cmp();
      while (isOp("&&")) { take(); const l = e, r = cmp(); e = (v) => (l(v) && r(v) ? 1 : 0); }
      return e;
    }
    function or() {
      let e = and();
      while (isOp("||")) { take(); const l = e, r = and(); e = (v) => (l(v) || r(v) ? 1 : 0); }
      return e;
    }
    function ternary() {
      const c = or();
      if (isOp("?")) {
        take(); const a = ternary();
        if (!isOp(":")) throw new Error("Doppelpunkt fehlt in " + src);
        take(); const b = ternary();
        return (v) => (c(v) ? a(v) : b(v));
      }
      return c;
    }
    const fn = ternary();
    if (p < toks.length) throw new Error("Unerwartetes Ende in " + src);
    return fn;
  }
  LW.expr = expr;

  /** Reads "0,5", "1/3", "-2", "sqrt(2)", "pi/4". NaN if it is not a number. */
  function parseNumber(input) {
    let s = String(input || "").trim().replace(/\s+/g, "");
    if (!s) return NaN;
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, "");
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    try {
      const v = expr(s)({});
      return typeof v === "number" ? v : NaN;
    } catch (e) {
      return NaN;
    }
  }
  LW.parseNumber = parseNumber;

  const normText = (s) => String(s || "").normalize("NFC").toLowerCase().trim().replace(/\s+/g, " ").replace(/[.;:]+$/, "");

  // ------------------------------------------------------------------ icons (SVG, no emoji)

  const ICON_CHECK = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3.2 8.4l3 3 6.6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_CROSS = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  // ------------------------------------------------------------------ step renderers
  //
  // Each renderer returns { el, question: bool, canCheck(), check() -> {correct, detail?}, reveal(), lock() }.

  const LABELS = {
    text: "Erklärung", widget: "Ausprobieren", choice: "Frage", multi: "Mehrfachauswahl", truefalse: "Wahr oder falsch",
    numeric: "Rechnen", cloze: "Lückentext", order: "Reihenfolge", match: "Zuordnen", sort: "Einordnen", reveal: "Selbst prüfen",
    summary: "Zusammenfassung", anim: "Animation", gen: "Aufgabe",
    spot: "Fehler finden", proof: "Beweis bauen", estimate: "Schätzen", timeline: "Zeitstrahl", quadrant: "Vierfeldertafel",
  };

  // ------------------------------------------------------------------ difficulty levels
  //
  // Generated tasks come in four levels. The colours run from green to purple (lw.css, --lv1 … --lv4).

  const LEVELS = [null, { name: "Leicht" }, { name: "Mittel" }, { name: "Schwer" }, { name: "Experte" }];
  LW.levels = LEVELS;
  const clampLevel = (l) => Math.max(1, Math.min(4, Math.round(+l || 1)));

  function levelChip(level) {
    const lv = clampLevel(level);
    const bars = el("span", { class: "bars", "aria-hidden": "true" }, [1, 2, 3, 4].map((k) => el("i", { class: k <= lv ? "on" : "" })));
    return el("span", { class: "lw-level lv" + lv, title: "Schwierigkeit: " + LEVELS[lv].name }, [bars, el("span", { text: LEVELS[lv].name })]);
  }
  LW.levelChip = levelChip;

  // ------------------------------------------------------------------ task generators
  //
  // LW.generator(name, { title, make(level, G, params) -> step }) returns an ordinary step (choice, numeric, cloze,
  // order, match, sort, truefalse, widget with goal) with fresh numbers for every seed. Lessons use them as
  // { "type": "gen", "gen": name, "level": 2 }, the training mode strings several together.

  LW.generators = LW.generators || {};
  LW.generator = function (name, def) { LW.generators[name] = def; };
  LW.rng = rng;
  LW.hash = hash;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

  /** Helpers handed to generators: random numbers from the step's seed and number formatting. */
  function genKit(r) {
    const G = {
      r,
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      chance: (p) => r() < p,
      sign: () => (r() < 0.5 ? -1 : 1),
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
      },
      pickN: (arr, n) => G.shuffle(arr).slice(0, n),
      gcd,
      round: (x, d) => { const f = Math.pow(10, d == null ? 4 : d); return Math.round(x * f) / f; },
      fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; },
      binom(n, k) { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); },
      /** Number for running text: decimal comma, real minus sign. */
      fmt(x, d) {
        if (!isFinite(x)) return x > 0 ? "∞" : "−∞";
        const s = new Intl.NumberFormat("de-DE", { maximumFractionDigits: d == null ? 4 : d, useGrouping: Math.abs(x) >= 10000 }).format(Math.abs(x) < 1e-12 ? 0 : x);
        return s.replace("-", "−");
      },
      /** Number inside $…$: decimal comma as {,}. */
      tex(x, d) {
        if (!isFinite(x)) return x > 0 ? "\\infty" : "-\\infty";
        const s = new Intl.NumberFormat("en-US", { maximumFractionDigits: d == null ? 4 : d, useGrouping: false }).format(Math.abs(x) < 1e-12 ? 0 : x);
        return s.replace(".", "{,}");
      },
      /** Reduced fraction p/q in TeX (\tfrac, or an integer). */
      frac(p, q, big) {
        if (q < 0) { p = -p; q = -q; }
        const g = gcd(p, q);
        p /= g; q /= g;
        if (q === 1) return String(p);
        return (p < 0 ? "-" : "") + (big ? "\\frac{" : "\\tfrac{") + Math.abs(p) + "}{" + q + "}";
      },
      /** Signed term for sums: "+ 3", "- 2". */
      term(c, d) { return (c < 0 ? "- " : "+ ") + G.tex(Math.abs(c), d); },
      /** Choice options: the correct answer and distinct distractors, each with an optional reason. */
      options(correct, wrong) {
        const seen = new Set([String(correct.md)]);
        const out = [Object.assign({ correct: true }, correct)];
        for (const w of wrong) {
          if (out.length >= 4) break;
          if (!w || seen.has(String(w.md))) continue;
          seen.add(String(w.md));
          out.push(w);
        }
        return out;
      },
    };
    return G;
  }
  LW.genKit = genKit;

  /** Makes a concrete step from a "gen" step; null if the generator is missing. */
  function realize(step, seedStr) {
    const def = LW.generators[step.gen];
    if (!def) return null;
    const level = clampLevel(step.level || (step.params && step.params.level) || 1);
    const made = def.make(level, genKit(rng(hash(seedStr))), step.params || {}) || {};
    return Object.assign({}, made, {
      id: step.id, lessonId: step.lessonId, lessonTitle: step.lessonTitle, from: step.from,
      level, gen: step.gen, genSource: step, review: step.review,
      label: step.label || made.label || def.title || LABELS[made.type],
    });
  }
  LW.realize = realize;

  function shell(step, ctx) {
    const label = step.label || LABELS[step.type] || "Schritt";
    const card = el("section", { class: "lw-step", "data-type": step.type, "data-id": step.id });
    card.style.scrollMarginTop = "calc(var(--inset-top) + 8px)";
    const head = el("div", { class: "lw-step-label" }, [el("span", { class: "dot" }), el("span", { text: label })]);
    if (step.level) head.append(levelChip(step.level));
    card.append(head);
    if (step.from && ctx.mode === "review") card.append(el("div", { class: "lw-subtitle", style: "margin:-4px 0 8px;font-size:0.82em", text: step.from }));
    if (step.md) card.append(mdEl(step.md));
    if (step.image) card.append(el("img", { src: ctx.asset(step.image), alt: step.alt || "", style: "width:100%;margin-top:10px;border-radius:14px" }));
    return card;
  }

  function feedbackBox() {
    const box = el("div", { class: "lw-feedback", role: "status", "aria-live": "polite" });
    return {
      el: box,
      show(ok, title, body) {
        box.className = "lw-feedback show " + (ok ? "ok" : "no");
        box.innerHTML = "";
        box.append(el("div", { class: "fb-title", text: title }));
        if (body) box.append(mdEl(body));
      },
      hide() { box.className = "lw-feedback"; },
    };
  }

  function hintButton(step, card) {
    if (!step.hint) return;
    const h = el("div", { class: "lw-hint" }, [mdEl(step.hint)]);
    const b = el("button", { class: "lw-hint-btn", text: "Hinweis anzeigen", onclick: () => { h.classList.toggle("open"); b.textContent = h.classList.contains("open") ? "Hinweis ausblenden" : "Hinweis anzeigen"; } });
    card.append(b, h);
  }

  const R = {};

  R.text = function (step, ctx) {
    const card = shell(step, ctx);
    return { el: card, question: false };
  };

  R.summary = function (step, ctx) {
    const card = shell(step, ctx);
    card.classList.add("lw-summary");
    if (step.points) card.append(el("ol", null, step.points.map((p) => el("li", { class: "lw-md", html: md(p) }))));
    return { el: card, question: false };
  };

  function choiceLike(step, ctx, multi) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    let opts = (step.options || []).map((o, idx) => (typeof o === "string" ? { md: o, idx } : Object.assign({ idx }, o)));
    if (step.shuffle !== false) {
      const fixed = opts.filter((o) => o.fixed);
      opts = shuffled(opts.filter((o) => !o.fixed), ctx.seed + step.id).concat(fixed);
    }
    const wrap = el("div", { class: "lw-options" + (step.columns === 2 ? " cols-2" : ""), role: multi ? "group" : "radiogroup" });
    const selected = new Set();
    const buttons = opts.map((o, i) => {
      const b = el("button", { class: "lw-option" + (multi ? " multi" : ""), type: "button", role: multi ? "checkbox" : "radio", "aria-checked": "false" });
      const mark = el("span", { class: "mark", text: multi ? "" : String.fromCharCode(65 + i) });
      const body = el("span", { class: "body" }, [mdEl(o.md)]);
      if (o.why) body.append(el("div", { class: "why lw-md", html: md(o.why) }));
      b.append(mark, body);
      b.addEventListener("click", () => {
        if (state.locked) return;
        if (multi) {
          if (selected.has(o.idx)) selected.delete(o.idx); else selected.add(o.idx);
        } else {
          selected.clear(); selected.add(o.idx);
        }
        buttons.forEach((bb, k) => {
          const on = selected.has(opts[k].idx);
          bb.classList.toggle("selected", on);
          bb.setAttribute("aria-checked", on ? "true" : "false");
          bb.classList.remove("wrong", "correct", "show-why");
        });
        fb.hide();
        ctx.changed();
      });
      wrap.append(b);
      return b;
    });
    card.append(wrap);
    hintButton(step, card);
    card.append(fb.el);
    const state = { locked: false };
    const isCorrect = (o) => !!o.correct;

    return {
      el: card,
      question: true,
      canCheck: () => selected.size > 0,
      check() {
        const right = opts.filter(isCorrect).map((o) => o.idx);
        const ok = right.length === selected.size && right.every((x) => selected.has(x));
        buttons.forEach((b, k) => {
          const o = opts[k];
          b.classList.remove("selected");
          if (selected.has(o.idx)) {
            b.classList.add(isCorrect(o) ? "correct" : "wrong");
            b.querySelector(".mark").innerHTML = isCorrect(o) ? ICON_CHECK : ICON_CROSS;
            if (o.why) b.classList.add("show-why");
          }
        });
        if (ok) fb.show(true, step.correctTitle || "Richtig", step.explain);
        else {
          const chosenWhy = opts.filter((o) => selected.has(o.idx) && !isCorrect(o) && o.why).length > 0;
          fb.show(false, "Nicht ganz", step.wrong || (chosenWhy ? "" : multi ? "Prüfe jede Aussage einzeln." : "Überlege noch einmal."));
        }
        return { correct: ok };
      },
      reveal() {
        buttons.forEach((b, k) => {
          const o = opts[k];
          b.classList.remove("selected");
          if (isCorrect(o)) {
            b.classList.add(selected.has(o.idx) ? "correct" : "missed");
            b.querySelector(".mark").innerHTML = ICON_CHECK;
          }
          if (o.why) b.classList.add("show-why");
        });
        fb.show(true, "Lösung", step.explain);
      },
      lock() { state.locked = true; buttons.forEach((b) => b.setAttribute("disabled", "")); },
    };
  }

  R.choice = (step, ctx) => choiceLike(step, ctx, false);
  R.multi = (step, ctx) => choiceLike(step, ctx, true);
  R.truefalse = function (step, ctx) {
    const s = Object.assign({}, step, {
      shuffle: false, columns: 2,
      options: [
        { md: step.trueLabel || "Wahr", correct: step.answer === true, why: step.answer === true ? null : step.whyNot },
        { md: step.falseLabel || "Falsch", correct: step.answer === false, why: step.answer === false ? null : step.whyNot },
      ],
    });
    return choiceLike(s, ctx, false);
  };

  R.numeric = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const input = el("input", { class: "lw-input", type: "text", inputmode: "decimal", autocomplete: "off", autocorrect: "off", spellcheck: "false", placeholder: step.placeholder || "Zahl eingeben" });
    const row = el("div", { class: "lw-input-row" }, [step.prefix ? el("span", { class: "lw-md", html: md(step.prefix) }) : null, input, step.unit ? el("span", { class: "lw-unit", html: md(step.unit) }) : null]);
    card.append(row);
    hintButton(step, card);
    card.append(fb.el);
    let locked = false;
    input.addEventListener("input", () => { input.classList.remove("wrong", "correct"); fb.hide(); ctx.changed(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { input.blur(); ctx.primaryFromPage(); } });
    const answers = [].concat(step.answer);
    return {
      el: card,
      question: true,
      canCheck: () => !locked && input.value.trim() !== "",
      check() {
        const v = parseNumber(input.value);
        if (isNaN(v)) { fb.show(false, "Keine Zahl erkannt", "Schreibe zum Beispiel `0,5`, `1/2` oder `sqrt(2)`."); input.classList.add("wrong"); return { correct: false, invalid: true }; }
        const ok = answers.some((a) => {
          const target = typeof a === "number" ? a : parseNumber(a);
          const tol = step.tolerance != null ? step.tolerance : 1e-6 * Math.max(1, Math.abs(target));
          return Math.abs(v - target) <= tol;
        });
        input.classList.add(ok ? "correct" : "wrong");
        if (ok) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Rechne noch einmal nach.");
        return { correct: ok };
      },
      reveal() {
        const a = answers[0];
        input.value = step.answerText || (typeof a === "number" ? String(a).replace(".", ",") : a);
        input.classList.remove("wrong"); input.classList.add("correct");
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; input.setAttribute("readonly", ""); },
    };
  }

  R.cloze = function (step, ctx) {
    const card = shell(Object.assign({}, step, { md: null }), ctx);
    const fb = feedbackBox();
    const blanks = step.blanks || [];
    const inputs = [];
    // "Text {{0}} mehr Text {{1}}": the markers become inputs, the rest is Markdown.
    const holder = el("div", { class: "lw-md" });
    const parts = String(step.md || "").split(/\{\{(\d+)\}\}/);
    let html = "";
    for (let i = 0; i < parts.length; i++) html += i % 2 === 0 ? parts[i] : "\u0001" + parts[i] + "\u0001";
    holder.innerHTML = md(html).replace(/\u0001(\d+)\u0001/g, (m, k) => '<span data-blank="' + k + '"></span>');
    holder.querySelectorAll("[data-blank]").forEach((span) => {
      const k = +span.getAttribute("data-blank");
      const b = blanks[k] || {};
      const inp = el("input", { class: "lw-input blank", type: "text", autocomplete: "off", autocorrect: "off", autocapitalize: "off", spellcheck: "false", placeholder: b.placeholder || "", inputmode: b.numeric ? "decimal" : "text", "aria-label": "Lücke " + (k + 1) });
      inp.addEventListener("input", () => { inp.classList.remove("wrong", "correct"); fb.hide(); ctx.changed(); });
      inputs[k] = inp;
      span.replaceWith(inp);
    });
    card.append(holder);
    hintButton(step, card);
    card.append(fb.el);
    let locked = false;
    const okFor = (k, value) => {
      const b = blanks[k] || {};
      if (b.numeric) {
        const v = parseNumber(value);
        return [].concat(b.accept).some((a) => Math.abs(v - (typeof a === "number" ? a : parseNumber(a))) <= (b.tolerance || 1e-6));
      }
      if (b.regex) return new RegExp(b.regex, "i").test(value.trim());
      return [].concat(b.accept || []).some((a) => normText(a) === normText(value));
    };
    return {
      el: card,
      question: true,
      canCheck: () => !locked && inputs.every((i) => i && i.value.trim() !== ""),
      check() {
        let all = true;
        inputs.forEach((inp, k) => { const ok = okFor(k, inp.value); all = all && ok; inp.classList.add(ok ? "correct" : "wrong"); });
        if (all) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Die rot markierten Lücken stimmen noch nicht.");
        return { correct: all };
      },
      reveal() {
        inputs.forEach((inp, k) => { const a = [].concat((blanks[k] || {}).accept)[0]; inp.value = a == null ? "" : String(a); inp.classList.remove("wrong"); inp.classList.add("correct"); });
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; inputs.forEach((i) => i.setAttribute("readonly", "")); },
    };
  };

  R.order = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const items = (step.items || []).map((t, idx) => ({ md: typeof t === "string" ? t : t.md, idx }));
    const pool = el("div", { class: "lw-order-pool" });
    const target = el("div", { class: "lw-order-target", "data-placeholder": step.placeholder || "Tippe die Schritte in der richtigen Reihenfolge an" });
    let seq = [];
    let locked = false;
    const chips = new Map();
    const render = () => {
      target.innerHTML = "";
      seq.forEach((idx, pos) => {
        const it = items[idx];
        const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "n", text: String(pos + 1) }), el("span", { class: "body lw-md", html: md(it.md) })]);
        c.addEventListener("click", () => { if (locked) return; seq.splice(pos, 1); render(); fb.hide(); ctx.changed(); });
        target.append(c);
      });
      chips.forEach((c, idx) => c.classList.toggle("used", seq.includes(idx)));
    };
    shuffled(items, ctx.seed + step.id).forEach((it) => {
      const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "body lw-md", html: md(it.md) })]);
      c.addEventListener("click", () => { if (locked || seq.includes(it.idx)) return; seq.push(it.idx); render(); fb.hide(); ctx.changed(); });
      chips.set(it.idx, c);
      pool.append(c);
    });
    card.append(target, el("div", { style: "height:10px" }), pool);
    hintButton(step, card);
    card.append(fb.el);
    render();
    return {
      el: card,
      question: true,
      canCheck: () => !locked && seq.length === items.length,
      check() {
        const ok = seq.every((idx, pos) => idx === pos);
        Array.from(target.children).forEach((c, pos) => c.classList.add(seq[pos] === pos ? "correct" : "wrong"));
        if (ok) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Die rot markierten Schritte stehen noch an der falschen Stelle. Tippe sie an, um sie zurückzulegen.");
        return { correct: ok };
      },
      reveal() {
        seq = items.map((it) => it.idx); render();
        Array.from(target.children).forEach((c) => c.classList.add("correct"));
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  R.match = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const pairs = step.pairs || [];
    const colors = ["#5e5ce6", "#ff9500", "#30b0c7", "#ff2d55", "#34c759", "#af52de", "#a2845e", "#007aff"];
    const leftCol = el("div", { class: "col" });
    const rightCol = el("div", { class: "col" });
    const link = new Map(); // left index -> right index
    let pickedLeft = null;
    let pickedRight = null;
    let locked = false;
    const leftChips = pairs.map((p, i) => {
      const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "tag" }), el("span", { class: "body lw-md", html: md(p[0]) })]);
      c.addEventListener("click", () => pick("L", i));
      leftCol.append(c);
      return c;
    });
    const rightOrder = shuffled(pairs.map((p, i) => i), ctx.seed + step.id);
    const rightChips = [];
    rightOrder.forEach((ri) => {
      const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "tag" }), el("span", { class: "body lw-md", html: md(pairs[ri][1]) })]);
      c.addEventListener("click", () => pick("R", ri));
      rightChips[ri] = c;
      rightCol.append(c);
    });
    function paint() {
      let n = 0;
      const colorOf = new Map();
      link.forEach((r, l) => colorOf.set(l, colors[n++ % colors.length]));
      leftChips.forEach((c, i) => {
        const tag = c.querySelector(".tag");
        const col = colorOf.get(i);
        c.classList.toggle("paired", col != null);
        c.classList.toggle("picked", pickedLeft === i);
        tag.style.background = col || "transparent";
        tag.style.border = col ? "0" : "1.5px solid var(--label-3)";
      });
      rightChips.forEach((c, ri) => {
        const tag = c.querySelector(".tag");
        let col = null;
        link.forEach((r, l) => { if (r === ri) col = colorOf.get(l); });
        c.classList.toggle("paired", col != null);
        c.classList.toggle("picked", pickedRight === ri);
        tag.style.background = col || "transparent";
        tag.style.border = col ? "0" : "1.5px solid var(--label-3)";
      });
    }
    function pick(side, i) {
      if (locked) return;
      fb.hide();
      leftChips.concat(rightChips).forEach((c) => c && c.classList.remove("correct", "wrong"));
      if (side === "L") {
        if (link.has(i)) { link.delete(i); pickedLeft = null; }
        else pickedLeft = pickedLeft === i ? null : i;
      } else {
        let owner = null;
        link.forEach((r, l) => { if (r === i) owner = l; });
        if (owner != null) { link.delete(owner); pickedRight = null; }
        else pickedRight = pickedRight === i ? null : i;
      }
      if (pickedLeft != null && pickedRight != null) { link.set(pickedLeft, pickedRight); pickedLeft = pickedRight = null; }
      paint();
      ctx.changed();
    }
    card.append(el("div", { class: "lw-match" }, [leftCol, rightCol]));
    hintButton(step, card);
    card.append(fb.el);
    paint();
    return {
      el: card,
      question: true,
      canCheck: () => !locked && link.size === pairs.length,
      check() {
        let ok = true;
        link.forEach((r, l) => {
          const good = r === l;
          ok = ok && good;
          leftChips[l].classList.add(good ? "correct" : "wrong");
          rightChips[r].classList.add(good ? "correct" : "wrong");
        });
        if (ok) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Die rot markierten Paare passen nicht. Tippe ein Paar an, um es zu lösen.");
        return { correct: ok };
      },
      reveal() {
        link.clear(); pairs.forEach((p, i) => link.set(i, i)); paint();
        leftChips.concat(rightChips).forEach((c) => c.classList.add("correct"));
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  R.sort = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const cats = step.categories || [];
    const items = shuffled((step.items || []).map((it, idx) => ({ md: it.md, cat: it.cat, idx })), ctx.seed + step.id);
    const chosen = new Map();
    let locked = false;
    const rows = items.map((it) => {
      const row = el("div", { class: "lw-sort-row" }, [mdEl(it.md)]);
      const btns = el("div", { class: "lw-sort-btns", role: "radiogroup" });
      const bs = cats.map((c, ci) => {
        const b = el("button", { class: "w-btn", type: "button", text: c, role: "radio", "aria-checked": "false" });
        b.addEventListener("click", () => {
          if (locked) return;
          chosen.set(it.idx, ci);
          bs.forEach((x, k) => { x.classList.toggle("on", k === ci); x.setAttribute("aria-checked", k === ci ? "true" : "false"); x.classList.remove("ok", "no"); });
          row.classList.remove("correct", "wrong");
          fb.hide();
          ctx.changed();
        });
        btns.append(b);
        return b;
      });
      row.append(btns);
      return { row, bs, it };
    });
    const wrap = el("div", { class: "lw-sort lw-widget" });
    rows.forEach((r) => wrap.append(r.row));
    card.append(wrap);
    hintButton(step, card);
    card.append(fb.el);
    const catIndex = (it) => (typeof it.cat === "number" ? it.cat : cats.indexOf(it.cat));
    return {
      el: card,
      question: true,
      canCheck: () => !locked && chosen.size === items.length,
      check() {
        let ok = true;
        rows.forEach((r) => {
          const good = chosen.get(r.it.idx) === catIndex(r.it);
          ok = ok && good;
          r.row.classList.toggle("correct", good);
          r.row.classList.toggle("wrong", !good);
        });
        if (ok) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Die rot markierten Zeilen sind falsch eingeordnet.");
        return { correct: ok };
      },
      reveal() {
        rows.forEach((r) => {
          const ci = catIndex(r.it);
          chosen.set(r.it.idx, ci);
          r.bs.forEach((x, k) => x.classList.toggle("on", k === ci));
          r.row.classList.remove("wrong"); r.row.classList.add("correct");
        });
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  // ------------------------------------------------------------------ spot the error
  //
  // { "type": "spot", "md": "…", "lines": ["…", {"md": "…", "why": "…"}], "answer": 2 | [1, 3], "explain": "…" }
  // The learner taps the faulty line (or lines). "why" explains a line: for the faulty one what goes wrong,
  // for a correct one why it holds; it appears when that line is picked or revealed.
  R.spot = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const lines = (step.lines || []).map((l, i) => (typeof l === "string" ? { md: l, i } : Object.assign({ i }, l)));
    const answers = new Set([].concat(step.answer).map(Number));
    const multi = answers.size > 1;
    const chosen = new Set();
    let locked = false;
    const list = el("div", { class: "lw-spot", role: multi ? "group" : "radiogroup" });
    const rows = lines.map((l) => {
      const body = el("span", { class: "body" }, [mdEl(l.md)]);
      if (l.why) body.append(el("div", { class: "why lw-md", html: md(l.why) }));
      const b = el("button", { class: "lw-spot-line", type: "button", role: multi ? "checkbox" : "radio", "aria-checked": "false" }, [el("span", { class: "n", text: String(l.i + 1) }), body]);
      b.addEventListener("click", () => {
        if (locked) return;
        if (multi) { if (chosen.has(l.i)) chosen.delete(l.i); else chosen.add(l.i); } else { chosen.clear(); chosen.add(l.i); }
        paint();
        fb.hide();
        ctx.changed();
      });
      list.append(b);
      return b;
    });
    function paint() {
      rows.forEach((b, k) => {
        const on = chosen.has(k);
        b.classList.toggle("selected", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.classList.remove("correct", "wrong", "show-why");
      });
    }
    card.append(list);
    hintButton(step, card);
    card.append(fb.el);
    return {
      el: card,
      question: true,
      canCheck: () => !locked && chosen.size > 0,
      check() {
        const ok = chosen.size === answers.size && [...chosen].every((k) => answers.has(k));
        rows.forEach((b, k) => {
          if (!chosen.has(k)) return;
          b.classList.remove("selected");
          b.classList.add(answers.has(k) ? "correct" : "wrong");
          if (lines[k].why) b.classList.add("show-why");
        });
        if (ok) fb.show(true, multi ? "Alle Fehler gefunden" : "Fehler gefunden", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || (multi ? "Mindestens eine Markierung stimmt nicht, oder es fehlt eine." : "Diese Zeile ist in Ordnung. Prüfe Schritt für Schritt: Folgt jede Zeile wirklich aus der vorigen?"));
        return { correct: ok };
      },
      reveal() {
        rows.forEach((b, k) => {
          b.classList.remove("selected", "wrong");
          if (answers.has(k)) { b.classList.add("correct"); if (lines[k].why) b.classList.add("show-why"); }
        });
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  // ------------------------------------------------------------------ build a proof from blocks
  //
  // { "type": "proof", "md": "…", "given": "…", "claim": "…", "steps": ["…", {"md": "…", "why": "…"}],
  //   "distractors": [{"md": "…", "why": "…"}], "explain": "…" }
  // The proof is assembled line by line from a shuffled pool that also holds plausible but wrong blocks.
  R.proof = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const good = (step.steps || []).map((s, i) => ({ md: typeof s === "string" ? s : s.md, why: s.why, key: "s" + i }));
    const bad = (step.distractors || []).map((s, i) => ({ md: typeof s === "string" ? s : s.md, why: s.why, key: "d" + i }));
    const all = good.concat(bad);
    const byKey = new Map(all.map((x) => [x.key, x]));
    if (step.given || step.claim) {
      const head = el("div", { class: "lw-proof-head" });
      if (step.given) head.append(mdEl("**Voraussetzung:** " + step.given));
      if (step.claim) head.append(mdEl("**Behauptung:** " + step.claim));
      card.append(head);
    }
    const target = el("ol", { class: "lw-proof" });
    const pool = el("div", { class: "lw-order-pool lw-proof-pool" });
    let seq = [];
    let locked = false, done = false;
    const chips = new Map();
    function render() {
      target.innerHTML = "";
      seq.forEach((key, pos) => {
        const li = el("li", { class: "lw-proof-line" }, [el("span", { class: "n", text: String(pos + 1) }), el("span", { class: "body lw-md", html: md(byKey.get(key).md) })]);
        li.addEventListener("click", () => { if (locked) return; seq.splice(pos, 1); render(); fb.hide(); ctx.changed(); });
        target.append(li);
      });
      for (let k = seq.length; k < good.length; k++) {
        target.append(el("li", { class: "lw-proof-line empty" }, [el("span", { class: "n", text: String(k + 1) }), el("span", { class: "body", text: k === seq.length ? "Nächster Schritt: unten einen Baustein antippen" : "" })]));
      }
      if (done) target.append(el("li", { class: "lw-proof-qed", text: "∎" }));
      chips.forEach((c, key) => c.classList.toggle("used", seq.includes(key)));
    }
    shuffled(all, ctx.seed + step.id).forEach((it) => {
      const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "body lw-md", html: md(it.md) })]);
      c.addEventListener("click", () => {
        if (locked || seq.includes(it.key) || seq.length >= good.length) return;
        seq.push(it.key);
        render();
        fb.hide();
        ctx.changed();
      });
      chips.set(it.key, c);
      pool.append(c);
    });
    card.append(target, el("div", { class: "lw-pool-label", text: bad.length ? "Bausteine, nicht alle gehören dazu" : "Bausteine" }), pool);
    hintButton(step, card);
    card.append(fb.el);
    render();
    return {
      el: card,
      question: true,
      canCheck: () => !locked && seq.length === good.length,
      check() {
        const ok = seq.every((key, pos) => key === "s" + pos);
        const lis = target.querySelectorAll(".lw-proof-line");
        let first = -1;
        seq.forEach((key, pos) => {
          const right = key === "s" + pos;
          lis[pos].classList.add(right ? "correct" : "wrong");
          if (!right && first < 0) first = pos;
        });
        if (ok) {
          done = true;
          render();
          target.querySelectorAll(".lw-proof-line").forEach((l) => l.classList.add("correct"));
          fb.show(true, "Beweis vollständig", step.explain);
        } else {
          const it = byKey.get(seq[first]);
          const why = it.why || (it.key[0] === "d" ? "Dieser Baustein gehört nicht in den Beweis." : "Der Baustein gehört in den Beweis, aber an eine andere Stelle.");
          fb.show(false, "Noch nicht schlüssig", "**Schritt " + (first + 1) + ":** " + why);
        }
        return { correct: ok };
      },
      reveal() {
        seq = good.map((g) => g.key);
        done = true;
        render();
        target.querySelectorAll(".lw-proof-line").forEach((l) => l.classList.add("correct"));
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  // ------------------------------------------------------------------ estimate on a slider
  //
  // { "type": "estimate", "md": "…", "min": 0, "max": 100, "answer": 37, "tolerance": 5 | "relTolerance": 0.1,
  //   "step": 1, "digits": 0, "unit": "%", "log": false, "start": 50, "explain": "…" }
  const nfCache = {};
  const fmtNum = (v, d) => (nfCache[d] || (nfCache[d] = new Intl.NumberFormat("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d }))).format(v).replace("-", "−");
  R.estimate = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const min = +step.min, max = +step.max;
    const log = !!step.log && min > 0;
    const toPos = (v) => (log ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (v - min) / (max - min));
    const fromPos = (t) => (log ? Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min))) : min + t * (max - min));
    const digits = step.digits != null ? step.digits : 0;
    const unit = step.unit ? (/^°/.test(step.unit) ? "" : "\u202f") + step.unit : "";
    const fmt = (v, d) => fmtNum(v, d != null ? d : digits) + unit;
    const ansDigits = Math.min(3, Math.max(digits, (String(step.answer).split(".")[1] || "").length));
    const snap = (v) => (step.step ? Math.round(v / step.step) * step.step : v);
    const startV = step.start != null ? step.start : log ? Math.sqrt(min * max) : (min + max) / 2;
    const value = el("div", { class: "lw-estimate-value", "aria-live": "polite" });
    const input = el("input", { type: "range", min: 0, max: 1000, step: 1, value: Math.round(toPos(startV) * 1000), "aria-label": "Schätzwert" });
    const truth = el("div", { class: "lw-estimate-truth" });
    const track = el("div", { class: "lw-estimate-track lw-slider" }, [input, truth]);
    const ends = el("div", { class: "lw-estimate-ends" }, [el("span", { text: fmt(min) }), el("span", { text: fmt(max) })]);
    card.append(el("div", { class: "lw-estimate" }, [value, track, ends]));
    hintButton(step, card);
    card.append(fb.el);
    let touched = false, locked = false;
    const current = () => snap(fromPos(+input.value / 1000));
    function paint() { value.textContent = fmt(current()); input.style.setProperty("--p", +input.value / 10 + "%"); }
    input.addEventListener("input", () => { touched = true; paint(); fb.hide(); truth.classList.remove("show"); ctx.changed(); });
    paint();
    const tol = () => (step.tolerance != null ? +step.tolerance : step.relTolerance != null ? Math.abs(step.answer) * step.relTolerance : (max - min) * 0.05);
    function showTruth() {
      truth.style.left = "calc(14px + (100% - 28px) * " + toPos(step.answer) + ")";
      truth.setAttribute("data-label", fmt(step.answer, ansDigits));
      truth.classList.add("show");
    }
    const body = () => "Richtiger Wert: **" + fmt(step.answer, ansDigits) + "**." + (step.explain ? "\n\n" + step.explain : "");
    return {
      el: card,
      question: true,
      canCheck: () => !locked && touched,
      check() {
        const diff = current() - step.answer;
        const ok = Math.abs(diff) <= tol() + 1e-9;
        if (ok) { showTruth(); fb.show(true, Math.abs(diff) <= tol() / 3 ? "Sehr gut geschätzt" : "Gut geschätzt", body()); }
        else fb.show(false, diff > 0 ? "Zu hoch" : "Zu niedrig", step.wrong || "Dein Wert liegt noch außerhalb des Spielraums.");
        return { correct: ok };
      },
      reveal() { input.value = Math.round(toPos(step.answer) * 1000); paint(); showTruth(); fb.show(true, "Lösung", body()); },
      lock() { locked = true; input.disabled = true; },
    };
  };

  // ------------------------------------------------------------------ place events on a timeline
  //
  // { "type": "timeline", "md": "…", "items": [{"md": "…", "year": 1776}], "start": 1700, "end": 2000,
  //   "tolerance": 10, "explain": "…" }
  // Tap an event, then the spot on the axis. Each event counts within ± tolerance years.
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  R.timeline = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const items = (step.items || []).map((it, i) => Object.assign({ i }, it));
    const from = +step.start, to = +step.end;
    const tol = step.tolerance != null ? +step.tolerance : Math.max(1, Math.round((to - from) / 25));
    const W = 360, H = 92, X0 = 16, X1 = W - 16, AY = 54;
    const xOf = (y) => X0 + ((y - from) / (to - from)) * (X1 - X0);
    const yearOf = (x) => Math.round(from + ((x - X0) / (X1 - X0)) * (to - from));
    const svg = sv("svg", { viewBox: "0 0 " + W + " " + H, class: "lw-tl-svg", role: "img", "aria-label": "Zeitstrahl von " + from + " bis " + to });
    const span = to - from;
    const major = span > 600 ? 100 : span > 250 ? 50 : span > 120 ? 20 : span > 50 ? 10 : 5;
    sv("line", { x1: X0, y1: AY, x2: X1, y2: AY, class: "lw-tl-axis" }, svg);
    for (let y = Math.ceil(from / major) * major; y <= to; y += major) {
      sv("line", { x1: xOf(y), y1: AY - 4, x2: xOf(y), y2: AY + 4, class: "lw-tl-tick" }, svg);
      const t = sv("text", { x: xOf(y), y: AY + 18, class: "lw-tl-year" }, svg);
      t.textContent = String(y);
    }
    const marks = sv("g", null, svg);
    const placed = new Map();
    let picked = items.length ? 0 : null;
    let locked = false, judged = false, solved = false;
    const chipsBox = el("div", { class: "lw-tl-chips" });
    const chips = items.map((it) => {
      const c = el("button", { class: "lw-chip", type: "button" }, [el("span", { class: "n", text: String(it.i + 1) }), el("span", { class: "body lw-md", html: md(it.md) }), el("span", { class: "lw-tl-when" })]);
      c.addEventListener("click", () => { if (locked) return; picked = picked === it.i ? null : it.i; judged = false; paint(); });
      chipsBox.append(c);
      return c;
    });
    svg.addEventListener("click", (e) => {
      if (locked || picked == null) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const m = svg.getScreenCTM();
      if (!m) return;
      const p = pt.matrixTransform(m.inverse());
      placed.set(picked, Math.max(from, Math.min(to, yearOf(p.x))));
      const next = items.find((it) => !placed.has(it.i));
      picked = next ? next.i : null;
      judged = false;
      fb.hide();
      ctx.changed();
      paint();
    });
    const good = (it) => placed.has(it.i) && Math.abs(placed.get(it.i) - it.year) <= tol;
    function paint() {
      while (marks.firstChild) marks.removeChild(marks.firstChild);
      // alternate above and below when markers come close, so numbers stay readable
      const order = items.filter((it) => placed.has(it.i)).sort((a, b) => placed.get(a.i) - placed.get(b.i));
      let lastX = -99, up = true;
      order.forEach((it) => {
        const x = xOf(placed.get(it.i));
        up = x - lastX < 22 ? !up : true;
        lastX = x;
        const y = up ? AY - 22 : AY + 32;
        const cls = "lw-tl-mark" + (judged || solved ? (good(it) ? " ok" : " no") : "") + (picked === it.i ? " picked" : "");
        const g = sv("g", { class: cls }, marks);
        sv("line", { x1: x, y1: AY, x2: x, y2: up ? y + 8 : y - 8, class: "lw-tl-stem" }, g);
        sv("circle", { cx: x, cy: y, r: 9 }, g);
        const t = sv("text", { x, y: y + 0.5 }, g);
        t.textContent = String(it.i + 1);
      });
      chips.forEach((c, k) => {
        const it = items[k];
        c.classList.toggle("picked", picked === k);
        c.classList.toggle("paired", placed.has(k));
        c.classList.remove("correct", "wrong");
        const when = c.querySelector(".lw-tl-when");
        when.textContent = placed.has(k) ? String(placed.get(k)) : "";
        if (judged || solved) {
          c.classList.add(good(it) ? "correct" : "wrong");
          if (!good(it) && placed.has(k)) when.textContent = placed.get(k) + (placed.get(k) > it.year ? ", früher" : ", später");
        }
      });
    }
    card.append(el("div", { class: "lw-tl" }, [svg]), el("div", { class: "lw-pool-label", text: "Ereignis antippen, dann die Stelle auf dem Zeitstrahl" }), chipsBox);
    hintButton(step, card);
    card.append(fb.el);
    paint();
    return {
      el: card,
      question: true,
      canCheck: () => !locked && placed.size === items.length,
      check() {
        judged = true;
        const ok = items.every(good);
        paint();
        if (ok) fb.show(true, "Richtig eingeordnet", step.explain);
        else fb.show(false, "Noch nicht", step.wrong || "Die rot markierten Ereignisse liegen mehr als " + tol + " Jahre daneben. Die Angabe neben dem Ereignis sagt, in welche Richtung.");
        return { correct: ok };
      },
      reveal() {
        items.forEach((it) => placed.set(it.i, it.year));
        solved = true;
        picked = null;
        paint();
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; picked = null; paint(); },
    };
  };

  // ------------------------------------------------------------------ four-field table
  //
  // { "type": "quadrant", "md": "…", "x": ["links", "rechts"], "y": ["oben", "unten"], "xLabel": "…", "yLabel": "…",
  //   "cells": ["Name oben links", "oben rechts", "unten links", "unten rechts"], "items": [{"md": "…", "cell": 0}], "explain": "…" }
  R.quadrant = function (step, ctx) {
    const card = shell(step, ctx);
    const fb = feedbackBox();
    const items = shuffled((step.items || []).map((it, i) => Object.assign({ i }, it)), ctx.seed + step.id);
    const where = new Map();
    let picked = null, locked = false, judged = false;
    const grid = el("div", { class: "lw-quad" });
    const xs = step.x || ["", ""], ys = step.y || ["", ""];
    grid.append(el("div", { class: "lw-quad-corner", text: step.yLabel && step.xLabel ? step.yLabel + " / " + step.xLabel : "" }));
    xs.forEach((t) => grid.append(el("div", { class: "lw-quad-xh lw-md", html: md(t) })));
    const cells = [];
    for (let r = 0; r < 2; r++) {
      grid.append(el("div", { class: "lw-quad-yh lw-md", html: md(ys[r]) }));
      for (let c = 0; c < 2; c++) {
        const k = r * 2 + c;
        const cell = el("button", { class: "lw-quad-cell", type: "button", "aria-label": "Feld " + (step.cells ? step.cells[k] : k + 1) });
        if (step.cells && step.cells[k]) cell.append(el("div", { class: "lw-quad-name", text: step.cells[k] }));
        const holder = el("div", { class: "lw-quad-items" });
        cell.append(holder);
        cell.addEventListener("click", () => {
          if (locked || picked == null) return;
          where.set(picked, k);
          picked = null;
          judged = false;
          fb.hide();
          ctx.changed();
          paint();
        });
        grid.append(cell);
        cells.push(holder);
      }
    }
    const pool = el("div", { class: "lw-quad-pool" });
    const chipOf = new Map();
    items.forEach((it) => {
      const c = el("button", { class: "lw-chip small", type: "button" }, [el("span", { class: "body lw-md", html: md(it.md) })]);
      c.addEventListener("click", (e) => {
        e.stopPropagation();
        if (locked) return;
        if (where.has(it.i)) { where.delete(it.i); picked = it.i; } else picked = picked === it.i ? null : it.i;
        judged = false;
        fb.hide();
        ctx.changed();
        paint();
      });
      chipOf.set(it.i, c);
    });
    function paint() {
      cells.forEach((h) => (h.innerHTML = ""));
      pool.innerHTML = "";
      items.forEach((it) => {
        const c = chipOf.get(it.i);
        c.classList.toggle("picked", picked === it.i);
        c.classList.remove("correct", "wrong");
        if (where.has(it.i)) {
          if (judged) c.classList.add(where.get(it.i) === it.cell ? "correct" : "wrong");
          cells[where.get(it.i)].append(c);
        } else pool.append(c);
      });
      pool.style.display = pool.children.length ? "" : "none";
    }
    card.append(grid, el("div", { class: "lw-pool-label", text: "Begriff antippen, dann das passende Feld" }), pool);
    hintButton(step, card);
    card.append(fb.el);
    paint();
    return {
      el: card,
      question: true,
      canCheck: () => !locked && where.size === items.length,
      check() {
        judged = true;
        const ok = items.every((it) => where.get(it.i) === it.cell);
        paint();
        if (ok) fb.show(true, "Richtig", step.explain);
        else fb.show(false, "Nicht ganz", step.wrong || "Die rot markierten Begriffe stehen im falschen Feld. Tippe sie an, um sie neu zu setzen.");
        return { correct: ok };
      },
      reveal() {
        items.forEach((it) => where.set(it.i, it.cell));
        picked = null;
        judged = true;
        paint();
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; },
    };
  };

  R.reveal = function (step, ctx) {
    const card = shell(step, ctx);
    const sol = el("div", { class: "lw-reveal" }, [mdEl(step.solution)]);
    const self = el("div", { class: "lw-self", style: "display:none" });
    const good = el("button", { class: "good", type: "button", text: step.goodLabel || "Hatte ich" });
    const bad = el("button", { class: "bad", type: "button", text: step.badLabel || "Noch unsicher" });
    self.append(bad, good);
    card.append(sol, self);
    let rating = null;
    let opened = false;
    const rate = (r) => { rating = r; good.classList.toggle("on", r === true); bad.classList.toggle("on", r === false); ctx.changed(); };
    good.addEventListener("click", () => rate(true));
    bad.addEventListener("click", () => rate(false));
    return {
      el: card,
      question: true,
      selfCheck: true,
      primaryLabel: () => (opened ? (rating == null ? "Einschätzen" : "Weiter") : "Aufdecken"),
      canCheck: () => !opened || rating != null,
      check() {
        if (!opened) {
          opened = true; sol.classList.add("open"); self.style.display = "flex";
          return { pending: true };
        }
        return { correct: rating === true, self: true };
      },
      reveal() { opened = true; sol.classList.add("open"); },
      lock() { good.setAttribute("disabled", ""); bad.setAttribute("disabled", ""); },
    };
  };

  R.widget = function (step, ctx) {
    const card = shell(step, ctx);
    const host = el("div", { class: "lw-widget" });
    card.append(host);
    const fb = feedbackBox();
    const def = LW.widgets[step.widget];
    if (!def) {
      host.append(el("div", { class: "lw-unsupported", text: "Diese Visualisierung braucht eine neuere Lernwerk-Version. Du kannst den Schritt überspringen." }));
      return { el: card, question: false };
    }
    let touched = false;
    let inst = null;
    const wctx = {
      theme: ctx.theme,
      seed: ctx.seed + step.id,
      md: md, math: math, el: el, expr: expr,
      changed() { touched = true; fb.hide(); ctx.changed(); },
      color(name) { return getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim(); },
    };
    try {
      inst = def.mount(host, step.params || {}, wctx) || {};
    } catch (e) {
      host.append(el("div", { class: "lw-unsupported", text: "Visualisierung konnte nicht starten: " + e.message }));
      return { el: card, question: false };
    }
    const isQuestion = !!(step.goal && typeof inst.check === "function");
    if (step.after) card.append(mdEl(step.after));
    if (isQuestion) { hintButton(step, card); card.append(fb.el); }
    let locked = false;
    return {
      el: card,
      question: isQuestion,
      canCheck: () => !locked && (touched || step.goal.allowUntouched === true),
      check() {
        const r = inst.check(step.goal) || { correct: false };
        if (r.correct) fb.show(true, "Richtig", r.detail || step.explain);
        else fb.show(false, "Noch nicht", r.detail || step.wrong || "Verändere die Darstellung und prüfe erneut.");
        return { correct: !!r.correct };
      },
      reveal() {
        if (typeof inst.solve === "function") inst.solve(step.goal);
        fb.show(true, "Lösung", step.explain);
      },
      lock() { locked = true; if (inst.lock) inst.lock(); },
      shown() { if (inst.shown) inst.shown(); },
    };
  };

  // ------------------------------------------------------------------ animated explanation
  //
  // { "type": "anim", "widget": "plot", "params": {…}, "timeline": [ { "caption": "…", "set": {a: 1}, "to": {a: 3},
  //   "dur": 1500, "do": {"drop": 20}, "hold": 2500, "int": ["n"] }, … ] }
  // Scenes run one after another: captions appear, variables jump (set) or glide (to), actions run (do).
  // Widgets take part through setVar(name, v), getVar(name) and act(name, arg); solve({solve}) is the fallback.
  // Afterwards the figure stays live, so the learner can take over.

  const ICON_PLAY = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M6 4.2v11.6c0 .6.7 1 1.2.6l9-5.8c.5-.3.5-1 0-1.3l-9-5.8C6.7 3.2 6 3.6 6 4.2z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="5" y="4" width="3.6" height="12" rx="1.2" fill="currentColor"/><rect x="11.4" y="4" width="3.6" height="12" rx="1.2" fill="currentColor"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 4a6 6 0 1 1-5.6 3.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.2 3.6v4.6h4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_PREV = '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  R.anim = function (step, ctx) {
    const card = shell(step, ctx);
    card.classList.add("lw-anim");
    const host = el("div", { class: "lw-widget" });
    const cap = el("div", { class: "lw-caption", "aria-live": "polite" });
    const bar = el("div", { class: "lw-anim-bar" });
    card.append(host, cap, bar);
    let inst = {};
    let cur = -1, playing = false, timer = 0, raf = 0, driving = false, ended = false;
    const def = step.widget ? LW.widgets[step.widget] : null;
    if (step.widget && !def) {
      host.append(el("div", { class: "lw-unsupported", text: "Diese Animation braucht eine neuere Lernwerk-Version." }));
    } else if (def) {
      try {
        inst = def.mount(host, step.params || {}, {
          theme: ctx.theme, seed: ctx.seed + step.id, md, math, el, expr, anim: true,
          changed() { if (!driving) pause(); },
          color(name) { return getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim(); },
        }) || {};
      } catch (e) {
        host.append(el("div", { class: "lw-unsupported", text: "Animation konnte nicht starten: " + e.message }));
      }
    }
    const scenes = step.timeline || [];
    const prevB = el("button", { class: "lw-anim-btn", type: "button", "aria-label": "Vorige Szene", html: ICON_PREV });
    const playB = el("button", { class: "lw-anim-btn play", type: "button", "aria-label": "Abspielen", html: ICON_PLAY });
    const nextB = el("button", { class: "lw-anim-btn", type: "button", "aria-label": "Nächste Szene", html: ICON_NEXT });
    const dots = scenes.map((s, k) => el("button", { class: "lw-anim-dot", type: "button", "aria-label": "Szene " + (k + 1), onclick: () => go(k, true, false) }));
    bar.append(prevB, playB, nextB, el("div", { class: "lw-anim-dots" }, dots));
    if (scenes.length < 2) { prevB.style.visibility = "hidden"; nextB.style.visibility = "hidden"; }

    const initial = {};
    const names = new Set();
    scenes.forEach((s) => { Object.keys(s.set || {}).forEach((n) => names.add(n)); Object.keys(s.to || {}).forEach((n) => names.add(n)); });
    names.forEach((n) => { if (inst.getVar) initial[n] = inst.getVar(n); });

    function setVar(name, v) {
      driving = true;
      try {
        if (inst.setVar) inst.setVar(name, v);
        else if (inst.solve) inst.solve({ solve: { [name]: v } });
      } finally { driving = false; }
    }
    function act(actions) {
      if (!actions || !inst.act) return;
      driving = true;
      try { Object.keys(actions).forEach((k) => inst.act(k, actions[k])); } finally { driving = false; }
    }
    function stop() { clearTimeout(timer); cancelAnimationFrame(raf); timer = 0; raf = 0; }
    function paintBar() {
      dots.forEach((d, k) => { d.classList.toggle("on", k === cur); d.classList.toggle("seen", k < cur); });
      playB.innerHTML = playing ? ICON_PAUSE : ended ? ICON_REPLAY : ICON_PLAY;
      playB.setAttribute("aria-label", playing ? "Pause" : ended ? "Nochmal abspielen" : "Abspielen");
      prevB.disabled = cur <= 0;
      nextB.disabled = cur >= scenes.length - 1;
    }
    function caption(s) {
      cap.innerHTML = "";
      if (s && s.caption) {
        const c = mdEl(s.caption);
        c.classList.add("lw-caption-in");
        cap.append(c);
      }
    }
    function finalState(s) {
      if (s.set) Object.keys(s.set).forEach((n) => setVar(n, s.set[n]));
      if (s.to) Object.keys(s.to).forEach((n) => setVar(n, s.to[n]));
    }
    /** Shows scene k; with animate the values glide, with autoNext the next scene follows after the hold. */
    function go(k, animate, autoNext) {
      stop();
      if (k < 0 || k >= scenes.length) return;
      if (k !== cur + 1) {
        // jump: rebuild from the start, then the earlier scenes without motion
        Object.keys(initial).forEach((n) => setVar(n, initial[n]));
        for (let i = 0; i < k; i++) finalState(scenes[i]);
      }
      cur = k;
      ended = false;
      const s = scenes[k];
      caption(s);
      if (s.set) Object.keys(s.set).forEach((n) => setVar(n, s.set[n]));
      act(s.do);
      const to = s.to || {};
      const keys = Object.keys(to);
      const ints = new Set(s.int || step.int || []);
      const from = {};
      keys.forEach((n) => { from[n] = inst.getVar ? inst.getVar(n) : to[n]; if (!isFinite(from[n])) from[n] = to[n]; });
      const dur = animate && !reduceMotion() ? (s.dur != null ? s.dur : 1400) : 0;
      const textLen = String(s.caption || "").replace(/\$[^$]*\$/g, "xxxx").length;
      const hold = s.hold != null ? s.hold : Math.max(1800, Math.min(7000, 1200 + textLen * 38));
      const done = () => {
        keys.forEach((n) => setVar(n, to[n]));
        if (autoNext && playing) {
          timer = setTimeout(() => {
            if (cur < scenes.length - 1) go(cur + 1, true, true);
            else { playing = false; ended = true; paintBar(); }
          }, hold);
        }
      };
      if (dur > 0 && keys.length) {
        const t0 = performance.now();
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / dur), e = ease(t);
          keys.forEach((n) => {
            let v = from[n] + (to[n] - from[n]) * e;
            if (ints.has(n)) v = Math.round(v);
            setVar(n, v);
          });
          if (t < 1) raf = requestAnimationFrame(frame); else { raf = 0; done(); }
        };
        raf = requestAnimationFrame(frame);
      } else done();
      paintBar();
    }
    function play() {
      if (!scenes.length) return;
      playing = true;
      if (ended || cur < 0 || cur >= scenes.length - 1) go(ended || cur >= scenes.length - 1 ? 0 : cur + 1, true, true);
      else go(cur + 1, true, true);
      paintBar();
    }
    function pause() { if (!playing) return; playing = false; stop(); paintBar(); }
    playB.addEventListener("click", () => { if (playing) pause(); else play(); });
    prevB.addEventListener("click", () => { playing = false; go(cur - 1, true, false); paintBar(); });
    nextB.addEventListener("click", () => { playing = false; go(cur + 1, true, false); paintBar(); });
    paintBar();
    let started = false;
    return {
      el: card,
      question: false,
      shown() {
        if (started) return;
        started = true;
        if (!scenes.length) return;
        if (reduceMotion() || step.autoplay === false) go(0, false, false);
        else setTimeout(() => { if (!playing && cur < 0) play(); }, 450);
      },
      reveal() { if (scenes.length) { playing = false; go(scenes.length - 1, false, false); ended = true; paintBar(); } },
      lock() {},
      leave() { playing = false; stop(); paintBar(); },
    };
  };

  // ------------------------------------------------------------------ lesson controller

  const S = {
    lesson: null, mode: "lesson", steps: [], cur: -1, inst: null, phase: "idle", root: null,
    attempts: 0, results: [], seed: "", base: "", startedAt: 0, run: 0, practice: null, variants: 0,
  };

  function primaryState() {
    const inst = S.inst;
    const last = S.cur >= S.steps.length - 1;
    if (!inst) return { label: "Weiter", enabled: false, style: "continue" };
    if (S.phase === "answering" && inst.question) {
      const label = inst.primaryLabel ? inst.primaryLabel() : S.attempts > 0 ? "Erneut prüfen" : "Prüfen";
      // After a wrong answer the learner has to change something before checking again.
      return { label, enabled: !!inst.canCheck() && !S.needsChange, style: "check", canGiveUp: S.attempts > 0 };
    }
    if (last) return { label: S.mode === "review" ? "Fertig" : S.mode === "practice" ? "Training abschließen" : "Lektion abschließen", enabled: true, style: "finish" };
    return { label: "Weiter", enabled: true, style: "continue" };
  }

  /** After a generated task: one more of the same kind, with new numbers, right after this one. */
  function variantButton(card, source) {
    if (!source || S.mode === "review") return;
    const b = el("button", { class: "lw-variant", type: "button", text: "Noch eine Aufgabe dieser Art" });
    b.addEventListener("click", () => {
      if (S.phase === "answering" || S.phase === "finished") return;
      b.remove();
      S.variants += 1;
      const next = Object.assign({}, source, { id: source.id + "~" + S.variants, review: false });
      S.steps.splice(S.cur + 1, 0, next);
      if (S.inst) S.inst.el.classList.add("done");
      showStep(S.cur + 1);
    });
    card.append(b);
  }

  function announce() {
    const p = primaryState();
    post(Object.assign({ type: "primary" }, p));
    post({ type: "progress", index: Math.max(0, S.cur), total: S.steps.length, answered: S.phase !== "answering" });
  }

  function stepContext() {
    return {
      mode: S.mode, seed: S.seed, theme: S.theme,
      changed: () => { S.needsChange = false; announce(); },
      primaryFromPage: () => LW.primary(),
      asset: (p) => (/^[a-z]+:/i.test(p) ? p : S.base + p),
    };
  }

  function showStep(i) {
    if (S.inst && S.inst.leave) S.inst.leave();
    S.cur = i;
    S.attempts = 0;
    S.needsChange = false;
    let step = S.steps[i];
    let inst;
    if (step.type === "gen") {
      try {
        const made = realize(step, S.seed + "|" + step.id + "|" + S.run);
        if (made) { step = made; S.steps[i] = made; }
      } catch (e) {
        post({ type: "error", message: "Schritt " + (i + 1) + " (" + step.gen + "): " + e.message });
      }
    }
    const render = R[step.type];
    try {
      inst = render ? render(step, stepContext()) : null;
    } catch (e) {
      inst = null;
      post({ type: "error", message: "Schritt " + (i + 1) + ": " + e.message });
    }
    if (!inst) {
      const card = shell(Object.assign({}, step, { md: null }), stepContext());
      card.append(el("div", { class: "lw-unsupported", text: "Dieser Schrittyp (" + step.type + ") braucht eine neuere Lernwerk-Version. Du kannst ihn überspringen." }));
      inst = { el: card, question: false };
    }
    S.inst = inst;
    S.phase = inst.question ? "answering" : "done";
    S.root.append(inst.el);
    if (inst.shown) inst.shown();
    if (i > 0) {
      requestAnimationFrame(() => inst.el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }));
    }
    announce();
  }

  function record(result) {
    const step = S.steps[S.cur];
    S.results.push({
      stepId: step.id, lessonId: step.lessonId || (S.lesson && S.lesson.id), type: step.type,
      correct: !!result.correct, firstTry: !!result.correct && S.attempts === 1 && !result.revealed,
      attempts: S.attempts, revealed: !!result.revealed, self: !!result.self,
    });
  }

  function finish() {
    if (S.inst && S.inst.leave) S.inst.leave();
    const q = S.results.filter((r) => r.type !== "text");
    const score = q.length ? q.filter((r) => r.firstTry || (r.self && r.correct)).length / q.length : 1;
    S.phase = "finished";
    S.root.append(el("div", { class: "lw-end", text: S.mode === "review" ? "Wiederholung abgeschlossen." : S.mode === "practice" ? "Training abgeschlossen." : "Lektion abgeschlossen." }));
    const msg = {
      type: "finished", lessonId: S.mode === "lesson" ? S.lesson && S.lesson.id : null, mode: S.mode, results: S.results, score,
      seconds: Math.round((Date.now() - S.startedAt) / 1000),
    };
    if (S.practice) msg.practice = { topicId: S.practice.topicId || null, courseId: S.practice.courseId || null, level: S.practice.level };
    post(msg);
  }

  /** Called by the native primary button (and Enter in numeric fields). */
  LW.primary = function () {
    const inst = S.inst;
    if (!inst || S.phase === "finished") return;
    if (S.phase === "answering" && inst.question) {
      if (!inst.canCheck()) return;
      S.attempts += 1;
      const r = inst.check();
      if (r && r.pending) { announce(); return; }
      if (r && r.invalid) { S.attempts -= 1; post({ type: "feedback", correct: false, invalid: true }); announce(); return; }
      post({ type: "feedback", correct: !!(r && r.correct), self: !!(r && r.self) });
      if (r && r.correct) {
        inst.el.classList.add("state-correct");
        if (inst.lock) inst.lock();
        record(r);
        S.phase = "done";
      } else if (r && r.self) {
        inst.el.classList.add("state-wrong");
        if (inst.lock) inst.lock();
        record(r);
        S.phase = "done";
      } else {
        inst.el.classList.add("state-wrong");
        S.needsChange = true;
        const maxAttempts = S.steps[S.cur].attempts || 2;
        if (S.attempts >= maxAttempts) {
          if (inst.reveal) inst.reveal();
          if (inst.lock) inst.lock();
          record({ correct: false, revealed: true });
          S.phase = "done";
          S.needsChange = false;
        }
      }
      if (S.phase === "done") variantButton(inst.el, S.steps[S.cur].genSource);
      announce();
      return;
    }
    // continue
    inst.el.classList.add("done");
    if (S.cur >= S.steps.length - 1) { finish(); return; }
    showStep(S.cur + 1);
  };

  /** Reveals the solution of the current question without counting it as solved. */
  LW.giveUp = function () {
    const inst = S.inst;
    if (!inst || S.phase !== "answering" || !inst.question) return;
    if (inst.reveal) inst.reveal();
    if (inst.lock) inst.lock();
    S.attempts = Math.max(1, S.attempts);
    record({ correct: false, revealed: true });
    S.phase = "done";
    S.needsChange = false;
    variantButton(inst.el, S.steps[S.cur].genSource);
    announce();
  };

  LW.setInsets = function (ins) {
    const r = document.documentElement.style;
    if (ins && ins.top != null) r.setProperty("--inset-top", ins.top + "px");
    if (ins && ins.bottom != null) r.setProperty("--inset-bottom", ins.bottom + "px");
  };

  LW.setTheme = function (theme) {
    S.theme = Object.assign({}, S.theme, theme);
    if (theme && theme.accent) document.documentElement.style.setProperty("--accent", theme.accent);
    if (theme && theme.fontScale) document.documentElement.style.setProperty("--fs", String(theme.fontScale));
  };

  function normalizeSteps(lesson, lessonUrl) {
    return (lesson.steps || []).map((s, i) => Object.assign({ id: "s" + (i + 1), lessonId: lesson.id, lessonTitle: lesson.title }, s));
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Lektion nicht gefunden: " + url);
    return res.json();
  }

  /**
   * options: { lesson | lessonUrl, mode: "lesson" | "review" | "practice", items: [{lessonUrl, stepId}],
   *            practice: {title, kicker, topicId, courseId, gens: [name | {gen, params}], level, count},
   *            theme: {accent, fontScale}, insets: {top, bottom}, resumeAt, seed }
   * seed varies the generated tasks; without it every start brings new numbers.
   */
  LW.start = async function (options) {
    const o = options || {};
    if (S.inst && S.inst.leave) S.inst.leave();
    S.mode = o.mode || "lesson";
    S.results = [];
    S.startedAt = Date.now();
    S.theme = {};
    S.run = o.seed != null ? o.seed : Date.now() % 1000003;
    S.practice = null;
    S.variants = 0;
    S.inst = null;
    LW.setTheme(o.theme || {});
    LW.setInsets(o.insets || {});
    document.body.innerHTML = "";
    S.root = el("main", { class: "lw-lesson" });
    document.body.append(S.root);
    try {
      if (S.mode === "practice") {
        const P = o.practice || {};
        const level = clampLevel(P.level);
        const gens = (P.gens || []).map((g) => (typeof g === "string" ? { gen: g } : g)).filter((g) => g && LW.generators[g.gen]);
        if (!gens.length) throw new Error("Für dieses Thema gibt es in dieser Version noch keine Aufgaben.");
        const count = Math.max(1, P.count || 6);
        // each generator about equally often, in a shuffled order
        const order = [];
        while (order.length < count) order.push(...shuffled(gens.map((g, k) => k), "order" + S.run + order.length));
        S.practice = { topicId: P.topicId, courseId: P.courseId, level };
        S.lesson = { id: "practice", title: P.title || "Training" };
        S.steps = order.slice(0, count).map((k, i) => ({ id: "p" + (i + 1), type: "gen", gen: gens[k].gen, params: gens[k].params, level, lessonId: null, review: false }));
        S.base = "";
        const head = el("header", { class: "lw-head practice lv" + level }, [
          el("div", { class: "lw-level-band", "aria-hidden": "true" }),
          el("div", { class: "lw-kicker", text: P.kicker || "Training" }),
          el("div", { class: "lw-title", text: P.title || "Training" }),
          el("div", { class: "lw-subtitle" }, [levelChip(level), el("span", { text: " " + count + " Aufgaben, jedes Mal neu gemischt" })]),
        ]);
        S.root.append(head);
      } else if (S.mode === "review") {
        const cache = new Map();
        const steps = [];
        for (const item of o.items || []) {
          if (!cache.has(item.lessonUrl)) cache.set(item.lessonUrl, await fetchJSON(item.lessonUrl));
          const lesson = cache.get(item.lessonUrl);
          const st = normalizeSteps(lesson).find((s) => s.id === item.stepId);
          if (st) steps.push(Object.assign({}, st, { from: lesson.title }));
        }
        S.lesson = { id: "review", title: "Wiederholung" };
        S.steps = steps;
        S.base = "";
        S.root.append(el("header", { class: "lw-head" }, [
          el("div", { class: "lw-kicker", text: "Wiederholung" }),
          el("div", { class: "lw-title", text: o.title || "Heute fällig" }),
          el("div", { class: "lw-subtitle", text: steps.length + (steps.length === 1 ? " Aufgabe" : " Aufgaben") }),
        ]));
      } else {
        const lesson = o.lesson || (await fetchJSON(o.lessonUrl));
        S.lesson = lesson;
        S.steps = normalizeSteps(lesson);
        S.base = o.lessonUrl ? o.lessonUrl.replace(/[^/]*$/, "") : "";
        S.root.append(el("header", { class: "lw-head" }, [
          el("div", { class: "lw-kicker", text: o.kicker || lesson.kicker || "" }),
          el("div", { class: "lw-title", text: lesson.title }),
          lesson.subtitle ? el("div", { class: "lw-subtitle", text: lesson.subtitle }) : null,
        ]));
      }
      S.seed = (S.lesson && S.lesson.id) || "lw";
      if (!S.steps.length) throw new Error("Keine Schritte gefunden.");
      const resume = Math.max(0, Math.min(o.resumeAt || 0, S.steps.length - 1));
      // Steps before the resume point are shown as already read, so the context is there.
      for (let i = 0; i < resume; i++) {
        showStep(i);
        if (S.inst.question && S.inst.reveal) { S.inst.reveal(); if (S.inst.lock) S.inst.lock(); }
        S.inst.el.classList.add("done");
      }
      showStep(resume);
      post({ type: "ready", steps: S.steps.length });
    } catch (e) {
      S.root.append(el("div", { class: "lw-step" }, [el("div", { class: "lw-error", text: String(e.message || e) })]));
      post({ type: "error", message: String(e.message || e) });
    }
  };

  LW.state = () => ({ cur: S.cur, phase: S.phase, total: S.steps.length, results: S.results.slice() });

  /** Collects question steps that are worth repeating later (used by the shell for spaced repetition). */
  const QUESTION_TYPES = ["choice", "multi", "truefalse", "numeric", "cloze", "order", "match", "sort", "reveal", "gen", "spot", "proof", "estimate", "timeline", "quadrant"];
  LW.questionTypes = QUESTION_TYPES;
  LW.reviewable = function (lesson) {
    return normalizeSteps(lesson).filter((s) => s.review !== false && QUESTION_TYPES.includes(s.type) || (s.type === "widget" && s.goal && s.review === true)).map((s) => s.id);
  };

  post({ type: "loaded", version: LW.version, api: LW.api });
})();
