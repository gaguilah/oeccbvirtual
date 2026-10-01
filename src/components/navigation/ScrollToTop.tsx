import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// BrowserRouter no restablece el scroll al navegar: al cambiar de ruta, volver al inicio de la página.
// Solo reacciona al pathname, así que los cambios de query (?) o de ancla (#) no mueven la página.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
