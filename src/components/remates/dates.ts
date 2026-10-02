import { REALIZADO_DESPUES_DE_MIN, TIME_ZONE } from './constants'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const longDateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// Fecha larga, p. ej. "12 de noviembre de 2026".
export function formatLongDate(iso: string) {
  return longDateFormatter.format(new Date(iso))
}

// Partes para un bloque de calendario: { day: "12", month: "NOV", year: "2026" }.
export function dateParts(iso: string) {
  const parts = dateFormatter.formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return { day: get('day'), month: get('month').replace('.', '').toUpperCase(), year: get('year') }
}

// Fecha en hora de Colombia, p. ej. "17 feb 2026".
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

// Hora en hora de Colombia, p. ej. "2:30 p. m.".
export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso))
}

// Los remates programados antes de este instante ya están realizados.
export function realizadoCutoff(now: Date) {
  return new Date(now.getTime() - REALIZADO_DESPUES_DE_MIN * 60_000)
}

export function isRealizado(scheduledAt: string, now: Date) {
  return new Date(scheduledAt) <= realizadoCutoff(now)
}
