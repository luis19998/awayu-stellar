// Vista del círculo 3D y billetera. Se carga bajo demanda desde app.js.
import { relabel } from "./dashboard.js";
import { setState } from "./state.js";
import { StrKey } from "@stellar/stellar-sdk";
import { createScene, VESSELS, TABLES } from "./scene.js";
import { SCENARIOS } from "./scenarios.js";
import { historyStripDataURL, applyPalette } from "./aguayo.js";
import { THEMES, loadThemeId, saveThemeId } from "./themes.js";
import { t, initLang, setLang, getLang, applyStatic } from "./i18n.js";
import { simulate, simulationSvg } from "./simulator.js";
import * as sfx from "./sound.js";
import { downloadCertificate } from "./certificate.js";
import {
  demoCircle, contribute, payout, pot, recipientOf, score, creditLine, idleYield, depositGuarantee, parsePeople,
  ON_TIME, LATE, MISSED,
} from "./model.js";
import {
  loadDeployment, readCircle, explorerUrl, buildContributeXdr, buildPayoutXdr, buildCreateXdr,
  buildGuaranteeXdr, buildWithdrawXdr, buildAliasXdr, submit, ensureFunded, short, readActivity, txUrl,
  buildRegisterXdr, buildJoinXdr, buildEndorseXdr,
  readBalance, USDC_TESTNET, usdcStatus, buildUsdcTrustlineXdr, buildBuyUsdcXdr,
} from "./chain.js";
import { pollarEnabled, connectFreighter, connectPollar, connectKit, connectBurner, disconnect as forgetWallet, sign, wallet } from "./wallet.js";

