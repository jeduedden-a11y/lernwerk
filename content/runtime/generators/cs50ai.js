/* Task generators for CS50 AI, one per topic of the seven lectures; level 1 (Leicht) to 4 (Experte). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const num = (md, answer, o) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl" }, o || {});
  const tf = (md, answer, explain, whyNot) => ({ type: "truefalse", md, answer, explain, whyNot: answer ? null : whyNot || null });
  const blank = (v, tol) => ({ accept: [v], numeric: true, tolerance: tol == null ? 1e-6 : tol, placeholder: "Zahl" });
  const dec = (G, v, d) => ({ tolerance: Math.pow(10, -d) * 0.6, answerText: G.fmt(v, d) });
  const LET = "ABCDEFGHIJ";

  // ---------------------------------------------------------------- Lecture 0: search

  function randomGraph(G, n, extra) {
    const adj = {};
    for (let i = 0; i < n; i++) adj[LET[i]] = new Set();
    for (let i = 1; i < n; i++) { const j = G.int(Math.max(0, i - 3), i - 1); adj[LET[i]].add(LET[j]); adj[LET[j]].add(LET[i]); }
    for (let e = 0; e < extra; e++) { const a = G.int(0, n - 1), b = G.int(0, n - 1); if (a !== b) { adj[LET[a]].add(LET[b]); adj[LET[b]].add(LET[a]); } }
    const out = {};
    Object.keys(adj).forEach((k) => (out[k] = [...adj[k]].sort()));
    return out;
  }
  /** The search loop of the lecture: a state enters the frontier only if it is neither in the frontier nor explored. */
  function search(adj, start, goal, kind) {
    const frontier = [{ s: start, parent: null }], inF = new Set([start]), explored = new Set(), order = [];
    while (frontier.length) {
      const node = kind === "dfs" ? frontier.pop() : frontier.shift();
      inF.delete(node.s);
      order.push(node.s);
      if (node.s === goal) { const path = []; for (let n = node; n; n = n.parent) path.push(n.s); return { order, path: path.reverse() }; }
      explored.add(node.s);
      for (const nb of adj[node.s]) if (!inF.has(nb) && !explored.has(nb)) { frontier.push({ s: nb, parent: node }); inF.add(nb); }
    }
    return { order, path: null };
  }
  const adjText = (adj) => Object.keys(adj).map((k) => "$" + k + "$: " + adj[k].join(", ")).join(" · ");

  gen("cs-suche", {
    title: "Tiefen- und Breitensuche",
    make(level, G) {
      const n = level <= 2 ? G.int(5, 6) : G.int(6, 8);
      const adj = randomGraph(G, n, level <= 2 ? 1 : 2);
      const goal = LET[n - 1];
      const intro = "Ein Graph, die Nachbarn stehen in der Reihenfolge, in der sie zur Frontier hinzugefügt werden: " + adjText(adj) + ".";
      if (level <= 2) {
        const kind = level === 1 ? "bfs" : "dfs";
        const r = search(adj, "A", null, kind);
        return {
          type: "order", md: intro + "\n\nStart ist $A$, es gibt kein Ziel. In welcher Reihenfolge entfernt die **" + (kind === "bfs" ? "Breitensuche" : "Tiefensuche") + "** die Knoten aus der Frontier?",
          items: r.order.map((s) => "$" + s + "$"),
          explain: (kind === "bfs" ? "Die Frontier ist eine **Schlange** (first in, first out): Wer zuerst hineinkommt, wird zuerst untersucht. So arbeitet die Suche Schicht für Schicht nach außen." : "Die Frontier ist ein **Stapel** (last in, first out): Der zuletzt hinzugefügte Nachbar wird als Nächstes untersucht. So geht die Suche erst so tief wie möglich.") + " Reihenfolge: " + r.order.join(", ") + ".",
        };
      }
      if (level === 3) {
        const r = search(adj, "A", goal, "bfs");
        return num(intro + "\n\nDie **Breitensuche** startet bei $A$ und sucht $" + goal + "$. Wie viele Knoten hat sie aus der Frontier entfernt, wenn sie $" + goal + "$ entfernt? ($" + goal + "$ mitgezählt)", r.order.length, { hint: "Führe Frontier und explored auf einem Zettel mit.", explain: "Entfernt werden " + r.order.join(", ") + ", also $" + r.order.length + "$ Knoten. Der gefundene Weg ist " + r.path.join(" → ") + "." });
      }
      const d = search(adj, "A", goal, "dfs"), b = search(adj, "A", goal, "bfs");
      return num(intro + "\n\nDie **Tiefensuche** startet bei $A$ und sucht $" + goal + "$. Wie viele Kanten hat der Weg, den sie findet?", d.path.length - 1, { explain: "Die Tiefensuche findet " + d.path.join(" → ") + " mit $" + (d.path.length - 1) + "$ Kanten. Die Breitensuche findet " + b.path.join(" → ") + " mit $" + (b.path.length - 1) + "$ Kanten, und das ist immer ein kürzester Weg. Die Tiefensuche garantiert das nicht." });
    },
  });

  gen("cs-astar", {
    title: "Greedy-Suche und A*",
    make(level, G) {
      if (level === 1) {
        const r1 = G.int(0, 9), c1 = G.int(0, 9), r2 = G.int(0, 9), c2 = G.int(0, 9);
        return num("Wie groß ist die Manhattan-Distanz zwischen den Feldern $(" + r1 + ", " + c1 + ")$ und $(" + r2 + ", " + c2 + ")$ eines Gitters?", Math.abs(r1 - r2) + Math.abs(c1 - c2), { explain: "$|" + r1 + " - " + r2 + "| + |" + c1 + " - " + c2 + "| = " + (Math.abs(r1 - r2) + Math.abs(c1 - c2)) + "$: die Zahl der Schritte, wenn es keine Wände gäbe. Deshalb unterschätzt sie den wahren Weg nie." });
      }
      if (level === 2 || level === 3) {
        let nodes;
        do {
          nodes = G.pickN(["C", "D", "E", "F", "H"], 4).map((s) => ({ s, g: G.int(1, 9), h: G.int(0, 8) }));
        } while (new Set(nodes.map((o) => o.g + o.h)).size < 4 || new Set(nodes.map((o) => o.h)).size < 4 || nodes.reduce((a, o) => (o.g + o.h < a.g + a.h ? o : a)).s === nodes.reduce((a, o) => (o.h < a.h ? o : a)).s);
        const table = nodes.map((o) => "$" + o.s + "$: $g = " + o.g + "$, $h = " + o.h + "$").join(" · ");
        const astar = nodes.reduce((a, o) => (o.g + o.h < a.g + a.h ? o : a)), greedy = nodes.reduce((a, o) => (o.h < a.h ? o : a));
        const who = level === 2 ? "A*" : "die Greedy-Suche";
        const right = level === 2 ? astar : greedy;
        return {
          type: "choice", md: "In der Frontier liegen vier Knoten mit bisherigen Kosten $g$ und Heuristik $h$: " + table + ". Welchen Knoten entfernt **" + who + "** als Nächstes?",
          options: G.options({ md: "$" + right.s + "$" }, nodes.filter((o) => o !== right).map((o) => ({ md: "$" + o.s + "$", why: level === 2 ? "$f = g + h = " + (o.g + o.h) + "$ ist nicht minimal." : "$h = " + o.h + "$ ist nicht minimal." }))),
          explain: level === 2 ? "A* wählt den kleinsten Wert $f = g + h$: " + nodes.map((o) => o.s + ": " + (o.g + o.h)).join(", ") + ". Die Greedy-Suche hätte dagegen $" + greedy.s + "$ gewählt, weil sie nur auf $h$ schaut." : "Die Greedy-Suche schaut nur auf die Heuristik und nimmt das kleinste $h$, hier $" + greedy.s + "$. A* hätte $" + astar.s + "$ gewählt, weil es auch die schon zurückgelegten Kosten $g$ berücksichtigt.",
        };
      }
      const true_ = [G.int(3, 9), G.int(3, 9), G.int(3, 9), G.int(3, 9)];
      const bad = G.chance(0.5) ? G.int(0, 3) : -1;
      const h = true_.map((c, i) => (i === bad ? c + G.int(1, 3) : G.int(Math.max(0, c - 4), c)));
      const rows = ["P", "Q", "R", "S"].map((s, i) => "$" + s + "$: wahre Restkosten $" + true_[i] + "$, $h = " + h[i] + "$").join(" · ");
      return tf("Für vier Knoten sind die wahren Restkosten bis zum Ziel und die Werte einer Heuristik bekannt: " + rows + ". Ist die Heuristik auf diesen Knoten **zulässig**?", bad < 0,
        bad < 0 ? "Überall ist $h(n) \\le$ wahre Restkosten. Eine zulässige Heuristik überschätzt nie, und dann findet A* einen optimalen Weg." : "Bei $" + "PQRS"[bad] + "$ ist $h = " + h[bad] + "$ größer als die wahren Kosten $" + true_[bad] + "$. Die Heuristik überschätzt, A* kann dann einen optimalen Weg übersehen.",
        "Bei $" + (bad >= 0 ? "PQRS"[bad] : "") + "$ überschätzt die Heuristik die wahren Kosten.");
    },
  });

  gen("cs-minimax", {
    title: "Minimax und Alpha-Beta",
    make(level, G) {
      const leaf = () => G.int(-9, 15);
      if (level <= 2) {
        let tree, vals;
        do { tree = Array.from({ length: 3 }, () => Array.from({ length: G.int(2, 3) }, leaf)); vals = tree.map((c) => Math.min(...c)); } while (new Set(vals).size < 3);
        const show = "\\big[" + tree.map((c) => "[" + c.join(", ") + "]").join(",\\ ") + "\\big]";
        const best = vals.indexOf(Math.max(...vals));
        if (level === 1) return num("MAX ist am Zug und hat drei Züge. Nach jedem antwortet MIN, die Endwerte stehen in den Klammern: $" + show + "$. Welchen Wert hat die Wurzel?", Math.max(...vals), { explain: "MIN wählt in jeder Klammer das Minimum: " + vals.join(", ") + ". MAX nimmt davon das Maximum: $" + Math.max(...vals) + "$." });
        return { type: "choice", md: "MAX hat drei Züge, danach antwortet MIN: $" + show + "$. Welchen Zug sollte MAX wählen?", shuffle: false, options: [0, 1, 2].map((i) => (i === best ? { md: "Zug " + (i + 1), correct: true } : { md: "Zug " + (i + 1), why: "MIN antwortet darauf mit " + vals[i] + "." })), explain: "MAX denkt einen Zug voraus: Nach Zug $k$ wählt MIN das Minimum der Klammer. Die garantierten Werte sind " + vals.join(", ") + ", also ist Zug " + (best + 1) + " am besten. Den größten Einzelwert anzusteuern wäre naiv, weil MIN ihn nicht zulässt." };
      }
      if (level === 3) {
        const tree = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => [leaf(), leaf()]));
        const v = LW.cs50 ? LW.cs50.minimaxValue(tree, 0) : Math.max(...tree.map((m) => Math.min(...m.map((x) => Math.max(...x)))));
        const show = "\\big[" + tree.map((m) => "[" + m.map((x) => "[" + x.join(", ") + "]").join(", ") + "]").join(",\\ ") + "\\big]";
        return num("Ein Spielbaum mit drei Ebenen: MAX, dann MIN, dann wieder MAX, unten die Endwerte: $" + show + "$. Welchen Wert hat die Wurzel?", v, { hint: "Von unten nach oben: erst die Maxima der innersten Paare, dann Minima, dann das Maximum.", explain: "Innerste Ebene (MAX): " + tree.map((m) => m.map((x) => Math.max(...x)).join(", ")).join(" | ") + ". Darüber MIN: " + tree.map((m) => Math.min(...m.map((x) => Math.max(...x)))).join(", ") + ". Wurzel (MAX): $" + v + "$." });
      }
      const tree = Array.from({ length: 3 }, () => Array.from({ length: 3 }, leaf));
      const read = LW.cs50 ? LW.cs50.minimaxEvents(tree, true).filter((e) => e.kind === "leaf").length : 9;
      const show = "\\big[" + tree.map((c) => "[" + c.join(", ") + "]").join(",\\ ") + "\\big]";
      return num("Alpha-Beta-Suche auf $" + show + "$ (MAX an der Wurzel, MIN darunter, Blätter von links nach rechts). Wie viele der $9$ Blätter werden gelesen?", read, { hint: "Sobald ein MIN-Knoten einen Wert kleiner oder gleich dem bisher besten Wert von MAX gefunden hat, kann man den Rest dieses MIN-Knotens auslassen.", explain: "Es werden $" + read + "$ Blätter gelesen. Der erste MIN-Knoten muss vollständig ausgewertet werden und liefert $\\alpha = " + Math.min(...tree[0]) + "$. In den anderen MIN-Knoten bricht die Suche ab, sobald ein Blatt $\\le \\alpha$ auftaucht, denn dann kann dieser Zug für MAX nicht besser werden." });
    },
  });

  // ---------------------------------------------------------------- Lecture 1: knowledge

  const SENT = [
    { tex: "P \\to Q", ex: "P => Q" }, { tex: "P \\leftrightarrow \\neg R", ex: "P <=> !R" }, { tex: "(P \\wedge Q) \\to R", ex: "(P & Q) => R" },
    { tex: "\\neg P \\vee R", ex: "!P | R" }, { tex: "Q \\leftrightarrow (P \\vee R)", ex: "Q <=> (P | R)" }, { tex: "\\neg(Q \\wedge R)", ex: "!(Q & R)" },
    { tex: "P \\vee Q \\vee R", ex: "P | Q | R" }, { tex: "R \\to \\neg P", ex: "R => !P" }, { tex: "Q \\to R", ex: "Q => R" }, { tex: "\\neg Q \\to P", ex: "!Q => P" },
  ];
  const QUER = [{ tex: "P", ex: "P" }, { tex: "Q", ex: "Q" }, { tex: "R", ex: "R" }, { tex: "\\neg P", ex: "!P" }, { tex: "\\neg Q", ex: "!Q" }, { tex: "\\neg R", ex: "!R" }, { tex: "P \\vee R", ex: "P | R" }, { tex: "Q \\wedge R", ex: "Q & R" }];
  function models(fns) {
    const out = [];
    for (let m = 0; m < 8; m++) { const v = { P: !(m & 4), Q: !(m & 2), R: !(m & 1) }; if (fns.every((f) => f(v))) out.push(v); }
    return out;
  }
  const wf = (b) => (b ? "w" : "f");
  const mtxt = (v) => "$P = " + wf(v.P) + ", Q = " + wf(v.Q) + ", R = " + wf(v.R) + "$";

  gen("cs-logik", {
    title: "Aussagenlogik und Model Checking",
    make(level, G) {
      const be = LW.analysis.boolExpr;
      if (level === 1) {
        const S = G.pick(SENT), v = { P: G.chance(0.5), Q: G.chance(0.5), R: G.chance(0.5) };
        const val = !!be(S.ex)(v);
        return tf("Im Modell " + mtxt(v) + ": Ist $" + S.tex + "$ wahr?", val, "Einsetzen ergibt " + (val ? "wahr" : "falsch") + ". Denk daran: $A \\to B$ ist nur falsch, wenn $A$ wahr und $B$ falsch ist; $A \\leftrightarrow B$ ist wahr, wenn beide denselben Wert haben.", "Setze die Werte ein und werte von innen nach außen aus.");
      }
      let kb, ms;
      do { kb = G.pickN(SENT, level === 2 ? 2 : 3); ms = models(kb.map((s) => be(s.ex))); } while (!ms.length);
      const kbTex = kb.map((s) => "$" + s.tex + "$").join(", ");
      if (level === 2) return num("Die Wissensbasis besteht aus " + kbTex + ". In wie vielen der $8$ Modelle über $P, Q, R$ ist sie wahr?", ms.length, { explain: "Wahr ist sie genau in " + ms.map(mtxt).join("; ") + ". Model Checking heißt: alle Modelle durchgehen und die zählen, in denen jeder Satz der KB gilt." });
      const Qy = G.pick(QUER), qf = be(Qy.ex);
      const ent = ms.every((v) => qf(v));
      if (level === 3) return tf("Wissensbasis: " + kbTex + ". Gilt $\\text{KB} \\models " + Qy.tex + "$?", ent, ent ? "In allen " + ms.length + " Modellen der KB ist $" + Qy.tex + "$ wahr: " + ms.map(mtxt).join("; ") + "." : "Im Modell " + mtxt(ms.find((v) => !qf(v))) + " ist die KB wahr, aber $" + Qy.tex + "$ falsch. Ein einziges solches Modell widerlegt die Folgerung.", "Suche ein Modell, in dem die KB wahr und die Anfrage falsch ist.");
      // level 4: what does the KB decide?
      const decided = ["P", "Q", "R"].filter((s) => ms.every((v) => v[s]) || ms.every((v) => !v[s]));
      return num("Wissensbasis: " + kbTex + ". Für wie viele der drei Symbole $P, Q, R$ legt die KB den Wahrheitswert fest, sodass also $\\text{KB} \\models X$ oder $\\text{KB} \\models \\neg X$ gilt?", decided.length, { explain: "Die KB hat " + ms.length + (ms.length === 1 ? " Modell" : " Modelle") + ": " + ms.map(mtxt).join("; ") + ". Festgelegt " + (decided.length === 1 ? "ist" : "sind") + " " + (decided.length ? decided.map((s) => "$" + s + "$").join(", ") : "keines") + ". Ein Symbol ist festgelegt, wenn es in allen Modellen denselben Wert hat." });
    },
  });

  const RULES = [
    { name: "Modus Ponens", make: (a, b) => [[a + " \\to " + b, a], b] },
    { name: "Und-Elimination", make: (a, b) => [[a + " \\wedge " + b], a] },
    { name: "Doppelte Negation", make: (a) => [["\\neg(\\neg " + a + ")"], a] },
    { name: "Implikationselimination", make: (a, b) => [[a + " \\to " + b], "\\neg " + a + " \\vee " + b] },
    { name: "Bikonditionalelimination", make: (a, b) => [[a + " \\leftrightarrow " + b], "(" + a + " \\to " + b + ") \\wedge (" + b + " \\to " + a + ")"] },
    { name: "De Morgan", make: (a, b) => [["\\neg(" + a + " \\wedge " + b + ")"], "\\neg " + a + " \\vee \\neg " + b] },
    { name: "Distributivgesetz", make: (a, b, c) => [[a + " \\wedge (" + b + " \\vee " + c + ")"], "(" + a + " \\wedge " + b + ") \\vee (" + a + " \\wedge " + c + ")"] },
  ];
  const CNF = [
    ["(P \\vee Q) \\to R", "(\\neg P \\vee R) \\wedge (\\neg Q \\vee R)", ["\\neg P \\vee \\neg Q \\vee R", "(P \\vee R) \\wedge (Q \\vee R)"]],
    ["P \\to (Q \\wedge R)", "(\\neg P \\vee Q) \\wedge (\\neg P \\vee R)", ["\\neg P \\vee (Q \\wedge R)", "(P \\vee Q) \\wedge (P \\vee R)"]],
    ["\\neg(P \\vee Q)", "\\neg P \\wedge \\neg Q", ["\\neg P \\vee \\neg Q", "P \\wedge Q"]],
    ["P \\leftrightarrow Q", "(\\neg P \\vee Q) \\wedge (P \\vee \\neg Q)", ["(P \\vee Q) \\wedge (\\neg P \\vee \\neg Q)", "\\neg P \\vee Q"]],
    ["(P \\wedge Q) \\to R", "\\neg P \\vee \\neg Q \\vee R", ["(\\neg P \\vee R) \\wedge (\\neg Q \\vee R)", "\\neg P \\wedge \\neg Q \\wedge R"]],
    ["\\neg(P \\to Q)", "P \\wedge \\neg Q", ["\\neg P \\vee Q", "\\neg P \\wedge Q"]],
  ];
  const lit = (l) => (l.neg ? "\\neg " : "") + l.s;
  const clause = (ls) => (ls.length ? "(" + ls.map(lit).join(" \\vee ") + ")" : "()");

  gen("cs-inferenz", {
    title: "Inferenzregeln und Resolution",
    make(level, G) {
      if (level === 1) {
        const R = G.pick(RULES), [a, b, c] = G.pickN(["P", "Q", "R", "S"], 3);
        const [prem, concl] = R.make(a, b, c);
        return { type: "choice", md: "Aus " + prem.map((x) => "$" + x + "$").join(" und ") + " folgt $" + concl + "$. Welche Schlussregel ist das?", options: G.options({ md: R.name }, G.shuffle(RULES.filter((x) => x !== R)).slice(0, 3).map((x) => ({ md: x.name }))), explain: R.name + ". Jede dieser Regeln ist eine Tautologie: Wo die Prämissen wahr sind, ist auch die Folgerung wahr." };
      }
      if (level === 2) {
        const [s0, s1, s2] = G.pickN(["P", "Q", "R", "S"], 3);
        const L = { s: s0, neg: false }, X = { s: s1, neg: G.chance(0.5) }, Y = G.chance(0.3) ? Object.assign({}, X) : { s: s2, neg: G.chance(0.5) };
        const c1 = G.shuffle([L, X]), c2 = G.shuffle([{ s: s0, neg: true }, Y]);
        const res = X.s === Y.s && X.neg === Y.neg ? [X] : [X, Y];
        return {
          type: "choice", md: "Wende die **Resolution** auf die Klauseln $" + clause(c1) + "$ und $" + clause(c2) + "$ an. Was ist die Resolvente?",
          options: G.options({ md: "$" + clause(res) + "$" }, [
            { md: "$" + clause([L, X, { s: s0, neg: true }, Y]) + "$", why: "Das komplementäre Paar $" + s0 + "$, $\\neg " + s0 + "$ fällt weg." },
            { md: "$(" + lit(X) + " \\wedge " + lit(Y) + ")$", why: "Die Resolvente ist wieder eine Klausel, also eine Disjunktion." },
            { md: "$" + clause([{ s: X.s, neg: !X.neg }, { s: Y.s, neg: !Y.neg }]) + "$", why: "Die übrigen Literale bleiben unverändert, sie werden nicht verneint." },
          ]),
          explain: "Eine Klausel verlangt $" + s0 + "$ oder $" + lit(X) + "$, die andere $\\neg " + s0 + "$ oder $" + lit(Y) + "$. Da $" + s0 + "$ wahr oder falsch ist, muss eines der übrigen Literale gelten: $" + clause(res) + "$." + (res.length === 1 ? " Doppelte Literale werden zusammengefasst (Faktorisierung)." : ""),
        };
      }
      if (level === 3) {
        const [src, cnf, wrong] = G.pick(CNF);
        return { type: "choice", md: "Welche Formel ist die **konjunktive Normalform** (KNF) von $" + src + "$?", options: G.options({ md: "$" + cnf + "$" }, wrong.map((w) => ({ md: "$" + w + "$", why: "Prüfe mit einer Belegung, in der beide Formeln verschiedene Werte haben." }))), explain: "Vorgehen: Bikonditionale und Implikationen auflösen ($A \\to B$ wird $\\neg A \\vee B$), Negationen mit De Morgan nach innen ziehen, dann mit dem Distributivgesetz $\\vee$ über $\\wedge$ verteilen. Ergebnis: $" + cnf + "$." };
      }
      const be = LW.analysis.boolExpr;
      let kb, ms;
      do { kb = G.pickN(SENT, 3); ms = models(kb.map((s) => be(s.ex))); } while (!ms.length);
      const Qy = G.pick(QUER), qf = be(Qy.ex);
      const ent = ms.every((v) => qf(v));
      return tf("Um $\\text{KB} \\models " + Qy.tex + "$ per Resolution zu zeigen, fügt man $\\neg(" + Qy.tex + ")$ zur KB hinzu und sucht die leere Klausel. KB: " + kb.map((s) => "$" + s.tex + "$").join(", ") + ". Entsteht die leere Klausel?", ent,
        ent ? "Ja: KB zusammen mit $\\neg(" + Qy.tex + ")$ hat kein Modell, das ist ein Widerspruch. Resolution ist vollständig, also findet sie ihn als leere Klausel." : "Nein: Im Modell " + mtxt(ms.find((v) => !qf(v))) + " sind KB und $\\neg(" + Qy.tex + ")$ gleichzeitig wahr. Ohne Widerspruch gibt es keine leere Klausel.",
        "KB und die verneinte Anfrage sind gemeinsam erfüllbar.");
    },
  });

  // ---------------------------------------------------------------- Lecture 2: uncertainty

  gen("cs-wahrscheinlichkeit", {
    title: "Wahrscheinlichkeit und Bayes",
    make(level, G) {
      if (level <= 2 || level === 4) {
        let a, b, c, d;
        if (level === 4 && G.chance(0.5)) { const pc = G.pick([0.2, 0.3, 0.4, 0.5]), pr = G.pick([0.1, 0.2, 0.3, 0.6]); a = pc * pr; b = pc * (1 - pr); c = (1 - pc) * pr; d = (1 - pc) * (1 - pr); }
        else { do { a = G.int(1, 30) / 100; b = G.int(5, 40) / 100; c = G.int(1, 25) / 100; d = Math.round((1 - a - b - c) * 100) / 100; } while (d <= 0.04); }
        const r2 = (x) => Math.round(x * 10000) / 10000;
        [a, b, c, d] = [a, b, c, d].map(r2);
        const tab = "| | $R$ (Regen) | $\\neg R$ |\n|---|---|---|\n| $C$ (Wolken) | " + G.fmt(a, 4) + " | " + G.fmt(b, 4) + " |\n| $\\neg C$ | " + G.fmt(c, 4) + " | " + G.fmt(d, 4) + " |";
        if (level === 1) return num("Gemeinsame Verteilung:\n\n" + tab + "\n\nBerechne $P(R)$.", a + c, Object.assign({ explain: "Marginalisieren: $P(R) = P(R \\wedge C) + P(R \\wedge \\neg C) = " + G.tex(a, 4) + " + " + G.tex(c, 4) + " = " + G.tex(a + c, 4) + "$." }, dec(G, a + c, 4)));
        if (level === 2) return num("Gemeinsame Verteilung:\n\n" + tab + "\n\nBerechne $P(R \\mid C)$ (vier Nachkommastellen).", a / (a + b), Object.assign({ hint: "$P(R \\mid C) = \\dfrac{P(R \\wedge C)}{P(C)}$.", explain: "$P(C) = " + G.tex(a, 4) + " + " + G.tex(b, 4) + " = " + G.tex(a + b, 4) + "$, also $P(R \\mid C) = \\tfrac{" + G.tex(a, 4) + "}{" + G.tex(a + b, 4) + "} \\approx " + G.tex(a / (a + b), 4) + "$. Bedingen heißt: nur noch die Zeile $C$ betrachten und neu normieren." }, dec(G, a / (a + b), 4)));
        const indep = Math.abs(a - (a + b) * (a + c)) < 1e-9;
        return tf("Gemeinsame Verteilung:\n\n" + tab + "\n\nSind $C$ und $R$ **unabhängig**?", indep, "$P(C)P(R) = " + G.tex(a + b, 4) + " \\cdot " + G.tex(a + c, 4) + " = " + G.tex((a + b) * (a + c), 4) + "$" + (indep ? " ist gleich $P(C \\wedge R) = " + G.tex(a, 4) + "$: unabhängig." : ", aber $P(C \\wedge R) = " + G.tex(a, 4) + "$: abhängig. Wolken verändern die Regenwahrscheinlichkeit."), "Vergleiche $P(C \\wedge R)$ mit $P(C) \\cdot P(R)$.");
      }
      const pc = G.pick([0.3, 0.4, 0.5]), prc = G.pick([0.2, 0.3, 0.4]), prn = G.pick([0.02, 0.05, 0.1]);
      const pr = pc * prc + (1 - pc) * prn, post = (pc * prc) / pr;
      return num("Morgens ist es mit Wahrscheinlichkeit $" + G.tex(pc, 2) + "$ bewölkt. Bei Wolken regnet es nachmittags mit $" + G.tex(prc, 2) + "$, ohne Wolken mit $" + G.tex(prn, 2) + "$. Es hat nachmittags geregnet. Wie wahrscheinlich war es morgens bewölkt? (vier Nachkommastellen)", post, Object.assign({ hint: "Bayes: $P(C \\mid R) = \\dfrac{P(R \\mid C)\\,P(C)}{P(R)}$, und $P(R)$ bekommst du durch Marginalisieren.", explain: "$P(R) = " + G.tex(pc, 2) + " \\cdot " + G.tex(prc, 2) + " + " + G.tex(1 - pc, 2) + " \\cdot " + G.tex(prn, 2) + " = " + G.tex(pr, 4) + "$, also $P(C \\mid R) = \\tfrac{" + G.tex(pc * prc, 4) + "}{" + G.tex(pr, 4) + "} \\approx " + G.tex(post, 4) + "$." }, dec(G, post, 4)));
    },
  });

  const BNV = {
    R: { name: "Regen", values: ["kein", "leicht", "stark"], p: [0.7, 0.2, 0.1] },
    M: { name: "Wartung", values: ["ja", "nein"], p: [[0.4, 0.6], [0.2, 0.8], [0.1, 0.9]] },
    T: { name: "Zug", values: ["pünktlich", "verspätet"], p: [[0.8, 0.2], [0.9, 0.1], [0.6, 0.4], [0.7, 0.3], [0.4, 0.6], [0.5, 0.5]] },
    A: { name: "Termin", values: ["wahrgenommen", "verpasst"], p: [[0.9, 0.1], [0.6, 0.4]] },
  };
  const pR = (r) => BNV.R.p[r], pM = (m, r) => BNV.M.p[r][m], pT = (t, r, m) => BNV.T.p[r * 2 + m][t], pA = (a, t) => BNV.A.p[t][a];
  const BN_INTRO = "Das Netz aus der Vorlesung: Regen ($\\text{kein } 0{,}7$, $\\text{leicht } 0{,}2$, $\\text{stark } 0{,}1$) beeinflusst Wartung und Zug, Wartung beeinflusst den Zug, der Zug den Termin. ";

  gen("cs-bayesnetz", {
    title: "Bayessche Netze",
    make(level, G) {
      const r = G.int(0, 2), m = G.int(0, 1), t = G.int(0, 1), a = G.int(0, 1);
      const V = (k, i) => BNV[k].name + " = " + BNV[k].values[i];
      const tab = "Benötigte Tabellenwerte: $P(\\text{Wartung} = \\text{ja} \\mid \\text{Regen})$: kein $0{,}4$, leicht $0{,}2$, stark $0{,}1$. $P(\\text{Zug} = \\text{verspätet} \\mid \\text{Regen}, \\text{Wartung})$: (kein, ja) $0{,}2$, (kein, nein) $0{,}1$, (leicht, ja) $0{,}4$, (leicht, nein) $0{,}3$, (stark, ja) $0{,}6$, (stark, nein) $0{,}5$. $P(\\text{Termin} = \\text{verpasst} \\mid \\text{Zug})$: pünktlich $0{,}1$, verspätet $0{,}4$.";
      if (level === 1) {
        const v = pR(r) * pM(m, r) * pT(t, r, m) * pA(a, t);
        return num(BN_INTRO + tab + "\n\nBerechne $P(" + [V("R", r), V("M", m), V("T", t), V("A", a)].map((s) => "\\text{" + s + "}").join(",\\ ") + ")$ (vier Nachkommastellen).", v, Object.assign({ hint: "Gemeinsame Wahrscheinlichkeit = Produkt aller Knoten, jeweils bedingt auf die Eltern.", explain: "$" + [pR(r), pM(m, r), pT(t, r, m), pA(a, t)].map((x) => G.tex(x, 2)).join(" \\cdot ") + " = " + G.tex(v, 4) + "$. Jeder Faktor kommt aus der Tabelle eines Knotens." }, dec(G, v, 4)));
      }
      if (level === 2) {
        const v = pM(0, r) * pT(t, r, 0) + pM(1, r) * pT(t, r, 1);
        return num(BN_INTRO + tab + "\n\nBerechne $P(\\text{" + V("T", t) + "} \\mid \\text{" + V("R", r) + "})$ (vier Nachkommastellen).", v, Object.assign({ hint: "Summiere über die unbekannte Wartung.", explain: "$P(\\text{ja} \\mid r) P(t \\mid r, \\text{ja}) + P(\\text{nein} \\mid r) P(t \\mid r, \\text{nein}) = " + G.tex(pM(0, r), 1) + " \\cdot " + G.tex(pT(t, r, 0), 1) + " + " + G.tex(pM(1, r), 1) + " \\cdot " + G.tex(pT(t, r, 1), 1) + " = " + G.tex(v, 4) + "$." }, dec(G, v, 4)));
      }
      if (level === 3) {
        const v = pT(0, r, m) * pA(a, 0) + pT(1, r, m) * pA(a, 1);
        return num(BN_INTRO + tab + "\n\nBerechne $P(\\text{" + V("A", a) + "} \\mid \\text{" + V("R", r) + "},\\ \\text{" + V("M", m) + "})$ (vier Nachkommastellen).", v, Object.assign({ hint: "Summiere über den unbekannten Zug.", explain: "$P(\\text{pünktlich} \\mid r, m)\\,P(a \\mid \\text{pünktlich}) + P(\\text{verspätet} \\mid r, m)\\,P(a \\mid \\text{verspätet}) = " + G.tex(pT(0, r, m), 1) + " \\cdot " + G.tex(pA(a, 0), 1) + " + " + G.tex(pT(1, r, m), 1) + " \\cdot " + G.tex(pA(a, 1), 1) + " = " + G.tex(v, 4) + "$." }, dec(G, v, 4)));
      }
      const unnorm = [0, 1, 2].map((rr) => pR(rr) * (pM(0, rr) * pT(t, rr, 0) + pM(1, rr) * pT(t, rr, 1)));
      const tot = unnorm.reduce((x, y) => x + y, 0), v = unnorm[r] / tot;
      return num(BN_INTRO + tab + "\n\nDer Zug ist " + BNV.T.values[t] + ". Wie wahrscheinlich ist $\\text{" + V("R", r) + "}$? (Inferenz durch Aufzählung, vier Nachkommastellen)", v, Object.assign({ hint: "Berechne für jeden Regenwert $P(r) \\sum_m P(m \\mid r) P(t \\mid r, m)$ und normiere.", explain: "Unnormiert: " + unnorm.map((x, i) => BNV.R.values[i] + " $" + G.tex(x, 4) + "$").join(", ") + ". Summe $" + G.tex(tot, 4) + "$, also $" + G.tex(unnorm[r], 4) + " / " + G.tex(tot, 4) + " \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4)));
    },
  });

  gen("cs-markov", {
    title: "Markov-Ketten und HMM",
    make(level, G) {
      const pss = G.pick([0.6, 0.7, 0.8, 0.9]), prr = G.pick([0.5, 0.6, 0.7]);
      const intro = "Wetter als Markov-Kette: Auf Sonne folgt Sonne mit $" + G.tex(pss, 1) + "$, auf Regen folgt Regen mit $" + G.tex(prr, 1) + "$. ";
      if (level === 1) { const v = pss * pss + (1 - pss) * (1 - prr); return num(intro + "Heute scheint die Sonne. Wie wahrscheinlich ist Sonne **übermorgen**? (vier Nachkommastellen)", v, Object.assign({ hint: "Zwei Wege: Sonne, Sonne, Sonne oder Sonne, Regen, Sonne.", explain: "$" + G.tex(pss, 1) + " \\cdot " + G.tex(pss, 1) + " + " + G.tex(1 - pss, 1) + " \\cdot " + G.tex(1 - prr, 1) + " = " + G.tex(v, 4) + "$." }, dec(G, v, 4))); }
      if (level === 2) { const v = pss * (1 - pss) * prr; return num(intro + "Heute scheint die Sonne. Wie wahrscheinlich ist genau die Folge Sonne, Regen, Regen für die nächsten drei Tage? (vier Nachkommastellen)", v, Object.assign({ explain: "Markov-Annahme: Jeder Tag hängt nur vom Vortag ab. $" + G.tex(pss, 1) + " \\cdot " + G.tex(1 - pss, 1) + " \\cdot " + G.tex(prr, 1) + " = " + G.tex(v, 4) + "$." }, dec(G, v, 4))); }
      if (level === 3) { const v = (1 - prr) / (1 - pss + 1 - prr); return num(intro + "Welcher Anteil der Tage ist auf lange Sicht sonnig? (vier Nachkommastellen)", v, Object.assign({ hint: "Im Gleichgewicht fließt genauso viel Wahrscheinlichkeit von Sonne zu Regen wie zurück: $\\pi_S \\cdot P(S \\to R) = \\pi_R \\cdot P(R \\to S)$.", explain: "$\\pi_S = \\dfrac{" + G.tex(1 - prr, 1) + "}{" + G.tex(1 - pss, 1) + " + " + G.tex(1 - prr, 1) + "} \\approx " + G.tex(v, 4) + "$. Der Startzustand spielt langfristig keine Rolle." }, dec(G, v, 4))); }
      const a = G.pick([0.8, 0.9]), b = G.pick([0.1, 0.2, 0.3]), prior = G.pick([0.3, 0.4, 0.5]);
      const v = (prior * a) / (prior * a + (1 - prior) * b);
      return num("Hidden-Markov-Modell: Das Wetter ist verborgen, man sieht nur, ob jemand einen Schirm trägt. Bei Regen trägt er ihn mit $" + G.tex(a, 1) + "$, bei Sonne mit $" + G.tex(b, 1) + "$. Vor der Beobachtung ist Regen $" + G.tex(prior, 1) + "$ wahrscheinlich. Er trägt einen Schirm. Wie wahrscheinlich ist Regen jetzt? (vier Nachkommastellen)", v, Object.assign({ hint: "Filtern ist Bayes: Vorwissen mal Sensormodell, dann normieren.", explain: "$\\dfrac{" + G.tex(prior, 1) + " \\cdot " + G.tex(a, 1) + "}{" + G.tex(prior, 1) + " \\cdot " + G.tex(a, 1) + " + " + G.tex(1 - prior, 1) + " \\cdot " + G.tex(b, 1) + "} \\approx " + G.tex(v, 4) + "$." }, dec(G, v, 4)));
    },
  });

  // ---------------------------------------------------------------- Lecture 3: optimization

  function climb(vals, s) {
    let x = s, steps = 0;
    for (;;) {
      let b = x;
      [x - 1, x + 1].forEach((j) => { if (j >= 0 && j < vals.length && vals[j] > vals[b]) b = j; });
      if (b === x) return { x, steps };
      x = b; steps++;
    }
  }

  gen("cs-lokal", {
    title: "Lokale Suche",
    make(level, G) {
      let vals;
      do { vals = Array.from({ length: 9 }, () => G.int(1, 9)); } while (new Set(vals).size < 6 || vals.filter((v) => v === Math.max(...vals)).length > 1);
      const show = "$" + vals.map((v, i) => "z_{" + (i + 1) + "} = " + v).join(",\\ ") + "$";
      const intro = "Neun Zustände in einer Reihe, Nachbarn sind die direkt links und rechts, mit den Werten " + show + ". Gesucht ist ein Maximum. ";
      if (level <= 2) {
        const need = level === 1 ? 1 : 2;
        const starts = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => climb(vals, i).steps >= need);
        const pool = starts.length ? starts : [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => climb(vals, i).steps >= 1);
        const s = G.pick(pool.length ? pool : [0]), r = climb(vals, s);
        if (level === 1) return num(intro + "Hill Climbing (steilster Anstieg) startet bei $z_{" + (s + 1) + "}$. In welchem Zustand bleibt es stehen? (Nummer)", r.x + 1, { explain: "In jedem Schritt geht es zum besseren der beiden Nachbarn, solange er besser ist als der aktuelle Zustand. Es endet bei $z_{" + (r.x + 1) + "}$ mit Wert " + vals[r.x] + (vals[r.x] === Math.max(...vals) ? ", dem globalen Maximum." : ", einem lokalen Maximum. Das globale Maximum ist " + Math.max(...vals) + ".") });
        return tf(intro + "Hill Climbing startet bei $z_{" + (s + 1) + "}$. Findet es das globale Maximum?", vals[r.x] === Math.max(...vals), "Es bleibt bei $z_{" + (r.x + 1) + "}$ mit Wert " + vals[r.x] + " stehen, das globale Maximum ist " + Math.max(...vals) + ".", "Hill Climbing bleibt im ersten lokalen Maximum stecken, das es erreicht.");
      }
      if (level === 3) {
        const dE = -G.int(1, 5), T = G.pick([0.5, 1, 2, 4, 8]), v = Math.exp(dE / T);
        return num("Simulated Annealing betrachtet einen Nachbarn, der um $" + -dE + "$ **schlechter** ist ($\\Delta E = " + dE + "$). Die Temperatur ist $T = " + G.tex(T, 1) + "$. Mit welcher Wahrscheinlichkeit wird der Schritt trotzdem gemacht? (vier Nachkommastellen)", v, Object.assign({ hint: "Akzeptanzwahrscheinlichkeit $e^{\\Delta E / T}$.", explain: "$e^{" + dE + "/" + G.tex(T, 1) + "} \\approx " + G.tex(v, 4) + "$. Bei hoher Temperatur werden Verschlechterungen oft akzeptiert, bei niedriger fast nie. So entkommt die Suche anfangs lokalen Maxima und wird später zum reinen Bergsteigen." }, dec(G, v, 4)));
      }
      const top = vals.indexOf(Math.max(...vals));
      const good = vals.map((_, s) => climb(vals, s).x).filter((x) => x === top).length;
      return num(intro + "Bei wie vielen der $9$ Startzustände endet Hill Climbing im globalen Maximum?", good, { explain: "Genau die Startzustände im »Einzugsgebiet« des Gipfels $z_{" + (top + 1) + "}$: $" + good + "$ von $9$. Darum hilft Random Restart: Je mehr Neustarts, desto wahrscheinlicher landet einer in diesem Gebiet." });
    },
  });

  const EX = { vars: ["A", "B", "C", "D", "E", "F", "G"], edges: [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["B", "E"], ["C", "E"], ["C", "F"], ["D", "E"], ["E", "F"], ["E", "G"], ["F", "G"]], dom: ["Mo", "Di", "Mi"] };
  const EX_TXT = "Prüfungsplanung aus der Vorlesung: Die Kurse $A$ bis $G$ bekommen je einen Termin (Mo, Di, Mi). Verbundene Kurse haben gemeinsame Teilnehmer und brauchen verschiedene Tage. Verbindungen: " + EX.edges.map((e) => e[0] + e[1]).join(", ") + ". ";
  const nb = (v) => EX.edges.filter((e) => e.includes(v)).map((e) => (e[0] === v ? e[1] : e[0]));

  gen("cs-csp", {
    title: "Constraint Satisfaction",
    make(level, G) {
      if (level === 1) {
        const a = {};
        EX.vars.forEach((v) => (a[v] = G.int(0, 2)));
        const bad = EX.edges.filter((e) => a[e[0]] === a[e[1]]);
        return num(EX_TXT + "Belegung: " + EX.vars.map((v) => v + " = " + EX.dom[a[v]]).join(", ") + ". Wie viele Bedingungen sind verletzt?", bad.length, { explain: bad.length ? "Verletzt: " + bad.map((e) => e[0] + e[1]).join(", ") + "." : "Keine: Das ist eine Lösung." });
      }
      const a = {};
      const pickVars = G.pickN(EX.vars, level === 2 ? 2 : 3);
      pickVars.forEach((v) => (a[v] = G.int(0, 2)));
      const left = (v) => EX.dom.filter((_, k) => nb(v).every((u) => a[u] !== k));
      const unassigned = EX.vars.filter((v) => !(v in a));
      const shown = "Bisher: " + pickVars.map((v) => v + " = " + EX.dom[a[v]]).join(", ") + ". ";
      if (level === 2) {
        const v = G.pick(unassigned);
        return num(EX_TXT + shown + "Wie viele Werte bleiben für $" + v + "$ übrig, wenn man alle Werte streicht, die einem bereits belegten Nachbarn widersprechen?", left(v).length, { explain: "Nachbarn von $" + v + "$: " + nb(v).join(", ") + ". Übrig bleibt " + (left(v).length ? left(v).join(", ") : "nichts, ein Hinweis zum Zurückgehen (Backtracking)") + "." });
      }
      if (level === 3) {
        const counts = unassigned.map((v) => ({ v, n: left(v).length, deg: nb(v).filter((u) => !(u in a)).length }));
        const minN = Math.min(...counts.map((c) => c.n));
        const cands = counts.filter((c) => c.n === minN);
        const best = cands.reduce((x, c) => (c.deg > x.deg ? c : x));
        const unique = cands.filter((c) => c.deg === best.deg).length === 1;
        if (!unique) return num(EX_TXT + shown + "Wie viele Werte bleiben für $" + unassigned[0] + "$ übrig?", left(unassigned[0]).length, { explain: "Übrig: " + (left(unassigned[0]).join(", ") || "nichts") + "." });
        return { type: "choice", md: EX_TXT + shown + "Welche Variable wählt Backtracking mit der Heuristik **Minimum Remaining Values** (bei Gleichstand: größter Grad) als Nächstes?", options: G.options({ md: "$" + best.v + "$" }, counts.filter((c) => c !== best).slice(0, 3).map((c) => ({ md: "$" + c.v + "$", why: "$" + c.v + "$ hat noch " + c.n + (c.n === 1 ? " Wert" : " Werte") + (c.n === minN ? ", aber weniger unbelegte Nachbarn" : "") + "." }))), explain: "Übrige Werte: " + counts.map((c) => c.v + " " + c.n).join(", ") + ". MRV nimmt die Variable mit den wenigsten Möglichkeiten, hier $" + best.v + "$" + (cands.length > 1 ? "; der Gleichstand wird mit dem Grad aufgelöst" : "") + ". Wer am stärksten eingeschränkt ist, scheitert am ehesten, und das will man früh wissen." };
      }
      const dx = G.pickN([1, 2, 3, 4, 5, 6], G.int(3, 5)).sort((p, q) => p - q), dy = G.pickN([1, 2, 3, 4, 5, 6], G.int(2, 4)).sort((p, q) => p - q);
      const C = G.pick([{ tex: "X < Y", f: (x, y) => x < y }, { tex: "X > Y", f: (x, y) => x > y }, { tex: "X + Y = 7", f: (x, y) => x + y === 7 }, { tex: "X = 2Y", f: (x, y) => x === 2 * y }, { tex: "X \\ne Y", f: (x, y) => x !== y }]);
      const keep = dx.filter((x) => dy.some((y) => C.f(x, y)));
      return num("Bogenkonsistenz: $X \\in \\{" + dx.join(", ") + "\\}$, $Y \\in \\{" + dy.join(", ") + "\\}$, Bedingung $" + C.tex + "$. Man macht $X$ bogenkonsistent bezüglich $Y$: Jeder Wert von $X$ ohne passenden Partner in $Y$ fliegt raus. Wie viele Werte bleiben für $X$?", keep.length, { explain: "Übrig: $\\{" + keep.join(", ") + "\\}$. Für jeden dieser Werte gibt es ein $y$ mit $" + C.tex + "$. Das ist ein Schritt des Algorithmus AC-3." });
    },
  });

  // ---------------------------------------------------------------- Lecture 4: learning

  gen("cs-klassifikation", {
    title: "Klassifikation",
    make(level, G) {
      if (level <= 2) {
        let pts, q, ds;
        const k = level === 1 ? 1 : 3;
        do {
          pts = Array.from({ length: 6 }, (_, i) => ({ n: "P" + (i + 1), x: G.int(0, 10), y: G.int(0, 10), c: i % 2 }));
          q = [G.int(1, 9), G.int(1, 9)];
          ds = pts.map((o) => ({ o, d: Math.hypot(o.x - q[0], o.y - q[1]) })).sort((a, b) => a.d - b.d);
        } while (Math.abs(ds[k - 1].d - ds[k].d) < 0.3 || ds[0].d < 0.5);
        const near = ds.slice(0, k), ones = near.filter((o) => o.o.c === 1).length, pred = ones * 2 > k ? 1 : 0;
        const nm = ["kein Regen", "Regen"];
        return { type: "choice", md: "Trainingsdaten: " + pts.map((o) => o.n + " $(" + o.x + ", " + o.y + ")$ " + nm[o.c]).join(", ") + ". Wie klassifiziert **" + (k === 1 ? "Nearest Neighbor" : "3-Nearest-Neighbors") + "** den Punkt $(" + q[0] + ", " + q[1] + ")$ (euklidischer Abstand)?", shuffle: false, options: [{ md: "Regen", correct: pred === 1 }, { md: "kein Regen", correct: pred === 0 }], explain: "Die nächsten Punkte: " + near.map((o) => o.o.n + " (Abstand " + G.fmt(o.d, 2) + ", " + nm[o.o.c] + ")").join(", ") + ". " + (k === 1 ? "Der nächste entscheidet." : "Die Mehrheit entscheidet.") };
      }
      if (level === 3) {
        let w, x, y, h;
        do { w = [G.int(-3, 3), G.int(-3, 3), G.int(-3, 3)]; x = [G.int(0, 3), G.int(0, 3)]; y = G.int(0, 1); h = w[0] + w[1] * x[0] + w[2] * x[1] >= 0 ? 1 : 0; } while (h === y);
        const al = G.pick([0.5, 1]), d = y - h;
        const nw = [w[0] + al * d, w[1] + al * d * x[0], w[2] + al * d * x[1]];
        return { type: "cloze", md: "Perzeptron mit $h(x) = 1$, falls $w_0 + w_1 x_1 + w_2 x_2 \\ge 0$, sonst $0$. Gewichte $w = (" + w.join(", ") + ")$, Lernrate $\\alpha = " + G.tex(al, 1) + "$. Der Datenpunkt $x = (" + x.join(", ") + ")$ hat die Klasse $y = " + y + "$. Berechne die neuen Gewichte nach der Perzeptron-Regel $w_i \\leftarrow w_i + \\alpha\\,(y - h(x))\\,x_i$ (mit $x_0 = 1$).\n\n$w_0 =$ {{0}} $\\quad w_1 =$ {{1}} $\\quad w_2 =$ {{2}}", blanks: nw.map((v) => blank(v)), explain: "$w \\cdot x = " + (w[0] + w[1] * x[0] + w[2] * x[1]) + "$, also $h(x) = " + h + "$, aber $y = " + y + "$. Mit $y - h = " + d + "$: $w_0 = " + G.tex(nw[0], 1) + "$, $w_1 = " + G.tex(nw[1], 1) + "$, $w_2 = " + G.tex(nw[2], 1) + "$. Die Gewichte verschieben die Grenze in Richtung des falsch eingeordneten Punkts." };
      }
      const kind = G.pick(["01", "L1", "L2"]);
      const yv = Array.from({ length: 5 }, () => G.int(0, kind === "01" ? 1 : 9)), pv = yv.map((v) => (kind === "01" ? (G.chance(0.6) ? v : 1 - v) : v + G.int(-3, 3)));
      const loss = kind === "01" ? yv.filter((v, i) => v !== pv[i]).length : kind === "L1" ? yv.reduce((s, v, i) => s + Math.abs(v - pv[i]), 0) : yv.reduce((s, v, i) => s + (v - pv[i]) * (v - pv[i]), 0);
      return num("Tatsächliche Werte $(" + yv.join(", ") + ")$, Vorhersagen $(" + pv.join(", ") + ")$. Berechne den " + (kind === "01" ? "**0-1-Verlust** (Anzahl der Fehler)" : kind === "L1" ? "**$L_1$-Verlust** $\\sum |y - \\hat y|$" : "**$L_2$-Verlust** $\\sum (y - \\hat y)^2$") + ".", loss, { explain: "Ergebnis $" + loss + "$. " + (kind === "L2" ? "Der $L_2$-Verlust bestraft große Abweichungen besonders stark." : kind === "L1" ? "Jede Abweichung zählt mit ihrer Größe." : "Bei Klassifikation zählt nur richtig oder falsch.") });
    },
  });

  gen("cs-rl", {
    title: "Reinforcement Learning",
    make(level, G) {
      const al = G.pick([0.1, 0.2, 0.5]), ga = G.pick([0.8, 0.9]);
      if (level <= 2) {
        const q = G.int(-4, 6) / 2, r = G.pick([-1, 0, 1, 2]);
        const nxt = level === 1 ? [0] : [G.int(-2, 6) / 2, G.int(-2, 6) / 2, G.int(-2, 6) / 2];
        const target = r + (level === 1 ? 0 : ga * Math.max(...nxt)), v = q + al * (target - q);
        return num("Q-Learning: $Q(s, a) = " + G.tex(q, 1) + "$, Lernrate $\\alpha = " + G.tex(al, 1) + "$, Diskont $\\gamma = " + G.tex(ga, 1) + "$. Die Aktion bringt die Belohnung $r = " + r + "$ und führt in " + (level === 1 ? "einen **Endzustand**" : "den Zustand $s'$ mit $Q(s', \\cdot) = " + nxt.map((x) => G.tex(x, 1)).join(",\\ ") + "$") + ". Wie lautet der neue Wert $Q(s, a)$? (vier Nachkommastellen)", v, Object.assign({ hint: "$Q \\leftarrow Q + \\alpha\\,(r + \\gamma \\max_{a'} Q(s', a') - Q)$; im Endzustand fällt der zweite Summand weg.", explain: "Neue Schätzung $" + G.tex(r, 0) + (level === 1 ? "" : " + " + G.tex(ga, 1) + " \\cdot " + G.tex(Math.max(...nxt), 1)) + " = " + G.tex(target, 4) + "$, alte $" + G.tex(q, 1) + "$. $Q = " + G.tex(q, 1) + " + " + G.tex(al, 1) + " \\cdot (" + G.tex(target, 4) + " - " + G.tex(q, 1) + ") = " + G.tex(v, 4) + "$." }, dec(G, v, 4)));
      }
      if (level === 3) { const e = G.pick([0.1, 0.2, 0.3]), k = G.int(2, 5), v = 1 - e + e / k; return num("$\\varepsilon$-greedy mit $\\varepsilon = " + G.tex(e, 1) + "$ und $" + k + "$ möglichen Aktionen: Mit Wahrscheinlichkeit $\\varepsilon$ wählt der Agent eine zufällige Aktion (auch die beste ist möglich), sonst die beste. Wie wahrscheinlich ist die beste Aktion? (vier Nachkommastellen)", v, Object.assign({ explain: "$1 - \\varepsilon + \\tfrac{\\varepsilon}{" + k + "} = " + G.tex(v, 4) + "$. Der kleine Zufallsanteil sorgt für **Exploration**, der Rest nutzt das Gelernte (**Exploitation**)." }, dec(G, v, 4))); }
      const rs = Array.from({ length: G.int(3, 4) }, () => G.pick([-1, 0, 0, 1, 2]));
      const v = rs.reduce((s, r, i) => s + Math.pow(ga, i) * r, 0);
      return num("Ein Agent erhält nacheinander die Belohnungen $" + rs.join(",\\ ") + "$. Wie groß ist der diskontierte Ertrag mit $\\gamma = " + G.tex(ga, 1) + "$? (vier Nachkommastellen)", v, Object.assign({ explain: "$" + rs.map((r, i) => (i ? G.tex(ga, 1) + "^{" + i + "} \\cdot " : "") + "(" + r + ")").join(" + ") + " = " + G.tex(v, 4) + "$. Spätere Belohnungen zählen weniger, deshalb lohnen sich kurze Wege." }, dec(G, v, 4)));
    },
  });

  // ---------------------------------------------------------------- Lecture 5: neural networks

  gen("cs-nn", {
    title: "Neuronen und Gradientenabstieg",
    make(level, G) {
      const w = [G.int(-3, 2), G.int(-2, 3), G.int(-2, 3)], x = [G.int(0, 1), G.int(0, 1)];
      const z = w[0] + w[1] * x[0] + w[2] * x[1];
      if (level === 1) return num("Ein Neuron mit Stufenfunktion: $h = 1$, falls $w_0 + w_1 x_1 + w_2 x_2 \\ge 0$, sonst $0$. Mit $w = (" + w.join(", ") + ")$ und $x = (" + x.join(", ") + ")$: Welche Ausgabe?", z >= 0 ? 1 : 0, { explain: "$" + w[0] + " + " + w[1] + " \\cdot " + x[0] + " + " + w[2] + " \\cdot " + x[1] + " = " + z + "$, also $h = " + (z >= 0 ? 1 : 0) + "$." });
      if (level === 2) { const xs = [G.int(-2, 3) / 2, G.int(-2, 3) / 2], zz = w[0] + w[1] * xs[0] + w[2] * xs[1], v = 1 / (1 + Math.exp(-zz)); return num("Ein Neuron mit Sigmoid $\\sigma(z) = \\tfrac{1}{1 + e^{-z}}$, Gewichte $w = (" + w.join(", ") + ")$ und Eingabe $x = (" + xs.map((t) => G.tex(t, 1)).join(", ") + ")$. Berechne die Ausgabe (vier Nachkommastellen).", v, Object.assign({ explain: "$z = " + G.tex(zz, 2) + "$, $\\sigma(z) \\approx " + G.tex(v, 4) + "$. Anders als die Stufe liefert der Sigmoid eine Zahl zwischen $0$ und $1$, die man als Wahrscheinlichkeit lesen kann." }, dec(G, v, 4))); }
      if (level === 3) {
        const F = G.pick([["UND", [-3, 2, 2]], ["ODER", [-1, 2, 2]], ["NAND", [3, -2, -2]], ["NOR", [1, -2, -2]]]);
        const s = G.pick([1, 2]), ww = F[1].map((t) => t * s);
        return { type: "choice", md: "Ein Neuron mit Stufenfunktion hat die Gewichte $w_0 = " + ww[0] + "$, $w_1 = " + ww[1] + "$, $w_2 = " + ww[2] + "$. Welche logische Funktion von $x_1, x_2 \\in \\{0, 1\\}$ berechnet es?", options: G.options({ md: F[0] }, ["UND", "ODER", "NAND", "NOR", "XOR"].filter((n) => n !== F[0]).slice(0, 3).map((n) => ({ md: n }))), explain: "Setze alle vier Eingaben ein: " + [[0, 0], [0, 1], [1, 0], [1, 1]].map((xx) => "$(" + xx.join(",") + ") \\mapsto " + (ww[0] + ww[1] * xx[0] + ww[2] * xx[1] >= 0 ? 1 : 0) + "$").join(", ") + ". XOR kann ein einzelnes Neuron nie berechnen, weil keine Gerade die Punkte trennt." };
      }
      const xv = G.pick([1, 2]), yv = G.int(-2, 4), w0 = G.int(-2, 3), al = G.pick([0.05, 0.1, 0.2]);
      const grad = 2 * (w0 * xv - yv) * xv, v = w0 - al * grad;
      const inner = (xv === 1 ? "w" : xv + "w") + (yv === 0 ? "" : yv > 0 ? " - " + yv : " + " + -yv);
      return num("Gradientenabstieg für ein Gewicht $w$ mit Verlust $L(w) = (" + inner + ")^2$: Das Modell sagt $" + (xv === 1 ? "w" : xv + "w") + "$ voraus, richtig wäre $" + yv + "$. Start $w = " + w0 + "$, Lernrate $\\alpha = " + G.tex(al, 2) + "$. Wie lautet $w$ nach einem Schritt $w \\leftarrow w - \\alpha L'(w)$? (vier Nachkommastellen)", v, Object.assign({ hint: "$L'(w) = 2(" + inner + ")" + (xv === 1 ? "" : " \\cdot " + xv) + "$.", explain: "$L'(" + w0 + ") = " + grad + "$, also $w = " + w0 + " - " + G.tex(al, 2) + " \\cdot " + grad + " = " + G.tex(v, 4) + "$. Der Schritt geht gegen die Steigung, also bergab." }, dec(G, v, 4)));
    },
  });

  // ---------------------------------------------------------------- Lecture 6: language

  gen("cs-nlp", {
    title: "Sprache",
    make(level, G) {
      if (level === 1) {
        const w1 = G.pick(["die", "der", "ein", "sehr"]), w2 = G.pick(["katze", "frage", "gute", "schnell"]);
        const c1 = G.int(20, 120), c12 = G.int(2, Math.floor(c1 / 3));
        return num("In einem Text kommt »" + w1 + "« $" + c1 + "$-mal vor, davon $" + c12 + "$-mal direkt gefolgt von »" + w2 + "«. Wie groß ist die Bigramm-Wahrscheinlichkeit $P(\\text{" + w2 + "} \\mid \\text{" + w1 + "})$? (vier Nachkommastellen)", c12 / c1, Object.assign({ explain: "$\\tfrac{" + c12 + "}{" + c1 + "} \\approx " + G.tex(c12 / c1, 4) + "$. Ein Bigramm-Modell schaut nur auf das jeweils letzte Wort." }, dec(G, c12 / c1, 4)));
      }
      if (level === 2) {
        const pp = G.pick([0.4, 0.5, 0.6]), a1 = G.pick([0.3, 0.4, 0.5]), a2 = G.pick([0.2, 0.3]), b1 = G.pick([0.1, 0.2]), b2 = G.pick([0.05, 0.1]);
        const up = pp * a1 * a2, un = (1 - pp) * b1 * b2, v = up / (up + un);
        return num("Naive Bayes für die Stimmung einer Rezension mit den Wörtern »toll« und »gerne«: $P(\\text{positiv}) = " + G.tex(pp, 1) + "$, $P(\\text{toll} \\mid +) = " + G.tex(a1, 2) + "$, $P(\\text{gerne} \\mid +) = " + G.tex(a2, 2) + "$, $P(\\text{toll} \\mid -) = " + G.tex(b1, 2) + "$, $P(\\text{gerne} \\mid -) = " + G.tex(b2, 2) + "$. Wie wahrscheinlich ist die Rezension positiv? (vier Nachkommastellen)", v, Object.assign({ hint: "Multipliziere für jede Klasse die Vorab-Wahrscheinlichkeit mit den Wortwahrscheinlichkeiten und normiere.", explain: "Positiv: $" + G.tex(pp, 1) + " \\cdot " + G.tex(a1, 2) + " \\cdot " + G.tex(a2, 2) + " = " + G.tex(up, 4) + "$, negativ: $" + G.tex(1 - pp, 1) + " \\cdot " + G.tex(b1, 2) + " \\cdot " + G.tex(b2, 2) + " = " + G.tex(un, 4) + "$. Normiert: $" + G.tex(v, 4) + "$. »Naiv« ist die Annahme, dass die Wörter unabhängig voneinander sind." }, dec(G, v, 4)));
      }
      if (level === 3) {
        const c = G.int(0, 3), N = G.int(40, 200), V = G.pick([500, 1000, 2000]), v = (c + 1) / (N + V);
        return num("Additive Glättung (Laplace): Ein Wort kam in den positiven Rezensionen $" + c + "$-mal vor, insgesamt stehen dort $" + N + "$ Wörter, das Vokabular hat $" + V + "$ Wörter. Wie groß ist die geglättete Wahrscheinlichkeit $\\tfrac{\\text{Anzahl} + 1}{N + V}$? (Dezimalzahl, sechs Nachkommastellen)", v, { tolerance: 0.0000006, answerText: G.fmt(v, 6), explain: "$\\tfrac{" + (c + 1) + "}{" + (N + V) + "} \\approx " + G.tex(v, 6) + "$. Ohne die $+1$ hätte ein nie gesehenes Wort die Wahrscheinlichkeit $0$ und würde das ganze Produkt auf $0$ setzen." });
      }
      if (G.chance(0.5)) {
        const a = [G.int(-3, 4), G.int(-3, 4), G.int(-3, 4)], b = [G.int(-3, 4), G.int(-3, 4), G.int(-3, 4)];
        const na = Math.hypot(...a), nb2 = Math.hypot(...b);
        if (!na || !nb2) return num("Wie groß ist die Kosinus-Ähnlichkeit von $(1, 0, 0)$ und $(2, 0, 0)$?", 1, { explain: "Gleiche Richtung, also $1$." });
        const v = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (na * nb2);
        return num("Zwei Wortvektoren $u = (" + a.join(", ") + ")$ und $v = (" + b.join(", ") + ")$. Berechne die Kosinus-Ähnlichkeit $\\tfrac{u \\cdot v}{\\|u\\|\\,\\|v\\|}$ (vier Nachkommastellen).", v, Object.assign({ explain: "$u \\cdot v = " + (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) + "$, $\\|u\\| \\approx " + G.tex(na, 3) + "$, $\\|v\\| \\approx " + G.tex(nb2, 3) + "$, Ergebnis $\\approx " + G.tex(v, 4) + "$. Nahe $1$: ähnliche Bedeutung, nahe $0$: unabhängig." }, dec(G, v, 4)));
      }
      const s = [G.int(-1, 3), G.int(-1, 3), G.int(-1, 3)], k = G.int(0, 2), ex = s.map(Math.exp), v = ex[k] / ex.reduce((x, y) => x + y, 0);
      return num("Attention: Ein Wort hat zu drei anderen Wörtern die Bewertungen $" + s.join(",\\ ") + "$. Die Gewichte entstehen mit Softmax, $\\tfrac{e^{s_i}}{\\sum_j e^{s_j}}$. Welches Gewicht bekommt das " + ["erste", "zweite", "dritte"][k] + " Wort? (vier Nachkommastellen)", v, Object.assign({ explain: "$\\tfrac{e^{" + s[k] + "}}{e^{" + s[0] + "} + e^{" + s[1] + "} + e^{" + s[2] + "}} \\approx " + G.tex(v, 4) + "$. Softmax macht aus beliebigen Bewertungen positive Gewichte mit Summe $1$, und große Bewertungen setzen sich deutlich durch." }, dec(G, v, 4)));
    },
  });
})();
