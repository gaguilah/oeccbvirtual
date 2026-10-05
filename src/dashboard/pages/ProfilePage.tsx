import { Alert, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { PasswordForm, ProfileNameForm, useProfile } from '../profile'

// Configuración de perfil (/dashboard/perfil), desde el botón de perfil de la Topbar: nombre y
// contraseña del usuario en sesión.
export default function ProfilePage() {
  useDocumentMeta({ title: 'Mi perfil · Dashboard', noindex: true })
  const { profile, loading, failed } = useProfile()

  return (
    <div className="max-w-2xl space-y-6">
      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : failed ? (
        <Alert variant="error" live={false} title="No se pudo cargar su perfil">
          Recargue la página para intentar de nuevo.
        </Alert>
      ) : profile ? (
        <ProfileNameForm initialName={profile.full_name ?? ''} />
      ) : (
        <Alert variant="warning" live={false} title="Perfil sin crear">
          Su cuenta todavía no tiene perfil, así que no puede cambiar su nombre. Pida a un administrador que lo cree.
        </Alert>
      )}
      <PasswordForm />
    </div>
  )
}
