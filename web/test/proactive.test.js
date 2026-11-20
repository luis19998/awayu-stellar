import { describe, expect, it } from "vitest";
import { suggestions } from "../src/guide/proactive.js";

describe("proactive Amawta rules", () => {
  it("suggests a wallet when disconnected", () => expect(suggestions({ address: null })[0].id).toBe("wallet"));
  it("detects the connected member's turn and missing contribution", () => {
    const circle = { members: [{ name: "Ana", address: "G1" }, { name: "Luis" }], order: [0, 1], round: 0, paid: new Map() };
    const result = suggestions({ circle, address: "G1" });
    expect(result.map((x) => x.id)).toContain("your-turn"); expect(result.map((x) => x.id)).toContain("missing-payments");
  });
  it("reports a due round and missing guarantee", () => {
    const result = suggestions({ address: "G1", now: Date.parse("2026-01-01"), circle: { members: [{ address: "G1", history: [] }, { name: "B" }], order: [1, 0], round: 0, paid: new Map(), deadline: "2026-01-04" } });
    expect(result.map((x) => x.id)).toEqual(expect.arrayContaining(["deadline", "no-guarantee"]));
  });
  it("accepts a Unix timestamp deadline from Stellar state", () => {
    const now = Date.parse("2026-01-01");
    const result = suggestions({ address: "G1", now, circle: { members: [{ address: "G1" }, { name: "B" }], order: [1, 0], round: 0, paid: new Map(), deadline: (now + 2 * 86400000) / 1000 } });
    expect(result.map((x) => x.id)).toContain("deadline");
  });
  it("reports a complete pot with its recipient", () => {
    const result = suggestions({ address: "G1", circle: { members: [{ address: "G1" }, { name: "Ana" }], order: [1, 0], round: 0, paid: new Map([[0, 1], [1, 1]]) } });
    expect(result.find((x) => x.id === "pot-ready").text).toContain("Ana");
  });
  it.each([["ayni", "ayni-vote"], ["minka", "minka-evidence"], ["alasitas", "alasitas-streak"]])("has a rule for %s", (route, id) => expect(suggestions({ route }).map((x) => x.id)).toContain(id));
  it("prioritizes high-risk circles and returns localized strings", () => {
    const result = suggestions({ address: "G1", lang: "en", circle: { members: [{ address: "G1", history: [3, 3] }, { history: [] }], order: [0, 1], round: 0, paid: new Map() } });
    expect(result[0].priority).toBeGreaterThanOrEqual(result[1].priority); expect(result.find((x) => x.id === "risk-guarantee").text).toMatch(/risk/i);
  });
});
