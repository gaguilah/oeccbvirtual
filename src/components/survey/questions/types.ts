import type { AnswerValue, SurveyQuestion } from '../types'

// Props comunes a todos los componentes de pregunta.
export type QuestionProps<T extends AnswerValue> = {
  question: SurveyQuestion
  value: T | undefined
  onChange: (value: T) => void
  // Ids para el nombre accesible del grupo (título) y su descripción (ayuda / error).
  labelledBy: string
  describedBy?: string
  invalid: boolean
}
