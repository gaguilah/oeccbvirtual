import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert, Button, Card, CardBody, CardFooter, CardHeader } from '../../components/ui'
import { ConfirmDialog } from '../ui'
import { formatUpdatedAt } from './personalData'

type Props = {
  title: string
  intro: string
  children: ReactNode
  // Avisos que no impiden guardar (p. ej. contacto sin celular).
  warnings: string[]
  message: { variant: 'success' | 'error'; text: string } | null
  onCloseMessage: () => void
  onSubmit: () => void
  saving: boolean
  unchanged: boolean
  // Fecha de la fila (compartida por las dos pestañas); solo se muestra si la pestaña tiene datos.
  updatedAt: string | null
  // "Quitar estos datos": solo si la pestaña tiene algo guardado.
  canClear: boolean
  clearTitle: string
  clearText: string
  onClear: () => Promise<void>
}

// Tarjeta común de Información personal y Contacto de emergencia: título, texto de ayuda, campos,
// avisos, mensaje y pie con "Quitar estos datos" (confirmado) y "Guardar".
export default function PersonalSectionCard({
  title,
  intro,
  children,
  warnings,
  message,
  onCloseMessage,
  onSubmit,
  saving,
  unchanged,
  updatedAt,
  canClear,
  clearTitle,
  clearText,
  onClear,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{intro}</p>
        </CardHeader>
        <CardBody className="space-y-4">
          {children}
          {warnings.length > 0 && (
            <Alert variant="warning" live={false}>
              {warnings.length === 1 ? (
                warnings[0]
              ) : (
                <ul className="list-disc space-y-1 pl-4">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
          {message && (
            <Alert variant={message.variant} onClose={onCloseMessage}>
              {message.text}
            </Alert>
          )}
          {canClear && updatedAt && (
            <p className="text-xs text-on-surface-variant">Última actualización: {formatUpdatedAt(updatedAt)}</p>
          )}
        </CardBody>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {canClear && (
              <Button type="button" variant="tertiary" size="sm" onClick={() => setConfirmClear(true)}>
                Quitar estos datos
              </Button>
            )}
          </div>
          <Button type="submit" loading={saving} disabled={unchanged}>
            Guardar
          </Button>
        </CardFooter>
      </form>
      <ConfirmDialog
        open={confirmClear}
        title={clearTitle}
        confirmLabel="Quitar"
        tone="danger"
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await onClear()
          setConfirmClear(false)
        }}
      >
        <p>{clearText}</p>
      </ConfirmDialog>
    </Card>
  )
}
