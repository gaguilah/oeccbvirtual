import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/auth'
import { Container, PageHeader } from '../components/layout'
import { Button, Card, CardBody, Spinner } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Dashboard() {
  useDocumentMeta({ title: 'Dashboard' })
  const navigate = useNavigate()
  const { session } = useAuth()
  const [fullName, setFullName] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!session) return

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error cargando perfil:', error)
      } else if (!data) {
        setFullName(null) // no existe perfil todavía, pero no es un error fatal
      } else {
        setFullName(data.full_name)
      }
      setLoadingProfile(false)
    }

    loadProfile()
  }, [session])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        title="Dashboard"
        description="Área privada"
        actions={
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        }
      />
      <Card>
        <CardBody>
          {loadingProfile ? (
            <span className="flex items-center gap-2 text-on-surface-variant">
              <Spinner size="sm" label="" /> Cargando perfil...
            </span>
          ) : (
            <p>Bienvenido, {fullName ?? 'usuario sin nombre'}</p>
          )}
        </CardBody>
      </Card>
    </Container>
  )
}
