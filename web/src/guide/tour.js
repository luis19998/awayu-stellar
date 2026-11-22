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

import { pickLang } from "../i18n.js";

const bi = (es, en, translations = {}) => ({ es, en, pt: translations.pt ?? es, qu: translations.qu ?? es, ay: translations.ay ?? es, gn: translations.gn ?? es });
const step = (selector, title, text, placement = "auto", video) => ({ selector, title, text, placement, video });

export const TOURS = Object.freeze({
  // Recorrido de bienvenida: diez pasos con lenguaje simple y videos cortos
  firstVisit: [
    step("#stage", bi("Esta es la mesa del círculo", "This is the circle's table", { pt: "Esta é a mesa do círculo" }),
      bi("Cada figura de Alasitas es una persona del grupo. Bajo cada una se apilan capas de aguayo: una por cada pago que hizo. Puedes girar la mesa arrastrando con el dedo o el mouse.",
        "Each Alasitas figure is a person in the group. Under each one, aguayo layers pile up: one for every payment they made. Drag with your finger or mouse to turn the table.",
        { pt: "Cada figura de Alasitas é uma pessoa do grupo. Embaixo de cada uma se empilham camadas de aguayo: uma por pagamento feito. Arraste com o dedo ou o mouse para girar a mesa." })),
    step(".legend", bi("Qué significa cada color", "What each color means", { pt: "O que cada cor significa" }),
      bi("A tiempo: colores plenos. Tarde: colores apagados. Faltó: un hueco. Cubierto por garantía: franjas doradas. Así se lee el historial de cada persona de un vistazo.",
        "On time: full colors. Late: faded colors. Missed: a gap. Covered by a guarantee: gold stripes. That's how you read each person's record at a glance.",
        { pt: "Em dia: cores plenas. Atrasado: cores apagadas. Faltou: um buraco. Coberto pela garantia: faixas douradas. Assim se lê o histórico de cada pessoa num relance." }), "top"),
    step(".stats", bi("Ronda, cuota y pozo", "Round, contribution and pot", { pt: "Rodada, cota e fundo" }),
      bi("La ronda dice en qué vuelta va el grupo, la cuota es lo que pone cada persona y el pozo es lo que se juntó para quien cobra esta vez.",
        "The round tells which lap the group is on, the contribution is what each person pays in and the pot is what was gathered for whoever collects this time.",
        { pt: "A rodada diz em que volta o grupo está, a cota é o que cada pessoa paga e o fundo é o que se juntou para quem recebe desta vez." })),
    step(".turn", bi("¿A quién le toca?", "Whose turn is it?", { pt: "De quem é a vez?" }),
      bi("El orden de cobro lo sortea la red de Stellar al crear el círculo: nadie lo elige a dedo y cualquiera puede comprobarlo.",
        "The payout order is drawn by the Stellar network when the circle is created: nobody picks it by hand and anyone can check it.",
        { pt: "A ordem de recebimento é sorteada pela rede Stellar ao criar o círculo: ninguém escolhe a dedo e qualquer pessoa pode conferir." })),
    step("#btn-contribute", bi("Pruébalo: aporta", "Try it: contribute", { pt: "Experimente: contribua" }),
      bi("Toca Aportar para poner la cuota de la ronda. En la demostración no se usa dinero real; mira cómo se teje una capa nueva.",
        "Press Contribute to pay this round's share. The demo uses no real money; watch a new layer being woven.",
        { pt: "Toque em Contribuir para pagar a cota da rodada. A demonstração não usa dinheiro real; veja uma nova camada sendo tecida." }), "auto", "/tutoriales/contribute.webm"),
    step("#btn-guarantee", bi("La garantía te cuida", "The guarantee protects you", { pt: "A garantia protege você" }),
      bi("Puedes dejar una cuota como garantía. Si un mes no puedes pagar, cubre tu parte y quien cobra recibe el pozo completo.",
        "You can leave one contribution as a guarantee. If you can't pay one month, it covers your share and the person collecting gets the full pot.",
        { pt: "Você pode deixar uma cota como garantia. Se em algum mês não puder pagar, ela cobre sua parte e quem recebe ganha o fundo completo." }), "auto", "/tutoriales/guarantee.webm"),
    step("#members", bi("Las personas del grupo", "The people in the group", { pt: "As pessoas do grupo" }),
      bi("Toca a alguien para ver su aguayo, su puntaje de reputación y elegir su personaje entre 36 figuras.",
        "Tap someone to see their aguayo, their reputation score and pick their character among 36 figures.",
        { pt: "Toque em alguém para ver seu aguayo, sua pontuação de reputação e escolher seu personagem entre 36 figuras." })),
    step("#btn-studio, #btn-custom", bi("Hazlo a tu manera", "Make it yours", { pt: "Do seu jeito" }),
      bi("En Estudio cambias la hora del día, el clima y los colores de tu aguayo; en Personalizar, el escenario, la mesa y los personajes.",
        "In Studio you change the time of day, the weather and your aguayo colors; in Customize, the scene, the table and the characters.",
        { pt: "No Estúdio você muda a hora do dia, o clima e as cores do seu aguayo; em Personalizar, o cenário, a mesa e os personagens." }), "auto", "/tutoriales/studio.webm"),
    step("#nav", bi("Las otras tradiciones", "The other traditions", { pt: "As outras tradições" }),
      bi("En este menú están Ayni (ayuda mutua), Minka (proyectos), Alasitas (metas), el mapa de Bolivia, tu billetera y Verificar, donde puedes comprobar sorteos y comprobantes.",
        "This menu has Ayni (mutual aid), Minka (projects), Alasitas (goals), the map of Bolivia, your wallet and Verify, where you can check draws and receipts.",
        { pt: "Neste menu estão Ayni (ajuda mútua), Minka (projetos), Alasitas (metas), o mapa da Bolívia, sua carteira e Verificar, onde você confere sorteios e comprovantes." })),
    step("#help-fab", bi("¿Te perdiste? Aquí hay ayuda", "Lost? Help is here", { pt: "Se perdeu? Aqui tem ajuda" }),
      bi("Este botón tiene videos cortos de cada acción. Y cuando quieras hacerlo de verdad en la red de prueba, conecta una billetera arriba a la derecha.",
        "This button has short videos for every action. And when you want to do it for real on the test network, connect a wallet at the top right.",
        { pt: "Este botão tem vídeos curtos de cada ação. E quando quiser fazer de verdade na rede de testes, conecte uma carteira no canto superior direito." }), "top"),
  ],
  contributeAndPayout: [
    step("#btn-contribute", bi("Aportar", "Contribute"), bi("Cada miembro aporta la cuota de la ronda.", "Each member contributes the round amount.")),
    step("#members", bi("Revisa los aportes", "Check contributions"), bi("La lista muestra quién ya aportó y el historial de cada miembro.", "The list shows who has contributed and each member's history.")),
    step("#btn-payout", bi("Pagar el pozo", "Pay out the pot"), bi("Cuando todos aportaron o venció el plazo, se puede pagar a quien está de turno.", "Once everyone has contributed or the deadline passes, the pot can be paid to the person whose turn it is.")),
  ],
  createCircle: [step("#btn-create", bi("Crear un círculo", "Create a circle"), bi("Elige la cuota, la duración de ronda y las personas que participarán.", "Choose the contribution, round length, and participants."))],
  guarantee: [
    step("#btn-guarantee", bi("Garantía opcional", "Optional guarantee"), bi("Una garantía puede cubrir una cuota pendiente. Revisa el monto y las reglas antes de firmar.", "A guarantee can cover an unpaid contribution. Review the amount and rules before signing.")),
    step("#members", bi("Estado visible", "Visible status"), bi("Los saldos y marcas guardados en la cadena son públicos.", "Balances and marks stored on-chain are public.")),
  ],
  mapAndPassport: [
    step("#nav", bi("Mapa de Bolivia", "Map of Bolivia"), bi("Explora los círculos registrados por departamento.", "Explore registered circles by department.")),
    step("#nav", bi("Tu pasaporte", "Your passport"), bi("Reúne las marcas de participación de los círculos donde declaraste tu membresía.", "It gathers participation marks from circles where you declared your membership.")),
  ],
  map: [step("#nav", bi("Mapa de Bolivia", "Map of Bolivia"), bi("Explora los círculos registrados por departamento.", "Explore registered circles by department."))],
  passport: [step("#nav", bi("Pasaporte", "Passport"), bi("Revisa las marcas reunidas de tus círculos. No es una aprobación de crédito.", "Review marks gathered from your circles. This is not a credit approval."))],
});

