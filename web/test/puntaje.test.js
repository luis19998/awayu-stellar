import { describe, it, expect } from "vitest";
import { scoreOf, summarize, MARK_POINTS } from "../src/reporte/puntaje.js";
import { score } from "../src/model.js";

// Réplica literal de score_of en contracts/pasanaku/src/lib.rs (u32, división entera)
const contrato = (h) => (h.length ? Math.floor(h.reduce((a, m) => a + ({ 1: 100, 2: 50, 4: 25 }[m] ?? 0), 0) / h.length) : 0);

describe("puntaje igual al del contrato", () => {
  it("usa los puntos del contrato", () => {
    expect(MARK_POINTS).toEqual({ 1: 100, 2: 50, 3: 0, 4: 25 });
  });
  it("redondea hacia abajo como la división entera de Rust", () => {
    expect(scoreOf([1, 4])).toBe(62); // 125 / 2 = 62,5 → 62
    expect(scoreOf([1, 2, 2])).toBe(66); // 200 / 3 = 66,6 → 66
    expect(scoreOf([])).toBe(0);
  });
  it("coincide con el contrato en todas las historias de hasta 4 rondas", () => {
    const marks = [1, 2, 3, 4];
    const all = [[]];
    for (let n = 0; n < 4; n++) for (const h of [...all]) if (h.length === n) for (const m of marks) all.push([...h, m]);
    for (const h of all) {
      expect(scoreOf(h)).toBe(contrato(h));
      expect(score(h)).toBe(contrato(h));
    }
  });
  it("cuenta cada tipo de marca", () => {
    expect(summarize([1, 1, 2, 3, 4])).toEqual({ counts: { 1: 2, 2: 1, 3: 1, 4: 1 }, total: 5, score: 55 });
  });
});
