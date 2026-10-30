# Plan: pruebas unitarias por sección, parte pública y parte privada (hecho: Fases 0, 1, 2 y 3)

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

## Fases futuras (fuera de este plan)

- **Componentes:** Testing Library con jsdom para formularios (PQRS, encuesta, Mi perfil), `Tabs`,
  `ActionMenu` y `ConfirmDialog`.
- **Base de datos:** pgTAP con `supabase test db` para RLS, triggers (`hearings_rules`,
  `auction_notices_authorize`, `profile_personal_info_section_dates`, …) y funciones (`has_permission`,
  `pqrs_due_date`, `submit_survey_response`). Es lo más valioso para la seguridad, pero necesita Supabase
  local con Docker.
- **De punta a punta:** Playwright para los recorridos públicos (PQRS y encuesta con la clave de prueba de
  Turnstile) y el ingreso al dashboard.
