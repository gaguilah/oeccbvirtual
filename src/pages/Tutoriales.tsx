import { Container, PageHeader } from '../components/layout'
import { TutorialCard, TutorialsIllustration, tutorials } from '../components/tutorials'

export default function Tutoriales() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      {/* Encabezado como Avisos de Remate: título a la izquierda e ilustración a la derecha
          (escritorio); en tableta y celular va debajo, centrada. */}
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <PageHeader
          title="Tutoriales"
          description="Guías paso a paso para usar los servicios digitales de la oficina."
          breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Tutoriales' }]}
          className="pb-0"
        />
        <TutorialsIllustration className="mx-auto w-full max-w-lg sm:w-[90%] lg:mx-0 lg:w-full lg:max-w-none" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 md:pt-4 lg:grid-cols-3">
        {tutorials.map((tutorial, index) => (
          <li key={tutorial.slug}>
            <TutorialCard tutorial={tutorial} number={index + 1} />
          </li>
        ))}
      </ul>
    </Container>
  )
}