function localized(value, lang) {
  if (typeof value === "string") return value;
  return pickLang(value, lang) || value?.en || "";
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
  const shade = document.createElement("div"); shade.className = "aw-guide-tour-shade";
  const spot = document.createElement("div"); spot.className = "aw-guide-tour-spot"; spot.setAttribute("aria-hidden", "true");
  const card = document.createElement("section"); card.className = "aw-guide-tour-card";
  card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-label", pickLang({ es: "Recorrido guiado", en: "Guided tour", pt: "Tour guiado", qu: "Puriy yachay", ay: "Uñjañ thakhi", gn: "Guata hag̃ua ñembo'e" }, lang));
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
    ended = true; resizeObserver?.disconnect(); window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); document.removeEventListener("keydown", keydown); window.removeEventListener("awayu:lang", onLanguage);
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
    const heading = document.createElement("h2"); heading.textContent = localized(current.title, lang); heading.id = "aw-guide-tour-title";
    card.setAttribute("aria-labelledby", heading.id);
    const text = document.createElement("p"); text.textContent = localized(current.text, lang);
    card.append(arrow, heading, text);
    if (current.video) {
      const video = document.createElement("video"); video.src = current.video; video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true; video.setAttribute("playsinline", ""); video.setAttribute("aria-label", pickLang({ es: "Video tutorial", en: "Tutorial video", pt: "Vídeo tutorial" }, lang));
      video.addEventListener("error", () => video.remove(), { once: true }); card.append(video);
    }
    const controls = document.createElement("div"); controls.className = "aw-guide-tour-actions";
    const count = document.createElement("span"); count.className = "aw-guide-tour-count"; count.textContent = `${index + 1} / ${steps.length}`;
    const group = document.createElement("div"); group.style.cssText = "display:flex;gap:7px";
    const skip = document.createElement("button"); skip.type = "button"; skip.textContent = pickLang({ es: "Saltar", en: "Skip", pt: "Pular" }, lang); skip.addEventListener("click", () => finish(false));
    const prev = document.createElement("button"); prev.type = "button"; prev.textContent = pickLang({ es: "Anterior", en: "Previous", pt: "Anterior" }, lang); prev.disabled = index === 0; prev.addEventListener("click", () => { index = Math.max(0, index - 1); render(); });
    const next = document.createElement("button"); next.type = "button"; next.className = "aw-guide-tour-next"; next.textContent = index === steps.length - 1 ? pickLang({ es: "Terminar", en: "Finish", pt: "Concluir" }, lang) : pickLang({ es: "Siguiente", en: "Next", pt: "Próximo" }, lang); next.addEventListener("click", () => { if (index + 1 >= steps.length) finish(true); else { index++; render(); } });
    group.append(skip, prev, next); controls.append(count, group); card.append(controls);
    requestAnimationFrame(position); next.focus();
    if (resizeObserver) resizeObserver.disconnect();
    if (typeof ResizeObserver !== "undefined") { resizeObserver = new ResizeObserver(position); resizeObserver.observe(target); }
  };
  const onLanguage = (event) => { lang = event.detail?.lang || "es"; render(); };
  function keydown(event) {
    if (event.key === "Escape") { event.preventDefault(); finish(false); }
    else if (event.key === "ArrowRight") { event.preventDefault(); buttons().at(-1)?.click(); }
    else if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); buttons().at(-2)?.click(); }
    else if (event.key === "Tab") { const items = buttons(); const first = items[0], last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  }
  document.addEventListener("keydown", keydown); window.addEventListener("resize", position); window.addEventListener("scroll", position, true); window.addEventListener("awayu:lang", onLanguage); render();
  return { end: () => finish(false) };
}
