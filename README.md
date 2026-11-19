# Awayu · el pasanaku que teje tu historial

Pasanaku (círculo de ahorro rotativo) sobre **Stellar** para el hackatón **Stellar Bolivia 2026**.
Demo pública: **https://awayu-pasanaku.netlify.app**

- **El problema:** en Bolivia millones de personas ahorran en pasanakus. Funcionan por confianza, se rompen cuando alguien no paga y no dejan ningún historial que sirva para pedir un crédito. Además, con la escasez de dólares, el ahorro en bolivianos pierde valor.
- **La solución:** las cuotas se pagan en dólares digitales y las reglas viven en un contrato Soroban. El orden de cobro lo sortea la red. Una **garantía** opcional cubre a quien no paga, así quien cobra recibe el pozo completo. Cada ronda deja una marca (a tiempo, tarde, faltó, cubierto) que la web teje como un **aguayo 3D**: evidencia de pagos portable y verificable.
- **Ecosistema:** login sin frase semilla con **Pollar** (Google, correo) o **Freighter**; el pozo que espera puede rendir en **Vaquita** (pools de Blend y DeFindex). En esta demo el rendimiento es una proyección.

## Qué hace

| Función | Dónde |
|---|---|
| Crear un círculo desde la web: cuota, duración de ronda y miembros; se despliega desde el wasm ya instalado en testnet | Web → «Crear un pasanaku» |
| Aportar, pagar el pozo, dejar y retirar garantía, guardar tu nombre en la cadena | Web (testnet, con billetera) |
| Turno sorteado en la cadena, marcas por ronda, puntaje 0–100, garantías, alias | `contracts/pasanaku` (v3) |
| Historial de pozos, garantías y rondas cubiertas leído de los eventos del contrato, con enlaces a Stellar Expert | Panel «Historial del círculo» |
| Certificado PNG del aguayo de cada persona | Ficha del miembro |
| Simulador: adelanto y ahorro por turno, rendimiento estimado | «Simulador» |
| Demo personalizable (miembros, cuota, rondas), cuatro estilos de aguayo, castellano e inglés, sonido | «Personalizar», botones superiores |
| Recorrido guiado de 6 pasos para el pitch | «Contar la historia» |
| App instalable (PWA), accesible con teclado, liviana en celulares | — |

## 3D

- Escena en three.js: mesa con aguayo procedural, pilas de tejido por miembro, haz de luz del turno, anillo de plazo y monedas que vuelan.
- **Cántaro** pintado a mano e **illa** (llamita tallada, amuleto de prosperidad que corona la mejor reputación): modelados por código en **Blender** (`assets/blender/modelos.py`).
- **Moneda** paramétrica con rombos de aguayo: modelada en **Fusion 360** (`assets/fusion/moneda.f3d`, también en STEP y STL) y convertida a GLB con Blender (`assets/blender/moneda.py`).

## Estructura

| Carpeta | Contenido |
|---|---|
| `contracts/pasanaku` | Contrato Soroban (Rust, soroban-sdk 28) y sus 10 pruebas. |
| `web` | Vite + three.js + stellar-sdk + Pollar; pruebas con Vitest. |
| `assets` | Fuentes de los modelos 3D y de los íconos. |
| `scripts/demo-testnet.sh` | Despliega un círculo de prueba con alias y garantías y juega tres rondas. |
| `docs` | Pitch, arquitectura, revisión de seguridad del contrato y plan del reto. |
| `.github/workflows` | Contrato (pruebas y wasm), Web (pruebas y build) y Demo en testnet. |

## Probar

```bash
npm --prefix web install
npm --prefix web run dev      # http://localhost:5173
npm --prefix web test         # pruebas de la web
node web/scripts-e2e.mjs      # crear, aportar y cobrar en testnet con cuentas efímeras
```

Contrato (Linux, macOS, Codespaces o CI): `cargo test` y `stellar contract build`.

## Con billetera

1. Instalá [Freighter](https://www.freighter.app/) y elegí la red **Testnet** (o entrá con Google vía Pollar si la web tiene `VITE_POLLAR_KEY`).
2. **Conectar billetera**: si la cuenta no existe en testnet, la web la fondea con Friendbot.
3. **Crear un pasanaku** y **Compartir enlace** (`?c=C…`): cada miembro abre el enlace, conecta su billetera, aporta y, si quiere, deja garantía. Cuando todos aportaron o venció el plazo, cualquiera paga el pozo.

## Qué es real y qué es simulado

- Real en testnet: contrato, sorteo, aportes, pozos, garantías, alias, marcas y eventos.
- Simulado: el modo demo, la proyección de rendimiento de Vaquita y el monto de microcrédito ilustrativo. El aguayo es evidencia de pagos, no una aprobación de crédito.

## Cómo se construyó

Claude Code y Codex trabajaron en paralelo en ramas separadas (ver `AGENTS.md`): Claude Code hizo contrato, escena 3D, modelos y funciones; Codex hizo pruebas, CI, sonido, certificado, documentación y dos revisiones de seguridad cuyos hallazgos se corrigieron.
