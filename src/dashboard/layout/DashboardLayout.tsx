import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '../../components/ui'
import { NoAccess, useAccess } from '../access'
import { PROFILE_LINK } from '../navigation'
import MobileSidebar from './MobileSidebar'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const MOBILE_MENU_ID = 'dashboard-menu'

// Desde lg: menú lateral fijo a la izquierda (17 rem, alto completo) y a la derecha la Topbar con
// el contenido de la opción elegida debajo; solo el área derecha hace scroll. Bajo lg el menú se
// abre como panel (MobileSidebar) desde el botón de la Topbar. Ver docs/plan-dashboard.md.
// Antes, el acceso: sin rol o con la cuenta desactivada solo se ve NoAccess; con contraseña temporal
// pendiente, toda ruta lleva a Mi perfil (docs/plan-usuarios.md).
export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { loading, failed, allowed, mustChangePassword, reload } = useAccess()

  if (loading) return <PageLoader />
  if (failed) return <NoAccess reason="failed" onRetry={reload} />
  if (!allowed) return <NoAccess reason="blocked" />
  if (mustChangePassword && pathname !== PROFILE_LINK.to) return <Navigate to={PROFILE_LINK.to} replace />

  return (
    <div className="min-h-svh bg-surface text-on-surface lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-svh lg:block">
        <Sidebar />
      </aside>
      <MobileSidebar id={MOBILE_MENU_ID} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-col">
        <Topbar menuId={MOBILE_MENU_ID} menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
