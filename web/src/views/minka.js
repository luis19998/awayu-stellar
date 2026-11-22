import {
  approveMinkaMilestone, cancelMinkaDemo, createMinkaDemo, fundMinkaDemo,
  refundMinkaDemo, submitMinkaEvidence,
} from "../modes/minka.js";
import { pickLang } from "../i18n.js";
import {
  buildMinkaApproveXdr, buildMinkaCancelXdr, buildMinkaEvidenceXdr,
  buildMinkaFundXdr, buildMinkaRefundXdr, readMinka, submitMinkaTransaction,
} from "../modes/minka.js";

const STYLE = `
.awayu-minka{--mk-ink:#172a3b;--mk-paper:#f4f1e7;--mk-blue:#235e69;--mk-gold:#e5ac40;--mk-red:#9e483f;position:relative;box-sizing:border-box;width:100%;min-height:600px;padding:clamp(18px,4vw,42px);overflow:hidden;border-radius:24px;background:radial-gradient(ellipse at 82% 0%,#d9e9dd 0,transparent 36%),var(--mk-paper);color:var(--mk-ink);font:15px/1.5 system-ui,sans-serif}
.awayu-minka *{box-sizing:border-box}.awayu-minka__head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;max-width:1050px;margin:0 auto 25px}.awayu-minka__title{margin:0;font-size:clamp(28px,4vw,44px);line-height:1.04;letter-spacing:-.04em}.awayu-minka__desc{max-width:650px;margin:10px 0 0;color:#4a5b60}.awayu-minka__status{align-self:start;padding:7px 11px;border:1px solid #235e6938;border-radius:999px;color:#235e69;font-size:12px;font-weight:700}
.awayu-minka__funding{max-width:1050px;margin:0 auto 35px;padding:20px 22px;border:1px solid #253f471c;border-radius:17px;background:#fff9e9b8}.awayu-minka__funding-row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.awayu-minka__funding strong{font-size:clamp(21px,3vw,30px);font-variant-numeric:tabular-nums}.awayu-minka__track{height:15px;margin-top:13px;overflow:hidden;border-radius:10px;background:#d7d9cf}.awayu-minka__fill{height:100%;width:0;border-radius:inherit;background:repeating-linear-gradient(135deg,#237c7b 0 11px,#2b8e82 11px 22px);transition:width .8s cubic-bezier(.2,.7,.2,1)}.awayu-minka__fill.is-ready{background:repeating-linear-gradient(135deg,#cf8d2b 0 11px,#edb942 11px 22px)}
.awayu-minka__timeline{max-width:1050px;margin:0 auto;position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:start}.awayu-minka__timeline:before{content:"";position:absolute;z-index:0;top:48px;left:8%;right:8%;height:3px;background:repeating-linear-gradient(90deg,#9c9889 0 7px,transparent 7px 13px)}.awayu-minka__step{position:relative;z-index:1;min-width:0;padding-top:40px}.awayu-minka__step:nth-child(even){padding-top:74px}.awayu-minka__mark{position:absolute;top:0;left:18px;display:grid;width:52px;height:52px;place-items:center;border:4px solid var(--mk-paper);border-radius:50%;background:#455c5c;color:#fff;font-size:17px;font-weight:800;box-shadow:0 0 0 1px #334a4a55}.awayu-minka__step:nth-child(even) .awayu-minka__mark{top:34px}.awayu-minka__mark:after{content:"";position:absolute;inset:8px;border:1px solid #ffffff77;transform:rotate(45deg)}.awayu-minka__step.is-released .awayu-minka__mark{background:var(--mk-gold);color:#352c19;box-shadow:0 0 0 3px #e5ac4080,0 0 25px #e5ac4088}.awayu-minka__card{min-height:210px;padding:25px 15px 16px;border:1px solid #233f3d25;border-radius:14px 14px 14px 4px;background:#fffdf5;box-shadow:0 8px 19px #253c3910}.awayu-minka__step.is-released .awayu-minka__card{border-color:#ce9e41;background:#fff9e6}.awayu-minka__card h3{margin:0 0 7px;font-size:17px;line-height:1.2}.awayu-minka__amount{color:#296772;font-weight:750;font-variant-numeric:tabular-nums}.awayu-minka__meta{margin:7px 0 0;color:#5d6968;font-size:12px}.awayu-minka__evidence{display:block;width:100%;height:74px;margin-top:13px;object-fit:cover;border-radius:8px;background:linear-gradient(145deg,#6f9e91,#d8be78 53%,#597b79);color:#fff}.awayu-minka__evidence-fallback{display:grid;place-items:center;height:74px;margin-top:13px;border-radius:8px;background:linear-gradient(145deg,#6f9e91,#d8be78 53%,#597b79);color:white;font-size:12px;text-align:center}.awayu-minka__actions{max-width:1050px;margin:28px auto 0;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.awayu-minka__actions form{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.awayu-minka button,.awayu-minka input{min-height:42px;border:1px solid #235e6950;border-radius:8px;font:inherit}.awayu-minka button{padding:8px 14px;background:#235e69;color:white;font-weight:700;cursor:pointer}.awayu-minka button:hover{background:#174b55}.awayu-minka button:disabled{opacity:.45;cursor:not-allowed}.awayu-minka input{max-width:230px;padding:8px 10px;background:#fffdf7;color:var(--mk-ink)}.awayu-minka :focus-visible{outline:3px solid #ca7b24;outline-offset:3px}.awayu-minka__note{max-width:1050px;margin:25px auto 0;padding:14px 16px;border-left:4px solid var(--mk-blue);background:#dce9e4;color:#334d4e;font-size:13px}.awayu-minka__notice{min-height:24px;margin:9px auto 0;max-width:1050px;color:#783d2a;font-size:13px}.awayu-minka__state{max-width:1050px;margin:14px auto 0;color:#526265;font-size:13px}.awayu-minka__state summary{cursor:pointer}.awayu-minka__state ul{display:flex;flex-wrap:wrap;gap:7px;padding:0;list-style:none}.awayu-minka__state li{padding:4px 9px;border-radius:99px;background:#fffdf5}
@media(max-width:720px){.awayu-minka__timeline{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.awayu-minka__timeline:before{display:none}.awayu-minka__step,.awayu-minka__step:nth-child(even){padding-top:34px}.awayu-minka__mark,.awayu-minka__step:nth-child(even) .awayu-minka__mark{top:0;left:12px}.awayu-minka__head{grid-template-columns:1fr}.awayu-minka__status{justify-self:start}.awayu-minka__card{min-height:195px}}
@media(max-width:430px){.awayu-minka__timeline{grid-template-columns:1fr}.awayu-minka__card{min-height:0}.awayu-minka__funding-row{align-items:start;flex-direction:column;gap:0}}
@media(prefers-reduced-motion:reduce){.awayu-minka__fill{transition:none}}
`;

