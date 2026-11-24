/* Build tasks for the statistics labs. Every task carries goal.list: the conditions as a checklist that ticks itself off,
 * goal.when (all of them) for the check and goal.solve for the sample solution.
 *   lab-verteilung  distributions: parameters from E and Var, smallest bounds, normal model, Laplace condition, urn models
 *   lab-test        binomial tests: rejection regions one- and two-sided, sample size for a power, smallest detectable p
 *   lab-konfidenz   confidence intervals: setting up, width and sample size, intervals that miss, simulation
 *   lab-daten       data sets by profile: median, mean, range, quartiles, skewness (boxplot widget)
 *   lab-regression  fitting a line by eye, correlation by moving points, a given regression line (regression widget)
 *   lab-bayes       natural frequencies: specificity or prevalence for a positive predictive value, independence */
(function () {
  "use strict";
  const LW = window.LW;
  const gen = LW.generator;
  const S = () => LW.labStat;

  const cn = (x) => String(+(+x).toFixed(6));
  function goal(list, solve) { return { when: list.map((x) => "(" + x.when + ")").join(" && "), list, solve }; }
  function task(widget, label, md, params, g, hint, explain) { return { type: "widget", widget, label, md, params, goal: g, hint, explain }; }
  const P = (G, x, d) => G.tex(x * 100, d == null ? 1 : d) + "\\,\\%";

  // ---------------------------------------------------------------- distributions
  const cdfB = (n, p, b) => { let s = 0; for (let k = 0; k <= b; k++) s += S().binom(n, p, k); return s; };
  gen("lab-verteilung", {
    title: "Verteilungen einstellen",
    make(level, G) {
      if (level === 1) {
        const [p, ns] = G.pick([[0.1, [20, 30, 40, 50, 60, 80, 100]], [0.2, [10, 20, 25, 30, 40, 50, 60, 75, 80, 100]], [0.25, [16, 20, 24, 32, 40, 48, 64, 80]],
          [0.4, [10, 20, 25, 30, 40, 50, 60]], [0.5, [10, 12, 16, 20, 24, 30, 36, 40, 50, 64, 80, 100]], [0.6, [10, 20, 25, 30, 40, 50]], [0.75, [16, 20, 24, 32, 40, 48, 64]], [0.8, [10, 20, 25, 30, 40, 50]]]);
        const n = G.pick(ns), E = +(n * p).toFixed(6), V = +(n * p * (1 - p)).toFixed(6);
        const start = n === 20 && p === 0.3 ? [30, 0.5] : [20, 0.3];
        return task("verteilung", "Verteilungslabor",
          "Stelle **n** und **p** so ein, dass die Binomialverteilung den Erwartungswert $E(X) = " + G.tex(E) + "$ und die Varianz $\\mathrm{Var}(X) = " + G.tex(V) + "$ hat.",
          { dists: ["binomial"], n: start[0], p: start[1], ranges: { n: [1, 100] } },
          goal([{ when: "abs(E - " + cn(E) + ") < 0.0005", show: "$E(X) = " + G.tex(E) + "$" }, { when: "abs(V - " + cn(V) + ") < 0.0005", show: "$\\mathrm{Var}(X) = " + G.tex(V) + "$" }], { n, p }),
          "Teile die Varianz durch den Erwartungswert: Das ergibt $1 - p$.",
          "Aus $E(X) = np$ und $\\mathrm{Var}(X) = np(1-p)$ folgt $1 - p = \\frac{" + G.tex(V) + "}{" + G.tex(E) + "} = " + G.tex(1 - p) + "$, also $p = " + G.tex(p) + "$ und $n = \\frac{" + G.tex(E) + "}{" + G.tex(p) + "} = " + n + "$.");
      }
      if (level === 2) {
        const kind = G.pick(["binomial", "poisson", "geometrisch"]);
        let model, pmfF, E, sd, md, story;
        const t = kind === "geometrisch" ? G.pick([0.5, 0.75, 0.9]) : G.pick([0.9, 0.95]);
        if (kind === "binomial") {
          const n = G.pick([20, 30, 50]), p = G.pick([0.2, 0.3, 0.4, 0.5, 0.6]);
          model = { dists: ["binomial"], n, p, fixed: ["n", "p"] }; E = n * p; sd = Math.sqrt(n * p * (1 - p));
          pmfF = (k) => S().binom(n, p, k);
          story = "$X$ ist binomialverteilt mit $n = " + n + "$ und $p = " + G.tex(p) + "$.";
        } else if (kind === "poisson") {
          const lam = G.pick([2, 3, 4, 5, 6]);
          model = { dists: ["poisson"], lambda: lam, fixed: ["lambda"] }; E = lam; sd = Math.sqrt(lam);
          pmfF = (k) => Math.exp(-lam) * Math.pow(lam, k) / Array.from({ length: k }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
          story = "An einer Kasse kommen im Mittel $\\lambda = " + lam + "$ Kunden pro Minute an; $X$ ist Poisson-verteilt.";
        } else {
          const p = 1 / 6;
          model = { dists: ["geometrisch"], p, fixed: ["p"] }; E = 6; sd = Math.sqrt(30);
          pmfF = (k) => (k < 1 ? 0 : Math.pow(5 / 6, k - 1) / 6);
          story = "Ein Würfel wird geworfen, bis die erste Sechs fällt; $X$ ist die Anzahl der Würfe (geometrisch verteilt, $p = \\tfrac16$).";
        }
        let s = 0, bmin = kind === "geometrisch" ? 1 : 0;
        for (let k = bmin; ; k++) { s += pmfF(k); if (s >= t - 1e-12) { bmin = k; break; } if (k > 400) break; }
        md = story + " Finde das **kleinste** $b$ mit $P(X \\le b) \\ge " + G.tex(t) + "$. Wähle dazu die Verteilungsfunktion und ziehe die Grenze $b$.";
        const startB = Math.max(kind === "geometrisch" ? 1 : 0, Math.round(E - sd));
        return task("verteilung", "Verteilungslabor", md, Object.assign(model, { mode: "zwischen", a: Math.max(0, Math.round(E - 2 * sd)), b: startB }),
          goal([{ when: "mode == 1", show: "Verteilungsfunktion $P(X \\le b)$ gewählt" }, { when: "P >= " + String(+(t - 1e-7).toFixed(9)), show: "$P(X \\le b) \\ge " + G.tex(t) + "$" }, { when: "b == " + bmin, show: "kleinstes solches $b$" }], { mode: "links", b: bmin }),
          "Schiebe $b$ von links nach rechts, bis die Wahrscheinlichkeit die Schwelle zum ersten Mal erreicht.",
          "Die kumulierten Wahrscheinlichkeiten wachsen mit $b$. Bei $b = " + bmin + "$ wird die Schwelle " + G.tex(t) + " zum ersten Mal erreicht: $P(X \\le " + bmin + ") \\approx " + G.tex(s, 4) + "$.");
      }
      if (level === 3) {
        if (G.chance(0.5)) {
          const m = G.pick([50, 100, 120, 170]), sg = G.pick([5, 8, 10, 15, 20]);
          return task("verteilung", "Verteilungslabor",
            "Eine Größe ist normalverteilt. Bekannt ist $P(X \\le " + m + ") = 0{,}5$ und $P(X \\le " + (m + sg) + ") \\approx 0{,}8413$. Stelle $\\mu$ und $\\sigma$ ein.",
            { dists: ["normal"], mu: m - 10, sigma: sg + 5, ranges: { mu: [m - 40, m + 40], sigma: [1, 30] }, mode: "links", b: m + sg },
            goal([{ when: "abs(mu - " + m + ") < 0.01", show: "$P(X \\le " + m + ") = 0{,}5$" }, { when: "abs(sigma - " + sg + ") < 0.01", show: "$P(X \\le " + (m + sg) + ") \\approx 0{,}8413$" }], { mu: m, sigma: sg, mode: "links", b: m + sg }),
            "Bei der Normalverteilung ist der Median gleich $\\mu$; und $\\Phi(1) \\approx 0{,}8413$.",
            "$P(X \\le \\mu) = 0{,}5$ liefert $\\mu = " + m + "$. Wegen $\\Phi(1) \\approx 0{,}8413$ liegt " + (m + sg) + " genau eine Standardabweichung über $\\mu$: $\\sigma = " + sg + "$.");
        }
        const [mu, sg] = G.pick([[100, 15], [170, 8], [50, 5], [500, 100]].filter((x) => x[0] < 400)), [lv, z] = G.pick([[0.95, 1.96], [0.9, 1.645], [0.99, 2.576]]);
        return task("verteilung", "Verteilungslabor",
          "$X$ ist normalverteilt mit $\\mu = " + mu + "$ und $\\sigma = " + sg + "$. Ziehe $a$ und $b$ **symmetrisch** um $\\mu$ so, dass $P(a \\le X \\le b) \\approx " + G.tex(lv) + "$.",
          { dists: ["normal"], mu, sigma: sg, fixed: ["mu", "sigma"], mode: "zwischen", a: mu - sg, b: mu + sg },
          goal([{ when: "abs(a + b - " + 2 * mu + ") < 0.6", show: "symmetrisch um $\\mu$" }, { when: "abs(P - " + lv + ") < 0.004", show: "$P(a \\le X \\le b) \\approx " + G.tex(lv) + "$" }], { mode: "zwischen", a: +(mu - z * sg).toFixed(2), b: +(mu + z * sg).toFixed(2) }),
          "Die Sigma-Regeln: Im Bereich $\\mu \\pm " + G.tex(z) + "\\sigma$ liegen rund " + P(G, lv, 0) + ".",
          "$a = \\mu - " + G.tex(z) + "\\sigma \\approx " + G.tex(mu - z * sg, 2) + "$ und $b = \\mu + " + G.tex(z) + "\\sigma \\approx " + G.tex(mu + z * sg, 2) + "$.");
      }
      if (G.chance(0.5)) {
        const p = G.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
        let nmin = 1;
        while (Math.sqrt(nmin * p * (1 - p)) <= 3 + 1e-12) nmin++;
        return task("verteilung", "Verteilungslabor",
          "Die Normalverteilung nähert $B(n; " + G.tex(p) + ")$ gut an, wenn die **Laplace-Bedingung** $\\sigma > 3$ gilt. Stelle das kleinste $n$ ein, für das sie erfüllt ist.",
          { dists: ["binomial"], n: 10, p, fixed: ["p"], ranges: { n: [1, 200] }, approx: true },
          goal([{ when: "laplace == 1", show: "$\\sigma = \\sqrt{np(1-p)} > 3$" }, { when: "n == " + nmin, show: "kleinstes solches $n$" }], { n: nmin }),
          "$\\sigma > 3$ heißt $np(1-p) > 9$.",
          "$n \\cdot " + G.tex(p) + " \\cdot " + G.tex(1 - p) + " > 9 \\iff n > " + G.tex(9 / (p * (1 - p)), 2) + "$, also $n = " + nmin + "$. Mit der Normalkurve siehst du, wie gut sie dann passt.");
      }
      const u = G.pick([{ N: 49, M: 6, n: 6, a: 3, md: "Beim Lotto **6 aus 49** kreuzt du 6 Zahlen an; gezogen werden 6. Wie groß ist die Wahrscheinlichkeit für **mindestens 3 Richtige**?" },
        { N: 20, M: 4, n: 5, a: 1, md: "Von **20** Bauteilen sind **4** defekt. Man prüft **5** ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit, **mindestens ein** defektes zu finden?" },
        { N: 30, M: 12, n: 6, a: 4, md: "In einer Klasse mit **30** Schülerinnen und Schülern spielen **12** ein Instrument. Für ein Projekt werden **6** ausgelost. Wie wahrscheinlich sind **mindestens 4** mit Instrument?" }]);
      const H = (k) => Math.exp(S().logC(u.M, k) + S().logC(u.N - u.M, u.n - k) - S().logC(u.N, u.n));
      let pr = 0;
      for (let k = u.a; k <= Math.min(u.n, u.M); k++) pr += H(k);
      return task("verteilung", "Verteilungslabor", u.md + " Stelle das Modell ein und lies die Wahrscheinlichkeit ab.",
        { dists: ["hypergeometrisch"], N: 30, M: 10, n: 10, mode: "zwischen", ranges: { N: [2, 60], M: [1, 59], n: [1, 60] } },
        goal([{ when: "N == " + u.N + " && M == " + u.M + " && n == " + u.n, show: "Modell: $N = " + u.N + "$, $M = " + u.M + "$, $n = " + u.n + "$" }, { when: "mode == 3 && a == " + u.a, show: "$P(X \\ge " + u.a + ")$ eingestellt" }],
          { N: u.N, M: u.M, n: u.n, mode: "rechts", a: u.a }),
        "Ziehen ohne Zurücklegen: hypergeometrische Verteilung mit $N$ Elementen, davon $M$ Treffern, und $n$ Zügen.",
        "$P(X \\ge " + u.a + ") = \\sum_{k \\ge " + u.a + "} \\frac{\\binom{" + u.M + "}{k}\\binom{" + (u.N - u.M) + "}{" + u.n + "-k}}{\\binom{" + u.N + "}{" + u.n + "}} \\approx " + G.tex(pr, 4) + "$.");
    },
  });

  // ---------------------------------------------------------------- hypothesis tests
  function regions(n, p0, lv) {
    const f = []; for (let k = 0; k <= n; k++) f.push(S().binom(n, p0, k));
    let kR = n + 1, s = 0;
    for (let k = n; k >= 0; k--) { s += f[k]; if (s > lv) { kR = k + 1; break; } }
    let kL = -1; s = 0;
    for (let k = 0; k <= n; k++) { s += f[k]; if (s > lv) { kL = k - 1; break; } }
    let kr = n + 1; s = 0;
    for (let k = n; k >= 0; k--) { s += f[k]; if (s > lv / 2) { kr = k + 1; break; } }
    let kl = -1; s = 0;
    for (let k = 0; k <= n; k++) { s += f[k]; if (s > lv / 2) { kl = k - 1; break; } }
    const tail = (a, b) => { let t = 0; for (let k = Math.max(0, a); k <= Math.min(n, b); k++) t += f[k]; return t; };
    return { kR, kL, kl, kr, tail };
  }
  const OK_OPT = (G, lv) => [{ when: "ok == 1", show: "Fehler 1. Art $\\alpha \\le " + P(G, lv, 0) + "$" }, { when: "optimal == 1", show: "Ablehnungsbereich so groß wie möglich" }];
  gen("lab-test", {
    title: "Hypothesentests einstellen",
    make(level, G) {
      if (level <= 2) {
        const side = level === 1 ? "rechts" : G.pick(["links", "beide"]);
        const n = G.pick([50, 100]), lv = G.pick([0.05, 0.05, 0.1]);
        let p0, md;
        if (side === "rechts") { p0 = G.pick([0.1, 0.2, 0.3]); md = "Ein Hersteller behauptet, höchstens " + P(G, p0, 0) + " seiner Bauteile seien defekt. Eine Abnehmerin prüft $n = " + n + "$ Teile und verwirft die Behauptung nur bei auffällig vielen Defekten. Teste $H_0\\colon p \\le " + G.tex(p0) + "$ auf dem Niveau " + P(G, lv, 0) + "."; }
        else if (side === "links") { p0 = G.pick([0.6, 0.7, 0.8]); md = "Ein Medikament wirkt laut Hersteller bei mindestens " + P(G, p0, 0) + " der Behandelten. Eine Studie mit $n = " + n + "$ Personen soll das prüfen. Teste $H_0\\colon p \\ge " + G.tex(p0) + "$ auf dem Niveau " + P(G, lv, 0) + "."; }
        else { p0 = 0.5; md = "Ist eine Münze fair? Sie wird $n = " + n + "$-mal geworfen. Teste $H_0\\colon p = 0{,}5$ zweiseitig auf dem Niveau " + P(G, lv, 0) + "."; }
        const R = regions(n, p0, lv);
        const kopt = side === "rechts" ? R.kR : R.kL;
        const start = side === "beide" ? { kl: R.kl + 3, kr: R.kr - 3 } : { k: side === "rechts" ? kopt - 2 : kopt + 2 };
        const region = side === "rechts" ? "\\{" + kopt + ", \\dots, " + n + "\\}" : side === "links" ? "\\{0, \\dots, " + kopt + "\\}" : "\\{0, \\dots, " + R.kl + "\\} \\cup \\{" + R.kr + ", \\dots, " + n + "\\}";
        const why = side === "rechts" ? "$P(X \\ge " + kopt + ") \\approx " + G.tex(R.tail(kopt, n), 4) + " \\le " + G.tex(lv) + "$, aber $P(X \\ge " + (kopt - 1) + ") \\approx " + G.tex(R.tail(kopt - 1, n), 4) + " > " + G.tex(lv) + "$."
          : side === "links" ? "$P(X \\le " + kopt + ") \\approx " + G.tex(R.tail(0, kopt), 4) + " \\le " + G.tex(lv) + "$, aber $P(X \\le " + (kopt + 1) + ") \\approx " + G.tex(R.tail(0, kopt + 1), 4) + " > " + G.tex(lv) + "$."
            : "Jede Seite darf höchstens $\\frac{\\alpha}{2} = " + G.tex(lv / 2) + "$ tragen: $P(X \\le " + R.kl + ") \\approx " + G.tex(R.tail(0, R.kl), 4) + "$, $P(X \\ge " + R.kr + ") \\approx " + G.tex(R.tail(R.kr, n), 4) + "$.";
        return task("testlabor", "Testlabor", md + " Ziehe die Grenze des Ablehnungsbereichs.",
          Object.assign({ n, p0, level: lv, side, adjust: [], beta: false }, start), goal(OK_OPT(G, lv), {}),
          side === "beide" ? "Beim zweiseitigen Test teilt sich $\\alpha$ auf beide Seiten auf." : "Der Ablehnungsbereich liegt auf der Seite, die gegen $H_0$ spricht.",
          "Ablehnungsbereich $" + region + "$. " + why);
      }
      if (level === 3) {
        const pairs = G.shuffle([[0.5, 0.7], [0.3, 0.5], [0.2, 0.35], [0.1, 0.25], [0.6, 0.8], [0.5, 0.65]]);
        for (const [p0, p1] of pairs) {
          let nmin = null;
          for (let n = 5; n <= 300; n++) {
            const R = regions(n, p0, 0.05);
            let beta = 0;
            for (let k = 0; k < R.kR; k++) beta += S().binom(n, p1, k);
            if (beta <= 0.1) { nmin = n; break; }
          }
          if (!nmin) continue;
          return task("testlabor", "Testlabor",
            "Rechtsseitiger Test $H_0\\colon p \\le " + G.tex(p0) + "$ auf dem Niveau 5 %. Wie groß muss $n$ **mindestens** sein, damit der Test eine wahre Trefferwahrscheinlichkeit $p = " + G.tex(p1) + "$ mit mindestens 90 % Wahrscheinlichkeit erkennt? Der Ablehnungsbereich passt sich von selbst an.",
            { n: 20, p0, p1, level: 0.05, side: "rechts", adjust: ["n"], auto: true, beta: true },
            goal([{ when: "beta <= 0.1", show: "Fehler 2. Art $\\beta \\le 10\\,\\%$ bei $p = " + G.tex(p1) + "$" }, { when: "n == " + nmin, show: "kleinstes solches $n$" }], { n: nmin }),
            "Erhöhe $n$ schrittweise und beobachte $\\beta$. Vorsicht: Weil die Verteilung diskret ist, springt $\\beta$ etwas hin und her.",
            "Mit wachsendem $n$ rücken die Verteilungen unter $p_0$ und $p_1$ auseinander, $\\beta$ sinkt. Bei $n = " + nmin + "$ gilt zum ersten Mal $\\beta \\le 0{,}1$.");
        }
      }
      // smallest detectable deviation of a two-sided test
      const n = G.pick([50, 100, 200]);
      const R = regions(n, 0.5, 0.05);
      const powerAt = (q) => { let s = 0; for (let k = 0; k <= n; k++) if (k <= R.kl || k >= R.kr) s += S().binom(n, q, k); return s; };
      let p1min = 0.51;
      while (p1min < 0.99 && powerAt(p1min) < 0.8) p1min = +(p1min + 0.01).toFixed(2);
      return task("testlabor", "Testlabor",
        "Zweiseitiger Test $H_0\\colon p = 0{,}5$ mit $n = " + n + "$ auf dem Niveau 5 %. Wie groß muss eine wahre Trefferwahrscheinlichkeit $p_1 > 0{,}5$ **mindestens** sein, damit der Test sie mit mindestens 80 % Wahrscheinlichkeit erkennt?",
        { n, p0: 0.5, p1: 0.55, level: 0.05, side: "beide", adjust: ["p1"], auto: true, beta: true, power: true },
        goal([{ when: "power >= 0.8", show: "Güte $1 - \\beta \\ge 80\\,\\%$" }, { when: "p1 > 0.5 && p1 < " + cn(p1min + 0.005), show: "kleinstes solches $p_1 > 0{,}5$" }], { p1: p1min }),
        "Die Gütefunktion zeigt die Ablehnwahrscheinlichkeit für jedes $p$.",
        "Die Güte steigt mit dem Abstand von $p_1$ zu $0{,}5$. Ab $p_1 = " + G.tex(p1min) + "$ lehnt der Test in mindestens 80 % der Fälle ab.");
    },
  });

  // ---------------------------------------------------------------- confidence intervals
  const ZV = { "0.9": 1.645, "0.95": 1.96, "0.99": 2.576 };
  gen("lab-konfidenz", {
    title: "Konfidenzintervalle einstellen",
    make(level, G) {
      if (level === 1) {
        const n = G.pick([100, 200, 400, 500, 1000]), h = G.int(20, 80) / 100, k = Math.round(n * h), lv = G.pick([0.9, 0.95, 0.99]);
        const z = ZV[String(lv)], hh = k / n, r = z * Math.sqrt((hh * (1 - hh)) / n);
        return task("konfidenzlabor", "Konfidenzlabor",
          "Bei einer Umfrage sagen **" + k + " von " + n + "** Befragten ja. Stelle die Stichprobe und das Niveau " + P(G, lv, 0) + " ein und lies das Konfidenzintervall ab.",
          { n: 50, k: 20, level: lv === 0.9 ? 0.95 : 0.9, p: 0.5, adjust: ["n", "k", "level"] },
          goal([{ when: "n == " + n, show: "$n = " + n + "$" }, { when: "k == " + k, show: "$k = " + k + "$ Treffer" }, { when: "level == " + lv, show: "Niveau " + P(G, lv, 0) }], { n, k, level: lv }),
          "Stelle zuerst $n$ ein, dann $k$.",
          "$h = \\frac{" + k + "}{" + n + "} = " + G.tex(hh, 3) + "$, Intervall $h \\pm " + G.tex(z, 3) + "\\sqrt{\\frac{h(1-h)}{n}} \\approx [" + G.tex(hh - r, 3) + "; " + G.tex(hh + r, 3) + "]$.");
      }
      if (level === 2) {
        const combos = [];
        [0.9, 0.95, 0.99].forEach((lv) => [0.1, 0.08, 0.06, 0.05].forEach((w) => { const n0 = Math.pow(ZV[String(lv)] / w, 2); const n = Math.max(10, Math.ceil(n0 / 5 - 1e-9) * 5); if (n <= 2000) combos.push([lv, w, n, n0]); }));
        const [lv, w, nmin, n0] = G.pick(combos);
        return task("konfidenzlabor", "Konfidenzlabor",
          "Eine Umfrage soll einen Anteil auf **" + P(G, w / 2, 1) + " genau** schätzen: Das " + P(G, lv, 0) + "-Konfidenzintervall darf höchstens $" + G.tex(w) + "$ breit sein, auch im ungünstigsten Fall $h = 0{,}5$. Wie viele Personen braucht man **mindestens**? (Der Regler geht in Fünferschritten.)",
          { n: 100, k: 50, level: lv === 0.95 ? 0.9 : 0.95, p: 0.5, adjust: ["n", "level"] },
          goal([{ when: "level == " + lv, show: "Niveau " + P(G, lv, 0) }, { when: "wmax <= " + cn(w + 1e-12), show: "größte Breite höchstens $" + G.tex(w) + "$" }, { when: "n < " + (nmin + 5), show: "möglichst kleines $n$" }], { n: nmin, level: lv }),
          "Die Breite bei $h = 0{,}5$ ist $2 \\cdot z \\cdot \\sqrt{\\frac{0{,}25}{n}} = \\frac{z}{\\sqrt n}$.",
          "$\\frac{" + G.tex(ZV[String(lv)], 3) + "}{\\sqrt n} \\le " + G.tex(w) + " \\iff n \\ge \\left(\\frac{" + G.tex(ZV[String(lv)], 3) + "}{" + G.tex(w) + "}\\right)^2 \\approx " + G.tex(n0, 1) + "$; mit dem Fünferschritt des Reglers $n = " + nmin + "$.");
      }
      if (level === 3) {
        const n = G.pick([100, 200, 400]), z = 1.96;
        let d = 0;
        for (; d <= n / 2; d++) { const h = (n / 2 + d) / n, r = z * Math.sqrt((h * (1 - h)) / n); if (h - r > 0.5) break; }
        return task("konfidenzlabor", "Konfidenzlabor",
          "Eine Münze wird $n = " + n + "$-mal geworfen. Bei welcher Trefferzahl $k$, **möglichst nah an " + n / 2 + "**, enthält das 95-%-Konfidenzintervall den Wert $p = 0{,}5$ **nicht** mehr?",
          { n, k: n / 2, level: 0.95, p: 0.5, adjust: ["k", "level"] },
          goal([{ when: "level == 0.95", show: "Niveau 95 %" }, { when: "covers == 0", show: "Das Intervall enthält $0{,}5$ nicht." }, { when: "abs(k - " + n / 2 + ") <= " + d, show: "möglichst nah an " + n / 2 }], { k: n / 2 + d, level: 0.95 }),
          "Verschiebe $k$ von " + n / 2 + " aus nach oben (oder unten), bis das Intervall die $0{,}5$ verlässt.",
          "Ab $k = " + (n / 2 + d) + "$ (oder $k = " + (n / 2 - d) + "$) liegt $0{,}5$ außerhalb: Ein zweiseitiger Test auf $p = 0{,}5$ würde dann verwerfen. Das ist die Dualität von Test und Konfidenzintervall.");
      }
      const p = G.pick([0.2, 0.3, 0.4, 0.6, 0.7]), n = G.pick([30, 50, 100]);
      return task("konfidenzlabor", "Konfidenzlabor",
        "Wie oft trifft ein 90-%-Konfidenzintervall den wahren Anteil? Stelle $p = " + G.tex(p) + "$, $n = " + n + "$ und das Niveau 90 % ein und ziehe **mindestens 300** Stichproben.",
        { n: 200, k: 100, level: 0.95, p: 0.5, adjust: ["n", "level", "p"] },
        goal([{ when: "abs(p - " + p + ") < 0.005 && n == " + n, show: "$p = " + G.tex(p) + "$, $n = " + n + "$" }, { when: "level == 0.9", show: "Niveau 90 %" }, { when: "total >= 300", show: "mindestens 300 Intervalle" }], { p, n, level: 0.9, draw: 300 }),
        "Erst einstellen, dann ziehen: Beim Ändern von $p$ beginnt die Zählung neu.",
        "Etwa 90 % der Intervalle enthalten $p$; bei kleinem $n$ und $p$ weit weg von $0{,}5$ oft etwas weniger, weil die Formel eine Näherung ist.");
    },
  });

  // ---------------------------------------------------------------- data sets (boxplot widget)
  const med = (a) => { const s = a.slice().sort((x, y) => x - y), m = s.length; return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2; };
  function stats(arr) {
    const s = arr.slice().sort((x, y) => x - y), n = s.length, mean = s.reduce((a, b) => a + b, 0) / n;
    const lower = s.slice(0, Math.floor(n / 2)), upper = s.slice(Math.ceil(n / 2));
    return { n, mean, median: med(s), q1: med(lower), q3: med(upper), range: s[n - 1] - s[0], sd: Math.sqrt(s.reduce((a, v) => a + (v - mean) ** 2, 0) / n), min: s[0], max: s[n - 1] };
  }
  const randomSet = (G, n, lo, hi) => Array.from({ length: n }, () => G.int(lo, hi));
  function intMean(G, arr, lo, hi) {
    const a = arr.slice().sort((x, y) => x - y), n = a.length;
    let r = a.reduce((x, y) => x + y, 0) % n;
    if (r) { if (a[n - 1] + (n - r) <= hi) a[n - 1] += n - r; else a[0] -= r; }
    return a.map((v) => Math.max(lo, Math.min(hi, v)));
  }
  gen("lab-daten", {
    title: "Datensätze nach Steckbrief",
    make(level, G) {
      const n = level === 3 ? G.pick([8, 9, 11]) : G.pick([5, 7, 9]);
      let target = randomSet(G, n, 2, 18);
      if (level === 2 || level === 4) target = intMean(G, target, 0, 20);
      if (level === 4) { target.sort((x, y) => x - y); target[n - 1] = Math.min(20, target[n - 1] + G.int(5, 9)); target = intMean(G, target, 0, 20); }
      const T = stats(target);
      let list, md, hint;
      if (level === 1) {
        list = [{ when: "median == " + T.median, show: "Median $\\tilde x = " + G.tex(T.median) + "$" }, { when: "range == " + T.range, show: "Spannweite " + T.range }];
        md = "Verschiebe die " + n + " Werte so, dass der **Median** " + G.fmt(T.median) + " und die **Spannweite** " + T.range + " beträgt.";
        hint = "Der Median ist der mittlere Wert der sortierten Liste; die Spannweite ist der Abstand von Minimum und Maximum.";
      } else if (level === 2) {
        list = [{ when: "abs(mean - " + T.mean + ") < 0.001", show: "Mittelwert $\\bar x = " + G.tex(T.mean) + "$" }, { when: "median == " + T.median, show: "Median $\\tilde x = " + G.tex(T.median) + "$" }];
        md = "Baue aus den " + n + " Werten einen Datensatz mit **Mittelwert** " + G.fmt(T.mean) + " und **Median** " + G.fmt(T.median) + ".";
        hint = "Die Summe aller Werte muss " + G.fmt(T.mean * n) + " sein; der Median hängt nur vom mittleren Wert ab.";
      } else if (level === 3) {
        list = [{ when: "q1 == " + T.q1, show: "unteres Quartil $Q_1 = " + G.tex(T.q1) + "$" }, { when: "median == " + T.median, show: "Median $" + G.tex(T.median) + "$" }, { when: "q3 == " + T.q3, show: "oberes Quartil $Q_3 = " + G.tex(T.q3) + "$" }];
        md = "Baue mit " + n + " Werten einen Datensatz, dessen **Boxplot** die Box von " + G.fmt(T.q1) + " bis " + G.fmt(T.q3) + " mit dem Median " + G.fmt(T.median) + " hat.";
        hint = "Die Quartile sind hier die Mediane der unteren und der oberen Hälfte (bei ungerader Anzahl ohne den Median).";
      } else {
        const gap = Math.floor(T.mean - T.median);
        list = [{ when: "mean - median >= " + gap, show: "Mittelwert mindestens " + gap + " über dem Median (rechtsschief)" }, { when: "median == " + T.median, show: "Median $" + G.tex(T.median) + "$" }];
        md = "Ein einzelner großer Wert zieht den Mittelwert. Baue mit " + n + " Werten einen Datensatz mit **Median** " + G.fmt(T.median) + ", dessen **Mittelwert mindestens " + gap + " größer** ist.";
        hint = "Schiebe den größten Wert weit nach rechts: Der Median bleibt, der Mittelwert wächst.";
      }
      // a start that does not already fit
      let start;
      for (let t = 0; t < 50; t++) {
        start = randomSet(G, n, 0, 20);
        const s = stats(start);
        const fits = list.every((x) => { try { return !!LW.expr(x.when)(s); } catch (e) { return false; } });
        if (!fits) break;
      }
      return task("boxplot", "Datenlabor", md, { data: start, range: [0, 20], step: 1, label: "Werte" }, goal(list, { data: G.shuffle(target) }), hint,
        "Ein passender Datensatz: " + target.slice().sort((x, y) => x - y).join(", ") + ". Mittelwert " + G.fmt(T.mean, 2) + ", Median " + G.fmt(T.median) + ", Quartile " + G.fmt(T.q1) + " und " + G.fmt(T.q3) + ", Spannweite " + T.range + ".");
    },
  });

  // ---------------------------------------------------------------- regression (regression widget)
  function corr(pts) {
    const n = pts.length, mx = pts.reduce((s, q) => s + q[0], 0) / n, my = pts.reduce((s, q) => s + q[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  }
  const xs = (G, n) => G.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n).sort((a, b) => a - b).map((x) => x + G.int(-3, 3) / 10);
  const r1 = (v) => Math.round(v * 10) / 10;
  gen("lab-regression", {
    title: "Regression und Korrelation",
    make(level, G) {
      const n = G.pick([6, 7, 8]);
      if (level === 1) {
        let pts;
        for (let t = 0; t < 40; t++) {
          const a = G.int(1, 4), b = G.pick([0.5, 0.6, 0.8, 1]) * G.pick([1, 1, -1]), a0 = b < 0 ? a + 7 : a;
          pts = xs(G, n).map((x) => [x, r1(Math.max(0.3, Math.min(9.7, a0 + b * x + G.int(-10, 10) / 10)))]);
          if (Math.abs(corr(pts)) > 0.8) break;
        }
        const ybar = pts.reduce((s, q) => s + q[1], 0) / n;
        return task("regression", "Regressionslabor",
          "Lege deine Gerade mit den beiden Griffen so durch die Punktwolke, dass die **Summe der Abweichungsquadrate** möglichst klein wird. Die Quadrate zeigen jede Abweichung als Fläche.",
          { points: pts, x: [0, 10], y: [0, 10], userLine: true, showLS: false, line: [r1(ybar), 0] },
          goal([{ when: "ratio <= 1.5", show: "höchstens 50 % über dem Minimum" }, { when: "ratio <= 1.1", show: "höchstens 10 % über dem Minimum" }], {}),
          "Die Gerade sollte durch den Schwerpunkt $(\\bar x \\mid \\bar y)$ der Punkte gehen.",
          "Die Regressionsgerade nach der Methode der kleinsten Quadrate macht die Summe der Abweichungsquadrate so klein wie möglich; sie geht durch den Schwerpunkt der Punktwolke.");
      }
      const start = (() => { for (;;) { const q = xs(G, n).map((x) => [x, r1(G.int(5, 95) / 10)]); if (Math.abs(corr(q)) < 0.4) return q; } })();
      if (level === 2 || level === 3) {
        const neg = level === 3;
        let tgt;
        for (let t = 0; t < 400; t++) {
          const b = neg ? -G.pick([0.5, 0.6, 0.8]) : G.pick([0.6, 0.8, 1]), a = neg ? 9 : 1;
          tgt = start.map(([x]) => [x, r1(Math.max(0.3, Math.min(9.7, a + b * x + G.int(neg ? -25 : -6, neg ? 25 : 6) / 10)))]);
          const r = corr(tgt);
          if (neg ? r >= -0.7 && r <= -0.5 : r >= 0.93) break;
        }
        const list = neg ? [{ when: "r < 0", show: "negativer Zusammenhang: $r < 0$" }, { when: "r >= -0.7 && r <= -0.5", show: "$-0{,}7 \\le r \\le -0{,}5$: mittelstark" }]
          : [{ when: "r >= 0.7", show: "$r \\ge 0{,}7$" }, { when: "r >= 0.9", show: "$r \\ge 0{,}9$: starker positiver Zusammenhang" }];
        return task("regression", "Regressionslabor",
          neg ? "Verschiebe die Punkte so, dass ein **mittelstarker negativer** Zusammenhang entsteht." : "Verschiebe die Punkte so, dass ein **starker positiver** linearer Zusammenhang entsteht.",
          { points: start, x: [0, 10], y: [0, 10], dragPoints: true, userLine: false, showLS: true },
          goal(list, { points: tgt }),
          neg ? "Fallende Tendenz mit deutlicher Streuung um die Gerade." : "Je enger die Punkte an einer steigenden Geraden liegen, desto näher ist $r$ an 1.",
          "Der Korrelationskoeffizient $r$ misst, wie eng die Punkte an einer Geraden liegen: Das Vorzeichen gibt die Richtung, der Betrag die Stärke.");
      }
      const b0 = G.pick([0.5, 1, -0.5, -1]), a0 = b0 > 0 ? G.pick([1, 2]) : G.pick([8, 9]);
      const tgt = start.map(([x]) => [x, r1(a0 + b0 * x)]);
      return task("regression", "Regressionslabor",
        "Verschiebe die Punkte so, dass die **Regressionsgerade** $y = " + G.tex(a0) + (b0 < 0 ? " - " : " + ") + G.tex(Math.abs(b0)) + "x$ lautet.",
        { points: start, x: [0, 10], y: [0, 10], dragPoints: true, userLine: false, showLS: true },
        goal([{ when: "abs(rb - " + b0 + ") < 0.1", show: "Steigung $" + G.tex(b0) + "$" }, { when: "abs(ra - " + a0 + ") < 0.2", show: "Achsenabschnitt $" + G.tex(a0) + "$" }], { points: tgt }),
        "Lege die Punkte nah an die gewünschte Gerade; die Regressionsgerade folgt ihnen.",
        "Liegen alle Punkte genau auf $y = " + G.tex(a0) + (b0 < 0 ? " - " : " + ") + G.tex(Math.abs(b0)) + "x$, ist sie die Regressionsgerade und $|r| = 1$.");
    },
  });

  // ---------------------------------------------------------------- Bayes (bayes and mosaic widgets)
  const post = (pr, se, sp) => (pr * se) / (pr * se + (1 - pr) * (1 - sp));
  gen("lab-bayes", {
    title: "Bayes und Vierfeldertafel",
    make(level, G) {
      if (level === 1) {
        const pr = G.pick([0.005, 0.01, 0.02, 0.05, 0.1]), se = G.pick([0.8, 0.9, 0.95, 0.99]), sp = G.pick([0.9, 0.95, 0.98, 0.99]);
        const ppv = post(pr, se, sp);
        return task("bayes", "Bayes-Labor",
          "Eine Krankheit hat eine **Prävalenz** von " + P(G, pr, 1) + ". Ein Test erkennt Kranke mit **Sensitivität** " + P(G, se, 0) + " und Gesunde mit **Spezifität** " + P(G, sp, 0) + ". Stelle das ein und lies ab, wie viele positiv Getestete wirklich krank sind.",
          { prevalence: 0.2, sensitivity: 0.7, specificity: 0.8 },
          goal([{ when: "abs(prev - " + pr + ") < 0.0005", show: "Prävalenz " + P(G, pr, 1) }, { when: "abs(sens - " + se + ") < 0.001", show: "Sensitivität " + P(G, se, 0) }, { when: "abs(spec - " + sp + ") < 0.001", show: "Spezifität " + P(G, sp, 0) }], { prev: pr, sens: se, spec: sp }),
          "Denke in Häufigkeiten: Wie viele der 1000 Personen sind krank, wie viele davon positiv, wie viele Gesunde falsch positiv?",
          "$P(\\text{krank} \\mid \\text{positiv}) = \\frac{" + G.tex(pr) + " \\cdot " + G.tex(se) + "}{" + G.tex(pr) + " \\cdot " + G.tex(se) + " + " + G.tex(1 - pr) + " \\cdot " + G.tex(1 - sp, 3) + "} \\approx " + P(G, ppv, 1) + "$.");
      }
      if (level === 2) {
        for (let t = 0; t < 30; t++) {
          const pr = G.pick([0.01, 0.02, 0.05]), se = G.pick([0.9, 0.95, 0.99]), T = G.pick([0.5, 0.6, 0.8]);
          let smin = null;
          for (let s = 50; s <= 100; s += 0.5) if (post(pr, se, s / 100) >= T - 1e-12) { smin = s / 100; break; }
          if (!smin || smin > 0.995 || post(pr, se, 0.9) >= T) continue;
          return task("bayes", "Bayes-Labor",
            "Prävalenz " + P(G, pr, 0) + ", Sensitivität " + P(G, se, 0) + ". Welche **Spezifität** braucht der Test **mindestens**, damit ein positives Ergebnis mit mindestens " + P(G, T, 0) + " Wahrscheinlichkeit stimmt?",
            { prevalence: pr, sensitivity: se, specificity: 0.9, sliders: ["specificity"] },
            goal([{ when: "post >= " + String(+(T - 1e-7).toFixed(9)), show: "$P(\\text{krank} \\mid \\text{positiv}) \\ge " + P(G, T, 0) + "$" }, { when: "spec <= " + cn(smin + 1e-6), show: "kleinstmögliche Spezifität" }], { spec: smin }),
            "Die falsch Positiven kommen aus der großen Gruppe der Gesunden: Jedes Prozent Spezifität zählt.",
            "Ab einer Spezifität von " + P(G, smin, 1) + " (in Schritten von 0,5 %) gilt $P(\\text{krank} \\mid \\text{positiv}) \\ge " + P(G, T, 0) + "$. Bei seltenen Krankheiten bestimmen die falsch Positiven das Ergebnis.");
        }
      }
      if (level === 3 || level === 2) {
        const se = G.pick([0.9, 0.95]), sp = G.pick([0.95, 0.98]), T = G.pick([0.5, 0.8]);
        let pmin = 0.5;
        for (let v = 1; v <= 500; v++) if (post(v / 1000, se, sp) >= T - 1e-12) { pmin = v / 1000; break; }
        return task("bayes", "Bayes-Labor",
          "Ein Test hat Sensitivität " + P(G, se, 0) + " und Spezifität " + P(G, sp, 0) + ". Ab welcher **Prävalenz** ist ein positives Ergebnis mit mindestens " + P(G, T, 0) + " Wahrscheinlichkeit richtig?",
          { prevalence: 0.005, sensitivity: se, specificity: sp, sliders: ["prevalence"] },
          goal([{ when: "post >= " + String(+(T - 1e-7).toFixed(9)), show: "$P(\\text{krank} \\mid \\text{positiv}) \\ge " + P(G, T, 0) + "$" }, { when: "prev <= " + cn(pmin + 1e-6), show: "kleinstmögliche Prävalenz" }], { prev: pmin }),
          "Je häufiger die Krankheit, desto mehr der Positiven sind wirklich krank.",
          "Ab einer Prävalenz von " + P(G, pmin, 1) + " stimmt ein positives Ergebnis in mindestens " + P(G, T, 0) + " der Fälle. Deshalb testet man gezielt Gruppen mit höherem Risiko.");
      }
      const pa = G.pick([0.3, 0.4, 0.6]), pba = G.pick([0.2, 0.35, 0.5, 0.7]);
      return task("mosaic", "Bayes-Labor",
        "An " + P(G, pa, 0) + " der Tage regnet es; an Regentagen gibt es mit " + P(G, pba, 0) + " Wahrscheinlichkeit Stau. Stelle $P(\\text{Stau} \\mid \\text{kein Regen})$ so ein, dass **Regen und Stau unabhängig** sind.",
        { pa, pba, pbna: pba > 0.5 ? 0.2 : 0.8, labels: { a: "Regen", na: "kein Regen", b: "Stau" }, sliders: ["pbna"] },
        goal([{ when: "indep == 1", show: "unabhängig: $P(\\text{Stau} \\mid \\text{Regen}) = P(\\text{Stau} \\mid \\text{kein Regen})$" }], { pbna: pba }),
        "Unabhängig heißt: Das Wissen über Regen ändert die Stauwahrscheinlichkeit nicht.",
        "Unabhängigkeit bedeutet $P(B \\mid A) = P(B \\mid \\bar A) = P(B)$, hier also " + P(G, pba, 0) + ". Im Mosaik sind dann beide Spalten gleich hoch geteilt.");
    },
  });
})();
