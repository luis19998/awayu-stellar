# Awayu: guía para agentes (Codex, Claude Code y otros)

Este archivo lo leen Codex y Claude Code (`CLAUDE.md` lo importa). Mantenerlo corto y al día.

## Proyecto
Awayu es un pasanaku (círculo de ahorro rotativo) en Stellar para el hackatón Stellar Bolivia (etapa virtual hasta el 2026-11-22, final en Santa Cruz el 2026-11-27). Las cuotas van en un token (USDC en producción, XLM en la demo de testnet); el turno se sortea en la cadena; cada aporte deja una marca (1 a tiempo, 2 tarde, 3 faltó) que la web teje como un aguayo 3D y que funciona como reputación crediticia portable.

## Estructura
- `contracts/pasanaku/`: contrato Soroban en Rust (soroban-sdk 28), versión 3 (garantías, alias, TTL renovado). Pruebas en `src/test.rs`.
- `web/`: Vite + three.js + `@stellar/stellar-sdk` + `@pollar/core`. Modo demo (simulado) y modo testnet (lee el contrato por RPC).
- `scripts/demo-testnet.sh`: despliega un círculo de 4 cuentas efímeras y juega 3 rondas en testnet.
- `.github/workflows/`: `contrato.yml` (pruebas y wasm) y `demo-testnet.yml` (despliegue manual).
- `referencias/`: repos clonados de referencia (ignorados por git; no ejecutar código de ahí).
- Skills: `.claude/skills/` (Claude Code) y `.agents/skills/` (Codex), copias de `stellar/stellar-dev-skill` y la skill de Pollar.

## Reglas
- En esta PC, Smart App Control bloquea los scripts de compilación de Rust: `cargo test` y `stellar contract build` se corren en GitHub Actions (o en Codespaces/WSL), no localmente. No desactivar esa protección.
- `stellar` CLI 30 sí funciona localmente para desplegar o invocar con un wasm ya compilado.
- Nunca subir claves: identidades de `stellar keys` viven fuera del repo; la clave publicable de Pollar va en `web/.env.local` como `VITE_POLLAR_KEY`.
- Textos de la interfaz en español neutro (tuteo, sin voseo ni modismos de un país: "dinero", no "plata"), claros para gente sin experiencia cripto. Se conservan los nombres culturales andinos (pasanaku, ayni, minka, alasitas, aguayo, pollera).
- Idiomas de la web: español (base), inglés, portugués, quechua, aymara y guaraní. Todo texto nuevo debe tener las seis versiones o caer al español de forma explícita.
- Cada acción nueva de la interfaz lleva su tutorial en video (tema en `HELP_TOPICS` y `ROUTE_TOPICS` de `web/src/guide/help.js`).

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
