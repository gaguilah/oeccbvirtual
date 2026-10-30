import { describe, expect, it } from 'vitest'
// Límites repetidos en la base: survey_questions_scale_chk (20260930200302_create_survey_tables.sql),
// surveys_code_format y save_survey (20261008120000_surveys_admin.sql). Cambiar juntos.
import createSurveySql from '../../../supabase/migrations/20260930200302_create_survey_tables.sql?raw'
import surveysAdminSql from '../../../supabase/migrations/20261008120000_surveys_admin.sql?raw'
import {
  copyCode,
  draftToQuestion,
  EMPTY_QUESTION,
  MAX_QUESTIONS,
  plural,
  questionTypeLabel,
  SCALE_LIMITS,
  surveyCode,
  uniqueCode,
  withQuestionCodes,
} from './data'
import { questionSchema, titleSchema } from './schema'
import type { QuestionDraft } from './types'

const CODE_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/
const draft = (overrides: Partial<QuestionDraft> = {}): QuestionDraft => ({
  key: 'k1',
  ...EMPTY_QUESTION,
  text: '¿Lo atendieron a tiempo?',
  ...overrides,
})

describe('códigos de encuesta', () => {
  it('surveyCode: sin tildes, en minúsculas y con guiones', () => {
    expect(surveyCode('Atención presencial 2027')).toBe('atencion-presencial-2027')
    expect(surveyCode('  ¡Encuesta de Satisfacción, OECCB!  ')).toBe('encuesta-de-satisfaccion-oeccb')
    expect(surveyCode('Ñandú')).toBe('nandu')
  })

  it('surveyCode: máximo 60 caracteres sin guion al final', () => {
    const code = surveyCode(`${'a'.repeat(59)} b`)
    expect(code).toBe('a'.repeat(59))
  })

  it('surveyCode: sin título, vacío; un título sin letras ni números, "encuesta"', () => {
    expect(surveyCode('')).toBe('')
    expect(surveyCode('   ')).toBe('')
    expect(surveyCode('¿¿¿')).toBe('encuesta')
  })

  it('copyCode no deja un guion al final', () => {
    expect(copyCode('satisfaccion')).toBe('satisfaccion-copia')
    expect(copyCode('a'.repeat(59))).toBe('a'.repeat(59))
    expect(copyCode('a'.repeat(55))).toBe(`${'a'.repeat(55)}-copi`)
  })

  it('todo código generado cumple surveys_code_format', () => {
    expect(surveysAdminSql).toContain(`check (code ~ '${CODE_FORMAT.source}')`)
    const titles = ['Atención 2027', '¿¿¿', `${'x'.repeat(59)}-y`, 'a  --  b', 'Ünïcödé çase']
    for (const title of titles) {
      const code = surveyCode(title)
      expect(code, title).toMatch(CODE_FORMAT)
      expect(copyCode(code), title).toMatch(CODE_FORMAT)
      expect(uniqueCode(code, [code]), title).toMatch(CODE_FORMAT)
    }
    for (let length = 50; length <= 60; length++) expect(copyCode('a'.repeat(length))).toMatch(CODE_FORMAT)
  })

  it('uniqueCode agrega -2, -3… si ya existe', () => {
    expect(uniqueCode('base', [])).toBe('base')
    expect(uniqueCode('base', ['base'])).toBe('base-2')
    expect(uniqueCode('base', ['base', 'base-2', 'base-3'])).toBe('base-4')
  })
})

describe('withQuestionCodes', () => {
  it('las guardadas conservan su código; las nuevas lo toman del texto, sin repetir', () => {
    const result = withQuestionCodes([
      draft({ key: 'a', code: 'atencion' }),
      draft({ key: 'b', text: '¿Atención?' }),
      draft({ key: 'c', text: '¿Atención?' }),
      draft({ key: 'd', text: '???' }),
    ])
    expect(result.map((q) => q.code)).toEqual(['atencion', 'atencion-2', 'atencion-3', 'pregunta'])
  })
})

describe('draftToQuestion', () => {
  it('la escala lleva sus límites y etiquetas; sí / no, en null', () => {
    const scale = draftToQuestion(draft({ type: 'scale', min_label: ' Malo ', max_label: 'Bueno' }), 2)
    expect(scale).toMatchObject({ id: 'k1', position: 2, scale_min: 1, scale_max: 5, min_label: 'Malo' })
    const yesNo = draftToQuestion(draft({ text: '  ', help_text: '' }), 1)
    expect(yesNo).toMatchObject({
      text: 'Pregunta sin texto',
      help_text: null,
      scale_min: null,
      scale_max: null,
      min_label: null,
    })
  })
})

describe('textos', () => {
  it('questionTypeLabel y plural', () => {
    expect(questionTypeLabel({ type: 'scale', scale_min: 0, scale_max: 10 })).toBe('Escala 0–10')
    expect(questionTypeLabel({ type: 'yes_no', scale_min: null, scale_max: null })).toBe('Sí / no')
    expect(plural(1, 'respuesta', 'respuestas')).toBe('1 respuesta')
    expect(plural(1200, 'respuesta', 'respuestas').replace(/\s/g, ' ')).toBe('1.200 respuestas')
  })
})

describe('esquemas del editor', () => {
  const valid = {
    text: '¿Lo atendieron a tiempo?',
    help_text: '',
    type: 'scale' as const,
    scale_min: 1,
    scale_max: 5,
    min_label: 'Malo',
    max_label: 'Excelente',
    is_required: true,
  }

  it('título de 3 a 120 caracteres, sin contar espacios de los extremos', () => {
    expect(titleSchema.safeParse('  Ab  ').success).toBe(false)
    expect(titleSchema.safeParse('Abc').success).toBe(true)
    expect(titleSchema.safeParse('a'.repeat(121)).success).toBe(false)
  })

  it('escala dentro de los límites de la base, máximo mayor que mínimo y con etiquetas', () => {
    expect(questionSchema.safeParse(valid).success).toBe(true)
    expect(questionSchema.safeParse({ ...valid, scale_min: SCALE_LIMITS.min - 1 }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, scale_max: SCALE_LIMITS.max + 1 }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, scale_min: 5, scale_max: 5 }).success).toBe(false)
    expect(questionSchema.safeParse({ ...valid, min_label: ' ' }).success).toBe(false)
  })

  it('sí / no no pide etiquetas', () => {
    expect(questionSchema.safeParse({ ...valid, type: 'yes_no', min_label: '', max_label: '' }).success).toBe(true)
  })

  it('la base usa los mismos límites', () => {
    expect(createSurveySql).toContain(`scale_min >= ${SCALE_LIMITS.min} and scale_max <= ${SCALE_LIMITS.max}`)
    expect(surveysAdminSql).toContain(`if v_count > ${MAX_QUESTIONS} then`)
    expect(surveysAdminSql).toContain('char_length(trim(p_title)) not between 3 and 120')
    expect(surveysAdminSql).toContain("char_length(trim(coalesce(q ->> 'text', ''))) not between 5 and 200")
  })
})
