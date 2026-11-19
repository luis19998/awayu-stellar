const topic = (esTitle, enTitle, esSteps, enSteps) => ({
  title: { es: esTitle, en: enTitle },
  steps: { es: esSteps, en: enSteps },
});

export const HELP_TOPICS = Object.freeze({
  wallet: topic("Conectar billetera", "Connect a wallet", ["Elegí Freighter, Google o correo.", "Revisá la red y la cuenta que aparece.", "Confirmá cada acción en tu billetera."], ["Choose Freighter, Google, or email.", "Check the network and account shown.", "Confirm each action in your wallet."]),
  contribute: topic("Aportar", "Contribute", ["Revisá la cuota y la ronda actual.", "Elegí Aportar y confirmá la firma.", "Esperá el resultado de la red."], ["Review the contribution and current round.", "Choose Contribute and confirm the signature.", "Wait for the network result."]),
  payout: topic("Pagar el pozo", "Pay the pot", ["Comprobá quién está de turno.", "El pozo se puede pagar cuando todos aportaron o venció el plazo.", "La red registra el pago y el avance de ronda."], ["Check whose turn it is.", "The pot can be paid once everyone contributed or the deadline passed.", "The network records the payment and next round."]),
  guarantee: topic("Garantía", "Guarantee", ["Es opcional y equivale a una cuota.", "Puede cubrir un aporte pendiente según las reglas del círculo.", "Al terminar, se puede retirar lo que quede."], ["It is optional and equals one contribution.", "It can cover an unpaid contribution under the circle rules.", "Any remaining amount can be withdrawn when the circle ends."]),
  create: topic("Crear un círculo", "Create a circle", ["Definí cuota y duración de ronda.", "Agregá las direcciones de las personas participantes.", "Revisá los datos antes de firmar; quedan públicos en Stellar."], ["Set the contribution and round length.", "Add the participants' addresses.", "Review the details before signing; they become public on Stellar."]),
  customize: topic("Personalizar", "Customize", ["Elegí personajes, escenario y aguayo.", "Los cambios son visuales y sirven para la demo.", "Volvé al círculo para ver el tejido actualizado."], ["Choose characters, a scene, and a woven pattern.", "These visual changes are for the demo.", "Return to the circle to see the updated weave."]),
  simulator: topic("Simulador", "Simulator", ["Probá distintos montos y cantidad de miembros.", "Los resultados son cálculos de ejemplo.", "No representan ganancias ni una recomendación."], ["Try different amounts and group sizes.", "Results are example calculations.", "They do not represent earnings or advice."]),
  map: topic("Mapa", "Map", ["Buscá círculos registrados por departamento.", "Abrí una ficha para conocer sus datos públicos.", "El mapa depende de los círculos registrados."], ["Browse registered circles by department.", "Open a card to see its public details.", "The map depends on circles being registered."]),
  passport: topic("Pasaporte", "Passport", ["Conectá la cuenta que declaró su participación.", "Revisá las marcas reunidas de tus círculos.", "El puntaje es un resumen y no garantiza crédito."], ["Connect the account that declared its participation.", "Review marks gathered from your circles.", "The score is a summary and does not guarantee credit."]),
  amawta: topic("Amawta", "Amawta", ["Escribí una pregunta sobre cómo funciona Awayu.", "Leé la respuesta y verificá los detalles importantes en la interfaz.", "No compartás información privada ni claves."], ["Ask a question about how Awayu works.", "Read the answer and verify important details in the interface.", "Do not share private information or keys."]),
});

