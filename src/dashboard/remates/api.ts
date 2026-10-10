import { PAGE_SIZE, realizadoCutoff, type Court } from '../../components/remates'
import { supabase } from '../../lib/supabase'
import { hearingError } from '../audiencias/api'
import type { AdminFilters, AdminNotice, NoticeAudit, PdfFolder } from './types'

const COLUMNS = 'id, case_number, court, scheduled_at, pdf_url, is_published, created_at, updated_at'

// PostgREST responde 416 / PGRST103 cuando el rango empieza después del último registro.
const RANGE_NOT_SATISFIABLE = 'PGRST103'

// Errores de la base de datos (restricciones, triggers, políticas) → mensajes en español.
export function noticeError(error: { message?: string; code?: string } | null): Error {
  const message = error?.message ?? ''
  // Errores de la audiencia vinculada (crear o mover la audiencia junto con el aviso).
  if (/hearing_|remate_type_missing|link_mismatch/.test(message)) {
    const reason = hearingError(error)
    return new Error(`Audiencia vinculada: ${reason.message}`)
  }
  if (message.includes('no_pdf_folder'))
    return new Error('No hay carpeta de publicación vigente para hoy. Pida que agreguen una en Carpetas.')
  if (message.includes('remates_editar_required'))
    return new Error('No tiene permiso para cambiar los datos de este aviso.')
  if (message.includes('remates_publicar_required'))
    return new Error('No tiene permiso para publicar u ocultar este aviso.')
  if (error?.code === '23505') return new Error('Ya existe un aviso con ese radicado en esa fecha y hora.')
  if (error?.code === '23514') return new Error('Revise el radicado (23 dígitos) y la URL del PDF (https://…).')
  if (error?.code === '42501') return new Error('No tiene permiso para esta acción en ese juzgado.')
  console.error('Error de avisos de remate:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

export type AdminNoticesPage = { rows: AdminNotice[]; total: number; outOfRange: boolean }

// Una página del listado del dashboard (filtros, orden y paginación en el servidor, como el
// sitio público). Próximos: del más cercano al más lejano; Pasados y Todos: del más reciente.
export async function fetchAdminNotices(
  { court, period, publication, query, page }: AdminFilters,
  now: Date,
  signal: AbortSignal,
): Promise<AdminNoticesPage> {
  const cutoff = realizadoCutoff(now).toISOString()
  let request = supabase.from('auction_notices').select(COLUMNS, { count: 'exact' })

  if (period === 'proximos') request = request.gt('scheduled_at', cutoff)
  if (period === 'pasados') request = request.lte('scheduled_at', cutoff)
  if (publication !== 'todos') request = request.eq('is_published', publication === 'publicados')
  if (court) request = request.eq('court', court)
  if (query) request = request.like('case_number', `%${query}%`)

  const from = (page - 1) * PAGE_SIZE
  const { data, count, error } = await request
    .order('scheduled_at', { ascending: period === 'proximos' })
    .order('case_number')
    .range(from, from + PAGE_SIZE - 1)
    .abortSignal(signal)

  // Petición cancelada a propósito (cambio de filtros o doble montaje en desarrollo): no es un
  // error. useAdminNotices ya descarta las respuestas de peticiones canceladas.
  if (signal.aborted) throw new DOMException('Petición cancelada', 'AbortError')
  if (error?.code === RANGE_NOT_SATISFIABLE) return { rows: [], total: 0, outOfRange: true }
  if (error) throw noticeError(error)
  return { rows: (data ?? []) as AdminNotice[], total: count ?? 0, outOfRange: false }
}

type NoticeInput = { case_number: string; court: Court; scheduled_at: string; is_published?: boolean }

export async function createNotice(input: NoticeInput): Promise<string> {
  const { data, error } = await supabase.from('auction_notices').insert(input).select('id').single()
  if (error) throw noticeError(error)
  return data.id as string
}

// Crea el aviso y su "Audiencia de Remate" en una sola transacción (o los dos o ninguno).
export async function createNoticeWithHearing(input: NoticeInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_auction_notice_with_hearing', {
    p_case_number: input.case_number,
    p_court: input.court,
    p_scheduled_at: input.scheduled_at,
    p_is_published: input.is_published ?? false,
  })
  if (error) throw noticeError(error)
  return data as string
}

export async function updateNotice(
  id: string,
  patch: Partial<NoticeInput> & { pdf_url?: string | null },
): Promise<void> {
  const { data, error } = await supabase.from('auction_notices').update(patch).eq('id', id).select('id')
  if (error) throw noticeError(error)
  if (!data.length) throw new Error('El aviso ya no existe o no tiene permiso para editarlo.')
}

export async function deleteNotice(id: string): Promise<void> {
  const { data, error } = await supabase.from('auction_notices').delete().eq('id', id).select('id')
  if (error) throw noticeError(error)
  if (!data.length) throw new Error('El aviso ya no existe o no tiene permiso para eliminarlo.')
}

export async function fetchNotice(id: string): Promise<AdminNotice | null> {
  const { data, error } = await supabase.from('auction_notices').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw noticeError(error)
  return data as AdminNotice | null
}

export async function fetchAudit(id: string): Promise<NoticeAudit | null> {
  const { data, error } = await supabase.rpc('auction_notice_audit', { p_id: id })
  if (error) throw noticeError(error)
  return ((data ?? []) as NoticeAudit[])[0] ?? null
}

// Carpetas de publicación, de la más nueva a la más vieja.
export async function fetchFolders(): Promise<PdfFolder[]> {
  const { data, error } = await supabase
    .from('pdf_folders')
    .select('id, group_id, folder_id, valid_from, created_at')
    .order('valid_from', { ascending: false })
  if (error) throw noticeError(error)
  return data as PdfFolder[]
}

export async function addFolder(groupId: number, folderId: number, validFrom: string): Promise<void> {
  const { error } = await supabase
    .from('pdf_folders')
    .insert({ group_id: groupId, folder_id: folderId, valid_from: validFrom })
  if (error?.code === '23505') throw new Error('Ya hay una carpeta vigente desde esa fecha.')
  if (error) throw noticeError(error)
}

export async function deleteFolder(id: string): Promise<void> {
  const { data, error } = await supabase.from('pdf_folders').delete().eq('id', id).select('id')
  if (error) throw noticeError(error)
  if (!data.length) throw new Error('Solo se pueden borrar carpetas que todavía no están vigentes.')
}
