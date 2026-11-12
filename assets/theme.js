// Classic local script: no runtime modules, network requests, or storage guarantees.
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  const storageKey = "ccc-shell-theme";
  try {
    const theme = window.localStorage.getItem(storageKey);
    if (theme === "light" || theme === "dark") root.dataset.cccTheme = theme;
  } catch {
    // Browsers may restrict file:// storage.
  }

  function start() {
    const button = document.querySelector("[data-ccc-theme-toggle]");
    if (!(button instanceof HTMLButtonElement)) return;
    const isDark = () => root.dataset.cccTheme === "dark"
      || (!root.dataset.cccTheme && preference.matches);
    const render = () => {
      const dark = isDark();
      button.setAttribute("aria-label", dark ? "Activer le thème clair" : "Activer le thème sombre");
      button.dataset.cccActiveTheme = dark ? "dark" : "light";
    };
    button.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.dataset.cccTheme = next;
      try { window.localStorage.setItem(storageKey, next); } catch { /* Optional persistence */ }
      render();
    });
    preference.addEventListener("change", render);
    render();
    button.hidden = false;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
