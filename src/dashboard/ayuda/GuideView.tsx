import { ButtonLink } from '../../components/ui'
import { useAccess } from '../access'
import { linkForPath } from '../navigation'
import { GUIDE_CONTENT } from './data'
import GuideBlocks, { type RolesState } from './GuideBlocks'
import { sectionAnchor } from './guides'
import RichText from './RichText'
import type { GuideMeta } from './types'

const FAQ_ID = 'preguntas'

function Contents({ guide, className }: { guide: GuideMeta; className?: string }) {
  const content = GUIDE_CONTENT[guide.slug]
  const entries = [
    ...content.sections.map((section) => ({ id: section.id, title: section.title })),
    ...(content.faq.length ? [{ id: FAQ_ID, title: 'Preguntas frecuentes' }] : []),
  ]
  return (
    <ul className={className}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${sectionAnchor(guide.slug, entry.id)}`}
            className="block rounded-md px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            {entry.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

// Una guía: índice (a la izquierda desde lg, plegable arriba en pantallas chicas), secciones y
// preguntas frecuentes plegables. "Ir a <sección>" solo si el usuario puede entrar.
export default function GuideView({ guide, roles }: { guide: GuideMeta; roles: RolesState }) {
  const content = GUIDE_CONTENT[guide.slug]
  const { can, mustChangePassword } = useAccess()
  // Primera sección de la guía que el usuario puede abrir (Administración explica cuatro).
  const target = mustChangePassword
    ? undefined
    : guide.paths.map((path) => linkForPath(path)).find((link) => link && (!link.permission || can(link.permission)))
  const canOpen = Boolean(target)

  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="En esta guía" className="hidden lg:block">
        <div className="sticky top-20 space-y-2">
          <p className="px-3 text-xs font-semibold tracking-widest text-on-surface-variant uppercase">En esta guía</p>
          <Contents guide={guide} />
        </div>
      </nav>

      <article className="max-w-3xl min-w-0 space-y-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-on-surface">{guide.title}</h2>
              <p className="text-on-surface-variant">{content.summary}</p>
            </div>
            {canOpen && target && (
              <ButtonLink to={target.to} variant="secondary" size="sm">
                Ir a {target.label}
              </ButtonLink>
            )}
          </div>
          <details className="rounded-lg bg-surface-container-low lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-on-surface">En esta guía</summary>
            <nav aria-label="En esta guía" className="px-1 pb-3">
              <Contents guide={guide} />
            </nav>
          </details>
        </header>

        {content.sections.map((section) => {
          const anchor = sectionAnchor(guide.slug, section.id)
          return (
            <section key={section.id} aria-labelledby={anchor} className="space-y-4">
              <h3 id={anchor} className="scroll-mt-24 text-lg font-bold text-on-surface">
                {section.title}
              </h3>
              <GuideBlocks blocks={section.blocks} modules={guide.modules} roles={roles} />
            </section>
          )
        })}

        {content.faq.length > 0 && (
          <section aria-labelledby={sectionAnchor(guide.slug, FAQ_ID)} className="space-y-4">
            <h3 id={sectionAnchor(guide.slug, FAQ_ID)} className="scroll-mt-24 text-lg font-bold text-on-surface">
              Preguntas frecuentes
            </h3>
            <div className="space-y-2">
              {content.faq.map((item) => (
                <details key={item.q} className="group rounded-lg bg-surface-container-low">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-lg px-4 py-3 font-medium text-on-surface focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
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
                  </summary>
                  <p className="px-4 pb-4 text-on-surface-variant">
                    <RichText text={item.a} />
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