const $ = (s) => document.querySelector(s);
const localeForLang = () => ({ es: "es-BO", en: "en-US", pt: "pt-BR", qu: "es-BO", ay: "es-BO", gn: "es-BO" })[getLang()] || "es-BO";
const fmt = (n, t) => `${n.toLocaleString(localeForLang(), { maximumFractionDigits: 2 })} ${t}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

initLang();
let themeId = loadThemeId();
applyPalette(THEMES[themeId].palette);
let demoOpts = loadDemoOpts();
let circle = demoCircle(demoOpts);
let activity = [];
let selected = -1;
let busy = false;
let deployment = null;

// La escena 3D del círculo arranca dormida si la página no abre en #/circulo
const startsOnCircle = /^#\/circulo/.test(location.hash) || new URLSearchParams(location.search).has("c");
const scene = createScene($("#stage"), { onPick: (i) => pick(i), active: startsOnCircle });

// Escenario, vasija y mesa elegidos (se recuerdan en este navegador)
const SKIN_DEFAULT = { scenario: "altiplano", vessel: "cantaro", table: "suelo" };
let skin = SKIN_DEFAULT;
try {
  skin = { ...SKIN_DEFAULT, ...JSON.parse(localStorage.getItem("awayu.skin") || "{}") };
} catch {}
scene.setSkin(skin);
function saveSkin(patch) {
  skin = { ...skin, ...patch };
  scene.setSkin(skin);
  try {
    localStorage.setItem("awayu.skin", JSON.stringify(skin));
  } catch {}
}

// ---------- Render ----------

function rebuild() {
  applyFigures(circle);
  scene.setMembers(circle.members);
  circle.paid.forEach((mark, i) => scene.setPending(i, mark, circle.round));
  scene.setTurn(recipientOf(circle), false);
  render();
}

const me = () => wallet()?.address;
const myIndex = () => circle.members.findIndex((m) => m.address === me());
const isTestnet = () => circle.mode === "testnet";

function canPayout(c) {
  if (c.round >= c.order.length) return false;
  if (!isTestnet()) return c.paid.size > 0;
  return Boolean(me()) && (c.paid.size === c.order.length || Date.now() / 1000 > c.deadline);
}

function render() {
  const c = circle;
  const n = c.order.length;
  const done = c.round >= n;
  const rec = recipientOf(c);
  $("#s-round").textContent = done ? t("fin") : `${c.round + 1}/${n}`;
  $("#s-amount").textContent = fmt(c.amount, c.token);
  $("#s-pot").textContent = fmt(pot(c), c.token);
  $("#s-recipient").textContent = done ? t("Círculo completo") : c.members[rec].name;
  $("#s-deadline").textContent = deadlineText(c);
  $("#s-yield").textContent = "+" + fmt(idleYield(c), c.token);
  scene.setPotLevel(pot(c) / (c.amount * n));
  scene.setDeadline(roundProgress(c));
  scene.updateLabels(c.members, c.members.map((m) => t("{n} puntos", { n: score(m.history) })), rec);
  scene.placeIlla(bestMember(c));

  const ul = $("#members");
  ul.innerHTML = "";
  c.members.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = (i === selected ? "sel " : "") + (i === rec ? "turn-of" : "");
    const paid = c.paid.get(i);
    // Nombre y oficio vienen del usuario o de la cadena: siempre como texto, nunca como HTML
    const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    };
    li.append(
      el("b", null, m.name),
      el("span", "sc", `${score(m.history)} pts`),
      el("span", `st ${paid ? "ok" : ""}`, `${t(paid === ON_TIME ? "Aportó" : paid === LATE ? "Aportó tarde" : "Falta aportar")} · ${t(m.role)}`)
    );
    const chips = el("span", "chips");
    if (m.guarantee > 0) {
      const chip = el("i", "chip shield", t("Garantía {amount}", { amount: fmt(m.guarantee, c.token) }));
      chip.title = t("Garantía disponible");
      chips.append(chip);
    }
    li.append(chips);
    if (m.history.length) {
      const img = new Image();
      img.alt = t("Aguayo de {name}", { name: m.name });
      img.src = historyStripDataURL(m.history);
      li.appendChild(img);
    }
    li.onclick = () => pick(i);
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-pressed", String(i === selected));
    li.setAttribute("aria-label", t("Miembro {name}, {points} puntos", { name: m.name, points: score(m.history) }));
    li.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick(i);
      }
    };
    ul.appendChild(li);
  });

  const tn = isTestnet();
  const mine = myIndex();
  const bC = $("#btn-contribute");
  if (tn) {
    bC.disabled = busy || done || !me() || mine < 0 || c.paid.has(mine);
    bC.textContent = t(!me() ? "Conecta tu billetera" : mine < 0 ? "No eres miembro" : c.paid.has(mine) ? "Ya aportaste" : "Aportar y firmar");
  } else {
    bC.disabled = busy || done || (selected >= 0 && c.paid.has(selected));
    bC.textContent = selected >= 0 ? t("Aportar como {name}", { name: c.members[selected].name }) : t("Aportar (todos)");
  }
  $("#btn-payout").disabled = busy || !canPayout(c);
  renderGuarantee(c, done);
  $(".late").style.display = tn ? "none" : "";
  const link = $("#lnk-contract");
  link.hidden = !c.contractId;
  if (c.contractId) link.href = explorerUrl(c.contractId);
  $("#btn-share").hidden = !tn;
  setState({ circle: c, deployment, address: me() || null });
  maybeNotifyDeadline(c);
  renderPerson();
  renderTimeline();
}

/** Qué parte de la ronda ya pasó (0 a 1); en demo, según cuántos aportaron. */
function roundProgress(c) {
  if (c.round >= c.order.length) return 1;
  if (isTestnet() && c.deadline && c.periodSeconds) {
    const left = c.deadline - Date.now() / 1000;
    return Math.min(1, Math.max(0, 1 - left / c.periodSeconds));
  }
  return c.paid.size / c.order.length;
}

/** Quien tiene mejor reputación (y al menos dos rondas) lleva la illa. */
function bestMember(c) {
  let best = -1;
  c.members.forEach((m, i) => {
    if (m.history.length < 2) return;
    const s = score(m.history) * 100 + m.history.length;
    if (best < 0 || s > score(c.members[best].history) * 100 + c.members[best].history.length) best = i;
  });
  return best;
}

function deadlineText(c) {
  if (isTestnet() && c.deadline) {
    const s = c.deadline - Date.now() / 1000;
    if (s <= 0) return t("Plazo vencido: ya se puede pagar el pozo");
    return s < 3600 ? t("Plazo: {n} min", { n: Math.ceil(s / 60) })
      : s < 172800 ? t("Plazo: {n} h", { n: Math.ceil(s / 3600) })
      : t("Plazo: {n} días", { n: Math.ceil(s / 86400) });
  }
  return t("Una ronda cada {n} días", { n: c.periodDays });
}

/** Botón de garantía: dejarla (una cuota) o, al terminar el círculo, retirarla. */
function renderGuarantee(c, done) {
  const b = $("#btn-guarantee");
  const tn = isTestnet();
  if (tn && c.version < 2) {
    b.hidden = true;
    return;
  }
  b.hidden = false;
  if (tn && !me()) {
    b.textContent = t("Conecta tu billetera");
    b.disabled = true;
    return;
  }
  const who = tn ? myIndex() : selected;
  const m = c.members[who];
  if (done) {
    b.textContent = t("Retirar garantía");
    b.disabled = busy || !tn || !m || !(m.guarantee > 0);
  } else {
    b.textContent = m
      ? m.guarantee > 0
        ? t(tn ? "Tu garantía está activa" : "Su garantía está activa")
        : t("Dejar garantía ({amount})", { amount: fmt(c.amount, c.token) })
      : t("Elige un miembro para dejar garantía");
    b.disabled = busy || !m || m.guarantee > 0 || (tn && !me());
  }
}

function renderPerson() {
  const box = $("#person");
  if (selected < 0 || !circle.members[selected]) return void (box.hidden = true);
  const m = circle.members[selected];
  const credit = creditLine(m.history, circle.amount);
  box.hidden = false;
  box.innerHTML = `<h3></h3><p class="role"></p>
    <p>${t("{n} rondas tejidas · reputación {s}/100", { n: m.history.length, s: score(m.history) })}</p>
    <p>${t("Con este aguayo podría acceder a un microcrédito de")}</p>
    <div class="credit">${credit ? fmt(credit, circle.token) : t("aún sin historial suficiente")}</div>
    <p><small>${t("Es evidencia de pagos, verificable en la cadena; no es un crédito aprobado. Monto ilustrativo.")}</small></p>
    <button class="ghost cert" type="button">${t("Descargar certificado del aguayo")}</button>
    <button class="ghost figbtn" type="button">${t("Elegir personaje")}</button>
    ${isTestnet() && deployment?.registro && m.address === me() ? `<div class="reg-actions"><button class="ghost join" type="button">${t("Sumar a mi pasaporte")}</button><button class="ghost endorse" type="button">${t("Avalar este círculo")}</button></div>` : ""}
    <form class="alias" hidden><label>${t("Tu nombre en el círculo")}
      <input name="alias" maxlength="24" required placeholder="${t("Ej.: Doña Rosa")}" /></label>
      <button class="ghost">${t("Guardar en la cadena")}</button></form>`;
  box.querySelector("h3").textContent = m.name;
  box.querySelector(".role").textContent = t(m.role);
  box.querySelector(".figbtn").onclick = () => openFigurePicker(selected);
  box.querySelector(".join")?.addEventListener("click", () =>
    run(async () => {
      await signAndSend(() => buildJoinXdr(deployment, me(), circle.contractId), "tu pasaporte");
      toastTranslated("Listo: este círculo ya suma a tu pasaporte de reputación ✓");
    })
  );
  box.querySelector(".endorse")?.addEventListener("click", () =>
    run(async () => {
      await signAndSend(() => buildEndorseXdr(deployment, me(), circle.contractId), "tu aval");
      toastTranslated("Aval registrado en la cadena ✓");
    })
  );
  box.querySelector(".cert").onclick = () =>
    downloadCertificate({
      name: m.name,
      history: m.history,
      score: score(m.history),
      circleId: circle.contractId,
      token: circle.token,
      amount: circle.amount,
      date: new Date().toISOString().slice(0, 10),
    }).catch((e) => toastTranslated("No se pudo crear el certificado: {why}", { why: () => friendly(e) }));
  const form = box.querySelector(".alias");
  if (isTestnet() && circle.version >= 2 && m.address === me()) {
    form.hidden = false;
    form.alias.value = m.alias || "";
    form.onsubmit = (e) => {
      e.preventDefault();
      const alias = form.alias.value.trim();
      if (!alias || new TextEncoder().encode(alias).length > 24) return toastTranslated("El nombre debe tener entre 1 y 24 caracteres");
      run(async () => {
        await signAndSend(() => buildAliasXdr(deployment, circle.contractId, me(), alias), "tu nombre");
        toastTranslated("Nombre guardado en la cadena ✓");
        await refreshChain(true);
      });
    };
  }
}

/** Historial: pagos del pozo (demo: del modelo; testnet: eventos del contrato). */
function renderTimeline() {
  const ol = $("#timeline-list");
  const c = circle;
  const rows = [];
  if (isTestnet()) {
    for (const e of activity) {
      const name = c.members.find((m) => m.address === e.who)?.name || (e.who ? short(e.who) : "");
      const vars = { n: e.round + 1, name, amount: fmt(e.amount, c.token) };
      const mine = e.who && e.who === me();
      const text = e.kind === "pozo" ? t(mine ? "Ronda {n}: recibiste {amount}" : "Ronda {n}: {name} recibió {amount}", vars)
        : e.kind === "cubre" ? t(mine ? "Ronda {n}: tu garantía cubrió tu cuota" : "Ronda {n}: la garantía de {name} cubrió su cuota", vars)
        : t(mine ? "Dejaste {amount} de garantía" : "{name} dejó {amount} de garantía", vars);
      rows.push({ text, href: e.tx ? txUrl(e.tx) : null, kind: e.kind });
    }
  } else {
    for (const p of c.payouts) {
      rows.push({ text: t("Ronda {n}: {name} recibió {amount}", { n: p.round + 1, name: c.members[p.to].name, amount: fmt(p.amount, c.token) }), kind: "pozo" });
      c.members.forEach((m) => {
        if (m.history[p.round] === 4) rows.push({ text: t("Ronda {n}: la garantía de {name} cubrió su cuota", { n: p.round + 1, name: m.name }), kind: "cubre" });
      });
    }
  }
  ol.innerHTML = "";
  if (!rows.length) {
    ol.innerHTML = `<li class="empty">${t("Todavía no se pagó ningún pozo.")}</li>`;
    return;
  }
  for (const r of rows.reverse()) {
    const li = document.createElement("li");
    li.className = r.kind;
    if (r.href) {
      const a = document.createElement("a");
      a.href = r.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = r.text + " ↗";
      li.appendChild(a);
    } else li.textContent = r.text;
    ol.appendChild(li);
  }
}

function pick(i) {
  selected = i === selected ? -1 : i;
  scene.select(selected);
  scene.focus(selected < 0 ? null : selected);
  render();
}

function toast(msg, ms = 3200) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("on"), ms);
}

let lastToast = null;
function toastTranslated(key, vars, ms = 3200) {
  lastToast = { key, vars, ms };
  const values = typeof vars === "function" ? vars() : vars;
  const resolved = Object.fromEntries(Object.entries(values || {}).map(([name, value]) => [name, typeof value === "function" ? value() : value]));
  toast(t(key, resolved), ms);
}

// ---------- Acciones: demo ----------

async function animateContribution(i, mark) {
  await new Promise((r) => scene.flyContribution(i, r));
  sfx.coin();
  scene.setPending(i, mark, circle.round);
}

async function animatePayout(to, amount, marks, round) {
  sfx.payout();
  await new Promise((r) => scene.flyPayout(to, amount / circle.amount, r));
  sfx.weave();
  marks.forEach((m, i) => scene.commitPending(i, m ?? MISSED, round));
  toastTranslated("{name} recibió {amount}", { name: circle.members[to].name, amount: fmt(amount, circle.token) });
  await wait(500);
}

async function demoContribute() {
  const late = $("#chk-late").checked;
  const who = selected >= 0 ? [selected] : circle.members.map((_, i) => i).filter((i) => !circle.paid.has(i));
  for (const i of who) {
    const mark = contribute(circle, i, late);
    if (!mark) continue;
    await animateContribution(i, mark);
    render();
    await wait(180);
  }
}

async function demoPayout() {
  const round = circle.round;
  const res = payout(circle);
  if (!res) return;
  // La marca final sale del historial: incluye las rondas cubiertas por garantía
  const marks = circle.members.map((m) => m.history.at(-1));
  await animatePayout(res.to, res.amount, marks, round);
  scene.setTurn(recipientOf(circle));
}

// ---------- Acciones: testnet (firmadas con la billetera) ----------

async function signAndSend(buildXdr, what) {
  toastTranslated("Preparando {what}…", { what: () => t(what) });
  const xdr = await buildXdr();
  toastTranslated("Firma en tu billetera…", null, 60000);
  const signed = await sign(xdr);
  toastTranslated("Enviando a Stellar testnet…", null, 60000);
  return submit(deployment, signed);
}

/** Si te falta aportar y quedan menos de 24 horas, avisa una sola vez por ronda (recordatorio de n8n). */
function maybeNotifyDeadline(c) {
  if (!isTestnet() || !c.contractId || !me() || !c.deadline) return;
  const i = c.members.findIndex((m) => m.address === me());
  const left = c.deadline - Date.now() / 1000;
  if (i < 0 || c.paid.has(i) || left <= 0 || left > 86400) return;
  const key = `awayu.n8n.plazo.${c.contractId}.${c.round}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { return; }
  notifyEvent("plazo_cerca", c.contractId, { round: c.round + 1, member: me(), hoursLeft: Math.round(left / 3600), amount: c.amount, token: c.token, link: `${location.origin}/?c=${c.contractId}` });
}

