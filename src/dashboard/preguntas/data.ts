import { DASHBOARD_HOME } from '../navigation/links'

// Preguntas frecuentes en el dashboard (docs/plan-preguntas-frecuentes.md).
export const FAQ_ADMIN_PATH = `${DASHBOARD_HOME}/preguntas-frecuentes`
export const FAQ_SECTIONS_PATH = `${FAQ_ADMIN_PATH}/secciones`

// Errores de la base de datos (restricciones, políticas, move_faq_*) → español.
export function faqErrorMessage(error: { message?: string; code?: string } | null, fallback: string): string {
  const message = error?.message ?? ''
  const code = error?.code ?? ''
  if (code === '23503') return 'La sección tiene preguntas: muévalas a otra sección o elimínelas primero.'
  if (code === '23505') return 'Ya existe una sección con un nombre parecido. Use otro nombre.'
  if (code === '23514') return 'Revise el texto: no cumple la longitud permitida.'
  if (code === '42501' || message.includes('preguntas_gestionar_required'))
    return 'No tiene permiso para gestionar las preguntas frecuentes.'
  if (message.includes('faq_not_found')) return 'El elemento ya no existe. Actualice la página.'
  return fallback
}
