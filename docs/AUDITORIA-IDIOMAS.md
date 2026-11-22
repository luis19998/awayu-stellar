# Auditoría de cobertura de idiomas

Revisión de `web/index.html`, `web/reporte.html` y `web/src/**/*.js`, salvo `src/games/` y `src/views/latam.js`, que están fuera de esta tarea. No había un directorio `src/latam/` en este worktree. Se revisaron textos estáticos, textos creados desde JavaScript, atributos accesibles, títulos y placeholders, avisos, errores que llegan a pantalla, diálogos, etiquetas 3D y mensajes que se actualizan después de una acción.

## Resultado por archivo

| Archivo | Texto o superficie revisada | Cómo quedó |
| --- | --- | --- |
| `web/index.html` | Título y descripción de la página; `Idioma`, `Otro`, instrucciones, etiquetas, placeholders, `title`, `aria-label` y textos de controles. | Los literales visibles usan `data-i18n`; atributos se traducen desde su valor original. El selector conserva sus seis idiomas y `<html lang>` sigue el idioma activo. |
| `web/src/i18n.js` | Texto base de nodos y atributos traducibles. | `applyStatic()` cubre `data-i18n`, `title`, `placeholder`, `aria-label`, `alt` y `content` cuando se indica; guarda la clave original para repintar. `setLang()` actualiza el documento y emite `awayu:lang`. |
| `web/src/i18n/en.js`, `web/src/i18n/pt.js` | Claves globales de controles, estados, errores, categorías, rutas, catálogos dinámicos y textos de reporte. | Se añadieron las versiones inglesa y portuguesa de las claves que faltaban. Los nombres de marca y propios conservan su forma oficial; las excepciones están justificadas en la prueba de cobertura. |
| `web/src/main.js` | Menú del círculo, membresía, aportes, garantías, bienvenida, selector de figuras, preguntas, botones, `title`, diálogos de correo/creación/USDC, toasts, historia y resultados posteriores a acciones. Ejemplos: `Conecta tu billetera`, `Ya aportaste`, `Retirar garantía`, `Entrar con tu correo`, `No se pudo: {why}`. | Los textos pasan por `t()` y los avisos conservan la clave y las variables para volver a traducirse mientras siguen visibles. Diálogos abiertos, controles, toast e historia se actualizan al recibir `awayu:lang`. Los roles conocidos de perfiles también se traducen. |
| `web/src/app.js` | Menú de ayuda, botón y avisos de recorrido. | Usa las claves globales y vuelve a aplicar el idioma tras el evento. |
| `web/src/dashboard.js` | Navegación y sus `title`; títulos y descripciones de vistas; etiquetas de modo, botones y estados; mapa, pasaporte, juegos, Amawta y ecosistema integrado. | Las rutas y el catálogo pasan por `t()`. Al cambiar idioma se actualiza la navegación y se vuelve a montar la vista abierta, salvo las vistas Ayni, Minka y Alasitas, que preservan su estado al repintarse. El error de Amawta usa una clave traducible; la respuesta es contenido generado en el idioma solicitado. |
| `web/src/chain.js` | Errores que pueden terminar en el aviso del aporte: saldo, rutas USDC, estado de transacción, red y Friendbot. | Errores conocidos pasan por `t()`; errores externos desconocidos se presentan mediante el mensaje localizado de recuperación de la interfaz. |
| `web/src/wallet.js`, `web/src/certificate.js` | Rechazos de billetera, consentimiento y fallos al crear certificados que pueden llegar al aviso principal. | Se canalizan por `friendly(e)`: los errores conocidos se traducen y las respuestas ajenas a la aplicación usan el mensaje de recuperación localizado. |
| `web/src/modes/ayni.js` | Etiqueta del modo Ayni. | Usa la traducción global. |
| `web/src/settings/panel.js` | Ajustes, opciones, perfiles, etiquetas, botones y descripciones. | Conserva su diccionario por idioma; el panel abierto vuelve a dibujarse al cambiar idioma sin perder la selección. Los nombres de perfil escritos por la persona permanecen como fueron ingresados. |
| `web/src/views/ayni.js` | Solicitudes, votos, contribuciones, estados, botones, ayudas, placeholders y errores. | El diccionario local tiene es/en/pt; qu/ay/gn usan las traducciones existentes y caen al español cuando faltan. `awayu:lang` vuelve a dibujar la vista y mantiene el contenido de formularios y el estado del aviso. |
| `web/src/views/minka.js` | Línea de tiempo, etapas, cantidades, evidencias, acciones, estados y errores. | El diccionario local cubre es/en/pt y usa español como fallback explícito para qu/ay/gn. La vista abierta repinta y conserva campos y estado después del cambio de idioma. |
| `web/src/views/alasitas.js` | Metas, tipos, progreso, fechas, aportes, formularios, estados y errores de firma. | Diccionario local es/en/pt; qu/ay/gn conservan traducciones cortas disponibles y usan español para textos sin versión segura. La vista y su diálogo abierto se repintan preservando valores, selección y estado. |
| `web/src/views/billetera3d.js` | Etiquetas y leyenda de los sprites 3D, además del texto de la billetera. | Se completó `TEXT` para portugués. El evento de idioma redibuja las etiquetas y la leyenda sin recargar la escena. Direcciones y saldos siguen siendo datos. |
| `web/src/views/mapa3d.js` | Nombre accesible del mapa, conteos, estado vacío y fallo de carga. | El diccionario local incluye es/en/pt. La ruta se vuelve a montar al cambiar idioma; los topónimos que llegan de los datos geográficos se conservan. |
| `web/src/views/pulso.js` | Título, subtítulo, estadísticas y estado de indisponibilidad. | Se completó el texto portugués; la ruta vuelve a montarse al cambiar idioma. Las métricas no son texto traducible. |
| `web/src/views/verificar.js` | Pestañas y formularios de sorteos, comprobantes, círculos y reportes; estados, errores y resultados posteriores a consultas. | Ya usaba un diccionario local es/en/pt y fallback a español para qu/ay/gn. El panel se vuelve a montar al cambiar idioma; una respuesta pendiente de la vista anterior no se muestra en la nueva. |
| `web/src/views/legal.js` | Índice, secciones y aviso de disponibilidad de traducción. | Ya usaba textos es/en/pt; para qu/ay/gn explica de forma localizada que las secciones extensas se muestran en español. La ruta se vuelve a montar con el nuevo idioma. |
| `web/src/guide/help.js` | Tutoriales, títulos, contenido, botones y elementos accesibles. | Se amplió el soporte portugués de los contenidos y el panel abierto se cierra y vuelve a abrir en el idioma seleccionado. |
| `web/src/guide/tour.js` | Recorrido abierto, video, navegación y botones `Saltar`, `Anterior`, `Siguiente` y `Terminar`. | El recorrido vuelve a pintar el paso actual al recibir `awayu:lang`, incluido el texto accesible del video. |
| `web/src/guide/welcome.js` | Bienvenida, explicación, nombres y descripciones de idiomas, navegación y glosario. | Usa `t()` y el diccionario global. La bienvenida abierta vuelve a dibujarse y el idioma elegido se mantiene. |
| `web/src/guide/proactive.js` | Consejos, botones, `aria-label` y síntesis de voz. | Se añadieron textos portugueses; el consejo abierto se vuelve a dibujar al cambiar idioma. |
| `web/src/guide/voice.js` | Controles de voz y errores de permisos, escucha y reconocimiento. | Errores conocidos usan el idioma activo y la operación de escucha adopta el idioma nuevo si cambia mientras está pendiente. |
| `web/src/guide/devconsole.js` | Consola, títulos de fragmentos, nombres de campos y estados. | Se añadieron traducciones portuguesas y las etiquetas se regeneran desde el idioma actual. |
| `web/src/custom/studio.js` | Diálogo de personalización, pestañas, colores, controles y etiquetas accesibles. | El diálogo abierto se cierra y se vuelve a abrir en el nuevo idioma, conservando pestaña y preferencias. Los códigos de color son datos. |
| `web/src/legal/consent.js` | Consentimiento, botones y texto de riesgos. | Se repinta el diálogo abierto y se conserva la casilla marcada. |
| `web/src/qr/qr.js` | Diálogos de recibir, escanear y recargar; resultados de escaneo, botones y errores. | Los diálogos y resultados usan los textos por idioma y reaccionan a `awayu:lang`; el contenido QR y los identificadores son datos. |
| `web/src/reporte.js` | Cabecera, filtros, datos, estados, exportación y mensajes de error del reporte. | Se añadió diccionario de reporte es/en/pt, selector conectado a `getLang()/setLang()`, formato de fechas y números según el locale y repintado de datos cargados. Qu/ay/gn caen al español. |
| `web/reporte.html` | Encabezado y selector pequeño de idioma del reporte. | El selector muestra los seis idiomas y adopta el idioma guardado; se actualiza `<html lang>`. |
| `web/src/reporte.css` | Presentación del selector de idioma. | Solo estilos; no contiene texto para traducir. |
| `web/src/app.js`, `web/src/chain.js`, `web/src/main.js` | Errores que llegan mediante `friendly(e)` o avisos de transacción. | Se traducen los errores conocidos y se usa un mensaje genérico localizado para errores ajenos a la aplicación. Así no se exponen mensajes crudos de SDK o proveedor en otro idioma. |

