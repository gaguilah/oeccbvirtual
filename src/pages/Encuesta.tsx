import { Container } from '../components/layout'
import { Breadcrumb } from '../components/navigation'
import SurveyForm from '../components/survey/SurveyForm'
import SurveyIllustration from '../components/survey/SurveyIllustration'
import { useSurvey } from '../components/survey/useSurvey'
import { Alert, ButtonAnchor, Spinner } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Encuesta() {
  useDocumentMeta({ title: 'Encuesta' })
  const { survey, loading, error } = useSurvey()

  return (
    <>
      {/* Hero: como PQRS. Celular: apilado y sin ilustración. Desde 640 px y hasta lg: título a la
          izquierda, texto de apoyo al lado y el botón debajo; desde 768 px, la ilustración debajo.
          Escritorio: texto a la izquierda e ilustración a la derecha. */}
      <section className="overflow-hidden">
        <Container className="py-12 sm:py-20 lg:py-24">
          <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'Encuesta' }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="sm:grid sm:grid-cols-[auto_1fr] sm:items-end sm:gap-x-10 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Su opinión cuenta</p>
                <h1 className="mt-4 text-5xl font-extrabold sm:text-6xl lg:text-7xl">Encuesta</h1>
              </div>
              <div className="mt-6 sm:mt-0 sm:pb-2 lg:mt-6 lg:pb-0">
                <p className="font-display text-xl font-semibold text-on-surface md:text-2xl">
                  Ayúdenos a mejorar nuestros servicios
                </p>
                <p className="mt-4 text-sm text-on-surface-variant sm:text-base">
                  Responder le tomará solo unos minutos.
                </p>
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <ButtonAnchor href="#responder" size="lg">
                  Responder encuesta
                </ButtonAnchor>
              </div>
            </div>
            <SurveyIllustration className="mx-auto hidden w-[90%] max-w-lg md:block lg:mx-0 lg:w-full lg:max-w-none" />
          </div>
        </Container>
      </section>

      {/* Encuesta */}
      <section id="responder" aria-labelledby="responder-title" className="scroll-mt-16 bg-surface-container-low">
        <Container className="space-y-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <h2 id="responder-title" className="text-3xl font-bold sm:text-4xl">
              {survey?.title ?? 'Encuesta de satisfacción'}
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">Responda una pregunta a la vez.</p>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Spinner /> Cargando encuesta...
            </div>
          )}
          {error && <Alert variant="error">{error}</Alert>}
          {survey && <SurveyForm survey={survey} />}
        </Container>
      </section>
    </>
  )
}