function ensureStyles() {
  if (document.getElementById("aw-guide-help-style")) return;
  const style = document.createElement("style");
  style.id = "aw-guide-help-style";
  style.textContent = `
    .aw-guide-help-trigger{display:inline-grid;place-items:center;width:28px;height:28px;margin-inline-start:7px;border:1px solid #f0d283;border-radius:50%;background:#241c35;color:#fff;font:700 16px system-ui;line-height:1;cursor:pointer;vertical-align:middle}
    .aw-guide-help-trigger:focus-visible,.aw-guide-help-close:focus-visible{outline:3px solid #ffe18a;outline-offset:2px}
    .aw-guide-help-pop{position:fixed;z-index:11000;box-sizing:border-box;width:min(350px,calc(100vw - 24px));padding:16px;border:1px solid #e9cf82;border-radius:15px;background:#171126;color:#fff;box-shadow:0 14px 42px #000b;font:14px/1.5 system-ui,sans-serif}
    .aw-guide-help-pop h2{margin:0 34px 10px 0;color:#ffe29b;font-size:18px}.aw-guide-help-pop ol{margin:0;padding-inline-start:22px}.aw-guide-help-pop li{margin:6px 0;color:#f4efff}
    .aw-guide-help-pop video{display:block;width:100%;max-height:155px;margin-top:12px;border-radius:9px;background:#090714}.aw-guide-help-close{position:absolute;right:10px;top:9px;width:32px;height:32px;border:1px solid #9c8cad;border-radius:8px;background:#2b2140;color:#fff;font-size:19px;cursor:pointer}
    @media(prefers-reduced-motion:reduce){.aw-guide-help-pop{scroll-behavior:auto}}
  `;
  document.head.append(style);
}

let activePopover;
let activeLang = "es";
function closeHelp() {
  if (!activePopover) return;
  document.removeEventListener("keydown", activePopover.onKey);
  document.removeEventListener("pointerdown", activePopover.onOutside, true);
  activePopover.node.remove();
  activePopover.returnFocus?.focus?.();
  activePopover = null;
}

export function openHelp(topicId, { lang = activeLang, anchor } = {}) {
  if (typeof document === "undefined" || !HELP_TOPICS[topicId]) return null;
  ensureStyles(); closeHelp();
  const english = lang === "en";
  const data = HELP_TOPICS[topicId];
  const pop = document.createElement("aside"); pop.className = "aw-guide-help-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "false"); pop.setAttribute("aria-labelledby", "aw-guide-help-title");
  const heading = document.createElement("h2"); heading.id = "aw-guide-help-title"; heading.textContent = data.title[english ? "en" : "es"];
  const close = document.createElement("button"); close.type = "button"; close.className = "aw-guide-help-close"; close.textContent = "×"; close.setAttribute("aria-label", english ? "Close help" : "Cerrar ayuda"); close.addEventListener("click", closeHelp);
  const list = document.createElement("ol");
  data.steps[english ? "en" : "es"].forEach((line) => { const item = document.createElement("li"); item.textContent = line; list.append(item); });
  pop.append(close, heading, list);
  const video = document.createElement("video"); video.src = `/tutoriales/${encodeURIComponent(topicId)}.webm`; video.poster = `/tutoriales/${encodeURIComponent(topicId)}.jpg`; video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.setAttribute("playsinline", ""); video.setAttribute("aria-label", english ? `${data.title.en} tutorial` : `Tutorial: ${data.title.es}`);
  video.addEventListener("error", () => video.remove(), { once: true }); pop.append(video);
  document.body.append(pop);
  const rect = anchor?.getBoundingClientRect?.();
  const width = pop.getBoundingClientRect().width;
  const left = Math.max(12, Math.min(innerWidth - width - 12, rect ? rect.left : innerWidth - width - 18));
  const top = rect ? Math.min(innerHeight - 20, rect.bottom + 8) : Math.max(12, innerHeight / 2 - pop.offsetHeight / 2);
  Object.assign(pop.style, { left: `${left}px`, top: `${Math.min(top, innerHeight - pop.offsetHeight - 12)}px` });
  const onKey = (event) => { if (event.key === "Escape") { event.preventDefault(); closeHelp(); } };
  const onOutside = (event) => { if (!pop.contains(event.target) && event.target !== anchor) closeHelp(); };
  activePopover = { node: pop, onKey, onOutside, returnFocus: anchor };
  document.addEventListener("keydown", onKey); document.addEventListener("pointerdown", onOutside, true); close.focus();
  return { close: closeHelp, element: pop };
}

export function attachHelp(element, topicId) {
  if (!element || !HELP_TOPICS[topicId] || typeof document === "undefined") return () => {};
  ensureStyles();
  const button = document.createElement("button"); button.type = "button"; button.className = "aw-guide-help-trigger"; button.textContent = "?";
  button.setAttribute("aria-label", `${HELP_TOPICS[topicId].title.es} · ${HELP_TOPICS[topicId].title.en}`);
  button.addEventListener("click", () => openHelp(topicId, { lang: document.documentElement.lang === "en" ? "en" : "es", anchor: button }));
  element.append(button);
  return () => { if (activePopover?.returnFocus === button) closeHelp(); button.remove(); };
}
