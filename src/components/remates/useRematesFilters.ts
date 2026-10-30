import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, serializeFilters } from './filters'
import type { RematesFilters } from './types'

// Los filtros viven en la URL: se pueden compartir y el botón Atrás los restaura.
export function useRematesFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  // Cambiar cualquier filtro vuelve a la página 1, salvo que el cambio sea la página.
  // `replace` evita llenar el historial (p. ej. mientras se escribe en el buscador).
  const updateFilters = useCallback(
    (changes: Partial<RematesFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serializeFilters({ ...parseFilters(current), page: 1, ...changes }), {
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )

  return { filters, updateFilters }
}
