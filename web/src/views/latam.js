import { CIRCLES, FAMILIES, L } from "../latam/circulos.js";
const REMATE_ID = "CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE"; // contrato remate en testnet (web/public/testnet.json)

const TXT = {
  title: L("Círculos de Latinoamérica", "Savings circles across Latin America", "Círculos da América Latina"),
  intro: L("En distintos lugares, las comunidades ahorran juntas con reglas propias. Elige una tarjeta para conocer una forma de organizarse y probar su dinámica.", "Across the region, communities save together under their own rules. Choose a card to learn about one arrangement and try its mechanics.", "Em diferentes lugares, comunidades poupam juntas com regras próprias. Escolha um cartão para conhecer uma forma de organização e experimentar sua dinâmica."),
  chooseFamily: L("Explorar por dinámica", "Explore by mechanic", "Explorar por dinâmica"),
  all: L("Todas", "All", "Todas"),
  selectCountry: L("Elige un país o círculo", "Choose a country or circle", "Escolha um país ou círculo"),
  howWorks: L("Así funciona", "How it works", "Como funciona"),
  frequency: L("Frecuencia común", "Common frequency", "Frequência comum"),
  order: L("Cómo se decide el orden", "How the order is decided", "Como a ordem é definida"),
  risk: L("Riesgo típico", "Typical risk", "Risco comum"),
  awayu: L("Cómo ayuda Awayu", "How Awayu can help", "Como o Awayu pode ajudar"),
  stepRot1: L("Aportan una cuota acordada", "Everyone contributes an agreed amount", "Cada pessoa contribui com um valor combinado"),
  stepRot2: L("Se define quién cobra en la ronda", "The person collecting that round is decided", "Define-se quem recebe naquela rodada"),
  stepRot3: L("Se entrega el pozo y queda una marca", "The pot is paid and a mark is recorded", "O fundo é pago e uma marca fica registrada"),
  stepAcc1: L("Los aportes se reúnen en un fondo común", "Contributions build a shared fund", "As contribuições formam um fundo comum"),
  stepAcc2: L("El grupo vota los préstamos y acuerda la devolución", "The group votes on loans and agrees on repayment", "O grupo vota os empréstimos e combina a devolução"),
  stepAcc3: L("Al final, el fondo se reparte según las reglas", "At the end, the fund is shared under the agreed rules", "No final, o fundo é dividido conforme as regras combinadas"),
  stepBid1: L("Todas las personas aportan a la ronda", "Everyone contributes to the round", "Todas as pessoas contribuem para a rodada"),
  stepBid2: L("Se comparan las ofertas de descuento", "Discount offers are compared", "As ofertas de desconto são comparadas"),
  stepBid3: L("Quien ofrece más cobra antes y recibe menos", "The highest bidder collects earlier and receives less", "Quem oferece mais recebe antes e recebe menos"),
  create: L("Crear este círculo en Stellar testnet", "Create this circle on Stellar testnet", "Criar este círculo na Stellar testnet"),
  verify: L("Comprueba un sorteo verificable", "Check a verifiable draw", "Confira um sorteio verificável"),
  ayni: L("Ver el fondo Ayni", "Explore the Ayni fund", "Ver o fundo Ayni"),
  alasitas: L("Crear una meta Alasitas", "Create an Alasitas goal", "Criar uma meta Alasitas"),
  simTitle: L("Prueba una simulación local", "Try a local simulation", "Experimente uma simulação local"),
  simLocal: L("Los cálculos ocurren en este navegador. No se envía dinero ni se escribe en Stellar.", "Calculations run in this browser. No money is sent and nothing is written to Stellar.", "Os cálculos acontecem neste navegador. Nenhum dinheiro é enviado nem há gravação na Stellar."),
  members: L("Personas", "Members", "Pessoas"),
  person: L("Persona", "Member", "Pessoa"),
  amount: L("Cuota por persona", "Contribution per person", "Contribuição por pessoa"),
  rounds: L("Rondas", "Rounds", "Rodadas"),
  missing: L("Simular que alguien no aporta", "Simulate a missed contribution", "Simular uma contribuição não paga"),
  missingRound: L("Ronda", "Round", "Rodada"),
  guarantee: L("La garantía cubre esa cuota", "The guarantee covers that contribution", "A garantia cobre essa contribuição"),
  run: L("Ejecutar simulación", "Run simulation", "Executar simulação"),
  round: L("Ronda", "Round", "Rodada"),
  collector: L("Cobra", "Collects", "Recebe"),
  pot: L("Pozo entregado", "Pot paid", "Fundo pago"),
  marks: L("Marcas de la ronda", "Round marks", "Marcas da rodada"),
  complete: L("Pozo completo", "Full pot", "Fundo completo"),
  shortPot: L("Pozo incompleto", "Pot is short", "Fundo incompleto"),
  coveredAmount: L("La garantía aportó", "Guarantee covered", "A garantia cobriu"),
  markLegend: L("Marcas Awayu: 1 a tiempo · 2 tarde · 3 faltó sin cubrir · 4 cubierto por garantía.", "Awayu marks: 1 on time · 2 late · 3 missed and uncovered · 4 covered by the guarantee.", "Marcas Awayu: 1 em dia · 2 atrasada · 3 não paga e sem cobertura · 4 coberta pela garantia."),
  monthly: L("Aporte mensual por persona", "Monthly contribution per person", "Contribuição mensal por pessoa"),
  months: L("Meses", "Months", "Meses"),
  loan: L("Préstamo votado", "Voted loan", "Empréstimo votado"),
  memberTotals: L("Totales aportados por persona (opcional)", "Total contributed per member (optional)", "Total contribuído por pessoa (opcional)"),
  memberTotalsHint: L("Un total por persona, separado por comas; usa punto para decimales.", "One total per member, separated by commas; use a period for decimals.", "Um total por pessoa, separado por vírgulas; use ponto nos decimais."),
  contributionCount: L("Escribe un total por cada persona seleccionada.", "Enter one total for each selected member.", "Informe um total para cada pessoa selecionada."),
  split: L("Reparto final", "Final distribution", "Divisão final"),
  equal: L("Partes iguales", "Equal shares", "Partes iguais"),
  proportional: L("Proporcional a los aportes", "Proportional to contributions", "Proporcional às contribuições"),
  accumulated: L("Total aportado", "Total contributed", "Total contribuído"),
  loanReturned: L("Préstamo devuelto sin intereses", "Loan repaid without interest", "Empréstimo devolvido sem juros"),
  distribution: L("Reparto por persona", "Share per member", "Divisão por pessoa"),
  auctionNote: L("Esta familia se simula en la web; todavía no hay contrato de puja en Stellar.", "This mechanic is simulated on the website; there is no Stellar bidding contract yet.", "Essa dinâmica é simulada no site; ainda não há contrato de lances na Stellar."),
  bidDiscount: L("Descuento de la oferta ganadora", "Winning bid discount", "Desconto da oferta vencedora"),
  paidEarly: L("Recibe quien cobra antes", "Early collector receives", "Quem recebe antes ganha"),
  sharedDiscount: L("Cada otra persona recibe", "Each other member receives", "Cada outra pessoa recebe"),
  implicitCost: L("Costo implícito de cobrar antes", "Implied cost of collecting early", "Custo implícito de receber antes"),
  auctionCheck: L("Cobros netos + descuentos repartidos = aportes totales", "Net payouts + shared discounts = total contributions", "Pagamentos líquidos + descontos divididos = contribuições totais"),
  noContract: L("Próximamente en contrato", "Coming to the contract", "Em breve no contrato"),
  onTestnet: L("Ver el contrato remate en testnet", "See the remate contract on testnet", "Ver o contrato remate na testnet"),
  evidence: L("Transacciones reales del remate", "Real remate transactions", "Transações reais do leilão"),
  textile: L("Tejido inspirado en", "Textile-inspired pattern", "Tecido inspirado em"),
  textileAguayo: L("aguayo", "aguayo", "aguayo"),
  textileSarape: L("sarape", "sarape", "sarape"),
  textileHuipil: L("huipil", "huipil", "huipil"),
  textileManta: L("manta andina", "Andean manta", "manta andina"),
  textileMochila: L("mochila wayuu", "Wayuu mochila", "mochila wayuu"),
  textileChita: L("chita", "chita", "chita"),
  textileMadras: L("madrás caribeño", "Caribbean madras", "madras caribenho"),
  threeD: L("El tejido y el medallón giran juntos; las monedas muestran el pozo.", "The textile and medallion rotate together; coins show the pot.", "O tecido e o medalhão giram juntos; moedas mostram o fundo."),
  noWebgl: L("La escena 3D no está disponible en este dispositivo; las fichas y simulaciones siguen funcionando.", "The 3D scene is unavailable on this device; the circle cards and simulations still work.", "A cena 3D não está disponível neste dispositivo; os cartões e as simulações continuam funcionando."),
  demoData: L("Ejemplo determinista, solo para explorar reglas", "Deterministic example for exploring the rules", "Exemplo determinístico para explorar as regras"),
};

