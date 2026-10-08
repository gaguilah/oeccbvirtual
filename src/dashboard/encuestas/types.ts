import type { QuestionType, SurveyQuestion } from '../../components/survey/types'

export type { QuestionType, SurveyQuestion }

// Fila de public.list_surveys() (encuestas.ver).
export type SurveyRow = {
  id: string
  code: string
  title: string
  is_active: boolean
  created_at: string
  question_count: number
  response_count: number
}

// Encuesta con sus preguntas en orden (surveys + survey_questions, encuestas.ver).
export type SurveyDetail = {
  id: string
  code: string
  title: string
  is_active: boolean
  created_at: string
  questions: SurveyQuestion[]
}

// Pregunta en el editor. `key` identifica la fila en pantalla; `id` y `code` existen si ya se guardó.
export type QuestionDraft = {
  key: string
  id?: string
  code: string
  text: string
  help_text: string
  type: QuestionType
  scale_min: number
  scale_max: number
  min_label: string
  max_label: string
  is_required: boolean
}

// public.survey_stats(): conteos del periodo, nunca respuestas sueltas.
export type SurveyStats = {
  total: number
  answers: { question_id: string; value: number; count: number }[]
}

export type YearMonth = { year: number; month: number }

export type Period =
  { mode: 'mes'; month: YearMonth } | { mode: 'rango'; from: YearMonth; to: YearMonth } | { mode: 'anio'; year: number }

export type PeriodMode = Period['mode']

export type SurveysFlash = { message: string; highlightId: string }
