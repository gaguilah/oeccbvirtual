import { describe, expect, it } from 'vitest'
import { personalInfoBlocker } from './data'
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
