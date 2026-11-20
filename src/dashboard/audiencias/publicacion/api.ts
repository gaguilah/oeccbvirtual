import { supabase } from '../../../lib/supabase'
import { hearingError } from '../api'
import type { Court, Hearing } from '../types'
import { weekRange } from './data'

export type PublicationRow = Pick<
  Hearing,
  | 'id'
  | 'scheduled_at'
  | 'hearing_type_id'
  | 'case_number'
  | 'court_id'
  | 'connection_url'
  | 'status_id'
  | 'auction_notice_deleted'
>

const COLUMNS =
  'id, scheduled_at, hearing_type_id, case_number, court_id, connection_url, status_id, auction_notice_deleted'

// Audiencias de remate programadas del juzgado en la semana (RLS aplica el alcance por juzgado).
export async function fetchWeekAuctionHearings(
  court: Court,
  typeIds: number[],
  monday: string,
  signal: AbortSignal,
): Promise<PublicationRow[]> {
  if (!typeIds.length) return []
  const { from, to } = weekRange(monday)
  const { data, error } = await supabase
    .from('hearings')
    .select(COLUMNS)
    .eq('court_id', court)
    .eq('status_id', 1)
    .in('hearing_type_id', typeIds)
    .gte('scheduled_at', from)
    .lt('scheduled_at', to)
    .order('scheduled_at')
    .order('case_number')
    .limit(500)
    .abortSignal(signal)
  signal.throwIfAborted()
  if (error) throw hearingError(error)
  return (data ?? []) as PublicationRow[]
}
