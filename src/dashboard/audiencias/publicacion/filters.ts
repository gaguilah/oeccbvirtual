import { weekStart } from '../dates'
import type { Court } from '../types'
import { defaultPublicationWeek } from './data'

// /dashboard/audiencias/publicacion?juzgado=2&semana=2026-11-23
const PARAM = { court: 'juzgado', week: 'semana' } as const

const DAY = /^\d{4}-\d{2}-\d{2}$/

export type PublicationFilters = { court: Court; monday: string }

function validDay(value: string | null): string | null {
  if (!value || !DAY.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

// Juzgado: el del usuario si es de un juzgado; si no, el de la URL o el 1. Semana: el lunes de la
// fecha de la URL o, por defecto, el de la semana siguiente.
export function parsePublicationFilters(
  params: URLSearchParams,
  forcedCourt: Court | null,
  now: Date,
): PublicationFilters {
  const court = params.get(PARAM.court)
  const day = validDay(params.get(PARAM.week))
  return {
    court: forcedCourt ?? (court === '2' ? 2 : 1),
    monday: day ? weekStart(day) : defaultPublicationWeek(now),
  }
}

export function serializePublicationFilters(
  filters: PublicationFilters,
  forcedCourt: Court | null,
  now: Date,
): URLSearchParams {
  const params = new URLSearchParams()
  if (!forcedCourt && filters.court !== 1) params.set(PARAM.court, String(filters.court))
  if (filters.monday !== defaultPublicationWeek(now)) params.set(PARAM.week, filters.monday)
  return params
}
