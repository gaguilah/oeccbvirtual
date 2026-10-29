import { describe, expect, it } from 'vitest'
import {
  DEPENDENCIES,
  dependencyLabel,
  displayName,
  EMPTY_FILTERS,
  filterUsers,
  lastSignIn,
  personalInfoBlocker,
  userDependency,
  userStatus,
} from './data'
import { userSchema } from './schema'
import type { UserRow } from './types'

const user = (court: UserRow['court']) => ({ court }) as UserRow

describe('personalInfoBlocker', () => {
  it('no bloquea a quien ve todos los juzgados', () => {
    expect(personalInfoBlocker(null, user(1))).toBeUndefined()
    expect(personalInfoBlocker(null, user(null))).toBeUndefined()
  })

  it('no bloquea a los usuarios del mismo juzgado', () => {
    expect(personalInfoBlocker(1, user(1))).toBeUndefined()
  })

  it('bloquea otro juzgado y a los usuarios sin juzgado', () => {
    expect(personalInfoBlocker(1, user(2))).toBe('Solo puede consultar usuarios del Juzgado 1')
    expect(personalInfoBlocker(2, user(null))).toBe('Solo puede consultar usuarios del Juzgado 2')
  })
})

function row(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'u1',
    email: 'ana@oeccb.test',
    full_name: 'Ana Núñez',
    role_id: 'r-juzgado',
    role_code: 'juzgado',
    role_name: 'Juzgado',
    scope: 'court',
    court: 1,
    active: true,
    must_change_password: false,
    created_at: '2026-10-01T08:00:00-05:00',
    last_sign_in_at: null,
    ...overrides,
  }
}

describe('userStatus', () => {
  it('sin rol, desactivado, contraseña temporal o activo, en ese orden', () => {
    expect(userStatus(row({ role_id: null, active: false }))).toBe('no-role')
    expect(userStatus(row({ active: false, must_change_password: true }))).toBe('inactive')
    expect(userStatus(row({ must_change_password: true }))).toBe('temporary')
    expect(userStatus(row())).toBe('active')
  })
})

describe('dependencia', () => {
  it('el juzgado, Oficina si el rol ve los dos, nada sin rol', () => {
    expect([userDependency(row()), dependencyLabel(row())]).toEqual(['court-1', 'Juzgado 1'])
    expect([userDependency(row({ court: null })), dependencyLabel(row({ court: null }))]).toEqual([
      'oficina',
      'Oficina',
    ])
    expect([
      userDependency(row({ court: null, role_id: null })),
      dependencyLabel(row({ court: null, role_id: null })),
    ]).toEqual([null, '—'])
  })

  it('DEPENDENCIES: los dos juzgados y Oficina', () => {
    expect(DEPENDENCIES.map((d) => d.value)).toEqual(['court-1', 'court-2', 'oficina'])
  })
})

describe('textos', () => {
  it('displayName: el nombre o, si falta, el correo', () => {
    expect(displayName(row())).toBe('Ana Núñez')
    expect(displayName(row({ full_name: '  ' }))).toBe('ana@oeccb.test')
    expect(displayName(row({ full_name: null }))).toBe('ana@oeccb.test')
  })

  it('lastSignIn: "Nunca" o fecha y hora por separado', () => {
    expect(lastSignIn(row())).toEqual({ date: 'Nunca', time: null })
    const signIn = lastSignIn(row({ last_sign_in_at: '2026-10-29T08:00:00-05:00' }))
    expect(signIn.date).toMatch(/2026/)
    expect(signIn.time).toBeTruthy()
  })
})

describe('filterUsers', () => {
  const users = [
    row(),
    row({ id: 'u2', email: 'jose@oeccb.test', full_name: 'José Pérez', court: 2 }),
    row({ id: 'u3', email: 'ofi@oeccb.test', full_name: null, role_id: 'r-oficina', court: null, active: false }),
    row({ id: 'u4', email: 'nuevo@oeccb.test', full_name: null, role_id: null, court: null }),
  ]
  const ids = (filters: Partial<typeof EMPTY_FILTERS>) =>
    filterUsers(users, { ...EMPTY_FILTERS, ...filters }).map((user) => user.id)

  it('sin filtros, todos', () => {
    expect(ids({})).toEqual(['u1', 'u2', 'u3', 'u4'])
  })

  it('busca en nombre y correo sin tildes ni mayúsculas', () => {
    expect(ids({ q: 'JOSE' })).toEqual(['u2'])
    expect(ids({ q: '  nunez ' })).toEqual(['u1'])
    expect(ids({ q: 'Núñez' })).toEqual(['u1'])
    expect(ids({ q: 'ofi@' })).toEqual(['u3'])
  })

  it('por rol, dependencia y estado, combinados', () => {
    expect(ids({ role: 'r-oficina' })).toEqual(['u3'])
    expect(ids({ dependency: 'court-2' })).toEqual(['u2'])
    expect(ids({ dependency: 'oficina' })).toEqual(['u3'])
    expect(ids({ status: 'no-role' })).toEqual(['u4'])
    expect(ids({ status: 'active', dependency: 'court-1' })).toEqual(['u1'])
    expect(ids({ status: 'inactive', q: 'jose' })).toEqual([])
  })
})

describe('userSchema', () => {
  it('correo en minúsculas y sin espacios; rol obligatorio', () => {
    const valid = { fullName: 'Ana Núñez', email: '  Ana@OECCB.test ', roleId: 'r1', court: '1' }
    expect(userSchema.safeParse(valid).data?.email).toBe('ana@oeccb.test')
    expect(userSchema.safeParse({ ...valid, roleId: '' }).success).toBe(false)
    expect(userSchema.safeParse({ ...valid, email: 'ana' }).success).toBe(false)
    expect(userSchema.safeParse({ ...valid, fullName: 'A' }).success).toBe(false)
  })
})
