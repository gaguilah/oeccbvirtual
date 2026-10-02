import { cn } from '../../lib/cn'
import { heroPqrs, heroPublications, heroTutorials } from './data'
import IllustrationCard, { IllustrationRow } from './IllustrationCard'
import IllustrationMenu from './IllustrationMenu'
import IllustrationPanel from './IllustrationPanel'
import StatusDot from './StatusDot'

// Íconos Heroicons outline (viewBox 24×24).
const icons = {
  play: [
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z',
  ],
  mail: [
    'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
  ],
  document: [
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  ],
  playSolid: [
    'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
  ],
  arrow: ['M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3'],
}

// Entrada escalonada; con "reducir movimiento" no se anima.
const enter = 'motion-safe:animate-hero-in'
// Las tarjetas se elevan al pasar el mouse (propiedad translate, independiente de la animación).
const lift = 'transition-[translate] duration-300 ease-out hover:-translate-x-1 hover:-translate-y-1'

// Ilustración decorativa del hero (ver docs/plan-hero.md). Diseño de 512 × 400 unidades que
// escala con el ancho (utilidad hero-scale) sobre un plano inclinado como el de Laravel Cloud.
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '@container relative aspect-[512/400] w-full cursor-default overflow-hidden select-none mask-l-from-92% mask-r-from-80% mask-b-from-75%',
        className,
      )}
    >
      <div className="hero-scale absolute inset-0">
        <div className="absolute top-0 left-6 size-full origin-top-left [transform:matrix(0.996195,0.0871557,-0.173648,0.984808,0,0)]">
          {/* Trama de puntos de fondo. */}
          <div className="hero-dots absolute -top-20 -left-20 h-150 w-200" />

          <IllustrationPanel label="Servicios en línea" className={cn('top-4 left-8 h-90 w-88', enter)} />

          {/* Líneas que conectan con el panel de publicaciones. */}
          <div className={cn('absolute top-28 left-91 h-px w-11 bg-on-surface/15', enter, '[animation-delay:450ms]')} />
          <div
            className={cn(
              'absolute top-54 left-86 h-14 w-12 rounded-br-lg border-r border-b border-on-surface/15',
              enter,
              '[animation-delay:450ms]',
            )}
          />

          <IllustrationCard
            title="Tutoriales"
            icon={icons.play}
            className={cn('top-12 left-11 w-80', enter, '[animation-delay:150ms]', lift)}
          >
            {heroTutorials.map((tutorial) => (
              <IllustrationRow
                key={tutorial.number}
                status={<span className="shrink-0 text-on-surface-variant/70">{tutorial.steps} pasos</span>}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary-container text-xs font-semibold text-primary">
                  {tutorial.number}
                </span>
                <span className="truncate">{tutorial.title}</span>
              </IllustrationRow>
            ))}
          </IllustrationCard>

          <IllustrationMenu
            items={[
              { label: 'Ver tutorial', icon: icons.playSolid },
              { label: 'Paso siguiente', icon: icons.arrow },
            ]}
            className={cn('top-1 left-42 w-52', enter, '[animation-delay:300ms]', lift)}
          />

          <IllustrationCard
            title={heroPqrs.title}
            icon={icons.mail}
            className={cn('top-60 left-6 w-80', enter, '[animation-delay:300ms]', lift)}
          >
            <IllustrationRow status={<StatusDot label={heroPqrs.status} />}>{heroPqrs.row}</IllustrationRow>
            <p className="text-sm text-on-surface-variant/70">{heroPqrs.hint}</p>
          </IllustrationCard>

          <IllustrationPanel
            label={heroPublications.panel}
            className={cn('top-6 left-102 h-50 w-88', enter, '[animation-delay:450ms]')}
          >
            <IllustrationCard
              title={heroPublications.title}
              icon={icons.document}
              className={cn('top-10 left-2 w-80', lift)}
            >
              {heroPublications.rows.map((row) => (
                <IllustrationRow key={row} status={<StatusDot label={heroPublications.status} />}>
                  {row}
                </IllustrationRow>
              ))}
            </IllustrationCard>
          </IllustrationPanel>
        </div>
      </div>
    </div>
  )
}
