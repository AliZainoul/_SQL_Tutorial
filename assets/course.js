/* Optional enhancements. All content stays readable without JavaScript. */
(() => {
  "use strict";
  // Dialect tabs: panels are stacked with headings without JS; JS turns them into tabs.
  for (const root of document.querySelectorAll("[data-course-tabs]")) {
    const panels = [...root.querySelectorAll(":scope > .course-tabpanel")];
    if (panels.length < 2) continue;
    const list = document.createElement("div");
    list.className = "course-tablist"; list.setAttribute("role", "tablist");
    const tabs = panels.map((panel, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "course-tab"; b.setAttribute("role", "tab");
      b.id = `${root.id}-tab-${i}`; b.setAttribute("aria-controls", panel.id);
      b.textContent = panel.dataset.label || `Onglet ${i + 1}`;
      panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", b.id);
      list.appendChild(b); return b;
    });
    const select = (n, focus) => {
      tabs.forEach((t, i) => { t.setAttribute("aria-selected", String(i === n)); t.tabIndex = i === n ? 0 : -1; panels[i].hidden = i !== n; });
      if (focus) tabs[n].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i, false));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    root.insertBefore(list, root.firstChild);
    root.setAttribute("data-ready", ""); select(0, false);
  }
  // Course search over a local index (assets/search-index.js defines window.CCC_SEARCH).
  const input = document.querySelector("[data-course-search]");
  const out = document.querySelector("[data-course-search-results]");
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (input && out && Array.isArray(window.CCC_SEARCH)) {
    input.addEventListener("input", () => {
      const q = norm(input.value.trim()); out.textContent = "";
      if (q.length < 2) return;
      const hits = window.CCC_SEARCH.filter((e) => norm(e.t + " " + e.x).includes(q)).slice(0, 12);
      if (!hits.length) { const li = document.createElement("li"); li.textContent = "Aucun résultat."; out.appendChild(li); return; }
      for (const h of hits) {
        const li = document.createElement("li"), a = document.createElement("a");
        a.href = h.u; a.textContent = h.t; li.appendChild(a);
        const s = document.createElement("span"); s.textContent = " — " + h.c; li.appendChild(s); out.appendChild(li);
      }
    });
  }
})();
/* Cheatsheet filters: controls stay hidden without JavaScript, all entries remain visible. */
(() => {
  "use strict";
  const controls = document.querySelector("[data-cs-controls]");
  if (!controls) return;
  const entries = [...document.querySelectorAll(".cs-entry")];
  const groups = [...document.querySelectorAll(".cs-group")];
  const q = controls.querySelector("[data-cs-search]"), cat = controls.querySelector("[data-cs-cat]");
  const eni = controls.querySelector("[data-cs-eni]"), eng = controls.querySelector("[data-cs-engine]");
  const count = controls.querySelector("[data-cs-count]");
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const apply = () => {
    const term = norm(q.value.trim()); let shown = 0;
    for (const e of entries) {
      const ok = (!term || e.dataset.csText.includes(term)) && (!cat.value || e.dataset.csCat === cat.value) &&
        (!eni.value || e.dataset.csEni === eni.value) && (!eng.value || e.dataset[eng.value] !== "0");
      e.hidden = !ok; if (ok) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector(".cs-entry:not([hidden])");
    count.textContent = `${shown} fiche${shown > 1 ? "s" : ""} affichée${shown > 1 ? "s" : ""} sur ${entries.length}.`;
  };
  for (const el of [q, cat, eni, eng]) el.addEventListener("input", apply);
  controls.hidden = false; apply();
})();
