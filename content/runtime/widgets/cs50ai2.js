/* CS50 AI widgets, part 2: knowledge (model checking), uncertainty (Bayesian network, Markov chain and HMM),
 * optimization (state-space landscape, constraint graph), learning (classifier, Q-learning grid world),
 * neural networks (a single neuron) and language (word vectors, attention, n-grams).
 * Every widget offers check/solve for tasks and getVar/setVar/act for animations. */
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
  const pc = (x) => K.fmt(100 * x, 1) + " %";
  const PAL = ["var(--accent)", "var(--orange)", "var(--green)", "var(--teal)", "var(--red)"];

  /** Part of a polygon where a + b x + c y >= 0 (Sutherland-Hodgman for one half-plane). */
  function clipHalf(poly, a, b, c) {
    const f = (q) => a + b * q[0] + c * q[1];
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
      if (fp >= 0) out.push(P);
      if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    }
    return out;
  }
  function arrowHead(g, x2, y2, fx, fy, color, size) {
    const dx = x2 - fx, dy = y2 - fy, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, s = size || 8;
    K.svg("path", { d: "M" + x2 + "," + y2 + " L" + (x2 - ux * s - uy * s * 0.55) + "," + (y2 - uy * s + ux * s * 0.55) + " L" + (x2 - ux * s + uy * s * 0.55) + "," + (y2 - uy * s - ux * s * 0.55) + " Z", fill: color }, g);
  }

  // ------------------------------------------------------------------ model checking (Lecture 1)

  /* params: symbols [id | {id, label}], kb [{expr, label}], query {expr, label}, k (rows shown), select (learner marks KB models)
   * scope:  k, models (rows where the KB holds), total, entails, selOk, count */
  LW.widget("model-check", {
    mount(host, p, ctx) {
      const be = LW.analysis.boolExpr;
      const syms = (p.symbols || ["P", "Q"]).map((s) => (typeof s === "string" ? { id: s, label: s } : s));
      const kb = (p.kb || []).map((s) => Object.assign({ fn: be(s.expr) }, s));
      const query = p.query ? Object.assign({ fn: be(p.query.expr) }, p.query) : null;
      const n = syms.length;
      const rows = [];
      for (let m = 0; m < 1 << n; m++) {
        const v = {};
        syms.forEach((s, i) => { v[s.id] = !((m >> (n - 1 - i)) & 1); });
        const parts = kb.map((s) => !!s.fn(v));
        rows.push({ v, parts, kb: parts.every(Boolean), q: query ? !!query.fn(v) : null });
      }
      let k = p.k != null ? p.k : rows.length;
      const sel = new Set();
      let locked = false, revealed = !p.select;
      const table = LW.el("table");
      host.append(LW.el("div", { class: "lw-md lw-mc" }, [table]));
      const showParts = p.parts !== false;
      const heads = syms.map((s) => s.label).concat(showParts ? kb.map((s) => s.label || s.expr) : []);
      if (kb.length > 1) heads.push("\\text{KB}");
      if (query) heads.push(query.label || query.expr);
      table.append(LW.el("thead", null, [LW.el("tr", null, heads.map((h) => LW.el("th", { html: LW.math(h) })))]));
      const tbody = LW.el("tbody");
      table.append(tbody);
      const trs = rows.map((r, i) => {
        const tr = LW.el("tr");
        tr.addEventListener("click", () => { if (!p.select || locked) return; if (sel.has(i)) sel.delete(i); else sel.add(i); paint(); ctx.changed(); });
        tbody.append(tr);
        return tr;
      });
      const out = K.readout(host);
      const WF = (b) => (b ? "w" : "f");
      function scope() {
        const kbRows = rows.filter((r) => r.kb);
        return { k, models: kbRows.length, total: rows.length, entails: query && kbRows.length && kbRows.every((r) => r.q) ? 1 : 0, selOk: rows.every((r, i) => sel.has(i) === r.kb) ? 1 : 0, count: sel.size };
      }
      function paint() {
        rows.forEach((r, i) => {
          const tr = trs[i];
          tr.innerHTML = "";
          const show = i < k && revealed;
          syms.forEach((s) => tr.append(LW.el("td", { text: WF(r.v[s.id]) })));
          if (showParts) kb.forEach((s, j) => tr.append(LW.el("td", { text: show ? WF(r.parts[j]) : "?" })));
          if (kb.length > 1) tr.append(LW.el("td", { class: "mc-kb", text: show ? WF(r.kb) : "?" }));
          if (query) tr.append(LW.el("td", { class: "mc-kb", text: show ? WF(r.q) : "?" }));
          let cls = "";
          if (show && r.kb) cls = query && !r.q ? "mc-bad" : "mc-good";
          if (p.select && sel.has(i)) cls += " mc-sel";
          if (p.select && !locked) cls += " mc-tap";
          tr.className = cls.trim();
        });
        const sc = scope();
        if (!revealed) out.set(sel.size ? "Markiert: <b>" + sel.size + "</b> " + (sel.size === 1 ? "Modell" : "Modelle") + "." : "Tippe die Zeilen an, in denen alle Sätze der Wissensbasis wahr sind.");
        else if (k < rows.length) out.set("Geprüft: <b>" + k + "</b> von " + rows.length + " Modellen. Die Wissensbasis ist bisher in " + rows.slice(0, k).filter((r) => r.kb).length + " davon wahr.");
        else out.set("Die Wissensbasis ist in <b>" + sc.models + "</b> von " + rows.length + " Modellen wahr (grün)." + (query ? (sc.entails ? " In allen davon gilt auch die Anfrage: " + K.pill(true, "KB ⊨ Anfrage") : " In mindestens einem davon ist die Anfrage falsch (rot): " + K.pill(false, "KB ⊭ Anfrage")) : ""));
        return sc;
      }
      paint();
      return {
        check(goal) {
          if (p.select) {
            const missing = rows.filter((r, i) => r.kb && !sel.has(i)).length, extra = rows.filter((r, i) => !r.kb && sel.has(i)).length;
            if (!missing && !extra) return { correct: true };
            return { correct: false, detail: (extra ? extra + (extra === 1 ? " markierte Zeile macht" : " markierte Zeilen machen") + " einen Satz falsch. " : "") + (missing ? "Es fehlen " + missing + "." : "") };
          }
          return checkGoal(goal, paint());
        },
        solve() { if (p.select) { sel.clear(); rows.forEach((r, i) => { if (r.kb) sel.add(i); }); revealed = true; } k = rows.length; paint(); },
        getVar: (name) => (name === "k" ? k : NaN),
        setVar(name, v) { if (name === "k") { k = K.clamp(Math.round(v), 0, rows.length); paint(); } },
        act(name) { if (name === "reset") { k = 0; paint(); } if (name === "all") { k = rows.length; paint(); } },
        lock() { locked = true; revealed = true; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ Bayesian network (Lecture 2)

  const BN = [
    { id: "R", name: "Regen", values: ["kein", "leicht", "stark"], parents: [], cpt: [[0.7, 0.2, 0.1]], x: 72, y: 40 },
    { id: "M", name: "Wartung", values: ["ja", "nein"], parents: ["R"], cpt: [[0.4, 0.6], [0.2, 0.8], [0.1, 0.9]], x: 288, y: 40 },
    { id: "T", name: "Zug", values: ["pünktlich", "verspätet"], parents: ["R", "M"], cpt: [[0.8, 0.2], [0.9, 0.1], [0.6, 0.4], [0.7, 0.3], [0.4, 0.6], [0.5, 0.5]], x: 180, y: 116 },
    { id: "A", name: "Termin", values: ["wahrgenommen", "verpasst"], parents: ["T"], cpt: [[0.9, 0.1], [0.6, 0.4]], x: 180, y: 192 },
  ];

  /* params: mode "joint" (tap nodes to choose values, product of the factors) | "infer" (posterior of query given evidence),
   *         assign {R: "leicht", ...}, evidence {T: "verspätet"}, query "A", vars (own network, same format as BN)
   * scope:  joint: p and every variable id (index of its value); infer: post0, post1, …, est0, …, samples, accepted */
  LW.widget("bayesnet", {
    mount(host, p, ctx) {
      const vars = p.vars || BN;
      const byId = {};
      vars.forEach((v) => (byId[v.id] = v));
      const idx = (v, val) => (typeof val === "number" ? val : v.values.indexOf(val));
      const rowOf = (v, a) => v.parents.reduce((acc, pid) => acc * byId[pid].values.length + a[pid], 0);
      const pr = (v, a) => v.cpt[rowOf(v, a)][a[v.id]];
      const joint = (a) => vars.reduce((acc, v) => acc * pr(v, a), 1);
      const mode = p.mode || "joint";
      const assign = {};
      vars.forEach((v) => (assign[v.id] = 0));
      const setAssign = (obj) => Object.keys(obj || {}).forEach((key) => { if (byId[key]) assign[key] = Math.max(0, idx(byId[key], obj[key])); });
      setAssign(p.assign);
      let evidence = {};
      const setEvidence = (obj) => { evidence = {}; Object.keys(obj || {}).forEach((key) => { if (byId[key]) evidence[key] = Math.max(0, idx(byId[key], obj[key])); }); };
      setEvidence(p.evidence);
      const qv = p.query ? byId[p.query] : null;
      let samples = 0, accepted = 0, counts = qv ? qv.values.map(() => 0) : [];
      const rng = LW.rng(LW.hash(ctx.seed + "|bn"));
      let locked = false;
      function enumerate() {
        const post = qv.values.map(() => 0);
        const rec = (i, a) => {
          if (i === vars.length) { post[a[qv.id]] += joint(a); return; }
          const v = vars[i];
          const opts = v.id in evidence ? [evidence[v.id]] : v.values.map((_, j) => j);
          opts.forEach((j) => rec(i + 1, Object.assign({}, a, { [v.id]: j })));
        };
        rec(0, {});
        const s = post.reduce((x, y) => x + y, 0) || 1;
        return post.map((x) => x / s);
      }
      function sample(nS) {
        for (let i = 0; i < nS; i++) {
          const a = {};
          vars.forEach((v) => { const dist = v.cpt[rowOf(v, a)]; let u = rng(), j = 0; while (j < dist.length - 1 && u >= dist[j]) { u -= dist[j]; j++; } a[v.id] = j; });
          samples++;
          if (Object.keys(evidence).every((key) => a[key] === evidence[key])) { accepted++; counts[a[qv.id]]++; }
        }
      }
      const W = 360, H = mode === "infer" ? 232 + 26 * (qv ? qv.values.length : 0) : 220;
      const svg = K.root(host, W, H, "Bayessches Netz");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const BW = 116, BH = 42;
      const exitT = (ux, uy) => Math.min(Math.abs(ux) > 1e-9 ? BW / 2 / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-9 ? BH / 2 / Math.abs(uy) : 1e9);
      if (mode === "infer") {
        const row = LW.el("div", { class: "w-btns" });
        host.append(row);
        K.button(row, "100 Stichproben", () => { sample(100); paint(); ctx.changed(); });
        K.button(row, "1000 Stichproben", () => { sample(1000); paint(); ctx.changed(); });
        K.button(row, "Zurücksetzen", () => { samples = accepted = 0; counts = qv.values.map(() => 0); paint(); ctx.changed(); });
      }
      const out = K.readout(host);
      function scope() {
        const sc = {};
        if (mode === "joint") { vars.forEach((v) => (sc[v.id] = assign[v.id])); sc.p = joint(assign); }
        else if (qv) { enumerate().forEach((x, i) => (sc["post" + i] = x)); counts.forEach((c, i) => (sc["est" + i] = accepted ? c / accepted : NaN)); sc.samples = samples; sc.accepted = accepted; }
        return sc;
      }
      function paint() {
        K.clear(g);
        vars.forEach((v) => v.parents.forEach((pid) => {
          const a = byId[pid], dx = v.x - a.x, dy = v.y - a.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, t = exitT(ux, uy);
          const ar = K.arrow(g, a.x + ux * t, a.y + uy * t, v.x - ux * (t + 3), v.y - uy * (t + 3), "", 2);
          ar.style.stroke = "var(--label-3)"; ar.style.fill = "var(--label-3)";
        }));
        vars.forEach((v) => {
          const isEv = mode === "infer" && v.id in evidence, isQ = mode === "infer" && qv && v.id === qv.id;
          const box = K.svg("rect", { x: v.x - BW / 2, y: v.y - BH / 2, width: BW, height: BH, rx: 12, fill: isEv ? "var(--accent-soft)" : "var(--card-solid)", stroke: isQ ? "var(--orange)" : isEv ? "var(--accent)" : "var(--label-3)", "stroke-width": isQ || isEv ? 2.4 : 1.4 }, g);
          K.text(g, v.x, v.y - 8, v.name, "s-text-strong");
          const val = mode === "joint" ? v.values[assign[v.id]] : isEv ? "= " + v.values[evidence[v.id]] : isQ ? "gesucht" : "unbekannt";
          const tv = K.text(g, v.x, v.y + 10, val, "s-text");
          if (mode === "joint") {
            tv.style.fill = "var(--accent)"; tv.style.fontWeight = 650;
            K.text(g, v.x + BW / 2 - 4, v.y - BH / 2 - 8, "Faktor " + K.fmt(pr(v, assign), 2), "s-text", "end");
            box.style.cursor = locked ? "default" : "pointer";
            box.addEventListener("click", () => { if (locked) return; assign[v.id] = (assign[v.id] + 1) % v.values.length; paint(); ctx.changed(); });
          }
        });
        const sc = scope();
        if (mode === "joint") {
          const facts = vars.map((v) => K.fmt(pr(v, assign), 2));
          out.set("P(" + vars.map((v) => v.name + " = " + v.values[assign[v.id]]).join(", ") + ")<br>= " + facts.join(" · ") + " = <b>" + K.fmt(sc.p, 4) + "</b>" + (p.hint !== false ? "<br>Tippe auf einen Knoten, um seinen Wert zu ändern." : ""));
        } else if (qv) {
          const post = enumerate(), y0 = 232;
          K.text(g, 10, y0 - 10, "P(" + qv.name + " | Evidenz)", "s-text-strong", "start");
          qv.values.forEach((name, i) => {
            const yy = y0 + i * 26, bw = 200;
            K.text(g, 10, yy + 9, name, "s-text", "start");
            K.svg("rect", { x: 120, y: yy, width: bw, height: 18, rx: 5, fill: "var(--fill)" }, g);
            K.svg("rect", { x: 120, y: yy, width: bw * post[i], height: 18, rx: 5, fill: "var(--accent)" }, g);
            K.text(g, 326, yy + 9, pc(post[i]), "s-text-strong", "start");
            if (accepted) { const ex = 120 + bw * (counts[i] / accepted); K.svg("line", { x1: ex, y1: yy - 3, x2: ex, y2: yy + 21, stroke: "var(--orange)", "stroke-width": 3 }, g); }
          });
          const ev = Object.keys(evidence).map((key) => byId[key].name + " = " + byId[key].values[evidence[key]]).join(", ");
          out.set("Exakt durch Aufzählung aller passenden Welten (blau)" + (ev ? ", gegeben " + ev : "") + "." + (samples ? "<br>Stichproben: " + samples + " gezogen, " + accepted + " passen zur Evidenz. Schätzung (orange): " + qv.values.map((name, i) => name + " " + pc(counts[i] / (accepted || 1))).join(", ") + "." : ""));
        }
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s && s.assign) setAssign(s.assign); if (s && s.samples) sample(s.samples); paint(); },
        act(name, arg) {
          if (name === "assign") setAssign(arg);
          if (name === "evidence") setEvidence(arg);
          if (name === "sample") sample(arg || 100);
          if (name === "reset") { samples = accepted = 0; counts = qv ? qv.values.map(() => 0) : []; }
          paint();
        },
        lock() { locked = true; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ Markov chain and hidden Markov model (Lecture 2)

  /* params: states [2 names], T (2x2 transition matrix), start, n (days shown), nMax, mode "chain" | "hmm",
   *         E (P(observation | state)), obs (observation indices), obsNames, prior, reveal (show hidden states in hmm mode)
   * scope:  n, p0, p1 (chain: exact distribution on day n), stat (long-run share of state 0), b1 (hmm: filtered P(state 1)) */
  LW.widget("markov", {
    mount(host, p, ctx) {
      const names = p.states || ["Sonne", "Regen"];
      const T = p.T || [[0.8, 0.2], [0.3, 0.7]];
      const hmm = p.mode === "hmm";
      const E = p.E || [[0.2, 0.8], [0.9, 0.1]];
      const oNames = p.obsNames || ["Schirm", "kein Schirm"];
      const obs = p.obs || [0, 0, 1, 0, 0];
      const prior = p.prior || [0.5, 0.5];
      const nMax = hmm ? obs.length : p.nMax || 10;
      let n = K.clamp(p.n != null ? p.n : 1, 0, nMax);
      const start = p.start || 0;
      const rng = LW.rng(LW.hash(ctx.seed + "|markov"));
      const seq = [start];
      for (let i = 1; i < nMax; i++) seq.push(rng() < T[seq[i - 1]][0] ? 0 : 1);
      const step = (d) => [d[0] * T[0][0] + d[1] * T[1][0], d[0] * T[0][1] + d[1] * T[1][1]];
      const dist = [start === 0 ? [1, 0] : [0, 1]];
      for (let i = 1; i < nMax; i++) dist.push(step(dist[i - 1]));
      const bel = [];
      obs.forEach((o, i) => {
        const pri = i === 0 ? prior : step(bel[i - 1]);
        const u = [pri[0] * E[0][o], pri[1] * E[1][o]], s = u[0] + u[1];
        bel.push([u[0] / s, u[1] / s]);
      });
      const stat = T[1][0] / (T[0][1] + T[1][0]);
      const COL = ["var(--orange)", "var(--blue)"];
      const W = 360, H = 236;
      const svg = K.root(host, W, H, hmm ? "Hidden-Markov-Modell" : "Markov-Kette");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      // state diagram
      const S0 = [118, 64], S1 = [242, 64], R0 = 27;
      const lab = (x, y, t) => { const e = K.text(svg, x, y, t, "s-text-strong"); e.style.fontSize = "12px"; return e; };
      const curve = (d, ex, ey, fx, fy, txt, tx, ty) => {
        K.svg("path", { d, fill: "none", stroke: "var(--label-2)", "stroke-width": 1.8 }, svg);
        arrowHead(svg, ex, ey, fx, fy, "var(--label-2)", 8);
        lab(tx, ty, txt);
      };
      curve("M140,46 Q180,14 220,46", 220, 46, 196, 24, K.fmt(T[0][1], 2), 180, 18);
      curve("M220,82 Q180,114 140,82", 140, 82, 164, 104, K.fmt(T[1][0], 2), 180, 112);
      curve("M95,50 C58,26 58,102 95,78", 95, 78, 70, 92, K.fmt(T[0][0], 2), 46, 64);
      curve("M265,50 C302,26 302,102 265,78", 265, 78, 290, 92, K.fmt(T[1][1], 2), 314, 64);
      [S0, S1].forEach((c, i) => {
        K.svg("circle", { cx: c[0], cy: c[1], r: R0, fill: COL[i] }, svg);
        const t = K.text(svg, c[0], c[1], names[i], "s-text-strong");
        t.style.fill = "white"; t.style.fontSize = "11px";
      });
      const g = K.svg("g", null, svg);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Nächster Tag", () => { if (n < nMax) { n++; paint(); ctx.changed(); } });
      K.button(row, "Zurücksetzen", () => { n = hmm ? 1 : 1; paint(); ctx.changed(); });
      const out = K.readout(host);
      function scope() {
        const d = dist[Math.max(0, n - 1)], b = bel[Math.max(0, n - 1)] || [NaN, NaN];
        return { n, p0: d[0], p1: d[1], stat, b1: b[1], b0: b[0] };
      }
      function paint() {
        K.clear(g);
        const cw = Math.min(46, (W - 20) / nMax), y0 = 150;
        for (let i = 0; i < n; i++) {
          const cx = 10 + cw * (i + 0.5);
          if (!hmm) {
            K.svg("circle", { cx, cy: y0, r: Math.min(14, cw / 2 - 2), fill: COL[seq[i]] }, g);
            const t = K.text(g, cx, y0, names[seq[i]][0], "s-text-strong"); t.style.fill = "white"; t.style.fontSize = "11px";
          } else {
            const o = K.text(g, cx, y0 - 6, obs[i] === 0 ? "Schirm" : "ohne", "s-text-strong"); o.style.fontSize = "10px";
            if (p.reveal) { K.svg("circle", { cx, cy: y0 + 12, r: 5, fill: COL[seq[i]] }, g); }
          }
          const val = hmm ? bel[i][1] : dist[i][0];
          const bh = 44 * val;
          K.svg("rect", { x: cx - Math.min(10, cw / 2 - 4), y: 218 - bh, width: Math.min(20, cw - 8), height: bh, rx: 3, fill: hmm ? COL[1] : COL[0], opacity: 0.85 }, g);
          const vt = K.text(g, cx, 228, K.fmt(100 * val, 0), "s-text"); vt.style.fontSize = "9px";
        }
        K.text(g, 10, 176, hmm ? "P(" + names[1] + " | Beobachtungen) in %" : "P(" + names[0] + ") in %, wenn man nur Tag 1 kennt", "s-text", "start").style.fontSize = "10px";
        const sc = scope();
        if (!hmm) out.set(n ? "Tag " + n + ": simuliert " + names[seq[n - 1]] + ". Die Wahrscheinlichkeit für " + names[0] + " an Tag " + n + " ist <b>" + pc(sc.p0) + "</b>, langfristig " + pc(stat) + "." : "Tippe auf »Nächster Tag«.");
        else out.set(n ? "Beobachtet bis Tag " + n + ": " + obs.slice(0, n).map((o) => oNames[o]).join(", ") + ". Gefilterte Wahrscheinlichkeit für " + names[1] + " an Tag " + n + ": <b>" + pc(sc.b1) + "</b>." : "Tippe auf »Nächster Tag«.");
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s && s.n != null) { n = K.clamp(s.n, 0, nMax); paint(); } },
        getVar: (name) => (name === "n" ? n : NaN),
        setVar(name, v) { if (name === "n") { n = K.clamp(Math.round(v), 0, nMax); paint(); } },
        act(name) { if (name === "step" && n < nMax) n++; if (name === "reset") n = 1; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ state-space landscape: hill climbing, restarts, annealing (Lecture 3)

  /* params: values (objective per state), start, restart (button), anneal (button and temperature slider), T0, steps
   * scope:  x (index of the current state), value, local (1 at a local maximum), global (1 at the global maximum), steps, restarts */
  LW.widget("landscape", {
    mount(host, p, ctx) {
      const vals = p.values || [4, 5, 7, 6, 4, 3, 5, 8, 10, 9, 7, 6, 8, 11, 14, 13, 10, 7, 5, 6, 9, 8, 5, 3];
      const N = vals.length, vmax = Math.max(...vals), gIdx = vals.indexOf(vmax);
      let x = K.clamp(p.start != null ? p.start : 1, 0, N - 1);
      let steps = 0, restarts = 0, trail = [], T0 = p.T0 || 3, locked = false;
      const rng = LW.rng(LW.hash(ctx.seed + "|land"));
      const isLocal = (i) => [i - 1, i + 1].every((j) => j < 0 || j >= N || vals[j] <= vals[i]);
      function climbStep() {
        let b = x;
        [x - 1, x + 1].forEach((j) => { if (j >= 0 && j < N && vals[j] > vals[b]) b = j; });
        if (b === x) return false;
        x = b; steps++;
        return true;
      }
      function climbAll() { let guard = 0; while (climbStep() && guard++ < N); }
      function restart() { x = Math.floor(rng() * N); restarts++; trail = []; climbAll(); }
      function anneal(nS) {
        trail = [x];
        for (let t = 0; t < nS; t++) {
          const temp = T0 * (1 - t / nS) + 1e-6;
          const j = x + (rng() < 0.5 ? -1 : 1);
          if (j < 0 || j >= N) continue;
          const dE = vals[j] - vals[x];
          if (dE > 0 || rng() < Math.exp(dE / temp)) x = j;
          trail.push(x);
        }
        climbAll();
      }
      const W = 360, H = 190;
      const svg = K.root(host, W, H, "Zustandsraum");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const bw = (W - 20) / N, base = H - 24, sy = (base - 30) / vmax;
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Schritt bergauf", () => { if (locked) return; climbStep(); trail = []; paint(); ctx.changed(); });
      if (p.restart !== false) K.button(row, "Neustart", () => { if (locked) return; restart(); paint(); ctx.changed(); });
      let sT = null;
      if (p.anneal) {
        K.button(row, "Abkühlen", () => { if (locked) return; anneal(p.steps || 120); paint(); ctx.changed(); });
        sT = K.slider(host, { labelHtml: "Starttemperatur", min: 0, max: 6, step: 0.5, value: T0, format: (t) => K.fmt(t, 1), onInput: (t) => { T0 = t; } });
      }
      const out = K.readout(host);
      function scope() { return { x, value: vals[x], local: isLocal(x) ? 1 : 0, global: vals[x] === vmax ? 1 : 0, steps, restarts }; }
      function paint() {
        K.clear(g);
        const visits = new Set(trail);
        vals.forEach((v, i) => {
          const isCur = i === x, isNb = Math.abs(i - x) === 1;
          K.svg("rect", { x: 10 + i * bw + 1, y: base - v * sy, width: bw - 2, height: v * sy, rx: 3, fill: isCur ? "var(--accent)" : visits.has(i) ? "var(--accent-soft)" : "var(--fill-2)", stroke: isNb ? "var(--orange)" : "none", "stroke-width": 2 }, g);
        });
        K.svg("line", { x1: 10, y1: base, x2: W - 10, y2: base, class: "s-axis" }, g);
        const gx = 10 + (gIdx + 0.5) * bw;
        K.text(g, gx, base - vmax * sy - 10, "globales Maximum", "s-text", gIdx > N - 4 ? "end" : "middle");
        const cx = 10 + (x + 0.5) * bw;
        arrowHead(g, cx, base + 4, cx, base + 20, "var(--accent)", 9);
        const sc = scope();
        out.set("Zustand " + (x + 1) + ", Wert <b>" + vals[x] + "</b>. " + (sc.global ? K.pill(true, "globales Maximum") : sc.local ? K.pill(false, "lokales Maximum") + " Kein Nachbar ist besser, Hill Climbing bleibt hier stecken." : "Ein Nachbar (orange) ist besser.") + "<br>Schritte: " + steps + (p.restart !== false ? ", Neustarts: " + restarts : ""));
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; x = s && s.x != null ? s.x : gIdx; paint(); },
        getVar: (name) => (name === "x" ? x : NaN),
        setVar(name, v) { if (name === "x") { x = K.clamp(Math.round(v), 0, N - 1); paint(); } },
        act(name, arg) {
          if (name === "climb") { for (let i = 0; i < (arg || 1); i++) climbStep(); }
          if (name === "top") climbAll();
          if (name === "restart") restart();
          if (name === "anneal") anneal(arg || 120);
          if (name === "set") { x = K.clamp(arg, 0, N - 1); trail = []; }
          paint();
        },
        lock() { locked = true; if (sT) sT.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ constraint satisfaction: the exam scheduling graph (Lecture 3)

  const CSP = {
    vars: ["A", "B", "C", "D", "E", "F", "G"],
    edges: [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["B", "E"], ["C", "E"], ["C", "F"], ["D", "E"], ["E", "F"], ["E", "G"], ["F", "G"]],
    domain: ["Mo", "Di", "Mi"],
    pos: { A: [62, 50], B: [178, 38], C: [122, 132], D: [298, 62], E: [246, 150], F: [150, 222], G: [300, 226] },
  };

  /* params: vars, edges, domain, pos, assign {A: "Mo"}, showDomains, editable (default true)
   * scope:  assigned, conflicts, complete (1 when every variable has a value and no constraint is violated) */
  LW.widget("csp", {
    mount(host, p, ctx) {
      const vars = p.vars || CSP.vars, edges = p.edges || CSP.edges, dom = p.domain || CSP.domain, pos = p.pos || CSP.pos;
      const assign = {};
      const setAssign = (obj) => Object.keys(obj || {}).forEach((key) => { if (vars.includes(key)) { const v = obj[key]; assign[key] = v == null ? -1 : typeof v === "number" ? v : dom.indexOf(v); } });
      vars.forEach((v) => (assign[v] = -1));
      setAssign(p.assign);
      let locked = false;
      const nbs = (v) => edges.filter((e) => e.includes(v)).map((e) => (e[0] === v ? e[1] : e[0]));
      function solution() {
        const a = {};
        vars.forEach((v) => (a[v] = -1));
        const ok = (v, d) => nbs(v).every((u) => a[u] !== d);
        const bt = (i) => {
          if (i === vars.length) return true;
          for (let d = 0; d < dom.length; d++) { if (ok(vars[i], d)) { a[vars[i]] = d; if (bt(i + 1)) return true; a[vars[i]] = -1; } }
          return false;
        };
        bt(0);
        return a;
      }
      const W = 360, H = 262;
      const svg = K.root(host, W, H, "Constraint-Graph");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      function scope() {
        const assigned = vars.filter((v) => assign[v] >= 0).length;
        const conflicts = edges.filter((e) => assign[e[0]] >= 0 && assign[e[0]] === assign[e[1]]).length;
        return { assigned, conflicts, complete: assigned === vars.length && !conflicts ? 1 : 0 };
      }
      function paint() {
        K.clear(g);
        edges.forEach((e) => {
          const bad = assign[e[0]] >= 0 && assign[e[0]] === assign[e[1]];
          K.svg("line", { x1: pos[e[0]][0], y1: pos[e[0]][1], x2: pos[e[1]][0], y2: pos[e[1]][1], stroke: bad ? "var(--red)" : "var(--label-3)", "stroke-width": bad ? 4 : 2 }, g);
        });
        vars.forEach((v) => {
          const [cx, cy] = pos[v], d = assign[v];
          const c = K.svg("circle", { cx, cy, r: 23, fill: d >= 0 ? PAL[d % PAL.length] : "var(--card-solid)", stroke: d >= 0 ? "none" : "var(--label-3)", "stroke-width": 2 }, g);
          const t1 = K.text(g, cx, cy - 7, v, "s-text-strong");
          const t2 = K.text(g, cx, cy + 9, d >= 0 ? dom[d] : "?", "s-text");
          if (d >= 0) { t1.style.fill = "white"; t2.style.fill = "white"; t2.style.fontWeight = 650; }
          if (p.showDomains && d < 0) {
            const left = dom.filter((_, k) => nbs(v).every((u) => assign[u] !== k));
            const t = K.text(g, cx, cy + 34, left.length ? left.join(" ") : "leer", "s-text");
            t.style.fontSize = "10px";
            if (!left.length) t.style.fill = "var(--red)";
          }
          if (p.editable !== false) {
            c.style.cursor = locked ? "default" : "pointer";
            c.addEventListener("click", () => { if (locked) return; assign[v] = assign[v] + 1 >= dom.length ? -1 : assign[v] + 1; paint(); ctx.changed(); });
          }
        });
        const sc = scope();
        out.set(sc.complete ? K.pill(true, "Alle Prüfungen verteilt, keine Bedingung verletzt") : (sc.conflicts ? K.pill(false, sc.conflicts + (sc.conflicts === 1 ? " verletzte Bedingung" : " verletzte Bedingungen")) + " " : "") + (vars.length - sc.assigned ? "Noch " + (vars.length - sc.assigned) + " ohne Termin." : "") + (p.editable !== false && !locked ? "<br>Tippe auf einen Knoten, um seinen Termin zu wechseln." : ""));
        return sc;
      }
      paint();
      return {
        check(goal) { const sc = paint(); if (goal && goal.when) return checkGoal(goal, sc); return sc.complete ? { correct: true } : { correct: false, detail: sc.conflicts ? "Zwei verbundene Prüfungen liegen am selben Tag." : "Noch haben nicht alle Prüfungen einen Termin." }; },
        solve() { Object.assign(assign, solution()); paint(); },
        act(name, arg) {
          if (name === "assign") setAssign(arg);
          if (name === "clear") vars.forEach((v) => (assign[v] = -1));
          if (name === "solution") Object.assign(assign, solution());
          paint();
        },
        lock() { locked = true; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ classification: k nearest neighbours and the perceptron (Lecture 4)

  const CLS = [
    [0.78, 0.3, 1], [0.85, 0.42, 1], [0.7, 0.22, 1], [0.92, 0.25, 1], [0.66, 0.35, 1], [0.8, 0.15, 1], [0.74, 0.48, 1],
    [0.2, 0.7, 0], [0.35, 0.8, 0], [0.28, 0.55, 0], [0.45, 0.65, 0], [0.15, 0.4, 0], [0.55, 0.85, 0], [0.4, 0.45, 0],
  ];

  /* params: mode "knn" | "perceptron", points [[x, y, class]], classes [name0, name1], xLabel, yLabel,
   *         knn: query [x, y], k, kSlider; perceptron: w [w0, w1, w2], alpha
   * scope:  knn: pred, votes, k, qx, qy; perceptron: errors, updates, w0, w1, w2 */
  LW.widget("classifier", {
    mount(host, p, ctx) {
      const pts = (p.points || CLS).map((q) => ({ x: q[0], y: q[1], c: q[2] }));
      const names = p.classes || ["kein Regen", "Regen"];
      const mode = p.mode || "knn";
      let q = (p.query || [0.5, 0.5]).slice(), kk = p.k || 3;
      const w0 = (p.w || [0, 0, 0]).slice();
      let w = w0.slice(), updates = 0, cursor = 0, locked = false;
      const alpha = p.alpha || 0.5;
      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Klassifikation");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const x = K.scale(0, 1, 34, W - 10), y = K.scale(0, 1, H - 30, 10);
      K.svg("rect", { x: x(0), y: y(1), width: x(1) - x(0), height: y(0) - y(1), fill: "none", stroke: "var(--label-3)" }, svg);
      K.text(svg, W - 10, H - 9, p.xLabel || "Luftfeuchtigkeit", "s-text", "end");
      const yl = K.text(svg, 12, (y(0) + y(1)) / 2, p.yLabel || "Luftdruck", "s-text");
      yl.setAttribute("transform", "rotate(-90 12 " + (y(0) + y(1)) / 2 + ")");
      const g = K.svg("g", null, svg);
      const hit = K.svg("circle", { r: 22, class: "s-hit" }, svg);
      if (mode === "knn") K.drag(svg, hit, (pt) => { if (locked) return; q = [K.clamp(x.inv(pt.x), 0, 1), K.clamp(y.inv(pt.y), 0, 1)]; paint(); ctx.changed(); });
      else hit.style.display = "none";
      let sK = null;
      if (mode === "knn" && p.kSlider !== false) sK = K.slider(host, { label: "k", min: 1, max: 7, step: 2, value: kk, format: (t) => K.fmt(t, 0), onInput: (t) => { kk = t; paint(); ctx.changed(); } });
      if (mode === "perceptron") {
        const row = LW.el("div", { class: "w-btns" });
        host.append(row);
        K.button(row, "Lernschritt", () => { if (locked) return; learn(1); paint(); ctx.changed(); });
        K.button(row, "10 Schritte", () => { if (locked) return; learn(10); paint(); ctx.changed(); });
        K.button(row, "Zurücksetzen", () => { if (locked) return; w = w0.slice(); updates = 0; cursor = 0; paint(); ctx.changed(); });
      }
      const out = K.readout(host);
      const h = (pt) => (w[0] + w[1] * pt.x + w[2] * pt.y >= 0 ? 1 : 0);
      function learn(nU) {
        for (let u = 0; u < nU; u++) {
          let found = -1;
          for (let s = 0; s < pts.length; s++) { const i = (cursor + s) % pts.length; if (h(pts[i]) !== pts[i].c) { found = i; break; } }
          if (found < 0) return;
          const pt = pts[found], d = pt.c - h(pt);
          w = [w[0] + alpha * d, w[1] + alpha * d * pt.x, w[2] + alpha * d * pt.y];
          updates++;
          cursor = (found + 1) % pts.length;
        }
      }
      function knn() {
        const ds = pts.map((pt, i) => ({ i, d: Math.hypot(pt.x - q[0], pt.y - q[1]) })).sort((a, b) => a.d - b.d).slice(0, kk);
        const votes = ds.filter((o) => pts[o.i].c === 1).length;
        return { ds, votes, pred: votes * 2 > ds.length ? 1 : 0 };
      }
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const poly = (pp, col, op) => { if (pp.length > 2) K.svg("polygon", { points: pp.map((c) => x(c[0]) + "," + y(c[1])).join(" "), fill: col, opacity: op }, g); };
      function scope() {
        if (mode === "knn") { const r = knn(); return { pred: r.pred, votes: r.votes, k: kk, qx: q[0], qy: q[1] }; }
        return { errors: pts.filter((pt) => h(pt) !== pt.c).length, updates, w0: w[0], w1: w[1], w2: w[2] };
      }
      function paint() {
        K.clear(g);
        let info = null;
        if (mode === "perceptron") {
          poly(clipHalf(sq, w[0], w[1], w[2]), "var(--accent)", 0.12);
          poly(clipHalf(sq, -w[0], -w[1], -w[2]), "var(--orange)", 0.12);
          // the boundary w0 + w1 x + w2 y = 0 where it crosses the unit square
          const cross = [];
          const add = (px, py) => { if (px >= -1e-9 && px <= 1 + 1e-9 && py >= -1e-9 && py <= 1 + 1e-9 && !cross.some((c) => Math.hypot(c[0] - px, c[1] - py) < 1e-6)) cross.push([px, py]); };
          if (Math.abs(w[2]) > 1e-9) { add(0, -w[0] / w[2]); add(1, -(w[0] + w[1]) / w[2]); }
          if (Math.abs(w[1]) > 1e-9) { add(-w[0] / w[1], 0); add(-(w[0] + w[2]) / w[1], 1); }
          if (cross.length >= 2) K.svg("line", { x1: x(cross[0][0]), y1: y(cross[0][1]), x2: x(cross[1][0]), y2: y(cross[1][1]), stroke: "var(--label)", "stroke-width": 2.4, "stroke-dasharray": "7 5" }, g);
        } else {
          info = knn();
          const far = info.ds[info.ds.length - 1].d;
          K.svg("circle", { cx: x(q[0]), cy: y(q[1]), r: x(far) - x(0), fill: "none", stroke: "var(--label-3)", "stroke-dasharray": "4 4" }, g);
          info.ds.forEach((o) => K.svg("line", { x1: x(q[0]), y1: y(q[1]), x2: x(pts[o.i].x), y2: y(pts[o.i].y), stroke: "var(--label-2)", "stroke-width": 1.5 }, g));
        }
        pts.forEach((pt) => {
          const wrong = mode === "perceptron" && h(pt) !== pt.c;
          const col = pt.c ? "var(--accent)" : "var(--orange)";
          if (pt.c) K.svg("circle", { cx: x(pt.x), cy: y(pt.y), r: 7, fill: col, stroke: wrong ? "var(--red)" : "none", "stroke-width": 3 }, g);
          else K.svg("rect", { x: x(pt.x) - 6.5, y: y(pt.y) - 6.5, width: 13, height: 13, rx: 2, fill: col, stroke: wrong ? "var(--red)" : "none", "stroke-width": 3 }, g);
        });
        K.svg("circle", { cx: x(0.72), cy: 22, r: 5, fill: "var(--accent)" }, g);
        K.text(g, x(0.72) + 9, 22, names[1], "s-text", "start");
        K.svg("rect", { x: x(0.72) - 5, y: 34, width: 10, height: 10, rx: 2, fill: "var(--orange)" }, g);
        K.text(g, x(0.72) + 9, 39, names[0], "s-text", "start");
        if (mode === "knn") {
          K.svg("circle", { cx: x(q[0]), cy: y(q[1]), r: 10, fill: "var(--card-solid)", stroke: info.pred ? "var(--accent)" : "var(--orange)", "stroke-width": 4 }, g);
          K.text(g, x(q[0]), y(q[1]), "?", "s-text-strong");
          hit.setAttribute("cx", x(q[0])); hit.setAttribute("cy", y(q[1]));
        }
        const sc = scope();
        if (mode === "knn") out.set("Die " + kk + " nächsten Nachbarn: " + sc.votes + " × " + names[1] + ", " + (kk - sc.votes) + " × " + names[0] + ". Vorhersage: <b>" + names[sc.pred] + "</b>.");
        else out.set("Gewichte: w₀ = " + K.fmt(w[0], 2) + ", w₁ = " + K.fmt(w[1], 2) + ", w₂ = " + K.fmt(w[2], 2) + ". Falsch eingeordnet (rot umrandet): <b>" + sc.errors + "</b> von " + pts.length + ". Updates: " + updates + ".");
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) {
          const s = (goal && goal.solve) || {};
          if (s.query) q = s.query.slice();
          if (s.k) { kk = s.k; if (sK) sK.set(kk); }
          if (s.w) w = s.w.slice();
          if (mode === "perceptron" && !s.w) learn(400);
          paint();
        },
        getVar: (name) => ({ qx: q[0], qy: q[1], k: kk, w0: w[0], w1: w[1], w2: w[2] })[name],
        setVar(name, v) {
          if (name === "qx") q[0] = v; if (name === "qy") q[1] = v;
          if (name === "k") { kk = Math.round(v); if (sK) sK.set(kk); }
          if (name === "w0") w[0] = v; if (name === "w1") w[1] = v; if (name === "w2") w[2] = v;
          paint();
        },
        act(name, arg) {
          if (name === "learn") learn(arg || 1);
          if (name === "reset") { w = w0.slice(); updates = 0; cursor = 0; }
          if (name === "query") q = arg.slice();
          paint();
        },
        lock() { locked = true; if (sK) sK.disable(true); },
      };
    },
  });

  // ------------------------------------------------------------------ Q-learning in a grid world (Lecture 4)

  /* params: grid (rows of "S" start, "G" goal +1, "X" trap −1, "#" wall, "." free), alpha, gamma, epsilon, stepCost, episodes
   * scope:  episodes, reaches (1 when the greedy path from S ends in G), pathLen */
  LW.widget("gridworld", {
    mount(host, p, ctx) {
      const rows = p.grid || ["....G", ".#.X.", "S...."];
      const R = rows.length, C = rows[0].length;
      const alpha = p.alpha != null ? p.alpha : 0.5, gamma = p.gamma != null ? p.gamma : 0.9, eps = p.epsilon != null ? p.epsilon : 0.2;
      const ACT = [[-1, 0], [1, 0], [0, -1], [0, 1]], ARROW = ["↑", "↓", "←", "→"];
      let start = [R - 1, 0];
      rows.forEach((row, r) => { for (let c = 0; c < C; c++) if (row[c] === "S") start = [r, c]; });
      const cellAt = (s) => rows[s[0]][s[1]];
      const key = (s) => s[0] + "," + s[1];
      let Q = {}, episodes = 0, rng = null, locked = false;
      const q = (s, a) => (Q[key(s)] ? Q[key(s)][a] : 0);
      const setQ = (s, a, v) => { if (!Q[key(s)]) Q[key(s)] = [0, 0, 0, 0]; Q[key(s)][a] = v; };
      const terminal = (s) => cellAt(s) === "G" || cellAt(s) === "X";
      const reward = (s) => (cellAt(s) === "G" ? 1 : cellAt(s) === "X" ? -1 : 0);
      const move = (s, a) => { const r = s[0] + ACT[a][0], c = s[1] + ACT[a][1]; return r < 0 || r >= R || c < 0 || c >= C || rows[r][c] === "#" ? s : [r, c]; };
      const maxQ = (s) => Math.max(q(s, 0), q(s, 1), q(s, 2), q(s, 3));
      const known = (s) => !!Q[key(s)] && Q[key(s)].some((v) => v !== 0);
      function bestA(s, random) { const m = maxQ(s); const cands = [0, 1, 2, 3].filter((a) => q(s, a) === m); return random ? cands[Math.floor(rng() * cands.length)] : cands[0]; }
      function reset() { Q = {}; episodes = 0; rng = LW.rng(LW.hash(ctx.seed + "|grid")); }
      function episode() {
        let s = start;
        for (let t = 0; t < 100 && !terminal(s); t++) {
          const a = rng() < eps ? Math.floor(rng() * 4) : bestA(s, true);
          const s2 = move(s, a);
          const target = reward(s2) + (p.stepCost || 0) + (terminal(s2) ? 0 : gamma * maxQ(s2));
          setQ(s, a, q(s, a) + alpha * (target - q(s, a)));
          s = s2;
        }
        episodes++;
      }
      function greedyPath() {
        let s = start;
        const path = [s], seen = new Set([key(s)]);
        while (!terminal(s) && known(s)) {
          const s2 = move(s, bestA(s, false));
          if (seen.has(key(s2))) break;
          seen.add(key(s2)); path.push(s2); s = s2;
        }
        return path;
      }
      reset();
      for (let i = 0; i < (p.episodes || 0); i++) episode();
      const cs = Math.min(64, Math.floor(340 / C)), W = cs * C + 20, H = cs * R + 20;
      const svg = K.root(host, W, H, "Gitterwelt");
      svg.style.maxWidth = Math.min(520, W * 1.4) + "px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "1 Episode", () => { if (locked) return; episode(); paint(); ctx.changed(); });
      K.button(row, "10 Episoden", () => { if (locked) return; for (let i = 0; i < 10; i++) episode(); paint(); ctx.changed(); });
      K.button(row, "Zurücksetzen", () => { if (locked) return; reset(); paint(); ctx.changed(); });
      const out = K.readout(host);
      function scope() { const path = greedyPath(), last = path[path.length - 1]; return { episodes, reaches: cellAt(last) === "G" ? 1 : 0, pathLen: path.length - 1 }; }
      function paint() {
        K.clear(g);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const s = [r, c], ch = rows[r][c], X0 = 10 + c * cs, Y0 = 10 + r * cs;
          let fillC = "var(--fill)", op = 1;
          if (ch === "#") fillC = "var(--label)";
          else if (ch === "G") fillC = "var(--green)";
          else if (ch === "X") fillC = "var(--red)";
          else if (known(s)) { const m = maxQ(s); fillC = m >= 0 ? "var(--green)" : "var(--red)"; op = Math.min(0.75, 0.12 + Math.abs(m) * 0.7); }
          K.svg("rect", { x: X0 + 1, y: Y0 + 1, width: cs - 2, height: cs - 2, rx: 7, fill: fillC, opacity: ch === "#" ? 0.82 : op }, g);
          if (ch === "G" || ch === "X") { const t = K.text(g, X0 + cs / 2, Y0 + cs / 2, ch === "G" ? "+1" : "−1", "s-text-strong"); t.style.fill = "white"; }
          else if (ch !== "#" && known(s)) {
            const t = K.text(g, X0 + cs / 2, Y0 + cs / 2 - 6, ARROW[bestA(s, false)], "s-text-strong"); t.style.fontSize = Math.round(cs * 0.34) + "px";
            const v = K.text(g, X0 + cs / 2, Y0 + cs / 2 + cs * 0.26, K.fmt(maxQ(s), 2), "s-text"); v.style.fontSize = "10px";
          }
          if (ch === "S") K.text(g, X0 + 9, Y0 + 11, "S", "s-text-strong");
        }
        const path = greedyPath();
        if (path.length > 1) K.svg("polyline", { points: path.map((s) => 10 + (s[1] + 0.5) * cs + "," + (10 + (s[0] + 0.5) * cs)).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 3, "stroke-linejoin": "round", opacity: 0.8 }, g);
        const sc = scope();
        out.set("Episoden: <b>" + episodes + "</b>. " + (sc.reaches ? K.pill(true, "Der gierige Weg erreicht das Ziel in " + sc.pathLen + " Schritten") : "Der gierige Weg vom Start (blau) erreicht das Ziel noch nicht.") + "<br>Pfeil: beste Aktion, Zahl: größter Q-Wert des Feldes.");
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; const n = s && s.episodes ? s.episodes : 60; reset(); for (let i = 0; i < n; i++) episode(); paint(); },
        getVar: (name) => (name === "episodes" ? episodes : NaN),
        setVar(name, v) { if (name === "episodes") { const n = Math.max(0, Math.round(v)); if (n < episodes) reset(); while (episodes < n) episode(); paint(); } },
        act(name, arg) { if (name === "train") for (let i = 0; i < (arg || 1); i++) episode(); if (name === "reset") reset(); paint(); },
        lock() { locked = true; },
      };
    },
  });

  // ------------------------------------------------------------------ a single neuron (Lecture 5)

  const TARGETS = { or: [0, 1, 1, 1], and: [0, 0, 0, 1], xor: [0, 1, 1, 0], nand: [1, 1, 1, 0] };
  const TNAMES = { or: "ODER", and: "UND", xor: "XOR", nand: "NAND" };
  const INPUTS = [[0, 0], [0, 1], [1, 0], [1, 1]];

  /* params: target "or" | "and" | "xor" | "nand", targets (segmented choice), g "step" | "sigmoid", w [w0, w1, w2], alpha, sliders
   * scope:  errors, loss, w0, w1, w2 */
  LW.widget("neuron", {
    mount(host, p, ctx) {
      let target = p.target || "or";
      const wStart = (p.w || [0, 0, 0]).slice();
      let w = wStart.slice(), cursor = 0, trained = 0, locked = false;
      const gName = p.g || "step";
      const alpha = p.alpha || (gName === "step" ? 0.5 : 2);
      const sig = (z) => 1 / (1 + Math.exp(-z));
      const z = (xx) => w[0] + w[1] * xx[0] + w[2] * xx[1];
      const outp = (xx) => (gName === "sigmoid" ? sig(z(xx)) : z(xx) >= 0 ? 1 : 0);
      const cls = (xx) => (gName === "sigmoid" ? (outp(xx) >= 0.5 ? 1 : 0) : outp(xx));
      function trainStep() {
        const ys = TARGETS[target];
        if (gName === "step") {
          for (let s = 0; s < 4; s++) {
            const i = (cursor + s) % 4, xx = INPUTS[i], d = ys[i] - outp(xx);
            if (d) { w = [w[0] + alpha * d, w[1] + alpha * d * xx[0], w[2] + alpha * d * xx[1]]; cursor = (i + 1) % 4; trained++; return; }
          }
          return;
        }
        const grad = [0, 0, 0];
        INPUTS.forEach((xx, i) => { const o = sig(z(xx)), d = (ys[i] - o) * o * (1 - o); grad[0] += d; grad[1] += d * xx[0]; grad[2] += d * xx[1]; });
        w = w.map((v, k) => v + alpha * grad[k]);
        trained++;
      }
      const W = 360;
      const top = K.root(host, W, 104, "Neuron");
      top.style.maxWidth = "520px"; top.style.margin = "0 auto";
      const gt = K.svg("g", null, top);
      const svg = K.root(host, W, 250, "Entscheidungsgrenze");
      svg.style.maxWidth = "420px"; svg.style.margin = "0 auto";
      const x = K.scale(-0.25, 1.25, 30, W - 30), y = K.scale(-0.25, 1.25, 240, 10);
      const g = K.svg("g", null, svg);
      if (p.targets) K.segmented(host, p.targets.map((t) => ({ id: t, label: TNAMES[t] })), target, (id) => { if (locked) return; target = id; w = wStart.slice(); trained = 0; syncSliders(); paint(); ctx.changed(); });
      const ui = {};
      if (p.sliders !== false) ["w0", "w1", "w2"].forEach((nm, k) => {
        ui[nm] = K.slider(host, { labelHtml: LW.math("w_" + k), min: -3, max: 3, step: 0.1, value: w[k], format: (t) => K.fmt(t, 1), onInput: (t) => { w[k] = t; paint(); ctx.changed(); } });
      });
      const syncSliders = () => ["w0", "w1", "w2"].forEach((nm, k) => { if (ui[nm]) ui[nm].set(Math.round(w[k] * 10) / 10); });
      if (p.train !== false) {
        const row = LW.el("div", { class: "w-btns" });
        host.append(row);
        K.button(row, "Lernschritt", () => { if (locked) return; trainStep(); syncSliders(); paint(); ctx.changed(); });
        K.button(row, "Zurücksetzen", () => { if (locked) return; w = wStart.slice(); trained = 0; syncSliders(); paint(); ctx.changed(); });
      }
      const out = K.readout(host);
      const box = [[-0.25, -0.25], [1.25, -0.25], [1.25, 1.25], [-0.25, 1.25]];
      function scope() {
        const ys = TARGETS[target];
        const errors = INPUTS.filter((xx, i) => cls(xx) !== ys[i]).length;
        const loss = INPUTS.reduce((s, xx, i) => s + Math.pow(ys[i] - outp(xx), 2), 0);
        return { errors, loss, w0: w[0], w1: w[1], w2: w[2], trained };
      }
      function paint() {
        K.clear(gt); K.clear(g);
        // neuron diagram
        const inY = [30, 78], S = [196, 54];
        [0, 1].forEach((i) => {
          const wi = w[i + 1];
          K.svg("line", { x1: 46, y1: inY[i], x2: S[0] - 24, y2: S[1], stroke: wi >= 0 ? "var(--accent)" : "var(--red)", "stroke-width": 1 + Math.min(6, Math.abs(wi) * 2), opacity: 0.85 }, gt);
          K.svg("circle", { cx: 30, cy: inY[i], r: 15, fill: "var(--fill-2)" }, gt);
          K.text(gt, 30, inY[i], i ? "x₂" : "x₁", "s-text-strong");
          K.text(gt, 112, inY[i] + (i ? 14 : -14), "w" + (i ? "₂" : "₁") + " = " + K.fmt(wi, 1), "s-text");
        });
        K.svg("circle", { cx: S[0], cy: S[1], r: 23, fill: "var(--accent-soft)", stroke: "var(--accent)", "stroke-width": 2 }, gt);
        K.text(gt, S[0], S[1] - 3, "Σ", "s-text-strong");
        K.text(gt, S[0], S[1] + 34, "w₀ = " + K.fmt(w[0], 1), "s-text");
        K.arrow(gt, S[0] + 24, S[1], 262, S[1], "s-vec-accent", 2);
        K.svg("rect", { x: 264, y: S[1] - 17, width: 40, height: 34, rx: 8, fill: "var(--fill-2)" }, gt);
        K.text(gt, 284, S[1], gName === "sigmoid" ? "σ" : "Stufe", "s-text-strong").style.fontSize = gName === "sigmoid" ? "15px" : "10px";
        K.arrow(gt, 306, S[1], 336, S[1], "s-vec-accent", 2);
        K.text(gt, 348, S[1], "h", "s-text-strong");
        // decision regions
        const pos = clipHalf(box, w[0], w[1], w[2]), neg = clipHalf(box, -w[0], -w[1], -w[2]);
        if (pos.length > 2) K.svg("polygon", { points: pos.map((c) => x(c[0]) + "," + y(c[1])).join(" "), fill: "var(--accent)", opacity: 0.16 }, g);
        if (neg.length > 2) K.svg("polygon", { points: neg.map((c) => x(c[0]) + "," + y(c[1])).join(" "), fill: "var(--orange)", opacity: 0.1 }, g);
        K.svg("rect", { x: x(-0.25), y: y(1.25), width: x(1.25) - x(-0.25), height: y(-0.25) - y(1.25), fill: "none", stroke: "var(--label-3)" }, g);
        const ys = TARGETS[target];
        INPUTS.forEach((xx, i) => {
          const ok = cls(xx) === ys[i];
          K.svg("circle", { cx: x(xx[0]), cy: y(xx[1]), r: 12, fill: ys[i] ? "var(--accent)" : "var(--card-solid)", stroke: ok ? (ys[i] ? "var(--accent)" : "var(--orange)") : "var(--red)", "stroke-width": ok ? 2.5 : 4 }, g);
          const t = K.text(g, x(xx[0]), y(xx[1]), String(ys[i]), "s-text-strong");
          if (ys[i]) t.style.fill = "white";
          K.text(g, x(xx[0]), y(xx[1]) + 22, "(" + xx[0] + ", " + xx[1] + ")", "s-text");
        });
        const sc = scope();
        out.set("Ziel: " + TNAMES[target] + ". " + INPUTS.map((xx) => "h(" + xx[0] + "," + xx[1] + ") = " + (gName === "sigmoid" ? K.fmt(outp(xx), 2) : outp(xx))).join(" · ") + "<br>" + (sc.errors ? K.pill(false, sc.errors + (sc.errors === 1 ? " Fehler" : " Fehler")) : K.pill(true, "alle vier richtig")) + (gName === "sigmoid" ? " Verlust " + K.fmt(sc.loss, 3) : "") + (trained ? " · Lernschritte: " + trained : ""));
        return sc;
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) {
          const s = goal && goal.solve;
          if (s && s.w) w = s.w.slice();
          else for (let i = 0; i < 300 && scope().errors; i++) trainStep();
          syncSliders(); paint();
        },
        getVar: (name) => ({ w0: w[0], w1: w[1], w2: w[2] })[name],
        setVar(name, v) { const k = ["w0", "w1", "w2"].indexOf(name); if (k >= 0) { w[k] = v; syncSliders(); paint(); } },
        act(name, arg) {
          if (name === "train") for (let i = 0; i < (arg || 1); i++) trainStep();
          if (name === "target") { target = arg; }
          if (name === "set") w = arg.slice();
          if (name === "reset") { w = wStart.slice(); trained = 0; }
          syncSliders(); paint();
        },
        lock() { locked = true; Object.values(ui).forEach((s) => s.disable(true)); },
      };
    },
  });

  // ------------------------------------------------------------------ word vectors (Lecture 6)

  const EMB = [["Mann", 0.5, 2], ["Frau", 0.5, -1.6], ["König", 3, 2.2], ["Königin", 3.1, -1.4], ["Prinz", 2.1, 1.5], ["Prinzessin", 2.2, -1.9], ["Junge", -1.2, 1.4], ["Mädchen", -1.2, -1.8], ["Apfel", -2.8, 0.5], ["Birne", -3, -0.4]];

  /* params: words [[word, x, y]], analogy [a, b, c] (shows a − b + c), select (learner taps a word), target (word for the goal)
   * scope:  sel (index of the selected word), nearest (index of the word closest to a − b + c), ok (1 if sel is the target) */
  LW.widget("embedding", {
    mount(host, p, ctx) {
      const words = (p.words || EMB).map((q) => ({ w: q[0], v: [q[1], q[2]] }));
      const find = (name) => words.findIndex((o) => o.w === name);
      let analogy = p.analogy || null, sel = -1, locked = false;
      const W = 360, H = 280;
      const xs = words.map((o) => o.v[0]), ys = words.map((o) => o.v[1]);
      const x = K.scale(Math.min(...xs) - 0.9, Math.max(...xs) + 0.9, 12, W - 12), y = K.scale(Math.min(...ys) - 0.7, Math.max(...ys) + 0.7, H - 12, 14);
      const svg = K.root(host, W, H, "Wortvektoren");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      K.svg("line", { x1: x(0), y1: 6, x2: x(0), y2: H - 6, class: "s-grid" }, svg);
      K.svg("line", { x1: 6, y1: y(0), x2: W - 6, y2: y(0), class: "s-grid" }, svg);
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      function result() {
        if (!analogy) return null;
        const [a, b, c] = analogy.map(find);
        if (a < 0 || b < 0 || c < 0) return null;
        const v = [words[a].v[0] - words[b].v[0] + words[c].v[0], words[a].v[1] - words[b].v[1] + words[c].v[1]];
        let best = -1, bd = Infinity;
        words.forEach((o, i) => { if (i === a || i === b || i === c) return; const d = Math.hypot(o.v[0] - v[0], o.v[1] - v[1]); if (d < bd) { bd = d; best = i; } });
        const cos = (u, t) => (u[0] * t[0] + u[1] * t[1]) / (Math.hypot(...u) * Math.hypot(...t));
        return { a, b, c, v, best, cos: cos(v, words[best].v) };
      }
      function scope() { const r = result(); const ti = p.target ? find(p.target) : r ? r.best : -1; return { sel, nearest: r ? r.best : -1, ok: sel >= 0 && sel === ti ? 1 : 0 }; }
      function paint() {
        K.clear(g);
        const r = result();
        if (r && (!p.select || locked)) {
          const A = words[r.a].v, B = words[r.b].v, Cv = words[r.c].v;
          K.arrow(g, x(B[0]), y(B[1]), x(Cv[0]), y(Cv[1]), "s-vec-orange", 2.6);
          K.arrow(g, x(A[0]), y(A[1]), x(r.v[0]), y(r.v[1]), "s-vec-green", 2.6);
          K.svg("path", { d: "M" + (x(r.v[0]) - 7) + "," + (y(r.v[1]) - 7) + " l14,14 m0,-14 l-14,14", stroke: "var(--green)", "stroke-width": 2.6 }, g);
        }
        words.forEach((o, i) => {
          const isRes = r && i === r.best && (!p.select || locked), isSel = i === sel;
          const c = K.svg("circle", { cx: x(o.v[0]), cy: y(o.v[1]), r: isSel || isRes ? 8 : 5.5, fill: isRes ? "var(--green)" : isSel ? "var(--accent)" : "var(--label-2)" }, g);
          const t = K.text(g, x(o.v[0]), y(o.v[1]) - 14, o.w, isSel || isRes ? "s-text-strong" : "s-text");
          const hitC = K.svg("circle", { cx: x(o.v[0]), cy: y(o.v[1]) - 4, r: 18, class: "s-hit" }, g);
          if (p.select) {
            hitC.style.cursor = locked ? "default" : "pointer";
            hitC.addEventListener("click", () => { if (locked) return; sel = i; paint(); ctx.changed(); });
          }
          void c; void t;
        });
        const sc = scope();
        if (r && (!p.select || locked)) out.set(words[r.a].w + " − " + words[r.b].w + " + " + words[r.c].w + " liegt am nächsten bei <b>" + words[r.best].w + "</b> (Kosinus-Ähnlichkeit " + K.fmt(r.cos, 3) + "). Orange: der Unterschied " + words[r.c].w + " − " + words[r.b].w + ", grün: derselbe Pfeil an " + words[r.a].w + " angesetzt.");
        else if (p.select) out.set(sel >= 0 ? "Ausgewählt: <b>" + words[sel].w + "</b>." : "Tippe auf ein Wort.");
        else out.set("Ähnliche Wörter liegen nahe beieinander. Die Achsen haben keine feste Bedeutung, aber Richtungen tragen Information.");
        return sc;
      }
      paint();
      return {
        check(goal) { const sc = paint(); if (goal && goal.when) return checkGoal(goal, sc); return sc.ok ? { correct: true } : { correct: false, detail: sel < 0 ? "Tippe auf ein Wort." : "Rechne den Pfeil nach: Wo landet man, wenn man denselben Unterschied an das erste Wort ansetzt?" }; },
        solve() { const r = result(); sel = p.target ? find(p.target) : r ? r.best : -1; paint(); },
        act(name, arg) { if (name === "analogy") analogy = arg; if (name === "select") sel = typeof arg === "number" ? arg : find(arg); paint(); },
        lock() { locked = true; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ attention (Lecture 6)

  /* params: tokens, weights {tokenIndex: [weight per token]}, focus, select (learner guesses the most attended token)
   * scope:  focus, sel, best (index with the largest weight for the focus token), ok */
  LW.widget("attention", {
    mount(host, p, ctx) {
      const toks = p.tokens || ["Das", "Tier", "überquerte", "die", "Straße", "nicht,", "weil", "es", "zu", "müde", "war."];
      const Wt = p.weights || { 7: [0.02, 0.62, 0.04, 0.02, 0.12, 0.02, 0.03, 0.05, 0.02, 0.04, 0.02] };
      let focus = p.focus != null ? p.focus : Number(Object.keys(Wt)[0]);
      let revealed = !p.select, sel = -1, locked = false;
      const W = 360, padX = 7, gap = 6;
      const lay = [];
      let cx = 10, line = 0;
      toks.forEach((t) => { const tw = t.length * 8 + 2 * padX; if (cx + tw > W - 10) { cx = 10; line++; } lay.push({ x: cx, w: tw, line }); cx += tw + gap; });
      const rowH = 86, H = 34 + (line + 1) * rowH;
      const svg = K.root(host, W, H, "Attention");
      svg.style.maxWidth = "560px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ty = (i) => 60 + lay[i].line * rowH, tx = (i) => lay[i].x + lay[i].w / 2;
      const best = () => { const ws = Wt[focus] || []; return ws.indexOf(Math.max(...ws)); };
      function scope() { return { focus, sel, best: best(), ok: sel === best() ? 1 : 0 }; }
      function paint() {
        K.clear(g);
        const ws = Wt[focus];
        if (ws && revealed) {
          const mx = Math.max(...ws);
          ws.forEach((wv, i) => {
            if (i === focus) return;
            const x1 = tx(focus), y1 = ty(focus) - 13, x2 = tx(i), y2 = ty(i) - 13;
            const mxp = (x1 + x2) / 2, myp = Math.min(y1, y2) - 18 - Math.min(26, Math.abs(x2 - x1) * 0.12);
            K.svg("path", { d: "M" + x1 + "," + y1 + " Q" + mxp + "," + myp + " " + x2 + "," + y2, fill: "none", stroke: "var(--accent)", "stroke-width": 1 + 9 * wv, opacity: 0.15 + 0.85 * (wv / mx), "stroke-linecap": "round" }, g);
            if (wv >= 0.08) K.text(g, x2, y2 - 22, K.fmt(100 * wv, 0) + " %", "s-text-strong").style.fill = "var(--accent)";
          });
        }
        toks.forEach((t, i) => {
          const isF = i === focus, isS = i === sel;
          const rct = K.svg("rect", { x: lay[i].x, y: ty(i) - 13, width: lay[i].w, height: 26, rx: 8, fill: isF ? "var(--accent)" : isS ? "var(--accent-soft)" : "var(--fill-2)", stroke: isS ? "var(--accent)" : "none", "stroke-width": 2 }, g);
          const tt = K.text(g, tx(i), ty(i), t, "s-text-strong");
          if (isF) tt.style.fill = "white";
          rct.style.cursor = locked ? "default" : "pointer";
          rct.addEventListener("click", () => {
            if (locked) return;
            if (p.select) { if (i !== focus) sel = i; }
            else if (Wt[i]) focus = i;
            paint(); ctx.changed();
          });
        });
        const sc = scope();
        if (revealed && ws) { const b = best(); out.set("»" + toks[focus] + "« verteilt seine Aufmerksamkeit auf die anderen Wörter. Am meisten auf <b>»" + toks[b] + "«</b> (" + K.fmt(100 * ws[b], 0) + " %)." + (!p.select && Object.keys(Wt).length > 1 ? " Tippe auf ein anderes hervorhebbares Wort." : "")); }
        else out.set(sel >= 0 ? "Deine Wahl: <b>»" + toks[sel] + "«</b>." : "Tippe das Wort an, auf das »" + toks[focus] + "« am stärksten achten sollte.");
        return sc;
      }
      paint();
      return {
        check(goal) { const sc = paint(); if (goal && goal.when) return checkGoal(goal, sc); return sc.ok ? { correct: true } : { correct: false, detail: sel < 0 ? "Tippe zuerst ein Wort an." : "Frag dich, worauf sich »" + toks[focus] + "« im Satz bezieht." }; },
        solve() { sel = best(); revealed = true; paint(); },
        act(name, arg) { if (name === "focus") focus = arg; if (name === "reveal") revealed = arg !== false; paint(); },
        lock() { locked = true; revealed = true; paint(); },
      };
    },
  });

  // ------------------------------------------------------------------ n-gram language model (Lecture 6)

  const CORPUS = "die katze schläft auf dem sofa. die katze jagt die maus. der hund schläft im garten. der hund jagt die katze. die maus schläft im loch. die sonne scheint auf den garten. der hund liegt auf dem sofa. die katze liegt in der sonne.";

  /* params: corpus (sentences separated by "."), start (first word), words (already generated)
   * scope:  len (number of words), done (1 after a full stop) */
  LW.widget("ngram", {
    mount(host, p, ctx) {
      const sents = (p.corpus || CORPUS).toLowerCase().split(".").map((s) => s.trim()).filter(Boolean).map((s) => s.split(/\s+/));
      const next = {};
      sents.forEach((ws) => { const seq = ws.concat(["."]); for (let i = 0; i < seq.length - 1; i++) { const a = seq[i], b = seq[i + 1]; (next[a] = next[a] || {})[b] = (next[a][b] || 0) + 1; } });
      let words = (p.words || [p.start || "die"]).slice(), locked = false;
      const rng = LW.rng(LW.hash(ctx.seed + "|ngram"));
      const maxBars = Math.min(6, Math.max(1, ...Object.values(next).map((d) => Object.keys(d).length)));
      const W = 360, H = 34 + maxBars * 27;
      const svg = K.root(host, W, H, "Bigramm-Modell");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const row = LW.el("div", { class: "w-btns" });
      host.append(row);
      K.button(row, "Zufällig weiter", () => { if (locked) return; gen(1); paint(); ctx.changed(); });
      K.button(row, "Von vorn", () => { if (locked) return; words = [p.start || "die"]; paint(); ctx.changed(); });
      const out = K.readout(host);
      const cur = () => words[words.length - 1];
      const dist = () => { const d = next[cur()] || {}; const tot = Object.values(d).reduce((a, b) => a + b, 0); return { list: Object.keys(d).map((k) => ({ w: k, c: d[k], p: d[k] / tot })).sort((a, b) => b.c - a.c || (a.w < b.w ? -1 : 1)), tot }; };
      function gen(k) {
        for (let i = 0; i < k; i++) {
          if (cur() === ".") return;
          const { list } = dist();
          if (!list.length) return;
          let u = rng(), j = 0;
          while (j < list.length - 1 && u >= list[j].p) { u -= list[j].p; j++; }
          words.push(list[j].w);
        }
      }
      function scope() { return { len: words.length, done: cur() === "." ? 1 : 0 }; }
      function paint() {
        K.clear(g);
        const { list, tot } = dist();
        K.text(g, 10, 14, cur() === "." ? "Der Satz ist zu Ende." : "Nach »" + cur() + "« kam im Text:", "s-text-strong", "start");
        list.slice(0, 6).forEach((o, i) => {
          const yy = 30 + i * 27, bw = 190;
          K.text(g, 10, yy + 10, o.w === "." ? "(Satzende)" : o.w, "s-text", "start");
          const bg = K.svg("rect", { x: 110, y: yy, width: bw, height: 20, rx: 5, fill: "var(--fill)" }, g);
          K.svg("rect", { x: 110, y: yy, width: bw * o.p, height: 20, rx: 5, fill: "var(--accent)" }, g);
          K.text(g, 306, yy + 10, o.c + " von " + tot, "s-text", "start");
          bg.style.cursor = locked ? "default" : "pointer";
          const pick = () => { if (locked || cur() === ".") return; words.push(o.w); paint(); ctx.changed(); };
          bg.addEventListener("click", pick);
        });
        out.set("<b>" + words.filter((w) => w !== ".").join(" ") + (cur() === "." ? "." : " …") + "</b><br>Tippe auf einen Balken, um das nächste Wort zu wählen, oder lass den Zufall entscheiden.");
        return scope();
      }
      paint();
      return {
        check: (goal) => checkGoal(goal, paint()),
        solve(goal) { const s = goal && goal.solve; if (s && s.words) words = s.words.slice(); else gen(12); paint(); },
        act(name, arg) {
          if (name === "start") words = [arg];
          if (name === "next") words.push(arg);
          if (name === "words") words = arg.slice();
          if (name === "generate") gen(arg || 1);
          paint();
        },
        lock() { locked = true; paint(); },
      };
    },
  });
})();
