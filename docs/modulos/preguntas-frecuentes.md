# Preguntas frecuentes

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia está en el plan enlazado al final.

## Qué es

Página pública con preguntas y respuestas sobre los trámites de la oficina, agrupadas por secciones
(Títulos, Oficios, Procesos, Consignaciones…). El contenido se administra desde el dashboard, sin
código. La página muestra solo preguntas y respuestas: no tiene botones de correo, de copiar ni
buscador.

| Dónde | Ruta | Quién |
|---|---|---|
| Sitio público | `/preguntas-frecuentes` (enlaces en el pie de página, columna Servicios, y en Contacto; no está en el menú principal) | Todos; solo las preguntas publicadas |
| Dashboard | `/dashboard/preguntas-frecuentes` | `preguntas.ver`; cambios con `preguntas.gestionar` |
| Dashboard | `/dashboard/preguntas-frecuentes/secciones` | `preguntas.gestionar` |

Asignación vigente (migración, 2026-11-10): `preguntas.ver` y `preguntas.gestionar` para
`director_oficina`; el superadmin las tiene siempre. Se cambia en Roles.

## Tablas

**`faq_sections`**

| Columna | Valor |
|---|---|
| `slug` | Ancla pública (`#consignaciones`). La genera el navegador del título al crear (`sectionSlug` en `components/faq/data.ts`: minúsculas sin tildes, números y guiones; `-2`, `-3` si ya existe; nunca `pregunta-…`). Única. No cambia: sin grant de UPDATE y el trigger la conserva |
| `title` | 3 a 80 caracteres, sin espacios en los extremos |
| `position` | Orden. El trigger la pone al final al crear; la cambia `move_faq_section` |

**`faq_questions`**

| Columna | Valor |
|---|---|
| `section_id` | FK `on delete restrict`: una sección con preguntas no se elimina (23503) |
| `question` | 10 a 200 caracteres, sin espacios en los extremos |
| `answer` | 10 a 4.000 caracteres. Formato abajo |
| `position` | Orden dentro de la sección. Al crear o cambiar de sección, queda al final |
| `image_path`, `image_alt` | Imagen de apoyo opcional: nombre del archivo en el bucket `faq-images` (UUID + `.png`/`.jpg`/`.webp`) y texto alternativo (5 a 200). Las dos o ninguna (`faq_questions_image_pair_chk`) |
| `is_published` | `false` al crear: el navegador siempre crea ocultas y se publica desde el menú |
| `created_at`, `updated_at`, `created_by`, `updated_by` | Los pone el trigger `faq_questions_before_write`. Reordenar no cambia `updated_at` |

Los límites se repiten en `components/faq/data.ts` y en `dashboard/preguntas/schema.ts`: cambiar los
tres juntos (`faq/data.test.ts` compara con la migración).

## Formato de las respuestas

Texto sencillo, nunca HTML (`components/faq/format.ts`, mostrado por `FaqAnswer`):

- `**negrita**`;
- línea que empieza con `- ` (o `• `) → lista;
- línea en blanco → párrafo nuevo; un salto simple se respeta dentro del párrafo.

`FaqAnswer` arma elementos de React, así que un `<script>` escrito en una respuesta se ve como texto.
El formulario normaliza la respuesta (`normalizeAnswer`: saltos de línea, espacios finales, como máximo
una línea en blanco seguida).

## Permisos y RLS

| Quién | Lee | Escribe |
|---|---|---|
| `anon` | Secciones; preguntas publicadas, columnas `id, section_id, question, answer, position, is_published, image_path, image_alt` | Nada |
| `authenticated` sin permiso | Lo mismo que el público | Nada |
| `preguntas.ver` | Todas las preguntas, también las ocultas (más `is_published`, `created_at`, `updated_at`) | Nada |
| `preguntas.gestionar` | Igual | Secciones (`slug`, `title` al crear; `title`, `position` al editar) y preguntas (`section_id`, `question`, `answer`, `is_published`, `position`), y borrar |

La página pública **filtra** `is_published = true` (`useFaq`): usa la sesión del navegador, y con la de un funcionario con `preguntas.ver` la RLS también deja ver las ocultas. Por eso `anon` puede leer `is_published` (migración `20261110130000_faq_public_filter`). `created_by` / `updated_by` no los lee nadie desde el navegador. Reordenar: `move_faq_question(p_id,
p_up)` y `move_faq_section(p_id, p_up)` (`security invoker`, piden `preguntas.gestionar`, renumeran 1..n y
cambian la posición con la vecina en una transacción). Ninguna Edge Function usa estas tablas, así que
`service_role` no tiene grants.

