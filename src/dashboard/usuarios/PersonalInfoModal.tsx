import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, Modal, Spinner } from '../../components/ui'
import { formatPhone, formatUpdatedAt, relationshipLabel } from '../profile'
import { fetchUserPersonalInfo, type UserPersonalInfo } from './api'
import { displayName } from './data'
import type { UserRow } from './types'

type Props = {
  user: UserRow
  onClose: () => void
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-on-surface-variant">{label}</dt>
      <dd className="break-words">{children ?? <span className="text-on-surface-variant">Sin registrar</span>}</dd>
    </div>
  )
}

function Phone({ value }: { value: string | null }) {
  if (!value) return null
  return (
    <a href={`tel:+57${value}`} className="font-medium text-primary underline-offset-2 hover:underline">
      {formatPhone(value)}
    </a>
  )
}

function Section({ title, updatedAt, children }: { title: string; updatedAt?: string | null; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg bg-surface-container-low p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">{children}</dl>
      {updatedAt && (
        <p className="text-xs text-on-surface-variant">Última actualización: {formatUpdatedAt(updatedAt)}</p>
      )}
    </section>
  )
}

// Usuarios → "Ver información personal" (permiso usuarios.datos_personales): solo lectura. Lee al
// abrir, sin guardar copia; los datos los edita únicamente el propio usuario en Mi perfil.
export default function PersonalInfoModal({ user, onClose }: Props) {
  const [info, setInfo] = useState<UserPersonalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchUserPersonalInfo(user.id)
      .then((data) => {
        if (active) setInfo(data)
      })
      .catch((err: Error) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.id])

  return (
    <Modal
      open
      onClose={onClose}
      title={`Información personal de ${displayName(user)}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8 text-primary">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <div className="space-y-4">
          <Section title="Información personal" updatedAt={info?.personal_updated_at}>
            <Item label="Dirección de residencia">{info?.residence_address}</Item>
            <Item label="Celular">{info?.mobile_phone && <Phone value={info.mobile_phone} />}</Item>
            <Item label="Correo personal">
              {info?.personal_email && (
                <a
                  href={`mailto:${info.personal_email}`}
                  className="font-medium break-all text-primary underline-offset-2 hover:underline"
                >
                  {info.personal_email}
                </a>
              )}
            </Item>
            <Item label="EPS">{info?.eps_name}</Item>
          </Section>
          <Section title="Contacto de emergencia" updatedAt={info?.emergency_updated_at}>
            <Item label="Nombre">{info?.emergency_name}</Item>
            <Item label="Parentesco">{relationshipLabel(info?.emergency_relationship ?? null)}</Item>
            <Item label="Celular">{info?.emergency_phone && <Phone value={info.emergency_phone} />}</Item>
          </Section>
          <p className="text-xs text-on-surface-variant">
            {!info?.personal_updated_at && !info?.emergency_updated_at && 'Todavía no ha registrado información. '}
            Solo {displayName(user)} puede cambiar estos datos, desde Mi perfil.
          </p>
        </div>
      )}
    </Modal>
  )
}
