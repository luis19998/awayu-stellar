import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("..", import.meta.url));
const forbidden = [
  "conectá", "firmás", "firmá", "elegí", "tocá", "revisá", "escribí", "querés", "podés", "tenés", "necesitás",
  "ayudás", "deseás", "contanos", "vos", "armás", "tejé", "probá", "volvé", "leé", "definí", "agregá",
  "comprobá", "buscá", "sumá", "usá", "enviá", "compartí", "copiá", "instalá", "personalizá", "confirmá",
  "verificá", "respondé", "explicá", "recordá", "tratá", "creá", "importá", "pedí", "repetí", "consultá",
  "cambiá", "organizá", "ingresá", "publicás", "guardás", "hacés", "compartís", "prometés", "aportás", "ahorrás",
  "cobrás", "explorá", "integrá", "decime", "mirá", "hacelo", "contame", "querés", "ahorrá", "esperá", "abrí", "entrá", "aprobá", "compartás", "sos", "registrá", "registrás", "plata",
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

describe("español neutro", () => {
  it("does not leave voseo or regional 'plata' in interface, server, API, or prompts", async () => {
    const files = [...await walk(join(web, "src")), ...await walk(join(web, "server")), ...await walk(join(web, "api")), join(web, "index.html")];
    const violations = [];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const word of forbidden) {
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "giu");
        if (pattern.test(source)) violations.push(`${file}: ${word}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
