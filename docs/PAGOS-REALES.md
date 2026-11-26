# De testnet a pagos reales

Hoy todo corre en **Stellar testnet** con dinero de prueba. Este documento dice qué cambia para mover dinero real, en qué orden y qué ya está listo en el código. No es asesoría legal: las normas citadas se deben confirmar en los textos oficiales (ASFI, UIF, BCB y Gaceta Oficial) con un abogado antes del piloto.

## 1. Qué ya está listo
| Pieza | Estado en testnet | Qué cambia en mainnet |
|---|---|---|
| Contratos (`pasanaku`, `ayni`, `minka`, `alasitas`, `registro`) | Desplegados, con pruebas y compilación verificable SEP-55 | Auditoría externa, límites de monto y otro sorteo (ver §4). Se despliegan de nuevo en mainnet: los contratos no se "mueven" |
| Token de la cuota | Ya se elige el token al crear el círculo. Hay un círculo de ejemplo en **USDC de prueba** (`docs/EVIDENCIA.md`) | USDC de Circle en mainnet: emisor `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`, contrato SAC `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` (calculado con `stellar contract id asset`) |
| Billeteras | Freighter, xBull, Albedo, Lobstr, Rabet, Hana (Stellar Wallets Kit), Pollar y cuenta de prueba instantánea | La cuenta de prueba instantánea se desactiva. Pollar y las billeteras del kit ya funcionan en mainnet cambiando la red |
| Ingreso y retiro en bolivianos | Botón "Recargar con el QR de tu banco" conectado a las rampas de Pollar (`web/src/qr/qr.js`) | Activar en el panel de Pollar un proveedor con ruta en BOB y KYC (ver §3) |
| Comisiones de red | Las paga cada usuario en XLM de prueba | Patrocinar reservas y comisiones (ver §5) para que nadie necesite comprar XLM |

## 2. Modelo recomendado: software no custodio y aliados regulados
Awayu **no guarda el dinero de nadie**: cada persona firma con su billetera y los fondos están en contratos públicos cuyas reglas no se pueden cambiar. Awayu tampoco cambia bolivianos por dólares digitales: eso lo hace un proveedor autorizado.

- **Awayu:** contratos, interfaz, reportes de historial y soporte a las asociaciones.
- **Proveedor de rampa (aliado autorizado):** cobra en bolivianos con el QR del banco, entrega USDC en la billetera de la persona y hace el KYC.
- **Cooperativa o IFD:** recibe el reporte de historial cuando la persona decide compartirlo, y decide el crédito con su propio criterio.

Con este reparto Awayu evita, en lo posible, ser un proveedor de servicios de activos virtuales (custodia o intercambio). Si un abogado concluye que igual califica, la alternativa es operar bajo una Empresa de Tecnología Financiera ya autorizada.

## 3. Marco normativo en Bolivia (verificar antes del piloto)
Según las fuentes consultadas el 2026-11-21 (la mayoría secundarias):

- **BCB:** la Resolución de Directorio de junio de 2024 levantó la prohibición de operar con activos virtuales por canales del sistema financiero. Las fuentes citan el número 082/2024 o 084/2024: hay que confirmarlo en bcb.gob.bo.
- **Decreto Supremo 5384** (mayo de 2025): regula las Empresas de Tecnología Financiera e incluye a los proveedores de servicios de activos virtuales (PSAV).
- **ASFI:** su reglamento para estas empresas se aprobó con la Resolución ASFI/540/2025 (julio de 2025). La Resolución ASFI/373/2026 y la Circular ASFI/945/2026 (abril de 2026) lo modificaron y extendieron los plazos de adecuación. La primera PSAV con certificado de adecuación se reportó en febrero de 2026.
- **UIF:** mantiene un registro de PSAV creado con la Resolución Administrativa 019/2025. Rigen las obligaciones contra el lavado de dinero: KYC, monitoreo y reporte de operaciones sospechosas.
- **Dólar digital en la banca:** varios bancos ya ofrecen USDT (Banco Bisa, Banco FIE, Banco Unión con Yasta), y el Ministerio de Economía anunció en julio de 2026 una evaluación técnica para incluir USDT en el sistema de pagos. Esas ofertas no son necesariamente sobre Stellar: hay que confirmar la red de cada una. Awayu usa **USDC sobre Stellar**.
- **Cooperativas:** las cooperativas de ahorro y crédito abiertas y las IFD están bajo supervisión de ASFI. Su política de crédito define si aceptan un historial externo como antecedente. Por eso hay que preguntarles directamente (ver `docs/COOPERATIVAS.md`).

