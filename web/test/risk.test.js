import { describe, expect, it } from "vitest";
import { fairDrawProof, memberReliability, riskLevel, simulateCircle, turnProbabilities } from "../src/risk.js";

describe("motor de riesgo", () => {
  it("calcula posterior y respeta las marcas ponderadas", () => {
    expect(memberReliability([])).toMatchObject({ mean: 2 / 3 });
    const allOnTime = memberReliability([1, 1, 1]);
    const missed = memberReliability([3, 3, 3]);
    expect(allOnTime.mean).toBeGreaterThan(missed.mean);
    expect(allOnTime.low).toBeLessThan(allOnTime.mean);
    expect(allOnTime.high).toBeGreaterThan(allOnTime.mean);
    expect(memberReliability([4]).mean).toBeLessThan(memberReliability([1]).mean);
  });

  it("produce los mismos resultados con la misma semilla", () => {
    const circle = { amount: 10, members: [{ history: [1] }, { history: [2] }, { history: [3] }], order: [0, 1, 2], round: 1, paid: new Map([[0, 1]]) };
    expect(simulateCircle(circle, { runs: 300, seed: 71 })).toEqual(simulateCircle(circle, { runs: 300, seed: 71 }));
  });

  it("maneja círculos vacíos, garantías y límites de etiquetas", () => {
    expect(simulateCircle({ members: [], order: [], round: 0, amount: 5 }, { runs: 10 }).completionProbability).toBe(1);
    const members = Array.from({ length: 2 }, () => ({ history: [3, 3, 3], guarantee: 0 }));
    const circle = { members, order: [0, 1], round: 1, amount: 10, paid: new Map() };
    const bare = simulateCircle(circle, { runs: 1000, seed: 8 });
    const secured = simulateCircle({ ...circle, members: members.map((m) => ({ ...m, guarantee: 10 })) }, { runs: 1000, seed: 8 });
    expect(secured.completionProbability).toBeGreaterThan(bare.completionProbability);
    expect(bare.expectedPotByRound).toHaveLength(1);
    expect(bare.missDistribution.reduce((sum, item) => sum + item.probability, 0)).toBeCloseTo(1);
    expect(riskLevel(0.9)).toBe("bajo");
    expect(riskLevel(0.6)).toBe("medio");
    expect(riskLevel(0.2)).toBe("alto");
  });

  it("expone probabilidades uniformes y explicación del sorteo", () => {
    expect(turnProbabilities(4)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(turnProbabilities(0)).toEqual([]);
    expect(fairDrawProof([2, 0, 1], 42).probabilities).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
});

import { paymentProbability } from "../src/risk.js";
describe("paymentProbability", () => {
  it("cuenta el pago tarde como pago y la falta como falla", () => {
    expect(paymentProbability([])).toBeCloseTo(0.9);
    expect(paymentProbability([2, 2])).toBeGreaterThan(paymentProbability([]));
    expect(paymentProbability([3, 3])).toBeLessThan(paymentProbability([]));
  });
});
