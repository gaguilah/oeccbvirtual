import { z } from 'zod'
import type { AnswerValue, Answers, SurveyQuestion } from './types'

const REQUIRED_MESSAGE = 'Seleccione una respuesta para continuar.'

// Esquema zod de la respuesta según el tipo y los límites definidos en la pregunta.
function answerSchema(question: SurveyQuestion) {
  switch (question.type) {
    case 'yes_no':
      return z.boolean({ error: REQUIRED_MESSAGE })
    case 'scale': {
      const min = question.scale_min ?? 1
      const max = question.scale_max ?? 5
      return z
        .number({ error: REQUIRED_MESSAGE })
        .int()
        .min(min, `La calificación debe estar entre ${min} y ${max}.`)
        .max(max, `La calificación debe estar entre ${min} y ${max}.`)
    }
    default:
      return null
  }
}

// Devuelve el mensaje de error de una pregunta, o null si la respuesta es válida.
export function validateAnswer(question: SurveyQuestion, value: AnswerValue | undefined): string | null {
  if (value === undefined && !question.is_required) return null

  const schema = answerSchema(question)
  if (!schema) return 'Este tipo de pregunta no está soportado.'

  const result = schema.safeParse(value)
  return result.success ? null : result.error.issues[0].message
}

// Índice de la primera pregunta con error, o -1 si todas son válidas.
export function firstInvalidQuestion(questions: SurveyQuestion[], answers: Answers): number {
  return questions.findIndex((question) => validateAnswer(question, answers[question.id]) !== null)
}

// Texto legible de una respuesta (para el paso de revisión).
export function formatAnswer(question: SurveyQuestion, value: AnswerValue | undefined): string {
  if (value === undefined) return 'Sin respuesta'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'

  const max = question.scale_max ?? 5
  const min = question.scale_min ?? 1
  const label = value === min ? question.min_label : value === max ? question.max_label : null
  return `${value} de ${max}${label ? ` (${label.toLowerCase()})` : ''}`
}
