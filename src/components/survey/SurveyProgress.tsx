type SurveyProgressProps = {
  current: number
  total: number
  label: string
}

// Barra de progreso: con muchas preguntas, una barra escala mejor que un indicador por paso.
export default function SurveyProgress({ current, total, label }: SurveyProgressProps) {
  const percent = Math.round(((current + 1) / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-on-surface">{label}</span>
        <span className="tabular-nums text-on-surface-variant">
          {current + 1} de {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Progreso de la encuesta"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={`Paso ${current + 1} de ${total}`}
        className="h-2 overflow-hidden rounded-full bg-surface-container"
      >
        <div
          className="h-full rounded-full bg-linear-135 from-primary to-primary-dim transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
