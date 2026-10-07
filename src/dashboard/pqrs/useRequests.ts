import { useCallback, useEffect, useState } from 'react'
import { fetchRequests, type RequestsPage } from './api'
import type { RequestFilters } from './types'

type Result = { key: string; data?: RequestsPage; now?: Date; error?: string }

// Como useAdminNotices: cancela la petición anterior al cambiar de filtros, conserva los datos
// anteriores mientras carga, y reload() vuelve a pedir la misma página.
export function useRequests({ tab, type, query, page }: RequestFilters) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [lastData, setLastData] = useState<Pick<Result, 'data' | 'now'>>({})
  const key = `${tab}|${type}|${query}|${page}|${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    const now = new Date()
    fetchRequests({ tab, type, query, page }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ key, data, now })
        setLastData({ data, now })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, error: err instanceof Error ? err.message : 'No se pudieron cargar las PQRS.' })
      })
    return () => controller.abort()
  }, [key, tab, type, query, page])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const current = result?.key === key ? result : null

  return {
    data: current?.data ?? lastData.data,
    now: current?.now ?? lastData.now,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  }
}
