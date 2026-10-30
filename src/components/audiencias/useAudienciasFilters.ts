import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, serializeFilters } from './filters'
import type { AudienciasFilters } from './types'

// Los filtros viven en la URL: se pueden compartir y el botón Atrás los restaura.
export function useAudienciasFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const updateFilters = useCallback(
    (changes: Partial<AudienciasFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serializeFilters({ ...parseFilters(current), page: 1, ...changes }), {
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )
  return { filters, updateFilters }
}
