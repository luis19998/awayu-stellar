// Evidencia on-chain para jueces: recorre cada acción de Awayu en Stellar testnet
// con cuentas efímeras (Friendbot) y cuotas en USDC de prueba de Circle, y guarda
// el hash de cada transacción.
//   node web/evidencia-testnet.mjs        (desde la raíz del repo, ~4 minutos)
// Escribe web/public/evidencia.json y docs/EVIDENCIA.md. Las claves efímeras solo
// viven en memoria durante la ejecución: no se guardan en ningún archivo.
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  Address, Asset, BASE_FEE, Contract, Horizon, Keypair, Networks, Operation,
  TransactionBuilder, nativeToScVal, rpc, scValToNative, xdr,
} from "@stellar/stellar-sdk";

const RPC = "https://soroban-testnet.stellar.org";
const HORIZON = "https://horizon-testnet.stellar.org";
const PASS = Networks.TESTNET;
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const U = 10_000_000n; // 7 decimales
const server = new rpc.Server(RPC);
const horizon = new Horizon.Server(HORIZON);
const dep = JSON.parse(fs.readFileSync(new URL("./public/testnet.json", import.meta.url), "utf8"));
const steps = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const addr = (k) => new Address(typeof k === "string" ? k : k.publicKey()).toScVal();
const i128 = (n) => nativeToScVal(BigInt(n), { type: "i128" });
const u32 = (n) => nativeToScVal(Number(n), { type: "u32" });
const u64 = (n) => nativeToScVal(BigInt(n), { type: "u64" });
const str = (s) => nativeToScVal(String(s), { type: "string" });
const sym = (s) => nativeToScVal(String(s), { type: "symbol" });
const vec = (xs) => xdr.ScVal.scvVec(xs);
const struct = (o) => xdr.ScVal.scvMap(Object.keys(o).sort().map((k) => new xdr.ScMapEntry({ key: sym(k), val: o[k] })));

async function send(kp, op, { soroban = true } = {}) {
  const account = await server.getAccount(kp.publicKey());
  let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASS }).addOperation(op).setTimeout(120).build();
  if (soroban) tx = await server.prepareTransaction(tx);
  tx.sign(kp);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("rechazada: " + JSON.stringify(sent.errorResult?.result?.()?.switch?.()?.name ?? sent.status));
  const res = await server.pollTransaction(sent.hash, { attempts: 40 });
  if (res.status !== "SUCCESS") throw new Error(`falló ${sent.hash} (${res.status})`);
  return { hash: sent.hash, value: res.returnValue ? scValToNative(res.returnValue) : null };
}

async function step(group, action, who, kp, op, opts) {
  const r = await send(kp, op, opts);
  steps.push({ group, action, who, hash: r.hash });
  console.log(`✔ ${group} · ${action} · ${who} · ${r.hash}`);
  return r.value;
}

const call = (id, fn, ...args) => new Contract(id).call(fn, ...args);

async function wasmHashOf(id) {
  const wasm = await server.getContractWasmByContractId(id);
  return createHash("sha256").update(wasm).digest();
}

function deployOp(creator, wasmHash, constructorArgs) {
  const salt = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) salt[i] = Math.floor(Math.random() * 256);
  return Operation.createCustomContract({ address: new Address(creator.publicKey()), wasmHash, salt, constructorArgs });
}

async function fund(kp) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  if (!r.ok) throw new Error("Friendbot no respondió");
}

async function buyUsdcOp(kp, amount) {
  const url = `${HORIZON}/paths/strict-receive?source_assets=native&destination_asset_type=credit_alphanum4&destination_asset_code=USDC&destination_asset_issuer=${USDC.getIssuer()}&destination_amount=${amount}`;
  const recs = (await (await fetch(url)).json())._embedded?.records || [];
  if (!recs.length) throw new Error("Sin liquidez de USDC de prueba");
  const best = recs.reduce((a, b) => (Number(b.source_amount) < Number(a.source_amount) ? b : a));
  const path = best.path.map((p) => (p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code, p.asset_issuer)));
  return Operation.pathPaymentStrictReceive({
    sendAsset: Asset.native(), sendMax: (Number(best.source_amount) * 1.05).toFixed(7),
    destination: kp.publicKey(), destAsset: USDC, destAmount: String(amount), path,
  });
}

