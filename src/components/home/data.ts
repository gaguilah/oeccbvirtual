// Textos de la ilustración del hero (decorativa, datos fijos). Ver docs/plan-hero.md.
import { tutorials } from '../tutorials'

// Tutoriales que aparecen en la tarjeta, por slug. Título y pasos salen de sus datos.
const TUTORIAL_SLUGS = ['publicaciones-procesales', 'estados', 'realizacion-audiencias']

export const heroTutorials = TUTORIAL_SLUGS.flatMap((slug) => {
  const index = tutorials.findIndex((tutorial) => tutorial.slug === slug)
  if (index === -1) return []
  const tutorial = tutorials[index]
  return [{ number: index + 1, title: tutorial.title, steps: tutorial.steps.length }]
})

export const heroPqrs = {
  title: 'PQRS',
  row: 'Solicitud radicada',
  status: 'Recibida',
  hint: 'Respuesta al correo registrado',
}

export const heroPublications = {
  panel: 'Publicaciones procesales',
  title: 'Juzgados de ejecución',
  rows: ['Estados', 'Traslados', 'Edictos'],
  status: 'Publicado',
}
