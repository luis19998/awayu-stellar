const TOUR_SEEN_KEY = "awayu.guide.tour.seen";

export function validateSteps(steps) {
  if (!Array.isArray(steps) || !steps.length) return false;
  const hasCopy = (copy) => typeof copy === "string" ? Boolean(copy.trim()) :
    Boolean(copy && typeof copy === "object" && [copy.es, copy.en].some((line) => typeof line === "string" && line.trim()));
  return steps.every((step) => step && typeof step.selector === "string" && step.selector.trim() && hasCopy(step.title) && hasCopy(step.text));
}

export function hasSeenTour(id = "firstVisit") {
  try { return localStorage.getItem(`${TOUR_SEEN_KEY}.${id}`) === "1"; } catch { return false; }
}

const bi = (es, en) => ({ es, en });
const step = (selector, title, text, placement = "auto", video) => ({ selector, title, text, placement, video });

export const TOURS = Object.freeze({
  firstVisit: [
    step("#panel", bi("Tu panel", "Your dashboard"), bi("Aquí ves la ronda, la cuota y el pozo del círculo.", "See the round, contribution, and circle pot here.")),
    step("#stage", bi("El círculo 3D", "The 3D circle"), bi("El tejido muestra la historia de aportes de cada persona.", "The woven scene shows each person's contribution history.")),
    step("#btn-wallet", bi("Conectá tu billetera", "Connect your wallet"), bi("Usá Freighter o ingresá con Google o correo cuando Pollar esté habilitado.", "Use Freighter or sign in with Google or email when Pollar is enabled.")),
    step("#btn-custom", bi("Hacelo a tu manera", "Make it yours"), bi("Personalizá personajes y tejidos para la demo.", "Customize characters and patterns for the demo.")),
  ],
  contributeAndPayout: [
    step("#btn-contribute", bi("Aportar", "Contribute"), bi("Cada miembro aporta la cuota de la ronda.", "Each member contributes the round amount.")),
    step("#members", bi("Revisá los aportes", "Check contributions"), bi("La lista muestra quién ya aportó y el historial de cada miembro.", "The list shows who has contributed and each member's history.")),
    step("#btn-payout", bi("Pagar el pozo", "Pay out the pot"), bi("Cuando todos aportaron o venció el plazo, se puede pagar a quien está de turno.", "Once everyone has contributed or the deadline passes, the pot can be paid to the person whose turn it is.")),
  ],
  createCircle: [step("#btn-create", bi("Crear un círculo", "Create a circle"), bi("Elegí la cuota, la duración de ronda y las personas que participarán.", "Choose the contribution, round length, and participants."))],
  guarantee: [
    step("#btn-guarantee", bi("Garantía opcional", "Optional guarantee"), bi("Una garantía puede cubrir una cuota pendiente. Revisá el monto y las reglas antes de firmar.", "A guarantee can cover an unpaid contribution. Review the amount and rules before signing.")),
    step("#members", bi("Estado visible", "Visible status"), bi("Los saldos y marcas guardados en la cadena son públicos.", "Balances and marks stored on-chain are public.")),
  ],
  mapAndPassport: [
    step("#nav", bi("Mapa de Bolivia", "Map of Bolivia"), bi("Explorá los círculos registrados por departamento.", "Explore registered circles by department.")),
    step("#nav", bi("Tu pasaporte", "Your passport"), bi("Reúne las marcas de participación de los círculos donde declaraste tu membresía.", "It gathers participation marks from circles where you declared your membership.")),
  ],
  map: [step("#nav", bi("Mapa de Bolivia", "Map of Bolivia"), bi("Explorá los círculos registrados por departamento.", "Explore registered circles by department."))],
  passport: [step("#nav", bi("Pasaporte", "Passport"), bi("Revisa las marcas reunidas de tus círculos. No es una aprobación de crédito.", "Review marks gathered from your circles. This is not a credit approval."))],
});

function localized(value, lang) {
  if (typeof value === "string") return value;
  return value?.[lang] || value?.es || value?.en || "";
}

function addStyles() {
  if (document.getElementById("aw-guide-tour-style")) return;
  const style = document.createElement("style");
  style.id = "aw-guide-tour-style";
  style.textContent = `
    .aw-guide-tour-shade{position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:visible}
    .aw-guide-tour-spot{position:fixed;z-index:10001;pointer-events:none;border:2px solid #ffd76a;border-radius:12px;box-shadow:0 0 0 9999px rgba(8,6,19,.78),0 0 24px #ffd76a;transition:all .25s ease;}
    .aw-guide-tour-card{position:fixed;z-index:10002;box-sizing:border-box;width:min(360px,calc(100vw - 24px));padding:18px;border:1px solid #f4d47f;border-radius:16px;background:#171126;color:#fff;box-shadow:0 16px 50px #000b;font:15px/1.5 system-ui,sans-serif}
    .aw-guide-tour-card:before{content:"";position:absolute;width:12px;height:12px;top:-7px;left:28px;transform:rotate(45deg);background:#171126;border-left:1px solid #f4d47f;border-top:1px solid #f4d47f}
    .aw-guide-tour-card h2{margin:0 0 8px;color:#ffe29b;font-size:19px}.aw-guide-tour-card p{margin:0 0 12px;color:#f4efff}
    .aw-guide-tour-card video{display:block;width:100%;max-height:150px;margin:8px 0 12px;border-radius:10px;background:#090714}
    .aw-guide-tour-count{color:#cfc5df;font-size:13px}.aw-guide-tour-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:14px}
    .aw-guide-tour-card button{min-height:40px;padding:8px 12px;border:1px solid #9d8ab5;border-radius:9px;background:#2b2140;color:#fff;font:600 14px system-ui;cursor:pointer}
    .aw-guide-tour-card button:focus-visible{outline:3px solid #ffdf75;outline-offset:2px}.aw-guide-tour-card .aw-guide-tour-next{background:#f5d16d;border-color:#f5d16d;color:#21162a}
    .aw-guide-tour-arrow{position:absolute;left:22px;top:-17px;color:#f5d16d;font-size:18px}
    @media(max-width:520px){.aw-guide-tour-card{left:12px!important;right:12px!important;width:auto!important}.aw-guide-tour-spot{border-radius:9px}}
    @media(prefers-reduced-motion:reduce){.aw-guide-tour-spot{transition:none}}
  `;
  document.head.append(style);
}

