// Graba los mini tutoriales de Awayu (uno por tema) contra el servidor local y
// los deja en web/public/tutoriales/<tema>.webm con su póster .jpg.
//   node tutoriales.mjs [tema...]
import { startRecording } from "./rec.mjs";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const BASE = process.env.AWAYU_URL || "http://localhost:5180";
const OUT = "C:/Users/luisc/Documents/stellar-hackathon/web/public/tutoriales";
mkdirSync(OUT, { recursive: true });

const TOPICS = {
  billetera: async (r) => {
    await r.page.goto(BASE + "/#/inicio", { waitUntil: "load" });
    await r.sleep(1500);
    await r.click("#btn-wallet");
    await r.sleep(900);
    await r.move("#wallet-menu [data-w=freighter]", 700);
    await r.sleep(1600);
  },
  aportar: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4500);
    await r.click("#members li:nth-child(1)");
    await r.sleep(1500);
    await r.click("#btn-contribute");
    await r.sleep(3200);
  },
  pozo: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4500);
    await r.click("#btn-contribute");
    await r.page.waitForFunction(() => !document.querySelector("#btn-payout").disabled, null, { timeout: 30000 });
    await r.sleep(500);
    await r.click("#btn-payout");
    await r.sleep(3800);
  },
  garantia: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4500);
    await r.click("#members li:nth-child(1)");
    await r.sleep(1200);
    await r.click("#btn-guarantee");
    await r.sleep(1200);
    await r.move("#members li:nth-child(1) .chips", 700);
    await r.sleep(1500);
  },
  crear: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4000);
    await r.move("#btn-create", 700);
    await r.sleep(300);
    // En la grabación no hay billetera: se abre el formulario directamente para mostrarlo
    await r.page.evaluate(() => document.querySelector("#dlg-create").showModal());
    await r.sleep(600);
    await r.click("#form-create [name=cname]");
    await r.type("Pasanaku de la feria");
    await r.page.selectOption("#form-create [name=region]", "lpz");
    await r.sleep(500);
    await r.click("#form-create [name=members]");
    await r.type("GBDCBILQ35X6723YPFELR3BZWR7O7BVE7T4IO5XCS6VHHWDNDRHHENXX", 12);
    await r.sleep(500);
    await r.move("#btn-create-go", 700);
    await r.sleep(1400);
  },
  personalizar: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4000);
    await r.click("#btn-custom");
    await r.sleep(700);
    for (const [sel, val] of [["#sel-scenario", "uyuni"], ["#sel-vessel", "chanchito"], ["#sel-table", "sal"]]) {
      await r.move(sel, 500);
      await r.page.selectOption(sel, val);
      await r.page.dispatchEvent(sel, "change");
      await r.sleep(900);
    }
    await r.click("#form-custom button[value=cancel]");
    await r.sleep(2500);
    // Volver a la configuración original para las siguientes grabaciones
    await r.page.evaluate(() => localStorage.removeItem("awayu.skin"));
  },
  simulador: async (r) => {
    await r.page.goto(BASE + "/#/circulo", { waitUntil: "load" });
    await r.sleep(4000);
    await r.click("#btn-sim");
    await r.sleep(900);
    await r.click("#form-sim [name=members]");
    await r.page.keyboard.press("Control+A");
    await r.type("10", 120);
    await r.sleep(1600);
  },
  mapa: async (r) => {
    await r.page.goto(BASE + "/#/mapa", { waitUntil: "load" });
    await r.sleep(6000);
    await r.move("#map-list .card-c", 900);
    await r.sleep(1500);
  },
  pasaporte: async (r) => {
    await r.page.goto(BASE + "/#/billetera", { waitUntil: "load" });
    await r.sleep(5500);
    await r.move("#passport", 900);
    await r.sleep(1200);
  },
  amawta: async (r) => {
    await r.page.goto(BASE + "/#/amawta", { waitUntil: "load" });
    await r.sleep(1500);
    await r.click(".sugg button:nth-child(2)");
    await r.sleep(3000);
  },
};

