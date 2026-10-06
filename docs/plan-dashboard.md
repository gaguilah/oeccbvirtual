# Plan: base del dashboard (construido el 2026-10-05)

Primer paso del área privada: una rama propia, todo el código en `src/dashboard/` y un layout con menú lateral, encabezado con acciones y área de contenido. Este plan arma el esqueleto con el menú completo; cada sección se construye después con su propio plan (ver "Hoja de ruta").

## Menú del dashboard

| # | Opción | Ruta | Qué hará | Datos | Estado en esta base |
| --- | --- | --- | --- | --- | --- |
| 1 | Inicio | `/dashboard` | Bienvenida y accesos a las secciones | `profiles` | **Se construye** |
| 2 | Avisos de Remate | `/dashboard/avisos-remates` | Gestión de los avisos | `auction_notices`, `pdf_folders` (ya existen) | Página "En construcción" |
| 3 | Audiencias | `/dashboard/audiencias` | Sección de audiencias | Por definir (tablas nuevas) | Página "En construcción" |
| 4 | PQRS | `/dashboard/pqrs` | Manejo de las solicitudes | `customer_requests` (ya existe) | Página "En construcción" |
| 5 | Encuestas | `/dashboard/encuestas` | Estadísticas de la encuesta | `surveys`, `survey_questions`, `survey_responses`, `survey_answers` (ya existen) | Página "En construcción" |
| 6 | Usuarios | `/dashboard/usuarios` | Usuarios, roles y permisos | `profiles` + tablas nuevas de roles y permisos | Página "En construcción" |

- El orden de la tabla es el orden del menú. "Usuarios" va al final, separado bajo un pequeño título "Administración".
- Las secciones aún no construidas tienen ruta real y muestran un `EmptyState` ("Esta sección está en construcción"). Así el menú, la navegación y el título de la Topbar se prueban con rutas de verdad desde el principio. En el menú llevan un `Badge` "Próximamente".
- Mientras no existan roles, **todos los usuarios con sesión ven todas las opciones**. El plan de Usuarios, roles y permisos (el siguiente después de esta base) hará que `dashboardLinks` filtre por permiso.

## Punto de partida

- `/dashboard` existe: `pages/Dashboard.tsx` lee `profiles.full_name` con `.maybeSingle()` y tiene un botón "Cerrar sesión". Está protegido por `ProtectedRoute`, que vive dentro de `App.tsx`.
- La tabla `profiles` **no tiene migración en el repo**. Hay que confirmar en Supabase cómo está creada y qué políticas RLS tiene (ver la sección 6).
- El build ya avisa que el bundle supera 500 kB. El dashboard es una buena ocasión para separarlo con carga diferida (sección 4).

## Decisiones

| Tema | Decisión |
| --- | --- |
| Rama | `dashboard`, creada desde `main` actualizado. Se integra a `main` con un PR al terminar esta base |
| Carpeta | `src/dashboard/` (se pidió "dashborad": se asume que es un error de tipeo) |
| URL | Se mantiene `/dashboard`, con subrutas anidadas (`/dashboard`, `/dashboard/<sección>`) |
| Componentes base | Se reutilizan `components/ui` (Button, ThemeToggle, Tooltip, Spinner, Alert, EmptyState…), `lib/cn`, `lib/supabase`, `useAuth` y `useDocumentMeta`. No se duplican dentro de `src/dashboard/` |
| Estilo | Tokens de `design.md`: sin bordes de 1 px, zonas separadas por tono, `shadow-ambient` solo para lo flotante (el menú en celular) |
| Idioma | Textos en español, como el resto del sitio |
| Carga | El dashboard se carga con `React.lazy`: el visitante del sitio público no lo descarga |

## 1. Rama

```
git switch main && git pull
git switch -c dashboard
git push -u origin dashboard
```

## 2. Estructura de `src/dashboard/`

Mismas prácticas que `src/components/`: carpetas por función, un `index.ts` barrel por carpeta, constantes y helpers en `.ts` separados de los `.tsx` (regla `react-refresh/only-export-components`), `className` combinado con `cn()`.

