/* Optional accessible enhancements; all lesson text remains available without JavaScript. */
(() => {
  "use strict";

  const chapterIds = [
    "00-environnement", "01-bases-relationnelles", "02-modeliser", "03-creer-base", "04-creer-tables",
    "05-inserer", "06-premieres-requetes", "07-calculs-agregats", "08-jointures", "09-sous-requetes",
    "10-ensembles", "11-manipuler", "12-tables-vues", "13-fonctions", "14-revisions", "15-examen-blanc"
  ];
  const storageKey = "ccc-sql-librairie-completed-v1";

  function readProgress() {
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value.filter((id) => chapterIds.includes(id)) : [];
    } catch {
      return [];
    }
  }

  function storeProgress(ids) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(ids)); return true; }
    catch { return false; }
  }

  function initializeProgress() {
    const completed = new Set(readProgress());
    const overview = document.querySelector("[data-ccc-progress-overview]");
    if (overview) overview.textContent = `Progression dans ce navigateur : ${completed.size} / ${chapterIds.length} chapitres terminés.`;
    const button = document.querySelector("[data-ccc-complete]");
    if (!(button instanceof HTMLButtonElement)) return;
    const id = button.dataset.cccComplete;
    if (!chapterIds.includes(id)) return;
    const status = document.querySelector("[data-ccc-progress-message]");
    const refresh = () => {
      button.textContent = completed.has(id) ? "Annuler ma validation de ce chapitre" : "Marquer ce chapitre terminé";
      button.setAttribute("aria-pressed", String(completed.has(id)));
    };
    button.addEventListener("click", () => {
      if (completed.has(id)) completed.delete(id);
      else completed.add(id);
      const saved = storeProgress([...completed]);
      refresh();
      if (status) status.textContent = saved
        ? `Progression enregistrée : ${completed.size} / ${chapterIds.length} chapitres.`
        : "Le navigateur bloque le stockage local. La progression n'a pas été enregistrée.";
    });
    refresh();
    button.hidden = false;
  }

  function initializeQuizzes() {
    for (const root of document.querySelectorAll("[data-ccc-quiz-new]")) {
      const check = root.querySelector("[data-ccc-check-quiz]");
      const reset = root.querySelector("[data-ccc-reset-quiz]");
      const result = root.querySelector("[data-ccc-quiz-result]");
      const inputs = [...root.querySelectorAll('input[type="radio"]')];
      if (!(check instanceof HTMLButtonElement) || !(reset instanceof HTMLButtonElement)
          || !(result instanceof HTMLElement) || !inputs.length) continue;
      const answer = Number.parseInt(root.getAttribute("data-answer") || "-1", 10);
      if (answer < 0 || answer >= inputs.length) continue;
      check.addEventListener("click", () => {
        const choice = inputs.find((option) => option.checked);
        if (!choice) {
          result.dataset.cccResult = "warning";
          result.textContent = "Choisissez une réponse avant de valider.";
          return;
        }
        const success = Number.parseInt(choice.value, 10) === answer;
        result.dataset.cccResult = success ? "success" : "error";
        result.textContent = success
          ? "Réponse correcte. Consultez l'explication pour approfondir."
          : "Ce n'est pas la bonne réponse. Réessayez ou consultez l'explication.";
      });
      reset.addEventListener("click", () => {
        inputs.forEach((input) => { input.checked = false; });
        result.textContent = "";
        delete result.dataset.cccResult;
        inputs[0].focus();
      });
      inputs.forEach((input) => input.addEventListener("change", () => {
        result.textContent = "";
        delete result.dataset.cccResult;
      }));
      check.hidden = false;
      reset.hidden = false;
    }
  }

  function initializeCopyButtons() {
    for (const root of document.querySelectorAll("[data-ccc-copy-container]")) {
      const button = root.querySelector("[data-ccc-copy-button]");
      const text = root.querySelector("pre code");
      const status = root.querySelector("[data-ccc-copy-status]");
      const manual = root.querySelector(".ccc-copy-manual");
      const textarea = manual?.querySelector("textarea");
      if (!(button instanceof HTMLButtonElement) || !(text instanceof HTMLElement)) continue;
      button.hidden = false;
      button.addEventListener("click", async () => {
        const code = text.textContent || "";
        try {
          if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
          await navigator.clipboard.writeText(code);
          if (status) status.textContent = "Code copié.";
          button.textContent = "Copié";
          window.setTimeout(() => { button.textContent = "Copier"; }, 1600);
        } catch {
          if (manual instanceof HTMLElement && textarea instanceof HTMLTextAreaElement) {
            textarea.value = code;
            manual.hidden = false;
          }
          if (status) status.textContent = "Copie automatique indisponible : sélectionnez le texte ci-dessous.";
        }
      });
    }
  }

  function normalize(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
  }

  function initializeReferenceSearch() {
    const input = document.querySelector("[data-ccc-reference-search]");
    const status = document.querySelector("[data-ccc-reference-count]");
    if (!(input instanceof HTMLInputElement) || !(status instanceof HTMLElement)) return;
    const groups = [...document.querySelectorAll(".ccc-reference-group")];
    const rows = [...document.querySelectorAll("[data-ccc-searchable-row]")];
    const searchable = rows.map((element) => ({ element, searchable: normalize(element.textContent || "") }));
    const apply = () => {
      const tokens = normalize(input.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const entry of searchable) {
        const visible = tokens.every((token) => entry.searchable.includes(token));
        entry.element.hidden = !visible;
        if (visible) shown += 1;
      }
      for (const group of groups) {
        const any = Boolean(group.querySelector('[data-ccc-searchable-row]:not([hidden])'));
        group.hidden = !any;
      }
      status.textContent = tokens.length
        ? `${shown} résultat${shown > 1 ? "s" : ""} sur ${rows.length} entrées.`
        : `${rows.length} entrées disponibles. Recherche instantanée, sans connexion.`;
    };
    input.addEventListener("input", apply);
    apply();
  }

  function initializeJoinLab() {
    const root = document.querySelector("[data-ccc-join-lab]");
    if (!root) return;
    const host = root.querySelector("[data-ccc-join-result]");
    const status = root.querySelector("[data-ccc-join-status]");
    const buttons = [...root.querySelectorAll("[data-ccc-join]")];
    const inner = [["Ada", "101"], ["Ada", "102"], ["Lin", "103"]];
    const configurations = {
      inner: { rows: inner, label: "INNER JOIN : 3 paires correspondantes." },
      left: { rows: [...inner, ["Leo", null]], label: "LEFT JOIN : 3 correspondances et Leo, sans commande." },
      right: { rows: [...inner, [null, "999"]], label: "RIGHT JOIN : 3 correspondances et une commande orpheline." },
      full: { rows: [...inner, ["Leo", null], [null, "999"]], label: "FULL OUTER JOIN : toutes les correspondances et les deux côtés non appariés." }
    };
    if (!(host instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
    const display = (kind) => {
      const config = configurations[kind];
      if (!config) return;
      const table = document.createElement("table");
      const head = table.createTHead().insertRow();
      for (const label of ["Customer", "Order"]) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        head.append(th);
      }
      const tbody = table.createTBody();
      for (const pair of config.rows) {
        const row = tbody.insertRow();
        for (const value of pair) {
          const cell = row.insertCell();
          cell.textContent = value === null ? "NULL" : value;
          if (value === null) cell.classList.add("ccc-null-value");
        }
      }
      host.replaceChildren(table);
      status.textContent = config.label;
      for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.cccJoin === kind));
    };
    for (const button of buttons) button.addEventListener("click", () => display(button.dataset.cccJoin));
    display("inner");
  }

  function initializeExecutionLab() {
    const root = document.querySelector("[data-ccc-execution-lab]");
    if (!root) return;
    const previous = root.querySelector("[data-ccc-exec-prev]");
    const next = root.querySelector("[data-ccc-exec-next]");
    const label = root.querySelector("[data-ccc-exec-label]");
    const description = root.querySelector("[data-ccc-exec-text]");
    const fill = root.querySelector("[data-ccc-stage-fill]");
    const steps = [
      ["FROM / JOIN", "Relier orders et order_items : 8 lignes de produits commandés avant filtrage."],
      ["WHERE", "Conserver uniquement les commandes au statut paid : 5 lignes de produits commandés."],
      ["GROUP BY", "Regrouper par customer_id : 3 groupes (Ada, Lin et Maya)."],
      ["HAVING", "Conserver les groupes dont la somme atteint 200 : Ada et Maya restent."],
      ["SELECT", "Afficher customer_id et spent : (1, 1250) et (4, 600)."],
      ["DISTINCT", "Pas de DISTINCT dans cette requête : cette étape n'a donc aucun effet ici."],
      ["ORDER BY", "Trier les deux lignes par spent DESC : Ada, puis Maya."],
      ["LIMIT", "Garder au maximum 3 lignes : les deux lignes restent visibles."]
    ];
    if (!(previous instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)
        || !(label instanceof HTMLElement) || !(description instanceof HTMLElement)
        || !(fill instanceof HTMLElement)) return;
    let index = 0;
    const display = () => {
      label.textContent = `${index + 1} / ${steps.length} · ${steps[index][0]}`;
      description.textContent = steps[index][1];
      fill.style.width = `${((index + 1) / steps.length) * 100}%`;
      previous.disabled = index === 0;
      next.disabled = index === steps.length - 1;
    };
    previous.addEventListener("click", () => { index = Math.max(0, index - 1); display(); });
    next.addEventListener("click", () => { index = Math.min(steps.length - 1, index + 1); display(); });
    display();
  }

  const initialize = () => {
    initializeProgress();
    initializeQuizzes();
    initializeCopyButtons();
    initializeReferenceSearch();
    initializeJoinLab();
    initializeExecutionLab();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
