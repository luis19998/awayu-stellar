import { describe, expect, it } from "vitest";
import { drawSeed, shuffleDeterministic } from "../src/verify/draw.js";
import { DEMO_ADDRESS, USDC_TESTNET_ISSUER } from "../src/qr/qr.js";
import { diceFor, getLedgerHash, lockList, nextLedger, readDrawCode, resolveDraw, scoreCacho } from "../src/bolivia/draw.js";
import { ticketUri } from "../src/bolivia/raffle.js";
import { simulateAnticretico } from "../src/bolivia/anticretico.js";

const hash = "ab".repeat(32);

describe("cacho verificable", () => {
  it("deriva cinco caras reproducibles por índice y usa las seis caras", async () => {
    const rolls = await Promise.all(Array.from({ length: 64 }, (_, i) => diceFor(hash, i)));
    expect(rolls.every(dice => dice.length === 5)).toBe(true);
    expect([...new Set(rolls.flat())].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(await diceFor(hash.toUpperCase(), 2)).toEqual(rolls[2]);
    expect(rolls[0]).not.toEqual(rolls[1]);
  });

  it.each([
    [[3, 1, 5, 2, 4], "straight", 20], [[6, 2, 3, 5, 4], "straight", 20],
    [[2, 3, 2, 3, 2], "full", 30], [[2, 1, 2, 2, 2], "poker", 40],
    [[1, 1, 1, 1, 1], "grande", 50], [[1, 1, 2, 3, 6], "common", 2],
    [[2, 2, 3, 3, 6], "common", 6], [[2, 3, 5, 6, 1], "common", 6],
  ])("puntúa %j como %s", (roll, hand, points) => {
    expect(scoreCacho(roll)).toEqual({ hand, points });
  });

  it("reproduce cada tirada y el primer lugar, incluidos los empates por semilla", async () => {
    const names = Array.from({ length: 55 }, (_, i) => "Inés " + i);
    const draw = { ...await lockList("cacho", names), ledger: 42 };
    const result = await resolveDraw(draw, hash);
    const replay = await readDrawCode("cacho", result.code);
    expect(replay.commitment).toBe(draw.commitment);
    expect(await resolveDraw(replay, hash)).toEqual(result);
    const order = await shuffleDeterministic(names, await drawSeed(draw.commitment, hash));
    const scores = result.rows.map(r => r.points);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(new Set(scores).size).toBeLessThan(scores.length);
    for (const score of new Set(scores)) {
      const tied = result.rows.filter(row => row.points === score).map(row => row.name);
      expect(tied).toEqual(order.filter(name => tied.includes(name)));
    }
    await expect(readDrawCode("raffle", result.code)).rejects.toThrow();
  });

  it("elige el ledger inmediatamente posterior y exige su número y su hash", async () => {
    expect(await nextLedger({ latestLedger: () => ({ sequence: 41 }) })).toBe(42);
    expect(await getLedgerHash({ ledger: () => null }, 42)).toBeNull();
    await expect(getLedgerHash({ ledger: () => ({ sequence: 43, hash }) }, 42)).rejects.toThrow();
  });
});

describe("rifa y anticrético", () => {
  it.each(["XLM", "USDC"])("crea un SEP-7 de testnet para el número y el precio exactos en %s", asset => {
    const uri = ticketUri({ address: DEMO_ADDRESS, asset, price: "0.0000001" }, "007");
    expect(uri.startsWith("web+stellar:pay?")).toBe(true);
    const params = new URL(uri).searchParams;
    expect(params.get("destination")).toBe(DEMO_ADDRESS);
    expect(params.get("amount")).toBe("0.0000001");
    expect(params.get("memo")).toBe("RIFA-7");
    expect(params.get("memo_type")).toBe("MEMO_TEXT");
    expect(params.get("network_passphrase")).toBe("Test SDF Network ; September 2015");
    expect(params.get("asset_code")).toBe(asset === "XLM" ? null : "USDC");
    expect(params.get("asset_issuer")).toBe(asset === "XLM" ? null : USDC_TESTNET_ISSUER);
  });

  it("separa el ahorro en alquiler de la diferencia por tipo de cambio", () => {
    const input = { deposit: 1000, months: 12, rent: 800, rate: 7, increase: 10 };
    expect(simulateAnticretico(input)).toEqual({ savedRent: 9600, initialBOB: 7000, finalBOB: 7700, changeBOB: 700 });
    expect(simulateAnticretico({ ...input, increase: 0 }).changeBOB).toBe(0);
    expect(() => simulateAnticretico({ ...input, months: 1.5 })).toThrow();
  });
});
