import { useCallback, useEffect, useState } from 'react'
import type { FaqSection } from '../../components/faq/types'
import { fetchFaqAdmin } from './api'
import type { AdminFaqQuestion } from './types'

type FaqAdminData = { sections: FaqSection[]; questions: AdminFaqQuestion[] }

// Todas las secciones y preguntas (también las ocultas, con preguntas.ver). reload() vuelve a leer
// después de cada cambio; los datos anteriores se conservan mientras carga.
export function useFaqAdmin() {
  const [data, setData] = useState<FaqAdminData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetchFaqAdmin()
      .then((rows) => {
        if (!active) return
        setData(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las preguntas frecuentes.')
      })
    return () => {
      active = false
    }
  }, [version])

  return { data, error, reload: useCallback(() => setVersion((v) => v + 1), []) }
}
