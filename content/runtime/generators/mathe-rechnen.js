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

  const make = LW.rechenEngine(T);
  LW.generator("ma-rechnen", { title: "Mathematik rechnen", make });
  const chapter = (title, typ) => ({ title, make: (level, G) => make(level, G, { typ }) });
  LW.generator("ma-r-funktionen", chapter("Funktionen und Gleichungen", ["gleichung", "nullprodukt", "symmetrie", "unendlich", "umkehr", "logarithmus", "expgleichung", "definitionsbereich", "transformation", "wurzelgleichung", "verkettung", "stetigkeit", "trigwert", "additionstheorem", "restsatz", "potenz", "gebrochen"]));
  LW.generator("ma-r-differenzial", chapter("Differenzialrechnung", ["ableitung", "tangente", "normale", "extrem", "wendepunkt", "monotonie", "kruemmung", "steckbrief", "newton"]));
  LW.generator("ma-r-integral", chapter("Integralrechnung", ["integral", "flaeche", "mittelwert", "integralfunktion", "rotation", "wachstum"]));
  LW.generator("ma-r-geometrie", chapter("Analytische Geometrie", ["skalarprodukt", "kreuzprodukt", "abstand", "lage-geraden", "winkel", "spat"]));
  LW.generator("ma-r-matrizen", chapter("Matrizen", ["matrix", "inverse", "uebergang"]));
  LW.generator("ma-r-stochastik", chapter("Abitur-Stochastik", ["poisson", "mindestens", "hypergeometrisch"]));
  LW.generator("ma-r-techniken", chapter("Rechentechniken", ["partiell", "substitution", "uneigentlich", "trapez", "polar", "geomreihe", "rotation"]));
})();
