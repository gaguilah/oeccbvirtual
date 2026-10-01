import { cn } from '../../lib/cn'
import CheckIcon from '../ui/CheckIcon'
import { REQUEST_TYPE_IDS, requestTypes, type RequestTypeId } from './data'

type TypeStepProps = {
  value: RequestTypeId | null
  onChange: (value: RequestTypeId) => void
  error?: string
}

// Paso 1: tarjetas seleccionables respaldadas por radios nativos (teclado y lectores de pantalla).
export default function TypeStep({ value, onChange, error }: TypeStepProps) {
  return (
    <fieldset className="space-y-4" aria-describedby={error ? 'request-type-error' : undefined}>
      <legend className="text-sm text-on-surface-variant">
        Seleccione la opción que mejor describe su caso.
      </legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUEST_TYPE_IDS.map((id) => {
          const type = requestTypes[id]
          const checked = value === id
          return (
            <label
              key={id}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-surface-container',
                'has-checked:bg-primary-container',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
              )}
            >
              <input
                type="radio"
                name="type"
                value={id}
                checked={checked}
                onChange={() => onChange(id)}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />
              <span className="flex items-center justify-between font-semibold text-on-surface">
                {type.label}
                {checked && <CheckIcon className="text-primary" />}
              </span>
              <span className="text-sm text-on-surface-variant">{type.description}</span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id="request-type-error" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  )
}
