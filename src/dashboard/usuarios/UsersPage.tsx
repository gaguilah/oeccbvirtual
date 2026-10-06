import { useState } from 'react'
import { Alert, Button, EmptyState, Spinner } from '../../components/ui'
import { useAuth } from '../../context/auth'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { SUPERADMIN, useAccess } from '../access'
import { ConfirmDialog, Icon, icons } from '../ui'
import { manageUsers } from './api'
import { displayName, EMPTY_FILTERS, filterUsers } from './data'
import PasswordNoticeCard from './PasswordNoticeCard'
import UserFormModal from './UserFormModal'
import UsersFilters from './UsersFilters'
import UsersTable from './UsersTable'
import type { PasswordNotice, UserFilters, UserRow } from './types'
import { useUsers } from './useUsers'

type Dialog =
  | { kind: 'form'; user: UserRow | null; key: number }
  | { kind: 'toggle'; user: UserRow }
  | { kind: 'reset'; user: UserRow }
  | null

// Sección Usuarios (/dashboard/usuarios, docs/plan-usuarios.md fase 2). Ver: usuarios.ver.
// Crear, editar, desactivar y restablecer: usuarios.gestionar (lo vuelve a exigir manage-users).
export default function UsersPage() {
  useDocumentMeta({ title: 'Usuarios · Dashboard', noindex: true })
  const { session } = useAuth()
  const { access, can } = useAccess()
  const canManage = can('usuarios.gestionar')
  const { users, roles, loading, refreshing, error, reload } = useUsers()
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [notice, setNotice] = useState<PasswordNotice | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // Solo un superadmin asigna el rol superadmin (manage-users también lo comprueba).
  const assignableRoles = access?.role === SUPERADMIN ? roles : roles.filter((role) => role.code !== SUPERADMIN)
  const visible = filterUsers(users, filters)
  const close = () => setDialog(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-on-surface-variant">
          Cuentas con acceso al dashboard. Las cuentas nuevas reciben una contraseña temporal que deben cambiar en su
          primer ingreso.
        </p>
        {canManage && (
          <Button onClick={() => setDialog({ kind: 'form', user: null, key: Date.now() })} aria-haspopup="dialog">
            <Icon paths={icons.plus} className="size-4" />
            Crear usuario
          </Button>
        )}
      </div>

      {notice && <PasswordNoticeCard notice={notice} onClose={() => setNotice(null)} />}

      <UsersFilters filters={filters} roles={roles} onChange={setFilters} />

      {error && (
        <Alert variant="error" title={error}>
          <button type="button" onClick={reload} className="font-semibold underline">
            Intentar de nuevo
          </button>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={users.length === 0 ? 'Todavía no hay usuarios' : 'Ningún usuario coincide con los filtros'}
          action={
            users.length > 0 && (
              <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-on-surface-variant" aria-live="polite">
              {visible.length === users.length
                ? `${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'}`
                : `${visible.length} de ${users.length} usuarios`}
            </p>
            <Button variant="tertiary" size="sm" onClick={reload} loading={refreshing}>
              {!refreshing && <Icon paths={icons.refresh} className="size-4" />}
              Actualizar
            </Button>
          </div>
          <UsersTable
            users={visible}
            currentUserId={session?.user.id ?? null}
            highlightId={highlightId}
            canManage={canManage}
            onEdit={(user) => setDialog({ kind: 'form', user, key: Date.now() })}
            onToggleActive={(user) => setDialog({ kind: 'toggle', user })}
            onResetPassword={(user) => setDialog({ kind: 'reset', user })}
          />
        </>
      )}

      {dialog?.kind === 'form' && (
        <UserFormModal
          key={dialog.key}
          open
          user={dialog.user}
          roles={assignableRoles}
          onClose={close}
          onSaved={(result, draft) => {
            close()
            setHighlightId(result.userId)
            setFilters(EMPTY_FILTERS)
            if (result.temporaryPassword) {
              setNotice({
                kind: 'created',
                userId: result.userId,
                name: draft.fullName,
                password: result.temporaryPassword,
              })
            }
            reload()
          }}
        />
      )}

      {dialog?.kind === 'toggle' && (
        <ConfirmDialog
          open
          title={dialog.user.active ? 'Desactivar usuario' : 'Reactivar usuario'}
          confirmLabel={dialog.user.active ? 'Desactivar' : 'Reactivar'}
          danger={dialog.user.active}
          onClose={close}
          onConfirm={async () => {
            await manageUsers({ action: 'set-active', userId: dialog.user.id, active: !dialog.user.active })
            close()
            setHighlightId(dialog.user.id)
            reload()
          }}
        >
          {dialog.user.active ? (
            <p>
              <strong className="text-on-surface">{displayName(dialog.user)}</strong> no podrá iniciar sesión hasta que
              lo reactive. Sus datos se conservan.
            </p>
          ) : (
            <p>
              <strong className="text-on-surface">{displayName(dialog.user)}</strong> podrá volver a iniciar sesión con
              su contraseña actual.
            </p>
          )}
        </ConfirmDialog>
      )}

      {dialog?.kind === 'reset' && (
        <ConfirmDialog
          open
          title="Restablecer contraseña"
          confirmLabel="Restablecer"
          onClose={close}
          onConfirm={async () => {
            const result = await manageUsers({ action: 'reset-password', userId: dialog.user.id })
            close()
            setHighlightId(dialog.user.id)
            if (result.temporaryPassword) {
              setNotice({
                kind: 'reset',
                userId: dialog.user.id,
                name: displayName(dialog.user),
                password: result.temporaryPassword,
              })
            }
            reload()
          }}
        >
          <p>
            Se generará una contraseña temporal nueva para{' '}
            <strong className="text-on-surface">{displayName(dialog.user)}</strong>. La actual dejará de funcionar y
            deberá cambiar la temporal en su próximo ingreso.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
