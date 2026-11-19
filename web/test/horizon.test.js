import { describe, expect, it, vi } from "vitest";
import { DEFAULT_HORIZON, makeClient, normalizeError, normalizePayment } from "../src/horizon.js";

class FakeEventSource {
  static instances = [];
  constructor(url) { this.url = url; this.listeners = {}; this.closed = false; FakeEventSource.instances.push(this); }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  emit(type, data) { this.listeners[type]?.({ data: JSON.stringify(data) }); }
  close() { this.closed = true; }
}

describe("Horizon client", () => {
  it("loads native and issued balances, sequence, and signer count", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      account_id: "GABC", sequence: "42", signers: [{}, {}, {}], balances: [
        { asset_type: "native", balance: "10.5000000" },
        { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: "GISSUER", balance: "8.25" },
      ],
    }) });
    const client = makeClient({ fetchImpl });
    await expect(client.loadAccount("GABC")).resolves.toEqual({
      exists: true, address: "GABC", sequence: "42", signers: 3,
      balances: [
        { asset: "XLM", code: "XLM", issuer: null, balance: "10.5000000" },
        { asset: "USDC:GISSUER", code: "USDC", issuer: "GISSUER", balance: "8.25" },
      ],
    });
    expect(fetchImpl.mock.calls[0][0]).toBe(`${DEFAULT_HORIZON}/accounts/GABC`);
  });

  it("returns a simple missing-account result for a 404", async () => {
    const client = makeClient({ fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ title: "Not Found" }) }) });
    await expect(client.loadAccount("GUNKNOWN")).resolves.toEqual({ exists: false });
  });

  it("normalizes recent payment records and bounds the requested limit", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ _embedded: { records: [{
      id: "123", type: "payment", amount: "2.5", asset_type: "native", from: "GA", to: "GB", created_at: "2026-01-01T00:00:00Z", transaction_hash: "abc",
    }] } }) });
    const client = makeClient({ baseUrl: "https://horizon.example/", fetchImpl });
    await expect(client.recentPayments("G/ABC", 999)).resolves.toEqual([{
      id: "123", type: "payment", amount: "2.5", asset: "XLM", from: "GA", to: "GB", at: "2026-01-01T00:00:00Z", txHash: "abc",
    }]);
    expect(fetchImpl.mock.calls[0][0]).toContain("/accounts/G%2FABC/payments?order=desc&limit=200");
  });

  it("streams payments and ledgers, and returns closers", () => {
    FakeEventSource.instances = [];
    const client = makeClient({ EventSourceImpl: FakeEventSource });
    const payments = vi.fn(); const ledgers = vi.fn();
    const closePayments = client.streamPayments("GABC", payments);
    const closeLedgers = client.streamLedgers(ledgers);
    expect(FakeEventSource.instances.map((source) => source.url)).toEqual([
      `${DEFAULT_HORIZON}/accounts/GABC/payments?cursor=now`, `${DEFAULT_HORIZON}/ledgers?cursor=now`,
    ]);
    FakeEventSource.instances[0].emit("payment", { id: "p1", type: "payment", amount: "4", asset_type: "native", from: "GA", to: "GB" });
    FakeEventSource.instances[1].emit("ledger", { sequence: 99, operation_count: 4, transaction_count: 2, closed_at: "2026-02-01T00:00:00Z" });
    expect(payments).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", asset: "XLM", txHash: null }));
    expect(ledgers).toHaveBeenCalledWith(expect.objectContaining({ sequence: 99, operations: 4, transactions: 2 }));
    closePayments(); closeLedgers();
    expect(FakeEventSource.instances.every((source) => source.closed)).toBe(true);
  });

  it("normalizes errors without exposing request data", () => {
    const error = normalizeError({ detail: "Account is disabled", extras: { result_codes: { transaction: "tx_bad_auth" } } }, { status: 400 });
    expect(error).toMatchObject({ name: "HorizonError", status: 400, code: "tx_bad_auth", message: "Account is disabled" });
    expect(error.message).not.toContain("secret");
    expect(normalizePayment({ type: "path_payment_strict_send", asset_type: "credit_alphanum4", asset_code: "BOL", asset_issuer: "GI", source_account: "GA", account: "GB" })).toMatchObject({
      type: "path_payment_strict_send", amount: "0", asset: "BOL:GI", from: "GA", to: "GB",
    });
  });
});
