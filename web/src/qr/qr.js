// Códigos QR de Awayu: invitar a un círculo, recibir pagos con el estándar
// SEP-7 de Stellar (web+stellar:pay), escanear con la cámara y recargar con el
// QR de un banco boliviano a través de las rampas de Pollar (bolivianos → USDC).
import qrcode from "qrcode-generator";
import "./qr.css";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
// USDC de prueba emitido por Circle en testnet
export const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const pick = (o, l) => o[l] ?? o.es;
const T = {
  close: { es: "Cerrar", en: "Close", pt: "Fechar", qu: "Wichq'ay", ay: "Jist'antaña", gn: "Mboty" },
  copy: { es: "Copiar", en: "Copy", pt: "Copiar", qu: "Copiay", ay: "Copiaña", gn: "Kopia" },
  copied: { es: "Copiado", en: "Copied", pt: "Copiado", qu: "Copiasqa", ay: "Copiatawa", gn: "Kopiapyre" },
  share: { es: "Compartir", en: "Share", pt: "Compartilhar", qu: "Rakinakuy", ay: "Churaña", gn: "Mosarambi" },
  download: { es: "Descargar imagen", en: "Download image", pt: "Baixar imagem", qu: "Siq'ita uraykachiy", ay: "Uñacht'äwi apaqaña", gn: "Mboja'o mboguejy" },
  openWallet: { es: "Abrir en mi billetera", en: "Open in my wallet", pt: "Abrir na minha carteira", qu: "Qullqi wayaqaypi kichay", ay: "Qullqi wayaqajan jist'araña", gn: "Embojuruja che viru ryrúpe" },
  invite: { es: "Invitar con QR", en: "Invite with QR", pt: "Convidar com QR", qu: "QR nisqawan invitay", ay: "QR ukamp jawsaña", gn: "Eguerohenói QR rupive" },
  inviteLead: { es: "Quien escanee este código abre el círculo en su celular y puede verificar las reglas antes de unirse.", en: "Whoever scans this code opens the circle on their phone and can check the rules before joining.", pt: "Quem escanear este código abre o círculo no celular e pode conferir as regras antes de entrar.", qu: "Kay QR-ta qhawaq runa muyuta celularninpi kichan, manaraq yaykuspa kamachikuykunata qhawanmanpas.", ay: "Aka QR uñjiri jaqixa muyu celularapan jist'araspa, janïr mantkasin kamachinak uñjaspa.", gn: "Oescaneáva ko QR oipe'a pe círculo ipumbyrýpe ha ohecha umi tekorã oike mboyve." },
  receive: { es: "Recibir con QR", en: "Receive with QR", pt: "Receber com QR", qu: "QR nisqawan chaskiy", ay: "QR ukamp katuqaña", gn: "Ehupyty QR rupive" },
  receiveLead: { es: "Muestra este código: cualquier billetera Stellar compatible con SEP-7 (por ejemplo LOBSTR) lo escanea y te envía el pago.", en: "Show this code: any Stellar wallet that supports SEP-7 (for example LOBSTR) scans it and sends you the payment.", pt: "Mostre este código: qualquer carteira Stellar compatível com SEP-7 (por exemplo LOBSTR) o escaneia e envia o pagamento.", qu: "Kay QR-ta rikuchiy: SEP-7 nisqawan llamk'aq Stellar qullqi wayaqa (LOBSTR hina) qhawaspa qullqita kachamusunki.", ay: "Aka QR uñacht'ayma: SEP-7 apnaqir Stellar qullqi wayaqa (LOBSTR ukham) uñjasaw qullqi apayanmätam.", gn: "Ehechauka ko QR: oimeraẽ viru ryru Stellar SEP-7 reheguáva (LOBSTR ramo) ohecha ha omondo ndéve pe viru." },
  amount: { es: "Monto (opcional)", en: "Amount (optional)", pt: "Valor (opcional)", qu: "Qullqi (munaspaqa)", ay: "Qullqi (munasax)", gn: "Mboy (ndaha'éi tekotevẽ)" },
  asset: { es: "Moneda", en: "Asset", pt: "Moeda", qu: "Qullqi laya", ay: "Qullqi kasta", gn: "Viru" },
  noAddress: { es: "Conecta tu billetera para generar tu QR de cobro.", en: "Connect your wallet to create your payment QR.", pt: "Conecte sua carteira para gerar seu QR de cobrança.", qu: "Qullqi wayaqaykita tinkiy QR-ykita ruranaykipaq.", ay: "Qullqi wayaqam chikt'ayam QR lurañataki.", gn: "Embojoaju nde viru ryru rejapo hag̃ua nde QR." },
  scan: { es: "Escanear QR", en: "Scan QR", pt: "Escanear QR", qu: "QR qhaway", ay: "QR uñjaña", gn: "Ehecha QR" },
  scanLead: { es: "Apunta la cámara a un QR de Awayu, a un pedido de pago de Stellar o a una dirección.", en: "Point the camera at an Awayu QR, a Stellar payment request or an address.", pt: "Aponte a câmera para um QR do Awayu, um pedido de pagamento Stellar ou um endereço.", qu: "Kamarata Awayu QR-man, Stellar mañakuyman utaq direccionman churay.", ay: "Cámara Awayu QR-ru, Stellar mayiwiru jan ukax direccionaru uñtayma.", gn: "Ehechauka cámara peteĩ Awayu QR, peteĩ Stellar pagorã jerure térã peteĩ dirección-pe." },
  scanPhoto: { es: "O elige una foto del QR", en: "Or pick a photo of the QR", pt: "Ou escolha uma foto do QR", qu: "Utaq QR siq'ita akllay", ay: "Jan ukax QR jamuq ajlliña", gn: "Térã eiporavo peteĩ ta'anga QR rehegua" },
  noScanner: { es: "Este navegador no puede leer QR. Usa la cámara de tu celular: el código abre Awayu o tu billetera directamente.", en: "This browser can't read QR codes. Use your phone camera: the code opens Awayu or your wallet directly.", pt: "Este navegador não lê QR. Use a câmera do celular: o código abre o Awayu ou sua carteira diretamente.", qu: "Kay navegadorqa mana QR-ta ñawinchayta atinchu. Celularniykiq kamaranwan qhaway.", ay: "Aka navegadorax janiw QR liyt'irjamäkiti. Celularaman cámarapampi uñjma.", gn: "Ko navegador ndaikatúi omoñe'ẽ QR. Eipuru nde pumbyry cámara." },
  found: { es: "Código leído", en: "Code read", pt: "Código lido", qu: "QR ñawinchasqa", ay: "QR liyt'ata", gn: "QR ojelee" },
  payReq: { es: "Pedido de pago", en: "Payment request", pt: "Pedido de pagamento", qu: "Qullqi mañakuy", ay: "Qullqi mayiwi", gn: "Pagorã jerure" },
  address: { es: "Dirección de Stellar", en: "Stellar address", pt: "Endereço Stellar", qu: "Stellar direccion", ay: "Stellar direccion", gn: "Stellar dirección" },
  openCircle: { es: "Abrir el círculo", en: "Open the circle", pt: "Abrir o círculo", qu: "Muyuta kichay", ay: "Muyu jist'araña", gn: "Embojuruja círculo" },
  bank: { es: "Recargar con el QR de tu banco", en: "Top up with your bank's QR", pt: "Recarregar com o QR do seu banco", qu: "Bancoykiq QR-ninwan yapay", ay: "Bancoman QR-pampi yapxataña", gn: "Emyenyhẽ nde banco QR rupive" },
  bankLead: { es: "Pagas en bolivianos con el QR interoperable de cualquier banco o billetera móvil de Bolivia y recibes dólares digitales (USDC) en tu billetera, a través de un proveedor autorizado conectado con Pollar.", en: "You pay in bolivianos with the interoperable QR of any Bolivian bank or mobile wallet and receive digital dollars (USDC) in your wallet, through a licensed provider connected via Pollar.", pt: "Você paga em bolivianos com o QR interoperável de qualquer banco ou carteira móvel da Bolívia e recebe dólares digitais (USDC) na sua carteira, por meio de um provedor autorizado conectado ao Pollar.", qu: "Bolivia mayqin bancopa QR-ninwan bolivianospi qullqichanki, USDC dólares digitalesta chaskinki Pollar-wan tinkisqa proveedorniqta.", ay: "Bolivia bancon QR-pampiw bolivianonakan payllta, USDC digital dolaranak katuqta Pollar-amp chikt'at proveedor tuqi.", gn: "Rehepyme'ẽ bolivianos-pe oimeraẽ Bolivia banco QR rupive ha rehupyty USDC nde viru ryrúpe, peteĩ proveedor Pollar ndive." },
  bankSteps: {
    es: ["Escribe cuánto quieres cargar en bolivianos y mira la cotización.", "El proveedor genera un QR de cobro: escanéalo con la app de tu banco y paga.", "Al confirmarse el pago, el proveedor envía los USDC a tu billetera de Awayu."],
    en: ["Enter how much to load in bolivianos and see the quote.", "The provider creates a payment QR: scan it with your bank app and pay.", "Once the payment clears, the provider sends the USDC to your Awayu wallet."],
    pt: ["Digite quanto quer carregar em bolivianos e veja a cotação.", "O provedor gera um QR de cobrança: escaneie com o app do seu banco e pague.", "Confirmado o pagamento, o provedor envia os USDC para sua carteira do Awayu."],
  },
  bankLive: { es: "Rutas disponibles con tu configuración de Pollar:", en: "Routes available with your Pollar setup:", pt: "Rotas disponíveis com sua configuração do Pollar:", qu: "Pollar-wan kaq ñankuna:", ay: "Pollar-amp utjir thakinaka:", gn: "Tape oĩva Pollar ndive:" },
  bankOff: { es: "Esta demostración aún no tiene una rampa en bolivianos activada. Para usarla de verdad, la organización activa el proveedor Stereum (compra con QR bancario en BOB) en su panel de Pollar y la verificación de identidad que exige la normativa. Mientras tanto, nada se cobra.", en: "This demo doesn't have a boliviano ramp enabled yet. To use it for real, the organization enables the Stereum provider (buy with a bank QR in BOB) in its Pollar dashboard plus the identity check required by regulation. Meanwhile, nothing is charged.", pt: "Esta demonstração ainda não tem uma rampa em bolivianos ativada. Para usar de verdade, a organização ativa o provedor Stereum (compra com QR bancário em BOB) no painel do Pollar e a verificação de identidade exigida pela regulação. Enquanto isso, nada é cobrado." },
  bankLegal: { es: "El QR interoperable lo regula el Banco Central de Bolivia; la compra de activos virtuales se hace solo mediante proveedores y canales autorizados.", en: "The interoperable QR is regulated by the Central Bank of Bolivia; virtual assets are bought only through authorized providers and channels.", pt: "O QR interoperável é regulado pelo Banco Central da Bolívia; ativos virtuais só são comprados por provedores e canais autorizados." },
};

