import { createAyniDemo, buildContributeXdr, buildRequestXdr, buildVoteXdr, buildResolveXdr, buildRepayXdr, buildJoinXdr, readFund, readRequests, readMembers } from "../modes/ayni.js";
import { pickLang, t } from "../i18n.js";

const COPY = {
  es: { title: "Ayni · fondo de ayuda mutua", sub: "Hoy te ayudo, mañana me ayudas.", pot: "Fondo común", contribute: "Aportar", ask: "Pedir ayuda", vote: "Votar", yes: "A favor", no: "En contra", reason: "¿Para qué necesitas ayuda?", amount: "Monto", send: "Enviar pedido", empty: "Todavía no hay pedidos.", open: "En votación", approved: "Aprobado", rejected: "Rechazado", by: "pidió ayuda", votes: "votos a favor", history: "Lo que va pasando", people: "vecinas y vecinos", demo: "Demo local", askHint: "Cuéntanos brevemente qué pasó", repay: "Devolver ayuda", close: "Cerrar resultado", error: "No se pudo completar", success: "Listo, quedó registrado en esta demo.", monthly: "Aporte mensual", against: "en contra", back: "Volver", you: "Tú", neighbor: "Vecina/o", noDebt: "Todavía no tienes ayuda pendiente por devolver.", repayAmount: "Monto que quieres devolver", historyContribute: "aportó al fondo", historyAsk: "pidió ayuda", historyVoteFor: "votó a favor", historyVoteAgainst: "votó en contra", historyRepay: "devolvió su ayuda", historyApproved: "La comunidad aprobó un pedido", historyRejected: "La comunidad rechazó un pedido" },
  en: { title: "Ayni · mutual aid fund", sub: "I help you today, you help me tomorrow.", pot: "Shared fund", contribute: "Contribute", ask: "Ask for help", vote: "Vote", yes: "In favor", no: "Against", reason: "What do you need help with?", amount: "Amount", send: "Send request", empty: "No requests yet.", open: "Voting", approved: "Approved", rejected: "Declined", by: "asked for help", votes: "votes in favor", history: "What’s happening", people: "neighbors", demo: "Local demo", askHint: "Briefly tell us what happened", repay: "Repay help", close: "Close result", error: "Could not complete", success: "Done, saved in this demo.", monthly: "Monthly contribution", against: "against", back: "Back", you: "You", neighbor: "Neighbor", noDebt: "You have no help to repay yet.", repayAmount: "Amount to repay", historyContribute: "contributed to the fund", historyAsk: "asked for help", historyVoteFor: "voted in favor", historyVoteAgainst: "voted against", historyRepay: "repaid the help", historyApproved: "The community approved a request", historyRejected: "The community declined a request" },
};
for (const code of ["pt", "qu", "ay", "gn"]) COPY[code] = { ...COPY.es };
COPY.pt = { title: "Ayni · fundo de ajuda mútua", sub: "Hoje eu ajudo você, amanhã você me ajuda.", pot: "Fundo comum", contribute: "Contribuir", ask: "Pedir ajuda", vote: "Votar", yes: "A favor", no: "Contra", reason: "Para que você precisa de ajuda?", amount: "Valor", send: "Enviar pedido", empty: "Ainda não há pedidos.", open: "Em votação", approved: "Aprovado", rejected: "Recusado", by: "pediu ajuda", votes: "votos a favor", history: "O que está acontecendo", people: "vizinhas e vizinhos", demo: "Demonstração local", askHint: "Conte brevemente o que aconteceu", repay: "Devolver ajuda", close: "Encerrar resultado", error: "Não foi possível concluir", success: "Pronto, ficou registrado.", monthly: "Contribuição mensal", against: "contra", back: "Voltar", you: "Você", neighbor: "Pessoa vizinha", noDebt: "Você não tem ajuda pendente para devolver.", repayAmount: "Valor que deseja devolver", historyContribute: "contribuiu para o fundo", historyAsk: "pediu ajuda", historyVoteFor: "votou a favor", historyVoteAgainst: "votou contra", historyRepay: "devolveu a ajuda", historyApproved: "A comunidade aprovou um pedido", historyRejected: "A comunidade recusou um pedido" };
// Unirse al fondo (Ayni v2), en los seis idiomas
const JOIN = {
  es: { join: "Unirme al fondo", hint: "Aporta tu primera cuota y participa: podrás pedir ayuda y votar los pedidos nuevos.", needJoin: "Primero únete al fondo.", connect: "Conecta tu billetera para unirte al fondo.", joined: "¡Ya eres parte del fondo!" },
  en: { join: "Join the fund", hint: "Pay your first share and take part: you can ask for help and vote on new requests.", needJoin: "Join the fund first.", connect: "Connect your wallet to join the fund.", joined: "You're now part of the fund!" },
  pt: { join: "Entrar no fundo", hint: "Pague sua primeira cota e participe: você poderá pedir ajuda e votar nos novos pedidos.", needJoin: "Primeiro entre no fundo.", connect: "Conecte sua carteira para entrar no fundo.", joined: "Agora você faz parte do fundo!" },
  qu: { join: "Qullqi huñuman yaykuy", hint: "Ñawpaq qullqiykita churay: yanapata mañakuyta, musuq mañakuykunata akllaytapas atinki.", needJoin: "Ñawpaqta qullqi huñuman yaykuy.", connect: "Qullqi wayaqaykita tinkiy yaykunaykipaq.", joined: "¡Ñan qullqi huñupi kanki!" },
  ay: { join: "Qullqi tantachawir mantaña", hint: "Nayrir qullqima churma: yanapa mayiñamsa, machaq mayiwinak ajlliñamsa.", needJoin: "Nayraqat qullqi tantachawir mantma.", connect: "Qullqi wayaqam chikt'ayam mantañataki.", joined: "¡Jichhax qullqi tantachawin utjtawa!" },
  gn: { join: "Eike viru atýpe", hint: "Emoĩ nde viru peteĩha ha eike: ikatúta rejerure pytyvõ ha eiporavo umi jerure pyahu.", needJoin: "Eike raẽ viru atýpe.", connect: "Embojoaju nde viru ryru reike hag̃ua.", joined: "¡Reime ko'ágã viru atýpe!" },
};

