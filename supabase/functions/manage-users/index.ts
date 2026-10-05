// Gestión de usuarios del dashboard (docs/plan-usuarios.md, fase 2).
//
// A diferencia de submit-request y submit-survey, esta función SÍ verifica el JWT: se despliega con
//   supabase functions deploy manage-users
// (sin --no-verify-jwt). Flujo de cada llamada:
//   1. identifica a quien llama con su JWT;
//   2. exige usuarios.gestionar con public.has_permission (la misma regla de las políticas);
//   3. valida los datos;
//   4. opera con la service role key (auth.admin.*), que solo existe aquí.
// Las reglas de la base de datos (formato del nombre, juzgado según el alcance del rol, último
// superadmin) también se aplican: sus errores se traducen a mensajes en español.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Bloqueo "indefinido" al desactivar (100 años). 'none' lo quita.
const BAN_FOREVER = '876000h'

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Errores de la base de datos (triggers y restricciones) → mensajes para el dashboard.
function dbError(error: { message?: string; code?: string } | null): HttpError {
  const message = error?.message ?? ''
  if (message.includes('last_superadmin')) return new HttpError(409, 'Debe quedar al menos un superadmin activo.')
  if (message.includes('court_required')) return new HttpError(400, 'Este rol requiere un juzgado.')
  if (message.includes('court_not_allowed'))
    return new HttpError(400, 'Este rol aplica a los dos juzgados: no lleva juzgado.')
  if (error?.code === '23514') return new HttpError(400, 'El nombre tiene caracteres no permitidos.')
  if (error?.code === '23503') return new HttpError(400, 'El rol elegido no existe.')
  console.error('Error de base de datos:', error)
  return new HttpError(500, 'No se pudo guardar. Intente de nuevo.')
}

// Contraseña temporal de 14 caracteres con mayúsculas, minúsculas, números y un símbolo, sin
// caracteres que se confunden al dictarla (0/O, 1/l/I).
function temporaryPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%*?']
  const all = sets.slice(0, 3).join('')
  const pick = (alphabet: string) => {
    // Muestreo con rechazo: sin sesgo hacia los primeros caracteres.
    const limit = 256 - (256 % alphabet.length)
    const byte = new Uint8Array(1)
    do {
      crypto.getRandomValues(byte)
    } while (byte[0] >= limit)
    return alphabet[byte[0] % alphabet.length]
  }
  const chars = [...sets.map(pick), ...Array.from({ length: 10 }, () => pick(all))]
  // Mezcla (Fisher-Yates) para que los obligatorios no queden al principio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `Falta ${field}.`)
  const clean = value.trim().replace(/\s+/g, ' ')
  if (clean.length > max) throw new HttpError(400, `${field} es demasiado largo.`)
  return clean
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new HttpError(400, `${field} no es válido.`)
  return value
}

function court(value: unknown): 1 | 2 | null {
  if (value === null || value === undefined || value === '') return null
  if (value === 1 || value === 2) return value
  throw new HttpError(400, 'El juzgado no es válido.')
}

async function roleById(admin: SupabaseClient, roleId: string) {
  const { data, error } = await admin.from('roles').select('id, code, scope').eq('id', roleId).maybeSingle()
  if (error) throw dbError(error)
  if (!data) throw new HttpError(400, 'El rol elegido no existe.')
  return data as { id: string; code: string; scope: 'all' | 'court' }
}

async function currentRoleCode(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin.from('profiles').select('roles(code)').eq('id', userId).maybeSingle()
  const roles = (data as { roles: { code: string } | null } | null)?.roles
  return roles?.code ?? null
}

type Caller = { id: string; isSuperadmin: boolean }

// Solo un superadmin asigna el rol superadmin o modifica a otro superadmin.
async function assertCanTouchSuperadmin(
  admin: SupabaseClient,
  caller: Caller,
  targetId: string | null,
  roleCode?: string,
) {
  if (caller.isSuperadmin) return
  const targetRole = targetId ? await currentRoleCode(admin, targetId) : null
  if (roleCode === 'superadmin' || targetRole === 'superadmin') {
    throw new HttpError(403, 'Solo un superadmin puede asignar o modificar a un superadmin.')
  }
}

function notSelf(caller: Caller, userId: string) {
  if (caller.id === userId) throw new HttpError(400, 'Para cambiar sus propios datos use Mi perfil.')
}

