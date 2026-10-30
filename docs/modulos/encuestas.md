# Encuestas

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia de cada decisión está en los planes enlazados al final.

## Qué es

Encuesta de satisfacción anónima del sitio público y su administración en el dashboard: crear y editar
encuestas, elegir cuál está activa y ver los resultados agregados.

| Dónde | Ruta | Quién |
|---|---|---|
| Sitio público | `/encuesta` | Cualquiera; muestra la encuesta activa |
| Lista | `/dashboard/encuestas` | `encuestas.ver` |
| Resultados | `/dashboard/encuestas/:id` | `encuestas.ver` |
| Preguntas (lectura) | `/dashboard/encuestas/:id/preguntas` | `encuestas.ver` |
| Crear / editar | `/dashboard/encuestas/nueva`, `/:id/editar` | `encuestas.gestionar` |

## Valores clave

| Valor | Cifra | Dónde vive |
|---|---|---|
| Encuestas activas | Máximo 1 | índice `surveys_single_active_idx` · `set_active_survey()` |
| Escala | Entre 0 y 10 (mínimo < máximo), etiquetas obligatorias | `survey_questions` · `survey/validation.ts` · `submit_survey_response` |
| Sí / no guardado como | 1 = sí, 0 = no (`smallint`) | `survey_answers.value` |
| Texto de pregunta | 5 a 200 caracteres; ayuda hasta 300 | esquema del editor · SQL |
| Rango de resultados | Hasta 24 meses | `period.ts` |
| Fechas de resultados | `America/Bogota` | `survey_stats` |

## Sitio público

- `useSurvey()` carga la encuesta activa (`surveys` + `survey_questions` son públicas solo mientras está
  activa). Sin encuesta activa: "La encuesta no está disponible en este momento".
- Una pregunta por paso y un paso final de revisión con Turnstile.
- Tipos: `yes_no` (`YesNoQuestion`) y `scale` (`ScaleQuestion`), elegidos en `QuestionField`. Agregar un
  tipo: componente + `QuestionField` + `answerSchema` en `survey/validation.ts` (y en SQL).
- Envío: Edge Function `submit-survey` (`--no-verify-jwt`) → Turnstile → `submit_survey_response()`, una
  transacción con todas las reglas (activa, preguntas de la encuesta, tipo y rango, sin duplicados,
  obligatorias). Errores: `survey_not_available`, `invalid_answers`, `missing_required_answers`.
- **Seguridad:** `submit_survey_response` es `security invoker`, con EXECUTE solo para `service_role`.
  No cambiarla a `security definer` ni darla a `anon`: se saltaría el captcha vía `/rest/v1/rpc`.
- Las respuestas son anónimas: no se guarda quién respondió. `survey_responses` y `survey_answers` no
  tienen políticas (nadie las lee desde el navegador).

## Reglas de gestión

| La encuesta… | Se puede |
|---|---|
| no tiene respuestas | Cambiar todo: título, agregar, quitar y reordenar preguntas, tipo, escala, obligatoria |
| tiene respuestas | Solo textos: título, texto de preguntas, ayuda y etiquetas (trigger `survey_questions_guard`) |
| tiene respuestas o está activa | No se puede eliminar |

- Para cambiar la estructura de una encuesta con respuestas: **Duplicar** (copia inactiva sin
  respuestas), editar la copia y activarla. Los resultados anteriores quedan en la encuesta original.
- Activar una encuesta desactiva la anterior en la misma transacción. Solo se activa con preguntas.
- Guardado con `save_survey()` (`security invoker`, una transacción). Los códigos salen del texto y no
  cambian (`surveyCode`, `copyCode`, `uniqueCode` en `encuestas/data.ts`, máx. 60 caracteres, formato
  `surveys_code_format`; un título sin letras ni números da `encuesta`). Probados en `data.test.ts`.

## Resultados

- Solo agregados, desde funciones `security definer`: `list_surveys`, `survey_stats(p_survey_id, p_from,
  p_to)` y `survey_summary` (Inicio: respuestas del año de la encuesta activa).
- Periodo en la URL (`usePeriodFilters`): mes (por defecto el actual), rango de meses o año.
- Gráficos propios en `encuestas/charts/`: `PieChart` (sí / no) y `BarChart` (escala, una barra por
  valor incluidos los ceros), cada uno con "Ver como tabla".
- Promedios: si las escalas tienen rangos distintos, no se mezclan.
- "Descargar CSV" (`encuestas/csv.ts`): totales del periodo, una fila por opción de cada pregunta; `;`,
  UTF-8 con BOM y CRLF para Excel en español. Sin permiso adicional. Un texto (título, pregunta,
  etiqueta) que empieza por `=`, `+`, `-`, `@`, tabulador o retorno sale con `'` delante, para que
  Excel no lo tome como fórmula (inyección de fórmulas en CSV; desde 2026-10-30).

## Permisos (sin juzgado)

| Permiso | Permite | Roles |
|---|---|---|
| `encuestas.ver` | Lista, preguntas, resultados y CSV | oficina, director_oficina |
| `encuestas.gestionar` | Crear, editar, duplicar, activar y eliminar | solo superadmin |

El rol juzgado no ve Encuestas.

## Archivos y migraciones

- Público: `src/pages/Encuesta.tsx`, `src/components/survey/`.
- Dashboard: `src/dashboard/encuestas/`.
- Funciones: `supabase/functions/submit-survey`.
- Migraciones: `20260930120000_submit_survey_response`, `20260930200302_create_survey_tables`,
  `20261008120000_surveys_admin`.

## Preguntas frecuentes (desarrollo)

- **No puedo cambiar el tipo de una pregunta.** La encuesta ya tiene respuestas: duplicarla.
- **El sitio dice que no hay encuesta.** No hay ninguna activa.
- **Los totales no coinciden con otro reporte.** Revisar el periodo: se toma en hora de Colombia.

## Historial

[plan-encuestas-dashboard](../plan-encuestas-dashboard.md) ·
[plan-encuesta-ilustracion](../plan-encuesta-ilustracion.md)
