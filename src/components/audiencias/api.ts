import { supabase } from '../../lib/supabase'
import { PAGE_SIZE } from './constants'
import type { AudienciasFilters, HearingTypeOption, PublicHearing } from './types'

export type PublicHearingsPage = { rows: PublicHearing[]; total: number; outOfRange: boolean }

// Una página de audiencias públicas (public.list_public_hearings: filtros, orden y paginación en el
// servidor, sin observaciones y desde 3 meses atrás).
export async function fetchPublicHearings(
  { period, court, type, from, to, query, page }: AudienciasFilters,
  signal: AbortSignal,
): Promise<PublicHearingsPage> {
  const { data, error } = await supabase
    .rpc('list_public_hearings', {
      p_period: period,
      p_court: court,
      p_type: type,
      p_from: from,
      p_to: to,
      p_query: query || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    })
    .abortSignal(signal)
  if (signal.aborted) throw new DOMException('Petición cancelada', 'AbortError')
  if (error) throw error
  const rows = (data ?? []) as PublicHearing[]
  return { rows, total: rows[0] ? Number(rows[0].total_count) : 0, outOfRange: rows.length === 0 && page > 1 }
}

// Tipos de audiencia para el filtro (catálogo público).
export async function fetchHearingTypeOptions(): Promise<HearingTypeOption[]> {
  const { data, error } = await supabase.from('hearing_types').select('id, description').order('description')
  if (error) throw error
  return data as HearingTypeOption[]
}
