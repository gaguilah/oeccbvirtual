import { supabase } from '../../lib/supabase'
import type { Permission, PermissionRoles } from './types'

// Catálogo de permisos (legible por cualquier usuario autenticado).
export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('code, module, name, description')
    .order('module')
    .order('code')
  if (error) throw new Error('No se pudo cargar el catálogo de permisos.')
  return data as Permission[]
}

// Qué roles tienen cada permiso (superadmin no aparece: los tiene todos sin filas).
export async function fetchPermissionRoles(): Promise<PermissionRoles> {
  const { data, error } = await supabase.from('role_permissions').select('permission_code, roles(name)')
  if (error) throw new Error('No se pudieron cargar los roles de cada permiso.')
  const result: PermissionRoles = {}
  for (const row of data as unknown as { permission_code: string; roles: { name: string } | null }[]) {
    if (row.roles) result[row.permission_code] = [...(result[row.permission_code] ?? []), row.roles.name]
  }
  for (const names of Object.values(result)) names.sort((a, b) => a.localeCompare(b, 'es'))
  return result
}

// Solo nombre y descripción (grant por columna + política permisos.gestionar). El código no cambia.
export async function updatePermission(code: string, name: string, description: string): Promise<Permission> {
  const { data, error } = await supabase
    .from('permissions')
    .update({ name, description: description || null })
    .eq('code', code)
    .select('code, module, name, description')
    .maybeSingle()
  if (error) throw new Error('No se pudo guardar el permiso. Intente de nuevo.')
  if (!data) throw new Error('No tiene permiso para editar permisos.')
  return data as Permission
}
