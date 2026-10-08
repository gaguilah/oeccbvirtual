import { formatYearMonth, periodLabel } from './period'
import { formatAverage, formatPercent, type QuestionResult } from './results'
import { questionTypeLabel } from './data'
import type { Period, SurveyDetail } from './types'

// CSV para Excel en español: separador ";", BOM para que reconozca UTF-8 (tildes) y saltos CRLF.
const SEPARATOR = ';'
const BOM = String.fromCharCode(0xfeff)

function cell(value: string | number) {
  const text = String(value)
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const row = (values: (string | number)[]) => values.map(cell).join(SEPARATOR)

const generatedFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short',
})

// "encuesta-satisfaccion-oeccb-2026-10.csv", "…-2026-01-a-2026-06.csv", "…-2026.csv".
export function csvFileName(survey: SurveyDetail, period: Period) {
  const suffix =
    period.mode === 'mes'
      ? formatYearMonth(period.month)
      : period.mode === 'rango'
        ? `${formatYearMonth(period.from)}-a-${formatYearMonth(period.to)}`
        : String(period.year)
  return `encuesta-${survey.code}-${suffix}.csv`
}

// Solo totales del periodo: una fila por cada opción de cada pregunta (nunca respuestas sueltas).
export function buildCsv(survey: SurveyDetail, period: Period, total: number, results: QuestionResult[]) {
  const lines = [
    row(['Encuesta', survey.title]),
    row(['Periodo', periodLabel(period)]),
    row(['Respuestas', total]),
    row(['Generado', generatedFormatter.format(new Date())]),
    '',
    row(['N.º', 'Pregunta', 'Tipo', 'Respuesta', 'Cantidad', 'Porcentaje', 'Promedio']),
  ]
  results.forEach(({ question, answered, values, average }, i) => {
    for (const v of values) {
      const label =
        question.type === 'scale' && v.value === question.scale_max && question.max_label
          ? `${v.label} (${question.max_label})`
          : question.type === 'scale' && v.value === question.scale_min && question.min_label
            ? `${v.label} (${question.min_label})`
            : v.label
      lines.push(
        row([
          i + 1,
          question.text,
          questionTypeLabel(question),
          label,
          v.count,
          formatPercent(v.count, answered),
          average !== null ? formatAverage(average) : '',
        ]),
      )
    }
  })
  return `${BOM}${lines.join('\r\n')}\r\n`
}

export function downloadCsv(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
