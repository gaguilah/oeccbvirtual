import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import Breadcrumb, { type BreadcrumbItem } from '../navigation/Breadcrumb'

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  // Botones u otras acciones alineadas a la derecha en escritorio.
  actions?: ReactNode
  className?: string
}

// Titular grande con una leyenda pequeña debajo (contraste de escala editorial). Sin líneas divisorias.
export default function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-4', className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 text-sm text-on-surface-variant">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
