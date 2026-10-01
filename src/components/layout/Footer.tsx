import { Link } from 'react-router-dom'
import { CONTACT_ADDRESS, CONTACT_CITY, CONTACT_EMAIL } from '../../lib/contact'
import Container from './Container'

const services = [
  { to: '/remates', label: 'Avisos de Remate' },
  { to: '/pqrs', label: 'PQRS' },
  { to: '/encuesta', label: 'Encuesta' },
  { to: '/tutoriales', label: 'Tutoriales' },
]

// Aún no tienen página propia; se muestran como texto.
const courts = ['Juzgado 1', 'Juzgado 2']

function ColumnTitle({ children }: { children: string }) {
  return <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface">{children}</h2>
}

// Sin líneas divisorias: las zonas se separan con cambios de fondo (surface-container-low → surface-container).
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface-container-low text-sm text-on-surface-variant">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div className="space-y-4 sm:col-span-2">
          <p className="font-display text-xl font-extrabold tracking-[-0.02em] text-on-surface">OECCB</p>
          <p className="max-w-sm">
            Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga
          </p>
          <address className="space-y-1 not-italic">
            <p>
              {CONTACT_ADDRESS} · {CONTACT_CITY}
            </p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label="Servicios" className="space-y-4">
          <ColumnTitle>Servicios</ColumnTitle>
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service.to}>
                <Link to={service.to} className="hover:text-on-surface">
                  {service.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          <ColumnTitle>Juzgados</ColumnTitle>
          <ul className="space-y-2">
            {courts.map((court) => (
              <li key={court}>{court}</li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="bg-surface-container">
        <Container className="py-5 text-center text-xs sm:text-left">
          © {year} OECCB · Rama Judicial
        </Container>
      </div>
    </footer>
  )
}
