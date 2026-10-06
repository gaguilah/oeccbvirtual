import type { RoleScope } from '../access'

export const ROLES_PATH = '/dashboard/roles'

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
