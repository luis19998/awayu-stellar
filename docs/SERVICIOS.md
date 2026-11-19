# Servicios del servidor

Los servicios comparten su lógica en `web/server/`. Vercel importa adaptadores desde `web/api/`; Netlify usa funciones v2 en `netlify/functions/` con las mismas rutas `/api/...`. Requieren el runtime Node.js 20 o posterior y usan `fetch` nativo.

## Rutas

### `POST /api/amawta`

Entrada JSON: `{ "question": "¿Qué es la garantía?", "lang": "es", "context": { "cuota": 10, "miembros": [], "ronda": 1, "garantias": [] } }`. `question` admite hasta 1.000 caracteres y `context` se limita a 6.000. Devuelve `{ "answer": "...", "source": "gemini" | "local" }`. Si Gemini no está configurado o falla, responde con la guía local. Las entradas inválidas devuelven un error JSON.

### `POST /api/eventos`

Entrada JSON: `{ "type": "aporte", "circle": "CONTRATO...", "data": { "miembro": "...", "ronda": 1 } }`. Tipos admitidos: `aporte`, `pozo`, `garantia`, `circulo_creado`, `plazo_cerca`. Acepta un `circle` de cualquier tipo JSON y un objeto `data`; el cuerpo tiene un límite de 12 KB. Devuelve `202` con `{ "accepted": true, "forwarded": false }` si no hay webhook, o `forwarded: true` si n8n lo aceptó. Cuando está configurado `N8N_SECRET`, envía `x-awayu-signature: sha256=<hex HMAC-SHA256>` calculado sobre el cuerpo JSON exacto recibido.

### `GET /api/og?c=<contrato>&n=<nombre>`

Devuelve una imagen SVG `1200 × 630`, con escape de caracteres y caché compartida. `c` y `n` son opcionales.

## Variables de entorno

- `GEMINI_API_KEY`: clave privada de Google AI Studio; solo se usa en el servidor y nunca se devuelve al navegador.
- `GEMINI_MODEL`: modelo de Gemini opcional. Valor predeterminado: `gemini-2.5-flash`.
- `N8N_WEBHOOK_URL`: URL HTTPS del webhook de n8n. Si no está definida, los eventos se aceptan sin reenviarse.
- `N8N_SECRET`: secreto opcional compartido para la firma HMAC-SHA256 del webhook. Configurá el mismo valor en n8n para validar `x-awayu-signature`.
