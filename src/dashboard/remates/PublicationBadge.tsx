import { Badge } from '../../components/ui'

// Estado de un aviso en el dashboard: lo único que importa en la sección privada es si se ve en el
// sitio público (Agendado / Realizado es solo para el público).
export default function PublicationBadge({ published, className }: { published: boolean; className?: string }) {
  return published ? (
    <Badge variant="success" className={className}>
      Publicado
    </Badge>
  ) : (
    <Badge className={className}>Oculto</Badge>
  )
}
