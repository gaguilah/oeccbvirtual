import { Button, Card, CardBody, ThemeToggle } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useSignOut } from '../auth'
import { Icon, icons } from '../ui'

type NoAccessProps = {
  // 'failed': no se pudieron cargar los permisos; 'blocked': sin rol o cuenta desactivada.
  reason: 'failed' | 'blocked'
  onRetry?: () => void
}

// Pantalla completa en lugar del dashboard cuando la cuenta no tiene acceso: solo el aviso, el
// tema y cerrar sesión.
export default function NoAccess({ reason, onRetry }: NoAccessProps) {
  useDocumentMeta({ title: 'Sin acceso · Dashboard', noindex: true })
  const { signOut, signingOut } = useSignOut()

  return (
    <div className="flex min-h-svh flex-col bg-surface text-on-surface">
      <div className="flex justify-end p-4">
        <ThemeToggle variant="compact" />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-4 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-container text-primary">
              <Icon paths={icons.lock} className="size-6" />
            </span>
            {reason === 'failed' ? (
              <>
                <h1 className="text-xl font-bold">No se pudieron cargar sus permisos</h1>
                <p className="text-sm text-on-surface-variant">Revise su conexión e intente de nuevo.</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold">Su cuenta no tiene acceso todavía</h1>
                <p className="text-sm text-on-surface-variant">
                  Comuníquese con un administrador para que le asigne un rol.
                </p>
              </>
            )}
            <div className="flex flex-col justify-center gap-2 pt-2 sm:flex-row">
              {reason === 'failed' && onRetry && <Button onClick={onRetry}>Intentar de nuevo</Button>}
              <Button variant="secondary" onClick={signOut} loading={signingOut}>
                Cerrar sesión
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
