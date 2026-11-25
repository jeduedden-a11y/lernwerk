/* Ethnology lab: kinship terminologies in Ego's and the parents' generation (Murdock's six types).
 *
 *   terminologie: male Ego, his parents with their siblings, his siblings and cousins. In free mode a system is chosen and every
 *     relative takes the colour and letter of its term; the legend gives the German gloss. In task mode the learner paints the
 *     relatives with letters (same letter = same term) and the lab says which system the painting matches.
 *     params: system (free mode), task (true: paint), paint {id: letter} (start), letters (number of letters, default 8)
 *     scope:  hawaii, eskimo, irokesen, crow, omaha, sudan (1 if the painting has exactly the system's classes), done (all painted),
 *             terms (letters used)
 *   Crow and Omaha follow the usual textbook account for a male speaker: Crow calls FZS like F and FZD like FZ, MBS and MBD like
 *   son and daughter; Omaha calls MBS like MB and MBD like M, FZS and FZD like sister's son and daughter.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  const PEOPLE = [
    { id: "FB", sex: "m", gen: 1, x: 34 }, { id: "FZ", sex: "f", gen: 1, x: 100 }, { id: "F", sex: "m", gen: 1, x: 160 },
    { id: "M", sex: "f", gen: 1, x: 200 }, { id: "MB", sex: "m", gen: 1, x: 260 }, { id: "MZ", sex: "f", gen: 1, x: 326 },
    { id: "FBS", sex: "m", gen: 0, x: 18 }, { id: "FBD", sex: "f", gen: 0, x: 50 }, { id: "FZS", sex: "m", gen: 0, x: 84 }, { id: "FZD", sex: "f", gen: 0, x: 116 },
    { id: "B", sex: "m", gen: 0, x: 150 }, { id: "Ego", sex: "m", gen: 0, x: 180 }, { id: "Z", sex: "f", gen: 0, x: 210 },
    { id: "MBS", sex: "m", gen: 0, x: 244 }, { id: "MBD", sex: "f", gen: 0, x: 276 }, { id: "MZS", sex: "m", gen: 0, x: 310 }, { id: "MZD", sex: "f", gen: 0, x: 342 },
  ];
  const REL = PEOPLE.filter((q) => q.id !== "Ego").map((q) => q.id);
  const SYS = {
    hawaii: { name: "Hawaii", terms: [["Vater", ["F", "FB", "MB"]], ["Mutter", ["M", "FZ", "MZ"]], ["Bruder", ["B", "FBS", "FZS", "MBS", "MZS"]], ["Schwester", ["Z", "FBD", "FZD", "MBD", "MZD"]]],
      text: "**Hawaii** (generational): Es zählt nur Generation und Geschlecht. Alle Männer der Elterngeneration heißen wie der Vater, alle Cousins wie Brüder. Häufig bei kognatischer Abstammung, etwa in Polynesien." },
    eskimo: { name: "Eskimo", terms: [["Vater", ["F"]], ["Mutter", ["M"]], ["Onkel", ["FB", "MB"]], ["Tante", ["FZ", "MZ"]], ["Bruder", ["B"]], ["Schwester", ["Z"]], ["Cousin", ["FBS", "FZS", "MBS", "MZS"]], ["Cousine", ["FBD", "FZD", "MBD", "MZD"]]],
      text: "**Eskimo** (linear): Die Kernfamilie hebt sich ab, Vater- und Mutterseite werden gleich behandelt. So ist das deutsche System gebaut; es passt zu bilateraler Abstammung und eigenständigen Kernfamilien." },
    irokesen: { name: "Irokesen", terms: [["Vater", ["F", "FB"]], ["Mutter", ["M", "MZ"]], ["Mutterbruder", ["MB"]], ["Vaterschwester", ["FZ"]], ["Bruder", ["B", "FBS", "MZS"]], ["Schwester", ["Z", "FBD", "MZD"]], ["Kreuzcousin", ["FZS", "MBS"]], ["Kreuzcousine", ["FZD", "MBD"]]],
      text: "**Irokesen** (bifurcate merging): Geschwister gleichen Geschlechts werden zusammengelegt, der Vaterbruder heißt Vater, die Mutterschwester Mutter. Parallelcousins heißen wie Geschwister, Kreuzcousins bekommen eigene Begriffe: oft die erlaubten Ehepartner." },
    crow: { name: "Crow", terms: [["Vater", ["F", "FB", "FZS"]], ["Mutter", ["M", "MZ"]], ["Mutterbruder", ["MB"]], ["Vaterschwester", ["FZ", "FZD"]], ["Bruder", ["B", "FBS", "MZS"]], ["Schwester", ["Z", "FBD", "MZD"]], ["Sohn", ["MBS"]], ["Tochter", ["MBD"]]],
      text: "**Crow** (matrilinear): Wie bei den Irokesen, aber die Matrilineage des Vaters zählt über die Generationen hinweg: Der Sohn der Vaterschwester heißt Vater, ihre Tochter Vaterschwester. Umgekehrt nennt Ego die Kinder des Mutterbruders Sohn und Tochter." },
    omaha: { name: "Omaha", terms: [["Vater", ["F", "FB"]], ["Mutter", ["M", "MZ", "MBD"]], ["Mutterbruder", ["MB", "MBS"]], ["Vaterschwester", ["FZ"]], ["Bruder", ["B", "FBS", "MZS"]], ["Schwester", ["Z", "FBD", "MZD"]], ["Schwestersohn", ["FZS"]], ["Schwestertochter", ["FZD"]]],
      text: "**Omaha** (patrilinear), das Spiegelbild von Crow: Die Patrilineage der Mutter zählt über die Generationen hinweg. Der Sohn des Mutterbruders heißt Mutterbruder, seine Tochter Mutter; die Kinder der Vaterschwester heißen wie Kinder der Schwester." },
    sudan: { name: "Sudan", terms: [["Vater", ["F"]], ["Mutter", ["M"]], ["Vaterbruder", ["FB"]], ["Vaterschwester", ["FZ"]], ["Mutterbruder", ["MB"]], ["Mutterschwester", ["MZ"]], ["Bruder", ["B"]], ["Schwester", ["Z"]],
      ["Vaterbrudersohn", ["FBS"]], ["Vaterbrudertochter", ["FBD"]], ["Vaterschwestersohn", ["FZS"]], ["Vaterschwestertochter", ["FZD"]], ["Mutterbrudersohn", ["MBS"]], ["Mutterbrudertochter", ["MBD"]], ["Mutterschwestersohn", ["MZS"]], ["Mutterschwestertochter", ["MZD"]]],
      text: "**Sudan** (deskriptiv): Jede Position hat ihren eigenen Begriff, nichts wird zusammengelegt. Häufig in stark geschichteten Gesellschaften, etwa im Sudan und in der Türkei." },
  };
  const SYSKEYS = ["hawaii", "eskimo", "irokesen", "crow", "omaha", "sudan"];
  const LETTERS = "ABCDEFGHIJKLMNOP".split("");
  const COLORS = ["#0a84ff", "#ff9f0a", "#30b158", "#ff453a", "#30b0c7", "#af52de", "#a2845e", "#e0b000"];
  const colorOf = (L) => COLORS[LETTERS.indexOf(L) % COLORS.length];
  /** The classes of a painting as a canonical list: for every relative the index of the first relative with the same letter. */
  function canon(paint) {
    const first = {};
    return REL.map((id, i) => { const L = paint[id]; if (!L) return -1 - i; if (!(L in first)) first[L] = i; return first[L]; });
  }
  const sysPaint = (key) => { const out = {}; SYS[key].terms.forEach((t, k) => t[1].forEach((id) => { out[id] = LETTERS[k]; })); return out; };
  const SYSCANON = Object.fromEntries(SYSKEYS.map((k) => [k, canon(sysPaint(k)).join(",")]));
  function kinScope(paint) {
    const c = canon(paint).join(","), done = REL.every((id) => paint[id]) ? 1 : 0;
    const sc = { done, terms: new Set(REL.map((id) => paint[id]).filter(Boolean)).size };
    SYSKEYS.forEach((k) => { sc[k] = done && c === SYSCANON[k] ? 1 : 0; });
    return sc;
  }

  LW.widget("terminologie", {
    mount(host, p, ctx) {
      const task = !!p.task;
      let sys = SYSKEYS.includes(p.system) ? p.system : "eskimo";
      let paint = task ? Object.assign({}, p.paint || {}) : sysPaint(sys);
      const nLetters = Math.min(16, p.letters || 8);
      let brush = "A";
      if (!task) K.segmented(host, SYSKEYS.map((k) => ({ id: k, label: SYS[k].name })), sys, (id) => { sys = id; paint = sysPaint(sys); draw(); ctx.changed(); });
      let pal = null;
      if (task) {
        pal = LW.el("div", { class: "lw-kin-pal", role: "radiogroup", "aria-label": "Begriff" });
        host.append(pal);
        LETTERS.slice(0, nLetters).concat(["×"]).forEach((L) => {
          const b = LW.el("button", { type: "button", class: "lw-kin-chip", role: "radio", text: L === "×" ? "Löschen" : L, "aria-label": L === "×" ? "Bezeichnung entfernen" : "Begriff " + L });
          if (L !== "×") b.style.setProperty("--kc", colorOf(L));
          b.dataset.L = L;
          b.addEventListener("click", () => { brush = L; draw(); });
          pal.append(b);
        });
      }
      const W = 360, H = 186;
      const svg = K.root(host, W, H, "Verwandtschaftsdiagramm mit Begriffen");
      svg.style.maxWidth = "560px";
      svg.style.margin = "6px auto 0";
      svg.style.touchAction = "manipulation";
      const Y = { 1: 52, 0: 138 };
      const by = Object.fromEntries(PEOPLE.map((q) => [q.id, q]));
      const lines = K.svg("g", null, svg);
      const ln = (x1, y1, x2, y2) => K.svg("line", { x1, y1, x2, y2, class: "s-axis", "stroke-width": 1.5 }, lines);
      // siblings of the father and of the mother hang from a bar each; F = M marry; every couple's children hang from a bar
      const sibs = (ids) => { const xs = ids.map((id) => by[id].x); ln(Math.min(...xs), 24, Math.max(...xs), 24); xs.forEach((xx) => ln(xx, 24, xx, Y[1] - 13)); ln((Math.min(...xs) + Math.max(...xs)) / 2, 24, (Math.min(...xs) + Math.max(...xs)) / 2, 12); };
      sibs(["FB", "FZ", "F"]); sibs(["M", "MB", "MZ"]);
      ln(by.F.x + 12, Y[1] - 2, by.M.x - 12, Y[1] - 2); ln(by.F.x + 12, Y[1] + 2, by.M.x - 12, Y[1] + 2);
      const kids = (fromX, ids) => { const xs = ids.map((id) => by[id].x); ln(fromX, Y[1] + (fromX === 180 ? 2 : 13), fromX, 106); ln(Math.min(fromX, ...xs), 106, Math.max(fromX, ...xs), 106); xs.forEach((xx) => ln(xx, 106, xx, Y[0] - 13)); };
      kids(180, ["B", "Ego", "Z"]); kids(by.FB.x, ["FBS", "FBD"]); kids(by.FZ.x, ["FZS", "FZD"]); kids(by.MB.x, ["MBS", "MBD"]); kids(by.MZ.x, ["MZS", "MZD"]);
      const els = {};
      PEOPLE.forEach((q) => {
        const gr = K.svg("g", { transform: "translate(" + q.x + "," + Y[q.gen] + ")", style: task && q.id !== "Ego" ? "cursor:pointer" : null }, svg);
        const shape = q.sex === "m" ? K.svg("path", { d: "M0,-12 L12,9 L-12,9 Z", "stroke-width": q.id === "Ego" ? 2.6 : 1.6 }, gr) : K.svg("circle", { r: 11, "stroke-width": 1.6 }, gr);
        const letter = K.text(gr, 0, q.sex === "m" ? 2 : 0.5, "", "lw-kin-letter");
        const lab = K.text(gr, 0, 22, q.id, "s-text");
        lab.style.fontSize = q.id === "Ego" ? "11px" : "9.5px";
        if (q.id === "Ego") lab.style.fontWeight = "700";
        if (task && q.id !== "Ego") {
          K.svg("rect", { x: -15, y: -15, width: 30, height: 44, fill: "transparent" }, gr);
          gr.addEventListener("click", () => {
            if (brush === "×") delete paint[q.id]; else paint[q.id] = brush;
            draw(); ctx.changed();
          });
        }
        els[q.id] = { shape, letter };
      });
      const legend = LW.el("div", { class: "lw-kin-legend" });
      host.append(legend);
      const desc = LW.el("div", { class: "lw-md lw-kin-desc" });
      host.append(desc);
      const out = K.readout(host);
      function draw() {
        PEOPLE.forEach((q) => {
          const e = els[q.id], L = paint[q.id];
          e.shape.setAttribute("fill", L ? colorOf(L) : "var(--card-solid)");
          e.shape.setAttribute("stroke", q.id === "Ego" ? "var(--label)" : L ? colorOf(L) : "var(--label-3)");
          e.letter.textContent = q.id === "Ego" ? "" : L || "";
          e.letter.style.fill = L && colorOf(L) === "#e0b000" ? "#1c1c1e" : "#fff";
        });
        if (pal) pal.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.L === brush));
        const sc = kinScope(paint);
        if (!task) {
          legend.innerHTML = SYS[sys].terms.map((t, k) => '<span class="lw-kin-term"><i style="background:' + colorOf(LETTERS[k]) + '">' + LETTERS[k] + "</i>" + LW.esc(t[0]) + ": " + LW.esc(t[1].join(", ")) + "</span>").join("");
          desc.innerHTML = LW.md(SYS[sys].text);
          out.set(LW.esc(SYS[sys].terms.length + " Begriffe für 16 Verwandte. F Vater, M Mutter, B Bruder, Z Schwester, S Sohn, D Tochter: FZS ist der Sohn der Vaterschwester."));
        } else {
          const groups = {};
          REL.forEach((id) => { if (paint[id]) (groups[paint[id]] = groups[paint[id]] || []).push(id); });
          legend.innerHTML = Object.keys(groups).sort().map((L) => '<span class="lw-kin-term"><i style="background:' + colorOf(L) + '">' + L + "</i>" + LW.esc(groups[L].join(", ")) + "</span>").join("");
          desc.innerHTML = "";
          const match = SYSKEYS.filter((k) => sc[k]);
          out.set(LW.esc((sc.done ? "Alle 16 Verwandten bezeichnet, " : (16 - REL.filter((id) => paint[id]).length) + " noch ohne Begriff, ") + sc.terms + (sc.terms === 1 ? " Begriff. " : " Begriffe. ")) +
            (match.length ? K.pill(true, "Diese Einteilung entspricht " + SYS[match[0]].name) : sc.done ? K.pill(false, "Diese Einteilung entspricht keinem der sechs Typen") : LW.esc("Gleicher Buchstabe heißt gleicher Begriff.")));
        }
      }
      draw();
      return {
        check(goal) {
          if (!goal || !goal.when) return { correct: true };
          let ok = false;
          try { ok = !!LW.expr(goal.when)(kinScope(paint)); } catch (e) { ok = false; }
          return ok ? { correct: true } : { correct: false, detail: goal.message || null };
        },
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.paint) paint = Object.assign({}, s.paint);
          else if (s.system) paint = sysPaint(s.system);
          draw();
        },
        getVar: (k) => kinScope(paint)[k],
      };
    },
  });

  LW.labKin = { SYS, SYSKEYS, sysPaint, kinScope, REL };
})();
