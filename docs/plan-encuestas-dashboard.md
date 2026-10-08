# Plan: encuestas en el dashboard (construido el 2026-10-07)

La encuesta de satisfacción (`/encuesta`) ya recibe respuestas anónimas, pero nadie las puede ver ni administrar desde el sitio. Esta sección tiene dos partes:

1. **Resultados** (solo lectura): solo agregados (conteos, porcentajes y promedios), con filtros por mes, rango de meses o año. Cada pregunta tiene su gráfico: **torta** para las de sí / no y **barras** para las de escala. La ven todos los perfiles de la oficina, no los juzgados.
2. **Gestión de encuestas**: ver las encuestas y sus preguntas, crear una encuesta nueva con preguntas de sí / no o de escala, editarla y activarla. Al inicio solo el superadmin; él puede dárselo a otro rol en Roles.

Rama: `encuestas-dashboard`.

## Punto de partida

- Tablas:
  - `surveys`: `code` único, `title`, `is_active`.
  - `survey_questions`: `code` y `position` únicos por encuesta; `type` es `yes_no` o `scale`; las de escala tienen `scale_min`/`scale_max` entre 0 y 10 y etiquetas obligatorias, y las de sí / no no tienen datos de escala.
  - `survey_responses`: `created_at`.
  - `survey_answers`: `value` entre 0 y 10; en sí / no, 1 = sí y 0 = no.
- Acceso actual:
  - `surveys` y `survey_questions` solo son públicas mientras la encuesta está activa.
  - Las respuestas no tienen políticas: nadie las lee desde el navegador.
- `survey_answers.question_id` no borra en cascada: hoy una pregunta con respuestas ya no se puede borrar, y se mantiene así.
- La página pública carga la encuesta por código fijo (`SURVEY_CODE = 'satisfaccion-oeccb'` en `pages/Encuesta.tsx`).

## Acceso

| Permiso | Qué permite | Inicialmente |
| --- | --- | --- |
| `encuestas.ver` | Ver la sección: lista de encuestas, sus preguntas y los resultados (solo agregados) | `oficina`, `director_oficina` |
| `encuestas.gestionar` | Crear, editar, activar / desactivar y eliminar encuestas | nadie más que superadmin |

- El rol `juzgado` no recibe ninguno: no ve la opción del menú ni puede entrar escribiendo la dirección.
- `superadmin` tiene ambos de forma implícita.
- Para delegar la gestión, el superadmin crea o edita un rol en **Roles** y marca "Gestionar encuestas"; luego asigna ese rol a la persona en **Usuarios**. No hace falta nada nuevo: es el mismo mecanismo de las demás secciones.
- Sin `encuestas.gestionar`, los botones y acciones de gestión no se muestran.
- Se agrega el módulo `encuestas` a `MODULE_LABELS` ("Encuestas").

## Pantallas y rutas

| Ruta | Contenido | Permiso |
| --- | --- | --- |
| `/dashboard/encuestas` | Lista de encuestas | `encuestas.ver` |
| `/dashboard/encuestas/:id` | Resultados de una encuesta (página principal de cada encuesta) | `encuestas.ver` |
| `/dashboard/encuestas/:id/preguntas` | Ver las preguntas (solo lectura) | `encuestas.ver` |
| `/dashboard/encuestas/nueva` | Crear encuesta | `encuestas.gestionar` |
| `/dashboard/encuestas/:id/editar` | Editar encuesta | `encuestas.gestionar` |

Si alguien entra a una dirección de gestión sin el permiso, ve la pantalla de "sin acceso". Si el id no existe o no es válido, ve "Encuesta no encontrada", como en PQRS.

### 1. Lista de encuestas

