const LANGS = { es: "es", en: "en", pt: "pt-BR", qu: "es", ay: "es", gn: "es" };
const locale = (lang) => LANGS[lang] || "es";
const pick = (o, l) => o[l] ?? o.es;
const LABELS = {
  listen: { es: "Preguntar hablando", en: "Ask by voice", pt: "Perguntar por voz", qu: "Preguntar hablando", ay: "Preguntar hablando", gn: "Preguntar hablando" },
  speak: { es: "Escuchar", en: "Listen", pt: "Ouvir", qu: "Escuchar", ay: "Escuchar", gn: "Escuchar" },
  auto: { es: "Leer respuestas en voz alta", en: "Read answers aloud", pt: "Ler respostas em voz alta", qu: "Leer respuestas en voz alta", ay: "Leer respuestas en voz alta", gn: "Leer respuestas en voz alta" },
};
const ERRORS = {
  es: { unavailable: "El reconocimiento de voz no está disponible en este navegador.", timeout: "Se agotó el tiempo para escuchar. Inténtalo de nuevo.", denied: "No se autorizó el micrófono.", failed: "No se pudo reconocer la voz. Inténtalo de nuevo.", silent: "No se detectó voz. Inténtalo de nuevo.", start: "No se pudo iniciar el micrófono." },
  en: { unavailable: "Voice recognition is not available in this browser.", timeout: "Listening timed out. Please try again.", denied: "Microphone access was not allowed.", failed: "Voice recognition failed. Please try again.", silent: "No speech was detected. Please try again.", start: "The microphone could not be started." },
  pt: { unavailable: "O reconhecimento de voz não está disponível neste navegador.", timeout: "O tempo de escuta terminou. Tente novamente.", denied: "O acesso ao microfone não foi autorizado.", failed: "Não foi possível reconhecer a voz. Tente novamente.", silent: "Nenhuma fala foi detectada. Tente novamente.", start: "Não foi possível iniciar o microfone." },
};
const voiceError = (lang, key) => (ERRORS[lang] || ERRORS.es)[key];
export const voiceText = (key, lang = "es") => pick(LABELS[key] || {}, lang);
export function canSpeak() { return typeof window !== "undefined" && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function"; }
export function isSpeaking() { return canSpeak() && (speechSynthesis.speaking || speechSynthesis.pending); }
export function stopSpeaking() { if (canSpeak()) speechSynthesis.cancel(); }
export function speak(text, lang = "es") {
  if (!canSpeak()) return false;
  stopSpeaking();
  const base = locale(lang).toLowerCase();
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase() === base) || voices.find((v) => v.lang.toLowerCase().startsWith(base.split("-")[0])) || null;
  const parts = String(text || "").match(/[^.!?\n]+[.!?]?/g) || [String(text || "")];
  parts.filter((s) => s.trim()).forEach((part) => { const u = new SpeechSynthesisUtterance(part.trim()); u.lang = base; if (voice) u.voice = voice; speechSynthesis.speak(u); });
  return true;
}
export function canListen() { return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
export function listen(lang = "es", timeout = 12000) {
  if (!canListen()) return Promise.reject(new Error(voiceError(lang, "unavailable")));
  return new Promise((resolve, reject) => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Ctor(); let settled = false; let currentLang = lang;
    const onLanguage = (event) => { currentLang = event.detail?.lang || currentLang; recognition.lang = locale(currentLang); };
    window.addEventListener("awayu:lang", onLanguage);
    const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); window.removeEventListener("awayu:lang", onLanguage); fn(value); };
    const timer = setTimeout(() => { recognition.abort(); finish(reject, new Error(voiceError(currentLang, "timeout"))); }, timeout);
    recognition.lang = locale(lang); recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = (e) => finish(resolve, e.results?.[0]?.[0]?.transcript || "");
    recognition.onerror = (e) => finish(reject, new Error(e.error === "not-allowed" || e.error === "service-not-allowed" ? voiceError(currentLang, "denied") : voiceError(currentLang, "failed")));
    recognition.onend = () => { if (!settled) finish(reject, new Error(voiceError(currentLang, "silent"))); };
    try { recognition.start(); } catch { finish(reject, new Error(voiceError(currentLang, "start"))); }
  });
}
