import { useEffect, useRef, useState } from 'react'
import Button from './Button'

type CopyButtonProps = {
  value: string
  label: string
  className?: string
}

type Status = 'idle' | 'copied' | 'error'

const RESET_MS = 2500

// Copia `value` al portapapeles y confirma con "¡Copiado!". Si el navegador no lo permite
// (sin HTTPS o sin permiso), pide copiarlo a mano. El resultado se anuncia a lectores de pantalla.
export default function CopyButton({ value, label, className }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(value)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    timer.current = setTimeout(() => setStatus('idle'), RESET_MS)
  }

  return (
    <div className={className}>
      <Button variant="secondary" size="sm" onClick={copy}>
        <svg
          className="size-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25"
          />
        </svg>
        {status === 'copied' ? '¡Copiado!' : label}
      </Button>
      <p role="status" className={status === 'error' ? 'mt-2 text-sm text-red-700 dark:text-red-400' : 'sr-only'}>
        {status === 'copied' && 'Copiado al portapapeles.'}
        {status === 'error' && 'No se pudo copiar. Seleccione el texto y cópielo manualmente.'}
      </p>
    </div>
  )
}
