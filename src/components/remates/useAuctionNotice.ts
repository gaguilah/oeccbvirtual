import { useCallback, useEffect, useState } from 'react'
import { fetchAuctionNotice } from './api'
import type { AuctionNotice, NoticeSelection } from './types'

type Result = {
  key: string
  notice?: AuctionNotice | null
  now?: Date
  error?: string
}

// Carga un aviso (null = nada que cargar). Cada apertura (`openedAt`) consulta de nuevo,
// aunque sea el mismo aviso. Cancela la petición si cambia la selección o se cierra.
export function useAuctionNotice(selection: NoticeSelection | null) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const id = selection?.id ?? null
  const key = `${id}|${selection?.openedAt}|${attempt}`

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const now = new Date()

    fetchAuctionNotice(id, controller.signal)
      .then((notice) => {
        if (!controller.signal.aborted) setResult({ key, notice, now })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: 'No fue posible cargar la información del aviso.' })
      })

    return () => controller.abort()
  }, [key, id])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = id && result?.key === key ? result : null

  return {
    notice: current?.notice ?? null,
    now: current?.now ?? null,
    loading: Boolean(id) && current === null,
    error: current?.error ?? null,
    retry,
  }
}
