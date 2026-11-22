# Flujos de Awayu para n8n

Tres flujos listos para importar. Hoy **no están conectados**: falta crear la instancia de n8n y cargar dos variables en Vercel. Para el hackatón son opcionales, porque los jueces no los ven.

## Cómo llegan los eventos
1. La web publica cada evento en su propio servidor: `POST https://awayu-two.vercel.app/api/eventos`. El código está en `web/server/notify.js` y la ruta en `web/api/eventos.js`.
2. El servidor reenvía el mismo JSON a cada URL de `N8N_WEBHOOK_URL`. Admite varias, separadas por coma, una por flujo. Si `N8N_SECRET` está definido, agrega la firma `x-awayu-signature: sha256=<hex>`, un HMAC-SHA256 del cuerpo exacto.
3. Cada flujo de n8n filtra el tipo que le interesa.

Formato de cada evento: `{ "type": "...", "circle": "C...", "data": { ... } }`.

| Tipo | Cuándo lo envía la web | Datos |
|---|---|---|
| `circulo_creado` | Al crear un pasanaku en testnet | `name`, `region`, `members`, `amount`, `token`, `periodSeconds`, `link` |
| `aporte` | Al aportar | `round`, `member`, `amount`, `token` |
| `garantia` | Al dejar garantía | `member`, `amount`, `token` |
| `pozo` | Al pagar el pozo | `round`, `to`, `amount`, `token` |
| `plazo_cerca` | Cuando un miembro abre su círculo, le falta aportar y quedan menos de 24 horas (una vez por ronda y navegador) | `round`, `member`, `hoursLeft`, `amount`, `token`, `link` |
| `ping` | La página Ecosistema comprueba la conexión; **nunca se reenvía** a n8n | — |

## Rutas de los webhooks
| Archivo | Ruta del webhook | Filtra | Hace |
|---|---|---|---|
| `recordatorio-plazo.json` | `/webhook/awayu-eventos-plazo` | `plazo_cerca` | Avisa por Telegram y por correo |
| `bienvenida-circulo.json` | `/webhook/awayu-circulo-creado` | `circulo_creado` | Agrega una fila en Google Sheets (pestaña `Circulos`) y avisa por Telegram |
| `resumen-semanal.json` | No tiene webhook: corre cada lunes a las 09:00 | — | Consulta `round_info` en Stellar RPC y manda un resumen por Telegram |

La URL completa la muestra n8n al abrir el nodo **Webhook** de cada flujo, en la pestaña **Production URL**. Tiene la forma `https://<tu-instancia>.app.n8n.cloud/webhook/awayu-eventos-plazo`. La URL de prueba (`/webhook-test/...`) solo funciona mientras el editor está escuchando.

## Pasos (unos 30 minutos)
1. Crea una cuenta en https://n8n.io (prueba gratis de n8n Cloud) o usa una instancia propia.
2. En n8n: **Workflows → Import from File**. Importa los tres JSON de esta carpeta. Llegan inactivos.
3. Credenciales:
   - **Telegram:** habla con @BotFather, escribe `/newbot` y copia el token. En n8n: Credentials → New → Telegram API. Para saber tu *chat id*, escribe al bot y abre `https://api.telegram.org/bot<TOKEN>/getUpdates`.
   - **Correo** (solo para el recordatorio): Credentials → SMTP, con el servidor de tu correo.
   - **Google Sheets** (solo para la bienvenida): Credentials → Google Sheets OAuth2. Crea una hoja con una pestaña `Circulos` y reemplaza `REEMPLAZAR_ID_HOJA` por el ID que aparece en la URL de la hoja.
4. Destinatarios:
   - Los flujos usan `{{ $env.AWAYU_TELEGRAM_CHAT_ID }}` y `{{ $env.AWAYU_REMINDER_EMAIL }}`.
   - **En n8n Cloud las variables de entorno no están disponibles en los nodos:** reemplaza esas expresiones por tu *chat id* y tu correo escritos directamente en los nodos "Avisar por Telegram" y "Avisar por correo".
5. Activa cada flujo con el interruptor **Active** y copia la **Production URL** de los dos webhooks.
6. En Vercel, proyecto **awayu** → Settings → Environment Variables, marca Production y Preview:
   - `N8N_WEBHOOK_URL` = las dos URL separadas por coma, por ejemplo `https://<instancia>.app.n8n.cloud/webhook/awayu-eventos-plazo,https://<instancia>.app.n8n.cloud/webhook/awayu-circulo-creado`.
   - `N8N_SECRET` = una frase larga al azar (opcional: sirve para validar la firma en n8n).
7. Vuelve a publicar la web (Deployments → Redeploy, o pide a Claude Code que la publique).
8. Comprobación: en la web, **Ecosistema** debe mostrar n8n como "conectado". Después crea un pasanaku en testnet: debe llegar el aviso de bienvenida a Telegram y aparecer la fila en la hoja.

## Resumen semanal (opcional, más técnico)
`resumen-semanal.json` necesita un XDR de simulación de `round_info` en `SOROBAN_ROUND_INFO_XDR` y el contrato en `AWAYU_CONTRACT_ID`. En n8n Cloud, escríbelos directamente en el nodo HTTP y en el nodo de código. El XDR caduca y hay que regenerarlo de vez en cuando, así que conviene dejarlo para después del hackatón.

## Validar la firma en n8n (opcional)
Calcula HMAC-SHA256 con `N8N_SECRET` sobre los bytes exactos del cuerpo recibido, sin volver a serializar el JSON, y compáralo con la cabecera `x-awayu-signature`.
