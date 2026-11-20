# Stellar Starter Kit y Stellar Lab: qué sirve para Awayu

Análisis del 2026-11-20 de https://github.com/Fsk8/stellar-starter-kit (clonado en `referencias/stellar-starter-kit`, carpeta ignorada por git) y de https://lab.stellar.org.

## 1. Qué es el starter kit
Un taller "Stellar Build Lab": un contrato Soroban mínimo (Muro de Ideas: `post_idea`, `get_last_idea`, `get_count`, soroban-sdk 22) y un frontend React + Vite + TypeScript + Tailwind con **Stellar Wallets Kit**. Incluye dos guías: instalación por sistema operativo y cómo pasar de la plantilla a una idea propia.

## 2. Estado de instalación en esta PC
| Herramienta que pide el kit | Estado |
|---|---|
| Git | 2.55 instalado |
| Node.js (v18+) | v24.22 instalado |
| Rust + Cargo | 1.100 instalado (toolchain GNU) |
| Destino `wasm32v1-none` | instalado (es el que usa la Stellar CLI actual) |
| Destino `wasm32-unknown-unknown` | opcional; la descarga de rustup se quedó trabada y no hace falta |
| Stellar CLI | 30.0.1 instalada |
| VS Code | 1.145 instalado |
| Frontend del kit | `npm ci` y `npm run build` correctos en `referencias/stellar-starter-kit/frontend` |
| Compilar contratos en esta PC | Smart App Control bloquea los scripts de compilación de Rust: los contratos se compilan en GitHub Actions (ver `AGENTS.md`) |

Para ver el kit funcionando: en `referencias/stellar-starter-kit/frontend` ejecuta `npm run dev` y abre http://localhost:5173 (usa el contrato de ejemplo `CCYNBF2VN7LYU6NZPBHIENJODRX2L3LVWYCKC3FEJCYKX7FAE5PPUMY3`).

## 3. Lo valioso que se aplicó a Awayu
1. **Stellar Wallets Kit v2** (el mismo que usa Stellar Lab): nueva opción "Otra billetera" con **Albedo** (no requiere instalar nada), **xBull**, **LOBSTR**, **Rabet** y **Hana**. La guía del kit advierte que **Freighter puede tener restricciones regionales**: con esto un jurado o usuario en Bolivia siempre tiene una forma de firmar. Se carga solo al elegirla (`web/src/wallet.js`).
2. **Compilación verificable (SEP-55)**: Stellar Lab marcaba los contratos como *Unverified Build*. Los workflows de despliegue ahora compilan con `--meta source_repo=github:luis19998/awayu-stellar --meta home_domain=awayu-two.vercel.app`, firman la procedencia con `actions/attest-build-provenance`, publican un release con los wasm y avisan a la API de validación de Stellar Expert. `stellar contract info build --id <contrato> --network testnet` confirma la atestación.
3. **Enlaces "Probar en Stellar Lab"** en la sección Ecosistema: abren el explorador de contratos de Lab, que muestra interfaz, almacenamiento y verificación, y permite **invocar funciones desde el navegador** con una billetera.

## 4. Datos útiles de Stellar Lab (lab.stellar.org)
- **Crear cuenta** (`/account/create`): genera un par de claves temporal (solo dura la sesión del navegador) y lo fondea con 10 000 XLM de prueba (Friendbot). Útil para que alguien pruebe Awayu sin billetera instalada: importar esa clave en xBull o Albedo.
- **Fondear cuenta** (`/account/fund`): pega una dirección `G…` y recibe XLM de testnet.
- **Explorador de contratos**: información, invocación, interfaz (spec), metadatos, código fuente si está verificado, almacenamiento, **bindings** (genera clientes TypeScript) e historial de versiones.
- **Constructor y tablero de transacciones**, firma de mensajes, conversión XDR ↔ JSON y diferencias entre XDR (para depurar errores de firma).
- **Explorador de API**: todos los métodos RPC (`getEvents`, `simulateTransaction`, `getLedgerEntries`…) y endpoints de Horizon con ejemplos.
- **Aviso vigente**: la red principal vota el **23 de noviembre de 2026** la actualización al Protocolo 30 ("Bell"). Testnet y la Stellar CLI 30 ya están en esa versión; no afecta la demo.

## 5. Consejos del kit que conviene recordar
- Cada despliegue crea un contrato **nuevo** con datos vacíos: actualizar los ids (en Awayu, `web/public/testnet.json`).
- Probar primero con `stellar contract invoke` antes de tocar el frontend.
- `instance()` para pocos datos globales; `persistent()` con una clave por elemento para lo que crece (Awayu ya lo hace).
- No ejecutar `npm audit fix --force`: puede cambiar de versión mayor librerías como el kit de billeteras.
- Errores típicos: `Bad union switch` (versiones del SDK desalineadas), `Account not found` (cuenta sin fondear), firma fallida (billetera en Mainnet en vez de Testnet).
