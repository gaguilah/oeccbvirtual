import { useState } from 'react'
import { Textarea } from '../../components/ui'
import { ConfirmDialog, icons } from '../ui'
import { setRequestStatus } from './api'
import type { RequestRow } from './types'

export type StatusAction = 'en_tramite' | 'cerrar' | 'reabrir'

type StatusDialogProps = {
  action: StatusAction
  row: RequestRow
  onClose: () => void
  // Después de cambiar el estado (mensaje para el aviso de la página).
  onDone: (message: string) => void
}

const REASON_MIN = 5
const REASON_MAX = 500

// Confirmación de los cambios de estado. Cerrar pide el motivo (p. ej. una felicitación, un
// duplicado o un mensaje sin sentido); reabrir la devuelve a "En trámite".
export default function StatusDialog({ action, row, onClose, onDone }: StatusDialogProps) {
  const [reason, setReason] = useState('')

  if (action === 'cerrar') {
    return (
      <ConfirmDialog
        open
        title="¿Cerrar esta PQRS sin respuesta?"
        confirmLabel="Cerrar PQRS"
        icon={icons.lock}
        onClose={onClose}
        onConfirm={async () => {
          const clean = reason.trim()
          if (clean.length < REASON_MIN) throw new Error(`Escriba el motivo (mínimo ${REASON_MIN} caracteres).`)
          await setRequestStatus(row.id, 'cerrada', clean)
          onDone(`PQRS ${row.request_number} cerrada.`)
        }}
      >
        <p>
          La PQRS <strong className="font-mono text-on-surface">{row.request_number}</strong> quedará cerrada sin enviar
          respuesta al ciudadano. Podrá reabrirla si hace falta.
        </p>
        {/* El cuerpo del diálogo va centrado; el campo, alineado a la izquierda. */}
        <div className="text-left">
          <Textarea
            label="Motivo del cierre"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={REASON_MAX}
            placeholder="Ej.: es una felicitación; está duplicada con PQRS-2026-000010."
          />
        </div>
      </ConfirmDialog>
    )
  }

  const reopen = action === 'reabrir'
  return (
    <ConfirmDialog
      open
      title={reopen ? '¿Reabrir esta PQRS?' : '¿Marcar esta PQRS en trámite?'}
      confirmLabel={reopen ? 'Reabrir' : 'Marcar en trámite'}
      icon={reopen ? icons.unlock : icons.refresh}
      onClose={onClose}
      onConfirm={async () => {
        await setRequestStatus(row.id, 'en_tramite')
        onDone(reopen ? `PQRS ${row.request_number} reabierta.` : `PQRS ${row.request_number} en trámite.`)
      }}
    >
      <p>
        {reopen
          ? 'Volverá a quedar pendiente, en trámite, y se podrá responder.'
          : 'Indica que alguien de la oficina ya la está atendiendo.'}{' '}
        Radicado <strong className="font-mono text-on-surface">{row.request_number}</strong>.
      </p>
    </ConfirmDialog>
  )
}
