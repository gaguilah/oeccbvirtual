import { useCallback, useEffect, useState } from 'react'
import { fetchAuctionNotices, type AuctionNoticesPage } from './api'
import type { RematesFilters } from './types'

type Result = {
  // Filtros (y reintento) a los que corresponde este resultado.
  key: string
  data?: AuctionNoticesPage
  // Instante usado para separar próximos de pasados; también decide el estado de cada fila.
  now?: Date
  error?: string
}

// Carga la página del listado que corresponde a los filtros. Al cambiar de filtros
// cancela la petición anterior, así una respuesta lenta nunca pisa a una más reciente.
// Mientras carga conserva los datos anteriores para que la tabla no parpadee.
export function useAuctionNotices({ court, period, query, page }: RematesFilters) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [lastData, setLastData] = useState<Pick<Result, 'data' | 'now'>>({})
  const key = `${court}|${period}|${query}|${page}|${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    const now = new Date()

    fetchAuctionNotices({ court, period, query, page }, now, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ key, data, now })
        setLastData({ data, now })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setResult({ key, error: 'No fue posible cargar los avisos de remate.' })
      })

    return () => controller.abort()
  }, [key, court, period, query, page])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = result?.key === key ? result : null

  return {
    data: current?.data ?? lastData.data,
    now: current?.now ?? lastData.now,
    loading: current === null,
    error: current?.error ?? null,
    retry,
  }
}
