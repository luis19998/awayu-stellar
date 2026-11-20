import { Account, Address, BASE_FEE, Contract, Networks, TransactionBuilder, nativeToScVal, rpc, scValToNative } from "@stellar/stellar-sdk";

const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
export const DECIMALS = 1e7;
const PASS = Networks.TESTNET;
const RPC_DEFAULT = "https://soroban-testnet.stellar.org";
const servers = new Map();
const serverFor = (deployment = {}) => {
  const url = deployment.rpc || RPC_DEFAULT;
  if (!servers.has(url)) servers.set(url, new rpc.Server(url));
  return servers.get(url);
};
const addr = (value) => nativeToScVal(value, { type: "address" });
const amount = (value) => nativeToScVal(BigInt(Math.round(Number(value) * DECIMALS)), { type: "i128" });

const names = ["Rosa", "Mateo", "Luz", "Nayra", "Diego", "Elena", "Javier", "Sofi"];
const sampleRequests = [
  { id: 0, member: 2, amount: 24, reason: "Medicinas para mi mamá", yes: 4, no: 1, resolved: false, approved: false },
  { id: 1, member: 5, amount: 18, reason: "Reparar el techo antes de la lluvia", yes: 2, no: 0, resolved: false, approved: false },
  { id: 2, member: 1, amount: 12, reason: "Herramientas para el taller", yes: 5, no: 1, resolved: true, approved: true },
];

/** Demo independiente: las cantidades son XLM ilustrativos y todo vive en memoria. */
export function createAyniDemo() {
  const state = {
    mode: "demo", token: "XLM", monthly: 10, quorumBps: 5000, maxRequest: 35,
    members: names.map((name, i) => ({ address: `GDEMO${i}`, name, contributed: 20 + i * 10, received: i === 1 ? 12 : 0, repaid: i === 1 ? 12 : 0, reputation: i === 1 ? 1 : 0, lastContribution: 0 })),
    fund: 138, requests: sampleRequests.map((r) => ({ ...r })), history: [
      { kind: "repay", member: 1, amount: 12, label: "Mateo devolvió su ayuda" },
      { kind: "contribute", member: 4, amount: 10, label: "Diego aportó al fondo" },
      { kind: "request", member: 2, amount: 24, label: "Nayra pidió ayuda" },
    ],
  };
  const byMember = (id) => {
    const member = typeof id === "number" ? state.members[id] : state.members.find((m) => m.address === id || m.name === id);
    if (!member) throw new Error("No encontramos a esa persona en el fondo.");
    return member;
  };
  return {
    state,
    contribute(memberId, now = Date.now()) {
      const member = byMember(memberId);
      if (now - member.lastContribution < 30 * 86400_000) throw new Error("Ya aportaste en este período de 30 días.");
      member.lastContribution = now; member.contributed += state.monthly; state.fund += state.monthly;
      state.history.unshift({ kind: "contribute", member: state.members.indexOf(member), amount: state.monthly, label: `${member.name} aportó al fondo` });
      return state;
    },
    request(memberId, value, reason) {
      const member = byMember(memberId); const amountValue = Number(value);
      if (state.requests.some((r) => r.member === state.members.indexOf(member) && !r.resolved)) throw new Error("Ya tienes un pedido abierto.");
      if (!Number.isFinite(amountValue) || amountValue <= 0 || amountValue > state.maxRequest) throw new Error("El monto supera el máximo permitido o no es válido.");
      const reserved = state.requests.filter((r) => !r.resolved).reduce((sum, r) => sum + r.amount, 0);
      if (amountValue > state.fund - reserved) throw new Error("El fondo todavía no tiene ese monto disponible.");
      if (!String(reason || "").trim()) throw new Error("Cuéntanos brevemente para qué necesitas la ayuda.");
      const id = state.requests.length; state.requests.unshift({ id, member: state.members.indexOf(member), amount: amountValue, reason: String(reason).trim(), yes: 0, no: 0, resolved: false, approved: false });
      state.history.unshift({ kind: "request", member: state.members.indexOf(member), amount: amountValue, label: `${member.name} pidió ayuda` }); return id;
    },
    vote(voterId, requestId, approve) {
      const voter = state.members.indexOf(byMember(voterId)); const item = state.requests.find((r) => r.id === Number(requestId));
      if (!item || item.resolved) throw new Error("Ese pedido ya se cerró o no existe.");
      if (voter === item.member) throw new Error("Quien pide ayuda no vota su propio pedido.");
      item.voters ||= [];
      if (item.voters.includes(voter)) throw new Error("Ya votaste este pedido.");
      item.voters.push(voter); if (approve) item.yes++; else item.no++;
      state.history.unshift({ kind: "vote", member: voter, amount: 0, label: `${state.members[voter].name} votó ${approve ? "a favor" : "en contra"}` });
      return item;
    },
    resolve(requestId) {
      const item = state.requests.find((r) => r.id === Number(requestId)); if (!item || item.resolved) throw new Error("Ese pedido ya se cerró o no existe.");
      const eligible = state.members.length - 1; const needed = Math.ceil(eligible * state.quorumBps / 10_000);
      const accepted = item.yes >= needed; const rejected = eligible - item.no < needed;
      if (!accepted && !rejected) return false;
      item.resolved = true; item.approved = accepted;
      if (accepted) { state.fund -= item.amount; const member = state.members[item.member]; member.received += item.amount; member.debt = (member.debt || 0) + item.amount; }
      state.history.unshift({ kind: accepted ? "approved" : "rejected", member: item.member, amount: item.amount, label: accepted ? "La comunidad aprobó un pedido" : "La comunidad rechazó un pedido" }); return true;
    },
    repay(memberId, value) {
      const member = byMember(memberId); const repayAmount = Number(value); const debt = member.debt || 0;
      if (!Number.isFinite(repayAmount) || repayAmount <= 0 || repayAmount > debt) throw new Error("El monto debe ser positivo y no superar tu saldo por devolver.");
      member.debt = debt - repayAmount; member.repaid += repayAmount; member.reputation++; state.fund += repayAmount;
      state.history.unshift({ kind: "repay", member: state.members.indexOf(member), amount: repayAmount, label: `${member.name} devolvió su ayuda` }); return state;
    },
    member(id) { const m = byMember(id); return { contributed: m.contributed, received: m.received, repaid: m.repaid, reputation: m.reputation }; },
    fund() { return state.fund; }, requests(start = 0, limit = 50) { return state.requests.slice(start, start + limit); },
  };
}

