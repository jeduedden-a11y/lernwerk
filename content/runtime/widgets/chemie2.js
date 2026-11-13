/* Chemistry views for organic chemistry and biochemistry.
 *
 *   glucose:    ring closure of D-glucose, from the Fischer projection over the turned chain and the nucleophilic attack
 *               to the Haworth projection, with the anomers alpha and beta.
 *               params: t (0 Fischer, 1 turned chain, 2 attack, 3 Haworth), anomer ("alpha" | "beta"), controls (default true)
 *               scope:  t, stage (rounded t), beta (1 or 0)
 *   molecule3d: molecules in 3D, turned with a finger; lone pairs, double bonds, chair forms, mirror images.
 *               params: molecule (key) or molecules ([keys]), mirror (true: the mirror image beside it), spin, yaw, pitch
 *               keys:   methan, ammoniak, wasser, co2, ethen, ethin, milchsaeure, cyclohexan, glucose
 *               scope:  yaw, pitch (degrees), alpha (glucose: 1 when the OH group at C1 is axial), index
 *   protein:    folding of a protein chain: primary, secondary, tertiary and quaternary structure; heat denatures it.
 *               params: stage (0 to 3), heat (0 to 1), controls
 *               scope:  stage, heat
 *   mechanism:  a reaction mechanism step by step; the learner sets the electron arrows (tap the electron pair or the
 *               bond, then where the electrons go).
 *               params: mechanism (sn2, sn1, addition, halbacetal, veresterung)
 *               scope:  solved (1 when every step is right), step
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;
  const lerp = (a, b, f) => a + (b - a) * f;
  const smooth = (x) => { x = K.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const strip = (html) => html.replace(/^<p>|<\/p>$/g, "");

  function goalCheck(goal, scope) {
    let ok = false;
    try { ok = !!LW.expr((goal && goal.when) || "0")(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of (goal && goal.hints) || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: h.text }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: (goal && goal.message) || null };
  }

  /** Glides a value to a target; with reduced motion it jumps. Returns a function that stops the glide. */
  function glide(get, set, target, ms) {
    if (LW.reduceMotion && LW.reduceMotion()) { set(target); return () => {}; }
    const from = get(), t0 = performance.now();
    let stop = false;
    function frame(now) {
      if (stop) return;
      const f = Math.min(1, (now - t0) / ms);
      set(from + (target - from) * (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2));
      if (f < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return () => { stop = true; };
  }

  /** Curved electron arrow from (x1,y1) to (x2,y2); bend pushes the middle sideways. */
  function curvedArrow(parent, x1, y1, x2, y2, bend, color, width, half) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend;
    const tx = x2 - cx, ty = y2 - cy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, head = 10;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const g = K.svg("g", null, parent);
    K.svg("path", { d: "M" + x1 + "," + y1 + " Q" + cx + "," + cy + " " + bx + "," + by, fill: "none", stroke: color, "stroke-width": width || 2.2, "stroke-linecap": "round" }, g);
    const tip = half
      ? "M" + x2 + "," + y2 + " L" + (bx - uy * head * 0.6) + "," + (by + ux * head * 0.6) + " L" + bx + "," + by + " Z"
      : "M" + x2 + "," + y2 + " L" + (bx - uy * head * 0.5) + "," + (by + ux * head * 0.5) + " L" + (bx + uy * head * 0.5) + "," + (by - ux * head * 0.5) + " Z";
    K.svg("path", { d: tip, fill: color }, g);
    return { g, d: "M" + x1 + "," + y1 + " Q" + cx + "," + cy + " " + x2 + "," + y2 };
  }

  /** Atom label with a background disc, so bonds end cleanly. */
  function atomLabel(parent, x, y, text, opts) {
    const o = opts || {};
    const w = Math.max(16, text.length * 8.4 + 6);
    K.svg("rect", { x: x - w / 2, y: y - 10, width: w, height: 20, rx: 10, fill: "var(--card-solid)", opacity: o.opacity == null ? 1 : o.opacity }, parent);
    const t = K.text(parent, x, y + 0.5, text, "s-text-strong");
    t.style.fontSize = (o.size || 14) + "px";
    if (o.color) t.style.fill = o.color;
    if (o.opacity != null) t.style.opacity = o.opacity;
    return t;
  }

  function sub(s) { return s.replace(/2/g, "₂").replace(/3/g, "₃"); }

  // ------------------------------------------------------------------ glucose: ring closure
  // positions per key frame: Fischer projection, turned chain, attack, Haworth projection
  const GLU = {
    C1: [[170, 36], [262, 141], [256, 141], [250, 141]],
    C2: [[170, 76], [214, 184], [212, 183], [210, 182]],
    C3: [[170, 116], [130, 184], [130, 183], [130, 182]],
    C4: [[170, 156], [88, 141], [89, 141], [90, 141]],
    C5: [[170, 196], [128, 96], [129, 98], [130, 100]],
    C6: [[170, 236], [128, 62], [129, 64], [130, 66]],
    O5: [[214, 196], [190, 76], [212, 94], [210, 100]],
    H5: [[126, 196], [128, 122], [129, 123], [130, 124]],
    O1: [[206, 14], [300, 116], [296, 120], null],
    H1: [[134, 14], [290, 172], [284, 174], null],
    O2: [[214, 76], [214, 216], [212, 215], [210, 214]],
    H2: [[126, 76], [214, 158], [212, 157], [210, 156]],
    O3: [[126, 116], [130, 158], [130, 157], [130, 156]],
    H3: [[214, 116], [130, 216], [130, 215], [130, 214]],
    O4: [[214, 156], [88, 174], [89, 174], [90, 174]],
    H4: [[126, 156], [88, 108], [89, 108], [90, 108]],
  };
  const GLU_UP1 = [250, 108], GLU_DOWN1 = [250, 174];
  const GLU_BONDS = [["C1", "C2"], ["C2", "C3"], ["C3", "C4"], ["C4", "C5"], ["C5", "C6"], ["C5", "O5"], ["C5", "H5"], ["C1", "H1"], ["C1", "O1"],
    ["C2", "O2"], ["C2", "H2"], ["C3", "O3"], ["C3", "H3"], ["C4", "O4"], ["C4", "H4"], ["O5", "C1"]];
  const GLU_TEXT = [
    "**Fischer-Projektion** der offenkettigen D-Glucose: C1 trägt die Aldehydgruppe, die OH-Gruppe am untersten Stereozentrum C5 steht rechts, daher **D**.",
    "Die Kette **dreht sich**: Um die Bindung C4–C5 gedreht, kommt die OH-Gruppe an C5 in die Nähe des Carbonyl-C-Atoms C1.",
    "**Nucleophiler Angriff**: Ein freies Elektronenpaar des O-Atoms an C5 greift das positiv polarisierte C1 an, die C=O-Doppelbindung klappt auf. Es entsteht ein **Halbacetal**.",
    "**Haworth-Projektion**: ein Sechsring aus fünf C-Atomen und einem O-Atom (Pyranose). C1 ist ein neues Stereozentrum, das **anomere C-Atom**.",
  ];

  LW.widget("glucose", {
    mount(host, p, ctx) {
      let t = K.clamp(p.t == null ? 0 : +p.t, 0, 3), beta = p.anomer === "alpha" ? 0 : 1, locked = false, stopGlide = () => {};
      const W = 360, H = 262;
      const svg = K.root(host, W, H, p.aria || "Ringschluss der Glucose");
      svg.style.maxWidth = "470px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const stages = [{ id: 0, label: "Kette" }, { id: 1, label: "Drehen" }, { id: 2, label: "Angriff" }, { id: 3, label: "Ring" }];
      const seg = p.controls === false ? null : K.segmented(ctrl, stages, Math.round(t), (id) => {
        if (locked) return;
        stopGlide();
        stopGlide = glide(() => t, (v) => { t = v; paint(); }, id, 900);
        ctx.changed();
      });
      const ano = p.controls === false ? null : K.segmented(ctrl, [{ id: 0, label: "α-Glucose" }, { id: 1, label: "β-Glucose" }], beta, (id) => {
        if (locked) return;
        beta = id; paint(); ctx.changed();
      });

      const pos = (name) => {
        const fr = GLU[name].slice();
        if (name === "O1") fr[3] = beta ? GLU_UP1 : GLU_DOWN1;
        if (name === "H1") fr[3] = beta ? GLU_DOWN1 : GLU_UP1;
        const i = Math.min(2, Math.floor(t)), f = smooth(t - i);
        return [lerp(fr[i][0], fr[i + 1][0], f), lerp(fr[i][1], fr[i + 1][1], f)];
      };

      function paint() {
        K.clear(g);
        const P = {};
        Object.keys(GLU).forEach((k) => { P[k] = pos(k); });
        const ring = smooth((t - 1.9) / 0.6);
        const front = smooth(t - 2);
        const isC = (k) => /^C[1-5]$/.test(k);
        // bonds first, shortened at labelled ends
        GLU_BONDS.forEach(([a, b]) => {
          let [x1, y1] = P[a], [x2, y2] = P[b];
          const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
          const cut = (k) => (isC(k) ? 0 : k === "C6" ? 13 : 9);
          x1 += ux * cut(a); y1 += uy * cut(a); x2 -= ux * cut(b); y2 -= uy * cut(b);
          const frontBond = (a === "C1" && b === "C2") || (a === "C2" && b === "C3") || (a === "C3" && b === "C4");
          const opacity = a === "O5" && b === "C1" ? ring : 1;
          if (opacity < 0.02) return;
          K.svg("line", { x1, y1, x2, y2, stroke: "var(--label)", "stroke-width": frontBond ? 2 + 3 * front : 2, "stroke-linecap": "round", opacity }, g);
          if (a === "C1" && b === "O1" && ring < 0.98) {
            // the second line of the C=O double bond fades as the ring closes
            K.svg("line", { x1: x1 - uy * 5, y1: y1 + ux * 5, x2: x2 - uy * 5, y2: y2 + ux * 5, stroke: "var(--label)", "stroke-width": 2, "stroke-linecap": "round", opacity: 1 - ring }, g);
          }
        });
        // electron arrows during the attack
        const arrows = Math.max(0, 1 - Math.abs(t - 2) / 0.45);
        if (arrows > 0.03) {
          const ag = K.svg("g", { opacity: arrows }, g);
          const [ox, oy] = P.O5, [c1x, c1y] = P.C1, [o1x, o1y] = P.O1;
          curvedArrow(ag, ox + 4, oy + 10, c1x - 8, c1y - 6, -18, "var(--red)", 2.2);
          curvedArrow(ag, (c1x + o1x) / 2 - 4, (c1y + o1y) / 2 + 2, o1x - 6, o1y + 8, 16, "var(--red)", 2.2);
          K.text(ag, ox - 10, oy - 14, "δ−", "s-text").style.fill = "var(--red)";
          K.text(ag, c1x + 14, c1y + 4, "δ+", "s-text").style.fill = "var(--blue)";
        }
        // the new stereocentre
        if (front > 0.05) K.svg("circle", { cx: P.C1[0], cy: P.C1[1], r: 13, fill: "none", stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "3 3", opacity: front }, g);
        // carbons as numbered nodes, the rest as labels
        Object.keys(P).forEach((k) => {
          const [x, y] = P[k];
          if (isC(k)) {
            K.svg("circle", { cx: x, cy: y, r: 7.5, fill: "var(--card-solid)", stroke: "var(--label-2)", "stroke-width": 1.2 }, g);
            const n = K.text(g, x, y + 0.5, k.slice(1), "s-text");
            n.style.fontSize = "9.5px";
            return;
          }
          const carbon = { O2: "C2", O3: "C3", O4: "C4" }[k];
          let text = k[0] === "H" ? "H" : k === "C6" ? "CH₂OH" : "OH";
          if (k === "O5") text = ring > 0.5 ? "O" : "OH";
          if (k === "O1") text = ring > 0.5 ? "OH" : "O";
          if (carbon && x < P[carbon][0] - 8) text = "HO";
          atomLabel(g, x, y, text, { color: k[0] === "O" ? "var(--red)" : null, size: k[0] === "H" ? 13 : 14 });
        });
        const head = t < 1.5 ? "Fischer-Projektion" : t < 2.5 ? "Ringschluss" : "Haworth-Projektion";
        K.text(g, 12, 16, head, "s-text-strong", "start");
        if (t >= 2.5) K.text(g, 12, 34, (beta ? "β" : "α") + "-D-Glucopyranose", "s-text", "start");
        const stage = Math.round(t);
        let txt = GLU_TEXT[stage];
        if (stage === 3) {
          txt += beta
            ? " Bei **β** steht die OH-Gruppe an C1 **oben**, auf derselben Seite wie die CH₂OH-Gruppe."
            : " Bei **α** steht die OH-Gruppe an C1 **unten**, der CH₂OH-Gruppe gegenüber.";
          txt += " In Wasser öffnet und schließt sich der Ring ständig: etwa 36 % α, 64 % β, unter 1 % offenkettig (Mutarotation).";
        }
        out.set(strip(LW.md(txt)));
        if (seg) seg.set(stage);
        if (ano) ano.set(beta);
      }
      paint();
      const scope = () => ({ t, stage: Math.round(t), beta });
      return {
        check: (goal) => goalCheck(goal, scope()),
        solve(goal) {
          const sv = (goal && goal.solve) || {};
          stopGlide();
          if (sv.stage != null) t = K.clamp(+sv.stage, 0, 3);
          if (sv.beta != null) beta = sv.beta ? 1 : 0;
          paint();
        },
        getVar: (k) => (k === "t" ? t : k === "beta" ? beta : scope()[k]),
        setVar(k, v) {
          stopGlide();
          if (k === "t") t = K.clamp(+v, 0, 3);
          if (k === "beta") beta = v >= 0.5 ? 1 : 0;
          paint();
        },
        lock() {
          locked = true;
          [seg, ano].forEach((s) => s && s.el.querySelectorAll("button").forEach((b) => { b.disabled = true; }));
        },
        leave() { stopGlide(); },
      };
    },
  });

  // ------------------------------------------------------------------ molecule3d
  const CPK = { H: ["#f5f5f7", 0.42], C: ["#4a4a52", 0.62], N: ["#3b6fe0", 0.6], O: ["#e5483f", 0.6], OH: ["#e5483f", 0.66], CH3: ["#5b5b63", 0.74],
    CH2OH: ["#6b6b73", 0.78], COOH: ["#c7463f", 0.82] };
  const TEXT = { OH: "OH", CH3: "CH₃", CH2OH: "CH₂OH", COOH: "COOH", C: "C", N: "N", O: "O" };
  function chair(r, z) {
    return [0, 1, 2, 3, 4, 5].map((k) => [r * Math.cos((k * Math.PI) / 3), r * Math.sin((k * Math.PI) / 3), k % 2 ? -z : z]);
  }
  function axialEq(ring, k) {
    const [x, y, z] = ring[k], s = z > 0 ? 1 : -1;
    return { ax: [x, y, z + s * 1.1], eq: [x * 1.78, y * 1.78, z - s * 0.38] };
  }
  const MOL = {
    methan: { name: "Methan", formula: "CH₄", angle: "109,5°", note: "**Tetraeder**: vier bindende Elektronenpaare stoßen sich ab und gehen so weit wie möglich auseinander.",
      atoms: [["C", 0, 0, 0], ["H", 0.63, 0.63, 0.63], ["H", -0.63, -0.63, 0.63], ["H", -0.63, 0.63, -0.63], ["H", 0.63, -0.63, -0.63]],
      bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    ammoniak: { name: "Ammoniak", formula: "NH₃", angle: "etwa 107°", note: "**Trigonale Pyramide**: drei bindende und ein freies Elektronenpaar. Das freie Paar braucht mehr Platz und drückt die Bindungen zusammen.",
      atoms: [["N", 0, 0.12, 0], ["H", 0.94, -0.27, 0], ["H", -0.47, -0.27, 0.814], ["H", -0.47, -0.27, -0.814]], bonds: [[0, 1], [0, 2], [0, 3]], pairs: [[0, 0, 1, 0]] },
    wasser: { name: "Wasser", formula: "H₂O", angle: "etwa 104,5°", note: "**Gewinkelt**: zwei bindende und zwei freie Elektronenpaare. Der Winkel macht das Molekül zum Dipol.",
      atoms: [["O", 0, 0.1, 0], ["H", 0.757, -0.49, 0], ["H", -0.757, -0.49, 0]], bonds: [[0, 1], [0, 2]], pairs: [[0, 0, 0.6, 0.75], [0, 0, 0.6, -0.75]] },
    co2: { name: "Kohlenstoffdioxid", formula: "CO₂", angle: "180°", note: "**Linear**: zwei Doppelbindungen. Jede Bindung ist polar, die beiden Dipole heben sich aber auf.",
      atoms: [["C", 0, 0, 0], ["O", 1.16, 0, 0], ["O", -1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]] },
    ethen: { name: "Ethen", formula: "C₂H₄", angle: "etwa 120°", note: "**Eben**: alle sechs Atome liegen in einer Ebene. Die Doppelbindung lässt keine Drehung zu, daher gibt es cis-trans-Isomere.",
      atoms: [["C", 0.67, 0, 0], ["C", -0.67, 0, 0], ["H", 1.23, 0.92, 0], ["H", 1.23, -0.92, 0], ["H", -1.23, 0.92, 0], ["H", -1.23, -0.92, 0]],
      bonds: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]] },
    ethin: { name: "Ethin", formula: "C₂H₂", angle: "180°", note: "**Linear**: die Dreifachbindung hält die vier Atome auf einer Geraden.",
      atoms: [["C", 0.6, 0, 0], ["C", -0.6, 0, 0], ["H", 1.66, 0, 0], ["H", -1.66, 0, 0]], bonds: [[0, 1, 3], [0, 2], [1, 3]] },
    milchsaeure: { name: "Milchsäure", formula: "CH₃–CH(OH)–COOH", angle: "109,5°", chiral: true,
      note: "Das mittlere C-Atom trägt **vier verschiedene** Gruppen: es ist ein **Stereozentrum**. Bild und Spiegelbild lassen sich durch keine Drehung zur Deckung bringen: zwei **Enantiomere**.",
      atoms: [["C", 0, 0, 0], ["H", 0.68, 0.68, 0.68], ["OH", -0.82, -0.82, 0.82], ["CH3", -0.86, 0.86, -0.86], ["COOH", 0.9, -0.9, -0.9]], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  };
  (function () {
    // chair forms: cyclohexane with axial and equatorial hydrogen atoms, beta-D-glucopyranose with every large group equatorial
    const ring = chair(1.25, 0.26);
    const cy = { name: "Cyclohexan", formula: "C₆H₁₂", angle: "etwa 111°", chair: true, view: [18, -58],
      note: "**Sesselform**: spannungsfrei, alle Winkel nahe am Tetraederwinkel. **Axiale** H-Atome (orange) zeigen senkrecht nach oben oder unten, **äquatoriale** (blau) nach außen.",
      atoms: ring.map((v) => ["C"].concat(v)), bonds: [], tags: [] };
    for (let k = 0; k < 6; k++) cy.bonds.push([k, (k + 1) % 6]);
    for (let k = 0; k < 6; k++) {
      const s = axialEq(ring, k);
      cy.atoms.push(["H"].concat(s.ax)); cy.tags[cy.atoms.length - 1] = "ax"; cy.bonds.push([k, cy.atoms.length - 1]);
      cy.atoms.push(["H"].concat(s.eq)); cy.tags[cy.atoms.length - 1] = "eq"; cy.bonds.push([k, cy.atoms.length - 1]);
    }
    MOL.cyclohexan = cy;
    // ring order C1, C2, C3, C4, C5, O5
    const gl = { name: "Glucose", formula: "C₆H₁₂O₆", angle: "etwa 110°", chair: true, glucose: true, view: [18, -58], atoms: [], bonds: [], tags: [], labels: [] };
    ring.forEach((v, k) => { gl.atoms.push([k === 5 ? "O" : "C"].concat(v)); gl.labels[k] = k === 5 ? "O5" : "C" + (k + 1); });
    for (let k = 0; k < 6; k++) gl.bonds.push([k, (k + 1) % 6]);
    const big = ["OH", "OH", "OH", "OH", "CH2OH"];
    for (let k = 0; k < 5; k++) {
      const s = axialEq(ring, k);
      gl.atoms.push([big[k]].concat(s.eq)); gl.tags[gl.atoms.length - 1] = k === 0 ? "c1eq" : "eq"; gl.bonds.push([k, gl.atoms.length - 1]);
      gl.atoms.push(["H"].concat(s.ax)); gl.tags[gl.atoms.length - 1] = k === 0 ? "c1ax" : "ax"; gl.bonds.push([k, gl.atoms.length - 1]);
    }
    MOL.glucose = gl;
  })();

  LW.widget("molecule3d", {
    mount(host, p, ctx) {
      const keys = (p.molecules || [p.molecule || "methan"]).filter((k) => MOL[k]);
      if (!keys.length) keys.push("methan");
      let index = 0, yaw = ((p.yaw == null ? 25 : p.yaw) * Math.PI) / 180, pitch = ((p.pitch == null ? -15 : p.pitch) * Math.PI) / 180;
      let alpha = p.anomer === "alpha" ? 1 : 0, marks = p.marks !== false, locked = false, spinning = !!p.spin, raf = 0, touched = false;
      const W = 360, H = p.mirror ? 230 : 250;
      const svg = K.root(host, W, H, p.aria || "Molekül in drei Dimensionen, mit dem Finger drehbar");
      svg.style.maxWidth = "470px"; svg.style.margin = "0 auto"; svg.style.cursor = "grab";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const view = (k) => { const v = MOL[k].view || [25, -15]; yaw = (v[0] * Math.PI) / 180; pitch = (v[1] * Math.PI) / 180; };
      if (p.yaw == null && p.pitch == null) view(keys[0]);
      const seg = keys.length > 1 ? K.segmented(ctrl, keys.map((k, i) => ({ id: i, label: MOL[k].name })), 0, (id) => { if (locked) return; index = id; view(keys[id]); paint(); ctx.changed(); }) : null;
      let ano = null;
      const extra = LW.el("div");
      ctrl.append(extra);

      function geometry(m) {
        const atoms = m.atoms.map((a) => a.slice());
        if (m.glucose && alpha) {
          // alpha: the OH group at C1 swaps with the hydrogen atom into the axial position
          const iEq = m.tags.indexOf("c1eq"), iAx = m.tags.indexOf("c1ax");
          const e = atoms[iEq].slice(1), a = atoms[iAx].slice(1);
          atoms[iEq] = [atoms[iEq][0]].concat(a);
          atoms[iAx] = [atoms[iAx][0]].concat(e);
        }
        return atoms;
      }
      function project(v, yw, pt) {
        const cyw = Math.cos(yw), syw = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt);
        const x = v[0] * cyw + v[2] * syw, z0 = -v[0] * syw + v[2] * cyw, y = v[1];
        const y2 = y * cp - z0 * sp, z2 = y * sp + z0 * cp;
        const persp = 8 / (8 - z2);
        return { x: x * persp, y: y2 * persp, z: z2, s: persp };
      }
      function fit(m, box) {
        // the largest distance from the centre decides the scale, so every molecule fills the picture without spilling
        const r = Math.max.apply(null, m.atoms.map((a) => Math.hypot(a[1], a[2], a[3]))) + 0.45;
        return box / (r * 1.25);
      }
      function drawMolecule(m, ox, oy, scale, flip, yw, pt) {
        const atoms = geometry(m);
        const pts = atoms.map((a) => {
          const v = [flip ? -a[1] : a[1], a[2], a[3]];
          const q = project(v, yw, pt);
          return { el: a[0], sx: ox + q.x * scale, sy: oy - q.y * scale, z: q.z, s: q.s };
        });
        const items = [];
        (m.bonds || []).forEach(([i, j, order]) => items.push({ z: (pts[i].z + pts[j].z) / 2 - 0.05, kind: "bond", i, j, order: order || 1 }));
        pts.forEach((q, i) => items.push({ z: q.z, kind: "atom", i }));
        (m.pairs || []).forEach(([i, dx, dy, dz]) => {
          const a = atoms[i];
          const v = [flip ? -(a[1] + dx * 0.55) : a[1] + dx * 0.55, a[2] + dy * 0.55, a[3] + dz * 0.55];
          const q = project(v, yw, pt);
          items.push({ z: q.z, kind: "pair", sx: ox + q.x * scale, sy: oy - q.y * scale, s: q.s, ax: pts[i].sx, ay: pts[i].sy });
        });
        items.sort((a, b) => a.z - b.z);
        items.forEach((it) => {
          if (it.kind === "bond") {
            const A = pts[it.i], B = pts[it.j];
            const dx = B.sx - A.sx, dy = B.sy - A.sy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
            const w = 4.2 * (A.s + B.s) / 2;
            const offs = it.order === 1 ? [0] : it.order === 2 ? [-3.2, 3.2] : [-5, 0, 5];
            offs.forEach((o) => K.svg("line", { x1: A.sx + nx * o, y1: A.sy + ny * o, x2: B.sx + nx * o, y2: B.sy + ny * o, stroke: "#9a9aa2", "stroke-width": it.order === 1 ? w : w * 0.62, "stroke-linecap": "round" }, g));
          } else if (it.kind === "pair") {
            const ang = (Math.atan2(it.sy - it.ay, it.sx - it.ax) * 180) / Math.PI;
            K.svg("ellipse", { cx: it.sx, cy: it.sy, rx: 15 * it.s, ry: 8.5 * it.s, fill: "var(--accent)", opacity: 0.22, transform: "rotate(" + ang + " " + it.sx + " " + it.sy + ")" }, g);
            [-3.5, 3.5].forEach((o) => K.svg("circle", { cx: it.sx + Math.cos(((ang + 90) * Math.PI) / 180) * o, cy: it.sy + Math.sin(((ang + 90) * Math.PI) / 180) * o, r: 2.2, fill: "var(--accent)" }, g));
          } else {
            const q = pts[it.i], spec = CPK[q.el] || CPK.C;
            let fill = spec[0];
            const tag = m.tags && m.tags[it.i];
            if (marks && m.chair && q.el === "H" && tag) fill = /ax/.test(tag) ? "#ff9f0a" : "#0a84ff";
            if (marks && m.glucose && q.el !== "H" && tag) fill = tag === "eq" || tag === "c1eq" ? (q.el === "CH2OH" ? "#4a7bd0" : "#e5483f") : "#e5483f";
            const r = spec[1] * 0.42 * q.s * scale;
            K.svg("circle", { cx: q.sx, cy: q.sy, r, fill, stroke: "rgba(0,0,0,0.25)", "stroke-width": 1 }, g);
            K.svg("circle", { cx: q.sx - r * 0.32, cy: q.sy - r * 0.34, r: r * 0.32, fill: "#fff", opacity: 0.35 }, g);
            const label = m.labels && m.labels[it.i] && !flip ? m.labels[it.i] : TEXT[q.el];
            if (label && q.el !== "H") {
              const t = K.text(g, q.sx, q.sy + 0.5, label, "s-text-strong");
              t.style.fill = "#fff"; t.style.fontSize = Math.max(8, Math.min(12, r * 0.62)) + "px";
            }
          }
        });
      }
      function paint() {
        K.clear(g);
        const m = MOL[keys[index]];
        if (p.mirror) {
          drawMolecule(m, 95, 116, fit(m, 96), false, yaw, pitch);
          drawMolecule(m, 265, 116, fit(m, 96), true, 0.44, -0.26);
          K.svg("line", { x1: 180, y1: 30, x2: 180, y2: 205, stroke: "var(--label-3)", "stroke-width": 1.5, "stroke-dasharray": "4 5" }, g);
          K.text(g, 95, 220, "drehbar", "s-text");
          K.text(g, 265, 220, "Spiegelbild", "s-text");
        } else {
          drawMolecule(m, 180, 122, fit(m, 150), false, yaw, pitch);
        }
        if (m.glucose && !ano) {
          ano = K.segmented(extra, [{ id: 0, label: "β" }, { id: 1, label: "α" }], alpha, (id) => { if (locked) return; alpha = id; paint(); ctx.changed(); });
        }
        if (ano) ano.el.style.display = m.glucose ? "" : "none";
        let txt = "**" + m.name + "** (" + m.formula + "): " + m.note;
        if (!m.chair) txt += " Bindungswinkel " + m.angle + ".";
        if (m.glucose) txt = alpha
          ? "**α-D-Glucose** in der Sesselform: die OH-Gruppe an C1 steht **axial**, alle anderen großen Gruppen äquatorial. Die axiale Gruppe stößt sich mit den axialen H-Atomen derselben Seite, das kostet etwas Energie."
          : "**β-D-Glucose** in der Sesselform: alle OH-Gruppen und die CH₂OH-Gruppe stehen **äquatorial**, nur H-Atome axial. Das ist die spannungsärmste Anordnung: darum überwiegt β im Gleichgewicht (etwa 64 %).";
        if (p.mirror && m.chiral) txt += " Links drehen und versuchen, das Spiegelbild rechts zu treffen.";
        out.set(strip(LW.md(txt + (touched || locked ? "" : " Zum Drehen ziehen."))));
      }
      // drag to turn
      let last = null;
      svg.addEventListener("pointerdown", (e) => { if (locked) return; last = [e.clientX, e.clientY]; touched = true; spinning = false; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); svg.style.cursor = "grabbing"; e.preventDefault(); });
      svg.addEventListener("pointermove", (e) => {
        if (!last) return;
        yaw += (e.clientX - last[0]) * 0.012;
        pitch = K.clamp(pitch + (e.clientY - last[1]) * 0.012, -1.5, 1.5);
        last = [e.clientX, e.clientY];
        paint();
        e.preventDefault();
      });
      const end = () => { if (last) { last = null; svg.style.cursor = "grab"; ctx.changed(); } };
      svg.addEventListener("pointerup", end);
      svg.addEventListener("pointercancel", end);
      function spin() {
        if (!spinning || !svg.isConnected) return;
        if (!(LW.reduceMotion && LW.reduceMotion())) { yaw += 0.008; paint(); }
        raf = requestAnimationFrame(spin);
      }
      paint();
      if (spinning) raf = requestAnimationFrame(spin);
      const deg = (r) => Math.round(((((r * 180) / Math.PI) % 360) + 360) % 360);
      const scope = () => ({ yaw: deg(yaw), pitch: Math.round((pitch * 180) / Math.PI), alpha, index });
      return {
        check: (goal) => goalCheck(goal, scope()),
        solve(goal) {
          const sv = (goal && goal.solve) || {};
          if (sv.alpha != null) alpha = sv.alpha ? 1 : 0;
          if (sv.index != null) { index = K.clamp(sv.index, 0, keys.length - 1); if (seg) seg.set(index); }
          if (sv.yaw != null) yaw = (sv.yaw * Math.PI) / 180;
          if (sv.pitch != null) pitch = (sv.pitch * Math.PI) / 180;
          if (ano) ano.set(alpha);
          paint();
        },
        getVar: (k) => (k === "yaw" ? (yaw * 180) / Math.PI : k === "pitch" ? (pitch * 180) / Math.PI : k === "alpha" ? alpha : k === "index" ? index : undefined),
        setVar(k, v) {
          spinning = false;
          if (k === "yaw") yaw = (v * Math.PI) / 180;
          if (k === "pitch") pitch = (v * Math.PI) / 180;
          if (k === "alpha") { alpha = v >= 0.5 ? 1 : 0; if (ano) ano.set(alpha); }
          if (k === "index") { index = K.clamp(Math.round(v), 0, keys.length - 1); if (seg) seg.set(index); }
          if (k === "marks") marks = v >= 0.5;
          paint();
        },
        lock() { locked = true; spinning = false; cancelAnimationFrame(raf); },
        leave() { spinning = false; cancelAnimationFrame(raf); },
      };
    },
  });

  // ------------------------------------------------------------------ protein folding
  // H hydrophobic, P polar, + basic, - acidic, C cysteine
  const SEQ = "PHPCHHPP+HPHP-HCHP".split("");
  const BEAD = { H: ["#f59e0b", "", "unpolar"], P: ["#38bdf8", "", "polar"], "+": ["#6366f1", "+", "basisch"], "-": ["#ef4444", "−", "sauer"], C: ["#eab308", "S", "Cystein"] };
  function proteinFrames() {
    const n = SEQ.length;
    const primary = SEQ.map((_, i) => [22 + i * 18.6, 128 + (i % 2 ? 7 : -7)]);
    const secondary = SEQ.map((_, i) => {
      if (i < 9) return [34 + i * 14, 92 + 24 * Math.sin((i * 100 * Math.PI) / 180)];
      const strandA = [[176, 150], [214, 162], [252, 162], [290, 162], [326, 174]];
      const strandB = [[318, 206], [282, 206], [246, 206], [210, 206]];
      return i < 14 ? strandA[i - 9] : strandB[i - 14];
    });
    const tertiary = SEQ.map((ch, i) => {
      const a = ((i * 40 - 90) * Math.PI) / 180;
      const r = ch === "H" ? 26 : ch === "C" ? 44 : 68;
      return [180 + r * Math.cos(a), 128 + r * Math.sin(a) * 0.9];
    });
    const quaternary = tertiary.map(([x, y]) => [112 + (x - 180) * 0.72, 128 + (y - 128) * 0.72]);
    // denatured: a loose random coil, the same every time
    let x = 30, y = 128, seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const coil = SEQ.map((_, i) => { if (i) { const a = (rnd() - 0.5) * 2.2; x += 18 * Math.cos(a) + 0.6; y = K.clamp(y + 18 * Math.sin(a), 40, 220); } return [x, y]; });
    return { primary, secondary, tertiary, quaternary, coil, n };
  }
  const PROTEIN_TEXT = [
    "**Primärstruktur**: die Reihenfolge der Aminosäuren, verknüpft über Peptidbindungen. Sie legt fest, wie sich die Kette später faltet.",
    "**Sekundärstruktur**: Wasserstoffbrücken zwischen den Peptidgruppen des Rückgrats. Bei der **α-Helix** bindet jede Aminosäure an die viertnächste, beim **β-Faltblatt** liegen Stränge nebeneinander.",
    "**Tertiärstruktur**: die räumliche Gestalt der ganzen Kette. Unpolare Seitenketten sammeln sich innen (hydrophober Effekt), polare und geladene bleiben außen am Wasser. Es halten Disulfidbrücken, Ionenbindungen, Wasserstoffbrücken und Van-der-Waals-Kräfte.",
    "**Quartärstruktur**: mehrere gefaltete Ketten lagern sich zusammen, etwa die vier Untereinheiten des Hämoglobins.",
  ];

  LW.widget("protein", {
    mount(host, p, ctx) {
      const F = proteinFrames();
      const frames = [F.primary, F.secondary, F.tertiary, F.quaternary];
      let t = K.clamp(p.stage == null ? 0 : +p.stage, 0, 3), heat = K.clamp(+p.heat || 0, 0, 1), locked = false, stopGlide = () => {};
      const W = 360, H = 250;
      const svg = K.root(host, W, H, p.aria || "Faltung einer Proteinkette");
      svg.style.maxWidth = "470px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const seg = p.controls === false ? null : K.segmented(ctrl, ["Primär", "Sekundär", "Tertiär", "Quartär"].map((l, i) => ({ id: i, label: l })), Math.round(t), (id) => {
        if (locked) return;
        stopGlide();
        stopGlide = glide(() => t, (v) => { t = v; paint(); }, id, 1000);
        ctx.changed();
      });
      const hs = p.controls === false || p.heatSlider === false ? null : K.slider(ctrl, { label: "Erhitzen", min: 0, max: 1, step: 0.01, value: heat, format: (v) => Math.round(37 + v * 63) + " °C",
        onInput: (v) => { if (locked) return; heat = v; paint(); ctx.changed(); } });

      function at(i) {
        const k = Math.min(2, Math.floor(t)), f = smooth(t - k);
        const a = frames[k][i], b = frames[k + 1][i];
        let x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f);
        const h = smooth((heat - 0.25) / 0.6) * Math.min(1, t);
        return [lerp(x, F.coil[i][0], h), lerp(y, F.coil[i][1], h)];
      }
      function paint() {
        K.clear(g);
        const P = SEQ.map((_, i) => at(i));
        const sec = Math.max(0, 1 - Math.abs(t - 1)) * (1 - smooth((heat - 0.2) / 0.4));
        const ter = smooth(t - 1.4) * (1 - smooth((heat - 0.2) / 0.4));
        const quat = smooth(t - 2.2);
        // hydrophobic core
        if (ter > 0.05) {
          const c = t > 2.2 ? [lerp(180, 112, quat), 128] : [180, 128];
          K.svg("circle", { cx: c[0], cy: c[1], r: lerp(40, 29, quat), fill: "#f59e0b", opacity: 0.14 * ter }, g);
          K.text(g, c[0], c[1] + lerp(52, 40, quat) + 14, "hydrophober Kern", "s-text").style.opacity = ter * (1 - quat);
        }
        // second chain of the quaternary structure
        if (quat > 0.02) {
          const Q = F.quaternary.map(([x, y]) => [360 - x, 256 - y]);
          const qg = K.svg("g", { opacity: quat * (1 - smooth((heat - 0.2) / 0.4)) }, g);
          K.svg("circle", { cx: 248, cy: 128, r: 29, fill: "#f59e0b", opacity: 0.14 }, qg);
          K.svg("polyline", { points: Q.map((q) => q.join(",")).join(" "), fill: "none", stroke: "var(--label-3)", "stroke-width": 2.5, "stroke-linejoin": "round" }, qg);
          Q.forEach((q, i) => K.svg("circle", { cx: q[0], cy: q[1], r: 6.4, fill: BEAD[SEQ[i]][0], opacity: 0.75 }, qg));
          K.text(qg, 248, 224, "zweite Kette", "s-text");
        }
        // backbone
        K.svg("polyline", { points: P.map((q) => q.join(",")).join(" "), fill: "none", stroke: "var(--label-2)", "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
        // hydrogen bonds of the secondary structure
        if (sec > 0.03) {
          const hb = K.svg("g", { opacity: sec }, g);
          for (let i = 0; i + 4 < 9; i++) K.svg("line", { x1: P[i][0], y1: P[i][1], x2: P[i + 4][0], y2: P[i + 4][1], stroke: "var(--blue)", "stroke-width": 1.4, "stroke-dasharray": "2 3" }, hb);
          [[10, 17], [11, 16], [12, 15]].forEach(([a, b]) => K.svg("line", { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: "var(--blue)", "stroke-width": 1.4, "stroke-dasharray": "2 3" }, hb));
          K.text(hb, 92, 52, "α-Helix", "s-text-strong");
          K.text(hb, 252, 234, "β-Faltblatt", "s-text-strong");
        }
        // disulfide bridge and ionic bond of the tertiary structure; the bridge survives heating
        const ci = SEQ.reduce((acc, ch, i) => (ch === "C" ? acc.concat(i) : acc), []);
        const ssOpacity = smooth(t - 1.4);
        if (ssOpacity > 0.03 && ci.length === 2) {
          K.svg("line", { x1: P[ci[0]][0], y1: P[ci[0]][1], x2: P[ci[1]][0], y2: P[ci[1]][1], stroke: "#eab308", "stroke-width": 3, opacity: ssOpacity }, g);
        }
        const plus = SEQ.indexOf("+"), minus = SEQ.indexOf("-");
        if (ter > 0.03) K.svg("line", { x1: P[plus][0], y1: P[plus][1], x2: P[minus][0], y2: P[minus][1], stroke: "#a855f7", "stroke-width": 1.8, "stroke-dasharray": "5 3", opacity: ter }, g);
        P.forEach((q, i) => {
          const b = BEAD[SEQ[i]];
          K.svg("circle", { cx: q[0], cy: q[1], r: 7.6, fill: b[0], stroke: "var(--card-solid)", "stroke-width": 1.5 }, g);
          if (b[1]) { const tx = K.text(g, q[0], q[1] + 0.5, b[1], "s-text-strong"); tx.style.fill = "#fff"; tx.style.fontSize = "9.5px"; }
        });
        // legend
        const legend = [["H", "unpolar"], ["P", "polar"], ["+", "basisch"], ["-", "sauer"], ["C", "Cystein"]];
        legend.forEach(([k, l], i) => {
          const x = 14 + i * 70;
          K.svg("circle", { cx: x, cy: 14, r: 5, fill: BEAD[k][0] }, g);
          K.text(g, x + 9, 14, l, "s-text", "start").style.fontSize = "10.5px";
        });
        const stage = Math.round(t);
        let txt = PROTEIN_TEXT[stage];
        if (heat > 0.35 && stage > 0) txt = "**Denaturierung** bei " + Math.round(37 + heat * 63) + " °C: Die Wärme bricht Wasserstoffbrücken und Ionenbindungen, die Kette entfaltet sich und verliert ihre Funktion. Die Primärstruktur bleibt, die Disulfidbrücke (gelb) als Atombindung meist auch. Starke Säuren, Laugen und Schwermetall-Ionen wirken ähnlich.";
        out.set(strip(LW.md(txt)));
        if (seg) seg.set(stage);
      }
      paint();
      const scope = () => ({ stage: Math.round(t), heat });
      return {
        check: (goal) => goalCheck(goal, scope()),
        solve(goal) {
          const sv = (goal && goal.solve) || {};
          stopGlide();
          if (sv.stage != null) t = K.clamp(+sv.stage, 0, 3);
          if (sv.heat != null) { heat = K.clamp(+sv.heat, 0, 1); if (hs) hs.set(heat); }
          paint();
        },
        getVar: (k) => (k === "stage" ? t : k === "heat" ? heat : undefined),
        setVar(k, v) {
          stopGlide();
          if (k === "stage") t = K.clamp(+v, 0, 3);
          if (k === "heat") { heat = K.clamp(+v, 0, 1); if (hs) hs.set(heat); }
          paint();
        },
        lock() { locked = true; if (seg) seg.el.querySelectorAll("button").forEach((b) => { b.disabled = true; }); if (hs) hs.disable(true); },
        leave() { stopGlide(); },
      };
    },
  });

  // ------------------------------------------------------------------ reaction mechanisms with electron arrows
  // A step lists atoms {id: [x, y, label, charge]}, bonds [a, b, order], lone pairs [atom, angle in degrees], gaps (places
  // where a new bond may form: [a, b]) and the arrows the step needs: sources "pair:<atom>" or "bond:<a>:<b>", targets
  // "atom:<id>", "gap:<a>:<b>" or "bond:<a>:<b>".
  const MECH = {
    sn2: {
      title: "Nucleophile Substitution SN2", products: "$\\mathrm{CH_3OH + Br^-}$",
      steps: [{
        atoms: { O: [62, 128, "HO", "−"], C: [182, 128, "C"], Br: [298, 128, "Br"], Ha: [182, 76, "H"], Hb: [152, 172, "H"], Hc: [212, 172, "H"] },
        bonds: [["C", "Br", 1], ["C", "Ha", 1], ["C", "Hb", 1], ["C", "Hc", 1]],
        pairs: [["O", 0], ["O", 90], ["O", 270], ["Br", 0], ["Br", 90], ["Br", 270]],
        gaps: [["O", "C"], ["O", "Ha"]],
        arrows: [["pair:O", "gap:C:O"], ["bond:Br:C", "atom:Br"]],
        task: "Das Hydroxid-Ion ist das **Nucleophil**, Brom die **Abgangsgruppe**. Setze beide Pfeile dieses einen Schritts.",
        done: "Richtig. Der Angriff kommt von der **Rückseite**, während Bromid geht: ein einziger Schritt mit einem Übergangszustand, in dem fünf Partner am C-Atom sitzen. Die Geschwindigkeit hängt von beiden Konzentrationen ab.",
      }],
    },
    sn1: {
      title: "Nucleophile Substitution SN1", products: "$\\mathrm{(CH_3)_3COH + HBr}$",
      steps: [{
        atoms: { C: [182, 130, "C"], Br: [298, 130, "Br"], M1: [182, 72, "CH₃"], M2: [128, 166, "H₃C"], M3: [236, 166, "CH₃"] },
        bonds: [["C", "Br", 1], ["C", "M1", 1], ["C", "M2", 1], ["C", "M3", 1]],
        pairs: [["Br", 0], ["Br", 90], ["Br", 270]],
        gaps: [],
        arrows: [["bond:Br:C", "atom:Br"]],
        task: "Schritt 1: Die Abgangsgruppe geht zuerst. Wohin wandern die Elektronen der C–Br-Bindung?",
        done: "Richtig. Die Bindung bricht **heterolytisch**: Bromid nimmt beide Elektronen mit, zurück bleibt ein **Carbokation**. Dieser langsame Schritt bestimmt die Geschwindigkeit; drei Methylgruppen stabilisieren die positive Ladung.",
      }, {
        atoms: { C: [168, 130, "C", "+"], M1: [168, 72, "CH₃"], M2: [114, 166, "H₃C"], M3: [222, 166, "CH₃"], O: [300, 130, "O"], Ha: [326, 98, "H"], Hb: [326, 162, "H"], Br: [300, 34, "Br", "−"] },
        bonds: [["C", "M1", 1], ["C", "M2", 1], ["C", "M3", 1], ["O", "Ha", 1], ["O", "Hb", 1]],
        pairs: [["O", 180], ["O", 90], ["Br", 0], ["Br", 90], ["Br", 180], ["Br", 270]],
        gaps: [["O", "C"], ["O", "M3"]],
        arrows: [["pair:O", "gap:C:O"]],
        task: "Schritt 2: Das Wasser-Molekül greift das Carbokation an. Setze den Pfeil.",
        done: "Richtig. Das Carbokation ist **eben**, Wasser greift von beiden Seiten gleich gut an. Zum Schluss gibt das Oxonium-Ion ein Proton ab: es entsteht 2-Methylpropan-2-ol.",
      }],
    },
    addition: {
      title: "Elektrophile Addition von Brom an Ethen", products: "$\\mathrm{CH_2Br{-}CH_2Br}$ (1,2-Dibromethan)",
      steps: [{
        atoms: { C1: [140, 150, "C"], C2: [220, 150, "C"], H1: [102, 120, "H"], H2: [102, 182, "H"], H3: [258, 120, "H"], H4: [258, 182, "H"], Br1: [180, 84, "Br"], Br2: [180, 30, "Br"] },
        bonds: [["C1", "C2", 2], ["C1", "H1", 1], ["C1", "H2", 1], ["C2", "H3", 1], ["C2", "H4", 1], ["Br1", "Br2", 1]],
        pairs: [["Br1", 0], ["Br1", 180], ["Br2", 0], ["Br2", 180], ["Br2", 270]],
        gaps: [["C1", "Br1"], ["C1", "Br2"]],
        arrows: [["bond:C1:C2", "gap:Br1:C1"], ["bond:Br1:Br2", "atom:Br2"]],
        task: "Schritt 1: Die Elektronen der Doppelbindung greifen das Brom-Molekül an, das sich in ihrer Nähe polarisiert hat. Zwei Pfeile.",
        done: "Richtig. Die π-Elektronen bilden die neue C–Br-Bindung, die Br–Br-Bindung bricht heterolytisch: es entstehen ein **Carbokation** (genauer ein ringförmiges Bromonium-Ion) und ein **Bromid-Ion**.",
      }, {
        atoms: { C1: [140, 128, "C"], C2: [220, 128, "C", "+"], H1: [102, 98, "H"], H2: [102, 160, "H"], H3: [262, 104, "H"], H4: [262, 152, "H"], Br1: [140, 66, "Br"], Br2: [222, 224, "Br", "−"] },
        bonds: [["C1", "C2", 1], ["C1", "H1", 1], ["C1", "H2", 1], ["C2", "H3", 1], ["C2", "H4", 1], ["C1", "Br1", 1]],
        pairs: [["Br1", 0], ["Br1", 180], ["Br1", 270], ["Br2", 180], ["Br2", 270], ["Br2", 0]],
        gaps: [["Br2", "C2"], ["Br2", "C1"]],
        arrows: [["pair:Br2", "gap:Br2:C2"]],
        task: "Schritt 2: Das Bromid-Ion greift die positive Ladung an. Setze den Pfeil.",
        done: "Richtig. Bromid kommt von der dem ersten Brom-Atom **abgewandten Seite** (anti-Addition). Mit Bromwasser ist das der Nachweis für Doppelbindungen: die braune Farbe verschwindet.",
      }],
    },
    halbacetal: {
      title: "Bildung eines Halbacetals", products: "Halbacetal: ein C-Atom mit OH- und OR-Gruppe",
      steps: [{
        atoms: { O2: [72, 132, "O"], R2: [44, 92, "R'"], H2: [44, 170, "H"], C: [204, 132, "C"], O1: [204, 70, "O"], R: [252, 168, "R"], H: [156, 168, "H"] },
        bonds: [["O2", "R2", 1], ["O2", "H2", 1], ["C", "O1", 2], ["C", "R", 1], ["C", "H", 1]],
        pairs: [["O2", 0], ["O2", 90], ["O1", 225], ["O1", 315]],
        gaps: [["O2", "C"], ["O2", "O1"]],
        arrows: [["pair:O2", "gap:C:O2"], ["bond:C:O1", "atom:O1"]],
        task: "Das Carbonyl-C-Atom ist positiv polarisiert, das O-Atom der Alkoholgruppe hat freie Elektronenpaare. Setze die zwei Pfeile.",
        done: "Richtig. Der Sauerstoff des Alkohols bindet an das Carbonyl-C-Atom, die Elektronen der C=O-Doppelbindung wandern zum Carbonyl-Sauerstoff. Nach einer Protonenübertragung steht das **Halbacetal**: genau so schließt sich der Ring der Glucose zwischen C1 und dem O-Atom an C5.",
      }],
    },
    veresterung: {
      title: "Veresterung (säurekatalysiert)", products: "Ester und Wasser",
      steps: [{
        atoms: { O3: [70, 130, "O"], R2: [42, 92, "R'"], H3: [42, 168, "H"], C: [200, 130, "C", "+"], O1: [200, 70, "OH"], O2: [246, 168, "OH"], R: [150, 168, "R"] },
        bonds: [["O3", "R2", 1], ["O3", "H3", 1], ["C", "O1", 1], ["C", "O2", 1], ["C", "R", 1]],
        pairs: [["O3", 0], ["O3", 90]],
        gaps: [["O3", "C"], ["O3", "O1"]],
        arrows: [["pair:O3", "gap:C:O3"]],
        task: "Das Proton des Katalysators hat die Carbonsäure aktiviert: das C-Atom trägt jetzt eine positive Ladung. Der Alkohol greift an.",
        done: "Richtig. Der Alkohol bindet an das C-Atom. Es folgen Protonenübertragungen, Wasser wird abgespalten und der Katalysator zurückgegeben. Die Reaktion ist ein **Gleichgewicht**: Wasser entziehen oder Alkohol im Überschuss verschiebt es zum Ester.",
      }],
    },
  };

  const norm = (s) => {
    const parts = s.split(":");
    if ((parts[0] === "bond" || parts[0] === "gap") && parts.length === 3) return parts[0] + ":" + [parts[1], parts[2]].sort().join(":");
    return s;
  };

  LW.widget("mechanism", {
    mount(host, p, ctx) {
      const M = MECH[p.mechanism] || MECH.sn2;
      let stepIndex = 0, arrows = [], source = null, solved = 0, locked = false, message = null;
      const W = 360, H = 240;
      const svg = K.root(host, W, H, p.aria || "Mechanismus: Elektronenpfeile setzen");
      svg.style.maxWidth = "470px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div", { class: "w-btns" });
      host.append(ctrl);
      const checkB = K.button(ctrl, "Pfeile prüfen", () => checkStep());
      const resetB = K.button(ctrl, "Pfeile löschen", () => { if (locked) return; arrows = []; source = null; message = null; paint(); });
      const nextB = K.button(ctrl, "Nächster Schritt", () => { if (stepIndex < M.steps.length - 1) { stepIndex++; arrows = []; source = null; message = null; paint(); } });
      nextB.style.display = "none";

      const S = () => M.steps[stepIndex];
      function pairPos(atom, angle) {
        const a = S().atoms[atom], r = (angle * Math.PI) / 180, d = a[2].length > 2 ? 22 : 17;
        return [a[0] + Math.cos(r) * d, a[1] + Math.sin(r) * d];
      }
      function point(ref) {
        const [kind, a, b] = ref.split(":");
        const A = S().atoms;
        if (kind === "atom") return [A[a][0], A[a][1] - 4];
        if (kind === "pair") {
          // the lone pair that faces the target best; for drawing the arrow start
          const ps = S().pairs.filter((q) => q[0] === a);
          return pairPos(a, (ps[0] || [a, 0])[1]);
        }
        return [(A[a][0] + A[b][0]) / 2, (A[a][1] + A[b][1]) / 2];
      }
      /** Where an arrow ends: at an atom, at a bond, or, for a new bond, just short of the atom being attacked. */
      function arrowEnd(arrow) {
        const [src, dst] = arrow;
        const parts = dst.split(":");
        if (parts[0] !== "gap") return point(dst);
        const own = src.split(":").slice(1);
        const far = own.includes(parts[1]) ? parts[2] : own.includes(parts[2]) ? parts[1] : null;
        if (!far) return point(dst);
        const near = far === parts[1] ? parts[2] : parts[1], A = S().atoms;
        const dx = A[near][0] - A[far][0], dy = A[near][1] - A[far][1], len = Math.hypot(dx, dy) || 1;
        return [A[far][0] + (dx / len) * 19, A[far][1] + (dy / len) * 19];
      }
      function arrowStart(arrow) {
        const [src, dst] = arrow;
        if (src.startsWith("pair:")) {
          // start at the lone pair of that atom nearest to the target
          const atom = src.split(":")[1], tp = arrowEnd(arrow);
          let best = null, bd = Infinity;
          S().pairs.filter((q) => q[0] === atom).forEach((q) => { const pp = pairPos(atom, q[1]), d = Math.hypot(pp[0] - tp[0], pp[1] - tp[1]); if (d < bd) { bd = d; best = pp; } });
          return best || point(src);
        }
        return point(src);
      }

      function paint() {
        K.clear(g);
        const st = S(), A = st.atoms;
        const doneStep = solved || (message && message.ok);
        // gaps: where a new bond may form
        st.gaps.forEach(([a, b]) => {
          K.svg("line", { x1: A[a][0], y1: A[a][1], x2: A[b][0], y2: A[b][1], stroke: "var(--label-3)", "stroke-width": 1.2, "stroke-dasharray": "2 6", opacity: 0.8 }, g);
        });
        // bonds
        st.bonds.forEach(([a, b, order]) => {
          const x1 = A[a][0], y1 = A[a][1], x2 = A[b][0], y2 = A[b][1];
          const len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
          const cut1 = A[a][2].length > 1 ? 16 : 10, cut2 = A[b][2].length > 1 ? 16 : 10, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
          (order === 2 ? [-3, 3] : [0]).forEach((o) => K.svg("line", { x1: x1 + ux * cut1 + nx * o, y1: y1 + uy * cut1 + ny * o, x2: x2 - ux * cut2 + nx * o, y2: y2 - uy * cut2 + ny * o, stroke: "var(--label)", "stroke-width": 2, "stroke-linecap": "round" }, g));
        });
        // atoms
        Object.keys(A).forEach((id) => {
          const [x, y, label, charge] = A[id];
          atomLabel(g, x, y, label, { color: /^O|^HO|^OH/.test(label) ? "var(--red)" : /^Br/.test(label) ? "#a0522d" : null });
          if (charge) {
            const c = K.text(g, x + label.length * 4.6 + 6, y - 10, charge, "s-text-strong");
            c.style.fill = charge === "+" ? "var(--blue)" : "var(--red)";
          }
        });
        // lone pairs
        st.pairs.forEach(([atom, angle]) => {
          const [px, py] = pairPos(atom, angle), r = ((angle + 90) * Math.PI) / 180;
          [-3, 3].forEach((o) => K.svg("circle", { cx: px + Math.cos(r) * o, cy: py + Math.sin(r) * o, r: 2, fill: "var(--label)" }, g));
        });
        // arrows already set
        arrows.forEach((ar, k) => {
          const [x1, y1] = arrowStart(ar), [x2, y2] = arrowEnd(ar);
          const color = message && !message.ok && message.bad && message.bad.includes(k) ? "var(--orange)" : "var(--red)";
          const drawn = curvedArrow(g, x1, y1, x2, y2, k % 2 ? -26 : 26, color, 2.4);
          if (!locked && !doneStep) {
            const hit = K.svg("path", { d: drawn.d, fill: "none", stroke: "transparent", "stroke-width": 16, style: "cursor:pointer" }, g);
            hit.addEventListener("click", () => { arrows.splice(k, 1); message = null; paint(); ctx.changed(); });
          }
        });
        // tap targets
        if (!locked && !doneStep) {
          const hit = (x, y, r, ref, role) => {
            const sel = source === ref;
            const c = K.svg("circle", { cx: x, cy: y, r, fill: sel ? "var(--accent)" : "transparent", "fill-opacity": sel ? 0.18 : 0, stroke: sel ? "var(--accent)" : "transparent", "stroke-width": 2, style: "cursor:pointer" }, g);
            c.setAttribute("aria-label", role);
            c.addEventListener("click", (e) => { e.stopPropagation(); tap(ref); });
          };
          const seen = new Set();
          st.pairs.forEach(([atom, angle]) => { const [x, y] = pairPos(atom, angle); hit(x, y, 11, "pair:" + atom, "Elektronenpaar an " + A[atom][2]); seen.add(atom); });
          st.bonds.forEach(([a, b]) => { const [x, y] = point("bond:" + a + ":" + b); hit(x, y, 12, norm("bond:" + a + ":" + b), "Bindung " + A[a][2] + "–" + A[b][2]); });
          st.gaps.forEach(([a, b]) => { const [x, y] = point("gap:" + a + ":" + b); hit(x, y, 12, norm("gap:" + a + ":" + b), "neue Bindung zwischen " + A[a][2] + " und " + A[b][2]); });
          if (source) Object.keys(A).forEach((id) => hit(A[id][0], A[id][1], 15, "atom:" + id, "Atom " + A[id][2]));
        }
        let txt;
        if (solved) txt = message ? message.text : "**Mechanismus vollständig.** Produkte: " + M.products + ".";
        else if (message) txt = message.text;
        else txt = st.task + (source ? " Jetzt antippen, **wohin** die Elektronen wandern." : " Tippe auf ein **Elektronenpaar** oder eine **Bindung**, dann auf das Ziel.");
        if (M.steps.length > 1 && !solved) txt = "**Schritt " + (stepIndex + 1) + " von " + M.steps.length + ".** " + txt;
        out.set(strip(LW.md(txt)));
        checkB.style.display = solved || (message && message.ok) ? "none" : "";
        resetB.style.display = solved || (message && message.ok) ? "none" : "";
        nextB.style.display = !solved && message && message.ok && stepIndex < M.steps.length - 1 ? "" : "none";
      }
      function tap(ref) {
        if (locked) return;
        message = null;
        const kind = ref.split(":")[0];
        if (!source) {
          if (kind === "pair" || kind === "bond") source = ref;
        } else if (ref === source) {
          source = null;
        } else if (kind === "atom" || kind === "gap" || kind === "bond") {
          const ar = [norm(source), norm(ref)];
          if (!arrows.some((x) => x[0] === ar[0] && x[1] === ar[1])) arrows.push(ar);
          source = null;
          ctx.changed();
        } else {
          source = ref;
        }
        paint();
      }
      function checkStep() {
        if (locked || solved) return;
        const want = S().arrows.map((a) => [norm(a[0]), norm(a[1])]);
        const key = (a) => a[0] + ">" + a[1];
        const wantKeys = new Set(want.map(key));
        const bad = arrows.map((a, k) => (wantKeys.has(key(a)) ? -1 : k)).filter((k) => k >= 0);
        const hits = arrows.length - bad.length;
        if (!bad.length && hits === want.length) {
          message = { ok: true, text: S().done };
          if (stepIndex === M.steps.length - 1) { solved = 1; message.text = S().done + " **Mechanismus vollständig.** Produkte: " + M.products + "."; }
          ctx.changed();
        } else if (bad.length) {
          const reversed = arrows.some((a) => want.some((w) => w[0].split(":")[1] && a[1].includes(w[0].split(":")[1]) && w[1].includes(a[0].split(":")[1])));
          message = { ok: false, bad, text: reversed
            ? "Ein Pfeil zeigt in die falsche Richtung. Elektronenpfeile beginnen **dort, wo die Elektronen sind** (freies Paar oder Bindung), und enden dort, wo sie hinwandern."
            : "Der orange Pfeil passt nicht. Frage dich: Welches Teilchen hat Elektronen übrig (Nucleophil, Doppelbindung), wo fehlen welche (positive Polarisierung, Abgangsgruppe)?" };
        } else {
          message = { ok: false, bad: [], text: "Bisher stimmt alles, aber es fehlt noch " + (want.length - hits === 1 ? "ein Pfeil" : (want.length - hits) + " Pfeile") + ". Wenn eine Bindung entsteht, bricht oft gleichzeitig eine andere." };
        }
        paint();
      }
      paint();
      const scope = () => ({ solved, step: stepIndex });
      return {
        check(goal) {
          const r = goalCheck(goal, scope());
          if (!r.correct && !r.detail) r.detail = "Setze für jeden Schritt die Elektronenpfeile und prüfe sie im Bild mit »Pfeile prüfen«.";
          return r;
        },
        solve() {
          stepIndex = M.steps.length - 1;
          arrows = S().arrows.map((a) => [norm(a[0]), norm(a[1])]);
          solved = 1;
          message = { ok: true, text: S().done + " **Mechanismus vollständig.** Produkte: " + M.products + "." };
          paint();
        },
        getVar: (k) => scope()[k],
        setVar() {},
        lock() { locked = true; [checkB, resetB, nextB].forEach((b) => { b.disabled = true; }); paint(); },
      };
    },
  });
})();
