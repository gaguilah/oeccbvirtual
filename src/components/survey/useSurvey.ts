import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Survey } from './types'

type UseSurveyResult = {
  survey: Survey | null
  loading: boolean
  error: string | null
}

// Carga la encuesta activa (solo puede haber una: surveys_single_active_idx) con sus preguntas
// ordenadas por `position`. La activa se elige en el dashboard (Encuestas).
export function useSurvey(): UseSurveyResult {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('surveys')
        .select(
          `
          id, title,
          survey_questions (
            id, code, position, text, help_text, type,
            scale_min, scale_max, min_label, max_label, is_required
          )
        `,
        )
        .eq('is_active', true)
        .order('position', { referencedTable: 'survey_questions' })
        .maybeSingle<Survey>()

      if (cancelled) return
      if (error) setError('No fue posible cargar la encuesta.')
      else if (!data) setError('La encuesta no está disponible en este momento.')
      else setSurvey(data)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { survey, loading, error }
}
