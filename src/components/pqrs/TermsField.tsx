import { useId, useState } from 'react'
import { cn } from '../../lib/cn'
import TermsModal from './TermsModal'

type TermsFieldProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  className?: string
}

// Casilla obligatoria de aceptación de los términos. El enlace abre el texto en un modal; desde ahí
// "Acepto los términos" marca la casilla.
export default function TermsField({ checked, onChange, error, className }: TermsFieldProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-on-surface-variant">Tratamiento de datos</p>
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg bg-surface-container-low p-4',
          error && 'ring-1 ring-red-600 dark:ring-red-400',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <label htmlFor={id} className="text-sm text-on-surface">
          He leído y acepto los{' '}
          <button
            type="button"
            onClick={(e) => {
              // Que el clic en el enlace no marque la casilla (está dentro del label).
              e.preventDefault()
              setOpen(true)
            }}
            aria-haspopup="dialog"
            className="text-left font-semibold text-primary underline underline-offset-2 hover:no-underline"
          >
            términos y condiciones de tratamiento de datos personales
          </button>
        </label>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <TermsModal
        open={open}
        onClose={() => setOpen(false)}
        onAccept={() => {
          onChange(true)
          setOpen(false)
        }}
      />
    </div>
  )
}
