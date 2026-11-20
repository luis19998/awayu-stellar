import { createHmac } from "node:crypto";

const ALLOWED_TYPES = new Set(["aporte", "pozo", "garantia", "circulo_creado", "plazo_cerca"]);
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

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return Response.json({ accepted: true, forwarded: false }, { status: 202 });
  let parsed;
  try { parsed = new URL(webhookUrl); } catch { return Response.json({ error: "N8N_WEBHOOK_URL no es una URL válida." }, { status: 500 }); }
  if (!/^https?:$/.test(parsed.protocol)) return Response.json({ error: "N8N_WEBHOOK_URL debe usar HTTP o HTTPS." }, { status: 500 });

  try {
    const headers = { "content-type": "application/json" };
    if (process.env.N8N_SECRET) headers["x-awayu-signature"] = `sha256=${signWebhookPayload(raw, process.env.N8N_SECRET)}`;
    const response = await fetch(parsed, { method: "POST", headers, body: raw, signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return Response.json({ accepted: false, forwarded: false }, { status: 502 });
    return Response.json({ accepted: true, forwarded: true }, { status: 202 });
  } catch {
    return Response.json({ accepted: false, forwarded: false }, { status: 502 });
  }
}
