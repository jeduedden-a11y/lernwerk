/* Build tasks for the chemistry labs. The learner builds the molecule (or folds the chain) in the lab; the goal list
 * ticks itself off. Names follow the German IUPAC nomenclature of the Oberstufe.
 *   lab-alkane       hydrocarbons: alkanes, branched isomers, alkenes, alkynes, rings, benzene, E/Z
 *   lab-organik      functional groups: alcohols, halogen alkanes, carbonyls, acids, esters, ethers, amines, oxidation
 *   lab-stereo       chirality, R/S and E/Z, enantiomers
 *   lab-aminosaeure  amino acids, the L-configuration, peptides from building blocks
 *   lab-faltung      folding a chain in the HP model so that hydrophobic residues meet */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;

  const F = (f) => "$\\mathrm{" + f.replace(/(\d+)/g, "_{$1}") + "}$";
  const LIST = "Unter dem Modell stehen die Bedingungen; jede hakt sich ab, sobald dein Molekül sie erfüllt.";
  function mol(md, conditions, sample, hint, explain, extra) {
    return {
      type: "widget", widget: "molbau", label: "Moleküllabor", md: md + " " + LIST,
      params: Object.assign({ start: "C", task: { conditions, sample: typeof sample === "string" ? { smiles: sample } : sample } }, extra || {}),
      goal: {}, hint, explain,
    };
  }
  /** Scaffolded conditions for "build this named molecule": formula, then the exact structure. */
  function named(name, smiles, extra) {
    const C = LW.labChem;
    const m = C.parseSmiles(smiles);
    const conds = [{ c: "formel " + C.formula(m), show: "Summenformel " + F(C.formula(m)) }];
    (extra || []).forEach((x) => conds.push(x));
    conds.push({ c: "ziel " + smiles, show: "Struktur von " + name });
    return conds;
  }
  const BUILD = "Tippe ein Atom an, um das gewählte Element anzubauen; eine Bindung antippen ändert ihre Ordnung. Wasserstoffatome ergänzt das Labor selbst.";

  // ---------------------------------------------------------------- hydrocarbons
  const ALK1 = [
    ["Ethan", "CC", "Zwei C-Atome, Einfachbindung: $\\mathrm{H_3C{-}CH_3}$."],
    ["Propan", "CCC", "Drei C-Atome in einer Kette."],
    ["Butan", "CCCC", "Vier C-Atome in einer unverzweigten Kette."],
    ["Pentan", "CCCCC", "Fünf C-Atome in einer unverzweigten Kette."],
    ["Hexan", "CCCCCC", "Sechs C-Atome in einer unverzweigten Kette."],
    ["2-Methylpropan", "CC(C)C", "Hauptkette Propan, am mittleren C-Atom (C2) eine Methylgruppe. Trivialname Isobutan."],
    ["2-Methylbutan", "CCC(C)C", "Hauptkette Butan (vier C), an C2 eine Methylgruppe. Von der anderen Seite gezählt wäre es C3, darum gilt die kleinere Zahl."],
    ["2,2-Dimethylpropan", "CC(C)(C)C", "Hauptkette Propan, am mittleren C-Atom zwei Methylgruppen: ein C-Atom mit vier C-Nachbarn."],
    ["3-Methylpentan", "CCC(C)CC", "Hauptkette Pentan, die Methylgruppe in der Mitte an C3."],
    ["2,3-Dimethylbutan", "CC(C)C(C)C", "Hauptkette Butan, je eine Methylgruppe an C2 und C3."],
    ["2-Methylpentan", "CCCC(C)C", "Hauptkette Pentan, Methylgruppe an C2."],
  ];
  const ALK2 = [
    ["Ethen", "C=C", "Zwei C-Atome mit Doppelbindung. Trivialname Ethylen."],
    ["Propen", "CC=C", "Drei C-Atome, eine Doppelbindung am Kettenende."],
    ["But-1-en", "C=CCC", "Vier C-Atome, Doppelbindung zwischen C1 und C2."],
    ["But-2-en", "CC=CC", "Vier C-Atome, Doppelbindung zwischen C2 und C3."],
    ["2-Methylpropen", "CC(C)=C", "Hauptkette Propen (die Doppelbindung gehört hinein), an C2 eine Methylgruppe."],
    ["Ethin", "C#C", "Zwei C-Atome mit Dreifachbindung. Trivialname Acetylen."],
    ["Propin", "CC#C", "Drei C-Atome, Dreifachbindung am Kettenende."],
    ["But-1-in", "C#CCC", "Vier C-Atome, Dreifachbindung zwischen C1 und C2."],
    ["Buta-1,3-dien", "C=CC=C", "Vier C-Atome mit zwei Doppelbindungen, ab C1 und ab C3."],
    ["Cyclopropan", "C1CC1", "Drei C-Atome im Ring: Kette aus drei C bauen, dann mit »Ring schließen« das erste mit dem letzten verbinden."],
    ["Cyclohexan", "C1CCCCC1", "Sechs C-Atome im Ring, nur Einfachbindungen."],
    ["Cyclohexen", "C1=CCCCC1", "Sechsring mit einer Doppelbindung."],
    ["Methylcyclohexan", "CC1CCCCC1", "Sechsring mit einer Methylgruppe."],
    ["Benzol", "C1=CC=CC=C1", "Sechsring mit drei abwechselnden Doppelbindungen (Kekulé-Formel)."],
  ];
  const ALK3 = [
    { md: "Baue ein **Isomer von Pentan** ($\\mathrm{C_5H_{12}}$), dessen längste Kohlenstoffkette nur **drei** C-Atome hat.",
      c: [{ c: "formel C5H12", show: "Summenformel " + F("C5H12") }, { c: "kette 3", show: "längste Kette: drei C-Atome" }], s: "CC(C)(C)C",
      e: "Nur 2,2-Dimethylpropan hat fünf C-Atome und keine Kette länger als drei: Das mittlere C-Atom trägt zwei Methylgruppen." },
    { md: "Baue ein **Isomer von Hexan** ($\\mathrm{C_6H_{14}}$), dessen längste Kette **fünf** C-Atome hat.",
      c: [{ c: "formel C6H14", show: "Summenformel " + F("C6H14") }, { c: "kette 5", show: "längste Kette: fünf C-Atome" }], s: "CCCC(C)C",
      e: "Zwei Isomere passen: 2-Methylpentan und 3-Methylpentan. Eine Methylgruppe an C1 würde die Kette nur verlängern (Hexan)." },
    { md: "Baue ein **Isomer von Hexan**, dessen längste Kette **vier** C-Atome hat.",
      c: [{ c: "formel C6H14", show: "Summenformel " + F("C6H14") }, { c: "kette 4", show: "längste Kette: vier C-Atome" }], s: "CC(C)C(C)C",
      e: "Zwei Isomere passen: 2,2-Dimethylbutan und 2,3-Dimethylbutan." },
    { md: "Baue das **unverzweigte Alken** mit der Summenformel $\\mathrm{C_4H_8}$, das **keine E/Z-Isomerie** zeigt.",
      c: [{ c: "formel C4H8", show: "Summenformel " + F("C4H8") }, { c: "gruppe alken", show: "eine C=C-Doppelbindung" }, { c: "kette 4", show: "unverzweigt (Kette aus vier C)" }, { c: "keine ez", show: "keine E/Z-Isomerie" }], s: "C=CCC",
      e: "But-1-en: Am Ende trägt das C-Atom zwei Wasserstoffatome, darum gibt es kein E und kein Z. But-2-en hat dagegen zwei Konfigurationen." },
    { md: "Baue ein **Alken** mit der Summenformel $\\mathrm{C_4H_8}$, das **E/Z-Isomerie** zeigt.",
      c: [{ c: "formel C4H8", show: "Summenformel " + F("C4H8") }, { c: "gruppe alken", show: "eine C=C-Doppelbindung" }, { c: "mit ez", show: "E/Z-Isomerie möglich" }], s: "CC=CC",
      e: "But-2-en: Jedes C-Atom der Doppelbindung trägt zwei verschiedene Reste (H und CH₃). Darum gibt es (E)- und (Z)-But-2-en." },
    { md: "Baue das **Cycloalkan**, das ein Isomer von Propen ist.",
      c: [{ c: "formel C3H6", show: "Summenformel " + F("C3H6") }, { c: "ring 3", show: "ein Dreiring" }], s: "C1CC1",
      e: "Cyclopropan: Ein Ring spart wie eine Doppelbindung zwei H-Atome, darum haben beide $\\mathrm{C_3H_6}$." },
    { md: "Baue das **Isomer von Butan**, das kein Butan ist.",
      c: [{ c: "formel C4H10", show: "Summenformel " + F("C4H10") }, { c: "nicht CCCC", show: "nicht die unverzweigte Kette" }], s: "CC(C)C",
      e: "2-Methylpropan (Isobutan) ist das einzige weitere Isomer von $\\mathrm{C_4H_{10}}$." },
    { md: "Baue ein **Isomer von Cyclohexan**, das keinen Ring hat.",
      c: [{ c: "formel C6H12", show: "Summenformel " + F("C6H12") }, { c: "gruppe alken", show: "statt des Rings eine Doppelbindung" }], s: "C=CCCCC",
      e: "Jedes Hexen passt, zum Beispiel Hex-1-en: Eine Doppelbindung ersetzt den Ring, die Summenformel bleibt $\\mathrm{C_6H_{12}}$." },
  ];
  const ALK4 = [
    ["(E)-But-2-en", "CC=CC", "E", "Die beiden Methylgruppen stehen auf entgegengesetzten Seiten der Doppelbindung (entgegen)."],
    ["(Z)-But-2-en", "CC=CC", "Z", "Die beiden Methylgruppen stehen auf derselben Seite der Doppelbindung (zusammen)."],
    ["(E)-1,2-Dichlorethen", "ClC=CCl", "E", "Die Chloratome stehen auf entgegengesetzten Seiten."],
    ["(Z)-Pent-2-en", "CCC=CC", "Z", "Methyl- und Ethylgruppe auf derselben Seite der Doppelbindung zwischen C2 und C3."],
    ["1,2-Dimethylbenzol", "CC1=CC=CC=C1C", null, "Benzolring, zwei Methylgruppen an benachbarten C-Atomen (ortho-Xylol)."],
    ["1,4-Dimethylbenzol", "CC1=CC=C(C)C=C1", null, "Benzolring, zwei Methylgruppen einander gegenüber (para-Xylol)."],
    ["Methylbenzol (Toluol)", "CC1=CC=CC=C1", null, "Benzolring mit einer Methylgruppe."],
    ["2-Methylbuta-1,3-dien (Isopren)", "C=CC(C)=C", null, "Buta-1,3-dien mit einer Methylgruppe an C2: der Baustein der Terpene und des Naturkautschuks."],
  ];
  function alkNamed(G, list) {
    const x = G.pick(list);
    const [name, smi, why, st] = list === ALK4 ? [x[0], x[1], x[3], x[2]] : x;
    const C = LW.labChem, A = C.analyze(C.parseSmiles(smi));
    const extra = [];
    if (A.ring.benzene.length) extra.push({ c: "aromat", show: "ein Benzolring" });
    else if (A.ring.rings.length) extra.push({ c: "ring " + A.ring.rings[0].length, show: "ein Ring aus " + A.ring.rings[0].length + " C-Atomen" });
    if (A.groups.some((g) => g.type === "alken")) extra.push({ c: "gruppe alken", show: "eine C=C-Doppelbindung" });
    if (A.groups.some((g) => g.type === "alkin")) extra.push({ c: "gruppe alkin", show: "eine C≡C-Dreifachbindung" });
    const conds = named(name.replace(/ \(.*\)$/, "").replace(/^\([EZ]\)-/, ""), smi, extra);
    if (st) conds.push({ c: "ez " + st, show: "Konfiguration " + st + " (" + (st === "E" ? "entgegen" : "zusammen") + ")" });
    return mol("Baue **" + name + "**.", conds, { smiles: smi, stereo: st || undefined },
      st ? BUILD + " Mit »Stereo umkehren« und einem Tipp auf die Doppelbindung wechselst du zwischen E und Z." : BUILD,
      why + " Summenformel " + F(C.formula(C.parseSmiles(smi))) + ".");
  }
  gen("lab-alkane", {
    title: "Kohlenwasserstoffe bauen",
    make(level, G) {
      if (level === 1) return alkNamed(G, ALK1);
      if (level === 2) return alkNamed(G, ALK2);
      if (level === 3) { const t = G.pick(ALK3); return mol(t.md, t.c, t.s, "Zähle zuerst die C-Atome der Summenformel, dann überlege, wie lang die Hauptkette sein darf.", t.e); }
      return alkNamed(G, ALK4);
    },
  });

  // ---------------------------------------------------------------- functional groups
  const ORG1 = [
    ["Methanol", "CO", "alkohol"], ["Ethanol", "CCO", "alkohol"], ["Propan-1-ol", "CCCO", "alkohol"], ["Propan-2-ol", "CC(C)O", "alkohol"],
    ["Butan-1-ol", "CCCCO", "alkohol"], ["Chlormethan", "CCl", "halogen"], ["Chlorethan", "CCCl", "halogen"], ["2-Chlorpropan", "CC(Cl)C", "halogen"],
    ["1,2-Dibromethan", "BrCCBr", "halogen"], ["Trichlormethan (Chloroform)", "ClC(Cl)Cl", "halogen"], ["Methanamin", "CN", "amin"], ["Ethanamin", "CCN", "amin"],
  ];
  const ORG2 = [
    ["Ethanal", "CC=O", "aldehyd"], ["Propanal", "CCC=O", "aldehyd"], ["Propanon (Aceton)", "CC(C)=O", "keton"], ["Butanon", "CCC(C)=O", "keton"],
    ["Methansäure", "OC=O", "carbonsaeure"], ["Ethansäure", "CC(=O)O", "carbonsaeure"], ["Propansäure", "CCC(=O)O", "carbonsaeure"],
    ["Methoxymethan", "COC", "ether"], ["Methoxyethan", "CCOC", "ether"], ["Ethanamid", "CC(N)=O", "amid"], ["Ethan-1,2-diol", "OCCO", "alkohol"], ["Butan-2-ol", "CCC(C)O", "alkohol"],
  ];
  const GROUP_SHOW = { alkohol: "eine Hydroxygruppe", halogen: "ein Halogenatom", amin: "eine Aminogruppe", aldehyd: "eine Aldehydgruppe", keton: "eine Ketogruppe",
    carbonsaeure: "eine Carboxygruppe", ether: "eine Ethergruppe", amid: "eine Amidgruppe", ester: "eine Estergruppe" };
  const GROUP_WHY = {
    alkohol: "Die Hydroxygruppe –OH hängt an einem C-Atom mit nur Einfachbindungen; die Endung ist -ol.",
    halogen: "Halogenatome stehen als Vorsilbe (Fluor, Chlor, Brom, Iod) mit der Nummer ihres C-Atoms.",
    amin: "Die Aminogruppe –NH₂ gibt die Endung -amin.",
    aldehyd: "Die Aldehydgruppe –CHO sitzt am Kettenende: C mit Doppelbindung zu O und einem H. Endung -al.",
    keton: "Die Ketogruppe C=O liegt innerhalb der Kette, zwischen zwei C-Atomen. Endung -on.",
    carbonsaeure: "Die Carboxygruppe –COOH: ein C-Atom mit =O und –OH am Kettenende. Endung -säure; das C der Gruppe zählt mit.",
    ether: "In einem Ether verbindet ein O-Atom zwei Kohlenstoffreste; benannt wird mit der Vorsilbe Alkoxy.",
    amid: "Die Amidgruppe: C=O mit einer NH₂-Gruppe am selben C-Atom. Endung -amid.",
  };
  const ORG3 = [
    { md: "Baue einen **sekundären Alkohol** mit vier C-Atomen.", c: [{ c: "formel C4H10O", show: "Summenformel " + F("C4H10O") }, { c: "gruppe alkohol 2", show: "sekundär: das C-Atom mit –OH hat zwei C-Nachbarn" }], s: "CCC(C)O",
      e: "Butan-2-ol: Das C-Atom mit der Hydroxygruppe trägt zwei weitere C-Atome. Es ist der einzige sekundäre Alkohol mit vier C." },
    { md: "Baue einen **tertiären Alkohol** mit vier C-Atomen.", c: [{ c: "formel C4H10O", show: "Summenformel " + F("C4H10O") }, { c: "gruppe alkohol 3", show: "tertiär: das C-Atom mit –OH hat drei C-Nachbarn" }], s: "CC(C)(C)O",
      e: "2-Methylpropan-2-ol: Das C-Atom mit der OH-Gruppe ist mit drei C-Atomen verbunden. Tertiäre Alkohole lassen sich nicht partiell oxidieren." },
    { md: "Baue einen **verzweigten primären Alkohol** mit vier C-Atomen.", c: [{ c: "formel C4H10O", show: "Summenformel " + F("C4H10O") }, { c: "gruppe alkohol 1", show: "primär" }, { c: "kette 3", show: "verzweigt: längste Kette drei C" }], s: "CC(C)CO",
      e: "2-Methylpropan-1-ol: Die OH-Gruppe sitzt an einem C-Atom mit nur einem C-Nachbarn, die Kette ist verzweigt." },
    { md: "Baue ein **Keton** mit fünf C-Atomen.", c: [{ c: "formel C5H10O", show: "Summenformel " + F("C5H10O") }, { c: "gruppe keton", show: "eine Ketogruppe" }], s: "CCCC(C)=O",
      e: "Drei Ketone passen: Pentan-2-on, Pentan-3-on und 3-Methylbutan-2-on. Am Kettenende wäre es ein Aldehyd." },
    { md: "Baue einen **Aldehyd** mit vier C-Atomen.", c: [{ c: "formel C4H8O", show: "Summenformel " + F("C4H8O") }, { c: "gruppe aldehyd", show: "eine Aldehydgruppe" }], s: "CCCC=O",
      e: "Butanal oder 2-Methylpropanal: Die Aldehydgruppe sitzt immer am Kettenende." },
    { md: "Baue den **Ether**, der ein Isomer von Ethanol ist.", c: [{ c: "formel C2H6O", show: "Summenformel " + F("C2H6O") }, { c: "gruppe ether", show: "eine Ethergruppe" }], s: "COC",
      e: "Methoxymethan (Dimethylether): Das O-Atom steht zwischen den beiden C-Atomen statt am Ende." },
    { md: "Baue das **Keton**, das ein Isomer von Propanal ist.", c: [{ c: "formel C3H6O", show: "Summenformel " + F("C3H6O") }, { c: "gruppe keton", show: "eine Ketogruppe" }], s: "CC(C)=O",
      e: "Propanon (Aceton): Die C=O-Gruppe wandert vom Ende in die Mitte." },
    { md: "Baue die **Carbonsäure** mit der Summenformel $\\mathrm{C_2H_4O_2}$.", c: [{ c: "formel C2H4O2", show: "Summenformel " + F("C2H4O2") }, { c: "gruppe carbonsaeure", show: "eine Carboxygruppe" }], s: "CC(=O)O",
      e: "Ethansäure (Essigsäure). Ein Isomer derselben Formel ist der Ester Methansäuremethylester." },
    { md: "Baue den **Ester aus Ethansäure und Methanol**.", c: [{ c: "gruppe ester", show: "eine Estergruppe" }, { c: "ziel CC(=O)OC", show: "Ethansäuremethylester" }], s: "CC(=O)OC",
      e: "Bei der Veresterung verbindet sich die Carboxygruppe mit der OH-Gruppe unter Abspaltung von Wasser: $\\mathrm{CH_3COOCH_3}$, Ethansäuremethylester (Methylethanoat)." },
    { md: "Baue einen **Ester** mit der Summenformel $\\mathrm{C_4H_8O_2}$.", c: [{ c: "formel C4H8O2", show: "Summenformel " + F("C4H8O2") }, { c: "gruppe ester", show: "eine Estergruppe" }], s: "CCOC(C)=O",
      e: "Vier Ester passen, zum Beispiel Ethansäureethylester, Propansäuremethylester oder Methansäurepropylester." },
  ];
  const ORG4 = [
    { md: "**Partielle Oxidation:** Wandle Propan-1-ol in den Aldehyd um.", start: "CCCO", s: "CCC=O", c: [{ c: "gruppe aldehyd", show: "eine Aldehydgruppe" }, { c: "ziel CCC=O", show: "Propanal" }],
      e: "Ein primärer Alkohol wird zum Aldehyd oxidiert: Die OH-Gruppe wird zu =O, das C-Atom verliert ein H. Aus Propan-1-ol wird Propanal." },
    { md: "**Partielle Oxidation:** Wandle Propan-2-ol in das Keton um.", start: "CC(C)O", s: "CC(C)=O", c: [{ c: "gruppe keton", show: "eine Ketogruppe" }, { c: "ziel CC(C)=O", show: "Propanon" }],
      e: "Ein sekundärer Alkohol wird zum Keton oxidiert: Aus Propan-2-ol wird Propanon." },
    { md: "**Weitere Oxidation:** Wandle Ethanal in die Carbonsäure um.", start: "CC=O", s: "CC(=O)O", c: [{ c: "gruppe carbonsaeure", show: "eine Carboxygruppe" }, { c: "ziel CC(=O)O", show: "Ethansäure" }],
      e: "Aldehyde werden weiter zur Carbonsäure oxidiert: Am Carbonyl-C kommt eine OH-Gruppe dazu. Aus Ethanal wird Ethansäure." },
    { md: "**Veresterung:** Mache aus Ethansäure den Ester mit Ethanol.", start: "CC(=O)O", s: "CCOC(C)=O", c: [{ c: "gruppe ester", show: "eine Estergruppe" }, { c: "ziel CCOC(C)=O", show: "Ethansäureethylester" }],
      e: "Am O-Atom der OH-Gruppe wird statt des H eine Ethylgruppe angebaut: Ethansäureethylester (Essigsäureethylester)." },
    { md: "**Addition:** Lagere Brom an Ethen an.", start: "C=C", s: "BrCCBr", c: [{ c: "ohne gruppe alken", show: "keine Doppelbindung mehr" }, { c: "ziel BrCCBr", show: "1,2-Dibromethan" }],
      e: "Bei der elektrophilen Addition wird die Doppelbindung zur Einfachbindung, an jedes C-Atom tritt ein Bromatom: 1,2-Dibromethan." },
    { md: "**Hydratisierung:** Lagere Wasser an Ethen an.", start: "C=C", s: "CCO", c: [{ c: "gruppe alkohol", show: "eine Hydroxygruppe" }, { c: "ziel CCO", show: "Ethanol" }],
      e: "H tritt an das eine, OH an das andere C-Atom; aus Ethen wird Ethanol." },
    { md: "Baue **Milchsäure** (2-Hydroxypropansäure).", start: "C", s: "CC(O)C(=O)O", c: [{ c: "gruppe carbonsaeure", show: "eine Carboxygruppe" }, { c: "gruppe alkohol", show: "eine Hydroxygruppe" }, { c: "ziel CC(O)C(=O)O", show: "2-Hydroxypropansäure" }],
      e: "Propansäure mit einer OH-Gruppe an C2; das C-Atom der Carboxygruppe ist C1." },
    { md: "Baue **Glycerin** (Propan-1,2,3-triol).", start: "C", s: "OCC(O)CO", c: [{ c: "formel C3H8O3", show: "Summenformel " + F("C3H8O3") }, { c: "ziel OCC(O)CO", show: "Propan-1,2,3-triol" }],
      e: "Jedes der drei C-Atome trägt eine Hydroxygruppe. Glycerin ist der Alkoholbaustein der Fette." },
  ];
  gen("lab-organik", {
    title: "Funktionelle Gruppen bauen",
    make(level, G) {
      if (level <= 2) {
        const [name, smi, grp] = G.pick(level === 1 ? ORG1 : ORG2);
        const conds = named(name.replace(/ \(.*\)$/, ""), smi, [{ c: "gruppe " + grp, show: GROUP_SHOW[grp] }]);
        return mol("Baue **" + name + "**.", conds, smi, BUILD + " Mit der Taste »=« baust du Doppelbindungen, etwa für C=O.", GROUP_WHY[grp] + " Summenformel " + F(LW.labChem.formula(LW.labChem.parseSmiles(smi))) + ".");
      }
      const t = G.pick(level === 3 ? ORG3 : ORG4);
      return mol(t.md, t.c, t.s, level === 3 ? "Die Summenformel legt die Atome fest; die funktionelle Gruppe und ihr Platz entscheiden, welches Isomer es ist." : "Ändere nur, was die Reaktion ändert: Bindungen antippen, Atome ersetzen oder anbauen.", t.e, { start: t.start || "C" });
    },
  });

  // ---------------------------------------------------------------- stereochemistry
  const ST1 = [
    { md: "Baue ein **chirales** Molekül mit der Summenformel $\\mathrm{C_4H_{10}O}$.", c: [{ c: "formel C4H10O", show: "Summenformel " + F("C4H10O") }, { c: "chiral", show: "mindestens ein Stereozentrum" }], s: "CCC(C)O",
      e: "Butan-2-ol: C2 trägt vier verschiedene Reste (H, OH, CH₃, C₂H₅). Alle anderen Isomere haben kein solches C-Atom." },
    { md: "Baue ein **chirales** Molekül mit der Summenformel $\\mathrm{C_4H_9Cl}$.", c: [{ c: "formel C4H9Cl", show: "Summenformel " + F("C4H9Cl") }, { c: "chiral", show: "mindestens ein Stereozentrum" }], s: "CCC(C)Cl",
      e: "2-Chlorbutan: An C2 hängen H, Cl, CH₃ und C₂H₅." },
    { md: "Baue einen **achiralen** Alkohol mit der Summenformel $\\mathrm{C_4H_{10}O}$.", c: [{ c: "formel C4H10O", show: "Summenformel " + F("C4H10O") }, { c: "gruppe alkohol", show: "eine Hydroxygruppe" }, { c: "achiral", show: "kein Stereozentrum" }], s: "CCCCO",
      e: "Butan-1-ol, 2-Methylpropan-1-ol und 2-Methylpropan-2-ol sind achiral; nur Butan-2-ol hat ein Stereozentrum." },
    { md: "Baue einen **chiralen Alkohol** mit fünf C-Atomen.", c: [{ c: "formel C5H12O", show: "Summenformel " + F("C5H12O") }, { c: "gruppe alkohol", show: "eine Hydroxygruppe" }, { c: "chiral", show: "mindestens ein Stereozentrum" }], s: "CCCC(C)O",
      e: "Zum Beispiel Pentan-2-ol, 3-Methylbutan-2-ol oder 2-Methylbutan-1-ol: Jedes hat ein C-Atom mit vier verschiedenen Resten." },
  ];
  const ST2 = [
    ["(R)-Butan-2-ol", "CCC(C)O", "R", "Prioritäten an C2: OH > C₂H₅ > CH₃ > H."],
    ["(S)-Butan-2-ol", "CCC(C)O", "S", "Prioritäten an C2: OH > C₂H₅ > CH₃ > H."],
    ["(S)-2-Chlorbutan", "CCC(C)Cl", "S", "Prioritäten an C2: Cl > C₂H₅ > CH₃ > H."],
    ["(R)-2-Brombutan", "CCC(C)Br", "R", "Prioritäten an C2: Br > C₂H₅ > CH₃ > H."],
    ["(S)-Milchsäure (L-Milchsäure)", "CC(O)C(=O)O", "S", "Prioritäten an C2: OH > COOH > CH₃ > H."],
    ["(R)-Glycerinaldehyd (D-Glycerinaldehyd)", "OCC(O)C=O", "R", "Prioritäten an C2: OH > CHO > CH₂OH > H. D-Glycerinaldehyd ist der Bezugspunkt der D/L-Reihe."],
  ];
  const ST3 = [
    ["(E)-But-2-en", "CC=CC", "E"], ["(Z)-But-2-en", "CC=CC", "Z"], ["(E)-1,2-Dichlorethen", "ClC=CCl", "E"], ["(Z)-Pent-2-en", "CCC=CC", "Z"],
    ["Maleinsäure, (Z)-Butendisäure", "OC(=O)C=CC(=O)O", "Z"], ["Fumarsäure, (E)-Butendisäure", "OC(=O)C=CC(=O)O", "E"],
  ];
  const CIP = "So bestimmst du R oder S: Rang nach der Ordnungszahl der direkt gebundenen Atome (bei Gleichstand eine Sphäre weiter). Schaue so, dass der Rest mit dem kleinsten Rang nach hinten zeigt; läuft 1 → 2 → 3 im Uhrzeigersinn, ist es R, sonst S.";
  gen("lab-stereo", {
    title: "Stereochemie bauen",
    make(level, G) {
      if (level === 1) { const t = G.pick(ST1); return mol(t.md, t.c, t.s, "Ein Stereozentrum ist ein C-Atom mit vier verschiedenen Resten.", t.e); }
      if (level === 2) {
        const [name, smi, st, why] = G.pick(ST2);
        const conds = named(name.replace(/^\([RS]\)-/, "").replace(/ \(.*\)$/, ""), smi, []);
        conds.push({ c: "stereo " + st, show: "Konfiguration " + st });
        return mol("Baue **" + name + "**. Das Labor zeigt am Stereozentrum R oder S; mit »Stereo umkehren« tauschst du zwei Reste.", conds, { smiles: smi, stereo: st }, CIP, why + " " + CIP);
      }
      if (level === 3) {
        const [name, smi, st] = G.pick(ST3);
        const conds = named(name.replace(/^\([EZ]\)-/, "").replace(/, .*$/, "").replace(/^.*, /, ""), smi, []);
        conds.push({ c: "ez " + st, show: "Konfiguration " + st + " (" + (st === "E" ? "entgegen" : "zusammen") + ")" });
        return mol("Baue **" + name + "**.", conds, { smiles: smi, stereo: st }, "Bei E/Z vergleichst du an jedem C-Atom der Doppelbindung die beiden Reste nach Priorität. Liegen die beiden höherrangigen auf derselben Seite, ist es Z.",
          "An beiden C-Atomen der Doppelbindung hat der Rest außer H den höheren Rang. " + (st === "Z" ? "Sie liegen auf derselben Seite: Z (zusammen)." : "Sie liegen auf entgegengesetzten Seiten: E (entgegen)."));
      }
      // the mirror image of a given molecule
      const pool = ST2.map(([n, s, st, w]) => ({ n, s, st, w })).concat([{ n: "(S)-Alanin (L-Alanin)", s: "NC(C)C(=O)O", st: "S", w: "Prioritäten: NH₂ > COOH > CH₃ > H." }]);
      const t = G.pick(pool);
      const other = t.st === "R" ? "S" : "R";
      const base = t.n.replace(/^\([RS]\)-/, "").replace(/ \(.*\)$/, "");
      return mol("Im Labor liegt **" + t.n + "**. Baue sein **Enantiomer**, das Spiegelbild.", [{ c: "ziel " + t.s, show: "dieselbe Konstitution: " + base }, { c: "stereo " + other, show: "Konfiguration " + other }],
        { smiles: t.s, stereo: other }, "Enantiomere unterscheiden sich nur in der Konfiguration: Tausche am Stereozentrum zwei Reste.", t.w + " Aus " + t.st + " wird " + other + ".", { start: t.s, startStereo: t.st });
    },
  });

  // ---------------------------------------------------------------- amino acids and peptides
  const AA = {
    Gly: ["Glycin", "NCC(=O)O"], Ala: ["Alanin", "NC(C)C(=O)O"], Ser: ["Serin", "NC(CO)C(=O)O"], Cys: ["Cystein", "NC(CS)C(=O)O"],
    Val: ["Valin", "NC(C(C)C)C(=O)O"], Leu: ["Leucin", "NC(CC(C)C)C(=O)O"], Phe: ["Phenylalanin", "NC(CC1=CC=CC=C1)C(=O)O"], Pro: ["Prolin", "N1CCCC1C(=O)O"],
  };
  const SIDE = { Gly: "H", Ala: "eine Methylgruppe –CH₃", Ser: "–CH₂OH", Cys: "–CH₂SH", Val: "eine Isopropylgruppe –CH(CH₃)₂", Leu: "–CH₂CH(CH₃)₂" };
  /** Peptide SMILES from codes, N-terminus first: every residue but the last loses the OH of its carboxy group. */
  const peptideSmiles = (codes) => codes.map((c, k) => (k < codes.length - 1 ? AA[c][1].replace(/O$/, "") : AA[c][1])).join("");
  gen("lab-aminosaeure", {
    title: "Aminosäuren und Peptide bauen",
    make(level, G) {
      if (level === 1) {
        const code = G.pick(["Gly", "Ala", "Ser", "Cys", "Val"]);
        const [name, smi] = AA[code];
        const conds = named(name, smi, [{ c: "gruppe amin", show: "eine Aminogruppe" }, { c: "gruppe carbonsaeure", show: "eine Carboxygruppe" }]);
        return mol("Baue die Aminosäure **" + name + "** (" + code + ").", conds, smi, "Jede Aminosäure hat ein zentrales C-Atom (Cα) mit einer Aminogruppe, einer Carboxygruppe, einem H und einer Seitenkette.",
          "Am Cα von " + name + " sitzen –NH₂, –COOH, H und als Seitenkette " + SIDE[code] + ".");
      }
      if (level === 2) {
        const code = G.pick(["Ala", "Ser", "Cys", "Val", "Leu"]);
        const [name, smi] = AA[code];
        const st = code === "Cys" ? "R" : "S";
        const conds = named(name, smi, []);
        conds.push({ c: "stereo " + st, show: "L-Konfiguration: hier " + st });
        return mol("Baue **L-" + name + "**, die Form, die in Proteinen vorkommt.", conds, { smiles: smi, stereo: st },
          "L-Aminosäuren sind fast immer (S)-konfiguriert. Ausnahme ist Cystein: Das Schwefelatom der Seitenkette hebt deren Rang über die Carboxygruppe, darum ist L-Cystein (R).",
          "Prioritäten am Cα von " + name + ": " + (code === "Cys" ? "NH₂ > CH₂SH > COOH > H" : "NH₂ > COOH > Seitenkette > H") + ". In der L-Form ergibt das " + st + ".");
      }
      if (level === 3) {
        const seqs = [["Gly", "Ala"], ["Ala", "Gly"], ["Gly", "Ser", "Ala"], ["Ala", "Cys"], ["Ser", "Gly", "Val"], ["Cys", "Gly", "Cys"], ["Val", "Ala", "Gly"], ["Gly", "Pro", "Ala"]];
        const seq = G.pick(seqs);
        const pool = ["Gly", "Ala", "Ser", "Cys", "Val", "Pro"];
        const blocks = G.shuffle([...new Set(seq.slice(1).concat(G.pickN(pool, 3)))]);
        const word = seq.length === 2 ? "Dipeptid" : "Tripeptid";
        return mol("Baue das " + word + " **" + seq.join("-") + "**. Im Labor liegt schon " + AA[seq[0]][0] + "; die Knöpfe hängen Aminosäuren am C-Terminus an.",
          [{ c: "reste " + seq.length, show: seq.length + " Aminosäuren" }, { c: "nterm " + seq[0], show: "N-Terminus: " + seq[0] }, { c: "cterm " + seq[seq.length - 1], show: "C-Terminus: " + seq[seq.length - 1] }, { c: "peptid " + seq.join("-"), show: "Reihenfolge " + seq.join("-") }],
          peptideSmiles(seq), "Peptide liest man vom N-Terminus (freie Aminogruppe) zum C-Terminus (freie Carboxygruppe).",
          "Bei jeder Peptidbindung reagiert die Carboxygruppe der einen mit der Aminogruppe der nächsten Aminosäure; Wasser wird abgespalten. Die Reihenfolge " + seq.join("-") + " entsteht, wenn du in dieser Reihenfolge anhängst.",
          { start: AA[seq[0]][1], blocks });
      }
      const t = G.pick([
        { md: "Baue ein **Tripeptid**, das mit Glycin beginnt und eine **Thiolgruppe** enthält.", start: "Gly", seq: ["Gly", "Cys", "Ala"], c: [{ c: "reste 3", show: "drei Aminosäuren" }, { c: "nterm Gly", show: "N-Terminus: Gly" }, { c: "gruppe thiol", show: "eine Thiolgruppe (Cystein)" }],
          e: "Eine Thiolgruppe bringt nur Cystein mit; zum Beispiel Gly-Cys-Ala oder Gly-Ala-Cys." },
        { md: "Baue ein **Dipeptid** aus Alanin und Glycin, bei dem Glycin den **C-Terminus** bildet.", start: "Ala", seq: ["Ala", "Gly"], c: [{ c: "reste 2", show: "zwei Aminosäuren" }, { c: "cterm Gly", show: "C-Terminus: Gly" }, { c: "nterm Ala", show: "N-Terminus: Ala" }],
          e: "Ala-Gly: Die Carboxygruppe von Alanin bildet die Peptidbindung, Glycin behält seine freie Carboxygruppe." },
        { md: "Baue ein **Tripeptid** mit genau **zwei Stereozentren**, das mit Serin beginnt.", start: "Ser", seq: ["Ser", "Gly", "Ala"],
          c: [{ c: "reste 3", show: "drei Aminosäuren" }, { c: "nterm Ser", show: "N-Terminus: Ser" }, { c: "stereozentren 2", show: "genau zwei Stereozentren" }],
          e: "Glycin hat kein Stereozentrum. Serin, Glycin und eine weitere chirale Aminosäure ergeben genau zwei, etwa Ser-Gly-Ala." },
        { md: "Baue ein **Tripeptid** mit zwei **Cysteinen**, die eine Disulfidbrücke bilden könnten, und Glycin in der Mitte.", start: "Cys", seq: ["Cys", "Gly", "Cys"], c: [{ c: "peptid Cys-Gly-Cys", show: "Cys-Gly-Cys" }],
          e: "Cys-Gly-Cys: Die beiden SH-Gruppen können zu einer Disulfidbrücke –S–S– oxidiert werden." },
      ]);
      const conds = t.c.slice();
      const blocks = G.shuffle(["Gly", "Ala", "Ser", "Cys", "Val"]);
      return mol(t.md, conds, peptideSmiles(t.seq), "Hänge die Aminosäuren in der richtigen Reihenfolge an; die Liste zeigt, was schon stimmt.", t.e, { start: AA[t.start][1], blocks });
    },
  });

  // ---------------------------------------------------------------- folding
  const MOVE = { "1,0,0": "R", "-1,0,0": "L", "0,1,0": "U", "0,-1,0": "D", "0,0,1": "F", "0,0,-1": "B" };
  /** A path through every cell of an a×b×c box (random, by depth-first search with Warnsdorff's rule). */
  function boxPath(G, a, b, c) {
    const total = a * b * c, inside = (q) => q[0] >= 0 && q[1] >= 0 && q[2] >= 0 && q[0] < a && q[1] < b && q[2] < c;
    const nbs = (q) => [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((d) => [q[0] + d[0], q[1] + d[1], q[2] + d[2]]).filter(inside);
    const key = (q) => q.join();
    for (let attempt = 0; attempt < 60; attempt++) {
      const start = [G.int(0, a - 1), G.int(0, b - 1), G.int(0, c - 1)];
      const path = [start], seen = new Set([key(start)]);
      let steps = 0;
      const dfs = () => {
        if (path.length === total) return true;
        if (++steps > 4000) return false;
        const cur = path[path.length - 1];
        const opts = G.shuffle(nbs(cur).filter((q) => !seen.has(key(q)))).sort((p, q) => nbs(p).filter((x) => !seen.has(key(x))).length - nbs(q).filter((x) => !seen.has(key(x))).length);
        for (const q of opts) {
          path.push(q); seen.add(key(q));
          if (dfs()) return true;
          path.pop(); seen.delete(key(q));
        }
        return false;
      };
      if (dfs()) return path;
    }
    return null;
  }
  gen("lab-faltung", {
    title: "Proteine falten (HP-Modell)",
    make(level, G) {
      const box = level === 1 ? [3, 3, 1] : level === 2 ? G.pick([[4, 3, 1], [4, 4, 1]]) : level === 3 ? G.pick([[2, 2, 2], [3, 2, 2]]) : [3, 3, 2];
      const path = boxPath(G, box[0], box[1], box[2]);
      const n = path.length;
      const touch = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) === 1;
      // residues with many lattice neighbours that are not chain neighbours become hydrophobic
      const free = path.map((p, i) => path.filter((q, j) => Math.abs(i - j) > 1 && touch(p, q)).length);
      const tie = path.map(() => G.r());
      const order = path.map((p, i) => i).sort((i, j) => free[j] - free[i] || tie[i] - tie[j]);
      const seq = path.map(() => "P");
      order.slice(0, Math.round(n * 0.45)).forEach((i) => { seq[i] = "H"; });
      const conds = [];
      let cys = null;
      if (level === 4) {
        const pairs = [];
        for (let i = 0; i < n; i++) for (let j = i + 3; j < n; j++) if (touch(path[i], path[j])) pairs.push([i, j]);
        cys = G.pick(pairs);
        seq[cys[0]] = "C"; seq[cys[1]] = "C";
      }
      let k = 0;
      for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (seq[i] === "H" && seq[j] === "H" && touch(path[i], path[j])) k++;
      const goal = level <= 2 ? Math.max(1, k - 1) : k;
      const moves = path.slice(1).map((q, i) => MOVE[[q[0] - path[i][0], q[1] - path[i][1], q[2] - path[i][2]].join()]).join("");
      conds.push({ c: "kontakte " + goal, show: "mindestens " + goal + " H-H-Kontakte (Energie höchstens −" + goal + ")" });
      if (cys) conds.push({ c: "nachbarn " + (cys[0] + 1) + "," + (cys[1] + 1), show: "Disulfidbrücke: Rest " + (cys[0] + 1) + " berührt Rest " + (cys[1] + 1) });
      const dims = box[2] === 1 ? 2 : 3;
      return {
        type: "widget", widget: "faltung", label: "Faltungslabor",
        md: "Falte die Kette **" + seq.join("") + "** (" + (dims === 2 ? "in der Ebene" : "im Raum") + ") so, dass die hydrophoben Reste (orange) möglichst oft aneinanderstoßen. " +
          (cys ? "Die beiden Cysteine (gelb) sollen sich berühren. " : "") + "Tippe einen Rest an und drehe oder spiegle dann die kürzere Teilkette.",
        params: { seq: seq.join(""), dims, task: { conditions: conds, sample: moves } },
        goal: {},
        hint: "Hydrophobe Reste gehören nach innen, polare nach außen. Falte zuerst grob zu einer kompakten Form, dann tausche einzelne Ecken.",
        explain: "Im HP-Modell zählt jede Berührung zweier hydrophober Reste, die in der Kette nicht benachbart sind, als Kontakt und senkt die Energie um eins. " +
          "Eine kompakte Faltung in einem " + box.filter((x) => x > 1).join(" × ") + "-Block erreicht hier " + k + " Kontakte. So entsteht auch in echten Proteinen ein hydrophober Kern, umgeben von polaren Resten.",
      };
    },
  });
})();
