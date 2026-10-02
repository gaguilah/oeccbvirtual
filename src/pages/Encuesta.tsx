import { Container } from '../components/layout'
import { Breadcrumb } from '../components/navigation'
import SurveyForm from '../components/survey/SurveyForm'
import { useSurvey } from '../components/survey/useSurvey'
import { Alert, ButtonAnchor, Spinner } from '../components/ui'

const SURVEY_CODE = 'satisfaccion-oeccb'

export default function Encuesta() {
  const { survey, loading, error } = useSurvey(SURVEY_CODE)

  return (
    <>
      {/* Hero */}
      <section>
        <Container className="py-12 sm:py-20 lg:py-28">
          <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'Encuesta' }]} />
          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Su opinión cuenta</p>
            <h1 className="mt-4 text-5xl font-extrabold sm:text-7xl">Encuesta</h1>
            <p className="mt-6 font-display text-xl font-semibold text-on-surface sm:text-2xl">
              Ayúdenos a mejorar nuestros servicios
            </p>
            <p className="mt-4 text-sm text-on-surface-variant sm:text-base">Responder le tomará solo unos minutos.</p>
            <div className="mt-10">
              <ButtonAnchor href="#responder" size="lg">
                Responder encuesta
              </ButtonAnchor>
            </div>
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
