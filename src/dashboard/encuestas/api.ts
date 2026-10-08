import { supabase } from '../../lib/supabase'
import type { QuestionDraft, SurveyDetail, SurveyQuestion, SurveyRow, SurveyStats } from './types'

// Errores de la base de datos (funciones, trigger, restricciones, políticas) → mensajes en español.
function surveyError(error: { message?: string; code?: string }): Error {
  const message = error.message ?? ''
  if (message.includes('survey_locked'))
    return new Error(
      'La encuesta ya tiene respuestas: solo se pueden corregir textos. Duplíquela para cambiar sus preguntas.',
    )
  if (message.includes('survey_not_found')) return new Error('La encuesta no existe o no tiene permiso para editarla.')
  if (message.includes('no_questions')) return new Error('La encuesta debe tener al menos una pregunta.')
  if (message.includes('too_many_questions')) return new Error('La encuesta puede tener hasta 30 preguntas.')
  if (message.includes('invalid_title')) return new Error('El título debe tener entre 3 y 120 caracteres.')
  if (message.includes('invalid_question')) return new Error('Revise los textos de las preguntas.')
  if (message.includes('invalid_period')) return new Error('El periodo no es válido.')
  if (error.code === '23505') return new Error('Ya existe una encuesta con ese código. Use otro título.')
  if (error.code === '23503') return new Error('La encuesta tiene respuestas: desactívela en lugar de eliminarla.')
  if (error.code === '23514') return new Error('Revise los datos: alguna pregunta de escala no es válida.')
  if (error.code === '42501') return new Error('No tiene permiso para esta acción.')
  console.error('Error de encuestas:', error)
  return new Error('No se pudo completar la operación. Intente de nuevo.')
}

export async function fetchSurveys(): Promise<SurveyRow[]> {
  const { data, error } = await supabase.rpc('list_surveys')
  if (error) throw surveyError(error)
  return (data ?? []) as SurveyRow[]
}

// null: no existe (o el usuario no la puede ver).
export async function fetchSurvey(id: string): Promise<SurveyDetail | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select(
      `id, code, title, is_active, created_at,
       questions:survey_questions (
         id, code, position, text, help_text, type, scale_min, scale_max, min_label, max_label, is_required
       )`,
    )
    .eq('id', id)
    .order('position', { referencedTable: 'survey_questions' })
    .maybeSingle()
  if (error) throw surveyError(error)
  return data as (SurveyDetail & { questions: SurveyQuestion[] }) | null
}

export async function fetchSurveyStats(
  surveyId: string,
  range: { from: string; to: string },
  signal: AbortSignal,
): Promise<SurveyStats> {
  const { data, error } = await supabase
    .rpc('survey_stats', { p_survey_id: surveyId, p_from: range.from, p_to: range.to })
    .abortSignal(signal)
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  if (error) throw surveyError(error)
  return data as SurveyStats
}

export type SurveySummary = { survey_id: string; title: string; year: number; responses: number }

export async function fetchSurveySummary(): Promise<SurveySummary | null> {
  const { data, error } = await supabase.rpc('survey_summary')
  if (error) throw surveyError(error)
  return ((data ?? []) as SurveySummary[])[0] ?? null
}

// Crea (id null) o edita una encuesta con todas sus preguntas (public.save_survey, una transacción).
export async function saveSurvey(
  id: string | null,
  code: string,
  title: string,
  questions: QuestionDraft[],
): Promise<string> {
  const { data, error } = await supabase.rpc('save_survey', {
    p_id: id,
    p_code: code,
    p_title: title,
    p_questions: questions.map((q) => ({
      id: q.id,
      code: q.code,
      text: q.text,
      help_text: q.help_text,
      type: q.type,
      scale_min: q.type === 'scale' ? q.scale_min : null,
      scale_max: q.type === 'scale' ? q.scale_max : null,
      min_label: q.type === 'scale' ? q.min_label : null,
      max_label: q.type === 'scale' ? q.max_label : null,
      is_required: q.is_required,
    })),
  })
  if (error) throw surveyError(error)
  return data as string
}

export async function setSurveyActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_active_survey', { p_id: id, p_active: active })
  if (error) throw surveyError(error)
}

export async function deleteSurvey(id: string): Promise<void> {
  const { data, error } = await supabase.from('surveys').delete().eq('id', id).select('id')
  if (error) throw surveyError(error)
  if (!data.length) throw new Error('La encuesta no existe, está activa o no tiene permiso para eliminarla.')
}
