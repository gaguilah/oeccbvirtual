import { cn } from '../../lib/cn'
import {
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
import { texts } from './illustrationData'
import MiniStars from './MiniStars'

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
    </svg>
  )
}

// Ilustración decorativa de la Encuesta (ver docs/plan-encuesta-ilustracion.md): una respuesta de
// ejemplo de principio a fin. Sí / No, estrellas que se llenan, revisión y envío.
// Con "reducir movimiento" se ve directamente el estado final.
export default function SurveyIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas fade="left" compact className={className}>
      {/* Pregunta Sí / No (sale por el borde izquierdo y se desvanece). */}
      <IllustrationPanel label={texts.questionsPanel} className={cn('top-6 -left-10 h-88 w-52', enter)}>
        <IllustrationCard title={texts.yesNoCard} icon={icons.document} className={cn('top-10 left-4 w-44', lift)}>
          <p className="text-sm text-on-surface">{texts.yesNoQuestion}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="flex items-center justify-center gap-1 rounded-md bg-primary-container py-1.5 font-semibold text-on-surface">
              {texts.yes}
              <Check className="size-3.5 text-primary" />
            </span>
            <span className="flex items-center justify-center rounded-md bg-surface-container-low py-1.5 text-on-surface-variant">
              {texts.no}
            </span>
          </div>
        </IllustrationCard>
      </IllustrationPanel>

      {/* Línea de la pregunta Sí / No a la calificación. */}
      <div className={cn(connector, 'top-26 left-42 h-px w-6', enter, '[--illustration-delay:150ms]')} />

      <IllustrationPanel label={texts.mainPanel} className={cn('top-2 left-44 h-96 w-84', enter)}>
        {/* Calificación con estrellas que se llenan. */}
        <IllustrationHatch className={cn('top-12 left-6 h-44 w-76', enter, '[--illustration-delay:150ms]')} />
        <IllustrationCard
          title={texts.ratingCard}
          icon={icons.star}
          className={cn('top-10 left-4 h-44 w-76', enter, '[--illustration-delay:150ms]', lift)}
        >
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-on-surface">{texts.progress}</span>
              <span className="text-on-surface-variant">60 %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-on-surface/10">
              <div className="h-full w-3/5 rounded-full bg-linear-135 from-primary to-primary-dim motion-safe:animate-illustration-fill [--illustration-delay:300ms]" />
            </div>
          </div>
          <div className="space-y-1.5 pt-6">
            <MiniStars animated tooltip={texts.tooltip} className="justify-center gap-2" />
            <div className="flex justify-between text-xs font-semibold tracking-widest text-on-surface-variant/70 uppercase">
              <span>{texts.minLabel}</span>
              <span>{texts.maxLabel}</span>
            </div>
          </div>
        </IllustrationCard>

        {/* Revisión final, como SurveyReview. */}
        <IllustrationHatch
          tone="neutral"
          className={cn('top-60 left-4 h-34 w-76', enter, '[--illustration-delay:1800ms]')}
        />
        <IllustrationCard
          title={texts.reviewCard}
          icon={icons.checkCircle}
          className={cn('top-58 left-2 h-34 w-76', enter, '[--illustration-delay:1800ms]', lift)}
        >
          <div className={cn(enter, '[--illustration-delay:1950ms]')}>
            <IllustrationRow
              status={
                <span className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="font-semibold text-on-surface">{texts.yes}</span>
                  <span className="text-primary">{texts.edit}</span>
                </span>
              }
            >
              {texts.reviewInfo}
            </IllustrationRow>
          </div>
          <div className={cn(enter, '[--illustration-delay:2100ms]')}>
            <IllustrationRow
              status={
                <span className="flex shrink-0 items-center gap-2 text-sm">
                  <MiniStars size="sm" className="gap-0.5" />
                  <span className="text-primary">{texts.edit}</span>
                </span>
              }
            >
              {texts.reviewRating}
            </IllustrationRow>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-sm bg-surface-container-lowest ring-1 ring-on-surface/20">
                <Check
                  className={cn('size-3 text-green-600 dark:text-green-400', enter, '[--illustration-delay:2600ms]')}
                />
              </span>
              {texts.captcha}
            </span>
            <StatusDot label={texts.sent} className={cn(enter, '[--illustration-delay:2600ms]')} />
          </div>
        </IllustrationCard>
      </IllustrationPanel>
    </IllustrationCanvas>
  )
}
