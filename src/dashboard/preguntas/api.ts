import type { FaqSection } from '../../components/faq/types'
import { supabase } from '../../lib/supabase'
import { faqErrorMessage } from './data'
import type { AdminFaqQuestion } from './types'

const QUESTION_COLUMNS = 'id, section_id, question, answer, position, is_published, created_at, updated_at'

const fail = (error: { message?: string; code?: string } | null, fallback: string) =>
  new Error(faqErrorMessage(error, fallback))

export async function fetchFaqAdmin(): Promise<{ sections: FaqSection[]; questions: AdminFaqQuestion[] }> {
  const [sections, questions] = await Promise.all([
    supabase.from('faq_sections').select('id, slug, title, position').order('position'),
    supabase.from('faq_questions').select(QUESTION_COLUMNS).order('position'),
  ])
  if (sections.error) throw fail(sections.error, 'No se pudieron cargar las secciones.')
  if (questions.error) throw fail(questions.error, 'No se pudieron cargar las preguntas.')
  return { sections: sections.data as FaqSection[], questions: questions.data as AdminFaqQuestion[] }
}

type QuestionWrite = { section_id: number; question: string; answer: string }

// Nace oculta: se publica desde el menú de la pregunta.
export async function createQuestion(input: QuestionWrite): Promise<number> {
  const { data, error } = await supabase
    .from('faq_questions')
    .insert({ ...input, is_published: false })
    .select('id')
    .single()
  if (error) throw fail(error, 'No se pudo crear la pregunta.')
  return data.id as number
}

export async function updateQuestion(
  id: number,
  patch: Partial<QuestionWrite> & { is_published?: boolean },
): Promise<void> {
  const { data, error } = await supabase.from('faq_questions').update(patch).eq('id', id).select('id')
  if (error) throw fail(error, 'No se pudo guardar la pregunta.')
  if (!data.length) throw new Error('La pregunta ya no existe o no tiene permiso para editarla.')
}

export async function deleteQuestion(id: number): Promise<void> {
  const { data, error } = await supabase.from('faq_questions').delete().eq('id', id).select('id')
  if (error) throw fail(error, 'No se pudo eliminar la pregunta.')
  if (!data.length) throw new Error('La pregunta ya no existe o no tiene permiso para eliminarla.')
}

export async function moveQuestion(id: number, up: boolean): Promise<void> {
  const { error } = await supabase.rpc('move_faq_question', { p_id: id, p_up: up })
  if (error) throw fail(error, 'No se pudo cambiar el orden.')
}

export async function createSection(input: { title: string; slug: string }): Promise<number> {
  const { data, error } = await supabase.from('faq_sections').insert(input).select('id').single()
  if (error) throw fail(error, 'No se pudo crear la sección.')
  return data.id as number
}

export async function renameSection(id: number, title: string): Promise<void> {
  const { data, error } = await supabase.from('faq_sections').update({ title }).eq('id', id).select('id')
  if (error) throw fail(error, 'No se pudo renombrar la sección.')
  if (!data.length) throw new Error('La sección ya no existe o no tiene permiso para editarla.')
}

export async function deleteSection(id: number): Promise<void> {
  const { data, error } = await supabase.from('faq_sections').delete().eq('id', id).select('id')
  if (error) throw fail(error, 'No se pudo eliminar la sección.')
  if (!data.length) throw new Error('La sección ya no existe o no tiene permiso para eliminarla.')
}

export async function moveSection(id: number, up: boolean): Promise<void> {
  const { error } = await supabase.rpc('move_faq_section', { p_id: id, p_up: up })
  if (error) throw fail(error, 'No se pudo cambiar el orden.')
}
