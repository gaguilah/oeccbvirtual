import { useId } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, tabPanelProps } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import GuideView from './GuideView'
import { findGuide, GUIDE_PARAM, GUIDES } from './guides'
import type { GuideSlug } from './types'
import { useRolesMatrix } from './useRolesMatrix'

const tabs = GUIDES.map((item) => ({ id: item.slug, label: item.title }))

// Ayuda (/dashboard/ayuda, docs/plan-ayuda.md): una pestaña por guía, todas visibles para todos los
// usuarios. La pestaña abierta va en la URL (?guia=audiencias), así el botón Ayuda de la Topbar abre
// la de la sección actual y el botón Atrás del navegador vuelve a la anterior.
export default function HelpPage() {
  useDocumentMeta({ title: 'Ayuda · Dashboard', noindex: true })
  const [params, setParams] = useSearchParams()
  const guide = findGuide(params.get(GUIDE_PARAM))
  const roles = useRolesMatrix()
  const tabsId = useId()

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
        {/* Solo se monta la guía abierta (panels="active"). */}
        <Tabs items={tabs} value={guide.slug} onChange={open} label="Guías" idPrefix={tabsId} panels="active" />
      </div>
      <div {...tabPanelProps(tabsId, guide.slug)}>
        <GuideView key={guide.slug} guide={guide} roles={roles} />
      </div>
    </div>
  )
}
