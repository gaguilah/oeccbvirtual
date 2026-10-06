import { useCallback, useEffect, useState } from 'react'
import { fetchAdminNotices, type AdminNoticesPage } from './api'
import type { AdminFilters } from './types'

type Result = { key: string; data?: AdminNoticesPage; now?: Date; error?: string }

// Como useAuctionNotices del sitio público: cancela la petición anterior al cambiar de filtros y
// conserva los datos anteriores mientras carga. reload() vuelve a pedir la misma página (tras
// crear, editar, publicar o eliminar).
export function useAdminNotices({ court, period, publication, query, page }: AdminFilters) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [lastData, setLastData] = useState<Pick<Result, 'data' | 'now'>>({})
  const key = `${court}|${period}|${publication}|${query}|${page}|${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    const now = new Date()

    fetchAdminNotices({ court, period, publication, query, page }, now, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ key, data, now })
        setLastData({ data, now })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, error: err instanceof Error ? err.message : 'No fue posible cargar los avisos.' })
      })

    return () => controller.abort()
  }, [key, court, period, publication, query, page])

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
