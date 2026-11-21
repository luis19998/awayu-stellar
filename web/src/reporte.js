// Reporte de historial de pagos para una cooperativa o IFD. Lee todo en vivo
// de los contratos (registro → círculos → history/score), sin servidor propio:
// la entidad puede comprobar cada dato en un explorador de Stellar.
//   /reporte.html?m=G…            cuenta a reportar
//   /reporte.html?m=G…&c=C…       limitar a un círculo
import "./reporte.css";
import { loadDeployment, readCircle, readPassport, readRegistry, explorerUrl, short } from "./chain.js";

const MARK = {
  1: ["A tiempo", "ok"],
  2: ["Tarde", "late"],
  3: ["Faltó", "miss"],
  4: ["Cubierto con su garantía", "cover"],
};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const labUrl = (id) =>
  `https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=${id};;`;

export function summarize(history) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const m of history) if (counts[m] !== undefined) counts[m] += 1;
  const pts = { 1: 100, 2: 50, 4: 25 };
  const score = history.length ? Math.round(history.reduce((a, m) => a + (pts[m] || 0), 0) / history.length) : 0;
  return { counts, total: history.length, score };
}

async function defaultAccount(dep) {
  try {
    const ev = await (await fetch("/evidencia.json", { cache: "no-store" })).json();
    if (ev?.accounts?.Bruno) return ev.accounts.Bruno;
  } catch { /* sin evidencia */ }
  return Object.values(dep.members || {})[0] || "";
}

