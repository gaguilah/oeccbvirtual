import { useId, useState } from 'react'
import { cn } from '../../lib/cn'
import BarChart from './charts/BarChart'
import PieChart from './charts/PieChart'
import { questionTypeLabel } from './data'
import { formatAverage, formatCount, formatPercent, type QuestionResult } from './results'

// Colores de la torta (Sí / No): tokens, así funcionan en claro y oscuro.
const YES_NO_COLORS = ['fill-primary', 'fill-outline-variant']
const SWATCHES = ['bg-primary', 'bg-outline-variant']

type Props = { result: QuestionResult; number: number }

// Resultado de una pregunta: torta (sí / no) o barras (escala), con "Ver como tabla".
export default function QuestionResultCard({ result, number }: Props) {
  const { question, answered, values, average } = result
  const [asTable, setAsTable] = useState(false)
  const titleId = useId()
  const detail = (count: number) => `${formatCount(count)} (${formatPercent(count, answered)})`
  const summary = values.map((v) => `${v.label}: ${detail(v.count)}`).join('. ')

  return (
    <article aria-labelledby={titleId} className="flex flex-col gap-5 rounded-lg bg-surface-container-low p-5 sm:p-6">
      <header className="space-y-1">
        <h3 id={titleId} className="text-base font-bold">
          {number}. {question.text}
        </h3>
        <p className="text-xs text-on-surface-variant">
          {questionTypeLabel(question)} · {formatCount(answered)} {answered === 1 ? 'respuesta' : 'respuestas'}
          {!question.is_required && ' · opcional'}
        </p>
      </header>

      {answered === 0 ? (
        <p className="text-sm text-on-surface-variant">Nadie respondió esta pregunta en el periodo.</p>
      ) : asTable ? (
        <table className="w-full text-sm">
          <caption className="sr-only">{question.text}</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <th scope="col" className="py-2 pr-4 font-semibold">
                {question.type === 'scale' ? 'Valor' : 'Respuesta'}
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">
                Respuestas
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Porcentaje
              </th>
            </tr>
          </thead>
          <tbody>
            {values.map((v) => (
              <tr key={v.value} className="odd:bg-surface-container-lowest/60">
                <th scope="row" className="py-2 pr-4 pl-2 text-left font-medium">
                  {v.label}
                  {question.type === 'scale' && v.value === question.scale_max && question.max_label
                    ? ` (${question.max_label})`
                    : question.type === 'scale' && v.value === question.scale_min && question.min_label
                      ? ` (${question.min_label})`
                      : ''}
                </th>
                <td className="py-2 pr-4 text-right tabular-nums">{formatCount(v.count)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{formatPercent(v.count, answered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : question.type === 'yes_no' ? (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          <PieChart
            label={summary}
            slices={values.map((v, i) => ({ label: v.label, value: v.count, className: YES_NO_COLORS[i] }))}
          />
          <ul className="w-full space-y-2 sm:w-auto" aria-hidden="true">
            {values.map((v, i) => (
              <li key={v.value} className="flex items-center gap-3 text-sm">
                <span className={cn('size-3 shrink-0 rounded-full', SWATCHES[i])} />
                <span className="w-8 font-semibold text-on-surface">{v.label}</span>
                <span className="tabular-nums text-on-surface-variant">{detail(v.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <BarChart
            label={`${question.text}: respuestas por valor`}
            bars={values.map((v) => ({ label: v.label, count: v.count, detail: detail(v.count) }))}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span>
              {question.scale_min} = {question.min_label} · {question.scale_max} = {question.max_label}
            </span>
            {average !== null && (
              <span className="text-sm text-on-surface">
                Promedio: <strong>{formatAverage(average)}</strong> / {question.scale_max}
              </span>
            )}
          </div>
        </div>
      )}

      {answered > 0 && (
        <button
          type="button"
          onClick={() => setAsTable((value) => !value)}
          aria-pressed={asTable}
          className="mt-auto self-start text-sm font-medium text-primary hover:underline"
        >
          {asTable ? 'Ver como gráfico' : 'Ver como tabla'}
        </button>
      )}
    </article>
  )
}
