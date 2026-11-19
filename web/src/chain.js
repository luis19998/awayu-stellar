// Stellar testnet: lectura del contrato por simulación (sin firmar) y armado
// de las transacciones de aportar, pagar el pozo y crear un círculo nuevo.
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

// Cuenta nula: la simulación no verifica la secuencia de la cuenta de origen.
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
export const DECIMALS = 1e7;
export const PASSPHRASE = Networks.TESTNET;

const DEFAULT = {
  network: "testnet",
  rpc: "https://soroban-testnet.stellar.org",
  // Contrato SAC del XLM nativo en testnet
  token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  tokenSymbol: "XLM",
};

export async function loadDeployment() {
  try {
    const r = await fetch("/testnet.json", { cache: "no-store" });
    if (r.ok) return { ...DEFAULT, ...(await r.json()) };
  } catch {}
  return null;
}

const servers = new Map();
const serverFor = (dep) => {
  const url = dep?.rpc || DEFAULT.rpc;
  if (!servers.has(url)) servers.set(url, new rpc.Server(url));
  return servers.get(url);
};

async function view(server, contractId, method, ...args) {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return scValToNative(sim.result.retval);
}

/** Lee un círculo y lo devuelve con la misma forma que el modo demo. */
export async function readCircle(dep, contractId = dep.contractId, names = {}) {
  const server = serverFor(dep);
  const id = contractId;
  const [cfg, info] = await Promise.all([view(server, id, "get_config"), view(server, id, "round_info")]);
  const known = { ...Object.fromEntries(Object.entries(dep.members || {}).map(([n, a]) => [a, cap(n)])), ...names };
  const order = cfg.members.map(String);
  const [histories, infos] = await Promise.all([
    Promise.all(order.map((a) => view(server, id, "history", new Address(a).toScVal()))),
    // Contrato v2: garantías y alias. Un contrato v1 no tiene members(): seguimos sin eso.
    view(server, id, "members").catch(() => null),
  ]);
  const byAddr = new Map((infos || []).map((m) => [String(m.address), m]));
  const round = Number(info.round);
  const members = order.map((address, i) => {
    const extra = byAddr.get(address);
    return {
      name: names[address] || extra?.alias || known[address] || short(address),
      alias: extra?.alias || null,
      role: short(address),
      address,
      guarantee: extra ? Number(extra.guarantee) / DECIMALS : 0,
      history: histories[i].map(Number),
    };
  });
  // El historial guarda una marca por ronda: si ya tiene la de la ronda actual, aportó.
  const paid = new Map();
  members.forEach((m, i) => {
    if (m.history.length > round) paid.set(i, m.history[round]);
    m.history = m.history.slice(0, round);
  });
  return {
    mode: "testnet",
    token: String(cfg.token) === DEFAULT.token ? "XLM" : dep.tokenSymbol || "token",
    tokenId: String(cfg.token),
    amount: Number(cfg.amount) / DECIMALS,
    periodDays: Number(cfg.period) / 86400,
    periodSeconds: Number(cfg.period),
    deadline: Number(info.deadline),
    admin: String(cfg.admin),
    start: Number(cfg.start),
    members,
    order: members.map((_, i) => i),
    round,
    paid,
    payouts: [],
    apy: 0.062,
    contractId: id,
    version: infos ? 2 : 1,
  };
}

export const short = (a) => a.slice(0, 4) + "…" + a.slice(-4);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function prepare(dep, source, op) {
  const server = serverFor(dep);
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(op)
    .setTimeout(120)
    .build();
  return (await server.prepareTransaction(tx)).toXDR();
}

export function buildContributeXdr(dep, contractId, member) {
  return prepare(dep, member, new Contract(contractId).call("contribute", nativeToScVal(member, { type: "address" })));
}

const addr = (a) => nativeToScVal(a, { type: "address" });

export function buildGuaranteeXdr(dep, contractId, member) {
  return prepare(dep, member, new Contract(contractId).call("deposit_guarantee", addr(member)));
}

export function buildWithdrawXdr(dep, contractId, member) {
  return prepare(dep, member, new Contract(contractId).call("withdraw_guarantee", addr(member)));
}

export function buildAliasXdr(dep, contractId, member, alias) {
  return prepare(
    dep,
    member,
    new Contract(contractId).call("set_alias", addr(member), nativeToScVal(alias, { type: "string" }))
  );
}

export function buildPayoutXdr(dep, contractId, caller) {
  return prepare(dep, caller, new Contract(contractId).call("payout"));
}

