// Edge Function: submit-survey
// Recibe las respuestas de una encuesta desde la vista pública, verifica el token de
// Cloudflare Turnstile y las registra con la función SQL `submit_survey_response`
// (una sola transacción; ver supabase/migrations/*_submit_survey_response.sql).
// Las reglas de negocio (encuesta activa, pregunta de la encuesta, tipo/rango, obligatorias)
// viven en esa función SQL; aquí solo se valida la forma del cuerpo y el captcha.
//
// Secrets requeridos (supabase secrets set ...):
//   TURNSTILE_SECRET_KEY  clave secreta de Turnstile (nunca en el frontend)
//   ALLOWED_ORIGINS       opcional, orígenes permitidos separados por coma
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Cuerpo esperado: { surveyId, answers: [{ questionId, value }], captchaToken }
//   yes_no → value boolean · scale → value entero
// Respuestas de error: { error: string } (el frontend muestra el mensaje tal cual).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowOrigin = allowedOrigins.length === 0 ? '*' : allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

const bodySchema = z.object({
  surveyId: z.uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.uuid(),
        value: z.union([z.boolean(), z.number().int()]),
      }),
    )
    .min(1)
    .max(100),
  captchaToken: z.string().min(1).max(2048),
})

// Errores de la función SQL → respuesta para el ciudadano.
const SQL_ERRORS: Record<string, { status: number; message: string }> = {
  survey_not_available: { status: 404, message: 'La encuesta no está disponible.' },
  invalid_answers: { status: 400, message: 'Hay respuestas inválidas. Revise la encuesta e intente de nuevo.' },
  missing_required_answers: { status: 400, message: 'Faltan respuestas obligatorias.' },
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) throw new Error('TURNSTILE_SECRET_KEY no está configurada')

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)

  const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
  if (!res.ok) return false
  const result = await res.json()
  return result.success === true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, 405, { error: 'Método no permitido.' })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json(req, 400, { error: 'Datos inválidos' })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return json(req, 400, { error: 'Datos inválidos' })
  const { surveyId, answers, captchaToken } = parsed.data

  try {
    // 1. Verificación de Turnstile, antes de tocar la base de datos.
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
    if (!(await verifyTurnstile(captchaToken, ip))) {
      return json(req, 400, { error: 'Verificación de seguridad fallida' })
    }

    // 2. Registro atómico con service_role (única identidad con permiso EXECUTE sobre la función).
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })
    const { error } = await supabase.rpc('submit_survey_response', {
      p_survey_id: surveyId,
      p_answers: answers,
    })

    if (error) {
      const known = SQL_ERRORS[error.message]
      if (known) return json(req, known.status, { error: known.message })
      // 23505: pregunta repetida en el mismo envío.
      if (error.code === '23505') return json(req, 400, { error: SQL_ERRORS.invalid_answers.message })
      throw error
    }

    return json(req, 201, { ok: true })
  } catch (error) {
    console.error('submit-survey:', error)
    return json(req, 500, { error: 'No fue posible registrar la encuesta. Intente de nuevo.' })
  }
})
