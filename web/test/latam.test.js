// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ROUTES } from "../src/dashboard.js";
import { simulateAcumulativo, simulatePuja, simulateRotativo } from "../src/views/latam.js";

describe("Círculos de Latinoamérica", () => {
  it("no deja la ruta Juegos en el menú e incluye latam", () => {
    const routes = ROUTES.map(({ id }) => id);
    expect(routes).toContain("latam");
    expect(routes).not.toContain("juegos");
  });

  it("la garantía completa el pozo y marca el aporte cubierto", () => {
    const result = simulateRotativo({ members: 4, amount: 25, rounds: 4, missedRound: 2, guarantee: true });
    expect(result.turns.every((turn) => turn.complete && turn.pot === 100)).toBe(true);
    expect(result.turns[1].covered).toBe(25);
    expect(result.turns[1].marks[2]).toBe(4);
    expect(result.turns[1].marks).toContain(1);
    expect(simulateRotativo({ members: 4, amount: 25, missedRound: 2, guarantee: false }).turns[1].marks).toContain(3);
  });

  it("el reparto acumulativo suma el fondo aportado", () => {
    const result = simulateAcumulativo({ contributions: [20, 10, 30], loan: 12, split: "proportional" });
    expect(result.loanReturned).toBe(12);
    expect(result.finalFund).toBe(result.totalContributed);
    expect(result.shares.reduce((sum, share) => sum + share, 0)).toBe(result.totalContributed);
  });

  it("la puja conserva aportes entre pagos netos y descuentos repartidos", () => {
    const result = simulatePuja({ members: 5, amount: 12 });
    expect(result.turns).toHaveLength(5);
    expect(result.totalPayouts + result.totalDiscounts).toBeCloseTo(result.totalContributed, 8);
    expect(result.totalDistributed).toBeCloseTo(result.totalContributed, 8);
  });
});
