import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { fetchPermissionRoles, fetchPermissions } from './api'
import { groupPermissions } from './data'
import PermissionFormModal from './PermissionFormModal'
import type { Permission, PermissionRoles } from './types'

function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<PermissionRoles>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchPermissions(), fetchPermissionRoles()])
      .then(([rows, byCode]) => {
        if (!active) return
        setPermissions(rows)
        setRoles(byCode)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de permisos.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  // Tras editar: reemplaza el permiso en la lista sin volver a pedirla.
  const replace = (updated: Permission) =>
    setPermissions((current) => current.map((item) => (item.code === updated.code ? updated : item)))

  return { permissions, roles, loading: !loaded, error, replace }
}

// Sección Permisos (/dashboard/permisos, docs/plan-usuarios.md fase 4). Ver: permisos.ver. Editar
// nombre y descripción: permisos.gestionar. Los permisos no se crean aquí: nacen con la migración de
// cada sección, junto con las políticas que los revisan.
export default function PermissionsPage() {
  useDocumentMeta({ title: 'Permisos · Dashboard', noindex: true })
  const canManage = useAccess().can('permisos.gestionar')
  const { permissions, roles, loading, error, replace } = usePermissions()
  const [editing, setEditing] = useState<Permission | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const groups = groupPermissions(permissions)

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-on-surface-variant">
        Cada permiso es una acción que el sistema revisa. Se asignan a los roles en la sección Roles. Los permisos
        nuevos llegan con cada sección del dashboard; aquí se puede ajustar su nombre y descripción. Superadmin los
        tiene todos.
      </p>

      {saved && (
        <Alert variant="success" onClose={() => setSaved(null)}>
          {saved}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.module} aria-labelledby={`module-${group.module}`} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id={`module-${group.module}`} className="text-lg font-bold">
                {group.label}
              </h2>
              <span className="text-sm text-on-surface-variant">
                {group.permissions.length} {group.permissions.length === 1 ? 'permiso' : 'permisos'}
              </span>
            </div>
            <ul className="space-y-2">
              {group.permissions.map((permission) => {
                const assigned = roles[permission.code] ?? []
                return (
                  <li
                    key={permission.code}
                    className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-on-surface">{permission.name}</p>
                      {permission.description && (
                        <p className="text-sm text-on-surface-variant">{permission.description}</p>
                      )}
                      <code className="block font-mono text-xs text-on-surface-variant/80">{permission.code}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="sr-only">Roles con este permiso:</span>
                      {assigned.length > 0 ? (
                        assigned.map((name) => <Badge key={name}>{name}</Badge>)
                      ) : (
                        <span className="text-xs text-on-surface-variant">Solo Superadmin</span>
                      )}
                      {canManage && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(permission)}
                          aria-haspopup="dialog"
                          className="sm:ml-2"
                        >
                          Editar
                          <span className="sr-only"> el permiso {permission.name}</span>
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      {editing && (
        <PermissionFormModal
          permission={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replace(updated)
            setEditing(null)
            setSaved(`Permiso "${updated.name}" actualizado.`)
          }}
        />
      )}
    </div>
  )
}