## Repintado

`setLang()` guarda el código, actualiza los nodos estáticos y los atributos, cambia `document.documentElement.lang` y emite `awayu:lang`. `main.js` actualiza el círculo, menú, paneles y diálogos de su ámbito; `dashboard.js` actualiza la navegación y repinta la vista actual. Las vistas con formularios propios guardan los valores y el estado antes de redibujar. Ayuda, bienvenida, recorrido, consola, configuración, consentimiento, QR, personalización, billetera 3D y consejos escuchan el mismo evento. El selector del reporte también llama a `setLang()` y su página vuelve a pintar los datos en memoria.

## Fallbacks y datos que permanecen

- Inglés y portugués cubren las claves globales y los diccionarios locales revisados. La prueba detecta claves faltantes e identifica frases largas que quedaron idénticas al español.
- Quechua, aymara y guaraní conservan las traducciones cortas que ya existían. Los textos nuevos o extensos sin traducción segura caen explícitamente al español; no se inventaron traducciones.
- Nombres de personas, nombres ingresados por la persona, direcciones, hashes, identificadores, cifras, topónimos del catálogo y nombres propios de productos se muestran como datos. No son mensajes de interfaz pendientes de traducción.
- `src/games/` y `src/views/latam.js` se excluyeron de los cambios según el encargo; esos módulos quedan fuera de esta auditoría de implementación.

## Conteo de traducciones globales

En esta pasada se añadieron **99 claves al catálogo inglés (`en.js`) y 222 valores al catálogo portugués (`pt.js`)**. En los módulos con diccionario propio, las traducciones y repintados quedan agrupados en la fila de cada archivo de la tabla anterior; en `reporte.js` las etiquetas es/en/pt tienen paridad de claves, verificada por la prueba.

## Verificación automatizada

`web/test/idiomas-cobertura.test.js` comprueba claves globales usadas con `t()` y los marcadores `data-i18n` de `index.html`, presencia en inglés y portugués, frases extensas sin traducir, excepciones justificadas para nombres propios y ausencia de las formas de voseo indicadas en el brief. También comprueba paridad de claves del reporte. La suite completa se ejecuta con `node node_modules/vitest/vitest.mjs run --configLoader runner` desde `web/`.
