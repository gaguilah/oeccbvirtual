import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldState, labelClasses } from './styles'

type Option = { value: string; label: string; disabled?: boolean }

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  options?: Option[]
  placeholder?: string
}

export default function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className={labelClasses}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(fieldBase, 'pr-8', error ? fieldState.error : fieldState.normal, className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${selectId}-hint`} className="text-sm text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
