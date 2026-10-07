import { useId, type Ref, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldState, labelClasses } from './styles'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
  // Muestra "n / maxLength" bajo el campo cuando se define `maxLength`.
  showCount?: boolean
  // React 19: ref como prop (p. ej. para llevar el foco al campo).
  ref?: Ref<HTMLTextAreaElement>
}

export default function Textarea({
  label,
  hint,
  error,
  showCount = false,
  id,
  className,
  rows = 6,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
  const count = typeof props.value === 'string' ? props.value.length : 0

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className={labelClasses}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(fieldBase, 'resize-y', error ? fieldState.error : fieldState.normal, className)}
        {...props}
      />
      {/* Celular: ayuda a todo el ancho y contador debajo, a la derecha. Desde sm: lado a lado. */}
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
        {error ? (
          <p id={`${textareaId}-error`} className="text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : (
          <p id={`${textareaId}-hint`} className="text-on-surface-variant">
            {hint}
          </p>
        )}
        {showCount && props.maxLength && (
          <p className="shrink-0 self-end tabular-nums text-on-surface-variant sm:self-auto">
            {count.toLocaleString('es-CO')} / {props.maxLength.toLocaleString('es-CO')}
          </p>
        )}
      </div>
    </div>
  )
}
