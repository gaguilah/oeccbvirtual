// Datos de la ilustración de la página 404 (decorativa). Ver docs/plan-404.md.
import { mainLinks } from '../navigation'

// Rutas reales que se muestran "en línea" en el panel izquierdo (las primeras del menú).
export const siteRoutes = mainLinks.slice(0, 4).map((link) => link.to)

export const texts = {
  routesPanel: 'Rutas del sitio',
  routesCard: 'Rutas',
  browserPanel: 'Navegador',
  browserCard: 'Dirección',
  notFound: 'Sin resultados',
  missing: 'No existe',
  goHome: 'Ir al inicio',
  services: 'Ver servicios',
}
