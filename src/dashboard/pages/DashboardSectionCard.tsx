import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CardBody } from '../../components/services'
import { Badge } from '../../components/ui'
import type { DashboardLink } from '../navigation'
import { Icon, icons } from '../ui'

// Acceso a una sección desde Inicio. Misma base que ServiceCard (CardBody); las secciones aún no
// construidas muestran "Próximamente" en lugar de "Ingresar", pero siguen siendo navegables.
// `extra`: datos de la sección (p. ej. PQRS pendientes y vencidas).
export default function DashboardSectionCard({ link, extra }: { link: DashboardLink; extra?: ReactNode }) {
  return (
    <Link
      to={link.to}
      className="group flex h-full flex-col gap-6 rounded-lg bg-surface-container-low p-6 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <CardBody icon={link.icon} title={link.label} description={link.description} />
      {extra}
      {link.ready ? (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Ingresar
          <Icon paths={icons.arrowRight} className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      ) : (
        <Badge className="self-start">Próximamente</Badge>
      )}
    </Link>
  )
}
