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
import { Badge } from '../ui'
import { mainPanel, todayPanel, videoIcon, week } from './illustrationData'

// Ilustración decorativa de Audiencias: agenda del día que sale por la izquierda, semana con
// bloques y una audiencia virtual con su enlace de conexión y la grabación.
export default function AudienciasIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas fade="left" compact className={className}>
      <IllustrationPanel label={todayPanel.label} className={cn('top-8 -left-10 h-84 w-52', enter)}>
        <IllustrationCard title={todayPanel.today.title} icon={icons.clock} className={cn('top-10 left-4 w-44', lift)}>
          {todayPanel.today.rows.map((row) => (
            <IllustrationRow
              key={row.time}
              status={<Badge variant={row.status === 'Virtual' ? 'primary' : 'neutral'}>{row.status}</Badge>}
            >
              {row.time}
            </IllustrationRow>
          ))}
        </IllustrationCard>
        <IllustrationCard
          title={todayPanel.done.title}
          icon={icons.checkCircle}
          className={cn('top-46 left-4 w-44', lift)}
        >
          {todayPanel.done.rows.map((time) => (
            <IllustrationRow key={time} status={<Badge variant="success">Realizada</Badge>}>
              {time}
            </IllustrationRow>
          ))}
        </IllustrationCard>
      </IllustrationPanel>

      <div className={cn(connector, 'top-26 left-42 h-px w-6', enter, '[--illustration-delay:150ms]')} />

      <IllustrationPanel label={mainPanel.label} className={cn('top-2 left-44 h-96 w-84', enter)}>
        <IllustrationHatch className={cn('top-12 left-6 h-44 w-76', enter, '[--illustration-delay:150ms]')} />
        <IllustrationCard
          title={mainPanel.week}
          icon={icons.calendar}
          className={cn('top-10 left-4 h-44 w-76', enter, '[--illustration-delay:150ms]', lift)}
        >
          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {week.days.map((day, index) => (
              <span key={index} className="font-semibold text-on-surface-variant/70">
                {day}
              </span>
            ))}
            {week.days.map((_, index) => (
              <div key={index} className="relative h-24 rounded-md bg-surface-container-lowest/80">
                {week.blocks
                  .filter((block) => block.day === index)
                  .map((block) => (
                    <span
                      key={block.className}
                      className={cn(
                        'absolute inset-x-1 rounded',
                        block.selected ? 'bg-linear-135 from-primary to-primary-dim' : 'bg-primary/25',
                        block.className,
                        enter,
                        block.delay,
                      )}
                    />
                  ))}
              </div>
            ))}
          </div>
        </IllustrationCard>

        <IllustrationHatch
          tone="neutral"
          className={cn('top-58 left-4 h-37 w-76', enter, '[--illustration-delay:300ms]')}
        />
        <IllustrationCard
          title={mainPanel.hearing}
          icon={videoIcon}
          className={cn('top-56 left-2 h-37 w-76', enter, '[--illustration-delay:300ms]', lift)}
        >
          <p className="text-sm font-medium text-on-surface-variant">{mainPanel.hearingTime}</p>
          <div className="flex gap-2">
            <IllustrationButton variant="primary" icon={videoIcon}>
              {mainPanel.connect}
            </IllustrationButton>
            <IllustrationButton icon={icons.play}>{mainPanel.recording}</IllustrationButton>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400',
              enter,
              '[--illustration-delay:1200ms]',
            )}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
            </svg>
            {mainPanel.recorded}
          </span>
        </IllustrationCard>
      </IllustrationPanel>
    </IllustrationCanvas>
  )
}
