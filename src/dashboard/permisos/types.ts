// Fila de public.permissions (migración 20261005150000_roles_permissions.sql).
export type Permission = {
  code: string
  module: string
  name: string
  description: string | null
}

export type PermissionGroup = { module: string; label: string; permissions: Permission[] }

// Roles que tienen cada permiso (por código), con su nombre para mostrar.
export type PermissionRoles = Record<string, string[]>