async function createUser(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const fullName = text(body.fullName, 'el nombre', 120)
  const email = text(body.email, 'el correo', 254).toLowerCase()
  if (!EMAIL.test(email)) throw new HttpError(400, 'El correo no es válido.')
  const role = await roleById(admin, uuid(body.roleId, 'El rol'))
  await assertCanTouchSuperadmin(admin, caller, null, role.code)
  const userCourt = role.scope === 'court' ? court(body.court) : null
  if (role.scope === 'court' && !userCourt) throw new HttpError(400, 'Este rol requiere un juzgado.')

  const password = temporaryPassword()
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) {
    if (error?.code === 'email_exists' || error?.status === 422) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo.')
    }
    console.error('Error creando la cuenta:', error)
    throw new HttpError(500, 'No se pudo crear la cuenta. Intente de nuevo.')
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: fullName,
    role_id: role.id,
    court: userCourt,
    active: true,
    must_change_password: true,
  })
  if (profileError) {
    // Sin perfil la cuenta no sirve: se deshace para poder intentarlo de nuevo con el mismo correo.
    await admin.auth.admin.deleteUser(data.user.id)
    throw dbError(profileError)
  }

  return { userId: data.user.id, temporaryPassword: password }
}

async function updateUser(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const userId = uuid(body.userId, 'El usuario')
  notSelf(caller, userId)
  const fullName = text(body.fullName, 'el nombre', 120)
  const role = await roleById(admin, uuid(body.roleId, 'El rol'))
  await assertCanTouchSuperadmin(admin, caller, userId, role.code)
  const userCourt = role.scope === 'court' ? court(body.court) : null
  if (role.scope === 'court' && !userCourt) throw new HttpError(400, 'Este rol requiere un juzgado.')

  // upsert: las cuentas de Auth sin perfil reciben aquí su primera fila.
  const { error } = await admin
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role_id: role.id, court: userCourt })
  if (error) throw dbError(error)
  return { userId }
}

async function setActive(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const userId = uuid(body.userId, 'El usuario')
  notSelf(caller, userId)
  if (typeof body.active !== 'boolean') throw new HttpError(400, 'Falta el estado.')
  const active = body.active
  await assertCanTouchSuperadmin(admin, caller, userId)

  // Primero el perfil: el trigger del último superadmin decide antes de tocar Auth.
  const { data: updated, error } = await admin.from('profiles').update({ active }).eq('id', userId).select('id')
  if (error) throw dbError(error)
  if (!updated?.length) throw new HttpError(400, 'Asigne un rol a este usuario antes de cambiar su estado.')

  // active = false no impide iniciar sesión: el bloqueo en Auth sí.
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? 'none' : BAN_FOREVER,
  })
  if (banError) {
    console.error('Error cambiando el bloqueo:', banError)
    await admin.from('profiles').update({ active: !active }).eq('id', userId)
    throw new HttpError(500, 'No se pudo cambiar el estado. Intente de nuevo.')
  }
  return { userId, active }
}

async function resetPassword(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const userId = uuid(body.userId, 'El usuario')
  notSelf(caller, userId)
  await assertCanTouchSuperadmin(admin, caller, userId)

  const { data: profile } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (!profile) throw new HttpError(400, 'Asigne un rol a este usuario antes de restablecer su contraseña.')

  const password = temporaryPassword()
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) {
    console.error('Error restableciendo la contraseña:', error)
    throw new HttpError(500, 'No se pudo restablecer la contraseña. Intente de nuevo.')
  }
  const { error: flagError } = await admin.from('profiles').update({ must_change_password: true }).eq('id', userId)
  if (flagError) throw dbError(flagError)
  return { userId, temporaryPassword: password }
}

const actions = { create: createUser, update: updateUser, 'set-active': setActive, 'reset-password': resetPassword }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) throw new HttpError(401, 'Inicie sesión de nuevo.')

    const url = Deno.env.get('SUPABASE_URL')!
    // Cliente con el JWT de quien llama: has_permission se evalúa como ese usuario.
    // Llave pública: la anon antigua si el proyecto la tiene; si no, la publishable que envía el
    // navegador en la cabecera apikey.
    const publicKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('apikey')
    if (!publicKey) throw new HttpError(401, 'Inicie sesión de nuevo.')
    const asCaller = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await asCaller.auth.getUser()
    if (userError || !userData.user) throw new HttpError(401, 'Su sesión expiró. Inicie sesión de nuevo.')

    const { data: allowed, error: permissionError } = await asCaller.rpc('has_permission', {
      p_permission: 'usuarios.gestionar',
    })
    if (permissionError) throw dbError(permissionError)
    if (!allowed) throw new HttpError(403, 'No tiene permiso para gestionar usuarios.')

    const caller: Caller = {
      id: userData.user.id,
      isSuperadmin: (await currentRoleCode(admin, userData.user.id)) === 'superadmin',
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const action = body && typeof body.action === 'string' ? actions[body.action as keyof typeof actions] : undefined
    if (!body || !action) throw new HttpError(400, 'Acción no válida.')

    return json(await action(admin, caller, body))
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status)
    console.error('Error inesperado:', err)
    return json({ error: 'Error del servidor' }, 500)
  }
})