```
src/dashboard/
├── index.ts                 # exporta DashboardRoutes (único punto de entrada desde App.tsx)
├── routes.tsx               # rutas anidadas del dashboard
├── auth/
│   ├── ProtectedRoute.tsx   # se mueve aquí desde App.tsx
│   └── index.ts
├── profile/
│   ├── ProfileProvider.tsx  # carga el perfil una vez y lo comparte
│   ├── profile.ts           # contexto + useProfile() (separado, como context/auth.ts)
│   ├── api.ts               # fetchProfile(userId)
│   └── index.ts
├── layout/
│   ├── DashboardLayout.tsx  # grilla: Sidebar | (Topbar + <Outlet />)
│   ├── Sidebar.tsx          # encabezado con el usuario + SidebarNav
│   ├── SidebarUser.tsx      # iniciales, nombre y correo
│   ├── SidebarNav.tsx       # NavLink por cada opción
│   ├── Topbar.tsx           # título de la sección + acciones
│   ├── TopbarActions.tsx    # tema, perfil (deshabilitado) y cerrar sesión
│   ├── MobileSidebar.tsx    # el mismo menú como panel lateral en celular
│   └── index.ts
├── navigation/
│   └── links.ts             # dashboardLinks (ver abajo)
├── pages/
│   ├── DashboardHome.tsx    # "Inicio": bienvenida + accesos (reemplaza a pages/Dashboard.tsx)
│   ├── DashboardSectionCard.tsx
│   ├── SectionPending.tsx   # "En construcción", común a las secciones aún no hechas
│   ├── SectionNotFound.tsx  # subruta desconocida (/dashboard/xyz)
│   └── index.ts
└── ui/
    ├── Icon.tsx             # ícono Heroicons a partir de sus trazos
    ├── icons.ts             # trazos del layout (menú, cerrar, perfil, salir…)
    └── index.ts
```

`navigation/links.ts`, fuente única del menú, de los títulos de la Topbar y de las tarjetas de Inicio:

```ts
export type DashboardLink = {
  to: string            // '/dashboard/pqrs'
  label: string         // 'PQRS'
  description: string   // texto de la tarjeta en Inicio
  icon: string[]        // Heroicons outline, como services/data.ts
  group: 'main' | 'admin'
  ready: boolean        // false → Badge "Próximamente" y SectionPending
  end?: boolean         // solo Inicio
}
```

- `pages/Dashboard.tsx` se elimina; su lógica de perfil pasa a `profile/`.
- Cada sección será una carpeta nueva dentro de `src/dashboard/` (`remates/`, `audiencias/`, `pqrs/`, `encuestas/`, `usuarios/`) con su página, sus componentes y su `data.ts`. Al construirla: su ruta en `routes.tsx` deja de apuntar a `SectionPending` y su `ready` pasa a `true`.
- Lo que una sección comparta con la parte pública (por ejemplo `remates/dates.ts`, los nombres de `lib/courts.ts`) se importa desde donde ya está, no se copia.

## 3. Layout

### Escritorio (`lg` en adelante)

```
┌────────────────────┬──────────────────────────────────────────────────┐
│  ┌──┐ Nombre        │ Inicio                         ◐   👤   ⎋       │ ← Topbar (sticky)
│  │GA│ Apellido      ├──────────────────────────────────────────────────┤
│  └──┘ correo@…      │                                                  │
│                     │                                                  │
│  ▣ Inicio           │   <Outlet />: contenido de la opción elegida      │
│  ▢ Avisos de Remate │                                                  │
│  ▢ Audiencias       │                                                  │
│  ▢ PQRS             │                                                  │
│  ▢ Encuestas        │                                                  │
│                     │                                                  │
│  ADMINISTRACIÓN     │                                                  │
│  ▢ Usuarios         │                                                  │
│                     │                                                  │
│  ↗ Ver sitio público│                                                  │
└────────────────────┴──────────────────────────────────────────────────┘
  Sidebar: 16 rem,      Área derecha: bg-surface
  bg-surface-container-low,
  alto completo, sticky
```

