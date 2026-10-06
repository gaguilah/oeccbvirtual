import { useLocation } from 'react-router-dom'
import { ButtonLink, EmptyState } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { DASHBOARD_HOME, linkForPath } from '../navigation'
import { Icon, icons } from '../ui'

// Página de una sección que aún no está construida (ready: false en navigation/links.ts).
export default function SectionPending() {
  const { pathname } = useLocation()
  const link = linkForPath(pathname)
  useDocumentMeta({ title: link ? `${link.label} · Dashboard` : 'Dashboard', noindex: true })

  return (
    <EmptyState
      icon={<Icon paths={icons.wrench} />}
      title="Esta sección está en construcción"
      description={link ? `${link.description} Estará disponible próximamente.` : undefined}
      action={
        <ButtonLink to={DASHBOARD_HOME} variant="secondary">
          Volver al inicio
        </ButtonLink>
      }
    />
  )
}