async function render(address, onlyCircle) {
  const body = $("#r-body");
  body.innerHTML = `<p class="r-muted">Leyendo los contratos en Stellar…</p>`;
  const dep = await loadDeployment();
  if (!dep) return void (body.innerHTML = `<p class="r-err">No se pudo cargar la configuración de testnet.</p>`);
  const [passport, registry] = await Promise.all([readPassport(dep, address), readRegistry(dep).catch(() => [])]);
  const names = new Map(registry.map((r) => [r.contractId, r]));
  let circles = passport.circles;
  if (onlyCircle) circles = circles.filter((c) => c.contractId === onlyCircle);
  const details = await Promise.all(circles.map(async (c) => ({ ...c, info: await readCircle(dep, c.contractId).catch(() => null) })));
  const all = summarize(details.flatMap((c) => c.history));
  const now = new Date();

  const rows = details.map((c) => {
    const s = summarize(c.history);
    const reg = names.get(c.contractId);
    const token = c.info?.token || "token";
    const marks = c.history.map((m, i) => `<span class="r-mark ${MARK[m]?.[1] || ""}" title="Ronda ${i + 1}: ${esc(MARK[m]?.[0] || "?")}">${i + 1}</span>`).join("");
    return `<article class="r-circle">
      <header><h3>${esc(reg?.name || "Pasanaku")}</h3><span class="r-pill">${esc(reg?.region || "")}</span></header>
      <dl>
        <dt>Contrato</dt><dd><a href="${explorerUrl(c.contractId)}" target="_blank" rel="noopener">${esc(short(c.contractId))}</a> · <a href="${labUrl(c.contractId)}" target="_blank" rel="noopener">Stellar Lab</a></dd>
        <dt>Cuota</dt><dd>${c.info ? `${c.info.amount} ${esc(token)} cada ${c.info.periodSeconds >= 86400 ? `${Math.round(c.info.periodDays)} días` : `${c.info.periodSeconds} s (círculo de prueba)`}` : "—"}</dd>
        <dt>Miembros</dt><dd>${c.info ? c.info.members.length : "—"}</dd>
        <dt>Rondas con marca</dt><dd>${s.total}</dd>
        <dt>Puntaje del contrato</dt><dd><b>${s.score}</b> / 100</dd>
      </dl>
      <div class="r-marks" aria-label="Marcas por ronda">${marks || '<span class="r-muted">Todavía sin rondas cerradas</span>'}</div>
    </article>`;
  });

  body.innerHTML = `
    <section class="r-title">
      <p class="r-eyebrow">Reporte de historial de pagos</p>
      <h1>${esc(short(address))}</h1>
      <p class="r-addr">${esc(address)}</p>
      <p class="r-net">⚠ Red de prueba de Stellar (testnet): estos pagos usan dinero de prueba, sin valor real.</p>
    </section>
    <section class="r-summary">
      <div><b>${all.score}</b><span>Puntaje (0–100)</span></div>
      <div><b>${details.length}</b><span>Círculos</span></div>
      <div><b>${all.total}</b><span>Rondas con marca</span></div>
      <div><b>${all.counts[1]}</b><span>A tiempo</span></div>
      <div><b>${all.counts[2]}</b><span>Tarde</span></div>
      <div><b>${all.counts[4]}</b><span>Cubiertas con garantía</span></div>
      <div><b>${all.counts[3]}</b><span>Faltó</span></div>
    </section>
    <p class="r-muted">Puntaje: a tiempo 100, tarde 50, cubierto con garantía 25, faltó 0, promediado por ronda. Es la misma fórmula del contrato (<code>score</code>).</p>
    <h2>Círculos</h2>
    ${rows.join("") || '<p class="r-muted">Esta cuenta todavía no figura en ningún círculo del registro.</p>'}
    <h2>Cómo verificar este reporte sin confiar en Awayu</h2>
    <ol class="r-steps">
      <li>Abre el contrato de cada círculo en Stellar Lab (enlace de arriba), elige la función <code>history</code> y pon la cuenta <code>${esc(short(address))}</code>. La red devuelve las marcas: 1 a tiempo, 2 tarde, 3 faltó, 4 cubierto.</li>
      <li>La lista de círculos sale del contrato de registro <a href="${explorerUrl(dep.registro)}" target="_blank" rel="noopener">${esc(short(dep.registro || ""))}</a>, función <code>by_member</code>.</li>
      <li>El código de los contratos es público y su compilación es verificable (SEP-55): <code>stellar contract info build --id &lt;contrato&gt; --network testnet</code> muestra el repositorio y el commit.</li>
      <li>Para saber que la cuenta es de quien solicita el crédito, pídele que firme con su billetera un mensaje que ustedes elijan y verifiquen la firma con la clave pública. La identidad la confirma su propio KYC.</li>
    </ol>
    <p class="r-disclaimer">Este reporte es evidencia de pagos en círculos de ahorro. No es una calificación ni una aprobación de crédito: la decisión es de la entidad, con su propio criterio. Awayu no presta dinero ni guarda fondos. No contiene datos personales: solo direcciones públicas y marcas de pago.</p>
    <footer class="r-foot">Generado el ${now.toLocaleString("es-BO")} desde ${esc(location.host)} · datos leídos en vivo de Stellar testnet (${esc(dep.rpc)})</footer>`;
}

const params = new URLSearchParams(location.search);
const go = (addr) => {
  const a = String(addr || "").trim();
  if (!/^G[A-Z2-7]{55}$/.test(a)) return void ($("#r-body").innerHTML = `<p class="r-err">Escribe una cuenta de Stellar válida (empieza con G y tiene 56 caracteres).</p>`);
  $("#r-addr").value = a;
  const url = new URL(location.href);
  url.searchParams.set("m", a);
  history.replaceState(null, "", url);
  render(a, params.get("c")).catch((e) => ($("#r-body").innerHTML = `<p class="r-err">No se pudo leer Stellar: ${esc(e.message)}</p>`));
};
$("#r-load").onclick = () => go($("#r-addr").value);
$("#r-addr").addEventListener("keydown", (e) => e.key === "Enter" && go($("#r-addr").value));
$("#r-print").onclick = () => window.print();
(async () => go(params.get("m") || (await defaultAccount((await loadDeployment()) || {}))))();
