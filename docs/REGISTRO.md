# Registro colectivo de Awayu

`contracts/registro` guarda un índice común de los círculos de ahorro de Awayu.
Al crear un pasanaku, su organizador puede registrar la dirección del contrato,
el nombre, el departamento y la fecha de creación. Cada contrato de círculo
solo se puede registrar una vez.

El registro también permite que cada miembro declare su participación en un
círculo. Antes de guardarla, consulta `get_config` del contrato `pasanaku` y
comprueba que la dirección figure entre sus miembros. Así la web puede reunir
los círculos de una persona sin consultar uno por uno todos los contratos.
Una persona que ya declaró su participación puede dejar un aval comunitario;
solo cuenta un aval por dirección y círculo.

## Memoria colectiva y uso en la web

La lista de fichas alimenta el mapa de Bolivia: cada ficha aporta la región y
la dirección del círculo. La consulta de círculos por miembro reúne las
participaciones para el pasaporte de reputación; la web puede después leer de
cada pasanaku sus marcas e historial. Los avales muestran apoyo de otros
participantes, pero no son una garantía financiera ni una validación de pagos.

Las consultas `count`, `get` y `page` permiten recorrer el índice completo;
`by_region` y `by_member` son accesos directos para el mapa y el pasaporte.
Los datos persistentes usan el mismo TTL renovable de 120 días del contrato de
pasanaku: las operaciones que consultan o actualizan una ficha renuevan su TTL.

## Privacidad

Todo lo que se escribe en Stellar es público y puede ser leído por cualquiera.
Direcciones, nombres de círculos, departamentos, participaciones, fechas y
avales no son información privada. La web debe explicarlo antes de enviar una
transacción y evitar registrar datos personales sensibles. La participación
se añade solo con autorización de la dirección del miembro. El historial
detallado de pagos sigue en cada contrato de pasanaku.
