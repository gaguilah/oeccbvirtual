import { useAccess } from '../access'
import { ActionMenu } from '../ui'
import { hearingActionItems, type HearingAction } from './actions'
import type { Hearing } from './types'

type Props = {
  hearing: Hearing
  now: Date
  onAction: (action: HearingAction, hearing: Hearing) => void
  className?: string
}

export default function HearingActions({ hearing, now, onAction, className }: Props) {
  const { can } = useAccess()
  return (
    <ActionMenu
      label={`Opciones de la audiencia del radicado ${hearing.case_number}`}
      items={hearingActionItems(hearing, now, can, onAction)}
      className={className}
    />
  )
}