```
Encuestas                                                     [+ Crear encuesta]

┌──────────────────────────────────────────────────────────────────────────┐
│ Satisfacción OECCB                       ● Activa                     ⋮ │
│ 6 preguntas · 312 respuestas · creada el 30 sep. 2026                   │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ Encuesta de atención presencial         ○ Inactiva                    ⋮ │
│ 4 preguntas · 0 respuestas · creada el 7 oct. 2026                      │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Una sola encuesta activa a la vez**: es la que aparece en `/encuesta` (ver "Página pública").
- El botón "Crear encuesta" solo aparece con `encuestas.gestionar`.
- Acciones en el menú ⋮ de cada tarjeta:

| Acción | Quién | Cuándo no se puede (`disabledReason`) |
| --- | --- | --- |
| Ver resultados | `ver` | — |
| Ver preguntas | `ver` | — |
| Editar | `gestionar` | — (con respuestas, solo se editan los textos: ver "Reglas de edición") |
| Activar | `gestionar` | sin preguntas: "Agregue al menos una pregunta" |
| Desactivar | `gestionar` | — |
| Duplicar | `gestionar` | — (crea una copia inactiva con las mismas preguntas y sin respuestas) |
| Eliminar | `gestionar` | con respuestas: "Tiene respuestas; desactívela en su lugar" |

- Confirmaciones con `ConfirmDialog`:
  - Activar: "¿Activar esta encuesta? Reemplazará a «Satisfacción OECCB» en el sitio público" (`tone="update"`).
  - Desactivar: "¿Desactivar esta encuesta? El sitio público dejará de mostrar una encuesta" (`tone="update"`).
  - Eliminar: `tone="danger"`.

### 2. Crear / editar encuesta

```
Título *             [Encuesta de atención presencial          ]
Estado                Inactiva (se activa desde la lista)

Preguntas
┌────────────────────────────────────────────────────────────────────┐
│ 1  ¿Se resolvió su solicitud?               Sí / no          ↑ ↓ ⋮ │
│ 2  ¿Cómo califica la atención recibida?     Escala 1–5       ↑ ↓ ⋮ │
└────────────────────────────────────────────────────────────────────┘
[+ Agregar pregunta]

                                           [Cancelar]  [Guardar encuesta]
```

- **Pregunta** (se edita en un modal):
  - Texto (obligatorio, de 5 a 200 caracteres) y ayuda (opcional, hasta 300).
  - Tipo: "Sí / no" o "Escala".
  - Si es escala: mínimo y máximo (entre 0 y 10, el mínimo menor que el máximo) y las etiquetas de los extremos ("Mala", "Excelente"). Una vista previa muestra los botones tal como los verá el ciudadano.
  - "Obligatoria" (por defecto sí).
- **Orden**: botones ↑ ↓ (accesibles con teclado; sin arrastrar). Las acciones Editar y Eliminar de cada pregunta van en su ⋮.
- **Códigos**: el código de la encuesta y el de cada pregunta se generan del texto y no cambian (igual que en Roles).
- **Guardado**: con `save_survey()`, en una sola transacción: la encuesta y todas sus preguntas se guardan juntas o no se guarda nada.
- **Validación**: con zod en el navegador y de nuevo en SQL.
- **Vista previa**: un botón "Vista previa" abre la encuesta tal como se ve en `/encuesta`, en un modal y sin enviar nada.

### Reglas de edición (para no dañar los resultados)

| La encuesta… | Se puede |
| --- | --- |
| no tiene respuestas | cambiar todo: título, agregar, quitar y reordenar preguntas, cambiar tipo y escala |
| ya tiene respuestas | corregir solo textos: título, texto de las preguntas, ayuda y etiquetas. **No** se puede agregar, quitar ni reordenar preguntas, ni cambiar el tipo, la escala o si es obligatoria |

- Para cambiar la estructura de una encuesta con respuestas: se **duplica**, se edita la copia y se activa. Así los resultados de la anterior siguen intactos y se consultan en su propia encuesta.
- Un aviso en el formulario lo explica cuando aplica.
- La regla se aplica en la base de datos (trigger), no solo en la pantalla.

### 3. Ver preguntas (solo lectura)

Lista numerada con el texto, el tipo, la escala y sus etiquetas, la ayuda y si es obligatoria. Sirve a quien tiene `encuestas.ver` pero no `gestionar`.

### 4. Resultados

#### Filtros (en la URL, como las demás secciones)

```
Periodo: (•) Mes  ( ) Rango de meses  ( ) Año
         [Octubre ▾] [2026 ▾]
