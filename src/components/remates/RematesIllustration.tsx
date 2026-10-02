import { cn } from '../../lib/cn'
import {
  IllustrationButton,
  IllustrationCanvas,
  IllustrationCard,
  IllustrationHatch,
  IllustrationPanel,
  IllustrationRow,
  connector,
  enter,
  illustrationIcons as icons,
  lift,
} from '../illustration'
import { mainPanel, statusPanel } from './illustrationData'
import MiniCalendar from './MiniCalendar'
import RemateStatusBadge from './RemateStatusBadge'

// Ilustración decorativa de Avisos de Remate (ver docs/plan-remates-ilustracion.md): panel de
// estado que sale por la izquierda, agenda con calendario y aviso con descarga simulada.
export default function RematesIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas fade="left" compact className={className}>
      {/* Panel de estado: sale por el borde izquierdo y se desvanece. */}
      <IllustrationPanel label={statusPanel.label} className={cn('top-8 -left-10 h-84 w-52', enter)}>
        <IllustrationCard
          title={statusPanel.upcoming.title}
          icon={icons.calendar}
          className={cn('top-10 left-4 w-44', lift)}
        >
          {statusPanel.upcoming.times.map((time) => (
            <IllustrationRow key={time} status={<RemateStatusBadge realizado={false} />}>
              {time}
            </IllustrationRow>
          ))}
        </IllustrationCard>
        <IllustrationCard
          title={statusPanel.past.title}
          icon={icons.checkCircle}
          className={cn('top-46 left-4 w-44', lift)}
        >
          {statusPanel.past.times.map((time) => (
            <IllustrationRow key={time} status={<RemateStatusBadge realizado />}>
              {time}
            </IllustrationRow>
          ))}
        </IllustrationCard>
      </IllustrationPanel>

      {/* Línea del panel de estado a la agenda. */}
      <div className={cn(connector, 'top-26 left-42 h-px w-6', enter, '[--illustration-delay:150ms]')} />

      <IllustrationPanel label={mainPanel.label} className={cn('top-2 left-44 h-96 w-84', enter)}>
        {/* Agenda: rayado primary detrás, desplazado 2 unidades de espaciado. */}
        <IllustrationHatch className={cn('top-12 left-6 h-48 w-76', enter, '[--illustration-delay:150ms]')} />
        <IllustrationCard
          title={mainPanel.agenda}
          icon={icons.calendar}
          className={cn('top-10 left-4 h-48 w-76', enter, '[--illustration-delay:150ms]', lift)}
        >
          <MiniCalendar />
        </IllustrationCard>

        {/* Aviso: rayado neutro detrás y descarga simulada. */}
        <IllustrationHatch
          tone="neutral"
          className={cn('top-62 left-4 h-30 w-76', enter, '[--illustration-delay:300ms]')}
        />
        <IllustrationCard
          title={mainPanel.notice}
          icon={icons.document}
          className={cn('top-60 left-2 h-30 w-76', enter, '[--illustration-delay:300ms]', lift)}
        >
          <div className="flex gap-2">
            <IllustrationButton icon={icons.eye}>Ver aviso</IllustrationButton>
            <IllustrationButton variant="primary" icon={icons.download}>
              Descargar PDF
            </IllustrationButton>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-on-surface/10">
              <div className="h-full w-full rounded-full bg-primary motion-safe:animate-illustration-fill [--illustration-delay:900ms]" />
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 font-medium text-green-700 dark:text-green-400',
                enter,
                '[--illustration-delay:1900ms]',
              )}
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
              </svg>
              {mainPanel.downloaded}
            </span>
          </div>
        </IllustrationCard>
      </IllustrationPanel>
    </IllustrationCanvas>
  )
}
