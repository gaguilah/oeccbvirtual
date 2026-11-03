# Plan: pruebas unitarias por sección, parte pública y parte privada (hecho: Fases 0, 1, 2, 3 y 4)

Hoy hay 7 archivos de prueba (45 pruebas, Vitest) frente a unos 336 archivos de código en `src/`: solo
cubren el carrusel y los datos de Servicios del inicio, las reglas de Mi perfil y una regla de Usuarios. No
hay pruebas de componentes, de punta a punta, de la base de datos (RLS, triggers, funciones) ni de las Edge
Functions. Este plan empieza por la **lógica pura** (reglas, fechas, esquemas, filtros de la URL, datos),
que es lo más barato de probar y lo que más protege, sección por sección: primero la parte pública, después
la privada. Rama: `pruebas` (sale de `correcciones-revision`, que trae las pruebas de Usuarios y Mi perfil).

## Decisiones tomadas (2026-10-29)

1. Unitarias con Vitest como hoy (entorno Node, sin archivo de configuración, `src/**/*.test.ts` junto al
   archivo que prueban, `describe` / `it` / `expect` importados de `vitest`).
2. Un commit por sección (o por fase en la Fase 0), cada uno con `npm test`, `npm run lint` y
   `npm run build`.
3. Componentes, base de datos y punta a punta quedan para planes posteriores (ver al final).

## Reglas para todas las fases

- **Lógica escondida en hooks o componentes.** Si una regla vive dentro de un hook o un `.tsx` (por ejemplo,
  leer y escribir los filtros de la URL), primero se mueve a un `.ts` puro sin cambiar su comportamiento y
  luego se prueba. El movimiento va en el mismo commit que sus pruebas, para que se vea que no cambia nada.
- **Sin Supabase.** Una prueba nunca importa `src/lib/supabase.ts`, ni directamente ni a través de otro
  módulo (sin las variables de entorno falla al cargar). Si la lógica está en un archivo que importa el
  cliente, se separa a otro `.ts`, como `profile/personalErrors.ts`. No se simula la red.
- **Reglas repetidas en SQL.** Cuando la regla también vive en una migración (horario de audiencias, URL del
  PDF, plazos, formatos), la prueba lleva un comentario con la migración, para recordar que se cambian juntas.
- **Fechas fijas.** Nada de `new Date()` sin argumento: las pruebas no dependen del día ni de la zona del
  equipo. Las fechas se escriben con su desfase de Bogotá (`2026-10-29T08:00:00-05:00`).
- **Números de las constantes.** Las pruebas usan las constantes del código (`REALIZADO_DESPUES_DE_MIN`,
  `FIRST_HOUR`, …) cuando prueban sus límites, para no repetir cifras escritas a mano.
- **Documentación.** Al terminar cada fase, la sección "Commands" del CLAUDE.md y, si aplica, el
  `docs/modulos/` de la sección dicen qué queda cubierto.

## Fase 0 · Base común (hecha el 2026-10-29)

Resultado: 6 archivos nuevos, 20 pruebas. Hallazgos: `passwordErrorMessage('toString')` devolvía la función
heredada de `Object` en vez del mensaje genérico (se corrigió con `Object.hasOwn`), y el comentario de
`formatDate` mostraba un formato que ya no es el real ("17 de feb de 2026").

| Archivo | Qué probar |
|---|---|
| `components/remates/dates.ts` | Formato de fecha y hora en `America/Bogota` (lo usan casi todas las secciones) |
| `lib/courts.ts` | Nombres de los juzgados (corto, oficial con `CONTACT_CITY`), `courtByNumber`, `courtPublicationsUrl` |
| `lib/password.ts` | Reglas de la contraseña y traducción de errores de Auth |
| `lib/externalLinks.ts` | URL https completas, títulos sin repetir |
| `components/ui/tabIds.ts`, `lib/cn.ts` | Ids de pestaña y panel; que `cn` resuelva conflictos de Tailwind |

## Fase 1 · Parte pública (hecha el 2026-10-29)

