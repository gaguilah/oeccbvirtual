import { useLocation } from 'react-router-dom'
import { illustrationIcons as icons } from '../components/illustration'
import { Container } from '../components/layout'
import { mainLinks } from '../components/navigation'
import { NotFoundIllustration } from '../components/notfound'
import { ButtonLink } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

type NotFoundProps = {
  eyebrow?: string
  title?: string
  description?: string
  // Botón principal; por defecto, "Ir al inicio".
  primaryAction?: { label: string; to: string }
}

// Accesos rápidos: los servicios del menú principal (sin "Inicio", que ya es el botón principal).
const quickLinks = mainLinks.filter((link) => link.to !== '/')

// Página 404 (ruta "*") y "no encontrado" de otras secciones, p. ej. un tutorial inexistente.
// Muestra la dirección intentada, cambia el título de la pestaña y marca la página como noindex.
// Ver docs/plan-404.md.
export default function NotFound({
  eyebrow = 'Error 404',
  title = 'Página no encontrada',
  description = 'Revise que la dirección esté bien escrita o use uno de estos enlaces.',
  primaryAction = { label: 'Ir al inicio', to: '/' },
}: NotFoundProps) {
  const { pathname } = useLocation()
  useDocumentMeta({ title, noindex: true })

  return (
    <section className="overflow-hidden">
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-6 text-on-surface-variant sm:text-lg">
            No encontramos{' '}
            <code className="rounded-md bg-surface-container-low px-1.5 py-0.5 font-mono text-sm break-all text-on-surface sm:text-base">
              {pathname}
            </code>
            .
          </p>
          <p className="mt-2 text-sm text-on-surface-variant sm:text-base">{description}</p>

          <div className="mt-8">
            <ButtonLink to={primaryAction.to} size="lg">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={icons.home[0]} />
              </svg>
              {primaryAction.label}
            </ButtonLink>
          </div>

          <nav aria-labelledby="quick-links-title" className="mt-10 space-y-3">
            <h2
              id="quick-links-title"
              className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
            >
              Accesos rápidos
            </h2>
            <ul className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <ButtonLink to={link.to} variant="secondary" size="sm">
                    {link.label}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <NotFoundIllustration
          path={pathname}
          className="mx-auto w-full max-w-lg sm:w-[90%] lg:mx-0 lg:w-full lg:max-w-none"
        />
      </Container>
    </section>
  )
}
