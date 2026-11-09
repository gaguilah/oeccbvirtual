import { useCallback, useEffect, useState } from 'react'
import { fetchHearingStats } from './api'
import type { HearingStats, StatsFilters } from './types'

// Estadísticas del periodo y los filtros. Cancela la petición anterior al cambiarlos y conserva los
// datos anteriores mientras carga.
export function useHearingStats(range: { from: string; to: string } | null, filters: StatsFilters) {
  const [stats, setStats] = useState<HearingStats | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const { court, type, modality } = filters
  const from = range?.from
  const to = range?.to
  const key = from && to ? `${from}|${to}|${court}|${type}|${modality}|${version}` : null

  useEffect(() => {
    if (!from || !to) return
    const controller = new AbortController()
    const current = `${from}|${to}|${court}|${type}|${modality}|${version}`
    fetchHearingStats({ from, to }, { court, type, modality }, controller.signal)
      .then((data) => {
        setStats(data)
        setError(null)
        setLoadedKey(current)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas.')
        setLoadedKey(current)
      })
    return () => controller.abort()
  }, [from, to, court, type, modality, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { stats, error, loading: key !== null && loadedKey !== key, reload }
}