Resultado: 6 archivos nuevos, 41 pruebas (106 en total). Los filtros de la URL de Avisos de Remate y
Audiencias pasaron de sus hooks a `remates/filters.ts` y `audiencias/filters.ts` (`parseFilters`,
`serializeFilters`) sin cambiar su lógica. Las reglas que repiten las Edge Functions (`submit-request`:
tipos y límites de PQRS; `password-reset`: `RESET_PATH`) se comprueban leyendo su código como texto
(`import … from '…/index.ts?raw'`), igual que las rutas de `App.tsx` frente al menú.

| Sección | Qué probar |
|---|---|
| PQRS | `pqrs/schema.ts`: campos por paso (`stepFields`, `validateFields`), `acceptedTerms` obligatorio, límites del resumen; `pqrs/data.ts` (`REQUEST_STEPS`) coherente con los pasos del formulario |
| Encuesta | `survey/validation.ts`: `answerSchema` para `yes_no` y `scale` (rango `scale_min`–`scale_max`), texto de una respuesta (`n de max (etiqueta)`) |
| Avisos de Remate | Agendado / Realizado y Próximos / Pasados con `REALIZADO_DESPUES_DE_MIN` (incluido el minuto exacto del corte); lectura y escritura de los filtros de la URL (`useRematesFilters`: `juzgado`, `periodo`, `q`, `pagina`, valores inválidos) |
| Audiencias | `publicStatus()` (Programada, Por confirmar, Realizada, Cancelada); filtros de la URL (`useAudienciasFilters`, rango de fechas) |
| Tutoriales | Integridad de `tutorials/data.ts`: slugs únicos y válidos para la URL, `prerequisites` y `next` que apuntan a slugs existentes, `tutorialPath`; el número de tutoriales coincide con el ciclo de la ilustración (`tutorials/illustrationData.ts` y la utilidad `animate-illustration-cycle`) |
| Navegación y contacto | `mainLinks` sin rutas repetidas; `services/data.ts` ya está cubierto |

## Fase 2 · Parte privada (dashboard) (hecha el 2026-10-29)

Resultado: 19 archivos nuevos, 161 pruebas (267 en total, 38 archivos). Un commit por sección. Los
filtros de la URL de PQRS, Encuestas (periodo) y Avisos de Remate pasaron de sus hooks a `filters.ts` /
`period.ts`; las fechas de Audiencias y de Avisos importan de `components/remates/constants` y `/dates`
en vez del barril (que trae `api.ts` y el cliente de Supabase). Las reglas repetidas en SQL se comprueban
leyendo la migración como texto (horario, cierre y eliminación de audiencias, plazo de PQRS, URL del PDF,
límites de encuestas, formato de códigos) y los permisos de `dashboardLinks` y `routes.tsx` contra los que
crean las migraciones.

Hallazgos corregidos:

- **Días no hábiles:** dos festivos trasladados al mismo lunes (30 de junio de 2025: San Pedro y Sagrado
  Corazón) salían como dos filas y "Cargar calendario 2025" fallaba siempre por la clave `day`; ahora es un
  día con los dos motivos.
- **Audiencias:** la vista Mes de un mes que empieza en sábado o domingo (noviembre de 2026, agosto de
  2026) mostraba una primera fila solo con días del mes anterior.
- **Encuestas:** un título sin letras ni números daba un código vacío, y duplicar una encuesta de código
  largo podía dejar un guion al final; la base rechazaba los dos (`surveys_code_format`).
- **Permisos:** `moduleLabel('constructor')` devolvía lo heredado de `Object` (como `passwordErrorMessage`).

Sin cubrir: `layout/sidebarState.ts` es solo un hook (su lectura de `localStorage` no está separada), y las
funciones que llaman a Supabase (`api.ts`) quedan para las pruebas de base de datos.

Por prioridad: primero lo que protege permisos y reglas con plazos o fechas.

