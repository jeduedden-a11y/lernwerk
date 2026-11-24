/* Shared parts of the labs.
 *   LW.lab.goals(host, conditions, test)  the goal list of a build task: one line per condition, ticked off live;
 *                                          result() gives {correct, detail} for check().
 *   LW.lab.view3d(svg, opts)                a scene in 3D that turns under the finger (y is up), pinch or buttons zoom;
 *                                          a tap that did not move reaches opts.onTap(target, event).
 */
(function () {
  "use strict";
  const LW = window.LW;
  const lab = (LW.lab = LW.lab || {});
  const RAD = Math.PI / 180;

  lab.goals = function (host, conditions, test, before) {
    const list = LW.el("ul", { class: "lw-lab-goals" });
    if (before) host.insertBefore(list, before); else host.append(list);
    const holds = (c) => { try { return !!test(c.c, c); } catch (e) { return false; } };
    const label = (c) => c.show || [].concat(c.c).join(", ");
    return {
      el: list,
      /** Draws the list; true when every condition holds. */
      paint() {
        list.innerHTML = "";
        let all = true;
        conditions.forEach((c) => {
          const ok = holds(c);
          all = all && ok;
          list.append(LW.el("li", { class: ok ? "ok" : "" }, [LW.el("span", { class: "mark", text: ok ? "✓" : "" }), LW.el("span", { class: "lw-md", html: LW.md(label(c)) })]));
        });
        return all;
      },
      all() { return conditions.every(holds); },
      result() {
        const open = conditions.filter((c) => !holds(c));
        if (!open.length) return { correct: true };
        return { correct: false, detail: "Noch nicht erfüllt: " + open.map(label).join("; ") + "." };
      },
    };
  };

  lab.view3d = function (svg, opts) {
    const W = opts.width, H = opts.height;
    const cam = { az: opts.az == null ? 30 : opts.az, el: opts.el == null ? 18 : opts.el, scale: opts.scale || 40, dist: opts.dist || 16 };
    const home = Object.assign({}, cam);
    function project(p) {
      const az = cam.az * RAD, el = cam.el * RAD;
      const x1 = p[0] * Math.cos(az) - p[2] * Math.sin(az);
      const z1 = p[0] * Math.sin(az) + p[2] * Math.cos(az);
      const y2 = p[1] * Math.cos(el) - z1 * Math.sin(el);
      const z2 = p[1] * Math.sin(el) + z1 * Math.cos(el);
      const k = cam.dist / Math.max(1, cam.dist - z2);
      return { x: W / 2 + x1 * cam.scale * k, y: H / 2 - y2 * cam.scale * k, d: z2, k: k * cam.scale };
    }
    // pointers: one finger turns (or taps), two fingers zoom
    const pts = new Map();
    let start = null, moved = false, pinch0 = 0, scale0 = cam.scale;
    svg.style.touchAction = "none";
    svg.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, target: e.target, last: { x: e.clientX, y: e.clientY } }; moved = false; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; scale0 = cam.scale; moved = true; }
      e.preventDefault();
    });
    svg.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        cam.scale = Math.max(8, Math.min(220, scale0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch0)));
        opts.paint();
        return;
      }
      if (!start) return;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) moved = true;
      if (!moved) return;
      const dx = e.clientX - start.last.x, dy = e.clientY - start.last.y;
      start.last = { x: e.clientX, y: e.clientY };
      cam.az += dx * 0.55;
      cam.el = Math.max(-88, Math.min(88, cam.el + dy * 0.45));
      opts.paint();
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        if (start && !moved && opts.onTap) opts.onTap(start.target, e);
        start = null;
      }
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", (e) => { pts.delete(e.pointerId); start = null; });
    return {
      cam, project,
      zoom(f) { cam.scale = Math.max(8, Math.min(220, cam.scale * f)); opts.paint(); },
      reset() { Object.assign(cam, home); opts.paint(); },
      fit(radius) { cam.scale = Math.max(8, Math.min(120, (Math.min(W, H) * 0.47) / Math.max(0.5, radius))); },
    };
  };
})();
