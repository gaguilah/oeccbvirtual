import { Badge, Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { roleLabel, useAccess } from '../access'
import { initials, useProfile } from '../profile'

// Encabezado del menú: iniciales, nombre, correo y rol (con su juzgado) de quien está en sesión. Mientras carga el
// perfil muestra barras tonales (esqueleto), no un spinner. Nombre y correo pasan a otra línea si no caben.
// `collapsed`: solo el círculo de iniciales; nombre y rol en una leyenda a la derecha.
export default function SidebarUser({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const { displayName, email, loading } = useProfile()
  const role = roleLabel(useAccess().access)

  if (loading && collapsed) {
    return (
      <span className={cn('mx-auto block size-10 rounded-full bg-surface-container', className)} aria-busy="true" />
    )
  }

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

  if (collapsed) {
    const label = role ? `${displayName} · ${role}` : displayName
    return (
      <Tooltip label={label} side="right" className={cn('mx-auto', className)}>
        <span
          role="img"
          aria-label={label}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-primary"
        >
          {initials(displayName)}
        </span>
      </Tooltip>
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
        <span className="block text-sm font-semibold wrap-break-word text-on-surface">{displayName}</span>
        {displayName !== email && <span className="block text-xs wrap-anywhere text-on-surface-variant">{email}</span>}
        {role && <Badge className="mt-1.5">{role}</Badge>}
      </span>
    </div>
  )
}
