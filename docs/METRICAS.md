# Métricas on-chain (Stellar testnet)

Medido el 2026-11-21 13:08 UTC con `node web/metricas-testnet.mjs` (invocaciones según la API de Stellar Expert; miembros leídos de los contratos).

| Métrica | Valor |
|---|---|
| Contratos de Awayu desplegados | 13 (7 pasanaku, 1 registro, 2 ayni, 2 minka, 1 alasitas) |
| Círculos en el registro on-chain | 7 |
| Invocaciones de contratos | 112 |
| Eventos emitidos | 99 |
| Invocaciones con error | 0 |
| Cuentas distintas que participaron | 23 |

Origen honesto de la actividad: casi toda viene de cuentas efímeras de nuestros scripts (`scripts/demo-testnet.sh`, `scripts/modos-testnet.sh`, `web/evidencia-testnet.mjs`) y de pruebas del equipo. Todavía no hay usuarios externos: eso es lo que busca el piloto (ver `docs/VALIDACION.md`).

| Contrato | Tipo | Invocaciones | Eventos |
|---|---|---|---|
| [`CAF7V3…KGBS`](https://stellar.expert/explorer/testnet/contract/CAF7V32UXWDPFOOLMUW7BZLIMAJHMOUEA3WOCMHC76DQM7DHMGOSKGBS) | pasanaku | 22 | 18 |
| [`CAJ52V…MVOJ`](https://stellar.expert/explorer/testnet/contract/CAJ52VPA62YF66BJ6ND6OWOC6XBQKJ6EWZKLOTUXQVIRLMCIGTPLMVOJ) | pasanaku | 2 | 1 |
| [`CDARLW…RAHH`](https://stellar.expert/explorer/testnet/contract/CDARLWWVVPTFZ52X5MOEOXZUAAI3ZFEO42GRVDWRY63P3NNQGOLYRAHH) | pasanaku | 2 | 1 |
| [`CBX3JZ…YQXZ`](https://stellar.expert/explorer/testnet/contract/CBX3JZ47EJ7NQB5JNPBZ3KTV4BLDUPRSF43XORWDWBPYOKAS7L6MYQXZ) | pasanaku | 2 | 1 |
| [`CDW5KH…D5NN`](https://stellar.expert/explorer/testnet/contract/CDW5KHZUTAGJFUNFZJ3DTYZXKFUJOOLHKMGX4PACXXHAUCZZEHRWD5NN) | pasanaku | 2 | 1 |
| [`CBN76H…YVLS`](https://stellar.expert/explorer/testnet/contract/CBN76HIIWMGNHOYNRZ6GWXLUAYQ7OCKCZCKYJJ7ODTYTLSD523TBYVLS) | pasanaku | 2 | 1 |
| [`CDOM3I…A3NG`](https://stellar.expert/explorer/testnet/contract/CDOM3IISV3IUFYSRNUJ7H62L3QEGCU6SNZABQTCEMPSQEHAAQA4VA3NG) | pasanaku | 9 | 9 |
| [`CAIOIV…NVKD`](https://stellar.expert/explorer/testnet/contract/CAIOIV7WCXJC37TMIHFSZCMWSWCDMHXMS4V34ZALTD5RH7ZP44LQNVKD) | registro | 29 | 28 |
| [`CCBWIP…XNAF`](https://stellar.expert/explorer/testnet/contract/CCBWIPKD2MUEIEMXCMYOS6JNYKKUJZHXBKH7NPB5POSKBVLNYMQMXNAF) | ayni | 13 | 13 |
| [`CCN6R6…VTG2`](https://stellar.expert/explorer/testnet/contract/CCN6R6TE53QNK6CWOX37LSGN7MZRCV2RVG2IAS2CVOVV3MUFZC3SVTG2) | minka | 6 | 5 |
| [`CDUKQ4…572N`](https://stellar.expert/explorer/testnet/contract/CDUKQ46OGKK2WQQJ2YRVWVHOW5RATTEZEAGDMU4URANCC5OLY2OE572N) | alasitas | 8 | 7 |
| [`CB2RZD…Y63Z`](https://stellar.expert/explorer/testnet/contract/CB2RZDE7USQBJVS4DBXIA6UCTD2VEBTV6DX7FBHXYWVJQJB2IS5RY63Z) | ayni | 9 | 9 |
| [`CDENQ4…QXWQ`](https://stellar.expert/explorer/testnet/contract/CDENQ4EMC2L3YZPIUB7V25Z3PJ4G45GXCABBVVQ6YUPTBBXSJE7YQXWQ) | minka | 6 | 5 |
