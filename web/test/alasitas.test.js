import { describe, expect, it } from "vitest";
import {
  createDemoGoals, depositDemo, earlyExitDemo, progressOf, streakOf, withdrawDemo,
} from "../src/modes/alasitas.js";

describe("Alasitas demo goals", () => {
  it("starts with six different miniatures and independent state", () => {
    const goals = createDemoGoals();
    expect(goals).toHaveLength(6);
    expect(new Set(goals.map((goal) => goal.kind)).size).toBe(6);
    goals[0].contributions.Tú = 0;
    expect(createDemoGoals()[0].contributions.Tú).toBe(480);
  });

  it("reports progress without exceeding the target", () => {
    expect(progressOf({ saved: 75, target: 100 })).toEqual({ saved: 75, target: 100, ratio: 0.75 });
    expect(progressOf({ saved: 120, target: 100 }).ratio).toBe(1);
    expect(progressOf({ saved: 4, target: 0 }).ratio).toBe(0);
  });

  it("adds a member contribution and tracks weekly streaks", () => {
    const base = [{ id: 9, saved: 5, target: 50, members: ["Tú"], contributions: { Tú: 5 }, streaks: { Tú: 2 }, unlockAt: 5_000_000, closed: false }];
    const week = 200;
    const once = depositDemo(base, 9, "Tú", 10, week * 7 * 86400);
    expect(once[0]).toMatchObject({ saved: 15, contributions: { Tú: 15 }, streaks: { Tú: 1 } });
    const next = depositDemo(once, 9, "Tú", 10, (week + 1) * 7 * 86400);
    expect(streakOf(next[0], "Tú")).toBe(2);
    const afterGap = depositDemo(next, 9, "Tú", 10, (week + 3) * 7 * 86400);
    expect(streakOf(afterGap[0], "Tú")).toBe(1);
  });

  it("returns only the exiting member's share and preserves an exit record", () => {
    const goals = [{ id: 1, saved: 90, target: 200, unlockAt: 1000, members: ["Ana", "Luis"], contributions: { Ana: 30, Luis: 60 }, exitHistory: [], closed: false }];
    const result = earlyExitDemo(goals, 1, "Luis", 500);
    expect(result.amount).toBe(60);
    expect(result.goals[0]).toMatchObject({ saved: 30, contributions: { Ana: 30, Luis: 0 } });
    expect(result.goals[0].exitHistory).toEqual([{ member: "Luis", at: 500, amount: 60 }]);
    expect(goals[0].saved).toBe(90);
  });

  it("rejects exits without a contribution and withdrawals before eligibility", () => {
    const goals = [{ id: 3, saved: 10, target: 100, unlockAt: 1000, members: ["Ana"], contributions: { Ana: 0 }, exitHistory: [], closed: false }];
    expect(() => earlyExitDemo(goals, 3, "Ana", 500)).toThrow();
    expect(() => withdrawDemo(goals, 3, 500)).toThrow();
  });

  it("closes an eligible goal and returns the contribution breakdown", () => {
    const goals = [{ id: 7, saved: 100, target: 100, unlockAt: 1000, members: ["Ana", "Luis"], contributions: { Ana: 45, Luis: 55 }, closed: false }];
    const result = withdrawDemo(goals, 7, 500);
    expect(result.paid).toEqual({ Ana: 45, Luis: 55 });
    expect(result.goals[0]).toMatchObject({ saved: 0, closed: true, contributions: { Ana: 0, Luis: 0 } });
    expect(() => withdrawDemo(result.goals, 7, 500)).toThrow();
  });
});
