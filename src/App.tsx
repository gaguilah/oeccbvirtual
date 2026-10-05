import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/auth'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Remates from './pages/Remates'
import Pqrs from './pages/Pqrs'
import Encuesta from './pages/Encuesta'
import Tutoriales from './pages/Tutoriales'
import Tutorial from './pages/Tutorial'
import Contacto from './pages/Contacto'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import { ScrollToTop } from './components/navigation'
import { Spinner } from './components/ui'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-primary">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/avisos-remates" element={<Remates />} />
        <Route path="/remates" element={<Navigate to="/avisos-remates" replace />} />
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
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
