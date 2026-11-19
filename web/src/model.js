// Modelo del círculo, igual para el modo demo (simulado en el navegador) y
// para el modo testnet (leído del contrato). Marcas: 1 a tiempo, 2 tarde, 3 faltó.

export const ON_TIME = 1;
export const LATE = 2;
export const MISSED = 3;
/** Faltó, pero su garantía cubrió la cuota. */
export const COVERED = 4;
const POINTS = { [ON_TIME]: 100, [LATE]: 50, [COVERED]: 25 };

export function score(history) {
  if (!history.length) return 0;
  const pts = history.reduce((a, m) => a + (POINTS[m] || 0), 0);
  return Math.round(pts / history.length);
}

/** Lo que una reputación desbloquea (ilustrativo, para el pitch). */
export function creditLine(history, amount) {
  const s = score(history);
  const rounds = history.length;
  if (rounds < 2 || s < 60) return 0;
  return Math.round(amount * rounds * (s / 100) * 1.5);
}

const PEOPLE = [
  { name: "Doña Rosa", role: "Comerciante · La Cancha" },
  { name: "Don Teo", role: "Productor de papa · Tiraque" },
  { name: "Mery", role: "Costurera · Quillacollo" },
  { name: "Iván", role: "Mototaxista · Sacaba" },
  { name: "Sonia", role: "Profesora · Cercado" },
  { name: "Wilber", role: "Albañil · Vinto" },
];

export function demoCircle() {
  const members = PEOPLE.map((p, i) => ({
    ...p,
    address: "G" + "DEMO".padEnd(55, String.fromCharCode(65 + i)),
    history: [],
    // Mery y Wilber dejaron una cuota de garantía al entrar
    guarantee: i === 2 || i === 5 ? 100 : 0,
  }));
  // Orden "sorteado" (en la cadena lo sortea el PRNG de la red)
  const order = [2, 0, 4, 1, 5, 3];
  const c = {
    mode: "demo",
    token: "USDC",
    amount: 100,
    periodDays: 7,
    members,
    order,
    round: 0,
    paid: new Map(),
    payouts: [],
    apy: 0.062,
    contractId: null,
  };
  // Tres rondas ya jugadas para que el aguayo tenga historia
  const script = [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1, 1],
    [1, 1, 1, 2, 3, 1],
  ];
  for (const marks of script) {
    marks.forEach((m, i) => {
      if (m !== MISSED) c.paid.set(i, m);
    });
    payout(c);
  }
  return c;
}

export function recipientOf(c, round = c.round) {
  return round < c.order.length ? c.order[round] : null;
}

export function pot(c) {
  return c.paid.size * c.amount;
}

export function contribute(c, i, late = false) {
  if (c.round >= c.order.length || c.paid.has(i)) return null;
  const m = late ? LATE : ON_TIME;
  c.paid.set(i, m);
  return m;
}

export function payout(c) {
  if (c.round >= c.order.length) return null;
  let covered = 0;
  c.members.forEach((mem, i) => {
    let mark = c.paid.get(i);
    if (!mark) {
      if ((mem.guarantee || 0) >= c.amount) {
        mem.guarantee -= c.amount;
        covered += 1;
        mark = COVERED;
      } else mark = MISSED;
    }
    mem.history.push(mark);
  });
  const to = recipientOf(c);
  const amount = pot(c) + covered * c.amount;
  c.payouts.push({ round: c.round, to, amount });
  c.round += 1;
  c.paid = new Map();
  return { to, amount };
}

/** Deposita una cuota de garantía (una sola vez, antes de que termine el círculo). */
export function depositGuarantee(c, i) {
  const m = c.members[i];
  if (!m || c.round >= c.order.length || (m.guarantee || 0) > 0) return false;
  m.guarantee = c.amount;
  return true;
}

/** Rendimiento estimado del pozo mientras espera (proyección, no real). */
export function idleYield(c) {
  const days = c.periodDays / 2;
  return pot(c) * c.apy * (days / 365);
}
