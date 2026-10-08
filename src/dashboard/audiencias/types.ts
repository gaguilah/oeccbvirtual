import type { Court } from '../../components/remates'

export type { Court }

// hearing_statuses (fija): 1 Programada, 2 Realizada, 3 Cancelada.
export type HearingStatus = 1 | 2 | 3

export type HearingType = {
  id: number
  description: string
  requires_link: boolean
  is_active: boolean
  created_at: string
}

// Fila de public.hearings (RLS: audiencias.ver en su juzgado).
export type Hearing = {
  id: string
  scheduled_at: string
  hearing_type_id: number
  case_number: string
  court_id: Court
  connection_url: string | null
  recording_url: string | null
  status_id: HearingStatus
  notes: string | null
  created_at: string
  updated_at: string | null
}

export type HearingTab = 'proximas' | 'por-cerrar' | 'cerradas' | 'todas'

export type HearingView = 'tabla' | 'semana' | 'mes'

export type HearingFilters = {
  view: HearingView
  tab: HearingTab
  court: Court | null
  type: number | null
  // 'YYYY-MM-DD' (hora de Colombia), ambos inclusive. Solo en la vista de tabla.
  from: string | null
  to: string | null
  // Solo dígitos (búsqueda parcial por radicado).
  query: string
  page: number
  // Día que se está viendo en el calendario ('YYYY-MM-DD'): su semana o su mes.
  date: string
}

export type NonBusinessDay = { day: string; reason: string }

export type HearingDraft = {
  court: string
  typeId: string
  caseNumber: string
  date: string
  time: string
  connectionUrl: string
  notes: string
}

export type HearingAudit = { created_by_name: string | null; updated_by_name: string | null }

export type HearingsFlash = { message: string; highlightId: string | null; error?: boolean }
