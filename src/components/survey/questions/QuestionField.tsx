import { Alert } from '../../ui'
import type { AnswerValue, SurveyQuestion } from '../types'
import ScaleQuestion from './ScaleQuestion'
import YesNoQuestion from './YesNoQuestion'

type QuestionFieldProps = {
  question: SurveyQuestion
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
  error?: string
  labelledBy: string
}

// Muestra el componente adecuado según `question.type`, con su ayuda y su error.
// Para un tipo nuevo: crear su componente en esta carpeta, añadirlo aquí y en validation.ts.
export default function QuestionField({ question, value, onChange, error, labelledBy }: QuestionFieldProps) {
  const helpId = `question-${question.id}-help`
  const errorId = `question-${question.id}-error`
  const describedBy = [question.help_text && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  const common = { question, labelledBy, describedBy, invalid: Boolean(error) }

  let field
  switch (question.type) {
    case 'yes_no':
      field = <YesNoQuestion {...common} value={typeof value === 'boolean' ? value : undefined} onChange={onChange} />
      break
    case 'scale':
      field = <ScaleQuestion {...common} value={typeof value === 'number' ? value : undefined} onChange={onChange} />
      break
    default:
      field = <Alert variant="warning">Este tipo de pregunta («{question.type}») aún no está soportado.</Alert>
  }

  return (
    <div className="space-y-4">
      {question.help_text && (
        <p id={helpId} className="text-sm text-on-surface-variant">
          {question.help_text}
        </p>
      )}
      {field}
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
