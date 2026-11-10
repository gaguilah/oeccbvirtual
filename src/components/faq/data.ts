import type { FaqGroup, FaqQuestion, FaqSection } from './types'

export const FAQ_PATH = '/preguntas-frecuentes'

// Mismos límites que las restricciones de faq_sections y faq_questions (cambiar ambos juntos).
export const SECTION_TITLE_MIN = 3
export const SECTION_TITLE_MAX = 80
export const QUESTION_MIN = 10
export const QUESTION_MAX = 200
export const ANSWER_MIN = 10
export const ANSWER_MAX = 4000
export const SLUG_MAX = 80

// Ancla de una pregunta (/preguntas-frecuentes#pregunta-12): al abrir el enlace, queda desplegada.
export const QUESTION_ANCHOR_PREFIX = 'pregunta-'
export const questionAnchor = (id: number) => `${QUESTION_ANCHOR_PREFIX}${id}`

export function questionIdFromHash(hash: string): number | null {
  const match = new RegExp(`^#?${QUESTION_ANCHOR_PREFIX}(\\d+)$`).exec(hash)
  return match ? Number(match[1]) : null
}

// Ancla de una sección, generada del título al crearla (no cambia al renombrarla): minúsculas sin
// tildes, números y guiones. Si ya existe, se le agrega -2, -3…
export function sectionSlug(title: string, taken: Iterable<string> = []): string {
  const base =
    title
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX - 4)
      .replace(/-+$/, '') || 'seccion'
  // Una sección no puede tomar la forma de las anclas de las preguntas.
  const safe = base.startsWith(QUESTION_ANCHOR_PREFIX) ? `seccion-${base}`.slice(0, SLUG_MAX - 4) : base
  const used = new Set(taken)
  if (!used.has(safe)) return safe
  let n = 2
  while (used.has(`${safe}-${n}`)) n += 1
  return `${safe}-${n}`
}

// Secciones en orden con sus preguntas en orden. Sin keepEmpty, quita las secciones vacías (así las
// muestra la página pública).
export function groupFaq<Q extends FaqQuestion>(
  sections: FaqSection[],
  questions: Q[],
  { keepEmpty = false }: { keepEmpty?: boolean } = {},
): FaqGroup<Q>[] {
  const byPosition = <T extends { position: number; id: number }>(a: T, b: T) => a.position - b.position || a.id - b.id
  return [...sections]
    .sort(byPosition)
    .map((section) => ({
      section,
      questions: questions.filter((question) => question.section_id === section.id).sort(byPosition),
    }))
    .filter((group) => keepEmpty || group.questions.length > 0)
}
