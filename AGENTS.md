# Awayu: guía para agentes (Codex, Claude Code y otros)

Este archivo lo leen Codex y Claude Code (`CLAUDE.md` lo importa). Mantenerlo corto y al día.

## Proyecto
Awayu lleva a Stellar/Soroban cuatro formas bolivianas de ahorrar y ayudarse (pasanaku, ayni, minka, alasitas) y otras de Latinoamérica. Cada pago deja una marca (1 a tiempo, 2 tarde, 3 faltó, 4 cubierto por garantía) que forma un historial verificable para cooperativas. Todo funciona en **testnet** con dinero de prueba (USDC de prueba de Circle y XLM). Equipo Stark Neo. Se entregó al National Startups Hackathon by Stellar (2026-11-22, IA de Atlas: 65/100) y a Commit del Mes (hasta el 2026-11-27).

## Estado al 2026-11-28 (lee esto antes de trabajar)
- Web publicada: https://awayu-two.vercel.app (Vercel, despliegue manual con `npx vercel deploy --prod` desde la raíz). Reporte para cooperativas en `/reporte.html`.
- Siete contratos en testnet: IDs en `web/public/testnet.json`, con su hash de wasm en `docs/CONTRATOS.md`. Evidencia en `docs/EVIDENCIA.md` y `docs/EVIDENCIA-CONTRATOS-NUEVOS.md`; métricas en `docs/METRICAS.md`.
- Pendiente, por prioridad:
  1. Validación real con comerciantes y cooperativas (`docs/VALIDACION.md`, `docs/COOPERATIVAS.md`). **Nunca inventar datos.**
  2. Que el `pasanaku` v4 use el contrato `sorteo` para el orden de cobro.
  3. Conectar `remate` a la creación de círculos en la web.
  4. Revisión de quechua, aymara y guaraní por hablantes.
  5. El camino a dinero real de `docs/PAGOS-REALES.md`.
- Historial por fecha: `CHANGELOG.md`. Cómo contribuir: `CONTRIBUTING.md`.

## Estructura
- `contracts/`: siete contratos Soroban en Rust (soroban-sdk 28), cada uno con `src/test.rs` (52 pruebas en total).
  - `pasanaku` (v3: turno sorteado, garantías, alias, marcas);
  - `registro`, `ayni` (v2), `minka`, `alasitas`;
  - `sorteo` (compromiso y revelación);
  - `remate` (junta con remate y consórcio).
- `web/`: Vite + three.js + `@stellar/stellar-sdk` + `@pollar/core`. Vistas en `web/src/views/`, textos en `web/src/i18n/`, ayuda y tutoriales en `web/src/guide/help.js` y `web/public/tutoriales/`. Pruebas con Vitest (`web/test/`, 205 pruebas).
- Scripts de testnet con cuentas efímeras: `web/evidencia-testnet.mjs`, `web/contratos-nuevos.mjs`, `web/metricas-testnet.mjs`, `web/scripts-e2e.mjs`, `scripts/*.sh`.
- `.github/workflows/`:
  - `contrato.yml`: pruebas y wasm de los 7 contratos, en cualquier rama;
  - `web.yml`;
  - `demo-testnet.yml`, `modos-testnet.yml` y `verificar-contratos.yml` (SEP-55).
- `automations/n8n/flujos/`: automatizaciones sin cuentas personales (avisos por ntfy.sh).
- `video/scripts/`: grabación de tutoriales (`tutoriales.mjs`) y QA de todas las rutas (`qa_rutas.mjs`).
- `referencias/`: repos clonados de referencia (ignorados por git; no ejecutar código de ahí).
- Skills: `.claude/skills/` (Claude Code) y `.agents/skills/` (Codex), copias de `stellar/stellar-dev-skill` y la skill de Pollar.

## Reglas
- En esta PC, Smart App Control bloquea los scripts de compilación de Rust: `cargo test` y `stellar contract build` se corren en GitHub Actions (o en Codespaces/WSL), no localmente. No desactivar esa protección.
- `stellar` CLI 30 sí funciona localmente para desplegar o invocar con un wasm ya compilado.
- Nunca subir claves: identidades de `stellar keys` viven fuera del repo; la clave publicable de Pollar va en `web/.env.local` como `VITE_POLLAR_KEY`.
- Textos de la interfaz en español neutro (tuteo, sin voseo ni modismos de un país: "dinero", no "plata"), claros para gente sin experiencia cripto. Se conservan los nombres culturales andinos (pasanaku, ayni, minka, alasitas, aguayo, pollera).
- Idiomas de la web: español (base), inglés, portugués, quechua, aymara y guaraní. Todo texto nuevo debe tener las seis versiones o caer al español de forma explícita.
- Cada acción nueva de la interfaz lleva su tutorial en video (tema en `HELP_TOPICS` y `ROUTE_TOPICS` de `web/src/guide/help.js`, y en `TOPIC_ORDER` de `web/src/app.js`). Una prueba exige que cada tema tenga su video.
- El puntaje de historial debe coincidir con `score_of` del contrato: división entera. Usa `web/src/reporte/puntaje.js`.
- Honestidad: lo simulado se marca como simulado, y nunca se escribe en presente algo que todavía no pasó.
- Commits con contenido real, cada persona con su propia cuenta.

## Comandos
- Web: `npm --prefix web install`, `npm --prefix web run dev` (puerto 5180 en `.claude/launch.json`), `npm --prefix web run build`.
- Contrato (en CI o Linux): `cargo test`, `stellar contract build`.
- Demo en testnet: `gh workflow run demo-testnet.yml`, luego `gh run download -n testnet -D web/public`.

## Trabajo en paralelo con Codex
- Claude Code: arquitectura, contrato, escena 3D y modelos (Blender por línea de comandos, Fusion 360 por MCP). Codex: pruebas, CI, módulos independientes, documentación y revisiones de seguridad.
- Una rama y un worktree por tarea de Codex (`git worktree add ../awayu-codexN -b codex/<tarea>`); cada brief lista los archivos que Codex no debe tocar.
- Se lanza con `codex exec -s workspace-write -C <worktree> -o <resumen.md> - < brief.md`; para revisiones, `-s read-only` sobre este repo.
- Límites conocidos del sandbox de Codex: sin red (no puede `npm install`) y no puede escribir en `.git` de un worktree, así que Claude Code instala dependencias, revisa el diff, corre pruebas y hace los commits indicando "Trabajo de Codex".
- Nuevos estilos van en `web/src/features.css`; `style.css` es la base.

## Modelos 3D
- `blender --background --factory-startup --python assets/blender/modelos.py` regenera `cantaro.glb` e `illa.glb`; `assets/blender/moneda.py` convierte la moneda de Fusion (`assets/fusion/moneda.stl`).
- El MCP de Blender necesita el servidor del complemento iniciado dentro de Blender; si no, usar la línea de comandos como arriba.
