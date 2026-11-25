/* Lab tasks for economics, computer science and ethnology. Every task is a widget step whose start does not meet the goal and whose
 * sample solution does.
 *   lab-markt          shift curves, quantity tax, price ceiling and floor, tax incidence and deadweight loss (marktlabor)
 *   lab-spiel          dominant strategies, prisoner's dilemma, coordination games, mixed equilibria (spiellabor)
 *   lab-haushalt       budget line, household optimum, Slutsky compensation, expenditure shares (haushalt)
 *   lab-suche          cutting a maze, depth-first longer than breadth-first, greedy longer than A*, a given shortest path (suchlabor)
 *   lab-netz           weights for AND, OR, NAND, a sigmoid neuron, why XOR fails (neuron)
 *   lab-sortieren      inputs for bubble, insertion and selection sort: best and worst cases, given numbers of swaps (sortierlabor)
 *   lab-verwandtschaft painting kinship terminologies: Hawaii, Eskimo, Iroquois, Crow, Omaha (terminologie) */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const cn = (x) => String(+(+x).toFixed(6));
  function goal(list, solve) { return { when: list.map((x) => "(" + x.when + ")").join(" && "), list, solve }; }
  function task(widget, label, md, params, g, hint, explain) { return { type: "widget", widget, label, md, params, goal: g, hint, explain }; }

  // ---------------------------------------------------------------- market
  gen("lab-markt", {
    title: "Märkte und Eingriffe",
    make(level, G) {
      const base = { a: 12, b: 1, c: 2, d: 1, t: 0, qMax: 10, pMax: 16 };
      if (level === 1) {
        if (G.chance(0.5)) {
          const Q = G.pick([4, 5, 6, 7]), a = 2 + 2 * Q;
          return task("marktlabor", "Marktlabor",
            "Angebot $P = 2 + Q$, Nachfrage $P = a - Q$. Verschiebe die Nachfrage (Parameter $a$), bis im Gleichgewicht **" + Q + " Einheiten** gehandelt werden.",
            Object.assign({}, base, { a: a - 4, edit: ["a"] }),
            goal([{ when: "abs(Q0 - " + Q + ") < 1e-9", show: "Gleichgewichtsmenge " + Q }], { a }),
            "Im Gleichgewicht ist der Nachfragepreis gleich dem Angebotspreis: $a - Q = 2 + Q$.",
            "$a - " + Q + " = 2 + " + Q + "$ ergibt $a = " + a + "$. Steigt die Zahlungsbereitschaft, verschiebt sich die Nachfrage nach oben: Menge und Preis steigen.");
        }
        const P = G.pick([6, 7, 8]), a = 2 * P - 2;
        return task("marktlabor", "Marktlabor",
          "Angebot $P = 2 + Q$, Nachfrage $P = a - Q$. Stelle $a$ so ein, dass der **Gleichgewichtspreis " + P + "** beträgt.",
          Object.assign({}, base, { a: 8, edit: ["a"] }),
          goal([{ when: "abs(P0 - " + P + ") < 1e-9", show: "Gleichgewichtspreis " + P }], { a }),
          "Zum Preis $" + P + "$ bieten die Verkäufer $Q = " + P + " - 2$ an. Diese Menge muss auch nachgefragt werden.",
          "$Q = " + (P - 2) + "$ und $" + P + " = a - " + (P - 2) + "$, also $a = " + a + "$.");
      }
      if (level === 2) {
        if (G.chance(0.5)) {
          const Q = G.pick([3, 3.5, 4, 4.5]), t = 10 - 2 * Q;
          return task("marktlabor", "Marktlabor",
            "Ohne Eingriff werden 5 Einheiten gehandelt. Erhebe eine **Mengensteuer** $t$ (die Verkäufer führen sie ab), sodass die Menge auf **" + G.fmt(Q) + "** sinkt.",
            Object.assign({}, base, { edit: ["t"] }),
            goal([{ when: "abs(Q - " + Q + ") < 1e-9", show: "gehandelte Menge " + G.fmt(Q) }], { t }),
            "Die Steuer verschiebt das Angebot um $t$ nach oben: $P = 2 + t + Q$.",
            "$12 - Q = 2 + t + Q$ mit $Q = " + G.tex(Q) + "$ ergibt $t = " + G.tex(t) + "$. Käufer zahlen mehr, Verkäufer erhalten weniger; die Differenz ist die Steuer.");
        }
        const [T, t, t2] = G.pick([[8, 2, 8], [10.5, 3, 7], [12, 4, 6]]);
        return task("marktlabor", "Marktlabor",
          "Der Staat möchte mit einer Mengensteuer genau **" + G.fmt(T) + "** einnehmen. Finde eine passende Steuer.",
          Object.assign({}, base, { edit: ["t"] }),
          goal([{ when: "abs(T - " + T + ") < 1e-9", show: "Steuereinnahmen " + G.fmt(T) }], { t }),
          "Einnahmen = Steuersatz mal gehandelte Menge, und die Menge ist $\\frac{10 - t}{2}$.",
          "$t \\cdot \\frac{10 - t}{2} = " + G.tex(T) + "$ hat zwei Lösungen: $t = " + t + "$ und $t = " + t2 + "$. Die kleinere Steuer bringt dasselbe ein, verdrängt weniger Handel und hat den kleineren Wohlfahrtsverlust (Laffer-Kurve).");
      }
      if (level === 3) {
        if (G.chance(0.5)) {
          const S = G.pick([1, 2, 3, 4]), pc = (14 - S) / 2;
          return task("marktlabor", "Marktlabor",
            "Der Staat setzt einen **Höchstpreis**. Wähle ihn so, dass ein **Nachfrageüberhang von " + S + (S === 1 ? " Einheit" : " Einheiten") + "** entsteht.",
            Object.assign({}, base, { ctrl: "hoechst", pc: 9, edit: ["pc"] }),
            goal([{ when: "abs(short - " + S + ") < 1e-9", show: "Nachfrageüberhang " + S }], { pc }),
            "Ein Höchstpreis wirkt nur unter dem Gleichgewichtspreis 7. Dann fragen die Käufer $12 - \\bar p$ nach, die Verkäufer bieten $\\bar p - 2$ an.",
            "$(12 - \\bar p) - (\\bar p - 2) = " + S + "$ ergibt $\\bar p = " + G.tex(pc) + "$. Gehandelt wird nur, was angeboten wird; der Rest der Nachfrage geht leer aus, und es entsteht ein Wohlfahrtsverlust.");
        }
        const E = G.pick([1, 2, 3]), pc = (14 + E) / 2;
        return task("marktlabor", "Marktlabor",
          "Der Staat setzt einen **Mindestpreis**. Wähle ihn so, dass ein **Angebotsüberhang von " + E + (E === 1 ? " Einheit" : " Einheiten") + "** entsteht.",
          Object.assign({}, base, { ctrl: "mindest", pc: 5, edit: ["pc"] }),
          goal([{ when: "abs(excess - " + E + ") < 1e-9", show: "Angebotsüberhang " + E }], { pc }),
          "Ein Mindestpreis wirkt nur über dem Gleichgewichtspreis 7.",
          "$(\\bar p - 2) - (12 - \\bar p) = " + E + "$ ergibt $\\bar p = " + G.tex(pc) + "$. Gehandelt wird nur, was nachgefragt wird.");
      }
      const v = G.int(0, 2);
      if (v === 2) {
        const D = G.pick([0.25, 1, 2.25, 4]), t = 2 * Math.sqrt(D);
        return task("marktlabor", "Marktlabor",
          "Wie groß darf eine Mengensteuer sein? Wähle $t$ so, dass der **Wohlfahrtsverlust genau " + G.fmt(D) + "** beträgt.",
          Object.assign({}, base, { edit: ["t"] }),
          goal([{ when: "abs(DWL - " + D + ") < 1e-9", show: "Wohlfahrtsverlust " + G.fmt(D) }], { t }),
          "Der Verlust ist das rote Dreieck: Höhe $t$, Breite = Rückgang der Menge $\\frac{t}{2}$.",
          "$\\frac12 \\cdot t \\cdot \\frac t2 = \\frac{t^2}{4} = " + G.tex(D) + "$, also $t = " + G.tex(t) + "$. Der Verlust wächst mit dem **Quadrat** der Steuer: Doppelte Steuer, vierfacher Verlust.");
      }
      const buyers = v === 0, s = G.pick([[0.5, 1], [2 / 3, 2], [0.75, 3], [0.8, 4], [0.6, 1.5]]);
      const [share, k] = s, frac = { 0.5: "die Hälfte", 0.6: "60 %", 0.75: "drei Viertel", 0.8: "80 %" }[share] || "zwei Drittel";
      return task("marktlabor", "Marktlabor",
        "Eine Mengensteuer $t = 2$. Wähle die Steigung " + (buyers ? "der **Nachfrage** ($b$)" : "des **Angebots** ($d$)") + " so, dass die **" + (buyers ? "Käufer" : "Verkäufer") + " " + frac + " der Steuer** tragen.",
        Object.assign({}, base, buyers ? { b: 0.5, t: 2, edit: ["b"] } : { d: 0.5, t: 2, edit: ["d"] }),
        goal([{ when: buyers ? "abs(shareK - " + cn(share) + ") < 1e-6" : "abs(1 - shareK - " + cn(share) + ") < 1e-6", show: (buyers ? "Käuferanteil " : "Verkäuferanteil ") + frac }], buyers ? { b: k } : { d: k }),
        "Wer weniger ausweichen kann, trägt mehr: Der Käuferanteil ist $\\frac{b}{b + d}$, der Verkäuferanteil $\\frac{d}{b + d}$.",
        (buyers ? "$\\frac{b}{b + 1} = " + G.tex(share, 3) + "$ ergibt $b = " + G.tex(k) + "$" : "$\\frac{d}{1 + d} = " + G.tex(share, 3) + "$ ergibt $d = " + G.tex(k) + "$") + ". Die steilere Kurve gehört zur Marktseite, die weniger elastisch reagiert: Sie trägt die Last, egal wer die Steuer abführt.");
    },
  });

  // ---------------------------------------------------------------- games
  gen("lab-spiel", {
    title: "Spiele in Normalform",
    make(level, G) {
      const E = LW.labEcon;
      if (level === 1) {
        for (let t = 0; t < 100; t++) {
          const A = [[G.int(0, 6), G.int(0, 6)], [G.int(0, 6), G.int(0, 6)]], B = [[G.int(0, 6), G.int(0, 6)], [G.int(0, 6), G.int(0, 6)]];
          const j0 = G.int(0, 1), j1 = 1 - j0;
          if (A[0][j0] <= A[1][j0] || A[0][j1] >= A[1][j1]) continue;
          const S = A.map((r) => r.slice());
          S[0][j1] = A[1][j1] + 1;
          return task("spiellabor", "Spieltheorielabor",
            "Spieler A wählt die Zeile, B die Spalte; in jedem Feld steht zuerst die Auszahlung von A. Ändere eine Auszahlung von A so, dass **»oben« für A strikt dominant** ist.",
            { A, B, edit: ["a11", "a12", "a21", "a22"] },
            goal([{ when: "domA == 1", show: "»oben« ist für A strikt dominant" }], { A: S }),
            "Strikt dominant heißt: In **jeder** Spalte bringt »oben« mehr als »unten«. Wo ist das noch nicht so?",
            "In der Spalte »" + ["links", "rechts"][j1] + "« bringt »oben« " + A[0][j1] + ", »unten« " + A[1][j1] + ". Mit " + S[0][j1] + " statt " + A[0][j1] + " ist »oben« überall besser; A muss dann nicht mehr überlegen, was B tut.");
        }
      }
      if (level === 2) {
        return task("spiellabor", "Spieltheorielabor",
          "Baue ein **Gefangenendilemma**: (unten, rechts) soll das einzige Nash-Gleichgewicht sein, obwohl (oben, links) **beide** besserstellt.",
          { A: [[2, 2], [2, 2]], B: [[2, 2], [2, 2]], edit: "all" },
          goal([{ when: "nash == 1 && n22 == 1", show: "einziges Gleichgewicht (unten, rechts)" }, { when: "a11 > a22 && b11 > b22", show: "(oben, links) ist für beide besser" }],
            { A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]] }),
          "Beide sollen einen Anreiz haben abzuweichen: »unten« muss für A in jeder Spalte mehr bringen, »rechts« für B in jeder Zeile.",
          "Zum Beispiel A: 3, 0 / 5, 1 und B spiegelbildlich. »Unten« und »rechts« sind dominant, das Gleichgewicht (1, 1) ist schlechter als (3, 3): Individuell rationales Handeln führt kollektiv ins Schlechtere.");
      }
      if (level === 3) {
        const bos = G.chance(0.5);
        return task("spiellabor", "Spieltheorielabor",
          bos ? "Baue einen **Kampf der Geschlechter**: zwei Nash-Gleichgewichte, (oben, links) und (unten, rechts); A ist das erste lieber, B das zweite."
            : "Baue eine **Hirschjagd**: zwei Nash-Gleichgewichte, (oben, links) und (unten, rechts), wobei (oben, links) für beide besser ist.",
          { A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]], edit: "all" },
          goal([{ when: "nash == 2 && n11 == 1 && n22 == 1", show: "Gleichgewichte (oben, links) und (unten, rechts)" },
            bos ? { when: "a11 > a22 && b22 > b11", show: "A mag (oben, links) lieber, B (unten, rechts)" } : { when: "a11 > a22 && b11 > b22", show: "(oben, links) ist für beide besser" }],
            bos ? { A: [[2, 0], [0, 1]], B: [[1, 0], [0, 2]] } : { A: [[4, 0], [3, 2]], B: [[4, 3], [0, 2]] }),
          "Ein Koordinationsspiel: Wer weiß, was der andere tut, will dasselbe tun. Abweichen allein soll sich auf der Diagonale nicht lohnen.",
          bos ? "Zum Beispiel A: 2, 0 / 0, 1 und B: 1, 0 / 0, 2. Beide wollen zusammen sein, streiten aber, wo: Ohne Absprache ist offen, welches Gleichgewicht eintritt."
            : "Zum Beispiel A: 4, 0 / 3, 2 und B: 4, 3 / 0, 2. Der Hirsch (oben, links) ist für beide besser, aber riskant: Wer dem anderen nicht traut, jagt lieber sicher den Hasen.");
      }
      const [num, den, a11, a22] = G.pick([[1, 3, 2, 1], [1, 4, 3, 1], [2, 3, 1, 2], [3, 4, 1, 3], [2, 5, 3, 2]]);
      return task("spiellabor", "Spieltheorielabor",
        "B wählt so, dass A kein Gleichgewicht in reinen Strategien findet. Ändere die Auszahlungen von A so, dass B im **gemischten Gleichgewicht** »links« mit Wahrscheinlichkeit $" + G.frac(num, den) + "$ spielt.",
        { A: [[1, 0], [0, 1]], B: [[0, 1], [1, 0]], edit: ["a11", "a12", "a21", "a22"] },
        goal([{ when: "nash == 0", show: "kein Gleichgewicht in reinen Strategien" }, { when: "abs(q - " + cn(num / den) + ") < 1e-6", show: "B spielt »links« mit $q = " + G.frac(num, den) + "$" }], { A: [[a11, 0], [0, a22]] }),
        "Im gemischten Gleichgewicht macht B den Spieler **A** indifferent: $q\\,a_{11} + (1 - q)\\,a_{12} = q\\,a_{21} + (1 - q)\\,a_{22}$. B's Mischung hängt also an A's Auszahlungen.",
        "Mit $a_{11} = " + a11 + "$, $a_{22} = " + a22 + "$ und Nullen sonst: $q \\cdot " + a11 + " = (1 - q) \\cdot " + a22 + "$, also $q = " + G.frac(num, den) + "$. Paradox, aber typisch: Ändert man A's Auszahlungen, ändert sich das Verhalten von B.");
    },
  });

  // ---------------------------------------------------------------- household
  gen("lab-haushalt", {
    title: "Budget und Nutzen",
    make(level, G) {
      if (level === 1) {
        const [m, px, py, X] = G.pick([[24, 3, 2, 2], [24, 3, 2, 4], [24, 3, 2, 6], [30, 2, 3, 3], [30, 2, 3, 6], [30, 2, 3, 9]]);
        const Y = (m - px * X) / py;
        return task("haushalt", "Haushaltslabor",
          "Einkommen $m = " + m + "$, Preise $p_x = " + px + "$ und $p_y = " + py + "$. Ziehe das Güterbündel auf die **Budgetgerade**, mit genau **" + X + " Einheiten von x**.",
          { m, px, py, alpha: 0.5, x: 1, y: 1, edit: ["bundle"], showOpt: false },
          goal([{ when: "abs(x - " + X + ") < 1e-9", show: "$x = " + X + "$" }, { when: "onLine == 1", show: "das ganze Einkommen ausgegeben" }], { x: X, y: Y }),
          "Auf der Budgetgeraden gilt $p_x x + p_y y = m$.",
          "$y = \\frac{" + m + " - " + px + " \\cdot " + X + "}{" + py + "} = " + G.tex(Y) + "$. Die Steigung der Geraden ist $-\\frac{p_x}{p_y}$: So viele Einheiten y kostet eine Einheit x.");
      }
      if (level === 2) {
        const [m, px, py, al] = G.pick([[24, 2, 3, 0.5], [30, 3, 2, 0.4], [40, 4, 2, 0.6], [36, 3, 3, 0.25], [20, 1, 2, 0.4]]);
        const xs = (al * m) / px, ys = ((1 - al) * m) / py;
        return task("haushalt", "Haushaltslabor",
          "Nutzen $U = x^{" + G.tex(al) + "}\\,y^{" + G.tex(1 - al) + "}$, Einkommen " + m + ", Preise $p_x = " + px + "$, $p_y = " + py + "$. Finde das **Nutzenmaximum**.",
          { m, px, py, alpha: al, x: 1, y: 1, edit: ["bundle"], showOpt: false },
          goal([{ when: "opt == 1", show: "Haushaltsoptimum" }], { x: xs, y: ys }),
          "Im Optimum berührt eine Indifferenzkurve die Budgetgerade: Die Grenzrate der Substitution ist gleich dem Preisverhältnis.",
          "Bei Cobb-Douglas gibt der Haushalt den Anteil $\\alpha$ für x aus: $x = \\frac{\\alpha m}{p_x} = " + G.tex(xs) + "$ und $y = \\frac{(1 - \\alpha) m}{p_y} = " + G.tex(ys) + "$.");
      }
      if (level === 3) {
        const [m0, px0, px1, py, al] = G.pick([[24, 2, 4, 2, 0.5], [30, 3, 2, 2, 0.4], [40, 2, 3, 4, 0.5], [24, 3, 1.5, 2, 0.5]]);
        const x0 = (al * m0) / px0, y0 = ((1 - al) * m0) / py, ms = px1 * x0 + py * y0;
        return task("haushalt", "Haushaltslabor",
          "Bei $p_x = " + G.tex(px0) + "$ kaufte der Haushalt sein Optimum $(" + G.tex(x0) + " \\mid " + G.tex(y0) + ")$. Jetzt " + (px1 > px0 ? "steigt" : "sinkt") + " der Preis auf $p_x = " + G.tex(px1) + "$. Stelle das Einkommen so ein, dass er sich das **alte Bündel gerade noch leisten** kann.",
          { m: m0, px: px1, py, alpha: al, x: x0, y: y0, edit: ["m"], showOpt: false, ghost: { m: m0, px: px0, py } },
          goal([{ when: "onLine == 1", show: "das alte Bündel liegt auf der neuen Budgetgeraden" }], { m: ms }),
          "Das alte Bündel kostet zu neuen Preisen $p_x x_0 + p_y y_0$.",
          "$" + G.tex(px1) + " \\cdot " + G.tex(x0) + " + " + py + " \\cdot " + G.tex(y0) + " = " + G.tex(ms) + "$. Das ist die Kompensation nach Slutsky: Mit ihr wählt der Haushalt trotzdem ein anderes Bündel, weil sich das Preisverhältnis geändert hat (Substitutionseffekt).");
      }
      const s = G.pick([0.3, 0.4, 0.6, 0.7]), xs = s * 20, ys = (1 - s) * 10;
      return task("haushalt", "Haushaltslabor",
        "Einkommen 40, $p_x = 2$, $p_y = 4$. Stelle die Präferenz $\\alpha$ so ein, dass der Haushalt **" + Math.round(s * 100) + " % seines Einkommens für x** ausgibt, und ziehe das Bündel ins Optimum.",
        { m: 40, px: 2, py: 4, alpha: 0.5, x: 1, y: 1, edit: ["alpha", "bundle"], showOpt: false },
        goal([{ when: "abs(alpha - " + s + ") < 1e-9", show: "$\\alpha = " + G.tex(s) + "$" }, { when: "opt == 1", show: "Haushaltsoptimum" }], { alpha: s, x: xs, y: ys }),
        "Bei $U = x^\\alpha y^{1 - \\alpha}$ ist $\\alpha$ genau der Ausgabenanteil für x, unabhängig von Preisen und Einkommen.",
        "$\\alpha = " + G.tex(s) + "$, dann $x = \\frac{" + G.tex(s) + " \\cdot 40}{2} = " + G.tex(xs) + "$ und $y = \\frac{" + G.tex(1 - s) + " \\cdot 40}{4} = " + G.tex(ys) + "$.");
    },
  });

  // ---------------------------------------------------------------- search
  gen("lab-suche", {
    title: "Suchen im Labyrinth",
    make(level, G) {
      const S = LW.labSearch, cols = 8, rows = 6;
      const sc = (walls, s0, z0) => S.compare({ cols, rows, wall: new Set(walls), start: s0, goal: z0 }).sc;
      function find(pred, s0, z0) {
        const cells = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const k = x + "," + y; if (k !== s0.join(",") && k !== z0.join(",")) cells.push(k); }
        for (let t = 0; t < 1500; t++) {
          const dens = [0.18, 0.24, 0.3, 0.36][t % 4];
          const walls = cells.filter(() => G.r() < dens);
          if (pred(sc(walls, s0, z0))) return walls;
        }
        return null;
      }
      /** Two walls with gaps on opposite sides: the path must cross the lower one at x ≥ a and the upper one at x ≤ b, so it goes
       *  a − b steps to the left and the shortest path becomes 12 + 2(a − b). Checked with the search itself. */
      function zigzag(N, s0, z0) {
        const L = (N - 12) / 2;
        for (let t = 0; t < 80; t++) {
          const r1 = G.pick([3, 4]), r2 = G.pick([1, 2].filter((r) => r < r1 - 1)), b = G.int(0, Math.min(6, 7 - L)), a = b + L;
          const walls = [];
          for (let x = 0; x < a; x++) walls.push(x + "," + r1);
          for (let x = b + 1; x < cols; x++) walls.push(x + "," + r2);
          if (sc(walls, s0, z0).opt === N) return walls;
        }
        return grow(N, s0, z0);
      }
      /** Walls added one by one in random order, each only if Z stays reachable and the shortest path does not exceed N. */
      function grow(N, s0, z0) {
        const cells = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const k = x + "," + y; if (k !== s0.join(",") && k !== z0.join(",")) cells.push(k); }
        for (let rep = 0; rep < 40; rep++) {
          const walls = [];
          for (const k of G.shuffle(cells)) {
            const c = sc(walls.concat([k]), s0, z0);
            if (c.opt < 0 || c.opt > N) continue;
            walls.push(k);
            if (c.opt === N) return walls;
          }
        }
        return null;
      }
      if (level === 1) {
        const c = G.pick([3, 4]), [g1, g2] = G.pickN([0, 1, 2, 3, 4, 5], 2);
        const walls = [0, 1, 2, 3, 4, 5].filter((y) => y !== g1 && y !== g2).map((y) => c + "," + y);
        return task("suchlabor", "Suchlabor",
          "Sperre den Weg: Setze **höchstens zwei** weitere Wände so, dass Z von S aus **nicht mehr erreichbar** ist.",
          { cols, rows, start: [0, 5], goal: [7, 0], walls, alg: "bfs" },
          goal([{ when: "opt == -1", show: "Z ist nicht mehr erreichbar" }, { when: "walls <= " + (walls.length + 2), show: "höchstens zwei neue Wände" }], { walls: walls.concat([c + "," + g1, c + "," + g2]) }),
          "Jeder Weg von S nach Z muss die Wand an irgendeiner Stelle durchqueren.",
          "Die beiden Lücken in der Wand bilden einen **Schnitt**: Schließt man sie, zerfällt das Labyrinth in zwei Teile. Die Suche untersucht dann alle von S erreichbaren Felder und meldet, dass es keinen Weg gibt.");
      }
      if (level === 2) {
        const s0 = [0, 5], z0 = [7, 5], walls = find((c) => c.lBFS > 0 && c.lDFS > c.lBFS, s0, z0);
        return task("suchlabor", "Suchlabor",
          "Baue Wände so, dass die **Tiefensuche einen längeren Weg** findet als die Breitensuche. Z muss erreichbar bleiben.",
          { cols, rows, start: s0, goal: z0, walls: [], alg: "dfs" },
          goal([{ when: "lBFS > 0", show: "Z bleibt erreichbar" }, { when: "lDFS > lBFS", show: "Tiefensuche findet einen längeren Weg" }], { walls }),
          "Die Tiefensuche folgt einem Weg, bis es nicht weitergeht, und nimmt den ersten Weg, der ankommt. Locke sie in einen Umweg, der trotzdem zum Ziel führt.",
          "Die Breitensuche untersucht Felder nach ihrer Entfernung von S und findet daher immer einen kürzesten Weg. Die Tiefensuche ist nur vollständig, nicht optimal: Sie findet einen Weg, aber nicht unbedingt den kürzesten.");
      }
      if (level === 3) {
        const s0 = [0, 5], z0 = [7, 0], walls = find((c) => c.lAstar > 0 && c.lGreedy > c.lAstar, s0, z0);
        return task("suchlabor", "Suchlabor",
          "Baue Wände so, dass die **gierige Bestensuche** (Greedy) einen **längeren Weg** findet als A*. Z muss erreichbar bleiben.",
          { cols, rows, start: s0, goal: z0, walls: [], alg: "greedy" },
          goal([{ when: "lAstar > 0", show: "Z bleibt erreichbar" }, { when: "lGreedy > lAstar", show: "Greedy findet einen längeren Weg als A*" }], { walls }),
          "Greedy schaut nur auf die Luftlinie zum Ziel (Manhattan-Distanz). Eine Sackgasse in Zielrichtung lockt sie in die Irre.",
          "A* bewertet mit $g(n) + h(n)$: bisheriger Weg plus Schätzung. Weil die Manhattan-Distanz nie überschätzt, findet A* den kürzesten Weg. Greedy nutzt nur $h(n)$ und bleibt an dem Weg hängen, der zuerst ankommt.");
      }
      const N = G.pick([14, 16, 18]), s0 = [0, 5], z0 = [7, 0], walls = zigzag(N, s0, z0);
      return task("suchlabor", "Suchlabor",
        "Ohne Wände ist der kürzeste Weg von S nach Z 12 Schritte lang. Baue Wände so, dass er **genau " + N + " Schritte** lang wird.",
        { cols, rows, start: s0, goal: z0, walls: [], alg: "astar" },
        goal([{ when: "opt == " + N, show: "kürzester Weg: " + N + " Schritte" }], { walls }),
        "Wände, die ein Umweg umgehen muss, verlängern den kürzesten Weg immer um eine gerade Zahl von Schritten. Warum?",
        "Jeder Schritt ändert $x + y$ um 1. Von S nach Z ändert sich $x + y$ um 2, also hat jeder Weg eine gerade Länge: 12, 14, 16, … Der Umweg um eine Wand kostet je einen Schritt hin und einen zurück.");
    },
  });

  // ---------------------------------------------------------------- one neuron
  gen("lab-netz", {
    title: "Ein Neuron einstellen",
    make(level, G) {
      const NAME = { and: "UND", or: "ODER", nand: "NAND" };
      if (level === 1) {
        const t = G.pick(["and", "or", "nand"]), W = { and: "-1{,}5;\\ 1;\\ 1", or: "-0{,}5;\\ 1;\\ 1", nand: "1{,}5;\\ -1;\\ -1" }[t];
        return task("neuron", "Netzlabor",
          "Stelle die drei Gewichte so ein, dass das Neuron mit Stufenfunktion **" + NAME[t] + "** berechnet: alle vier Eingaben richtig.",
          { target: t, g: "step", w: [0, 0, 0], train: false },
          goal([{ when: "errors == 0", show: "alle vier Eingaben richtig" }], {}),
          "Das Neuron gibt 1 aus, wenn $w_0 + w_1 x_1 + w_2 x_2 \\ge 0$. Die Gerade $w_0 + w_1 x_1 + w_2 x_2 = 0$ muss die Einsen von den Nullen trennen.",
          "Zum Beispiel $(w_0;\\ w_1;\\ w_2) = (" + W + ")$. $w_0$ ist die Schwelle: Wie viele Eingaben müssen an sein, damit die Summe sie überwindet?");
      }
      if (level === 2) {
        const [t, a, w0] = G.pick([["and", 1, -1.5], ["or", 1, -0.5], ["nand", -1, 1.5]]);
        return task("neuron", "Netzlabor",
          "Das Neuron soll **" + NAME[t] + "** berechnen, und beide Eingaben sollen gleich wichtig sein: $w_1 = w_2 = " + a + "$. Finde die passende Schwelle $w_0$.",
          { target: t, g: "step", w: [0, 0, 0], train: false },
          goal([{ when: "abs(w1 - " + a + ") < 1e-9 && abs(w2 - " + a + ") < 1e-9", show: "$w_1 = w_2 = " + a + "$" }, { when: "errors == 0", show: "alle vier Eingaben richtig" }], { w: [w0, a, a] }),
          "Setze erst $w_1$ und $w_2$, dann prüfe die vier Summen $w_0$, $w_0 + " + a + "$ und $w_0 + " + 2 * a + "$.",
          "Zum Beispiel $w_0 = " + G.tex(w0) + "$; jeder Wert im passenden halboffenen Intervall geht. Lernen heißt hier: die Schwelle so legen, dass die Gerade zwischen den Klassen liegt.");
      }
      if (level === 3) {
        return task("neuron", "Netzlabor",
          "Jetzt mit **Sigmoid** statt Stufe: Das Neuron soll **ODER** berechnen, alle vier richtig klassifiziert, und der quadratische Verlust soll unter 0,12 liegen.",
          { target: "or", g: "sigmoid", w: [0, 0, 0] },
          goal([{ when: "errors == 0", show: "alle vier richtig" }, { when: "loss < 0.12", show: "Verlust unter 0,12" }], { w: [-1.5, 3, 3] }),
          "Die Sigmoidfunktion gibt Werte zwischen 0 und 1. Damit die Ausgaben nahe an 0 und 1 liegen, müssen die Summen deutlich von 0 weg sein: große Gewichte.",
          "Zum Beispiel $(w_0;\\ w_1;\\ w_2) = (-1{,}5;\\ 3;\\ 3)$: $\\sigma(-1{,}5) \\approx 0{,}18$, $\\sigma(1{,}5) \\approx 0{,}82$, $\\sigma(4{,}5) \\approx 0{,}99$. Der Lernschritt (Gradientenabstieg) findet solche Gewichte auch selbst.");
      }
      return task("neuron", "Netzlabor",
        "**XOR** ist 1, wenn genau eine Eingabe 1 ist. Versuche es mit einem Neuron: Stelle Gewichte ein, die **nur einen** der vier Punkte falsch einordnen.",
        { target: "xor", g: "step", w: [0, 0, 0] },
        goal([{ when: "errors == 1", show: "nur ein Fehler" }], { w: [-0.5, 1, 1] }),
        "Eine Gerade kann die beiden Einsen (links oben, rechts unten) nicht von den beiden Nullen trennen. Wie viele Punkte kann sie richtig machen?",
        "Zum Beispiel ODER mit $(-0{,}5;\\ 1;\\ 1)$: nur $(1, 1)$ ist falsch. Mehr geht nicht, XOR ist nicht linear trennbar. Erst eine verdeckte Schicht löst das, die Grundidee mehrschichtiger Netze.");
    },
  });

  // ---------------------------------------------------------------- sorting
  gen("lab-sortieren", {
    title: "Sortierverfahren untersuchen",
    make(level, G) {
      const L = LW.labSort, n = level === 4 ? 7 : 6, sorted = Array.from({ length: n }, (_, i) => i + 1), max = (n * (n - 1)) / 2;
      const perm = (pred) => { for (let t = 0; t < 400; t++) { const a = G.shuffle(sorted); if (pred(a)) return a; } return null; };
      if (level === 1) {
        return task("sortierlabor", "Algorithmenlabor",
          "Ordne die Balken so an, dass **Bubblesort keine einzige Vertauschung** braucht. Tippe zwei Balken an, um sie zu tauschen.",
          { values: perm((a) => L.inversions(a) >= 3 && L.inversions(a) < max), alg: "bubble" },
          goal([{ when: "sBubble == 0", show: "Bubblesort tauscht nichts" }], { values: sorted }),
          "Bubblesort tauscht nur benachbarte Balken, die falsch herum stehen.",
          "Eine schon sortierte Eingabe: Bubblesort braucht dann einen Durchlauf mit " + (n - 1) + " Vergleichen und bricht ab. Das ist der beste Fall, $O(n)$.");
      }
      if (level === 2) {
        const k = G.int(3, 9);
        // a permutation with exactly k inversions from a Lehmer code
        const code = new Array(n).fill(0);
        let left = k;
        while (left > 0) { const i = G.int(0, n - 2); if (code[i] < n - 1 - i) { code[i]++; left--; } }
        const pool = sorted.slice(), sol = code.map((c) => pool.splice(c, 1)[0]);
        return task("sortierlabor", "Algorithmenlabor",
          "Ordne die Balken so an, dass **Insertionsort genau " + k + " Vertauschungen** braucht.",
          { values: perm((a) => L.inversions(a) !== k), alg: "insertion" },
          goal([{ when: "sInsert == " + k, show: "Insertionsort: " + k + " Vertauschungen" }], { values: sol }),
          "Insertionsort tauscht jedes Element so lange nach links, bis links von ihm nichts Größeres mehr steht. Zähle die Paare, die falsch herum stehen.",
          "Jede Vertauschung beseitigt genau einen **Fehlstand** (ein Paar in falscher Reihenfolge). Also braucht Insertionsort so viele Vertauschungen, wie die Eingabe Fehlstände hat, zum Beispiel " + sol.join(", ") + ".");
      }
      if (level === 3) {
        return task("sortierlabor", "Algorithmenlabor",
          "Erzeuge den **schlimmsten Fall** für Bubblesort: so viele Vertauschungen wie überhaupt möglich.",
          { values: perm((a) => L.inversions(a) < max - 2), alg: "bubble" },
          goal([{ when: "sBubble == " + max, show: max + " Vertauschungen" }], { values: sorted.slice().reverse() }),
          "Wie viele Paare können höchstens falsch herum stehen?",
          "Absteigend sortiert steht jedes der $\\binom{" + n + "}{2} = " + max + "$ Paare falsch herum, und Bubblesort muss jedes einzeln tauschen: $O(n^2)$.");
      }
      if (G.chance(0.5)) {
        const sol = [n].concat(sorted.slice(1, n - 1), [1]);
        return task("sortierlabor", "Algorithmenlabor",
          "Finde eine Anordnung, bei der **Selectionsort genau eine** Vertauschung braucht, **Bubblesort aber mindestens fünf**.",
          { values: perm((a) => L.runSort(a, "selection").swaps !== 1), alg: "selection" },
          goal([{ when: "sSelect == 1", show: "Selectionsort: eine Vertauschung" }, { when: "sBubble >= 5", show: "Bubblesort: mindestens fünf" }], { values: sol }),
          "Selectionsort holt das kleinste Element mit **einem** Tausch an seinen Platz, egal wie weit weg es steht. Bubblesort bewegt es nur Schritt für Schritt.",
          "Zum Beispiel " + sol.join(", ") + ": Selectionsort tauscht 1 und " + n + " einmal, Bubblesort braucht " + (2 * n - 3) + " Tausche. Selectionsort macht höchstens $n - 1$ Tausche, aber immer $\\binom{n}{2}$ Vergleiche.");
      }
      const sol = [2, 1].concat(sorted.slice(2));
      return task("sortierlabor", "Algorithmenlabor",
        "Bubblesort bricht ab, sobald ein Durchlauf nichts mehr tauscht. Finde eine **unsortierte** Anordnung, bei der Bubblesort **genau zwei Durchläufe** braucht.",
        { values: perm((a) => L.runSort(a, "bubble").passes > 2), alg: "bubble" },
        goal([{ when: "sorted == 0", show: "nicht schon sortiert" }, { when: "pBubble == 2", show: "genau zwei Durchläufe" }], { values: sol }),
        "Der erste Durchlauf muss alles in Ordnung bringen, der zweite stellt nur noch fest, dass nichts mehr zu tun ist.",
        "Zum Beispiel " + sol.join(", ") + ". Ein Durchlauf schiebt das größte Element nach rechts, kleine Elemente wandern aber nur einen Platz nach links: Steht ein kleines weit rechts, braucht es viele Durchläufe.");
    },
  });

  // ---------------------------------------------------------------- kinship terminologies
  gen("lab-verwandtschaft", {
    title: "Verwandtschaftsterminologien",
    make(level, G) {
      const K = LW.labKin, seq = ["hawaii", "eskimo", "irokesen", G.pick(["crow", "omaha"])];
      const lv = Math.min(4, Math.max(1, level)), target = seq[lv - 1], from = lv === 1 ? null : seq[lv - 2], S = K.SYS[target];
      const rule = {
        hawaii: "Es zählen nur Generation und Geschlecht.",
        eskimo: "Die Kernfamilie hebt sich ab; Vater- und Mutterseite werden gleich benannt.",
        irokesen: "Geschwister gleichen Geschlechts werden gleichgesetzt: Vaterbruder wie Vater, Mutterschwester wie Mutter, ihre Kinder wie Geschwister.",
        crow: "Wie bei den Irokesen, dazu die matrilineare Verschiebung: Die Kinder der Vaterschwester heißen wie Vater und Vaterschwester.",
        omaha: "Wie bei den Irokesen, dazu die patrilineare Verschiebung: Die Kinder des Mutterbruders heißen wie Mutterbruder und Mutter.",
      }[target];
      return task("terminologie", "Verwandtschaftslabor",
        (from ? "Hier ist die Terminologie vom Typ **" + K.SYS[from].name + "**. Färbe um zum Typ **" + S.name + "**." : "Bezeichne alle 16 Verwandten nach dem Typ **" + S.name + "**.") +
          " Gleicher Buchstabe heißt gleicher Begriff: Wähle oben einen Buchstaben und tippe die Verwandten an.",
        { task: true, paint: from ? K.sysPaint(from) : {}, letters: 8 },
        goal([{ when: "done == 1", show: "alle 16 Verwandten bezeichnet" }, { when: target + " == 1", show: "Einteilung wie beim Typ " + S.name }], { system: target }),
        rule + " Der Typ " + S.name + " kennt " + S.terms.length + " Begriffe.",
        S.terms.map((t) => t[0] + ": " + t[1].join(", ")).join(" · ") + ". Terminologien ordnen Verwandte nach sozialer Rolle, nicht nach Blut: Wer gleich heißt, hat oft gleiche Rechte und Pflichten.");
    },
  });
})();
