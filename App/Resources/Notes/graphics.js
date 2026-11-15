/* Graphics that follow light and dark mode. A diagram drawn for a light ground (dark ink, white or transparent
 * ground) gets a recoloured version for dark mode: dark ink turns light, white grounds and pale fills turn dark,
 * coloured lines keep their hue. A diagram drawn for a dark ground gets the reverse for light mode. Photos stay as
 * they are. SVGs are recoloured in their source (stays sharp), raster images pixel by pixel.
 *
 * Used by the lesson runtime (lw.js) and, as an identical copy, by the note view of the app
 * (App/Resources/Notes/graphics.js, loaded after notes.js): change both files together. */
(function () {
  "use strict";
  if (window.GraphicFit) return;

  const versions = new Map(); // url of the original -> Promise<{ tone, light, dark }>
  const fitted = new Set();
  let probe = null;

  // ---------------------------------------------------------------- colours
  function parseColor(value) {
    const s = String(value == null ? "" : value).trim();
    if (!s || /^(none|transparent|inherit|initial|unset|currentcolor|context-fill|context-stroke)$/i.test(s) || /^(url|var)\(/i.test(s)) return null;
    if (!probe) probe = document.createElement("canvas").getContext("2d");
    probe.fillStyle = "#010203";
    probe.fillStyle = s;
    const v = String(probe.fillStyle);
    if (v === "#010203" && s.toLowerCase() !== "#010203") return null;
    if (v[0] === "#") return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
    const m = /rgba?\(([^)]*)\)/i.exec(v);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (!s) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => {
      t = (t + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
  }
  function luminance(c) {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  /** A colour of a graphic for a light ground, made for a dark ground. */
  function forDark(c) {
    const [h, s, l] = rgb2hsl(c[0], c[1], c[2]);
    let L, S = s;
    if (l >= 0.8) { L = 0.12 + (1 - l) * 0.9; S = s * 0.6; } // grounds and pale fills: dark, a little tinted
    else if (l <= 0.25) L = 0.9 - l * 0.6; // ink: light
    else L = Math.min(0.8, Math.max(0.58, Math.max(l, 1 - l) + 0.06)); // coloured lines: same hue, a bit lighter
    return hsl2rgb(h, S, L).concat(c[3]);
  }
  /** A colour of a graphic for a dark ground, made for a light ground. */
  function forLight(c) {
    const [h, s, l] = rgb2hsl(c[0], c[1], c[2]);
    let L, S = s;
    if (l <= 0.2) { L = 0.97 - l * 0.4; S = s * 0.6; }
    else if (l >= 0.75) L = 0.1 + (1 - l) * 0.6;
    else L = Math.max(0.3, Math.min(0.5, Math.min(l, 1 - l) - 0.04));
    return hsl2rgb(h, S, L).concat(c[3]);
  }
  const css = (c) => (c[3] >= 1 ? "#" + c.slice(0, 3).map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")
    : "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + c[3] + ")");

  // ---------------------------------------------------------------- SVG
  const COLOR_ATTRS = ["fill", "stroke", "stop-color", "flood-color", "lighting-color", "color"];
  const STYLE_PROP = /(^|[;{\s])(fill|stroke|stop-color|flood-color|lighting-color|color|background-color|background)\s*:\s*([^;}!]+)/gi;
  function parseSvg(text) {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const svg = doc.documentElement;
    if (!svg || svg.localName !== "svg" || doc.getElementsByTagName("parsererror").length) return null;
    for (const n of [...svg.querySelectorAll("script, foreignObject")]) n.remove();
    for (const n of [svg, ...svg.querySelectorAll("*")]) {
      for (const a of [...n.attributes]) if (/^on/i.test(a.name) || (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
    }
    return svg;
  }
  function styled(n, prop) {
    const st = n.getAttribute("style");
    if (st) {
      const m = new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([^;]+)", "i").exec(st);
      if (m) return m[1].trim();
    }
    return n.getAttribute(prop);
  }
  function inherited(n, prop) {
    for (let e = n; e && e.nodeType === 1; e = e.parentNode) {
      const v = styled(e, prop);
      if (v != null) return v;
    }
    return null;
  }
  const num = (v) => { const x = parseFloat(v); return isFinite(x) ? x : null; };
  /** "light" for a graphic drawn for a light ground, "dark" for one drawn for a dark ground. */
  function svgTone(svg) {
    const vb = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(parseFloat);
    const W = vb.length === 4 && vb[2] > 0 ? vb[2] : num(svg.getAttribute("width")) || 0;
    const H = vb.length === 4 && vb[3] > 0 ? vb[3] : num(svg.getAttribute("height")) || 0;
    // a background that covers the picture decides
    for (const r of [...svg.querySelectorAll(":scope > rect, :scope > g > rect")].slice(0, 12)) {
      const w = r.getAttribute("width"), h = r.getAttribute("height");
      const full = (w === "100%" || (W && num(w) >= 0.9 * W)) && (h === "100%" || (H && num(h) >= 0.9 * H));
      const c = full && parseColor(styled(r, "fill") || "#000");
      if (c && c[3] > 0.85) return luminance(c) > 0.35 ? "light" : "dark";
    }
    // otherwise the ink: text weighs with its length, lines a little
    let sum = 0, weight = 0;
    for (const t of [...svg.querySelectorAll("text")].slice(0, 400)) {
      const len = Math.min(60, (t.textContent || "").trim().length);
      if (!len) continue;
      const c = parseColor(inherited(t, "fill") || "#000");
      if (c) { sum += luminance(c) * len; weight += len; }
    }
    for (const e of [...svg.querySelectorAll("line, polyline, path, circle, ellipse, rect, polygon")].slice(0, 800)) {
      const c = parseColor(inherited(e, "stroke"));
      if (c) { sum += luminance(c) * 2; weight += 2; }
    }
    if (!weight) return "light";
    return sum / weight < 0.4 ? "light" : "dark";
  }
  function recolorSvg(svg, map) {
    const conv = (v) => { const c = parseColor(v); return c ? css(map(c)) : v; };
    const fixStyle = (text) => text.replace(STYLE_PROP, (m, pre, prop, val) => pre + prop + ":" + conv(val.trim()));
    for (const n of [svg, ...svg.querySelectorAll("*")]) {
      for (const a of COLOR_ATTRS) {
        const v = n.getAttribute(a);
        if (v != null) n.setAttribute(a, conv(v));
      }
      const st = n.getAttribute("style");
      if (st) n.setAttribute("style", fixStyle(st));
      if (n.localName === "style") n.textContent = fixStyle(n.textContent);
    }
    // the defaults of SVG: black fill, black currentColor
    const black = css(map([0, 0, 0, 1]));
    if (styled(svg, "fill") == null) svg.setAttribute("fill", black);
    if (styled(svg, "color") == null) svg.setAttribute("color", black);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  // ---------------------------------------------------------------- raster images
  function loaded(img) {
    return new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) return resolve(img);
      img.addEventListener("load", () => resolve(img), { once: true });
      img.addEventListener("error", () => reject(new Error("load")), { once: true });
    });
  }
  function rasterTone(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return null;
    const s = Math.min(1, 96 / Math.max(w, h)), cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
    const cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, cw, ch);
    const d = g.getImageData(0, 0, cw, ch).data;
    let n = 0, clear = 0, light = 0, dark = 0, edge = 0, edgeLight = 0, edgeDark = 0, edgeClear = 0, ink = 0, inkW = 0;
    const bins = new Set();
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = (y * cw + x) * 4, a = d[i + 3] / 255, onEdge = x < 2 || y < 2 || x >= cw - 2 || y >= ch - 2;
        n++;
        if (onEdge) edge++;
        if (a < 0.15) { clear++; if (onEdge) edgeClear++; continue; }
        const c = [d[i], d[i + 1], d[i + 2]], lum = luminance(c), sat = rgb2hsl(c[0], c[1], c[2])[1];
        if (lum > 0.8 && sat < 0.25) { light++; if (onEdge) edgeLight++; }
        else if (lum < 0.03) { dark++; if (onEdge) edgeDark++; }
        ink += lum * a; inkW += a;
        bins.add(((c[0] >> 4) << 8) | ((c[1] >> 4) << 4) | (c[2] >> 4));
      }
    }
    if (clear / n > 0.2 && edgeClear / edge > 0.5) return inkW && ink / inkW < 0.4 ? "light" : "dark";
    if (edgeLight / edge > 0.7 && light / n > 0.35 && bins.size < 900) return "light";
    if (edgeDark / edge > 0.7 && dark / n > 0.35 && bins.size < 900) return "dark";
    return "photo";
  }
  function recolorRaster(img, map) {
    const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const cw = Math.max(1, Math.round(img.naturalWidth * s)), ch = Math.max(1, Math.round(img.naturalHeight * s));
    const cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, cw, ch);
    const data = g.getImageData(0, 0, cw, ch), d = data.data, memo = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      let c = memo.get(key);
      if (!c) { c = map([d[i], d[i + 1], d[i + 2], 1]); memo.set(key, c); }
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    g.putImageData(data, 0, 0);
    return cv.toDataURL("image/png");
  }

  // ---------------------------------------------------------------- versions and fitting
  function appearance() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  const isSvgUrl = (url) => { let u = url; try { u = decodeURIComponent(url); } catch (e) { /* keep */ } return /\.svg(\b|$)/i.test(u.split("#")[0]); };
  function versionsFor(url, img) {
    if (versions.has(url)) return versions.get(url);
    const p = (async () => {
      if (isSvgUrl(url)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("load");
        const text = await res.text();
        const svg = parseSvg(text);
        if (!svg) return { tone: "unknown", light: url, dark: url };
        const tone = svgTone(svg);
        const other = recolorSvg(svg, tone === "light" ? forDark : forLight);
        return tone === "light" ? { tone, light: url, dark: other } : { tone, light: other, dark: url };
      }
      await loaded(img);
      const tone = rasterTone(img);
      if (tone !== "light" && tone !== "dark") return { tone: "photo", light: url, dark: url };
      const other = recolorRaster(img, tone === "light" ? forDark : forLight);
      return tone === "light" ? { tone, light: url, dark: other } : { tone, light: other, dark: url };
    })();
    versions.set(url, p);
    p.catch(() => versions.delete(url));
    return p;
  }
  function show(img) {
    const v = img._fit, want = v && v[appearance()];
    if (want && img.getAttribute("src") !== want) img.setAttribute("src", want);
  }
  /** Lets an <img> follow light and dark mode. */
  function fit(img, url) {
    url = url || img.getAttribute("src");
    if (!url || /^data:/i.test(url)) return;
    img.dataset.fit = "pending";
    const timer = setTimeout(() => { if (img.dataset.fit === "pending") img.dataset.fit = "unknown"; }, 1500);
    versionsFor(url, img).then((v) => {
      clearTimeout(timer);
      img._fit = v;
      fitted.add(img);
      show(img);
      img.dataset.fit = v.tone;
    }).catch(() => { clearTimeout(timer); img.dataset.fit = "unknown"; });
  }
  function refresh() {
    for (const img of [...fitted]) {
      if (!img.isConnected) { fitted.delete(img); continue; }
      show(img);
    }
  }
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", refresh); else if (mq.addListener) mq.addListener(refresh);
  }
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  window.GraphicFit = { fit, refresh, appearance, parseSvg, svgTone, recolorSvg, rasterTone, forDark, forLight, parseColor };

  // note view of the app (notes.js renders figures as .figure > img): they follow the appearance as well
  if (window.TW && typeof window.TW.render === "function" && !window.TW.fitted) {
    const render = window.TW.render;
    window.TW.fitted = true;
    window.TW.render = function () {
      const out = render.apply(this, arguments);
      for (const fig of document.querySelectorAll(".figure")) {
        const img = fig.querySelector("img");
        if (!img || fig.dataset.fitted) continue;
        fig.dataset.fitted = "1";
        fit(img);
      }
      return out;
    };
  }
})();
