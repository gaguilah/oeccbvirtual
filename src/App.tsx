import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Remates from './pages/Remates'
import Audiencias from './pages/Audiencias'
import Pqrs from './pages/Pqrs'
import Encuesta from './pages/Encuesta'
import Tutoriales from './pages/Tutoriales'
import Tutorial from './pages/Tutorial'
import Contacto from './pages/Contacto'
import NotFound from './pages/NotFound'
import { ScrollToTop } from './components/navigation'
import { PageLoader } from './components/ui'

// El dashboard (src/dashboard) se descarga solo al entrar: el sitio público no lo incluye.
const DashboardRoutes = lazy(() => import('./dashboard'))

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/avisos-remates" element={<Remates />} />
        <Route path="/remates" element={<Navigate to="/avisos-remates" replace />} />
        <Route path="/audiencias" element={<Audiencias />} />
        <Route path="/pqrs" element={<Pqrs />} />
        <Route path="/encuesta" element={<Encuesta />} />
        <Route path="/tutoriales" element={<Tutoriales />} />
        <Route path="/tutoriales/:slug" element={<Tutorial />} />
        <Route path="/contacto" element={<Contacto />} />
        {/* Cualquier otra dirección: página 404 (Netlify entrega la app para toda ruta: public/_redirects). */}
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Mismo encabezado, sin footer. */}
      <Route element={<PublicLayout footer={false} />}>
        <Route path="/login" element={<Login />} />
      </Route>
      {/* Área privada: rutas, protección y layout propios en src/dashboard. */}
      <Route
        path="/dashboard/*"
        element={
          <Suspense fallback={<PageLoader />}>
            <DashboardRoutes />
          </Suspense>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
