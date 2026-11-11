# Plan: preguntas frecuentes (sitio público + dashboard)

> **Histórico.** El comportamiento actual está en [modulos/preguntas-frecuentes.md](modulos/preguntas-frecuentes.md). Si este plan y el módulo no coinciden, vale el módulo.

Estado: **fase 1 construida** (10 de noviembre de 2026), en la rama `preguntas-frecuentes`. La migración
`20261110120000_faq.sql`, la carga `supabase/data/faq_initial.sql` y `20261110130000_faq_public_filter.sql` (la
página pública mostraba las ocultas a los funcionarios con sesión) ya corrieron en producción y están registradas.
Antes de publicar el contenido faltan los datos por confirmar con la oficina (al final).

Fase 2 (imágenes) **construida** el 10 de noviembre de 2026 en la misma rama. Falta correr
`20261110140000_faq_images.sql` en producción y revisar la CSP nueva (`img-src` con Supabase) en un Deploy
Preview antes de mezclar.

## Objetivo

Una página pública con las preguntas que los usuarios hacen con más frecuencia a la oficina (títulos, oficios,
procesos, consignaciones). Las preguntas se administran desde el dashboard, para que la oficina pueda agregar más
sin cambiar código.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Secciones | Sí: **Títulos, Oficios, Procesos, Consignaciones**, en ese orden. También se administran: se pueden crear más y cambiar el orden |
| Contenido | **Administrable desde el dashboard** (tablas en Supabase), no escrito en el código |
| Acceso público | **Pie de página** (columna "Servicios") y un aviso en **Contacto**. No va en el menú principal, que ya está lleno |
| Ruta | `/preguntas-frecuentes`, dentro de `PublicLayout` |
| Presentación | **Solo preguntas y respuestas.** Sin botón "Escribir correo", sin botones de copiar, sin buscador. Las respuestas no indican asunto de correo |
| Quién administra | **El director de oficina** (`director_oficina`): ve y gestiona. El Administrador de Sistema siempre puede. Se puede cambiar después en Roles |
| Imágenes | Opcionales por pregunta (hay 3 pendientes). Van en la **fase 2**, porque necesitan Supabase Storage y un cambio en la CSP |

## Página pública

- Título "Preguntas frecuentes" (`PageHeader`) y un subtítulo corto con la nota del radicado (ver "Texto propuesto").
- Una sección por cada sección con preguntas publicadas, con su título y ancla (`#consignaciones`), para poder
  enviar el enlace directo. Las secciones sin preguntas publicadas no se muestran.
- Cada pregunta es un desplegable (`<details>`), como las preguntas frecuentes de Ayuda. Cerradas al cargar.
- Desde `lg`, índice de secciones a la izquierda (como "En esta guía" en Ayuda); en pantallas más pequeñas, el
  índice arriba, en un `<details>` plegable.
- Mientras carga, esqueleto; si falla, `Alert` con "No fue posible cargar las preguntas"; si no hay ninguna
  publicada, `EmptyState`.
- `useDocumentMeta({ title: 'Preguntas frecuentes' })`.

## Formato de las respuestas

Texto sencillo, sin HTML (la prueba `lib/noRawHtml.test.ts` prohíbe `innerHTML`), con tres marcas:

- `**negrita**`, como en Ayuda (`RichText`);
- líneas que empiezan con `- ` → lista;
- una línea en blanco → párrafo nuevo.

Un componente compartido convierte ese texto en elementos de React, tanto en la página pública como en la vista
previa del editor. Va en `components/faq/`, porque el código público no puede importar `src/dashboard`. Así se
escriben las cuentas y los requisitos sin necesidad de tablas.

## Base de datos (fase 1)

Migración nueva con, para cada tabla, `revoke all … from anon, authenticated`, RLS activo y grants explícitos por
columna (regla del proyecto). Las pruebas `migrations.test.ts`, `01_esquema.sql` y una prueba pgTAP nueva van en el
mismo commit.

**`faq_sections`**: `id`, `title` (3–80), `slug` (único, generado del título, no cambia), `position`, `created_at`,
`updated_at`.

**`faq_questions`**: `id`, `section_id` (FK; una sección con preguntas no se puede eliminar), `question` (10–200),
`answer` (10–4000), `position` (orden dentro de la sección), `is_published` (por defecto `false`),
`image_path` (fase 2), `created_at`, `updated_at`, `created_by`, `updated_by`.

