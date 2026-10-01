import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

// Fondos tonales, sin bordes. Los colores de estado son la única excepción a slate + blue.
const variants = {
  info: 'bg-primary-container text-primary',
  success: 'bg-green-600/10 text-green-800 dark:text-green-300',
  warning: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  error: 'bg-red-600/10 text-red-800 dark:text-red-300',
}

export type AlertVariant = keyof typeof variants

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  onClose?: () => void
  className?: string
}

export default function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md p-4 text-sm', variants[variant], className)}
    >
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-m-1 self-start rounded p-1 opacity-70 hover:opacity-100"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
