import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parsePeriod, serializePeriod } from './period'
import type { Period } from './types'

// Periodo de los resultados en la URL (se puede compartir; Atrás lo restaura).
export function usePeriodFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = useMemo(() => parsePeriod(searchParams), [searchParams])
  const setPeriod = useCallback((next: Period) => setSearchParams(serializePeriod(next)), [setSearchParams])
  return { period, setPeriod }
}
