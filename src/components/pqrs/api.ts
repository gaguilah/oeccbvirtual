import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { RequestInput } from './schema'

const GENERIC_ERROR = 'Ocurrió un error al enviar su solicitud. Intente de nuevo.'

export type SubmitResult = { ok: true; requestNumber: string; emailSent: boolean } | { ok: false; error: string }

// Envía la PQRS a la Edge Function `submit-request`, que verifica el token de Turnstile en el
// servidor, la guarda (la base asigna el número de radicado) y envía el acuse por correo.
export async function submitRequest(data: RequestInput, captchaToken: string): Promise<SubmitResult> {
  try {
    const { data: body, error } = await supabase.functions.invoke('submit-request', {
      body: { ...data, captchaToken },
    })
    if (!error) {
      return { ok: true, requestNumber: String(body?.requestNumber ?? ''), emailSent: body?.emailSent !== false }
    }

    if (error instanceof FunctionsHttpError) {
      const errorBody = await error.context.json().catch(() => null)
      if (errorBody && typeof errorBody.error === 'string') return { ok: false, error: errorBody.error }
    }
    return { ok: false, error: GENERIC_ERROR }
  } catch {
    return { ok: false, error: GENERIC_ERROR }
  }
}
