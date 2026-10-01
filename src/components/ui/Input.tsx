import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldState, labelClasses } from './styles'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export default function Input({ label, hint, error, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(fieldBase, error ? fieldState.error : fieldState.normal, className)}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-sm text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
