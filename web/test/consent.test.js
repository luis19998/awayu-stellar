import { afterEach, describe, expect, it } from "vitest";
import { ensureConsent, hasConsent, LEGAL_VERSION } from "../src/legal/consent.js";
const previous = globalThis.localStorage;
afterEach(() => { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; });
describe("legal consent version", () => {
  it("accepts only the current stored version", () => {
    const data = new Map(); globalThis.localStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
    expect(hasConsent()).toBe(false); data.set("awayu.legal.accepted", JSON.stringify({ version: "old", date: "2026-01-01" })); expect(hasConsent()).toBe(false);
    data.set("awayu.legal.accepted", JSON.stringify({ version: LEGAL_VERSION, date: "2026-11-19" })); expect(hasConsent()).toBe(true);
  });
  it("resolves without opening a dialog when already accepted", async () => {
    const data = new Map([["awayu.legal.accepted", JSON.stringify({ version: LEGAL_VERSION, date: "2026-11-19" })]]);
    globalThis.localStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
    await expect(ensureConsent("es")).resolves.toBe(true);
  });
});
