/** Motor estadístico educativo para círculos Awayu. No es una evaluación
 * crediticia ni una predicción garantizada: modela pagos futuros con el
 * promedio posterior de un modelo Beta-Bernoulli.
 */

const Z90 = 1.6448536269514722;

/**
 * Estima la probabilidad de aporte a tiempo de un miembro.
 * Marcas: 1 = éxito; 2 = medio éxito y medio fallo; 3 = un fallo;
 * 4 = cubierto por garantía (0.75 fallo). Devuelve media e intervalo normal
 * aproximado del 90 % para la posterior Beta(a + éxitos, b + fallos).
 */
export function memberReliability(history = [], prior = { a: 2, b: 1 }) {
  const a0 = Number.isFinite(prior?.a) && prior.a > 0 ? prior.a : 2;
  const b0 = Number.isFinite(prior?.b) && prior.b > 0 ? prior.b : 1;
  let successes = 0;
  let failures = 0;
  for (const mark of Array.isArray(history) ? history : []) {
    if (mark === 1) successes += 1;
    else if (mark === 2) { successes += 0.5; failures += 0.5; }
    else if (mark === 3) failures += 1;
    else if (mark === 4) failures += 0.75;
  }
  const a = a0 + successes;
  const b = b0 + failures;
  const mean = a / (a + b);
  const variance = (a * b) / (((a + b) ** 2) * (a + b + 1));
  const radius = Z90 * Math.sqrt(variance);
  return { mean, low: Math.max(0, mean - radius), high: Math.min(1, mean + radius) };
}

function seededRandom(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simula las rondas pendientes de un círculo. Miembros con `paid` ya
 * registrados aportan según su marca; cada falta consume como máximo una
 * cuota (`amount`) de garantía. Las faltas sin cobertura reducen el pozo.
 * `expectedPotByRound` queda alineado con las rondas pendientes y
 * `expectedLossByRecipient` expresa la pérdida promedio por destinatario.
 * Una seed idéntica produce exactamente el mismo resultado.
 */
/**
 * Probabilidad de que una persona pague su cuota en una ronda (a tiempo o tarde: el pozo se llena igual).
 * Distinta de la puntualidad que muestra memberReliability. El prior Beta(9, 1) supone que 9 de cada 10
 * personas pagan su cuota, como es habitual en los pasanakus que funcionan por confianza.
 */
export function paymentProbability(history = [], prior = { a: 9, b: 1 }) {
  let a = prior.a;
  let b = prior.b;
  for (const mark of Array.isArray(history) ? history : []) {
    if (mark === 1 || mark === 2) a += 1;
    else if (mark === 3 || mark === 4) b += 1;
  }
  return a / (a + b);
}

export function simulateCircle(circle, { runs = 5000, seed = 1 } = {}) {
  const members = Array.isArray(circle?.members) ? circle.members : [];
  const order = Array.isArray(circle?.order) ? circle.order : [];
  const amount = Number.isFinite(circle?.amount) && circle.amount > 0 ? circle.amount : 0;
  const start = Math.min(Math.max(0, Number(circle?.round) || 0), order.length);
  const count = Math.max(0, Math.floor(Number(runs) || 0));
  const remaining = order.length - start;
  const potSums = Array(remaining).fill(0);
  const losses = Array(members.length).fill(0);
  const missCounts = Array(remaining * members.length + 1).fill(0);
  if (!count) return {
    completionProbability: 0,
    expectedPotByRound: potSums,
    expectedLossByRecipient: losses.map((expectedLoss, memberIndex) => ({ memberIndex, expectedLoss })),
    missDistribution: missCounts.map((nMisses, i) => ({ nMisses: i, probability: 0 })),
    runs: 0,
  };

  const reliability = members.map((m) => paymentProbability(m?.history));
  let completed = 0;
  for (let run = 0; run < count; run++) {
    const random = seededRandom((Number(seed) >>> 0) ^ Math.imul(run + 1, 0x9e3779b1));
    const reserves = members.map((m) => Math.max(0, Number(m?.guarantee) || 0));
    let allFull = true;
    let uncovered = 0;
    for (let offset = 0; offset < remaining; offset++) {
      const r = start + offset;
      let received = 0;
      const paid = r === start && circle?.paid instanceof Map ? circle.paid : null;
      members.forEach((_, i) => {
        const mark = paid?.get(i);
        if (mark === 1 || mark === 2) received += amount;
        else if (mark === 3 || mark === 4) {
          if (mark === 4) received += amount;
          else if (reserves[i] >= amount && amount > 0) { reserves[i] -= amount; received += amount; }
          else uncovered += 1;
        } else if (random() < reliability[i]) received += amount;
        else if (reserves[i] >= amount && amount > 0) { reserves[i] -= amount; received += amount; }
        else uncovered += 1;
      });
      const recipient = order[r];
      const loss = Math.max(0, members.length * amount - received);
      potSums[offset] += received;
      if (Number.isInteger(recipient) && recipient >= 0 && recipient < losses.length) losses[recipient] += loss;
      if (loss > 0) allFull = false;
    }
    if (allFull) completed += 1;
    missCounts[uncovered] += 1;
  }
  return {
    completionProbability: completed / count,
    expectedPotByRound: potSums.map((sum) => sum / count),
    expectedLossByRecipient: losses.map((sum, memberIndex) => ({ memberIndex, expectedLoss: sum / count })),
    missDistribution: missCounts.map((n, nMisses) => ({ nMisses, probability: n / count })),
    runs: count,
  };
}

/** Devuelve la probabilidad uniforme de cada índice de posición. */
export function turnProbabilities(n) {
  const size = Math.max(0, Math.floor(Number(n) || 0));
  return Array(size).fill(size ? 1 / size : 0);
}

/** Resumen didáctico del sorteo. `order` se conserva y no se vuelve a sortear. */
export function fairDrawProof(order, seed) {
  return {
    order: Array.isArray(order) ? [...order] : [],
    seed,
    probabilities: turnProbabilities(Array.isArray(order) ? order.length : 0),
    explanation: "En el contrato, el constructor fija el orden usando el PRNG de la red. Esta explicación describe el sorteo registrado; la simulación educativa no reemplaza ni verifica la aleatoriedad del consenso.",
  };
}

/** Bajo: ≥80 %; medio: ≥50 % y <80 %; alto: <50 % de completar. */
export function riskLevel(p) {
  const probability = Math.max(0, Math.min(1, Number(p) || 0));
  return probability >= 0.8 ? "bajo" : probability >= 0.5 ? "medio" : "alto";
}

export const MESSAGES = {
  es: { low: "Riesgo bajo", medium: "Riesgo medio", high: "Riesgo alto" },
  en: { low: "Low risk", medium: "Medium risk", high: "High risk" },
};