const copy = (key, lang) => pick(TXT[key], lang);
const pick = (value, lang) => value?.[lang] ?? value?.es ?? "";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback));
const validAmount = (value) => Math.max(0.1, Number.isFinite(Number(value)) ? Number(value) : 10);
const format = (value, lang) => Number(value || 0).toLocaleString(({ es: "es-BO", en: "en-US", pt: "pt-BR", qu: "es-BO", ay: "es-BO", gn: "es-BO" })[lang] || "es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Simula rondas fijas y usa la marca 4 cuando la garantía cubre una cuota. */
export function simulateRotativo({ members = 6, amount = 10, rounds = members, missedRound = 0, guarantee = true } = {}) {
  const count = clamp(members, 2, 24, 6);
  const cuota = validAmount(amount);
  const totalRounds = clamp(rounds, 1, count, count);
  const miss = clamp(missedRound, 0, totalRounds, 0);
  const turns = Array.from({ length: totalRounds }, (_, index) => {
    const collector = index % count;
    const isMissed = index + 1 === miss;
    const missingMember = (collector + 1) % count;
    const marks = Array(count).fill(1);
    if (index % 3 === 2) marks[(collector + 2) % count] = 2;
    if (isMissed) marks[missingMember] = guarantee ? 4 : 3;
    const covered = isMissed && guarantee ? cuota : 0;
    const collected = cuota * (count - (isMissed ? 1 : 0));
    const pot = collected + covered;
    return { round: index + 1, collector, pot, collected, covered, complete: pot === cuota * count, marks };
  });
  return { members: count, amount: cuota, rounds: totalRounds, turns, totalContributed: turns.reduce((sum, turn) => sum + turn.pot, 0) };
}

/** Reintegra el préstamo sin intereses y reparte el saldo final según la regla elegida. */
export function simulateAcumulativo({ contributions, members = 6, monthly = 10, months = 6, loan = 20, split = "equal" } = {}) {
  const count = clamp(members, 2, 24, 6);
  const periodCount = clamp(months, 1, 120, 6);
  const monthlyAmount = validAmount(monthly);
  const deposits = Array.isArray(contributions) && contributions.length
    ? contributions.slice(0, 24).map((n) => Math.max(0, Number(n) || 0))
    : Array.from({ length: count }, () => monthlyAmount * periodCount);
  const totalContributed = deposits.reduce((sum, value) => sum + value, 0);
  const loanAmount = Math.min(Math.max(0, Number(loan) || 0), totalContributed);
  const finalFund = totalContributed; // el préstamo regresa al fondo y no cobra intereses
  const weights = split === "proportional" ? deposits : deposits.map(() => 1);
  const weightTotal = weights.reduce((sum, value) => sum + value, 0) || weights.length || 1;
  const shares = weights.map((weight) => Math.round(finalFund * weight / weightTotal * 100) / 100);
  if (shares.length) shares[shares.length - 1] = Math.round((finalFund - shares.slice(0, -1).reduce((sum, value) => sum + value, 0)) * 100) / 100;
  return { members: deposits.length, months: periodCount, contributions: deposits, totalContributed, loan: loanAmount, loanReturned: loanAmount, finalFund, split, shares };
}

/** Cada ronda elige la oferta mayor; el descuento se distribuye entre las demás personas. */
export function simulatePuja({ members = 6, amount = 10, rounds = members, bidsByRound } = {}) {
  const count = clamp(members, 2, 24, 6);
  const cuota = validAmount(amount);
  const totalRounds = clamp(rounds, 1, count, count);
  const remaining = Array.from({ length: count }, (_, index) => index);
  const turns = [];
  for (let index = 0; index < totalRounds && remaining.length; index++) {
    const pool = cuota * count;
    const capRate = Math.min(2, 12 / count);
    const offers = remaining.map((member) => {
      const supplied = bidsByRound?.[index]?.[member];
      const bid = Number.isFinite(Number(supplied)) ? Math.max(0, Number(supplied)) : (((member + index) % count) + 1) * capRate;
      return { member, bid, amount: Math.min(pool, Math.round(pool * bid / 100 * 100) / 100) };
    });
    offers.sort((a, b) => b.amount - a.amount || a.member - b.member);
    const winner = offers[0];
    const discount = remaining.length > 1 ? winner.amount : 0;
    turns.push({
      round: index + 1,
      winner: winner.member,
      offers,
      pool,
      discount,
      payout: pool - discount,
      eachOtherReceives: remaining.length > 1 ? discount / (count - 1) : 0,
    });
    remaining.splice(remaining.indexOf(winner.member), 1);
  }
  const totalContributed = turns.reduce((sum, turn) => sum + turn.pool, 0);
  const totalPayouts = turns.reduce((sum, turn) => sum + turn.payout, 0);
  const totalDiscounts = turns.reduce((sum, turn) => sum + turn.discount, 0);
  return { members: count, amount: cuota, turns, totalContributed, totalPayouts, totalDiscounts, totalDistributed: totalPayouts + totalDiscounts };
}

const TEXTILE_NAMES = {
  aguayo: "textileAguayo", sarape: "textileSarape", huipil: "textileHuipil", manta: "textileManta",
  mochila: "textileMochila", chita: "textileChita", madrás: "textileMadras",
};
const STEPS = {
  rotativo: [["🧺", "stepRot1"], ["🎲", "stepRot2"], ["🪙", "stepRot3"]],
  acumulativo: [["🤝", "stepAcc1"], ["🗳️", "stepAcc2"], ["🌱", "stepAcc3"]],
  puja: [["🧺", "stepBid1"], ["📣", "stepBid2"], ["🪙", "stepBid3"]],
};

const familyName = (id, lang) => pick(FAMILIES.find((item) => item.id === id)?.name, lang);
const textileName = (id, lang) => copy(TEXTILE_NAMES[id] || "textileAguayo", lang);

export function mount(root, { lang = "es", openCreate = () => {} } = {}) {
  let selected = CIRCLES[0];
  let family = "all";
  let destroyed = false;
  let scene3d = null;
  let resizeObserver = null;
  let raf = 0;
  let reducedMotion = false;
  let renderer = null;
  let threeScene = null;
  let fabricGroup = null;
  let sceneTarget = null;
  let textileMaterial = null;
  let coinGeometry = null;
  let coinMaterial = null;
  let fallingCoins = [];
  let lastTime = 0;
  const motions = [];

  root.innerHTML = '<section class="pane latam-pane"><header class="pane-h"><h1></h1><p class="latam-intro"></p></header><section class="latam-explorer"><h2 class="latam-section-title"></h2><div class="latam-family-tabs" role="group"></div><div class="latam-country-grid" aria-label=""></div><div class="latam-detail"></div></section></section>';
  const title = root.querySelector("h1");
  const intro = root.querySelector(".latam-intro");
  const sectionTitle = root.querySelector(".latam-section-title");
  const familyTabs = root.querySelector(".latam-family-tabs");
  const countryGrid = root.querySelector(".latam-country-grid");
  const detail = root.querySelector(".latam-detail");
  const loc = (key) => copy(key, lang);
  const updateSelection = () => {
    root.querySelectorAll("[data-circle]").forEach((button) => {
      const active = button.dataset.circle === selected.id;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  const renderCards = () => {
    const shown = family === "all" ? CIRCLES : CIRCLES.filter((circle) => circle.family === family);
    countryGrid.innerHTML = shown.map((circle) =>
      '<button type="button" class="latam-country-card" data-circle="' + esc(circle.id) + '" aria-pressed="' + String(circle.id === selected.id) + '">' +
      '<span class="latam-country-flag latam-flag flag-' + esc(String(circle.countryCode || '').toLowerCase()) + '" aria-hidden="true"></span><span class="latam-country-name">' + esc(pick(circle.country, lang)) + '</span>' +
      '<span class="latam-local-name">' + esc(circle.localName) + '</span><span class="latam-card-family">' + esc(familyName(circle.family, lang)) + '</span></button>'
    ).join("");
    updateSelection();
  };
  const renderTabs = () => {
    familyTabs.innerHTML = '<button type="button" class="latam-family-tab" data-family="all">' + esc(loc("all")) + '</button>' +
      FAMILIES.map((item) => '<button type="button" class="latam-family-tab" data-family="' + item.id + '">' + esc(pick(item.name, lang)) + '</button>').join("");
    familyTabs.querySelectorAll("[data-family]").forEach((button) => {
      const active = button.dataset.family === family;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  const stepsMarkup = (circle) => STEPS[circle.family].map((step, index) =>
    '<li class="latam-step" style="--step:' + index + '"><span class="latam-step-icon" aria-hidden="true">' + step[0] + '</span><span class="latam-step-number">' + (index + 1) + '</span><p>' + esc(loc(step[1])) + '</p></li>'
  ).join("");
  const simulatorMarkup = (circle) => {
    if (circle.family === "rotativo") {
      return '<section class="latam-simulator"><div class="latam-sim-heading"><h3>' + esc(loc("simTitle")) + '</h3><span>' + esc(loc("demoData")) + '</span></div><p>' + esc(loc("simLocal")) + '</p>' +
        '<div class="latam-sim-controls"><label>' + esc(loc("members")) + ' <input class="sim-members" type="number" min="2" max="24" value="6"></label>' +
        '<label>' + esc(loc("amount")) + ' (USDC) <input class="sim-amount" type="number" min="0.1" step="0.1" value="10"></label>' +
        '<label>' + esc(loc("rounds")) + ' <input class="sim-rounds" type="number" min="1" max="6" value="6"></label></div>' +
        '<label class="latam-check"><input class="sim-missing" type="checkbox" checked> ' + esc(loc("missing")) + '</label>' +
        '<label>' + esc(loc("missingRound")) + ' <select class="sim-missing-round"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></label> ' +
        '<label class="latam-check"><input class="sim-guarantee" type="checkbox" checked> ' + esc(loc("guarantee")) + '</label> ' +
        '<button type="button" class="btn primary sim-run">' + esc(loc("run")) + '</button><div class="latam-sim-output" aria-live="polite"></div></section>';
    }
    if (circle.family === "acumulativo") {
      return '<section class="latam-simulator"><div class="latam-sim-heading"><h3>' + esc(loc("simTitle")) + '</h3><span>' + esc(loc("demoData")) + '</span></div><p>' + esc(loc("simLocal")) + '</p>' +
        '<div class="latam-sim-controls"><label>' + esc(loc("members")) + ' <input class="sim-members" type="number" min="2" max="24" value="6"></label>' +
        '<label>' + esc(loc("monthly")) + ' (USDC) <input class="sim-amount" type="number" min="0.1" step="0.1" value="10"></label>' +
        '<label>' + esc(loc("months")) + ' <input class="sim-months" type="number" min="1" max="120" value="6"></label>' +
        '<label>' + esc(loc("loan")) + ' (USDC) <input class="sim-loan" type="number" min="0" step="0.1" value="20"></label>' +
        '<label class="sim-totals-label">' + esc(loc("memberTotals")) + ' <input class="sim-contributions" type="text" inputmode="decimal" placeholder="60, 60, 30" aria-label="' + esc(loc("memberTotalsHint")) + '"></label>' +
        '<label>' + esc(loc("split")) + ' <select class="sim-split"><option value="equal">' + esc(loc("equal")) + '</option><option value="proportional">' + esc(loc("proportional")) + '</option></select></label></div>' +
        '<button type="button" class="btn primary sim-run">' + esc(loc("run")) + '</button><div class="latam-sim-output" aria-live="polite"></div></section>';
    }
    return '<section class="latam-simulator"><div class="latam-sim-heading"><h3>' + esc(loc("simTitle")) + '</h3><span>' + esc(loc("demoData")) + '</span></div><p>' + esc(loc("simLocal")) + '</p>' +
      '<div class="latam-sim-controls"><label>' + esc(loc("members")) + ' <input class="sim-members" type="number" min="2" max="24" value="6"></label>' +
      '<label>' + esc(loc("amount")) + ' (USDC) <input class="sim-amount" type="number" min="0.1" step="0.1" value="10"></label></div>' +
      '<p class="latam-contract-note"><strong>' + esc(loc("noContract")) + ':</strong> ' + esc(loc("auctionNote")) + '</p>' +
      '<button type="button" class="btn primary sim-run">' + esc(loc("run")) + '</button><div class="latam-sim-output" aria-live="polite"></div></section>';
  };
  const makePreset = (circle) => {
    const territory = pick(circle.country, lang);
    const frequency = circle.frequency.es.toLowerCase();
    const periodSeconds = /semanal|semana/.test(frequency) ? 604800
      : /quincenal|quincena/.test(frequency) ? 1209600 : 2592000;
    return { cname: ("Tanda de " + territory).slice(0, 40), amount: 10, periodSeconds, tokenChoice: "usdc", region: circle.countryCode === "BO" ? "cbba" : "otro", countryCode: circle.countryCode };
  };
  const renderDetail = () => {
    const steps = stepsMarkup(selected);
    const rotative = selected.family === "rotativo";
    const accumulative = selected.family === "acumulativo";
    const patternText = loc(TEXTILE_NAMES[selected.textile] || "textileAguayo");
    detail.innerHTML = '<article class="latam-profile">' +
      '<header class="latam-profile-head"><span class="latam-profile-flag latam-flag flag-' + esc(String(selected.countryCode || '').toLowerCase()) + '" aria-hidden="true"></span><div><p class="latam-eyebrow">' + esc(pick(selected.country, lang)) + ' · ' + esc(familyName(selected.family, lang)) + '</p><h2>' + esc(selected.localName) + '</h2></div></header>' +
      '<p class="latam-frequency"><strong>' + esc(loc("frequency")) + ':</strong> ' + esc(pick(selected.frequency, lang)) + '</p>' +
      '<div class="latam-facts"><section><h3>' + esc(loc("order")) + '</h3><p>' + esc(pick(selected.order, lang)) + '</p></section>' +
      '<section><h3>' + esc(loc("risk")) + '</h3><p>' + esc(pick(selected.risk, lang)) + '</p></section>' +
      '<section class="latam-awayu"><h3>' + esc(loc("awayu")) + '</h3><p>' + esc(pick(selected.awayu, lang)) + '</p></section></div>' +
      '<section class="latam-how"><h3>' + esc(loc("howWorks")) + '</h3><ol>' + steps + '</ol></section>' +
      '<section class="latam-scene-card"><div class="latam-scene-copy"><h3>' + esc(loc("textile")) + ' ' + esc(patternText) + '</h3><p>' + esc(loc("threeD")) + '</p></div><div class="latam-scene-stage" aria-label="' + esc(loc("textile") + " " + patternText) + '"><p class="latam-scene-fallback">' + esc(loc("noWebgl")) + '</p></div></section>' +
      '<div class="latam-actions">' +
      (rotative ? '<button type="button" class="btn primary latam-create">' + esc(loc("create")) + '</button>' : "") +
      (accumulative ? '<a class="btn" href="#/ayni">' + esc(loc("ayni")) + '</a><a class="btn" href="#/alasitas">' + esc(loc("alasitas")) + '</a>' : "") +
      (!rotative && !accumulative ? '<a class="btn" href="https://stellar.expert/explorer/testnet/contract/' + REMATE_ID + '" target="_blank" rel="noopener">' + esc(loc("onTestnet")) + ' ↗</a><a class="btn ghost" href="https://github.com/luis19998/awayu-stellar/blob/main/docs/EVIDENCIA-CONTRATOS-NUEVOS.md" target="_blank" rel="noopener">' + esc(loc("evidence")) + ' ↗</a>' : "") +
      '<a class="btn" href="#/verificar">' + esc(loc("verify")) + '</a></div>' +
      simulatorMarkup(selected) + '</article>';
    const create = detail.querySelector(".latam-create");
    if (create) create.onclick = () => openCreate(makePreset(selected));
    const sceneBox = detail.querySelector(".latam-scene-stage");
    scene3d?.update(selected, sceneBox);
    bindSimulator(selected.family);
    runSimulation(false);
  };
  const render = () => {
    title.textContent = loc("title");
    intro.textContent = loc("intro");
    sectionTitle.textContent = loc("selectCountry");
    countryGrid.setAttribute("aria-label", loc("selectCountry"));
    renderTabs();
    renderCards();
    renderDetail();
  };
  const bindSimulator = (kind) => {
    const button = detail.querySelector(".sim-run");
    if (button) button.onclick = () => runSimulation(true);
    const countInput = detail.querySelector(".sim-members");
    const roundInput = detail.querySelector(".sim-rounds");
    if (countInput && roundInput) {
      countInput.addEventListener("change", () => { roundInput.max = countInput.value; if (+roundInput.value > +countInput.value) roundInput.value = countInput.value; });
    }
    const missingRound = detail.querySelector(".sim-missing-round");
    if (missingRound && roundInput) roundInput.addEventListener("change", () => { missingRound.max = roundInput.value; if (+missingRound.value > +roundInput.value) missingRound.value = roundInput.value; });
    void kind;
  };
  const runSimulation = (animateCoins) => {
    const output = detail.querySelector(".latam-sim-output");
    if (!output) return;
    const members = Number(detail.querySelector(".sim-members")?.value || 6);
    const amount = Number(detail.querySelector(".sim-amount")?.value || 10);
    let result = "";
    if (selected.family === "rotativo") {
      const rounds = Number(detail.querySelector(".sim-rounds")?.value || members);
      const missed = detail.querySelector(".sim-missing")?.checked ? Number(detail.querySelector(".sim-missing-round")?.value || 0) : 0;
      const simulation = simulateRotativo({ members, amount, rounds, missedRound: missed, guarantee: detail.querySelector(".sim-guarantee")?.checked });
      result = '<p class="latam-sim-summary">' + simulation.turns.filter((turn) => turn.complete).length + '/' + simulation.turns.length + ' · ' + esc(loc("complete")) + '</p><div class="latam-table-wrap"><table><thead><tr><th>' + esc(loc("round")) + '</th><th>' + esc(loc("collector")) + '</th><th>' + esc(loc("pot")) + '</th><th>' + esc(loc("marks")) + '</th></tr></thead><tbody>' +
        simulation.turns.map((turn) => '<tr><td>' + turn.round + '</td><td>' + esc(loc("person")) + ' ' + (turn.collector + 1) + '</td><td>' + format(turn.pot, lang) + ' / ' + format(simulation.amount * simulation.members, lang) + '</td><td>' + turn.marks.map((mark, memberIndex) => '<i class="latam-mark mark-' + mark + '" aria-label="' + esc(loc("person")) + ' ' + (memberIndex + 1) + ': ' + mark + '" title="' + esc(loc("person")) + ' ' + (memberIndex + 1) + ': ' + mark + '">' + mark + '</i>').join("") + '</td></tr>').join("") +
        '</tbody></table></div><p>' + esc(loc(missed ? (detail.querySelector(".sim-guarantee")?.checked ? "coveredAmount" : "shortPot") : "complete")) + (missed && detail.querySelector(".sim-guarantee")?.checked ? ': ' + format(simulation.amount, lang) + ' USDC' : "") + '</p><p class="latam-mark-legend">' + esc(loc("markLegend")) + '</p>';
    } else if (selected.family === "acumulativo") {
      const customTotals = detail.querySelector(".sim-contributions")?.value.trim();
      const contributions = customTotals ? customTotals.split(/[,\s;]+/).map(Number).filter(Number.isFinite) : undefined;
      if (contributions && contributions.length !== clamp(members, 2, 24, 6)) {
        output.innerHTML = '<p role="alert">' + esc(loc("contributionCount")) + '</p>';
        return;
      }
      const simulation = simulateAcumulativo({
        members, monthly: amount, months: Number(detail.querySelector(".sim-months")?.value || 6),
        loan: Number(detail.querySelector(".sim-loan")?.value || 0), split: detail.querySelector(".sim-split")?.value, contributions,
      });
      result = '<p>' + esc(loc("accumulated")) + ': <strong>' + format(simulation.totalContributed, lang) + ' USDC</strong></p>' +
        '<p>' + esc(loc("loanReturned")) + ': ' + format(simulation.loanReturned, lang) + ' USDC</p><h4>' + esc(loc("distribution")) + '</h4><ul class="latam-share-list">' +
        simulation.shares.map((share, index) => '<li>' + esc(loc("members")) + ' ' + (index + 1) + '<strong>' + format(share, lang) + ' USDC</strong></li>').join("") + '</ul>';
    } else {
      const simulation = simulatePuja({ members, amount });
      result = '<p>' + esc(loc("auctionCheck")) + ': <strong>' + format(simulation.totalPayouts, lang) + ' + ' + format(simulation.totalDiscounts, lang) + ' = ' + format(simulation.totalContributed, lang) + ' USDC</strong></p><div class="latam-table-wrap"><table><thead><tr><th>' + esc(loc("round")) + '</th><th>' + esc(loc("collector")) + '</th><th>' + esc(loc("bidDiscount")) + '</th><th>' + esc(loc("paidEarly")) + '</th><th>' + esc(loc("sharedDiscount")) + '</th></tr></thead><tbody>' +
        simulation.turns.map((turn) => '<tr><td>' + turn.round + '</td><td>' + esc(loc("members")) + ' ' + (turn.winner + 1) + '</td><td>' + format(turn.discount, lang) + ' USDC</td><td>' + format(turn.payout, lang) + ' USDC</td><td>' + format(turn.eachOtherReceives, lang) + ' USDC</td></tr>').join("") +
        '</tbody></table></div><p>' + esc(loc("implicitCost")) + ': <strong>' + format(simulation.totalDiscounts, lang) + ' USDC</strong></p>';
    }
    output.innerHTML = result;
    if (animateCoins) scene3d?.dropCoins();
  };

  familyTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-family]");
    if (!button) return;
    family = button.dataset.family;
    if (family !== "all" && selected.family !== family) selected = CIRCLES.find((circle) => circle.family === family) || selected;
    renderTabs();
    renderCards();
    renderDetail();
  });
  countryGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-circle]");
    if (!button) return;
    selected = CIRCLES.find((circle) => circle.id === button.dataset.circle) || CIRCLES[0];
    updateSelection();
    renderDetail();
  });
  render();
  initializeScene(detail.querySelector(".latam-scene-stage"));

  function initializeScene(initialBox) {
    reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    import("three").then((THREE) => {
      if (destroyed) return;
      try {
        sceneTarget = detail.querySelector(".latam-scene-stage") || initialBox;
        const target = sceneTarget;
        const scene = new THREE.Scene();
        scene.background = null;
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
        camera.position.set(0, 0.9, 4.6);
        camera.lookAt(0, -0.15, 0);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        target.appendChild(renderer.domElement);
        threeScene = scene;
        scene.add(new THREE.HemisphereLight(0xfff3d0, 0x29213c, 2.1));
        const key = new THREE.DirectionalLight(0xffdda0, 2.6);
        key.position.set(-2, 3, 4);
        scene.add(key);
        const fill = new THREE.PointLight(0x77d6d2, 1.3, 12);
        fill.position.set(2, 0.5, 3);
        scene.add(fill);
        fabricGroup = new THREE.Group();
        scene.add(fabricGroup);
        const geometry = new THREE.CylinderGeometry(1.15, 1.15, 0.62, 72, 1, true);
        const texture = new THREE.CanvasTexture(makePatternTexture(selected.textile));
        texture.colorSpace = THREE.SRGBColorSpace;
        textileMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.78, side: THREE.DoubleSide });
        const fabric = new THREE.Mesh(geometry, textileMaterial);
        fabric.rotation.y = Math.PI / 2;
        fabricGroup.add(fabric);
        const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 48), new THREE.MeshStandardMaterial({ color: 0xe5b74d, metalness: 0.62, roughness: 0.29 }));
        medal.position.y = 0.65;
        fabricGroup.add(medal);
        const medallionRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 36), new THREE.MeshStandardMaterial({ color: 0xffeb9b, metalness: 0.55, roughness: 0.28 }));
        medallionRim.position.y = 0.72;
        fabricGroup.add(medallionRim);
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.43, 0.36, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0x46636b, metalness: 0.38, roughness: 0.45, side: THREE.DoubleSide }));
        bowl.position.y = -1.0;
        scene.add(bowl);
        const bowlRing = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.035, 8, 36), new THREE.MeshStandardMaterial({ color: 0xd8ad50, metalness: 0.62, roughness: 0.32 }));
        bowlRing.rotation.x = Math.PI / 2;
        bowlRing.position.y = -0.82;
        scene.add(bowlRing);
        coinGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.035, 24);
        coinMaterial = new THREE.MeshStandardMaterial({ color: 0xf2c85b, metalness: 0.72, roughness: 0.24 });
        const resize = () => {
          if (!renderer) return;
          const width = Math.max(180, sceneTarget?.clientWidth || 480);
          const height = Math.max(160, sceneTarget?.clientHeight || 240);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
        resizeObserver?.observe(target);
        if (!resizeObserver) window.addEventListener("resize", resize);
        motions.push(() => window.removeEventListener("resize", resize));
        resize();
        scene3d = {
          update: (circle, box) => {
            if (!renderer || destroyed) return;
            if (box && box !== sceneTarget) {
              resizeObserver?.unobserve(sceneTarget);
              sceneTarget = box;
              resizeObserver?.observe(box);
            }
            const canvas = makePatternTexture(circle.textile);
            textileMaterial.map?.dispose();
            textileMaterial.map = new THREE.CanvasTexture(canvas);
            textileMaterial.map.colorSpace = THREE.SRGBColorSpace;
            textileMaterial.needsUpdate = true;
            if (box && renderer.domElement.parentElement !== box) box.appendChild(renderer.domElement);
            resize();
          },
          dropCoins: () => {
            if (!renderer || destroyed) return;
            for (let index = 0; index < 7; index++) {
              const coin = new THREE.Mesh(coinGeometry, coinMaterial);
              coin.position.set((index - 3) * 0.18, reducedMotion ? -0.7 : 1.9 + index * 0.18, 0.25);
              coin.rotation.x = Math.PI / 2;
              scene.add(coin);
              fallingCoins.push({ mesh: coin, delay: index * 0.075, elapsed: 0 });
            }
            renderer.render(scene, camera);
          },
        };
        if (!reducedMotion) {
          const tick = (time) => {
            if (destroyed || !renderer) return;
            const delta = Math.min(0.05, (time - (lastTime || time)) / 1000);
            lastTime = time;
            if (fabricGroup) fabricGroup.rotation.y += delta * 0.34;
            fallingCoins = fallingCoins.filter((coin) => {
              coin.elapsed += delta;
              if (coin.elapsed < coin.delay) return true;
              coin.mesh.position.y -= delta * 3.1;
              coin.mesh.rotation.y += delta * 4;
              if (coin.mesh.position.y < -0.72) {
                scene.remove(coin.mesh);
                return false;
              }
              return true;
            });
            renderer.render(scene, camera);
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
        scene3d.update(selected, target);
        target.querySelector(".latam-scene-fallback")?.remove();
      } catch {
        renderer?.forceContextLoss?.();
        renderer?.dispose?.();
        renderer?.domElement?.remove();
        renderer = null;
      }
    }).catch(() => {});
  }

  function makePatternTexture(kind) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const palettes = {
      aguayo: ["#b83930", "#e9b548", "#253e5b", "#e5d8b4", "#608a76"],
      sarape: ["#ed3c36", "#ffbd32", "#16a7a0", "#733a91", "#f6e34e"],
      huipil: ["#8f2432", "#f0c355", "#236b62", "#efe1c4"],
      manta: ["#4d6375", "#c4a56c", "#eee2c6", "#9e493e"],
      mochila: ["#d7a64e", "#a53a32", "#234957", "#f1dfbb"],
      chita: ["#315e48", "#e6d7b5", "#d84a3f", "#e8ba48", "#7296b5"],
      madrás: ["#b6333c", "#f0bd49", "#245b72", "#e8e1c7"],
    };
    const colors = palettes[kind] || palettes.aguayo;
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 512, 256);
    if (kind === "sarape") {
      for (let x = 0; x < 512; x += 38) {
        ctx.fillStyle = colors[Math.floor(x / 38) % colors.length];
        ctx.fillRect(x, 0, 22, 256);
      }
      for (let y = 0; y < 256; y += 20) { ctx.fillStyle = "#fff7d055"; ctx.fillRect(0, y, 512, 3); }
    } else if (kind === "huipil" || kind === "mochila") {
      ctx.strokeStyle = colors[1];
      ctx.lineWidth = 5;
      for (let x = -256; x < 768; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 256, 128); ctx.lineTo(x, 256); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 32, 0); ctx.lineTo(x + 288, 128); ctx.lineTo(x + 32, 256); ctx.stroke();
      }
      ctx.strokeStyle = colors[2];
      ctx.lineWidth = 3;
      for (let y = 0; y < 256; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    } else if (kind === "manta") {
      for (let x = -256; x < 768; x += 52) {
        ctx.fillStyle = colors[(Math.floor((x + 256) / 52)) % colors.length];
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 34, 0); ctx.lineTo(x + 290, 256); ctx.lineTo(x + 256, 256); ctx.fill();
      }
      ctx.fillStyle = "#f4e8c4";
      ctx.fillRect(0, 18, 512, 8); ctx.fillRect(0, 230, 512, 8);
    } else if (kind === "chita") {
      ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, 512, 256);
      for (let x = 32; x < 512; x += 86) for (let y = 30; y < 256; y += 82) {
        ctx.fillStyle = colors[2];
        for (let petal = 0; petal < 6; petal++) {
          const a = petal * Math.PI / 3;
          ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 13, y + Math.sin(a) * 13, 8, 13, a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = colors[3]; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === "madrás") {
      for (let y = 0; y < 256; y += 48) {
        ctx.fillStyle = colors[Math.floor(y / 48) % colors.length];
        ctx.fillRect(0, y, 512, 24);
      }
      for (let x = 0; x < 512; x += 48) {
        ctx.fillStyle = colors[(Math.floor(x / 48) + 1) % colors.length] + "99";
        ctx.fillRect(x, 0, 23, 256);
      }
    } else {
      for (let y = 0; y < 256; y += 32) {
        ctx.fillStyle = colors[(y / 32) % colors.length];
        ctx.fillRect(0, y, 512, 18);
      }
      for (let y = 10; y < 256; y += 64) {
        ctx.strokeStyle = "#f9e7bd";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }
    }
    return canvas;
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      motions.forEach((dispose) => dispose());
      if (threeScene) {
        threeScene.traverse((object) => {
          object.geometry?.dispose?.();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material) => {
            material.map?.dispose?.();
            material.dispose?.();
          });
        });
        fallingCoins = [];
      }
      renderer?.dispose?.();
      renderer?.forceContextLoss?.();
      renderer?.domElement?.remove();
      renderer = null;
      threeScene = null;
      textileMaterial = null;
      coinGeometry = null;
      coinMaterial = null;
      scene3d = null;
    },
  };
}