| Sección | Qué probar | Prioridad |
|---|---|---|
| Acceso | `checkPermission`: superadmin, rol de alcance juzgado con y sin juzgado, perfil inactivo, sin rol, permiso ausente. `dashboardLinks`: rutas únicas, todo enlace `ready` con `permission`, `linkForPath` | Alta |
| Audiencias | `schedule.ts` (`scheduleProblem`: 7:00–17:00, pasos de 15 minutos, día hábil, futuro); `data.ts` (`canRealizeNow`, `canCancelNow`, `deleteBlocker`); `dates.ts`; `formato/data.ts` (campos y nombre `Referencia-cruzada-<radicado>-<AAAAMMDDHHmm>.pdf`). Reglas repetidas del trigger `hearings_rules` (`20261008150000_hearings.sql`) | Alta |
| Días no hábiles | `calendario/holidays.ts`: festivos de años conocidos (fijos, Ley 51 de 1983 movidos al lunes, los que dependen de Pascua), días de la Rama Judicial (lunes a miércoles santos, 17 de diciembre, vacancia del 2 al 10 de enero y del 20 al 31 de diciembre), solo de lunes a viernes | Alta |
| PQRS | `pqrs/deadline.ts` (cómo se muestran los días restantes, el día del vencimiento y los vencidos), `pqrs/data.ts`, filtros (`useRequestFilters`) | Media |
| Encuestas | `period.ts` (mes, rango de meses hasta 24, año, valores inválidos de la URL), `csv.ts` (separador `;`, BOM UTF-8, CRLF, comillas), `results.ts`, `schema.ts` | Media |
| Avisos de Remate | `pdfUrl.ts` frente al trigger `auction_notices_before_write` (hora de 12 h en Bogotá, carpetas por fecha), `datetime.ts`, `schema.ts`, filtros (`useAdminFilters`) | Media |
| Roles y Permisos | `roleCode()` (nombre a código), `MODULE_LABELS` con todos los módulos de los permisos | Baja |
| Usuarios | `filterUsers` (búsqueda sin tildes, rol, dependencia, estado), `userStatus`, `dependencyLabel` (se suma a `personalInfoBlocker`, ya probado) | Baja |
| Ayuda | `guideForPath`, que cada `paths` de `GUIDES` sea una ruta del dashboard, el formato `**negrita**` de `RichText` (si se separa a un `.ts`) | Baja |
| Layout y perfil | `sidebarState.ts` (lectura segura de `localStorage`), `profile/initials.ts` | Baja |

## Fase 3 · Inyección de código en campos de texto (hecha el 2026-10-30)

Ninguna prueba mete código (`<script>`, `<img onerror=…>`, `javascript:`, `"><`) en los campos para
comprobar que no se ejecuta. La protección existe por diseño, pero no hay pruebas que lo demuestren:

- React muestra todo como texto, y en `src` no hay `dangerouslySetInnerHTML` ni `innerHTML`.
- El único lugar donde un texto escrito por alguien se vuelve HTML son los correos de las Edge Functions,
  y ahí pasa por `escapeHtml` / `multiline` (`supabase/functions/_shared/emails/layout.ts`).
- Los enlaces que se muestran solo aceptan `https://`, en el formulario y en un check de la base.

Mismo patrón que las fases anteriores (Vitest, Node, sin Supabase; las Edge Functions por `?raw` o
importando el módulo si Vitest lo resuelve).

### Parte pública

| Campo | Qué probar | Prioridad |
|---|---|---|
| PQRS: nombre, correo y mensaje | `escapeHtml` y `multiline` con cargas maliciosas (`<`, `>`, `&`, `"`, `'`, saltos de línea); que el acuse y el aviso a la oficina (`_shared/emails/pqrs.ts`) no lleven la carga sin escapar en el HTML; que `requestSchema` y `submit-request` las acepten como texto (no se filtran: se escapan al mostrar) | Alta |
| Búsqueda por radicado (Avisos de Remate, Audiencias, `?q=` en la URL) | `sanitizeQuery` con cargas reales (no solo `abc`): queda solo con dígitos, máximo 23 | Media |
| Todo `src` | Prueba que falle si aparece `dangerouslySetInnerHTML` o `innerHTML` (leyendo los archivos con `import.meta.glob(..., '?raw')`) | Media |

### Parte privada (dashboard)

