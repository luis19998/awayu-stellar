# Flujos de Awayu para n8n

Importá cualquiera de los tres JSON desde **Workflows → Import from File**. Los flujos se importan inactivos; configurá las credenciales marcadas y activalos cuando estén listos. Los webhooks reciben los eventos publicados por `POST /api/eventos`.

## 1. Recordatorio de plazo

`recordatorio-plazo.json` recibe el evento, deja pasar solo `plazo_cerca` y envía Telegram y correo. Creá credenciales de Telegram y SMTP y reemplazá los marcadores `REEMPLAZAR`. Definí `AWAYU_TELEGRAM_CHAT_ID` y `AWAYU_REMINDER_EMAIL` en el entorno de n8n. Configurá `N8N_WEBHOOK_URL` en el servidor de Awayu con la URL de producción del webhook de este flujo.

## 2. Resumen semanal

`resumen-semanal.json` corre cada lunes a las 09:00 según la zona horaria del workflow. Invoca `simulateTransaction` en Stellar RPC con `SOROBAN_ROUND_INFO_XDR`, que debe ser el XDR de una transacción de simulación preparada para invocar `round_info` del contrato. Definí `STELLAR_RPC_URL` (opcional; predeterminado a Testnet), `SOROBAN_ROUND_INFO_XDR`, `AWAYU_CONTRACT_ID` y `AWAYU_TELEGRAM_CHAT_ID`; configura la credencial Telegram. La transacción debe estar vigente al ejecutar el flujo y puede requerir una nueva simulación o preparación periódica. El nodo notifica que la simulación respondió; ajustá el mensaje para decodificar los valores de retorno de acuerdo con la interfaz ABI de la versión desplegada.

## 3. Bienvenida al crear un círculo

`bienvenida-circulo.json` filtra `circulo_creado`, agrega una fila a la pestaña `Circulos` y avisa por Telegram. Reemplazá el ID de la hoja y configurá las credenciales de Google Sheets y Telegram. Definí `AWAYU_TELEGRAM_CHAT_ID` en n8n. Conectá `N8N_WEBHOOK_URL` a la URL de producción del webhook de bienvenida.

## Firma y formatos

Awayu reenvía el JSON original y, cuando `N8N_SECRET` está definido, adjunta `x-awayu-signature: sha256=<hex>`, un HMAC-SHA256 del cuerpo exacto. Para validar la firma, calculá el HMAC sobre los bytes sin volver a serializar el JSON. Los payloads tienen la forma `{ "type": "circulo_creado", "circle": "C...", "data": { ... } }`.

Los JSON usan los tipos de nodo estándar de n8n. `connections` enlaza nombres de nodos existentes; al importar, revisá credenciales y parámetros propios de la versión de n8n instalada.
