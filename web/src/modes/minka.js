import {
  Account, Address, BASE_FEE, Contract, Networks, Operation, TransactionBuilder,
  nativeToScVal, rpc, scValToNative, xdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

export const MINKA_VERSION = 1;
export const MINKA_DEMO = Object.freeze({
  title: "Riego para Tiraque",
  description: "Canales y reservorio para que el agua llegue a las parcelas de la comunidad.",
  token: "XLM",
  goal: 1200,
  deadlineDays: 24,
  milestones: [
    { title: "Trazar el canal", amount: 300 },
    { title: "Abrir la acequia", amount: 300 },
    { title: "Levantar el reservorio", amount: 360 },
    { title: "Probar el riego", amount: 240 },
  ],
});

const clone = (value) => structuredClone(value);

export function createMinkaDemo(now = Date.now()) {
  const backers = Array.from({ length: 12 }, (_, index) => ({
    address: `tiraque-${String(index + 1).padStart(2, "0")}`,
    name: ["Nayra", "Eusebio", "Marta", "Teófilo", "Luz", "Simón", "Rosa", "Mateo", "Elena", "Pablo", "Julia", "Andrés"][index],
    amount: 60,
    refunded: false,
  }));
  return {
    mode: "demo",
    title: MINKA_DEMO.title,
    description: MINKA_DEMO.description,
    token: MINKA_DEMO.token,
    goal: MINKA_DEMO.goal,
    raised: 720,
    released: 0,
    deadline: Math.floor(now / 1000) + MINKA_DEMO.deadlineDays * 86400,
    canceled: false,
    nextMilestone: 0,
    refundedTotal: 0,
    refundedContributions: 0,
    organizer: "organizacion-tiraque",
    validators: ["comite-agua", "regante-01", "regante-02"],
    backers,
    milestones: MINKA_DEMO.milestones.map((milestone) => ({
      ...milestone, evidence: null, approvals: [], released: false,
    })),
  };
}

function fail(code) { throw new Error(code); }

export function fundMinkaDemo(state, address, amount, now = Date.now()) {
  const next = clone(state);
  const value = Number(amount);
  if (next.canceled || now / 1000 > next.deadline) fail("PROJECT_CLOSED");
  if (!(value > 0) || !Number.isFinite(value) || next.raised + value > next.goal) fail("INVALID_AMOUNT");
  let backer = next.backers.find((item) => item.address === address);
  if (!backer) {
    backer = { address, name: "Vos", amount: 0, refunded: false };
    next.backers.push(backer);
  }
  backer.amount += value;
  next.raised += value;
  return next;
}

export function submitMinkaEvidence(state, organizer, milestoneIndex, uri) {
  const next = clone(state);
  if (organizer !== next.organizer) fail("NOT_ORGANIZER");
  if (next.canceled || next.raised < next.goal) fail("PROJECT_NOT_READY");
  if (milestoneIndex !== next.nextMilestone || !next.milestones[milestoneIndex]) fail("OUT_OF_ORDER");
  if (!String(uri).trim()) fail("INVALID_EVIDENCE");
  next.milestones[milestoneIndex].evidence = String(uri).trim();
  return next;
}

export function approveMinkaMilestone(state, validator, milestoneIndex) {
  const next = clone(state);
  const milestone = next.milestones[milestoneIndex];
  if (!next.validators.includes(validator)) fail("NOT_VALIDATOR");
  if (next.canceled || next.raised < next.goal) fail("PROJECT_NOT_READY");
  if (milestoneIndex !== next.nextMilestone || !milestone) fail("OUT_OF_ORDER");
  if (!milestone.evidence) fail("EVIDENCE_REQUIRED");
  if (milestone.approvals.includes(validator)) fail("ALREADY_APPROVED");
  milestone.approvals.push(validator);
  if (milestone.approvals.length > next.validators.length / 2) {
    milestone.released = true;
    next.released += milestone.amount;
    next.nextMilestone += 1;
  }
  return next;
}

export function cancelMinkaDemo(state, organizer) {
  const next = clone(state);
  if (organizer !== next.organizer) fail("NOT_ORGANIZER");
  if (next.canceled || next.nextMilestone >= next.milestones.length) fail("PROJECT_CLOSED");
  next.canceled = true;
  return next;
}

export function refundMinkaDemo(state, address, now = Date.now()) {
  const next = clone(state);
  const backer = next.backers.find((item) => item.address === address);
  if (!next.canceled && !(Math.floor(now / 1000) > next.deadline && next.raised < next.goal)) fail("REFUND_UNAVAILABLE");
  if (!backer || backer.refunded || backer.amount <= 0) fail("NOTHING_TO_REFUND");
  const pool = next.raised - next.released;
  let amount = Math.floor((backer.amount * pool) / next.raised);
  if (next.refundedContributions + backer.amount === next.raised) amount = pool - next.refundedTotal;
  backer.refunded = true;
  backer.refundAmount = amount;
  next.refundedTotal += amount;
  next.refundedContributions += backer.amount;
  return { state: next, amount };
}

// Chain client: views are simulated from a null source account; writes are
// prepared with the connected account and signed by the wallet in the view.
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const rpcByUrl = new Map();
const serverFor = (deployment) => {
  const url = deployment?.rpc || "https://soroban-testnet.stellar.org";
  if (!rpcByUrl.has(url)) rpcByUrl.set(url, new rpc.Server(url));
  return rpcByUrl.get(url);
};
const address = (value) => nativeToScVal(value, { type: "address" });
const integer = (value, type) => nativeToScVal(BigInt(value), { type });
const str = (value) => nativeToScVal(value, { type: "string" });

async function simulatedView(deployment, contractId, method, ...args) {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  }).addOperation(new Contract(contractId).call(method, ...args)).setTimeout(30).build();
  const result = await serverFor(deployment).simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(result.error);
  return scValToNative(result.result.retval);
}

