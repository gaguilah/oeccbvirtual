import { FIRST_HOUR, LAST_HOUR } from './data'
import { isWeekend, toScheduledAt } from './dates'
import type { NonBusinessDay } from './types'

// Por qué una fecha y hora no sirven para programar una audiencia (null: sirven). Mismas reglas que
// hearing_schedule_error en la base: futura, de lunes a viernes, día hábil, de 7:00 a. m. a
// 5:00 p. m. y en saltos de 15 minutos. `nonBusiness`: días no hábiles del mes (null si aún no
// se han cargado: no se marca como error).
export function scheduleProblem(
  date: string,
  time: string,
  nonBusiness: NonBusinessDay[] | null,
  nowMs: number,
): string | null {
  if (!date) return null
  if (isWeekend(date)) return 'Los sábados y domingos no son días hábiles.'
  const reason = nonBusiness?.find((day) => day.day === date)?.reason
  if (reason) return `No es día hábil: ${reason}.`
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  if (h * 60 + m < FIRST_HOUR * 60 || h * 60 + m > LAST_HOUR * 60)
    return 'La hora debe estar entre las 7:00 a. m. y las 5:00 p. m.'
  if (m % 15 !== 0) return 'La hora debe ser en punto, y cuarto, y media o menos cuarto.'
  if (new Date(toScheduledAt(date, time)).getTime() <= nowMs) return 'La fecha y hora deben ser futuras.'
  return null
}
