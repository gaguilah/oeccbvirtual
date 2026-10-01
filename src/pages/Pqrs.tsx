import { Container } from '../components/layout'
import { Breadcrumb } from '../components/navigation'
import PqrsForm from '../components/pqrs/PqrsForm'
import { ButtonAnchor } from '../components/ui'
import { CONTACT_ADDRESS, CONTACT_CITY, CONTACT_EMAIL } from '../lib/contact'

export default function Pqrs() {
  return (
    <>
      {/* Hero */}
      <section>
        <Container className="py-12 sm:py-20 lg:py-28">
          <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'PQRS' }]} />
          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Atención al ciudadano</p>
            <h1 className="mt-4 text-6xl font-extrabold sm:text-7xl lg:text-8xl">PQRS</h1>
            <p className="mt-6 font-display text-xl font-semibold text-on-surface sm:text-2xl">
              Peticiones · Quejas · Reclamos · <br className="hidden sm:inline" />
              Sugerencias · Felicitaciones
            </p>
            <p className="mt-4 text-sm text-on-surface-variant sm:text-base">Estamos para atender sus solicitudes.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor href="#radicar" size="lg">
                Radicar solicitud
              </ButtonAnchor>
            </div>
          </div>
        </Container>
      </section>

      {/* Flujo guiado */}
      <section id="radicar" aria-labelledby="radicar-title" className="scroll-mt-16 bg-surface-container-low">
        <Container className="space-y-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2 id="radicar-title" className="text-3xl font-bold sm:text-4xl">
              Radique su PQRS
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">Tres pasos sencillos. Todos los campos son obligatorios.</p>
          </div>
          <PqrsForm />
        </Container>
      </section>

      {/* Otros canales */}
      <section>
        <Container className="py-12 sm:py-16">
          <h2 className="text-xl font-bold">Otros canales de atención</h2>
          <p className="mt-2 text-on-surface-variant">
            También puede escribirnos a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>{' '}
            o acercarse a la {CONTACT_ADDRESS}, {CONTACT_CITY}.
          </p>
        </Container>
      </section>
    </>
  )
}
