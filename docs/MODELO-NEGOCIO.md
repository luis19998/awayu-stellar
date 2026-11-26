# Modelo de negocio (hipótesis a validar)

Estado: **hipótesis**. Los montos de abajo no salen de clientes reales: son el punto de partida que el piloto debe confirmar o corregir (ver `docs/COOPERATIVAS.md`).

## Quién usa y quién paga
| | Quién | Paga |
|---|---|---|
| **Usuario** | Comerciantes y productores de Cochabamba que ya ahorran en pasanaku (mercados como La Cancha, asociaciones gremiales) | Nada. El historial es suyo y lo comparte cuando quiere |
| **Primer cliente que paga** | **Cooperativas de ahorro y crédito e IFD** que dan microcrédito a comerciantes sin historial en la central de riesgos | Por cada reporte verificado que consultan |
| Cliente posterior | Asociaciones de comerciantes que administran varios círculos | Plan mensual por círculo (recordatorios, reportes del grupo, soporte) |

Por qué la cooperativa es la primera: es quien recibe el valor medible (evaluar a alguien sin historial con menos visitas de campo y menos riesgo) y tiene presupuesto para evaluación de crédito. El comerciante no debe pagar por demostrar que cumple.

## Precio (hipótesis)
- **Bs 15 por reporte verificado** consultado por la cooperativa (lectura en línea con enlaces a los contratos y la constancia de titularidad firmada).
- **Bs 20 por círculo al mes**, que **paga la asociación** (no la cooperativa ni el comerciante) solo si quiere funciones de administración: recordatorios, reportes del grupo y soporte. Es opcional y empieza desde el segundo año; el primer año la única fuente de ingreso es el reporte.
- Costo de red por transacción: fracciones de centavo de dólar en Stellar. Lo absorbe Awayu con transacciones patrocinadas (ver `docs/PAGOS-REALES.md` §5).

## Tamaño del primer mercado
- **Nicho:** 41 cooperativas de ahorro y crédito y 8 IFD con licencia de ASFI (dato del formulario; confirmar con la lista vigente de entidades supervisadas de ASFI), empezando por las que operan en Cochabamba.
- **Cuenta rápida (supuesto):** si 10 entidades consultan 50 reportes al mes cada una, son 500 reportes × Bs 15 = **Bs 7.500 al mes**. Con las 49 entidades, a 100 reportes al mes, el techo del nicho es Bs 73.500 al mes. Son supuestos para dimensionar, no proyecciones.

## Economía por unidad (supuestos)
| Concepto | Valor | De dónde sale |
|---|---|---|
| Precio por reporte | Bs 15 | Hipótesis a validar con cooperativas |
| Costo de red por reporte | menos de Bs 0,01 | El reporte solo **lee** contratos (simulación en la RPC, sin transacción) |
| Costo de servidor | cerca de Bs 0 | Página estática en Vercel; la lectura la hace el navegador de la cooperativa |
| Margen bruto por reporte | casi Bs 15 | El costo real está en vender y en dar soporte, no en la red |
| Reportes para cubrir un sueldo mínimo (Bs 2.750) | ~184 al mes | Por ejemplo, 4 cooperativas con 46 reportes cada una |

El nicho inicial es chico a propósito: sirve para demostrar que una cooperativa paga por la evidencia. El crecimiento viene después, de sumar entidades fuera de Cochabamba y de las asociaciones que pagan por administrar sus círculos.

## Qué tiene que pasar para que esto sea cierto
1. Al menos una cooperativa responde que el historial le sirve como antecedente y en qué formato lo quiere (`docs/COOPERATIVAS.md`).
2. Comerciantes que aceptan pagar su pasanaku en dólares digitales y compartir su historial (`docs/VALIDACION.md`).
3. Un proveedor de rampa autorizado para entrar y salir en bolivianos (`docs/PAGOS-REALES.md`).
