import type { Court } from '../remates'

export type { Court }

export type HearingPeriod = 'proximas' | 'anteriores'

// Fila de public.list_public_hearings(): solo datos publicables (nunca las observaciones).
export type PublicHearing = {
  id: string
  scheduled_at: string
  type_name: string
  requires_link: boolean
  case_number: string
  court_id: Court
  // 1 Programada, 2 Realizada, 3 Cancelada.
  status_id: 1 | 2 | 3
  connection_url: string | null
  recording_url: string | null
  total_count: number
}

export type AudienciasFilters = {
  period: HearingPeriod
  court: Court | null
  from: string | null
  to: string | null
  query: string
  page: number
}
