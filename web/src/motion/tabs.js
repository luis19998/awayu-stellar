/** El indicador pertenece al grupo: sobrevive si la vista reemplaza sus botones. */
export function mountTabIndicator(list) {
  if (!list) return;
  const active = () => list.querySelector('[aria-selected="true"], [aria-pressed="true"]');
  const place = () => {
    const tab = active();
    if (!tab?.offsetWidth) {
      list.classList.remove("has-tab-indicator");
      return;
    }
    list.style.setProperty("--tab-x", `${tab.offsetLeft + 14}px`);
    list.style.setProperty("--tab-y", `${tab.offsetTop + tab.offsetHeight - 4}px`);
    list.style.setProperty("--tab-width", `${Math.max(0, tab.offsetWidth - 28)}px`);
    list.classList.add("has-tab-indicator");
  };
  // El ancho de un botón anterior también mueve el activo (idioma, fuente o zoom).
  const sizes = typeof ResizeObserver === "function" ? new ResizeObserver(place) : null;
  const observeSizes = () => {
    sizes?.disconnect();
    sizes?.observe(list);
    for (const tab of list.children) sizes?.observe(tab);
  };
  const changes = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList")) observeSizes();
    place();
  });
  changes.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected", "aria-pressed"] });
  const keepFocus = (event) => {
    const tab = event.target.closest("button");
    const doc = list.ownerDocument;
    if (!tab || doc.activeElement !== tab) return;
    queueMicrotask(() => {
      if (list.isConnected && !tab.isConnected && doc.activeElement === doc.body) {
        active()?.focus({ preventScroll: true });
      }
    });
  };
  list.addEventListener("click", keepFocus, true);
  observeSizes();
  place();
  if (!sizes) window.addEventListener("resize", place);
  return () => {
    changes.disconnect();
    sizes?.disconnect();
    list.removeEventListener("click", keepFocus, true);
    window.removeEventListener("resize", place);
  };
}
