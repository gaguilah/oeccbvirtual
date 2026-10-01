// Tipos de pregunta con componente propio (ver questions/QuestionField.tsx).
export type QuestionType = 'yes_no' | 'scale'

export type SurveyQuestion = {
  id: string
  code: string
  position: number
  text: string
  help_text: string | null
  // Llega como texto desde la base de datos; los tipos sin componente se detectan en tiempo de ejecución.
  type: QuestionType | (string & {})
  scale_min: number | null
  scale_max: number | null
  min_label: string | null
  max_label: string | null
  is_required: boolean
}

export type Survey = {
  id: string
  title: string
  survey_questions: SurveyQuestion[]
}

// yes_no → boolean · scale → number
export type AnswerValue = boolean | number

// Respuestas indexadas por `question.id`.
export type Answers = Record<string, AnswerValue | undefined>
