import { describe, expect, it, vi } from "vitest";
import { bolivianRamps, depositIdlePot, earnOverview, swapQuote, withdrawFromEarn } from "../src/integrations/pollar-earn.js";
import { createGuaranteeEscrow, fundEscrow, getEscrow, releaseEscrow } from "../src/integrations/trustless.js";
import { integrationStatus } from "../src/integrations/status.js";

describe("Pollar Earn y rampas", () => {
  it("normaliza proveedores y APY real del SDK", async () => {
    const client = {
      getEarnProviders: vi.fn(async () => ["blend"]),
      getEarnOpportunities: vi.fn(async () => [{ id: "pool-1", name: "USDC", apy: 4.25, kind: "lending" }]),
    };
    await expect(earnOverview(client)).resolves.toMatchObject({ available: true, providers: ["blend"], opportunities: [{ provider: "blend", apy: 4.25 }] });
  });

  it("expone Earn apagado y errores como estado, sin lanzar", async () => {
    await expect(earnOverview({ getEarnProviders: async () => [], getEarnOpportunities: async () => [] })).resolves.toMatchObject({ available: false, reason: expect.stringContaining("deshabilitado") });
    await expect(earnOverview({ getEarnProviders: async () => { throw new Error("offline"); }, getEarnOpportunities: async () => [] })).resolves.toMatchObject({ available: false, reason: "offline" });
  });

  it("deposita, retira y cotiza con los nombres y parámetros del SDK", async () => {
    const client = {
      getEarnProviders: async () => ["blend"],
      earnDeposit: vi.fn(async (args) => ({ status: "success", args })),
      earnWithdraw: vi.fn(async (args) => ({ status: "success", args })),
      getSwapQuote: vi.fn(async () => [{ provider: "sdex", amountOut: "9" }]),
    };
    await expect(depositIdlePot(client, { provider: "blend", opportunity: "p", amount: "10" })).resolves.toMatchObject({ available: true });
    await expect(withdrawFromEarn(client, { provider: "blend", opportunity: "p", amount: "2" })).resolves.toMatchObject({ available: true });
    await expect(swapQuote(client, { from: "XLM", to: "USDC:G...", amount: "10" })).resolves.toMatchObject({ available: true, quotes: [{ provider: "sdex" }] });
    expect(client.getSwapQuote).toHaveBeenCalledWith({ sellAsset: "XLM", buyAsset: "USDC:G...", amount: "10", provider: "auto" });
  });

  it("prioriza rutas BOB/Bolivia y conserva rutas disponibles como fallback", async () => {
    const client = { getRampRoutes: vi.fn(async (direction) => ({ routes: direction === "ONRAMP" ? [{ fiat: { currency: "BOB", country: "BO" } }] : [{ fiat: { currency: "USD", country: "US" } }] })) };
    await expect(bolivianRamps(client)).resolves.toMatchObject({ available: true, boliviaOnly: true, routes: [{ fiat: { currency: "BOB" } }] });
    client.getRampRoutes = async () => ({ routes: [{ fiat: { currency: "USD", country: "US" } }] });
    await expect(bolivianRamps(client)).resolves.toMatchObject({ available: true, boliviaOnly: false, routes: [], allRoutes: [{ fiat: { currency: "USD" } }, { fiat: { currency: "USD" } }] });
  });
});

describe("Trustless Work", () => {
  it("informa si falta clave y devuelve XDR sin firmar en las escrituras", async () => {
    await expect(createGuaranteeEscrow({})).resolves.toMatchObject({ available: false, reason: expect.stringContaining("clave") });
    const fetchMock = vi.fn(async (_url, options) => new Response(JSON.stringify({ unsignedTransaction: "AAAA" }), { status: 201, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const args = { apiKey: "test-key", baseUrl: "https://trustless.test", contractId: "C123", signer: "G1", amount: "5", title: "Garantía" };
    await expect(createGuaranteeEscrow(args)).resolves.toMatchObject({ available: true, unsignedTransaction: "AAAA" });
    await fundEscrow(args);
    await releaseEscrow({ ...args, releaseSigner: "G1" });
    await getEscrow(args);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][1].headers["x-api-key"]).toBe("test-key");
    vi.unstubAllGlobals();
  });
});

describe("estado del ecosistema", () => {
  it("resume qué servicios están activos y por qué otros no", async () => {
    await expect(integrationStatus({ pollarClient: { getEarnProviders: async () => [] } })).resolves.toMatchObject({
      pollar: { active: true }, earn: { active: false }, trustless: { active: false },
    });
  });
});
