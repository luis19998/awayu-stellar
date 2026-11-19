// Graba las escenas del pitch de Awayu contra el sitio publicado, cada una al menos
// tan larga como su narración (más un margen), a 1920x1080.
//   node pitch_grabar.mjs [escena...]
import { readFileSync, mkdirSync } from "node:fs";
import { startRecording } from "./rec.mjs";

const BASE = process.env.AWAYU_URL || "https://awayu-two.vercel.app";
const OUT = "pitch/clips";
mkdirSync(OUT, { recursive: true });
const DUR = JSON.parse(readFileSync("pitch/voz/duraciones.json", "utf8"));
const PAD = 2.2;

// Deja la página lista (idioma, sin recorrido de bienvenida, sin sonido) antes de grabar
async function prep(r, hash, wait = 3500) {
  await r.page.goto(BASE + "/#/inicio", { waitUntil: "load" });
  await r.page.evaluate(() => {
    try {
      localStorage.setItem("awayu.lang", "es");
      localStorage.removeItem("awayu.skin");
      localStorage.setItem("awayu.sound.muted", "true");
      localStorage.setItem("awayu.guide.tour.seen.firstVisit", "1");
    } catch {}
  });
  await r.page.goto(BASE + "/#/" + hash, { waitUntil: "load" });
  await r.page.mouse.move(700, 400); // dispara la carga diferida
  await r.sleep(wait);
}
// El panel desplaza #view, no la ventana: animamos su scrollTop
async function sv(r, selector, offset = 90, ms = 1800) {
  await r.page.evaluate(([sel, o, t]) => new Promise((done) => {
    const v = document.querySelector("#view"); const el = document.querySelector(sel);
    if (!v || !el) return done();
    const from = v.scrollTop; const to = from + el.getBoundingClientRect().top - v.getBoundingClientRect().top - o;
    const start = performance.now(); const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
    const step = (now) => { const k = Math.min(1, (now - start) / t); v.scrollTop = from + (to - from) * ease(k); if (k < 1) requestAnimationFrame(step); else done(); };
    requestAnimationFrame(step);
  }), [selector, offset, ms]);
}
const live = async (r) => {
  await r.page.getByRole("button", { name: "Testnet en vivo" }).click();
  await r.page.waitForTimeout(400);
};

