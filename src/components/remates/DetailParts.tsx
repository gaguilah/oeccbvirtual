import { Fragment, type ReactNode } from 'react'
import { COURTS } from './constants'
import { dateParts, formatTime } from './dates'
import type { Court } from './types'

// Piezas comunes de los modales de detalle del sitio público: Avisos de Remate (RemateDetailModal)
// y Audiencias (AudienciaDetailModal). Cambiarlas aquí para que los dos sigan iguales.

// Bloque de calendario con la fecha, el juzgado, la hora y el estado (`status`: la etiqueta).
export function DetailHeader({ scheduledAt, court, status }: { scheduledAt: string; court: Court; status: ReactNode }) {
  const { day, month, year } = dateParts(scheduledAt)
  const info = COURTS[court]

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div
        aria-hidden="true"
        className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-primary-container py-3 text-primary sm:w-24"
      >
        <span className="font-display text-3xl leading-none font-extrabold sm:text-4xl">{day}</span>
        <span className="mt-1 text-xs font-semibold tracking-widest">{month}</span>
        <span className="text-xs opacity-80">{year}</span>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-display text-xl font-bold text-on-surface">{info.short}</p>
        <p className="text-sm text-on-surface-variant">{info.detail}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-sm font-semibold text-on-surface">{formatTime(scheduledAt)}</span>
          {status}
        </div>
      </div>
    </div>
  )
}

// Recuadro con el radicado destacado.
export function CaseNumberBox({ caseNumber }: { caseNumber: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-4">
      <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">Radicado</p>
      <p className="mt-1 font-display text-lg font-bold break-all text-on-surface tabular-nums sm:text-xl">
        {caseNumber}
      </p>
    </div>
  )
}

// Lista de datos con título (p. ej. "Información del remate"); `children` va debajo de la lista.
export function DetailList({
  title,
  items,
  children,
}: {
  title: string
  items: [label: string, value: ReactNode][]
  children?: ReactNode
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">{title}</h3>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {items.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-on-surface-variant">{label}</dt>
            <dd className="font-medium text-on-surface">{value}</dd>
          </Fragment>
        ))}
      </dl>
      {children}
    </div>
  )
}
