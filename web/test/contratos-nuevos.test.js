import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const testnet = JSON.parse(read("../public/testnet.json"));
const evidencia = JSON.parse(read("../public/contratos-nuevos.json"));

describe("contratos sorteo y remate en testnet", () => {
  it("testnet.json apunta a los contratos de la evidencia", () => {
    expect(testnet.sorteo.contractId).toBe(evidencia.sorteo.contractId);
    expect(testnet.remate.contractId).toBe(evidencia.remate.contractId);
    expect(testnet.sorteo.contractId).toMatch(/^C[A-Z2-7]{55}$/);
  });
  it("la vista de Latinoamérica enlaza el mismo contrato remate", () => {
    expect(read("../src/views/latam.js")).toContain(`const REMATE_ID = "${testnet.remate.contractId}"`);
  });
  it("la evidencia registra el sorteo completo y las dos rondas del remate", () => {
    const acciones = evidencia.steps.map((s) => s.action);
    expect(acciones.filter((a) => a.startsWith("Revelar")).length).toBe(3);
    expect(evidencia.sorteo.order.slice().sort()).toEqual(["Ana", "Bruno", "Carla"]);
    expect(evidencia.remate.winners[0]).toBe("Bruno"); // la puja más alta (12 %) gana la ronda 1
    expect(evidencia.steps.every((s) => /^[0-9a-f]{64}$/.test(s.hash))).toBe(true);
  });
});
