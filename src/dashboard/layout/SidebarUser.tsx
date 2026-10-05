import { Badge } from '../../components/ui'
import { cn } from '../../lib/cn'
import { roleLabel, useAccess } from '../access'
import { initials, useProfile } from '../profile'

// Encabezado del menú: iniciales, nombre, correo y rol (con su juzgado) de quien está en sesión. Mientras carga el
// perfil muestra barras tonales (esqueleto), no un spinner.
export default function SidebarUser({ className }: { className?: string }) {
  const { displayName, email, loading } = useProfile()
  const role = roleLabel(useAccess().access)

  if (loading) {
    return (
      <div className={cn('flex items-center gap-3', className)} aria-busy="true" aria-label="Cargando perfil">
        <span className="size-10 shrink-0 rounded-full bg-surface-container" />
        <span className="flex-1 space-y-2">
          <span className="block h-3 w-3/4 rounded bg-surface-container" />
          <span className="block h-2.5 w-1/2 rounded bg-surface-container" />
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-primary"
      >
        {initials(displayName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-on-surface" title={displayName}>
          {displayName}
        </span>
        {displayName !== email && (
          <span className="block truncate text-xs text-on-surface-variant" title={email}>
            {email}
          </span>
        )}
        {role && <Badge className="mt-1.5">{role}</Badge>}
      </span>
    </div>
  )
}
