// Video editing engine on ffmpeg: renders each segment (cut, speed, punch-in zoom, lower third, chapter badge, colour),
// split screens and picture-in-picture, then joins everything with xfade transitions and lays the music under it.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";

export const W = 1920;
export const H = 1080;
const FONT_B = "C\\:/Windows/Fonts/segoeuib.ttf";
const FONT = "C\\:/Windows/Fonts/segoeui.ttf";
const ENC = ["-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-an"];

function run(args) {
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`ffmpeg falló: ${args.slice(-1)}`);
}
export function duration(file) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

let textN = 0;
function textFile(dir, text) {
  const f = join(dir, `t${textN++}.txt`).replace(/\\/g, "/");
  writeFileSync(f, text, "utf8");
  return f.replace(/^([A-Za-z]):/, "$1\\:");
}
/** a lower third: title and subtitle slide in from the left with a box, and leave before the end */
function lowerThird(dir, { title, sub, color = "0x8ef06a", lift = 0, hold = 0 }, len) {
  const out = hold ? Math.min(hold, Math.max(1.2, len - 0.7)) : Math.max(1.2, len - 0.7);
  const slide = (y, delay) => `x='if(lt(t,${delay}),-w,if(lt(t,${delay}+0.55),-w+(w+72)*(1-pow(1-(t-${delay})/0.55,3)),if(gt(t,${out}),72-(w+72)*pow((t-${out})/0.5,2),72)))':y=${y}`;
  const parts = [`drawbox=x=0:y=ih-190-${lift}:w=8:h=110:color=${color}@0.95:t=fill:enable='between(t,0.15,${out + 0.5})'`];
  parts.push(`drawtext=fontfile='${FONT_B}':textfile='${textFile(dir, title)}':fontsize=50:fontcolor=white:box=1:boxcolor=0x050a18@0.78:boxborderw=18:${slide(`h-180-${lift}`, 0.15)}`);
  if (sub) parts.push(`drawtext=fontfile='${FONT}':textfile='${textFile(dir, sub)}':fontsize=30:fontcolor=0xdfe8ff:box=1:boxcolor=0x050a18@0.7:boxborderw=12:${slide(`h-102-${lift}`, 0.35)}`);
  return parts;
}
function chapterBadge(dir, label, bg = "0x8ef06a", fg = "0x0b1a05") {
  return [`drawtext=fontfile='${FONT_B}':textfile='${textFile(dir, label)}':fontsize=28:fontcolor=${fg}:box=1:boxcolor=${bg}@0.95:boxborderw=12:x=w-tw-48:y=40:alpha='min(1,t/0.4)'`];
}

/**
 * Render one segment to its own clip.
 * seg: { src, from, to, speed=1, zoom: { at, len, z, x, y } (relative to the segment, output seconds; x,y in 0..1),
 *        lower: { title, sub }, badge, grade=true, still: secs (freeze last frame) }
 */
export function renderSegment(dir, name, seg) {
  mkdirSync(dir, { recursive: true });
  const speed = seg.speed || 1;
  const len = (seg.to - seg.from) / speed;
  const f = [`setpts=(PTS-STARTPTS)/${speed}`, "fps=30", `scale=${W}:${H}:flags=lanczos`];
  if (seg.zoom) {
    const { at, len: zl, z = 1.25, x = 0.5, y = 0.5 } = seg.zoom;
    // ease in, hold, ease out: z(t) between 1 and z
    const k = `min(1,max(0,min((it-${at})/0.7,(${at + zl}-it)/0.7)))`;
    const zz = `(1+${z - 1}*(${k})*(${k})*(3-2*(${k})))`;
    f.push(`zoompan=z='${zz}':x='(iw-iw/zoom)*${x}':y='(ih-ih/zoom)*${y}':d=1:s=${W}x${H}:fps=30`);
  }
  if (seg.grade !== false) f.push("eq=saturation=1.1:contrast=1.04");
  if (seg.lower) f.push(...lowerThird(dir, seg.lower, len));
  if (seg.badge) f.push(...chapterBadge(dir, seg.badge, seg.badgeBg, seg.badgeFg));
  if (seg.still) f.push(`tpad=stop_mode=clone:stop_duration=${seg.still}`);
  const out = join(dir, `${name}.mp4`);
  run(["-ss", String(seg.from), "-to", String(seg.to), "-i", seg.src, "-vf", f.join(","), ...ENC, out]);
  return out;
}