```

| Periodo | Controles | Rango consultado |
| --- | --- | --- |
| **Mes** (por defecto: el mes actual) | mes y año | del día 1 al último día de ese mes |
| **Rango de meses** | desde (mes y año) y hasta (mes y año) | del 1 del mes inicial al último día del mes final |
| **Año** | año | del 1 de enero al 31 de diciembre |

- "Hasta" no puede ser anterior a "desde". El rango máximo es de 24 meses.
- Los años que se ofrecen van desde el de la creación de la encuesta hasta el actual.
- El título de los resultados dice el periodo en palabras: "Octubre de 2026", "Enero a junio de 2026", "Año 2026".
- Las fechas se toman en hora de Colombia.

#### Contenido

```
┌───────────────────────┬──────────────────────────┬────────────────────────┐
│ Respuestas            │ Promedio de satisfacción │ Respondieron "Sí"      │
│ 48                    │ 4,3 / 5                  │ 92 %                   │
│ en octubre de 2026    │ (preguntas de escala)    │ (preguntas sí / no)    │
└───────────────────────┴──────────────────────────┴────────────────────────┘

1. ¿Se resolvió su solicitud?                       (sí / no · 47 respuestas)
   ┌─────────┐   ● Sí   43  (91 %)
   │  torta  │   ● No    4   (9 %)
   └─────────┘

2. ¿Cómo califica la atención recibida?             (escala 1–5 · 48 respuestas)
   5 ███████████████████ 25 (52 %)                  Promedio: 4,3
   4 ██████████ 13 (27 %)                           Mala ←→ Excelente
   3 █████ 6 (13 %)
   2 ██ 3 (6 %)
   1 █ 1 (2 %)
