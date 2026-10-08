import { Route, Routes } from 'react-router-dom'
import { AccessProvider, RequirePermission } from './access'
import { ProtectedRoute } from './auth'
import { DashboardLayout } from './layout'
import { dashboardLinks, relativePath } from './navigation'
import { DashboardHome, ProfilePage, SectionNotFound, SectionPending } from './pages'
import { PermissionsPage } from './permisos'
import { ProfileProvider } from './profile'
import { CalendarPage } from './calendario'
import { SurveyEditorPage, SurveyQuestionsPage, SurveyResultsPage, SurveysPage } from './encuestas'
import { PqrsAdminPage, RequestDetailPage } from './pqrs'
import { FoldersPage, RematesAdminPage } from './remates'
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
          path="avisos-remates"
          element={
            <RequirePermission permission="remates.ver">
              <RematesAdminPage />
            </RequirePermission>
          }
        />
        <Route
          path="avisos-remates/carpetas"
          element={
            <RequirePermission permission="remates.carpetas">
              <FoldersPage />
            </RequirePermission>
          }
        />
        <Route
          path="pqrs"
          element={
            <RequirePermission permission="pqrs.ver">
              <PqrsAdminPage />
            </RequirePermission>
          }
        />
        <Route
          path="pqrs/:id"
          element={
            <RequirePermission permission="pqrs.ver">
              <RequestDetailPage />
            </RequirePermission>
          }
        />
        <Route
          path="encuestas"
          element={
            <RequirePermission permission="encuestas.ver">
              <SurveysPage />
            </RequirePermission>
          }
        />
        <Route
          path="encuestas/nueva"
          element={
            <RequirePermission permission="encuestas.gestionar">
              <SurveyEditorPage />
            </RequirePermission>
          }
        />
        <Route
          path="encuestas/:id"
          element={
            <RequirePermission permission="encuestas.ver">
              <SurveyResultsPage />
            </RequirePermission>
          }
        />
        <Route
          path="encuestas/:id/preguntas"
          element={
            <RequirePermission permission="encuestas.ver">
              <SurveyQuestionsPage />
            </RequirePermission>
          }
        />
        <Route
          path="encuestas/:id/editar"
          element={
            <RequirePermission permission="encuestas.gestionar">
              <SurveyEditorPage />
            </RequirePermission>
          }
        />
        <Route
          path="dias-no-habiles"
          element={
            <RequirePermission permission="calendario.ver">
              <CalendarPage />
            </RequirePermission>
          }
        />
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
        <Route
          path="permisos"
          element={
            <RequirePermission permission="permisos.ver">
              <PermissionsPage />
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
