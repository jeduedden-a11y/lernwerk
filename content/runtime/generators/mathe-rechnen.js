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

  const make = LW.rechenEngine(T);
  LW.generator("ma-rechnen", { title: "Mathematik rechnen", make });
  const chapter = (title, typ) => ({ title, make: (level, G) => make(level, G, { typ }) });
  LW.generator("ma-r-funktionen", chapter("Funktionen und Gleichungen", ["gleichung", "nullprodukt", "symmetrie", "unendlich", "umkehr", "logarithmus", "expgleichung"]));
  LW.generator("ma-r-differenzial", chapter("Differenzialrechnung", ["ableitung", "tangente", "normale", "extrem", "wendepunkt", "monotonie", "kruemmung", "steckbrief", "newton"]));
  LW.generator("ma-r-integral", chapter("Integralrechnung", ["integral", "flaeche", "mittelwert", "integralfunktion", "rotation", "wachstum"]));
  LW.generator("ma-r-geometrie", chapter("Analytische Geometrie", ["skalarprodukt", "kreuzprodukt", "abstand", "lage-geraden", "winkel", "spat"]));
  LW.generator("ma-r-matrizen", chapter("Matrizen", ["matrix", "inverse", "uebergang"]));
  LW.generator("ma-r-stochastik", chapter("Abitur-Stochastik", ["poisson", "mindestens", "hypergeometrisch"]));
  LW.generator("ma-r-techniken", chapter("Rechentechniken", ["partiell", "substitution", "uneigentlich", "trapez", "polar", "geomreihe", "rotation"]));
})();
