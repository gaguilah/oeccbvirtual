import { courtByNumber } from '../../lib/courts'
import type { Court } from './types'

export const AVISOS_REMATES_PATH = '/avisos-remates'

export const PAGE_SIZE = 10

export const TIME_ZONE = 'America/Bogota'

// Un remate pasa de Agendado a Realizado (y de Próximos a Pasados) esta cantidad de
// minutos después de su hora programada.
export const REALIZADO_DESPUES_DE_MIN = 60

export const CASE_NUMBER_LENGTH = 23

// Nombres desde src/lib/courts.ts (fuente única de todo el sitio).
// short + detail = name, p. ej. "Juzgado 1" + "Civil del Circuito de Ejecución de Sentencias de Bucaramanga".
function courtNames(number: Court) {
  const court = courtByNumber(number)
  return { short: court.short, detail: court.name.slice(court.short.length + 1), name: court.name }
}

export const COURTS: Record<Court, { short: string; detail: string; name: string }> = {
  1: courtNames(1),
  2: courtNames(2),
}
