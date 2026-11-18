import "./style.css";
import { createScene } from "./scene.js";
import { historyStripDataURL } from "./aguayo.js";
import {
  demoCircle, contribute, payout, pot, recipientOf, score, creditLine, idleYield, ON_TIME, LATE,
} from "./model.js";
import { loadDeployment, readCircle, explorerUrl } from "./chain.js";
import { pollarEnabled, login } from "./wallet.js";

const $ = (s) => document.querySelector(s);
const fmt = (n, t) => `${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })} ${t}`;

let circle = demoCircle();
let selected = -1;
let busy = false;
let deployment = null;

const scene = createScene($("#stage"), { onPick: (i) => pick(i) });
rebuild();

function rebuild() {
  scene.setMembers(circle.members);
  circle.paid.forEach((mark, i) => scene.setPending(i, mark, circle.round));
  scene.setTurn(recipientOf(circle), false);
  render();
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

  const scores = c.members.map((m) => `${score(m.history)} pts`);
  scene.updateLabels(c.members, scores, rec);

  const ul = $("#members");
  ul.innerHTML = "";
  c.members.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = (i === selected ? "sel " : "") + (i === rec ? "turn-of" : "");
    const paid = c.paid.get(i);
    li.innerHTML = `<b>${m.name}</b><span class="sc">${score(m.history)} pts</span>
      <span class="st ${paid ? "ok" : ""}">${paid === ON_TIME ? "Aportó" : paid === LATE ? "Aportó tarde" : "Falta aportar"} · ${m.role}</span>
      <span></span>`;
    if (m.history.length) {
      const img = new Image();
      img.alt = `Aguayo de ${m.name}`;
      img.src = historyStripDataURL(m.history);
      li.appendChild(img);
    }
    li.onclick = () => pick(i);
    ul.appendChild(li);
  });

  const testnet = c.mode === "testnet";
  $("#btn-contribute").disabled = busy || done || testnet || (selected >= 0 && c.paid.has(selected));
  $("#btn-payout").disabled = busy || done || testnet || c.paid.size === 0;
  $("#btn-contribute").textContent = selected >= 0 ? `Aportar como ${c.members[selected].name}` : "Aportar (todos)";
  $(".late").style.display = testnet ? "none" : "";
  const link = $("#lnk-contract");
  link.hidden = !c.contractId;
  if (c.contractId) link.href = explorerUrl(c.contractId);
  renderPerson();
}

function deadlineText(c) {
  if (c.mode === "testnet" && c.deadline) {
    const s = c.deadline - Date.now() / 1000;
    return s > 0 ? `Plazo: ${Math.ceil(s / 60)} min` : "Plazo vencido: ya se puede pagar el pozo";
  }
  return `Una ronda cada ${c.periodDays} días`;
}

function renderPerson() {
  const box = $("#person");
  if (selected < 0) {
    box.hidden = true;
    return;
  }
  const m = circle.members[selected];
  const credit = creditLine(m.history, circle.amount);
  box.hidden = false;
  box.innerHTML = `<h3>${m.name}</h3>
    <p>${m.role}</p>
    <p>${m.history.length} rondas tejidas · reputación ${score(m.history)}/100</p>
    <p>Con este aguayo podría acceder a un microcrédito de</p>
    <div class="credit">${credit ? fmt(credit, circle.token) : "aún sin historial suficiente"}</div>
    <p><small>Historial en la cadena, portable y verificable por cualquier cooperativa. Monto ilustrativo.</small></p>`;
}

function pick(i) {
  selected = i === selected ? -1 : i;
  scene.select(selected);
  scene.focus(selected < 0 ? null : selected);
  render();
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("on"), 2600);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function doContribute(i, late) {
  const mark = contribute(circle, i, late);
  if (!mark) return;
  await new Promise((r) => scene.flyContribution(i, r));
  scene.setPending(i, mark, circle.round);
  render();
}

async function contributeAction() {
  if (busy) return;
  busy = true;
  render();
  const late = $("#chk-late").checked;
  const who = selected >= 0 ? [selected] : circle.members.map((_, i) => i).filter((i) => !circle.paid.has(i));
  for (const i of who) {
    await doContribute(i, late);
    await wait(180);
  }
  busy = false;
  render();
}

async function payoutAction() {
  if (busy) return;
  busy = true;
  render();
  const round = circle.round;
  const marks = circle.members.map((_, i) => circle.paid.get(i));
  const res = payout(circle);
  if (!res) return void (busy = false);
  await new Promise((r) => scene.flyPayout(res.to, res.amount / circle.amount, r));
  marks.forEach((m, i) => scene.commitPending(i, m ?? 3, round));
  toast(`${circle.members[res.to].name} recibió ${fmt(res.amount, circle.token)}`);
  await wait(500);
  scene.setTurn(recipientOf(circle));
  busy = false;
  render();
}

$("#btn-contribute").onclick = contributeAction;
$("#btn-payout").onclick = payoutAction;

// Modo demo / testnet
document.querySelectorAll(".modes button").forEach((b) => {
  b.onclick = async () => {
    if (b.classList.contains("on") || busy) return;
    if (b.dataset.mode === "testnet") {
      deployment ??= await loadDeployment();
      if (!deployment) return toast("Aún no hay contrato desplegado (falta testnet.json)");
      toast("Leyendo el contrato en Stellar testnet…");
      try {
        circle = await readCircle(deployment);
      } catch (e) {
        console.error(e);
        return toast("No se pudo leer el contrato: " + e.message);
      }
    } else {
      circle = demoCircle();
    }
    document.querySelectorAll(".modes button").forEach((x) => x.classList.toggle("on", x === b));
    selected = -1;
    rebuild();
    toast(circle.mode === "testnet" ? "Datos reales del contrato en testnet" : "Modo demo");
  };
});

$("#btn-login").onclick = async () => {
  if (!pollarEnabled) {
    return toast("Falta la clave publicable de Pollar (VITE_POLLAR_KEY) para entrar con Google");
  }
  await login("google", (address) => toast(`Billetera lista: ${address.slice(0, 6)}…${address.slice(-4)}`));
};

// Recorrido guiado para el pitch
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
    document.querySelectorAll(".modes button").forEach((x) => x.classList.toggle("on", x.dataset.mode === "demo"));
    rebuild();
  }
  selected = -1;
  scene.focus(null);
  for (const [text, step] of STORY) {
    const p = caption(text);
    if (step === "contribute") {
      $("#chk-late").checked = false;
      await wait(600);
      await contributeAction();
    } else if (step === "pot") {
      scene.focus(null);
    } else if (step === "payout") {
      await wait(400);
      await payoutAction();
    } else if (step === "person") {
      const best = circle.members.reduce((b, m, i) => (score(m.history) > score(circle.members[b].history) ? i : b), 0);
      pick(best);
    }
    await p;
  }
};

// Refrescar el contador de plazo
setInterval(() => circle.mode === "testnet" && ($("#s-deadline").textContent = deadlineText(circle)), 15000);
