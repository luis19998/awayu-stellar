import { decodeCode, drawSeed, encodeCode, listHash, normalizeParticipants, shuffleDeterministic } from "../verify/draw.js";
import { sha256 } from "../verify/fingerprint.js";

// Estos títulos forman parte del protocolo del código y no se traducen.
const CACHO = "Awayu/cacho/v1";
const RAFFLE = "Awayu/rifa/v1/";
const HASH = /^[0-9a-f]{64}$/i;

export async function diceFor(seedHex, index) {
  if (!HASH.test(seedHex) || !Number.isSafeInteger(index) || index < 0) throw new RangeError("Invalid seed or index");
  const dice = [];
  for (let block = 0; dice.length < 5; block++) {
    const digest = await sha256(`cacho/v1:${seedHex.toLowerCase()}:${index}:${block}`);
    for (let pos = 0; pos < digest.length && dice.length < 5; pos += 2) {
      const byte = parseInt(digest.slice(pos, pos + 2), 16);
      // 252 es múltiplo de seis. Rechazar el resto da igual probabilidad a cada cara.
      if (byte < 252) dice.push(1 + byte % 6);
    }
  }
  return dice;
}

export function scoreCacho(dice) {
  if (dice.length !== 5 || !dice.every(n => Number.isInteger(n) && n >= 1 && n <= 6)) throw new RangeError("Invalid dice");
  const counts = Array(7).fill(0);
  for (const face of dice) counts[face]++;
  if (counts.includes(5)) return { hand: "grande", points: 50 };
  if (counts.includes(4)) return { hand: "poker", points: 40 };
  if (counts.includes(3) && counts.includes(2)) return { hand: "full", points: 30 };
  if (counts.filter(Boolean).length === 5 && (!counts[1] || !counts[6])) return { hand: "straight", points: 20 };
  const max = Math.max(...counts);
  return { hand: "common", points: max * counts.lastIndexOf(max) };
}

export async function lockList(kind, names, raffleTitle = "") {
  const title = kind === "cacho" ? CACHO : RAFFLE + raffleTitle.trim();
  const participants = normalizeParticipants(names);
  if (!participants.length || (kind === "raffle" && !raffleTitle.trim())) throw new RangeError("Empty draw");
  return { kind, title, participants, commitment: await listHash(title, participants) };
}

export async function resolveDraw(draw, ledgerHash) {
  const seed = await drawSeed(draw.commitment, ledgerHash);
  const indices = draw.participants.map((_, i) => i);
  const order = await shuffleDeterministic(indices, seed);
  const rows = await Promise.all(order.map(async index => {
    const name = draw.participants[index];
    if (draw.kind === "raffle") return { name };
    const dice = await diceFor(seed, index);
    return { name, dice, ...scoreCacho(dice) };
  }));
  // El orden de la semilla se conserva entre puntajes iguales (sort estable).
  if (draw.kind === "cacho") rows.sort((a, b) => b.points - a.points);
  const code = draw.ledger ? encodeCode({ ...draw, count: 1 }) : "";
  return { rows, code };
}

export async function readDrawCode(kind, raw) {
  const code = decodeCode(raw.trim());
  const raffleTitle = code.title.slice(RAFFLE.length);
  if (code.count !== 1 || (kind === "cacho" ? code.title !== CACHO : !code.title.startsWith(RAFFLE) || !raffleTitle.trim())) {
    throw new TypeError("Wrong draw type");
  }
  return { ...await lockList(kind, code.participants, raffleTitle), ledger: code.ledger };
}

export async function nextLedger(client) {
  const { sequence } = await client.latestLedger();
  if (!Number.isSafeInteger(sequence) || sequence < 1 || !Number.isSafeInteger(sequence + 1)) throw new Error("Invalid ledger");
  return sequence + 1;
}

export async function getLedgerHash(client, sequence) {
  const record = await client.ledger(sequence);
  if (!record) return null;
  if (record.sequence !== sequence || !HASH.test(record.hash)) throw new Error("Invalid ledger response");
  return record.hash;
}
