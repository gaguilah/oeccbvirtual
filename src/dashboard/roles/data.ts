import type { RoleScope } from '../access'
import type { Permission } from './types'

export const ROLES_PATH = '/dashboard/roles'

// Nombre de cada módulo de permisos (la parte antes del punto del código). Al crear una sección
// con permisos nuevos, agregar aquí su módulo.
const MODULE_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  roles: 'Roles',
  permisos: 'Permisos',
  remates: 'Avisos de Remate',
  audiencias: 'Audiencias',
  pqrs: 'PQRS',
  encuestas: 'Encuestas',
}

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module.charAt(0).toLocaleUpperCase('es') + module.slice(1)
}

export type PermissionGroup = { module: string; label: string; permissions: Permission[] }

// Permisos agrupados por módulo, en el orden en que llegan (ya ordenados por módulo y código).
export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Permission[]>()
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission])
  }
  return [...groups].map(([module, items]) => ({ module, label: moduleLabel(module), permissions: items }))
}

export const SCOPES: { value: RoleScope; label: string; description: string }[] = [
  {
    value: 'court',
    label: 'Un juzgado',
    description: 'Sus permisos aplican solo al juzgado de cada usuario (Juzgado 1 o Juzgado 2).',
  },
  {
    value: 'all',
    label: 'Ambos juzgados',
    description: 'Sus permisos aplican a los dos juzgados (como Oficina).',
  },
]

export function scopeLabel(scope: RoleScope): string {
  return SCOPES.find((option) => option.value === scope)?.label ?? scope
}

// Código del rol a partir del nombre: "Secretaría General" → "secretaria_general". Debe cumplir
// roles_code_format (^[a-z_]+$) y no cambia después de crear el rol.
export function roleCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
