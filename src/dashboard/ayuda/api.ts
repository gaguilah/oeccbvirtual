import { supabase } from '../../lib/supabase'
import { fetchPermissions, type Permission } from '../permisos'
import type { RoleAccess } from './types'

export type RolesMatrix = { roles: RoleAccess[]; permissions: Permission[] }

// Roles con sus permisos y el catálogo, para la tabla "Quién puede hacer qué". roles,
// role_permissions y permissions los lee cualquier usuario autenticado (migración
// 20261005150000_roles_permissions.sql), así que la Ayuda refleja lo configurado hoy en Roles.
export async function fetchRolesMatrix(): Promise<RolesMatrix> {
  const [rolesResult, permissions] = await Promise.all([
    supabase.from('roles').select('name, scope, is_system, role_permissions(permission_code)').order('name'),
    fetchPermissions(),
  ])
  if (rolesResult.error) throw new Error('No se pudieron cargar los roles.')
  const rows = rolesResult.data as unknown as {
    name: string
    scope: 'all' | 'court'
    is_system: boolean
    role_permissions: { permission_code: string }[]
  }[]
  const roles = rows.map((row) => ({
    name: row.name,
    scope: row.scope,
    isSystem: row.is_system,
    permissions: row.role_permissions.map((item) => item.permission_code),
  }))
  return { roles, permissions }
}
