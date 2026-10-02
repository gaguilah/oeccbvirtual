import { cn } from '../../lib/cn'
import { enter } from '../illustration'
import { calendar } from './illustrationData'

// Mini calendario de la ilustración: puntos en los días con remate (aparecen uno tras otro) y
// el día seleccionado con pulso y un globo oscuro. Decorativo, sin mes ni año.
export default function MiniCalendar({ className }: { className?: string }) {
  const cells = [...Array<null>(calendar.offset).fill(null), ...Array.from({ length: calendar.days }, (_, i) => i + 1)]

  return (
    <div className={cn('grid grid-cols-7 gap-x-1 gap-y-0.5 text-center text-xs', className)}>
      {calendar.weekdays.map((weekday, index) => (
        <span key={index} className="pb-1 font-semibold text-on-surface-variant/70">
          {weekday}
        </span>
      ))}
      {cells.map((day, index) => {
        if (day === null) return <span key={`empty-${index}`} />
        const dot = calendar.dots.find((d) => d.day === day)
        const selected = day === calendar.selected

        return (
          <span
            key={day}
            className={cn(
              'relative flex h-5 items-start justify-center rounded-md pt-0.5',
              selected
                ? 'bg-linear-135 from-primary to-primary-dim font-semibold text-on-primary'
                : 'text-on-surface-variant',
            )}
          >
            {day}
            {dot && <span className={cn('absolute bottom-0.5 size-1 rounded-full bg-primary', enter, dot.delay)} />}
            {selected && (
              <>
                <span className="absolute inset-0 rounded-md bg-primary/40 motion-safe:animate-ping" />
                <span
                  className={cn(
                    'absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-inverse-surface px-2 py-1 font-medium whitespace-nowrap text-on-inverse-surface shadow-lg',
                    enter,
                    '[animation-delay:300ms]',
                  )}
                >
                  {calendar.tooltip}
                </span>
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
