import { describe, expect, it } from "vitest";
import { simulate, simulationSvg } from "../src/simulator.js";

describe("simulate", () => {
  it("gives the first turn the biggest advance and the last turn pure savings", () => {
    const s = simulate({ members: 5, amount: 100, periodDays: 7 });
    expect(s.pot).toBe(500);
    expect(s.turns[0]).toMatchObject({ turn: 1, day: 7, advance: 400, saved: 0, role: "adelanto" });
    expect(s.turns[4]).toMatchObject({ turn: 5, day: 35, advance: 0, saved: 400, role: "ahorro" });
    expect(s.days).toBe(35);
  });

  it("estimates yield only when an APY is given", () => {
    expect(simulate({ members: 4, amount: 100, periodDays: 30 }).yieldTotal).toBe(0);
    const s = simulate({ members: 4, amount: 100, periodDays: 30, apy: 0.06 });
    expect(s.yieldPerRound).toBeCloseTo(400 * 0.06 * (15 / 365));
  });

  it("clamps bad input", () => {
    const s = simulate({ members: 1, amount: -5, periodDays: 0 });
    expect(s.turns).toHaveLength(2);
    expect(s.pot).toBe(0);
  });

  it("draws one pair of bars per turn", () => {
    const svg = simulationSvg(simulate({ members: 3, amount: 10, periodDays: 7 }));
    expect(svg.match(/<rect/g)).toHaveLength(6);
  });
});
