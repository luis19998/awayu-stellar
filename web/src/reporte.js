// Reporte verificable del historial de pagos, leído en vivo de contratos Stellar.
import "./reporte.css";
import { loadDeployment, readCircle, readPassport, readRegistry, explorerUrl, short } from "./chain.js";
import { getLang, initLang, setLang } from "./i18n.js";

const COPY = {
  es: {
    title: "Reporte de historial de pagos", account: "Cuenta", load: "Ver reporte", print: "Imprimir o guardar PDF", language: "Idioma",
    loading: "Leyendo los contratos en Stellar…", configError: "No se pudo cargar la configuración de testnet.",
    invalid: "Escribe una cuenta de Stellar válida (empieza con G y tiene 56 caracteres).", readError: "No se pudo leer el reporte de Stellar.",
    mark1: "A tiempo", mark2: "Tarde", mark3: "Faltó", mark4: "Cubierto con su garantía",
    round: "Ronda", report: "Reporte de historial de pagos", network: "⚠ Red de prueba de Stellar (testnet): estos pagos usan dinero de prueba, sin valor real.",
    score: "Puntaje (0–100)", circles: "Círculos", markedRounds: "Rondas con marca", onTime: "A tiempo", late: "Tarde",
    covered: "Cubiertas con garantía", missed: "Faltó", scoreFormula: "Puntaje: a tiempo 100, tarde 50, cubierto con garantía 25, faltó 0, promediado por ronda. Es la misma fórmula del contrato",
    circlesTitle: "Círculos", none: "Esta cuenta todavía no figura en ningún círculo del registro.", contract: "Contrato", share: "Cuota",
    days: "días", testCircle: "círculo de prueba", every: "cada", members: "Miembros", rounds: "Rondas con marca", contractScore: "Puntaje del contrato",
    marksLabel: "Marcas por ronda", noRounds: "Todavía sin rondas cerradas", verifyTitle: "Cómo verificar este reporte sin confiar en Awayu",
    step1: "Abre el contrato de cada círculo en Stellar Lab (enlace de arriba), elige la función",
    step1b: "y pon la cuenta", step1c: ". La red devuelve las marcas: 1 a tiempo, 2 tarde, 3 faltó, 4 cubierto.",
    step2: "La lista de círculos sale del contrato de registro", step2b: ", función",
    step3: "El código de los contratos es público y su compilación es verificable (SEP-55):",
    step3b: "muestra el repositorio y el commit.",
    step4: "Para saber que la cuenta es de quien solicita el crédito, pídele que firme con su billetera un mensaje que ustedes elijan y verifiquen la firma con la clave pública. La identidad la confirma su propio KYC.",
    disclaimer: "Este reporte es evidencia de pagos en círculos de ahorro. No es una calificación ni una aprobación de crédito: la decisión es de la entidad, con su propio criterio. Awayu no presta dinero ni guarda fondos. No contiene datos personales: solo direcciones públicas y marcas de pago.",
    generated: "Generado el", from: "desde", liveData: "· datos leídos en vivo de Stellar testnet",
  },
  en: {
    title: "Payment history report", account: "Account", load: "View report", print: "Print or save as PDF", language: "Language",
    loading: "Reading contracts on Stellar…", configError: "Could not load the testnet configuration.",
    invalid: "Enter a valid Stellar account (starts with G and has 56 characters).", readError: "Could not read the report from Stellar.",
    mark1: "On time", mark2: "Late", mark3: "Missed", mark4: "Covered by guarantee",
    round: "Round", report: "Payment history report", network: "⚠ Stellar test network (testnet): these payments use test funds with no real value.",
    score: "Score (0–100)", circles: "Circles", markedRounds: "Marked rounds", onTime: "On time", late: "Late",
    covered: "Covered by guarantee", missed: "Missed", scoreFormula: "Score: on time 100, late 50, covered by guarantee 25, missed 0, averaged per round. This is the same formula used by the contract",
    circlesTitle: "Circles", none: "This account is not listed in any registered circle yet.", contract: "Contract", share: "Contribution",
    days: "days", testCircle: "test circle", every: "every", members: "Members", rounds: "Marked rounds", contractScore: "Contract score",
    marksLabel: "Marks by round", noRounds: "No rounds have closed yet", verifyTitle: "How to verify this report without relying on Awayu",
    step1: "Open each circle contract in Stellar Lab (link above), select the",
    step1b: "function and enter the account", step1c: ". The network returns the marks: 1 on time, 2 late, 3 missed, 4 covered.",
    step2: "The circle list comes from the registry contract", step2b: ", function",
    step3: "Contract source code is public and its build is verifiable (SEP-55):",
    step3b: "shows the repository and commit.",
    step4: "To confirm that the account belongs to the credit applicant, ask them to sign a message of your choice with their wallet, then verify the signature with their public key. Their identity is confirmed through your own KYC process.",
    disclaimer: "This report is evidence of payments in savings circles. It is not a credit score or approval: the institution makes that decision using its own criteria. Awayu does not lend money or hold funds. It contains no personal data, only public addresses and payment marks.",
    generated: "Generated", from: "from", liveData: "· data read live from Stellar testnet",
  },
  pt: {
    title: "Relatório do histórico de pagamentos", account: "Conta", load: "Ver relatório", print: "Imprimir ou salvar como PDF", language: "Idioma",
    loading: "Lendo os contratos na Stellar…", configError: "Não foi possível carregar a configuração da testnet.",
    invalid: "Informe uma conta Stellar válida (começa com G e tem 56 caracteres).", readError: "Não foi possível ler o relatório da Stellar.",
    mark1: "Em dia", mark2: "Atrasado", mark3: "Não pagou", mark4: "Coberto pela garantia",
    round: "Rodada", report: "Relatório do histórico de pagamentos", network: "⚠ Rede de testes da Stellar (testnet): estes pagamentos usam fundos de teste, sem valor real.",
    score: "Pontuação (0–100)", circles: "Círculos", markedRounds: "Rodadas registradas", onTime: "Em dia", late: "Atrasado",
    covered: "Cobertas pela garantia", missed: "Não pagou", scoreFormula: "Pontuação: em dia 100, atrasado 50, coberto pela garantia 25, não pagou 0, calculada pela média por rodada. É a mesma fórmula do contrato",
    circlesTitle: "Círculos", none: "Esta conta ainda não aparece em nenhum círculo do registro.", contract: "Contrato", share: "Contribuição",
    days: "dias", testCircle: "círculo de teste", every: "a cada", members: "Participantes", rounds: "Rodadas registradas", contractScore: "Pontuação do contrato",
    marksLabel: "Registros por rodada", noRounds: "Ainda não há rodadas encerradas", verifyTitle: "Como verificar este relatório sem confiar na Awayu",
    step1: "Abra o contrato de cada círculo na Stellar Lab (link acima), escolha a função",
    step1b: "e informe a conta", step1c: ". A rede retorna os registros: 1 em dia, 2 atrasado, 3 não pagou, 4 coberto.",
    step2: "A lista de círculos vem do contrato de registro", step2b: ", função",
    step3: "O código dos contratos é público e sua compilação pode ser verificada (SEP-55):",
    step3b: "mostra o repositório e o commit.",
    step4: "Para confirmar que a conta pertence a quem solicita o crédito, peça que a pessoa assine uma mensagem escolhida por vocês com a carteira e verifiquem a assinatura com a chave pública. A identidade é confirmada pelo próprio processo de KYC.",
    disclaimer: "Este relatório comprova pagamentos em círculos de poupança. Não é uma classificação nem uma aprovação de crédito: a decisão cabe à instituição, segundo seus próprios critérios. A Awayu não empresta dinheiro nem guarda fundos. Não contém dados pessoais, apenas endereços públicos e registros de pagamento.",
    generated: "Gerado em", from: "de", liveData: "· dados lidos ao vivo da Stellar testnet",
  },
};

