import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

// Los colores de estado (verde, ámbar, rojo) son la única excepción a la paleta slate + blue.
const variants = {
  neutral: 'bg-surface-container text-on-surface-variant',
  primary: 'bg-primary-container text-primary',
  success: 'bg-green-600/10 text-green-800 dark:text-green-300',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  danger: 'bg-red-600/10 text-red-800 dark:text-red-300',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }

export default function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
