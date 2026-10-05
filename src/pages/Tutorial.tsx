import { useParams } from 'react-router-dom'
import { Container, PageHeader } from '../components/layout'
import {
  TUTORIALS_PATH,
  TutorialContent,
  TutorialNav,
  TutorialPrerequisites,
  TutorialSummary,
  findTutorialIndex,
  tutorials,
} from '../components/tutorials'
import { ButtonLink, EmptyState } from '../components/ui'

// Detalle de un tutorial: /tutoriales/:slug.
export default function Tutorial() {
  const { slug } = useParams()
  const index = findTutorialIndex(slug)
  const tutorial = tutorials[index]

  if (!tutorial) {
    return (
      <Container className="space-y-8 py-12 sm:py-16">
        <PageHeader
          title="Tutorial no encontrado"
          breadcrumb={[
            { label: 'Inicio', to: '/' },
            { label: 'Tutoriales', to: TUTORIALS_PATH },
            { label: 'No encontrado' },
          ]}
        />
        <EmptyState
          title="No encontramos este tutorial"
          description="Es posible que la dirección esté mal escrita o que el tutorial ya no exista."
          action={<ButtonLink to={TUTORIALS_PATH}>Ver todos los tutoriales</ButtonLink>}
        />
      </Container>
    )
  }

  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title={tutorial.title}
        description={tutorial.description}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Tutoriales', to: TUTORIALS_PATH },
          { label: tutorial.title },
        ]}
      />
      {/* Ancho completo del contenedor: avisos, introducción y pasos alineados con el título. */}
      <div className="space-y-8">
        {tutorial.prerequisites && (
          <TutorialPrerequisites slugs={tutorial.prerequisites} note={tutorial.prerequisitesNote} />
        )}
        {tutorial.intro && <p className="font-medium text-on-surface">{tutorial.intro}</p>}
        <TutorialContent steps={tutorial.steps} />
        {tutorial.draft && (
          <p className="text-sm text-on-surface-variant">
            Contenido de prueba. Este texto es provisional y será reemplazado por la información definitiva del
            tutorial.
          </p>
        )}
        <TutorialSummary text={tutorial.summary} next={tutorial.next} />
      </div>
      <TutorialNav index={index} />
    </Container>
  )
}
