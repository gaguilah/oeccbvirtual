import { describe, expect, it } from 'vitest'
import { personalSaveError } from './personalErrors'

const fk = (constraint: string) => ({
  code: '23503',
  message: `insert or update on table "profile_personal_info" violates foreign key constraint "${constraint}"`,
})

describe('personalSaveError', () => {
  it('distingue la EPS del perfil en las llaves foráneas', () => {
    expect(personalSaveError(fk('profile_personal_info_eps_id_fkey')).message).toBe('Esa EPS ya no existe: elija otra.')
    expect(personalSaveError(fk('profile_personal_info_user_id_fkey')).message).toMatch(/^No se encontró su perfil/)
  })

  it('usa el mensaje genérico para otra llave foránea o un error desconocido', () => {
    expect(personalSaveError({ code: '23503' }).message).toBe('No se pudieron guardar sus datos. Intente de nuevo.')
    expect(personalSaveError({ code: 'XX000' }).message).toBe('No se pudieron guardar sus datos. Intente de nuevo.')
  })

  it('las restricciones de formato dan su propio mensaje', () => {
    expect(personalSaveError({ code: '23514' }).message).toMatch(/^Algún dato tiene un formato no permitido/)
    expect(personalSaveError({ code: '23514' }).field).toBeUndefined()
  })

  it('las restricciones del correo van al campo correo', () => {
    const check = (constraint: string) =>
      personalSaveError({
        code: '23514',
        message: `new row for relation "profile_personal_info" violates check constraint "${constraint}"`,
      })
    expect(check('profile_personal_info_email_ascii_chk')).toMatchObject({
      field: 'personalEmail',
      message: 'Escriba el correo sin tildes, eñes ni otros caracteres especiales',
    })
    expect(check('profile_personal_info_email_chk').field).toBe('personalEmail')
    expect(check('profile_personal_info_mobile_chk').field).toBeUndefined()
  })
})