const SCENES = {
  s01_problema: { hash: "inicio", run: async (r) => {
    await r.move({ x: 520, y: 470 }, 1500);
    await r.sleep(5500);
    await sv(r, ".traditions", 40, 4500);
  } },
  s02_solucion: { hash: "inicio", before: async (r) => { await sv(r, ".traditions", 40, 10); await r.sleep(1500); },
    run: async (r) => {
      for (const n of [1, 2, 3, 4]) { await r.move(`.trad:nth-child(${n})`, 800); await r.sleep(1500); }
      await sv(r, ".traditions + section", 40, 2500);
    } },
  s03_pasanaku: { hash: "circulo", wait: 6500, run: async (r) => {
    await r.sleep(1500);
    await r.click("#members li:nth-child(1)");
    await r.sleep(1500);
    await r.click("#btn-contribute");
    await r.sleep(3500);
    await r.click("#btn-guarantee");
    await r.sleep(1500);
    await r.move("#members li:nth-child(1) .chips", 800);
    await r.sleep(2000);
    await r.move(".legend", 900);
  } },
  s04_personalizar: { hash: "circulo", wait: 6500, run: async (r) => {
    await r.click("#btn-custom");
    await r.sleep(600);
    for (const val of ["uyuni", "titicaca"]) {
      await r.move("#sel-scenario", 500);
      await r.page.selectOption("#sel-scenario", val);
      await r.page.dispatchEvent("#sel-scenario", "change");
      await r.sleep(1800);
    }
    await r.click("#form-custom button[value=cancel]");
    await r.move({ x: 560, y: 420 }, 1200);
  } },
  s05_ayni: { hash: "ayni", run: async (r) => {
    await r.sleep(800);
    await r.click("text=Testnet en vivo");
    await r.page.waitForSelector(".ayni-card", { timeout: 20000 }).catch(() => {});
    await r.sleep(1500);
    await sv(r, ".ayni-grid", 260, 2200);
    await r.move(".ayni-card:nth-child(2)", 900);
    await r.sleep(2500);
    await r.move(".ayni-card:nth-child(1)", 900);
  } },
  s06_minka: { hash: "minka", before: async (r) => { await live(r); await r.page.waitForSelector(".awayu-minka__meta", { timeout: 20000 }).catch(() => {}); await r.sleep(4000); },
    run: async (r) => {
      await r.sleep(1200);
      await sv(r, ".mode-box", 30, 1800);
      await r.move("text=Compra de tubos y aspersores", 900);
      await r.sleep(2200);
      await r.move("text=Instalación en las parcelas", 900);
    } },
  s07_alasitas: { hash: "alasitas", before: async (r) => { await live(r); await r.sleep(6000); },
    run: async (r) => {
      await sv(r, ".mode-box", 30, 1600);
      await r.move("text=Mi casita en El Alto", 900);
      await r.sleep(2200);
      await r.move("text=Viaje al salar de Uyuni", 900);
    } },
  s08_red: { hash: "mapa", wait: 6500, run: async (r) => {
    await r.sleep(1000);
    await r.move("#map-list .card-c", 900);
    await r.sleep(2500);
    await r.page.evaluate(() => { location.hash = "#/billetera"; });
    await r.sleep(4200);
    await r.move("#passport", 900);
  } },
  s09_acceso: { hash: "inicio", run: async (r) => {
    await r.click("#btn-wallet");
    await r.sleep(800);
    await r.move("#wallet-menu [data-w=freighter]", 700);
    await r.sleep(1600);
    await r.click("#btn-wallet");
    await r.sleep(400);
    await r.click("#help-fab");
    await r.sleep(800);
    await r.click("#help-menu [data-topic=contribute]");
    await r.sleep(4200);
    await r.page.keyboard.press("Escape");
    await r.page.evaluate(() => { location.hash = "#/amawta"; });
    await r.sleep(1200);
    await r.click(".sugg button:nth-child(2)");
    await r.sleep(3500);
  } },
  s10_cierre: { hash: "inicio", url: "https://github.com/luis19998/awayu-stellar#readme", run: async (r) => {
    await r.sleep(1200);
    await r.scrollTo("article.markdown-body table", 140, 2500);
    await r.move("article.markdown-body table tr:nth-child(3)", 900);
    await r.sleep(3500);
    await r.page.goto(BASE + "/#/inicio", { waitUntil: "load" });
    await r.page.mouse.move(700, 400);
    await r.sleep(2000);
    await r.sleep(2500);
    await r.move("text=Entrar al círculo 3D", 1200);
  } },
};

const only = process.argv.slice(2);
for (const [id, sc] of Object.entries(SCENES)) {
  if (only.length && !only.includes(id)) continue;
  const target = (DUR[id] + PAD) * 1000;
  const r = await startRecording(id, { out: OUT });
  await prep(r, sc.hash, sc.wait);
  if (sc.url) { await r.page.goto(sc.url, { waitUntil: "load" }); await r.sleep(1500); }
  if (sc.before) await sc.before(r);
  await r.begin();
  const t0 = Date.now();
  try { await sc.run(r); } catch (e) { console.error(id, "paso falló:", e.message.split("\n")[0]); }
  const left = target - (Date.now() - t0);
  if (left > 0) await r.sleep(left);
  const info = await r.end(`${OUT}/${id}.mp4`);
  console.log(id, `${info.seconds.toFixed(1)} s grabados, objetivo ${(target / 1000).toFixed(1)} s`);
}
