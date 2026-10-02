import { HeroIllustration } from '../components/home'
import { Container } from '../components/layout'
import { ServiceCard, services } from '../components/services'

export default function Home() {
  return (
    <>
      {/* Hero: titular editorial a la izquierda e ilustración decorativa a la derecha (debajo en celular). */}
      <section className="overflow-hidden">
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">OECCB</p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga
            </h1>
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
    </>
  )
}
