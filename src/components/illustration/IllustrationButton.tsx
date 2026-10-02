import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type IllustrationButtonProps = {
  variant?: 'primary' | 'secondary'
  // Trazos del ícono (Heroicons outline, viewBox 24×24).
  icon?: string[]
  className?: string
  children: ReactNode
}

const variants = {
  primary: 'bg-linear-135 from-primary to-primary-dim text-on-primary',
  secondary: 'bg-surface-container-lowest text-on-surface ring-1 ring-on-surface/15',
}

// Botón simulado para las ilustraciones: es un div (decorativo, no enfocable), con el mismo
// aspecto que Button de components/ui.
export default function IllustrationButton({
  variant = 'secondary',
  icon,
  className,
  children,
}: IllustrationButtonProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
    >
      {icon && (
        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          {icon.map((d) => (
            <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
      )}
      {children}
    </div>
  )
}
