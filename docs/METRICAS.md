# Métricas on-chain (Stellar testnet)

Medido el 2026-11-26 10:27 UTC con `node web/metricas-testnet.mjs` (invocaciones según la API de Stellar Expert; miembros leídos de los contratos).

| Métrica | Valor |
|---|---|
| Contratos de Awayu desplegados | 20 (12 pasanaku, 1 registro, 2 ayni, 2 minka, 1 alasitas, 1 sorteo, 1 remate) |
| Círculos en el registro on-chain | 12 |
| Invocaciones de contratos | 167 |
| Eventos emitidos | 148 |
| Invocaciones con error | 0 |
| Cuentas distintas que participaron | 36 |

Origen honesto de la actividad: casi toda viene de cuentas efímeras de nuestros scripts (`scripts/demo-testnet.sh`, `scripts/modos-testnet.sh`, `web/evidencia-testnet.mjs`, `web/contratos-nuevos.mjs`) y de pruebas del equipo. Todavía no hay usuarios externos: eso es lo que busca el piloto (ver `docs/VALIDACION.md`).

| Contrato | Tipo | Invocaciones | Eventos |
|---|---|---|---|
| [`CAF7V3…KGBS`](https://stellar.expert/explorer/testnet/contract/CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS) | pasanaku | 23 | 20 |
| [`CAJ52V…MVOJ`](https://stellar.expert/explorer/testnet/contract/CAJ52VPA62YF66BJ6ND6OWOC6XBQKJ6EWZKLOTUXQVIRLMCIGTPLMVOJ) | pasanaku | 2 | 1 |
| [`CDARLW…RAHH`](https://stellar.expert/explorer/testnet/contract/CDARLWWVVPTFZ52X5MOEOXZUAAI3ZFEO42GRVDWRY63P3NNQGOLYRAHH) | pasanaku | 2 | 1 |
| [`CBX3JZ…YQXZ`](https://stellar.expert/explorer/testnet/contract/CBX3JZ47EJ7NQB5JNPBZ3KTV4BLDUPRSF43XORWDWBPYOKAS7L6MYQXZ) | pasanaku | 2 | 1 |
| [`CDW5KH…D5NN`](https://stellar.expert/explorer/testnet/contract/CDW5KHZUTAGJFUNFZJ3DTYZXKFUJOOLHKMGX4PACXXHAUCZZEHRWD5NN) | pasanaku | 2 | 1 |
| [`CBN76H…YVLS`](https://stellar.expert/explorer/testnet/contract/CBN76HIIWMGNHOYNRZ6GWXLUAYQ7OCKCZCKYJJ7ODTYTLSD523TBYVLS) | pasanaku | 2 | 1 |
| [`CDOM3I…A3NG`](https://stellar.expert/explorer/testnet/contract/CDOM3IISV3IUFYSRNUJ7H62L3QEGCU6SNZABQTCEMPSQEHAAQA4VA3NG) | pasanaku | 10 | 10 |
| [`CBE5NP…KSPV`](https://stellar.expert/explorer/testnet/contract/CBE5NPJLI3K44WYLUW6LDOL7HDGDJ3INKWHT2ROHBPIJX5IKTO2IKSPV) | pasanaku | 4 | 3 |
| [`CD4KDS…CMLL`](https://stellar.expert/explorer/testnet/contract/CD4KDSRB6YKG6C7TALMTAGIGVRPDF6P5GGB4LLHQAEQNNUKVYHKOCMLL) | pasanaku | 5 | 4 |
| [`CCQF6J…S27R`](https://stellar.expert/explorer/testnet/contract/CCQF6J6MWY3EYHPMIDNVVFWQANCBQC3P2I335CAHTNM2RYPLE4WYS27R) | pasanaku | 5 | 4 |
| [`CDFVVZ…XYZB`](https://stellar.expert/explorer/testnet/contract/CDFVVZNEMNQSB2KNXTOMNGQH2KKDTZKZ5SOVLDENLEAB4LGTTCL6XYZB) | pasanaku | 5 | 4 |
| [`CDUPLS…2BJX`](https://stellar.expert/explorer/testnet/contract/CDUPLSO7B4IBLADEEI6YZCOOZTXD4V6NDOFMEWM24PNJHQGDFCHZ2BJX) | pasanaku | 3 | 2 |
| [`CAIOIV…NVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | registro | 39 | 38 |
| [`CCBWIP…XNAF`](https://stellar.expert/explorer/testnet/contract/CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF) | ayni | 13 | 13 |
| [`CCN6R6…VTG2`](https://stellar.expert/explorer/testnet/contract/CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2) | minka | 6 | 5 |
| [`CDUKQ4…572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | alasitas | 9 | 8 |
| [`CA2WAH…IJKD`](https://stellar.expert/explorer/testnet/contract/CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD) | sorteo | 9 | 7 |
| [`CAMJ3Y…MURE`](https://stellar.expert/explorer/testnet/contract/CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE) | remate | 11 | 11 |
| [`CB2RZD…Y63Z`](https://stellar.expert/explorer/testnet/contract/CB2RZDE7USQBJVS4DBXIA6UCTD2VEBTV6DX7FBHXYWVJQJB2IS5RY63Z) | ayni | 9 | 9 |
| [`CDENQ4…QXWQ`](https://stellar.expert/explorer/testnet/contract/CDENQ4EMC2L3YZPIUB7V25Z3PJ4G45GXCABBVVQ6YUPTBBXSJE7YQXWQ) | minka | 6 | 5 |
