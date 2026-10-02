import { Link } from 'react-router-dom'
import { Container } from '../components/layout'

type Service = {
  to: string
  title: string
  description: string
  // Trazos del icono (Heroicons outline, viewBox 24×24).
  icon: string[]
}

const services: Service[] = [
  {
    to: '/avisos-remates',
    title: 'Remates',
    description: 'Consulte los avisos de remate publicados.',
    icon: [
      'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z',
    ],
  },
  {
    to: '/pqrs',
    title: 'PQRS',
    description: 'Envíe peticiones, quejas, reclamos, sugerencias y felicitaciones.',
    icon: [
      'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
    ],
  },
  {
    to: '/encuesta',
    title: 'Encuesta',
    description: 'Califique el servicio y ayúdenos a mejorar.',
    icon: [
      'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
    ],
  },
  {
    to: '/tutoriales',
    title: 'Tutoriales',
    description: 'Aprenda a utilizar los servicios digitales.',
    icon: [
      'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z',
    ],
  },
]

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      to={service.to}
      className="group flex h-full flex-col gap-6 rounded-lg bg-surface-container-lowest p-6 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8"
    >
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary-container text-primary">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          {service.icon.map((d) => (
            <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
      </span>
      <span className="flex-1 space-y-2">
        <span className="block font-display text-xl font-bold tracking-[-0.02em] text-on-surface">{service.title}</span>
        <span className="block text-sm text-on-surface-variant">{service.description}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        Ingresar
        <svg
          className="size-4 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  )
}

export default function Home() {
  return (
    <>
      {/* Hero: titular editorial alineado a la izquierda con una leyenda pequeña debajo. */}
      <section>
        <Container className="py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">OECCB</p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl">
              Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga
            </h1>
            <p className="mt-6 text-sm text-on-surface-variant sm:text-base">Servicios digitales para ciudadanos</p>
          </div>
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
