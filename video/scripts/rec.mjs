// Screen recorder for the demo videos: drives Chrome with Playwright, shows a visible cursor with a click ripple,
// moves the mouse along eased paths, scrolls smoothly and captures frames with the DevTools screencast. The frames
// become a constant 30 fps H.264 video with ffmpeg.
import { chromium } from "playwright-core";
import { mkdirSync, rmSync, writeFileSync, writeFileSync as w } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const CURSOR = `
(() => {
  if (window.__cursor) return;
  const make = () => {
    const c = document.createElement("div");
    c.id = "__cursor";
    c.style.cssText = "position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transform:translate(-4px,-3px);transition:none";
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l15 9.5-6.5 1.3 3.9 7.6-3 1.5-3.9-7.7L4 18.8z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    const style = document.createElement("style");
    style.textContent = "@keyframes __rip{from{transform:translate(-50%,-50%) scale(.2);opacity:.9}to{transform:translate(-50%,-50%) scale(2.6);opacity:0}}.__rip{position:fixed;width:46px;height:46px;border-radius:50%;border:3px solid #ffd23f;background:rgba(255,210,63,.25);z-index:2147483646;pointer-events:none;animation:__rip .55s ease-out forwards}";
    document.documentElement.appendChild(style);
    window.__cursor = c;
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => { const r = document.createElement("div"); r.className = "__rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 700); }, true);
  };
  if (document.documentElement) make(); else addEventListener("DOMContentLoaded", make);
})();`;

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export async function startRecording(name, { width = 1440, height = 810, scale = 4 / 3, out = ".", geo = { latitude: -17.39, longitude: -66.16 } } = {}) {
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);
  const dir = join(out, `${name}_frames`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome", headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-color-profile=srgb"],
  });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, locale: "es-BO", timezoneId: "America/La_Paz", geolocation: geo, permissions: ["geolocation"] });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const frames = [];
  let n = 0;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = join(dir, `${String(n++).padStart(6, "0")}.jpg`);
    w(file, Buffer.from(data, "base64"));
    frames.push({ file, t: metadata.timestamp });
    try { await cdp.send("Page.screencastFrameAck", { sessionId }); } catch { /* closing */ }
  });
  let mouse = { x: width / 2, y: height / 2 };
  const rec = {
    page, browser, context, width, height,
    async begin() { await cdp.send("Page.startScreencast", { format: "jpeg", quality: 84, maxWidth: outW, maxHeight: outH, everyNthFrame: 2 }); },
    sleep,
    /** eased mouse path to a point or to the centre of an element */
    async move(target, ms = 700) {
      let x;
      let y;
      if (typeof target === "string") {
        const box = await page.locator(target).first().boundingBox({ timeout: 20000 });
        if (!box) throw new Error(`no box for ${target}`);
        x = box.x + box.width / 2;
        y = box.y + box.height / 2;
      } else ({ x, y } = target);
      const from = { ...mouse };
      const steps = Math.max(8, Math.round(ms / 16));
      for (let i = 1; i <= steps; i++) {
        const k = ease(i / steps);
        await page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k);
        await sleep(ms / steps);
      }
      mouse = { x, y };
    },
    async click(target, { ms = 700, pause = 250 } = {}) {
      if (typeof target !== "string") {
        await rec.move(target, ms);
        await sleep(pause);
        await page.mouse.down();
        await sleep(70);
        await page.mouse.up();
        return;
      }
      // the visible cursor travels to the element; the real click waits until the element is still and ready
      const loc = page.locator(target).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 15000 }).catch(() => {});
      await sleep(250);
      await rec.move(target, ms);
      await sleep(pause);
      // a busy 3D page can keep Playwright waiting for stability: after a short try, click directly
      await loc.click({ timeout: 2500 }).catch(() => loc.click({ force: true, timeout: 15000 }));
      const box = await loc.boundingBox({ timeout: 2000 }).catch(() => null);
      if (box) mouse = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    },
    async type(text, delay = 55) { await page.keyboard.type(text, { delay }); },
    /** smooth scroll by a number of pixels, animated in the page (the wheel would zoom a 3D view under the cursor) */
    async scroll(dy, ms = 1400) {
      await page.evaluate(([d, t]) => new Promise((done) => {
        const from = window.scrollY;
        const start = performance.now();
        const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
        const step = (now) => {
          const k = Math.min(1, (now - start) / t);
          window.scrollTo(0, from + d * ease(k));
          if (k < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      }), [dy, ms]);
    },
    async scrollTo(selector, offset = 120, ms = 1400) {
      const y = await page.evaluate(([s, o]) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top - o : 0; }, [selector, offset]);
      await rec.scroll(y, ms);
    },
    /** stop and build the video: constant 30 fps from the timestamped frames */
    async end(file) {
      await sleep(400);
      await cdp.send("Page.stopScreencast").catch(() => {});
      await sleep(300);
      await browser.close();
      const list = frames.map((f, i) => {
        const next = frames[i + 1] ? frames[i + 1].t : f.t + 1 / 30;
        return `file '${resolve(f.file).replace(/\\/g, "/")}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
      });
      list.push(`file '${resolve(frames[frames.length - 1].file).replace(/\\/g, "/")}'`);
      const listFile = join(dir, "list.txt");
      writeFileSync(listFile, list.join("\n"));
      const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile,
        "-vf", `fps=30,scale=${outW}:${outH}:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart", file], { stdio: "inherit" });
      if (r.status !== 0) throw new Error("ffmpeg falló");
      rmSync(dir, { recursive: true, force: true });
      return { frames: frames.length, seconds: frames.length ? frames[frames.length - 1].t - frames[0].t : 0 };
    },
  };
  return rec;
}
