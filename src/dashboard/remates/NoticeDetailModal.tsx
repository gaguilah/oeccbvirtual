import { useEffect, useState } from 'react'
import { COURTS, formatDate, formatTime, pdfDownloadUrl } from '../../components/remates'
import { ButtonAnchor, Modal, Spinner } from '../../components/ui'
import { fetchAudit, fetchNotice } from './api'
import PublicationBadge from './PublicationBadge'
import type { AdminNotice, NoticeAudit } from './types'

type Loaded = { notice: AdminNotice | null; audit: NoticeAudit | null }

// Detalle de un aviso: datos vigentes (se vuelven a pedir al abrir), enlaces al PDF y quién lo
// creó y lo editó por última vez.
export default function NoticeDetailModal({ notice: initial, onClose }: { notice: AdminNotice; onClose: () => void }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchNotice(initial.id), fetchAudit(initial.id)])
      .then(([notice, audit]) => {
        if (active) setLoaded({ notice, audit })
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el aviso.')
      })
    return () => {
      active = false
    }
  }, [initial.id])

  const notice = loaded?.notice ?? initial
  const at = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`
  const created = `Creado${loaded?.audit?.created_by_name ? ` por ${loaded.audit.created_by_name}` : ''} el ${at(notice.created_at)}`
  const updated = notice.updated_at
    ? `Editado${loaded?.audit?.updated_by_name ? ` por ${loaded.audit.updated_by_name}` : ''} el ${at(notice.updated_at)}`
    : null

  return (
    <Modal open onClose={onClose} title="Aviso de remate">
      {loaded && !loaded.notice ? (
        <p className="text-sm text-on-surface-variant">Este aviso ya no existe.</p>
      ) : (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <dt className="text-xs text-on-surface-variant">Radicado</dt>
              <dd className="font-medium tabular-nums break-all text-on-surface">{notice.case_number}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant">Fecha y hora</dt>
              <dd className="text-on-surface">{at(notice.scheduled_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant">Juzgado</dt>
              <dd className="text-on-surface">{COURTS[notice.court].short}</dd>
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              <PublicationBadge published={notice.is_published} />
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <ButtonAnchor href={notice.pdf_url} external variant="secondary" size="sm">
              Ver aviso
            </ButtonAnchor>
            <ButtonAnchor href={pdfDownloadUrl(notice.pdf_url)} variant="secondary" size="sm">
              Descargar PDF
            </ButtonAnchor>
          </div>
          <p className="text-xs break-all text-on-surface-variant">{notice.pdf_url}</p>
          <div className="rounded-md bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
            {loaded ? (
              <p>
                {created}
                {updated && ` · ${updated}`}
              </p>
            ) : error ? (
              <p>{error}</p>
            ) : (
              <Spinner size="sm" label="Cargando historial..." />
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
