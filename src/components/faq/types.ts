// Preguntas frecuentes (tablas faq_sections y faq_questions, migración 20261110120000_faq.sql).

export type FaqSection = {
  id: number
  slug: string
  title: string
  position: number
}

// Columnas que el público puede leer.
export type FaqQuestion = {
  id: number
  section_id: number
  question: string
  answer: string
  position: number
}

export type FaqGroup<Q extends FaqQuestion = FaqQuestion> = {
  section: FaqSection
  questions: Q[]
}
