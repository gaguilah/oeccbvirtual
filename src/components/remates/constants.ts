import type { Court } from './types'

export const AVISOS_REMATES_PATH = '/avisos-remates'

export const PAGE_SIZE = 10

export const TIME_ZONE = 'America/Bogota'

// Un remate pasa de Agendado a Realizado (y de Próximos a Pasados) esta cantidad de
// minutos después de su hora programada.
export const REALIZADO_DESPUES_DE_MIN = 60

export const CASE_NUMBER_LENGTH = 23

const COURT_DETAIL = 'de Ejecución Civil del Circuito de Bucaramanga'

// short + detail = name.
export const COURTS: Record<Court, { short: string; detail: string; name: string }> = {
  1: { short: 'Juzgado 1', detail: COURT_DETAIL, name: `Juzgado 1 ${COURT_DETAIL}` },
  2: { short: 'Juzgado 2', detail: COURT_DETAIL, name: `Juzgado 2 ${COURT_DETAIL}` },
}
