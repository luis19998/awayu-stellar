const INDEX_KEY = "awayu.profiles";
const PROFILE_DATA_KEY = "awayu.profile.data";
const PROFILE_PREFIX = "awayu.profile.";
const PROFILE_PREFS = new Set([
  "awayu.lang",
  "awayu.studio",
  "awayu.skin",
  "awayu.theme",
  "awayu.proactive.muted",
  "awayu.voice.auto",
  "awayu.sound.muted",
  "awayu.legal.accepted",
  PROFILE_DATA_KEY,
]);
const DEFAULT_DATA = Object.freeze({ displayName: "", alias: "", department: "", figure: "", currency: "USD" });
const listeners = new Set();

function storageOrNull(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function entries(storage) {
  if (!storage) return [];
  const result = [];
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key != null) result.push([key, storage.getItem(key)]);
    }
  } catch { /* Storage puede estar deshabilitado. */ }
  return result;
}

function profilePreference(key) {
  return PROFILE_PREFS.has(key) || key.startsWith("awayu.guide.tour.seen.") || key.startsWith("awayu.best.");
}

function profileKey(id, key) {
  return `${PROFILE_PREFIX}${id}.${key.slice("awayu.".length)}`;
}

function profileKeyPrefix(id) {
  return `${PROFILE_PREFIX}${id}.`;
}

function readIndex(storage) {
  let value;
  try { value = JSON.parse(storage?.getItem(INDEX_KEY) || "null"); } catch { value = null; }
  const list = Array.isArray(value?.list)
    ? value.list.filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
    : [];
  if (!list.some((item) => item.id === "principal")) {
    list.unshift({ id: "principal", name: "Principal", createdAt: new Date().toISOString() });
  }
  const active = list.some((item) => item.id === value?.active) ? value.active : "principal";
  const normalized = { active, list };
  try { storage?.setItem(INDEX_KEY, JSON.stringify(normalized)); } catch { /* Sin almacenamiento, el perfil existe en memoria. */ }
  return normalized;
}

function currentIndex(storage) {
  return readIndex(storageOrNull(storage));
}

function emitProfileChange(storage) {
  const profile = getProfile(storage);
  for (const listener of listeners) listener(profile);
}

function saveCurrentPreferences(id, storage) {
  if (!storage) return;
  const prefix = profileKeyPrefix(id);
  for (const [key] of entries(storage)) {
    if (key.startsWith(prefix)) {
      try { storage.removeItem(key); } catch { /* Ignora errores de almacenamiento. */ }
    }
  }
  for (const [key, value] of entries(storage)) {
    if (profilePreference(key)) {
      try { storage.setItem(profileKey(id, key), value); } catch { /* Ignora errores de almacenamiento. */ }
    }
  }
}

function clearCurrentPreferences(storage) {
  if (!storage) return;
  for (const [key] of entries(storage)) {
    if (profilePreference(key)) {
      try { storage.removeItem(key); } catch { /* Ignora errores de almacenamiento. */ }
    }
  }
}

function restorePreferences(id, storage) {
  if (!storage) return;
  clearCurrentPreferences(storage);
  const prefix = profileKeyPrefix(id);
  for (const [key, value] of entries(storage)) {
    if (!key.startsWith(prefix)) continue;
    const suffix = key.slice(prefix.length);
    if (!suffix) continue;
    const logicalKey = `awayu.${suffix}`;
    if (!profilePreference(logicalKey)) continue;
    try { storage.setItem(logicalKey, value); } catch { /* Ignora errores de almacenamiento. */ }
  }
}

function reloadPage(reload, locationRef = globalThis.location) {
  if (!reload) return;
  try { locationRef?.reload?.(); } catch { /* La recarga puede estar bloqueada en pruebas. */ }
}

function makeId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  } catch { /* Usa el generador sencillo como respaldo. */ }
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureProfiles(storage) {
  return currentIndex(storage);
}

export function getProfiles(storage) {
  const index = currentIndex(storage);
  return { active: index.active, list: index.list.map((item) => ({ ...item })) };
}

export function getActiveProfile(storage) {
  const index = currentIndex(storage);
  return { ...index.list.find((item) => item.id === index.active) };
}

export function getProfile(storage) {
  const target = storageOrNull(storage);
  let data = {};
  try { data = JSON.parse(target?.getItem(PROFILE_DATA_KEY) || "{}"); } catch { data = {}; }
  return { ...DEFAULT_DATA, ...(data && typeof data === "object" && !Array.isArray(data) ? data : {}) };
}

