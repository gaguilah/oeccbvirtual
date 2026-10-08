import { TIME_ZONE } from '../../components/remates'
import { bogotaParts, todayInBogota, toScheduledAt } from '../remates/datetime'

export { bogotaParts, todayInBogota, toScheduledAt }

// Fechas 'YYYY-MM-DD' como días de calendario (sin hora), calculadas en UTC para no depender de la
// zona del equipo.
const asUtc = (day: string) => new Date(`${day}T00:00:00Z`)
const toDay = (date: Date) => date.toISOString().slice(0, 10)

export function addDays(day: string, days: number): string {
  const date = asUtc(day)
  date.setUTCDate(date.getUTCDate() + days)
  return toDay(date)
}

// 1 = lunes … 7 = domingo.
export const isoWeekday = (day: string) => asUtc(day).getUTCDay() || 7

export const isWeekend = (day: string) => isoWeekday(day) > 5

export const weekStart = (day: string) => addDays(day, 1 - isoWeekday(day))

export const monthStart = (day: string) => `${day.slice(0, 7)}-01`

export function addMonths(day: string, months: number): string {
  const date = asUtc(monthStart(day))
  date.setUTCMonth(date.getUTCMonth() + months)
  return toDay(date)
}

export const weekDays = (day: string) => Array.from({ length: 5 }, (_, i) => addDays(weekStart(day), i))

// Semanas (lunes a viernes) que tocan el mes de `day`.
export function monthWeeks(day: string): string[][] {
  const first = monthStart(day)
  const next = addMonths(first, 1)
  const weeks: string[][] = []
  for (let monday = weekStart(first); monday < next; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 5 }, (_, i) => addDays(monday, i)))
  }
  return weeks
}

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...options })
const weekdayShort = formatter({ weekday: 'short', day: 'numeric' })
const dayMonth = formatter({ day: 'numeric', month: 'long' })
const monthYear = formatter({ month: 'long', year: 'numeric' })
const longDay = formatter({ weekday: 'long', day: 'numeric', month: 'long' })

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1)

// "lun 13"
export const shortWeekday = (day: string) => weekdayShort.format(asUtc(day)).replace('.', '')
// "Lunes, 13 de octubre"
export const longWeekday = (day: string) => capitalize(longDay.format(asUtc(day)))
// "Octubre de 2026"
export const monthTitle = (day: string) => capitalize(monthYear.format(asUtc(day)))

// "Semana del 12 al 16 de octubre de 2026" o "Semana del 28 de septiembre al 2 de octubre de 2026".
export function weekTitle(day: string) {
  const [first, last] = [weekStart(day), addDays(weekStart(day), 4)]
  const year = last.slice(0, 4)
  return first.slice(5, 7) === last.slice(5, 7)
    ? `Semana del ${Number(first.slice(8))} al ${dayMonth.format(asUtc(last))} de ${year}`
    : `Semana del ${dayMonth.format(asUtc(first))} al ${dayMonth.format(asUtc(last))} de ${year}`
}

// Minutos desde la medianoche, en hora de Colombia.
export function minutesOfDay(iso: string) {
  const { time } = bogotaParts(iso)
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const dayOf = (iso: string) => bogotaParts(iso).date

// Instante en que empieza un día de Colombia (para filtros por fecha).
export const startOfDay = (day: string) => toScheduledAt(day, '00:00')

export const timeZone = TIME_ZONE
