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
  // Imagen de apoyo opcional (fase 2): nombre del archivo en el bucket faq-images y su texto
  // alternativo. Las dos o ninguna (faq_questions_image_pair_chk).
  image_path: string | null
  image_alt: string | null
}

export type FaqGroup<Q extends FaqQuestion = FaqQuestion> = {
  section: FaqSection
  questions: Q[]
}
