import { CaseNumberBox, COURTS, DetailHeader, DetailList, formatLongDate, formatTime } from '../remates'
import { Badge, Button, ButtonAnchor, Modal } from '../ui'
import { STATUS } from './constants'
import type { PublicHearing } from './types'

const videoIcon = [
  'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
]
const playIcon = [
  'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  'M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z',
]

function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  )
}

function HearingDetail({ hearing }: { hearing: PublicHearing }) {
  const status = STATUS[hearing.status_id]
  return (
    <div className="space-y-6">
      <DetailHeader
        scheduledAt={hearing.scheduled_at}
        court={hearing.court_id}
        status={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <CaseNumberBox caseNumber={hearing.case_number} />
      <DetailList
        title="Información de la audiencia"
        items={[
          ['Audiencia', hearing.type_name],
          ['Fecha', formatLongDate(hearing.scheduled_at)],
          ['Hora', formatTime(hearing.scheduled_at)],
          ['Juzgado', COURTS[hearing.court_id].name],
          ['Modalidad', hearing.requires_link ? 'Virtual (Microsoft Teams)' : 'Presencial'],
        ]}
      >
        {hearing.status_id === 1 && hearing.requires_link && !hearing.connection_url && (
          <p className="mt-3 text-sm text-on-surface-variant">
            El enlace de conexión se publicará antes de la audiencia.
          </p>
        )}
      </DetailList>
    </div>
  )
}

type Props = {
  // Audiencia a mostrar; null = modal cerrado.
  hearing: PublicHearing | null
  onClose: () => void
}

// Detalle de una audiencia (como el de Avisos de Remate): datos y, abajo, "Conectarse" mientras
// está programada y "Ver grabación" cuando ya se realizó. Se cierra con la X, Escape o clic fuera.
export default function AudienciaDetailModal({ hearing, onClose }: Props) {
  const connect = hearing?.status_id === 1 ? hearing.connection_url : null
  const recording = hearing?.recording_url ?? null

  const footer = (
    <>
      <Button variant="tertiary" onClick={onClose} className="sm:mr-auto">
        ← Volver a audiencias
      </Button>
      {recording && (
        <ButtonAnchor href={recording} external variant="secondary">
          <Icon paths={playIcon} />
          Ver grabación
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </ButtonAnchor>
      )}
      {connect && (
        <ButtonAnchor href={connect} external>
          <Icon paths={videoIcon} />
          Conectarse
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </ButtonAnchor>
      )}
    </>
  )

  return (
    <Modal open={hearing !== null} onClose={onClose} title="Audiencia" footer={footer} className="max-w-xl">
      {hearing && <HearingDetail hearing={hearing} />}
    </Modal>
  )
}
