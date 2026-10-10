import { NavLink } from 'react-router-dom'
import { Badge, Tooltip } from '../../components/ui'
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

type ListProps = { links: DashboardLink[]; onNavigate?: () => void; disabled?: boolean; collapsed: boolean }

function LinkContent({ link, collapsed }: { link: DashboardLink; collapsed: boolean }) {
  if (collapsed)
    return (
      <>
        <span className="relative">
          <Icon paths={link.icon} />
          {!link.ready && (
            <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
          )}
        </span>
        <span className="sr-only">
          {link.label}
          {!link.ready && ' (pronto)'}
        </span>
      </>
    )
  return (
    <>
      <Icon paths={link.icon} />
      <span className="flex-1">{link.label}</span>
      {!link.ready && <Badge className="px-2 text-[0.625rem]">Pronto</Badge>}
    </>
  )
}

function LinkList({ links, onNavigate, disabled, collapsed }: ListProps) {
  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const item = disabled ? (
          <span
            aria-disabled="true"
            className={cn(
              itemBase,
              'cursor-not-allowed text-on-surface-variant opacity-50',
              collapsed && 'w-full justify-center px-0',
            )}
          >
            <LinkContent link={link} collapsed={collapsed} />
          </span>
        ) : (
          <NavLink
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={(state) => cn(linkClass(state), collapsed && 'w-full justify-center px-0')}
          >
            <LinkContent link={link} collapsed={collapsed} />
          </NavLink>
        )
        return (
          <li key={link.to}>
            {collapsed ? (
              <Tooltip label={link.ready ? link.label : `${link.label} · Pronto`} side="right" className="flex w-full">
                {item}
              </Tooltip>
            ) : (
              item
            )}
          </li>
        )
      })}
    </ul>
  )
}

type SidebarNavProps = {
  onNavigate?: () => void
  // Solo íconos (menú lateral comprimido).
  collapsed?: boolean
  className?: string
}

// Opciones del dashboard que el rol del usuario permite ver. onNavigate cierra el menú en celular.
// Con contraseña temporal pendiente, las opciones se muestran deshabilitadas.
export default function SidebarNav({ onNavigate, collapsed = false, className }: SidebarNavProps) {
  const { can, mustChangePassword } = useAccess()
  const main = mainLinks.filter((link) => can(link.permission))
  const admin = adminLinks.filter((link) => can(link.permission))

  return (
    <nav aria-label="Menú del dashboard" className={cn('space-y-6', className)}>
      <LinkList links={main} onNavigate={onNavigate} disabled={mustChangePassword} collapsed={collapsed} />
      {admin.length > 0 && (
        <div className="space-y-2">
          <h2
            className={cn(
              'px-3 font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant',
              collapsed && 'sr-only',
            )}
          >
            Administración
          </h2>
          <LinkList links={admin} onNavigate={onNavigate} disabled={mustChangePassword} collapsed={collapsed} />
        </div>
      )}
    </nav>
  )
}
