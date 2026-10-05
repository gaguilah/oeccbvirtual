import { HeroIllustration } from '../components/home'
import { Container } from '../components/layout'
import { ExternalLinkCard, ServiceCard, services } from '../components/services'
import { OFFICE_NAME } from '../lib/contact'
import { INTEREST_LINKS } from '../lib/externalLinks'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Home() {
  useDocumentMeta({ title: 'Inicio' })
  return (
    <>
      {/* Hero: titular editorial a la izquierda e ilustración decorativa a la derecha (debajo en celular). */}
      <section className="overflow-hidden">
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">OECCB</p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{OFFICE_NAME}</h1>
            <p className="mt-6 text-sm text-on-surface-variant sm:text-base">Servicios digitales para ciudadanos</p>
          </div>
          <HeroIllustration className="mx-auto w-[90%] max-w-lg lg:mx-0 lg:w-full lg:max-w-none" />
        </Container>
      </section>

      {/* Servicios: tarjetas (surface-container-lowest) sobre una sección tonal, sin bordes. */}
      <section aria-labelledby="servicios-title" className="bg-surface-container-low">
        <Container className="space-y-8 py-12 sm:py-16 lg:py-20">
          <h2
            id="servicios-title"
            className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
          >
            Servicios
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            {services.map((service) => (
              <li key={service.to}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Enlaces de interés: vuelve al fondo surface (el cambio de tono separa las secciones) y las
          tarjetas usan surface-container-low. Ver docs/plan-enlaces-interes.md. */}
      <section aria-labelledby="enlaces-title">
        <Container className="space-y-8 py-12 sm:py-16 lg:py-20">
          <div className="space-y-2">
            <h2
              id="enlaces-title"
              className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
            >
              Enlaces de interés
            </h2>
            <p className="text-sm text-on-surface-variant">Sitios oficiales de la Rama Judicial.</p>
          </div>
          <ul className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {INTEREST_LINKS.map((link) => (
              <li key={link.href}>
                <ExternalLinkCard link={link} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
