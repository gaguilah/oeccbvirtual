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
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NotFound from './NotFound'

// Detalle de un tutorial: /tutoriales/:slug.
export default function Tutorial() {
  const { slug } = useParams()
  const index = findTutorialIndex(slug)
  const tutorial = tutorials[index]
  // Si no existe, el título lo pone NotFound.
  useDocumentMeta({ title: tutorial ? tutorial.title : null })

  if (!tutorial) {
    return (
      <NotFound
        title="Tutorial no encontrado"
        description="Es posible que la dirección esté mal escrita o que el tutorial ya no exista."
        primaryAction={{ label: 'Ver todos los tutoriales', to: TUTORIALS_PATH }}
      />
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
