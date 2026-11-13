/* Chemistry widgets.
 *
 *   atom: shell model (Bohr) of the elements 1 to 20 with protons, neutrons and electrons on the shells K, L, M, N.
 *         params: Z (1 to 20), q (charge of the ion, -3 to 3), slider (true: Z as a slider), chargeSlider, neutrons (show)
 *         scope:  Z, q, e (electrons), valence (electrons on the outer shell), period, group (main group), full (1 when
 *                 the outer shell holds 2 or 8), shells
 *         act:    none; animations glide Z and q (both rounded).
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // symbol, name, mass number of the most common isotope
  const EL = [null,
    ["H", "Wasserstoff", 1], ["He", "Helium", 4], ["Li", "Lithium", 7], ["Be", "Beryllium", 9], ["B", "Bor", 11],
    ["C", "Kohlenstoff", 12], ["N", "Stickstoff", 14], ["O", "Sauerstoff", 16], ["F", "Fluor", 19], ["Ne", "Neon", 20],
    ["Na", "Natrium", 23], ["Mg", "Magnesium", 24], ["Al", "Aluminium", 27], ["Si", "Silicium", 28], ["P", "Phosphor", 31],
    ["S", "Schwefel", 32], ["Cl", "Chlor", 35], ["Ar", "Argon", 40], ["K", "Kalium", 39], ["Ca", "Calcium", 40]];
  LW.elements = EL;
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  /** Electrons per shell in the simple shell model used at school: 2, 8, 8, then the fourth shell. */
  function shells(e) {
    const cap = [2, 8, 8, 8], out = [];
    let rest = Math.max(0, e);
    for (const c of cap) { if (rest <= 0) break; const k = Math.min(c, rest); out.push(k); rest -= k; }
    return out;
  }
  LW.shells = shells;

  function goalCheck(goal, scope) {
    let ok = false;
    try { ok = !!LW.expr(goal.when || "0")(scope); } catch (e) { ok = false; }
    if (ok) return { correct: true };
    for (const h of goal.hints || []) {
      try { if (LW.expr(h.when)(scope)) return { correct: false, detail: LW.graphTemplate ? LW.graphTemplate(h.text, scope).replace(/^<p>|<\/p>$/g, "") : h.text }; } catch (e) { /* ignore */ }
    }
    return { correct: false, detail: goal.message || null };
  }

  LW.widget("atom", {
    mount(host, p, ctx) {
      let Z = K.clamp(Math.round(p.Z || 6), 1, 20), q = K.clamp(Math.round(p.q || 0), -3, 3), locked = false;
      const W = 360, H = 250, cx = 180, cy = 122;
      const svg = K.root(host, W, H, p.aria || "Schalenmodell eines Atoms");
      svg.style.maxWidth = "460px"; svg.style.margin = "0 auto";
      const g = K.svg("g", null, svg);
      const out = K.readout(host);
      const ctrl = LW.el("div");
      host.append(ctrl);
      const zs = p.slider === false ? null : K.slider(ctrl, { label: "Ordnungszahl Z", min: 1, max: 20, step: 1, value: Z, format: (v) => v + " · " + EL[v][0],
        onInput: (v) => { if (locked) return; Z = v; paint(); ctx.changed(); } });
      const qs = !p.chargeSlider ? null : K.slider(ctrl, { label: "Ladung", min: -3, max: 3, step: 1, value: q, format: (v) => (v > 0 ? "+" + v : v < 0 ? "−" + -v : "0"),
        onInput: (v) => { if (locked) return; q = v; paint(); ctx.changed(); } });

      const scope = () => {
        const e = Math.max(0, Z - q), sh = shells(e), val = sh.length ? sh[sh.length - 1] : 0;
        const neutral = shells(Z);
        return { Z, q, e, valence: val, shells: sh.length, period: neutral.length, group: neutral[neutral.length - 1],
          full: val === 8 || (sh.length === 1 && val === 2) ? 1 : 0 };
      };

      function paint() {
        K.clear(g);
        const S = scope(), sh = shells(S.e);
        const R = [0, 38, 62, 86, 108];
        for (let k = 1; k <= Math.max(sh.length, 1); k++) {
          K.svg("circle", { cx, cy, r: R[k], fill: "none", stroke: "var(--label-3)", "stroke-width": 1.2, "stroke-dasharray": k > sh.length ? "3 4" : null }, g);
          K.text(g, cx + R[k] * 0.72 + 4, cy - R[k] * 0.72 - 4, "KLMN"[k - 1], "s-text", "start").style.fontSize = "10px";
        }
        K.svg("circle", { cx, cy, r: 22, fill: "var(--accent)", opacity: 0.9 }, g);
        const n = EL[Z][2] - Z;
        const t1 = K.text(g, cx, cy - 5, Z + " p⁺", "s-text-strong"); t1.style.fill = "#fff"; t1.style.fontSize = "10.5px";
        if (p.neutrons !== false) { const t2 = K.text(g, cx, cy + 8, n + " n", "s-text"); t2.style.fill = "#fff"; t2.style.fontSize = "10px"; }
        sh.forEach((cnt, i) => {
          const r = R[i + 1];
          for (let j = 0; j < cnt; j++) {
            // electrons in pairs around the shell, starting at the top
            const slots = i === 0 ? 2 : 8;
            const pos = i === 0 ? j : (j < 4 ? j * 2 : (j - 4) * 2 + 1);
            const a = -Math.PI / 2 + (2 * Math.PI * pos) / slots + (i === 0 ? 0 : (j < 4 ? 0 : 0.0));
            const outer = i === sh.length - 1;
            K.svg("circle", { cx: cx + r * Math.cos(a), cy: cy + r * Math.sin(a), r: 5.2, fill: outer ? "var(--orange)" : "var(--label-2)", stroke: "var(--card-solid)", "stroke-width": 1.5 }, g);
          }
        });
        const sym = EL[Z][0] + (q === 0 ? "" : (Math.abs(q) > 1 ? Math.abs(q) : "") + (q > 0 ? "+" : "−"));
        K.text(g, 16, 18, sym, "s-text-strong", "start").style.fontSize = "20px";
        K.text(g, 16, 40, EL[Z][1] + (q !== 0 ? (q > 0 ? "-Kation" : "-Anion") : ""), "s-text", "start");
        K.text(g, W - 14, 18, S.period + ". Periode", "s-text", "end");
        K.text(g, W - 14, 34, ROMAN[S.group] + ". Hauptgruppe", "s-text", "end");
        const shellText = sh.join(", ") || "keine";
        out.set(LW.md("**" + EL[Z][1] + "**: " + Z + " Protonen" + (p.neutrons !== false ? ", " + n + " Neutronen" : "") + ", " + S.e + " Elektronen. Schalen: " + shellText +
          ". Außen **" + S.valence + "** Elektron" + (S.valence === 1 ? "" : "en") + (S.full ? ", **Edelgaskonfiguration**" : "") + ".").replace(/^<p>|<\/p>$/g, ""));
      }
      paint();
      return {
        check: (goal) => goalCheck(goal, scope()),
        solve(goal) {
          const sv = (goal && goal.solve) || {};
          if (sv.Z != null) { Z = K.clamp(Math.round(sv.Z), 1, 20); if (zs) zs.set(Z); }
          if (sv.q != null) { q = K.clamp(Math.round(sv.q), -3, 3); if (qs) qs.set(q); }
          paint();
        },
        getVar: (k) => (k === "Z" ? Z : k === "q" ? q : scope()[k]),
        setVar(k, v) {
          if (k === "Z") { Z = K.clamp(Math.round(v), 1, 20); if (zs) zs.set(Z); }
          if (k === "q") { q = K.clamp(Math.round(v), -3, 3); if (qs) qs.set(q); }
          paint();
        },
        lock() { locked = true; if (zs) zs.disable(true); if (qs) qs.disable(true); },
      };
    },
  });
})();
