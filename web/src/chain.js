// Lectura del contrato en Stellar testnet (simulación, sin firmar nada) y
// armado de la transacción de aporte para que la firme la billetera.
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

// Cuenta nula: la simulación no verifica la secuencia de la cuenta de origen.
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const DECIMALS = 1e7;

export async function loadDeployment() {
  try {
    const r = await fetch("/testnet.json", { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function view(server, contractId, method, ...args) {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return scValToNative(sim.result.retval);
}

/** Lee el círculo real y lo devuelve con la misma forma que el modo demo. */
export async function readCircle(dep) {
  const server = new rpc.Server(dep.rpc);
  const id = dep.contractId;
  const cfg = await view(server, id, "get_config");
  const info = await view(server, id, "round_info");
  const names = Object.fromEntries(Object.entries(dep.members || {}).map(([n, a]) => [a, n]));
  const order = cfg.members.map(String);
  const histories = await Promise.all(
    order.map((a) => view(server, id, "history", new Address(a).toScVal()))
  );
  const members = order.map((address, i) => ({
    name: cap(names[address] || address.slice(0, 4) + "…" + address.slice(-4)),
    role: "Cuenta de testnet",
    address,
    history: histories[i].map(Number),
  }));
  // Quién ya pagó la ronda actual: lo deducimos del largo del historial
  const round = Number(info.round);
  const paid = new Map();
  members.forEach((m, i) => {
    if (m.history.length > round) paid.set(i, m.history[round]);
  });
  members.forEach((m) => (m.history = m.history.slice(0, round)));
  return {
    mode: "testnet",
    token: dep.tokenSymbol || "XLM",
    amount: Number(cfg.amount) / DECIMALS,
    periodDays: Number(cfg.period) / 86400,
    periodSeconds: Number(cfg.period),
    deadline: Number(info.deadline),
    members,
    order: members.map((_, i) => i),
    round,
    paid,
    payouts: [],
    apy: 0.062,
    contractId: id,
  };
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Transacción de aporte lista para firmar (XDR), con recursos ya calculados. */
export async function buildContributeXdr(dep, memberAddress) {
  const server = new rpc.Server(dep.rpc);
  const source = await server.getAccount(memberAddress);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(
      new Contract(dep.contractId).call("contribute", nativeToScVal(memberAddress, { type: "address" }))
    )
    .setTimeout(60)
    .build();
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

export function explorerUrl(contractId) {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}
