# Flujos de Awayu para n8n

Tres flujos listos para importar, en la carpeta `flujos/`. **Ninguno depende de una cuenta personal**: no usan Telegram, correo ni Google. Los avisos salen por **ntfy.sh**, un servicio gratuito de notificaciones que no pide registro. Los eventos se guardan en una tabla interna de n8n (**Data tables**), que el flujo crea solo con el nombre `awayu_eventos`.

Probados el 2026-11-21 en n8n 2.48.7: se importan sin errores, guardan eventos simultáneos sin perder ninguno y los avisos llegan a ntfy.

| Archivo | Qué hace | Se activa |
|---|---|---|
| `flujos/01-awayu-eventos.json` | Recibe los eventos de la web, los guarda en la tabla `awayu_eventos` y avisa: un **círculo nuevo** al tema general; **pozo pagado** y **plazo cerca** al tema de cada círculo. También responde a una consulta del registro en JSON. | Webhooks `POST /webhook/awayu-eventos` y `GET /webhook/awayu-registro` |
| `flujos/02-awayu-resumen-semanal.json` | Lee los contratos de `testnet.json`, consulta su actividad en la API pública de Stellar Expert y manda el resumen. | Cada lunes a las 09:00, hora de Bolivia (o con **Probar ahora**) |
| `flujos/03-awayu-monitor-web.json` | Revisa la página, los datos de testnet y el servidor de eventos; avisa cuando algo deja de responder y cuando vuelve. | Cada 30 minutos (o con **Probar ahora**) |

## Qué es ntfy y cómo recibir los avisos
- Un **tema** es un nombre, por ejemplo `awayu-avisos-j614insb`. Quien conoce el nombre puede suscribirse; no hay usuario ni contraseña.
- **Celular:** instala la app **ntfy** (Android o iPhone), toca **+** y escribe el tema.
- **Computadora:** abre `https://ntfy.sh/awayu-avisos-j614insb` y permite las notificaciones.
- **Tema general** (círculos nuevos, resumen semanal, alertas de la web): el valor de `AVISOS`.
- **Tema de cada círculo** (pozo pagado, plazo cerca): `AVISOS` + `-` + los primeros 10 caracteres del contrato, en minúsculas. El aviso de "Nuevo pasanaku" incluye este enlace para compartirlo con los miembros.
- Los temas son públicos: no pongas datos personales en los avisos. Si quieres otro nombre, cambia `AVISOS` en los tres flujos (está al inicio de cada nodo de código).

## Pasos (unos 15 minutos)
1. Crea una cuenta de n8n en https://n8n.io (prueba gratis de n8n Cloud) o usa una instancia propia. Es la única cuenta necesaria.
2. Importa los tres archivos de `flujos/`: en n8n, **Overview → Create → Import from file** (o, dentro de un flujo vacío, menú **⋯ → Import from File**).
3. Abre **Awayu · 01 Eventos y avisos** y pulsa **Publish** (en versiones anteriores de n8n es el interruptor **Active**). Abre el nodo **Evento de Awayu**, pestaña **Production URL**, y copia la dirección. Tiene la forma `https://<tu-instancia>.app.n8n.cloud/webhook/awayu-eventos`.
4. Publica también los flujos **02** y **03**. No necesitan nada más. Para verlos funcionar en el momento, ábrelos y pulsa **Execute workflow** (empieza en el nodo **Probar ahora**).
5. En Vercel, proyecto **awayu** → **Settings → Environment Variables** → **Add**:
   - Nombre `N8N_WEBHOOK_URL`, valor = la Production URL del paso 3, en **Production** y **Preview**.
   - Opcional: `N8N_SECRET` con una frase larga al azar, y la misma frase en `SECRETO` dentro del nodo **Validar, guardar y armar aviso**. Así n8n rechaza eventos que no vengan de Awayu.
6. Vuelve a publicar la web: en Vercel, **Deployments → ⋯ → Redeploy**, o pide a Claude Code que la publique.
7. Comprobación:
   - En la web, la página **Ecosistema** debe mostrar n8n como "conectado".
   - Suscríbete al tema general y crea un pasanaku en testnet: debe llegar "Nuevo pasanaku en Awayu".
   - Abre `https://<tu-instancia>.app.n8n.cloud/webhook/awayu-registro` para ver los eventos guardados, o en n8n: **Overview → Data tables → awayu_eventos**.

## Si no llegan los eventos
Haz esta prueba en una terminal (guarda un evento de prueba, sin avisos):
```
curl -X POST https://awayu-two.vercel.app/api/eventos -H "content-type: application/json" -d "{\"type\":\"aporte\",\"circle\":\"PRUEBA\",\"data\":{}}"
```
- `"forwarded":true`: todo está conectado.
- `"statuses":[404]`: n8n no tiene ese webhook activo. Publica el flujo 01 (**Publish**) y revisa que la URL sea la **Production URL** del nodo **Evento de Awayu** y que termine en `/webhook/awayu-eventos`.
- `"testUrl":true`: pegaste la URL de prueba (`/webhook-test/`). Cámbiala por la de producción.
- `"statuses":[0]`: n8n no responde. Revisa que la instancia esté encendida y que la dirección sea correcta.
- Cada vez que cambies `N8N_WEBHOOK_URL` en Vercel, vuelve a publicar la web.

## Cómo llegan los eventos
1. La web publica cada evento en `POST https://awayu-two.vercel.app/api/eventos` (código en `web/server/notify.js` y `web/api/eventos.js`).
2. El servidor reenvía el JSON a `N8N_WEBHOOK_URL`, firmado con `x-awayu-signature` si hay `N8N_SECRET`. Admite varias URL separadas por coma.
3. Formato: `{ "type": "...", "circle": "C...", "data": { ... } }`.

| Tipo | Cuándo lo envía la web | Datos |
|---|---|---|
| `circulo_creado` | Al crear un pasanaku en testnet | `name`, `region`, `members`, `amount`, `token`, `periodSeconds`, `link` |
| `aporte` | Al aportar | `round`, `member`, `amount`, `token` |
| `garantia` | Al dejar garantía | `member`, `amount`, `token` |
| `pozo` | Al pagar el pozo | `round`, `to`, `amount`, `token` |
| `plazo_cerca` | Cuando un miembro abre su círculo, le falta aportar y quedan menos de 24 horas (una vez por ronda y navegador) | `round`, `member`, `hoursLeft`, `amount`, `token`, `link` |
| `ping` | La página Ecosistema comprueba la conexión; **nunca se reenvía** | — |

`aporte` y `garantia` solo se guardan en el registro, sin aviso, para no saturar el canal.

## Notas
- La tabla `awayu_eventos` tiene cuatro columnas de texto: `tipo`, `circulo`, `datos` (JSON) y `recibido` (fecha ISO). Puedes verla y exportarla desde **Data tables** en n8n.
- El monitor recuerda la última revisión solo con el flujo publicado; en una prueba manual no avisa si todo está bien.
- La comprobación de firma usa el módulo `crypto` de Node. En n8n autoalojado, define `NODE_FUNCTION_ALLOW_BUILTIN=crypto`. Si n8n muestra "Cannot find module 'crypto'", deja `SECRETO` vacío: el resto funciona igual.
- No hay claves en estos archivos: la API de Stellar Expert y ntfy.sh son públicas.
