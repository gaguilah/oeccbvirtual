import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { desktopLinkClass, mainLinks, type NavItem } from './links'

type MainNavProps = {
  links?: NavItem[]
  className?: string
}

// Navegación de escritorio (oculta en móvil).
export default function MainNav({ links = mainLinks, className }: MainNavProps) {
  return (
    <nav aria-label="Principal" className={cn('hidden items-center gap-1 xl:flex', className)}>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end className={desktopLinkClass}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
