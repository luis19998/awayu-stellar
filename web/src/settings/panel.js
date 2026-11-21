import "./settings.css";
import { getLang, LANGS, pickLang, setLang } from "../i18n.js";
import { state, subscribe } from "../state.js";
import { isMuted, setMuted } from "../sound.js";
import deployment from "../../public/testnet.json";
import packageInfo from "../../package.json";
import {
  clearActiveProfileData,
  createProfile,
  deleteProfile,
  exportActiveProfile,
  getActiveProfile,
  getProfile,
  getProfiles,
  onProfileChange,
  renameProfile,
  switchProfile,
  updateProfile,
} from "./profiles.js";

const tr = (es, en, pt, qu = es, ay = es, gn = es) => ({ es, en, pt, qu, ay, gn });
const COPY = {
  title: tr("Configuración", "Settings", "Configurações", "Ajustes", "Wakichawi", "Ñembosako'i"),
  close: tr("Cerrar configuración", "Close settings", "Fechar configurações", "Ajustes wichq'ay", "Wakichawi jist'antaña", "Emboty ñembosako'i"),
  sections: [
    tr("Perfil", "Profile", "Perfil", "Runapa willaynin", "Jaqi tuqita", "Tee rehegua"),
    tr("Usuarios de este dispositivo", "People on this device", "Pessoas neste dispositivo", "Kay dispositivopi runakuna", "Aka dispositivon jaqinaka", "Ko tembipuru oiporúva"),
    tr("Idioma", "Language", "Idioma", "Simi", "Aru", "Ñe'ẽ"),
    tr("Apariencia y accesibilidad", "Appearance and accessibility", "Aparência e acessibilidade", "Rikch'ay, yanapay", "Uñacht'äwi, yanapt'awi", "Ñema’ẽ ha jeike"),
    tr("Notificaciones y voz", "Notifications and voice", "Notificações e voz", "Willaykuna, uyariy", "Yatiyawinaka, ist'aña", "Marandu ha ñe'ẽ"),
    tr("Billetera", "Wallet", "Carteira", "Qullqi wasiy", "Qullqi imaña", "Viru renda"),
    tr("Privacidad y datos", "Privacy and data", "Privacidade e dados", "Paqay, yachay", "Jark'aqawi, yatiyäwi", "Ñemigua ha marandu"),
    tr("Ayuda", "Help", "Ajuda", "Yanapay", "Yanapt'awi", "Pytyvõ"),
  ],
  name: tr("Nombre para mostrar", "Display name", "Nome para exibição", "Rikuchinapaq suti", "Uñacht'ayañ suti", "Téra ojehechaukáva"),
  alias: tr("Alias corto", "Short alias", "Apelido curto", "Suti uchuy", "Jisk'a suti", "Téra mbyky"),
  department: tr("Departamento", "Department", "Departamento", "Suyu", "Suyu", "Tetãvore"),
  figure: tr("Personaje favorito", "Favorite character", "Personagem favorito", "Munay runa", "Munata jaqi", "Tapicha rehayhuvéva"),
  chooseFigure: tr("Elegir personaje", "Choose a character", "Escolher personagem", "Runa akllay", "Jaqi ajlliña", "Eiporavo peteĩ tapicha"),
  currency: tr("Moneda de referencia", "Reference currency", "Moeda de referência", "Qullqi", "Qullqi", "Viru"),
  saveProfile: tr("Guardar perfil", "Save profile", "Salvar perfil", "Kikin willayta waqaychay", "Perfil imaña", "Eñongatu perfil"),
  nameHint: tr("Hasta 32 caracteres", "Up to 32 characters", "Até 32 caracteres"),
  aliasHint: tr("Solo para mostrar", "For display only", "Apenas para exibição"),
  departments: ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosí", "Chuquisaca", "Tarija", "Beni", "Pando", "Fuera de Bolivia"],
  outsideBolivia: tr("Fuera de Bolivia", "Outside Bolivia", "Fora da Bolívia"),
  usd: tr("USD · dólar estadounidense", "USD · US dollar", "USD · dólar americano"),
  bob: tr("BOB · boliviano", "BOB · Bolivian boliviano", "BOB · boliviano"),
  activeProfile: tr("Perfil activo", "Active profile", "Perfil ativo", "Kunan kikin", "Jichha perfil", "Perfil ko'ág̃agua"),
  create: tr("Crear perfil", "Create profile", "Criar perfil", "Musuq perfil", "Musuq perfil", "Ejapo perfil pyahu"),
  rename: tr("Renombrar", "Rename", "Renomear", "Suti tikray", "Suti mayjt'ayaña", "Emoambue téra"),
  delete: tr("Eliminar perfil", "Delete profile", "Excluir perfil", "Perfil pichay", "Perfil chhaqtayaña", "Embogue perfil"),
  profilePrompt: tr("Nombre de este perfil", "Name this profile", "Nome deste perfil"),
  renamePrompt: tr("Nuevo nombre del perfil", "New profile name", "Novo nome do perfil"),
  deleteProfileConfirm: tr("¿Eliminar este perfil y sus preferencias de este dispositivo?", "Delete this profile and its preferences from this device?", "Excluir este perfil e suas preferências deste dispositivo?"),
  languageLead: tr("Elige el idioma de Awayu.", "Choose Awayu's language.", "Escolha o idioma do Awayu."),
  textSize: tr("Tamaño de letra", "Text size", "Tamanho do texto", "Qillqa sayay", "Qillqa jach'a", "Haipyre tuichakue"),
  contrast: tr("Alto contraste", "High contrast", "Alto contraste", "Sinchi rikch'ay", "Ch'aman uñacht'ayaña", "Ojehechaukave"),
  lessMotion: tr("Menos movimiento", "Reduce motion", "Menos movimento", "Pisi kuyuy", "Juk'a unxtaña", "Michĩve ñemomýi"),
  accent: tr("Color de acento", "Accent color", "Cor de destaque", "Rikch'aq llimp'i", "Uñacht'ir sami", "Sa'y ojehechauka hag̃ua"),
  openStudio: tr("Abrir el estudio completo", "Open the full studio", "Abrir o estúdio completo", "Sumaqchana wasita kichay", "Suma lurañ uta jist'araña", "Embojurujá mbojeguaha renda"),
  amawta: tr("Consejos de Amawta", "Amawta tips", "Dicas do Amawta"),
  sound: tr("Efectos de sonido", "Sound effects", "Efeitos sonoros"),
  voice: tr("Leer respuestas en voz alta", "Read answers aloud", "Ler respostas em voz alta"),
  on: tr("Activados", "On", "Ativados", "Kichasqa", "Luraski", "Oĩma"),
  off: tr("Desactivados", "Off", "Desativados", "Wisk'asqa", "Ch'amt'ata", "Ndaipóri"),
  connected: tr("Conectada", "Connected", "Conectada", "Tinkisqa", "Mayachata", "Mbojoaju"),
  disconnected: tr("No conectada", "Not connected", "Não conectada", "Mana tinkisqa", "Jan mayachata", "Ndojoajúi"),
  network: tr("Red", "Network", "Rede"),
  testnet: "Testnet",
  connect: tr("Conectar", "Connect", "Conectar", "Tinkiy", "Mayachaña", "Mbojoaju"),
  disconnect: tr("Desconectar", "Disconnect", "Desconectar", "T'iyay", "Jaqtaña", "Mboi"),
  copy: tr("Copiar dirección", "Copy address", "Copiar endereço"),
  copied: tr("Dirección copiada", "Address copied", "Endereço copiado"),
  dataStored: tr("Este navegador guarda preferencias, perfiles y datos de la demo.", "This browser stores preferences, profiles and demo data.", "Este navegador guarda preferências, perfis e dados da demonstração."),
  keys: tr("Claves locales", "Local keys", "Chaves locais"),
  export: tr("Exportar mis datos", "Export my data", "Exportar meus dados", "Yachayniyta hurquy", "Yatiyäwinakaja apsuña", "Eguerahauka che marandu"),
  erase: tr("Borrar mis datos de este dispositivo", "Delete my data from this device", "Apagar meus dados deste dispositivo"),
  eraseConfirm: tr("Se borrarán los datos locales de este perfil. No se borra nada de la cadena. ¿Continuar?", "This profile's local data will be deleted. Nothing on the blockchain will be erased. Continue?", "Os dados locais deste perfil serão apagados. Nada na rede será apagado. Continuar?"),
  erased: tr("Se borraron los datos locales de este perfil.", "This profile's local data was deleted.", "Os dados locais deste perfil foram apagados."),
  terms: tr("Aceptación de términos", "Terms acceptance", "Aceitação dos termos"),
  accepted: tr("Aceptados", "Accepted", "Aceitos"),
  notAccepted: tr("Aún no aceptados", "Not accepted yet", "Ainda não aceitos"),
  revoke: tr("Revocar aceptación", "Revoke acceptance", "Revogar aceitação"),
  revoked: tr("Se revocó la aceptación de términos.", "Terms acceptance was revoked.", "A aceitação dos termos foi revogada."),
  legalLink: tr("Leer términos y riesgos", "Read terms and risks", "Ler termos e riscos"),
  tour: tr("Repetir el recorrido de bienvenida", "Replay the welcome tour", "Repetir o percurso de boas-vindas"),
  tutorials: tr("Ver la lista de tutoriales", "Open the tutorial list", "Abrir a lista de tutoriais", "Yachachiykunata qhaway", "Yatichäwinaka uñjaña", "Ehecha mbo'epykuéra"),
  about: tr("Acerca de Awayu", "About Awayu", "Sobre o Awayu"),
  version: tr("Versión", "Version", "Versão"),
  contracts: tr("Contratos de testnet", "Testnet contracts", "Contratos da testnet"),
  expert: "Stellar Expert",
  lab: "Stellar Lab",
  noAddress: tr("Conecta una billetera para ver tu dirección.", "Connect a wallet to see your address.", "Conecte uma carteira para ver seu endereço."),
  noTermsDate: tr("No hay una aceptación guardada.", "No acceptance is stored.", "Não há aceitação salva."),
};

