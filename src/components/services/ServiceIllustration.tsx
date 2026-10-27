import type { ComponentType } from 'react'
import { cn } from '../../lib/cn'
import { AudienciasIllustration } from '../audiencias'
import PqrsIllustration from '../pqrs/PqrsIllustration'
import { RematesIllustration } from '../remates'
import SurveyIllustration from '../survey/SurveyIllustration'
import { TutorialsIllustration } from '../tutorials'

// La ilustración de la página de cada servicio, por su ruta.
const illustrations: Record<string, ComponentType<{ className?: string }>> = {
  '/avisos-remates': RematesIllustration,
  '/audiencias': AudienciasIllustration,
  '/pqrs': PqrsIllustration,
  '/encuesta': SurveyIllustration,
  '/tutoriales': TutorialsIllustration,
}

// Ilustración quieta (illustration-still) para la tarjeta del carrusel. Todas ocupan el mismo
// espacio de 512 × 400: la de Tutoriales (3:2) va centrada en él.
export default function ServiceIllustration({ to, className }: { to: string; className?: string }) {
  const Illustration = illustrations[to]
  if (!Illustration) return null
  return (
    <span className={cn('flex aspect-512/400 items-center', className)}>
      <Illustration className="illustration-still" />
    </span>
  )
}