/** two clips side by side on a dark background, with labels */
export function renderSplit(dir, name, { left, right, len, labels = ["Antes", "Ahora"], title }) {
  const out = join(dir, `${name}.mp4`);
  const lt = textFile(dir, labels[0]);
  const rt = textFile(dir, labels[1]);
  const tt = title ? textFile(dir, title) : null;
  const filter = [
    `color=c=0x050a18:s=${W}x${H}:r=30:d=${len}[bg]`,
    `[0:v]setpts=(PTS-STARTPTS)/${left.speed || 1},fps=30,scale=900:-2,format=yuv420p[l]`,
    `[1:v]setpts=(PTS-STARTPTS)/${right.speed || 1},fps=30,scale=900:-2,format=yuv420p[r]`,
    `[bg][l]overlay=x=40:y=(H-h)/2+30:shortest=0[a]`,
    `[a][r]overlay=x=W-w-40:y=(H-h)/2+30:shortest=0[b]`,
    `[b]drawtext=fontfile='${FONT_B}':textfile='${lt}':fontsize=40:fontcolor=white:box=1:boxcolor=0xffffff@0.12:boxborderw=14:x=40+(900-tw)/2:y=(h-506)/2-60,drawtext=fontfile='${FONT_B}':textfile='${rt}':fontsize=40:fontcolor=0x0b1a05:box=1:boxcolor=0x8ef06a@0.95:boxborderw=14:x=w-940+(900-tw)/2:y=(h-506)/2-60${tt ? `,drawtext=fontfile='${FONT_B}':textfile='${tt}':fontsize=54:fontcolor=white:x=(w-tw)/2:y=70:alpha='min(1,t/0.6)'` : ""},trim=duration=${len}[v]`,
  ].join(";");
  run(["-ss", String(left.from), "-i", left.src, "-ss", String(right.from), "-i", right.src, "-filter_complex", filter, "-map", "[v]", ...ENC, out]);
  return out;
}

/** a main clip with a smaller one in a corner window (picture in picture) */
export function renderPip(dir, name, { main, pip, len, label, lower }) {
  const out = join(dir, `${name}.mp4`);
  const lab = textFile(dir, label);
  const extra = lower ? `,${lowerThird(dir, lower, len).join(",")}` : "";
  const filter = [
    `[0:v]setpts=(PTS-STARTPTS)/${main.speed || 1},fps=30,scale=${W}:${H},eq=saturation=1.1[m]`,
    `[1:v]setpts=(PTS-STARTPTS)/${pip.speed || 1},fps=30,scale=620:-2,pad=iw+8:ih+8:4:4:color=0xffd23f[p]`,
    `[m][p]overlay=x='W-w-48':y='60+max(0,40*(1-t/0.6))':shortest=0,drawtext=fontfile='${FONT_B}':textfile='${lab}':fontsize=28:fontcolor=0x0b1a05:box=1:boxcolor=0xffd23f@0.95:boxborderw=10:x=w-48-632:y=26${extra},trim=duration=${len}[v]`,
  ].join(";");
  run(["-ss", String(main.from), "-i", main.src, "-ss", String(pip.from), "-i", pip.src, "-filter_complex", filter, "-map", "[v]", ...ENC, out]);
  return out;
}

/** join the clips with transitions and lay the music under them */
export function assemble(clips, transitions, out, music) {
  const durs = clips.map(duration);
  const inputs = clips.flatMap((c) => ["-i", c]);
  const parts = clips.map((_, i) => `[${i}:v]settb=AVTB,fps=30,format=yuv420p,setsar=1[n${i}]`);
  let last = "[n0]";
  let offset = 0;
  for (let i = 1; i < clips.length; i++) {
    const tr = transitions[(i - 1) % transitions.length];
    const d = tr.d || 0.6;
    offset += durs[i - 1] - d;
    const label = i === clips.length - 1 ? "[vx]" : `[x${i}]`;
    parts.push(`${last}[n${i}]xfade=transition=${tr.t}:duration=${d}:offset=${offset.toFixed(3)}${label}`);
    last = label;
    durs[i] += 0; // the next offset adds this clip's length
  }
  const total = offset + durs[durs.length - 1];
  parts.push(`[vx]fade=t=in:d=0.6,fade=t=out:st=${(total - 1).toFixed(2)}:d=1,format=yuv420p[v]`);
  const audioIdx = clips.length;
  parts.push(`[${audioIdx}:a]atrim=duration=${total.toFixed(2)},afade=t=in:d=2,afade=t=out:st=${(total - 3).toFixed(2)}:d=3[a]`);
  run([...inputs, "-i", music, "-filter_complex", parts.join(";"), "-map", "[v]", "-map", "[a]", "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
  return total;
}
