import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { CASE_NUMBER_LENGTH, COURTS, sanitizeQuery } from '../remates'
import { Input, Select } from '../ui'
import type { AudienciasFilters as Filters, Court, HearingPeriod, HearingTypeOption } from './types'

const SEARCH_DELAY_MS = 300

const periods: { value: HearingPeriod; label: string }[] = [
  { value: 'proximas', label: 'Próximas audiencias' },
  { value: 'anteriores', label: 'Audiencias anteriores' },
]

const courts: { value: Court | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 1, label: COURTS[1].short },
  { value: 2, label: COURTS[2].short },
]

// Pestañas planas y control segmentado, como en Avisos de Remate.
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

function SearchField({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

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

type Props = {
  filters: Filters
  types: HearingTypeOption[]
  onChange: (changes: Partial<Filters>, options?: { replace?: boolean }) => void
  className?: string
}

// Periodo (próximas o anteriores), juzgado, tipo, rango de fechas y radicado.
export default function AudienciasFilters({ filters, types, onChange, className }: Props) {
  const handleSearch = useCallback((query: string) => onChange({ query }, { replace: true }), [onChange])

  return (
    <div className={cn('space-y-5', className)}>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Tipo de audiencia"
          value={filters.type ? String(filters.type) : ''}
          onChange={(e) => onChange({ type: e.target.value ? Number(e.target.value) : null })}
          options={[
            { value: '', label: 'Todos' },
            ...types.map((t) => ({ value: String(t.id), label: t.description })),
          ]}
        />
        <Input
          label="Desde"
          type="date"
          value={filters.from ?? ''}
          max={filters.to ?? undefined}
          onChange={(e) => onChange({ from: e.target.value || null })}
        />
        <Input
          label="Hasta"
          type="date"
          value={filters.to ?? ''}
          min={filters.from ?? undefined}
          onChange={(e) => onChange({ to: e.target.value || null })}
        />
        <SearchField query={filters.query} onSearch={handleSearch} />
      </div>
    </div>
  )
}
