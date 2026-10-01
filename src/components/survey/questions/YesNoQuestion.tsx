import ChoiceOption from './ChoiceOption'
import type { QuestionProps } from './types'

const options = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
]

export default function YesNoQuestion({ question, value, onChange, labelledBy, describedBy, invalid }: QuestionProps<boolean>) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy} aria-required={question.is_required} className="grid max-w-md grid-cols-2 gap-3">
      {options.map((option) => (
        <ChoiceOption
          key={option.label}
          name={`question-${question.id}`}
          checked={value === option.value}
          onSelect={() => onChange(option.value)}
          invalid={invalid}
        >
          {option.label}
        </ChoiceOption>
      ))}
    </div>
  )
}
