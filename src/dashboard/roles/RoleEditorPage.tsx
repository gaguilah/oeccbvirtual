import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, ButtonLink, Input, Spinner, Textarea } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess, type RoleScope } from '../access'
import { fetchPermissions, groupPermissions, type Permission } from '../permisos'
import { fetchRolePermissions, fetchRoles, saveRole } from './api'
import { ROLES_PATH, roleCode, SCOPES } from './data'
import PermissionMatrix from './PermissionMatrix'
import type { RoleDraft, RoleRow, RolesFlash } from './types'

type Loaded = { permissions: Permission[]; role: RoleRow | null; draft: RoleDraft }

const EMPTY_DRAFT: RoleDraft = { name: '', description: '', scope: 'court', permissions: [] }

// Carga el catálogo de permisos y, al editar, el rol y sus permisos.
function useRoleData(id: string | undefined) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async (): Promise<Loaded> => {
      const permissions = await fetchPermissions()
      if (!id) return { permissions, role: null, draft: EMPTY_DRAFT }
      const role = (await fetchRoles()).find((row) => row.id === id) ?? null
      if (!role) throw new Error('El rol no existe.')
      const codes = role.is_system ? permissions.map((p) => p.code) : await fetchRolePermissions(id)
      return {
        permissions,
        role,
        draft: { name: role.name, description: role.description ?? '', scope: role.scope, permissions: codes },
      }
    }
    load()
      .then((data) => {
        if (active) setLoaded(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el rol.')
      })
    return () => {
      active = false
    }
  }, [id])

  return { loaded, error }
}

// Crear (/dashboard/roles/nuevo) o editar (/dashboard/roles/:id) un rol: nombre, descripción,
// alcance y permisos. Sin roles.gestionar, o con el rol del sistema, solo se puede ver.
export default function RoleEditorPage() {
  const { id: param } = useParams()
  const id = param === 'nuevo' ? undefined : param
  const { loaded, error } = useRoleData(id)

  if (error) {
    return (
      <div className="max-w-3xl space-y-4">
        <BackLink />
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }
  if (!loaded) {
    return (
      <div className="flex justify-center py-12 text-primary">
        <Spinner />
      </div>
    )
  }
  // key: si cambia el rol, el formulario arranca de cero con sus datos.
  return <RoleForm key={id ?? 'nuevo'} {...loaded} />
}

function BackLink() {
  return (
    <Link to={ROLES_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
      ← Volver a Roles
    </Link>
  )
}

function RoleForm({ permissions, role, draft: initial }: Loaded) {
  const navigate = useNavigate()
  const canManage = useAccess().can('roles.gestionar')
  const readOnly = !canManage || Boolean(role?.is_system)
  const title = role ? (readOnly ? role.name : `Editar rol: ${role.name}`) : 'Crear rol'
  useDocumentMeta({ title: `${role?.name ?? 'Nuevo rol'} · Roles · Dashboard`, noindex: true })

  const [draft, setDraft] = useState<RoleDraft>(initial)
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const code = role?.code ?? roleCode(draft.name)
  // Un rol con usuarios no cambia de alcance (lo impide también un trigger).
  const scopeLocked = Boolean(role && role.user_count > 0)
  const groups = groupPermissions(permissions)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const name = draft.name.trim().replace(/\s+/g, ' ')
    if (name.length < 3 || name.length > 60) return setNameError('El nombre debe tener entre 3 y 60 caracteres.')
    if (!code) return setNameError('El nombre debe tener letras.')
    setNameError(null)
    setSaving(true)
    try {
      const savedId = await saveRole(role?.id ?? null, code, { ...draft, name })
      const flash: RolesFlash = { message: `Rol "${name}" ${role ? 'actualizado' : 'creado'}.`, highlightId: savedId }
      navigate(ROLES_PATH, { state: { flash } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar el rol.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-5xl space-y-8">
      <div className="space-y-3">
        <BackLink />
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {role?.is_system && (
          <Alert variant="info" live={false}>
            Este rol del sistema tiene todos los permisos, incluidos los que se agreguen después, y no se puede
            modificar.
          </Alert>
        )}
        {!canManage && !role?.is_system && (
          <Alert variant="info" live={false}>
            Puede ver este rol, pero no tiene permiso para modificarlo.
          </Alert>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Datos del rol">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={draft.name}
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value })
              setNameError(null)
            }}
            maxLength={60}
            readOnly={readOnly}
            error={nameError ?? undefined}
            hint={code ? `Código: ${code}${role ? '' : ' (no se puede cambiar después)'}` : undefined}
          />
          <Textarea
            label="Descripción"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            maxLength={300}
            readOnly={readOnly}
          />
        </div>

        <fieldset className="space-y-2" disabled={readOnly || scopeLocked}>
          <legend className="mb-1 text-sm font-medium text-on-surface">Alcance</legend>
          {SCOPES.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex gap-3 rounded-lg p-4 transition-colors',
                draft.scope === option.value ? 'bg-primary-container/50' : 'bg-surface-container-low',
                !(readOnly || scopeLocked) && 'cursor-pointer hover:bg-primary-container/30',
              )}
            >
              <input
                type="radio"
                name="scope"
                value={option.value}
                checked={draft.scope === option.value}
                onChange={() => setDraft({ ...draft, scope: option.value as RoleScope })}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-on-surface">{option.label}</span>
                <span className="block text-xs text-on-surface-variant">{option.description}</span>
              </span>
            </label>
          ))}
          {scopeLocked && !readOnly && (
            <p className="text-xs text-on-surface-variant">
              El alcance no se puede cambiar porque el rol tiene usuarios asignados.
            </p>
          )}
        </fieldset>
      </section>

      <section className="space-y-3" aria-labelledby="role-permissions-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="role-permissions-title" className="text-lg font-bold">
            Permisos
          </h2>
          <p className="text-sm text-on-surface-variant">
            {draft.permissions.length} de {permissions.length} marcados
          </p>
        </div>
        <PermissionMatrix
          groups={groups}
          selected={draft.permissions}
          onChange={(selected) => setDraft({ ...draft, permissions: selected })}
          readOnly={readOnly}
        />
      </section>

      {serverError && <Alert variant="error">{serverError}</Alert>}

      {!readOnly && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ButtonLink to={ROLES_PATH} variant="secondary">
            Cancelar
          </ButtonLink>
          <Button type="submit" loading={saving}>
            {role ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        </div>
      )}
    </form>
  )
}
