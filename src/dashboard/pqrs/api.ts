import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { PqrsSummary, RequestAudit, RequestEmail, RequestFilters, RequestRow, RequestStatus } from './types'

export const PAGE_SIZE = 10

const COLUMNS =
  'id, request_number, type, name, email, summary, status, response, responded_at, closed_reason, closed_at, created_at, updated_at'

const RANGE_NOT_SATISFIABLE = 'PGRST103'

function requestError(error: { message?: string; code?: string } | null): Error {
  const message = error?.message ?? ''
  if (message.includes('request_answered')) return new Error('Una PQRS respondida no cambia de estado.')
  if (message.includes('reason_required')) return new Error('El motivo de cierre debe tener entre 5 y 500 caracteres.')
  if (message.includes('request_not_found')) return new Error('La PQRS ya no existe.')
  if (error?.code === '42501') return new Error('No tiene permiso para esta acción.')
  console.error('Error de PQRS:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

// Solo letras, números, espacios y @ . _ - (sin comillas, comas ni paréntesis, que rompen el filtro
// "or" de PostgREST).
export function sanitizeQuery(value: string) {
  return value.replace(/[^\p{L}\p{N}\s@._-]/gu, '').slice(0, 80)
}

export type RequestsPage = { rows: RequestRow[]; total: number; outOfRange: boolean }

// Una página de la lista (filtros, orden y paginación en el servidor). Pendientes: de la más
// antigua a la más nueva (las que vencen primero arriba); las demás, de la más reciente.
export async function fetchRequests(
  { tab, type, query, page }: RequestFilters,
  signal: AbortSignal,
): Promise<RequestsPage> {
  let request = supabase.from('customer_requests').select(COLUMNS, { count: 'exact' })
  if (tab === 'pendientes') request = request.in('status', ['recibida', 'en_tramite'])
  if (tab === 'respondidas') request = request.eq('status', 'respondida')
  if (tab === 'cerradas') request = request.eq('status', 'cerrada')
  if (type) request = request.eq('type', type)
  const q = query.trim()
  // En .or() de PostgREST el comodín es * y los valores con puntos (correos) van entre comillas;
  // sanitizeQuery ya quitó las comillas y los caracteres reservados.
  if (q) {
    const like = `"*${q}*"`
    request = request.or(`request_number.ilike.${like},name.ilike.${like},email.ilike.${like}`)
  }

  const from = (page - 1) * PAGE_SIZE
  const { data, count, error } = await request
    .order(tab === 'respondidas' ? 'responded_at' : 'created_at', { ascending: tab === 'pendientes' })
    .order('request_number')
    .range(from, from + PAGE_SIZE - 1)
    .abortSignal(signal)

  if (signal.aborted) throw new DOMException('Petición cancelada', 'AbortError')
  if (error?.code === RANGE_NOT_SATISFIABLE) return { rows: [], total: 0, outOfRange: true }
  if (error) throw requestError(error)
  return { rows: (data ?? []) as RequestRow[], total: count ?? 0, outOfRange: false }
}

export async function fetchRequest(id: string): Promise<RequestRow | null> {
  const { data, error } = await supabase.from('customer_requests').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw requestError(error)
  return data as RequestRow | null
}

export async function fetchRequestEmails(id: string): Promise<RequestEmail[]> {
  const { data, error } = await supabase.rpc('request_emails', { p_id: id })
  if (error) throw requestError(error)
  return (data ?? []) as RequestEmail[]
}

export async function fetchRequestAudit(id: string): Promise<RequestAudit | null> {
  const { data, error } = await supabase.rpc('request_audit', { p_id: id })
  if (error) throw requestError(error)
  return ((data ?? []) as RequestAudit[])[0] ?? null
}

export async function fetchPqrsSummary(): Promise<PqrsSummary> {
  const { data, error } = await supabase.rpc('pqrs_summary')
  if (error) throw requestError(error)
  const row = ((data ?? []) as PqrsSummary[])[0]
  return { pending: Number(row?.pending ?? 0), overdue: Number(row?.overdue ?? 0) }
}

// Cambia el estado (en trámite, recibida o cerrada con motivo) con public.set_request_status.
export async function setRequestStatus(id: string, status: Exclude<RequestStatus, 'respondida'>, reason?: string) {
  const { error } = await supabase.rpc('set_request_status', { p_id: id, p_status: status, p_reason: reason ?? null })
  if (error) throw requestError(error)
}

// Edge Function respond-request: responder (una sola vez) o reenviar la respuesta.
async function invokeRespond(body: Record<string, unknown>): Promise<{ emailSent: boolean }> {
  const { data, error } = await supabase.functions.invoke('respond-request', { body })
  if (!error) return { emailSent: data?.emailSent !== false }
  if (error instanceof FunctionsHttpError) {
    const errorBody = await error.context.json().catch(() => null)
    if (errorBody && typeof errorBody.error === 'string') throw new Error(errorBody.error)
  }
  throw new Error('No se pudo completar la operación. Intente de nuevo.')
}

export function respondRequest(id: string, response: string) {
  return invokeRespond({ action: 'respond', id, response })
}

export function resendResponse(id: string) {
  return invokeRespond({ action: 'resend', id })
}
