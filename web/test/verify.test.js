import { afterEach, describe, expect, it, vi } from "vitest";
import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { decodeCode, drawResult, encodeCode, listHash, normalizeParticipants } from "../src/verify/draw.js";
import { sha256, sha256File } from "../src/verify/fingerprint.js";
import { createHorizonClient } from "../src/verify/horizon.js";
import { assessTrust } from "../src/verify/trust.js";
import { createSealXdr, mount } from "../src/views/verificar.js";

const LEDGER_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const LEDGER_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("verifiable draw helpers", () => {
  it("normalizes the list while preserving participant order", () => {
    expect(normalizeParticipants("  Ana  \n\n Luis\nPaz ")).toEqual(["Ana", "Luis", "Paz"]);
  });

  it("repeats the same draw and changes it when the list or ledger changes", async () => {
    const participants = Array.from({ length: 20 }, (_, index) => "persona-" + index);
    const first = await drawResult({ title: "Rifa", participants, ledgerHash: LEDGER_A, count: participants.length });
    const repeated = await drawResult({ title: "Rifa", participants, ledgerHash: LEDGER_A, count: participants.length });
    const changedParticipant = await drawResult({ title: "Rifa", participants: ["otra", ...participants.slice(1)], ledgerHash: LEDGER_A, count: participants.length });
    const changedLedger = await drawResult({ title: "Rifa", participants, ledgerHash: LEDGER_B, count: participants.length });
    expect(first).toEqual(repeated);
    expect(changedParticipant.order).not.toEqual(first.order);
    expect(changedLedger.order).not.toEqual(first.order);
    expect([...first.order].sort()).toEqual([...participants].sort());
  });

  it("encodes and decodes the compact verification code without data loss", () => {
    const draw = { title: "Alasitas: premio ñ", ledger: 987654, participants: ["Ana", "Luis"], count: 1 };
    expect(decodeCode(encodeCode(draw))).toEqual(draw);
  });

  it("commits to the normalized list and title", async () => {
    expect(await listHash(" Rifa ", "Ana\nLuis")).toBe(await listHash("Rifa", [" Ana ", "Luis", ""]));
  });
});

describe("SHA-256 fingerprints", () => {
  it("matches the standard SHA-256 vector for abc", async () => {
    expect(await sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("fingerprints file bytes without uploading them", async () => {
    const file = new Blob(["abc"]);
    expect(await sha256File(file)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("trust assessment", () => {
  it("shows green for a registered and endorsed circle with a verified build", () => {
    expect(assessTrust({ registered: true, endorsements: 2, verified: true })).toMatchObject({ level: "green" });
  });

  it("shows red for a circle absent from the registry", () => {
    expect(assessTrust({ registered: false, endorsements: 9, verified: true })).toEqual({ level: "red", reasons: ["not_registered"] });
  });

  it("keeps incomplete evidence yellow and explains missing signals", () => {
    expect(assessTrust({ registered: true, endorsements: 0, verified: false })).toEqual({
      level: "yellow",
      reasons: ["registered", "no_endorsements", "build_unverified"],
    });
  });
});

describe("Horizon reader", () => {
  it("uses the latest ledger and exact ledger endpoints through an injected fetch", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith("/ledgers?order=desc&limit=1")) return { ok: true, json: async () => ({ _embedded: { records: [{ sequence: "50", hash: LEDGER_A, closed_at: "now" }] } }) };
      if (url.endsWith("/ledgers/56")) return { ok: true, json: async () => ({ sequence: "56", hash: LEDGER_B, closed_at: "later" }) };
      return { ok: false, status: 404, json: async () => ({}) };
    });
    const client = createHorizonClient({ baseUrl: "https://horizon.example", fetchImpl });
    expect(await client.latestLedger()).toMatchObject({ sequence: 50, hash: LEDGER_A });
    expect(await client.ledger(56)).toMatchObject({ sequence: 56, hash: LEDGER_B });
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://horizon.example/ledgers?order=desc&limit=1",
      "https://horizon.example/ledgers/56",
    ]);
  });

  it("returns null for an unknown transaction and maps transport errors", async () => {
    const client = createHorizonClient({ fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({}) }) });
    expect(await client.transaction("missing")).toBeNull();
    const failed = createHorizonClient({ fetchImpl: async () => { throw new Error("offline"); } });
    await expect(failed.latestLedger()).rejects.toThrow("Network request failed");
  });
});

describe("Stellar commitment seal", () => {
  it("builds a one-stroop self-payment with a SHA-256 memo from the Horizon sequence", async () => {
    const address = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const client = { account: async (who) => who === address ? { sequence: "7" } : null };
    const xdr = await createSealXdr(client, address, LEDGER_A);
    const transaction = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    expect(transaction.source).toBe(address);
    expect(transaction.memo.type).toBe("hash");
    expect(transaction.operations[0]).toMatchObject({ type: "payment", destination: address, amount: "0.0000001" });
  });
});

function fakeMountTarget() {
  const nodes = new Map();
  const fakeNode = () => ({ innerHTML: "", hidden: false, addEventListener() {}, querySelector() { return fakeNode(); }, querySelectorAll() { return []; } });
  const root = {
    addEventListener() {},
    querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, fakeNode()); return nodes.get(selector); },
    querySelectorAll() { return []; },
  };
  return {
    html: "",
    set innerHTML(value) { this.html = value; },
    get innerHTML() { return this.html; },
    querySelector(selector) { return selector === ".verify-root" ? root : fakeNode(); },
    replaceChildren() {},
  };
}

describe("verification view", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["es", "en", "pt", "qu", "ay", "gn"])("mounts all four accessible tabs in %s", (lang) => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("location", { hash: "", href: "https://awayu.example/" });
    vi.stubGlobal("localStorage", { getItem: () => "[]", setItem: vi.fn() });
    const target = fakeMountTarget();
    const view = mount(target, { lang, deployment: {}, address: "" });
    expect(target.innerHTML.match(/role="tab"/g)).toHaveLength(4);
    expect(target.innerHTML).toContain("role=\"tablist\"");
    expect(target.innerHTML).toContain("aria-selected=\"true\"");
    view.destroy();
  });
});
