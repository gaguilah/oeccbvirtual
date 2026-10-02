import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type IllustrationCanvasProps = {
  className?: string
  children?: ReactNode
}

// Marco de las ilustraciones decorativas: lienzo de 512 × 400 unidades que escala con el ancho
// (utilidad illustration-scale), plano inclinado, trama de puntos y bordes desvanecidos.
// Los hijos se posicionan en unidades del plano con las clases normales (top-12, left-11, w-80).
export default function IllustrationCanvas({ className, children }: IllustrationCanvasProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '@container relative aspect-[512/400] w-full cursor-default overflow-hidden select-none mask-l-from-92% mask-r-from-80% mask-b-from-75%',
        className,
      )}
    >
      <div className="illustration-scale absolute inset-0">
        <div className="absolute top-0 left-6 size-full origin-top-left [transform:matrix(0.996195,0.0871557,-0.173648,0.984808,0,0)]">
          <div className="illustration-dots absolute -top-20 -left-20 h-150 w-200" />
          {children}
        </div>
      </div>
    </div>
  )
}