const ACTION_ERRORS = {
  "No encontramos a esa persona en el fondo.": { es: "No encontramos a esa persona en el fondo.", en: "That person is not part of the fund.", pt: "Essa pessoa não participa do fundo." },
  "Ya aportaste en este período de 30 días.": { es: "Ya aportaste en este período de 30 días.", en: "You have already contributed during this 30-day period.", pt: "Você já contribuiu neste período de 30 dias." },
  "Ya tienes un pedido abierto.": { es: "Ya tienes un pedido abierto.", en: "You already have an open request.", pt: "Você já tem um pedido aberto." },
  "El monto supera el máximo permitido o no es válido.": { es: "El monto supera el máximo permitido o no es válido.", en: "The amount is invalid or exceeds the allowed maximum.", pt: "O valor é inválido ou excede o limite permitido." },
  "El fondo todavía no tiene ese monto disponible.": { es: "El fondo todavía no tiene ese monto disponible.", en: "The fund does not have that amount available yet.", pt: "O fundo ainda não tem esse valor disponível." },
  "Cuéntanos brevemente para qué necesitas la ayuda.": { es: "Cuéntanos brevemente para qué necesitas la ayuda.", en: "Briefly tell us what you need help with.", pt: "Conte brevemente para que você precisa de ajuda." },
  "Ese pedido ya se cerró o no existe.": { es: "Ese pedido ya se cerró o no existe.", en: "That request is closed or does not exist.", pt: "Esse pedido foi encerrado ou não existe." },
  "Quien pide ayuda no vota su propio pedido.": { es: "Quien pide ayuda no vota su propio pedido.", en: "People cannot vote on their own help request.", pt: "Quem pede ajuda não pode votar no próprio pedido." },
  "Ya votaste este pedido.": { es: "Ya votaste este pedido.", en: "You have already voted on this request.", pt: "Você já votou neste pedido." },
  "El monto debe ser positivo y no superar tu saldo por devolver.": { es: "El monto debe ser positivo y no superar tu saldo por devolver.", en: "Enter a positive amount no greater than your outstanding balance.", pt: "Informe um valor positivo que não ultrapasse o saldo pendente." },
};

