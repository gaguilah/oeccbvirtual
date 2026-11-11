import { Fragment } from 'react'
import { cn } from '../../lib/cn'
import { inlineParts, parseAnswer } from './format'

function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineParts(text).map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-semibold text-on-surface">
            {part.text}
          </strong>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}

// Respuesta de una pregunta frecuente: párrafos, listas y negrita (format.ts), sin HTML. La usan la
// página pública y la vista previa del dashboard.
export default function FaqAnswer({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-3 text-on-surface-variant', className)}>
      {parseAnswer(text).map((block, index) =>
        block.type === 'list' ? (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-on-surface-variant/70">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className="break-words">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                <Inline text={line} />
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
