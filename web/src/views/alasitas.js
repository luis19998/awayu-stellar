import * as THREE from "three";
import { PALETTE } from "../aguayo.js";
import {
  createDemoGoals, depositDemo, earlyExitDemo, progressOf, streakOf, withdrawDemo,
  buildCreateGoalXdr, buildDepositXdr, buildEarlyExitXdr, buildWithdrawGoalXdr,
  readGoals, readGoal, readStreak, submit,
} from "../modes/alasitas.js";

const STYLE = `
.awayu-alasitas{--aa-paper:#17101f;--aa-ink:#fff6e2;--aa-muted:#d3c7d9;--aa-gold:${PALETTE.amarillo};position:relative;min-height:100%;padding:clamp(16px,3vw,34px);overflow:auto;border-radius:20px;background:radial-gradient(ellipse at 50% 0%,#39203c 0%,#1c1424 44%,#100c17 100%);color:var(--aa-ink);font:500 14px/1.45 system-ui,sans-serif;isolation:isolate}
.awayu-alasitas *{box-sizing:border-box}.awayu-alasitas__head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin:0 auto 24px;max-width:1120px}.awayu-alasitas__title{margin:0;font-size:clamp(25px,4vw,40px);line-height:1.05;letter-spacing:-.035em}.awayu-alasitas__intro{max-width:510px;margin:9px 0 0;color:var(--aa-muted)}.awayu-alasitas__new,.awayu-alasitas__action,.awayu-alasitas__secondary,.awayu-alasitas__dialog button{min-height:42px;padding:10px 15px;border:1px solid #f9c22e66;border-radius:9px;background:#f9c22e;color:#21150c;font:650 14px system-ui;cursor:pointer}.awayu-alasitas__new{white-space:nowrap}.awayu-alasitas__new:hover,.awayu-alasitas__action:hover{background:#ffdb67}.awayu-alasitas button:focus-visible,.awayu-alasitas input:focus-visible,.awayu-alasitas select:focus-visible{outline:3px solid #54e3dc;outline-offset:3px}.awayu-alasitas__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,275px),1fr));gap:16px;max-width:1120px;margin:0 auto}.awayu-alasitas__stall{position:relative;display:flex;min-height:352px;flex-direction:column;padding:0 17px 17px;border:1px solid #ffffff24;border-radius:16px;background:linear-gradient(145deg,#ffffff0d,#ffffff04 55%),#21182a;box-shadow:0 12px 30px #05030b3d}.awayu-alasitas__mini{height:156px;margin:0 -17px 12px;border-radius:15px 15px 0 0;background:linear-gradient(180deg,#35253b,#21182a 80%)}.awayu-alasitas__name{margin:0;font-size:18px;line-height:1.2}.awayu-alasitas__meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:7px 0 11px;color:var(--aa-muted);font-size:12px}.awayu-alasitas__bar{height:9px;overflow:hidden;border-radius:10px;background:#100b16}.awayu-alasitas__fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#b67016,#f9c22e 68%,#fff0a4);box-shadow:0 0 12px #f9c22e7d;transition:width .45s ease}.awayu-alasitas__numbers{display:flex;justify-content:space-between;gap:8px;margin:7px 0 10px;color:#eadfbf;font-size:12px}.awayu-alasitas__members{margin:0 0 13px;color:var(--aa-muted);font-size:12px}.awayu-alasitas__flames{color:#ff9b42;letter-spacing:2px}.awayu-alasitas__buttons{display:flex;align-items:center;gap:8px;margin-top:auto}.awayu-alasitas__action{flex:1}.awayu-alasitas__secondary{border-color:#ffffff3d;background:transparent;color:var(--aa-ink)}.awayu-alasitas__secondary:hover{background:#ffffff12}.awayu-alasitas__secondary[hidden]{display:none}.awayu-alasitas__empty{grid-column:1/-1;padding:28px;border:1px dashed #ffffff45;border-radius:14px;color:var(--aa-muted);text-align:center}.awayu-alasitas__dialog{width:min(440px,calc(100% - 28px));padding:0;border:1px solid #ffffff35;border-radius:16px;background:#201728;color:var(--aa-ink);box-shadow:0 22px 75px #0009}.awayu-alasitas__dialog::backdrop{background:#090610b8;backdrop-filter:blur(4px)}.awayu-alasitas__form{display:grid;gap:13px;padding:21px}.awayu-alasitas__form h2{margin:0 0 2px;font-size:21px}.awayu-alasitas__form label{display:grid;gap:5px;color:var(--aa-muted);font-size:13px}.awayu-alasitas__form input,.awayu-alasitas__form select{width:100%;height:41px;padding:8px 10px;border:1px solid #ffffff34;border-radius:8px;background:#120d18;color:var(--aa-ink);font:inherit}.awayu-alasitas__form input[type=number]{appearance:textfield}.awayu-alasitas__form menu{display:flex;justify-content:end;gap:8px;padding:0;margin:4px 0 0}.awayu-alasitas__status{min-height:20px;margin:10px auto 0;max-width:1120px;color:#ffe28a;font-size:13px}.awayu-alasitas__confetti{position:absolute;inset:0;z-index:5;pointer-events:none}.awayu-alasitas__sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:600px){.awayu-alasitas__head{align-items:start;flex-direction:column}.awayu-alasitas__new{width:100%}.awayu-alasitas__stall{min-height:338px}}
@media(prefers-reduced-motion:reduce){.awayu-alasitas__fill{transition:none}}
`;

