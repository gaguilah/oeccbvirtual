// Errores al guardar profile_personal_info (migración 20261027120000), en español. Aparte de
// personalApi.ts para probarlos sin el cliente de Supabase. PostgREST trae el nombre de la
// restricción en `message` ("… violates foreign key constraint "profile_personal_info_eps_id_fkey"").
import { EMAIL_CHARS_MESSAGE } from './personalSchema'

export type DbError = { code?: string; message?: string; details?: string }

// `field`: el campo del formulario al que corresponde el error, para mostrarlo junto a él.
export class PersonalSaveError extends Error {
  field?: 'personalEmail'

  constructor(message: string, field?: 'personalEmail') {
    super(message)
    this.field = field
  }
}

const violates = (error: DbError, constraint: string) =>
  `${error.message ?? ''} ${error.details ?? ''}`.includes(constraint)

export function personalSaveError(error: DbError): PersonalSaveError {
  // 23514: lo rechazó una restricción de formato (alguien se saltó el formulario, o el formulario y la
  // base no coinciden). Las del correo van al campo correo.
  if (error.code === '23514') {
    if (violates(error, 'profile_personal_info_email_ascii_chk'))
      return new PersonalSaveError(EMAIL_CHARS_MESSAGE, 'personalEmail')
    if (violates(error, 'profile_personal_info_email_chk'))
      return new PersonalSaveError('Escriba un correo válido, por ejemplo nombre@correo.com', 'personalEmail')
    return new PersonalSaveError('Algún dato tiene un formato no permitido. Revíselo e intente de nuevo.')
  }
  if (error.code === '23503') {
    if (violates(error, 'profile_personal_info_eps_id_fkey'))
      return new PersonalSaveError('Esa EPS ya no existe: elija otra.')
    if (violates(error, 'profile_personal_info_user_id_fkey'))
      return new PersonalSaveError(
        'No se encontró su perfil. Recargue la página o comuníquese con el Administrador de Sistema.',
      )
  }
  return new PersonalSaveError('No se pudieron guardar sus datos. Intente de nuevo.')
}
