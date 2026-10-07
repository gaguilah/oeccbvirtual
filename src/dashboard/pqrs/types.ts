import type { RequestTypeId } from '../../components/pqrs/data'

export type RequestStatus = 'recibida' | 'en_tramite' | 'respondida' | 'cerrada'

// Fila de customer_requests como la lee el dashboard (RLS: pqrs.ver).
export type RequestRow = {
  id: string
  request_number: string
  type: RequestTypeId
  name: string
  email: string
  summary: string
  status: RequestStatus
  response: string | null
  responded_at: string | null
  closed_reason: string | null
  closed_at: string | null
  created_at: string
  updated_at: string | null
  // Columnas calculadas por la base de datos (días no hábiles descontados).
  due_date: string
  business_days_left: number
}

// Pestañas de la lista: pendientes = recibidas + en trámite.
export type RequestTab = 'pendientes' | 'respondidas' | 'cerradas' | 'todas'

export type RequestFilters = {
  tab: RequestTab
  type: RequestTypeId | null
  // Radicado, nombre o correo (búsqueda parcial).
  query: string
  page: number
}

export type RequestEmail = {
  kind: string
  recipient: string
  status: 'sent' | 'failed'
  error: string | null
  created_at: string
}

export type RequestAudit = { responded_by_name: string | null; updated_by_name: string | null }

export type PqrsSummary = { pending: number; overdue: number }
