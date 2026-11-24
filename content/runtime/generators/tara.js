/* TARA (Test of Academic Reasoning for Admissions): tasks in the style of the test.
   Critical Thinking: the hand-written bank in tara-items.js plus templates with new content every time (orders,
   chains of conditions, flaws, argument structures). Problem Solving: everyday numbers, new every time, no
   calculator needed. Writing Task: statements with model outlines, as a short outline drill or a full essay.
   Five options A to E as in the test, tasks in English, explanations in German. Built on first use. */
(function () {
  "use strict";
  const LW = window.LW;

  Object.assign(LW.glossary, {
    "underlying": "zugrunde liegend", "assumption": "Annahme", "flaw": "Denkfehler", "weakens": "schwächt",
    "strengthens": "stärkt", "parallels": "entspricht", "illustrates": "veranschaulicht", "principle": "Grundsatz",
    "subsidise": "bezuschussen", "bypass": "Umgehungsstraße", "lorries": "Lastwagen", "council": "Gemeinderat",
    "takings": "Einnahmen", "landlord": "Vermieter", "tenant": "Mieter", "receipt": "Kassenbon", "refund": "Erstattung",
    "deadline": "Abgabetermin", "loans": "Ausleihen", "grant": "Zuschuss", "applicants": "Bewerber", "entrepreneur": "Unternehmer",
    "congested": "verstopft", "revision": "Wiederholung, Prüfungsvorbereitung", "compulsory": "verpflichtend", "takeaway": "Imbiss",
    "fare": "Fahrpreis", "fares": "Fahrpreise", "timetable": "Fahrplan", "tariff": "Tarif", "allowance": "Kontingent",
    "fee": "Gebühr", "charge": "Gebühr", "spelt": "Dinkel", "rye": "Roggen", "flour": "Mehl", "tiles": "Fliesen",
    "relegated": "abgestiegen", "landscape": "Landschaftsbild", "vaccine": "Impfstoff", "migration": "Vogelzug",
    "remedy": "Heilmittel", "haunted": "verwunschen", "proposition": "Behauptung", "rehabilitate": "wieder eingliedern",
  });

  let K = null;
  const kit = () => K || (K = build());

  function build() {
    const B = LW.taraItems || {};
    const STEM = {
      conclusion: "Which one of the following best expresses the main conclusion of the above argument?",
      drawing: "Which one of the following conclusions can be drawn from the above passage?",
      assumption: "Which one of the following is an underlying assumption of the above argument?",
      evidence: "Which one of the following, if true, most weakens the above argument?",
      errors: "Which one of the following best expresses the flaw in the above argument?",
      matching: "Which one of the following most closely parallels the reasoning used in the above argument?",
      principles: "Which one of the following best illustrates the principle underlying the above argument?",
    };
    const LABEL = {
      conclusion: "Main Conclusion", drawing: "Drawing a Conclusion", assumption: "Assumption", evidence: "Additional Evidence",
      errors: "Reasoning Errors", matching: "Matching Arguments", principles: "Applying Principles",
      relevant: "Relevant Selection", procedures: "Finding Procedures", similarity: "Identifying Similarity",
    };
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    /** A choice step as in the test: passage as a quote, question in bold, five options, German explanation. */
    function task(type, passage, question, options, right, explain, extra) {
      return Object.assign({
        type: "choice", lang: "en", label: LABEL[type],
        md: (passage ? "> " + passage + "\n\n" : "") + "**" + question + "**",
        options: options.map((t, i) => ({ md: t, correct: i === right })),
        explain,
      }, extra || {});
    }

    /** Items of a bank by difficulty: Leicht the easy ones, Mittel up to medium, Schwer all, Experte the harder ones. */
    function byLevel(pool, level) {
      const want = level <= 1 ? [1] : level === 2 ? [1, 2] : level === 3 ? [1, 2, 3] : [2, 3];
      const p = pool.filter((x) => want.includes(x.l || 2));
      return p.length ? p : pool;
    }

    function fromBank(type, level, G) {
      const pool = byLevel(B[type] || [], level);
      if (!pool.length) return null;
      const x = G.pick(pool);
      return task(type, x.p, x.q || STEM[type], x.o, x.a, x.e);
    }

    // ---------------------------------------------------------------- Drawing a Conclusion: orders and chains
    const NAMES = ["Asha", "Ben", "Carla", "Dev", "Elif", "Finn", "Grace", "Hugo", "Ines", "Jonas", "Kemi", "Leo", "Maya", "Niall", "Omar", "Priya", "Rosa", "Sami", "Tara", "Uma"];
    const SCALES = [
      { more: "is taller than", less: "is shorter than", most: "is the tallest of the four", de: "größer" },
      { more: "is older than", less: "is younger than", most: "is the oldest of the four", de: "älter" },
      { more: "finished ahead of", less: "finished behind", most: "finished first of the four", de: "vor" },
      { more: "earns more than", less: "earns less than", most: "earns the most of the four", de: "verdient mehr als" },
      { more: "lives further from the school than", less: "lives nearer to the school than", most: "lives furthest from the school of the four", de: "weiter weg" },
    ];
    function orderTask(level, G) {
      const [a, b, c, d] = G.pickN(NAMES, 4);
      const s = G.pick(SCALES);
      // known: a > b, b > c, d > c; unknown: d against a and b
      const facts = G.shuffle([
        G.chance(0.5) ? a + " " + s.more + " " + b + "." : b + " " + s.less + " " + a + ".",
        G.chance(0.5) ? b + " " + s.more + " " + c + "." : c + " " + s.less + " " + b + ".",
        G.chance(0.5) ? d + " " + s.more + " " + c + "." : c + " " + s.less + " " + d + ".",
      ]);
      const right = a + " " + s.more + " " + c + ".";
      const wrong = [d + " " + s.more + " " + b + ".", d + " " + s.most + ".", b + " " + s.more + " " + d + ".", c + " " + s.more + " " + a + "."];
      const opts = G.shuffle([right].concat(wrong));
      return task("drawing", facts.join(" "), STEM.drawing, opts, opts.indexOf(right),
        "Aus den Aussagen folgt die Kette " + a + " – " + b + " – " + c + " (jeweils »" + s.de + "« in dieser Richtung): also gilt die Aussage über **" + a + " und " + c + "**. " +
        d + " ist nur mit " + c + " verglichen; ob " + d + " vor oder hinter " + a + " und " + b + " liegt, bleibt offen. Die Aussage über " + c + " und " + a + " ist sogar falsch.");
    }

    const CHAINS = [
      { p: "the festival goes ahead", np: "the festival does not go ahead", q: "the high street is closed", nq: "the high street is not closed", r: "the buses are diverted", nr: "the buses are not diverted" },
      { p: "the factory expands", np: "the factory does not expand", q: "it hires new staff", nq: "it does not hire new staff", r: "unemployment in the town falls", nr: "unemployment in the town does not fall" },
      { p: "Lena wins the scholarship", np: "Lena does not win the scholarship", q: "she moves to Edinburgh", nq: "she does not move to Edinburgh", r: "she sells her car", nr: "she does not sell her car" },
      { p: "interest rates rise", np: "interest rates do not rise", q: "mortgage costs go up", nq: "mortgage costs do not go up", r: "house sales slow down", nr: "house sales do not slow down" },
      { p: "the team wins on Saturday", np: "the team does not win on Saturday", q: "it reaches the final", nq: "it does not reach the final", r: "the final is shown on national television", nr: "the final is not shown on national television" },
      { p: "the bridge is closed for repairs", np: "the bridge is not closed for repairs", q: "the ferry runs every hour", nq: "the ferry does not run every hour", r: "extra crew are hired", nr: "extra crew are not hired" },
    ];
    function chainTask(level, G) {
      const c = G.pick(CHAINS);
      const passage = "If " + c.p + ", " + c.q + ". If " + c.q + ", " + c.r + ". " + cap(c.nr) + ".";
      const right = cap(c.np) + ".";
      const wrong = [cap(c.p) + ".", cap(c.q) + ".", "If " + c.np + ", " + c.nq + ".", "If " + c.r + ", " + c.p + "."];
      const opts = G.shuffle([right].concat(wrong));
      return task("drawing", passage, STEM.drawing, opts, opts.indexOf(right),
        "Rückwärts durch die Kette: Weil das Letzte **nicht** eintritt, kann auch das Mittlere nicht eingetreten sein, und damit auch das Erste nicht (zweimal Modus tollens). " +
        "»Wenn das Erste nicht, dann das Zweite nicht« verneint nur die Bedingung und folgt nicht; »wenn das Letzte, dann das Erste« kehrt die Richtung um.");
    }

    // ---------------------------------------------------------------- Reasoning Errors: flaws with own cases
    const FLAWS = [
      { id: "cause", fam: "cause", d: "It assumes that because two things are found together, one must cause the other.",
        de: "Zusammenhang ist noch keine Ursache: Beides kann eine gemeinsame dritte Ursache haben (Wohlstand, Interesse, Lage).",
        cases: ["Towns with more cafés have higher house prices. So opening more cafés in a town will push up its house prices.",
          "People who carry a water bottle are fitter than people who do not. Carrying a water bottle must make people fitter.",
          "Schools with more computers get better exam results, so buying more computers will improve a school's results.",
          "Households with many books have children who do well at school. Buying books for a household will therefore make its children do well at school."] },
      { id: "reverse", fam: "cause", d: "It overlooks the possibility that what it presents as the effect is actually the cause.",
        de: "Die Richtung kann umgekehrt sein: Das angebliche Ergebnis kann der Grund für das angebliche Mittel sein.",
        cases: ["Successful companies tend to have happy staff. So making staff happy is the key to a company's success.",
          "People who are ill visit their doctor more often than healthy people. Visiting the doctor must be bad for your health.",
          "Students who sit at the front of the class get better marks. So any student who moves to the front will get better marks."] },
      { id: "posthoc", fam: "cause", d: "It assumes that because one thing happened after another, it was caused by it.",
        de: "Zeitliche Abfolge ist kein Beleg für eine Ursache: Im selben Zeitraum kann sich vieles andere geändert haben.",
        cases: ["Since the town banned fireworks, the number of house fires has fallen. The ban must have prevented fires.",
          "I started taking vitamin C in October and I have not had a cold since. Vitamin C clearly protects against colds.",
          "After the company changed its logo, its sales rose. The new logo has attracted customers."] },
      { id: "necsuf", fam: "cond", d: "It treats a condition that is necessary as if it were sufficient.",
        de: "Etwas, das man **braucht**, ist noch keine **Garantie**: Die Voraussetzung ist erfüllt, aber es können weitere fehlen.",
        cases: ["You need a valid passport to travel to Canada. Ana has a valid passport, so she will travel to Canada.",
          "A building cannot go up without planning permission. The council has given permission for the stadium, so the stadium will be built.",
          "Nobody wins an Olympic medal without years of training. Kofi has trained for years, so he will win an Olympic medal."] },
      { id: "sufnec", fam: "cond", d: "It treats a condition that is sufficient as if it were necessary.",
        de: "Etwas, das **genügt**, ist nicht der **einzige** Weg: Fehlt diese Bedingung, kann das Ergebnis trotzdem eintreten.",
        cases: ["Anyone who scores over 90% receives a prize. Lea scored 85%, so she will not receive a prize.",
          "If it snows, the school closes. It is not snowing, so the school will be open.",
          "A large lunch always makes Sam sleepy. Sam ate a light lunch today, so he will not feel sleepy this afternoon."] },
      { id: "sample", fam: "gen", d: "It draws a general conclusion from a sample that may not be representative.",
        de: "Die Befragten sind **nicht repräsentativ**: Wer gefragt wurde, unterscheidet sich gerade in der fraglichen Sache vom Rest.",
        cases: ["A poll of people leaving a football match found that 80% want the stadium to be enlarged. So most people in the city want a bigger stadium.",
          "Customers who answered our online survey said they were very satisfied, so almost all our customers are satisfied.",
          "Most of the students I asked in the library think exams are too easy, so most students at the university think so."] },
      { id: "hasty", fam: "gen", d: "It draws a general conclusion from a single case.",
        de: "Ein **einzelner Fall** trägt keine allgemeine Aussage.",
        cases: ["My neighbour's electric car broke down twice in its first year. Electric cars are clearly unreliable.",
          "I tried learning the guitar from online videos and gave up after a week, so nobody can learn an instrument from videos.",
          "The last time we booked through this travel agency the hotel was awful. Every holiday it sells must be a disappointment."] },
      { id: "person", fam: "person", d: "It attacks the person who makes a claim rather than the claim itself.",
        de: "Ob ein Argument stimmt, hängt nicht davon ab, **wer** es vorbringt oder wie diese Person lebt.",
        cases: ["The minister says that the new road will reduce pollution. But she drives a large car herself, so we should not believe her.",
          "Dr Okafor's study shows that the drug is safe, but he once made a mistake in an earlier paper, so this study must be wrong.",
          "The campaigners against the airport expansion are mostly retired people with time on their hands, so their arguments can be dismissed."] },
      { id: "dilemma", fam: "dilemma", d: "It assumes that there are only two possible options when there may be others.",
        de: "Ein **falsches Entweder-oder**: Es gibt weitere Möglichkeiten, die das Argument nicht prüft.",
        cases: ["Either we close the village school or the council will go bankrupt. The council must not go bankrupt, so the school must close.",
          "Either students work through the whole summer or they will fail their exams. Asha is not working this summer, so she will fail.",
          "We must either build the new car park or accept that the shops in the centre will close. Nobody wants the shops to close, so the car park must be built."] },
      { id: "percent", fam: "numbers", d: "It confuses a rate of increase with an absolute number.",
        de: "Ein **prozentualer Anstieg** sagt nichts über die **Anzahl**: Ein großer Anstieg von einer kleinen Zahl kann weniger sein als ein kleiner Anstieg von einer großen.",
        cases: ["Burglaries rose by 50% in Fenton last year but only by 5% in the city. So Fenton now has more burglaries than the city.",
          "Sales of electric bikes rose by 200% last year, while sales of ordinary bikes rose by 10%. So more electric bikes than ordinary bikes were sold.",
          "The number of students taking Japanese doubled, while the number taking Spanish rose by a quarter. Japanese is now more popular than Spanish."] },
      { id: "whole", fam: "whole", d: "It assumes that what is true of each part must be true of the whole.",
        de: "Von den **Teilen** auf das **Ganze**: Gute Einzelteile ergeben nicht von selbst ein gutes Ganzes.",
        cases: ["Every ingredient in this cake tastes delicious on its own, so the cake will be delicious.",
          "Each part of the new machine is light, so the machine itself must be light.",
          "Each of the five people on the committee is an excellent decision-maker, so the committee will make excellent decisions."] },
      { id: "popular", fam: "authority", d: "It assumes that a claim must be true because many people believe it.",
        de: "Dass **viele** etwas glauben, macht es nicht wahr.",
        cases: ["Millions of people take this herbal remedy every winter, so it must work.",
          "Most people in the village believe the old mill is haunted, so there must be something strange about it.",
          "Nearly everyone at the meeting agreed that the plan was sound, so it must be a good plan."] },
      { id: "expert", fam: "authority", d: "It relies on the opinion of someone who is not an expert in the relevant field.",
        de: "Die Person ist auf einem **anderen** Gebiet bekannt; für diese Frage ist ihr Urteil kein Beleg.",
        cases: ["A famous actor says this diet helps people live longer, so it must be good for their health.",
          "The footballer in the advert says this bank offers the best savings rates, so we should open an account there.",
          "My driving instructor told me that the economy will grow next year, so I am sure it will."] },
      { id: "circular", fam: "circular", d: "It assumes the very thing it is trying to prove.",
        de: "Ein **Zirkel**: Der Grund setzt die Folgerung schon voraus.",
        cases: ["This history book is accurate because it contains no errors.",
          "This politician is trustworthy because he always tells the truth.",
          "Gold is valuable because people pay a lot of money for it, and people pay a lot for it because it is valuable."] },
    ];
    function flawTask(level, G) {
      const f = G.pick(FLAWS);
      const passage = G.pick(f.cases);
      const others = G.shuffle(FLAWS.filter((x) => x.fam !== f.fam));
      const used = new Set([f.fam]);
      const wrong = [];
      for (const x of others) { if (wrong.length < 4 && !used.has(x.fam)) { used.add(x.fam); wrong.push(x.d); } }
      const opts = G.shuffle([f.d].concat(wrong));
      return task("errors", passage, STEM.errors, opts, opts.indexOf(f.d), f.de + " Die anderen Beschreibungen nennen Fehler, die in diesem Text nicht vorkommen.");
    }

    // ---------------------------------------------------------------- Matching Arguments: five forms, one content
    const CONTENT = [
      { a: "it is a weekday", na: "it is not a weekday", b: "the bank is open", nb: "the bank is not open" },
      { a: "the river floods", na: "the river does not flood", b: "the meadow is under water", nb: "the meadow is not under water" },
      { a: "the oven is on", na: "the oven is not on", b: "the kitchen is warm", nb: "the kitchen is not warm" },
      { a: "the temperature falls below zero", na: "the temperature does not fall below zero", b: "the pond freezes", nb: "the pond does not freeze" },
      { a: "the referee blows the whistle", na: "the referee does not blow the whistle", b: "play stops", nb: "play does not stop" },
      { a: "the alarm is set", na: "the alarm is not set", b: "the light on the panel is red", nb: "the light on the panel is not red" },
      { a: "Omar revises", na: "Omar does not revise", b: "he passes the test", nb: "he does not pass the test" },
      { a: "the shop has the book in stock", na: "the shop does not have the book in stock", b: "Kim buys it today", nb: "Kim does not buy it today" },
    ];
    const FORMS = {
      mp: { say: (c) => "If " + c.a + ", " + c.b + ". " + cap(c.a) + ", so " + c.b + ".", de: "Wenn A, dann B; A; also B (gültig)" },
      mt: { say: (c) => "If " + c.a + ", " + c.b + ". " + cap(c.nb) + ", so " + c.na + ".", de: "Wenn A, dann B; nicht B; also nicht A (gültig)" },
      ac: { say: (c) => "If " + c.a + ", " + c.b + ". " + cap(c.b) + ", so " + c.a + ".", de: "Wenn A, dann B; B; also A (Fehlschluss: Folge bejaht)" },
      da: { say: (c) => "If " + c.a + ", " + c.b + ". " + cap(c.na) + ", so " + c.nb + ".", de: "Wenn A, dann B; nicht A; also nicht B (Fehlschluss: Bedingung verneint)" },
      ds: { say: (c) => "Either " + c.a + " or " + c.b + ". " + cap(c.na) + ", so " + c.b + ".", de: "Entweder A oder B; nicht A; also B (gültig)" },
    };
    function matchTask(level, G) {
      const [c1, c2] = G.pickN(CONTENT, 2);
      const keys = Object.keys(FORMS);
      const k = G.pick(level <= 1 ? ["mp", "mt", "ac"] : keys);
      const opts = G.shuffle(keys.map((x) => FORMS[x].say(c2)));
      const right = FORMS[k].say(c2);
      return task("matching", FORMS[k].say(c1), STEM.matching, opts, opts.indexOf(right),
        "Ersetze die Sätze durch Buchstaben. Das Argument hat die Form **" + FORMS[k].de + "**. Nur eine Option hat dieselbe Form; die anderen sind " +
        keys.filter((x) => x !== k).map((x) => FORMS[x].de.split(" (")[0]).join(", ") + ". Gleicher Aufbau zählt, nicht gleiches Thema.");
    }

    function ct(type, level, G) {
      const templates = { drawing: [orderTask, chainTask], errors: [flawTask], matching: [matchTask] }[type];
      // about every second task of these types comes from a template, the rest from the bank
      if (templates && (G.chance(0.5) || !(B[type] || []).length)) return G.pick(templates)(level, G);
      return fromBank(type, level, G) || (templates ? G.pick(templates)(level, G) : null);
    }

    // ================================================================ Problem Solving
    const money = (pence) => "£" + (pence / 100).toFixed(2);
    const clock = (t) => { const min = Math.round(t); return String(Math.floor(min / 60) % 24).padStart(2, "0") + ":" + String(((min % 60) + 60) % 60).padStart(2, "0"); };
    /** Five different options: the right one and the first four different wrong ones; more made by small steps if needed. */
    function five(right, wrong, bump) {
      const out = [right];
      for (const w of wrong) if (out.length < 5 && !out.includes(w)) out.push(w);
      let k = 1;
      while (out.length < 5 && k < 40) { const w = bump(k); if (!out.includes(w)) out.push(w); k++; }
      return out;
    }
    /** A Problem Solving task: md already holds data and the question in bold; opts[0] is the right answer. */
    function psTask(type, md, opts, explain, G, extra) {
      const right = opts[0];
      return Object.assign({
        type: "choice", lang: "en", label: LABEL[type], md,
        options: G.shuffle(opts).map((t) => ({ md: t, correct: t === right })),
        explain,
      }, extra || {});
    }

    // ---- Relevant Selection
    const PLANS = ["Talk Lite", "Everyday", "Plus", "Unlimited Lite", "Basic 200"];
    function tariffs(level, G) {
      for (let tries = 0; tries < 60; tries++) {
        const plans = G.pickN(PLANS, 3).map((name) => ({
          name, fee: G.pick([500, 750, 800, 1000, 1200, 1500, 1800]), inc: G.pick([0, 100, 200, 300, 500]),
          per: G.pick([5, 8, 10, 12, 15]), months: G.pick([1, 12, 18, 24]), gift: G.pick(["none", "headphones", "£20 voucher", "none"]),
        }));
        const use = G.pick([150, 250, 320, 400, 450, 600]);
        const cost = (p) => p.fee + Math.max(0, use - p.inc) * p.per;
        const costs = plans.map(cost);
        const best = Math.min(...costs);
        if (costs.filter((c) => c === best).length > 1 || new Set(costs).size < 3) continue;
        const bp = plans[costs.indexOf(best)];
        const wrong = [...costs.filter((c) => c !== best), bp.fee + use * bp.per, bp.fee].concat(plans.map((p) => p.fee));
        const opts = five(money(best), wrong.map(money), (k) => money(best + 50 * k));
        const table = "| Plan | Monthly fee | Minutes included | Each extra minute | Contract | Free gift |\n|---|---|---|---|---|---|\n" +
          plans.map((p) => "| " + p.name + " | " + money(p.fee) + " | " + p.inc + " | " + p.per + "p | " + p.months + (p.months === 1 ? " month" : " months") + " | " + p.gift + " |").join("\n");
        return psTask("relevant", table + "\n\nDev expects to use about " + use + " minutes of calls each month. **What is the lowest monthly cost he could pay with one of these plans?**", opts,
          "Nur Grundgebühr, Inklusivminuten und Minutenpreis zählen; Laufzeit und Geschenk sind **Ablenkung**. " +
          plans.map((p) => p.name + ": " + money(p.fee) + " + " + Math.max(0, use - p.inc) + " × " + p.per + "p = **" + money(cost(p)) + "**").join("; ") + ". Am günstigsten: " + money(best) + ".", G);
      }
      return carPark(level, G);
    }

    const STATIONS = [["Ashby", "Brookfield"], ["Harlow Green", "Kingsport"], ["Millbrook", "Northam"], ["Easton", "Westmere"]];
    function timetable(level, G) {
      for (let tries = 0; tries < 80; tries++) {
        const [from, to] = G.pick(STATIONS);
        let dep = 6 * 60 + 30 + 5 * G.int(0, 6);
        const trains = [];
        for (let i = 0; i < 5; i++) {
          const dur = G.pick([48, 55, 62, 70, 75, 84, 95]);
          const changes = dur > 70 ? G.pick([1, 2]) : 0;
          const price = G.pick([1450, 1690, 1820, 2150, 2380, 2740, 3100]) - (changes ? 300 : 0);
          trains.push({ dep, dur, arr: dep + dur, changes, price });
          dep += G.pick([15, 20, 25, 30]);
        }
        const deadline = 8 * 60 + 15 + 5 * G.int(0, 9);
        const ok = trains.filter((t) => t.arr <= deadline);
        if (ok.length < 2 || ok.length === trains.length) continue;
        const cheapest = Math.min(...ok.map((t) => t.price));
        if (ok.filter((t) => t.price === cheapest).length > 1) continue;
        const allMin = Math.min(...trains.map((t) => t.price));
        if (allMin === cheapest && level >= 2) continue; // the cheapest overall should arrive too late (trap)
        const pick = ok.find((t) => t.price === cheapest);
        const opts = [clock(pick.dep)].concat(trains.filter((t) => t !== pick).map((t) => clock(t.dep)));
        const table = "| Departs " + from + " | Arrives " + to + " | Changes | Fare |\n|---|---|---|---|\n" +
          trains.map((t) => "| " + clock(t.dep) + " | " + clock(t.arr) + " | " + t.changes + " | " + money(t.price) + " |").join("\n");
        return psTask("relevant", table + "\n\nKemi has to be in " + to + " by " + clock(deadline) + ". She does not mind changing trains and wants the cheapest fare. **Which train should she catch from " + from + "?**", opts,
          "Zuerst aussortieren, was zu spät ankommt (nach " + clock(deadline) + "). Übrig: " + ok.map((t) => clock(t.dep) + " (" + money(t.price) + ")").join(", ") +
          ". Davon ist der Zug um **" + clock(pick.dep) + "** am günstigsten. Ein noch billigerer Zug kommt zu spät an.", G);
      }
      return tariffs(level, G);
    }

    function carPark(level, G) {
      const first = G.pick([150, 200, 250]), each = G.pick([100, 120, 150, 180]), cap = G.pick([900, 1000, 1200]);
      const evening = G.pick([300, 400, 500]);
      const start = 8 * 60 + 5 * G.int(0, 20);
      const stay = level >= 3 ? G.pick([395, 430, 470, 520, 560]) : G.pick([95, 130, 170, 205, 250, 275]);
      const hours = Math.ceil(stay / 60);
      const raw = first + (hours - 1) * each;
      const cost = Math.min(cap, raw);
      const exact = Math.round(first + (stay / 60 - 1) * each);
      const wrong = [raw, exact, hours * each, first + hours * each, hours * first, cap];
      const opts = five(money(cost), wrong.map(money), (k) => money(cost + 10 * k * (k % 2 ? 1 : -1)));
      return psTask("relevant", "**Station car park charges**\n\n- First hour (or part of an hour): " + money(first) + "\n- Each further hour or part of an hour: " + money(each) +
        "\n- Maximum charge per day: " + money(cap) + "\n- Evening rate (arrival after 18:00): " + money(evening) + " flat\n- Blue badge holders park free\n\n" +
        "Jon parks from " + clock(start) + " to " + clock(start + stay) + ". **How much does he pay?**", opts,
        "Abendtarif und Behindertenausweis betreffen Jon nicht. Er parkt " + Math.floor(stay / 60) + " h " + (stay % 60) + " min, das sind **" + hours + " angefangene Stunden**: " +
        money(first) + " + " + (hours - 1) + " × " + money(each) + " = " + (raw > cap ? money(raw) + ", gedeckelt auf den Tageshöchstsatz **" + money(cap) + "**." : "**" + money(cost) + "**."), G);
    }

    function recipe(level, G) {
      const people = G.pick([6, 10, 14, 18, 22]);
      const flour = 300 * people / 4, eggs = people / 2;
      const bagSize = G.pick([500, 1000]), bagPrice = bagSize === 500 ? 75 : 120, boxSize = G.pick([6, 10]), boxPrice = boxSize === 6 ? 180 : 270;
      const bags = Math.ceil(flour / bagSize), boxes = Math.ceil(eggs / boxSize);
      const cost = bags * bagPrice + boxes * boxPrice;
      const wrong = [Math.round(flour / bagSize * bagPrice + eggs / boxSize * boxPrice), bagPrice + boxPrice, (bags + 1) * bagPrice + boxes * boxPrice,
        bags * bagPrice + (boxes + 1) * boxPrice, cost + 95, Math.ceil(300 / bagSize) * bagPrice + Math.ceil(2 / boxSize) * boxPrice];
      const opts = five(money(cost), wrong.map(money), (k) => money(cost + 15 * k));
      return psTask("relevant", "A pancake recipe for 4 people uses 300 g of flour, 2 eggs, 450 ml of milk and a pinch of salt. Flour is sold in " + bagSize + " g bags at " + money(bagPrice) +
        ", eggs in boxes of " + boxSize + " at " + money(boxPrice) + ", milk in 1 litre cartons at 95p. Leila already has plenty of milk and salt.\n\n" +
        "**She is making pancakes for " + people + " people. What is the least she must spend on the ingredients she has to buy?**", opts,
        "Milch und Salz hat sie schon, sie zählen nicht. Für " + people + " Personen: " + flour + " g Mehl, also **" + bags + "** Packung(en), und " + eggs + " Eier, also **" + boxes + "** Schachtel(n). " +
        bags + " × " + money(bagPrice) + " + " + boxes + " × " + money(boxPrice) + " = **" + money(cost) + "**. Packungen kauft man nur ganz.", G);
    }

    // ---- Finding Procedures
    function ages(level, G) {
      const son = G.int(6, 15), n = G.int(2, 9), diff = son + n, rosa = son + diff;
      const opts = five(String(rosa), [son, rosa + n, son + n, 2 * son, diff].map(String), (k) => String(rosa + k));
      return psTask("procedures", "Rosa is " + diff + " years older than her brother Tom. In " + n + " years' time she will be exactly twice as old as he will be then.\n\n**How old is Rosa now?**", opts,
        "In " + n + " Jahren ist der Abstand immer noch " + diff + " Jahre. Ist sie dann doppelt so alt, ist Tom dann genau " + diff + " Jahre alt, heute also " + son + ". Rosa ist heute **" + rosa + "**. Probe: " + (rosa + n) + " = 2 × " + (son + n) + ".", G);
    }

    function together(level, G) {
      const a = G.pick([12, 15, 18, 20, 24]), b = G.pick([16, 20, 25, 30, 40, 45]);
      if (a === b) return together(level, G);
      const l = (a * b) / G.gcd(a, b);
      if (l > 360) return together(level, G);
      const start = 7 * 60;
      const opts = five(clock(start + l), [clock(start + a * b), clock(start + a + b), clock(start + l - a), clock(start + l + a), clock(start + Math.max(a, b) * 2)], (k) => clock(start + l + 5 * k));
      return psTask("procedures", "Buses on route 4 leave the depot every " + a + " minutes and buses on route 9 every " + b + " minutes. A bus on each route leaves at 07:00.\n\n**When do buses on both routes next leave at the same time?**", opts,
        "Gemeinsame Abfahrten liegen im Abstand des **kleinsten gemeinsamen Vielfachen** von " + a + " und " + b + ": " + l + " Minuten. 07:00 + " + l + " min = **" + clock(start + l) + "**. Das Produkt " + a + " × " + b + " ist zwar ein gemeinsames Vielfaches, aber nicht das kleinste.", G);
    }

    function average(level, G) {
      const n = G.pick([4, 5, 6]), m = G.pick([60, 64, 68, 70, 72]), d = G.pick([2, 3, 4]);
      const need = m + (n + 1) * d;
      const opts = five(String(need), [m + d, m + n * d, need - d, need + d, m + 2 * d].map(String), (k) => String(need + k));
      return psTask("procedures", "Ola's mean mark over her first " + n + " tests is " + m + ". There is one more test.\n\n**What mark does she need in it to raise her mean to " + (m + d) + "?**", opts,
        "Rechne mit Summen: bisher " + n + " × " + m + " = " + n * m + ", gebraucht " + (n + 1) + " × " + (m + d) + " = " + (n + 1) * (m + d) + ". Differenz: **" + need + "**. Kurz: Der letzte Test muss " + (m + d) + " schaffen und zusätzlich " + n + " × " + d + " Punkte für die alten Tests nachliefern.", G);
    }

    function reverse(level, G) {
      const p = G.pick([10, 20, 25, 40]), base = G.pick([20, 40, 60, 80, 120, 160, 200]);
      const sale = base * (100 - p) / 100;
      if (!Number.isInteger(sale)) return reverse(level, G);
      const opts = five("£" + base, ["£" + Math.round(sale * (1 + p / 100)), "£" + (sale + p), "£" + Math.round(sale * 100 / (100 + p)), "£" + (base + p), "£" + (base - p)], (k) => "£" + (base + 2 * k));
      return psTask("procedures", "In a sale, every coat is reduced by " + p + "%. Malik pays £" + sale + " for a coat.\n\n**What was its price before the sale?**", opts,
        "Der Verkaufspreis ist **" + (100 - p) + " %** des alten Preises. Also alter Preis = " + sale + " : " + String((100 - p) / 100).replace(".", ",") + " = **£" + base + "**. Wer " + p + " % auf £" + sale + " aufschlägt, rechnet vom falschen Grundwert.", G);
    }

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const MONTHS = [["January", 31, "February"], ["March", 31, "April"], ["April", 30, "May"], ["May", 31, "June"], ["June", 30, "July"], ["July", 31, "August"], ["September", 30, "October"], ["October", 31, "November"]];
    const ord = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
    function weekday(level, G) {
      const [m1, len, m2] = G.pick(MONTHS);
      const d1 = G.int(3, 26), d2 = G.int(2, 25), s = G.int(0, 6);
      const off = len - d1 + d2;
      const ans = (s + off) % 7;
      const opts = five(DAYS[ans], [DAYS[(ans + 1) % 7], DAYS[(ans + 6) % 7], DAYS[(ans + 2) % 7], DAYS[s]], (k) => DAYS[(ans + 3 + k) % 7]);
      return psTask("procedures", "The " + ord(d1) + " of " + m1 + " is a " + DAYS[s] + ". " + m1 + " has " + len + " days.\n\n**On which day of the week is the " + ord(d2) + " of " + m2 + "?**", opts,
        "Bis zum Monatsende sind es " + (len - d1) + " Tage, dazu " + d2 + " Tage: zusammen " + off + " Tage. " + off + " = " + Math.floor(off / 7) + " × 7 + " + (off % 7) + ", also " + (off % 7) + " Wochentage weiter: **" + DAYS[ans] + "**.", G);
    }

    function stamps(level, G) {
      const [a, b] = G.pick([[7, 10], [5, 12], [8, 11], [6, 13], [9, 14]]);
      for (let tries = 0; tries < 40; tries++) {
        const x = G.int(40, 110);
        let best = null, greedy = null;
        for (let i = 0; i * b <= x; i++) { const r = x - i * b; if (r % a === 0) { const n = i + r / a; if (best === null || n < best) best = n; } }
        if (best === null) continue;
        for (let i = Math.floor(x / b); i >= 0; i--) { const r = x - i * b; if (r % a === 0) { greedy = i + r / a; break; } }
        const opts = five(String(best), [best + 1, best + 2, best - 1, greedy, Math.ceil(x / b)].filter((v) => v > 0).map(String), (k) => String(best + 2 + k));
        return psTask("procedures", "A post office sells only " + a + "p and " + b + "p stamps. Hana needs stamps worth exactly " + x + "p on a parcel.\n\n**What is the smallest number of stamps she can use?**", opts,
          "Systematisch durchprobieren: Anzahl der " + b + "p-Marken von groß nach klein, bis der Rest durch " + a + " teilbar ist. Das kleinste Gesamtergebnis sind **" + best + "** Marken. Die Lösung muss den Betrag **genau** treffen.", G);
      }
      return ages(level, G);
    }

    function taps(level, G) {
      const [a, b] = G.pick([[12, 6], [10, 15], [20, 30], [6, 3], [24, 12], [30, 20], [36, 12], [40, 10], [18, 9], [28, 21]]);
      const t = (a * b) / (a + b);
      const opts = five(t + " minutes", [(a + b) / 2, a + b, Math.abs(a - b), Math.min(a, b) / 2 + 1, Math.round((a + b) / 4)].map((v) => v + " minutes"), (k) => (t + k) + " minutes");
      return psTask("procedures", "Tap A fills a tank in " + a + " minutes; tap B fills the same tank in " + b + " minutes.\n\n**How long does it take to fill the empty tank with both taps running?**", opts,
        "Pro Minute schafft A $\\tfrac{1}{" + a + "}$ und B $\\tfrac{1}{" + b + "}$ des Tanks, zusammen $\\tfrac{1}{" + a + "} + \\tfrac{1}{" + b + "} = \\tfrac{" + (a + b) / G.gcd(a + b, a * b) + "}{" + (a * b) / G.gcd(a + b, a * b) + "}$. Also **" + t + " Minuten**. Der Mittelwert der Zeiten wäre zu lang: Zwei Hähne sind schneller als jeder einzelne.", G);
    }

    function deals(level, G) {
      const s = G.int(2, 5), m = G.int(3, 6), d = G.int(2, 4);
      const right = m * (s + d);
      const opts = five(String(right), [s * m * d, s + m + d, m * s + d, m * (s + d + 1), m * s * d + m].map(String), (k) => String(right + k));
      return psTask("procedures", "A café's lunch deal is one main course together with either one starter or one dessert (not both). There are " + s + " starters, " + m + " main courses and " + d + " desserts.\n\n**How many different lunch deals are possible?**", opts,
        "Zu jedem der " + m + " Hauptgerichte passt **eine** der " + (s + d) + " Beilagen (Vorspeise oder Nachtisch): " + m + " × " + (s + d) + " = **" + right + "**. Mit allen dreien zu multiplizieren hieße, beides zu nehmen.", G);
    }

    function tiles(level, G) {
      const L = G.pick([3, 3.5, 4, 4.5, 5]), Wd = G.pick([2, 2.5, 3]), n = G.pick([6, 8, 10, 12]);
      const count = L * 2 * Wd * 2, boxes = Math.ceil(count / n);
      const opts = five(String(boxes), [Math.floor(count / n), Math.ceil((L * Wd) / n), Math.ceil(count / n) + 1, Math.ceil((L * Wd * 2) / n), count].map(String), (k) => String(boxes + k + 1));
      return psTask("procedures", "A rectangular floor measures " + String(L).replace(".", ".") + " m by " + Wd + " m. It is to be covered with square tiles measuring 50 cm by 50 cm, which are sold in boxes of " + n + ". No tiles need to be cut.\n\n**How many boxes must be bought?**", opts,
        "Pro Meter passen 2 Fliesen: " + L * 2 + " × " + Wd * 2 + " = " + count + " Fliesen. " + count + " : " + n + " = " + (count / n).toFixed(2).replace(".", ",") + ", also **" + boxes + " Kartons** (aufrunden). Wer mit 0,5 m² pro Fliese rechnet statt mit 0,25 m², braucht nur halb so viele.", G);
    }

    function journey(level, G) {
      const v1 = G.pick([12, 15, 18, 20, 24]), v2 = G.pick([10, 12, 15, 20]);
      const d1 = v1 * G.pick([1, 1.5, 2]), d2 = v2 * G.pick([0.5, 1, 1.5]);
      const rest = G.pick([15, 20, 25, 30]);
      const start = 9 * 60 + 5 * G.int(0, 6);
      const t1 = (d1 / v1) * 60, t2 = (d2 / v2) * 60;
      const arr = start + t1 + rest + t2;
      const opts = five(clock(arr), [clock(arr - rest), clock(start + (d1 / v2) * 60 + rest + (d2 / v1) * 60), clock(arr + 15), clock(start + ((d1 + d2) / ((v1 + v2) / 2)) * 60 + rest), clock(arr - 15)], (k) => clock(arr + 5 * k));
      return psTask("procedures", "Nadia sets off on her bike at " + clock(start) + ". She rides " + d1 + " km at " + v1 + " km/h, rests for " + rest + " minutes, then rides another " + d2 + " km at " + v2 + " km/h.\n\n**At what time does she arrive?**", opts,
        "Zeit = Strecke : Tempo. Erste Etappe: " + String(d1).replace(".", ",") + " : " + v1 + " h = " + t1 + " min; Pause " + rest + " min; zweite Etappe: " + String(d2).replace(".", ",") + " : " + v2 + " h = " + t2 + " min. Zusammen " + (t1 + rest + t2) + " min nach " + clock(start) + ": **" + clock(arr) + "**.", G);
    }

    // ---- Identifying Similarity
    const DIRS = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0] };
    function route(level, G) {
      const make = () => G.shuffle(Object.keys(DIRS)).slice(0, 4).map((d) => [G.int(1, 5), d]);
      const pos = (r) => r.reduce((p, [n, d]) => [p[0] + n * DIRS[d][0], p[1] + n * DIRS[d][1]], [0, 0]);
      const say = (r) => r.map(([n, d]) => n + " " + d).join(", ");
      for (let tries = 0; tries < 80; tries++) {
        const base = make(), target = pos(base);
        let right = null;
        for (let k = 0; k < 60 && !right; k++) { const r = make(); if (pos(r)[0] === target[0] && pos(r)[1] === target[1] && say(r) !== say(base)) right = r; }
        if (!right) continue;
        const wrong = [];
        for (let k = 0; k < 200 && wrong.length < 4; k++) {
          const r = right.map(([n, d]) => [n, d]);
          const i = G.int(0, 3);
          r[i][0] = Math.max(1, r[i][0] + G.pick([-2, -1, 1, 2]));
          const p = pos(r);
          if ((p[0] !== target[0] || p[1] !== target[1]) && !wrong.includes(say(r))) wrong.push(say(r));
        }
        if (wrong.length < 4) continue;
        const opts = [say(right)].concat(wrong);
        const fields = (n) => Math.abs(n) + (Math.abs(n) === 1 ? " Feld" : " Felder");
        const where = (p) => [p[0] ? fields(p[0]) + (p[0] > 0 ? " östlich" : " westlich") : null, p[1] ? fields(p[1]) + (p[1] > 0 ? " nördlich" : " südlich") : null]
          .filter(Boolean).join(" und ") || "genau am Start";
        return psTask("similarity", "A robot on a grid follows the route: **" + say(base) + "** (squares in each direction, in that order).\n\n**Which one of the following routes takes it to the same square?**", opts,
          "Nur die **Summe** zählt: Ost minus West und Nord minus Süd. Die Route endet " + where(target) + (target[0] || target[1] ? " vom Start" : "") + ". Die richtige Option kommt in anderer Reihenfolge zum selben Ergebnis; bei den anderen ist eine Zahl verändert.", G);
      }
      return ratio(level, G);
    }

    function ratio(level, G) {
      const [a, b] = G.pick([[2, 7], [3, 5], [3, 8], [4, 9], [2, 5], [5, 6]]);
      const k = G.int(2, 4);
      const right = k * a + " parts syrup to " + k * b + " parts water";
      const cands = [[k * a + 1, k * b], [k * a, k * b + 1], [a + k, b + k], [k * b, k * a], [k * a + a, k * b], [k * a - 1, k * b - 1]];
      const wrong = cands.filter(([x, y]) => x * b !== y * a && x > 0 && y > 0).map(([x, y]) => x + " parts syrup to " + y + " parts water");
      const opts = five(right, wrong, (j) => (k * a + j + 1) + " parts syrup to " + (k * b) + " parts water");
      return psTask("similarity", "A cordial is mixed from " + a + " parts syrup to " + b + " parts water.\n\n**Which one of the following mixes has exactly the same strength?**", opts,
        "Gleiche Stärke heißt **gleiches Verhältnis**: Beide Teile mit derselben Zahl malnehmen, hier mit " + k + ". Auf beide Seiten dieselbe Zahl **addieren** ändert das Verhältnis.", G);
    }

    const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    function chart(level, G) {
      const n = level <= 1 ? 4 : 5;
      const labels = WEEK.slice(0, n);
      const vals = labels.map(() => 10 * G.int(1, 8));
      if (new Set(vals).size < n - 1) return chart(level, G);
      const say = (v) => labels.map((l, i) => l + " " + v[i]).join(", ");
      const wrongs = [];
      const swap = vals.slice(); const i = G.int(0, n - 2); [swap[i], swap[i + 1]] = [swap[i + 1], swap[i]];
      if (swap.join() !== vals.join()) wrongs.push(say(swap));
      const up = vals.slice(); up[G.int(0, n - 1)] += 20; wrongs.push(say(up));
      const down = vals.map((v) => Math.max(10, v - 10)); if (down.join() !== vals.join()) wrongs.push(say(down));
      wrongs.push(say(vals.slice().reverse()));
      const plus = vals.slice(); plus[n - 1] += 10; plus[0] = Math.max(10, plus[0] - 10); wrongs.push(say(plus));
      const opts = five(say(vals), wrongs.filter((w) => w !== say(vals)), (k) => say(vals.map((v, j) => (j === k % n ? v + 30 : v))));
      return psTask("similarity", "The chart shows the number of bikes a shop hired out each weekday last week.\n\n**Which one of the following lists shows the same data as the chart?**", opts,
        "Lies jeden Balken an der Skala ab und vergleiche **Tag für Tag**; schon ein falscher Wert oder vertauschte Tage schließen eine Option aus. Richtig: " + say(vals) + ".", G,
        { chart: { type: "bar", labels, series: [{ title: "Bikes hired", data: vals }] } });
    }

    const MODES = ["walk", "cycle", "come by bus", "come by car"];
    function shares(level, G) {
      // class sizes whose students are whole percentages: 5 %, 4 % or 2 % each
      const total = G.pick([20, 25, 50]);
      for (let tries = 0; tries < 60; tries++) {
        const c3 = [G.int(2, total / 2 - 2), G.int(2, total / 4), G.int(1, total / 5)];
        const c4 = total - c3.reduce((s, x) => s + x, 0);
        if (c4 < 1) continue;
        const counts = c3.concat(c4);
        const all = counts.map((c) => (100 * c) / total);
        if (new Set(all).size < 4) continue;
        const say = (ps) => ps.map((p, i) => p + "% " + MODES[i].replace("come by ", "")).join(", ");
        const wrong = [
          say(counts.map((c) => Math.round((100 * c) / (total + 10)))),
          say([all[1], all[0], all[2], all[3]]),
          say(counts.map((c) => c)),
          say(all.map((p, i) => (i === 0 ? p + 5 : i === 3 ? p - 5 : p))),
          say(all.map((p, i) => (i === 1 ? p + 10 : i === 2 ? p - 10 : p))),
        ].filter((w) => w !== say(all) && !/-\d/.test(w));
        const opts = five(say(all), wrong, (k) => say(all.map((p, i) => (i === k % 4 ? p + 5 : i === (k + 1) % 4 ? p - 5 : p))));
        return psTask("similarity", "In a class of " + total + " students, " + counts[0] + " walk to school, " + counts[1] + " cycle, " + counts[2] + " come by bus and " + counts[3] + " come by car.\n\n**Which one of the following shows the same information as percentages?**", opts,
          "Jeder Schüler ist $\\tfrac{100}{" + total + "}$ = " + 100 / total + " % der Klasse. Also " + counts.map((c, i) => c + " → " + all[i] + " %").join(", ") + ". Die Prozente müssen sich zu 100 addieren und in derselben Reihenfolge stehen.", G);
      }
      return ratio(level, G);
    }

    function sequence(level, G) {
      const geo = G.chance(0.5);
      if (geo) {
        const r = G.pick([2, 3]), s1 = G.int(1, 4), s2 = G.int(2, 6);
        const seq = (s) => [s, s * r, s * r * r, s * r * r * r];
        const right = seq(s2 === s1 ? s1 + 1 : s2);
        const isGeo = (q) => q[1] === q[0] * r && q[2] === q[1] * r && q[3] === q[2] * r;
        const cands = [[right[0], right[0] + right[0] * (r - 1), right[0] + 2 * right[0] * (r - 1), right[0] + 3 * right[0] * (r - 1)],
          [right[0], right[1], right[2], right[3] + right[0]], [right[0], right[0] * (r + 1), right[0] * (r + 1) * (r + 1), right[0] * Math.pow(r + 1, 3)],
          [right[0], right[1], right[1] + right[0] * r, right[2] + right[0] * r], [1, 4, 9, 16], [right[0], right[1] + 1, right[2] + 2, right[3] + 3]]
          .filter((q) => !isGeo(q));
        const say = (q) => q.join(", ");
        const opts = five(say(right), cands.map(say), (k) => say([k + 1, (k + 1) * r + 1, (k + 1) * r * r, (k + 1) * r * r * r]));
        return psTask("similarity", "In the sequence **" + say(seq(s1)) + "**, each number is found from the one before by the same rule.\n\n**Which one of the following sequences follows the same rule?**", opts,
          "Die Regel ist **»mal " + r + "«**: Jede Zahl ist das " + r + "-Fache der vorigen. Prüfe bei jeder Option alle Schritte, nicht nur den ersten.", G);
      }
      const d = G.int(3, 7), s1 = G.int(1, 9), s2 = G.int(10, 20);
      const seq = (s) => [s, s + d, s + 2 * d, s + 3 * d];
      const isAr = (q) => q[1] - q[0] === d && q[2] - q[1] === d && q[3] - q[2] === d;
      const right = seq(s2);
      const cands = [[s2, s2 * 2, s2 * 4, s2 * 8], [s2, s2 + d, s2 + 2 * d + 1, s2 + 3 * d + 1], [s2, s2 + d + 1, s2 + 2 * d + 2, s2 + 3 * d + 3],
        [s2, s2 + d, s2 + 3 * d, s2 + 6 * d], [d, 2 * d + 1, 3 * d + 2, 4 * d + 3], [s2, s2 + d - 1, s2 + 2 * d - 2, s2 + 3 * d - 3]].filter((q) => !isAr(q));
      const say = (q) => q.join(", ");
      const opts = five(say(right), cands.map(say), (k) => say([s2 + k, s2 + k + d + 2, s2 + k + 2 * d + 4, s2 + k + 3 * d + 6]));
      return psTask("similarity", "In the sequence **" + say(seq(s1)) + "**, each number is found from the one before by the same rule.\n\n**Which one of the following sequences follows the same rule?**", opts,
        "Die Regel ist **»plus " + d + "«**. Nur bei einer Option ist jeder Abstand genau " + d + "; andere fangen richtig an und weichen später ab.", G);
    }

    function hands(level, G) {
      const angle = (h, m) => { const x = Math.abs(30 * h - 5.5 * m) % 360; return Math.min(x, 360 - x); };
      const targets = [[3, 0, 90], [2, 0, 60], [4, 0, 120], [1, 0, 30], [5, 0, 150]];
      const [h0, m0, a] = G.pick(targets);
      const pool = [];
      for (let h = 1; h <= 12; h++) for (const m of [0, 30]) pool.push([h, m]);
      const same = pool.filter(([h, m]) => angle(h % 12, m) === a && !(h === h0 && m === m0));
      if (!same.length) return hands(level, G);
      const right = G.pick(same);
      const other = G.shuffle(pool.filter(([h, m]) => angle(h % 12, m) !== a)).slice(0, 4);
      const say = ([h, m]) => h + ":" + String(m).padStart(2, "0");
      const opts = [say(right)].concat(other.map(say));
      return psTask("similarity", "At " + say([h0, m0]) + " the hour hand and the minute hand of a clock make an angle of " + a + "°.\n\n**At which one of the following times do the hands make the same angle?**", opts,
        "Der Minutenzeiger wandert 6° pro Minute, der Stundenzeiger 0,5° pro Minute (30° pro Stunde). Um halb steht der Stundenzeiger **zwischen** zwei Zahlen. Nur um " + say(right) + " ergeben sich wieder " + a + "°.", G);
    }

    const PS = {
      relevant: [tariffs, timetable, carPark, recipe],
      procedures: [ages, together, average, reverse, weekday, stamps, taps, deals, tiles, journey],
      similarity: [route, ratio, chart, shares, sequence, hands],
    };
    const ps = (type, level, G) => G.pick(PS[type])(level, G);

    // ================================================================ Writing Task
    const PROMPTS = [
      ["A good education should make people less certain, not more.", "**Meaning:** education as learning to doubt and weigh evidence, not collecting fixed answers; ‘certain’ about facts or about beliefs? **Against:** some certainty is the point of knowledge (vaccines work, the earth is round); doubt about everything paralyses and invites relativism. **How far I agree:** it should make people less certain about contested questions and more certain about how to test claims. **Example:** a science course that teaches error bars rather than lists of facts."],
      ["Governments should not pay for the arts.", "**Meaning:** public money for theatres, museums, orchestras; claim that taste is private and taxes should fund necessities. **Against:** art is a public good (shared culture, access for those who cannot pay); markets underprovide experimental work. **How far I agree:** limited agreement: subsidy is justified for access and heritage, less for prestige projects; funding should be open about its aims. **Example:** free museum entry versus a new opera house."],
      ["Science can tell us how the world is, but not how we ought to live.", "**Meaning:** the gap between facts and values (Hume); science describes, ethics prescribes. **Against:** values depend on facts about suffering and wellbeing; science can show which policies cause harm. **How far I agree:** mostly agree: science informs choices but cannot settle which goals matter; still, many disagreements are about facts. **Example:** climate science shows consequences, not how to weigh present against future generations."],
      ["Free trade makes every country richer.", "**Meaning:** removing tariffs lets countries specialise (comparative advantage); ‘richer’ in total income. **Against:** gains are unevenly spread; some regions and industries lose; infant industries may need protection. **How far I agree:** agree on average income, disagree that every group or country gains without compensation. **Example:** cheaper goods for consumers versus closed factories in one town."],
      ["We should judge actions by their consequences, not by the intentions behind them.", "**Meaning:** consequentialism versus ethics of motives. **Against:** intentions show character and responsibility; we cannot control all outcomes; punishing bad luck seems unfair. **How far I agree:** consequences matter most for policy, intentions for blame. **Example:** a doctor whose careful treatment fails, and a reckless driver who happens to hurt no one."],
      ["Tradition is a poor guide to what is right.", "**Meaning:** customs persist for reasons unrelated to morality. **Against:** traditions can store tested practical wisdom (Burke); sudden change has unforeseen costs. **How far I agree:** tradition is evidence, not proof: it deserves a hearing but must justify itself. **Example:** past exclusion of women from universities versus customs of hospitality."],
      ["The internet has made people less well informed, not more.", "**Meaning:** information is plentiful, understanding scarce; misinformation and filter bubbles. **Against:** unprecedented access to sources, data and education; more people can check claims. **How far I agree:** it depends on habits and skills; the internet amplifies both diligence and credulity. **Example:** open lecture courses versus viral false stories."],
      ["Economic growth should no longer be a goal for rich countries.", "**Meaning:** GDP growth as policy aim; costs to the environment and wellbeing. **Against:** growth funds health care, pensions and innovation; without it, conflicts over shares sharpen. **How far I agree:** growth should stop being the only aim; what grows matters (clean energy versus waste). **Example:** wellbeing budgets that track health and time use as well as output."],
      ["Prisons should aim to rehabilitate offenders rather than to punish them.", "**Meaning:** purpose of imprisonment: reform versus retribution. **Against:** justice requires proportionate punishment; victims' sense of fairness; deterrence. **How far I agree:** largely agree because most prisoners return to society; punishment can set limits but should not crowd out reform. **Example:** education in prison and lower reoffending."],
      ["Voting should be compulsory.", "**Meaning:** a legal duty to vote (or at least to attend). **Against:** freedom includes the right to abstain; forced votes may be uninformed or random. **How far I agree:** a duty to turn out with an option to vote for nobody is defensible, because it reduces unequal turnout. **Example:** compulsory voting with a ‘none of the above’ box."],
      ["History is written by the winners.", "**Meaning:** accounts of the past reflect the power of those who survived or ruled. **Against:** losers, minorities and later historians have rewritten history; archives and archaeology correct myths. **How far I agree:** true for official accounts at the time, less true over long periods. **Example:** colonial records later read against the grain."],
      ["A university should teach students to think, not to get jobs.", "**Meaning:** liberal education versus vocational training. **Against:** students pay and need work; employers need specific skills; thinking without content is empty. **How far I agree:** the best job preparation is often good thinking, but courses should not ignore careers. **Example:** a history degree that teaches judging sources."],
      ["Charity is a poor substitute for justice.", "**Meaning:** voluntary giving cannot replace fair institutions and rights. **Against:** charity is often faster and more flexible; it fills gaps that politics leaves. **How far I agree:** agree as a long-term principle; in emergencies charity is indispensable. **Example:** food banks and the question of wages and benefits."],
      ["Children should be taught to question authority.", "**Meaning:** critical attitude towards parents, teachers, governments. **Against:** children need guidance and trust; constant questioning undermines learning and safety. **How far I agree:** teach how to question well (reasons, evidence) rather than reflex defiance. **Example:** asking a teacher for the evidence behind a claim."],
      ["Some lies are better than the truth.", "**Meaning:** cases where lying produces better outcomes. **Against:** lying erodes trust and treats people as means (Kant); the liar often misjudges consequences. **How far I agree:** rare exceptions (hiding someone from persecution) but a strong default for honesty. **Example:** a surprise party versus a doctor hiding a diagnosis."],
      ["Cities, not countries, should be the main units of government.", "**Meaning:** devolving power to cities. **Against:** national issues (defence, currency, redistribution between regions); cities could deepen inequality with the countryside. **How far I agree:** more powers for cities over housing and transport, not over everything. **Example:** a city setting its own transport fares."],
      ["There is no such thing as a free market.", "**Meaning:** every market depends on rules: property, contracts, money, regulation. **Against:** markets can be relatively free; the claim plays with words. **How far I agree:** agree that the question is which rules, not whether rules. **Example:** online platforms that set the terms for their sellers."],
      ["Animals should have the same rights as humans.", "**Meaning:** equal moral and legal rights. **Against:** rights such as voting or education presuppose human capacities; relevant differences justify different treatment. **How far I agree:** equal consideration of suffering, not identical rights. **Example:** a right not to be caused pointless pain versus a right to vote."],
      ["It is better to be a human dissatisfied than a pig satisfied.", "**Meaning:** Mill's higher pleasures: quality over quantity of happiness. **Against:** the judgment is made by those who know only one side; contentment matters. **How far I agree:** agree that fuller capacities are valuable, but dissatisfaction is not a virtue in itself. **Example:** a demanding career versus a simple, content life."],
      ["Experts should have a larger role in democratic decisions.", "**Meaning:** technocratic influence on policy. **Against:** values are not expert questions; experts can be wrong or captured; legitimacy needs citizens. **How far I agree:** experts should inform and be heard early; elected people should decide trade-offs. **Example:** independent central banks."],
      ["Inequality is the price of a dynamic economy.", "**Meaning:** incentives require unequal rewards. **Against:** high inequality can reduce mobility and growth; many innovations come from public research. **How far I agree:** some inequality motivates, extreme inequality entrenches. **Example:** entrepreneurs' rewards versus inherited wealth."],
      ["Privacy matters less than security.", "**Meaning:** surveillance to prevent crime or terrorism. **Against:** privacy protects freedom and dissent; mass surveillance is easily abused; security gains are often small. **How far I agree:** disagree with the general ranking: targeted measures with oversight can serve both. **Example:** a warrant for one suspect versus storing everyone's messages."],
      ["Art that needs to be explained has failed.", "**Meaning:** good art speaks directly. **Against:** much great art rewards knowledge (allusions, history, technique); explanation can deepen experience. **How far I agree:** art should offer something without explanation, but explanation is not failure. **Example:** a medieval painting full of symbols."],
      ["We owe more to our fellow citizens than to strangers.", "**Meaning:** special obligations within a nation. **Against:** moral worth does not depend on nationality (Singer); borders are morally arbitrary. **How far I agree:** some special duties exist (shared institutions) but basic duties to strangers remain strong. **Example:** foreign aid in a famine versus local welfare."],
      ["Technology makes work less meaningful.", "**Meaning:** automation removes skill and craft. **Against:** technology removes drudgery and creates new skilled jobs; meaning comes from purpose and relationships. **How far I agree:** it depends on how work is designed and who controls it. **Example:** a nurse freed from paperwork versus a warehouse worker timed by an app."],
      ["Competition brings out the best in people.", "**Meaning:** rivalry motivates effort and excellence. **Against:** competition can encourage cheating, anxiety and selfishness; cooperation solves many problems better. **How far I agree:** competition helps in fair, limited settings and harms where stakes are high and rules weak. **Example:** sport versus exam pressure."],
      ["Laws should follow public opinion.", "**Meaning:** democratic responsiveness. **Against:** majorities can be wrong or unfair to minorities; rights protect against shifting moods. **How far I agree:** laws need public support to last, but some principles should not depend on a vote. **Example:** death penalty polls versus constitutional rights."],
      ["Money cannot buy happiness.", "**Meaning:** wealth does not secure wellbeing. **Against:** for the poor, money buys security, health and time; studies find income and satisfaction linked. **How far I agree:** money buys the conditions for happiness up to a point, not happiness itself. **Example:** paying off debt versus buying a second car."],
      ["The past has no claim on the present.", "**Meaning:** we owe nothing to earlier generations or for earlier wrongs. **Against:** inherited benefits and harms create duties (reparations, keeping promises, heritage). **How far I agree:** disagree: we inherit institutions and debts with the benefits. **Example:** returning objects taken in colonial times."],
      ["It is better to fail at something original than to succeed at something copied.", "**Meaning:** originality as a value over success. **Against:** copying is how skills are learned and progress spreads; failure has real costs for others. **How far I agree:** agree for creative work and research, less where safety depends on proven methods. **Example:** a new business model versus surgery."],
    ];
    const ESSAY_CRITERIA = [
      { md: "Du erklärst, was die Aussage meint, und klärst mindestens einen mehrdeutigen Begriff.", points: 1 },
      { md: "Du gibst ein **begründetes** Argument gegen die Aussage, nicht nur eine Behauptung.", points: 1 },
      { md: "Du sagst klar, wie weit du zustimmst, und begründest, wo die Grenze liegt.", points: 1 },
      { md: "Jeder Absatz hat eine Aufgabe; ähnliche Punkte stehen zusammen, nichts wiederholt sich.", points: 1 },
      { md: "Mindestens ein konkretes Beispiel stützt einen Punkt.", points: 1 },
      { md: "Höchstens 750 Wörter, klare und genaue Sätze.", points: 1 },
    ];
    const PLAN_CRITERIA = [
      { md: "Bedeutung: These in eigenen Worten und ein Schlüsselbegriff geklärt.", points: 1 },
      { md: "Gegenargument: der stärkste Einwand mit Begründung, nicht nur ein Stichwort.", points: 1 },
      { md: "Position: wie weit du zustimmst, mit Bedingung oder Grenze.", points: 1 },
      { md: "Ein Beispiel steht bereit.", points: 1 },
    ];
    const QUESTION = "Explain what you think the statement means. Give a reasoned argument against it. Discuss the extent to which you agree with it.";
    function wt(plan, level, G) {
      const picks = G.pickN(PROMPTS, plan ? 1 : 3);
      const prompts = picks.map(([s, outline]) => ({ md: "“" + s + "”", outline }));
      return plan
        ? { type: "essay", mode: "plan", lang: "en", label: "Writing Task: Gliederung", points: 4, criteria: PLAN_CRITERIA, prompts,
          md: "**" + QUESTION + "**\n\nNimm dir **8 Minuten**: Gliedere die Antwort in drei Teile, je zwei oder drei Stichpunkte. Danach vergleichst du mit einer Mustergliederung.",
          explain: "Eine Gliederung nach den drei Teilen der Aufgabe sichert, dass keiner fehlt. Im Test lohnen sich 5 bis 10 Minuten Planung." }
        : { type: "essay", mode: "essay", lang: "en", label: "Writing Task", words: 750, points: 6, criteria: ESSAY_CRITERIA, prompts,
          md: "**Answer one of the following. " + QUESTION + "**\n\nHöchstens 750 Wörter. Plane zuerst 5 bis 10 Minuten. Du kannst hier tippen oder auf Papier schreiben.",
          explain: "Der Selbstcheck folgt den drei Teilen der Aufgabe und der Empfehlung von UAT-UK: genau, gegliedert, ohne Wiederholungen." };
    }

    return { ct, ps, wt };
  }

  const ct = (type, title) => ({ title, make: (level, G) => kit().ct(type, level, G) });
  const ps = (type, title) => ({ title, make: (level, G) => kit().ps(type, level, G) });
  LW.generator("tara-ct-conclusion", ct("conclusion", "Main Conclusion"));
  LW.generator("tara-ct-drawing", ct("drawing", "Drawing a Conclusion"));
  LW.generator("tara-ct-assumption", ct("assumption", "Assumption"));
  LW.generator("tara-ct-evidence", ct("evidence", "Additional Evidence"));
  LW.generator("tara-ct-errors", ct("errors", "Reasoning Errors"));
  LW.generator("tara-ct-matching", ct("matching", "Matching Arguments"));
  LW.generator("tara-ct-principles", ct("principles", "Applying Principles"));
  LW.generator("tara-ps-relevant", ps("relevant", "Relevant Selection"));
  LW.generator("tara-ps-procedures", ps("procedures", "Finding Procedures"));
  LW.generator("tara-ps-similarity", ps("similarity", "Identifying Similarity"));
  LW.generator("tara-wt-plan", { title: "Writing Task: Gliederung", kind: "essay", make: (level, G) => kit().wt(true, level, G) });
  LW.generator("tara-wt-essay", { title: "Writing Task", kind: "essay", make: (level, G) => kit().wt(false, level, G) });
})();
