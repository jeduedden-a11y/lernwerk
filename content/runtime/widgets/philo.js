/* Philosophy widgets.
 *
 *   balance: a beam balance that weighs considerations, e.g. pleasure and pain in Bentham's calculus or the
 *            arguments for two options.
 *            params: left, right (labels of the pans), items [{ id, label, side: "left" | "right", w, vary: [min, max] }],
 *                    k (how many items are on the pans, for animations), assign (true: the learner puts each item on a
 *                    side by tapping it; side is then the solution), unit (text after the weights)
 *            scope:  L, R (sums), diff = L - R, k, right (items on their correct side), total, w_<id> (each weight)
 *            act:    none; animations glide k and the weights w_<id>.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  function goalCheck(goal, scope) {
    let ok = false;
    try { ok = !!LW.expr(goal.when || "0")(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: LW.graphTemplate ? LW.graphTemplate(h.text, scope).replace(/^<p>|<\/p>$/g, "") : h.text }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: goal.message || null };
  }

  LW.widget("balance", {
    mount(host, p, ctx) {
      const items = (p.items || []).map((it, i) => Object.assign({ id: "i" + i, w: 1 }, it));
      const assign = !!p.assign;
      const place = new Map(items.map((it) => [it.id, assign ? null : it.side]));
      const w = new Map(items.map((it) => [it.id, it.w]));
      let k = p.k != null ? p.k : items.length, locked = false;
      const W = 360, H = 210, px = 180, py = 58, arm = 128;
      const svg = K.root(host, W, H, p.aria || "Waage");
      svg.style.maxWidth = "520px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const sliders = {};
      items.forEach((it) => {
        if (!it.vary) return;
        sliders[it.id] = K.slider(ctrl, { labelHtml: LW.esc(it.label), min: it.vary[0], max: it.vary[1], step: it.step || 1, value: it.w,
          onInput: (v) => { if (locked) return; w.set(it.id, v); paint(); ctx.changed(); } });
      });
      let chips = null;
      if (assign) {
        chips = LW.el("div", { class: "w-btns", style: "flex-wrap:wrap" });
        host.append(LW.el("div", { class: "lw-pool-label", text: "Antippen: links, rechts, wieder weg" }), chips);
        items.forEach((it) => {
          const b = LW.el("button", { class: "w-btn", type: "button", text: it.label });
          b.addEventListener("click", () => {
            if (locked) return;
            const cur = place.get(it.id);
            place.set(it.id, cur == null ? "left" : cur === "left" ? "right" : null);
            paint(); ctx.changed();
          });
          it.btn = b;
          chips.append(b);
        });
      }

      const visible = () => items.filter((it, i) => i < Math.round(k) && place.get(it.id) != null);
      function scope() {
        const s = { k, total: items.length, right: 0, L: 0, R: 0 };
        items.forEach((it, i) => {
          s["w_" + it.id] = w.get(it.id);
          if (place.get(it.id) === it.side) s.right += 1;
          if (i >= Math.round(k)) return;
          if (place.get(it.id) === "left") s.L += w.get(it.id);
          if (place.get(it.id) === "right") s.R += w.get(it.id);
        });
        s.diff = s.L - s.R;
        return s;
      }
      const fmt = (v) => K.fmt(v, 1) + (p.unit ? " " + p.unit : "");

      function paint() {
        K.clear(g);
        const S = scope();
        const max = Math.max(1, ...items.map((it) => Math.abs(w.get(it.id)))) * Math.max(2, items.length / 2);
        const ang = K.clamp((S.diff / max) * 22, -16, 16) * (Math.PI / 180);
        // stand
        K.svg("path", { d: "M" + (px - 34) + "," + (H - 12) + " L" + (px + 34) + "," + (H - 12) + " L" + px + "," + py + " Z", fill: "var(--fill-2)", stroke: "var(--label-3)", "stroke-width": 1.2 }, g);
        const lx = px - arm * Math.cos(ang), ly = py + arm * Math.sin(ang), rx = px + arm * Math.cos(ang), ry = py - arm * Math.sin(ang);
        K.svg("line", { x1: lx, y1: ly, x2: rx, y2: ry, stroke: "var(--label)", "stroke-width": 4, "stroke-linecap": "round" }, g);
        K.svg("circle", { cx: px, cy: py, r: 6, fill: "var(--accent)" }, g);
        const pan = (x, y, label, side, color) => {
          K.svg("line", { x1: x, y1: y, x2: x - 34, y2: y + 46, stroke: "var(--label-3)", "stroke-width": 1 }, g);
          K.svg("line", { x1: x, y1: y, x2: x + 34, y2: y + 46, stroke: "var(--label-3)", "stroke-width": 1 }, g);
          K.svg("path", { d: "M" + (x - 44) + "," + (y + 46) + " Q" + x + "," + (y + 66) + " " + (x + 44) + "," + (y + 46) + " Z", fill: color, opacity: 0.85 }, g);
          K.text(g, x, y + 80, label, "s-text-strong");
          const here = visible().filter((it) => place.get(it.id) === side);
          here.slice(-4).forEach((it, j) => {
            const t = K.text(g, x, y + 36 - j * 13, it.short || (it.label.length > 18 ? it.label.slice(0, 17) + "…" : it.label), "s-text");
            t.style.fontSize = "9.5px";
          });
          if (here.length > 4) K.text(g, x, y + 36 - 4 * 13, "+" + (here.length - 4), "s-text").style.fontSize = "9.5px";
        };
        pan(lx, ly, p.left || "links", "left", "var(--accent-soft)");
        pan(rx, ry, p.right || "rechts", "right", "color-mix(in srgb, var(--orange) 22%, transparent)");
        if (chips) items.forEach((it) => {
          const pl = place.get(it.id);
          it.btn.classList.toggle("on", pl != null);
          it.btn.textContent = (pl === "left" ? "← " : "") + it.label + (pl === "right" ? " →" : "");
        });
        const lead = S.diff > 1e-9 ? (p.left || "links") + " wiegt schwerer" : S.diff < -1e-9 ? (p.right || "rechts") + " wiegt schwerer" : "Gleichgewicht";
        out.set(LW.esc(p.left || "links") + ": <b>" + fmt(S.L) + "</b> · " + LW.esc(p.right || "rechts") + ": <b>" + fmt(S.R) + "</b> · " + LW.esc(lead));
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, scope()),
        solve(goal) {
          const sv = (goal && goal.solve) || {};
          if (assign || sv.place) items.forEach((it) => place.set(it.id, it.side));
          Object.keys(sv).forEach((key) => {
            const m = /^w_(.+)$/.exec(key);
            if (m && w.has(m[1])) { w.set(m[1], sv[key]); if (sliders[m[1]]) sliders[m[1]].set(sv[key]); }
          });
          paint();
        },
        getVar(name) {
          if (name === "k") return k;
          const m = /^w_(.+)$/.exec(name);
          return m && w.has(m[1]) ? w.get(m[1]) : scope()[name];
        },
        setVar(name, v) {
          if (name === "k") k = K.clamp(v, 0, items.length);
          const m = /^w_(.+)$/.exec(name);
          if (m && w.has(m[1])) { w.set(m[1], v); if (sliders[m[1]]) sliders[m[1]].set(v); }
          paint();
        },
        lock() { locked = true; Object.values(sliders).forEach((s) => s.disable(true)); if (chips) chips.querySelectorAll("button").forEach((b) => { b.disabled = true; }); },
      };
    },
  });
})();
