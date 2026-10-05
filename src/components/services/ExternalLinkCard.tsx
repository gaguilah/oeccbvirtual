import type { ExternalLink } from '../../lib/externalLinks'
import { ExternalLinkIcon } from '../ui'
import CardBody from './CardBody'

// Tarjeta de un sitio externo (Enlaces de interés). Misma forma que ServiceCard, pero abre en una
// pestaña nueva y dice "Visitar" con la flecha de enlace externo, para que se note que sale del sitio.
export default function ExternalLinkCard({ link }: { link: ExternalLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col gap-6 rounded-lg bg-surface-container-low p-6 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8"
    >
      <CardBody icon={link.icon} title={link.title} description={link.description} />
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        Visitar
        <ExternalLinkIcon className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <span className="sr-only"> (se abre en una pestaña nueva)</span>
      </span>
    </a>
  )
}
