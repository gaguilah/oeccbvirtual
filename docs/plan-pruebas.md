# Plan: pruebas unitarias por sección, parte pública y parte privada (en curso: Fase 0 hecha)

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

## Fase 1 · Parte pública

| Sección | Qué probar |
|---|---|
| PQRS | `pqrs/schema.ts`: campos por paso (`stepFields`, `validateFields`), `acceptedTerms` obligatorio, límites del resumen; `pqrs/data.ts` (`REQUEST_STEPS`) coherente con los pasos del formulario |
| Encuesta | `survey/validation.ts`: `answerSchema` para `yes_no` y `scale` (rango `scale_min`–`scale_max`), texto de una respuesta (`n de max (etiqueta)`) |
| Avisos de Remate | Agendado / Realizado y Próximos / Pasados con `REALIZADO_DESPUES_DE_MIN` (incluido el minuto exacto del corte); lectura y escritura de los filtros de la URL (`useRematesFilters`: `juzgado`, `periodo`, `q`, `pagina`, valores inválidos) |
| Audiencias | `publicStatus()` (Programada, Por confirmar, Realizada, Cancelada); filtros de la URL (`useAudienciasFilters`, rango de fechas) |
| Tutoriales | Integridad de `tutorials/data.ts`: slugs únicos y válidos para la URL, `prerequisites` y `next` que apuntan a slugs existentes, `tutorialPath`; el número de tutoriales coincide con el ciclo de la ilustración (`tutorials/illustrationData.ts` y la utilidad `animate-illustration-cycle`) |
| Navegación y contacto | `mainLinks` sin rutas repetidas; `services/data.ts` ya está cubierto |

## Fase 2 · Parte privada (dashboard)

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

## Fases futuras (fuera de este plan)

- **Componentes:** Testing Library con jsdom para formularios (PQRS, encuesta, Mi perfil), `Tabs`,
  `ActionMenu` y `ConfirmDialog`.
- **Base de datos:** pgTAP con `supabase test db` para RLS, triggers (`hearings_rules`,
  `auction_notices_authorize`, `profile_personal_info_section_dates`, …) y funciones (`has_permission`,
  `pqrs_due_date`, `submit_survey_response`). Es lo más valioso para la seguridad, pero necesita Supabase
  local con Docker.
- **De punta a punta:** Playwright para los recorridos públicos (PQRS y encuesta con la clave de prueba de
  Turnstile) y el ingreso al dashboard.
