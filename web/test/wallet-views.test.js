import { describe, expect, it } from "vitest";
import { normalizeWalletData, scaleBalance, scaleContribution } from "../src/views/billetera3d.js";
import { averageLedgerInterval, ledgerMetrics, ledgerRate, normalizeLedger, scaleLedgerRing } from "../src/views/pulso.js";

describe("wallet visualization scales", () => {
  it("keeps balance rings positive and increases their thickness with balance", () => {
    expect(scaleBalance(0)).toBeGreaterThan(0);
    expect(scaleBalance(100)).toBeGreaterThan(scaleBalance(1));
    expect(scaleBalance(-5)).toBe(scaleBalance(0));
  });
  it("scales contribution moons and clamps reputation", () => {
    expect(scaleContribution(400)).toBeGreaterThan(scaleContribution(1));
    expect(normalizeWalletData({ lang: "en", reputation: 140 })).toMatchObject({ lang: "en", reputation: 100, balances: [], circles: [] });
  });
});

describe("ledger visualization helpers", () => {
  it("normalizes Horizon ledger fields", () => {
    expect(normalizeLedger({ sequence: "12", operation_count: "8", transaction_count: "3", closed_at: "2026-01-01T00:00:00Z" })).toEqual({ sequence: 12, operations: 8, transactions: 3, closedAt: Date.parse("2026-01-01T00:00:00Z") });
  });
  it("computes recent rate and mean spacing", () => {
    const times = [1_000, 11_000, 21_000, 90_000];
    expect(ledgerRate(times, 30_000)).toBe(3);
    expect(averageLedgerInterval(times)).toBeCloseTo(29_666.67, 0);
    expect(ledgerMetrics(times.map((closedAt, i) => ({ closedAt, sequence: i + 1 })), 30_000).perMinute).toBe(3);
  });
  it("keeps ledger ring size bounded and monotonic", () => {
    expect(scaleLedgerRing(0)).toBeGreaterThan(0);
    expect(scaleLedgerRing(10_000)).toBeGreaterThan(scaleLedgerRing(10));
    expect(scaleLedgerRing(1e20)).toBeLessThanOrEqual(108);
  });
});
