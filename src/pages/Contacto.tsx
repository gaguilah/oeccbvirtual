import { ContactIllustration, ContactSummary } from '../components/contacto'
import { Container, PageHeader } from '../components/layout'
import { ServiceCard, services } from '../components/services'

// Servicios que se pueden hacer en línea en lugar de escribir o ir a la oficina.
const ONLINE_SERVICES = ['/pqrs', '/encuesta', '/tutoriales']
const onlineServices = services.filter((service) => ONLINE_SERVICES.includes(service.to))

export default function Contacto() {
  return (
    <>
      {/* Encabezado. Tableta y celular: título → ilustración → datos. Escritorio (lg): título y datos
          a la izquierda, ilustración a la derecha ocupando las dos filas. Las filas reparten el alto
          sobrante, así el título (self-end) y los datos (self-start) quedan centrados juntos. */}
      <section className="overflow-hidden">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
          <PageHeader
            title="Contacto"
            description="Escríbanos, visítenos o use los canales en línea."
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Contacto' }]}
            className="pb-0 lg:col-start-1 lg:row-start-1 lg:self-end"
          />
          <ContactIllustration className="mx-auto w-[90%] max-w-lg lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:w-full lg:max-w-none lg:self-center" />
          <ContactSummary className="lg:col-start-1 lg:row-start-2 lg:self-start" />
        </Container>
      </section>

      <section aria-labelledby="en-linea-title" className="bg-surface-container-low">
        <Container className="space-y-8 py-12 sm:py-16">
          <div className="space-y-2">
            <h2
              id="en-linea-title"
              className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
            >
              Canales en línea
            </h2>
            <p className="text-sm text-on-surface-variant">
              Muchos trámites se pueden hacer sin escribir ni ir a la oficina.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {onlineServices.map((service) => (
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
