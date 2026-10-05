import { useState, type ReactNode } from 'react'
import { Alert, Button, Modal } from '../../components/ui'

type ConfirmDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  // Lanza un Error con mensaje si falla; el diálogo lo muestra y sigue abierto.
  onConfirm: () => Promise<void>
  onClose: () => void
}

// Confirmación de una acción sobre un usuario (desactivar, reactivar, restablecer contraseña).
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setWorking(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={working ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={working}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={working}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-on-surface-variant">
        {children}
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
