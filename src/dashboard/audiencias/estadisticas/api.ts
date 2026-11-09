import { supabase } from '../../../lib/supabase'
import { virtualParam } from './filters'
import type { HearingStats, StatsFilters } from './types'

// Conteos del periodo (días de Colombia, ambos inclusive) con los filtros; el RLS limita el juzgado.
export async function fetchHearingStats(
  range: { from: string; to: string },
  filters: StatsFilters,
  signal: AbortSignal,
): Promise<HearingStats> {
  const { data, error } = await supabase
    .rpc('hearing_stats', {
      p_from: range.from,
      p_to: range.to,
      p_court: filters.court,
      p_type: filters.type,
      p_virtual: virtualParam(filters.modality),
    })
    .abortSignal(signal)
  signal.throwIfAborted()
  if (error) {
    if (error.message?.includes('invalid_period')) throw new Error('El periodo no es válido.')
    if (error.code === '42501') throw new Error('No tiene permiso para ver las estadísticas de audiencias.')
    console.error('Error de estadísticas de audiencias:', error)
    throw new Error('No se pudieron cargar las estadísticas. Intente de nuevo.')
  }
  return data as HearingStats
}