const LOCALE = { es: "es-BO", en: "en-US", pt: "pt-BR", qu: "es-BO", ay: "es-BO", gn: "es-BO" };
let lang = initLang();
let reportData = null;
let activeAddress = "";
let requestId = 0;
let errorKey = null;
const $ = (selector) => document.querySelector(selector);
const tr = (key) => COPY[lang]?.[key] ?? COPY.es[key];
const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const labUrl = (id) => "https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=" + id + ";;";

export function summarize(history) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const mark of history) if (counts[mark] !== undefined) counts[mark] += 1;
  const points = { 1: 100, 2: 50, 4: 25 };
  const score = history.length ? Math.round(history.reduce((sum, mark) => sum + (points[mark] || 0), 0) / history.length) : 0;
  return { counts, total: history.length, score };
}

function refreshHeader() {
  $("#r-account-label").textContent = tr("account");
  $("#r-load").textContent = tr("load");
  $("#r-print").textContent = tr("print");
  $("#r-lang-label").textContent = tr("language");
  $("#r-lang").setAttribute("aria-label", tr("language"));
  document.title = tr("title") + " · Awayu";
  document.querySelector('meta[name="description"]').content = tr("title");
  $("#r-addr").setAttribute("aria-label", tr("account"));
  $("#r-addr").placeholder = "G…";
}

