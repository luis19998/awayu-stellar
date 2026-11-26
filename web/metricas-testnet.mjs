// Métricas de actividad on-chain de Awayu en testnet: invocaciones por contrato
// (Stellar Expert), círculos del registro y cuentas distintas que participaron.
//   node web/metricas-testnet.mjs      → web/public/metricas.json y docs/METRICAS.md
import fs from "node:fs";
import * as chain from "./src/chain.js";

const read = (f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const dep = { ...read("./public/testnet.json") };
let ev = null;
try { ev = read("./public/evidencia.json"); } catch { /* sin evidencia */ }

const registry = await chain.readRegistry(dep);
const ids = new Map();
const add = (id, kind) => id && !ids.has(id) && ids.set(id, kind);
for (const id of dep.circulos || []) add(id, "pasanaku");
for (const r of registry) add(r.contractId, "pasanaku");
add(dep.registro, "registro");
add(dep.ayni?.contractId, "ayni");
add(dep.minka?.contractId, "minka");
add(dep.alasitas?.contractId, "alasitas");
add(dep.sorteo?.contractId, "sorteo");
add(dep.remate?.contractId, "remate");
if (ev) for (const [k, id] of Object.entries(ev.contracts)) add(id, k);

const rows = [];
for (const [id, kind] of ids) {
  try {
    const r = await (await fetch(`https://api.stellar.expert/explorer/testnet/contract/${id}`)).json();
    rows.push({ id, kind, invocations: r.invocations || 0, events: r.events || 0, errors: r.errors || 0 });
  } catch {
    rows.push({ id, kind, invocations: null });
  }
  await new Promise((r) => setTimeout(r, 300));
}

const accounts = new Set();
for (const r of rows.filter((x) => x.kind === "pasanaku")) {
  try { (await chain.readCircle(dep, r.id)).members.forEach((m) => accounts.add(m.address)); } catch { /* círculo vencido */ }
}
for (const a of dep.ayni?.members || []) accounts.add(a);
for (const a of Object.keys(dep.ayni?.memberNames || {})) accounts.add(a);
for (const a of dep.minka?.validators || []) accounts.add(a);
for (const a of dep.alasitas?.owners || []) accounts.add(a);
if (ev) for (const a of Object.values(ev.accounts)) accounts.add(a);
let nuevos = null;
try { nuevos = read("./public/contratos-nuevos.json"); } catch { /* sin contratos nuevos */ }
if (nuevos) for (const a of Object.values(nuevos.accounts)) accounts.add(a);

const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
const byKind = Object.fromEntries([...new Set(rows.map((r) => r.kind))].map((k) => [k, rows.filter((r) => r.kind === k).length]));
const out = {
  measuredAt: new Date().toISOString(),
  contracts: rows.length, byKind,
  registeredCircles: registry.length,
  invocations: sum("invocations"), events: sum("events"), errors: sum("errors"),
  distinctAccounts: accounts.size,
  rows,
};
fs.writeFileSync(new URL("./public/metricas.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
const md = [
  "# Métricas on-chain (Stellar testnet)",
  "",
  `Medido el ${out.measuredAt.slice(0, 16).replace("T", " ")} UTC con \`node web/metricas-testnet.mjs\` (invocaciones según la API de Stellar Expert; miembros leídos de los contratos).`,
  "",
  "| Métrica | Valor |",
  "|---|---|",
  `| Contratos de Awayu desplegados | ${out.contracts} (${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(", ")}) |`,
  `| Círculos en el registro on-chain | ${out.registeredCircles} |`,
  `| Invocaciones de contratos | ${out.invocations} |`,
  `| Eventos emitidos | ${out.events} |`,
  `| Invocaciones con error | ${out.errors} |`,
  `| Cuentas distintas que participaron | ${out.distinctAccounts} |`,
  "",
  "Origen honesto de la actividad: casi toda viene de cuentas efímeras de nuestros scripts (`scripts/demo-testnet.sh`, `scripts/modos-testnet.sh`, `web/evidencia-testnet.mjs`, `web/contratos-nuevos.mjs`) y de pruebas del equipo. Todavía no hay usuarios externos: eso es lo que busca el piloto (ver `docs/VALIDACION.md`).",
  "",
  "| Contrato | Tipo | Invocaciones | Eventos |",
  "|---|---|---|---|",
  ...rows.map((r) => `| [\`${r.id.slice(0, 6)}…${r.id.slice(-4)}\`](https://stellar.expert/explorer/testnet/contract/${r.id}) | ${r.kind} | ${r.invocations ?? "—"} | ${r.events ?? "—"} |`),
  "",
].join("\n");
fs.writeFileSync(new URL("../docs/METRICAS.md", import.meta.url), md);
console.log(md.split("\n").slice(0, 14).join("\n"));
