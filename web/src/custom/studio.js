// Estudio de personalización: escena (hora y clima), aguayo propio (paleta),
// interfaz (acento, tamaño de letra, alto contraste, menos movimiento) y sonido.
// Todo se guarda en el navegador y se aplica al cargar.
import "./studio.css";

const KEY = "awayu.studio";
const pick = (o, l) => o[l] ?? o.es;
const DEFAULTS = { time: "auto", weather: "despejado", accent: "#ffd166", text: 1, contrast: false, calm: false, palette: null, sound: true };
const ACCENTS = ["#ffd166", "#f57c1f", "#d81b60", "#13a3b0", "#1f9d55", "#a78bfa"];
const PALETTE_KEYS = ["magenta", "rojo", "naranja", "amarillo", "verde", "turquesa", "azul", "morado"];

const L = {
  title: { es: "Estudio de personalización", en: "Customization studio", pt: "Estúdio de personalização", qu: "Sumaqchana wasi", ay: "Suma lurañ uta", gn: "Mbojeguaha róga" },
  scene: { es: "Escena", en: "Scene", pt: "Cena", qu: "Pacha", ay: "Pacha", gn: "Ta'anga" },
  aguayo: { es: "Tu aguayo", en: "Your aguayo", pt: "Seu aguayo", qu: "Awayuyki", ay: "Awayuma", gn: "Nde aguayo" },
  ui: { es: "Interfaz", en: "Interface", pt: "Interface", qu: "Rikuchiy", ay: "Uñacht'äwi", gn: "Ojehechaukáva" },
  sound: { es: "Sonido", en: "Sound", pt: "Som", qu: "Uyariy", ay: "Ist'aña", gn: "Ñe'ẽ" },
  time: { es: "Hora del día", en: "Time of day", pt: "Hora do dia", qu: "P'unchaw pacha", ay: "Uru pacha", gn: "Ára aravo" },
  times: {
    es: { auto: "La del escenario", dia: "Día", atardecer: "Atardecer", noche: "Noche" },
    en: { auto: "Scene default", dia: "Day", atardecer: "Sunset", noche: "Night" },
    pt: { auto: "A do cenário", dia: "Dia", atardecer: "Entardecer", noche: "Noite" },
    qu: { auto: "Pachaq kaqnin", dia: "P'unchaw", atardecer: "Ch'isiyay", noche: "Tuta" },
    ay: { auto: "Pachan utjiri", dia: "Uru", atardecer: "Jayp'u", noche: "Aruma" },
    gn: { auto: "Ta'anga mba'e", dia: "Ára", atardecer: "Ka'aru", noche: "Pyhare" },
  },
  weather: { es: "Clima", en: "Weather", pt: "Clima", qu: "Pacha kay", ay: "Pacha", gn: "Arapytu" },
  weathers: {
    es: { despejado: "Despejado", lluvia: "Lluvia", nieve: "Nieve", petalos: "Pétalos de fiesta", luciernagas: "Luciérnagas" },
    en: { despejado: "Clear", lluvia: "Rain", nieve: "Snow", petalos: "Festival petals", luciernagas: "Fireflies" },
    pt: { despejado: "Limpo", lluvia: "Chuva", nieve: "Neve", petalos: "Pétalas de festa", luciernagas: "Vaga-lumes" },
    qu: { despejado: "Ch'aki", lluvia: "Para", nieve: "Rit'i", petalos: "T'ikakuna", luciernagas: "Ninakuru" },
    ay: { despejado: "Qhana", lluvia: "Jallu", nieve: "Khunu", petalos: "Panqaranaka", luciernagas: "Nina laq'u" },
    gn: { despejado: "Ára porã", lluvia: "Ama", nieve: "Ro'y", petalos: "Yvoty", luciernagas: "Ysoindy" },
  },
  aguayoLead: { es: "Elige tus colores: el piso, la vasija y las marcas de cada pago se tejen con ellos.", en: "Pick your colors: the floor, the vessel and every payment mark are woven with them.", pt: "Escolha suas cores: o chão, o pote e cada marca de pagamento são tecidos com elas.", qu: "Llimp'iykikunata akllay: pampa, manka, sapa qullqichaypas paykunawanmi awakun.", ay: "Saminakam ajllim: pampa, phuku, sapa payllawi chimpunakas ukanakampiw sawuqasi.", gn: "Eiporavo nde sa'ykuéra: yvy, ñai'ũ ha opa pago rechaukaha ojejapo hendive." },
  reset: { es: "Volver a los colores del estilo", en: "Back to the style colors", pt: "Voltar às cores do estilo", qu: "Ñawpaq llimp'ikunaman kutiy", ay: "Nayra saminakar kutt'aña", gn: "Ejevy umi sa'y ypyrãme" },
  accent: { es: "Color de acento", en: "Accent color", pt: "Cor de destaque", qu: "Rikch'aq llimp'i", ay: "Uñacht'ir sami", gn: "Sa'y ojehechaukáva" },
  text: { es: "Tamaño de letra", en: "Text size", pt: "Tamanho do texto", qu: "Qillqa sayay", ay: "Qillqa jach'a", gn: "Haipyre tuichakue" },
  contrast: { es: "Alto contraste", en: "High contrast", pt: "Alto contraste", qu: "Sinchi rikch'ay", ay: "Ch'aman uñacht'ayaña", gn: "Ojehechaukave" },
  calm: { es: "Menos movimiento", en: "Reduce motion", pt: "Menos movimento", qu: "Pisi kuyuy", ay: "Juk'a unxtaña", gn: "Michĩve ñemomýi" },
  soundOn: { es: "Efectos de sonido", en: "Sound effects", pt: "Efeitos sonoros", qu: "Uyariykuna", ay: "Ist'añanaka", gn: "Ñe'ẽ mba'e" },
  done: { es: "Listo", en: "Done", pt: "Pronto", qu: "Tukusqa", ay: "Tukuyata", gn: "Oĩma" },
  restore: { es: "Restablecer todo", en: "Reset all", pt: "Restaurar tudo", qu: "Llapanta kutichiy", ay: "Taqi kutt'ayaña", gn: "Emoĩjey opa mba'e" },
};