function showMessage(key, error = false) {
  $("#r-body").innerHTML = '<p class="' + (error ? "r-err" : "r-muted") + '">' + esc(tr(key)) + "</p>";
}

function paintReport(data) {
  if (!data) return;
  const { address, dep, details, names } = data;
  const all = summarize(details.flatMap((circle) => circle.history));
  const now = new Date();
  const marksFor = (history) => history.map((mark, index) => {
    const text = tr("mark" + mark) || "?";
    return '<span class="r-mark ' + (["", "ok", "late", "miss", "cover"][mark] || "") + '" title="' +
      esc(tr("round") + " " + (index + 1) + ": " + text) + '">' + (index + 1) + "</span>";
  }).join("");
  const rows = details.map((circle) => {
    const score = summarize(circle.history);
    const registration = names.get(circle.contractId);
    const token = circle.info?.token || "token";
    const period = circle.info
      ? (circle.info.periodSeconds >= 86400 ? Math.round(circle.info.periodDays) + " " + tr("days") : circle.info.periodSeconds + " s (" + tr("testCircle") + ")")
      : "—";
    return '<article class="r-circle">' +
      '<header><h3>' + esc(registration?.name || "Pasanaku") + '</h3><span class="r-pill">' + esc(registration?.region || "") + "</span></header>" +
      "<dl>" +
      "<dt>" + tr("contract") + '</dt><dd><a href="' + explorerUrl(circle.contractId) + '" target="_blank" rel="noopener">' + esc(short(circle.contractId)) + '</a> · <a href="' + labUrl(circle.contractId) + '" target="_blank" rel="noopener">Stellar Lab</a></dd>' +
      "<dt>" + tr("share") + "</dt><dd>" + (circle.info ? circle.info.amount + " " + esc(token) + " " + tr("every") + " " + period : "—") + "</dd>" +
      "<dt>" + tr("members") + "</dt><dd>" + (circle.info ? circle.info.members.length : "—") + "</dd>" +
      "<dt>" + tr("rounds") + "</dt><dd>" + score.total + "</dd>" +
      "<dt>" + tr("contractScore") + "</dt><dd><b>" + score.score + "</b> / 100</dd>" +
      "</dl><div class=\"r-marks\" aria-label=\"" + esc(tr("marksLabel")) + "\">" +
      (marksFor(circle.history) || '<span class="r-muted">' + esc(tr("noRounds")) + "</span>") + "</div></article>";
  });
  const body = $("#r-body");
  body.innerHTML =
    '<section class="r-title"><p class="r-eyebrow">' + esc(tr("report")) + "</p><h1>" + esc(short(address)) + "</h1>" +
    '<p class="r-addr">' + esc(address) + '</p><p class="r-net">' + esc(tr("network")) + "</p></section>" +
    '<section class="r-summary">' +
      "<div><b>" + all.score + "</b><span>" + esc(tr("score")) + "</span></div>" +
      "<div><b>" + details.length + "</b><span>" + esc(tr("circles")) + "</span></div>" +
      "<div><b>" + all.total + "</b><span>" + esc(tr("markedRounds")) + "</span></div>" +
      "<div><b>" + all.counts[1] + "</b><span>" + esc(tr("onTime")) + "</span></div>" +
      "<div><b>" + all.counts[2] + "</b><span>" + esc(tr("late")) + "</span></div>" +
      "<div><b>" + all.counts[4] + "</b><span>" + esc(tr("covered")) + "</span></div>" +
      "<div><b>" + all.counts[3] + "</b><span>" + esc(tr("missed")) + "</span></div></section>" +
    '<p class="r-muted">' + esc(tr("scoreFormula")) + " (<code>score</code>).</p>" +
    "<h2>" + esc(tr("circlesTitle")) + "</h2>" + (rows.join("") || '<p class="r-muted">' + esc(tr("none")) + "</p>") +
    "<h2>" + esc(tr("verifyTitle")) + "</h2><ol class=\"r-steps\">" +
      "<li>" + esc(tr("step1")) + " <code>history</code> " + esc(tr("step1b")) + " <code>" + esc(short(address)) + "</code>" + esc(tr("step1c")) + "</li>" +
      "<li>" + esc(tr("step2")) + ' <a href="' + explorerUrl(dep.registro) + '" target="_blank" rel="noopener">' + esc(short(dep.registro || "")) + "</a>" + esc(tr("step2b")) + " <code>by_member</code>.</li>" +
      "<li>" + esc(tr("step3")) + " <code>stellar contract info build --id &lt;contrato&gt; --network testnet</code> " + esc(tr("step3b")) + "</li>" +
      "<li>" + esc(tr("step4")) + "</li></ol>" +
    '<p class="r-disclaimer">' + esc(tr("disclaimer")) + "</p>" +
    '<footer class="r-foot">' + esc(tr("generated")) + " " + now.toLocaleString(LOCALE[lang] || LOCALE.es) + " " + esc(tr("from")) + " " +
      esc(location.host) + " " + esc(tr("liveData")) + " (" + esc(dep.rpc) + ")</footer>";
}

