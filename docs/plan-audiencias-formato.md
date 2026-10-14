# Plan: formato "Referencia cruzada" de audiencias realizadas (PDF)

Estado: **construido** (13 de octubre de 2026), en la rama `audiencias-formato`. Falta correr la migración y el SQL de datos.

## Objetivo

Cuando una audiencia está en estado **Realizada**, se puede descargar, a pedido, un PDF con el formato
"Referencia cruzada" de CENDOJ, que registra el enlace de la grabación. Se basa en el formato que ya
existe hecho con `@react-pdf/renderer` en otro proyecto, optimizado.

## Decisiones

| Tema | Decisión |
|---|---|
| Librería | `@react-pdf/renderer` (MIT, compatible con React 19). Se carga solo al descargar. |
| Cuándo se genera | Solo cuando alguien lo descarga, en el navegador. El PDF no se guarda. |
| Qué audiencias | Solo las que están en **Realizada** (siempre tienen grabación). Nunca las canceladas. |
| Dónde se descarga | Botón "Descargar formato (PDF)" en el modal de detalle y opción en el menú ⋮ de la fila o tarjeta. |
| Quién puede | Quien puede ver la audiencia (`audiencias.ver` en su juzgado). Sin permiso nuevo. |
| Nombre del archivo | `Referencia-cruzada-<radicado de 23 dígitos>-<AAAAMMDDHHmm de la audiencia, hora de Colombia>.pdf`, p. ej. `Referencia-cruzada-68001310300520170012301-202610150830.pdf` |
| Papel | Oficio (Legal). |
| Elaborado por | Quien registra o cambia el enlace de grabación. Si después se corrige el enlace, pasa a ser quien lo corrigió. |
| Fecha de elaboración | Cuando se registra o cambia el enlace de grabación. |
| Cargo | El cargo de esa persona en ese momento, elegido de una lista en su perfil. |
| Logo | El de la Rama Judicial, Consejo Superior de la Judicatura (versión JPG de 674 × 200 px), reducido y comprimido para impresión. |
| Pie | Solo "Página X de Y". Se quita "Diseñado y Desarrollado por". |

## Contenido del PDF

Encabezado con borde: logo a la izquierda; a la derecha "Centro de Documentación Judicial",
"-CENDOJ-" y "FORMATO REFERENCIA CRUZADA".

| Bloque | Campo | Valor |
|---|---|---|
| 1. Datos de registro | Fecha de elaboración | Fecha en que se registró la grabación (Colombia), en texto largo. |
| | Elaborado por | Nombre guardado al registrar la grabación. |
| | Cargo | Cargo guardado al registrar la grabación. |
| 2. Identificación expediente | No. Radicación del Proceso | Radicado con guiones (`68001-31-03-005-2017-00123-01`), con el mismo formato de los correos. |
| 3. Descripción del documento o elemento | Descripción | "Link " + tipo de audiencia del catálogo (p. ej. "Link Audiencia de Remate"). |
| | Fecha del documento o elemento (AAAA/MM/DD) | Fecha de la audiencia (Colombia). |
| | Fotografía del documento o elemento | N/A |
| | Ubicación del documento o elemento | Enlace de la grabación (clicable, con salto de línea si es largo). |

Propiedades del PDF: título "Referencia cruzada <radicado>" y autor "OECCB Virtual".

## Base de datos (una migración)

1. **Catálogo de cargos** `job_positions` (`id`, `name` único, `is_active`). Lo leen los usuarios
   autenticados. Por ahora se administra solo desde el SQL Editor (sin pantalla ni permiso nuevo).
   Cargos iniciales:
   - Técnico de Sistemas Grado 11
   - Profesional Universitario Grado 20, 17, 14 y 12
   - Asistente Administrativo Grado 7 y 5
   - Juez
   - Oficial Mayor
   - Escribiente
2. **Cargo en el perfil**: `profiles.position_id` (referencia al catálogo). Cada usuario cambia solo el
   suyo: `grant update (position_id)` a `authenticated`, con la misma política de fila propia que
   `full_name`. Nadie más lo cambia desde el navegador.
3. **Cambio de contraseña obligatorio**: `complete_password_change()` rechaza (`position_required`)
   si el usuario no tiene cargo. Así, un usuario nuevo no puede usar el dashboard hasta elegir su
   cargo y cambiar su contraseña.
