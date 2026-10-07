// Envío de correos con Resend y registro en email_log (docs/plan-correos-resend.md).
// Único lugar que habla con Resend: si se cambia de proveedor, se cambia solo aquí.
//
// Secretos (supabase secrets set …): RESEND_API_KEY y EMAIL_FROM
// ("OECCB Virtual <notificaciones@oeccbvirtual.app>").
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type Email = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type EmailResult = { ok: true; id: string } | { ok: false; error: string }

const TIMEOUT_MS = 10_000

// Nunca lanza: devuelve ok o el error, para que un correo fallido no tumbe la operación que lo
// originó (p. ej. la PQRS se guarda aunque el acuse no salga).
export async function sendEmail(email: Email): Promise<EmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  if (!apiKey || !from) return { ok: false, error: 'Faltan los secretos RESEND_API_KEY o EMAIL_FROM' }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo && { reply_to: email.replyTo }),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, error: `Resend ${response.status}: ${body?.message ?? 'sin detalle'}` }
    }
    return { ok: true, id: String(body?.id ?? '') }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

type LogEntry = {
  kind: string
  email: Email
  result: EmailResult
  reference?: { table: string; id: string }
}

// Anota el envío en email_log (con el cliente de service role). Tampoco lanza.
export async function logEmail(admin: SupabaseClient, { kind, email, result, reference }: LogEntry) {
  const { error } = await admin.from('email_log').insert({
    kind,
    recipient: email.to,
    subject: email.subject,
    status: result.ok ? 'sent' : 'failed',
    provider_id: result.ok ? result.id : null,
    error: result.ok ? null : result.error.slice(0, 1000),
    reference_table: reference?.table ?? null,
    reference_id: reference?.id ?? null,
  })
  if (error) console.error('No se pudo registrar el correo en email_log:', error)
}

// Envía y registra en un solo paso.
export async function sendAndLog(admin: SupabaseClient, entry: Omit<LogEntry, 'result'>): Promise<EmailResult> {
  const result = await sendEmail(entry.email)
  if (!result.ok) console.error(`Correo ${entry.kind} a ${entry.email.to} falló:`, result.error)
  await logEmail(admin, { ...entry, result })
  return result
}
