const pick = (o, l) => o[l] ?? o.es;
const tr = (es, en, pt) => ({ es, en, pt, qu: es, ay: es, gn: es });
import "./ia.css";
import { subscribe } from "../state.js";
export function suggestions({ route = "inicio", circle = null, address = null, deployment = null, lang = "es", now = Date.now() } = {}) {
  const out = [];
  const add = (id, priority, text, ask) => out.push({ id, priority, text: pick(text, lang), ask: pick(ask, lang) });
  if (!address) add("wallet", 30, tr("Puedes probar todo en modo demo; para firmar en testnet conecta una billetera.", "You can try everything in demo mode; connect a wallet to sign on testnet.", "Você pode testar tudo no modo de demonstração; conecte uma carteira para assinar na testnet."), tr("¿Qué puedo hacer en modo demo y cómo conecto una billetera?", "What can I do in demo mode, and how do I connect a wallet?", "O que posso fazer no modo de demonstração e como conecto uma carteira?"));
  if (circle?.members?.length && Array.isArray(circle.order)) {
    const members = circle.members; const idx = members.findIndex((m) => m.address === address || m.publicKey === address || m.wallet === address);
    const round = Number(circle.round || 0); const rawDeadline = circle.deadline || circle.dueAt;
    const dueAt = typeof rawDeadline === "number" ? (rawDeadline < 1e12 ? rawDeadline * 1000 : rawDeadline) : Date.parse(rawDeadline);
    if (idx >= 0 && circle.order[round] === idx && !circle.paid?.has?.(idx)) add("your-turn", 100, tr("Te toca aportar en esta ronda.", "It is your turn to contribute this round.", "É sua vez de contribuir nesta rodada."), tr("¿Cómo hago mi aporte en esta ronda?", "How do I contribute this round?", "Como faço minha contribuição nesta rodada?"));
    if (dueAt && Number.isFinite(dueAt)) { const days = Math.ceil((dueAt - Number(now)) / 86400000); if (days >= 0 && days <= 7) add("deadline", 80, tr("La ronda vence en " + days + " días.", "The round is due in " + days + " days.", "A rodada vence em " + days + " dias."), tr("¿Cuándo y cómo debo aportar?", "When and how should I contribute?", "Quando e como devo contribuir?")); }
    const missing = members.reduce((n, _, i) => n + (!circle.paid?.has?.(i) ? 1 : 0), 0);
    if (missing > 0) add("missing-payments", 70, tr("Faltan " + missing + " aportes; cuando estén todos se puede pagar el pozo.", missing + " contributions are missing; the pot can be paid when all arrive.", "Faltam " + missing + " contribuições; o fundo poderá ser pago quando todas forem feitas."), tr("¿Qué falta para pagar el pozo?", "What is needed to pay the pot?", "O que falta para pagar o fundo?"));
    else if (members.length && circle.order[round] != null) add("pot-ready", 75, tr("El pozo está completo: ya se puede pagar a " + (members[circle.order[round]]?.name || "la persona correspondiente") + ".", "The pot is complete and can be paid to " + (members[circle.order[round]]?.name || "the next recipient") + ".", "O fundo está completo e já pode ser pago a " + (members[circle.order[round]]?.name || "quem tem direito a receber") + "."), tr("¿Cómo se paga el pozo?", "How is the pot paid?", "Como o fundo é pago?"));
    if (idx >= 0 && !(members[idx].guarantee > 0)) add("no-guarantee", 45, tr("No tienes garantía: si un mes no puedes pagar, nadie te cubre.", "You have no guarantee: if you cannot pay one month, nobody covers your contribution.", "Você não tem garantia: se não puder pagar em um mês, ninguém cobrirá sua contribuição."), tr("¿Cómo funciona la garantía?", "How does the guarantee work?", "Como funciona a garantia?"));
    const highRisk = members.some((m) => (m.history || []).filter((x) => x === 3).length >= 2);
    if (highRisk) add("risk-guarantee", 60, tr("El riesgo de incumplimiento es alto; el grupo puede considerar garantías.", "Default risk is high; the group may consider guarantees.", "O risco de inadimplência é alto; o grupo pode considerar garantias."), tr("¿Cómo ayudan las garantías a reducir el riesgo?", "How can guarantees reduce risk?", "Como as garantias ajudam a reduzir o risco?"));
  }
  if (route === "ayni") add("ayni-vote", 65, tr("Revisa si hay pedidos de ayni que esperan tu voto.", "Check whether any ayni requests are waiting for your vote.", "Confira se há pedidos de ayni aguardando seu voto."), tr("¿Cómo reviso y voto un pedido de ayni?", "How do I review and vote on an ayni request?", "Como analiso e voto em um pedido de ayni?"));
  if (route === "minka") add("minka-evidence", 65, tr("El siguiente hito de minka necesita evidencia.", "The next minka milestone needs evidence.", "A próxima etapa da minka precisa de evidências."), tr("¿Cómo agrego evidencia a un hito de minka?", "How do I add evidence to a minka milestone?", "Como adiciono evidências a uma etapa da minka?"));
  if (route === "alasitas") add("alasitas-streak", 65, tr("Tu racha semanal de alasitas está en riesgo; registra tu ahorro.", "Your weekly alasitas streak is at risk; record your savings.", "Sua sequência semanal de poupança em alasitas está em risco; registre sua contribuição."), tr("¿Cómo mantengo mi racha de ahorro?", "How do I keep my savings streak?", "Como mantenho minha sequência de poupança?"));
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
    card.innerHTML = `<button type="button" class="dismiss" aria-label="${pick(tr("Cerrar", "Close", "Fechar"), getLang())}">×</button><p>${next.text}</p><button type="button" class="ask">${pick(tr("Explícame", "Explain", "Explique"), getLang())}</button><button type="button" class="voice" aria-label="${pick(tr("Escuchar", "Listen", "Ouvir"), getLang())}">🔊</button><button type="button" class="mute">${pick(tr("No mostrar consejos", "Hide tips", "Não mostrar dicas"), getLang())}</button>`;
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
  const onLanguage = () => { if (!card.hidden) shown.delete(lastRoute); update(); };
  addEventListener("awayu:lang", onLanguage);
  update();
  return { destroy() { active = false; removeEventListener("hashchange", update); removeEventListener("awayu:proactive-muted", onMuteChange); removeEventListener("awayu:lang", onLanguage); unsub(); card.remove(); } };
}
