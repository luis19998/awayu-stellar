// Bienvenida para quien llega sin saber nada: cinco tarjetas con lenguaje simple,
// elección de idioma al inicio, glosario mínimo y dos salidas (recorrido guiado o
// explorar solo). Se muestra una sola vez por perfil; se puede repetir desde Ayuda.
import { LANGS, getLang, setLang, pickLang } from "../i18n.js";
import "./welcome.css";

export const WELCOME_KEY = "awayu.guide.welcome.seen";
const L = (es, en, pt, qu, ay, gn) => ({ es, en, pt: pt ?? es, qu: qu ?? es, ay: ay ?? es, gn: gn ?? es });

const SLIDES = [
  {
    id: "idioma",
    icon: "🌎",
    title: L("¡Bienvenida, bienvenido a Awayu!", "Welcome to Awayu!", "Boas-vindas ao Awayu!", "¡Awayuman allinlla hamuy!", "¡Awayur suma jutawi!", "¡Eg̃uahẽ porãite Awayu-pe!"),
    text: L("Elige el idioma en el que te sientas más cómodo. Puedes cambiarlo cuando quieras desde ⚙ Configuración.", "Pick the language you're most comfortable with. You can change it any time from ⚙ Settings.", "Escolha o idioma em que você se sente mais à vontade. Você pode mudá-lo quando quiser em ⚙ Configurações."),
    langs: true,
  },
  {
    id: "que",
    icon: "🧶",
    title: L("¿Qué es Awayu?", "What is Awayu?", "O que é o Awayu?", "¿Imataq Awayu?", "¿Kunas Awayu?", "¿Mba'épa Awayu?"),
    text: L(
      "Es una forma moderna de hacer lo que nuestras familias siempre hicieron: ahorrar juntos y ayudarse. Las reglas quedan escritas en internet de forma que nadie las puede cambiar ni esconder, y cada pago que cumples teje tu aguayo: un historial que demuestra que eres una persona confiable.",
      "It's a modern way to do what our families always did: save together and help each other. The rules are written online so nobody can change or hide them, and every payment you keep weaves your aguayo: a record that shows you're trustworthy.",
      "É uma forma moderna de fazer o que nossas famílias sempre fizeram: poupar juntos e se ajudar. As regras ficam escritas na internet de um jeito que ninguém pode mudar nem esconder, e cada pagamento que você cumpre tece seu aguayo: um histórico que mostra que você é confiável."),
  },
  {
    id: "tradiciones",
    icon: "🤝",
    title: L("Cuatro formas de ayudarnos", "Four ways to help each other", "Quatro formas de nos ajudar", "Tawa yanapanakuy", "Pusi yanapt'asiwi", "Irundy pytyvõjoja"),
    text: L("Elige la que se parezca a lo que ya haces:", "Pick the one closest to what you already do:", "Escolha a que mais se parece com o que você já faz:"),
    list: [
      ["◎", L("Pasanaku", "Pasanaku"), L("Todos ponen una cuota; por turno sorteado, una persona recibe el pozo.", "Everyone pays in; by a drawn turn, one person receives the pot.", "Todos pagam uma cota; por vez sorteada, uma pessoa recebe o fundo.")],
      ["❖", L("Ayni", "Ayni"), L("Un fondo para emergencias: pides, la comunidad vota y devuelves sin intereses.", "An emergency fund: you ask, the community votes, you repay with no interest.", "Um fundo para emergências: você pede, a comunidade vota e você devolve sem juros.")],
      ["✚", L("Minka", "Minka"), L("Un proyecto común: el dinero se libera por partes cuando se ve el avance.", "A shared project: money is released in parts when progress is shown.", "Um projeto comum: o dinheiro é liberado por partes quando o avanço é visto.")],
      ["⌂", L("Alasitas", "Alasitas"), L("Tu meta de ahorro: una miniatura de lo que deseas, sola o con otros.", "Your savings goal: a miniature of what you wish for, alone or with others.", "Sua meta de poupança: uma miniatura do que você deseja, sozinho ou com outros.")],
    ],
  },
  {
    id: "seguro",
    icon: "🛟",
    title: L("Pruébalo sin riesgo", "Try it risk-free", "Experimente sem risco", "Mana manchakuspa llamk'achiy", "Jan axsarasa yant'am", "Ehecha kyhyje'ỹre"),
    text: L(
      "Todo lo que ves funciona en modo demostración: no se usa dinero real. Cuando quieras, puedes probarlo en la red de prueba de Stellar (testnet), que tampoco usa dinero real. Si te pierdes, el botón ? de abajo a la derecha tiene videos cortos de cada paso.",
      "Everything you see works in demo mode: no real money is used. Whenever you want, you can try it on Stellar's test network (testnet), which doesn't use real money either. If you get lost, the ? button at the bottom right has short videos for every step.",
      "Tudo o que você vê funciona em modo demonstração: não se usa dinheiro real. Quando quiser, pode testar na rede de testes da Stellar (testnet), que também não usa dinheiro real. Se se perder, o botão ? no canto inferior direito tem vídeos curtos de cada passo."),
  },
  {
    id: "palabras",
    icon: "📖",
    title: L("Cinco palabras útiles", "Five useful words", "Cinco palavras úteis", "Pichqa allin simikuna", "Phisqa wakiskir arunaka", "Po ñe'ẽ iporãva"),
    glossary: [
      [L("Billetera", "Wallet", "Carteira"), L("Una app que guarda tu cuenta y firma tus pagos. Puede ser Albedo (sin instalar nada), Freighter, xBull o tu cuenta de Google con Pollar.", "An app that holds your account and signs your payments. It can be Albedo (nothing to install), Freighter, xBull or your Google account with Pollar.", "Um app que guarda sua conta e assina seus pagamentos. Pode ser Albedo (sem instalar nada), Freighter, xBull ou sua conta Google com Pollar.")],
      [L("Firmar", "Sign", "Assinar"), L("Dar tu permiso para una acción. Nada se mueve sin tu firma.", "Giving your permission for an action. Nothing moves without your signature.", "Dar sua permissão para uma ação. Nada se move sem a sua assinatura.")],
      [L("Contrato", "Contract", "Contrato"), L("Las reglas del grupo convertidas en un programa público que se cumple solo.", "The group's rules turned into a public program that enforces itself.", "As regras do grupo transformadas em um programa público que se cumpre sozinho.")],
      [L("Testnet", "Testnet", "Testnet"), L("La red de práctica de Stellar: todo es real menos el dinero.", "Stellar's practice network: everything is real except the money.", "A rede de prática da Stellar: tudo é real, menos o dinheiro.")],
      [L("Aguayo", "Aguayo", "Aguayo"), L("Tu historial: cada pago a tiempo suma una franja de color.", "Your record: each on-time payment adds a stripe of color.", "Seu histórico: cada pagamento em dia soma uma faixa de cor.")],
    ],
  },
];

