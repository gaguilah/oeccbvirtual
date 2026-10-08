import { useEffect, useState } from 'react'
import { fetchSurvey, fetchSurveyStats, fetchSurveys } from './api'
import type { SurveyDetail, SurveyRow, SurveyStats } from './types'

// Los id de encuesta son uuid: uno con otro formato (inventado o mal copiado) no se consulta.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useSurveys() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetchSurveys()
      .then((rows) => {
        if (!active) return
        setSurveys(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de encuestas.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [version])

  return { surveys, loading: !loaded, error, reload: () => setVersion((v) => v + 1) }
}

// Una encuesta con sus preguntas. survey: undefined mientras carga, null si no existe.
export function useSurveyDetail(id: string | undefined) {
  const [result, setResult] = useState<{ id: string; survey: SurveyDetail | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    const load = UUID.test(id) ? fetchSurvey(id) : Promise.resolve(null)
    load
      .then((survey) => {
        if (active) setResult({ id, survey })
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la encuesta.')
      })
    return () => {
      active = false
    }
  }, [id])

  return { survey: result && result.id === id ? result.survey : undefined, error }
}

// Conteos del periodo. Mantiene los anteriores mientras carga el nuevo y cancela los pedidos viejos.
export function useSurveyStats(surveyId: string, range: { from: string; to: string } | null) {
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = range ? `${surveyId}|${range.from}|${range.to}` : null
  const from = range?.from
  const to = range?.to

  useEffect(() => {
    if (!from || !to) return
    const controller = new AbortController()
    fetchSurveyStats(surveyId, { from, to }, controller.signal)
      .then((data) => {
        setStats(data)
        setError(null)
        setLoadedKey(`${surveyId}|${from}|${to}`)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los resultados.')
        setLoadedKey(`${surveyId}|${from}|${to}`)
      })
    return () => controller.abort()
  }, [surveyId, from, to])

  return { stats, error, loading: key !== null && loadedKey !== key }
}
