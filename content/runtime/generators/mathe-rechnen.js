// Abitur mathematics (Hessen LK) and calculus techniques: ma-rechnen with params.typ, levels 1 to 4 per type.
// Every task is generated from integer data chosen so that the results stay readable.
(function () {
  const T = {};
  const spec = (id, custom) => { T[id] = { custom }; };
  const tnum = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(+x.toFixed(4)).replace(".", "{,}"));
  const par = (x) => (x < 0 ? "(" + tnum(x) + ")" : tnum(x));
  const fmt = (x, d) => String(+x.toFixed(d == null ? 3 : d)).replace(".", ",").replace("-", "−");
  const num = (md, answer, explain, tol, unit) => ({ type: "numeric", md, answer: +answer.toFixed(6), tolerance: tol == null ? Math.max(Math.abs(answer) * 0.01, 0.005) : tol, placeholder: unit || "", explain });
  const choice = (G, md, right, wrong, explain) => ({ type: "choice", md, options: G.shuffle(G.options({ md: right }, wrong.map((w) => (typeof w === "string" ? { md: w } : w)))), explain });
  function poly(cs, v) {
    v = v || "x";
    const n = cs.length - 1;
    let s = "";
    cs.forEach((c, i) => {
      if (!c) return;
      const p = n - i, a = Math.abs(c);
      const coef = a === 1 && p > 0 ? "" : tnum(a);
      const xs = p === 0 ? "" : p === 1 ? v : v + "^{" + p + "}";
      s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + coef + xs;
    });
    return s || "0";
  }
  const ev = (cs, x) => cs.reduce((acc, c) => acc * x + c, 0);
  const der = (cs) => cs.slice(0, -1).map((c, i) => c * (cs.length - 1 - i));
  const integ = (cs, a, b) => { const n = cs.length - 1; let s = 0; cs.forEach((c, i) => { const p = n - i; s += (c * (Math.pow(b, p + 1) - Math.pow(a, p + 1))) / (p + 1); }); return s; };
  const anti = (cs) => { const n = cs.length - 1; return cs.map((c, i) => c / (n - i + 1)).concat([0]); };
  const nz = (G, a, b) => { let x = 0; while (x === 0) x = G.int(a, b); return x; };
  const vec = (v) => "\\begin{pmatrix} " + v.map(tnum).join(" \\\\ ") + " \\end{pmatrix}";
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.sqrt(dot(a, a));
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const rv = (G, k) => [G.int(-k, k), G.int(-k, k), G.int(-k, k)];
  const deg = (r) => (r * 180) / Math.PI;

  // ---------------------------------------------------------------- equations
  spec("gleichung", (level, G) => {
    if (level <= 2) {
      let r1 = G.int(-6, 6), r2 = G.int(-6, 6);
      if (r1 === r2) r2 = r1 + G.int(1, 4);
      const p = -(r1 + r2), q = r1 * r2;
      return num("Löse $" + poly([1, p, q]) + " = 0$ mit der pq-Formel. Gib die **größere** Lösung an.", Math.max(r1, r2),
        "$x_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q} = " + tnum(-p / 2) + " \\pm \\sqrt{" + tnum((p * p) / 4 - q) + "}$, also $x_1 = " + Math.min(r1, r2) + "$ und $x_2 = " + Math.max(r1, r2) + "$. Probe mit dem Satz von Vieta: $x_1 + x_2 = -p$, $x_1 x_2 = q$.", 0);
    }
    if (level === 3) {
      const a = G.pick([2, 3, -2, 4, -3]);
      let r1 = G.int(-5, 5), r2 = G.int(-5, 5);
      if (r1 === r2) r2 = r1 + G.int(1, 3);
      const b = -a * (r1 + r2), c = a * r1 * r2, D = b * b - 4 * a * c;
      return num("Löse $" + poly([a, b, c]) + " = 0$. Gib die **kleinere** Lösung an.", Math.min(r1, r2),
        "Mit der abc-Formel: $D = b^2 - 4ac = " + par(b) + "^2 - 4 \\cdot " + par(a) + " \\cdot " + par(c) + " = " + D + "$, $x_{1,2} = \\frac{" + tnum(-b) + " \\pm " + Math.round(Math.sqrt(D)) + "}{" + tnum(2 * a) + "}$. Lösungen $" + Math.min(r1, r2) + "$ und $" + Math.max(r1, r2) + "$.", 0);
    }
    const [z1, z2] = G.pickN([1, 4, 9, 16], 2);
    return num("Löse $" + poly([1, 0, -(z1 + z2), 0, z1 * z2]) + " = 0$ (Substitution $z = x^2$). Gib die **größte** Lösung an.", Math.sqrt(Math.max(z1, z2)),
      "Mit $z = x^2$: $z^2 " + G.term(-(z1 + z2), 0) + "z " + G.term(z1 * z2, 0) + " = 0$ hat die Lösungen $z = " + Math.min(z1, z2) + "$ und $z = " + Math.max(z1, z2) + "$. Rücksubstitution $x = \\pm\\sqrt{z}$ liefert vier Lösungen, die größte ist $" + Math.sqrt(Math.max(z1, z2)) + "$.", 0);
  });
  spec("nullprodukt", (level, G) => {
    const c = G.int(1, 5), a = nz(G, -5, 5);
    if (level <= 1) return num("Bestimme die größte Nullstelle von $f(x) = (x " + G.term(-a, 0) + ")(x^2 - " + c * c + ")$.", Math.max(a, c),
      "Ein Produkt ist null, wenn ein Faktor null ist: $x = " + a + "$ oder $x^2 = " + c * c + "$, also $x = \\pm " + c + "$. Die größte ist $" + Math.max(a, c) + "$.", 0);
    if (level === 2) return num("Wie viele verschiedene Nullstellen hat $f(x) = x^3 - " + c * c + "x$?", 3, "Ausklammern: $x(x^2 - " + c * c + ") = 0$, also $x = 0$ oder $x = \\pm " + c + "$: drei Nullstellen.", 0);
    if (level === 3) return num("Bestimme die größte Nullstelle von $f(x) = (x^2 - " + c * c + ") \\cdot e^{x}$.", c,
      "$e^{x}$ ist nie null. Also bleibt $x^2 = " + c * c + "$, $x = \\pm " + c + "$. Die größte ist $" + c + "$.", 0);
    const k = G.int(2, 9);
    return num("Bestimme die größte Nullstelle von $f(x) = (e^{x} - " + k + ")(x " + G.term(-a, 0) + ")$ auf zwei Nachkommastellen.", Math.max(Math.log(k), a),
      "Erster Faktor: $e^{x} = " + k + "$, $x = \\ln " + k + " \\approx " + G.tex(Math.log(k), 3) + "$. Zweiter Faktor: $x = " + a + "$. Die größere der beiden ist gesucht.", 0.01);
  });

  // ---------------------------------------------------------------- derivatives
  spec("ableitung", (level, G) => {
    if (level <= 1) {
      const cs = [nz(G, -3, 3), G.int(-4, 4), G.int(-5, 5), G.int(-5, 5)], x0 = G.int(-2, 2);
      const d = der(cs);
      return num("Berechne $f'(" + x0 + ")$ für $f(x) = " + poly(cs) + "$.", ev(d, x0), "$f'(x) = " + poly(d) + "$, also $f'(" + x0 + ") = " + tnum(ev(d, x0)) + "$.", 0);
    }
    if (level === 2) {
      const a = nz(G, -4, 4), b = nz(G, -3, 3);
      return num("Berechne $f'(0)$ für $f(x) = (x " + G.term(a, 0) + ") \\cdot e^{" + (b === 1 ? "" : b === -1 ? "-" : b) + "x}$.", 1 + a * b,
        "Produktregel: $f'(x) = 1 \\cdot e^{" + b + "x} + (x " + G.term(a, 0) + ") \\cdot " + par(b) + " e^{" + b + "x}$. Bei $x = 0$ ist $e^0 = 1$: $f'(0) = 1 + " + par(a) + " \\cdot " + par(b) + " = " + (1 + a * b) + "$.", 0);
    }
    if (level === 3) {
      const a = nz(G, -3, 3), b = G.int(-3, 3), n = G.int(2, 4), x0 = G.int(-1, 2);
      const val = n * a * Math.pow(a * x0 + b, n - 1);
      return num("Berechne $f'(" + x0 + ")$ für $f(x) = (" + poly([a, b]) + ")^{" + n + "}$.", val,
        "Kettenregel: $f'(x) = " + n + " \\cdot (" + poly([a, b]) + ")^{" + (n - 1) + "} \\cdot " + par(a) + "$. Eingesetzt: $" + n + " \\cdot " + par(a * x0 + b) + "^{" + (n - 1) + "} \\cdot " + par(a) + " = " + tnum(val) + "$.", 0);
    }
    const a = nz(G, -4, 4), b = G.int(-5, 5), c = nz(G, -4, 4);
    if (a * c - b === 0) return T.ableitung.custom(3, G);
    return num("Berechne $f'(0)$ für $f(x) = \\dfrac{" + poly([a, b]) + "}{x " + G.term(c, 0) + "}$.", (a * c - b) / (c * c),
      "Quotientenregel: $f'(x) = \\frac{" + par(a) + "(x " + G.term(c, 0) + ") - (" + poly([a, b]) + ") \\cdot 1}{(x " + G.term(c, 0) + ")^2} = \\frac{" + tnum(a * c - b) + "}{(x " + G.term(c, 0) + ")^2}$. Bei $x = 0$: $" + G.frac(a * c - b, c * c) + "$.", 0.01);
  });
  spec("tangente", (level, G) => {
    const cs = level <= 2 ? [nz(G, -3, 3), G.int(-4, 4), G.int(-5, 5)] : [nz(G, -2, 2), G.int(-3, 3), G.int(-4, 4), G.int(-4, 4)];
    const x0 = G.int(-2, 2), y0 = ev(cs, x0), m = ev(der(cs), x0), n = y0 - m * x0;
    const askM = level === 1;
    return num("Die Tangente an $f(x) = " + poly(cs) + "$ im Punkt mit $x_0 = " + x0 + "$ hat die Form $t(x) = mx + n$. Gib " + (askM ? "die Steigung $m$" : "den y-Achsenabschnitt $n$") + " an.", askM ? m : n,
      "$f'(x) = " + poly(der(cs)) + "$, also $m = f'(" + x0 + ") = " + tnum(m) + "$ und $f(" + x0 + ") = " + tnum(y0) + "$. Aus $f(x_0) = m x_0 + n$ folgt $n = " + tnum(y0) + " - " + par(m) + " \\cdot " + par(x0) + " = " + tnum(n) + "$. Tangente: $t(x) = " + poly([m, n]) + "$.", 0);
  });
  spec("normale", (level, G) => {
    const m = G.pick([-4, -2, -1, 1, 2, 4]), a = nz(G, -2, 2), x0 = G.int(-2, 2), b = m - 2 * a * x0, c = G.int(-4, 4);
    const cs = [a, b, c], y0 = ev(cs, x0), mN = -1 / m, nN = y0 - mN * x0;
    if (level <= 1) return num("Welche Steigung hat die Normale an $f(x) = " + poly(cs) + "$ bei $x_0 = " + x0 + "$?", mN,
      "Die Normale steht senkrecht auf der Tangente: $m_N = -\\frac{1}{f'(x_0)}$. Hier $f'(" + x0 + ") = " + m + "$, also $m_N = " + G.frac(-1, m) + "$.", 0.01);
    return num("Die Normale an $f(x) = " + poly(cs) + "$ bei $x_0 = " + x0 + "$ hat die Form $n(x) = m_N x + b$. Gib $b$ an.", nN,
      "$f'(" + x0 + ") = " + m + "$, $m_N = " + G.frac(-1, m) + "$, $f(" + x0 + ") = " + tnum(y0) + "$. Aus $f(x_0) = m_N x_0 + b$: $b = " + tnum(y0) + " - \\left(" + G.frac(-1, m) + "\\right) \\cdot " + par(x0) + " = " + tnum(nN) + "$.", 0.01);
  });
  spec("extrem", (level, G) => {
    let p = G.int(-3, 2), q = G.int(p + 1, 3);
    const c = G.int(-4, 4), s = level === 4 ? -1 : 1;
    const cs = [2 * s, -3 * (p + q) * s, 6 * p * q * s, c];
    const hx = s > 0 ? p : q, tx = s > 0 ? q : p;
    const why = "$f'(x) = " + poly(der(cs)) + " = " + tnum(6 * s) + "(x " + G.term(-p, 0) + ")(x " + G.term(-q, 0) + ")$ hat die Nullstellen $" + p + "$ und $" + q + "$. $f''(x) = " + poly(der(der(cs))) + "$: $f''(" + hx + ") < 0$ (Hochpunkt), $f''(" + tx + ") > 0$ (Tiefpunkt).";
    if (level === 1 || level === 4) return num("Bestimme die x-Koordinate des **Hochpunkts** von $f(x) = " + poly(cs) + "$.", hx, why, 0);
    if (level === 2) return num("Bestimme die x-Koordinate des **Tiefpunkts** von $f(x) = " + poly(cs) + "$.", tx, why, 0);
    return num("Bestimme die y-Koordinate des **Hochpunkts** von $f(x) = " + poly(cs) + "$.", ev(cs, hx), why + " Also $f(" + hx + ") = " + tnum(ev(cs, hx)) + "$.", 0);
  });
  spec("wendepunkt", (level, G) => {
    const a = G.pick([1, -1, 2, -2]), xw = G.int(-3, 3), b = -3 * a * xw, c = G.int(-5, 5), d = G.int(-5, 5);
    const cs = [a, b, c, d], m = ev(der(cs), xw), y = ev(cs, xw);
    const why = "$f''(x) = " + poly(der(der(cs))) + " = 0$ liefert $x_W = " + xw + "$; $f'''(x) = " + 6 * a + " \\neq 0$, also liegt ein Wendepunkt vor.";
    if (level === 1) return num("Bestimme die x-Koordinate des Wendepunkts von $f(x) = " + poly(cs) + "$.", xw, why, 0);
    if (level === 2) return num("Welche Steigung hat die Wendetangente von $f(x) = " + poly(cs) + "$?", m, why + " Steigung: $f'(" + xw + ") = " + tnum(m) + "$.", 0);
    if (level === 3) return num("Bestimme die y-Koordinate des Wendepunkts von $f(x) = " + poly(cs) + "$.", y, why + " $f(" + xw + ") = " + tnum(y) + "$.", 0);
    return num("Die Wendetangente von $f(x) = " + poly(cs) + "$ hat die Form $t(x) = mx + n$. Gib $n$ an.", y - m * xw, why + " $m = f'(" + xw + ") = " + tnum(m) + "$, $f(" + xw + ") = " + tnum(y) + "$, $n = " + tnum(y) + " - " + par(m) + " \\cdot " + par(xw) + " = " + tnum(y - m * xw) + "$.", 0);
  });
  spec("monotonie", (level, G) => {
    const p = G.int(-3, 1), q = G.int(p + 1, 3), s = level >= 2 ? G.pick([1, -1]) : 1;
    const f = "$f'(x) = " + (s < 0 ? "-" : "") + "3(x " + G.term(-p, 0) + ")(x " + G.term(-q, 0) + ")$";
    const between = "für $" + p + " < x < " + q + "$", outside = "für $x < " + p + "$ und für $x > " + q + "$";
    const right = s > 0 ? between : outside;
    return choice(G, "Für eine Funktion gilt " + f + ". Wo ist $f$ streng monoton **fallend**?", right, [s > 0 ? outside : between, "für alle $x$", "für $x > " + q + "$ allein"],
      "Monoton fallend heißt $f'(x) < 0$. Das Produkt $(x " + G.term(-p, 0) + ")(x " + G.term(-q, 0) + ")$ ist zwischen den Nullstellen negativ, außerhalb positiv" + (s < 0 ? "; das Minuszeichen davor dreht alles um" : "") + ". Also fällt $f$ " + right.replace(/\$/g, "$") + ".");
  });
  spec("kruemmung", (level, G) => {
    const a = G.pick([1, -1, 2, -2]), xw = G.int(-3, 3);
    const cs = [a, -3 * a * xw, G.int(-4, 4), G.int(-4, 4)];
    const right = a > 0 ? "für $x > " + xw + "$" : "für $x < " + xw + "$";
    return choice(G, "Wo ist der Graph von $f(x) = " + poly(cs) + "$ **linksgekrümmt**?", right, [a > 0 ? "für $x < " + xw + "$" : "für $x > " + xw + "$", "überall", "nirgends"],
      "Linkskrümmung heißt $f''(x) > 0$. Hier $f''(x) = " + poly(der(der(cs))) + "$, positiv " + right + ". Bei $x = " + xw + "$ wechselt die Krümmung: Wendepunkt.");
  });
  spec("symmetrie", (level, G) => {
    const pool = [
      ["$f(x) = " + poly([G.int(1, 3), 0, -G.int(1, 4), 0, G.int(-3, 3)]) + "$", "achsensymmetrisch zur y-Achse", "Nur gerade Exponenten: $f(-x) = f(x)$."],
      ["$f(x) = " + poly([nz(G, -3, 3), 0, nz(G, -4, 4), 0]) + "$", "punktsymmetrisch zum Ursprung", "Nur ungerade Exponenten und kein Absolutglied: $f(-x) = -f(x)$."],
      ["$f(x) = " + poly([1, nz(G, -3, 3), 0]) + "$", "keine der beiden Symmetrien", "Gerade und ungerade Exponenten gemischt: weder $f(-x) = f(x)$ noch $f(-x) = -f(x)$."],
      ["$f(x) = " + poly([1, 0, nz(G, -3, 3), nz(G, 1, 4)]) + "$", "keine der beiden Symmetrien", "Ungerade Exponenten, aber ein Absolutglied: Der Graph ist zum Punkt $(0 \\mid f(0))$ symmetrisch, nicht zum Ursprung."],
    ];
    if (level >= 3) pool.push(["$f(x) = x \\cdot e^{-x^2}$", "punktsymmetrisch zum Ursprung", "$f(-x) = -x \\cdot e^{-x^2} = -f(x)$."], ["$f(x) = \\dfrac{x^2}{x^2 + 1}$", "achsensymmetrisch zur y-Achse", "$f(-x) = \\frac{x^2}{x^2 + 1} = f(x)$."],
      ["$f(x) = e^{x} + e^{-x}$", "achsensymmetrisch zur y-Achse", "Vertauschen von $x$ und $-x$ vertauscht nur die Summanden: $f(-x) = f(x)$."]);
    const [f, right, why] = G.pick(pool);
    return choice(G, "Welche Symmetrie hat der Graph von " + f + "?", right, ["achsensymmetrisch zur y-Achse", "punktsymmetrisch zum Ursprung", "keine der beiden Symmetrien"].filter((x) => x !== right),
      why + " Prüfe immer mit $f(-x)$.");
  });
  spec("unendlich", (level, G) => {
    if (level >= 3) {
      const a = nz(G, -6, 6), b = G.pick([1, 2, 3, 4]);
      return num("Gegen welchen Wert strebt $f(x) = \\dfrac{" + poly([a, G.int(-3, 3), G.int(-3, 3)]) + "}{" + poly([b, G.int(-3, 3), G.int(1, 4)]) + "}$ für $x \\to \\infty$?", a / b,
        "Zähler- und Nennergrad sind gleich: Der Grenzwert ist der Quotient der Leitkoeffizienten, $" + G.frac(a, b) + "$. Die Gerade $y = " + G.frac(a, b) + "$ ist waagerechte Asymptote.", 0.01);
    }
    const n = G.int(2, 5), a = nz(G, -4, 4);
    const lim = (x) => (a * Math.pow(x, n) > 0 ? "+\\infty" : "-\\infty");
    const opt = (p, m) => "$f(x) \\to " + p + "$ für $x \\to +\\infty$, $f(x) \\to " + m + "$ für $x \\to -\\infty$";
    const right = opt(lim(1), lim(-1));
    return choice(G, "Wie verhält sich $f(x) = " + poly([a, G.int(-5, 5), G.int(-5, 5)].concat(n > 2 ? new Array(n - 2).fill(0) : []).slice(0, n + 1)) + "$ für $x \\to \\pm\\infty$?", right,
      [opt("+\\infty", "+\\infty"), opt("+\\infty", "-\\infty"), opt("-\\infty", "+\\infty"), opt("-\\infty", "-\\infty")].filter((x) => x !== right),
      "Entscheidend ist der Summand mit der höchsten Potenz, $" + tnum(a) + "x^{" + n + "}$: " + (n % 2 ? "ungerader Exponent, die Vorzeichen für $\\pm\\infty$ sind verschieden" : "gerader Exponent, gleiches Verhalten auf beiden Seiten") + ", das Vorzeichen von $" + a + "$ entscheidet die Richtung.");
  });

  // ---------------------------------------------------------------- integrals
  spec("integral", (level, G) => {
    if (level <= 3) {
      const cs = level === 1 ? [nz(G, -3, 3), G.int(-4, 4)] : level === 2 ? [nz(G, -3, 3), G.int(-3, 3), G.int(-4, 4)] : [nz(G, -2, 2), G.int(-2, 2), G.int(-3, 3), G.int(-3, 3)];
      const a = G.int(-2, 1), b = G.int(a + 1, 3), v = integ(cs, a, b), F = anti(cs);
      return num("Berechne $\\displaystyle\\int_{" + a + "}^{" + b + "} \\left(" + poly(cs) + "\\right) dx$.", v,
        "Stammfunktion $F(x) = " + poly(F) + "$. Dann $F(" + b + ") - F(" + a + ") = " + tnum(ev(F, b)) + " - " + par(ev(F, a)) + " = " + tnum(v) + "$.", 0.01);
    }
    const k = G.int(2, 6), c = G.pick([1, 2, 3]);
    return num("Für welches $k > 0$ gilt $\\displaystyle\\int_0^k " + (c === 1 ? "" : c) + "x^2\\,dx = " + tnum((c * k * k * k) / 3) + "$?", k,
      "$\\int_0^k " + c + "x^2\\,dx = \\frac{" + c + "}{3}k^3 = " + tnum((c * k * k * k) / 3) + "$, also $k^3 = " + k * k * k + "$ und $k = " + k + "$.", 0);
  });
  spec("flaeche", (level, G) => {
    if (level <= 1) {
      const r1 = G.int(-3, 1), d = G.int(2, 4), a = G.pick([1, 2, 3]), r2 = r1 + d;
      const cs = [-a, a * (r1 + r2), -a * r1 * r2];
      return num("Wie groß ist die Fläche zwischen dem Graphen von $f(x) = " + poly(cs) + "$ und der x-Achse?", (a * d * d * d) / 6,
        "Nullstellen: $x = " + r1 + "$ und $x = " + r2 + "$, dazwischen liegt der Graph oberhalb der Achse. $A = \\int_{" + r1 + "}^{" + r2 + "} f(x)\\,dx = " + tnum((a * d * d * d) / 6) + "$.", 0.01);
    }
    if (level === 2) {
      const k = G.int(1, 6);
      return num("Wie groß ist die Fläche zwischen $f(x) = x^2$ und $g(x) = " + k + "x$?", (k * k * k) / 6,
        "Schnittstellen: $x^2 = " + k + "x$ bei $x = 0$ und $x = " + k + "$. Dazwischen ist $g > f$: $A = \\int_0^{" + k + "} (" + k + "x - x^2)\\,dx = \\frac{" + k + "^3}{2} - \\frac{" + k + "^3}{3} = " + tnum((k * k * k) / 6) + "$.", 0.01);
    }
    const c = G.int(1, 3);
    return num("Wie groß ist die gesamte Fläche, die $f(x) = x^3 - " + c * c + "x$ mit der x-Achse einschließt?", Math.pow(c, 4) / 2,
      "Nullstellen $-" + c + ", 0, " + c + "$. Die Teilflächen liegen einmal oberhalb, einmal unterhalb; einzeln integrieren und Beträge addieren: Jede hat den Inhalt $\\frac{" + c + "^4}{4}$, zusammen $" + tnum(Math.pow(c, 4) / 2) + "$. Ein einziges Integral von $-" + c + "$ bis $" + c + "$ ergäbe fälschlich 0.", 0.01);
  });
  spec("mittelwert", (level, G) => {
    if (level <= 1) {
      const a = nz(G, -3, 3), b = G.int(1, 4);
      return num("Berechne den Mittelwert von $f(x) = " + poly([a, 0, 0]) + "$ auf $[0; " + b + "]$.", (a * b * b) / 3,
        "$\\bar f = \\frac{1}{" + b + " - 0}\\int_0^{" + b + "} " + tnum(a) + "x^2\\,dx = \\frac{1}{" + b + "} \\cdot \\frac{" + tnum(a) + " \\cdot " + b + "^3}{3} = " + tnum((a * b * b) / 3) + "$.", 0.01);
    }
    const cs = [nz(G, -2, 2), G.int(-3, 3), G.int(-3, 3)], a = G.int(-2, 0), b = G.int(a + 1, 3);
    return num("Berechne den Mittelwert von $f(x) = " + poly(cs) + "$ auf $[" + a + "; " + b + "]$.", integ(cs, a, b) / (b - a),
      "$\\bar f = \\frac{1}{b - a}\\int_a^b f(x)\\,dx = \\frac{1}{" + (b - a) + "} \\cdot " + tnum(integ(cs, a, b)) + " = " + tnum(integ(cs, a, b) / (b - a)) + "$.", 0.01);
  });
  spec("integralfunktion", (level, G) => {
    const m = nz(G, -3, 3), n = G.int(-4, 4), k = G.int(1, 4), a = level >= 2 ? G.int(-2, 0) : 0;
    const I = (x) => (m * x * x) / 2 + n * x;
    return num("Gegeben ist $I(x) = \\displaystyle\\int_{" + a + "}^{x} \\left(" + poly([m, n], "t") + "\\right) dt$. Berechne $I(" + k + ")$.", I(k) - I(a),
      "Stammfunktion $F(t) = " + poly([m / 2, n, 0], "t") + "$. $I(" + k + ") = F(" + k + ") - F(" + a + ") = " + tnum(I(k)) + " - " + par(I(a)) + " = " + tnum(I(k) - I(a)) + "$. Die untere Grenze ist eine Nullstelle von $I$.", 0.01);
  });
  spec("steckbrief", (level, G) => {
    const a = nz(G, -3, 3), b = G.int(-4, 4), c = G.int(-4, 4);
    if (level <= 2) {
      const y = (x) => a * x * x + b * x + c;
      return num("Eine Parabel $f(x) = ax^2 + bx + c$ geht durch $(-1 \\mid " + y(-1) + ")$, $(0 \\mid " + y(0) + ")$ und $(1 \\mid " + y(1) + ")$. Bestimme $" + (level === 1 ? "a" : "b") + "$.", level === 1 ? a : b,
        "Aus $(0 \\mid " + c + ")$: $c = " + c + "$. Die anderen Punkte: $a - b + c = " + y(-1) + "$ und $a + b + c = " + y(1) + "$. Addiert: $2a + 2c = " + (y(-1) + y(1)) + "$, also $a = " + a + "$; subtrahiert: $2b = " + (y(1) - y(-1)) + "$, $b = " + b + "$.", 0);
    }
    const p = G.int(1, 2), A = nz(G, -2, 2), y = -2 * A * p * p * p;
    return num("Der Graph von $f(x) = ax^3 + bx$ hat bei $x = " + p + "$ einen Extrempunkt mit dem Funktionswert $" + y + "$. Bestimme $a$.", A,
      "Bedingungen: $f'(" + p + ") = 3a \\cdot " + p * p + " + b = 0$ und $f(" + p + ") = a \\cdot " + p * p * p + " + b \\cdot " + p + " = " + y + "$. Aus der ersten: $b = " + tnum(-3 * p * p) + "a$. Eingesetzt: $" + p * p * p + "a - " + 3 * p * p * p + "a = " + tnum(-2 * p * p * p) + "a = " + y + "$, also $a = " + A + "$.", 0);
  });
  spec("newton", (level, G) => {
    const a = G.pick([2, 3, 5, 6, 7, 10]), x0 = Math.round(Math.sqrt(a)) + (level >= 2 ? 1 : 0);
    let x1 = x0 - (x0 * x0 - a) / (2 * x0);
    if (level <= 2) return num("Das Newton-Verfahren für $f(x) = x^2 - " + a + "$ startet bei $x_0 = " + x0 + "$. Berechne $x_1$ auf vier Nachkommastellen.", x1,
      "$x_1 = x_0 - \\frac{f(x_0)}{f'(x_0)} = " + x0 + " - \\frac{" + (x0 * x0 - a) + "}{" + 2 * x0 + "} \\approx " + G.tex(x1, 4) + "$. Die Nullstelle ist $\\sqrt{" + a + "} \\approx " + G.tex(Math.sqrt(a), 4) + "$.", 0.0005);
    const x2 = x1 - (x1 * x1 - a) / (2 * x1);
    return num("Das Newton-Verfahren für $f(x) = x^2 - " + a + "$ startet bei $x_0 = " + x0 + "$. Berechne $x_2$ auf vier Nachkommastellen.", x2,
      "$x_1 \\approx " + G.tex(x1, 4) + "$, $x_2 = x_1 - \\frac{x_1^2 - " + a + "}{2x_1} \\approx " + G.tex(x2, 4) + "$. Schon nach zwei Schritten stimmen mehrere Stellen mit $\\sqrt{" + a + "}$ überein.", 0.0005);
  });
  spec("umkehr", (level, G) => {
    if (level <= 1) {
      const m = nz(G, -4, 4), n = G.int(-5, 5), y0 = G.int(-6, 6);
      return num("Berechne $f^{-1}(" + y0 + ")$ für $f(x) = " + poly([m, n]) + "$.", (y0 - n) / m, "Auflösen von $y = " + poly([m, n]) + "$ nach $x$: $x = \\frac{y " + G.term(-n, 0) + "}{" + m + "}$. Mit $y = " + y0 + "$: $" + G.frac(y0 - n, m) + "$.", 0.01);
    }
    const c = G.int(-3, 3), y0 = c + G.int(1, 8);
    return num("Berechne $f^{-1}(" + y0 + ")$ für $f(x) = e^{x} " + G.term(c, 0) + "$ auf drei Nachkommastellen.", Math.log(y0 - c),
      "$y = e^x " + G.term(c, 0) + " \\Rightarrow x = \\ln(y " + G.term(-c, 0) + ")$. Also $f^{-1}(" + y0 + ") = \\ln " + (y0 - c) + " \\approx " + G.tex(Math.log(y0 - c), 3) + "$.", 0.002);
  });

  // ---------------------------------------------------------------- exponential and logarithm
  spec("expgleichung", (level, G) => {
    if (level <= 1) {
      const k = G.pick([0.5, 1, 2, 3, -1]), c = G.int(2, 30);
      return num("Löse $e^{" + (k === 1 ? "" : k === -1 ? "-" : tnum(k)) + "x} = " + c + "$ auf drei Nachkommastellen.", Math.log(c) / k,
        "Logarithmieren: $" + tnum(k) + "x = \\ln " + c + "$, also $x = \\frac{\\ln " + c + "}{" + tnum(k) + "} \\approx " + G.tex(Math.log(c) / k, 3) + "$.", 0.002);
    }
    if (level === 2) {
      const a = G.int(2, 9), b = a * G.int(2, 12), k = G.pick([0.1, 0.2, 0.5, 2]);
      return num("Löse $" + a + " \\cdot e^{" + tnum(k) + "x} = " + b + "$ auf drei Nachkommastellen.", Math.log(b / a) / k,
        "Erst teilen: $e^{" + tnum(k) + "x} = " + tnum(b / a) + "$, dann logarithmieren: $x = \\frac{\\ln " + tnum(b / a) + "}{" + tnum(k) + "} \\approx " + G.tex(Math.log(b / a) / k, 3) + "$.", 0.002);
    }
    if (level === 3) {
      const base = G.pick([2, 3, 5]), c = G.int(3, 60);
      return num("Löse $" + base + "^{x} = " + c + "$ auf drei Nachkommastellen.", Math.log(c) / Math.log(base),
        "$x = \\log_{" + base + "} " + c + " = \\frac{\\ln " + c + "}{\\ln " + base + "} \\approx " + G.tex(Math.log(c) / Math.log(base), 3) + "$.", 0.002);
    }
    const k = G.pick([0.05, 0.1, 0.2, 0.25, 0.5]);
    return num("Ein Bestand zerfällt nach $N(t) = N_0 \\cdot e^{-" + tnum(k) + "t}$ ($t$ in Jahren). Berechne die Halbwertszeit auf zwei Nachkommastellen.", Math.log(2) / k,
      "$\\frac12 N_0 = N_0 e^{-" + tnum(k) + "T}$, also $T = \\frac{\\ln 2}{" + tnum(k) + "} \\approx " + G.tex(Math.log(2) / k, 2) + "$ Jahre.", 0.02);
  });
  spec("logarithmus", (level, G) => {
    const b = G.pick([2, 3, 5, 10]);
    if (level <= 1) {
      const m = G.int(-2, 4);
      return num("Berechne $\\log_{" + b + "}\\left(" + (m < 0 ? "\\tfrac{1}{" + Math.pow(b, -m) + "}" : Math.pow(b, m)) + "\\right)$.", m,
        "Gesucht ist der Exponent, mit dem man $" + b + "$ potenzieren muss: $" + b + "^{" + m + "} = " + (m < 0 ? "\\tfrac{1}{" + Math.pow(b, -m) + "}" : Math.pow(b, m)) + "$. Also $" + m + "$.", 0);
    }
    if (level === 2) {
      const i = G.int(1, 3), j = G.int(1, 3);
      return num("Berechne $\\log_{" + b + "} " + Math.pow(b, i) * 7 + " - \\log_{" + b + "} 7 + \\log_{" + b + "} " + Math.pow(b, j) + "$.", i + j,
        "Logarithmengesetz: $\\log_b x - \\log_b y = \\log_b \\frac{x}{y}$. Also $\\log_{" + b + "} " + Math.pow(b, i) + " + \\log_{" + b + "} " + Math.pow(b, j) + " = " + i + " + " + j + " = " + (i + j) + "$.", 0);
    }
    const c = G.pick([2, 3]), s = G.int(2, 3), t = G.int(1, 5);
    return num("Berechne $\\log_{" + Math.pow(c, s) + "} " + Math.pow(c, t) + "$ (Basiswechsel).", t / s,
      "$\\log_{" + Math.pow(c, s) + "} " + Math.pow(c, t) + " = \\frac{\\log_{" + c + "} " + Math.pow(c, t) + "}{\\log_{" + c + "} " + Math.pow(c, s) + "} = \\frac{" + t + "}{" + s + "}$.", 0.01);
  });
  spec("wachstum", (level, G) => {
    const N0 = G.pick([200, 500, 1000, 2500]), p = G.pick([2, 3, 4, 5, 8, 10]), t = G.int(3, 12);
    if (level <= 1) return num("Ein Bestand von " + N0 + " wächst jährlich um " + p + " %. Wie groß ist er nach " + t + " Jahren? (ganze Zahl)", N0 * Math.pow(1 + p / 100, t),
      "$N(" + t + ") = " + N0 + " \\cdot " + G.tex(1 + p / 100, 2) + "^{" + t + "} \\approx " + G.tex(N0 * Math.pow(1 + p / 100, t), 1) + "$.", Math.max(1, N0 * Math.pow(1 + p / 100, t) * 0.002));
    if (level === 2) return num("Nach wie vielen Jahren hat sich ein Bestand bei " + p + " % jährlichem Wachstum verdoppelt? (zwei Nachkommastellen)", Math.log(2) / Math.log(1 + p / 100),
      "$2 = " + G.tex(1 + p / 100, 2) + "^{t}$, also $t = \\frac{\\ln 2}{\\ln " + G.tex(1 + p / 100, 2) + "} \\approx " + G.tex(Math.log(2) / Math.log(1 + p / 100), 2) + "$. Faustregel: etwa $70 : " + p + "$.", 0.02);
    const T2 = G.pick([5, 8, 10, 30]), h = G.int(2, 5);
    return num("Ein Stoff hat die Halbwertszeit " + T2 + " Tage. Wie viel Prozent sind nach " + h * T2 + " Tagen noch übrig?", 100 / Math.pow(2, h),
      h + " Halbwertszeiten: $\\left(\\frac12\\right)^{" + h + "} = \\frac{1}{" + Math.pow(2, h) + "} \\approx " + G.tex(100 / Math.pow(2, h), 2) + "\\,\\%$.", 0.01, "%");
  });

  // ---------------------------------------------------------------- vectors, lines, planes
  spec("skalarprodukt", (level, G) => {
    const a = rv(G, 4), b = rv(G, 4);
    if (len(a) === 0 || len(b) === 0) return T.skalarprodukt.custom(level, G);
    if (level <= 1) return num("Berechne das Skalarprodukt von $\\vec a = " + vec(a) + "$ und $\\vec b = " + vec(b) + "$.", dot(a, b),
      "$\\vec a \\cdot \\vec b = " + a.map((x, i) => par(x) + " \\cdot " + par(b[i])).join(" + ") + " = " + dot(a, b) + "$." + (dot(a, b) === 0 ? " Die Vektoren stehen senkrecht aufeinander." : ""), 0);
    if (level === 2) {
      const w = deg(Math.acos(dot(a, b) / (len(a) * len(b))));
      return num("Welchen Winkel (in Grad) schließen $\\vec a = " + vec(a) + "$ und $\\vec b = " + vec(b) + "$ ein?", w,
        "$\\cos\\alpha = \\frac{\\vec a \\cdot \\vec b}{|\\vec a|\\,|\\vec b|} = \\frac{" + dot(a, b) + "}{\\sqrt{" + dot(a, a) + "} \\cdot \\sqrt{" + dot(b, b) + "}}$, also $\\alpha \\approx " + G.tex(w, 1) + "^\\circ$.", 0.2, "°");
    }
    const b2 = nz(G, -4, 4), b0 = G.int(-4, 4), b3 = G.int(-4, 4), a0 = nz(G, -3, 3), a2 = G.int(-3, 3);
    const t = -(a0 * b0 + a2 * b3) / b2;
    return num("Für welches $t$ stehen $\\vec a = \\begin{pmatrix} " + a0 + " \\\\ t \\\\ " + a2 + " \\end{pmatrix}$ und $\\vec b = " + vec([b0, b2, b3]) + "$ senkrecht aufeinander?", t,
      "Orthogonal heißt Skalarprodukt null: $" + par(a0) + " \\cdot " + par(b0) + " + t \\cdot " + par(b2) + " + " + par(a2) + " \\cdot " + par(b3) + " = 0$, also $t = " + G.frac(-(a0 * b0 + a2 * b3), b2) + "$.", 0.01);
  });
  spec("kreuzprodukt", (level, G) => {
    const a = rv(G, 3), b = rv(G, 3), c = cross(a, b);
    if (len(c) === 0) return T.kreuzprodukt.custom(level, G);
    const how = "$\\vec a \\times \\vec b = " + vec(c) + "$";
    if (level <= 1) return num("Berechne die **erste Koordinate** von $\\vec a \\times \\vec b$ für $\\vec a = " + vec(a) + "$, $\\vec b = " + vec(b) + "$.", c[0],
      "Erste Koordinate: $a_2 b_3 - a_3 b_2 = " + par(a[1]) + " \\cdot " + par(b[2]) + " - " + par(a[2]) + " \\cdot " + par(b[1]) + " = " + c[0] + "$. Ganz: " + how + ".", 0);
    if (level === 2) return num("Wie groß ist die Fläche des Parallelogramms, das $\\vec a = " + vec(a) + "$ und $\\vec b = " + vec(b) + "$ aufspannen?", len(c),
      how + ", der Flächeninhalt ist sein Betrag: $\\sqrt{" + dot(c, c) + "} \\approx " + G.tex(len(c), 3) + "$.", 0.01);
    return num("Wie groß ist die Fläche des Dreiecks mit den Kantenvektoren $\\vec a = " + vec(a) + "$ und $\\vec b = " + vec(b) + "$?", len(c) / 2,
      how + ". Das Dreieck ist das halbe Parallelogramm: $\\frac12\\sqrt{" + dot(c, c) + "} \\approx " + G.tex(len(c) / 2, 3) + "$.", 0.01);
  });
  const lin = (n) => n.map((c, i) => [c, "x_" + (i + 1)]).filter((e) => e[0]).map((e, k) => (k === 0 ? (e[0] < 0 ? "-" : "") : e[0] < 0 ? " - " : " + ") + (Math.abs(e[0]) === 1 ? "" : Math.abs(e[0])) + e[1]).join("");
  const NORMALS = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [2, 6, 9], [4, 4, 7], [2, 1, 2], [6, 2, 3], [3, 4, 12]];
  spec("abstand", (level, G) => {
    if (level <= 1) {
      const P = rv(G, 5), Q = rv(G, 5), d = sub(Q, P);
      return num("Wie weit sind $P(" + P.join(" \\mid ") + ")$ und $Q(" + Q.join(" \\mid ") + ")$ voneinander entfernt?", len(d),
        "$|\\overrightarrow{PQ}| = \\sqrt{" + d.map((x) => par(x) + "^2").join(" + ") + "} = \\sqrt{" + dot(d, d) + "} \\approx " + G.tex(len(d), 3) + "$.", 0.01);
    }
    const n0 = G.pick(NORMALS).map((x) => x * G.pick([1, -1])), n = n0.map((x) => x), L = len(n);
    const P = rv(G, 4), dd = G.int(-10, 10);
    if (level === 2) {
      const val = Math.abs(dot(n, P) - dd) / L;
      return num("Wie weit ist $P(" + P.join(" \\mid ") + ")$ von der Ebene $E: " + lin(n) + " = " + dd + "$ entfernt?", val,
        "Hessesche Normalform: $d = \\frac{|" + n.map((x, i) => par(x) + " \\cdot " + par(P[i])).join(" + ") + " - " + par(dd) + "|}{|\\vec n|} = \\frac{" + Math.abs(dot(n, P) - dd) + "}{" + tnum(L) + "} = " + tnum(val) + "$.", 0.01);
    }
    if (level === 3) {
      const d2 = dd + G.pick([-1, 1]) * Math.round(L) * G.int(1, 3);
      return num("Wie weit sind die parallelen Ebenen $" + lin(n) + " = " + dd + "$ und $" + lin(n) + " = " + d2 + "$ voneinander entfernt?", Math.abs(dd - d2) / L,
        "Gleicher Normalenvektor, also parallel: $d = \\frac{|" + dd + " - " + par(d2) + "|}{|\\vec n|} = \\frac{" + Math.abs(dd - d2) + "}{" + tnum(L) + "} = " + tnum(Math.abs(dd - d2) / L) + "$.", 0.01);
    }
    const A = rv(G, 3), u = rv(G, 2);
    if (len(u) === 0) return T.abstand.custom(level, G);
    const cr = cross(sub(P, A), u), val = len(cr) / len(u);
    return num("Wie weit ist $P(" + P.join(" \\mid ") + ")$ von der Geraden $g: \\vec x = " + vec(A) + " + s " + vec(u) + "$ entfernt?", val,
      "$d = \\frac{|(\\vec p - \\vec a) \\times \\vec u|}{|\\vec u|}$ mit $\\vec p - \\vec a = " + vec(sub(P, A)) + "$: Kreuzprodukt $" + vec(cr) + "$, also $d = \\frac{\\sqrt{" + dot(cr, cr) + "}}{\\sqrt{" + dot(u, u) + "}} \\approx " + G.tex(val, 3) + "$. "
      + "Alternativ: Lotfußpunkt über $\\overrightarrow{FP} \\cdot \\vec u = 0$ bestimmen.", 0.01);
  });
  spec("lage-geraden", (level, G) => {
    let A = rv(G, 4), u = rv(G, 3);
    while (len(u) === 0) u = rv(G, 3);
    const kind = G.pick(["parallel", "identisch", "schneidend", "windschief"]);
    let B, v;
    if (kind === "parallel" || kind === "identisch") {
      v = u.map((x) => x * G.pick([-2, -1, 2]));
      if (kind === "identisch") B = A.map((x, i) => x + G.int(1, 2) * u[i]);
      else { let off; do { off = rv(G, 2); } while (len(cross(off, u)) === 0); B = A.map((x, i) => x + off[i]); }
    } else {
      do { v = rv(G, 3); } while (len(v) === 0 || len(cross(u, v)) === 0);
      if (kind === "schneidend") { const s0 = G.int(-2, 2), t0 = G.int(-2, 2); B = A.map((x, i) => x + s0 * u[i] - t0 * v[i]); }
      else { let off; do { off = rv(G, 3); } while (Math.abs(dot(cross(u, v), off)) < 1e-9); B = A.map((x, i) => x + off[i]); }
    }
    const names = { parallel: "echt parallel", identisch: "identisch", schneidend: "schneiden sich in einem Punkt", windschief: "windschief" };
    const why = { parallel: "Die Richtungsvektoren sind Vielfache voneinander, aber der Aufpunkt von $h$ liegt nicht auf $g$.", identisch: "Die Richtungsvektoren sind Vielfache voneinander, und der Aufpunkt von $h$ liegt auf $g$.",
      schneidend: "Die Richtungsvektoren sind keine Vielfachen; das Gleichsetzen liefert eine eindeutige Lösung.", windschief: "Die Richtungsvektoren sind keine Vielfachen, und das Gleichsetzen führt auf einen Widerspruch." }[kind];
    return choice(G, "Wie liegen $g: \\vec x = " + vec(A) + " + s " + vec(u) + "$ und $h: \\vec x = " + vec(B) + " + t " + vec(v) + "$ zueinander?", names[kind], Object.keys(names).filter((k) => k !== kind).map((k) => names[k]),
      why + " Vorgehen: erst die Richtungsvektoren auf Kollinearität prüfen, dann einen Punkt einsetzen oder die Geraden gleichsetzen.");
  });
  spec("winkel", (level, G) => {
    let u = rv(G, 3), v = rv(G, 3);
    if (len(u) === 0 || len(v) === 0 || len(cross(u, v)) === 0) return T.winkel.custom(level, G);
    if (level <= 1) {
      const w = deg(Math.acos(Math.abs(dot(u, v)) / (len(u) * len(v))));
      return num("Unter welchem Winkel (in Grad) schneiden sich zwei Geraden mit den Richtungsvektoren $" + vec(u) + "$ und $" + vec(v) + "$?", w,
        "Schnittwinkel von Geraden: $\\cos\\alpha = \\frac{|\\vec u \\cdot \\vec v|}{|\\vec u|\\,|\\vec v|} = \\frac{" + Math.abs(dot(u, v)) + "}{\\sqrt{" + dot(u, u) + "}\\sqrt{" + dot(v, v) + "}}$, $\\alpha \\approx " + G.tex(w, 1) + "^\\circ$. Der Betrag sorgt für den spitzen Winkel.", 0.2, "°");
    }
    if (level === 2) {
      const w = deg(Math.asin(Math.abs(dot(u, v)) / (len(u) * len(v))));
      return num("Unter welchem Winkel (in Grad) schneidet eine Gerade mit Richtungsvektor $" + vec(u) + "$ eine Ebene mit Normalenvektor $" + vec(v) + "$?", w,
        "Gerade und Ebene: $\\sin\\alpha = \\frac{|\\vec u \\cdot \\vec n|}{|\\vec u|\\,|\\vec n|}$ (Sinus, weil der Normalenvektor senkrecht zur Ebene steht), $\\alpha \\approx " + G.tex(w, 1) + "^\\circ$.", 0.2, "°");
    }
    const w = deg(Math.acos(Math.abs(dot(u, v)) / (len(u) * len(v))));
    return num("Unter welchem Winkel (in Grad) schneiden sich zwei Ebenen mit den Normalenvektoren $" + vec(u) + "$ und $" + vec(v) + "$?", w,
      "Zwei Ebenen: Winkel zwischen den Normalenvektoren, $\\cos\\alpha = \\frac{|\\vec n_1 \\cdot \\vec n_2|}{|\\vec n_1|\\,|\\vec n_2|}$, $\\alpha \\approx " + G.tex(w, 1) + "^\\circ$.", 0.2, "°");
  });
  spec("spat", (level, G) => {
    const a = rv(G, 3), b = rv(G, 3), c = rv(G, 3), V = Math.abs(dot(cross(a, b), c));
    if (V === 0) return T.spat.custom(level, G);
    if (level <= 1) return num("Berechne das Volumen des Spats, den $" + vec(a) + "$, $" + vec(b) + "$ und $" + vec(c) + "$ aufspannen.", V,
      "Spatprodukt: $V = |(\\vec a \\times \\vec b) \\cdot \\vec c| = |" + vec(cross(a, b)) + " \\cdot " + vec(c) + "| = " + V + "$.", 0);
    return num("Berechne das Volumen der dreiseitigen Pyramide (Tetraeder) mit den Kantenvektoren $" + vec(a) + "$, $" + vec(b) + "$ und $" + vec(c) + "$.", V / 6,
      "Ein Tetraeder ist ein Sechstel des Spats: $V = \\frac16 |(\\vec a \\times \\vec b) \\cdot \\vec c| = \\frac{" + V + "}{6} \\approx " + G.tex(V / 6, 3) + "$.", 0.01);
  });

  // ---------------------------------------------------------------- matrices
  const M2 = (m) => "\\begin{pmatrix} " + m[0][0] + " & " + m[0][1] + " \\\\ " + m[1][0] + " & " + m[1][1] + " \\end{pmatrix}";
  const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  spec("matrix", (level, G) => {
    const R = () => [[G.int(-4, 4), G.int(-4, 4)], [G.int(-4, 4), G.int(-4, 4)]];
    const A = R(), B = R(), i = G.int(0, 1), j = G.int(0, 1), P = mul(A, B);
    const ij = "$(" + (i + 1) + "," + (j + 1) + ")$";
    if (level <= 2) return num("Berechne den Eintrag " + ij + " (Zeile " + (i + 1) + ", Spalte " + (j + 1) + ") von $A \\cdot B$ mit $A = " + M2(A) + "$, $B = " + M2(B) + "$.", P[i][j],
      "Zeile " + (i + 1) + " von $A$ mal Spalte " + (j + 1) + " von $B$: $" + par(A[i][0]) + " \\cdot " + par(B[0][j]) + " + " + par(A[i][1]) + " \\cdot " + par(B[1][j]) + " = " + P[i][j] + "$. Ganz: $A \\cdot B = " + M2(P) + "$.", 0);
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (level === 3) return num("Berechne die Determinante von $A = " + M2(A) + "$.", det, "$\\det A = ad - bc = " + par(A[0][0]) + " \\cdot " + par(A[1][1]) + " - " + par(A[0][1]) + " \\cdot " + par(A[1][0]) + " = " + det + "$." + (det === 0 ? " $A$ ist nicht invertierbar." : ""), 0);
    const A2 = mul(A, A);
    return num("Berechne den Eintrag " + ij + " von $A^2$ für $A = " + M2(A) + "$.", A2[i][j], "$A^2 = A \\cdot A = " + M2(A2) + "$; der gesuchte Eintrag ist $" + A2[i][j] + "$.", 0);
  });
  spec("inverse", (level, G) => {
    let A, det;
    do { A = [[G.int(-4, 4), G.int(-4, 4)], [G.int(-4, 4), G.int(-4, 4)]]; det = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while (![1, -1, 2, -2, 3, -3, 4].includes(det));
    const inv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
    const i = G.int(0, 1), j = G.int(0, 1);
    if (level <= 2) return num("Berechne den Eintrag $(" + (i + 1) + "," + (j + 1) + ")$ von $A^{-1}$ für $A = " + M2(A) + "$ (Brüche wie 1/2 sind erlaubt).", inv[i][j],
      "$A^{-1} = \\frac{1}{\\det A}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$ mit $\\det A = " + det + "$: $A^{-1} = \\frac{1}{" + det + "}" + M2([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]]) + "$. Gesuchter Eintrag: $" + G.frac(det * inv[i][j], det) + "$.", 0.01);
    const b = [G.int(-6, 6), G.int(-6, 6)], x = [inv[0][0] * b[0] + inv[0][1] * b[1], inv[1][0] * b[0] + inv[1][1] * b[1]], k = G.int(0, 1);
    return num("Löse $A\\vec x = \\vec b$ mit $A = " + M2(A) + "$ und $\\vec b = " + vec(b) + "$ über die Inverse. Gib $x_" + (k + 1) + "$ an.", x[k],
      "$\\vec x = A^{-1}\\vec b$ mit $A^{-1} = \\frac{1}{" + det + "}" + M2([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]]) + "$. Ergebnis $x_" + (k + 1) + " = " + tnum(x[k]) + "$.", 0.01);
  });
  spec("uebergang", (level, G) => {
    const a = G.pick([0.1, 0.2, 0.3, 0.4]), b = G.pick([0.1, 0.2, 0.3, 0.5]);
    const M = [[1 - a, b], [a, 1 - b]], v = [G.pick([400, 600, 800, 1000]), G.pick([200, 400, 500, 1000])];
    const step = (w) => [M[0][0] * w[0] + M[0][1] * w[1], M[1][0] * w[0] + M[1][1] * w[1]];
    const Mt = "\\begin{pmatrix} " + tnum(1 - a) + " & " + tnum(b) + " \\\\ " + tnum(a) + " & " + tnum(1 - b) + " \\end{pmatrix}";
    const ctx = "Zwei Zustände A und B. Die Übergangsmatrix (Spalten: von A, von B) ist $M = " + Mt + "$; anfangs sind $" + vec(v) + "$ Individuen in A und B.";
    if (level <= 1) { const v1 = step(v); return num(ctx + " Wie viele sind nach einem Schritt in A?", v1[0], "$M\\vec v = " + vec(v1.map((x) => +x.toFixed(2))) + "$: in A $" + tnum(1 - a) + " \\cdot " + v[0] + " + " + tnum(b) + " \\cdot " + v[1] + " = " + tnum(v1[0]) + "$.", 0.5); }
    if (level === 2) { const v2 = step(step(v)); return num(ctx + " Wie viele sind nach zwei Schritten in A?", v2[0], "Zweimal multiplizieren: $M\\vec v = " + vec(step(v).map((x) => +x.toFixed(2))) + "$, $M^2\\vec v = " + vec(v2.map((x) => +x.toFixed(2))) + "$.", 0.5); }
    const share = b / (a + b);
    if (level === 3) return num(ctx + " Welcher Anteil (in Prozent) ist langfristig in A?", 100 * share,
      "Stationäre Verteilung: $M\\vec s = \\vec s$. Für A gilt $a \\cdot s_A = b \\cdot s_B$ (gleich viele wandern hin und her), also $s_A = \\frac{b}{a + b} = \\frac{" + tnum(b) + "}{" + tnum(a + b) + "} \\approx " + G.tex(100 * share, 1) + "\\,\\%$.", 0.2, "%");
    return num(ctx + " Wie viele sind langfristig in A?", share * (v[0] + v[1]), "Die Gesamtzahl " + (v[0] + v[1]) + " bleibt erhalten; der stationäre Anteil von A ist $\\frac{b}{a+b} = " + G.tex(share, 4) + "$, also etwa $" + G.tex(share * (v[0] + v[1]), 1) + "$.", 0.5);
  });

  // ---------------------------------------------------------------- probability
  spec("poisson", (level, G) => {
    const lam = G.pick([0.5, 1, 1.5, 2, 3, 4]), e = Math.exp(-lam);
    if (level <= 1) {
      const k = G.int(0, 4), P = (Math.pow(lam, k) * e) / G.fact(k);
      return num("$X$ ist Poisson-verteilt mit $\\lambda = " + tnum(lam) + "$. Berechne $P(X = " + k + ")$ auf vier Nachkommastellen.", P,
        "$P(X = k) = \\frac{\\lambda^k}{k!}e^{-\\lambda} = \\frac{" + tnum(lam) + "^{" + k + "}}{" + k + "!}e^{-" + tnum(lam) + "} \\approx " + G.tex(P, 4) + "$.", 0.0005);
    }
    if (level === 2) return num("$X$ ist Poisson-verteilt mit $\\lambda = " + tnum(lam) + "$. Berechne $P(X \\geq 1)$ auf vier Nachkommastellen.", 1 - e,
      "Gegenereignis: $P(X \\geq 1) = 1 - P(X = 0) = 1 - e^{-" + tnum(lam) + "} \\approx " + G.tex(1 - e, 4) + "$.", 0.0005);
    return num("$X$ ist Poisson-verteilt mit $\\lambda = " + tnum(lam) + "$. Berechne $P(X \\leq 2)$ auf vier Nachkommastellen.", e * (1 + lam + (lam * lam) / 2),
      "$P(X \\leq 2) = e^{-\\lambda}\\left(1 + \\lambda + \\frac{\\lambda^2}{2}\\right) \\approx " + G.tex(e * (1 + lam + (lam * lam) / 2), 4) + "$. Die Poisson-Verteilung nähert die Binomialverteilung für großes $n$ und kleines $p$ mit $\\lambda = np$.", 0.0005);
  });
  spec("mindestens", (level, G) => {
    const p = G.pick([0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]);
    if (level <= 1) {
      const n = G.int(3, 20);
      return num("Ein Treffer hat die Wahrscheinlichkeit $p = " + tnum(p) + "$. Wie groß ist die Wahrscheinlichkeit für **mindestens einen** Treffer bei $n = " + n + "$ Versuchen? (vier Nachkommastellen)", 1 - Math.pow(1 - p, n),
        "Gegenereignis »kein Treffer«: $P = 1 - (1 - p)^n = 1 - " + tnum(1 - p) + "^{" + n + "} \\approx " + G.tex(1 - Math.pow(1 - p, n), 4) + "$.", 0.0005);
    }
    const P = G.pick([0.9, 0.95, 0.99]), n = Math.ceil(Math.log(1 - P) / Math.log(1 - p));
    return { type: "numeric", md: "Wie oft muss man mindestens versuchen, um mit einer Wahrscheinlichkeit von mindestens " + G.fmt(100 * P, 0) + " % mindestens einen Treffer zu erzielen? Trefferwahrscheinlichkeit $p = " + tnum(p) + "$.", answer: n, tolerance: 0, placeholder: "n",
      explain: "Ansatz: $1 - " + tnum(1 - p) + "^n \\geq " + tnum(P) + "$, also $" + tnum(1 - p) + "^n \\leq " + tnum(1 - P) + "$ und $n \\geq \\frac{\\ln " + tnum(1 - P) + "}{\\ln " + tnum(1 - p) + "} \\approx " + G.tex(Math.log(1 - P) / Math.log(1 - p), 2) + "$. Beim Teilen durch den negativen Logarithmus dreht sich das Zeichen; aufrunden auf $n = " + n + "$." };
  });
  spec("hypergeometrisch", (level, G) => {
    const N = G.int(10, 20), K = G.int(2, 5), n = G.int(2, 4), k = G.int(0, Math.min(K, n, level >= 2 ? 2 : 1));
    const P = (G.binom(K, k) * G.binom(N - K, n - k)) / G.binom(N, n);
    return num("Unter " + N + " Losen sind " + K + " Gewinne. Man zieht " + n + " Lose ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für genau " + k + " Gewinn" + (k === 1 ? "" : "e") + "? (vier Nachkommastellen)", P,
      "Hypergeometrisch: $P = \\frac{\\binom{" + K + "}{" + k + "}\\binom{" + (N - K) + "}{" + (n - k) + "}}{\\binom{" + N + "}{" + n + "}} = \\frac{" + G.binom(K, k) + " \\cdot " + G.binom(N - K, n - k) + "}{" + G.binom(N, n) + "} \\approx " + G.tex(P, 4) + "$. Ohne Zurücklegen ändert sich die Wahrscheinlichkeit von Zug zu Zug; deshalb keine Binomialverteilung.", 0.0005);
  });

  // ---------------------------------------------------------------- calculus techniques (university)
  spec("partiell", (level, G) => {
    const b = G.pick([1, 2]), a = G.int(1, 2);
    const F = (x) => (Math.exp(b * x) * (x / b - 1 / (b * b)));
    return num("Berechne $\\displaystyle\\int_0^{" + a + "} x\\,e^{" + (b === 1 ? "" : b) + "x}\\,dx$ mit partieller Integration (drei Nachkommastellen).", F(a) - F(0),
      "Mit $u = x$, $v' = e^{" + b + "x}$: $\\int x e^{" + b + "x}dx = \\frac{x}{" + b + "}e^{" + b + "x} - \\int \\frac{1}{" + b + "}e^{" + b + "x}dx = e^{" + b + "x}\\left(\\frac{x}{" + b + "} - \\frac{1}{" + b * b + "}\\right)$. Grenzen eingesetzt: $\\approx " + G.tex(F(a) - F(0), 3) + "$.", 0.002);
  });
  spec("substitution", (level, G) => {
    if (level <= 2) {
      const a = G.pick([1, 2]);
      return num("Berechne $\\displaystyle\\int_0^{" + a + "} 2x\\,e^{x^2}\\,dx$ (drei Nachkommastellen).", Math.exp(a * a) - 1,
        "Substitution $u = x^2$, $du = 2x\\,dx$: $\\int_0^{" + a * a + "} e^{u}\\,du = e^{" + a * a + "} - 1 \\approx " + G.tex(Math.exp(a * a) - 1, 3) + "$.", 0.002);
    }
    const p = G.int(1, 4), q = G.int(1, 6), b = G.int(1, 3);
    const val = Math.log((b * b + p * b + q) / q);
    return num("Berechne $\\displaystyle\\int_0^{" + b + "} \\frac{2x + " + p + "}{x^2 + " + p + "x + " + q + "}\\,dx$ (drei Nachkommastellen).", val,
      "Im Zähler steht die Ableitung des Nenners: $\\int \\frac{f'(x)}{f(x)}dx = \\ln|f(x)|$. Also $\\ln(" + (b * b + p * b + q) + ") - \\ln(" + q + ") \\approx " + G.tex(val, 3) + "$.", 0.002);
  });
  spec("uneigentlich", (level, G) => {
    const p = G.pick([2, 3, 4, 1.5]);
    if (level <= 2) return num("Berechne $\\displaystyle\\int_1^{\\infty} \\frac{1}{x^{" + tnum(p) + "}}\\,dx$.", 1 / (p - 1),
      "$\\int_1^b x^{-" + tnum(p) + "}dx = \\left[\\frac{x^{1-" + tnum(p) + "}}{1-" + tnum(p) + "}\\right]_1^b \\to \\frac{1}{" + tnum(p - 1) + "}$ für $b \\to \\infty$, weil $p > 1$. Für $p \\leq 1$ divergiert das Integral.", 0.01);
    const k = G.pick([0.5, 1, 2, 3]);
    return num("Berechne $\\displaystyle\\int_0^{\\infty} e^{-" + tnum(k) + "x}\\,dx$.", 1 / k, "$\\int_0^b e^{-" + tnum(k) + "x}dx = \\frac{1}{" + tnum(k) + "}\\left(1 - e^{-" + tnum(k) + "b}\\right) \\to \\frac{1}{" + tnum(k) + "}$.", 0.01);
  });
  spec("trapez", (level, G) => {
    const n = level <= 1 ? 2 : 4, a = 0, b = G.pick([1, 2]), f = (x) => x * x + 1, h = (b - a) / n;
    let s = (f(a) + f(b)) / 2;
    for (let i = 1; i < n; i++) s += f(a + i * h);
    const T_ = h * s, exact = (b * b * b) / 3 + b;
    return num("Näherung mit der Trapezregel und $n = " + n + "$ Streifen: $\\displaystyle\\int_0^{" + b + "} (x^2 + 1)\\,dx$ (drei Nachkommastellen).", T_,
      "$h = " + tnum(h) + "$, $T = h\\left(\\frac{f(0) + f(" + b + ")}{2} + \\sum f(x_i)\\right) \\approx " + G.tex(T_, 3) + "$. Exakt wäre $" + G.tex(exact, 3) + "$; die Trapezregel überschätzt bei linksgekrümmten Funktionen.", 0.002);
  });
  spec("rotation", (level, G) => {
    if (level <= 1) {
      const k = G.int(1, 3), b = G.int(1, 3);
      return num("Der Graph von $f(x) = " + (k === 1 ? "" : k) + "x$ rotiert auf $[0; " + b + "]$ um die x-Achse. Berechne das Volumen (zwei Nachkommastellen).", (Math.PI * k * k * b * b * b) / 3,
        "$V = \\pi\\int_0^{" + b + "} (" + k + "x)^2dx = \\pi \\cdot " + k * k + " \\cdot \\frac{" + b + "^3}{3} \\approx " + G.tex((Math.PI * k * k * b * b * b) / 3, 2) + "$. Es entsteht ein Kegel.", 0.02);
    }
    const b = G.int(1, 4);
    return num("Der Graph von $f(x) = \\sqrt{x}$ rotiert auf $[0; " + b + "]$ um die x-Achse. Berechne das Volumen (zwei Nachkommastellen).", (Math.PI * b * b) / 2,
      "$V = \\pi\\int_0^{" + b + "} (\\sqrt{x})^2dx = \\pi\\int_0^{" + b + "} x\\,dx = \\frac{\\pi \\cdot " + b * b + "}{2} \\approx " + G.tex((Math.PI * b * b) / 2, 2) + "$.", 0.02);
  });
  spec("polar", (level, G) => {
    const r = G.int(1, 6), phi = G.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 270, 300]);
    const x = r * Math.cos((phi * Math.PI) / 180), y = r * Math.sin((phi * Math.PI) / 180);
    if (level <= 1) return num("Ein Punkt hat die Polarkoordinaten $r = " + r + "$, $\\varphi = " + phi + "^\\circ$. Berechne seine x-Koordinate (drei Nachkommastellen).", x,
      "$x = r\\cos\\varphi = " + r + " \\cdot \\cos " + phi + "^\\circ \\approx " + G.tex(x, 3) + "$ (und $y = r\\sin\\varphi \\approx " + G.tex(y, 3) + "$).", 0.002);
    return num("Ein Punkt hat die kartesischen Koordinaten $(" + G.tex(x, 3) + " \\mid " + G.tex(y, 3) + ")$. Berechne $r$.", r, "$r = \\sqrt{x^2 + y^2} = " + r + "$. Den Winkel liefert $\\tan\\varphi = \\frac{y}{x}$, mit Blick auf den Quadranten.", 0.01);
  });
  spec("geomreihe", (level, G) => {
    const a = G.int(1, 6), q = G.pick([0.5, -0.5, 0.25, 1 / 3, -1 / 3, 0.2, 0.75]);
    if (level <= 2) return num("Berechne $\\displaystyle\\sum_{k=0}^{\\infty} " + a + " \\cdot \\left(" + G.frac(Math.round(q * 60), 60) + "\\right)^k$.", a / (1 - q),
      "Geometrische Reihe mit $|q| < 1$: $\\sum a q^k = \\frac{a}{1 - q} = \\frac{" + a + "}{1 - (" + G.frac(Math.round(q * 60), 60) + ")} = " + G.tex(a / (1 - q), 4) + "$.", 0.01);
    const p = G.pick([0.5, 1, 1.5, 2, 3]);
    return choice(G, "Konvergiert die Reihe $\\displaystyle\\sum_{n=1}^{\\infty} \\frac{1}{n^{" + tnum(p) + "}}$?", p > 1 ? "ja, weil $p > 1$" : "nein, weil $p \\leq 1$", [p > 1 ? "nein, weil $p \\leq 1$" : "ja, weil $p > 1$", "ja, weil die Glieder gegen 0 gehen", "das lässt sich nicht entscheiden"],
      "p-Reihe: konvergent genau für $p > 1$ (Integralkriterium). Dass die Glieder gegen 0 gehen, ist nur notwendig, nicht hinreichend: Die harmonische Reihe ($p = 1$) divergiert.");
  });

  // ---------------------------------------------------------------- functions and equations (Mathematik wave)
  const linx = (G, c) => "x " + G.term(-c, 0);
  const pt = (x, y) => "$(" + tnum(x) + " \\mid " + tnum(y) + ")$";
  const fac = (a) => (a === 1 ? "" : a === -1 ? "-" : tnum(a));
  spec("definitionsbereich", (level, G) => {
    const a = nz(G, -5, 5), b = a + G.int(2, 6), m = G.int(1, 6), form = G.int(0, 2);
    const ask = (f) => "Bestimme den Definitionsbereich von $f(x) = " + f + "$.";
    const all = "alle reellen Zahlen";
    if (level <= 1) {
      if (form === 0) return choice(G, ask("\\sqrt{" + linx(G, a) + "}"), "$x \\geq " + a + "$", [{ md: "$x > " + a + "$", why: "Die Wurzel aus 0 ist erlaubt." }, { md: "$x \\leq " + a + "$" }, { md: "$x \\neq " + a + "$", why: "Bei Wurzeln ist ein ganzer Bereich verboten, nicht nur eine Stelle." }],
        "Der Radikand darf nicht negativ sein: $" + linx(G, a) + " \\geq 0$, also $x \\geq " + a + "$.");
      if (form === 1) return choice(G, ask("\\ln(" + linx(G, a) + ")"), "$x > " + a + "$", [{ md: "$x \\geq " + a + "$", why: "$\\ln 0$ ist nicht definiert." }, { md: "$x \\neq " + a + "$", why: "Auch negative Argumente sind verboten." }, { md: all }],
        "Das Argument des Logarithmus muss echt positiv sein: $" + linx(G, a) + " > 0$.");
      return choice(G, ask("\\frac{1}{" + linx(G, a) + "}"), "$x \\neq " + a + "$", [{ md: "$x > " + a + "$", why: "Verboten ist nur die Nullstelle des Nenners." }, { md: "$x \\geq " + a + "$" }, { md: all, why: "Durch 0 darf man nicht teilen." }],
        "Der Nenner darf nicht 0 werden: $" + linx(G, a) + " \\neq 0$, also $x \\neq " + a + "$.");
    }
    if (level === 2) {
      if (form === 0) return choice(G, ask("\\sqrt{" + a + " - x}"), "$x \\leq " + a + "$", [{ md: "$x \\geq " + a + "$", why: "Im Radikanden steht $-x$: Große x machen ihn negativ." }, { md: "$x < " + a + "$", why: "Der Radikand 0 ist erlaubt." }, { md: "$x \\neq " + a + "$" }],
        "$" + a + " - x \\geq 0$ heißt $x \\leq " + a + "$.");
      if (form === 1) return choice(G, ask("\\frac{1}{x^2 - " + m * m + "}"), "$x \\neq \\pm " + m + "$", [{ md: "$x \\neq " + m + "$", why: "Auch $x = -" + m + "$ macht den Nenner 0." }, { md: "$x > " + m + "$" }, { md: all }],
        "$x^2 - " + m * m + " = 0$ für $x = \\pm " + m + "$; beide Stellen sind verboten.");
      const k = G.pick([2, 3, -2, -3]), n = nz(G, -6, 6), r = G.frac(-n, k);
      const right = (k > 0 ? "$x > " : "$x < ") + r + "$", flip = (k > 0 ? "$x < " : "$x > ") + r + "$";
      return choice(G, ask("\\ln(" + poly([k, n]) + ")"), right, [{ md: flip, why: "Beim Teilen durch eine negative Zahl kehrt sich das Ungleichheitszeichen um." }, { md: (k > 0 ? "$x \\geq " : "$x \\leq ") + r + "$", why: "$\\ln 0$ ist nicht definiert." }, { md: "$x \\neq " + r + "$" }],
        "$" + poly([k, n]) + " > 0$ nach $x$ auflösen" + (k < 0 ? "; das Teilen durch $" + k + "$ kehrt das Zeichen um" : "") + ".");
    }
    if (level === 3) {
      if (form === 0) return choice(G, ask("\\sqrt{x^2 - " + m * m + "}"), "$x \\leq -" + m + "$ oder $x \\geq " + m + "$", [{ md: "$x \\geq " + m + "$", why: "Auch negative Zahlen mit großem Betrag machen den Radikanden positiv." }, { md: "$-" + m + " \\leq x \\leq " + m + "$", why: "Dort ist der Radikand gerade negativ." }, { md: "$x \\neq \\pm " + m + "$" }],
        "$x^2 \\geq " + m * m + "$ heißt $|x| \\geq " + m + "$: links von $-" + m + "$ oder rechts von $" + m + "$.");
      if (form === 1) return choice(G, ask("\\frac{\\sqrt{" + linx(G, a) + "}}{" + linx(G, b) + "}"), "$x \\geq " + a + "$ und $x \\neq " + b + "$", [{ md: "$x \\geq " + a + "$", why: "Der Nenner wird bei $x = " + b + "$ null." }, { md: "$x > " + a + "$ und $x \\neq " + b + "$", why: "Im Zähler ist die Wurzel aus 0 erlaubt." }, { md: "$x \\neq " + b + "$" }],
        "Zwei Problemstellen: Der Radikand $\\geq 0$ gibt $x \\geq " + a + "$, der Nenner $\\neq 0$ gibt $x \\neq " + b + "$. Beide Bedingungen gelten zugleich.");
      return choice(G, ask("\\ln(x^2 + " + m + ")"), all, [{ md: "$x > 0$", why: "$x^2 + " + m + "$ ist für jedes x positiv." }, { md: "$x > -" + m + "$" }, { md: "$x \\neq 0$" }],
        "$x^2 + " + m + " \\geq " + m + " > 0$ für alle $x$: keine Einschränkung.");
    }
    if (form !== 1) return choice(G, ask("\\ln\\left(\\frac{" + linx(G, a) + "}{" + linx(G, b) + "}\\right)"), "$x < " + a + "$ oder $x > " + b + "$", [{ md: "$x > " + b + "$", why: "Für $x < " + a + "$ sind Zähler und Nenner beide negativ, der Bruch also positiv." }, { md: "$" + a + " < x < " + b + "$", why: "Dort haben Zähler und Nenner verschiedene Vorzeichen." }, { md: "$x \\neq " + b + "$" }],
      "Der Bruch ist positiv, wenn Zähler und Nenner dasselbe Vorzeichen haben: beide positiv ($x > " + b + "$) oder beide negativ ($x < " + a + "$). Bei $x = " + a + "$ wäre das Argument 0.");
    return choice(G, ask("\\sqrt{(" + linx(G, a) + ")(" + b + " - x)}"), "$" + a + " \\leq x \\leq " + b + "$", [{ md: "$x \\leq " + a + "$ oder $x \\geq " + b + "$", why: "Dort haben die Faktoren verschiedene Vorzeichen." }, { md: "$x \\geq " + a + "$" }, { md: "$" + a + " < x < " + b + "$", why: "An den Rändern ist der Radikand 0, das ist erlaubt." }],
      "Das Produkt ist $\\geq 0$, wenn beide Faktoren dasselbe Vorzeichen haben. Beide $\\geq 0$ gilt für $" + a + " \\leq x \\leq " + b + "$; beide $\\leq 0$ ist unmöglich.");
  });
  spec("transformation", (level, G) => {
    const u = G.int(-3, 4), v = nz(G, -3, 4);
    const lead = "Der Punkt " + pt(u, v) + " liegt auf dem Graphen von $f$. Welcher Punkt liegt auf dem Graphen von ";
    const dir = (c) => Math.abs(c) + " nach " + (c > 0 ? "rechts" : "links"), up = (d) => Math.abs(d) + " nach " + (d > 0 ? "oben" : "unten");
    if (level <= 1) {
      const c = nz(G, -4, 4), d = nz(G, -4, 4);
      return choice(G, lead + "$g(x) = f(" + linx(G, c) + ") " + G.term(d, 0) + "$?", pt(u + c, v + d),
        [{ md: pt(u - c, v + d), why: "Im Argument wirkt die Verschiebung umgekehrt." }, { md: pt(u + c, v - d) }, { md: pt(u + d, v + c) }],
        "Der Graph wandert um " + dir(c) + " und um " + up(d) + ": $g(" + tnum(u + c) + ") = f(" + tnum(u) + ") " + G.term(d, 0) + " = " + tnum(v + d) + "$.");
    }
    if (level === 2) {
      const a = G.pick([2, 3, -1, -2]), c = nz(G, -3, 3), d = nz(G, -4, 4);
      return choice(G, lead + "$g(x) = " + fac(a) + "f(" + linx(G, c) + ") " + G.term(d, 0) + "$?", pt(u + c, a * v + d),
        [{ md: pt(u + c, a * (v + d)), why: "Erst strecken, dann verschieben: der y-Wert wird mit " + a + " multipliziert, danach kommt " + d + " dazu." }, { md: pt(u - c, a * v + d), why: "Im Argument wirkt die Verschiebung umgekehrt." }, { md: pt(u + c, v + d), why: "Der Faktor " + a + " streckt die y-Werte." }],
        "x-Richtung: um " + dir(c) + ". y-Richtung: erst mal " + a + ", dann " + up(d) + ": $" + a + " \\cdot " + par(v) + " " + G.term(d, 0) + " = " + tnum(a * v + d) + "$.");
    }
    if (level === 3) {
      const b = G.pick([2, 3, 0.5]), d = nz(G, -3, 3);
      const uu = b === 0.5 ? nz(G, -3, 4) : b * nz(G, -2, 2);
      const bt = b === 0.5 ? "\\tfrac12 x" : b + "x";
      return choice(G, "Der Punkt " + pt(uu, v) + " liegt auf dem Graphen von $f$. Welcher Punkt liegt auf dem Graphen von $g(x) = f(" + bt + ") " + G.term(d, 0) + "$?", pt(uu / b, v + d),
        [{ md: pt(uu * b, v + d), why: "Innen wirkt alles umgekehrt: Der Faktor im Argument teilt die x-Werte." }, { md: pt(uu / b, b * v + d), why: "Der Faktor steht im Argument, er ändert die y-Werte nicht." }, { md: pt(uu, v + d) }],
        "Gesucht ist das $x$ mit $" + bt.replace(" x", "x") + " = " + tnum(uu) + "$, also $x = " + tnum(uu / b) + "$. Dort ist $g(x) = f(" + tnum(uu) + ") " + G.term(d, 0) + " = " + tnum(v + d) + "$.");
    }
    const a = G.pick([2, -1, 3]), b = G.pick([2, 3]), e = nz(G, -6, 6), d = nz(G, -4, 4), x0 = G.int(-3, 3);
    const uu = b * x0 - e;
    return choice(G, "Der Punkt " + pt(uu, v) + " liegt auf dem Graphen von $f$. Welcher Punkt liegt auf dem Graphen von $g(x) = " + fac(a) + "f(" + b + "x " + G.term(-e, 0) + ") " + G.term(d, 0) + "$?", pt(x0, a * v + d),
      [{ md: pt(uu / b + e, a * v + d), why: "Erst den Faktor ausklammern: $" + b + "\\left(x " + G.term(-e / b, 3) + "\\right)$. Verschoben wird um $" + tnum(e / b) + "$, nicht um $" + e + "$." }, { md: pt(x0, a * (v + d)), why: "Erst strecken, dann verschieben." }, { md: pt(uu, a * v + d), why: "Das Argument ändert die x-Koordinate." }],
      "Gesucht ist das $x$ mit $" + b + "x " + G.term(-e, 0) + " = " + tnum(uu) + "$, also $x = " + tnum(x0) + "$. y-Wert: $" + a + " \\cdot " + par(v) + " " + G.term(d, 0) + " = " + tnum(a * v + d) + "$.");
  });
  spec("wurzelgleichung", (level, G) => {
    if (level <= 1) {
      const c = G.int(1, 7), b = G.int(-9, 9);
      return num("Löse $\\sqrt{" + poly([1, b]) + "} = " + c + "$.", c * c - b, "Quadrieren: $" + poly([1, b]) + " = " + c * c + "$, also $x = " + (c * c - b) + "$. Probe: $\\sqrt{" + c * c + "} = " + c + "$ stimmt.", 0);
    }
    for (let tries = 0; tries < 80; tries++) {
      const c = level === 2 ? G.int(0, 3) : G.int(-3, 4);
      const s = G.int(Math.max(-c, -3), 8);
      const t = level === 4 ? G.int(-c, 8) : G.int(-9, -c - 1);
      const a = 2 * c + s + t, b = c * c - s * t;
      if (t === s || a === 0) continue;
      const eq = "\\sqrt{" + poly([a, b]) + "} = " + poly([1, c]);
      const quad = poly([1, -(s + t), s * t]) + " = 0";
      if (level === 4) return num("Löse $" + eq + "$ und gib die **Summe aller Lösungen** an.", s + t,
        "Quadrieren: $" + poly([a, b]) + " = (" + poly([1, c]) + ")^2$, also $" + quad + "$ mit $x = " + Math.min(s, t) + "$ und $x = " + Math.max(s, t) + "$. Probe: Für beide ist $x " + G.term(c, 0) + " \\geq 0$, beide sind Lösungen. Summe $" + (s + t) + "$.", 0);
      return num("Löse $" + eq + "$.", s,
        "Quadrieren: $" + poly([a, b]) + " = (" + poly([1, c]) + ")^2$, also $" + quad + "$ mit $x = " + s + "$ oder $x = " + t + "$. Probe: Bei $x = " + t + "$ ist die rechte Seite $" + (t + c) + " < 0$, die Wurzel aber nie negativ: Scheinlösung. Lösung $x = " + s + "$.", 0);
    }
    return num("Löse $\\sqrt{x + 7} = x + 1$.", 2, "Quadrieren: $x + 7 = x^2 + 2x + 1$, also $x^2 + x - 6 = 0$ mit $x = 2$ oder $x = -3$. Probe: $x = -3$ gibt rechts $-2$: Scheinlösung.", 0);
  });
  spec("verkettung", (level, G) => {
    const p = nz(G, -3, 3), q = G.int(-4, 4), m = nz(G, -3, 3), n = G.int(-5, 5), a = G.int(-3, 3);
    const f = (x) => x * x + p * x + q, g = (x) => m * x + n;
    const ft = poly([1, p, q]), gt = poly([m, n]);
    if (level <= 1) return num("$f(x) = " + ft + "$ und $g(x) = " + gt + "$. Berechne $f(g(" + a + "))$.", f(g(a)),
      "Innen zuerst: $g(" + a + ") = " + g(a) + "$, dann $f(" + g(a) + ") = " + f(g(a)) + "$.", 0);
    if (level === 2) return num("$f(x) = " + ft + "$ und $g(x) = " + gt + "$. Berechne $g(f(" + a + "))$.", g(f(a)),
      "Jetzt ist $f$ innen: $f(" + a + ") = " + f(a) + "$, dann $g(" + f(a) + ") = " + g(f(a)) + "$. Die Reihenfolge zählt: $f(g(" + a + ")) = " + f(g(a)) + "$.", 0);
    if (level === 3) {
      const k = G.pick([3, 4, 5]), w = poly([m, n]);
      return choice(G, "$h(x) = (" + w + ")^{" + k + "}$ soll als Verkettung $h(x) = u(v(x))$ geschrieben werden. Welche Zerlegung stimmt?", "$u(z) = z^{" + k + "}$, $v(x) = " + w + "$",
        [{ md: "$u(z) = " + poly([m, n], "z") + "$, $v(x) = x^{" + k + "}$", why: "So würde erst potenziert und danach die lineare Funktion angewendet." }, { md: "$u(z) = " + k + "z$, $v(x) = " + w + "$" }, { md: "$u(z) = z^{" + k + "}$, $v(x) = x$" }],
        "Was zuletzt gerechnet wird, ist die äußere Funktion: Erst wird $" + w + "$ berechnet (innen), dann hoch " + k + " genommen (außen). Ableitung: $h'(x) = " + k + "(" + w + ")^{" + (k - 1) + "} \\cdot " + par(m) + "$.");
    }
    const x1 = G.int(-2, 3), gx = G.int(-2, 4), gd = nz(G, -3, 3), fd = nz(G, -4, 4), fv = G.int(-5, 5);
    return num("Von zwei differenzierbaren Funktionen ist bekannt: $g(" + x1 + ") = " + gx + "$, $g'(" + x1 + ") = " + gd + "$, $f(" + gx + ") = " + fv + "$ und $f'(" + gx + ") = " + fd + "$. Berechne die Ableitung von $h(x) = f(g(x))$ an der Stelle $" + x1 + "$.", fd * gd,
      "Kettenregel: $h'(" + x1 + ") = f'(g(" + x1 + ")) \\cdot g'(" + x1 + ") = f'(" + gx + ") \\cdot " + par(gd) + " = " + fd + " \\cdot " + par(gd) + " = " + fd * gd + "$. Der Wert $f(" + gx + ")$ wird nicht gebraucht.", 0);
  });
  spec("stetigkeit", (level, G) => {
    const x0 = nz(G, -3, 3), p = G.int(-4, 4);
    const left = poly([1, 0, p]), L = x0 * x0 + p;
    const cases = (r) => "$f(x) = \\begin{cases} " + left + " & x \\leq " + x0 + " \\\\ " + r + " & x > " + x0 + " \\end{cases}$";
    if (level <= 2) {
      const a = nz(G, -4, 4), b = L - a * x0;
      if (level <= 1) return num(cases(fac(a) + "x + b") + ". Für welches $b$ ist $f$ an der Stelle $" + x0 + "$ stetig?", b,
        "Links: $f(" + x0 + ") = " + L + "$. Rechts strebt $" + fac(a) + "x + b$ gegen $" + a * x0 + " + b$. Gleichsetzen: $b = " + L + " " + G.term(-a * x0, 0) + " = " + b + "$.", 0);
      return num(cases("ax " + G.term(b, 0)) + ". Für welches $a$ ist $f$ an der Stelle $" + x0 + "$ stetig?", a,
        "Links: $f(" + x0 + ") = " + L + "$. Rechts: $" + par(x0) + "a " + G.term(b, 0) + "$. Gleichsetzen: $" + par(x0) + "a = " + (L - b) + "$, also $a = " + a + "$.", 0);
    }
    if (level === 3) {
      const a = 2 * x0, b = L - a * x0;
      return num(cases("ax + b") + ". Für welche $a$ und $b$ ist $f$ an der Stelle $" + x0 + "$ differenzierbar? Gib $b$ an.", b,
        "Gleiche Steigung: $2 \\cdot " + par(x0) + " = a$, also $a = " + a + "$. Gleicher Wert: $" + L + " = " + a + " \\cdot " + par(x0) + " + b$, also $b = " + b + "$. Erst beides zusammen macht die Nahtstelle glatt.", 0);
    }
    const x1 = G.pick([1, 2]), k = nz(G, -2, 2), c = -2 * k * x1 * x1 * x1, b = -3 * k * x1 * x1;
    return num("$f(x) = \\begin{cases} ax^2 + b & x \\leq " + x1 + " \\\\ \\frac{" + c + "}{x} & x > " + x1 + " \\end{cases}$. Für welche $a$ und $b$ ist $f$ an der Stelle $" + x1 + "$ differenzierbar? Gib $b$ an.", b,
      "Gleiche Steigung: $2a \\cdot " + x1 + " = -\\frac{" + c + "}{" + x1 * x1 + "}$, also $a = " + k + "$. Gleicher Wert: $" + k * x1 * x1 + " + b = \\frac{" + c + "}{" + x1 + "} = " + c / x1 + "$, also $b = " + b + "$.", 0);
  });
  const EXACT = [[0, "0"], [0.5, "\\tfrac12"], [Math.SQRT2 / 2, "\\tfrac{\\sqrt2}{2}"], [Math.sqrt(3) / 2, "\\tfrac{\\sqrt3}{2}"], [1, "1"]];
  const exact = (v) => { const e = EXACT.find(([w]) => Math.abs(Math.abs(v) - w) < 1e-9); return (v < -1e-9 ? "-" : "") + e[1]; };
  const radTex = (deg) => {
    if (deg === 0) return "0";
    const g = G0(deg, 180), z = deg / g, nn = 180 / g;
    const top = (z === 1 ? "" : z) + "\\pi";
    return nn === 1 ? top : "\\tfrac{" + top + "}{" + nn + "}";
  };
  function G0(a, b) { while (b) [a, b] = [b, a % b]; return a; }
  const trigv = (fn, deg) => (fn === "sin" ? Math.sin((deg * Math.PI) / 180) : Math.cos((deg * Math.PI) / 180));
  spec("trigwert", (level, G) => {
    if (level <= 3) {
      const fn = G.pick(["sin", "cos"]), other = fn === "sin" ? "cos" : "sin";
      const deg = level <= 1 ? G.pick([0, 30, 45, 60, 90]) : G.pick([120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
      const v = trigv(fn, deg), right = exact(v);
      const arg = level === 3 ? radTex(deg) : deg + "^\\circ";
      const ref = deg % 180 === 0 || deg % 90 === 0 ? null : Math.min(deg % 180, 180 - (deg % 180));
      const wrong = [exact(trigv(other, deg)), exact(-v), exact(trigv(fn, ref || 30))].filter((w) => w !== right).map((w) => ({ md: "$" + w + "$" }));
      ["\\tfrac12", "-\\tfrac{\\sqrt3}{2}", "1", "0"].forEach((w) => { if (w !== right) wrong.push({ md: "$" + w + "$" }); });
      return choice(G, "Bestimme den exakten Wert von $\\" + fn + "\\left(" + arg + "\\right)$.", "$" + right + "$", wrong,
        "Am Einheitskreis ist $\\cos$ die x- und $\\sin$ die y-Koordinate." + (ref ? " Der Bezugswinkel ist $" + ref + "^\\circ$; das Vorzeichen folgt aus dem Quadranten, in dem $" + deg + "^\\circ$ liegt." : "") + " Ergebnis: $" + right + "$.");
    }
    const fn = G.pick(["sin", "cos"]), val = G.pick([0.5, -0.5, Math.SQRT2 / 2, -Math.SQRT2 / 2, Math.sqrt(3) / 2, -Math.sqrt(3) / 2]);
    const sols = (f, w) => { const out = []; for (let d = 0; d < 360; d += 15) if (Math.abs(trigv(f, d) - w) < 1e-9) out.push(d); return out; };
    const show = (ds) => ds.length ? ds.map((d) => "$" + radTex(d) + "$").join(" und ") : "keine";
    const right = show(sols(fn, val));
    const wrong = [show(sols(fn, -val)), show(sols(fn === "sin" ? "cos" : "sin", val)), show(sols(fn, val).map((d) => d % 180 === 0 ? d : d < 180 ? d : 360 - d).filter((d, i, arr) => arr.indexOf(d) === i))]
      .filter((w) => w !== right).map((w) => ({ md: w }));
    return choice(G, "Bestimme alle Lösungen von $\\" + fn + " x = " + exact(val) + "$ im Intervall $[0; 2\\pi)$.", right, wrong.concat([{ md: "$\\tfrac{\\pi}{6}$ und $\\tfrac{5\\pi}{6}$" }]),
      "Erst den Bezugswinkel im ersten Quadranten bestimmen, dann am Einheitskreis die zweite Stelle mit demselben " + (fn === "sin" ? "y-Wert (Spiegelung an der y-Achse)" : "x-Wert (Spiegelung an der x-Achse)") + " suchen; das Vorzeichen legt die Quadranten fest. Lösungen: " + right + ".");
  });
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  spec("additionstheorem", (level, G) => {
    if (level <= 1) {
      const P = "\\tfrac{\\sqrt6 + \\sqrt2}{4}", M = "\\tfrac{\\sqrt6 - \\sqrt2}{4}", N = "\\tfrac{\\sqrt2 - \\sqrt6}{4}";
      const pick = G.pick([["sin", 75, "45^\\circ + 30^\\circ", P], ["sin", 15, "45^\\circ - 30^\\circ", M], ["cos", 75, "45^\\circ + 30^\\circ", M], ["cos", 15, "45^\\circ - 30^\\circ", P], ["cos", 105, "60^\\circ + 45^\\circ", N]]);
      const wrong = [P, M, N, "\\tfrac{\\sqrt3 + 1}{2}"].filter((w) => w !== pick[3]).map((w) => ({ md: "$" + w + "$" }));
      return choice(G, "Berechne $\\" + pick[0] + " " + pick[1] + "^\\circ$ exakt über $" + pick[1] + "^\\circ = " + pick[2] + "$.", "$" + pick[3] + "$", wrong,
        "Additionstheorem anwenden und die exakten Werte von $30^\\circ$, $45^\\circ$, $60^\\circ$ einsetzen; $\\tfrac{\\sqrt2}{2} \\cdot \\tfrac{\\sqrt3}{2} = \\tfrac{\\sqrt6}{4}$. Ergebnis $" + pick[3] + "$.");
    }
    const [A, B] = G.pickN(TRIPLES, 2);
    const sa = A[0] / A[2], ca = A[1] / A[2], sb = B[0] / B[2], cb = B[1] / B[2];
    const given = "$\\sin\\alpha = " + G.frac(A[0], A[2]) + "$ und $\\cos\\beta = " + G.frac(B[1], B[2]) + "$, beide Winkel spitz";
    if (level === 2) return num("Es gilt " + given + ". Berechne $\\sin(\\alpha + \\beta)$ (drei Nachkommastellen).", sa * cb + ca * sb,
      "Mit dem Pythagoras am Einheitskreis: $\\cos\\alpha = " + G.frac(A[1], A[2]) + "$, $\\sin\\beta = " + G.frac(B[0], B[2]) + "$. Dann $\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta = " + G.frac(A[0] * B[1] + A[1] * B[0], A[2] * B[2]) + " \\approx " + G.tex(sa * cb + ca * sb, 3) + "$.", 0.002);
    if (level === 3) return num("Es gilt $\\sin\\alpha = " + G.frac(A[0], A[2]) + "$. Berechne $\\cos(2\\alpha)$ (drei Nachkommastellen).", 1 - 2 * sa * sa,
      "$\\cos(2\\alpha) = 1 - 2\\sin^2\\alpha = 1 - 2 \\cdot " + G.frac(A[0] * A[0], A[2] * A[2]) + " = " + G.frac(A[2] * A[2] - 2 * A[0] * A[0], A[2] * A[2]) + " \\approx " + G.tex(1 - 2 * sa * sa, 3) + "$. Die Form mit $\\sin^2$ spart das Berechnen von $\\cos\\alpha$.", 0.002);
    return num("$\\alpha$ liegt im zweiten Quadranten mit $\\sin\\alpha = " + G.frac(A[0], A[2]) + "$; $\\beta$ ist spitz mit $\\cos\\beta = " + G.frac(B[1], B[2]) + "$. Berechne $\\cos(\\alpha - \\beta)$ (drei Nachkommastellen).", -ca * cb + sa * sb,
      "Im zweiten Quadranten ist der Kosinus negativ: $\\cos\\alpha = -" + G.frac(A[1], A[2]) + "$; $\\sin\\beta = " + G.frac(B[0], B[2]) + "$. $\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta = " + G.frac(-A[1] * B[1] + A[0] * B[0], A[2] * B[2]) + " \\approx " + G.tex(-ca * cb + sa * sb, 3) + "$.", 0.002);
  });
  spec("restsatz", (level, G) => {
    if (level <= 1) {
      const cs = [1, G.int(-4, 4), G.int(-6, 6), G.int(-8, 8)], a = nz(G, -3, 3);
      return num("Welchen Rest lässt $f(x) = " + poly(cs) + "$ bei der Division durch $(" + linx(G, a) + ")$?", ev(cs, a),
        "Restsatz: Der Rest ist $f(" + a + ") = " + ev(cs, a) + "$. Eine Polynomdivision ist nicht nötig.", 0);
    }
    if (level === 2) {
      const a = nz(G, -3, 3), k = G.int(-4, 4), c = G.int(-6, 6), d = -(a * a * a + k * a * a + c * a);
      return num("Für welches $d$ ist $(" + linx(G, a) + ")$ ein Faktor von $f(x) = " + poly([1, k, c, 0]) + " + d$?", d,
        "Faktorsatz: $(" + linx(G, a) + ")$ ist Faktor genau dann, wenn $f(" + a + ") = 0$: $" + (a * a * a + k * a * a + c * a) + " + d = 0$, also $d = " + d + "$.", 0);
    }
    if (level === 3) {
      const r = G.pickN([-4, -3, -2, -1, 1, 2, 3, 4, 5], 3), cs = [1, -(r[0] + r[1] + r[2]), r[0] * r[1] + r[0] * r[2] + r[1] * r[2], -r[0] * r[1] * r[2]];
      const rest = poly([1, -(r[1] + r[2]), r[1] * r[2]]);
      return num("$x = " + r[0] + "$ ist eine Nullstelle von $f(x) = " + poly(cs) + "$. Bestimme die **größte** Nullstelle.", Math.max(...r),
        "Polynomdivision durch $(" + linx(G, r[0]) + ")$ ergibt $" + rest + "$, dessen Nullstellen $" + Math.min(r[1], r[2]) + "$ und $" + Math.max(r[1], r[2]) + "$ sind. Alle Nullstellen: $" + r.slice().sort((x, y) => x - y).join("$, $") + "$.", 0);
    }
    for (let t = 0; t < 60; t++) {
      const r = nz(G, -3, 3), p = G.int(-5, 5), q = G.int(-6, 4), D = p * p - 4 * q;
      const sq = Math.round(Math.sqrt(D));
      if (D <= 0 || sq * sq === D) continue;
      const cs = [1, p - r, q - r * p, -r * q], big = Math.max(r, (-p + Math.sqrt(D)) / 2);
      return num("$x = " + r + "$ ist eine Nullstelle von $f(x) = " + poly(cs) + "$. Bestimme die **größte** Nullstelle (zwei Nachkommastellen).", big,
        "Polynomdivision durch $(" + linx(G, r) + ")$ ergibt $" + poly([1, p, q]) + "$. pq-Formel: $x = " + tnum(-p / 2) + " \\pm \\sqrt{" + tnum(D / 4) + "}$. Größte Nullstelle $\\approx " + G.tex(big, 2) + "$.", 0.01);
    }
    return num("$x = 1$ ist eine Nullstelle von $f(x) = x^3 - 3x + 2$. Bestimme die größte Nullstelle.", 1, "$x^3 - 3x + 2 = (x - 1)^2(x + 2)$.", 0);
  });
  spec("potenz", (level, G) => {
    if (level <= 1) {
      const m = G.int(2, 7), n = G.int(-3, 6), k = G.int(1, 6);
      return num("Schreibe $\\dfrac{a^{" + m + "} \\cdot a^{" + n + "}}{a^{" + k + "}}$ als eine Potenz von $a$ ($a > 0$). Gib den Exponenten an.", m + n - k,
        "Gleiche Basis: Exponenten addieren beim Multiplizieren, subtrahieren beim Teilen: $" + m + " " + G.term(n, 0) + " - " + k + " = " + (m + n - k) + "$.", 0);
    }
    if (level === 2) {
      const m = G.int(2, 5), n = G.pick([2, 3, -2]), k = G.int(1, 7);
      return num("Schreibe $\\left(a^{" + m + "}\\right)^{" + n + "} \\cdot a^{-" + k + "}$ als eine Potenz von $a$. Gib den Exponenten an.", m * n - k,
        "Potenz einer Potenz: Exponenten multiplizieren ($" + m * n + "$), dann $a^{-" + k + "}$ dazu: $" + m * n + " - " + k + " = " + (m * n - k) + "$.", 0);
    }
    if (level === 3) {
      const [b, p, q, val] = G.pick([[8, 2, 3, 4], [27, -1, 3, 1 / 3], [16, 3, 4, 8], [32, 2, 5, 4], [9, -3, 2, 1 / 27], [64, 5, 6, 32], [125, 2, 3, 25], [4, -3, 2, 1 / 8]]);
      return num("Berechne $" + b + "^{" + G.frac(p, q) + "}$ ohne Taschenrechner (als Dezimalzahl, falls nötig).", val,
        "$a^{\\frac{p}{q}} = \\left(\\sqrt[q]{a}\\right)^p$: Erst die " + q + "-te Wurzel ziehen ($" + Math.round(Math.pow(b, 1 / q)) + "$), dann hoch $" + p + "$" + (p < 0 ? " (negativ: Kehrwert)" : "") + ". Ergebnis $" + G.tex(val, 4) + "$.", 0.0005);
    }
    const base = G.pick([2, 3]), k = G.pick([2, 3]), p = G.int(-4, 5);
    let q = G.int(-3, 4);
    if ((p + k * q) % (k - 1) !== 0) q += 1;
    const x = (p + k * q) / (k - 1), big = Math.pow(base, k);
    return num("Löse $" + base + "^{" + poly([1, p]) + "} = " + big + "^{" + poly([1, -q]) + "}$.", x,
      "Gleiche Basis herstellen: $" + big + " = " + base + "^{" + k + "}$, also $" + base + "^{" + poly([1, p]) + "} = " + base + "^{" + k + "(" + poly([1, -q]) + ")}$. Exponenten gleichsetzen: $" + poly([1, p]) + " = " + poly([k, -k * q]) + "$, also $x = " + tnum(x) + "$.", 0);
  });
  spec("gebrochen", (level, G) => {
    const a = nz(G, -4, 4);
    if (level <= 1) {
      let m = nz(G, -3, 3), n = G.int(-5, 5);
      if (m * a + n === 0) n += 1;
      return num("$f(x) = \\dfrac{" + poly([m, n]) + "}{" + linx(G, a) + "}$. An welcher Stelle hat $f$ eine Polstelle?", a,
        "Der Nenner wird bei $x = " + a + "$ null, der Zähler dort nicht ($" + (m * a + n) + " \\neq 0$): Polstelle.", 0);
    }
    if (level === 2) {
      const b = G.int(-5, 5);
      return num("$f(x) = \\dfrac{" + poly([1, b - a, -a * b]) + "}{" + linx(G, a) + "}$ hat bei $x = " + a + "$ eine Definitionslücke. Welchen Wert hat dort die stetige Fortsetzung?", a + b,
        "Der Zähler hat ebenfalls die Nullstelle $" + a + "$: $" + poly([1, b - a, -a * b]) + " = (" + linx(G, a) + ")(" + poly([1, b]) + ")$. Kürzen ergibt $" + poly([1, b]) + "$, an der Stelle $" + a + "$ also $" + (a + b) + "$: eine hebbare Lücke, keine Polstelle.", 0);
    }
    if (level === 3) {
      const p = nz(G, -6, 6), r = G.pick([1, 2, 3, 4, -2]), q = G.int(-5, 5), s = G.int(1, 6);
      return num("Bestimme die waagerechte Asymptote $y = c$ von $f(x) = \\dfrac{" + poly([p, 0, q]) + "}{" + poly([r, 0, s]) + "}$. Gib $c$ an.", p / r,
        "Zähler- und Nennergrad sind gleich (2): Die Asymptote ist der Quotient der Leitkoeffizienten, $y = " + G.frac(p, r) + "$.", 0.001);
    }
    const p = G.int(-5, 5), q = G.int(-6, 6);
    return num("$f(x) = \\dfrac{" + poly([1, p, q]) + "}{" + linx(G, a) + "}$ hat eine schiefe Asymptote $y = x + c$. Bestimme $c$.", p + a,
      "Polynomdivision: $(" + poly([1, p, q]) + ") : (" + linx(G, a) + ") = " + poly([1, p + a]) + " + \\frac{" + (q + a * (p + a)) + "}{" + linx(G, a) + "}$. Der Bruch geht für $x \\to \\pm\\infty$ gegen 0, die Asymptote ist $y = " + poly([1, p + a]) + "$.", 0);
  });

  // ---------------------------------------------------------------- differential calculus (Mathematik wave)
  spec("aenderungsrate", (level, G) => {
    if (level <= 1) {
      const cs = [G.pick([1, -1, 2]), G.int(-4, 4), G.int(-5, 5)], a = G.int(-3, 2), b = a + G.int(1, 4);
      const m = (ev(cs, b) - ev(cs, a)) / (b - a);
      return num("Berechne die mittlere Änderungsrate von $f(x) = " + poly(cs) + "$ auf dem Intervall $[" + a + "; " + b + "]$.", m,
        "$\\dfrac{f(" + b + ") - f(" + a + ")}{" + b + " - " + par(a) + "} = \\dfrac{" + ev(cs, b) + " - " + par(ev(cs, a)) + "}{" + (b - a) + "} = " + tnum(m) + "$: die Steigung der Sekante.", 0.01);
    }
    if (level === 2) {
      const cs = [G.pick([1, -1, 2]), G.int(-4, 4), G.int(-5, 5), G.int(-5, 5)], x0 = G.int(-2, 3);
      const m = ev(der(cs), x0);
      return num("Berechne die momentane Änderungsrate von $f(x) = " + poly(cs) + "$ an der Stelle $x_0 = " + x0 + "$.", m,
        "Die momentane Änderungsrate ist die Ableitung: $f'(x) = " + poly(der(cs)) + "$, also $f'(" + x0 + ") = " + m + "$.", 0);
    }
    if (level === 3) {
      const a = G.pick([0.5, 1, 1.5, 2, 2.5]), b = G.int(0, 6), t1 = G.int(0, 3), t2 = t1 + G.int(1, 4);
      const s = (t) => a * t * t + b * t;
      const st = poly([a, b, 0], "t");
      if (G.chance(0.5)) return num("Ein Körper legt in $t$ Sekunden $s(t) = " + st + "$ Meter zurück. Berechne die Durchschnittsgeschwindigkeit zwischen $t = " + t1 + "$ und $t = " + t2 + "$ in m/s.", (s(t2) - s(t1)) / (t2 - t1),
        "$\\bar v = \\dfrac{s(" + t2 + ") - s(" + t1 + ")}{" + t2 + " - " + t1 + "} = \\dfrac{" + tnum(s(t2)) + " - " + tnum(s(t1)) + "}{" + (t2 - t1) + "} = " + tnum((s(t2) - s(t1)) / (t2 - t1)) + "$ m/s: die Sekantensteigung im t-s-Diagramm.", 0.01, "m/s");
      return num("Ein Körper legt in $t$ Sekunden $s(t) = " + st + "$ Meter zurück. Berechne seine Geschwindigkeit zum Zeitpunkt $t = " + t2 + "$ in m/s.", 2 * a * t2 + b,
        "Die Momentangeschwindigkeit ist die Ableitung: $s'(t) = " + poly([2 * a, b], "t") + "$, also $s'(" + t2 + ") = " + tnum(2 * a * t2 + b) + "$ m/s.", 0.01, "m/s");
    }
    const k = G.pick([1, 2, 3]), q = G.int(2, 4);
    return num("An welcher Stelle im Intervall $[0; " + q + "]$ hat die Tangente an $f(x) = " + fac(k) + "x^3$ dieselbe Steigung wie die Sekante durch die beiden Randpunkte? (zwei Nachkommastellen)", q / Math.sqrt(3),
      "Sekantensteigung: $\\tfrac{f(" + q + ") - f(0)}{" + q + "} = " + k * q * q + "$. Tangentensteigung: $f'(x) = " + 3 * k + "x^2 = " + k * q * q + "$ gibt $x^2 = " + tnum((q * q) / 3) + "$, also $x = \\tfrac{" + q + "}{\\sqrt3} \\approx " + G.tex(q / Math.sqrt(3), 2) + "$ (Mittelwertsatz).", 0.01);
  });
  spec("fernpunkt", (level, G) => {
    const c = level >= 3 ? nz(G, -3, 3) : 0, a = level <= 1 ? 0 : nz(G, -3, 3), r = G.int(1, 4);
    const bb = a * a - r * r, b = bb + c, u1 = a - r, u2 = a + r;
    const f = "x^2" + (c ? " " + G.term(c, 0) : "");
    const P = "P(" + a + " \\mid " + b + ")";
    const quad = poly([1, -2 * a, bb], "u") + " = 0";
    const tang = "y = 2u(x - u) + u^2" + (c ? " " + G.term(c, 0) : "");
    if (level === 4) return num("Durch $" + P + "$ gehen zwei Tangenten an den Graphen von $f(x) = " + f + "$. Bestimme die **größere** der beiden Tangentensteigungen.", 2 * u2,
      "Tangente an der Berührstelle $u$: $" + tang + "$. Punktprobe mit $" + P + "$ ergibt $" + quad + "$, also $u = " + u1 + "$ oder $u = " + u2 + "$. Steigungen $f'(u) = 2u$: $" + 2 * u1 + "$ und $" + 2 * u2 + "$.", 0);
    return num("Durch $" + P + "$ gehen zwei Tangenten an den Graphen von $f(x) = " + f + "$. Bestimme die **größere** Berührstelle $u$.", u2,
      "Tangente an der Berührstelle $u$: $" + tang + "$. $" + P + "$ einsetzen und ordnen: $" + quad + "$, also $u = " + u1 + "$ oder $u = " + u2 + "$.", 0);
  });
  spec("schnittwinkel", (level, G) => {
    if (level <= 1) {
      const m = G.pick([0.5, 2, 3, -1.5, 0.25, -4, 1.2]);
      const w = deg(Math.atan(Math.abs(m)));
      return num("Ein Graph schneidet die x-Achse mit der Steigung $" + tnum(m) + "$. Unter welchem Winkel schneidet er sie? (in Grad, eine Nachkommastelle)", w,
        "$\\tan\\alpha = |m| = " + tnum(Math.abs(m)) + "$, also $\\alpha = \\arctan " + tnum(Math.abs(m)) + " \\approx " + G.tex(w, 1) + "^\\circ$.", 0.1, "°");
    }
    if (level === 2) {
      const k = G.int(1, 3), w = deg(Math.atan(2 * k));
      return num("Unter welchem Winkel schneidet $f(x) = x^2 - " + k * k + "$ die x-Achse an der Stelle $x = " + k + "$? (in Grad, eine Nachkommastelle)", w,
        "$f'(x) = 2x$, also $f'(" + k + ") = " + 2 * k + "$ und $\\alpha = \\arctan " + 2 * k + " \\approx " + G.tex(w, 1) + "^\\circ$.", 0.1, "°");
    }
    if (level === 3) {
      const m = G.int(1, 3), m1 = 2 * m, m2 = m;
      const w = deg(Math.atan(Math.abs((m1 - m2) / (1 + m1 * m2))));
      return num("Die Graphen von $f(x) = x^2$ und $g(x) = " + fac(m) + "x$ schneiden sich bei $x = " + m + "$. Berechne den Schnittwinkel dort (in Grad, eine Nachkommastelle).", w,
        "Steigungen: $f'(" + m + ") = " + m1 + "$ und $g'(x) = " + m2 + "$. $\\tan\\gamma = \\left|\\dfrac{" + m1 + " - " + m2 + "}{1 + " + m1 + " \\cdot " + m2 + "}\\right| = " + G.frac(m1 - m2, 1 + m1 * m2) + "$, also $\\gamma \\approx " + G.tex(w, 1) + "^\\circ$. Ebenso: $\\arctan " + m1 + " - \\arctan " + m2 + "$.", 0.1, "°");
    }
    const n = G.int(2, 5), w = deg(Math.atan(Math.abs((n - 1) / (1 + n))));
    return num("Die Graphen von $f(x) = x^{" + n + "}$ und $g(x) = x$ schneiden sich im Punkt $(1 \\mid 1)$. Unter welchem Winkel? (in Grad, eine Nachkommastelle)", w,
      "Steigungen in $x = 1$: $f'(1) = " + n + "$, $g'(1) = 1$. $\\tan\\gamma = \\left|\\dfrac{" + n + " - 1}{1 + " + n + "}\\right| = " + G.frac(n - 1, n + 1) + "$, also $\\gamma \\approx " + G.tex(w, 1) + "^\\circ$.", 0.1, "°");
  });
  const GRAPH = [
    [1, "$f$ hat bei $x = a$ einen Hochpunkt.", "$f'$ hat bei $a$ eine Nullstelle mit Vorzeichenwechsel von $+$ nach $-$.",
      ["$f'$ hat bei $a$ eine Nullstelle mit Vorzeichenwechsel von $-$ nach $+$.", "$f'$ hat bei $a$ einen Hochpunkt.", "$f'(a) > 0$."]],
    [1, "$f$ hat bei $x = a$ einen Tiefpunkt.", "$f'$ hat bei $a$ eine Nullstelle mit Vorzeichenwechsel von $-$ nach $+$.",
      ["$f'$ hat bei $a$ eine Nullstelle mit Vorzeichenwechsel von $+$ nach $-$.", "$f'$ hat bei $a$ einen Tiefpunkt.", "$f'(a) < 0$."]],
    [1, "$f$ hat bei $x = a$ einen Wendepunkt.", "$f'$ hat bei $a$ einen Extrempunkt.",
      ["$f'$ hat bei $a$ eine Nullstelle.", "$f'$ hat bei $a$ einen Wendepunkt.", "$f'$ ist bei $a$ nicht definiert."]],
    [1, "$f$ ist auf $[1; 4]$ streng monoton fallend.", "$f'(x) \\leq 0$ für alle $x$ aus $[1; 4]$.",
      ["$f'$ ist auf $[1; 4]$ streng monoton fallend.", "$f'(x) \\geq 0$ für alle $x$ aus $[1; 4]$.", "$f$ hat auf $[1; 4]$ eine Nullstelle."]],
    [2, "$f$ hat bei $x = a$ einen Sattelpunkt.", "$f'$ hat bei $a$ eine Nullstelle ohne Vorzeichenwechsel.",
      ["$f'$ hat bei $a$ eine Nullstelle mit Vorzeichenwechsel.", "$f'(a) \\neq 0$.", "$f$ hat bei $a$ einen Extrempunkt."]],
    [2, "$f$ ist auf $[0; 3]$ linksgekrümmt.", "$f'$ ist auf $[0; 3]$ streng monoton wachsend.",
      ["$f'$ ist auf $[0; 3]$ positiv.", "$f$ ist auf $[0; 3]$ wachsend.", "$f'$ ist auf $[0; 3]$ fallend."]],
    [2, "$f$ ist ganzrational vom Grad 3.", "$f'$ ist ganzrational vom Grad 2; ihr Graph ist eine Parabel.",
      ["$f'$ ist ganzrational vom Grad 4.", "Der Graph von $f'$ ist eine Gerade.", "$f'$ hat genau drei Nullstellen."]],
    [3, "$f'$ hat bei $x = a$ einen Hochpunkt.", "$f$ hat bei $a$ einen Wendepunkt, an dem die Linkskrümmung in eine Rechtskrümmung übergeht.",
      ["$f$ hat bei $a$ einen Hochpunkt.", "$f$ hat bei $a$ einen Wendepunkt, an dem die Rechtskrümmung in eine Linkskrümmung übergeht.", "$f$ hat bei $a$ eine Nullstelle."]],
    [3, "$f''(x) < 0$ für alle $x$ aus $[2; 5]$.", "$f$ ist auf $[2; 5]$ rechtsgekrümmt.",
      ["$f$ ist auf $[2; 5]$ fallend.", "$f$ ist auf $[2; 5]$ linksgekrümmt.", "$f'$ ist auf $[2; 5]$ negativ."]],
    [3, "$f'(x) > 0$ für alle reellen $x$.", "$f$ ist streng monoton wachsend und hat höchstens eine Nullstelle.",
      ["$f$ ist überall positiv.", "$f$ ist überall linksgekrümmt.", "$f$ hat genau einen Extrempunkt."]],
    [4, "$f$ hat bei $x = a$ eine Nullstelle mit Vorzeichenwechsel von $-$ nach $+$.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Tiefpunkt.",
      ["Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Hochpunkt.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ eine Nullstelle.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Wendepunkt."]],
    [4, "$f$ hat bei $x = a$ einen Hochpunkt.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Wendepunkt.",
      ["Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Hochpunkt.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ einen Extrempunkt.", "Jede Stammfunktion $F$ von $f$ hat bei $a$ eine Nullstelle."]],
  ];
  spec("graphisch", (level, G) => {
    const pool = GRAPH.filter((g) => g[0] <= level && g[0] >= Math.max(1, level - 1));
    const [, premise, right, wrong] = G.pick(pool);
    return choice(G, "Bekannt ist: " + premise + " Welche Aussage folgt daraus **sicher**?", right, wrong.map((w) => ({ md: w })),
      "Übersetzung zwischen den Ebenen: Nullstellen der Ableitung sind Kandidaten für Extrempunkte, Extrempunkte der Ableitung sind Wendepunkte, das Vorzeichen der Ableitung ist die Steigung. Hier: " + right);
  });

  // ---------------------------------------------------------------- applications of the derivative (Mathematik wave)
  spec("extremwertproblem", (level, G) => {
    if (level <= 1) {
      const U = 4 * G.int(3, 15);
      return num("Ein Rechteck hat den Umfang $" + U + "$ cm. Wie groß ist sein Flächeninhalt höchstens (in cm²)?", (U / 4) * (U / 4),
        "Nebenbedingung $2x + 2y = " + U + "$, also $y = " + U / 2 + " - x$. Zielfunktion $A(x) = x(" + U / 2 + " - x)$, $A'(x) = " + U / 2 + " - 2x = 0$ bei $x = " + U / 4 + "$. Das Quadrat mit der Seite " + U / 4 + " cm hat $A = " + (U / 4) * (U / 4) + "$ cm².", 0.01, "cm²");
    }
    if (level === 2) {
      const L = 4 * G.int(5, 25);
      return num("Mit $" + L + "$ m Zaun soll an einer Mauer ein rechteckiges Gehege abgegrenzt werden; die Mauer ersetzt eine Seite. Wie groß ist die Fläche höchstens (in m²)?", (L * L) / 8,
        "Zwei Seiten $x$ stehen senkrecht zur Mauer, die dritte ist $y = " + L + " - 2x$. $A(x) = x(" + L + " - 2x)$, $A'(x) = " + L + " - 4x = 0$ bei $x = " + L / 4 + "$, also $y = " + L / 2 + "$ und $A = " + (L * L) / 8 + "$ m².", 0.01, "m²");
    }
    if (level === 3) {
      if (G.chance(0.5)) {
        const a = G.pick([6, 9, 12, 15, 18, 24, 30]), x = a / 6, V = x * (a - 2 * x) * (a - 2 * x);
        return num("Aus einem quadratischen Blech mit der Seite $" + a + "$ cm wird eine offene Schachtel gefaltet: An den Ecken schneidet man Quadrate der Seite $x$ aus. Wie groß ist das Volumen höchstens (in cm³)?", V,
          "$V(x) = x(" + a + " - 2x)^2$ mit $0 < x < " + tnum(a / 2) + "$. $V'(x) = (" + a + " - 2x)(" + a + " - 6x) = 0$ gibt $x = " + tnum(x) + "$; die andere Lösung $x = " + tnum(a / 2) + "$ ergibt $V = 0$. $V = " + tnum(x) + " \\cdot " + tnum(a - 2 * x) + "^2 = " + tnum(V) + "$ cm³.", Math.max(0.5, V * 0.002), "cm³");
      }
      const c = G.pick([3, 12, 27, 48, 75]), r = Math.sqrt(c / 3), A = 2 * r * (c - r * r);
      return num("Ein Rechteck liegt mit einer Seite auf der x-Achse, seine oberen Ecken liegen auf der Parabel $y = " + c + " - x^2$ (symmetrisch zur y-Achse). Wie groß ist sein Flächeninhalt höchstens?", A,
        "Mit der rechten Ecke bei $x$: $A(x) = 2x(" + c + " - x^2) = " + 2 * c + "x - 2x^3$. $A'(x) = " + 2 * c + " - 6x^2 = 0$ gibt $x = " + tnum(r) + "$ und $A = " + tnum(A) + "$.", Math.max(0.01, A * 0.002));
    }
    const V = G.pick([250, 330, 500, 750, 1000]), r = Math.cbrt(V / (2 * Math.PI));
    return num("Eine zylindrische Dose soll $" + V + "$ cm³ fassen. Bei welchem Radius ist ihre Oberfläche am kleinsten? (in cm, zwei Nachkommastellen)", r,
      "Nebenbedingung $\\pi r^2 h = " + V + "$, also $h = \\tfrac{" + V + "}{\\pi r^2}$. Zielfunktion $O(r) = 2\\pi r^2 + \\tfrac{" + 2 * V + "}{r}$, $O'(r) = 4\\pi r - \\tfrac{" + 2 * V + "}{r^2} = 0$ gibt $r^3 = \\tfrac{" + V + "}{2\\pi}$, also $r \\approx " + G.tex(r, 2) + "$ cm. Dann ist $h = 2r$: Die sparsamste Dose ist so hoch wie breit.", 0.01, "cm");
  });
  spec("schar", (level, G) => {
    if (level <= 1) {
      const k = nz(G, -4, 4);
      return num("Die Schar $f_k(x) = x^2 - 2kx$ hat ihren Tiefpunkt bei $x = k$. Bestimme seine y-Koordinate für $k = " + k + "$.", -k * k,
        "$f_{" + k + "}(" + k + ") = " + par(k) + "^2 - 2 \\cdot " + par(k) + " \\cdot " + par(k) + " = " + (-k * k) + "$. Allgemein liegt der Tiefpunkt bei $T(k \\mid -k^2)$.", 0);
    }
    if (level === 2) {
      const a = nz(G, -4, 5), b = G.int(-3, 3), c = G.int(-5, 5);
      const ka = (Math.abs(a) === 1 ? "" : Math.abs(a)) + "kx";
      const rest = (b ? " " + G.term(b, 0) + "x" : "") + (c ? " " + G.term(c, 0) : "");
      return num("Alle Graphen der Schar $f_k(x) = kx^2 " + (a > 0 ? "- " : "+ ") + ka + rest + "$ gehen durch zwei gemeinsame Punkte; einer liegt bei $x = 0$. Bestimme die **y-Koordinate** des anderen.", a * b + c,
        "Nach $k$ sortieren: $f_k(x) = k \\cdot x(" + poly([1, -a]) + ")" + rest + "$. Der Wert hängt nicht von $k$ ab, wo $x(" + poly([1, -a]) + ") = 0$ ist: bei $x = 0$ und $x = " + a + "$. Dort ist $f_k(" + a + ") = " + (a * b + c) + "$ für jedes $k$.", 0);
    }
    if (level === 3) {
      const m = nz(G, -4, 5);
      return num("Die Tiefpunkte der Schar $f_k(x) = x^2 - 2kx " + G.term(m, 0) + "k$ liegen auf der Ortskurve $y = -x^2 + cx$. Bestimme $c$.", m,
        "$f_k'(x) = 2x - 2k = 0$ bei $x = k$; $y = k^2 - 2k^2 " + G.term(m, 0) + "k = -k^2 " + G.term(m, 0) + "k$. Mit $k = x$ folgt $y = -x^2 " + G.term(m, 0) + "x$, also $c = " + m + "$.", 0);
    }
    const s = G.int(1, 6), q = s * s;
    return num("Für welches $k > 0$ liegt der Tiefpunkt von $f_k(x) = x^2 - 2kx + " + q + "$ auf der x-Achse?", s,
      "Tiefpunkt bei $x = k$ mit $y = k^2 - 2k^2 + " + q + " = " + q + " - k^2$. Aus $" + q + " - k^2 = 0$ folgt $k = " + s + "$.", 0);
  });
  spec("oekonomie", (level, G) => {
    if (level <= 1) {
      const a = G.pick([1, 2]), b = G.int(2, 10), F = G.int(10, 60), x0 = G.int(2, 10);
      return num("Die Kosten sind $K(x) = " + poly([a, b, F]) + "$ (in GE, $x$ in ME). Berechne die Grenzkosten bei $x = " + x0 + "$.", 2 * a * x0 + b,
        "Grenzkosten sind die Ableitung: $K'(x) = " + poly([2 * a, b]) + "$, also $K'(" + x0 + ") = " + (2 * a * x0 + b) + "$ GE pro ME. So viel kostet ungefähr die nächste Mengeneinheit.", 0);
    }
    if (level === 2) {
      const a = G.pick([1, 2]), b = G.int(2, 8), xs = G.int(3, 10), p = 2 * a * xs + b, F = G.int(5, 40);
      return num("Ein Betrieb verkauft zum Preis von $" + p + "$ GE pro ME; die Kosten sind $K(x) = " + poly([a, b, F]) + "$. Bei welcher Menge ist der Gewinn am größten?", xs,
        "$G(x) = " + p + "x - (" + poly([a, b, F]) + ") = " + poly([-a, p - b, -F]) + "$. $G'(x) = " + poly([-2 * a, p - b]) + " = 0$ bei $x = " + xs + "$; $G'' = " + (-2 * a) + " < 0$: Maximum.", 0);
    }
    if (level === 3) {
      const r1 = G.int(1, 5), r2 = r1 + G.int(3, 9), p = G.int(r1 + r2 + 2, r1 + r2 + 12), b = p - r1 - r2, F = r1 * r2;
      return num("Erlös $E(x) = " + p + "x$, Kosten $K(x) = " + poly([1, b, F]) + "$. Ab welcher Menge macht der Betrieb Gewinn (Gewinnschwelle)?", r1,
        "$G(x) = E(x) - K(x) = " + poly([-1, r1 + r2, -F]) + " = -(x - " + r1 + ")(x - " + r2 + ")$. Gewinn gibt es zwischen den Nullstellen: Gewinnschwelle bei $" + r1 + "$ ME, Gewinngrenze bei $" + r2 + "$ ME.", 0);
    }
    const m = G.int(2, 6), n = m * m + G.int(1, 12), F = G.int(10, 80);
    return num("Die Kosten sind $K(x) = x^3 - " + 2 * m + "x^2 + " + n + "x + " + F + "$. Bestimme die kurzfristige Preisuntergrenze, das Minimum der variablen Stückkosten.", n - m * m,
      "Variable Stückkosten: $k_v(x) = \\tfrac{K(x) - " + F + "}{x} = x^2 - " + 2 * m + "x + " + n + "$. $k_v'(x) = 2x - " + 2 * m + " = 0$ bei $x = " + m + "$ (Betriebsminimum), $k_v(" + m + ") = " + (n - m * m) + "$ GE pro ME.", 0);
  });

  // ---------------------------------------------------------------- integral calculus (Mathematik wave)
  spec("stammfunktion", (level, G) => {
    const ask = (f) => "Welche Funktion ist eine Stammfunktion von $f(x) = " + f + "$?";
    if (level <= 1) {
      const n = G.int(1, 4), c = G.pick([1, 2, 3, -1, -2]), a = c * (n + 1), b = G.int(-5, 5);
      const fc = new Array(n + 1).fill(0), Fc = new Array(n + 2).fill(0), noDiv = new Array(n + 2).fill(0), noX = new Array(n + 2).fill(0);
      fc[0] = a; fc[n] = b; Fc[0] = c; Fc[n] = b; noDiv[0] = a; noDiv[n] = b; noX[0] = c; noX[n + 1] = b;
      return choice(G, ask(poly(fc)), "$F(x) = " + poly(Fc) + " + C$",
        [{ md: "$F(x) = " + poly(der(fc)) + " + C$", why: "Das ist die Ableitung, nicht die Stammfunktion." },
          { md: "$F(x) = " + poly(noDiv) + " + C$", why: "Nach dem Erhöhen des Exponenten muss man durch den neuen Exponenten teilen." },
          { md: "$F(x) = " + poly(noX) + " + C$", why: "Auch die Konstante wird integriert: $\\int " + b + "\\,dx = " + b + "x$." }],
        "Potenzregel rückwärts: $\\int x^n\\,dx = \\tfrac{x^{n+1}}{n+1}$. Probe durch Ableiten: $F'(x) = " + poly(fc) + "$.");
    }
    if (level === 2) {
      const k = G.pick([2, 3, 4, -2, -3]), form = G.int(0, 2), inv = G.frac(1, k), ninv = G.frac(-1, k);
      if (form === 0) return choice(G, ask("e^{" + k + "x}"), "$F(x) = " + inv + "e^{" + k + "x} + C$",
        [{ md: "$F(x) = " + k + "e^{" + k + "x} + C$", why: "Mit k multiplizieren gehört zum Ableiten; beim Integrieren teilt man durch k." }, { md: "$F(x) = e^{" + k + "x} + C$" }, { md: "$F(x) = " + inv + "e^{x} + C$" }],
        "Probe: $\\left(" + inv + "e^{" + k + "x}\\right)' = " + inv + " \\cdot " + par(k) + " e^{" + k + "x} = e^{" + k + "x}$.");
      if (form === 1) return choice(G, ask("\\sin(" + k + "x)"), "$F(x) = " + ninv + "\\cos(" + k + "x) + C$",
        [{ md: "$F(x) = " + inv + "\\cos(" + k + "x) + C$", why: "Vorzeichen: Die Ableitung von cos ist −sin." }, { md: "$F(x) = " + (-k) + "\\cos(" + k + "x) + C$" }, { md: "$F(x) = -\\cos(" + k + "x) + C$", why: "Die innere Ableitung " + k + " muss durch Teilen ausgeglichen werden." }],
        "Probe: $\\left(" + ninv + "\\cos(" + k + "x)\\right)' = " + ninv + " \\cdot (-\\sin(" + k + "x)) \\cdot " + par(k) + " = \\sin(" + k + "x)$.");
      return choice(G, ask("\\cos(" + k + "x)"), "$F(x) = " + inv + "\\sin(" + k + "x) + C$",
        [{ md: "$F(x) = " + ninv + "\\sin(" + k + "x) + C$", why: "Die Ableitung von sin ist +cos, kein Minus." }, { md: "$F(x) = " + k + "\\sin(" + k + "x) + C$" }, { md: "$F(x) = \\sin(" + k + "x) + C$", why: "Die innere Ableitung fehlt im Ausgleich." }],
        "Probe: $\\left(" + inv + "\\sin(" + k + "x)\\right)' = " + inv + " \\cdot \\cos(" + k + "x) \\cdot " + par(k) + " = \\cos(" + k + "x)$.");
    }
    if (level === 3) {
      const a = G.pick([2, 3, -1, 4]), b = nz(G, -5, 5), lin = poly([a, b]);
      if (G.chance(0.5)) {
        const n = G.int(2, 4);
        return choice(G, ask("(" + lin + ")^{" + n + "}"), "$F(x) = " + G.frac(1, a * (n + 1)) + "(" + lin + ")^{" + (n + 1) + "} + C$",
          [{ md: "$F(x) = " + G.frac(1, n + 1) + "(" + lin + ")^{" + (n + 1) + "} + C$", why: "Beim Ableiten käme der innere Faktor " + a + " dazu; er muss durch Teilen ausgeglichen werden." },
            { md: "$F(x) = " + n * a + "(" + lin + ")^{" + (n - 1) + "} + C$", why: "Das ist die Ableitung." }, { md: "$F(x) = " + G.frac(a, n + 1) + "(" + lin + ")^{" + (n + 1) + "} + C$" }],
          "Lineare Substitution: $\\int f(ax + b)\\,dx = \\tfrac1a F(ax + b)$. Hier $\\tfrac{1}{" + a + "} \\cdot \\tfrac{(" + lin + ")^{" + (n + 1) + "}}{" + (n + 1) + "}$.");
      }
      return choice(G, ask("\\dfrac{1}{" + lin + "}"), "$F(x) = " + G.frac(1, a) + "\\ln|" + lin + "| + C$",
        [{ md: "$F(x) = \\ln|" + lin + "| + C$", why: "Ableiten ergäbe den Faktor " + a + "; er muss ausgeglichen werden." }, { md: "$F(x) = " + a + "\\ln|" + lin + "| + C$" },
          { md: "$F(x) = -\\dfrac{1}{(" + lin + ")^2} + C$", why: "Das ist eine Ableitung, keine Stammfunktion." }],
        "$\\int \\tfrac{1}{ax + b}\\,dx = \\tfrac1a\\ln|ax + b| + C$; Probe durch Ableiten mit der Kettenregel.");
    }
    const form = G.int(0, 2);
    if (form === 0) {
      const k = G.pick([1, 2, -1]), b = G.pick([1, 2]), v = (Math.exp(k * b) - 1) / k;
      return num("Berechne $\\displaystyle\\int_0^{" + b + "} e^{" + (k === 1 ? "" : k === -1 ? "-" : k) + "x}\\,dx$ (drei Nachkommastellen).", v,
        "Stammfunktion $" + G.frac(1, k) + "e^{" + (k === 1 ? "" : k === -1 ? "-" : k) + "x}$: $" + G.frac(1, k) + "\\left(e^{" + k * b + "} - 1\\right) \\approx " + G.tex(v, 3) + "$.", 0.002);
    }
    if (form === 1) {
      const c = G.pick([2, 3, 5]), m = G.pick([1, 2, 3]);
      return num("Berechne $\\displaystyle\\int_1^{e^{" + m + "}} \\frac{" + c + "}{x}\\,dx$.", c * m,
        "$\\left[" + c + "\\ln x\\right]_1^{e^{" + m + "}} = " + c + " \\cdot " + m + " - " + c + " \\cdot 0 = " + c * m + "$.", 0.001);
    }
    const k = G.pick([1, 2, 3]);
    return num("Berechne $\\displaystyle\\int_0^{" + (k === 1 ? "\\pi" : "\\pi/" + k) + "} \\sin(" + (k === 1 ? "" : k) + "x)\\,dx$ (drei Nachkommastellen).", 2 / k,
      "$\\left[-" + (k === 1 ? "" : "\\tfrac{1}{" + k + "}") + "\\cos(" + (k === 1 ? "" : k) + "x)\\right]_0^{" + (k === 1 ? "\\pi" : "\\pi/" + k) + "} = " + (k === 1 ? "" : "\\tfrac{1}{" + k + "}") + "(1 - (-1)) = " + G.tex(2 / k, 3) + "$: ein Bogen der Sinuskurve.", 0.002);
  });
  spec("bestand", (level, G) => {
    if (level <= 1) {
      const a = 2 * G.int(1, 4), b = G.int(0, 8), B0 = G.int(5, 60), T = G.int(2, 8);
      const v = B0 + (a * T * T) / 2 + b * T;
      return num("Wasser fließt mit der Rate $r(t) = " + poly([a, b], "t") + "$ (Liter pro Minute) in ein Becken, in dem anfangs $" + B0 + "$ Liter sind. Wie viele Liter sind nach $" + T + "$ Minuten im Becken?", v,
        "$B(" + T + ") = " + B0 + " + \\int_0^{" + T + "} (" + poly([a, b], "t") + ")\\,dt = " + B0 + " + \\left[" + poly([a / 2, b, 0], "t") + "\\right]_0^{" + T + "} = " + v + "$ Liter.", 0.01, "L");
    }
    if (level === 2) {
      const p = G.pick([3, 6]), B0 = G.int(5, 40), v = B0 + (p * p * p) / 6;
      return num("Die Zuflussrate ist $r(t) = " + poly([-1, p, 0], "t") + "$ (m³ pro Stunde), anfangs sind $" + B0 + "$ m³ im Speicher. Wie viel ist nach $" + p + "$ Stunden im Speicher?", v,
        "$B(" + p + ") = " + B0 + " + \\left[-\\tfrac{t^3}{3} + " + G.frac(p, 2) + "t^2\\right]_0^{" + p + "} = " + B0 + " + " + G.tex((p * p * p) / 6, 2) + " = " + G.tex(v, 2) + "$ m³.", 0.01, "m³");
    }
    if (level === 3) {
      const r1 = G.int(1, 4), r2 = r1 + G.int(2, 6);
      return num("Die Änderungsrate eines Bestands ist $r(t) = " + poly([-1, r1 + r2, -r1 * r2], "t") + "$. Zu welchem Zeitpunkt hat der Bestand ein lokales Maximum?", r2,
        "$r(t) = -(t - " + r1 + ")(t - " + r2 + ")$ ist zwischen " + r1 + " und " + r2 + " positiv und danach negativ. Bei $t = " + r2 + "$ wechselt $r$ von $+$ nach $-$: Der Bestand hört auf zu wachsen, ein lokales Maximum.", 0);
    }
    const p = G.pick([2, 4, 6]);
    return num("Ein Bestand ändert sich mit der Rate $r(t) = " + poly([-1, p, 0], "t") + "$. Zu welchem Zeitpunkt $T > 0$ ist er wieder genauso groß wie bei $t = 0$?", (3 * p) / 2,
      "Gesucht ist $\\int_0^T r(t)\\,dt = 0$: $-\\tfrac{T^3}{3} + " + G.frac(p, 2) + "T^2 = T^2\\left(" + G.frac(p, 2) + " - \\tfrac{T}{3}\\right) = 0$, also $T = " + G.tex((3 * p) / 2, 1) + "$. Erst wächst der Bestand, dann schrumpft er um genau so viel.", 0);
  });

  // ---------------------------------------------------------------- analytic geometry (Mathematik wave)
  const pk = (v) => "(" + v.map(tnum).join(" \\mid ") + ")";
  const nzv = (G, k) => [nz(G, -k, k), nz(G, -k, k), nz(G, -k, k)];
  const add = (a, b, t) => a.map((c, i) => c + (t == null ? 1 : t) * b[i]);
  const XN = ["x_1", "x_2", "x_3"];
  const coordForm = (n, d) => {
    let s = "";
    n.forEach((c, i) => { if (!c) return; const a = Math.abs(c); s += (s ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "") + (a === 1 ? "" : tnum(a)) + XN[i]; });
    return (s || "0") + " = " + tnum(d);
  };
  spec("geradenpunkt", (level, G) => {
    const p = rv(G, 4), u = nzv(G, 3);
    const g = "g: \\vec x = " + vec(p) + " + s" + vec(u);
    if (level <= 1) {
      const s = nz(G, -3, 3), P = add(p, u, s);
      return num("Der Punkt $P" + pk(P) + "$ liegt auf $" + g + "$. Für welchen Parameter $s$?", s,
        "Punktprobe: $" + pk(P).replace(/[()]/g, "") + "$ komponentenweise: $" + P[0] + " = " + p[0] + " + s \\cdot " + par(u[0]) + "$ gibt $s = " + s + "$; die anderen Zeilen liefern dasselbe.", 0);
    }
    if (level === 2) {
      const s = nz(G, -3, 3), P = add(p, u, s), on = G.chance(0.5);
      if (!on) P[G.int(0, 2)] += G.pick([1, -1, 2]);
      return choice(G, "Liegt $P" + pk(P) + "$ auf $" + g + "$?", on ? "ja, für $s = " + s + "$" : "nein",
        on ? ["nein", "ja, für $s = " + (s + 1) + "$", "nur, wenn man $s$ negativ wählt"].map((w) => ({ md: w })) : ["ja, für $s = " + s + "$", "ja, für $s = 0$", "das lässt sich nicht entscheiden"].map((w) => ({ md: w })),
        on ? "Alle drei Zeilen der Punktprobe liefern $s = " + s + "$." : "Die drei Zeilen der Punktprobe liefern nicht alle dasselbe $s$: Der Punkt liegt nicht auf der Geraden.");
    }
    const S = [G.int(-4, 4), G.int(-4, 4), 0], w = [nz(G, -2, 2), nz(G, -2, 2), nz(G, -3, 3)], k = G.int(1, 2), m = G.int(1, 3);
    const A = add(S, w, -k), B = add(S, w, m);
    if (level === 3) return num("Die Gerade durch $A" + pk(A) + "$ und $B" + pk(B) + "$ durchstößt die $x_1x_2$-Ebene. Bestimme die $x_1$-Koordinate dieses Spurpunkts.", S[0],
      "$g: \\vec x = " + vec(A) + " + s" + vec(add(B, A, -1)) + "$. Aus $x_3 = 0$ folgt $s = " + G.frac(k, k + m) + "$, eingesetzt $S" + pk(S) + "$.", 0);
    return num("Die Gerade durch $A" + pk(A) + "$ und $B" + pk(B) + "$ durchstößt die $x_1x_2$-Ebene. Bestimme die $x_2$-Koordinate dieses Spurpunkts.", S[1],
      "Richtungsvektor $\\overrightarrow{AB} = " + vec(add(B, A, -1)) + "$. $x_3 = 0$ gibt $s = " + G.frac(k, k + m) + "$, also $S" + pk(S) + "$.", 0);
  });
  spec("ebenenform", (level, G) => {
    if (level <= 1) {
      const n = nzv(G, 4), P = rv(G, 4), d = dot(n, P);
      return num("Eine Ebene hat den Normalenvektor $\\vec n = " + vec(n) + "$ und enthält $P" + pk(P) + "$. Bestimme $d$ in der Koordinatenform $" + coordForm(n, 0).replace("= 0", "= d") + "$.", d,
        "$d = \\vec n \\cdot \\vec p = " + n.map((c, i) => par(c) + " \\cdot " + par(P[i])).join(" + ") + " = " + d + "$.", 0);
    }
    if (level === 2) {
      const c = G.pick([1, 2, 3, 4, 6, -2, -3]), x3 = nz(G, -4, 5), d = c * x3, a = nz(G, -4, 4), b = nz(G, -4, 4);
      return num("Wo schneidet $E: " + coordForm([a, b, c], d) + "$ die $x_3$-Achse? Gib $x_3$ an.", x3,
        "Auf der $x_3$-Achse ist $x_1 = x_2 = 0$: $" + c + "x_3 = " + d + "$, also $x_3 = " + x3 + "$. Ebenso findet man die anderen Spurpunkte.", 0);
    }
    let u, v, n;
    do { u = rv(G, 3); v = rv(G, 3); n = cross(u, v); } while (n.every((x) => x === 0));
    const P = rv(G, 4);
    if (level === 3) {
      return num("$E: \\vec x = " + vec(P) + " + r" + vec(u) + " + s" + vec(v) + "$. Mit $\\vec n = \\vec u \\times \\vec v$ lautet die Koordinatenform $\\vec n \\cdot \\vec x = d$. Bestimme $d$.", dot(n, P),
        "$\\vec n = " + vec(u) + " \\times " + vec(v) + " = " + vec(n) + "$, $d = \\vec n \\cdot \\vec p = " + dot(n, P) + "$. Koordinatenform: $" + coordForm(n, dot(n, P)) + "$.", 0);
    }
    const A = P, B = add(P, u), C = add(P, v);
    return num("Die Ebene durch $A" + pk(A) + "$, $B" + pk(B) + "$ und $C" + pk(C) + "$ hat mit $\\vec n = \\overrightarrow{AB} \\times \\overrightarrow{AC}$ die Koordinatenform $\\vec n \\cdot \\vec x = d$. Bestimme $d$.", dot(n, P),
      "$\\overrightarrow{AB} = " + vec(u) + "$, $\\overrightarrow{AC} = " + vec(v) + "$, $\\vec n = " + vec(n) + "$, $d = \\vec n \\cdot \\vec a = " + dot(n, P) + "$.", 0);
  });
  spec("durchstoss", (level, G) => {
    const p = rv(G, 4), s0 = nz(G, -3, 3);
    if (level <= 1) {
      const u = [nz(G, -3, 3), nz(G, -3, 3), nz(G, -3, 3)], c = p[2] + s0 * u[2];
      return num("Für welchen Parameter $s$ durchstößt $g: \\vec x = " + vec(p) + " + s" + vec(u) + "$ die Ebene $E: x_3 = " + c + "$?", s0,
        "Die dritte Zeile: $" + p[2] + " + s \\cdot " + par(u[2]) + " = " + c + "$, also $s = " + s0 + "$.", 0);
    }
    let n, u;
    do { n = rv(G, 3); u = rv(G, 3); } while (dot(n, u) === 0 || n.every((x) => x === 0));
    const S = add(p, u, s0), d = dot(n, S);
    if (level === 2) return num("Bestimme die $x_1$-Koordinate des Schnittpunkts von $g: \\vec x = " + vec(p) + " + s" + vec(u) + "$ mit $E: " + coordForm(n, d) + "$.", S[0],
      "Zeilen von $g$ in $E$ einsetzen: $" + dot(n, p) + " + " + par(dot(n, u)) + "s = " + d + "$, also $s = " + s0 + "$. Schnittpunkt $S" + pk(S) + "$.", 0);
    if (level === 3) {
      const kind = G.int(0, 2);
      let uu = u, pp = p, dd = d;
      if (kind > 0) {
        // direction parallel to the plane: replace u by a vector orthogonal to n
        uu = cross(n, [1, 0, 0]); if (uu.every((x) => x === 0)) uu = cross(n, [0, 1, 0]);
        dd = kind === 2 ? dot(n, pp) : dot(n, pp) + G.pick([1, 2, -3]);
      }
      const right = kind === 0 ? "Sie schneiden sich in einem Punkt." : kind === 1 ? "Die Gerade ist echt parallel zur Ebene." : "Die Gerade liegt in der Ebene.";
      const all = ["Sie schneiden sich in einem Punkt.", "Die Gerade ist echt parallel zur Ebene.", "Die Gerade liegt in der Ebene.", "Die Gerade steht senkrecht auf der Ebene."];
      return choice(G, "Wie liegen $g: \\vec x = " + vec(pp) + " + s" + vec(uu) + "$ und $E: " + coordForm(n, dd) + "$ zueinander?", right, all.filter((w) => w !== right).map((w) => ({ md: w })),
        "$\\vec n \\cdot \\vec u = " + dot(n, uu) + "$. " + (kind === 0 ? "Ungleich null: Die Gerade schneidet die Ebene." : "Null: Die Gerade ist parallel; die Punktprobe mit dem Stützpunkt ergibt " + dot(n, pp) + (kind === 2 ? " = " : " \\neq ") + dd + ", also " + (kind === 2 ? "liegt sie in der Ebene." : "echt parallel.")));
    }
    const n2 = G.pick([1, -1]), n1 = nz(G, -3, 3), n3 = nz(G, -3, 3), u1 = nz(G, -3, 3), u3 = nz(G, -3, 3);
    const a = -(n1 * u1 + n3 * u3) / n2;
    return num("Für welches $a$ ist die Gerade mit dem Richtungsvektor $\\begin{pmatrix} " + u1 + " \\\\ a \\\\ " + u3 + " \\end{pmatrix}$ parallel zur Ebene $E: " + coordForm([n1, n2, n3], 5) + "$?", a,
      "Parallel heißt $\\vec n \\cdot \\vec u = 0$: $" + par(n1) + " \\cdot " + par(u1) + " + " + par(n2) + "a + " + par(n3) + " \\cdot " + par(u3) + " = 0$, also $a = " + a + "$.", 0);
  });
  spec("spiegelpunkt", (level, G) => {
    if (level <= 1) {
      const c = G.int(-3, 4), P = rv(G, 5);
      return num("Spiegle $P" + pk(P) + "$ an der Ebene $x_3 = " + c + "$. Welche $x_3$-Koordinate hat der Bildpunkt?", 2 * c - P[2],
        "Der Lotfußpunkt hat $x_3 = " + c + "$; der Bildpunkt liegt genauso weit auf der anderen Seite: $2 \\cdot " + par(c) + " - " + par(P[2]) + " = " + (2 * c - P[2]) + "$.", 0);
    }
    if (level === 3) {
      const q = rv(G, 3), u = nzv(G, 2), F = add(q, u, nz(G, -2, 2));
      let w = cross(u, [0, 0, 1]); if (w.every((x) => x === 0)) w = cross(u, [1, 0, 0]);
      const P = add(F, w), P2 = add(F, w, -1);
      return num("Spiegle $P" + pk(P) + "$ an der Geraden $g: \\vec x = " + vec(q) + " + s" + vec(u) + "$. Welche $x_1$-Koordinate hat der Bildpunkt?", P2[0],
        "Lotfußpunkt $F$ aus $\\overrightarrow{FP} \\cdot \\vec u = 0$: $F" + pk(F) + "$. Bildpunkt $P' = P + 2\\overrightarrow{PF} = " + pk(P2) + "$.", 0);
    }
    const F = rv(G, 3), n = nzv(G, 2), t = G.pick([1, 2, -1]), d = dot(n, F), P = add(F, n, t), P2 = add(F, n, -t);
    const k = level === 2 ? 0 : 2;
    return num("Spiegle $P" + pk(P) + "$ an der Ebene $E: " + coordForm(n, d) + "$. Welche $" + XN[k] + "$-Koordinate hat der Bildpunkt?", P2[k],
      "Lotgerade $\\vec x = \\vec p + t\\,\\vec n$ schneidet $E$ bei $t = " + (-t) + "$: Lotfußpunkt $F" + pk(F) + "$. Bildpunkt $P' = P + 2\\overrightarrow{PF} = " + pk(P2) + "$.", 0);
  });
  spec("teilpunkt", (level, G) => {
    const A = rv(G, 5);
    if (level <= 1) {
      const B = add(A, [2 * G.int(-3, 3), 2 * G.int(-3, 3), 2 * G.int(-3, 3)]), M = A.map((c, i) => (c + B[i]) / 2), k = G.int(0, 2);
      return num("Bestimme die $" + XN[k] + "$-Koordinate des Mittelpunkts von $A" + pk(A) + "$ und $B" + pk(B) + "$.", M[k],
        "$\\vec m = \\tfrac12(\\vec a + \\vec b) = " + vec(M) + "$.", 0);
    }
    if (level === 2) {
      const m = G.int(1, 3), nn = G.int(1, 3), w = [nz(G, -2, 2), nz(G, -2, 2), nz(G, -2, 2)].map((c) => c * (m + nn)), B = add(A, w), T = add(A, w, m / (m + nn)), k = G.int(0, 2);
      return num("$T$ teilt die Strecke von $A" + pk(A) + "$ nach $B" + pk(B) + "$ im Verhältnis $" + m + " : " + nn + "$. Bestimme die $" + XN[k] + "$-Koordinate von $T$.", T[k],
        "$\\vec t = \\vec a + \\tfrac{" + m + "}{" + (m + nn) + "}\\overrightarrow{AB} = " + vec(A) + " + \\tfrac{" + m + "}{" + (m + nn) + "}" + vec(w) + " = " + vec(T) + "$.", 0);
    }
    if (level === 3) {
      const B = rv(G, 5), C = rv(G, 5), S = A.map((c, i) => (c + B[i] + C[i]) / 3), k = G.int(0, 2);
      return num("Bestimme die $" + XN[k] + "$-Koordinate des Schwerpunkts des Dreiecks mit $A" + pk(A) + "$, $B" + pk(B) + "$, $C" + pk(C) + "$ (zwei Nachkommastellen).", S[k],
        "$\\vec s = \\tfrac13(\\vec a + \\vec b + \\vec c) = " + vec(S.map((c) => +c.toFixed(3))) + "$. Der Schwerpunkt teilt jede Seitenhalbierende im Verhältnis $2 : 1$.", 0.01);
    }
    const w = [2 * nz(G, -2, 2), 2 * nz(G, -2, 2), 2 * nz(G, -2, 2)], T = add(A, w), B = add(A, w, 2.5), k = G.int(0, 2);
    return num("$T" + pk(T) + "$ teilt die Strecke von $A" + pk(A) + "$ nach $B$ im Verhältnis $2 : 3$. Bestimme die $" + XN[k] + "$-Koordinate von $B$.", B[k],
      "$\\overrightarrow{AT}$ ist $\\tfrac25$ von $\\overrightarrow{AB}$, also $\\overrightarrow{AB} = \\tfrac52\\overrightarrow{AT} = \\tfrac52" + vec(w) + "$ und $B" + pk(B) + "$.", 0);
  });
  spec("schatten", (level, G) => {
    if (level <= 2) {
      const u3 = G.pick([-1, -2, -3]), t = G.int(1, 4), h = -u3 * t, u = [nz(G, -3, 3), nz(G, -3, 3), u3], S = [G.int(-3, 3), G.int(-3, 3), h], Sh = add(S, u, t), k = level - 1;
      return num("Sonnenlicht fällt in Richtung $" + vec(u) + "$. Wo trifft der Schatten der Mastspitze $S" + pk(S) + "$ den Boden $x_3 = 0$? Gib die $" + XN[k] + "$-Koordinate an.", Sh[k],
        "Lichtstrahl $\\vec x = " + vec(S) + " + t" + vec(u) + "$; $x_3 = " + h + " " + G.term(u3, 0) + "t = 0$ gibt $t = " + t + "$, Schattenpunkt $" + pk(Sh) + "$.", 0);
    }
    if (level === 3) {
      const k = G.pick([2, 3]), s3 = k === 2 ? G.int(1, 4) : 2 * G.int(1, 2), l3 = (k * s3) / (k - 1), L = [G.int(-3, 3), G.int(-3, 3), l3], S = [G.int(-3, 3), G.int(-3, 3), s3], Sh = add(L, add(S, L, -1), k);
      return num("Eine Lampe hängt in $L" + pk(L) + "$. Wo trifft der Schatten von $S" + pk(S) + "$ den Boden $x_3 = 0$? Gib die $x_1$-Koordinate an.", Sh[0],
        "Strahl von der Lampe durch $S$: $\\vec x = \\vec l + t(\\vec s - \\vec l)$. $x_3 = " + tnum(l3) + " + t \\cdot " + par(s3 - l3) + " = 0$ gibt $t = " + k + "$, Schattenpunkt $" + pk(Sh) + "$.", 0);
    }
    const u = [nz(G, -3, 3), nz(G, -3, 3), G.pick([-1, -2])], h = G.int(2, 8), len = (h * Math.hypot(u[0], u[1])) / Math.abs(u[2]);
    return num("Ein senkrechter Mast der Höhe $" + h + "$ steht im Ursprung. Sonnenlicht fällt in Richtung $" + vec(u) + "$. Wie lang ist sein Schatten auf dem Boden? (zwei Nachkommastellen)", len,
      "Schatten der Spitze: $t = \\tfrac{" + h + "}{" + Math.abs(u[2]) + "}$, Schattenpunkt $(" + G.tex((h * u[0]) / Math.abs(u[2]), 2) + " \\mid " + G.tex((h * u[1]) / Math.abs(u[2]), 2) + " \\mid 0)$. Länge $= \\sqrt{x_1^2 + x_2^2} \\approx " + G.tex(len, 2) + "$.", 0.01);
  });
  spec("linkombi", (level, G) => {
    const a = nz(G, -3, 3), b = nz(G, -3, 3);
    if (level <= 1) {
      const u = [1, 0, nz(G, -3, 3)], w = [0, 1, nz(G, -3, 3)], v = add(u.map((c) => a * c), w, b);
      return num("Schreibe $\\vec v = " + vec(v) + "$ als $r\\,\\vec u + s\\,\\vec w$ mit $\\vec u = " + vec(u) + "$ und $\\vec w = " + vec(w) + "$. Bestimme $r$.", a,
        "Erste Zeile: $r \\cdot 1 + s \\cdot 0 = " + v[0] + "$, also $r = " + a + "$; zweite Zeile $s = " + b + "$; die dritte bestätigt: $" + par(a) + " \\cdot " + par(u[2]) + " + " + par(b) + " \\cdot " + par(w[2]) + " = " + v[2] + "$.", 0);
    }
    let u, w;
    do { u = rv(G, 3); w = rv(G, 3); } while (cross(u, w).every((x) => x === 0) || (level === 3 && u[0] * w[1] - u[1] * w[0] === 0));
    if (level === 2) {
      const v = add(u.map((c) => a * c), w, b);
      return num("Schreibe $\\vec v = " + vec(v) + "$ als $r\\,\\vec u + s\\,\\vec w$ mit $\\vec u = " + vec(u) + "$ und $\\vec w = " + vec(w) + "$. Bestimme $r$.", a,
        "Gleichungssystem aus den drei Zeilen; zwei Zeilen bestimmen $r = " + a + "$ und $s = " + b + "$, die dritte dient als Probe.", 0);
    }
    if (level === 3) {
      const t = a * u[2] + b * w[2], x = [a * u[0] + b * w[0], a * u[1] + b * w[1]];
      return num("Für welches $t$ sind $\\vec u = " + vec(u) + "$, $\\vec w = " + vec(w) + "$ und $\\vec x = \\begin{pmatrix} " + tnum(x[0]) + " \\\\ " + tnum(x[1]) + " \\\\ t \\end{pmatrix}$ linear abhängig?", t,
        "Abhängig heißt hier: $\\vec x = r\\,\\vec u + s\\,\\vec w$. Die ersten zwei Zeilen liefern $r = " + a + "$, $s = " + b + "$; die dritte gibt $t = " + par(a) + " \\cdot " + par(u[2]) + " + " + par(b) + " \\cdot " + par(w[2]) + " = " + t + "$. Ebenso: Spatprodukt gleich null.", 0);
    }
    let x;
    do { x = rv(G, 2); } while (Math.abs(dot(cross(u, w), x)) < 1);
    const c = nz(G, -2, 2), v = add(add(u.map((q) => a * q), w, b), x, c);
    return num("Schreibe $\\vec v = " + vec(v) + "$ als $r\\,\\vec u + s\\,\\vec w + t\\,\\vec x$ mit $\\vec u = " + vec(u) + "$, $\\vec w = " + vec(w) + "$, $\\vec x = " + vec(x) + "$. Bestimme $t$.", c,
      "Lineares Gleichungssystem mit drei Unbekannten (Gauß): $r = " + a + "$, $s = " + b + "$, $t = " + c + "$. Probe durch Einsetzen.", 0);
  });

  // ---------------------------------------------------------------- matrices and processes (Mathematik wave)
  const mtex = (M) => "\\begin{pmatrix} " + M.map((r) => r.map(tnum).join(" & ")).join(" \\\\ ") + " \\end{pmatrix}";
  const mmul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const mvec = (A, v) => A.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));
  const rint = (G, k, rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => G.int(-k, k)));
  spec("matrixpotenz", (level, G) => {
    if (level <= 1) {
      const M = rint(G, 3, 2, 2), M2 = mmul(M, M), i = G.int(0, 1), j = G.int(0, 1);
      return num("$M = " + mtex(M) + "$. Berechne den Eintrag in Zeile " + (i + 1) + ", Spalte " + (j + 1) + " von $M^2$.", M2[i][j],
        "$M^2 = M \\cdot M$: Zeile " + (i + 1) + " mal Spalte " + (j + 1) + " ergibt $" + M[i].map((x, k) => par(x) + " \\cdot " + par(M[k][j])).join(" + ") + " = " + M2[i][j] + "$. Nicht die Einträge einzeln quadrieren.", 0);
    }
    if (level === 2) {
      const M = rint(G, 2, 2, 2), v = [G.int(-3, 3), G.int(-3, 3)], v1 = mvec(M, v), v2 = mvec(M, v1);
      return num("$M = " + mtex(M) + "$ und $\\vec v_0 = " + vec(v) + "$. Berechne die erste Koordinate von $\\vec v_2 = M^2\\vec v_0$.", v2[0],
        "Schrittweise: $\\vec v_1 = M\\vec v_0 = " + vec(v1) + "$, $\\vec v_2 = M\\vec v_1 = " + vec(v2) + "$.", 0);
    }
    if (level === 3) {
      const a = G.pick([0.9, 0.8, 0.7, 0.6]), b = G.pick([0.1, 0.2, 0.3, 0.4]), M = [[a, b], [+(1 - a).toFixed(2), +(1 - b).toFixed(2)]], v = [100, 0];
      const v1 = mvec(M, v), v2 = mvec(M, v1);
      return num("Übergangsmatrix $M = " + mtex(M) + "$, Startverteilung $\\vec v_0 = " + vec(v) + "$. Wie viele sind nach zwei Schritten im ersten Zustand?", v2[0],
        "$\\vec v_1 = M\\vec v_0 = " + vec(v1.map((x) => +x.toFixed(2))) + "$, $\\vec v_2 = M\\vec v_1 = " + vec(v2.map((x) => +x.toFixed(2))) + "$.", 0.01);
    }
    const k = nz(G, -3, 3), n = G.int(3, 9);
    return num("$M = " + mtex([[1, k], [0, 1]]) + "$. Bestimme den Eintrag oben rechts von $M^{" + n + "}$.", n * k,
      "$M^2 = " + mtex([[1, 2 * k], [0, 1]]) + "$, $M^3 = " + mtex([[1, 3 * k], [0, 1]]) + "$: Jede Multiplikation addiert $" + k + "$ oben rechts. Also $M^{" + n + "}$ hat dort $" + n + " \\cdot " + par(k) + " = " + n * k + "$.", 0);
  });
  spec("verflechtung", (level, G) => {
    if (level <= 2) {
      const n = level === 1 ? 2 : 3, A = Array.from({ length: 2 }, () => Array.from({ length: n }, () => G.int(0, 5))), B = Array.from({ length: n }, () => Array.from({ length: 2 }, () => G.int(0, 4)));
      const C = mmul(A, B), i = G.int(0, 1), j = G.int(0, 1);
      return num("Berechne den Eintrag in Zeile " + (i + 1) + ", Spalte " + (j + 1) + " von $" + mtex(A) + " \\cdot " + mtex(B) + "$.", C[i][j],
        "Zeile " + (i + 1) + " der ersten Matrix mal Spalte " + (j + 1) + " der zweiten: $" + A[i].map((x, k) => x + " \\cdot " + B[k][j]).join(" + ") + " = " + C[i][j] + "$.", 0);
    }
    const A = [[G.int(1, 4), G.int(0, 3)], [G.int(0, 3), G.int(1, 4)]], B = [[G.int(1, 3), G.int(0, 2)], [G.int(0, 2), G.int(1, 3)]], C = mmul(A, B);
    if (level === 3) {
      const x = [G.int(5, 30), G.int(5, 30)], r = mvec(C, x);
      return num("Rohstoffe pro Zwischenprodukt: $A = " + mtex(A) + "$; Zwischenprodukte pro Endprodukt: $B = " + mtex(B) + "$. Bestellt werden " + x[0] + " Stück von $E_1$ und " + x[1] + " von $E_2$. Wie viele Einheiten von Rohstoff $R_1$ werden gebraucht?", r[0],
        "Rohstoffe pro Endprodukt: $C = A \\cdot B = " + mtex(C) + "$. Bedarf $C \\cdot " + vec(x) + " = " + vec(r) + "$, also " + r[0] + " Einheiten $R_1$.", 0);
    }
    const stock = [G.int(60, 200), G.int(60, 200)], maxN = Math.min(...stock.map((s, i) => (C[i][0] > 0 ? Math.floor(s / C[i][0]) : Infinity)));
    return num("Rohstoffe pro Zwischenprodukt: $A = " + mtex(A) + "$; Zwischenprodukte pro Endprodukt: $B = " + mtex(B) + "$. Auf Lager sind " + stock[0] + " Einheiten $R_1$ und " + stock[1] + " Einheiten $R_2$. Wie viele Stück von $E_1$ lassen sich höchstens herstellen, wenn nur $E_1$ produziert wird?", maxN,
      "Rohstoffe pro Stück $E_1$: erste Spalte von $C = A \\cdot B = " + mtex(C) + "$, also " + C[0][0] + " von $R_1$ und " + C[1][0] + " von $R_2$. Der knappere Rohstoff begrenzt: $\\min\\left(\\lfloor \\tfrac{" + stock[0] + "}{" + C[0][0] + "} \\rfloor, \\lfloor \\tfrac{" + stock[1] + "}{" + C[1][0] + "} \\rfloor\\right) = " + maxN + "$.", 0);
  });

  const make = LW.rechenEngine(T);
  LW.generator("ma-rechnen", { title: "Mathematik rechnen", make });
  const chapter = (title, typ) => ({ title, make: (level, G) => make(level, G, { typ }) });
  LW.generator("ma-r-funktionen", chapter("Funktionen und Gleichungen", ["gleichung", "nullprodukt", "symmetrie", "unendlich", "umkehr", "logarithmus", "expgleichung", "definitionsbereich", "transformation", "wurzelgleichung", "verkettung", "stetigkeit", "trigwert", "additionstheorem", "restsatz", "potenz", "gebrochen"]));
  LW.generator("ma-r-differenzial", chapter("Differenzialrechnung", ["ableitung", "tangente", "normale", "extrem", "wendepunkt", "monotonie", "kruemmung", "steckbrief", "newton", "aenderungsrate", "fernpunkt", "schnittwinkel", "graphisch", "extremwertproblem", "schar", "oekonomie"]));
  LW.generator("ma-r-integral", chapter("Integralrechnung", ["integral", "flaeche", "mittelwert", "integralfunktion", "rotation", "wachstum", "stammfunktion", "bestand"]));
  LW.generator("ma-r-geometrie", chapter("Analytische Geometrie", ["skalarprodukt", "kreuzprodukt", "abstand", "lage-geraden", "winkel", "spat", "geradenpunkt", "ebenenform", "durchstoss", "spiegelpunkt", "teilpunkt", "schatten", "linkombi"]));
  LW.generator("ma-r-matrizen", chapter("Matrizen", ["matrix", "inverse", "uebergang", "matrixpotenz", "verflechtung"]));
  LW.generator("ma-r-stochastik", chapter("Abitur-Stochastik", ["poisson", "mindestens", "hypergeometrisch"]));
  LW.generator("ma-r-techniken", chapter("Rechentechniken", ["partiell", "substitution", "uneigentlich", "trapez", "polar", "geomreihe", "rotation"]));
})();
