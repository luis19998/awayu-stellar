// Despliega en Stellar testnet los contratos `sorteo` y `remate` y les da actividad
// real con cuentas efímeras (Friendbot): un sorteo con compromiso y revelación y
// dos rondas de una junta con remate (puja ganadora y garantía que cubre).
//   node web/contratos-nuevos.mjs <carpeta con sorteo.wasm y remate.wasm>
// Escribe web/public/contratos-nuevos.json y docs/EVIDENCIA-CONTRATOS-NUEVOS.md.
// Las claves efímeras solo viven en memoria durante la ejecución.
import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import {
  Address, BASE_FEE, Contract, Keypair, Networks, Operation, TransactionBuilder,
  nativeToScVal, rpc, scValToNative, xdr,
} from "@stellar/stellar-sdk";

const dir = process.argv[2];
if (!dir) throw new Error("Uso: node web/contratos-nuevos.mjs <carpeta-con-wasm>");
const PASS = Networks.TESTNET;
const server = new rpc.Server("https://soroban-testnet.stellar.org");
const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const U = 10_000_000n;
const steps = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const addr = (k) => new Address(typeof k === "string" ? k : k.publicKey()).toScVal();
const u32 = (n) => nativeToScVal(Number(n), { type: "u32" });
const u64 = (n) => nativeToScVal(BigInt(n), { type: "u64" });
const i128 = (n) => nativeToScVal(BigInt(n), { type: "i128" });
const bytes32 = (b) => xdr.ScVal.scvBytes(Buffer.from(b));
const vec = (xs) => xdr.ScVal.scvVec(xs);
const call = (id, fn, ...args) => new Contract(id).call(fn, ...args);

async function send(kp, op) {
  const account = await server.getAccount(kp.publicKey());
  let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASS }).addOperation(op).setTimeout(120).build();
  tx = await server.prepareTransaction(tx);
  tx.sign(kp);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("rechazada " + sent.hash);
  const res = await server.pollTransaction(sent.hash, { attempts: 40 });
  if (res.status !== "SUCCESS") throw new Error(`falló ${sent.hash} (${res.status})`);
  return { hash: sent.hash, value: res.returnValue ? scValToNative(res.returnValue) : null };
}
async function step(group, action, who, kp, op) {
  const r = await send(kp, op);
  steps.push({ group, action, who, hash: r.hash });
  console.log(`✔ ${group} · ${action} · ${who} · ${r.hash}`);
  return r.value;
}
async function now() {
  const l = await (await fetch("https://horizon-testnet.stellar.org/ledgers?order=desc&limit=1")).json();
  return Math.floor(new Date(l._embedded.records[0].closed_at).getTime() / 1000);
}
const deployOp = (creator, wasmHash, constructorArgs = []) =>
  Operation.createCustomContract({ address: new Address(creator.publicKey()), wasmHash, salt: randomBytes(32), constructorArgs });

// ---------- cuentas ----------
const people = { Organizadora: Keypair.random(), Ana: Keypair.random(), Bruno: Keypair.random(), Carla: Keypair.random() };
console.log("Fondeando cuentas efímeras…");
for (const kp of Object.values(people)) await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
await sleep(5000);
const { Organizadora: org, Ana, Bruno, Carla } = people;
const members = [["Ana", Ana], ["Bruno", Bruno], ["Carla", Carla]];

// ---------- subir el código ----------
const wasm = (n) => fs.readFileSync(path.join(dir, `${n}.wasm`));
const hashOf = (b) => createHash("sha256").update(b).digest();
const sorteoWasm = wasm("sorteo");
const remateWasm = wasm("remate");
await step("Código", "Subir el wasm de sorteo", "Organizadora", org, Operation.uploadContractWasm({ wasm: sorteoWasm }));
await step("Código", "Subir el wasm de remate", "Organizadora", org, Operation.uploadContractWasm({ wasm: remateWasm }));

// ---------- sorteo con compromiso y revelación ----------
const sorteo = String(await step("Sorteo", "Desplegar el contrato de sorteos", "Organizadora", org, deployOp(org, hashOf(sorteoWasm))));
const t0 = await now();
const commitDeadline = t0 + 70;
const drawId = await step("Sorteo", "Crear el sorteo del orden de un pasanaku (3 personas)", "Organizadora", org,
  call(sorteo, "create", addr(org), vec(members.map(([, k]) => addr(k))), u64(commitDeadline), u64(t0 + 900)));
