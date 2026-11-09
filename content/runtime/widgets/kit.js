/* Shared helpers for widgets: SVG creation, scales, dragging, sliders, segmented controls, number formatting. */
(function () {
  "use strict";
  const LW = window.LW;
  const NS = "http://www.w3.org/2000/svg";
  const K = (LW.kit = {});

  K.svg = function (tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  K.root = function (host, w, h, label) {
    const s = K.svg("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": label || "" });
    host.appendChild(s);
    return s;
  };

  K.clear = function (g) { while (g.firstChild) g.removeChild(g.firstChild); };

  K.text = function (parent, x, y, str, cls, anchor) {
    const t = K.svg("text", { x, y, class: cls || "s-text", "text-anchor": anchor || "middle", "dominant-baseline": "middle" }, parent);
    t.textContent = str;
    return t;
  };

  /** Linear map from [d0,d1] to [r0,r1] with inverse. */
  K.scale = function (d0, d1, r0, r1) {
    const f = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
    f.inv = (p) => d0 + ((p - r0) / (r1 - r0)) * (d1 - d0);
    f.domain = [d0, d1];
    f.range = [r0, r1];
    return f;
  };

  /** Pointer position in SVG user coordinates. */
  K.point = function (svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };

  /** Makes target draggable; onMove receives SVG coordinates. Works with touch, pen and mouse. */
  K.drag = function (svg, target, onMove, onEnd) {
    let active = false;
    target.addEventListener("pointerdown", (e) => {
      active = true;
      target.setPointerCapture && target.setPointerCapture(e.pointerId);
      e.preventDefault();
      onMove(K.point(svg, e), e);
    });
    target.addEventListener("pointermove", (e) => { if (active) { e.preventDefault(); onMove(K.point(svg, e), e); } });
    const stop = (e) => { if (!active) return; active = false; if (onEnd) onEnd(K.point(svg, e), e); };
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  };

  const nf = (digits) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  K.fmt = function (x, digits) {
    if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "–";
    const s = nf(digits == null ? 3 : digits).format(Math.abs(x) < 1e-12 ? 0 : x);
    return s.replace("-", "−");
  };

  K.ticks = function (min, max, count) {
    const span = max - min;
    const step0 = span / Math.max(1, count || 6);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };

  /** iOS-style slider. opts: {label, min, max, step, value, format(v), onInput(v)} */
  K.slider = function (parent, opts) {
    const row = LW.el("div", { class: "lw-slider" });
    const lab = LW.el("label", { html: opts.labelHtml || LW.esc(opts.label || "") });
    const input = LW.el("input", { type: "range", min: opts.min, max: opts.max, step: opts.step || "any", value: opts.value, "aria-label": opts.aria || opts.label || "Regler" });
    const val = LW.el("span", { class: "val" });
    row.append(lab, input, val);
    parent.append(row);
    const fmt = opts.format || ((v) => K.fmt(v, 2));
    const paint = () => {
      const p = ((+input.value - opts.min) / (opts.max - opts.min)) * 100;
      input.style.setProperty("--p", p + "%");
      val.textContent = fmt(+input.value);
    };
    input.addEventListener("input", () => { paint(); if (opts.onInput) opts.onInput(+input.value); });
    paint();
    return {
      el: row, input,
      get: () => +input.value,
      set(v) { input.value = v; paint(); },
      disable(on) { input.disabled = !!on; row.style.opacity = on ? 0.5 : 1; },
    };
  };

  /** Segmented control made of pill buttons. items: [{id, label}] */
  K.segmented = function (parent, items, value, onChange) {
    const wrap = LW.el("div", { class: "w-btns", role: "tablist" });
    const btns = items.map((it) => {
      const b = LW.el("button", { class: "w-btn" + (it.id === value ? " on" : ""), type: "button", role: "tab", text: it.label });
      b.addEventListener("click", () => { set(it.id); onChange(it.id); });
      wrap.append(b);
      return b;
    });
    function set(id) { btns.forEach((b, i) => b.classList.toggle("on", items[i].id === id)); }
    parent.append(wrap);
    return { el: wrap, set };
  };

  K.button = function (parent, label, onClick) {
    const b = LW.el("button", { class: "w-btn", type: "button", text: label, onclick: onClick });
    parent.append(b);
    return b;
  };

  K.readout = function (parent) {
    const r = LW.el("div", { class: "w-readout", "aria-live": "polite" });
    parent.append(r);
    return { el: r, set(html) { r.innerHTML = html; } };
  };

  K.pill = (ok, text) => '<span class="w-pill ' + (ok ? "ok" : "no") + '">' + LW.esc(text) + "</span>";

  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.snap = (v, step) => (step ? Math.round(v / step) * step : v);

  K.arrow = function (parent, x1, y1, x2, y2, cls, width) {
    const g = K.svg("g", { class: cls }, parent);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const head = Math.min(11, len * 0.45);
    const bx = x2 - ux * head, by = y2 - uy * head;
    K.svg("line", { x1, y1, x2: bx, y2: by, "stroke-width": width || 3, "stroke-linecap": "round" }, g);
    K.svg("path", { d: "M" + x2 + "," + y2 + " L" + (bx - uy * head * 0.55) + "," + (by + ux * head * 0.55) + " L" + (bx + uy * head * 0.55) + "," + (by - ux * head * 0.55) + " Z", stroke: "none" }, g);
    return g;
  };
})();
