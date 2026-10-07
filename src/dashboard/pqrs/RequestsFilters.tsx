import { useEffect, useState, type ReactNode } from 'react'
import { requestTypes, REQUEST_TYPE_IDS, type RequestTypeId } from '../../components/pqrs/data'
import { Input, Select } from '../../components/ui'
import { cn } from '../../lib/cn'
import { sanitizeQuery } from './api'
import { TABS } from './data'
import type { RequestFilters } from './types'

const SEARCH_DELAY_MS = 300

// Pestañas planas, como las de Avisos de Remate.
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
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

type RequestsFiltersProps = {
  filters: RequestFilters
  onChange: (changes: Partial<RequestFilters>, options?: { replace?: boolean }) => void
  className?: string
}

// Estado (pestañas), tipo y búsqueda por radicado, nombre o correo. La búsqueda espera a que se
// deje de escribir y no llena el historial.
export default function RequestsFilters({ filters, onChange, className }: RequestsFiltersProps) {
  const [query, setQuery] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)

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
      <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6" role="group" aria-label="Estado">
        {TABS.map((tab) => (
          <TabButton key={tab.value} active={filters.tab === tab.value} onClick={() => onChange({ tab: tab.value })}>
            {tab.label}
          </TabButton>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Tipo"
          value={filters.type ?? ''}
          onChange={(e) => onChange({ type: (e.target.value || null) as RequestTypeId | null })}
          options={[
            { value: '', label: 'Todos' },
            ...REQUEST_TYPE_IDS.map((id) => ({ value: id, label: requestTypes[id].label })),
          ]}
        />
        <Input
          label="Buscar"
          type="search"
          value={query}
          onChange={(e) => setQuery(sanitizeQuery(e.target.value))}
          placeholder="Radicado, nombre o correo"
        />
      </div>
    </div>
  )
}