async function defaultAccount(dep) {
  try {
    const evidence = await (await fetch("/evidencia.json", { cache: "no-store" })).json();
    if (evidence?.accounts?.Bruno) return evidence.accounts.Bruno;
  } catch { /* El reporte puede abrirse sin datos de evidencia. */ }
  return Object.values(dep.members || {})[0] || "";
}

async function loadReport(address, onlyCircle) {
  const currentRequest = ++requestId;
  activeAddress = address;
  errorKey = null;
  showMessage("loading");
  const dep = await loadDeployment();
  if (!dep) { errorKey = "configError"; return showMessage(errorKey, true); }
  const [passport, registry] = await Promise.all([readPassport(dep, address), readRegistry(dep).catch(() => [])]);
  const names = new Map(registry.map((record) => [record.contractId, record]));
  let circles = passport.circles;
  if (onlyCircle) circles = circles.filter((circle) => circle.contractId === onlyCircle);
  const details = await Promise.all(circles.map(async (circle) => ({ ...circle, info: await readCircle(dep, circle.contractId).catch(() => null) })));
  if (currentRequest !== requestId) return;
  reportData = { address, dep, details, names };
  paintReport(reportData);
}

function go(address) {
  const value = String(address || "").trim();
  if (!/^G[A-Z2-7]{55}$/.test(value)) {
    reportData = null; errorKey = "invalid"; activeAddress = "";
    return showMessage(errorKey, true);
  }
  $("#r-addr").value = value;
  const url = new URL(location.href);
  url.searchParams.set("m", value);
  history.replaceState(null, "", url);
  loadReport(value, new URLSearchParams(location.search).get("c")).catch(() => {
    if (activeAddress !== value) return;
    reportData = null; errorKey = "readError"; showMessage(errorKey, true);
  });
}

refreshHeader();
$("#r-lang").value = lang;
$("#r-lang").addEventListener("change", (event) => setLang(event.target.value));
$("#r-load").addEventListener("click", () => go($("#r-addr").value));
$("#r-addr").addEventListener("keydown", (event) => { if (event.key === "Enter") go($("#r-addr").value); });
$("#r-print").addEventListener("click", () => window.print());
window.addEventListener("awayu:lang", (event) => {
  lang = event.detail?.lang || getLang();
  $("#r-lang").value = lang;
  refreshHeader();
  if (reportData) paintReport(reportData);
  else if (errorKey) showMessage(errorKey, true);
  else showMessage("loading");
});

const params = new URLSearchParams(location.search);
(async () => {
  let address = params.get("m");
  if (!address) {
    const deployment = await loadDeployment();
    address = await defaultAccount(deployment || {});
  }
  go(address);
})();
