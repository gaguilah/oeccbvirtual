import { describe, expect, it } from 'vitest'
import { ANSWER_MAX, QUESTION_MAX, QUESTION_MIN, SECTION_TITLE_MAX } from '../../components/faq/data'
import { faqErrorMessage } from './data'
import { normalizeAnswer, questionSchema, sectionSchema } from './schema'

const valid = { sectionId: '3', question: '¿Cómo cobro un título?', answer: 'Acuda al Banco Agrario.' }

describe('questionSchema', () => {
  it('acepta una pregunta válida y convierte la sección a número', () => {
    expect(questionSchema.parse(valid)).toEqual({ ...valid, sectionId: 3 })
  })

  it('pregunta en una línea, sin espacios repetidos ni sobrantes', () => {
    expect(questionSchema.parse({ ...valid, question: '  ¿Cómo   cobro\nun título?  ' }).question).toBe(
      '¿Cómo cobro un título?',
    )
  })

  it('sin sección: "Elija la sección"', () => {
    const result = questionSchema.safeParse({ ...valid, sectionId: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Elija la sección')
  })

  it('longitudes de la pregunta y de la respuesta', () => {
    expect(questionSchema.safeParse({ ...valid, question: 'x'.repeat(QUESTION_MIN - 1) }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, question: 'x'.repeat(QUESTION_MAX) }).success).toBe(true)
    expect(questionSchema.safeParse({ ...valid, question: 'x'.repeat(QUESTION_MAX + 1) }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, answer: '   corta   ' }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, answer: 'x'.repeat(ANSWER_MAX) }).success).toBe(true)
    expect(questionSchema.safeParse({ ...valid, answer: 'x'.repeat(ANSWER_MAX + 1) }).success).toBe(false)
  })
})

describe('normalizeAnswer', () => {
  it('conserva los saltos de línea y las listas', () => {
    expect(normalizeAnswer('Envíe:\n- el radicado;\n- el recibo.')).toBe('Envíe:\n- el radicado;\n- el recibo.')
  })

  it('quita espacios al final de cada línea, deja una sola línea en blanco y recorta los extremos', () => {
    expect(normalizeAnswer('\n\n  Uno.   \r\n\r\n\r\n\r\nDos.\t\n\n')).toBe('Uno.\n\nDos.')
  })
})

describe('sectionSchema', () => {
  it('nombre en una línea, de 3 a 80 caracteres', () => {
    expect(sectionSchema.parse({ title: '  Títulos  ' }).title).toBe('Títulos')
    expect(sectionSchema.safeParse({ title: 'ab' }).success).toBe(false)
    expect(sectionSchema.safeParse({ title: 'x'.repeat(SECTION_TITLE_MAX + 1) }).success).toBe(false)
  })
})

describe('faqErrorMessage', () => {
  it('traduce los errores de la base', () => {
    expect(faqErrorMessage({ code: '23503' }, 'x')).toMatch(/tiene preguntas/)
    expect(faqErrorMessage({ code: '23505' }, 'x')).toMatch(/Ya existe una sección/)
    expect(faqErrorMessage({ code: '42501' }, 'x')).toMatch(/No tiene permiso/)
    expect(faqErrorMessage({ code: 'P0001', message: 'preguntas_gestionar_required' }, 'x')).toMatch(/No tiene permiso/)
    expect(faqErrorMessage({ code: 'P0002', message: 'faq_not_found' }, 'x')).toMatch(/ya no existe/)
    expect(faqErrorMessage(null, 'Mensaje por defecto.')).toBe('Mensaje por defecto.')
  })
})
