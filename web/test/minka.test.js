import { describe, expect, it } from "vitest";
import {
  approveMinkaMilestone, cancelMinkaDemo, createMinkaDemo, fundMinkaDemo,
  refundMinkaDemo, submitMinkaEvidence,
} from "../src/modes/minka.js";

describe("Minka demo model", () => {
  it("starts with a Tiraque irrigation project and twelve backers", () => {
    const state = createMinkaDemo(1_000_000);
    expect(state.title).toContain("Tiraque");
    expect(state.milestones).toHaveLength(4);
    expect(state.backers).toHaveLength(12);
    expect(state.backers.reduce((sum, backer) => sum + backer.amount, 0)).toBe(state.raised);
  });

  it("accepts contributions without exceeding the goal", () => {
    const now = Date.now();
    const state = createMinkaDemo(now);
    const funded = fundMinkaDemo(state, "visitante", 50, now);
    expect(funded.raised).toBe(770);
    expect(funded.backers.at(-1)).toMatchObject({ address: "visitante", amount: 50 });
    expect(() => fundMinkaDemo(funded, "visitante", 500, now)).toThrow("INVALID_AMOUNT");
    expect(state.raised).toBe(720);
  });

  it("requires evidence and a simple validator majority before release", () => {
    const now = Date.now();
    let state = createMinkaDemo(now);
    state = fundMinkaDemo(state, "visitante", 480, now);
    expect(state.raised).toBe(state.goal);
    expect(() => approveMinkaMilestone(state, state.validators[0], 0)).toThrow("EVIDENCE_REQUIRED");
    state = submitMinkaEvidence(state, state.organizer, 0, "https://example.org/canal.jpg");
    state = approveMinkaMilestone(state, state.validators[0], 0);
    expect(state.released).toBe(0);
    state = approveMinkaMilestone(state, state.validators[1], 0);
    expect(state.released).toBe(300);
    expect(state.milestones[0].released).toBe(true);
    expect(state.nextMilestone).toBe(1);
    expect(() => submitMinkaEvidence(state, state.organizer, 2, "https://example.org")).toThrow("OUT_OF_ORDER");
  });

  it("returns only the proportional unreleased balance after cancellation", () => {
    const now = Date.now();
    let state = createMinkaDemo(now);
    state = fundMinkaDemo(state, "visitante", 480, now);
    state = submitMinkaEvidence(state, state.organizer, 0, "https://example.org/canal.jpg");
    state = approveMinkaMilestone(state, state.validators[0], 0);
    state = approveMinkaMilestone(state, state.validators[1], 0);
    state = cancelMinkaDemo(state, state.organizer);
    const contribution = state.backers[0].amount;
    const { state: refunded, amount } = refundMinkaDemo(state, state.backers[0].address);
    expect(amount).toBe(Math.floor((contribution * 900) / 1200));
    expect(refunded.backers[0].refunded).toBe(true);
    expect(refunded.released).toBe(300);
    expect(() => refundMinkaDemo(refunded, state.backers[0].address)).toThrow("NOTHING_TO_REFUND");
  });

  it("allows refund after deadline only while below the goal", () => {
    const start = 1_000_000;
    let state = createMinkaDemo(start);
    const expired = (state.deadline + 1) * 1000;
    const result = refundMinkaDemo(state, state.backers[0].address, expired);
    expect(result.amount).toBe(state.backers[0].amount);
    state = fundMinkaDemo(state, "visitor", 480, start);
    expect(() => refundMinkaDemo(state, state.backers[0].address, expired)).toThrow("REFUND_UNAVAILABLE");
  });
});
