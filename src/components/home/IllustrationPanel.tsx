import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type IllustrationPanelProps = {
  label: string
  className?: string
  children?: ReactNode
}

// Panel tonal con una etiqueta arriba a la izquierda (agrupa tarjetas de la ilustración).
export default function IllustrationPanel({ label, className, children }: IllustrationPanelProps) {
  return (
    <div className={cn('absolute rounded-xl bg-surface-container-low/80', className)}>
      <span className="absolute top-3 left-4 text-xs text-on-surface-variant">{label}</span>
      {children}
    </div>
  )
}