const COPY = {
  es: { title: "Tus miniaturas, tus metas", intro: "En Alasitas soñamos en pequeño. Aquí cada miniatura representa un ahorro real, propio o compartido.", add: "Nueva meta", save: "Ahorrar", withdraw: "Retirar", exit: "Retirar mi aporte", saved: "ahorrado", goal: "Meta", people: "Personas", week: "semanas seguidas", ready: "Meta alcanzada", unlock: "Disponible", closed: "Meta cerrada", empty: "Todavía no hay metas. Crea la primera miniatura para empezar.", depositTitle: "¿Cuánto quieres ahorrar?", amount: "Monto", createTitle: "Arma una miniatura", titleLabel: "Nombre de la meta", kindLabel: "Miniatura", targetLabel: "Meta de ahorro", dateLabel: "Retirar desde", membersLabel: "Participantes (separados por coma)", cancel: "Volver", create: "Crear meta", savedOk: "Aporte guardado.", withdrawn: "Aportes repartidos según lo que puso cada persona.", exited: "Tu aporte volvió a tu billetera.", created: "Tu meta ya está en la feria.", currency: "XLM", types: { casa: "Casita", auto: "Auto", estudio: "Birrete", negocio: "Tienda", viaje: "Viaje", salud: "Salud", otro: "Otra meta" } },
  en: { title: "Your miniatures, your goals", intro: "At Alasitas we dream small. Here, each miniature stands for real savings, shared or personal.", add: "New goal", save: "Save", withdraw: "Withdraw", exit: "Withdraw my share", saved: "saved", goal: "Goal", people: "People", week: "weeks in a row", ready: "Goal reached", unlock: "Available", closed: "Goal closed", empty: "No goals yet. Create your first miniature to get started.", depositTitle: "How much would you like to save?", amount: "Amount", createTitle: "Make a miniature", titleLabel: "Goal name", kindLabel: "Miniature", targetLabel: "Savings target", dateLabel: "Withdraw from", membersLabel: "Participants (comma-separated)", cancel: "Back", create: "Create goal", savedOk: "Savings added.", withdrawn: "Savings returned according to each person's contributions.", exited: "Your contribution was returned to your wallet.", created: "Your goal is now at the fair.", currency: "XLM", types: { casa: "Little house", auto: "Car", estudio: "Graduation cap", negocio: "Shop", viaje: "Trip", salud: "Health", otro: "Other goal" } },
};
const TYPES = ["casa", "auto", "estudio", "negocio", "viaje", "salud", "otro"];
const money = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);

