const pick = (o, l) => o[l] ?? o.es;
const tr = (es, en, pt) => ({ es, en, pt, qu: es, ay: es, gn: es });
import "./ia.css";
import { subscribe } from "../state.js";
export function suggestions({ route = "inicio", circle = null, address = null, deployment = null, lang = "es", now = Date.now() } = {}) {
  const out = [];
  const add = (id, priority, text, ask) => out.push({ id, priority, text: pick(text, lang), ask: pick(ask, lang) });
  if (!address) add("wallet", 30, tr("Puedes probar todo en modo demo; para firmar en testnet conecta una billetera.", "You can try everything in demo mode; connect a wallet to sign on testnet.", "Puedes probar todo en modo demo; para firmar en testnet conecta una billetera."), tr("¿Qué puedo hacer en modo demo y cómo conecto una billetera?", "What can I do in demo mode, and how do I connect a wallet?", "¿Qué puedo hacer en modo demo y cómo conecto una billetera?"));
  if (circle?.members?.length && Array.isArray(circle.order)) {
    const members = circle.members; const idx = members.findIndex((m) => m.address === address || m.publicKey === address || m.wallet === address);
    const round = Number(circle.round || 0); const rawDeadline = circle.deadline || circle.dueAt;
    const dueAt = typeof rawDeadline === "number" ? (rawDeadline < 1e12 ? rawDeadline * 1000 : rawDeadline) : Date.parse(rawDeadline);
    if (idx >= 0 && circle.order[round] === idx && !circle.paid?.has?.(idx)) add("your-turn", 100, tr("Te toca aportar en esta ronda.", "It is your turn to contribute this round.", "Te toca aportar en esta ronda."), tr("¿Cómo hago mi aporte en esta ronda?", "How do I contribute this round?", "¿Cómo hago mi aporte en esta ronda?"));
    if (dueAt && Number.isFinite(dueAt)) { const days = Math.ceil((dueAt - Number(now)) / 86400000); if (days >= 0 && days <= 7) add("deadline", 80, tr(`La ronda vence en ${days} días.`, `The round is due in ${days} days.`, `La ronda vence en ${days} días.`), tr("¿Cuándo y cómo debo aportar?", "When and how should I contribute?", "¿Cuándo y cómo debo aportar?")); }
    const missing = members.reduce((n, _, i) => n + (!circle.paid?.has?.(i) ? 1 : 0), 0);
    if (missing > 0) add("missing-payments", 70, tr(`Faltan ${missing} aportes; cuando estén todos se puede pagar el pozo.`, `${missing} contributions are missing; the pot can be paid when all arrive.`, `Faltan ${missing} aportes; cuando estén todos se puede pagar el pozo.`), tr("¿Qué falta para pagar el pozo?", "What is needed to pay the pot?", "¿Qué falta para pagar el pozo?"));
    else if (members.length && circle.order[round] != null) add("pot-ready", 75, tr(`El pozo está completo: ya se puede pagar a ${members[circle.order[round]]?.name || "la persona correspondiente"}.`, `The pot is complete and can be paid to ${members[circle.order[round]]?.name || "the next recipient"}.`, `El pozo está completo: ya se puede pagar a ${members[circle.order[round]]?.name || "la persona correspondiente"}.`), tr("¿Cómo se paga el pozo?", "How is the pot paid?", "¿Cómo se paga el pozo?"));
    if (idx >= 0 && !(members[idx].guarantee > 0)) add("no-guarantee", 45, tr("No tienes garantía: si un mes no puedes pagar, nadie te cubre.", "You have no guarantee: if you cannot pay one month, nobody covers your contribution.", "No tienes garantía: si un mes no puedes pagar, nadie te cubre."), tr("¿Cómo funciona la garantía?", "How does the guarantee work?", "¿Cómo funciona la garantía?"));
    const highRisk = members.some((m) => (m.history || []).filter((x) => x === 3).length >= 2);
    if (highRisk) add("risk-guarantee", 60, tr("El riesgo de incumplimiento es alto; el grupo puede considerar garantías.", "Default risk is high; the group may consider guarantees.", "El riesgo de incumplimiento es alto; el grupo puede considerar garantías."), tr("¿Cómo ayudan las garantías a reducir el riesgo?", "How can guarantees reduce risk?", "¿Cómo ayudan las garantías a reducir el riesgo?"));
  }
  if (route === "ayni") add("ayni-vote", 65, tr("Revisa si hay pedidos de ayni que esperan tu voto.", "Check whether any ayni requests are waiting for your vote.", "Revisa si hay pedidos de ayni que esperan tu voto."), tr("¿Cómo reviso y voto un pedido de ayni?", "How do I review and vote on an ayni request?", "¿Cómo reviso y voto un pedido de ayni?"));
  if (route === "minka") add("minka-evidence", 65, tr("El siguiente hito de minka necesita evidencia.", "The next minka milestone needs evidence.", "El siguiente hito de minka necesita evidencia."), tr("¿Cómo agrego evidencia a un hito de minka?", "How do I add evidence to a minka milestone?", "¿Cómo agrego evidencia a un hito de minka?"));
  if (route === "alasitas") add("alasitas-streak", 65, tr("Tu racha semanal de alasitas está en riesgo; registra tu ahorro.", "Your weekly alasitas streak is at risk; record your savings.", "Tu racha semanal de alasitas está en riesgo; registra tu ahorro."), tr("¿Cómo mantengo mi racha de ahorro?", "How do I keep my savings streak?", "¿Cómo mantengo mi racha de ahorro?"));
  return out.sort((a, b) => b.priority - a.priority);
}

