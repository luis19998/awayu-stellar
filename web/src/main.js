import "./style.css";
import "./features.css";
import { StrKey } from "@stellar/stellar-sdk";
import { createScene } from "./scene.js";
import { historyStripDataURL } from "./aguayo.js";
import {
  demoCircle, contribute, payout, pot, recipientOf, score, creditLine, idleYield, depositGuarantee,
  ON_TIME, LATE, MISSED,
} from "./model.js";
import {
  loadDeployment, readCircle, explorerUrl, buildContributeXdr, buildPayoutXdr, buildCreateXdr,
  buildGuaranteeXdr, buildWithdrawXdr, buildAliasXdr, submit, ensureFunded, short,
} from "./chain.js";
import { pollarEnabled, connectFreighter, connectPollar, sign, wallet } from "./wallet.js";

const $ = (s) => document.querySelector(s);
const fmt = (n, t) => `${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })} ${t}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let circle = demoCircle();
let selected = -1;
let busy = false;
let deployment = null;

const scene = createScene($("#stage"), { onPick: (i) => pick(i) });

// ---------- Render ----------

function rebuild() {
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
  $("#s-round").textContent = done ? "fin" : `${c.round + 1}/${n}`;
  $("#s-amount").textContent = fmt(c.amount, c.token);
  $("#s-pot").textContent = fmt(pot(c), c.token);
  $("#s-recipient").textContent = done ? "Círculo completo" : c.members[rec].name;
  $("#s-deadline").textContent = deadlineText(c);
  $("#s-yield").textContent = "+" + fmt(idleYield(c), c.token);
  scene.setPotLevel(pot(c) / (c.amount * n));
  scene.updateLabels(c.members, c.members.map((m) => `${score(m.history)} pts`), rec);
  scene.placeIlla(bestMember(c));

  const ul = $("#members");
  ul.innerHTML = "";
  c.members.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = (i === selected ? "sel " : "") + (i === rec ? "turn-of" : "");
    const paid = c.paid.get(i);
    li.innerHTML = `<b></b><span class="sc">${score(m.history)} pts</span>
      <span class="st ${paid ? "ok" : ""}">${paid === ON_TIME ? "Aportó" : paid === LATE ? "Aportó tarde" : "Falta aportar"} · ${m.role}</span>
      <span class="chips">${m.guarantee > 0 ? `<i class="chip shield" title="Garantía disponible">Garantía ${fmt(m.guarantee, c.token)}</i>` : ""}</span>`;
    li.querySelector("b").textContent = m.name;
    if (m.history.length) {
      const img = new Image();
      img.alt = `Aguayo de ${m.name}`;
      img.src = historyStripDataURL(m.history);
      li.appendChild(img);
    }
    li.onclick = () => pick(i);
    ul.appendChild(li);
  });

  const t = isTestnet();
  const mine = myIndex();
  const bC = $("#btn-contribute");
  if (t) {
    bC.disabled = busy || done || !me() || mine < 0 || c.paid.has(mine);
    bC.textContent = !me() ? "Conectá tu billetera" : mine < 0 ? "No sos miembro" : c.paid.has(mine) ? "Ya aportaste" : "Aportar y firmar";
  } else {
    bC.disabled = busy || done || (selected >= 0 && c.paid.has(selected));
    bC.textContent = selected >= 0 ? `Aportar como ${c.members[selected].name}` : "Aportar (todos)";
  }
  $("#btn-payout").disabled = busy || !canPayout(c);
  renderGuarantee(c, done);
  $(".late").style.display = t ? "none" : "";
  const link = $("#lnk-contract");
  link.hidden = !c.contractId;
  if (c.contractId) link.href = explorerUrl(c.contractId);
  $("#btn-share").hidden = !t;
  renderPerson();
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
    if (s <= 0) return "Plazo vencido: ya se puede pagar el pozo";
    return s < 3600 ? `Plazo: ${Math.ceil(s / 60)} min` : s < 172800 ? `Plazo: ${Math.ceil(s / 3600)} h` : `Plazo: ${Math.ceil(s / 86400)} días`;
  }
  return `Una ronda cada ${c.periodDays} días`;
}

/** Botón de garantía: dejarla (una cuota) o, al terminar el círculo, retirarla. */
function renderGuarantee(c, done) {
  const b = $("#btn-guarantee");
  const t = isTestnet();
  if (t && c.version < 2) {
    b.hidden = true;
    return;
  }
  b.hidden = false;
  const who = t ? myIndex() : selected;
  const m = c.members[who];
  if (done) {
    b.textContent = "Retirar garantía";
    b.disabled = busy || !t || !m || !(m.guarantee > 0);
  } else {
    b.textContent = m ? (m.guarantee > 0 ? `${t ? "Tu" : "Su"} garantía está activa` : `Dejar garantía (${fmt(c.amount, c.token)})`) : "Elegí un miembro para dejar garantía";
    b.disabled = busy || !m || m.guarantee > 0 || (t && !me());
  }
}

function renderPerson() {
  const box = $("#person");
  if (selected < 0 || !circle.members[selected]) return void (box.hidden = true);
  const m = circle.members[selected];
  const credit = creditLine(m.history, circle.amount);
  box.hidden = false;
  box.innerHTML = `<h3></h3><p class="role"></p>
    <p>${m.history.length} rondas tejidas · reputación ${score(m.history)}/100</p>
    <p>Con este aguayo podría acceder a un microcrédito de</p>
    <div class="credit">${credit ? fmt(credit, circle.token) : "aún sin historial suficiente"}</div>
    <p><small>Es evidencia de pagos, verificable en la cadena; no es un crédito aprobado. Monto ilustrativo.</small></p>
    <form class="alias" hidden><label>Tu nombre en el círculo
      <input name="alias" maxlength="24" required placeholder="Ej.: Doña Rosa" /></label>
      <button class="ghost">Guardar en la cadena</button></form>`;
  box.querySelector("h3").textContent = m.name;
  box.querySelector(".role").textContent = m.role;
  const form = box.querySelector(".alias");
  if (isTestnet() && circle.version >= 2 && m.address === me()) {
    form.hidden = false;
    form.alias.value = m.alias || "";
    form.onsubmit = (e) => {
      e.preventDefault();
      const alias = form.alias.value.trim();
      if (!alias || new TextEncoder().encode(alias).length > 24) return toast("El nombre debe tener entre 1 y 24 caracteres");
      run(async () => {
        await signAndSend(() => buildAliasXdr(deployment, circle.contractId, me(), alias), "tu nombre");
        toast("Nombre guardado en la cadena ✓");
        await refreshChain(true);
      });
    };
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

// ---------- Acciones: demo ----------

async function animateContribution(i, mark) {
  await new Promise((r) => scene.flyContribution(i, r));
  scene.setPending(i, mark, circle.round);
}

async function animatePayout(to, amount, marks, round) {
  await new Promise((r) => scene.flyPayout(to, amount / circle.amount, r));
  marks.forEach((m, i) => scene.commitPending(i, m ?? MISSED, round));
  toast(`${circle.members[to].name} recibió ${fmt(amount, circle.token)}`);
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
  toast(`Preparando ${what}…`);
  const xdr = await buildXdr();
  toast("Firmá en tu billetera…", 60000);
  const signed = await sign(xdr);
  toast("Enviando a Stellar testnet…", 60000);
  return submit(deployment, signed);
}

async function chainContribute() {
  const i = myIndex();
  await signAndSend(() => buildContributeXdr(deployment, circle.contractId, me()), "tu aporte");
  await animateContribution(i, ON_TIME);
  toast("Aporte registrado en la cadena ✓");
  await refreshChain();
}

async function chainPayout() {
  const round = circle.round;
  const marks = circle.members.map((_, i) => circle.paid.get(i));
  const amount = pot(circle);
  const res = await signAndSend(() => buildPayoutXdr(deployment, circle.contractId, me()), "el pago del pozo");
  const to = circle.members.findIndex((m) => m.address === String(res?.value));
  await animatePayout(to < 0 ? recipientOf(circle) : to, amount, marks, round);
  await refreshChain(true);
}

async function run(fn) {
  if (busy) return;
  busy = true;
  render();
  try {
    await fn();
  } catch (e) {
    console.error(e);
    toast("No se pudo: " + friendly(e), 5000);
  } finally {
    busy = false;
    render();
  }
}

function friendly(e) {
  const m = String(e?.message || e);
  if (/User declined|rejected|denied/i.test(m)) return "cancelaste la firma";
  if (/Error\(Contract, #8\)/.test(m)) return "la ronda sigue abierta";
  if (/Error\(Contract, #6\)/.test(m)) return "ya aportaste en esta ronda";
  if (/Error\(Contract, #5\)/.test(m)) return "no sos miembro del círculo";
  return m.length > 140 ? m.slice(0, 140) + "…" : m;
}

$("#btn-contribute").onclick = () => run(isTestnet() ? chainContribute : demoContribute);

$("#btn-guarantee").onclick = () =>
  run(async () => {
    const done = circle.round >= circle.order.length;
    if (!isTestnet()) {
      if (depositGuarantee(circle, selected)) toast(`${circle.members[selected].name} dejó una cuota de garantía`);
      return;
    }
    if (done) {
      await signAndSend(() => buildWithdrawXdr(deployment, circle.contractId, me()), "el retiro de tu garantía");
      toast("Garantía devuelta a tu billetera ✓");
    } else {
      await signAndSend(() => buildGuaranteeXdr(deployment, circle.contractId, me()), "tu garantía");
      toast("Garantía depositada: si un día no podés pagar, cubre tu cuota ✓");
    }
    await refreshChain(true);
  });
$("#btn-payout").onclick = () => run(isTestnet() ? chainPayout : demoPayout);

// ---------- Modos y carga de círculos ----------

async function openTestnet(contractId) {
  deployment ??= await loadDeployment();
  if (!deployment) throw new Error("Falta testnet.json");
  const id = contractId || deployment.contractId;
  toast("Leyendo el contrato en Stellar testnet…");
  circle = await readCircle(deployment, id, me() ? { [me()]: "Vos" } : {});
  setModeButton("testnet");
  selected = -1;
  rebuild();
  const url = new URL(location.href);
  if (id !== deployment.contractId) url.searchParams.set("c", id);
  else url.searchParams.delete("c");
  history.replaceState(null, "", url);
  toast("Datos reales del contrato en testnet");
}

async function refreshChain(full = false) {
  if (!isTestnet()) return;
  const before = circle;
  const next = await readCircle(deployment, circle.contractId, me() ? { [me()]: "Vos" } : {});
  circle = next;
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
    circle = demoCircle();
    setModeButton("demo");
    selected = -1;
    rebuild();
    history.replaceState(null, "", location.pathname);
    toast("Modo demo");
  };
});

setInterval(() => {
  if (!isTestnet() || busy) return;
  $("#s-deadline").textContent = deadlineText(circle);
  refreshChain().catch(() => {});
}, 20000);

// ---------- Billetera ----------

const menu = $("#wallet-menu");
if (!pollarEnabled) {
  menu.querySelectorAll("[data-w=google],[data-w=email]").forEach((x) => {
    x.disabled = true;
    x.title = "Falta la clave publicable de Pollar (VITE_POLLAR_KEY)";
  });
}
$("#btn-wallet").onclick = () => (menu.hidden = !menu.hidden);

async function onConnected(w) {
  menu.hidden = true;
  const btn = $("#btn-wallet");
  btn.textContent = `${w.kind === "pollar" ? "Pollar" : "Freighter"} · ${short(w.address)}`;
  btn.classList.add("on");
  deployment ??= await loadDeployment();
  if (deployment && (await ensureFunded(deployment, w.address))) toast("Cuenta de testnet fondeada con Friendbot");
  else toast("Billetera conectada");
  if (isTestnet()) await refreshChain(true);
  render();
}

menu.querySelectorAll("button").forEach((b) => {
  b.onclick = () =>
    run(async () => {
      if (b.dataset.w === "freighter") {
        try {
          await onConnected(await connectFreighter());
        } catch (e) {
          if (e.message === "FREIGHTER_MISSING") {
            window.open("https://www.freighter.app/", "_blank", "noopener");
            throw new Error("instalá Freighter (se abrió su página) y elegí la red Testnet");
          }
          throw e;
        }
      } else if (b.dataset.w === "google") {
        await connectPollar("google", (w) => onConnected(w));
      } else {
        const email = prompt("Tu correo para recibir el código de Pollar:");
        if (email) await connectPollar({ provider: "email", email }, (w) => onConnected(w));
      }
    });
});

// ---------- Crear un pasanaku ----------

const dlg = $("#dlg-create");
$("#btn-create").onclick = () => {
  if (!me()) {
    menu.hidden = false;
    return toast("Primero conectá tu billetera");
  }
  $("#create-err").textContent = "";
  dlg.showModal();
};

$("#form-create").addEventListener("submit", (ev) => {
  if (ev.submitter?.value !== "ok") return;
  ev.preventDefault();
  const f = new FormData(ev.target);
  const others = String(f.get("members")).split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const bad = others.find((a) => !StrKey.isValidEd25519PublicKey(a));
  const err = $("#create-err");
  if (bad) return void (err.textContent = `Dirección inválida: ${short(bad)}`);
  const members = [...new Set([me(), ...others])];
  if (members.length < 2) return void (err.textContent = "Hacen falta al menos 2 miembros");
  const amount = Number(f.get("amount"));
  const periodSeconds = Number(f.get("period"));
  dlg.close();
  run(async () => {
    deployment ??= await loadDeployment();
    for (const a of members) await ensureFunded(deployment, a).catch(() => {});
    const res = await signAndSend(() => buildCreateXdr(deployment, me(), { members, amount, periodSeconds }), "el nuevo círculo");
    const id = String(res.value);
    saveCircle(id);
    toast("¡Pasanaku creado! Compartí el enlace con los miembros");
    busy = false;
    await openTestnet(id);
  });
});

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
    toast("Enlace copiado: cualquiera puede ver el círculo; los miembros aportan con su billetera");
  } catch {
    prompt("Copiá este enlace:", url.toString());
  }
};

// ---------- Recorrido guiado para el pitch ----------

const STORY = [
  ["En Bolivia, millones ahorran en pasanakus: confianza pura, cero historial.", null],
  ["Awayu lleva el pasanaku a Stellar: cuotas en dólares digitales, reglas en un contrato.", null],
  ["Cada pago teje una capa de aguayo. Vivo y a tiempo, colores plenos.", "contribute"],
  ["Mientras el pozo espera, rinde en Vaquita. Nadie lo toca.", "pot"],
  ["El turno se sorteó en la cadena. Hoy cobra quien le toca, sin discusión.", "payout"],
  ["Ese aguayo es tu historial crediticio: portable, verificable, tuyo.", "person"],
];

async function caption(text, ms = 3200) {
  const el = $("#caption");
  el.textContent = text;
  el.classList.add("on");
  await wait(ms);
  el.classList.remove("on");
  await wait(400);
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

// Abrir un círculo compartido por enlace (?c=C…)
const shared = new URLSearchParams(location.search).get("c");
if (shared && StrKey.isValidContract(shared)) run(() => openTestnet(shared));