4. **Registro de la grabación en `hearings`**:
   - `recording_set_by` (usuario), `recording_set_at` (fecha y hora);
   - `recording_set_by_name`, `recording_set_by_position` (copias de texto del nombre y el cargo en
     ese momento, para que el formato no cambie si la persona cambia de cargo, de nombre o se
     desactiva).

   Las llena el trigger de reglas cada vez que `recording_url` cambia y hay un usuario. Sin usuario
   (SQL Editor) no las toca. No se pueden escribir desde el navegador.
5. **Lectura**: las columnas nuevas se leen con el resto de la audiencia (mismas políticas de
   `audiencias.ver`).

## Datos (SQL aparte, fuera del repositorio, lo corre el usuario)

1. **Cargos de los usuarios actuales**, por correo, según el listado entregado:

   | Cargo | Usuarios |
   |---|---|
   | Técnico de Sistemas Grado 11 | gaguilah@cendoj |
   | Profesional Universitario Grado 20 | emorenov |
   | Profesional Universitario Grado 17 | jcalderm |
   | Profesional Universitario Grado 14 | jronderb |
   | Profesional Universitario Grado 12 | smosqueg |
   | Asistente Administrativo Grado 7 | ltrianag |
   | Asistente Administrativo Grado 5 | ngomezh, mmonsalt, djaimesv, aceleitq, slizarab, nortizm |
   | Juez | naceveds (J1), jortizp (J2) |
   | Oficial Mayor | cflorezr (J1), svelascoc (J2) |
   | Escribiente | mmunozgo (J1), openaca (J2) |

   La cuenta gaguilah@gmail.com (superadmin) no está en el listado: queda sin cargo.
2. **Audiencias ya realizadas** (de hoy hacia atrás): elaborado por la cuenta gaguilah@cendoj, nombre
   "Giovanni Aguilar Hernández" (con tilde), cargo "Técnico de Sistemas Grado 11" y fecha de
   elaboración = fecha de la audiencia. Antes de correrlo se revisa que no dispare los avisos de
   cambio por correo ni altere `updated_at` / `updated_by`.

## Dashboard

1. **Mi perfil**: campo "Cargo" (lista) junto al nombre, en el mismo formulario. Mientras el usuario
   deba cambiar la contraseña, un aviso le pide elegir el cargo y luego cambiar la contraseña; si
   intenta terminar sin cargo, ve el mensaje de `position_required` en español.
2. **Audiencias**:
   - `HearingDetailModal`: en una audiencia Realizada, botón "Descargar formato (PDF)" con indicador
     mientras se genera; debajo, "Grabación registrada por <nombre> el <fecha>".
   - Menú ⋮ de la tabla y las tarjetas: "Descargar formato" solo en las Realizadas.
3. **El PDF** vive en `src/dashboard/audiencias/formato/` (componente del documento, estilos, datos
   del formato y función de descarga). Se importa de forma diferida (`import()`), así la librería
   (~500 KB) y el logo solo se descargan al pedir el primer formato.

## Optimizaciones respecto al formato actual

1. Fuente Roboto incluida en el sitio (normal y negrita), no desde `http://fonts.gstatic.com`.
2. Pesos registrados de verdad: el formato actual pide "semibold" y "light" con una sola variante, así
   que no se aplican.
3. Logo reducido al tamaño de impresión (~600 px de ancho) y comprimido (~30–40 KB).
4. Nombre y cargo desde la base de datos, no fijos en el código.
5. Radicado completo de 23 dígitos, formateado.
6. Fechas en hora de Colombia.
7. Numeración de páginas automática.
8. Enlace de grabación con salto de línea.
9. Sin pie de autoría.

## Etapas

1. Migración (catálogo, cargo en el perfil, contraseña, columnas de la grabación) + SQL de datos.
2. Mi perfil: campo Cargo y bloqueo en el cambio de contraseña.
3. Formato PDF con las optimizaciones (componente, fuente, logo).
4. Botón en el modal y opción en el menú ⋮.
5. Pruebas: PDF de una audiencia de cada juzgado (contenido, nombre del archivo, tamaño, enlace
   clicable), que las canceladas y programadas no ofrezcan el formato, que corregir la grabación
   cambie "Elaborado por", y que un usuario nuevo no pueda terminar el cambio de contraseña sin
   cargo. Revisión de tipos, lint y build.
6. Documentar en CLAUDE.md.

## Observación

El perfil de la cuenta gaguilah@cendoj tiene hoy el nombre "Giovanni Aguilar Hernandez" (sin tilde).
Las audiencias ya realizadas saldrán con tilde (lo fija el SQL), pero las grabaciones que se
registren desde ahora tomarán el nombre del perfil: conviene corregirlo en Mi perfil.
