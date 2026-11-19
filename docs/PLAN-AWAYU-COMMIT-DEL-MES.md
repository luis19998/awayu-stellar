# Awayu — preparación para Commit del Mes y hackatón Stellar Bolivia

**Revisado:** 18 de noviembre de 2026  
**Demo pública:** [awayu-pasanaku.netlify.app](https://awayu-pasanaku.netlify.app)  
**Repositorio:** [luis19998/awayu-stellar](https://github.com/luis19998/awayu-stellar)

## Estado confirmado

- Awayu es un pasanaku rotativo sobre Stellar: contrato Soroban, pagos, historial de cumplimiento y aguayo 3D como representación de reputación portable.
- La web pública carga en Netlify. En modo demo muestra aportes simulados; la proyección de Vaquita aparece explícitamente como simulada. El modo Stellar testnet consulta el contrato desplegado.
- El repositorio está **privado**. El formulario de Commit del Mes dice que debe ser público para que revisen los commits. No se cambió la visibilidad ni se envió el formulario.
- La rama local `main` está sincronizada con el remoto y su commit más reciente es `51e9781` (18 nov). Las dos últimas ejecuciones de CI que consulté terminaron bien en `3c00669`, anterior a `main`; hay que obtener una ejecución verde sobre el commit actual antes de presentar el proyecto.
- La vista móvil de 390 × 844 px muestra el escenario 3D y las métricas, pero mete el panel en un segundo scroll. El sello de Netlify cubre la esquina de las acciones y el encabezado compite por espacio con el botón de billetera.
- La consola de la web no muestra errores; sí muestra avisos de Three.js por `THREE.Clock` y `PCFSoftShadowMap` obsoletos.

## Fechas y convocatoria

- El formulario [Challenge: Commit del Mes](https://tally.so/r/zEMQB1) acepta participación hasta el **27 de noviembre** y solicita nombre, correo, proyecto, antigüedad, si se es embajador y URL de GitHub. Su texto dice que el repositorio debe ser público para revisar commits.
- La convocatoria de la [National Startups Hackathon by Stellar](https://www.teapaw.org/buidlersbo) publicada por Buidlers Bolivia indica construcción del 9 al 22 de noviembre, inscripción hasta el 22 y final presencial en Santa Cruz el 27. Una ficha secundaria difiere con el 28; tomar el anuncio del organizador como referencia y confirmar cualquier cambio con Buidlers Bolivia.
- El [resumen oficial de Stellar](https://stellar.org/blog/ecosystem/stellar-ambassador-program-september-october-2026) confirma que Stellar Bolivia prepara su hackatón de noviembre, aunque no detalla ahí el calendario.

## Hosting y dominio

**Recomendación: conservar Netlify para esta entrega.** Ya sirve el sitio estático de Vite desde el dominio gratuito `awayu-pasanaku.netlify.app`, y el proyecto ya tiene `netlify.toml`. Netlify Free ofrece 300 créditos mensuales, límite duro y pausa del servicio al agotarlos; los Deploy Previews son ilimitados. La página oficial también confirma que el plan Free permite uso comercial dentro de esos límites.

Vercel Hobby tiene límites generosos para sitios personales, pero sus términos lo reservan para uso personal y no comercial. Como Awayu se está presentando como startup, el plan Hobby añade una restricción innecesaria. Migrar ahora no aporta una ventaja funcional clara a esta SPA de Vite/Three.js. No hace falta comprar ni registrar otro dominio: el subdominio `.netlify.app` ya es público y gratuito.

**Para usar el dominio en el registro:** abrir `https://awayu-pasanaku.netlify.app`, copiar la URL; el formulario pide la URL del repositorio de GitHub, no el dominio de la demo. Si en el futuro se conecta un dominio propio, se conserva también la dirección `.netlify.app`.

Fuentes de plataforma: [precios de Netlify](https://www.netlify.com/pricing/), [límites y créditos de Netlify](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [subdominios Netlify](https://docs.netlify.com/manage/domains/domains-fundamentals/understand-domains/), [Vercel Hobby](https://vercel.com/docs/plans/hobby) y [uso permitido en Vercel](https://vercel.com/docs/limits/fair-use-guidelines).

## Diseño, 3D y producto

1. **Primero corregir móvil:** evitar el scroll anidado; ordenar escenario, modo y acciones para que la acción principal aparezca sin desplazar un panel interno; dar espacio al encabezado y ocultar el distintivo de Netlify en producción si la cuenta lo permite.
2. **Separar demo y testnet a simple vista:** identificar red y tipo de datos antes de cualquier acción; distinguir XLM de testnet de USDC proyectado; mostrar enlace/hash del contrato o transacción después de una operación real.
3. **Explicar el valor del aguayo:** indicar qué representa cada marca (a tiempo, tarde, faltó), cómo se obtiene el puntaje y qué información queda pública. Tratar la reputación como evidencia de pagos, no como promesa de crédito aprobado.
4. **Reforzar el recorrido del pitch:** problema boliviano → cómo funciona el pasanaku → aporte y turno → historial portable → qué ya está en cadena y qué está simulado.
5. **Mantener Three.js como base 3D por ahora.** El escenario procedural ya tiene identidad y carga en móvil. Mejorar primero jerarquía, iluminación, escala, lectura de etiquetas y rendimiento. Blender solo vale la pena si se va a producir un objeto artesanal optimizado (por ejemplo, el recipiente del pozo) como GLB; Fusion 360 no encaja con este producto web ni con el arte textil. No instalar Blender/Fusion MCP sin una tarea concreta.
6. **No añadir IA dentro del producto todavía.** Una conversación o una recomendación automática no mejora el núcleo del pasanaku y puede dar una impresión de evaluación financiera. Usar Claude y Codex para construir/revisar; invertir el tiempo de producto en claridad, pagos verificables, incorporación y manejo de atrasos.

## Conexiones y preparación de agentes

- Claude Code y Codex tienen MCP de Netlify y Vercel habilitados; Figma y Linear también están conectados. GitHub está disponible mediante `gh` autenticado en esta máquina.
- Las skills de Stellar y Pollar ya estaban en `.claude/skills/` y `.agents/skills/`. Añadí desde el repositorio oficial de Netlify las skills `netlify-config`, `netlify-deploy` y `netlify-frameworks` para **Claude Code y Codex**. La skill CLI reportó las tres como instaladas y sin alertas críticas.
- El inventario actual no muestra servidores MCP de Blender ni Fusion 360. Para esta entrega no bloquea el trabajo.
- El chequeo de salud de `claude mcp list` devuelve Netlify y Vercel conectados. La ejecución no interactiva de `claude -p` no pudo consultar la cuenta porque Claude CLI respondió `Not logged in`; no hice cambios en Netlify. Para una consulta de dashboard desde esa terminal se necesita iniciar sesión en Claude Code (`claude`, luego `/login` si lo solicita). La conexión OAuth de Netlify no se debe repetir si sigue autorizada.
- Repositorios de referencia ya presentes localmente bajo `referencias/`: Stellar Dev Skill, Soroban Examples, Stellar Scaffold CLI, Pollar SDK/apps, Vaquita UI y ejemplos, además de OpenZeppelin Stellar Contracts. Verifiqué los remotos oficiales de las skills Stellar y Pollar; no hace falta clonar más repositorios ahora.

## Secuencia sugerida para mañana (19 nov)

1. Decidir y ejecutar la publicación del repositorio a GitHub público; antes revisar el historial y confirmar que no haya claves, `.env` ni datos personales. El formulario no puede revisar los commits mientras siga privado.
2. Lanzar/verificar CI sobre `51e9781` y anotar el resultado; no asumir que los checks de `3c00669` cubren cambios posteriores.
3. Claude Code toma un ticket acotado de escena 3D o arquitectura; Codex toma un ticket distinto de móvil/UX y hace revisión. Mantener ramas separadas y no editar los mismos archivos en paralelo (regla existente en `AGENTS.md`).
4. Hacer commits con cambios completos y revisables. El reto enfatiza progreso y commits, pero evitar commits vacíos o fragmentación artificial; asociar cada commit a una mejora visible o a una corrección concreta.
5. Revisar deploy preview de Netlify; publicar producción tras revisar el preview y conservar `awayu-pasanaku.netlify.app` como URL del proyecto.
6. Completar manualmente el formulario Tally con los datos del equipo y la URL pública de GitHub. Revisar el proyecto y la URL antes de enviar.

## Acciones que requieren al usuario

- Cambiar el repositorio de privado a público (el cambio expone el contenido e historial) y revisar que no se publique ningún secreto.
- Completar/enviar el registro Tally con datos personales del equipo.
- Si la terminal de Claude Code solicita login, completar `/login`; después puede consultarse el dashboard de Netlify en modo lectura.

