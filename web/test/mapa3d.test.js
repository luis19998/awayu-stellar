import { describe, expect, it } from "vitest";
import { groupByRegion, project, regionToIso, spiralOffsets } from "../src/views/mapa3d.js";

describe("mapa3d geographic helpers", () => {
  it("projects Bolivia around the origin at a useful map scale", () => {
    const center = project([-64.5, -16.5]);
    const west = project([-69.6, -16.5]);
    const east = project([-57.4, -16.5]);

    expect(center[0]).toBeCloseTo(0);
    expect(center[1]).toBeCloseTo(0);
    expect(east[0] - west[0]).toBeGreaterThan(19);
    expect(east[0] - west[0]).toBeLessThan(21);
  });

  it("maps short region codes, department names, and ISO codes", () => {
    expect(regionToIso("lpz")).toBe("BO-L");
    expect(regionToIso("cbba")).toBe("BO-C");
    expect(regionToIso("scz")).toBe("BO-S");
    expect(regionToIso("pnd")).toBe("BO-N");
    expect(regionToIso("La Paz")).toBe("BO-L");
    expect(regionToIso("bo-h")).toBe("BO-H");
    expect(regionToIso("otra región")).toBeNull();
  });

  it("groups circles by normalized region and keeps unknown regions", () => {
    const first = { contractId: "C1", region: "LPZ" };
    const second = { contractId: "C2", region: "lpz" };
    const other = { contractId: "C3", region: "valles" };

    expect(groupByRegion([first, second, other])).toEqual({
      lpz: [first, second],
      valles: [other],
    });
    expect(groupByRegion()).toEqual({});
  });

  it("creates deterministic spiral offsets with the first pin centered", () => {
    const offsets = spiralOffsets(5);
    expect(offsets).toHaveLength(5);
    expect(offsets[0]).toEqual({ x: 0, y: 0 });
    expect(offsets.slice(1).every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(spiralOffsets(5)).toEqual(offsets);
    expect(spiralOffsets(-2)).toEqual([]);
  });
});
