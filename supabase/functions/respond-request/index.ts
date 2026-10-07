// Respuesta a una PQRS desde el dashboard (docs/plan-pqrs-dashboard.md).
//
// Con verificación de JWT (como manage-users):
//   supabase functions deploy respond-request
// Acciones:
//   respond  guarda la respuesta (una sola vez), marca la PQRS como respondida y envía el correo.
//   resend   vuelve a enviar la respuesta ya guardada (si el correo falló o no le llegó).
// Exige pqrs.responder con has_permission evaluado con el JWT de quien llama. Si el correo falla,
// la respuesta queda guardada y se informa (emailSent: false) para ofrecer "Reenviar".
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/email.ts'
import { requestResponseEmail } from '../_shared/emails/pqrs.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RESPONSE_MIN = 10
const RESPONSE_MAX = 5000
const COLUMNS = 'id, request_number, type, name, email, summary, created_at, response, responded_at, status'

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

type Row = {
  id: string
  request_number: string
  type: string
  name: string
  email: string
  summary: string
  created_at: string
  response: string | null
  responded_at: string | null
  status: string
}

async function sendResponse(admin: SupabaseClient, row: Row, kind: string) {
  const result = await sendAndLog(admin, {
    kind,
    email: requestResponseEmail({
      requestNumber: row.request_number,
      type: row.type,
      name: row.name,
      email: row.email,
      summary: row.summary,
      createdAt: row.created_at,
      response: row.response ?? '',
      respondedAt: row.responded_at ?? new Date().toISOString(),
    }),
    reference: { table: 'customer_requests', id: row.id },
  })
  return result.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) throw new HttpError(401, 'Inicie sesión de nuevo.')

    const url = Deno.env.get('SUPABASE_URL')!
    const publicKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('apikey')
    if (!publicKey) throw new HttpError(401, 'Inicie sesión de nuevo.')
    // Cliente con el JWT de quien llama: has_permission se evalúa como ese usuario.
    const asCaller = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

    const { data: userData, error: userError } = await asCaller.auth.getUser()
    if (userError || !userData.user) throw new HttpError(401, 'Su sesión expiró. Inicie sesión de nuevo.')

    const { data: allowed, error: permissionError } = await asCaller.rpc('has_permission', {
      p_permission: 'pqrs.responder',
    })
    if (permissionError) throw new HttpError(500, 'No se pudo verificar el permiso.')
    if (!allowed) throw new HttpError(403, 'No tiene permiso para responder PQRS.')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const id = body?.id
    if (typeof id !== 'string' || !UUID.test(id)) throw new HttpError(400, 'PQRS no válida.')

    if (body?.action === 'respond') {
      const response = typeof body.response === 'string' ? body.response.trim() : ''
      if (response.length < RESPONSE_MIN)
        throw new HttpError(400, `La respuesta debe tener al menos ${RESPONSE_MIN} caracteres.`)
      if (response.length > RESPONSE_MAX)
        throw new HttpError(400, `La respuesta no puede pasar de ${RESPONSE_MAX} caracteres.`)

      const now = new Date().toISOString()
      // Una sola vez: solo se guarda si sigue pendiente y sin respuesta (dos clics a la vez no
      // envían dos respuestas).
      const { data: row, error } = await admin
        .from('customer_requests')
        .update({
          response,
          status: 'respondida',
          responded_at: now,
          responded_by: userData.user.id,
          updated_at: now,
          updated_by: userData.user.id,
        })
        .eq('id', id)
        .in('status', ['recibida', 'en_tramite'])
        .is('response', null)
        .select(COLUMNS)
        .maybeSingle()
      if (error) {
        console.error('Error guardando la respuesta:', error)
        throw new HttpError(500, 'No se pudo guardar la respuesta. Intente de nuevo.')
      }
      if (!row) throw new HttpError(409, 'Esta PQRS ya fue respondida o está cerrada.')

      const emailSent = await sendResponse(admin, row as Row, 'pqrs_respuesta')
      return json({ ok: true, emailSent })
    }

    if (body?.action === 'resend') {
      const { data: row, error } = await admin.from('customer_requests').select(COLUMNS).eq('id', id).maybeSingle()
      if (error) throw new HttpError(500, 'No se pudo leer la PQRS.')
      if (!row || row.status !== 'respondida' || !row.response) {
        throw new HttpError(409, 'Esta PQRS no tiene una respuesta para reenviar.')
      }
      const emailSent = await sendResponse(admin, row as Row, 'pqrs_respuesta_reenvio')
      if (!emailSent) throw new HttpError(502, 'No se pudo reenviar el correo. Intente más tarde.')
      return json({ ok: true, emailSent })
    }

    throw new HttpError(400, 'Acción no válida.')
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status)
    console.error('Error inesperado:', err)
    return json({ error: 'Error del servidor' }, 500)
  }
})
