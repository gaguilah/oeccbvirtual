import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { tutorialPath, tutorials } from './data'

type TutorialNavProps = {
  // Índice del tutorial actual dentro de `tutorials`.
  index: number
  className?: string
}

type NavLinkProps = {
  slug: string
  title: string
  direction: 'prev' | 'next'
}

function TutorialNavLink({ slug, title, direction }: NavLinkProps) {
  const isNext = direction === 'next'
  return (
    <Link
      to={tutorialPath(slug)}
      rel={direction}
      className={cn(
        'group flex h-full flex-col gap-1 rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-primary-container/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5',
        isNext && 'sm:items-end sm:text-right',
      )}
    >
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        {!isNext && <Arrow className="rotate-180 group-hover:-translate-x-1" />}
        {isNext ? 'Siguiente' : 'Anterior'}
        {isNext && <Arrow className="group-hover:translate-x-1" />}
      </span>
      <span className="font-medium text-on-surface">{title}</span>
    </Link>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4 transition-transform', className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

// Enlaces al tutorial anterior y al siguiente según el orden de `tutorials`.
export default function TutorialNav({ index, className }: TutorialNavProps) {
  const prev = tutorials[index - 1]
  const next = tutorials[index + 1]

  return (
    <nav aria-label="Otros tutoriales" className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div>{prev && <TutorialNavLink slug={prev.slug} title={prev.title} direction="prev" />}</div>
      <div>{next && <TutorialNavLink slug={next.slug} title={next.title} direction="next" />}</div>
    </nav>
  )
}
