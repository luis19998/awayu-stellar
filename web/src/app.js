// Punto de entrada liviano: estilos, idioma y panel. La escena 3D del círculo,
// three.js y el SDK de Stellar (main.js) se cargan cuando el navegador está
// libre o cuando se abre una sección que los necesita.
import "./style.css";
import "./features.css";
import "./dashboard.css";
import { getLang, initLang, pickLang, t } from "./i18n.js";
import { initDashboard } from "./dashboard.js";
import { structuredData } from "./seo.js";
import { state } from "./state.js";
import { mountSettings } from "./settings/panel.js";

initLang();
state.lang = getLang();
mountSettings();
// Bienvenida para quien entra por primera vez (una sola vez por perfil)
import("./guide/welcome.js").then(({ hasSeenWelcome, openWelcome }) => {
  if (hasSeenWelcome() || new URLSearchParams(location.search).has("nowelcome")) return;
  setTimeout(() => openWelcome({
    onTour: () => {
      try { localStorage.removeItem("awayu.guide.tour.seen.firstVisit"); } catch {}
      if (location.hash === "#/circulo") window.dispatchEvent(new Event("awayu:start-tour"));
      else location.hash = "#/circulo";
    },
    onDone: () => { try { localStorage.setItem("awayu.guide.tour.seen.firstVisit", "1"); } catch {} },
  }), 700);
});

import("./custom/studio.js").then(({ applyUiPrefs }) => applyUiPrefs());

// Tras un despliegue nuevo, una pestaña vieja puede pedir archivos que ya no
// existen: se recarga una sola vez para traer la versión actual.
addEventListener("vite:preloadError", (e) => {
  e.preventDefault?.();
  try {
    if (sessionStorage.getItem("awayu.reloaded")) return;
    sessionStorage.setItem("awayu.reloaded", "1");
  } catch {}
  location.reload();
});

// Datos estructurados para buscadores (JSON-LD)
try {
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(structuredData());
  document.head.appendChild(ld);
} catch {}

// ---------- Ayuda: botón flotante con recorridos y mini tutoriales ----------
const fab = document.querySelector("#help-fab");
const helpMenu = document.querySelector("#help-menu");
const TOPIC_ORDER = ["wallet", "contribute", "payout", "guarantee", "create", "studio", "qr-invite", "qr-receive", "qr-scan", "qr-bank", "customize", "simulator", "ayni-join", "ayni-contribute", "ayni-request", "ayni-vote", "minka-fund", "minka-milestone", "alasitas-create", "alasitas-save", "live-mode", "map", "passport", "risk", "games", "verify-draw", "verify-check", "verify-report", "settings", "amawta"];
async function fillHelpMenu() {
  const { HELP_TOPICS, ROUTE_TOPICS } = await import("./guide/help.js");
  const lang = getLang();
  // Primero los tutoriales de la sección abierta; después el resto
  const here = (ROUTE_TOPICS?.[document.body.dataset.route] || []).filter((id) => HELP_TOPICS[id]);
  const rest = TOPIC_ORDER.filter((id) => HELP_TOPICS[id] && !here.includes(id));
  const item = (id) => `<button role="menuitem" data-topic="${id}">🎬 ${pickLang(HELP_TOPICS[id].title, lang)}</button>`;
  helpMenu.innerHTML = `<button role="menuitem" data-tour="firstVisit">▶ ${t("Recorrido de bienvenida")}</button>` +
    (here.length ? `<div class="grp" role="presentation">${t("En esta sección")}</div>${here.map(item).join("")}<div class="grp" role="presentation">${t("Todos los tutoriales")}</div>` : "") +
    rest.map(item).join("");
}
fab?.addEventListener("click", async () => {
  const open = helpMenu.hidden;
  if (open) await fillHelpMenu();
  helpMenu.hidden = !open;
  fab.setAttribute("aria-expanded", String(open));
});
helpMenu?.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  helpMenu.hidden = true;
  fab.setAttribute("aria-expanded", "false");
  if (b.dataset.topic) {
    const { openHelp } = await import("./guide/help.js");
    openHelp(b.dataset.topic, { lang: getLang(), anchor: fab });
  } else if (b.dataset.tour) {
    if (!location.hash.startsWith("#/circulo")) location.hash = "#/circulo";
    const { startTour, TOURS } = await import("./guide/tour.js");
    setTimeout(() => startTour(TOURS[b.dataset.tour], { lang: getLang(), id: b.dataset.tour }), 900);
  }
});

let appPromise = null;
const app = () => (appPromise ??= import("./main.js").then((m) => m.circleApp));

// Acciones del panel de configuración: cargan el círculo si aún no está y lo piden
for (const [name, run] of [
  ["awayu:pick-figure", (c) => c.pickFigure({ profile: true })],
  ["awayu:open-studio", (c) => c.openStudio()],
  ["awayu:connect-wallet", (c) => c.connectWallet()],
  ["awayu:disconnect-wallet", (c) => c.disconnectWallet()],
  ["awayu:start-tour", (c) => c.startTour()],
]) addEventListener(name, () => app().then(run).catch(() => {}));

initDashboard({
  onCircleActive: (on) => {
    if (on) app().then((a) => a.setActive(true));
    else appPromise?.then((a) => a.setActive(false));
  },
  openCircle: (id) => app().then((a) => a.openCircle(id)),
  connectWallet: () => app().then((a) => a.connectWallet()),
  ensureApp: () => app(),
});

import("./guide/proactive.js").then(({ mountProactive }) => mountProactive({ state, getLang }));

// Si se entra por un enlace de círculo (?c=…), se carga ya; si no, con la
// primera interacción (o a los 8 s), para que la portada aparezca al instante.
if (new URLSearchParams(location.search).has("c")) app();
else {
  const go = () => {
    for (const ev of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"]) removeEventListener(ev, go);
    app();
  };
  for (const ev of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"]) addEventListener(ev, go, { once: true, passive: true });
  setTimeout(go, 8000);
}
