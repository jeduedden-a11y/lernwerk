/* A graphic from the vault as a guided tour. The camera glides to the part of the picture the caption talks about:
 * an animation step drives the variables x and y (the point of the picture in the middle of the view, as fractions of
 * its width and height, 0 to 1), z (zoom, 1 shows the whole picture) and s (radius of a spotlight around that point;
 * 0 = off).
 *
 *   { "type": "anim", "widget": "bildtour", "params": { "image": "vault:Atommodelle.svg", "alt": "…", "aspect": 3.2 },
 *     "timeline": [{ "caption": "…", "to": { "x": 0.5, "y": 0.5, "z": 1 } },
 *                  { "caption": "…", "to": { "x": 0.13, "y": 0.55, "z": 3, "s": 0.3 }, "dur": 1300 }] }
 *
 * aspect is the width / height of the picture (known before it loads, so nothing jumps); stage sets the format of the
 * stage (default: like the picture, but at most 1.6 wide per unit of height, so wide diagrams get room when zoomed).
 * Vector graphics stay sharp when zoomed, and the picture follows light and dark mode (graphics.js). */
(function () {
  "use strict";
  const LW = window.LW;

  function vaultUrl(src) {
    return /^vault:/i.test(src) ? LW.vaultBase + encodeURIComponent(src.slice(6)).replace(/%2F/g, "/") : src;
  }

  LW.widget("bildtour", {
    mount(host, p, ctx) {
      const v = { x: 0.5, y: 0.5, z: 1, s: 0 };
      let pic = p.aspect > 0 ? p.aspect : 16 / 9;
      const stageFormat = () => (p.stage > 0 ? p.stage : pic > 1.6 ? 1.6 : pic < 0.75 ? 0.75 : pic);
      const stage = LW.el("div", { class: "w-tour" });
      const img = LW.el("img", { class: "w-tour-img", src: vaultUrl(p.image || ""), alt: p.alt || "" });
      const spot = LW.el("div", { class: "w-tour-spot" });
      stage.append(img, spot);
      host.append(stage);
      img.addEventListener("error", () => {
        stage.replaceWith(LW.el("div", { class: "lw-vault-missing", text: "Hier steht eine Grafik aus deinem Vault. Sie erscheint, sobald der Vault in den Einstellungen verbunden ist." }));
      });
      img.addEventListener("load", () => {
        if (!(p.aspect > 0) && img.naturalWidth && img.naturalHeight) { pic = img.naturalWidth / img.naturalHeight; paint(); }
      });
      if (window.GraphicFit && p.fit !== false) window.GraphicFit.fit(img);

      const clamp = (a, lo, hi) => Math.max(lo, Math.min(hi, a));
      function paint() {
        const fmt = stageFormat();
        stage.style.aspectRatio = String(fmt);
        // at zoom 1 the whole picture fits the stage; its size in percent of the stage
        const wPct = pic >= fmt ? 100 : (100 * pic) / fmt;
        const hPct = pic >= fmt ? (100 * fmt) / pic : 100;
        img.style.width = wPct + "%";
        img.style.height = hPct + "%";
        const z = Math.max(1, v.z);
        // the part of the picture in view, as a fraction of it; the view stays inside the picture
        const wx = 100 / wPct / z, wy = 100 / hPct / z;
        const x = wx >= 1 ? 0.5 : clamp(v.x, wx / 2, 1 - wx / 2);
        const y = wy >= 1 ? 0.5 : clamp(v.y, wy / 2, 1 - wy / 2);
        img.style.transform = "translate(" + ((50 * 100) / wPct - x * 100 * z) + "%, " + ((50 * 100) / hPct - y * 100 * z) + "%) scale(" + z + ")";
        const r = clamp(v.s, 0, 1);
        spot.style.opacity = r > 0.001 ? "1" : "0";
        spot.style.setProperty("--r", (r * 100).toFixed(2) + "%");
        // where the explained point sits on the stage (it leaves the middle when the view meets the edge)
        spot.style.setProperty("--cx", (50 + (v.x - x) * z * wPct).toFixed(2) + "%");
        spot.style.setProperty("--cy", (50 + (v.y - y) * z * hPct).toFixed(2) + "%");
      }
      paint();
      return {
        getVar: (name) => (name in v ? v[name] : NaN),
        setVar(name, value) { if (name in v && isFinite(value)) { v[name] = +value; paint(); } },
        act(name) { if (name === "reset") { v.x = 0.5; v.y = 0.5; v.z = 1; v.s = 0; paint(); } },
        solve() { v.x = 0.5; v.y = 0.5; v.z = 1; v.s = 0; paint(); },
        check: () => ({ ok: true }),
      };
    },
  });
})();
