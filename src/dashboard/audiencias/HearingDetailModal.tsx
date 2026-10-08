import { useEffect, useState, type ReactNode } from 'react'
import { COURTS, formatDate, formatTime } from '../../components/remates'
import { Button, Modal } from '../../components/ui'
import { useAccess } from '../access'
import { hearingActionItems, type HearingAction } from './actions'
import { fetchAudit } from './api'
import { missingLink, typeName } from './data'
import { MissingLinkNote, StatusBadge } from './HearingBadges'
import type { Hearing, HearingAudit, HearingType } from './types'

type Props = {
  hearing: Hearing
  types: HearingType[]
  now: Date
  onClose: () => void
  onAction: (action: HearingAction, hearing: Hearing) => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</dt>
      <dd className="text-sm break-words text-on-surface">{children}</dd>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium break-all text-primary hover:underline"
    >
      {children} ↗<span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  )
}

// Detalle de una audiencia (desde la tabla o el calendario), con sus acciones disponibles abajo.
export default function HearingDetailModal({ hearing, types, now, onClose, onAction }: Props) {
  const { can } = useAccess()
  const [audit, setAudit] = useState<HearingAudit | null>(null)
  const type = types.find((t) => t.id === hearing.hearing_type_id)
  const actions = hearingActionItems(hearing, now, can, onAction, { includeView: false }).filter(
    (item) => !item.disabledReason,
  )

  useEffect(() => {
    let active = true
    fetchAudit(hearing.id)
      .then((data) => {
        if (active) setAudit(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [hearing.id])

  return (
    <Modal
      open
      onClose={onClose}
      title={typeName(types, hearing.hearing_type_id)}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {actions.map((item) => (
            <Button
              key={item.label}
              variant={item.danger ? 'danger' : 'secondary'}
              onClick={() => {
                onClose()
                item.onSelect()
              }}
            >
              {item.label}
            </Button>
          ))}
        </>
      }
    >
      <dl className="space-y-4">
        <Row label="Estado">
          <StatusBadge hearing={hearing} now={now} />
        </Row>
        <Row label="Fecha y hora">
          {formatDate(hearing.scheduled_at)} · {formatTime(hearing.scheduled_at)}
        </Row>
        <Row label="Radicado">
          <span className="tabular-nums">{hearing.case_number}</span>
        </Row>
        <Row label="Juzgado">{COURTS[hearing.court_id].name}</Row>
        <Row label="Enlace de conexión">
          {hearing.connection_url ? (
            <ExternalLink href={hearing.connection_url}>Conectarse</ExternalLink>
          ) : type && !type.requires_link ? (
            'Presencial'
          ) : (
            '—'
          )}
          {missingLink(hearing, type) && <MissingLinkNote className="mt-1" />}
        </Row>
        {hearing.recording_url && (
          <Row label="Grabación">
            <ExternalLink href={hearing.recording_url}>Ver grabación</ExternalLink>
          </Row>
        )}
        {hearing.notes && (
          <Row label="Observaciones">
            <span className="whitespace-pre-line">{hearing.notes}</span>
          </Row>
        )}
        <Row label="Registro">
          <span className="text-on-surface-variant">
            Creada el {formatDate(hearing.created_at)}
            {audit?.created_by_name && ` por ${audit.created_by_name}`}
            {hearing.updated_at && (
              <>
                {' · '}modificada el {formatDate(hearing.updated_at)}
                {audit?.updated_by_name && ` por ${audit.updated_by_name}`}
              </>
            )}
          </span>
        </Row>
      </dl>
    </Modal>
  )
}
