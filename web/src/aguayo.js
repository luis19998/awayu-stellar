// Texturas de aguayo generadas en canvas: franjas lisas (pampa) y franjas
// labradas (pallay) con rombos, como en los tejidos andinos.
import * as THREE from "three";

export const PALETTE = {
  magenta: "#d81b60",
  rojo: "#a3122a",
  naranja: "#f57c1f",
  amarillo: "#f9c22e",
  verde: "#1f9d55",
  turquesa: "#13a3b0",
  azul: "#283c9c",
  morado: "#5b2a86",
  crema: "#f3e6c8",
  negro: "#15101c",
};

const STRIPES = [
  ["magenta", "amarillo", "verde"],
  ["turquesa", "naranja", "morado"],
  ["verde", "magenta", "amarillo"],
  ["naranja", "azul", "crema"],
  ["amarillo", "rojo", "turquesa"],
  ["azul", "amarillo", "magenta"],
];

function desaturate(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * (1 - k), hsl.l * (1 - k * 0.35));
  return "#" + c.getHexString();
}

/** Dibuja una franja de pallay (rombos escalonados) en el rectángulo dado. */
export function drawPallay(ctx, x, y, w, h, colors, faded = 0) {
  const [base, motif, edge] = colors.map((n) => (faded ? desaturate(PALETTE[n], faded) : PALETTE[n]));
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  // Bordes finos
  const e = Math.max(2, h * 0.08);
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, e);
  ctx.fillRect(x, y + h - e, w, e);
  // Rombos escalonados (pixelados como en el telar)
  const cell = Math.max(2, Math.round(h / 12));
  const dh = h - 2 * e;
  const dw = dh;
  ctx.fillStyle = motif;
  for (let cx = x + dw / 2; cx < x + w + dw; cx += dw) {
    for (let r = 0; r < dh / 2; r += cell) {
      const half = dh / 2 - r;
      const ww = Math.round(half / cell) * cell;
      ctx.fillRect(cx - ww, y + e + r, ww * 2, cell);
      ctx.fillRect(cx - ww, y + e + dh - r - cell, ww * 2, cell);
    }
    // Centro del rombo
    ctx.fillStyle = edge;
    ctx.fillRect(cx - cell * 2, y + e + dh / 2 - cell * 2, cell * 4, cell * 4);
    ctx.fillStyle = motif;
  }
}

/** Textura de una capa de tejido según la marca del historial. */
export function markTexture(mark, roundIndex) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 48;
  const ctx = c.getContext("2d");
  const colors = STRIPES[roundIndex % STRIPES.length];
  if (mark === 3) {
    // Faltó: hueco oscuro con un hilo rojo en zigzag
    ctx.fillStyle = PALETTE.negro;
    ctx.fillRect(0, 0, 256, 48);
    ctx.strokeStyle = "#e0263b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, x % 32 ? 34 : 14);
    ctx.stroke();
  } else {
    drawPallay(ctx, 0, 0, 256, 48, colors, mark === 2 ? 0.65 : 0);
    if (mark === 2) {
      // Tarde: hilos sueltos
      ctx.fillStyle = "rgba(20,10,30,.35)";
      for (let x = 6; x < 256; x += 22) ctx.fillRect(x, 0, 4, 48);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Aguayo grande para el suelo: pampas rojas con franjas labradas. */
export function clothTexture() {
  const S = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.fillStyle = PALETTE.rojo;
  ctx.fillRect(0, 0, S, S);
  const bands = [
    [0.04, 0.05, 0], [0.11, 0.035, 1], [0.2, 0.06, 2], [0.31, 0.03, 3],
    [0.47, 0.06, 4], [0.63, 0.03, 5], [0.72, 0.06, 0], [0.83, 0.035, 1], [0.91, 0.05, 2],
  ];
  for (const [y, h, s] of bands) drawPallay(ctx, 0, y * S, S, h * S, STRIPES[s]);
  // Hilos finos sobre la pampa
  ctx.globalAlpha = 0.18;
  for (let y = 0; y < S; y += 6) {
    ctx.fillStyle = y % 12 ? "#000" : "#fff";
    ctx.fillRect(0, y, S, 1);
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Tira horizontal de chips para el panel (HTML). */
export function historyStripDataURL(history, w = 220, h = 26) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const n = Math.max(history.length, 1);
  const cw = w / Math.max(n, 6);
  history.forEach((m, i) => {
    const sub = document.createElement("canvas");
    sub.width = 256;
    sub.height = 48;
    const sc = sub.getContext("2d");
    sc.drawImage(markTexture(m, i).image, 0, 0);
    ctx.drawImage(sub, 0, 0, 120, 48, i * cw, 0, cw - 2, h);
  });
  return c.toDataURL();
}