Los funcionarios escriben texto que llega a los ciudadanos (correos, página pública) o a otros
funcionarios. El riesgo es menor (hay que tener cuenta y permiso), pero un funcionario o una cuenta
robada no debe poder inyectar código en lo que ven los demás.

| Campo | Adónde llega | Qué probar | Prioridad |
|---|---|---|---|
| Respuesta de PQRS y motivo de cierre | Correo al ciudadano (`requestResponseEmail`) y detalle en el dashboard | La respuesta va escapada en el HTML del correo, y la solicitud original también | Alta |
| Nombre del funcionario (`full_name`) | Correos de cuenta (`_shared/emails/account.ts`), menú, Usuarios, formato PDF de audiencias | El saludo del correo va escapado; `profiles_full_name_format` y `profile/schema.ts` ya rechazan `<` y `>` (agregar el caso a sus pruebas) | Media |
| Tipos de audiencia, radicado y enlaces | Correos de audiencias (`_shared/emails/hearings.ts`) y la página pública `/audiencias` | Nombre del tipo y enlace escapados en el HTML; `connection_url` / `recording_url` rechazan `javascript:` y `data:` en `audiencias/schema.ts` y en los checks `hearings_*_url_chk` | Media |
| URL del PDF de un aviso (corrección manual) | Botones "Ver aviso" / "Descargar PDF" del sitio público | `pdfUrlSchema` y `auction_notices_pdf_url_chk` rechazan `javascript:` | Media |
| Encuestas: título, preguntas, ayudas y etiquetas | Página pública `/encuesta` y CSV de resultados | Se muestran como texto (cubierto por la prueba de `src`); en el CSV, una celda que empiece por `=`, `+`, `-` o `@` puede ejecutarse como fórmula en Excel: hoy `csv.ts` no lo evita. Decidir si se antepone `'` y probarlo | Media |
| Información personal y contacto de emergencia | "Ver información personal" en Usuarios (`tel:`, `mailto:`) | Teléfono solo dígitos y correo válido en `personalSchema.ts` (agregar cargas maliciosas a sus pruebas) | Baja |
| Roles y Permisos: nombres y descripciones | Roles, Permisos y la tabla "Quién puede hacer qué" de Ayuda | Se muestran como texto (cubierto por la prueba de `src`); `RichText` solo interpreta `**negrita**` del contenido fijo de Ayuda, nunca texto de la base | Baja |
| Notas de audiencia, carpetas de PDF | Solo el dashboard | Cubierto por la prueba de `src` | Baja |

Fuera de Vitest (anotar, no probar aquí): el sitio no envía cabeceras de seguridad (`Content-Security-Policy`,
`X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`). Se agregarían en `netlify.toml` como segunda
barrera; la CSP debe permitir Supabase, Turnstile y Google Fonts.

### Resultado (2026-10-30)

335 pruebas (68 nuevas). Las cargas están en `src/lib/testInjection.ts`; las plantillas de correo de las
Edge Functions son TypeScript puro y se importan directamente. Archivos: `lib/noRawHtml.test.ts`,
`components/pqrs/emails.test.ts`, `dashboard/pqrs/emails.test.ts`, `dashboard/profile/emails.test.ts`,
`dashboard/audiencias/emails.test.ts`, y casos nuevos en los filtros, `pdfUrl`, `personalSchema`,
`permisos/data` y `encuestas/csv`.

Todo lo escrito por ciudadanos o funcionarios sale escapado en los correos, ningún enlace acepta
`javascript:` ni `data:`, y `src` no usa `innerHTML`, `dangerouslySetInnerHTML` ni `eval`.

Hallazgo corregido:

- **Encuestas:** el CSV dejaba pasar textos que Excel toma como fórmulas (`=HYPERLINK(…)`, `+1+1`, `@SUM(…)`).
  Ahora salen con `'` delante.

No es un hallazgo: el correo personal admite comillas (la regla es amplia, igual que el check de la base),
pero el enlace siempre empieza por `mailto:` y React escapa el atributo; la prueba comprueba ese prefijo.

