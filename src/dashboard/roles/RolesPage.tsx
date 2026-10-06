import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, ButtonLink, EmptyState, Spinner, Tooltip } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ConfirmDialog, Icon, icons } from '../ui'
import { deleteRole, fetchRoles } from './api'
import { ROLES_PATH, scopeLabel } from './data'
import type { RoleRow, RolesFlash } from './types'

function useRoles() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetchRoles()
      .then((rows) => {
        if (!active) return
        setRoles(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de roles.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [version])

  return { roles, loading: !loaded, error, reload: () => setVersion((v) => v + 1) }
}

// Por qué no se puede borrar un rol (null: sí se puede).
function deleteBlocker(role: RoleRow): string | null {
  if (role.is_system) return 'Rol del sistema'
  if (role.user_count > 0) return 'Tiene usuarios asignados'
  return null
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

// Sección Roles (/dashboard/roles, docs/plan-usuarios.md fase 3). Ver: roles.ver. Crear, editar y
// borrar: roles.gestionar (lo vuelven a exigir las políticas y save_role).
export default function RolesPage() {
  useDocumentMeta({ title: 'Roles · Dashboard', noindex: true })
  const location = useLocation()
  const navigate = useNavigate()
  const canManage = useAccess().can('roles.gestionar')
  const { roles, loading, error, reload } = useRoles()
  const [flash, setFlash] = useState<RolesFlash | null>(
    () => (location.state as { flash?: RolesFlash } | null)?.flash ?? null,
  )
  const [toDelete, setToDelete] = useState<RoleRow | null>(null)

  // El aviso llega una vez por location.state: se quita del historial para que no vuelva al recargar.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-on-surface-variant">
          Cada usuario tiene un rol. El rol define qué puede hacer (sus permisos) y sobre qué juzgado (su alcance).
        </p>
        {canManage && (
          <ButtonLink to={`${ROLES_PATH}/nuevo`}>
            <Icon paths={icons.plus} className="size-4" />
            Crear rol
          </ButtonLink>
        )}
      </div>

      {flash && (
        <Alert variant="success" onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState title="Todavía no hay roles" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => {
            const blocker = deleteBlocker(role)
            return (
              <li
                key={role.id}
                className={cn(
                  'flex flex-col gap-4 rounded-lg bg-surface-container-low p-5 sm:p-6',
                  flash?.highlightId === role.id && 'bg-primary-container/50',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-bold">{role.name}</h2>
                    <code className="block font-mono text-xs text-on-surface-variant">{role.code}</code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.is_system && <Badge variant="primary">Sistema</Badge>}
                    <Badge>{scopeLabel(role.scope)}</Badge>
                  </div>
                </div>
                {role.description && <p className="text-sm text-on-surface-variant">{role.description}</p>}
                <p className="text-sm text-on-surface">
                  {plural(role.user_count, 'usuario', 'usuarios')} ·{' '}
                  {role.is_system ? 'Todos los permisos' : plural(role.permission_count, 'permiso', 'permisos')}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <ButtonLink to={`${ROLES_PATH}/${role.id}`} variant="secondary" size="sm">
                    {canManage && !role.is_system ? 'Editar' : 'Ver'}
                    <span className="sr-only"> el rol {role.name}</span>
                  </ButtonLink>
                  {canManage && !role.is_system && (
                    <Tooltip label={blocker ?? 'Borrar rol'}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (!blocker) setToDelete(role)
                        }}
                        aria-disabled={blocker ? true : undefined}
                        className={cn(blocker && 'cursor-not-allowed opacity-60 hover:bg-transparent')}
                        aria-label={
                          blocker ? `No se puede borrar ${role.name}: ${blocker}` : `Borrar el rol ${role.name}`
                        }
                        aria-haspopup={blocker ? undefined : 'dialog'}
                      >
                        Borrar
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title="¿Borrar este rol?"
          confirmLabel="Borrar"
          tone="danger"
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteRole(toDelete.id)
            setToDelete(null)
            setFlash({ message: `Rol "${toDelete.name}" borrado.`, highlightId: '' })
            reload()
          }}
        >
          <p>
            Se borrará el rol <strong className="text-on-surface">{toDelete.name}</strong> con sus permisos. Esta acción
            no se puede deshacer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
