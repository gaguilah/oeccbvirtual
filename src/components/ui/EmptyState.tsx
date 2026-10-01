import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export default function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center rounded-lg bg-surface-container-low px-6 py-12 text-center', className)}
    >
      {icon && <div className="mb-4 text-on-surface-variant/60 [&>svg]:size-12">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
