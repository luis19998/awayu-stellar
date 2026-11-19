const STORAGE_KEY = "awayu.sound.muted";
const MASTER_VOLUME = 0.12;

let audioContext = null;
let muted = readMutedPreference();

function readMutedPreference() {
  try {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch {
    // Storage puede estar deshabilitado; el sonido sigue funcionando en memoria.
  }
  return false;
}

function saveMutedPreference() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, String(muted));
  } catch {
    // La preferencia se conserva durante esta sesión aunque Storage falle.
  }
}

/** Prepara WebAudio. No reproduce nada: solo los gestos de la interfaz dan sonido. */
export function initSound() {
  if (!audioContext) {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      audioContext = new AudioContextClass();
    } catch {
      return false;
    }
  }
  if (audioContext.state === "suspended") {
    const resumed = audioContext.resume?.();
    resumed?.catch?.(() => {});
  }
  return true;
}

export function setMuted(value) {
  muted = Boolean(value);
  saveMutedPreference();
}

export function isMuted() {
  return muted;
}

function tone(frequency, start, duration, { type = "sine", volume = 0.18, endFrequency } = {}) {
  if (muted || !audioContext || audioContext.state === "closed") return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const at = audioContext.currentTime + start;
  const peak = MASTER_VOLUME * volume;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.012, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.01);
}

/** Monedita breve que cae y tintinea en la vasija. */
export function coin() {
  tone(1320, 0, 0.16, { type: "sine", volume: 0.2, endFrequency: 720 });
  tone(1760, 0.035, 0.12, { type: "triangle", volume: 0.12, endFrequency: 1180 });
}

/** Arpegio corto sobre una pentatónica andina, con ataque de cuerda pulsada. */
export function payout() {
  [392, 440, 523.25, 659.25, 783.99].forEach((note, index) => {
    tone(note, index * 0.075, 0.22, { type: "triangle", volume: 0.16 });
  });
}

/** Dos hilos suaves que se cruzan al tejer una marca. */
export function weave() {
  tone(440, 0, 0.11, { type: "sine", volume: 0.11, endFrequency: 660 });
  tone(554.37, 0.09, 0.13, { type: "triangle", volume: 0.1, endFrequency: 440 });
}

/** Aviso corto y suave. */
export function error() {
  tone(392, 0, 0.12, { type: "sine", volume: 0.14, endFrequency: 330 });
  tone(330, 0.13, 0.15, { type: "sine", volume: 0.12 });
}
