import type { Hearing, HearingStatus, HearingTab, HearingType, HearingView } from './types'

export const HEARINGS_PATH = '/dashboard/audiencias'
export const HEARING_TYPES_PATH = `${HEARINGS_PATH}/tipos`

export const PAGE_SIZE = 10

// Duración fija de una audiencia (calendario y cruce de horario): no hay campo de duración.
export const HEARING_MINUTES = 60
// Se puede marcar Realizada desde esta cantidad de minutos después de la hora programada.
export const CLOSE_AFTER_MINUTES = 60

export const FIRST_HOUR = 7
export const LAST_HOUR = 17

export const STATUS: Record<HearingStatus, { label: string; variant: 'primary' | 'success' | 'neutral' }> = {
  1: { label: 'Programada', variant: 'primary' },
  2: { label: 'Realizada', variant: 'success' },
  3: { label: 'Cancelada', variant: 'neutral' },
}

export const TABS: { value: HearingTab; label: string }[] = [
  { value: 'proximas', label: 'Próximas' },
  { value: 'por-cerrar', label: 'Por cerrar' },
  { value: 'cerradas', label: 'Cerradas' },
  { value: 'todas', label: 'Todas' },
]

export const VIEWS: { value: HearingView; label: string }[] = [
  { value: 'tabla', label: 'Tabla' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
]

// "9:00 a. m." a partir de "09:00".
export function timeLabel(time: string) {
  const [h, m] = time.split(':').map(Number)
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

// Horas permitidas: de 7:00 a. m. a 5:00 p. m. en saltos de 15 minutos (como hearing_schedule_error).
export const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = []
  for (let minutes = FIRST_HOUR * 60; minutes <= LAST_HOUR * 60; minutes += 15) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    options.push({ value, label: timeLabel(value) })
  }
  return options
})()

const time = (iso: string) => new Date(iso).getTime()

export const isClosed = (hearing: Hearing) => hearing.status_id !== 1

// Programada cuya hora ya pasó: hay que marcarla Realizada o Cancelada.
export const isPendingClose = (hearing: Hearing, now: Date) =>
  hearing.status_id === 1 && time(hearing.scheduled_at) <= now.getTime()

export const realizeFrom = (hearing: Hearing) => new Date(time(hearing.scheduled_at) + CLOSE_AFTER_MINUTES * 60_000)

export const canRealizeNow = (hearing: Hearing, now: Date) =>
  hearing.status_id === 1 && now.getTime() >= realizeFrom(hearing).getTime()

export const canCancelNow = (hearing: Hearing, now: Date) =>
  hearing.status_id === 1 && now.getTime() >= time(hearing.scheduled_at)

// Por qué no se puede eliminar (null: sí se puede). Mismas condiciones que hearings_rules.
export function deleteBlocker(hearing: Hearing, now: Date): string | null {
  if (hearing.status_id !== 1) return 'La audiencia ya está cerrada'
  if (time(hearing.scheduled_at) <= now.getTime()) return 'La fecha ya pasó: cancélela'
  if (hearing.connection_url) return 'Tiene enlace de conexión'
  if (hearing.recording_url) return 'Tiene grabación'
  return null
}

// El tipo requiere enlace y no lo tiene: no se comunica.
export const missingLink = (hearing: Hearing, type: HearingType | undefined) =>
  hearing.status_id === 1 && Boolean(type?.requires_link) && !hearing.connection_url

export function typeName(types: HearingType[], id: number) {
  return types.find((type) => type.id === id)?.description ?? 'Tipo desconocido'
}
