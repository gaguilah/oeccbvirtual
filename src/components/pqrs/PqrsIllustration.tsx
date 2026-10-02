import { cn } from '../../lib/cn'
import {
  IllustrationButton,
  IllustrationCanvas,
  IllustrationCard,
  IllustrationHatch,
  IllustrationPanel,
  IllustrationRow,
  StatusDot,
  connector,
  enter,
  illustrationIcons as icons,
  lift,
} from '../illustration'
import { texts, typeOptions } from './illustrationData'
import MiniSteps from './MiniSteps'

// Ilustración decorativa de PQRS (ver docs/plan-pqrs-ilustracion.md): el recorrido del formulario
// real. Se elige el tipo, el texto se escribe solo, se verifica y llega la confirmación.
// Con "reducir movimiento" se ve directamente el estado final.
export default function PqrsIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas fade="left" compact className={className}>
      {/* Paso 1: tipos de solicitud (sale por el borde izquierdo y se desvanece). */}
      <IllustrationPanel label={texts.formPanel} className={cn('top-6 -left-10 h-88 w-52', enter)}>
        <IllustrationCard title={texts.typeCard} icon={icons.document} className={cn('top-10 left-4 w-44', lift)}>
          <div className="space-y-1.5">
            {typeOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1 text-sm',
                  option.selected
                    ? 'bg-primary-container font-semibold text-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant',
                )}
              >
                {option.label}
                {option.selected && (
                  <svg
                    className="size-3.5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </IllustrationCard>
      </IllustrationPanel>

      {/* Línea de los tipos a la solicitud. */}
      <div className={cn(connector, 'top-26 left-42 h-px w-6', enter, '[animation-delay:150ms]')} />

      <IllustrationPanel label={texts.mainPanel} className={cn('top-2 left-44 h-96 w-84', enter)}>
        {/* Paso 3: la solicitud se escribe sola. */}
        <IllustrationHatch className={cn('top-12 left-6 h-52 w-76', enter, '[animation-delay:150ms]')} />
        <IllustrationCard
          title={texts.requestCard}
          icon={icons.mail}
          className={cn('top-10 left-4 h-52 w-76', enter, '[animation-delay:150ms]', lift)}
        >
          <MiniSteps />
          <div className="grid grid-cols-2 gap-3">
            {[texts.name, texts.email].map((field) => (
              <div key={field} className="space-y-1">
                <span className="block text-xs text-on-surface-variant/70">{field}</span>
                <span className="block h-2 rounded-full bg-on-surface/10" />
              </div>
            ))}
          </div>
          <div className="flex h-8 items-start rounded-t-md border-b border-primary bg-surface-variant px-2 pt-1.5 text-sm text-on-surface">
            <span className="inline-block max-w-full overflow-hidden whitespace-nowrap motion-safe:animate-illustration-type motion-safe:[animation-delay:600ms]">
              {texts.summary}
            </span>
            <span className="ml-px h-[1.2em] w-0.5 shrink-0 bg-primary motion-safe:animate-illustration-caret" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="flex size-4 items-center justify-center rounded-sm bg-surface-container-lowest ring-1 ring-on-surface/20">
                <svg
                  className={cn('size-3 text-green-600 dark:text-green-400', enter, '[animation-delay:2200ms]')}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
                </svg>
              </span>
              {texts.captcha}
            </span>
            <IllustrationButton variant="primary">{texts.send}</IllustrationButton>
          </div>
        </IllustrationCard>

        {/* Confirmación, como RequestSent. */}
        <IllustrationHatch
          tone="neutral"
          className={cn('top-66 left-4 h-26 w-76', enter, '[animation-delay:2600ms]')}
        />
        <IllustrationCard
          title={texts.sentCard}
          icon={icons.checkCircle}
          className={cn('top-64 left-2 h-26 w-76', enter, '[animation-delay:2600ms]', lift)}
        >
          <IllustrationRow status={<StatusDot label={texts.sentStatus} />}>
            <span className="text-on-surface">{texts.sentTitle}</span>
          </IllustrationRow>
          <p className="text-sm text-on-surface-variant/70">{texts.sentHint}</p>
        </IllustrationCard>
      </IllustrationPanel>
    </IllustrationCanvas>
  )
}
