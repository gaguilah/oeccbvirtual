import { Link } from 'react-router-dom'
import { ButtonLink, EmptyState } from '../../components/ui'
import { Icon, icons } from '../ui'
import { SURVEYS_PATH } from './data'

export function BackLink() {
  return (
    <Link to={SURVEYS_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
      ← Volver a Encuestas
    </Link>
  )
}

// Id inventado, mal copiado o de una encuesta eliminada: aviso claro y el camino de vuelta.
export default function SurveyNotFound() {
  return (
    <div className="space-y-4">
      <BackLink />
      <EmptyState
        icon={<Icon paths={icons.question} />}
        title="Esta encuesta no existe"
        description="Revise el enlace o búsquela en la lista de encuestas."
        action={
          <ButtonLink to={SURVEYS_PATH} variant="secondary">
            Volver a Encuestas
          </ButtonLink>
        }
      />
    </div>
  )
}
