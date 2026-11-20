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
  if (net?.network && net.network !== "TESTNET") throw new Error("Cambia Freighter a la red Testnet");
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

/**
 * Login con Pollar. login() no devuelve nada y avisa por la suscripción, así
 * que esta función envuelve el flujo en una promesa: se resuelve con la
 * billetera lista y se rechaza si el login falla, se cancela o tarda demasiado.
 */
export async function connectPollar(provider) {
  const c = await getPollar();
  const ready = () => {
    const w = c.getWallet();
    const address = w?.address || w?.publicKey;
    return address ? (current = { kind: "pollar", address }) : null;
  };
  if (ready()) return current;
  return new Promise((resolve, reject) => {
    let started = false;
    let settled = false;
    let off = null;
    const timer = setTimeout(() => finish(new Error("El inicio de sesión tardó demasiado")), 5 * 60 * 1000);
    off = c.onAuthStateChange((state) => {
      const w = ready();
      if (w) return finish(null, w);
      const step = state?.step || c.getAuthState?.()?.step;
      if (step && step !== "idle") started = true;
      if (step === "error") finish(new Error(state?.error?.message || "Pollar no pudo iniciar sesión"));
      else if (step === "idle" && started) finish(new Error("Inicio de sesión cancelado"));
    });
    function finish(err, w) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      off?.();
      err ? reject(err) : resolve(w);
    }
    c.login(typeof provider === "string" ? { provider } : provider);
  });
}

/**
 * Firma (y en Pollar también envía). Devuelve { signedXdr } para que la red
 * la envíe, o { hash } si la billetera ya la envió.
 */
export async function sign(xdr) {
  if (!current) throw new Error("Conecta una billetera primero");
  const [{ ensureConsent }, { getLang }] = await Promise.all([import("./legal/consent.js"), import("./i18n.js")]);
  if (!(await ensureConsent(getLang()))) throw new Error("Debes aceptar los términos y el aviso de riesgos antes de firmar.");
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