const BTN = {
  next: L("Siguiente", "Next", "Próximo", "Qatiq", "Jutiri", "Upeigua"),
  back: L("Atrás", "Back", "Voltar", "Qhipaman", "Qhipäxa", "Tapykuépe"),
  skip: L("Saltar", "Skip", "Pular", "Saltay", "Jaltaña", "Ehasa"),
  tour: L("Hacer el recorrido guiado (2 min)", "Take the guided tour (2 min)", "Fazer o tour guiado (2 min)"),
  explore: L("Explorar por mi cuenta", "Explore on my own", "Explorar por conta própria"),
  label: L("Bienvenida", "Welcome", "Boas-vindas"),
};

export function hasSeenWelcome() {
  try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch { return true; }
}

/** Muestra la bienvenida. onTour() se llama si la persona elige el recorrido guiado. */
export function openWelcome({ onTour, onDone } = {}) {
  if (typeof document === "undefined" || document.querySelector(".aw-welcome")) return null;
  let lang = getLang();
  let i = 0;
  let onLanguage = () => {};
  const d = document.createElement("dialog");
  d.className = "aw-welcome";
  const close = (tour) => {
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* sin almacenamiento */ }
    d.close();
    d.remove();
    window.removeEventListener("awayu:lang", onLanguage);
    if (tour) onTour?.(); else onDone?.();
  };
  d.addEventListener("cancel", (e) => { e.preventDefault(); close(false); });
  const draw = () => {
    const s = SLIDES[i];
    const t = (o) => pickLang(o, lang);
    d.setAttribute("aria-label", t(BTN.label));
    d.innerHTML = `<div class="aw-w-card">
      <button type="button" class="aw-w-skip">${t(BTN.skip)}</button>
      <div class="aw-w-icon" aria-hidden="true">${s.icon}</div>
      <h2 id="aw-w-title"></h2><p class="aw-w-text"></p><div class="aw-w-extra"></div>
      <div class="aw-w-dots" aria-hidden="true">${SLIDES.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="aw-w-nav"></div></div>`;
    d.setAttribute("aria-labelledby", "aw-w-title");
    d.querySelector("h2").textContent = t(s.title);
    d.querySelector(".aw-w-text").textContent = t(s.text || L("", ""));
    const extra = d.querySelector(".aw-w-extra");
    if (s.langs) {
      const g = document.createElement("div");
      g.className = "aw-w-langs";
      for (const { code, name } of LANGS) {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = name; b.setAttribute("aria-pressed", String(code === lang));
        b.onclick = () => {
          lang = code;
          setLang(code);
          const sel = document.querySelector("#sel-lang");
          if (sel) sel.value = code;
          draw();
        };
        g.append(b);
      }
      extra.append(g);
    }
    if (s.list) {
      const ul = document.createElement("ul");
      ul.className = "aw-w-list";
      for (const [ic, name, desc] of s.list) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="ic" aria-hidden="true">${ic}</span><b></b><span></span>`;
        li.querySelector("b").textContent = t(name);
        li.querySelector("span:last-child").textContent = t(desc);
        ul.append(li);
      }
      extra.append(ul);
    }
    if (s.glossary) {
      const dl = document.createElement("dl");
      dl.className = "aw-w-gloss";
      for (const [term, def] of s.glossary) {
        const dt = document.createElement("dt"); dt.textContent = t(term);
        const dd = document.createElement("dd"); dd.textContent = t(def);
        dl.append(dt, dd);
      }
      extra.append(dl);
    }
    const nav = d.querySelector(".aw-w-nav");
    const mk = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = t(label); b.onclick = fn; nav.append(b); return b; };
    if (i > 0) mk(BTN.back, "ghost", () => { i--; draw(); });
    let main;
    if (i < SLIDES.length - 1) main = mk(BTN.next, "primary", () => { i++; draw(); });
    else {
      mk(BTN.explore, "ghost", () => close(false));
      main = mk(BTN.tour, "primary", () => close(true));
    }
    d.querySelector(".aw-w-skip").onclick = () => close(false);
    main.focus();
  };
  onLanguage = (event) => { lang = event.detail?.lang || getLang(); draw(); };
  window.addEventListener("awayu:lang", onLanguage);
  document.body.append(d);
  draw();
  d.showModal();
  return { close: () => close(false) };
}
