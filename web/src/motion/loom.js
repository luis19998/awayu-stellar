// Telar animado: teje filas de rombos de aguayo una tras otra, en bucle.
// Se usa como motion graphic en la portada. Respeta "reducir movimiento".
import { PALETTE } from "../aguayo.js";

const ROWS = [
  ["magenta", "amarillo", "verde"],
  ["turquesa", "naranja", "morado"],
  ["rojo", "crema", "turquesa"],
  ["verde", "magenta", "amarillo"],
  ["azul", "amarillo", "magenta"],
  ["naranja", "azul", "crema"],
];

export function mountLoom(canvas, { rowH = 26, speed = 1 } = {}) {
  const ctx = canvas.getContext("2d");
  const calm = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let h = 0;
  let raf = 0;
  let t0 = performance.now();
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function row(y, colors, progress) {
    const [base, motif, edge] = colors.map((c) => PALETTE[c]);
    const cw = w * progress;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, cw, rowH);
    ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(0, y, w, rowH);
    ctx.fillStyle = edge;
    ctx.fillRect(0, y, w, 2);
    ctx.fillRect(0, y + rowH - 2, w, 2);
    const d = rowH - 6;
    const cell = Math.max(2, Math.round(d / 8));
    for (let cx = d / 2; cx < w + d; cx += d) {
      ctx.fillStyle = motif;
      for (let r = 0; r < d / 2; r += cell) {
        const half = Math.round((d / 2 - r) / cell) * cell;
        ctx.fillRect(cx - half, y + 3 + r, half * 2, cell);
        ctx.fillRect(cx - half, y + 3 + d - r - cell, half * 2, cell);
      }
      ctx.fillStyle = edge;
      ctx.fillRect(cx - cell, y + 3 + d / 2 - cell, cell * 2, cell * 2);
    }
    ctx.restore();
    // La lanzadera: un hilo brillante en el borde que avanza
    if (progress < 1) {
      ctx.fillStyle = "rgba(255, 230, 160, .95)";
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 14;
      ctx.fillRect(cw - 2, y - 2, 4, rowH + 4);
      ctx.shadowBlur = 0;
    }
  }

  function draw(now) {
    const rowsVisible = Math.ceil(h / rowH);
    const per = 900 / speed; // ms por fila
    const elapsed = calm ? per * rowsVisible : (now - t0) % (per * (rowsVisible + 4));
    const done = Math.floor(elapsed / per);
    const frac = (elapsed % per) / per;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < rowsVisible; i++) {
      const y = h - (i + 1) * rowH;
      if (i < done) row(y, ROWS[i % ROWS.length], 1);
      else if (i === done) row(y, ROWS[i % ROWS.length], 1 - Math.pow(1 - frac, 2));
    }
    // Hilos de la urdimbre
    ctx.strokeStyle = "rgba(255,255,255,.07)";
    for (let x = 6; x < w; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    if (!calm) raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}

/** Inclinación 3D suave de tarjetas al pasar el mouse. */
export function tilt(root, selector = ".step, .kpi, .eco-c, .card-c") {
  if (matchMedia?.("(prefers-reduced-motion: reduce)").matches || matchMedia?.("(pointer: coarse)").matches) return () => {};
  const move = (e) => {
    const el = e.target.closest?.(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-3px)`;
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const leave = (e) => {
    const el = e.target.closest?.(selector);
    if (el && !el.contains(e.relatedTarget)) el.style.transform = "";
  };
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerout", leave);
  return () => {
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerout", leave);
  };
}