function material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.68, ...extra }); }
function block(parent, color, position, scale, radius = 0.04) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale), material(color, { metalness: 0.03 }));
  mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function cone(parent, color, position, radius, height, sides = 4) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), material(color));
  mesh.position.set(...position); mesh.rotation.y = sides === 4 ? Math.PI / 4 : 0; mesh.castShadow = true; parent.add(mesh); return mesh;
}
function buildMiniature(kind, group) {
  const cream = PALETTE.crema, red = PALETTE.rojo, teal = PALETTE.turquesa, blue = PALETTE.azul;
  if (kind === "casa") {
    block(group, cream, [0, 0.1, 0], [0.9, 0.72, 0.7]); cone(group, red, [0, 0.72, 0], 0.72, 0.68);
    block(group, blue, [0, -0.08, 0.37], [0.2, 0.38, 0.04]); block(group, teal, [-0.27, 0.15, 0.37], [0.15, 0.15, 0.04]); block(group, teal, [0.27, 0.15, 0.37], [0.15, 0.15, 0.04]);
  } else if (kind === "auto") {
    block(group, red, [0, 0, 0], [1.2, 0.4, 0.62]); block(group, teal, [0, 0.27, 0], [0.65, 0.3, 0.5]);
    for (const x of [-0.36, 0.36]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12), material(PALETTE.negro)); wheel.rotation.x = Math.PI / 2; wheel.position.set(x, -0.2, 0.32); group.add(wheel); }
  } else if (kind === "estudio") {
    block(group, blue, [0, -0.1, 0], [0.72, 0.72, 0.55]); block(group, red, [0, 0.28, 0], [0.86, 0.06, 0.66]);
    const cap = block(group, PALETTE.negro, [0, 0.43, 0], [0.82, 0.07, 0.7]); cap.rotation.z = -0.12;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.43, 6), material(PALETTE.amarillo)); tassel.position.set(0.27, 0.28, 0.1); group.add(tassel);
  } else if (kind === "negocio") {
    block(group, cream, [0, 0, 0], [1.0, 0.75, 0.63]); block(group, blue, [0, 0.48, 0], [1.08, 0.16, 0.76]);
    for (let i = 0; i < 5; i++) block(group, i % 2 ? cream : red, [-0.43 + i * 0.215, 0.34, 0.36], [0.215, 0.2, 0.04]);
    block(group, teal, [0, -0.12, 0.34], [0.36, 0.42, 0.04]);
  } else if (kind === "viaje") {
    block(group, red, [0, -0.04, 0], [0.72, 0.82, 0.42]); block(group, teal, [0, 0.27, 0.24], [0.5, 0.22, 0.08]);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 7, 14, Math.PI), material(PALETTE.amarillo)); handle.position.set(0, 0.42, 0); handle.rotation.z = Math.PI; group.add(handle);
  } else if (kind === "salud") {
    block(group, cream, [0, 0, 0], [0.52, 0.94, 0.42]); block(group, red, [0, 0.05, 0.23], [0.2, 0.7, 0.06]); block(group, red, [0, 0.05, 0.24], [0.62, 0.2, 0.06]);
  } else {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.34, 0.65, 7), material(PALETTE.naranja)); pot.position.y = -0.05; group.add(pot);
    const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 5), material(PALETTE.verde)); sprout.position.y = 0.53; group.add(sprout);
  }
}

function makeMini(canvas, goal, reduced) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); }
  catch { canvas.hidden = true; const fallback = document.createElement("span"); fallback.className = "awayu-alasitas__sr"; fallback.textContent = goal.kind; canvas.after(fallback); return () => fallback.remove(); }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20); camera.position.set(0, 1.15, 4.6); camera.lookAt(0, 0.1, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.65)); const key = new THREE.DirectionalLight(0xffd580, 3.2); key.position.set(-3, 5, 5); scene.add(key);
  const group = new THREE.Group(); scene.add(group); buildMiniature(goal.kind, group);
  const fillHeight = Math.max(0.035, Math.min(1, progressOf(goal).ratio) * 0.6);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, fillHeight, 16), material(PALETTE.amarillo, { emissive: PALETTE.amarillo, emissiveIntensity: 0.22, metalness: 0.55, roughness: 0.28 }));
  fill.position.set(0.75, -0.33 + fillHeight / 2, 0.18); group.add(fill);
  renderer.render(scene, camera);
  const resize = () => { const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.render(scene, camera); };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  let raf = 0; let stopped = false;
  const spin = () => { if (stopped || reduced.matches) return; group.rotation.y += 0.006; renderer.render(scene, camera); raf = requestAnimationFrame(spin); };
  if (!reduced.matches) raf = requestAnimationFrame(spin);
  const cleanup = () => { stopped = true; cancelAnimationFrame(raf); observer.disconnect(); group.traverse((item) => { item.geometry?.dispose(); if (Array.isArray(item.material)) item.material.forEach((m) => m.dispose()); else item.material?.dispose(); }); renderer.dispose(); };
  return cleanup;
}