Fuentes: [CriptoNoticias](https://www.criptonoticias.com/comunidad/bolivia-criptomonedas-marco-legal/), [C. R. & F. Rojas Abogados](https://rojas-lawfirm.com/en/bolivia-updates-the-regulatory-framework-for-financial-technology-companies/), [Info.bo](https://periodico.info.bo/asfi-regula-el-uso-de-criptomonedas-en-bolivia-asi-afecta-a-usuarios-y-plataformas-como-binance-meru-y-takenos), [Los Tiempos](https://www.lostiempos.com/actualidad/economia/20260726/falta-dolares-banca-migra-criptomonedas-norma-del-bcb), [Rigmineria](https://rigmineria.com/regulacion/bolivia-usdt-sistema-pagos-nacional), [Stablecoin.com.bo sobre GAFILAT](https://stablecoin.com.bo/noticias/bolivia-gafi-listas-riesgo-cripto).

## 4. Cambios técnicos antes de mainnet
1. **Sorteo del turno.** Hoy el orden se sortea con `env.prng()` al crear el círculo. La documentación de Soroban advierte que ese generador no sirve cuando hay mucho valor en juego: el resultado depende de datos del ledger y quien envía la transacción puede reintentarla hasta que le convenga. Mitigación para mainnet, en este orden:
   - **Compromiso y revelación:** cada miembro aporta un secreto cifrado al unirse; el orden sale del hash de todos los secretos revelados más un ledger futuro. Nadie, ni el organizador, controla el resultado.
     **Estado (2026-11-26):** ya existe como contrato aparte, `sorteo`, desplegado en testnet ([`CA2WAH…IJKD`](https://stellar.expert/explorer/testnet/contract/CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD)), con 9 pruebas y un sorteo real de ejemplo (`docs/EVIDENCIA-CONTRATOS-NUEVOS.md`). Falta que el `pasanaku` v4 lo use para fijar el orden de cobro.
   - Mientras tanto, el centro **Verificar → Sorteo** ya publica el compromiso de la lista antes de sortear, para que cualquiera compruebe que no se cambió.
   - Para montos chicos, una alternativa aceptable es que la asociación fije el orden por acuerdo y el contrato solo lo registre.
2. **Auditoría externa** de los cinco contratos. El SCF tiene un programa de auditorías para proyectos del ecosistema.
3. **Límites:** tope de cuota y de miembros por círculo durante el piloto, y lista de tokens permitidos (solo USDC).
4. **Pausa de emergencia** y plan de actualización con el `wasm` verificado (SEP-55 ya está en CI).
5. **Monitoreo:** alertas de eventos (`pozo`, `cubre`, `release`) con el flujo de n8n que ya existe.

## 5. Experiencia sin XLM
- **Reservas patrocinadas** (CAP-33): Awayu o la asociación pagan la reserva de la cuenta y de la línea de confianza de USDC, así que la persona no necesita XLM para empezar.
- **Fee bump:** un patrocinador paga la comisión de cada transacción. En Stellar cuesta fracciones de centavo de dólar.
- **Pollar** ya ofrece billetera con Google o correo, sin frase semilla.

## 6. Identidad: cómo una cooperativa confía en el historial
La cadena prueba **qué cuenta** pagó, no **quién** es la persona. El vínculo se arma así, y la persona decide cuándo compartirlo:
1. La cooperativa (o el proveedor de rampa) verifica la identidad con su propio KYC. Pollar trae un proveedor de verificación integrado (Didit) que se activa en su panel.
2. La persona demuestra que controla la cuenta firmando con su billetera un mensaje que la cooperativa le da (por ejemplo: "Soy titular de G… para la solicitud N.° 123"). La firma se verifica con la clave pública: no hay que confiar en Awayu.
3. La cooperativa lee el historial directamente de los contratos, con el reporte de `reporte.html` o con cualquier explorador. No depende de un PDF que se pueda editar.

Nada de esto pone datos personales en la cadena: solo direcciones y marcas de pago.

## 7. Orden sugerido
| Fase | Qué | Cuándo |
|---|---|---|
| 0 | Validación con 5 a 10 organizadores y 2 o 3 cooperativas (`docs/VALIDACION.md`, `docs/COOPERATIVAS.md`) | Ahora |
| 1 | Piloto cerrado en testnet con una asociación real: círculos de verdad con USDC de prueba y reportes para una cooperativa | Diciembre de 2026 |
| 2 | Opinión legal, acuerdo con un proveedor de rampa autorizado y auditoría | Enero y febrero de 2027 |
| 3 | Mainnet con límites: un círculo de 10 personas y cuota de hasta 20 USDC | Después de la auditoría |
| 4 | Ampliar a más asociaciones y medir pagos a tiempo, atrasos recuperados y reportes aceptados | 2027 |
