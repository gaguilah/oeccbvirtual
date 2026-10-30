import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, serializeFilters } from './filters'
import type { RequestFilters } from './types'

// Filtros de la lista en la URL (se pueden compartir; Atrás los restaura).
export function useRequestFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const updateFilters = useCallback(
    (changes: Partial<RequestFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serializeFilters({ ...parseFilters(current), page: 1, ...changes }), {
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )
  return { filters, updateFilters }
}
