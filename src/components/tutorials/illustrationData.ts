// Datos de la ilustración de Tutoriales (decorativa). Ver docs/plan-tutoriales-ilustracion.md.
// Título, pasos y capturas salen de los datos reales de los tutoriales.
import { tutorials } from './data'

// Retraso del turno de cada tutorial en el ciclo de 18 s (3 s cada uno), en el orden de la página.
// Clases completas para que Tailwind las genere; si cambia la cantidad de tutoriales, ajustar
// esta lista y el ciclo (animate-illustration-cycle en index.css).
const CYCLE_DELAYS = [
  '[--illustration-delay:0s]',
  '[--illustration-delay:3s]',
  '[--illustration-delay:6s]',
  '[--illustration-delay:9s]',
  '[--illustration-delay:12s]',
  '[--illustration-delay:15s]',
]

// La tarjeta central recorre todos los tutoriales.
export const cycleTutorials = tutorials.slice(0, CYCLE_DELAYS.length).map((tutorial, index) => ({
  slug: tutorial.slug,
  delay: CYCLE_DELAYS[index],
  title: tutorial.title,
  steps: tutorial.steps.length,
  images: tutorial.steps.filter((step) => step.image).length,
}))

export const texts = {
  panel: 'Tutoriales',
  steps: 'Pasos',
  images: 'Capturas de apoyo',
  stepByStep: 'Paso a paso',
  withImages: 'Con capturas',
}
