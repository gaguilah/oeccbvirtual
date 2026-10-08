import type { QuestionDraft, QuestionType, SurveyQuestion } from './types'

export const SURVEYS_PATH = '/dashboard/encuestas'

export const surveyPath = (id: string) => `${SURVEYS_PATH}/${id}`

export const QUESTION_TYPES: Record<QuestionType, { label: string; description: string }> = {
  yes_no: { label: 'Sí / no', description: 'El ciudadano elige "Sí" o "No".' },
  scale: { label: 'Escala', description: 'El ciudadano elige un número, p. ej. de 1 a 5.' },
}

// Límites de la base de datos (survey_questions_scale_chk y save_survey).
export const SCALE_LIMITS = { min: 0, max: 10 }
export const MAX_QUESTIONS = 30

export function questionTypeLabel(question: { type: string; scale_min: number | null; scale_max: number | null }) {
  if (question.type === 'scale') return `Escala ${question.scale_min}–${question.scale_max}`
  return QUESTION_TYPES[question.type as QuestionType]?.label ?? question.type
}

function slug(text: string, separator: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
}

// Código de la encuesta a partir del título: "Atención presencial 2027" → "atencion-presencial-2027".
// Cumple surveys_code_format y no cambia después de crearla.
export function surveyCode(title: string): string {
  return slug(title, '-').slice(0, 60).replace(/-+$/, '')
}

// Código libre a partir de `base` que no esté en `taken` (base, base-2, base-3…).
export function uniqueCode(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

// Códigos de las preguntas nuevas, únicos dentro de la encuesta; las guardadas conservan el suyo.
export function withQuestionCodes(questions: QuestionDraft[]): QuestionDraft[] {
  const taken = new Set(questions.filter((q) => q.code).map((q) => q.code))
  return questions.map((question) => {
    if (question.code) return question
    const code = uniqueCode(slug(question.text, '_').slice(0, 40).replace(/_+$/, '') || 'pregunta', taken)
    taken.add(code)
    return { ...question, code }
  })
}

let nextKey = 0
export const newKey = () => `q${++nextKey}`

export const EMPTY_QUESTION: Omit<QuestionDraft, 'key'> = {
  code: '',
  text: '',
  help_text: '',
  type: 'yes_no',
  scale_min: 1,
  scale_max: 5,
  min_label: '',
  max_label: '',
  is_required: true,
}

export function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString('es-CO')} ${count === 1 ? one : many}`
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

// Borrador del editor → pregunta con la forma de la base de datos (vista previa).
export function draftToQuestion(draft: QuestionDraft, position: number): SurveyQuestion {
  const scale = draft.type === 'scale'
  return {
    id: draft.id ?? draft.key,
    code: draft.code,
    position,
    text: draft.text.trim() || 'Pregunta sin texto',
    help_text: draft.help_text.trim() || null,
    type: draft.type,
    scale_min: scale ? draft.scale_min : null,
    scale_max: scale ? draft.scale_max : null,
    min_label: scale ? draft.min_label.trim() : null,
    max_label: scale ? draft.max_label.trim() : null,
    is_required: draft.is_required,
  }
}
