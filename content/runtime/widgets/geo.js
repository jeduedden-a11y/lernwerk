/* World map widget: places, flows between them and tasks on the map (Equal Earth projection).
 * The outlines come from geo-data.js (hand-drawn, about 1 to 2 degrees accurate), so tolerances stay generous. */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // ------------------------------------------------------------ projection
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const RAD = Math.PI / 180;

  /** lon/lat in degrees -> projection units (y downwards) */
  function project(lon, lat) {
    const lam = lon * RAD, th = Math.asin(M * Math.sin(lat * RAD));
    const t2 = th * th, t6 = t2 * t2 * t2;
    const x = (lam * Math.cos(th)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
    const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x, -y];
  }

  /** projection units -> lon/lat in degrees */
  function unproject(x, yDown) {
    const y = -yDown;
    let th = y;
    for (let i = 0; i < 12; i++) {
      const t2 = th * th, t6 = t2 * t2 * t2;
      const f = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y;
      const fp = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
      const d = f / fp;
      th -= d;
      if (Math.abs(d) < 1e-9) break;
    }
    const t2 = th * th, t6 = t2 * t2 * t2;
    const fp = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
    const lon = (M * x * fp) / Math.cos(th) / RAD;
    const lat = Math.asin(K.clamp(Math.sin(th) / M, -1, 1)) / RAD;
    return [lon, lat];
  }

  /** Great-circle distance in km. */
  function km(a, b) {
    const p1 = a.lat * RAD, p2 = b.lat * RAD, dp = p2 - p1, dl = (b.lon - a.lon) * RAD;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Rough direction from a to b, in words ("nach Osten", "nach Nordwesten"). */
  function direction(a, b) {
    let dl = b.lon - a.lon;
    if (dl > 180) dl -= 360;
    if (dl < -180) dl += 360;
    const dn = b.lat - a.lat;
    const ns = Math.abs(dn) > Math.max(4, Math.abs(dl) * 0.4) ? (dn > 0 ? "Nord" : "Süd") : "";
    const ew = Math.abs(dl) > Math.max(4, Math.abs(dn) * 0.4) ? (dl > 0 ? "ost" : "west") : "";
    if (ns && ew) return "nach " + ns + ew + "en";
    if (ns) return "nach " + (ns === "Nord" ? "Norden" : "Süden");
    if (ew) return "nach " + (ew === "ost" ? "Osten" : "Westen");
    return "ganz in der Nähe";
  }

  const VIEWS = {
    world: [-180, -56, 180, 84],
    afrika: [-20, -36, 54, 38],
    ozeanien: [108, -32, 180, 12],
    melanesien: [140, -12, 160, -1],
    suedostasien: [90, -12, 135, 25],
    amerika: [-170, -56, -30, 75],
    europa: [-12, 34, 45, 70],
    asien: [25, -10, 150, 60],
  };

  /** Bounding box of a lon/lat window in projection units, sampled along its edges. */
  function bbox(view) {
    const v = Array.isArray(view) ? view : VIEWS[view] || VIEWS.world;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      for (const [lon, lat] of [[v[0] + t * (v[2] - v[0]), v[1]], [v[0] + t * (v[2] - v[0]), v[3]], [v[0], v[1] + t * (v[3] - v[1])], [v[2], v[1] + t * (v[3] - v[1])]]) {
        const [x, y] = project(lon, lat);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    return { x0, y0, x1, y1, world: !Array.isArray(view) && (!view || view === "world") };
  }

  // ------------------------------------------------------------ widget

  /* params:
   *   view      "world" (default), "afrika", "ozeanien", "melanesien", "suedostasien", "amerika", "europa", "asien",
   *             or [lonMin, latMin, lonMax, latMax]
   *   places    [{id, name, lon, lat, note, color, label}]   markers; label false hides the name
   *   flows     [{from, to, label, color}]                    curved arrows between place ids
   *   mode      "explore" (default), "locate", "pick", "assign"
   *   target    {name, lon, lat}   for locate; tolerance in km (default 900)
   *   answer    place id           for pick
   *   assign    [{name, place}]    labels to put on lettered markers, for assign
   *   k, f      places and flows shown (default all), animatable
   *   title     line above the map
   * scope:  d (km from the target), placed (0/1), sel (index of the picked place), right (1 if the pick is the answer;
   *         for assign: number of correct labels), total
   * acts:   show [ids], focus id, flows n, reset
   */
  LW.widget("worldmap", {
    mount(host, p, ctx) {
      const data = LW.geoData || { land: {}, water: {} };
      const places = (p.places || []).map((pl, i) => Object.assign({ id: "p" + i, label: true }, pl));
      const byId = new Map(places.map((pl) => [pl.id, pl]));
      const flows = p.flows || [];
      const mode = p.mode || "explore";
      const tol = p.tolerance || 900;
      const W = 360;
      const B = bbox(p.view);
      const pad = B.world ? 0.02 : 0.04;
      const spanX = (B.x1 - B.x0) * (1 + 2 * pad);
      const sc = W / spanX;
      const H = Math.round((B.y1 - B.y0) * (1 + 2 * pad) * sc);
      const ox = B.x0 - (B.x1 - B.x0) * pad, oy = B.y0 - (B.y1 - B.y0) * pad;
      const px = (lon, lat) => { const [x, y] = project(lon, lat); return [(x - ox) * sc, (y - oy) * sc]; };
      const toLonLat = (sx, sy) => unproject(sx / sc + ox, sy / sc + oy);

      if (p.title) host.append(LW.el("div", { class: "w-title", text: p.title }));
      const svg = K.root(host, W, H, p.title || "Weltkarte");
      svg.classList.add("geo");
      svg.style.maxWidth = "640px";
      svg.style.margin = "0 auto";
      const defs = K.svg("defs", null, svg);
      const clipId = "geoclip" + Math.random().toString(36).slice(2, 8);
      const clip = K.svg("clipPath", { id: clipId }, defs);
      K.svg("rect", { x: 0, y: 0, width: W, height: H, rx: 14 }, clip);
      const arrowId = "geoarrow" + Math.random().toString(36).slice(2, 8);
      const marker = K.svg("marker", { id: arrowId, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
      K.svg("path", { d: "M0,0 L10,5 L0,10 z", class: "geo-arrowhead" }, marker);

      const world = K.svg("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      K.svg("rect", { x: 0, y: 0, width: W, height: H, class: "geo-sea-frame" }, world);
      // the globe's outline as the sea, so the world view gets its rounded Equal Earth shape
      let outline = "";
      for (let lat = -90; lat <= 90; lat += 3) { const [x, y] = px(-180, lat); outline += (outline ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); }
      for (let lat = 90; lat >= -90; lat -= 3) { const [x, y] = px(180, lat); outline += "L" + x.toFixed(1) + "," + y.toFixed(1); }
      K.svg("path", { d: outline + "Z", class: "geo-sea" }, world);
      // graticule: equator and tropics
      [[0, "geo-grat strong"], [23.44, "geo-grat"], [-23.44, "geo-grat"]].forEach(([lat, cls]) => {
        let d = "";
        for (let lon = -180; lon <= 180; lon += 6) { const [x, y] = px(lon, lat); d += (d ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); }
        K.svg("path", { d, class: cls }, world);
      });
      const landG = K.svg("g", { transform: "translate(" + (-ox * sc).toFixed(2) + "," + (-oy * sc).toFixed(2) + ") scale(" + (sc / 1000).toFixed(6) + ")" }, world);
      const pathOf = (s) => "M" + s.trim().split(/\s+/).join("L") + "Z";
      Object.keys(data.land).forEach((name) => K.svg("path", { d: pathOf(data.land[name]), class: "geo-land", "vector-effect": "non-scaling-stroke" }, landG));
      Object.keys(data.water).forEach((name) => K.svg("path", { d: pathOf(data.water[name]), class: "geo-water", "vector-effect": "non-scaling-stroke" }, landG));

      const flowG = K.svg("g", null, world);
      const placeG = K.svg("g", null, world);
      const pinG = K.svg("g", null, world);
      const panel = LW.el("div", { class: "geo-panel" });
      host.append(panel);
      const chipRow = LW.el("div", { class: "geo-chips" });
      if (mode === "assign") host.append(chipRow);
      const readout = K.readout(host);

      let k = p.k != null ? p.k : places.length;
      let f = p.f != null ? p.f : flows.length;
      let shown = null; // explicit list of ids from act("show")
      let focus = null;
      let sel = -1;
      let pin = null; // {lon, lat}
      let revealed = false; // solution shown
      let revealedState = false; // assignment checked: labels show right or wrong
      let locked = false;
      const letters = "ABCDEFGHIJ";
      const assignLabels = (p.assign || []).map((a, i) => Object.assign({ i }, a));
      const assigned = new Map(); // label index -> place index
      let pickedLabel = null;

      function visible(i) { return shown ? shown.includes(places[i].id) : i < Math.round(k); }

      function drawFlows() {
        K.clear(flowG);
        flows.slice(0, Math.round(f)).forEach((fl) => {
          const a = byId.get(fl.from), b = byId.get(fl.to);
          if (!a || !b) return;
          const [x1, y1] = px(a.lon, a.lat), [x2, y2] = px(b.lon, b.lat);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1);
          const bend = Math.min(60, len * 0.28);
          const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
          const cx = mx + nx * bend * (fl.bend || 1), cy = my + ny * bend * (fl.bend || 1);
          const path = K.svg("path", { d: "M" + x1 + "," + y1 + " Q" + cx + "," + cy + " " + x2 + "," + y2, class: "geo-flow", "marker-end": "url(#" + arrowId + ")" }, flowG);
          if (fl.color) path.style.stroke = fl.color;
          if (fl.label) {
            const t = placeLabel(flowG, 0.25 * x1 + 0.5 * cx + 0.25 * x2, 0.25 * y1 + 0.5 * cy + 0.25 * y2, fl.label, "geo-label small", taken, visibleDots, "above");
            if (fl.color) t.style.fill = fl.color;
          }
        });
      }

      // Labels are placed one after another at the first spot that does not cover an earlier label or another dot.
      const POS = {
        right: (x, y) => [x + 8, y - 1, "start"], left: (x, y) => [x - 8, y - 1, "end"],
        above: (x, y) => [x, y - 12, "middle"], below: (x, y) => [x, y + 13, "middle"],
        upright: (x, y) => [x + 5, y - 11, "start"], downright: (x, y) => [x + 5, y + 12, "start"],
        upleft: (x, y) => [x - 5, y - 11, "end"], downleft: (x, y) => [x - 5, y + 12, "end"],
      };
      function labelBox(tx, ty, anchor, text, size) {
        const w = text.length * size * 0.58 + 2, h = size + 2;
        const x0 = anchor === "start" ? tx : anchor === "end" ? tx - w : tx - w / 2;
        return { x0, y0: ty - h / 2, x1: x0 + w, y1: ty + h / 2 };
      }
      const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
      function placeLabel(parent, x, y, text, cls, taken, dots, prefer) {
        const size = /small/.test(cls) ? 9.5 : 10.5;
        const order = (prefer ? [prefer] : []).concat(x > W - 80 ? ["left", "upleft", "downleft", "above", "below", "right"] : ["right", "left", "upright", "downright", "upleft", "downleft", "above", "below"]);
        let best = null;
        for (const name of order) {
          const [tx, ty, anchor] = POS[name](x, y);
          const box = labelBox(tx, ty, anchor, text, size);
          let cost = taken.reduce((s, b) => s + overlap(box, b), 0) + dots.reduce((s, d) => s + (d.x === x && d.y === y ? 0 : overlap(box, { x0: d.x - 5, y0: d.y - 5, x1: d.x + 5, y1: d.y + 5 }) * 2), 0);
          if (box.x0 < 2 || box.x1 > W - 2 || box.y0 < 1 || box.y1 > H - 1) cost += 400;
          if (!best || cost < best.cost) best = { tx, ty, anchor, box, cost };
          if (cost === 0) break;
        }
        taken.push(best.box);
        return K.text(parent, best.tx, best.ty, text, cls, best.anchor);
      }

      function drawPlaces() {
        K.clear(placeG);
        const dots = visibleDots;
        const labels = [];
        places.forEach((pl, i) => {
          if (mode === "explore" && !visible(i)) return;
          const [x, y] = px(pl.lon, pl.lat);
          const g = K.svg("g", { class: "geo-place" + (focus === pl.id ? " focus" : "") + (sel === i ? " sel" : "") }, placeG);
          if (focus === pl.id) K.svg("circle", { cx: x, cy: y, r: 13, class: "geo-halo" }, g);
          const dot = K.svg("circle", { cx: x, cy: y, r: mode === "pick" || mode === "assign" ? 6.5 : 4.2, class: "geo-dot" }, g);
          if (pl.color) dot.style.fill = pl.color;
          if (revealed && mode === "pick" && pl.id === p.answer) dot.classList.add("ok");
          if (mode === "pick" || mode === "assign") {
            K.text(g, x, y + 0.5, mode === "assign" ? letters[i] : String(i + 1), "geo-num");
            const hit = K.svg("circle", { cx: x, cy: y, r: 16, class: "geo-hit" }, g);
            hit.addEventListener("click", (e) => { e.stopPropagation(); tapPlace(i); });
          }
          const showLabel = mode === "explore" ? pl.label !== false : revealed && pl.id === p.answer;
          if (showLabel) labels.push({ g, x, y, text: pl.name, cls: "geo-label", prefer: pl.pos });
          if (mode === "assign") {
            const li = [...assigned.entries()].find(([, pi]) => pi === i);
            if (li) {
              const lab = assignLabels[li[0]];
              const good = lab.place === pl.id;
              labels.push({ g, x, y, text: lab.name, cls: "geo-label small" + (revealedState ? (good ? " ok" : " no") : ""), prefer: "upright" });
            }
          }
        });
        // focused places first, so their names get the best spots
        labels.sort((a, b) => (b.g.classList.contains("focus") ? 1 : 0) - (a.g.classList.contains("focus") ? 1 : 0));
        labels.forEach((l) => placeLabel(l.g, l.x, l.y, l.text, l.cls, taken, dots, l.prefer));
      }

      function drawPin() {
        K.clear(pinG);
        if (mode !== "locate") return;
        const tgt = p.target;
        if (revealed && tgt) {
          const [tx, ty] = px(tgt.lon, tgt.lat);
          if (pin) { const [x, y] = px(pin.lon, pin.lat); K.svg("line", { x1: x, y1: y, x2: tx, y2: ty, class: "geo-miss" }, pinG); }
          K.svg("circle", { cx: tx, cy: ty, r: 9, class: "geo-target-ring" }, pinG);
          K.svg("circle", { cx: tx, cy: ty, r: 4.5, class: "geo-target" }, pinG);
          const right = tx < W - 80;
          K.text(pinG, tx + (right ? 11 : -11), ty - 1, tgt.name, "geo-label", right ? "start" : "end");
        }
        if (pin) {
          const [x, y] = px(pin.lon, pin.lat);
          const g = K.svg("g", { class: "geo-pin" }, pinG);
          K.svg("path", { d: "M" + x + "," + y + " c-5,-8 -9,-11 -9,-16 a9,9 0 1 1 18,0 c0,5 -4,8 -9,16 z", class: "geo-pin-body" }, g);
          K.svg("circle", { cx: x, cy: y - 16, r: 3.2, class: "geo-pin-dot" }, g);
        }
      }

      function paintPanel() {
        panel.innerHTML = "";
        const pl = focus ? byId.get(focus) : null;
        if (pl && (pl.note || pl.name)) {
          panel.append(LW.el("div", { class: "geo-panel-title", text: pl.name }));
          if (pl.note) panel.append(LW.el("div", { class: "lw-md", html: ctx.md(pl.note) }));
          panel.style.display = "block";
        } else panel.style.display = "none";
      }

      function paintChips() {
        if (mode !== "assign") return;
        chipRow.innerHTML = "";
        assignLabels.forEach((lab, li) => {
          const pi = assigned.get(li);
          const c = LW.el("button", { class: "lw-chip" + (pickedLabel === li ? " picked" : "") + (pi != null ? " paired" : ""), type: "button" }, [
            LW.el("span", { class: "n", text: pi != null ? letters[pi] : "?" }),
            LW.el("span", { class: "body", text: lab.name }),
          ]);
          if (revealedState) c.classList.add(pi != null && places[pi].id === lab.place ? "correct" : "wrong");
          c.addEventListener("click", () => {
            if (locked) return;
            if (assigned.has(li)) { assigned.delete(li); pickedLabel = null; } else pickedLabel = pickedLabel === li ? null : li;
            revealedState = false;
            ctx.changed();
            paint();
          });
          chipRow.append(c);
        });
      }

      function paintReadout() {
        if (mode === "locate") {
          readout.set(pin ? "Deine Markierung: " + LW.esc(fmtLonLat(pin)) : "Tippe auf die Karte, um eine Markierung zu setzen.");
        } else if (mode === "pick") {
          readout.set(sel >= 0 ? "Gewählt: Ort " + (sel + 1) : "Tippe einen der nummerierten Orte an.");
        } else if (mode === "assign") {
          readout.set(pickedLabel != null ? "Jetzt den passenden Ort auf der Karte antippen." : "Tippe einen Namen an, dann den Ort auf der Karte.");
        } else readout.el.style.display = "none";
      }

      function fmtLonLat(q) {
        const ns = q.lat >= 0 ? "N" : "S", ew = q.lon >= 0 ? "O" : "W";
        return K.fmt(Math.abs(q.lat), 0) + "° " + ns + ", " + K.fmt(Math.abs(q.lon), 0) + "° " + ew;
      }

      // place names get their spots first, then the labels of the flows avoid them
      let taken = [], visibleDots = [];
      function paint() {
        taken = [];
        visibleDots = places.filter((pl, i) => mode !== "explore" || visible(i)).map((pl) => { const [x, y] = px(pl.lon, pl.lat); return { x, y }; });
        drawPlaces(); drawFlows(); drawPin(); paintPanel(); paintChips(); paintReadout();
      }

      function tapPlace(i) {
        if (locked) return;
        if (mode === "pick") { sel = sel === i ? -1 : i; ctx.changed(); paint(); return; }
        if (mode === "assign" && pickedLabel != null) {
          [...assigned.entries()].forEach(([li, pi]) => { if (pi === i) assigned.delete(li); });
          assigned.set(pickedLabel, i);
          pickedLabel = null;
          revealedState = false;
          ctx.changed();
          paint();
        }
      }

      svg.addEventListener("click", (e) => {
        if (locked || mode !== "locate") return;
        const pt = K.point(svg, e);
        const [lon, lat] = toLonLat(pt.x, pt.y);
        if (!isFinite(lon) || !isFinite(lat) || Math.abs(lon) > 180) return;
        pin = { lon, lat };
        ctx.changed();
        paint();
      });
      if (mode === "locate") svg.style.cursor = "crosshair";

      function scope() {
        const s = { placed: pin ? 1 : 0, d: 99999, sel, right: 0, total: 0 };
        if (mode === "locate" && pin && p.target) s.d = km(pin, p.target);
        if (mode === "pick") s.right = sel >= 0 && places[sel].id === p.answer ? 1 : 0;
        if (mode === "assign") {
          s.total = assignLabels.length;
          assigned.forEach((pi, li) => { if (places[pi].id === assignLabels[li].place) s.right += 1; });
        }
        return s;
      }

      function defaultWhen() {
        return mode === "locate" ? "d <= " + tol : mode === "assign" ? "right == total" : "right == 1";
      }

      paint();
      return {
        check(goal) {
          const g = goal || {};
          const s = scope();
          let ok = false;
          try { ok = !!LW.expr(g.when || defaultWhen())(s); } catch (e) { ok = false; }
          if (mode === "assign") { revealedState = true; paint(); }
          if (ok) {
            if (mode === "locate") { revealed = true; paint(); }
            const near = mode === "locate" && p.target ? (s.d < 60 ? "Fast genau getroffen." : "Nur etwa " + K.fmt(Math.round(s.d / 10) * 10, 0) + " km vom Ziel entfernt.") : "";
            return { correct: true, detail: [near, g.explain].filter(Boolean).join(" ") || null };
          }
          for (const h of g.hints || []) { try { if (LW.expr(h.when)(s)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ } }
          if (mode === "locate" && p.target && pin) {
            const dist = K.fmt(Math.round(s.d / 50) * 50, 0);
            return { correct: false, detail: "Etwa " + dist + " km daneben. Das Ziel liegt von deiner Markierung aus " + direction(pin, p.target) + "." };
          }
          if (mode === "assign") return { correct: false, detail: g.message || "Die rot markierten Namen sitzen am falschen Ort." };
          if (mode === "pick") return { correct: false, detail: g.message || "Das ist ein anderer Ort. Achte auf den Kontinent und die Lage zum Äquator." };
          return { correct: false, detail: g.message || null };
        },
        solve() {
          revealed = true;
          revealedState = true;
          if (mode === "locate" && p.target && !pin) pin = { lon: p.target.lon, lat: p.target.lat };
          if (mode === "pick") sel = places.findIndex((pl) => pl.id === p.answer);
          if (mode === "assign") {
            assigned.clear();
            assignLabels.forEach((lab, li) => { const pi = places.findIndex((pl) => pl.id === lab.place); if (pi >= 0) assigned.set(li, pi); });
          }
          paint();
        },
        lock() { locked = true; },
        getVar(name) { return name === "k" ? k : name === "f" ? f : undefined; },
        setVar(name, v) {
          if (name === "k") { k = v; shown = null; }
          if (name === "f") f = v;
          paint();
        },
        act(name, arg) {
          if (name === "show") shown = [].concat(arg || []);
          if (name === "focus") focus = arg || null;
          if (name === "flows") f = +arg || 0;
          if (name === "reset") { shown = null; focus = null; k = 0; f = 0; }
          paint();
        },
      };
    },
  });

  LW.geo = { project, unproject, km, direction, VIEWS };
})();
