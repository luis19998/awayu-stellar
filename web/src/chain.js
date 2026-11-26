// Stellar testnet: lectura del contrato por simulación (sin firmar) y armado
// de las transacciones de aportar, pagar el pozo y crear un círculo nuevo.
import {
  Account,
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { t } from "./i18n.js";
import { scoreOf } from "./reporte/puntaje.js";

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

export const USDC_TESTNET = {
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  sac: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
};

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const horizonFor = () => new Horizon.Server(HORIZON_TESTNET);

export function tokenSymbolOf(tokenId) {
  if (!tokenId || tokenId === DEFAULT.token) return "XLM";
  if (tokenId === USDC_TESTNET.sac) return "USDC";
  return "token";
}

/** Horizon route parsing is kept pure so it can be tested without network access. */
export function parseStrictReceivePaths(payload) {
  const records = Array.isArray(payload) ? payload : payload?._embedded?.records || payload?.paths || [];
  return records
    .filter((route) => Number.isFinite(Number(route?.source_amount)) && Number(route.source_amount) > 0)
    .map((route) => ({ ...route, sourceAmount: Number(route.source_amount) }));
}

export function bestStrictReceivePath(payload) {
  return parseStrictReceivePaths(payload).sort((a, b) => a.sourceAmount - b.sourceAmount)[0] || null;
}

export function roundSendMax(sourceAmount) {
  return Number((Number(sourceAmount) * 1.05).toFixed(7));
}

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
  const [histories, infos, version] = await Promise.all([
    Promise.all(order.map((a) => view(server, id, "history", new Address(a).toScVal()))),
    // Contrato v2+: garantías y alias. Un contrato v1 no tiene members(): seguimos sin eso.
    view(server, id, "members").catch(() => null),
    view(server, id, "version").catch(() => 1),
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
    token: tokenSymbolOf(String(cfg.token)),
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
    version: Number(version) || 1,
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
export function createConstructorArgs(dep, creator, { members, amount, periodSeconds, token }) {
  return [
    new Address(creator).toScVal(),
    new Address(token || dep.token).toScVal(),
    nativeToScVal(BigInt(Math.round(amount * DECIMALS)), { type: "i128" }),
    nativeToScVal(BigInt(periodSeconds), { type: "u64" }),
    xdr.ScVal.scvVec(members.map((a) => new Address(a).toScVal())),
  ];
}

export async function buildCreateXdr(dep, creator, { members, amount, periodSeconds, token }) {
  const wasmHash = await wasmHashOf(dep);
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  const op = Operation.createCustomContract({
    address: new Address(creator),
    wasmHash,
    salt: Buffer.from(salt),
    constructorArgs: createConstructorArgs(dep, creator, { members, amount, periodSeconds, token }),
  });
  return prepare(dep, creator, op);
}

/** Lee si una cuenta tiene trustline de USDC de testnet y su saldo. */
export async function usdcStatus(address) {
  const response = await fetch(`${HORIZON_TESTNET}/accounts/${encodeURIComponent(address)}`, { headers: { Accept: "application/json" } });
  if (response.status === 404) return { hasTrustline: false, balance: 0 };
  if (!response.ok) throw new Error(t("No se pudo consultar el saldo USDC en Horizon"));
  const account = await response.json();
  const balance = (account.balances || []).find((item) => item.asset_code === USDC_TESTNET.code && item.asset_issuer === USDC_TESTNET.issuer);
  return { hasTrustline: Boolean(balance), balance: Number(balance?.balance || 0) };
}

/** Arma una transacción clásica para crear la trustline de USDC. */
export async function buildUsdcTrustlineXdr(address) {
  const account = await horizonFor().loadAccount(address);
  return new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(Operation.changeTrust({ asset: new Asset(USDC_TESTNET.code, USDC_TESTNET.issuer) }))
    .setTimeout(120)
    .build()
    .toXDR();
}

/** Arma el cambio XLM→USDC por la ruta de menor gasto en XLM. */
export async function buildBuyUsdcXdr(address, usdcAmount) {
  const amount = Number(usdcAmount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(t("Indica una cantidad válida de USDC de prueba"));
  const query = new URLSearchParams({
    source_assets: "native",
    destination_asset_type: "credit_alphanum4",
    destination_asset_code: USDC_TESTNET.code,
    destination_asset_issuer: USDC_TESTNET.issuer,
    destination_amount: amount.toFixed(7),
  });
  const response = await fetch(`${HORIZON_TESTNET}/paths/strict-receive?${query}`);
  if (!response.ok) throw new Error(t("No se pudo buscar una ruta de cambio a USDC de prueba"));
  const route = bestStrictReceivePath(await response.json());
  if (!route) throw new Error(t("No hay liquidez de USDC de prueba en este momento; usa XLM de testnet"));
  const account = await horizonFor().loadAccount(address);
  const path = (route.path || []).map((item) => item.asset_type === "native"
    ? Asset.native()
    : new Asset(item.asset_code, item.asset_issuer));
  return new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: roundSendMax(route.sourceAmount).toFixed(7),
      destination: address,
      destAsset: new Asset(USDC_TESTNET.code, USDC_TESTNET.issuer),
      destAmount: amount.toFixed(7),
      path,
    }))
    .setTimeout(120)
    .build()
    .toXDR();
}

/** Envía una transacción firmada y espera el resultado. Devuelve el valor de retorno. */
/** Contrato, función y argumentos de la primera operación (para la consola de desarrollador). */
export function describeCall(xdrText) {
  try {
    const tx = TransactionBuilder.fromXDR(xdrText, PASSPHRASE);
    const op = tx.operations[0];
    if (op?.type !== "invokeHostFunction") return { fn: op?.type || "?" };
    const f = op.func;
    const ic = typeof f.invokeContract === "function" ? f.invokeContract() : f.invokeContract;
    if (!ic) return { fn: "createContract" };
    const val = (x) => (typeof x === "function" ? x.call(ic) : x);
    const args = (val(ic.args) || []).map((a) => {
      try {
        return scValToNative(a);
      } catch {
        return "?";
      }
    });
    return { contract: Address.fromScAddress(val(ic.contractAddress)).toString(), fn: String(val(ic.functionName)), args };
  } catch {
    return {};
  }
}

const tell = (detail) => {
  try {
    window.dispatchEvent(new CustomEvent("awayu:tx", { detail: { network: "testnet", at: Date.now(), ...detail } }));
  } catch {}
};

async function waitForHorizonTransaction(hash, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(`${HORIZON_TESTNET}/transactions/${encodeURIComponent(hash)}`, { headers: { Accept: "application/json" } });
    if (response.ok) return response.json();
    if (response.status !== 404) throw new Error(t("Horizon no pudo confirmar la transacción clásica"));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(t("La transacción clásica sigue pendiente en Horizon; vuelve a consultar su estado"));
}

export async function submit(dep, { signedXdr, hash }) {
  const server = serverFor(dep);
  const call = signedXdr ? describeCall(signedXdr) : {};
  if (signedXdr) {
    const tx = TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
    const classic = tx.operations.every((op) => op.type !== "invokeHostFunction" && op.type !== "createContract");
    if (classic) {
      const sent = await horizonFor().submitTransaction(tx);
      hash = sent.hash || tx.hash().toString("hex");
      await waitForHorizonTransaction(hash);
      tell({ ...call, hash, status: "confirmada" });
      return { hash, value: null };
    }
    const sent = await server.sendTransaction(tx);
    if (sent.status === "ERROR") {
      tell({ ...call, status: "rechazada" });
      throw new Error(t("La red rechazó la transacción"));
    }
    hash = sent.hash;
  }
  if (!hash) return null;
  tell({ ...call, hash, status: "pendiente" });
  const res = await server.pollTransaction(hash, { attempts: 30 });
  if (res.status !== "SUCCESS") {
    tell({ ...call, hash, status: "fallida" });
    throw new Error(t("La transacción falló ({status})", { status: res.status }));
  }
  tell({ ...call, hash, status: "confirmada" });
  return { hash, value: res.returnValue ? scValToNative(res.returnValue) : null };
}

/** Si la cuenta no existe en testnet, la fondea con Friendbot. */
export async function ensureFunded(dep, address) {
  try {
    await serverFor(dep).getAccount(address);
    return false;
  } catch {
    const r = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
    if (!r.ok) throw new Error(t("Friendbot no pudo fondear la cuenta"));
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

// ---------- Registro: memoria colectiva on-chain ----------

/** Lista los círculos registrados (hasta 50) con miembros y puntaje promedio. */
export async function readRegistry(dep) {
  if (!dep?.registro) return [];
  const server = serverFor(dep);
  const fichas = await view(server, dep.registro, "page", nativeToScVal(0, { type: "u32" }), nativeToScVal(50, { type: "u32" }));
  return Promise.all(
    fichas.map(async (f) => {
      const circle = String(f.circle);
      const [members, endorsements] = await Promise.all([
        view(server, circle, "members").catch(() => []),
        view(server, dep.registro, "endorsements", new Address(circle).toScVal()).catch(() => 0),
      ]);
      const scores = members.map((m) => Number(m.score)).filter((x) => x > 0);
      return {
        contractId: circle,
        name: String(f.name),
        region: String(f.region),
        created: Number(f.created),
        creator: String(f.creator),
        members: members.length,
        score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        endorsements: Number(endorsements),
      };
    })
  );
}

/**
 * Pasaporte de reputación: junta el historial de una persona en todos los
 * círculos donde se declaró miembro en el registro.
 */
export async function readPassport(dep, address) {
  if (!dep?.registro || !address) return { circles: [], history: [], score: 0 };
  const server = serverFor(dep);
  const ids = (await view(server, dep.registro, "by_member", new Address(address).toScVal()).catch(() => [])).map(String);
  const circles = await Promise.all(
    ids.map(async (id) => {
      const h = (await view(server, id, "history", new Address(address).toScVal()).catch(() => [])).map(Number);
      return { contractId: id, history: h };
    })
  );
  const history = circles.flatMap((c) => c.history);
  const score = scoreOf(history);
  return { circles, history, score };
}

export function buildRegisterXdr(dep, creator, circle, name, region) {
  return prepare(
    dep,
    creator,
    new Contract(dep.registro).call(
      "register",
      nativeToScVal(creator, { type: "address" }),
      nativeToScVal(circle, { type: "address" }),
      nativeToScVal(name, { type: "string" }),
      nativeToScVal(region, { type: "symbol" })
    )
  );
}

export function buildJoinXdr(dep, member, circle) {
  return prepare(
    dep,
    member,
    new Contract(dep.registro).call("join", nativeToScVal(member, { type: "address" }), nativeToScVal(circle, { type: "address" }))
  );
}

export function buildEndorseXdr(dep, member, circle) {
  return prepare(
    dep,
    member,
    new Contract(dep.registro).call("endorse", nativeToScVal(member, { type: "address" }), nativeToScVal(circle, { type: "address" }))
  );
}

export const explorerUrl = (contractId) => `https://stellar.expert/explorer/testnet/contract/${contractId}`;
export const txUrl = (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
