import { markTexture } from "./aguayo.js";

const WIDTH = 1080;
const HEIGHT = 1350;
const INK = "#241b23";
const MUTED = "#675d61";
const CREAM = "#f8f0df";
const RED = "#a3122a";
const GOLD = "#9b6b14";

export const MARK_LEGEND = [
  { mark: 1, label: "A tiempo", color: "#1f9d55" },
  { mark: 2, label: "Tarde", color: "#f57c1f" },
  { mark: 3, label: "Faltó", color: "#a3122a" },
  { mark: 4, label: "Cubierto por garantía", color: "#9b6b14" },
];

export function certificateData({ name, history = [], score, circleId, token, amount, date }) {
  return {
    name: String(name || "Integrante"),
    history: Array.isArray(history) ? history : [],
    score: Number.isFinite(Number(score)) ? Number(score) : 0,
    circleId: circleId ? String(circleId) : "",
    token: String(token || ""),
    amount: amount === undefined || amount === null ? "" : String(amount),
    date: date ? new Date(date) : new Date(),
  };
}

function setFont(ctx, size, weight = 400, family = "Georgia, serif") {
  ctx.font = `${weight} ${size}px ${family}`;
}

function drawText(ctx, text, x, y, { size = 30, color = INK, weight = 400, align = "left", family } = {}) {
  setFont(ctx, size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function formatDate(date) {
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "long" }).format(date);
}

/** Crea el PNG del certificado y resuelve con el canvas terminado. */
export function certificateCanvas(opts) {
  const data = certificateData(opts);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas del certificado.");

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, WIDTH - 68, HEIGHT - 68);
  ctx.strokeStyle = "#d7b77b";
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);

  drawText(ctx, "AWAYU", WIDTH / 2, 112, { size: 30, weight: 700, align: "center", family: "Arial, sans-serif", color: RED });
  drawText(ctx, "Certificado de aguayo", WIDTH / 2, 186, { size: 56, weight: 700, align: "center" });
  ctx.fillStyle = GOLD;
  ctx.fillRect(350, 218, 380, 3);
  drawText(ctx, "Evidencia tejida de participación y cumplimiento", WIDTH / 2, 264, { size: 24, align: "center", color: MUTED });

  drawText(ctx, data.name, WIDTH / 2, 365, { size: 52, weight: 700, align: "center" });
  drawText(ctx, "HISTORIAL DE RONDAS", 100, 438, { size: 18, weight: 700, family: "Arial, sans-serif", color: MUTED });
  ctx.fillStyle = "#e5d9c3";
  ctx.fillRect(100, 464, 880, 112);
  if (data.history.length) {
    const cellWidth = 880 / data.history.length;
    data.history.forEach((mark, index) => {
      const texture = markTexture(mark, index);
      ctx.drawImage(texture.image, 100 + index * cellWidth, 464, Math.max(2, cellWidth - 2), 112);
      texture.dispose();
    });
  } else {
    drawText(ctx, "Sin marcas registradas", WIDTH / 2, 530, { size: 24, align: "center", color: MUTED });
  }

  ctx.fillStyle = "#eee2cc";
  ctx.fillRect(100, 620, 410, 160);
  ctx.fillRect(570, 620, 410, 160);
  drawText(ctx, "PUNTAJE", 140, 664, { size: 18, weight: 700, family: "Arial, sans-serif", color: MUTED });
  drawText(ctx, `${data.score} / 100`, 140, 738, { size: 52, weight: 700, color: RED });
  drawText(ctx, "RONDAS", 610, 664, { size: 18, weight: 700, family: "Arial, sans-serif", color: MUTED });
  drawText(ctx, String(data.history.length), 610, 738, { size: 52, weight: 700, color: RED });

  drawText(ctx, "LEYENDA DE MARCAS", 100, 840, { size: 18, weight: 700, family: "Arial, sans-serif", color: MUTED });
  MARK_LEGEND.forEach(({ mark, label, color }, index) => {
    const x = index % 2 === 0 ? 105 : 560;
    const y = 890 + Math.floor(index / 2) * 58;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 14, y - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, String(mark), x + 14, y - 2, { size: 16, weight: 700, color: "#fff", align: "center", family: "Arial, sans-serif" });
    drawText(ctx, label, x + 42, y, { size: 22, color: INK });
  });

  const details = [data.token && data.amount ? `Aporte: ${data.amount} ${data.token}` : "", formatDate(data.date)].filter(Boolean).join("  ·  ");
  if (details) drawText(ctx, details, WIDTH / 2, 1038, { size: 20, align: "center", color: MUTED });
  if (data.circleId) {
    drawText(ctx, "ID DEL CONTRATO", 100, 1100, { size: 15, weight: 700, family: "Arial, sans-serif", color: MUTED });
    drawText(ctx, data.circleId, 100, 1132, { size: 16, color: INK, family: "monospace" });
  }

  ctx.fillStyle = RED;
  ctx.fillRect(100, 1182, 880, 2);
  drawText(ctx, "Evidencia de pagos verificable en Stellar; no es una aprobación de crédito", WIDTH / 2, 1228, { size: 19, align: "center", color: INK });
  drawText(ctx, "AWAYU · PASANAKU ROTATIVO", WIDTH / 2, 1288, { size: 15, weight: 700, align: "center", family: "Arial, sans-serif", color: MUTED });
  return canvas;
}

export async function downloadCertificate(opts) {
  const canvas = await certificateCanvas(opts);
  const link = document.createElement("a");
  const safeName = String(opts.name || "integrante").normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  link.download = `awayu-certificado-${safeName || "integrante"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
