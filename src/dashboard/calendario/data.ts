import type { DayKind } from './types'

export const CALENDAR_PATH = '/dashboard/dias-no-habiles'

export const KINDS: Record<DayKind, { label: string; variant: 'primary' | 'warning' | 'neutral' }> = {
  festivo: { label: 'Festivo', variant: 'primary' },
  cierre: { label: 'Cierre', variant: 'warning' },
  otro: { label: 'Otro', variant: 'neutral' },
}

const weekdayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// 'YYYY-MM-DD' → "lunes, 12 de octubre de 2026" (sobre UTC: es una fecha, sin hora).
export function longDay(day: string) {
  return weekdayFormatter.format(new Date(`${day}T00:00:00Z`))
}