```

- **Indicadores**: respuestas del periodo, promedio de las preguntas de escala y porcentaje de "Sí" de las preguntas sí / no.
- **Promedio con escalas distintas**: si las preguntas de escala no tienen el mismo rango (por ejemplo 1–5 y 0–10), el indicador no las mezcla: muestra el promedio de cada una en su bloque.
- **Un bloque por pregunta**, en orden:
  - Sí / no: **torta** con leyenda (conteo y porcentaje).
  - Escala: **barras**, una por cada valor del rango, incluidos los que tienen 0. Cada barra muestra conteo y porcentaje; el bloque muestra el promedio y las etiquetas de los extremos.
- **Accesibilidad**:
  - Cada gráfico tiene un resumen en texto para lectores de pantalla y un botón "Ver como tabla".
  - Los colores salen de los tokens y funcionan en tema claro y oscuro.
  - Los valores están escritos, así que no dependen del color.
- **Sin respuestas en el periodo**: "No hay respuestas en octubre de 2026", sin gráficos vacíos.
- **Gráficos**: componentes SVG propios (torta y barras) en `src/dashboard/encuestas/charts/`, sin librería externa. Se construyen siguiendo la guía de visualización de datos.
- **Distribución**:
  - Celular: indicadores apilados, gráfico arriba y leyenda debajo.
  - Escritorio: gráfico y leyenda lado a lado, preguntas en dos columnas.

## Inicio

La tarjeta de Encuestas (solo con `encuestas.ver`) muestra un dato sencillo: **"312 respuestas en 2026"**, el total del año en curso de la encuesta activa.

## Página pública

- `/encuesta` deja de buscar el código fijo y carga **la encuesta activa**, sea cual sea.
- Si no hay ninguna activa, muestra el mensaje que ya existe: "La encuesta no está disponible en este momento".
- `submit_survey_response` ya rechaza respuestas a encuestas inactivas, así que no cambia.
- Un índice único parcial (`is_active` cuando es `true`) garantiza en la base que nunca haya dos encuestas activas.
- Activar una encuesta desactiva la anterior en la misma transacción (`set_active_survey()`).

## Base de datos (una migración)

- **Permisos**: `encuestas.ver` (asignado a `oficina` y `director_oficina`) y `encuestas.gestionar` (sin asignar: solo superadmin).
- **Lectura**: políticas `select` nuevas en `surveys` y `survey_questions` para `authenticated` con `encuestas.ver`. Así ven también las encuestas inactivas. Las políticas públicas de las activas no cambian.
- **Escritura**:
  - Políticas `insert`, `update` y `delete` con `encuestas.gestionar`.
  - Las funciones `save_survey(p_survey jsonb, p_questions jsonb)` y `set_active_survey(p_id, p_active)` son `security invoker`, así que las políticas y los triggers se aplican, y se ejecutan en una sola transacción.
- **Trigger `survey_questions_guard`**: si la encuesta tiene respuestas, rechaza insertar o borrar preguntas y cambiar tipo, escala, posición o si es obligatoria. Solo se permite cambiar los textos.
- **Borrar una encuesta**: solo es posible si no tiene respuestas. Lo garantizan la base de datos y la regla del trigger.
- **Resultados** (`security definer`, exigen `encuestas.ver`, `search_path` vacío, nunca devuelven respuestas sueltas):
  - `list_surveys()`: encuestas con número de preguntas y de respuestas.
  - `survey_stats(p_survey_id, p_from date, p_to date)`: total del periodo y, por pregunta, cuántas respuestas tuvo cada valor y cuántas personas la contestaron.
  - `survey_summary()`: total del año de la encuesta activa (para Inicio).
- **Índice**: `survey_responses (survey_id, created_at)` para filtrar por periodo.
- `survey_responses` y `survey_answers` siguen sin políticas: no se leen desde el navegador.

## Código

- `src/dashboard/encuestas/`:
  - `api.ts`, `types.ts`, `schema.ts` (zod).
  - `period.ts`: convierte mes, rango o año en fechas y en el texto del periodo.
  - `useSurveyStats`, `usePeriodFilters`.
  - Páginas: `SurveysPage`, `SurveyResultsPage`, `SurveyQuestionsPage`, `SurveyEditorPage`.
  - Componentes: `QuestionModal`, `charts/PieChart`, `charts/BarChart`, `ChartTable`.
- **Vista previa**: reutiliza las preguntas públicas (`components/survey/questions/`), sin importar nada de `src/dashboard` en el código público.
- **Navegación**: el enlace "Encuestas" pasa a `ready: true` con `permission: 'encuestas.ver'`. La tarjeta de Inicio usa `survey_summary()`.
- **Página pública**: `pages/Encuesta.tsx` y `useSurvey` cargan la activa en vez de buscar por código.

## Fases

Fases 1 y 2 construidas en la rama `encuestas-dashboard`; la 3 (botón "Descargar CSV") en `encuestas-csv`.

1. **Resultados**: permiso `encuestas.ver`, funciones de estadísticas, lista, preguntas en solo lectura, gráficos, filtros y tarjeta de Inicio.
2. **Gestión**: `encuestas.gestionar`, crear, editar, duplicar, activar y eliminar; reglas de edición; `/encuesta` carga la activa.
3. **Exportar** (cuando se confirme): descarga CSV de los resultados agregados del periodo, solo números, para informes de calidad.

## Verificación

- **SQL**:
  - Sin `encuestas.ver`, las funciones se niegan.
  - Los conteos coinciden con un conteo manual.
  - Una respuesta del último día del mes a las 11 p. m. (hora de Colombia) cuenta en ese mes.
  - El trigger bloquea cambios de estructura en una encuesta con respuestas.
  - Nunca hay dos encuestas activas.
- **Acceso**:
  - `juzgado` no ve la opción.
  - `oficina` ve los resultados pero no los botones de gestión, y no entra a `/nueva` ni a `/editar`.
  - Un rol con `encuestas.gestionar` asignado desde Roles sí puede gestionar.
- **Gestión**:
  - Crear una encuesta con los dos tipos de pregunta y reordenarlas.
  - Activarla: `/encuesta` la muestra y la anterior queda inactiva.
  - Duplicar y eliminar sin respuestas.
- **Pantalla**:
  - Torta y barras en tema claro y oscuro.
  - "Ver como tabla".
  - Periodo sin respuestas.
  - Celular y escritorio.

## Decisiones (confirmadas el 2026-10-07)

- **Exportar**: probablemente sí; queda como fase 3, a confirmar.
- **Tendencia por mes**: no se incluye.
- **Inicio**: un dato sencillo, el total de respuestas del año.
- **Tipos de pregunta**: solo de selección (sí / no y escala); no hay preguntas abiertas.
- **Gestión**: el superadmin ve, crea y edita encuestas y preguntas, y puede delegarlo a otro rol con `encuestas.gestionar`.
- **Una sola encuesta activa a la vez**: es la que muestra `/encuesta`; activar una desactiva la anterior.
- **Textos con respuestas**: se pueden corregir textos (título, preguntas, ayuda y etiquetas) aunque la encuesta tenga respuestas, con el aviso de duplicarla si el cambio altera el sentido. La estructura no se puede cambiar.
