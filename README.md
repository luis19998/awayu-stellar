# Awayu · el pasanaku que teje tu historial

Pasanaku (círculo de ahorro rotativo) en **Stellar** para el hackatón **Stellar Bolivia 2026**.

- **El problema:** en Bolivia millones de personas ahorran en pasanakus. Funcionan por confianza, se rompen cuando alguien no paga y no dejan ningún historial que sirva para pedir un crédito. Además, con la escasez de dólares, el ahorro en bolivianos pierde valor.
- **La solución:** las cuotas se pagan en dólares digitales (USDC) y las reglas viven en un contrato Soroban. El orden de cobro se sortea en la cadena. Cada pago deja una marca (a tiempo, tarde o faltó) que la web teje como un **aguayo 3D**: ese tejido es una reputación crediticia portable y verificable.
- **Ecosistema:** login sin frase semilla con **Pollar** (Google, correo o Freighter); el pozo que espera puede rendir en **Vaquita** (pools de Blend y DeFindex, también disponibles vía Pollar Earn).

## Qué hay en este repositorio

| Carpeta | Contenido |
|---|---|
| `contracts/pasanaku` | Contrato Soroban: `contribute`, `payout`, `history`, `score`, `round_info`, sorteo con PRNG. |
| `web` | Escena 3D (three.js) con modo demo y modo testnet (lee el contrato real por RPC). |
| `scripts/demo-testnet.sh` | Despliega un círculo de prueba y juega tres rondas en testnet. |
| `.github/workflows` | Pruebas y compilación del wasm; despliegue de la demo. |

## Probar

```bash
npm --prefix web install
npm --prefix web run dev      # http://localhost:5173
```

Contrato (Linux, macOS, Codespaces o CI): `cargo test` y `stellar contract build`.

## Estado

Base del proyecto (2026-11-17). Pendiente: firmar aportes desde la web con Pollar o Freighter, token USDC de testnet, integración real con Vaquita, garantía para quien no paga y video del pitch.
