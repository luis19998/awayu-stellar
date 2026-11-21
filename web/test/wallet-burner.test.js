import { afterEach, describe, expect, it } from "vitest";
import { Account, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { LEGAL_VERSION } from "../src/legal/consent.js";

const previousSession = globalThis.sessionStorage;
const previousLocal = globalThis.localStorage;
afterEach(async () => {
  const { disconnect } = await import("../src/wallet.js");
  disconnect();
  if (previousSession === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = previousSession;
  if (previousLocal === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = previousLocal;
});

describe("ephemeral test wallet", () => {
  it("stores its secret only in sessionStorage, reuses it, and clears it on disconnect", async () => {
    const session = new Map();
    const local = new Map();
    globalThis.sessionStorage = {
      getItem: (key) => session.get(key) ?? null,
      setItem: (key, value) => session.set(key, value),
      removeItem: (key) => session.delete(key),
    };
    globalThis.localStorage = {
      getItem: (key) => key === "awayu.legal.accepted"
        ? JSON.stringify({ version: LEGAL_VERSION, date: "2026-11-21" })
        : local.get(key) ?? null,
      setItem: (key, value) => local.set(key, value),
      removeItem: (key) => local.delete(key),
    };
    const { connectBurner, disconnect, sign, wallet } = await import("../src/wallet.js");

    const connected = await connectBurner();
    const secret = session.get("awayu.burner");
    expect(Keypair.fromSecret(secret).publicKey()).toBe(connected.address);
    expect(wallet()).toEqual({ kind: "burner", address: connected.address });
    expect(local.size).toBe(0);
    expect((await connectBurner()).address).toBe(connected.address);

    const unsigned = new TransactionBuilder(new Account(connected.address, "1"), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.manageData({ name: "burner-test", value: "signed" }))
      .setTimeout(60)
      .build()
      .toXDR();
    const signed = await sign(unsigned);
    expect(signed.signedXdr).toBeTruthy();
    expect(TransactionBuilder.fromXDR(signed.signedXdr, Networks.TESTNET).signatures).toHaveLength(1);

    disconnect();
    expect(session.has("awayu.burner")).toBe(false);
    expect(wallet()).toBeNull();
  });
});
