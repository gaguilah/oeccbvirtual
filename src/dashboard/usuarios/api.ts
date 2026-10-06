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
