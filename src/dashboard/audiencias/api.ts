import { supabase } from '../../lib/supabase'
import { PAGE_SIZE, HEARING_MINUTES } from './data'
import { addDays, startOfDay } from './dates'
import type { Court, Hearing, HearingAudit, HearingFilters, HearingType, NonBusinessDay } from './types'

const COLUMNS =
  'id, scheduled_at, hearing_type_id, case_number, court_id, connection_url, recording_url, status_id, notes, created_at, updated_at'

const RANGE_NOT_SATISFIABLE = 'PGRST103'

// Errores de la base de datos (trigger hearings_rules, restricciones, políticas) → español.
export function hearingError(error: { message?: string; code?: string } | null): Error {
  const message = error?.message ?? ''
  const known: [string, string][] = [
    ['hearing_past', 'La fecha y hora deben ser futuras.'],
    ['hearing_non_business_day', 'Ese día no es hábil (fin de semana, festivo o cierre).'],
    ['hearing_out_of_hours', 'La hora debe estar entre las 7:00 a. m. y las 5:00 p. m.'],
    ['hearing_invalid_minutes', 'La hora debe ser en punto, y cuarto, y media o menos cuarto.'],
    ['hearing_type_inactive', 'Ese tipo de audiencia está inactivo: elija otro.'],
    ['hearing_recording_only_realizada', 'El enlace de grabación solo se agrega al marcarla realizada.'],
    ['hearing_recording_required', 'Para marcarla realizada, agregue el enlace de grabación.'],
    ['hearing_closed', 'La audiencia ya está cerrada: solo se puede corregir la grabación.'],
    ['hearing_close_with_changes', 'Al cerrar la audiencia no se pueden cambiar su fecha ni sus datos.'],
    ['hearing_too_early_to_close', 'Solo se puede marcar realizada desde una hora después de la hora programada.'],
    ['hearing_too_early_to_cancel', 'Solo se puede cancelar desde la hora programada. Para cambiar la fecha, edítela.'],
    ['hearing_not_deletable', 'Solo se elimina una audiencia programada, futura, sin enlace de conexión ni grabación.'],
  ]
  const match = known.find(([code]) => message.includes(code))
  if (match) return new Error(match[1])
  if (error?.code === '23505') {
    if (message.includes('hearing_types')) return new Error('Ya existe un tipo de audiencia con ese nombre.')
    return new Error('Ese radicado ya tiene una audiencia en esa fecha y hora.')
  }
  if (error?.code === '23503') return new Error('Ese tipo tiene audiencias: desactívelo en lugar de eliminarlo.')
  if (error?.code === '23514') return new Error('Revise el radicado (23 dígitos) y los enlaces (https://…).')
  if (error?.code === '42501') return new Error('No tiene permiso para esta acción en ese juzgado.')
  console.error('Error de audiencias:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

function aborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Petición cancelada', 'AbortError')
}

export type HearingsPage = { rows: Hearing[]; total: number; outOfRange: boolean }

// Una página de la tabla. Próximas y Por cerrar: de la más cercana a la más lejana; Cerradas y
// Todas: de la más reciente a la más antigua.
export async function fetchHearings(filters: HearingFilters, now: Date, signal: AbortSignal): Promise<HearingsPage> {
  const nowIso = now.toISOString()
  let request = supabase.from('hearings').select(COLUMNS, { count: 'exact' })
  if (filters.court) request = request.eq('court_id', filters.court)
  if (filters.type) request = request.eq('hearing_type_id', filters.type)
  if (filters.query) request = request.like('case_number', `%${filters.query}%`)
  if (filters.tab === 'proximas') request = request.eq('status_id', 1).gt('scheduled_at', nowIso)
  if (filters.tab === 'por-cerrar') request = request.eq('status_id', 1).lte('scheduled_at', nowIso)
  if (filters.tab === 'cerradas') request = request.neq('status_id', 1)
  if (filters.from) request = request.gte('scheduled_at', startOfDay(filters.from))
  if (filters.to) request = request.lt('scheduled_at', startOfDay(addDays(filters.to, 1)))

  const ascending = filters.tab === 'proximas' || filters.tab === 'por-cerrar'
  const from = (filters.page - 1) * PAGE_SIZE
  const { data, count, error } = await request
    .order('scheduled_at', { ascending })
    .order('case_number')
    .range(from, from + PAGE_SIZE - 1)
    .abortSignal(signal)
  aborted(signal)
  if (error?.code === RANGE_NOT_SATISFIABLE) return { rows: [], total: 0, outOfRange: true }
  if (error) throw hearingError(error)
  return { rows: (data ?? []) as Hearing[], total: count ?? 0, outOfRange: false }
}

// Cuántas hay por cerrar con los filtros actuales (número de la pestaña).
export async function countPendingClose(filters: HearingFilters, now: Date, signal: AbortSignal): Promise<number> {
  let request = supabase.from('hearings').select('id', { count: 'exact', head: true })
  if (filters.court) request = request.eq('court_id', filters.court)
  if (filters.type) request = request.eq('hearing_type_id', filters.type)
  if (filters.query) request = request.like('case_number', `%${filters.query}%`)
  const { count, error } = await request.eq('status_id', 1).lte('scheduled_at', now.toISOString()).abortSignal(signal)
  aborted(signal)
  if (error) throw hearingError(error)
  return count ?? 0
}

// Audiencias de un rango de días (calendario), de todos los estados.
export async function fetchCalendarHearings(
  filters: HearingFilters,
  range: { from: string; to: string },
  signal: AbortSignal,
): Promise<Hearing[]> {
  let request = supabase.from('hearings').select(COLUMNS)
  if (filters.court) request = request.eq('court_id', filters.court)
  if (filters.type) request = request.eq('hearing_type_id', filters.type)
  if (filters.query) request = request.like('case_number', `%${filters.query}%`)
  const { data, error } = await request
    .gte('scheduled_at', startOfDay(range.from))
    .lt('scheduled_at', startOfDay(addDays(range.to, 1)))
    .order('scheduled_at')
    .limit(1000)
    .abortSignal(signal)
  aborted(signal)
  if (error) throw hearingError(error)
  return (data ?? []) as Hearing[]
}

export async function fetchNonBusinessDays(from: string, to: string): Promise<NonBusinessDay[]> {
  const { data, error } = await supabase.rpc('hearing_non_business_days', { p_from: from, p_to: to })
  if (error) throw hearingError(error)
  return (data ?? []) as NonBusinessDay[]
}

export async function fetchHearing(id: string): Promise<Hearing | null> {
  const { data, error } = await supabase.from('hearings').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw hearingError(error)
  return data as Hearing | null
}

export async function fetchAudit(id: string): Promise<HearingAudit | null> {
  const { data, error } = await supabase.rpc('hearing_audit', { p_id: id })
  if (error) throw hearingError(error)
  return ((data ?? []) as HearingAudit[])[0] ?? null
}

// Otras audiencias programadas del juzgado que se cruzan con esa hora (duración fija de 1 hora).
export async function fetchOverlaps(court: Court, scheduledAt: string, excludeId: string | null): Promise<Hearing[]> {
  const start = new Date(scheduledAt).getTime()
  const margin = HEARING_MINUTES * 60_000
  let request = supabase
    .from('hearings')
    .select(COLUMNS)
    .eq('court_id', court)
    .eq('status_id', 1)
    .gt('scheduled_at', new Date(start - margin).toISOString())
    .lt('scheduled_at', new Date(start + margin).toISOString())
  if (excludeId) request = request.neq('id', excludeId)
  const { data, error } = await request.order('scheduled_at')
  if (error) throw hearingError(error)
  return (data ?? []) as Hearing[]
}

type HearingInput = {
  scheduled_at: string
  hearing_type_id: number
  case_number: string
  court_id: Court
  connection_url: string | null
  notes: string | null
}

export async function createHearing(input: HearingInput): Promise<string> {
  const { data, error } = await supabase.from('hearings').insert(input).select('id').single()
  if (error) throw hearingError(error)
  return data.id as string
}

export async function updateHearing(
  id: string,
  patch: Partial<HearingInput> & { status_id?: number; recording_url?: string | null },
): Promise<void> {
  const { data, error } = await supabase.from('hearings').update(patch).eq('id', id).select('id')
  if (error) throw hearingError(error)
  if (!data.length) throw new Error('La audiencia ya no existe o no tiene permiso para editarla.')
}

export async function deleteHearing(id: string): Promise<void> {
  const { data, error } = await supabase.from('hearings').delete().eq('id', id).select('id')
  if (error) throw hearingError(error)
  if (!data.length) throw new Error('La audiencia ya no existe o no tiene permiso para eliminarla.')
}

// Tarjeta de Inicio: audiencias programadas para hoy y por cerrar (según el alcance del usuario).
export async function fetchHearingsSummary(): Promise<{ today: number; pendingClose: number }> {
  const now = new Date()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now)
  const [todayResult, pendingResult] = await Promise.all([
    supabase
      .from('hearings')
      .select('id', { count: 'exact', head: true })
      .eq('status_id', 1)
      .gte('scheduled_at', startOfDay(today))
      .lt('scheduled_at', startOfDay(addDays(today, 1))),
    supabase
      .from('hearings')
      .select('id', { count: 'exact', head: true })
      .eq('status_id', 1)
      .lte('scheduled_at', now.toISOString()),
  ])
  if (todayResult.error) throw hearingError(todayResult.error)
  if (pendingResult.error) throw hearingError(pendingResult.error)
  return { today: todayResult.count ?? 0, pendingClose: pendingResult.count ?? 0 }
}

// Tipos de audiencia (todos; el formulario ofrece solo los activos).
export async function fetchHearingTypes(): Promise<HearingType[]> {
  const { data, error } = await supabase
    .from('hearing_types')
    .select('id, description, requires_link, is_active, created_at')
    .order('id')
  if (error) throw hearingError(error)
  return data as HearingType[]
}

type TypeInput = Pick<HearingType, 'description' | 'requires_link' | 'is_active'>

export async function createHearingType(input: TypeInput): Promise<number> {
  const { data, error } = await supabase.from('hearing_types').insert(input).select('id').single()
  if (error) throw hearingError(error)
  return data.id as number
}

export async function updateHearingType(id: number, patch: Partial<TypeInput>): Promise<void> {
  const { data, error } = await supabase.from('hearing_types').update(patch).eq('id', id).select('id')
  if (error) throw hearingError(error)
  if (!data.length) throw new Error('El tipo ya no existe o no tiene permiso para editarlo.')
}

export async function deleteHearingType(id: number): Promise<void> {
  const { data, error } = await supabase.from('hearing_types').delete().eq('id', id).select('id')
  if (error) throw hearingError(error)
  if (!data.length) throw new Error('El tipo ya no existe o no tiene permiso para eliminarlo.')
}