## Imágenes de apoyo (fase 2)

Migración `20261110140000_faq_images`. Bucket **público** `faq-images` de Supabase Storage: hasta 2 MB,
solo PNG, JPG y WebP (límites del bucket, repetidos en `components/faq/data.ts`). La página las lee
por la URL pública (`faqImageUrl`: `<VITE_SUPABASE_URL>/storage/v1/object/public/faq-images/<archivo>`),
que no pasa por RLS. En `storage.objects` hay políticas `faq_images_select|insert|delete` solo para
`preguntas.gestionar`. El público no tiene SELECT, así que no puede listar el bucket. No hay UPDATE: cada
archivo nuevo lleva un UUID nuevo (nunca el nombre original, que puede tener datos personales).

- **Al guardar:** primero se sube el archivo y después se guarda la pregunta. Si la pregunta no se
  guarda, se borra el archivo recién subido.
- **Al reemplazar, quitar o eliminar:** se borra el archivo anterior después de guardar. Es un borrado
  de "mejor esfuerzo": si falla, queda un archivo huérfano que nadie enlaza.
- **En la página pública:** la imagen va debajo de la respuesta, con zoom (`TutorialImage`).
- **CSP de Netlify:** `img-src` incluye el dominio de Supabase (`src/lib/netlify.test.ts`).

## Pantallas

- **Pública:** índice de secciones a la izquierda desde `lg` y plegable arriba en pantallas más chicas;
  cada pregunta es un `<details>` cerrado. Anclas: la sección (`#<slug>`) y cada pregunta
  (`#pregunta-<id>`, que llega desplegada). Las secciones sin preguntas publicadas no se muestran. Una
  línea de introducción con el correo (`CONTACT_EMAIL`) y el radicado de 23 dígitos.
- **Dashboard:** lista por sección (filtro `?seccion=`), tarjetas con la pregunta, el resumen de la
  respuesta, Publicada / Oculta y la fecha de actualización. Menú ⋮: Vista previa (con "Ver en el
  sitio" si está publicada), y con `preguntas.gestionar` Editar, Subir, Bajar, Publicar / Ocultar
  (confirmación) y Eliminar (confirmación). Formulario con vista previa igual a la pública y un aviso
  para revisar cuentas, convenios y correos.
- **Secciones:** crear, renombrar, subir, bajar y eliminar (deshabilitado con el motivo si tiene
  preguntas).

## Contenido inicial

`supabase/data/faq_initial.sql`, para correr una vez en el SQL Editor después de la migración (se
puede repetir sin duplicar). Crea las cuatro secciones y las 13 preguntas, todas ocultas. Antes de
publicar, la oficina confirma los números de cuenta y de convenio, el banco de la cuenta
3-0820-000755-4 y la indicación sobre el Formulario 490.

## Archivos y migraciones

- `src/components/faq/` (formato, datos, `FaqAnswer`, `useFaq`), `src/pages/PreguntasFrecuentes.tsx`.
- `src/dashboard/preguntas/` (`FaqAdminPage`, `QuestionFormModal`, `SectionsPage`, `api.ts`, `schema.ts`).
- Migraciones `20261110120000_faq`, `20261110130000_faq_public_filter` y `20261110140000_faq_images`.
  Pruebas pgTAP en `supabase/tests/11_preguntas_imagenes.sql` (imágenes). Pruebas pgTAP en `supabase/tests/10_preguntas.sql`.
- Guía para el personal: Ayuda → Preguntas frecuentes (`src/dashboard/ayuda/data.ts`).

## Preguntas frecuentes (desarrollo)

- **"permission denied" al leer en la página pública.** La consulta pide una columna sin grant para
  `anon` (por ejemplo `updated_at` o `*`): pedir solo las columnas de la tabla de arriba.
- **Un funcionario ve preguntas ocultas en la página pública.** Falta el filtro `is_published = true`
  en la consulta: la RLS del dashboard se suma a la pública cuando hay sesión.
- **Una pregunta publicada no aparece.** Su sección también debe existir; recargar la página. Revisar
  `is_published` en el dashboard.
- **La imagen no se ve en producción.** Revisar la consola: si dice Content-Security-Policy, falta el
  dominio de Supabase en `img-src` (`netlify.toml`).
- **"No se pudo subir la imagen".** Tipo o tamaño fuera de los límites del bucket, o el usuario no tiene
  `preguntas.gestionar`.

## Historial

[plan-preguntas-frecuentes](../plan-preguntas-frecuentes.md)