- **Grilla:** `lg:grid-cols-[16rem_1fr]`, alto mínimo `min-h-svh`. El sidebar queda fijo (`sticky top-0 h-svh`) y solo el área derecha hace scroll.
- **Sidebar**
  - **Encabezado (`SidebarUser`):** círculo con las iniciales (`bg-primary-container text-primary`), nombre completo y correo debajo en `text-on-surface-variant`. Mientras carga el perfil, un esqueleto (barras tonales), no un spinner. Sin perfil o sin `full_name`: se muestra el correo como nombre.
  - **Menú (`SidebarNav`):** `<nav aria-label="Menú del dashboard">` con `NavLink`. Activo con fondo tonal (`bg-surface-container text-on-surface`), igual que `mobileLinkClass` del sitio público. Ícono Heroicons + texto. `end` solo en "Inicio".
  - **Pie:** enlace "Ver sitio público" a `/`.
- **Topbar (derecha, arriba)**
  - Izquierda: título de la sección actual (`<h1>`), tomado de `dashboardLinks` según la ruta.
  - Derecha (`TopbarActions`), botones `size="icon"` con `aria-label` y `Tooltip`, como el Header público:
    1. **Tema:** `ThemeToggle variant="compact"`, el mismo del Header.
    2. **Perfil:** botón deshabilitado con tooltip "Configuración de perfil (próximamente)". Cuando exista, abrirá `/dashboard/perfil`.
    3. **Cerrar sesión:** `supabase.auth.signOut()` y `navigate('/login', { replace: true })`. Mientras cierra, el botón queda deshabilitado.
  - Fondo `bg-surface/80` con `backdrop-blur` para que el contenido pase por debajo al hacer scroll, sin línea divisoria.
- **Contenido:** `<main>` con `<Outlet />` y relleno (`p-4 sm:p-6 lg:p-8`). Ancho completo; cada página decide si limita el ancho.

### Celular y tableta (menos de `lg`)

```
┌──────────────────────────────────┐
│ ☰  Inicio            ◐   👤   ⎋  │ ← Topbar
├──────────────────────────────────┤
│                                  │
│  contenido                        │
│                                  │
└──────────────────────────────────┘
```

- El sidebar se oculta y la Topbar muestra un botón ☰ ("Abrir menú").
- `MobileSidebar` muestra el mismo contenido (usuario, menú, "Ver sitio público") como panel que entra desde la izquierda, sobre un `<dialog>` nativo (como `ui/Modal`): da foco atrapado, Escape y fondo oscurecido sin código extra. Se cierra al elegir una opción, con Escape o tocando fuera. Lleva `shadow-ambient` por ser flotante.

## 4. Rutas (`App.tsx` y `dashboard/routes.tsx`)

```tsx
// App.tsx
const DashboardRoutes = lazy(() => import('./dashboard'))
<Route path="/dashboard/*" element={<Suspense fallback={<FullPageSpinner />}><DashboardRoutes /></Suspense>} />

// dashboard/routes.tsx
<Routes>
  <Route element={<ProtectedRoute><ProfileProvider><DashboardLayout /></ProfileProvider></ProtectedRoute>}>
    <Route index element={<DashboardHome />} />
    <Route path="avisos-remates" element={<SectionPending />} />
    <Route path="audiencias" element={<SectionPending />} />
    <Route path="pqrs" element={<SectionPending />} />
    <Route path="encuestas" element={<SectionPending />} />
    <Route path="usuarios" element={<SectionPending />} />
    <Route path="*" element={<EmptyState … "Esta sección no existe" />} />
  </Route>
</Routes>
```

- `ProtectedRoute` envuelve el layout una sola vez, así toda subruta queda protegida.
- Al redirigir a `/login` se guarda la ruta pedida (`state.from`) y `Login` vuelve a ella tras iniciar sesión, en lugar de ir siempre a `/dashboard`.
- Todas las páginas llaman `useDocumentMeta` (`OECCB Virtual | Dashboard`, `… | <sección>`). Además, el layout agrega `<meta name="robots" content="noindex">` mientras está montado, como `NotFound`.
- El link "Ir al dashboard" del Header público no cambia.

