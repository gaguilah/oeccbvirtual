import { useState } from 'react'
import { Alert, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { completePasswordChange, useAccess } from '../access'
import { PasswordForm, ProfileNameForm, useProfile } from '../profile'

// Configuración de perfil (/dashboard/perfil), desde el botón de perfil de la Topbar: nombre, cargo
// y contraseña del usuario en sesión. Con contraseña temporal, primero el cargo y luego la contraseña
// (complete_password_change() rechaza sin cargo).
export default function ProfilePage() {
  useDocumentMeta({ title: 'Mi perfil · Dashboard', noindex: true })
  const { profile, loading, failed } = useProfile()
  const { mustChangePassword, reload } = useAccess()
  const [completeError, setCompleteError] = useState<string | null>(null)
  const missingPosition = Boolean(profile) && !profile?.position_id

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
          ? 'Su contraseña se cambió, pero falta su cargo: elíjalo arriba y guarde sus datos.'
          : 'Su contraseña se cambió, pero no se pudo habilitar el menú. Recargue la página.',
      )
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {mustChangePassword && (
        <Alert variant="warning" live={false} title="Cambie su contraseña temporal">
          Para continuar, elija su cargo y guarde sus datos; luego cambie la contraseña que le entregaron. En
          "Contraseña actual" escriba la temporal.
        </Alert>
      )}
      {completeError && (
        <Alert variant="error" title="Falta un paso">
          {completeError}
        </Alert>
      )}
      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : failed ? (
        <Alert variant="error" live={false} title="No se pudo cargar su perfil">
          Recargue la página para intentar de nuevo.
        </Alert>
      ) : profile ? (
        <ProfileNameForm initialName={profile.full_name ?? ''} initialPositionId={profile.position_id} />
      ) : (
        <Alert variant="warning" live={false} title="Perfil sin crear">
          Su cuenta todavía no tiene perfil, así que no puede cambiar su nombre. Pida a un administrador que lo cree.
        </Alert>
      )}
      <PasswordForm
        onChanged={handlePasswordChanged}
        blockedReason={mustChangePassword && missingPosition ? 'Primero elija su cargo y guarde sus datos.' : undefined}
      />
    </div>
  )
}
