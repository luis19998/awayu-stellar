import {
  Account, Address, BASE_FEE, Contract, Networks, TransactionBuilder,
  nativeToScVal, rpc, scValToNative,
} from "@stellar/stellar-sdk";

export const WEEK_SECONDS = 7 * 24 * 60 * 60;
export const DEMO_GOALS = [
  { id: 0, title: "Una casita", kind: "casa", target: 1200, saved: 780, unlockAt: 1797465600, members: ["Tú", "Rosa"], contributions: { Tú: 480, Rosa: 300 }, streaks: { Tú: 4, Rosa: 2 } },
  { id: 1, title: "Mi primer auto", kind: "auto", target: 5000, saved: 1650, unlockAt: 1800144000, members: ["Tú", "Diego", "Marta"], contributions: { Tú: 700, Diego: 550, Marta: 400 }, streaks: { Tú: 3, Diego: 1, Marta: 5 } },
  { id: 2, title: "Terminar mis estudios", kind: "estudio", target: 2400, saved: 2400, unlockAt: 1802822400, members: ["Tú", "Rosa"], contributions: { Tú: 1400, Rosa: 1000 }, streaks: { Tú: 6, Rosa: 4 } },
  { id: 3, title: "Abrir mi tienda", kind: "negocio", target: 3600, saved: 920, unlockAt: 1805500800, members: ["Tú", "Marta", "Diego"], contributions: { Tú: 400, Marta: 320, Diego: 200 }, streaks: { Tú: 2, Marta: 3, Diego: 1 } },
  { id: 4, title: "Conocer el Titicaca", kind: "viaje", target: 900, saved: 360, unlockAt: 1808179200, members: ["Tú"], contributions: { Tú: 360 }, streaks: { Tú: 3 } },
  { id: 5, title: "Cuidar mi salud", kind: "salud", target: 1500, saved: 1120, unlockAt: 1810857600, members: ["Tú", "Rosa", "Marta"], contributions: { Tú: 500, Rosa: 320, Marta: 300 }, streaks: { Tú: 5, Rosa: 3, Marta: 2 } },
].map((goal) => ({ ...goal, token: "XLM", closed: false, exitHistory: [] }));

export function createDemoGoals() {
  return DEMO_GOALS.map((goal) => ({ ...goal, members: [...goal.members], contributions: { ...goal.contributions }, streaks: { ...goal.streaks }, exitHistory: [] }));
}

export function progressOf(goal) {
  return { saved: Math.max(0, Number(goal?.saved) || 0), target: Math.max(0, Number(goal?.target) || 0), ratio: goal?.target > 0 ? Math.min(1, Math.max(0, goal.saved / goal.target)) : 0 };
}

export function streakOf(goal, member) {
  return Math.max(0, Number(goal?.streaks?.[member]) || 0);
}

export function depositDemo(goals, goalId, member, amount, at = Math.floor(Date.now() / 1000)) {
  const list = goals.map((goal) => ({ ...goal, contributions: { ...goal.contributions }, streaks: { ...goal.streaks } }));
  const goal = list.find((item) => item.id === Number(goalId));
  if (!goal || goal.closed || !goal.members.includes(member) || !(amount > 0)) throw new Error("No se pudo registrar el aporte");
  const week = Math.floor(at / WEEK_SECONDS);
  const lastWeek = goal.lastDepositWeek?.[member];
  goal.streaks[member] = lastWeek == null ? 1 : week === lastWeek ? goal.streaks[member] : week === lastWeek + 1 ? goal.streaks[member] + 1 : 1;
  goal.lastDepositWeek ||= {};
  goal.lastDepositWeek[member] = week;
  goal.saved += amount;
  goal.contributions[member] = (goal.contributions[member] || 0) + amount;
  return list;
}

export function withdrawDemo(goals, goalId, now = Math.floor(Date.now() / 1000)) {
  const list = goals.map((goal) => ({ ...goal, contributions: { ...goal.contributions } }));
  const goal = list.find((item) => item.id === Number(goalId));
  if (!goal || goal.closed || (goal.saved < goal.target && now < goal.unlockAt)) throw new Error("Todavía no se puede retirar");
  const paid = { ...goal.contributions };
  goal.saved = 0; goal.contributions = Object.fromEntries(Object.keys(paid).map((member) => [member, 0])); goal.closed = true;
  return { goals: list, paid };
}

export function earlyExitDemo(goals, goalId, member, now = Math.floor(Date.now() / 1000)) {
  const list = goals.map((goal) => ({ ...goal, contributions: { ...goal.contributions }, exitHistory: [...(goal.exitHistory || [])] }));
  const goal = list.find((item) => item.id === Number(goalId));
  if (!goal || goal.closed || !goal.members.includes(member) || goal.saved >= goal.target || now >= goal.unlockAt) throw new Error("No se puede retirar este aporte ahora");
  const amount = goal.contributions[member] || 0;
  if (!amount) throw new Error("No tienes aportes para retirar");
  goal.contributions[member] = 0; goal.saved -= amount; goal.exitHistory.push({ member, at: now, amount });
  return { goals: list, amount };
}

