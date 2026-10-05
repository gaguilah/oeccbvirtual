import { COURTS, courtByNumber } from '../../lib/courts'
import { formatDate, formatTime } from '../../components/remates/dates'
import type { UserFilters, UserRow, UserStatus } from './types'

export const EMPTY_FILTERS: UserFilters = { q: '', role: '', dependency: '', status: '' }

export const STATUS: Record<UserStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  temporary: { label: 'Contraseña temporal', variant: 'warning' },
  inactive: { label: 'Desactivado', variant: 'danger' },
  'no-role': { label: 'Sin rol', variant: 'neutral' },
}

export function userStatus(user: UserRow): UserStatus {
  if (!user.role_id) return 'no-role'
  if (!user.active) return 'inactive'
  if (user.must_change_password) return 'temporary'
  return 'active'
}

// Dependencia: el juzgado del usuario o, si su rol aplica a los dos, "Oficina".
export type Dependency = 'court-1' | 'court-2' | 'oficina'

export const DEPENDENCIES: { value: Dependency; label: string }[] = [
  ...COURTS.map((court) => ({ value: `court-${court.number}` as Dependency, label: court.short })),
  { value: 'oficina', label: 'Oficina' },
]

export function userDependency(user: UserRow): Dependency | null {
  if (user.court) return `court-${user.court}`
  return user.role_id ? 'oficina' : null
}

export function dependencyLabel(user: UserRow): string {
  if (user.court) return courtByNumber(user.court).short
  return user.role_id ? 'Oficina' : '—'
}

// Último ingreso en dos partes (fecha y hora) para mostrarlas en dos líneas. Sin ingresos: "Nunca".
export function lastSignIn(user: UserRow): { date: string; time: string | null } {
  if (!user.last_sign_in_at) return { date: 'Nunca', time: null }
  return { date: formatDate(user.last_sign_in_at), time: formatTime(user.last_sign_in_at) }
}

export function displayName(user: UserRow): string {
  return user.full_name?.trim() || user.email
}

// Sin tildes ni mayúsculas, para buscar "jose" y encontrar "José".
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

export function filterUsers(users: UserRow[], filters: UserFilters): UserRow[] {
  const q = normalize(filters.q.trim())
  return users.filter(
    (user) =>
      (!q || normalize(`${user.full_name ?? ''} ${user.email}`).includes(q)) &&
      (!filters.role || user.role_id === filters.role) &&
      (!filters.dependency || userDependency(user) === filters.dependency) &&
      (!filters.status || userStatus(user) === filters.status),
  )
}
