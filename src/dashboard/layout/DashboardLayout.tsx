import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '../../components/ui'
import { NoAccess, useAccess } from '../access'
import { PROFILE_LINK } from '../navigation'
import { cn } from '../../lib/cn'
import MobileSidebar from './MobileSidebar'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebarCollapsed } from './sidebarState'

const MOBILE_MENU_ID = 'dashboard-menu'
const SIDEBAR_ID = 'dashboard-sidebar'

// Desde lg: menú lateral fijo a la izquierda (17 rem, o 4.5 rem comprimido con el botón de la
// Topbar; la elección se recuerda) y a la derecha la Topbar con
// el contenido de la opción elegida debajo; solo el área derecha hace scroll. Bajo lg el menú se
// abre como panel (MobileSidebar) desde el botón de la Topbar. Ver docs/plan-dashboard.md.
// Antes, el acceso: sin rol o con la cuenta desactivada solo se ve NoAccess; con contraseña temporal
// pendiente, toda ruta lleva a Mi perfil (docs/plan-usuarios.md).
export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { collapsed, toggle } = useSidebarCollapsed()
  const { pathname } = useLocation()
  const { loading, failed, allowed, mustChangePassword, reload } = useAccess()

  if (loading) return <PageLoader />
  if (failed) return <NoAccess reason="failed" onRetry={reload} />
  if (!allowed) return <NoAccess reason="blocked" />
  if (mustChangePassword && pathname !== PROFILE_LINK.to) return <Navigate to={PROFILE_LINK.to} replace />

  return (
    <div
      className={cn(
        'min-h-svh bg-surface text-on-surface lg:grid motion-safe:lg:transition-[grid-template-columns] motion-safe:lg:duration-200',
        collapsed ? 'lg:grid-cols-[4.5rem_1fr]' : 'lg:grid-cols-[17rem_1fr]',
      )}
    >
      {/* z-20: las leyendas del menú comprimido pasan por encima de la Topbar (z-10). Expandido, el
          contenido ya tiene su ancho final (17 rem) y el aside lo recorta mientras crece, así los textos no
          se acomodan en columnas angostas durante la transición. */}
      <aside id={SIDEBAR_ID} className={cn('sticky top-0 z-20 hidden h-svh lg:block', !collapsed && 'overflow-hidden')}>
        <Sidebar collapsed={collapsed} className={collapsed ? undefined : 'w-68'} />
      </aside>
      <MobileSidebar id={MOBILE_MENU_ID} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-col">
        <Topbar
          menuId={MOBILE_MENU_ID}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          sidebarId={SIDEBAR_ID}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggle}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
