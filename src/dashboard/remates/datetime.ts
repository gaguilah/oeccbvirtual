import { TIME_ZONE } from '../../components/remates'

// Colombia no tiene horario de verano: siempre UTC−5.
const BOGOTA_OFFSET = '-05:00'

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Fecha y hora de Colombia de un instante: { date: '2026-11-12', time: '09:00', hour: 9 }.
export function bogotaParts(value: string | Date) {
  const parts = partsFormatter.formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    hour: Number(get('hour')),
  }
}

// Fecha ('2026-11-12') y hora ('09:00') de Colombia → instante ISO para scheduled_at.
export function toScheduledAt(date: string, time: string): string {
  return new Date(`${date}T${time}:00${BOGOTA_OFFSET}`).toISOString()
}

export function todayInBogota(): string {
  return bogotaParts(new Date()).date
}
