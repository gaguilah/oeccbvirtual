import { useId, useState } from 'react'
import QuestionField from '../../components/survey/questions/QuestionField'
import type { AnswerValue, SurveyQuestion } from '../../components/survey/types'

// Una pregunta tal como la ve el ciudadano en /encuesta (mismos componentes), sin enviar nada.
export default function QuestionPreview({ question, number }: { question: SurveyQuestion; number?: number }) {
  const [value, setValue] = useState<AnswerValue | undefined>(undefined)
  const titleId = useId()

  return (
    <div className="space-y-4 rounded-lg bg-surface-container-lowest p-5">
      <p id={titleId} className="font-display text-lg font-bold text-on-surface">
        {number !== undefined && `${number}. `}
        {question.text}
        {!question.is_required && <span className="ml-2 text-sm font-normal text-on-surface-variant">(opcional)</span>}
      </p>
      <QuestionField question={question} value={value} onChange={setValue} labelledBy={titleId} />
    </div>
  )
}
