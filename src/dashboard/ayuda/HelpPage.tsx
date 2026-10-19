import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import GuideView from './GuideView'
import { findGuide, GUIDE_PARAM, GUIDES } from './guides'
import type { GuideSlug } from './types'
import { useRolesMatrix } from './useRolesMatrix'

// Ayuda (/dashboard/ayuda, docs/plan-ayuda.md): una pestaña por guía, todas visibles para todos los
// usuarios. La pestaña abierta va en la URL (?guia=audiencias), así el botón Ayuda de la Topbar abre
// la de la sección actual y el botón Atrás del navegador vuelve a la anterior.
export default function HelpPage() {
  useDocumentMeta({ title: 'Ayuda · Dashboard', noindex: true })
  const [params, setParams] = useSearchParams()
  const guide = findGuide(params.get(GUIDE_PARAM))
  const roles = useRolesMatrix()
  const activeTab = useRef<HTMLButtonElement>(null)

  // En celular la fila de pestañas se desplaza de lado: la abierta queda a la vista.
  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [guide.slug])

  function open(slug: GuideSlug) {
    if (slug === guide.slug) return
    setParams({ [GUIDE_PARAM]: slug })
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="max-w-3xl text-on-surface-variant">
          Guías de uso del dashboard para todos los funcionarios. Los permisos de cada rol pueden cambiar; las tablas
          "Quién puede hacer qué" muestran los de hoy.
        </p>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-x-6 whitespace-nowrap" role="group" aria-label="Guías">
            {GUIDES.map((item) => {
              const active = item.slug === guide.slug
              return (
                <button
                  key={item.slug}
                  ref={active ? activeTab : undefined}
                  type="button"
                  onClick={() => open(item.slug)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex min-h-10 items-center border-b-2 px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    active
                      ? 'border-primary font-semibold text-on-surface'
                      : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {item.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <GuideView key={guide.slug} guide={guide} roles={roles} />
    </div>
  )
}
