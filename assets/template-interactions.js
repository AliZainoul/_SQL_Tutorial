// Optional local enhancements; essential content remains in the HTML.
(() => {
  function initializeNavigation() {
    const disclosure = document.querySelector("[data-ccc-course-navigation]");
    if (!(disclosure instanceof HTMLDetailsElement)) return;
    const summary = disclosure.querySelector("summary");
    const desktop = window.matchMedia("(min-width: 50.001rem)");
    const render = () => {
      // A breakpoint change may hide the currently focused navigation element.
      if (!desktop.matches && disclosure.contains(document.activeElement)) {
        summary?.focus();
      }
      disclosure.open = desktop.matches;
      if (desktop.matches) {
        if (document.activeElement === summary) {
          const current = disclosure.querySelector('a[aria-current="page"]');
          if (current instanceof HTMLElement) current.focus();
        }
        disclosure.dataset.cccDesktopNavigation = "";
      } else {
        delete disclosure.dataset.cccDesktopNavigation;
      }
    };
    render();
    desktop.addEventListener("change", render);
  }

  function initializeConceptReferences() {
    for (const disclosure of document.querySelectorAll("[data-ccc-concept-reference]")) {
      if (!(disclosure instanceof HTMLDetailsElement)) continue;
      const summary = disclosure.querySelector("summary");
      disclosure.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !disclosure.open) return;
        event.preventDefault();
        disclosure.open = false;
        summary?.focus();
      });
    }
  }

  function initializePrintDisclosures() {
    /** @type {HTMLDetailsElement[]} */
    let openedForPrint = [];
    window.addEventListener("beforeprint", () => {
      for (const disclosure of document.querySelectorAll("main details, footer details")) {
        if (disclosure instanceof HTMLDetailsElement && !disclosure.open) {
          openedForPrint.push(disclosure);
          disclosure.open = true;
        }
      }
    });
    window.addEventListener("afterprint", () => {
      for (const disclosure of openedForPrint) disclosure.open = false;
      openedForPrint = [];
    });
  }

  function syncStepFromFragment(useViewport = false) {
    let fragment = window.location.hash.slice(1);
    try { fragment = decodeURIComponent(fragment); } catch { /* Keep malformed fragments inert. */ }
    const steps = document.querySelectorAll("[data-ccc-step-target]");
    if (!steps.length) return;
    let current = steps[0];
    const destination = document.getElementById(fragment);
    for (const step of steps) {
      const targetId = step.getAttribute("data-ccc-step-target");
      const section = targetId ? document.getElementById(targetId) : null;
      if (useViewport) {
        // Desktop validation sits beside the lesson. Reaching its top does not
        // mean that the learner has reached the end of the preceding practice.
        if (section?.closest(".ccc-validation-column")) {
          const practice = steps.item(2); // Third entry in the canonical four-step path.
          const practiceId = practice?.getAttribute("data-ccc-step-target");
          const practiceSection = practiceId ? document.getElementById(practiceId) : null;
          if (practiceSection && section.getBoundingClientRect().top < practiceSection.getBoundingClientRect().top
            && practiceSection.getBoundingClientRect().bottom > 140) continue;
        }
        if (section && section.getBoundingClientRect().top <= 140) current = step;
      } else if (targetId === fragment || (destination && section?.contains(destination))) {
        current = step;
        break;
      }
    }
    for (const step of steps) {
      if (step === current) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    }
    for (const link of document.querySelectorAll("[data-ccc-section-link]")) {
      const active = link.getAttribute("data-ccc-section-link") === fragment;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }

  function initializeCopy() {
    for (const button of document.querySelectorAll("[data-ccc-copy-code]")) {
      if (!(button instanceof HTMLButtonElement)) continue;
      const block = button.closest(".ccc-code-block");
      const status = block?.querySelector("[role=status]");
      const label = button.querySelector("[data-ccc-copy-label]");
      const fallback = block?.querySelector("[data-ccc-copy-fallback]");
      if (!(status instanceof HTMLElement) || !(fallback instanceof HTMLElement) || !label) continue;
      const content = button.getAttribute("data-ccc-copy-code") ?? "";
      const manualField = fallback.querySelector("textarea");
      // Preserve even a leading newline that HTML textarea parsing may remove.
      if (manualField instanceof HTMLTextAreaElement) manualField.value = content;
      let pending = false;
      let resetTimer = 0;

      const resetSuccess = () => {
        delete button.dataset.cccCopyState;
        label.textContent = "Copier";
        status.textContent = "";
        status.classList.add("ccc-visually-hidden");
      };

      button.addEventListener("click", async () => {
        if (pending) return;
        pending = true;
        window.clearTimeout(resetTimer);
        resetSuccess();
        // aria-disabled preserves focus while guarding repeat activation.
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("aria-busy", "true");
        try {
          if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
          await navigator.clipboard.writeText(content);
          button.dataset.cccCopyState = "success";
          label.textContent = "Copié !";
          status.textContent = "Code copié dans le presse-papiers.";
          // Do not hide a manual field if the learner moved focus into it.
          if (!fallback.contains(document.activeElement)) fallback.hidden = true;
          resetTimer = window.setTimeout(resetSuccess, 2500);
        } catch {
          button.dataset.cccCopyState = "error";
          status.classList.remove("ccc-visually-hidden");
          status.textContent = "La copie automatique a échoué. Utilisez le champ de copie manuelle ci-dessous.";
          fallback.hidden = false;
          // No focus(), select(), or scroll call: manual copying is learner initiated.
        } finally {
          pending = false;
          button.removeAttribute("aria-disabled");
          button.removeAttribute("aria-busy");
        }
      });
      button.hidden = false;
    }
  }

  function initializeQuizzes() {
    for (const quiz of document.querySelectorAll("[data-ccc-quiz]")) {
      const choices = [...quiz.querySelectorAll('input[type="radio"]')];
      const submit = quiz.querySelector("[data-ccc-quiz-submit]");
      const reset = quiz.querySelector("[data-ccc-quiz-reset]");
      const actions = quiz.querySelector("[data-ccc-quiz-actions]");
      const feedback = quiz.querySelector("[data-ccc-quiz-feedback]");
      const correction = quiz.querySelector("[data-ccc-quiz-correction]");
      const fallback = quiz.querySelector("[data-ccc-quiz-fallback]");
      const explanation = quiz.querySelector("[data-ccc-quiz-explanation]");
      const answer = quiz.getAttribute("data-ccc-correct-option");
      if (!(submit instanceof HTMLButtonElement) || !(reset instanceof HTMLButtonElement)
        || !(actions instanceof HTMLElement) || !(feedback instanceof HTMLElement)
        || !(correction instanceof HTMLDetailsElement) || !explanation
        || choices.length < 2 || !choices.every((choice) => choice instanceof HTMLInputElement)
        || !choices.some((choice) => choice.value === answer)) continue;

      const clearFeedback = () => {
        delete feedback.dataset.cccResult;
        feedback.textContent = "";
      };
      submit.addEventListener("click", () => {
        const selected = choices.find((choice) => choice.checked);
        if (!selected) {
          feedback.dataset.cccResult = "warning";
          feedback.textContent = "Choisissez une réponse avant de valider.";
          return;
        }
        const correct = selected.value === answer;
        feedback.dataset.cccResult = correct ? "success" : "error";
        feedback.textContent = `${correct ? "Réponse correcte." : "Réponse incorrecte. Vous pouvez réessayer."} ${(explanation.textContent ?? "").trim()}`;
      });
      for (const choice of choices) choice.addEventListener("change", clearFeedback);
      reset.addEventListener("click", () => {
        for (const choice of choices) choice.checked = false;
        correction.open = false;
        clearFeedback();
        feedback.textContent = "Nouvel essai : choisissez une réponse, puis validez.";
      });
      actions.hidden = false;
      if (fallback instanceof HTMLElement) fallback.hidden = true;
    }
  }

  window.addEventListener("hashchange", () => syncStepFromFragment());
  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      scrollQueued = false;
      syncStepFromFragment(true);
    });
  }, { passive: true });
  const initialize = () => {
    initializeNavigation();
    initializeConceptReferences();
    initializePrintDisclosures();
    syncStepFromFragment();
    initializeCopy();
    initializeQuizzes();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
