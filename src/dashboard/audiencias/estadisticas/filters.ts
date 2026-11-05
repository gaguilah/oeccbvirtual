import type { Court, HearingType } from '../types'
import type { Modality, StatsFilters } from './types'

// /dashboard/audiencias/estadisticas?juzgado=1&tipo=4&modalidad=virtual, más el periodo
// (dashboard/period: periodo, mes, desde, hasta, anio), que se conserva al cambiar estos filtros.
const PARAM = { court: 'juzgado', type: 'tipo', modality: 'modalidad' } as const

export const MODALITIES: { value: Modality; label: string }[] = [
  { value: 'virtual', label: 'Virtual (Microsoft Teams)' },
  { value: 'presencial', label: 'Presencial' },
]

// `forcedCourt`: un usuario de alcance juzgado solo ve el suyo (el RLS lo garantiza en hearing_stats).
export function parseStatsFilters(params: URLSearchParams, forcedCourt: Court | null): StatsFilters {
  const court = params.get(PARAM.court)
  const type = Number.parseInt(params.get(PARAM.type) ?? '', 10)
  const modality = params.get(PARAM.modality)
  return {
    court: forcedCourt ?? (court === '1' || court === '2' ? (Number(court) as Court) : null),
    type: Number.isInteger(type) && type > 0 ? type : null,
    modality: modality === 'virtual' || modality === 'presencial' ? modality : null,
  }
}

export function withStatsFilters(current: URLSearchParams, filters: StatsFilters, forcedCourt: Court | null) {
  const params = new URLSearchParams(current)
  for (const key of Object.values(PARAM)) params.delete(key)
  if (filters.court && !forcedCourt) params.set(PARAM.court, String(filters.court))
  if (filters.type) params.set(PARAM.type, String(filters.type))
  if (filters.modality) params.set(PARAM.modality, filters.modality)
  return params
}

export const matchesModality = (type: HearingType, modality: Modality | null) =>
  modality === null || type.requires_link === (modality === 'virtual')

// Tipos que ofrece el filtro: los de la modalidad elegida, incluidos los inactivos (pueden tener
// audiencias en el periodo).
export const typesForModality = (types: HearingType[], modality: Modality | null) =>
  types.filter((type) => matchesModality(type, modality))

// Aplica un cambio; si la modalidad nueva no incluye el tipo elegido, el tipo vuelve a "Todos".
export function changeStatsFilters(
  filters: StatsFilters,
  changes: Partial<StatsFilters>,
  types: HearingType[],
): StatsFilters {
  const next = { ...filters, ...changes }
  const type = types.find((t) => t.id === next.type)
  if (type && !matchesModality(type, next.modality)) next.type = null
  return next
}

// p_virtual de hearing_stats: null = todas.
export const virtualParam = (modality: Modality | null) => (modality === null ? null : modality === 'virtual')
