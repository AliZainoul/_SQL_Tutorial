(() => {
  "use strict";
  const triggers = document.querySelectorAll("[data-ccc-figure-open]");
  if (!triggers.length || typeof HTMLDialogElement === "undefined") return;
  const modal = document.createElement("dialog");
  modal.className = "ccc-figure-dialog";
  modal.setAttribute("aria-label", "Figure pédagogique agrandie");
  const top = document.createElement("div");
  top.className = "ccc-figure-dialog-header";
  const title = document.createElement("strong");
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Fermer";
  close.addEventListener("click", () => modal.close());
  top.append(title, close);
  const image = document.createElement("img");
  image.alt = "";
  image.className = "ccc-figure-dialog-image";
  modal.append(top, image);
  document.body.append(modal);
  modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });
  triggers.forEach(trigger => {
    trigger.hidden = false;
    trigger.addEventListener("click", () => {
      const figure = trigger.closest("figure");
      const original = figure?.querySelector("img");
      if (!original) return;
      image.src = original.currentSrc || original.src;
      image.alt = original.alt;
      title.textContent = figure.querySelector("figcaption")?.textContent || "Schéma pédagogique";
      modal.showModal();
    });
  });
})();
