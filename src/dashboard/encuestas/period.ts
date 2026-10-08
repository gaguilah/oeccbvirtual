import type { Period, YearMonth } from './types'

export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export const MAX_RANGE_MONTHS = 24

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1)

// Mes actual en hora de Colombia.
export function currentMonth(): YearMonth {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: 'numeric' })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {})
  return { year: Number(parts.year), month: Number(parts.month) }
}

const index = ({ year, month }: YearMonth) => year * 12 + (month - 1)
const pad = (n: number) => String(n).padStart(2, '0')
const lastDay = ({ year, month }: YearMonth) => new Date(Date.UTC(year, month, 0)).getUTCDate()

export const formatYearMonth = ({ year, month }: YearMonth) => `${year}-${pad(month)}`

export function parseYearMonth(value: string | null): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '')
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12 ? { year, month } : null
}

// Primer y último día del periodo ('YYYY-MM-DD'), para survey_stats.
export function periodRange(period: Period): { from: string; to: string } {
  const [start, end]: [YearMonth, YearMonth] =
    period.mode === 'mes'
      ? [period.month, period.month]
      : period.mode === 'rango'
        ? [period.from, period.to]
        : [
            { year: period.year, month: 1 },
            { year: period.year, month: 12 },
          ]
  return { from: `${formatYearMonth(start)}-01`, to: `${formatYearMonth(end)}-${pad(lastDay(end))}` }
}

// null si el periodo es válido; si no, el motivo.
export function periodError(period: Period): string | null {
  if (period.mode !== 'rango') return null
  const months = index(period.to) - index(period.from) + 1
  if (months < 1) return 'El mes final no puede ser anterior al inicial.'
  if (months > MAX_RANGE_MONTHS) return `El rango puede ser de hasta ${MAX_RANGE_MONTHS} meses.`
  return null
}

const monthYear = ({ year, month }: YearMonth) => `${MONTHS[month - 1]} de ${year}`

// "Octubre de 2026", "Enero a junio de 2026", "Noviembre de 2025 a febrero de 2026", "Año 2026".
export function periodLabel(period: Period): string {
  if (period.mode === 'anio') return `Año ${period.year}`
  if (period.mode === 'mes') return capitalize(monthYear(period.month))
  const { from, to } = period
  if (index(from) === index(to)) return capitalize(monthYear(from))
  if (from.year === to.year) return capitalize(`${MONTHS[from.month - 1]} a ${monthYear(to)}`)
  return capitalize(`${monthYear(from)} a ${monthYear(to)}`)
}

// Lo mismo, dentro de una frase: "en octubre de 2026", "de enero a junio de 2026", "en 2026".
export function periodPhrase(period: Period): string {
  if (period.mode === 'anio') return `en ${period.year}`
  if (period.mode === 'mes') return `en ${monthYear(period.month)}`
  const label = periodLabel(period)
  return period.from.year === period.to.year && index(period.from) === index(period.to)
    ? `en ${label.toLocaleLowerCase('es')}`
    : `de ${label.charAt(0).toLocaleLowerCase('es')}${label.slice(1)}`
}

// Años que se pueden consultar: desde el de creación de la encuesta hasta el actual.
export function availableYears(createdAt: string): number[] {
  const first = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric' }).format(new Date(createdAt)),
  )
  const last = currentMonth().year
  const years: number[] = []
  for (let year = last; year >= Math.min(first, last); year--) years.push(year)
  return years
}
