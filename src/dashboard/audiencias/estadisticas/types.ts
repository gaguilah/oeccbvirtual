import type { Court } from '../types'

// Modalidad según el tipo de la audiencia (hearing_types.requires_link): virtual = requiere enlace.
export type Modality = 'virtual' | 'presencial'

export type StatsFilters = { court: Court | null; type: number | null; modality: Modality | null }

// Una fila de public.hearing_stats(): un tipo con sus conteos en el periodo. `programadas` son las
// que siguen en estado Programada; `por_cerrar`, cuántas de ellas ya llegaron a su hora.
export type HearingStatsRow = {
  type_id: number
  description: string
  requires_link: boolean
  total: number
  realizadas: number
  canceladas: number
  programadas: number
  por_cerrar: number
}

export type HearingStats = {
  rows: HearingStatsRow[]
  // Años (Colombia) de la primera y la última audiencia que el usuario puede ver, sin filtros.
  first_year: number | null
  last_year: number | null
}
