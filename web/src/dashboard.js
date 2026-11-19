// Panel de Awayu: navegación por secciones (#/inicio, #/circulo, #/mapa,
// #/billetera, #/riesgo, #/juegos, #/amawta, #/ecosistema, #/pulso).
// La vista del círculo 3D vive en main.js; el resto se monta acá bajo demanda.
import { state, subscribe } from "./state.js";
import { t, getLang } from "./i18n.js";
import { score } from "./model.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtN = (n, d = 0) => Number(n || 0).toLocaleString(getLang() === "en" ? "en-US" : "es-BO", { maximumFractionDigits: d });

export const ROUTES = [
  { id: "inicio", icon: "◆", label: "Inicio" },
  { id: "circulo", icon: "◎", label: "Círculo 3D" },
  { id: "mapa", icon: "⬢", label: "Mapa de Bolivia" },
  { id: "billetera", icon: "◉", label: "Billetera y pasaporte" },
  { id: "riesgo", icon: "◐", label: "Probabilidades" },
  { id: "juegos", icon: "✦", label: "Juegos" },
  { id: "amawta", icon: "✺", label: "Amawta (IA)" },
  { id: "ecosistema", icon: "⬡", label: "Ecosistema" },
  { id: "pulso", icon: "◌", label: "Pulso de Stellar" },
];

let current = null;
let mounted = null; // { destroy }
let token = 0; // cambia con cada navegación: lo que llega tarde de otra sección se descarta
const alive = (tk) => tk === token;
/** Guarda la vista montada solo si su sección sigue a la vista; si no, la destruye. */
function adopt(tk, instance) {
  if (alive(tk)) mounted = instance;
  else instance?.destroy?.();
  return instance;
}
let hooks = {};

/** hooks: { onCircleActive(bool), openCircle(contractId), connectWallet() } */
export function initDashboard(h) {
  hooks = h;
  const nav = $("#nav");
  nav.innerHTML = ROUTES.map(
    (r) => `<a href="#/${r.id}" data-route="${r.id}" title="${esc(t(r.label))}"><span class="ic" aria-hidden="true">${r.icon}</span><span class="lb">${esc(t(r.label))}</span></a>`
  ).join("");
  addEventListener("hashchange", route);
  route();
  subscribe(() => {
    if (current === "riesgo") renderRisk();
  });
}

export function relabel() {
  document.querySelectorAll("#nav a").forEach((a) => {
    const r = ROUTES.find((x) => x.id === a.dataset.route);
    a.title = t(r.label);
    a.querySelector(".lb").textContent = t(r.label);
  });
  if (current && current !== "circulo") show(current, true);
}

