# Awayu · el pasanaku que teje tu historial

Pasanaku, ayni, minka y alasitas en contratos **Soroban**: cada pago cumplido deja una marca verificable que una cooperativa puede leer. Proyecto para el **National Startups Hackathon by Stellar** (Bolivia, 2026).

**Demo pública:** https://awayu-two.vercel.app · **Video del flujo on-chain (2:43):** https://youtu.be/9UXoV_NVNvA · **Reporte para cooperativas:** https://awayu-two.vercel.app/reporte.html · **Estado:** prototipo público en Stellar testnet (dinero de prueba), todavía sin usuarios externos.

## Prueba en 3 minutos (para jueces)
1. Abre https://awayu-two.vercel.app y toca **Conectar billetera → ⚡ Cuenta de prueba instantánea**. No hay que instalar nada: la web crea una cuenta de testnet en tu navegador y Friendbot la fondea. También funcionan Freighter, xBull, Albedo, Lobstr y Pollar (Google o correo).
2. Toca **＋ Crear un pasanaku**. La cuota viene en **USDC de prueba**. Si tu cuenta no tiene USDC, toca **Obtener USDC de prueba**: la web cambia XLM por USDC en el DEX de Stellar. Pega una segunda dirección (otra billetera tuya o `GDXXDXAHKJD5LS4CTPCFKMF45CPNGQOEOZMLIZ3Q7RVCGRSYRFM7EIF6`), elige la duración de la ronda y firma.
3. En tu círculo, toca **Aportar** y **Dejar garantía**. Cuando todos aportaron o venció el plazo, toca **Pagar el pozo**. Cada botón muestra el enlace de la transacción en Stellar Expert, y el panel **Historial del círculo** lee los eventos del contrato.
4. Abre **Billetera** para ver tu pasaporte y después el **reporte para cooperativas** (`/reporte.html?m=<tu cuenta>`). Muestra las marcas por ronda, el puntaje del contrato e instrucciones para verificarlo todo en Stellar Lab sin confiar en Awayu.
5. Sin billetera: revisa la tabla de abajo. Cada fila es una transacción real y confirmada.

### Transacciones reales por acción (USDC de prueba)
Generadas el 2026-11-21 con `node web/evidencia-testnet.mjs`, con cuentas efímeras cuyas claves no se guardan. La lista completa de 34 transacciones está en [`docs/EVIDENCIA.md`](docs/EVIDENCIA.md).

