export const MESSAGES = {
  es: { title: "El sorteo justo", intro: "Cada participante tiene la misma probabilidad de recibir cada turno. No hay apuestas ni premios en dinero.", count: "Participantes", seed: "Semilla", draw: "Sortear un turno", repeat: "Repetir 1000 sorteos", position: "Turno sorteado", probability: "Probabilidad por posición", histogram: "Resultados de 1000 sorteos", empty: "Todavía no hay simulaciones." },
  en: { title: "The fair draw", intro: "Every participant has the same chance of each turn. There are no bets or cash prizes.", count: "Participants", seed: "Seed", draw: "Draw a turn", repeat: "Run 1000 draws", position: "Drawn turn", probability: "Chance per position", histogram: "Results from 1000 draws", empty: "No simulations yet." },
};
const CLASS = "aw-game-ruleta";
function randomFor(seed) {
  let s = Number(seed) >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
/** Elige un índice uniforme usando un generador repetible con semilla. */
export function drawPosition(n, seed = 1) {
  const size = Math.max(0, Math.floor(Number(n) || 0));
  if (!size) return null;
  return Math.floor(randomFor(seed)() * size);
}
/** Cuenta una secuencia de índices sorteados en un histograma de N posiciones. */
export function countHistogram(draws, n) {
  const size = Math.max(0, Math.floor(Number(n) || 0));
  const bins = Array(size).fill(0);
  for (const draw of draws || []) if (Number.isInteger(draw) && draw >= 0 && draw < size) bins[draw] += 1;
  return bins;
}
const style = `<style>.${CLASS}{font:inherit;color:inherit}.${CLASS} label{display:inline-grid;gap:.25rem;margin:.3rem .6rem .5rem 0}.${CLASS} input{font:inherit;max-width:9rem;padding:.35rem}.${CLASS} button{font:inherit;cursor:pointer;margin:.25rem;padding:.5rem .7rem}.${CLASS} canvas{display:block;width:min(100%,620px);height:250px;margin:.5rem auto;border:1px solid #7775;border-radius:8px}.${CLASS} .aw-game-controls{display:flex;gap:.4rem;flex-wrap:wrap}</style>`;

/** Monta una ruleta educativa con histograma. onScore recibe 1 tras usarla. */
export function mount(container, { lang = "es", onScore = () => {} } = {}) {
  const t = MESSAGES[lang] || MESSAGES.es;
  container.innerHTML = `${style}<section class="${CLASS}"><h2>${t.title}</h2><p>${t.intro}</p><div class="aw-game-controls"><label>${t.count}<input class="aw-game-n" type="number" min="2" max="24" value="6"></label><label>${t.seed}<input class="aw-game-seed" type="number" value="42"></label></div><div class="aw-game-controls"><button type="button" class="aw-game-draw">${t.draw}</button><button type="button" class="aw-game-repeat">${t.repeat}</button></div><p class="aw-game-result" aria-live="polite"></p><p class="aw-game-prob"></p><h3>${t.histogram}</h3><canvas width="720" height="280" aria-label="${t.histogram}"></canvas><p class="aw-game-counts" aria-live="polite">${t.empty}</p></section>`;
  const root = container.querySelector(`.${CLASS}`); const nInput = root.querySelector(".aw-game-n"); const seedInput = root.querySelector(".aw-game-seed"); const canvas = root.querySelector("canvas"); const ctx = canvas.getContext("2d");
  let histogram = []; let angle = 0; let frame; let destroyed = false;
  const n = () => Math.max(2, Math.min(24, Number(nInput.value) || 2));
  const seed = () => Number(seedInput.value) || 1;
  const drawWheel = (highlight = -1) => {
    if (!ctx) return;
    const w = canvas.width; const h = canvas.height; const cx = w / 2; const cy = h / 2; const radius = Math.min(cx - 24, cy - 18);
    ctx.clearRect(0, 0, w, h); const step = Math.PI * 2 / n();
    for (let i = 0; i < n(); i++) {
      const start = angle + i * step; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, start + step); ctx.closePath();
      ctx.fillStyle = i === highlight ? "#f9c22e" : ["#d81b60", "#13a3b0", "#5b2a86", "#f57c1f", "#1f9d55", "#283c9c"][i % 6]; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + step / 2); ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "right"; ctx.fillText(String(i + 1), radius - 14, 6); ctx.restore();
    }
    ctx.fillStyle = "#18121c"; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
  };
  const showHistogram = () => {
    const max = Math.max(1, ...histogram); const gap = 8; const plotW = canvas.width - 56; const barW = (plotW - gap * (histogram.length - 1)) / histogram.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height); histogram.forEach((value, i) => {
      const bh = value / max * 195; const x = 28 + i * (barW + gap); ctx.fillStyle = ["#d81b60", "#13a3b0", "#5b2a86", "#f57c1f", "#1f9d55", "#283c9c"][i % 6]; ctx.fillRect(x, 224 - bh, barW, bh);
      ctx.fillStyle = "currentColor"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`${i + 1}: ${value}`, x + barW / 2, 245);
    });
  };
  const animate = (position, callback) => {
    cancelAnimationFrame(frame); const start = performance.now(); const duration = 1300; const target = angle + Math.PI * 8 + (Math.PI * 2 - (position + 0.5) * Math.PI * 2 / n());
    const step = (now) => { if (destroyed) return; const p = Math.min(1, (now - start) / duration); const ease = 1 - (1 - p) ** 4; angle += (target - angle) * ease; drawWheel(); if (p < 1) frame = requestAnimationFrame(step); else { angle = target; drawWheel(position); callback(); } };
    frame = requestAnimationFrame(step);
  };
  root.querySelector(".aw-game-draw").addEventListener("click", () => {
    const position = drawPosition(n(), seed()); root.querySelector(".aw-game-result").textContent = `${t.position}: ${position + 1}`;
    root.querySelector(".aw-game-prob").textContent = `${t.probability}: 1/${n()} = ${(100 / n()).toFixed(1)}%`;
    animate(position, () => { onScore(1); });
  });
  root.querySelector(".aw-game-repeat").addEventListener("click", () => {
    const draws = []; const rand = randomFor(seed()); for (let i = 0; i < 1000; i++) draws.push(Math.floor(rand() * n()));
    histogram = countHistogram(draws, n()); showHistogram(); root.querySelector(".aw-game-counts").textContent = histogram.map((count, i) => `${i + 1}: ${count}`).join(" · ");
    root.querySelector(".aw-game-prob").textContent = `${t.probability}: 1/${n()} = ${(100 / n()).toFixed(1)}%`; onScore(1);
  });
  nInput.addEventListener("change", () => { histogram = []; drawWheel(); root.querySelector(".aw-game-counts").textContent = t.empty; });
  drawWheel();
  return { destroy() { destroyed = true; cancelAnimationFrame(frame); container.replaceChildren(); } };
}
