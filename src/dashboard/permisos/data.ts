import type { Permission, PermissionGroup } from './types'

// Nombre de cada módulo de permisos (la parte antes del punto del código). Al crear una sección
// con permisos nuevos, agregar aquí su módulo. Lo usan Permisos y la matriz de Roles.
export const MODULE_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  roles: 'Roles',
  permisos: 'Permisos',
  remates: 'Avisos de Remate',
  audiencias: 'Audiencias',
  pqrs: 'PQRS',
  encuestas: 'Encuestas',
  calendario: 'Calendario',
}

export function moduleLabel(module: string): string {
  // Object.hasOwn: un módulo como "constructor" no debe devolver lo heredado de Object.
  return Object.hasOwn(MODULE_LABELS, module)
    ? MODULE_LABELS[module]
    : module.charAt(0).toLocaleUpperCase('es') + module.slice(1)
}

// Permisos agrupados por módulo, en el orden en que llegan (ya ordenados por módulo y código).
export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Permission[]>()
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission])
  }
  return [...groups].map(([module, items]) => ({ module, label: moduleLabel(module), permissions: items }))
}
