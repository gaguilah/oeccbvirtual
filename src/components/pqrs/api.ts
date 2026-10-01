import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { RequestInput } from './schema'

const GENERIC_ERROR = 'Ocurrió un error al enviar su solicitud. Intente de nuevo.'

// Envía la PQRS a la Edge Function `submit-request`, que verifica el token de Turnstile
// en el servidor antes de guardar. Devuelve un mensaje de error, o null si todo salió bien.
export async function submitRequest(data: RequestInput, captchaToken: string): Promise<string | null> {
  try {
    const { error } = await supabase.functions.invoke('submit-request', {
      body: { ...data, captchaToken },
    })
    if (!error) return null

    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      if (body && typeof body.error === 'string') return body.error
    }
    return GENERIC_ERROR
  } catch {
    return GENERIC_ERROR
  }
}
