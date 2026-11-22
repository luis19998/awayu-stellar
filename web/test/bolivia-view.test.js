// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_ADDRESS } from "../src/qr/qr.js";
import { setLang } from "../src/i18n.js";
import { RAFFLE_KEY } from "../src/bolivia/raffle.js";
import { mount } from "../src/views/bolivia.js";

let instance, client;
const q = selector => document.querySelector(selector);
const click = selector => q(selector).click();
const submit = selector => q(selector).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
const fill = (selector, text) => {
  const field = q(selector);
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};
function open() {
  instance?.destroy();
  document.body.replaceChildren();
  instance = mount(document.body, { client, getAddress: () => DEMO_ADDRESS });
}

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  localStorage.clear();
  setLang("es");
  client = {
    latestLedger: vi.fn(async () => ({ sequence: 10 })),
    ledger: vi.fn(async sequence => ({ sequence, hash: "1a".repeat(32) })),
  };
  open();
});
afterEach(() => {
  instance.destroy();
  instance = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Juegos y costumbres de Bolivia", () => {
  it("fija la lista, cambia el idioma sin perder la ronda y comprueba el código", async () => {
    fill("#bo-names", "Luz\nÁlvaro\nRosa");
    submit('[data-form="cacho"]');
    await vi.waitFor(() => expect(q('[data-round="cacho"] .bo-winner')).toBeTruthy());
    expect(client.ledger).toHaveBeenCalledWith(11);
    const code = q('[data-round="cacho"] textarea').value;
    const list = q('[data-round="cacho"] ol').textContent;
    fill('[data-verify="cacho"] textarea', code);
    submit('[data-verify="cacho"]');
    await vi.waitFor(() => expect(q('[data-round="cacho-replay"] ol')?.textContent).toBe(list));
    setLang("pt");
    expect(q("h1").textContent).toBe("Jogos e costumes da Bolívia");
    expect(q('[data-round="cacho"] textarea').value).toBe(code);
    expect(q("#bo-names").readOnly).toBe(true);
    for (const lang of ["qu", "ay", "gn"]) {
      setLang(lang);
      expect(q("h1").textContent).toBe("Juegos y costumbres de Bolivia");
    }
    expect(client.latestLedger).toHaveBeenCalledTimes(1);
  });

  it("ofrece práctica explícita si Horizon falla y no emite un código de testnet", async () => {
    client.ledger.mockRejectedValue(new Error("offline"));
    fill("#bo-names", "Luz\nDiego");
    submit('[data-form="cacho"]');
    await vi.waitFor(() => expect(q('[data-act="practice"]')).toBeTruthy());
    click('[data-act="practice"]');
    await vi.waitFor(() => expect(q(".bo-winner")).toBeTruthy());
    expect(q('[data-round="cacho"] .bo-status').textContent).toContain("no verificable");
    expect(q('[data-round="cacho"] textarea')).toBeNull();
    click('[data-act="new"]');
    expect(q("#bo-names").readOnly).toBe(false);
  });

  it("registra pagos manualmente, conserva la lista y reintenta el ledger fijado al recargar", async () => {
    click('[data-tab="raffle"]');
    expect(q('[name="address"]').value).toBe(DEMO_ADDRESS);
    fill('[name="title"]', "Fiesta del barrio");
    fill('[name="prize"]', "Un aguayo");
    submit('[data-form="raffle"]');
    await vi.waitFor(() => expect(q("[data-payment] svg")).toBeTruthy());
    expect(q("[data-payment] a").href).toContain("memo=RIFA-1");
    expect(q("[data-entries]").children).toHaveLength(0);
    fill('[name="name"]', "Luz");
    submit('[data-form="ticket"]');
    fill('[name="number"]', "1");
    expect(q('[data-form="ticket"] button').disabled).toBe(true);
    fill('[name="number"]', "22");
    fill('[name="name"]', "Diego");
    submit('[data-form="ticket"]');
    client.ledger.mockRejectedValueOnce(new Error("offline"));
    click('[data-act="close"]');
    await vi.waitFor(() => expect(q('[data-round="raffle"] [data-act="retry"]')).toBeTruthy());
    expect(JSON.parse(localStorage.getItem(RAFFLE_KEY)).ledger).toBe(11);
    open();
    click('[data-tab="raffle"]');
    await vi.waitFor(() => expect(q('[data-round="raffle"] .bo-winner')).toBeTruthy());
    const winner = q('[data-round="raffle"] .bo-winner').textContent;
    expect(q("[data-entries]").children).toHaveLength(2);
    expect(q(".bo-tickets").hidden).toBe(true);
    fill('[data-verify="raffle"] textarea', q('[data-round="raffle"] textarea').value);
    submit('[data-verify="raffle"]');
    await vi.waitFor(() => expect(q('[data-round="raffle-replay"] .bo-winner')?.textContent).toBe(winner));
    expect(client.latestLedger).toHaveBeenCalledTimes(1);
    expect(client.ledger.mock.calls.map(([sequence]) => sequence)).toEqual([11, 11, 11]);
  });

  it("actualiza el simulador y conserva los valores al cambiar de idioma o pestaña", () => {
    click('[data-tab="anticretico"]');
    fill('[name="months"]', 2);
    fill('[name="rent"]', 100);
    expect(q("[data-totals] dd").textContent).toBe("200 Bs");
    setLang("en");
    expect(q("[data-totals] dt").textContent).toBe("Rent saved");
    expect(q('[data-tab="anticretico"]').getAttribute("aria-selected")).toBe("true");
    click('[data-tab="raffle"]');
    click('[data-tab="anticretico"]');
    expect(q('[name="months"]').value).toBe("2");
  });
});
