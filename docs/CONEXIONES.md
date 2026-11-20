# Lo que tiene que hacer el equipo (paso a paso)

Todo lo de esta lista necesita **tu cuenta, tu identidad, tu permiso o aceptar términos**, así que ni Claude Code ni Codex pueden hacerlo por ti. Lo demás ya está construido y se activa solo cuando la clave existe. Nunca pegues claves en un chat: van directo en Vercel o en tu gestor de contraseñas.

Orden sugerido por impacto en el hackatón (cierre virtual: **22 de noviembre**).

## A. Obligatorio (20 min)
1. **Inscripción al hackatón**: https://tally.so/r/2jj26A (equipo de 2 a 5 personas).
2. **Inscripción a Commit del Mes**: https://tally.so/r/zEMQB1 con el repo público `https://github.com/luis19998/awayu-stellar`.
3. **Video del pitch**: súbelo a YouTube como "No listado" (o a Drive con acceso "cualquiera con el enlace") desde `video/awayu-pitch.mp4` y guarda el enlace para el formulario.
4. **Seguridad de Vercel**: en https://vercel.com/account/settings/authentication genera **nuevos códigos de recuperación** (los anteriores se compartieron en un chat) y guárdalos solo en tu gestor de contraseñas.

## B. Claves gratuitas que activan funciones (cada una 5 a 15 min)
Todas se cargan en Vercel → proyecto **awayu** → **Settings → Environment Variables** (marca Production y Preview) y luego se vuelve a publicar.

| Servicio | Para qué | Dónde se obtiene | Variable |
|---|---|---|---|
| **Gemini** (Google AI Studio) | Amawta responde con IA (sin clave usa respuestas locales) | https://aistudio.google.com/apikey → *Create API key* | `GEMINI_API_KEY` (opcional `GEMINI_MODEL=gemini-2.5-flash`) |
| **Pollar** (testnet) | Ingreso con Google o correo, billetera embebida, swaps, Earn y rampas de dinero | https://dashboard.pollar.xyz → tu app → *Developers → API keys* → *Create key* → clave **publicable** `pub_testnet_…` | `VITE_POLLAR_KEY` |
| **Trustless Work** (testnet) | Escrow regulado para garantías y Minka | https://dapp.trustlesswork.com → solicitar clave de testnet | `TRUSTLESS_API_KEY` (solo servidor) |
| **Bot de Telegram** (vía n8n) | Recordatorios de cuotas | En Telegram habla con @BotFather → `/newbot` | credencial dentro de n8n |
| **n8n** | Automatizaciones (recordatorios, resumen semanal) | https://n8n.io (prueba gratis) → importa los flujos de `automations/n8n/` | `N8N_WEBHOOK_URL` y `N8N_SECRET` |

Pasos extra en Pollar (además de la clave):
1. En *Domains* agrega `https://awayu-two.vercel.app` y `http://localhost:5180`.
2. **Rampa en bolivianos con QR bancario**: en *Ramps → Providers* activa **Stereum** (compra con QR de banco en BOB y venta a cuenta bancaria). Con eso, el botón "Recargar con el QR de tu banco" muestra rutas reales en vez del aviso de demostración.
3. **Verificación de identidad (KYC)**: en *Identity checks* activa **Didit** (proveedor integrado de Pollar). Las rampas la exigen por normativa.
4. Si ves **Earn/Savings**, activa los proveedores para que el rendimiento deje de ser una proyección.
5. Pollar cobra por créditos (100 créditos = 1 USD) según uso; en testnet se recarga con USDC de prueba. Revisa *Settings → Credits*.

## C. Servidores MCP para que Claude trabaje directo con los servicios
- **Pollar MCP (oficial)**: en el panel de Pollar → menú de tu cuenta → *Personal Access Tokens* → crea un token `pat_…` con alcance a la app Awayu y fecha de vencimiento. Luego, en una terminal:
  ```
  claude mcp add --transport http pollar https://mcp.api.pollar.xyz/mcp --header "Authorization: Bearer pat_TU_TOKEN"
  ```
  Con eso Claude puede revisar la app, saldos, transacciones, dominios y activar activos de prueba (las acciones destructivas piden confirmación). No mueve fondos de usuarios.
- **Stellar**: la Stellar Development Foundation no publica un MCP oficial; ofrece la **Stellar CLI para agentes** (ya la usamos) y la documentación para IA en https://developers.stellar.org/llms.txt. Hay MCP de la comunidad (por ejemplo `stellar-mcp` de syronlabs o `chronos-mcp`), pero piden claves secretas: no los recomiendo para cuentas reales.
- **Vercel** (opcional): en claude.ai → *Settings → Connectors → Vercel* → da acceso al equipo **radar-tech** para que Claude lea registros y errores en vivo.

## D. Pruebas que solo tú puedes hacer (30 min)
1. **Freighter**: instala https://www.freighter.app en Chrome, crea una billetera, elige **Testnet**. En Awayu: *Conectar billetera → Freighter*, acepta los términos y prueba aportar en un círculo, apoyar una Minka y crear una meta de Alasitas.
2. **Pagos por QR (SEP-7)**: instala LOBSTR en tu celular con una cuenta de testnet, abre *Billetera → Recibir con QR* en la computadora y escanéalo.
3. **Voz de Amawta**: en Chrome abre *Amawta*, toca 🎤 y permite el micrófono; toca 🔊 para escuchar una respuesta.
4. **Escanear**: en el celular abre *Escanear QR* y apunta a la invitación de un círculo.

## E. Para operar con dinero real (después del hackatón)
- **Banco Central de Bolivia – OpenBCB**: API gratuita para generar QR interoperables y recibir avisos de pago. Requiere habilitar una cuenta transitoria con el BCB: consulta la sección OpenBCB en https://www.bcb.gob.bo.
- **Registro como proveedor de servicios de activos virtuales** ante la UIF, o alianza con una Empresa de Tecnología Financiera autorizada por ASFI. Ver la página *Legal y privacidad* de la web y consultar con un abogado.
- **Auditoría** de los contratos antes de mainnet.

## Lo que NO hace falta comprar
Nada para el hackatón: testnet, Vercel Hobby, Gemini (cuota gratuita), Pollar en testnet, Freighter, LOBSTR, GitHub Actions y la voz del navegador son gratis. Un dominio propio es opcional.