## 5. Inicio (`DashboardHome`)

```
Bienvenido, Nombre
Elija una sección para empezar.

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ [ícono]      │ │ [ícono]      │ │ [ícono]      │
│ Avisos de    │ │ Audiencias   │ │ PQRS         │
│ Remate       │ │ descripción  │ │ descripción  │
│ descripción  │ │ PRÓXIMAMENTE │ │ PRÓXIMAMENTE │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ Encuestas    │ │ Usuarios     │
└──────────────┘ └──────────────┘
```

- Saludo con el nombre del perfil (o el correo) y una tarjeta por cada opción del menú excepto Inicio, desde `dashboardLinks`.
- Las tarjetas reutilizan `components/services/CardBody` (ícono + título + descripción), la misma base de `ServiceCard` y `ExternalLinkCard`. Una tarjeta `DashboardSectionCard` en `src/dashboard/pages/` la envuelve en un `Link`; si `ready` es `false`, muestra un `Badge` "Próximamente" en lugar de "Ingresar →" (sigue siendo navegable hasta la página "En construcción").
- Grilla: 1 columna en celular, 2 en `sm`, 3 en `xl`.
- Más adelante, cuando haya secciones reales, Inicio podrá sumar resúmenes (PQRS sin responder, próximos remates). Fuera de esta base.

## 6. Perfil (`profile/`)

- `ProfileProvider` llama `fetchProfile(session.user.id)` una vez al montar el layout y expone `{ profile, loading, error }` con `useProfile()`. El sidebar y las páginas lo leen sin repetir la consulta.
- Si falla la consulta, el sidebar muestra el correo y no bloquea el dashboard (igual que hoy, donde un perfil faltante no es error).
- Iniciales: helper `initials(name)` en `profile/initials.ts`.

## 7. Base de datos

- Revisar en Supabase la tabla `profiles` (columnas, RLS y políticas). Si no hay migración, crear `supabase/migrations/<fecha>_profiles.sql` que refleje lo que existe, para que el repo sea la fuente de verdad.
- La política mínima: cada usuario autenticado lee **solo su fila** (`using (id = auth.uid())`). Sin escritura desde el cliente hasta que exista la configuración de perfil.
- Roles y permisos quedan fuera de esta base: son el plan 2 de la "Hoja de ruta", que se construye inmediatamente después.

## 8. Verificación

- `npm run lint`, `npm run build` (confirmar que el dashboard sale en un chunk aparte), `npm run format:check`.
- Probar: las seis opciones del menú navegan y resaltan la activa; el título de la Topbar cambia; las tarjetas de Inicio llevan a cada sección.
- Probar: sin sesión `/dashboard` y `/dashboard/x` redirigen a `/login` y vuelven tras iniciar sesión; con sesión se ve nombre o correo; cerrar sesión lleva a `/login` y "atrás" no vuelve a entrar.
- Claro, oscuro y sistema; 375 / 768 / 1024 / 1280 px; navegación con teclado (orden, foco visible, panel del menú en celular con Escape).
- Actualizar `CLAUDE.md` con la sección del dashboard.

## Resultado (2026-10-05)

- Construido en la rama `dashboard` tal como se describe, con estos ajustes:
  - El menú mide **17 rem** (no 16) y la etiqueta de las opciones pendientes dice "**Pronto**": con "Próximamente" en 16 rem, "Avisos de Remate" se partía en dos líneas. Las tarjetas de Inicio sí dicen "Próximamente".
  - `ui/Tooltip` ganó la prop `align="end"` para que las leyendas de los botones junto al borde derecho no se salgan de la pantalla. El botón de perfil usa `aria-disabled` (no `disabled`) para seguir siendo enfocable y mostrar su leyenda con el teclado.
  - `ui/PageLoader` (spinner a pantalla completa) es el respaldo de `Suspense` y de `ProtectedRoute`.
  - Cada página del dashboard pasa `noindex: true` a `useDocumentMeta` (el hook ignora `noindex` cuando `title` es `null`, así que el layout no puede ponerlo solo).
  - Subruta desconocida: `SectionNotFound` ("Esta sección no existe") y la Topbar dice "Sección no encontrada".
