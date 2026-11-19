// Monta el video de pitch de Awayu: tarjeta de entrada, diez escenas con rótulos e insignias,
// tarjeta final, voz boliviana sobre música propia y subtítulos quemados.
//   node pitch_montar.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";
import { renderSegment, assemble, duration } from "./edit.mjs";
import { SCENES } from "./pitch_guion.mjs";

const DIR = "pitch/work";
const CLIPS = "pitch/clips";
mkdirSync(DIR, { recursive: true });
const DUR = JSON.parse(readFileSync("pitch/voz/duraciones.json", "utf8"));
const PAD = 1.3; // margen tras cada narración
const XF = 0.5; // duración de cada transición
const GOLD = "0xffd166";
const FONT_B = "C\\:/Windows/Fonts/segoeuib.ttf";
const FONT = "C\\:/Windows/Fonts/segoeui.ttf";
const run = (args) => {
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error("ffmpeg falló");
};
const tf = (name, text) => { const f = `${DIR}/${name}.txt`; writeFileSync(f, text, "utf8"); return f.replace(/^([A-Za-z]):/, "$1\\:"); };

// Franja de aguayo: rectángulos con la paleta de Awayu
const PAL = ["0xd81b60", "0xf9c22e", "0x13a3b0", "0x1f9d55", "0xe8572a", "0x7b3fa0", "0xffd166", "0x2a6fdb"];
const band = (y, alphaExpr) => PAL.map((c, i) => `drawbox=x=${360 + i * 150}:y=${y}:w=150:h=14:color=${c}@1:t=fill:enable='gte(t,${(0.25 + i * 0.07).toFixed(2)})'`).join(",");

function card(name, src, from, len, lines) {
  const parts = [`trim=start=${from}:duration=${len}`, "setpts=PTS-STARTPTS", "fps=30", "scale=1920:1080", "boxblur=22:2", "eq=brightness=-0.32:saturation=0.8"];
  parts.push(band(640, ""));
  lines.forEach((l, i) => {
    const d = 0.2 + i * 0.25;
    parts.push(`drawtext=fontfile='${l.bold ? FONT_B : FONT}':textfile='${tf(`${name}_${i}`, l.text)}':fontsize=${l.size}:fontcolor=${l.color || "white"}:x=(w-tw)/2:y=${l.y}:alpha='min(1,max(0,(t-${d})/0.5))'`);
  });
  const out = `${DIR}/${name}.mp4`;
  run(["-i", src, "-vf", parts.join(","), "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-an", out]);
  return out;
}

// 1) Piezas: [clip, escena cuya voz empieza aquí o null]
const pieces = [];
pieces.push([card("intro", `${CLIPS}/s01_problema.mp4`, 0.3, 4.2, [
  { text: "Awayu", size: 170, y: 330, bold: true, color: GOLD },
  { text: "Finanzas comunitarias andinas en Stellar", size: 54, y: 540 },
  { text: "Hackatón Stellar Bolivia 2026", size: 34, y: 700, color: "0xdfd3ff" },
]), null]);

const lowerBase = { color: GOLD, lift: 120, hold: 6 };
for (const s of SCENES) {
  const need = DUR[s.id] + PAD;
  const src = `${CLIPS}/${s.id}.mp4`;
  const have = duration(src);
  const common = { src, lower: { ...lowerBase, ...s.lower }, badge: s.badge, badgeBg: GOLD, badgeFg: "0x1b1030" };
  if (s.id === "s09_acceso") {
    // billetera y ayuda con video; luego un salto al asistente
    pieces.push([renderSegment(DIR, "s09a", { ...common, from: 0.3, to: 12.4 }), s.id]);
    pieces.push([renderSegment(DIR, "s09b", { src, from: 14.0, to: 16.6, badge: s.badge, badgeBg: GOLD, badgeFg: "0x1b1030" }), null]);
    continue;
  }
  const to = Math.min(have - 0.05, 0.3 + need);
  const still = Math.max(0, 0.3 + need - to);
  pieces.push([renderSegment(DIR, s.id, { ...common, from: 0.3, to, still: still ? still.toFixed(2) : 0 }), s.id]);
}

