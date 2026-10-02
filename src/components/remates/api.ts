import { supabase } from '../../lib/supabase'
import { PAGE_SIZE } from './constants'
import { realizadoCutoff } from './dates'
import type { AuctionNotice, RematesFilters } from './types'

export type AuctionNoticesPage = {
  rows: AuctionNotice[]
  total: number
  // La página pedida ya no existe (p. ej. un enlace viejo con ?pagina=9).
  outOfRange: boolean
}

// PostgREST responde 416 / PGRST103 cuando el rango empieza después del último registro.
const RANGE_NOT_SATISFIABLE = 'PGRST103'

// Una página del listado. Filtros, orden y paginación se resuelven en el servidor.
// Próximos: del más cercano al más lejano. Pasados: del más reciente al más antiguo.
export async function fetchAuctionNotices(
  { court, period, query, page }: RematesFilters,
  now: Date,
  signal: AbortSignal,
): Promise<AuctionNoticesPage> {
  const cutoff = realizadoCutoff(now).toISOString()
  const upcoming = period === 'proximos'

  let request = supabase
    .from('auction_notices')
    .select('id, case_number, court, scheduled_at, pdf_url', { count: 'exact' })

  request = upcoming ? request.gt('scheduled_at', cutoff) : request.lte('scheduled_at', cutoff)
  if (court) request = request.eq('court', court)
  // `query` solo tiene dígitos, así que no hay comodines de LIKE que escapar.
  if (query) request = request.like('case_number', `%${query}%`)

  const from = (page - 1) * PAGE_SIZE
  const { data, count, error } = await request
    .order('scheduled_at', { ascending: upcoming })
    // Desempate estable para que la paginación no repita ni salte filas.
    .order('case_number')
    .range(from, from + PAGE_SIZE - 1)
    .abortSignal(signal)

  if (error?.code === RANGE_NOT_SATISFIABLE) return { rows: [], total: 0, outOfRange: true }
  if (error) throw error

  return { rows: (data ?? []) as AuctionNotice[], total: count ?? 0, outOfRange: false }
}

// Un aviso por id, con los datos vigentes (p. ej. una pdf_url corregida). null si ya no está publicado.
export async function fetchAuctionNotice(id: string, signal: AbortSignal): Promise<AuctionNotice | null> {
  const { data, error } = await supabase
    .from('auction_notices')
    .select('id, case_number, court, scheduled_at, pdf_url')
    .eq('id', id)
    .abortSignal(signal)
    .maybeSingle()

  if (error) throw error
  return data as AuctionNotice | null
}

// El sitio de publicaciones (Liferay) entrega el PDF como `inline`; con ?download=true responde
// `attachment` y el navegador lo descarga. El atributo `download` no sirve: el PDF está en otro dominio.
export function pdfDownloadUrl(pdfUrl: string) {
  const url = new URL(pdfUrl)
  url.searchParams.set('download', 'true')
  return url.toString()
}
