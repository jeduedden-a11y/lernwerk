/* Learning path: an overview of all subjects with their progress, and a skill tree for every course, built from
 * the "requires" of the lessons in course.json (cross-course "links" are listed as connections).
 *
 * LW.start({ mode: "overview", subject, progress: { done: [lessonId], skipped: [lessonId], started: {lessonId: step},
 *            practice: {"courseId/topicId": best level passed 0..4}, xp, streak }, theme, insets })
 * A skipped lesson counts as settled: it opens the lessons that build on it and its training topic.
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

  /** The tree follows the course: one band per chapter, in course order. Inside a band one row per lesson with its
   * full title, indented below the lesson of the same chapter it builds on (its first such prerequisite), joined by
   * an angled line. A prerequisite from an earlier chapter shows as a short line from above on the band's first row;
   * the lesson sheet names every prerequisite. */
  function layout(lessons, chapters, W) {
    const byId = new Map(lessons.map((l) => [l.id, l]));
    const pos = new Map();
    const bands = [];
    const links = [];
    const ROW = 44, HEAD = 46, FOOT = 24, GAP = 10, INDENT = 24;
    let y = 4;
    chapters.forEach((ch, ci) => {
      const list = lessons.filter((l) => l.chapterIndex === ci);
      if (!list.length) return;
      if (list.length === 1) {
        // a chapter of one lesson (a week of a dated plan): one line, node left, titles beside it
        pos.set(list[0].id, { x: 38, y: y + 31, compact: true });
        bands.push({ chapter: ch, index: ci, top: y, bottom: y + 62, lessons: list, compact: true });
        y += 62 + GAP;
        return;
      }
      // the first prerequisite inside the chapter decides the column; an earlier lesson only, so there are no loops
      const kids = new Map(list.map((l) => [l.id, []]));
      const roots = [];
      list.forEach((l) => {
        const parent = l.req.map((r) => byId.get(r)).find((p) => p && p.chapterIndex === ci && p.order < l.order);
        if (parent) kids.get(parent.id).push(l); else roots.push(l);
      });
      const top = y;
      let rowY = top + HEAD;
      const walk = (l, depth, parent) => {
        pos.set(l.id, { x: 30 + Math.min(depth, 4) * INDENT, y: rowY, row: true, first: rowY === top + HEAD });
        rowY += ROW;
        if (parent) links.push([parent.id, l.id]);
        kids.get(l.id).forEach((k) => walk(k, depth + 1, l));
      };
      roots.forEach((r) => walk(r, 0, null));
      const bottom = rowY - ROW + FOOT;
      bands.push({ chapter: ch, index: ci, top, bottom, lessons: list });
      y = bottom + GAP;
    });
    return { pos, bands, links, height: y };
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
    const skipped = new Set((P.skipped || []).filter((id) => !done.has(id)));
    const settled = (id) => done.has(id) || skipped.has(id);
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
      const stateOf = (l) => (done.has(l.id) ? "done" : skipped.has(l.id) ? "skipped" : started[l.id] > 0 ? "started" : l.req.every(settled) ? "ready" : "later");
      const best = (c, t) => Math.max(0, Math.min(4, +practice[c.id + "/" + t.id] || 0));
      const levelsOf = (list) => list.reduce((s, c) => s + c.topics.reduce((a, t) => a + best(c, t), 0), 0);
      const maxLevelsOf = (list) => list.reduce((s, c) => s + c.topics.length * 4, 0);

      // ---------------------------------------------------------------- header and subject cards
      const allLessons = courses.reduce((s, c) => s + c.lessonsFlat.length, 0);
      const allDone = courses.reduce((s, c) => s + c.lessonsFlat.filter((l) => settled(l.id)).length, 0);
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
      ].concat(skipped.size ? [["skipped", "übersprungen"]] : []).map(([k, t]) => el("span", { class: "ov-key " + k }, [el("i"), el("span", { text: t })]))));
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
          const got = s.list.reduce((a, c) => a + c.lessonsFlat.filter((l) => settled(l.id)).length, 0);
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
          const got = c.lessonsFlat.filter((l) => settled(l.id)).length;
          sec.append(el("div", { class: "ov-course-head" }, [
            el("span", { class: "ov-course-dot" }),
            el("div", { class: "ov-course-title", text: c.title }),
            el("div", { class: "ov-course-count", text: got + "/" + c.lessonsFlat.length }),
          ]));
          const W = 360;
          const { pos, bands, links, height } = layout(c.lessonsFlat, c.chapters || [], W);
          const svg = sv("svg", { viewBox: "0 0 " + W + " " + height, class: "ov-tree", role: "img", "aria-label": "Lernpfad " + c.title }, null);
          const back = sv("g", null, svg), edges = sv("g", null, svg), nodes = sv("g", null, svg);
          bands.forEach((b) => {
            const all = b.lessons.length, got = b.lessons.filter((l) => settled(l.id)).length;
            sv("rect", { x: 2, y: b.top, width: W - 4, height: b.bottom - b.top, rx: 16, class: "ov-band" + (got === all ? " full" : "") }, back);
            const title = String(b.chapter.title || "");
            const t = sv("text", { x: b.compact ? 66 : 16, y: b.top + (b.compact ? 26 : 19), class: "ov-band-title" }, back);
            t.textContent = title.length > 40 ? title.slice(0, 39).trimEnd() + "…" : title;
            const sub = [b.chapter.ref, got + "/" + all].filter(Boolean).join(" · ");
            const s = sv("text", { x: W - 16, y: b.top + (b.compact ? 26 : 19), class: "ov-band-count" }, back);
            s.textContent = sub;
          });
          c.lessonsFlat.forEach((l) => {
            const b = pos.get(l.id);
            if (!b) return;
            const outside = l.req.filter((r) => lessonIndex.get(r) && lessonIndex.get(r).chapterIndex !== l.chapterIndex);
            if (outside.length && (b.compact || b.first)) {
              // built on an earlier chapter: a short line from above, lit once those lessons are settled
              const r = b.compact ? 19 : 16;
              const p = sv("path", { d: "M" + b.x + "," + (b.y - r - 3) + " L" + b.x + "," + (b.y - r - 10), class: "ov-edge ov-stub" + (outside.every(settled) ? " lit" : "") }, edges);
              p.dataset.to = l.id;
            }
          });
          // from a lesson down and across to what builds on it, lit once it is settled
          links.forEach(([from, to]) => {
            const a = pos.get(from), b = pos.get(to);
            const d = b.x - a.x >= 20
              ? "M" + a.x + "," + (a.y + 16) + " L" + a.x + "," + (b.y - 6) + " Q" + a.x + "," + b.y + " " + (a.x + 6) + "," + b.y + " L" + (b.x - 15) + "," + b.y
              : "M" + a.x + "," + (a.y + 16) + " L" + b.x + "," + (b.y - 16);
            const p = sv("path", { d, class: "ov-edge" + (settled(from) ? " lit" : "") }, edges);
            p.dataset.from = from; p.dataset.to = to;
          });
          c.lessonsFlat.forEach((l) => {
            const q = pos.get(l.id), st = stateOf(l);
            const g = sv("g", { class: "ov-node " + st + (focusId === l.id ? " focus" : ""), transform: "translate(" + q.x + "," + q.y + ")", tabindex: "0", role: "button", "aria-label": l.title + ", " + { done: "geschafft", skipped: "übersprungen", started: "begonnen", ready: "bereit", later: "baut auf anderen Lektionen auf" }[st] }, nodes);
            // rows of a longer chapter draw the node a little smaller; the title stands beside it in full
            const half = q.row ? 16 : 19;
            sv("rect", { x: -half - 4, y: -half - 2, width: W - q.x + half - 10, height: 2 * half + 4, rx: 10, class: "ov-hit" }, g);
            const k0 = q.row ? sv("g", { transform: "scale(0.82)" }, g) : g;
            if (st === "ready") sv("circle", { r: 25, class: "ov-glow" }, k0);
            sv("circle", { r: 19, class: "ov-disc" }, k0);
            if (st === "started") sv("circle", { r: 19, class: "ov-arc", "stroke-dasharray": "60 200", transform: "rotate(-90)" }, k0);
            if (st === "done") sv("path", { d: "M-7,0.5 L-2,5.5 L7.5,-5", class: "ov-check" }, k0);
            else if (st === "skipped") sv("path", { d: "M-6,-5.5 L2,0 L-6,5.5 Z M5,-5.5 L5,5.5", class: "ov-skip" }, k0);
            else { const t = sv("text", { class: "ov-num", y: 0.5 }, k0); t.textContent = String(l.order + 1); }
            if (l.links.length) sv("circle", { cx: 15, cy: -15, r: 3.6, class: "ov-link-dot" }, k0);
            const topic = c.topics.find((t) => t.after === l.id);
            // training levels: four dots at the right end of the line
            if (topic) {
              const lvl = best(c, topic);
              for (let k = 1; k <= 4; k++) {
                const dot = sv("circle", { cx: W - 44 - q.x + (k - 1) * 7, cy: 0, r: 2.6, class: "ov-pip" + (k <= lvl ? " on" : "") }, g);
                if (k <= lvl) dot.style.fill = "var(--lv" + k + "-a)";
              }
            }
            const room = Math.floor((W - q.x - half - 12 - (topic ? 40 : 10)) / 5.7);
            const t = sv("text", { class: "ov-label side", x: half + 9, y: q.compact ? 11 : 4 }, g);
            t.textContent = l.title.length > room ? l.title.slice(0, room - 1).trimEnd() + "…" : l.title;
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
        const status = { done: "Geschafft", skipped: "Übersprungen", started: "Begonnen", ready: "Bereit", later: "Baut auf anderen Lektionen auf" }[st];
        sheet.append(close,
          el("div", { class: "ov-sheet-kicker", text: c.title + " · " + l.chapter }),
          el("div", { class: "ov-sheet-title", text: l.title }),
          el("div", { class: "ov-sheet-status " + st, text: status + (l.minutes ? " · etwa " + l.minutes + " Minuten" : "") }));
        const chips = (label, list, mark) => {
          if (!list.length) return;
          sheet.append(el("div", { class: "ov-sheet-row" }, [el("span", { class: "ov-sheet-label", text: label })].concat(list.map((x) => {
            const b = el("button", { class: "ov-chip" + (mark && settled(x.id) ? " ok" : ""), type: "button", text: (mark ? (done.has(x.id) ? "✓ " : skipped.has(x.id) ? "» " : "") : "") + x.title + (x.course !== c ? " (" + x.course.title + ")" : "") });
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
        const go = el("button", { class: "ov-btn primary", type: "button", text: st === "done" ? "Wiederholen" : st === "started" ? "Fortsetzen" : st === "skipped" ? "Doch ansehen" : "Starten" });
        go.addEventListener("click", () => LW.post({ type: "open", courseId: c.id, lessonId: l.id }));
        actions.append(go);
        if (topic && (st === "done" || st === "skipped")) {
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
