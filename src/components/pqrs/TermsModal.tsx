import { Button, Modal } from '../ui'
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_TITLE } from './terms'

type TermsModalProps = {
  open: boolean
  onClose: () => void
  // "Acepto": marca la casilla y cierra.
  onAccept: () => void
}

// Texto de los términos (terms.ts) en un modal. El <dialog> hace scroll si el texto no cabe.
export default function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TERMS_TITLE}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onAccept}>Acepto los términos</Button>
        </>
      }
    >
      <div className="space-y-5 text-sm leading-relaxed text-on-surface-variant">
        <p>{TERMS_INTRO}</p>
        {TERMS_SECTIONS.map((section) => (
          <section key={section.title} className="space-y-2">
            <h3 className="font-sans text-base font-semibold text-on-surface">{section.title}</h3>
            {section.paragraphs?.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {section.items && (
              <ul className="list-disc space-y-1 pl-5">
                {section.items.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {section.after?.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
      </div>
    </Modal>
  )
}
