# Cómo contribuir a Awayu

¡Gracias por sumarte! Awayu es un proyecto boliviano: finanzas comunitarias andinas (pasanaku, ayni, minka, alasitas) sobre Stellar.

## Sin instalar nada (documentos y textos)
1. Pide acceso al repositorio (Settings → Collaborators) o haz un *fork*.
2. En GitHub abre el archivo, toca el lápiz ✏️, edita y pulsa **Commit changes**.
3. Escribe un mensaje que diga qué cambió, por ejemplo: `Validación: tres entrevistas en La Cancha`.

Archivos donde suele hacer falta ayuda:

| Archivo | Qué se espera |
|---|---|
| `docs/VALIDACION.md` | Entrevistas con organizadores de pasanaku (datos agregados y citas sin nombres) |
| `docs/COOPERATIVAS.md` | Consultas a cooperativas e IFD y sus respuestas |
| `docs/EQUIPO.md` | Tu fila: rol, enlace y relación con el problema |
| `web/src/i18n/qu.js`, `ay.js`, `gn.js` | Revisión de quechua, aymara y guaraní por hablantes |

## Con el código
```bash
npm --prefix web install
npm --prefix web run dev      # http://localhost:5173
npm --prefix web test         # pruebas (deben pasar todas)
npm --prefix web run build
```
Los contratos (`contracts/*`) se prueban en GitHub Actions con `cargo test`. Si tu sistema lo permite, también localmente.

## Reglas de estilo
- **Español neutro**, con tuteo y sin voseo. Una prueba automática detecta el voseo.
- Todo texto nuevo de la interfaz pasa por `t()` o por el diccionario del archivo y lleva traducción al inglés y al portugués. La prueba `web/test/idiomas-cobertura.test.js` lo comprueba.
- Cada acción nueva de la interfaz lleva su tema de ayuda en `web/src/guide/help.js` y su video corto en `web/public/tutoriales/`.
- No publiques datos personales (nombres, teléfonos, capturas de chats) ni claves. Las claves van en las variables de entorno del proveedor, nunca en el repositorio.
- Honestidad: lo simulado se marca como simulado.

## Ramas y revisiones
Para cambios de código, crea una rama (`git checkout -b mi-cambio`) y abre un *pull request*. Debe pasar la integración continua (`Web` y `Contrato`).
