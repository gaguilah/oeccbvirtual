import ChoiceOption from './ChoiceOption'
import type { QuestionProps } from './types'

// Escala numérica (p. ej. 1 a 5) con etiquetas en los extremos.
export default function ScaleQuestion({ question, value, onChange, labelledBy, describedBy, invalid }: QuestionProps<number>) {
  const min = question.scale_min ?? 1
  const max = question.scale_max ?? 5
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  function srLabel(point: number) {
    if (point === min && question.min_label) return `${point}, ${question.min_label.toLowerCase()}`
    if (point === max && question.max_label) return `${point}, ${question.max_label.toLowerCase()}`
    return undefined
  }

  return (
    <div className="max-w-xl space-y-2">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-required={question.is_required}
        className="flex gap-2 sm:gap-3"
      >
        {points.map((point) => (
          <ChoiceOption
            key={point}
            name={`question-${question.id}`}
            checked={value === point}
            onSelect={() => onChange(point)}
            invalid={invalid}
            srLabel={srLabel(point)}
            className="flex-1 px-0 text-lg"
          >
            {point}
          </ChoiceOption>
        ))}
      </div>
      {(question.min_label || question.max_label) && (
        <div aria-hidden="true" className="flex justify-between text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          <span>{question.min_label}</span>
          <span>{question.max_label}</span>
        </div>
      )}
    </div>
  )
}