/** Hash del wasm de Awayu ya instalado en testnet (se lee del contrato demo). */
// El hash es el SHA-256 del wasm, que la red devuelve para cualquier contrato.
export async function wasmHashOf(dep, contractId = dep.contractId) {
  if (dep.wasmHash) return Buffer.from(dep.wasmHash, "hex");
  const wasm = await serverFor(dep).getContractWasmByContractId(contractId);
  const digest = await crypto.subtle.digest("SHA-256", wasm);
  dep.wasmHash = Buffer.from(digest).toString("hex");
  return Buffer.from(digest);
}

/** Despliega un círculo nuevo desde el wasm ya instalado, con constructor. */
export async function buildCreateXdr(dep, creator, { members, amount, periodSeconds }) {
  const wasmHash = await wasmHashOf(dep);
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  const op = Operation.createCustomContract({
    address: new Address(creator),
    wasmHash,
    salt: Buffer.from(salt),
    constructorArgs: [
      new Address(creator).toScVal(),
      new Address(dep.token).toScVal(),
      nativeToScVal(BigInt(Math.round(amount * DECIMALS)), { type: "i128" }),
      nativeToScVal(BigInt(periodSeconds), { type: "u64" }),
      xdr.ScVal.scvVec(members.map((a) => new Address(a).toScVal())),
    ],
  });
  return prepare(dep, creator, op);
}

/** Envía una transacción firmada y espera el resultado. Devuelve el valor de retorno. */
export async function submit(dep, { signedXdr, hash }) {
  const server = serverFor(dep);
  if (signedXdr) {
    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, PASSPHRASE));
    if (sent.status === "ERROR") throw new Error("La red rechazó la transacción");
    hash = sent.hash;
  }
  if (!hash) return null;
  const res = await server.pollTransaction(hash, { attempts: 30 });
  if (res.status !== "SUCCESS") throw new Error("La transacción falló (" + res.status + ")");
  return { hash, value: res.returnValue ? scValToNative(res.returnValue) : null };
}

/** Si la cuenta no existe en testnet, la fondea con Friendbot. */
export async function ensureFunded(dep, address) {
  try {
    await serverFor(dep).getAccount(address);
    return false;
  } catch {
    const r = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
    if (!r.ok) throw new Error("Friendbot no pudo fondear la cuenta");
    return true;
  }
}

/**
 * Pagos del pozo y rondas cubiertas, leídos de los eventos del contrato.
 * El RPC solo guarda unos días de eventos: lo más viejo puede no aparecer.
 */
export async function readActivity(dep, contractId, sinceTs = null) {
  const server = serverFor(dep);
  const latest = await server.getLatestLedger();
  // Empezamos cerca de la creación del círculo (~5 s por ledger) para no
  // recorrer días de ledgers vacíos; el RPC guarda unos 7 días.
  const back = sinceTs ? Math.ceil((Date.now() / 1000 - sinceTs) / 5) + 720 : 17280 * 6;
  const startLedger = Math.max(1, latest.sequence - Math.min(back, 17280 * 6));
  const filters = [{ type: "contract", contractIds: [contractId] }];
  // El RPC revisa unos 10 000 ledgers por pedido y devuelve un cursor: hay que
  // seguir pidiendo hasta llegar al último ledger.
  const events = [];
  let res = await server.getEvents({ startLedger, filters, limit: 200 });
  for (let page = 0; page < 15; page++) {
    events.push(...(res.events || []));
    if (!res.cursor) break;
    const reached = Number(BigInt(res.cursor.split("-")[0]) >> 32n);
    if (reached >= (res.latestLedger || latest.sequence) && (res.events || []).length < 200) break;
    res = await server.getEvents({ filters, cursor: res.cursor, limit: 200 });
  }
  const out = [];
  for (const e of events) {
    const topic = e.topic.map((t) => scValToNative(t));
    const kind = String(topic[0]);
    const who = topic[1] ? String(topic[1]) : null;
    const val = scValToNative(e.value);
    if (kind === "pozo") out.push({ kind, who, round: Number(val[0]), amount: Number(val[1]) / DECIMALS, tx: e.txHash, at: e.ledgerClosedAt });
    else if (kind === "cubre") out.push({ kind, who, round: Number(val[0]), amount: Number(val[1]) / DECIMALS, tx: e.txHash, at: e.ledgerClosedAt });
    else if (kind === "garantia") out.push({ kind, who, amount: Number(val) / DECIMALS, tx: e.txHash, at: e.ledgerClosedAt });
  }
  return out;
}

/** Saldo de una cuenta en el token del círculo (consulta simulada, sin firmar). */
export async function readBalance(dep, tokenId, address) {
  const raw = await view(serverFor(dep), tokenId || dep.token, "balance", new Address(address).toScVal());
  return Number(raw) / DECIMALS;
}

export const explorerUrl = (contractId) => `https://stellar.expert/explorer/testnet/contract/${contractId}`;
export const txUrl = (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
