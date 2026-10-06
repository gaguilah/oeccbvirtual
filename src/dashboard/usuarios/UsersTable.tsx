import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { cn } from '../../lib/cn'
import { PROFILE_LINK } from '../navigation'
import { ActionMenu, icons, type ActionMenuItem } from '../ui'
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

function StatusBadge({ user, className }: { user: UserRow; className?: string }) {
  const status = STATUS[userStatus(user)]
  return (
    <Badge variant={status.variant} className={className}>
      {status.label}
    </Badge>
  )
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

// Menú de tres puntos: editar (o asignar rol), restablecer contraseña y desactivar / reactivar.
// Nadie se gestiona a sí mismo aquí: en la fila propia el menú solo lleva a Mi perfil. Sin rol,
// solo se puede asignar uno.
function UserActions({
  user,
  isSelf,
  onEdit,
  onToggleActive,
  onResetPassword,
  className,
}: Handlers & { user: UserRow; isSelf: boolean; className?: string }) {
  const navigate = useNavigate()
  const hasRole = Boolean(user.role_id)
  const items: ActionMenuItem[] = isSelf
    ? [{ label: 'Ir a Mi perfil', icon: icons.profile, onSelect: () => navigate(PROFILE_LINK.to) }]
    : [
        { label: hasRole ? 'Editar' : 'Asignar rol', icon: icons.pencil, onSelect: () => onEdit(user) },
        ...(hasRole
          ? [
              { label: 'Restablecer contraseña', icon: icons.key, onSelect: () => onResetPassword(user) },
              {
                label: user.active ? 'Desactivar' : 'Reactivar',
                icon: user.active ? icons.lock : icons.unlock,
                onSelect: () => onToggleActive(user),
              },
            ]
          : []),
      ]

  return <ActionMenu label={`Opciones de ${displayName(user)}`} items={items} className={className} />
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
              <th scope="col" className={cn(headerCell, 'w-px')}>
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
                <td className={cn(bodyCell, 'py-2.5')}>
                  <UserActions
                    user={user}
                    isSelf={user.id === currentUserId}
                    className="flex justify-end"
                    {...handlers}
                  />
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
              <div className="flex shrink-0 items-start gap-1">
                <StatusBadge user={user} className="mt-2" />
                {canManage && (
                  <UserActions user={user} isSelf={user.id === currentUserId} className="-mt-1 -mr-2" {...handlers} />
                )}
              </div>
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
          </li>
        ))}
      </ul>
    </div>
  )
}
