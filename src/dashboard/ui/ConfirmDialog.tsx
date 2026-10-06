import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Alert, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import Icon from './Icon'
import { icons } from './icons'

// 'danger': eliminar o borrar (rojo, ícono de papelera). 'update': cambiar algo que se puede
// deshacer, como ocultar, desactivar o restablecer (color primary).
export type ConfirmTone = 'danger' | 'update'

const TONES: Record<ConfirmTone, { circle: string; action: string; icon: string[] }> = {
  danger: {
    circle: 'bg-red-600/10 text-red-600 dark:text-red-400',
    action: 'text-red-600 dark:text-red-400',
    icon: icons.trash,
  },
  update: {
    circle: 'bg-primary-container text-primary',
    action: 'text-primary',
    icon: icons.pencil,
  },
}

type ConfirmDialogProps = {
  open: boolean
  // Pregunta corta, p. ej. "¿Eliminar este aviso?".
  title: string
  // Explicación debajo del título (centrada).
  children: ReactNode
  confirmLabel: string
  tone?: ConfirmTone
  // Ícono del círculo; por defecto, el del tono (papelera o lápiz).
  icon?: string[]
  // Lanza un Error con mensaje si falla; el diálogo lo muestra y sigue abierto.
  onConfirm: () => Promise<void>
  onClose: () => void
}

// Confirmación de una acción, igual en todo el dashboard: ícono en un círculo tonal, pregunta y
// explicación centradas, y abajo dos botones de texto a lo ancho (Cancelar | acción). <dialog>
// nativo: foco atrapado, Escape y fondo oscurecido.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = 'update',
  icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const style = TONES[tone]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // El foco va a Cancelar (no a la X): la opción segura si se pulsa Enter por error. React no
      // escribe el atributo autofocus en el HTML, por eso se hace aquí.
      cancelRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const close = () => {
    if (!working) onClose()
  }

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

  const footerButton =
    'flex min-h-14 items-center justify-center gap-2 px-4 text-base transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        // Escape: mientras se confirma, no se cierra.
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl bg-surface-container-lowest p-0 text-on-surface shadow-ambient backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar"
        className="absolute top-3 right-3 rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon paths={icons.close} />
      </button>

      <div className="space-y-3 px-6 pt-8 pb-6 text-center">
        <span className={cn('mx-auto flex size-16 items-center justify-center rounded-full', style.circle)}>
          <Icon paths={icon ?? style.icon} className="size-8" />
        </span>
        <h2 id={titleId} className="pt-2 text-xl font-bold">
          {title}
        </h2>
        <div id={descriptionId} className="space-y-2 text-sm text-on-surface-variant">
          {children}
        </div>
        {error && (
          <Alert variant="error" className="text-left">
            {error}
          </Alert>
        )}
      </div>

      {/* Dos botones de texto a lo ancho, separados por un borde tenue (Ghost Border). */}
      <div className="grid grid-cols-2 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={close}
          disabled={working}
          ref={cancelRef}
          className={cn(footerButton, 'font-medium text-primary')}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={working}
          aria-busy={working || undefined}
          className={cn(footerButton, 'border-l border-outline-variant/20 font-semibold', style.action)}
        >
          {working && <Spinner size="sm" label="" />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
