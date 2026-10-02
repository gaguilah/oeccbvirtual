import { Alert, Button, ButtonAnchor, Modal, Spinner } from '../ui'
import { pdfDownloadUrl } from './api'
import { COURTS } from './constants'
import { dateParts, formatLongDate, formatTime, isRealizado } from './dates'
import RemateStatusBadge from './RemateStatusBadge'
import type { AuctionNotice, NoticeSelection } from './types'
import { useAuctionNotice } from './useAuctionNotice'

type RemateDetailModalProps = {
  // Aviso a mostrar; null = modal cerrado.
  selection: NoticeSelection | null
  onClose: () => void
}

function DocumentIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  )
}

function NoticeDetail({ notice, now }: { notice: AuctionNotice; now: Date }) {
  const court = COURTS[notice.court]
  const { day, month, year } = dateParts(notice.scheduled_at)
  const time = formatTime(notice.scheduled_at)

  return (
    <div className="space-y-6">
      {/* Juzgado + bloque de calendario con la fecha y la hora. */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div
          aria-hidden="true"
          className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-primary-container py-3 text-primary sm:w-24"
        >
          <span className="font-display text-3xl font-extrabold leading-none sm:text-4xl">{day}</span>
          <span className="mt-1 text-xs font-semibold tracking-widest">{month}</span>
          <span className="text-xs opacity-80">{year}</span>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-display text-xl font-bold text-on-surface">{court.short}</p>
          <p className="text-sm text-on-surface-variant">{court.detail}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-sm font-semibold text-on-surface">{time}</span>
            <RemateStatusBadge realizado={isRealizado(notice.scheduled_at, now)} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-low p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Radicado</p>
        <p className="mt-1 break-all font-display text-lg font-bold tabular-nums text-on-surface sm:text-xl">
          {notice.case_number}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Información del remate
        </h3>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-on-surface-variant">Fecha</dt>
          <dd className="font-medium text-on-surface">{formatLongDate(notice.scheduled_at)}</dd>
          <dt className="text-on-surface-variant">Hora</dt>
          <dd className="font-medium text-on-surface">{time}</dd>
          <dt className="text-on-surface-variant">Juzgado</dt>
          <dd className="font-medium text-on-surface">{court.name}</dd>
        </dl>
      </div>
    </div>
  )
}

// Detalle de un aviso: carga sus datos vigentes y ofrece verlo en otra pestaña o descargarlo.
// Se cierra con la X, con Escape o al hacer clic fuera (Modal nativo).
export default function RemateDetailModal({ selection, onClose }: RemateDetailModalProps) {
  const { notice, now, loading, error, retry } = useAuctionNotice(selection)

  let body
  if (loading) {
    body = (
      <div className="flex justify-center py-12 text-primary">
        <Spinner size="lg" label="Cargando información del aviso..." />
      </div>
    )
  } else if (error) {
    body = (
      <Alert variant="error" title="No se pudo cargar el aviso">
        <p>Revise su conexión e intente de nuevo.</p>
        <Button variant="secondary" size="sm" onClick={retry} className="mt-3">
          Reintentar
        </Button>
      </Alert>
    )
  } else if (notice && now) {
    body = <NoticeDetail notice={notice} now={now} />
  } else if (selection) {
    body = (
      <Alert variant="warning" live={false} title="Aviso no disponible">
        Este aviso ya no está publicado.
      </Alert>
    )
  }

  const footer = (
    <>
      <Button variant="tertiary" onClick={onClose} className="sm:mr-auto">
        ← Volver a avisos
      </Button>
      {notice && (
        <>
          <ButtonAnchor href={notice.pdf_url} external variant="secondary">
            <DocumentIcon />
            Ver aviso
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </ButtonAnchor>
          <ButtonAnchor href={pdfDownloadUrl(notice.pdf_url)}>
            <DownloadIcon />
            Descargar PDF
          </ButtonAnchor>
        </>
      )}
    </>
  )

  return (
    <Modal open={selection !== null} onClose={onClose} title="Aviso de remate" footer={footer} className="max-w-xl">
      {body}
    </Modal>
  )
}
