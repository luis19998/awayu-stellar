import { afterEach, describe, expect, it } from "vitest";
import {
  createProfile,
  deleteProfile,
  ensureProfiles,
  exportActiveProfile,
  getProfile,
  getProfiles,
  renameProfile,
  switchProfile,
  updateProfile,
} from "../src/settings/profiles.js";

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

let storage;
afterEach(() => { storage = new MemoryStorage(); });

describe("perfiles locales de Awayu", () => {
  it("crea perfiles nuevos y conserva siempre Principal", () => {
    storage = new MemoryStorage();
    const index = ensureProfiles(storage);
    expect(index.list).toHaveLength(1);
    expect(index.list[0]).toMatchObject({ id: "principal", name: "Principal" });
    const second = createProfile("Familia", { storage, reload: false });
    expect(second.name).toBe("Familia");
    expect(getProfiles(storage).active).toBe(second.id);
    expect(getProfiles(storage).list.map((profile) => profile.name)).toEqual(["Principal", "Familia"]);
  });

  it("guarda las preferencias al cambiar y restaura las del perfil de vuelta", () => {
    storage = new MemoryStorage();
    storage.setItem("awayu.lang", "es");
    storage.setItem("awayu.guide.tour.seen.firstVisit", "1");
    storage.setItem("awayu.circles", "compartido");
    const other = createProfile("Otra persona", { storage, reload: false });
    expect(storage.getItem("awayu.lang")).toBeNull();
    expect(storage.getItem(`awayu.profile.principal.lang`)).toBe("es");
    expect(storage.getItem("awayu.profile.principal.guide.tour.seen.firstVisit")).toBe("1");
    storage.setItem("awayu.lang", "pt");
    storage.setItem("awayu.guide.tour.seen.firstVisit", "0");
    expect(switchProfile("principal", { storage, reload: false })).toBe(true);
    expect(storage.getItem("awayu.lang")).toBe("es");
    expect(storage.getItem("awayu.guide.tour.seen.firstVisit")).toBe("1");
    expect(storage.getItem("awayu.circles")).toBe("compartido");
    expect(switchProfile(other.id, { storage, reload: false })).toBe(true);
    expect(storage.getItem("awayu.lang")).toBe("pt");
    expect(storage.getItem("awayu.guide.tour.seen.firstVisit")).toBe("0");
  });

  it("renombra y elimina perfiles, pero protege al último", () => {
    storage = new MemoryStorage();
    const profile = createProfile("Ana", { storage, reload: false });
    expect(renameProfile(profile.id, "Ana María", storage).name).toBe("Ana María");
    expect(getProfiles(storage).list.find((item) => item.id === profile.id).name).toBe("Ana María");
    expect(deleteProfile(profile.id, { storage, reload: false }).id).toBe(profile.id);
    expect(getProfiles(storage)).toMatchObject({ active: "principal", list: [{ id: "principal", name: "Principal" }] });
    expect(deleteProfile("principal", { storage, reload: false })).toBe(false);
    expect(getProfiles(storage).list).toHaveLength(1);
  });

  it("guarda el perfil visible y exporta solo datos locales del perfil activo", () => {
    storage = new MemoryStorage();
    storage.setItem("awayu.lang", "qu");
    storage.setItem("awayu.circles", "no exportar");
    updateProfile({ displayName: "Rosa", alias: "rosita", currency: "BOB" }, storage);
    const exported = JSON.parse(JSON.stringify(exportActiveProfile(storage)));
    expect(exported.profile).toMatchObject({ id: "principal", name: "Principal" });
    expect(exported.data).toMatchObject({
      "awayu.lang": "qu",
      "awayu.profile.data": JSON.stringify({ displayName: "Rosa", alias: "rosita", department: "", figure: "", currency: "BOB" }),
    });
    expect(exported.data).not.toHaveProperty("awayu.circles");
    expect(getProfile(storage).displayName).toBe("Rosa");
  });
});

