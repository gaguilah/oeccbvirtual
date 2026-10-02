import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Fade = 'right' | 'left' | 'bottom'

type Ratio = '512/400' | '3/2'

type IllustrationCanvasProps = {
  // Hacia dónde se desvanece el contenido que sale del cuadro: 'right' (inicio, Contacto),
  // 'left' (un panel que sale por la izquierda, como en Avisos de Remate) o 'bottom' (solo abajo,
  // para composiciones planas como Tutoriales).
  fade?: Fade
  // Texto un poco más pequeño (≈ 12 %), para composiciones con más contenido.
  compact?: boolean
  // Sin inclinación (plano recto).
  flat?: boolean
  // Proporción del lienzo: 512 × 400 unidades (por defecto) o 3:2 (512 × 341).
  ratio?: Ratio
  className?: string
  children?: ReactNode
}

const fades: Record<Fade, string> = {
  right: 'mask-l-from-92% mask-r-from-80% mask-b-from-75%',
  left: 'mask-l-from-82% mask-r-from-95% mask-t-from-95% mask-b-from-90%',
  bottom: 'mask-b-from-70%',
}

const ratios: Record<Ratio, string> = {
  '512/400': 'aspect-512/400',
  '3/2': 'aspect-3/2',
}

// Marco de las ilustraciones decorativas: lienzo de 512 unidades de ancho que escala con el ancho
// (utilidad illustration-scale), plano inclinado (o recto con `flat`), trama de puntos y bordes
// desvanecidos. Los hijos se posicionan en unidades con las clases normales (top-12, left-11, w-80).
export default function IllustrationCanvas({
  fade = 'right',
  compact = false,
  flat = false,
  ratio = '512/400',
  className,
  children,
}: IllustrationCanvasProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '@container relative w-full cursor-default overflow-hidden select-none',
        ratios[ratio],
        fades[fade],
        className,
      )}
    >
      <div className="illustration-scale absolute inset-0">
        <div
          className={cn(
            'absolute top-0 size-full',
            flat ? 'left-0' : 'left-6 origin-top-left transform-[matrix(0.996195,0.0871557,-0.173648,0.984808,0,0)]',
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