// ---------- cuentas ----------
const people = { Ana: Keypair.random(), Bruno: Keypair.random(), Carla: Keypair.random() };
console.log("Fondeando cuentas efímeras con Friendbot…");
for (const kp of Object.values(people)) await fund(kp);
await sleep(4000);
for (const [name, kp] of Object.entries(people)) {
  await step("USDC de prueba", "Línea de confianza a USDC", name, kp, Operation.changeTrust({ asset: USDC }), { soroban: false });
  await step("USDC de prueba", "Cambio XLM → 30 USDC en el DEX de Stellar", name, kp, await buyUsdcOp(kp, 30), { soroban: false });
}
const { Ana, Bruno, Carla } = people;

// ---------- Pasanaku en USDC ----------
const PERIOD = 75; // segundos por ronda, para poder mostrar el vencimiento
const pasanakuWasm = await wasmHashOf(dep.contractId);
const circle = await step("Pasanaku", "Crear el círculo (cuota 5 USDC, turno sorteado en la cadena)", "Ana", Ana,
  deployOp(Ana, pasanakuWasm, [addr(Ana), new Address(USDC_SAC).toScVal(), i128(5n * U), u64(PERIOD), vec([addr(Ana), addr(Bruno), addr(Carla)])]));
const circleId = String(circle);
const created = Date.now();
await step("Pasanaku", "Dejar garantía de una cuota", "Bruno", Bruno, call(circleId, "deposit_guarantee", addr(Bruno)));
for (const [n, kp] of Object.entries(people)) await step("Pasanaku", "Aportar la cuota de la ronda 1", n, kp, call(circleId, "contribute", addr(kp)));
await step("Pasanaku", "Pagar el pozo de la ronda 1 (todos aportaron)", "Carla", Carla, call(circleId, "payout"));
for (const [n, kp] of [["Ana", Ana], ["Carla", Carla]]) await step("Pasanaku", "Aportar la cuota de la ronda 2", n, kp, call(circleId, "contribute", addr(kp)));
const wait = created + PERIOD * 2 * 1000 + 20_000 - Date.now();
if (wait > 0) { console.log(`Esperando ${Math.round(wait / 1000)} s a que venza la ronda 2…`); await sleep(wait); }
await step("Pasanaku", "Pagar el pozo de la ronda 2: Bruno no pagó y su garantía cubrió la cuota", "Ana", Ana, call(circleId, "payout"));
if (dep.registro) {
  await step("Registro", "Anotar el círculo en el registro on-chain (Cochabamba)", "Ana", Ana,
    call(dep.registro, "register", addr(Ana), addr(circleId), str("Pasanaku de evidencia USDC"), sym("cbba")));
  await step("Registro", "Sumar el círculo al pasaporte", "Bruno", Bruno, call(dep.registro, "join", addr(Bruno), addr(circleId)));
}

// ---------- Ayni ----------
const ayniWasm = await wasmHashOf(dep.ayni.contractId);
const ayni = String(await step("Ayni", "Crear el fondo de ayuda mutua (cuota 2 USDC, quórum 50 %)", "Ana", Ana,
  deployOp(Ana, ayniWasm, [addr(Ana), new Address(USDC_SAC).toScVal(), vec([addr(Ana), addr(Bruno), addr(Carla)]), i128(2n * U), u32(5000), i128(10n * U)])));
for (const [n, kp] of Object.entries(people)) await step("Ayni", "Aportar la cuota del mes", n, kp, call(ayni, "contribute", addr(kp)));
const req = await step("Ayni", "Pedir 3 USDC para una emergencia", "Carla", Carla, call(ayni, "request", addr(Carla), i128(3n * U), str("Medicinas para mi mamá")));
await step("Ayni", "Votar a favor del pedido", "Ana", Ana, call(ayni, "vote", addr(Ana), u32(req), nativeToScVal(true)));
await step("Ayni", "Votar a favor del pedido", "Bruno", Bruno, call(ayni, "vote", addr(Bruno), u32(req), nativeToScVal(true)));
await step("Ayni", "Resolver el pedido: aprobado y pagado", "Ana", Ana, call(ayni, "resolve", u32(req)));
await step("Ayni", "Devolver 1 USDC sin intereses", "Carla", Carla, call(ayni, "repay", addr(Carla), i128(1n * U)));

