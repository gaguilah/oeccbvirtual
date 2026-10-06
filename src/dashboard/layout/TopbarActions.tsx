import { Button, ButtonLink, ThemeToggle, Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useSignOut } from '../auth'
import { PROFILE_LINK } from '../navigation'
import { Icon, icons } from '../ui'

// Tema, Mi perfil y cerrar sesión. Botones de ícono con aria-label y Tooltip,
// como el Header público.
export default function TopbarActions({ className }: { className?: string }) {
  const { signOut, signingOut } = useSignOut()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ThemeToggle variant="compact" />
      <Tooltip label={PROFILE_LINK.label} align="end">
        <ButtonLink to={PROFILE_LINK.to} variant="secondary" size="icon" aria-label={PROFILE_LINK.label}>
          <Icon paths={icons.profile} />
        </ButtonLink>
      </Tooltip>
      <Tooltip label="Cerrar sesión" align="end">
        <Button variant="secondary" size="icon" aria-label="Cerrar sesión" onClick={signOut} disabled={signingOut}>
          <Icon paths={icons.logout} />
        </Button>
      </Tooltip>
    </div>
  )
}
