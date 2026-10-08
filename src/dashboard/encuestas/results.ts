import type { SurveyQuestion, SurveyStats } from './types'

const percentFormatter = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })
const averageFormatter = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatPercent = (part: number, total: number) => percentFormatter.format(total ? part / total : 0)
export const formatAverage = (value: number) => averageFormatter.format(value)
export const formatCount = (value: number) => value.toLocaleString('es-CO')

export type ValueCount = { value: number; label: string; count: number }

export type QuestionResult = {
  question: SurveyQuestion
  // Personas que la contestaron (puede ser menos que el total si no es obligatoria).
  answered: number
  // Sí / no: [Sí, No]. Escala: del valor mayor al menor, incluidos los que tienen 0.
  values: ValueCount[]
  // Solo escala.
  average: number | null
}

export function questionResult(question: SurveyQuestion, stats: SurveyStats): QuestionResult {
  const counts = new Map<number, number>()
  for (const row of stats.answers) {
    if (row.question_id === question.id) counts.set(row.value, Number(row.count))
  }
  const answered = [...counts.values()].reduce((sum, n) => sum + n, 0)

  if (question.type === 'yes_no') {
    return {
      question,
      answered,
      values: [
        { value: 1, label: 'Sí', count: counts.get(1) ?? 0 },
        { value: 0, label: 'No', count: counts.get(0) ?? 0 },
      ],
      average: null,
    }
  }

  const min = question.scale_min ?? 1
  const max = question.scale_max ?? 5
  const values: ValueCount[] = []
  for (let value = max; value >= min; value--)
    values.push({ value, label: String(value), count: counts.get(value) ?? 0 })
  const sum = values.reduce((acc, v) => acc + v.value * v.count, 0)
  return { question, answered, values, average: answered ? sum / answered : null }
}

export type Kpis = {
  // Promedio de todas las respuestas de escala, solo si todas las escalas tienen el mismo rango.
  average: { value: number; max: number } | null
  // Porcentaje de "Sí" sobre todas las respuestas sí / no.
  yes: { count: number; total: number } | null
}

export function kpis(results: QuestionResult[]): Kpis {
  const scales = results.filter((r) => r.question.type === 'scale')
  const sameRange =
    scales.length > 0 &&
    scales.every(
      (r) =>
        r.question.scale_min === scales[0].question.scale_min && r.question.scale_max === scales[0].question.scale_max,
    )
  const scaleAnswered = scales.reduce((acc, r) => acc + r.answered, 0)
  const scaleSum = scales.reduce((acc, r) => acc + r.values.reduce((s, v) => s + v.value * v.count, 0), 0)

  const yesNo = results.filter((r) => r.question.type === 'yes_no')
  const yesTotal = yesNo.reduce((acc, r) => acc + r.answered, 0)
  const yesCount = yesNo.reduce((acc, r) => acc + (r.values.find((v) => v.value === 1)?.count ?? 0), 0)

  return {
    average:
      sameRange && scaleAnswered ? { value: scaleSum / scaleAnswered, max: scales[0].question.scale_max ?? 5 } : null,
    yes: yesTotal ? { count: yesCount, total: yesTotal } : null,
  }
}