### Cabeceras de seguridad en Netlify (hecho el 2026-10-30)

`netlify.toml` envía en todas las rutas `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY` y una `Content-Security-Policy` que solo permite la
app, el script del tema de `index.html` (por su sha256), Supabase, Turnstile y Google Fonts; sin
`'unsafe-inline'` ni `'unsafe-eval'` para scripts. `src/lib/netlify.test.ts` comprueba todo eso, la huella del
script contra `index.html`, el build, la caché de `/assets/*` y la regla de `public/_redirects`.

Cómo se activó: primero en modo informe (`Content-Security-Policy-Report-Only`), revisando la consola en la
vista previa del PR #1 y después en producción, y solo entonces en modo activo. Ajustes que salieron de la
revisión:

- La librería del PDF de audiencias compila su motor de diseño en WebAssembly, incrustado como `data:`:
  necesita `'wasm-unsafe-eval'` en `script-src` (solo WebAssembly) y `data:` en `connect-src`.
- zod prueba `new Function` para validar más rápido; `src/lib/zodConfig.ts` lo pone en modo `jitless` y
  `main.tsx` lo importa primero.

Avisos que no son de la política y se ignoran: en las vistas previas, la barra de Netlify (estilo en línea
de la línea 33, marcos de `app.netlify.com`, Gravatar) y Turnstile 110200 (dominio no autorizado); en todas
partes, los mensajes del marco del captcha (`flexible:1`: su propia política, `No available adapters`, `OTS
parsing error`) y `Buffer is not defined` de la librería del PDF (el PDF sale completo).

Para agregar un servicio externo (script, API, fuente, marco) hay que sumar su dominio a la política, o el
navegador lo bloquea. Las variables `VITE_*` de Netlify no son secretas (van en el JavaScript público): no
marcarlas como secretas, o el escáner de secretos detiene el build al ver la URL de Supabase en la política.

## Fase 4 · Base de datos con pgTAP en GitHub Actions (hecha el 2026-11-03)

Rama `seguridad-supabase`, la misma de `docs/plan-seguridad-supabase.md`, para que un solo PR lleve todo a
producción. Prueba lo que protege los datos de verdad: RLS, grants, triggers y funciones SQL. No prueba las
Edge Functions, los correos, el captcha ni la interfaz.

### Dónde corre

En el equipo no hay Docker, así que las pruebas corren en **GitHub Actions**. En cada push y PR, el flujo
`.github/workflows/db-tests.yml` hace esto en una máquina temporal:

1. Instala el CLI de Supabase.
2. Levanta un Supabase local vacío con `supabase start`.
3. Aplica todas las migraciones desde cero y después `supabase/seed.sql`.
4. Corre `supabase test db`.

Nunca se conecta a producción, no usa secretos y no gasta créditos de Netlify. El resultado es una ✓ o una
✗ en el commit y en el PR. Si algún día se instala Docker, se corre lo mismo en local.

### Cambios previos (primer commit)

- **Migración del primer superadmin.** `20261005150000_roles_permissions.sql` falla si no existe en Auth la
  cuenta del propietario, y en una base nueva no existe. Se cambia `raise exception` por `raise notice` y se
  omite la asignación. En producción no cambia nada, porque ya está aplicada y registrada. Así las migraciones
  vuelven a recrear la base desde cero.
- **`supabase/config.toml`.** `auto_expose_new_tables = false`, igual que producción desde el 2026-11-03. Sin
  esto, la base local daría permisos que producción no da, y las pruebas de grants mentirían.
- **`supabase/seed.sql`.** Solo crea ayudas para las pruebas, en un esquema `tests`:
  - crear usuarios de prueba en `auth.users` con su perfil, rol y juzgado;
  - "entrar como" un usuario (rol `authenticated` + `request.jwt.claims`) o como anónimo.

  `seed.sql` no llega a producción: solo lo cargan `supabase start` y `db reset` en local.
- **El flujo de GitHub Actions** y una primera prueba mínima (que las migraciones cargan y pgTAP responde),
  para comprobar el entorno antes de escribir las demás.

