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

  /** One sky per course, one path through it. Inside a chapter a star hangs below the closest lesson it builds on,
   * so each row is one step further; within a row the stars follow their parents from left to right, three to a row
   * at most, a little scattered (always the same way, seeded by the lesson id). Every chapter is joined to the one
   * before: by the lesson its first stars build on there, or else from the last star of the previous chapter, so
   * the whole course reads as one connected path. A chapter of a single lesson (a stage of a dated plan) swings to
   * the left or right of the one before, so the chain meanders across the sky. The chapter names stand in the sky
   * like the names on a star chart, without breaking the path. */
  function skyLayout(lessons, chapters, W) {
    const pos = new Map(), groups = [], edges = [];
    const COLS = 3, ROW = 74, MX = 22, LABEL = 18, FIRST = 26, TAIL = 42;
    const SWING = [0.5, 0.8, 0.5, 0.2];
    let y = 6, prev = null, gi = 0;
    chapters.forEach((ch, ci) => {
      const list = lessons.filter((l) => l.chapterIndex === ci);
      if (!list.length) return;
      const top = y;
      const parent = new Map(), depth = new Map();
      list.forEach((l) => {
        const inside = list.filter((m) => l.req.includes(m.id) && m.order < l.order);
        const p = inside.length ? inside.reduce((x, m) => (m.order > x.order ? m : x)) : null;
        parent.set(l.id, p);
        depth.set(l.id, p ? depth.get(p.id) + 1 : 0);
        if (p) edges.push([p.id, l.id]);
      });
      const roots = list.filter((l) => !parent.get(l.id));
      let row = 0;
      if (list.length === 1) {
        pos.set(list[0].id, { x: MX + SWING[gi % SWING.length] * (W - 2 * MX), y: top + LABEL + FIRST, w: (W - 2 * MX) / 2.2, i: 0 });
        row = 1;
      } else {
        const levels = [];
        list.forEach((l) => { const d = depth.get(l.id); (levels[d] = levels[d] || []).push(l); });
        levels.forEach((level, d) => {
          if (!level) return;
          level.sort((m, n) => {
            const pm = parent.get(m.id), pn = parent.get(n.id);
            const xm = pm ? pos.get(pm.id).x : 0, xn = pn ? pos.get(pn.id).x : 0;
            return xm !== xn ? xm - xn : m.order - n.order;
          });
          for (let k = 0; k < level.length; k += COLS) {
            const chunk = level.slice(k, k + COLS);
            // the first stars of a chapter run back and forth row by row, so the line through them never jumps
            if (d === 0 && (k / COLS) % 2 === 1) chunk.reverse();
            const cw = (W - 2 * MX) / chunk.length;
            chunk.forEach((l, i) => {
              const h = LW.hash(l.id) >>> 0;
              const jx = ((h % 997) / 997 - 0.5) * Math.min(24, cw * 0.25);
              const jy = (((h >>> 11) % 991) / 991 - 0.5) * 16;
              pos.set(l.id, { x: MX + (i + 0.5) * cw + jx, y: top + LABEL + FIRST + row * ROW + jy, w: Math.min(cw, (W - 2 * MX) / 2.2), i: list.indexOf(l) });
            });
            row += 1;
          }
        });
      }
      // the bridge from the previous chapter: what the first stars build on there, else its last star
      const bridgedRoots = new Set();
      if (prev) {
        roots.forEach((r) => {
          const there = prev.lessons.filter((m) => r.req.includes(m.id));
          if (there.length) {
            edges.push([there.reduce((x, m) => (m.order > x.order ? m : x)).id, r.id, "bridge"]);
            bridgedRoots.add(r.id);
          }
        });
        if (!bridgedRoots.size) {
          const last = prev.lessons.reduce((x, m) => {
            const px = pos.get(x.id), pm = pos.get(m.id);
            return pm.y > px.y + 1 || (Math.abs(pm.y - px.y) <= 1 && m.order > x.order) ? m : x;
          });
          edges.push([last.id, roots[0].id, "bridge"]);
          bridgedRoots.add(roots[0].id);
        }
      }
      // every other first star hangs on the one before it, so the chapter is one figure
      roots.forEach((r, k) => { if (k > 0) edges.push([roots[k - 1].id, r.id, "sib"]); });
      const bottom = top + LABEL + FIRST + (row - 1) * ROW + TAIL;
      groups.push({ chapter: ch, index: ci, top, bottom, lessons: list });
      prev = { lessons: list };
      y = bottom + 4;
      gi += 1;
    });
    return { pos, groups, edges, height: y + 6 };
  }

  /** A title in at most two short lines under its star. */
  function wrapTitle(title, room) {
    const words = String(title).split(/\s+/);
    const lines = [""];
    for (const w of words) {
      const cur = lines[lines.length - 1];
      if (!cur) lines[lines.length - 1] = w;
      else if ((cur + " " + w).length <= room) lines[lines.length - 1] = cur + " " + w;
      else if (lines.length < 2) lines.push(w);
      else { lines[1] = (lines[1] + " " + w); break; }
    }
    return lines.map((t) => (t.length > room ? t.slice(0, room - 1).trimEnd() + "…" : t));
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
      const subjects = (index.subjects && index.subjects.length ? index.subjects : [{ id: "alle", title: "Kurse", color: "#d2502c", courses: courses.map((c) => c.id) }])
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
        el("div", { class: "lw-title", text: "Lernpfad" }),
        el("div", { class: "lw-subtitle", text: allDone + " von " + allLessons + " Lektionen · " + levelsOf(courses) + " von " + maxLevelsOf(courses) + " Trainingsstufen" + (P.streak ? " · " + P.streak + (P.streak === 1 ? " Tag" : " Tage") + " in Folge" : "") }),
      ]));

      let selected = o.subject && subjects.some((s) => s.id === o.subject) ? o.subject : "alle";
      const cards = el("section", { class: "ov-subjects" });
      root.append(cards);
      const tabs = el("div", { class: "ov-tabs", role: "tablist" });
      root.append(tabs);
      root.append(el("div", { class: "ov-legend" }, [
        ["done", "abgeschlossen"], ["started", "begonnen"], ["ready", "als Nächstes frei"], ["later", "gesperrt"],
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
          card.style.setProperty("--sc", s.color || "#d2502c");
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
          card.append(top, bar, el("div", { class: "ov-subject-next", text: nxt ? "Als Nächstes: " + nxt.title : got === total ? "Alles abgeschlossen" : "" }));
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
          sec.style.setProperty("--cc", c.color || "#d2502c");
          const got = c.lessonsFlat.filter((l) => settled(l.id)).length;
          sec.append(el("div", { class: "ov-course-head" }, [
            el("span", { class: "ov-course-dot" }),
            el("div", { class: "ov-course-title", text: c.title }),
            el("div", { class: "ov-course-count", text: got + "/" + c.lessonsFlat.length }),
          ]));
          const W = 360;
          sec.classList.add("ov-sky");
          const { pos, groups, edges, height } = skyLayout(c.lessonsFlat, c.chapters || [], W);
          const svg = sv("svg", { viewBox: "0 0 " + W + " " + height, class: "ov-tree", role: "img", "aria-label": "Lernpfad " + c.title }, null);
          const back = sv("g", null, svg), lines = sv("g", null, svg), nodes = sv("g", null, svg);
          // faint background stars, always the same for a course
          let seed = LW.hash(c.id) >>> 0;
          const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
          for (let k = 0, n = Math.round(height / 7); k < n; k++) {
            sv("circle", { cx: (rnd() * W).toFixed(1), cy: (rnd() * height).toFixed(1), r: (0.35 + rnd() * 0.75).toFixed(2), class: "ov-dust", opacity: (0.15 + rnd() * 0.35).toFixed(2) }, back);
          }
          groups.forEach((gr) => {
            const all = gr.lessons.length, got = gr.lessons.filter((l) => settled(l.id)).length;
            const title = String(gr.chapter.title || "");
            const t = sv("text", { x: 16, y: gr.top + 13, class: "ov-band-title ov-sky-label" }, back);
            t.textContent = (title.length > 40 ? title.slice(0, 39).trimEnd() + "…" : title).toUpperCase();
            const sub = sv("text", { x: W - 16, y: gr.top + 13, class: "ov-band-count ov-sky-label" + (got === all ? " full" : "") }, back);
            sub.textContent = [gr.chapter.ref, got + "/" + all].filter(Boolean).join(" · ");
          });
          const lit = (from, to) => settled(from) && (settled(to) || stateOf(lessonIndex.get(to)) === "started");
          edges.forEach(([from, to, kind], k) => {
            const a = pos.get(from), b = pos.get(to);
            const next = settled(from) && stateOf(lessonIndex.get(to)) === "ready";
            const ln = sv("line", { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), pathLength: 1,
              class: "ov-line" + (kind ? " " + kind : "") + (lit(from, to) ? " lit" : next ? " next" : ""), style: "--d:" + Math.min(900, 120 + k * 14) + "ms" }, lines);
            ln.dataset.from = from; ln.dataset.to = to;
          });
          c.lessonsFlat.forEach((l) => {
            const q = pos.get(l.id), st = stateOf(l);
            const g = sv("g", { class: "ov-node ov-star " + st + (focusId === l.id ? " focus" : ""), transform: "translate(" + q.x.toFixed(1) + "," + q.y.toFixed(1) + ")",
              tabindex: "0", role: "button", style: "--d:" + Math.min(900, q.i * 24) + "ms",
              "aria-label": l.title + ", " + { done: "abgeschlossen", skipped: "übersprungen", started: "begonnen", ready: "als Nächstes frei", later: "gesperrt" }[st] }, nodes);
            sv("circle", { r: 24, class: "ov-hit" }, g);
            const star = sv("g", { class: "ov-star-body" }, g);
            if (st === "done") {
              sv("circle", { r: 11, class: "ov-halo" }, star);
              sv("circle", { r: 5.5, class: "ov-core" }, star);
              sv("circle", { r: 1.9, class: "ov-spark" }, star);
            } else if (st === "started") {
              sv("circle", { r: 9, class: "ov-orbit" }, star);
              sv("circle", { r: 9, class: "ov-arc", pathLength: 1, "stroke-dasharray": "0.4 1", transform: "rotate(-90)" }, star);
              sv("circle", { r: 4.2, class: "ov-core" }, star);
            } else if (st === "ready") {
              sv("circle", { r: 13, class: "ov-halo ready" }, star);
              sv("circle", { r: 6, class: "ov-ringstar" }, star);
            } else if (st === "skipped") {
              sv("circle", { r: 5.5, class: "ov-skipstar" }, star);
            } else {
              sv("circle", { r: 2.8, class: "ov-dim" }, star);
            }
            sv("circle", { r: 16, class: "ov-focus-ring" }, g);
            const topic = c.topics.find((t) => t.after === l.id);
            // training levels: four small dots in an arc above the star
            if (topic) {
              const lvl = best(c, topic);
              for (let k = 1; k <= 4; k++) {
                const ang = (-150 + (k - 1) * 40) * Math.PI / 180;
                const dot = sv("circle", { cx: (Math.cos(ang) * 15).toFixed(1), cy: (Math.sin(ang) * 15).toFixed(1), r: 1.9, class: "ov-pip" + (k <= lvl ? " on" : "") }, g);
                if (k <= lvl) dot.style.fill = "var(--lv" + k + "-a)";
              }
            }
            const room = Math.max(10, Math.floor((q.w - 6) / 4.9));
            wrapTitle(l.title, room).forEach((line, k) => {
              const t = sv("text", { class: "ov-label", x: 0, y: 25 + k * 10.5 }, g);
              t.textContent = line;
            });
            const open = () => {
              focusId = l.id;
              treeBox.querySelectorAll(".ov-node.focus").forEach((n) => n.classList.remove("focus"));
              g.classList.add("focus");
              showSheet(l);
            };
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
        sheet.style.setProperty("--cc", c.color || "#d2502c");
        const close = el("button", { class: "ov-sheet-close", type: "button", "aria-label": "Schließen", text: "×" });
        close.addEventListener("click", () => { sheet.classList.remove("open"); focusId = null; treeBox.querySelectorAll(".ov-node.focus").forEach((n) => n.classList.remove("focus")); });
        const status = { done: "Abgeschlossen", skipped: "Übersprungen", started: "Begonnen", ready: "Als Nächstes frei", later: "Baut auf anderen Lektionen auf" }[st];
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
      setTimeout(() => root.classList.add("ov-settled"), 1400);
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
