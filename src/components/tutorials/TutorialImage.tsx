import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Modal } from '../ui'

type TutorialImageProps = {
  src: string
  alt: string
  className?: string
}

// Captura de un paso, con alto máximo de 384 px. Al hacer clic se abre ampliada (completa) en un Modal.
export default function TutorialImage({ src, alt, className }: TutorialImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group flex w-full cursor-zoom-in justify-center overflow-hidden rounded-md bg-surface-container-low px-1.5 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-2 sm:py-4',
          className,
        )}
      >
        {/* Alto máximo de 384 px en todos los tamaños: las capturas horizontales no lo alcanzan;
            las verticales (p. ej. de celular) quedan centradas sobre el fondo tonal. El relleno del
            botón (vertical py-3 / sm:py-4 y horizontal a la mitad, px-1.5 / sm:px-2) separa la imagen
            de los bordes del fondo. */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-auto max-h-96 w-full object-contain transition-opacity group-hover:opacity-90"
        />
        <span className="sr-only"> (ampliar imagen)</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={alt} className="max-w-5xl">
        <img src={src} alt={alt} className="h-auto w-full rounded-md" />
      </Modal>
    </>
  )
}
