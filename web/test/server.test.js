import { afterEach, describe, expect, it, vi } from "vitest";
import { answerQuestion, handleAmawta } from "../server/ai.js";
import { handleEvent, signWebhookPayload } from "../server/notify.js";
import { handleOg } from "../server/og.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Amawta", () => {
  it.each([
    ["¿Qué es Awayu?", "pasanaku"],
    ["¿Cómo funciona la garantía?", "respaldo"],
    ["¿Cómo conectar Freighter?", "Freighter"],
    ["¿Qué es testnet?", "red de prueba"],
    ["¿Cómo se calcula el puntaje?", "marcas"],
    ["¿Qué pasa si alguien no paga?", "impago"],
  ])("responde localmente sobre %s", async (question, included) => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(answerQuestion({ question })).resolves.toMatchObject({ source: "local", answer: expect.stringContaining(included) });
  });

  it("valida el método y el JSON de entrada", async () => {
    expect((await handleAmawta(new Request("https://awayu.test/api/amawta", { method: "GET" }))).status).toBe(405);
    const invalid = await handleAmawta(new Request("https://awayu.test/api/amawta", { method: "POST", body: "{" }));
    expect(invalid.status).toBe(400);
  });

  it("cae al motor local si Gemini falla y no revela la clave", async () => {
    vi.stubEnv("GEMINI_API_KEY", "secreto-de-prueba");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("error", { status: 503 })));
    const response = await handleAmawta(new Request("https://awayu.test/api/amawta", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "¿Qué es testnet?" }),
    }));
    const body = await response.json();
    expect(body.source).toBe("local");
    expect(JSON.stringify(body)).not.toContain("secreto-de-prueba");
  });
});

describe("eventos a n8n", () => {
  it("calcula la firma HMAC-SHA256 del cuerpo sin alterarlo", () => {
    expect(signWebhookPayload("{\"type\":\"aporte\"}", "prueba")).toBe("dc45afde61e02102b14e104c5ce9702b2c01daa14802671bd09d382a2b9fc6c2");
  });

  it("acepta sin reenviar cuando no hay URL configurada", async () => {
    vi.stubEnv("N8N_WEBHOOK_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleEvent(new Request("https://awayu.test/api/eventos", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "aporte", circle: "C123", data: { ronda: 1 } }),
    }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, forwarded: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reenvía y firma el cuerpo exacto", async () => {
    vi.stubEnv("N8N_WEBHOOK_URL", "https://n8n.test/hook");
    vi.stubEnv("N8N_SECRET", "secreto");
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const raw = '{"type":"plazo_cerca","circle":"C123","data":{"ronda":2}}';
    const response = await handleEvent(new Request("https://awayu.test/api/eventos", { method: "POST", body: raw }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, forwarded: true, delivered: 1, webhooks: 1 });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBe(raw);
    expect(options.headers["x-awayu-signature"]).toBe(`sha256=${signWebhookPayload(raw, "secreto")}`);
  });

  it("el ping solo informa la configuración y nunca se reenvía", async () => {
    vi.stubEnv("N8N_WEBHOOK_URL", "https://n8n.test/a, https://n8n.test/b");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleEvent(new Request("https://awayu.test/api/eventos", {
      method: "POST", body: JSON.stringify({ type: "ping", circle: "demo", data: {} }),
    }));
    expect(await response.json()).toEqual({ accepted: true, forwarded: false, configured: true, webhooks: 2 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reenvía a cada flujo cuando hay varias URL", async () => {
    vi.stubEnv("N8N_WEBHOOK_URL", "https://n8n.test/a,https://n8n.test/b");
    vi.stubEnv("N8N_SECRET", "");
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleEvent(new Request("https://awayu.test/api/eventos", {
      method: "POST", body: JSON.stringify({ type: "circulo_creado", circle: "C1", data: { name: "Feria" } }),
    }));
    expect(await response.json()).toEqual({ accepted: true, forwarded: true, delivered: 2, webhooks: 2 });
    expect(fetchMock.mock.calls.map(([u]) => String(u))).toEqual(["https://n8n.test/a", "https://n8n.test/b"]);
  });

  it("rechaza tipos de evento no admitidos", async () => {
    const response = await handleEvent(new Request("https://awayu.test/api/eventos", {
      method: "POST", body: JSON.stringify({ type: "desconocido", circle: "C123", data: {} }),
    }));
    expect(response.status).toBe(400);
  });
});

describe("imagen para compartir", () => {
  it("devuelve SVG 1200x630 y escapa texto del usuario", async () => {
    const response = handleOg(new Request("https://awayu.test/api/og?n=%3Cscript%3E%26%22%3C%2Fscript%3E&c=C123"));
    const svg = await response.text();
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(response.headers.get("cache-control")).toContain("s-maxage");
    expect(svg).toMatch(/<svg[^>]+width="1200" height="630"/);
    expect(svg).toContain("&lt;script&gt;&amp;&quot;&lt;/script&gt;");
    expect(svg).not.toContain("<script>");
  });
});

describe("adaptadores y flujos", () => {
  it("Vercel y Netlify exponen manejadores que devuelven Response", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const vercel = await import("../api/amawta.js");
    const netlify = await import("../../netlify/functions/amawta.mjs");
    const request = new Request("https://awayu.test/api/amawta", { method: "POST", body: JSON.stringify({ question: "¿Qué es Awayu?" }) });
    expect(await vercel.POST(request)).toBeInstanceOf(Response);
    expect(await netlify.default(request)).toBeInstanceOf(Response);
    expect(netlify.config).toEqual({ path: "/api/amawta" });
  });

  it.each(["01-awayu-eventos.json", "02-awayu-resumen-semanal.json", "03-awayu-monitor-web.json"])("tiene nodos y conexiones válidos en %s", async (filename) => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const raw = await readFile(resolve(process.cwd(), "../automations/n8n/flujos", filename), "utf8");
    const flow = JSON.parse(raw);
    const names = new Set(flow.nodes.map((node) => node.name));
    expect(flow.nodes.length).toBeGreaterThan(0);
    // Sin cuentas personales: ni Telegram, ni correo, ni Google
    expect(raw).not.toMatch(/telegram|emailSend|googleSheets/i);
    for (const [source, groups] of Object.entries(flow.connections)) {
      expect(names.has(source)).toBe(true);
      for (const target of groups.main.flat()) expect(names.has(target.node)).toBe(true);
    }
  });
});
