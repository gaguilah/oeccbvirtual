import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { dashboardLinks } from '../navigation'
import { useProfile } from '../profile'
import DashboardSectionCard from './DashboardSectionCard'

const sections = dashboardLinks.filter((link) => !link.end && link.group !== 'account')

// Inicio del dashboard: saludo y un acceso por cada sección del menú.
export default function DashboardHome() {
  useDocumentMeta({ title: 'Dashboard', noindex: true })
  const { displayName, loading } = useProfile()

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{loading ? 'Hola' : `Hola, ${displayName}`}</h2>
        <p className="text-sm text-on-surface-variant sm:text-base">Elija una sección para empezar.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {sections.map((link) => (
          <li key={link.to}>
            <DashboardSectionCard link={link} />
          </li>
        ))}
      </ul>
    </div>
  )
}
