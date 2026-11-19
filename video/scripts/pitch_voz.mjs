// Genera la voz de cada escena con edge-tts (voz boliviana) y guarda sus duraciones.
//   node pitch_voz.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { SCENES, VOICE, RATE } from "./pitch_guion.mjs";
import { duration } from "./edit.mjs";

const DIR = "pitch/voz";
mkdirSync(DIR, { recursive: true });
const out = {};
for (const s of SCENES) {
  const mp3 = `${DIR}/${s.id}.mp3`;
  const r = spawnSync("edge-tts", ["--voice", VOICE, `--rate=${RATE}`, "--text", s.text, "--write-media", mp3, "--write-subtitles", `${DIR}/${s.id}.srt`], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${s.id}: ${r.stderr}`);
  out[s.id] = duration(mp3);
  console.log(s.id, out[s.id].toFixed(2), "s");
}
writeFileSync(`${DIR}/duraciones.json`, JSON.stringify(out, null, 2));
console.log("total", Object.values(out).reduce((a, b) => a + b, 0).toFixed(1), "s");