/** Avisa a n8n (vía /api/eventos) sin bloquear ni mostrar errores: es solo para automatizaciones. */
function notifyEvent(type, circleId, data = {}) {
  try {
    fetch("/api/eventos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, circle: circleId, data }), keepalive: true }).catch(() => {});
  } catch { /* sin red */ }
}

async function chainContribute() {
  if (!(await ensureCircleUsdc(circle.amount))) return;
  const i = myIndex();
  await signAndSend(() => buildContributeXdr(deployment, circle.contractId, me()), "tu aporte");
  notifyEvent("aporte", circle.contractId, { round: circle.round + 1, member: me(), amount: circle.amount, token: circle.token });
  await animateContribution(i, ON_TIME);
  toastTranslated("Aporte registrado en la cadena ✓");
  await refreshChain();
  await updateBalance();
}

async function ensureCircleUsdc(required) {
  if (circle.tokenId !== USDC_TESTNET.sac) return true;
  const status = await usdcStatus(me());
  if (status.hasTrustline && status.balance >= required) return true;
  showUsdcDialog(circle.amount * 2);
  return false;
}

async function chainPayout() {
  const round = circle.round;
  const marks = circle.members.map((_, i) => circle.paid.get(i));
  const amount = pot(circle);
  const res = await signAndSend(() => buildPayoutXdr(deployment, circle.contractId, me()), "el pago del pozo");
  notifyEvent("pozo", circle.contractId, { round: round + 1, to: String(res?.value || ""), amount, token: circle.token });
  const to = circle.members.findIndex((m) => m.address === String(res?.value));
  await animatePayout(to < 0 ? recipientOf(circle) : to, amount, marks, round);
  await refreshChain(true);
  await updateBalance();
}

async function run(fn) {
  if (busy) return;
  busy = true;
  render();
  try {
    await fn();
  } catch (e) {
    console.error(e);
    sfx.error();
    toastTranslated("No se pudo: {why}", { why: () => friendly(e) }, 5000);
    // Si la red aceptó la transacción pero no confirmó a tiempo, el contrato
    // puede haberla registrado igual: volvemos a leer su estado real.
    if (isTestnet()) await refreshChain(true).catch(() => {});
  } finally {
    busy = false;
    render();
  }
}

function friendly(e) {
  const m = String(e?.message || e);
  if (/User declined|rejected|denied/i.test(m)) return t("cancelaste la firma");
  if (/Error\(Contract, #8\)/.test(m)) return t("la ronda sigue abierta");
  if (/Error\(Contract, #6\)/.test(m)) return t("ya aportaste en esta ronda");
  if (/Error\(Contract, #5\)/.test(m)) return t("no eres miembro del círculo");
  if (m === "FREIGHTER_MISSING" || /Freighter.*(missing|not installed)/i.test(m)) return t("No se pudo conectar con tu billetera. Comprueba que esté instalada y desbloqueada.");
  const known = [
    "No se eligió ninguna billetera", "Cambia Freighter a la red Testnet", "Falta VITE_POLLAR_KEY",
    "Debes aceptar los términos y el aviso de riesgos antes de firmar.", "Pollar rechazó la transacción",
    "instala Freighter (se abrió su página) y elige la red Testnet", "Falta testnet.json",
    "Dirección de destino inválida", "La red rechazó la transacción", "Friendbot no pudo fondear la cuenta",
  ];
  if (known.some((key) => m === key || m === t(key))) return t(known.find((key) => m === key || m === t(key)));
  return t("No se pudo completar. Revisa tu conexión y vuelve a intentarlo.");
}

$("#btn-contribute").onclick = () => run(isTestnet() ? chainContribute : demoContribute);

$("#btn-guarantee").onclick = () =>
  run(async () => {
    const done = circle.round >= circle.order.length;
    if (!isTestnet()) {
      if (depositGuarantee(circle, selected)) toastTranslated("{name} dejó una cuota de garantía", { name: circle.members[selected].name });
      return;
    }
    if (done) {
      await signAndSend(() => buildWithdrawXdr(deployment, circle.contractId, me()), "el retiro de tu garantía");
      toastTranslated("Garantía devuelta a tu billetera ✓");
    } else {
      if (!(await ensureCircleUsdc(circle.amount))) return;
      await signAndSend(() => buildGuaranteeXdr(deployment, circle.contractId, me()), "tu garantía");
      notifyEvent("garantia", circle.contractId, { member: me(), amount: circle.amount, token: circle.token });
      toastTranslated("Garantía depositada: si un día no puedes pagar, cubre tu cuota ✓");
    }
    await refreshChain(true);
  });
$("#btn-payout").onclick = () => run(isTestnet() ? chainPayout : demoPayout);

// ---------- Modos y carga de círculos ----------

async function openTestnet(contractId) {
  deployment ??= await loadDeployment();
  if (!deployment) throw new Error("Falta testnet.json");
  const id = contractId || deployment.contractId;
  toastTranslated("Leyendo el contrato en Stellar testnet…");
  circle = await readCircle(deployment, id, me() ? { [me()]: "Tú" } : {});
  activity = await readActivity(deployment, id, circle.start).catch(() => []);
  setModeButton("testnet");
  selected = -1;
  rebuild();
  const url = new URL(location.href);
  if (id !== deployment.contractId) url.searchParams.set("c", id);
  else url.searchParams.delete("c");
  history.replaceState(null, "", url);
  toastTranslated("Datos reales del contrato en testnet");
  await updateBalance();
}

async function refreshChain(full = false) {
  if (!isTestnet()) return;
  const before = circle;
  const next = await readCircle(deployment, circle.contractId, me() ? { [me()]: "Tú" } : {});
  circle = next;
  activity = await readActivity(deployment, circle.contractId, circle.start).catch(() => activity);
  const changed = full || next.round !== before.round || next.members.length !== before.members.length;
  if (changed) {
    rebuild();
    scene.setTurn(recipientOf(circle));
  } else {
    // Aportes nuevos de otros miembros: los animamos
    for (const [i, mark] of next.paid) {
      if (!before.paid.has(i)) await animateContribution(i, mark);
    }
    render();
  }
}

function setModeButton(mode) {
  document.querySelectorAll(".modes button").forEach((x) => x.classList.toggle("on", x.dataset.mode === mode));
}

document.querySelectorAll(".modes button").forEach((b) => {
  b.onclick = () => {
    if (b.classList.contains("on") || busy) return;
    if (b.dataset.mode === "testnet") return run(() => openTestnet());
    circle = demoCircle(demoOpts);
    setModeButton("demo");
    selected = -1;
    rebuild();
    history.replaceState(null, "", location.pathname);
    toastTranslated("Modo demo");
    updateBalance();
  };
});

// Refresco periódico con espera creciente si Stellar RPC no responde
let rpcFailures = 0;
let nextRefresh = 0;
setInterval(async () => {
  if (!isTestnet() || busy || document.hidden || Date.now() < nextRefresh) return;
  $("#s-deadline").textContent = deadlineText(circle);
  scene.setDeadline(roundProgress(circle));
  try {
    await refreshChain();
    if (rpcFailures) toastTranslated("Conexión con Stellar recuperada");
    rpcFailures = 0;
    $(".panel").classList.remove("stale");
  } catch {
    rpcFailures += 1;
    nextRefresh = Date.now() + Math.min(5 * 60_000, 20_000 * 2 ** rpcFailures);
    $(".panel").classList.add("stale");
    if (rpcFailures === 1) toastTranslated("No se pudo actualizar desde Stellar; se muestran los últimos datos y se reintentará", null, 5000);
  }
}, 20000);

// ---------- Billetera ----------

const menu = $("#wallet-menu");
if (!pollarEnabled) {
  menu.querySelectorAll("[data-w=google],[data-w=email]").forEach((x) => {
    x.disabled = true;
    x.title = t("Falta la clave publicable de Pollar (VITE_POLLAR_KEY)");
  });
}
$("#btn-wallet").onclick = () => (menu.hidden = !menu.hidden);

// La cuenta de prueba instantánea sigue en esta pestaña después de recargar
try {
  if (sessionStorage.getItem("awayu.burner")) connectBurner().then(onConnected).catch(() => {});
} catch { /* sin sessionStorage */ }

async function onConnected(w) {
  menu.hidden = true;
  renderWalletButton(w);
  deployment ??= await loadDeployment();
  if (deployment && (await ensureFunded(deployment, w.address))) toastTranslated("Cuenta de testnet fondeada con Friendbot");
  else toastTranslated("Billetera conectada");
  if (isTestnet()) await refreshChain(true);
  render();
  await updateBalance();
}

function renderWalletButton(w = wallet()) {
  const btn = $("#btn-wallet");
  if (!w) {
    btn.setAttribute("data-i18n", "");
    btn.dataset.i18nKey = "Conectar billetera";
    btn.textContent = t("Conectar billetera");
    btn.classList.remove("on");
    return;
  }
  btn.removeAttribute("data-i18n");
  btn.textContent = w.kind === "burner"
    ? `${t("Cuenta de prueba")} · G…${w.address.slice(-4)}`
    : `${w.kind === "pollar" ? "Pollar" : w.kind === "kit" ? t("Billetera") : "Freighter"} · ${short(w.address)}`;
  btn.classList.add("on");
}

/** Muestra el saldo de la billetera en el token del círculo (XLM en testnet). */
async function updateBalance() {
  const el = $("#wallet-balance");
  if (!me() || !deployment) return void (el.hidden = true);
  try {
    const tokenId = isTestnet() ? circle.tokenId : deployment.token;
    const bal = await readBalance(deployment, tokenId, me());
    el.textContent = fmt(bal, isTestnet() ? circle.token : "XLM");
    el.hidden = false;
  } catch {
    el.hidden = true;
  }
}

menu.querySelectorAll("button").forEach((b) => {
  b.onclick = () =>
    run(async () => {
      if (b.dataset.w === "burner") {
        await onConnected(await connectBurner());
      } else if (b.dataset.w === "freighter") {
        try {
          await onConnected(await connectFreighter());
        } catch (e) {
          if (e.message === "FREIGHTER_MISSING") {
            window.open("https://www.freighter.app/", "_blank", "noopener");
            throw new Error(t("instala Freighter (se abrió su página) y elige la red Testnet"));
          }
          throw e;
        }
      } else if (b.dataset.w === "kit") {
        await onConnected(await connectKit());
      } else if (b.dataset.w === "google") {
        await onConnected(await connectPollar("google"));
      } else {
        const email = await askEmail();
        if (email) await onConnected(await connectPollar({ provider: "email", email }));
      }
    });
});

/** Pide el correo en un diálogo propio (prompt() no funciona en algunos navegadores de celular). */
function askEmail() {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "ask-email";
    d.innerHTML = `<form method="dialog"><h2></h2><label><span></span><input type="email" name="email" required autocomplete="email" inputmode="email" /></label><menu><button value="cancel" formnovalidate class="ghost"></button><button value="ok" class="primary"></button></menu></form>`;
    const render = () => {
      d.querySelector("h2").textContent = t("Entrar con tu correo");
      d.querySelector("label span").textContent = t("Tu correo para recibir el código de Pollar:");
      d.querySelector("[value=cancel]").textContent = t("Cancelar");
      d.querySelector("[value=ok]").textContent = t("Enviar código");
    };
    const onLanguage = () => render();
    const done = (v) => { window.removeEventListener("awayu:lang", onLanguage); d.close(); d.remove(); resolve(v); };
    render();
    window.addEventListener("awayu:lang", onLanguage);
    d.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.submitter?.value !== "ok") return done(null);
      const input = d.querySelector("input");
      if (!input.checkValidity()) return input.reportValidity();
      done(input.value.trim());
    });
    d.addEventListener("cancel", () => done(null));
    document.body.append(d);
    d.showModal();
    d.querySelector("input").focus();
  });
}

// ---------- Crear un pasanaku ----------

const dlg = $("#dlg-create");
const tokenSelect = $("#create-token");
const amountInput = $("#form-create [name=amount]");
const amountLabel = $("#create-amount-label");
const createUsdcFlow = $("#create-usdc-flow");
const createUsdcMessage = $("#create-usdc-message");
const createUsdcResult = $("#create-usdc-result");
const createUsdcButton = $("#btn-create-usdc");
const createError = $("#create-err");
let pendingCreate = null;
let usdcFundingAmount = 20;
let createErrorCopy = null;
let createUsdcCopy = null;
let createUsdcTransactions = [];
let usdcDialogCopy = null;
let usdcDialogTransactions = [];

function setCreateError(key, vars = {}) {
  createErrorCopy = { key, vars };
  createError.textContent = t(key, vars);
}

function setCreateUsdcMessage(key, vars = {}) {
  createUsdcCopy = { key, vars };
  createUsdcMessage.textContent = t(key, vars);
}

function setUsdcDialogMessage(key, vars = {}) {
  usdcDialogCopy = { key, vars };
  $("#usdc-flow-message").textContent = t(key, vars);
}

function updateCreateTokenLabel() {
  const usdc = tokenSelect.value === "usdc";
  amountLabel.textContent = t(usdc ? "Cuota por ronda (USDC)" : "Cuota por ronda (XLM de testnet)");
  amountInput.min = usdc ? "0.1" : "1";
  amountInput.step = usdc ? "0.1" : "1";
}
tokenSelect.addEventListener("change", () => {
  updateCreateTokenLabel();
  if (tokenSelect.value !== "usdc") createUsdcFlow.hidden = true;
});

function transactionLinks(results) {
  return results.filter((item) => item?.hash).map((item) =>
    `<a href="${txUrl(item.hash)}" target="_blank" rel="noopener">${t(item.kind === "trustline" ? "Ver línea de confianza" : "Ver cambio USDC")} ↗</a>`
  ).join(" · ");
}

async function acquireTestUsdc(amount) {
  const txs = [];
  const status = await usdcStatus(me());
  if (!status.hasTrustline) {
    txs.push({ ...(await signAndSend(() => buildUsdcTrustlineXdr(me()), "la línea de confianza USDC")), kind: "trustline" });
  }
  txs.push({ ...(await signAndSend(() => buildBuyUsdcXdr(me(), amount), "el cambio a USDC de prueba")), kind: "swap" });
  await updateBalance();
  return txs;
}

function showUsdcDialog(amount) {
  usdcFundingAmount = amount;
  usdcDialogTransactions = [];
  setUsdcDialogMessage("Obtener {amount} USDC de prueba para continuar.", { amount: amount.toLocaleString(localeForLang(), { maximumFractionDigits: 2 }) });
  $("#usdc-flow-result").textContent = "";
  $("#btn-usdc-get").hidden = false;
  $("#dlg-usdc button[value=cancel]").textContent = t("Cancelar");
  $("#dlg-usdc").showModal();
}

$("#btn-usdc-get").onclick = () => run(async () => {
  const button = $("#btn-usdc-get");
  button.disabled = true;
  try {
    const txs = await acquireTestUsdc(usdcFundingAmount);
    usdcDialogTransactions = txs;
    $("#usdc-flow-result").innerHTML = transactionLinks(txs);
    setUsdcDialogMessage("USDC de prueba recibido. Puedes continuar.");
    button.hidden = true;
    $("#dlg-usdc button[value=cancel]").textContent = t("Cerrar");
  } finally { button.disabled = false; }
});

async function createCircle(data) {
  dlg.close();
  deployment ??= await loadDeployment();
  for (const a of data.members) await ensureFunded(deployment, a).catch(() => {});
  const res = await signAndSend(() => buildCreateXdr(deployment, me(), {
    ...data,
    token: data.tokenChoice === "usdc" ? USDC_TESTNET.sac : deployment.token,
  }), "el nuevo círculo");
  const id = String(res.value);
  saveCircle(id);
  notifyEvent("circulo_creado", id, { name: data.cname, region: data.region, members: data.members.length, amount: data.amount, token: data.tokenChoice === "usdc" ? "USDC" : "XLM", periodSeconds: data.periodSeconds, link: `${location.origin}/?c=${id}` });
  if (deployment.registro) {
    try {
      await signAndSend(() => buildRegisterXdr(deployment, me(), id, data.cname, data.region), "el registro del círculo");
      await signAndSend(() => buildJoinXdr(deployment, me(), id), "tu pasaporte");
    } catch (e) {
      toastTranslated("El círculo se creó, pero no se pudo registrar: {why}", { why: () => friendly(e) }, 5000);
    }
  }
  toastTranslated("¡Pasanaku creado! Comparte el enlace con los miembros");
  await openTestnet(id);
}

createUsdcButton.onclick = () => run(async () => {
  createUsdcButton.disabled = true;
  setCreateUsdcMessage("Primero se firmará la línea de confianza, si hace falta, y luego el cambio de XLM a USDC.");
  createUsdcResult.textContent = "";
  createUsdcTransactions = [];
  try {
    const txs = await acquireTestUsdc(pendingCreate.amount * 2);
    createUsdcTransactions = txs;
    createUsdcResult.innerHTML = transactionLinks(txs);
    setCreateUsdcMessage("USDC de prueba listo. Selecciona Crear y firmar para continuar.");
    createUsdcButton.hidden = true;
  } catch (error) {
    setCreateUsdcMessage("No se pudieron obtener los USDC de prueba: {why}", { why: friendly(error) });
    throw error;
  } finally { createUsdcButton.disabled = false; }
});

function openCreate(preset = {}) {
  if (!me()) {
    menu.hidden = false;
    return toastTranslated("Primero conecta tu billetera");
  }
  const form = $("#form-create");
  if (preset.cname !== undefined) form.elements.cname.value = preset.cname;
  if (preset.amount !== undefined) amountInput.value = String(preset.amount);
  if (preset.tokenChoice && ["usdc", "xlm"].includes(preset.tokenChoice)) tokenSelect.value = preset.tokenChoice;
  if (preset.region) form.elements.region.value = preset.region;
  else if (preset.countryCode && preset.countryCode !== "BO") form.elements.region.value = "otro";
  if (preset.periodSeconds !== undefined) {
    const desired = Number(preset.periodSeconds);
    const options = [...form.elements.period.options];
    const nearest = options.reduce((best, option) => Math.abs(Number(option.value) - desired) < Math.abs(Number(best.value) - desired) ? option : best, options[0]);
    if (nearest) form.elements.period.value = nearest.value;
  }
  createErrorCopy = null;
  createError.textContent = "";
  createUsdcFlow.hidden = true;
  createUsdcResult.textContent = "";
  createUsdcTransactions = [];
  createUsdcCopy = null;
  createUsdcButton.hidden = false;
  updateCreateTokenLabel();
  applyStatic(dlg);
  dlg.showModal();
}

$("#btn-create").onclick = () => openCreate();

$("#form-create").addEventListener("submit", (ev) => {
  if (ev.submitter?.value !== "ok") return;
  ev.preventDefault();
  const f = new FormData(ev.target);
  const others = String(f.get("members")).split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const bad = others.find((a) => !StrKey.isValidEd25519PublicKey(a));
  if (bad) return void setCreateError("Dirección inválida: {address}", { address: short(bad) });
  const members = [...new Set([me(), ...others])];
  if (members.length < 2) return void setCreateError("Hacen falta al menos 2 miembros");
  const amount = Number(f.get("amount"));
  const periodSeconds = Number(f.get("period"));
  const cname = String(f.get("cname") || "").trim().slice(0, 40) || "Pasanaku";
  const region = String(f.get("region") || "otro");
  const tokenChoice = String(f.get("tokenChoice") || "usdc");
  pendingCreate = { members, amount, periodSeconds, cname, region, tokenChoice };
  run(async () => {
    deployment ??= await loadDeployment();
    if (tokenChoice === "usdc") {
      const status = await usdcStatus(me());
      if (!status.hasTrustline || status.balance < amount) {
        createUsdcFlow.hidden = false;
        createUsdcButton.hidden = false;
        setCreateUsdcMessage("Para crear el círculo con USDC, obtén {amount} USDC de prueba para la primera cuota y la garantía.", { amount: (amount * 2).toLocaleString(localeForLang(), { maximumFractionDigits: 2 }) });
        createUsdcResult.textContent = "";
        return;
      }
    }
    await createCircle(pendingCreate);
  });
});

// ---------- Personajes ----------

const FIG_KEY = "awayu.figures";
function figureMap() {
  try {
    return JSON.parse(localStorage.getItem(FIG_KEY) || "{}");
  } catch {
    return {};
  }
}
/** Aplica los personajes elegidos (por dirección o nombre) antes de dibujar el círculo. */
function applyFigures(c) {
  const map = figureMap();
  c.members.forEach((m) => {
    const k = m.address?.startsWith("GDEMO") ? m.name : m.address;
    if (map[k]) m.figure = map[k];
  });
}

let figCatalog = null;
let figFilter = "all";
let figProfile = null;
let figurePickerRelabel = () => {};
/** Selector de personajes: miniatura 3D de cada figura, filtros por oficio y miembro elegible. */
async function openFigurePicker(i, { profile = false } = {}) {
  if (i < 0) i = 0;
  figCatalog ??= await fetch("/models/personajes.json?v=2").then((r) => r.json()).catch(() => ({ figures: [] }));
  const dlg = $("#dlg-figure");
  const grid = $("#fig-grid");
  const who = $("#fig-member");
  const filters = $("#fig-filters");
  const keyOf = (m) => (m.address?.startsWith("GDEMO") ? m.name : m.address);
  $("#dlg-figure .fig-who").hidden = profile;
  const setFig = (idx, id) => {
    if (profile) { window.dispatchEvent(new CustomEvent("awayu:figure-selected", { detail: { id } })); return; }
    const m = circle.members[idx];
    const map = figureMap();
    if (id) map[keyOf(m)] = id; else delete map[keyOf(m)];
    try { localStorage.setItem(FIG_KEY, JSON.stringify(map)); } catch {}
    m.figure = id || undefined;
    scene.setFigure(idx, id || null);
  };
  // ¿Para quién? (todos los miembros del círculo)
  who.innerHTML = "";
  circle.members.forEach((m, k) => who.add(new Option(m.name, String(k), false, k === i)));
  // Filtros por oficio
  const kinds = [...new Map(figCatalog.figures.map((f) => [f.archetype, f.label])).entries()];
  filters.innerHTML = "";
  for (const [id, label] of [["all", "Todos"], ...kinds]) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fig-chip";
    b.textContent = t(label);
    b.setAttribute("aria-pressed", String(figFilter === id));
    b.onclick = () => { figFilter = id; draw(); filters.querySelectorAll(".fig-chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
    filters.appendChild(b);
  }
  function draw() {
    const idx = Number(who.value);
    const m = circle.members[idx];
    grid.innerHTML = "";
    for (const f of figCatalog.figures) {
      if (figFilter !== "all" && f.archetype !== figFilter) continue;
      const b = document.createElement("button");
      b.type = "button";
      const chosen = profile ? figProfile === f.id : m.figure === f.id;
      b.className = "fig" + (chosen ? " on" : "");
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", String(chosen));
      b.innerHTML = `<img src="/models/figuras/${f.id}.webp" alt="" loading="lazy" width="90" height="100"><span class="fig-name"></span><span class="fig-dots">${f.colors.map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
      b.querySelector(".fig-name").textContent = `${t(f.label)} · ${f.variant + 1}`;
      b.title = `${t(f.label)} · ${t("variante")} ${f.variant + 1}`;
      b.onclick = () => {
        setFig(idx, f.id);
        if (profile) figProfile = f.id;
        grid.querySelectorAll(".fig").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", String(x === b)); });
        if (profile) toastTranslated("Tu personaje ahora es {f}", { f: () => t(f.label) });
        else toastTranslated("{n} ahora es {f}", { n: m.name, f: () => t(f.label) });
      };
      grid.appendChild(b);
    }
  }
  figurePickerRelabel = draw;
  dlg.addEventListener("close", () => { figurePickerRelabel = () => {}; }, { once: true });
  who.onchange = draw;
  $("#fig-random").onclick = () => {
    const pool = figCatalog.figures.filter((f) => figFilter === "all" || f.archetype === figFilter);
    const f = pool[Math.floor(Math.random() * pool.length)];
    if (f) { setFig(Number(who.value), f.id); draw(); }
  };
  $("#fig-clear").onclick = () => { setFig(Number(who.value), null); draw(); };
  draw();
  applyStatic(dlg);
  if (!dlg.open) dlg.showModal();
}
$("#btn-open-figs")?.addEventListener("click", () => openFigurePicker(selected >= 0 ? selected : 0));

function saveCircle(id) {
  try {
    const list = JSON.parse(localStorage.getItem("awayu.circles") || "[]");
    localStorage.setItem("awayu.circles", JSON.stringify([id, ...list.filter((x) => x !== id)].slice(0, 20)));
  } catch {}
}

$("#btn-share").onclick = async () => {
  const url = new URL(location.href);
  url.searchParams.set("c", circle.contractId);
  try {
    await navigator.clipboard.writeText(url.toString());
    toastTranslated("Enlace copiado: cualquiera puede ver el círculo; los miembros aportan con su billetera");
  } catch {
    prompt(t("Copia este enlace:"), url.toString());
  }
};

// ---------- Personalizar: estilo del aguayo y círculo de demostración ----------

function loadDemoOpts() {
  try {
    return JSON.parse(localStorage.getItem("awayu.demo") || "null");
  } catch {
    return null;
  }
}

function saveDemoOpts(o) {
  try {
    if (o) localStorage.setItem("awayu.demo", JSON.stringify(o));
    else localStorage.removeItem("awayu.demo");
  } catch {}
}

const dlgCustom = $("#dlg-custom");
const selTheme = $("#sel-theme");
function fillSelect(sel, items, value, onChange) {
  sel.innerHTML = "";
  for (const [id, it] of Object.entries(items)) sel.add(new Option(t(it.label), id));
  sel.value = value;
  sel.onchange = () => onChange(sel.value);
}

function fillThemes() {
  selTheme.innerHTML = "";
  for (const [id, th] of Object.entries(THEMES)) selTheme.add(new Option(t(th.label), id));
}
fillThemes();

// Estudio de personalización (hora, clima, paleta propia, interfaz) e invitación por QR
const studioCtx = () => ({ scene, applyPalette, basePalette: THEMES[themeId].palette, rebuild, setMuted: (m) => sfx.setMuted(m) });
import("./custom/studio.js").then(({ loadStudio, applyScenePrefs }) => applyScenePrefs(loadStudio(), studioCtx()));
$("#btn-studio").onclick = async () => {
  const { openStudio } = await import("./custom/studio.js");
  openStudio(getLang(), studioCtx());
};
$("#btn-invite").onclick = async () => {
  const { openInvite } = await import("./qr/qr.js");
  openInvite(circle?.contractId || "", getLang());
};

$("#btn-custom").onclick = () => {
  const f = $("#form-custom");
  fillThemes();
  selTheme.value = themeId;
  fillSelect($("#sel-scenario"), SCENARIOS, skin.scenario, (v) => saveSkin({ scenario: v }));
  fillSelect($("#sel-vessel"), VESSELS, skin.vessel, (v) => saveSkin({ vessel: v }));
  fillSelect($("#sel-table"), TABLES, skin.table, (v) => saveSkin({ table: v }));
  const src = demoOpts?.people || circle.members.map((m) => ({ name: m.name, role: m.role }));
  f.people.value = src.map((p) => (p.role && p.role !== "Miembro" ? `${p.name}, ${p.role}` : p.name)).join("\n");
  f.amount.value = demoOpts?.amount || 100;
  f.played.value = demoOpts?.played ?? 3;
  f.rotate.checked = scene.controls.autoRotate;
  applyStatic(dlgCustom);
  dlgCustom.showModal();
};

selTheme.onchange = () => setTheme(selTheme.value);

function setTheme(id) {
  if (!THEMES[id]) return;
  themeId = id;
  saveThemeId(id);
  applyPalette(THEMES[id].palette);
  scene.retheme();
  rebuild();
}

$("#form-custom").addEventListener("submit", (ev) => {
  const v = ev.submitter?.value;
  const f = ev.target;
  scene.controls.autoRotate = f.rotate.checked;
  if (v === "reset") {
    demoOpts = null;
  } else if (v === "ok") {
    const people = parsePeople(f.people.value);
    if (people.length < 2) {
      ev.preventDefault();
      return toastTranslated("Hacen falta al menos 2 miembros");
    }
    demoOpts = { people, amount: Math.max(1, Number(f.amount.value) || 100), played: Number(f.played.value) || 0 };
  } else return;
  saveDemoOpts(demoOpts);
  if (!isTestnet()) {
    circle = demoCircle(demoOpts);
    selected = -1;
    rebuild();
    toastTranslated(demoOpts ? "Círculo de demostración personalizado" : "Demo original");
  }
});

// ---------- Simulador ----------

const dlgSim = $("#dlg-sim");
const formSim = $("#form-sim");

function renderSim() {
  const f = formSim;
  const sim = simulate({
    members: Number(f.members.value),
    amount: Number(f.amount.value),
    periodDays: Number(f.days.value),
    apy: Number(f.apy.value) / 100,
  });
  const cur = circle.token || "USDC";
  const first = sim.turns[0];
  const last = sim.turns.at(-1);
  const rows = sim.turns
    .map((x) => `<tr><td>${x.turn}</td><td>${t("día {n}", { n: x.day })}</td><td>${fmt(x.receives, cur)}</td><td>${x.advance ? fmt(x.advance, cur) : "—"}</td><td>${x.saved ? fmt(x.saved, cur) : "—"}</td></tr>`)
    .join("");
  $("#sim-out").innerHTML = `
    <p>${t("Pozo de cada ronda: {pot}. El círculo dura {days} días.", { pot: fmt(sim.pot, cur), days: sim.days })}</p>
    <p>${t("El turno 1 recibe un adelanto de {a} sin interés; el último turno ahorró {s} y cobra todo junto.", { a: fmt(first.advance, cur), s: fmt(last.saved, cur) })}</p>
    ${sim.yieldTotal ? `<p class="muted">${t("Si el pozo rinde mientras espera, el círculo podría ganar unos {y} en total (estimado).", { y: fmt(sim.yieldTotal, cur) })}</p>` : ""}
    ${simulationSvg(sim)}
    <table><thead><tr><th>${t("Turno")}</th><th>${t("Cobra")}</th><th>${t("Recibe")}</th><th>${t("Adelanto")}</th><th>${t("Ahorro previo")}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

$("#btn-sim").onclick = () => {
  formSim.members.value = circle.order.length;
  formSim.amount.value = circle.amount;
  formSim.days.value = Math.max(1, Math.round(circle.periodDays)) || 7;
  applyStatic(dlgSim);
  renderSim();
  dlgSim.showModal();
};
formSim.addEventListener("input", renderSim);

// ---------- Sonido ----------

const btnSound = $("#btn-sound");
const syncSound = () => {
  btnSound.textContent = sfx.isMuted() ? "🔇" : "🔊";
  btnSound.setAttribute("aria-label", t(sfx.isMuted() ? "Activar sonido" : "Silenciar"));
};
syncSound();
btnSound.onclick = () => {
  sfx.initSound();
  sfx.setMuted(!sfx.isMuted());
  syncSound();
  if (!sfx.isMuted()) sfx.coin();
};
// El audio del navegador solo arranca después de un gesto del usuario
addEventListener("pointerdown", () => sfx.initSound(), { once: true });

// ---------- Idioma ----------

const selLang = $("#sel-lang");
selLang.value = getLang();
selLang.onchange = () => setLang(selLang.value);

function refreshCustomDialog() {
  const theme = selTheme.value || themeId;
  fillThemes();
  selTheme.value = theme;
  fillSelect($("#sel-scenario"), SCENARIOS, skin.scenario, (value) => saveSkin({ scenario: value }));
  fillSelect($("#sel-vessel"), VESSELS, skin.vessel, (value) => saveSkin({ vessel: value }));
  fillSelect($("#sel-table"), TABLES, skin.table, (value) => saveSkin({ table: value }));
  applyStatic(dlgCustom);
}

addEventListener("awayu:lang", (event) => {
  const lang = event.detail?.lang || getLang();
  state.lang = lang;
  selLang.value = lang;
  render();
  relabel();
  renderHowto();
  syncSound();
  renderWalletButton();
  menu.querySelectorAll("[data-w=google],[data-w=email]").forEach((button) => { if (!pollarEnabled) button.title = t("Falta la clave publicable de Pollar (VITE_POLLAR_KEY)"); });
  if (dlg.open) {
    applyStatic(dlg);
    updateCreateTokenLabel();
    if (createErrorCopy) setCreateError(createErrorCopy.key, createErrorCopy.vars);
    if (createUsdcCopy) setCreateUsdcMessage(createUsdcCopy.key, createUsdcCopy.vars);
    if (createUsdcTransactions.length) createUsdcResult.innerHTML = transactionLinks(createUsdcTransactions);
  }
  const usdcDialog = $("#dlg-usdc");
  if (usdcDialog.open) {
    applyStatic(usdcDialog);
    if (usdcDialogCopy) setUsdcDialogMessage(usdcDialogCopy.key, usdcDialogCopy.vars);
    if (usdcDialogTransactions.length) $("#usdc-flow-result").innerHTML = transactionLinks(usdcDialogTransactions);
    $("#dlg-usdc button[value=cancel]").textContent = t(usdcDialogTransactions.length ? "Cerrar" : "Cancelar");
  }
  if (dlgCustom.open) refreshCustomDialog();
  if (dlgSim.open) renderSim();
  figurePickerRelabel();
  if (lastToast && $("#toast").classList.contains("on")) {
    const values = Object.fromEntries(Object.entries(lastToast.vars || {}).map(([key, value]) => [key, typeof value === "function" ? value() : value]));
    $("#toast").textContent = t(lastToast.key, values);
  }
  if (captionCopy) $("#caption").textContent = t(captionCopy.text);
});

// ---------- Recorrido guiado para el pitch ----------

const STORY = [
  ["En Bolivia, millones ahorran en pasanakus: confianza pura, cero historial.", null],
  ["Awayu lleva el pasanaku a Stellar: cuotas en dólares digitales, reglas en un contrato.", null],
  ["Cada pago teje una capa de aguayo. Vivo y a tiempo, colores plenos.", "contribute"],
  ["Mientras el pozo espera, rinde en Vaquita. Nadie lo toca.", "pot"],
  ["El turno se sorteó en la cadena. Hoy cobra quien le toca, sin discusión.", "payout"],
  ["Ese aguayo es tu historial crediticio: portable, verificable, tuyo.", "person"],
];

let captionCopy = null;
async function caption(text, ms = 3200) {
  const current = { text };
  captionCopy = current;
  const el = $("#caption");
  el.textContent = t(text);
  el.classList.add("on");
  await wait(ms);
  if (captionCopy === current) {
    el.classList.remove("on");
    captionCopy = null;
    await wait(400);
  }
}

$("#btn-story").onclick = async () => {
  if (busy) return;
  if (circle.mode !== "demo" || circle.round >= circle.order.length) {
    circle = demoCircle();
    setModeButton("demo");
    history.replaceState(null, "", location.pathname);
    rebuild();
  }
  selected = -1;
  scene.focus(null);
  for (const [text, step] of STORY) {
    const p = caption(text);
    if (step === "contribute") {
      $("#chk-late").checked = false;
      await wait(600);
      await run(demoContribute);
    } else if (step === "pot") {
      scene.focus(null);
    } else if (step === "payout") {
      await wait(400);
      await run(demoPayout);
    } else if (step === "person") {
      const best = circle.members.reduce((b, m, i) => (score(m.history) > score(circle.members[b].history) ? i : b), 0);
      pick(best);
    }
    await p;
  }
};

rebuild();

// API para el panel (app.js): la escena se pausa cuando no está a la vista
// ---------- Tutoriales en la vista del círculo ----------
const HOWTO = [
  ["contribute", "Aportar"],
  ["payout", "Pagar el pozo"],
  ["guarantee", "Garantía"],
  ["create", "Crear círculo"],
  ["customize", "Personalizar"],
  ["simulator", "Simulador"],
  ["wallet", "Billetera"],
];
function renderHowto() {
  const box = $("#howto-chips");
  if (!box) return;
  box.innerHTML = "";
  for (const [id, label] of HOWTO) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "howto-chip";
    b.textContent = `▶ ${t(label)}`;
    b.onclick = async () => {
      const { openHelp } = await import("./guide/help.js");
      openHelp(id, { lang: getLang(), anchor: b });
    };
    box.appendChild(b);
  }
}
renderHowto();

let toured = false;
async function startFirstTour() {
  if (location.hash !== "#/circulo") { toured = false; location.hash = "#/circulo"; return; }
  const { startTour, TOURS } = await import("./guide/tour.js");
  setTimeout(() => startTour(TOURS.firstVisit, { lang: getLang(), id: "firstVisit" }), 900);
}

async function maybeTour() {
  if (toured) return;
  toured = true;
  const [{ startTour, TOURS, hasSeenTour }, { hasSeenWelcome }] = await Promise.all([import("./guide/tour.js"), import("./guide/welcome.js")]);
  if (hasSeenTour("firstVisit")) return;
  // la bienvenida va primero; ella lanza el recorrido si la persona lo pide
  if (!hasSeenWelcome()) { toured = false; return; }
  setTimeout(() => startTour(TOURS.firstVisit, { lang: getLang(), id: "firstVisit" }), 2600);
}

export const circleApp = {
  setActive: (on) => {
    scene.setActive(on);
    if (on) maybeTour();
  },
  openCircle: (id) => {
    location.hash = "#/circulo";
    run(() => openTestnet(id));
  },
  openCreate,
  connectWallet: () => {
    menu.hidden = false;
    $("#btn-wallet").focus();
  },
  connectBurner: async () => {
    let connected = null;
    await run(async () => { connected = await connectBurner(); await onConnected(connected); });
    return connected;
  },
  getTestUsdc: (amount = 20) => showUsdcDialog(amount),
  // Acciones que pide el panel de configuración (⚙)
  startTour: startFirstTour,
  pickFigure: (opts) => openFigurePicker(selected >= 0 ? selected : 0, opts),
  openStudio: async () => (await import("./custom/studio.js")).openStudio(getLang(), studioCtx()),
  disconnectWallet: () => {
    forgetWallet();
    const btn = $("#btn-wallet");
    btn.classList.remove("on");
    btn.setAttribute("data-i18n", "");
    btn.dataset.i18nKey = "Conectar billetera";
    btn.textContent = t("Conectar billetera");
    $("#wallet-balance").hidden = true;
    setState({ address: null });
    render();
    toastTranslated("Billetera desconectada en este navegador");
  },
};
if (location.hash.startsWith("#/circulo")) circleApp.setActive(true);

// Abrir un círculo compartido por enlace (?c=C…)
const shared = new URLSearchParams(location.search).get("c");
if (shared && StrKey.isValidContract(shared)) run(() => openTestnet(shared));
