import { Link } from 'react-router-dom'
import type { Service } from './data'

// Tarjeta grande de un servicio, enlazada a su página.
export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      to={service.to}
      className="group flex h-full flex-col gap-6 rounded-lg bg-surface-container-lowest p-6 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8"
    >
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary-container text-primary">
        <svg
          className="size-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          {service.icon.map((d) => (
            <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
      </span>
      <span className="flex-1 space-y-2">
        <span className="block font-display text-xl font-bold tracking-[-0.02em] text-on-surface">{service.title}</span>
        <span className="block text-sm text-on-surface-variant">{service.description}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        Ingresar
        <svg
          className="size-4 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  )
}
