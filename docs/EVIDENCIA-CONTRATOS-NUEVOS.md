# Evidencia de los contratos `sorteo` y `remate` (Stellar testnet)

Generado el 2026-11-26 10:25 UTC con `node web/contratos-nuevos.mjs`, usando los wasm compilados por la integración continua. Cuentas efímeras fondeadas con Friendbot; las claves no se guardaron.

- **sorteo** [`CA2WAH…IJKD`](https://stellar.expert/explorer/testnet/contract/CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD) · hash del wasm `74eeefceac8bee195f600d856207bee60565cc4bde7a270ad922da974e5fb2e4` · orden resultante del sorteo 1: **Carla → Ana → Bruno**
- **remate** [`CAMJ3Y…MURE`](https://stellar.expert/explorer/testnet/contract/CAMJ3YUZWTO2ZKZBF5AG5FCUZAHWS6HCVBCLPNFRELRFLD4VI5UZMURE) · hash del wasm `640df105737941fca0e8311ed9038d22a86918a353fc7cbd56250f1a8fa876f6` · ganadores: ronda 1 **Bruno** (puja más alta), ronda 2 **Ana**

| # | Contrato | Acción | Quién | Transacción |
|---|---|---|---|---|
| 1 | Código | Subir el wasm de sorteo | Organizadora | [`49ae6401…`](https://stellar.expert/explorer/testnet/tx/49ae6401ab37b89595a087742e3164b41e97a423dcf8eb9dba09cf289df03cd6) |
| 2 | Código | Subir el wasm de remate | Organizadora | [`e4939535…`](https://stellar.expert/explorer/testnet/tx/e49395355fb8dbfab403c9276619c09569684f921f59bf1178563803ecbc267f) |
| 3 | Sorteo | Desplegar el contrato de sorteos | Organizadora | [`b1e03a87…`](https://stellar.expert/explorer/testnet/tx/b1e03a871b1328e3b83bd87b1d399f280a4e55f1c0f6070e350e851a2d751dd8) |
| 4 | Sorteo | Crear el sorteo del orden de un pasanaku (3 personas) | Organizadora | [`d69042ca…`](https://stellar.expert/explorer/testnet/tx/d69042ca4372e51d03b09b208293f13aeb6e5dd95b946005108fe6b8b0b858b4) |
| 5 | Sorteo | Comprometerse con un secreto (solo se publica su huella) | Ana | [`3416b5dd…`](https://stellar.expert/explorer/testnet/tx/3416b5ddfc4ce5fdebeb728558f800a4718de49be4412f1caaf30927a1db5370) |
| 6 | Sorteo | Comprometerse con un secreto (solo se publica su huella) | Bruno | [`268a81dc…`](https://stellar.expert/explorer/testnet/tx/268a81dce366122cfffe2f7e1b7141b1308184affa356d227b8c1286d7b552b0) |
| 7 | Sorteo | Comprometerse con un secreto (solo se publica su huella) | Carla | [`e7f8671e…`](https://stellar.expert/explorer/testnet/tx/e7f8671e2828a0655e9aefa1feabee3a34538f5714d561f355cc05bacae3b4b2) |
| 8 | Sorteo | Revelar el secreto | Ana | [`38521648…`](https://stellar.expert/explorer/testnet/tx/385216487cb2afc7e9b873d96657153a3aef92bb4b01ef4ecb0909231ed82bf9) |
| 9 | Sorteo | Revelar el secreto | Bruno | [`775d7f47…`](https://stellar.expert/explorer/testnet/tx/775d7f472c757f7cf451140b7a89e7ec33ae9c67ba12e009cf3ce6b6eba2f499) |
| 10 | Sorteo | Revelar el secreto | Carla | [`93456be7…`](https://stellar.expert/explorer/testnet/tx/93456be7f47524515f45c433ad1edb633f6fa687993ddb5217442cf60fdd9e73) |
| 11 | Sorteo | Cerrar el sorteo: el orden sale de todos los secretos | Ana | [`11a7d038…`](https://stellar.expert/explorer/testnet/tx/11a7d03808be31d25f741150959f567f709968b0a00a7415d801f6b38e568279) |
| 12 | Remate | Crear una junta con remate (cuota 5 XLM, 3 personas) | Organizadora | [`74262246…`](https://stellar.expert/explorer/testnet/tx/74262246825075497bb86b2ddff5a5814eec5f300d30e48a8fb5d13cdaa7feb5) |
| 13 | Remate | Dejar garantía de una cuota | Carla | [`294e0f21…`](https://stellar.expert/explorer/testnet/tx/294e0f212e0624579132231f7340fa646e2b4d74933cdf61b1945db6cc1f69cc) |
| 14 | Remate | Aportar la cuota de la ronda 1 | Ana | [`d8942da3…`](https://stellar.expert/explorer/testnet/tx/d8942da373758252750c678bc32cf5c4e628b8054b26b99cc9df54d0164b7958) |
| 15 | Remate | Aportar la cuota de la ronda 1 | Bruno | [`a280a923…`](https://stellar.expert/explorer/testnet/tx/a280a923a1d7489469defa5f99da370edb17b432b11c40ed05cbfaa7fee84037) |
| 16 | Remate | Aportar la cuota de la ronda 1 | Carla | [`37240df4…`](https://stellar.expert/explorer/testnet/tx/37240df4c583b0367a47c2fc2b530326ca2c6bcf34bc7a75cd400677ec28197d) |
| 17 | Remate | Pujar 5 % de descuento para cobrar en la ronda 1 | Ana | [`e019694a…`](https://stellar.expert/explorer/testnet/tx/e019694a46fb170efc426609178a73a741d7cd7d230b44f80f1290502c92e51e) |
| 18 | Remate | Pujar 12 % de descuento para cobrar en la ronda 1 | Bruno | [`c0c9bfe8…`](https://stellar.expert/explorer/testnet/tx/c0c9bfe863316130a168d14078e0214fa5b4cb66f7eb20dc044df5523346775e) |
| 19 | Remate | Cerrar la ronda 1: gana la puja más alta y el descuento se reparte | Carla | [`a49e6898…`](https://stellar.expert/explorer/testnet/tx/a49e6898b2cc31c68a7f5248b05cb26d8fbefc5d4b578de8ed2d0994ee68a427) |
| 20 | Remate | Aportar la cuota de la ronda 2 | Ana | [`65210ebb…`](https://stellar.expert/explorer/testnet/tx/65210ebb77c51f9696cb0f06ce3088269b61cc6698ac6e00dceaf74a153de2af) |
| 21 | Remate | Aportar la cuota de la ronda 2 | Bruno | [`a2fcdb5b…`](https://stellar.expert/explorer/testnet/tx/a2fcdb5b7499366347be1da6ee48c520fe9713050502a42c9cc313e24189ef5d) |
| 22 | Remate | Cerrar la ronda 2: Carla no aportó y su garantía cubre la cuota | Ana | [`ae87f976…`](https://stellar.expert/explorer/testnet/tx/ae87f9762bc171985c9b32cc5c5cb21155a68e02cf5078d73e763456c67921f6) |