function route() {
  const id = (location.hash.match(/^#\/([a-z]+)/) || [])[1] || (new URLSearchParams(location.search).get("c") ? "circulo" : "inicio");
  show(id);
}

function show(id, force = false) {
  if (!ROUTES.some((r) => r.id === id)) id = "inicio";
  if (id === current && !force) return;
  current = id;
  token += 1;
  document.querySelectorAll("#nav a").forEach((a) => {
    a.classList.toggle("on", a.dataset.route === id);
    if (a.dataset.route === id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  mounted?.destroy?.();
  mounted = null;
  const isCircle = id === "circulo";
  document.body.dataset.route = id;
  hooks.onCircleActive?.(isCircle);
  const view = $("#view");
  view.hidden = isCircle;
  if (isCircle) return;
  const tk = token;
  const swap = () => {
    view.innerHTML = "";
    view.scrollTop = 0;
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
    return VIEWS[id]?.(view, tk);
  };
  // Transición entre secciones con la API View Transitions cuando existe
  const calm = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let rendered;
  if (document.startViewTransition && !calm) {
    rendered = new Promise((done) => document.startViewTransition(() => done(swap())));
  } else rendered = Promise.resolve(swap());
  rendered.then(() => {
    // Lectores de pantalla: el foco va al título de la sección nueva
    const h = alive(tk) && view.querySelector("h1");
    if (h && document.activeElement?.closest?.("#nav")) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  });
}

// ---------------- Vistas ----------------

const VIEWS = {
  inicio: renderHome,
  mapa: renderMap,
  billetera: renderWallet,
  riesgo: (v) => {
    v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("Probabilidades del círculo")}</h1>
      <p>${t("Monte Carlo con la confiabilidad de cada miembro (modelo Beta-Bernoulli) y las garantías depositadas.")}</p></header>
      <div id="risk"></div></section>`;
    hooks.ensureApp?.();
    renderRisk();
  },
  juegos: renderGames,
  amawta: renderAmawta,
  ecosistema: renderEcosystem,
  pulso: async (v, tk) => {
    v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("Pulso de Stellar")}</h1>
      <p>${t("Cada anillo es un ledger de la testnet de Stellar cerrándose en vivo, cada ~5 segundos.")}</p></header>
      <div class="stage-box tall" id="pulse-box"></div></section>`;
    const m = await import("./views/pulso.js");
    if (!alive(tk)) return;
    adopt(tk, m.mount($("#pulse-box"), { lang: getLang() }));
  },
};

async function renderHome(v, tk = token) {
  v.innerHTML = `
  <section class="hero" style="--bg:url('/img/uyuni.webp')">
    <canvas class="loom" aria-hidden="true"></canvas>
    <div class="hero-in">
      <p class="eyebrow">${t("Hackatón Stellar Bolivia 2026 · Soroban · Pollar · Vaquita")}</p>
      <h1>${t("El pasanaku que teje tu historial")}</h1>
      <p class="lead">${t("Ahorro rotativo en dólares digitales sobre Stellar. El turno lo sortea la red, la garantía cubre a quien falla y cada pago teje un aguayo: tu historial de cumplimiento, portable y verificable.")}</p>
      <div class="cta">
        <a class="btn primary" href="#/circulo">${t("Entrar al círculo 3D")}</a>
        <a class="btn" href="#/mapa">${t("Ver la red en Bolivia")}</a>
        <button class="btn ghost" id="home-wallet">${t("Conectar billetera")}</button>
      </div>
    </div>
  </section>
  <section class="kpis" id="kpis">
    ${["Círculos registrados", "Miembros", "Reputación promedio", "Avales comunitarios", "Ledger de Stellar"].map((k, i) => `<div class="kpi" style="--d:${i * 80}ms"><span>${t(k)}</span><b data-k="${i}">–</b></div>`).join("")}
  </section>
  <section class="how">
    <h2>${t("Cómo funciona")}</h2>
    <div class="steps">
      ${[
        ["1", "Armás tu círculo", "Elegís cuota, duración de la ronda y miembros. Se despliega un contrato Soroban y se registra en la memoria colectiva on-chain.", "/img/alasitas.webp"],
        ["2", "La red sortea el turno", "El orden de cobro sale del PRNG de Stellar: nadie elige quién cobra primero.", "/img/cochabamba.webp"],
        ["3", "Cada pago teje tu aguayo", "A tiempo, tarde, faltó o cubierto por garantía: cada ronda deja una capa de tejido verificable.", "/img/aguayo.webp"],
        ["4", "Tu historial viaja con vos", "El pasaporte junta tu cumplimiento en todos los círculos: evidencia para cooperativas, sin prometer créditos.", "/img/uyuni.webp"],
      ].map(([n, h, p, img], i) => `<article class="step" style="--d:${i * 90}ms"><div class="ph" style="background-image:url('${img}')"><b>${n}</b></div><h3>${t(h)}</h3><p>${t(p)}</p></article>`).join("")}
    </div>
  </section>
  <section class="eco-strip">
    ${["Stellar", "Soroban", "Pollar", "Vaquita", "Blend", "DeFindex", "Trustless Work", "Freighter", "Horizon", "n8n", "Gemini"].map((x) => `<span>${x}</span>`).join("")}
  </section>
  <footer class="credits" id="credits"></footer>`;
  $("#home-wallet").onclick = () => hooks.connectWallet?.();
  const { mountLoom, tilt } = await import("./motion/loom.js");
  const loom = mountLoom(v.querySelector(".loom"));
  const untilt = tilt(v);
  adopt(tk, { destroy: () => { loom.destroy(); untilt(); } });
  fetch("/img/creditos.json").then((r) => r.json()).then((credits) => {
    const el = alive(tk) && $("#credits");
    if (el) el.innerHTML = `${t("Fotos")}: ${Object.values(credits).map((c) => `<a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.title.replace(/^File:/, ""))}</a> (${esc(c.author)}, ${esc(c.license)})`).join(" · ")}`;
  }).catch(() => {});
  fillKpis();
}

async function fillKpis() {
  const tk = token;
  const set = (k, val) => {
    if (!alive(tk)) return;
    const el = document.querySelector(`#kpis b[data-k="${k}"]`);
    if (!el) return;
    countUp(el, val);
  };
  try {
    const { readRegistry } = await import("./chain.js");
    const dep = state.deployment || (await (await import("./chain.js")).loadDeployment());
    const list = await readRegistry(dep);
    set(0, list.length);
    set(1, list.reduce((a, c) => a + c.members, 0));
    const scored = list.filter((c) => c.score);
    set(2, scored.length ? Math.round(scored.reduce((a, c) => a + c.score, 0) / scored.length) : 0);
    set(3, list.reduce((a, c) => a + c.endorsements, 0));
  } catch {}
  try {
    const r = await fetch("https://horizon-testnet.stellar.org/ledgers?order=desc&limit=1").then((x) => x.json());
    set(4, Number(r._embedded.records[0].sequence));
  } catch {}
}

function countUp(el, to) {
  const t0 = performance.now();
  const from = 0;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 1100);
    el.textContent = fmtN(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function renderMap(v, tk) {
  v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("La red de pasanakus en Bolivia")}</h1>
    <p>${t("Leído del contrato registro: la memoria colectiva on-chain de Awayu. Tocá un pin para abrir ese círculo.")}</p></header>
    <div class="stage-box tall" id="map-box"></div><div id="map-list" class="cards"></div></section>`;
  const [{ mount }, chain] = await Promise.all([import("./views/mapa3d.js"), import("./chain.js")]);
  let circles = [];
  if (!alive(tk)) return;
  const map = adopt(tk, mount($("#map-box"), { circles, lang: getLang(), onSelect: (c) => hooks.openCircle?.(c.contractId) }));
  try {
    const dep = state.deployment || (await chain.loadDeployment());
    circles = await chain.readRegistry(dep);
    if (!alive(tk)) return;
    map?.update?.(circles);
  } catch {}
  if (!alive(tk)) return;
  $("#map-list").innerHTML = circles
    .map((c) => `<button class="card-c" data-c="${esc(c.contractId)}"><b>${esc(c.name)}</b><span>${esc(regionName(c.region))} · ${c.members} ${t("miembros")} · ${c.score} pts · ${c.endorsements} ${t("avales")}</span></button>`)
    .join("") || `<p class="muted">${t("Todavía no hay círculos registrados.")}</p>`;
  $("#map-list").onclick = (e) => {
    const b = e.target.closest("[data-c]");
    if (b) hooks.openCircle?.(b.dataset.c);
  };
}

const REGIONS = { lpz: "La Paz", cbba: "Cochabamba", scz: "Santa Cruz", oru: "Oruro", pts: "Potosí", chq: "Chuquisaca", trj: "Tarija", ben: "Beni", pnd: "Pando", otro: "Otro" };
export const regionName = (r) => REGIONS[r] || r;
export const REGION_IDS = Object.keys(REGIONS);

async function renderWallet(v, tk) {
  const addr = state.address;
  v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("Tu billetera y tu pasaporte")}</h1>
    <p>${addr ? t("Datos en vivo de Stellar testnet (Horizon) y tu historial en todos los círculos del registro.") : t("Modo demo: conectá tu billetera para ver tus datos reales.")}</p>
    ${addr ? "" : `<button class="btn primary" id="w-connect">${t("Conectar billetera")}</button>`}</header>
    <div class="grid2"><div class="stage-box tall" id="wallet-box"></div><div id="passport" class="passport"></div></div></section>`;
  $("#w-connect")?.addEventListener("click", () => hooks.connectWallet?.());
  const [{ mount }, hz, chain] = await Promise.all([import("./views/billetera3d.js"), import("./horizon.js"), import("./chain.js")]);
  let data = { lang: getLang() };
  let passport = { circles: [], history: [], score: 0 };
  if (addr) {
    const dep = state.deployment || (await chain.loadDeployment());
    const [acct, pays, pp] = await Promise.all([
      hz.loadAccount(addr).catch(() => null),
      hz.recentPayments(addr, 15).catch(() => []),
      chain.readPassport(dep, addr).catch(() => passport),
    ]);
    passport = pp;
    data = { ...data, address: addr, balances: acct?.balances, payments: pays, circles: pp.circles.map((c, i) => ({ name: `${t("Círculo")} ${i + 1}`, contribution: 10 + c.history.length * 5 })), reputation: pp.score };
  }
  if (!alive(tk)) return;
  adopt(tk, mount($("#wallet-box"), data));
  const { historyStripDataURL } = await import("./aguayo.js");
  const strip = passport.history.length ? `<img class="strip" alt="" src="${historyStripDataURL(passport.history, 520, 34)}">` : "";
  $("#passport").innerHTML = `<h2>${t("Pasaporte de reputación")}</h2>
    <div class="score-ring" style="--p:${passport.score}"><b>${passport.score}</b><span>/100</span></div>
    ${strip}
    <p>${t("{n} rondas en {c} círculos", { n: passport.history.length, c: passport.circles.length })}</p>
    <p class="muted">${t("El pasaporte junta tus marcas de todos los círculos donde te uniste en el registro. Es evidencia de pagos verificable, no una aprobación de crédito.")}</p>`;
}

function renderRisk() {
  const box = $("#risk");
  if (!box) return;
  const c = state.circle;
  if (!c) return void (box.innerHTML = `<p class="muted">${t("Abrí un círculo primero.")}</p>`);
  import("./risk.js").then(({ memberReliability, simulateCircle, riskLevel, turnProbabilities }) => {
    const sim = simulateCircle(c, { runs: 4000, seed: 7 });
    const p = sim.completionProbability || 0;
    const lvl = t({ bajo: "riesgo bajo", medio: "riesgo medio", alto: "riesgo alto" }[riskLevel(p)]);
    const rows = c.members
      .map((m) => {
        const r = memberReliability(m.history);
        return `<div class="rel"><span class="nm">${esc(m.name)}</span>
          <div class="bar"><i style="left:${(r.low * 100).toFixed(1)}%;width:${((r.high - r.low) * 100).toFixed(1)}%"></i><b style="left:${(r.mean * 100).toFixed(1)}%"></b></div>
          <span class="pc">${Math.round(r.mean * 100)}%</span></div>`;
      })
      .join("");
    const arr = (sim.missDistribution || []).map((d) => d.probability);
    const max = Math.max(1e-9, ...arr);
    const tp = turnProbabilities(c.order.length);
    box.innerHTML = `<div class="grid2">
      <div class="card"><h2>${t("Probabilidad de completar el círculo")}</h2>
        <div class="score-ring big" style="--p:${Math.round(p * 100)}"><b>${Math.round(p * 100)}%</b><span>${esc(lvl)}</span></div>
        <p class="muted">${t("Simulación de {n} futuros posibles de las rondas que faltan, con semilla fija (reproducible).", { n: "4.000" })}</p></div>
      <div class="card"><h2>${t("Confiabilidad de cada miembro")}</h2>${rows}
        <p class="muted">${t("Barra: intervalo creíble del 90 %. Punto: valor esperado.")}</p></div>
      <div class="card"><h2>${t("Cantidad de faltas esperadas")}</h2>
        <div class="hist">${arr.map((x, i) => `<div><i style="height:${((x / max) * 100).toFixed(1)}%"></i><span>${i}</span></div>`).join("")}</div></div>
      <div class="card"><h2>${t("Sorteo justo del turno")}</h2>
        <p>${t("Cada persona tiene la misma probabilidad de cobrar en cada posición: {p}.", { p: `1/${c.order.length} ≈ ${(tp[0] || 0).toFixed(3)}` })}</p>
        <p class="muted">${t("El orden lo fija el PRNG de la red al crear el contrato; nadie lo elige.")}</p>
        <a class="btn" href="#/juegos">${t("Probalo en el juego del sorteo")}</a></div>
    </div>`;
  });
}

async function renderGames(v) {
  const games = [
    ["tejido", "Tejé tu aguayo"],
    ["quiz", "Pasanaku y Stellar"],
    ["ruleta", "El sorteo justo"],
  ];
  v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("Juegos para aprender")}</h1>
    <p>${t("Sin apuestas ni dinero real: memoria, finanzas y probabilidades.")}</p>
    <div class="tabs">${games.map(([id, l], i) => `<button data-g="${id}" class="${i ? "" : "on"}">${t(l)}</button>`).join("")}</div>
    <p class="best">${t("Mejor puntaje")}: <b id="best">0</b></p></header>
    <div class="game-box" id="game-box"></div></section>`;
  const tk = token;
  let gameSeq = 0;
  const load = async (id) => {
    const seq = ++gameSeq;
    mounted?.destroy?.();
    mounted = null;
    $("#game-box").innerHTML = "";
    const m = await import(`./games/${id}.js`);
    if (!alive(tk) || seq !== gameSeq) return;
    mounted = m.mount($("#game-box"), {
      lang: getLang(),
      onScore: (s) => {
        const val = typeof s === "number" ? s : s?.score ?? 0;
        let best = 0;
        try {
          best = Math.max(Number(localStorage.getItem("awayu.best." + id) || 0), val);
          localStorage.setItem("awayu.best." + id, String(best));
        } catch {}
        $("#best").textContent = fmtN(best);
      },
    });
    try {
      $("#best").textContent = localStorage.getItem("awayu.best." + id) || "0";
    } catch {}
  };
  v.querySelector(".tabs").onclick = (e) => {
    const b = e.target.closest("[data-g]");
    if (!b) return;
    v.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    load(b.dataset.g);
  };
  load("tejido");
}

function circleContext() {
  const c = state.circle;
  if (!c) return "";
  return JSON.stringify({
    modo: c.mode, cuota: c.amount, token: c.token, ronda: c.round + 1, rondas: c.order.length,
    miembros: c.members.map((m) => ({ nombre: m.name, puntaje: score(m.history), garantia: m.guarantee || 0 })),
  });
}

function renderAmawta(v) {
  const sugg = [
    "¿Qué pasa si alguien no paga?",
    "¿Cómo funciona la garantía?",
    "¿Cómo conecto Freighter?",
    "¿Cómo se calcula el puntaje?",
    "¿Qué es testnet?",
  ];
  v.innerHTML = `<section class="pane chat"><header class="pane-h"><h1>Amawta</h1>
    <p>${t("El sabio de Awayu (amawta en quechua): responde sobre pasanakus, garantías y Stellar con el contexto de tu círculo. No da consejos de inversión.")}</p></header>
    <div class="msgs" id="msgs"><div class="msg ai">${t("¡Hola! Soy Amawta. Preguntame sobre tu círculo, la garantía o cómo usar Stellar.")}</div></div>
    <div class="sugg">${sugg.map((s) => `<button>${esc(t(s))}</button>`).join("")}</div>
    <form id="ask" class="ask"><input name="q" maxlength="500" autocomplete="off" placeholder="${esc(t("Escribí tu pregunta…"))}" /><button class="btn primary">${t("Preguntar")}</button></form></section>`;
  const msgs = $("#msgs");
  const add = (cls, text) => {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  };
  const ask = async (q) => {
    if (!q.trim()) return;
    add("me", q);
    const wait = add("ai typing", "…");
    let res;
    try {
      const r = await fetch("/api/amawta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, lang: getLang(), context: circleContext() }),
      });
      if (!r.ok) throw new Error(String(r.status));
      res = await r.json();
    } catch {
      const { localAnswer } = await import("../server/ai.js");
      res = { answer: localAnswer(q), source: "local" };
    }
    wait.classList.remove("typing");
    wait.textContent = res.answer || res.error || "…";
    const tag = document.createElement("small");
    tag.textContent = res.source === "gemini" ? "Gemini" : t("respuesta local");
    wait.appendChild(tag);
  };
  v.querySelector(".sugg").onclick = (e) => e.target.matches("button") && ask(e.target.textContent);
  $("#ask").onsubmit = (e) => {
    e.preventDefault();
    const q = e.target.q.value;
    e.target.q.value = "";
    ask(q);
  };
}

async function renderEcosystem(v) {
  const dep = state.deployment || (await (await import("./chain.js")).loadDeployment().catch(() => null));
  const items = [
    ["stellar-rpc", "Stellar RPC (Soroban)", "Lectura y simulación de contratos, envío de transacciones.", "https://soroban-testnet.stellar.org"],
    ["horizon", "Horizon", "Saldos, pagos y ledgers en vivo para la billetera y el pulso.", "https://horizon-testnet.stellar.org"],
    ["pasanaku", "Contrato pasanaku v3", "Turno sorteado, aportes, pozo, garantías, alias y marcas.", dep?.contractId],
    ["registro", "Contrato registro", "Memoria colectiva: círculos, miembros, regiones y avales.", dep?.registro],
    ["freighter", "Freighter", "Billetera de extensión para firmar en testnet.", null],
    ["pollar", "Pollar", "Login con Google o correo y billetera sin frase semilla; Earn (Blend/DeFindex) y rampas.", null],
    ["vaquita", "Vaquita · Blend · DeFindex", "Rendimiento del pozo mientras espera (vía Pollar Earn). En la demo, proyección.", null],
    ["trustless", "Trustless Work", "Escrow como servicio sobre Soroban para garantías por hitos (siguiente paso).", null],
    ["amawta", "Amawta · Gemini", "Asistente con contexto del círculo y respaldo local sin conexión.", "/api/amawta"],
    ["n8n", "n8n", "Recordatorios de plazo, resumen semanal y bienvenida (flujos importables).", "/api/eventos"],
  ];
  v.innerHTML = `<section class="pane"><header class="pane-h"><h1>${t("Ecosistema integrado")}</h1>
    <p>${t("Estado en vivo de cada pieza que usa Awayu.")}</p></header>
    <div class="eco">${items.map(([id, name, desc, url]) => `<article class="eco-c" data-id="${id}"><i class="dot"></i><h3>${esc(name)}</h3><p>${esc(t(desc))}</p><small class="st">${t("comprobando…")}</small>${url && url.startsWith("C") ? `<a href="https://stellar.expert/explorer/testnet/contract/${esc(url)}" target="_blank" rel="noopener">${esc(url.slice(0, 6))}…${esc(url.slice(-4))} ↗</a>` : ""}</article>`).join("")}</div></section>`;
  const mark = (id, ok, text) => {
    const c = v.querySelector(`[data-id="${id}"]`);
    if (!c) return;
    c.classList.add(ok === true ? "ok" : ok === false ? "bad" : "info");
    c.querySelector(".st").textContent = text;
  };
  const timed = async (fn) => {
    const t0 = performance.now();
    await fn();
    return Math.round(performance.now() - t0);
  };
  timed(() => fetch("https://soroban-testnet.stellar.org", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger" }) }).then((r) => r.json()))
    .then((ms) => mark("stellar-rpc", true, `${t("en línea")} · ${ms} ms`)).catch(() => mark("stellar-rpc", false, t("sin respuesta")));
  timed(() => fetch("https://horizon-testnet.stellar.org/").then((r) => r.json()))
    .then((ms) => mark("horizon", true, `${t("en línea")} · ${ms} ms`)).catch(() => mark("horizon", false, t("sin respuesta")));
  const chain = await import("./chain.js");
  if (dep?.contractId) chain.readCircle(dep).then((c) => mark("pasanaku", true, `v${c.version} · ${c.members.length} ${t("miembros")}`)).catch(() => mark("pasanaku", false, t("sin respuesta")));
  if (dep?.registro) chain.readRegistry(dep).then((l) => mark("registro", true, `${l.length} ${t("círculos")}`)).catch(() => mark("registro", false, t("sin respuesta")));
  else mark("registro", null, t("sin desplegar"));
  import("@stellar/freighter-api").then((f) => f.isConnected()).then((r) => mark("freighter", r?.isConnected ? true : null, r?.isConnected ? t("instalada") : t("no instalada en este navegador"))).catch(() => mark("freighter", null, t("no instalada en este navegador")));
  const { pollarEnabled } = await import("./wallet.js");
  mark("pollar", pollarEnabled ? true : null, pollarEnabled ? t("configurado") : t("falta la clave publicable"));
  mark("vaquita", null, pollarEnabled ? t("disponible vía Pollar Earn") : t("proyección (necesita Pollar)"));
  mark("trustless", null, t("planificado: escrow de garantías"));
  fetch("/api/amawta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "¿Qué es Awayu?" }) })
    .then((r) => r.json()).then((j) => mark("amawta", true, j.source === "gemini" ? "Gemini" : t("respuesta local"))).catch(() => mark("amawta", null, t("sin servidor: respaldo local en el navegador")));
  fetch("/api/eventos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "plazo_cerca", circle: dep?.contractId || "demo", data: { prueba: true } }) })
    .then((r) => r.json()).then((j) => mark("n8n", j.forwarded ? true : null, j.forwarded ? t("conectado") : t("falta N8N_WEBHOOK_URL"))).catch(() => mark("n8n", null, t("sin servidor")));
}