const text = {
  es: {
    amount: "aportado de", target: "meta", ready: "Meta completa", raising: "Juntando aportes",
    released: "Liberado", pending: "Pendiente de avance", evidence: "Ver evidencia",
    approvals: "votos de aprobación", contribute: "Aportar", amountLabel: "Monto",
    evidenceLabel: "Enlace a foto o documento", submitEvidence: "Subir avance",
    approve: "Aprobar hito", refund: "Reclamar devolución", organizer: "Organización",
    backers: "Aportantes", emptyEvidence: "Todavía no hay evidencia", busy: "Procesando…",
    success: "Listo. El estado del proyecto se actualizó.", escrow: "En producción, el resguardo de fondos puede hacerse con Trustless Work. Esta vista muestra la versión nativa del escrow, programada directamente en Soroban.",
    error: "No se pudo completar la acción.", connect: "Conecta tu billetera para participar en testnet.",
    demo: "Proyecto de ejemplo", testnet: "Proyecto en Stellar testnet",
  },
  en: {
    amount: "raised of", target: "goal", ready: "Goal reached", raising: "Community funding",
    released: "Released", pending: "Waiting for progress update", evidence: "View evidence",
    approvals: "approval votes", contribute: "Contribute", amountLabel: "Amount",
    evidenceLabel: "Photo or document link", submitEvidence: "Share progress",
    approve: "Approve milestone", refund: "Claim refund", organizer: "Organizer",
    backers: "Backers", emptyEvidence: "No evidence yet", busy: "Working…",
    success: "Done. Project status updated.", escrow: "In production, funds can be held with Trustless Work. This view shows the native escrow version, written directly on Soroban.",
    error: "That action could not be completed.", connect: "Connect your wallet to participate on testnet.",
    demo: "Sample project", testnet: "Project on Stellar testnet",
  },
  pt: {
    amount: "arrecadado de", target: "meta", ready: "Meta alcançada", raising: "Arrecadando contribuições",
    released: "Liberado", pending: "Aguardando atualização do progresso", evidence: "Ver evidência",
    approvals: "votos de aprovação", contribute: "Contribuir", amountLabel: "Valor",
    evidenceLabel: "Link para foto ou documento", submitEvidence: "Enviar progresso",
    approve: "Aprovar etapa", refund: "Solicitar reembolso", organizer: "Organização",
    backers: "Contribuintes", emptyEvidence: "Ainda não há evidências", busy: "Processando…",
    success: "Pronto. O status do projeto foi atualizado.", escrow: "Em produção, os fundos podem ser protegidos com a Trustless Work. Esta tela mostra a versão nativa do escrow, programada diretamente na Soroban.",
    error: "Não foi possível concluir a ação.", connect: "Conecte sua carteira para participar na testnet.",
    demo: "Projeto de demonstração", testnet: "Projeto na testnet da Stellar",
  },
};
for (const code of ["qu", "ay", "gn"]) text[code] = { ...text.es };
const DEMO_EN = {
  title: "Irrigation for Tiraque",
  description: "A canal and reservoir to bring water to the community's fields.",
  milestones: ["Map the canal", "Dig the irrigation channel", "Build the reservoir", "Test the irrigation system"],
};
const DEMO_PT = {
  title: "Irrigação em Tiraque",
  description: "Um canal e um reservatório para levar água às plantações da comunidade.",
  milestones: ["Mapear o canal", "Escavar o canal de irrigação", "Construir o reservatório", "Testar o sistema de irrigação"],
};

