import { supabase } from '../../lib/supabase'
import type { NewDay, NonBusinessDay } from './types'

function calendarError(error: { message?: string; code?: string }): Error {
  if (error.code === '42501') return new Error('No tiene permiso para modificar los días no hábiles.')
  if (error.code === '23514') return new Error('Solo se pueden agregar días de lunes a viernes, con un motivo.')
  console.error('Error del calendario:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

export async function fetchDays(year: number): Promise<NonBusinessDay[]> {
  const { data, error } = await supabase
    .from('non_business_days')
    .select('day, kind, reason, created_at')
    .gte('day', `${year}-01-01`)
    .lte('day', `${year}-12-31`)
    .order('day')
  if (error) throw calendarError(error)
  return data as NonBusinessDay[]
}

// Agrega los días; los que ya existan se omiten (no se duplican ni se sobrescriben). Devuelve
// cuántos se agregaron. Inserción simple (no upsert): la tabla solo da permiso de insertar.
export async function addDays(days: NewDay[]): Promise<number> {
  if (days.length === 0) return 0
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day))
  const { data: existing, error: readError } = await supabase
    .from('non_business_days')
    .select('day')
    .gte('day', sorted[0].day)
    .lte('day', sorted[sorted.length - 1].day)
  if (readError) throw calendarError(readError)
  const taken = new Set((existing ?? []).map((row) => row.day as string))
  const fresh = sorted.filter((day) => !taken.has(day.day))
  if (fresh.length === 0) return 0
  const { error } = await supabase.from('non_business_days').insert(fresh)
  if (error?.code === '23505') throw new Error('Alguno de esos días ya fue agregado. Recargue e intente de nuevo.')
  if (error) throw calendarError(error)
  return fresh.length
}

export async function deleteDay(day: string): Promise<void> {
  const { data, error } = await supabase.from('non_business_days').delete().eq('day', day).select('day')
  if (error) throw calendarError(error)
  if (!data.length) throw new Error('El día ya no existe o no tiene permiso para eliminarlo.')
}
