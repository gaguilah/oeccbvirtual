import { describe, expect, it } from 'vitest'
import {
  newPasswordField,
  newPasswordSchema,
  PASSWORD_HINT,
  PASSWORD_MAX,
  PASSWORD_MIN,
  passwordErrorMessage,
} from './password'

const firstError = (password: string, confirm = password) => {
  const result = newPasswordSchema.safeParse({ password, confirm })
  return result.success ? null : result.error.issues[0]
}

// Contraseña válida de n caracteres: una letra, un número y relleno.
const ofLength = (n: number) => 'a1'.padEnd(n, 'x')

describe('contraseña nueva', () => {
  it(`exige entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, () => {
    expect(newPasswordField.safeParse(ofLength(PASSWORD_MIN - 1)).success).toBe(false)
    expect(newPasswordField.safeParse(ofLength(PASSWORD_MIN)).success).toBe(true)
    expect(newPasswordField.safeParse(ofLength(PASSWORD_MAX)).success).toBe(true)
    expect(newPasswordField.safeParse(ofLength(PASSWORD_MAX + 1)).success).toBe(false)
  })

  it('exige al menos una letra y un número, como Supabase Auth', () => {
    expect(firstError('12345678')?.message).toBe('La contraseña debe incluir al menos una letra (a-z, sin tilde)')
    expect(firstError('solo-letras')?.message).toBe('La contraseña debe incluir al menos un número')
    expect(firstError('Clave2026')).toBeNull()
    expect(firstError('CLAVE2026')).toBeNull()
  })

  it('las letras con tilde o la ñ no cuentan como letra (Auth solo cuenta a-z)', () => {
    expect(firstError('ñññññ123')?.message).toBe('La contraseña debe incluir al menos una letra (a-z, sin tilde)')
    expect(firstError('áéíóú123')?.message).toBe('La contraseña debe incluir al menos una letra (a-z, sin tilde)')
    expect(firstError('niño2026')).toBeNull()
  })

  it('la confirmación debe coincidir y el error va en ese campo', () => {
    expect(firstError('clave-segura-1')).toBeNull()
    expect(firstError('clave-segura-1', 'clave-segura-2')).toMatchObject({
      message: 'Las contraseñas no coinciden',
      path: ['confirm'],
    })
  })

  it('el texto de ayuda dice la regla completa', () => {
    expect(PASSWORD_HINT).toBe('Entre 8 y 72 caracteres, con al menos una letra y un número.')
  })
})

describe('passwordErrorMessage', () => {
  it('traduce los códigos conocidos de Supabase Auth', () => {
    expect(passwordErrorMessage('same_password')).toBe('La nueva contraseña debe ser distinta de la actual.')
    expect(passwordErrorMessage('invalid_credentials')).toBe('La contraseña actual no es correcta.')
    expect(passwordErrorMessage('captcha_failed')).toBe(
      'La verificación de seguridad falló. Complétela de nuevo e intente otra vez.',
    )
  })

  it('usa el mensaje genérico sin código o con uno desconocido', () => {
    const generic = 'No se pudo cambiar la contraseña. Intente de nuevo.'
    expect(passwordErrorMessage(undefined)).toBe(generic)
    expect(passwordErrorMessage('otro_codigo')).toBe(generic)
    expect(passwordErrorMessage('toString')).toBe(generic)
  })
})
