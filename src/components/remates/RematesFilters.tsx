import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Input } from '../ui'
import { CASE_NUMBER_LENGTH, COURTS } from './constants'
import type { Court, Period, RematesFilters as Filters } from './types'
import { sanitizeQuery } from './useRematesFilters'

const SEARCH_DELAY_MS = 300

type RematesFiltersProps = {
  filters: Filters
  onChange: (changes: Partial<Filters>, options?: { replace?: boolean }) => void
  className?: string
}

const periods: { value: Period; label: string }[] = [
  { value: 'proximos', label: 'Próximos remates' },
  { value: 'pasados', label: 'Remates pasados' },
]

const courts: { value: Court | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 1, label: COURTS[1].short },
  { value: 2, label: COURTS[2].short },
]

// Pestañas planas: la activa con subrayado primary (como la navegación principal).
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

// Control segmentado (como ThemeToggle): la opción activa se eleva con surface-container-lowest.
function CourtButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-9 flex-1 items-center justify-center rounded px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary sm:flex-none',
        active
          ? 'bg-surface-container-lowest text-on-surface shadow-ambient'
          : 'text-on-surface-variant hover:text-on-surface',
      )}
    >
      {children}
    </button>
  )
}

// Buscador por radicado: solo dígitos y espera SEARCH_DELAY_MS sin escribir antes de filtrar.
function SearchField({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

  // Si la búsqueda cambia desde fuera (p. ej. con el botón Atrás), actualizar el campo.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    setValue(query)
  }

  useEffect(() => {
    if (value === query) return
    const timer = setTimeout(() => onSearch(value), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [value, query, onSearch])

  return (
    <Input
      label="Buscar por radicado"
      type="search"
      inputMode="numeric"
      autoComplete="off"
      maxLength={CASE_NUMBER_LENGTH}
      placeholder="Ej.: 68001310300"
      value={value}
      onChange={(e) => setValue(sanitizeQuery(e.target.value))}
      className="tabular-nums"
    />
  )
}

export default function RematesFilters({ filters, onChange, className }: RematesFiltersProps) {
  // Estable mientras `onChange` lo sea, para no reiniciar la espera del buscador en cada render.
  const handleSearch = useCallback((query: string) => onChange({ query }, { replace: true }), [onChange])

  return (
    <div className={cn('flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
        <div role="group" aria-label="Periodo" className="flex gap-6">
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
        <div role="group" aria-label="Juzgado" className="flex rounded-md bg-surface-container-low p-1">
          {courts.map((court) => (
            <CourtButton
              key={court.label}
              active={filters.court === court.value}
              onClick={() => onChange({ court: court.value })}
            >
              {court.label}
            </CourtButton>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-72">
        <SearchField query={filters.query} onSearch={handleSearch} />
      </div>
    </div>
  )
}
