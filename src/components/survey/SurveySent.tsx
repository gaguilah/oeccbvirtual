import { CheckIcon } from '../ui'

export default function SurveySent() {
  return (
    <div role="status" className="flex flex-col items-start gap-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-green-600/10 text-green-700 dark:text-green-300">
        <CheckIcon className="size-6" />
      </span>
      <h3 className="text-2xl font-bold">¡Gracias por responder!</h3>
      <p className="max-w-xl text-on-surface-variant">
        Sus respuestas fueron registradas. Su opinión nos ayuda a mejorar nuestros servicios.
      </p>
    </div>
  )
}
