import { NavLink } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useAccess } from '../access'
import { dashboardLinks, type DashboardLink } from '../navigation'
import { Icon } from '../ui'

const mainLinks = dashboardLinks.filter((link) => link.group === 'main')
const adminLinks = dashboardLinks.filter((link) => link.group === 'admin')

const itemBase = 'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors'

// Activo con fondo tonal, como mobileLinkClass del sitio público.
function linkClass({ isActive }: { isActive: boolean }) {
  return cn(
    itemBase,
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    isActive
      ? 'bg-surface-container text-on-surface'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  )
}

type ListProps = { links: DashboardLink[]; onNavigate?: () => void; disabled?: boolean }

function LinkContent({ link }: { link: DashboardLink }) {
  return (
    <>
      <Icon paths={link.icon} />
      <span className="flex-1">{link.label}</span>
      {!link.ready && <Badge className="px-2 text-[0.625rem]">Pronto</Badge>}
    </>
  )
}

function LinkList({ links, onNavigate, disabled }: ListProps) {
  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.to}>
          {disabled ? (
            <span
              aria-disabled="true"
              className={cn(itemBase, 'cursor-not-allowed text-on-surface-variant opacity-50')}
            >
              <LinkContent link={link} />
            </span>
          ) : (
            <NavLink to={link.to} end={link.end} onClick={onNavigate} className={linkClass}>
              <LinkContent link={link} />
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  )
}

type SidebarNavProps = {
  onNavigate?: () => void
  className?: string
}

// Opciones del dashboard que el rol del usuario permite ver. onNavigate cierra el menú en celular.
// Con contraseña temporal pendiente, las opciones se muestran deshabilitadas.
export default function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const { can, mustChangePassword } = useAccess()
  const main = mainLinks.filter((link) => can(link.permission))
  const admin = adminLinks.filter((link) => can(link.permission))

  return (
    <nav aria-label="Menú del dashboard" className={cn('space-y-6', className)}>
      <LinkList links={main} onNavigate={onNavigate} disabled={mustChangePassword} />
      {admin.length > 0 && (
        <div className="space-y-2">
          <h2 className="px-3 font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Administración
          </h2>
          <LinkList links={admin} onNavigate={onNavigate} disabled={mustChangePassword} />
        </div>
      )}
    </nav>
  )
}
