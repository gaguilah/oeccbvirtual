import { cn } from '../../lib/cn'
import {
  IllustrationCanvas,
  IllustrationCard,
  IllustrationMenu,
  IllustrationPanel,
  IllustrationRow,
  StatusDot,
  connector,
  connectorCorner,
  enter,
  illustrationIcons as icons,
  lift,
} from '../illustration'
import { heroPqrs, heroPublications, heroTutorials } from './data'

// Ilustración decorativa del hero del inicio (ver docs/plan-hero.md).
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas className={className}>
      <IllustrationPanel label="Servicios en línea" className={cn('top-4 left-8 h-90 w-88', enter)} />

      {/* Líneas que conectan con el panel de publicaciones. */}
      <div className={cn(connector, 'top-28 left-91 h-px w-11', enter, '[animation-delay:450ms]')} />
      <div
        className={cn(
          connectorCorner,
          'top-54 left-86 h-14 w-12 rounded-br-lg border-r border-b',
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
    </IllustrationCanvas>
  )
}
