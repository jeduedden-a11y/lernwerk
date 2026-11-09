/* Task generators for economics: micro, macro and the history of ideas; level 1 (Leicht) to 4 (Experte). */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const num = (md, answer, o) => Object.assign({ type: "numeric", md, answer, tolerance: 1e-6, placeholder: "Zahl" }, o || {});
  const tf = (md, answer, explain, whyNot) => ({ type: "truefalse", md, answer, explain, whyNot: answer ? null : whyNot || null });
  const dec = (G, v, d) => ({ tolerance: Math.pow(10, -d) * 0.6, answerText: G.fmt(v, d) });
  const lin = (G, a, m, v) => G.tex(a, 2) + (m < 0 ? " - " : " + ") + (Math.abs(m) === 1 ? "" : G.tex(Math.abs(m), 2)) + v;
  /** A linear market with integer equilibrium: demand P = a - bQ, supply P = c + dQ. */
  function market(G) {
    const b = G.pick([0.5, 1, 1, 2]), d = G.pick([0.5, 1, 1, 2]), Q = G.int(2, 8), c = G.int(1, 4);
    const P = c + d * Q, a = P + b * Q;
    return { a, b, c, d, Q, P, txt: "Nachfrage $P = " + lin(G, a, -b, "Q") + "$, Angebot $P = " + lin(G, c, d, "Q") + "$." };
  }
  const pool = (G, items) => { const [md, ans, why] = G.pick(items); return tf(md, ans, why, why); };

  // ---------------------------------------------------------------- micro

  gen("oek-markt", {
    title: "Marktgleichgewicht",
    make(level, G) {
      const M = market(G);
      if (level === 1) return num(M.txt + " Wie hoch ist der Gleichgewichtspreis?", M.P, { hint: "Setze beide Preise gleich und löse nach $Q$ auf.", explain: "$" + lin(G, M.a, -M.b, "Q") + " = " + lin(G, M.c, M.d, "Q") + "$ ergibt $Q^* = " + M.Q + "$ und $P^* = " + G.tex(M.P, 2) + "$." });
      if (level === 2) {
        const k = G.pick([-3, -2, -1, 1, 2, 3]), Q2 = (M.a + k - M.c) / (M.b + M.d);
        return num(M.txt + " Die Nachfrage verschiebt sich um $" + Math.abs(k) + "$ nach " + (k > 0 ? "oben" : "unten") + " (Zahlungsbereitschaft je Menge " + (k > 0 ? "steigt" : "sinkt") + " um $" + Math.abs(k) + "$). Wie groß ist die neue Gleichgewichtsmenge? (zwei Nachkommastellen)", Q2, Object.assign({ explain: "Neue Nachfrage $P = " + lin(G, M.a + k, -M.b, "Q") + "$. Gleichsetzen: $Q = \\tfrac{" + G.tex(M.a + k - M.c, 2) + "}{" + G.tex(M.b + M.d, 2) + "} \\approx " + G.tex(Q2, 2) + "$. " + (k > 0 ? "Mehr Nachfrage: Menge und Preis steigen." : "Weniger Nachfrage: Menge und Preis sinken.") }, dec(G, Q2, 2)));
      }
      if (level === 3) {
        const p = M.P - G.int(1, Math.max(1, Math.floor(M.P - M.c - 0.5)));
        const qd = (M.a - p) / M.b, qs = (p - M.c) / M.d;
        return num(M.txt + " Der Preis ist auf $" + G.tex(p, 2) + "$ festgesetzt. Wie groß ist der **Nachfrageüberhang** $Q_N - Q_A$? (zwei Nachkommastellen)", qd - qs, Object.assign({ explain: "$Q_N = \\tfrac{" + G.tex(M.a, 2) + " - " + G.tex(p, 2) + "}{" + G.tex(M.b, 2) + "} = " + G.tex(qd, 2) + "$, $Q_A = \\tfrac{" + G.tex(p, 2) + " - " + G.tex(M.c, 2) + "}{" + G.tex(M.d, 2) + "} = " + G.tex(qs, 2) + "$. Unter dem Gleichgewichtspreis wollen mehr kaufen, als verkaufen wollen." }, dec(G, qd - qs, 2)));
      }
      const S = G.pick([
        ["Die Nachfrage steigt, gleichzeitig sinkt das Angebot.", "Preis steigt, Menge unbestimmt", "Beide Verschiebungen treiben den Preis nach oben. Bei der Menge wirken sie gegeneinander."],
        ["Nachfrage und Angebot steigen beide.", "Menge steigt, Preis unbestimmt", "Beide erhöhen die Menge. Beim Preis wirken sie gegeneinander."],
        ["Die Nachfrage sinkt, das Angebot steigt.", "Preis sinkt, Menge unbestimmt", "Beide senken den Preis. Bei der Menge heben sie sich teilweise auf."],
        ["Nachfrage und Angebot sinken beide.", "Menge sinkt, Preis unbestimmt", "Beide verringern die Menge. Beim Preis wirken sie gegeneinander."],
      ]);
      const opts = ["Preis steigt, Menge unbestimmt", "Menge steigt, Preis unbestimmt", "Preis sinkt, Menge unbestimmt", "Menge sinkt, Preis unbestimmt"];
      return { type: "choice", md: S[0] + " Was lässt sich ohne genaue Zahlen sicher sagen?", shuffle: false, options: opts.map((o) => (o === S[1] ? { md: o, correct: true } : { md: o })), explain: S[2] + " Welche Wirkung überwiegt, hängt davon ab, wie stark sich die Kurven verschieben." };
    },
  });

  gen("oek-elastizitaet", {
    title: "Elastizität",
    make(level, G) {
      if (level === 1) { const dp = G.pick([5, 10, 20]), dq = -G.pick([2, 5, 10, 15, 20, 30]), e = dq / dp; return num("Der Preis steigt um $" + dp + "\\,\\%$, die nachgefragte Menge sinkt um $" + -dq + "\\,\\%$. Wie groß ist die Preiselastizität der Nachfrage?", e, Object.assign({ explain: "$\\varepsilon = \\tfrac{" + dq + "\\,\\%}{" + dp + "\\,\\%} = " + G.tex(e, 2) + "$. " + (Math.abs(e) > 1 ? "Betrag größer als $1$: elastisch." : Math.abs(e) < 1 ? "Betrag kleiner als $1$: unelastisch." : "Betrag $1$: proportional.") }, dec(G, e, 2))); }
      const A = G.int(10, 30) * 2, B = G.pick([1, 2]);
      let P = G.int(2, Math.floor(A / B) - 2);
      if (2 * B * P === A) P += 1;
      const Q = A - B * P;
      if (level === 2) { const e = (-B * P) / Q; return num("Nachfrage $Q = " + A + " - " + (B === 1 ? "" : B) + "P$. Wie groß ist die Punktelastizität bei $P = " + P + "$? (zwei Nachkommastellen)", e, Object.assign({ hint: "$\\varepsilon = \\tfrac{dQ}{dP} \\cdot \\tfrac{P}{Q}$.", explain: "$\\tfrac{dQ}{dP} = -" + B + "$, $Q = " + Q + "$, also $\\varepsilon = -" + B + " \\cdot \\tfrac{" + P + "}{" + Q + "} \\approx " + G.tex(e, 2) + "$. Auf einer linearen Nachfragekurve ändert sich die Elastizität von Punkt zu Punkt." }, dec(G, e, 2))); }
      if (level === 3) {
        const e = (-B * P) / Q;
        return tf("Nachfrage $Q = " + A + " - " + (B === 1 ? "" : B) + "P$, aktueller Preis $P = " + P + "$. Eine kleine Preiserhöhung **erhöht** den Umsatz $P \\cdot Q$.", Math.abs(e) < 1, "Die Elastizität ist $" + G.tex(e, 2) + "$. " + (Math.abs(e) < 1 ? "Unelastisch: Die Menge sinkt prozentual weniger, als der Preis steigt, also wächst der Umsatz." : "Elastisch: Die Menge sinkt prozentual stärker, als der Preis steigt, also sinkt der Umsatz."), "Prüfe, ob der Betrag der Elastizität größer oder kleiner als $1$ ist.");
      }
      return num("Nachfrage $Q = " + A + " - " + (B === 1 ? "" : B) + "P$. Bei welchem Preis ist der Umsatz $P \\cdot Q$ maximal?", A / (2 * B), { hint: "Umsatz $R(P) = P(" + A + " - " + (B === 1 ? "" : B) + "P)$ ableiten.", explain: "$R'(P) = " + A + " - " + 2 * B + "P = 0$ ergibt $P = " + G.tex(A / (2 * B), 2) + "$. Genau dort ist die Elastizität $-1$: Darunter ist die Nachfrage unelastisch, darüber elastisch." });
    },
  });

  gen("oek-staat", {
    title: "Steuern und Preiskontrollen",
    make(level, G) {
      const M = market(G), t = G.pick([1, 2, 3].filter((x) => x < (M.a - M.c) * 0.6).concat([1]));
      const Qt = (M.a - M.c - t) / (M.b + M.d), Pc = M.a - M.b * Qt, Pp = Pc - t;
      const intro = M.txt + " Auf jede verkaufte Einheit wird eine Mengensteuer von $" + t + "$ erhoben. ";
      if (level === 1) return num(intro + "Welchen Preis zahlen die Käufer jetzt? (zwei Nachkommastellen)", Pc, Object.assign({ hint: "Die Angebotskurve verschiebt sich um $" + t + "$ nach oben.", explain: "Angebot mit Steuer $P = " + lin(G, M.c + t, M.d, "Q") + "$. Gleichgewicht $Q_t = " + G.tex(Qt, 2) + "$, Käuferpreis $" + G.tex(Pc, 2) + "$, Verkäufer behalten $" + G.tex(Pp, 2) + "$." }, dec(G, Pc, 2)));
      if (level === 2) return num(intro + "Wie hoch ist das Steueraufkommen? (zwei Nachkommastellen)", t * Qt, Object.assign({ explain: "Aufkommen $= t \\cdot Q_t = " + t + " \\cdot " + G.tex(Qt, 2) + " = " + G.tex(t * Qt, 2) + "$." }, dec(G, t * Qt, 2)));
      if (level === 3) { const dwl = 0.5 * t * (M.Q - Qt); return num(intro + "Wie groß ist der Wohlfahrtsverlust (das Dreieck zwischen alter und neuer Menge)? (zwei Nachkommastellen)", dwl, Object.assign({ explain: "Die Menge sinkt von $" + M.Q + "$ auf $" + G.tex(Qt, 2) + "$. Verlust $\\tfrac12 \\cdot " + t + " \\cdot " + G.tex(M.Q - Qt, 2) + " = " + G.tex(dwl, 2) + "$: Tausch, der beiden genützt hätte, findet nicht mehr statt." }, dec(G, dwl, 2))); }
      const share = M.d / (M.b + M.d);
      return num(intro + "Welchen Anteil der Steuer tragen die Käufer? (in Prozent)", 100 * share, { tolerance: 0.6, answerText: G.fmt(100 * share, 1) + " %", explain: "Der Käuferpreis steigt um $" + G.tex(Pc - M.P, 2) + "$ von $" + t + "$, also $" + G.tex(100 * share, 1) + "\\,\\%$. Allgemein: Die Seite mit der steileren Kurve, also der weniger elastischen Reaktion, trägt mehr. Wer die Steuer formal zahlt, spielt keine Rolle." });
    },
  });

  gen("oek-extern", {
    title: "Externe Effekte und öffentliche Güter",
    make(level, G) {
      const b = G.pick([1, 2]), d = G.pick([1, 2]), e = G.pick([1, 2, 3]), c = G.int(1, 3), a = c + G.int(8, 14);
      const Qm = (a - c) / (b + d), Qo = (a - c - e) / (b + d);
      const intro = "Nachfrage $P = " + a + " - " + (b === 1 ? "" : b) + "Q$, private Grenzkosten $" + c + " + " + (d === 1 ? "" : d) + "Q$. Jede Einheit verursacht zusätzlich einen Schaden von $" + e + "$ bei Dritten. ";
      if (level === 1) return num(intro + "Wie hoch muss eine Pigou-Steuer pro Einheit sein, damit der Markt die optimale Menge wählt?", e, { explain: "Die Steuer muss genau den externen Schaden je Einheit abbilden: $" + e + "$. Dann rechnen die Produzenten mit den sozialen Grenzkosten, als ob der Schaden ihr eigener wäre." });
      if (level === 2) return num(intro + "Um wie viele Einheiten ist die Marktmenge größer als die gesellschaftlich optimale? (zwei Nachkommastellen)", Qm - Qo, Object.assign({ explain: "Markt: $Q_M = \\tfrac{" + (a - c) + "}{" + (b + d) + "} \\approx " + G.tex(Qm, 2) + "$. Optimum mit sozialen Kosten: $Q^* = \\tfrac{" + (a - c - e) + "}{" + (b + d) + "} \\approx " + G.tex(Qo, 2) + "$. Ohne Korrektur wird zu viel produziert." }, dec(G, Qm - Qo, 2)));
      if (level === 3) { const dwl = 0.5 * e * (Qm - Qo); return num(intro + "Wie groß ist der Wohlfahrtsverlust der Marktlösung? (zwei Nachkommastellen)", dwl, Object.assign({ explain: "Das Dreieck zwischen sozialen Grenzkosten und Nachfrage von $Q^*$ bis $Q_M$: $\\tfrac12 \\cdot " + e + " \\cdot " + G.tex(Qm - Qo, 2) + " \\approx " + G.tex(dwl, 2) + "$." }, dec(G, dwl, 2))); }
      const items = G.pickN([["Brot", "privates Gut"], ["Kleidung", "privates Gut"], ["Leuchtturm", "öffentliches Gut"], ["Landesverteidigung", "öffentliches Gut"], ["Deichschutz", "öffentliches Gut"], ["Fischbestand im Meer", "Allmendegut"], ["Grundwasser", "Allmendegut"], ["Streamingdienst", "Klubgut"], ["Mautstraße ohne Stau", "Klubgut"]], 6);
      return { type: "sort", md: "Ordne die Güter ein. Rivalität: Nutzt einer es, haben andere weniger. Ausschließbarkeit: Man kann Nichtzahler fernhalten.", categories: ["privates Gut", "öffentliches Gut", "Allmendegut", "Klubgut"], items: items.map(([md, cat]) => ({ md, cat })), explain: "Privat: rival und ausschließbar. Öffentlich: weder noch, deshalb Trittbrettfahrer. Allmende: rival, aber nicht ausschließbar, deshalb Übernutzung. Klubgut: ausschließbar, aber (bis zur Überfüllung) nicht rival." };
    },
  });

  gen("oek-monopol", {
    title: "Monopol und Oligopol",
    make(level, G) {
      const b = G.pick([0.5, 1, 2]), c = G.int(1, 4), a = c + 2 * b * G.int(2, 6);
      const Qm = (a - c) / (2 * b), Pm = a - b * Qm, Qc = (a - c) / b;
      const intro = "Ein Monopolist hat die Nachfrage $P = " + lin(G, a, -b, "Q") + "$ und konstante Grenzkosten $" + c + "$. ";
      if (level === 1) return num(intro + "Welche Menge bietet er an, um seinen Gewinn zu maximieren?", Qm, { hint: "Grenzerlös $GE = " + lin(G, a, -2 * b, "Q") + "$ gleich Grenzkosten setzen.", explain: "$" + lin(G, a, -2 * b, "Q") + " = " + c + "$ ergibt $Q_M = " + G.tex(Qm, 2) + "$. Der Grenzerlös fällt doppelt so steil wie die Nachfrage, weil eine Preissenkung für alle Einheiten gilt." });
      if (level === 2) return num(intro + "Welchen Preis verlangt er?", Pm, { explain: "Zur Menge $Q_M = " + G.tex(Qm, 2) + "$ gehört auf der Nachfragekurve der Preis $" + G.tex(Pm, 2) + "$, deutlich über den Grenzkosten $" + c + "$." });
      if (level === 3) { const dwl = 0.5 * (Pm - c) * (Qc - Qm); return num(intro + "Wie groß ist der Wohlfahrtsverlust gegenüber vollständiger Konkurrenz ($P = GK$)? (zwei Nachkommastellen)", dwl, Object.assign({ explain: "Konkurrenzmenge $Q_K = " + G.tex(Qc, 2) + "$. Verlustdreieck $\\tfrac12 (" + G.tex(Pm, 2) + " - " + c + ")(" + G.tex(Qc, 2) + " - " + G.tex(Qm, 2) + ") = " + G.tex(dwl, 2) + "$." }, dec(G, dwl, 2))); }
      const qi = (a - c) / (3 * b);
      return num("Cournot-Duopol: Zwei Firmen mit Grenzkosten $" + c + "$ teilen sich die Nachfrage $P = " + lin(G, a, -b, "(q_1 + q_2)") + "$. Welche Menge bietet jede Firma im Gleichgewicht an? (zwei Nachkommastellen)", qi, Object.assign({ hint: "Reaktionsfunktion: $q_1 = \\tfrac{a - c - b\\,q_2}{2b}$; im symmetrischen Gleichgewicht ist $q_1 = q_2$.", explain: "$q = \\tfrac{a - c}{3b} = " + G.tex(qi, 2) + "$. Zusammen $" + G.tex(2 * qi, 2) + "$: mehr als der Monopolist ($" + G.tex(Qm, 2) + "$), weniger als bei Konkurrenz ($" + G.tex(Qc, 2) + "$)." }, dec(G, qi, 2)));
    },
  });

  // ---------------------------------------------------------------- macro

  gen("oek-bip", {
    title: "Bruttoinlandsprodukt",
    make(level, G) {
      if (level === 1) { const C = G.int(50, 70) * 10, I = G.int(15, 25) * 10, Gv = G.int(15, 25) * 10, X = G.int(30, 50) * 10, M = G.int(25, 50) * 10; return num("Konsum $" + C + "$, Investitionen $" + I + "$, Staatsausgaben $" + Gv + "$, Exporte $" + X + "$, Importe $" + M + "$ (Mrd. €). Wie hoch ist das BIP?", C + I + Gv + X - M, { explain: "Verwendungsrechnung: $C + I + G + X - M = " + (C + I + Gv + X - M) + "$. Importe werden abgezogen, weil sie im Inland nicht produziert wurden, aber in $C$, $I$ und $G$ enthalten sind." }); }
      if (level === 2) { const nom = G.int(30, 45) * 100, def = G.pick([102, 104, 105, 108, 110, 112]), r = (nom / def) * 100; return num("Das nominale BIP beträgt $" + nom + "$ Mrd. €, der BIP-Deflator $" + def + "$ (Basisjahr $= 100$). Wie hoch ist das reale BIP? (eine Nachkommastelle)", r, Object.assign({ explain: "Real $= \\tfrac{\\text{nominal}}{\\text{Deflator}} \\cdot 100 = " + G.tex(r, 1) + "$. Das reale BIP rechnet die Preissteigerung heraus." }, dec(G, r, 1))); }
      if (level === 3) { const y0 = G.int(30, 40) * 100, g = G.pick([-2, -1, 1, 2, 3]), y1 = Math.round(y0 * (1 + g / 100) + G.int(-10, 10)), rate = (y1 / y0 - 1) * 100; return num("Reales BIP im Vorjahr $" + y0 + "$, in diesem Jahr $" + y1 + "$ Mrd. €. Wie hoch ist die Wachstumsrate in Prozent? (zwei Nachkommastellen)", rate, Object.assign({ explain: "$\\left(\\tfrac{" + y1 + "}{" + y0 + "} - 1\\right) \\cdot 100 \\approx " + G.tex(rate, 2) + "\\,\\%$." }, dec(G, rate, 2))); }
      const w = G.int(20, 40), m = w + G.int(20, 40), br = m + G.int(30, 60);
      return num("Ein Bauer verkauft Weizen für $" + w + "$ € an eine Mühle, die Mühle Mehl für $" + m + "$ € an eine Bäckerei, die Bäckerei Brot für $" + br + "$ € an Kunden. Um wie viel € erhöht diese Kette das BIP?", br, { explain: "Wertschöpfung: $" + w + " + " + (m - w) + " + " + (br - m) + " = " + br + "$, genau der Wert des Endprodukts. Würde man alle Umsätze addieren ($" + (w + m + br) + "$), zählte man Vorleistungen mehrfach." });
    },
  });

  gen("oek-multiplikator", {
    title: "Multiplikator",
    make(level, G) {
      const c = G.pick([0.5, 0.6, 0.75, 0.8, 0.9]), dG = G.int(1, 10) * 10;
      if (level === 1) return num("Die marginale Konsumquote ist $c = " + G.tex(c, 2) + "$. Wie groß ist der einfache Ausgabenmultiplikator $\\tfrac{1}{1 - c}$?", 1 / (1 - c), Object.assign({ explain: "$\\tfrac{1}{1 - " + G.tex(c, 2) + "} = " + G.tex(1 / (1 - c), 2) + "$. Je mehr von jedem zusätzlichen Euro wieder ausgegeben wird, desto größer die Kettenwirkung." }, dec(G, 1 / (1 - c), 2)));
      if (level === 2) return num("$c = " + G.tex(c, 2) + "$. Der Staat erhöht seine Ausgaben um $" + dG + "$ Mrd. €. Um wie viel steigt das Gleichgewichtseinkommen? (eine Nachkommastelle)", dG / (1 - c), Object.assign({ hint: "$\\Delta Y = \\tfrac{\\Delta G}{1 - c}$, das ist die Summe der Runden $\\Delta G + c\\,\\Delta G + c^2 \\Delta G + \\dots$", explain: "$\\tfrac{" + dG + "}{1 - " + G.tex(c, 2) + "} = " + G.tex(dG / (1 - c), 1) + "$. Eine geometrische Reihe: Jede Runde gibt den Anteil $c$ des vorigen Zuwachses aus." }, dec(G, dG / (1 - c), 1)));
      if (level === 3) { const t = G.pick([0.2, 0.25, 0.3]), k = 1 / (1 - c * (1 - t)); return num("$c = " + G.tex(c, 2) + "$, Einkommensteuersatz $t = " + G.tex(t, 2) + "$. Der Staat erhöht seine Ausgaben um $" + dG + "$. Um wie viel steigt $Y$? (eine Nachkommastelle)", dG * k, Object.assign({ hint: "Von jedem Euro Einkommen bleibt nach Steuern $1 - t$, davon wird der Anteil $c$ konsumiert.", explain: "Multiplikator $\\tfrac{1}{1 - c(1 - t)} = " + G.tex(k, 3) + "$, also $\\Delta Y \\approx " + G.tex(dG * k, 1) + "$. Steuern dämpfen die Kettenwirkung: ein automatischer Stabilisator." }, dec(G, dG * k, 1))); }
      const dT = G.int(1, 6) * 10, v = (-c * dT) / (1 - c);
      return num("$c = " + G.tex(c, 2) + "$. Der Staat **senkt** die Pauschalsteuern um $" + dT + "$ Mrd. €. Um wie viel steigt $Y$? (eine Nachkommastelle)", -v, Object.assign({ explain: "Steuermultiplikator $\\tfrac{-c}{1 - c}$: Die Haushalte geben von der Entlastung nur den Anteil $c$ aus, die erste Runde ist also kleiner als bei Staatsausgaben. $\\Delta Y = \\tfrac{" + G.tex(c, 2) + " \\cdot " + dT + "}{1 - " + G.tex(c, 2) + "} \\approx " + G.tex(-v, 1) + "$." }, dec(G, -v, 1)));
    },
  });

  gen("oek-geld", {
    title: "Geld und Zinsen",
    make(level, G) {
      if (level === 1) { const D = G.int(1, 10) * 100, r = G.pick([0.01, 0.02, 0.05, 0.1, 0.2]); return num("Eine Bank erhält eine Einlage von $" + D + "$ €. Der Mindestreservesatz ist $" + G.tex(100 * r, 0) + "\\,\\%$, der Rest wird verliehen und landet wieder als Einlage im Bankensystem. Wie groß können die Einlagen insgesamt höchstens werden?", D / r, { explain: "$\\tfrac{" + D + "}{" + G.tex(r, 2) + "} = " + G.tex(D / r, 0) + "$ €: die Summe $D + (1 - r)D + (1 - r)^2 D + \\dots$ Geschäftsbanken schaffen Giralgeld, indem sie Kredite vergeben." }); }
      if (level === 2) { const m = G.int(2, 10), v = G.int(-2, 2), y = G.int(0, 4), p = m + v - y; return num("Quantitätsgleichung $M \\cdot V = P \\cdot Y$: Die Geldmenge wächst um $" + m + "\\,\\%$, die Umlaufgeschwindigkeit ändert sich um $" + v + "\\,\\%$, das reale BIP wächst um $" + y + "\\,\\%$. Wie hoch ist die Inflation ungefähr (in Prozent)?", p, { explain: "In Wachstumsraten: $\\%\\Delta M + \\%\\Delta V \\approx \\%\\Delta P + \\%\\Delta Y$, also $\\%\\Delta P \\approx " + m + (v < 0 ? " - " + -v : " + " + v) + " - " + y + " = " + p + "$." + (p < 0 ? " Ein negativer Wert bedeutet sinkende Preise, eine Deflation." : "") }); }
      if (level === 3) { const i = G.pick([2, 3, 4, 5, 6]), pi = G.pick([1, 2, 3, 5, 7]), exact = ((1 + i / 100) / (1 + pi / 100) - 1) * 100; return num("Ein Sparbuch bringt $" + i + "\\,\\%$ Zinsen, die Inflation beträgt $" + pi + "\\,\\%$. Wie hoch ist der Realzins genau (Prozent, zwei Nachkommastellen)?", exact, Object.assign({ hint: "$1 + r = \\tfrac{1 + i}{1 + \\pi}$.", explain: "$\\left(\\tfrac{1{,}0" + i + "}{1{,}0" + pi + "} - 1\\right) \\cdot 100 \\approx " + G.tex(exact, 2) + "\\,\\%$. Die Faustregel $i - \\pi = " + (i - pi) + "$ liegt nahe dran." }, dec(G, exact, 2))); }
      const cpn = G.int(2, 6) * 10, i0 = G.pick([0.02, 0.04, 0.05]), i1 = i0 + G.pick([0.01, 0.02]);
      return num("Eine ewige Anleihe zahlt jedes Jahr $" + cpn + "$ €. Der Marktzins steigt von $" + G.tex(100 * i0, 0) + "\\,\\%$ auf $" + G.tex(100 * i1, 0) + "\\,\\%$. Wie viel ist sie jetzt wert? (€)", cpn / i1, Object.assign({ hint: "Wert $= \\tfrac{\\text{Zahlung}}{\\text{Zins}}$.", explain: "Vorher $" + G.tex(cpn / i0, 0) + "$ €, jetzt $" + G.tex(cpn / i1, 0) + "$ €. Steigende Zinsen senken die Kurse bestehender Anleihen, weil neue Anleihen mehr bieten." }, dec(G, cpn / i1, 0)));
    },
  });

  gen("oek-adas", {
    title: "Gesamtwirtschaftliches Angebot und Nachfrage",
    make(level, G) {
      const shocks = [
        ["Der Staat startet ein großes Investitionsprogramm.", "AD nach rechts", "Preisniveau steigt, Produktion steigt"],
        ["Haushalte werden pessimistisch und sparen mehr.", "AD nach links", "Preisniveau sinkt, Produktion sinkt"],
        ["Der Ölpreis verdreifacht sich.", "AS nach links", "Preisniveau steigt, Produktion sinkt"],
        ["Eine neue Technik senkt die Produktionskosten deutlich.", "AS nach rechts", "Preisniveau sinkt, Produktion steigt"],
        ["Die Zentralbank senkt die Leitzinsen.", "AD nach rechts", "Preisniveau steigt, Produktion steigt"],
        ["Wichtige Handelspartner geraten in eine Rezession.", "AD nach links", "Preisniveau sinkt, Produktion sinkt"],
      ];
      const S = G.pick(shocks);
      if (level <= 2) return { type: "choice", md: S[0] + " Welche Kurve verschiebt sich?", shuffle: false, options: ["AD nach rechts", "AD nach links", "AS nach rechts", "AS nach links"].map((o) => (o === S[1] ? { md: o, correct: true } : { md: o })), explain: "Nachfrageschocks (Konsum, Investitionen, Staat, Export, Geldpolitik) verschieben AD, Kostenschocks (Rohstoffe, Löhne, Technik) verschieben AS. Hier: " + S[1] + "." };
      if (level === 3) return { type: "choice", md: S[0] + " Was passiert kurzfristig mit Preisniveau und Produktion?", shuffle: false, options: ["Preisniveau steigt, Produktion steigt", "Preisniveau sinkt, Produktion sinkt", "Preisniveau steigt, Produktion sinkt", "Preisniveau sinkt, Produktion steigt"].map((o) => (o === S[2] ? { md: o, correct: true } : { md: o })), explain: "Eine AD-Verschiebung bewegt Preise und Produktion in **dieselbe** Richtung, eine AS-Verschiebung in **entgegengesetzte**. Ein negativer Angebotsschock ist besonders unangenehm: steigende Preise bei sinkender Produktion, die **Stagflation**." };
      const Yp = G.int(30, 40) * 100, Y = Yp + G.pick([-1, 1]) * G.int(1, 6) * 30, gap = ((Y - Yp) / Yp) * 100;
      return num("Das Produktionspotenzial beträgt $" + Yp + "$ Mrd. €, das tatsächliche BIP $" + Y + "$ Mrd. €. Wie groß ist die Produktionslücke in Prozent des Potenzials? (zwei Nachkommastellen, mit Vorzeichen)", gap, Object.assign({ explain: "$\\tfrac{" + Y + " - " + Yp + "}{" + Yp + "} \\cdot 100 \\approx " + G.tex(gap, 2) + "\\,\\%$. " + (gap < 0 ? "Negativ: Die Wirtschaft ist unterausgelastet, typischerweise steigt die Arbeitslosigkeit." : "Positiv: Die Wirtschaft ist überausgelastet, es droht Inflationsdruck.") }, dec(G, gap, 2)));
    },
  });

  // ---------------------------------------------------------------- ideas

  gen("oek-ricardo", {
    title: "Komparative Vorteile",
    make(level, G) {
      let a1, a2, b1, b2;
      do { a1 = G.int(2, 12); a2 = G.int(2, 12); b1 = G.int(2, 12); b2 = G.int(2, 12); } while (Math.abs(a1 / a2 - b1 / b2) < 0.15);
      const intro = "Arbeitsstunden je Einheit: Land A braucht $" + a1 + "$ h für Tuch und $" + a2 + "$ h für Wein, Land B $" + b1 + "$ h für Tuch und $" + b2 + "$ h für Wein. ";
      const ocA = a1 / a2, ocB = b1 / b2;
      if (level === 1) return num(intro + "Wie viele Einheiten Wein kostet in Land A eine Einheit Tuch (Opportunitätskosten)? (zwei Nachkommastellen)", ocA, Object.assign({ explain: "Für eine Einheit Tuch verzichtet A auf $\\tfrac{" + a1 + "}{" + a2 + "} \\approx " + G.tex(ocA, 2) + "$ Einheiten Wein." }, dec(G, ocA, 2)));
      if (level === 2) return { type: "choice", md: intro + "Welches Land hat den **komparativen Vorteil** bei Tuch?", shuffle: false, options: [{ md: "Land A", correct: ocA < ocB }, { md: "Land B", correct: ocB < ocA }], explain: "Opportunitätskosten von Tuch: A $" + G.tex(ocA, 2) + "$, B $" + G.tex(ocB, 2) + "$ Einheiten Wein. Den komparativen Vorteil hat, wer weniger aufgeben muss, egal wer absolut schneller ist." };
      if (level === 3) {
        const absA = (a1 < b1 && a2 < b2) || (b1 < a1 && b2 < a2);
        const why = "Auch dann haben beide Länder unterschiedliche Opportunitätskosten (hier A $" + G.tex(ocA, 2) + "$, B $" + G.tex(ocB, 2) + "$ Einheiten Wein je Tuch). Spezialisierung nach komparativen Vorteilen lohnt sich für beide." + (absA ? " In diesem Beispiel ist tatsächlich ein Land bei beiden Gütern absolut überlegen." : "");
        return tf(intro + "Wenn ein Land beide Güter mit weniger Arbeit herstellt, lohnt sich Handel für das andere Land nicht.", false, why, why);
      }
      const lo = Math.min(ocA, ocB), hi = Math.max(ocA, ocB);
      const tot = G.chance(0.6) ? Math.round(((lo + hi) / 2) * 100) / 100 : Math.round((hi + 0.3 + G.int(0, 5) / 10) * 100) / 100;
      const ok = tot > lo && tot < hi;
      return tf(intro + "Die Länder tauschen eine Einheit Tuch gegen $" + G.tex(tot, 2) + "$ Einheiten Wein. Gewinnen dabei **beide**?", ok, "Ein Tauschverhältnis nützt beiden, wenn es zwischen den Opportunitätskosten liegt, hier zwischen $" + G.tex(lo, 2) + "$ und $" + G.tex(hi, 2) + "$." + (ok ? " $" + G.tex(tot, 2) + "$ liegt dazwischen." : ""), "$" + G.tex(tot, 2) + "$ liegt außerhalb von $" + G.tex(lo, 2) + "$ bis $" + G.tex(hi, 2) + "$; ein Land würde besser selbst produzieren.");
    },
  });

  gen("oek-smith", {
    title: "Adam Smith",
    make(level, G) {
      if (level === 1) { const k = G.pick([10, 15, 20, 25]), n = G.pick([5, 8, 10, 12]), per = G.pick([1500, 2000, 3000, 4800]), N = n * per; return num("Ein Arbeiter allein schafft $" + k + "$ Teile am Tag. $" + n + "$ Arbeiter mit Arbeitsteilung schaffen zusammen $" + N + "$. Um welchen Faktor steigt die Produktivität pro Kopf?", per / k, { explain: "Pro Kopf $\\tfrac{" + N + "}{" + n + "} = " + per + "$ statt $" + k + "$: Faktor $" + G.fmt(per / k, 2) + "$. Smith nennt drei Gründe: Geschicklichkeit, keine Wechselzeiten, und Spezialisierung regt Erfindungen an." }); }
      if (level === 2) return pool(G, [
        ["Nach Smith ist die Arbeitsteilung durch die Größe des Marktes begrenzt.", true, "Wer nur wenige Abnehmer hat, kann sich nicht auf einen einzigen Handgriff spezialisieren."],
        ["Smith meint, Wohlstand entsteht vor allem durch das Anhäufen von Gold und Silber.", false, "Das ist die merkantilistische Sicht, gegen die Smith anschreibt. Für ihn ist Wohlstand die Menge an Gütern, die die Arbeit eines Landes hervorbringt."],
        ["Der Bäcker backt nach Smith nicht aus Wohlwollen, sondern aus Eigeninteresse.", true, "Das Eigeninteresse führt im Wettbewerb dazu, dass er backt, was andere wollen."],
      ]);
      if (level === 3) return pool(G, [
        ["Die »unsichtbare Hand« bedeutet bei Smith, dass Märkte ohne jeden Rahmen immer zum Gemeinwohl führen.", false, "Smith verlangt Recht, Wettbewerb und staatliche Aufgaben wie Verteidigung, Justiz und öffentliche Werke. Er warnt ausdrücklich vor Absprachen der Kaufleute."],
        ["Smith sieht Gefahren der Arbeitsteilung für die Arbeiter selbst.", true, "Wer sein Leben lang denselben einfachen Handgriff macht, verkümmert geistig. Smith fordert deshalb öffentliche Bildung."],
        ["Im Wettbewerb pendelt der Marktpreis nach Smith um einen »natürlichen Preis«, der die Kosten deckt.", true, "Liegt der Marktpreis darüber, strömen Anbieter herein, liegt er darunter, ziehen sie sich zurück."],
      ]);
      return { type: "choice", md: "Smiths Stecknadelbeispiel: Zehn Arbeiter schaffen mit Teilung über $48\\,000$ Nadeln am Tag, einer allein kaum $20$. Welcher Grund für den Produktivitätssprung gehört **nicht** zu Smiths drei Gründen?", options: G.options({ md: "Die Arbeiter werden besser bezahlt und strengen sich mehr an." }, [{ md: "Jeder wird in seinem einen Handgriff geschickter." }, { md: "Es geht keine Zeit beim Wechsel zwischen Tätigkeiten verloren." }, { md: "Wer sich auf eine Sache konzentriert, erfindet eher Maschinen dafür." }]), explain: "Smiths Gründe sind Geschicklichkeit, gesparte Wechselzeit und Erfindungen. Bezahlung spielt in seiner Erklärung keine Rolle." };
    },
  });

  gen("oek-marx", {
    title: "Marx: Mehrwert und Profitrate",
    make(level, G) {
      const day = G.pick([8, 9, 10, 11, 12]), nec = G.int(3, day - 2), m = day - nec;
      if (level === 1) return num("Ein Arbeitstag hat $" + day + "$ Stunden. In $" + nec + "$ Stunden schafft der Arbeiter den Wert seines Lohns. Wie hoch ist die Mehrwertrate $m/v$ in Prozent? (eine Nachkommastelle)", (100 * m) / nec, Object.assign({ explain: "Mehrarbeit $" + m + "$ h, notwendige Arbeit $" + nec + "$ h: $\\tfrac{" + m + "}{" + nec + "} \\approx " + G.tex((100 * m) / nec, 1) + "\\,\\%$. Für Marx zeigt dieses Verhältnis den Grad der Ausbeutung." }, dec(G, (100 * m) / nec, 1)));
      const v = G.int(2, 6) * 10, c = G.int(3, 12) * 10, rate = G.pick([0.5, 1, 1.5, 2]), mv = rate * v;
      if (level === 2) return num("Konstantes Kapital $c = " + c + "$, variables Kapital $v = " + v + "$, Mehrwert $m = " + G.tex(mv, 0) + "$. Wie hoch ist die Profitrate $\\tfrac{m}{c + v}$ in Prozent? (eine Nachkommastelle)", (100 * mv) / (c + v), Object.assign({ explain: "$\\tfrac{" + G.tex(mv, 0) + "}{" + (c + v) + "} \\approx " + G.tex((100 * mv) / (c + v), 1) + "\\,\\%$. Der Kapitalist rechnet den Gewinn auf das ganze vorgeschossene Kapital, nicht nur auf die Löhne." }, dec(G, (100 * mv) / (c + v), 1)));
      if (level === 3) { const c2 = c * 2, p1 = mv / (c + v), p2 = mv / (c2 + v); return num("$c = " + c + "$, $v = " + v + "$, $m = " + G.tex(mv, 0) + "$. Durch Mechanisierung verdoppelt sich $c$, Mehrwertrate und $v$ bleiben gleich. Um wie viele Prozentpunkte sinkt die Profitrate? (eine Nachkommastelle)", 100 * (p1 - p2), Object.assign({ explain: "Vorher $" + G.tex(100 * p1, 1) + "\\,\\%$, nachher $\\tfrac{" + G.tex(mv, 0) + "}{" + (c2 + v) + "} \\approx " + G.tex(100 * p2, 1) + "\\,\\%$. Das ist die Logik hinter Marx' »tendenziellem Fall der Profitrate«: Mehr Maschinen pro Arbeiter, aber Mehrwert entsteht nach Marx nur aus lebendiger Arbeit." }, dec(G, 100 * (p1 - p2), 1))); }
      return num("Eine Ware enthält verbrauchte Produktionsmittel im Wert von $" + c + "$, Löhne von $" + v + "$ und Mehrwert bei einer Mehrwertrate von $" + G.tex(100 * rate, 0) + "\\,\\%$. Welchen Wert hat sie nach Marx?", c + v + mv, { explain: "Wert $= c + v + m = " + c + " + " + v + " + " + G.tex(mv, 0) + " = " + G.tex(c + v + mv, 0) + "$. Die Produktionsmittel übertragen nur ihren Wert, Neuwert schafft allein die Arbeit." });
    },
  });

  gen("oek-keynes", {
    title: "Keynes",
    make(level, G) {
      const C0 = G.int(5, 15) * 10, c = G.pick([0.6, 0.75, 0.8]), I = G.int(10, 30) * 10, Gv = G.int(10, 30) * 10;
      const Y = (C0 + I + Gv) / (1 - c);
      if (level === 1) { const y = G.int(5, 15) * 100; return num("Konsumfunktion $C = " + C0 + " + " + G.tex(c, 2) + "Y$. Wie hoch ist der Konsum bei einem Einkommen von $" + y + "$?", C0 + c * y, { explain: "$" + C0 + " + " + G.tex(c, 2) + " \\cdot " + y + " = " + G.tex(C0 + c * y, 1) + "$. Vom zusätzlichen Einkommen wird nur der Anteil $c$ ausgegeben, das ist Keynes' »psychologisches Gesetz«." }); }
      if (level === 2) return num("$C = " + C0 + " + " + G.tex(c, 2) + "Y$, Investitionen $" + I + "$, Staatsausgaben $" + Gv + "$. Wie hoch ist das Gleichgewichtseinkommen (Y = C + I + G)? (eine Nachkommastelle)", Y, Object.assign({ explain: "$Y = \\tfrac{" + C0 + " + " + I + " + " + Gv + "}{1 - " + G.tex(c, 2) + "} = " + G.tex(Y, 1) + "$. Nichts garantiert, dass dieses Einkommen Vollbeschäftigung bedeutet." }, dec(G, Y, 1)));
      if (level === 3) { const dS = G.int(1, 5) * 10, dY = -dS / (1 - c); return num("$C = " + C0 + " + " + G.tex(c, 2) + "Y$, $I = " + I + "$ fest. Alle Haushalte beschließen, $" + dS + "$ mehr zu sparen (der autonome Konsum sinkt um $" + dS + "$). Um wie viel ändert sich das Einkommen? (eine Nachkommastelle, mit Vorzeichen)", dY, Object.assign({ explain: "$\\Delta Y = \\tfrac{-" + dS + "}{1 - " + G.tex(c, 2) + "} = " + G.tex(dY, 1) + "$. Die gesamte Ersparnis bleibt am Ende gleich der Investition $I$: Der Versuch aller, mehr zu sparen, senkt nur das Einkommen. Das ist das **Sparparadoxon**." }, dec(G, dY, 1))); }
      const Yf = Math.round(Y + G.int(5, 20) * 10), need = (Yf - Y) * (1 - c);
      return num("Gleichgewichtseinkommen $" + G.tex(Y, 1) + "$, Vollbeschäftigung bei $" + Yf + "$, marginale Konsumquote $" + G.tex(c, 2) + "$. Um wie viel muss der Staat seine Ausgaben erhöhen, um die Lücke zu schließen? (eine Nachkommastelle)", need, Object.assign({ explain: "Benötigter Zuwachs $" + G.tex(Yf - Y, 1) + "$, Multiplikator $" + G.tex(1 / (1 - c), 2) + "$, also $\\Delta G = " + G.tex(need, 1) + "$. Keynes' Folgerung: In der Krise kann der Staat mit vergleichsweise wenig Geld viel Nachfrage anstoßen." }, dec(G, need, 1)));
    },
  });

  gen("oek-hayek", {
    title: "Hayek",
    make(level, G) {
      if (level === 1) return pool(G, [
        ["Nach Hayek liegt das für die Wirtschaft wichtigste Wissen verstreut bei vielen Menschen und ihren besonderen Umständen.", true, "Wissen über Ort, Zeit und Gelegenheit lässt sich nicht in einer Zentrale sammeln."],
        ["Hayek meint, eine Planungsbehörde könne mit genug Statistik alle Preise richtig festsetzen.", false, "Gerade das bestreitet er: Statistik fasst zusammen und verliert dabei das lokale Wissen, auf das es ankommt."],
      ]);
      if (level === 2) return { type: "choice", md: "Zinn wird knapp, weil eine Mine ausfällt. Was geschieht nach Hayek in einer Marktwirtschaft?", options: G.options({ md: "Der Zinnpreis steigt, und Millionen Nutzer sparen Zinn, ohne den Grund kennen zu müssen." }, [{ md: "Eine Behörde muss alle Zinnverbraucher informieren und Quoten verteilen.", why: "Genau diese Aufgabe erledigt der Preis, ohne dass jemand alles wissen muss." }, { md: "Nichts, weil Märkte auf Knappheit nicht reagieren.", why: "Der Preis ist gerade das Signal für Knappheit." }]), explain: "Der Preis wirkt wie ein Telekommunikationssystem: Er fasst die Knappheit in einer Zahl zusammen und gibt sie an alle weiter, die sie betrifft." };
      if (level === 3) return pool(G, [
        ["Hayek sieht im Wettbewerb ein Entdeckungsverfahren: Er bringt Wissen hervor, das vorher niemand hatte.", true, "Erst im Wettbewerb zeigt sich, was Kunden wollen und wer es am günstigsten kann."],
        ["Die »Anmaßung von Wissen« bezeichnet bei Hayek den Glauben, man könne komplexe Ordnungen wie die Wirtschaft im Ganzen steuern.", true, "So lautet der Titel seiner Nobelpreisrede von 1974."],
        ["Hayek und Keynes waren sich einig, dass der Staat in Krisen die Nachfrage ankurbeln soll.", false, "Hayek kritisierte Keynes scharf: Kreditexpansion verzerre die Preissignale und führe zu Fehlinvestitionen."],
      ]);
      return { type: "match", md: "Ordne die Positionen den Denkern zu.", pairs: [["Preise übermitteln verstreutes Wissen.", "Hayek"], ["Die Gesamtnachfrage kann dauerhaft zu niedrig sein.", "Keynes"], ["Der Mehrwert stammt aus unbezahlter Arbeit.", "Marx"], ["Arbeitsteilung ist durch die Größe des Marktes begrenzt.", "Smith"]], explain: "Vier Antworten auf die Frage, wie eine Wirtschaft koordiniert wird: durch Preise (Hayek), durch gezielte Nachfragepolitik (Keynes), durch Klassenverhältnisse (Marx) und durch den Markt mit Arbeitsteilung (Smith)." };
    },
  });
  // ---------------------------------------------------------------- timeline of economic thought

  const WORKS = [
    { md: "Adam Smith: *Der Wohlstand der Nationen*", year: 1776 },
    { md: "Thomas Malthus: *Das Bevölkerungsgesetz*", year: 1798 },
    { md: "David Ricardo: *Grundsätze der politischen Ökonomie und der Besteuerung*", year: 1817 },
    { md: "Karl Marx und Friedrich Engels: *Manifest der Kommunistischen Partei*", year: 1848 },
    { md: "Karl Marx: *Das Kapital*, Band 1", year: 1867 },
    { md: "Carl Menger: *Grundsätze der Volkswirtschaftslehre*", year: 1871 },
    { md: "Alfred Marshall: *Principles of Economics*", year: 1890 },
    { md: "John Maynard Keynes: *Allgemeine Theorie der Beschäftigung, des Zinses und des Geldes*", year: 1936 },
    { md: "Friedrich August von Hayek: *Der Weg zur Knechtschaft*", year: 1944 },
    { md: "Milton Friedman: *Kapitalismus und Freiheit*", year: 1962 },
  ];
  function timelineTask(G, pool, level, from, to, intro, explain) {
    const n = [3, 4, 5, 5][level - 1], gap = [40, 20, 12, 6][level - 1], tol = [20, 14, 10, 6][level - 1];
    let pick = null;
    for (let t = 0; t < 300 && !pick; t++) {
      const c = G.pickN(pool, n).sort((a, b) => a.year - b.year);
      if (c.every((x, i) => i === 0 || x.year - c[i - 1].year >= gap)) pick = c;
    }
    pick = pick || G.pickN(pool, n);
    return { type: "timeline", md: intro + " Ein Treffer zählt, wenn er höchstens " + tol + " Jahre danebenliegt.", start: from, end: to, tolerance: tol, items: G.shuffle(pick), explain: explain(pick) };
  }

  gen("oek-zeitstrahl", {
    title: "Ideengeschichte zeitlich einordnen",
    make(level, G) {
      return timelineTask(G, WORKS, level, 1750, 1980, "Ordne die Werke auf dem Zeitstrahl ein.", (p) => p.map((w) => w.md + " (" + w.year + ")").join(", ") + ". Klassik, Marx und die Grenznutzenschule im 19. Jahrhundert, Keynes und seine Kritiker im 20.");
    },
  });

  // ---------------------------------------------------------------- kinds of goods in a four-field table

  const GOODS = [
    ["Brot", 0], ["Kleidung", 0], ["Ein Smartphone", 0], ["Eine Pizza", 0],
    ["Streaming-Abo", 1], ["Bezahlfernsehen", 1], ["Eine Mautstraße ohne Stau", 1], ["Lizenz für eine Software", 1],
    ["Fischbestand im offenen Meer", 2], ["Grundwasser", 2], ["Weidefläche, die allen offensteht", 2], ["Eine freie Straße im Stau", 2],
    ["Landesverteidigung", 3], ["Leuchtturm", 3], ["Deich", 3], ["Straßenbeleuchtung", 3], ["Ein Feuerwerk über der Stadt", 3],
  ];

  gen("oek-gueter", {
    title: "Güterarten",
    make(level, G) {
      const n = [4, 5, 6, 7][level - 1];
      const pool = GOODS.filter((g) => level >= 3 || !/Stau/.test(g[0]));
      let items = [0, 1, 2, 3].map((c) => G.pick(pool.filter((g) => g[1] === c)));
      const rest = G.shuffle(pool.filter((g) => !items.includes(g)));
      items = items.concat(rest.slice(0, n - 4));
      return {
        type: "quadrant", md: "Ordne die Güter ein.", xLabel: "Rivalität", yLabel: "Ausschluss",
        x: ["rival", "nicht rival"], y: ["ausschließbar", "nicht ausschließbar"],
        cells: ["Privates Gut", "Klubgut", "Allmendegut", "Öffentliches Gut"],
        items: G.shuffle(items).map(([md, cell]) => ({ md, cell })),
        explain: "**Rival:** Was eine nutzt, kann der andere nicht mehr nutzen. **Ausschließbar:** Nichtzahler lassen sich fernhalten." + (level >= 3 ? " Eine Straße ist ohne Stau kaum rival, im Stau sehr wohl: Ob ein Gut rival ist, kann von der Auslastung abhängen." : ""),
      };
    },
  });
})();
