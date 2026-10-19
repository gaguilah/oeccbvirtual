import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, ButtonLink, ThemeToggle, Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useSignOut } from '../auth'
import { guideForPath, helpPath, HELP_PATH } from '../ayuda'
import { HELP_LINK, PROFILE_LINK } from '../navigation'
import { ConfirmDialog, Icon, icons } from '../ui'

// Tema, Ayuda, Mi perfil y cerrar sesión. Botones de ícono con aria-label y Tooltip,
// como el Header público. Ayuda abre la guía de la sección actual (docs/plan-ayuda.md). Cerrar
// sesión pide confirmación (ConfirmDialog), como las demás acciones del dashboard.
export default function TopbarActions({ className }: { className?: string }) {
  const { signOut, signingOut } = useSignOut()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const { pathname, search } = useLocation()
  const onHelp = pathname.replace(/\/+$/, '') === HELP_PATH
  const helpTo = onHelp ? `${HELP_PATH}${search}` : helpPath(guideForPath(pathname))

  async function handleSignOut() {
    if (!(await signOut())) throw new Error('No se pudo cerrar la sesión. Intente de nuevo.')
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ThemeToggle variant="compact" />
      <Tooltip label={HELP_LINK.label} align="end">
        <ButtonLink to={helpTo} variant="secondary" size="icon" aria-label={HELP_LINK.label}>
          <Icon paths={icons.question} />
        </ButtonLink>
      </Tooltip>
      <Tooltip label={PROFILE_LINK.label} align="end">
        <ButtonLink to={PROFILE_LINK.to} variant="secondary" size="icon" aria-label={PROFILE_LINK.label}>
          <Icon paths={icons.profile} />
        </ButtonLink>
      </Tooltip>
      <Tooltip label="Cerrar sesión" align="end">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Cerrar sesión"
          aria-haspopup="dialog"
          onClick={() => setConfirmSignOut(true)}
          disabled={signingOut}
        >
          <Icon paths={icons.logout} />
        </Button>
      </Tooltip>

      <ConfirmDialog
        open={confirmSignOut}
        title="¿Cerrar sesión?"
        confirmLabel="Cerrar sesión"
        icon={icons.logout}
        onConfirm={handleSignOut}
        onClose={() => setConfirmSignOut(false)}
      >
        <p>Saldrá del dashboard en este equipo. Para volver a entrar necesitará su correo y su contraseña.</p>
      </ConfirmDialog>
    </div>
  )
}