/** SVG del QR (corrección de errores M), con zona blanca alrededor. */
export function qrSvg(text, { cell = 6, margin = 4 } = {}) {
  const q = qrcode(0, "M");
  q.addData(text, "Byte");
  q.make();
  const n = q.getModuleCount();
  const size = (n + margin * 2) * cell;
  let path = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${(c + margin) * cell} ${(r + margin) * cell}h${cell}v${cell}h-${cell}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#1b1030"/></svg>`;
}

/** URI SEP-7 para pedir un pago (web+stellar:pay). */
export function sep7Pay({ destination, amount, assetCode, assetIssuer, memo, msg, testnet = true } = {}) {
  if (!/^G[A-Z2-7]{55}$/.test(destination || "")) throw new Error("Dirección de destino inválida");
  const p = new URLSearchParams({ destination });
  if (amount && Number(amount) > 0) p.set("amount", String(Number(amount)));
  if (assetCode && assetCode !== "XLM") { p.set("asset_code", assetCode); p.set("asset_issuer", assetIssuer); }
  if (memo) { p.set("memo", memo.slice(0, 28)); p.set("memo_type", "MEMO_TEXT"); }
  if (msg) p.set("msg", msg.slice(0, 300));
  if (testnet) p.set("network_passphrase", TESTNET_PASSPHRASE);
  return `web+stellar:pay?${p.toString().replace(/\+/g, "%20")}`;
}

