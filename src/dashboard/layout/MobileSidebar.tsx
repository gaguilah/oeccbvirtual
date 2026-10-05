import { useEffect, useRef } from 'react'
import { Icon, icons } from '../ui'
import Sidebar from './Sidebar'

type MobileSidebarProps = {
  id: string
  open: boolean
  onClose: () => void
}

// Menú lateral en celular y tableta: <dialog> nativo pegado a la izquierda (foco atrapado, Escape
// y fondo oscurecido, como ui/Modal). Se cierra al elegir una opción, con Escape o tocando fuera.
export default function MobileSidebar({ id, open, onClose }: MobileSidebarProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      id={id}
      aria-label="Menú del dashboard"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-y-0 left-0 m-0 h-svh max-h-none w-72 max-w-[85vw] bg-surface-container-low p-0 text-on-surface shadow-ambient backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm lg:hidden"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute top-4 right-3 z-10 rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon paths={icons.close} />
      </button>
      <Sidebar onNavigate={onClose} className="pt-16" />
    </dialog>
  )
}
