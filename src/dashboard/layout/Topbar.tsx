import { useLocation } from 'react-router-dom'
import { Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { linkForPath } from '../navigation'
import { Icon, icons } from '../ui'
import TopbarActions from './TopbarActions'

type TopbarProps = {
  menuId: string
  menuOpen: boolean
  onOpenMenu: () => void
  sidebarId: string
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  className?: string
}

// Encabezado del área derecha: botón del menú (bajo lg abre el panel; desde lg comprime o expande
// el menú lateral), título de la sección y acciones.
// Fondo translúcido con desenfoque para que el contenido pase por debajo, sin línea divisoria.
export default function Topbar({
  menuId,
  menuOpen,
  onOpenMenu,
  sidebarId,
  sidebarCollapsed,
  onToggleSidebar,
  className,
}: TopbarProps) {
  const toggleLabel = sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'
  const { pathname } = useLocation()
  const title = linkForPath(pathname)?.label ?? 'Sección no encontrada'

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex min-h-16 items-center gap-3 bg-surface/80 px-4 backdrop-blur sm:px-6 lg:px-8',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        aria-controls={menuId}
        aria-expanded={menuOpen}
        className="-ml-2 rounded-md p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
      >
        <Icon paths={icons.menu} className="size-6" />
      </button>
      <Tooltip label={toggleLabel} className="-ml-2 hidden lg:inline-flex">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={toggleLabel}
          aria-controls={sidebarId}
          aria-expanded={!sidebarCollapsed}
          className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon paths={sidebarCollapsed ? icons.expand : icons.collapse} className="size-5" />
        </button>
      </Tooltip>
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold sm:text-xl">{title}</h1>
      <TopbarActions />
    </header>
  )
}