/** Interpreta lo que se escaneó: invitación de Awayu, pedido SEP-7, dirección o texto. */
export function parseScanned(text) {
  const s = String(text || "").trim();
  if (/^web\+stellar:(pay|tx)\?/i.test(s)) {
    const [op, query] = s.slice("web+stellar:".length).split("?");
    const p = new URLSearchParams(query);
    return { kind: "sep7", op, uri: s, destination: p.get("destination"), amount: p.get("amount"), asset: p.get("asset_code") || "XLM", msg: p.get("msg") };
  }
  if (/^G[A-Z2-7]{55}$/.test(s)) return { kind: "address", address: s };
  try {
    const u = new URL(s);
    const c = u.searchParams.get("c");
    if (c && /^C[A-Z2-7]{55}$/.test(c)) return { kind: "circle", contractId: c, url: s };
  } catch { /* no es una URL */ }
  return { kind: "text", text: s };
}

export function inviteUrl(contractId, origin = location.origin) {
  return contractId ? `${origin}/?c=${encodeURIComponent(contractId)}#/circulo` : `${origin}/#/circulo`;
}

// ---------------- diálogo genérico ----------------
function dialog(lang, title, lead) {
  const d = document.createElement("dialog");
  d.className = "aw-qr";
  d.innerHTML = `<form method="dialog"><h2></h2><p class="aw-qr-lead"></p><div class="aw-qr-body"></div><menu><button value="close" class="ghost"></button></menu></form>`;
  d.querySelector("h2").textContent = title;
  d.querySelector(".aw-qr-lead").textContent = lead;
  d.querySelector("menu button").textContent = pick(T.close, lang);
  d.addEventListener("close", () => { d.dispatchEvent(new Event("aw-qr-closed")); d.remove(); });
  document.body.append(d);
  d.showModal();
  return { d, body: d.querySelector(".aw-qr-body"), menu: d.querySelector("menu") };
}

