import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/email.ts'
import { officeNewRequestEmail, requestReceivedEmail } from '../_shared/emails/pqrs.ts'

const ALLOWED_TYPES = ['peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, name, email, summary, captchaToken, acceptedTerms } = await req.json()

    // 1. Validar que vengan los campos esperados
    if (
      typeof type !== 'string' ||
      !ALLOWED_TYPES.includes(type) ||
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof summary !== 'string' ||
      summary.trim().length < 10 ||
      summary.trim().length > 2000 ||
      typeof captchaToken !== 'string'
    ) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Autorización de tratamiento de datos (Ley 1581 de 2012): sin ella no se recibe la PQRS.
    if (acceptedTerms !== true) {
      return new Response(
        JSON.stringify({ error: 'Debe aceptar los términos y condiciones de tratamiento de datos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Verificar el CAPTCHA con Cloudflare Turnstile
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')!
    const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: turnstileSecret, response: captchaToken }),
    })
    const captchaResult = await captchaResponse.json()

    if (!captchaResult.success) {
      return new Response(JSON.stringify({ error: 'Verificación de seguridad fallida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Insertar usando la service_role key (solo existe aquí, en el servidor). La base de datos
    //    asigna el número de radicado (PQRS-<año>-<consecutivo>).
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: saved, error } = await supabaseAdmin
      .from('customer_requests')
      .insert({
        type,
        name: name.trim(),
        email: email.trim(),
        summary: summary.trim(),
        // Prueba de la autorización: cuándo aceptó los términos.
        terms_accepted_at: new Date().toISOString(),
      })
      .select('id, request_number, created_at')
      .single()

    if (error || !saved) {
      console.error('Error insertando:', error)
      return new Response(JSON.stringify({ error: 'No se pudo guardar la solicitud' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Correos: acuse para el ciudadano y, si está activado, aviso para la oficina
    //    (docs/plan-correos-resend.md). Nunca fallan la solicitud: si Resend falla, queda anotado
    //    en email_log. El aviso a la oficina se activa con el secreto PQRS_OFFICE_NOTICE=on (está
    //    apagado mientras el buzón institucional no reciba los correos de oeccbvirtual.app).
    const emailData = {
      requestNumber: saved.request_number,
      type,
      name: name.trim(),
      email: email.trim(),
      summary: summary.trim(),
      createdAt: saved.created_at,
    }
    const reference = { table: 'customer_requests', id: saved.id }
    const officeNotice = Deno.env.get('PQRS_OFFICE_NOTICE') === 'on'
    const [acknowledgment] = await Promise.all([
      sendAndLog(supabaseAdmin, { kind: 'pqrs_acuse', email: requestReceivedEmail(emailData), reference }),
      officeNotice
        ? sendAndLog(supabaseAdmin, {
            kind: 'pqrs_aviso_oficina',
            email: officeNewRequestEmail(emailData),
            reference,
          })
        : null,
    ])

    return new Response(
      JSON.stringify({ success: true, requestNumber: saved.request_number, emailSent: acknowledgment.ok }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Error inesperado:', err)
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
