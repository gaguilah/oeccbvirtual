import { describe, expect, it } from 'vitest'
import { roleCode, scopeLabel } from '../roles/data'
import { groupPermissions, MODULE_LABELS, moduleLabel } from './data'
import type { Permission } from './types'

const migrations = import.meta.glob('/supabase/migrations/*.sql', { query: '?raw', import: 'default', eager: true })
// Módulos de los permisos que crean las migraciones (insert into public.permissions … ('modulo.accion', 'modulo', …)).
const modules = new Set(
  Object.values(migrations).flatMap((sql) =>
    [...(sql as string).matchAll(/\(\s*'[a-z_]+\.[a-z_]+',\s*'([a-z_]+)',/g)].map((match) => match[1]),
  ),
)
const permission = (code: string): Permission => ({ code, module: code.split('.')[0], name: code, description: null })

describe('módulos de permisos', () => {
  it('cada módulo de las migraciones tiene su nombre en MODULE_LABELS', () => {
    expect(modules.size).toBeGreaterThan(5)
    for (const module of modules) expect(Object.keys(MODULE_LABELS), module).toContain(module)
  })

  it('moduleLabel: el nombre o, si falta, el código con mayúscula inicial', () => {
    expect(moduleLabel('remates')).toBe('Avisos de Remate')
    expect(moduleLabel('nuevo')).toBe('Nuevo')
    expect(moduleLabel('constructor')).toBe('Constructor')
  })

  it('groupPermissions agrupa por módulo en el orden en que llegan', () => {
    const groups = groupPermissions(['pqrs.ver', 'pqrs.responder', 'remates.ver'].map(permission))
    expect(groups.map((group) => [group.module, group.label, group.permissions.length])).toEqual([
      ['pqrs', 'PQRS', 2],
      ['remates', 'Avisos de Remate', 1],
    ])
  })
})

describe('roles', () => {
  it('roleCode: sin tildes, en minúsculas y con guiones bajos (roles_code_format)', () => {
    expect(roleCode('Secretaría General')).toBe('secretaria_general')
    expect(roleCode('  Director (Oficina) 2  ')).toBe('director_oficina')
    expect(roleCode('Ñoño')).toBe('nono')
    // Sin letras: vacío, y el editor pide un nombre con letras.
    expect(roleCode('123')).toBe('')
    for (const name of ['Secretaría General', 'a-b-c', 'Ünï  çase']) expect(roleCode(name)).toMatch(/^[a-z_]+$/)
  })

  it('scopeLabel', () => {
    expect(scopeLabel('court')).toBe('Un juzgado')
    expect(scopeLabel('all')).toBe('Ambos juzgados')
  })
})
