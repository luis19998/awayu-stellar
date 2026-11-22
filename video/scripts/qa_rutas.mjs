// Recorrido de QA: cada ruta en escritorio y celular, en español e inglés.
// Junta errores de consola, de página y de red, desbordes horizontales en celular
// y textos que quedan en español cuando el idioma es inglés.
//   AWAYU_URL=https://awayu-two.vercel.app node qa_rutas.mjs > qa.json
import { chromium } from "playwright-core";

const BASE = process.env.AWAYU_URL || "https://awayu-two.vercel.app";
const ROUTES = (process.env.RUTAS || "inicio,circulo,latam,ayni,minka,alasitas,mapa,billetera,riesgo,verificar,amawta,ecosistema,pulso,legal").split(",");
const LANGS = (process.env.IDIOMAS || "es,en").split(",");
// Palabras muy españolas que no deberían aparecer con la interfaz en inglés
const ES = /\b(el|los|las|del|una|para|tu|tus|cuota|ronda|aportar|círculo|billetera|garantía|miembros|conectar|crear|pozo|cómo|qué|también|ahorro|ayuda)\b/gi;
const ALLOW = /pasanaku|ayni|minka|alasitas|aguayo|amawta|awayu|stellar|soroban|pollar|vaquita|freighter|usdc|xlm|cochabamba|la paz|santa cruz|el alto|bolivia|uyuni|titicaca|wayuu|natillera|tanda|cundina|cuchubal|junta|pandero|cadena|caixinha|consórcio|san\b|sol\b/i;

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = [];
for (const lang of LANGS) {
  for (const [vw, vh, dev] of [[1366, 800, "escritorio"], [390, 844, "celular"]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, locale: lang === "en" ? "en-US" : "es-BO" });
    await ctx.addInitScript((l) => {
      try {
        localStorage.setItem("awayu.lang", l);
        localStorage.setItem("awayu.guide.welcome.seen", "1");
        localStorage.setItem("awayu.guide.tour.seen.firstVisit", "1");
        localStorage.setItem("awayu.proactive.muted", "1");
        localStorage.setItem("awayu.sound.muted", "true");
      } catch {}
    }, lang);
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      const errors = [];
      const onConsole = (m) => { if (m.type() === "error") errors.push("consola: " + m.text().slice(0, 180)); };
      const onPageError = (e) => errors.push("página: " + String(e.message).slice(0, 180));
      const onFail = (r) => { const u = r.url(); if (!/google-analytics|fonts\.g|favicon/.test(u)) errors.push("red: " + (r.failure()?.errorText || "") + " " + u.slice(0, 120)); };
      const onResp = (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`http ${r.status()}: ${r.url().slice(0, 120)}`); };
      page.on("console", onConsole); page.on("pageerror", onPageError); page.on("requestfailed", onFail); page.on("response", onResp);
      let overflow = 0, spanish = [], title = "";
      try {
        await page.goto(`${BASE}/#/${route}`, { waitUntil: "load", timeout: 45000 });
        await page.mouse.move(200, 200);
        await page.waitForTimeout(route === "circulo" ? 7000 : 4500);
        const info = await page.evaluate(([esSrc, allowSrc, l]) => {
          const doc = document.documentElement;
          const res = { overflow: Math.max(0, doc.scrollWidth - innerWidth), title: document.querySelector("#view h1, .pane h1, h1")?.textContent?.trim()?.slice(0, 60) || "", spanish: [] };
          if (l !== "es") {
            const es = new RegExp(esSrc, "gi"), allow = new RegExp(allowSrc, "i");
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const seen = new Set();
            while (walker.nextNode()) {
              const n = walker.currentNode, el = n.parentElement;
              if (!el || el.closest("script,style,code,.aw-w-langs,#sel-lang,[hidden]") || !el.offsetParent) continue;
              const s = n.textContent.replace(/\s+/g, " ").trim();
              if (s.length < 4 || seen.has(s) || allow.test(s) && s.split(" ").length < 4) continue;
              const hits = s.match(es);
              if (hits && hits.length >= 2) { seen.add(s); res.spanish.push(s.slice(0, 90)); }
            }
            res.spanish = res.spanish.slice(0, 12);
          }
          return res;
        }, [ES.source, ALLOW.source, lang]);
        overflow = info.overflow; spanish = info.spanish; title = info.title;
      } catch (e) { errors.push("navegación: " + e.message.slice(0, 120)); }
      page.off("console", onConsole); page.off("pageerror", onPageError); page.off("requestfailed", onFail); page.off("response", onResp);
      out.push({ lang, dev, route, title, overflow, errors: [...new Set(errors)].slice(0, 8), spanish });
      process.stderr.write(`${lang} ${dev} ${route}: ${errors.length} err, desborde ${overflow}, es ${spanish.length}\n`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
