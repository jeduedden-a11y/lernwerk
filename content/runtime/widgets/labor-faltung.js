/* Folding lab, the HP model of protein folding.
 *   faltung: a chain of hydrophobic (H) and polar (P) residues on a square lattice (2D) or a cube lattice (3D); C marks a
 *            cysteine. Tap a residue, then turn or mirror the shorter part of the chain about it. Two H that touch on the lattice
 *            without being neighbours in the chain form a contact; every contact lowers the energy by one. The chain
 *            never passes through itself.
 *     params: seq ("HPPHHPH…"), dims (2 or 3), start (a move string such as "RRUL…", default straight), task
 *     task:   {conditions: [{c, show}], sample: "moves"}; c is "kontakte 5" (at least five H-H contacts),
 *             "nachbarn 3,10" (residues 3 and 10 touch, counted from 1), "box 3,3,2" (fits into such a box).
 *   Moves: R L U D F B for +x -x +y -y +z -z, one letter per bond.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const DIR = { R: [1, 0, 0], L: [-1, 0, 0], U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1] };
  const COL = { H: "#f0973a", P: "#4a8fdc", C: "#e2bd22" };
  const NAME = { H: "hydrophob", P: "polar", C: "Cystein" };

  function fromMoves(moves, n) {
    const pos = [[0, 0, 0]];
    for (let k = 0; k < n - 1; k++) {
      const d = DIR[(moves || "")[k]] || DIR.R, q = pos[k];
      pos.push([q[0] + d[0], q[1] + d[1], q[2] + d[2]]);
    }
    return pos;
  }
  const keyOf = (q) => q[0] + "," + q[1] + "," + q[2];
  const touch = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) === 1;
  function contacts(seq, pos) {
    const out = [];
    for (let i = 0; i < pos.length; i++) for (let j = i + 2; j < pos.length; j++) {
      if (seq[i] === "H" && seq[j] === "H" && touch(pos[i], pos[j])) out.push([i, j]);
    }
    return out;
  }
  function bbox(pos) {
    const lo = [0, 1, 2].map((a) => Math.min(...pos.map((q) => q[a]))), hi = [0, 1, 2].map((a) => Math.max(...pos.map((q) => q[a])));
    return hi.map((h, a) => h - lo[a] + 1);
  }
  /** Quarter turn of point q about an axis (0 x, 1 y, 2 z) through c, sign +1 or -1. */
  function turn(q, c, axis, sg) {
    const v = [q[0] - c[0], q[1] - c[1], q[2] - c[2]];
    let r;
    if (axis === 0) r = [v[0], -sg * v[2], sg * v[1]];
    else if (axis === 1) r = [sg * v[2], v[1], -sg * v[0]];
    else r = [-sg * v[1], sg * v[0], v[2]];
    return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
  }

  LW.widget("faltung", {
    mount(host, p, ctx) {
      const seq = String(p.seq || "HPHPPHHPHPPHPHHPPHPH").toUpperCase().replace(/[^HPC]/g, "");
      const n = seq.length, two = p.dims === 2, task = p.task || null;
      let pos = fromMoves(p.start, n), sel = -1;
      const undo = [];
      const center = () => { const c = [0, 1, 2].map((a) => pos.reduce((s, q) => s + q[a], 0) / n); return c; };

      // controls
      const bar = LW.el("div", { class: "w-btns" });
      host.append(bar);
      const btn = (t, f, aria) => { const b = K.button(bar, t, f); if (aria) b.setAttribute("aria-label", aria); return b; };
      if (two) {
        btn("↺ 90°", () => pivot(2, 1), "Teilkette um 90 Grad gegen den Uhrzeigersinn drehen");
        btn("↻ 90°", () => pivot(2, -1), "Teilkette um 90 Grad im Uhrzeigersinn drehen");
        btn("180°", () => pivot(2, 2), "Teilkette um 180 Grad drehen");
        btn("Spiegeln ↔", () => pivot(0, 0, true), "Teilkette waagerecht spiegeln");
        btn("Spiegeln ↕", () => pivot(1, 0, true), "Teilkette senkrecht spiegeln");
      } else {
        btn("Drehen x", () => pivot(0, 1), "Teilkette um die x-Achse drehen");
        btn("Drehen y", () => pivot(1, 1), "Teilkette um die y-Achse drehen");
        btn("Drehen z", () => pivot(2, 1), "Teilkette um die z-Achse drehen");
        btn("Spiegeln x", () => pivot(0, 0, true), "Teilkette an der Ebene senkrecht zu x spiegeln");
        btn("Spiegeln y", () => pivot(1, 0, true), "Teilkette an der Ebene senkrecht zu y spiegeln");
        btn("Spiegeln z", () => pivot(2, 0, true), "Teilkette an der Ebene senkrecht zu z spiegeln");
      }
      const bar2 = LW.el("div", { class: "w-btns" });
      host.append(bar2);
      K.button(bar2, "Rückgängig", () => { if (undo.length) { pos = undo.pop(); changed(); } });
      K.button(bar2, "Strecken", () => { undo.push(pos.map((q) => q.slice())); pos = fromMoves("", n); sel = -1; changed(); });
      const msg = LW.el("div", { class: "lw-lab-tex lw-mol-hint", "aria-live": "polite", text: "Tippe einen Rest an und drehe dann den kürzeren Teil der Kette um ihn." });
      host.append(msg);
      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Gefaltete Kette");
      svg.style.maxWidth = "560px";
      svg.style.margin = "0 auto";
      const defs = K.svg("defs", null, svg);
      const gid = "lwfold" + Math.random().toString(36).slice(2, 8);
      Object.keys(COL).forEach((k) => {
        const g = K.svg("radialGradient", { id: gid + k, cx: "35%", cy: "32%", r: "70%" }, defs);
        K.svg("stop", { offset: "0%", "stop-color": "#fff", "stop-opacity": "0.85" }, g);
        K.svg("stop", { offset: "30%", "stop-color": COL[k] }, g);
        K.svg("stop", { offset: "100%", "stop-color": COL[k], "stop-opacity": "0.75" }, g);
      });
      const scene = K.svg("g", null, svg);
      const view = LW.lab.view3d(svg, { width: W, height: H, az: two ? 0 : 28, el: two ? 0 : 22, scale: 34, dist: 20, paint: () => paint(), onTap });
      const out = K.readout(host);
      const goals = task ? LW.lab.goals(host, task.conditions || [], (c) => [].concat(c).every(holds)) : null;

      function say(t, err) { msg.textContent = t; msg.classList.toggle("err", !!err); msg.classList.toggle("lw-mol-hint", !err); }
      function onTap(target) {
        const i = target && target.dataset ? target.dataset.res : null;
        if (i == null) return;
        sel = +i === sel ? -1 : +i;
        say(sel < 0 ? "Tippe einen Rest an." : "Rest " + (sel + 1) + " (" + NAME[seq[sel]] + ") gewählt: Jetzt drehen.");
        paint();
      }
      function pivot(axis, sg, mirror) {
        if (sel < 0) { say("Wähle zuerst einen Rest, um den gedreht wird.", true); return; }
        if (sel === 0 || sel === n - 1) { say("Um ein Kettenende lässt sich nichts drehen. Wähle einen Rest weiter innen.", true); return; }
        // the shorter part turns, the longer part stays
        const tail = sel >= (n - 1) / 2;
        const idx = [];
        for (let k = 0; k < n; k++) if (tail ? k > sel : k < sel) idx.push(k);
        const c = pos[sel];
        const next = pos.map((q) => q.slice());
        idx.forEach((k) => {
          let q = next[k];
          if (mirror) { q = q.slice(); q[axis] = 2 * c[axis] - q[axis]; }
          else { const times = sg === 2 ? 2 : 1; for (let t = 0; t < times; t++) q = turn(q, c, axis, sg === 2 ? 1 : sg); }
          next[k] = q;
        });
        const seen = new Set(next.map(keyOf));
        if (seen.size < n) { say("So würde die Kette sich selbst durchdringen. Versuche eine andere Drehung oder einen anderen Rest.", true); return; }
        undo.push(pos);
        if (undo.length > 60) undo.shift();
        pos = next;
        say((mirror ? "Gespiegelt" : "Gedreht") + " um Rest " + (sel + 1) + ".");
        changed();
      }
      function holds(c) {
        const s = String(c).trim();
        let m;
        if ((m = /^kontakte\s+(\d+)$/.exec(s))) return contacts(seq, pos).length >= +m[1];
        if ((m = /^nachbarn\s+(\d+),(\d+)$/.exec(s))) return touch(pos[+m[1] - 1], pos[+m[2] - 1]);
        if ((m = /^box\s+(\d+),(\d+)(?:,(\d+))?$/.exec(s))) {
          const b = bbox(pos).sort((x, y) => y - x), want = [+m[1], +m[2], m[3] ? +m[3] : 1].sort((x, y) => y - x);
          return b.every((v, k) => v <= want[k]);
        }
        return false;
      }
      function paint() {
        K.clear(scene);
        const c = center();
        const P = pos.map((q) => view.project([q[0] - c[0], q[1] - c[1], q[2] - c[2]]));
        const items = [];
        for (let k = 0; k + 1 < n; k++) {
          const a = P[k], b = P[k + 1];
          items.push({ d: (a.d + b.d) / 2 - 0.01, draw: () => K.svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "var(--label-3)", "stroke-width": Math.max(3, 0.18 * (a.k + b.k) / 2), "stroke-linecap": "round" }, scene) });
        }
        contacts(seq, pos).forEach(([i, j]) => {
          const a = P[i], b = P[j];
          items.push({ d: (a.d + b.d) / 2 - 0.005, draw: () => K.svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "var(--green)", "stroke-width": 2.4, "stroke-dasharray": "4 4" }, scene) });
        });
        pos.forEach((q, k) => {
          const r = Math.max(5, 0.3 * P[k].k);
          items.push({ d: P[k].d, draw: () => {
            const circ = K.svg("circle", { cx: P[k].x, cy: P[k].y, r, fill: "url(#" + gid + seq[k] + ")", stroke: k === sel ? "var(--accent)" : "rgba(0,0,0,0.35)", "stroke-width": k === sel ? 3.5 : 0.7 }, scene);
            circ.dataset.res = k;
            if (r > 9) { const t = K.text(scene, P[k].x, P[k].y + 0.5, String(k + 1), "lw-mol-label"); t.dataset.res = k; }
          } });
        });
        items.sort((a, b) => a.d - b.d).forEach((it) => it.draw());
      }
      function changed(silent) {
        const cs = contacts(seq, pos);
        const span = Math.max(2, ...bbox(pos));
        view.fit(span * 0.75 + 0.5);
        const cys = [];
        for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (seq[i] === "C" && seq[j] === "C" && touch(pos[i], pos[j])) cys.push(i + 1 + "–" + (j + 1));
        out.set(LW.esc(cs.length + " H-H-Kontakt" + (cs.length === 1 ? "" : "e") + " · Energie E = " + (cs.length ? "−" + cs.length : "0") + (cys.length ? " · Disulfidbrücke " + cys.join(", ") : "")) +
          "<br>" + LW.esc("Kette: " + seq + " (" + n + " Reste, " + seq.split("").filter((x) => x === "H").length + " hydrophob)"));
        paint();
        if (goals) goals.paint();
        if (!silent) ctx.changed();
      }
      changed(true);
      return {
        check() { return goals ? goals.result() : { correct: true }; },
        solve() { if (task && task.sample) { pos = fromMoves(task.sample, n); sel = -1; changed(true); } },
        getVar(name) { return name === "kontakte" ? contacts(seq, pos).length : undefined; },
      };
    },
  });

  LW.labFold = { fromMoves, contacts, bbox, touch };
})();
