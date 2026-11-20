export const MESSAGES = {
  es: { title: "Pasanaku y Stellar", start: "Empezar", next: "Siguiente", finish: "Ver resultado", score: "Puntaje", badge0: "Aprendiz", badge6: "Tejedora de confianza", badge10: "Guardiana del pasanaku", correct: "¡Bien!", wrong: "Casi.", questions: [
    ["¿Qué es un pasanaku?", ["Un ahorro rotativo entre personas", "Un préstamo con interés", "Una moneda digital"], 0, "Cada integrante aporta por turno y una persona recibe el pozo de la ronda."],
    ["¿Para qué sirve una garantía?", ["Para ganar intereses", "Para cubrir una cuota que faltó", "Para cambiar el turno"], 1, "La garantía puede cubrir una cuota pendiente según las reglas del círculo."],
    ["¿El pasanaku cobra intereses por sí mismo?", ["Sí, siempre", "No; es ahorro rotativo", "Solo si se paga tarde"], 1, "En el modelo de ahorro rotativo no se generan intereses por defecto."],
    ["¿Qué es una billetera digital?", ["Una app o herramienta que administra activos digitales", "Una cuenta bancaria en efectivo", "Un tipo de garantía"], 0, "La billetera permite administrar activos y autorizar operaciones."],
    ["¿Qué es Stellar?", ["Una red para mover activos digitales", "Una billetera", "Un banco"], 0, "Stellar es una red abierta para transferir y emitir activos digitales."],
    ["¿Qué es una stablecoin?", ["Un token diseñado para seguir el valor de otro activo", "Una moneda que siempre sube", "Una contraseña"], 0, "Una stablecoin busca mantener un valor de referencia; puede tener riesgos."],
    ["¿Cómo suelen ser las comisiones de Stellar?", ["Bajas, pero no necesariamente cero", "Siempre muy altas", "No existe ninguna comisión"], 0, "La red cobra comisiones pequeñas para procesar operaciones; pueden cambiar."],
    ["¿Qué haces con tu frase semilla?", ["La compartes con soporte", "La guardas en privado y segura", "La publicas para recuperar la cuenta"], 1, "Quien conoce la frase semilla puede controlar la billetera. Nunca la compartas."],
    ["¿Cuál es una señal de estafa?", ["Te apuran para enviar dinero o revelar claves", "Te explican las reglas", "Te muestran una dirección pública"], 0, "La urgencia y el pedido de claves son señales de alerta."],
    ["¿Una transacción confirmada se puede revertir fácilmente?", ["No, por lo general es difícil o imposible", "Sí, con un botón", "La billetera la cancela después"], 0, "Revisa dirección y monto antes de firmar; las transferencias suelen ser irreversibles."],
    ["¿Qué dato puedes compartir para recibir un pago?", ["Tu dirección pública", "Tu frase semilla", "Tu contraseña"], 0, "La dirección pública sirve para recibir; las claves privadas se mantienen secretas."],
    ["¿La marca del aguayo garantiza que te darán un crédito?", ["Sí, garantiza aprobación", "No, muestra historial y no garantiza crédito", "Solo si el aguayo es grande"], 1, "El historial puede informar decisiones, pero no es aprobación automática de crédito."],
  ] },
  en: { title: "Pasanaku and Stellar", start: "Start", next: "Next", finish: "See result", score: "Score", badge0: "Learner", badge6: "Trust weaver", badge10: "Pasanaku guardian", questions: [
    ["What is a pasanaku?", ["Rotating savings among people", "An interest loan", "A digital coin"], 0, "Each member contributes in turn and one person receives the round's pot."],
    ["What is a guarantee for?", ["Earning interest", "Covering a missed contribution", "Changing the turn"], 1, "A guarantee can cover a missing contribution under the circle's rules."],
    ["Does a pasanaku charge interest by itself?", ["Yes, always", "No; it is rotating savings", "Only when late"], 1, "A rotating savings circle does not generate interest by default."],
    ["What is a digital wallet?", ["A tool to manage digital assets", "A cash bank account", "A kind of guarantee"], 0, "A wallet lets you manage assets and authorize transactions."],
    ["What is Stellar?", ["A network for moving digital assets", "A wallet", "A bank"], 0, "Stellar is an open network for transferring and issuing digital assets."],
    ["What is a stablecoin?", ["A token designed to track another asset's value", "A coin that always rises", "A password"], 0, "A stablecoin aims to track a reference value; it can still carry risks."],
    ["How are Stellar fees generally?", ["Low, but not necessarily zero", "Always very high", "There are no fees"], 0, "The network charges small fees to process operations; they may change."],
    ["What should you do with your seed phrase?", ["Share it with support", "Keep it private and secure", "Publish it to recover your account"], 1, "Anyone with your seed phrase can control your wallet. Never share it."],
    ["Which is a scam warning sign?", ["Pressure to send money or reveal keys", "Clear rules", "A public address"], 0, "Urgency and requests for keys are warning signs."],
    ["Can a confirmed transaction be easily reversed?", ["Usually no; it is difficult or impossible", "Yes, with a button", "The wallet cancels it later"], 0, "Check address and amount before signing; transfers are usually irreversible."],
    ["What can you share to receive a payment?", ["Your public address", "Your seed phrase", "Your password"], 0, "A public address can receive funds; private keys stay secret."],
    ["Does an aguayo mark guarantee you will get a loan?", ["Yes, approval is guaranteed", "No, it shows history but does not guarantee credit", "Only if the aguayo is large"], 1, "History can inform decisions, but it is not automatic credit approval."],
  ] },
};
const CLASS = "aw-game-quiz";
/** Comprueba que el banco tenga 12 preguntas completas y respuestas válidas. */
export function validateQuestions(questions) {
  return Array.isArray(questions) && questions.length === 12 && questions.every((q) => Array.isArray(q) && q.length === 4 && typeof q[0] === "string" && Array.isArray(q[1]) && q[1].length >= 2 && Number.isInteger(q[2]) && q[2] >= 0 && q[2] < q[1].length && typeof q[3] === "string");
}
const style = `<style>.${CLASS}{font:inherit;color:inherit;max-width:650px}.${CLASS} button{font:inherit;cursor:pointer;margin:.25rem;padding:.55rem .8rem}.${CLASS} .aw-game-options{display:grid;gap:.45rem}.${CLASS} .aw-game-options button{text-align:left;border:1px solid #888;border-radius:8px;background:transparent;color:inherit}.${CLASS} .aw-game-options button[aria-pressed=true]{outline:3px solid #d81b60}.${CLASS} [aria-live]{min-height:2em}</style>`;

