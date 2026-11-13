// Chemistry (Oberstufe Hessen): atomic structure, bonding and electronegativity, acids and pH, chemical equilibrium.
// Number templates on four levels, statements to judge and derivations as proof tasks. Own wording throughout.
(function () {
  const F = LW.forms;
  const STMT = { 1: ["tf"], 2: ["tf", "sort"], 3: ["multi", "sort"], 4: ["spot", "multi"] };
  const DERIV = { 3: ["gaps", "justify"], 4: ["flaw", "order", "justify"] };
  const s = (md, by, why) => ({ md, by, why });
  const d = (md, why) => ({ md, why });
  function num(G, value, digits, md, explain, unit, extra) {
    const tol = Math.max(0.6 * Math.pow(10, -digits), Math.abs(value) * 0.004);
    return Object.assign({ type: "numeric", md, answer: G.round(value, digits), tolerance: tol, answerText: G.fmt(value, digits) + (unit ? " " + unit : ""),
      placeholder: unit || "Zahl", explain }, extra || {});
  }
  function gen(name, title, byLevel) {
    LW.generator(name, { title, make(level, G, params) { return G.pick(byLevel[level] || byLevel[1])(level, G, params); } });
  }
  const T = (G, x, dd) => G.tex(x, dd == null ? 2 : dd);

  // symbol, name, Z, mass number, electronegativity (rounded school values)
  const EL = [
    ["H", "Wasserstoff", 1, 1, 2.2], ["He", "Helium", 2, 4, null], ["Li", "Lithium", 3, 7, 1.0], ["Be", "Beryllium", 4, 9, 1.5], ["B", "Bor", 5, 11, 2.0],
    ["C", "Kohlenstoff", 6, 12, 2.5], ["N", "Stickstoff", 7, 14, 3.0], ["O", "Sauerstoff", 8, 16, 3.5], ["F", "Fluor", 9, 19, 4.0], ["Ne", "Neon", 10, 20, null],
    ["Na", "Natrium", 11, 23, 0.9], ["Mg", "Magnesium", 12, 24, 1.2], ["Al", "Aluminium", 13, 27, 1.5], ["Si", "Silicium", 14, 28, 1.8], ["P", "Phosphor", 15, 31, 2.1],
    ["S", "Schwefel", 16, 32, 2.5], ["Cl", "Chlor", 17, 35, 3.0], ["Ar", "Argon", 18, 40, null], ["K", "Kalium", 19, 39, 0.8], ["Ca", "Calcium", 20, 40, 1.0],
  ];
  const shells = (e) => { const out = []; let r = e; for (const c of [2, 8, 8, 8]) { if (r <= 0) break; const k = Math.min(c, r); out.push(k); r -= k; } return out; };
  const valence = (z) => { const sh = shells(z); return sh[sh.length - 1]; };
  /** charge of the usual ion of a main-group element, 0 for noble gases and the ones that rarely form ions */
  const ionCharge = (z) => { const v = valence(z), sh = shells(z); if (sh.length === 1 && z === 2) return 0; if (v === 8) return 0; return v <= 3 ? v : v >= 5 ? v - 8 : 0; };
  const ionName = (el, q) => el[0] + (q === 0 ? "" : (Math.abs(q) > 1 ? Math.abs(q) : "") + (q > 0 ? "+" : "−"));
  const sup = (q) => (q === 0 ? "" : "^{" + (Math.abs(q) > 1 ? Math.abs(q) : "") + (q > 0 ? "+" : "-") + "}");

  // ================================================================ atomic structure
  gen("che-atombau", "Atombau", {
    1: [(lv, G) => {
      const el = G.pick(EL), n = el[3] - el[2], ask = G.pick(["p", "n", "e"]);
      if (ask === "n") return num(G, n, 0, "Ein Atom $^{" + el[3] + "}\\mathrm{" + el[0] + "}$ (" + el[1] + ", Ordnungszahl " + el[2] + "): Wie viele Neutronen hat sein Kern?",
        "Massenzahl minus Ordnungszahl: $" + el[3] + " - " + el[2] + " = " + n + "$ Neutronen.", "Neutronen");
      if (ask === "p") return num(G, el[2], 0, "Wie viele Protonen hat ein Atom " + el[1] + " ($\\mathrm{" + el[0] + "}$, Ordnungszahl " + el[2] + ")?",
        "Die Ordnungszahl ist die Zahl der Protonen: " + el[2] + ".", "Protonen");
      return num(G, el[2], 0, "Wie viele Elektronen hat ein ungeladenes Atom " + el[1] + " (Ordnungszahl " + el[2] + ")?",
        "Im neutralen Atom gleichen die Elektronen die Protonen aus: " + el[2] + " Elektronen.", "Elektronen");
    }, (lv, G) => {
      const el = G.pick(EL.filter((x) => x[2] > 2)), v = valence(el[2]);
      return num(G, v, 0, "Wie viele Valenzelektronen (Elektronen auf der äußersten Schale) hat ein Atom " + el[1] + " (Z = " + el[2] + ")?",
        "Schalen: " + shells(el[2]).join(", ") + ". Außen stehen " + v + ", das ist auch die Nummer der Hauptgruppe" + (v === 8 ? " (Edelgas)" : "") + ".", "Elektronen");
    }],
    2: [(lv, G) => {
      const el = G.pick(EL.filter((x) => x[2] >= 11 && x[2] <= 18)), sh = shells(el[2]);
      return { type: "cloze", md: "Verteile die " + el[2] + " Elektronen von " + el[1] + " auf die Schalen: K-Schale {{0}}, L-Schale {{1}}, M-Schale {{2}}.",
        blanks: sh.map((k, i) => ({ accept: [k], numeric: true, tolerance: 0, placeholder: "KLM"[i] })),
        explain: "Die K-Schale fasst 2 Elektronen, die L-Schale 8, die M-Schale wird hier bis 8 gefüllt: " + sh.join(", ") + "." };
    }, (lv, G) => {
      const el = G.pick(EL.filter((x) => x[2] > 2)), sh = shells(el[2]);
      if (G.chance(0.5)) return num(G, sh.length, 0, "In welcher Periode des Periodensystems steht " + el[1] + " (Z = " + el[2] + ")?",
        "Die Periode ist die Zahl der besetzten Schalen. Schalen: " + sh.join(", ") + ", also " + sh.length + ". Periode.", "Periode");
      const v = sh[sh.length - 1];
      return num(G, v, 0, "In welcher Hauptgruppe steht " + el[1] + " (Z = " + el[2] + ")? (Zahl eingeben)",
        "Hauptgruppe = Zahl der Valenzelektronen. Schalen: " + sh.join(", ") + ", also " + v + ". Hauptgruppe.", "Gruppe");
    }],
    3: [(lv, G) => {
      // hydrogen and boron left out: H+ has no shell left, boron hardly forms simple ions
      const el = G.pick(EL.filter((x) => x[2] > 2 && x[2] !== 5 && ionCharge(x[2]) !== 0)), q = ionCharge(el[2]);
      const wrong = [-3, -2, -1, 1, 2, 3].filter((x) => x !== q).map((x) => ({ md: "$\\mathrm{" + el[0] + "}" + sup(x) + "$", why: "So erreicht " + el[1] + " keine Edelgaskonfiguration." }));
      const why = el[1] + " hat " + valence(el[2]) + " Valenzelektronen. " + (q > 0 ? "Es gibt " + q + " ab" : "Es nimmt " + -q + " auf") + " und erreicht so die Elektronenhülle eines Edelgases.";
      return { type: "choice", md: "Welches Ion bildet " + el[1] + " (Z = " + el[2] + ") bevorzugt?", options: G.options({ md: "$\\mathrm{" + el[0] + "}" + sup(q) + "$", why }, G.shuffle(wrong)), explain: why };
    }, (lv, G) => {
      const el = G.pick(EL.filter((x) => x[2] > 2 && x[2] !== 5 && ionCharge(x[2]) !== 0)), q = ionCharge(el[2]), e = el[2] - q;
      return num(G, e, 0, "Wie viele Elektronen hat das Ion $\\mathrm{" + el[0] + "}" + sup(q) + "$ (Z = " + el[2] + ")?",
        (q > 0 ? "Ein Kation hat " + q + " Elektron" + (q > 1 ? "en" : "") + " weniger" : "Ein Anion hat " + -q + " Elektron" + (q < -1 ? "en" : "") + " mehr") + " als Protonen: $" + el[2] + (q > 0 ? " - " + q : " + " + -q) + " = " + e + "$.", "Elektronen");
    }],
    4: [(lv, G) => {
      const iso = G.pick([["Chlor", 35, 37, 75.8], ["Bor", 10, 11, 19.9], ["Lithium", 6, 7, 7.6], ["Kupfer", 63, 65, 69.2], ["Brom", 79, 81, 50.7]]);
      const m = (iso[1] * iso[3] + iso[2] * (100 - iso[3])) / 100;
      return num(G, m, 2, iso[0] + " besteht zu $" + T(G, iso[3], 1) + "\\,\\%$ aus dem Isotop mit der Massenzahl " + iso[1] + " und sonst aus dem mit " + iso[2] + ". Wie groß ist die mittlere Atommasse (in u, Isotopenmassen gleich den Massenzahlen)?",
        "Gewichtetes Mittel: $" + iso[1] + " \\cdot " + T(G, iso[3] / 100, 3) + " + " + iso[2] + " \\cdot " + T(G, 1 - iso[3] / 100, 3) + " \\approx " + T(G, m, 2) + "$ u.", "u");
    }, (lv, G) => {
      const gas = G.pick([[10, "Neon"], [18, "Argon"]]);
      const iso = EL.filter((x) => ionCharge(x[2]) !== 0 && x[2] - ionCharge(x[2]) === gas[0]);
      const others = EL.filter((x) => x[2] > 2 && x[2] !== 5 && ionCharge(x[2]) !== 0 && x[2] - ionCharge(x[2]) !== gas[0]);
      const pickR = G.pickN(iso, Math.min(2, iso.length)), pickW = G.pickN(others, 2);
      const opts = G.shuffle(pickR.map((x) => ({ md: "$\\mathrm{" + x[0] + "}" + sup(ionCharge(x[2])) + "$", correct: true, why: x[2] - ionCharge(x[2]) + " Elektronen, wie " + gas[1] + "." }))
        .concat(pickW.map((x) => ({ md: "$\\mathrm{" + x[0] + "}" + sup(ionCharge(x[2])) + "$", why: x[2] - ionCharge(x[2]) + " Elektronen, nicht " + gas[0] + "." }))));
      return { type: "multi", md: "Welche Ionen haben genauso viele Elektronen wie ein " + gas[1] + "-Atom (" + gas[0] + ")?", options: opts,
        explain: "Isoelektronisch mit " + gas[1] + " sind Ionen mit " + gas[0] + " Elektronen: Ordnungszahl minus Ladung gleich " + gas[0] + "." };
    }],
  });
  LW.extend("che-atombau", F.statements([
    { lv: 1, ok: true, md: "Die Ordnungszahl gibt die Zahl der Protonen im Kern an.", why: "Sie legt fest, um welches Element es sich handelt." },
    { lv: 1, ok: false, md: "Isotope eines Elements haben unterschiedlich viele Protonen.", why: "Isotope unterscheiden sich in der Neutronenzahl; die Protonenzahl ist gleich." },
    { lv: 1, ok: true, md: "Fast die ganze Masse eines Atoms steckt im Kern.", why: "Protonen und Neutronen sind rund 1800-mal schwerer als Elektronen." },
    { lv: 2, ok: true, md: "Elemente einer Hauptgruppe haben gleich viele Valenzelektronen.", why: "Deshalb ähneln sie sich chemisch." },
    { lv: 2, ok: false, md: "Die L-Schale kann höchstens 2 Elektronen aufnehmen.", why: "Die K-Schale fasst 2, die L-Schale 8 Elektronen." },
    { lv: 3, ok: true, md: "Metallatome geben Valenzelektronen ab und werden zu Kationen.", why: "Mit wenigen Außenelektronen ist Abgeben der kürzere Weg zur Edelgaskonfiguration." },
    { lv: 3, ok: false, md: "Ein Chloridion ist größer geladen als ein Sulfidion.", why: "$\\mathrm{Cl^-}$ trägt eine, $\\mathrm{S^{2-}}$ zwei negative Ladungen." },
    { lv: 4, ok: true, md: "$\\mathrm{Na^+}$, $\\mathrm{Mg^{2+}}$ und $\\mathrm{F^-}$ haben dieselbe Elektronenzahl.", why: "Alle haben 10 Elektronen, wie Neon." },
    { lv: 4, ok: false, md: "Ein Atom wird zum Ion, indem sein Kern Protonen abgibt.", why: "Bei Ionenbildung ändern sich nur die Elektronen; der Kern bleibt unverändert." },
  ], STMT));

  // ================================================================ bonding and electronegativity
  const EN = EL.filter((x) => x[4] != null);
  const kind = (dEN) => (dEN < 0.5 ? "unpolare Elektronenpaarbindung" : dEN <= 1.7 ? "polare Elektronenpaarbindung" : "Ionenbindung");
  const KINDS = ["unpolare Elektronenpaarbindung", "polare Elektronenpaarbindung", "Ionenbindung"];
  const PAIRS = [["H", "H"], ["Cl", "Cl"], ["C", "H"], ["H", "Cl"], ["O", "H"], ["N", "H"], ["C", "O"], ["H", "F"], ["Na", "Cl"], ["K", "F"], ["Mg", "O"], ["Ca", "O"], ["Li", "F"], ["C", "Cl"], ["S", "H"], ["Al", "Cl"]];
  const enOf = (sym) => EN.find((x) => x[0] === sym);
  gen("che-bindung", "Bindung und Elektronegativität", {
    1: [(lv, G) => {
      const [a, b] = G.pick(PAIRS), A = enOf(a), B = enOf(b), dEN = Math.abs(A[4] - B[4]);
      return num(G, dEN, 1, "Elektronegativität: " + A[1] + " $" + T(G, A[4], 1) + "$, " + B[1] + " $" + T(G, B[4], 1) + "$. Wie groß ist die Differenz $\\Delta EN$ in der Bindung " + a + "–" + b + "?",
        "$\\Delta EN = \\abs{" + T(G, A[4], 1) + " - " + T(G, B[4], 1) + "} = " + T(G, dEN, 1) + "$.");
    }],
    2: [(lv, G) => {
      const pool = PAIRS.filter(([a, b]) => { const x = Math.abs(enOf(a)[4] - enOf(b)[4]); return x < 0.4 || (x > 0.6 && x < 1.6) || x > 1.8; });
      const [a, b] = G.pick(pool), A = enOf(a), B = enOf(b), dEN = Math.abs(A[4] - B[4]), right = kind(dEN);
      const why = "$\\Delta EN = " + T(G, dEN, 1) + "$. Faustregel: unter 0,5 unpolar, 0,5 bis 1,7 polar, darüber überwiegend ionisch.";
      return { type: "choice", md: "Welche Bindung liegt zwischen " + A[1] + " ($EN = " + T(G, A[4], 1) + "$) und " + B[1] + " ($EN = " + T(G, B[4], 1) + "$) vor?",
        options: KINDS.map((k) => ({ md: k, correct: k === right, why: k === right ? null : why })), explain: why };
    }],
    3: [(lv, G) => {
      const [a, b] = G.pick(PAIRS.filter(([x, y]) => { const dd = Math.abs(enOf(x)[4] - enOf(y)[4]); return dd > 0.3 && dd <= 1.7; }));
      const A = enOf(a), B = enOf(b), neg = A[4] > B[4] ? A : B, pos = neg === A ? B : A;
      const why = neg[1] + " ist elektronegativer (" + T(G, neg[4], 1).replace("{,}", ",") + " gegen " + T(G, pos[4], 1).replace("{,}", ",") + ") und zieht das bindende Elektronenpaar stärker an sich.";
      return { type: "choice", md: "In der polaren Bindung " + a + "–" + b + ": Welches Atom trägt die negative Teilladung $\\delta^-$?",
        options: [{ md: neg[1], correct: true, why }, { md: pos[1], why }, { md: "keines, die Bindung ist unpolar", why }], explain: why };
    }, (lv, G) => {
      const mols = G.pick([
        ["$\\mathrm{CO_2}$", false, "Die beiden polaren C=O-Bindungen liegen auf einer Geraden; ihre Dipole heben sich auf."],
        ["$\\mathrm{H_2O}$", true, "Das Molekül ist gewinkelt; die Dipole der O–H-Bindungen addieren sich."],
        ["$\\mathrm{CH_4}$", false, "Die C–H-Bindungen sind kaum polar und tetraedrisch symmetrisch angeordnet."],
        ["$\\mathrm{NH_3}$", true, "Die Pyramidenform mit freiem Elektronenpaar ergibt einen Dipol."],
        ["$\\mathrm{CCl_4}$", false, "Vier polare Bindungen in Tetraedersymmetrie: Die Dipole heben sich auf."],
        ["$\\mathrm{HCl}$", true, "Eine einzige polare Bindung, also ein Dipolmolekül."],
      ]);
      return { type: "truefalse", md: mols[0] + " ist ein Dipolmolekül.", answer: mols[1], whyNot: mols[2], explain: mols[2] };
    }],
    4: [(lv, G) => {
      const sets = [[["H", "F"], ["H", "Cl"], ["C", "H"], ["H", "H"]], [["Na", "Cl"], ["O", "H"], ["N", "H"], ["C", "H"]], [["Li", "F"], ["Mg", "O"], ["H", "Cl"], ["S", "H"]], [["K", "F"], ["C", "O"], ["C", "Cl"], ["Cl", "Cl"]]];
      const set = G.pick(sets).slice().sort((p, q) => Math.abs(enOf(q[0])[4] - enOf(q[1])[4]) - Math.abs(enOf(p[0])[4] - enOf(p[1])[4]));
      const lab = (p) => p[0] + "–" + p[1] + " ($\\Delta EN = " + T(G, Math.abs(enOf(p[0])[4] - enOf(p[1])[4]), 1) + "$)";
      return { type: "order", md: "Ordne die Bindungen von der stärksten Polarität zur schwächsten.", items: set.map(lab),
        explain: "Je größer $\\Delta EN$, desto polarer die Bindung; ab etwa 1,7 überwiegt der ionische Charakter." };
    }, (lv, G) => {
      const c = G.pick([
        ["Wasser siedet bei 100 °C, Schwefelwasserstoff schon bei −60 °C.", "Wasserstoffbrücken zwischen den Wassermolekülen", "Zwischen H₂O-Molekülen bilden sich Wasserstoffbrücken, zwischen H₂S-Molekülen kaum."],
        ["Methan siedet bei −162 °C, obwohl seine Moleküle so leicht sind wie Wasser.", "nur schwache Van-der-Waals-Kräfte", "Methan ist unpolar; es wirken nur schwache Van-der-Waals-Kräfte."],
        ["Kochsalz schmilzt erst bei 801 °C.", "Ionenbindung im Gitter", "Im Ionengitter halten starke elektrostatische Kräfte die Ionen zusammen."],
        ["Chlorwasserstoff löst sich gut in Wasser.", "polare Moleküle in einem polaren Lösungsmittel", "Ähnliches löst sich in Ähnlichem: Dipole lösen sich in Dipolen."],
      ]);
      const all = ["Wasserstoffbrücken zwischen den Wassermolekülen", "nur schwache Van-der-Waals-Kräfte", "Ionenbindung im Gitter", "polare Moleküle in einem polaren Lösungsmittel"];
      return { type: "choice", md: c[0] + " Woran liegt das?", options: G.options({ md: c[1], why: c[2] }, G.shuffle(all.filter((x) => x !== c[1])).map((x) => ({ md: x, why: c[2] }))), explain: c[2] };
    }],
  });
  LW.extend("che-bindung", F.statements([
    { lv: 1, ok: true, md: "Elektronegativität beschreibt, wie stark ein Atom bindende Elektronen anzieht.", why: "So ist sie definiert; Fluor hat mit 4,0 den höchsten Wert." },
    { lv: 1, ok: false, md: "In einer Ionenbindung teilen sich zwei Atome ein Elektronenpaar.", why: "Bei der Ionenbindung gehen Elektronen über; geteilt werden sie bei der Elektronenpaarbindung." },
    { lv: 2, ok: true, md: "Zwischen gleichen Atomen ist die Bindung unpolar.", why: "$\\Delta EN = 0$: Das Elektronenpaar liegt genau in der Mitte." },
    { lv: 2, ok: false, md: "Ein Molekül mit polaren Bindungen ist immer ein Dipol.", why: "Bei symmetrischem Bau wie in $\\mathrm{CO_2}$ heben sich die Teildipole auf." },
    { lv: 3, ok: true, md: "Wasserstoffbrücken bilden sich zwischen einem H an N, O oder F und einem freien Elektronenpaar.", why: "Das stark positivierte H wird vom freien Elektronenpaar eines Nachbarmoleküls angezogen." },
    { lv: 3, ok: false, md: "Van-der-Waals-Kräfte sind stärker als Ionenbindungen.", why: "Sie sind die schwächsten zwischenmolekularen Kräfte." },
    { lv: 4, ok: true, md: "Je größer die Differenz der Elektronegativitäten, desto ionischer die Bindung.", why: "Das bindende Elektronenpaar rückt immer weiter zum elektronegativeren Partner." },
    { lv: 4, ok: false, md: "Die Grenze zwischen polarer und ionischer Bindung liegt scharf bei $\\Delta EN = 1{,}7$.", why: "Der Übergang ist fließend; 1,7 ist nur eine Faustregel." },
  ], STMT));

  // ================================================================ acids, bases and pH
  gen("che-ph", "Säuren und pH-Wert", {
    1: [(lv, G) => {
      const n = G.int(1, 6), acid = G.pick(["Salzsäure", "Salpetersäure"]);
      return num(G, n, 0, "Eine " + acid + " hat die Konzentration $c = 10^{-" + n + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie (starke Säure, vollständig protolysiert)?",
        "Starke Säure: $c(\\mathrm{H_3O^+}) = c_0 = 10^{-" + n + "}$. $\\mathrm{pH} = -\\lg c(\\mathrm{H_3O^+}) = " + n + "$.");
    }, (lv, G) => {
      const n = G.int(1, 5);
      return num(G, 14 - n, 0, "Eine Natronlauge hat $c(\\mathrm{OH^-}) = 10^{-" + n + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie (25 °C)?",
        "$\\mathrm{pOH} = " + n + "$ und $\\mathrm{pH} = 14 - \\mathrm{pOH} = " + (14 - n) + "$.");
    }],
    2: [(lv, G) => {
      const a = G.pick([2, 3, 5, 8]), n = G.int(1, 4), c = a * Math.pow(10, -n), pH = -Math.log10(c);
      return num(G, pH, 2, "Salzsäure mit $c = " + a + " \\cdot 10^{-" + n + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie?",
        "$\\mathrm{pH} = -\\lg(" + a + " \\cdot 10^{-" + n + "}) = " + n + " - \\lg " + a + " \\approx " + T(G, pH, 2) + "$.");
    }, (lv, G) => {
      const a = G.pick([2, 4, 5]), n = G.int(1, 3), c = a * Math.pow(10, -n), pH = 14 + Math.log10(c);
      return num(G, pH, 2, "Kalilauge mit $c(\\mathrm{OH^-}) = " + a + " \\cdot 10^{-" + n + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie (25 °C)?",
        "$\\mathrm{pOH} = -\\lg(" + a + " \\cdot 10^{-" + n + "}) \\approx " + T(G, 14 - pH, 2) + "$, also $\\mathrm{pH} = 14 - \\mathrm{pOH} \\approx " + T(G, pH, 2) + "$.");
    }],
    3: [(lv, G) => {
      const pH0 = G.int(1, 3), k = G.pick([10, 100, 1000]);
      return num(G, pH0 + Math.log10(k), 0, "Eine starke Säure mit pH " + pH0 + " wird mit Wasser auf das " + k + "-fache Volumen verdünnt. Welchen pH-Wert hat sie danach?",
        "Die Konzentration sinkt auf $\\tfrac{1}{" + k + "}$, also steigt der pH um $\\lg " + k + " = " + Math.log10(k) + "$: pH " + (pH0 + Math.log10(k)) + ".");
    }, (lv, G) => {
      const pH = G.pick([2.5, 3.5, 4.2, 5.7, 1.3]), c = Math.pow(10, -pH), mant = c / Math.pow(10, Math.floor(Math.log10(c))), ex = Math.floor(Math.log10(c));
      return num(G, mant, 2, "Eine Lösung hat pH " + G.fmt(pH, 1) + ". Es ist $c(\\mathrm{H_3O^+}) = x \\cdot 10^{" + ex + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Bestimme $x$.",
        "$c = 10^{-\\mathrm{pH}} = 10^{-" + T(G, pH, 1) + "} \\approx " + T(G, mant, 2) + " \\cdot 10^{" + ex + "}$.");
    }, (lv, G) => {
      const V = G.pick([10, 20, 25, 50]), c = G.pick([0.1, 0.05, 0.2]), cb = G.pick([0.1, 0.2]), Ve = V * c / cb;
      return num(G, Ve, 1, "$" + V + "\\,\\mathrm{mL}$ Salzsäure ($c = " + T(G, c, 2) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$) werden mit Natronlauge ($c = " + T(G, cb, 1) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$) titriert. Wie viel Lauge wird bis zum Äquivalenzpunkt gebraucht (in mL)?",
        "Am Äquivalenzpunkt gilt $n(\\mathrm{OH^-}) = n(\\mathrm{H_3O^+}) = " + T(G, V * c, 2) + "\\,\\mathrm{mmol}$. $V = \\tfrac{n}{c} = \\tfrac{" + T(G, V * c, 2) + "}{" + T(G, cb, 1) + "}\\,\\mathrm{mL} = " + T(G, Ve, 1) + "\\,\\mathrm{mL}$.", "mL");
    }],
    4: [(lv, G) => {
      const acid = G.pick([["Essigsäure", 4.75], ["Ameisensäure", 3.75], ["Benzoesäure", 4.2], ["Propansäure", 4.87]]), c = G.pick([0.1, 0.01, 0.5, 1]);
      const pH = 0.5 * (acid[1] - Math.log10(c));
      return num(G, pH, 2, acid[0] + " ($\\mathrm{p}K_S = " + T(G, acid[1], 2) + "$) hat die Konzentration $" + T(G, c, 2) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie? (Näherung für schwache Säuren)",
        "Schwache Säure: $\\mathrm{pH} \\approx \\tfrac12\\left(\\mathrm{p}K_S - \\lg c_0\\right) = \\tfrac12\\left(" + T(G, acid[1], 2) + " - (" + T(G, Math.log10(c), 2) + ")\\right) \\approx " + T(G, pH, 2) + "$.");
    }, (lv, G) => {
      const pKs = G.pick([4.75, 7.2, 9.25]), r = G.pick([0.1, 0.5, 2, 10]), pH = pKs + Math.log10(r);
      const name = { 4.75: "Essigsäure/Acetat", 7.2: "Dihydrogenphosphat/Hydrogenphosphat", 9.25: "Ammonium/Ammoniak" }[pKs];
      return num(G, pH, 2, "Ein Puffer aus " + name + " ($\\mathrm{p}K_S = " + T(G, pKs, 2) + "$) enthält die Base und die Säure im Verhältnis $" + T(G, r, 1) + " : 1$. Welchen pH-Wert hat er?",
        "Henderson-Hasselbalch: $\\mathrm{pH} = \\mathrm{p}K_S + \\lg\\tfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})} = " + T(G, pKs, 2) + " + \\lg " + T(G, r, 1) + " \\approx " + T(G, pH, 2) + "$.");
    }],
  });
  LW.extend("che-ph", F.statements([
    { lv: 1, ok: true, md: "Nach Brønsted ist eine Säure ein Protonendonator.", why: "Sie gibt ein $\\mathrm{H^+}$ ab, eine Base nimmt es auf." },
    { lv: 1, ok: false, md: "Je kleiner der pH-Wert, desto basischer die Lösung.", why: "Kleiner pH heißt viele Oxoniumionen, also sauer." },
    { lv: 2, ok: true, md: "Wasser kann als Säure und als Base reagieren.", why: "Wasser ist ein Ampholyt: Es gibt Protonen ab ($\\mathrm{OH^-}$) oder nimmt sie auf ($\\mathrm{H_3O^+}$)." },
    { lv: 2, ok: false, md: "Verdünnt man eine Säure auf das Zehnfache, halbiert sich ihr pH-Wert.", why: "Der pH steigt um 1, weil die Skala logarithmisch ist." },
    { lv: 3, ok: true, md: "Bei 25 °C gilt in jeder wässrigen Lösung $\\mathrm{pH} + \\mathrm{pOH} = 14$.", why: "Das folgt aus dem Ionenprodukt $K_W = 10^{-14}\\,\\tfrac{\\mathrm{mol}^2}{\\mathrm{L}^2}$." },
    { lv: 3, ok: false, md: "Am Äquivalenzpunkt einer Titration von Essigsäure mit Natronlauge ist der pH-Wert genau 7.", why: "Das entstandene Acetat ist eine schwache Base; der Äquivalenzpunkt liegt im Basischen." },
    { lv: 4, ok: true, md: "Ein Puffer hat seine größte Wirkung bei $\\mathrm{pH} = \\mathrm{p}K_S$.", why: "Dann liegen Säure und Base gleich konzentriert vor." },
    { lv: 4, ok: false, md: "Eine Säure mit größerem $\\mathrm{p}K_S$ ist stärker.", why: "Umgekehrt: Je kleiner $\\mathrm{p}K_S$, desto stärker die Säure." },
  ], STMT));
  LW.extend("che-ph", F.proofs([
    { lv: 3, kind: "direkt", given: "Ionenprodukt des Wassers bei 25 °C: $c(\\mathrm{H_3O^+}) \\cdot c(\\mathrm{OH^-}) = 10^{-14}\\,\\tfrac{\\mathrm{mol}^2}{\\mathrm{L}^2}$.", claim: "$\\mathrm{pH} + \\mathrm{pOH} = 14$.",
      idea: "Den negativen dekadischen Logarithmus auf beide Seiten anwenden.",
      steps: [
        s("$c(\\mathrm{H_3O^+}) \\cdot c(\\mathrm{OH^-}) = 10^{-14}$.", "Ionenprodukt des Wassers"),
        s("$-\\lg\\left(c(\\mathrm{H_3O^+}) \\cdot c(\\mathrm{OH^-})\\right) = 14$.", "Logarithmieren"),
        s("$-\\lg c(\\mathrm{H_3O^+}) - \\lg c(\\mathrm{OH^-}) = 14$.", "Logarithmengesetz"),
        s("Also $\\mathrm{pH} + \\mathrm{pOH} = 14$.", "Definition von pH und pOH"),
      ],
      distractors: [
        d("$-\\lg\\left(c(\\mathrm{H_3O^+}) \\cdot c(\\mathrm{OH^-})\\right) = -\\lg c(\\mathrm{H_3O^+}) \\cdot (-\\lg c(\\mathrm{OH^-}))$.", "Der Logarithmus eines Produkts ist die Summe der Logarithmen."),
        d("$c(\\mathrm{H_3O^+}) + c(\\mathrm{OH^-}) = 10^{-14}$.", "Das Ionenprodukt ist ein Produkt, keine Summe."),
      ],
      flaw: { line: 2, md: "$-\\lg c(\\mathrm{H_3O^+}) \\cdot \\left(-\\lg c(\\mathrm{OH^-})\\right) = 14$.", why: "$\\lg(a \\cdot b) = \\lg a + \\lg b$: Aus dem Produkt wird eine Summe." } },
    { lv: 4, kind: "direkt", given: "Für ein Säure-Base-Paar gilt $K_S = \\dfrac{c(\\mathrm{H_3O^+}) \\cdot c(\\mathrm{A^-})}{c(\\mathrm{HA})}$.", claim: "$\\mathrm{pH} = \\mathrm{p}K_S + \\lg\\dfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}$ (Henderson-Hasselbalch).",
      idea: "Nach $c(\\mathrm{H_3O^+})$ auflösen und den negativen Logarithmus nehmen.",
      steps: [
        s("$c(\\mathrm{H_3O^+}) = K_S \\cdot \\dfrac{c(\\mathrm{HA})}{c(\\mathrm{A^-})}$.", "Umformen"),
        s("$-\\lg c(\\mathrm{H_3O^+}) = -\\lg K_S - \\lg \\dfrac{c(\\mathrm{HA})}{c(\\mathrm{A^-})}$.", "Logarithmengesetz"),
        s("$\\mathrm{pH} = \\mathrm{p}K_S - \\lg \\dfrac{c(\\mathrm{HA})}{c(\\mathrm{A^-})}$.", "Definition von pH und pOH"),
        s("$\\mathrm{pH} = \\mathrm{p}K_S + \\lg \\dfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}$.", "Logarithmengesetz", "$-\\lg\\tfrac{a}{b} = \\lg\\tfrac{b}{a}$."),
      ],
      distractors: [
        d("$c(\\mathrm{H_3O^+}) = K_S \\cdot \\dfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}$.", "Beim Auflösen kommt der Bruch umgekehrt: $\\tfrac{c(\\mathrm{HA})}{c(\\mathrm{A^-})}$."),
        d("$\\mathrm{pH} = \\mathrm{p}K_S \\cdot \\lg \\dfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}$.", "Der Logarithmus macht aus dem Produkt eine Summe."),
      ],
      flaw: { line: 0, md: "$c(\\mathrm{H_3O^+}) = K_S \\cdot \\dfrac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}$.", why: "Aus $K_S = \\tfrac{c(\\mathrm{H_3O^+}) c(\\mathrm{A^-})}{c(\\mathrm{HA})}$ folgt $c(\\mathrm{H_3O^+}) = K_S \\tfrac{c(\\mathrm{HA})}{c(\\mathrm{A^-})}$." } },
  ], DERIV, { reasons: ["Ionenprodukt des Wassers", "Logarithmieren", "Logarithmengesetz", "Definition von pH und pOH", "Umformen", "Massenwirkungsgesetz", "Le Chatelier"] }));

  // ================================================================ equilibrium
  gen("che-gleichgewicht", "Chemisches Gleichgewicht", {
    1: [(lv, G) => {
      const c = G.pick([
        ["Die Hinreaktion ist exotherm. Die Temperatur wird erhöht.", "zu den Edukten", "Wärme wirkt wie ein Produkt der exothermen Reaktion; Zufuhr begünstigt die Rückreaktion."],
        ["Die Hinreaktion ist endotherm. Die Temperatur wird erhöht.", "zu den Produkten", "Die endotherme Richtung verbraucht die zugeführte Wärme."],
        ["Ein Edukt wird zugegeben.", "zu den Produkten", "Das System baut den Überschuss ab, indem mehr Produkt entsteht."],
        ["Ein Produkt wird laufend entfernt.", "zu den Produkten", "Was fehlt, wird nachgebildet."],
        ["Ein Katalysator wird zugegeben.", "keine Verschiebung", "Ein Katalysator beschleunigt Hin- und Rückreaktion gleich; das Gleichgewicht stellt sich nur schneller ein."],
        ["$\\mathrm{N_2 + 3\\,H_2 \\rightleftharpoons 2\\,NH_3}$ (alle gasförmig): Der Druck wird erhöht.", "zu den Produkten", "Rechts stehen 2, links 4 Gasteilchen; höherer Druck begünstigt die Seite mit weniger Teilchen."],
        ["$\\mathrm{H_2 + I_2 \\rightleftharpoons 2\\,HI}$ (alle gasförmig): Der Druck wird erhöht.", "keine Verschiebung", "Auf beiden Seiten stehen 2 Gasteilchen; der Druck verschiebt nichts."],
      ]);
      return { type: "choice", md: "Gleichgewicht nach Le Chatelier: " + c[0] + " Wohin verschiebt sich das Gleichgewicht?",
        options: ["zu den Produkten", "zu den Edukten", "keine Verschiebung"].map((o) => ({ md: o, correct: o === c[1], why: o === c[1] ? null : c[2] })), explain: c[2] };
    }],
    2: [(lv, G) => {
      const a = G.pick([0.1, 0.2, 0.5, 1]), b = G.pick([0.2, 0.4, 0.5]), cc = G.pick([0.5, 1, 2]), dd = G.pick([0.5, 1, 1.5]), K = cc * dd / (a * b);
      return num(G, K, 2, "$\\mathrm{A + B \\rightleftharpoons C + D}$. Im Gleichgewicht sind $c(\\mathrm{A}) = " + T(G, a, 1) + "$, $c(\\mathrm{B}) = " + T(G, b, 1) + "$, $c(\\mathrm{C}) = " + T(G, cc, 1) + "$ und $c(\\mathrm{D}) = " + T(G, dd, 1) + "$ (je mol/L). Bestimme $K_c$.",
        "$K_c = \\dfrac{c(\\mathrm{C}) \\cdot c(\\mathrm{D})}{c(\\mathrm{A}) \\cdot c(\\mathrm{B})} = \\dfrac{" + T(G, cc, 1) + " \\cdot " + T(G, dd, 1) + "}{" + T(G, a, 1) + " \\cdot " + T(G, b, 1) + "} = " + T(G, K, 2) + "$.");
    }, (lv, G) => {
      const a = G.pick([0.1, 0.2, 0.4]), bb = G.pick([0.2, 0.3, 0.6]), K = bb / (a * a);
      return num(G, K, 2, "$\\mathrm{2\\,NO_2 \\rightleftharpoons N_2O_4}$. Im Gleichgewicht: $c(\\mathrm{NO_2}) = " + T(G, a, 1) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$, $c(\\mathrm{N_2O_4}) = " + T(G, bb, 1) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Bestimme $K_c$ (in L/mol).",
        "Der Koeffizient 2 wird zum Exponenten: $K_c = \\dfrac{c(\\mathrm{N_2O_4})}{c(\\mathrm{NO_2})^2} = \\dfrac{" + T(G, bb, 1) + "}{" + T(G, a, 1) + "^2} = " + T(G, K, 2) + "\\,\\tfrac{\\mathrm{L}}{\\mathrm{mol}}$.", "L/mol");
    }],
    3: [(lv, G) => {
      const K = G.pick([0.5, 1, 2, 3, 4, 9]), c0 = G.pick([0.5, 1, 2]), cB = K * c0 / (1 + K);
      return num(G, cB, 3, "Für $\\mathrm{A \\rightleftharpoons B}$ ist $K_c = " + T(G, K, 1) + "$. Man startet mit $c_0(\\mathrm{A}) = " + T(G, c0, 1) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$ und ohne B. Welche Konzentration hat B im Gleichgewicht (in mol/L)?",
        "Mit $x = c(\\mathrm{B})$: $K = \\tfrac{x}{c_0 - x} \\Rightarrow x = \\tfrac{K c_0}{1 + K} = \\tfrac{" + T(G, K, 1) + " \\cdot " + T(G, c0, 1) + "}{" + T(G, 1 + K, 1) + "} \\approx " + T(G, cB, 3) + "\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$.", "mol/L");
    }, (lv, G) => {
      const Q = G.pick([0.5, 2, 8, 20]), K = G.pick([1, 4, 10]);
      const right = Q < K ? "zu den Produkten" : "zu den Edukten";
      const why = "Der Reaktionsquotient $Q = " + T(G, Q, 1) + "$ ist " + (Q < K ? "kleiner" : "größer") + " als $K = " + K + "$. Das System läuft so lange " + right + ", bis $Q = K$.";
      return { type: "choice", md: "Für eine Reaktion ist $K_c = " + K + "$. Ein Gemisch hat den Reaktionsquotienten $Q = " + T(G, Q, 1) + "$. In welche Richtung läuft die Reaktion?",
        options: ["zu den Produkten", "zu den Edukten", "gar nicht, es ist im Gleichgewicht"].map((o) => ({ md: o, correct: o === right, why: o === right ? null : why })), explain: why };
    }],
    4: [(lv, G) => {
      const a = G.pick([1, 2]), b = G.pick([1, 2, 3]);
      // ester formation with K = 4: x^2 = 4 (a - x)(b - x)  ->  3x^2 - 4(a + b)x + 4ab = 0
      const x = (4 * (a + b) - Math.sqrt(16 * (a + b) * (a + b) - 48 * a * b)) / 6;
      return num(G, x, 2, "Veresterung $\\mathrm{Säure + Alkohol \\rightleftharpoons Ester + Wasser}$ mit $K_c = 4$. Man startet mit " + a + " mol Säure und " + b + " mol Alkohol. Wie viel Ester liegt im Gleichgewicht vor (in mol)?",
        "Mit $x$ mol Ester: $\\tfrac{x^2}{(" + a + " - x)(" + b + " - x)} = 4$, also $3x^2 - " + 4 * (a + b) + "x + " + 4 * a * b + " = 0$. Die physikalisch sinnvolle Lösung (kleiner als " + Math.min(a, b) + ") ist $x \\approx " + T(G, x, 2) + "$ mol." + (a === b ? "" : " Ein Überschuss des einen Edukts treibt die Ausbeute nach oben."), "mol");
    }],
  });
  LW.extend("che-gleichgewicht", F.statements([
    { lv: 1, ok: true, md: "Im chemischen Gleichgewicht laufen Hin- und Rückreaktion weiter, gleich schnell.", why: "Es ist ein dynamisches Gleichgewicht; nur die Konzentrationen bleiben konstant." },
    { lv: 1, ok: false, md: "Im Gleichgewicht sind Edukte und Produkte immer gleich konzentriert.", why: "Gleich sind die Geschwindigkeiten; die Konzentrationen hängen von $K$ ab." },
    { lv: 2, ok: true, md: "Ein Katalysator verschiebt die Lage des Gleichgewichts nicht.", why: "Er senkt die Aktivierungsenergie für Hin- und Rückreaktion gleich." },
    { lv: 2, ok: false, md: "$K_c$ ändert sich, wenn man ein Edukt zugibt.", why: "Das System weicht aus, bis wieder $Q = K$; $K$ selbst hängt nur von der Temperatur ab." },
    { lv: 3, ok: true, md: "Bei einer exothermen Hinreaktion sinkt $K$, wenn die Temperatur steigt.", why: "Wärmezufuhr begünstigt die endotherme Rückreaktion." },
    { lv: 3, ok: false, md: "Ein großes $K$ bedeutet, dass das Gleichgewicht schnell erreicht wird.", why: "$K$ beschreibt die Lage, nicht die Geschwindigkeit." },
    { lv: 4, ok: true, md: "Beim Haber-Bosch-Verfahren begünstigt hoher Druck die Ammoniakbildung.", why: "Aus 4 Gasteilchen werden 2; höherer Druck schiebt zur Seite mit weniger Teilchen." },
    { lv: 4, ok: false, md: "Beim Haber-Bosch-Verfahren arbeitet man bei hoher Temperatur, weil sie die Ausbeute erhöht.", why: "Die Ammoniaksynthese ist exotherm; hohe Temperatur senkt die Ausbeute, man braucht sie wegen der Geschwindigkeit." },
  ], STMT));
  LW.extend("che-gleichgewicht", F.proofs([
    { lv: 3, kind: "direkt", given: "$\\mathrm{A + B \\rightleftharpoons C + D}$ mit $v_{hin} = k_{hin} \\cdot c(\\mathrm{A}) \\cdot c(\\mathrm{B})$ und $v_{rück} = k_{rück} \\cdot c(\\mathrm{C}) \\cdot c(\\mathrm{D})$.", claim: "$K_c = \\dfrac{c(\\mathrm{C}) \\cdot c(\\mathrm{D})}{c(\\mathrm{A}) \\cdot c(\\mathrm{B})} = \\dfrac{k_{hin}}{k_{rück}}$.",
      idea: "Im Gleichgewicht sind beide Geschwindigkeiten gleich; dann die Konstanten auf eine Seite bringen.",
      steps: [
        s("Im Gleichgewicht gilt $v_{hin} = v_{rück}$.", "Definition des Gleichgewichts"),
        s("$k_{hin}\\, c(\\mathrm{A})\\, c(\\mathrm{B}) = k_{rück}\\, c(\\mathrm{C})\\, c(\\mathrm{D})$.", "Einsetzen"),
        s("$\\dfrac{c(\\mathrm{C})\\, c(\\mathrm{D})}{c(\\mathrm{A})\\, c(\\mathrm{B})} = \\dfrac{k_{hin}}{k_{rück}}$.", "Umformen"),
        s("Die rechte Seite ist bei fester Temperatur konstant: Das ist $K_c$.", "Massenwirkungsgesetz"),
      ],
      distractors: [
        d("Im Gleichgewicht ist $v_{hin} = v_{rück} = 0$.", "Beide Reaktionen laufen weiter, nur gleich schnell."),
        d("$\\dfrac{c(\\mathrm{C})\\, c(\\mathrm{D})}{c(\\mathrm{A})\\, c(\\mathrm{B})} = \\dfrac{k_{rück}}{k_{hin}}$.", "Beim Umformen kommt $k_{hin}$ in den Zähler."),
      ],
      flaw: { line: 0, md: "Im Gleichgewicht kommen beide Reaktionen zum Stillstand: $v_{hin} = v_{rück} = 0$.", why: "Das Gleichgewicht ist dynamisch. Gleich sind die Geschwindigkeiten, nicht null." } },
  ], DERIV, { reasons: ["Definition des Gleichgewichts", "Einsetzen", "Umformen", "Massenwirkungsgesetz", "Le Chatelier", "Logarithmengesetz", "Katalyse"] }));
})();
