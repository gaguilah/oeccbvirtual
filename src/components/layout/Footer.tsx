import { Link } from 'react-router-dom'
import {
  CONTACT_ADDRESS,
  CONTACT_CITY,
  CONTACT_DAYS,
  CONTACT_DEPARTMENT,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_HOURS_NOTE,
  OFFICE_NAME,
} from '../../lib/contact'
import { COURTS, courtPublicationsUrl } from '../../lib/courts'
import Container from './Container'
import FooterGlow from './FooterGlow'

const services = [
  { to: '/avisos-remates', label: 'Avisos de Remate' },
  { to: '/pqrs', label: 'PQRS' },
  { to: '/encuesta', label: 'Encuesta' },
  { to: '/tutoriales', label: 'Tutoriales' },
]

function ColumnTitle({ children, id }: { children: string; id?: string }) {
  return (
    <h2 id={id} className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface">
      {children}
    </h2>
  )
}

// Sin líneas divisorias: las zonas se separan con espacio y cambios de fondo. Fila 1: OECCB y
// Servicios. Fila 2: enlaces a las publicaciones de los juzgados, uno debajo del otro. Detrás de
// todo, la luz en movimiento (FooterGlow). Ver docs/plan-footer.md.
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative isolate overflow-hidden bg-surface-container-low text-sm text-on-surface-variant">
      <FooterGlow />

      <Container className="relative space-y-12 py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <p className="font-display text-xl font-extrabold tracking-[-0.02em] text-on-surface">OECCB</p>
            <p className="max-w-sm">{OFFICE_NAME}</p>
            <address className="space-y-1 not-italic">
              <p>
                {CONTACT_ADDRESS} · {CONTACT_CITY}, {CONTACT_DEPARTMENT}
              </p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </address>
            <p>
              {CONTACT_DAYS}: {CONTACT_HOURS} · {CONTACT_HOURS_NOTE}
            </p>
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
        </div>

        <nav aria-labelledby="footer-courts-title" className="space-y-4">
          <ColumnTitle id="footer-courts-title">Publicaciones de los juzgados</ColumnTitle>
          <ul className="space-y-3">
            {COURTS.map((court) => (
              <li key={court.despacho}>
                <a
                  href={courtPublicationsUrl(court.despacho)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-on-surface-variant hover:text-on-surface"
                >
                  {court.name}
                  {/* En línea con el texto: si el nombre se parte, el ícono sigue a la última palabra. */}
                  <svg
                    className="ml-1.5 inline-block size-4 align-[-0.15em]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                  <span className="sr-only"> – publicaciones procesales (se abre en una pestaña nueva)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="relative bg-surface-container/70">
        <Container className="py-5 text-center text-xs sm:text-left">
          © {year} {OFFICE_NAME}
        </Container>
      </div>
    </footer>
  )
}
