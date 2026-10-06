import type { AuctionNotice, Court, Period } from '../../components/remates'

export type AdminPeriod = Period | 'todos'

export type Publication = 'todos' | 'publicados' | 'ocultos'

// Aviso como lo ve el dashboard (RLS devuelve también los ocultos a quien tiene remates.ver).
export type AdminNotice = AuctionNotice & {
  is_published: boolean
  created_at: string
  updated_at: string | null
}

export type AdminFilters = {
  court: Court | null
  period: AdminPeriod
  publication: Publication
  // Solo dígitos (búsqueda parcial por radicado).
  query: string
  page: number
}

export type NoticeDraft = {
  caseNumber: string
  court: string
  date: string
  time: string
  isPublished: boolean
  // Al editar: corregir la URL del PDF a mano (el trigger la respeta si no cambian los datos).
  manualUrl: boolean
  pdfUrl: string
}

export type PdfFolder = {
  id: string
  group_id: number
  folder_id: number
  valid_from: string
  created_at: string
}

export type NoticeAudit = { created_by_name: string | null; updated_by_name: string | null }

// Aviso tras guardar: mensaje y fila resaltada.
export type RematesFlash = { message: string; highlightId: string | null; error?: boolean }
