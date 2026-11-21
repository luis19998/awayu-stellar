import { describe, expect, it } from "vitest";
import { Address } from "@stellar/stellar-sdk";
import {
  USDC_TESTNET,
  bestStrictReceivePath,
  createConstructorArgs,
  roundSendMax,
  tokenSymbolOf,
} from "../src/chain.js";

const CREATOR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("testnet asset helpers", () => {
  it("maps the known native, USDC SAC, and unknown token IDs to symbols", () => {
    expect(tokenSymbolOf("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC")).toBe("XLM");
    expect(tokenSymbolOf(USDC_TESTNET.sac)).toBe("USDC");
    expect(tokenSymbolOf("COTHER")).toBe("token");
  });

  it("rounds the 5 percent sendMax margin to seven decimal places", () => {
    expect(roundSendMax("1.23456789")).toBe(1.2962963);
  });

  it("chooses the strict-receive route with the lowest source amount", () => {
    const best = bestStrictReceivePath({ _embedded: { records: [
      { source_amount: "2.2500000", path: [{ asset_type: "native" }] },
      { source_amount: "1.4100000", path: [{ asset_type: "credit_alphanum4", asset_code: "USDC" }] },
    ] } });
    expect(best.sourceAmount).toBe(1.41);
    expect(best.path[0].asset_code).toBe("USDC");
    expect(bestStrictReceivePath({ _embedded: { records: [] } })).toBeNull();
  });

  it("uses the requested token in the create constructor arguments", () => {
    const args = createConstructorArgs({ token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" }, CREATOR, {
      members: [CREATOR], amount: 10, periodSeconds: 300, token: USDC_TESTNET.sac,
    });
    expect(Address.fromScVal(args[1]).toString()).toBe(USDC_TESTNET.sac);
  });
});