function button(label, onClick, cls = "ghost") {
  const b = document.createElement("button");
  b.type = "button"; b.className = cls; b.textContent = label; b.onclick = onClick;
  return b;
}

function qrBlock(body, text, lang, { link } = {}) {
  const box = document.createElement("div");
  box.className = "aw-qr-code";
  box.innerHTML = qrSvg(text);
  const code = document.createElement("code");
  code.textContent = text;
  const row = document.createElement("div");
  row.className = "aw-qr-actions";
  const copyBtn = button(pick(T.copy, lang), async () => {
    try { await navigator.clipboard.writeText(text); copyBtn.textContent = pick(T.copied, lang); } catch { /* sin portapapeles */ }
  });
  row.append(copyBtn);
  if (navigator.share) row.append(button(pick(T.share, lang), () => navigator.share({ text, url: link || undefined }).catch(() => {})));
  row.append(button(pick(T.download, lang), () => downloadPng(box.querySelector("svg"), "awayu-qr.png")));
  body.replaceChildren(box, code, row);
}

function downloadPng(svg, name) {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = c.height = 720;
    c.getContext("2d").drawImage(img, 0, 0, 720, 720);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = name; a.click();
  };
  img.src = url;
}

// ---------------- acciones ----------------
export function openInvite(contractId, lang = "es") {
  const { body } = dialog(lang, pick(T.invite, lang), pick(T.inviteLead, lang));
  const url = inviteUrl(contractId);
  qrBlock(body, url, lang, { link: url });
}

export function openReceive(address, lang = "es") {
  const { body } = dialog(lang, pick(T.receive, lang), pick(T.receiveLead, lang));
  if (!address) { body.textContent = pick(T.noAddress, lang); return; }
  const form = document.createElement("div");
  form.className = "aw-qr-form";
  form.innerHTML = `<label><span></span><input type="number" min="0" step="any" inputmode="decimal"></label><label><span></span><select><option value="XLM">XLM</option><option value="USDC">USDC</option></select></label>`;
  const [l1, l2] = form.querySelectorAll("span");
  l1.textContent = pick(T.amount, lang); l2.textContent = pick(T.asset, lang);
  const out = document.createElement("div");
  const draw = () => {
    const amount = form.querySelector("input").value;
    const asset = form.querySelector("select").value;
    const uri = sep7Pay({ destination: address, amount, assetCode: asset, assetIssuer: USDC_TESTNET_ISSUER, msg: "Awayu" });
    qrBlock(out, uri, lang);
    const open = button(pick(T.openWallet, lang), () => { location.href = uri; }, "primary");
    out.querySelector(".aw-qr-actions").prepend(open);
  };
  form.addEventListener("input", draw);
  body.replaceChildren(form, out);
  draw();
}

