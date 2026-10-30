import { describe, expect, it } from 'vitest'
import { newPasswordField, newPasswordSchema, PASSWORD_MAX, PASSWORD_MIN, passwordErrorMessage } from './password'

const firstError = (password: string, confirm = password) => {
  const result = newPasswordSchema.safeParse({ password, confirm })
  return result.success ? null : result.error.issues[0]
}

describe('contraseña nueva', () => {
  it(`exige entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, () => {
    expect(newPasswordField.safeParse('a'.repeat(PASSWORD_MIN - 1)).success).toBe(false)
    expect(newPasswordField.safeParse('a'.repeat(PASSWORD_MIN)).success).toBe(true)
    expect(newPasswordField.safeParse('a'.repeat(PASSWORD_MAX)).success).toBe(true)
    expect(newPasswordField.safeParse('a'.repeat(PASSWORD_MAX + 1)).success).toBe(false)
  })

  it('la confirmación debe coincidir y el error va en ese campo', () => {
    expect(firstError('clave-segura-1')).toBeNull()
    expect(firstError('clave-segura-1', 'clave-segura-2')).toMatchObject({
      message: 'Las contraseñas no coinciden',
      path: ['confirm'],
    })
  })
})

describe('passwordErrorMessage', () => {
  it('traduce los códigos conocidos de Supabase Auth', () => {
    expect(passwordErrorMessage('same_password')).toBe('La nueva contraseña debe ser distinta de la actual.')
    expect(passwordErrorMessage('invalid_credentials')).toBe('La contraseña actual no es correcta.')
  })

  it('usa el mensaje genérico sin código o con uno desconocido', () => {
    const generic = 'No se pudo cambiar la contraseña. Intente de nuevo.'
    expect(passwordErrorMessage(undefined)).toBe(generic)
    expect(passwordErrorMessage('otro_codigo')).toBe(generic)
    expect(passwordErrorMessage('toString')).toBe(generic)
  })
})