// ---------- Minka ----------
const minkaWasm = await wasmHashOf(dep.minka.contractId);
const miles = vec([struct({ title: str("Compra de tubos"), amount: i128(3n * U) }), struct({ title: str("Instalación"), amount: i128(3n * U) })]);
const minka = String(await step("Minka", "Crear el proyecto (meta 6 USDC en 2 hitos)", "Ana", Ana,
  deployOp(Ana, minkaWasm, [addr(Ana), new Address(USDC_SAC).toScVal(), str("Riego comunitario"), i128(6n * U), miles, u64(Math.floor(Date.now() / 1000) + 30 * 86400), vec([addr(Bruno), addr(Carla)])])));
await step("Minka", "Apoyar con 4 USDC", "Bruno", Bruno, call(minka, "fund", addr(Bruno), i128(4n * U)));
await step("Minka", "Apoyar con 2 USDC", "Carla", Carla, call(minka, "fund", addr(Carla), i128(2n * U)));
await step("Minka", "Subir evidencia del hito 1", "Ana", Ana, call(minka, "submit_evidence", addr(Ana), u32(0), str("https://awayu-two.vercel.app/#/minka")));
await step("Minka", "Aprobar el hito 1", "Bruno", Bruno, call(minka, "approve", addr(Bruno), u32(0)));
await step("Minka", "Aprobar el hito 1: se liberan 3 USDC al organizador", "Carla", Carla, call(minka, "approve", addr(Carla), u32(0)));

// ---------- Alasitas ----------
const goal = await step("Alasitas", "Crear una meta de ahorro en USDC", "Ana", Ana,
  call(dep.alasitas.contractId, "create_goal", addr(Ana), new Address(USDC_SAC).toScVal(), str("Mi casita"), sym("casa"), i128(10n * U), u64(Math.floor(Date.now() / 1000) + 90 * 86400), vec([addr(Ana)])));
await step("Alasitas", "Depositar 3 USDC en la meta", "Ana", Ana, call(dep.alasitas.contractId, "deposit", addr(Ana), u32(goal), i128(3n * U)));

// ---------- salida ----------
const contracts = { pasanaku: circleId, ayni, minka, alasitas: dep.alasitas.contractId, registro: dep.registro };
const accounts = Object.fromEntries(Object.entries(people).map(([n, k]) => [n, k.publicKey()]));
const out = { network: "testnet", token: { code: "USDC", issuer: USDC.getIssuer(), sac: USDC_SAC }, createdAt: new Date().toISOString(), contracts, accounts, steps };
fs.writeFileSync(new URL("./public/evidencia.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");

const tx = (h) => `[\`${h.slice(0, 8)}…\`](https://stellar.expert/explorer/testnet/tx/${h})`;
const c = (id) => `[\`${id.slice(0, 6)}…${id.slice(-4)}\`](https://stellar.expert/explorer/testnet/contract/${id})`;
const md = [
  "# Evidencia on-chain (Stellar testnet, cuotas en USDC de prueba)",
  "",
  `Generado el ${out.createdAt.slice(0, 16).replace("T", " ")} UTC con \`node web/evidencia-testnet.mjs\`. Cada fila es una transacción real y confirmada; el enlace abre Stellar Expert.`,
  "",
  `Token: USDC de prueba de Circle (\`${USDC.getIssuer()}\`), contrato SAC ${c(USDC_SAC)}. Cuentas efímeras fondeadas con Friendbot; las claves no se guardaron.`,
  "",
  `Contratos usados: pasanaku ${c(circleId)} · ayni ${c(ayni)} · minka ${c(minka)} · alasitas ${c(dep.alasitas.contractId)}${dep.registro ? ` · registro ${c(dep.registro)}` : ""}.`,
  "",
  "| # | Tradición | Acción | Quién | Transacción |",
  "|---|---|---|---|---|",
  ...steps.map((s, i) => `| ${i + 1} | ${s.group} | ${s.action} | ${s.who} | ${tx(s.hash)} |`),
  "",
  `Cuentas: ${Object.entries(accounts).map(([n, a]) => `${n} [\`${a.slice(0, 4)}…${a.slice(-4)}\`](https://stellar.expert/explorer/testnet/account/${a})`).join(" · ")}.`,
  "",
].join("\n");
fs.writeFileSync(new URL("../docs/EVIDENCIA.md", import.meta.url), md);
console.log(`\nListo: ${steps.length} transacciones. web/public/evidencia.json y docs/EVIDENCIA.md`);
