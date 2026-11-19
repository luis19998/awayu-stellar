import { describe, expect, it } from "vitest";
import {
  LATE,
  MISSED,
  ON_TIME,
  contribute,
  creditLine,
  demoCircle,
  idleYield,
  payout,
  pot,
  recipientOf,
  score,
} from "../src/model.js";

describe("score", () => {
  it("returns zero for an empty history", () => {
    expect(score([])).toBe(0);
  });

  it("averages on-time, late, and missed marks", () => {
    expect(score([ON_TIME, LATE, MISSED])).toBe(50);
  });

  it("rounds the average to the nearest integer", () => {
    expect(score([ON_TIME, ON_TIME, LATE])).toBe(83);
  });
});

describe("creditLine", () => {
  it("returns zero until there are two qualifying rounds", () => {
    expect(creditLine([], 100)).toBe(0);
    expect(creditLine([ON_TIME], 100)).toBe(0);
    expect(creditLine([ON_TIME, MISSED], 100)).toBe(0);
  });

  it("scales the line by amount, rounds, and score", () => {
    expect(creditLine([ON_TIME, LATE], 100)).toBe(225);
  });
});

describe("circle actions", () => {
  it("starts with an empty pot and the first selected recipient", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();

    expect(pot(circle)).toBe(0);
    expect(recipientOf(circle)).toBe(2);
  });

  it("counts each contribution and rejects a duplicate", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();

    expect(contribute(circle, 1)).toBe(ON_TIME);
    expect(contribute(circle, 1, true)).toBeNull();
    expect(pot(circle)).toBe(circle.amount);
    expect(circle.paid.get(1)).toBe(ON_TIME);
  });

  it("records late contributions", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();

    expect(contribute(circle, 0, true)).toBe(LATE);
    expect(circle.paid.get(0)).toBe(LATE);
  });

  it("pays out the collected pot, records misses, and resets contributions", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();
    contribute(circle, 0);
    contribute(circle, 1, true);

    expect(payout(circle)).toEqual({ to: 2, amount: 2 * circle.amount });
    expect(circle.members[0].history.at(-1)).toBe(ON_TIME);
    expect(circle.members[1].history.at(-1)).toBe(LATE);
    expect(circle.members[2].history.at(-1)).toBe(MISSED);
    expect(circle.paid.size).toBe(0);
    expect(circle.round).toBe(1);
  });

  it("does not accept contributions or a payout after the circle ends", () => {
    const circle = demoCircle();
    circle.round = circle.order.length;

    expect(recipientOf(circle)).toBeNull();
    expect(contribute(circle, 0)).toBeNull();
    expect(payout(circle)).toBeNull();
  });
});

describe("idleYield", () => {
  it("is zero when no contributions are waiting", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();

    expect(idleYield(circle)).toBe(0);
  });

  it("estimates yield for half of a period", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();
    contribute(circle, 0);
    contribute(circle, 1);

    expect(idleYield(circle)).toBe(circle.amount * 2 * circle.apy * (circle.periodDays / 2 / 365));
  });
});

describe("demoCircle", () => {
  it("provides a three-round history and leaves the next round ready", () => {
    const circle = demoCircle();

    expect(circle.round).toBe(3);
    expect(circle.members).toHaveLength(6);
    expect(circle.members.map(({ history }) => history.length)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(circle.paid.size).toBe(0);
    expect(circle.payouts).toHaveLength(3);
    expect(recipientOf(circle)).toBe(circle.order[3]);
  });
});
