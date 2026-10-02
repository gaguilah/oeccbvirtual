import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

// Usa <dialog> nativo: gestiona el foco, la tecla Escape y el fondo (backdrop).
export default function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Cierra al hacer clic en el fondo (fuera del contenido).
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={titleId}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-surface-container-lowest p-0 text-on-surface shadow-ambient backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded p-1 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 bg-surface-container-low px-6 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </dialog>
  )
}
