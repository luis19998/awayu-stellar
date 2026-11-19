import { describe, expect, it } from "vitest";
import {
  COVERED,
  LATE,
  MISSED,
  ON_TIME,
  contribute,
  creditLine,
  demoCircle,
  depositGuarantee,
  parsePeople,
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

    // Mery (2) y Wilber (5) tienen garantía: cubre sus cuotas y el pozo sale con 4
    expect(payout(circle)).toEqual({ to: 2, amount: 4 * circle.amount });
    expect(circle.members[0].history.at(-1)).toBe(ON_TIME);
    expect(circle.members[1].history.at(-1)).toBe(LATE);
    expect(circle.members[2].history.at(-1)).toBe(COVERED);
    expect(circle.members[3].history.at(-1)).toBe(MISSED);
    expect(circle.members[2].guarantee).toBe(0);
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

describe("guarantees", () => {
  it("scores a covered round at 25 points", () => {
    expect(score([ON_TIME, COVERED])).toBe(63);
  });

  it("accepts one guarantee per member and none after the circle ends", () => {
    const circle = demoCircle();
    expect(depositGuarantee(circle, 0)).toBe(true);
    expect(circle.members[0].guarantee).toBe(circle.amount);
    expect(depositGuarantee(circle, 0)).toBe(false);
    circle.round = circle.order.length;
    expect(depositGuarantee(circle, 1)).toBe(false);
  });

  it("covers only once: a second miss without guarantee is recorded as missed", () => {
    const circle = demoCircle();
    circle.round = 0;
    circle.paid.clear();
    payout(circle);
    payout(circle);
    expect(circle.members[2].history.slice(-2)).toEqual([COVERED, MISSED]);
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

describe("custom demo circles", () => {
  it("parses one person per line with an optional role", () => {
    expect(parsePeople("Lucía, Vendedora · Cancha\n\n  Ramiro  \n")).toEqual([
      { name: "Lucía", role: "Vendedora · Cancha" },
      { name: "Ramiro", role: "Miembro" },
    ]);
  });

  it("builds a repeatable circle with the requested amount and played rounds", () => {
    const people = parsePeople("A\nB\nC\nD");
    const a = demoCircle({ people, amount: 50, played: 2 });
    const b = demoCircle({ people, amount: 50, played: 2 });
    expect(a.amount).toBe(50);
    expect(a.round).toBe(2);
    expect(a.members.map((m) => m.history.length)).toEqual([2, 2, 2, 2]);
    expect(a.order).toEqual(b.order);
    expect([...a.order].sort()).toEqual([0, 1, 2, 3]);
  });

  it("falls back to the original demo with fewer than two people", () => {
    expect(demoCircle({ people: parsePeople("Solo") }).members).toHaveLength(6);
  });

  it("never plays the whole circle in advance", () => {
    const c = demoCircle({ people: parsePeople("A\nB\nC"), played: 99 });
    expect(c.round).toBe(2);
    expect(recipientOf(c)).not.toBeNull();
  });
});
