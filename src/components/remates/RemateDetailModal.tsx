import { Alert, Button, ButtonAnchor, Modal, Spinner } from '../ui'
import { pdfDownloadUrl } from './api'
import { COURTS } from './constants'
import { formatLongDate, formatTime, isRealizado } from './dates'
import { CaseNumberBox, DetailHeader, DetailList } from './DetailParts'
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
  return (
    <div className="space-y-6">
      <DetailHeader
        scheduledAt={notice.scheduled_at}
        court={notice.court}
        status={<RemateStatusBadge realizado={isRealizado(notice.scheduled_at, now)} />}
      />
      <CaseNumberBox caseNumber={notice.case_number} />
      <DetailList
        title="Información del remate"
        items={[
          ['Fecha', formatLongDate(notice.scheduled_at)],
          ['Hora', formatTime(notice.scheduled_at)],
          ['Juzgado', COURTS[notice.court].name],
        ]}
      />
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
