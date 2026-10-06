import type { RoleScope } from '../access'

// Fila de public.list_roles() (migración 20261005170000_roles_admin.sql).
export type RoleRow = {
  id: string
  code: string
  name: string
  description: string | null
  scope: RoleScope
  is_system: boolean
  user_count: number
  permission_count: number
}

export type Permission = {
  code: string
  module: string
  name: string
  description: string | null
}

export type RoleDraft = {
  name: string
  description: string
  scope: RoleScope
  permissions: string[]
}

// Aviso al volver a la lista tras guardar (por location.state).
export type RolesFlash = { message: string; highlightId: string }
