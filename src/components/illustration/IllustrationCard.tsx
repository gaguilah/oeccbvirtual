import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type IllustrationCardProps = {
  title: string
  // Trazos del ícono (Heroicons outline, viewBox 24×24).
  icon: string[]
  className?: string
  children?: ReactNode
}

// Tarjeta blanca (lowest) con encabezado e ícono; el cuerpo va sobre una banda tonal.
export default function IllustrationCard({ title, icon, className, children }: IllustrationCardProps) {
  return (
    <div
      className={cn(
        'absolute overflow-hidden rounded-lg bg-surface-container-lowest shadow-ambient ring-1 ring-on-surface/10',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5">
        <svg
          className="size-4 text-on-surface-variant"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
        >
          {icon.map((d) => (
            <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
        <span className="text-base font-medium text-on-surface">{title}</span>
      </div>
      <div className="space-y-2.5 bg-surface-container-low/60 px-4 py-3">{children}</div>
    </div>
  )
}

// Fila de una tarjeta: contenido a la izquierda y estado a la derecha.
export function IllustrationRow({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 font-medium whitespace-nowrap text-on-surface-variant">
        {children}
      </span>
      {status}
    </div>
  )
}
