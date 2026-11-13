/* Python widgets.
 *
 *   codetrace: runs through a short program step by step, like a debugger. The current line is marked, the table shows
 *              the variables after that line, the console collects what print wrote so far.
 *              params: code (text, lines separated by \n), trace [{ line (from 1), vars: { name: "value as Python shows it" },
 *                      out: "printed by this step", note: "short comment" }], k (step shown first), buttons (false hides them)
 *              scope:  k, n (number of steps), line
 *              act:    step (go to step number arg); animations glide k (rounded).
 */
(function () {
  "use strict";
  const LW = window.LW;
  const K = LW.kit;

  LW.widget("codetrace", {
    mount(host, p, ctx) {
      const lines = String(p.code || "").replace(/\n$/, "").split("\n");
      const trace = p.trace || [];
      let k = K.clamp(Math.round(p.k || 0), 0, Math.max(0, trace.length - 1)), locked = false;
      const box = LW.el("div", { class: "w-code", role: "group", "aria-label": "Programm Schritt für Schritt" });
      const pre = LW.el("div", { class: "w-code-lines" });
      const rows = lines.map((ln, i) => {
        const row = LW.el("div", { class: "w-code-line" }, [LW.el("span", { class: "ln", text: String(i + 1) }), LW.el("code", { text: ln || " " })]);
        pre.append(row);
        return row;
      });
      const side = LW.el("div", { class: "w-code-side" });
      const vars = LW.el("table", { class: "w-code-vars" });
      const con = LW.el("pre", { class: "w-code-console", "aria-live": "polite" });
      const note = LW.el("div", { class: "w-code-note" });
      side.append(LW.el("div", { class: "lw-pool-label", text: "Variablen" }), vars, LW.el("div", { class: "lw-pool-label", text: "Ausgabe" }), con);
      box.append(pre, side);
      host.append(box, note);
      let btns = null;
      if (p.buttons !== false) {
        btns = LW.el("div", { class: "w-btns" });
        K.button(btns, "Zurück", () => { if (!locked && k > 0) { k -= 1; paint(); ctx.changed(); } });
        K.button(btns, "Nächste Zeile", () => { if (!locked && k < trace.length - 1) { k += 1; paint(); ctx.changed(); } }).classList.add("on");
        host.append(btns);
      }
      const prev = {};
      function paint() {
        const t = trace[k] || { line: 0, vars: {} };
        rows.forEach((r, i) => r.classList.toggle("cur", i + 1 === t.line));
        vars.innerHTML = "";
        const v = t.vars || {};
        const before = k > 0 ? (trace[k - 1].vars || {}) : {};
        const names = Object.keys(v);
        if (!names.length) vars.append(LW.el("tr", null, [LW.el("td", { class: "none", text: "noch keine" })]));
        names.forEach((name) => {
          const changed = before[name] !== v[name];
          vars.append(LW.el("tr", { class: changed ? "changed" : "" }, [LW.el("td", { class: "name", text: name }), LW.el("td", { class: "val", text: v[name] })]));
        });
        con.textContent = trace.slice(0, k + 1).map((s) => s.out).filter((s) => s != null && s !== "").join("\n") || " ";
        note.innerHTML = t.note ? LW.md(t.note) : "";
        Object.assign(prev, v);
        const cur = rows[t.line - 1];
        if (cur && cur.scrollIntoView && pre.scrollHeight > pre.clientHeight) cur.scrollIntoView({ block: "nearest" });
      }
      paint();
      return {
        check: (goal) => {
          let ok = false;
          try { ok = !!LW.expr(goal.when || "k >= n - 1")({ k, n: trace.length }); } catch (e) { ok = false; }
          return { correct: ok, detail: ok ? null : goal.message || "Gehe bis zur letzten Zeile." };
        },
        solve() { k = trace.length - 1; paint(); },
        getVar: (name) => (name === "k" ? k : name === "n" ? trace.length : name === "line" ? (trace[k] || {}).line : NaN),
        setVar(name, val) { if (name === "k") { k = K.clamp(Math.round(val), 0, Math.max(0, trace.length - 1)); paint(); } },
        act(name, arg) { if (name === "step") { k = K.clamp(Math.round(arg), 0, Math.max(0, trace.length - 1)); paint(); } },
        lock() { locked = true; if (btns) btns.querySelectorAll("button").forEach((b) => { b.disabled = true; }); },
      };
    },
  });
})();
