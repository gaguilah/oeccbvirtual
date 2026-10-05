import { NavLink } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { cn } from '../../lib/cn'
import { dashboardLinks, type DashboardLink } from '../navigation'
import { Icon } from '../ui'

const mainLinks = dashboardLinks.filter((link) => link.group === 'main')
const adminLinks = dashboardLinks.filter((link) => link.group === 'admin')

// Activo con fondo tonal, como mobileLinkClass del sitio público.
function linkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    isActive
      ? 'bg-surface-container text-on-surface'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  )
}

function LinkList({ links, onNavigate }: { links: DashboardLink[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.to}>
          <NavLink to={link.to} end={link.end} onClick={onNavigate} className={linkClass}>
            <Icon paths={link.icon} />
            <span className="flex-1">{link.label}</span>
            {!link.ready && <Badge className="px-2 text-[0.625rem]">Pronto</Badge>}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

// Opciones del dashboard. onNavigate cierra el menú en celular al elegir una opción.
export default function SidebarNav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  return (
    <nav aria-label="Menú del dashboard" className={cn('space-y-6', className)}>
      <LinkList links={mainLinks} onNavigate={onNavigate} />
      {adminLinks.length > 0 && (
        <div className="space-y-2">
          <h2 className="px-3 font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Administración
          </h2>
          <LinkList links={adminLinks} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  )
}
