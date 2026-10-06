import { supabase } from '../../lib/supabase'
import type { CourtNumber } from '../../lib/courts'

export type RoleScope = 'all' | 'court'

// Lo que devuelve public.get_my_access() (migración 20261005150000_roles_permissions.sql).
export type Access = {
  role: string | null
  role_name: string | null
  scope: RoleScope | null
  court: CourtNumber | null
  active: boolean
  must_change_password: boolean
  permissions: string[]
}

// Acceso del usuario en sesión. null: no tiene perfil (todavía sin acceso al dashboard).
export async function fetchMyAccess(): Promise<Access | null> {
  const { data, error } = await supabase.rpc('get_my_access')
  if (error) throw error
  return (data as Access | null) ?? null
}

// Tras cambiar la contraseña temporal: quita el aviso de cambio obligatorio.
export async function completePasswordChange(): Promise<void> {
  const { error } = await supabase.rpc('complete_password_change')
  if (error) throw error
}