/** Monta el cuestionario y notifica onScore con aciertos (0 a 12). */
export function mount(container, { lang = "es", onScore = () => {} } = {}) {
  const t = MESSAGES[lang] || MESSAGES.es; const questions = t.questions;
  let index = -1; let score = 0; let answered = false;
  container.innerHTML = `${style}<section class="${CLASS}"><h2>${t.title}</h2><div class="aw-game-content"><button type="button" class="aw-game-start">${t.start}</button></div></section>`;
  const root = container.querySelector(`.${CLASS}`); const content = root.querySelector(".aw-game-content");
  const show = () => {
    index += 1; answered = false; const q = questions[index];
    content.innerHTML = `<p>${index + 1}/12</p><h3></h3><div class="aw-game-options"></div><p class="aw-game-feedback" aria-live="polite"></p><button type="button" class="aw-game-next" hidden>${index === 11 ? t.finish : t.next}</button>`;
    content.querySelector("h3").textContent = q[0]; const options = content.querySelector(".aw-game-options");
    q[1].forEach((option, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = option; b.addEventListener("click", () => {
      if (answered) return; answered = true; const correct = i === q[2]; if (correct) score += 1;
      content.querySelectorAll(".aw-game-options button").forEach((button) => { button.disabled = true; });
      content.querySelector(".aw-game-feedback").textContent = `${correct ? t.correct : t.wrong} ${q[3]}`;
      content.querySelector(".aw-game-next").hidden = false;
    }); options.append(b); });
    content.querySelector(".aw-game-next").addEventListener("click", () => index < 11 ? show() : finish());
  };
  const finish = () => { onScore(score); const badge = score >= 10 ? t.badge10 : score >= 6 ? t.badge6 : t.badge0; content.innerHTML = `<h3>${t.score}: ${score}/12</h3><p>${badge}</p><button type="button" class="aw-game-start">${t.start}</button>`; content.querySelector("button").addEventListener("click", start); };
  const start = () => { index = -1; score = 0; show(); };
  content.querySelector(".aw-game-start").addEventListener("click", start);
  return { destroy() { container.replaceChildren(); } };
}
