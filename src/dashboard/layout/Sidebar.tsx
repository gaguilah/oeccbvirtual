import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon, icons } from '../ui'
import SidebarNav from './SidebarNav'
import SidebarUser from './SidebarUser'

// Contenido del menú lateral: usuario, opciones y "Ver sitio público". Es el mismo en escritorio
// (columna fija) y en celular (dentro de MobileSidebar).
export default function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  return (
    <div className={cn('flex h-full flex-col gap-8 bg-surface-container-low px-4 py-6', className)}>
      <SidebarUser className="px-2" />
      <SidebarNav onNavigate={onNavigate} className="flex-1 overflow-y-auto" />
      <Link
        to="/"
        onClick={onNavigate}
        className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon paths={icons.globe} />
        Ver sitio público
      </Link>
    </div>
  )
}
