import type { ReactNode } from 'react'
import { ButtonLink, EmptyState } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { DASHBOARD_HOME } from '../navigation/links'
import { Icon, icons } from '../ui'
import { useAccess } from './access'

function NoPermission() {
  useDocumentMeta({ title: 'Sin acceso · Dashboard', noindex: true })
  return (
    <EmptyState
      icon={<Icon paths={icons.lock} />}
      title="No tiene acceso a esta sección"
      description="Si cree que debería tenerlo, comuníquese con un administrador."
      action={
        <ButtonLink to={DASHBOARD_HOME} variant="secondary">
          Volver al inicio
        </ButtonLink>
      }
    />
  )
}

// Protege una ruta de sección aunque se escriba la dirección a mano. Sin `permission`, deja pasar.
export default function RequirePermission({ permission, children }: { permission?: string; children: ReactNode }) {
  const { can } = useAccess()
  return can(permission) ? <>{children}</> : <NoPermission />
}
