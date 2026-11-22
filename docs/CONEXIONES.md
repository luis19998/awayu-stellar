# Lo que tiene que hacer el equipo (paso a paso)

Todo lo de esta lista necesita **tu cuenta, tu identidad, tu permiso o aceptar términos**, así que ni Claude Code ni Codex pueden hacerlo por ti. Lo demás ya está construido y se activa solo cuando la clave existe. Nunca pegues claves en un chat: van directo en Vercel o en tu gestor de contraseñas.

Orden sugerido por impacto en el hackatón (cierre virtual: **22 de noviembre**).

## Estado al 2026-11-21 (revisado en Vercel y en Claude Code)
| Conexión | Estado | Qué falta |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Producción y Preview; Amawta responde con Gemini | Cuota gratuita limitada: si se agota (error 429) Amawta prueba otros modelos y, si no, usa respuestas locales. Para la final, considera activar facturación en Google AI Studio o crear otra clave |
| `VITE_POLLAR_KEY` | ✅ Production y Preview (2026-11-21); Google y correo activos en la web publicada | En el panel de Pollar, *Domains* debe incluir `https://awayu-two.vercel.app`. Borrar en Vercel la variable de prueba `VITE_POLLAR_KEY_TEST_DUMMY` |
| `POLLAR_KEY` | Cargada, pero la web no la usa | Puedes borrarla: la web solo lee `VITE_POLLAR_KEY` (la clave publicable `pub_testnet_…`). Nunca pongas la secreta `sec_…` en una variable `VITE_` |
| `TRUSTLESS_API_KEY` | Solo en **Preview** | Opcional: la integración figura como planificada y la web publicada no la usa |
| `N8N_WEBHOOK_URL`, `N8N_SECRET` | ❌ Faltan (opcional) | Importar los 3 flujos de `automations/n8n/flujos/` y cargar la Production URL del webhook `awayu-eventos`. Ver `automations/n8n/README.md` |
| GitHub → Vercel (despliegue automático) | ❌ No conectado | Vercel → proyecto awayu → Settings → Git → Connect |
| MCP de Stellar (**Raven**) | ❌ No agregado | Ver sección C |
| MCP de Pollar | ❌ No agregado | Ver sección C |
| Stellar Expert (contratos verificados) | ⏳ Solicitud aceptada, figura "unverified" | Nada que hacer: lo procesan ellos |

## 0. Lo que pidió el análisis de IA de Atlas (antes del cierre: 22-nov a las 11:59, hora de Bolivia)
1. **Validación (Richard o natalyfer):** entrevistar entre 5 y 10 organizadores de pasanaku con el guion de `docs/VALIDACION.md` y subir los resultados con su propia cuenta de GitHub.
2. **Cooperativas (natalyfer):** enviar el mensaje de `docs/COOPERATIVAS.md` a 2 o 3 cooperativas con `docs/ejemplo-reporte-historial.pdf` adjunto, y anotar cada respuesta, aunque sea negativa.
3. **Equipo:** cada integrante sube su parte con su propia cuenta y completa su fila en `docs/EQUIPO.md` y su perfil en Atlas (GitHub o LinkedIn y una descripción real). Luis los agrega como colaboradores.
4. **Video:** subir `video/awayu-flujo-onchain.mp4` a YouTube como "No listado" y pegar el enlace en Atlas.
5. **Formulario de Atlas:** actualizarlo con los textos corregidos (archivo local `docs/ATLAS-FORMULARIO.md`, que no se sube al repositorio). Incluye la etapa, el cliente, el precio, el deck y los enlaces de tracción.
6. **Segunda evaluación:** usar "Analizar de nuevo" solo después de los puntos 1 a 5, porque es la última.

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
| **n8n** | Avisos por ntfy.sh (sin cuentas personales), registro de eventos, resumen semanal y monitor de la web | https://n8n.io (prueba gratis) → importa los 3 archivos de `automations/n8n/flujos/` | `N8N_WEBHOOK_URL` y, opcional, `N8N_SECRET` |

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
- **Stellar (Raven, oficial de la SDF)**: documentación, datos del ecosistema y guías para agentes, sin claves. En una terminal:
  ```
  claude mcp add --transport http stellar-raven "https://raven.stellar.org/mcp"
  ```
  Luego, dentro de Claude Code, `/mcp` → **stellar-raven** → **Authenticate** e inicia sesión. (Para Codex se agrega el mismo endpoint en su configuración de MCP.)
- **Stellar (otras opciones)**: ofrece la **Stellar CLI para agentes** (ya la usamos) y la documentación para IA en https://developers.stellar.org/llms.txt. Hay MCP de la comunidad (por ejemplo `stellar-mcp` de syronlabs o `chronos-mcp`), pero piden claves secretas: no los recomiendo para cuentas reales.
- **Vercel** (opcional): en claude.ai → *Settings → Connectors → Vercel* → da acceso al equipo **radar-tech** para que Claude lea registros y errores en vivo.

## D. Pruebas que solo tú puedes hacer (30 min)
1. **Freighter**: instala https://www.freighter.app en Chrome, crea una billetera, elige **Testnet**. En Awayu: *Conectar billetera → Freighter*, acepta los términos y prueba aportar en un círculo, apoyar una Minka y crear una meta de Alasitas.
2. **Pagos por QR (SEP-7)**: instala LOBSTR en tu celular con una cuenta de testnet, abre *Billetera → Recibir con QR* en la computadora y escanéalo.
3. **Voz de Amawta**: en Chrome abre *Amawta*, toca 🎤 y permite el micrófono; toca 🔊 para escuchar una respuesta.
4. **Escanear**: en el celular abre *Escanear QR* y apunta a la invitación de un círculo.

## E. Para operar con dinero real (después del hackatón)
- **Koywe** (https://docs.koywe.com): rampa de entrada y salida que cubre **Bolivia**, con KYC y webhooks; está en la lista del *Integration Track* del SCF. Pedir cuenta de prueba en su sitio para evaluar la integración.
- **Banco Central de Bolivia – OpenBCB**: API gratuita para generar QR interoperables y recibir avisos de pago. Requiere habilitar una cuenta transitoria con el BCB: consulta la sección OpenBCB en https://www.bcb.gob.bo.
- **Registro como proveedor de servicios de activos virtuales** ante la UIF, o alianza con una Empresa de Tecnología Financiera autorizada por ASFI. Ver la página *Legal y privacidad* de la web y consultar con un abogado.
- **Auditoría** de los contratos antes de mainnet.

## Lo que NO hace falta comprar
Nada para el hackatón: testnet, Vercel Hobby, Gemini (cuota gratuita), Pollar en testnet, Freighter, LOBSTR, GitHub Actions y la voz del navegador son gratis. Un dominio propio es opcional.
