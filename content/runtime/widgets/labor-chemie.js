/* Chemistry labs.
 *
 *   molbau: the molecule lab. Molecules are built in 3D. Tap an atom to attach the chosen element with the chosen bond,
 *           tap a bond to change its order; replace and delete atoms, close rings, invert a stereocentre or a double
 *           bond. Hydrogens follow from the valence and sit where they belong. The lab names what was built (IUPAC
 *           names in German, trivial names where common), gives the formula, the molar mass, the functional groups,
 *           R/S and E/Z.
 *     params: start (SMILES, default "C"), startStereo ("R", "S", "E" or "Z" for the start), blocks (amino acid codes to
 *             attach as residues), task
 *     task:   {conditions: [{c, show}], sample: {smiles, stereo: "R"|"S"|"E"|"Z"}}; a condition c is one of
 *             "ziel CCO" (same constitution), "nicht CCO", "formel C2H6O", "gruppe alkohol" (or "gruppe alkohol 2" for a
 *             secondary one), "kette 4" (longest carbon chain), "stereo S", "ez Z", "chiral", "peptid Gly-Ala",
 *             "aromat", "ring 6", "ohne gruppe ether", "keine ez", "reste 3", "nterm Gly", "cterm Ala".
 *   SMILES here is the plain subset: C N O S F Cl Br I, = and #, branches, ring digits; hydrogens implicit.
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  // ---------------------------------------------------------------- elements
  const EL = {
    H: { z: 1, val: 1, ve: 1, cov: 0.31, ball: 0.25, vdw: 1.1, m: 1.008, col: "#f4f4f4", dark: "#f4f4f4", name: "Wasserstoff" },
    C: { z: 6, val: 4, ve: 4, cov: 0.76, ball: 0.37, vdw: 1.7, m: 12.011, col: "#555a61", dark: "#8d939b", name: "Kohlenstoff" },
    N: { z: 7, val: 3, ve: 5, cov: 0.71, ball: 0.36, vdw: 1.55, m: 14.007, col: "#3b6fe3", dark: "#5b8cf5", name: "Stickstoff" },
    O: { z: 8, val: 2, ve: 6, cov: 0.66, ball: 0.35, vdw: 1.52, m: 15.999, col: "#e3363c", dark: "#f0545a", name: "Sauerstoff" },
    F: { z: 9, val: 1, ve: 7, cov: 0.57, ball: 0.33, vdw: 1.47, m: 18.998, col: "#7fd858", dark: "#8fe46a", name: "Fluor" },
    S: { z: 16, val: 2, ve: 6, cov: 1.05, ball: 0.48, vdw: 1.8, m: 32.06, col: "#e2bd22", dark: "#efcb3a", name: "Schwefel" },
    Cl: { z: 17, val: 1, ve: 7, cov: 1.02, ball: 0.46, vdw: 1.75, m: 35.45, col: "#25b648", dark: "#36c95a", name: "Chlor" },
    Br: { z: 35, val: 1, ve: 7, cov: 1.2, ball: 0.52, vdw: 1.85, m: 79.904, col: "#a1341c", dark: "#c34a2f", name: "Brom" },
    I: { z: 53, val: 1, ve: 7, cov: 1.39, ball: 0.6, vdw: 1.98, m: 126.904, col: "#7a3aa3", dark: "#9a5ac3", name: "Iod" },
  };
  const HAL = { F: "Fluor", Cl: "Chlor", Br: "Brom", I: "Iod" };
  /** The colour darkened toward black by the factor f (0 black, 1 unchanged). */
  const shade = (hex, f) => "#" + [1, 3, 5].map((k) => Math.round(parseInt(hex.slice(k, k + 2), 16) * f).toString(16).padStart(2, "0")).join("");

  // ---------------------------------------------------------------- the graph (hydrogens implicit)
  function adjacency(mol) {
    const adj = mol.atoms.map(() => []);
    mol.bonds.forEach((b, k) => { adj[b.a].push({ j: b.b, o: b.o, k }); adj[b.b].push({ j: b.a, o: b.o, k }); });
    return adj;
  }
  const usedVal = (adj, i) => adj[i].reduce((s, e) => s + e.o, 0);
  const hOf = (mol, adj, i) => Math.max(0, EL[mol.atoms[i].el].val - usedVal(adj, i));

  function parseSmiles(s) {
    const atoms = [], bonds = [], stack = [], rings = {};
    let prev = null, order = 1, i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === "(") { stack.push(prev); i++; continue; }
      if (ch === ")") { prev = stack.pop(); i++; continue; }
      if (ch === "=") { order = 2; i++; continue; }
      if (ch === "#") { order = 3; i++; continue; }
      if (ch === "-") { order = 1; i++; continue; }
      if (/\d/.test(ch)) {
        if (rings[ch]) { bonds.push({ a: rings[ch].atom, b: prev, o: Math.max(order, rings[ch].order) }); delete rings[ch]; }
        else rings[ch] = { atom: prev, order };
        order = 1; i++; continue;
      }
      const el = s.startsWith("Cl", i) ? "Cl" : s.startsWith("Br", i) ? "Br" : "CNOSFI".includes(ch) ? ch : null;
      if (!el) throw new Error("SMILES: unbekanntes Zeichen " + ch);
      i += el.length;
      atoms.push({ el });
      const idx = atoms.length - 1;
      if (prev != null) bonds.push({ a: prev, b: idx, o: order });
      prev = idx; order = 1;
    }
    return { atoms, bonds };
  }

  function formula(mol) {
    const adj = adjacency(mol), cnt = {};
    mol.atoms.forEach((a, i) => { cnt[a.el] = (cnt[a.el] || 0) + 1; cnt.H = (cnt.H || 0) + hOf(mol, adj, i); });
    const keys = Object.keys(cnt).filter((k) => cnt[k] > 0);
    const order = cnt.C ? ["C", "H"].filter((k) => cnt[k]).concat(keys.filter((k) => k !== "C" && k !== "H").sort()) : keys.sort();
    return order.map((k) => k + (cnt[k] > 1 ? cnt[k] : "")).join("");
  }
  const formulaTex = (f) => "\\mathrm{" + f.replace(/(\d+)/g, "_{$1}") + "}";
  function molarMass(mol) {
    const adj = adjacency(mol);
    return mol.atoms.reduce((s, a, i) => s + EL[a.el].m + hOf(mol, adj, i) * EL.H.m, 0);
  }

  /** Bonds in rings, the simple rings in cycle order, benzene rings (alternating bonds in a six-ring of carbons). */
  function ringInfo(mol, adj) {
    const n = mol.atoms.length;
    const reach = (a, b, skip) => {
      const seen = new Array(n).fill(false), st = [a];
      seen[a] = true;
      while (st.length) { const u = st.pop(); if (u === b) return true; adj[u].forEach((e) => { if (e.k !== skip && !seen[e.j]) { seen[e.j] = true; st.push(e.j); } }); }
      return false;
    };
    const ringBond = mol.bonds.map((b, k) => reach(b.a, b.b, k));
    const inRing = new Array(n).fill(false);
    mol.bonds.forEach((b, k) => { if (ringBond[k]) { inRing[b.a] = true; inRing[b.b] = true; } });
    // components of ring bonds: a simple ring has as many bonds as atoms
    const comp = new Array(n).fill(-1), rings = [];
    let complex = false;
    for (let s = 0; s < n; s++) {
      if (!inRing[s] || comp[s] >= 0) continue;
      const atoms = [], st = [s];
      comp[s] = rings.length + 100;
      let nb = 0;
      while (st.length) {
        const u = st.pop(); atoms.push(u);
        adj[u].forEach((e) => { if (ringBond[e.k]) { nb++; if (comp[e.j] < 0) { comp[e.j] = comp[s]; st.push(e.j); } } });
      }
      if (nb / 2 !== atoms.length) { complex = true; continue; }
      // walk the cycle
      const cyc = [s];
      let prev = -1, cur = s;
      for (let k = 1; k < atoms.length; k++) {
        const nx = adj[cur].find((e) => ringBond[e.k] && e.j !== prev && !cyc.includes(e.j));
        if (!nx) break;
        prev = cur; cur = nx.j; cyc.push(cur);
      }
      rings.push(cyc);
    }
    const bondOrder = (a, b) => { const e = adj[a].find((x) => x.j === b); return e ? e.o : 0; };
    const benzene = rings.filter((r) => r.length === 6 && r.every((i) => mol.atoms[i].el === "C") &&
      [0, 1].some((off) => r.every((a, k) => bondOrder(a, r[(k + 1) % 6]) === ((k + off) % 2 ? 1 : 2))));
    const aromatic = new Set();
    benzene.forEach((r) => r.forEach((i) => aromatic.add(i)));
    return { ringBond, inRing, rings, complex, benzene, aromatic, bondOrder };
  }

  // ---------------------------------------------------------------- functional groups
  const GROUP_LABEL = {
    carbonsaeure: "Carboxygruppe (Carbonsäure)", ester: "Estergruppe", amid: "Amidgruppe", aldehyd: "Aldehydgruppe",
    keton: "Ketogruppe (Keton)", alkohol: "Hydroxygruppe (Alkohol)", phenol: "Hydroxygruppe am Benzolring (Phenol)", ether: "Ethergruppe",
    amin: "Aminogruppe (Amin)", thiol: "Thiolgruppe", halogen: "Halogenatom", alken: "C=C-Doppelbindung", alkin: "C≡C-Dreifachbindung", aromat: "Benzolring",
  };
  const GRADE = ["", "primär", "sekundär", "tertiär"];

  function analyze(mol) {
    const adj = adjacency(mol), ring = ringInfo(mol, adj);
    const n = mol.atoms.length;
    const el = (i) => mol.atoms[i].el, H = (i) => hOf(mol, adj, i), isC = (i) => el(i) === "C";
    const groups = [], taken = new Set();
    for (let i = 0; i < n; i++) {
      if (!isC(i)) continue;
      const o2 = adj[i].find((e) => el(e.j) === "O" && e.o === 2);
      if (!o2) continue;
      const singles = adj[i].filter((e) => e.o === 1);
      const oh = singles.find((e) => el(e.j) === "O" && H(e.j) === 1);
      const or = singles.find((e) => el(e.j) === "O" && H(e.j) === 0 && adj[e.j].length === 2);
      const nn = singles.find((e) => el(e.j) === "N");
      const cs = singles.filter((e) => isC(e.j));
      let g = null;
      if (oh) g = { type: "carbonsaeure", c: i, part: [o2.j, oh.j] };
      else if (or) g = { type: "ester", c: i, part: [o2.j, or.j], alkO: or.j };
      else if (nn) g = { type: "amid", c: i, part: [o2.j, nn.j], n: nn.j };
      else if (H(i) >= 1 && cs.length <= 1) g = { type: "aldehyd", c: i, part: [o2.j] };
      else if (cs.length === 2) g = { type: "keton", c: i, part: [o2.j] };
      if (g) { groups.push(g); g.part.forEach((x) => taken.add(x)); }
    }
    for (let i = 0; i < n; i++) {
      if (taken.has(i)) continue;
      const e = el(i);
      if (e === "O") {
        const cs = adj[i].filter((x) => isC(x.j));
        if (H(i) === 1 && adj[i].length === 1 && cs.length === 1) {
          const c = cs[0].j;
          if (ring.aromatic.has(c)) groups.push({ type: "phenol", c, part: [i] });
          else groups.push({ type: "alkohol", c, part: [i], grade: Math.max(1, adj[c].filter((x) => isC(x.j)).length) });
        } else if (adj[i].length === 2 && cs.length === 2 && adj[i].every((x) => x.o === 1)) groups.push({ type: "ether", c: cs[0].j, part: [i] });
      } else if (e === "N" && adj[i].every((x) => x.o === 1)) {
        const cs = adj[i].filter((x) => isC(x.j));
        if (cs.length && cs.length === adj[i].length) groups.push({ type: "amin", c: cs[0].j, part: [i], n: i, grade: cs.length });
      } else if (e === "S" && H(i) === 1 && adj[i].length === 1 && isC(adj[i][0].j)) groups.push({ type: "thiol", c: adj[i][0].j, part: [i] });
      else if (HAL[e] && adj[i].length === 1 && isC(adj[i][0].j)) groups.push({ type: "halogen", c: adj[i][0].j, part: [i], el: e });
    }
    mol.bonds.forEach((b) => {
      if (!isC(b.a) || !isC(b.b)) return;
      if (b.o === 2 && !(ring.aromatic.has(b.a) && ring.aromatic.has(b.b))) groups.push({ type: "alken", c: b.a, part: [b.b] });
      if (b.o === 3) groups.push({ type: "alkin", c: b.a, part: [b.b] });
    });
    ring.benzene.forEach((r) => groups.push({ type: "aromat", c: r[0], part: r.slice(1) }));
    return { adj, ring, groups, el, H };
  }

  function groupText(g) {
    if (g.type === "alkohol") return "Hydroxygruppe (" + GRADE[Math.min(3, g.grade)] + "er Alkohol)";
    if (g.type === "amin") return "Aminogruppe (" + GRADE[Math.min(3, g.grade)] + "es Amin)";
    if (g.type === "halogen") return HAL[g.el] + "atom";
    return GROUP_LABEL[g.type];
  }

  // ---------------------------------------------------------------- same molecule? (constitution)
  const INTERN = new Map();
  const intern = (s) => { let v = INTERN.get(s); if (v == null) { v = "#" + INTERN.size.toString(36); INTERN.set(s, v); } return v; };
  function invariants(mol, adj) {
    let inv = mol.atoms.map((a, i) => intern(a.el + "," + adj[i].length + "," + hOf(mol, adj, i)));
    for (let r = 0; r < 6; r++) inv = inv.map((v, i) => intern(v + "(" + adj[i].map((e) => e.o + ":" + inv[e.j]).sort().join(";") + ")"));
    return inv;
  }
  function isomorphic(m1, m2) {
    if (m1.atoms.length !== m2.atoms.length || m1.bonds.length !== m2.bonds.length) return null;
    if (INTERN.size > 60000) INTERN.clear();
    const a1 = adjacency(m1), a2 = adjacency(m2), i1 = invariants(m1, a1), i2 = invariants(m2, a2);
    if (i1.slice().sort().join() !== i2.slice().sort().join()) return null;
    const n = m1.atoms.length, map = new Array(n).fill(-1), back = new Array(n).fill(-1);
    // breadth first, so every atom after the first has a mapped neighbour
    const order = [], seen = new Array(n).fill(false);
    for (let s = 0; s < n; s++) {
      if (seen[s]) continue;
      seen[s] = true;
      const q = [s];
      while (q.length) { const u = q.shift(); order.push(u); a1[u].forEach((e) => { if (!seen[e.j]) { seen[e.j] = true; q.push(e.j); } }); }
    }
    const ord2 = (c, d) => { const e = a2[c].find((x) => x.j === d); return e ? e.o : 0; };
    function go(k) {
      if (k === n) return true;
      const i = order[k];
      for (let c = 0; c < n; c++) {
        if (back[c] >= 0 || i2[c] !== i1[i]) continue;
        let ok = true, cnt = 0;
        for (const e of a1[i]) if (map[e.j] >= 0) { cnt++; if (ord2(c, map[e.j]) !== e.o) { ok = false; break; } }
        if (!ok) continue;
        if (a2[c].filter((e) => back[e.j] >= 0).length !== cnt) continue;
        map[i] = c; back[c] = i;
        if (go(k + 1)) return true;
        map[i] = -1; back[c] = -1;
      }
      return false;
    }
    return go(0) ? map : null;
  }

  // ---------------------------------------------------------------- libraries: trivial names and amino acids
  const AMINO = [
    ["Gly", "Glycin", "NCC(=O)O"], ["Ala", "Alanin", "NC(C)C(=O)O"], ["Val", "Valin", "NC(C(C)C)C(=O)O"], ["Leu", "Leucin", "NC(CC(C)C)C(=O)O"],
    ["Ile", "Isoleucin", "NC(C(C)CC)C(=O)O"], ["Ser", "Serin", "NC(CO)C(=O)O"], ["Thr", "Threonin", "NC(C(O)C)C(=O)O"], ["Cys", "Cystein", "NC(CS)C(=O)O"],
    ["Met", "Methionin", "NC(CCSC)C(=O)O"], ["Asp", "Asparaginsäure", "NC(CC(=O)O)C(=O)O"], ["Glu", "Glutaminsäure", "NC(CCC(=O)O)C(=O)O"],
    ["Asn", "Asparagin", "NC(CC(N)=O)C(=O)O"], ["Gln", "Glutamin", "NC(CCC(N)=O)C(=O)O"], ["Lys", "Lysin", "NC(CCCCN)C(=O)O"],
    ["Phe", "Phenylalanin", "NC(CC1=CC=CC=C1)C(=O)O"], ["Tyr", "Tyrosin", "NC(CC1=CC=C(O)C=C1)C(=O)O"], ["Pro", "Prolin", "OC(=O)C1CCCN1"],
    ["Arg", "Arginin", "NC(CCCNC(N)=N)C(=O)O"], ["His", "Histidin", "NC(CC1=CN=CN1)C(=O)O"], ["Trp", "Tryptophan", "NC(CC1=CNC2=CC=CC=C12)C(=O)O"],
  ].map(([code, name, smi]) => ({ code, name, smi, mol: parseSmiles(smi) }));
  const TRIVIAL = [
    ["CC(=O)O", "Essigsäure"], ["OC=O", "Ameisensäure"], ["CCC(=O)O", "Propionsäure"], ["CCCC(=O)O", "Buttersäure"], ["CC(C)=O", "Aceton"],
    ["C=O", "Formaldehyd"], ["CC=O", "Acetaldehyd"], ["OCC(O)CO", "Glycerin"], ["OCCO", "Glykol"], ["CC(O)C(=O)O", "Milchsäure"],
    ["CC(=O)C(=O)O", "Brenztraubensäure"], ["OC(=O)C(=O)O", "Oxalsäure"], ["OC(=O)CCC(=O)O", "Bernsteinsäure"], ["OC(C(O)C(=O)O)C(=O)O", "Weinsäure"],
    ["OC(=O)CC(O)(CC(=O)O)C(=O)O", "Citronensäure"], ["NC(N)=O", "Harnstoff"], ["CC1=CC=CC=C1", "Toluol"], ["OC1=CC=CC=C1", "Phenol"],
    ["NC1=CC=CC=C1", "Anilin"], ["C=CC(C)=C", "Isopren"], ["C=C", "Ethylen"], ["C#C", "Acetylen"], ["ClC(Cl)Cl", "Chloroform"],
    ["C=CCl", "Vinylchlorid"], ["OCC(O)C=O", "Glycerinaldehyd"], ["CC(C)O", "Isopropanol"], ["CCOCC", "Diethylether"],
    ["CCOC(C)=O", "Essigsäureethylester"], ["OC(=O)C1=CC=CC=C1", "Benzoesäure"],
  ].map(([smi, name]) => ({ name, mol: parseSmiles(smi) }));
  const INORGANIC = { H2O: "Wasser", H3N: "Ammoniak", H2S: "Schwefelwasserstoff", FH: "Fluorwasserstoff", ClH: "Chlorwasserstoff",
    BrH: "Bromwasserstoff", HI: "Iodwasserstoff", H2O2: "Wasserstoffperoxid", H4N2: "Hydrazin" };
  function trivialName(mol) {
    const a = AMINO.find((x) => isomorphic(x.mol, mol));
    if (a) return a.name;
    const t = TRIVIAL.find((x) => isomorphic(x.mol, mol));
    return t ? t.name : null;
  }

  /** Amino acids joined by peptide bonds: "Gly-Ala-Ser" from the N-terminus, or null. */
  function peptide(mol) {
    const A = analyze(mol);
    const cuts = A.groups.filter((g) => g.type === "amid" && A.adj[g.n].length >= 2);
    if (!cuts.length) { const a = AMINO.find((x) => isomorphic(x.mol, mol)); return a ? a.code : null; }
    const cutKey = new Set(cuts.map((g) => Math.min(g.c, g.n) + "-" + Math.max(g.c, g.n)));
    const n = mol.atoms.length, comp = new Array(n).fill(-1);
    let nc = 0;
    for (let s = 0; s < n; s++) {
      if (comp[s] >= 0) continue;
      const st = [s]; comp[s] = nc;
      while (st.length) { const u = st.pop(); A.adj[u].forEach((e) => { if (comp[e.j] < 0 && !cutKey.has(Math.min(u, e.j) + "-" + Math.max(u, e.j))) { comp[e.j] = nc; st.push(e.j); } }); }
      nc++;
    }
    const codes = [];
    for (let c = 0; c < nc; c++) {
      const idx = [], at = new Map();
      for (let i = 0; i < n; i++) if (comp[i] === c) { at.set(i, idx.length); idx.push(i); }
      const sub = { atoms: idx.map((i) => ({ el: mol.atoms[i].el })), bonds: [] };
      mol.bonds.forEach((b) => { if (at.has(b.a) && at.has(b.b)) sub.bonds.push({ a: at.get(b.a), b: at.get(b.b), o: b.o }); });
      // the carbonyl carbon of a cut bond gets back its OH
      cuts.forEach((g) => { if (at.has(g.c)) { sub.atoms.push({ el: "O" }); sub.bonds.push({ a: at.get(g.c), b: sub.atoms.length - 1, o: 1 }); } });
      const a = AMINO.find((x) => isomorphic(x.mol, sub));
      if (!a) return null;
      codes[c] = a.code;
    }
    // order: start at the residue whose nitrogen is not part of a cut bond
    const nextOf = new Map();
    cuts.forEach((g) => nextOf.set(comp[g.c], comp[g.n]));
    const targets = new Set(nextOf.values());
    let cur = [...Array(nc).keys()].find((c) => !targets.has(c));
    const seq = [];
    while (cur != null && seq.length <= nc) { seq.push(codes[cur]); cur = nextOf.get(cur); }
    return seq.length === nc ? seq.join("-") : null;
  }

  // ---------------------------------------------------------------- CIP priorities (rule 1, duplicate atoms)
  function sphereSets(mol, adj, center, j, depth) {
    const Z = (i) => EL[mol.atoms[i].el].z;
    if (j < 0) return [[1]];
    const out = [[Z(j)]];
    let frontier = [{ atom: j, from: center, dup: false }];
    for (let d = 0; d < depth && frontier.length; d++) {
      const flat = [], next = [];
      frontier.forEach((nd) => {
        if (nd.dup) { flat.push(0, 0, 0); return; }
        const kids = [];
        adj[nd.atom].forEach((e) => {
          if (e.j === nd.from) { for (let k = 1; k < e.o; k++) kids.push({ z: Z(e.j), node: { atom: e.j, dup: true } }); return; }
          kids.push({ z: Z(e.j), node: { atom: e.j, from: nd.atom, dup: false } });
          for (let k = 1; k < e.o; k++) kids.push({ z: Z(e.j), node: { atom: e.j, dup: true } });
        });
        for (let h = 0; h < hOf(mol, adj, nd.atom); h++) kids.push({ z: 1, node: null });
        kids.sort((p, q) => q.z - p.z);
        kids.forEach((k) => { flat.push(k.z); if (k.node) next.push(k.node); });
      });
      out.push(flat);
      frontier = next;
    }
    return out;
  }
  function cmpSets(A, B) {
    for (let s = 0; s < Math.max(A.length, B.length); s++) {
      const x = A[s] || [], y = B[s] || [];
      for (let k = 0; k < Math.max(x.length, y.length); k++) {
        const p = k < x.length ? x[k] : -1, q = k < y.length ? y[k] : -1;
        if (p !== q) return p > q ? 1 : -1;
      }
    }
    return 0;
  }
  /** Branches (neighbour index or -1 for H) ranked from highest to lowest; null if two of them tie. */
  function rankBranches(mol, adj, center, branches) {
    const sets = branches.map((b) => ({ b, s: sphereSets(mol, adj, center, b, 10) }));
    sets.sort((p, q) => cmpSets(q.s, p.s));
    for (let k = 1; k < sets.length; k++) if (cmpSets(sets[k - 1].s, sets[k].s) === 0) return null;
    return sets.map((x) => x.b);
  }

  // ---------------------------------------------------------------- names (IUPAC, German)
  const STEMS = ["", "Meth", "Eth", "Prop", "But", "Pent", "Hex", "Hept", "Oct", "Non", "Dec", "Undec", "Dodec", "Tridec", "Tetradec", "Pentadec", "Hexadec", "Heptadec", "Octadec", "Nonadec", "Icos"];
  const MULT = ["", "", "Di", "Tri", "Tetra", "Penta", "Hexa", "Hepta", "Octa"];
  const MULTC = ["", "", "Bis", "Tris", "Tetrakis", "Pentakis"];
  const MULTS = ["", "", "di", "tri", "tetra", "penta", "hexa"];
  const PRIO = ["carbonsaeure", "ester", "amid", "aldehyd", "keton", "alkohol", "thiol", "amin"];
  const SUFFIX = { carbonsaeure: "säure", amid: "amid", aldehyd: "al", keton: "on", alkohol: "ol", thiol: "thiol", amin: "amin" };
  const lexLess = (a, b) => { for (let k = 0; k < Math.max(a.length, b.length); k++) { const p = a[k] == null ? -Infinity : a[k], q = b[k] == null ? -Infinity : b[k]; if (p !== q) return p < q ? -1 : 1; } return 0; };
  const alphaKey = (s) => s.replace(/^\(/, "").replace(/^[\d,]+-/, "").toLowerCase();
  const capFirst = (s) => s.replace(/[a-zäöü]/, (c) => c.toUpperCase());

  function prefixString(subs, noLocants) {
    const byName = new Map();
    subs.forEach((s) => { if (!byName.has(s.name)) byName.set(s.name, []); byName.get(s.name).push(s.loc); });
    const keys = [...byName.keys()].sort((a, b) => alphaKey(a).localeCompare(alphaKey(b), "de"));
    return keys.map((k) => {
      const locs = byName.get(k).sort((a, b) => a - b);
      const mult = locs.length > 1 ? (k.startsWith("(") ? MULTC[locs.length] : MULT[locs.length]) : "";
      return (noLocants ? "" : locs.join(",") + "-") + mult + k;
    }).join("-");
  }

  function namer(mol) {
    const n = mol.atoms.length;
    if (!n) return null;
    const A = analyze(mol);
    const { adj, ring, groups, el, H } = A;
    if (!mol.atoms.some((a) => a.el === "C")) return { name: INORGANIC[formula(mol)] || null, loc: null };
    if (ring.complex || ring.rings.length > 1 || ring.rings.some((r) => r.some((i) => el(i) !== "C"))) return null;
    const bondO = (a, b) => ring.bondOrder(a, b);
    const princ = PRIO.find((t) => groups.some((g) => g.type === t || (t === "alkohol" && g.type === "phenol")));
    const princGroups = groups.filter((g) => g.type === princ || (princ === "alkohol" && g.type === "phenol"));
    if (princ === "amin" && princGroups.some((g) => g.grade > 1)) return null;
    if (princ === "amid" && princGroups.some((g) => adj[g.n].length > 1)) return null;
    if (princ === "ester") return nameEster();

    // a substituent hanging from atom `from` at its neighbour `nb`
    function substName(nb, from) {
      const e = el(nb), o = bondO(from, nb);
      if (e === "C") {
        if (ring.inRing[nb]) return ringSubst(nb);
        if (o === 2) return adj[nb].length === 1 ? "Methyliden" : null;
        if (o === 3) return null;
        return alkylName(nb, from);
      }
      if (o === 2) return e === "O" ? "Oxo" : null;
      if (o !== 1) return null;
      if (e === "O") {
        if (H(nb) === 1) return "Hydroxy";
        const other = adj[nb].find((x) => x.j !== from);
        if (other && el(other.j) === "C" && !ring.inRing[other.j] && other.o === 1) { const alk = alkylName(other.j, nb); return alk ? alk.replace(/yl(\)?)$/, "oxy$1") : null; }
        return null;
      }
      if (e === "N") return H(nb) === 2 ? "Amino" : null;
      if (e === "S") {
        if (H(nb) === 1) return "Sulfanyl";
        const other = adj[nb].find((x) => x.j !== from);
        if (other && el(other.j) === "C" && !ring.inRing[other.j] && other.o === 1) { const alk = alkylName(other.j, nb); return alk ? "(" + alk.replace(/^\(|\)$/g, "") + "sulfanyl)" : null; }
        return null;
      }
      if (HAL[e]) return HAL[e];
      return null;
    }
    function ringSubst(nb) {
      const r = ring.rings[0];
      if (!r || !r.includes(nb)) return null;
      // only bare rings: no other substituents
      const bare = r.every((i) => adj[i].filter((e) => !r.includes(e.j)).length === (i === nb ? 1 : 0));
      if (!bare) return null;
      if (ring.benzene.length) return "Phenyl";
      if (r.some((i, k) => bondO(i, r[(k + 1) % r.length]) !== 1)) return null;
      return "Cyclo" + STEMS[r.length].toLowerCase() + "yl";
    }
    function alkylName(root, from) {
      // the branch must be a saturated hydrocarbon
      const sub = [], seen = new Set([from, root]), st = [root];
      while (st.length) {
        const u = st.pop(); sub.push(u);
        for (const e of adj[u]) {
          if (seen.has(e.j)) continue;
          if (el(e.j) !== "C" || ring.inRing[e.j]) return null;
          seen.add(e.j); st.push(e.j);
        }
      }
      if (sub.some((u) => adj[u].some((e) => e.o !== 1 && (sub.includes(e.j) || e.j === from)))) {
        // vinyl and ethynyl only
        if (sub.length === 2 && bondO(sub[0], sub[1]) === 2) return "Ethenyl";
        if (sub.length === 2 && bondO(sub[0], sub[1]) === 3) return "Ethinyl";
        return null;
      }
      // longest chain from the attachment atom
      const longest = (u, prev) => {
        let best = [u];
        adj[u].forEach((e) => { if (e.j !== prev && e.j !== from && sub.includes(e.j)) { const p = [u].concat(longest(e.j, u)); if (p.length > best.length) best = p; } });
        return best;
      };
      const chain = longest(root, from);
      const subs = [];
      for (let k = 0; k < chain.length; k++) {
        for (const e of adj[chain[k]]) {
          if (e.j === from || chain.includes(e.j)) continue;
          const nm = alkylName(e.j, chain[k]);
          if (!nm) return null;
          subs.push({ name: nm, loc: k + 1 });
        }
      }
      const base = STEMS[chain.length] + "yl";
      if (!subs.length) return base;
      return "(" + prefixString(subs) + base.toLowerCase() + ")";
    }

    // evaluate one numbering of the parent (a sequence of atoms)
    function evaluate(seq, cyclic, anchorOf) {
      const pos = new Map(seq.map((a, k) => [a, k + 1]));
      const princLoc = [], subs = [], en = [], yn = [];
      for (let k = 0; k < seq.length; k++) {
        const nxt = k + 1 < seq.length ? seq[k + 1] : cyclic ? seq[0] : -1;
        if (nxt >= 0 && (k + 1 < seq.length || seq.length > 2)) {
          const o = bondO(seq[k], nxt);
          const loc = cyclic && k === seq.length - 1 ? seq.length : k + 1;
          if (o === 2 && !ring.aromatic.has(seq[k])) en.push(loc);
          if (o === 3) yn.push(loc);
        }
      }
      let bad = false;
      seq.forEach((a, k) => {
        for (const e of adj[a]) {
          if (pos.has(e.j)) continue;
          const g = anchorOf.get(e.j);
          if (g && g.anchor === a) continue;
          const nm = substName(e.j, a);
          if (!nm) { bad = true; continue; }
          subs.push({ name: nm, loc: k + 1 });
        }
      });
      princGroups.forEach((g) => { if (pos.has(g.anchor)) princLoc.push(pos.get(g.anchor)); });
      princLoc.sort((a, b) => a - b);
      const subLoc = subs.map((s) => s.loc).sort((a, b) => a - b);
      const alpha = subs.slice().sort((p, q) => alphaKey(p.name).localeCompare(alphaKey(q.name), "de") || p.loc - q.loc).map((s) => s.loc);
      return { seq, pos, princLoc, subs, en, yn, mult: en.concat(yn).sort((a, b) => a - b), subLoc, alpha, bad };
    }
    function better(a, b) {
      // a better than b? (principal groups, multiple bonds, length, substituents, then lowest locants)
      const keys = [
        [-a.princLoc.length, -b.princLoc.length], [-a.mult.length, -b.mult.length], [-a.seq.length, -b.seq.length], [-a.subs.length, -b.subs.length]];
      for (const [x, y] of keys) if (x !== y) return x < y;
      for (const [x, y] of [[a.princLoc, b.princLoc], [a.mult, b.mult], [a.en, b.en], [a.subLoc, b.subLoc], [a.alpha, b.alpha]]) {
        const c = lexLess(x, y);
        if (c) return c < 0;
      }
      return false;
    }

    // the anchor of each principal group (the parent atom that carries it) and the atoms that belong to it
    const anchorOf = new Map();
    princGroups.forEach((g) => {
      if (g.type === "carbonsaeure" || g.type === "aldehyd" || g.type === "amid" || g.type === "keton") g.anchor = g.c;
      else g.anchor = g.c;
      g.part.forEach((x) => anchorOf.set(x, g));
    });

    let best = null, kind = "chain", r = ring.rings[0] || null;
    const benz = ring.benzene.length === 1;
    // a ring is the parent when it carries the principal group, or a carboxy or aldehyde group sits right on it, or there is none
    let exo = null;
    if (r) {
      const onRing = princGroups.filter((g) => r.includes(g.anchor));
      const nextTo = princGroups.filter((g) => !r.includes(g.anchor) && (g.type === "carbonsaeure" || g.type === "aldehyd") && adj[g.anchor].some((e) => r.includes(e.j)));
      if (!princ || (onRing.length === princGroups.length) || (nextTo.length === 1 && princGroups.length === 1)) {
        kind = benz ? "benzol" : "cyclo";
        if (nextTo.length === 1 && princGroups.length === 1) {
          exo = nextTo[0];
          const ra = adj[exo.anchor].find((e) => r.includes(e.j)).j;
          exo.part.concat([exo.anchor]).forEach((x) => anchorOf.set(x, { anchor: ra }));
          exo.anchor = ra;
        }
        const L = r.length;
        for (let s = 0; s < L; s++) for (const dir of [1, -1]) {
          const seq = [];
          for (let k = 0; k < L; k++) seq.push(r[(s + dir * k + L * 2) % L]);
          const ev = evaluate(seq, true, anchorOf);
          if (!best || better(ev, best)) best = ev;
        }
      }
    }
    if (kind === "chain") {
      // every simple path through carbons outside rings, both directions
      const cs = [];
      for (let i = 0; i < n; i++) if (el(i) === "C" && !(r && r.includes(i))) cs.push(i);
      for (const s of cs) {
        const prev = new Map([[s, -1]]), q = [s];
        while (q.length) {
          const u = q.shift();
          adj[u].forEach((e) => { if (el(e.j) === "C" && !(r && r.includes(e.j)) && !prev.has(e.j)) { prev.set(e.j, u); q.push(e.j); } });
        }
        for (const t of prev.keys()) {
          const seq = [];
          for (let v = t; v !== -1; v = prev.get(v)) seq.push(v);
          seq.reverse();
          const ev = evaluate(seq, false, anchorOf);
          if (!best || better(ev, best)) best = ev;
        }
      }
    }
    if (!best || best.bad) return null;
    // groups that did not make it into the parent would need prefixes such as hydroxymethyl: not named here
    if (best.princLoc.length !== princGroups.length) return null;

    const L = best.seq.length;
    const hasPrefix = best.subs.length > 0;
    let parent, stemPart;
    const sfx = princ ? SUFFIX[princ] : "";
    const m = best.princLoc.length;
    if (kind === "benzol") {
      const BENZ = { alkohol: "Phenol", carbonsaeure: "Benzoesäure", aldehyd: "Benzaldehyd", amin: "Anilin" };
      if (princ && (m > 1 || !BENZ[princ])) return null;
      parent = princ ? BENZ[princ] : "Benzol";
      const noLoc = !princ && best.subs.length === 1;
      const pre = hasPrefix ? prefixString(best.subs, noLoc) : "";
      return finish(pre ? pre + parent.toLowerCase() : parent, best);
    }
    // multiple bonds
    const omitUnsat = kind === "cyclo" ? best.mult.length === 1 && !hasPrefix && !princ : L === 2 || (L === 3 && best.mult.length === 1 && !hasPrefix && !princ);
    const nm = best.en.length, ny = best.yn.length;
    if (!nm && !ny) stemPart = STEMS[L] + "an";
    else {
      const first = nm ? best.en : best.yn;
      const a = (nm > 1 || (!nm && ny > 1)) ? "a" : "";
      stemPart = STEMS[L] + a;
      if (nm) stemPart += omitUnsat ? "en" : "-" + best.en.join(",") + "-" + MULTS[nm] + "en";
      if (ny) stemPart += omitUnsat ? "in" : (nm ? "-" : "-") + best.yn.join(",") + "-" + MULTS[ny] + "in";
      if (omitUnsat) stemPart = stemPart.replace(/-/g, "");
      void first;
    }
    if (kind === "cyclo") stemPart = "Cyclo" + stemPart.toLowerCase();
    // the principal group
    let suffix = "";
    if (princ) {
      const terminal = princ === "carbonsaeure" || princ === "aldehyd" || princ === "amid";
      let word = (m > 1 ? MULTS[m] : "") + sfx;
      if (exo) word = (m > 1 ? MULTS[m] : "") + (princ === "carbonsaeure" ? "carbonsäure" : "carbaldehyd");
      const omit = exo || terminal || (kind === "chain" && L <= 2 && m === 1) ||
        (kind === "chain" && princ === "keton" && L <= 4 && m === 1 && !hasPrefix && !best.mult.length) ||
        (kind === "cyclo" && m === 1 && !hasPrefix && !best.mult.length);
      suffix = omit ? word : "-" + best.princLoc.join(",") + "-" + word;
    }
    let core = stemPart + suffix;
    // "an" + vowel: Ethan + ol stays Ethanol; "en" + al gives Prop-2-enal
    const noLoc = (kind === "chain" && L === 1) || (kind === "chain" && L === 2 && best.subs.length === 1 && !princ) ||
      (kind === "cyclo" && best.subs.length === 1 && !princ && !best.mult.length);
    const pre = hasPrefix ? prefixString(best.subs, noLoc) : "";
    parent = pre ? pre + core.charAt(0).toLowerCase() + core.slice(1) : core;
    return finish(parent, best);

    function finish(nm2, ev) {
      return { name: capFirst(nm2.toLowerCase()), loc: ev.pos };
    }

    function nameEster() {
      const g = princGroups[0];
      if (princGroups.length !== 1) return null;
      const alkC = adj[g.alkO].find((e) => e.j !== g.c).j;
      if (el(alkC) !== "C" || ring.inRing[alkC]) return null;
      const alk = alkylName(alkC, g.alkO);
      if (!alk) return null;
      // the acid: everything on the carbonyl side, the ester oxygen becomes OH
      const keep = new Set(), st = [g.c];
      keep.add(g.c);
      while (st.length) { const u = st.pop(); adj[u].forEach((e) => { if (!keep.has(e.j) && !(u === g.alkO && e.j === alkC)) { keep.add(e.j); st.push(e.j); } }); }
      const idx = [...keep].sort((a, b) => a - b), at = new Map(idx.map((a, k) => [a, k]));
      const acid = { atoms: idx.map((i) => ({ el: el(i) })), bonds: [] };
      mol.bonds.forEach((b) => { if (at.has(b.a) && at.has(b.b)) acid.bonds.push({ a: at.get(b.a), b: at.get(b.b), o: b.o }); });
      const an = namer(acid);
      if (!an || !an.name || !/säure$/.test(an.name)) return null;
      const alkLow = alk.toLowerCase();
      return { name: an.name + alkLow + "ester", alt: capFirst(alkLow) + an.name.replace(/säure$/, "oat").replace(/^./, (c) => c.toLowerCase()), loc: null };
    }
  }

  // ---------------------------------------------------------------- the lab
  const BLOCKS = new Map(AMINO.map((a) => [a.code, a]));

  LW.widget("molbau", {
    mount(host, p, ctx) {
      const task = p.task || null;
      // state: heavy atoms with positions, bonds, hydrogens as nodes with positions
      let S = null;
      const undo = [];
      const snapshot = () => JSON.stringify(S);
      const pushUndo = () => { undo.push(snapshot()); if (undo.length > 40) undo.shift(); };

      // ------------------------------------------------ geometry
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
      const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const len = (a) => Math.hypot(a[0], a[1], a[2]);
      const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
      const bondLen = (e1, e2, o) => (EL[e1].cov + EL[e2].cov) * (o === 2 ? 0.87 : o === 3 ? 0.78 : 1);
      const FIB = [];
      for (let k = 0; k < 96; k++) { const y = 1 - (2 * (k + 0.5)) / 96, r = Math.sqrt(1 - y * y), t = k * 2.399963; FIB.push([Math.cos(t) * r, y, Math.sin(t) * r]); }

      const mol = () => ({ atoms: S.atoms.map((a) => ({ el: a.el })), bonds: S.bonds.map((b) => ({ a: b.a, b: b.b, o: b.o })) });
      const nbrDirs = (i) => {
        const out = [];
        S.bonds.forEach((b) => { if (b.a === i) out.push(unit(sub(S.atoms[b.b].p, S.atoms[i].p))); if (b.b === i) out.push(unit(sub(S.atoms[b.a].p, S.atoms[i].p))); });
        S.hs.forEach((h) => { if (h.at === i) out.push(unit(sub(h.p, S.atoms[i].p))); });
        return out;
      };
      const domains = (i) => { const adj = adjacency(mol()); const e = S.atoms[i].el; return adj[i].length + hOf(mol(), adj, i) + (EL[e].ve - EL[e].val) / 2; };
      function freeDir(i) {
        const ds = nbrDirs(i);
        if (!ds.length) return [1, 0, 0];
        if (ds.length === 1) {
          // tetrahedral or trigonal or linear away from the one bond
          const steric = domains(i);
          const ang = steric >= 4 ? 109.47 : steric === 3 ? 120 : 180;
          const d = ds[0];
          const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
          const perp = unit(cross(d, ref));
          const t = (ang * Math.PI) / 180;
          return unit(add(mul(d, Math.cos(t)), mul(perp, Math.sin(t))));
        }
        const s = ds.reduce((acc, d) => add(acc, d), [0, 0, 0]);
        if (len(s) > 0.35 && ds.length >= 2) {
          const opp = unit(mul(s, -1));
          if (ds.length >= 3 || domains(i) === 3) return opp;
        }
        let best = FIB[0], bestScore = -Infinity;
        FIB.forEach((c) => { const sc = Math.min(...ds.map((d) => -dot(c, d))); if (sc > bestScore) { bestScore = sc; best = c; } });
        return best;
      }
      function syncH(prefer) {
        const m = mol(), adj = adjacency(m);
        S.atoms.forEach((a, i) => {
          const need = hOf(m, adj, i);
          let mine = S.hs.filter((h) => h.at === i);
          while (mine.length > need) {
            // drop the hydrogen that points most toward the preferred spot
            let drop = mine[mine.length - 1];
            if (prefer && prefer[i]) {
              const t = prefer[i];
              let bestDot = -Infinity;
              mine.forEach((h) => { const d = dot(unit(sub(h.p, a.p)), unit(sub(t, a.p))); if (d > bestDot) { bestDot = d; drop = h; } });
            }
            S.hs.splice(S.hs.indexOf(drop), 1);
            mine = S.hs.filter((h) => h.at === i);
          }
          while (mine.length < need) {
            const d = freeDir(i);
            S.hs.push({ at: i, p: add(a.p, mul(d, bondLen(a.el, "H", 1))) });
            mine = S.hs.filter((h) => h.at === i);
          }
        });
      }

      /** Position-based relaxation: bond lengths, angles, flat double bonds that keep cis or trans, kept chirality, no overlaps. */
      function relax(iters) {
        const m = mol(), adj = adjacency(m), nH = S.atoms.length;
        const P = S.atoms.map((a) => a.p).concat(S.hs.map((h) => h.p));
        const elOf = (k) => (k < nH ? S.atoms[k].el : "H");
        const nb = P.map(() => []);
        const cons = [];
        S.bonds.forEach((b) => { nb[b.a].push(b.b); nb[b.b].push(b.a); cons.push([b.a, b.b, bondLen(S.atoms[b.a].el, S.atoms[b.b].el, b.o), 1]); });
        S.hs.forEach((h, k) => { nb[h.at].push(nH + k); nb[nH + k].push(h.at); cons.push([h.at, nH + k, bondLen(S.atoms[h.at].el, "H", 1), 1]); });
        const blen = (i, j) => { const c = cons.find((x) => (x[0] === i && x[1] === j) || (x[0] === j && x[1] === i)); return c ? c[2] : 1.4; };
        const near = new Set();
        const key = (i, j) => (i < j ? i * 4096 + j : j * 4096 + i);
        cons.forEach((c) => near.add(key(c[0], c[1])));
        for (let i = 0; i < nH; i++) {
          const e = S.atoms[i].el, lp = (EL[e].ve - EL[e].val) / 2;
          const amideN = e === "N" && adj[i].some((x) => S.atoms[x.j].el === "C" && adj[x.j].some((y) => y.o === 2 && S.atoms[y.j].el === "O"));
          const steric = amideN ? 3 : nb[i].length + lp;
          let ang = steric >= 4 ? 109.47 : steric === 3 ? 120 : 180;
          if (steric === 4 && lp === 1) ang = 107;
          if (steric === 4 && lp === 2) ang = 104.5;
          const t = (ang * Math.PI) / 180;
          for (let u = 0; u < nb[i].length; u++) for (let v = u + 1; v < nb[i].length; v++) {
            const a = nb[i][u], b = nb[i][v], la = blen(i, a), lb = blen(i, b);
            cons.push([a, b, Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(t)), 0.7]);
            near.add(key(a, b));
          }
        }
        // double bonds stay flat and keep their side (cis or trans as they are now)
        S.bonds.forEach((b) => {
          if (b.o !== 2) return;
          const xa = nb[b.a].filter((x) => x !== b.b), xb = nb[b.b].filter((x) => x !== b.a);
          const ax = unit(sub(P[b.b], P[b.a]));
          xa.forEach((x) => xb.forEach((y) => {
            const vx = sub(P[x], P[b.a]), vy = sub(P[y], P[b.b]);
            const px = sub(vx, mul(ax, dot(vx, ax))), py = sub(vy, mul(ax, dot(vy, ax)));
            const cis = dot(px, py) > 0;
            const lab = blen(b.a, b.b), lx = blen(b.a, x), ly = blen(b.b, y), c120 = Math.cos((120 * Math.PI) / 180), s120 = Math.sin((120 * Math.PI) / 180);
            const X = [lx * c120, lx * s120], Y = [lab - ly * c120, (cis ? 1 : -1) * ly * s120];
            cons.push([x, y, Math.hypot(X[0] - Y[0], X[1] - Y[1]), 0.5]);
            near.add(key(x, y));
          }));
        });
        // chirality as it is now
        const chiral = [];
        for (let i = 0; i < nH; i++) if (nb[i].length === 4 && adj[i].every((e) => e.o === 1)) {
          const [a, b, c] = nb[i];
          chiral.push([i, a, b, c, Math.sign(dot(sub(P[a], P[i]), cross(sub(P[b], P[i]), sub(P[c], P[i])))) || 1]);
        }
        const N = P.length;
        for (let it = 0; it < iters; it++) {
          for (const [i, j, d, w] of cons) {
            const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1], dz = P[j][2] - P[i][2];
            const l = Math.hypot(dx, dy, dz) || 1e-6, f = (0.5 * w * (l - d)) / l;
            P[i][0] += dx * f; P[i][1] += dy * f; P[i][2] += dz * f;
            P[j][0] -= dx * f; P[j][1] -= dy * f; P[j][2] -= dz * f;
          }
          for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            if (near.has(key(i, j))) continue;
            const hi = elOf(i) === "H", hj = elOf(j) === "H";
            const rmin = hi && hj ? 2.1 : hi || hj ? 2.45 : 2.85;
            const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1], dz = P[j][2] - P[i][2];
            const l2 = dx * dx + dy * dy + dz * dz;
            if (l2 >= rmin * rmin) continue;
            const l = Math.sqrt(l2) || 1e-3, f = (0.18 * (l - rmin)) / l;
            P[i][0] += dx * f; P[i][1] += dy * f; P[i][2] += dz * f;
            P[j][0] -= dx * f; P[j][1] -= dy * f; P[j][2] -= dz * f;
          }
          for (const [i, a, b, c, sg] of chiral) {
            const v = dot(sub(P[a], P[i]), cross(sub(P[b], P[i]), sub(P[c], P[i])));
            if (Math.sign(v) !== sg) {
              // the centre has slipped through the plane of three neighbours: put it back
              const nrm = unit(cross(sub(P[b], P[a]), sub(P[c], P[a])));
              const dist = dot(sub(P[i], P[a]), nrm);
              const moveBy = mul(nrm, -2 * dist);
              P[i][0] += moveBy[0]; P[i][1] += moveBy[1]; P[i][2] += moveBy[2];
            }
          }
        }
        // centre of mass to the origin
        const c = P.reduce((s, q) => add(s, q), [0, 0, 0]).map((v) => v / Math.max(1, P.length));
        P.forEach((q) => { q[0] -= c[0]; q[1] -= c[1]; q[2] -= c[2]; });
      }

      // ------------------------------------------------ editing
      const hsOf = (i) => S.hs.filter((h) => h.at === i);
      function attach(i, el, o, at) {
        const m = mol(), adj = adjacency(m);
        if (hOf(m, adj, i) < o || EL[el].val < o) return false;
        const a = S.atoms[i];
        // the new atom takes the place of a hydrogen (the tapped one, if any)
        const hs = hsOf(i);
        let dir = freeDir(i);
        const hTap = at && hs.includes(at) ? at : hs[0];
        if (hTap) dir = unit(sub(hTap.p, a.p));
        S.atoms.push({ el, p: add(a.p, mul(dir, bondLen(a.el, el, o))) });
        S.bonds.push({ a: i, b: S.atoms.length - 1, o });
        if (hTap) S.hs.splice(S.hs.indexOf(hTap), 1);
        const pref = {}; pref[i] = S.atoms[S.atoms.length - 1].p;
        syncH(pref);
        return true;
      }
      function setOrder(k, o) {
        const b = S.bonds[k], m = mol(), adj = adjacency(m);
        const need = o - b.o;
        if (need > 0 && (hOf(m, adj, b.a) < need || hOf(m, adj, b.b) < need)) return false;
        if (o > EL[S.atoms[b.a].el].val || o > EL[S.atoms[b.b].el].val) return false;
        b.o = o;
        const pref = {}; pref[b.a] = S.atoms[b.b].p; pref[b.b] = S.atoms[b.a].p;
        syncH(pref);
        return true;
      }
      function replace(i, el) {
        const m = mol(), adj = adjacency(m);
        if (usedVal(adj, i) > EL[el].val || S.atoms[i].el === el) return false;
        S.atoms[i].el = el;
        syncH();
        return true;
      }
      function removeAtom(i) {
        if (S.atoms.length <= 1) return false;
        const gone = S.atoms[i].p, nbs = [];
        S.bonds = S.bonds.filter((b) => { if (b.a === i) nbs.push(b.b); if (b.b === i) nbs.push(b.a); return b.a !== i && b.b !== i; });
        S.hs = S.hs.filter((h) => h.at !== i);
        S.atoms.splice(i, 1);
        const re = (x) => (x > i ? x - 1 : x);
        S.bonds.forEach((b) => { b.a = re(b.a); b.b = re(b.b); });
        S.hs.forEach((h) => { h.at = re(h.at); });
        const nbPos = nbs.map(re).map((j) => S.atoms[j].p);
        keepLargest();
        // neighbours get a hydrogen where the atom was
        const pref = {};
        nbPos.forEach((q) => { const j = S.atoms.findIndex((a) => a.p === q); if (j >= 0) pref[j] = gone; });
        syncHAdd(pref);
        return true;
      }
      function syncHAdd(pref) {
        // like syncH, but new hydrogens go toward the preferred spot first
        const m = mol(), adj = adjacency(m);
        S.atoms.forEach((a, i) => {
          const need = hOf(m, adj, i);
          if (pref[i] && hsOf(i).length < need) {
            const d = unit(sub(pref[i], a.p));
            S.hs.push({ at: i, p: add(a.p, mul(d, bondLen(a.el, "H", 1))) });
          }
        });
        syncH();
      }
      function keepLargest() {
        const n = S.atoms.length, adj = adjacency(mol()), comp = new Array(n).fill(-1), size = [];
        for (let s = 0; s < n; s++) {
          if (comp[s] >= 0) continue;
          let c = 0; const st = [s]; comp[s] = size.length;
          while (st.length) { const u = st.pop(); c++; adj[u].forEach((e) => { if (comp[e.j] < 0) { comp[e.j] = comp[s]; st.push(e.j); } }); }
          size.push(c);
        }
        if (size.length < 2) return;
        const big = size.indexOf(Math.max(...size));
        const keep = [];
        for (let i = 0; i < n; i++) if (comp[i] === big) keep.push(i);
        const map = new Map(keep.map((x, k) => [x, k]));
        S.atoms = keep.map((i) => S.atoms[i]);
        S.bonds = S.bonds.filter((b) => map.has(b.a) && map.has(b.b)).map((b) => ({ a: map.get(b.a), b: map.get(b.b), o: b.o }));
        S.hs = S.hs.filter((h) => map.has(h.at)).map((h) => ({ at: map.get(h.at), p: h.p }));
      }
      function ringBond(i, j, o) {
        if (i === j || S.bonds.some((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i))) return false;
        const m = mol(), adj = adjacency(m);
        if (hOf(m, adj, i) < o || hOf(m, adj, j) < o) return false;
        S.bonds.push({ a: i, b: j, o });
        const pref = {}; pref[i] = S.atoms[j].p; pref[j] = S.atoms[i].p;
        syncH(pref);
        return true;
      }
      // nodes of the branch that starts at `start` and does not pass `from` (heavy atoms and their hydrogens)
      function branch(from, start) {
        const adj = adjacency(mol()), seen = new Set([from, start]), st = [start];
        while (st.length) { const u = st.pop(); adj[u].forEach((e) => { if (!seen.has(e.j)) { seen.add(e.j); st.push(e.j); } }); }
        if ([...seen].some((x) => x !== from && adj[x].some((e) => e.j === from) && x !== start)) return null; // ring
        seen.delete(from);
        return seen;
      }
      function rotateNodes(set, hsSet, center, axis, angle) {
        const k = unit(axis), c = Math.cos(angle), s = Math.sin(angle);
        const rot = (q) => {
          const v = sub(q, center);
          const r = add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
          const w = add(center, r);
          q[0] = w[0]; q[1] = w[1]; q[2] = w[2];
        };
        set.forEach((i) => rot(S.atoms[i].p));
        hsSet.forEach((h) => rot(h.p));
      }
      function invertCentre(i) {
        // swap two substituents that are not part of a ring: rotate both by 180° about their bisector
        const adj = adjacency(mol());
        const opts = [];
        hsOf(i).forEach((h) => opts.push({ h }));
        adj[i].forEach((e) => { const br = branch(i, e.j); if (br) opts.push({ j: e.j, br }); });
        if (opts.length < 2) return false;
        opts.sort((p, q) => (p.h ? 0 : p.br.size) - (q.h ? 0 : q.br.size));
        const [s1, s2] = opts;
        const c = S.atoms[i].p;
        const pos = (o) => (o.h ? o.h.p : S.atoms[o.j].p);
        const axis = add(unit(sub(pos(s1), c)), unit(sub(pos(s2), c)));
        [s1, s2].forEach((o) => {
          if (o.h) rotateNodes([], [o.h], c, axis, Math.PI);
          else rotateNodes([...o.br], S.hs.filter((h) => o.br.has(h.at)), c, axis, Math.PI);
        });
        return true;
      }
      function flipDouble(k) {
        const b = S.bonds[k];
        if (b.o !== 2) return false;
        const br = branch(b.a, b.b);
        if (!br) return false;
        rotateNodes([...br], S.hs.filter((h) => br.has(h.at)), S.atoms[b.a].p, sub(S.atoms[b.b].p, S.atoms[b.a].p), Math.PI);
        return true;
      }
      /** Builds a molecule from SMILES atom by atom, as a learner would. */
      function build(smiles) {
        const m = parseSmiles(smiles);
        S = { atoms: [{ el: m.atoms[0].el, p: [0, 0, 0] }], bonds: [], hs: [] };
        syncH();
        graft(0, m, 0);
        relax(500);
      }
      function graft(at, m, first) {
        // m's atom `first` is already S's atom `at`; add the rest breadth first
        const map = new Map([[first, at]]), adjm = adjacency(m), q = [first];
        const later = [];
        while (q.length) {
          const u = q.shift();
          adjm[u].forEach((e) => {
            if (map.has(e.j)) { if (e.j !== u) later.push(e); return; }
            if (!attach(map.get(u), m.atoms[e.j].el, e.o)) return;
            map.set(e.j, S.atoms.length - 1);
            relax(30);
            q.push(e.j);
          });
        }
        m.bonds.forEach((b) => {
          if (!map.has(b.a) || !map.has(b.b)) return;
          const x = map.get(b.a), y = map.get(b.b);
          if (!S.bonds.some((c) => (c.a === x && c.b === y) || (c.a === y && c.b === x))) ringBond(x, y, b.o);
        });
        void later;
        return map;
      }
      function attachResidue(code) {
        const aa = BLOCKS.get(code);
        if (!aa) return false;
        // the free carboxy group at the C-terminus: the acid whose carbon sits next to a carbon carrying N
        const m = mol(), A = analyze(m);
        const acids = A.groups.filter((g) => g.type === "carbonsaeure" && A.adj[g.c].some((e) => A.el(e.j) === "C" && A.adj[e.j].some((f) => A.el(f.j) === "N")));
        if (!acids.length) return false;
        // the one farthest from a free amino group: the last residue added
        const g = acids[acids.length - 1];
        const ohO = g.part[1];
        const cPos = S.atoms[g.c].p, oPos = S.atoms[ohO].p.slice();
        removeAtom(ohO);
        // indices may have shifted: find the carbonyl carbon again by position
        const ci = S.atoms.findIndex((a) => len(sub(a.p, cPos)) < 1e-6);
        const res = aa.mol;
        // the residue's nitrogen first, in the place of the removed OH
        const hNear = hsOf(ci).sort((p, q) => len(sub(p.p, oPos)) - len(sub(q.p, oPos)))[0];
        if (!attach(ci, "N", 1, hNear)) return false;
        graft(S.atoms.length - 1, res, aa.smi[0] === "N" ? 0 : res.atoms.findIndex((a) => a.el === "N"));
        relax(400);
        return true;
      }

      // ------------------------------------------------ analysis of the current molecule
      let info = null;
      function stereo(m, A) {
        const adj = A.adj, centres = [], dbs = [];
        const posOf = (i, j) => (j >= 0 ? S.atoms[j].p : null);
        for (let i = 0; i < m.atoms.length; i++) {
          if (m.atoms[i].el !== "C" || adj[i].some((e) => e.o !== 1)) continue;
          const h = hOf(m, adj, i);
          if (adj[i].length + h !== 4 || h > 1) continue;
          const br = adj[i].map((e) => e.j).concat(h ? [-1] : []);
          const ranked = rankBranches(m, adj, i, br);
          if (!ranked) continue;
          const P = ranked.map((j) => (j >= 0 ? posOf(i, j) : hsOf(i)[0].p));
          const [a, b, c, d] = P;
          const v = dot(sub(a, d), cross(sub(b, d), sub(c, d)));
          centres.push({ i, rs: v < 0 ? "R" : "S" });
        }
        m.bonds.forEach((b, k) => {
          if (b.o !== 2 || m.atoms[b.a].el !== "C" || m.atoms[b.b].el !== "C" || A.ring.aromatic.has(b.a)) return;
          if (A.ring.ringBond[k]) return;
          const side = (x, y) => {
            const br = adj[x].filter((e) => e.j !== y).map((e) => e.j).concat(new Array(hOf(m, adj, x)).fill(-1));
            if (br.length !== 2) return null;
            const r = rankBranches(m, adj, x, br);
            return r ? r[0] : null;
          };
          const ha = side(b.a, b.b), hb = side(b.b, b.a);
          if (ha == null || hb == null) return;
          const pa = ha >= 0 ? S.atoms[ha].p : hsOf(b.a)[0].p, pb = hb >= 0 ? S.atoms[hb].p : hsOf(b.b)[0].p;
          const ax = unit(sub(S.atoms[b.b].p, S.atoms[b.a].p));
          const va = sub(pa, S.atoms[b.a].p), vb = sub(pb, S.atoms[b.b].p);
          const sa = sub(va, mul(ax, dot(va, ax))), sb = sub(vb, mul(ax, dot(vb, ax)));
          dbs.push({ k, a: b.a, b: b.b, ez: dot(sa, sb) > 0 ? "Z" : "E" });
        });
        return { centres, dbs };
      }
      function analyse() {
        const m = mol(), A = analyze(m);
        const nm = namer(m);
        const st = stereo(m, A);
        let name = nm && nm.name;
        if (name && (st.centres.length || st.dbs.length)) {
          const tags = [];
          st.centres.forEach((c) => tags.push({ loc: nm.loc && nm.loc.get(c.i), d: c.rs }));
          st.dbs.forEach((d) => { const l1 = nm.loc && nm.loc.get(d.a), l2 = nm.loc && nm.loc.get(d.b); tags.push({ loc: l1 && l2 ? Math.min(l1, l2) : null, d: d.ez }); });
          tags.sort((p, q) => (p.loc || 0) - (q.loc || 0));
          const one = tags.length === 1;
          name = "(" + tags.map((t) => (one || t.loc == null ? "" : t.loc) + t.d).join(",") + ")-" + name;
        }
        info = {
          m, A, st, name, alt: nm && nm.alt, trivial: trivialName(m), pep: peptide(m), formula: formula(m), mass: molarMass(m),
          chain: longestChain(m, A),
        };
        return info;
      }
      function longestChain(m, A) {
        let best = 0;
        const cs = m.atoms.map((a, i) => i).filter((i) => m.atoms[i].el === "C");
        const dfs = (u, seen) => { let b = 1; A.adj[u].forEach((e) => { if (m.atoms[e.j].el === "C" && !seen.has(e.j)) { seen.add(e.j); b = Math.max(b, 1 + dfs(e.j, seen)); seen.delete(e.j); } }); return b; };
        cs.forEach((s) => { best = Math.max(best, dfs(s, new Set([s]))); });
        return best;
      }

      // ------------------------------------------------ conditions of a task
      function holds(c) {
        const I = info || analyse();
        const s = String(c).trim();
        let mm;
        if ((mm = /^ziel\s+(\S+)$/.exec(s))) return !!isomorphic(parseSmiles(mm[1]), I.m);
        if ((mm = /^nicht\s+(\S+)$/.exec(s))) return !isomorphic(parseSmiles(mm[1]), I.m);
        if ((mm = /^formel\s+(\S+)$/.exec(s))) return I.formula === mm[1];
        if ((mm = /^(ohne\s+)?gruppe\s+([a-zäöü]+)(?:\s+(\d))?$/.exec(s))) {
          const has = I.A.groups.some((g) => g.type === mm[2] && (!mm[3] || Math.min(3, g.grade) === +mm[3]));
          return mm[1] ? !has : has;
        }
        if ((mm = /^kette\s+(\d+)$/.exec(s))) return I.chain === +mm[1];
        if ((mm = /^stereo\s+([RS])$/.exec(s))) return I.st.centres.length >= 1 && I.st.centres.every((x) => x.rs === mm[1]);
        if ((mm = /^ez\s+([EZ])$/.exec(s))) return I.st.dbs.length >= 1 && I.st.dbs.every((x) => x.ez === mm[1]);
        if (s === "chiral") return I.st.centres.length >= 1;
        if ((mm = /^stereozentren\s+(\d+)$/.exec(s))) return I.st.centres.length === +mm[1];
        if (s === "achiral") return I.st.centres.length === 0;
        if ((mm = /^peptid\s+(\S+)$/.exec(s))) return I.pep === mm[1];
        if ((mm = /^reste\s+(\d+)$/.exec(s))) return !!I.pep && I.pep.split("-").length === +mm[1];
        if ((mm = /^nterm\s+(\S+)$/.exec(s))) return !!I.pep && I.pep.split("-")[0] === mm[1];
        if ((mm = /^cterm\s+(\S+)$/.exec(s))) return !!I.pep && I.pep.split("-").slice(-1)[0] === mm[1];
        if (s === "keine ez") return I.st.dbs.length === 0;
        if (s === "mit ez") return I.st.dbs.length >= 1;
        if (s === "aromat") return I.A.ring.benzene.length >= 1;
        if ((mm = /^ring\s+(\d+)$/.exec(s))) return I.A.ring.rings.some((r) => r.length === +mm[1]);
        return false;
      }

      // ------------------------------------------------ the controls
      let tool = "add", elSel = "C", order = 1, pick = null, model = "kugel", showH = true, msg = "";
      const bar = LW.el("div", { class: "lw-mol-bar" });
      host.append(bar);
      const elRow = LW.el("div", { class: "lw-mol-row", role: "toolbar", "aria-label": "Element" });
      ["C", "O", "N", "S", "F", "Cl", "Br", "I"].forEach((e) => {
        const b = LW.el("button", { class: "lw-mol-el" + (e === elSel ? " on" : ""), type: "button", text: e, "aria-label": EL[e].name });
        b.style.setProperty("--el", EL[e].col);
        b.addEventListener("click", () => { elSel = e; [...elRow.children].forEach((x) => x.classList.toggle("on", x === b)); if (tool !== "add" && tool !== "swap") setTool("add"); });
        elRow.append(b);
      });
      const bondRow = LW.el("div", { class: "lw-mol-row" });
      const bondBtns = [[1, "–", "Einfachbindung"], [2, "=", "Doppelbindung"], [3, "≡", "Dreifachbindung"]].map(([o, t, nm]) => {
        const b = LW.el("button", { class: "lw-mol-bond" + (o === order ? " on" : ""), type: "button", text: t, "aria-label": nm });
        b.addEventListener("click", () => { order = o; bondBtns.forEach((x, k) => x.classList.toggle("on", k + 1 === o)); });
        bondRow.append(b);
        return b;
      });
      const tools = [["add", "Anbauen"], ["swap", "Ersetzen"], ["ring", "Ring schließen"], ["del", "Löschen"], ["stereo", "Stereo umkehren"]];
      const toolRow = LW.el("div", { class: "lw-mol-row lw-mol-tools" });
      const toolBtns = tools.map(([id, t]) => {
        const b = LW.el("button", { class: "w-btn" + (id === tool ? " on" : ""), type: "button", text: t });
        b.addEventListener("click", () => setTool(id));
        toolRow.append(b);
        return b;
      });
      function setTool(id) { tool = id; pick = null; toolBtns.forEach((b, k) => b.classList.toggle("on", tools[k][0] === id)); hint(); paint(); }
      bar.append(elRow, bondRow, toolRow);
      if (p.blocks && p.blocks.length) {
        const blockRow = LW.el("div", { class: "lw-mol-row" }, [LW.el("span", { class: "lw-mol-cap", text: "Aminosäure anhängen:" })]);
        p.blocks.forEach((code) => {
          if (!BLOCKS.has(code)) return;
          const b = LW.el("button", { class: "w-btn", type: "button", text: "+ " + code, "aria-label": BLOCKS.get(code).name + " anhängen" });
          b.addEventListener("click", () => { pushUndo(); if (!attachResidue(code)) { undo.pop(); say("Hier gibt es keine freie Carboxygruppe für eine Peptidbindung."); } else { say(""); } changed(); });
          blockRow.append(b);
        });
        bar.append(blockRow);
      }

      const W = 360, H = 300;
      const svg = K.root(host, W, H, "Molekül im Raum");
      svg.classList.add("lw-mol-svg");
      svg.style.maxWidth = "560px";
      svg.style.margin = "0 auto";
      const defs = K.svg("defs", null, svg);
      const scene = K.svg("g", null, svg);
      const gradId = "lwmol" + Math.random().toString(36).slice(2, 8);
      Object.keys(EL).forEach((e) => {
        const g = K.svg("radialGradient", { id: gradId + e, cx: "35%", cy: "32%", r: "70%" }, defs);
        K.svg("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.85" }, g);
        K.svg("stop", { offset: "28%", "stop-color": EL[e].col }, g);
        K.svg("stop", { offset: "100%", "stop-color": shade(EL[e].col, 0.55) }, g);
      });
      const view = LW.lab.view3d(svg, { width: W, height: H, az: 25, el: 15, scale: 42, dist: 18, paint: () => paint(), onTap });
      const viewRow = LW.el("div", { class: "w-btns" });
      host.append(viewRow);
      K.segmented(viewRow, [{ id: "kugel", label: "Kugel-Stab" }, { id: "kalotte", label: "Kalotte" }], "kugel", (id) => { model = id; paint(); });
      const hBtn = K.button(viewRow, "H zeigen", () => { showH = !showH; hBtn.classList.toggle("on", showH); paint(); });
      hBtn.classList.add("on");
      K.button(viewRow, "−", () => view.zoom(1 / 1.25));
      K.button(viewRow, "+", () => view.zoom(1.25));
      const editRow = LW.el("div", { class: "w-btns" });
      host.append(editRow);
      K.button(editRow, "Rückgängig", () => { if (!undo.length) return; S = JSON.parse(undo.pop()); changed(); });
      K.button(editRow, "Neu", () => { pushUndo(); build(p.start || "C"); changed(); });
      const msgEl = LW.el("div", { class: "lw-lab-tex err", "aria-live": "polite" });
      host.append(msgEl);
      const out = LW.el("div", { class: "lw-mol-info" });
      host.append(out);
      const goals = task ? LW.lab.goals(host, task.conditions || [], (c) => [].concat(c).every(holds)) : null;

      function say(t) { msg = t; msgEl.textContent = t; }
      function hint() {
        const H2 = { add: "Tippe ein Atom an: Das gewählte Element wird mit der gewählten Bindung angebaut. Tippe eine Bindung an, um sie zu ändern.",
          swap: "Tippe ein Atom an, um es durch das gewählte Element zu ersetzen.", ring: "Tippe zwei Atome nacheinander an, um sie zu verbinden.",
          del: "Tippe ein Atom an, um es zu entfernen.", stereo: "Tippe ein Stereozentrum (R oder S) oder eine Doppelbindung (E oder Z) an, um die Konfiguration umzukehren." };
        say(""); msgEl.classList.remove("err"); msgEl.textContent = H2[tool]; msgEl.classList.add("lw-mol-hint");
      }
      function onTap(target) {
        const ai = target && target.dataset ? target.dataset.atom : null, hi = target && target.dataset ? target.dataset.h : null, bi = target && target.dataset ? target.dataset.bond : null;
        msgEl.classList.remove("lw-mol-hint"); msgEl.classList.add("err");
        let ok = null;
        pushUndo();
        if (tool === "add") {
          if (ai != null) ok = attach(+ai, elSel, order) || (say("Dieses Atom hat keine freie Bindung mehr für eine " + ["", "Einfach", "Doppel", "Dreifach"][order] + "bindung."), false);
          else if (hi != null) { const h = S.hs[+hi]; ok = attach(h.at, elSel, order, h) || (say("Hier ist keine " + ["", "Einfach", "Doppel", "Dreifach"][order] + "bindung möglich."), false); }
          else if (bi != null) {
            const b = S.bonds[+bi];
            ok = false;
            for (let t = 1; t <= 3 && !ok; t++) { const o = ((b.o + t - 1) % 3) + 1; if (o !== b.o && setOrder(+bi, o)) ok = true; }
            if (!ok) say("Die Bindung lässt sich hier nicht ändern: Es fehlen freie Bindungen.");
          }
        } else if (tool === "swap" && ai != null) ok = replace(+ai, elSel) || (say(EL[elSel].name + " hat dafür zu wenige Bindungen."), false);
        else if (tool === "del" && ai != null) ok = removeAtom(+ai) || (say("Das letzte Atom bleibt stehen."), false);
        else if (tool === "ring" && ai != null) {
          if (pick == null) { pick = +ai; undo.pop(); paint(); return; }
          ok = ringBond(pick, +ai, order) || (say("Diese beiden Atome lassen sich nicht verbinden."), false);
          pick = null;
        } else if (tool === "stereo") {
          if (ai != null) ok = (info && info.st.centres.some((c) => c.i === +ai) && invertCentre(+ai)) || (say("Das ist kein Stereozentrum, oder es liegt in einem Ring."), false);
          else if (bi != null) ok = (info && info.st.dbs.some((d) => d.k === +bi) && flipDouble(+bi)) || (say("Diese Doppelbindung hat keine E/Z-Isomerie."), false);
        }
        if (!ok) { undo.pop(); paint(); return; }
        say("");
        relax(160);
        changed();
      }

      // ------------------------------------------------ drawing
      function paint() {
        K.clear(scene);
        if (!S) return;
        const I = info || analyse();
        const items = [];
        const P = S.atoms.map((a) => view.project(a.p));
        const PH = S.hs.map((h) => view.project(h.p));
        const kal = model === "kalotte";
        if (!kal) {
          const stick = (i, j, pi, pj, o, data) => {
            const dx = pj.x - pi.x, dy = pj.y - pi.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
            const w = Math.max(2, 0.16 * (pi.k + pj.k) / 2);
            const offs = o === 1 ? [0] : o === 2 ? [-1, 1] : [-1.6, 0, 1.6];
            offs.forEach((f) => items.push({ d: (pi.d + pj.d) / 2 - 0.01, draw: () => {
              const ln = K.svg("line", { x1: pi.x + nx * f * w * 0.9, y1: pi.y + ny * f * w * 0.9, x2: pj.x + nx * f * w * 0.9, y2: pj.y + ny * f * w * 0.9, stroke: "var(--label-3)", "stroke-width": o === 1 ? w : w * 0.7, "stroke-linecap": "round" }, scene);
              if (data != null) ln.dataset.bond = data;
            } }));
            if (data != null) items.push({ d: (pi.d + pj.d) / 2 - 0.02, draw: () => { const hit = K.svg("line", { x1: pi.x, y1: pi.y, x2: pj.x, y2: pj.y, stroke: "transparent", "stroke-width": 18 }, scene); hit.dataset.bond = data; } });
          };
          S.bonds.forEach((b, k) => stick(b.a, b.b, P[b.a], P[b.b], b.o, k));
          if (showH) S.hs.forEach((h, k) => stick(h.at, -1, P[h.at], PH[k], 1, null));
        }
        S.atoms.forEach((a, i) => {
          const r = (kal ? EL[a.el].vdw * 0.82 : EL[a.el].ball) * P[i].k;
          items.push({ d: P[i].d, draw: () => {
            const c = K.svg("circle", { cx: P[i].x, cy: P[i].y, r: Math.max(3, r), fill: "url(#" + gradId + a.el + ")", stroke: pick === i ? "var(--accent)" : "rgba(0,0,0,0.35)", "stroke-width": pick === i ? 3 : 0.6 }, scene);
            c.dataset.atom = i;
            if (a.el !== "C" && r > 8) { const t = K.text(scene, P[i].x, P[i].y + 0.5, a.el, "lw-mol-label"); t.dataset.atom = i; }
            const sc = I.st.centres.find((x) => x.i === i);
            if (sc && (tool === "stereo" || model !== "kalotte")) { const t = K.text(scene, P[i].x + r + 6, P[i].y - r - 2, sc.rs, "lw-mol-stereo"); t.dataset.atom = i; }
          } });
        });
        if (showH) S.hs.forEach((h, k) => {
          const r = (kal ? EL.H.vdw * 0.82 : EL.H.ball) * PH[k].k;
          items.push({ d: PH[k].d, draw: () => { const c = K.svg("circle", { cx: PH[k].x, cy: PH[k].y, r: Math.max(2, r), fill: "url(#" + gradId + "H)", stroke: "rgba(0,0,0,0.3)", "stroke-width": 0.5 }, scene); c.dataset.h = k; } });
        });
        I.st.dbs.forEach((d) => {
          const pa = P[d.a], pb = P[d.b];
          items.push({ d: Math.max(pa.d, pb.d) + 0.5, draw: () => { const t = K.text(scene, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 12, d.ez, "lw-mol-stereo"); t.dataset.bond = d.k; } });
        });
        items.sort((p, q) => p.d - q.d).forEach((it) => it.draw());
      }
      function describe() {
        const I = info;
        const rows = [];
        const nres = I.pep && I.pep.includes("-") ? I.pep.split("-").length : 0;
        const nm = I.name ? I.name : nres ? (["", "", "Dipeptid", "Tripeptid", "Tetrapeptid", "Pentapeptid"][nres] || "Peptid") + " " + I.pep : "Name: für diese Struktur nicht automatisch bestimmbar";
        rows.push("<b>" + LW.esc(nm) + "</b>" + (I.alt ? " · " + LW.esc(I.alt) : "") + (I.trivial && I.trivial !== I.name ? " · " + LW.esc(I.trivial) : ""));
        rows.push(LW.math(formulaTex(I.formula)) + " · " + LW.esc("M = " + K.fmt(I.mass, 2) + " g/mol"));
        const gs = I.A.groups.filter((g, k, arr) => g.type !== "alken" || arr.findIndex((x) => x.type === "alken") === k);
        if (gs.length) rows.push(gs.map((g) => '<span class="lw-mol-chip">' + LW.esc(groupText(g)) + "</span>").join(" "));
        const st = I.st.centres.length + I.st.dbs.length;
        if (st) rows.push(LW.esc((I.st.centres.length ? I.st.centres.length + (I.st.centres.length === 1 ? " Stereozentrum" : " Stereozentren") : "") + (I.st.centres.length && I.st.dbs.length ? ", " : "") + (I.st.dbs.length ? I.st.dbs.length + " Doppelbindung" + (I.st.dbs.length > 1 ? "en" : "") + " mit E/Z" : "")));
        out.innerHTML = rows.join("<br>");
      }
      function changed(silent) {
        info = null;
        analyse();
        view.fit(Math.max(1.6, ...S.atoms.map((a) => len(a.p)), ...S.hs.map((h) => len(h.p))) + 0.6);
        describe();
        paint();
        if (goals) goals.paint();
        if (!silent) ctx.changed();
      }

      function applyStereo(want) {
        info = null; analyse();
        if (want === "R" || want === "S") info.st.centres.forEach((c) => { if (c.rs !== want) invertCentre(c.i); });
        if (want === "E" || want === "Z") info.st.dbs.forEach((d) => { if (d.ez !== want) flipDouble(d.k); });
        relax(200);
      }
      build(p.start || "C");
      if (p.startStereo) applyStereo(p.startStereo);
      hint();
      changed(true);

      return {
        check() { return goals ? goals.result() : { correct: true }; },
        solve() {
          if (!task || !task.sample) return;
          const smp = typeof task.sample === "string" ? { smiles: task.sample } : task.sample;
          build(smp.smiles);
          // stereo: invert centres or double bonds until the descriptor fits
          if (smp.stereo) applyStereo(smp.stereo);
          changed(true);
        },
        getVar(name) { return name === "ok" ? (goals && goals.all() ? 1 : 0) : undefined; },
      };
    },
  });

  LW.labChem = { parseSmiles, formula, formulaTex, molarMass, analyze, isomorphic, namer, trivialName, peptide, AMINO, EL, rankBranches, adjacency, hOf };
})();
