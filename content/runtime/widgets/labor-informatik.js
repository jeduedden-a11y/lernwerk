/* Computer science labs.
 *
 *   suchlabor: a grid maze. Tap cells to set or remove walls; breadth-first, depth-first, greedy best-first and A* (Manhattan
 *     distance) search from S to Z. Explored cells carry their expansion number, the path is drawn, a table compares all four.
 *     Neighbours are taken in the order up, down, left, right, as in CS50's maze.py; a cell already in the frontier or explored is
 *     not added again (A* keeps the cheapest way to each cell).
 *     params: cols, rows, walls ["x,y", ...], start [x, y], goal [x, y], alg "bfs" | "dfs" | "greedy" | "astar", edit (walls, default true),
 *             numbers (expansion numbers, default true)
 *     scope:  walls, alg (1..4), explored, len (path length of the chosen search, −1 without path), found, opt (shortest path, −1 if
 *             unreachable), eBFS, eDFS, eGreedy, eAstar, lBFS, lDFS, lGreedy, lAstar
 *   sortierlabor: bars to sort. Tap two bars to swap them in the input; bubble sort (stops after a pass without swaps), insertion sort
 *     and selection sort run on it, count comparisons and swaps, and replay step by step.
 *     params: values [..], alg "bubble" | "insertion" | "selection", edit (input, default true)
 *     scope:  n, inv (inversions of the input), sorted, rev, cBubble, sBubble, pBubble (passes), cInsert, sInsert, cSelect, sSelect,
 *             comps, swaps (of the chosen algorithm)
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  function checkGoal(goal, scope) {
    if (!goal || !goal.when) return { correct: true };
    let ok = false;
    try { ok = !!LW.expr(goal.when)(scope); } catch (e) { ok = false; }
    return ok ? { correct: true } : { correct: false, detail: goal.message || null };
  }

  // ---------------------------------------------------------------- search on a grid
  const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const ALGS = ["bfs", "dfs", "greedy", "astar"];
  const ALGNAME = { bfs: "Breitensuche", dfs: "Tiefensuche", greedy: "Greedy", astar: "A*" };
  /** G: {cols, rows, wall: Set("x,y"), start, goal}. Returns {explored, order, path}. */
  function search(G, alg) {
    const key = (c) => c[0] + "," + c[1], gk = key(G.goal);
    const h = (c) => Math.abs(c[0] - G.goal[0]) + Math.abs(c[1] - G.goal[1]);
    const frontier = [{ c: G.start, g: 0, parent: null, n: 0 }];
    const inFrontier = new Set([key(G.start)]), best = new Map([[key(G.start), 0]]), explored = new Set(), order = [];
    let counter = 1;
    while (frontier.length) {
      let k = 0;
      if (alg === "dfs") k = frontier.length - 1;
      else if (alg !== "bfs") {
        const f = (e) => (alg === "greedy" ? h(e.c) : e.g + h(e.c));
        for (let i = 1; i < frontier.length; i++) { const a = f(frontier[i]), b = f(frontier[k]); if (a < b || (a === b && frontier[i].n < frontier[k].n)) k = i; }
      }
      const node = frontier.splice(k, 1)[0], nk = key(node.c);
      inFrontier.delete(nk);
      if (explored.has(nk) || (alg === "astar" && node.g > best.get(nk))) continue;
      order.push(node.c);
      if (nk === gk) { const path = []; for (let e = node; e; e = e.parent) path.unshift(e.c); return { explored: order.length, order, path }; }
      explored.add(nk);
      for (const [dx, dy] of DIRS) {
        const c = [node.c[0] + dx, node.c[1] + dy], ck = key(c);
        if (c[0] < 0 || c[1] < 0 || c[0] >= G.cols || c[1] >= G.rows || G.wall.has(ck) || explored.has(ck)) continue;
        if (alg === "astar") {
          const gg = node.g + 1;
          if (best.has(ck) && best.get(ck) <= gg) continue;
          best.set(ck, gg);
        } else {
          if (inFrontier.has(ck)) continue;
          inFrontier.add(ck);
        }
        frontier.push({ c, g: node.g + 1, parent: node, n: counter++ });
      }
    }
    return { explored: order.length, order, path: null };
  }
  /** All four searches and the numbers the goals use. */
  function compare(G) {
    const R = {};
    ALGS.forEach((a) => { R[a] = search(G, a); });
    const len = (r) => (r.path ? r.path.length - 1 : -1);
    return { R, sc: { walls: G.wall.size, opt: len(R.bfs), eBFS: R.bfs.explored, eDFS: R.dfs.explored, eGreedy: R.greedy.explored, eAstar: R.astar.explored,
      lBFS: len(R.bfs), lDFS: len(R.dfs), lGreedy: len(R.greedy), lAstar: len(R.astar) } };
  }
  LW.widget("suchlabor", {
    mount(host, p, ctx) {
      const cols = p.cols || 8, rows = p.rows || 6;
      const start = (p.start || [0, rows - 1]).slice(), goal = (p.goal || [cols - 1, 0]).slice();
      const wall = new Set(p.walls || []);
      let alg = ALGS.includes(p.alg) ? p.alg : "bfs";
      const edit = p.edit !== false, numbers = p.numbers !== false;
      K.segmented(host, ALGS.map((a) => ({ id: a, label: ALGNAME[a] })), alg, (id) => { alg = id; paint(); ctx.changed(); });
      const cs = Math.floor(Math.min(44, 352 / cols)), W = cols * cs + 8, H = rows * cs + 8;
      const svg = K.root(host, W, H, "Labyrinth");
      svg.style.maxWidth = Math.max(360, W) + "px";
      svg.style.margin = "8px auto 0";
      svg.style.touchAction = "manipulation";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const table = LW.el("div", { class: "lw-logic-table" });
      host.append(table);
      const G = () => ({ cols, rows, wall, start, goal });
      let last = null;
      function scope() {
        const C = compare(G()), cur = C.R[alg];
        last = C;
        return Object.assign({}, C.sc, { alg: ALGS.indexOf(alg) + 1, explored: cur.explored, len: cur.path ? cur.path.length - 1 : -1, found: cur.path ? 1 : 0 });
      }
      svg.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("[data-cell]") : null;
        if (!t || !edit) return;
        const k = t.dataset.cell;
        if (k === start.join(",") || k === goal.join(",")) return;
        if (wall.has(k)) wall.delete(k); else wall.add(k);
        paint(); ctx.changed();
      });
      function paint() {
        K.clear(g);
        const sc = scope(), cur = last.R[alg];
        const num = new Map(cur.order.map((c, i) => [c.join(","), i + 1]));
        const onPath = new Set((cur.path || []).map((c) => c.join(",")));
        for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
          const k = xx + "," + yy, X = 4 + xx * cs, Y = 4 + yy * cs;
          const isW = wall.has(k), isS = k === start.join(","), isZ = k === goal.join(",");
          const fill = isW ? "var(--label-2)" : onPath.has(k) ? "var(--accent)" : num.has(k) ? "var(--accent-soft)" : "var(--fill)";
          const r = K.svg("rect", { x: X + 1.5, y: Y + 1.5, width: cs - 3, height: cs - 3, rx: 5, fill, style: edit && !isS && !isZ ? "cursor:pointer" : null }, g);
          r.dataset.cell = k;
          if (isS || isZ) {
            const t = K.text(g, X + cs / 2, Y + cs / 2, isS ? "S" : "Z", "s-text-strong");
            t.style.fill = onPath.has(k) ? "#fff" : "var(--label)";
            t.style.pointerEvents = "none";
          } else if (numbers && num.has(k)) {
            const t = K.text(g, X + cs / 2, Y + cs / 2, String(num.get(k)), "s-text");
            t.style.fontSize = "10.5px";
            t.style.fill = onPath.has(k) ? "#fff" : "var(--label-2)";
            t.style.pointerEvents = "none";
          }
        }
        out.set("<b>" + LW.esc(ALGNAME[alg] + ": " + sc.explored + " Felder untersucht, " + (sc.found ? "Weg mit " + sc.len + " Schritten" : "kein Weg")) + "</b>" +
          LW.esc(sc.opt >= 0 ? " · kürzester Weg: " + sc.opt + " Schritte" : " · Z ist von S aus nicht erreichbar") + "<br>" + LW.esc("Wände: " + sc.walls + (edit ? ". Tippe ein Feld an, um eine Wand zu setzen oder zu entfernen." : "")));
        table.innerHTML = "<table><thead><tr><th></th><th>Felder</th><th>Weg</th></tr></thead><tbody>" +
          ALGS.map((a) => { const r = last.R[a]; return "<tr><td><b>" + LW.esc(ALGNAME[a]) + "</b></td><td>" + r.explored + "</td><td>" + (r.path ? r.path.length - 1 : "–") + "</td></tr>"; }).join("") + "</tbody></table>";
      }
      paint();
      return {
        check: (goal2) => checkGoal(goal2, scope()),
        solve(goal2) { const s = (goal2 && goal2.solve) || {}; if (s.walls) { wall.clear(); s.walls.forEach((k) => wall.add(k)); } if (s.alg) alg = s.alg; paint(); },
        getVar: (k) => scope()[k],
      };
    },
  });

  // ---------------------------------------------------------------- sorting
  function runSort(arr, alg) {
    const a = arr.slice(), trace = [{ a: a.slice(), hi: [], kind: "start" }], n = a.length;
    let comps = 0, swaps = 0, passes = 0;
    const cmp = (i, j) => { comps++; trace.push({ a: a.slice(), hi: [i, j], kind: "cmp" }); };
    const swap = (i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; swaps++; trace.push({ a: a.slice(), hi: [i, j], kind: "swap" }); };
    if (alg === "bubble") {
      for (let pass = 0; pass < n - 1; pass++) {
        passes++;
        let sw = false;
        for (let j = 0; j < n - 1 - pass; j++) { cmp(j, j + 1); if (a[j] > a[j + 1]) { swap(j, j + 1); sw = true; } }
        if (!sw) break;
      }
    } else if (alg === "insertion") {
      for (let i = 1; i < n; i++) for (let j = i - 1; j >= 0; j--) { cmp(j, j + 1); if (a[j] > a[j + 1]) swap(j, j + 1); else break; }
    } else {
      for (let i = 0; i < n - 1; i++) {
        let m = i;
        for (let j = i + 1; j < n; j++) { cmp(j, m); if (a[j] < a[m]) m = j; }
        if (m !== i) swap(i, m);
      }
    }
    trace.push({ a: a.slice(), hi: [], kind: "end" });
    return { comps, swaps, passes, trace };
  }
  const inversions = (a) => { let k = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) k++; return k; };
  const SORTS = ["bubble", "insertion", "selection"];
  const SORTNAME = { bubble: "Bubblesort", insertion: "Insertionsort", selection: "Selectionsort" };
  function sortScope(vals, alg) {
    const R = {};
    SORTS.forEach((s) => { R[s] = runSort(vals, s); });
    const inv = inversions(vals), n = vals.length;
    return { R, sc: { n, inv, sorted: inv === 0 ? 1 : 0, rev: inv === (n * (n - 1)) / 2 ? 1 : 0, cBubble: R.bubble.comps, sBubble: R.bubble.swaps, pBubble: R.bubble.passes,
      cInsert: R.insertion.comps, sInsert: R.insertion.swaps, cSelect: R.selection.comps, sSelect: R.selection.swaps, comps: R[alg].comps, swaps: R[alg].swaps } };
  }
  LW.widget("sortierlabor", {
    mount(host, p, ctx) {
      const vals = (p.values || [4, 2, 6, 1, 5, 3]).slice();
      let alg = SORTS.includes(p.alg) ? p.alg : "bubble", pick = null, stepAt = 0, timer = null;
      const edit = p.edit !== false;
      K.segmented(host, SORTS.map((s) => ({ id: s, label: SORTNAME[s] })), alg, (id) => { alg = id; stop(); stepAt = 0; paint(); ctx.changed(); });
      const W = 360, H = 190;
      const svg = K.root(host, W, H, "Balken zum Sortieren");
      svg.style.touchAction = "manipulation";
      const g = K.svg("g", null, svg);
      const ctl = LW.el("div", { class: "w-btns" });
      host.append(ctl);
      const playBtn = K.button(ctl, "Abspielen", () => { if (timer) stop(); else play(); });
      K.button(ctl, "Zum Anfang", () => { stop(); stepAt = 0; paint(); });
      const sopts = { label: "Schritt", min: 0, max: 1, step: 1, value: 0, format: (k) => K.fmt(k, 0), onInput: (k) => { stop(); stepAt = k; paint(); } };
      const slider = K.slider(host, sopts);
      const out = K.readout(host);
      const table = LW.el("div", { class: "lw-logic-table" });
      host.append(table);
      let S = null;
      function play() {
        if (stepAt >= S.R[alg].trace.length - 1) stepAt = 0;
        playBtn.textContent = "Anhalten";
        timer = setInterval(() => { if (!host.isConnected) { stop(); return; } if (stepAt >= S.R[alg].trace.length - 1) { stop(); return; } stepAt++; paint(); }, 420);
      }
      function stop() { if (timer) clearInterval(timer); timer = null; playBtn.textContent = "Abspielen"; }
      svg.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("[data-bar]") : null;
        if (!t || !edit) return;
        stop();
        const i = +t.dataset.bar;
        if (stepAt !== 0) { stepAt = 0; pick = null; }
        if (pick == null) pick = i;
        else if (pick === i) pick = null;
        else { const tmp = vals[pick]; vals[pick] = vals[i]; vals[i] = tmp; pick = null; ctx.changed(); }
        paint();
      });
      function paint() {
        S = sortScope(vals, alg);
        const tr = S.R[alg].trace, K2 = tr.length - 1;
        stepAt = Math.min(stepAt, K2);
        sopts.max = Math.max(1, K2);
        slider.input.max = sopts.max;
        slider.set(stepAt);
        const st = tr[stepAt], n = vals.length, maxV = Math.max(...vals), bw = (W - 20) / n;
        K.clear(g);
        st.a.forEach((val, i) => {
          const h = (140 * val) / maxV, X = 10 + i * bw, hi = st.hi.includes(i);
          const fill = stepAt === 0 && pick === i ? "var(--accent)" : hi ? (st.kind === "swap" ? "var(--orange)" : "var(--blue)") : st.kind === "end" ? "var(--green)" : "var(--label-3)";
          const r = K.svg("rect", { x: X + 4, y: 160 - h, width: bw - 8, height: h, rx: 5, fill, style: edit ? "cursor:pointer" : null }, g);
          r.dataset.bar = i;
          const hit = K.svg("rect", { x: X, y: 10, width: bw, height: 172, fill: "transparent" }, g);
          hit.dataset.bar = i;
          K.text(g, X + bw / 2, 174, String(val), "s-text-strong").style.pointerEvents = "none";
        });
        const sc = S.sc;
        const what = st.kind === "start" ? (edit ? "Eingabe. Tippe zwei Balken an, um sie zu tauschen." : "Eingabe.") : st.kind === "end" ? "Sortiert." :
          st.kind === "cmp" ? "Vergleiche Position " + (st.hi[0] + 1) + " und " + (st.hi[1] + 1) + "." : "Tausche Position " + (st.hi[0] + 1) + " und " + (st.hi[1] + 1) + ".";
        out.set("<b>" + LW.esc("Schritt " + stepAt + " von " + K2 + ": " + what) + "</b><br>" +
          LW.esc(SORTNAME[alg] + ": " + sc.comps + " Vergleiche, " + sc.swaps + " Vertauschungen" + (alg === "bubble" ? ", " + sc.pBubble + (sc.pBubble === 1 ? " Durchlauf" : " Durchläufe") : "") + ". Die Eingabe hat " + sc.inv + (sc.inv === 1 ? " Fehlstand" : " Fehlstände") + "."));
        table.innerHTML = "<table><thead><tr><th></th><th>Vergleiche</th><th>Tausche</th></tr></thead><tbody>" +
          SORTS.map((s) => "<tr><td><b>" + SORTNAME[s] + "</b></td><td>" + S.R[s].comps + "</td><td>" + S.R[s].swaps + "</td></tr>").join("") + "</tbody></table>";
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, sortScope(vals, alg).sc),
        solve(goal) { const s = (goal && goal.solve) || {}; if (s.values) s.values.forEach((x, i) => { vals[i] = x; }); if (s.alg) alg = s.alg; stop(); stepAt = 0; pick = null; paint(); },
        getVar: (k) => sortScope(vals, alg).sc[k],
        leave() { stop(); },
      };
    },
  });

  LW.labSearch = { search, compare, ALGS };
  LW.labSort = { runSort, inversions, sortScope };
})();
