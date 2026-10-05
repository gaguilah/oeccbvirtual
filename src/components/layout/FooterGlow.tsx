import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

// Cada capa: más ancha que el footer en una repetición del patrón (706.16 px) y desplazada esa
// distancia en bucle (animate-glow-scroll). La de cobertura va ~3,4 veces más rápido.
const layer =
  'absolute inset-y-0 left-0 w-[calc(100%+706.16px)] [--glow-repeat:706.16px] motion-safe:animate-glow-scroll'

// Luz que recorre el footer de derecha a izquierda (ver docs/plan-footer.md). Decorativa: va
// detrás del contenido, sin interacción. Se pausa cuando el footer no está en pantalla y queda
// quieta con "reducir movimiento". Colores con tokens: funciona en ambos temas.
export default function FooterGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const dotsId = useId()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // La pausa va en una variable que lee el atajo `animation` (una clase animation-play-state aparte
  // quedaría antes en el CSS que motion-safe:animate-… y se perdería).
  const playState = visible ? '[--glow-play:running]' : '[--glow-play:paused]'

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden mask-b-from-30% mask-b-to-70% mask-r-from-90% mask-l-from-60%',
        className,
      )}
    >
      <div className="absolute inset-0 opacity-20 [--glow-bg:var(--color-surface-container-low)]">
        <div className="absolute inset-0 blur-md">
          <div className={cn(layer, 'glow-stripes-light [--glow-duration:12s]', playState)} />
        </div>
        <div className="absolute inset-0 blur-md">
          <div className={cn(layer, 'glow-stripes-cover [--glow-duration:3.5s]', playState)} />
        </div>
      </div>
      <svg className="absolute inset-0 size-full text-surface-container-lowest/50">
        <defs>
          <pattern id={dotsId} x="-3" y="-3" width="9.5" height="9.5" patternUnits="userSpaceOnUse">
            <rect x="1" y="1" width="1.5" height="1.5" rx="0.75" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${dotsId})`} />
      </svg>
    </div>
  )
}
