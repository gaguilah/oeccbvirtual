import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { ButtonLink } from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import Tooltip from '../ui/Tooltip'
import MainNav from '../navigation/MainNav'
import MobileMenu from '../navigation/MobileMenu'
import Container from './Container'

const MOBILE_MENU_ID = 'mobile-menu'

// Cabecera flotante con efecto vidrio (surface al 80 % + desenfoque), sin borde inferior.
export default function Header() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { session } = useAuth()
  const close = () => setOpen(false)

  // Menú móvil abierto: se cierra al tocar o hacer clic fuera del encabezado (que contiene el
  // menú y su botón) o con Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Íconos Heroicons outline: "entrar" (arrow-right-end-on-rectangle) y "panel" (squares-2x2).
  const cta = session
    ? {
        to: '/dashboard',
        label: 'Ir al dashboard',
        icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
      }
    : {
        to: '/login',
        label: 'Iniciar sesión',
        icon: 'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25',
      }

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={close} className="font-display text-lg font-extrabold tracking-[-0.02em] text-on-surface">
          OECCB <span className="text-primary">Virtual</span>
        </Link>

        {/* Escritorio: tema compacto (desplegable) y sesión solo con ícono + leyenda (Tooltip). */}
        <div className="hidden items-center gap-6 xl:flex">
          <MainNav />
          <div className="flex items-center gap-2">
            <ThemeToggle variant="compact" />
            <Tooltip label={cta.label}>
              <ButtonLink to={cta.to} size="icon" aria-label={cta.label}>
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={cta.icon} />
                </svg>
              </ButtonLink>
            </Tooltip>
          </div>
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
            <ThemeToggle showLabels onSelect={close} />
            <ButtonLink to={cta.to} onClick={close} fullWidth>
              {cta.label}
            </ButtonLink>
          </div>
        }
      />
    </header>
  )
}
