// Video de ~2 minutos del flujo completo en Stellar testnet, sin cortes simulados:
// cuenta de prueba instantánea → USDC de prueba → crear un pasanaku en USDC →
// dejar garantía → aportar → (la segunda integrante aporta desde este script) →
// pagar el pozo → transacción en Stellar Expert → reporte para cooperativas.
//   AWAYU_URL=https://awayu-two.vercel.app node flujo_onchain.mjs
// Deja video/awayu-flujo-onchain.mp4. La segunda cuenta es efímera y su clave
// solo vive en memoria durante la grabación.
import { startRecording } from "./rec.mjs";
import { Keypair, Asset, Horizon, Networks, Operation, TransactionBuilder, BASE_FEE, Address, Contract, nativeToScVal, scValToNative, rpc } from "@stellar/stellar-sdk";

const BASE = process.env.AWAYU_URL || "https://awayu-two.vercel.app";
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const soroban = new rpc.Server("https://soroban-testnet.stellar.org");

// ---------- segunda integrante (fuera de cámara) ----------
const carla = Keypair.random();
await fetch(`https://friendbot.stellar.org/?addr=${carla.publicKey()}`);
await new Promise((r) => setTimeout(r, 4000));
{
  const paths = await (await fetch(`https://horizon-testnet.stellar.org/paths/strict-receive?source_assets=native&destination_asset_type=credit_alphanum4&destination_asset_code=USDC&destination_asset_issuer=${USDC.getIssuer()}&destination_amount=10`)).json();
  const best = paths._embedded.records.reduce((a, b) => (Number(b.source_amount) < Number(a.source_amount) ? b : a));
  const acc = await horizon.loadAccount(carla.publicKey());
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .addOperation(Operation.pathPaymentStrictReceive({ sendAsset: Asset.native(), sendMax: (Number(best.source_amount) * 1.05).toFixed(7), destination: carla.publicKey(), destAsset: USDC, destAmount: "10", path: best.path.map((p) => (p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code, p.asset_issuer))) }))
    .setTimeout(120).build();
  tx.sign(carla);
  await horizon.submitTransaction(tx);
}
async function carlaContributes(circleId) {
  const acc = await soroban.getAccount(carla.publicKey());
  let tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(circleId).call("contribute", nativeToScVal(carla.publicKey(), { type: "address" })))
    .setTimeout(120).build();
  tx = await soroban.prepareTransaction(tx);
  tx.sign(carla);
  const sent = await soroban.sendTransaction(tx);
  await soroban.pollTransaction(sent.hash, { attempts: 30 });
}

// ---------- grabación ----------
const r = await startRecording("flujo", { width: 1440, height: 810, out: "." });
const { page } = r;
await page.goto(BASE + "/#/inicio", { waitUntil: "load" });
await page.evaluate(() => {
  try {
    localStorage.setItem("awayu.lang", "es");
    localStorage.setItem("awayu.sound.muted", "true");
    localStorage.setItem("awayu.guide.welcome.seen", "1");
    localStorage.setItem("awayu.guide.tour.seen.firstVisit", "1");
    localStorage.setItem("awayu.proactive.muted", "1");
  } catch {}
});
await page.goto(BASE + "/#/circulo", { waitUntil: "load" });
await page.reload({ waitUntil: "load" }); // la bienvenida ya cuenta como vista
await r.sleep(4500);
await r.begin();
await r.sleep(1500);

// 1. Cuenta de prueba instantánea
await page.waitForFunction(() => document.querySelector("#btn-create") && document.querySelector("#stage canvas"), null, { timeout: 60000 }).catch(() => {});
for (let i = 0; i < 5; i++) {
  await r.click("#btn-wallet");
  await r.sleep(900);
  if (await page.locator("#wallet-menu:not([hidden])").count()) break;
  await r.sleep(1500);
}
await r.click("#wallet-menu [data-w=burner]");
await page.waitForFunction(() => /·/.test(document.querySelector("#btn-wallet")?.textContent || ""), null, { timeout: 60000 });
await r.sleep(2500);