export function startTour(steps, { lang = "es", onEnd, id = "firstVisit" } = {}) {
  if (typeof document === "undefined" || !validateSteps(steps)) return { end() {} };
  addStyles();
  const english = lang === "en";
  const shade = document.createElement("div"); shade.className = "aw-guide-tour-shade";
  const spot = document.createElement("div"); spot.className = "aw-guide-tour-spot"; spot.setAttribute("aria-hidden", "true");
  const card = document.createElement("section"); card.className = "aw-guide-tour-card";
  card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-label", english ? "Guided tour" : "Recorrido guiado");
  document.body.append(shade, spot, card);
  let index = 0; let ended = false; let target = null; let resizeObserver;
  const previousFocus = document.activeElement;
  const buttons = () => [...card.querySelectorAll("button")];
  const position = () => {
    if (!target?.isConnected) return;
    const rect = target.getBoundingClientRect();
    const pad = 7;
    Object.assign(spot.style, { left: `${Math.max(4, rect.left - pad)}px`, top: `${Math.max(4, rect.top - pad)}px`, width: `${Math.max(0, rect.width + pad * 2)}px`, height: `${Math.max(0, rect.height + pad * 2)}px` });
    const box = card.getBoundingClientRect();
    const placement = steps[index].placement || "auto";
    let left = Math.min(innerWidth - box.width - 12, Math.max(12, rect.left + rect.width / 2 - box.width / 2));
    let top = placement === "top" || (placement === "auto" && rect.bottom + box.height + 22 > innerHeight) ? rect.top - box.height - 20 : rect.bottom + 20;
    if (top < 12 || placement === "bottom") top = Math.min(innerHeight - box.height - 12, rect.bottom + 20);
    if (innerWidth <= 520) left = 12;
    Object.assign(card.style, { left: `${left}px`, top: `${Math.max(12, top)}px` });
  };
  const finish = (completed = false) => {
    if (ended) return;
    ended = true; resizeObserver?.disconnect(); window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); document.removeEventListener("keydown", keydown);
    shade.remove(); spot.remove(); card.remove();
    try { localStorage.setItem(`${TOUR_SEEN_KEY}.${id}`, "1"); } catch {}
    if (previousFocus?.isConnected) previousFocus.focus();
    onEnd?.({ completed });
  };
  const render = () => {
    const current = steps[index];
    target = document.querySelector(current.selector);
    if (!target) { index++; if (index >= steps.length) return finish(false); return render(); }
    target.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    card.replaceChildren();
    const arrow = document.createElement("span"); arrow.className = "aw-guide-tour-arrow"; arrow.textContent = "◆"; arrow.setAttribute("aria-hidden", "true");
    const heading = document.createElement("h2"); heading.textContent = localized(current.title, english ? "en" : "es"); heading.id = "aw-guide-tour-title";
    card.setAttribute("aria-labelledby", heading.id);
    const text = document.createElement("p"); text.textContent = localized(current.text, english ? "en" : "es");
    card.append(arrow, heading, text);
    if (current.video) {
      const video = document.createElement("video"); video.src = current.video; video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true; video.setAttribute("playsinline", ""); video.setAttribute("aria-label", english ? "Tutorial video" : "Video tutorial");
      video.addEventListener("error", () => video.remove(), { once: true }); card.append(video);
    }
    const controls = document.createElement("div"); controls.className = "aw-guide-tour-actions";
    const count = document.createElement("span"); count.className = "aw-guide-tour-count"; count.textContent = `${index + 1} / ${steps.length}`;
    const group = document.createElement("div"); group.style.cssText = "display:flex;gap:7px";
    const skip = document.createElement("button"); skip.type = "button"; skip.textContent = english ? "Skip" : "Saltar"; skip.addEventListener("click", () => finish(false));
    const prev = document.createElement("button"); prev.type = "button"; prev.textContent = english ? "Previous" : "Anterior"; prev.disabled = index === 0; prev.addEventListener("click", () => { index = Math.max(0, index - 1); render(); });
    const next = document.createElement("button"); next.type = "button"; next.className = "aw-guide-tour-next"; next.textContent = index === steps.length - 1 ? (english ? "Finish" : "Terminar") : (english ? "Next" : "Siguiente"); next.addEventListener("click", () => { if (index + 1 >= steps.length) finish(true); else { index++; render(); } });
    group.append(skip, prev, next); controls.append(count, group); card.append(controls);
    requestAnimationFrame(position); next.focus();
    if (resizeObserver) resizeObserver.disconnect();
    if (typeof ResizeObserver !== "undefined") { resizeObserver = new ResizeObserver(position); resizeObserver.observe(target); }
  };
  function keydown(event) {
    if (event.key === "Escape") { event.preventDefault(); finish(false); }
    else if (event.key === "ArrowRight") { event.preventDefault(); buttons().at(-1)?.click(); }
    else if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); buttons().at(-2)?.click(); }
    else if (event.key === "Tab") { const items = buttons(); const first = items[0], last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  }
  document.addEventListener("keydown", keydown); window.addEventListener("resize", position); window.addEventListener("scroll", position, true); render();
  return { end: () => finish(false) };
}
