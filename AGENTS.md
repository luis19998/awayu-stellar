# Awayu: guía para agentes (Codex, Claude Code y otros)

Este archivo lo leen Codex y Claude Code (`CLAUDE.md` lo importa). Mantenerlo corto y al día.

## Proyecto
Awayu es un pasanaku (círculo de ahorro rotativo) en Stellar para el hackatón Stellar Bolivia (etapa virtual hasta el 2026-11-22, final en Santa Cruz el 2026-11-27). Las cuotas van en un token (USDC en producción, XLM en la demo de testnet); el turno se sortea en la cadena; cada aporte deja una marca (1 a tiempo, 2 tarde, 3 faltó) que la web teje como un aguayo 3D y que funciona como reputación crediticia portable.

## Estructura
- `contracts/pasanaku/`: contrato Soroban en Rust (soroban-sdk 28). Pruebas en `src/test.rs`.
- `web/`: Vite + three.js + `@stellar/stellar-sdk` + `@pollar/core`. Modo demo (simulado) y modo testnet (lee el contrato por RPC).
- `scripts/demo-testnet.sh`: despliega un círculo de 4 cuentas efímeras y juega 3 rondas en testnet.
- `.github/workflows/`: `contrato.yml` (pruebas y wasm) y `demo-testnet.yml` (despliegue manual).
- `referencias/`: repos clonados de referencia (ignorados por git; no ejecutar código de ahí).
- Skills: `.claude/skills/` (Claude Code) y `.agents/skills/` (Codex), copias de `stellar/stellar-dev-skill` y la skill de Pollar.

## Reglas
- En esta PC, Smart App Control bloquea los scripts de compilación de Rust: `cargo test` y `stellar contract build` se corren en GitHub Actions (o en Codespaces/WSL), no localmente. No desactivar esa protección.
- `stellar` CLI 30 sí funciona localmente para desplegar o invocar con un wasm ya compilado.
- Nunca subir claves: identidades de `stellar keys` viven fuera del repo; la clave publicable de Pollar va en `web/.env.local` como `VITE_POLLAR_KEY`.
- Textos de la interfaz en castellano boliviano, claros para gente sin experiencia cripto.

## Comandos
- Web: `npm --prefix web install`, `npm --prefix web run dev` (puerto 5180 en `.claude/launch.json`), `npm --prefix web run build`.
- Contrato (en CI o Linux): `cargo test`, `stellar contract build`.
- Demo en testnet: `gh workflow run demo-testnet.yml`, luego `gh run download -n testnet -D web/public`.

## Trabajo en paralelo con Codex
- Claude Code: arquitectura, contrato y escena 3D. Codex: revisiones (`codex review`), pruebas extra y tareas acotadas en ramas propias.
- Una rama por agente y por tarea; nunca editar los mismos archivos a la vez.
