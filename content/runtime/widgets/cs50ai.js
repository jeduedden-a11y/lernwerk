/* CS50 AI widgets: maze search exactly like the lecture's maze.py (neighbours up, down, left, right;
   a state enters the frontier only if it is neither in the frontier nor explored). */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  const ALGS = [
    { id: "dfs", label: "Tiefensuche" },
    { id: "bfs", label: "Breitensuche" },
    { id: "gbfs", label: "Greedy" },
    { id: "astar", label: "A*" },
  ];

  function parseMaze(rows) {
    const walls = [];
    let start = null, goal = null;
    rows.forEach((line, r) => {
      walls[r] = [];
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        walls[r][c] = ch === "#";
        if (ch === "A") start = [r, c];
        if (ch === "B") goal = [r, c];
      }
    });
    return { walls, start, goal, h: rows.length, w: Math.max(...rows.map((l) => l.length)) };
  }

  function makeSearch(maze, alg) {
    const key = (s) => s[0] + "," + s[1];
    const hDist = (s) => Math.abs(s[0] - maze.goal[0]) + Math.abs(s[1] - maze.goal[1]);
    let counter = 0;
    const frontier = [{ state: maze.start, parent: null, action: null, g: 0, order: counter++ }];
    const inFrontier = new Set([key(maze.start)]);
    const explored = new Set();
    let status = "running";
    let current = null;
    let path = [];
    let removedCount = 0;

    function neighbors(s) {
      const [r, c] = s;
      return [["up", [r - 1, c]], ["down", [r + 1, c]], ["left", [r, c - 1]], ["right", [r, c + 1]]]
        .filter(([, [rr, cc]]) => rr >= 0 && rr < maze.h && cc >= 0 && cc < maze.w && !maze.walls[rr][cc]);
    }

    function remove() {
      if (alg === "dfs") return frontier.pop();
      if (alg === "bfs") return frontier.shift();
      let best = 0;
      const cost = (n) => (alg === "astar" ? n.g + hDist(n.state) : hDist(n.state));
      for (let i = 1; i < frontier.length; i++) {
        const a = frontier[i], b = frontier[best];
        if (cost(a) < cost(b) || (cost(a) === cost(b) && (hDist(a.state) < hDist(b.state) || (hDist(a.state) === hDist(b.state) && a.order < b.order)))) best = i;
      }
      return frontier.splice(best, 1)[0];
    }

    function step() {
      if (status !== "running") return status;
      if (!frontier.length) { status = "none"; current = null; return status; }
      const node = remove();
      inFrontier.delete(key(node.state));
      removedCount++;
      current = node;
      if (node.state[0] === maze.goal[0] && node.state[1] === maze.goal[1]) {
        const cells = [];
        let n = node;
        while (n.parent) { cells.push(n.state); n = n.parent; }
        path = cells.reverse();
        status = "solved";
        return status;
      }
      explored.add(key(node.state));
      for (const [action, st] of neighbors(node.state)) {
        const k = key(st);
        if (!inFrontier.has(k) && !explored.has(k)) {
          frontier.push({ state: st, parent: node, action, g: node.g + 1, order: counter++ });
          inFrontier.add(k);
        }
      }
      return status;
    }
    return {
      step, hDist,
      get status() { return status; }, get frontier() { return frontier; }, get explored() { return explored; },
      get current() { return current; }, get path() { return path; }, get removed() { return removedCount; },
    };
  }

  LW.widget("maze-search", {
    mount(host, p, ctx) {
      const maze = parseMaze(p.maze || [
        "###########",
        "#A    #   #",
        "# ### # # #",
        "#   #   # #",
        "### ##### #",
        "#       #B#",
        "###########",
      ]);
      const W = 360;
      const cell = Math.floor(W / maze.w);
      const H = cell * maze.h;
      const svg = K.root(host, cell * maze.w, H, "Labyrinth");
      svg.style.maxWidth = Math.min(560, maze.w * 44) + "px";
      svg.style.margin = "0 auto";
      const rects = [];
      const labels = [];
      for (let r = 0; r < maze.h; r++) {
        rects[r] = []; labels[r] = [];
        for (let c = 0; c < maze.w; c++) {
          rects[r][c] = K.svg("rect", { x: c * cell + 1, y: r * cell + 1, width: cell - 2, height: cell - 2, rx: Math.min(6, cell / 6) }, svg);
          labels[r][c] = K.text(svg, c * cell + cell / 2, r * cell + cell / 2 + 1, "", "s-text");
          labels[r][c].style.fontSize = Math.max(9, cell * 0.32) + "px";
          labels[r][c].style.pointerEvents = "none";
        }
      }
      let alg = p.algorithm || "dfs";
      let search = makeSearch(maze, alg);
      let timer = 0;
      let ranTo = null;
      const allowed = ALGS.filter((a) => !p.algorithms || p.algorithms.includes(a.id));
      if (allowed.length > 1) K.segmented(host, allowed, alg, (id) => { alg = id; reset(); ctx.changed(); });
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      const stepBtn = K.button(row, "Ein Schritt", () => { stop(); search.step(); paint(); after(); });
      const playBtn = K.button(row, "Abspielen", () => (timer ? stop() : play()));
      playBtn.classList.add("on");
      K.button(row, "Zurücksetzen", () => { reset(); ctx.changed(); });
      const out = K.readout(host);

      function reset() { stop(); search = makeSearch(maze, alg); ranTo = null; paint(); }
      function stop() { if (timer) clearInterval(timer); timer = 0; playBtn.textContent = "Abspielen"; }
      function play() {
        if (search.status !== "running") reset();
        playBtn.textContent = "Pause";
        timer = setInterval(() => { search.step(); paint(); if (search.status !== "running") { stop(); after(); } }, p.speed || 140);
      }
      function after() { if (search.status === "solved") { ranTo = alg; ctx.changed(); } }

      function paint() {
        const fset = new Set(search.frontier.map((n) => n.state[0] + "," + n.state[1]));
        const pset = new Set(search.path.map((s) => s[0] + "," + s[1]));
        const cur = search.current && search.current.state;
        for (let r = 0; r < maze.h; r++) for (let c = 0; c < maze.w; c++) {
          const k = r + "," + c;
          const rect = rects[r][c];
          let fill = "var(--fill)", stroke = "none", sw = 0, op = 1;
          if (maze.walls[r][c]) { fill = "var(--label)"; op = 0.82; }
          else if (pset.has(k)) fill = "var(--green)";
          else if (cur && cur[0] === r && cur[1] === c) fill = "var(--accent)";
          else if (search.explored.has(k)) { fill = "var(--accent)"; op = 0.32; }
          if (fset.has(k)) { stroke = "var(--orange)"; sw = 3; }
          if (maze.start[0] === r && maze.start[1] === c) fill = "var(--accent)";
          if (maze.goal[0] === r && maze.goal[1] === c && !pset.has(k)) fill = "var(--green)";
          rect.setAttribute("fill", fill); rect.setAttribute("stroke", stroke); rect.setAttribute("stroke-width", sw); rect.setAttribute("opacity", op);
          let t = "";
          if (maze.start[0] === r && maze.start[1] === c) t = "A";
          else if (maze.goal[0] === r && maze.goal[1] === c) t = "B";
          else if (!maze.walls[r][c] && (alg === "gbfs" || alg === "astar") && p.showHeuristic !== false) t = String(search.hDist([r, c]));
          labels[r][c].textContent = t;
          labels[r][c].setAttribute("class", t === "A" || t === "B" ? "s-text-strong" : "s-text");
          if (t === "A" || t === "B") labels[r][c].style.fill = "white";
          else labels[r][c].style.fill = "";
        }
        const st = search.status;
        // "Erkundet" counts removals from the frontier, like num_explored in maze.py.
        let html = "Erkundet: <b>" + search.removed + "</b> &nbsp; Frontier: <b>" + search.frontier.length + "</b>";
        if (st === "solved") html += " &nbsp; " + K.pill(true, "Ziel erreicht, Pfadlänge " + search.path.length);
        if (st === "none") html += " &nbsp; " + K.pill(false, "keine Lösung");
        out.set(html);
      }
      paint();

      return {
        check(goal) {
          if (goal.run && ranTo !== goal.run) return { correct: false, detail: "Lass " + ALGS.find((a) => a.id === goal.run).label + " bis zum Ziel laufen." };
          return { correct: true };
        },
        solve(goal) {
          if (goal.run) { alg = goal.run; reset(); while (search.step() === "running"); ranTo = alg; paint(); }
        },
        act(name, arg) {
          if (name === "alg") { alg = arg; reset(); }
          if (name === "reset") reset();
          if (name === "step") { stop(); for (let i = 0; i < (arg || 1) && search.status === "running"; i++) search.step(); paint(); }
          if (name === "play") play();
          if (name === "finish") { stop(); while (search.status === "running") search.step(); paint(); }
        },
        leave() { stop(); },
        lock() { stop(); stepBtn.disabled = true; playBtn.disabled = true; },
      };
    },
  });

  // ------------------------------------------------------------ minimax with optional alpha-beta pruning

  /** Event list for stepping: leaf reads, finished nodes, cuts and pruned subtrees. */
  function minimaxEvents(tree, pruning) {
    const events = [];
    function walk(node, depth, alpha, beta, path) {
      if (typeof node === "number") { events.push({ kind: "leaf", path, value: node }); return node; }
      const maxTurn = depth % 2 === 0;
      let best = maxTurn ? -Infinity : Infinity;
      for (let i = 0; i < node.length; i++) {
        const v = walk(node[i], depth + 1, alpha, beta, path.concat(i));
        if (maxTurn) { best = Math.max(best, v); alpha = Math.max(alpha, best); }
        else { best = Math.min(best, v); beta = Math.min(beta, best); }
        if (pruning && alpha >= beta && i < node.length - 1) {
          for (let j = i + 1; j < node.length; j++) markPruned(node[j], path.concat(j));
          events.push({ kind: "cut", path });
          break;
        }
      }
      events.push({ kind: "node", path, value: best, max: maxTurn });
      return best;
    }
    function markPruned(node, path) {
      if (typeof node !== "number") node.forEach((c, i) => markPruned(c, path.concat(i)));
      events.push({ kind: "pruned", path });
    }
    walk(tree, 0, -Infinity, Infinity, []);
    return events;
  }

  function minimaxValue(node, depth) {
    if (typeof node === "number") return node;
    const vals = node.map((c) => minimaxValue(c, depth + 1));
    return depth % 2 === 0 ? Math.max(...vals) : Math.min(...vals);
  }

  LW.widget("minimax", {
    mount(host, p, ctx) {
      const tree = p.tree || [[3, 12, 8], [2, 4, 6], [14, 5, 2]];
      const W = 360;
      const depthOf = (n) => (typeof n === "number" ? 0 : 1 + Math.max(...n.map(depthOf)));
      const D = depthOf(tree);
      const H = 44 + D * 78;
      const svg = K.root(host, W, H, "Spielbaum");
      svg.style.maxWidth = "520px";
      svg.style.margin = "0 auto";
      const nodes = new Map();
      const countLeaves = (n) => (typeof n === "number" ? 1 : n.reduce((a, c) => a + countLeaves(c), 0));
      const L = countLeaves(tree);
      const span = (W - 40) / L;
      const edges = K.svg("g", null, svg);
      const layer = K.svg("g", null, svg);
      let leafCount = 0;
      function layout(n, depth, path) {
        const yy = 26 + depth * 78;
        let xx;
        if (typeof n === "number") xx = 34 + span * (leafCount++ + 0.5);
        else {
          const xs = n.map((c, i) => layout(c, depth + 1, path.concat(i)));
          xx = xs.reduce((a, b) => a + b, 0) / xs.length;
          xs.forEach((cx, i) => K.svg("line", { x1: xx, y1: yy + 14, x2: cx, y2: yy + 78 - 14, class: "s-axis", "data-edge": path.concat(i).join(".") }, edges));
        }
        const g = K.svg("g", { transform: "translate(" + xx + "," + yy + ")" }, layer);
        let shape;
        if (typeof n === "number") shape = K.svg("rect", { x: -12, y: -12, width: 24, height: 24, rx: 6, fill: "var(--fill-2)" }, g);
        else if (depth % 2 === 0) shape = K.svg("path", { d: "M0,-15 L16,12 L-16,12 Z", fill: "var(--fill-2)", stroke: "var(--accent)", "stroke-width": 2 }, g);
        else shape = K.svg("path", { d: "M0,15 L16,-12 L-16,-12 Z", fill: "var(--fill-2)", stroke: "var(--orange)", "stroke-width": 2 }, g);
        const t = K.text(g, 0, typeof n === "number" ? 1 : depth % 2 === 0 ? 4 : -3, typeof n === "number" ? String(n) : "", "s-text-strong");
        nodes.set(path.join("."), { g, shape, t, leaf: typeof n === "number", depth, path });
        return xx;
      }
      layout(tree, 0, []);
      K.text(svg, 4, 27, "MAX", "s-text", "start").style.fill = "var(--accent)";
      if (D > 1) K.text(svg, 4, 105, "MIN", "s-text", "start").style.fill = "var(--orange)";

      let pruning = !!p.pruning;
      let events = [];
      let k = 0;
      let chosen = null;
      const controls = LW.el("div");
      host.append(controls);
      if (p.allowPruning !== false) K.segmented(controls, [{ id: "plain", label: "Minimax" }, { id: "ab", label: "Alpha-Beta" }], pruning ? "ab" : "plain", (id) => { pruning = id === "ab"; reset(); ctx.changed(); });
      const row = LW.el("div", { class: "w-btns" });
      controls.append(row);
      K.button(row, "Ein Schritt", () => advance());
      const all = K.button(row, "Alles auswerten", () => { while (k < events.length) advance(true); paint(); ctx.changed(); });
      all.classList.add("on");
      K.button(row, "Zurücksetzen", () => { reset(); ctx.changed(); });
      const out = K.readout(host);

      if (p.choose) {
        nodes.forEach((n) => {
          if (n.depth !== 1) return;
          const hit = K.svg("circle", { r: 24, class: "s-hit" }, n.g);
          hit.addEventListener("click", () => { chosen = n.path[0]; paint(); ctx.changed(); });
        });
      }

      function reset() {
        events = minimaxEvents(tree, pruning);
        k = 0; chosen = null;
        nodes.forEach((n) => { if (!n.leaf) n.t.textContent = ""; n.g.style.opacity = 1; n.done = false; n.val = undefined; });
        edges.querySelectorAll("line").forEach((l) => { l.style.opacity = 1; });
        paint();
      }
      function advance(silent) {
        if (k >= events.length) return;
        const ev = events[k++];
        const n = nodes.get(ev.path.join("."));
        if (ev.kind === "leaf" || ev.kind === "node") { n.done = true; n.val = ev.value; if (!n.leaf) n.t.textContent = String(ev.value); }
        if (ev.kind === "pruned") {
          n.g.style.opacity = 0.22;
          const e = edges.querySelector('[data-edge="' + ev.path.join(".") + '"]');
          if (e) e.style.opacity = 0.2;
        }
        if (!silent) { paint(ev); if (k >= events.length) ctx.changed(); }
      }
      function paint(ev) {
        nodes.forEach((n) => {
          const on = n.done;
          if (n.leaf) n.shape.setAttribute("fill", on ? "var(--accent-soft)" : "var(--fill-2)");
          else n.shape.setAttribute("fill", on ? (n.depth % 2 === 0 ? "var(--accent-soft)" : "color-mix(in srgb, var(--orange) 22%, transparent)") : "var(--fill-2)");
          if (n.depth === 1) n.shape.setAttribute("stroke-width", chosen === n.path[0] ? 4 : 2);
        });
        let html;
        const root = nodes.get("");
        if (k >= events.length && events.length) {
          const best = tree.findIndex((c, i) => nodes.get(String(i)).val === root.val);
          const read = events.filter((e) => e.kind === "leaf").length;
          html = "<b>Wert der Wurzel: " + root.val + "</b> &nbsp; Bester Zug für MAX: " + (best + 1) + " &nbsp; gelesene Blätter: " + read + " von " + L;
        } else if (ev) {
          html = ev.kind === "leaf" ? "Blatt mit Wert <b>" + ev.value + "</b> gelesen." : ev.kind === "node" ? (ev.max ? "MAX" : "MIN") + "-Knoten fertig: Wert <b>" + ev.value + "</b>." : ev.kind === "cut" ? "Schnitt: Was hier noch kommt, kann das Ergebnis oben nicht mehr ändern (α ≥ β)." : "Ausgelassen.";
        } else html = "Tippe auf »Ein Schritt« oder »Alles auswerten«.";
        if (p.choose && chosen != null) html += " &nbsp; Deine Wahl: Zug " + (chosen + 1);
        out.set(html);
      }
      reset();
      return {
        check() {
          if (p.choose) {
            if (chosen == null) return { correct: false, detail: "Tippe auf einen der MIN-Knoten, um den Zug von MAX zu wählen." };
            const vals = tree.map((c) => minimaxValue(c, 1));
            const best = vals.indexOf(Math.max(...vals));
            return chosen === best ? { correct: true } : { correct: false, detail: "Zug " + (chosen + 1) + " garantiert MAX nur den Wert " + vals[chosen] + ", weil MIN darauf mit dem kleinsten Wert antwortet." };
          }
          return { correct: k >= events.length, detail: "Werte den Baum vollständig aus." };
        },
        solve() {
          if (p.choose) { const vals = tree.map((c) => minimaxValue(c, 1)); chosen = vals.indexOf(Math.max(...vals)); }
          while (k < events.length) advance(true);
          paint();
        },
        act(name, arg) {
          if (name === "reset") reset();
          if (name === "step") { for (let i = 0; i < (arg || 1) && k < events.length; i++) advance(true); paint(); }
          if (name === "all") { while (k < events.length) advance(true); paint(); }
        },
      };
    },
  });

  LW.cs50 = { parseMaze, makeSearch, minimaxEvents, minimaxValue };
})();
