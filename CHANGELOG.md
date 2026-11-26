# Cambios

Formato: fecha, qué se agregó y qué se corrigió. El detalle está en el historial de Git.

## 2026-11-26
- Tabla de contratos con el hash del wasm de cada uno (`docs/CONTRATOS.md`): las instancias de evidencia y las de referencia comparten el mismo código.
- Guía de contribución, política de seguridad, plantillas de issues y de pull requests.
- Modelo de negocio: quién paga el plan por círculo y economía por reporte.
- Contrato **`sorteo`** (compromiso y revelación, 9 pruebas) y contrato **`remate`** (junta con remate y consórcio, 9 pruebas), compilados en CI y **desplegados en testnet** con un sorteo real de compromiso y revelación y dos rondas de remate (22 transacciones, `docs/EVIDENCIA-CONTRATOS-NUEVOS.md`). Ecosistema y Círculos de Latinoamérica los enlazan; métricas: 20 contratos, 167 invocaciones, 36 cuentas.
- Corrección: el puntaje del reporte, el pasaporte y la demo ahora coincide con la división entera del contrato (62, no 63, para "a tiempo + cubierto").

## 2026-11-22
- **Juegos y costumbres de Bolivia**: cacho verificable con dados 3D (sin dinero), rifa solidaria con números pagados por QR SEP-7 y simulador de anticrético con el plan de escrow.
- **Círculos de Latinoamérica**: 15 formas de ahorro de 11 países, con tejidos 3D, simuladores y creación en testnet. Reemplaza la sección de juegos anterior.
- El cambio de idioma aplica a toda la web; prueba automática de cobertura de traducciones.
- Animaciones: transiciones entre vistas, aparición al desplazarse, conteo de cifras, confeti al pagar el pozo, movimiento reducido respetado.
- Flujos de n8n sin cuentas personales: avisos por ntfy.sh y registro en una tabla interna.
- Primera ronda informal de validación (`docs/VALIDACION.md`) y licencia MIT.

## 2026-11-21
- Evidencia on-chain en **USDC de prueba**: 34 transacciones, una por acción (`docs/EVIDENCIA.md`); métricas on-chain (`docs/METRICAS.md`).
- **Cuenta de prueba instantánea** (sin instalar nada) y USDC por defecto al crear un círculo, con cambio XLM → USDC en el DEX de Stellar.
- **Reporte para cooperativas** (`/reporte.html`), imprimible en PDF.
- Guía "Prueba en 3 minutos", camino a pagos reales, modelo de negocio, pitch deck y video del flujo on-chain.

## 2026-11-20
- Centro **Verificar** (sorteo verificable, comprobantes, reportes), panel de configuración, bienvenida y recorrido guiado.
- Stellar Wallets Kit, compilación verificable **SEP-55** y redespliegue de los cinco contratos.

## 2026-11-19
- **Ayni**, **Minka** y **Alasitas** con sus contratos; registro on-chain; seis idiomas; QR SEP-7; asistente Amawta con voz.

## 2026-11-18
- Primer contrato `pasanaku` en Soroban (turno sorteado, garantías, marcas por ronda) y la web con el aguayo 3D.
