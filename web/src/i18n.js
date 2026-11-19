// Traducción mínima: el texto en castellano es la clave; si no hay traducción,
// se muestra el castellano. Variables con {nombre}.
const EN = {
  // Interfaz fija
  "El pasanaku que teje tu historial": "The savings circle that weaves your record",
  "Demo": "Demo",
  "Stellar testnet": "Stellar testnet",
  "Ronda": "Round",
  "Cuota": "Payment",
  "Pozo": "Pot",
  "Este turno cobra": "This turn goes to",
  "Mientras espera, el pozo rinde": "While it waits, the pot earns",
  "Proyección con Vaquita (pools de Blend/DeFindex). Simulado.": "Projection with Vaquita (Blend/DeFindex pools). Simulated.",
  "Pagar el pozo": "Pay out the pot",
  "Simular aporte tardío": "Simulate a late payment",
  "Miembros": "Members",
  "tocá uno para ver su aguayo": "tap one to see their aguayo",
  "Historial del círculo": "Circle history",
  "▶ Contar la historia": "▶ Tell the story",
  "＋ Crear un pasanaku": "＋ Create a circle",
  "Personalizar": "Customize",
  "Compartir enlace": "Share link",
  "Ver contrato ↗": "View contract ↗",
  "Conectar billetera": "Connect wallet",
  "A tiempo": "On time",
  "Tarde": "Late",
  "Faltó": "Missed",
  "Cubierto por garantía": "Covered by guarantee",
  // Panel dinámico
  "fin": "end",
  "Círculo completo": "Circle complete",
  "Aportó": "Paid",
  "Aportó tarde": "Paid late",
  "Falta aportar": "Not paid yet",
  "Conectá tu billetera": "Connect your wallet",
  "No sos miembro": "Not a member",
  "Ya aportaste": "Already paid",
  "Aportar y firmar": "Pay and sign",
  "Aportar como {name}": "Pay as {name}",
  "Aportar (todos)": "Pay (everyone)",
  "Retirar garantía": "Withdraw guarantee",
  "Tu garantía está activa": "Your guarantee is active",
  "Su garantía está activa": "Their guarantee is active",
  "Dejar garantía ({amount})": "Leave a guarantee ({amount})",
  "Elegí un miembro para dejar garantía": "Pick a member to leave a guarantee",
  "Garantía {amount}": "Guarantee {amount}",
  "Plazo vencido: ya se puede pagar el pozo": "Deadline passed: the pot can be paid out",
  "Plazo: {n} min": "Deadline: {n} min",
  "Plazo: {n} h": "Deadline: {n} h",
  "Plazo: {n} días": "Deadline: {n} days",
  "Una ronda cada {n} días": "One round every {n} days",
  "{n} rondas tejidas · reputación {s}/100": "{n} rounds woven · reputation {s}/100",
  "Con este aguayo podría acceder a un microcrédito de": "With this aguayo they could qualify for a microloan of",
  "aún sin historial suficiente": "not enough history yet",
  "Es evidencia de pagos, verificable en la cadena; no es un crédito aprobado. Monto ilustrativo.":
    "It is evidence of payments, verifiable on-chain; not an approved loan. Illustrative amount.",
  "Ronda {n}: {name} recibió {amount}": "Round {n}: {name} received {amount}",
  "Ronda {n}: la garantía de {name} cubrió su cuota": "Round {n}: {name}'s guarantee covered their payment",
  "{name} dejó {amount} de garantía": "{name} left {amount} as a guarantee",
  "Todavía no se pagó ningún pozo.": "No pot has been paid out yet.",
  "{name} recibió {amount}": "{name} received {amount}",
  "Modo demo": "Demo mode",
  "Datos reales del contrato en testnet": "Live contract data on testnet",
  // Simulador
  "Simulador": "Simulator",
  "Simulador de pasanaku": "Savings circle simulator",
  "Quien cobra temprano recibe un adelanto sin interés; quien cobra tarde está ahorrando.":
    "Early turns get an interest-free advance; late turns are saving.",
  "Días por ronda": "Days per round",
  "Rendimiento anual estimado (%)": "Estimated yearly yield (%)",
  "Cerrar": "Close",
  "día {n}": "day {n}",
  "Pozo de cada ronda: {pot}. El círculo dura {days} días.": "Pot each round: {pot}. The circle lasts {days} days.",
  "El turno 1 recibe un adelanto de {a} sin interés; el último turno ahorró {s} y cobra todo junto.":
    "Turn 1 gets an interest-free advance of {a}; the last turn saved {s} and collects it all at once.",
  "Si el pozo rinde mientras espera, el círculo podría ganar unos {y} en total (estimado).":
    "If the pot earns while it waits, the circle could make about {y} in total (estimate).",
  "Turno": "Turn",
  "Cobra": "Paid on",
  "Recibe": "Receives",
  "Adelanto": "Advance",
  "Ahorro previo": "Saved before",
  // Recorrido del pitch
  "En Bolivia, millones ahorran en pasanakus: confianza pura, cero historial.":
    "In Bolivia, millions save in pasanakus: pure trust, zero record.",
  "Awayu lleva el pasanaku a Stellar: cuotas en dólares digitales, reglas en un contrato.":
    "Awayu brings the pasanaku to Stellar: digital-dollar payments, rules in a contract.",
  "Cada pago teje una capa de aguayo. Vivo y a tiempo, colores plenos.":
    "Every payment weaves a layer of aguayo. On time, full colors.",
  "Mientras el pozo espera, rinde en Vaquita. Nadie lo toca.":
    "While the pot waits, it earns in Vaquita. Nobody touches it.",
  "El turno se sorteó en la cadena. Hoy cobra quien le toca, sin discusión.":
    "The turn order was drawn on-chain. Today's recipient gets paid, no arguments.",
  "Ese aguayo es tu historial crediticio: portable, verificable, tuyo.":
    "That aguayo is your payment record: portable, verifiable, yours.",
};

const DICTS = { en: EN };
let lang = "es";

export function getLang() {
  return lang;
}

export function t(key, vars) {
  let s = (DICTS[lang] && DICTS[lang][key]) || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Traduce los elementos con data-i18n (su texto original es la clave). */
export function applyStatic(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    if (!el.dataset.i18nKey) el.dataset.i18nKey = el.textContent.trim();
    el.textContent = t(el.dataset.i18nKey);
  });
  document.documentElement.lang = lang === "en" ? "en" : "es";
}

export function setLang(next) {
  lang = DICTS[next] || next === "es" ? next : "es";
  try {
    localStorage.setItem("awayu.lang", lang);
  } catch {}
  applyStatic();
}

export function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem("awayu.lang");
  } catch {}
  lang = saved === "en" || saved === "es" ? saved : navigator.language?.startsWith("es") ? "es" : "en";
  applyStatic();
  return lang;
}
