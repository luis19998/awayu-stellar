import { PALETTE } from "../aguayo.js";

export const MESSAGES = {
  es: { title: "Teje tu aguayo", intro: "Mira la franja y repite los colores en el mismo orden.", level: "Fila", repeat: "Repite el patrón", next: "Siguiente fila", done: "¡Qué buen tejido! Completaste todas las filas.", retry: "Probar de nuevo", colors: "Elige un color" },
  en: { title: "Weave your aguayo", intro: "Look at the strip and repeat the colors in the same order.", level: "Row", repeat: "Repeat the pattern", next: "Next row", done: "Beautiful weaving! You completed every row.", retry: "Try again", colors: "Choose a color" },
};
for (const code of ["pt", "qu", "ay", "gn"]) MESSAGES[code] = { ...MESSAGES.es };
const COLORS = Object.keys(PALETTE);
const CLASS = "aw-game-tejido";

/** Secuencia reproducible de nombres de color, con un elemento nuevo por nivel. */
export function generatePattern(level = 1, seed = 1) {
  const n = Math.max(1, Math.min(30, Math.floor(Number(level) || 1)));
  let s = Number(seed) >>> 0 || 1;
  const next = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: n + 2 }, () => COLORS[Math.floor(next() * COLORS.length)]);
}

function styles() {
  return `<style>.${CLASS}{font:inherit;color:inherit}.${CLASS} *{box-sizing:border-box}.${CLASS} .aw-game-strip,.${CLASS} .aw-game-row{display:flex;gap:4px;justify-content:center;margin:.4rem auto;max-width:540px;flex-wrap:wrap}.${CLASS} .aw-game-tile{width:42px;height:42px;border-radius:5px;border:2px solid rgba(255,255,255,.5);box-shadow:0 1px 5px #0003}.${CLASS} button{font:inherit;cursor:pointer}.${CLASS} .aw-game-colors{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:1rem 0}.${CLASS} .aw-game-colors button{width:44px;height:44px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #555;}.${CLASS} [aria-live]{min-height:1.5em}</style>`;
}

/** Monta el juego en un contenedor y entrega destroy() para liberar listeners. */
export function mount(container, { lang = "es", onScore = () => {} } = {}) {
  const t = MESSAGES[lang] || MESSAGES.es;
  let level = 1; let pattern = generatePattern(level); let answer = []; let showing = false; let destroyed = false;
  container.innerHTML = `${styles()}<section class="${CLASS}"><h2>${t.title}</h2><p>${t.intro}</p><p class="aw-game-status" aria-live="polite"></p><div class="aw-game-strip" aria-label="${t.colors}"></div><div class="aw-game-fabric" aria-live="polite"></div><div class="aw-game-colors"></div><button type="button" class="aw-game-next">${t.next}</button></section>`;
  const root = container.querySelector(`.${CLASS}`); const status = root.querySelector(".aw-game-status");
  const strip = root.querySelector(".aw-game-strip"); const fabric = root.querySelector(".aw-game-fabric"); const choices = root.querySelector(".aw-game-colors"); const next = root.querySelector(".aw-game-next");
  let timer;
  const draw = (visible) => {
    strip.replaceChildren(...(visible ? pattern : answer.map(() => "#dddddd")).map((color) => {
      const tile = document.createElement("span"); tile.className = "aw-game-tile"; tile.style.background = PALETTE[color] || color; return tile;
    }));
  };
  const begin = () => {
    if (destroyed) return;
    clearTimeout(timer); pattern = generatePattern(level, level); answer = []; showing = true;
    status.textContent = `${t.level} ${level}: ${t.repeat}`; draw(true); choices.replaceChildren(); next.hidden = true;
    timer = setTimeout(() => { showing = false; draw(false); choices.replaceChildren(...COLORS.map((color) => {
      const button = document.createElement("button"); button.type = "button"; button.setAttribute("aria-label", color); button.style.background = PALETTE[color];
      button.addEventListener("click", () => pick(color)); return button;
    })); }, 900 + pattern.length * 260);
  };
  const pick = (color) => {
    if (showing || destroyed) return;
    answer.push(color); draw(false);
    const index = answer.length - 1;
    if (answer[index] !== pattern[index]) { status.textContent = t.retry; level = 1; fabric.replaceChildren(); choices.replaceChildren(); next.hidden = false; return; }
    if (answer.length === pattern.length) {
      const row = document.createElement("div"); row.className = "aw-game-row"; row.setAttribute("aria-label", `${t.level} ${level}`);
      answer.forEach((name) => { const tile = document.createElement("span"); tile.className = "aw-game-tile"; tile.style.background = PALETTE[name]; row.append(tile); });
      fabric.append(row); choices.replaceChildren(); status.textContent = `${t.level} ${level} ✓`; onScore(level); level += 1; next.hidden = false;
    }
  };
  next.addEventListener("click", begin); begin();
  return { destroy() { destroyed = true; clearTimeout(timer); container.replaceChildren(); } };
}
