import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Fade = 'right' | 'left'

type IllustrationCanvasProps = {
  // Hacia dónde se desvanece el contenido que sale del cuadro: 'right' (inicio, Contacto) o
  // 'left' (un panel que sale por la izquierda, como en Avisos de Remate).
  fade?: Fade
  // Texto un poco más pequeño (≈ 12 %), para composiciones con más contenido.
  compact?: boolean
  className?: string
  children?: ReactNode
}

const fades: Record<Fade, string> = {
  right: 'mask-l-from-92% mask-r-from-80% mask-b-from-75%',
  left: 'mask-l-from-82% mask-r-from-95% mask-t-from-95% mask-b-from-90%',
}

// Marco de las ilustraciones decorativas: lienzo de 512 × 400 unidades que escala con el ancho
// (utilidad illustration-scale), plano inclinado, trama de puntos y bordes desvanecidos.
// Los hijos se posicionan en unidades del plano con las clases normales (top-12, left-11, w-80).
export default function IllustrationCanvas({
  fade = 'right',
  compact = false,
  className,
  children,
}: IllustrationCanvasProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '@container relative aspect-512/400 w-full cursor-default overflow-hidden select-none',
        fades[fade],
        className,
      )}
    >
      <div className="illustration-scale absolute inset-0">
        <div
          className={cn(
            'absolute top-0 left-6 size-full origin-top-left transform-[matrix(0.996195,0.0871557,-0.173648,0.984808,0,0)]',
            compact && 'illustration-compact',
          )}
        >
          <div className="illustration-dots absolute -top-20 -left-20 h-150 w-200" />
          {children}
        </div>
      </div>
    </div>
  )
}
