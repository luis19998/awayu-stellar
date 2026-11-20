const LANGS = { es: "es", en: "en", pt: "pt-BR", qu: "es", ay: "es", gn: "es" };
const locale = (lang) => LANGS[lang] || "es";
const pick = (o, l) => o[l] ?? o.es;
const LABELS = {
  listen: { es: "Preguntar hablando", en: "Ask by voice", pt: "Perguntar por voz", qu: "Preguntar hablando", ay: "Preguntar hablando", gn: "Preguntar hablando" },
  speak: { es: "Escuchar", en: "Listen", pt: "Ouvir", qu: "Escuchar", ay: "Escuchar", gn: "Escuchar" },
  auto: { es: "Leer respuestas en voz alta", en: "Read answers aloud", pt: "Ler respostas em voz alta", qu: "Leer respuestas en voz alta", ay: "Leer respuestas en voz alta", gn: "Leer respuestas en voz alta" },
};
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
  if (!canListen()) return Promise.reject(new Error("El reconocimiento de voz no está disponible en este navegador."));
  return new Promise((resolve, reject) => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Ctor(); let settled = false;
    const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); fn(value); };
    const timer = setTimeout(() => { recognition.abort(); finish(reject, new Error("Se agotó el tiempo para escuchar. Inténtalo de nuevo.")); }, timeout);
    recognition.lang = locale(lang); recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = (e) => finish(resolve, e.results?.[0]?.[0]?.transcript || "");
    recognition.onerror = (e) => finish(reject, new Error(e.error === "not-allowed" || e.error === "service-not-allowed" ? "No se autorizó el micrófono." : `No se pudo reconocer la voz: ${e.error || "error"}.`));
    recognition.onend = () => { if (!settled) finish(reject, new Error("No se detectó voz. Inténtalo de nuevo.")); };
    try { recognition.start(); } catch (e) { finish(reject, new Error(e.message || "No se pudo iniciar el micrófono.")); }
  });
}
