import { cn } from '../../lib/cn'

type PaginationProps = {
  // Página actual, empezando en 1.
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

type PageItem = number | 'gap-start' | 'gap-end'

// Hasta 7 páginas se muestran todas; con más: primera, vecinas de la actual y última.
function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)

  const start = Math.max(2, Math.min(page - 1, pageCount - 4))
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5))
  const items: PageItem[] = [1]
  if (start > 2) items.push('gap-start')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < pageCount - 1) items.push('gap-end')
  items.push(pageCount)
  return items
}

const itemBase =
  'inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === 'left' ? 'M15.75 19.5 8.25 12l7.5-7.5' : 'm8.25 4.5 7.5 7.5-7.5 7.5'}
      />
    </svg>
  )
}

// Paginación numerada. No se muestra si hay una sola página.
export default function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Paginación" className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={cn(
              itemBase,
              'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            <Chevron direction="left" />
          </button>
        </li>
        {getPageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
                className={cn(
                  itemBase,
                  item === page
                    ? 'bg-linear-135 from-primary to-primary-dim text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="inline-flex size-9 items-center justify-center text-on-surface-variant"
            >
              …
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
            className={cn(
              itemBase,
              'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            <Chevron direction="right" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
