import { EmptyState } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { dashboardLinks } from '../navigation'
import { useProfile } from '../profile'
import DashboardSectionCard from './DashboardSectionCard'

const sections = dashboardLinks.filter((link) => !link.end && link.group !== 'account')

// Inicio del dashboard: saludo y un acceso por cada sección que el rol del usuario permite ver.
export default function DashboardHome() {
  useDocumentMeta({ title: 'Dashboard', noindex: true })
  const { displayName, loading } = useProfile()
  const { can } = useAccess()
  const visible = sections.filter((link) => can(link.permission))

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{loading ? 'Hola' : `Hola, ${displayName}`}</h2>
        <p className="text-sm text-on-surface-variant sm:text-base">Elija una sección para empezar.</p>
      </div>
      {visible.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {visible.map((link) => (
            <li key={link.to}>
              <DashboardSectionCard link={link} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no tiene secciones asignadas"
          description="Las verá aquí cuando un administrador le dé permisos."
        />
      )}
    </div>
  )
}