const STYLES = `
.ayni-root{box-sizing:border-box;position:relative;min-height:620px;padding:26px;overflow:hidden;border-radius:24px;color:#fff;background:radial-gradient(ellipse at 50% 20%,#3c2548 0%,#17142b 58%,#10101d 100%);font:14px/1.45 system-ui,sans-serif}
.ayni-root *{box-sizing:border-box}.ayni-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.ayni-title{font-size:clamp(22px,3vw,34px);margin:0;letter-spacing:-.03em}.ayni-sub,.ayni-muted{color:#c5bfd1}.ayni-tag{border:1px solid #ffffff2c;border-radius:999px;padding:7px 12px;color:#d8c9ee;font-size:12px;white-space:nowrap}
.ayni-stage{display:grid;grid-template-columns:minmax(220px,.82fr) minmax(300px,1.18fr);gap:24px;align-items:center;margin:18px 0 24px}.ayni-pot{position:relative;min-height:235px;display:grid;place-items:center}.ayni-orbit{position:absolute;width:215px;height:215px;border:1px solid #d3aaff30;border-radius:50%;box-shadow:0 0 45px #d459aa12;animation:ayni-orbit 18s linear infinite}.ayni-bowl{position:relative;width:min(220px,72vw);height:150px;clip-path:polygon(8% 8%,92% 8%,83% 73%,68% 98%,32% 98%,17% 73%);border:2px solid #ffc56f;background:linear-gradient(180deg,#f2a94c 0%,#d86b46 19%,#5d3671 20%,#31254d 100%);filter:drop-shadow(0 12px 20px #0008);animation:ayni-bob 3.8s ease-in-out infinite}.ayni-bowl:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 13px,#f1ca7955 14px 16px),repeating-linear-gradient(60deg,transparent 0 24px,#ed7f7350 25px 27px)}.ayni-water{position:absolute;top:calc(50% - 91px);width:184px;height:35px;border:2px solid #ffe2a4;border-radius:50%;background:#e9ac4d;box-shadow:0 0 26px #f4bc5999;animation:ayni-water 3.8s ease-in-out infinite}.ayni-total{position:absolute;z-index:1;text-align:center;top:48%;text-shadow:0 2px 12px #10071c}.ayni-total strong{display:block;font-size:28px}.ayni-total span{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#f6dbac}.ayni-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.ayni-btn{border:0;border-radius:12px;padding:11px 15px;background:#efb856;color:#23172e;font:700 13px system-ui;cursor:pointer;box-shadow:0 6px 15px #08051155}.ayni-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.ayni-btn.secondary{background:#ffffff12;color:#fff;border:1px solid #ffffff28}.ayni-btn:focus-visible,.ayni-root input:focus-visible,.ayni-root textarea:focus-visible{outline:3px solid #ffe08a;outline-offset:2px}
.ayni-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ayni-card{border:1px solid #ffffff20;border-radius:16px;background:#ffffff0b;padding:15px;box-shadow:0 12px 30px #08051133}.ayni-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ayni-card h3{margin:0;font-size:15px}.ayni-badge{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#ffe3a1}.ayni-desc{margin:10px 0;color:#e0dbea;min-height:36px}.ayni-meter{height:8px;background:#ffffff14;border-radius:99px;overflow:hidden;margin:10px 0 5px}.ayni-meter span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#d66e9e,#ffcb72);transition:width .45s ease}.ayni-votes{font-size:11px;color:#c5bfd1}.ayni-small{font-size:12px;color:#c5bfd1}.ayni-history{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.ayni-event{border-left:2px solid #d9a95d;padding:5px 9px;background:#ffffff08;border-radius:0 8px 8px 0;font-size:12px;color:#e0dbea}
.ayni-modal{position:absolute;inset:0;z-index:4;display:grid;place-items:center;padding:20px;background:#090813c9;backdrop-filter:blur(8px)}.ayni-form{width:min(440px,100%);background:#211a34;border:1px solid #ffffff26;border-radius:18px;padding:22px;box-shadow:0 22px 70px #0009}.ayni-form h2{margin:0 0 16px}.ayni-form label{display:block;margin:12px 0 5px;color:#eee4f4;font-size:12px}.ayni-form input,.ayni-form textarea{width:100%;border:1px solid #ffffff30;background:#120f20;color:#fff;border-radius:10px;padding:11px;font:14px system-ui}.ayni-form textarea{min-height:90px;resize:vertical}.ayni-error{color:#ffb0a5;min-height:20px;margin-top:8px;font-size:12px}.ayni-toast{position:absolute;z-index:5;bottom:18px;left:50%;transform:translateX(-50%);background:#e8be70;color:#241a2e;padding:10px 16px;border-radius:999px;box-shadow:0 8px 24px #0008;font-weight:650}.ayni-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@keyframes ayni-bob{50%{transform:translateY(-8px) rotate(-1deg)}}@keyframes ayni-water{50%{transform:translateY(-5px) scaleX(.97)}}@keyframes ayni-orbit{to{transform:rotate(360deg)}}@media(max-width:680px){.ayni-root{padding:18px;min-height:700px}.ayni-stage{grid-template-columns:1fr;gap:5px}.ayni-pot{min-height:205px}.ayni-grid{grid-template-columns:1fr}.ayni-head{align-items:center}}@media(prefers-reduced-motion:reduce){.ayni-root *, .ayni-root *:before{animation:none!important;transition:none!important}}
`;