export function loadStudio() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...DEFAULTS }; }
}
function save(prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* sin almacenamiento */ }
}

/** Aplica las preferencias de interfaz (se puede llamar al inicio, sin escena). */
export function applyUiPrefs(prefs = loadStudio(), root = document.documentElement) {
  root.style.setProperty("--gold", prefs.accent || DEFAULTS.accent);
  root.style.fontSize = `${Math.round(100 * (prefs.text || 1))}%`;
  root.classList.toggle("aw-contrast", !!prefs.contrast);
  root.classList.toggle("aw-calm", !!prefs.calm);
}

/** Aplica escena y paleta propias. ctx: { scene, applyPalette, basePalette, rebuild, setMuted } */
export function applyScenePrefs(prefs, ctx = {}) {
  ctx.scene?.setAmbience?.({ time: prefs.time, weather: prefs.weather });
  if (prefs.palette && ctx.applyPalette) {
    ctx.applyPalette({ ...(ctx.basePalette || {}), ...prefs.palette });
    ctx.scene?.retheme?.();
    ctx.rebuild?.();
  }
  ctx.setMuted?.(!prefs.sound);
}

export function openStudio(lang = "es", ctx = {}) {
  const prefs = loadStudio();
  const d = document.createElement("dialog");
  d.className = "aw-studio";
  const tabs = [["scene", L.scene], ["aguayo", L.aguayo], ["ui", L.ui], ["sound", L.sound]];
  d.innerHTML = `<form method="dialog"><h2></h2><div class="aw-tabs" role="tablist"></div><div class="aw-panes"></div>
    <menu><button type="button" class="ghost aw-restore"></button><button value="ok" class="primary aw-done"></button></menu></form>`;
  d.querySelector("h2").textContent = pick(L.title, lang);
  d.querySelector(".aw-restore").textContent = pick(L.restore, lang);
  d.querySelector(".aw-done").textContent = pick(L.done, lang);
  const tabBox = d.querySelector(".aw-tabs");
  const panes = d.querySelector(".aw-panes");
  const commit = () => { save(prefs); applyUiPrefs(prefs); applyScenePrefs(prefs, ctx); };

  const pane = {};
  for (const [id, label] of tabs) {
    const b = document.createElement("button");
    b.type = "button"; b.role = "tab"; b.dataset.tab = id; b.textContent = pick(label, lang);
    b.onclick = () => show(id);
    tabBox.append(b);
    const p = document.createElement("div");
    p.className = "aw-pane"; p.role = "tabpanel"; p.dataset.pane = id;
    panes.append(p);
    pane[id] = p;
  }
  function show(id) {
    tabBox.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    panes.querySelectorAll(".aw-pane").forEach((p) => { p.hidden = p.dataset.pane !== id; });
  }

  // Escena: hora y clima como fichas
  const chips = (title, opts, key) => {
    const box = document.createElement("fieldset");
    box.innerHTML = `<legend></legend><div class="aw-chips"></div>`;
    box.querySelector("legend").textContent = title;
    for (const [val, text] of Object.entries(opts)) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "aw-chip"; b.textContent = text; b.dataset.v = val;
      b.setAttribute("aria-pressed", String(prefs[key] === val));
      b.onclick = () => {
        prefs[key] = val;
        box.querySelectorAll(".aw-chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === val)));
        commit();
      };
      box.querySelector(".aw-chips").append(b);
    }
    return box;
  };
  pane.scene.append(chips(pick(L.time, lang), pick(L.times, lang), "time"), chips(pick(L.weather, lang), pick(L.weathers, lang), "weather"));

  // Aguayo propio: ocho colores de la paleta
  const lead = document.createElement("p");
  lead.className = "aw-lead"; lead.textContent = pick(L.aguayoLead, lang);
  const grid = document.createElement("div");
  grid.className = "aw-swatches";
  const base = ctx.basePalette || {};
  for (const k of PALETTE_KEYS) {
    const lab = document.createElement("label");
    const input = document.createElement("input");
    input.type = "color";
    input.value = prefs.palette?.[k] || base[k] || "#888888";
    input.setAttribute("aria-label", k);
    input.oninput = () => { prefs.palette = { ...(prefs.palette || {}), [k]: input.value }; commit(); };
    lab.append(input);
    grid.append(lab);
  }
  const resetPal = document.createElement("button");
  resetPal.type = "button"; resetPal.className = "ghost"; resetPal.textContent = pick(L.reset, lang);
  resetPal.onclick = () => {
    prefs.palette = null; save(prefs);
    ctx.applyPalette?.(base); ctx.scene?.retheme?.(); ctx.rebuild?.();
    grid.querySelectorAll("input").forEach((inp, i) => { inp.value = base[PALETTE_KEYS[i]] || "#888888"; });
  };
  pane.aguayo.append(lead, grid, resetPal);

  // Interfaz
  const accents = document.createElement("fieldset");
  accents.innerHTML = `<legend></legend><div class="aw-chips"></div>`;
  accents.querySelector("legend").textContent = pick(L.accent, lang);
  for (const c of ACCENTS) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "aw-dot"; b.style.background = c; b.setAttribute("aria-label", c);
    b.setAttribute("aria-pressed", String(prefs.accent === c));
    b.onclick = () => { prefs.accent = c; accents.querySelectorAll(".aw-dot").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); commit(); };
    accents.querySelector(".aw-chips").append(b);
  }
  const size = document.createElement("label");
  size.className = "aw-range";
  size.innerHTML = `<span></span><input type="range" min="0.9" max="1.3" step="0.05">`;
  size.querySelector("span").textContent = pick(L.text, lang);
  size.querySelector("input").value = prefs.text;
  size.querySelector("input").oninput = (e) => { prefs.text = Number(e.target.value); commit(); };
  const toggle = (label, key) => {
    const l = document.createElement("label");
    l.className = "check";
    l.innerHTML = `<input type="checkbox"> <span></span>`;
    l.querySelector("span").textContent = label;
    l.querySelector("input").checked = !!prefs[key];
    l.querySelector("input").onchange = (e) => { prefs[key] = e.target.checked; commit(); };
    return l;
  };
  pane.ui.append(accents, size, toggle(pick(L.contrast, lang), "contrast"), toggle(pick(L.calm, lang), "calm"));
  pane.sound.append(toggle(pick(L.soundOn, lang), "sound"));

  d.querySelector(".aw-restore").onclick = () => {
    Object.assign(prefs, DEFAULTS, { palette: null });
    save(prefs);
    applyUiPrefs(prefs);
    ctx.scene?.setAmbience?.({ time: "auto", weather: "despejado" });
    ctx.applyPalette?.(base); ctx.scene?.retheme?.(); ctx.rebuild?.();
    d.close();
  };
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  show("scene");
  d.showModal();
  return d;
}
