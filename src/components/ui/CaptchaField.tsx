import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import type { Ref } from 'react'
import { useTheme } from '../../context/theme'

type CaptchaFieldProps = {
  ref?: Ref<TurnstileInstance>
  onToken: (token: string | null) => void
  onError: () => void
}

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

// Widget de Cloudflare Turnstile. El token que entrega solo es válido si lo verifica el servidor
// (Edge Function correspondiente); aquí solo se obtiene.
export default function CaptchaField({ ref, onToken, onError }: CaptchaFieldProps) {
  const { theme } = useTheme()

  if (!siteKey) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        La verificación de seguridad no está configurada (falta VITE_TURNSTILE_SITE_KEY).
      </p>
    )
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      onSuccess={onToken}
      onExpire={() => onToken(null)}
      onError={() => {
        onToken(null)
        onError()
      }}
      options={{
        theme: theme === 'system' ? 'auto' : theme,
        language: 'es',
        size: 'flexible',
      }}
    />
  )
}
