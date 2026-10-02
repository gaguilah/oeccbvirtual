export type Court = 1 | 2

export type Period = 'proximos' | 'pasados'

// Fila de public.auction_notices que lee el listado público.
export type AuctionNotice = {
  id: string
  case_number: string
  court: Court
  scheduled_at: string
  pdf_url: string
}

export type RematesFilters = {
  court: Court | null
  period: Period
  // Solo dígitos (búsqueda parcial por radicado).
  query: string
  page: number
}

// Aviso abierto en el modal de detalle. `openedAt` distingue dos aperturas del mismo aviso.
export type NoticeSelection = {
  id: string
  openedAt: number
}
