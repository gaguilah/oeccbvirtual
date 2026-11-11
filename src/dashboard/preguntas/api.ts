import { FAQ_IMAGE_BUCKET, imageFileName } from '../../components/faq/data'
import type { FaqSection } from '../../components/faq/types'
import { supabase } from '../../lib/supabase'
import { faqErrorMessage } from './data'
import type { AdminFaqQuestion } from './types'

const QUESTION_COLUMNS =
  'id, section_id, question, answer, position, image_path, image_alt, is_published, created_at, updated_at'

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

type QuestionWrite = {
  section_id: number
  question: string
  answer: string
  image_path: string | null
  image_alt: string | null
}

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

// Imagen de apoyo: se sube antes de guardar la pregunta, con un nombre nuevo (UUID). Devuelve el
// nombre del archivo en el bucket.
export async function uploadFaqImage(file: File): Promise<string> {
  const path = imageFileName(crypto.randomUUID(), file.type)
  const { error } = await supabase.storage
    .from(FAQ_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (error) throw new Error('No se pudo subir la imagen. Revise que sea PNG, JPG o WebP de hasta 2 MB.')
  return path
}

// Borra archivos que ya no usa ninguna pregunta (imagen reemplazada o quitada, pregunta eliminada,
// o pregunta que no se pudo guardar). Si falla, el archivo queda huérfano en el bucket pero nadie lo
// enlaza: no se muestra un error por eso.
export async function removeFaqImages(paths: (string | null | undefined)[]): Promise<void> {
  const list = paths.filter((path): path is string => Boolean(path))
  if (!list.length) return
  await supabase.storage
    .from(FAQ_IMAGE_BUCKET)
    .remove(list)
    .catch(() => undefined)
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
