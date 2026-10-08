import { useCallback, useEffect, useState } from 'react'
import { fetchHearingTypeOptions, fetchPublicHearings, type PublicHearingsPage } from './api'
import type { AudienciasFilters, HearingTypeOption } from './types'

type Result = { key: string; data?: PublicHearingsPage; error?: boolean }

// Como useAuctionNotices: cancela la petición anterior al cambiar de filtros y conserva los datos
// anteriores mientras carga.
export function useAudiencias({ period, court, type, from, to, query, page }: AudienciasFilters) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [last, setLast] = useState<PublicHearingsPage | undefined>(undefined)
  const key = `${period}|${court}|${type}|${from}|${to}|${query}|${page}|${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicHearings({ period, court, type, from, to, query, page }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ key, data })
        setLast(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: true })
      })
    return () => controller.abort()
  }, [key, period, court, type, from, to, query, page])

  const current = result?.key === key ? result : null
  return {
    data: current?.data ?? last,
    loading: current === null,
    error: Boolean(current?.error),
    retry: useCallback(() => setAttempt((n) => n + 1), []),
  }
}

export function useHearingTypeOptions() {
  const [types, setTypes] = useState<HearingTypeOption[]>([])
  useEffect(() => {
    let active = true
    fetchHearingTypeOptions()
      .then((rows) => {
        if (active) setTypes(rows)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return types
}