export function mount(container, opts = {}) {
  if (!container) throw new TypeError("alasitas.mount necesita un contenedor");
  let lang = opts.lang === "en" ? "en" : "es"; let t = COPY[lang];
  let isChain = opts.mode === "testnet" && opts.deployment?.alasitasContractId;
  let address = opts.address || "";
  let goals = createDemoGoals(); let stopped = false; let busy = false; let renderVersion = 0;
  let miniDisposers = [];
  const root = document.createElement("section"); root.className = "awayu-alasitas"; root.setAttribute("aria-label", t.title);
  const style = document.createElement("style"); style.textContent = STYLE;
  const header = document.createElement("header"); header.className = "awayu-alasitas__head";
  const intro = document.createElement("div"); const title = document.createElement("h1"); title.className = "awayu-alasitas__title"; title.textContent = t.title;
  const description = document.createElement("p"); description.className = "awayu-alasitas__intro"; description.textContent = t.intro; intro.append(title, description);
  const addButton = document.createElement("button"); addButton.className = "awayu-alasitas__new"; addButton.type = "button"; addButton.textContent = t.add; header.append(intro, addButton);
  const grid = document.createElement("div"); grid.className = "awayu-alasitas__grid"; grid.setAttribute("aria-live", "polite");
  const status = document.createElement("p"); status.className = "awayu-alasitas__status"; status.setAttribute("role", "status");
  const dialog = document.createElement("dialog"); dialog.className = "awayu-alasitas__dialog";
  const form = document.createElement("form"); form.className = "awayu-alasitas__form"; form.method = "dialog";
  dialog.append(form); root.append(style, header, grid, status, dialog); container.append(root);
  const reduced = matchMedia?.("(prefers-reduced-motion: reduce)") || { matches: true };
  let resizeObserver;

  function setStatus(message) { status.textContent = message; }
  function disposeMinis() { miniDisposers.forEach((dispose) => dispose()); miniDisposers = []; }
  function render() {
    if (stopped) return; renderVersion++; disposeMinis(); grid.replaceChildren();
    if (!goals.length) { const empty = document.createElement("p"); empty.className = "awayu-alasitas__empty"; empty.textContent = t.empty; grid.append(empty); return; }
    for (const goal of goals) {
      const card = document.createElement("article"); card.className = "awayu-alasitas__stall";
      const canvas = document.createElement("canvas"); canvas.className = "awayu-alasitas__mini"; canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", `${t.types[goal.kind] || t.types.otro}: ${goal.title}`);
      const name = document.createElement("h2"); name.className = "awayu-alasitas__name"; name.textContent = goal.title;
      const meta = document.createElement("div"); meta.className = "awayu-alasitas__meta"; const type = document.createElement("span"); type.textContent = t.types[goal.kind] || t.types.otro; const memberLabel = document.createElement("span"); memberLabel.textContent = `${goal.members?.length || 1} ${t.people.toLowerCase()}`; meta.append(type, memberLabel);
      const bar = document.createElement("div"); bar.className = "awayu-alasitas__bar"; bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-label", `${t.goal}: ${goal.title}`); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(goal.target)); bar.setAttribute("aria-valuenow", String(goal.saved)); const fill = document.createElement("div"); fill.className = "awayu-alasitas__fill"; fill.style.width = `${progressOf(goal).ratio * 100}%`; bar.append(fill);
      const numbers = document.createElement("div"); numbers.className = "awayu-alasitas__numbers"; const saved = document.createElement("span"); saved.textContent = `${money(goal.saved)} ${goal.token || t.currency} ${t.saved}`; const target = document.createElement("span"); target.textContent = `${t.goal}: ${money(goal.target)}`; numbers.append(saved, target);
      const people = document.createElement("p"); people.className = "awayu-alasitas__members"; const me = isChain ? address : "Tú"; const streak = streakOf(goal, me) || streakOf(goal, "Tú"); people.append(document.createTextNode(`${goal.members?.join(", ") || me} · `)); const flames = document.createElement("span"); flames.className = "awayu-alasitas__flames"; flames.setAttribute("aria-label", `${streak} ${t.week}`); flames.textContent = `${"🔥".repeat(Math.min(streak, 7))} ${streak} ${t.week}`; people.append(flames);
      const actions = document.createElement("div"); actions.className = "awayu-alasitas__buttons";
      const deposit = document.createElement("button"); deposit.type = "button"; deposit.className = "awayu-alasitas__action"; deposit.textContent = t.save; deposit.disabled = Boolean(goal.closed) || (isChain && !address);
      const eligible = progressOf(goal).ratio >= 1 || Date.now() / 1000 >= goal.unlockAt;
      const withdraw = document.createElement("button"); withdraw.type = "button"; withdraw.className = "awayu-alasitas__secondary"; withdraw.textContent = goal.closed ? t.closed : progressOf(goal).ratio >= 1 ? t.ready : t.withdraw; withdraw.disabled = Boolean(goal.closed) || !eligible; withdraw.title = `${t.unlock}: ${new Date(goal.unlockAt * 1000).toLocaleDateString(lang)}`;
      const exit = document.createElement("button"); exit.type = "button"; exit.className = "awayu-alasitas__secondary"; exit.textContent = t.exit; exit.hidden = Boolean(goal.closed) || eligible; exit.disabled = isChain && !address;
      deposit.addEventListener("click", () => openAmount(goal, "deposit")); withdraw.addEventListener("click", () => runAction(goal, "withdraw")); exit.addEventListener("click", () => runAction(goal, "exit"));
      actions.append(deposit, withdraw, exit); card.append(canvas, name, meta, bar, numbers, people, actions); grid.append(card);
      miniDisposers.push(makeMini(canvas, goal, reduced));
    }
  }

  function showForm(titleText, fields, onSubmit) {
    form.replaceChildren(); const heading = document.createElement("h2"); heading.textContent = titleText; form.append(heading);
    for (const field of fields) {
      const label = document.createElement("label"); label.append(document.createTextNode(field.label));
      const input = document.createElement(field.tag || "input"); input.name = field.name; input.required = field.required !== false;
      if (field.tag === "select") for (const [value, text] of field.options) { const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option); }
      else { input.type = field.type || "text"; if (field.min != null) input.min = String(field.min); if (field.step) input.step = String(field.step); if (field.value) input.value = field.value; if (field.maxLength) input.maxLength = field.maxLength; }
      label.append(input); form.append(label);
    }
    const menu = document.createElement("menu"); const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = t.cancel; cancel.addEventListener("click", () => dialog.close()); const submitButton = document.createElement("button"); submitButton.type = "submit"; submitButton.textContent = t.create; menu.append(cancel, submitButton); form.append(menu);
    form.onsubmit = (event) => { event.preventDefault(); if (!form.reportValidity()) return; const data = Object.fromEntries(new FormData(form)); dialog.close(); onSubmit(data); };
    dialog.showModal(); form.querySelector("input,select")?.focus();
  }
  function openAmount(goal, action) {
    showForm(t.depositTitle, [{ name: "amount", label: t.amount, type: "number", min: 0.0000001, step: "any", value: "10" }], (data) => runAction(goal, action, Number(data.amount)));
  }
  addButton.addEventListener("click", () => showForm(t.createTitle, [
    { name: "title", label: t.titleLabel, maxLength: 80 },
    { name: "kind", label: t.kindLabel, tag: "select", options: TYPES.map((kind) => [kind, t.types[kind]]) },
    { name: "target", label: t.targetLabel, type: "number", min: 0.0000001, step: "any", value: "100" },
    { name: "unlock", label: t.dateLabel, type: "date", value: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
    { name: "members", label: t.membersLabel, required: false },
  ], (data) => createGoal(data)));

  async function signAndSubmit(build) {
    if (typeof opts.sign !== "function") throw new Error(lang === "en" ? "Connect a wallet to sign this action." : "Conectá una billetera para firmar esta acción.");
    return submit(opts.deployment, await opts.sign(await build()));
  }
  async function loadChainGoals() {
    // Sin billetera mostramos las metas públicas de ejemplo que dejó el despliegue
    if (!address) {
      const ids = (opts.deployment?.alasitas?.goals || []).filter((id) => id !== null && id !== undefined);
      const rows = await Promise.all(ids.map((id) => readGoal(opts.deployment, id).catch(() => null)));
      return rows.filter(Boolean).map((goal) => ({ ...goal, streaks: {} }));
    }
    const rows = await readGoals(opts.deployment, address);
    return Promise.all(rows.map(async (goal) => ({
      ...goal,
      streaks: { [address]: await readStreak(opts.deployment, address, goal.id) },
    })));
  }
  async function runAction(goal, action, amount) {
    if (busy) return; busy = true; setStatus("");
    try {
      if (isChain) {
        if (action === "deposit") await signAndSubmit(() => buildDepositXdr(opts.deployment, address, goal.id, amount));
        else if (action === "exit") await signAndSubmit(() => buildEarlyExitXdr(opts.deployment, address, goal.id));
        else await signAndSubmit(() => buildWithdrawGoalXdr(opts.deployment, address, goal.id));
        goals = await loadChainGoals();
      } else if (action === "deposit") goals = depositDemo(goals, goal.id, "Tú", amount);
      else if (action === "exit") { const result = earlyExitDemo(goals, goal.id, "Tú"); goals = result.goals; }
      else { const result = withdrawDemo(goals, goal.id); goals = result.goals; }
      setStatus(action === "deposit" ? t.savedOk : action === "exit" ? t.exited : t.withdrawn); render();
      if (action === "deposit" && progressOf(goals.find((item) => item.id === goal.id)).ratio >= 1) celebrate();
    } catch (error) { setStatus(error?.message || (lang === "en" ? "The action could not be completed." : "No se pudo completar la acción.")); }
    finally { busy = false; }
  }
  async function createGoal(data) {
    if (busy) return; busy = true; setStatus("");
    try {
      const unlockAt = Math.floor(new Date(`${data.unlock}T00:00:00`).getTime() / 1000);
      const participants = (data.members || "").split(",").map((name) => name.trim()).filter(Boolean);
      if (isChain) {
        const members = [...new Set([address, ...participants])];
        await signAndSubmit(() => buildCreateGoalXdr(opts.deployment, address, { title: data.title.trim(), kind: data.kind, target: Number(data.target), unlockAt, members }));
        goals = await loadChainGoals();
      } else {
        const id = Math.max(-1, ...goals.map((goal) => goal.id)) + 1;
        const members = ["Tú", ...participants];
        goals = [...goals, { id, title: data.title.trim(), kind: data.kind, target: Number(data.target), saved: 0, unlockAt, token: t.currency, members, contributions: Object.fromEntries(members.map((member) => [member, 0])), streaks: Object.fromEntries(members.map((member) => [member, 0])), closed: false }];
      }
      setStatus(t.created); render();
    } catch (error) { setStatus(error?.message || (lang === "en" ? "The goal could not be created." : "No se pudo crear la meta.")); }
    finally { busy = false; }
  }
  function celebrate() {
    if (reduced.matches || stopped) return;
    const canvas = document.createElement("canvas"); canvas.className = "awayu-alasitas__confetti"; canvas.setAttribute("aria-hidden", "true"); root.append(canvas);
    const ctx = canvas.getContext("2d"); const rect = root.getBoundingClientRect(); const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; ctx.scale(ratio, ratio);
    const colors = Object.values(PALETTE); const pieces = Array.from({ length: 80 }, () => ({ x: Math.random() * rect.width, y: -Math.random() * rect.height * 0.35, vy: 1.5 + Math.random() * 3, vx: (Math.random() - 0.5) * 1.3, color: colors[Math.floor(Math.random() * colors.length)], size: 3 + Math.random() * 5 }));
    let frame = 0; const start = performance.now(); const draw = (now) => { ctx.clearRect(0, 0, rect.width, rect.height); for (const p of pieces) { p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size * 1.6); } if (now - start < 1700 && !stopped) frame = requestAnimationFrame(draw); else { cancelAnimationFrame(frame); canvas.remove(); } }; frame = requestAnimationFrame(draw);
  }
  async function load() { if (!isChain) return; try { goals = await loadChainGoals(); if (!stopped) render(); } catch (error) { setStatus(error?.message || (lang === "en" ? "Savings goals could not be loaded." : "No se pudieron cargar las metas.")); } }
  render(); load();
  return {
    update(next = {}) {
      Object.assign(opts, next);
      const oldChain = isChain; const oldAddress = address;
      lang = opts.lang === "en" ? "en" : "es"; t = COPY[lang];
      isChain = opts.mode === "testnet" && Boolean(opts.deployment?.alasitasContractId); address = opts.address || "";
      if (oldChain !== isChain || oldAddress !== address || next.deployment) { goals = isChain ? [] : createDemoGoals(); load(); }
      setStatus(""); title.textContent = t.title; description.textContent = t.intro; addButton.textContent = t.add;
      root.setAttribute("aria-label", t.title); render();
    },
    destroy() { if (stopped) return; stopped = true; disposeMinis(); dialog.close(); root.remove(); },
  };
}
