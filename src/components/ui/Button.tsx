import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'
import Spinner from './Spinner'

const variants = {
  // Degradado de 135° de primary a primary-dim.
  primary: 'bg-linear-135 from-primary to-primary-dim text-on-primary hover:brightness-110',
  // Fondo transparente con "Ghost Border".
  secondary: 'border border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container-low',
  // Sin fondo ni borde: texto en mayúsculas con espaciado amplio.
  tertiary: 'text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary-container/50',
  danger: 'bg-red-700 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'min-h-8 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
  // Cuadrado, solo ícono: el nombre accesible va en aria-label (y una leyenda con Tooltip).
  icon: 'size-10 p-0',
}

type StyleProps = {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  fullWidth?: boolean
}

function buttonClasses({ variant = 'primary', size = 'md', fullWidth }: StyleProps, className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:opacity-60',
    sizes[size],
    variants[variant],
    fullWidth && 'w-full',
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps & { loading?: boolean }

export default function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth }, className)}
      {...props}
    >
      {loading && <Spinner size="sm" label="" />}
      {children}
    </button>
  )
}

// Enlace de react-router con la apariencia de un botón.
export function ButtonLink({ variant, size, fullWidth, className, ...props }: LinkProps & StyleProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth }, className)} {...props} />
}

// Enlace externo (<a>) con la apariencia de un botón. Con `external` abre en una pestaña nueva.
export function ButtonAnchor({
  variant,
  size,
  fullWidth,
  external = false,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & StyleProps & { external?: boolean }) {
  return (
    <a
      className={buttonClasses({ variant, size, fullWidth }, className)}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...props}
    />
  )
}
