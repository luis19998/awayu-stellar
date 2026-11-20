import { describe, expect, it, vi } from "vitest";
vi.mock("../src/qr/qr.css", () => ({}));
import { qrSvg, sep7Pay, parseScanned, inviteUrl, USDC_TESTNET_ISSUER } from "../src/qr/qr.js";

const G = "GC6YRXEASH7XBIRAUGT3VAGJ26K7U7B2MBDHTDP4WHTYU7YBZZMRSA7I";
const C = "CCNZYPMRSWINOELDI2HGMJ5O3IVA5JW4MVQGJFT2PG3ZNDWUT6DFFSRS";

describe("QR de Awayu", () => {
  it("arma un pedido de pago SEP-7 válido y lo vuelve a leer", () => {
    const uri = sep7Pay({ destination: G, amount: 25, assetCode: "USDC", assetIssuer: USDC_TESTNET_ISSUER, msg: "Cuota de noviembre" });
    expect(uri.startsWith("web+stellar:pay?destination=" + G)).toBe(true);
    expect(uri).toContain("asset_code=USDC");
    expect(uri).toContain("network_passphrase=Test%20SDF%20Network");
    const r = parseScanned(uri);
    expect(r).toMatchObject({ kind: "sep7", op: "pay", destination: G, amount: "25", asset: "USDC", msg: "Cuota de noviembre" });
  });
  it("rechaza destinos inválidos y omite el activo cuando es XLM", () => {
    expect(() => sep7Pay({ destination: "hola" })).toThrow();
    expect(sep7Pay({ destination: G, assetCode: "XLM" })).not.toContain("asset_code");
  });
  it("reconoce invitaciones a círculos y direcciones", () => {
    expect(parseScanned(inviteUrl(C, "https://awayu-two.vercel.app"))).toMatchObject({ kind: "circle", contractId: C });
    expect(parseScanned(G)).toEqual({ kind: "address", address: G });
    expect(parseScanned("hola").kind).toBe("text");
  });
  it("genera un SVG de QR", () => {
    const svg = qrSvg("https://awayu-two.vercel.app");
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("<path");
  });
});
