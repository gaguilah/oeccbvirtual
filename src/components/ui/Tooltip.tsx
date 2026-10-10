import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TooltipProps = {
  // Texto de la leyenda. Es solo visual (aria-hidden): el elemento envuelto debe tener su propio
  // nombre accesible, p. ej. aria-label con el mismo texto.
  label: string
  children: ReactNode
  // 'end' alinea la leyenda al borde derecho del elemento (para controles junto al borde de la
  // pantalla, donde centrada se saldría).
  align?: 'center' | 'end'
  // 'right': a la derecha del elemento, centrada en vertical (p. ej. el menú lateral comprimido).
  side?: 'bottom' | 'right'
  className?: string
}

// Leyenda que aparece debajo (o a la derecha) del elemento al pasar el mouse o al enfocarlo con el teclado.
// Solo con CSS (group-hover / foco de teclado con :focus-visible, así no queda abierta tras un clic); superficie inverse-surface, como los globos
// de las ilustraciones.
export default function Tooltip({ label, children, align = 'center', side = 'bottom', className }: TooltipProps) {
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-20 rounded-md bg-inverse-surface px-2 py-1 text-xs font-medium whitespace-nowrap text-on-inverse-surface shadow-ambient',
          side === 'right'
            ? 'top-1/2 left-full ml-3 -translate-y-1/2'
            : cn('top-full mt-2', align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'),
          'invisible opacity-0 group-has-focus-visible/tooltip:visible group-has-focus-visible/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:opacity-100',
          'motion-safe:transition-[opacity,visibility] motion-safe:duration-150',
        )}
      >
        {label}
      </span>
    </span>
  )
}
