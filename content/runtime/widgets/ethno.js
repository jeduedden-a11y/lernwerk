/* Ethnology widgets: Sahlins' reciprocity spectrum, the Kula ring (Malinowski). */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // Sahlins (1972), Stone Age Economics, ch. 5: the sectoral model of reciprocity.
  const SECTORS = [
    { id: "haus", name: "Haushalt", type: "generalisiert", text: "Gegeben wird, ohne mitzurechnen. Die Gegengabe ist weder nach Zeit noch nach Wert festgelegt und kann ganz ausbleiben, ohne dass die Beziehung leidet. Beispiel: Eltern versorgen ihre Kinder." },
    { id: "lineage", name: "Lineage", type: "generalisiert", text: "Unter nahen Verwandten überwiegt noch das Teilen. Man erwartet irgendwann Hilfe zurück, führt aber keine Buchführung." },
    { id: "dorf", name: "Dorf", type: "ausgeglichen", text: "Gabe und Gegengabe sollen sich in überschaubarer Zeit ungefähr entsprechen. Wer nicht zurückgibt, beschädigt die Beziehung." },
    { id: "stamm", name: "Stamm", type: "ausgeglichen", text: "Tausch nach Gleichwertigkeit, oft zwischen festen Partnern. Die Bilanz zählt, und gerade das schafft Vertrauen über Gruppengrenzen hinweg." },
    { id: "fremde", name: "Fremde", type: "negativ", text: "Man versucht, mehr zu bekommen als man gibt: Feilschen, List, im Extrem Raub. Gegenüber Fremden gelten die Pflichten der Nähe nicht." },
  ];
  const TYPES = [["generalisiert", "var(--green)"], ["ausgeglichen", "var(--accent)"], ["negativ", "var(--red)"]];

  LW.widget("reciprocity", {
    mount(host, p, ctx) {
      const W = 360, H = 226;
      const svg = K.root(host, W, H, "Sektoren der Reziprozität nach Sahlins");
      svg.style.maxWidth = "420px";
      svg.style.margin = "0 auto";
      const cx = W / 2, cy = H / 2;
      const rings = SECTORS.map((s, i) => K.svg("circle", { cx, cy, r: 20 + i * 21, fill: "none", stroke: "var(--separator)", "stroke-width": 19 }, svg));
      SECTORS.forEach((s, i) => {
        const t = K.text(svg, cx, cy - (20 + i * 21) + 1, i === 0 ? "" : s.name, "s-text");
        t.style.fontSize = "10px";
      });
      K.text(svg, cx, cy + 1, "Haus", "s-text-strong").style.fontSize = "10px";

      const panel = LW.el("div", { style: "margin-top:8px" });
      const title = LW.el("div", { style: "font-weight:700;font-size:1.1em" });
      const kind = LW.el("div", { style: "color:var(--label-2);margin:2px 0 8px" });
      const scale = LW.el("div", { style: "display:flex;gap:6px;margin-bottom:8px" });
      const segs = TYPES.map(([name, col]) => {
        const seg = LW.el("div", { style: "flex:1;text-align:center;font-size:0.8em;font-weight:600;padding:6px 4px;border-radius:10px;background:var(--fill);transition:all .2s", text: name });
        seg.dataset.col = col;
        scale.append(seg);
        return seg;
      });
      const desc = LW.el("div", { class: "lw-md", style: "min-height:4.5em" });
      panel.append(title, kind, scale, desc);
      let k = p.start || 0;
      const s = K.slider(host, { label: "Distanz", min: 0, max: SECTORS.length - 1, step: 1, value: k, format: (v) => SECTORS[v].name, onInput: (v) => { k = v; paint(); ctx.changed(); } });
      host.append(panel);
      function paint() {
        const sec = SECTORS[k];
        rings.forEach((r, i) => r.setAttribute("stroke", i === k ? "var(--accent)" : i < k ? "var(--accent-soft)" : "var(--separator)"));
        title.textContent = sec.name;
        kind.textContent = "Vorherrschend: " + sec.type + "e Reziprozität";
        segs.forEach((seg, i) => {
          const on = TYPES[i][0] === sec.type;
          seg.style.background = on ? seg.dataset.col : "var(--fill)";
          seg.style.color = on ? "white" : "var(--label-2)";
        });
        desc.innerHTML = LW.md(sec.text);
      }
      paint();
      return {
        check(goal) {
          const sec = SECTORS[k];
          return sec.type === goal.type ? { correct: true } : { correct: false, detail: "Im Sektor »" + sec.name + "« herrscht " + sec.type + "e Reziprozität vor. Gesucht ist " + goal.type + "e." };
        },
        solve(goal) { k = SECTORS.findIndex((x) => x.type === goal.type); s.set(k); paint(); },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = K.clamp(Math.round(v), 0, SECTORS.length - 1); s.set(k); paint(); } },
        lock() { s.disable(true); },
      };
    },
  });

  // Malinowski (1922), Argonauts of the Western Pacific: soulava (necklaces of red shell) travel clockwise,
  // mwali (armshells of white shell) anticlockwise. Island positions are schematic.
  const ISLANDS = ["Trobriand", "Kitava", "Murua", "Südl. Massim", "Dobu", "Amphlett"];

  LW.widget("kula", {
    mount(host, p, ctx) {
      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Der Kula-Ring");
      svg.style.maxWidth = "440px";
      svg.style.margin = "0 auto";
      const cx = W / 2, cy = 148, R = 104;
      // start at the north-west and go clockwise around the schematic ring
      const ang = (i) => (-Math.PI * 3) / 4 + (i * 2 * Math.PI) / ISLANDS.length;
      const pos = (i) => [cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))];
      K.svg("circle", { cx, cy, r: R, fill: "none", stroke: "var(--separator)", "stroke-width": 2, "stroke-dasharray": "3 6" }, svg);
      ISLANDS.forEach((name, i) => {
        const [x, y] = pos(i);
        K.svg("ellipse", { cx: x, cy: y, rx: 22, ry: 12, fill: "var(--fill-2)" }, svg);
        const t = K.text(svg, x, y + (y < cy ? -22 : 24), name, "s-text-strong");
        t.style.fontSize = "11px";
      });
      K.text(svg, cx, cy - 8, "Halsketten (soulava)", "s-text").style.fill = "var(--red)";
      K.text(svg, cx, cy + 6, "im Uhrzeigersinn", "s-text").style.fill = "var(--red)";
      K.text(svg, cx, cy + 26, "Armreifen (mwali)", "s-text");
      K.text(svg, cx, cy + 40, "gegen den Uhrzeigersinn", "s-text");

      const necklace = K.svg("g", null, svg);
      K.svg("circle", { r: 8, fill: "none", stroke: "var(--red)", "stroke-width": 4, "stroke-dasharray": "2 2" }, necklace);
      const armshell = K.svg("g", null, svg);
      K.svg("circle", { r: 8, fill: "none", stroke: "var(--label)", "stroke-width": 4 }, armshell);

      let iN = 0, iA = 0, visits = 0, anim = 0;
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      const go = K.button(row, "Nächster Kula-Besuch", () => step());
      go.classList.add("on");
      K.button(row, "Zurücksetzen", () => { cancelAnimationFrame(anim); iN = 0; iA = 0; visits = 0; place(pos(0), pos(0)); paint(); });
      const out = K.readout(host);

      function place(pn, pa) {
        necklace.setAttribute("transform", "translate(" + (pn[0] - 12) + "," + pn[1] + ")");
        armshell.setAttribute("transform", "translate(" + (pa[0] + 12) + "," + pa[1] + ")");
      }
      function paint() {
        out.set("Halskette bei <b>" + ISLANDS[iN] + "</b> &nbsp; Armreif bei <b>" + ISLANDS[iA] + "</b> &nbsp; Besuche: " + visits +
          (visits >= ISLANDS.length ? " &nbsp; " + K.pill(true, "beide einmal um den Ring") : ""));
      }
      function step() {
        cancelAnimationFrame(anim);
        const n0 = iN, a0 = iA;
        const n1 = (iN + 1) % ISLANDS.length, a1 = (iA - 1 + ISLANDS.length) % ISLANDS.length;
        const t0 = performance.now();
        const along = (i0, q, dir) => {
          const A = ang(i0) + dir * q * ((2 * Math.PI) / ISLANDS.length);
          return [cx + R * Math.cos(A), cy + R * Math.sin(A)];
        };
        const tick = (t) => {
          const q = Math.min(1, (t - t0) / 700);
          const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
          place(along(n0, e, 1), along(a0, e, -1));
          if (q < 1) anim = requestAnimationFrame(tick);
          else { iN = n1; iA = a1; visits++; paint(); ctx.changed(); }
        };
        anim = requestAnimationFrame(tick);
      }
      place(pos(0), pos(0));
      paint();
      return {
        act(name, arg) {
          if (name === "goto") { cancelAnimationFrame(anim); const n = Math.max(0, Math.round(arg || 0)); visits = n; iN = n % ISLANDS.length; iA = ((-n % ISLANDS.length) + ISLANDS.length) % ISLANDS.length; place(pos(iN), pos(iA)); paint(); }
          if (name === "visit") step();
          if (name === "reset") { cancelAnimationFrame(anim); iN = 0; iA = 0; visits = 0; place(pos(0), pos(0)); paint(); }
        },
        leave() { cancelAnimationFrame(anim); },
      };
    },
  });

  // ------------------------------------------------------------ kinship diagram with descent rules
  // Standard notation: triangle male, circle female, "=" marriage. Abbreviations F M B Z S D (English
  // convention used in German ethnology as well). Spouses of uncles and aunts are left out.
  const KIN = [
    { id: "FF", sex: "m", g: 2, x: 42 }, { id: "FM", sex: "f", g: 2, x: 104 },
    { id: "MF", sex: "m", g: 2, x: 256 }, { id: "MM", sex: "f", g: 2, x: 318 },
    { id: "FB", sex: "m", g: 1, x: 24 }, { id: "FZ", sex: "f", g: 1, x: 78 }, { id: "F", sex: "m", g: 1, x: 140, name: "Vater" },
    { id: "M", sex: "f", g: 1, x: 220, name: "Mutter" }, { id: "MB", sex: "m", g: 1, x: 282 }, { id: "MZ", sex: "f", g: 1, x: 336 },
    { id: "FBS", sex: "m", g: 0, x: 24 }, { id: "FZS", sex: "m", g: 0, x: 78 }, { id: "Ego", sex: "m", g: 0, x: 160, name: "Ego" },
    { id: "Z", sex: "f", g: 0, x: 204, name: "Schwester" }, { id: "MBD", sex: "f", g: 0, x: 282 }, { id: "MZD", sex: "f", g: 0, x: 336 },
  ];
  const SETS = {
    patri: ["Ego", "Z", "F", "FB", "FZ", "FF", "FBS"],
    matri: ["Ego", "Z", "M", "MB", "MZ", "MM", "MZD"],
    cross: ["FZS", "MBD"],
    parallel: ["FBS", "MZD"],
  };
  const SET_TEXT = {
    patri: "**Patrilinear**: Mitgliedschaft geht nur über Männer weiter. Die Schwester des Vaters gehört dazu, ihre Kinder nicht mehr: Sie gehören zur Lineage ihres Vaters.",
    matri: "**Matrilinear**: Mitgliedschaft geht nur über Frauen weiter. Der Bruder der Mutter gehört dazu, seine Kinder nicht. In vielen matrilinearen Gesellschaften ist er die wichtigste männliche Autorität für Ego.",
    cross: "**Kreuzcousins** sind Kinder von Geschwistern verschiedenen Geschlechts der Eltern: Kinder der Vaterschwester und des Mutterbruders. In unilinearen Systemen gehören sie nie zu Egos Lineage, deshalb sind sie oft bevorzugte Heiratspartner.",
    parallel: "**Parallelcousins** sind Kinder von Geschwistern gleichen Geschlechts der Eltern: Kinder des Vaterbruders und der Mutterschwester. Je nach Abstammungsregel gehören sie zu Egos eigener Lineage. In manchen Terminologien, etwa der irokesischen, heißen sie wie Geschwister.",
  };

  LW.widget("kinship", {
    mount(host, p, ctx) {
      const W = 360, H = 250;
      const svg = K.root(host, W, H, "Verwandtschaftsdiagramm");
      svg.style.maxWidth = "520px";
      svg.style.margin = "0 auto";
      const Y = { 2: 34, 1: 116, 0: 198 };
      const by = Object.fromEntries(KIN.map((k) => [k.id, k]));
      const lines = K.svg("g", null, svg);
      const ln = (x1, y1, x2, y2) => K.svg("line", { x1, y1, x2, y2, class: "s-axis", "stroke-width": 1.6 }, lines);
      const marry = (a, b) => { const A = by[a], B = by[b]; ln(A.x + 12, Y[A.g] + 2, B.x - 12, Y[B.g] + 2); ln(A.x + 12, Y[A.g] - 2, B.x - 12, Y[B.g] - 2); return (A.x + B.x) / 2; };
      const children = (parentMid, gParent, kids) => {
        const yb = Y[gParent] + 40;
        ln(parentMid, Y[gParent] + 2, parentMid, yb);
        const xs = kids.map((k) => by[k].x);
        ln(Math.min(parentMid, ...xs), yb, Math.max(parentMid, ...xs), yb);
        kids.forEach((k) => ln(by[k].x, yb, by[k].x, Y[by[k].g] - 14));
      };
      children(marry("FF", "FM"), 2, ["FB", "FZ", "F"]);
      children(marry("MF", "MM"), 2, ["M", "MB", "MZ"]);
      children(marry("F", "M"), 1, ["Ego", "Z"]);
      children(by.FB.x, 1, ["FBS"]);
      children(by.FZ.x, 1, ["FZS"]);
      children(by.MB.x, 1, ["MBD"]);
      children(by.MZ.x, 1, ["MZD"]);

      const sel = new Set();
      let mode = p.task ? null : p.start || "patri";
      const els = {};
      KIN.forEach((k) => {
        const g = K.svg("g", { transform: "translate(" + k.x + "," + Y[k.g] + ")", style: "cursor:pointer" }, svg);
        const shape = k.sex === "m"
          ? K.svg("path", { d: "M0,-13 L13,10 L-13,10 Z", "stroke-width": 2 }, g)
          : K.svg("circle", { r: 12, "stroke-width": 2 }, g);
        const lab = K.text(g, 0, 26, k.name || k.id, "s-text");
        lab.style.fontSize = k.name ? "10px" : "11px";
        K.svg("circle", { r: 20, class: "s-hit" }, g);
        g.addEventListener("click", () => {
          if (!p.task || locked) return;
          if (sel.has(k.id)) sel.delete(k.id); else sel.add(k.id);
          paint(); ctx.changed();
        });
        els[k.id] = { shape, lab };
      });
      let locked = false;
      const desc = LW.el("div", { class: "lw-md", style: "margin-top:8px;min-height:3em" });
      if (!p.task) {
        K.segmented(host, [{ id: "patri", label: "Patrilinear" }, { id: "matri", label: "Matrilinear" }, { id: "cross", label: "Kreuzcousins" }, { id: "parallel", label: "Parallelcousins" }], mode, (id) => { mode = id; paint(); ctx.changed(); });
      }
      host.append(desc);
      host.append(LW.el("div", { class: "w-readout", html: "F Vater, M Mutter, B Bruder, Z Schwester, S Sohn, D Tochter. FZS heißt also Sohn der Schwester des Vaters." }));
      function paint() {
        const on = p.task ? sel : new Set(SETS[mode]);
        KIN.forEach((k) => {
          const e = els[k.id];
          const active = on.has(k.id);
          e.shape.setAttribute("fill", active ? "var(--accent)" : "var(--card-solid)");
          e.shape.setAttribute("stroke", k.id === "Ego" ? "var(--label)" : active ? "var(--accent)" : "var(--label-3)");
        });
        desc.innerHTML = p.task ? LW.md(p.taskText || "Tippe alle Personen an, die dazugehören.") : LW.md(SET_TEXT[mode]);
      }
      paint();
      return {
        check(goal) {
          const want = new Set(SETS[goal.set || p.task]);
          const missing = [...want].filter((x) => !sel.has(x));
          const extra = [...sel].filter((x) => !want.has(x));
          KIN.forEach((k) => {
            const e = els[k.id];
            if (sel.has(k.id)) e.shape.setAttribute("stroke", want.has(k.id) ? "var(--green)" : "var(--red)");
          });
          if (!missing.length && !extra.length) return { correct: true };
          return { correct: false, detail: (extra.length ? "Gehört nicht dazu: " + extra.join(", ") + ". " : "") + (missing.length ? "Es fehlen noch " + missing.length + "." : "") };
        },
        solve(goal) { sel.clear(); SETS[goal.set || p.task].forEach((x) => sel.add(x)); paint(); },
        act(name, arg) {
          if (name === "mode" && !p.task) { mode = arg; paint(); }
          if (name === "select" && SETS[arg]) { sel.clear(); SETS[arg].forEach((x) => sel.add(x)); paint(); }
          if (name === "clear") { sel.clear(); paint(); }
        },
        lock() { locked = true; },
      };
    },
  });

  function goalCheck(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) { try { if (LW.expr(h.when)(scope)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } }
    return { correct: false, detail: goal.message || null };
  }

  // ------------------------------------------------------------ spectrum: positions on a scale with an explanation each

  /* params: items [{name, text, tag}], start, title, left, right (labels of the ends), slider (default true)
   * scope:  k (index of the selected position) */
  LW.widget("spectrum", {
    mount(host, p, ctx) {
      const items = p.items || [{ name: "A", text: "" }, { name: "B", text: "" }];
      let k = K.clamp(p.start || 0, 0, items.length - 1), locked = false;
      const W = 360, H = 112;
      const svg = K.root(host, W, H, p.title || "Spektrum");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const x = (i) => 34 + (i * (W - 68)) / Math.max(1, items.length - 1);
      const panel = LW.el("div", { style: "margin-top:6px" });
      const title = LW.el("div", { style: "font-weight:700;font-size:1.06em" });
      const desc = LW.el("div", { class: "lw-md", style: "min-height:4.5em" });
      panel.append(title, desc);
      let s = null;
      if (p.slider === true) s = K.slider(host, { label: p.sliderLabel || "Position", min: 0, max: items.length - 1, step: 1, value: k, format: (v) => items[v].name, onInput: (v) => { if (locked) return; k = v; paint(); ctx.changed(); } });
      host.append(panel);
      /** Splits a long label at the space closest to its middle. */
      const lines = (name) => { if (name.length <= 13 || name.indexOf(" ") < 0) return [name]; let best = -1; for (let i = 0; i < name.length; i++) if (name[i] === " " && (best < 0 || Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2))) best = i; return [name.slice(0, best), name.slice(best + 1)]; };
      function paint() {
        K.clear(g);
        K.svg("line", { x1: x(0), y1: 40, x2: x(items.length - 1), y2: 40, stroke: "var(--label-3)", "stroke-width": 3, "stroke-linecap": "round" }, g);
        if (p.left) K.text(g, 8, 14, p.left, "s-text", "start");
        if (p.right) K.text(g, W - 8, 14, p.right, "s-text", "end");
        items.forEach((it, i) => {
          const on = i === k;
          const c = K.svg("circle", { cx: x(i), cy: 40, r: on ? 11 : 7, fill: on ? "var(--accent)" : "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2.5, style: locked ? "" : "cursor:pointer" }, g);
          const hit = K.svg("circle", { cx: x(i), cy: 52, r: 24, class: "s-hit" }, g);
          const pick = () => { if (locked || p.select === false) return; k = i; if (s) s.set(k); paint(); ctx.changed(); };
          c.addEventListener("click", pick); hit.addEventListener("click", pick);
          const anchor = i === 0 && items.length > 3 ? "start" : i === items.length - 1 && items.length > 3 ? "end" : "middle";
          const lx = anchor === "start" ? x(i) - 22 : anchor === "end" ? x(i) + 22 : x(i);
          lines(it.name).forEach((ln, j) => { const t = K.text(g, lx, 66 + j * 12 + (items.length > 4 && i % 2 ? 22 : 0), ln, on ? "s-text-strong" : "s-text", anchor); t.style.fontSize = "10px"; });
        });
        title.textContent = items[k].name + (items[k].tag ? " · " + items[k].tag : "");
        desc.innerHTML = LW.md(items[k].text || "");
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, { k }),
        solve(goal) { const sv = goal && goal.solve; if (sv && sv.k != null) { k = sv.k; if (s) s.set(k); paint(); } },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = K.clamp(Math.round(v), 0, items.length - 1); if (s) s.set(k); paint(); } },
        lock() { locked = true; if (s) s.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------ timeline of works and ideas

  /* params: events [{year, name, text}], k (highlighted event), range [from, to]
   * scope:  k */
  LW.widget("timeline", {
    mount(host, p, ctx) {
      const ev = (p.events || []).slice().sort((a, b) => a.year - b.year);
      let k = K.clamp(p.k != null ? p.k : 0, 0, Math.max(0, ev.length - 1));
      const y0 = p.range ? p.range[0] : Math.floor(ev[0].year / 10) * 10 - 10, y1 = p.range ? p.range[1] : Math.ceil(ev[ev.length - 1].year / 10) * 10 + 10;
      const W = 360, H = 120;
      const svg = K.root(host, W, H, "Zeitleiste");
      svg.style.maxWidth = "560px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const x = K.scale(y0, y1, 16, W - 16);
      const card = LW.el("div", { class: "lw-md", style: "margin-top:6px;min-height:5.5em" });
      host.append(card);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Zurück", () => { if (k > 0) { k--; paint(); ctx.changed(); } });
      K.button(row, "Weiter", () => { if (k < ev.length - 1) { k++; paint(); ctx.changed(); } }).classList.add("on");
      function paint() {
        K.clear(g);
        K.svg("line", { x1: 16, y1: 60, x2: W - 16, y2: 60, class: "s-axis", "stroke-width": 2 }, g);
        for (let yr = Math.ceil(y0 / 50) * 50; yr <= y1; yr += 50) { K.svg("line", { x1: x(yr), y1: 55, x2: x(yr), y2: 65, class: "s-axis" }, g); K.text(g, x(yr), 80, String(yr), "s-text"); }
        ev.forEach((e, i) => {
          const on = i === k, seen = i < k;
          K.svg("circle", { cx: x(e.year), cy: 60, r: on ? 9 : 6, fill: on ? "var(--accent)" : seen ? "var(--accent-soft)" : "var(--card-solid)", stroke: "var(--accent)", "stroke-width": 2 }, g);
          if (on) {
            const t = K.text(g, K.clamp(x(e.year), 60, W - 60), 30, e.year + " · " + e.name, "s-text-strong");
            t.style.fontSize = "11.5px";
            K.svg("line", { x1: x(e.year), y1: 38, x2: x(e.year), y2: 51, stroke: "var(--accent)", "stroke-width": 1.5 }, g);
          }
        });
        const e = ev[k];
        card.innerHTML = e ? "<p><b>" + LW.esc(e.year + ": " + e.name) + "</b></p>" + LW.md(e.text || "") : "";
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, { k }),
        solve(goal) { const sv = goal && goal.solve; if (sv && sv.k != null) { k = sv.k; paint(); } },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = K.clamp(Math.round(v), 0, ev.length - 1); paint(); } },
      };
    },
  });

  // ------------------------------------------------------------ rites of passage (van Gennep 1909, Turner 1969)

  /* params: phases [3 names], labels {before, after}, t (0..3 progress), example
   * scope:  t, phase (0 before, 1 separation, 2 liminal, 3 incorporation) */
  LW.widget("rite", {
    mount(host, p, ctx) {
      const ph = p.phases || ["Trennung", "Schwelle", "Angliederung"];
      const before = (p.labels && p.labels.before) || "alter Status", after = (p.labels && p.labels.after) || "neuer Status";
      let t = p.t != null ? p.t : 0;
      const W = 360, H = 150;
      const svg = K.root(host, W, H, "Übergangsritus");
      svg.style.maxWidth = "560px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const X = [20, 95, 165, 245, 340];
      const out = K.readout(host);
      const phaseOf = (tt) => (tt < 0.5 ? 0 : tt < 1.5 ? 1 : tt < 2.5 ? 2 : 3);
      function paint() {
        K.clear(g);
        K.svg("rect", { x: X[0], y: 40, width: X[1] - X[0], height: 46, rx: 10, fill: "var(--fill-2)" }, g);
        K.svg("rect", { x: X[3], y: 40, width: X[4] - X[3], height: 46, rx: 10, fill: "var(--accent-soft)" }, g);
        K.svg("rect", { x: X[1] + 4, y: 32, width: X[3] - X[1] - 8, height: 62, rx: 12, fill: "color-mix(in srgb, var(--orange) 16%, transparent)", stroke: "var(--orange)", "stroke-dasharray": "5 4" }, g);
        K.text(g, (X[0] + X[1]) / 2, 63, before, "s-text-strong").style.fontSize = "10.5px";
        K.text(g, (X[3] + X[4]) / 2, 63, after, "s-text-strong").style.fontSize = "10.5px";
        [[X[1], ph[0]], [(X[1] + X[3]) / 2, ph[1]], [X[3], ph[2]]].forEach(([xx, name], i) => {
          const on = phaseOf(t) === i + 1;
          const tx = K.text(g, xx, 116, name, on ? "s-text-strong" : "s-text");
          if (on) tx.style.fill = i === 1 ? "var(--orange)" : "var(--accent)";
          K.svg("line", { x1: xx, y1: 98, x2: xx, y2: 106, class: "s-axis" }, g);
        });
        K.text(g, (X[1] + X[3]) / 2, 22, "liminal: weder noch", "s-text").style.fill = "var(--orange)";
        // the person moving through
        const px = t <= 1 ? X[0] + 30 + (X[1] - X[0] - 30 + 8) * t : t <= 2 ? X[1] + 8 + (X[2] - X[1] - 8 + 40) * (t - 1) : X[2] + 40 + (X[4] - 30 - X[2] - 40) * (t - 2);
        const py = 63 + (phaseOf(t) === 2 ? Math.sin(t * Math.PI * 3) * 4 : 0);
        K.svg("circle", { cx: px, cy: py - 6, r: 6, fill: "var(--label)" }, g);
        K.svg("path", { d: "M" + (px - 8) + "," + (py + 14) + " Q" + px + "," + (py - 6) + " " + (px + 8) + "," + (py + 14) + " Z", fill: "var(--label)" }, g);
        const P = phaseOf(t);
        out.set(P === 0 ? "Vor dem Ritus: Die Person hat ihren alten Status (" + before + ")." : P === 1 ? "<b>" + ph[0] + ":</b> Die Person wird aus der alten Ordnung herausgelöst, oft räumlich, durch Kleidung oder Haarschnitt." : P === 2 ? "<b>" + ph[1] + ":</b> Weder das eine noch das andere. Gewöhnliche Regeln gelten nicht, Rangunterschiede verschwimmen." : "<b>" + ph[2] + ":</b> Rückkehr in die Gemeinschaft mit neuem Status (" + after + "), mit neuen Rechten und Pflichten.");
        return { t, phase: P };
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, paint()),
        getVar: (name) => (name === "t" ? t : NaN),
        setVar(name, v) { if (name === "t") { t = K.clamp(v, 0, 3); paint(); } },
      };
    },
  });

  // ------------------------------------------------------------ marriage alliance (Lévi-Strauss 1949)

  /* params: groups (3 to 6), mode "restricted" | "generalized", k (marriages shown)
   * scope:  k, mode (0 restricted, 1 generalized) */
  LW.widget("alliance", {
    mount(host, p, ctx) {
      const n = K.clamp(p.groups || 4, 2, 6);
      let mode = p.mode || "restricted", k = p.k != null ? p.k : n;
      const W = 360, H = 260;
      const svg = K.root(host, W, H, "Heiratsallianzen");
      svg.style.maxWidth = "460px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const cx = W / 2, cy = 128, R = 88;
      const pos = (i) => [cx + R * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n), cy + R * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n)];
      const out = K.readout(host);
      const NAMES = "ABCDEF";
      function arcs() {
        if (mode === "generalized") return Array.from({ length: n }, (_, i) => [i, (i + 1) % n]);
        const res = [];
        for (let i = 0; i + 1 < n; i += 2) { res.push([i, i + 1]); res.push([i + 1, i]); }
        return res;
      }
      function paint() {
        K.clear(g);
        const list = arcs();
        list.forEach(([a, b], idx) => {
          if (idx >= k) return;
          const [x1, y1] = pos(a), [x2, y2] = pos(b);
          const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
          const bend = mode === "restricted" ? 18 : 10;
          const sx = x1 + ux * 26 + nx * 6, sy = y1 + uy * 26 + ny * 6, ex = x2 - ux * 30 + nx * 6, ey = y2 - uy * 30 + ny * 6;
          const qx = (sx + ex) / 2 + nx * bend, qy = (sy + ey) / 2 + ny * bend;
          K.svg("path", { d: "M" + sx + "," + sy + " Q" + qx + "," + qy + " " + ex + "," + ey, fill: "none", stroke: "var(--accent)", "stroke-width": 2.4 }, g);
          const hx = ex - qx, hy = ey - qy, hl = Math.hypot(hx, hy) || 1;
          K.svg("path", { d: "M" + ex + "," + ey + " l" + (-hx / hl * 9 - hy / hl * 5) + "," + (-hy / hl * 9 + hx / hl * 5) + " l" + (hy / hl * 10) + "," + (-hx / hl * 10) + " Z", fill: "var(--accent)" }, g);
        });
        for (let i = 0; i < n; i++) {
          const [x, y] = pos(i);
          K.svg("circle", { cx: x, cy: y, r: 24, fill: "var(--card-solid)", stroke: "var(--label-2)", "stroke-width": 2 }, g);
          K.text(g, x, y, "Gruppe " + NAMES[i], "s-text-strong").style.fontSize = "10px";
        }
        K.text(g, cx, H - 8, "Pfeil: Eine Gruppe gibt Frauen als Ehefrauen an die andere.", "s-text").style.fontSize = "10px";
        out.set(mode === "restricted" ? "<b>Eingeschränkter Tausch:</b> Je zwei Gruppen tauschen direkt untereinander. Was A an B gibt, gibt B an A zurück. Das entspricht der Heirat mit der bilateralen Kreuzcousine." : "<b>Verallgemeinerter Tausch:</b> A gibt an B, B an C, … und die letzte Gruppe an A. Niemand bekommt direkt von dem zurück, dem er gibt, aber der Kreis schließt sich. Das entspricht der Heirat mit der Tochter des Mutterbruders (matrilaterale Kreuzcousine).");
        return { k, mode: mode === "generalized" ? 1 : 0 };
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, paint()),
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = Math.max(0, Math.round(v)); paint(); } },
        act(name, arg) { if (name === "mode") { mode = arg; paint(); } },
      };
    },
  });

  // ------------------------------------------------------------ segmentary lineage system (Evans-Pritchard, The Nuer, 1940)

  /* params: tree (nested arrays of names), conflict [nameA, nameB]
   * scope:  level (how many levels up the common ancestor lies) */
  LW.widget("segmentary", {
    mount(host, p, ctx) {
      const tree = p.tree || { name: "Stamm", kids: [{ name: "A", kids: [{ name: "A1", kids: [{ name: "a" }, { name: "b" }] }, { name: "A2", kids: [{ name: "c" }, { name: "d" }] }] }, { name: "B", kids: [{ name: "B1", kids: [{ name: "e" }, { name: "f" }] }, { name: "B2", kids: [{ name: "g" }, { name: "h" }] }] }] };
      let conflict = (p.conflict || []).slice();
      const W = 360, H = 230;
      const svg = K.root(host, W, H, "Segmentäres Lineage-System");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const nodes = [];
      let leaf = 0;
      const depth = (t) => (t.kids ? 1 + Math.max(...t.kids.map(depth)) : 0);
      const D = depth(tree);
      (function layout(t, d, parent) {
        const node = { name: t.name, d, parent, kids: [] };
        nodes.push(node);
        if (t.kids) { t.kids.forEach((c) => node.kids.push(layout(c, d + 1, node))); node.x = node.kids.reduce((s, c) => s + c.x, 0) / node.kids.length; }
        else node.x = 30 + leaf++ * 0;
        return node;
      })(tree, 0, null);
      const leaves = nodes.filter((nd) => !nd.kids.length);
      leaves.forEach((nd, i) => (nd.x = 26 + (i * (W - 52)) / Math.max(1, leaves.length - 1)));
      (function fix(nd) { if (nd.kids.length) { nd.kids.forEach(fix); nd.x = nd.kids.reduce((s, c) => s + c.x, 0) / nd.kids.length; } })(nodes[0]);
      const y = (d) => 26 + (d * (H - 60)) / Math.max(1, D);
      const find = (name) => nodes.find((nd) => nd.name === name);
      const ancestors = (nd) => { const a = []; for (let c = nd; c; c = c.parent) a.push(c); return a; };
      function common() {
        const A = find(conflict[0]), B = find(conflict[1]);
        if (!A || !B) return null;
        const anc = ancestors(A);
        for (let c = B; c; c = c.parent) if (anc.includes(c)) return { c, A, B };
        return null;
      }
      function paint() {
        K.clear(g);
        const cm = common();
        const sideOf = (nd) => { if (!cm) return 0; const an = ancestors(nd); const ca = cm.c.kids.find((kid) => an.includes(kid)); if (!ca) return 0; const aa = ancestors(cm.A), bb = ancestors(cm.B); return aa.includes(ca) ? 1 : bb.includes(ca) ? 2 : 0; };
        nodes.forEach((nd) => { if (nd.parent) K.svg("line", { x1: nd.parent.x, y1: y(nd.parent.d) + 12, x2: nd.x, y2: y(nd.d) - 12, class: "s-axis", "stroke-width": 1.5 }, g); });
        nodes.forEach((nd) => {
          const s = sideOf(nd);
          const isCommon = cm && nd === cm.c;
          K.svg("rect", { x: nd.x - 22, y: y(nd.d) - 12, width: 44, height: 24, rx: 8, fill: s === 1 ? "var(--accent)" : s === 2 ? "var(--orange)" : "var(--card-solid)", stroke: isCommon ? "var(--red)" : "var(--label-3)", "stroke-width": isCommon ? 3 : 1.4 }, g);
          const t = K.text(g, nd.x, y(nd.d), nd.name, "s-text-strong");
          t.style.fontSize = "10.5px";
          if (s) t.style.fill = "white";
        });
        let level = 0;
        if (cm) { level = cm.A.d - cm.c.d; out.set("Streit zwischen <b>" + cm.A.name + "</b> und <b>" + cm.B.name + "</b>: Mobilisiert werden alle Nachkommen der beiden Linien unterhalb von <b>" + cm.c.name + "</b> (rot umrandet). Blau steht gegen Orange, alle anderen bleiben neutral."); }
        else out.set("Kein Konflikt. Jede Lineage ist Teil einer größeren, die wieder Teil einer größeren ist.");
        return { level };
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, paint()),
        act(name, arg) { if (name === "conflict") { conflict = (arg || []).slice(); paint(); } },
      };
    },
  });

  // ------------------------------------------------------------ ethnic boundaries (Barth 1969)

  /* params: n (people per group), moved (how many crossed), changed (how many adopted the other side's ways)
   * scope:  moved, changed */
  LW.widget("boundary", {
    mount(host, p, ctx) {
      const n = p.n || 9;
      let moved = p.moved || 0, changed = p.changed || 0;
      const W = 360, H = 200;
      const svg = K.root(host, W, H, "Ethnische Grenze");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const rng = LW.rng(LW.hash("barth"));
      const base = Array.from({ length: 2 * n }, (_, i) => ({ side: i < n ? 0 : 1, rx: 0.15 + rng() * 0.7, ry: 0.12 + rng() * 0.76 }));
      function paint() {
        K.clear(g);
        K.svg("rect", { x: 10, y: 10, width: W - 20, height: H - 20, rx: 14, fill: "none", stroke: "var(--label-3)" }, g);
        K.svg("path", { d: "M180,14 C170,60 192,120 180,186", fill: "none", stroke: "var(--red)", "stroke-width": 3, "stroke-dasharray": "8 5" }, g);
        K.text(g, 95, 26, "»Wir«", "s-text-strong");
        K.text(g, 265, 26, "»die anderen«", "s-text-strong");
        const m = Math.round(moved), c = Math.round(changed);
        base.forEach((b, i) => {
          // the first "moved" members of group 0 now live on the other side, but still count as group 0
          const crossed = b.side === 0 && i < m;
          const xSide = crossed ? 1 : b.side;
          const px = xSide === 0 ? 20 + b.rx * 145 : 195 + b.rx * 145, py = 40 + b.ry * 140;
          const adopted = b.side === 0 ? i >= n - c : false;
          const color = adopted ? "var(--orange)" : b.side === 0 ? "var(--accent)" : "var(--orange)";
          K.svg("circle", { cx: px, cy: py, r: 8, fill: color, stroke: b.side === 0 ? "var(--accent)" : "var(--orange)", "stroke-width": 3 }, g);
          if (b.side === 0) K.text(g, px, py, "w", "s-text-strong").style.fill = "white";
        });
        out.set("Gefüllte Farbe: kulturelle Merkmale (Kleidung, Sprache, Wirtschaftsweise). Rand und »w«: Zugehörigkeit, wie die Menschen sich selbst einordnen. " + (m || c ? "<b>" + m + "</b> sind über die Grenze gezogen, <b>" + c + "</b> haben Merkmale der anderen übernommen, und trotzdem besteht die Grenze." : ""));
        return { moved: m, changed: c };
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, paint()),
        getVar: (name) => (name === "moved" ? moved : name === "changed" ? changed : NaN),
        setVar(name, v) { if (name === "moved") moved = K.clamp(v, 0, n); if (name === "changed") changed = K.clamp(v, 0, n); paint(); },
      };
    },
  });
})();
