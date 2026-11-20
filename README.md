# Awayu · el pasanaku que teje tu historial

Pasanaku (círculo de ahorro rotativo) sobre **Stellar** para el hackatón **Stellar Bolivia 2026**.
Demo pública: **https://awayu-two.vercel.app** (espejo: https://awayu-pasanaku.netlify.app)

- **El problema:** en Bolivia millones de personas ahorran en pasanakus. Funcionan por confianza, se rompen cuando alguien no paga y no dejan ningún historial que sirva para pedir un crédito. Además, con la escasez de dólares, el ahorro en bolivianos pierde valor.
- **La solución:** las cuotas se pagan en dólares digitales y las reglas viven en un contrato Soroban. El orden de cobro lo sortea la red. Una **garantía** opcional cubre a quien no paga, así quien cobra recibe el pozo completo. Cada ronda deja una marca (a tiempo, tarde, faltó, cubierto) que la web teje como un **aguayo 3D**: evidencia de pagos portable y verificable.
- **Ecosistema:** login sin frase semilla con **Pollar** (Google, correo) o **Freighter**; el pozo que espera puede rendir en **Vaquita** (pools de Blend y DeFindex). En esta demo el rendimiento es una proyección.

## Panel

Nueve secciones: **Inicio** (fotos reales, métricas en vivo del registro on-chain y de Stellar), **Círculo 3D**, **Mapa de Bolivia** (círculos del registro por departamento), **Billetera y pasaporte** (planeta 3D con saldos de Horizon y reputación sumada de todos los círculos), **Probabilidades** (Monte Carlo y modelo Beta-Bernoulli), **Juegos** (tejido, quiz y sorteo justo, sin dinero), **Amawta** (IA con Gemini y respaldo local), **Ecosistema** (estado en vivo de cada integración) y **Pulso de Stellar** (ledgers en vivo).

Personalización: 36 personajes estilo Alasitas, 6 escenarios (incluye el salar de Uyuni y el Titicaca con reflejo real), 5 vasijas, 5 mesas y 4 estilos de aguayo.

Cinco contratos Soroban en testnet, todos con actividad real:

| Contrato | Qué hace | Dirección | Probar |
|---|---|---|---|
| `pasanaku` v3 | Ahorro rotativo con garantías, alias y TTL | [`CAF7V3…KGBS`](https://stellar.expert/explorer/testnet/contract/CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS;;) |
| `registro` | Memoria colectiva: círculos, miembros, regiones y avales | [`CAIOIV…NVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD;;) |
| `ayni` v2 | Fondo de ayuda mutua: cualquiera se une pagando su primera cuota; pedidos, votos con quórum y devolución sin intereses | [`CCBWIP…XNAF`](https://stellar.expert/explorer/testnet/contract/CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF;;) |
| `minka` | Proyectos comunitarios con fondos liberados por hitos aprobados | [`CCN6R6…VTG2`](https://stellar.expert/explorer/testnet/contract/CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2;;) |
| `alasitas` | Metas de ahorro individuales o grupales con racha y bloqueo por fecha | [`CDUKQ4…572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N;;) |

Compilación verificable (SEP-55): cada wasm lleva `source_repo` en sus metadatos, GitHub firma su procedencia y se publica como release; `stellar contract info build --id <contrato> --network testnet` muestra el workflow y el commit que lo compilaron.

Integraciones: Pollar (login, Earn con Blend/DeFindex, swaps y rampas), Trustless Work (escrow de garantías), n8n (tres flujos) y Gemini. Ver `docs/INTEGRACIONES.md`, `docs/REGISTRO.md`, `docs/SERVICIOS.md` y `docs/HOSTING.md`.

Lighthouse (escritorio): rendimiento 70, accesibilidad 100, buenas prácticas 100, SEO 100.

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
| `scripts/modos-testnet.sh` | Despliega Ayni, Minka y Alasitas y les da actividad real (pedidos, votos, hitos, metas). |
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
