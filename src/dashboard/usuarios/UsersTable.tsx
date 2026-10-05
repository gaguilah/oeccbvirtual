import { useEffect, useRef } from 'react'
import { Badge, Button, Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { Icon, icons } from '../ui'
import { dependencyLabel, displayName, lastSignIn, STATUS, userStatus } from './data'
import type { UserRow } from './types'

type Handlers = {
  onEdit: (user: UserRow) => void
  onToggleActive: (user: UserRow) => void
  onResetPassword: (user: UserRow) => void
}

type UsersTableProps = Handlers & {
  users: UserRow[]
  currentUserId: string | null
  // Usuario recién creado o editado: se resalta y se lleva a la vista.
  highlightId: string | null
  canManage: boolean
  className?: string
}

const headerCell = 'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant lg:px-6'
const bodyCell = 'px-4 py-4 align-top lg:px-6'

function StatusBadge({ user }: { user: UserRow }) {
  const status = STATUS[userStatus(user)]
  return <Badge variant={status.variant}>{status.label}</Badge>
}

function NameCell({ user, isSelf, compact }: { user: UserRow; isSelf: boolean; compact?: boolean }) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-on-surface">
        {displayName(user)}
        {isSelf && <Badge variant="primary">Usted</Badge>}
      </span>
      {/* Tabla: una línea, recortada (el correo completo en title). Tarjetas: puede partirse. */}
      <span
        className={cn('block text-xs text-on-surface-variant', compact ? 'max-w-64 truncate' : 'break-all')}
        title={user.email}
      >
        {user.email}
      </span>
    </>
  )
}

function SignIn({ user }: { user: UserRow }) {
  const { date, time } = lastSignIn(user)
  return (
    <>
      <span className="block whitespace-nowrap">{date}</span>
      {time && <span className="block text-xs whitespace-nowrap text-on-surface-variant">{time}</span>}
    </>
  )
}

// Editar, restablecer contraseña y desactivar / reactivar. Nadie se gestiona a sí mismo aquí
// (para eso está Mi perfil); sin rol, solo se puede editar (para asignarle uno).
function Actions({
  user,
  isSelf,
  onEdit,
  onToggleActive,
  onResetPassword,
}: Handlers & { user: UserRow; isSelf: boolean }) {
  if (isSelf) return <span className="text-xs text-on-surface-variant">Use Mi perfil</span>
  const name = displayName(user)
  const hasRole = Boolean(user.role_id)
  const toggleLabel = user.active ? `Desactivar a ${name}` : `Reactivar a ${name}`

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => onEdit(user)} aria-haspopup="dialog">
        {hasRole ? 'Editar' : 'Asignar rol'}
        <span className="sr-only"> a {name}</span>
      </Button>
      {hasRole && (
        <>
          <Tooltip label="Restablecer contraseña" align="end">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onResetPassword(user)}
              aria-label={`Restablecer la contraseña de ${name}`}
              aria-haspopup="dialog"
            >
              <Icon paths={icons.key} />
            </Button>
          </Tooltip>
          <Tooltip label={user.active ? 'Desactivar' : 'Reactivar'} align="end">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onToggleActive(user)}
              aria-label={toggleLabel}
              aria-haspopup="dialog"
            >
              <Icon paths={user.active ? icons.lock : icons.unlock} />
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  )
}

// Escritorio: tabla ("Último ingreso" desde 2xl, por espacio). Celular: tarjetas con todos los
// datos. Sin líneas: fondo alterno.
export default function UsersTable({
  users,
  currentUserId,
  highlightId,
  canManage,
  className,
  ...handlers
}: UsersTableProps) {
  const highlightRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlightId, users])

  const refFor = (user: UserRow) => (node: HTMLElement | null) => {
    if (user.id === highlightId) highlightRef.current = node
  }
  const highlight = (user: UserRow) => user.id === highlightId && 'bg-primary-container/50'

  return (
    <div className={className}>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">Usuarios del dashboard</caption>
        <thead className="bg-surface-container-low">
          <tr>
            <th scope="col" className={headerCell}>
              Usuario
            </th>
            <th scope="col" className={headerCell}>
              Rol
            </th>
            <th scope="col" className={headerCell}>
              Dependencia
            </th>
            <th scope="col" className={headerCell}>
              Estado
            </th>
            <th scope="col" className={cn(headerCell, 'hidden 2xl:table-cell')}>
              Último ingreso
            </th>
            {canManage && (
              <th scope="col" className={cn(headerCell, 'text-right')}>
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              ref={refFor(user)}
              className={cn('transition-colors even:bg-surface-container-low/50', highlight(user))}
            >
              <td className={bodyCell}>
                <NameCell user={user} isSelf={user.id === currentUserId} compact />
              </td>
              <td className={cn(bodyCell, 'text-sm whitespace-nowrap')}>{user.role_name ?? '—'}</td>
              <td className={cn(bodyCell, 'text-sm whitespace-nowrap')}>{dependencyLabel(user)}</td>
              <td className={cn(bodyCell, 'whitespace-nowrap')}>
                <StatusBadge user={user} />
              </td>
              <td className={cn(bodyCell, 'hidden text-sm 2xl:table-cell')}>
                <SignIn user={user} />
              </td>
              {canManage && (
                <td className={bodyCell}>
                  <Actions user={user} isSelf={user.id === currentUserId} {...handlers} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            ref={refFor(user)}
            className={cn('space-y-3 rounded-lg bg-surface-container-low p-4', highlight(user))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <NameCell user={user} isSelf={user.id === currentUserId} />
              </div>
              <StatusBadge user={user} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-on-surface-variant">Rol</dt>
                <dd>{user.role_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Dependencia</dt>
                <dd>{dependencyLabel(user)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-on-surface-variant">Último ingreso</dt>
                <dd>
                  <SignIn user={user} />
                </dd>
              </div>
            </dl>
            {canManage && <Actions user={user} isSelf={user.id === currentUserId} {...handlers} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