const secrets = {};
for (const [name, kp] of members) {
  secrets[name] = randomBytes(32);
  // compromiso = sha256(secreto ‖ dirección en XDR), igual que el contrato
  const commitment = createHash("sha256").update(Buffer.concat([secrets[name], addr(kp).toXDR()])).digest();
  await step("Sorteo", "Comprometerse con un secreto (solo se publica su huella)", name, kp, call(sorteo, "commit", u32(drawId), addr(kp), bytes32(commitment)));
}
let wait = (commitDeadline + 8) - (await now());
if (wait > 0) { console.log(`Esperando ${wait} s a que cierre la etapa de compromisos…`); await sleep(wait * 1000); }
for (const [name, kp] of members) {
  await step("Sorteo", "Revelar el secreto", name, kp, call(sorteo, "reveal", u32(drawId), addr(kp), bytes32(secrets[name])));
}
const order = await step("Sorteo", "Cerrar el sorteo: el orden sale de todos los secretos", "Ana", Ana, call(sorteo, "finalize", u32(drawId)));
const names = Object.fromEntries(members.map(([n, k]) => [k.publicKey(), n]));
const orderNames = (order || []).map((a) => names[String(a)] || String(a));
console.log("Orden del sorteo:", orderNames.join(" → "));

// ---------- junta con remate ----------
const PERIOD = 80;
const remate = String(await step("Remate", "Crear una junta con remate (cuota 5 XLM, 3 personas)", "Organizadora", org,
  deployOp(org, hashOf(remateWasm), [addr(org), new Address(XLM_SAC).toScVal(), i128(5n * U), u64(PERIOD), vec(members.map(([, k]) => addr(k)))])));
const start = await now();
await step("Remate", "Dejar garantía de una cuota", "Carla", Carla, call(remate, "deposit_guarantee", addr(Carla)));
for (const [name, kp] of members) await step("Remate", "Aportar la cuota de la ronda 1", name, kp, call(remate, "contribute", addr(kp)));
await step("Remate", "Pujar 5 % de descuento para cobrar en la ronda 1", "Ana", Ana, call(remate, "bid", addr(Ana), u32(500)));
await step("Remate", "Pujar 12 % de descuento para cobrar en la ronda 1", "Bruno", Bruno, call(remate, "bid", addr(Bruno), u32(1200)));
const winner1 = await step("Remate", "Cerrar la ronda 1: gana la puja más alta y el descuento se reparte", "Carla", Carla, call(remate, "settle"));
for (const [name, kp] of [["Ana", Ana], ["Bruno", Bruno]]) await step("Remate", "Aportar la cuota de la ronda 2", name, kp, call(remate, "contribute", addr(kp)));
wait = (start + PERIOD * 2 + 15) - (await now());
if (wait > 0) { console.log(`Esperando ${wait} s a que venza la ronda 2…`); await sleep(wait * 1000); }
const winner2 = await step("Remate", "Cerrar la ronda 2: Carla no aportó y su garantía cubre la cuota", "Ana", Ana, call(remate, "settle"));

// ---------- salida ----------
const out = {
  network: "testnet", createdAt: new Date().toISOString(),
  sorteo: { contractId: sorteo, wasmHash: hashOf(sorteoWasm).toString("hex"), drawId: Number(drawId), order: orderNames },
  remate: { contractId: remate, wasmHash: hashOf(remateWasm).toString("hex"), token: "XLM", winners: [names[String(winner1)] || String(winner1), names[String(winner2)] || String(winner2)] },
  accounts: Object.fromEntries(Object.entries(people).map(([n, k]) => [n, k.publicKey()])),
  steps,
};
fs.writeFileSync(new URL("./public/contratos-nuevos.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
const tx = (h) => `[\`${h.slice(0, 8)}…\`](https://stellar.expert/explorer/testnet/tx/${h})`;
const c = (id) => `[\`${id.slice(0, 6)}…${id.slice(-4)}\`](https://stellar.expert/explorer/testnet/contract/${id})`;
const md = [
  "# Evidencia de los contratos `sorteo` y `remate` (Stellar testnet)", "",
  `Generado el ${out.createdAt.slice(0, 16).replace("T", " ")} UTC con \`node web/contratos-nuevos.mjs\`, usando los wasm compilados por la integración continua. Cuentas efímeras fondeadas con Friendbot; las claves no se guardaron.`, "",
  `- **sorteo** ${c(sorteo)} · hash del wasm \`${out.sorteo.wasmHash}\` · orden resultante del sorteo ${out.sorteo.drawId}: **${orderNames.join(" → ")}**`,
  `- **remate** ${c(remate)} · hash del wasm \`${out.remate.wasmHash}\` · ganadores: ronda 1 **${out.remate.winners[0]}** (puja más alta), ronda 2 **${out.remate.winners[1]}**`, "",
  "| # | Contrato | Acción | Quién | Transacción |", "|---|---|---|---|---|",
  ...steps.map((s, i) => `| ${i + 1} | ${s.group} | ${s.action} | ${s.who} | ${tx(s.hash)} |`), "",
].join("\n");
fs.writeFileSync(new URL("../docs/EVIDENCIA-CONTRATOS-NUEVOS.md", import.meta.url), md);
console.log(`\nListo: ${steps.length} transacciones.`);
