const SNIPPETS = [
  {
    id: "read",
    title: { es: "Leer round_info y members", en: "Read round_info and members" },
    lang: "js",
    code: `import { Account, Contract, Networks, TransactionBuilder, rpc, scValToNative } from "@stellar/stellar-sdk";\n\nconst NULL = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";\nconst server = new rpc.Server("https://soroban-testnet.stellar.org");\nconst contract = new Contract(CONTRACT_ID);\nasync function view(method) {\n  const tx = new TransactionBuilder(new Account(NULL, "0"), { fee: "100", networkPassphrase: Networks.TESTNET })\n    .addOperation(contract.call(method)).setTimeout(30).build();\n  const sim = await server.simulateTransaction(tx);\n  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);\n  return scValToNative(sim.result.retval);\n}\nconst [round, members] = await Promise.all([view("round_info"), view("members")]);`,
  },
  {
    id: "contribute",
    title: { es: "Preparar un aporte", en: "Prepare a contribution" },
    lang: "js",
    code: `import { Contract, nativeToScVal } from "@stellar/stellar-sdk";\n\nconst operation = new Contract(CONTRACT_ID).call(\n  "contribute", nativeToScVal(MEMBER_ADDRESS, { type: "address" })\n);\n// Agrega operation a una transacción, preparala con Soroban RPC,\n// pide la firma de la persona y luego envía la transacción.`,
  },
  {
    id: "cli",
    title: { es: "Invocar con Stellar CLI", en: "Invoke with Stellar CLI" },
    lang: "sh",
    code: `stellar contract invoke \\\n+  --id "$CONTRACT_ID" \\\n+  --source "$IDENTITY" \\\n+  --network testnet \\\n+  -- contribute --member "$MEMBER_ADDRESS"`,
  },
  {
    id: "rust",
    title: { es: "Vista del contrato en Rust", en: "Contract view in Rust" },
    lang: "rust",
    code: `pub fn round_info(env: Env) -> RoundInfo {\n    let cfg = config(&env);\n    let round = current_round(&env);\n    let paid = paid_map(&env, round);\n    let mut covered = 0u32;\n    if round < cfg.members.len() {\n        for member in cfg.members.iter() {\n            if !paid.contains_key(member.clone())\n                && guarantee_of(&env, &member) >= cfg.amount\n            {\n                covered += 1;\n            }\n        }\n    }\n    RoundInfo {\n        round,\n        recipient: cfg.members.get(round),\n        deadline: deadline(&cfg, round),\n        paid: paid.len(),\n        pot: cfg.amount * paid.len() as i128,\n        covered,\n    }\n}`,
  },
];
for (const snippet of SNIPPETS) snippet.title = { ...snippet.title, pt: snippet.title.es, qu: snippet.title.es, ay: snippet.title.es, gn: snippet.title.es };

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

/** Pure formatter used by the live feed and tests. The returned HTML is escaped. */
export function formatConsoleCall(detail = {}) {
  const contract = String(detail.contract || "(sin contrato)");
  const fn = String(detail.fn || "(sin función)");
  const args = Array.isArray(detail.args) ? detail.args : [];
  const status = String(detail.status || "pendiente");
  const network = String(detail.network || "testnet");
  const lines = [
    `<span class="aw-guide-code-key">contrato</span>: <span class="aw-guide-code-string">"${escapeHtml(contract)}"</span>`,
    `<span class="aw-guide-code-key">fn</span>: <span class="aw-guide-code-function">${escapeHtml(fn)}</span>`,
    `<span class="aw-guide-code-key">args</span>: <span class="aw-guide-code-punc">[</span>${args.map((arg) => { let value; try { value = JSON.stringify(arg); } catch { value = String(arg); } return `<span class="aw-guide-code-string">${escapeHtml(value ?? String(arg))}</span>`; }).join(`<span class="aw-guide-code-punc">, </span>`)}<span class="aw-guide-code-punc">]</span>`,
    `<span class="aw-guide-code-key">status</span>: <span class="aw-guide-code-status">${escapeHtml(status)}</span>`,
    `<span class="aw-guide-code-key">network</span>: <span class="aw-guide-code-string">"${escapeHtml(network)}"</span>`,
  ];
  return lines.join("\n");
}

