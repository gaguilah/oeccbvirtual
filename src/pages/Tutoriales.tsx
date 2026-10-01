import { Container, PageHeader } from '../components/layout'
import { Card, CardBody } from '../components/ui'

export default function Tutoriales() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title="Tutoriales"
        description="Guías paso a paso para usar la plataforma."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Tutoriales' }]}
      />
      <Card>
        <CardBody className="max-w-3xl space-y-4 text-on-surface-variant">
          <p>En esta sección encontrarás tutoriales y material de apoyo para aprovechar las funciones de la plataforma.</p>
          <p>
            Contenido en construcción. Este texto es provisional y será reemplazado por la información definitiva de
            esta sección.
          </p>
        </CardBody>
      </Card>
    </Container>
  )
}
