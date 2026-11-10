import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { FaqAnswer, faqImageSrc, questionAnchor, questionIdFromHash, useFaq, type FaqGroup } from '../components/faq'
import { Container, PageHeader } from '../components/layout'
import TutorialImage from '../components/tutorials/TutorialImage'
import { Alert, EmptyState, Spinner } from '../components/ui'
import { CONTACT_EMAIL } from '../lib/contact'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const indexLinkClass =
  'block rounded-md px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary'

function SectionIndex({ groups }: { groups: FaqGroup[] }) {
  return (
    <ul>
      {groups.map(({ section }) => (
        <li key={section.id}>
          <a href={`#${section.slug}`} className={indexLinkClass}>
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

function Chevron() {
  return (
    <svg
      className="mt-0.5 size-5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// Preguntas frecuentes (docs/plan-preguntas-frecuentes.md): solo preguntas y respuestas, por
// secciones, administradas en el dashboard. Índice a la izquierda desde lg y plegable arriba en
// pantallas más chicas, como la Ayuda. Cada sección y cada pregunta tienen su ancla; al abrir el
// enlace de una pregunta, aparece desplegada.
export default function PreguntasFrecuentes() {
  useDocumentMeta({ title: 'Preguntas frecuentes' })
  const { groups, error } = useFaq()
  const { hash } = useLocation()
  const openId = useMemo(() => questionIdFromHash(hash), [hash])

  // El contenido llega después de cargar la página: el navegador no alcanza a bajar al ancla solo.
  useEffect(() => {
    if (!groups || !hash) return
    const id = decodeURIComponent(hash.slice(1))
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [groups, hash])

  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        title="Preguntas frecuentes"
        description="Respuestas a las consultas más comunes que recibe la oficina."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Preguntas frecuentes' }]}
        className="pb-0"
      />

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !groups ? (
        <div className="flex justify-center py-16 text-primary">
          <Spinner />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState title="Todavía no hay preguntas publicadas" description="Vuelva a consultar más adelante." />
      ) : (
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Secciones" className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="px-3 text-xs font-semibold tracking-widest text-on-surface-variant uppercase">Secciones</p>
              <SectionIndex groups={groups} />
            </div>
          </nav>

          <div className="max-w-3xl min-w-0 space-y-10">
            <div className="space-y-4">
              <p className="text-on-surface-variant">
                Las solicitudes se envían al correo{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium break-all text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . Escriba siempre el <strong className="font-semibold text-on-surface">radicado completo</strong>, con
                sus 23 dígitos: sin él no es posible ubicar el proceso.
              </p>
              <details className="rounded-lg bg-surface-container-low lg:hidden">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-on-surface">Secciones</summary>
                <nav aria-label="Secciones" className="px-1 pb-3">
                  <SectionIndex groups={groups} />
                </nav>
              </details>
            </div>

            {groups.map(({ section, questions }) => (
              <section key={section.id} aria-labelledby={section.slug} className="space-y-4">
                <h2 id={section.slug} className="scroll-mt-24 text-2xl font-bold text-on-surface">
                  {section.title}
                </h2>
                <div className="space-y-2">
                  {questions.map((item) => (
                    <details
                      key={item.id}
                      id={questionAnchor(item.id)}
                      open={item.id === openId || undefined}
                      className="group scroll-mt-24 rounded-lg bg-surface-container-low"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-lg px-4 py-3 font-medium text-on-surface focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                        <span>{item.question}</span>
                        <Chevron />
                      </summary>
                      <div className="space-y-4 px-4 pb-4">
                        <FaqAnswer text={item.answer} />
                        {/* Imagen de apoyo: al tocarla se abre ampliada (mismo componente que Tutoriales). */}
                        {item.image_path && item.image_alt && (
                          <TutorialImage
                            src={faqImageSrc(item.image_path)}
                            alt={item.image_alt}
                            className="bg-surface-container"
                          />
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