function addStyles() {
  if (document.getElementById("aw-guide-console-style")) return;
  const style = document.createElement("style"); style.id = "aw-guide-console-style";
  style.textContent = `
    .aw-guide-console{box-sizing:border-box;width:100%;height:100%;min-height:380px;padding:18px;border:1px solid #493c62;border-radius:16px;background:#100c1b;color:#f8f5ff;font:14px/1.5 system-ui,sans-serif;overflow:auto}
    .aw-guide-console *{box-sizing:border-box}.aw-guide-console h2{margin:0 0 14px;color:#ffe29b;font-size:21px}.aw-guide-console-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;border-bottom:1px solid #493c62;padding-bottom:10px}
    .aw-guide-console button,.aw-guide-console a{min-height:38px;padding:7px 11px;border:1px solid #84729c;border-radius:8px;background:#271e38;color:#fff;font:600 13px system-ui;text-decoration:none;cursor:pointer}
    .aw-guide-console button[aria-selected="true"]{background:#f2d277;color:#24182b;border-color:#f2d277}.aw-guide-console button:focus-visible,.aw-guide-console a:focus-visible{outline:3px solid #ffe18a;outline-offset:2px}
    .aw-guide-console-panel{min-height:260px}.aw-guide-console-list{display:grid;gap:10px;max-height:430px;overflow:auto;padding:2px}
    .aw-guide-console-entry{padding:12px;border:1px solid #463958;border-radius:11px;background:#171222}.aw-guide-console-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:#d7c8e8;font-size:12px}.aw-guide-console-entry pre,.aw-guide-console-code{margin:0;padding:12px;overflow:auto;border-radius:9px;background:#090712;color:#f2edf9;font:12px/1.6 ui-monospace,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
    .aw-guide-console-empty{padding:26px;border:1px dashed #665778;border-radius:10px;color:#d5c9e2;text-align:center}.aw-guide-code-key{color:#a4d8ff}.aw-guide-code-string{color:#a8e6a1}.aw-guide-code-function{color:#e7bbff}.aw-guide-code-punc{color:#e8cf90}.aw-guide-code-status{color:#ffd878}
    .aw-guide-console-snippet{margin:0 0 14px;padding:12px;border:1px solid #463958;border-radius:11px;background:#171222}.aw-guide-console-snippet h3{margin:0 0 9px;color:#f7e6b2;font-size:15px}.aw-guide-console-snippet .aw-guide-console-code{margin-bottom:9px}
    .aw-guide-console-table{width:100%;border-collapse:collapse}.aw-guide-console-table th,.aw-guide-console-table td{padding:10px;border-bottom:1px solid #493c62;text-align:left;vertical-align:top}.aw-guide-console-note{color:#d5c9e2}
    @media(max-width:540px){.aw-guide-console{padding:12px}.aw-guide-console-table th:nth-child(2),.aw-guide-console-table td:nth-child(2){display:none}}
  `;
  document.head.append(style);
}

import { pickLang } from "../i18n.js";
const langText = (lang, es, en) => pickLang({ es, en, pt: es, qu: es, ay: es, gn: es }, lang);

