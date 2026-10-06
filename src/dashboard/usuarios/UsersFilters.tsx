import { Input, Select } from '../../components/ui'
import { cn } from '../../lib/cn'
import { DEPENDENCIES, STATUS } from './data'
import type { RoleOption, UserFilters, UserStatus } from './types'

type UsersFiltersProps = {
  filters: UserFilters
  roles: RoleOption[]
  onChange: (filters: UserFilters) => void
  className?: string
}

const statusOptions = (Object.keys(STATUS) as UserStatus[]).map((value) => ({ value, label: STATUS[value].label }))

// Búsqueda por nombre o correo y filtros por rol, dependencia y estado (en el navegador: son pocos
// usuarios).
export default function UsersFilters({ filters, roles, onChange, className }: UsersFiltersProps) {
  const set = (patch: Partial<UserFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <Input
        label="Buscar"
        type="search"
        value={filters.q}
        onChange={(e) => set({ q: e.target.value })}
        placeholder="Nombre o correo"
      />
      <Select
        label="Rol"
        value={filters.role}
        onChange={(e) => set({ role: e.target.value })}
        options={[{ value: '', label: 'Todos' }, ...roles.map((role) => ({ value: role.id, label: role.name }))]}
      />
      <Select
        label="Dependencia"
        value={filters.dependency}
        onChange={(e) => set({ dependency: e.target.value })}
        options={[{ value: '', label: 'Todas' }, ...DEPENDENCIES]}
      />
      <Select
        label="Estado"
        value={filters.status}
        onChange={(e) => set({ status: e.target.value as UserFilters['status'] })}
        options={[{ value: '', label: 'Todos' }, ...statusOptions]}
      />
    </div>
  )
}