// 2. Crear un pasanaku en USDC (5 minutos por ronda, cuota 2 USDC)
await r.click("#btn-create");
await r.sleep(1200);
await r.click("#form-create input[name=cname]");
await r.type("Pasanaku de la feria", 45);
await r.click("#create-token");
await page.selectOption("#create-token", "usdc");
await r.click("#form-create input[name=amount]");
await page.fill("#form-create input[name=amount]", "");
await r.type("2", 120);
await page.selectOption("#form-create select[name=period]", "300");
await r.click("#form-create textarea[name=members]");
await r.type(carla.publicKey(), 18);
await r.sleep(800);
// Firmar (el diálogo de consentimiento aparece la primera vez)
const acceptConsent = async () => {
  const box = page.locator("dialog[open] input[name=accept]");
  if (await box.count()) {
    await r.click("dialog[open] input[name=accept]");
    await r.click("dialog[open] button[value=accept]");
  }
};
await r.click("#btn-create-go");
await r.sleep(1500);
// Si falta USDC, la web ofrece obtenerlo en el mismo diálogo; luego se firma la creación
let gotUsdc = false;
for (let i = 0; i < 20 && !/[?&]c=C/.test(page.url()); i++) {
  await acceptConsent();
  const flowOpen = await page.locator("#create-usdc-flow:not([hidden])").count();
  const getBtn = page.locator("#btn-create-usdc:visible");
  if (flowOpen && !gotUsdc && (await getBtn.count())) {
    await r.click("#btn-create-usdc");
    gotUsdc = true;
    await r.sleep(1500);
    await acceptConsent();
    await page.waitForFunction(() => /listo/i.test(document.querySelector("#create-usdc-message")?.textContent || ""), null, { timeout: 90000 }).catch(() => {});
    await r.sleep(2500);
    if (await page.locator("#dlg-create[open]").count()) await r.click("#btn-create-go");
    await r.sleep(2000);
    continue;
  }
  await r.sleep(3000);
}
await page.waitForURL(/[?&]c=C/, { timeout: 120000 });
const circleId = new URL(page.url()).searchParams.get("c");
const cfg = await soroban.simulateTransaction(new TransactionBuilder(await soroban.getAccount(carla.publicKey()), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }).addOperation(new Contract(circleId).call("get_config")).setTimeout(30).build());
const me = scValToNative(cfg.result.retval).members.map(String).find((a) => a !== carla.publicKey());
await r.sleep(3000);

// 3. Dejar garantía y aportar
await r.click("#btn-guarantee");
await r.sleep(800);
await acceptConsent();
await page.waitForTimeout(9000);
await r.click("#btn-contribute");
await r.sleep(800);
await acceptConsent();
await page.waitForTimeout(9000);

// 4. Carla aporta desde su billetera (fuera de cámara) y se paga el pozo
await carlaContributes(circleId);
await r.sleep(22000); // la web relee el contrato cada 20 s
await r.click("#btn-payout");
await r.sleep(800);
await acceptConsent();
await page.waitForTimeout(10000);

// 5. Historial del círculo y transacción en Stellar Expert
// El enlace del pozo pagado ("recibiste" / "recibió") en el historial del círculo
await page.waitForFunction(() => [...document.querySelectorAll("#timeline-list a")].some((a) => /recibi/i.test(a.textContent)), null, { timeout: 60000 }).catch(() => {});
const href = await page.evaluate(() => [...document.querySelectorAll("#timeline-list a")].find((a) => /recibi/i.test(a.textContent))?.href || null);
console.log("pozo", href);
if (href) {
  await page.locator("#timeline-list").scrollIntoViewIfNeeded().catch(() => {});
  await r.sleep(2500);
  await page.goto(href, { waitUntil: "load" });
  await r.sleep(7000);
  await r.scroll(500, 2500);
  await r.sleep(3000);
}

// 6. Reporte para cooperativas
if (me) {
  await page.goto(`${BASE}/reporte.html?m=${me}`, { waitUntil: "load" });
  await page.waitForSelector(".r-circle", { timeout: 60000 }).catch(() => {});
  await r.sleep(5000);
  await r.scroll(450, 3000);
  await r.sleep(4000);
}
await r.end("../awayu-flujo-onchain.mp4");
console.log("Video listo", { circleId, me });
