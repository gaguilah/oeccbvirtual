import { cn } from '../../lib/cn'
import { enter, illustrationIcons as icons } from '../illustration'
import { steps } from './illustrationData'

// Los ✓ de los pasos completados aparecen uno tras otro (clases completas para Tailwind).
const checkDelays = ['[--illustration-delay:300ms]', '[--illustration-delay:450ms]', '[--illustration-delay:600ms]']

// Indicador de pasos en miniatura (como StepIndicator): pasos anteriores completados con ✓ y el
// último activo con degradado primary. Decorativo.
export default function MiniSteps({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: steps.count }, (_, index) => {
          const active = index === steps.count - 1
          return (
            <span key={index} className="flex items-center gap-1">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs font-semibold',
                  active
                    ? 'bg-linear-135 from-primary to-primary-dim text-on-primary'
                    : 'bg-primary-container text-primary',
                )}
              >
                {active ? (
                  index + 1
                ) : (
                  <svg
                    className={cn('size-3', enter, checkDelays[index])}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
                  </svg>
                )}
              </span>
              {!active && <span className="h-px w-3 bg-primary/40" />}
            </span>
          )
        })}
      </div>
      <span className="truncate text-xs font-medium text-on-surface-variant">{steps.current}</span>
    </div>
  )
}