const DEPARTMENTS = [
  ["La Paz", COPY.departments[0]], ["Santa Cruz", COPY.departments[1]], ["Cochabamba", COPY.departments[2]],
  ["Oruro", COPY.departments[3]], ["Potosí", COPY.departments[4]], ["Chuquisaca", COPY.departments[5]],
  ["Tarija", COPY.departments[6]], ["Beni", COPY.departments[7]], ["Pando", COPY.departments[8]],
  ["outside", COPY.outsideBolivia],
];

const SELECTABLE = ["button:not([disabled])", "a[href]", "input:not([disabled])", "select:not([disabled])", "summary", "[tabindex]:not([tabindex='-1'])"];
const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const trPick = (value, lang = getLang()) => typeof value === "string" ? value : pickLang(value, lang);
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Se conserva el estado visible aunque el navegador bloquee el almacenamiento. */ } };
const STUDIO_DEFAULTS = { time: "auto", weather: "despejado", accent: "#ffd166", text: 1, contrast: false, calm: false, palette: null, sound: true };
const readStudioPrefs = () => {
  try { return { ...STUDIO_DEFAULTS, ...JSON.parse(storageGet("awayu.studio") || "{}") }; }
  catch { return { ...STUDIO_DEFAULTS }; }
};
const contractRows = [
  ["Pasanaku", deployment.contractId], ["Registro", deployment.registro], ["Ayni", deployment.ayni?.contractId],
  ["Minka", deployment.minka?.contractId], ["Alasitas", deployment.alasitas?.contractId],
].filter(([, id]) => Boolean(id));
const expertUrl = (id) => `https://stellar.expert/explorer/testnet/contract/${encodeURIComponent(id)}`;
const labUrl = (id) => `https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=${encodeURIComponent(id)};;`;

