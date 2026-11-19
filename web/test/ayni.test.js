import { describe, expect, it } from "vitest";
import { createAyniDemo } from "../src/modes/ayni.js";

describe("modelo demo Ayni", () => {
  it("inicia con ocho vecinas y un fondo compartido", () => {
    const ayni = createAyniDemo();
    expect(ayni.state.members).toHaveLength(8);
    expect(ayni.fund()).toBe(138);
    expect(ayni.requests(0, 2)).toHaveLength(2);
  });

  it("registra aportes y evita repetir dentro de 30 días", () => {
    const ayni = createAyniDemo(); const before = ayni.fund(); const now = 50 * 86400_000;
    ayni.contribute(0, now);
    expect(ayni.fund()).toBe(before + ayni.state.monthly);
    expect(() => ayni.contribute(0, now + 29 * 86400_000)).toThrow(/período/);
  });

  it("crea pedidos solo dentro del máximo y saldo disponible", () => {
    const ayni = createAyniDemo();
    expect(ayni.request(0, 20, "Una urgencia familiar")).toBe(3);
    expect(() => ayni.request(3, ayni.state.maxRequest + 1, "Herramientas")).toThrow(/máximo/);
    expect(() => ayni.request(3, 200, "Herramientas")).toThrow(/máximo/);
  });

  it("rechaza voto propio y voto repetido; resuelve al llegar al quórum", () => {
    const ayni = createAyniDemo(); const id = ayni.request(0, 20, "Una urgencia");
    expect(() => ayni.vote(0, id, true)).toThrow(/no vota/);
    ayni.vote(1, id, true);
    expect(() => ayni.vote(1, id, true)).toThrow(/Ya votaste/);
    ayni.vote(2, id, true); ayni.vote(3, id, true); ayni.vote(4, id, true);
    expect(ayni.resolve(id)).toBe(true);
    expect(ayni.state.requests.find((r) => r.id === id).approved).toBe(true);
    expect(ayni.fund()).toBe(118);
  });

  it("rechaza solo cuando ya no se puede llegar al quórum", () => {
    const ayni = createAyniDemo(); const id = ayni.request(0, 10, "Una urgencia");
    ayni.vote(1, id, false);
    expect(ayni.resolve(id)).toBe(false);
    ayni.vote(2, id, false); ayni.vote(3, id, false); ayni.vote(4, id, false);
    expect(ayni.resolve(id)).toBe(true);
    expect(ayni.state.requests.find((r) => r.id === id).approved).toBe(false);
  });

  it("la devolución suma al fondo y a la reputación", () => {
    const ayni = createAyniDemo(); const id = ayni.request(7, 10, "Compra urgente");
    ayni.vote(0, id, true); ayni.vote(2, id, true); ayni.vote(3, id, true); ayni.vote(4, id, true); ayni.resolve(id);
    const afterHelp = ayni.fund(); ayni.repay(7, 10);
    expect(ayni.fund()).toBe(afterHelp + 10);
    expect(ayni.member(7)).toMatchObject({ received: 10, repaid: 10, reputation: 1 });
  });
});
