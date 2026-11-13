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

  const make = LW.rechenEngine(T);
  LW.generator("che-rechnen", { title: "Chemie rechnen", make });
  LW.chemieTypen = T;
  const chapter = (typ) => ({ title: "Chemie üben", make: (level, G) => make(level, G, { typ }) });
  LW.generator("che-r-grundlagen", chapter(["stoffmenge", "konzentration", "gasvolumen"]));
  LW.generator("che-r-ephase", chapter(["konzentration", "verduennung", "ph-stark", "ph-base", "oxidationszahl", "galvanisch", "iupac"]));
  LW.generator("che-r-organik", chapter(["iupac", "isomere-anzahl", "oxidationszahl", "mwg"]));
  LW.generator("che-r-naturstoffe", chapter(["chiralitaet", "isoelektrisch", "verseifungszahl", "iodzahl"]));
  LW.generator("che-r-gleichgewicht", chapter(["mwg", "ph-schwach", "puffer", "titration", "nernst", "konzentrationszelle", "geschwindigkeit", "rgt"]));
  LW.generator("che-r-wahl", chapter(["ausbeute", "atomoekonomie", "freie-enthalpie", "kalorimetrie", "faraday"]));
})();