- **Lectura pública** (`anon`, `authenticated`): las preguntas con `is_published` y las secciones. Solo las columnas
  que muestra la página (nunca `created_by` / `updated_by`).
- **Permisos:** `preguntas.ver` (ver la sección en el dashboard, con borradores) y `preguntas.gestionar` (crear,
  editar, ordenar, publicar u ocultar, eliminar). No van por juzgado: el contenido es de la oficina. La migración
  crea los permisos y se los asigna al rol `director_oficina` solo si existe, para que reconstruya una base
  vacía. El Administrador de Sistema los tiene siempre. Después se pueden cambiar en Roles.
- Trigger que llena `created_by` / `updated_by` / `updated_at` y no deja cambiar `created_at` ni `slug`, como en
  avisos de remate.
- Reordenar con una función `security invoker` (`move_faq_question(id, direction)`) que intercambia posiciones en
  una sola transacción.
- **Contenido inicial:** no va en la migración (las migraciones solo cambian la estructura). Va en un script SQL
  aparte (`supabase/data/faq_initial.sql`) para correr una vez en el SQL Editor, con el texto revisado de abajo y todas las preguntas sin publicar,
  para revisarlas antes en el dashboard.

## Dashboard (fase 1)

- Enlace `Preguntas frecuentes` en `dashboardLinks` (`group: 'main'`, después de Encuestas, permiso
  `preguntas.ver`) y el módulo en `MODULE_LABELS`.
- `/dashboard/preguntas-frecuentes`: lista agrupada por sección (tabla desde `xl`, tarjetas abajo, según las
  convenciones). Estado con `PublicationBadge` (Publicada / Oculta). En el ⋮ (`ActionMenu`): Editar, Subir,
  Bajar, Publicar / Ocultar, Eliminar (`danger`, con `ConfirmDialog`). Filtro por sección.
- Botón "Crear pregunta" y botón "Secciones" (`/dashboard/preguntas-frecuentes/secciones`: crear, renombrar,
  ordenar, eliminar si está vacía).
- Formulario: sección, pregunta, respuesta (con ayuda del formato: negrita, listas) y **vista previa** igual a la
  pública. Validación con zod; las mismas reglas van en las restricciones de la tabla (cambiar ambas juntas).
- Aviso fijo en el formulario: "Revise con cuidado números de cuenta, convenios y correos: se publican tal cual."

## Imágenes (fase 2)

- Bucket público `faq-images` en Supabase Storage. Solo `preguntas.gestionar` sube o borra (políticas de
  `storage.objects`). PNG, JPG o WebP, máximo 2 MB.
- `faq_questions.image_path` + texto alternativo `image_alt` (obligatorio si hay imagen).
- En la página, la imagen va debajo de la respuesta, con zoom al tocarla, como `TutorialImage`.
- **CSP:** hoy `img-src 'self' data: blob:`. Hay que agregar el dominio de Supabase. Va con su prueba en
  `src/lib/netlify.test.ts`, revisión en Deploy Preview y PR, según la regla de despliegue.
- **Datos personales:** las 3 capturas (Consulta de Procesos con "Elaboración de títulos", el beneficiario y
  "Oficios librados") deben tener **ocultos** los nombres de las partes y del beneficiario, documentos y radicado
  real antes de subirlas. El sitio es público. Se recuerda en el formulario al subir una imagen.