// ---------- Tradiciones, probabilidades y juegos ----------
const go = async (r, hash, wait = 2500) => { await r.page.goto(BASE + "/#/" + hash, { waitUntil: "load" }); await r.page.mouse.move(500, 300); await r.sleep(wait); };
Object.assign(TOPICS, {
  "ayni-contribute": async (r) => {
    await r.move(".ayni-total", 800);
    await r.sleep(700);
    await r.click(".ayni-actions .ayni-btn:not(.secondary)");
    await r.sleep(1200);
    await r.move(".ayni-total", 700);
    await r.sleep(1500);
  },
  "ayni-request": async (r) => {
    await r.click(".ayni-actions .ayni-btn.secondary >> nth=0");
    await r.sleep(700);
    await r.click(".ayni-form textarea");
    await r.type("Arreglar el techo después de la granizada", 40);
    await r.click(".ayni-form input[type=number]");
    await r.type("12", 150);
    await r.sleep(400);
    await r.click(".ayni-form button[type=submit]");
    await r.sleep(1800);
  },
  "ayni-vote": async (r) => {
    await r.click("text=A favor >> nth=0");
    await r.sleep(1300);
    await r.move(".ayni-card .ayni-meter >> nth=0", 700);
    await r.sleep(1800);
  },
  "minka-fund": async (r) => {
    await r.click(".awayu-minka__actions form input");
    await r.page.keyboard.press("Control+A");
    await r.type("150", 150);
    await r.sleep(300);
    await r.click(".awayu-minka__actions form button[type=submit] >> nth=0");
    await r.sleep(1200);
    await r.move(".awayu-minka__timeline", 900);
    await r.sleep(1500);
  },
  "minka-milestone": async (r) => {
    // se completa la meta para que aparezca el formulario de avance
    await r.click(".awayu-minka__actions form input");
    await r.page.keyboard.press("Control+A");
    await r.type("480", 120);
    await r.click(".awayu-minka__actions form button[type=submit] >> nth=0");
    await r.sleep(1000);
    await r.click("form[data-action=evidence] input");
    await r.type("https://fotos.example/canal.jpg", 25);
    await r.click("form[data-action=evidence] button");
    await r.sleep(900);
    for (let i = 0; i < 2; i++) {
      const b = r.page.locator("[data-action=approve]");
      if (!(await b.count())) break;
      await r.click("[data-action=approve]");
      await r.sleep(900);
    }
    await r.move(".awayu-minka__step >> nth=0", 800);
    await r.sleep(1600);
  },
  "alasitas-create": async (r) => {
    await r.click(".awayu-alasitas__new");
    await r.sleep(500);
    await r.click(".awayu-alasitas__form [name=title]");
    await r.type("Mi tiendita en la feria", 45);
    await r.move(".awayu-alasitas__form [name=kind]", 500);
    await r.page.selectOption(".awayu-alasitas__form [name=kind]", "negocio");
    await r.click(".awayu-alasitas__form [name=target]");
    await r.page.keyboard.press("Control+A");
    await r.type("800", 140);
    await r.sleep(400);
    await r.click(".awayu-alasitas__form menu button[type=submit]");
    await r.sleep(600);
    await r.page.locator(".awayu-alasitas__stall").last().evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    await r.sleep(900);
    await r.move(".awayu-alasitas__stall >> nth=-1", 700);
    await r.sleep(1800);
  },
  "alasitas-save": async (r) => {
    await r.click(".awayu-alasitas__action >> nth=0");
    await r.sleep(500);
    await r.click(".awayu-alasitas__form [name=amount]");
    await r.page.keyboard.press("Control+A");
    await r.type("60", 150);
    await r.click(".awayu-alasitas__form menu button[type=submit]");
    await r.sleep(1200);
    await r.move(".awayu-alasitas__bar >> nth=0", 700);
    await r.sleep(1500);
  },
  "live-mode": async (r) => {
    await r.move("#mode-switch", 800);
    await r.sleep(400);
    await r.click("#mode-switch [data-m=testnet]");
    await r.page.waitForSelector(".ayni-card", { timeout: 20000 }).catch(() => {});
    await r.sleep(1500);
    await r.move(".ayni-card >> nth=1", 900);
    await r.sleep(1500);
  },
  risk: async (r) => {
    await r.click("a[href='#/riesgo']");
    await r.sleep(2200);
    await r.move("#risk", 800);
    await r.sleep(700);
    await r.move("#risk .rel >> nth=0", 800);
    await r.sleep(1600);
  },
  games: async (r) => {
    await r.click("button[data-g=ruleta]");
    await r.sleep(1000);
    await r.click(".aw-game-draw");
    await r.sleep(1600);
    await r.click(".aw-game-draw");
    await r.sleep(1600);
    await r.click("button[data-g=quiz]");
    await r.sleep(1400);
  },
});

const PRE = {
  "ayni-contribute": ["ayni", 2500],
  "ayni-request": ["ayni", 2500],
  "ayni-vote": ["ayni", 2500],
  "minka-fund": ["minka", 2500],
  "minka-milestone": ["minka", 2500],
  "alasitas-create": ["alasitas", 3500],
  "alasitas-save": ["alasitas", 3500],
  "live-mode": ["ayni", 2500],
  "risk": ["circulo", 4500],
  "games": ["juegos", 2000],
};
const pick = process.argv.slice(2);
for (const [id, fn] of Object.entries(TOPICS)) {
  if (pick.length && !pick.includes(id)) continue;
  const rec = await startRecording(id, { width: 1100, height: 660, scale: 1, out: "." });
  await rec.page.goto(BASE + "/#/inicio", { waitUntil: "load" });
  await rec.page.evaluate(() => {
    try {
      localStorage.setItem("awayu.lang", "es");
      localStorage.removeItem("awayu.skin");
      localStorage.setItem("awayu.sound.muted", "true");
      localStorage.setItem("awayu.guide.tour.seen.firstVisit", "1");
    } catch {}
  });
  // Los temas nuevos empiezan ya dentro de su sección
  if (PRE[id]) await go(rec, PRE[id][0], PRE[id][1]);
  await rec.begin();
  try {
    await fn(rec);
  } catch (e) {
    console.error(id, "falló:", e.message);
  }
  const mp4 = `./${id}.mp4`;
  const info = await rec.end(mp4);
  // WebM liviano para la web (sin audio) y un póster
  spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-i", mp4, "-vf", "fps=24,scale=720:-2:flags=lanczos", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "42", "-row-mt", "1", "-an", `${OUT}/${id}.webm`], { stdio: "inherit" });
  spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-sseof", "-1.2", "-i", mp4, "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "5", `${OUT}/${id}.jpg`], { stdio: "inherit" });
  rmSync(mp4, { force: true });
  console.log(id, `${info.seconds.toFixed(1)} s`, `${Math.round(statSync(`${OUT}/${id}.webm`).size / 1024)} kB`);
}
