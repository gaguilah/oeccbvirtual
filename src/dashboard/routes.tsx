import { Route, Routes } from 'react-router-dom'
import { AccessProvider, RequirePermission } from './access'
import { ProtectedRoute } from './auth'
import { DashboardLayout } from './layout'
import { dashboardLinks, relativePath } from './navigation'
import { DashboardHome, ProfilePage, SectionNotFound, SectionPending } from './pages'
import { ProfileProvider } from './profile'
import { RoleEditorPage, RolesPage } from './roles'
import { UsersPage } from './usuarios'

// Secciones sin construir: su ruta muestra SectionPending. Al construir una, se le da su propia
// <Route> abajo y se marca ready: true en navigation/links.ts.
const pendingSections = dashboardLinks.filter((link) => !link.ready)

// Rutas anidadas bajo /dashboard/*. ProtectedRoute envuelve el layout una sola vez, así toda
// subruta queda protegida; RequirePermission comprueba el permiso de cada sección.
export default function DashboardRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <ProfileProvider>
              <AccessProvider>
                <DashboardLayout />
              </AccessProvider>
            </ProfileProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route
          path="usuarios"
          element={
            <RequirePermission permission="usuarios.ver">
              <UsersPage />
            </RequirePermission>
          }
        />
        <Route
          path="roles"
          element={
            <RequirePermission permission="roles.ver">
              <RolesPage />
            </RequirePermission>
          }
        />
        <Route
          path="roles/:id"
          element={
            <RequirePermission permission="roles.ver">
              <RoleEditorPage />
            </RequirePermission>
          }
        />
        {pendingSections.map((link) => (
          <Route
            key={link.to}
            path={relativePath(link)}
            element={
              <RequirePermission permission={link.permission}>
                <SectionPending />
              </RequirePermission>
            }
          />
        ))}
        <Route path="*" element={<SectionNotFound />} />
      </Route>
    </Routes>
  )
}
