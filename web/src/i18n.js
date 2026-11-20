// Traducción mínima: el texto en castellano es la clave; si no hay traducción,
// se muestra el castellano. Variables con {nombre}.
import en from "./i18n/en.js";
import pt from "./i18n/pt.js";
import qu from "./i18n/qu.js";
import ay from "./i18n/ay.js";
import gn from "./i18n/gn.js";

export const DICTS = { en, pt, qu, ay, gn };
let lang = "es";

export const LANGS = [
  { code: "es", name: "Español" }, { code: "en", name: "English" },
  { code: "pt", name: "Português" }, { code: "qu", name: "Runa Simi (quechua)" },
  { code: "ay", name: "Aymar aru (aymara)" }, { code: "gn", name: "Avañe'ẽ (guaraní)" },
];

export function pickLang(obj, selected = lang) {
  return obj?.[selected] ?? obj?.es;
}

export function getLang() {
  return lang;
}

export function t(key, vars) {
  let s = lang === "es" ? key : (DICTS[lang]?.[key] ?? key);
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Traduce los elementos con data-i18n (su texto original es la clave). */
export function applyStatic(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    if (!el.dataset.i18nKey) el.dataset.i18nKey = el.textContent.trim();
    el.textContent = t(el.dataset.i18nKey);
  });
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function setLang(next) {
  lang = LANGS.some(({ code }) => code === next) ? next : "es";
  try {
    localStorage.setItem("awayu.lang", lang);
  } catch {}
  if (typeof document !== "undefined") applyStatic();
}

export function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem("awayu.lang");
  } catch {}
  lang = LANGS.some(({ code }) => code === saved) ? saved : "es";
  if (typeof document !== "undefined") applyStatic();
  return lang;
}
