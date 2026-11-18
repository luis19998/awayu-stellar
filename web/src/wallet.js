// Billeteras: Freighter (extensión) siempre; Pollar (Google o correo, sin
// frase semilla) solo si existe VITE_POLLAR_KEY, la clave publicable
// pub_testnet_… de dashboard.pollar.xyz.
import { Networks } from "@stellar/stellar-sdk";

const POLLAR_KEY = import.meta.env.VITE_POLLAR_KEY;
export const pollarEnabled = Boolean(POLLAR_KEY);

let pollar = null;
let current = null; // { kind: "freighter" | "pollar", address }

export const wallet = () => current;

export async function connectFreighter() {
  const f = await import("@stellar/freighter-api");
  const c = await f.isConnected();
  if (!c?.isConnected) throw new Error("FREIGHTER_MISSING");
  const access = await f.requestAccess();
  if (access.error) throw new Error(access.error.message || String(access.error));
  const net = await f.getNetwork();
  if (net?.network && net.network !== "TESTNET") throw new Error("Cambiá Freighter a la red Testnet");
  current = { kind: "freighter", address: access.address };
  return current;
}

async function getPollar() {
  if (!POLLAR_KEY) throw new Error("Falta VITE_POLLAR_KEY");
  if (pollar) return pollar;
  const { PollarClient } = await import("@pollar/core");
  pollar = new PollarClient({ apiKey: POLLAR_KEY, stellarNetwork: "testnet", logLevel: "warn" });
  await pollar.ready();
  return pollar;
}

/** Login con Pollar. login() no devuelve nada: avisa por la suscripción. */
export async function connectPollar(provider, onReady) {
  const c = await getPollar();
  const done = () => {
    const w = c.getWallet();
    const address = w?.address || w?.publicKey;
    if (!address) return false;
    current = { kind: "pollar", address };
    onReady(current, w);
    return true;
  };
  if (done()) return;
  const off = c.onAuthStateChange(() => {
    if (done()) off?.();
  });
  c.login(typeof provider === "string" ? { provider } : provider);
}

/**
 * Firma (y en Pollar también envía). Devuelve { signedXdr } para que la red
 * la envíe, o { hash } si la billetera ya la envió.
 */
export async function sign(xdr) {
  if (!current) throw new Error("Conectá una billetera primero");
  if (current.kind === "freighter") {
    const f = await import("@stellar/freighter-api");
    const r = await f.signTransaction(xdr, { networkPassphrase: Networks.TESTNET, address: current.address });
    if (r.error) throw new Error(r.error.message || String(r.error));
    return { signedXdr: r.signedTxXdr };
  }
  const c = await getPollar();
  const out = await c.signAndSubmitTx(xdr);
  const hash = out?.hash || out?.txHash || out?.transactionHash;
  if (out?.status === "error" || out?.error) throw new Error(out.error?.message || "Pollar rechazó la transacción");
  return { hash, outcome: out };
}
