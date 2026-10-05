import { cn } from '../../lib/cn'
import { ButtonAnchor } from '../ui'
import type { TutorialStep } from './data'
import TutorialImage from './TutorialImage'

type TutorialContentProps = {
  steps: TutorialStep[]
  className?: string
}

// Pasos numerados del tutorial. Cada paso es una tarjeta (lowest) sobre el fondo, sin bordes.
// Desde lg: texto a la izquierda (40 %, centrado verticalmente), captura a la derecha (60 %) y el
// enlace centrado en una fila propia debajo. Antes de lg: texto → captura → enlace, apilados.
// Cada paso aparece con un fundido al entrar en pantalla (animate-step-reveal, solo CSS).
export default function TutorialContent({ steps, className }: TutorialContentProps) {
  return (
    <ol className={cn('space-y-4 sm:space-y-6', className)}>
      {steps.map((step, index) => {
        const stepLabel = <span className="sr-only">Paso {index + 1}: </span>
        return (
          <li
            key={index}
            className="rounded-lg bg-surface-container-lowest p-5 motion-safe:animate-step-reveal sm:p-6 lg:p-8"
          >
            <div className={cn('grid gap-6', step.image && 'lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-10')}>
              <div className="flex gap-4 sm:gap-6">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-135 from-primary to-primary-dim text-sm font-semibold text-on-primary"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1 pt-1.5">
                  {step.title && (
                    <h2 className="text-lg font-semibold">
                      {stepLabel}
                      {step.title}
                    </h2>
                  )}
                  <p className={cn('text-sm sm:text-base', step.title ? 'text-on-surface-variant' : 'text-on-surface')}>
                    {!step.title && stepLabel}
                    {step.text}
                  </p>
                </div>
              </div>

              {step.image && <TutorialImage src={step.image.src} alt={step.image.alt} />}

              {step.link && (
                <div className={cn('flex justify-center', step.image && 'lg:col-span-2')}>
                  <ButtonAnchor href={step.link.href} external variant="secondary" size="sm" className="max-w-full">
                    <span className="truncate">{step.link.label}</span>
                    <svg
                      className="size-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </ButtonAnchor>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