- Build: el dashboard sale en su propio chunk (`dashboard-*.js`, ≈ 14 kB).
- Probado con headless Edge (sesión simulada en `localStorage`): sin sesión `/dashboard/pqrs` → `/login`; con sesión, título `OECCB Virtual | Dashboard` y `noindex`; en celular el menú abre con el foco en "Cerrar menú", se cierra al elegir una opción y con Escape; cerrar sesión lleva a `/login` y volver a `/dashboard` redirige otra vez. No probado: el regreso a la ruta pedida tras un inicio de sesión real.
- **Migración `20261005120000_profiles.sql` escrita pero no aplicada** (desde esta red la CLI no llega a Postgres). Se ajustó al script con que se creó la tabla a mano: `created_at` pasa a not null, se agrega `updated_at` con trigger, y se quitan las políticas "Los usuarios pueden actualizar / crear su propio perfil" (cuando haya un rol por usuario, permitirían que cada quien se cambiara el rol). Queda solo la lectura de la fila propia; las altas y cambios los hará el plan de Usuarios con la service role key.

## Mi perfil (agregado el 2026-10-05)

- `/dashboard/perfil` (`pages/ProfilePage`), desde el botón de perfil de la Topbar (ya no deshabilitado). Su enlace en `dashboardLinks` tiene `group: 'account'`: no aparece en el menú ni en Inicio, pero da el título de la Topbar.
- **Datos personales** (`profile/ProfileNameForm`): nombre completo (3 a 120 caracteres; solo letras con tildes/ñ/ü, separadas por un espacio, guion, apóstrofo o ". " de abreviatura; sin números ni símbolos; los espacios sobrantes se quitan). La misma regla está en la base de datos como restricción `profiles_full_name_format` (migración `20261005140000_profiles_full_name_check.sql`, `not valid` para no fallar con filas de prueba ya guardadas), porque el formulario se puede saltar llamando a la API y correo solo de lectura. Al guardar, `saveFullName` del `ProfileProvider` actualiza el menú y el saludo sin recargar. Sin fila en `profiles` muestra "Perfil sin crear"; si la consulta falla, "No se pudo cargar su perfil".
- **Cambiar contraseña** (`profile/PasswordForm`): contraseña actual + nueva + confirmación (8 a 72 caracteres, distinta de la actual). La actual se comprueba con `signInWithPassword` (renueva la sesión del mismo usuario) y luego se cambia con `supabase.auth.updateUser`. Los errores de Supabase Auth (`invalid_credentials`, `same_password`, `weak_password`, `reauthentication_needed`, `session_not_found`, `over_request_rate_limit`) se muestran en español. Esta comprobación es del formulario: quien tenga una sesión abierta podría llamar a `updateUser` directamente. Para exigirla también en el servidor, activar en Supabase Auth la opción de cambio seguro de contraseña.
- **Base de datos:** migración `20261005130000_profiles_update_own_name.sql`. Cada usuario puede actualizar **solo la columna `full_name`** de **su propia fila** (privilegio por columna + política `profiles_update_own`). Así, cuando el plan de Usuarios agregue el rol, nadie podrá cambiárselo desde el navegador. Sigue sin insert: las filas las crea el plan de Usuarios.
- Probado en headless Edge con respuestas de Supabase simuladas: validación de nombre y contraseña, el guardado envía `{ full_name }` recortado y el menú se actualiza. **No probado contra Supabase real:** el guardado del nombre (requiere aplicar la migración) y el cambio de contraseña.

## Respuestas (2026-10-05)

- **Menú:** Inicio, Avisos de Remate, Audiencias, PQRS, Encuestas (estadísticas) y Usuarios (roles y permisos). Ver la tabla "Menú del dashboard".
- **Inicio:** bienvenida con accesos a las secciones (sección 5).
- **Orden:** Usuarios, roles y permisos se construye **primero**, justo después de esta base y antes de cualquier sección.
- **Reglas (RLS):** no se diseñan todas de una vez. Cada sección crea, en su propia migración, las políticas que necesita sobre sus tablas, usando los permisos que deja listos el plan de Usuarios.
- **Cuentas:** se crean desde el dashboard (Usuarios), nunca desde el sitio público, con las reglas en Supabase.