const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const DEFAULT = { rpc: "https://soroban-testnet.stellar.org", passphrase: Networks.TESTNET };
const servers = new Map();
function serverFor(dep) {
  const url = dep?.rpc || DEFAULT.rpc;
  if (!servers.has(url)) servers.set(url, new rpc.Server(url));
  return servers.get(url);
}
function addr(value) { return new Address(value).toScVal(); }
function num(value, type) { return nativeToScVal(BigInt(value), { type }); }
async function simulate(dep, method, ...args) {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), { fee: BASE_FEE, networkPassphrase: dep?.passphrase || DEFAULT.passphrase })
    .addOperation(new Contract(dep.alasitasContractId).call(method, ...args)).setTimeout(30).build();
  const sim = await serverFor(dep).simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return scValToNative(sim.result.retval);
}
async function prepare(dep, source, method, args) {
  const server = serverFor(dep);
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: dep?.passphrase || DEFAULT.passphrase })
    .addOperation(new Contract(dep.alasitasContractId).call(method, ...args)).setTimeout(120).build();
  return (await server.prepareTransaction(tx)).toXDR();
}

function normalizeGoal(raw) {
  return {
    id: Number(raw.id), owner: String(raw.owner), tokenId: String(raw.token), title: String(raw.title),
    kind: String(raw.kind), target: Number(raw.target), unlockAt: Number(raw.unlock_at ?? raw.unlockAt),
    members: (raw.members || []).map(String), saved: Number(raw.saved), closed: Boolean(raw.closed),
  };
}
function toDisplayUnits(goal, dep) {
  const decimals = Number(dep?.decimals) || 1e7;
  return { ...goal, target: goal.target / decimals, saved: goal.saved / decimals, token: dep?.tokenSymbol || "XLM" };
}
export async function readGoal(dep, goalId) { return toDisplayUnits(normalizeGoal(await simulate(dep, "goal", num(goalId, "u32"))), dep); }
export async function readGoals(dep, owner) {
  const goals = await simulate(dep, "goals_of", addr(owner));
  return goals.map((goal) => toDisplayUnits(normalizeGoal(goal), dep));
}
export async function readProgress(dep, goalId) {
  const [saved, target] = await simulate(dep, "progress", num(goalId, "u32"));
  const decimals = Number(dep?.decimals) || 1e7;
  return { saved: Number(saved) / decimals, target: Number(target) / decimals };
}
export async function readStreak(dep, member, goalId) { return Number(await simulate(dep, "streak", addr(member), num(goalId, "u32"))); }
export async function readExitHistory(dep, member, goalId) {
  return (await simulate(dep, "exit_history", addr(member), num(goalId, "u32"))).map(Number);
}
export async function readVersion(dep) { return Number(await simulate(dep, "version")); }

export function buildCreateGoalXdr(dep, owner, { title, kind, target, unlockAt, members }) {
  return prepare(dep, owner, "create_goal", [addr(owner), addr(dep.token), nativeToScVal(title, { type: "string" }), nativeToScVal(kind, { type: "symbol" }), num(Math.round(Number(target) * (dep.decimals || 1e7)), "i128"), num(unlockAt, "u64"), nativeToScVal(members.map((member) => new Address(member)), { type: "vec" })]);
}
export function buildDepositXdr(dep, member, goalId, amount) {
  return prepare(dep, member, "deposit", [addr(member), num(goalId, "u32"), num(Math.round(Number(amount) * (dep.decimals || 1e7)), "i128")]);
}
export function buildWithdrawGoalXdr(dep, owner, goalId) { return prepare(dep, owner, "withdraw", [addr(owner), num(goalId, "u32")]); }
export function buildEarlyExitXdr(dep, member, goalId) { return prepare(dep, member, "early_exit", [addr(member), num(goalId, "u32")]); }

export async function submit(dep, { signedXdr, hash } = {}) {
  const server = serverFor(dep);
  const passphrase = dep?.passphrase || DEFAULT.passphrase;
  if (signedXdr) {
    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, passphrase));
    if (sent.status === "ERROR") throw new Error("La red rechazó la transacción");
    hash = sent.hash;
  }
  if (!hash) return null;
  const result = await server.pollTransaction(hash, { attempts: 30 });
  if (result.status !== "SUCCESS") throw new Error(`La transacción falló (${result.status})`);
  return { hash, value: result.returnValue ? scValToNative(result.returnValue) : null };
}
