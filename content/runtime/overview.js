/* Learning path: an overview of all subjects with their progress, and a skill tree for every course, built from
 * the "requires" of the lessons in course.json (cross-course "links" are listed as connections).
 *
 * LW.start({ mode: "overview", subject, progress: { done: [lessonId], started: {lessonId: step},
 *            practice: {"courseId/topicId": best level passed 0..4}, xp, streak }, theme, insets })
 * posts { type: "open", courseId, lessonId } and { type: "practice", courseId, topicId, level }. */
(function () {
  "use strict";
  const LW = window.LW;
  const el = LW.el;
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const LEVEL_NAMES = ["", "Leicht", "Mittel", "Schwer", "Experte"];

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Nicht gefunden: " + url);
    return res.json();
  }

  /** Title for a node: the part before the first comma or colon if the title is long, in at most two lines. */
  function shortLines(title) {
    let t = String(title);
    if (t.length > 28) {
      const cut = t.split(/[:,]| und /)[0].trim();
      if (cut.length >= 8) t = cut;
    }
    const words = t.split(/\s+/);
    const lines = [""];
    for (const w of words) {
      const cur = lines[lines.length - 1];
      if (!cur) lines[lines.length - 1] = w;
      else if ((cur + " " + w).length <= 15) lines[lines.length - 1] = cur + " " + w;
      else lines.push(w);
    }
    if (lines.length > 2) lines.splice(2, lines.length - 2, lines.slice(2).join(" "));
    if (lines[1] && lines[1].length > 16) lines[1] = lines[1].slice(0, 15).trimEnd() + "…";
    if (lines[0].length > 17) lines[0] = lines[0].slice(0, 16) + "…";
    return lines;
  }

  /** Layered layout: depth = longest chain of prerequisites; at most four nodes per row, ordered by their parents. */
  function layout(lessons, W) {
    const byId = new Map(lessons.map((l) => [l.id, l]));
    const depth = new Map();
    const d = (l, seen) => {
      if (depth.has(l.id)) return depth.get(l.id);
      if (seen.has(l.id)) return 0;
      seen.add(l.id);
      const v = l.req.length ? 1 + Math.max(...l.req.map((r) => d(byId.get(r), seen))) : 0;
      depth.set(l.id, v);
      return v;
    };
    lessons.forEach((l) => d(l, new Set()));
    const layers = [];
    lessons.forEach((l) => { (layers[depth.get(l.id)] = layers[depth.get(l.id)] || []).push(l); });
    const pos = new Map();
    let row = 0;
    const PITCH = 98, TOP = 34;
    layers.forEach((layer, k) => {
      if (!layer) return;
      if (k > 0) {
        const bary = (l) => (l.req.length ? l.req.reduce((s, r) => s + (pos.get(r) ? pos.get(r).x : W / 2), 0) / l.req.length : W / 2);
        layer.sort((a, b) => bary(a) - bary(b) || a.order - b.order);
      }
      const rows = Math.ceil(layer.length / 4);
      const per = Math.ceil(layer.length / rows);
      for (let r = 0; r < rows; r++) {
        const chunk = layer.slice(r * per, (r + 1) * per);
        const gap = Math.min(88, (W - 64) / Math.max(1, chunk.length - 1));
        chunk.forEach((l, i) => pos.set(l.id, { x: W / 2 + (i - (chunk.length - 1) / 2) * gap, y: TOP + row * PITCH }));
        row += 1;
      }
    });
    return { pos, height: TOP + (row - 1) * PITCH + 62 };
  }

  function ring(parent, size, value, color) {
    const s = sv("svg", { viewBox: "0 0 40 40", width: size, height: size, class: "ov-ring", "aria-hidden": "true" }, parent);
    sv("circle", { cx: 20, cy: 20, r: 16, class: "ov-ring-bg" }, s);
    const c = sv("circle", { cx: 20, cy: 20, r: 16, class: "ov-ring-fg", "stroke-dasharray": (100.5 * Math.max(0, Math.min(1, value))).toFixed(1) + " 200", transform: "rotate(-90 20 20)" }, s);
    c.style.stroke = color;
    return s;
  }

  LW.overview = async function (o) {
    o = o || {};
    LW.setTheme(o.theme || {});
    LW.setInsets(o.insets || {});
    document.body.innerHTML = "";
    const root = el("main", { class: "lw-lesson lw-overview" });
    document.body.append(root);
    const P = o.progress || {};
    const done = new Set(P.done || []);
    const started = P.started || {};
    const practice = P.practice || {};
    const base = o.contentBase || "../courses/";
    try {
      const index = await fetchJSON(base + "index.json");
      const courses = [];
      for (const cid of index.courses || []) {
        try { courses.push(await fetchJSON(base + cid + "/course.json")); } catch (e) { /* a missing course does not stop the overview */ }
      }
      const subjects = (index.subjects && index.subjects.length ? index.subjects : [{ id: "alle", title: "Kurse", color: "#5e5ce6", courses: courses.map((c) => c.id) }])
        .map((s) => Object.assign({}, s, { list: courses.filter((c) => (s.courses || []).includes(c.id)) }))
        .filter((s) => s.list.length);
      const lessonIndex = new Map();
      courses.forEach((c) => {
        let n = 0;
        c.lessonsFlat = [];
        (c.chapters || []).forEach((ch, ci) => (ch.lessons || []).forEach((ref) => {
          if (ref.status === "soon") return;
          const l = { id: ref.id, title: ref.title, minutes: ref.minutes, chapter: ch.title, chapterIndex: ci, order: n++, req: ref.requires || [], links: ref.links || [], course: c };
          c.lessonsFlat.push(l);
          lessonIndex.set(l.id, l);
        }));
        const ids = new Set(c.lessonsFlat.map((l) => l.id));
        c.lessonsFlat.forEach((l) => { l.req = l.req.filter((r) => ids.has(r)); });
        c.lessonsFlat.forEach((l) => { l.next = c.lessonsFlat.filter((m) => m.req.includes(l.id)); });
        c.topics = c.practice || [];
      });
      const stateOf = (l) => (done.has(l.id) ? "done" : started[l.id] > 0 ? "started" : l.req.every((r) => done.has(r)) ? "ready" : "later");
      const best = (c, t) => Math.max(0, Math.min(4, +practice[c.id + "/" + t.id] || 0));
      const levelsOf = (list) => list.reduce((s, c) => s + c.topics.reduce((a, t) => a + best(c, t), 0), 0);
      const maxLevelsOf = (list) => list.reduce((s, c) => s + c.topics.length * 4, 0);

      // ---------------------------------------------------------------- header and subject cards
      const allLessons = courses.reduce((s, c) => s + c.lessonsFlat.length, 0);
      const allDone = courses.reduce((s, c) => s + c.lessonsFlat.filter((l) => done.has(l.id)).length, 0);
      root.append(el("header", { class: "lw-head" }, [
        el("div", { class: "lw-kicker", text: "Überblick" }),
        el("div", { class: "lw-title", text: "Dein Lernpfad" }),
        el("div", { class: "lw-subtitle", text: allDone + " von " + allLessons + " Lektionen · " + levelsOf(courses) + " von " + maxLevelsOf(courses) + " Trainingsstufen" + (P.streak ? " · " + P.streak + (P.streak === 1 ? " Tag" : " Tage") + " in Folge" : "") }),
      ]));

      let selected = o.subject && subjects.some((s) => s.id === o.subject) ? o.subject : "alle";
      const cards = el("section", { class: "ov-subjects" });
      root.append(cards);
      const tabs = el("div", { class: "ov-tabs", role: "tablist" });
      root.append(tabs);
      root.append(el("div", { class: "ov-legend" }, [
        ["done", "geschafft"], ["started", "begonnen"], ["ready", "bereit"], ["later", "baut auf anderem auf"],
      ].map(([k, t]) => el("span", { class: "ov-key " + k }, [el("i"), el("span", { text: t })]))));
      const treeBox = el("div", { class: "ov-trees" });
      root.append(treeBox);
      const sheet = el("div", { class: "ov-sheet", role: "dialog", "aria-live": "polite" });
      document.body.append(sheet);

      function nextLesson(list) {
        for (const c of list) for (const l of c.lessonsFlat) if (stateOf(l) === "started") return l;
        for (const c of list) for (const l of c.lessonsFlat) if (stateOf(l) === "ready") return l;
        return null;
      }

      function paintCards() {
        cards.innerHTML = "";
        subjects.forEach((s) => {
          const total = s.list.reduce((a, c) => a + c.lessonsFlat.length, 0);
          const got = s.list.reduce((a, c) => a + c.lessonsFlat.filter((l) => done.has(l.id)).length, 0);
          const nxt = nextLesson(s.list);
          const card = el("button", { class: "ov-subject" + (selected === s.id ? " on" : ""), type: "button" });
          card.style.setProperty("--sc", s.color || "#5e5ce6");
          const top = el("div", { class: "ov-subject-top" });
          const r = el("div", { class: "ov-subject-ring" });
          ring(r, 46, total ? got / total : 0, s.color);
          r.append(el("span", { class: "ov-ring-num", text: total ? Math.round((100 * got) / total) + "%" : "–" }));
          top.append(r, el("div", { class: "ov-subject-text" }, [
            el("div", { class: "ov-subject-title", text: s.title }),
            el("div", { class: "ov-subject-sub", text: got + " von " + total + " Lektionen" }),
          ]));
          const lv = levelsOf(s.list), mx = maxLevelsOf(s.list);
          const bar = el("div", { class: "ov-levelbar", title: "Trainingsstufen" }, [el("i", { style: "width:" + (mx ? (100 * lv) / mx : 0) + "%" })]);
          card.append(top, bar, el("div", { class: "ov-subject-next", text: nxt ? "Als Nächstes: " + nxt.title : got === total ? "Alles geschafft" : "" }));
          card.addEventListener("click", () => { selected = selected === s.id ? "alle" : s.id; paint(); });
          cards.append(card);
        });
      }

      function paintTabs() {
        tabs.innerHTML = "";
        [{ id: "alle", title: "Alle" }].concat(subjects).forEach((s) => {
          const b = el("button", { class: "w-btn" + (selected === s.id ? " on" : ""), type: "button", role: "tab", text: s.title, "aria-selected": selected === s.id ? "true" : "false" });
          b.addEventListener("click", () => { selected = s.id; paint(); });
          tabs.append(b);
        });
      }

      let focusId = null;
      function paintTrees() {
        treeBox.innerHTML = "";
        const list = selected === "alle" ? courses.filter((c) => subjects.some((s) => s.list.includes(c))) : (subjects.find((s) => s.id === selected) || { list: [] }).list;
        list.forEach((c) => {
          const sec = el("section", { class: "ov-course" });
          sec.style.setProperty("--cc", c.color || "#5e5ce6");
          const got = c.lessonsFlat.filter((l) => done.has(l.id)).length;
          sec.append(el("div", { class: "ov-course-head" }, [
            el("span", { class: "ov-course-dot" }),
            el("div", { class: "ov-course-title", text: c.title }),
            el("div", { class: "ov-course-count", text: got + "/" + c.lessonsFlat.length }),
          ]));
          const W = 360;
          const { pos, height } = layout(c.lessonsFlat, W);
          const svg = sv("svg", { viewBox: "0 0 " + W + " " + height, class: "ov-tree", role: "img", "aria-label": "Lernpfad " + c.title }, null);
          const edges = sv("g", null, svg), nodes = sv("g", null, svg);
          c.lessonsFlat.forEach((l) => l.req.forEach((r) => {
            const a = pos.get(r), b = pos.get(l.id);
            if (!a || !b) return;
            const y1 = a.y + 21, y2 = b.y - 21, my = (y1 + y2) / 2;
            const p = sv("path", { d: "M" + a.x + "," + y1 + " C" + a.x + "," + my + " " + b.x + "," + my + " " + b.x + "," + y2, class: "ov-edge" + (done.has(r) ? " lit" : "") }, edges);
            p.dataset.from = r; p.dataset.to = l.id;
          }));
          c.lessonsFlat.forEach((l) => {
            const q = pos.get(l.id), st = stateOf(l);
            const g = sv("g", { class: "ov-node " + st + (focusId === l.id ? " focus" : ""), transform: "translate(" + q.x + "," + q.y + ")", tabindex: "0", role: "button", "aria-label": l.title + ", " + { done: "geschafft", started: "begonnen", ready: "bereit", later: "baut auf anderen Lektionen auf" }[st] }, nodes);
            if (st === "ready") sv("circle", { r: 25, class: "ov-glow" }, g);
            sv("circle", { r: 19, class: "ov-disc" }, g);
            if (st === "started") sv("circle", { r: 19, class: "ov-arc", "stroke-dasharray": "60 200", transform: "rotate(-90)" }, g);
            if (st === "done") sv("path", { d: "M-7,0.5 L-2,5.5 L7.5,-5", class: "ov-check" }, g);
            else { const t = sv("text", { class: "ov-num", y: 0.5 }, g); t.textContent = String(l.order + 1); }
            const topic = c.topics.find((t) => t.after === l.id);
            if (topic) {
              const lvl = best(c, topic);
              for (let k = 1; k <= 4; k++) {
                const dot = sv("circle", { cx: -10.5 + (k - 1) * 7, cy: 26, r: 2.6, class: "ov-pip" + (k <= lvl ? " on" : "") }, g);
                if (k <= lvl) dot.style.fill = "var(--lv" + k + "-a)";
              }
            }
            shortLines(l.title).forEach((line, i) => {
              const t = sv("text", { class: "ov-label", y: (topic ? 40 : 34) + i * 11 }, g);
              t.textContent = line;
            });
            if (l.links.length) sv("circle", { cx: 15, cy: -15, r: 3.6, class: "ov-link-dot" }, g);
            const open = () => { focusId = l.id; paint(); showSheet(l); };
            g.addEventListener("click", open);
            g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
          });
          sec.append(svg);
          treeBox.append(sec);
        });
        if (!list.length) treeBox.append(el("div", { class: "lw-step", text: "Keine Kurse in diesem Fach." }));
      }

      function showSheet(l) {
        const c = l.course, st = stateOf(l);
        const topic = c.topics.find((t) => t.after === l.id);
        sheet.innerHTML = "";
        sheet.style.setProperty("--cc", c.color || "#5e5ce6");
        const close = el("button", { class: "ov-sheet-close", type: "button", "aria-label": "Schließen", text: "×" });
        close.addEventListener("click", () => { sheet.classList.remove("open"); focusId = null; paint(); });
        const status = { done: "Geschafft", started: "Begonnen", ready: "Bereit", later: "Baut auf anderen Lektionen auf" }[st];
        sheet.append(close,
          el("div", { class: "ov-sheet-kicker", text: c.title + " · " + l.chapter }),
          el("div", { class: "ov-sheet-title", text: l.title }),
          el("div", { class: "ov-sheet-status " + st, text: status + (l.minutes ? " · etwa " + l.minutes + " Minuten" : "") }));
        const chips = (label, list, mark) => {
          if (!list.length) return;
          sheet.append(el("div", { class: "ov-sheet-row" }, [el("span", { class: "ov-sheet-label", text: label })].concat(list.map((x) => {
            const b = el("button", { class: "ov-chip" + (mark && done.has(x.id) ? " ok" : ""), type: "button", text: (mark ? (done.has(x.id) ? "✓ " : "") : "") + x.title + (x.course !== c ? " (" + x.course.title + ")" : "") });
            b.addEventListener("click", () => {
              focusId = x.id;
              if (x.course !== c && selected !== "alle" && !subjects.find((s) => s.id === selected).list.includes(x.course)) selected = "alle";
              paint();
              showSheet(x);
              const node = treeBox.querySelector(".ov-node.focus");
              if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            return b;
          }))));
        };
        chips("Baut auf", l.req.map((r) => lessonIndex.get(r)).filter(Boolean), true);
        chips("Führt zu", l.next, false);
        chips("Verbindung", l.links.map((r) => lessonIndex.get(r)).filter(Boolean), false);
        const actions = el("div", { class: "ov-sheet-actions" });
        const go = el("button", { class: "ov-btn primary", type: "button", text: st === "done" ? "Wiederholen" : st === "started" ? "Fortsetzen" : "Starten" });
        go.addEventListener("click", () => LW.post({ type: "open", courseId: c.id, lessonId: l.id }));
        actions.append(go);
        if (topic && st === "done") {
          const lvl = best(c, topic), next = Math.min(4, lvl + 1);
          const tr = el("button", { class: "ov-btn lv" + next, type: "button", text: "Training · " + LEVEL_NAMES[next] });
          tr.addEventListener("click", () => LW.post({ type: "practice", courseId: c.id, topicId: topic.id, level: next }));
          actions.append(tr);
        }
        sheet.append(actions);
        sheet.classList.add("open");
      }

      function paint() { paintCards(); paintTabs(); paintTrees(); }
      paint();
      if (o.focus && lessonIndex.has(o.focus)) {
        focusId = o.focus;
        paint();
        showSheet(lessonIndex.get(o.focus));
      }
      LW.post({ type: "ready", steps: 0 });
    } catch (e) {
      root.append(el("div", { class: "lw-step" }, [el("div", { class: "lw-error", text: String(e.message || e) })]));
      LW.post({ type: "error", message: String(e.message || e) });
    }
  };

  const start = LW.start;
  LW.start = function (o) { return o && o.mode === "overview" ? LW.overview(o) : start(o); };
})();
