import { describe, expect, it } from "vitest";
import { normalizeWalletData, scaleBalance, scaleContribution } from "../src/views/billetera3d.js";
import { ledgerMetrics, normalizeLedger } from "../src/views/pulso.js";

describe("wallet visualization helpers", () => {
  it("scales orbital size monotonically and safely", () => {
    expect(scaleBalance(-1)).toBeGreaterThan(0);
    expect(scaleBalance(1000)).toBeGreaterThan(scaleBalance(1));
    expect(scaleContribution(100)).toBeGreaterThan(scaleContribution(1));
  });

  it("normalizes view data and clamps the reputation score", () => {
    expect(normalizeWalletData({ lang: "fr", reputation: 140, balances: [{ asset: "XLM" }] })).toMatchObject({
      lang: "es", reputation: 100, balances: [{ asset: "XLM" }], payments: [], circles: [],
    });
    expect(normalizeWalletData({ lang: "en", reputation: -1 })).toMatchObject({ lang: "en", reputation: 0 });
  });
});

describe("Stellar Pulse helpers", () => {
  it("normalizes a ledger record", () => {
    expect(normalizeLedger({ sequence: "123", operation_count: "8", successful_transaction_count: "3", closed_at: "2026-11-18T12:00:00Z" })).toEqual({
      sequence: 123, operations: 8, transactions: 3, closedAt: Date.parse("2026-11-18T12:00:00Z"),
    });
  });

  it("counts ledgers in the last minute and averages close intervals", () => {
    const now = 1_000_000;
    expect(ledgerMetrics([
      { closedAt: now - 120_000 }, { closedAt: now - 60_000 }, { closedAt: now - 20_000 }, { closedAt: now - 10_000 },
    ], now)).toEqual({ perMinute: 3, averageMs: 36_667 });
  });

  it("handles an empty ledger history", () => {
    expect(ledgerMetrics([], 0)).toEqual({ perMinute: 0, averageMs: null });
  });
});
