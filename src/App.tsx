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
        <Route path="/remates" element={<Remates />} />
        <Route path="/pqrs" element={<Pqrs />} />
        <Route path="/encuesta" element={<Encuesta />} />
        <Route path="/tutoriales" element={<Tutoriales />} />
        <Route path="/tutoriales/:slug" element={<Tutorial />} />
        <Route path="/contacto" element={<Contacto />} />
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