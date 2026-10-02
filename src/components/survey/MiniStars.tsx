import { cn } from '../../lib/cn'
import { enter, illustrationIcons as icons } from '../illustration'
import { STAR_COUNT, starDelays } from './illustrationData'

type MiniStarsProps = {
  size?: 'md' | 'sm'
  // Las estrellas llenas aparecen una por una; la última pulsa y muestra `tooltip`.
  animated?: boolean
  tooltip?: string
  className?: string
}

const sizes = { md: 'size-5', sm: 'size-3' }

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d={icons.star[0]} />
    </svg>
  )
}

// Calificación con estrellas pequeñas para las ilustraciones. Cada estrella llena (primary) va
// sobre una vacía (tono neutro); animada, se llenan en secuencia. Con "reducir movimiento" se
// ven llenas desde el inicio. Decorativa.
export default function MiniStars({ size = 'md', animated = false, tooltip, className }: MiniStarsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const last = index === STAR_COUNT - 1
        return (
          <span key={index} className={cn('relative', sizes[size])}>
            <Star className={cn('absolute inset-0 text-on-surface/15', sizes[size])} />
            {animated && last && (
              <span className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-ping motion-safe:[animation-delay:1400ms]" />
            )}
            <Star
              className={cn('absolute inset-0 text-primary', sizes[size], animated && [enter, starDelays[index]])}
            />
            {last && tooltip && (
              <span
                className={cn(
                  'absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-inverse-surface px-2 py-1 text-xs font-medium whitespace-nowrap text-on-inverse-surface shadow-lg',
                  animated && [enter, '[animation-delay:1400ms]'],
                )}
              >
                {tooltip}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
