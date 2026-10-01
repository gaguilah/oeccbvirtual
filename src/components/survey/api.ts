import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { AnswerValue } from './types'

const GENERIC_ERROR = 'Ocurrió un error al enviar la encuesta. Intente de nuevo.'

export type SurveySubmission = {
  surveyId: string
  answers: { questionId: string; value: AnswerValue }[]
}

// Envía las respuestas a la Edge Function `submit-survey`, que debe verificar el token de
// Turnstile en el servidor y guardar en `survey_responses` / `survey_answers`.
// Devuelve un mensaje de error, o null si todo salió bien.
export async function submitSurvey(submission: SurveySubmission, captchaToken: string): Promise<string | null> {
  try {
    const { error } = await supabase.functions.invoke('submit-survey', {
      body: { ...submission, captchaToken },
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
