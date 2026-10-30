import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Court } from '../../components/remates'
import { parseAdminFilters, serializeAdminFilters } from './filters'
import type { AdminFilters } from './types'

// Filtros del listado del dashboard en la URL. `forcedCourt`: un usuario de alcance juzgado solo
// ve el suyo (RLS lo garantiza; esto solo evita mostrar un filtro que no aplica).
export function useAdminFilters(forcedCourt: Court | null) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams, forcedCourt), [searchParams, forcedCourt])

  const updateFilters = useCallback(
    (changes: Partial<AdminFilters>, options?: { replace?: boolean }) => {
      setSearchParams(
        (current) =>
          serializeAdminFilters({ ...parseAdminFilters(current, forcedCourt), page: 1, ...changes }, forcedCourt),
        { replace: options?.replace },
      )
    },
    [setSearchParams, forcedCourt],
  )

  return { filters, updateFilters }
}
