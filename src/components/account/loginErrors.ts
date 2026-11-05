// Mensajes en español para los errores de Supabase Auth al iniciar sesión (pages/Login.tsx). Los de
// cambiar la contraseña están en src/lib/password.ts.
const LOGIN_ERRORS: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_banned: 'Su cuenta está desactivada. Comuníquese con el Administrador de Sistema.',
  // Captcha de Auth (docs/plan-seguridad-supabase.md, Fase 3).
  captcha_failed: 'La verificación de seguridad falló. Complétela de nuevo e intente otra vez.',
  over_request_rate_limit: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
}

export function loginErrorMessage(code: string | undefined): string {
  // Object.hasOwn: un código como "toString" no debe devolver lo heredado de Object.
  return code && Object.hasOwn(LOGIN_ERRORS, code)
    ? LOGIN_ERRORS[code]
    : 'No se pudo iniciar sesión. Intente de nuevo en unos minutos.'
}
