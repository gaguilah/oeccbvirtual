import { Input } from '../ui'
import type { FieldErrors, RequestDraft } from './schema'

type ContactStepProps = {
  name: string
  email: string
  onChange: (field: keyof Pick<RequestDraft, 'name' | 'email'>, value: string) => void
  errors: FieldErrors
}

// Paso 2: datos de contacto.
export default function ContactStep({ name, email, onChange, errors }: ContactStepProps) {
  return (
    <div className="grid max-w-xl gap-5">
      <Input
        label="Nombre completo"
        name="name"
        value={name}
        onChange={(e) => onChange('name', e.target.value)}
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        value={email}
        onChange={(e) => onChange('email', e.target.value)}
        error={errors.email}
        hint="Allí recibirá la copia con el número de radicado y la respuesta a su solicitud."
        autoComplete="email"
        inputMode="email"
        required
      />
      {/* Aviso de tratamiento de datos (Ley 1581 de 2012). */}
      <p className="text-xs text-on-surface-variant">
        Usaremos su nombre y correo solo para tramitar y responder esta solicitud, conforme a la Ley 1581 de 2012 de
        protección de datos personales.
      </p>
    </div>
  )
}
