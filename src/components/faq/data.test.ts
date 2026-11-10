import { describe, expect, it } from 'vitest'
import faqSql from '../../../supabase/migrations/20261110120000_faq.sql?raw'
import initialSql from '../../../supabase/data/faq_initial.sql?raw'
import { CONTACT_EMAIL } from '../../lib/contact'
import {
  ANSWER_MAX,
  ANSWER_MIN,
  groupFaq,
  QUESTION_MAX,
  QUESTION_MIN,
  questionAnchor,
  questionIdFromHash,
  SECTION_TITLE_MAX,
  SECTION_TITLE_MIN,
  sectionSlug,
  SLUG_MAX,
} from './data'
import { parseAnswer } from './format'
import type { FaqQuestion, FaqSection } from './types'

const section = (id: number, position: number, slug = `s${id}`): FaqSection => ({ id, slug, title: slug, position })
const question = (id: number, section_id: number, position: number): FaqQuestion => ({
  id,
  section_id,
  question: `¿Pregunta ${id}?`,
  answer: 'Respuesta de prueba.',
  position,
})

describe('límites, iguales a la migración', () => {
  it('título de sección, pregunta, respuesta y slug', () => {
    expect(faqSql).toContain(`char_length(title) between ${SECTION_TITLE_MIN} and ${SECTION_TITLE_MAX}`)
    expect(faqSql).toContain(`char_length(question) between ${QUESTION_MIN} and ${QUESTION_MAX}`)
    expect(faqSql).toContain(`char_length(answer) between ${ANSWER_MIN} and ${ANSWER_MAX}`)
    expect(faqSql).toContain(`char_length(slug) <= ${SLUG_MAX}`)
  })
})

describe('sectionSlug', () => {
  it('sin tildes, en minúsculas y con guiones (faq_sections_slug_chk)', () => {
    expect(sectionSlug('Títulos')).toBe('titulos')
    expect(sectionSlug('  Oficios y Remates (2026)  ')).toBe('oficios-y-remates-2026')
    expect(sectionSlug('Ñandú')).toBe('nandu')
    for (const title of ['Títulos', 'Consignaciones', '¿¡ !?', 'x'.repeat(200)]) {
      const slug = sectionSlug(title)
      expect(slug, title).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(slug.length, title).toBeLessThanOrEqual(SLUG_MAX)
    }
  })

  it('sin letras ni números: "seccion"', () => {
    expect(sectionSlug('¿¡ !?')).toBe('seccion')
  })

  it('si ya existe, le agrega un número', () => {
    expect(sectionSlug('Títulos', ['titulos'])).toBe('titulos-2')
    expect(sectionSlug('Títulos', ['titulos', 'titulos-2'])).toBe('titulos-3')
  })

  it('nunca toma la forma del ancla de una pregunta', () => {
    expect(sectionSlug('Pregunta 5')).toBe('seccion-pregunta-5')
    expect(questionIdFromHash(`#${sectionSlug('Pregunta 5')}`)).toBeNull()
  })
})

describe('anclas de las preguntas', () => {
  it('ida y vuelta', () => {
    expect(questionAnchor(12)).toBe('pregunta-12')
    expect(questionIdFromHash('#pregunta-12')).toBe(12)
    expect(questionIdFromHash('pregunta-12')).toBe(12)
  })

  it('otras anclas no son preguntas', () => {
    for (const hash of ['', '#', '#titulos', '#pregunta-', '#pregunta-12a', '#pregunta-1#x']) {
      expect(questionIdFromHash(hash), hash).toBeNull()
    }
  })
})

describe('groupFaq', () => {
  const sections = [section(1, 2), section(2, 1), section(3, 3)]
  const questions = [question(10, 1, 2), question(11, 1, 1), question(12, 2, 1)]

  it('secciones y preguntas en orden; quita las vacías', () => {
    expect(groupFaq(sections, questions).map((g) => [g.section.id, g.questions.map((q) => q.id)])).toEqual([
      [2, [12]],
      [1, [11, 10]],
    ])
  })

  it('keepEmpty conserva las vacías (dashboard)', () => {
    expect(groupFaq(sections, questions, { keepEmpty: true }).map((g) => g.section.id)).toEqual([2, 1, 3])
  })

  it('con la misma posición, desempata por id', () => {
    const tied = [question(21, 1, 1), question(20, 1, 1)]
    expect(groupFaq([section(1, 1)], tied)[0].questions.map((q) => q.id)).toEqual([20, 21])
  })

  it('no cambia los arreglos que recibe', () => {
    const copy = [...sections]
    groupFaq(sections, questions)
    expect(sections).toEqual(copy)
  })
})

// Carga inicial (supabase/data/faq_initial.sql): debe cumplir las restricciones de las tablas.
describe('carga inicial', () => {
  const sectionRows = [...initialSql.matchAll(/^ {2}\('([a-z-]+)', '([^']+)'\)/gm)].map((m) => ({
    slug: m[1],
    title: m[2],
  }))
  const questionRows = [...initialSql.matchAll(/^ {2}\(\d+, '([a-z-]+)', '([^']+)',\n\$t\$([\s\S]*?)\$t\$\)/gm)].map(
    (m) => ({ section: m[1], question: m[2], answer: m[3] }),
  )

  it('las cuatro secciones, con el slug que daría su título', () => {
    expect(sectionRows.map((row) => row.title)).toEqual(['Títulos', 'Oficios', 'Procesos', 'Consignaciones'])
    for (const row of sectionRows) expect(sectionSlug(row.title)).toBe(row.slug)
  })

  it('13 preguntas, cada una en una sección de la carga y dentro de los límites', () => {
    expect(questionRows).toHaveLength(13)
    const slugs = sectionRows.map((row) => row.slug)
    for (const row of questionRows) {
      expect(slugs, row.question).toContain(row.section)
      expect(row.question.length, row.question).toBeGreaterThanOrEqual(QUESTION_MIN)
      expect(row.question.length, row.question).toBeLessThanOrEqual(QUESTION_MAX)
      expect(row.answer, row.question).toBe(row.answer.trim())
      expect(row.answer.length, row.question).toBeGreaterThanOrEqual(ANSWER_MIN)
      expect(parseAnswer(row.answer).length, row.question).toBeGreaterThan(0)
    }
  })

  it('preguntas sin repetir y numeradas en orden', () => {
    const texts = questionRows.map((row) => row.question)
    expect(new Set(texts).size).toBe(texts.length)
    const numbers = [...initialSql.matchAll(/^ {2}\((\d+), '/gm)].map((m) => Number(m[1]))
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('el correo es el de la oficina y nada queda publicado', () => {
    for (const email of initialSql.match(/[\w.-]+@[\w.-]+\.\w+/g) ?? []) expect(email).toBe(CONTACT_EMAIL)
    expect(initialSql).not.toMatch(/is_published/)
  })
})