export function mount(container, { lang = "es" } = {}) {
  if (!container || typeof document === "undefined") return { destroy() {} };
  addStyles();
  const root = document.createElement("section"); root.className = "aw-guide-console"; root.setAttribute("aria-label", langText(lang, "Consola de desarrollador", "Developer console"));
  const title = document.createElement("h2"); title.textContent = langText(lang, "Consola de desarrollador", "Developer console");
  const tabs = document.createElement("div"); tabs.className = "aw-guide-console-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", langText(lang, "Secciones de consola", "Console sections"));
  const panel = document.createElement("div"); panel.className = "aw-guide-console-panel"; panel.setAttribute("role", "tabpanel");
  root.append(title, tabs, panel); container.replaceChildren(root);
  let active = "live"; let deployment = null; let destroyed = false; const calls = [];
  const labels = { live: langText(lang, "En vivo", "Live"), integrate: langText(lang, "Integra Awayu", "Integrate Awayu"), contracts: langText(lang, "Contratos", "Contracts") };
  const tabButtons = new Map();
  for (const [id, label] of Object.entries(labels)) {
    const button = document.createElement("button"); button.type = "button"; button.id = `aw-guide-tab-${id}`; button.setAttribute("role", "tab"); button.setAttribute("aria-controls", "aw-guide-panel"); button.textContent = label; button.addEventListener("click", () => { active = id; render(); }); tabs.append(button); tabButtons.set(id, button);
  }
  panel.id = "aw-guide-panel"; panel.setAttribute("aria-live", "polite");
  const renderLive = () => {
    if (!calls.length) { const empty = document.createElement("p"); empty.className = "aw-guide-console-empty"; empty.textContent = langText(lang, "Las llamadas de contrato aparecerán aquí cuando la web emita awayu:tx.", "Contract calls will appear here when the app emits awayu:tx."); panel.append(empty); return; }
    const list = document.createElement("div"); list.className = "aw-guide-console-list";
    calls.forEach((detail) => {
      const entry = document.createElement("article"); entry.className = "aw-guide-console-entry";
      const meta = document.createElement("div"); meta.className = "aw-guide-console-meta";
      const fn = document.createElement("strong"); fn.textContent = `${detail.fn || "call"} · ${detail.status || "pending"}`; meta.append(fn);
      if (detail.hash) { const link = document.createElement("a"); link.href = `https://stellar.expert/explorer/${detail.network === "pubnet" ? "public" : "testnet"}/tx/${encodeURIComponent(detail.hash)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = langText(lang, "Ver transacción ↗", "View transaction ↗"); meta.append(link); }
      entry.append(meta); const pre = document.createElement("pre"); pre.innerHTML = formatConsoleCall(detail); entry.append(pre); list.append(entry);
    });
    panel.append(list);
  };
  const renderIntegrate = () => {
    const intro = document.createElement("p"); intro.className = "aw-guide-console-note"; intro.textContent = langText(lang, "Ejemplos de lectura e invocación. Las escrituras requieren firma de una persona.", "Examples for reading and invoking. Writes require a person's signature."); panel.append(intro);
    SNIPPETS.forEach((snippet) => {
      const card = document.createElement("article"); card.className = "aw-guide-console-snippet";
      const heading = document.createElement("h3"); heading.textContent = pickLang(snippet.title, lang);
      const pre = document.createElement("pre"); pre.className = "aw-guide-console-code"; pre.textContent = snippet.code;
      const copy = document.createElement("button"); copy.type = "button"; copy.textContent = langText(lang, "Copiar", "Copy"); copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(snippet.code); copy.textContent = langText(lang, "Copiado", "Copied"); setTimeout(() => { if (!destroyed) copy.textContent = langText(lang, "Copiar", "Copy"); }, 1400); } catch { copy.textContent = langText(lang, "No se pudo copiar", "Could not copy"); } });
      card.append(heading, pre, copy); panel.append(card);
    });
  };
  const renderContracts = () => {
    if (!deployment) { const empty = document.createElement("p"); empty.className = "aw-guide-console-empty"; empty.textContent = langText(lang, "No se encontró /testnet.json o todavía está cargando.", "Could not find /testnet.json or it is still loading."); panel.append(empty); return; }
    const table = document.createElement("table"); table.className = "aw-guide-console-table";
    const head = document.createElement("thead"); const row = document.createElement("tr");
    [langText(lang, "Contrato", "Contract"), langText(lang, "Red", "Network"), langText(lang, "Dirección", "Address")].forEach((label) => { const th = document.createElement("th"); th.scope = "col"; th.textContent = label; row.append(th); }); head.append(row); table.append(head);
    const body = document.createElement("tbody");
    [[langText(lang, "Pasanaku", "Pasanaku"), deployment.contractId], [langText(lang, "Registro", "Registry"), deployment.registro], [langText(lang, "Token", "Token"), deployment.token]].filter(([, id]) => id).forEach(([name, id]) => {
      const tr = document.createElement("tr"); const label = document.createElement("th"); label.scope = "row"; label.textContent = name;
      const network = document.createElement("td"); network.textContent = deployment.network || "testnet";
      const address = document.createElement("td"); const link = document.createElement("a"); link.href = `https://stellar.expert/explorer/${deployment.network === "pubnet" ? "public" : "testnet"}/contract/${encodeURIComponent(id)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = id; address.append(link);
      tr.append(label, network, address); body.append(tr);
    });
    table.append(body); panel.append(table);
  };
  function render() {
    for (const [id, button] of tabButtons) { button.setAttribute("aria-selected", String(id === active)); button.tabIndex = id === active ? 0 : -1; }
    panel.replaceChildren();
    if (active === "live") renderLive(); else if (active === "integrate") renderIntegrate(); else renderContracts();
  }
  const onTx = (event) => { if (destroyed || !event.detail || typeof event.detail !== "object") return; calls.unshift({ ...event.detail }); if (calls.length > 100) calls.pop(); if (active === "live") render(); };
  window.addEventListener("awayu:tx", onTx); render();
  fetch("/testnet.json", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((json) => { if (!destroyed && json) { deployment = json; if (active === "contracts") render(); } }).catch(() => {});
  return { destroy() { destroyed = true; window.removeEventListener("awayu:tx", onTx); root.remove(); } };
}

export function emitTx(detail) {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return false;
  window.dispatchEvent(new CustomEvent("awayu:tx", { detail: detail || {} }));
  return true;
}
