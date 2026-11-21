// Convierte docs/pitch/deck.html en docs/pitch/Awayu-pitch-deck.pdf, con las
// cifras de web/public/metricas.json y evidencia.json.
//   node deck_pdf.mjs   (necesita playwright-core y Chrome o Edge instalado)
import { chromium } from "playwright-core";
import fs from "node:fs";

const ROOT = "C:/Users/luisc/Documents/stellar-hackathon";
const met = JSON.parse(fs.readFileSync(`${ROOT}/web/public/metricas.json`, "utf8"));
const ev = JSON.parse(fs.readFileSync(`${ROOT}/web/public/evidencia.json`, "utf8"));
const html = fs.readFileSync(`${ROOT}/docs/pitch/deck.html`, "utf8")
  .replaceAll("%INV%", String(met.invocations)).replaceAll("%ERR%", String(met.errors))
  .replaceAll("%TX%", String(ev.steps.length)).replaceAll("%ACC%", String(met.distinctAccounts));
const browser = await chromium.launch({ channel: "msedge" }).catch(() => chromium.launch({ channel: "chrome" }));
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({ path: `${ROOT}/docs/pitch/Awayu-pitch-deck.pdf`, width: "1280px", height: "720px", printBackground: true });
await page.screenshot({ path: `${ROOT}/docs/pitch/portada.png` });
await browser.close();
console.log("PDF listo");
