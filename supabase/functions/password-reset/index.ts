// Recuperar la contraseña del dashboard desde /login (docs/plan-recuperar-contrasena.md).
//
// Se despliega SIN verificación de JWT, como submit-request:
//   supabase functions deploy password-reset --no-verify-jwt
// porque 'request' la llama alguien sin sesión. Acciones:
//   request         { email, captchaToken }: verifica Turnstile y, si la cuenta está activa y con
//                   rol y no pasó el límite, genera el enlace de recuperación
//                   (auth.admin.generateLink) y lo envía con Resend. La respuesta es SIEMPRE la
//                   misma: no revela qué correos tienen cuenta.
//   notify-changed  (con la sesión del usuario): aviso "Su contraseña se cambió" a su correo. El
//                   usuario se identifica aquí con su token, ya que la plataforma no lo verifica.
// Límite por correo: 1 cada 5 minutos y 5 al día, contados en email_log.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/email.ts'
import { passwordChangedEmail, passwordResetEmail } from '../_shared/emails/account.ts'
import { SITE_URL } from '../_shared/office.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Página del sitio que recibe el enlace (src/pages/RestablecerContrasena.tsx).
const RESET_PATH = '/restablecer-contrasena'
// El enlace apunta al origen desde el que se pidió si es uno de estos (el sitio o el servidor de
// desarrollo); si no, al sitio.
const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost:5173']
const MIN_INTERVAL_MS = 5 * 60_000
const DAILY_LIMIT = 5
const DAY_MS = 24 * 60 * 60_000

const KIND_RESET = 'password_reset'
const KIND_CHANGED = 'password_changed'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function captchaOk(token: unknown): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: Deno.env.get('TURNSTILE_SECRET_KEY'), response: token }),
  })
  const result = await response.json().catch(() => null)
  return Boolean(result?.success)
}

// ¿Se puede enviar otro correo de este tipo a este destinatario? (1 cada 5 minutos, 5 al día).
async function withinLimit(admin: SupabaseClient, kind: string, recipient: string): Promise<boolean> {
  const { data, error } = await admin
    .from('email_log')
    .select('created_at')
    .eq('kind', kind)
    .eq('recipient', recipient)
    .gte('created_at', new Date(Date.now() - DAY_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(DAILY_LIMIT)
  if (error) {
    console.error('No se pudo revisar el límite en email_log:', error)
    return false
  }
  if (data.length >= DAILY_LIMIT) return false
  return !data[0] || Date.now() - new Date(data[0].created_at).getTime() >= MIN_INTERVAL_MS
}

async function handleRequest(admin: SupabaseClient, body: Record<string, unknown>, origin: string | null) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL.test(email) || email.length > 254) return json({ error: 'Escriba un correo válido.' }, 400)
  if (!(await captchaOk(body.captchaToken))) return json({ error: 'Verificación de seguridad fallida.' }, 400)

  const generic = json({ ok: true })
  if (!(await withinLimit(admin, KIND_RESET, email))) return generic

  // Sin cuenta, generateLink falla: la respuesta es la misma.
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })
  if (error || !link?.user || !link.properties?.hashed_token) return generic

  // Solo cuentas activas y con rol (las desactivadas tampoco pueden iniciar sesión).
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, active, role_id')
    .eq('id', link.user.id)
    .maybeSingle()
  if (!profile?.active || !profile.role_id) return generic

  const base = origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL
  const url = `${base}${RESET_PATH}?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery`
  await sendAndLog(admin, {
    kind: KIND_RESET,
    email: passwordResetEmail({ to: email, name: profile.full_name, url }),
    reference: { table: 'profiles', id: link.user.id },
  })
  return generic
}

async function handleNotifyChanged(admin: SupabaseClient, req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data, error } = token ? await admin.auth.getUser(token) : { data: null, error: true }
  const user = data?.user
  if (error || !user?.email) return json({ error: 'Inicie sesión de nuevo.' }, 401)

  const email = user.email.toLowerCase()
  if (!(await withinLimit(admin, KIND_CHANGED, email))) return json({ ok: true })

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const result = await sendAndLog(admin, {
    kind: KIND_CHANGED,
    email: passwordChangedEmail({ to: email, name: profile?.full_name ?? null, changedAt: new Date().toISOString() }),
    reference: { table: 'profiles', id: user.id },
  })
  return json({ ok: true, emailSent: result.ok })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    if (body?.action === 'request') return await handleRequest(admin, body, req.headers.get('Origin'))
    if (body?.action === 'notify-changed') return await handleNotifyChanged(admin, req)
    return json({ error: 'Acción no válida.' }, 400)
  } catch (err) {
    console.error('Error inesperado:', err)
    return json({ error: 'Error del servidor.' }, 500)
  }
})
