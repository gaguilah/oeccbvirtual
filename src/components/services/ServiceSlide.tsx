import { useId } from 'react'
import { Link } from 'react-router-dom'
import type { Service } from './data'
import ServiceIllustration from './ServiceIllustration'

// Tarjeta grande de un servicio en el carrusel del inicio: título, ilustración quieta de la
// sección, descripción y la acción. Toda la tarjeta es el enlace; su nombre es el título y la
// descripción queda como explicación (así el lector no lee la ilustración ni repite textos).
export default function ServiceSlide({ service }: { service: Service }) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Link
      to={service.to}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      <span
        id={titleId}
        className="px-6 pt-6 font-display text-xl font-bold tracking-[-0.02em] text-on-surface sm:px-8 sm:pt-8 sm:text-2xl"
      >
        {service.title}
      </span>
      <ServiceIllustration to={service.to} className="mt-4" />
      <span className="flex flex-1 flex-col justify-between gap-6 px-6 pt-2 pb-6 sm:px-8 sm:pb-8">
        <span id={descriptionId} className="block text-sm text-on-surface-variant sm:text-base">
          {service.description}
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          {service.action}
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
      </span>
    </Link>
  )
}
