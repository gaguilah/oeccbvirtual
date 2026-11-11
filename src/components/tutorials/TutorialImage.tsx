import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Modal } from '../ui'
import { containedRect, isOnScreen, ZOOM_DURATION_MS, ZOOM_EASING, zoomStartTransform } from './zoom'

type TutorialImageProps = {
  src: string
  alt: string
  className?: string
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Anima el diálogo entre la miniatura y su lugar final: al abrir crece desde la miniatura y al
// cerrar vuelve a ella (si se ve en pantalla; si no, solo se desvanece). También el fondo.
function animateZoom(dialog: HTMLDialogElement, thumb: HTMLImageElement, zoom: HTMLImageElement, closing: boolean) {
  const thumbRect = thumb.getBoundingClientRect()
  const from = containedRect(thumbRect, thumb.naturalWidth, thumb.naturalHeight)
  const start =
    closing && !isOnScreen(thumbRect, window.innerHeight)
      ? null
      : zoomStartTransform(dialog.getBoundingClientRect(), zoom.getBoundingClientRect(), from)
  const timing: KeyframeAnimationOptions = { duration: ZOOM_DURATION_MS, easing: ZOOM_EASING, fill: 'forwards' }
  const order = <T,>(frames: T[]) => (closing ? [...frames].reverse() : frames)
  const small = start ? { transform: start, opacity: closing ? 0 : 0.6 } : { transform: 'none', opacity: 0 }
  return [
    dialog.animate(order([{ opacity: 0 }, { opacity: 1 }]), { ...timing, pseudoElement: '::backdrop' }),
    dialog.animate(
      order([
        { transformOrigin: '0 0', ...small },
        { transformOrigin: '0 0', transform: 'none', opacity: 1 },
      ]),
      timing,
    ),
  ]
}

// Captura de un paso, con alto máximo de 384 px. Al hacer clic se abre ampliada (completa) en un
// Modal, que crece desde la miniatura y vuelve a ella al cerrar (sin animación con movimiento
// reducido).
export default function TutorialImage({ src, alt, className }: TutorialImageProps) {
  const [open, setOpen] = useState(false)
  const thumbRef = useRef<HTMLImageElement>(null)
  const zoomRef = useRef<HTMLImageElement>(null)
  const closingRef = useRef(false)

  // Cierra con la animación inversa; al terminar cierra el diálogo y quita las animaciones (en ese
  // orden, para que no se vea un cuadro con el diálogo grande otra vez).
  function close() {
    const thumb = thumbRef.current
    const zoom = zoomRef.current
    const dialog = zoom?.closest('dialog')
    if (closingRef.current) return
    if (!thumb || !zoom || !dialog?.open || reducedMotion()) {
      setOpen(false)
      return
    }
    closingRef.current = true
    dialog.getAnimations().forEach((animation) => animation.cancel())
    const animations = animateZoom(dialog, thumb, zoom, true)
    void Promise.all(animations.map((animation) => animation.finished))
      .catch(() => undefined)
      .then(() => {
        dialog.close()
        animations.forEach((animation) => animation.cancel())
        closingRef.current = false
        setOpen(false)
      })
  }

  // Último close() para el listener de Escape.
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  // Corre después de que el Modal (hijo) llamó a showModal(); al venir de un clic, React lo ejecuta
  // antes de pintar, así que no se ve un cuadro con el diálogo en su lugar final.
  useEffect(() => {
    const thumb = thumbRef.current
    const zoom = zoomRef.current
    const dialog = zoom?.closest('dialog')
    if (!open || !thumb || !zoom || !dialog || reducedMotion()) return
    const animations = animateZoom(dialog, thumb, zoom, false)
    // Escape: el diálogo nativo se cerraría de golpe; se detiene para cerrar con la animación.
    const onCancel = (e: Event) => {
      e.preventDefault()
      closeRef.current()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      animations.forEach((animation) => animation.cancel())
    }
  }, [open])

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
          ref={thumbRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-96 w-full object-contain transition-opacity group-hover:opacity-90"
        />
        <span className="sr-only"> (ampliar imagen)</span>
      </button>
      <Modal open={open} onClose={close} title={alt} className="max-w-5xl">
        <img ref={zoomRef} src={src} alt={alt} className="h-auto w-full rounded-md" />
      </Modal>
    </>
  )
}