pieces.push([card("outro", `${CLIPS}/s10_cierre.mp4`, 13.5, 5.2, [
  { text: "Awayu", size: 150, y: 300, bold: true, color: GOLD },
  { text: "El pasanaku que teje tu historial", size: 52, y: 490 },
  { text: "awayu-two.vercel.app", size: 46, y: 700, bold: true },
  { text: "github.com/luis19998/awayu-stellar · 5 contratos Soroban en testnet", size: 32, y: 775, color: "0xdfd3ff" },
]), null]);

// 2) Tiempos: cada pieza empieza donde termina la anterior menos la transición
const clips = pieces.map(([c]) => c);
const lens = clips.map(duration);
const starts = [];
let t = 0;
lens.forEach((len, i) => { starts.push(t); t += len - XF; });
const total = t + XF;
const voiceAt = {};
pieces.forEach(([, id], i) => { if (id) voiceAt[id] = starts[i] + (i ? XF : 0) + 0.15; });

// 3) Pista de audio: música propia baja + cada narración en su lugar
spawnSync(process.execPath, ["music.mjs", String(Math.ceil(total) + 2), `${DIR}/music.m4a`], { stdio: "inherit" });
const ins = ["-i", `${DIR}/music.m4a`];
const fl = ["[0:a]volume=0.20[m]"];
SCENES.forEach((s, k) => {
  ins.push("-i", `pitch/voz/${s.id}.mp3`);
  const ms = Math.round(voiceAt[s.id] * 1000);
  fl.push(`[${k + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=1.35[v${k}]`);
});
fl.push(`[m]${SCENES.map((_, k) => `[v${k}]`).join("")}amix=inputs=${SCENES.length + 1}:normalize=0:duration=first,atrim=duration=${(total + 0.5).toFixed(2)}[a]`);
run([...ins, "-filter_complex", fl.join(";"), "-map", "[a]", "-c:a", "aac", "-b:a", "192k", `${DIR}/audio.m4a`]);

// 4) Video unido con transiciones (assemble pone la pista de audio con fundidos)
const joined = `${DIR}/joined.mp4`;
assemble(clips, [{ t: "fade", d: XF }, { t: "smoothleft", d: XF }], joined, `${DIR}/audio.m4a`);

// 5) Subtítulos: los de cada escena, desplazados a su lugar
const toSec = (s) => { const [h, m, rest] = s.split(":"); return Number(h) * 3600 + Number(m) * 60 + Number(rest.replace(",", ".")); };
const fmt = (x) => { const ms = Math.round(x * 1000); const h = Math.floor(ms / 3600000); const m = Math.floor(ms / 60000) % 60; const s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
let n = 1; const srt = [];
for (const s of SCENES) {
  const blocks = readFileSync(`pitch/voz/${s.id}.srt`, "utf8").trim().split(/\r?\n\r?\n/);
  for (const b of blocks) {
    const lines = b.split(/\r?\n/);
    const [a, z] = lines[1].split(" --> ");
    const st = toSec(a) + voiceAt[s.id]; const en = Math.min(toSec(z) + voiceAt[s.id], st + 8);
    srt.push(`${n++}\n${fmt(st)} --> ${fmt(en - 0.04)}\n${lines.slice(2).join(" ")}\n`);
  }
}
writeFileSync(`${DIR}/subs.srt`, srt.join("\n"), "utf8");
writeFileSync("pitch/awayu-pitch.srt", srt.join("\n"), "utf8");

// 6) Final: subtítulos quemados abajo al centro, con caja oscura
const style = "FontName=Segoe UI Semibold,FontSize=15,PrimaryColour=&H00FFFFFF,BackColour=&H90180A1B,BorderStyle=4,Outline=0,Shadow=0,MarginV=22,MarginL=120,MarginR=120,WrapStyle=0";
// ffmpeg corre dentro de la carpeta de trabajo para que la ruta de subtítulos no lleve "C:"
const r6 = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-i", "joined.mp4", "-vf", `subtitles=subs.srt:force_style='${style}'`, "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", "../awayu-pitch.mp4"], { cwd: DIR, stdio: "inherit" });
if (r6.status !== 0) throw new Error("subtítulos fallaron");
copyFileSync(joined, "pitch/awayu-pitch-sin-subtitulos.mp4");
console.log("listo", total.toFixed(1), "s", JSON.stringify(Object.fromEntries(Object.entries(voiceAt).map(([k, v]) => [k, v.toFixed(1)]))));
