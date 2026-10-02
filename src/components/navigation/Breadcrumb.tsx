import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export type BreadcrumbItem = { label: string; to?: string }

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

// El último elemento se muestra como página actual (sin enlace).
export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Ruta de navegación" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-on-surface">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast && 'font-medium text-on-surface')}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="size-4 shrink-0 text-on-surface-variant/60"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
