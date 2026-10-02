import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { IllustrationCanvas, IllustrationSegmented, enter, illustrationIcons as icons, lift } from '../illustration'
import { cycleTutorials, texts } from './illustrationData'

// Personas con ✓ sobre las líneas de la izquierda: posición de cada recuadro (centrado en su línea).
const people = ['top-31.5 left-3.5', 'top-36 left-11', 'top-50 left-9']

// Contorno doble de la referencia: marco exterior tenue y panel interior con su propio contorno.
const outerFrame = 'absolute rounded-xl bg-surface-container-low/50 p-1.5 ring-1 ring-on-surface/10'
const innerFrame = 'relative size-full rounded-lg bg-surface-container-low ring-1 ring-on-surface/10'

function Person({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute flex size-5 items-center justify-center rounded-md bg-surface-container-lowest text-green-600 ring-1 ring-green-600/60 dark:text-green-400 dark:ring-green-400/60',
        className,
      )}
    >
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d={icons.userSolid[0]} />
      </svg>
      <svg
        className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-surface-container-lowest"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={4}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icons.check[0]} />
      </svg>
    </span>
  )
}

// Textos apilados en el mismo lugar que se turnan (uno por tutorial). Con "reducir movimiento"
// solo se ve el primero.
function Cycle({ values, className }: { values: ReactNode[]; className?: string }) {
  return (
    <span className={cn('relative block', className)}>
      {values.map((value, index) => (
        <span
          key={index}
          className={cn(
            'absolute inset-0 truncate motion-safe:animate-illustration-cycle',
            cycleTutorials[index].delay,
            index > 0 && 'opacity-0',
          )}
        >
          {value}
        </span>
      ))}
    </span>
  )
}

// Ilustración decorativa de Tutoriales (ver docs/plan-tutoriales-ilustracion.md), basada en una
// imagen plana de Laravel Cloud. A la izquierda, ciudadanos atendidos (verde = estado); en el
// centro, una tarjeta cuyo título y cifras recorren todos los tutoriales; a la derecha, libros.
export default function TutorialsIllustration({ className }: { className?: string }) {
  return (
    <IllustrationCanvas flat ratio="3/2" fade="bottom" className={className}>
      {/* Panel central con contorno doble. */}
      <div className={cn(outerFrame, 'top-19 left-26 h-45 w-76', enter, '[--illustration-delay:150ms]')}>
        <div className={innerFrame}>
          <span className="absolute top-3 left-4 text-sm text-on-surface-variant">{texts.panel}</span>
          <span className="absolute top-1.5 right-3 flex size-5 items-center justify-center rounded-full bg-primary-container text-primary">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {icons.play.map((d) => (
                <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
              ))}
            </svg>
          </span>

          {/* Tarjeta fija: solo el título y las cifras se turnan. */}
          <div
            className={cn(
              'absolute top-13 left-3.5 w-66 overflow-hidden rounded-lg bg-surface-container-lowest shadow-ambient ring-1 ring-on-surface/10',
              lift,
            )}
          >
            <div className="flex items-center gap-2 px-4 pt-3 pb-2.5">
              <svg
                className="size-4 shrink-0 text-on-surface-variant"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                {icons.play.map((d) => (
                  <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
                ))}
              </svg>
              <Cycle
                values={cycleTutorials.map((t) => t.title)}
                className="h-5 flex-1 text-base font-medium text-on-surface"
              />
            </div>
            <div className="space-y-2.5 bg-surface-container-low/60 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-on-surface-variant">{texts.steps}</span>
                <Cycle
                  values={cycleTutorials.map((t) => `${t.steps} ${t.steps === 1 ? 'paso' : 'pasos'}`)}
                  className="h-5 w-20 text-right text-on-surface"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-on-surface-variant">{texts.images}</span>
                <Cycle
                  values={cycleTutorials.map((t) => `${t.images} ${t.images === 1 ? 'imagen' : 'imágenes'}`)}
                  className="h-5 w-20 text-right text-on-surface"
                />
              </div>
            </div>
          </div>

          <IllustrationSegmented
            segments={[{ label: texts.stepByStep, icon: icons.playSolid }, { label: texts.withImages }]}
            className="top-7 right-3"
          />
        </div>
      </div>

      {/* Líneas: verdes desde los ciudadanos (contorno con esquinas redondeadas y línea central
          hasta la tarjeta) y la primary hacia la columna de libros. Mismas unidades del lienzo. */}
      <svg viewBox="0 0 512 341" fill="none" className={cn('absolute inset-0 size-full', enter)}>
        <path
          d="M0 136.5H75.5a8 8 0 0 1 8 8V201a8 8 0 0 1-8 8H0M0 155H124"
          strokeWidth={1.5}
          className="stroke-green-600 dark:stroke-green-400"
        />
        <path d="M408 155H430" strokeWidth={1.5} className="stroke-primary" />
      </svg>

      {people.map((position) => (
        <Person key={position} className={cn(position, enter)} />
      ))}

      {/* Columna de libros con contorno doble. */}
      <div className={cn(outerFrame, 'top-22 left-107.5 h-33 w-14 p-1', enter, '[--illustration-delay:300ms]')}>
        <div className={cn(innerFrame, 'flex flex-col gap-1.5 bg-surface-container-lowest p-1.5')}>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="flex flex-1 items-center justify-center rounded-md bg-surface-container-low text-on-surface-variant"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icons.bookOpen[0]} />
              </svg>
            </span>
          ))}
        </div>
      </div>
    </IllustrationCanvas>
  )
}
