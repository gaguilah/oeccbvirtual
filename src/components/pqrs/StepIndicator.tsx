import { cn } from '../../lib/cn'
import CheckIcon from '../ui/CheckIcon'

type StepIndicatorProps = {
  steps: string[]
  current: number
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors',
              active && 'bg-surface-container-lowest',
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                active && 'bg-linear-135 from-primary to-primary-dim text-on-primary',
                done && 'bg-primary-container text-primary',
                !active && !done && 'bg-surface-container text-on-surface-variant',
              )}
            >
              {done ? <CheckIcon /> : index + 1}
            </span>
            <span className={cn('text-sm font-medium', active ? 'text-on-surface' : 'text-on-surface-variant')}>
              <span className="sr-only">Paso {index + 1}: </span>
              {label}
              {done && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