export async function readMinka(deployment, contractId, backer = null) {
  const [raw, milestones, myContribution] = await Promise.all([
    simulatedView(deployment, contractId, "info"),
    simulatedView(deployment, contractId, "milestones"),
    backer ? simulatedView(deployment, contractId, "backer", address(backer)).catch(() => 0) : Promise.resolve(null),
  ]);
  const info = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value]));
  return {
    mode: "testnet", ...info,
    goal: Number(info.goal), raised: Number(info.raised), released: Number(info.released),
    deadline: Number(info.deadline), nextMilestone: Number(info.next_milestone ?? info.nextMilestone),
    myContribution: myContribution == null ? null : Number(myContribution),
    milestones: milestones.map((item) => ({
      title: String(item.title), amount: Number(item.amount), evidence: item.evidence || null,
      approvals: Number(item.approvals), released: Boolean(item.released),
    })),
  };
}

async function prepareCall(deployment, contractId, source, method, ...args) {
  const server = serverFor(deployment);
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(contractId).call(method, ...args)).setTimeout(120).build();
  return (await server.prepareTransaction(tx)).toXDR();
}

export const buildMinkaFundXdr = (dep, id, backer, amount) => prepareCall(dep, id, backer, "fund", address(backer), integer(amount, "i128"));
export const buildMinkaEvidenceXdr = (dep, id, organizer, milestone, uri) => prepareCall(dep, id, organizer, "submit_evidence", address(organizer), integer(milestone, "u32"), str(uri));
export const buildMinkaApproveXdr = (dep, id, validator, milestone) => prepareCall(dep, id, validator, "approve", address(validator), integer(milestone, "u32"));
export const buildMinkaRefundXdr = (dep, id, backer) => prepareCall(dep, id, backer, "refund", address(backer));
export const buildMinkaCancelXdr = (dep, id, organizer) => prepareCall(dep, id, organizer, "cancel", address(organizer));

export async function buildMinkaCreateXdr(deployment, organizer, { token, title, goal, milestones, deadline, validators }) {
  if (!deployment?.wasmHash) throw new Error("Falta el hash del contrato Minka para desplegarlo");
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  const args = [
    address(organizer), address(token), str(title), integer(goal, "i128"),
    nativeToScVal(milestones.map((item) => ({ title: item.title, amount: BigInt(item.amount) })), {
      type: { title: ["string", null], amount: ["i128", null] },
    }), integer(deadline, "u64"),
    xdr.ScVal.scvVec(validators.map(address)),
  ];
  const operation = Operation.createCustomContract({
    address: new Address(organizer),
    wasmHash: Buffer.from(deployment.wasmHash, "hex"), salt: Buffer.from(salt), constructorArgs: args,
  });
  const server = serverFor(deployment);
  const account = await server.getAccount(organizer);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(operation).setTimeout(120).build();
  return (await server.prepareTransaction(tx)).toXDR();
}

export async function submitMinkaTransaction(deployment, { signedXdr, hash }) {
  const server = serverFor(deployment);
  if (signedXdr) {
    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET));
    if (sent.status === "ERROR") throw new Error("La red rechazó la transacción");
    hash = sent.hash;
  }
  if (!hash) return null;
  const result = await server.pollTransaction(hash, { attempts: 30 });
  if (result.status !== "SUCCESS") throw new Error(`La transacción falló (${result.status})`);
  return { hash, value: result.returnValue ? scValToNative(result.returnValue) : null };
}
