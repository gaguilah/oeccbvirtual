import { describe, expect, it } from 'vitest'
import type { SurveyQuestion } from './types'
import { firstInvalidQuestion, formatAnswer, validateAnswer } from './validation'

// Las mismas reglas las vuelve a aplicar submit_survey_response (migración 20260930120000).
const question = (overrides: Partial<SurveyQuestion> = {}): SurveyQuestion => ({
  id: 'q1',
  code: 'q1',
  position: 1,
  text: '¿Pregunta?',
  help_text: null,
  type: 'scale',
  scale_min: 1,
  scale_max: 5,
  min_label: 'Muy malo',
  max_label: 'Excelente',
  is_required: true,
  ...overrides,
})

const yesNo = question({ id: 'q2', type: 'yes_no', scale_min: null, scale_max: null })
const REQUIRED = 'Seleccione una respuesta para continuar.'

describe('validateAnswer', () => {
  it('sí / no acepta solo booleanos', () => {
    expect(validateAnswer(yesNo, true)).toBeNull()
    expect(validateAnswer(yesNo, false)).toBeNull()
    expect(validateAnswer(yesNo, 1)).toBe(REQUIRED)
  })

  it('la escala acepta enteros dentro del rango de la pregunta', () => {
    const scale = question({ scale_min: 0, scale_max: 10 })
    expect(validateAnswer(scale, 0)).toBeNull()
    expect(validateAnswer(scale, 10)).toBeNull()
    expect(validateAnswer(scale, 11)).toBe('La calificación debe estar entre 0 y 10.')
    expect(validateAnswer(scale, -1)).toBe('La calificación debe estar entre 0 y 10.')
    expect(validateAnswer(scale, 2.5)).not.toBeNull()
    expect(validateAnswer(scale, true)).toBe(REQUIRED)
  })

  it('sin límites, la escala va de 1 a 5', () => {
    const scale = question({ scale_min: null, scale_max: null })
    expect(validateAnswer(scale, 1)).toBeNull()
    expect(validateAnswer(scale, 5)).toBeNull()
    expect(validateAnswer(scale, 6)).toBe('La calificación debe estar entre 1 y 5.')
  })

  it('obligatoria sin respuesta da error; opcional sin respuesta no', () => {
    expect(validateAnswer(question(), undefined)).toBe(REQUIRED)
    expect(validateAnswer(question({ is_required: false }), undefined)).toBeNull()
    // Opcional, pero si responde la respuesta debe ser válida.
    expect(validateAnswer(question({ is_required: false }), 9)).not.toBeNull()
  })

  it('un tipo sin componente se rechaza', () => {
    expect(validateAnswer(question({ type: 'texto' }), 1)).toBe('Este tipo de pregunta no está soportado.')
  })
})

describe('firstInvalidQuestion', () => {
  it('devuelve el índice de la primera pregunta con error, o -1', () => {
    const questions = [question(), yesNo]
    expect(firstInvalidQuestion(questions, { q1: 3, q2: true })).toBe(-1)
    expect(firstInvalidQuestion(questions, { q1: 3 })).toBe(1)
    expect(firstInvalidQuestion(questions, {})).toBe(0)
  })
})

describe('formatAnswer', () => {
  it('muestra sí / no, la escala con su etiqueta en los extremos y la falta de respuesta', () => {
    expect(formatAnswer(yesNo, true)).toBe('Sí')
    expect(formatAnswer(yesNo, false)).toBe('No')
    expect(formatAnswer(question(), 1)).toBe('1 de 5 (muy malo)')
    expect(formatAnswer(question(), 3)).toBe('3 de 5')
    expect(formatAnswer(question(), 5)).toBe('5 de 5 (excelente)')
    expect(formatAnswer(question(), undefined)).toBe('Sin respuesta')
  })
})
