import { describe, expect, it } from 'vitest'
import type { Access } from './api'
import { checkPermission, roleLabel, SUPERADMIN } from './access'

// Misma lógica que public.has_permission (20261005150000_roles_permissions.sql): cambiar juntos.
function access(overrides: Partial<Access> = {}): Access {
  return {
    role: 'oficina',
    role_name: 'Oficina',
    scope: 'all',
    court: null,
    active: true,
    must_change_password: false,
    permissions: ['remates.ver', 'audiencias.ver'],
    ...overrides,
  }
}

const juzgado1 = access({ role: 'juzgado', role_name: 'Juzgado', scope: 'court', court: 1 })

describe('checkPermission', () => {
  it('sin acceso, perfil inactivo o sin rol no puede nada, ni siquiera lo que no pide permiso', () => {
    expect(checkPermission(null)).toBe(false)
    expect(checkPermission(access({ active: false }), 'remates.ver')).toBe(false)
    expect(checkPermission(access({ active: false }))).toBe(false)
    expect(checkPermission(access({ role: null }))).toBe(false)
  })

  it('sin permiso pedido basta con tener rol y estar activo', () => {
    expect(checkPermission(access())).toBe(true)
    expect(checkPermission(access({ permissions: [] }))).toBe(true)
  })

  it('superadmin puede todo, también permisos que aún no existen y cualquier juzgado', () => {
    const superadmin = access({ role: SUPERADMIN, permissions: [] })
    expect(checkPermission(superadmin, 'remates.eliminar')).toBe(true)
    expect(checkPermission(superadmin, 'modulo.futuro', 2)).toBe(true)
  })

  it('superadmin inactivo no puede nada', () => {
    expect(checkPermission(access({ role: SUPERADMIN, active: false }), 'remates.ver')).toBe(false)
  })

  it('pide que el rol tenga el permiso exacto', () => {
    expect(checkPermission(access(), 'remates.ver')).toBe(true)
    expect(checkPermission(access(), 'remates.crear')).toBe(false)
    expect(checkPermission(access(), 'remates')).toBe(false)
  })

  it('alcance "all": cualquier juzgado', () => {
    expect(checkPermission(access(), 'remates.ver', 1)).toBe(true)
    expect(checkPermission(access(), 'remates.ver', 2)).toBe(true)
  })

  it('alcance "court": solo su juzgado cuando se pide uno', () => {
    expect(checkPermission(juzgado1, 'remates.ver', 1)).toBe(true)
    expect(checkPermission(juzgado1, 'remates.ver', 2)).toBe(false)
    // Sin juzgado (menú, rutas): basta con el permiso.
    expect(checkPermission(juzgado1, 'remates.ver')).toBe(true)
    expect(checkPermission(juzgado1, 'remates.crear', 1)).toBe(false)
  })
})

describe('roleLabel', () => {
  it('nombre del rol, con el juzgado si lo tiene', () => {
    expect(roleLabel(null)).toBeNull()
    expect(roleLabel(access({ role_name: null }))).toBeNull()
    expect(roleLabel(access())).toBe('Oficina')
    expect(roleLabel(juzgado1)).toBe('Juzgado · Juzgado 1')
  })
})
