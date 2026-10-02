import { cn } from '../../lib/cn'

type Segment = {
  label: string
  // Trazos del ícono (Heroicons, viewBox 24×24); se dibuja relleno.
  icon?: string[]
}

type IllustrationSegmentedProps = {
  segments: Segment[]
  // Índice del segmento resaltado.
  selected?: number
  className?: string
}

// Selector segmentado decorativo (no enfocable): el segmento elegido en primary-container y los
// demás neutros, separados por una línea fina.
export default function IllustrationSegmented({ segments, selected = 0, className }: IllustrationSegmentedProps) {
  return (
    <div
      className={cn(
        'absolute flex items-stretch overflow-hidden rounded-lg bg-surface-container-lowest text-sm shadow-ambient ring-1 ring-on-surface/15',
        className,
      )}
    >
      {segments.map((segment, index) => (
        <span
          key={segment.label}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap',
            index > 0 && 'border-l border-on-surface/10',
            index === selected ? 'bg-primary-container font-medium text-primary' : 'text-on-surface-variant',
          )}
        >
          {segment.icon && (
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              {segment.icon.map((d) => (
                <path key={d} fillRule="evenodd" clipRule="evenodd" d={d} />
              ))}
            </svg>
          )}
          {segment.label}
        </span>
      ))}
    </div>
  )
}