const el = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = content;
  return node;
};

function safeImageUrl(uri) {
  try {
    const url = new URL(uri);
    // Solo se muestra como imagen si parece una; si no, queda el enlace
    return ["http:", "https:"].includes(url.protocol) && /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

export function mount(container, { lang = "es", mode = "demo", deployment = null, address = null, sign = null } = {}) {
  if (!container) throw new TypeError("minka.mount necesita un contenedor");
  let currentLang = lang || "es";
  let locale = pickLang(text, currentLang);
  const localText = (es, en, pt) => pickLang({ es, en, pt: pt ?? es }, currentLang);
  let english = pickLang({ es: false, en: true }, currentLang);
  const contractId = deployment?.minkaContractId || deployment?.minka?.contractId || null;
  let state = createMinkaDemo();
  let busy = false;
  let destroyed = false;
  let statusKind = null;
  const root = el("section", "awayu-minka");
  root.setAttribute("aria-label", localText("Línea de tiempo del proyecto comunitario", "Community project timeline", "Cronograma do projeto comunitário"));
  const style = el("style"); style.textContent = STYLE;
  const status = el("div", "awayu-minka__notice"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
  root.append(style);
  container.replaceChildren(root);

  const isChain = mode === "testnet" && Boolean(contractId);
  const decimals = isChain ? 1e7 : 1;
  const showAmount = (value) => (Number(value) / decimals).toLocaleString(({ es: "es-BO", en: "en-US", pt: "pt-BR", qu: "es-BO", ay: "es-BO", gn: "es-BO" })[currentLang] || "es-BO", { maximumFractionDigits: 2 });
  const token = () => isChain ? (deployment?.tokenSymbol || "XLM") : (state.token || "XLM");
  async function reload() {
    if (!isChain) return;
    state = await readMinka(deployment, contractId, address);
    draw();
  }
  function draw() {
    if (destroyed) return;
    const progress = state.goal > 0 ? Math.max(0, Math.min(100, (state.raised / state.goal) * 100)) : 0;
    root.replaceChildren(style);
    const head = el("header", "awayu-minka__head");
    const intro = document.createElement("div");
    intro.append(
      el("h2", "awayu-minka__title", !isChain && currentLang === "en" ? DEMO_EN.title : !isChain && currentLang === "pt" ? DEMO_PT.title : state.title),
      el("p", "awayu-minka__desc", !isChain && currentLang === "en" ? DEMO_EN.description : !isChain && currentLang === "pt" ? DEMO_PT.description : state.description || ""),
    );
    head.append(intro, el("span", "awayu-minka__status", isChain ? locale.testnet : locale.demo));
    root.append(head);

    const funding = el("section", "awayu-minka__funding");
    const row = el("div", "awayu-minka__funding-row");
    const tally = el("strong", "", `${showAmount(state.raised)} ${token()}`);
    const goal = el("span", "", `${locale.amount} ${showAmount(state.goal)} ${locale.target} ${token()}`);
    row.append(tally, goal);
    const track = el("div", "awayu-minka__track"); track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", localText("Avance de la meta", "Funding progress", "Progresso da meta"));
    track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", String(state.goal)); track.setAttribute("aria-valuenow", String(state.raised));
    const fill = el("div", "awayu-minka__fill" + (progress >= 100 ? " is-ready" : ""));
    requestAnimationFrame(() => { if (!destroyed) fill.style.width = `${progress}%`; });
    track.append(fill); funding.append(row, track); root.append(funding);

    const timeline = el("div", "awayu-minka__timeline");
    state.milestones.forEach((milestone, index) => {
      const step = el("article", `awayu-minka__step${milestone.released ? " is-released" : ""}`);
      step.append(el("span", "awayu-minka__mark", milestone.released ? "✓" : String(index + 1)));
      const card = el("div", "awayu-minka__card");
      const milestoneTitle = !isChain && currentLang === "en" ? DEMO_EN.milestones[index] : !isChain && currentLang === "pt" ? DEMO_PT.milestones[index] : milestone.title;
      card.append(el("h3", "", milestoneTitle), el("div", "awayu-minka__amount", `${showAmount(milestone.amount)} ${token()}`));
      card.append(el("p", "awayu-minka__meta", milestone.released ? locale.released : `${Number(milestone.approvals || 0)} ${locale.approvals}`));
      if (milestone.evidence) {
        const imageUrl = safeImageUrl(String(milestone.evidence));
        if (imageUrl) {
          const image = el("img", "awayu-minka__evidence"); image.src = imageUrl; image.alt = localText(`Evidencia para ${milestone.title}`, `Evidence for ${milestone.title}`, `Evidência de ${milestone.title}`);
          image.loading = "lazy"; image.referrerPolicy = "no-referrer"; card.append(image);
        }
        const link = el("a", "awayu-minka__meta", locale.evidence); link.href = String(milestone.evidence); link.target = "_blank"; link.rel = "noopener noreferrer";
        card.append(link);
      } else card.append(el("div", "awayu-minka__evidence-fallback", locale.emptyEvidence));
      step.append(card); timeline.append(step);
    });
    root.append(timeline);

    const actions = el("div", "awayu-minka__actions");
    const fundForm = document.createElement("form"); fundForm.dataset.action = "fund";
    const amountInput = document.createElement("input"); amountInput.name = "amount"; amountInput.type = "number"; amountInput.min = "1"; amountInput.step = "any";
    amountInput.value = isChain ? "1" : "25"; amountInput.setAttribute("aria-label", locale.amountLabel);
    const fundButton = el("button", "", locale.contribute); fundButton.type = "submit";
    fundButton.disabled = busy || state.canceled || state.raised >= state.goal;
    fundForm.append(amountInput, fundButton); actions.append(fundForm);

    const currentMilestone = state.milestones[state.nextMilestone];
    if (isChain && address && state.organizer === address && currentMilestone && state.raised >= state.goal) {
      const evidenceForm = document.createElement("form"); evidenceForm.dataset.action = "evidence";
      const evidenceInput = document.createElement("input"); evidenceInput.name = "uri"; evidenceInput.type = "url"; evidenceInput.required = true; evidenceInput.placeholder = "https://…"; evidenceInput.setAttribute("aria-label", locale.evidenceLabel);
      const evidenceButton = el("button", "", locale.submitEvidence); evidenceButton.type = "submit";
      evidenceForm.append(evidenceInput, evidenceButton); actions.append(evidenceForm);
    } else if (!isChain && currentMilestone && state.raised >= state.goal) {
      const evidenceForm = document.createElement("form"); evidenceForm.dataset.action = "evidence";
      const evidenceInput = document.createElement("input"); evidenceInput.name = "uri"; evidenceInput.type = "url"; evidenceInput.required = true; evidenceInput.placeholder = "https://…"; evidenceInput.setAttribute("aria-label", locale.evidenceLabel);
      const evidenceButton = el("button", "", locale.submitEvidence); evidenceButton.type = "submit";
      evidenceForm.append(evidenceInput, evidenceButton); actions.append(evidenceForm);
    }
    if (currentMilestone && currentMilestone.evidence && state.raised >= state.goal && !state.canceled) {
      const approve = el("button", "", locale.approve); approve.type = "button"; approve.dataset.action = "approve"; actions.append(approve);
    }
    const canRefund = state.canceled || (Date.now() / 1000 > state.deadline && state.raised < state.goal);
    if (canRefund) {
      const refund = el("button", "", locale.refund); refund.type = "button"; refund.dataset.action = "refund"; actions.append(refund);
    }
    if (mode === "testnet" && !address) actions.append(el("span", "awayu-minka__meta", locale.connect));
    root.append(actions);
    root.append(status);
    const note = el("aside", "awayu-minka__note", locale.escrow); root.append(note);
    if (!isChain || state.myContribution != null) {
      const backers = el("details", "awayu-minka__state");
      const summary = document.createElement("summary");
      summary.textContent = isChain
        ? localText("Tu aporte", "Your contribution", "Sua contribuição")
        : `${locale.backers} (${state.backers?.length || 0})`;
      backers.append(summary);
      const list = document.createElement("ul");
      if (isChain) list.append(el("li", "", `${showAmount(state.myContribution)} ${token()}`));
      else (state.backers || []).slice(0, 12).forEach((backer) => {
        list.append(el("li", "", `${backer.name || `${String(backer.address).slice(0, 5)}…`}: ${showAmount(backer.amount)} ${token()}`));
      });
      backers.append(list); root.append(backers);
    }
    root.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
  }

  async function action(name, form) {
    if (busy) return;
    busy = true; statusKind = "busy"; status.textContent = locale.busy; draw();
    try {
      if (isChain) {
        if (!address || !sign) throw new Error(localText("Conecta una billetera para firmar esta acción", "Connect a wallet to sign this action", "Conecte uma carteira para assinar esta ação"));
        let xdr;
        if (name === "fund") xdr = await buildMinkaFundXdr(deployment, contractId, address, Math.round(Number(new FormData(form).get("amount")) * decimals));
        if (name === "evidence") xdr = await buildMinkaEvidenceXdr(deployment, contractId, address, state.nextMilestone, new FormData(form).get("uri"));
        if (name === "approve") xdr = await buildMinkaApproveXdr(deployment, contractId, address, state.nextMilestone);
        if (name === "refund") xdr = await buildMinkaRefundXdr(deployment, contractId, address);
        const signed = await sign(xdr);
        await submitMinkaTransaction(deployment, signed);
        state = await readMinka(deployment, contractId, address);
      } else if (name === "fund") state = fundMinkaDemo(state, "demo-visitante", Number(new FormData(form).get("amount")));
      else if (name === "evidence") state = submitMinkaEvidence(state, state.organizer, state.nextMilestone, new FormData(form).get("uri"));
      else if (name === "approve") state = approveMinkaMilestone(state, state.validators.find((v) => !state.milestones[state.nextMilestone].approvals.includes(v)), state.nextMilestone);
      else if (name === "refund") {
        const result = refundMinkaDemo(state, state.backers[0]?.address);
        state = result.state;
      }
      statusKind = "success"; status.textContent = locale.success;
    } catch (error) {
      statusKind = "error"; status.textContent = locale.error;
    } finally { busy = false; draw(); }
  }

  root.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-action]");
    if (!form) return;
    event.preventDefault(); void action(form.dataset.action, form);
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) void action(button.dataset.action, null);
  });
  draw();
  if (isChain) reload().catch(() => { statusKind = "error"; status.textContent = locale.error; });

  function update(next = {}) {
    const values = Object.fromEntries([...root.querySelectorAll("input")].map((input) => [input.name, input.value]));
    if (next.lang) { currentLang = next.lang; locale = pickLang(text, currentLang); english = currentLang === "en"; }
    if (next && Array.isArray(next.milestones)) state = next;
    else if (next.state) state = next.state;
    root.setAttribute("aria-label", localText("Línea de tiempo del proyecto comunitario", "Community project timeline", "Cronograma do projeto comunitário"));
    draw();
    for (const input of root.querySelectorAll("input")) if (input.name in values) input.value = values[input.name];
    if (statusKind) status.textContent = locale[statusKind] || locale.error;
  }
  const onLanguage = (event) => update({ lang: event.detail?.lang || "es" });
  window.addEventListener("awayu:lang", onLanguage);
  return {
    update,
    destroy() { destroyed = true; window.removeEventListener("awayu:lang", onLanguage); root.remove(); },
  };
}
