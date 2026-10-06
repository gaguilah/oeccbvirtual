import { useEffect, useState, type ReactNode } from 'react'
import { CASE_NUMBER_LENGTH, COURTS, sanitizeQuery } from '../../components/remates'
import { Input, Select } from '../../components/ui'
import { cn } from '../../lib/cn'
import type { AdminFilters, AdminPeriod, Publication } from './types'

const SEARCH_DELAY_MS = 300

const periods: { value: AdminPeriod; label: string }[] = [
  { value: 'proximos', label: 'Próximos' },
  { value: 'pasados', label: 'Pasados' },
  { value: 'todos', label: 'Todos' },
]

const publications: { value: Publication; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'publicados', label: 'Publicados' },
  { value: 'ocultos', label: 'Ocultos' },
]

// Pestañas planas, como las del sitio público.
function PeriodButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-10 items-center border-b-2 px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        active
          ? 'border-primary font-semibold text-on-surface'
          : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface',
      )}
    >
      {children}
    </button>
  )
}

type AdminRematesFiltersProps = {
  filters: AdminFilters
  // Sin selector de juzgado: el usuario solo ve el suyo.
  showCourt: boolean
  onChange: (changes: Partial<AdminFilters>, options?: { replace?: boolean }) => void
  className?: string
}

// Periodo (Próximos, Pasados, Todos), juzgado, publicación y radicado. La búsqueda espera a que
// se deje de escribir y no llena el historial.
export default function AdminRematesFilters({ filters, showCourt, onChange, className }: AdminRematesFiltersProps) {
  const [query, setQuery] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)

  // Si la URL cambia por fuera (Atrás, limpiar), el campo la sigue.
  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query)
    setQuery(filters.query)
  }

  useEffect(() => {
    if (query === filters.query) return
    const timer = setTimeout(() => onChange({ query }, { replace: true }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query, filters.query, onChange])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-6" role="group" aria-label="Periodo">
        {periods.map((period) => (
          <PeriodButton
            key={period.value}
            active={filters.period === period.value}
            onClick={() => onChange({ period: period.value })}
          >
            {period.label}
          </PeriodButton>
        ))}
      </div>
      <div className={cn('grid gap-3 sm:grid-cols-2', showCourt ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
        {showCourt && (
          <Select
            label="Juzgado"
            value={filters.court ? String(filters.court) : ''}
            onChange={(e) => onChange({ court: e.target.value ? (Number(e.target.value) as 1 | 2) : null })}
            options={[
              { value: '', label: 'Todos' },
              { value: '1', label: COURTS[1].short },
              { value: '2', label: COURTS[2].short },
            ]}
          />
        )}
        <Select
          label="Publicación"
          value={filters.publication}
          onChange={(e) => onChange({ publication: e.target.value as Publication })}
          options={publications}
        />
        <Input
          label="Radicado"
          type="search"
          inputMode="numeric"
          value={query}
          onChange={(e) => setQuery(sanitizeQuery(e.target.value))}
          maxLength={CASE_NUMBER_LENGTH}
          placeholder="Busca por radicado"
        />
      </div>
    </div>
  )
}
