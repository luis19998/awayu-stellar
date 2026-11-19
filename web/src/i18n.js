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
  "Descargar certificado del aguayo": "Download aguayo certificate",
  // Avisos y diálogos
  "Aporte registrado en la cadena ✓": "Payment recorded on-chain ✓",
  "Billetera conectada": "Wallet connected",
  "Cuenta de testnet fondeada con Friendbot": "Testnet account funded with Friendbot",
  "El nombre debe tener entre 1 y 24 caracteres": "The name must be 1 to 24 characters",
  "Enlace copiado: cualquiera puede ver el círculo; los miembros aportan con su billetera": "Link copied: anyone can view the circle; members pay with their wallet",
  "Enviando a Stellar testnet…": "Sending to Stellar testnet…",
  "Firmá en tu billetera…": "Sign in your wallet…",
  "Garantía depositada: si un día no podés pagar, cubre tu cuota ✓": "Guarantee deposited: if you ever can't pay, it covers your payment ✓",
  "Garantía devuelta a tu billetera ✓": "Guarantee returned to your wallet ✓",
  "Hacen falta al menos 2 miembros": "At least 2 members are needed",
  "Leyendo el contrato en Stellar testnet…": "Reading the contract on Stellar testnet…",
  "Nombre guardado en la cadena ✓": "Name saved on-chain ✓",
  "Primero conectá tu billetera": "Connect your wallet first",
  "¡Pasanaku creado! Compartí el enlace con los miembros": "Circle created! Share the link with the members",
  "Preparando {what}…": "Preparing {what}…",
  "{name} dejó una cuota de garantía": "{name} left one payment as a guarantee",
  "No se pudo: {why}": "Couldn't do it: {why}",
  "No se pudo crear el certificado: {why}": "Couldn't create the certificate: {why}",
  "cancelaste la firma": "you cancelled the signature",
  "la ronda sigue abierta": "the round is still open",
  "ya aportaste en esta ronda": "you already paid this round",
  "no sos miembro del círculo": "you are not a member of this circle",
  "tu aporte": "your payment",
  "el pago del pozo": "the pot payout",
  "tu garantía": "your guarantee",
  "el retiro de tu garantía": "your guarantee withdrawal",
  "tu nombre": "your name",
  "el nuevo círculo": "the new circle",
  "Garantía disponible": "Guarantee available",
  "Conexión con Stellar recuperada": "Connection to Stellar restored",
  "No se pudo actualizar desde Stellar; se muestran los últimos datos y se reintentará": "Couldn't update from Stellar; showing the last data and retrying",
  "Círculo de demostración personalizado": "Custom demo circle",
  "Demo original": "Original demo",
  "Crear un pasanaku en testnet": "Create a circle on testnet",
  "Vos firmás el despliegue. El orden de cobro lo sortea la red.": "You sign the deployment. The network draws the payout order.",
  "Cuota por ronda (XLM de testnet)": "Payment per round (testnet XLM)",
  "Duración de cada ronda": "Length of each round",
  "Miembros (una dirección G… por línea; la tuya ya está incluida)": "Members (one G… address per line; yours is already included)",
  "Cancelar": "Cancel",
  "Crear y firmar": "Create and sign",
  "Estilo del aguayo": "Aguayo style",
  "Círculo de demostración": "Demo circle",
  "Miembros (uno por línea: nombre, y si querés, oficio · lugar)": "Members (one per line: name, and optionally job · place)",
  "Cuota (USDC)": "Payment (USDC)",
  "Rondas ya jugadas": "Rounds already played",
  "Girar la cámara sola": "Rotate the camera automatically",
  "Volver a la demo original": "Back to the original demo",
  "Aplicar": "Apply",
  "5 minutos (para demos)": "5 minutes (for demos)",
  "1 hora": "1 hour",
  "1 día": "1 day",
  "1 semana": "1 week",
  "30 días": "30 days",
  "Valle (Cochabamba)": "Valley (Cochabamba)",
  "Rojo y negro (inspirado en Tarabuco)": "Red and black (inspired by Tarabuco)",
  "Lana natural (Altiplano)": "Natural wool (Altiplano)",
  "Vivos (Norte de Potosí)": "Vivid (Northern Potosí)",
  "Escenario": "Scenery",
  "Vasija del pozo": "Pot vessel",
  "Mesa": "Table",
  "Altiplano de noche": "Altiplano at night",
  "Salar de Uyuni (espejo)": "Uyuni salt flat (mirror)",
  "Valle de Cochabamba": "Cochabamba valley",
  "Lago Titicaca al atardecer": "Lake Titicaca at sunset",
  "Potosí y el Cerro Rico": "Potosí and Cerro Rico",
  "Yungas entre la neblina": "Yungas in the mist",
  "Cántaro pintado": "Painted jug",
  "Q'ero con tocapus": "Q'ero cup with tocapus",
  "Chanchito alcancía": "Piggy bank",
  "Olla de barro": "Clay pot",
  "Cofre de madera": "Wooden chest",
  "Aguayo sobre el suelo": "Aguayo on the ground",
  "Mesa de madera": "Wooden table",
  "Mesa de piedra": "Stone table",
  "Bloque de sal": "Salt block",
  "Tronco cortado": "Tree trunk",
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
  // El público principal es boliviano: castellano por defecto, inglés a un clic
  lang = saved === "en" || saved === "es" ? saved : "es";
  applyStatic();
  return lang;
}
