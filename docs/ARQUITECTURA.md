# Arquitectura de Awayu

## Componentes

```mermaid
flowchart LR
  Persona[Participante]
  subgraph Sitio[Web estática en Netlify]
    UI[Interfaz Vite]
    Demo[Modelo demo simulado]
    Chain[Cliente Stellar SDK]
  end
  Wallet[Billetera Freighter]
  Pollar[Pollar: acceso y firma]
  RPC[Stellar Soroban RPC]
  Contract[Contrato Pasanaku Soroban]
  Token[Token SAC · XLM de testnet]
  GH[GitHub Actions]
  Repo[Repositorio GitHub]
  Artifact[Artefacto testnet.json]

  Persona --> UI
  UI --> Demo
  UI --> Chain
  Chain --> RPC
  RPC --> Contract
  Contract --> Token
  Chain --> Wallet
  Chain --> Pollar
  Wallet -. firma autorizada .-> RPC
  Pollar -. firma y envío .-> RPC
  Repo --> GH
  GH -->|pruebas y wasm del contrato| Artifact
  Artifact -. descarga manual a web/public .-> Repo
  Repo -->|build y publicación| Sitio
```

Netlify publica el build estático de `web/`. Sin un despliegue de testnet cargado, la interfaz puede funcionar en el modo demo local. El flujo de testnet lee `testnet.json` para conocer RPC, token y contrato. GitHub Actions prueba y compila el contrato; el workflow manual crea un círculo de prueba y entrega `testnet.json` como artefacto para descargar a `web/public/` antes de publicar ese despliegue.

Freighter y Pollar firman acciones autorizadas por el participante. La lectura del estado del círculo se hace mediante Stellar RPC; las operaciones firmadas se envían y se consultan hasta su resultado. Pollar está habilitado solo cuando se configura `VITE_POLLAR_KEY`.

## Flujo de una ronda

```mermaid
sequenceDiagram
  actor M as Miembros
  participant W as Web Awayu
  participant F as Freighter o Pollar
  participant R as Stellar RPC
  participant C as Contrato Pasanaku
  participant T as Token SAC

  W->>R: Lee get_config, round_info, history y members
  R->>C: Simula consultas de solo lectura
  C-->>W: Orden, turno, plazo, aportes, alias y marcas
  M->>W: Aporta la cuota
  W->>F: Solicita firma de contribute
  F-->>W: Transacción firmada
  W->>R: Envía transacción
  R->>C: Ejecuta contribute
  C->>T: Transfiere cuota al contrato
  C-->>R: Guarda marca y emite evento
  R-->>W: Resultado y hash
  M->>W: Solicita cerrar la ronda cuando todos pagaron o venció el plazo
  W->>F: Solicita firma de payout
  F-->>W: Transacción firmada
  W->>R: Envía payout
  R->>C: Ejecuta payout
  C->>T: Paga el pozo al miembro de turno
  C-->>R: Registra faltas o cobertura de garantía y avanza ronda
  R-->>W: Resultado verificable
```

El contrato permite que cualquier cuenta invoque `payout()` cuando ya aportaron todos o venció el plazo. El orden de cobro se fija al crear el círculo mediante el PRNG de la red. Si alguien no aportó y dejó una garantía suficiente, esa garantía cubre la cuota; si no, queda la marca de falta. El aguayo 3D se construye en la web a partir de las marcas. En el modo demo esos cambios son solo estado local simulado.
