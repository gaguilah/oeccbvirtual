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
  })
})