async function prepare(deployment, source, operation) {
  const server = serverFor(deployment); const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASS }).addOperation(operation).setTimeout(120).build();
  return (await server.prepareTransaction(tx)).toXDR();
}
async function view(deployment, contractId, method, ...args) {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), { fee: BASE_FEE, networkPassphrase: PASS })
    .addOperation(new Contract(contractId).call(method, ...args)).setTimeout(30).build();
  const result = await serverFor(deployment).simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(result.error);
  return scValToNative(result.result.retval);
}

export const buildContributeXdr = (dep, contractId, member) => prepare(dep, member, new Contract(contractId).call("contribute", addr(member)));
export const buildRequestXdr = (dep, contractId, member, value, reason) => prepare(dep, member, new Contract(contractId).call("request", addr(member), amount(value), nativeToScVal(reason, { type: "string" })));
export const buildVoteXdr = (dep, contractId, voter, requestId, approve) => prepare(dep, voter, new Contract(contractId).call("vote", addr(voter), nativeToScVal(requestId, { type: "u32" }), nativeToScVal(Boolean(approve), { type: "bool" })));
export const buildResolveXdr = (dep, contractId, caller, requestId) => prepare(dep, caller, new Contract(contractId).call("resolve", nativeToScVal(requestId, { type: "u32" })));
export const buildRepayXdr = (dep, contractId, member, value) => prepare(dep, member, new Contract(contractId).call("repay", addr(member), amount(value)));
export const readFund = (dep, contractId) => view(dep, contractId, "fund").then((v) => Number(v) / DECIMALS);
export const readRequests = (dep, contractId, start = 0, limit = 50) => view(dep, contractId, "requests", nativeToScVal(start, { type: "u32" }), nativeToScVal(limit, { type: "u32" }));
export const readMember = (dep, contractId, member) => view(dep, contractId, "member", addr(member));
export const readVersion = (dep, contractId) => view(dep, contractId, "version").then(Number);
