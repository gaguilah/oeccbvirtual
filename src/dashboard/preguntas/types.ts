import type { FaqQuestion } from '../../components/faq/types'

// Lo que el dashboard lee de faq_questions (grants de authenticated).
export type AdminFaqQuestion = FaqQuestion & {
  is_published: boolean
  created_at: string
  updated_at: string
}