function check(on, lang = getLang(), setting = "", label = "") {
  return `<label class="aw-setting-check"><input type="checkbox" ${setting ? `data-setting="${setting}"` : ""} ${label ? `aria-label="${trPick(label, lang)}"` : ""} ${on ? "checked" : ""}><span class="aw-toggle-state">${trPick(on ? COPY.on : COPY.off, lang)}</span></label>`;
}

function section(id, index, body, langOrIndex, selectedLanguage) {
  const lang = selectedLanguage || langOrIndex || getLang();
  return `<details class="aw-settings-section" data-section="${id}" ${index === 0 ? "open" : ""}>
    <summary><span class="aw-settings-icon" aria-hidden="true">${["◈", "♙", "文", "✳", "♫", "◉", "◇", "?" ][index]}</span><span>${trPick(COPY.sections[index], lang)}</span><span class="aw-settings-chevron" aria-hidden="true">⌄</span></summary>
    <div class="aw-settings-body">${body}</div>
  </details>`;
}

function figureTitle(profile) {
  return profile.figure || "";
}

function walletLabel() {
  return state.address ? trPick(COPY.connected) : trPick(COPY.disconnected);
}

function renderContent(panel) {
  const lang = getLang();
  const profile = getProfile();
  const profiles = getProfiles();
  const active = getActiveProfile();
  const studio = readStudioPrefs();
  const address = state.address;
  const selectedLanguage = lang;
  const sections = [
    section("profile", 0, `<div class="aw-settings-grid">
      <label><span>${trPick(COPY.name, lang)}</span><input name="displayName" maxlength="32" autocomplete="name" value="${esc(profile.displayName)}" aria-describedby="aw-name-hint"><small id="aw-name-hint">${trPick(COPY.nameHint, lang)}</small></label>
      <label><span>${trPick(COPY.alias, lang)}</span><input name="alias" maxlength="20" autocomplete="nickname" value="${esc(profile.alias)}"><small>${trPick(COPY.aliasHint, lang)}</small></label>
      <label><span>${trPick(COPY.department, lang)}</span><select name="department"><option value="">—</option>${DEPARTMENTS.map(([value, label]) => `<option value="${esc(value)}" ${profile.department === value ? "selected" : ""}>${trPick(label, lang)}</option>`).join("")}</select></label>
      <label><span>${trPick(COPY.figure, lang)}</span><input name="figure" value="${esc(figureTitle(profile))}" readonly></label>
      <button class="aw-settings-secondary aw-figure" type="button">${trPick(COPY.chooseFigure, lang)}</button>
      <label><span>${trPick(COPY.currency, lang)}</span><select name="currency"><option value="USD" ${profile.currency !== "BOB" ? "selected" : ""}>${trPick(COPY.usd, lang)}</option><option value="BOB" ${profile.currency === "BOB" ? "selected" : ""}>${trPick(COPY.bob, lang)}</option></select></label>
    </div><button class="aw-settings-primary aw-save-profile" type="button">${trPick(COPY.saveProfile, lang)}</button>`, 0, lang),
    section("users", 1, `<label><span>${trPick(COPY.activeProfile, lang)}</span><select name="activeProfile" aria-label="${trPick(COPY.activeProfile, lang)}">${profiles.list.map((item) => `<option value="${esc(item.id)}" ${item.id === profiles.active ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label>
      <div class="aw-settings-actions"><button class="aw-settings-secondary aw-create-profile" type="button">${trPick(COPY.create, lang)}</button><button class="aw-settings-secondary aw-rename-profile" type="button">${trPick(COPY.rename, lang)}</button><button class="aw-settings-danger aw-delete-profile" type="button" ${profiles.list.length <= 1 ? "disabled" : ""}>${trPick(COPY.delete, lang)}</button></div>
      <p class="aw-settings-note">${esc(active.name)}</p>`, 1, lang),
    section("language", 2, `<p class="aw-settings-note">${trPick(COPY.languageLead, lang)}</p><label><span>${trPick(COPY.sections[2], lang)}</span><select id="sel-lang" name="language" aria-label="${trPick(COPY.sections[2], lang)}">${LANGS.map(({ code, name }) => `<option value="${code}" ${code === selectedLanguage ? "selected" : ""}>${name}</option>`).join("")}</select></label>`, 2, lang),
    section("appearance", 3, `<label class="aw-settings-range"><span>${trPick(COPY.textSize, lang)} <output>${Math.round((studio.text || 1) * 100)}%</output></span><input name="textSize" type="range" min="0.85" max="1.3" step="0.05" value="${Number(studio.text || 1)}"></label>
      <div class="aw-toggle-row"><span>${trPick(COPY.contrast, lang)}</span>${check(studio.contrast, lang, "contrast", COPY.contrast)}</div>
      <div class="aw-toggle-row"><span>${trPick(COPY.lessMotion, lang)}</span>${check(studio.calm, lang, "calm", COPY.lessMotion)}</div>
      <label class="aw-settings-color"><span>${trPick(COPY.accent, lang)}</span><input name="accent" type="color" value="${esc(studio.accent || "#ffd166")}"></label>
      <button class="aw-settings-secondary aw-open-studio" type="button">${trPick(COPY.openStudio, lang)}</button>`, 3, lang),
    section("notifications", 4, `<div class="aw-toggle-row"><span>${trPick(COPY.amawta, lang)}</span>${check(storageGet("awayu.proactive.muted") !== "1", lang, "proactive", COPY.amawta)}</div>
      <div class="aw-toggle-row"><span>${trPick(COPY.sound, lang)}</span>${check(!isMuted(), lang, "sound", COPY.sound)}</div>
      <div class="aw-toggle-row"><span>${trPick(COPY.voice, lang)}</span>${check(storageGet("awayu.voice.auto") === "1", lang, "voice", COPY.voice)}</div>`, 4, lang),
    section("wallet", 5, `<p class="aw-wallet-state"><span class="aw-wallet-dot ${address ? "is-connected" : ""}" aria-hidden="true"></span><strong>${walletLabel()}</strong><span class="aw-wallet-network">${trPick(COPY.network, lang)}: ${COPY.testnet}</span></p>
      ${address ? `<div class="aw-address-row"><code title="${esc(address)}">${esc(address.length > 18 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address)}</code><button class="aw-settings-secondary aw-copy-address" type="button">${trPick(COPY.copy, lang)}</button></div>` : `<p class="aw-settings-note">${trPick(COPY.noAddress, lang)}</p>`}
      <div class="aw-settings-actions">${address ? `<button class="aw-settings-danger aw-disconnect-wallet" type="button">${trPick(COPY.disconnect, lang)}</button>` : `<button class="aw-settings-primary aw-connect-wallet" type="button">${trPick(COPY.connect, lang)}</button>`}</div>`, 5, lang),
    section("privacy", 6, `<p class="aw-settings-note">${trPick(COPY.dataStored, lang)}</p><h4>${trPick(COPY.keys, lang)}</h4><ul class="aw-key-list">${["awayu.profiles", "awayu.lang", "awayu.profile.data", "awayu.studio", "awayu.skin", "awayu.theme", "awayu.proactive.muted", "awayu.voice.auto", "awayu.sound.muted", "awayu.guide.tour.seen.*", "awayu.best.*", "awayu.legal.accepted", "awayu.circles", "awayu.demo"].map((key) => `<li><code>${key}</code></li>`).join("")}</ul>
      <button class="aw-settings-secondary aw-export" type="button">${trPick(COPY.export, lang)}</button><button class="aw-settings-danger aw-erase" type="button">${trPick(COPY.erase, lang)}</button>
      <h4>${trPick(COPY.terms, lang)}</h4><p class="aw-terms-state"></p><div class="aw-settings-actions"><a href="#/legal">${trPick(COPY.legalLink, lang)}</a><button class="aw-settings-secondary aw-revoke-terms" type="button">${trPick(COPY.revoke, lang)}</button></div>`, 6, lang),
    section("help", 7, `<button class="aw-settings-secondary aw-tour" type="button">${trPick(COPY.tour, lang)}</button><button class="aw-settings-secondary aw-tutorials" type="button">${trPick(COPY.tutorials, lang)}</button>
      <h4>${trPick(COPY.about, lang)}</h4><p>${trPick(COPY.version, lang)} ${esc(packageInfo.version || "0.1.0")}</p><h4>${trPick(COPY.contracts, lang)}</h4><ul class="aw-contract-list">${contractRows.map(([name, id]) => `<li><span>${esc(name)}</span><code>${esc(id)}</code><span class="aw-contract-links"><a href="${expertUrl(id)}" target="_blank" rel="noopener noreferrer">${COPY.expert}</a><a href="${labUrl(id)}" target="_blank" rel="noopener noreferrer">${COPY.lab}</a></span></li>`).join("")}</ul>`, 7, lang),
  ];
  panel.innerHTML = `<div class="aw-settings-header"><div><p class="aw-settings-thread" aria-hidden="true"></p><h2 id="aw-settings-title">${trPick(COPY.title, lang)}</h2></div><button type="button" class="aw-settings-close" aria-label="${trPick(COPY.close, lang)}">×</button></div><div class="aw-settings-scroll">${sections.join("")}</div>`;

  const legal = storageGet("awayu.legal.accepted");
  let terms = null;
  try { terms = JSON.parse(legal || "null"); } catch { terms = null; }
  const termsState = $(".aw-terms-state", panel);
  termsState.textContent = terms?.date
    ? `${trPick(terms.version ? COPY.accepted : COPY.notAccepted, lang)} · ${new Date(terms.date).toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-BO")}${terms.version ? ` · ${terms.version}` : ""}`
    : trPick(COPY.noTermsDate, lang);
  $(".aw-revoke-terms", panel).disabled = !terms;
}

function updateGreeting() {
  const home = document.querySelector("#view .hero-in");
  const profile = getProfile();
  const current = $(".aw-profile-greeting", home || document);
  if (document.body.dataset.route !== "inicio" || !home || !profile.displayName) {
    current?.remove();
    return;
  }
  const text = `${trPick(tr("Hola", "Hello", "Olá", "Rimaykullayki", "Kamisaraki", "Mba'éichapa"))}, ${profile.displayName}`;
  // Solo se toca el DOM si algo cambió: este código corre desde un MutationObserver
  // sobre #view y reescribir el texto siempre lo volvía a disparar sin fin.
  if (current?.textContent === text) return;
  const greeting = current || document.createElement("p");
  greeting.className = "aw-profile-greeting";
  greeting.textContent = text;
  if (!current) home.insertBefore(greeting, home.querySelector("h1"));
}

function notify(type, detail = {}) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

function downloadProfile() {
  const data = exportActiveProfile();
  const json = JSON.stringify(data, null, 2);
  notify("awayu:profile-export", { json, data });
  const link = document.createElement("a");
  if (typeof URL.createObjectURL === "function") {
    const blob = new Blob([json], { type: "application/json" });
    link.href = URL.createObjectURL(blob);
  } else link.href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  link.download = "awayu-perfil.json";
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  if (link.href.startsWith("blob:") && typeof URL.revokeObjectURL === "function") setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return data;
}

function focusables(panel) {
  return [...panel.querySelectorAll(SELECTABLE.join(","))].filter((element) => !element.hidden && !element.closest("details:not([open])") && element.getAttribute("aria-hidden") !== "true");
}

export function mountSettings({ root = document.querySelector(".wallet") } = {}) {
  if (!root) return null;
  let trigger = root.querySelector("#btn-settings");
  if (!trigger) {
    trigger = document.createElement("button");
    trigger.id = "btn-settings";
    trigger.className = "lang settings-trigger";
    trigger.type = "button";
    trigger.textContent = "⚙";
    root.insertBefore(trigger, root.querySelector("#btn-wallet") || root.firstChild);
  }
  trigger.type = "button";
  trigger.setAttribute("aria-label", trPick(COPY.title));
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");

  let panel = root.querySelector("#settings-panel");
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "settings-panel";
    root.append(panel);
  }
  panel.className = "aw-settings-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "aw-settings-title");
  panel.tabIndex = -1;
  panel.hidden = true;
  trigger.setAttribute("aria-controls", panel.id);
  renderContent(panel);

  const isOpen = () => !panel.hidden;
  const open = () => {
    renderContent(panel);
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    (focusables(panel)[0] || panel).focus({ preventScroll: true });
  };
  const close = (restoreFocus = false) => {
    if (panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
  };
  const refresh = () => {
    const wasOpen = isOpen();
    trigger.setAttribute("aria-label", trPick(COPY.title));
    renderContent(panel);
    if (!wasOpen) panel.hidden = true;
    updateGreeting();
  };

  trigger.onclick = () => isOpen() ? close(true) : open();
  panel.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.matches(".aw-settings-close")) { close(true); return; }
    if (button.matches(".aw-save-profile")) {
      const form = $("[data-section='profile']", panel);
      updateProfile({
        displayName: $("[name='displayName']", form).value,
        alias: $("[name='alias']", form).value,
        department: $("[name='department']", form).value,
        figure: $("[name='figure']", form).value,
        currency: $("[name='currency']", form).value,
      });
      refresh();
      return;
    }
    if (button.matches(".aw-figure")) { close(false); notify("awayu:pick-figure"); return; }
    if (button.matches(".aw-create-profile")) {
      const name = window.prompt(trPick(COPY.profilePrompt));
      if (name?.trim()) createProfile(name);
      return;
    }
    if (button.matches(".aw-rename-profile")) {
      const profile = getActiveProfile();
      const name = window.prompt(trPick(COPY.renamePrompt), profile.name);
      if (name?.trim()) { renameProfile(profile.id, name); refresh(); }
      return;
    }
    if (button.matches(".aw-delete-profile")) {
      const profile = getActiveProfile();
      if (getProfiles().list.length <= 1) { button.disabled = true; return; }
      if (window.confirm(trPick(COPY.deleteProfileConfirm))) deleteProfile(profile.id);
      return;
    }
    if (button.matches(".aw-open-studio")) { close(false); notify("awayu:open-studio"); return; }
    if (button.matches(".aw-connect-wallet")) { close(false); notify("awayu:connect-wallet"); return; }
    if (button.matches(".aw-disconnect-wallet")) { close(false); notify("awayu:disconnect-wallet"); return; }
    if (button.matches(".aw-copy-address")) {
      try { await navigator.clipboard.writeText(state.address); button.textContent = trPick(COPY.copied); } catch { button.textContent = state.address; }
      return;
    }
    if (button.matches(".aw-export")) { downloadProfile(); return; }
    if (button.matches(".aw-erase")) {
      if (window.confirm(trPick(COPY.eraseConfirm))) {
        clearActiveProfileData();
        refresh();
        window.alert(trPick(COPY.erased));
      }
      return;
    }
    if (button.matches(".aw-revoke-terms")) {
      try { localStorage.removeItem("awayu.legal.accepted"); } catch { /* Puede estar bloqueado. */ }
      refresh();
      return;
    }
    if (button.matches(".aw-tour")) {
      try { localStorage.removeItem("awayu.guide.tour.seen.firstVisit"); } catch { /* Puede estar bloqueado. */ }
      close(false);
      notify("awayu:start-tour", { id: "firstVisit" });
      return;
    }
    if (button.matches(".aw-tutorials")) { close(false); document.querySelector("#help-fab")?.click(); }
  });

  panel.addEventListener("change", async (event) => {
    const field = event.target;
    if (field.matches("#sel-lang")) {
      setLang(field.value);
      state.lang = field.value;
      trigger.setAttribute("aria-label", trPick(COPY.title));
      renderContent(panel);
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      $("#sel-lang", panel)?.focus({ preventScroll: true });
    } else if (field.matches("[name='activeProfile']")) {
      switchProfile(field.value);
    } else if (field.matches("[name='textSize'],[name='accent'],[type='checkbox']")) {
      const prefs = readStudioPrefs();
      if (field.name === "textSize") prefs.text = Number(field.value);
      else if (field.name === "accent") prefs.accent = field.value;
      else if (field.type === "checkbox") {
        if (field.dataset.setting === "contrast") prefs.contrast = field.checked;
        else if (field.dataset.setting === "calm") prefs.calm = field.checked;
        else {
        const row = field.closest(".aw-toggle-row");
        if (row) {
          const setting = field.dataset.setting;
          if (setting === "proactive") {
            const muted = !field.checked;
            storageSet("awayu.proactive.muted", muted ? "1" : "0");
            notify("awayu:proactive-muted", { muted, source: "settings" });
          }
          else if (setting === "sound") {
            setMuted(!field.checked);
            const soundButton = document.querySelector("#btn-sound");
            if (soundButton) {
              soundButton.textContent = field.checked ? "🔊" : "🔇";
              soundButton.setAttribute("aria-label", field.checked ? "Silenciar" : "Activar sonido");
            }
          } else if (setting === "voice") storageSet("awayu.voice.auto", field.checked ? "1" : "0");
        } else {
          if (field.dataset.setting === "contrast") prefs.contrast = field.checked;
          if (field.dataset.setting === "calm") prefs.calm = field.checked;
        }
        }
      }
      if (field.name === "textSize" || field.name === "accent" || field.dataset.setting === "contrast" || field.dataset.setting === "calm") {
        storageSet("awayu.studio", JSON.stringify(prefs));
        const studioApi = await import("../custom/studio.js");
        studioApi.applyUiPrefs(studioApi.loadStudio());
        const output = $(".aw-settings-range output", panel);
        if (output) output.value = `${Math.round(prefs.text * 100)}%`;
      }
      const toggleState = field.closest(".aw-setting-check")?.querySelector(".aw-toggle-state");
      if (toggleState) toggleState.textContent = trPick(field.checked ? COPY.on : COPY.off);
    }
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); close(true); return; }
    if (event.key !== "Tab") return;
    const items = focusables(panel);
    if (!items.length) { event.preventDefault(); panel.focus(); return; }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  const outsideClick = (event) => {
    if (!isOpen() || panel.contains(event.target) || trigger.contains(event.target)) return;
    close(false);
  };
  const outsideKeydown = (event) => {
    if (isOpen() && event.key === "Escape") { event.preventDefault(); close(true); }
  };
  document.addEventListener("click", outsideClick);
  document.addEventListener("keydown", outsideKeydown);
  const unsubscribeState = subscribe(() => { if (isOpen()) refresh(); });
  const unsubscribeProfile = onProfileChange(() => { updateGreeting(); if (isOpen()) refresh(); });
  const soundButton = document.querySelector("#btn-sound");
  const soundClick = () => setTimeout(() => { if (isOpen()) refresh(); }, 0);
  soundButton?.addEventListener("click", soundClick);
  const figureSelected = (event) => {
    const id = event.detail?.id ?? event.detail?.figure;
    if (id != null) { updateProfile({ figure: id }); if (isOpen()) refresh(); }
  };
  const proactiveMuted = (event) => {
    if (event.detail?.source === "settings") return;
    storageSet("awayu.proactive.muted", event.detail?.muted ? "1" : "0");
    if (isOpen()) refresh();
  };
  window.addEventListener("awayu:figure-selected", figureSelected);
  window.addEventListener("awayu:proactive-muted", proactiveMuted);
  const view = document.querySelector("#view");
  const observer = view && typeof MutationObserver !== "undefined" ? new MutationObserver(updateGreeting) : null;
  observer?.observe(view, { childList: true, subtree: true });
  window.addEventListener("hashchange", updateGreeting);
  updateGreeting();
  return {
    trigger, panel, open, close, refresh,
    destroy() {
      close(false);
      document.removeEventListener("click", outsideClick);
      document.removeEventListener("keydown", outsideKeydown);
      window.removeEventListener("awayu:figure-selected", figureSelected);
      window.removeEventListener("awayu:proactive-muted", proactiveMuted);
      window.removeEventListener("hashchange", updateGreeting);
      soundButton?.removeEventListener("click", soundClick);
      unsubscribeState();
      unsubscribeProfile();
      observer?.disconnect();
      trigger.onclick = null;
      panel.remove();
    },
  };
}

export { COPY as SETTINGS_COPY, downloadProfile };

