import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import en from "../src/i18n/en.js";
import pt from "../src/i18n/pt.js";

const WEB = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(WEB, "src");
const EXCLUDED_DIRS = new Set(["games", "latam"]);
const LONG_IDENTICAL_EXCEPTIONS = new Map([
  ["Pasanaku", "Nombre cultural del círculo de ahorro; se conserva en los idiomas."],
  ["Stellar", "Nombre propio de la red."],
  ["USDC", "Símbolo del activo."],
  ["Vaquita · Blend · DeFindex", "Nombres de productos y protocolos que se conservan."],
]);
const VOSEO = /(?:^|[^\p{L}])(?:tenés|podés|querés|elegí|tocá|hacé|mirá|probá|revisá|configurá|importá|activá|conectá)(?=$|[^\p{L}])/iu;

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return EXCLUDED_DIRS.has(entry.name) ? [] : sourceFiles(path);
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  });
}

function htmlEntityText(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function staticKeys(html) {
  const keys = [];
  const elementPattern = /<([a-z][\w-]*)\b(?=[^>]*\bdata-i18n(?:\s|>))[^>]*>/gi;
  for (const match of html.matchAll(elementPattern)) {
    const close = html.indexOf("</" + match[1], match.index + match[0].length);
    if (close < 0) continue;
    const key = htmlEntityText(html.slice(match.index + match[0].length, close).replace(/<[^>]*>/g, "")).trim();
    if (key) keys.push(key);
  }
  const translatableAttributes = new Set(["content", "title", "placeholder", "aria-label", "alt"]);
  const attributePattern = /<[a-z][\w-]*\b[^>]*\bdata-i18n-attr=(["'])(.*?)\1[^>]*>/gi;
  for (const match of html.matchAll(attributePattern)) {
    const enabled = match[2].split(/\s+/).filter((name) => translatableAttributes.has(name));
    for (const name of enabled) {
      const value = match[0].match(new RegExp("\\b" + name + "=([\"'])(.*?)\\1", "i"));
      if (value) keys.push(htmlEntityText(value[2]));
    }
  }
  return keys;
}

function globalTranslationKeys(files) {
  const keys = [];
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    if (!/import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*["'][^"']*i18n\.js["']/s.test(source)) continue;
    for (const match of source.matchAll(/\bt\s*\(\s*"((?:\\.|[^"\\])*)"/g)) {
      keys.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"));
    }
  }
  return keys;
}

function dynamicCatalogKeys() {
  const keys = [];
  for (const file of ["themes.js", "scenarios.js", "scene.js", "dashboard.js"]) {
    const source = readFileSync(join(SOURCE, file), "utf8");
    for (const match of source.matchAll(/\blabel\s*:\s*"([^"]+)"/g)) keys.push(match[1]);
  }
  const model = readFileSync(join(SOURCE, "model.js"), "utf8");
  for (const match of model.matchAll(/\brole\s*:\s*"([^"]+)"/g)) keys.push(match[1]);
  const figures = JSON.parse(readFileSync(join(WEB, "public/models/personajes.json"), "utf8"));
  keys.push(...figures.figures.map((figure) => figure.label));
  const main = readFileSync(join(SOURCE, "main.js"), "utf8");
  const howto = main.match(/const HOWTO\s*=\s*\[([\s\S]*?)\];/)?.[1] || "";
  for (const match of howto.matchAll(/\[\s*"[^"]+"\s*,\s*"([^"]+)"/g)) keys.push(match[1]);
  const dashboard = readFileSync(join(SOURCE, "dashboard.js"), "utf8");
  const ecosystem = dashboard.match(/async function renderEcosystem[\s\S]*?const items\s*=\s*\[([\s\S]*?)\];/)?.[1] || "";
  for (const match of ecosystem.matchAll(/\[\s*"[^"]+"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/g)) keys.push(match[1], match[2]);
  keys.push("Todos");
  return keys;
}

describe("cobertura de idiomas", () => {
  it("incluye en inglés y portugués todas las claves globales y estáticas", () => {
    const files = sourceFiles(SOURCE);
    const html = readFileSync(join(WEB, "index.html"), "utf8");
    const keys = [...new Set([...globalTranslationKeys(files), ...staticKeys(html), ...dynamicCatalogKeys()])];
    const missing = keys.filter((key) => !(key in en) || !(key in pt));
    expect(missing, "Claves sin traducción en en.js o pt.js").toEqual([]);
  });

  it("no deja textos largos iguales al español sin una excepción justificada", () => {
    const missing = [];
    for (const [key, translated] of Object.entries(en)) {
      if (key.trim().split(/\s+/).length > 3 && translated === key && !LONG_IDENTICAL_EXCEPTIONS.has(key)) missing.push("en: " + key);
    }
    for (const [key, translated] of Object.entries(pt)) {
      if (key.trim().split(/\s+/).length > 3 && translated === key && !LONG_IDENTICAL_EXCEPTIONS.has(key)) missing.push("pt: " + key);
    }
    expect(missing, "Valores de más de tres palabras que siguen en español").toEqual([]);
  });

  it("el reporte tiene las mismas etiquetas en inglés y portugués", () => {
    const source = readFileSync(join(SOURCE, "reporte.js"), "utf8");
    const keysFor = (locale) => {
      const start = source.indexOf(locale + ": {");
      const end = source.indexOf("\n  },", start);
      return [...source.slice(start, end).matchAll(/^\s*([A-Za-z]\w*):/gm)].map((match) => match[1]).filter((key) => key !== locale);
    };
    expect(keysFor("en")).not.toEqual([]);
    expect(keysFor("pt")).toEqual(keysFor("en"));
  });

  it("no contiene voseo en las cadenas visibles en español", () => {
    const files = sourceFiles(SOURCE);
    const inputs = [
      ...files.map((path) => [relative(WEB, path), readFileSync(path, "utf8")]),
      ["index.html", readFileSync(join(WEB, "index.html"), "utf8")],
      ["reporte.html", readFileSync(join(WEB, "reporte.html"), "utf8")],
    ];
    const matches = inputs.filter(([, text]) => VOSEO.test(text)).map(([path]) => path);
    expect(matches, "Hay conjugaciones voseantes en textos de interfaz").toEqual([]);
  });
});
