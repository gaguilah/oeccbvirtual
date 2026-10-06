import { supabase } from '../../lib/supabase'
import type { Permission, RoleDraft, RoleRow } from './types'

// Errores de la base de datos (triggers, restricciones, políticas) → mensajes en español.
function roleError(error: { message?: string; code?: string }): Error {
  const message = error.message ?? ''
  if (message.includes('system_role')) return new Error('Este rol del sistema no se puede modificar ni borrar.')
  if (message.includes('role_in_use'))
    return new Error('No se puede cambiar el alcance de un rol con usuarios asignados.')
  if (message.includes('invalid_name')) return new Error('El nombre debe tener entre 3 y 60 caracteres.')
  if (message.includes('role_not_found')) return new Error('El rol no existe o no tiene permiso para editarlo.')
  if (error.code === '23505') return new Error('Ya existe un rol con ese código. Use otro nombre.')
  if (error.code === '23503') return new Error('El rol tiene usuarios asignados: reasígnelos antes de borrarlo.')
  if (error.code === '23514') return new Error('El código del rol solo puede tener letras sin tildes y guiones bajos.')
  if (error.code === '42501') return new Error('No tiene permiso para gestionar roles.')
  console.error('Error de roles:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

export async function fetchRoles(): Promise<RoleRow[]> {
  const { data, error } = await supabase.rpc('list_roles')
  if (error) throw roleError(error)
  return (data ?? []) as RoleRow[]
}

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('code, module, name, description')
    .order('module')
    .order('code')
  if (error) throw roleError(error)
  return data as Permission[]
}

export async function fetchRolePermissions(roleId: string): Promise<string[]> {
  const { data, error } = await supabase.from('role_permissions').select('permission_code').eq('role_id', roleId)
  if (error) throw roleError(error)
  return data.map((row) => row.permission_code as string)
}

// Crea (id null) o edita un rol y deja exactamente esos permisos (public.save_role, una transacción).
export async function saveRole(id: string | null, code: string, draft: RoleDraft): Promise<string> {
  const { data, error } = await supabase.rpc('save_role', {
    p_id: id,
    p_code: code,
    p_name: draft.name,
    p_description: draft.description,
    p_scope: draft.scope,
    p_permissions: draft.permissions,
  })
  if (error) throw roleError(error)
  return data as string
}

export async function deleteRole(id: string): Promise<void> {
  const { data, error } = await supabase.from('roles').delete().eq('id', id).select('id')
  if (error) throw roleError(error)
  if (!data.length) throw new Error('El rol no existe o no tiene permiso para borrarlo.')
}
