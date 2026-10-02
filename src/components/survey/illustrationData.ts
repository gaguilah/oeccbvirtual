// Datos de la ilustración de la Encuesta (decorativa, textos fijos). Ver docs/plan-encuesta-ilustracion.md.
// Muestra una respuesta de ejemplo, nunca resultados ni promedios.

export const STAR_COUNT = 5

// Retraso de cada estrella llena (se llenan una por una). Clases completas para Tailwind.
export const starDelays = [
  '[animation-delay:600ms]',
  '[animation-delay:750ms]',
  '[animation-delay:900ms]',
  '[animation-delay:1050ms]',
  '[animation-delay:1200ms]',
]

export const texts = {
  questionsPanel: 'Preguntas',
  yesNoCard: 'Pregunta 2 de 5',
  yesNoQuestion: '¿Encontró la información que buscaba?',
  yes: 'Sí',
  no: 'No',
  mainPanel: 'Encuesta de satisfacción',
  ratingCard: 'Califique la atención',
  progress: 'Pregunta 3 de 5',
  minLabel: 'Muy insatisfecho',
  maxLabel: 'Muy satisfecho',
  tooltip: 'Excelente',
  reviewCard: 'Revise sus respuestas',
  reviewInfo: 'Información encontrada',
  reviewRating: 'Calificación de la atención',
  edit: 'Editar',
  captcha: 'Verificación de seguridad',
  sent: 'Enviada',
}
