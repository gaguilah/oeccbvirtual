# Días no hábiles

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia está en el plan enlazado al final.

## Qué es

Calendario de festivos y cierres que no cuentan como días hábiles. Lo usan los plazos de PQRS y las
reglas y correos de Audiencias.

| Dónde | Ruta | Quién |
|---|---|---|
| Dashboard (Administración) | `/dashboard/dias-no-habiles` | `calendario.ver`; cambios con `calendario.gestionar` |

Asignación vigente (Roles, 2026-10-15): `calendario.ver` para juzgado y oficina (solo consulta);
`calendario.gestionar` solo superadmin. Director de oficina no la ve. Nadie necesita la pantalla para
tener plazos correctos: se calculan en la base.

## Tabla `non_business_days`

| Columna | Valor |
|---|---|
| `day` (llave) | Solo lunes a viernes (sábado y domingo ya no son hábiles) |
| `kind` | `festivo`, `cierre` u `otro` |
| `reason` | Motivo visible |
| `created_by`, `created_at` | Auditoría |

## Quién la usa

| Uso | Función | Efecto |
|---|---|---|
| Plazo PQRS (15 días hábiles) | `pqrs_due_date`, `business_days_between`, columnas `due_date` / `business_days_left` | Agregar o quitar un día corre el plazo de las PQRS pendientes (retroactivo) |
| Programar audiencias | `is_business_day` en `hearings_rules` | No se programa en un día no hábil |
| Calendario de audiencias | `hearing_non_business_days()` | Días rayados con su motivo |
| Listado semanal de audiencias | primer día hábil de la semana | Si el lunes es festivo, sale el martes |

Las funciones son `security definer`: dan el resultado correcto a cualquier usuario sin que lea la
tabla.

## Pantalla

- Lista por año, con selector.
- **Agregar:** un día o un rango (de un rango se guardan solo los días de lunes a viernes; los
  existentes se omiten).
- **Cargar calendario <año>:** vista previa en dos grupos con casilla, calculada en
  `calendario/holidays.ts`:
  1. Festivos nacionales de Colombia: fijos, trasladados al lunes (Ley 51 de 1983) y los de Pascua.
  2. Rama Judicial (`cierre`): lunes a miércoles santos, 17 de diciembre, vacancia del 2 al 10 de enero
     y del 20 al 31 de diciembre.
- **Eliminar** desde el menú ⋮, con confirmación (avisa que los plazos se recalculan).

## Archivos y migraciones

- `src/dashboard/calendario/` (`CalendarPage`, `holidays.ts`).
- Migración `20261007150000_non_business_days`.

## Preguntas frecuentes (desarrollo)

- **Un plazo de PQRS cambió solo.** Se agregó o quitó un día no hábil dentro de su periodo: es lo
  esperado.
- **No deja programar una audiencia en un día.** Está en esta tabla (o es fin de semana).
- **Falta el calendario del próximo año.** Cargarlo en diciembre con "Cargar calendario <año>".

## Historial

[plan-dias-no-habiles](../plan-dias-no-habiles.md)
