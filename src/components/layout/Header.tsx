import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { ButtonLink } from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import MainNav from '../navigation/MainNav'
import MobileMenu from '../navigation/MobileMenu'
import Container from './Container'

const MOBILE_MENU_ID = 'mobile-menu'

// Cabecera flotante con efecto vidrio (surface al 80 % + desenfoque), sin borde inferior.
export default function Header() {
  const [open, setOpen] = useState(false)
  const { session } = useAuth()
  const close = () => setOpen(false)

  const cta = session ? { to: '/dashboard', label: 'Ir al dashboard' } : { to: '/login', label: 'Iniciar sesión' }

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={close} className="font-display text-lg font-extrabold tracking-[-0.02em] text-on-surface">
          OECCB <span className="text-primary">Virtual</span>
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
          <MainNav />
          <ThemeToggle />
          <ButtonLink to={cta.to}>{cta.label}</ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={MOBILE_MENU_ID}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="inline-flex size-10 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface xl:hidden"
        >
          <svg
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </Container>

      <MobileMenu
        id={MOBILE_MENU_ID}
        open={open}
        onClose={close}
        footer={
          <div className="space-y-3">
            <ThemeToggle showLabels />
            <ButtonLink to={cta.to} onClick={close} fullWidth>
              {cta.label}
            </ButtonLink>
          </div>
        }
      />
    </header>
  )
}
