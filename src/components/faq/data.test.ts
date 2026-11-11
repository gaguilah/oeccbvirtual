import { describe, expect, it } from 'vitest'
import faqSql from '../../../supabase/migrations/20261110120000_faq.sql?raw'
import faqImagesSql from '../../../supabase/migrations/20261110140000_faq_images.sql?raw'
import initialSql from '../../../supabase/data/faq_initial.sql?raw'
import publicFilterSql from '../../../supabase/migrations/20261110130000_faq_public_filter.sql?raw'
import { CONTACT_EMAIL } from '../../lib/contact'
import {
  ANSWER_MAX,
  ANSWER_MIN,
  FAQ_IMAGE_BUCKET,
  FAQ_IMAGE_MAX_BYTES,
  FAQ_IMAGE_TYPES,
  faqImageUrl,
  groupFaq,
  IMAGE_ALT_MAX,
  IMAGE_ALT_MIN,
  imageFileName,
  imageFileProblem,
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
import useFaqSource from './useFaq.ts?raw'

const section = (id: number, position: number, slug = `s${id}`): FaqSection => ({ id, slug, title: slug, position })
const question = (id: number, section_id: number, position: number): FaqQuestion => ({
  id,
  section_id,
  question: `¿Pregunta ${id}?`,
  answer: 'Respuesta de prueba.',
  position,
  image_path: null,
  image_alt: null,
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

// La página pública usa la sesión del navegador: con la de un funcionario con preguntas.ver, RLS
// también deja ver las ocultas. Por eso la consulta filtra, y anon puede leer is_published.
describe('consulta de la página pública', () => {
  it('pide solo las publicadas', () => {
    expect(useFaqSource).toMatch(/\.from\('faq_questions'\)[\s\S]*?\.eq\('is_published', true\)/)
  })

  it('anon puede leer is_published para filtrar', () => {
    expect(publicFilterSql).toMatch(/grant select \(is_published\) on table public\.faq_questions to anon;/)
  })
})

describe('imagen de apoyo', () => {
  it('bucket, límite, tipos y texto alternativo iguales a la migración', () => {
    const sizeMatch = faqImagesSql.match(/values \('faq-images', 'faq-images', true, (\d+), array\[([^\]]+)\]\)/)
    expect(sizeMatch, 'insert del bucket').not.toBeNull()
    expect(FAQ_IMAGE_BUCKET).toBe('faq-images')
    expect(Number(sizeMatch![1])).toBe(FAQ_IMAGE_MAX_BYTES)
    expect(sizeMatch![2].split(',').map((t) => t.trim().replace(/'/g, ''))).toEqual(Object.keys(FAQ_IMAGE_TYPES))
    expect(faqImagesSql).toContain(`char_length(image_alt) between ${IMAGE_ALT_MIN} and ${IMAGE_ALT_MAX}`)
    expect(faqImagesSql).toContain(`\\.(${Object.values(FAQ_IMAGE_TYPES).join('|')})$`)
  })

  it('imageFileProblem: tipo, tamaño y archivo vacío', () => {
    expect(imageFileProblem({ type: 'image/png', size: 1000 })).toBeNull()
    expect(imageFileProblem({ type: 'image/webp', size: FAQ_IMAGE_MAX_BYTES })).toBeNull()
    expect(imageFileProblem({ type: 'image/jpeg', size: FAQ_IMAGE_MAX_BYTES + 1 })).toMatch(/2 MB/)
    expect(imageFileProblem({ type: 'image/gif', size: 1000 })).toMatch(/PNG, JPG o WebP/)
    expect(imageFileProblem({ type: 'image/svg+xml', size: 1000 })).toMatch(/PNG, JPG o WebP/)
    expect(imageFileProblem({ type: 'constructor', size: 1000 })).toMatch(/PNG, JPG o WebP/)
    expect(imageFileProblem({ type: 'image/png', size: 0 })).toMatch(/vacío/)
  })

  it('imageFileName: UUID con la extensión del tipo (faq_questions_image_path_chk)', () => {
    const uuid = '0b6a5f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b'
    const check = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/
    expect(imageFileName(uuid, 'image/jpeg')).toBe(`${uuid}.jpg`)
    for (const type of Object.keys(FAQ_IMAGE_TYPES)) expect(imageFileName(uuid, type)).toMatch(check)
  })

  it('faqImageUrl: URL pública del bucket', () => {
    expect(faqImageUrl('https://abc.supabase.co/', 'x.png')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/faq-images/x.png',
    )
  })

  it('la página pública pide la imagen y su texto alternativo', () => {
    expect(useFaqSource).toMatch(/image_path, image_alt/)
  })
})
