// An original ambient music bed (no copyright): four chords of 4 s, a soft pulse and an arpeggio, made with ffmpeg.
//   node music.mjs <seconds> <out.m4a>
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const seconds = Number(process.argv[2] || 180);
const out = process.argv[3] || "music.m4a";
const CHORDS = [
  [110, 164.81, 196, 246.94, 261.63], // Am9
  [87.31, 130.81, 164.81, 220, 261.63], // Fmaj7
  [130.81, 196, 246.94, 329.63, 392], // Cmaj7
  [98, 146.83, 164.81, 246.94, 293.66], // G6
];
const pick = (fn) => CHORDS.map((c, k) => [k, fn(c)]).reduceRight((acc, [k, v]) => `if(eq(mod(floor(t/4),4),${k}),${v},${acc})`, "0");
// pad: each chord tone with a slightly detuned twin, breathing over the 4 s of the chord
const pad = [0, 1, 2, 3, 4].map((i) => `(sin(2*PI*${pick((c) => c[i])}*t)+sin(2*PI*${pick((c) => c[i] * 1.004)}*t))`).join("+");
const env = "pow(sin(PI*mod(t,4)/4),0.45)";
const bass = `0.30*sin(2*PI*${pick((c) => c[0] / 2)}*t)*exp(-7*mod(t,1))`;
const arp = `0.07*sin(2*PI*${CHORDS.map((c, k) => [k, c]).reduceRight((acc, [k, c]) => `if(eq(mod(floor(t/4),4),${k}),${[1, 2, 3, 4, 3, 2, 4, 1].reduceRight((a, n, j) => `if(eq(mod(floor(t*2),8),${j}),${c[n] * 2},${a})`, "0")},${acc})`, "0")}*t)*exp(-5*mod(t,0.5))`;
const intro = `min(1,t/6)`; // the pulse and arpeggio come in slowly
const expr = `0.035*${env}*(${pad})+${intro}*(${bass}+${arp})`;
const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=44100:d=${seconds}`,
  "-af", `lowpass=f=5200,aecho=0.8:0.6:120|240:0.25|0.15,afade=t=in:d=3,afade=t=out:st=${seconds - 4}:d=4,volume=1.6,aformat=channel_layouts=stereo`,
  "-c:a", "aac", "-b:a", "192k", out], { stdio: "inherit" });
console.log(r.status === 0 ? `ok ${out}` : "falló");
