import { useId, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Button, Spinner, Tabs, tabPanelProps } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { completePasswordChange, useAccess } from '../access'
import {
  EmergencyContactForm,
  PasswordForm,
  PersonalInfoForm,
  ProfileNameForm,
  usePersonalInfo,
  useProfile,
} from '../profile'

const TAB_PARAM = 'pestana'

const TABS = [
  { id: 'cuenta', label: 'Cuenta' },
  { id: 'informacion-personal', label: 'Información personal' },
  { id: 'contacto-emergencia', label: 'Contacto de emergencia' },
  { id: 'contrasena', label: 'Contraseña' },
] as const

type TabId = (typeof TABS)[number]['id']

const isTab = (value: string | null): value is TabId => TABS.some((tab) => tab.id === value)

function Loading() {
  return (
    <div className="flex justify-center py-12 text-primary">
      <Spinner />
    </div>
  )
}

// Configuración de perfil (/dashboard/perfil), desde el botón de perfil de la Topbar, en pestañas
// (docs/plan-perfil-informacion-personal.md): Cuenta (nombre, cargo), Información personal,
// Contacto de emergencia y Contraseña. La pestaña va en la URL (?pestana=contacto-emergencia). Los
// paneles quedan montados y solo se ocultan: cambiar de pestaña no pierde lo escrito sin guardar.
// Con contraseña temporal, primero el cargo y luego la contraseña (complete_password_change()
// rechaza sin cargo); las pestañas nuevas no se exigen. Su información se pide la primera vez que
// se abre una de ellas (no en cada visita, ni en el paso obligatorio de la contraseña) y se conserva.
export default function ProfilePage() {
  useDocumentMeta({ title: 'Mi perfil · Dashboard', noindex: true })
  const { profile, loading, failed } = useProfile()
  const { mustChangePassword, reload } = useAccess()
  const [params, setParams] = useSearchParams()
  const [completeError, setCompleteError] = useState<string | null>(null)
  const tabsId = useId()
  const missingPosition = Boolean(profile) && !profile?.position_id

  const requested = params.get(TAB_PARAM)
  const tab: TabId = isTab(requested)
    ? requested
    : mustChangePassword && !loading && !missingPosition
      ? 'contrasena'
      : 'cuenta'

  const personalTab = tab === 'informacion-personal' || tab === 'contacto-emergencia'
  const [personalOpened, setPersonalOpened] = useState(personalTab)
  if (personalTab && !personalOpened) setPersonalOpened(true)
  const personal = usePersonalInfo(personalOpened)

  function open(id: TabId) {
    if (id === tab) return
    setParams(id === 'cuenta' ? {} : { [TAB_PARAM]: id })
  }

  // Tras cambiar la contraseña temporal: quita la marca y recarga el acceso (se habilita el menú).
  async function handlePasswordChanged() {
    if (!mustChangePassword) return
    try {
      setCompleteError(null)
      await completePasswordChange()
      await reload()
    } catch (error) {
      console.error('Error marcando la contraseña como cambiada:', error)
      setCompleteError(
        error instanceof Object && 'message' in error && String(error.message).includes('position_required')
          ? 'Su contraseña se cambió, pero falta su cargo: elíjalo en la pestaña Cuenta y guarde sus datos.'
          : 'Su contraseña se cambió, pero no se pudo habilitar el menú. Recargue la página.',
      )
    }
  }

  const panel = (id: TabId) => ({ ...tabPanelProps(tabsId, id), hidden: id !== tab })

  return (
    <div className="max-w-2xl space-y-6">
      {mustChangePassword && (
        <Alert variant="warning" live={false} title="Cambie su contraseña temporal">
          Para continuar, elija su cargo en la pestaña Cuenta y guarde sus datos; luego cambie la contraseña que le
          entregaron en la pestaña Contraseña. En "Contraseña actual" escriba la temporal.
        </Alert>
      )}
      {completeError && (
        <Alert variant="error" title="Falta un paso">
          {completeError}
        </Alert>
      )}

      <Tabs items={[...TABS]} value={tab} onChange={open} label="Secciones del perfil" idPrefix={tabsId} />

      <div {...panel('cuenta')}>
        {loading ? (
          <Loading />
        ) : failed ? (
          <Alert variant="error" live={false} title="No se pudo cargar su perfil">
            Recargue la página para intentar de nuevo.
          </Alert>
        ) : profile ? (
          <ProfileNameForm
            initialName={profile.full_name ?? ''}
            initialPositionId={profile.position_id}
            onSaved={() => {
              if (mustChangePassword) open('contrasena')
            }}
          />
        ) : (
          <Alert variant="warning" live={false} title="Perfil sin crear">
            Su cuenta todavía no tiene perfil, así que no puede cambiar su nombre. Pida a un administrador que lo cree.
          </Alert>
        )}
      </div>

      {(['informacion-personal', 'contacto-emergencia'] as const).map((id) => (
        <div key={id} {...panel(id)}>
          {loading || personal.loading ? (
            <Loading />
          ) : !profile ? (
            <Alert variant="warning" live={false} title="Perfil sin crear">
              Su cuenta todavía no tiene perfil, así que no puede registrar esta información. Pida a un administrador
              que lo cree.
            </Alert>
          ) : personal.error || !personal.userId ? (
            <Alert variant="error" live={false} title={personal.error ?? 'No se pudo cargar su información.'}>
              <Button variant="tertiary" size="sm" onClick={personal.reload} className="-ml-3">
                Intentar de nuevo
              </Button>
            </Alert>
          ) : id === 'informacion-personal' ? (
            <PersonalInfoForm
              userId={personal.userId}
              info={personal.info}
              eps={personal.eps}
              onSaved={personal.setInfo}
            />
          ) : (
            <EmergencyContactForm userId={personal.userId} info={personal.info} onSaved={personal.setInfo} />
          )}
        </div>
      ))}

      <div {...panel('contrasena')}>
        <PasswordForm
          onChanged={handlePasswordChanged}
          blockedReason={
            mustChangePassword && missingPosition
              ? 'Primero elija su cargo en la pestaña Cuenta y guarde sus datos.'
              : undefined
          }
        />
      </div>
    </div>
  )
}
