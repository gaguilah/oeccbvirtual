import { Link } from 'react-router-dom'
import { Alert } from '../ui'
import { findTutorial, tutorialPath } from './data'

type TutorialSummaryProps = {
  text: string
  // Slug del tutorial recomendado a continuación.
  next?: string
  className?: string
}

// Retroalimentación al terminar el tutorial, con el siguiente paso recomendado si lo hay.
export default function TutorialSummary({ text, next, className }: TutorialSummaryProps) {
  const nextTutorial = next ? findTutorial(next) : undefined

  return (
    <Alert
      variant="success"
      live={false}
      title="¡Felicidades!"
      className={className}
      icon={
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      }
    >
      <p>{text}</p>
      {nextTutorial && (
        <p className="mt-2">
          Siguiente paso recomendado:{' '}
          <Link
            to={tutorialPath(nextTutorial.slug)}
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            {nextTutorial.title}
          </Link>
        </p>
      )}
    </Alert>
  )
}