| Acción | Contrato | Transacción |
|---|---|---|
| Cambiar XLM por USDC de prueba en el DEX | — | [`0ff09521…`](https://stellar.expert/explorer/testnet/tx/0ff09521477b63acdf50818b305d5077b9051e83dda1d14a21b749577229a8cf) |
| Crear el círculo (cuota 5 USDC, turno sorteado en la cadena) | pasanaku [`CDOM3I…A3NG`](https://stellar.expert/explorer/testnet/contract/CDOM3IISV3IUFYSRNUJ7H62L3QEGCU6SNZABQTCEMPSQEHAAQA4VA3NG) | [`7b66fe40…`](https://stellar.expert/explorer/testnet/tx/7b66fe40d52405aa1ca766ed61d122ffe13571b69d4f95bfab4b9ca766975e7e) |
| Dejar garantía | pasanaku | [`8b62e3ec…`](https://stellar.expert/explorer/testnet/tx/8b62e3ec523a2c6e2a006cb87f554f3c0d7505691e13407d4d4477199ee728a9) |
| Aportar la cuota | pasanaku | [`748a568f…`](https://stellar.expert/explorer/testnet/tx/748a568f66f9cf09e6f5c4464adb1f59f149f3087ec9dcfaf48b7b5a75e94d08) |
| Pagar el pozo (todos aportaron) | pasanaku | [`f4b8009b…`](https://stellar.expert/explorer/testnet/tx/f4b8009b05bc5f7dc07aa111f21f906710dff7a81e045741e8d4b0358ad6f8b9) |
| Pagar el pozo: la garantía de Bruno cubrió su cuota (marca 4) | pasanaku | [`18a17853…`](https://stellar.expert/explorer/testnet/tx/18a17853cff262bfac2d8c2e818c209fc66df37b240d6fc324b18f3b837e5071) |
| Anotar el círculo en el registro on-chain | registro [`CAIOIV…NVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | [`1c59a3e4…`](https://stellar.expert/explorer/testnet/tx/1c59a3e4b0eaa4106a859cef77486f2f93ddd738209e00514332431d84f67c97) |
| Pedir ayuda al fondo Ayni | ayni [`CB2RZD…Y63Z`](https://stellar.expert/explorer/testnet/contract/CB2RZDE7USQBJVS4DBXIA6UCTD2VEBTV6DX7FBHXYWVJQJB2IS5RY63Z) | [`e651d747…`](https://stellar.expert/explorer/testnet/tx/e651d747f877f3ddd4856c1e2c054380f43326f6f2439ef3e12bf79be5fd580c) |
| Votar en Ayni | ayni | [`4c6857fe…`](https://stellar.expert/explorer/testnet/tx/4c6857fe721d534a7f9c075146142fb52ddb6f0b9e15c6eb44cd10796f5f6f9c) |
| Resolver: pedido aprobado y pagado | ayni | [`01fdd337…`](https://stellar.expert/explorer/testnet/tx/01fdd337256d71a05f6a2b61df123c51cc973eff7c57a8e33392591e8a3ca9f2) |
| Devolver sin intereses | ayni | [`84006835…`](https://stellar.expert/explorer/testnet/tx/8400683532052c88f481b582b6afe9d94bf7e46cc54b78334e358c7ef6ee7fb2) |
| Aprobar el hito de Minka: se liberan 3 USDC | minka [`CDENQ4…QXWQ`](https://stellar.expert/explorer/testnet/contract/CDENQ4EMC2L3YZPIUB7V25Z3PJ4G45GXCABBVVQ6YUPTBBXSJE7YQXWQ) | [`8891a83e…`](https://stellar.expert/explorer/testnet/tx/8891a83e59fc401dd26780e4758b4bb89a3f244dde152e3ce0b1be2631882403) |
| Depositar en una meta de Alasitas | alasitas [`CDUKQ4…572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | [`592b9a87…`](https://stellar.expert/explorer/testnet/tx/592b9a87512d67372759060961e5501ac2c4e2189553c1e1c61f7a211ed76890) |

### Actividad on-chain
Al 2026-11-26 hay 20 contratos de Awayu desplegados y 12 círculos en el registro. Suman **167 invocaciones**, 148 eventos, 0 errores y **36 cuentas distintas**; el detalle está en [`docs/METRICAS.md`](docs/METRICAS.md). Para ser claros: casi toda esta actividad viene de nuestros scripts y pruebas, y todavía no hay usuarios externos.

## El problema y lo que falta validar
- En Bolivia millones de personas ahorran en pasanakus, sobre todo comerciantes y productores de la economía informal. Funcionan por confianza, se rompen cuando alguien no paga y no dejan un historial que sirva ante una cooperativa. Además, con la escasez de dólares, el ahorro en bolivianos pierde valor.
- **Primer nicho:** comerciantes de mercados de Cochabamba que ya ahorran en pasanaku. **Primer cliente que paga:** cooperativas de ahorro y crédito e IFD, por reporte verificado (hipótesis: Bs 15 por reporte). Ver [`docs/MODELO-NEGOCIO.md`](docs/MODELO-NEGOCIO.md).
- **Validación en curso:** entrevistas con organizadores ([`docs/VALIDACION.md`](docs/VALIDACION.md)) y consultas a cooperativas ([`docs/COOPERATIVAS.md`](docs/COOPERATIVAS.md)). Primera ronda informal (2026-11-22): 6 de 6 contactos cercanos al equipo dicen que un historial verificable les serviría y piden PDF y consulta en línea, que es lo que ya hace el reporte. No son todavía respuestas de cooperativas, y así lo dice el documento: no inventamos datos.

## La solución
- Las reglas viven en contratos Soroban:
  - El turno lo sortea la red.
  - Una **garantía** opcional cubre a quien no paga, así quien cobra recibe el pozo completo.
  - Cada ronda deja una marca: 1 a tiempo, 2 tarde, 3 faltó, 4 cubierto.
- Las cuotas van en **USDC** (dólar digital). En testnet usamos el USDC de prueba de Circle; los círculos de la demo original usan XLM de prueba.
- La web teje las marcas como un **aguayo 3D** y las suma en un pasaporte. El **reporte para cooperativas** muestra esas marcas con enlaces para comprobarlas.
- La cadena prueba qué cuenta pagó, no quién es la persona. El vínculo lo hace la cooperativa con su KYC y una firma de la billetera (ver [`docs/PAGOS-REALES.md`](docs/PAGOS-REALES.md) §6).

## Contratos en testnet
| Contrato | Qué hace | Pruebas | Dirección | Probar |
|---|---|---|---|---|
| `pasanaku` v3 | Ahorro rotativo con garantías, alias y TTL | 10 | [`CAF7V3…KGBS`](https://stellar.expert/explorer/testnet/contract/CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS;;) |
| `registro` | Memoria colectiva: círculos, miembros, regiones y avales | 5 | [`CAIOIV…NVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD;;) |
| `ayni` v2 | Fondo de ayuda mutua: cualquiera se une pagando su primera cuota; pedidos, votos con quórum y devolución sin intereses | 7 | [`CCBWIP…XNAF`](https://stellar.expert/explorer/testnet/contract/CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF;;) |
| `minka` | Proyectos comunitarios con fondos liberados por hitos aprobados | 5 | [`CCN6R6…VTG2`](https://stellar.expert/explorer/testnet/contract/CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2;;) |
| `alasitas` | Metas de ahorro individuales o grupales con racha y bloqueo por fecha | 7 | [`CDUKQ4…572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | [Lab](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N;;) |

**Qué contratos son cuáles:** la tabla de arriba lista los contratos de referencia de la demo. Los de la tabla de evidencia (pasanaku `CDOM3I…`, ayni `CB2RZD…`, minka `CDENQ4…`) son **instancias nuevas creadas desde el mismo wasm** por `web/evidencia-testnet.mjs`, porque en Soroban cada círculo o fondo es su propio contrato. Todas comparten el código de los releases verificados (SEP-55): `stellar contract info build --id <contrato> --network testnet` muestra el mismo repositorio y commit. La tabla completa con el hash del wasm de cada contrato está en [`docs/CONTRATOS.md`](docs/CONTRATOS.md): las instancias de evidencia y las de referencia comparten exactamente el mismo código. Licencia: MIT (`LICENSE`).

Las 52 pruebas de contratos (siete contratos) corren en CI (`contrato.yml`); las de la web, en `web.yml` (Vitest).

**Compilación verificable (SEP-55):** cada wasm lleva `source_repo` en sus metadatos, GitHub firma su procedencia y se publica como release. `stellar contract info build --id <contrato> --network testnet` muestra el workflow y el commit que lo compilaron.

### Límites del sorteo
El orden de cobro se sortea al crear el círculo con `env.prng()`, el generador de la red. Sirve para la demo y para montos chicos, pero no para un sorteo de alto valor: la semilla depende de datos del ledger, y quien envía la transacción puede reintentarla hasta obtener un orden que le convenga.

La solución ya está en testnet como contrato aparte, **`sorteo`**, con **compromiso y revelación**: cada persona publica primero la huella de un secreto y después lo revela, y el orden sale de todos los secretos juntos; quien no revela queda al final. Falta que el `pasanaku` v4 lo use para el orden de cobro. Mientras tanto, **Verificar → Sorteo** publica el compromiso de la lista antes de sortear, para que cualquiera compruebe que no se cambió. Detalle en [`docs/SORTEO-COMPROMISO.md`](docs/SORTEO-COMPROMISO.md) y [`docs/PAGOS-REALES.md`](docs/PAGOS-REALES.md) §4.

## Integraciones
| Integración | Estado |
|---|---|
| Stellar Wallets Kit (Freighter, xBull, Albedo, Lobstr, Rabet, Hana) | Funciona en testnet |
| Cuenta de prueba instantánea (solo testnet) | Funciona: clave en la sesión del navegador, se borra al cerrar la pestaña |
| Pollar: ingreso con Google o correo, sin frase semilla | Funciona cuando la clave publicable está cargada (`VITE_POLLAR_KEY`) |
| USDC de prueba de Circle y DEX de Stellar | Funciona: círculos y cambio XLM → USDC |
| Pagos por QR (SEP-7) e invitaciones por QR | Funciona |
| Horizon y RPC de Soroban | Saldos, eventos e historial en vivo |
| Gemini (asistente Amawta) | Funciona, con respuestas locales si se agota la cuota |
| Rampas en bolivianos con QR bancario (Pollar) | Interfaz lista; requiere activar un proveedor en el panel de Pollar |
| Rendimiento del pozo con Vaquita (Blend y DeFindex) | Proyección ilustrativa, no mueve fondos |
| Trustless Work (escrow) | **Planificado.** Hay un módulo de llamadas REST (`web/src/integrations/trustless.js`), pero la garantía real vive en el contrato `pasanaku` |
| n8n (recordatorios) | **Preparado.** Los flujos están en `automations/n8n/`; falta conectar la instancia |

## Qué hace la web
| Función | Dónde |
|---|---|
| Crear un círculo en USDC o XLM de prueba: cuota, duración de ronda y miembros | «Crear un pasanaku» |
| Aportar, pagar el pozo, dejar y retirar garantía, guardar tu nombre en la cadena | Círculo (con billetera) |
| Ayni, Minka y Alasitas con sus contratos | Menú lateral |
| Historial de pozos y garantías leído de los eventos, con enlaces a Stellar Expert | «Historial del círculo» |
| Pasaporte: reputación sumada de todos tus círculos | «Billetera» |
| Reporte de historial para cooperativas, imprimible en PDF | `/reporte.html` |
| Círculos de Latinoamérica: tanda, cundina, cuchubal, junta, san, cadena, sol y sou-sou (misma mecánica del pasanaku, con garantía), natillera y caixinha (con Ayni y Alasitas), y la junta con remate o el consórcio (simulación). Cada uno trae explicación, escena 3D con su tejido, simulador y botón para crearlo en testnet | «Círculos de Latinoamérica» |
| Juegos y costumbres de Bolivia: cacho verificable con dados 3D (sin dinero; los dados salen de un ledger público de Stellar), rifa solidaria con números pagados por QR SEP-7 y sorteo verificable, y simulador de anticrético con el plan de escrow en Stellar (Trustless Work, planificado) | «Juegos y costumbres de Bolivia» |
| Verificar un sorteo, un comprobante o un círculo, y guardar evidencia | «Verificar» |
| Seis idiomas: español, inglés, portugués, quechua, aymara y guaraní | ⚙ Configuración |
| Bienvenida, recorrido guiado y videos cortos de cada paso | Botón ? |
| Asistente con IA y voz (Amawta) | «Amawta» |
| Escena 3D del círculo, 36 personajes de Alasitas y planeta de la billetera (complemento visual, no es el núcleo) | Inicio y «Personalizar» |

## Estructura
| Carpeta | Contenido |
|---|---|
| `contracts/pasanaku` | Ahorro rotativo con garantías, alias y TTL (10 pruebas) |
| `contracts/registro` | Memoria colectiva: círculos, miembros, regiones y avales (5 pruebas) |
| `contracts/ayni` | Fondo de ayuda mutua con votos y quórum (7 pruebas) |
| `contracts/minka` | Proyectos con fondos liberados por hitos (5 pruebas) |
| `contracts/alasitas` | Metas de ahorro con racha y bloqueo por fecha (7 pruebas) |
| `contracts/sorteo` | Sorteo con compromiso y revelación: la mitigación de los límites de `env.prng()` (9 pruebas). En testnet: [`CA2WAH…IJKD`](https://stellar.expert/explorer/testnet/contract/CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD). Ver `docs/SORTEO-COMPROMISO.md` |
| `contracts/remate` | Junta con remate y consórcio: rotativo donde se puja un descuento para cobrar antes (9 pruebas). En testnet: [`CAMJ3Y…MURE`](https://stellar.expert/explorer/testnet/contract/CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE). Ver `docs/REMATE.md` |
| `web` | Vite + three.js + stellar-sdk + Pollar; pruebas con Vitest |
| `web/evidencia-testnet.mjs`, `web/metricas-testnet.mjs` | Evidencia de transacciones por acción y métricas on-chain |
| `scripts/` | Despliegue de la demo y de las tradiciones en testnet |
| `docs/` | Evidencia, métricas, validación, cooperativas, modelo de negocio, pagos reales, equipo, arquitectura y revisión de seguridad |
| `.github/workflows` | Contratos (pruebas y wasm), web (pruebas y build), demo en testnet y compilación verificable |

## Probar localmente
```bash
npm --prefix web install
npm --prefix web run dev            # http://localhost:5173
npm --prefix web test               # pruebas de la web
node web/scripts-e2e.mjs            # crear, aportar y cobrar en testnet con cuentas efímeras
node web/evidencia-testnet.mjs      # recorre todas las acciones en USDC de prueba (~5 min)
```
Contratos (Linux, macOS, Codespaces o CI): `cargo test` y `stellar contract build`.

## Qué es real y qué es simulado
- **Real en testnet:** contratos, sorteo, aportes, pozos, garantías, alias, marcas, eventos, Ayni, Minka, Alasitas, registro y cambio a USDC de prueba.
- **Simulado:** el modo demo del inicio, la proyección de rendimiento de Vaquita y el monto de microcrédito ilustrativo. El aguayo es evidencia de pagos, no una aprobación de crédito.
- **De testnet a dinero real:** ver [`docs/PAGOS-REALES.md`](docs/PAGOS-REALES.md) (USDC en mainnet, rampas en bolivianos, KYC, marco normativo y auditoría).

## Equipo
Equipo **Stark Neo**:
- Luis: contratos, web y 3D.
- Richard Carvajal: datos y modelo de negocio.
- Liam Camacho: diseño UX/UI.
- natalyfer2709: go-to-market y pitch.

Roles, enlaces y aportes en [`docs/EQUIPO.md`](docs/EQUIPO.md).

## Cómo se construyó
Luis diseñó el producto y dirigió el desarrollo con dos asistentes de programación con IA, Claude Code y Codex, que trabajaron en ramas separadas (ver `AGENTS.md`). Cada cambio pasó por pruebas automáticas, revisiones de seguridad cruzadas (sus hallazgos se corrigieron) y compilación verificable.
