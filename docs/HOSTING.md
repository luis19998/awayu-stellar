# Hosting: Vercel o Netlify

**Decisión (2026-11-19): Vercel como destino principal; Netlify como espejo mientras se activa el acceso.**

| | Vercel Hobby | Netlify Free |
|---|---|---|
| Despliegues | Ilimitados (hasta 100 por día), automáticos en cada push | Cada despliegue de producción gasta créditos de una bolsa mensual de 300 |
| Vistas previas por rama | Sí, automáticas: cada rama de Codex (`codex/*`) tiene su URL | Sí, también gastan créditos |
| Funciones | `web/api/*.js` (amawta, eventos, og) sin cambios | `netlify/functions/*.mjs`, mismos servicios |
| IA | AI SDK y AI Gateway (crédito gratuito mensual) | AI Gateway de Netlify |
| Datos | Blob, Edge Config y Upstash Redis del Marketplace para la memoria colectiva fuera de la cadena | Netlify Blobs |
| Métricas | Web Analytics y Speed Insights gratis | De pago |
| Uso comercial | Hobby es para uso personal y no comercial: alcanza para el hackatón; para operar como startup hay que pasar a Pro o volver a Netlify | Permitido dentro de los límites |

**Por qué Vercel:** en un hackatón se despliega muchas veces por día y en paralelo con Codex. En Netlify cada despliegue gasta créditos, y la cuenta anterior ya se quedó sin ellos una vez. Vercel no tiene ese tope y crea una vista previa por rama, que es justo el flujo Claude Code + Codex.

**Estado (2026-11-19):** migrado. Producción en **https://awayu-two.vercel.app** (proyecto `awayu`, equipo `radar-tech`, raíz `web`, Vite, Node 22), con las funciones `/api/amawta`, `/api/eventos` y `/api/og`. Se despliega con `vercel deploy --prod` desde la raíz del repo (`.vercelignore` deja afuera `referencias/`, `assets/` y `contracts/`). Para que cada push despliegue solo y cada rama tenga vista previa, falta instalar la app de Vercel en GitHub con acceso a `luis19998/awayu-stellar` y correr `vercel git connect`. Netlify (`https://awayu-pasanaku.netlify.app`) queda como espejo.

**Variables de entorno** (en el panel del proveedor, nunca en el repositorio): `GEMINI_API_KEY`, `GEMINI_MODEL`, `N8N_WEBHOOK_URL`, `N8N_SECRET`, `VITE_POLLAR_KEY`, y la clave de Trustless Work en un proxy de servidor.
