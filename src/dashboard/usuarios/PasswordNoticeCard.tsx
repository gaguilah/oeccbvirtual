import { useState } from 'react'
import { Button, CopyButton } from '../../components/ui'
import { Icon, icons } from '../ui'
import type { PasswordNotice } from './types'

// Contraseña temporal recién generada, arriba de la lista. Se muestra una sola vez: al cerrarla o
// salir de la página ya no se puede volver a ver (si se pierde, "Restablecer contraseña").
export default function PasswordNoticeCard({ notice, onClose }: { notice: PasswordNotice; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  return (
    <section
      aria-label="Contraseña temporal"
      className="space-y-3 rounded-lg bg-green-600/10 p-4 text-sm text-green-900 sm:p-5 dark:text-green-200"
    >
      <div className="flex items-start justify-between gap-4">
        <p role="status">
          <strong className="font-semibold">
            {notice.kind === 'created' ? 'Usuario creado' : 'Contraseña restablecida'}: {notice.name}.
          </strong>{' '}
          Entréguele esta contraseña temporal por un canal seguro: deberá cambiarla en su primer ingreso. No se volverá
          a mostrar.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded p-1 hover:bg-green-600/10 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon paths={icons.close} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-surface-container-lowest px-3 py-2 font-mono text-base tracking-wider text-on-surface">
          {visible ? notice.password : '•'.repeat(notice.password.length)}
        </code>
        <Button variant="secondary" size="sm" onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? 'Ocultar' : 'Mostrar'}
        </Button>
        <CopyButton value={notice.password} label="Copiar" />
      </div>
    </section>
  )
}
