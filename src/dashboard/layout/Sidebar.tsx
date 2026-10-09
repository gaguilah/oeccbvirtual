import { Link } from 'react-router-dom'
import { Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { Icon, icons } from '../ui'
import SidebarNav from './SidebarNav'
import SidebarUser from './SidebarUser'

// Contenido del menú lateral: usuario, opciones y "Ver sitio público". Es el mismo en escritorio
// (columna fija) y en celular (dentro de MobileSidebar). `collapsed` (solo escritorio): solo los
// íconos, con el texto en una leyenda a la derecha y para lectores de pantalla.
export default function Sidebar({
  onNavigate,
  collapsed = false,
  className,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  className?: string
}) {
  const site = (
    <Link
      to="/"
      onClick={onNavigate}
      className={cn(
        'flex min-h-10 items-center gap-3 rounded-md text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        collapsed ? 'w-full justify-center' : 'px-3',
      )}
    >
      <Icon paths={icons.globe} />
      <span className={collapsed ? 'sr-only' : undefined}>Ver sitio público</span>
    </Link>
  )

  return (
    <div
      className={cn('flex h-full flex-col gap-8 bg-surface-container-low py-6', collapsed ? 'px-3' : 'px-4', className)}
    >
      <SidebarUser collapsed={collapsed} className={collapsed ? undefined : 'px-2'} />
      {/* Comprimido sin scroll propio: el scroll recortaría las leyendas de la derecha. */}
      <SidebarNav
        onNavigate={onNavigate}
        collapsed={collapsed}
        className={cn('flex-1', !collapsed && 'overflow-y-auto')}
      />
      {collapsed ? (
        <Tooltip label="Ver sitio público" side="right" className="flex w-full">
          {site}
        </Tooltip>
      ) : (
        site
      )}
    </div>
  )
}