export function openScanner(lang = "es", { onCircle } = {}) {
  const { d, body } = dialog(lang, pick(T.scan, lang), pick(T.scanLead, lang));
  const result = document.createElement("div");
  result.className = "aw-qr-result";
  result.setAttribute("aria-live", "polite");
  const Detector = globalThis.BarcodeDetector;
  let stream = null;
  let raf = 0;
  const stop = () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); stream = null; };
  d.addEventListener("aw-qr-closed", stop);
  const show = (text) => {
    stop();
    const r = parseScanned(text);
    result.replaceChildren();
    const h = document.createElement("h3");
    const p = document.createElement("p");
    if (r.kind === "circle") {
      h.textContent = pick(T.found, lang);
      p.textContent = r.contractId;
      result.append(h, p, button(pick(T.openCircle, lang), () => { d.close(); onCircle ? onCircle(r.contractId) : (location.href = r.url); }, "primary"));
    } else if (r.kind === "sep7") {
      h.textContent = pick(T.payReq, lang);
      p.textContent = [r.amount && `${r.amount} ${r.asset}`, r.destination && `→ ${r.destination.slice(0, 6)}…${r.destination.slice(-4)}`, r.msg].filter(Boolean).join(" · ");
      result.append(h, p, button(pick(T.openWallet, lang), () => { location.href = r.uri; }, "primary"));
    } else if (r.kind === "address") {
      h.textContent = pick(T.address, lang);
      p.textContent = r.address;
      result.append(h, p, button(pick(T.copy, lang), () => navigator.clipboard?.writeText(r.address)));
    } else {
      h.textContent = pick(T.found, lang);
      p.textContent = r.text;
      result.append(h, p);
    }
  };
  if (!Detector) {
    const p = document.createElement("p");
    p.textContent = pick(T.noScanner, lang);
    body.replaceChildren(p);
    return;
  }
  const detector = new Detector({ formats: ["qr_code"] });
  const video = document.createElement("video");
  video.playsInline = true; video.muted = true;
  const file = document.createElement("label");
  file.className = "aw-qr-file";
  file.innerHTML = `<span></span><input type="file" accept="image/*">`;
  file.querySelector("span").textContent = pick(T.scanPhoto, lang);
  file.querySelector("input").onchange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const codes = await detector.detect(await createImageBitmap(f));
      if (codes[0]) show(codes[0].rawValue);
    } catch { /* imagen ilegible */ }
  };
  body.replaceChildren(video, file, result);
  navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } }).then((s) => {
    stream = s;
    video.srcObject = s;
    video.play();
    const tick = async () => {
      if (!stream) return;
      try {
        const codes = await detector.detect(video);
        if (codes[0]) return show(codes[0].rawValue);
      } catch { /* cuadro sin QR */ }
      raf = requestAnimationFrame(tick);
    };
    tick();
  }).catch(() => { video.remove(); });
}

/** Recarga en bolivianos con QR bancario a través de las rampas de Pollar, si están activas. */
export async function openBankTopUp(lang = "es", { pollarClient } = {}) {
  const { body } = dialog(lang, pick(T.bank, lang), pick(T.bankLead, lang));
  const steps = document.createElement("ol");
  for (const s of pick(T.bankSteps, lang)) { const li = document.createElement("li"); li.textContent = s; steps.append(li); }
  const status = document.createElement("div");
  status.className = "aw-qr-status";
  const legal = document.createElement("p");
  legal.className = "aw-qr-legal";
  legal.textContent = pick(T.bankLegal, lang);
  body.replaceChildren(steps, status, legal);
  let client = null;
  try { client = pollarClient ? await pollarClient() : null; } catch { client = null; }
  const { bolivianRamps } = await import("../integrations/pollar-earn.js");
  const r = client ? await bolivianRamps(client) : { available: false };
  if (r.available && r.routes?.length) {
    const p = document.createElement("p");
    p.textContent = pick(T.bankLive, lang);
    const ul = document.createElement("ul");
    for (const route of r.routes) {
      const li = document.createElement("li");
      li.textContent = [route.provider?.name || route.provider || "Proveedor", route.direction, route.fiat?.currency, route.crypto?.asset || route.asset].filter(Boolean).join(" · ");
      ul.append(li);
    }
    status.replaceChildren(p, ul);
  } else {
    status.textContent = pick(T.bankOff, lang);
  }
}
