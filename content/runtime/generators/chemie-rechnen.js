// Calculation and recognition tasks for the chemistry course (Abitur Hessen), on the engine of physik-rechnen.js:
// che-rechnen with params.typ, levels as there (compute, everyday units, backwards, proportionality).
// Recognition types (oxidation numbers, IUPAC names, isomers, stereocentres, cell voltages) are generated directly.
(function () {
  const T = {};
  const spec = (id, s) => { T[id] = s; };
  const H = LW.rechenHelpers;
  const CVM = "Vₘ = 24,0 L/mol (20 °C, 1013 hPa)", CF = "F = 96 485 C/mol";

  spec("stoffmenge", { ctx: "Eine Stoffportion hat die Masse $m$; die molare Masse des Stoffs ist $M$.",
    v: { m: ["m", "Masse", "g", 1, 200, 1, 1e-3, "mg", 1e-6], M: ["M", "molare Masse", "g/mol", 18, 200, 1, 1e-3] },
    o: { n: ["n", "Stoffmenge", "mol", 3, 1, (x) => x.m / x.M] }, tex: { n: "n = \\frac{m}{M}" }, inv: { m: "m = n \\cdot M", M: "M = \\frac{m}{n}" } });
  spec("konzentration", { ctx: "Eine Stoffportion der Masse $m$ (molare Masse $M$) wird zu einer Lösung mit dem Volumen $V$ gelöst.",
    v: { m: ["m", "Masse des gelösten Stoffs", "g", 0.5, 50, 1, 1e-3, "mg", 1e-6], M: ["M", "molare Masse", "g/mol", 30, 200, 1, 1e-3], V: ["V", "Volumen der Lösung", "mL", 50, 1000, 0, 1e-6, "L", 1e-3] },
    o: { c: ["c", "Stoffmengenkonzentration", "mol/L", 3, 1e3, (x) => x.m / x.M / x.V] }, tex: { c: "c = \\frac{n}{V} = \\frac{m}{M \\cdot V}" }, inv: { m: "m = c \\cdot V \\cdot M", V: "V = \\frac{m}{M\\,c}" } });
  spec("verduennung", { ctx: "Aus einer Lösung der Konzentration $c_1$ wird das Volumen $V_1$ entnommen und mit Wasser auf $V_2$ aufgefüllt.",
    v: { c1: ["c_1", "Ausgangskonzentration", "mol/L", 0.1, 2, 2], V1: ["V_1", "entnommenes Volumen", "mL", 5, 100, 0, 1, "L", 1e3], V2: ["V_2", "Endvolumen", "mL", 150, 1000, 0, 1, "L", 1e3] },
    o: { c2: ["c_2", "neue Konzentration", "mol/L", 3, 1, (x) => (x.c1 * x.V1) / x.V2] }, tex: { c2: "c_1 V_1 = c_2 V_2 \\;\\Rightarrow\\; c_2 = \\frac{c_1 V_1}{V_2}" },
    inv: { V1: "V_1 = \\frac{c_2 V_2}{c_1}" }, invKeys: ["V1"], ok: (x) => x.V2 > 1.5 * x.V1 });
  spec("gasvolumen", { ctx: "Ein Gas mit der molaren Masse $M$ hat die Masse $m$.",
    v: { m: ["m", "Masse des Gases", "g", 1, 100, 1, 1, "kg", 1e3], M: ["M", "molare Masse", "g/mol", 2, 71, 1] },
    o: { V: ["V", "Volumen bei 20 °C und Normaldruck", "L", 3, 1, (x) => (x.m / x.M) * 24.0] }, tex: { V: "V = n \\cdot V_m = \\frac{m}{M} V_m" }, inv: { m: "m = \\frac{V}{V_m} M" }, cst: CVM });
  spec("ph-stark", { ctx: "Salzsäure ist eine starke Säure und protolysiert vollständig. Ihre Konzentration ist $c$.",
    v: { c: ["c", "Konzentration", "mmol/L", 0.1, 100, 1, 1e-3, "mol/L", 1] },
    o: { pH: ["\\mathrm{pH}", "pH-Wert", "", 3, 1, (x) => -Math.log10(x.c)] }, tex: { pH: "\\mathrm{pH} = -\\lg c(\\mathrm{H_3O^+}) = -\\lg c_0" }, inv: { c: "c = 10^{-\\mathrm{pH}}\\,\\mathrm{mol/L}" } });
  spec("ph-base", { ctx: "Natronlauge ist eine starke Base; die Konzentration der Hydroxid-Ionen ist $c$ (25 °C).",
    v: { c: ["c", "Konzentration", "mmol/L", 0.1, 100, 1, 1e-3, "mol/L", 1] },
    o: { pH: ["\\mathrm{pH}", "pH-Wert", "", 3, 1, (x) => 14 + Math.log10(x.c)] }, tex: { pH: "\\mathrm{pOH} = -\\lg c(\\mathrm{OH^-}),\\; \\mathrm{pH} = 14 - \\mathrm{pOH}" }, inv: { c: "c = 10^{\\mathrm{pH} - 14}\\,\\mathrm{mol/L}" } });
  spec("ph-schwach", { ctx: "Eine schwache Säure mit dem $\\mathrm{p}K_S$-Wert $\\mathrm{p}K_S$ hat die Ausgangskonzentration $c_0$.",
    v: { pKs: ["\\mathrm{p}K_S", "pKS-Wert", "", 3.5, 6.5, 2], c: ["c_0", "Ausgangskonzentration", "mol/L", 0.01, 1, 2] },
    o: { pH: ["\\mathrm{pH}", "pH-Wert", "", 3, 1, (x) => 0.5 * (x.pKs - Math.log10(x.c))] }, tex: { pH: "\\mathrm{pH} = \\tfrac12\\left(\\mathrm{p}K_S - \\lg c_0\\right)" },
    inv: { pKs: "\\mathrm{p}K_S = 2\\,\\mathrm{pH} + \\lg c_0" }, invKeys: ["pKs"] });
  spec("puffer", { ctx: "Ein Puffer enthält eine schwache Säure HA (Konzentration $c(\\mathrm{HA})$) und ihre korrespondierende Base (Konzentration $c(\\mathrm{A^-})$).",
    v: { pKs: ["\\mathrm{p}K_S", "pKS-Wert", "", 3.5, 9.5, 2], cA: ["c(\\mathrm{A^-})", "Konzentration der Base", "mol/L", 0.05, 0.5, 2], cHA: ["c(\\mathrm{HA})", "Konzentration der Säure", "mol/L", 0.05, 0.5, 2] },
    o: { pH: ["\\mathrm{pH}", "pH-Wert des Puffers", "", 3, 1, (x) => x.pKs + Math.log10(x.cA / x.cHA)] }, tex: { pH: "\\mathrm{pH} = \\mathrm{p}K_S + \\lg\\frac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}" },
    inv: { pKs: "\\mathrm{p}K_S = \\mathrm{pH} - \\lg\\frac{c(\\mathrm{A^-})}{c(\\mathrm{HA})}" }, invKeys: ["pKs"] });
  spec("titration", { ctx: "Eine einprotonige Säure wird mit Natronlauge titriert; der Äquivalenzpunkt ist erreicht nach dem Verbrauch $V_B$.",
    v: { cB: ["c_B", "Konzentration der Natronlauge", "mol/L", 0.05, 0.2, 2], VB: ["V_B", "Verbrauch bis zum Äquivalenzpunkt", "mL", 5, 40, 1], VS: ["V_S", "Volumen der Säureprobe", "mL", 10, 50, 0] },
    o: { cS: ["c_S", "Konzentration der Säure", "mol/L", 3, 1, (x) => (x.cB * x.VB) / x.VS] }, tex: { cS: "c_S V_S = c_B V_B \\;\\Rightarrow\\; c_S = \\frac{c_B V_B}{V_S}" }, inv: { VB: "V_B = \\frac{c_S V_S}{c_B}" } });
  spec("mwg", { ctx: "Für die Veresterung Säure + Alkohol ⇌ Ester + Wasser liegen im Gleichgewicht diese Konzentrationen vor.",
    v: { cS: ["c(\\mathrm{S})", "Säure", "mol/L", 0.1, 1.5, 2], cA: ["c(\\mathrm{A})", "Alkohol", "mol/L", 0.1, 1.5, 2], cE: ["c(\\mathrm{E})", "Ester", "mol/L", 0.2, 2, 2], cW: ["c(\\mathrm{W})", "Wasser", "mol/L", 0.2, 2, 2] },
    o: { K: ["K_c", "Gleichgewichtskonstante", "", 3, 1, (x) => (x.cE * x.cW) / (x.cS * x.cA)] }, tex: { K: "K_c = \\frac{c(\\mathrm{E})\\cdot c(\\mathrm{W})}{c(\\mathrm{S})\\cdot c(\\mathrm{A})}" },
    inv: { cE: "c(\\mathrm{E}) = \\frac{K_c\\,c(\\mathrm{S})\\,c(\\mathrm{A})}{c(\\mathrm{W})}" }, invKeys: ["cE"] });
  spec("nernst", { ctx: "Ein Metall taucht in eine Lösung seiner Ionen der Konzentration $c$ (25 °C).",
    v: { E0: ["E^0", "Standardpotenzial", "V", -0.8, 0.8, 2], z: ["z", "Ladungszahl der Ionen", "", 1, 3, 0], c: ["c", "Ionenkonzentration", "mol/L", 0.001, 0.5, 3] },
    o: { E: ["E", "Elektrodenpotenzial", "V", 3, 1, (x) => x.E0 + (0.059 / x.z) * Math.log10(x.c)] }, tex: { E: "E = E^0 + \\frac{0{,}059\\,\\mathrm{V}}{z}\\lg c(\\mathrm{M^{z+}})" },
    inv: { c: "c = 10^{\\frac{z(E - E^0)}{0{,}059\\,\\mathrm{V}}}" }, invKeys: ["c"], ok: (x) => Math.abs(x.E0 + (0.059 / x.z) * Math.log10(x.c)) > 0.08 });
  spec("konzentrationszelle", { ctx: "Zwei gleiche Metallelektroden tauchen in Lösungen ihrer Ionen mit verschiedenen Konzentrationen $c_1$ und $c_2$ (25 °C).",
    v: { z: ["z", "Ladungszahl der Ionen", "", 1, 2, 0], c1: ["c_1", "größere Konzentration", "mol/L", 0.1, 1, 2], c2: ["c_2", "kleinere Konzentration", "mmol/L", 0.1, 50, 1, 1e-3] },
    o: { dE: ["\\Delta E", "Zellspannung", "mV", 3, 1e-3, (x) => (0.059 / x.z) * Math.log10(x.c1 / x.c2)] }, tex: { dE: "\\Delta E = \\frac{0{,}059\\,\\mathrm{V}}{z}\\lg\\frac{c_1}{c_2}" }, noInv: true });
  spec("geschwindigkeit", { ctx: "Die Konzentration eines Edukts sinkt in der Zeit $\\Delta t$ von $c_1$ auf $c_2$.",
    v: { c1: ["c_1", "Konzentration am Anfang", "mol/L", 0.5, 2, 2], c2: ["c_2", "Konzentration am Ende", "mol/L", 0.05, 0.45, 2], dt: ["\\Delta t", "Zeitspanne", "s", 10, 300, 0, 1, "min", 60] },
    o: { v: ["\\bar{v}", "mittlere Reaktionsgeschwindigkeit", "mmol/(L·s)", 3, 1e-3, (x) => (x.c1 - x.c2) / x.dt] }, tex: { v: "\\bar{v} = -\\frac{\\Delta c}{\\Delta t} = \\frac{c_1 - c_2}{\\Delta t}" }, inv: { dt: "\\Delta t = \\frac{c_1 - c_2}{\\bar{v}}" }, invKeys: ["dt"] });
  spec("rgt", { ctx: "Nach der RGT-Regel steigt die Reaktionsgeschwindigkeit pro 10 K Temperaturerhöhung um einen Faktor $k$ (meist 2 bis 4).",
    v: { v1: ["v_1", "Geschwindigkeit vorher", "mmol/(L·s)", 0.5, 10, 1], dT: ["\\Delta T", "Temperaturerhöhung", "K", 10, 40, 0], f: ["k", "Faktor pro 10 K", "", 2, 3, 0] },
    o: { v2: ["v_2", "Geschwindigkeit nach dem Erwärmen", "mmol/(L·s)", 3, 1, (x) => x.v1 * Math.pow(x.f, x.dT / 10)] }, tex: { v2: "v_2 = v_1 \\cdot k^{\\Delta T / 10\\,\\mathrm{K}}" }, inv: { v1: "v_1 = \\frac{v_2}{k^{\\Delta T/10\\,\\mathrm{K}}}" }, invKeys: ["v1"], noPow: ["f", "dT"] });
  spec("ausbeute", { ctx: "Aus der Eduktmasse $m_E$ (molare Masse $M_E$) entsteht im Stoffmengenverhältnis 1 : 1 ein Produkt (molare Masse $M_P$); erhalten werden $m_P$.",
    v: { mE: ["m_E", "Eduktmasse", "g", 5, 50, 1], ME: ["M_E", "molare Masse des Edukts", "g/mol", 40, 150, 1], MP: ["M_P", "molare Masse des Produkts", "g/mol", 60, 220, 1], mP: ["m_P", "erhaltene Produktmasse", "g", 2, 60, 1] },
    o: { eta: ["\\eta", "Ausbeute", "%", 3, 0.01, (x) => (x.mP / x.MP) / (x.mE / x.ME)] }, tex: { eta: "\\eta = \\frac{n_{real}}{n_{theo}} = \\frac{m_P / M_P}{m_E / M_E}" }, noInv: true,
    ok: (x) => { const e = (x.mP / x.MP) / (x.mE / x.ME); return e > 0.3 && e < 0.97; } });
  spec("atomoekonomie", { ctx: "Eine Synthese liefert das gewünschte Produkt mit der molaren Masse $M_P$; die Edukte haben zusammen die molare Masse $\\sum M_E$ (Koeffizienten berücksichtigt).",
    v: { MP: ["M_P", "molare Masse des Produkts", "g/mol", 50, 300, 1], ME: ["\\sum M_E", "Summe der Eduktmassen", "g/mol", 80, 450, 1] },
    o: { AE: ["AE", "Atomökonomie", "%", 3, 0.01, (x) => x.MP / x.ME] }, tex: { AE: "AE = \\frac{M(\\text{Produkt})}{\\sum M(\\text{Edukte})}" }, noInv: true, ok: (x) => x.MP < 0.95 * x.ME && x.MP > 0.3 * x.ME });
  spec("verseifungszahl", { ctx: "Ein Fett (Triglycerid) hat die molare Masse $M$. Die Verseifungszahl gibt an, wie viel mg KOH ein Gramm Fett verseifen ($M(\\mathrm{KOH}) = 56{,}1$ g/mol).",
    v: { M: ["M", "molare Masse des Fetts", "g/mol", 650, 900, 0] },
    o: { VZ: ["VZ", "Verseifungszahl", "mg KOH/g", 3, 1, (x) => (3 * 56.11 * 1000) / x.M] }, tex: { VZ: "VZ = \\frac{3 \\cdot M(\\mathrm{KOH}) \\cdot 1000}{M(\\text{Fett})}" }, inv: { M: "M = \\frac{3 \\cdot 56{,}1 \\cdot 1000}{VZ}" } });
  spec("iodzahl", { ctx: "Ein Fett mit der molaren Masse $M$ enthält $n$ C=C-Doppelbindungen pro Molekül. Die Iodzahl gibt an, wie viel Gramm Iod 100 g Fett addieren ($M(\\mathrm{I_2}) = 253{,}8$ g/mol).",
    v: { M: ["M", "molare Masse des Fetts", "g/mol", 800, 900, 0], d: ["n", "Zahl der Doppelbindungen", "", 1, 6, 0] },
    o: { IZ: ["IZ", "Iodzahl", "g I₂/100 g", 3, 1, (x) => (x.d * 253.8 * 100) / x.M] }, tex: { IZ: "IZ = \\frac{n \\cdot M(\\mathrm{I_2}) \\cdot 100}{M(\\text{Fett})}" }, inv: { d: "n = \\frac{IZ \\cdot M}{253{,}8 \\cdot 100}" }, invKeys: ["d"] });
  spec("isoelektrisch", { ctx: "Eine Aminosäure ohne saure oder basische Seitenkette hat die $\\mathrm{p}K_S$-Werte $\\mathrm{p}K_{S1}$ (Carboxygruppe) und $\\mathrm{p}K_{S2}$ (Ammoniumgruppe).",
    v: { p1: ["\\mathrm{p}K_{S1}", "pKS der Carboxygruppe", "", 1.8, 2.6, 2], p2: ["\\mathrm{p}K_{S2}", "pKS der Ammoniumgruppe", "", 8.8, 10.6, 2] },
    o: { pI: ["\\mathrm{pI}", "isoelektrischer Punkt", "", 3, 1, (x) => (x.p1 + x.p2) / 2] }, tex: { pI: "\\mathrm{pI} = \\frac{\\mathrm{p}K_{S1} + \\mathrm{p}K_{S2}}{2}" }, inv: { p2: "\\mathrm{p}K_{S2} = 2\\,\\mathrm{pI} - \\mathrm{p}K_{S1}" } });
  spec("faraday", { ctx: "Bei einer Elektrolyse fließt der Strom $I$ für die Zeit $t$; abgeschieden wird ein Metall mit der molaren Masse $M$ aus Ionen der Ladungszahl $z$.",
    v: { I: ["I", "Stromstärke", "A", 0.2, 5, 1, 1, "mA", 1e-3], t: ["t", "Dauer", "min", 5, 120, 0, 60, "h", 3600], z: ["z", "Ladungszahl", "", 1, 3, 0], M: ["M", "molare Masse", "g/mol", 24, 207, 1] },
    o: { m: ["m", "abgeschiedene Masse", "g", 3, 1, (x) => (x.M * x.I * x.t) / (x.z * 96485)] }, tex: { m: "m = \\frac{M \\cdot I \\cdot t}{z \\cdot F}" }, inv: { t: "t = \\frac{m\\,z\\,F}{M\\,I}", I: "I = \\frac{m\\,z\\,F}{M\\,t}" }, cst: CF });
  spec("freie-enthalpie", { ctx: "Für eine Reaktion sind die Reaktionsenthalpie $\\Delta H$ und die Reaktionsentropie $\\Delta S$ bekannt; sie läuft bei der Temperatur $T$ ab.",
    v: { dH: ["\\Delta H", "Reaktionsenthalpie", "kJ/mol", -200, 100, 0], dS: ["\\Delta S", "Reaktionsentropie", "J/(mol·K)", -200, 200, 0, 1e-3], T: ["T", "Temperatur", "K", 273, 1000, 0] },
    o: { dG: ["\\Delta G", "freie Enthalpie", "kJ/mol", 3, 1, (x) => x.dH - x.T * x.dS] }, tex: { dG: "\\Delta G = \\Delta H - T\\,\\Delta S" }, inv: { T: "T = \\frac{\\Delta H - \\Delta G}{\\Delta S}" }, invKeys: ["T"],
    ok: (x) => Math.abs(x.dH - x.T * x.dS) > 5 && Math.abs(x.dS) > 0.02 });
  spec("kalorimetrie", { ctx: "Eine Reaktion in einem Kalorimeter erwärmt die Wassermasse $m_W$ um $\\Delta T$; dabei werden $n$ eines Stoffs umgesetzt ($c_W = 4{,}19$ J/(g·K)).",
    v: { mW: ["m_W", "Masse des Wassers", "g", 100, 500, 0, 1, "kg", 1e3], dT: ["\\Delta T", "Temperaturerhöhung", "K", 2, 20, 1], n: ["n", "umgesetzte Stoffmenge", "mmol", 5, 100, 0, 1e-3, "mol", 1] },
    o: { H: ["\\Delta_r H", "molare Reaktionsenthalpie", "kJ/mol", 3, 1e3, (x) => (-4.19 * x.mW * x.dT) / x.n] }, tex: { H: "Q = c_W\\,m_W\\,\\Delta T,\\quad \\Delta_r H = -\\frac{Q}{n}" }, noInv: true });

  // ---------------------------------------------------------------- recognition tasks
  const choiceStep = (md, right, wrong, explain) => {
    const seen = new Set([right]);
    const opts = [{ md: right, correct: true }];
    wrong.forEach((w) => { if (!seen.has(w) && opts.length < 5) { seen.add(w); opts.push({ md: w }); } });
    return { type: "choice", md, options: opts, explain };
  };
  const OXZ = [["S", "$\\mathrm{H_2SO_4}$", 6], ["Mn", "$\\mathrm{KMnO_4}$", 7], ["Cr", "$\\mathrm{K_2Cr_2O_7}$", 6], ["N", "$\\mathrm{NH_3}$", -3], ["N", "$\\mathrm{HNO_3}$", 5],
    ["N", "$\\mathrm{NO_2}$", 4], ["C", "$\\mathrm{CH_3OH}$", -2], ["C", "$\\mathrm{HCOOH}$", 2], ["C", "$\\mathrm{CO_2}$", 4], ["C", "$\\mathrm{CH_4}$", -4], ["Fe", "$\\mathrm{Fe_2O_3}$", 3],
    ["Cl", "$\\mathrm{HClO}$", 1], ["Cl", "$\\mathrm{NaClO_3}$", 5], ["O", "$\\mathrm{H_2O_2}$", -1], ["S", "$\\mathrm{H_2S}$", -2], ["S", "$\\mathrm{SO_2}$", 4], ["P", "$\\mathrm{H_3PO_4}$", 5],
    ["C", "Ethanal $\\mathrm{CH_3CHO}$ (Carbonyl-C)", 1], ["C", "Ethansäure $\\mathrm{CH_3COOH}$ (Carboxy-C)", 3], ["C", "Ethanol $\\mathrm{CH_3CH_2OH}$ (C mit OH-Gruppe)", -1]];
  const sgn = (n) => (n > 0 ? "+" + n : n < 0 ? "−" + -n : "0");
  spec("oxidationszahl", { custom(level, G) {
    const [el, f, ox] = G.pick(level <= 1 ? OXZ.slice(0, 10) : OXZ);
    const wrong = G.shuffle([ox + 1, ox - 1, ox + 2, -ox, ox - 2].filter((x) => x !== ox && x >= -4 && x <= 8)).map(sgn);
    return choiceStep("Welche Oxidationszahl hat **" + el + "** in " + f + "?", sgn(ox), wrong,
      "Sauerstoff zählt meist $-2$ (in Peroxiden $-1$), Wasserstoff $+1$, Alkalimetalle $+1$; die Summe aller Oxidationszahlen ist gleich der Ladung des Teilchens. In organischen Molekülen zählt man für jedes C-Atom die Bindungen: an O oder N geben ihm $+1$, an H $-1$, an C nichts. Hier ergibt sich " + sgn(ox) + ".");
  } });
  const NAMES = [["$\\mathrm{CH_3{-}CH_2{-}CH(CH_3){-}CH_3}$", "2-Methylbutan", ["3-Methylbutan", "Pentan", "2-Ethylpropan"]],
    ["$\\mathrm{CH_3{-}CH{=}CH{-}CH_3}$", "But-2-en", ["But-1-en", "Butan", "But-3-en"]], ["$\\mathrm{CH_3{-}CO{-}CH_3}$", "Propanon", ["Propanal", "Propan-2-ol", "Propansäure"]],
    ["$\\mathrm{CH_3{-}CH_2{-}CHO}$", "Propanal", ["Propanon", "Propan-1-ol", "Propansäure"]], ["$\\mathrm{CH_3{-}CH(OH){-}CH_3}$", "Propan-2-ol", ["Propan-1-ol", "Propanon", "2-Hydroxypropanal"]],
    ["$\\mathrm{HC{\\equiv}C{-}CH_3}$", "Propin", ["Propen", "Prop-2-in", "Ethin"]], ["$\\mathrm{(CH_3)_3C{-}CH_2{-}CH_3}$", "2,2-Dimethylbutan", ["3,3-Dimethylbutan", "2-Methylpentan", "Hexan"]],
    ["$\\mathrm{CH_2{=}CH{-}CH{=}CH_2}$", "Buta-1,3-dien", ["Buta-2,4-dien", "But-1-en", "Butin"]], ["$\\mathrm{CH_3{-}COO{-}CH_2{-}CH_3}$", "Ethansäureethylester", ["Ethylethansäure", "Butansäure", "Ethansäuremethylester"]],
    ["$\\mathrm{CH_3{-}CH_2{-}CH_2{-}Cl}$", "1-Chlorpropan", ["3-Chlorpropan", "2-Chlorpropan", "Chlorpropen"]], ["$\\mathrm{CH_3{-}CH_2{-}COOH}$", "Propansäure", ["Propanal", "Ethansäure", "Propanon"]],
    ["$\\mathrm{CH_3{-}CH(CH_3){-}CH_2{-}OH}$", "2-Methylpropan-1-ol", ["Butan-1-ol", "2-Methylpropan-3-ol", "Butan-2-ol"]], ["$\\mathrm{CH_3{-}CH(CH_2CH_3){-}CH_2{-}CH_3}$", "3-Methylpentan", ["2-Ethylbutan", "3-Ethylbutan", "Hexan"]]];
  spec("iupac", { custom(level, G) {
    const [f, right, wrong] = G.pick(level <= 1 ? NAMES.slice(0, 7) : NAMES);
    return choiceStep("Wie heißt die Verbindung " + f + " nach IUPAC?", right, G.shuffle(wrong),
      "Längste Kette suchen, so nummerieren, dass funktionelle Gruppen und Mehrfachbindungen die kleinsten Nummern bekommen, Seitenketten alphabetisch voranstellen. Richtig: **" + right + "**. Häufige Fehler: von der falschen Seite zählen oder eine Seitenkette als Teil der Hauptkette übersehen.");
  } });
  const ISO = [[4, 2], [5, 3], [6, 5], [7, 9], [8, 18]];
  spec("isomere-anzahl", { custom(level, G) {
    const [n, k] = G.pick(level <= 2 ? ISO.slice(0, 3) : ISO);
    return choiceStep("Wie viele Konstitutionsisomere gibt es zur Summenformel $\\mathrm{C_{" + n + "}H_{" + (2 * n + 2) + "}}$ (Alkane)?", String(k), G.shuffle([k - 1, k + 1, k + 2, n - 1, n].filter((x) => x !== k && x > 0)).map(String),
      "Systematisch: zuerst die unverzweigte Kette, dann eine Methylgruppe an jede mögliche Stelle, dann zwei und so weiter; spiegelbildlich gleiche Stellungen nur einmal zählen. Für $\\mathrm{C_" + n + "}$ sind es " + k + ".");
  } });
  const CHIRAL = [["Milchsäure $\\mathrm{CH_3{-}CH(OH){-}COOH}$", 1], ["Alanin $\\mathrm{CH_3{-}CH(NH_2){-}COOH}$", 1], ["Glycin $\\mathrm{H_2N{-}CH_2{-}COOH}$", 0], ["Glycerin $\\mathrm{HOCH_2{-}CH(OH){-}CH_2OH}$", 0],
    ["Butan-2-ol $\\mathrm{CH_3{-}CH(OH){-}CH_2{-}CH_3}$", 1], ["Weinsäure $\\mathrm{HOOC{-}CH(OH){-}CH(OH){-}COOH}$", 2], ["offenkettige Glucose", 4], ["Glucose in der Ringform", 5], ["Propan-2-ol", 0], ["Fructose (offenkettig)", 3]];
  spec("chiralitaet", { custom(level, G) {
    const [name, k] = G.pick(CHIRAL);
    return choiceStep("Wie viele Stereozentren (asymmetrische C-Atome) hat " + name + "?", String(k), G.shuffle([0, 1, 2, 3, 4, 5].filter((x) => x !== k)).slice(0, 3).map(String),
      "Ein Stereozentrum ist ein C-Atom mit vier verschiedenen Substituenten. Gleiche Gruppen (etwa zwei H oder zwei $\\mathrm{CH_2OH}$) schließen es aus. Ergebnis: " + k + ". Beim Ringschluss der Glucose wird das Carbonyl-C-Atom C1 zum zusätzlichen Stereozentrum.");
  } });
  const HALF = [["Mg", -2.37, 2], ["Al", -1.66, 3], ["Zn", -0.76, 2], ["Fe", -0.44, 2], ["Ni", -0.23, 2], ["Pb", -0.13, 2], ["Cu", 0.34, 2], ["Ag", 0.80, 1]];
  spec("galvanisch", { custom(level, G) {
    const [a, b] = G.pickN(HALF, 2).sort((p, q) => p[1] - q[1]);
    const dE = Math.round((b[1] - a[1]) * 100) / 100;
    if (level <= 1 || (level === 2 && G.chance(0.5))) {
      return choiceStep("Eine galvanische Zelle besteht aus den Halbzellen " + a[0] + "/" + a[0] + "-Ionen und " + b[0] + "/" + b[0] + "-Ionen (Standardbedingungen). Welche Elektrode ist der Minuspol (Anode)?",
        "die " + a[0] + "-Elektrode", ["die " + b[0] + "-Elektrode", "beide abwechselnd", "das hängt von der Stromstärke ab"],
        "Das unedlere Metall (kleineres Standardpotenzial, " + a[0] + ": " + String(a[1]).replace(".", ",") + " V) gibt Elektronen ab und wird oxidiert: Anode, Minuspol. " + b[0] + " (" + String(b[1]).replace(".", ",") + " V) ist die Kathode.");
    }
    const md = "Berechne die Spannung der Zelle aus " + a[0] + "/" + a[0] + "-Ionen ($E^0 = " + String(a[1]).replace(".", "{,}") + "$ V) und " + b[0] + "/" + b[0] + "-Ionen ($E^0 = " + String(b[1]).replace(".", "{,}") + "$ V) unter Standardbedingungen, in V.";
    return H.numericStep(md, dE, "V", "$\\Delta E = E^0(\\text{Akzeptor}) - E^0(\\text{Donator}) = " + String(b[1]).replace(".", "{,}") + "\\,\\mathrm{V} - (" + String(a[1]).replace(".", "{,}") + "\\,\\mathrm{V}) = " + String(dE).replace(".", "{,}") + "\\,\\mathrm{V}$.");
  } });

  // ---------------------------------------------------------------- Organik: Säurestärke, Markovnikov, Mechanismen, Nachweise, Wasserhärte
  const ACIDS = [
    ["Chlorethansäure", "Ethansäure", "Das Chloratom zieht Elektronen ab (−I-Effekt); das Carboxylat-Ion wird stabilisiert."],
    ["Ethansäure", "Propansäure", "Die längere Alkylgruppe schiebt Elektronen (+I-Effekt) und destabilisiert das Carboxylat-Ion etwas."],
    ["Trichlorethansäure", "Dichlorethansäure", "Drei Chloratome ziehen stärker als zwei: Die −I-Effekte addieren sich."],
    ["2-Chlorbutansäure", "4-Chlorbutansäure", "Der −I-Effekt nimmt mit der Entfernung rasch ab; das Chloratom an C2 sitzt nah an der Carboxygruppe."],
    ["Methansäure", "Ethansäure", "Ethansäure trägt eine Methylgruppe mit +I-Effekt, Methansäure nur ein H-Atom."],
    ["Ethansäure", "Ethanol", "Das Acetat-Ion ist mesomeriestabilisiert, das Ethanolat-Ion nicht."],
    ["Fluorethansäure", "Chlorethansäure", "Fluor ist elektronegativer als Chlor und zieht stärker (−I-Effekt)."],
    ["Phenol", "Ethanol", "Das Phenolat-Ion ist mesomeriestabilisiert: Die Ladung verteilt sich über den Ring."],
    ["Ethansäure", "Phenol", "Im Carboxylat verteilt sich die Ladung auf zwei gleichwertige O-Atome, im Phenolat zum Teil auf weniger elektronegative C-Atome."],
    ["Dichlorethansäure", "Chlorethansäure", "Zwei Chloratome ziehen stärker als eins: Die −I-Effekte addieren sich."],
    ["3-Chlorpropansäure", "Propansäure", "Auch über zwei Bindungen hinweg wirkt der −I-Effekt des Chloratoms noch."],
    ["Benzoesäure", "Phenol", "Benzoesäure ist eine Carbonsäure: Das Carboxylat-Ion ist über zwei O-Atome stabilisiert."]];
  const ACID_WRONG = ["Ein +I-Effekt stabilisiert das Säure-Anion.", "Die größere Molekülmasse erleichtert die Abgabe des Protons.",
    "Mehr Wasserstoffatome im Molekül bedeuten mehr abspaltbare Protonen.", "Das Säure-Anion ist weniger stabil; deshalb wird das Proton leichter abgegeben."];
  spec("saeurestaerke", { custom(level, G) {
    const [s, w, why] = G.pick(level <= 1 ? ACIDS.slice(0, 6) : ACIDS);
    const pair = G.chance(0.5) ? [s, w] : [w, s];
    if (level <= 2) {
      return choiceStep("Welche Säure ist stärker: **" + pair[0] + "** oder **" + pair[1] + "**?", s, [w, "Beide sind gleich stark."],
        "**" + s + "** ist stärker. " + why + " Je stabiler das Säure-Anion, desto leichter wird das Proton abgegeben.");
    }
    return choiceStep("**" + s + "** ist eine stärkere Säure als **" + w + "**. Welche Begründung trifft zu?", why, G.pickN(ACID_WRONG, 3),
      why + " Merksatz: Alles, was die negative Ladung des Anions verteilt oder abzieht (−I-Effekt, Mesomerie), macht die Säure stärker; +I-Effekte schwächen sie.");
  } });

  const MARK = [
    ["Propen $\\mathrm{CH_2{=}CH{-}CH_3}$", "Bromwasserstoff", "2-Brompropan", ["1-Brompropan", "1,2-Dibrompropan", "Propan-2-ol"]],
    ["Propen $\\mathrm{CH_2{=}CH{-}CH_3}$", "Wasser (säurekatalysiert)", "Propan-2-ol", ["Propan-1-ol", "Propanal", "Propanon"]],
    ["2-Methylpropen $\\mathrm{CH_2{=}C(CH_3)_2}$", "Chlorwasserstoff", "2-Chlor-2-methylpropan", ["1-Chlor-2-methylpropan", "2-Chlorbutan", "1,2-Dichlor-2-methylpropan"]],
    ["2-Methylpropen $\\mathrm{CH_2{=}C(CH_3)_2}$", "Wasser (säurekatalysiert)", "2-Methylpropan-2-ol", ["2-Methylpropan-1-ol", "Butan-2-ol", "2-Methylpropanal"]],
    ["But-1-en $\\mathrm{CH_2{=}CH{-}CH_2{-}CH_3}$", "Bromwasserstoff", "2-Brombutan", ["1-Brombutan", "1,2-Dibrombutan", "2-Brombut-1-en"]],
    ["2-Methylbut-2-en $\\mathrm{(CH_3)_2C{=}CH{-}CH_3}$", "Bromwasserstoff", "2-Brom-2-methylbutan", ["2-Brom-3-methylbutan", "1-Brom-2-methylbutan", "2,3-Dibrom-2-methylbutan"]],
    ["Styrol $\\mathrm{C_6H_5{-}CH{=}CH_2}$", "Bromwasserstoff", "1-Brom-1-phenylethan", ["2-Brom-1-phenylethan", "Brombenzol", "1,2-Dibrom-1-phenylethan"]]];
  const MARK_WRONG = ["Weil das Halogenid- oder Wassermolekül zuerst angreift.", "Weil das H-Atom an das C-Atom mit weniger H-Atomen geht.",
    "Weil die Reaktion über Radikale verläuft.", "Weil das primäre Carbenium-Ion am stabilsten ist."];
  spec("markovnikov", { custom(level, G) {
    const [alken, reag, right, wrong] = G.pick(level <= 1 ? MARK.slice(0, 4) : MARK);
    const why = "Nach Markovnikov geht das H-Atom an das C-Atom der Doppelbindung, das schon mehr H-Atome trägt. So entsteht das stabilere, höher substituierte Carbenium-Ion (stabilisiert durch den +I-Effekt der Alkylgruppen, beim Styrol durch Mesomerie mit dem Ring), an das sich das Nucleophil anlagert.";
    if (level <= 2) {
      return choiceStep("Welches Hauptprodukt entsteht bei der Addition von " + reag + " an " + alken + "?", right, wrong, why + " Hauptprodukt: **" + right + "**.");
    }
    return choiceStep("Bei der Addition von " + reag + " an " + alken + " entsteht vor allem **" + right + "**. Warum?",
      "Weil dabei das stabilere, höher substituierte Carbenium-Ion entsteht.", G.pickN(MARK_WRONG, 3), why);
  } });

  const MECH = [
    ["$\\mathrm{CH_2{=}CH_2 + Br_2 \\to CH_2Br{-}CH_2Br}$", 0],
    ["$\\mathrm{C_6H_6 + Br_2 \\xrightarrow{FeBr_3} C_6H_5Br + HBr}$", 1],
    ["$\\mathrm{CH_3Br + OH^- \\to CH_3OH + Br^-}$", 2],
    ["$\\mathrm{(CH_3)_3CBr + H_2O \\to (CH_3)_3COH + HBr}$", 3],
    ["$\\mathrm{CH_4 + Cl_2 \\xrightarrow{\\text{Licht}} CH_3Cl + HCl}$", 4],
    ["$\\mathrm{CH_3{-}CH{=}CH_2 + HBr \\to CH_3{-}CHBr{-}CH_3}$", 0],
    ["$\\mathrm{n\\,CH_2{=}CH_2 \\xrightarrow{\\text{Radikalstarter}} {-}[CH_2{-}CH_2]_n{-}}$", 5],
    ["$\\mathrm{C_6H_6 + HNO_3 \\xrightarrow{H_2SO_4} C_6H_5NO_2 + H_2O}$", 1],
    ["$\\mathrm{C_2H_5Br + CN^- \\to C_2H_5CN + Br^-}$", 2],
    ["$\\mathrm{CH_2{=}C(CH_3)_2 + H_2O \\xrightarrow{H^+} (CH_3)_3COH}$", 0],
    ["$\\mathrm{C_2H_6 + Br_2 \\xrightarrow{\\text{Licht}} C_2H_5Br + HBr}$", 4],
    ["$\\mathrm{n\\,CH_2{=}C(CH_3)_2 \\xrightarrow{H^+} \\text{Polyisobuten}}$", 6]];
  const MECH_N = ["elektrophile Addition", "elektrophile Substitution", "nucleophile Substitution (SN2)", "nucleophile Substitution (SN1)",
    "radikalische Substitution", "radikalische Polymerisation", "kationische Polymerisation"];
  const MECH_W = ["Ein Elektrophil greift die π-Elektronen der Doppelbindung an; aus zwei Teilchen wird eines, die Doppelbindung verschwindet.",
    "Ein Elektrophil (mit Katalysator erzeugt) ersetzt ein H-Atom am Aromaten; über den σ-Komplex bleibt das aromatische System erhalten.",
    "Ein Nucleophil ersetzt die Abgangsgruppe in einem Schritt, Rückseitenangriff; typisch für primäre Halogenalkane.",
    "Die Abgangsgruppe geht zuerst, es entsteht ein tertiäres Carbenium-Ion, dann greift das Nucleophil an; typisch für tertiäre Halogenalkane in Wasser.",
    "Licht spaltet das Halogen in Radikale; eine Kettenreaktion ersetzt H-Atome des Alkans.",
    "Ein Radikalstarter öffnet die Doppelbindung; die Kette wächst, bis zwei Radikale sich treffen.",
    "Ein Proton startet die Kette über ein Carbenium-Ion; Monomere mit elektronenschiebenden Gruppen eignen sich besonders."];
  spec("mechanismus", { custom(level, G) {
    const [eq, k] = G.pick(level <= 1 ? MECH.slice(0, 6) : MECH);
    return choiceStep("Nach welchem Mechanismus verläuft diese Reaktion? " + eq, MECH_N[k], G.shuffle(MECH_N.filter((n, i) => i !== k)).slice(0, 3),
      "**" + MECH_N[k] + ".** " + MECH_W[k]);
  } });

  const NACHW = [
    ["Bromwasser wird ohne Belichtung sofort entfärbt.", "eine C=C-Doppelbindung", "Brom addiert an die Doppelbindung (elektrophile Addition)."],
    ["Fehling-Probe: Beim Erwärmen fällt ein ziegelroter Niederschlag aus.", "eine Aldehydgruppe", "Cu²⁺ wird zu Cu₂O reduziert, der Aldehyd zur Carbonsäure oxidiert."],
    ["Tollens-Probe: An der Glaswand bildet sich ein Silberspiegel.", "eine Aldehydgruppe", "Ag⁺ wird zu Silber reduziert, der Aldehyd oxidiert."],
    ["Kalkwasser trübt sich beim Einleiten des Gases.", "Kohlenstoffdioxid", "Es fällt Calciumcarbonat aus."],
    ["Iod-Kaliumiodid-Lösung färbt sich tiefblau.", "Stärke", "Iod lagert sich in die Helix der Amylose ein."],
    ["Biuret-Reagenz färbt sich violett.", "Peptidbindungen (Proteine)", "Cu²⁺ bildet mit den Peptidbindungen einen violetten Komplex."],
    ["Ein glimmender Holzspan flammt im Gas auf.", "Sauerstoff", "Glimmspanprobe."],
    ["Das aufgefangene Gas verbrennt mit pfeifendem Knall.", "Wasserstoff", "Knallgasprobe."],
    ["Weißes, wasserfreies Kupfersulfat färbt sich blau.", "Wasser", "Es bildet sich blaues Kupfersulfat-Hydrat."],
    ["Mit Silbernitratlösung fällt ein weißer Niederschlag aus.", "Chlorid-Ionen", "Silberchlorid ist schwer löslich."],
    ["Mit Bariumchloridlösung fällt ein weißer Niederschlag aus.", "Sulfat-Ionen", "Bariumsulfat ist schwer löslich."],
    ["Ninhydrin färbt sich beim Erwärmen blauviolett.", "Aminosäuren", "Ninhydrin reagiert mit freien Aminogruppen zu einem Farbstoff."],
    ["Ein Glucose-Teststreifen (GOD) verfärbt sich.", "Glucose", "Das Enzym Glucoseoxidase setzt nur Glucose um."]];
  spec("nachweis", { custom(level, G) {
    const [obs, right, why] = G.pick(level <= 1 ? NACHW.slice(0, 8) : NACHW);
    const wrong = G.shuffle([...new Set(NACHW.map((x) => x[1]))].filter((x) => x !== right)).slice(0, 3);
    return choiceStep("Beobachtung: " + obs + " Was ist damit nachgewiesen?", right, wrong, "Nachgewiesen ist **" + right + "**. " + why);
  } });

  spec("wasserhaerte", { custom(level, G) {
    const c = G.int(5, 40) / 10;
    if (level <= 1) {
      return H.numericStep("Ein Leitungswasser enthält $c = " + G.tex(c, 1) + "\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$ Calcium- und Magnesium-Ionen. Wie hoch ist die Härte in °dH? ($1\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}} \\approx 5{,}6\\,{}^{\\circ}\\mathrm{dH}$)",
        Math.round(c * 5.6 * 10) / 10, "°dH", "$" + G.tex(c, 1) + " \\cdot 5{,}6 \\approx " + G.tex(c * 5.6, 1) + "$ °dH.");
    }
    if (level === 2) {
      const b = G.int(4, 32) * 5, cc = b / 40.08;
      return H.numericStep("Ein Wasser enthält $" + b + "\\,\\tfrac{\\mathrm{mg}}{\\mathrm{L}}$ Calcium-Ionen ($M = 40{,}1\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$), sonst keine Härtebildner. Wie hoch ist die Härte in °dH? ($1\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}} \\approx 5{,}6\\,{}^{\\circ}\\mathrm{dH}$)",
        Math.round(cc * 5.6 * 10) / 10, "°dH", "Erst die Stoffmengenkonzentration: $c = \\tfrac{" + b + "}{40{,}1} \\approx " + G.tex(cc, 2) + "\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$, dann mal 5,6: etwa $" + G.tex(cc * 5.6, 1) + "$ °dH.");
    }
    const h = Math.round(c * 5.6 * 10) / 10;
    if (level === 3) {
      return H.numericStep("Ein Wasser hat eine Härte von $" + G.tex(h, 1) + "$ °dH. Wie groß ist die Konzentration der Erdalkali-Ionen in $\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$? ($1\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}} \\approx 5{,}6\\,{}^{\\circ}\\mathrm{dH}$)",
        Math.round((h / 5.6) * 100) / 100, "mmol/L", "Rückwärts: $c = \\tfrac{" + G.tex(h, 1) + "}{5{,}6} \\approx " + G.tex(h / 5.6, 2) + "\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$.");
    }
    if (G.chance(0.5)) {
      const r = c < 1.5 ? "weich" : c <= 2.5 ? "mittel" : "hart";
      return choiceStep("Ein Wasser enthält $" + G.tex(c, 1) + "\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$ Erdalkali-Ionen ($" + G.tex(h, 1) + "$ °dH). In welchen Härtebereich fällt es?", r,
        ["weich", "mittel", "hart"].filter((x) => x !== r),
        "Härtebereiche nach dem Waschmittelgesetz: weich unter 1,5 mmol/L (8,4 °dH), mittel bis 2,5 mmol/L (14 °dH), hart darüber. Hier: **" + r + "**.");
    }
    return H.numericStep("Ein Wasser enthält $" + G.tex(c, 1) + "\\,\\tfrac{\\mathrm{mmol}}{\\mathrm{L}}$ Calcium-Ionen, alle als Hydrogencarbonat gelöst. Wie viel Milligramm Kesselstein ($\\mathrm{CaCO_3}$, $M = 100\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$) kann sich beim Kochen aus einem Liter höchstens abscheiden?",
      Math.round(c * 100), "mg", "$\\mathrm{Ca^{2+} + 2\\,HCO_3^- \\to CaCO_3 + CO_2 + H_2O}$: je Calcium-Ion ein $\\mathrm{CaCO_3}$, also $" + G.tex(c, 1) + "\\,\\mathrm{mmol} \\cdot 100\\,\\tfrac{\\mathrm{mg}}{\\mathrm{mmol}} = " + Math.round(c * 100) + "$ mg.");
  } });

  // ---------------------------------------------------------------- Naturstoffe: Zucker und Peptide
  const ZK = [["Glucose", "Aldohexose"], ["Fructose", "Ketohexose"], ["Galactose", "Aldohexose"], ["Mannose", "Aldohexose"], ["Ribose", "Aldopentose"],
    ["Desoxyribose", "Aldopentose"], ["Maltose", "Disaccharid"], ["Saccharose", "Disaccharid"], ["Lactose", "Disaccharid"], ["Cellobiose", "Disaccharid"],
    ["Stärke", "Polysaccharid"], ["Cellulose", "Polysaccharid"], ["Glykogen", "Polysaccharid"]];
  const ZK_W = { Aldohexose: "sechs C-Atome, Aldehydgruppe an C1", Ketohexose: "sechs C-Atome, Ketogruppe an C2", Aldopentose: "fünf C-Atome, Aldehydgruppe an C1",
    Disaccharid: "zwei Monosaccharide, glycosidisch verknüpft", Polysaccharid: "Hunderte bis Tausende Glucose-Einheiten" };
  const GLY = [["Maltose", "α-1,4", "zwei Glucose-Einheiten"], ["Cellobiose", "β-1,4", "zwei Glucose-Einheiten"], ["Lactose", "β-1,4", "Galactose an Glucose"],
    ["Saccharose", "α,β-1,2", "Glucose und Fructose, beide anomeren C-Atome sind gebunden"], ["Amylose", "α-1,4", "unverzweigte Glucose-Kette, die sich zur Helix windet"],
    ["Amylopektin", "α-1,4 und α-1,6", "Glucose-Kette mit Verzweigungen"], ["Cellulose", "β-1,4", "gestreckte Glucose-Ketten, die Fasern bilden"],
    ["Glykogen", "α-1,4 und α-1,6", "stark verzweigter Glucose-Speicher in Leber und Muskel"]];
  const GLY_N = ["α-1,4", "β-1,4", "α,β-1,2", "α-1,4 und α-1,6", "β-1,6"];
  spec("zucker", { custom(level, G) {
    if (level <= 2) {
      const [z, k] = G.pick(ZK);
      return choiceStep("Zu welcher Gruppe gehört **" + z + "**?", k, G.shuffle(Object.keys(ZK_W).filter((x) => x !== k)).slice(0, 3),
        "**" + z + "**: " + k + ", also " + ZK_W[k] + ".");
    }
    const [z, b, why] = G.pick(GLY);
    return choiceStep("Welche glycosidische Bindung verknüpft die Bausteine in **" + z + "**?", b, G.shuffle(GLY_N.filter((x) => x !== b)).slice(0, 3),
      "**" + z + "**: " + b + "-glycosidisch; " + why + ". Ob α oder β, entscheidet die Stellung der OH-Gruppe am anomeren C-Atom.");
  } });

  const AS = [["Gly", 75.07], ["Ala", 89.09], ["Ser", 105.09], ["Cys", 121.16], ["Val", 117.15], ["Leu", 131.17], ["Phe", 165.19], ["Lys", 146.19], ["Glu", 147.13]];
  spec("peptid", { custom(level, G) {
    if (level <= 1) {
      const n = G.int(3, 12);
      return H.numericStep("Ein Peptid besteht aus " + n + " Aminosäuren in einer Kette. Wie viele Wassermoleküle wurden bei seiner Bildung abgespalten?", n - 1, "",
        "Jede Peptidbindung entsteht unter Abspaltung eines Wassermoleküls. Eine Kette aus " + n + " Bausteinen hat " + (n - 1) + " Peptidbindungen.");
    }
    if (level === 2) {
      const k = G.pick([3, 4, 5, 20]), n = k === 20 ? G.int(2, 3) : G.int(2, 4);
      return H.numericStep("Wie viele verschiedene Peptide aus " + n + " Aminosäuren lassen sich bilden, wenn " + k + " verschiedene Aminosäuren zur Verfügung stehen und jede beliebig oft vorkommen darf?", Math.pow(k, n), "",
        "An jeder der " + n + " Positionen kann jede der " + k + " Aminosäuren stehen, und die Reihenfolge zählt (vom N- zum C-Terminus): $" + k + "^{" + n + "} = " + Math.pow(k, n) + "$.");
    }
    if (level === 3) {
      const pep = G.pickN(AS, G.int(2, 4)), n = pep.length;
      const sum = pep.reduce((a, x) => a + x[1], 0), M = sum - (n - 1) * 18.02;
      return H.numericStep("Berechne die molare Masse des Peptids **" + pep.map((x) => x[0]).join("-") + "** in g/mol. Molare Massen: " + pep.map((x) => x[0] + " $" + G.tex(x[1], 2) + "$").join(", ") + ", Wasser $18{,}02$ (alle in g/mol).",
        Math.round(M * 100) / 100, "g/mol", "Summe der Aminosäuren minus " + (n - 1) + " abgespaltene Wassermoleküle: $" + G.tex(sum, 2) + " - " + (n - 1) + " \\cdot 18{,}02 = " + G.tex(M, 2) + "$ g/mol.");
    }
    const kda = G.int(10, 120);
    return H.numericStep("Ein Protein hat die molare Masse $" + kda + "\\,000\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$. Ein Aminosäurerest wiegt im Mittel $110\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$. Aus wie vielen Aminosäuren besteht es ungefähr?",
      Math.round((kda * 1000) / 110), "", "$\\tfrac{" + kda + "\\,000}{110} \\approx " + Math.round((kda * 1000) / 110) + "$ Aminosäuren.");
  } });

  // ---------------------------------------------------------------- Kunststoffe: Polymerisationsgrad und Polyreaktionen
  const MONO = [["Ethen", "Polyethen (PE)", 28.05], ["Propen", "Polypropen (PP)", 42.08], ["Chlorethen (Vinylchlorid)", "Polyvinylchlorid (PVC)", 62.5],
    ["Styrol", "Polystyrol (PS)", 104.15], ["Tetrafluorethen", "Polytetrafluorethen (PTFE)", 100.02], ["Methacrylsäuremethylester", "Polymethylmethacrylat (PMMA)", 100.12]];
  spec("polymergrad", { custom(level, G) {
    const [m, p, M] = G.pick(MONO);
    const n = G.int(4, 60) * 500, Mp = Math.round((n * M) / 1000) * 1000;
    const tm = G.tex(M, 2);
    if (level <= 1) {
      return H.numericStep("Ein Molekül " + p + " hat die molare Masse $" + G.tex(Mp, 0) + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$. Wie viele Monomere (" + m + ", $M = " + tm + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$) enthält es?",
        Math.round(Mp / M), "", "Polymerisationsgrad $n = \\tfrac{M(\\text{Polymer})}{M(\\text{Monomer})} = \\tfrac{" + G.tex(Mp, 0) + "}{" + tm + "} \\approx " + G.tex(Math.round(Mp / M), 0) + "$.");
    }
    if (level === 2) {
      return H.numericStep("Ein Molekül " + p + " hat die molare Masse $" + G.tex(Mp / 1000, 0) + "\\,\\tfrac{\\mathrm{kg}}{\\mathrm{mol}}$. Wie viele Monomere (" + m + ", $M = " + tm + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$) enthält es?",
        Math.round(Mp / M), "", "Zuerst in g/mol umrechnen: $" + G.tex(Mp, 0) + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$. Dann $n = \\tfrac{" + G.tex(Mp, 0) + "}{" + tm + "} \\approx " + G.tex(Math.round(Mp / M), 0) + "$.");
    }
    if (level === 3) {
      return H.numericStep("Ein Molekül " + p + " besteht aus $" + G.tex(n, 0) + "$ Monomereinheiten (" + m + ", $M = " + tm + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$). Wie groß ist seine molare Masse in kg/mol?",
        Math.round((n * M) / 100) / 10, "kg/mol", "$M = n \\cdot M(\\text{Monomer}) = " + G.tex(n, 0) + " \\cdot " + tm + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}} \\approx " + G.tex((n * M) / 1000, 1) + "\\,\\tfrac{\\mathrm{kg}}{\\mathrm{mol}}$.");
    }
    const [name, mu] = G.pick([["PET", 192.17], ["Nylon-6,6", 226.32]]);
    const k = G.int(10, 200), Mq = Math.round(k * mu);
    return H.numericStep("Ein Molekül " + name + " hat die molare Masse $" + G.tex(Mq, 0) + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$; eine Wiederholungseinheit wiegt $" + G.tex(mu, 2) + "\\,\\tfrac{\\mathrm{g}}{\\mathrm{mol}}$. Wie viele Wassermoleküle wurden bei der Bildung ungefähr abgespalten?",
      2 * k, "", "Die Kette hat $\\tfrac{" + G.tex(Mq, 0) + "}{" + G.tex(mu, 2) + "} \\approx " + k + "$ Wiederholungseinheiten. Jede enthält zwei " + (name === "PET" ? "Ester" : "Amid") + "bindungen, und für jede wird ein Wassermolekül abgespalten: rund $2 \\cdot " + k + " = " + 2 * k + "$.");
  } });

  const POLY = [["Ethen", "Polymerisation", "Polyethen"], ["Styrol", "Polymerisation", "Polystyrol"], ["Chlorethen", "Polymerisation", "Polyvinylchlorid"],
    ["Terephthalsäure und Ethandiol", "Polykondensation", "ein Polyester (PET)"], ["Hexandisäure und Hexan-1,6-diamin", "Polykondensation", "ein Polyamid (Nylon-6,6)"],
    ["Milchsäure", "Polykondensation", "ein Polyester (PLA)"], ["Aminosäuren", "Polykondensation", "ein Protein (Polyamid)"], ["Diisocyanat und Diol", "Polyaddition", "ein Polyurethan"],
    ["Glucose in der Pflanze", "Polykondensation", "Stärke oder Cellulose"]];
  const POLY_W = { Polymerisation: "Die C=C-Doppelbindung öffnet sich, die Monomere lagern sich ohne Nebenprodukt aneinander.",
    Polykondensation: "Jedes Monomer trägt zwei funktionelle Gruppen; sie reagieren unter Abspaltung kleiner Moleküle wie Wasser.",
    Polyaddition: "Die Monomere verknüpfen sich ohne Nebenprodukt; dabei wandert ein H-Atom." };
  spec("polyreaktion", { custom(level, G) {
    const [mono, art, prod] = G.pick(POLY);
    if (level <= 2) {
      return choiceStep("Welche Polyreaktion bildet aus **" + mono + "** ein Makromolekül?", art, Object.keys(POLY_W).filter((x) => x !== art),
        "**" + art + ".** " + POLY_W[art] + " Produkt: " + prod + ".");
    }
    const wrong = G.shuffle([...new Set(POLY.map((x) => x[2]))].filter((x) => x !== prod)).slice(0, 3);
    return choiceStep("Was entsteht aus **" + mono + "**?", prod, wrong, "Aus " + mono + " entsteht " + prod + " durch " + art + ". " + POLY_W[art]);
  } });

  // ---------------------------------------------------------------- Q3: Energiediagramm und Ionenprodukt
  spec("energiediagramm", { custom(level, G) {
    const Ep = G.int(-12, 6) * 10, top = Math.max(0, Ep), Em = top + G.int(5, 18) * 10;
    const ctx = "Im Energiediagramm liegen die Edukte bei 0 kJ/mol, das Maximum bei " + Em + " kJ/mol und die Produkte bei " + Ep + " kJ/mol.";
    if (level <= 1) {
      return H.numericStep(ctx + " Wie groß ist die Reaktionsenthalpie in kJ/mol?", Ep, "kJ/mol",
        "$\\Delta_r H = E(\\text{Produkte}) - E(\\text{Edukte}) = " + Ep + "$ kJ/mol; " + (Ep < 0 ? "negativ, also exotherm." : Ep > 0 ? "positiv, also endotherm." : "weder exo- noch endotherm."));
    }
    if (level === 2) {
      return H.numericStep(ctx + " Wie groß ist die Aktivierungsenergie der **Rückreaktion** in kJ/mol?", Em - Ep, "kJ/mol",
        "Vom Produktniveau bis zum Maximum: $" + Em + " - (" + Ep + ") = " + (Em - Ep) + "$ kJ/mol.");
    }
    if (level === 3) {
      const d = G.int(2, (Em - top) / 10 - 1) * 10;
      return H.numericStep(ctx + " Ein Katalysator senkt das Maximum auf " + (Em - d) + " kJ/mol. Wie groß ist jetzt die Aktivierungsenergie der Rückreaktion in kJ/mol?", Em - d - Ep, "kJ/mol",
        "Edukt- und Produktniveau bleiben, nur das Maximum sinkt: $" + (Em - d) + " - (" + Ep + ") = " + (Em - d - Ep) + "$ kJ/mol. Hin- und Rückreaktion werden um denselben Betrag (" + d + " kJ/mol) erleichtert.");
    }
    return choiceStep("Ein Katalysator wird zugesetzt. Was ändert sich im Energiediagramm?", "Die Aktivierungsenergien von Hin- und Rückreaktion sinken um denselben Betrag; die Reaktionsenthalpie bleibt.",
      ["Die Reaktionsenthalpie wird kleiner.", "Nur die Aktivierungsenergie der Hinreaktion sinkt.", "Das Produktniveau sinkt, das Gleichgewicht verschiebt sich zu den Produkten."],
      "Der Katalysator öffnet einen Weg über einen niedrigeren Übergangszustand. Anfang und Ende des Weges bleiben gleich, deshalb bleiben Reaktionsenthalpie und Gleichgewichtslage unverändert.");
  } });

  const KW = [[0, 14.94], [10, 14.53], [25, 14.0], [40, 13.53], [60, 13.02], [80, 12.6], [100, 12.29]];
  spec("ionenprodukt", { custom(level, G) {
    if (level <= 1) {
      const p = G.int(5, 130) / 10;
      return H.numericStep("Eine Lösung hat bei 25 °C den pOH-Wert $" + G.tex(p, 1) + "$. Welchen pH-Wert hat sie?", Math.round((14 - p) * 10) / 10, "",
        "$\\mathrm{pH} + \\mathrm{pOH} = 14$ bei 25 °C, also $\\mathrm{pH} = 14 - " + G.tex(p, 1) + " = " + G.tex(14 - p, 1) + "$.");
    }
    if (level === 2) {
      const b = G.int(1, 13);
      return H.numericStep("In einer Lösung (25 °C) ist $c(\\mathrm{OH^-}) = 10^{-" + b + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie?", 14 - b, "",
        "$c(\\mathrm{H_3O^+}) = \\tfrac{K_W}{c(\\mathrm{OH^-})} = \\tfrac{10^{-14}}{10^{-" + b + "}} = 10^{-" + (14 - b) + "}$, also pH " + (14 - b) + ".");
    }
    if (level === 3) {
      const b = G.int(2, 12), a = G.pick([2, 3, 4, 5]);
      const ph = Math.round((14 - b + Math.log10(a)) * 100) / 100;
      return H.numericStep("In einer Lösung (25 °C) ist $c(\\mathrm{OH^-}) = " + a + " \\cdot 10^{-" + b + "}\\,\\tfrac{\\mathrm{mol}}{\\mathrm{L}}$. Welchen pH-Wert hat sie (zwei Nachkommastellen)?", ph, "",
        "$\\mathrm{pOH} = -\\lg(" + a + " \\cdot 10^{-" + b + "}) = " + G.tex(b - Math.log10(a), 2) + "$, also $\\mathrm{pH} = 14 - \\mathrm{pOH} = " + G.tex(ph, 2) + "$.");
    }
    const [t, pkw] = G.pick(KW.filter((x) => x[0] !== 25));
    return H.numericStep("Bei " + t + " °C ist $\\mathrm{p}K_W = " + G.tex(pkw, 2) + "$. Welchen pH-Wert hat reines, neutrales Wasser bei dieser Temperatur?", Math.round((pkw / 2) * 100) / 100, "",
      "Neutral heißt $c(\\mathrm{H_3O^+}) = c(\\mathrm{OH^-})$, also $\\mathrm{pH} = \\tfrac{\\mathrm{p}K_W}{2} = " + G.tex(pkw / 2, 2) + "$. Neutral ist nur bei 25 °C dasselbe wie pH 7.");
  } });

  const make = LW.rechenEngine(T);
  LW.generator("che-rechnen", { title: "Chemie rechnen", make });
  LW.chemieTypen = T;
  const chapter = (typ) => ({ title: "Chemie üben", make: (level, G) => make(level, G, { typ }) });
  LW.generator("che-r-grundlagen", chapter(["stoffmenge", "konzentration", "gasvolumen"]));
  LW.generator("che-r-ephase", chapter(["konzentration", "verduennung", "ph-stark", "ph-base", "oxidationszahl", "galvanisch", "iupac"]));
  LW.generator("che-r-organik", chapter(["iupac", "isomere-anzahl", "oxidationszahl", "mwg", "saeurestaerke", "markovnikov", "mechanismus", "nachweis", "wasserhaerte"]));
  LW.generator("che-r-naturstoffe", chapter(["chiralitaet", "isoelektrisch", "verseifungszahl", "iodzahl", "zucker", "peptid"]));
  LW.generator("che-r-gleichgewicht", chapter(["mwg", "ph-schwach", "puffer", "titration", "nernst", "konzentrationszelle", "geschwindigkeit", "rgt", "energiediagramm", "ionenprodukt"]));
  LW.generator("che-r-wahl", chapter(["ausbeute", "atomoekonomie", "freie-enthalpie", "kalorimetrie", "faraday"]));
  LW.generator("che-r-kunststoffe", chapter(["polymergrad", "polyreaktion", "verseifungszahl", "iodzahl"]));
})();
