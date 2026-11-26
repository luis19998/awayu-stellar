# Junta con remate y consórcio con lance

En una junta con remate peruana, un grupo reúne cuotas periódicas y cada persona recibe el pozo una vez. Quien necesita el dinero antes puede ofrecer cobrar menos. En un *consórcio* brasileño, el grupo reúne aportes para que sus integrantes accedan por turnos a una carta de crédito. Según las reglas del grupo, el turno puede obtenerse por sorteo o mediante una oferta llamada *lance*. Awayu toma de ambas modalidades la posibilidad de adelantar el turno mediante una oferta y la representa como un descuento sobre el pozo.

En el pasanaku de Awayu, el sorteo inicial fija quién cobra en cada ronda. En el remate, ese orden sirve de respaldo cuando nadie puja. En ambos, quien ya cobró sigue aportando hasta que termine el círculo.

## Cuatro personas con una cuota de 10

Ana, Bruno, Carla y Diego aportan 10 cada uno. Hay 40 en el pozo. Ana ofrece un descuento del 5 % y Bruno ofrece el 15 % (1500 puntos básicos). Gana Bruno. Su descuento vale 6 y recibe 34. Ana, Carla y Diego reciben 2 cada uno. Así, los cuatro pagos suman exactamente 40.

Para Bruno, esos 6 son el **costo de cobrar antes**. Para quienes aportaron y dejaron el pozo a otra persona, el reparto es el **premio de esperar**. En rondas posteriores, quien ya cobró también participa en el reparto si aporta su cuota. Bruno puede recibir esa parte, aunque ya utilizó su único turno de cobro del pozo.

## Reglas del contrato

- Cada miembro puede aportar una vez por ronda. Hasta el instante del vencimiento inclusive, el aporte recibe la marca 1. Después recibe la marca 2 si la ronda sigue sin liquidar. Los vencimientos se cuentan desde la creación del círculo.
- Quien ya aportó y aún espera su turno puede pujar hasta ese vencimiento inclusive. Se aceptan entre 0 y 5000 puntos básicos (del 0 % al 50 %). Una puja puede subir. En caso de empate, tiene prioridad quien registró primero su primera puja en esa ronda, incluso si luego la aumentó. Una puja explícita de cero también compite.
- Cualquiera puede liquidar en cuanto todos hayan aportado o cuando haya pasado el vencimiento. Gana la puja más alta. Si no hubo pujas, cobra la primera persona del orden sorteado que aún espera su turno.
- Una garantía opcional equivale a una cuota. Si falta el aporte, la garantía disponible entra al pozo y el historial registra la marca 4. Si tampoco hay garantía, el historial registra la marca 3 y el pozo se reduce en esa cuota. Al terminar el círculo, cada miembro puede retirar su garantía sin usar.
- El descuento se calcula sobre el pozo efectivo, incluido el sobrante anterior, y se redondea hacia abajo a la unidad mínima del token. El ganador recibe el pozo menos ese descuento. Las demás personas que aportaron directamente, a tiempo o tarde, reciben partes iguales. Quien solo cubrió su cuota con la garantía queda fuera de ese reparto.
- El resto indivisible pasa al pozo siguiente. Si únicamente aportó el ganador, pasa todo el descuento. Si queda un saldo después de la última ronda, permanece en el contrato y se puede consultar en `round_info().carry`. La versión 1 carece de una operación para retirarlo.

## Conexión con la web

El simulador de `#/latam` ya muestra la regla económica principal con un grupo que aporta completo. El contrato añade aportes reales, garantías y cálculo en unidades enteras del token. El simulador desempata por índice y fuerza descuento cero cuando solo queda un candidato. Para mostrar el resultado real, la vista debe tomar el ganador y los importes de la cadena.

1. Compilar el contrato y ejecutar sus pruebas en CI. Desplegar `remate.wasm` en testnet con el token, la cuota, el periodo en segundos y las direcciones de los miembros. Registrar la dirección del contrato para la web.
2. Consultar por RPC `round_info`, `members` y `bids`. Las rondas se numeran desde cero. `recipient` indica quién cobraría con las ofertas actuales. `pot` ya incluye el sobrante anterior y `covered` cuenta las garantías que entrarían al pozo al liquidar.
3. Conectar las acciones de aporte, garantía y puja a la billetera. Convertir los porcentajes a puntos básicos y los importes a unidades mínimas. Tras confirmar `settle`, leer el evento `remate` con el ganador, la ronda, el pozo y el descuento, y actualizar el historial. Incorporar los tutoriales de las nuevas acciones al habilitarlas en la web.
