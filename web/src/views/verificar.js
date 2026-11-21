import { pickLang } from "../i18n.js";
import { Account, Asset, BASE_FEE, Memo, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { decodeCode, drawResult, encodeCode, listHash, normalizeParticipants } from "../verify/draw.js";
import { sha256, sha256File } from "../verify/fingerprint.js";
import { createHorizonClient, horizonUrl } from "../verify/horizon.js";
import { assessTrust } from "../verify/trust.js";
import { qrSvg } from "../qr/qr.js";
import "../verify/verify.css";

// Las versiones que aún no tienen una traducción propia caen al español de forma explícita.
const L = (es, en, pt, qu = es, ay = es, gn = es) => ({ es, en, pt, qu, ay, gn });
const COPY = {
  title: L("Verificar", "Verify", "Verificar"),
  intro: L("Comprueba sorteos, movimientos y círculos. También puedes ordenar la evidencia de una irregularidad.", "Check draws, transactions, and circles. You can also organize evidence of an irregularity.", "Verifique sorteios, transações e círculos. Você também pode organizar evidências de uma irregularidade."),
  tabDraw: L("Sorteo verificable", "Verifiable draw", "Sorteio verificável", "Ch'iqiyta chiqapchay", "Suerte chiqapchay", "Sorteo añetegua"),
  tabTx: L("Comprobante", "Receipt", "Comprovante", "Chiqapchay", "Yatiya", "Mombe'u"),
  tabCircle: L("Círculo u organizador", "Circle or organizer", "Círculo ou organizador", "Muyu uta uta kamachiq", "Muyu uta kamachiña", "Aty ha ñangarekoha"),
  tabReport: L("Reportar", "Report", "Relatar", "Willay", "Yatiyaña", "Marandu"),
  alerts: L("Señales de alerta", "Warning signs", "Sinais de alerta"),
  drawLead: L("Fija la lista antes del ledger futuro y deja que la red aporte la parte imprevisible.", "Lock the list before a future ledger and let the network provide the unpredictable part.", "Fixe a lista antes do ledger futuro e deixe a rede fornecer a parte imprevisível."),
  drawTitle: L("Título", "Title", "Título"),
  participants: L("Participantes, uno por línea (máximo 500)", "Participants, one per line (up to 500)", "Participantes, um por linha (máximo 500)"),
  participantsHint: L("Se recortan espacios y se quitan líneas vacías; se conserva el orden.", "Spaces are trimmed and blank lines removed; order is preserved.", "Os espaços são removidos e as linhas vazias são ignoradas; a ordem é mantida."),
  winnerCount: L("Cantidad de ganadores", "Number of winners", "Quantidade de ganhadores"),
  orderAll: L("Ordenar a todas las personas como turnos", "Order everyone as turns", "Ordenar todas as pessoas como turnos"),
  createDraw: L("Fijar lista y elegir ledger", "Lock list and choose ledger", "Fixar lista e escolher ledger"),
  drawWorking: L("Calculando el compromiso…", "Calculating commitment…", "Calculando o compromisso…"),
  drawWaiting: L("Lista fijada. Esperando que cierre el ledger objetivo…", "List locked. Waiting for the target ledger to close…", "Lista fixada. Aguardando o fechamento do ledger alvo…"),
  drawNetworkError: L("No se pudo consultar Stellar. Comprueba tu conexión e inténtalo de nuevo.", "Could not reach Stellar. Check your connection and try again.", "Não foi possível consultar a Stellar. Verifique sua conexão e tente novamente."),
  listHash: L("Huella de la lista", "List fingerprint", "Impressão digital da lista"),
  targetLedger: L("Ledger objetivo", "Target ledger", "Ledger alvo"),
  seal: L("Sellar el compromiso en Stellar", "Seal commitment on Stellar", "Selar o compromisso na Stellar"),
  sealNote: L("La transacción es una prueba pública en Stellar testnet.", "This transaction is a public proof on Stellar testnet.", "Esta transação é uma prova pública na Stellar testnet."),
  sealUnavailable: L("Conecta una billetera para sellar en Stellar.", "Connect a wallet to seal on Stellar.", "Conecte uma carteira para selar na Stellar."),
  sealed: L("Compromiso sellado. Hash de transacción:", "Commitment sealed. Transaction hash:", "Compromisso selado. Hash da transação:"),
  sealedBefore: L("Sellado antes del ledger objetivo.", "Sealed before the target ledger.", "Selado antes do ledger alvo."),
  sealLate: L("La transacción quedó después del ledger objetivo; no prueba una fecha anterior al resultado.", "The transaction landed after the target ledger; it does not prove a time before the result.", "A transação foi incluída depois do ledger alvo; não prova uma data anterior ao resultado."),
  sealUnconfirmed: L("Hash guardado; Horizon todavía no confirma el ledger de la transacción.", "Hash saved; Horizon has not confirmed the transaction ledger yet.", "Hash salvo; a Horizon ainda não confirmou o ledger da transação."),
  sealTooLate: L("El resultado ya se conoce. Esta constancia no podría demostrar una fecha previa.", "The result is already known. A new seal could not prove an earlier date.", "O resultado já é conhecido. Um novo selo não poderia provar uma data anterior."),
  sealFailed: L("No se pudo sellar el compromiso.", "Could not seal the commitment.", "Não foi possível selar o compromisso."),
  why: L("Por qué el resultado no se puede elegir", "Why the result cannot be chosen", "Por que o resultado não pode ser escolhido"),
  whyOne: L("La lista queda fijada antes del sorteo.", "The list is locked before the draw.", "A lista é fixada antes do sorteio."),
  whyTwo: L("El ledger objetivo se elige con seis bloques de anticipación.", "The target ledger is chosen six ledgers ahead.", "O ledger alvo é escolhido com seis blocos de antecedência."),
  whyThree: L("Nadie conoce de antemano el hash de ese ledger futuro.", "Nobody knows the hash of that future ledger in advance.", "Ninguém conhece antecipadamente o hash desse ledger futuro."),
  result: L("Resultado", "Result", "Resultado"),
  pending: L("El ledger aún no cerró. Vuelve a consultar en unos segundos.", "The ledger has not closed yet. Check again in a few seconds.", "O ledger ainda não fechou. Consulte novamente em alguns segundos."),
  retryLedger: L("Volver a consultar el resultado", "Check the result again", "Consultar o resultado novamente"),
  verifyCode: L("Recalcular resultado", "Recalculate result", "Recalcular resultado"),
  copyLink: L("Copiar enlace de verificación", "Copy verification link", "Copiar link de verificação"),
  copied: L("Enlace copiado.", "Link copied.", "Link copiado."),
  copyFailed: L("No se pudo copiar. Selecciona el enlace y cópialo.", "Could not copy. Select and copy the link.", "Não foi possível copiar. Selecione e copie o link."),
  codeLabel: L("Código o enlace del sorteo", "Draw code or link", "Código ou link do sorteio"),
  qrLabel: L("Código QR de verificación", "Verification QR code", "Código QR de verificação"),
  qrTooLong: L("El enlace es demasiado largo para un QR. Copia el enlace completo.", "The link is too long for a QR code. Copy the full link.", "O link é muito longo para um QR. Copie o link completo."),
  ledgerLink: L("Ver ledger en Stellar Expert", "View ledger on Stellar Expert", "Ver ledger no Stellar Expert"),
  invalidDraw: L("Revisa el título y agrega entre 1 y 500 participantes.", "Check the title and add 1 to 500 participants.", "Confira o título e adicione de 1 a 500 participantes."),
  drawError: L("No se pudo calcular el resultado. Revisa el código y vuelve a intentarlo.", "Could not calculate the result. Check the code and try again.", "Não foi possível calcular o resultado. Confira o código e tente novamente."),
  txLead: L("Pega un hash de transacción de 64 caracteres hexadecimales o un código de sorteo.", "Paste a 64-character hexadecimal transaction hash or a draw code.", "Cole um hash de transação hexadecimal de 64 caracteres ou um código de sorteio."),
  verify: L("Verificar", "Verify", "Verificar"),
  txNotFound: L("No existe en Stellar testnet. Puede pertenecer a otra red o tener un hash incorrecto.", "Not found on Stellar testnet. It may belong to another network or the hash may be incorrect.", "Não encontrado na Stellar testnet. Pode pertencer a outra rede ou o hash pode estar incorreto."),
  networkError: L("Stellar no respondió. Inténtalo de nuevo más tarde.", "Stellar did not respond. Try again later.", "A Stellar não respondeu. Tente novamente mais tarde."),
  txDate: L("Fecha", "Date", "Data"),
  ledger: L("Ledger", "Ledger", "Ledger"),
  source: L("Cuenta de origen", "Source account", "Conta de origem"),
  txType: L("Operación", "Operation", "Operação"),
  memo: L("Memo", "Memo", "Memo"),
  txStatus: L("Estado", "Status", "Estado"),
  success: L("Exitosa", "Successful", "Bem-sucedida"),
  failed: L("Fallida", "Failed", "Falhou"),
  operations: L("Operaciones", "Operations", "Operações"),
  awayuCall: L("Invoca el contrato de Awayu:", "Invokes an Awayu contract:", "Invoca o contrato da Awayu:"),
  otherContract: L("No se identificó una llamada a un contrato de Awayu.", "No call to an Awayu contract was identified.", "Nenhuma chamada a um contrato da Awayu foi identificada."),
  viewTx: L("Ver transacción en Stellar Expert", "View transaction on Stellar Expert", "Ver transação no Stellar Expert"),
  circleLead: L("Consulta el registro colectivo y los datos públicos del contrato.", "Check the community registry and public contract data.", "Consulte o registro comunitário e os dados públicos do contrato."),
  address: L("Dirección del contrato C… o de la cuenta G…", "Contract address C… or account address G…", "Endereço do contrato C… ou da conta G…"),
  checkAddress: L("Consultar dirección", "Check address", "Consultar endereço"),
  registered: L("Registrado en el registro de Awayu", "Listed in Awayu registry", "Registrado no registro da Awayu"),
  notRegistered: L("No aparece en el registro de Awayu.", "Not listed in Awayu registry.", "Não aparece no registro da Awayu."),
  circleName: L("Nombre", "Name", "Nome"),
  region: L("Región", "Region", "Região"),
  members: L("Miembros", "Members", "Membros"),
  endorsements: L("Avales", "Endorsements", "Avales"),
  created: L("Creación del contrato", "Contract creation", "Criação do contrato"),
  invocations: L("Invocaciones", "Invocations", "Invocações"),
  expertErrors: L("Errores reportados", "Reported errors", "Erros relatados"),
  buildStatus: L("Build verificado", "Verified build", "Build verificado"),
  verifiedYes: L("Sí, según Stellar Expert", "Yes, according to Stellar Expert", "Sim, segundo Stellar Expert"),
  verifiedNo: L("No verificado por Stellar Expert", "Not verified by Stellar Expert", "Não verificado pela Stellar Expert"),
  trust: L("Semáforo de confianza", "Trust signal", "Indicador de confiança"),
  trustGreen: L("Señales favorables", "Favorable signals", "Sinais favoráveis"),
  trustYellow: L("Información incompleta o por revisar", "Information is incomplete or needs review", "Informações incompletas ou precisam ser revisadas"),
  trustRed: L("No está registrado", "Not registered", "Não está registrado"),
  trustDisclaimer: L("Es una orientación basada en datos públicos, no una calificación oficial ni garantía.", "This is guidance based on public data, not an official rating or guarantee.", "É uma orientação baseada em dados públicos, não uma classificação oficial nem garantia."),
  reasonRegistered: L("Figura en el registro de Awayu.", "Listed in the Awayu registry.", "Está no registro da Awayu."),
  reasonNotRegistered: L("No figura en el registro de Awayu.", "Not listed in the Awayu registry.", "Não está no registro da Awayu."),
  reasonEndorsements: L("Tiene avales comunitarios.", "Has community endorsements.", "Tem avales comunitários."),
  reasonNoEndorsements: L("No tiene avales registrados.", "Has no recorded endorsements.", "Não tem avales registrados."),
  reasonVerified: L("Stellar Expert indica que el build está verificado.", "Stellar Expert reports a verified build.", "Stellar Expert informa que o build foi verificado."),
  reasonUnverified: L("Stellar Expert no indica un build verificado.", "Stellar Expert does not report a verified build.", "Stellar Expert não informa um build verificado."),
  reasonErrors: L("Stellar Expert reporta errores.", "Stellar Expert reports errors.", "Stellar Expert relata erros."),
  passport: L("Pasaporte de Awayu", "Awayu passport", "Passaporte da Awayu"),
  circleCount: L("Círculos registrados donde participa", "Registered circles joined", "Círculos registrados de que participa"),
  score: L("Puntaje del pasaporte", "Passport score", "Pontuação do passaporte"),
  circleNotFound: L("No se encontró esa dirección como círculo registrado ni como cuenta.", "That address was not found as a registered circle or account.", "Esse endereço não foi encontrado como círculo registrado nem como conta."),
  reportLead: L("Awayu no es una autoridad ni recibe denuncias formales. Esta herramienta ayuda a ordenar evidencia.", "Awayu is not an authority and does not receive formal complaints. This tool helps organize evidence.", "A Awayu não é uma autoridade nem recebe denúncias formais. Esta ferramenta ajuda a organizar evidências."),
  related: L("Círculo o enlace relacionado (opcional)", "Related circle or link (optional)", "Círculo ou link relacionado (opcional)"),
  reportType: L("Tipo de irregularidad", "Type of issue", "Tipo de irregularidade"),
  noPot: L("No entregó el pozo", "The pot was not paid out", "Não entregou o prêmio"),
  disappeared: L("Cobró y desapareció", "Collected money and disappeared", "Recebeu dinheiro e desapareceu"),
  rigged: L("Sorteo amañado", "Rigged draw", "Sorteio manipulado"),
  impersonation: L("Suplantación", "Impersonation", "Falsidade de identidade"),
  other: L("Otro", "Other", "Outro"),
  description: L("Descripción (máximo 1000 caracteres)", "Description (up to 1,000 characters)", "Descrição (máximo de 1.000 caracteres)"),
  evidence: L("Evidencias (no se suben; solo se calcula su huella)", "Evidence (never uploaded; only fingerprints are calculated)", "Evidências (não são enviadas; apenas as impressões digitais são calculadas)"),
  hashFiles: L("Calcular huellas", "Calculate fingerprints", "Calcular impressões digitais"),
  filesLocal: L("Los archivos se procesan en este navegador y nunca se suben.", "Files are processed in this browser and are never uploaded.", "Os arquivos são processados neste navegador e nunca são enviados."),
  createReport: L("Crear constancia", "Create record", "Criar comprovante"),
  trackCode: L("Código de seguimiento", "Tracking code", "Código de acompanhamento"),
  downloadJson: L("Descargar JSON", "Download JSON", "Baixar JSON"),
  downloadText: L("Descargar texto", "Download text", "Baixar texto"),
  sealReport: L("Sellar la constancia en Stellar", "Seal the record on Stellar", "Selar o comprovante na Stellar"),
  myReports: L("Mis reportes", "My reports", "Meus relatos"),
  noReports: L("Todavía no guardaste reportes en este navegador.", "No reports saved in this browser yet.", "Ainda não há relatos salvos neste navegador."),
  status: L("Estado personal", "Personal status", "Estado pessoal"),
  open: L("Abierto", "Open", "Aberto"),
  sent: L("Enviado a la autoridad", "Sent to authority", "Enviado à autoridade"),
  resolved: L("Resuelto", "Resolved", "Resolvido"),
  notes: L("Notas personales", "Personal notes", "Anotações pessoais"),
  reportSaved: L("Constancia guardada en este navegador.", "Record saved in this browser.", "Comprovante salvo neste navegador."),
  saveFailed: L("No se pudo guardar en este navegador. Descarga la constancia para conservarla.", "Could not save in this browser. Download the record to keep it.", "Não foi possível salvar neste navegador. Baixe o comprovante para guardá-lo."),
  orientation: L("Orientación para Bolivia", "Guidance for Bolivia", "Orientação para a Bolívia"),
  guidance: L("Los reclamos sobre servicios financieros corresponden a la Defensoría del Consumidor Financiero de ASFI. Los juegos de azar, loterías y sorteos los regula la Autoridad de Fiscalización del Juego (AJ). Las estafas se denuncian ante la Policía (FELCC) o el Ministerio Público. Verifica los canales oficiales vigentes.", "Complaints about financial services go to ASFI's Financial Consumer Ombudsman. Gambling, lotteries, and draws are regulated by the Gaming Authority (AJ). Report fraud to the Police (FELCC) or Public Prosecutor's Office. Verify current official channels.", "Reclamações sobre serviços financeiros cabem à Defensoria do Consumidor Financeiro da ASFI. Jogos de azar, loterias e sorteios são regulados pela Autoridade de Fiscalização do Jogo (AJ). Denuncie fraudes à Polícia (FELCC) ou ao Ministério Público. Verifique os canais oficiais vigentes."),
  alertProfit: L("Promete ganancias seguras", "Promises guaranteed gains", "Promete ganhos garantidos"),
  alertOrder: L("El organizador decide el orden a dedo", "The organizer picks the order", "O organizador escolhe a ordem"),
  alertPayments: L("No hay registro de pagos", "There is no payment record", "Não há registro de pagamentos"),
  alertPressure: L("Presiona para pagar rápido", "Pressures you to pay quickly", "Pressiona para pagar rápido"),
  alertRules: L("Cambia las reglas a mitad", "Changes rules midway", "Muda as regras no meio"),
  alertKeys: L("Pide claves o frases semilla", "Asks for passwords or seed phrases", "Pede senhas ou frases-semente"),
  inspect: L("Comprobar", "Check", "Conferir"),
  testnetOnly: L("Esta función usa Stellar testnet; no envía dinero real.", "This feature uses Stellar testnet; it does not send real money.", "Esta função usa a Stellar testnet; não envia dinheiro real."),
  empty: L("—", "—", "—"),
};

const el = (root, selector) => root.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const shortAddress = (value) => String(value || "").slice(0, 8) + "…" + String(value || "").slice(-6);
const numberLocale = (lang) => ({ en: "en-US", pt: "pt-BR", es: "es-BO", qu: "es-BO", ay: "es-BO", gn: "es-BO" })[lang] || "es-BO";

function operationName(type, t) {
  const names = {
    payment: L("Pago", "Payment", "Pagamento"),
    invoke_host_function: L("Llamada a contrato", "Contract call", "Chamada de contrato"),
    create_account: L("Crear cuenta", "Create account", "Criar conta"),
    account_merge: L("Unir cuentas", "Merge accounts", "Unir contas"),
    path_payment_strict_send: L("Pago por ruta", "Path payment", "Pagamento por rota"),
    path_payment_strict_receive: L("Pago por ruta", "Path payment", "Pagamento por rota"),
    create_claimable_balance: L("Crear saldo reclamable", "Create claimable balance", "Criar saldo resgatável"),
  };
  return names[type] ? pickLang(names[type], t.lang) : String(type || "—").replaceAll("_", " ");
}

function readSavedReports() {
  try {
    const value = JSON.parse(localStorage.getItem("awayu.reports") || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function saveReports(reports) {
  try { localStorage.setItem("awayu.reports", JSON.stringify(reports)); return true; }
  catch { return false; }
}

function reportText(report, t) {
  return [
    t("trackCode") + ": " + report.code,
    t("txDate") + ": " + report.createdAt,
    t("reportType") + ": " + report.typeLabel,
    t("related") + ": " + (report.related || t("empty")),
    t("description") + ": " + report.description,
    t("evidence") + ":",
    ...(report.evidence || []).map((item) => "- " + item.name + " (" + item.size + " bytes), SHA-256 " + item.sha256),
    "SHA-256: " + report.fingerprint,
  ].join("\n");
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function createSealXdr(client, address, hash) {
  const account = await client.account(address);
  if (!account) throw new Error("Account not found on Horizon");
  const source = new Account(address, String(account.sequence));
  return new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({ destination: address, asset: Asset.native(), amount: "0.0000001" }))
    .addMemo(Memo.hash(Buffer.from(hash, "hex")))
    .setTimeout(120)
    .build()
    .toXDR();
}

function sealHash(result) {
  if (typeof result === "string" && /^[0-9a-f]{64}$/i.test(result)) return result;
  return result?.hash || result?.transaction?.hash || result?.id || "";
}

export function mount(container, { lang = "es", deployment = {}, address = "", sign } = {}) {
  const t = (key) => pickLang(COPY[key] || L(key, key, key), lang);
  const client = createHorizonClient({ baseUrl: horizonUrl(deployment) });
  let destroyed = false;
  let activeTab = "draw";
  let currentDraw = null;
  let reportDraft = null;
  let reports = readSavedReports();
  let evidence = [];

  const tabData = [
    ["draw", "tabDraw"], ["tx", "tabTx"], ["circle", "tabCircle"], ["report", "tabReport"],
  ];
  container.innerHTML = [
    '<section class="verify-root">',
    '<header class="verify-head"><div class="verify-mark" aria-hidden="true">✓</div><div><h1>' + esc(t("title")) + '</h1><p>' + esc(t("intro")) + '</p></div></header>',
    '<div class="verify-tabs" role="tablist" aria-label="' + esc(t("title")) + '">',
    tabData.map(([id, key], index) => '<button type="button" role="tab" id="verify-tab-' + id + '" aria-controls="verify-panel-' + id + '" aria-selected="' + String(index === 0) + '" tabindex="' + (index === 0 ? "0" : "-1") + '" data-tab="' + id + '">' + esc(t(key)) + '</button>').join(""),
    '</div>',
    '<section class="verify-panel" role="tabpanel" id="verify-panel-draw" aria-labelledby="verify-tab-draw" data-panel="draw">',
    '<p class="verify-lead">' + esc(t("drawLead")) + '</p>',
    '<div class="verify-draw-grid"><form id="verify-draw-form" class="verify-form">',
    '<label>' + esc(t("drawTitle")) + '<input name="title" maxlength="120" required></label>',
    '<label>' + esc(t("participants")) + '<textarea name="participants" rows="8" required></textarea></label>',
    '<p class="verify-hint">' + esc(t("participantsHint")) + '</p>',
    '<label class="verify-count-label">' + esc(t("winnerCount")) + '<input name="count" type="number" min="1" max="500" value="1"></label>',
    '<label class="verify-check"><input name="all" type="checkbox"><span>' + esc(t("orderAll")) + '</span></label>',
    '<button class="verify-button primary" type="submit">' + esc(t("createDraw")) + '</button>',
    '<p class="verify-status" id="verify-draw-status" aria-live="polite"></p>',
    '</form><aside class="verify-commit" id="verify-commit" hidden></aside></div>',
    '<section class="verify-why"><h2>' + esc(t("why")) + '</h2><ol><li>' + esc(t("whyOne")) + '</li><li>' + esc(t("whyTwo")) + '</li><li>' + esc(t("whyThree")) + '</li></ol></section>',
    '</section>',
    '<section class="verify-panel" role="tabpanel" id="verify-panel-tx" aria-labelledby="verify-tab-tx" data-panel="tx" hidden>',
    '<p class="verify-lead">' + esc(t("txLead")) + '</p><form id="verify-tx-form" class="verify-inline"><label>' + esc(t("codeLabel")) + '<input name="value" autocomplete="off"></label><button class="verify-button primary" type="submit">' + esc(t("verify")) + '</button></form><div id="verify-tx-result" aria-live="polite"></div>',
    '</section>',
    '<section class="verify-panel" role="tabpanel" id="verify-panel-circle" aria-labelledby="verify-tab-circle" data-panel="circle" hidden>',
    '<p class="verify-lead">' + esc(t("circleLead")) + '</p><form id="verify-circle-form" class="verify-inline"><label>' + esc(t("address")) + '<input name="address" autocomplete="off"></label><button class="verify-button primary" type="submit">' + esc(t("checkAddress")) + '</button></form><div id="verify-circle-result" aria-live="polite"></div>',
    '</section>',
    '<section class="verify-panel" role="tabpanel" id="verify-panel-report" aria-labelledby="verify-tab-report" hidden data-panel="report">',
    '<p class="verify-lead">' + esc(t("reportLead")) + '</p><form id="verify-report-form" class="verify-form">',
    '<label>' + esc(t("related")) + '<input name="related" maxlength="300"></label>',
    '<label>' + esc(t("reportType")) + '<select name="type"><option value="no-pot">' + esc(t("noPot")) + '</option><option value="disappeared">' + esc(t("disappeared")) + '</option><option value="rigged">' + esc(t("rigged")) + '</option><option value="impersonation">' + esc(t("impersonation")) + '</option><option value="other">' + esc(t("other")) + '</option></select></label>',
    '<label>' + esc(t("description")) + '<textarea name="description" maxlength="1000" rows="5" required></textarea></label>',
    '<label>' + esc(t("evidence")) + '<input name="files" type="file" multiple></label><p class="verify-hint">' + esc(t("filesLocal")) + '</p><div class="verify-evidence" id="verify-evidence"></div>',
    '<button class="verify-button primary" type="submit">' + esc(t("createReport")) + '</button><p class="verify-status" id="verify-report-status" aria-live="polite"></p>',
    '</form><div id="verify-report-result"></div><section class="verify-my-reports"><h2>' + esc(t("myReports")) + '</h2><div id="verify-reports-list"></div></section>',
    '<aside class="verify-guidance"><h2>' + esc(t("orientation")) + '</h2><p>' + esc(t("guidance")) + '</p></aside></section>',
    '<aside class="verify-alerts"><h2>' + esc(t("alerts")) + '</h2><ul>',
    [["alertProfit", "tx"], ["alertOrder", "draw"], ["alertPayments", "tx"], ["alertPressure", "report"], ["alertRules", "draw"], ["alertKeys", "report"]].map(([key, tab]) => '<li><span>' + esc(t(key)) + '</span><button type="button" class="verify-alert-link" data-open-tab="' + tab + '">' + esc(t("inspect")) + '</button></li>').join(""),
    '</ul></aside><p class="verify-testnet-note">' + esc(t("testnetOnly")) + '</p></section>',
  ].join("");

  const root = container.querySelector(".verify-root");
  function selectTab(id) {
    activeTab = id;
    root.querySelectorAll('[role="tab"]').forEach((button) => {
      const selected = button.dataset.tab === id;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
  }

  function renderCommitment() {
    const box = el(root, "#verify-commit");
    if (!currentDraw) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    const result = currentDraw.result;
    const ledgerUrl = "https://stellar.expert/explorer/testnet/ledger/" + encodeURIComponent(currentDraw.ledger);
    const sealButton = currentDraw.sealedTx
      ? '<p class="verify-status">' + esc(currentDraw.sealLabel || t("sealed")) + ' <a target="_blank" rel="noopener" href="https://stellar.expert/explorer/testnet/tx/' + encodeURIComponent(currentDraw.sealedTx) + '">' + esc(currentDraw.sealedTx) + '</a></p>'
      : result
        ? '<p class="verify-hint">' + esc(t("sealTooLate")) + '</p>'
        : address && sign
          ? '<button type="button" class="verify-button" data-seal-draw>' + esc(t("seal")) + '</button><p class="verify-hint">' + esc(t("sealNote")) + '</p>'
          : '<p class="verify-hint">' + esc(t("sealUnavailable")) + '</p>';
    let resultHtml = '<p class="verify-status">' + esc(currentDraw.status || t("drawWaiting")) + '</p>'
      + (currentDraw.needsRetry ? '<button type="button" class="verify-button" data-retry-draw>' + esc(t("retryLedger")) + '</button>' : "");
    if (result) {
      resultHtml = '<h3>' + esc(t("result")) + '</h3><ol class="verify-winners">' + result.winners.map((name) => '<li>' + esc(name) + '</li>').join("") + '</ol>'
        + '<a target="_blank" rel="noopener" href="' + ledgerUrl + '">' + esc(t("ledgerLink")) + '</a>';
    }
    const share = currentDraw.code ? location.origin + location.pathname + location.search.split("#")[0] + "#/verificar?s=" + currentDraw.code : "";
    const sealText = currentDraw.sealText ? '<p class="verify-status" aria-live="polite">' + esc(currentDraw.sealText) + '</p>' : "";
    let qr = "";
    if (share) {
      try { qr = qrSvg(share); }
      catch { qr = '<p class="verify-hint">' + esc(t("qrTooLong")) + '</p>'; }
    }
    box.innerHTML = '<h2>' + esc(t("listHash")) + '</h2><code>' + esc(currentDraw.hash) + '</code><p><b>' + esc(t("targetLedger")) + ':</b> ' + esc(currentDraw.ledger) + '</p>'
      + sealText + resultHtml + sealButton
      + (share ? '<div class="verify-share"><label>' + esc(t("codeLabel")) + '<input readonly value="' + esc(share) + '" data-share-url></label><button type="button" class="verify-button" data-copy-link>' + esc(t("copyLink")) + '</button><div class="verify-qr"><p>' + esc(t("qrLabel")) + '</p>' + qr + '</div></div>' : "");
  }

  function setCommitStatus(message) {
    currentDraw.status = message;
    renderCommitment();
  }

  async function waitForLedger(sequence) {
    for (let attempt = 0; attempt < 40 && !destroyed; attempt++) {
      const ledger = await client.ledger(sequence);
      if (ledger?.hash) return ledger;
      setCommitStatus(t("drawWaiting"));
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return null;
  }

  async function retrieveDraw(drawState) {
    drawState.needsRetry = false;
    drawState.status = t("drawWaiting");
    renderCommitment();
    try {
      const ledger = await waitForLedger(drawState.ledger);
      if (!ledger?.hash) {
        if (!destroyed && currentDraw === drawState) {
          drawState.status = t("pending");
          drawState.needsRetry = true;
          renderCommitment();
        }
        return;
      }
      await finishDraw(drawState, ledger.hash);
    } catch {
      if (!destroyed && currentDraw === drawState) {
        drawState.status = t("drawNetworkError");
        drawState.needsRetry = true;
        renderCommitment();
      }
    }
  }

  async function finishDraw(drawState, ledgerHash) {
    const result = await drawResult({
      title: drawState.title,
      participants: drawState.participants,
      ledgerHash,
      count: drawState.count,
    });
    if (destroyed || currentDraw !== drawState) return;
    drawState.result = result;
    drawState.code = encodeCode({
      title: drawState.title,
      ledger: drawState.ledger,
      participants: drawState.participants,
      count: drawState.count,
    });
    drawState.status = "";
    renderCommitment();
  }

  async function verifyDrawCode(rawCode) {
    try {
      const code = decodeCode(rawCode);
      const commitment = await listHash(code.title, code.participants);
      const ledger = await client.ledger(code.ledger);
      if (!ledger?.hash) {
        el(root, "#verify-tx-result").innerHTML = '<p class="verify-status">' + esc(t("pending")) + '</p>';
        return;
      }
      const result = await drawResult({ title: code.title, participants: code.participants, ledgerHash: ledger.hash, count: code.count });
      el(root, "#verify-tx-result").innerHTML = '<article class="verify-result"><h2>' + esc(t("result")) + '</h2><p><b>' + esc(t("listHash")) + ':</b> <code>' + esc(commitment) + '</code></p><ol>' + result.winners.map((name) => '<li>' + esc(name) + '</li>').join("") + '</ol><a target="_blank" rel="noopener" href="https://stellar.expert/explorer/testnet/ledger/' + encodeURIComponent(code.ledger) + '">' + esc(t("ledgerLink")) + '</a></article>';
      selectTab("tx");
    } catch {
      el(root, "#verify-tx-result").innerHTML = '<p class="verify-error">' + esc(t("drawError")) + '</p>';
    }
  }

  root.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) return selectTab(tab.dataset.tab);
    const jump = event.target.closest("[data-open-tab]");
    if (jump) return selectTab(jump.dataset.openTab);
    const retryDraw = event.target.closest("[data-retry-draw]");
    if (retryDraw && currentDraw) {
      retryDraw.disabled = true;
      await retrieveDraw(currentDraw);
      return;
    }
    const copyButton = event.target.closest("[data-copy-link]");
    if (copyButton) {
      const input = el(root, "[data-share-url]");
      try { await navigator.clipboard.writeText(input.value); copyButton.textContent = t("copied"); }
      catch { input.focus(); input.select(); copyButton.textContent = t("copyFailed"); }
      return;
    }
    if (event.target.closest("[data-seal-draw]")) {
      if (!currentDraw || !address || !sign) return;
      const button = event.target.closest("[data-seal-draw]");
      button.disabled = true;
      try {
        const xdr = await createSealXdr(client, address, currentDraw.hash);
        const signed = await sign(xdr);
        const hash = sealHash(signed);
        if (!hash) currentDraw.sealText = t("sealFailed");
        else {
          currentDraw.sealedTx = hash;
          const transaction = await client.transaction(hash).catch(() => null);
          currentDraw.sealLabel = Number.isFinite(Number(transaction?.ledger))
            ? Number(transaction.ledger) < currentDraw.ledger ? t("sealedBefore") : t("sealLate")
            : t("sealUnconfirmed");
        }
      } catch {
        currentDraw.sealText = t("sealFailed");
      }
      renderCommitment();
    }
    const sealReportButton = event.target.closest("[data-seal-report]");
    if (sealReportButton) {
      const report = reports.find((item) => item.fingerprint === sealReportButton.dataset.sealReport);
      if (!report || !address || !sign) return;
      sealReportButton.disabled = true;
      try {
        const signed = await sign(await createSealXdr(client, address, report.fingerprint));
        report.sealedTx = sealHash(signed);
        saveReports(reports);
        renderReportResult();
        renderReports();
      } catch {
        sealReportButton.insertAdjacentHTML("afterend", '<p class="verify-error">' + esc(t("sealFailed")) + '</p>');
      }
    }
  });

  root.addEventListener("keydown", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); selectTab(tabs[next].dataset.tab);
  });

  el(root, "#verify-draw-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    let participants;
    try { participants = normalizeParticipants(form.get("participants")); }
    catch { participants = []; }
    if (!title || !participants.length || participants.length > 500) {
      el(root, "#verify-draw-status").textContent = t("invalidDraw");
      return;
    }
    const all = form.get("all") === "on";
    const count = all ? participants.length : Math.max(1, Math.min(participants.length, Math.floor(Number(form.get("count")) || 1)));
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    el(root, "#verify-draw-status").textContent = t("drawWorking");
    try {
      const hash = await listHash(title, participants);
      const latest = await client.latestLedger();
      currentDraw = { title, participants, count, hash, ledger: latest.sequence + 6, result: null, status: t("drawWaiting") };
      renderCommitment();
      await retrieveDraw(currentDraw);
    } catch {
      if (!destroyed) el(root, "#verify-draw-status").textContent = t("drawNetworkError");
    } finally {
      submit.disabled = false;
    }
  });

  el(root, "#verify-tx-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("value") || "").trim();
    const resultBox = el(root, "#verify-tx-result");
    const code = (() => {
      try {
        if (value.includes("s=")) {
          const url = new URL(value, location.href);
          const fromSearch = url.searchParams.get("s");
          return fromSearch || new URLSearchParams(url.hash.split("?")[1] || "").get("s");
        }
        if (value.startsWith("#/")) return new URLSearchParams(value.split("?")[1] || "").get("s");
        return /^[A-Za-z0-9_-]+$/.test(value) && !/^[a-f0-9]{64}$/i.test(value) ? value : null;
      } catch { return null; }
    })();
    if (code) { await verifyDrawCode(code); return; }
    if (!/^[a-f0-9]{64}$/i.test(value)) {
      resultBox.innerHTML = '<p class="verify-error">' + esc(t("drawError")) + '</p>';
      return;
    }
    resultBox.innerHTML = '<p class="verify-status">' + esc(t("drawWorking")) + '</p>';
    try {
      const tx = await client.transaction(value);
      if (!tx) { resultBox.innerHTML = '<p class="verify-status">' + esc(t("txNotFound")) + '</p>'; return; }
      const operations = await client.operations(value);
      const contracts = [
        ["Pasanaku", deployment.contractId],
        ["Registro", deployment.registro],
        ["Ayni", deployment.ayni?.contractId],
        ["Minka", deployment.minka?.contractId],
        ["Alasitas", deployment.alasitas?.contractId],
      ].filter(([, id]) => id);
      const serialized = JSON.stringify(operations);
      const awayu = contracts.filter(([, id]) => serialized.includes(id)).map(([name]) => name);
      const rows = [
        [t("txDate"), tx.created_at ? new Date(tx.created_at).toLocaleString(numberLocale(lang)) : "—"],
        [t("ledger"), tx.ledger],
        [t("source"), tx.source_account],
        [t("txType"), operations.map((op) => operationName(op.type, { lang })).join(", ") || "—"],
        [t("memo"), tx.memo || "—"],
        [t("txStatus"), tx.successful ? t("success") : t("failed")],
      ];
      resultBox.innerHTML = '<article class="verify-result"><dl>' + rows.map(([label, val]) => '<div><dt>' + esc(label) + '</dt><dd>' + esc(val) + '</dd></div>').join("") + '</dl>'
        + '<h3>' + esc(t("operations")) + '</h3><ul>' + operations.map((op) => '<li>' + esc(operationName(op.type, { lang })) + '</li>').join("") + '</ul>'
        + (awayu.length ? '<p class="verify-good">' + esc(t("awayuCall")) + ' ' + esc(awayu.join(", ")) + '</p>' : '<p class="verify-hint">' + esc(t("otherContract")) + '</p>')
        + '<a target="_blank" rel="noopener" href="https://stellar.expert/explorer/testnet/tx/' + encodeURIComponent(value) + '">' + esc(t("viewTx")) + '</a></article>';
    } catch {
      resultBox.innerHTML = '<p class="verify-error">' + esc(t("networkError")) + '</p>';
    }
  });

  el(root, "#verify-circle-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("address") || "").trim();
    const box = el(root, "#verify-circle-result");
    box.innerHTML = '<p class="verify-status">' + esc(t("drawWorking")) + '</p>';
    try {
      const { readRegistry, readPassport } = await import("../chain.js");
      if (/^G[A-Z2-7]{55}$/.test(value)) {
        const passport = await readPassport(deployment, value);
        box.innerHTML = '<article class="verify-result"><h2>' + esc(t("passport")) + '</h2><dl><div><dt>' + esc(t("circleCount")) + '</dt><dd>' + passport.circles.length + '</dd></div><div><dt>' + esc(t("score")) + '</dt><dd>' + Number(passport.score || 0) + '/100</dd></div></dl></article>';
        return;
      }
      if (!/^C[A-Z2-7]{55}$/.test(value)) { box.innerHTML = '<p class="verify-error">' + esc(t("circleNotFound")) + '</p>'; return; }
      const [registry, expert] = await Promise.all([readRegistry(deployment), client.contractInfo(value).catch(() => null)]);
      const circle = registry.find((item) => item.contractId === value);
      const info = expert?.contract || expert || {};
      const validationStatus = info.validation?.status || expert?.validation?.status;
      const verified = validationStatus === "verified";
      const errorsValue = info.errors ?? expert?.errors;
      const expertErrors = Number(errorsValue ?? 0);
      const assessment = assessTrust({ registered: Boolean(circle), endorsements: circle?.endorsements || 0, verified, errors: expertErrors });
      const levelLabel = assessment.level === "green" ? t("trustGreen") : assessment.level === "red" ? t("trustRed") : t("trustYellow");
      const dateRaw = info.created ?? expert?.created ?? circle?.created;
      const created = dateRaw ? (Number.isFinite(Number(dateRaw)) ? new Date(Number(dateRaw) < 1e12 ? Number(dateRaw) * 1000 : Number(dateRaw)).toLocaleString(numberLocale(lang)) : new Date(dateRaw).toLocaleString(numberLocale(lang))) : "—";
      const invocationCount = info.invocations ?? expert?.invocations ?? "—";
      const regions = { lpz: "La Paz", cbba: "Cochabamba", scz: "Santa Cruz", oru: "Oruro", pts: "Potosí", chq: "Chuquisaca", trj: "Tarija", ben: "Beni", pnd: "Pando", otro: "Otro" };
      const region = circle?.region ? regions[String(circle.region).toLowerCase()] || circle.region : "—";
      box.innerHTML = '<article class="verify-result"><p class="' + (circle ? "verify-good" : "verify-error") + '">' + esc(circle ? t("registered") : t("notRegistered")) + '</p><dl>'
        + '<div><dt>' + esc(t("circleName")) + '</dt><dd>' + esc(circle?.name || "—") + '</dd></div><div><dt>' + esc(t("region")) + '</dt><dd>' + esc(region) + '</dd></div>'
        + '<div><dt>' + esc(t("members")) + '</dt><dd>' + (circle ? Number(circle.members || 0) : "—") + '</dd></div><div><dt>' + esc(t("endorsements")) + '</dt><dd>' + (circle ? Number(circle.endorsements || 0) : "—") + '</dd></div>'
        + '<div><dt>' + esc(t("created")) + '</dt><dd>' + esc(created) + '</dd></div><div><dt>' + esc(t("invocations")) + '</dt><dd>' + esc(invocationCount) + '</dd></div>'
        + '<div><dt>' + esc(t("expertErrors")) + '</dt><dd>' + esc(errorsValue == null ? "—" : expertErrors) + '</dd></div><div><dt>' + esc(t("buildStatus")) + '</dt><dd>' + esc(verified ? t("verifiedYes") : t("verifiedNo")) + '</dd></div></dl>'
        + '<div class="verify-trust ' + assessment.level + '"><h3>' + esc(t("trust")) + ': ' + esc(levelLabel) + '</h3><ul>' + assessment.reasons.map((reason) => '<li>' + esc(t(({ registered: "reasonRegistered", not_registered: "reasonNotRegistered", has_endorsements: "reasonEndorsements", no_endorsements: "reasonNoEndorsements", build_verified: "reasonVerified", build_unverified: "reasonUnverified", expert_errors: "reasonErrors" })[reason] || "trustYellow")) + '</li>').join("") + '</ul><p>' + esc(t("trustDisclaimer")) + '</p></div>'
        + '<a target="_blank" rel="noopener" href="https://stellar.expert/explorer/testnet/contract/' + encodeURIComponent(value) + '">' + esc(t("ledgerLink")) + '</a></article>';
    } catch {
      box.innerHTML = '<p class="verify-error">' + esc(t("networkError")) + '</p>';
    }
  });

  function renderEvidence() {
    el(root, "#verify-evidence").innerHTML = evidence.map((item) => '<p><b>' + esc(item.name) + '</b> · ' + Number(item.size).toLocaleString(numberLocale(lang)) + ' bytes<br><code>' + esc(item.sha256) + '</code></p>').join("");
  }

  el(root, '[name="files"]').addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const status = el(root, "#verify-report-status");
    status.textContent = t("drawWorking");
    try {
      evidence = [];
      for (const file of Array.from(input.files || [])) {
        evidence.push({ name: file.name, size: file.size, sha256: await sha256File(file) });
      }
      renderEvidence();
      status.textContent = t("filesLocal");
    } catch {
      status.textContent = t("networkError");
    }
  });

  el(root, "#verify-report-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = String(form.get("description") || "").trim();
    if (!description || description.length > 1000) return;
    const types = { "no-pot": "noPot", disappeared: "disappeared", rigged: "rigged", impersonation: "impersonation", other: "other" };
    const report = {
      createdAt: new Date().toISOString(),
      related: String(form.get("related") || "").trim(),
      type: String(form.get("type") || "other"),
      typeLabel: t(types[String(form.get("type") || "other")] || "other"),
      description,
      evidence: evidence.map((item) => ({ ...item })),
    };
    report.fingerprint = await sha256(JSON.stringify({
      createdAt: report.createdAt,
      related: report.related,
      type: report.type,
      description: report.description,
      evidence: report.evidence,
    }));
    report.code = report.fingerprint.slice(0, 12).toUpperCase();
    report.status = "open";
    report.notes = "";
    reports.unshift(report);
    const saved = saveReports(reports);
    reportDraft = report;
    el(root, "#verify-report-status").textContent = saved ? t("reportSaved") : t("saveFailed");
    renderReportResult();
    renderReports();
  });

  function renderReportResult() {
    const box = el(root, "#verify-report-result");
    if (!reportDraft) { box.innerHTML = ""; return; }
    const buttons = address && sign
      ? '<button type="button" class="verify-button" data-seal-report="' + esc(reportDraft.fingerprint) + '">' + esc(t("sealReport")) + '</button><p class="verify-hint">' + esc(t("sealNote")) + '</p>'
      : '<p class="verify-hint">' + esc(t("sealUnavailable")) + '</p>';
    box.innerHTML = '<article class="verify-result"><h3>' + esc(t("trackCode")) + ': <code>' + esc(reportDraft.code) + '</code></h3><p>' + esc(t("listHash")) + ': <code>' + esc(reportDraft.fingerprint) + '</code></p>'
      + '<button type="button" class="verify-button" data-download="json">' + esc(t("downloadJson")) + '</button> <button type="button" class="verify-button" data-download="text">' + esc(t("downloadText")) + '</button>' + buttons
      + (reportDraft.sealedTx ? '<p>' + esc(t("sealed")) + ' <a target="_blank" rel="noopener" href="https://stellar.expert/explorer/testnet/tx/' + encodeURIComponent(reportDraft.sealedTx) + '">' + esc(reportDraft.sealedTx) + '</a></p>' : '') + '</article>';
  }

  function renderReports() {
    const box = el(root, "#verify-reports-list");
    if (!reports.length) { box.innerHTML = '<p class="verify-hint">' + esc(t("noReports")) + '</p>'; return; }
    box.innerHTML = reports.map((report, index) => '<article class="verify-saved-report" data-report-index="' + index + '"><h3>' + esc(report.code || "") + '</h3><p>' + esc(report.createdAt || "") + ' · ' + esc(report.typeLabel || report.type || "") + '</p>'
      + '<label>' + esc(t("status")) + '<select data-report-status><option value="open"' + (report.status === "open" ? " selected" : "") + '>' + esc(t("open")) + '</option><option value="sent"' + (report.status === "sent" ? " selected" : "") + '>' + esc(t("sent")) + '</option><option value="resolved"' + (report.status === "resolved" ? " selected" : "") + '>' + esc(t("resolved")) + '</option></select></label>'
      + '<label>' + esc(t("notes")) + '<textarea data-report-notes maxlength="1000" rows="2">' + esc(report.notes || "") + '</textarea></label>'
      + '<p><code>' + esc(report.fingerprint || "") + '</code></p></article>').join("");
  }

  root.addEventListener("change", (event) => {
    const card = event.target.closest("[data-report-index]");
    if (!card) return;
    const report = reports[Number(card.dataset.reportIndex)];
    if (!report) return;
    if (event.target.matches("[data-report-status]")) report.status = event.target.value;
    if (event.target.matches("[data-report-notes]")) report.notes = event.target.value;
    saveReports(reports);
  });
  root.addEventListener("input", (event) => {
    if (!event.target.matches("[data-report-notes]")) return;
    const card = event.target.closest("[data-report-index]");
    const report = reports[Number(card?.dataset.reportIndex)];
    if (report) { report.notes = event.target.value; saveReports(reports); }
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-download]");
    if (!button || !reportDraft) return;
    const type = button.dataset.download;
    if (type === "json") download("awayu-constancia-" + reportDraft.code + ".json", JSON.stringify(reportDraft, null, 2), "application/json");
    else download("awayu-constancia-" + reportDraft.code + ".txt", reportText(reportDraft, t), "text/plain;charset=utf-8");
  });

  renderReports();
  const params = new URLSearchParams(String(location.hash).split("?")[1] || "");
  const sharedCode = params.get("s");
  if (sharedCode) {
    el(root, '[name="value"]').value = sharedCode;
    verifyDrawCode(sharedCode);
  }

  return {
    destroy() { destroyed = true; container.replaceChildren(); },
    selectTab,
  };
}
