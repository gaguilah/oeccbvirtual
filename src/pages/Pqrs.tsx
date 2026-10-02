import { Link } from 'react-router-dom'
import { Container } from '../components/layout'
import { Breadcrumb } from '../components/navigation'
import PqrsForm from '../components/pqrs/PqrsForm'
import PqrsIllustration from '../components/pqrs/PqrsIllustration'
import { ButtonAnchor } from '../components/ui'
import {
  CONTACT_ADDRESS,
  CONTACT_CITY,
  CONTACT_DAYS,
  CONTACT_DEPARTMENT,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_HOURS_NOTE,
} from '../lib/contact'

export default function Pqrs() {
  return (
    <>
      {/* Hero: texto a la izquierda e ilustración a la derecha (escritorio); en tableta la ilustración va
          debajo y en celular se oculta para que el botón y el formulario queden a mano. */}
      <section className="overflow-hidden">
        <Container className="py-12 sm:py-20 lg:py-24">
          <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'PQRS' }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Desde 640 px y hasta lg: título a la izquierda, texto de apoyo a la derecha y el botón debajo.
                Celular y escritorio: todo apilado. */}
            <div className="sm:grid sm:grid-cols-[auto_1fr] sm:items-end sm:gap-x-10 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Atención al ciudadano</p>
                <h1 className="mt-4 text-6xl font-extrabold sm:text-7xl">PQRS</h1>
              </div>
              <div className="mt-6 sm:mt-0 sm:pb-2 lg:mt-6 lg:pb-0">
                <p className="font-display text-xl font-semibold text-on-surface md:text-2xl">
                  Peticiones · Quejas · Reclamos · <br className="hidden sm:inline" />
                  Sugerencias · Felicitaciones
                </p>
                <p className="mt-4 text-sm text-on-surface-variant sm:text-base">
                  Estamos para atender sus solicitudes.
                </p>
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <ButtonAnchor href="#radicar" size="lg">
                  Radicar solicitud
                </ButtonAnchor>
              </div>
            </div>
            <PqrsIllustration className="mx-auto hidden w-[90%] max-w-lg md:block lg:mx-0 lg:w-full lg:max-w-none" />
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
            <p className="mt-2 text-sm text-on-surface-variant">
              Tres pasos sencillos. Todos los campos son obligatorios.
            </p>
          </div>
          <PqrsForm />
        </Container>
      </section>

      {/* Otros canales: datos de src/lib/contact.ts. */}
      <section>
        <Container className="space-y-3 py-12 sm:py-16">
          <h2 className="text-xl font-bold">Otros canales de atención</h2>
          <p className="text-on-surface-variant">
            También puede escribirnos a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>{' '}
            o acercarse a la {CONTACT_ADDRESS}, {CONTACT_CITY}, {CONTACT_DEPARTMENT}.
          </p>
          <p className="text-on-surface-variant">
            Horario de atención: {CONTACT_DAYS}, {CONTACT_HOURS} ({CONTACT_HOURS_NOTE.toLowerCase()}).
          </p>
          <Link to="/contacto" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Ver todos los datos de contacto
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </Container>
      </section>
    </>
  )
}
