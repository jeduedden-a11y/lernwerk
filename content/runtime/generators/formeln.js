// Formula training from the formula books (courses/<course>/formeln.json, loaded into LW.formulas before a start).
//   formelkarte:      one card per formula in the review; asks it in changing directions (name to formula, formula
//                     to name, symbols to meanings)
//   formeln-<course>: training in four levels: recognise, complete, rearrange, find the wrong formula
(function () {
  const disp = (tex) => "\n\n$$" + tex + "$$\n\n";
  const inl = (tex) => "$" + tex + "$";
  const vars = (f) => (f.vars || []).map(([s, n, u]) => inl(s) + " " + n + (u ? " in " + u : "")).join(", ");
  const abiNote = (f) => (f.abi === "blatt" ? " Steht in der Formelsammlung." : f.abi === "merken" ? " Grundformel: ohne Nachschlagen können." : "");
  const missing = () => ({ type: "text", md: "Die Formeln dieses Kurses sind auf diesem Gerät noch nicht geladen.", explain: "Nach dem nächsten Abgleich der Inhalte sind sie da." });
  const sides = (tex) => { const i = tex.indexOf("="); return i < 0 ? null : [tex.slice(0, i).trim(), tex.slice(i + 1).trim()]; };
  /** swaps numerator and denominator of the first \frac or \tfrac, for a plausible wrong rearrangement */
  function fracSwap(tex) {
    const m = /\\(t|d)?frac\{/.exec(tex);
    if (!m) return null;
    let i = m.index + m[0].length, depth = 1, a = i;
    while (i < tex.length && depth) { if (tex[i] === "{") depth++; else if (tex[i] === "}") depth--; i++; }
    const num = tex.slice(a, i - 1);
    if (tex[i] !== "{") return null;
    let j = i + 1; depth = 1;
    while (j < tex.length && depth) { if (tex[j] === "{") depth++; else if (tex[j] === "}") depth--; j++; }
    const den = tex.slice(i + 1, j - 1);
    return tex.slice(0, m.index) + "\\" + (m[1] || "") + "frac{" + den + "}{" + num + "}" + tex.slice(j);
  }

  function card(level, G, params) {
    const list = LW.formulaList(params.course);
    const f = list.find((x) => x.id === params.id) || (list.length ? G.pick(list) : null);
    if (!f) return missing();
    const others = list.filter((x) => x.id !== f.id);
    const kinds = ["recall", "recall"];
    if (others.length >= 3) kinds.push("name");
    if ((f.vars || []).length >= 3) kinds.push("vars");
    const kind = G.pick(kinds);
    if (kind === "name") {
      return { type: "choice", md: "Wofür steht diese Formel?" + disp(f.tex),
        options: G.options({ md: f.name, why: f.note || null }, G.shuffle(others).map((o) => ({ md: o.name, why: o.name + " lautet " + inl(o.tex) + "." }))),
        explain: f.name + ": " + inl(f.tex) + (vars(f) ? " mit " + vars(f) + "." : ".") + abiNote(f) };
    }
    if (kind === "vars") {
      const vs = G.pickN(f.vars, Math.min(4, f.vars.length));
      return { type: "match", md: "Was bedeuten die Größen in " + inl(f.tex) + "?", pairs: vs.map(([s, n]) => [inl(s), n]),
        explain: vars(f) + "." + abiNote(f) };
    }
    return { type: "reveal", md: "Wie lautet die Formel?\n\n**" + f.name + "**" + (f.group ? " (" + f.group + ")" : ""),
      solution: disp(f.tex) + (vars(f) ? vars(f) + "." : "") + abiNote(f), explain: f.name + ": " + inl(f.tex) + abiNote(f) };
  }
  LW.generator("formelkarte", { title: "Formelkarte", make(level, G, params) { return card(level, G, params || {}); } });

  function training(course) {
    return {
      title: "Formeltraining",
      make(level, G) {
        const list = LW.formulaList(course);
        if (list.length < 4) return missing();
        const f = G.pick(list);
        const sameGroup = list.filter((x) => x.id !== f.id && x.group === f.group);
        const others = G.shuffle(sameGroup).concat(G.shuffle(list.filter((x) => x.id !== f.id && x.group !== f.group)));
        if (level === 1) {
          if (G.chance(0.5)) return { type: "choice", md: "Welche Formel gehört zu **" + f.name + "**?",
            options: G.options({ md: inl(f.tex), why: f.note || null }, others.map((o) => ({ md: inl(o.tex), why: "Das ist " + o.name + "." }))),
            explain: f.name + ": " + inl(f.tex) + "." + abiNote(f) };
          return { type: "choice", md: "Wofür steht" + disp(f.tex),
            options: G.options({ md: f.name, why: null }, others.map((o) => ({ md: o.name, why: o.name + " lautet " + inl(o.tex) + "." }))),
            explain: f.name + ": " + inl(f.tex) + (vars(f) ? " mit " + vars(f) + "." : ".") };
        }
        if (level === 2) {
          const sd = sides(f.tex);
          const pool = others.map((o) => sides(o.tex)).filter(Boolean);
          if (sd && pool.length >= 3 && G.chance(0.6)) {
            const right = G.chance(0.7);
            const shown = right ? sd[0] + " = \\;?" : "? \\; = " + sd[1];
            const want = right ? sd[1] : sd[0];
            return { type: "choice", md: "Ergänze die Formel für **" + f.name + "**:" + disp(shown),
              options: G.options({ md: inl(want) }, pool.map((p) => ({ md: inl(right ? p[1] : p[0]), why: "Das gehört zu einer anderen Formel." }))),
              explain: "Vollständig: " + inl(f.tex) + "." + abiNote(f) };
          }
          const four = [f].concat(others.slice(0, 3));
          return { type: "match", md: "Ordne jeder Formel ihren Namen zu.", pairs: G.shuffle(four).map((x) => [x.name, inl(x.tex)]),
            explain: four.map((x) => x.name + ": " + inl(x.tex)).join(". ") + "." };
        }
        if (level === 3) {
          const cand = list.filter((x) => x.solve && Object.keys(x.solve).length);
          if (cand.length) {
            const g = G.pick(cand), keys = Object.keys(g.solve), v = G.pick(keys), right = g.solve[v];
            const wrong = keys.filter((k) => k !== v).map((k) => ({ md: inl(g.solve[k]), why: "Das ist nach " + inl(k) + " umgestellt, nicht nach " + inl(v) + "." }));
            const swapped = fracSwap(right);
            if (swapped && swapped !== right) wrong.push({ md: inl(swapped), why: "Zähler und Nenner sind vertauscht." });
            (g.wrong || []).forEach((w) => wrong.push({ md: inl(w), why: "Das ist keine gültige Umformung von " + inl(g.tex) + "." }));
            if (wrong.length >= 1) return { type: "choice", md: "Stelle " + inl(g.tex) + " nach " + inl(v) + " um.",
              options: G.options({ md: inl(right) }, G.shuffle(wrong)), explain: g.name + " nach " + inl(v) + " umgestellt: " + inl(right) + "." };
          }
        }
        // level 4, and level 3 without rearrangements: which of these formulas is wrong?
        const withWrong = list.filter((x) => (x.wrong || []).length);
        if (withWrong.length) {
          const bad = G.pick(withWrong), badTex = G.pick(bad.wrong);
          const rest = G.shuffle(list.filter((x) => x.id !== bad.id)).slice(0, 3);
          const lines = G.shuffle([{ md: bad.name + ": " + inl(badTex), why: "Falsch. Richtig ist " + inl(bad.tex) + ".", bad: true }]
            .concat(rest.map((x) => ({ md: x.name + ": " + inl(x.tex), why: "Stimmt." }))));
          return { type: "spot", md: "Genau eine Formel ist falsch. Welche?", lines: lines.map((l) => ({ md: l.md, why: l.why })),
            answer: lines.findIndex((l) => l.bad), explain: bad.name + " lautet " + inl(bad.tex) + "." + abiNote(bad) };
        }
        return { type: "reveal", md: "Wie lautet die Formel?\n\n**" + f.name + "**", solution: disp(f.tex) + vars(f), explain: f.name + ": " + inl(f.tex) };
      },
    };
  }
  LW.generator("formeln-physik", training("physik"));
  LW.generator("formeln-chemie", training("chemie"));
  LW.generator("formeln-mathe-oberstufe", training("mathe-oberstufe"));
})();
