# Integraciones del ecosistema

Awayu conecta un pasanaku de Stellar con servicios que dan acceso, rendimiento y garantías. Los módulos de `web/src/integrations/` encapsulan Pollar y Trustless Work para que la interfaz pueda distinguir entre un servicio activo, una capacidad deshabilitada y una falla de red.

## Pollar

Awayu ya crea un `PollarClient` en `web/src/wallet.js`; el módulo de Earn recibe esa instancia por inyección. `earnOverview(client)` consulta proveedores y oportunidades disponibles, incluido el APY real reportado en cada oportunidad por el backend Pollar. Una lista vacía indica que Earn está apagado. `depositIdlePot` y `withdrawFromEarn` usan las operaciones del SDK; `swapQuote` consulta precios de conversión y `bolivianRamps` busca corredores BOB/Bolivia en rutas ONRAMP y OFFRAMP.

En producción, Vaquita/Blend/DeFindex deben habilitarse y exponerse en la configuración de la aplicación Pollar. En el frontend configurar `VITE_POLLAR_KEY` (clave publicable compatible con testnet o mainnet), autorizar el origen de Awayu en el panel Pollar y mantener la red alineada con la clave. No guardar claves secretas en el frontend. Earn muestra rendimientos vigentes, que pueden cambiar; la demo actual sigue usando su proyección propia.

Las ramps dependen de que Pollar exponga los corredores. Si aún no hay BOB/Bolivia, el módulo responde con rutas globales en `allRoutes`, `routes: []` y una razón explícita; no afirma que exista una rampa boliviana.

## Trustless Work

`trustless.js` prepara llamadas REST de Trustless Work para crear un escrow de un solo lanzamiento, fondearlo, consultar su estado y solicitar liberación. Las operaciones de escritura devuelven la transacción sin firmar: la billetera del participante la firma. La garantía queda bajo reglas de escrow Soroban en lugar de una transferencia custodiada por Awayu.

El módulo usa por defecto `https://dev.api.trustlesswork.com` y centraliza las rutas en `TRUSTLESS_ROUTES`. Los nombres exactos de endpoints y los esquemas de body deben verificarse contra la [documentación REST de Trustless Work](https://docs.trustlesswork.com/trustless-work/api-rest/introduction) antes de activar, porque el servicio puede cambiar su API. Las llamadas REST requieren `x-api-key`. Esa clave es secreta: no se debe incluir en `VITE_*`, ni incrustar en un sitio estático. Para uso real, servir estas operaciones a través de un backend/proxy que guarde la clave y limite las acciones. `trustlessKey` en `integrationStatus` solo indica configuración presente; no es recomendación para exponer una clave en cliente.

Para una activación completa, obtener la clave en Trustless Work, guardarla como secreto del backend, revisar las rutas y campos de escrow para la versión elegida y desplegar el proxy. La interfaz debe presentar “garantía disponible” solo después de comprobar la respuesta de creación; sin clave, muestra el motivo devuelto por la integración.

## Vaquita y DeFindex

Vaquita agrega acceso a estrategias de ahorro en pools de Blend y vaults de DeFindex. En esta integración esos proveedores llegan por Pollar Earn; Awayu no fija un APY ni selecciona un pool arbitrariamente. Antes de depositar, la persona debe revisar el activo, proveedor y tasa mostrados. Para retirar, Blend usa el monto en activo y DeFindex puede usar unidades de shares según la posición informada por Pollar.

## Pitch

“Awayu combina el ahorro comunitario que ya conocemos con infraestructura abierta de Stellar: Pollar simplifica el acceso y puede conectar el pozo ocioso con Vaquita, Blend o DeFindex usando tasas consultadas en vivo; Trustless Work permite preparar garantías en escrow con reglas verificables y firma de la persona. Cuando un corredor BOB todavía no está habilitado, lo decimos claramente en vez de presentar una ruta simulada como real.”

La integración técnica no convierte la reputación del aguayo en una aprobación crediticia ni garantiza rendimientos. Earn, ramps y escrows se muestran activos solo cuando las capacidades correspondientes están configuradas y las respuestas de servicio están disponibles.
