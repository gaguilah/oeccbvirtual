# Plan: días no hábiles (festivos y cierres) para los plazos (decidido el 2026-10-07)

Hoy el plazo de las PQRS (15 días hábiles) cuenta de lunes a viernes y **no descuenta festivos ni días de cierre**. Este plan agrega un **calendario de días no hábiles** que la oficina administra desde el dashboard: los festivos de Colombia y cualquier día adicional que haya que descontar (un cierre extraordinario, una jornada sin atención, la vacancia judicial…). El plazo se recalcula solo.

## Cómo funciona hoy

- `pqrs_due_date()` (SQL) y `src/dashboard/pqrs/deadline.ts` (navegador) repiten la misma regla: 15 días de lunes a viernes desde el día siguiente a la radicación.
- Esa duplicación es frágil: si una cambia y la otra no, la lista y la tarjeta de Inicio muestran plazos distintos.

## Propuesta

### 1. Tabla de días no hábiles

`non_business_days`:

| Columna | Qué guarda |
| --- | --- |
| `day` (`date`, llave) | El día que no cuenta como hábil |
| `kind` | `festivo` (festivo nacional), `cierre` (la oficina no atiende: cierre extraordinario, vacancia, jornada especial) u `otro` |
| `reason` | Motivo visible, p. ej. "Día de la Independencia", "Cierre por traslado de sede" |
| `created_by`, `created_at` | Quién lo agregó y cuándo |

- Solo se guardan días que caen de **lunes a viernes**: sábados y domingos ya no cuentan.
- Lectura y escritura directas: solo con los permisos del calendario (ver abajo). El plazo de las PQRS no necesita leer la tabla desde el navegador: lo calculan funciones SQL `security definer`, así que un usuario sin acceso al calendario igual ve el plazo correcto.

### 2. Una sola regla, en la base de datos

En lugar de mantener la regla en dos lugares, el plazo se calcula **solo en SQL**:

- `pqrs_due_date(created_at)`: recorre los días desde el siguiente a la radicación, salta sábados, domingos y los días de `non_business_days`, y devuelve el día hábil número 15.
- `business_days_between(desde, hasta)`: días hábiles entre dos fechas con la misma regla.
- **Columnas calculadas** en `customer_requests` (funciones que PostgREST expone como columnas): `due_date` y `business_days_left`. La lista y el detalle las piden junto con los demás datos, y `deadline.ts` deja de calcular: solo decide cómo mostrarlo ("14 días hábiles", "Vence hoy", "Vencida hace 3 días hábiles").
- `pqrs_summary()` (tarjeta de Inicio) usa la misma función, así que siempre coincide con la lista.

**Efecto retroactivo:** si se agrega un festivo o un cierre, los plazos de las PQRS pendientes que lo incluyan se corren un día automáticamente (es lo correcto: ese día no fue hábil). Las PQRS ya respondidas o cerradas no muestran plazo, así que no les afecta.

### 3. Pantalla "Días no hábiles" (dashboard)

En **Administración → Días no hábiles** (`/dashboard/dias-no-habiles`):

```
Días no hábiles                                   [2026 ▾]   [+ Agregar]  [Cargar festivos 2027]
┌──────────────────────────┬────────────┬──────────────────────────────────┬───┐
│ Fecha                    │ Tipo       │ Motivo                           │   │
├──────────────────────────┼────────────┼──────────────────────────────────┼───┤
│ lunes, 12 de oct de 2026 │ Festivo    │ Día de la Raza                   │ ⋮ │
│ lunes, 2 de nov de 2026  │ Festivo    │ Todos los Santos                 │ ⋮ │
│ viernes, 20 nov de 2026  │ Cierre     │ Cierre por traslado de sede      │ ⋮ │
└──────────────────────────┴────────────┴──────────────────────────────────┴───┘
```

