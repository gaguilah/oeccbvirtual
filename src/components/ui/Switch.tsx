import { useId } from 'react'
import { cn } from '../../lib/cn'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  // Texto visible a la derecha; también es el nombre accesible.
  label: string
  // Texto pequeño debajo de la etiqueta.
  description?: string
  disabled?: boolean
  // Guardando: deshabilitado y con aria-busy.
  busy?: boolean
  className?: string
}

// Interruptor on/off (role="switch"): botón nativo, así funciona con Espacio y Enter y el lector de
// pantalla anuncia "activado" / "desactivado". Colores de tokens, al estilo Material 3: apagado,
// pista tonal y botón pequeño; encendido, pista primary y botón más grande.
export default function Switch({ checked, onChange, label, description, disabled, busy, className }: SwitchProps) {
  const labelId = useId()
  const descriptionId = useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60',
          checked ? 'bg-primary' : 'bg-surface-container',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block rounded-full transition-[translate,width,height] motion-reduce:transition-none',
            checked ? 'size-5 translate-x-5.5 bg-on-primary' : 'size-4 translate-x-1 bg-on-surface-variant',
          )}
        />
      </button>
      <span className="min-w-0">
        <span id={labelId} className="block text-sm font-medium text-on-surface">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="block text-xs text-on-surface-variant">
            {description}
          </span>
        )}
      </span>
    </div>
  )
}
