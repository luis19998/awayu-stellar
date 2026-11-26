# Seguridad

## Alcance
Awayu funciona en **Stellar testnet** con dinero de prueba. Los contratos no están auditados y **no deben usarse con fondos reales**. El camino a mainnet está en `docs/PAGOS-REALES.md`, y la revisión interna en `docs/REVISION-CONTRATO.md`.

## Cómo reportar un problema
- Si es una vulnerabilidad (por ejemplo, alguien podría retirar fondos ajenos de un contrato, saltarse la firma o manipular el sorteo), **no abras un issue público**. Usa **Security → Report a vulnerability** en este repositorio, que es un aviso privado de GitHub.
- Incluye: el contrato y su ID en testnet, los pasos para reproducirlo y, si existe, el hash de la transacción.
- Respondemos en un plazo de 7 días.

## Límites conocidos
- El orden de cobro del `pasanaku` usa `env.prng()`, que no sirve para montos altos (ver README, "Límites del sorteo"). La mitigación con compromiso y revelación está en desarrollo.
- La cuenta de prueba instantánea guarda una clave efímera de testnet en `sessionStorage`. No es una billetera para fondos reales.
- Las claves de servicios (Gemini, Pollar) viven en variables de entorno de Vercel. La única clave expuesta en el navegador es la **publicable** de Pollar (`pub_testnet_…`), que está pensada para eso.
