import { sha256 } from "./fingerprint.js";

const encoder = new TextEncoder();
const cryptoApi = () => {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable");
  return globalThis.crypto;
};

export function normalizeParticipants(input) {
  const rows = Array.isArray(input) ? input : String(input ?? "").split(/\r?\n/);
  const participants = rows.map((name) => String(name ?? "").trim()).filter(Boolean);
  if (participants.length > 500) throw new RangeError("A draw can contain at most 500 participants");
  return participants;
}

export function normalizeTitle(title) {
  return String(title ?? "").trim();
}

/**
 * Canonical commitment format is UTF-8 JSON with stable keys:
 * {\"title\": trimmed title, \"participants\": trimmed nonempty lines}.
 */
export async function listHash(title, participants) {
  const canonical = JSON.stringify({
    title: normalizeTitle(title),
    participants: normalizeParticipants(participants),
  });
  return sha256(canonical);
}

export async function drawSeed(commitmentHash, ledgerHash) {
  if (!/^[0-9a-f]{64}$/i.test(commitmentHash) || !/^[0-9a-f]{64}$/i.test(ledgerHash)) {
    throw new TypeError("Expected SHA-256 hashes in hexadecimal");
  }
  return sha256(commitmentHash.toLowerCase() + ":" + ledgerHash.toLowerCase());
}

function fromHex(hex) {
  return Uint8Array.from(hex.match(/../g), (part) => parseInt(part, 16));
}

/**
 * Deterministic Fisher–Yates. The byte stream starts with the seed digest;
 * each exhausted 32-byte block is SHA-256 of the previous block. Four
 * successive bytes form a big-endian uint32. Rejection sampling avoids
 * modulo bias before choosing each swap index.
 */
export async function shuffleDeterministic(items, seedHex) {
  if (!/^[0-9a-f]{64}$/i.test(seedHex)) throw new TypeError("Expected a SHA-256 seed");
  const result = [...items];
  let block = fromHex(seedHex.toLowerCase());
  let cursor = 0;
  async function nextWord() {
    if (cursor + 4 > block.length) {
      block = new Uint8Array(await cryptoApi().subtle.digest("SHA-256", block));
      cursor = 0;
    }
    const value = (((block[cursor] * 256 + block[cursor + 1]) * 256 + block[cursor + 2]) * 256 + block[cursor + 3]) >>> 0;
    cursor += 4;
    return value;
  }
  for (let i = result.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = Math.floor(0x100000000 / range) * range;
    let value;
    do { value = await nextWord(); } while (value >= limit);
    const j = value % range;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function drawResult({ title, participants, ledgerHash, count } = {}) {
  const list = normalizeParticipants(participants);
  if (!list.length) throw new RangeError("Add at least one participant");
  const commitment = await listHash(title, list);
  const seed = await drawSeed(commitment, ledgerHash);
  const order = await shuffleDeterministic(list, seed);
  const winnerCount = Math.max(1, Math.min(list.length, Math.floor(Number(count) || list.length)));
  return { listHash: commitment, seed, order, winners: order.slice(0, winnerCount) };
}

export function encodeCode({ title, ledger, participants, count } = {}) {
  const value = {
    t: normalizeTitle(title),
    l: Number(ledger),
    p: normalizeParticipants(participants),
    n: Math.floor(Number(count) || normalizeParticipants(participants).length),
  };
  if (!value.t || !Number.isSafeInteger(value.l) || value.l < 1) throw new TypeError("Invalid ledger sequence or title");
  if (!value.p.length || !Number.isInteger(value.n) || value.n < 1 || value.n > value.p.length) throw new TypeError("Invalid draw code");
  const bytes = encoder.encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeCode(code) {
  const base64 = String(code ?? "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value.t !== "string" || !value.t.trim() || !Number.isSafeInteger(value.l) || value.l < 1 || !Array.isArray(value.p) || !value.p.every((item) => typeof item === "string") || !Number.isInteger(value.n)) {
    throw new TypeError("Invalid draw code");
  }
  const participants = normalizeParticipants(value.p);
  if (!participants.length || value.n < 1 || value.n > participants.length) throw new TypeError("Invalid draw code");
  return { title: normalizeTitle(value.t), ledger: value.l, participants, count: value.n };
}
