import { encodeCode } from "../verify/draw.js";
import { toHex } from "../verify/fingerprint.js";
import { getLedgerHash, nextLedger, resolveDraw } from "./draw.js";

function delay(ms, signal) {
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
  });
}

// Cada panel tiene su propia ronda. Un reintento consulta siempre el ledger ya fijado.
export function createRound(client, signal, notify, { onTarget, onHash } = {}) {
  const state = { phase: "idle", draw: null, result: null, code: "" };
  function update(phase) {
    if (signal.aborted) return;
    state.phase = phase;
    notify();
  }
  async function finish(hash, practice = false) {
    const result = await resolveDraw(state.draw, hash);
    if (signal.aborted) return;
    state.result = result;
    if (!practice) onHash?.(hash);
    update(practice ? "practice" : "done");
  }
  async function readLedger(savedHash) {
    const draw = state.draw;
    update("waiting");
    try {
      if (!draw.ledger) {
        const sequence = await nextLedger(client);
        if (signal.aborted) return;
        draw.ledger = sequence;
        onTarget?.(sequence);
      }
      state.code = encodeCode({ ...draw, count: 1 });
      update("waiting");
      if (savedHash) return await finish(savedHash);
      for (let attempt = 0; attempt < 12 && !signal.aborted; attempt++) {
        const hash = await getLedgerHash(client, draw.ledger);
        if (signal.aborted) return;
        if (hash) return await finish(hash);
        if (attempt < 11) await delay(1200, signal);
      }
      update("pending");
    } catch { update("offline"); }
  }
  const busy = () => ["locking", "waiting"].includes(state.phase);
  return {
    state, busy,
    async start(prepare, savedHash) {
      if (busy() || signal.aborted) return;
      Object.assign(state, { draw: null, result: null, code: "" });
      update("locking");
      try {
        const draw = await prepare();
        if (signal.aborted) return;
        state.draw = draw;
      } catch { update("invalid"); return; }
      await readLedger(savedHash);
    },
    async retry() {
      if (state.draw && ["pending", "offline"].includes(state.phase)) await readLedger();
    },
    async practice() {
      if (state.draw?.kind !== "cacho" || !["pending", "offline"].includes(state.phase)) return;
      update("locking");
      state.draw = { ...state.draw, ledger: null };
      state.code = "";
      try { await finish(toHex(crypto.getRandomValues(new Uint8Array(32))), true); }
      catch { update("invalid"); }
    },
    reset() {
      if (busy()) return;
      Object.assign(state, { draw: null, result: null, code: "" });
      update("idle");
    },
  };
}
