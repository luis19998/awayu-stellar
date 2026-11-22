import { sep7Pay, USDC_TESTNET_ISSUER } from "../qr/qr.js";

export const RAFFLE_KEY = "awayu.rifas";
export const MAX_TICKETS = 500;

export function ticketNumber(value) {
  const n = Number(value);
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function validPrice(value) {
  const match = /^(\d{1,12})(?:\.(\d{1,7}))?$/.exec(String(value));
  if (!match) return false;
  const stroops = BigInt(match[1] + (match[2] || "").padEnd(7, "0"));
  return stroops > 0n && stroops <= 9223372036854775807n;
}

export function ticketUri({ address, price, asset }, number) {
  const n = ticketNumber(number);
  if (!n || !validPrice(price) || !["USDC", "XLM"].includes(asset)) throw new RangeError("Invalid ticket");
  const uri = sep7Pay({
    destination: address, amount: price, assetCode: asset, assetIssuer: USDC_TESTNET_ISSUER,
    memo: `RIFA-${n}`, testnet: true,
  });
  // SEP-7 espera un decimal: conservar los siete decimales incluso para un stroop.
  return uri.replace(/([?&]amount=)[^&]+/, (_, prefix) => prefix + price);
}

export function ticketNames(entries) {
  return entries.map(({ number, name }) => `#${number} · ${name}`);
}

export function restoreRaffle(json) {
  if (!json) return null;
  const r = JSON.parse(json);
  if (!r || typeof r.title !== "string" || !r.title.trim() || typeof r.prize !== "string" || !r.prize.trim()
    || !/^G[A-Z2-7]{55}$/.test(r.address) || !validPrice(r.price) || !["USDC", "XLM"].includes(r.asset)
    || !Array.isArray(r.entries) || r.entries.length > MAX_TICKETS || typeof r.closed !== "boolean"
    || !r.entries.every(e => e && ticketNumber(e.number) === e.number && typeof e.name === "string" && e.name.trim())
    || new Set(r.entries.map(e => e.number)).size !== r.entries.length
    || (r.closed && !r.entries.length) || (r.ledger != null && (!r.closed || !Number.isSafeInteger(r.ledger) || r.ledger < 1))
    || (r.ledgerHash != null && (!r.ledger || !/^[0-9a-f]{64}$/i.test(r.ledgerHash)))) throw new Error("Invalid saved raffle");
  return r;
}
