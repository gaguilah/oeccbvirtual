import { useCallback, useEffect, useState } from 'react'
import { fetchPublicHearings, type PublicHearingsPage } from './api'
import type { AudienciasFilters } from './types'

type Result = { key: string; data?: PublicHearingsPage; error?: boolean }

// Como useAuctionNotices: cancela la petición anterior al cambiar de filtros y conserva los datos
// anteriores mientras carga.
export function useAudiencias({ period, court, from, to, query, page }: AudienciasFilters) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [last, setLast] = useState<PublicHearingsPage | undefined>(undefined)
  const key = `${period}|${court}|${from}|${to}|${query}|${page}|${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicHearings({ period, court, from, to, query, page }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ key, data })
        setLast(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: true })
      })
    return () => controller.abort()
  }, [key, period, court, from, to, query, page])

  const current = result?.key === key ? result : null
  return {
    data: current?.data ?? last,
    loading: current === null,
    error: Boolean(current?.error),
    retry: useCallback(() => setAttempt((n) => n + 1), []),
  }
}
