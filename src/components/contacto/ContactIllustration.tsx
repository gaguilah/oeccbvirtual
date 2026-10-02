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
import { contactAttention, contactEmail, contactMap } from './data'
import MapSketch from './MapSketch'

// Ilustración decorativa de la página de contacto (ver docs/plan-contacto.md):
// mapa esquemático con la dirección, un correo nuevo y el horario de atención.
export default function ContactIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas className={className}>
      <IllustrationPanel label={contactMap.panel} className={cn('top-4 left-8 h-92 w-88', enter)} />

      {/* Líneas que conectan con el panel de atención. */}
      <div className={cn(connector, 'top-28 left-91 h-px w-11', enter, '[--illustration-delay:450ms]')} />
      <div
        className={cn(
          connectorCorner,
          'top-54 left-86 h-18 w-12 rounded-br-lg border-r border-b',
          enter,
          '[--illustration-delay:450ms]',
        )}
      />

      <IllustrationCard
        title={contactMap.title}
        icon={icons.mapPin}
        className={cn('top-12 left-11 w-80', enter, '[--illustration-delay:150ms]', lift)}
      >
        <MapSketch />
        <div>
          <p className="text-base font-semibold text-on-surface">{contactMap.address}</p>
          <p className="text-sm text-on-surface-variant">{contactMap.city}</p>
        </div>
      </IllustrationCard>

      <IllustrationMenu
        items={[
          { label: 'Cómo llegar', icon: icons.directions },
          { label: 'Copiar dirección', icon: icons.copy },
        ]}
        className={cn('top-1 left-50 w-48', enter, '[--illustration-delay:300ms]', lift)}
      />

      <IllustrationCard
        title={contactEmail.title}
        icon={icons.mail}
        className={cn('top-64 left-6 w-80', enter, '[--illustration-delay:300ms]', lift)}
      >
        <IllustrationRow>
          <span className="shrink-0 text-on-surface-variant/70">Para</span>
          <span className="truncate text-on-surface">{contactEmail.to}</span>
        </IllustrationRow>
        <IllustrationRow>
          <span className="shrink-0 text-on-surface-variant/70">Asunto</span>
          <span className="truncate text-on-surface">{contactEmail.subject}</span>
        </IllustrationRow>
        <div className="space-y-1.5 pt-1">
          <div className="h-2 w-11/12 rounded-full bg-on-surface/10" />
          <div className="h-2 w-2/3 rounded-full bg-on-surface/10" />
        </div>
      </IllustrationCard>

      <IllustrationPanel
        label={contactAttention.panel}
        className={cn('top-6 left-102 h-56 w-88', enter, '[--illustration-delay:450ms]')}
      >
        <IllustrationCard title={contactAttention.title} icon={icons.clock} className={cn('top-10 left-2 w-80', lift)}>
          <IllustrationRow>{contactAttention.days}</IllustrationRow>
          <IllustrationRow status={<StatusDot label={contactAttention.note} />}>
            {contactAttention.hours}
          </IllustrationRow>
          {contactAttention.channels.map((channel) => (
            <IllustrationRow key={channel} status={<StatusDot label={contactAttention.channelStatus} />}>
              {channel}
            </IllustrationRow>
          ))}
        </IllustrationCard>
      </IllustrationPanel>
    </IllustrationCanvas>
  )
}
