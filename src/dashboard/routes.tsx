import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth'
import { DashboardLayout } from './layout'
import { dashboardLinks, relativePath } from './navigation'
import { DashboardHome, ProfilePage, SectionNotFound, SectionPending } from './pages'
import { ProfileProvider } from './profile'

// Secciones sin construir: su ruta muestra SectionPending. Al construir una, se le da su propia
// <Route> abajo y se marca ready: true en navigation/links.ts.
const pendingSections = dashboardLinks.filter((link) => !link.ready)

// Rutas anidadas bajo /dashboard/*. ProtectedRoute envuelve el layout una sola vez, así toda
// subruta queda protegida.
export default function DashboardRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <ProfileProvider>
              <DashboardLayout />
            </ProfileProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="perfil" element={<ProfilePage />} />
        {pendingSections.map((link) => (
          <Route key={link.to} path={relativePath(link)} element={<SectionPending />} />
        ))}
        <Route path="*" element={<SectionNotFound />} />
      </Route>
    </Routes>
  )
}