export function onProfileChange(callback) {
  if (typeof callback !== "function") return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function updateProfile(patch, storage) {
  const target = storageOrNull(storage);
  const current = getProfile(target);
  const next = { ...current };
  for (const key of Object.keys(DEFAULT_DATA)) {
    if (Object.hasOwn(patch || {}, key)) next[key] = String(patch[key] ?? "").trim();
  }
  next.displayName = next.displayName.slice(0, 32);
  next.alias = next.alias.slice(0, 20);
  next.currency = next.currency === "BOB" ? "BOB" : "USD";
  try { target?.setItem(PROFILE_DATA_KEY, JSON.stringify(next)); } catch { /* El formulario sigue funcionando en memoria. */ }
  emitProfileChange(target);
  return next;
}

export function createProfile(name = "", options = {}) {
  const storage = storageOrNull(options.storage);
  const index = currentIndex(storage);
  saveCurrentPreferences(index.active, storage);
  const cleanName = String(name || "Perfil nuevo").trim().slice(0, 32) || "Perfil nuevo";
  let id = makeId();
  while (index.list.some((item) => item.id === id)) id = makeId();
  index.list.push({ id, name: cleanName, createdAt: new Date().toISOString() });
  index.active = id;
  try { storage?.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* Sin almacenamiento, el perfil queda en memoria hasta recargar. */ }
  restorePreferences(id, storage);
  emitProfileChange(storage);
  reloadPage(options.reload !== false, options.locationRef);
  return { ...index.list.at(-1) };
}

export function switchProfile(id, options = {}) {
  const storage = storageOrNull(options.storage);
  const index = currentIndex(storage);
  if (!index.list.some((item) => item.id === id) || id === index.active) return false;
  saveCurrentPreferences(index.active, storage);
  index.active = id;
  try { storage?.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* Sin almacenamiento, no persiste al recargar. */ }
  restorePreferences(id, storage);
  emitProfileChange(storage);
  reloadPage(options.reload !== false, options.locationRef);
  return true;
}

export function renameProfile(id, name, storage) {
  const target = storageOrNull(storage);
  const index = currentIndex(target);
  const item = index.list.find((profile) => profile.id === id);
  if (!item) return false;
  const cleanName = String(name ?? "").trim().slice(0, 32);
  if (!cleanName) return false;
  item.name = cleanName;
  try { target?.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* Sin almacenamiento, el cambio queda en memoria. */ }
  emitProfileChange(target);
  return { ...item };
}

export function deleteProfile(id, options = {}) {
  const storage = storageOrNull(options.storage);
  const index = currentIndex(storage);
  if (index.list.length <= 1) return false;
  const position = index.list.findIndex((item) => item.id === id);
  if (position < 0) return false;
  const wasActive = index.active === id;
  if (wasActive) saveCurrentPreferences(id, storage);
  const [removed] = index.list.splice(position, 1);
  if (wasActive) index.active = index.list[Math.min(position, index.list.length - 1)].id;
  try {
    for (const [key] of entries(storage)) if (key.startsWith(profileKeyPrefix(id))) storage.removeItem(key);
    storage?.setItem(INDEX_KEY, JSON.stringify(index));
  } catch { /* Ignora errores de almacenamiento. */ }
  if (wasActive) restorePreferences(index.active, storage);
  emitProfileChange(storage);
  if (wasActive) reloadPage(options.reload !== false, options.locationRef);
  return { ...removed };
}

export function clearActiveProfileData(storage) {
  const target = storageOrNull(storage);
  const index = currentIndex(target);
  saveCurrentPreferences(index.active, target);
  for (const [key] of entries(target)) if (key.startsWith(profileKeyPrefix(index.active))) {
    try { target.removeItem(key); } catch { /* Ignora errores de almacenamiento. */ }
  }
  clearCurrentPreferences(target);
  emitProfileChange(target);
  return true;
}

export function exportActiveProfile(storage) {
  const target = storageOrNull(storage);
  const index = currentIndex(target);
  const profile = index.list.find((item) => item.id === index.active);
  const scopedPrefix = profileKeyPrefix(index.active);
  const data = {};
  const scoped = new Map(entries(target).filter(([key]) => key.startsWith(scopedPrefix)));
  const keys = new Set([...PROFILE_PREFS]);
  for (const [key] of entries(target)) {
    if (key.startsWith("awayu.guide.tour.seen.") || key.startsWith("awayu.best.")) keys.add(key);
    if (key.startsWith(scopedPrefix)) {
      const suffix = key.slice(scopedPrefix.length);
      const logicalKey = `awayu.${suffix}`;
      if (profilePreference(logicalKey)) keys.add(logicalKey);
    }
  }
  for (const key of keys) {
    let value = null;
    try { value = target?.getItem(key); } catch { /* Ignora errores de almacenamiento. */ }
    if (value == null) value = scoped.get(profileKey(index.active, key)) ?? null;
    if (value != null) data[key] = value;
  }
  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: profile ? { id: profile.id, name: profile.name } : null,
    data,
  };
}

