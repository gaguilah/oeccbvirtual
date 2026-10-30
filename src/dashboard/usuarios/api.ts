import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { RoleOption, UserRow } from './types'

const GENERIC_ERROR = 'No se pudo completar la operación. Intente de nuevo.'

// Lista de usuarios con correo y último ingreso (exige usuarios.ver en la base de datos).
export async function fetchUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase.rpc('list_users')
  if (error) throw error
  return (data ?? []) as UserRow[]
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const { data, error } = await supabase.from('roles').select('id, code, name, scope').order('name')
  if (error) throw error
  return data as RoleOption[]
}

// Información personal de otro usuario, solo lectura (get_user_personal_info, migración
// 20261027120000: exige usuarios.datos_personales). Sin fila, todo en null (no ha registrado nada).
// Cada bloque tiene su fecha (20261028120000); null si ese bloque está vacío.
export type UserPersonalInfo = {
  residence_address: string | null
  mobile_phone: string | null
  personal_email: string | null
  eps_name: string | null
  emergency_name: string | null
  emergency_relationship: string | null
  emergency_phone: string | null
  personal_updated_at: string | null
  emergency_updated_at: string | null
}

export async function fetchUserPersonalInfo(userId: string): Promise<UserPersonalInfo | null> {
  const { data, error } = await supabase.rpc('get_user_personal_info', { p_user_id: userId })
  if (error?.code === '42501') throw new Error('No tiene permiso para ver la información personal de este usuario.')
  if (error) throw new Error('No se pudo cargar la información personal. Intente de nuevo.')
  return ((data ?? []) as UserPersonalInfo[])[0] ?? null
}

type ManageAction =
  | { action: 'create'; fullName: string; email: string; roleId: string; court: number | null }
  | { action: 'update'; userId: string; fullName: string; roleId: string; court: number | null }
  | { action: 'set-active'; userId: string; active: boolean }
  | { action: 'reset-password'; userId: string }

export type ManageResult = { userId: string; temporaryPassword?: string; active?: boolean }

// Llama a la Edge Function manage-users (con el JWT de la sesión). Lanza un Error con el mensaje
// en español que devuelve la función.
export async function manageUsers(payload: ManageAction): Promise<ManageResult> {
  const { data, error } = await supabase.functions.invoke('manage-users', { body: payload })
  if (!error) return data as ManageResult

  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    if (body && typeof body.error === 'string') throw new Error(body.error)
  }
  throw new Error(GENERIC_ERROR)
}
