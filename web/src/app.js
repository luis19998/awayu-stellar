// Punto de entrada liviano: estilos, idioma y panel. La escena 3D del círculo,
// three.js y el SDK de Stellar (main.js) se cargan cuando el navegador está
// libre o cuando se abre una sección que los necesita.
import "./style.css";
import "./features.css";
import "./dashboard.css";
import { initLang } from "./i18n.js";
import { initDashboard } from "./dashboard.js";
import { structuredData } from "./seo.js";

initLang();

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

let appPromise = null;
const app = () => (appPromise ??= import("./main.js").then((m) => m.circleApp));

initDashboard({
  onCircleActive: (on) => {
    if (on) app().then((a) => a.setActive(true));
    else appPromise?.then((a) => a.setActive(false));
  },
  openCircle: (id) => app().then((a) => a.openCircle(id)),
  connectWallet: () => app().then((a) => a.connectWallet()),
  ensureApp: () => app(),
});

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
