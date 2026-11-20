import { useCallback, useEffect, useState } from 'react'
import type { Court } from '../types'
import { fetchWeekAuctionHearings, type PublicationRow } from './api'

type Result = { key: string; rows?: PublicationRow[]; error?: string }

// Audiencias de remate de la semana. Cancela la petición anterior al cambiar de juzgado o de semana.
// `typeIds` null: los tipos aún no han cargado.
export function usePublicationHearings(court: Court, monday: string, typeIds: number[] | null) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const ids = typeIds?.join(',') ?? null
  const key = `${court}|${monday}|${ids}|${attempt}`

  useEffect(() => {
    if (ids === null) return
    const controller = new AbortController()
    const list = ids ? ids.split(',').map(Number) : []
    fetchWeekAuctionHearings(court, list, monday, controller.signal)
      .then((rows) => setResult({ key, rows }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, error: err instanceof Error ? err.message : 'No fue posible cargar las audiencias.' })
      })
    return () => controller.abort()
  }, [key, court, monday, ids])

  const current = result?.key === key ? result : null
  return {
    rows: current?.rows ?? null,
    error: current?.error ?? null,
    loading: !current,
    reload: useCallback(() => setAttempt((n) => n + 1), []),
  }
}
