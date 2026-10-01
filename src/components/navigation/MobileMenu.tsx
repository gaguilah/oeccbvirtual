import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { mainLinks, mobileLinkClass, type NavItem } from './links'

type MobileMenuProps = {
  id: string
  open: boolean
  onClose: () => void
  links?: NavItem[]
  // Contenido extra al final del menú (p. ej. el botón de acceso).
  footer?: ReactNode
}

// Panel desplegable para móvil. El botón que lo abre vive en Header.
export default function MobileMenu({ id, open, onClose, links = mainLinks, footer }: MobileMenuProps) {
  if (!open) return null

  return (
    <nav id={id} aria-label="Principal" className="space-y-1 bg-surface-container-low px-4 py-3 xl:hidden">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onClose} className={mobileLinkClass}>
          {link.label}
        </NavLink>
      ))}
      {footer && <div className="pt-2">{footer}</div>}
    </nav>
  )
}
