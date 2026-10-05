import { useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { linkForPath } from '../navigation'
import { Icon, icons } from '../ui'
import TopbarActions from './TopbarActions'

type TopbarProps = {
  menuId: string
  menuOpen: boolean
  onOpenMenu: () => void
  className?: string
}

// Encabezado del área derecha: botón del menú (solo bajo lg), título de la sección y acciones.
// Fondo translúcido con desenfoque para que el contenido pase por debajo, sin línea divisoria.
export default function Topbar({ menuId, menuOpen, onOpenMenu, className }: TopbarProps) {
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
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold sm:text-xl">{title}</h1>
      <TopbarActions />
    </header>
  )
}
