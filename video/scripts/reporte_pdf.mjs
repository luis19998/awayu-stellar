// Guarda docs/ejemplo-reporte-historial.pdf: el reporte para cooperativas de una
// cuenta de la evidencia (Bruno: una ronda a tiempo y otra cubierta por su garantía).
//   node reporte_pdf.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";

const ROOT = "C:/Users/luisc/Documents/stellar-hackathon";
const BASE = process.env.AWAYU_URL || "https://awayu-two.vercel.app";
const ev = JSON.parse(fs.readFileSync(`${ROOT}/web/public/evidencia.json`, "utf8"));
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 900, height: 1200 }, locale: "es-BO", timezoneId: "America/La_Paz" });
await p.goto(`${BASE}/reporte.html?m=${ev.accounts.Bruno}`, { waitUntil: "networkidle" });
await p.waitForSelector(".r-circle", { timeout: 60000 });
await p.pdf({ path: `${ROOT}/docs/ejemplo-reporte-historial.pdf`, format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
await b.close();
console.log("PDF del reporte listo");