export function mountProactive({ state, getLang = () => "es" }) {
  let shown = new Set(); let dismissed = false; let lastRoute = ""; let active = true;
  try { dismissed = localStorage.getItem("awayu.proactive.muted") === "1"; } catch {}
  const card = document.createElement("aside"); card.className = "proactive-card"; card.hidden = true; card.tabIndex = -1; card.setAttribute("role", "status"); card.setAttribute("aria-live", "polite"); document.body.append(card);
  const update = () => {
    const route = document.body.dataset.route || "inicio";
    if (route !== lastRoute) { lastRoute = route; }
    if (!active || dismissed) { card.hidden = true; return; }
    const all = suggestions({ route, circle: state.circle, address: state.address, deployment: state.deployment, lang: getLang() });
    if (shown.has(route)) { card.hidden = true; return; }
    const next = all[0];
    if (!next) { card.hidden = true; return; }
    shown.add(route);
    card.innerHTML = `<button type="button" class="dismiss" aria-label="Cerrar">×</button><p>${next.text}</p><button type="button" class="ask">${pick(tr("Explícame", "Explain", "Explique"), getLang())}</button><button type="button" class="voice" aria-label="Escuchar">🔊</button><button type="button" class="mute">${pick(tr("No mostrar consejos", "Hide tips", "Não mostrar dicas"), getLang())}</button>`;
    card.hidden = false;
    card.focus({ preventScroll: true });
    card.querySelector(".dismiss").onclick = () => { card.hidden = true; };
    card.querySelector(".mute").onclick = () => {
      dismissed = true;
      try { localStorage.setItem("awayu.proactive.muted", "1"); } catch {}
      card.hidden = true;
      dispatchEvent(new CustomEvent("awayu:proactive-muted", { detail: { muted: true, source: "amawta" } }));
    };
    card.querySelector(".voice").onclick = async () => (await import("./voice.js")).speak(next.text, getLang());
    card.querySelector(".ask").onclick = () => { sessionStorage.setItem("awayu.amawta.ask", next.ask); if (route === "amawta") { const input = document.querySelector('#view [name="q"]'); const form = document.querySelector("#view #ask"); if (input && form) { input.value = next.ask; form.requestSubmit(); sessionStorage.removeItem("awayu.amawta.ask"); } } else location.hash = "#/amawta"; };
  };
  const onMuteChange = (event) => {
    dismissed = Boolean(event.detail?.muted);
    if (!dismissed) shown.delete(lastRoute);
    update();
  };
  const unsub = subscribe(update);
  addEventListener("hashchange", update);
  addEventListener("awayu:proactive-muted", onMuteChange);
  update();
  return { destroy() { active = false; removeEventListener("hashchange", update); removeEventListener("awayu:proactive-muted", onMuteChange); unsub(); card.remove(); } };
}