## Hoja de ruta (cada punto con su propio plan y su rama)

| Orden | Plan | Depende de | Notas |
| --- | --- | --- | --- |
| 1 | **Base del dashboard** (este plan) | — | Layout, menú, Inicio, perfil, migración de `profiles` (solo lectura de la fila propia) |
| 2 | **Usuarios, roles y permisos** | 1 | Ver el detalle abajo |
| 3 | Avisos de Remate | 2 | Sus políticas, en su migración: ver borradores, crear, editar y publicar `auction_notices` según permiso. El trigger es `security invoker`, así que quien escriba avisos también necesita leer `pdf_folders` |
| 4 | PQRS | 2 | Sus políticas: leer y responder `customer_requests` según permiso (hoy solo la escribe la Edge Function `submit-request`). Quizá columnas de estado y respuesta |
| 5 | Estadísticas de Encuestas | 2 | Sus políticas: leer solo agregados (función SQL o vista restringida por permiso), nunca las respuestas crudas de `survey_responses` / `survey_answers` |
| 6 | Audiencias | 2 | Sección nueva: sus tablas, migraciones y políticas |

- El orden de 3 a 6 se puede cambiar. El 2 va siempre antes: la seguridad depende de RLS y no del código del cliente, y todas las políticas de las secciones se apoyarán en sus permisos.

### Lo que deja listo el plan 2 (Usuarios, roles y permisos)

Se detallará en `docs/plan-usuarios.md`; aquí solo el alcance:

- **Tablas y migraciones:** roles, permisos (uno por acción: p. ej. `remates.publicar`, `pqrs.responder`, `usuarios.gestionar`), la relación rol ↔ permisos y el rol de cada usuario (en `profiles` o en una tabla aparte; se decide en ese plan).
- **Función de permisos:** una función SQL (p. ej. `public.has_permission(p text)`) que las políticas de todas las secciones usarán. Es la pieza que permite hacer las reglas "según se vaya creando cada utilidad": cada sección solo agrega sus permisos y sus políticas.
- **Menú filtrado:** `dashboardLinks` muestra a cada usuario solo las opciones que su rol permite. Es solo comodidad visual; la protección real son las políticas.
- **Creación de cuentas desde el dashboard:** Supabase no deja crear usuarios de Auth con RLS ni con la clave pública; requiere la API de administración (`auth.admin.createUser` o `inviteUserByEmail`) con la service role key, que nunca puede estar en el navegador. Por eso se hará con una **Edge Function** (`manage-users`, como `submit-request` y `submit-survey`) que:
  1. recibe el JWT de quien la llama (esta sí con verificación de JWT, a diferencia de las públicas),
  2. comprueba en la base de datos que tiene el permiso `usuarios.gestionar`,
  3. crea o invita la cuenta, y crea su fila en `profiles` con su rol.
  Las reglas viven en Supabase (la función SQL de permisos + la verificación dentro de la Edge Function); el dashboard solo envía el formulario.
- **Primer administrador (super administrador):** la cuenta `gaguilah@gmail.com`, que ya está registrada en Supabase Auth. Como nadie tiene aún el permiso para crear cuentas, su rol se asigna en la misma migración que crea roles y permisos:
  - un rol `superadmin` con **todos** los permisos (los que existan y los que agreguen las secciones después, sin tener que asignarlos uno por uno; por ejemplo, `has_permission()` devuelve `true` para ese rol);
  - la migración busca el usuario por correo en `auth.users` y le asigna el rol (y crea su fila en `profiles` si no existe). Si el correo no existe, la migración falla con un mensaje claro en lugar de seguir en silencio;
  - protección: el último `superadmin` no se puede quitar ni desactivar (regla en la base de datos), para no quedarse sin nadie que administre.
- **`profiles`:** pasa a tener políticas para que quien tenga `usuarios.gestionar` pueda ver y editar los perfiles de otros.
