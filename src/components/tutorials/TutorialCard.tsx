import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { tutorialPath, type Tutorial } from './data'

type TutorialCardProps = {
  tutorial: Tutorial
  // Posición en la lista (empieza en 1).
  number: number
  className?: string
}

// Tarjeta del listado: mismo estilo que las tarjetas de servicios del inicio.
export default function TutorialCard({ tutorial, number, className }: TutorialCardProps) {
  return (
    <Link
      to={tutorialPath(tutorial.slug)}
      className={cn(
        'group flex h-full flex-col gap-6 rounded-lg bg-surface-container-lowest p-6 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary-container font-display text-lg font-bold text-primary">
        <span className="sr-only">Tutorial </span>
        {number}
      </span>
      <span className="flex-1 space-y-2">
        <span className="block font-display text-xl font-bold tracking-[-0.02em] text-on-surface">{tutorial.title}</span>
        <span className="block text-sm text-on-surface-variant">{tutorial.description}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        Ver tutorial
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
