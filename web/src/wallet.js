// Inicio de sesión con Pollar: Google, correo o Freighter, sin frase semilla.
// Solo se activa si existe VITE_POLLAR_KEY (clave publicable pub_testnet_…,
// que se obtiene en dashboard.pollar.xyz). Sin clave, la web sigue en modo demo.

const KEY = import.meta.env.VITE_POLLAR_KEY;
let client = null;

export const pollarEnabled = Boolean(KEY);

async function getClient() {
  if (!KEY) return null;
  if (client) return client;
  const { PollarClient } = await import("@pollar/core");
  client = new PollarClient({ apiKey: KEY, stellarNetwork: "testnet", logLevel: "warn" });
  await client.ready();
  return client;
}

/** Inicia sesión y avisa con la dirección cuando la billetera está lista. */
export async function login(provider, onWallet) {
  const c = await getClient();
  if (!c) return false;
  c.onAuthStateChange(() => {
    const w = c.getWallet();
    if (w) onWallet(w.address || w.publicKey, w);
  });
  c.login({ provider }); // no se espera: informa por la suscripción
  return true;
}

export async function signAndSubmit(xdr) {
  const c = await getClient();
  if (!c) throw new Error("Pollar no está configurado");
  return c.signAndSubmitTx(xdr);
}
