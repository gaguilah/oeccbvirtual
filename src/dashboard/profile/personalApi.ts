import { supabase } from '../../lib/supabase'
import { personalSaveError } from './personalErrors'
import type { EmergencyContactValues, PersonalInfoValues } from './personalSchema'

// Fila de profile_personal_info (migración 20261027120000). Solo el propio usuario la lee y la
// escribe (RLS); quien tiene usuarios.datos_personales la consulta con get_user_personal_info (Usuarios).
export type PersonalInfo = {
  residence_address: string | null
  mobile_phone: string | null
  personal_email: string | null
  eps_id: number | null
  emergency_name: string | null
  emergency_relationship: string | null
  emergency_phone: string | null
  // Fecha de cada pestaña (migración 20261028120000, las pone un trigger); null si está vacía.
  personal_updated_at: string | null
  emergency_updated_at: string | null
}

export type EpsEntity = { id: number; name: string; regime: string; is_active: boolean }

type Columns = Partial<Omit<PersonalInfo, 'personal_updated_at' | 'emergency_updated_at'>>

const COLUMNS =
  'residence_address, mobile_phone, personal_email, eps_id, emergency_name, emergency_relationship, emergency_phone, personal_updated_at, emergency_updated_at'

// Grupos de columnas de cada pestaña; el trigger profile_personal_info_section_dates los repite.
export const PERSONAL_COLUMNS: (keyof Columns)[] = ['residence_address', 'mobile_phone', 'personal_email', 'eps_id']
export const EMERGENCY_COLUMNS: (keyof Columns)[] = ['emergency_name', 'emergency_relationship', 'emergency_phone']

// Sin fila (nunca guardó nada) devuelve null.
export async function fetchPersonalInfo(userId: string): Promise<PersonalInfo | null> {
  const { data, error } = await supabase
    .from('profile_personal_info')
    .select(COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error('No se pudo cargar su información.')
  return data
}

export async function fetchEpsEntities(): Promise<EpsEntity[]> {
  const { data, error } = await supabase.from('eps_entities').select('id, name, regime, is_active').order('name')
  if (error) throw new Error('No se pudo cargar la lista de EPS.')
  return data ?? []
}

// Guarda solo las columnas de una pestaña. Insert la primera vez y update después (no upsert: el
// update de PostgREST incluiría user_id, que no tiene grant de update). Si la fila apareció entre
// tanto (23505, otra pestaña del navegador), actualiza.
async function saveColumns(userId: string, exists: boolean, columns: Columns): Promise<PersonalInfo> {
  if (!exists) {
    const { data, error } = await supabase
      .from('profile_personal_info')
      .insert({ user_id: userId, ...columns })
      .select(COLUMNS)
      .single()
    if (!error) return data
    if (error.code !== '23505') throw personalSaveError(error)
  }
  const { data, error } = await supabase
    .from('profile_personal_info')
    .update(columns)
    .eq('user_id', userId)
    .select(COLUMNS)
    .single()
  if (error) throw personalSaveError(error)
  return data
}

export function savePersonalInfo(userId: string, exists: boolean, values: PersonalInfoValues) {
  return saveColumns(userId, exists, {
    residence_address: values.residenceAddress,
    mobile_phone: values.mobilePhone,
    personal_email: values.personalEmail,
    eps_id: values.epsId,
  })
}

export function saveEmergencyContact(userId: string, exists: boolean, values: EmergencyContactValues) {
  return saveColumns(userId, exists, {
    emergency_name: values.emergencyName,
    emergency_relationship: values.emergencyRelationship,
    emergency_phone: values.emergencyPhone,
  })
}

// "Quitar estos datos": deja en null las columnas de la pestaña (la tabla no permite borrar filas).
export function clearColumns(userId: string, columns: (keyof Columns)[]) {
  return saveColumns(userId, true, Object.fromEntries(columns.map((column) => [column, null])))
}

// ¿La pestaña tiene algún dato guardado?
export function hasAny(info: PersonalInfo | null, columns: (keyof Columns)[]): boolean {
  return Boolean(info && columns.some((column) => info[column] !== null))
}
