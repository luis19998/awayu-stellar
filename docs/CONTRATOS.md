# Contratos de Awayu en testnet

Cada fila dice qué código ejecuta el contrato: el **hash del wasm** es el SHA-256 del código desplegado y lo devuelve la red. Si dos contratos tienen el mismo hash, ejecutan exactamente el mismo código. Los contratos de referencia son los que usa la demo; los de evidencia son **instancias nuevas creadas desde el mismo wasm** por `web/evidencia-testnet.mjs`, porque en Soroban cada círculo, fondo o proyecto es su propio contrato.

| Contrato | Rol | ID | Hash del wasm |
|---|---|---|---|
| pasanaku | referencia | [`CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS`](https://stellar.expert/explorer/testnet/contract/CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS) | `abedad387b50b055c698d7cd46284afdaaff47cada4f91dc1a65f1a4c7020f55` |
| registro | referencia | [`CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | `880465b1574c96fc0621d9eda96bf0fb059d6177f5c9498ae93596d4faad6da5` |
| ayni | referencia | [`CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF`](https://stellar.expert/explorer/testnet/contract/CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF) | `eaf2a3a90a4935ca83f4dfd5fbb180169d50fb64db53f8941d3c2b609f79df05` |
| minka | referencia | [`CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2`](https://stellar.expert/explorer/testnet/contract/CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2) | `9b5fbfb4d72665c17a9067c8255e73c20f61cb083baf4019be741a31f1779e4e` |
| alasitas | referencia | [`CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | `5750184d1c9a54c66be6244b52de1f0c8b2900fa8feff501b64543240ce73277` |
| pasanaku | evidencia (USDC) | [`CDOM3IISV3IUFYSRNUJ7H62L3QEGCU6SNZABQTCEMPSQEHAAQA4VA3NG`](https://stellar.expert/explorer/testnet/contract/CDOM3IISV3IUFYSRNUJ7H62L3QEGCU6SNZABQTCEMPSQEHAAQA4VA3NG) | `abedad387b50b055c698d7cd46284afdaaff47cada4f91dc1a65f1a4c7020f55` |
| ayni | evidencia (USDC) | [`CB2RZDE7USQBJVS4DBXIA6UCTD2VEBTV6DX7FBHXYWVJQJB2IS5RY63Z`](https://stellar.expert/explorer/testnet/contract/CB2RZDE7USQBJVS4DBXIA6UCTD2VEBTV6DX7FBHXYWVJQJB2IS5RY63Z) | `eaf2a3a90a4935ca83f4dfd5fbb180169d50fb64db53f8941d3c2b609f79df05` |
| minka | evidencia (USDC) | [`CDENQ4EMC2L3YZPIUB7V25Z3PJ4G45GXCABBVVQ6YUPTBBXSJE7YQXWQ`](https://stellar.expert/explorer/testnet/contract/CDENQ4EMC2L3YZPIUB7V25Z3PJ4G45GXCABBVVQ6YUPTBBXSJE7YQXWQ) | `9b5fbfb4d72665c17a9067c8255e73c20f61cb083baf4019be741a31f1779e4e` |
| sorteo | referencia | [`CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD`](https://stellar.expert/explorer/testnet/contract/CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD) | `74eeefceac8bee195f600d856207bee60565cc4bde7a270ad922da974e5fb2e4` |
| remate | referencia | [`CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE`](https://stellar.expert/explorer/testnet/contract/CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE) | `640df105737941fca0e8311ed9038d22a86918a353fc7cbd56250f1a8fa876f6` |

`sorteo` y `remate` se compilaron en la integración continua (artefacto `contratos-wasm`) y se desplegaron con `web/contratos-nuevos.mjs`.

## Cómo comprobarlo
```bash
# Hash del wasm que ejecuta un contrato
stellar contract fetch --id <ID> --network testnet -o c.wasm && sha256sum c.wasm
# Repositorio y commit que compilaron ese wasm (SEP-55)
stellar contract info build --id <ID> --network testnet
```

Generado el 2026-11-26 leyendo cada contrato con `getContractWasmByContractId` de la RPC de Soroban testnet.