- **Lista por año**, con selector de año.
- **Agregar** (modal): una fecha **o un rango** (desde–hasta, p. ej. la vacancia judicial), tipo y motivo. Del rango se guardan solo los días de lunes a viernes. Avisa si el día ya estaba.
- **Cargar calendario de un año** (botón por año): calcula y muestra en una **vista previa**, agrupados y con una casilla por grupo, para revisarlos antes de guardar con un clic:
  1. **Festivos nacionales de Colombia:** los fijos, los que se trasladan al lunes (Ley 51 de 1983) y los que dependen de la Pascua.
  2. **Días de la Rama Judicial** (tipo `cierre`):
     - **Semana Santa:** lunes, martes y miércoles santos (jueves y viernes santos ya son festivos nacionales).
     - **17 de diciembre:** Día de la Rama Judicial.
     - **Vacancia judicial colectiva:** del 20 al 31 de diciembre de ese año y del 2 al 10 de enero de ese año (la parte de enero de la vacancia que empezó el diciembre anterior; el 1 de enero ya es festivo).
  Solo se guardan los días de lunes a viernes, y los que ya existan no se duplican. Así cada diciembre se carga el año siguiente sin escribir días a mano.
- **Menú ⋮** por día: **Eliminar** (con `ConfirmDialog`, tono eliminar). Avisa que los plazos de las PQRS pendientes se recalcularán.
- El detalle de cada PQRS muestra su fecha de vencimiento ya con los días no hábiles descontados.

### 4. Permisos

| Código | Qué permite |
| --- | --- |
| `calendario.ver` | Ver la opción "Días no hábiles" en el menú y su pantalla |
| `calendario.gestionar` | Agregar, cargar el calendario de un año y eliminar días no hábiles |

- **Solo el superadmin** (implícito) los tiene al inicio; **ningún otro rol ve la opción en el menú ni la pantalla** hasta que el superadmin le dé `calendario.ver` en Roles (y `calendario.gestionar` si además debe modificarlo).
- Los demás usuarios no necesitan acceso: el plazo de las PQRS ya viene calculado por la base de datos con los días no hábiles descontados.
- Módulo `calendario` (nombre en `permisos/data.ts`: "Calendario").

### 5. A futuro

El mismo calendario servirá para:

- **Audiencias:** avisar si se programa una audiencia en un día no hábil, y no enviar el listado del lunes si ese lunes es festivo (o enviarlo el siguiente día hábil).
- **Avisos de Remate:** avisar si la fecha del remate cae en un día no hábil.

## Verificación

- SQL: con un festivo entre la radicación y el vencimiento, `pqrs_due_date` se corre un día; con un rango de cierre, se corre tantos días hábiles como abarque.
- La lista, el detalle y la tarjeta de Inicio muestran el mismo plazo.
- Cargar festivos de 2026 y 2027 y comparar con el calendario oficial.
- Sin `calendario.gestionar` no se ve "Agregar" ni "Eliminar", y la base de datos lo rechaza aunque se intente por la API.

## Resultado (2026-10-07, rama `dias-no-habiles`)

- Migración `20261007150000_non_business_days.sql`: tabla con RLS (`calendario.ver` lee; `calendario.gestionar` inserta y borra), `is_business_day`, `pqrs_due_date` (ahora salta los días no hábiles), `business_days_between`, columnas calculadas `due_date` y `business_days_left` de `customer_requests`, y los dos permisos.
- PQRS: la lista, el detalle y la tarjeta de Inicio usan el plazo que calcula la base de datos; `deadline.ts` ya no repite la regla.
- Dashboard `src/dashboard/calendario/`: página por año, "Agregar" (día o rango; solo lunes a viernes), "Cargar calendario <año>" con vista previa en dos grupos y eliminar con el menú ⋮. `holidays.ts` calcula los festivos (verificados contra 2026 y 2027) y los días de la Rama Judicial.
- Probado en headless Edge con respuestas simuladas, incluido que el rol Oficina no ve la opción ni entra por la dirección. Probado también **contra Supabase real (2026-10-07)**: migración aplicada y calendario cargado.

## Decisiones (2026-10-07)

1. **Quién administra:** solo el superadmin, o quien él configure en Roles. **Ningún otro rol ve la opción ni la pantalla** (por eso hay dos permisos: `calendario.ver` y `calendario.gestionar`).
2. **Festivos:** botón para cargar el calendario de un año, con vista previa.
3. **Días de la Rama Judicial:** Semana Santa (lunes a miércoles santos), **17 de diciembre (Día de la Rama Judicial)** y la vacancia judicial (20 de diciembre a 10 de enero) cuentan como no hábiles; se cargan con el mismo botón, como grupo aparte.
4. **Menú:** en Administración, como "Días no hábiles".
