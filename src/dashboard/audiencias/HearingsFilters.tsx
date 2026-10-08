import { useEffect, useState } from 'react'
import { CASE_NUMBER_LENGTH, COURTS, sanitizeQuery } from '../../components/remates'
import { Input, Select } from '../../components/ui'
import { cn } from '../../lib/cn'
import { TABS } from './data'
import type { HearingFilters, HearingType } from './types'

const SEARCH_DELAY_MS = 300

type Props = {
  filters: HearingFilters
  types: HearingType[]
  showCourt: boolean
  pendingClose: number | undefined
  onChange: (changes: Partial<HearingFilters>, options?: { replace?: boolean }) => void
}

// Pestañas (solo en la tabla), juzgado, tipo, fechas (solo en la tabla) y radicado. La búsqueda
// espera a que se deje de escribir y no llena el historial.
export default function HearingsFilters({ filters, types, showCourt, pendingClose, onChange }: Props) {
  const [query, setQuery] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)
  const table = filters.view === 'tabla'

  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query)
    setQuery(filters.query)
  }

  useEffect(() => {
    if (query === filters.query) return
    const timer = setTimeout(() => onChange({ query }, { replace: true }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query, filters.query, onChange])

  const columns = 2 + (showCourt ? 1 : 0) + (table ? 2 : 0)

  return (
    <div className="space-y-4">
      {table && (
        <div className="flex flex-wrap gap-6" role="group" aria-label="Estado">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange({ tab: tab.value })}
              aria-pressed={filters.tab === tab.value}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 border-b-2 px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                filters.tab === tab.value
                  ? 'border-primary font-semibold text-on-surface'
                  : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface',
              )}
            >
              {tab.label}
              {tab.value === 'por-cerrar' && pendingClose !== undefined && pendingClose > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {pendingClose}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2',
          columns >= 5 ? 'xl:grid-cols-5' : columns === 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
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
          label="Tipo"
          value={filters.type ? String(filters.type) : ''}
          onChange={(e) => onChange({ type: e.target.value ? Number(e.target.value) : null })}
          options={[
            { value: '', label: 'Todos' },
            ...types.map((t) => ({ value: String(t.id), label: t.description })),
          ]}
        />
        {table && (
          <>
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
          </>
        )}
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
