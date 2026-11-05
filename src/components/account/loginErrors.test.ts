import { describe, expect, it } from 'vitest'
import { loginErrorMessage } from './loginErrors'

describe('loginErrorMessage', () => {
  it('traduce los códigos de Supabase Auth al iniciar sesión', () => {
    expect(loginErrorMessage('invalid_credentials')).toBe('Correo o contraseña incorrectos.')
    expect(loginErrorMessage('user_banned')).toBe(
      'Su cuenta está desactivada. Comuníquese con el Administrador de Sistema.',
    )
    expect(loginErrorMessage('captcha_failed')).toBe(
      'La verificación de seguridad falló. Complétela de nuevo e intente otra vez.',
    )
  })

  it('usa el mensaje genérico sin código o con uno desconocido', () => {
    const generic = 'No se pudo iniciar sesión. Intente de nuevo en unos minutos.'
    expect(loginErrorMessage(undefined)).toBe(generic)
    expect(loginErrorMessage('otro_codigo')).toBe(generic)
    expect(loginErrorMessage('toString')).toBe(generic)
  })
})
