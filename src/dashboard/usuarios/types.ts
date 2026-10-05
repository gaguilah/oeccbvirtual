import type { CourtNumber } from '../../lib/courts'
import type { RoleScope } from '../access'

// Fila de public.list_users() (migración 20261005160000_list_users.sql).
export type UserRow = {
  id: string
  email: string
  full_name: string | null
  role_id: string | null
  role_code: string | null
  role_name: string | null
  scope: RoleScope | null
  court: CourtNumber | null
  active: boolean
  must_change_password: boolean
  created_at: string
  last_sign_in_at: string | null
}

export type RoleOption = { id: string; code: string; name: string; scope: RoleScope }

export type UserStatus = 'active' | 'temporary' | 'inactive' | 'no-role'

export type UserFilters = { q: string; role: string; dependency: string; status: '' | UserStatus }

// Datos del formulario de crear / editar.
export type UserDraft = { fullName: string; email: string; roleId: string; court: string }

// Aviso de la contraseña temporal recién generada (se muestra una sola vez).
export type PasswordNotice = { kind: 'created' | 'reset'; userId: string; name: string; password: string }
