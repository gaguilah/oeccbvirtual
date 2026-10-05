import { cn } from '../../lib/cn'

// Ícono Heroicons outline (viewBox 24×24) a partir de sus trazos. Decorativo: el texto vecino o el
// aria-label del control dan el nombre accesible.
export default function Icon({ paths, className }: { paths: string[]; className?: string }) {
  return (
    <svg
      className={cn('size-5 shrink-0', className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  )
}