**Resultado (2026-11-03):** 9 archivos y 188 pruebas, todas en verde en GitHub Actions
([corrida 41718689787](https://github.com/gaguilah/oeccbvirtual/actions/runs/41718689787)). `01_esquema.sql`
quedó como la comparación con producción que el plan dejaba para el final: los grants de tablas y columnas,
quién ejecuta cada función, las funciones `security definer`, las políticas y los triggers son una foto de
producción. Solo encontró una diferencia: el `SELECT` de `anon` y `authenticated` sobre `auction_notices`
venía del interruptor de autoexposición y no de una migración. Se corrigió con
`20261103130000_auction_notices_select_grant.sql`, que tampoco cambia nada en producción y no está registrada
allí. Las fallas se ven como la anotación "pgTAP" de la corrida (`gh run view <id> --log-failed`).

**Estado del entorno:** La rama se subió sin PR (Netlify solo construye `main`), y en GitHub Actions los dos trabajos pasan. Se agregaron:
- `.github/workflows/pruebas.yml`, con dos trabajos: "Sitio" corre Vitest, lint, Prettier y build, y "Base
  de datos" corre `supabase start` + `supabase test db`;
- `supabase/seed.sql` y `supabase/tests/00_entorno.sql`;
- las pruebas de `config.toml` y de las migraciones en `src/lib/migrations.test.ts`.

Hallazgos al preparar:
- `handle_new_user` y su trigger `on_auth_user_created` (sobre `auth.users`) existían solo en producción, creados
  a mano. En una base nueva, `20261103120000_security_cleanup.sql` fallaba porque la función no existía. La
  migración `20261005120500_handle_new_user.sql` los copia tal como están en producción, así que aplicarla allí
  no cambia nada.
- **Posible error en producción:** `handle_new_user` guarda como nombre la parte del correo antes de @, y
  `profiles_full_name_format` solo admite letras. Al crear en Usuarios una cuenta con un correo como
  `juan.perez@…`, `j01…@…` o `ana_m@…`, el insert del perfil falla y Auth responde "Database error creating new
  user". Los 19 usuarios actuales tienen correos de solo letras, lo que es consistente con el error.
  Corrección propuesta: el trigger crea el perfil sin nombre, porque `manage-users` lo guarda enseguida. Está
  pendiente de decidir. El usuario no ha visto el error, porque los correos actuales son de solo letras.
- La migración `20261005120500` todavía **no está registrada en producción** (el usuario no autorizó escribir
  allí). No hace falta, porque la función y el trigger ya existen.
- En GitHub fallaron dos pruebas que en local pasaban gracias al `.env`: el menú del dashboard (`navigation/links.ts`)
  importaba el barrel de `services`, que llega a `components/remates/api.ts` y al cliente de Supabase. Se importa
  `services/data` directamente.

### Pruebas (`supabase/tests/`, un archivo y un commit por sección)

Cada archivo abre una transacción, crea sus propios datos y la deshace al final, así que no depende de los
demás. Los usuarios de prueba son: anónimo, sin rol, juzgado 1, juzgado 2, oficina, director de oficina y
superadmin.

| Archivo | Qué comprueba |
|---|---|
| `01_grants.sql` | Lo que cerró la Fase 1 de seguridad: ninguna tabla da TRUNCATE, REFERENCES, TRIGGER ni MAINTAIN a `anon` / `authenticated`; las tablas de respuestas de encuesta, `email_log`, `request_counters` y `hearing_notifications` no dan nada a esos roles; toda tabla de `public` tiene RLS; toda función `security definer` tiene `search_path` fijo; `submit_survey_response` solo la ejecuta `service_role`; las funciones de triggers no se ejecutan por la API |
| `02_acceso.sql` | `has_permission` por rol y juzgado (superadmin todo, juzgado solo el suyo, sin rol o inactivo nada); `get_my_access`; un usuario no cambia su rol, juzgado, `active` ni `must_change_password`; solo edita su `full_name` y su cargo; no se borra el último superadmin activo ni se tocan los roles de sistema; `complete_password_change` exige cargo |
| `03_remates.sql` | El público solo lee avisos publicados; juzgado 1 no ve ni edita los del juzgado 2; `auction_notices_authorize`: cambiar datos pide `editar`, publicar pide `publicar`, sin `publicar` el aviso nace oculto; la URL del PDF que arma el trigger; `created_at` no cambia |
| `04_audiencias.sql` | La tabla `hearings` está cerrada al público y `list_public_hearings` nunca devuelve `notes`; `hearings_rules`: nace Programada, en el futuro, en día hábil, de 7:00 a 17:00 en pasos de 15 minutos; Realizada desde 1 hora después y con grabación; Cancelada desde la hora; qué se puede borrar; "cargado al expediente" y autor de la grabación (servidor, no navegador); permisos por juzgado; aviso con audiencia (`create_auction_notice_with_hearing` y el movimiento al editar el aviso) |
| `05_pqrs.sql` | Anónimo no lee ni escribe `customer_requests`; `pqrs.ver` lee y sin él no; `set_request_status` (cerrar pide motivo, una respondida no cambia); número `PQRS-<año>-<6 dígitos>`; `pqrs_due_date` y `business_days_left` con fines de semana y días no hábiles |
| `06_encuestas.sql` | El público lee solo la encuesta activa y sus preguntas; `submit_survey_response` (activa, preguntas suyas, tipo y rango, sin duplicados, obligatorias) con sus errores; una sola activa; `save_survey` y el guardia de preguntas con respuestas; no se borra una con respuestas o activa; `survey_stats` pide `encuestas.ver` |
| `07_calendario.sql` | Solo lunes a viernes en `non_business_days`; `calendario.gestionar` escribe y los demás no; `is_business_day` y `business_days_between` |
| `08_perfil.sql` | `profile_personal_info`: cada uno lee y escribe solo su fila y no la borra; las reglas de formato (las mismas de `personalSchema.ts`); las fechas por pestaña del trigger; `get_user_personal_info` pide `usuarios.datos_personales` y respeta el juzgado; `list_users` pide `usuarios.ver` |

Cuando una prueba repite una regla del front (horario, formatos, plazo), lleva un comentario con el archivo
`.ts` para recordar que se cambian juntas, como en las fases anteriores.

### Comparar con producción (al final)

Las pruebas corren sobre la base que arman las migraciones. Para saber que esa base es igual a producción,
se comparan con consultas de solo lectura en los dos lados:
- las políticas RLS (tabla, comando y roles);
- los grants de tablas y columnas;
- las funciones (si son `security definer`, su `search_path` y quién las ejecuta);
- los triggers.

Si algo se creó en producción a mano y no está en una migración, se agrega una migración, que se aplica como
siempre y no cambia nada en producción. Las diferencias encontradas quedan anotadas en este plan.

### Al terminar

- CLAUDE.md ("Commands"): cómo se corren las pruebas de base de datos y la regla de que cada migración que
  cambia RLS, grants o un trigger trae o ajusta su prueba en `supabase/tests/`.
- `docs/modulos/`: qué queda cubierto en cada sección.
- El estado de esta fase en este plan, con los hallazgos.

### Para confirmar antes de empezar

1. **Push de la rama.** Para que GitHub corra las pruebas, hay que subir la rama `seguridad-supabase`, sin
   abrir PR. Antes hay que revisar en Netlify (Site configuration → Build & deploy → Branches and deploy
   contexts) que **Branch deploys** esté en "Deploy only the production branch". Si está en "All", el push
   intenta un build y gasta créditos.
2. **Pruebas del front en el mismo flujo.** Opcional: el mismo flujo también puede correr `npm test`,
   `npm run lint` y `npm run build`, en un trabajo aparte y sin variables de Supabase.

## Fases futuras (fuera de este plan)

- **Componentes:** Testing Library con jsdom para formularios (PQRS, encuesta, Mi perfil), `Tabs`,
  `ActionMenu` y `ConfirmDialog`.
- **De punta a punta:** Playwright para los recorridos públicos (PQRS y encuesta con la clave de prueba de
  Turnstile) y el ingreso al dashboard.
