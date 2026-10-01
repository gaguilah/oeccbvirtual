import { Button } from '../ui'
import CheckIcon from '../ui/CheckIcon'

type RequestSentProps = {
  email: string
  onReset: () => void
}

export default function RequestSent({ email, onReset }: RequestSentProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-green-600/10 text-green-700 dark:text-green-300">
        <CheckIcon className="size-6" />
      </span>
      <h3 className="text-2xl font-bold">¡Gracias! Su solicitud fue recibida.</h3>
      <p className="max-w-xl text-on-surface-variant">
        Enviaremos la respuesta al correo <strong className="break-all text-on-surface">{email}</strong>.
      </p>
      <Button variant="secondary" onClick={onReset}>
        Enviar otra solicitud
      </Button>
    </div>
  )
}
