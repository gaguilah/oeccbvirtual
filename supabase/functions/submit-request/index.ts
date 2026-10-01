import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { type, name, email, summary, captchaToken } = await req.json()

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

    // 2. Verificar el CAPTCHA con Cloudflare Turnstile
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')!
    const captchaResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: turnstileSecret, response: captchaToken }),
      }
    )
    const captchaResult = await captchaResponse.json()

    if (!captchaResult.success) {
      return new Response(JSON.stringify({ error: 'Verificación de seguridad fallida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Insertar usando la service_role key (solo existe aquí, en el servidor)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabaseAdmin.from('customer_requests').insert({
      type,
      name: name.trim(),
      email: email.trim(),
      summary: summary.trim(),
    })

    if (error) {
      console.error('Error insertando:', error)
      return new Response(JSON.stringify({ error: 'No se pudo guardar la solicitud' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error inesperado:', err)
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})