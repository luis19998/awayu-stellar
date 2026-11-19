# Revisión de seguridad del contrato Pasanaku v2

**Alcance:** lectura estática de `contracts/pasanaku/src/lib.rs`, centrada en versión 2, garantías, alias y `members()`. No se modificó el contrato ni se ejecutaron pruebas Rust. Los resultados describen el código del commit revisado; validar los puntos en CI antes de desplegar.

## Hallazgos

### Alto — TTL puede borrar la garantía y dejar fondos sin retiro

**Ubicación:** `lib.rs:26-28`, `136-142`, `190-192`, `207`, `304-322`, `327-339`.

**Escenario:** se deposita una garantía y el círculo queda inactivo, o dura más que el TTL persistente. El constructor solo rechaza un periodo de cero y no limita su duración (`lib.rs:190-192`, `207`), mientras que la clave persistente de garantía solo se extiende hasta 120 días al escribirla o consumirla. Al expirar, `guarantee_of()` devuelve cero (`lib.rs:129-134`); aunque los tokens siguen en el contrato, `withdraw_guarantee()` rechaza el retiro con `NoGuarantee`. Si también expira una marca de historial, se reconstruye como historial vacío y el puntaje vuelve a cero.

**Arreglo propuesto:** establecer un máximo de duración del círculo compatible con el TTL, y renovar explícitamente todas las claves activas en cada avance de ronda. Para ciclos largos, usar almacenamiento/renovación diseñada para persistir hasta cierre y permitir recuperación segura de fondos; añadir una ruta de rescate acotada que no pueda retirar garantías todavía comprometidas.

### Medio — `members()` publica saldo de garantía y perfil completo

**Ubicación:** `lib.rs:73-84`, `361-380`.

**Escenario:** cualquier cliente que invoque `members()` obtiene en una sola respuesta las direcciones, alias, puntajes, pago actual y garantía restante de todos los integrantes. La llamada no pide autorización. Esto facilita asociar identidades con capacidad financiera o participación aunque los miembros solo esperasen compartir el estado de pagos.

**Arreglo propuesto:** decidir y documentar explícitamente que esos campos son públicos antes de aceptar el círculo. Si no todos lo son, separar el estado público (orden y marcas necesarias) de la garantía privada y exponer la garantía solo al titular mediante una consulta autenticada, o evitar guardarla en cadena si la privacidad es requisito. La autenticación no vuelve secreto el estado almacenado en Stellar; para confidencialidad real hace falta rediseñar qué se publica.

### Medio — alias admite caracteres de control y nombres visualmente engañosos

**Ubicación:** `lib.rs:24`, `345-358`.

**Escenario:** `set_alias()` valida únicamente que la cadena mida entre 1 y 24 bytes. Un participante puede guardar caracteres de control, texto bidireccional o caracteres Unicode parecidos a los de otro nombre. La interfaz podría mostrar nombres truncados o engañosos; además, el comentario promete 24 caracteres, pero `String::len()` limita bytes.

**Arreglo propuesto:** definir una política de alias (p. ej., letras, números, espacios y puntuación segura), rechazar controles y caracteres de dirección bidireccional, normalizar Unicode y aclarar si el límite se mide en bytes o puntos de código. La interfaz debe renderizar el alias como texto, nunca como HTML.

### Bajo — el `pot` de `round_info()` omite garantías que cubrirían faltas

**Ubicación:** `lib.rs:255-301`, `391-400`.

**Escenario:** antes del payout, `round_info()` calcula el pozo como cuota por aportes registrados. Si un miembro faltó pero tiene garantía suficiente, `payout()` incluirá esa cuota en el pago al destinatario; el campo `pot` mostrado justo antes del payout subestima el pago que se ejecutará.

**Arreglo propuesto:** documentar `pot` como aportes efectivamente recibidos, o calcular y exponer por separado el pozo proyectado y las cuotas garantizadas disponibles, sin presentar la garantía como aporte ya realizado.

## Límites de esta revisión

No se evaluaron dependencias, configuración de despliegue, economía del token, comportamiento de tokens no estándar ni controles de acceso del frontend. En Stellar, los datos almacenados y eventos son observables públicamente: ocultar un campo de `members()` solo reduce su exposición conveniente, no lo vuelve confidencial.
