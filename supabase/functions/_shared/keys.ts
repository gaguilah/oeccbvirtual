// Claves de Supabase para las Edge Functions (docs/plan-seguridad-supabase.md, Fase 2).
//
// Supabase inyecta SUPABASE_SECRET_KEYS y SUPABASE_PUBLISHABLE_KEYS como JSON { nombre: clave }. Se usa
// la clave "default" de cada una. No se vuelve a las antiguas (SUPABASE_SERVICE_ROLE_KEY y
// SUPABASE_ANON_KEY), que Supabase retira a inicios de 2027: si falta una clave nueva, la función falla
// al probarla, no el día del retiro.
const KEY_NAME = 'default'

function readKey(variable: string): string {
  let key: unknown
  try {
    key = JSON.parse(Deno.env.get(variable) ?? '')[KEY_NAME]
  } catch {
    key = undefined
  }
  if (typeof key !== 'string' || !key) throw new Error(`Falta la clave "${KEY_NAME}" en ${variable}.`)
  return key
}

// Clave secreta (sb_secret_…): omite la RLS. Solo para el cliente administrador de cada función.
export const secretKey = () => readKey('SUPABASE_SECRET_KEYS')

// Clave publicable (sb_publishable_…): para el cliente que actúa como el usuario que llama.
export const publishableKey = () => readKey('SUPABASE_PUBLISHABLE_KEYS')
