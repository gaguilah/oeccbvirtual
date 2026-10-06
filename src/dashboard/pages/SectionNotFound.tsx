import { ButtonLink, EmptyState } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { DASHBOARD_HOME } from '../navigation'
import { Icon, icons } from '../ui'

// Subruta desconocida dentro del dashboard (p. ej. /dashboard/xyz).
export default function SectionNotFound() {
  useDocumentMeta({ title: 'Sección no encontrada · Dashboard', noindex: true })

  return (
    <EmptyState
      icon={<Icon paths={icons.question} />}
      title="Esta sección no existe"
      description="Revise la dirección o elija una opción del menú."
      action={
        <ButtonLink to={DASHBOARD_HOME} variant="secondary">
          Volver al inicio
        </ButtonLink>
      }
    />
  )
}
