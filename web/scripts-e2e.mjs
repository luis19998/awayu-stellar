// Prueba de punta a punta de src/chain.js en Stellar testnet con cuentas
// efímeras (Friendbot): crear un círculo, dos aportes y el pago del pozo.
// Uso: node web/scripts-e2e.mjs   (desde la raíz del repo)
import fs from "node:fs";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import * as chain from "./src/chain.js";

const dep = JSON.parse(fs.readFileSync(new URL("./public/testnet.json", import.meta.url), "utf8"));
const signer = (kp) => (x) => {
  const t = TransactionBuilder.fromXDR(x, chain.PASSPHRASE);
  t.sign(kp);
  return { signedXdr: t.toXDR() };
};
const a = Keypair.random();
const b = Keypair.random();
for (const k of [a, b]) await chain.ensureFunded(dep, k.publicKey());
const created = await chain.submit(dep, signer(a)(await chain.buildCreateXdr(dep, a.publicKey(), {
  members: [a.publicKey(), b.publicKey()], amount: 5, periodSeconds: 600,
})));
const id = created.value;
console.log("círculo", id);
for (const k of [a, b]) {
  const r = await chain.submit(dep, signer(k)(await chain.buildContributeXdr(dep, id, k.publicKey())));
  console.log("aporte", chain.short(k.publicKey()), "marca", r.value);
}
const p = await chain.submit(dep, signer(b)(await chain.buildPayoutXdr(dep, id, b.publicKey())));
console.log("pozo para", chain.short(String(p.value)));
const c = await chain.readCircle(dep, id);
console.log("ronda", c.round, "historiales", c.members.map((m) => m.history.join("")));