- Mientras no estén las imágenes, las respuestas indican dónde buscar ("Consulte su proceso en Consulta de
  Procesos…"), sin "Imagen pendiente".

## Documentación y pruebas

- `docs/modulos/preguntas-frecuentes.md` + fila en `docs/modulos/README.md`.
- Guía en Ayuda (`guides.ts` + `data.ts`) para el personal: cómo crear, ordenar, publicar y dar formato.
- `CLAUDE.md`: sección nueva.
- Vitest: esquema zod, convertidor del formato (incluidos los textos de `lib/testInjection.ts`), slug, orden.
- pgTAP: `anon` solo ve publicadas y solo las columnas permitidas; sin `preguntas.gestionar` no se escribe;
  sección con preguntas no se elimina; trigger de autor.
- Pie de página y Contacto: prueba de que el enlace apunta a la ruta registrada en `App.tsx`.

## Texto propuesto

Cambios generales:

- "Mensaje de datos" se cambia por "correo electrónico", que es lo que el ciudadano entiende.
- Se usa siempre "usted", como el resto del sitio.
- El radicado se explica una sola vez, en la introducción.
- Se quita la repetición del cobro del título (el párrafo venía dos veces con otras palabras).
- Las respuestas largas se dividen en listas.

**Introducción de la página:**

> Todas las solicitudes se envían al correo **ofejccbuc@cendoj.ramajudicial.gov.co**. Escriba siempre el
> **número de radicado completo, con sus 23 dígitos**; sin él no es posible ubicar el proceso.

El correo sale de `CONTACT_EMAIL` (`src/lib/contact.ts`). Dentro de las respuestas se escribe como texto, porque
es contenido administrable.

### Títulos

**¿Cómo sé si ya se elaboró un título en mi proceso?**
Consulte su proceso en Consulta de Procesos de la Rama Judicial. Cuando el título está elaborado, aparece la
actuación **"Elaboración de títulos"**.

**¿Cómo sé quién es el beneficiario del título?**
En la anotación de la actuación "Elaboración de títulos" aparece el nombre del beneficiario, sea persona
natural o jurídica.

**¿Cómo cobro un título?**
El beneficiario debe acudir a cualquier oficina del **Banco Agrario de Colombia** en el país con estos
documentos:

- **Persona natural:** documento de identidad.
- **Persona jurídica:** el representante legal, con su documento de identidad y el certificado de existencia
  y representación legal expedido por la Cámara de Comercio.

### Oficios

**¿Cómo sé si ya se elaboraron los oficios en mi proceso?**
En Consulta de Procesos aparece la actuación **"Oficios librados"**.

**¿Cómo solicito que me envíen los oficios librados?**
Envíe un correo a la oficina con el radicado completo (23 dígitos) del proceso.

**¿Cómo solicito los oficios de levantamiento de medidas cautelares o de adjudicación del remate?**
Envíe un correo a la oficina con:

- el radicado completo (23 dígitos);
- el nombre completo y el número de identificación de quien retirará los oficios;
- si los retira otra persona, el poder o la autorización.

La oficina le asignará una **cita presencial** para el retiro.

### Procesos

**¿Cómo solicito la revisión de un proceso?**
La revisión se pide por correo, sin necesidad de ir a la oficina. Envíe un correo con el radicado completo
(23 dígitos) y la calidad en la que actúa en el proceso (por ejemplo, demandante, demandado o apoderado).

**¿Cómo solicito el desarchivo de un proceso?**
Envíe un correo con:

- el radicado completo (23 dígitos);
- copia del recibo de pago del arancel judicial hecho en el Banco Agrario (la cuenta está en Consignaciones).

**¿Cómo solicito el desglose de documentos o copias auténticas?**
Envíe un correo con:

- el radicado completo (23 dígitos);
- el nombre completo y el número de identificación de quien retirará los documentos;
- copia del recibo de pago del arancel judicial hecho en el Banco Agrario;
- copia de los documentos que desea desglosar o autenticar;
- si quien retira no es una de las partes (demandante o demandado) ni su apoderado, el poder o la autorización.

La oficina le asignará una **cita presencial** para el retiro.

### Consignaciones

**¿En qué cuenta consigno posturas de remate y embargos?**

- **Cuenta de depósitos judiciales:** 680012031800
- **Referencia:** radicado completo (23 dígitos)

**¿En qué cuenta consigno el arancel judicial?**

- **Cuenta corriente:** 3-0820-000755-4
- **Convenio:** 14975

**¿En qué cuenta consigno el impuesto de remate del 5 %?**

- **Cuenta corriente:** 3-0820-000755-4
- **Convenio:** 13477

**¿Cómo pago la retención en la fuente del 1 % (DIAN)?**
Con el **Formulario 490** de la DIAN (Recibo Oficial de Pago de Impuestos Nacionales).

## Datos por confirmar con la oficina

1. **Cuentas y convenios:** confirmar los números con el director antes de publicar. Un número mal escrito hace
   que el dinero llegue a otra cuenta.
2. **Banco** de la cuenta 3-0820-000755-4 (arancel e impuesto de remate). ¿Es Banco Agrario?
3. **Retención del 1 %:** ¿basta con nombrar el Formulario 490, o la oficina indica dónde se diligencia y paga?

## Fases

1. **Fase 1:** migración (tablas, RLS, permisos, trigger, orden) + pruebas; página pública; dashboard (lista,
   formulario con vista previa, secciones); pie de página y Contacto; documentación y guía de Ayuda; script del
   contenido inicial (sin publicar).
2. **Fase 2:** imágenes (Storage, CSP con Deploy Preview, formulario, zoom en la página).
