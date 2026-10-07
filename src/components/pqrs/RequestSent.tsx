import { cn } from '../../lib/cn'
import { OFFICE_NAME } from '../../lib/contact'
import { Alert, Button } from '../ui'
import CheckIcon from '../ui/CheckIcon'

// Ícono (Heroicons outline) del aviso de datos, en lugar de un emoji, como el resto del sitio.
const INFO_ICON =
  'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'

function Svg({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      className={cn('size-5 shrink-0', className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

type RequestSentProps = {
  email: string
  // Número de radicado que asignó la base de datos (PQRS-<año>-<consecutivo>).
  requestNumber: string
  // false: la PQRS se guardó, pero el acuse por correo no se pudo enviar.
  emailSent: boolean
  onReset: () => void
}

export default function RequestSent({ email, requestNumber, emailSent, onReset }: RequestSentProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-green-600/10 text-green-700 dark:text-green-300">
        <CheckIcon className="size-6" />
      </span>
      <h3 className="text-2xl font-bold">¡Gracias! Su solicitud fue recibida.</h3>
      {requestNumber && (
        <p className="text-on-surface-variant">
          Número de radicado:{' '}
          <strong className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-on-surface">
            {requestNumber}
          </strong>
        </p>
      )}
      <p className="max-w-xl text-on-surface-variant">
        {emailSent ? (
          <>
            Enviamos una copia con el radicado a <strong className="break-all text-on-surface">{email}</strong>. Le
            responderemos a ese correo dentro de los términos de ley (15 días hábiles).
          </>
        ) : (
          <>
            No pudimos enviarle la copia por correo, pero su solicitud quedó registrada: guarde el número de radicado.
            Le responderemos a <strong className="break-all text-on-surface">{email}</strong>.
          </>
        )}
      </p>
      <Alert variant="info" live={false} icon={<Svg d={INFO_ICON} />} className="w-full">
        Los datos recolectados por la {OFFICE_NAME} se usan únicamente para el tratamiento de las PQRS, conforme a la
        Ley 1581 de 2012 de protección de datos personales.
      </Alert>
      <Button variant="secondary" onClick={onReset}>
        Enviar otra solicitud
      </Button>
    </div>
  )
}
