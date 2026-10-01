import { Container, PageHeader } from '../components/layout'
import { TutorialCard, tutorials } from '../components/tutorials'

export default function Tutoriales() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title="Tutoriales"
        description="Guías paso a paso para usar los servicios digitales de la oficina."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Tutoriales' }]}
      />
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {tutorials.map((tutorial, index) => (
          <li key={tutorial.slug}>
            <TutorialCard tutorial={tutorial} number={index + 1} />
          </li>
        ))}
      </ul>
    </Container>
  )
}
