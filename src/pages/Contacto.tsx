import { Container, PageHeader } from '../components/layout'
import { Card, CardBody } from '../components/ui'

export default function Contacto() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title="Contacto"
        description="Canales de atención y datos de contacto."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Contacto' }]}
      />
      <Card>
        <CardBody className="max-w-3xl space-y-4 text-on-surface-variant">
          <p>Aquí se publicarán los canales de atención, horarios y datos de contacto.</p>
          <p>
            Contenido en construcción. Este texto es provisional y será reemplazado por la información definitiva de
            esta sección.
          </p>
        </CardBody>
      </Card>
    </Container>
  )
}
