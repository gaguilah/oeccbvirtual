import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type ChoiceOptionProps = {
  name: string
  checked: boolean
  onSelect: () => void
  invalid: boolean
  children: ReactNode
  // Texto alternativo para lectores de pantalla (p. ej. "1, baja").
  srLabel?: string
  className?: string
}

// Opción seleccionable respaldada por un radio nativo: funciona con teclado (flechas) y lectores de pantalla.
export default function ChoiceOption({ name, checked, onSelect, invalid, children, srLabel, className }: ChoiceOptionProps) {
  return (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer items-center justify-center rounded-lg bg-surface-container-low px-4 font-semibold text-on-surface transition-colors hover:bg-surface-container',
        'has-checked:bg-linear-135 has-checked:from-primary has-checked:to-primary-dim has-checked:text-on-primary',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        aria-invalid={invalid || undefined}
        className="sr-only"
      />
      {srLabel ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sr-only">{srLabel}</span>
        </>
      ) : (
        children
      )}
    </label>
  )
}
