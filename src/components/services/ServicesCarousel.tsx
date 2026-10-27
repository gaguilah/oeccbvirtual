import { useId, useRef, useState } from 'react'
import { Button } from '../ui'
import { nearestIndex, wrapIndex } from './carousel'
import { SERVICES_INTRO, type Service } from './data'
import ServiceSlide from './ServiceSlide'

function Chevron({ d }: { d: string }) {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

// Servicios del inicio como carrusel (docs/plan-inicio-servicios.md). Desplazamiento nativo con
// scroll snap: cada tarjeta se alinea al borde izquierdo del contenido y la fila sale hasta el
// borde derecho de la ventana (--bleed), donde se corta la siguiente. Celular: una tarjeta y un
// borde de la siguiente; desde md, una y media; desde lg, el título, la frase y los botones pasan
// a una columna a la izquierda (¼) y la tarjeta mide la mitad del contenido. Los botones dan la
// vuelta (de la última a la primera y al revés); un espacio al final deja llegar la última al
// inicio. Sin avance automático.
export default function ServicesCarousel({ services }: { services: Service[] }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [announcement, setAnnouncement] = useState('')
  const titleId = useId()

  // Lleva la tarjeta al inicio de la fila (instantáneo con "reducir movimiento").
  function scrollToCard(card: HTMLElement) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    trackRef.current?.scrollTo({ left: card.offsetLeft, behavior: reduce ? 'auto' : 'smooth' })
  }

  function go(step: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const cards = [...track.children] as HTMLElement[]
    const current = nearestIndex(
      cards.map((card) => card.offsetLeft),
      track.scrollLeft,
    )
    const next = wrapIndex(current + step, cards.length)
    scrollToCard(cards[next])
    setAnnouncement(`Servicio ${next + 1} de ${cards.length}: ${services[next].title}`)
  }

  return (
    <section
      aria-labelledby={titleId}
      aria-roledescription="carrusel"
      className="grid gap-8 lg:grid-cols-4 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6"
    >
      <div className="space-y-3 lg:col-start-1 lg:row-start-1">
        <h2 id={titleId} className="font-sans text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Servicios
        </h2>
        <p className="max-w-md font-display text-xl font-bold tracking-[-0.02em] text-on-surface sm:text-2xl">
          {SERVICES_INTRO}
        </p>
      </div>

      {/* @container: los anchos de las tarjetas se miden contra esta columna (cqw), no contra la
          fila, que es más ancha porque sale hasta el borde de la ventana. */}
      <div className="@container min-w-0 lg:col-span-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ul
          ref={trackRef}
          // Con Tab, la tarjeta enfocada se alinea al inicio (el navegador solo la acercaría al borde).
          // Solo con teclado (:focus-visible): con un clic o un toque, la fila no se mueve antes de
          // abrir el enlace.
          onFocus={(event) => {
            const target = event.target as HTMLElement
            const card = target.closest('li')
            if (!card || !target.matches(':focus-visible')) return
            if (Math.abs(card.offsetLeft - event.currentTarget.scrollLeft) > 1) scrollToCard(card)
          }}
          className={[
            'relative flex snap-x snap-mandatory gap-(--gap) overflow-x-auto overscroll-x-contain',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            // Ancho de cada tarjeta y separación: celular, una y un borde; desde md, una y media.
            '[--card:calc(100cqw-2rem)] [--gap:1rem] md:[--card:calc((100cqw-1.5rem)/1.5)] md:[--gap:1.5rem]',
            // Hasta el borde derecho de la ventana: margen lateral del Container (px-4, sm:px-8,
            // lg:px-16) más lo que sobra a los lados de su max-w-7xl.
            '[--bleed:calc(1rem+max(0px,(100vw-80rem)/2))] sm:[--bleed:calc(2rem+max(0px,(100vw-80rem)/2))] lg:[--bleed:calc(4rem+max(0px,(100vw-80rem)/2))]',
            'mr-[calc(-1*var(--bleed))] pr-(--bleed)',
            // Espacio final para que la última tarjeta también llegue al inicio.
            "after:w-[calc(100cqw-var(--card)-var(--gap))] after:shrink-0 after:content-['']",
          ].join(' ')}
        >
          {services.map((service, index) => (
            <li
              key={service.to}
              aria-label={`${index + 1} de ${services.length}`}
              className="w-(--card) shrink-0 snap-start"
            >
              <ServiceSlide service={service} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-3 lg:col-start-1 lg:row-start-2 lg:justify-start lg:self-start">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Servicio anterior"
          onClick={() => go(-1)}
          className="size-11 rounded-full bg-surface-container-lowest hover:bg-surface-container"
        >
          <Chevron d="M15.75 19.5 8.25 12l7.5-7.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Servicio siguiente"
          onClick={() => go(1)}
          className="size-11 rounded-full bg-surface-container-lowest hover:bg-surface-container"
        >
          <Chevron d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  )
}
