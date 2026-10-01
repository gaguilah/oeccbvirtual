import { Container, PageHeader } from '../components/layout'
import { Card, CardBody } from '../components/ui'

export default function Remates() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title="Remates"
        description="Consulta los remates disponibles y su información."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Remates' }]}
      />
      <Card>
        <CardBody className="max-w-3xl space-y-4 text-on-surface-variant">
          <p>Aquí encontrarás el listado de remates, sus fechas, condiciones y documentos relacionados.</p>
          <p>
            Contenido en construcción. Este texto es provisional y será reemplazado por la información definitiva de
            esta sección.
          </p>
        </CardBody>
      </Card>
    </Container>
  )
}
