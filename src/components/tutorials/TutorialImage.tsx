import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Modal } from '../ui'

type TutorialImageProps = {
  src: string
  alt: string
  className?: string
}

// Captura de un paso. Al hacer clic se abre ampliada en un Modal.
export default function TutorialImage({ src, alt, className }: TutorialImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group block w-full cursor-zoom-in overflow-hidden rounded-md bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          className,
        )}
      >
        <img src={src} alt={alt} loading="lazy" className="h-auto w-full transition-opacity group-hover:opacity-90" />
        <span className="sr-only"> (ampliar imagen)</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={alt} className="max-w-5xl">
        <img src={src} alt={alt} className="h-auto w-full rounded-md" />
      </Modal>
    </>
  )
}
