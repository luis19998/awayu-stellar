// Modelo del círculo, igual para el modo demo (simulado en el navegador) y
// para el modo testnet (leído del contrato). Marcas: 1 a tiempo, 2 tarde, 3 faltó.

export const ON_TIME = 1;
export const LATE = 2;
export const MISSED = 3;

export function score(history) {
  if (!history.length) return 0;
  const pts = history.reduce((a, m) => a + (m === ON_TIME ? 100 : m === LATE ? 50 : 0), 0);
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
  c.members.forEach((mem, i) => mem.history.push(c.paid.get(i) ?? MISSED));
  const to = recipientOf(c);
  const amount = pot(c);
  c.payouts.push({ round: c.round, to, amount });
  c.round += 1;
  c.paid = new Map();
  return { to, amount };
}

/** Rendimiento estimado del pozo mientras espera (proyección, no real). */
export function idleYield(c) {
  const days = c.periodDays / 2;
  return pot(c) * c.apy * (days / 365);
}
