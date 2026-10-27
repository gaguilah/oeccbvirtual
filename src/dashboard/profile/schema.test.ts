import { describe, expect, it } from 'vitest'
import { nameSchema, passwordSchema } from './schema'

function nameError(value: string) {
  const result = nameSchema.safeParse(value)
  return result.success ? null : result.error.issues[0].message
}

describe('nombre del perfil', () => {
  it('acepta nombres con tildes, guiones, apóstrofos y abreviaturas', () => {
    for (const name of ['José Ñúñez', 'Ana-María Peña', "D'Angelo Ruiz", 'Ma. José Gómez', 'Luis A.']) {
      expect(nameError(name)).toBeNull()
    }
  })

  it('normaliza espacios y el apóstrofo tipográfico', () => {
    expect(nameSchema.parse('  Juan   O’Brien ')).toBe("Juan O'Brien")
  })

  it('rechaza nombres cortos, con números o con signos seguidos', () => {
    expect(nameError('Al')).toBe('Escriba su nombre completo')
    expect(nameError('Juan 2')).toBe('El nombre no puede tener números')
    expect(nameError('Juan--Pérez')).toBe(
      "Use solo letras, espacios, guiones (-) y apóstrofos ('), sin signos seguidos",
    )
    expect(nameError('Juan @Pérez')).toBe(
      "Use solo letras, espacios, guiones (-) y apóstrofos ('), sin signos seguidos",
    )
  })

  it('no pasa de 120 caracteres', () => {
    expect(nameError('a'.repeat(120))).toBeNull()
    expect(nameError('a'.repeat(121))).toBe('El nombre no puede pasar de 120 caracteres')
  })
})

describe('cambio de contraseña', () => {
  const valid = { current: 'actual-123', password: 'nueva-1234', confirm: 'nueva-1234' }

  function passwordErrors(values: Partial<typeof valid>) {
    const result = passwordSchema.safeParse({ ...valid, ...values })
    return result.success ? [] : result.error.issues.map((issue) => issue.message)
  }

  it('acepta un cambio válido', () => {
    expect(passwordErrors({})).toEqual([])
  })

  it('exige la contraseña actual, 8 caracteres y que coincida la confirmación', () => {
    expect(passwordErrors({ current: '' })).toContain('Escriba su contraseña actual')
    expect(passwordErrors({ password: 'corta', confirm: 'corta' })).toContain(
      'La contraseña debe tener al menos 8 caracteres',
    )
    expect(passwordErrors({ confirm: 'otra-1234' })).toContain('Las contraseñas no coinciden')
  })

  it('no permite repetir la contraseña actual', () => {
    expect(passwordErrors({ password: 'actual-123', confirm: 'actual-123' })).toContain(
      'La nueva contraseña debe ser distinta de la actual',
    )
  })
})
