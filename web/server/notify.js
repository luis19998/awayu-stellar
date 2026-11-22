import { createHmac } from "node:crypto";

const ALLOWED_TYPES = new Set(["aporte", "pozo", "garantia", "circulo_creado", "plazo_cerca", "ping"]);
const MAX_BODY = 12_000;

export function signWebhookPayload(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function validEvent(body) {
  return body && typeof body === "object" && !Array.isArray(body)
    && ALLOWED_TYPES.has(body.type)
    && body.circle !== undefined
    && body.data && typeof body.data === "object" && !Array.isArray(body.data);
}

export async function handleEvent(request) {
  if (request.method !== "POST") return Response.json({ error: "Método no permitido." }, { status: 405, headers: { Allow: "POST" } });
  let raw;
  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY) return Response.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  } catch {
    return Response.json({ error: "No se pudo leer el cuerpo." }, { status: 400 });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 }); }
  if (!validEvent(body)) return Response.json({ error: "Evento inválido: revisa type, circle y data." }, { status: 400 });

  // N8N_WEBHOOK_URL admite varias URL separadas por coma (una por flujo de n8n)
  const urls = String(process.env.N8N_WEBHOOK_URL || "").split(/[\s,]+/).filter(Boolean);
  // "ping" solo comprueba la configuración: nunca se reenvía (así la página Ecosistema no dispara avisos)
  if (body.type === "ping") return Response.json({ accepted: true, forwarded: false, configured: urls.length > 0, webhooks: urls.length }, { status: 202 });
  if (!urls.length) return Response.json({ accepted: true, forwarded: false }, { status: 202 });
  const parsed = [];
  for (const u of urls) {
    let url;
    try { url = new URL(u); } catch { return Response.json({ error: "N8N_WEBHOOK_URL no es una URL válida." }, { status: 500 }); }
    if (!/^https?:$/.test(url.protocol)) return Response.json({ error: "N8N_WEBHOOK_URL debe usar HTTP o HTTPS." }, { status: 500 });
    parsed.push(url);
  }
  const headers = { "content-type": "application/json" };
  if (process.env.N8N_SECRET) headers["x-awayu-signature"] = `sha256=${signWebhookPayload(raw, process.env.N8N_SECRET)}`;
  // Para diagnosticar sin exponer la URL: código HTTP de cada webhook (0 = sin conexión) y si es la URL de prueba de n8n
  const statuses = await Promise.all(parsed.map((url) =>
    fetch(url, { method: "POST", headers, body: raw, signal: AbortSignal.timeout(5_000) }).then((r) => r.status).catch(() => 0)));
  const ok = statuses.filter((code) => code >= 200 && code < 300).length;
  const testUrl = parsed.some((url) => url.pathname.includes("/webhook-test/"));
  if (!ok) return Response.json({ accepted: false, forwarded: false, statuses, testUrl }, { status: 502 });
  return Response.json({ accepted: true, forwarded: true, delivered: ok, webhooks: parsed.length }, { status: 202 });
}