function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }

export function mount(container, opts = {}) {
  let { lang = "es", mode = "demo", deployment = {}, address = "", sign } = opts;
  let copy = pickLang(COPY, lang);
  const localText = (es, en, pt) => pickLang({ es, en, pt: pt ?? es }, lang);
  const demo = mode === "demo" ? createAyniDemo() : null;
  let state = demo?.state || { fund: 0, members: (deployment.members || []).map((address, i) => ({ address, name: deployment.memberNames?.[address] || `${localText("Vecina/o", "Neighbor", "Pessoa vizinha")} ${i + 1}` })), requests: [], history: [], token: deployment.tokenSymbol || "XLM", monthly: Number(deployment.monthly || 0) / 1e7, quorumBps: Number(deployment.quorumBps || 5000), maxRequest: Number(deployment.maxRequest || 0) / 1e7 };
  const contractId = deployment.ayniContractId || deployment.contractId;
  const root = node("section", "ayni-root"); root.setAttribute("aria-label", copy.title);
  const style = node("style"); style.textContent = STYLES;
  const head = node("header", "ayni-head"); const titleWrap = document.createElement("div");
  const title = node("h1", "ayni-title", copy.title); const subtitle = node("p", "ayni-sub", copy.sub); titleWrap.append(title, subtitle);
  const tag = node("span", "ayni-tag", mode === "demo" ? copy.demo : "Stellar testnet"); head.append(titleWrap, tag);
  const stage = node("div", "ayni-stage"); const pot = node("div", "ayni-pot");
  const orbit = node("div", "ayni-orbit"); orbit.setAttribute("aria-hidden", "true");
  const bowl = node("div", "ayni-bowl"); bowl.setAttribute("aria-hidden", "true");
  const water = node("div", "ayni-water"); water.setAttribute("aria-hidden", "true");
  const total = node("div", "ayni-total"); const fundValue = node("strong"); const fundLabel = node("span", "", copy.pot); total.append(fundValue, fundLabel); pot.append(orbit, bowl, water, total);
  const control = node("div"); const membersLine = node("div", "ayni-muted");
  const actions = node("div", "ayni-actions"); const contributeBtn = node("button", "ayni-btn", copy.contribute); contributeBtn.type = "button";
  const askBtn = node("button", "ayni-btn secondary", copy.ask); askBtn.type = "button";
  const repayBtn = node("button", "ayni-btn secondary", copy.repay); repayBtn.type = "button";
  const joinBtn = node("button", "ayni-btn", ""); joinBtn.type = "button"; joinBtn.hidden = true;
  const joinHint = node("p", "ayni-small", ""); joinHint.hidden = true;
  let isMember = mode === "demo";
  actions.append(joinBtn, contributeBtn, askBtn, repayBtn); control.append(membersLine, joinHint, actions); stage.append(pot, control);
  const section = document.createElement("section"); const sectionTitle = node("h2", "", copy.ask); sectionTitle.style.cssText = "font-size:18px;margin:12px 0";
  const cards = node("div", "ayni-grid"); section.append(sectionTitle, cards);
  const historySection = document.createElement("section"); const historyTitle = node("h2", "", copy.history); historyTitle.style.cssText = "font-size:17px;margin:22px 0 0";
  const history = node("div", "ayni-history"); historySection.append(historyTitle, history);
  const live = node("div", "ayni-sr"); live.setAttribute("aria-live", "polite");
  const modalHost = node("div"); root.append(style, head, stage, section, historySection, live, modalHost); container.replaceChildren(root);
  let destroyed = false, loading = false;

  function memberName(indexOrAddress) {
    const m = typeof indexOrAddress === "number" ? state.members[indexOrAddress] : state.members.find((x) => x.address === indexOrAddress);
    return m?.name || (typeof indexOrAddress === "string" ? `${indexOrAddress.slice(0, 5)}…` : copy.neighbor);
  }
  function render() {
    if (destroyed) return;
    root.setAttribute("aria-label", copy.title);
    const numberLocale = ({ es: "es-BO", en: "en-US", pt: "pt-BR", qu: "es-BO", ay: "es-BO", gn: "es-BO" })[lang] || "es-BO";
    fundValue.textContent = `${Number(state.fund || 0).toLocaleString(numberLocale, { maximumFractionDigits: 2 })} ${state.token || "XLM"}`;
    const jt = pickLang(JOIN, lang);
    const canJoin = mode !== "demo" && Boolean(contractId);
    joinBtn.hidden = !canJoin || isMember || !address;
    joinBtn.textContent = `${jt.join} · ${state.monthly} ${state.token}`;
    joinHint.hidden = !canJoin || isMember;
    joinHint.textContent = address ? jt.hint : jt.connect;
    for (const b of [contributeBtn, askBtn, repayBtn]) b.hidden = canJoin && !isMember;
    membersLine.textContent = `${state.members.length} ${copy.people} · ${copy.monthly}: ${state.monthly} ${state.token}`;
    cards.replaceChildren();
    const sorted = [...state.requests].reverse();
    if (!sorted.length) cards.append(node("p", "ayni-muted", copy.empty));
    for (const request of sorted) {
      const card = node("article", "ayni-card"); const top = node("div", "ayni-card-top");
      const h = node("h3", "", `${memberName(request.member)} ${copy.by}`);
      const badge = node("span", "ayni-badge", request.resolved ? (request.approved ? copy.approved : copy.rejected) : copy.open); top.append(h, badge);
      const desc = node("p", "ayni-desc", t(request.reason)); const amountLine = node("div", "ayni-small", `${request.amount} ${state.token || "XLM"}`);
      const eligible = Math.max(1, state.members.length - 1); const needed = Math.ceil(eligible * Number(state.quorumBps || 5000) / 10_000);
      const meter = node("div", "ayni-meter"); meter.setAttribute("role", "progressbar"); meter.setAttribute("aria-label", `${request.yes} ${copy.votes}`); meter.setAttribute("aria-valuemin", "0"); meter.setAttribute("aria-valuemax", String(needed)); meter.setAttribute("aria-valuenow", String(request.yes));
      const fill = node("span"); fill.style.width = `${Math.min(100, request.yes / needed * 100)}%`; meter.append(fill);
      const votes = node("div", "ayni-votes", `${request.yes}/${needed} ${copy.votes}${request.no ? ` · ${request.no} ${copy.against}` : ""}`);
      card.append(top, desc, amountLine, meter, votes);
      if (!request.resolved && (mode === "demo" || isMember)) {
        const buttons = node("div", "ayni-actions");
        for (const [approve, label] of [[true, copy.yes], [false, copy.no]]) {
          const button = node("button", approve ? "ayni-btn" : "ayni-btn secondary", label); button.type = "button";
          button.addEventListener("click", () => act(async () => {
            const voter = currentMember(); if (mode === "demo") demo.vote(voter, request.id, approve);
            else await chainAction(buildVoteXdr, request.id, approve);
            refresh();
          })); buttons.append(button);
        }
        const close = node("button", "ayni-btn secondary", copy.close); close.type = "button";
        close.addEventListener("click", () => act(async () => { if (mode === "demo") demo.resolve(request.id); else await chainAction(buildResolveXdr, request.id); refresh(); })); buttons.append(close); card.append(buttons);
      }
      cards.append(card);
    }
    history.replaceChildren(); state.history.slice(0, 5).forEach((event) => {
      const label = event.kind === "approved" ? copy.historyApproved
        : event.kind === "rejected" ? copy.historyRejected
        : event.kind === "vote" ? `${memberName(event.member)} ${event.approve ? copy.historyVoteFor : copy.historyVoteAgainst}`
        : event.kind === "contribute" ? `${memberName(event.member)} ${copy.historyContribute}`
        : event.kind === "request" ? `${memberName(event.member)} ${copy.historyAsk}`
        : event.kind === "repay" ? `${memberName(event.member)} ${copy.historyRepay}`
        : event.label || `${memberName(event.member)} · ${event.amount || ""}`;
      history.append(node("div", "ayni-event", label));
    });
    if (!state.history.length) history.append(node("span", "ayni-muted", copy.empty));
  }
  function currentMember() {
    const found = state.members.findIndex((member) => member.address === address);
    return found >= 0 ? found : 0;
  }
  async function chainAction(builder, ...args) {
    if (!contractId) throw new Error(localText("Falta la dirección del contrato Ayni en la configuración.", "Ayni contract address is missing from deployment settings.", "Falta o endereço do contrato Ayni nas configurações."));
    if (!address || typeof sign !== "function") throw new Error(localText("Conecta una billetera para continuar.", "Connect a wallet to continue.", "Conecte uma carteira para continuar."));
    const xdr = await builder(deployment, contractId, address, ...args);
    await sign(xdr);
  }
  let liveKind = null;
  let toastKind = null;
  function localizeError(error) {
    const message = String(error?.message || error || "");
    return ACTION_ERRORS[message]?.[lang] || copy.error;
  }
  async function act(fn) {
    if (loading || destroyed) return; loading = true;
    try { await fn(); liveKind = "success"; live.textContent = copy.success; }
    catch (error) { liveKind = "error"; live.textContent = localizeError(error); showToast(live.textContent, "error"); }
    finally { loading = false; }
  }
  let toastTimer;
  function showToast(message, kind = "other") {
    root.querySelector(".ayni-toast")?.remove(); const toast = node("div", "ayni-toast", message); root.append(toast);
    toastKind = kind;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.remove(), 3200);
  }
  function openRequestForm(values = {}) {
    modalHost.replaceChildren(); const overlay = node("div", "ayni-modal"); const form = node("form", "ayni-form");
    const h = node("h2", "", copy.ask); const reasonLabel = node("label", "", copy.reason); const reason = document.createElement("textarea"); reason.required = true; reason.maxLength = 180; reason.placeholder = copy.askHint;
    const amountLabel = node("label", "", `${copy.amount} · ${state.token || "XLM"}`); const value = document.createElement("input"); value.required = true; value.type = "number"; value.min = "0.0000001"; value.step = "any"; value.max = String(state.maxRequest || 999999);
    const error = node("div", "ayni-error"); const row = node("div", "ayni-actions"); const submit = node("button", "ayni-btn", copy.send); submit.type = "submit";
    reason.value = values.reason || "";
    value.value = values.amount || "";
    const cancel = node("button", "ayni-btn secondary", copy.back); cancel.type = "button"; cancel.addEventListener("click", () => modalHost.replaceChildren());
    row.append(submit, cancel); form.append(h, reasonLabel, reason, amountLabel, value, error, row); overlay.append(form); modalHost.append(overlay); reason.focus();
    overlay.addEventListener("click", (event) => { if (event.target === overlay) modalHost.replaceChildren(); });
    form.addEventListener("submit", (event) => { event.preventDefault(); void act(async () => {
      if (mode === "demo") demo.request(currentMember(), value.value, reason.value);
      else await chainAction(buildRequestXdr, Number(value.value), reason.value);
      modalHost.replaceChildren(); await refresh();
    }); });
  }
  async function refresh() {
    if (mode === "demo") { state = demo.state; render(); return; }
    if (!contractId) { render(); return; }
    try {
      const [fund, requests, onChainMembers] = await Promise.all([readFund(deployment, contractId), readRequests(deployment, contractId, 0, 50), readMembers(deployment, contractId).catch(() => null)]);
      if (onChainMembers) {
        const known = new Map(state.members.map((m) => [m.address, m]));
        state = { ...state, members: onChainMembers.map((a, i) => known.get(a) || { address: a, name: a === address ? copy.you : `${a.slice(0, 4)}…${a.slice(-4)}` }) };
        isMember = Boolean(address) && onChainMembers.includes(address);
      }
      const parsed = requests.map((r) => ({ ...r, member: String(r.member), amount: Number(r.amount) / 1e7, yes: Number(r.yes), no: Number(r.no), resolved: Boolean(r.resolved), approved: Boolean(r.approved), id: Number(r.id), reason: String(r.reason) }));
      state = { ...state, fund, requests: parsed, history: parsed.slice().reverse().map((r) => ({ kind: r.resolved ? (r.approved ? "approved" : "rejected") : "request", member: r.member, amount: r.amount })) };
    } catch (error) { liveKind = "error"; live.textContent = localizeError(error); }
    render();
  }
  contributeBtn.addEventListener("click", () => act(async () => {
    if (mode === "demo") demo.contribute(currentMember()); else await chainAction(buildContributeXdr);
    await refresh();
  }));
  askBtn.addEventListener("click", openRequestForm);
  joinBtn.addEventListener("click", () => act(async () => {
    await chainAction(buildJoinXdr);
    showToast(pickLang(JOIN, lang).joined, "joined");
    await refresh();
  }));
  repayBtn.addEventListener("click", () => {
    if (mode === "demo") {
      const debt = demo.state.members[currentMember()]?.debt || 0;
      if (debt <= 0) { showToast(copy.noDebt, "noDebt"); return; }
      void act(() => demo.repay(currentMember(), debt)).then(refresh);
    } else {
      const raw = globalThis.prompt(copy.repayAmount); if (raw) void act(() => chainAction(buildRepayXdr, Number(raw))).then(refresh);
    }
  });
  render(); if (mode !== "demo") void refresh();
  function update(next = {}) {
    const openForm = modalHost.querySelector("form");
    const values = openForm ? { reason: openForm.querySelector("textarea")?.value || "", amount: openForm.querySelector('input[type="number"]')?.value || "" } : null;
    if (next.lang) { lang = next.lang; copy = pickLang(COPY, lang); }
    if ("address" in next) address = next.address; if ("deployment" in next) deployment = next.deployment; if ("sign" in next) sign = next.sign;
    render();
    if (liveKind === "success") live.textContent = copy.success;
    if (liveKind === "error") live.textContent = copy.error;
    if (values) { openRequestForm(values); if (values.reason) modalHost.querySelector("textarea").value = values.reason; }
    const toast = root.querySelector(".ayni-toast");
    if (toast) toast.textContent = toastKind === "joined" ? pickLang(JOIN, lang).joined : toastKind === "noDebt" ? copy.noDebt : toastKind === "error" ? copy.error : toast.textContent;
    if (mode !== "demo" && ("address" in next || "deployment" in next)) void refresh();
  }
  const onLanguage = (event) => update({ lang: event.detail?.lang || "es" });
  window.addEventListener("awayu:lang", onLanguage);
  return {
    update,
    destroy() { destroyed = true; window.removeEventListener("awayu:lang", onLanguage); clearTimeout(toastTimer); modalHost.replaceChildren(); root.remove(); },
  };
}
