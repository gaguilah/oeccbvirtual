// Errores al guardar profile_personal_info (migración 20261027120000), en español. Aparte de
// personalApi.ts para probarlos sin el cliente de Supabase. PostgREST trae el nombre de la
// restricción en `message` ("… violates foreign key constraint "profile_personal_info_eps_id_fkey"").
export type DbError = { code?: string; message?: string; details?: string }

const violates = (error: DbError, constraint: string) =>
  `${error.message ?? ''} ${error.details ?? ''}`.includes(constraint)

export function personalSaveError(error: DbError): Error {
  // 23514: lo rechazó una restricción de formato (alguien se saltó el formulario).
  if (error.code === '23514') return new Error('Algún dato tiene un formato no permitido. Revíselo e intente de nuevo.')
  if (error.code === '23503') {
    if (violates(error, 'profile_personal_info_eps_id_fkey')) return new Error('Esa EPS ya no existe: elija otra.')
    if (violates(error, 'profile_personal_info_user_id_fkey'))
      return new Error('No se encontró su perfil. Recargue la página o comuníquese con el Administrador de Sistema.')
  }
  return new Error('No se pudieron guardar sus datos. Intente de nuevo.')
}
