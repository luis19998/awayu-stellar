# Conexiones que tiene que hacer el equipo

Todo lo de esta lista necesita **tu cuenta, tu identidad o aceptar términos**, así que ni Claude Code ni Codex pueden hacerlo. Lo demás ya está construido y se activa solo cuando la clave existe. Orden sugerido por impacto en el hackatón.

## 1. Despliegue automático en Vercel (5 min)
1. Entrá a https://vercel.com, proyecto **awayu** → **Settings → Git**.
2. **Connect Git Repository** → GitHub → instalá la app de Vercel y dale acceso a `luis19998/awayu-stellar`.
3. Desde ahí, cada push a `main` publica solo y cada rama de Codex tiene su vista previa.

## 2. Amawta con Gemini (5 min)
1. https://aistudio.google.com/apikey → **Create API key** (gratis).
2. Vercel → proyecto **awayu** → **Settings → Environment Variables** → `GEMINI_API_KEY` = la clave (Production y Preview). Opcional: `GEMINI_MODEL` = `gemini-2.5-flash`.
3. Pedime un redeploy (o hacé push). La sección Ecosistema mostrará "Gemini".

## 3. Pollar: login con Google, Earn (Blend/DeFindex), swaps y rampas (15 min)
1. https://dashboard.pollar.xyz → crear la aplicación **Awayu** en **testnet**.
2. **Build → API Keys → Generate**: copiá la clave **publicable** (`pub_testnet_…`). La secreta (`sec_…`) no se usa en la web.
3. **Build → Domains**: agregá `https://awayu-two.vercel.app`, `https://awayu-pasanaku.netlify.app` y `http://localhost:5180`.
4. **Treasury → Funding Mode**: `IMMEDIATE` para la demo.
5. Si aparece **Earn** en el panel, activá los proveedores Blend y DeFindex (así el rendimiento de Vaquita deja de ser una proyección).
6. Vercel → Environment Variables → `VITE_POLLAR_KEY` = la clave publicable → redeploy.

## 4. Freighter para probar la firma (3 min)
1. Instalá https://www.freighter.app en Chrome, creá una billetera y elegí **Testnet** en la configuración.
2. En Awayu: **Conectar billetera → Freighter**. La web fondea la cuenta con Friendbot sola.

## 5. Trustless Work: escrow de garantías y Minka (10 min)
1. https://dapp.trustlesswork.com (o la página **Request API Key** de su documentación) → pedí una clave de **testnet**.
2. Vercel → Environment Variables → `TRUSTLESS_API_KEY` (va en el servidor, nunca en la web).
3. Avisame para confirmar las rutas exactas de su API contra la documentación y activarlo.

## 6. n8n: recordatorios por Telegram y correo (15 min)
1. Creá una cuenta en https://n8n.io (prueba gratis) o usá tu instancia.
2. Importá los tres flujos de `automations/n8n/` (menú **Import from file**).
3. En el flujo de recordatorio, creá la credencial de Telegram con un bot de @BotFather y la de correo (Gmail).
4. Copiá la URL del nodo **Webhook** (modo producción) → Vercel → `N8N_WEBHOOK_URL`; inventá un secreto largo → `N8N_SECRET` (el mismo valor en el nodo de verificación del flujo).

## 7. Conector de Vercel para Claude (opcional, 2 min)
En claude.ai → Settings → Connectors → Vercel → dar acceso al equipo **radar-tech**. Hoy Claude despliega con la CLI; con esto también podrá leer los registros de errores en vivo.

## 8. Inscripciones (obligatorio)
- Hackatón Stellar Bolivia: https://tally.so/r/2jj26A (equipo de 2 a 5, **cierra el 22 de noviembre**).
- Reto Commit del Mes: https://tally.so/r/zEMQB1 (repo público: `https://github.com/luis19998/awayu-stellar`).

## 9. Seguridad de tus cuentas
- Activá la verificación en dos pasos en Vercel: https://vercel.com/account/settings/authentication.
- Los **códigos de recuperación** de Vercel van solo a tu gestor de contraseñas. Si los compartiste en algún chat, generá códigos nuevos.

## Lo que NO hace falta comprar
Nada. Testnet, Vercel Hobby, Netlify Free, Gemini (cuota gratuita), Pollar en testnet, Freighter y GitHub Actions son gratis. Un dominio propio es opcional.
