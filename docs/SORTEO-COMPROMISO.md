# Cómo se sortean los turnos con compromiso y revelación

En el pasanaku v3, el contrato mezcla la lista de cobro al crear el círculo. Usa `env.prng()`, el generador de la red. Si quien crea el círculo puede descartar un intento y volver a enviar la transacción, puede quedarse con un orden que le convenga. Para un círculo que mueve dinero, importa que la lista y los aportes al sorteo queden fijados antes de conocer el resultado.

## Un sorteo entre tres personas

1. **Inscripción.** Ana organiza un círculo con Beto y Luz. Firma la creación del sorteo con las tres direcciones, en un orden fijo. Elige las 10:00 como límite para comprometerse y las 11:00 como límite para revelar.
2. **Antes de las 10:00, cada persona guarda su secreto y envía una huella.** La aplicación genera 32 bytes aleatorios nuevos para cada persona en su dispositivo. Ana firma y publica la huella de su secreto unido a su dirección. Beto y Luz hacen lo mismo. Con la huella publicada, cada persona queda vinculada a un único secreto. La dirección impide que otra persona copie la huella y la haga valer como propia.
3. **Desde las 10:00 y antes de las 11:00, cada persona revela su secreto.** El contrato vuelve a calcular la huella con la dirección de quien firma. Si coincide, registra la revelación. Si los tres revelan a las 10:15, cualquiera puede cerrar el sorteo en ese momento.
4. **Al cerrar, se fija el orden de cobro.** El contrato combina los secretos revelados con el número del ledger donde se confirma el cierre. Un ledger es un bloque de operaciones confirmadas en Stellar. Con esos datos y la lista original, cualquiera puede reproducir la mezcla. El primer cierre queda registrado y es definitivo.

Si Luz pierde su secreto o decide guardárselo, Ana y Beto deben esperar hasta las 11:00 para cerrar. Ellos ocupan los dos primeros turnos en el orden que determine la mezcla y Luz queda tercera. Lo mismo ocurre si Luz nunca envía su compromiso. Cuando hay varias personas sin revelación, todas quedan detrás de quienes sí revelaron y conservan entre ellas el orden que les dio la mezcla.

Si nadie revela, el contrato usa `env.prng()` para ordenar toda la lista. La consulta `get(id)` deja constancia con `fallback = true`. Quien revise el círculo podrá reconocer que ese resultado tuvo la misma limitación que el sorteo de la demo.

## Cómo reproducir el resultado cuando hubo revelaciones

- El compromiso es `SHA-256(secreto ‖ dirección)`. El símbolo `‖` significa concatenar los bytes. El secreto son 32 bytes crudos. La dirección se serializa como un valor de Stellar en formato XDR (`ScVal::Address`, el resultado de `participant.to_xdr(&env)`).
- Se combinan los secretos aceptados con XOR, byte a byte. El orden de llegada de las revelaciones da igual. La semilla es `SHA-256(XOR ‖ número_del_ledger_de_cierre)`.
- Sobre la lista de inscripción se aplica Fisher-Yates. Para cada posición `i`, desde la última hasta la segunda (índices desde cero), se calcula `SHA-256(semilla ‖ i)`. Se interpreta el hash completo como un entero y se toma el resto de dividirlo por `i + 1`. Ese resto indica con qué posición intercambiar `i`. Tanto el ledger como `i` se codifican en cuatro bytes con el más significativo primero. El hash también se interpreta con el byte más significativo primero.
- Se recorre la lista mezclada y se conservan dos grupos en su orden de aparición. Primero se devuelven las direcciones que revelaron y luego todas las demás.

## Qué influencia conserva quien cierra

Mientras un secreto aleatorio siga guardado en el dispositivo de una persona, quien envía `finalize` desconoce ese aporte. Las revelaciones aceptadas, en cambio, son públicas. Cuando el sorteo está listo, quien lo cierra puede calcular qué orden resultaría en distintos ledgers e intentar elegir cuándo enviar la transacción. Otra persona también puede cerrarlo primero. La sanción desincentiva ocultar el último secreto para influir en los turnos de los demás, pero esa decisión todavía puede cambiar el resultado.

## Integración prevista con el pasanaku v4

Al crear el círculo, v4 fijará la lista de miembros y guardará el identificador de un único sorteo. Cada miembro podrá comprometerse y revelar con su propia dirección. El círculo esperará al cierre antes de iniciar la primera ronda y tomará el orden definitivo de `get(id).order`, incluso si otra persona ya llamó a `finalize`. Así el organizador queda vinculado al sorteo que eligió al crear el círculo. El mismo contrato podrá prestar el servicio a la rifa y al cacho verificable.
